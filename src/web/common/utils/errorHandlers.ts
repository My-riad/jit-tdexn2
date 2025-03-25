/**
 * Utility functions for handling errors in the frontend applications of the AI-driven Freight Optimization Platform.
 * Provides standardized error handling, error transformation, retry mechanisms, and user-friendly error messages.
 */

import { AxiosError } from 'axios'; // ^1.4.0

import { 
  StatusCodes,
  isClientError, 
  isServerError, 
  shouldRetry, 
  RETRYABLE_STATUS_CODES 
} from '../constants/statusCodes';

import {
  AUTH_ERRORS,
  API_ERRORS,
  VALIDATION_ERRORS,
  RESOURCE_ERRORS,
  BUSINESS_LOGIC_ERRORS,
  INTEGRATION_ERRORS,
  GENERIC_ERRORS,
  ERROR_CODES,
  getErrorMessage
} from '../constants/errorMessages';

import logger from '../utils/logger';

// Global constants
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

/**
 * Standardized error object with additional properties
 */
export interface ApiError extends Error {
  /** Error code for programmatic handling */
  code: string;
  /** HTTP status code if applicable */
  status?: number;
  /** Additional error details */
  details?: Record<string, any>;
  /** Original error object */
  originalError?: Error;
}

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Function to determine if retry should be attempted */
  retryCondition?: (error: Error, retryCount: number) => boolean;
  /** Function called before each retry attempt */
  onRetry?: (error: Error, retryCount: number) => void;
}

/**
 * Processes API errors and transforms them into user-friendly error objects
 * @param error - The Axios error to process
 * @returns Standardized error object with message, code, and details
 */
export function handleApiError(error: AxiosError): ApiError {
  // Extract status code, response data, and request details
  const status = error.response?.status;
  const responseData = error.response?.data;
  const requestUrl = error.config?.url;
  const requestMethod = error.config?.method;

  // Log the error with appropriate context
  logger.error(`API Error: ${error.message}`, {
    component: 'API',
    status,
    url: requestUrl,
    method: requestMethod,
    error
  });

  // Determine if it's a network error
  const isNetwork = isNetworkError(error);

  // Map the error to a standardized error code
  let errorCode = ERROR_CODES.GENERIC_UNKNOWN;
  
  if (isNetwork) {
    errorCode = ERROR_CODES.API_NETWORK_ERROR;
  } else if (error.code === 'ECONNABORTED') {
    errorCode = ERROR_CODES.API_TIMEOUT;
  } else if (status) {
    // Map HTTP status codes to error codes
    if (status === StatusCodes.UNAUTHORIZED) {
      errorCode = ERROR_CODES.AUTH_UNAUTHORIZED;
    } else if (status === StatusCodes.FORBIDDEN) {
      errorCode = ERROR_CODES.AUTH_FORBIDDEN;
    } else if (status === StatusCodes.NOT_FOUND) {
      errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
    } else if (status === StatusCodes.CONFLICT) {
      errorCode = ERROR_CODES.RESOURCE_CONFLICT;
    } else if (status === StatusCodes.TOO_MANY_REQUESTS) {
      errorCode = ERROR_CODES.API_TOO_MANY_REQUESTS;
    } else if (isClientError(status)) {
      errorCode = ERROR_CODES.API_BAD_REQUEST;
    } else if (isServerError(status)) {
      errorCode = ERROR_CODES.API_SERVER_ERROR;
    }
  }

  // Get a user-friendly error message based on the error code
  const message = getErrorMessage(errorCode, error.message);

  // Extract detailed error information from the response
  const details = extractErrorDetails(responseData);

  // Create and return a standardized ApiError object
  return createErrorWithCode(message, errorCode, {
    status,
    details,
    originalError: error
  });
}

/**
 * Determines if an error is a network-related error
 * @param error - The Axios error to check
 * @returns True if the error is network-related
 */
export function isNetworkError(error: AxiosError): boolean {
  return !error.response || error.code === 'ECONNABORTED';
}

