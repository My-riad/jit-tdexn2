import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { KafkaService } from '../../../event-bus/src/services/kafka.service';
import {
  OptimizationResult,
  OptimizationJobType
} from '../models/optimization-result.model';
import {
  Event,
  OptimizationEvent,
  EventProducer
} from '../../../common/interfaces/event.interface';
import {
  EventTypes,
  EventCategories
} from '../../../common/constants/event-types';
import logger from '../../../common/utils/logger';

// Define the service name for logging and event metadata
const SERVICE_NAME = 'optimization-engine';

/**
 * Producer class responsible for publishing optimization results to the event bus
 */
export class OptimizationResultsProducer implements EventProducer {
  /**
   * Creates a new OptimizationResultsProducer instance
   * @param kafkaService The Kafka service instance for event production
   */
  constructor(private kafkaService: KafkaService) {
    // Store the provided Kafka service instance for event production
    this.kafkaService = kafkaService;
  }

  /**
   * Publishes an optimization result to the event bus
   * @param result The optimization result to publish
   * @returns Promise that resolves when the event is published
   */
  async publishResult(result: OptimizationResult): Promise<void> {
    try {
      // LD1: Create event metadata with a unique ID, event type based on job type, and other required fields
      const eventId = uuidv4();
      const eventType = this.getEventTypeForJobType(result.job_type);

      const metadata = {
        event_id: eventId,
        event_type: eventType,
        event_version: '1.0',
        event_time: new Date().toISOString(),
        producer: SERVICE_NAME,
        correlation_id: result.job_id,
        category: EventCategories.OPTIMIZATION
      };

      // LD1: Create the event payload containing the optimization result
      const payload = result;

      // LD1: Construct the complete event object with metadata and payload
      const event: OptimizationEvent = {
        metadata: metadata,
        payload: payload
      };

      // LD1: Produce the event to Kafka using the kafkaService
      await this.kafkaService.produceEvent(event);

      // LD1: Log successful event publication
      logger.info(`Successfully published optimization result event to Kafka`, {
        eventId: eventId,
        jobId: result.job_id,
        jobType: result.job_type
      });
    } catch (error: any) {
      // LD1: Handle any errors that occur during event production
      logger.error(`Failed to publish optimization result event to Kafka`, {
        jobId: result.job_id,
        jobType: result.job_type,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Maps optimization job types to appropriate event types
   * @param jobType The optimization job type
   * @returns The corresponding event type for the job type
   */
  getEventTypeForJobType(jobType: OptimizationJobType): EventTypes {
    // LD1: Switch on job type to determine the appropriate event type
    switch (jobType) {
      // LD1: For LOAD_MATCHING or NETWORK_OPTIMIZATION, return OPTIMIZATION_COMPLETED
      case OptimizationJobType.LOAD_MATCHING:
      case OptimizationJobType.NETWORK_OPTIMIZATION:
      case OptimizationJobType.DEMAND_PREDICTION:
        return EventTypes.OPTIMIZATION_COMPLETED;

      // LD1: For SMART_HUB_IDENTIFICATION, return SMART_HUB_IDENTIFIED
      case OptimizationJobType.SMART_HUB_IDENTIFICATION:
        return EventTypes.SMART_HUB_IDENTIFIED;

      // LD1: For RELAY_PLANNING, return RELAY_PLAN_CREATED
      case OptimizationJobType.RELAY_PLANNING:
        return EventTypes.RELAY_PLAN_CREATED;

      // LD1: For unknown job types, default to OPTIMIZATION_COMPLETED
      default:
        return EventTypes.OPTIMIZATION_COMPLETED;
    }
  }
}

// LD3: Create a singleton instance of OptimizationResultsProducer for easy access
const schemaRegistryService = new (require('../../../event-bus/src/services/schema-registry.service').default)();
const kafkaService = new KafkaService(schemaRegistryService);
export const optimizationResultsProducer = new OptimizationResultsProducer(kafkaService);