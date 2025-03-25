import { Redis } from 'ioredis'; // ^5.0.0
import { PositionModel } from '../models/position.model';
import { HistoricalPositionModel } from '../models/historical-position.model';
import { PositionEventsProducer } from '../producers/position-events.producer';
import { GeofenceService } from './geofence.service';
import { EntityType, Position, PositionUpdate, NearbyQuery } from '../../common/interfaces/position.interface';
import { calculateDistance } from '../../common/utils/geo-utils';
import logger from '../../common/utils/logger';
import { AppError } from '../../common/utils/error-handler';

// Global constants for position caching
const POSITION_CACHE_TTL = 300; // Time-to-live for position cache in seconds
const POSITION_CACHE_PREFIX = 'position:cache:'; // Prefix for position cache keys
const SIGNIFICANT_DISTANCE_THRESHOLD = 100; // Distance threshold in meters for significant movement

/**
 * Validates a position update for required fields and data types
 * @param positionUpdate - The position update to validate
 * @returns True if valid, throws error if invalid
 */
export function validatePositionUpdate(positionUpdate: PositionUpdate): boolean {
  // Check that required fields are present (entity_id, entity_type, latitude, longitude)
  if (!positionUpdate.entity_id || !positionUpdate.entity_type || positionUpdate.latitude === undefined || positionUpdate.longitude === undefined) {
    throw new AppError('Entity ID, type, latitude, and longitude are required', { code: 'VAL_MISSING_FIELD' });
  }

  // Validate that latitude is between -90 and 90
  if (positionUpdate.latitude < -90 || positionUpdate.latitude > 90) {
    throw new AppError('Latitude must be between -90 and 90 degrees', { code: 'VAL_INVALID_INPUT' });
  }

  // Validate that longitude is between -180 and 180
  if (positionUpdate.longitude < -180 || positionUpdate.longitude > 180) {
    throw new AppError('Longitude must be between -180 and 180 degrees', { code: 'VAL_INVALID_INPUT' });
  }

  // Validate that entity_type is a valid EntityType
  if (!Object.values(EntityType).includes(positionUpdate.entity_type)) {
    throw new AppError('Invalid entity_type', { code: 'VAL_INVALID_INPUT', details: { validTypes: Object.values(EntityType) } });
  }

  // Return true if all validations pass, throw AppError otherwise
  return true;
}

/**
 * Generates a cache key for storing position data
 * @param entityId - The ID of the entity
 * @param entityType - The type of the entity
 * @returns Cache key for Redis
 */
export function getPositionCacheKey(entityId: string, entityType: EntityType): string {
  // Combine the POSITION_CACHE_PREFIX with entityId and entityType
  const cacheKey = `${POSITION_CACHE_PREFIX}${entityId}:${entityType}`;
  // Return the formatted cache key
  return cacheKey;
}

/**
 * Service class that manages position data for tracked entities
 */
export class PositionService {
  redisClient: Redis;
  positionProducer: PositionEventsProducer;
  geofenceService: GeofenceService;

  /**
   * Creates a new PositionService instance
   * @param redisClient - Redis client for caching
   * @param positionProducer - Position events producer
   * @param geofenceService - Geofence service
   */
  constructor(redisClient: Redis, positionProducer: PositionEventsProducer, geofenceService: GeofenceService) {
    // Initialize the Redis client for caching
    this.redisClient = redisClient;

    // Initialize the position events producer for publishing updates
    this.positionProducer = positionProducer;

    // Initialize the geofence service for geofence processing
    this.geofenceService = geofenceService;

    // Log the initialization of the position service
    logger.info('Position service initialized');
  }

