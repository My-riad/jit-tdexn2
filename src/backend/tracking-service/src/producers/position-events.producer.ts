import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0

import { KafkaService } from '../../../event-bus/src/services/kafka.service';
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import { Event, PositionEvent, EventProducer } from '../../../common/interfaces/event.interface';
import { Position, EntityType, PositionUpdate, HistoricalPosition } from '../../../common/interfaces/position.interface';
import logger from '../../../common/utils/logger';

/**
 * Producer class responsible for publishing position-related events to the Kafka event bus
 */
export class PositionEventsProducer implements EventProducer {
  /**
   * Creates a new PositionEventsProducer instance
   * @param kafkaService The Kafka service for publishing events to the event bus
   */
  constructor(private kafkaService: KafkaService) {
    // Initialize the Kafka service for event production
    this.kafkaService = kafkaService;
    // Log the initialization of the position events producer
    logger.info('Position events producer initialized.');
  }

  /**
   * Publishes a position update event to the Kafka event bus
   * @param positionUpdate The position update data
   * @returns A promise that resolves when the event is published
   */
  async publishPositionUpdate(positionUpdate: PositionUpdate): Promise<void> {
    // Create event metadata with a unique ID, event type, timestamp, etc.
    const eventMetadata = this.createPositionEventMetadata(EventTypes.POSITION_UPDATED);

    // Create the event payload from the position update data
    const eventPayload = {
      entity_id: positionUpdate.entity_id,
      entity_type: positionUpdate.entity_type,
      latitude: positionUpdate.latitude,
      longitude: positionUpdate.longitude,
      heading: positionUpdate.heading,
      speed: positionUpdate.speed,
      accuracy: positionUpdate.accuracy,
      source: positionUpdate.source,
      timestamp: positionUpdate.timestamp.toISOString(),
      additional_data: null
    };

    // Construct the complete position event with metadata and payload
    const positionEvent: PositionEvent = {
      metadata: eventMetadata,
      payload: eventPayload
    };

    try {
      // Publish the event to Kafka using the kafkaService
      await this.kafkaService.produceEvent(positionEvent);

      // Log the successful publication of the position update event
      logger.info('Published position update event', {
        eventId: eventMetadata.event_id,
        entityId: positionUpdate.entity_id,
        entityType: positionUpdate.entity_type
      });
    } catch (error: any) {
      // Handle any errors that occur during event publication
      logger.error('Failed to publish position update event', {
        eventId: eventMetadata.event_id,
        entityId: positionUpdate.entity_id,
        entityType: positionUpdate.entity_type,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Publishes a historical position record event to the Kafka event bus
   * @param historicalPosition The historical position data
   * @returns A promise that resolves when the event is published
   */
  async publishHistoricalPosition(historicalPosition: HistoricalPosition): Promise<void> {
    // Create event metadata with a unique ID, event type, timestamp, etc.
    const eventMetadata = this.createPositionEventMetadata(EventTypes.POSITION_HISTORY_RECORDED);

    // Create the event payload from the historical position data
    const eventPayload = {
      position_id: historicalPosition.position_id,
      entity_id: historicalPosition.entity_id,
      entity_type: historicalPosition.entity_type,
      latitude: historicalPosition.latitude,
      longitude: historicalPosition.longitude,
      heading: historicalPosition.heading,
      speed: historicalPosition.speed,
      accuracy: historicalPosition.accuracy,
      source: historicalPosition.source,
      recorded_at: historicalPosition.recorded_at.toISOString(),
      storage_tier: null
    };

    // Construct the complete position event with metadata and payload
    const positionEvent: PositionEvent = {
      metadata: eventMetadata,
      payload: eventPayload
    };

    try {
      // Publish the event to Kafka using the kafkaService
      await this.kafkaService.produceEvent(positionEvent);

      // Log the successful publication of the historical position event
      logger.info('Published historical position event', {
        eventId: eventMetadata.event_id,
        entityId: historicalPosition.entity_id,
        entityType: historicalPosition.entity_type
      });
    } catch (error: any) {
      // Handle any errors that occur during event publication
      logger.error('Failed to publish historical position event', {
        eventId: eventMetadata.event_id,
        entityId: historicalPosition.entity_id,
        entityType: historicalPosition.entity_type,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Creates standardized metadata for position events
   * @param eventType The event type
   * @returns Event metadata object
   */
  private createPositionEventMetadata(eventType: string): any {
    // Generate a unique event ID using UUID
    const eventId = uuidv4();

    // Set the event version (e.g., '1.0')
    const eventVersion = '1.0';

    // Set the current timestamp in ISO format
    const eventTime = new Date().toISOString();

    // Set the producer name ('tracking-service')
    const producer = 'tracking-service';

    // Generate a correlation ID for event tracing
    const correlationId = uuidv4();

    // Set the event category to POSITION
    const category = EventCategories.POSITION;

    // Return the complete metadata object
    return {
      event_id: eventId,
      event_type: eventType,
      event_version: eventVersion,
      event_time: eventTime,
      producer: producer,
      correlation_id: correlationId,
      category: category
    };
  }
}