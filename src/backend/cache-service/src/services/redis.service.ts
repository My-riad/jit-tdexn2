import Redis from 'ioredis'; // ioredis@5.3.2
import { getRedisConfig } from '../../../common/config/redis.config';
import logger from '../../../common/utils/logger';

// Global Redis client instance
let redisClient: Redis | null = null;

/**
 * Initializes the Redis client connection with configuration from environment
 * @returns Promise that resolves to the Redis client instance
 */
export const initializeConnection = async (): Promise<Redis> => {
  const config = getRedisConfig();
  
  logger.info('Initializing Redis connection', {
    host: config.host,
    port: config.port,
    db: config.db
  });
  
  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    tls: config.tls ? {} : undefined,
    connectTimeout: config.connectTimeout,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, config.retryTimeout);
      logger.debug(`Redis retrying connection (attempt ${times}) in ${delay}ms`);
      return delay;
    }
  });
  
  // Set up event handlers
  client.on('connect', () => {
    logger.info('Redis connection established', {
      host: config.host,
      port: config.port
    });
  });
  
  client.on('error', (err) => {
    logger.error('Redis connection error', { error: err });
  });
  
  client.on('reconnecting', () => {
    logger.info('Redis reconnecting');
  });
  
  return client;
};

/**
 * Gets the existing Redis client or initializes a new one if needed
 * @returns Promise that resolves to the Redis client instance
 */
export const getConnection = async (): Promise<Redis> => {
  if (redisClient) {
    return redisClient;
  }
  
  redisClient = await initializeConnection();
  return redisClient;
};

/**
 * Safely closes the Redis client connection
 * @returns Promise that resolves when connection is closed
 */
export const closeConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  } else {
    logger.debug('No Redis connection to close');
  }
};

/**
 * Service that provides a wrapper around the Redis client with additional functionality
 */
export default class RedisService {
  private client: Redis | null;
  
  constructor() {
    this.client = null;
    logger.debug('RedisService initialized');
  }
  
  /**
   * Establishes a connection to Redis if not already connected
   */
  async connect(): Promise<void> {
    if (!this.client) {
      this.client = await getConnection();
      logger.debug('RedisService connected to Redis');
    }
  }
  
  /**
   * Closes the Redis connection if open
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await closeConnection();
      this.client = null;
      logger.debug('RedisService disconnected from Redis');
    }
  }
  
  /**
   * Checks if the Redis client is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }
  
  /**
   * Gets the Redis client instance, connecting if necessary
   * @returns Promise that resolves to the Redis client instance
   */
  async getClient(): Promise<Redis> {
    if (!this.isConnected()) {
      await this.connect();
    }
    return this.client!;
  }
  
