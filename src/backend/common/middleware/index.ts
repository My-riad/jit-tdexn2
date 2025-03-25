/**
 * Common Middleware Index
 * 
 * Centralized export file for all common middleware components used across the
 * AI-driven Freight Optimization Platform's microservices. This file aggregates
 * authentication, error handling, logging, rate limiting, and validation middleware
 * to provide a single import point for all services.
 * 
 * Usage:
 * ```
 * import { authenticate, errorMiddleware, loggingMiddleware } from '@/common/middleware';
 * ```
 * 
 * @module common/middleware
 */

// Authentication middleware components
import { 
  authenticate, 
  optionalAuthenticate,
  verifyToken 
} from './auth.middleware';

// Error handling middleware components 
import {
  errorMiddleware,
  notFoundMiddleware
} from './error.middleware';

// Logging middleware components
import {
  loggingMiddleware,
  requestLoggingMiddleware,
  responseLoggingMiddleware,
  generateRequestId
} from './logging.middleware';

// Rate limiting middleware components
import {
  rateLimiter,
  RateLimiterOptions,
  KeyGeneratorOptions,
  RateLimiterMiddlewareOptions
} from './rate-limiter.middleware';

// Validation middleware components
import {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  ValidationSchemas
} from './validation.middleware';

// Export all middleware components
export {
  // Authentication middleware
  authenticate,
  optionalAuthenticate,
  verifyToken,
  
  // Error handling middleware
  errorMiddleware,
  notFoundMiddleware,
  
  // Logging middleware
  loggingMiddleware,
  requestLoggingMiddleware,
  responseLoggingMiddleware,
  generateRequestId,
  
  // Rate limiting middleware
  rateLimiter,
  RateLimiterOptions,
  KeyGeneratorOptions,
  RateLimiterMiddlewareOptions,
  
  // Validation middleware
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  ValidationSchemas
};