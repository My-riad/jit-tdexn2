/**
 * HTTP Status Code constants and utility functions for handling API responses.
 * This module provides a centralized reference for all HTTP status codes used
 * throughout the application, ensuring consistent error handling and response processing.
 */

/**
 * HTTP Status Code constants used throughout the application.
 * Provides a centralized reference for status code handling.
 */
export enum StatusCodes {
  // 2xx - Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // 4xx - Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  GONE = 410,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  REQUEST_TIMEOUT = 408,
  
  // 5xx - Server Errors
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * Status codes that indicate a request can be retried.
 * Typically includes timeout errors, rate limiting, and temporary server issues.
 */
export const RETRYABLE_STATUS_CODES = [
  StatusCodes.REQUEST_TIMEOUT,
  StatusCodes.TOO_MANY_REQUESTS,
  StatusCodes.BAD_GATEWAY,
  StatusCodes.SERVICE_UNAVAILABLE,
  StatusCodes.GATEWAY_TIMEOUT
];

/**
 * Determines if a status code represents a client error (4xx range).
 * @param statusCode - The HTTP status code to check
 * @returns True if the status code is in the 4xx range
 */
export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Determines if a status code represents a server error (5xx range).
 * @param statusCode - The HTTP status code to check
 * @returns True if the status code is in the 5xx range
 */
export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Determines if a status code represents a successful response (2xx range).
 * @param statusCode - The HTTP status code to check
 * @returns True if the status code is in the 2xx range
 */
export function isSuccess(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Determines if a request should be retried based on the status code.
 * @param statusCode - The HTTP status code to check
 * @returns True if the request should be retried
 */
export function shouldRetry(statusCode: number): boolean {
  return RETRYABLE_STATUS_CODES.includes(statusCode);
}