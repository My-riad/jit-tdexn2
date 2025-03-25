import { Request, Response } from 'express';
import CacheService from '../services/cache.service';
import { CacheType } from '../config';
import logger from '../../../common/utils/logger';

export default class CacheController {
  private cacheService: CacheService;

  /**
   * Initializes the cache controller with a cache service instance
   */
  constructor() {
    this.cacheService = new CacheService();
    this.cacheService.connect().catch(error => {
      logger.error('Failed to connect to Redis in CacheController initialization', { error });
    });
    logger.info('CacheController initialized');
  }

  /**
   * Health check endpoint for the cache service
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const isConnected = this.cacheService.isConnected();
      if (isConnected) {
        res.status(200).json({ status: 'healthy', message: 'Cache service is connected to Redis' });
      } else {
        res.status(503).json({ status: 'unhealthy', message: 'Cache service is not connected to Redis' });
      }
    } catch (error) {
      logger.error('Error in cache health check', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error during health check' });
    }
  }

  /**
   * Gets a value from the cache by namespace and key
   */
  async get(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      const value = await this.cacheService.get(namespace, key);
      
      if (value === null) {
        res.status(404).json({ status: 'error', message: 'Key not found in cache' });
        return;
      }
      
      res.status(200).json({ status: 'success', data: value });
    } catch (error) {
      logger.error('Error getting value from cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Sets a value in the cache with namespace, key, and optional TTL
   */
  async set(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, value, cacheType, customTTL } = req.body;
      
      if (!namespace || !key || value === undefined) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace, key, and value are required' 
        });
        return;
      }
      
      // Handle cacheType as string or enum
      let parsedCacheType: CacheType | undefined;
      if (cacheType) {
        parsedCacheType = typeof cacheType === 'string' 
          ? CacheType[cacheType as keyof typeof CacheType]
          : cacheType;
      }
      
      const result = await this.cacheService.set(
        namespace, 
        key, 
        value, 
        parsedCacheType,
        customTTL
      );
      
      if (result) {
        res.status(200).json({ 
          status: 'success', 
          message: 'Value set in cache successfully' 
        });
      } else {
        res.status(500).json({ 
          status: 'error', 
          message: 'Failed to set value in cache' 
        });
      }
    } catch (error) {
      logger.error('Error setting value in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Deletes a value from the cache by namespace and key
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      const result = await this.cacheService.delete(namespace, key);
      
      if (result) {
        res.status(200).json({ 
          status: 'success', 
          message: 'Key deleted from cache successfully' 
        });
      } else {
        res.status(404).json({ 
          status: 'error', 
          message: 'Key not found in cache' 
        });
      }
    } catch (error) {
      logger.error('Error deleting key from cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Checks if a key exists in the cache by namespace and key
   */
  async exists(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      const exists = await this.cacheService.exists(namespace, key);
      
      res.status(200).json({ status: 'success', exists });
    } catch (error) {
      logger.error('Error checking if key exists in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Gets a value from cache or sets it if not found using the provided factory function
   */
  async getOrSet(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, factory, cacheType, customTTL } = req.body;
      
      if (!namespace || !key || !factory) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace, key, and factory function are required' 
        });
        return;
      }
      
      // Handle cacheType as string or enum
      let parsedCacheType: CacheType | undefined;
      if (cacheType) {
        parsedCacheType = typeof cacheType === 'string' 
          ? CacheType[cacheType as keyof typeof CacheType]
          : cacheType;
      }
      
      // Create a function from the factory string
      let factoryFn: () => Promise<any>;
      try {
        // This is a simplified way to handle the factory function from API
        // In a real-world scenario, this would need more security considerations
        if (typeof factory === 'function') {
          factoryFn = factory;
        } else if (typeof factory === 'string') {
          // eslint-disable-next-line no-new-func
          const fn = new Function(`return ${factory}`)();
          factoryFn = fn;
        } else {
          throw new Error('Invalid factory function');
        }
      } catch (funcError) {
        logger.error('Error creating factory function', { error: funcError });
        res.status(400).json({ 
          status: 'error', 
          message: 'Invalid factory function' 
        });
        return;
      }
      
      const value = await this.cacheService.getOrSet(
        namespace,
        key,
        factoryFn,
        parsedCacheType,
        customTTL
      );
      
      res.status(200).json({ status: 'success', data: value });
    } catch (error) {
      logger.error('Error in getOrSet cache operation', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Gets multiple values from the cache in a single operation
   */
  async mget(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, keys } = req.body;
      
      if (!namespace || !Array.isArray(keys)) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace and keys array are required' 
        });
        return;
      }
      
      const values = await this.cacheService.mget(namespace, keys);
      
      res.status(200).json({ status: 'success', data: values });
    } catch (error) {
      logger.error('Error getting multiple values from cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Sets multiple key-value pairs in the cache in a single operation
   */
  async mset(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, entries, cacheType, customTTL } = req.body;
      
      if (!namespace || !entries || typeof entries !== 'object') {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace and entries object are required' 
        });
        return;
      }
      
      // Handle cacheType as string or enum
      let parsedCacheType: CacheType | undefined;
      if (cacheType) {
        parsedCacheType = typeof cacheType === 'string' 
          ? CacheType[cacheType as keyof typeof CacheType]
          : cacheType;
      }
      
      const result = await this.cacheService.mset(
        namespace,
        entries,
        parsedCacheType,
        customTTL
      );
      
      if (result) {
        res.status(200).json({ 
          status: 'success', 
          message: 'Multiple values set in cache successfully' 
        });
      } else {
        res.status(500).json({ 
          status: 'error', 
          message: 'Failed to set multiple values in cache' 
        });
      }
    } catch (error) {
      logger.error('Error setting multiple values in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Invalidates a computed cache entry and regenerates it using the registered callback
   */
  async invalidateComputedCache(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, cacheType, customTTL } = req.body;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      // Handle cacheType as string or enum
      let parsedCacheType: CacheType | undefined;
      if (cacheType) {
        parsedCacheType = typeof cacheType === 'string' 
          ? CacheType[cacheType as keyof typeof CacheType]
          : cacheType;
      }
      
      const result = await this.cacheService.invalidateComputedCache(
        namespace,
        key,
        parsedCacheType,
        customTTL
      );
      
      if (result) {
        res.status(200).json({ 
          status: 'success', 
          message: 'Computed cache invalidated and regenerated successfully' 
        });
      } else {
        res.status(404).json({ 
          status: 'error', 
          message: 'No factory function found for the key or invalidation failed' 
        });
      }
    } catch (error) {
      logger.error('Error invalidating computed cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Increments a numeric value stored at key
   */
  async increment(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, increment } = req.body;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      const newValue = await this.cacheService.increment(namespace, key, increment);
      
      res.status(200).json({ 
        status: 'success', 
        value: newValue 
      });
    } catch (error) {
      logger.error('Error incrementing value in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Decrements a numeric value stored at key
   */
  async decrement(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, decrement } = req.body;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      const newValue = await this.cacheService.decrement(namespace, key, decrement);
      
      res.status(200).json({ 
        status: 'success', 
        value: newValue 
      });
    } catch (error) {
      logger.error('Error decrementing value in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Deletes all keys in a namespace
   */
  async flushNamespace(req: Request, res: Response): Promise<void> {
    try {
      const { namespace } = req.params;
      
      if (!namespace) {
        res.status(400).json({ status: 'error', message: 'Namespace is required' });
        return;
      }
      
      const deletedCount = await this.cacheService.flushNamespace(namespace);
      
      res.status(200).json({ 
        status: 'success', 
        message: `Flushed namespace from cache`,
        deletedCount
      });
    } catch (error) {
      logger.error('Error flushing namespace from cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Gets a field from a hash stored at key
   */
  async getHashField(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, field } = req.params;
      
      if (!namespace || !key || !field) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace, key, and field are required' 
        });
        return;
      }
      
      const value = await this.cacheService.getHashField(namespace, key, field);
      
      if (value === null) {
        res.status(404).json({ 
          status: 'error', 
          message: 'Field not found in hash' 
        });
        return;
      }
      
      res.status(200).json({ status: 'success', data: value });
    } catch (error) {
      logger.error('Error getting hash field from cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Sets a field in a hash stored at key
   */
  async setHashField(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, field, value, cacheType, customTTL } = req.body;
      
      if (!namespace || !key || !field || value === undefined) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace, key, field, and value are required' 
        });
        return;
      }
      
      // Handle cacheType as string or enum
      let parsedCacheType: CacheType | undefined;
      if (cacheType) {
        parsedCacheType = typeof cacheType === 'string' 
          ? CacheType[cacheType as keyof typeof CacheType]
          : cacheType;
      }
      
      const result = await this.cacheService.setHashField(
        namespace,
        key,
        field,
        value,
        parsedCacheType,
        customTTL
      );
      
      res.status(200).json({ 
        status: 'success', 
        message: 'Hash field set successfully',
        isNewField: result
      });
    } catch (error) {
      logger.error('Error setting hash field in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Deletes a field from a hash stored at key
   */
  async deleteHashField(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, field } = req.params;
      
      if (!namespace || !key || !field) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace, key, and field are required' 
        });
        return;
      }
      
      const result = await this.cacheService.deleteHashField(namespace, key, field);
      
      if (result) {
        res.status(200).json({ 
          status: 'success', 
          message: 'Hash field deleted successfully' 
        });
      } else {
        res.status(404).json({ 
          status: 'error', 
          message: 'Field not found in hash' 
        });
      }
    } catch (error) {
      logger.error('Error deleting hash field from cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Gets all fields and values from a hash stored at key
   */
  async getAllHashFields(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      const hashData = await this.cacheService.getAllHashFields(namespace, key);
      
      if (!hashData) {
        res.status(404).json({ 
          status: 'error', 
          message: 'Hash not found or empty' 
        });
        return;
      }
      
      res.status(200).json({ status: 'success', data: hashData });
    } catch (error) {
      logger.error('Error getting all hash fields from cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Adds a member with score to a sorted set
   */
  async addToSortedSet(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, score, member, cacheType, customTTL } = req.body;
      
      if (!namespace || !key || score === undefined || !member) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace, key, score, and member are required' 
        });
        return;
      }
      
      // Handle cacheType as string or enum
      let parsedCacheType: CacheType | undefined;
      if (cacheType) {
        parsedCacheType = typeof cacheType === 'string' 
          ? CacheType[cacheType as keyof typeof CacheType]
          : cacheType;
      }
      
      const result = await this.cacheService.addToSortedSet(
        namespace,
        key,
        score,
        member,
        parsedCacheType,
        customTTL
      );
      
      res.status(200).json({ 
        status: 'success', 
        message: 'Member added to sorted set',
        membersAdded: result
      });
    } catch (error) {
      logger.error('Error adding to sorted set in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Gets a range of members from a sorted set by index
   */
  async getSortedSetRange(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;
      const { start = '0', stop = '-1', withScores = 'false' } = req.query;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      // Parse parameters
      const startIndex = parseInt(start as string, 10);
      const stopIndex = parseInt(stop as string, 10);
      const includeScores = (withScores as string).toLowerCase() === 'true';
      
      const range = await this.cacheService.getSortedSetRange(
        namespace,
        key,
        startIndex,
        stopIndex,
        includeScores
      );
      
      res.status(200).json({ status: 'success', data: range });
    } catch (error) {
      logger.error('Error getting range from sorted set in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Gets a range of members from a sorted set by index in reverse order
   */
  async getSortedSetReverseRange(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;
      const { start = '0', stop = '-1', withScores = 'false' } = req.query;
      
      if (!namespace || !key) {
        res.status(400).json({ status: 'error', message: 'Namespace and key are required' });
        return;
      }
      
      // Parse parameters
      const startIndex = parseInt(start as string, 10);
      const stopIndex = parseInt(stop as string, 10);
      const includeScores = (withScores as string).toLowerCase() === 'true';
      
      const range = await this.cacheService.getSortedSetReverseRange(
        namespace,
        key,
        startIndex,
        stopIndex,
        includeScores
      );
      
      res.status(200).json({ status: 'success', data: range });
    } catch (error) {
      logger.error('Error getting reverse range from sorted set in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Removes members from a sorted set
   */
  async removeFromSortedSet(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key, members } = req.body;
      
      if (!namespace || !key || !Array.isArray(members)) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Namespace, key, and members array are required' 
        });
        return;
      }
      
      const removedCount = await this.cacheService.removeFromSortedSet(
        namespace,
        key,
        members
      );
      
      res.status(200).json({ 
        status: 'success', 
        message: 'Members removed from sorted set',
        removedCount
      });
    } catch (error) {
      logger.error('Error removing from sorted set in cache', { error });
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
}