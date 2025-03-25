import { Kafka } from 'kafkajs'; // ^2.2.4
import { PositionUpdate, EntityType, PositionSource } from '../../../common/interfaces/position.interface';
import { PositionService } from '../services/position.service';
import { POSITION_UPDATES } from '../../../event-bus/src/config/topics';
import { POSITION_UPDATES_CONSUMER } from '../../../event-bus/src/config/consumer-groups';
import { getKafkaConfig, getConsumerConfig } from '../../../common/config/kafka.config';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

// Define global constants for batch processing
const BATCH_SIZE = 10;
const MAX_BATCH_WAIT_MS = 1000;

/**
 * Validates a position update message from Kafka
 * @param message - The Kafka message containing the position update
 * @returns Validated position update object
 */
const validatePositionMessage = (message: any): PositionUpdate => {
  // Check if message value exists
  if (!message || !message.value) {
    throw new AppError('Invalid message format: Missing value', { code: 'VAL_INVALID_INPUT' });
  }

  // Parse the message value as JSON
  let parsedMessage: any;
  try {
    parsedMessage = JSON.parse(message.value.toString());
  } catch (error) {
    throw new AppError('Invalid message format: Value is not valid JSON', { code: 'VAL_INVALID_INPUT' });
  }

  // Validate required fields (entity_id, entity_type, latitude, longitude)
  if (!parsedMessage.entity_id || parsedMessage.latitude === undefined || parsedMessage.longitude === undefined) {
    throw new AppError('Invalid message: Missing required fields (entity_id, latitude, longitude)', { code: 'VAL_INVALID_INPUT' });
  }

  // Validate that entity_type is a valid EntityType (DRIVER or VEHICLE)
  if (!Object.values(EntityType).includes(parsedMessage.entity_type)) {
    throw new AppError('Invalid message: Invalid entity_type', { code: 'VAL_INVALID_INPUT' });
  }

  // Set source to MOBILE_APP if not provided
  const source = parsedMessage.source || PositionSource.MOBILE_APP;

  // Set timestamp to current time if not provided
  const timestamp = parsedMessage.timestamp ? new Date(parsedMessage.timestamp) : new Date();

  // Return the validated position update object
  return {
    entity_id: parsedMessage.entity_id,
    entity_type: parsedMessage.entity_type,
    latitude: parsedMessage.latitude,
    longitude: parsedMessage.longitude,
    heading: parsedMessage.heading || 0,
    speed: parsedMessage.speed || 0,
    accuracy: parsedMessage.accuracy || 0,
    source: source,
    timestamp: timestamp
  };
};

/**
 * Creates and configures a Kafka consumer for position updates
 * @param positionService - The PositionService instance to use for processing updates
 * @returns Promise<void> - A Promise that resolves when the consumer is set up and running
 */
