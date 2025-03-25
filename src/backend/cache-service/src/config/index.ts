/**
 * Cache Service Configuration Module
 * 
 * This module provides cache-specific configuration settings, including Redis connection parameters,
 * cache TTL policies, key prefixes, and service settings. It extends the common configuration 
 * with cache-specific functionality required by the Cache Service microservice.
 */

import { getEnv, getEnvNumber, getEnvBoolean, requireEnv } from '../../../common/config/environment.config';
import { getRedisConfig } from '../../../common/config/redis.config';
import logger from '../../../common/utils/logger';

/**
 * Enum defining different types of caches with different TTL policies
 */
export enum CacheType {
  // General purpose caches with time-based TTLs
  SHORT_TERM = 'SHORT_TERM',       // For data that changes frequently (e.g., position updates)
  MEDIUM_TERM = 'MEDIUM_TERM',     // For data that changes occasionally (e.g., load status)
  LONG_TERM = 'LONG_TERM',         // For relatively stable data (e.g., driver profiles)
  
  // Domain-specific caches
  DRIVER_DATA = 'DRIVER_DATA',         // Driver profiles and preferences
  LOAD_DATA = 'LOAD_DATA',             // Load details and status
  POSITION_DATA = 'POSITION_DATA',     // Real-time position tracking data
  OPTIMIZATION_RESULT = 'OPTIMIZATION_RESULT', // Results from optimization engine
  LEADERBOARD = 'LEADERBOARD',         // Driver rankings and scores
  MARKET_DATA = 'MARKET_DATA',         // Rate information and market intelligence
  USER_SESSION = 'USER_SESSION',       // User session data
  GEOSPATIAL = 'GEOSPATIAL'            // Geospatial queries and proximity searches
}

/**
 * Interface defining cache service configuration options
 */
export interface CacheServiceConfig {
  host: string;                     // Host address where the cache service listens
  port: number;                     // Port on which the cache service operates
  redis: object;                    // Redis connection configuration
  compressionEnabled: boolean;      // Whether to compress cached data
  defaultTTL: number;               // Default time-to-live for cache entries (in seconds)
  ttlByType: Record<CacheType, number>; // Specific TTL values for different cache types
}

// Default service configuration constants
export const CACHE_SERVICE_HOST = getEnv('CACHE_SERVICE_HOST', '0.0.0.0');
export const CACHE_SERVICE_PORT = getEnvNumber('CACHE_SERVICE_PORT', 3020);
export const DEFAULT_CACHE_TTL = getEnvNumber('DEFAULT_CACHE_TTL', 3600); // 1 hour default

/**
 * Retrieves cache service configuration from environment variables with sensible defaults
 * 
 * @returns Configuration object for the cache service
 */
export const getCacheServiceConfig = (): CacheServiceConfig => {
  // Get base Redis configuration
  const redisConfig = getRedisConfig();
  
  // Get cache-specific configuration from environment
  const host = getEnv('CACHE_SERVICE_HOST', '0.0.0.0');
  const port = getEnvNumber('CACHE_SERVICE_PORT', 3020);
  const compressionEnabled = getEnvBoolean('CACHE_COMPRESSION_ENABLED', true);
  const defaultTTL = getEnvNumber('DEFAULT_CACHE_TTL', 3600); // 1 hour default
  
  // Define TTL values for different cache types
  // These values can be overridden with environment variables
  const ttlByType: Record<CacheType, number> = {
    [CacheType.SHORT_TERM]: getEnvNumber('CACHE_TTL_SHORT_TERM', 300),           // 5 minutes
    [CacheType.MEDIUM_TERM]: getEnvNumber('CACHE_TTL_MEDIUM_TERM', 1800),        // 30 minutes
    [CacheType.LONG_TERM]: getEnvNumber('CACHE_TTL_LONG_TERM', 86400),           // 24 hours
    [CacheType.DRIVER_DATA]: getEnvNumber('CACHE_TTL_DRIVER_DATA', 1800),        // 30 minutes
    [CacheType.LOAD_DATA]: getEnvNumber('CACHE_TTL_LOAD_DATA', 900),             // 15 minutes
    [CacheType.POSITION_DATA]: getEnvNumber('CACHE_TTL_POSITION_DATA', 300),     // 5 minutes
    [CacheType.OPTIMIZATION_RESULT]: getEnvNumber('CACHE_TTL_OPTIMIZATION', 900), // 15 minutes
    [CacheType.LEADERBOARD]: getEnvNumber('CACHE_TTL_LEADERBOARD', 3600),        // 1 hour
    [CacheType.MARKET_DATA]: getEnvNumber('CACHE_TTL_MARKET_DATA', 900),         // 15 minutes
    [CacheType.USER_SESSION]: getEnvNumber('CACHE_TTL_USER_SESSION', 86400),     // 24 hours
    [CacheType.GEOSPATIAL]: getEnvNumber('CACHE_TTL_GEOSPATIAL', 300),           // 5 minutes
  };
  
  // Log configuration summary
  logger.info('Cache service configuration loaded', {
    host,
    port,
    compressionEnabled,
    defaultTTL,
    ttlConfig: Object.keys(ttlByType).length
  });
  
  // Return the complete configuration object
  return {
    host,
    port,
    redis: redisConfig,
    compressionEnabled,
    defaultTTL,
    ttlByType
  };
};

/**
 * Generates a standardized cache key prefix for a given namespace
 * 
 * @param namespace - The namespace to use for the key prefix
 * @returns Formatted cache key prefix
 */
export const getCacheKeyPrefix = (namespace: string): string => {
  if (!namespace) {
    logger.warn('Empty namespace provided for cache key prefix, using "default"');
    namespace = 'default';
  }
  
  // Format namespace to ensure consistency (lowercase, no spaces)
  const formattedNamespace = namespace.toLowerCase().replace(/\s+/g, '-');
  
  // Get global prefix from environment or use default
  const globalPrefix = getEnv('CACHE_GLOBAL_PREFIX', 'freight');
  
  // Combine global prefix and namespace with appropriate separator
  return `${globalPrefix}:${formattedNamespace}`;
};

/**
 * Determines the appropriate TTL for a cache entry based on cache type and custom override
 * 
 * @param cacheType - The type of cache to get TTL for
 * @param customTTL - Optional custom TTL override (in seconds)
 * @returns TTL in seconds
 */
export const getCacheTTL = (cacheType: CacheType, customTTL?: number): number => {
  // If a valid custom TTL is provided, use it
  if (customTTL !== undefined && customTTL > 0) {
    return customTTL;
  }
  
  // Get configuration with TTL values by type
  const config = getCacheServiceConfig();
  
  // If cacheType is provided, return the corresponding TTL from configuration
  if (cacheType && config.ttlByType[cacheType]) {
    return config.ttlByType[cacheType];
  }
  
  // Default fallback
  return config.defaultTTL;
};