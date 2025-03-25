import { Redis } from 'ioredis'; // ^5.0.0
import { GeofenceModel } from '../models/geofence.model';
import { GeofenceEventModel } from '../models/geofence-event.model';
import { PositionModel } from '../models/position.model';
import { EntityType, GeofenceEventType } from '../../common/interfaces/position.interface';
import { EventTypes } from '../../common/constants/event-types';
import { isPointInPolygon, calculateDistance } from '../../common/utils/geo-utils';
import logger from '../../common/utils/logger';

// Constants for geofence state cache management
const GEOFENCE_STATE_CACHE_PREFIX = 'geofence:state:';
const GEOFENCE_STATE_CACHE_TTL = 86400; // 24 hours in seconds
const DEFAULT_SEARCH_RADIUS_METERS = 1000; // 1 kilometer
const DWELL_TIME_THRESHOLD_MS = 300000; // 5 minutes in milliseconds

/**
 * Generates a cache key for storing geofence state information
 * @param entityId - ID of the entity
 * @param geofenceId - ID of the geofence
 * @returns Cache key for Redis
 */
export function getGeofenceStateKey(entityId: string, geofenceId: string): string {
  return `${GEOFENCE_STATE_CACHE_PREFIX}${entityId}:${geofenceId}`;
}

/**
 * Core algorithm for detecting when entities enter, exit, or dwell within geofences
 */
export class GeofenceDetector {
  private redisClient: Redis;
  private config: object;
  private searchRadiusMeters: number;
  private dwellTimeThresholdMs: number;

  /**
   * Creates a new GeofenceDetector instance
   * @param redisClient - Redis client for caching geofence states
   * @param config - Optional configuration parameters
   */
  constructor(redisClient: Redis, config: object = {}) {
    this.redisClient = redisClient;
    this.config = config;
    this.searchRadiusMeters = config['searchRadiusMeters'] || DEFAULT_SEARCH_RADIUS_METERS;
    this.dwellTimeThresholdMs = config['dwellTimeThresholdMs'] || DWELL_TIME_THRESHOLD_MS;
    
    logger.info('GeofenceDetector initialized', {
      searchRadiusMeters: this.searchRadiusMeters,
      dwellTimeThresholdMs: this.dwellTimeThresholdMs
    });
  }

  /**
   * Processes a position update to detect geofence events
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param latitude - Latitude of the position
   * @param longitude - Longitude of the position
   * @param timestamp - Timestamp of the position update
   * @returns Array of detected geofence events
   */
  async processPositionUpdate(
    entityId: string,
    entityType: EntityType,
    latitude: number,
    longitude: number,
    timestamp: Date
  ): Promise<GeofenceEventModel[]> {
    // Validate the input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (latitude === undefined || longitude === undefined) {
      throw new Error('Latitude and longitude are required');
    }
    
    if (!timestamp) {
      timestamp = new Date();
    }
    
    logger.debug(`Processing position update for ${entityType} ${entityId} at [${latitude}, ${longitude}]`);
    
    // Find nearby geofences using GeofenceModel.findNearby
    const nearbyGeofences = await GeofenceModel.findNearby(
      latitude,
      longitude,
      this.searchRadiusMeters,
      { entityType, active: true }
    );
    
    logger.debug(`Found ${nearbyGeofences.length} nearby geofences`);
    
    // Get the previous position of the entity using PositionModel.getByEntityId
    const previousPosition = await PositionModel.getByEntityId(entityId, entityType);
    
    // Initialize an array to store detected events
    const detectedEvents: GeofenceEventModel[] = [];
    
    // For each nearby geofence, check if the entity is inside using containsPoint
    for (const geofence of nearbyGeofences) {
      // Check if the entity is inside the geofence
      const isInside = await geofence.containsPoint(latitude, longitude);
      
      // For each geofence, get the previous state from Redis cache
      const previousState = await this.getGeofenceState(entityId, entityType, geofence.geofence_id);
      const wasInside = previousState ? previousState.isInside : false;
      
      // If entity is inside and was previously outside, create an ENTER event
      if (isInside && !wasInside) {
        logger.info(`Entity ${entityType} ${entityId} entered geofence ${geofence.geofence_id}`);
        
        const event = await this.createGeofenceEvent(
          geofence.geofence_id,
          entityId,
          entityType,
          GeofenceEventType.ENTER,
          latitude,
          longitude,
          timestamp
        );
        
        detectedEvents.push(event);
      } 
      // If entity is outside and was previously inside, create an EXIT event
      else if (!isInside && wasInside) {
        logger.info(`Entity ${entityType} ${entityId} exited geofence ${geofence.geofence_id}`);
        
        const event = await this.createGeofenceEvent(
          geofence.geofence_id,
          entityId,
          entityType,
          GeofenceEventType.EXIT,
          latitude,
          longitude,
          timestamp
        );
        
        detectedEvents.push(event);
      } 
      // If entity is inside and has been inside for longer than dwellTimeThreshold, create a DWELL event
      else if (isInside && wasInside) {
        const shouldGenerateDwellEvent = await this.checkDwellEvent(
          entityId,
          entityType,
          geofence.geofence_id,
          previousState,
          timestamp
        );
        
        if (shouldGenerateDwellEvent) {
          logger.info(`Entity ${entityType} ${entityId} dwelling in geofence ${geofence.geofence_id}`);
          
          const event = await this.createGeofenceEvent(
            geofence.geofence_id,
            entityId,
            entityType,
            GeofenceEventType.DWELL,
            latitude,
            longitude,
            timestamp
          );
          
          detectedEvents.push(event);
        }
      }
      
      // Update the geofence state in Redis cache
      await this.updateGeofenceState(
        entityId,
        entityType,
        geofence.geofence_id,
        isInside,
        timestamp
      );
    }
    
