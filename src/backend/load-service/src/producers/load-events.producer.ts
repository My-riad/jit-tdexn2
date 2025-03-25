import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0

import { KafkaService } from '../../../event-bus/src/services/kafka.service';
import {
  Event,
  LoadEvent,
  EventMetadata,
  EventProducer,
} from '../../../common/interfaces/event.interface';
import {
  EventTypes,
  EventCategories,
} from '../../../common/constants/event-types';
import { Load, LoadStatus, LoadDocument } from '../../../common/interfaces/load.interface';
import { LOAD_EVENTS } from '../../../event-bus/src/config/topics';
import logger from '../../../common/utils/logger';

/**
 * Producer class for creating and publishing load-related events to the Kafka event bus
 */
export class LoadEventsProducer implements EventProducer {
  private readonly serviceName: string = 'load-service';

  /**
   * Creates a new LoadEventsProducer instance
   * @param kafkaService The Kafka service instance
   */
  constructor(private kafkaService: KafkaService) {
    // Store the provided Kafka service instance
    this.kafkaService = kafkaService;
    // Set the service name to 'load-service' for event metadata
    this.serviceName = 'load-service';
  }

  /**
   * Creates and publishes an event when a new load is created
   * @param load The load data
   * @returns Promise that resolves when the event is published
   */
  async createLoadCreatedEvent(load: Load): Promise<void> {
    // Create event metadata with LOAD_CREATED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.LOAD_CREATED);

    // Create event payload with the load data
    const payload: Load = load;

    // Publish the event to the Kafka service
    try {
      await this.publishEvent(metadata, payload);
      // Log successful event publication
      logger.info(`Published LOAD_CREATED event for load ${load.load_id}`);
    } catch (error: any) {
      // Handle and log any errors that occur
      logger.error(`Failed to publish LOAD_CREATED event for load ${load.load_id}`, { error: error.message });
    }
  }

  /**
   * Creates and publishes an event when a load is updated
   * @param load The updated load data
   * @returns Promise that resolves when the event is published
   */
  async createLoadUpdatedEvent(load: Load): Promise<void> {
    // Create event metadata with LOAD_UPDATED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.LOAD_UPDATED);

    // Create event payload with the updated load data
    const payload: Load = load;

    // Publish the event to the Kafka service
    try {
      await this.publishEvent(metadata, payload);
      // Log successful event publication
      logger.info(`Published LOAD_UPDATED event for load ${load.load_id}`);
    } catch (error: any) {
      // Handle and log any errors that occur
      logger.error(`Failed to publish LOAD_UPDATED event for load ${load.load_id}`, { error: error.message });
    }
  }

  /**
   * Creates and publishes an event when a load is deleted
   * @param loadId The ID of the deleted load
   * @returns Promise that resolves when the event is published
   */
  async createLoadDeletedEvent(loadId: string): Promise<void> {
    // Create event metadata with LOAD_DELETED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.LOAD_DELETED);

    // Create event payload with the load ID
    const payload: { load_id: string } = { load_id: loadId };

    // Publish the event to the Kafka service
    try {
      await this.publishEvent(metadata, payload);
      // Log successful event publication
      logger.info(`Published LOAD_DELETED event for load ${loadId}`);
    } catch (error: any) {
      // Handle and log any errors that occur
      logger.error(`Failed to publish LOAD_DELETED event for load ${loadId}`, { error: error.message });
    }
  }

  /**
   * Creates and publishes an event when a load's status changes
   * @param load The load data
   * @param previousStatus The previous status of the load
   * @param statusDetails Additional details about the status change
   * @returns Promise that resolves when the event is published
   */
  async createLoadStatusChangedEvent(
    load: Load,
    previousStatus: LoadStatus,
    statusDetails: Record<string, any>
  ): Promise<void> {
    let eventType: EventTypes;

    // Determine the appropriate event type based on the new status
    if (load.status === LoadStatus.COMPLETED) {
      eventType = EventTypes.LOAD_COMPLETED;
    } else if (load.status === LoadStatus.CANCELLED) {
      eventType = EventTypes.LOAD_CANCELLED;
    } else {
      eventType = EventTypes.LOAD_STATUS_CHANGED;
    }

    // Create event metadata with the determined event type
    const metadata: EventMetadata = this.createEventMetadata(eventType);

    // Create event payload with the load data, previous status, and status details
    const payload: any = {
      load_id: load.load_id,
      previous_status: previousStatus,
      new_status: load.status,
      status_details: statusDetails,
    };

    // Publish the event to the Kafka service
    try {
      await this.publishEvent(metadata, payload);
      // Log successful event publication
      logger.info(`Published ${eventType} event for load ${load.load_id}`);
    } catch (error: any) {
      // Handle and log any errors that occur
      logger.error(`Failed to publish ${eventType} event for load ${load.load_id}`, { error: error.message });
    }
  }

