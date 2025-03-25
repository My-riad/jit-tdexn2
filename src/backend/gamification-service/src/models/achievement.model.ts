/**
 * Achievement Model
 * 
 * This model represents achievements that drivers can earn based on their 
 * performance metrics like efficiency, network contribution, on-time delivery, etc.
 * It extends Objection.js Model class and implements the Achievement interface
 * from the common interfaces.
 */

import { Model } from 'objection'; // v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { 
  Achievement, 
  AchievementCategory, 
  AchievementLevel, 
  AchievementCriteria 
} from '../../../common/interfaces/achievement.interface';

/**
 * AchievementModel represents achievement entities in the database
 * Each achievement has criteria that drivers must meet to earn it
 */
export default class AchievementModel extends Model implements Achievement {
  // Properties from Achievement interface
  id!: string;
  name!: string;
  description!: string;
  category!: AchievementCategory;
  level!: AchievementLevel;
  points!: number;
  badgeImageUrl!: string;
  criteria!: AchievementCriteria;
  isActive!: boolean;
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
    return 'achievements';
  }

  /**
   * JSON schema for validation
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'description', 'category', 'level', 'points', 'criteria', 'isActive'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', minLength: 1, maxLength: 500 },
        category: { 
          type: 'string', 
          enum: Object.values(AchievementCategory) 
        },
        level: { 
          type: 'string', 
          enum: Object.values(AchievementLevel) 
        },
        points: { type: 'integer', minimum: 1 },
        badgeImageUrl: { type: ['string', 'null'], format: 'uri' },
        criteria: { 
          type: 'object',
          required: ['metricType', 'threshold', 'timeframe', 'comparisonOperator'],
          properties: {
            metricType: { type: 'string' },
            threshold: { type: 'number' },
            timeframe: { type: 'string' },
            comparisonOperator: { type: 'string' },
            additionalParams: { type: 'object' }
          }
        },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Relation mappings to other models
   */
  static relationMappings = () => {
    // This will be lazily loaded to avoid circular dependencies
    const DriverAchievementModel = require('./driver-achievement.model').default;

    return {
      driverAchievements: {
        relation: Model.HasManyRelation,
        modelClass: DriverAchievementModel,
        join: {
          from: 'achievements.id',
          to: 'driver_achievements.achievement_id'
        }
      }
    };
  };

  /**
   * Lifecycle hook that runs before inserting a new achievement
   */
  $beforeInsert(): void {
    // Generate UUID if not provided
    this.id = this.id || uuidv4();
    
    // Default values
    this.isActive = this.isActive !== undefined ? this.isActive : true;
    
    // Set timestamps
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * Lifecycle hook that runs before updating an achievement
   */
  $beforeUpdate(): void {
    // Update the updatedAt timestamp
    this.updatedAt = new Date();
  }
}