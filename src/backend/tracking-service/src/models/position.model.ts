import { Model, raw } from 'objection'; // v2.2.0
import knexPostgis from 'knex-postgis'; // v0.14.1
import * as uuid from 'uuid'; // v8.3.2

import {
  EntityType,
  PositionSource,
  Position,
  EntityPosition,
  PositionUpdate,
  NearbyQuery
} from '../../common/interfaces/position.interface';
import { getKnexInstance } from '../../common/config/database.config';
import { calculateDistance } from '../../common/utils/geo-utils';
import logger from '../../common/utils/logger';
import { HistoricalPositionModel } from './historical-position.model';

/**
 * Database model for real-time position data with geospatial capabilities.
 * This model represents the current positions of entities (drivers, vehicles) and
 * provides methods for updating positions, querying nearby entities, and publishing position events.
 */
export class PositionModel extends Model {
  position_id!: string;
  entity_id!: string;
  entity_type!: EntityType;
  latitude!: number;
  longitude!: number;
  heading!: number;
  speed!: number;
  accuracy!: number;
  source!: PositionSource;
  timestamp!: Date;
  updated_at!: Date;

  /**
   * Creates a new PositionModel instance
   */
  constructor() {
    super();
    // Set default values for optional fields
    this.heading = 0;
    this.speed = 0;
    this.accuracy = 0;
  }

  /**
   * Defines the database table name for this model
   */
  static get tableName(): string {
    return 'positions';
  }

  /**
   * Defines the JSON schema for validation of position objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['position_id', 'entity_id', 'entity_type', 'latitude', 'longitude', 'timestamp'],
      properties: {
        position_id: { type: 'string', format: 'uuid' },
        entity_id: { type: 'string' },
        entity_type: { type: 'string', enum: Object.values(EntityType) },
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
        heading: { type: 'number', minimum: 0, maximum: 359 },
        speed: { type: 'number', minimum: 0 },
        accuracy: { type: 'number', minimum: 0 },
        source: { type: 'string', enum: Object.values(PositionSource) },
        timestamp: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines the primary key column for the model
   */
  static get idColumn(): string {
    return 'position_id';
  }