  /**
   * Gets the current position for a specific entity
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @returns Current position or null if not found
   */
  async getCurrentPosition(entityId: string, entityType: EntityType): Promise<Position | null> {
    // Generate cache key for the entity
    const cacheKey = getPositionCacheKey(entityId, entityType);

    try {
      // Try to get position from Redis cache
      const cachedPosition = await this.getCachedPosition(entityId, entityType);
      if (cachedPosition) {
        // If found in cache, parse and return the cached position
        logger.debug(`Position found in cache for ${entityType} ${entityId}`);
        return cachedPosition;
      }

      // If not in cache, retrieve from database using PositionModel.getByEntityId
      logger.debug(`Position not found in cache for ${entityType} ${entityId}, retrieving from database`);
      const positionModel = await PositionModel.getByEntityId(entityId, entityType);

      // If found in database, cache the position and return it
      if (positionModel) {
        const position = {
          latitude: positionModel.latitude,
          longitude: positionModel.longitude,
          heading: positionModel.heading,
          speed: positionModel.speed,
          accuracy: positionModel.accuracy,
          source: positionModel.source,
          timestamp: positionModel.timestamp
        };
        await this.cachePosition(entityId, entityType, position);
        logger.debug(`Position cached for ${entityType} ${entityId}`);
        return position;
      }

      // If not found, return null
      logger.debug(`Position not found in database for ${entityType} ${entityId}`);
      return null;
    } catch (error) {
      // Log errors and return null in case of failure
      logger.error(`Failed to get current position for ${entityType} ${entityId}`, { error });
      return null;
    }
  }

  /**
   * Gets historical positions for an entity within a time range
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @param options - Additional options (limit, offset)
   * @returns Array of historical positions
   */
  async getPositionHistory(entityId: string, entityType: EntityType, startTime: Date, endTime: Date, options: { limit?: number; offset?: number }): Promise<Position[]> {
    try {
      // Validate input parameters
      if (!entityId || !entityType) {
        throw new AppError('Entity ID and type are required', { code: 'VAL_MISSING_FIELD' });
      }

      // Call HistoricalPositionModel.getByEntityId with parameters
      const historicalPositions = await HistoricalPositionModel.getByEntityId(entityId, entityType, startTime, endTime, options);

      // Transform database models to Position interface objects
      const positions: Position[] = historicalPositions.map(historicalPosition => ({
        latitude: historicalPosition.latitude,
        longitude: historicalPosition.longitude,
        heading: historicalPosition.heading,
        speed: historicalPosition.speed,
        accuracy: historicalPosition.accuracy,
        source: historicalPosition.source,
        timestamp: historicalPosition.recorded_at
      }));

      // Return the array of positions
      logger.debug(`Retrieved ${positions.length} historical positions for ${entityType} ${entityId}`);
      return positions;
    } catch (error) {
      // Log errors and return empty array in case of failure
      logger.error(`Failed to get position history for ${entityType} ${entityId}`, { error });
      return [];
    }
  }

  /**
   * Gets entities near a specific location
   * @param query - Parameters for querying nearby entities
   * @returns Array of nearby entity positions
   */
  async getNearbyEntities(query: NearbyQuery): Promise<any[]> {
    try {
      // Validate the query parameters
      if (!query || query.latitude === undefined || query.longitude === undefined || !query.radius) {
        throw new AppError('Latitude, longitude, and radius are required for nearby query', { code: 'VAL_MISSING_FIELD' });
      }

      // Call PositionModel.getNearbyEntities with the query
      const nearbyEntities = await PositionModel.getNearbyEntities(query);

      // Transform database models to EntityPosition interface objects
      const entityPositions = nearbyEntities.map(entity => ({
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        position: {
          latitude: entity.latitude,
          longitude: entity.longitude,
          heading: entity.heading,
          speed: entity.speed,
          accuracy: entity.accuracy,
          source: entity.source,
          timestamp: entity.timestamp
        }
      }));

      // Return the array of entity positions
      logger.debug(`Found ${entityPositions.length} nearby entities near [${query.latitude}, ${query.longitude}]`);
      return entityPositions;
    } catch (error) {
      // Log errors and return empty array in case of failure
      logger.error(`Failed to get nearby entities near [${query.latitude}, ${query.longitude}]`, { error });
      return [];
    }
  }

