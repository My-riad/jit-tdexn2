import { Kafka, Producer, Consumer, Admin, EachMessagePayload, KafkaMessage } from 'kafkajs'; // kafkajs@2.2.4
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0

import {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig,
  getAdminConfig,
  getTopicConfig,
  TOPIC_AUTO_CREATION_ENABLED,
  SCHEMA_VALIDATION_ENABLED,
  Topics,
  getTopicName,
  getTopicForCategory,
  ConsumerGroups,
  getConsumerGroupId
} from '../config';
import SchemaRegistryService from './schema-registry.service';
import { Event, EventProducer, EventConsumer, EventHandler } from '../../../common/interfaces/event.interface';
import { EventCategories } from '../../../common/constants/event-types';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';
import { handleError } from '../../../common/utils/error-handler';

/**
 * Interface defining the public API of the KafkaService
 */
export interface KafkaServiceInterface {
  /**
   * Initializes the Kafka service
   */
  initialize(): Promise<void>;

  /**
   * Produces an event to Kafka
   * @param event The event to produce
   */
  produceEvent<T extends Event>(event: T): Promise<void>;

  /**
   * Starts consuming events from topics
   * @param topics List of topics to consume from
   * @param groupId Consumer group ID
   * @param handlers Record of event handlers for specific event types
   */
  consumeEvents(topics: string[], groupId: string, handlers: Record<string, EventHandler>): Promise<void>;

  /**
   * Registers an event handler
   * @param eventType The event type to register a handler for
   * @param handler The event handler function
   */
  registerEventHandler(eventType: string, handler: EventHandler): void;

  /**
   * Shuts down the service
   */
  shutdown(): Promise<void>;
}

/**
 * Service that provides Kafka messaging capabilities for the event bus, handling the production and consumption of events
 */
export class KafkaService implements EventProducer, EventConsumer, KafkaServiceInterface {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private admin: Admin | null = null;
  private schemaRegistry: SchemaRegistryService;
  private eventHandlers: Map<string, EventHandler> = new Map();
  private isInitialized: boolean = false;
  private isConnected: boolean = false;

  /**
   * Creates a new KafkaService instance
   * @param schemaRegistry The schema registry service for event validation
   */
  constructor(schemaRegistry: SchemaRegistryService) {
    // Initialize the Kafka client with the configured brokers and client ID
    this.kafka = new Kafka(getKafkaConfig());

    // Store the schema registry service for event validation
    this.schemaRegistry = schemaRegistry;

    // Initialize empty map for event handlers
    this.eventHandlers = new Map<string, EventHandler>();

    // Set isInitialized and isConnected to false
    this.isInitialized = false;
    this.isConnected = false;
  }

  /**
   * Initializes the Kafka service by connecting to Kafka and creating producer, consumer, and admin clients
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      // Create Kafka producer with configured settings
      this.producer = this.kafka.producer(getProducerConfig());

      // Create Kafka admin client with configured settings
      this.admin = this.kafka.admin(getAdminConfig());

      // Connect the producer to Kafka brokers
      await this.producer.connect();

      // Connect the admin client to Kafka brokers
      await this.admin.connect();

      // Ensure required topics exist by checking and creating them if needed
      await this.ensureTopicsExist();

      // Set isInitialized to true
      this.isInitialized = true;
      this.isConnected = true;

      // Log successful initialization
      logger.info('Kafka service initialized and connected successfully.');
    } catch (error: any) {
      // Handle initialization errors
      logger.error('Kafka service initialization failed.', { error: error.message });
      handleError(error, 'KafkaService.initialize');
      throw new AppError('Kafka service initialization failed.', { code: 'SRV_SERVICE_UNAVAILABLE', details: { error: error.message } });
    }
  }

  /**
   * Checks if required topics exist and creates them if they don't
   * @returns Promise that resolves when topics are verified or created
   */
  async ensureTopicsExist(): Promise<void> {
    // Skip if topic auto-creation is disabled
    if (!TOPIC_AUTO_CREATION_ENABLED) {
      logger.warn('Topic auto-creation is disabled. Skipping topic check.');
      return;
    }

    try {
      // Get list of existing topics from Kafka
      const existingTopics = await this.admin!.listTopics();

      // Determine which required topics don't exist yet
      const requiredTopics = Object.values(Topics).map(topic => getTopicName(topic));
      const missingTopics = requiredTopics.filter(topic => !existingTopics.includes(topic));

      // Create missing topics with configured settings
      if (missingTopics.length > 0) {
        logger.info(`Creating missing topics: ${missingTopics.join(', ')}`);
        await this.admin!.createTopics({
          topics: missingTopics.map(topic => getTopicConfig(topic))
        });
        logger.info(`Successfully created topics: ${missingTopics.join(', ')}`);
      } else {
        logger.info('All required topics exist. No topics were created.');
      }
    } catch (error: any) {
      // Handle topic creation errors
      logger.error('Topic creation failed.', { error: error.message });
      handleError(error, 'KafkaService.ensureTopicsExist');
      throw new AppError('Topic creation failed.', { code: 'SRV_INTERNAL_ERROR', details: { error: error.message } });
    }
  }

