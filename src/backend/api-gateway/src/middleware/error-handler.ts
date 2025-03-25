/**
 * Express middleware for centralized error handling in the API Gateway.
 * This middleware catches errors from all routes, normalizes them into a consistent format,
 * and sends appropriate HTTP responses with standardized error information.
 */

import express from 'express'; // express@4.18.2
import { AppError, normalizeError } from '../../../common/utils/error-handler';
import { StatusCodes } from '../../../common/constants/status-codes';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';

// Get current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Formats an error into a standardized response object for API clients
 * 
 * @param error - The AppError object to format
 * @param includeStack - Whether to include stack trace in the response
 * @returns Formatted error response object
 */
function formatErrorResponse(error: AppError, includeStack: boolean): Record<string, any> {
  // Create base response with required fields
  const response: Record<string, any> = {
    code: error.code,
    message: error.message,
    status: error.statusCode
  };

  // Include stack trace in development environment if requested
  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  // Add additional error details if available
  if (error.details && Object.keys(error.details).length > 0) {
    response.details = error.details;
  }

  return response;
}

/**
 * Express middleware that catches errors, normalizes them, and sends appropriate HTTP responses.
 * This ensures consistent error handling across all API Gateway routes.
 * 
 * @param err - The error object from Express
 * @param req - The Express request object
 * @param res - The Express response object
 * @param next - The Express next function
 */
function errorHandler(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  // Normalize any error type to our standardized AppError format
  const normalizedError = normalizeError(err);

  // Log the error with request context for debugging and monitoring
  logger.error(`API Gateway Error: ${normalizedError.message}`, {
    errorCode: normalizedError.code,
    errorCategory: normalizedError.category,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'] || '',
    userId: req.headers['x-user-id'] || '',
    ip: req.ip,
    userAgent: req.headers['user-agent'] || '',
    stack: normalizedError.stack
  });

  // Get the HTTP status code from the normalized error
  const statusCode = normalizedError.statusCode;

  // Format the error response, including stack traces in development
  const includeStack = NODE_ENV === 'development';
  const errorResponse = formatErrorResponse(normalizedError, includeStack);

  // Send the response with the appropriate status code
  res.status(statusCode).json(errorResponse);
}

// Export the error handler middleware
export default errorHandler;