import { KafkaConsumer } from 'kafkajs'; // kafkajs@^2.2.0
import { 
  EventConsumer,
  DriverEvent,
  DriverAvailability,
  Event
} from '../../../common/interfaces/event.interface';
import { DriverStatus } from '../../../common/interfaces/driver.interface';
import { EventTypes } from '../../../common/constants/event-types';
import { MatchingService } from '../services/matching.service';
import logger from '../../../common/utils/logger';
import { ConsumerGroups } from '../../../event-bus/src/config/consumer-groups';
import { Topics } from '../../../event-bus/src/config/topics';

/**
 * Kafka consumer that processes driver availability events to trigger load matching recommendations
 */
export class DriverAvailabilityConsumer implements EventConsumer {
  private readonly consumerGroupId: string = ConsumerGroups.DRIVER_AVAILABILITY_CONSUMER;
  private readonly topic: string = Topics.DRIVER_EVENTS;
  private kafkaConsumer: KafkaConsumer;
  private matchingService: MatchingService;

  /**
   * Creates a new DriverAvailabilityConsumer instance
   * @param kafkaConsumer 
   * @param matchingService 
   */
  constructor(kafkaConsumer: KafkaConsumer, matchingService: MatchingService) {
    // Initialize the consumer group ID to ConsumerGroups.DRIVER_AVAILABILITY_CONSUMER
    this.consumerGroupId = ConsumerGroups.DRIVER_AVAILABILITY_CONSUMER;
    // Initialize the topic to Topics.DRIVER_EVENTS
    this.topic = Topics.DRIVER_EVENTS;
    // Store the provided Kafka consumer instance
    this.kafkaConsumer = kafkaConsumer;
    // Store the provided matching service instance
    this.matchingService = matchingService;
  }

  /**
   * Starts the Kafka consumer to listen for driver availability events
   * @returns Promise that resolves when the consumer is started
   */
  async start(): Promise<void> {
    // Log that the consumer is starting
    logger.info('Starting DriverAvailabilityConsumer...');

    // Subscribe to the DRIVER_EVENTS topic with the DRIVER_AVAILABILITY_CONSUMER group
    await this.kafkaConsumer.subscribe({ topic: this.topic, fromBeginning: false });

    // Configure the consumer to process messages in batches
    await this.kafkaConsumer.run({
      eachMessage: async ({ message }) => {
        // Set up the message handler to call consumeEvent for each message
        await this.handleMessage(message);
      },
    });

    // Start the Kafka consumer
    logger.info('DriverAvailabilityConsumer started successfully.');
  }

  /**
   * Stops the Kafka consumer
   * @returns Promise that resolves when the consumer is stopped
   */
  async stop(): Promise<void> {
    // Log that the consumer is stopping
    logger.info('Stopping DriverAvailabilityConsumer...');

    // Disconnect the Kafka consumer
    await this.kafkaConsumer.disconnect();

    // Log that the consumer has stopped successfully
    logger.info('DriverAvailabilityConsumer stopped successfully.');
  }

  /**
   * Processes a driver availability event
   * @param event 
   * @returns Promise that resolves when the event is processed
   */
  async consumeEvent(event: DriverEvent): Promise<void> {
    // Log that a driver event was received
    logger.info(`Received driver event: ${event.metadata.event_id}`);

    // Check if the event type is DRIVER_AVAILABILITY_CHANGED
    if (event.metadata.event_type !== EventTypes.DRIVER_AVAILABILITY_CHANGED) {
      // If not the correct event type, log and return early
      logger.debug(`Skipping event ${event.metadata.event_id} - incorrect event type.`);
      return;
    }

    // Extract driver availability data from the event payload
    const availability: DriverAvailability = event.payload as DriverAvailability;

    // Check if the driver status is AVAILABLE
    if (availability.status !== DriverStatus.AVAILABLE) {
      // If not AVAILABLE, log and return early
      logger.debug(`Driver ${availability.driver_id} is not AVAILABLE, skipping.`);
      return;
    }

    // Log that a driver has become available
    logger.info(`Driver ${availability.driver_id} has become AVAILABLE.`);

    try {
      // Prepare match recommendation parameters from the driver availability data
      const params = {
        driver_id: availability.driver_id,
        current_location: availability.current_location,
        available_hours: availability.driving_minutes_remaining / 60, // Convert minutes to hours
        equipment_type: 'Dry Van', // TODO: Get equipment type from driver profile
        max_distance: 200, // TODO: Get max distance from driver preferences
        min_rate: 2.50, // TODO: Get min rate from driver preferences
        preferred_regions: ['Midwest'], // TODO: Get preferred regions from driver preferences
        limit: 10, // TODO: Make limit configurable
      };

      // Call matchingService.generateMatchRecommendations with the parameters
      const recommendations = await this.matchingService.generateMatchRecommendations(params);

      // Log the number of recommendations generated
      logger.info(`Generated ${recommendations.length} recommendations for driver ${availability.driver_id}.`);
    } catch (error: any) {
      // If an error occurs, log the error details
      logger.error(`Error generating recommendations for driver ${availability.driver_id}:`, error);
    }
  }

  /**
   * Handles a raw Kafka message and converts it to an event
   * @param message 
   * @returns Promise that resolves when the message is handled
   */
  async handleMessage(message: any): Promise<void> {
    try {
      // Parse the message value as JSON
      const event = JSON.parse(message.value.toString()) as DriverEvent;

      // Convert the parsed data to a DriverEvent
      const driverEvent: DriverEvent = {
        metadata: event.metadata,
        payload: event.payload,
      };

      // Call consumeEvent with the converted event
      await this.consumeEvent(driverEvent);
    } catch (error: any) {
      // If an error occurs, log the error details
      logger.error('Error handling Kafka message:', error);
    }
  }
}