import { promisify } from 'util';
import * as zlib from 'zlib'; // zlib@1.0.5
import RedisService from './redis.service';
import { CacheType, getCacheKeyPrefix, getCacheTTL } from '../config';
import logger from '../../../common/utils/logger';

// Global map to store factory callbacks for computed caches
const computedCacheCallbacks = new Map<string, () => Promise<any>>();

/**
 * Compresses data using zlib to reduce memory usage in Redis
 * 
 * @param data - The string data to compress
 * @returns Promise that resolves to compressed data as a base64 string
 */
export const compressData = async (data: string): Promise<string> => {
  try {
    if (!data || typeof data !== 'string') {
      return data;
    }
    
    const deflate = promisify(zlib.deflate);
    const buffer = await deflate(Buffer.from(data, 'utf8'));
    return buffer.toString('base64');
  } catch (error) {
    logger.error('Error compressing data', { error });
    throw error;
  }
};

/**
 * Decompresses data that was previously compressed with zlib
 * 
 * @param compressedData - The compressed data as a base64 string
 * @returns Promise that resolves to the original uncompressed data
 */
export const decompressData = async (compressedData: string): Promise<string> => {
  try {
    if (!compressedData || typeof compressedData !== 'string') {
      return compressedData;
    }
    
    const inflate = promisify(zlib.inflate);
    const buffer = await inflate(Buffer.from(compressedData, 'base64'));
    return buffer.toString('utf8');
  } catch (error) {
    logger.error('Error decompressing data', { error });
    throw error;
  }
};

/**
 * Formats a cache key with the appropriate namespace prefix
 * 
 * @param namespace - The namespace for the key
 * @param key - The original key
 * @returns Formatted cache key with namespace prefix
 */
export const formatCacheKey = (namespace: string, key: string): string => {
  const prefix = getCacheKeyPrefix(namespace);
  return `${prefix}:${key}`;
};

/**
 * Service that provides high-level caching functionality with various strategies
 * and data structures to support the AI-driven Freight Optimization Platform.
 */
export default class CacheService {
  private redisService: RedisService;
  private compressionEnabled: boolean;

  /**
   * Initializes the cache service with a Redis service instance
   * 
   * @param compressionEnabled - Whether to enable data compression (default: true)
   */
  constructor(compressionEnabled: boolean = true) {
    this.redisService = new RedisService();
    this.compressionEnabled = compressionEnabled;
    logger.info('CacheService initialized', { compressionEnabled });
  }

  /**
   * Establishes a connection to Redis if not already connected
   * 
   * @returns Promise that resolves when connection is established
   */
  async connect(): Promise<void> {
    await this.redisService.connect();
    logger.info('CacheService connected to Redis');
  }

  /**
   * Closes the Redis connection if open
   * 
   * @returns Promise that resolves when connection is closed
   */
  async disconnect(): Promise<void> {
    await this.redisService.disconnect();
    logger.info('CacheService disconnected from Redis');
  }

  /**
   * Checks if the Redis client is connected
   * 
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.redisService.isConnected();
  }

  /**
   * Retrieves a value from the cache by namespace and key
   * 
   * @param namespace - The namespace for the key
   * @param key - The key to retrieve
   * @returns Promise that resolves to the cached value or null if not found
   */
  async get(namespace: string, key: string): Promise<any | null> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      const cachedValue = await this.redisService.get(cacheKey);
      
      if (!cachedValue) {
        return null;
      }
      
      // Decompress if necessary
      const processedValue = this.compressionEnabled 
        ? await decompressData(cachedValue) 
        : cachedValue;
      
