import { Kafka, Consumer } from 'kafkajs'; // kafkajs@^2.2.4
import { getKafkaConfig, getConsumerConfig } from '../../../common/config/kafka.config';
import { PositionService } from '../services/position.service';
import { EntityType, PositionSource, PositionUpdate } from '../../../common/interfaces/position.interface';
import { Event, EventHandler } from '../../../common/interfaces/event.interface';
import logger from '../../../common/utils/logger';

// Define global constants for topic and consumer group from environment variables
const ELD_POSITION_TOPIC = process.env.ELD_POSITION_TOPIC || 'eld-position-updates';
const ELD_POSITION_CONSUMER_GROUP = process.env.ELD_POSITION_CONSUMER_GROUP || 'tracking-service-eld-position-group';

/**
 * Handles an ELD position event by transforming it and updating the position service
 * @param event - The event containing ELD position data
 * @returns A Promise that resolves when the position is processed
 */
export const handleEldPositionEvent: EventHandler = async (event: Event): Promise<void> => {
  try {
    // LD1: Extract position data from the event payload
    const { entity_id, entity_type, latitude, longitude, heading, speed, accuracy, timestamp } = event.payload;

    // LD1: Validate that the event contains required position fields
    if (!entity_id || !entity_type || latitude === undefined || longitude === undefined || !timestamp) {
      logger.error('Invalid ELD position event: Missing required fields', { eventId: event.metadata.event_id, payload: event.payload });
      return; // Do not throw an error, just log and return to avoid retries
    }

    // LD1: Transform the ELD position data to the platform's PositionUpdate format
    const positionUpdate: PositionUpdate = {
      entity_id,
      entity_type,
      latitude,
      longitude,
      heading: heading || 0, // Default to 0 if heading is not provided
      speed: speed || 0, // Default to 0 if speed is not provided
      accuracy: accuracy || 0, // Default to 0 if accuracy is not provided
      source: PositionSource.ELD, // LD1: Set the position source to PositionSource.ELD
      timestamp: new Date(timestamp) // Ensure timestamp is a Date object
    };

    // LD1: Call the position service to update the position
    const positionService = new PositionService(); // Consider dependency injection for real-world use
    await positionService.updatePosition(positionUpdate);

    // LD1: Log successful position update
    logger.info(`Successfully processed ELD position event for ${entity_type} ${entity_id}`, { eventId: event.metadata.event_id });

  } catch (error: any) {
    // LD1: Handle and log any errors during processing
    logger.error('Error processing ELD position event', { eventId: event.metadata.event_id, error: error.message });
  }
};

/**
 * Kafka consumer for ELD position events that processes and forwards them to the position service
 */
export class EldPositionConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private positionService: PositionService;
  private isConnected: boolean = false;
  private isReady: boolean = false;

  /**
   * Creates a new EldPositionConsumer instance
   * @param positionService - The position service to use for updating positions
   */
  constructor(positionService: PositionService) {
    // LD1: Initialize the position service
    this.positionService = positionService;

    // LD1: Create Kafka client instance using getKafkaConfig()
    this.kafka = new Kafka(getKafkaConfig());

    // LD1: Create Kafka consumer instance using getConsumerConfig() with ELD_POSITION_CONSUMER_GROUP
    this.consumer = this.kafka.consumer(getConsumerConfig(ELD_POSITION_CONSUMER_GROUP));

    // LD1: Set isConnected and isReady flags to false
    this.isConnected = false;
    this.isReady = false;

    // LD1: Log initialization of the ELD position consumer
    logger.info('EldPositionConsumer initialized');
  }

  /**
   * Connects to Kafka and starts consuming ELD position events
   * @returns A Promise that resolves when connected and consuming
   */
  async connect(): Promise<void> {
    try {
      // LD1: Connect to the Kafka broker
      await this.consumer.connect();
      this.isConnected = true;

      // LD1: Subscribe to the ELD_POSITION_TOPIC
      await this.consumer.subscribe({ topic: ELD_POSITION_TOPIC, fromBeginning: false });

      // LD1: Start consuming messages with the processEldPositionEvent handler
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            // LD1: Parse the message value as JSON
            const event: Event = JSON.parse(message.value!.toString());

            // LD1: Call the processEldPositionEvent handler
            await this.processEldPositionEvent(event);

          } catch (error: any) {
            // LD1: Handle message processing errors
            logger.error(`Error processing message from topic ${topic}`, { error: error.message, topic, partition, offset: message.offset });
          }
        },
      });

      // LD1: Set isReady flag to true
      this.isReady = true;

      // LD1: Log successful connection and subscription
      logger.info(`EldPositionConsumer connected and subscribed to topic ${ELD_POSITION_TOPIC}`);
    } catch (error: any) {
      // LD1: Handle connection errors and log them
      logger.error('Error connecting EldPositionConsumer', { error: error.message });
    }
  }

  /**
   * Disconnects from Kafka and stops consuming events
   * @returns A Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      // LD1: Disconnect the consumer from Kafka
      await this.consumer.disconnect();

      // LD1: Set isConnected and isReady flags to false
      this.isConnected = false;
      this.isReady = false;

      // LD1: Log successful disconnection
      logger.info('EldPositionConsumer disconnected');
    } catch (error: any) {
      // LD1: Handle disconnection errors and log them
      logger.error('Error disconnecting EldPositionConsumer', { error: error.message });
    }
  }

  /**
   * Processes an ELD position event and updates the position service
   * @param event - The event containing ELD position data
   * @returns A Promise that resolves when the position is processed
   */
  async processEldPositionEvent(event: Event): Promise<void> {
    try {
      // LD1: Call the handleEldPositionEvent function
      await handleEldPositionEvent(event);
    } catch (error: any) {
      // LD1: Handle and log any errors during processing
      logger.error('Error processing ELD position event', { eventId: event.metadata.event_id, error: error.message });
    }
  }

  /**
   * Checks if the consumer is connected and ready to process events
   * @returns True if the consumer is ready, false otherwise
   */
  isConsumerReady(): boolean {
    // LD1: Return the value of the isReady flag
    return this.isReady;
  }
}