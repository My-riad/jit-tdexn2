/**
 * Error Codes and Categories
 * 
 * This file defines standardized error codes, categories, and messages used
 * across the platform's microservices for consistent error handling.
 *
 * These definitions ensure uniform error reporting and handling throughout the system.
 */

/**
 * Categories of errors for grouping and handling similar error types
 */
export enum ErrorCategories {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT = 'CONFLICT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_SERVER = 'INTERNAL_SERVER',
  UNEXPECTED = 'UNEXPECTED'
}

/**
 * Detailed error codes for specific error scenarios across the platform
 */
export enum ErrorCodes {
  // Validation errors
  VAL_INVALID_INPUT = 'VAL_INVALID_INPUT',
  VAL_MISSING_FIELD = 'VAL_MISSING_FIELD',
  VAL_INVALID_FORMAT = 'VAL_INVALID_FORMAT',
  VAL_CONSTRAINT_VIOLATION = 'VAL_CONSTRAINT_VIOLATION',
  
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_MISSING_TOKEN = 'AUTH_MISSING_TOKEN',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_DISABLED = 'AUTH_ACCOUNT_DISABLED',
  AUTH_MFA_REQUIRED = 'AUTH_MFA_REQUIRED',
  
  // Authorization errors
  AUTHZ_INSUFFICIENT_PERMISSIONS = 'AUTHZ_INSUFFICIENT_PERMISSIONS',
  AUTHZ_RESOURCE_FORBIDDEN = 'AUTHZ_RESOURCE_FORBIDDEN',
  AUTHZ_INVALID_ROLE = 'AUTHZ_INVALID_ROLE',
  
  // Resource not found errors
  RES_DRIVER_NOT_FOUND = 'RES_DRIVER_NOT_FOUND',
  RES_LOAD_NOT_FOUND = 'RES_LOAD_NOT_FOUND',
  RES_VEHICLE_NOT_FOUND = 'RES_VEHICLE_NOT_FOUND',
  RES_CARRIER_NOT_FOUND = 'RES_CARRIER_NOT_FOUND',
  RES_SHIPPER_NOT_FOUND = 'RES_SHIPPER_NOT_FOUND',
  RES_USER_NOT_FOUND = 'RES_USER_NOT_FOUND',
  RES_DOCUMENT_NOT_FOUND = 'RES_DOCUMENT_NOT_FOUND',
  RES_SMART_HUB_NOT_FOUND = 'RES_SMART_HUB_NOT_FOUND',
  RES_ROUTE_NOT_FOUND = 'RES_ROUTE_NOT_FOUND',
  
  // Conflict errors
  CONF_DUPLICATE_ENTITY = 'CONF_DUPLICATE_ENTITY',
  CONF_ALREADY_EXISTS = 'CONF_ALREADY_EXISTS',
  CONF_STATE_CONFLICT = 'CONF_STATE_CONFLICT',
  CONF_CONCURRENT_MODIFICATION = 'CONF_CONCURRENT_MODIFICATION',
  CONF_OPTIMISTIC_LOCK = 'CONF_OPTIMISTIC_LOCK',
  
  // External service errors
  EXT_ELD_SERVICE_ERROR = 'EXT_ELD_SERVICE_ERROR',
  EXT_TMS_SERVICE_ERROR = 'EXT_TMS_SERVICE_ERROR',
  EXT_PAYMENT_SERVICE_ERROR = 'EXT_PAYMENT_SERVICE_ERROR',
  EXT_MAPPING_SERVICE_ERROR = 'EXT_MAPPING_SERVICE_ERROR',
  EXT_WEATHER_SERVICE_ERROR = 'EXT_WEATHER_SERVICE_ERROR',
  EXT_SERVICE_UNAVAILABLE = 'EXT_SERVICE_UNAVAILABLE',
  EXT_INVALID_RESPONSE = 'EXT_INVALID_RESPONSE',
  
  // Database errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_TRANSACTION_ERROR = 'DB_TRANSACTION_ERROR',
  DB_CONSTRAINT_ERROR = 'DB_CONSTRAINT_ERROR',
  DB_MIGRATION_ERROR = 'DB_MIGRATION_ERROR',
  
