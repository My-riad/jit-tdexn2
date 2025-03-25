import { Kafka, Consumer, EachMessagePayload } from 'kafkajs'; // kafkajs@^2.2.4
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0

import {
  EntityType,
  PositionUpdate,
  PositionSource,
} from '../../../common/interfaces/position.interface';
import { Driver } from '../../../common/interfaces/driver.interface';
import { DriverService } from '../services/driver.service';
import { DriverEventsProducer } from '../producers/driver-events.producer';
import { EventTypes } from '../../../common/constants/event-types';
import { POSITION_UPDATES } from '../../../event-bus/src/config/topics';
import { getKafkaConfig, getConsumerConfig } from '../../../common/config/kafka.config';
import logger from '../../../common/utils/logger';

/**
 * Kafka consumer for processing driver location updates from the position updates topic
 */
export class LocationUpdatesConsumer {
  private readonly serviceName: string = 'LocationUpdatesConsumer';
  private kafka: Kafka;
  private consumer: Consumer;
  private driverService: DriverService;
  private eventsProducer: DriverEventsProducer;
  private isConnected: boolean = false;
  private isRunning: boolean = false;

  /**
   * Creates a new LocationUpdatesConsumer instance
   */
  constructor() {
    // Initialize the service name
    this.serviceName = 'LocationUpdatesConsumer';
    
    // Set isConnected and isRunning flags to false
    this.isConnected = false;
    this.isRunning = false;

    // Create a new Kafka client instance using getKafkaConfig()
    this.kafka = new Kafka(getKafkaConfig());

    // Create a new Consumer instance using getConsumerConfig() with a consumer group ID
    this.consumer = this.kafka.consumer(getConsumerConfig('driver-location-updates'));

    // Create a new DriverService instance for updating driver locations
    this.driverService = new DriverService(new DriverEventsProducer(new KafkaService(null as any))); // TODO: Fix this

    // Create a new DriverEventsProducer instance for publishing driver location events
    this.eventsProducer = new DriverEventsProducer(new KafkaService(null as any)); // TODO: Fix this

    // Log initialization of the location updates consumer
    logger.info('Location updates consumer initialized.');
  }

  /**
   * Connects to the Kafka broker and subscribes to the position updates topic
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    try {
      // Connect to the Kafka broker
      await this.consumer.connect();

      // Subscribe to the POSITION_UPDATES topic
      await this.consumer.subscribe({ topic: POSITION_UPDATES, fromBeginning: false });

      // Set isConnected flag to true
      this.isConnected = true;

      // Log successful connection to Kafka
      logger.info(`Connected to Kafka and subscribed to topic: ${POSITION_UPDATES}`);
    } catch (error: any) {
      // Handle connection errors and log them
      logger.error('Failed to connect to Kafka', { error: error.message });
      throw error;
    }
  }

  /**
   * Disconnects from the Kafka broker
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      // Disconnect the consumer from Kafka
      await this.consumer.disconnect();

      // Set isConnected and isRunning flags to false
      this.isConnected = false;
      this.isRunning = false;

      // Log successful disconnection from Kafka
      logger.info('Disconnected from Kafka.');
    } catch (error: any) {
      // Handle disconnection errors and log them
      logger.error('Failed to disconnect from Kafka', { error: error.message });
      throw error;
    }
  }

  /**
   * Starts consuming messages from the position updates topic
   * @returns Promise that resolves when the consumer is started
   */
  async start(): Promise<void> {
    try {
      // Check if the consumer is connected, connect if not
      if (!this.isConnected) {
        await this.connect();
      }

      // Set up message handler using the processMessage method
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.processMessage(payload);
        },
      });

      // Set isRunning flag to true
      this.isRunning = true;

      // Log that the consumer has started
      logger.info('Location updates consumer started.');
    } catch (error: any) {
      // Handle startup errors and log them
      logger.error('Failed to start location updates consumer', { error: error.message });
      throw error;
    }
  }

  /**
   * Stops consuming messages
   * @returns Promise that resolves when the consumer is stopped
   */
  async stop(): Promise<void> {
    try {
      // Stop the consumer
      await this.consumer.stop();

      // Set isRunning flag to false
      this.isRunning = false;

      // Log that the consumer has stopped
      logger.info('Location updates consumer stopped.');
    } catch (error: any) {
      // Handle stop errors and log them
      logger.error('Failed to stop location updates consumer', { error: error.message });
      throw error;
    }
  }

  /**
   * Processes a message from the position updates topic
   * @param payload The message payload
   * @returns Promise that resolves when the message is processed
   */
  async processMessage(payload: EachMessagePayload): Promise<void> {
    try {
      // Extract message value and parse as JSON
      const messageValue = payload.message.value?.toString();
      if (!messageValue) {
        logger.warn('Received empty message, skipping processing.');
        return;
      }
      const message = JSON.parse(messageValue);

      // Check if the message is a position update event (POSITION_UPDATED)
      if (message.metadata?.event_type === EventTypes.POSITION_UPDATED) {
        // Check if the entity type is DRIVER
        if (message.payload?.entity_type === EntityType.DRIVER) {
          // Extract driver ID and position data from the message
          const driverId = message.payload.entity_id;
          const location = {
            latitude: message.payload.latitude,
            longitude: message.payload.longitude,
          };

          // Call driverService.updateDriverLocation to update the driver's location
          await this.driverService.updateDriverLocation(driverId, location);

          // Generate a correlation ID for event tracking
          const correlationId = uuidv4();

          // Call eventsProducer.produceDriverLocationUpdatedEvent to publish a driver location updated event
          await this.eventsProducer.produceDriverLocationUpdatedEvent(driverId, location);

          // Log successful processing of the location update
          logger.info(`Successfully processed location update for driver ${driverId}`, { correlationId });
        }
      }
    } catch (error: any) {
      // Handle processing errors and log them
      logger.error('Error processing location update message', { error: error.message });
      throw error;
    }
  }

  /**
   * Checks if the consumer is running
   * @returns True if the consumer is running, false otherwise
   */
  isConsumerRunning(): boolean {
    return this.isRunning;
  }
}