  /**
   * Gets the current position for a specific entity
   * 
   * @param entityId - ID of the entity to get position for
   * @param entityType - Type of the entity
   * @returns The current position or null if not found
   */
  static async getByEntityId(
    entityId: string,
    entityType: EntityType
  ): Promise<PositionModel | null> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }

    // Create a query for the specified entity
    const position = await this.query()
      .where('entity_id', entityId)
      .where('entity_type', entityType)
      .first();

    return position || null;
  }

  /**
   * Gets entities near a specific location
   * 
   * @param query - Parameters for querying nearby entities
   * @returns Array of positions for entities within the specified radius
   */
  static async getNearbyEntities(query: NearbyQuery): Promise<PositionModel[]> {
    // Validate input parameters
    if (!query || query.latitude === undefined || query.longitude === undefined || !query.radius) {
      throw new Error('Latitude, longitude, and radius are required for nearby query');
    }

    // Get a reference to the Knex instance and PostGIS
    const knex = getKnexInstance();
    const st = knexPostgis(knex);

    // Create a point geometry from the provided coordinates
    const point = st.makePoint(query.longitude, query.latitude);
    
    // Build the query using PostGIS ST_DWithin function
    let queryBuilder = this.query()
      .whereRaw(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(?, 4326)::geography,
          ?
        )`,
        [point, query.radius * 1609.34] // Convert miles to meters for PostGIS
      );

    // Apply entity_type filter if provided
    if (query.entity_type) {
      queryBuilder = queryBuilder.where('entity_type', query.entity_type);
    }

    // Apply limit if provided
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    return queryBuilder;
  }

  /**
   * Updates the position of an entity, creating a new record if it doesn't exist
   * 
   * @param positionUpdate - Position update data
   * @returns The updated position model
   */
  static async updatePosition(positionUpdate: PositionUpdate): Promise<PositionModel> {
    // Validate input parameters
    if (!positionUpdate.entity_id || !positionUpdate.entity_type || 
        positionUpdate.latitude === undefined || positionUpdate.longitude === undefined) {
      throw new Error('Entity ID, type, latitude, and longitude are required');
    }

    // Start a transaction to ensure data consistency
    const trx = await this.startTransaction();

    try {
      // Check if a position record already exists for this entity
      let position = await this.query(trx)
        .where('entity_id', positionUpdate.entity_id)
        .where('entity_type', positionUpdate.entity_type)
        .first();

      let isNewPosition = false;
      
      // If position exists, update it
      if (position) {
        // Check if the position change is significant enough to archive
        const isSignificant = this.isPositionSignificant(position, positionUpdate);

        // Archive the current position if the change is significant
        if (isSignificant) {
          await this.archivePosition(position);
        }

        // Update the existing position
        position = await this.query(trx)
          .patchAndFetchById(position.position_id, {
            latitude: positionUpdate.latitude,
            longitude: positionUpdate.longitude,
            heading: positionUpdate.heading,
            speed: positionUpdate.speed,
            accuracy: positionUpdate.accuracy,
            source: positionUpdate.source,
            timestamp: positionUpdate.timestamp,
            updated_at: new Date()
          });
      } 
      // If position doesn't exist, create a new one
      else {
        isNewPosition = true;
        position = await this.query(trx).insert({
          position_id: uuid.v4(),
          entity_id: positionUpdate.entity_id,
          entity_type: positionUpdate.entity_type,
          latitude: positionUpdate.latitude,
          longitude: positionUpdate.longitude,
          heading: positionUpdate.heading,
          speed: positionUpdate.speed,
          accuracy: positionUpdate.accuracy,
          source: positionUpdate.source,
          timestamp: positionUpdate.timestamp,
          updated_at: new Date()
        });
      }

      // Commit the transaction
      await trx.commit();

      // Log the position update
      logger.debug(`Position updated for ${positionUpdate.entity_type} ${positionUpdate.entity_id}`, {
        isNew: isNewPosition,
        latitude: positionUpdate.latitude,
        longitude: positionUpdate.longitude
      });

      return position;
    } catch (error) {
      // Rollback the transaction if something went wrong
      await trx.rollback();
      logger.error(`Failed to update position for ${positionUpdate.entity_type} ${positionUpdate.entity_id}`, { error });
      throw error;
    }
  }

  /**
   * Updates positions for multiple entities in a single transaction
   * 
   * @param positionUpdates - Array of position updates
   * @returns Array of updated position models
   */
  static async bulkUpdatePositions(positionUpdates: PositionUpdate[]): Promise<PositionModel[]> {
    // Validate input parameters
    if (!Array.isArray(positionUpdates) || positionUpdates.length === 0) {
      throw new Error('At least one position update is required');
    }

    // Start a transaction to ensure data consistency
    const trx = await this.startTransaction();

    try {
      // Process each position update within the transaction
      const updatedPositions: PositionModel[] = [];
      
      for (const posUpdate of positionUpdates) {
        // Check if a position record already exists for this entity
        let position = await this.query(trx)
          .where('entity_id', posUpdate.entity_id)
          .where('entity_type', posUpdate.entity_type)
          .first();
      
        // If position exists, update it
        if (position) {
          // Check if the position change is significant enough to archive
          const isSignificant = this.isPositionSignificant(position, posUpdate);

          // Archive the current position if the change is significant
          if (isSignificant) {
            await this.archivePosition(position);
          }

          // Update the existing position
          position = await this.query(trx)
            .patchAndFetchById(position.position_id, {
              latitude: posUpdate.latitude,
              longitude: posUpdate.longitude,
              heading: posUpdate.heading,
              speed: posUpdate.speed,
              accuracy: posUpdate.accuracy,
              source: posUpdate.source,
              timestamp: posUpdate.timestamp,
              updated_at: new Date()
            });
        } 
        // If position doesn't exist, create a new one
        else {
          position = await this.query(trx).insert({
            position_id: uuid.v4(),
            entity_id: posUpdate.entity_id,
            entity_type: posUpdate.entity_type,
            latitude: posUpdate.latitude,
            longitude: posUpdate.longitude,
            heading: posUpdate.heading,
            speed: posUpdate.speed,
            accuracy: posUpdate.accuracy,
            source: posUpdate.source,
            timestamp: posUpdate.timestamp,
            updated_at: new Date()
          });
        }
        
        updatedPositions.push(position);
      }

      // Commit the transaction
      await trx.commit();

      // Log the bulk update
      logger.info(`Bulk updated ${updatedPositions.length} positions`);

      return updatedPositions;
    } catch (error) {
      // Rollback the transaction if something went wrong
      await trx.rollback();
      logger.error('Failed to bulk update positions', { error });
      throw error;
    }
  }

  /**
   * Deletes the position record for an entity
   * 
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @returns Number of records deleted (0 or 1)
   */
  static async deletePosition(entityId: string, entityType: EntityType): Promise<number> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }

    // Create a query to delete the position record
    const deletedCount = await this.query()
      .where('entity_id', entityId)
      .where('entity_type', entityType)
      .delete();

    // Log the deletion
    logger.info(`Deleted position for ${entityType} ${entityId}`, { deletedCount });

    return deletedCount;
  }

  /**
   * Determines if a position update is significant enough to archive
   * 
   * @param currentPosition - Current position of the entity
   * @param newPosition - New position of the entity
   * @returns True if the position change is significant, false otherwise
   */
  static isPositionSignificant(
    currentPosition: PositionModel,
    newPosition: PositionUpdate
  ): boolean {
    // Calculate distance between current and new positions
    const distance = calculateDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      newPosition.latitude,
      newPosition.longitude
    );

    // Calculate time difference in minutes
    const currentTime = new Date(currentPosition.timestamp);
    const newTime = new Date(newPosition.timestamp);
    const timeDiffMinutes = (newTime.getTime() - currentTime.getTime()) / (1000 * 60);

    // Calculate heading change
    const headingDiff = Math.abs(currentPosition.heading - newPosition.heading);
    const normalizedHeadingDiff = headingDiff > 180 ? 360 - headingDiff : headingDiff;

    // Define thresholds for significance
    const DISTANCE_THRESHOLD_KM = 0.1; // 100 meters
    const TIME_THRESHOLD_MINUTES = 5; // 5 minutes
    const HEADING_THRESHOLD_DEGREES = 30; // 30 degrees

    // Determine if the change is significant based on thresholds
    return (
      distance > DISTANCE_THRESHOLD_KM ||
      timeDiffMinutes > TIME_THRESHOLD_MINUTES ||
      normalizedHeadingDiff > HEADING_THRESHOLD_DEGREES
    );
  }

  /**
   * Archives a position update to the historical positions table
   * 
   * @param position - Position record to archive
   */
  static async archivePosition(position: PositionModel): Promise<void> {
    try {
      // Create a new historical position record
      await HistoricalPositionModel.query().insert({
        position_id: uuid.v4(),
        entity_id: position.entity_id,
        entity_type: position.entity_type,
        latitude: position.latitude,
        longitude: position.longitude,
        heading: position.heading,
        speed: position.speed,
        accuracy: position.accuracy,
        source: position.source,
        recorded_at: position.timestamp,
        created_at: new Date()
      });

      // Log the archival
      logger.debug(`Archived position for ${position.entity_type} ${position.entity_id}`);
    } catch (error) {
      // Log the error but don't throw it to avoid disrupting the main operation
      logger.error(`Failed to archive position for ${position.entity_type} ${position.entity_id}`, { error });
    }
  }

  /**
   * Converts the model instance to the EntityPosition interface format
   */
  toInterface(): EntityPosition {
    const position: Position = {
      latitude: this.latitude,
      longitude: this.longitude,
      heading: this.heading,
      speed: this.speed,
      accuracy: this.accuracy,
      source: this.source as PositionSource,
      timestamp: this.timestamp
    };

    return {
      entity_id: this.entity_id,
      entity_type: this.entity_type as EntityType,
      position
    };
  }

  /**
   * Converts the model to a JSON representation
   */
  toJSON(): object {
    const json = {
      ...super.toJSON(),
      // Format dates for client consumption
      timestamp: this.timestamp ? this.timestamp.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null
    };

    return json;
  }
}