/**
 * Error handling utility for standardized error processing across the platform.
 * Provides consistent error handling patterns, error normalization, and appropriate
 * HTTP status code mapping for all microservices.
 */

import { ErrorCodes, ErrorCategories, ErrorMessages, isRetryableError } from '../constants/error-codes';
import { StatusCodes } from '../constants/status-codes';
import { EventTypes } from '../constants/event-types';
import logger from './logger';

/**
 * Custom error class that extends Error with additional properties for error handling
 */
export class AppError extends Error {
  code: string;
  category: string;
  statusCode: number;
  isRetryable: boolean;
  isOperational: boolean;
  details: Record<string, any>;

  /**
   * Creates a new AppError instance with standardized properties
   * 
   * @param message - Error message
   * @param options - Additional error options
   */
  constructor(message: string, options: {
    code?: string;
    statusCode?: number;
    isRetryable?: boolean;
    isOperational?: boolean;
    details?: Record<string, any>;
  } = {}) {
    super(message);
    this.name = 'AppError';
    
    // Set error code or default to unexpected error
    this.code = options.code || ErrorCodes.UNEX_UNEXPECTED_ERROR;
    
    // Determine error category based on code prefix
    this.category = this.code.split('_')[0];
    
    // Set HTTP status code by mapping from the error code
    this.statusCode = options.statusCode || mapErrorToStatusCode(this.code);
    
    // Determine if the error is retryable
    this.isRetryable = options.isRetryable !== undefined 
      ? options.isRetryable 
      : isRetryableError(this.code);
    
    // Set isOperational flag to indicate if error is expected/handled
    this.isOperational = options.isOperational !== undefined 
      ? options.isOperational 
      : true;
    
    // Set additional error details from options
    this.details = options.details || {};
    
    // Capture the stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts the error to a JSON-serializable object for API responses
   * 
   * @returns JSON representation of the error
   */
  toJSON() {
    const json: Record<string, any> = {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode
    };

    // Add error details if available
    if (Object.keys(this.details).length > 0) {
      json.details = this.details;
    }

    // Add stack trace if in development environment
    if (process.env.NODE_ENV === 'development') {
      json.stack = this.stack;
    }

    return json;
  }
}

/**
 * Maps error codes to appropriate HTTP status codes
 * 
 * @param errorCode - The error code to map
 * @returns HTTP status code
 */
export function mapErrorToStatusCode(errorCode: string): number {
  // Check the error code prefix to determine its category
  const prefix = errorCode.split('_')[0];

  switch (prefix) {
    // Validation errors to 400 Bad Request
    case 'VAL':
      return StatusCodes.BAD_REQUEST;
    
    // Authentication errors to 401 Unauthorized
    case 'AUTH':
      return StatusCodes.UNAUTHORIZED;
    
    // Authorization errors to 403 Forbidden
    case 'AUTHZ':
      return StatusCodes.FORBIDDEN;
    
    // Resource not found errors to 404 Not Found
    case 'RES':
      return StatusCodes.NOT_FOUND;
    
    // Conflict errors to 409 Conflict
    case 'CONF':
      return StatusCodes.CONFLICT;
    
    // Rate limit errors to 429 Too Many Requests
    case 'RATE':
      return StatusCodes.TOO_MANY_REQUESTS;
    
    // External service errors to 503 Service Unavailable
    case 'EXT':
      return StatusCodes.SERVICE_UNAVAILABLE;
    
    // Database errors to 500 Internal Server Error
    case 'DB':
      return StatusCodes.INTERNAL_SERVER_ERROR;
    
    // Network errors to appropriate error codes
    case 'NET':
      return errorCode === 'NET_CONNECTION_ERROR' 
        ? StatusCodes.SERVICE_UNAVAILABLE 
        : StatusCodes.INTERNAL_SERVER_ERROR;
    
    // Timeout errors to 504 Gateway Timeout
    case 'TIME':
      return StatusCodes.GATEWAY_TIMEOUT;
    
    // Server errors to 500 Internal Server Error
    case 'SRV':
      return StatusCodes.INTERNAL_SERVER_ERROR;
    
    // Unexpected errors to 500 Internal Server Error
    case 'UNEX':
      return StatusCodes.INTERNAL_SERVER_ERROR;
    
    // Default to 500 Internal Server Error for unrecognized error codes
    default:
      return StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Normalizes any error type to a standardized AppError with appropriate classification
 * 
 * @param error - The error to normalize
 * @returns Standardized AppError object
 */
export function normalizeError(error: Error | AppError | unknown): AppError {
  // Check if the error is already an AppError and return it if so
  if (error instanceof AppError) {
    return error;
  }

  // If error is a standard Error, create an AppError with its message and stack
  if (error instanceof Error) {
    const appError = new AppError(error.message, {
      code: ErrorCodes.UNEX_UNEXPECTED_ERROR,
      isOperational: false
    });
    appError.stack = error.stack;
    return appError;
  }

  // If it's a string, use it as the message
  if (typeof error === 'string') {
    return new AppError(error, {
      code: ErrorCodes.UNEX_UNEXPECTED_ERROR,
      isOperational: false
    });
  }

  // If error is an unknown type, create a generic AppError
  return new AppError('An unknown error occurred', {
    code: ErrorCodes.UNEX_UNEXPECTED_ERROR,
    isOperational: false,
    details: { originalError: error }
  });
}

/**
 * Processes any error into a standardized format with appropriate status code and metadata
 * 
 * @param error - The error to handle
 * @param serviceName - The name of the service where the error occurred
 * @param metadata - Additional metadata to include with the error
 * @returns Standardized AppError
 */
export function handleError(
  error: Error | AppError | unknown,
  serviceName: string,
  metadata: Record<string, any> = {}
): AppError {
  // Normalize the error to a standardized AppError format
  const normalizedError = normalizeError(error);
  
  // Log the error with appropriate context and metadata
  const logMetadata = {
    ...metadata,
    errorCode: normalizedError.code,
    errorCategory: normalizedError.category,
    service: serviceName,
    isRetryable: normalizedError.isRetryable,
    isOperational: normalizedError.isOperational
  };
  
  // Use appropriate log level based on error severity
  if (normalizedError.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    // For server errors (500+), use error level
    logger.error(`[${serviceName}] ${normalizedError.message}`, logMetadata);
  } else if (normalizedError.statusCode >= StatusCodes.BAD_REQUEST) {
    // For client errors (400-499), use warn level
    logger.warn(`[${serviceName}] ${normalizedError.message}`, logMetadata);
  } else {
    // For other cases, use debug level
    logger.debug(`[${serviceName}] ${normalizedError.message}`, logMetadata);
  }
  
  // Publish error event if it's a critical error
  if (normalizedError.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR && !normalizedError.isOperational) {
    const errorEvent = createErrorEvent(normalizedError, serviceName);
    // Here you would publish the error event to your event bus
    // eventBus.publish(errorEvent);
  }
  
  // Return the normalized error for further processing
  return normalizedError;
}

/**
 * Creates a standardized error event for the event bus
 * 
 * @param error - The AppError to create an event for
 * @param serviceName - The name of the service reporting the error
 * @returns Error event object ready for publishing
 */
export function createErrorEvent(error: AppError, serviceName: string): Record<string, any> {
  return {
    type: EventTypes.SYSTEM_ERROR,
    timestamp: new Date().toISOString(),
    service: serviceName,
    payload: {
      code: error.code,
      message: error.message,
      category: error.category,
      isRetryable: error.isRetryable,
      isOperational: error.isOperational,
      details: error.details,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }
  };
}