import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { Kafka, Consumer } from 'kafkajs'; // kafkajs@2.0.0
import {
  getKafkaConfig,
  getConsumerConfig,
} from '../../../common/config/kafka.config';
import { EventTypes } from '../../../common/constants/event-types';
import { Event, DriverHOS } from '../../../common/interfaces/event.interface';
import { HOSService } from '../services/hos.service';
import { DriverEventsProducer } from '../producers/driver-events.producer';
import logger from '../../../common/utils/logger';

/**
 * Kafka consumer for processing ELD updates from various providers
 */
export class EldUpdatesConsumer {
  private readonly serviceName: string = 'EldUpdatesConsumer';
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly eldTopic: string = 'eld-events';
  private readonly hosService: HOSService;
  private readonly eventsProducer: DriverEventsProducer;
  private isConnected: boolean = false;

  /**
   * Creates a new EldUpdatesConsumer instance
   * @param hosService The HOS service for updating driver HOS data
   * @param eventsProducer The events producer for emitting driver HOS update events
   */
  constructor(hosService: HOSService, eventsProducer: DriverEventsProducer) {
    // Initialize the service name
    this.serviceName = 'EldUpdatesConsumer';

    // Set the ELD topic name
    this.eldTopic = 'eld-events';

    // Store the provided HOS service instance
    this.hosService = hosService;

    // Store the provided events producer instance
    this.eventsProducer = eventsProducer;

    // Initialize isConnected to false
    this.isConnected = false;

    // Create a new Kafka instance using getKafkaConfig()
    this.kafka = new Kafka(getKafkaConfig());

    // Create a new Consumer instance using getConsumerConfig('eld-consumer-group')
    this.consumer = this.kafka.consumer(getConsumerConfig('eld-consumer-group'));
  }

  /**
   * Connects to the Kafka broker and subscribes to the ELD topic
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    // Log that the consumer is connecting to Kafka
    logger.info('Connecting EldUpdatesConsumer to Kafka...');

    try {
      // Try to connect the consumer to Kafka
      await this.consumer.connect();

      // Subscribe to the ELD topic
      await this.consumer.subscribe({ topic: this.eldTopic });

      // Set up the message handler to process ELD updates
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          await this.processMessage(message);
        },
      });

      // Set isConnected to true if successful
      this.isConnected = true;

      // Log successful connection
      logger.info('EldUpdatesConsumer connected to Kafka and subscribed to topic.');
    } catch (error) {
      // Catch and log any connection errors
      logger.error('Failed to connect EldUpdatesConsumer to Kafka', { error });
      throw error;
    }
  }

  /**
   * Disconnects from the Kafka broker
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    // Log that the consumer is disconnecting from Kafka
    logger.info('Disconnecting EldUpdatesConsumer from Kafka...');

    try {
      // Try to disconnect the consumer from Kafka
      await this.consumer.disconnect();

      // Set isConnected to false if successful
      this.isConnected = false;

      // Log successful disconnection
      logger.info('EldUpdatesConsumer disconnected from Kafka.');
    } catch (error) {
      // Catch and log any disconnection errors
      logger.error('Failed to disconnect EldUpdatesConsumer from Kafka', { error });
      throw error;
    }
  }

  /**
   * Starts consuming messages from the ELD topic
   * @returns Promise that resolves when the consumer has started
   */
  async start(): Promise<void> {
    // Check if the consumer is connected, connect if not
    if (!this.isConnected) {
      await this.connect();
    }

    // Log that the consumer is starting to consume messages
    logger.info('Starting EldUpdatesConsumer...');

    try {
      // Start consuming messages from the ELD topic
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          await this.processMessage(message);
        },
      });
    } catch (error) {
      // Catch and log any consumption errors
      logger.error('EldUpdatesConsumer failed to start consuming messages', { error });
      throw error;
    }
  }

  /**
   * Stops consuming messages and disconnects
   * @returns Promise that resolves when the consumer has stopped
   */
  async stop(): Promise<void> {
    // Log that the consumer is stopping
    logger.info('Stopping EldUpdatesConsumer...');

    try {
      // Stop consuming messages
      await this.consumer.stop();

      // Disconnect from Kafka
      await this.disconnect();
    } catch (error) {
      // Catch and log any errors during shutdown
      logger.error('EldUpdatesConsumer failed to stop', { error });
      throw error;
    }
  }

  /**
   * Processes an incoming ELD update message
   * @param message The Kafka message
   * @returns Promise that resolves when the message is processed
   */
  async processMessage(message: any): Promise<void> {
    try {
      // Parse the message value as JSON
      const event: Event = JSON.parse(message.value.toString());

      // Validate that the message is an ELD_DATA_RECEIVED event
      if (!this.validateEldEvent(event)) {
        logger.warn('Received invalid ELD event, skipping processing.', { event });
        return;
      }

      // Extract the driver ID and HOS data from the event payload
      const driverId = event.payload.driver_id;
      const hosData = event.payload.hos_data;

      // Log the received ELD update
      logger.info(`Received ELD update for driver: ${driverId}`, { driverId, hosData });

      // Call the HOS service to update the driver's HOS data
      await this.hosService.updateDriverHOS(driverId, hosData);

      // Produce a driver HOS updated event to notify other services
      this.eventsProducer.produceDriverHOSUpdatedEvent(driverId, hosData.status, hosData);
    } catch (error) {
      // Catch and log any processing errors
      logger.error('Error processing ELD update message', { error });
      throw error;
    }
  }

  /**
   * Validates that an event is a properly formatted ELD update event
   * @param event The event to validate
   * @returns True if the event is valid, false otherwise
   */
  validateEldEvent(event: Event): boolean {
    // Check that the event has metadata
    if (!event.metadata) {
      logger.warn('ELD event missing metadata');
      return false;
    }

    // Verify that the event type is ELD_DATA_RECEIVED
    if (event.metadata.event_type !== EventTypes.ELD_DATA_RECEIVED) {
      logger.warn(`Invalid event type: ${event.metadata.event_type}`);
      return false;
    }

    // Ensure the event has a payload with driver_id and hos_data
    if (!event.payload || !event.payload.driver_id || !event.payload.hos_data) {
      logger.warn('ELD event missing required payload fields');
      return false;
    }

    // Validate that the HOS data contains required fields
    const hosData = event.payload.hos_data;
    if (!hosData.status || !hosData.driving_minutes_remaining || !hosData.duty_minutes_remaining || !hosData.cycle_minutes_remaining) {
      logger.warn('ELD event missing required HOS data fields');
      return false;
    }

    // Return true if all validations pass, false otherwise
    return true;
  }
}