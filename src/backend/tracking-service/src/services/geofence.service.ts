# src/backend/tracking-service/src/services/geofence.service.ts
```typescript
import { Redis } from 'ioredis'; // ^5.0.0
import { Transaction } from 'objection'; // ^2.2.0
import { Kafka, Producer } from 'kafkajs'; // ^2.2.0
import { GeofenceModel } from '../models/geofence.model';
import { GeofenceEventModel } from '../models/geofence-event.model';
import { GeofenceDetector } from '../algorithms/geofence-detector';
import { EntityType, GeofenceEventType } from '../../common/interfaces/position.interface';
import { EventTypes } from '../../common/constants/event-types';
import { isPointInPolygon, calculateDistance } from '../../common/utils/geo-utils';
import logger from '../../common/utils/logger';
import { AppError } from '../../common/utils/error-handler';

// Global constants for geofence caching and search
const GEOFENCE_CACHE_TTL = 3600; // Time-to-live for geofence cache in seconds
const GEOFENCE_CACHE_PREFIX = 'geofence:cache:'; // Prefix for geofence cache keys
const DEFAULT_SEARCH_RADIUS_METERS = 1000; // Default search radius for nearby geofences in meters

/**
 * Validates geofence data before creation or update
 * @param geofenceData - The geofence data to validate
 * @returns True if data is valid, throws error otherwise
 */
export function validateGeofenceData(geofenceData: any): boolean {
  // Check that required fields are present (name, geofence_type, entity_type)
  if (!geofenceData.name || !geofenceData.geofence_type || !geofenceData.entity_type) {
    throw new AppError('Name, geofence_type, and entity_type are required fields', { code: 'VAL_MISSING_FIELD' });
  }

  // Validate that geofence_type is a valid type (CIRCLE, POLYGON, CORRIDOR)
  const validGeofenceTypes = ['CIRCLE', 'POLYGON', 'CORRIDOR'];
  if (!validGeofenceTypes.includes(geofenceData.geofence_type)) {
    throw new AppError('Invalid geofence_type', { code: 'VAL_INVALID_INPUT', details: { validTypes: validGeofenceTypes } });
  }

  // Validate that entity_type is a valid EntityType
  if (!Object.values(EntityType).includes(geofenceData.entity_type)) {
    throw new AppError('Invalid entity_type', { code: 'VAL_INVALID_INPUT', details: { validTypes: Object.values(EntityType) } });
  }

  // Validate geometry data based on geofence_type
  if (geofenceData.geofence_type === 'CIRCLE') {
    // For CIRCLE type, validate center coordinates and radius
    if (typeof geofenceData.center_latitude !== 'number' || typeof geofenceData.center_longitude !== 'number' || typeof geofenceData.radius !== 'number') {
      throw new AppError('center_latitude, center_longitude, and radius are required for CIRCLE geofences', { code: 'VAL_MISSING_FIELD' });
    }
  } else if (geofenceData.geofence_type === 'POLYGON') {
    // For POLYGON type, validate coordinates array
    if (!Array.isArray(geofenceData.coordinates) || geofenceData.coordinates.length < 3) {
      throw new AppError('Coordinates array with at least 3 points is required for POLYGON geofences', { code: 'VAL_INVALID_INPUT' });
    }
  } else if (geofenceData.geofence_type === 'CORRIDOR') {
    // For CORRIDOR type, validate path coordinates and width
    if (!Array.isArray(geofenceData.coordinates) || geofenceData.coordinates.length < 2 || typeof geofenceData.corridor_width !== 'number') {
      throw new AppError('Coordinates array with at least 2 points and corridor_width are required for CORRIDOR geofences', { code: 'VAL_INVALID_INPUT' });
    }
  }

  // Return true if all validations pass, throw AppError otherwise
  return true;
}

/**
 * Generates a cache key for storing geofence data
 * @param geofenceId - The ID of the geofence
 * @returns Cache key for Redis
 */
export function getGeofenceCacheKey(geofenceId: string): string {
  // Combine the GEOFENCE_CACHE_PREFIX with geofenceId
  const cacheKey = `${GEOFENCE_CACHE_PREFIX}${geofenceId}`;
  // Return the formatted cache key
  return cacheKey;
}

/**
 * Publishes a geofence event to the event bus
 * @param geofenceEvent - The geofence event to publish
 * @param kafkaProducer - The Kafka producer instance
 * @returns Promise<void> - No return value
 */
async function publishGeofenceEvent(geofenceEvent: GeofenceEventModel, kafkaProducer: Producer): Promise<void> {
  try {
    // Convert the geofence event to an event payload using toEventPayload
    const eventPayload = geofenceEvent.toEventPayload();

    // Determine the appropriate Kafka topic based on event type
    const topic = eventPayload.event_type === EventTypes.GEOFENCE_ENTERED ? 'geofence_enter' : 'geofence_exit';

    // Publish the event to the Kafka topic
    await kafkaProducer.send({
      topic: topic,
      messages: [{ value: JSON.stringify(eventPayload) }],
    });

    // Log the event publication for debugging
    logger.info(`Published geofence event to Kafka topic ${topic}`, {
      event_id: geofenceEvent.event_id,
      geofence_id: geofenceEvent.geofence_id,
      entity_id: geofenceEvent.entity_id,
      entity_type: geofenceEvent.entity_type,
      event_type: geofenceEvent.event_type,
    });
  } catch (error) {
    // Log any errors that occur during event publication
    logger.error('Error publishing geofence event to Kafka', { error, event: geofenceEvent });
    throw error;
  }
}

/**
 * Service class that manages geofences and geofence events
 */
export class GeofenceService {
  redisClient: Redis;
  kafkaProducer: Kafka;
  geofenceDetector: GeofenceDetector;
  config: object;

  /**
   * Creates a new GeofenceService instance
   * @param redisClient - Redis client for caching
   * @param kafkaProducer - Kafka producer for event publishing
   */
  constructor(redisClient: Redis, kafkaProducer: Kafka) {
    // Initialize the Redis client for caching
    this.redisClient = redisClient;

    // Initialize the Kafka producer for event publishing
    this.kafkaProducer = kafkaProducer;

    // Initialize the GeofenceDetector with the Redis client
    this.geofenceDetector = new GeofenceDetector(this.redisClient);

    // Load configuration settings
    this.config = {}; // Add configuration loading logic here if needed

    // Log the initialization of the geofence service
    logger.info('GeofenceService initialized');
  }

  /**
   * Creates a new geofence
   * @param geofenceData - The geofence data to create
   * @returns Promise<GeofenceModel> - The created geofence
   */
  async createGeofence(geofenceData: any): Promise<GeofenceModel> {
    try {
      // Validate the geofence data using validateGeofenceData
      validateGeofenceData(geofenceData);

      let geometry;
      // Create the appropriate geometry based on geofence_type
      if (geofenceData.geofence_type === 'CIRCLE') {
        // For CIRCLE type, use GeofenceModel.createCircle
        geometry = GeofenceModel.createCircle(geofenceData.center_latitude, geofenceData.center_longitude, geofenceData.radius);
      } else if (geofenceData.geofence_type === 'POLYGON') {
        // For POLYGON type, use GeofenceModel.createPolygon
        geometry = GeofenceModel.createPolygon(geofenceData.coordinates);
      } else if (geofenceData.geofence_type === 'CORRIDOR') {
        // For CORRIDOR type, use GeofenceModel.createCorridor
        geometry = GeofenceModel.createCorridor(geofenceData.coordinates, geofenceData.corridor_width);
      }

      // Create a new GeofenceModel instance with the validated data
      const geofence = await GeofenceModel.query().insert({
        geofence_id: require('uuid').v4(),
        name: geofenceData.name,
        description: geofenceData.description,
        geofence_type: geofenceData.geofence_type,
        entity_type: geofenceData.entity_type,
        entity_id: geofenceData.entity_id,
        geometry: geometry,
        center_latitude: geofenceData.center_latitude,
        center_longitude: geofenceData.center_longitude,
        radius: geofenceData.radius,
        coordinates: geofenceData.coordinates,
        corridor_width: geofenceData.corridor_width,
        metadata: geofenceData.metadata,
        active: geofenceData.active,
        start_date: geofenceData.start_date,
        end_date: geofenceData.end_date,
      });

      // Log the geofence creation
      logger.info(`Created geofence: ${geofence.geofence_id}`, { geofence });

      // Return the created geofence model
      return geofence;
    } catch (error) {
      // Log any errors that occur during geofence creation
      logger.error('Error creating geofence', { error, geofenceData });
      throw error;
    }
  }

  /**
   * Updates an existing geofence
   * @param geofenceId - The ID of the geofence to update
   * @param updateData - The data to update the geofence with
   * @returns Promise<GeofenceModel | null> - The updated geofence or null if not found
   */
  async updateGeofence(geofenceId: string, updateData: any): Promise<GeofenceModel | null> {
    try {
      // Retrieve the existing geofence by ID
      let geofence = await GeofenceModel.findById(geofenceId);

      // If not found, return null
      if (!geofence) {
        return null;
      }

      // Validate the update data using validateGeofenceData
      validateGeofenceData(updateData);

      let geometry;
      // If geofence_type is changing, create new geometry
      if (updateData.geofence_type && updateData.geofence_type !== geofence.geofence_type) {
        if (updateData.geofence_type === 'CIRCLE') {
          geometry = GeofenceModel.createCircle(updateData.center_latitude, updateData.center_longitude, updateData.radius);
        } else if (updateData.geofence_type === 'POLYGON') {
          geometry = GeofenceModel.createPolygon(updateData.coordinates);
        } else if (updateData.geofence_type === 'CORRIDOR') {
          geometry = GeofenceModel.createCorridor(updateData.coordinates, updateData.corridor_width);
        }
      }

      // Update the geofence with the validated data
      geofence = await GeofenceModel.query().patchAndFetchById(geofenceId, {
        name: updateData.name || geofence.name,
        description: updateData.description || geofence.description,
        geofence_type: updateData.geofence_type || geofence.geofence_type,
        entity_type: updateData.entity_type || geofence.entity_type,
        entity_id: updateData.entity_id || geofence.entity_id,
        geometry: geometry || geofence.geometry,
        center_latitude: updateData.center_latitude || geofence.center_latitude,
        center_longitude: updateData.center_longitude || geofence.center_longitude,
        radius: updateData.radius || geofence.radius,
        coordinates: updateData.coordinates || geofence.coordinates,
        corridor_width: updateData.corridor_width || geofence.corridor_width,
        metadata: updateData.metadata || geofence.metadata,
        active: updateData.active !== undefined ? updateData.active : geofence.active,
        start_date: updateData.start_date || geofence.start_date,
        end_date: updateData.end_date || geofence.end_date,
        updated_at: new Date(),
      });

      // Invalidate the geofence cache
      await this.invalidateGeofenceCache(geofenceId);

      // Log the geofence update
      logger.info(`Updated geofence: ${geofenceId}`, { geofence });

      // Return the updated geofence model
      return geofence;
    } catch (error) {
      // Log any errors that occur during geofence update
      logger.error(`Error updating geofence: ${geofenceId}`, { error, updateData });
      throw error;
    }
  }

  /**
   * Deletes a geofence
   * @param geofenceId - The ID of the geofence to delete
   * @returns Promise<boolean> - True if deleted, false if not found
   */
  async deleteGeofence(geofenceId: string): Promise<boolean> {
    try {
      // Retrieve the existing geofence by ID
      const geofence = await GeofenceModel.findById(geofenceId);

      // If not found, return false
      if (!geofence) {
        return false;
      }

      // Delete the geofence from the database
      await GeofenceModel.query().deleteById(geofenceId);

      // Invalidate the geofence cache
      await this.invalidateGeofenceCache(geofenceId);

      // Log the geofence deletion
      logger.info(`Deleted geofence: ${geofenceId}`);

      // Return true to indicate successful deletion
      return true;
    } catch (error) {
      // Log any errors that occur during geofence deletion
      logger.error(`Error deleting geofence: ${geofenceId}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves a geofence by ID
   * @param geofenceId - The ID of the geofence to retrieve
   * @returns Promise<GeofenceModel | null> - The geofence or null if not found
   */
  async getGeofence(geofenceId: string): Promise<GeofenceModel | null> {
    try {
      // Check the Redis cache for the geofence
      const cacheKey = getGeofenceCacheKey(geofenceId);
      const cachedGeofence = await this.redisClient.get(cacheKey);

      // If found in cache, parse and return the cached geofence
      if (cachedGeofence) {
        logger.debug(`Geofence ${geofenceId} found in cache`);
        return JSON.parse(cachedGeofence);
      }

      // If not in cache, retrieve from database using GeofenceModel.findById
      const geofence = await GeofenceModel.findById(geofenceId);

      // If found in database, cache the geofence for future requests
      if (geofence) {
        logger.debug(`Geofence ${geofenceId} not found in cache, retrieving from database`);
        await this.redisClient.set(cacheKey, JSON.stringify(geofence), 'EX', GEOFENCE_CACHE_TTL);
      }

      // Return the geofence model or null if not found
      return geofence;
    } catch (error) {
      // Log any errors that occur during geofence retrieval
      logger.error(`Error getting geofence: ${geofenceId}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves geofences for a specific entity type
   * @param entityType - The type of entity to retrieve geofences for
   * @param activeOnly - Whether to return only active geofences
   * @returns Promise<GeofenceModel[]> - Array of geofences for the entity type
   */
  async getGeofencesByEntityType(entityType: EntityType, activeOnly: boolean): Promise<GeofenceModel[]> {
    try {
      // Call GeofenceModel.findByEntityType with the entity type
      const geofences = await GeofenceModel.findByEntityType(entityType, activeOnly);

      // Log the geofence retrieval
      logger.debug(`Retrieved geofences for entity type: ${entityType}`, { count: geofences.length });

      // Return the array of geofence models
      return geofences;
    } catch (error) {
      // Log any errors that occur during geofence retrieval
      logger.error(`Error getting geofences by entity type: ${entityType}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves geofences for a specific entity
   * @param entityId - The ID of the entity
   * @param entityType - The type of entity
   * @param activeOnly - Whether to return only active geofences
   * @returns Promise<GeofenceModel[]> - Array of geofences for the entity
   */
  async getGeofencesByEntityId(entityId: string, entityType: EntityType, activeOnly: boolean): Promise<GeofenceModel[]> {
    try {
      // Call GeofenceModel.findByEntityId with the entity ID and type
      const geofences = await GeofenceModel.findByEntityId(entityId, entityType, activeOnly);

      // Log the geofence retrieval
      logger.debug(`Retrieved geofences for entity ID: ${entityId}`, { count: geofences.length });

      // Return the array of geofence models
      return geofences;
    } catch (error) {
      // Log any errors that occur during geofence retrieval
      logger.error(`Error getting geofences by entity ID: ${entityId}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves geofences near a specific location
   * @param latitude - Latitude of the location
   * @param longitude - Longitude of the location
   * @param radiusInMeters - The search radius in meters
   * @param options - Additional options (entity_type, active)
   * @returns Promise<GeofenceModel[]> - Array of nearby geofences
   */
  async getNearbyGeofences(latitude: number, longitude: number, radiusInMeters: number, options: any): Promise<GeofenceModel[]> {
    try {
      // Validate the coordinates and radius
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof radiusInMeters !== 'number') {
        throw new AppError('Latitude, longitude, and radiusInMeters must be numbers', { code: 'VAL_INVALID_INPUT' });
      }

      // Set default radius if not provided
      const searchRadius = radiusInMeters || DEFAULT_SEARCH_RADIUS_METERS;

      // Call GeofenceModel.findNearby with the parameters
      let geofences = await GeofenceModel.findNearby(latitude, longitude, searchRadius, options);

      // Log the geofence retrieval
      logger.debug(`Retrieved nearby geofences near [${latitude}, ${longitude}]`, { count: geofences.length });

      // Return the array of nearby geofence models
      return geofences;
    } catch (error) {
      // Log any errors that occur during geofence retrieval
      logger.error(`Error getting nearby geofences near [${latitude}, ${longitude}]`, { error });
      throw error;
    }
  }

  /**
   * Processes a position update to detect geofence events
   * @param entityId - The ID of the entity
   * @param entityType - The type of the entity
   * @param latitude - The latitude of the position
   * @param longitude - The longitude of the position
   * @param timestamp - The timestamp of the position update
   * @returns Promise<GeofenceEventModel[]> - Array of detected geofence events
   */
  async processPositionUpdate(entityId: string, entityType: EntityType, latitude: number, longitude: number, timestamp: Date): Promise<GeofenceEventModel[]> {
    try {
      // Validate the input parameters
      if (!entityId || !entityType) {
        throw new AppError('Entity ID and type are required', { code: 'VAL_MISSING_FIELD' });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new AppError('Latitude and longitude must be numbers', { code: 'VAL_INVALID_INPUT' });
      }

      // Call the GeofenceDetector.processPositionUpdate method
      const events = await this.geofenceDetector.processPositionUpdate(entityId, entityType, latitude, longitude, timestamp);

      // Log the number of detected events
      logger.debug(`Detected ${events.length} geofence events for ${entityType} ${entityId}`);

      // For each detected event, publish to the event bus
      for (const event of events) {
        try {
          await publishGeofenceEvent(event, this.kafkaProducer);
        } catch (error) {
          logger.error(`Failed to publish geofence event ${event.event_id}`, { error, event });
        }
      }

      // Return the array of geofence events
      return events;
    } catch (error) {
      // Log any errors that occur during position update processing
      logger.error(`Error processing position update for ${entityType} ${entityId}`, { error, latitude, longitude, timestamp });
      throw error;
    }
  }

  /**
   * Retrieves geofence events for a specific entity
   * @param entityId - The ID of the entity
   * @param entityType - The type of the entity
   * @param startTime - The start time for the event retrieval
   * @param endTime - The end time for the event retrieval
   * @param options - Additional options (event_type, limit, offset)
   * @returns Promise<GeofenceEventModel[]> - Array of geofence events
   */
  async getGeofenceEvents(entityId: string, entityType: EntityType, startTime: Date, endTime: Date, options: any): Promise<GeofenceEventModel[]> {
    try {
      // Validate the entity ID, type, and time range
      if (!entityId || !entityType) {
        throw new AppError('Entity ID and type are required', { code: 'VAL_MISSING_FIELD' });
      }

      if (!startTime || !endTime) {
        throw new AppError('Start and end times are required', { code: 'VAL_MISSING_FIELD' });
      }

      // Call GeofenceEventModel.getByEntityId with the parameters
      const events = await GeofenceEventModel.getByEntityId(entityId, entityType, startTime, endTime, options);

      // Log the event retrieval
      logger.debug(`Retrieved geofence events for entity ID: ${entityId}`, { count: events.length });

      // Return the array of geofence events
      return events;
    } catch (error) {
      // Log any errors that occur during event retrieval
      logger.error(`Error getting geofence events for entity ID: ${entityId}`, { error, entityId, entityType, startTime, endTime, options });
      throw error;
    }
  }

  /**
   * Retrieves events for a specific geofence
   * @param geofenceId - The ID of the geofence
   * @param startTime - The start time for the event retrieval
   * @param endTime - The end time for the event retrieval
   * @param options - Additional options (entity_type, event_type, limit, offset)
   * @returns Promise<GeofenceEventModel[]> - Array of geofence events
   */
  async getGeofenceEventsByGeofence(geofenceId: string, startTime: Date, endTime: Date, options: any): Promise<GeofenceEventModel[]> {
    try {
      // Validate the geofence ID and time range
      if (!geofenceId) {
        throw new AppError('Geofence ID is required', { code: 'VAL_MISSING_FIELD' });
      }

      if (!startTime || !endTime) {
        throw new AppError('Start and end times are required', { code: 'VAL_MISSING_FIELD' });
      }

      // Call GeofenceEventModel.getByGeofenceId with the parameters
      const events = await GeofenceEventModel.getByGeofenceId(geofenceId, startTime, endTime, options);

      // Log the event retrieval
      logger.debug(`Retrieved geofence events for geofence ID: ${geofenceId}`, { count: events.length });

      // Return the array of geofence events
      return events;
    } catch (error) {
      // Log any errors that occur during event retrieval
      logger.error(`Error getting geofence events for geofence ID: ${geofenceId}`, { error, geofenceId, startTime, endTime, options });
      throw error;
    }
  }

  /**
   * Creates a geofence event manually
   * @param geofenceId - The ID of the geofence
   * @param entityId - The ID of the entity
   * @param entityType - The type of the entity
   * @param eventType - The type of the event
   * @param latitude - The latitude of the event
   * @param longitude - The longitude of the event
   * @param timestamp - The timestamp of the event
   * @param metadata - Additional metadata for the event
   * @returns Promise<GeofenceEventModel> - The created geofence event
   */
  async createGeofenceEvent(geofenceId: string, entityId: string, entityType: EntityType, eventType: GeofenceEventType, latitude: number, longitude: number, timestamp: Date, metadata: any): Promise<GeofenceEventModel> {
    try {
      // Validate the input parameters
      if (!geofenceId || !entityId || !entityType || !eventType) {
        throw new AppError('Geofence ID, entity ID, entity type, and event type are required', { code: 'VAL_MISSING_FIELD' });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new AppError('Latitude and longitude must be numbers', { code: 'VAL_INVALID_INPUT' });
      }

      // Check if the geofence exists
      const geofence = await GeofenceModel.findById(geofenceId);
      if (!geofence) {
        throw new AppError(`Geofence with ID ${geofenceId} not found`, { code: 'RES_GEOFENCE_NOT_FOUND' });
      }

      // Call GeofenceEventModel.createEvent with the parameters
      const event = await GeofenceEventModel.createEvent(geofenceId, entityId, entityType, eventType, latitude, longitude, timestamp, metadata);

      // Publish the event to the event bus
      await publishGeofenceEvent(event, this.kafkaProducer);

      // Return the created event model
      return event;
    } catch (error) {
      // Log any errors that occur during event creation
      logger.error(`Error creating geofence event for geofence ID: ${geofenceId}`, { error, geofenceId, entityId, entityType, eventType, latitude, longitude, timestamp, metadata });
      throw error;
    }
  }

  /**
   * Invalidates the cache for a geofence
   * @param geofenceId - The ID of the geofence to invalidate
   */
  async invalidateGeofenceCache(geofenceId: string): Promise<void> {
    try {
      // Generate the cache key using getGeofenceCacheKey
      const cacheKey = getGeofenceCacheKey(geofenceId);

      // Delete the key from Redis
      await this.redisClient.del(cacheKey);

      // Log the cache invalidation
      logger.debug(`Invalidated cache for geofence: ${geofenceId}`);
    } catch (error) {
      // Log any errors that occur during cache invalidation
      logger.error(`Error invalidating cache for geofence: ${geofenceId}`, { error });
      throw error;
    }
  }
}