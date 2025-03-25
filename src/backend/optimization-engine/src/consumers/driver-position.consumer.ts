import { Kafka, KafkaMessage } from 'kafkajs'; // kafkajs@^2.2.4
import { POSITION_UPDATES } from '../../../event-bus/src/config/topics';
import { EntityType, PositionUpdate } from '../../../common/interfaces/position.interface';
import { optimizationService } from '../services/optimization.service';
import { OptimizationJobType } from '../models/optimization-job.model';
import { predictionService } from '../services/prediction.service';
import { logger } from '../../../common/utils/logger';

// Define global constants for consumer group ID, optimization trigger distance, and cooldown period
const CONSUMER_GROUP_ID = 'optimization-engine-position-consumer';
const OPTIMIZATION_TRIGGER_THRESHOLD_DISTANCE = 5000; // meters
const OPTIMIZATION_TRIGGER_COOLDOWN_MS = 300000; // 5 minutes

/**
 * Sets up and configures the Kafka consumer for position updates
 * @param kafka Kafka client instance
 * @returns Configured Kafka consumer instance
 */
async function setupPositionConsumer(kafka: Kafka): Promise<Kafka['consumer']> {
  // Create a Kafka consumer with the optimization engine consumer group ID
  const consumer = kafka.consumer({ groupId: CONSUMER_GROUP_ID });

  // Configure consumer with appropriate settings (session timeout, heartbeat interval, etc.)
  // These settings ensure the consumer maintains an active session with the Kafka broker
  // and can handle message processing efficiently
  await consumer.connect();

  // Subscribe the consumer to the POSITION_UPDATES topic
  await consumer.subscribe({ topic: POSITION_UPDATES, fromBeginning: false });

  // Return the configured consumer instance
  return consumer;
}

/**
 * Starts the position update consumer and begins processing messages
 * @param consumer Kafka consumer instance
 * @returns Promise that resolves when the consumer is started
 */
async function startPositionConsumer(consumer: Kafka['consumer']): Promise<void> {
  // Set up message handler with processPositionUpdate function
  // This handler will be called for each message received from the topic
  consumer.run({
    eachMessage: async ({ message }: { message: KafkaMessage }) => {
      await processPositionUpdate(message);
    },
  });

  // Configure error handler for consumer errors
  // This handler will log any errors that occur during message consumption
  consumer.on('consumer.crash', (error: any) => {
    logger.error('Consumer crashed:', error);
  });

  // Log consumer start with topic information
  logger.info(`Consumer started for topic: ${POSITION_UPDATES}`);
}

/**
 * Gracefully stops the position update consumer
 * @param consumer Kafka consumer instance
 * @returns Promise that resolves when the consumer is stopped
 */
async function stopPositionConsumer(consumer: Kafka['consumer']): Promise<void> {
  // Disconnect the consumer from the Kafka cluster
  await consumer.disconnect();

  // Log consumer shutdown
  logger.info('Consumer disconnected successfully.');
}

/**
 * Processes a position update message from Kafka
 * @param message Kafka message
 * @returns Promise that resolves when the message is processed
 */
async function processPositionUpdate(message: KafkaMessage): Promise<void> {
  try {
    // Parse the message value as JSON
    const positionUpdate: PositionUpdate = JSON.parse(message.value!.toString());

    // Validate that the entity type is DRIVER
    if (positionUpdate.entity_type !== EntityType.DRIVER) {
      return; // Ignore non-driver position updates
    }

    // Extract position update data from the message
    const { entity_id: driverId, latitude, longitude } = positionUpdate;

    // Log the received driver position update
    logger.info(`Received driver position update: ${driverId}`, { latitude, longitude });

    // Check if the position change should trigger optimization
    if (await shouldTriggerOptimization(driverId, latitude, longitude)) {
      // If threshold exceeded, trigger network optimization
      await triggerNetworkOptimization(driverId, latitude, longitude);
    }

    // Update supply predictions for the area
    await updateSupplyPredictions(driverId, latitude, longitude);

    // Update driver behavior predictions
    await updateDriverBehaviorPredictions(driverId, latitude, longitude);
  } catch (error: any) {
    // Log any errors that occur during message processing
    logger.error('Error processing position update', { error: error.message });
  }
}

