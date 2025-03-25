/**
 * Rate Limiting Middleware for API Gateway
 * 
 * This middleware implements rate limiting for the API Gateway to protect against abuse.
 * It provides pre-configured rate limiters for both public and authenticated API endpoints
 * with different thresholds, using the common rate limiter middleware with Redis for
 * distributed rate limiting.
 */

import express from 'express'; // express@4.18.2
import { rateLimiter, RateLimiterMiddlewareOptions } from '../../common/middleware/rate-limiter.middleware';
import { API_GATEWAY_CONFIG } from '../config';
import { ErrorCodes } from '../../common/constants/error-codes';
import { StatusCodes } from '../../common/constants/status-codes';
import logger from '../../common/utils/logger';

/**
 * Creates a rate limiter middleware for public API endpoints with lower thresholds
 * 
 * @returns Express middleware function for rate limiting public endpoints
 */
export const publicApiRateLimiter = (): express.RequestHandler => {
  const options: RateLimiterMiddlewareOptions = {
    limiterOptions: {
      points: Math.floor(API_GATEWAY_CONFIG.rateLimitMax * 0.5), // 50% of the configured limit for public endpoints
      duration: Math.floor(API_GATEWAY_CONFIG.rateLimitWindow / 1000), // Convert milliseconds to seconds
      keyPrefix: 'rl:public',
      blockDuration: 60, // 1 minute block after limit reached
    },
    keyGeneratorOptions: {
      ipHeaders: ['x-forwarded-for', 'x-real-ip'],
      pathLimiting: true,
      methodLimiting: false
    },
    useRedis: true,
    skipFailedRequests: true, // Don't count failed requests against the limit
    requestHandler: (req, res, next, rateLimitInfo) => {
      if (rateLimitInfo.remainingPoints <= 5) {
        logger.warn('Public API rate limit nearing threshold', {
          ip: req.ip,
          path: req.path,
          remainingPoints: rateLimitInfo.remainingPoints
        });
      }
      next();
    }
  };

  logger.debug('Creating public API rate limiter', {
    points: options.limiterOptions.points,
    duration: options.limiterOptions.duration,
    blockDuration: options.limiterOptions.blockDuration
  });

  return rateLimiter(options);
};

/**
 * Creates a rate limiter middleware for authenticated API endpoints with higher thresholds
 * 
 * @returns Express middleware function for rate limiting authenticated endpoints
 */
export const authenticatedApiRateLimiter = (): express.RequestHandler => {
  const options: RateLimiterMiddlewareOptions = {
    limiterOptions: {
      points: API_GATEWAY_CONFIG.rateLimitMax, // Full configured limit for authenticated endpoints
      duration: Math.floor(API_GATEWAY_CONFIG.rateLimitWindow / 1000), // Convert milliseconds to seconds
      keyPrefix: 'rl:auth',
      blockDuration: 30, // 30 second block after limit reached
    },
    keyGeneratorOptions: {
      userIdKey: 'id', // Extract user ID from req.user.id
      apiKeyHeader: 'x-api-key', // Also check for API key
      pathLimiting: true,
      methodLimiting: false,
      ipHeaders: ['x-forwarded-for', 'x-real-ip']
    },
    useRedis: true,
    skipFailedRequests: true, // Don't count failed requests against the limit
    requestHandler: (req, res, next, rateLimitInfo) => {
      if (rateLimitInfo.remainingPoints <= 10) {
        logger.warn('Authenticated API rate limit nearing threshold', {
          userId: req.user?.id,
          apiKey: req.headers['x-api-key'] ? '(present)' : '(absent)',
          path: req.path,
          remainingPoints: rateLimitInfo.remainingPoints
        });
      }
      next();
    }
  };

  logger.debug('Creating authenticated API rate limiter', {
    points: options.limiterOptions.points,
    duration: options.limiterOptions.duration,
    blockDuration: options.limiterOptions.blockDuration
  });

  return rateLimiter(options);
};