    return detectedEvents;
  }

  /**
   * Retrieves the current state of an entity with respect to a geofence
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param geofenceId - ID of the geofence
   * @returns The geofence state or null if not found
   */
  async getGeofenceState(
    entityId: string,
    entityType: EntityType,
    geofenceId: string
  ): Promise<object | null> {
    // Generate the cache key using getGeofenceStateKey
    const key = getGeofenceStateKey(entityId, geofenceId);
    
    // Retrieve the state from Redis
    const cachedState = await this.redisClient.get(key);
    
    // If found, parse the JSON string into an object
    if (cachedState) {
      try {
        return JSON.parse(cachedState);
      } catch (error) {
        logger.error(`Failed to parse cached geofence state for ${entityId} and ${geofenceId}`, { error });
      }
    }
    
    // If not found, check the database for the most recent event
    const latestEvent = await GeofenceEventModel.getLatestByEntityAndGeofence(
      entityId,
      entityType,
      geofenceId
    );
    
    // If a previous event exists, create a state object based on the event type
    if (latestEvent) {
      const state = {
        isInside: latestEvent.event_type === GeofenceEventType.ENTER || 
                  latestEvent.event_type === GeofenceEventType.DWELL,
        timestamp: latestEvent.timestamp,
        lastEventType: latestEvent.event_type,
        lastEventTime: latestEvent.timestamp
      };
      
      // Cache the state for future use
      await this.updateGeofenceState(
        entityId,
        entityType,
        geofenceId,
        state.isInside,
        state.timestamp
      );
      
      return state;
    }
    
    // Return null if no state exists
    return null;
  }

  /**
   * Updates the state of an entity with respect to a geofence
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param geofenceId - ID of the geofence
   * @param isInside - Whether the entity is inside the geofence
   * @param timestamp - Timestamp of the state update
   */
  async updateGeofenceState(
    entityId: string,
    entityType: EntityType,
    geofenceId: string,
    isInside: boolean,
    timestamp: Date
  ): Promise<void> {
    // Generate the cache key using getGeofenceStateKey
    const key = getGeofenceStateKey(entityId, geofenceId);
    
    // Create a state object with isInside flag and timestamp
    const state = {
      isInside,
      timestamp: timestamp,
      entityType,
      lastUpdated: new Date()
    };
    
    // Serialize the state object to JSON
    await this.redisClient.set(
      key,
      JSON.stringify(state),
      'EX',
      GEOFENCE_STATE_CACHE_TTL
    );
    
    // Log the state update
    logger.debug(`Updated geofence state for ${entityType} ${entityId} and geofence ${geofenceId}`, { isInside });
  }

  /**
   * Checks if a dwell event should be generated based on time spent in a geofence
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param geofenceId - ID of the geofence
   * @param state - Current state of the entity
   * @param currentTimestamp - Current timestamp
   * @returns True if a dwell event should be generated
   */
  async checkDwellEvent(
    entityId: string,
    entityType: EntityType,
    geofenceId: string,
    state: object | null,
    currentTimestamp: Date
  ): Promise<boolean> {
    // Check if the entity is currently inside the geofence
    if (!state || !state['isInside']) {
      return false;
    }
    
    // Calculate the time spent inside the geofence
    const entryTime = new Date(state['timestamp']);
    const timeSpentMs = currentTimestamp.getTime() - entryTime.getTime();
    
    // Check if the time exceeds the dwell time threshold
    if (timeSpentMs < this.dwellTimeThresholdMs) {
      return false;
    }
    
    // Check if a dwell event has already been generated recently
    const latestEvent = await GeofenceEventModel.getLatestByEntityAndGeofence(
      entityId,
      entityType,
      geofenceId
    );
    
    if (latestEvent && latestEvent.event_type === GeofenceEventType.DWELL) {
      const lastDwellTime = new Date(latestEvent.timestamp);
      const timeSinceLastDwellMs = currentTimestamp.getTime() - lastDwellTime.getTime();
      
      // Return true if a dwell event should be generated, false otherwise
      return timeSinceLastDwellMs >= this.dwellTimeThresholdMs;
    }
    
    return true;
  }

  /**
   * Creates a geofence event and returns the event model
   * @param geofenceId - ID of the geofence
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param eventType - Type of the event
   * @param latitude - Latitude of the position
   * @param longitude - Longitude of the position
   * @param timestamp - Timestamp of the event
   * @returns The created geofence event model
   */
  async createGeofenceEvent(
    geofenceId: string,
    entityId: string,
    entityType: EntityType,
    eventType: GeofenceEventType,
    latitude: number,
    longitude: number,
    timestamp: Date
  ): Promise<GeofenceEventModel> {
    // Call GeofenceEventModel.createEvent with the provided parameters
    const event = await GeofenceEventModel.createEvent(
      geofenceId,
      entityId,
      entityType,
      eventType,
      latitude,
      longitude,
      timestamp
    );
    
    // Log the event creation
    logger.info(`Created geofence event: ${entityType} ${entityId} ${eventType} geofence ${geofenceId}`, {
      eventType,
      entityId,
      entityType,
      geofenceId
    });
    
    return event;
  }

  /**
   * Clears the cached state for an entity and geofence
   * @param entityId - ID of the entity
   * @param geofenceId - ID of the geofence
   */
  async clearGeofenceState(
    entityId: string,
    geofenceId: string
  ): Promise<void> {
    // Generate the cache key using getGeofenceStateKey
    const key = getGeofenceStateKey(entityId, geofenceId);
    // Delete the key from Redis
    await this.redisClient.del(key);
    // Log the state clearing
    logger.debug(`Cleared geofence state for entity ${entityId} and geofence ${geofenceId}`);
  }
}