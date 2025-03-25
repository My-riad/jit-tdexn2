import { Schema } from 'avsc'; // avsc@5.7.0
import { 
  EventTypes, 
  EventCategories 
} from '../../../common/constants/event-types';
import { 
  AchievementCategory, 
  AchievementLevel 
} from '../../../common/interfaces/achievement.interface';
import { GAMIFICATION_EVENTS } from '../config/topics';

/**
 * Common metadata schema for all gamification events
 */
export const gamificationEventMetadataSchema: Schema = {
  type: 'record',
  name: 'GamificationEventMetadata',
  fields: [
    { name: 'event_id', type: 'string' },
    { name: 'event_type', type: 'string' },
    { name: 'event_version', type: 'string' },
    { name: 'event_time', type: 'string' },
    { name: 'producer', type: 'string' },
    { name: 'correlation_id', type: 'string' },
    { name: 'category', type: 'string', default: EventCategories.GAMIFICATION }
  ]
};

/**
 * Schema for SCORE_UPDATED event payload
 * Describes a driver's efficiency score update
 */
export const scoreUpdatedSchema: Schema = {
  type: 'record',
  name: 'ScoreUpdatedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'score_id', type: 'string' },
    { name: 'total_score', type: 'double' },
    { name: 'empty_miles_score', type: 'double' },
    { name: 'network_contribution_score', type: 'double' },
    { name: 'on_time_score', type: 'double' },
    { name: 'hub_utilization_score', type: 'double' },
    { name: 'fuel_efficiency_score', type: 'double' },
    { name: 'score_factors', type: { type: 'map', values: 'double' } },
    { name: 'previous_total_score', type: ['null', 'double'], default: null },
    { name: 'calculated_at', type: 'string' }
  ]
};

/**
 * Schema for ACHIEVEMENT_EARNED event payload
 * Describes when a driver earns an achievement
 */
export const achievementEarnedSchema: Schema = {
  type: 'record',
  name: 'AchievementEarnedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'achievement_id', type: 'string' },
    { name: 'achievement_name', type: 'string' },
    { name: 'achievement_category', type: 'string' },
    { name: 'achievement_level', type: 'string' },
    { name: 'points', type: 'int' },
    { name: 'badge_image_url', type: 'string' },
    { name: 'earned_at', type: 'string' },
    { 
      name: 'achievement_data', 
      type: ['null', { 
        type: 'map', 
        values: ['null', 'string', 'int', 'double', 'boolean'] 
      }],
      default: null
    }
  ]
};

/**
 * Schema for LEADERBOARD_UPDATED event payload
 * Describes updates to driver leaderboards
 */
export const leaderboardUpdatedSchema: Schema = {
  type: 'record',
  name: 'LeaderboardUpdatedPayload',
  fields: [
    { name: 'leaderboard_id', type: 'string' },
    { name: 'leaderboard_type', type: 'string' },
    { name: 'timeframe', type: 'string' },
    { name: 'region', type: ['null', 'string'], default: null },
    { name: 'start_period', type: 'string' },
    { name: 'end_period', type: 'string' },
    { 
      name: 'top_entries', 
      type: { 
        type: 'array', 
        items: {
          type: 'record',
          name: 'LeaderboardEntry',
          fields: [
            { name: 'driver_id', type: 'string' },
            { name: 'rank', type: 'int' },
            { name: 'score', type: 'double' },
            { name: 'previous_rank', type: ['null', 'int'], default: null },
            { name: 'bonus_amount', type: ['null', 'double'], default: null }
          ]
        }
      }
    },
    { name: 'updated_at', type: 'string' }
  ]
};

/**
 * Schema for BONUS_ZONE_CREATED event payload
 * Describes when a new bonus zone is created
 */
export const bonusZoneCreatedSchema: Schema = {
  type: 'record',
  name: 'BonusZoneCreatedPayload',
  fields: [
    { name: 'zone_id', type: 'string' },
    { name: 'name', type: 'string' },
    { 
      name: 'boundary', 
      type: { 
        type: 'array', 
        items: {
          type: 'record',
          name: 'Coordinate',
          fields: [
            { name: 'latitude', type: 'double' },
            { name: 'longitude', type: 'double' }
          ]
        }
      }
    },
    {
      name: 'center',
      type: {
        type: 'record',
        name: 'CenterPoint',
        fields: [
          { name: 'latitude', type: 'double' },
          { name: 'longitude', type: 'double' }
        ]
      }
    },
    { name: 'radius_miles', type: 'double' },
    { name: 'multiplier', type: 'double' },
    { name: 'reason', type: 'string' },
    { name: 'start_time', type: 'string' },
    { name: 'end_time', type: 'string' },
    { name: 'created_at', type: 'string' },
    { name: 'created_by', type: ['null', 'string'], default: null }
  ]
};

/**
 * Schema for BONUS_ZONE_UPDATED event payload
 * Describes updates to an existing bonus zone
 */
export const bonusZoneUpdatedSchema: Schema = {
  type: 'record',
  name: 'BonusZoneUpdatedPayload',
  fields: [
    { name: 'zone_id', type: 'string' },
    { name: 'multiplier', type: 'double' },
    { name: 'end_time', type: 'string' },
    { name: 'reason', type: ['null', 'string'], default: null },
    { name: 'updated_at', type: 'string' },
    { name: 'updated_by', type: ['null', 'string'], default: null }
  ]
};

/**
 * Schema for BONUS_ZONE_EXPIRED event payload
 * Describes when a bonus zone expires
 */
export const bonusZoneExpiredSchema: Schema = {
  type: 'record',
  name: 'BonusZoneExpiredPayload',
  fields: [
    { name: 'zone_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'expiration_reason', type: 'string' },
    { name: 'expired_at', type: 'string' }
  ]
};

/**
 * Mapping of event types to their corresponding schemas
 */
export const gamificationEventSchemas = {
  [EventTypes.SCORE_UPDATED]: scoreUpdatedSchema,
  [EventTypes.ACHIEVEMENT_EARNED]: achievementEarnedSchema,
  [EventTypes.LEADERBOARD_UPDATED]: leaderboardUpdatedSchema,
  [EventTypes.BONUS_ZONE_CREATED]: bonusZoneCreatedSchema,
  [EventTypes.BONUS_ZONE_UPDATED]: bonusZoneUpdatedSchema,
  [EventTypes.BONUS_ZONE_EXPIRED]: bonusZoneExpiredSchema
};

/**
 * Default export containing the topic name and all schemas
 */
export default {
  topic: GAMIFICATION_EVENTS,
  schemas: gamificationEventSchemas
};