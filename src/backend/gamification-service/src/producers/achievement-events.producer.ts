import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0

import {
  EventProducer,
  Event,
  GamificationEvent
} from '../../../common/interfaces/event.interface';
import {
  EventTypes,
  EventCategories
} from '../../../common/constants/event-types';
import KafkaService from '../../../event-bus/src/services/kafka.service';
import { Achievement, DriverAchievement } from '../../../common/interfaces/achievement.interface';
import logger from '../../../common/utils/logger';

/**
 * Producer class for achievement-related events in the gamification system
 */
export default class AchievementEventsProducer implements EventProducer {
  /**
   * Creates a new AchievementEventsProducer instance
   * @param kafkaService The Kafka service instance
   */
  constructor(private kafkaService: KafkaService) {
    // Store the provided Kafka service instance for event production
    this.kafkaService = kafkaService;
  }

  /**
   * Produces an event to the Kafka event bus
   * @param event The event to produce
   * @returns Promise that resolves when the event is produced
   */
  async produceEvent(event: Event): Promise<void> {
    try {
      // Call the produceEvent method on the Kafka service
      await this.kafkaService.produceEvent(event);
      // Log successful event production
      logger.info(`Successfully produced event: ${event.metadata.event_type}`, { eventId: event.metadata.event_id });
    } catch (error: any) {
      // Handle and log any errors that occur during event production
      logger.error(`Failed to produce event: ${event.metadata.event_type}`, { error: error.message, eventId: event.metadata.event_id });
      throw error;
    }
  }

  /**
   * Publishes an event when a driver earns an achievement
   * @param driverId The ID of the driver who earned the achievement
   * @param achievement The achievement that was earned
   * @param driverAchievement The driver achievement details
   * @returns Promise that resolves when the event is published
   */
  async publishAchievementEarned(driverId: string, achievement: Achievement, driverAchievement: DriverAchievement): Promise<void> {
    try {
      // Create an event with ACHIEVEMENT_EARNED event type
      const event: GamificationEvent = {
        metadata: this.createEventMetadata(EventTypes.DRIVER_ACHIEVEMENT_EARNED),
        payload: {
          driver_id: driverId,
          achievement_id: achievement.id,
          achievement_name: achievement.name,
          achievement_category: achievement.category,
          achievement_level: achievement.level,
          points: achievement.points,
          badge_image_url: achievement.badgeImageUrl,
          earned_at: driverAchievement.earnedAt.toISOString(),
          achievement_data: driverAchievement.achievementData || null
        }
      };

      // Call produceEvent to publish the event
      await this.produceEvent(event);

      // Log successful event publication
      logger.info(`Published ACHIEVEMENT_EARNED event for driver ${driverId}`, { achievementId: achievement.id, eventId: event.metadata.event_id });
    } catch (error: any) {
      // Handle and log any errors that occur during event production
      logger.error(`Failed to publish ACHIEVEMENT_EARNED event for driver ${driverId}`, { error: error.message, achievementId: achievement.id });
      throw error;
    }
  }

  /**
   * Publishes an event when an achievement is revoked from a driver
   * @param driverId The ID of the driver from whom the achievement was revoked
   * @param achievement The achievement that was revoked
   * @param reason The reason for revoking the achievement
   * @returns Promise that resolves when the event is published
   */
  async publishAchievementRevoked(driverId: string, achievement: Achievement, reason: string): Promise<void> {
    try {
      // Create an event with appropriate event type for revocation
      const event: GamificationEvent = {
        metadata: this.createEventMetadata(EventTypes.DRIVER_ACHIEVEMENT_EARNED), // TODO: Create a new event type for achievement revoked
        payload: {
          driver_id: driverId,
          achievement_id: achievement.id,
          achievement_name: achievement.name,
          achievement_category: achievement.category,
          achievement_level: achievement.level,
          points: achievement.points,
          badge_image_url: achievement.badgeImageUrl,
          earned_at: new Date().toISOString(), // TODO: Add a revoked_at field
          reason: reason
        }
      };

      // Call produceEvent to publish the event
      await this.produceEvent(event);

      // Log successful event publication
      logger.info(`Published ACHIEVEMENT_REVOKED event for driver ${driverId}`, { achievementId: achievement.id, eventId: event.metadata.event_id });
    } catch (error: any) {
      // Handle and log any errors that occur during event production
      logger.error(`Failed to publish ACHIEVEMENT_REVOKED event for driver ${driverId}`, { error: error.message, achievementId: achievement.id });
      throw error;
    }
  }

  /**
   * Publishes an event when the achievement leaderboard is updated
   * @param leaderboardId The ID of the leaderboard that was updated
   * @param leaderboardData The updated leaderboard data
   * @returns Promise that resolves when the event is published
   */
  async publishLeaderboardUpdated(leaderboardId: string, leaderboardData: object): Promise<void> {
    try {
      // Create an event with LEADERBOARD_UPDATED event type
      const event: GamificationEvent = {
        metadata: this.createEventMetadata(EventTypes.LEADERBOARD_UPDATED),
        payload: {
          leaderboard_id: leaderboardId,
          leaderboard_data: leaderboardData
        }
      };

      // Call produceEvent to publish the event
      await this.produceEvent(event);

      // Log successful event publication
      logger.info(`Published LEADERBOARD_UPDATED event for leaderboard ${leaderboardId}`, { eventId: event.metadata.event_id });
    } catch (error: any) {
      // Handle and log any errors that occur during event production
      logger.error(`Failed to publish LEADERBOARD_UPDATED event for leaderboard ${leaderboardId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Creates standardized event metadata for achievement events
   * @param eventType The event type
   * @returns Event metadata object
   */
  private createEventMetadata(eventType: EventTypes): {
    event_id: string;
    event_type: EventTypes;
    event_version: string;
    event_time: string;
    producer: string;
    correlation_id: string;
    category: EventCategories;
  } {
    // Generate a unique event ID using UUID
    const eventId = uuidv4();

    // Set event metadata with appropriate category and correlation ID
    return {
      event_id: eventId,
      event_type: eventType,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: 'gamification-service',
      correlation_id: uuidv4(), // Generate a unique correlation ID using UUID
      category: EventCategories.GAMIFICATION
    };
  }
}