  /**
   * Produces an event to the appropriate Kafka topic
   * @param event The event to produce
   * @returns Promise that resolves when the event is produced
   */
  async produceEvent<T extends Event>(event: T): Promise<void> {
    // Check if the service is initialized, throw error if not
    if (!this.isInitialized || !this.producer) {
      throw new AppError('Kafka service is not initialized.', { code: 'SRV_SERVICE_UNAVAILABLE' });
    }

    try {
      // Validate the event schema if validation is enabled
      if (SCHEMA_VALIDATION_ENABLED) {
        await this.schemaRegistry.validateEvent(event);
      }

      // Determine the appropriate topic based on event category
      const topic = getTopicForCategory(event.metadata.category);

      // Serialize the event to JSON
      const message = {
        key: event.metadata.event_id,
        value: JSON.stringify(event)
      };

      // Send the event to the Kafka topic
      await this.producer.send({
        topic,
        messages: [message]
      });

      // Log successful event production
      logger.info(`Produced event to topic ${topic}`, { eventId: event.metadata.event_id, eventType: event.metadata.event_type });
    } catch (error: any) {
      // Handle event production errors
      logger.error(`Failed to produce event to topic ${getTopicForCategory(event.metadata.category)}`, { error: error.message, eventId: event.metadata.event_id });
      handleError(error, 'KafkaService.produceEvent');
      throw new AppError(`Failed to produce event to topic ${getTopicForCategory(event.metadata.category)}`, { code: 'SRV_INTERNAL_ERROR', details: { error: error.message, eventId: event.metadata.event_id } });
    }
  }