  /**
   * Retrieves a value from Redis by key
   * @param key Key to retrieve
   * @returns Promise that resolves to the value or null if not found
   */
  async get(key: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      return await client.get(key);
    } catch (error) {
      logger.error('Error getting Redis key', { key, error });
      throw error;
    }
  }
  
  /**
   * Sets a value in Redis with optional expiration
   * @param key Key to set
   * @param value Value to set
   * @param ttl Time to live in seconds (optional)
   * @returns Promise that resolves to true if successful
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      if (ttl) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
      
      return true;
    } catch (error) {
      logger.error('Error setting Redis key', { key, error });
      throw error;
    }
  }
  
  /**
   * Deletes a key from Redis
   * @param key Key to delete
   * @returns Promise that resolves to true if key was deleted
   */
  async del(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Error deleting Redis key', { key, error });
      throw error;
    }
  }
  
  /**
   * Checks if a key exists in Redis
   * @param key Key to check
   * @returns Promise that resolves to true if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.exists(key);
      return result > 0;
    } catch (error) {
      logger.error('Error checking Redis key existence', { key, error });
      throw error;
    }
  }
  
  /**
   * Sets an expiration time on a key
   * @param key Key to set expiration on
   * @param ttl Time to live in seconds
   * @returns Promise that resolves to true if timeout was set
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Error setting Redis key expiration', { key, ttl, error });
      throw error;
    }
  }
  
  /**
   * Gets the remaining time to live of a key
   * @param key Key to check
   * @returns Promise that resolves to TTL in seconds or -1 if no expiration
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.ttl(key);
    } catch (error) {
      logger.error('Error getting Redis key TTL', { key, error });
      throw error;
    }
  }
  
  /**
   * Gets multiple values from Redis in a single operation
   * @param keys Keys to retrieve
   * @returns Promise that resolves to array of values
   */
  async mget(keys: string[]): Promise<Array<string | null>> {
    try {
      const client = await this.getClient();
      return await client.mget(keys);
    } catch (error) {
      logger.error('Error getting multiple Redis keys', { keys, error });
      throw error;
    }
  }
  
  /**
   * Sets multiple key-value pairs in Redis in a single operation
   * @param keyValuePairs Object containing key-value pairs
   * @returns Promise that resolves to true if successful
   */
  async mset(keyValuePairs: Record<string, string>): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      // Convert object to flat array for MSET
      const args: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        args.push(key, value);
      }
      
      await client.mset(args);
      return true;
    } catch (error) {
      logger.error('Error setting multiple Redis keys', { error });
      throw error;
    }
  }
  
  /**
   * Increments a number stored at key by 1
   * @param key Key to increment
   * @returns Promise that resolves to the value after increment
   */
  async incr(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.incr(key);
    } catch (error) {
      logger.error('Error incrementing Redis key', { key, error });
      throw error;
    }
  }
  
  /**
   * Increments a number stored at key by the given amount
   * @param key Key to increment
   * @param increment Amount to increment by
   * @returns Promise that resolves to the value after increment
   */
  async incrby(key: string, increment: number): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.incrby(key, increment);
    } catch (error) {
      logger.error('Error incrementing Redis key by amount', { key, increment, error });
      throw error;
    }
  }
  
  /**
   * Decrements a number stored at key by 1
   * @param key Key to decrement
   * @returns Promise that resolves to the value after decrement
   */
  async decr(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.decr(key);
    } catch (error) {
      logger.error('Error decrementing Redis key', { key, error });
      throw error;
    }
  }
  
  /**
   * Decrements a number stored at key by the given amount
   * @param key Key to decrement
   * @param decrement Amount to decrement by
   * @returns Promise that resolves to the value after decrement
   */
  async decrby(key: string, decrement: number): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.decrby(key, decrement);
    } catch (error) {
      logger.error('Error decrementing Redis key by amount', { key, decrement, error });
      throw error;
    }
  }
  
  /**
   * Gets a field from a hash stored at key
   * @param key Hash key
   * @param field Hash field
   * @returns Promise that resolves to the field value or null
   */
  async hget(key: string, field: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      return await client.hget(key, field);
    } catch (error) {
      logger.error('Error getting Redis hash field', { key, field, error });
      throw error;
    }
  }
  
  /**
   * Sets a field in a hash stored at key
   * @param key Hash key
   * @param field Hash field
   * @param value Field value
   * @returns Promise that resolves to true if field was new
   */
  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.hset(key, field, value);
      return result === 1; // Returns 1 if field is new, 0 if field existed
    } catch (error) {
      logger.error('Error setting Redis hash field', { key, field, error });
      throw error;
    }
  }
  
  /**
   * Deletes a field from a hash stored at key
   * @param key Hash key
   * @param field Hash field
   * @returns Promise that resolves to true if field was deleted
   */
  async hdel(key: string, field: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.hdel(key, field);
      return result === 1;
    } catch (error) {
      logger.error('Error deleting Redis hash field', { key, field, error });
      throw error;
    }
  }
  
  /**
   * Gets all fields and values from a hash stored at key
   * @param key Hash key
   * @returns Promise that resolves to object with all fields and values
   */
  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      const client = await this.getClient();
      const result = await client.hgetall(key);
      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      logger.error('Error getting all Redis hash fields', { key, error });
      throw error;
    }
  }
  
  /**
   * Adds a member with score to a sorted set
   * @param key Sorted set key
   * @param score Member score
   * @param member Member value
   * @returns Promise that resolves to number of elements added
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.zadd(key, score, member);
    } catch (error) {
      logger.error('Error adding to Redis sorted set', { key, score, member, error });
      throw error;
    }
  }
  
  /**
   * Gets a range of members from a sorted set by index
   * @param key Sorted set key
   * @param start Start index
   * @param stop Stop index
   * @param withScores Whether to include scores in result
   * @returns Promise that resolves to array of members or [member, score] pairs
   */
  async zrange(
    key: string, 
    start: number, 
    stop: number, 
    withScores: boolean = false
  ): Promise<string[] | Array<[string, string]>> {
    try {
      const client = await this.getClient();
      
      if (withScores) {
        const result = await client.zrange(key, start, stop, 'WITHSCORES');
        
        // Convert flat array [member1, score1, member2, score2] to array of pairs [[member1, score1], [member2, score2]]
        const pairs: Array<[string, string]> = [];
        for (let i = 0; i < result.length; i += 2) {
          pairs.push([result[i], result[i + 1]]);
        }
        
        return pairs;
      } else {
        return await client.zrange(key, start, stop);
      }
    } catch (error) {
      logger.error('Error getting range from Redis sorted set', { 
        key, start, stop, withScores, error 
      });
      throw error;
    }
  }
  
  /**
   * Gets a range of members from a sorted set by index in reverse order
   * @param key Sorted set key
   * @param start Start index
   * @param stop Stop index
   * @param withScores Whether to include scores in result
   * @returns Promise that resolves to array of members or [member, score] pairs in reverse order
   */
  async zrevrange(
    key: string, 
    start: number, 
    stop: number, 
    withScores: boolean = false
  ): Promise<string[] | Array<[string, string]>> {
    try {
      const client = await this.getClient();
      
      if (withScores) {
        const result = await client.zrevrange(key, start, stop, 'WITHSCORES');
        
        // Convert flat array [member1, score1, member2, score2] to array of pairs [[member1, score1], [member2, score2]]
        const pairs: Array<[string, string]> = [];
        for (let i = 0; i < result.length; i += 2) {
          pairs.push([result[i], result[i + 1]]);
        }
        
        return pairs;
      } else {
        return await client.zrevrange(key, start, stop);
      }
    } catch (error) {
      logger.error('Error getting reverse range from Redis sorted set', { 
        key, start, stop, withScores, error 
      });
      throw error;
    }
  }
  
  /**
   * Removes members from a sorted set
   * @param key Sorted set key
   * @param members Members to remove
   * @returns Promise that resolves to number of members removed
   */
  async zrem(key: string, members: string[]): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.zrem(key, ...members);
    } catch (error) {
      logger.error('Error removing from Redis sorted set', { key, members, error });
      throw error;
    }
  }
  
  /**
   * Finds all keys matching a pattern
   * @param pattern Pattern to match
   * @returns Promise that resolves to array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const client = await this.getClient();
      return await client.keys(pattern);
    } catch (error) {
      logger.error('Error getting Redis keys by pattern', { pattern, error });
      throw error;
    }
  }
  
  /**
   * Incrementally iterates over keys matching a pattern
   * @param pattern Pattern to match
   * @param count Number of keys to return per iteration
   * @returns Promise that resolves to array of all matching keys
   */
  async scan(pattern: string, count: number = 100): Promise<string[]> {
    try {
      const client = await this.getClient();
      const results: string[] = [];
      let cursor = '0';
      
      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
        cursor = nextCursor;
        results.push(...keys);
      } while (cursor !== '0');
      
      return results;
    } catch (error) {
      logger.error('Error scanning Redis keys by pattern', { pattern, count, error });
      throw error;
    }
  }
  
  /**
   * Deletes all keys matching a pattern
   * @param pattern Pattern to match
   * @returns Promise that resolves to number of keys deleted
   */
  async flushByPattern(pattern: string): Promise<number> {
    try {
      const client = await this.getClient();
      const keys = await this.scan(pattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      return await client.del(...keys);
    } catch (error) {
      logger.error('Error flushing Redis keys by pattern', { pattern, error });
      throw error;
    }
  }
  
  /**
   * Publishes a message to a channel
   * @param channel Channel to publish to
   * @param message Message to publish
   * @returns Promise that resolves to number of clients that received the message
   */
  async publish(channel: string, message: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.publish(channel, message);
    } catch (error) {
      logger.error('Error publishing Redis message', { channel, error });
      throw error;
    }
  }
  
  /**
   * Subscribes to a channel and executes callback when messages are received
   * @param channel Channel to subscribe to
   * @param callback Function to execute when message is received
   */
  async subscribe(channel: string, callback: (channel: string, message: string) => void): Promise<void> {
    try {
      const client = await this.getClient();
      await client.subscribe(channel);
      
      client.on('message', (chan, message) => {
        if (chan === channel) {
          callback(chan, message);
        }
      });
      
      logger.info('Subscribed to Redis channel', { channel });
    } catch (error) {
      logger.error('Error subscribing to Redis channel', { channel, error });
      throw error;
    }
  }
  
  /**
   * Unsubscribes from a channel
   * @param channel Channel to unsubscribe from
   */
  async unsubscribe(channel: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.unsubscribe(channel);
      logger.info('Unsubscribed from Redis channel', { channel });
    } catch (error) {
      logger.error('Error unsubscribing from Redis channel', { channel, error });
      throw error;
    }
  }
  
  /**
   * Executes a raw Redis command
   * @param command Redis command
   * @param args Command arguments
   * @returns Promise that resolves to the command result
   */
  async executeCommand(command: string, ...args: any[]): Promise<any> {
    try {
      const client = await this.getClient();
      return await client.call(command, ...args);
    } catch (error) {
      logger.error('Error executing Redis command', { command, args, error });
      throw error;
    }
  }
}

export { RedisService as default, initializeConnection, getConnection, closeConnection };