  /**
   * Updates the position of an entity and processes related events
   * @param positionUpdate - Position update data
   * @returns Updated position or null if update failed
   */
  async updatePosition(positionUpdate: PositionUpdate): Promise<Position | null> {
    try {
      // Validate the position update using validatePositionUpdate
      validatePositionUpdate(positionUpdate);

      // Call PositionModel.updatePosition to update the database
      const updatedPositionModel = await PositionModel.updatePosition(positionUpdate);

      // Check if updatedPositionModel is null
      if (!updatedPositionModel) {
        logger.warn(`Position update failed for ${positionUpdate.entity_type} ${positionUpdate.entity_id}`);
        return null;
      }

      const updatedPosition = {
        latitude: updatedPositionModel.latitude,
        longitude: updatedPositionModel.longitude,
        heading: updatedPositionModel.heading,
        speed: updatedPositionModel.speed,
        accuracy: updatedPositionModel.accuracy,
        source: updatedPositionModel.source,
        timestamp: updatedPositionModel.timestamp
      };

      // Cache the updated position in Redis
      await this.cachePosition(positionUpdate.entity_id, positionUpdate.entity_type, updatedPosition);

      // Publish the position update to the event bus
      await this.positionProducer.publishPositionUpdate(positionUpdate);

      // Process the position update for geofence events
      await this.geofenceService.processPositionUpdate(
        positionUpdate.entity_id,
        positionUpdate.entity_type,
        positionUpdate.latitude,
        positionUpdate.longitude,
        positionUpdate.timestamp
      );

      // Return the updated position
      logger.info(`Position updated for ${positionUpdate.entity_type} ${positionUpdate.entity_id} at [${positionUpdate.latitude}, ${positionUpdate.longitude}]`);
      return updatedPosition;
    } catch (error) {
      // Log errors and return null in case of failure
      logger.error(`Failed to update position for ${positionUpdate.entity_type} ${positionUpdate.entity_id}`, { error });
      return null;
    }
  }

  /**
   * Updates positions for multiple entities in a single operation
   * @param positionUpdates - Array of position updates
   * @returns Array of updated positions
   */
  async bulkUpdatePositions(positionUpdates: PositionUpdate[]): Promise<Position[]> {
    try {
      // Validate each position update in the array
      positionUpdates.forEach(positionUpdate => validatePositionUpdate(positionUpdate));

      // Call PositionModel.bulkUpdatePositions to update the database
      const updatedPositionModels = await PositionModel.bulkUpdatePositions(positionUpdates);

      // Transform database models to Position interface objects
      const updatedPositions = updatedPositionModels.map(positionModel => ({
        latitude: positionModel.latitude,
        longitude: positionModel.longitude,
        heading: positionModel.heading,
        speed: positionModel.speed,
        accuracy: positionModel.accuracy,
        source: positionModel.source,
        timestamp: positionModel.timestamp
      }));

      // Cache each updated position in Redis and publish each position update to the event bus
      for (let i = 0; i < positionUpdates.length; i++) {
        const positionUpdate = positionUpdates[i];
        const updatedPosition = updatedPositions[i];
        await this.cachePosition(positionUpdate.entity_id, positionUpdate.entity_type, updatedPosition);
        await this.positionProducer.publishPositionUpdate(positionUpdate);

        // Process the position update for geofence events
        await this.geofenceService.processPositionUpdate(
          positionUpdate.entity_id,
          positionUpdate.entity_type,
          positionUpdate.latitude,
          positionUpdate.longitude,
          positionUpdate.timestamp
        );
      }

      // Return the array of updated positions
      logger.info(`Bulk updated ${updatedPositions.length} positions`);
      return updatedPositions;
    } catch (error) {
      // Log errors and return partial results in case of failure
      logger.error('Failed to bulk update positions', { error });
      return [];
    }
  }

  /**
   * Deletes the position record for an entity
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @returns True if deleted, false otherwise
   */
  async deletePosition(entityId: string, entityType: EntityType): Promise<boolean> {
    try {
      // Call PositionModel.deletePosition to remove from database
      const deletedCount = await PositionModel.deletePosition(entityId, entityType);

      // Remove the position from Redis cache
      await this.invalidatePositionCache(entityId, entityType);

      // Return true if deletion was successful
      logger.info(`Deleted position for ${entityType} ${entityId}`, { deletedCount });
      return deletedCount > 0;
    } catch (error) {
      // Log errors and return false in case of failure
      logger.error(`Failed to delete position for ${entityType} ${entityId}`, { error });
      return false;
    }
  }