  // Network errors
  NET_CONNECTION_ERROR = 'NET_CONNECTION_ERROR',
  NET_REQUEST_FAILED = 'NET_REQUEST_FAILED',
  NET_TIMEOUT = 'NET_TIMEOUT',
  NET_DNS_ERROR = 'NET_DNS_ERROR',
  
  // Timeout errors
  TIME_REQUEST_TIMEOUT = 'TIME_REQUEST_TIMEOUT',
  TIME_OPERATION_TIMEOUT = 'TIME_OPERATION_TIMEOUT',
  TIME_DEADLINE_EXCEEDED = 'TIME_DEADLINE_EXCEEDED',
  
  // Rate limit errors
  RATE_TOO_MANY_REQUESTS = 'RATE_TOO_MANY_REQUESTS',
  RATE_QUOTA_EXCEEDED = 'RATE_QUOTA_EXCEEDED',
  RATE_THROTTLED = 'RATE_THROTTLED',
  
  // Server errors
  SRV_INTERNAL_ERROR = 'SRV_INTERNAL_ERROR',
  SRV_NOT_IMPLEMENTED = 'SRV_NOT_IMPLEMENTED',
  SRV_SERVICE_UNAVAILABLE = 'SRV_SERVICE_UNAVAILABLE',
  SRV_DEPENDENCY_FAILURE = 'SRV_DEPENDENCY_FAILURE',
  
  // Unexpected errors
  UNEX_UNEXPECTED_ERROR = 'UNEX_UNEXPECTED_ERROR'
}

/**
 * Default error messages for each error code
 */