/**
 * Retries a function with exponential backoff
 * @param fn - The function to retry
 * @param options - Configuration options for retry behavior
 * @returns Result of the function call if successful
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Initialize retry count
  let retryCount = 0;
  
  // Get options with defaults
  const maxRetries = options.maxRetries ?? MAX_RETRY_ATTEMPTS;
  const initialDelay = options.initialDelay ?? INITIAL_RETRY_DELAY;
  const maxDelay = options.maxDelay ?? MAX_RETRY_DELAY;
  const retryCondition = options.retryCondition ?? (() => true);
  const onRetry = options.onRetry;

  // Define retry function with exponential backoff
  const execute = async (): Promise<T> => {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      // Increment retry count
      retryCount++;
      
      // Check if we should retry
      const shouldRetry = retryCount <= maxRetries && 
        retryCondition(error as Error, retryCount);
      
      if (!shouldRetry) {
        logger.error(`Retry failed after ${retryCount} attempts`, { error });
        throw error;
      }
      
      // Calculate delay with exponential backoff
      // Formula: min(initialDelay * 2^retryCount, maxDelay)
      const delay = Math.min(
        initialDelay * Math.pow(2, retryCount - 1),
        maxDelay
      );
      
      // Add some jitter to avoid thundering herd problem
      const jitteredDelay = delay * (0.8 + Math.random() * 0.4);
      
      // Log retry attempt
      logger.debug(`Retrying operation (attempt ${retryCount}/${maxRetries}) after ${Math.round(jitteredDelay)}ms`, {
        retryCount,
        maxRetries,
        delay: Math.round(jitteredDelay)
      });
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error as Error, retryCount);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      
      // Retry the function
      return execute();
    }
  };
  
  return execute();
}

/**
 * Determines if a request should be retried based on the error
 * @param error - The Axios error to check
 * @param retryCount - Current retry count
 * @param maxRetries - Maximum number of retries allowed
 * @returns True if the request should be retried
 */
export function shouldRetryRequest(
  error: AxiosError, 
  retryCount: number, 
  maxRetries: number = MAX_RETRY_ATTEMPTS
): boolean {
  // Check if retry count is less than max retries
  if (retryCount >= maxRetries) {
    return false;
  }
  
  // Check if the error is a network error
  if (isNetworkError(error)) {
    return true;
  }
  
  // Check if the status code is in the retryable status codes list
  const status = error.response?.status;
  return status ? shouldRetry(status) : false;
}

/**
 * Formats an error message with additional context
 * @param message - Base error message
 * @param context - Additional context information
 * @returns Formatted error message
 */
export function formatErrorMessage(
  message: string,
  context: Record<string, any> = {}
): string {
  // Start with the base message
  let formattedMessage = message;
  
  // If context is provided, append relevant context information
  if (Object.keys(context).length > 0) {
    const contextString = Object.entries(context)
      .map(([key, value]) => {
        // Handle different types of values
        if (value === null) return `${key}: null`;
        if (value === undefined) return `${key}: undefined`;
        if (typeof value === 'object') {
          try {
            return `${key}: ${JSON.stringify(value)}`;
          } catch (e) {
            return `${key}: [Complex Object]`;
          }
        }
        return `${key}: ${value}`;
      })
      .join(', ');
    
    formattedMessage += ` (${contextString})`;
  }
  
  return formattedMessage;
}

/**
 * Creates an Error object with an error code and optional details
 * @param message - Error message
 * @param code - Error code for categorization
 * @param details - Additional error details
 * @returns Error object with code and details
 */
export function createErrorWithCode(
  message: string,
  code: string,
  details?: Record<string, any>
): ApiError {
  // Create a new Error object with the message
  const error = new Error(message) as ApiError;
  
  // Add code property to the error
  error.code = code;
  
  // Add details property to the error if provided
  if (details) {
    Object.assign(error, details);
  }
  
  return error;
}

/**
 * Extracts detailed error information from an API response
 * @param responseData - Response data from API
 * @returns Extracted error details in a standardized format
 */
export function extractErrorDetails(responseData: any): Record<string, any> {
  // If no response data, return empty object
  if (!responseData) {
    return {};
  }
  
  // Check for various error formats in response data
  if (responseData.errors && Array.isArray(responseData.errors)) {
    // Format: { errors: [{ field: "field", message: "message" }] }
    return { 
      errors: responseData.errors.map((error: any) => ({
        field: error.field || 'unknown',
        message: error.message || 'Unknown error'
      }))
    };
  }
  
  if (responseData.errors && typeof responseData.errors === 'object') {
    // Format: { errors: { field1: ["error1", "error2"], field2: ["error3"] } }
    return { errors: responseData.errors };
  }
  
  if (responseData.validationErrors && Array.isArray(responseData.validationErrors)) {
    // Format: { validationErrors: [{ property: "field", constraints: { rule: "message" } }] }
    return {
      validationErrors: responseData.validationErrors.map((error: any) => ({
        field: error.property || 'unknown',
        constraints: error.constraints || {},
        message: error.message || 
          (error.constraints ? Object.values(error.constraints)[0] : 'Unknown error')
      }))
    };
  }
  
  if (responseData.message) {
    // Format: { message: "Error message" }
    return { message: responseData.message };
  }
  
  if (responseData.error) {
    // Format: { error: "Error message" } or { error: { message: "Error message" } }
    if (typeof responseData.error === 'string') {
      return { message: responseData.error };
    } else if (responseData.error.message) {
      return { 
        message: responseData.error.message,
        ...responseData.error 
      };
    }
    return { error: responseData.error };
  }
  
  // Return original response data if no recognized error format
  return responseData;
}