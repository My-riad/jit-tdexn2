import { Kafka, Consumer } from 'kafkajs'; // kafkajs@^2.2.4
import { getKafkaConfig, getConsumerConfig } from '../../../common/config/kafka.config';
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import { LoadEvent, EventHandler } from '../../../common/interfaces/event.interface';
import { LoadStatus } from '../../../common/interfaces/load.interface';
import { logger } from '../../../common/utils/logger';
import { OptimizationService, optimizationService } from '../services/optimization.service';
import { OptimizationJobType } from '../models/optimization-job.model';
import { getOptimizationConfig } from '../config';

// Define global constants for consumer group ID and topic
const CONSUMER_GROUP_ID = 'optimization-engine-load-status';
const LOAD_TOPIC = 'load-events';

/**
 * Processes load status change events and triggers appropriate optimization jobs
 * @param event The load status change event
 * @returns Promise that resolves when the event is processed
 */
const handleLoadStatusEvent: EventHandler = async (event: LoadEvent): Promise<void> => {
  // LD1: Extract load ID, previous status, and new status from event payload
  const loadId = event.payload.load_id;
  const previousStatus = event.payload.previous_status;
  const newStatus = event.payload.new_status;

  // LD1: Log the received load status change event
  logger.info(`Received load status change event for load ${loadId}`, {
    previousStatus: previousStatus,
    newStatus: newStatus,
    eventId: event.metadata.event_id
  });

  // LD1: Check if the event type is LOAD_STATUS_CHANGED
  if (event.metadata.event_type === EventTypes.LOAD_STATUS_CHANGED) {
    // Determine which optimization job types to trigger based on status transition
    let jobTypesToTrigger: OptimizationJobType[] = [];

    // LD1: For PENDING to AVAILABLE transition, trigger network optimization
    if (shouldTriggerNetworkOptimization(previousStatus, newStatus)) {
      jobTypesToTrigger.push(OptimizationJobType.NETWORK_OPTIMIZATION);
    }

    // LD1: For DELIVERED to COMPLETED transition, trigger Smart Hub identification
    if (shouldTriggerSmartHubIdentification(previousStatus, newStatus)) {
      jobTypesToTrigger.push(OptimizationJobType.SMART_HUB_IDENTIFICATION);
    }

    // LD1: For specific long-haul loads, trigger relay planning
    // TODO: Implement logic to check if load is long-haul based on distance
    // if (shouldTriggerRelayPlanning(event.payload)) {
    //   jobTypesToTrigger.push(OptimizationJobType.RELAY_PLANNING);
    // }

    // LD1: Create appropriate optimization jobs with optimizationService
    for (const jobType of jobTypesToTrigger) {
      try {
        // Create optimization job with appropriate parameters
        const optimizationConfig = getOptimizationConfig();
        const parameters = {
          region: 'US', // Placeholder
          timeWindow: {
            start: new Date(),
            end: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
          },
          constraints: [], // Placeholder
          optimizationGoal: 'Minimize Empty Miles', // Placeholder
          weights: optimizationConfig.weights
        };

        // Create the optimization job
        const { jobId } = await optimizationService.createJob(
          jobType,
          parameters,
          5, // Placeholder priority
          'load-status-consumer'
        );

        // LD1: Log the created optimization jobs
        logger.info(`Created optimization job ${jobId} for load ${loadId}`, {
          jobType: jobType,
          loadId: loadId
        });
      } catch (error: any) {
        // LD1: Handle any errors that occur during processing
        logger.error(`Error creating optimization job for load ${loadId}`, {
          jobType: jobType,
          error: error.message
        });
      }
    }
  }
};

/**
 * Determines if a network optimization job should be triggered based on load status
 * @param previousStatus The previous load status
 * @param newStatus The new load status
 * @returns True if network optimization should be triggered
 */
const shouldTriggerNetworkOptimization = (previousStatus: string, newStatus: string): boolean => {
  // LD1: Check if transition is from PENDING to AVAILABLE
  const pendingToAvailable = previousStatus === LoadStatus.PENDING && newStatus === LoadStatus.AVAILABLE;

  // LD1: Check if transition is from AVAILABLE to ASSIGNED
  const availableToAssigned = previousStatus === LoadStatus.AVAILABLE && newStatus === LoadStatus.ASSIGNED;

  // LD1: Return true if either condition is met, false otherwise
  return pendingToAvailable || availableToAssigned;
};

/**
 * Determines if a Smart Hub identification job should be triggered based on load status
 * @param previousStatus The previous load status
 * @param newStatus The new load status
 * @returns True if Smart Hub identification should be triggered
 */
const shouldTriggerSmartHubIdentification = (previousStatus: string, newStatus: string): boolean => {
  // LD1: Check if transition is from DELIVERED to COMPLETED
  const deliveredToCompleted = previousStatus === LoadStatus.DELIVERED && newStatus === LoadStatus.COMPLETED;

  // LD1: Return true if condition is met, false otherwise
  return deliveredToCompleted;
};

/**
 * Determines if a relay planning job should be triggered based on load details
 * @param loadDetails The load details
 * @returns True if relay planning should be triggered
 */
const shouldTriggerRelayPlanning = (loadDetails: any): boolean => {
  // TODO: Implement logic to check if load is long-haul based on distance
  // TODO: Implement logic to check if load has appropriate time window for relay
  return false;
};

let consumer: Consumer;

/**
 * Initializes the Kafka consumer for load status events
 * @returns Promise that resolves when the consumer is initialized
 */
export const initializeConsumer = async (): Promise<void> => {
  try {
    // Create Kafka client with configured brokers
    const kafka = new Kafka(getKafkaConfig());

    // Create consumer with optimization-engine-load-status group ID
    consumer = kafka.consumer(getConsumerConfig(CONSUMER_GROUP_ID));

    // Subscribe to load-events topic
    await consumer.subscribe({ topic: LOAD_TOPIC, fromBeginning: false });

    // Register handleLoadStatusEvent as the event handler for LOAD_STATUS_CHANGED events
    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const event: LoadEvent = JSON.parse(message.value!.toString());
          if (event.metadata.event_type === EventTypes.LOAD_STATUS_CHANGED) {
            await handleLoadStatusEvent(event);
          }
        } catch (error: any) {
          logger.error('Error processing message', {
            topic: LOAD_TOPIC,
            error: error.message
          });
        }
      },
    });

    // Log successful consumer initialization
    logger.info(`Kafka consumer initialized and subscribed to ${LOAD_TOPIC}`);
  } catch (error: any) {
    // Set up error handling for consumer
    logger.error('Failed to initialize Kafka consumer', {
      topic: LOAD_TOPIC,
      error: error.message
    });
  }
};

/**
 * Gracefully shuts down the Kafka consumer
 * @returns Promise that resolves when the consumer is shut down
 */
export const shutdownConsumer = async (): Promise<void> => {
  try {
    // Disconnect the consumer if it exists
    if (consumer) {
      await consumer.disconnect();
      logger.info('Kafka consumer disconnected successfully');
    }
  } catch (error: any) {
    logger.error('Error disconnecting Kafka consumer', {
      topic: LOAD_TOPIC,
      error: error.message
    });
  }
};

export { handleLoadStatusEvent };