      return JSON.parse(processedValue);
    } catch (error) {
      logger.error('Error getting value from cache', { namespace, key, error });
      return null;
    }
  }

  /**
   * Sets a value in the cache with namespace, key, and optional TTL
   * 
   * @param namespace - The namespace for the key
   * @param key - The key to set
   * @param value - The value to store
   * @param cacheType - The type of cache for TTL determination
   * @param customTTL - Optional custom TTL in seconds
   * @returns Promise that resolves to true if successful
   */
  async set(
    namespace: string, 
    key: string, 
    value: any, 
    cacheType: CacheType = CacheType.MEDIUM_TERM,
    customTTL?: number
  ): Promise<boolean> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      
      // Convert value to string
      const stringValue = JSON.stringify(value);
      
      // Compress if enabled
      const processedValue = this.compressionEnabled 
        ? await compressData(stringValue) 
        : stringValue;
      
      // Determine TTL
      const ttl = getCacheTTL(cacheType, customTTL);
      
      // Store in Redis
      await this.redisService.set(cacheKey, processedValue, ttl);
      
      return true;
    } catch (error) {
      logger.error('Error setting value in cache', { namespace, key, cacheType, error });
      return false;
    }
  }

  /**
   * Deletes a value from the cache by namespace and key
   * 
   * @param namespace - The namespace for the key
   * @param key - The key to delete
   * @returns Promise that resolves to true if key was deleted
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      return await this.redisService.del(cacheKey);
    } catch (error) {
      logger.error('Error deleting value from cache', { namespace, key, error });
      return false;
    }
  }

  /**
   * Checks if a key exists in the cache by namespace and key
   * 
   * @param namespace - The namespace for the key
   * @param key - The key to check
   * @returns Promise that resolves to true if key exists
   */
  async exists(namespace: string, key: string): Promise<boolean> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      return await this.redisService.exists(cacheKey);
    } catch (error) {
      logger.error('Error checking if key exists in cache', { namespace, key, error });
      return false;
    }
  }

  /**
   * Gets a value from cache or sets it if not found using the provided factory function
   * (Look-aside cache pattern implementation)
   * 
   * @param namespace - The namespace for the key
   * @param key - The key to get or set
   * @param factory - Function that generates the value if not in cache
   * @param cacheType - The type of cache for TTL determination
   * @param customTTL - Optional custom TTL in seconds
   * @returns Promise that resolves to the cached or newly generated value
   */
  async getOrSet<T>(
    namespace: string, 
    key: string, 
    factory: () => Promise<T>,
    cacheType: CacheType = CacheType.MEDIUM_TERM,
    customTTL?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cachedValue = await this.get(namespace, key);
      
      if (cachedValue !== null) {
        logger.debug('Cache hit', { namespace, key });
        return cachedValue as T;
      }
      
      logger.debug('Cache miss, executing factory function', { namespace, key });
      
      // Generate value using factory
      const value = await factory();
      
      // Store in cache
      await this.set(namespace, key, value, cacheType, customTTL);
      
      // Store the factory for potential future invalidation
      const cacheKey = formatCacheKey(namespace, key);
      computedCacheCallbacks.set(cacheKey, factory);
      
      return value;
    } catch (error) {
      logger.error('Error in getOrSet cache operation', { namespace, key, cacheType, error });
      throw error;
    }
  }

  /**
   * Retrieves multiple values from the cache in a single operation
   * 
   * @param namespace - The namespace for the keys
   * @param keys - Array of keys to retrieve
   * @returns Promise that resolves to array of values or null for keys not found
   */
  async mget(namespace: string, keys: string[]): Promise<Array<any | null>> {
    try {
      // Format all keys with namespace
      const cacheKeys = keys.map(key => formatCacheKey(namespace, key));
      
      // Get values from Redis
      const cachedValues = await this.redisService.mget(cacheKeys);
      
      // Process each value
      const processedValues = await Promise.all(
        cachedValues.map(async (value) => {
          if (!value) {
            return null;
          }
          
          // Decompress if necessary
          const processedValue = this.compressionEnabled 
            ? await decompressData(value) 
            : value;
          
          return JSON.parse(processedValue);
        })
      );
      
      return processedValues;
    } catch (error) {
      logger.error('Error getting multiple values from cache', { namespace, keys, error });
      return keys.map(() => null);
    }
  }

  /**
   * Sets multiple key-value pairs in the cache in a single operation
   * 
   * @param namespace - The namespace for the keys
   * @param entries - Object with key-value pairs to set
   * @param cacheType - The type of cache for TTL determination
   * @param customTTL - Optional custom TTL in seconds
   * @returns Promise that resolves to true if successful
   */
  async mset(
    namespace: string, 
    entries: Record<string, any>,
    cacheType: CacheType = CacheType.MEDIUM_TERM,
    customTTL?: number
  ): Promise<boolean> {
    try {
      // Process entries into key-value map with namespace
      const processedEntries: Record<string, string> = {};
      
      for (const [key, value] of Object.entries(entries)) {
        const cacheKey = formatCacheKey(namespace, key);
        const stringValue = JSON.stringify(value);
        
        processedEntries[cacheKey] = this.compressionEnabled 
          ? await compressData(stringValue) 
          : stringValue;
      }
      
      // Set all values in Redis
      const result = await this.redisService.mset(processedEntries);
      
      // Set expiration for each key if TTL specified
      if (result && (customTTL || cacheType)) {
        const ttl = getCacheTTL(cacheType, customTTL);
        
        await Promise.all(
          Object.keys(processedEntries).map(cacheKey => 
            this.redisService.expire(cacheKey, ttl)
          )
        );
      }
      
      return result;
    } catch (error) {
      logger.error('Error setting multiple values in cache', { namespace, entries, error });
      return false;
    }
  }

  /**
   * Invalidates a computed cache entry and regenerates it using the registered callback
   * 
   * @param namespace - The namespace for the key
   * @param key - The key to invalidate
   * @param cacheType - The type of cache for TTL determination
   * @param customTTL - Optional custom TTL in seconds
   * @returns Promise that resolves to true if invalidation was successful
   */
  async invalidateComputedCache(
    namespace: string, 
    key: string,
    cacheType: CacheType = CacheType.MEDIUM_TERM,
    customTTL?: number
  ): Promise<boolean> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      
      // Check if callback exists
      const factory = computedCacheCallbacks.get(cacheKey);
      if (!factory) {
        logger.warn('No factory function found for computed cache invalidation', { namespace, key });
        return false;
      }
      
      // Delete current value
      await this.delete(namespace, key);
      
      // Generate new value
      const value = await factory();
      
      // Store new value
      await this.set(namespace, key, value, cacheType, customTTL);
      
      logger.info('Computed cache invalidated and regenerated', { namespace, key });
      return true;
    } catch (error) {
      logger.error('Error invalidating computed cache', { namespace, key, error });
      return false;
    }
  }

  /**
   * Increments a numeric value stored at key
   * 
   * @param namespace - The namespace for the key
   * @param key - The key to increment
   * @param increment - Amount to increment by (default: 1)
   * @returns Promise that resolves to the value after increment
   */
  async increment(namespace: string, key: string, increment?: number): Promise<number> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      
      if (increment) {
        return await this.redisService.incrby(cacheKey, increment);
      } else {
        return await this.redisService.incr(cacheKey);
      }
    } catch (error) {
      logger.error('Error incrementing value in cache', { namespace, key, increment, error });
      throw error;
    }
  }

  /**
   * Decrements a numeric value stored at key
   * 
   * @param namespace - The namespace for the key
   * @param key - The key to decrement
   * @param decrement - Amount to decrement by (default: 1)
   * @returns Promise that resolves to the value after decrement
   */
  async decrement(namespace: string, key: string, decrement?: number): Promise<number> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      
      if (decrement) {
        return await this.redisService.decrby(cacheKey, decrement);
      } else {
        return await this.redisService.decr(cacheKey);
      }
    } catch (error) {
      logger.error('Error decrementing value in cache', { namespace, key, decrement, error });
      throw error;
    }
  }

  /**
   * Deletes all keys in a namespace
   * 
   * @param namespace - The namespace to flush
   * @returns Promise that resolves to number of keys deleted
   */
  async flushNamespace(namespace: string): Promise<number> {
    try {
      const prefix = getCacheKeyPrefix(namespace);
      const pattern = `${prefix}:*`;
      
      const deletedCount = await this.redisService.flushByPattern(pattern);
      logger.info('Namespace flushed from cache', { namespace, deletedCount });
      
      return deletedCount;
    } catch (error) {
      logger.error('Error flushing namespace from cache', { namespace, error });
      throw error;
    }
  }

  /**
   * Gets a field from a hash stored at key
   * 
   * @param namespace - The namespace for the key
   * @param key - Hash key
   * @param field - Hash field
   * @returns Promise that resolves to the field value or null
   */
  async getHashField(namespace: string, key: string, field: string): Promise<any | null> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      const fieldValue = await this.redisService.hget(cacheKey, field);
      
      if (!fieldValue) {
        return null;
      }
      
      // Decompress if necessary
      const processedValue = this.compressionEnabled 
        ? await decompressData(fieldValue) 
        : fieldValue;
      
      return JSON.parse(processedValue);
    } catch (error) {
      logger.error('Error getting hash field from cache', { namespace, key, field, error });
      return null;
    }
  }

  /**
   * Sets a field in a hash stored at key
   * 
   * @param namespace - The namespace for the key
   * @param key - Hash key
   * @param field - Hash field
   * @param value - Field value
   * @param cacheType - The type of cache for TTL determination
   * @param customTTL - Optional custom TTL in seconds
   * @returns Promise that resolves to true if field was new
   */
  async setHashField(
    namespace: string, 
    key: string, 
    field: string, 
    value: any,
    cacheType: CacheType = CacheType.MEDIUM_TERM,
    customTTL?: number
  ): Promise<boolean> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      
      // Convert value to string
      const stringValue = JSON.stringify(value);
      
      // Compress if enabled
      const processedValue = this.compressionEnabled 
        ? await compressData(stringValue) 
        : stringValue;
      
      // Set hash field
      const result = await this.redisService.hset(cacheKey, field, processedValue);
      
      // Set expiration for the hash key if TTL specified
      if (customTTL || cacheType) {
        const ttl = getCacheTTL(cacheType, customTTL);
        await this.redisService.expire(cacheKey, ttl);
      }
      
      return result;
    } catch (error) {
      logger.error('Error setting hash field in cache', { namespace, key, field, error });
      return false;
    }
  }

  /**
   * Deletes a field from a hash stored at key
   * 
   * @param namespace - The namespace for the key
   * @param key - Hash key
   * @param field - Hash field
   * @returns Promise that resolves to true if field was deleted
   */
  async deleteHashField(namespace: string, key: string, field: string): Promise<boolean> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      return await this.redisService.hdel(cacheKey, field);
    } catch (error) {
      logger.error('Error deleting hash field from cache', { namespace, key, field, error });
      return false;
    }
  }

  /**
   * Gets all fields and values from a hash stored at key
   * 
   * @param namespace - The namespace for the key
   * @param key - Hash key
   * @returns Promise that resolves to object with all fields and values
   */
  async getAllHashFields(namespace: string, key: string): Promise<Record<string, any> | null> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      const hash = await this.redisService.hgetall(cacheKey);
      
      if (!hash) {
        return null;
      }
      
      // Process each field value
      const processedHash: Record<string, any> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        // Decompress if necessary
        const processedValue = this.compressionEnabled 
          ? await decompressData(value) 
          : value;
        
        processedHash[field] = JSON.parse(processedValue);
      }
      
      return processedHash;
    } catch (error) {
      logger.error('Error getting all hash fields from cache', { namespace, key, error });
      return null;
    }
  }

  /**
   * Adds a member with score to a sorted set
   * 
   * @param namespace - The namespace for the key
   * @param key - Sorted set key
   * @param score - Member score
   * @param member - Member value
   * @param cacheType - The type of cache for TTL determination
   * @param customTTL - Optional custom TTL in seconds
   * @returns Promise that resolves to number of elements added
   */
  async addToSortedSet(
    namespace: string, 
    key: string, 
    score: number, 
    member: string,
    cacheType: CacheType = CacheType.MEDIUM_TERM,
    customTTL?: number
  ): Promise<number> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      
      // Add to sorted set
      const result = await this.redisService.zadd(cacheKey, score, member);
      
      // Set expiration if TTL specified
      if (customTTL || cacheType) {
        const ttl = getCacheTTL(cacheType, customTTL);
        await this.redisService.expire(cacheKey, ttl);
      }
      
      return result;
    } catch (error) {
      logger.error('Error adding to sorted set in cache', { namespace, key, score, member, error });
      throw error;
    }
  }

  /**
   * Gets a range of members from a sorted set by index
   * 
   * @param namespace - The namespace for the key
   * @param key - Sorted set key
   * @param start - Start index
   * @param stop - Stop index
   * @param withScores - Whether to include scores in result
   * @returns Promise that resolves to array of members or [member, score] pairs
   */
  async getSortedSetRange(
    namespace: string, 
    key: string, 
    start: number, 
    stop: number,
    withScores: boolean = false
  ): Promise<string[] | Array<[string, number]>> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      const result = await this.redisService.zrange(cacheKey, start, stop, withScores);
      
      if (withScores && Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        // Convert string scores to numbers
        return (result as Array<[string, string]>).map(
          ([member, score]) => [member, parseFloat(score)]
        );
      }
      
      return result as string[];
    } catch (error) {
      logger.error('Error getting range from sorted set in cache', { 
        namespace, key, start, stop, withScores, error 
      });
      return withScores ? [] : [];
    }
  }

  /**
   * Gets a range of members from a sorted set by index in reverse order
   * 
   * @param namespace - The namespace for the key
   * @param key - Sorted set key
   * @param start - Start index
   * @param stop - Stop index
   * @param withScores - Whether to include scores in result
   * @returns Promise that resolves to array of members or [member, score] pairs in reverse order
   */
  async getSortedSetReverseRange(
    namespace: string, 
    key: string, 
    start: number, 
    stop: number,
    withScores: boolean = false
  ): Promise<string[] | Array<[string, number]>> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      const result = await this.redisService.zrevrange(cacheKey, start, stop, withScores);
      
      if (withScores && Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        // Convert string scores to numbers
        return (result as Array<[string, string]>).map(
          ([member, score]) => [member, parseFloat(score)]
        );
      }
      
      return result as string[];
    } catch (error) {
      logger.error('Error getting reverse range from sorted set in cache', { 
        namespace, key, start, stop, withScores, error 
      });
      return withScores ? [] : [];
    }
  }

  /**
   * Removes members from a sorted set
   * 
   * @param namespace - The namespace for the key
   * @param key - Sorted set key
   * @param members - Members to remove
   * @returns Promise that resolves to number of members removed
   */
  async removeFromSortedSet(
    namespace: string, 
    key: string, 
    members: string[]
  ): Promise<number> {
    try {
      const cacheKey = formatCacheKey(namespace, key);
      return await this.redisService.zrem(cacheKey, members);
    } catch (error) {
      logger.error('Error removing from sorted set in cache', { namespace, key, members, error });
      throw error;
    }
  }
}

export { CacheService, compressData, decompressData, formatCacheKey };