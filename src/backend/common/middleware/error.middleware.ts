import { Request, Response, NextFunction } from 'express';
import { AppError, normalizeError } from '../utils/error-handler';
import { ErrorCodes } from '../constants/error-codes';
import { StatusCodes } from '../constants/status-codes';
import logger from '../utils/logger';

/**
 * Express middleware for handling errors across all services
 * Provides standardized error processing, formatting, and response generation
 * for all API endpoints
 * 
 * @param error - The error to handle
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorMiddleware = (
  error: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Normalize the error to a standardized AppError format
  const normalizedError = normalizeError(error);

  // Log the error with appropriate context and request details
  const logMetadata = {
    url: req.originalUrl,
    method: req.method,
    requestId: req.headers['x-request-id'] || '',
    correlationId: req.headers['x-correlation-id'] || '',
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    errorCode: normalizedError.code,
    errorCategory: normalizedError.category,
    isRetryable: normalizedError.isRetryable,
    isOperational: normalizedError.isOperational,
    stackTrace: normalizedError.stack
  };

  // Use appropriate log level based on the error severity
  if (normalizedError.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    logger.error(`[${normalizedError.code}] ${normalizedError.message}`, logMetadata);
  } else {
    logger.debug(`[${normalizedError.code}] ${normalizedError.message}`, logMetadata);
  }

  // Set the HTTP status code based on the error's statusCode property
  const statusCode = normalizedError.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  // Format the error response based on the environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const formattedError = formatErrorResponse(normalizedError, isDevelopment);

  // Send the formatted error response to the client
  res.status(statusCode).json(formattedError);
};

/**
 * Express middleware for handling 404 Not Found errors for non-existent routes
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError('Route not found', {
    code: ErrorCodes.RES_ROUTE_NOT_FOUND,
    statusCode: StatusCodes.NOT_FOUND,
    details: { 
      path: req.originalUrl,
      method: req.method 
    }
  });

  next(error);
};

/**
 * Formats error responses based on environment and error details
 * 
 * @param error - The normalized error
 * @param isDevelopment - Whether the environment is development
 * @returns Formatted error response object
 */
const formatErrorResponse = (error: AppError, isDevelopment: boolean): object => {
  // Create the base error response
  const response: Record<string, any> = {
    code: error.code,
    message: error.message,
    status: error.statusCode
  };

  // Add error details if available
  if (error.details && Object.keys(error.details).length > 0) {
    response.details = error.details;
  }

  // Add additional information in development mode
  if (isDevelopment) {
    response.stack = error.stack;
    response.isOperational = error.isOperational;
    response.isRetryable = error.isRetryable;
    response.category = error.category;
  }

  return response;
};