export const ErrorMessages: Record<ErrorCodes, string> = {
  // Validation error messages
  [ErrorCodes.VAL_INVALID_INPUT]: 'Invalid input provided',
  [ErrorCodes.VAL_MISSING_FIELD]: 'Required field is missing',
  [ErrorCodes.VAL_INVALID_FORMAT]: 'Input format is invalid',
  [ErrorCodes.VAL_CONSTRAINT_VIOLATION]: 'Input violates constraints',
  
  // Authentication error messages
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid credentials provided',
  [ErrorCodes.AUTH_EXPIRED_TOKEN]: 'Authentication token has expired',
  [ErrorCodes.AUTH_INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCodes.AUTH_MISSING_TOKEN]: 'Authentication token is missing',
  [ErrorCodes.AUTH_ACCOUNT_LOCKED]: 'Account has been locked',
  [ErrorCodes.AUTH_ACCOUNT_DISABLED]: 'Account has been disabled',
  [ErrorCodes.AUTH_MFA_REQUIRED]: 'Multi-factor authentication required',
  
  // Authorization error messages
  [ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this operation',
  [ErrorCodes.AUTHZ_RESOURCE_FORBIDDEN]: 'Access to this resource is forbidden',
  [ErrorCodes.AUTHZ_INVALID_ROLE]: 'Invalid role for this operation',
  
  // Resource not found error messages
  [ErrorCodes.RES_DRIVER_NOT_FOUND]: 'Driver not found',
  [ErrorCodes.RES_LOAD_NOT_FOUND]: 'Load not found',
  [ErrorCodes.RES_VEHICLE_NOT_FOUND]: 'Vehicle not found',
  [ErrorCodes.RES_CARRIER_NOT_FOUND]: 'Carrier not found',
  [ErrorCodes.RES_SHIPPER_NOT_FOUND]: 'Shipper not found',
  [ErrorCodes.RES_USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.RES_DOCUMENT_NOT_FOUND]: 'Document not found',
  [ErrorCodes.RES_SMART_HUB_NOT_FOUND]: 'Smart hub not found',
  [ErrorCodes.RES_ROUTE_NOT_FOUND]: 'Route not found',
  
  // Conflict error messages
  [ErrorCodes.CONF_DUPLICATE_ENTITY]: 'Entity already exists',
  [ErrorCodes.CONF_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCodes.CONF_STATE_CONFLICT]: 'Resource state conflict',
  [ErrorCodes.CONF_CONCURRENT_MODIFICATION]: 'Resource was modified concurrently',
  [ErrorCodes.CONF_OPTIMISTIC_LOCK]: 'Optimistic lock failed',
  
  // External service error messages
  [ErrorCodes.EXT_ELD_SERVICE_ERROR]: 'ELD service error',
  [ErrorCodes.EXT_TMS_SERVICE_ERROR]: 'TMS service error',
  [ErrorCodes.EXT_PAYMENT_SERVICE_ERROR]: 'Payment service error',
  [ErrorCodes.EXT_MAPPING_SERVICE_ERROR]: 'Mapping service error',
  [ErrorCodes.EXT_WEATHER_SERVICE_ERROR]: 'Weather service error',
  [ErrorCodes.EXT_SERVICE_UNAVAILABLE]: 'External service unavailable',
  [ErrorCodes.EXT_INVALID_RESPONSE]: 'Invalid response from external service',
  
  // Database error messages
  [ErrorCodes.DB_CONNECTION_ERROR]: 'Database connection error',
  [ErrorCodes.DB_QUERY_ERROR]: 'Database query error',
  [ErrorCodes.DB_TRANSACTION_ERROR]: 'Database transaction error',
  [ErrorCodes.DB_CONSTRAINT_ERROR]: 'Database constraint violation',
  [ErrorCodes.DB_MIGRATION_ERROR]: 'Database migration error',
  
  // Network error messages
  [ErrorCodes.NET_CONNECTION_ERROR]: 'Network connection error',
  [ErrorCodes.NET_REQUEST_FAILED]: 'Network request failed',
  [ErrorCodes.NET_TIMEOUT]: 'Network timeout',
  [ErrorCodes.NET_DNS_ERROR]: 'DNS resolution error',
  
  // Timeout error messages
  [ErrorCodes.TIME_REQUEST_TIMEOUT]: 'Request timeout',
  [ErrorCodes.TIME_OPERATION_TIMEOUT]: 'Operation timeout',
  [ErrorCodes.TIME_DEADLINE_EXCEEDED]: 'Deadline exceeded',
  
  // Rate limit error messages
  [ErrorCodes.RATE_TOO_MANY_REQUESTS]: 'Too many requests',
  [ErrorCodes.RATE_QUOTA_EXCEEDED]: 'API quota exceeded',
  [ErrorCodes.RATE_THROTTLED]: 'Request throttled',
  
  // Server error messages
  [ErrorCodes.SRV_INTERNAL_ERROR]: 'Internal server error',
  [ErrorCodes.SRV_NOT_IMPLEMENTED]: 'Feature not implemented',
  [ErrorCodes.SRV_SERVICE_UNAVAILABLE]: 'Service unavailable',
  [ErrorCodes.SRV_DEPENDENCY_FAILURE]: 'Service dependency failure',
  
  // Unexpected error messages
  [ErrorCodes.UNEX_UNEXPECTED_ERROR]: 'An unexpected error occurred'
};

/**
 * List of error codes that are considered retryable
 */
const RETRYABLE_ERROR_CODES: ErrorCodes[] = [
  ErrorCodes.EXT_SERVICE_UNAVAILABLE,
  ErrorCodes.DB_CONNECTION_ERROR,
  ErrorCodes.NET_CONNECTION_ERROR,
  ErrorCodes.NET_REQUEST_FAILED,
  ErrorCodes.NET_TIMEOUT,
  ErrorCodes.TIME_REQUEST_TIMEOUT,
  ErrorCodes.TIME_OPERATION_TIMEOUT,
  ErrorCodes.RATE_TOO_MANY_REQUESTS,
  ErrorCodes.RATE_THROTTLED,
  ErrorCodes.SRV_SERVICE_UNAVAILABLE,
  ErrorCodes.SRV_DEPENDENCY_FAILURE
];

/**
 * Determines if an error should be retried based on its error code
 * 
 * @param errorCode - The error code to check
 * @returns True if the error is retryable, false otherwise
 */
export const isRetryableError = (errorCode: string): boolean => {
  return RETRYABLE_ERROR_CODES.includes(errorCode as ErrorCodes);
};