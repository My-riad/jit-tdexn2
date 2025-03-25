/**
 * Rate Limiter Middleware
 * 
 * This middleware provides flexible rate limiting capabilities for API endpoints
 * using the token bucket algorithm. It supports Redis for distributed rate limiting
 * with memory fallback for high availability. Rate limits can be customized based
 * on client type, endpoint, and user identity.
 */

import express from 'express'; // express@4.18.2
import { RateLimiterRedis, RateLimiterMemory, RateLimiterAbstract } from 'rate-limiter-flexible'; // rate-limiter-flexible@2.4.1
import { getDefaultRedisClient } from '../config/redis.config';
import { AppError } from '../utils/error-handler';
import { ErrorCodes } from '../constants/error-codes';
import { StatusCodes } from '../constants/status-codes';
import logger from '../utils/logger';

/**
 * Configuration options for the rate limiter
 */
export interface RateLimiterOptions {
  points: number;                  // Maximum number of points (requests) within duration
  duration: number;                // Duration in seconds for which points are valid
  keyPrefix?: string;              // Prefix for Redis keys
  blockDuration?: number;          // Block duration in seconds after limit is reached
  inmemoryBlockOnConsumed?: number; // Block when consumed points reach this value
  inmemoryBlockDuration?: number;   // Block duration for memory-based limiter
  insuranceLimiter?: boolean;      // Use memory limiter as backup for Redis limiter
}

/**
 * Options for generating unique keys for rate limiting
 */
export interface KeyGeneratorOptions {
  userIdKey?: string;             // Request property path to extract user ID (e.g., 'user.id')
  apiKeyHeader?: string;          // Header containing API key
  pathLimiting?: boolean;         // Include path in rate limit key
  methodLimiting?: boolean;       // Include HTTP method in rate limit key
  ipHeaders?: string[];           // Headers to check for client IP (e.g., X-Forwarded-For)
}

/**
 * Combined options for the rate limiter middleware
 */
export interface RateLimiterMiddlewareOptions {
  limiterOptions: RateLimiterOptions;         // Rate limiter configuration
  keyGeneratorOptions: KeyGeneratorOptions;   // Key generation options
  useRedis?: boolean;                         // Use Redis for rate limiting
  redisClientName?: string;                   // Name of Redis client to use
  skipFailedRequests?: boolean;               // Skip counting failed requests
  skipSuccessfulRequests?: boolean;           // Skip counting successful requests
  requestHandler?: (                          // Custom request handler
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    rateLimitInfo: {
      remainingPoints: number;
      consumedPoints: number;
      isFirstInDuration: boolean;
    }
  ) => void;
}

/**
 * Generates a unique key for rate limiting based on request properties
 * 
 * @param req - Express request object
 * @param options - Key generator options
 * @returns Unique key for rate limiting
 */
const generateKey = (req: express.Request, options: KeyGeneratorOptions): string => {
  const parts: string[] = [];
  
  // Get IP address from headers or connection
  let ip = req.ip || req.connection.remoteAddress || '';
  
  // Check custom IP headers if specified
  if (options.ipHeaders && options.ipHeaders.length > 0) {
    for (const header of options.ipHeaders) {
      const headerValue = req.headers[header.toLowerCase()] as string;
      if (headerValue) {
        // For headers like X-Forwarded-For that might contain multiple IPs
        ip = headerValue.split(',')[0].trim();
        break;
      }
    }
  }
  
  parts.push(ip);
  
  // Add user ID if available and specified
  if (options.userIdKey && req.user) {
    const userIdParts = options.userIdKey.split('.');
    let userId = req.user;
    for (const part of userIdParts) {
      if (userId && typeof userId === 'object' && part in userId) {
        userId = (userId as Record<string, any>)[part];
      } else {
        userId = undefined;
        break;
      }
    }
    
    if (userId && (typeof userId === 'string' || typeof userId === 'number')) {
      parts.push(String(userId));
    }
  }
  
  // Add API key if available and header is specified
  if (options.apiKeyHeader && req.headers[options.apiKeyHeader.toLowerCase()]) {
    parts.push(req.headers[options.apiKeyHeader.toLowerCase()] as string);
  }
  
  // Add request path if enabled
  if (options.pathLimiting) {
    parts.push(req.path);
  }
  
  // Add HTTP method if enabled
  if (options.methodLimiting) {
    parts.push(req.method);
  }
  
  return parts.join(':');
};

/**
 * Creates a rate limiter middleware with the specified options
 * 
 * @param options - Rate limiter middleware options
 * @returns Express middleware function for rate limiting
 */