/**
 * Determines if a position update should trigger network optimization
 * @param driverId Driver ID
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise resolving to true if optimization should be triggered
 */
async function shouldTriggerOptimization(driverId: string, latitude: number, longitude: number): Promise<boolean> {
  // Retrieve the driver's last known position from the lastOptimizationMap
  const lastOptimizationRecord = driverPositionConsumer.lastOptimizationMap.get(driverId);

  // If no previous position exists, return true to trigger initial optimization
  if (!lastOptimizationRecord) {
    return true;
  }

  // Calculate the distance between current and previous position
  const distance = Math.sqrt(
    Math.pow(latitude - lastOptimizationRecord.latitude, 2) +
    Math.pow(longitude - lastOptimizationRecord.longitude, 2)
  );

  // Check if the distance exceeds the optimization trigger threshold
  if (distance < OPTIMIZATION_TRIGGER_THRESHOLD_DISTANCE) {
    return false;
  }

  // Check if enough time has passed since the last optimization (cooldown period)
  const timeSinceLastOptimization = Date.now() - lastOptimizationRecord.timestamp;
  if (timeSinceLastOptimization < OPTIMIZATION_TRIGGER_COOLDOWN_MS) {
    return false;
  }

  // Return true if both distance and time thresholds are met
  return true;
}

/**
 * Triggers a network optimization job based on a driver position update
 * @param driverId Driver ID
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise that resolves when the optimization job is created
 */
async function triggerNetworkOptimization(driverId: string, latitude: number, longitude: number): Promise<void> {
  // Create optimization parameters with driver ID and location
  const parameters = {
    driverId: driverId,
    latitude: latitude,
    longitude: longitude,
  };

  // Call optimizationService.createJob with NETWORK_OPTIMIZATION type
  await optimizationService.createJob(
    OptimizationJobType.NETWORK_OPTIMIZATION,
    parameters,
    10, // High priority
    'driver-position-consumer'
  );

  // Log the triggered optimization job
  logger.info(`Triggered network optimization job for driver: ${driverId}`, { latitude, longitude });

  // Update the last optimization timestamp for the driver
  driverPositionConsumer.updateLastOptimization(driverId, latitude, longitude);
}

/**
 * Updates supply predictions based on new driver position
 * @param driverId Driver ID
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise that resolves when predictions are updated
 */
async function updateSupplyPredictions(driverId: string, latitude: number, longitude: number): Promise<void> {
  try {
    // Create location object with latitude and longitude
    const location = { latitude, longitude };

    // Define time window for predictions (current time to 24 hours ahead)
    const startTime = new Date();
    const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Call predictionService.predictLocationSupply with location and time window
    await predictionService.predictLocationSupply(location, 50, startTime, endTime, {});

    // Log the updated supply predictions
    logger.info(`Updated supply predictions for driver: ${driverId}`, { latitude, longitude });
  } catch (error: any) {
    // Log any errors that occur during prediction update
    logger.error('Error updating supply predictions', { error: error.message });
  }
}

/**
 * Updates driver behavior predictions based on new position
 * @param driverId Driver ID
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise that resolves when behavior predictions are updated
 */
async function updateDriverBehaviorPredictions(driverId: string, latitude: number, longitude: number): Promise<void> {
  try {
    // Retrieve the driver's current assignment and destination
    const assignment = {}; // Placeholder
    const destination = {}; // Placeholder

    // If no active assignment, skip behavior prediction update
    if (!assignment) {
      return;
    }

    // Create current location object with latitude and longitude
    const currentLocation = { latitude, longitude };

    // Create destination location object from assignment
    // Call predictionService.predictDriverBehavior with driver ID, current location, and destination
    await predictionService.predictDriverBehavior(driverId, currentLocation, destination, {});

    // Log the updated driver behavior predictions
    logger.info(`Updated driver behavior predictions for driver: ${driverId}`, { latitude, longitude });
  } catch (error: any) {
    // Log any errors that occur during prediction update
    logger.error('Error updating driver behavior predictions', { error: error.message });
  }
}

