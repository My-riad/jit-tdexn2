import { EventConsumer, LoadEvent } from '../../../common/interfaces/event.interface';
import { EventTypes } from '../../../common/constants/event-types';
import { LoadAssignment } from '../../../common/interfaces/load.interface';
import ScoreService from '../services/score.service';
import AchievementService from '../services/achievement.service';
import AchievementEventsProducer from '../producers/achievement-events.producer';
import logger from '../../../common/utils/logger';
import KafkaService from '../../../event-bus/src/services/kafka.service';

/**
 * Consumer class that processes load completion events to update driver gamification metrics
 */
export class LoadCompletionConsumer implements EventConsumer {
  /**
   * Creates a new LoadCompletionConsumer instance
   * @param scoreService The score service instance
   * @param achievementService The achievement service instance
   * @param eventProducer The event producer instance
   */
  constructor(
    private scoreService: ScoreService,
    private achievementService: AchievementService,
    private eventProducer: AchievementEventsProducer
  ) {
    // Store the provided scoreService instance
    this.scoreService = scoreService;
    // Store the provided achievementService instance
    this.achievementService = achievementService;
    // Store the provided eventProducer instance
    this.eventProducer = eventProducer;
  }

  /**
   * Processes a load completion event
   * @param event The event to consume
   * @returns Promise that resolves when the event is processed
   */
  async consumeEvent(event: LoadEvent): Promise<void> {
    // Verify that the event is a LOAD_COMPLETED event
    if (!this.validateEvent(event)) {
      logger.warn(`Invalid event: ${event.metadata.event_type}`);
      return;
    }

    try {
      // Extract the load assignment from the event payload
      const loadAssignment: LoadAssignment = this.extractLoadAssignment(event);

      // Extract the driver ID from the load assignment
      const driverId: string = loadAssignment.driver_id;

      // Extract additional metrics from the event payload
      const additionalMetrics: Record<string, any> = this.extractAdditionalMetrics(event);

      // Calculate the driver's efficiency score using the scoreService
      await this.scoreService.calculateScoreForLoad(driverId, loadAssignment, additionalMetrics);

      // Check if the driver has earned any new achievements using the achievementService
      await this.achievementService.checkAchievements(driverId);

      // Log the successful processing of the event
      logger.info(`Successfully processed load completion event for driver ${driverId}`, {
        driverId,
        loadId: loadAssignment.load_id,
        assignmentId: loadAssignment.assignment_id,
        eventId: event.metadata.event_id
      });
    } catch (error: any) {
      // Handle any errors that occur during event processing
      logger.error(`Error processing load completion event`, {
        error: error.message,
        eventId: event.metadata.event_id
      });
      throw error; // Re-throw the error to trigger retry or DLQ
    }
  }

  /**
   * Validates that the event is a load completion event
   * @param event The event to consume
   * @returns True if the event is valid, false otherwise
   */
  private validateEvent(event: LoadEvent): boolean {
    // Check that the event has metadata
    if (!event.metadata) {
      logger.warn('Event missing metadata');
      return false;
    }

    // Check that the event type is LOAD_COMPLETED
    if (event.metadata.event_type !== EventTypes.LOAD_COMPLETED) {
      logger.warn(`Incorrect event type: ${event.metadata.event_type}`);
      return false;
    }

    // Check that the event has a payload
    if (!event.payload) {
      logger.warn('Event missing payload');
      return false;
    }

    // Check that the payload contains a load assignment
    if (!event.payload.assignment_id) {
      logger.warn('Event payload missing load assignment');
      return false;
    }

    // Return true if all checks pass, false otherwise
    return true;
  }

  /**
   * Extracts the load assignment from the event payload
   * @param event The event to consume
   * @returns The load assignment from the event payload
   */
  private extractLoadAssignment(event: LoadEvent): LoadAssignment {
    // Extract and return the load assignment from the event payload
    return event.payload as LoadAssignment;
  }

  /**
   * Extracts additional metrics from the event payload
   * @param event The event to consume
   * @returns Additional metrics for score calculation
   */
  private extractAdditionalMetrics(event: LoadEvent): Record<string, any> {
    // Extract metrics like empty miles percentage, fuel consumption, etc.
    const {
      actual_pickup_time,
      actual_delivery_time,
      total_distance,
      empty_miles,
      fuel_used
    } = event.payload;

    // Return the extracted metrics as a record object
    return {
      actualPickupTime: actual_pickup_time,
      actualDeliveryTime: actual_delivery_time,
      totalDistance: total_distance,
      emptyMiles: empty_miles,
      fuelUsed: fuel_used
    };
  }
}

export default LoadCompletionConsumer;