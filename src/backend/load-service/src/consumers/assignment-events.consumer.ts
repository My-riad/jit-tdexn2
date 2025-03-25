import { KafkaService } from '../../../event-bus/src/services/kafka.service';
import {
  Event,
  EventConsumer,
  EventHandler,
} from '../../../common/interfaces/event.interface';
import {
  LoadStatus,
} from '../../../common/interfaces/load.interface';
import {
  EventTypes,
} from '../../../common/constants/event-types';
import { LoadService } from '../services/load.service';
import { LoadStatusService } from '../services/load-status.service';
import logger from '../../../common/utils/logger';
import { ASSIGNMENT_TOPIC, LOAD_SERVICE_CONSUMER_GROUP } from '../config';

/**
 * Consumer class for processing assignment-related events from the Kafka event bus
 */
export class AssignmentEventsConsumer implements EventConsumer {
  /**
   * Creates a new AssignmentEventsConsumer instance
   * @param kafkaService The Kafka service instance
   * @param loadService The load service instance
   * @param loadStatusService The load status service instance
   */
  constructor(
    private kafkaService: KafkaService,
    private loadService: LoadService,
    private loadStatusService: LoadStatusService
  ) {
    // Store the provided Kafka service instance
    this.kafkaService = kafkaService;
    // Store the provided load service instance
    this.loadService = loadService;
    // Store the provided load status service instance
    this.loadStatusService = loadStatusService;
  }

  /**
   * Initializes the consumer by subscribing to assignment events
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Define event handlers for different assignment event types
    const handlers: Record<string, EventHandler> = {
      [EventTypes.ASSIGNMENT_CREATED]: this.handleAssignmentCreated.bind(this),
      [EventTypes.ASSIGNMENT_UPDATED]: this.handleAssignmentUpdated.bind(this),
      [EventTypes.ASSIGNMENT_COMPLETED]: this.handleAssignmentCompleted.bind(this),
      [EventTypes.ASSIGNMENT_CANCELLED]: this.handleAssignmentCancelled.bind(this),
    };

    // Subscribe to the assignment topic with the defined handlers
    await this.kafkaService.consumeEvents([ASSIGNMENT_TOPIC], LOAD_SERVICE_CONSUMER_GROUP, handlers);

    // Log successful initialization
    logger.info('Assignment events consumer initialized and subscribed to topic.');
  }

  /**
   * Implements the EventConsumer interface to consume events from Kafka
   * @param event The event to consume
   * @returns Promise that resolves when the event is consumed
   */
  async consumeEvent(event: Event): Promise<void> {
    try {
      // Extract event type from the event metadata
      const eventType = event.metadata.event_type;

      // Route the event to the appropriate handler based on event type
      const handler = this.eventHandlers[eventType];
      if (handler) {
        await handler(event);
      } else {
        logger.warn(`No handler registered for event type ${eventType}`);
      }

      // Log successful event consumption
      logger.info(`Consumed event of type ${eventType} with ID ${event.metadata.event_id}`);
    } catch (error: any) {
      // Handle and log any errors during event consumption
      logger.error(`Error consuming event with ID ${event.metadata.event_id}`, { error: error.message });
    }
  }

  /**
   * Handles assignment created events by updating the load status to ASSIGNED
   * @param event The event to handle
   * @returns Promise that resolves when the event is handled
   */
  async handleAssignmentCreated(event: Event): Promise<void> {
    try {
      // Extract load ID from the event payload
      const loadId = event.payload.load_id;

      // Extract assignment details from the event payload
      const assignmentDetails = event.payload;

      // Update the load status to ASSIGNED using the load status service
      await this.loadStatusService.updateStatus(loadId, {
        status: LoadStatus.ASSIGNED,
        status_details: { message: 'Load assigned to driver' },
        updated_by: 'assignment-service',
      });

      // Log successful status update
      logger.info(`Load status updated to ASSIGNED for load ${loadId}`);
    } catch (error: any) {
      // Handle and log any errors during processing
      logger.error(`Error handling assignment created event for load ${event.payload.load_id}`, { error: error.message });
    }
  }

  /**
   * Handles assignment updated events by updating load details if necessary
   * @param event The event to handle
   * @returns Promise that resolves when the event is handled
   */
  async handleAssignmentUpdated(event: Event): Promise<void> {
    try {
      // Extract load ID from the event payload
      const loadId = event.payload.load_id;

      // Extract updated assignment details from the event payload
      const assignmentDetails = event.payload;

      // Check if the update requires a load status change
      // (e.g., if the assignment is now in transit)
      // Implement logic to determine if a status change is needed based on assignmentDetails

      // Update the load status if necessary
      // await this.loadStatusService.updateStatus(loadId, {
      //   status: LoadStatus.IN_TRANSIT,
      //   status_details: { message: 'Load is now in transit' },
      //   updated_by: 'assignment-service',
      // });

      // Log successful processing
      logger.info(`Assignment updated event processed for load ${loadId}`);
    } catch (error: any) {
      // Handle and log any errors during processing
      logger.error(`Error handling assignment updated event for load ${event.payload.load_id}`, { error: error.message });
    }
  }

  /**
   * Handles assignment completed events by updating the load status to COMPLETED
   * @param event The event to handle
   * @returns Promise that resolves when the event is handled
   */
  async handleAssignmentCompleted(event: Event): Promise<void> {
    try {
      // Extract load ID from the event payload
      const loadId = event.payload.load_id;

      // Extract completion details from the event payload
      const completionDetails = event.payload;

      // Update the load status to COMPLETED using the load status service
      await this.loadStatusService.updateStatus(loadId, {
        status: LoadStatus.COMPLETED,
        status_details: { message: 'Load delivery completed' },
        updated_by: 'assignment-service',
      });

      // Log successful status update
      logger.info(`Load status updated to COMPLETED for load ${loadId}`);
    } catch (error: any) {
      // Handle and log any errors during processing
      logger.error(`Error handling assignment completed event for load ${event.payload.load_id}`, { error: error.message });
    }
  }

  /**
   * Handles assignment cancelled events by updating the load status to CANCELLED
   * @param event The event to handle
   * @returns Promise that resolves when the event is handled
   */
  async handleAssignmentCancelled(event: Event): Promise<void> {
    try {
      // Extract load ID from the event payload
      const loadId = event.payload.load_id;

      // Extract cancellation details from the event payload
      const cancellationDetails = event.payload;

      // Update the load status to CANCELLED using the load status service
      await this.loadStatusService.updateStatus(loadId, {
        status: LoadStatus.CANCELLED,
        status_details: { message: 'Load assignment cancelled' },
        updated_by: 'assignment-service',
      });

      // Log successful status update
      logger.info(`Load status updated to CANCELLED for load ${loadId}`);
    } catch (error: any) {
      // Handle and log any errors during processing
      logger.error(`Error handling assignment cancelled event for load ${event.payload.load_id}`, { error: error.message });
    }
  }
}