import { Model } from 'objection'; // v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { Position } from '../../../common/interfaces/position.interface';
import { isPointInPolygon } from '../../../common/utils/geo-utils';

/**
 * Model representing geographic bonus zones where drivers receive financial incentives
 * to address supply/demand imbalances in the freight network.
 */
class BonusZoneModel extends Model {
  // Properties
  id!: string;
  name!: string;
  boundary!: Array<{ latitude: number; longitude: number }>;
  multiplier!: number;
  reason!: string;
  startTime!: Date;
  endTime!: Date;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  /**
   * Defines the database table name for this model
   */
  static get tableName() {
    return 'bonus_zones';
  }

  /**
   * Defines the JSON schema for validation of bonus zone objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'boundary', 'multiplier', 'reason', 'startTime', 'endTime'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        boundary: {
          type: 'array',
          items: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 }
            }
          },
          minItems: 3 // A polygon needs at least 3 points
        },
        multiplier: { type: 'number', minimum: 1.0 },
        reason: { type: 'string', minLength: 1 },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' },
        isActive: { type: 'boolean', default: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines relationships to other models
   */
  static get relationMappings() {
    return {
      driverBonuses: {
        relation: Model.HasManyRelation,
        modelClass: () => require('../driver-bonus/driver-bonus.model').default,
        join: {
          from: 'bonus_zones.id',
          to: 'driver_bonuses.zoneId'
        }
      }
    };
  }

  /**
   * Lifecycle hook that runs before inserting a new bonus zone record
   */
  $beforeInsert() {
    this.id = this.id || uuidv4();
    this.isActive = this.isActive !== undefined ? this.isActive : true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Lifecycle hook that runs before updating a bonus zone record
   */
  $beforeUpdate() {
    this.updatedAt = new Date();
  }

  /**
   * Checks if the bonus zone is currently active based on time window and active flag
   * 
   * @returns True if the zone is currently active
   */
  isCurrentlyActive(): boolean {
    const now = new Date();
    return (
      this.isActive &&
      now >= this.startTime &&
      now <= this.endTime
    );
  }

  /**
   * Checks if a geographic point is within the bonus zone boundary
   * 
   * @param latitude - Latitude of the point to check
   * @param longitude - Longitude of the point to check
   * @returns True if the point is within the zone boundary
   */
  containsPoint(latitude: number, longitude: number): boolean {
    return isPointInPolygon(latitude, longitude, this.boundary);
  }

  /**
   * Creates a circular bonus zone around a center point with specified radius
   * 
   * @param name - Name of the bonus zone
   * @param centerLat - Latitude of the center point
   * @param centerLng - Longitude of the center point
   * @param radiusKm - Radius in kilometers
   * @param multiplier - Bonus multiplier value
   * @param reason - Reason for creating the bonus zone
   * @param startTime - Start time for the bonus zone
   * @param endTime - End time for the bonus zone
   * @returns A new bonus zone model with circular boundary
   */
  static createCircularZone(
    name: string,
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    multiplier: number,
    reason: string,
    startTime: Date,
    endTime: Date
  ): BonusZoneModel {
    // Import the createCirclePolygon function from geo-utils
    const { createCirclePolygon } = require('../../../common/utils/geo-utils');
    
    // Generate a circular polygon boundary
    const boundary = createCirclePolygon(centerLat, centerLng, radiusKm);
    
    // Create a new bonus zone instance
    return BonusZoneModel.fromJson({
      name,
      boundary,
      multiplier,
      reason,
      startTime,
      endTime,
      isActive: true
    });
  }
}

// Export the model as the default export
export default BonusZoneModel;

// Named exports for helper functions that wrap the model methods
/**
 * Helper function to check if a bonus zone is currently active
 */
export function isCurrentlyActive(zone: BonusZoneModel): boolean {
  return zone.isCurrentlyActive();
}

/**
 * Helper function to check if a point is within a bonus zone
 */
export function containsPoint(zone: BonusZoneModel, latitude: number, longitude: number): boolean {
  return zone.containsPoint(latitude, longitude);
}

/**
 * Helper function to create a circular bonus zone
 */
export const createCircularZone = BonusZoneModel.createCircularZone;