  /**
   * Starts consuming events from specified topics with the given consumer group
   * @param topics List of topics to consume from
   * @param groupId Consumer group ID
   * @param handlers Record of event handlers for specific event types
   * @returns Promise that resolves when consumer is started
   */
  async consumeEvents(topics: string[], groupId: string, handlers: Record<string, EventHandler>): Promise<void> {
    // Check if the service is initialized, throw error if not
    if (!this.isInitialized || !this.consumer) {
      throw new AppError('Kafka service is not initialized.', { code: 'SRV_SERVICE_UNAVAILABLE' });
    }

    try {
      // Create a Kafka consumer with the specified group ID
      this.consumer = this.kafka.consumer(getConsumerConfig(groupId));

      // Connect the consumer to Kafka brokers
      await this.consumer.connect();

      // Register the event handlers for specific event types
      Object.entries(handlers).forEach(([eventType, handler]) => {
        this.registerEventHandler(eventType, handler);
      });

      // Subscribe to the specified topics
      await this.consumer.subscribe({ topics, fromBeginning: false });

      // Start consuming messages with the message handler
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          try {
            await this.handleMessage(payload);
          } catch (error: any) {
            logger.error(`Error handling message from topic ${payload.topic}`, { error: error.message, topic: payload.topic, partition: payload.partition, offset: payload.message.offset });
            try {
              await this.sendToDeadLetterQueue(payload.topic, payload.message, error);
            } catch (dlqError: any) {
              logger.error(`Failed to send message to dead letter queue for topic ${payload.topic}`, { error: dlqError.message, topic: payload.topic, partition: payload.partition, offset: payload.message.offset });
            }
          }
        }
      });

      // Log successful consumer start
      logger.info(`Consumer started for topics ${topics.join(', ')} in group ${groupId}`);
    } catch (error: any) {
      // Handle consumer start errors
      logger.error(`Consumer failed to start for topics ${topics.join(', ')} in group ${groupId}`, { error: error.message });
      handleError(error, 'KafkaService.consumeEvents');
      throw new AppError(`Consumer failed to start for topics ${topics.join(', ')} in group ${groupId}`, { code: 'SRV_SERVICE_UNAVAILABLE', details: { error: error.message } });
    }
  }

  /**
   * Processes a Kafka message by parsing it and routing to the appropriate handler
   * @param payload The Kafka message payload
   * @returns Promise that resolves when the message is processed
   */
  async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      // Extract topic, partition, and message from the payload
      const { topic, partition, message } = payload;

      // Parse the message value as JSON
      const event: Event = JSON.parse(message.value!.toString());

      // Validate the event schema if validation is enabled
      if (SCHEMA_VALIDATION_ENABLED) {
        await this.schemaRegistry.validateEvent(event);
      }

      // Extract event type from the event metadata
      const eventType = event.metadata.event_type;

      // Find the appropriate handler for the event type
      const handler = this.eventHandlers.get(eventType);

      // If no handler exists, log a warning and return
      if (!handler) {
        logger.warn(`No handler registered for event type ${eventType}`, { topic, partition, offset: message.offset });
        return;
      }

      // Call the handler with the parsed event
      await handler(event);

      // Log successful message processing
      logger.debug(`Successfully processed message from topic ${topic}`, { eventId: event.metadata.event_id, eventType: eventType, partition, offset: message.offset });
    } catch (error: any) {
      // Handle message processing errors
      logger.error(`Error processing message from topic ${payload.topic}`, { error: error.message, topic: payload.topic, partition: payload.partition, offset: payload.message.offset });
      handleError(error, 'KafkaService.handleMessage');
      throw error; // Re-throw the error to trigger retry or DLQ
    }
  }

  /**
   * Registers an event handler for a specific event type
   * @param eventType The event type to register a handler for
   * @param handler The event handler function
   */
  registerEventHandler(eventType: string, handler: EventHandler): void {
    // Store the handler in the eventHandlers map with the event type as key
    this.eventHandlers.set(eventType, handler);

    // Log the registration of the handler
    logger.info(`Registered event handler for event type ${eventType}`);
  }

  /**
   * Creates a dead letter queue topic for failed messages
   * @param sourceTopic The topic for which to create a DLQ
   * @returns Promise that resolves to the DLQ topic name
   */
  async createDeadLetterQueue(sourceTopic: string): Promise<string> {
    // Generate a DLQ topic name based on the source topic
    const dlqTopic = `${sourceTopic}-dlq`;

    try {
      // Check if the DLQ topic already exists
      const existingTopics = await this.admin!.listTopics();
      if (!existingTopics.includes(dlqTopic)) {
        // Create the DLQ topic if it doesn't exist
        await this.admin!.createTopics({
          topics: [getTopicConfig(dlqTopic)]
        });
        logger.info(`Created dead letter queue topic: ${dlqTopic}`);
      } else {
        logger.info(`Dead letter queue topic already exists: ${dlqTopic}`);
      }
    } catch (error: any) {
      // Handle DLQ creation errors
      logger.error(`Failed to create dead letter queue topic ${dlqTopic}`, { error: error.message });
      handleError(error, 'KafkaService.createDeadLetterQueue');
      throw new AppError(`Failed to create dead letter queue topic ${dlqTopic}`, { code: 'SRV_INTERNAL_ERROR', details: { error: error.message } });
    }

    // Return the DLQ topic name
    return dlqTopic;
  }

  /**
   * Sends a failed message to the dead letter queue
   * @param sourceTopic The topic from which the message originated
   * @param message The Kafka message that failed processing
   * @param error The error that caused the message to fail
   * @returns Promise that resolves when the message is sent to the DLQ
   */
  async sendToDeadLetterQueue(sourceTopic: string, message: KafkaMessage, error: Error): Promise<void> {
    try {
      // Ensure the DLQ topic exists
      const dlqTopic = await this.createDeadLetterQueue(sourceTopic);

      // Add error information to the message headers
      const headers = {
        'original-topic': sourceTopic,
        'error-message': error.message,
        'error-stack': error.stack || 'N/A'
      };

      // Send the message to the DLQ topic
      await this.producer!.send({
        topic: dlqTopic,
        messages: [{
          key: message.key,
          value: message.value,
          headers: headers
        }]
      });

      // Log the message being sent to the DLQ
      logger.info(`Sent message to dead letter queue ${dlqTopic}`, { topic: sourceTopic, offset: message.offset });
    } catch (error: any) {
      // Handle DLQ sending errors
      logger.error(`Failed to send message to dead letter queue for topic ${sourceTopic}`, { error: error.message });
      handleError(error, 'KafkaService.sendToDeadLetterQueue');
      throw new AppError(`Failed to send message to dead letter queue for topic ${sourceTopic}`, { code: 'SRV_INTERNAL_ERROR', details: { error: error.message } });
    }
  }

  /**
   * Gracefully shuts down the Kafka service
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    try {
      // Disconnect the consumer if it exists
      if (this.consumer) {
        await this.consumer.disconnect();
      }

      // Disconnect the producer if it exists
      if (this.producer) {
        await this.producer.disconnect();
      }

      // Disconnect the admin client if it exists
      if (this.admin) {
        await this.admin.disconnect();
      }

      // Set isInitialized and isConnected to false
      this.isInitialized = false;
      this.isConnected = false;

      // Log successful shutdown
      logger.info('Kafka service shut down successfully.');
    } catch (error: any) {
      // Handle shutdown errors
      logger.error('Kafka service shutdown failed.', { error: error.message });
      handleError(error, 'KafkaService.shutdown');
      throw new AppError('Kafka service shutdown failed.', { code: 'SRV_INTERNAL_ERROR', details: { error: error.message } });
    }
  }
}