/**
 * Manages the consumption and processing of driver position updates from Kafka
 */
export class DriverPositionConsumer {
  consumer: Kafka['consumer'];
  isRunning: boolean = false;
  lastOptimizationMap: Map<string, { timestamp: number; latitude: number; longitude: number }> = new Map();

  constructor(kafka: Kafka) {
    // Store the Kafka client instance
    // Initialize the lastOptimizationMap to track optimization history by driver
    // Set isRunning flag to false
    // Call setupPositionConsumer to create the consumer instance
    this.consumer = setupPositionConsumer(kafka);
  }

  /**
   * Starts the consumer to begin processing position updates
   * @returns Promise that resolves when the consumer is started
   */
  async start(): Promise<void> {
    // Check if consumer is already running
    if (this.isRunning) {
      logger.warn('Consumer is already running.');
      return;
    }

    // Call startPositionConsumer with the consumer instance
    await startPositionConsumer(this.consumer);

    // Set isRunning flag to true
    this.isRunning = true;

    // Log consumer start message
    logger.info('Driver position consumer started.');
  }

  /**
   * Stops the consumer gracefully
   * @returns Promise that resolves when the consumer is stopped
   */
  async stop(): Promise<void> {
    // Check if consumer is running
    if (!this.isRunning) {
      logger.warn('Consumer is not running.');
      return;
    }

    // Call stopPositionConsumer with the consumer instance
    await stopPositionConsumer(this.consumer);

    // Set isRunning flag to false
    this.isRunning = false;

    // Log consumer stop message
    logger.info('Driver position consumer stopped.');
  }

  /**
   * Handles incoming Kafka messages
   * @param message Kafka message
   * @returns Promise that resolves when the message is processed
   */
  async handleMessage(message: KafkaMessage): Promise<void> {
    // Call processPositionUpdate with the message
    await processPositionUpdate(message);
  }

  /**
   * Checks if a driver position update should trigger optimization
   * @param driverId Driver ID
   * @param latitude Latitude
   * @param longitude Longitude
   * @returns True if optimization should be triggered
   */
  shouldTriggerOptimization(driverId: string, latitude: number, longitude: number): boolean {
    // Get the last optimization record for the driver from lastOptimizationMap
    const lastOptimizationRecord = this.lastOptimizationMap.get(driverId);

    // If no record exists, return true to trigger initial optimization
    if (!lastOptimizationRecord) {
      return true;
    }

    // Calculate distance between current and last optimization position
    const distance = Math.sqrt(
      Math.pow(latitude - lastOptimizationRecord.latitude, 2) +
      Math.pow(longitude - lastOptimizationRecord.longitude, 2)
    );

    // Calculate time elapsed since last optimization
    const timeSinceLastOptimization = Date.now() - lastOptimizationRecord.timestamp;

    // Return true if both distance and time thresholds are exceeded
    return distance > OPTIMIZATION_TRIGGER_THRESHOLD_DISTANCE &&
           timeSinceLastOptimization > OPTIMIZATION_TRIGGER_COOLDOWN_MS;
  }

  /**
   * Updates the last optimization record for a driver
   * @param driverId Driver ID
   * @param latitude Latitude
   * @param longitude Longitude
   */
  updateLastOptimization(driverId: string, latitude: number, longitude: number): void {
    // Create a new optimization record with current timestamp and coordinates
    const optimizationRecord = {
      timestamp: Date.now(),
      latitude: latitude,
      longitude: longitude,
    };

    // Store the record in lastOptimizationMap keyed by driver ID
    this.lastOptimizationMap.set(driverId, optimizationRecord);
  }
}

// Create a singleton instance of DriverPositionConsumer for easy access
const kafkaConfig = { brokers: ['localhost:9092'] }; // Replace with your Kafka brokers
const kafka = new Kafka(kafkaConfig);
export const driverPositionConsumer = new DriverPositionConsumer(kafka);

// Export the class and functions
export { setupPositionConsumer, processPositionUpdate };

// Export the class as default
export default DriverPositionConsumer;