  /**
   * Calculates the distance between two entities or an entity and coordinates
   * @param entityId1 - ID of the first entity
   * @param entityType1 - Type of the first entity
   * @param entityId2OrLatitude - ID of the second entity or latitude of the coordinates
   * @param entityType2OrLongitude - Type of the second entity or longitude of the coordinates
   * @returns Distance in kilometers or null if positions not found
   */
  async calculateDistance(entityId1: string, entityType1: EntityType, entityId2OrLatitude: string | number, entityType2OrLongitude: EntityType | number): Promise<number | null> {
    try {
      let lat1: number, lon1: number, lat2: number, lon2: number;

      // Determine if calculating between two entities or entity and coordinates
      if (typeof entityId2OrLatitude === 'string' && typeof entityType2OrLongitude === 'string') {
        // Get current positions of both entities
        const position1 = await this.getCurrentPosition(entityId1, entityType1);
        const position2 = await this.getCurrentPosition(entityId2OrLatitude, entityType2OrLongitude);

        // If any position is not found, return null
        if (!position1 || !position2) {
          logger.warn(`Could not calculate distance: position not found for one or both entities`);
          return null;
        }

        lat1 = position1.latitude;
        lon1 = position1.longitude;
        lat2 = position2.latitude;
        lon2 = position2.longitude;
      } else if (typeof entityId2OrLatitude === 'number' && typeof entityType2OrLongitude === 'number') {
        // Get current position of the first entity
        const position1 = await this.getCurrentPosition(entityId1, entityType1);

        // If the position is not found, return null
        if (!position1) {
          logger.warn(`Could not calculate distance: position not found for entity ${entityId1}`);
          return null;
        }

        lat1 = position1.latitude;
        lon1 = position1.longitude;
        lat2 = entityId2OrLatitude;
        lon2 = entityType2OrLongitude;
      } else {
        logger.error('Invalid parameters for distance calculation');
        return null;
      }

      // Use calculateDistance utility to compute the distance
      const distance = calculateDistance(lat1, lon1, lat2, lon2);

      // Return the calculated distance in kilometers
      logger.debug(`Calculated distance between ${entityId1} and ${entityId2OrLatitude}: ${distance} km`);
      return distance;
    } catch (error) {
      // Log errors and return null in case of failure
      logger.error(`Failed to calculate distance between ${entityId1} and ${entityId2OrLatitude}`, { error });
      return null;
    }
  }

  /**
   * Caches a position in Redis for quick retrieval
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param position - Position data to cache
   */
  async cachePosition(entityId: string, entityType: EntityType, position: Position): Promise<void> {
    // Generate cache key using getPositionCacheKey
    const cacheKey = getPositionCacheKey(entityId, entityType);

    try {
      // Serialize the position to JSON
      const positionString = JSON.stringify(position);

      // Store in Redis with the specified TTL
      await this.redisClient.set(cacheKey, positionString, 'EX', POSITION_CACHE_TTL);

      // Log the caching operation at debug level
      logger.debug(`Cached position for ${entityType} ${entityId} with TTL ${POSITION_CACHE_TTL}s`);
    } catch (error) {
      // Handle any errors during caching
      logger.error(`Failed to cache position for ${entityType} ${entityId}`, { error });
    }
  }

  /**
   * Retrieves a cached position if available
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @returns Cached position or null if not found
   */
  async getCachedPosition(entityId: string, entityType: EntityType): Promise<Position | null> {
    // Generate cache key using getPositionCacheKey
    const cacheKey = getPositionCacheKey(entityId, entityType);

    try {
      // Attempt to get the value from Redis using the cache key
      const positionString = await this.redisClient.get(cacheKey);

      // If value exists, parse the JSON string into a Position object
      if (positionString) {
        const position: Position = JSON.parse(positionString);
        logger.debug(`Retrieved position from cache for ${entityType} ${entityId}`);
        return position;
      }

      // Return null if not found
      logger.debug(`Position not found in cache for ${entityType} ${entityId}`);
      return null;
    } catch (error) {
      // Handle any errors and return null in case of failure
      logger.error(`Failed to retrieve cached position for ${entityType} ${entityId}`, { error });
      return null;
    }
  }

  /**
   * Invalidates cached position for an entity
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   */
  async invalidatePositionCache(entityId: string, entityType: EntityType): Promise<void> {
    // Generate cache key using getPositionCacheKey
    const cacheKey = getPositionCacheKey(entityId, entityType);

    try {
      // Delete the key from Redis
      await this.redisClient.del(cacheKey);

      // Log the cache invalidation at debug level
      logger.debug(`Invalidated cache for ${entityType} ${entityId}`);
    } catch (error) {
      // Handle any errors during cache invalidation
      logger.error(`Failed to invalidate cache for ${entityType} ${entityId}`, { error });
    }
  }
}