export const createConsumer = async (positionService: PositionService): Promise<void> => {
  // Create Kafka client instance using getKafkaConfig()
  const kafka = new Kafka(getKafkaConfig());

  // Create Kafka consumer instance using getConsumerConfig() with POSITION_UPDATES_CONSUMER group
  const consumer = kafka.consumer(getConsumerConfig(POSITION_UPDATES_CONSUMER));

  // Connect the consumer to Kafka
  await consumer.connect();

  // Subscribe to the POSITION_UPDATES topic
  await consumer.subscribe({ topic: POSITION_UPDATES, fromBeginning: false });

  // Initialize batch processing variables
  let batch: PositionUpdate[] = [];
  let batchTimeout: NodeJS.Timeout | null = null;

  // Set up message handler with batching logic
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        // Validate the message using validatePositionMessage
        const positionUpdate = validatePositionMessage(message);

        // Add the validated position update to the batch
        batch.push(positionUpdate);

        // If batch size reaches BATCH_SIZE, process the batch
        if (batch.length >= BATCH_SIZE) {
          await processBatch(batch, positionService);
          batch = []; // Reset the batch after processing
          if (batchTimeout) {
            clearTimeout(batchTimeout);
            batchTimeout = null;
          }
        } else if (!batchTimeout) {
          // If this is the first item in batch, set a timeout to process batch after MAX_BATCH_WAIT_MS
          batchTimeout = setTimeout(async () => {
            if (batch.length > 0) {
              await processBatch(batch, positionService);
              batch = []; // Reset the batch after processing
            }
            batchTimeout = null;
          }, MAX_BATCH_WAIT_MS);
        }

        // Log message processing at debug level
        logger.debug(`Processed message from topic ${POSITION_UPDATES}`, {
          entityId: positionUpdate.entity_id,
          entityType: positionUpdate.entity_type
        });
      } catch (error: any) {
        // Log any errors that occur during message processing
        logger.error(`Error processing message from topic ${POSITION_UPDATES}`, {
          error: error.message
        });
      }
    },
  });

  // Set up error handler for consumer errors
  consumer.on('consumer.crash', (error: any) => {
    logger.error('Consumer crashed:', { error });
  });

  // Log successful consumer setup
  logger.info(`Consumer started and subscribed to topic ${POSITION_UPDATES}`);
};

/**
 * Processes a batch of position updates
 * @param updates - An array of PositionUpdate objects to process
 * @param positionService - The PositionService instance to use for processing updates
 * @returns Promise<void> - A Promise that resolves when the batch is processed
 */
const processBatch = async (updates: PositionUpdate[], positionService: PositionService): Promise<void> => {
  // Check if batch is empty and return if so
  if (!updates || updates.length === 0) {
    return;
  }

  try {
    // Log batch processing start with batch size
    logger.info(`Processing batch of ${updates.length} position updates`);

    // Call positionService.bulkUpdatePositions with the batch
    await positionService.bulkUpdatePositions(updates);

    // Log successful batch processing
    logger.info(`Successfully processed batch of ${updates.length} position updates`);
  } catch (error: any) {
    // Handle errors during batch processing and log them
    logger.error(`Error processing batch of position updates`, {
      error: error.message
    });
  }
};

/**
 * Consumer class for processing position updates from mobile devices
 */
export class MobilePositionConsumer {
  private kafka: Kafka;
  private consumer: any;
  private positionService: PositionService;
  private isConnected: boolean = false;
  private isRunning: boolean = false;
  private batch: PositionUpdate[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  /**
   * Creates a new MobilePositionConsumer instance
   * @param positionService - The PositionService instance to use for processing updates
   */
  constructor(positionService: PositionService) {
    // Initialize the position service
    this.positionService = positionService;

    // Initialize Kafka client using getKafkaConfig()
    this.kafka = new Kafka(getKafkaConfig());

    // Initialize consumer using getConsumerConfig() with POSITION_UPDATES_CONSUMER group
    this.consumer = this.kafka.consumer(getConsumerConfig(POSITION_UPDATES_CONSUMER));

    // Initialize batch array and flags
    this.batch = [];
    this.isConnected = false;
    this.isRunning = false;

    // Log initialization of the consumer
    logger.info('MobilePositionConsumer initialized');
  }

  /**
   * Connects to Kafka and starts consuming messages
   * @returns Promise<void> - A Promise that resolves when connected and consuming
   */
  async connect(): Promise<void> {
    try {
      // Connect to Kafka broker
      await this.consumer.connect();

      // Subscribe to POSITION_UPDATES topic
      await this.consumer.subscribe({ topic: POSITION_UPDATES, fromBeginning: false });

      // Set up message handler with batching logic
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          await this.handleMessage(message);
        },
      });

      // Set up error handler
      this.consumer.on('consumer.crash', (error: any) => {
        this.handleError(error);
      });

      // Set isConnected and isRunning flags to true
      this.isConnected = true;
      this.isRunning = true;

