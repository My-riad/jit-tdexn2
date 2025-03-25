import { Model, raw } from 'objection'; // v2.2.0
import { PositionModel } from './position.model';
import { EntityType, GeofenceEventType } from '../../common/interfaces/position.interface';
import { EventTypes } from '../../common/constants/event-types';
import logger from '../../common/utils/logger';

/**
 * Database model for geofence events that record when entities enter, exit, or dwell within geofences
 */
export class GeofenceEventModel extends Model {
  event_id!: string;
  geofence_id!: string;
  entity_id!: string;
  entity_type!: EntityType;
  event_type!: GeofenceEventType;
  latitude!: number;
  longitude!: number;
  timestamp!: Date;
  metadata?: Record<string, any>;
  created_at!: Date;

  /**
   * Creates a new GeofenceEventModel instance
   */
  constructor() {
    super();
    this.created_at = new Date();
  }

  /**
   * Defines the database table name for this model
   */
  static get tableName(): string {
    return 'geofence_events';
  }

  /**
   * Defines the JSON schema for validation of geofence event objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['event_id', 'geofence_id', 'entity_id', 'entity_type', 'event_type', 'latitude', 'longitude', 'timestamp'],
      properties: {
        event_id: { type: 'string', format: 'uuid' },
        geofence_id: { type: 'string' },
        entity_id: { type: 'string' },
        entity_type: { type: 'string', enum: Object.values(EntityType) },
        event_type: { type: 'string', enum: Object.values(GeofenceEventType) },
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
        timestamp: { type: 'string', format: 'date-time' },
        metadata: { type: 'object' },
        created_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines the primary key column for the model
   */
  static get idColumn(): string {
    return 'event_id';
  }

  /**
   * Defines relationships to other models using a function to avoid circular dependencies
   */
  static get relationMappings() {
    return {
      geofence: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/geofence.model`,
        join: {
          from: 'geofence_events.geofence_id',
          to: 'geofences.geofence_id'
        }
      }
    };
  }

  /**
   * Retrieves events for a specific geofence within a time range
   * 
   * @param geofenceId - ID of the geofence
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @param options - Additional options (limit, offset, orderDirection)
   * @returns Array of geofence events for the specified geofence
   */
  static async getByGeofenceId(
    geofenceId: string,
    startTime: Date,
    endTime: Date,
    options: { limit?: number; offset?: number; orderDirection?: 'asc' | 'desc' } = {}
  ): Promise<GeofenceEventModel[]> {
    let query = this.query()
      .where('geofence_id', geofenceId)
      .where('timestamp', '>=', startTime)
      .where('timestamp', '<=', endTime);
    
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    
    if (options.offset !== undefined) {
      query = query.offset(options.offset);
    }
    
    const orderDirection = options.orderDirection || 'desc';
    query = query.orderBy('timestamp', orderDirection);
    
    return query;
  }

  /**
   * Retrieves events for a specific entity within a time range
   * 
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @param options - Additional options (limit, offset, orderDirection)
   * @returns Array of geofence events for the specified entity
   */
  static async getByEntityId(
    entityId: string,
    entityType: EntityType,
    startTime: Date,
    endTime: Date,
    options: { limit?: number; offset?: number; orderDirection?: 'asc' | 'desc' } = {}
  ): Promise<GeofenceEventModel[]> {
    let query = this.query()
      .where('entity_id', entityId)
      .where('entity_type', entityType)
      .where('timestamp', '>=', startTime)
      .where('timestamp', '<=', endTime);
    
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    
    if (options.offset !== undefined) {
      query = query.offset(options.offset);
    }
    
    const orderDirection = options.orderDirection || 'desc';
    query = query.orderBy('timestamp', orderDirection);
    
    return query;
  }

  /**
   * Retrieves events of a specific type within a time range
   * 
   * @param eventType - Type of the event
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @param options - Additional options (limit, offset, orderDirection)
   * @returns Array of geofence events of the specified type
   */
  static async getByEventType(
    eventType: GeofenceEventType,
    startTime: Date,
    endTime: Date,
    options: { limit?: number; offset?: number; orderDirection?: 'asc' | 'desc' } = {}
  ): Promise<GeofenceEventModel[]> {
    let query = this.query()
      .where('event_type', eventType)
      .where('timestamp', '>=', startTime)
      .where('timestamp', '<=', endTime);
    
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    
    if (options.offset !== undefined) {
      query = query.offset(options.offset);
    }
    
    const orderDirection = options.orderDirection || 'desc';
    query = query.orderBy('timestamp', orderDirection);
    
    return query;
  }

  /**
   * Retrieves the most recent event for a specific entity and geofence
   * 
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param geofenceId - ID of the geofence
   * @returns The most recent geofence event or null if none exists
   */
  static async getLatestByEntityAndGeofence(
    entityId: string,
    entityType: EntityType,
    geofenceId: string
  ): Promise<GeofenceEventModel | null> {
    const event = await this.query()
      .where('entity_id', entityId)
      .where('entity_type', entityType)
      .where('geofence_id', geofenceId)
      .orderBy('timestamp', 'desc')
      .first();
    
    return event || null;
  }

  /**
   * Creates a new geofence event
   * 
   * @param geofenceId - ID of the geofence
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param eventType - Type of the event
   * @param latitude - Latitude of the entity
   * @param longitude - Longitude of the entity
   * @param timestamp - Time when the event occurred
   * @param metadata - Additional data associated with the event
   * @returns The created geofence event
   */
  static async createEvent(
    geofenceId: string,
    entityId: string,
    entityType: EntityType,
    eventType: GeofenceEventType,
    latitude: number,
    longitude: number,
    timestamp: Date,
    metadata?: Record<string, any>
  ): Promise<GeofenceEventModel> {
    // Generate a UUID for the event
    const event_id = require('uuid').v4();
    
    const event = await this.query().insert({
      event_id,
      geofence_id: geofenceId,
      entity_id: entityId,
      entity_type: entityType,
      event_type: eventType,
      latitude,
      longitude,
      timestamp,
      metadata,
      created_at: new Date()
    });
    
    logger.info(`Created geofence event: ${entityType} ${entityId} ${eventType} geofence ${geofenceId}`, {
      eventType,
      entityId,
      entityType,
      geofenceId
    });
    
    return event;
  }

  /**
   * Converts the model instance to an event payload for the event bus
   */
  toEventPayload(): Record<string, any> {
    const eventType = this.event_type === GeofenceEventType.ENTER 
      ? EventTypes.GEOFENCE_ENTERED 
      : EventTypes.GEOFENCE_EXITED;
    
    return {
      event_type: eventType,
      entity_id: this.entity_id,
      entity_type: this.entity_type,
      geofence_id: this.geofence_id,
      position: {
        latitude: this.latitude,
        longitude: this.longitude
      },
      timestamp: this.timestamp,
      metadata: this.metadata || {},
      event_id: this.event_id
    };
  }

  /**
   * Converts the model to a JSON representation
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      timestamp: this.timestamp ? this.timestamp.toISOString() : null,
      created_at: this.created_at ? this.created_at.toISOString() : null
    };
  }
}