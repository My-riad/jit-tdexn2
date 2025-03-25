import { Router } from 'express'; // express@^4.18.2
import { CacheController } from '../controllers/cache.controller';
import { authenticate, optionalAuthenticate } from '../../../common/middleware/auth.middleware';
import { rateLimiter } from '../../../common/middleware/rate-limiter.middleware';
import logger from '../../../common/utils/logger';

// Initialize Express router
const router = Router();

// Initialize CacheController
const cacheController = new CacheController();

// Log route registration
logger.info('Registering Cache Service routes');

/**
 * @description Health check endpoint for the cache service
 * @route GET /health
 */
router.get('/health', cacheController.healthCheck);

/**
 * @description Get a value from the cache by namespace and key
 * @route GET /:namespace/:key
 */
router.get('/:namespace/:key',
  optionalAuthenticate,
  rateLimiter({ limiterOptions: { points: 100, duration: 60 } }),
  cacheController.get.bind(cacheController)
);

/**
 * @description Set a value in the cache with namespace, key, and optional TTL
 * @route POST /
 */
router.post('/',
  authenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.set.bind(cacheController)
);

/**
 * @description Delete a value from the cache by namespace and key
 * @route DELETE /:namespace/:key
 */
router.delete('/:namespace/:key',
  authenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.delete.bind(cacheController)
);

/**
 * @description Check if a key exists in the cache by namespace and key
 * @route GET /:namespace/:key/exists
 */
router.get('/:namespace/:key/exists',
  optionalAuthenticate,
  rateLimiter({ limiterOptions: { points: 100, duration: 60 } }),
  cacheController.exists.bind(cacheController)
);

/**
 * @description Get a value from cache or set it if not found using the provided factory function
 * @route POST /get-or-set
 */
router.post('/get-or-set',
  authenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.getOrSet.bind(cacheController)
);

/**
 * @description Get multiple values from the cache in a single operation
 * @route POST /multi-get
 */
router.post('/multi-get',
  optionalAuthenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.mget.bind(cacheController)
);

/**
 * @description Set multiple key-value pairs in the cache in a single operation
 * @route POST /multi-set
 */
router.post('/multi-set',
  authenticate,
  rateLimiter({ limiterOptions: { points: 30, duration: 60 } }),
  cacheController.mset.bind(cacheController)
);

/**
 * @description Invalidate a computed cache entry and regenerate it using the registered callback
 * @route POST /invalidate
 */
router.post('/invalidate',
  authenticate,
  rateLimiter({ limiterOptions: { points: 30, duration: 60 } }),
  cacheController.invalidateComputedCache.bind(cacheController)
);

/**
 * @description Increment a numeric value stored at key
 * @route POST /increment
 */
router.post('/increment',
  authenticate,
  rateLimiter({ limiterOptions: { points: 100, duration: 60 } }),
  cacheController.increment.bind(cacheController)
);

/**
 * @description Decrement a numeric value stored at key
 * @route POST /decrement
 */
router.post('/decrement',
  authenticate,
  rateLimiter({ limiterOptions: { points: 100, duration: 60 } }),
  cacheController.decrement.bind(cacheController)
);

/**
 * @description Delete all keys in a namespace
 * @route DELETE /:namespace
 */
router.delete('/:namespace',
  authenticate,
  rateLimiter({ limiterOptions: { points: 10, duration: 60 } }),
  cacheController.flushNamespace.bind(cacheController)
);

/**
 * @description Get a field from a hash stored at key
 * @route GET /hash/:namespace/:key/:field
 */
router.get('/hash/:namespace/:key/:field',
  optionalAuthenticate,
  rateLimiter({ limiterOptions: { points: 100, duration: 60 } }),
  cacheController.getHashField.bind(cacheController)
);

/**
 * @description Set a field in a hash stored at key
 * @route POST /hash
 */
router.post('/hash',
  authenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.setHashField.bind(cacheController)
);

/**
 * @description Delete a field from a hash stored at key
 * @route DELETE /hash/:namespace/:key/:field
 */
router.delete('/hash/:namespace/:key/:field',
  authenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.deleteHashField.bind(cacheController)
);

/**
 * @description Get all fields and values from a hash stored at key
 * @route GET /hash/:namespace/:key
 */
router.get('/hash/:namespace/:key',
  optionalAuthenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.getAllHashFields.bind(cacheController)
);

/**
 * @description Add a member with score to a sorted set
 * @route POST /sorted-set
 */
router.post('/sorted-set',
  authenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.addToSortedSet.bind(cacheController)
);

/**
 * @description Get a range of members from a sorted set by index
 * @route GET /sorted-set/:namespace/:key
 */
router.get('/sorted-set/:namespace/:key',
  optionalAuthenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.getSortedSetRange.bind(cacheController)
);

/**
 * @description Get a range of members from a sorted set by index in reverse order
 * @route GET /sorted-set/:namespace/:key/reverse
 */
router.get('/sorted-set/:namespace/:key/reverse',
  optionalAuthenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.getSortedSetReverseRange.bind(cacheController)
);

/**
 * @description Remove members from a sorted set
 * @route POST /sorted-set/remove
 */
router.post('/sorted-set/remove',
  authenticate,
  rateLimiter({ limiterOptions: { points: 50, duration: 60 } }),
  cacheController.removeFromSortedSet.bind(cacheController)
);

// Export the router
export { router };