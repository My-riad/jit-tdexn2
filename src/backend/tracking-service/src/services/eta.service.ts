import Redis from 'ioredis';
import moment from 'moment';

import { EntityType } from '../../common/interfaces/position.interface';
import { Position } from '../../common/interfaces/position.interface';
import { LoadStatus } from '../../common/interfaces/load.interface';
import { calculateDistance } from '../../common/utils/geo-utils';
import { formatDate, formatDuration, addTime } from '../../common/utils/date-time';
import { PositionModel } from '../models/position.model';
import { HistoricalPositionModel } from '../models/historical-position.model';
import { calculateETA, calculateETAWithRoute, calculateRemainingDistance } from '../algorithms/eta-calculator';
import logger from '../../common/utils/logger';

// Cache configuration constants
const ETA_CACHE_TTL = 300; // 5 minutes in seconds
const ETA_CACHE_PREFIX = 'eta:';
const DEFAULT_CONFIDENCE_LEVEL = 0.75;

/**
 * Service class that provides ETA calculation functionality for tracked entities
 */
export class ETAService {
  private redisClient: Redis;
  
  /**
   * Creates a new ETAService instance with Redis caching
   */
  constructor() {
    // Initialize Redis client for caching ETA results
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    
    logger.info('ETAService initialized with Redis caching');
  }
  
  /**
   * Calculates the estimated time of arrival for an entity to a destination
   * 
   * @param entityId - Unique identifier for the entity
   * @param entityType - Type of the entity (driver, vehicle, load)
   * @param destLatitude - Destination latitude
   * @param destLongitude - Destination longitude
   * @param options - Additional options for calculation
   * @returns ETA information including arrival time, confidence level, and factors
   */
  async getETA(
    entityId: string,
    entityType: EntityType,
    destLatitude: number,
    destLongitude: number,
    options: {
      includeTraffic?: boolean;
      useHistoricalData?: boolean;
      adjustForDriverBehavior?: boolean;
      loadStatus?: LoadStatus;
      cacheTTL?: number;
    } = {}
  ): Promise<any> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (isNaN(destLatitude) || isNaN(destLongitude) || 
        destLatitude < -90 || destLatitude > 90 || 
        destLongitude < -180 || destLongitude > 180) {
      throw new Error('Invalid destination coordinates');
    }
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(
      entityId,
      entityType,
      destLatitude,
      destLongitude,
      false
    );
    
    // Check cache for existing ETA calculation
    const cachedResult = await this.getCachedETA(cacheKey);
    if (cachedResult) {
      logger.debug('Returning cached ETA result', { entityId, entityType, cacheKey });
      return cachedResult;
    }
    