  /**
   * Creates and publishes an event when a load is assigned to a driver
   * @param load The load data
   * @param driverId The ID of the assigned driver
   * @param vehicleId The ID of the vehicle assigned to the load
   * @returns Promise that resolves when the event is published
   */
  async createLoadAssignedEvent(load: Load, driverId: string, vehicleId: string): Promise<void> {
    // Create event metadata with LOAD_ASSIGNED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.LOAD_ASSIGNED);

    // Create event payload with the load data, driver ID, and vehicle ID
    const payload: any = {
      load_id: load.load_id,
      driver_id: driverId,
      vehicle_id: vehicleId,
    };

    // Publish the event to the Kafka service
    try {
      await this.publishEvent(metadata, payload);
      // Log successful event publication
      logger.info(`Published LOAD_ASSIGNED event for load ${load.load_id} to driver ${driverId}`);
    } catch (error: any) {
      // Handle and log any errors that occur
      logger.error(`Failed to publish LOAD_ASSIGNED event for load ${load.load_id} to driver ${driverId}`, { error: error.message });
    }
  }

  /**
   * Creates and publishes an event when a load is unassigned from a driver
   * @param load The load data
   * @param driverId The ID of the unassigned driver
   * @returns Promise that resolves when the event is published
   */
  async createLoadUnassignedEvent(load: Load, driverId: string): Promise<void> {
    // Create event metadata with LOAD_UNASSIGNED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.LOAD_UNASSIGNED);

    // Create event payload with the load data and driver ID
    const payload: any = {
      load_id: load.load_id,
      driver_id: driverId,
    };

    // Publish the event to the Kafka service
    try {
      await this.publishEvent(metadata, payload);
      // Log successful event publication
      logger.info(`Published LOAD_UNASSIGNED event for load ${load.load_id} from driver ${driverId}`);
    } catch (error: any) {
      // Handle and log any errors that occur
      logger.error(`Failed to publish LOAD_UNASSIGNED event for load ${load.load_id} from driver ${driverId}`, { error: error.message });
    }
  }
    /**
   * Creates and publishes an event when a document is added to a load
   * @param loadId The ID of the load
   * @param document The document data
   * @returns Promise that resolves when the event is published
   */
    async createLoadDocumentAddedEvent(loadId: string, document: LoadDocument): Promise<void> {
      // Create event metadata with a custom event type for document addition
      const metadata: EventMetadata = this.createEventMetadata('LOAD_DOCUMENT_ADDED' as EventTypes);
  
      // Create event payload with the load ID and document data
      const payload: any = {
        load_id: loadId,
        document: document,
      };
  
      // Publish the event to the Kafka service
      try {
        await this.publishEvent(metadata, payload);
        // Log successful event publication
        logger.info(`Published LOAD_DOCUMENT_ADDED event for load ${loadId}`);
      } catch (error: any) {
        // Handle and log any errors that occur
        logger.error(`Failed to publish LOAD_DOCUMENT_ADDED event for load ${loadId}`, { error: error.message });
      }
    }

  /**
   * Helper method to create standardized event metadata
   * @param eventType The type of event
   * @returns The created event metadata
   */
  private createEventMetadata(eventType: EventTypes): EventMetadata {
    // Generate a unique event ID using UUID v4
    const eventId = uuidv4();
    // Set the event type from the parameter
    const eventTypeStr = eventType as string;
    // Set the event version to '1.0'
    const eventVersion = '1.0';
    // Set the event time to the current ISO timestamp
    const eventTime = new Date().toISOString();
    // Set the producer to the service name
    const producer = this.serviceName;
    // Generate a correlation ID using UUID v4
    const correlationId = uuidv4();
    // Set the category to LOAD
    const category = EventCategories.LOAD;

    // Return the constructed metadata object
    return {
      event_id: eventId,
      event_type: eventTypeStr,
      event_version: eventVersion,
      event_time: eventTime,
      producer: producer,
      correlation_id: correlationId,
      category: category,
    };
  }

  /**
   * Helper method to publish an event to Kafka
   * @param metadata The event metadata
   * @param payload The event payload
   * @returns Promise that resolves when the event is published
   */
  private async publishEvent(metadata: EventMetadata, payload: any): Promise<void> {
    // Construct the event object with metadata and payload
    const event: Event = {
      metadata: metadata,
      payload: payload,
    };

    // Call the Kafka service's produceEvent method with the event
    try {
      await this.kafkaService.produceEvent(event);
      // Log successful event publication
      logger.info(`Published event ${metadata.event_type} to topic ${LOAD_EVENTS}`);
    } catch (error: any) {
      // Handle and log any errors that occur
      logger.error(`Failed to publish event ${metadata.event_type} to topic ${LOAD_EVENTS}`, { error: error.message });
      throw error;
    }
  }
}