      // Log successful connection and subscription
      logger.info(`Connected to Kafka and subscribed to topic ${POSITION_UPDATES}`);
    } catch (error: any) {
      // Log any errors that occur during connection or subscription
      logger.error(`Error connecting to Kafka or subscribing to topic ${POSITION_UPDATES}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Disconnects from Kafka and stops consuming
   * @returns Promise<void> - A Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      // Clear any pending batch timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Process any remaining items in the batch
      if (this.batch.length > 0) {
        await this.processBatch();
      }

      // Disconnect the consumer
      await this.consumer.disconnect();

      // Set isConnected and isRunning flags to false
      this.isConnected = false;
      this.isRunning = false;

      // Log successful disconnection
      logger.info('Disconnected from Kafka');
    } catch (error: any) {
      // Log any errors that occur during disconnection
      logger.error('Error disconnecting from Kafka', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handles an incoming Kafka message
   * @param message - The Kafka message containing the position update
   * @returns Promise<void> - A Promise that resolves when the message is processed
   */
  async handleMessage(message: any): Promise<void> {
    try {
      // Validate the message using validatePositionMessage
      const positionUpdate = validatePositionMessage(message);

      // Add the validated position update to the batch
      this.batch.push(positionUpdate);

      // If batch size reaches BATCH_SIZE, process the batch
      if (this.batch.length >= BATCH_SIZE) {
        await this.processBatch();
      } else if (!this.batchTimeout) {
        // If this is the first item in batch, set a timeout to process batch after MAX_BATCH_WAIT_MS
        this.batchTimeout = setTimeout(async () => {
          await this.processBatch();
        }, MAX_BATCH_WAIT_MS);
      }

      // Log message processing at debug level
      logger.debug(`Processed message from topic ${POSITION_UPDATES}`, {
        entityId: positionUpdate.entity_id,
        entityType: positionUpdate.entity_type
      });
    } catch (error: any) {
      // Log any errors that occur during message processing
      logger.error(`Error processing message from topic ${POSITION_UPDATES}`, {
        error: error.message
      });
    }
  }

  /**
   * Processes the current batch of position updates
   * @returns Promise<void> - A Promise that resolves when the batch is processed
   */
  async processBatch(): Promise<void> {
    // Clear the batch timeout if set
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Create a copy of the current batch
    const batchCopy = [...this.batch];

    // Clear the batch array
    this.batch = [];

    // Check if the batch copy is empty, return if so
    if (!batchCopy || batchCopy.length === 0) {
      return;
    }

    try {
      // Log batch processing start with batch size
      logger.info(`Processing batch of ${batchCopy.length} position updates`);

      // Call positionService.bulkUpdatePositions with the batch copy
      await this.positionService.bulkUpdatePositions(batchCopy);

      // Log successful batch processing
      logger.info(`Successfully processed batch of ${batchCopy.length} position updates`);
    } catch (error: any) {
      // Handle errors during batch processing and log them
      logger.error(`Error processing batch of position updates`, {
        error: error.message
      });
    }
  }

  /**
   * Handles consumer errors
   * @param error - The error object
   * @returns Promise<void> - A Promise that resolves when the error is handled
   */
  async handleError(error: Error): Promise<void> {
    // Log the error with context
    logger.error('Consumer error:', {
      error: error.message
    });

    // If the error is critical, attempt to reconnect
    if (this.isConnected) {
      try {
        await this.disconnect();
        await this.connect();
      } catch (reconnectError: any) {
        logger.error('Failed to reconnect after consumer error:', {
          error: reconnectError.message
        });
      }
    } else {
      logger.error('Consumer is not connected, reconnection not attempted.');
    }
  }

  /**
   * Checks if the consumer is connected and running
   * @returns boolean - True if the consumer is running, false otherwise
   */
  isConsumerRunning(): boolean {
    return this.isConnected && this.isRunning;
  }
}