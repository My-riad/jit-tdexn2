/**
 * Driver Achievement Model
 * 
 * This model represents the relationship between drivers and achievements they've earned.
 * It tracks when achievements were earned and stores additional achievement-related data.
 * It extends Objection.js Model class and implements the DriverAchievement interface.
 */

import { Model } from 'objection'; // v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { DriverAchievement } from '../../../common/interfaces/achievement.interface';
import AchievementModel from './achievement.model';

/**
 * DriverAchievementModel represents driver-achievement relationships in the database
 * It tracks which drivers have earned which achievements and when
 */
export default class DriverAchievementModel extends Model implements DriverAchievement {
  // Properties from DriverAchievement interface
  id!: string;
  driverId!: string;
  achievementId!: string;
  earnedAt!: Date;
  achievementData!: Record<string, any>;
  achievement!: AchievementModel;
  createdAt!: Date;
  updatedAt!: Date;

  // Constructor
  constructor() {
    super();
    // Properties are set through JSON parsing
  }

  /**
   * Name of the database table
   */
  static get tableName(): string {
    return 'driver_achievements';
  }

  /**
   * JSON schema for validation
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['driverId', 'achievementId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        driverId: { type: 'string', format: 'uuid' },
        achievementId: { type: 'string', format: 'uuid' },
        earnedAt: { type: 'string', format: 'date-time' },
        achievementData: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Relation mappings to other models
   */
  static relationMappings = () => {
    return {
      achievement: {
        relation: Model.BelongsToOneRelation,
        modelClass: AchievementModel,
        join: {
          from: 'driver_achievements.achievement_id',
          to: 'achievements.id'
        }
      }
    };
  };

  /**
   * Lifecycle hook that runs before inserting a new driver achievement
   */
  $beforeInsert(): void {
    // Generate UUID if not provided
    this.id = this.id || uuidv4();
    
    // Set earnedAt if not provided
    this.earnedAt = this.earnedAt || new Date();
    
    // Set timestamps
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * Lifecycle hook that runs before updating a driver achievement
   */
  $beforeUpdate(): void {
    // Update the updatedAt timestamp
    this.updatedAt = new Date();
  }
}