export const rateLimiter = (options: RateLimiterMiddlewareOptions): express.RequestHandler => {
  const {
    limiterOptions,
    keyGeneratorOptions,
    useRedis = true,
    redisClientName = 'rate-limiter',
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    requestHandler
  } = options;
  
  // Create Redis rate limiter if Redis is enabled
  let redisLimiter: RateLimiterAbstract | null = null;
  if (useRedis) {
    try {
      const redisClient = getDefaultRedisClient(redisClientName);
      redisLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: limiterOptions.keyPrefix || 'rl',
        points: limiterOptions.points,
        duration: limiterOptions.duration,
        blockDuration: limiterOptions.blockDuration,
        insuranceLimiter: limiterOptions.insuranceLimiter
      });
      
      logger.debug('Redis rate limiter initialized', {
        redisClientName,
        points: limiterOptions.points,
        duration: limiterOptions.duration
      });
    } catch (error) {
      logger.warn('Failed to initialize Redis rate limiter, falling back to memory limiter', {
        error
      });
    }
  }
  
  // Create memory rate limiter as fallback or primary limiter
  const memoryLimiter = new RateLimiterMemory({
    keyPrefix: limiterOptions.keyPrefix || 'rl',
    points: limiterOptions.points,
    duration: limiterOptions.duration,
    blockDuration: limiterOptions.blockDuration || limiterOptions.inmemoryBlockDuration,
    inmemoryBlockOnConsumed: limiterOptions.inmemoryBlockOnConsumed
  });
  
  logger.debug('Memory rate limiter initialized', {
    points: limiterOptions.points,
    duration: limiterOptions.duration
  });
  
  // Create and return the middleware function
  return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    // Skip rate limiting for certain HTTP methods if desired
    if (req.method === 'OPTIONS') {
      return next();
    }
    
    const key = generateKey(req, keyGeneratorOptions);
    const limiter = redisLimiter || memoryLimiter;
    
    try {
      const rateLimitInfo = await limiter.consume(key);
      
      // Add rate limit headers to response
      res.setHeader('X-RateLimit-Limit', limiterOptions.points);
      res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remainingPoints);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + rateLimitInfo.msBeforeNext / 1000);
      
      // Use custom request handler if provided
      if (requestHandler) {
        return requestHandler(req, res, next, {
          remainingPoints: rateLimitInfo.remainingPoints,
          consumedPoints: rateLimitInfo.consumedPoints,
          isFirstInDuration: rateLimitInfo.consumedPoints === 1
        });
      }
      
      // Modify response to handle rate limiting status
      const originalSend = res.send;
      const originalJson = res.json;
      const originalStatus = res.status;
      
      // Intercept response to adjust rate limiting based on response status
      res.send = function (body): express.Response {
        // If configured to skip counting failed requests
        if (skipFailedRequests && res.statusCode >= 400 && res.statusCode < 500) {
          limiter.reward(key);
          logger.debug('Rate limit point rewarded for failed request', {
            key,
            statusCode: res.statusCode
          });
        }
        
        // If configured to skip counting successful requests
        if (skipSuccessfulRequests && res.statusCode >= 200 && res.statusCode < 300) {
          limiter.reward(key);
          logger.debug('Rate limit point rewarded for successful request', {
            key,
            statusCode: res.statusCode
          });
        }
        
        // Restore original methods and continue
        res.send = originalSend;
        res.json = originalJson;
        res.status = originalStatus;
        return originalSend.call(this, body);
      };
      
      res.json = function (body): express.Response {
        res.send = originalSend;
        res.json = originalJson;
        res.status = originalStatus;
        return originalJson.call(this, body);
      };
      
      res.status = function (code): express.Response {
        res.statusCode = code;
        return this;
      };
      
      next();
    } catch (error) {
      if (error.remainingPoints !== undefined) {
        // Rate limit exceeded
        const retryAfterSeconds = Math.ceil(error.msBeforeNext / 1000) || 1;
        
        // Set rate limit headers
        res.setHeader('Retry-After', retryAfterSeconds);
        res.setHeader('X-RateLimit-Limit', limiterOptions.points);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + retryAfterSeconds);
        
        logger.debug('Rate limit exceeded', {
          key,
          ip: req.ip,
          path: req.path,
          method: req.method,
          retryAfter: retryAfterSeconds
        });
        
        // Use custom request handler if provided
        if (requestHandler) {
          return requestHandler(req, res, next, {
            remainingPoints: 0,
            consumedPoints: limiterOptions.points,
            isFirstInDuration: false
          });
        }
        
        // Return rate limit error
        const rateLimitError = new AppError('Too many requests, please try again later.', {
          code: ErrorCodes.RATE_TOO_MANY_REQUESTS,
          statusCode: StatusCodes.TOO_MANY_REQUESTS,
          details: {
            retryAfter: retryAfterSeconds
          }
        });
        
        res.status(StatusCodes.TOO_MANY_REQUESTS).json(rateLimitError.toJSON());
        return;
      }
      
      // If Redis fails, fallback to memory limiter
      if (redisLimiter && error.message && error.message.includes('redis')) {
        logger.warn('Redis rate limiter failed, falling back to memory limiter', {
          error: error.message
        });
        
        try {
          const rateLimitInfo = await memoryLimiter.consume(key);
          
          // Add rate limit headers to response
          res.setHeader('X-RateLimit-Limit', limiterOptions.points);
          res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remainingPoints);
          res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + rateLimitInfo.msBeforeNext / 1000);
          
          next();
          return;
        } catch (memoryError) {
          if (memoryError.remainingPoints !== undefined) {
            // Memory rate limit exceeded
            const retryAfterSeconds = Math.ceil(memoryError.msBeforeNext / 1000) || 1;
            
            res.setHeader('Retry-After', retryAfterSeconds);
            res.setHeader('X-RateLimit-Limit', limiterOptions.points);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + retryAfterSeconds);
            
            const rateLimitError = new AppError('Too many requests, please try again later.', {
              code: ErrorCodes.RATE_TOO_MANY_REQUESTS,
              statusCode: StatusCodes.TOO_MANY_REQUESTS,
              details: {
                retryAfter: retryAfterSeconds
              }
            });
            
            res.status(StatusCodes.TOO_MANY_REQUESTS).json(rateLimitError.toJSON());
            return;
          }
        }
      }
      
      // For other unexpected errors
      logger.error('Unexpected error in rate limiter middleware', {
        error
      });
      
      next(error);
    }
  };
};