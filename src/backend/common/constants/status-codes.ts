/**
 * Constants for HTTP status codes used throughout the application.
 * Provides named constants and utility functions for working with HTTP status codes
 * to ensure consistent API responses across the platform.
 */

/**
 * Standard HTTP status codes used in API responses.
 */
export enum StatusCodes {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * Range boundaries for HTTP status code categories.
 */
export enum StatusCodeRanges {
  INFORMATIONAL_MIN = 100,
  INFORMATIONAL_MAX = 199,
  SUCCESS_MIN = 200,
  SUCCESS_MAX = 299,
  REDIRECTION_MIN = 300,
  REDIRECTION_MAX = 399,
  CLIENT_ERROR_MIN = 400,
  CLIENT_ERROR_MAX = 499,
  SERVER_ERROR_MIN = 500,
  SERVER_ERROR_MAX = 599
}

/**
 * Determines if a status code represents a successful response (2xx range)
 * 
 * @param statusCode - The HTTP status code to check
 * @returns True if the status code is in the 2xx range
 */
export function isSuccessStatus(statusCode: number): boolean {
  return statusCode >= StatusCodeRanges.SUCCESS_MIN && statusCode <= StatusCodeRanges.SUCCESS_MAX;
}

/**
 * Determines if a status code represents a client error (4xx range)
 * 
 * @param statusCode - The HTTP status code to check
 * @returns True if the status code is in the 4xx range
 */
export function isClientError(statusCode: number): boolean {
  return statusCode >= StatusCodeRanges.CLIENT_ERROR_MIN && statusCode <= StatusCodeRanges.CLIENT_ERROR_MAX;
}

/**
 * Determines if a status code represents a server error (5xx range)
 * 
 * @param statusCode - The HTTP status code to check
 * @returns True if the status code is in the 5xx range
 */
export function isServerError(statusCode: number): boolean {
  return statusCode >= StatusCodeRanges.SERVER_MIN && statusCode <= StatusCodeRanges.SERVER_MAX;
}