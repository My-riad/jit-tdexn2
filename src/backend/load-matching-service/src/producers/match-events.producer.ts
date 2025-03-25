import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0

import {
  Event,
  EventProducer,
  EventMetadata
} from '../../../common/interfaces/event.interface';
import {
  EventTypes,
  EventCategories
} from '../../../common/constants/event-types';
import {
  Match,
  MatchStatus
} from '../interfaces/match.interface';
import KafkaService from '../../../event-bus/src/services/kafka.service';
import logger from '../../../common/utils/logger';

/**
 * Service responsible for producing match-related events to the event bus
 */
export class MatchEventsProducer implements EventProducer {
  private readonly serviceName: string = 'MatchEventsProducer';

  /**
   * Creates a new MatchEventsProducer instance
   * @param kafkaService The Kafka service for event production
   */
  constructor(private kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
  }

  /**
   * Produces an event to the event bus
   * @param event The event to produce
   * @returns Promise that resolves when the event is produced
   */
  async produceEvent(event: Event): Promise<void> {
    logger.info(`Producing event: ${event.metadata.event_type}`, { eventId: event.metadata.event_id });
    try {
      await this.kafkaService.produceEvent(event);
      logger.info(`Successfully produced event: ${event.metadata.event_type}`, { eventId: event.metadata.event_id });
    } catch (error: any) {
      logger.error(`Failed to produce event: ${event.metadata.event_type}`, { eventId: event.metadata.event_id, error: error.message });
      throw error;
    }
  }

  /**
   * Produces an event when a match is created
   * @param match The match data
   * @returns Promise that resolves when the event is produced
   */
  async produceMatchCreatedEvent(match: Match): Promise<void> {
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.ASSIGNMENT_CREATED);
    const payload = {
      match_id: match.match_id,
      load_id: match.load_id,
      driver_id: match.driver_id,
      vehicle_id: match.vehicle_id,
      status: match.status,
      efficiency_score: match.efficiency_score
    };

    const event: Event = {
      metadata,
      payload
    };

    await this.produceEvent(event);
  }

  /**
   * Produces an event when a match is updated
   * @param match The match data
   * @returns Promise that resolves when the event is produced
   */
  async produceMatchUpdatedEvent(match: Match): Promise<void> {
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.ASSIGNMENT_UPDATED);
    const payload = {
      match_id: match.match_id,
      load_id: match.load_id,
      driver_id: match.driver_id,
      vehicle_id: match.vehicle_id,
      status: match.status,
      efficiency_score: match.efficiency_score
    };

    const event: Event = {
      metadata,
      payload
    };

    await this.produceEvent(event);
  }

  /**
   * Produces an event when a match is accepted by a driver
   * @param match The match data
   * @returns Promise that resolves when the event is produced
   */
  async produceMatchAcceptedEvent(match: Match): Promise<void> {
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.ASSIGNMENT_CREATED);
    const payload = {
      match_id: match.match_id,
      load_id: match.load_id,
      driver_id: match.driver_id,
      vehicle_id: match.vehicle_id,
      status: match.status,
      efficiency_score: match.efficiency_score
    };

    const event: Event = {
      metadata,
      payload
    };

    await this.produceEvent(event);
  }

  /**
   * Produces an event when a match is declined by a driver
   * @param match The match data
   * @returns Promise that resolves when the event is produced
   */
  async produceMatchDeclinedEvent(match: Match): Promise<void> {
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.ASSIGNMENT_CANCELLED);
    const payload = {
      match_id: match.match_id,
      load_id: match.load_id,
      driver_id: match.driver_id,
      vehicle_id: match.vehicle_id,
      status: match.status,
      efficiency_score: match.efficiency_score
    };

    const event: Event = {
      metadata,
      payload
    };

    await this.produceEvent(event);
  }

  /**
   * Produces an event when a match reservation expires
   * @param match The match data
   * @returns Promise that resolves when the event is produced
   */
  async produceMatchExpiredEvent(match: Match): Promise<void> {
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.ASSIGNMENT_CANCELLED);
    const payload = {
      match_id: match.match_id,
      load_id: match.load_id,
      driver_id: match.driver_id,
      vehicle_id: match.vehicle_id,
      status: match.status,
      efficiency_score: match.efficiency_score
    };

    const event: Event = {
      metadata,
      payload
    };

    await this.produceEvent(event);
  }

  /**
   * Produces an event when a match is cancelled
   * @param match The match data
   * @returns Promise that resolves when the event is produced
   */
  async produceMatchCancelledEvent(match: Match): Promise<void> {
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.ASSIGNMENT_CANCELLED);
    const payload = {
      match_id: match.match_id,
      load_id: match.load_id,
      driver_id: match.driver_id,
      vehicle_id: match.vehicle_id,
      status: match.status,
      efficiency_score: match.efficiency_score
    };

    const event: Event = {
      metadata,
      payload
    };

    await this.produceEvent(event);
  }

  /**
   * Creates standardized event metadata
   * @param eventType The event type
   * @returns Event metadata object
   */
  private createEventMetadata(eventType: EventTypes): EventMetadata {
    const event_id: string = uuidv4();
    const event_version: string = '1.0';
    const event_time: string = new Date().toISOString();
    const producer: string = this.serviceName;
    const correlation_id: string = uuidv4();
    const category: EventCategories = EventCategories.ASSIGNMENT;

    return {
      event_id,
      event_type: eventType,
      event_version,
      event_time,
      producer,
      correlation_id,
      category
    };
  }
}