    try {
      // Call ETA calculation algorithm
      const etaResult = await calculateETA(
        entityId,
        entityType,
        destLatitude,
        destLongitude,
        {
          includeTraffic: options.includeTraffic !== false,
          useHistoricalData: options.useHistoricalData !== false,
          adjustForDriverBehavior: options.adjustForDriverBehavior !== false,
          loadStatus: options.loadStatus
        }
      );
      
      // Format the result
      const formattedResult = this.formatETAResult(etaResult, entityId, entityType);
      
      // Cache the result for future requests
      await this.cacheETA(
        cacheKey,
        formattedResult,
        options.cacheTTL || ETA_CACHE_TTL
      );
      
      return formattedResult;
    } catch (error) {
      logger.error('Error calculating ETA', {
        error,
        entityId,
        entityType,
        destination: { latitude: destLatitude, longitude: destLongitude }
      });
      throw error;
    }
  }
  
  /**
   * Calculates ETA using actual route information rather than straight-line distance
   * 
   * @param entityId - Unique identifier for the entity
   * @param entityType - Type of the entity
   * @param destLatitude - Destination latitude
   * @param destLongitude - Destination longitude
   * @param routePoints - Array of route points (waypoints)
   * @param options - Additional options for calculation
   * @returns ETA information based on actual route
   */
  async getETAWithRouteInfo(
    entityId: string,
    entityType: EntityType,
    destLatitude: number,
    destLongitude: number,
    routePoints: Array<{ latitude: number; longitude: number }>,
    options: {
      includeTraffic?: boolean;
      useHistoricalData?: boolean;
      adjustForDriverBehavior?: boolean;
      loadStatus?: LoadStatus;
      cacheTTL?: number;
    } = {}
  ): Promise<any> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (isNaN(destLatitude) || isNaN(destLongitude) || 
        destLatitude < -90 || destLatitude > 90 || 
        destLongitude < -180 || destLongitude > 180) {
      throw new Error('Invalid destination coordinates');
    }
    
    if (!Array.isArray(routePoints) || routePoints.length === 0) {
      logger.warn('No route points provided, falling back to standard ETA calculation', { 
        entityId, entityType 
      });
      return this.getETA(entityId, entityType, destLatitude, destLongitude, options);
    }
    
    // Validate route points
    for (const point of routePoints) {
      if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number' ||
          point.latitude < -90 || point.latitude > 90 || 
          point.longitude < -180 || point.longitude > 180) {
        throw new Error('Invalid route point coordinates');
      }
    }
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(
      entityId,
      entityType,
      destLatitude,
      destLongitude,
      true
    );
    
    // Check cache for existing route-based ETA calculation
    const cachedResult = await this.getCachedETA(cacheKey);
    if (cachedResult) {
      logger.debug('Returning cached route-based ETA result', { 
        entityId, entityType, cacheKey, routePoints: routePoints.length 
      });
      return cachedResult;
    }
    
    try {
      // Call route-based ETA calculation algorithm
      const etaResult = await calculateETAWithRoute(
        entityId,
        entityType,
        destLatitude,
        destLongitude,
        routePoints,
        {
          includeTraffic: options.includeTraffic !== false,
          useHistoricalData: options.useHistoricalData !== false,
          adjustForDriverBehavior: options.adjustForDriverBehavior !== false,
          loadStatus: options.loadStatus
        }
      );
      
      // Format the result
      const formattedResult = this.formatETAResult(etaResult, entityId, entityType);
      
      // Include segment ETAs if available
      if (etaResult.segmentETAs) {
        formattedResult.segments = etaResult.segmentETAs.map(segment => ({
          latitude: segment.latitude,
          longitude: segment.longitude,
          eta: segment.eta.toISOString()
        }));
      }
      
      // Cache the result for future requests
      await this.cacheETA(
        cacheKey,
        formattedResult,
        options.cacheTTL || ETA_CACHE_TTL
      );
      
      return formattedResult;
    } catch (error) {
      logger.error('Error calculating route-based ETA', {
        error,
        entityId,
        entityType,
        destination: { latitude: destLatitude, longitude: destLongitude },
        routePoints: routePoints.length
      });
      throw error;
    }
  }
  
  /**
   * Calculates ETAs for multiple entities to the same destination
   * 
   * @param entityIds - Array of entity IDs
   * @param entityType - Type of the entities
   * @param destLatitude - Destination latitude
   * @param destLongitude - Destination longitude
   * @param options - Additional options for calculation
   * @returns Array of ETA information for each entity
   */
  async getETAForMultipleEntities(
    entityIds: string[],
    entityType: EntityType,
    destLatitude: number,
    destLongitude: number,
    options: {
      includeTraffic?: boolean;
      useHistoricalData?: boolean;
      adjustForDriverBehavior?: boolean;
      loadStatus?: LoadStatus;
      cacheTTL?: number;
    } = {}
  ): Promise<any[]> {
    // Validate input parameters
    if (!Array.isArray(entityIds) || entityIds.length === 0) {
      throw new Error('At least one entity ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    if (isNaN(destLatitude) || isNaN(destLongitude) || 
        destLatitude < -90 || destLatitude > 90 || 
        destLongitude < -180 || destLongitude > 180) {
      throw new Error('Invalid destination coordinates');
    }
    
    try {
      // Process each entity ID in parallel
      const etaPromises = entityIds.map(entityId => 
        this.getETA(
          entityId,
          entityType,
          destLatitude,
          destLongitude,
          options
        )
      );
      
      // Wait for all ETAs to be calculated
      const results = await Promise.all(etaPromises);
      
      logger.debug('Calculated ETAs for multiple entities', { 
        entityType, entityCount: entityIds.length 
      });
      
      return results;
    } catch (error) {
      logger.error('Error calculating ETAs for multiple entities', {
        error,
        entityType,
        entityCount: entityIds.length,
        destination: { latitude: destLatitude, longitude: destLongitude }
      });
      throw error;
    }
  }
  
  /**
   * Calculates ETAs for a single entity to multiple destinations
   * 
   * @param entityId - Entity ID
   * @param entityType - Type of the entity
   * @param destinations - Array of destination coordinates
   * @param options - Additional options for calculation
   * @returns Array of ETA information for each destination
   */
  async getETAToMultipleDestinations(
    entityId: string,
    entityType: EntityType,
    destinations: Array<{ latitude: number; longitude: number }>,
    options: {
      includeTraffic?: boolean;
      useHistoricalData?: boolean;
      adjustForDriverBehavior?: boolean;
      loadStatus?: LoadStatus;
      cacheTTL?: number;
    } = {}
  ): Promise<any[]> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (!Array.isArray(destinations) || destinations.length === 0) {
      throw new Error('At least one destination is required');
    }
    
    try {
      // Process each destination in parallel
      const etaPromises = destinations.map(destination => 
        this.getETA(
          entityId,
          entityType,
          destination.latitude,
          destination.longitude,
          options
        )
      );
      
      // Wait for all ETAs to be calculated
      const results = await Promise.all(etaPromises);
      
      logger.debug('Calculated ETAs to multiple destinations', { 
        entityId, entityType, destinationCount: destinations.length 
      });
      
      return results;
    } catch (error) {
      logger.error('Error calculating ETAs to multiple destinations', {
        error,
        entityId,
        entityType,
        destinationCount: destinations.length
      });
      throw error;
    }
  }
  
  /**
   * Calculates the remaining distance to a destination for an entity
   * 
   * @param entityId - Entity ID
   * @param entityType - Type of the entity
   * @param destLatitude - Destination latitude
   * @param destLongitude - Destination longitude
   * @param routePoints - Optional array of route points
   * @returns Remaining distance in kilometers
   */
  async getRemainingDistance(
    entityId: string,
    entityType: EntityType,
    destLatitude: number,
    destLongitude: number,
    routePoints?: Array<{ latitude: number; longitude: number }>
  ): Promise<number> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (isNaN(destLatitude) || isNaN(destLongitude) || 
        destLatitude < -90 || destLatitude > 90 || 
        destLongitude < -180 || destLongitude > 180) {
      throw new Error('Invalid destination coordinates');
    }
    
    try {
      // Get current position of the entity
      const currentPosition = await PositionModel.getByEntityId(entityId, entityType);
      
      if (!currentPosition) {
        throw new Error(`No position data found for ${entityType} ${entityId}`);
      }
      
      // Calculate remaining distance
      let remainingDistance: number;
      
      if (routePoints && routePoints.length > 0) {
        // Use route information if provided
        remainingDistance = calculateRemainingDistance(
          {
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude
          },
          destLatitude,
          destLongitude,
          routePoints
        );
      } else {
        // Use straight-line distance if no route provided
        remainingDistance = calculateDistance(
          currentPosition.latitude,
          currentPosition.longitude,
          destLatitude,
          destLongitude,
          'km'
        );
      }
      
      logger.debug('Calculated remaining distance', { 
        entityId, entityType, remainingDistance 
      });
      
      return remainingDistance;
    } catch (error) {
      logger.error('Error calculating remaining distance', {
        error,
        entityId,
        entityType,
        destination: { latitude: destLatitude, longitude: destLongitude }
      });
      throw error;
    }
  }
  
  /**
   * Invalidates cached ETA results for an entity
   * 
   * @param entityId - Entity ID
   * @param entityType - Type of the entity
   * @returns Promise that resolves when cache is invalidated
   */
  async invalidateETACache(
    entityId: string,
    entityType: EntityType
  ): Promise<void> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    try {
      // Generate cache key pattern for the entity
      const cachePattern = `${ETA_CACHE_PREFIX}${entityId}:${entityType}:*`;
      
      // Find all matching cache keys
      let cursor = '0';
      let keys: string[] = [];
      
      do {
        // Scan for keys matching the pattern
        const reply = await this.redisClient.scan(
          cursor,
          'MATCH',
          cachePattern,
          'COUNT',
          '100'
        );
        
        cursor = reply[0];
        keys = keys.concat(reply[1]);
      } while (cursor !== '0');
      
      // Delete all found keys
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        logger.info(`Invalidated ${keys.length} ETA cache entries for ${entityType} ${entityId}`);
      } else {
        logger.debug(`No ETA cache entries found for ${entityType} ${entityId}`);
      }
    } catch (error) {
      logger.error('Error invalidating ETA cache', { error, entityId, entityType });
      throw error;
    }
  }
  
  /**
   * Retrieves a cached ETA result if available
   * 
   * @param cacheKey - Cache key to look up
   * @returns Cached ETA result or null if not found
   */
  private async getCachedETA(cacheKey: string): Promise<any | null> {
    try {
      const cachedValue = await this.redisClient.get(cacheKey);
      
      if (cachedValue) {
        return JSON.parse(cachedValue);
      }
      
      return null;
    } catch (error) {
      logger.error('Error retrieving cached ETA', { error, cacheKey });
      return null; // Continue without cache on error
    }
  }
  
  /**
   * Caches an ETA result for future requests
   * 
   * @param cacheKey - Cache key for storing the result
   * @param etaResult - ETA result to cache
   * @param ttl - Time-to-live in seconds
   */
  private async cacheETA(cacheKey: string, etaResult: any, ttl: number): Promise<void> {
    try {
      const serializedResult = JSON.stringify(etaResult);
      await this.redisClient.setex(cacheKey, ttl, serializedResult);
      logger.debug('Cached ETA result', { cacheKey, ttl });
    } catch (error) {
      logger.error('Error caching ETA result', { error, cacheKey });
      // Continue without caching on error
    }
  }
  
  /**
   * Generates a cache key for ETA results
   * 
   * @param entityId - Entity ID
   * @param entityType - Type of the entity
   * @param destLatitude - Destination latitude
   * @param destLongitude - Destination longitude
   * @param withRoute - Whether this is a route-based ETA
   * @returns Cache key for the ETA result
   */
  private generateCacheKey(
    entityId: string,
    entityType: EntityType,
    destLatitude: number,
    destLongitude: number,
    withRoute: boolean
  ): string {
    // Format coordinates to fixed precision to ensure consistent keys
    const lat = destLatitude.toFixed(6);
    const lng = destLongitude.toFixed(6);
    
    return `${ETA_CACHE_PREFIX}${entityId}:${entityType}:${lat}:${lng}:${withRoute ? 'route' : 'direct'}`;
  }
  
  /**
   * Formats the raw ETA calculation into a standardized response
   * 
   * @param rawETA - Raw ETA calculation result
   * @param entityId - Entity ID
   * @param entityType - Type of the entity
   * @returns Formatted ETA result
   */
  private formatETAResult(rawETA: any, entityId: string, entityType: EntityType): any {
    return {
      entityId,
      entityType,
      destination: {
        latitude: rawETA.destination?.latitude || null,
        longitude: rawETA.destination?.longitude || null
      },
      arrivalTime: rawETA.arrivalTime.toISOString(),
      travelTime: formatDuration(rawETA.estimatedDuration),
      remainingDistance: Math.round(rawETA.remainingDistance * 10) / 10, // Round to 1 decimal place
      confidenceLevel: rawETA.confidenceLevel || DEFAULT_CONFIDENCE_LEVEL,
      factors: rawETA.factors || {},
      calculatedAt: new Date().toISOString()
    };
  }
}