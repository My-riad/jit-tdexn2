/**
 * errorMessages.ts
 * 
 * Defines standardized error messages used across the frontend applications for 
 * consistent error handling and user feedback. This file contains categorized error 
 * message constants for different types of errors including authentication, API, 
 * validation, resource, business logic, integration, and generic errors.
 */

/**
 * Authentication-related error messages
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid username or password. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: "You don't have permission to perform this action.",
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  TOKEN_EXPIRED: 'Authentication token expired. Please log in again.',
};

/**
 * API communication-related error messages
 */
export const API_ERRORS = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection and try again.',
  TIMEOUT: 'Request timed out. Please try again later.',
  SERVER_ERROR: 'Server error occurred. Our team has been notified.',
  BAD_REQUEST: 'Invalid request. Please check your input and try again.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment before trying again.',
};

/**
 * Form validation-related error messages
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'This field is required.',
  INVALID_FORMAT: 'Invalid format.',
  MIN_LENGTH: 'Input is too short.',
  MAX_LENGTH: 'Input is too long.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 8 characters with letters, numbers, and special characters.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  INVALID_PHONE: 'Please enter a valid phone number.',
};

/**
 * Resource-related error messages
 */
export const RESOURCE_ERRORS = {
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'This resource already exists.',
  CONFLICT: 'This operation conflicts with the current state of the resource.',
  DELETED: 'This resource has been deleted.',
};

/**
 * Business logic-related error messages specific to freight operations
 */
export const BUSINESS_LOGIC_ERRORS = {
  LOAD_ALREADY_ASSIGNED: 'This load has already been assigned to another driver.',
  INSUFFICIENT_HOS: "You don't have sufficient hours of service available for this load.",
  INCOMPATIBLE_EQUIPMENT: 'Your equipment is not compatible with this load.',
  LOAD_EXPIRED: 'This load is no longer available.',
  DRIVER_UNAVAILABLE: 'The selected driver is not available for this assignment.',
  OUTSIDE_SERVICE_AREA: 'This location is outside our service area.',
};

/**
 * Integration-related error messages for external services
 */
export const INTEGRATION_ERRORS = {
  ELD_CONNECTION_FAILED: 'Failed to connect to your ELD device. Please check your connection and try again.',
  TMS_SYNC_FAILED: 'Failed to synchronize with TMS. Please try again later.',
  MAPPING_SERVICE_ERROR: 'Mapping service error. Some location features may be unavailable.',
  PAYMENT_PROCESSING_ERROR: 'Payment processing error. Please try again or use a different payment method.',
  WEATHER_SERVICE_ERROR: 'Weather data is currently unavailable.',
};

/**
 * Generic fallback error messages
 */
export const GENERIC_ERRORS = {
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
  OPERATION_FAILED: 'Operation failed. Please try again.',
  PLEASE_TRY_AGAIN: 'Something went wrong. Please try again.',
  CONTACT_SUPPORT: 'An error occurred. Please contact support if the problem persists.',
};

/**
 * Standardized error codes used across the frontend applications
 */
export enum ERROR_CODES {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'auth/invalid-credentials',
  AUTH_SESSION_EXPIRED = 'auth/session-expired',
  AUTH_UNAUTHORIZED = 'auth/unauthorized',
  AUTH_FORBIDDEN = 'auth/forbidden',
  AUTH_ACCOUNT_LOCKED = 'auth/account-locked',
  AUTH_TOKEN_EXPIRED = 'auth/token-expired',
  
  // API errors
  API_NETWORK_ERROR = 'api/network-error',
  API_TIMEOUT = 'api/timeout',
  API_SERVER_ERROR = 'api/server-error',
  API_BAD_REQUEST = 'api/bad-request',
  API_SERVICE_UNAVAILABLE = 'api/service-unavailable',
  API_TOO_MANY_REQUESTS = 'api/too-many-requests',
  
  // Validation errors
  VALIDATION_REQUIRED = 'validation/required',
  VALIDATION_FORMAT = 'validation/format',
  VALIDATION_MIN_LENGTH = 'validation/min-length',
  VALIDATION_MAX_LENGTH = 'validation/max-length',
  VALIDATION_EMAIL = 'validation/email',
  VALIDATION_PASSWORD = 'validation/password',
  VALIDATION_PASSWORDS_MATCH = 'validation/passwords-match',
  VALIDATION_PHONE = 'validation/phone',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'resource/not-found',
  RESOURCE_ALREADY_EXISTS = 'resource/already-exists',
  RESOURCE_CONFLICT = 'resource/conflict',
  RESOURCE_DELETED = 'resource/deleted',
  
  // Business logic errors
  BUSINESS_LOAD_ASSIGNED = 'business/load-already-assigned',
  BUSINESS_INSUFFICIENT_HOS = 'business/insufficient-hos',
  BUSINESS_INCOMPATIBLE_EQUIPMENT = 'business/incompatible-equipment',
  BUSINESS_LOAD_EXPIRED = 'business/load-expired',
  BUSINESS_DRIVER_UNAVAILABLE = 'business/driver-unavailable',
  BUSINESS_OUTSIDE_SERVICE_AREA = 'business/outside-service-area',
  
  // Integration errors
  INTEGRATION_ELD_CONNECTION = 'integration/eld-connection-failed',
  INTEGRATION_TMS_SYNC = 'integration/tms-sync-failed',
  INTEGRATION_MAPPING = 'integration/mapping-service-error',
  INTEGRATION_PAYMENT = 'integration/payment-processing-error',
  INTEGRATION_WEATHER = 'integration/weather-service-error',
  
  // Generic errors
  GENERIC_UNKNOWN = 'generic/unknown-error',
  GENERIC_OPERATION_FAILED = 'generic/operation-failed',
  GENERIC_TRY_AGAIN = 'generic/try-again',
  GENERIC_CONTACT_SUPPORT = 'generic/contact-support',
}

/**
 * Retrieves an appropriate error message based on error code or type
 * @param errorCode Error code or type
 * @param fallbackMessage Optional fallback message if no matching error is found
 * @returns The appropriate error message for the given error code or fallback message
 */
export const getErrorMessage = (errorCode: string | number, fallbackMessage?: string): string => {
  // Check for exact match in ERROR_CODES enum (if string)
  if (typeof errorCode === 'string') {
    // Check AUTH errors
    if (errorCode === ERROR_CODES.AUTH_INVALID_CREDENTIALS) return AUTH_ERRORS.INVALID_CREDENTIALS;
    if (errorCode === ERROR_CODES.AUTH_SESSION_EXPIRED) return AUTH_ERRORS.SESSION_EXPIRED;
    if (errorCode === ERROR_CODES.AUTH_UNAUTHORIZED) return AUTH_ERRORS.UNAUTHORIZED;
    if (errorCode === ERROR_CODES.AUTH_FORBIDDEN) return AUTH_ERRORS.FORBIDDEN;
    if (errorCode === ERROR_CODES.AUTH_ACCOUNT_LOCKED) return AUTH_ERRORS.ACCOUNT_LOCKED;
    if (errorCode === ERROR_CODES.AUTH_TOKEN_EXPIRED) return AUTH_ERRORS.TOKEN_EXPIRED;
    
    // Check API errors
    if (errorCode === ERROR_CODES.API_NETWORK_ERROR) return API_ERRORS.NETWORK_ERROR;
    if (errorCode === ERROR_CODES.API_TIMEOUT) return API_ERRORS.TIMEOUT;
    if (errorCode === ERROR_CODES.API_SERVER_ERROR) return API_ERRORS.SERVER_ERROR;
    if (errorCode === ERROR_CODES.API_BAD_REQUEST) return API_ERRORS.BAD_REQUEST;
    if (errorCode === ERROR_CODES.API_SERVICE_UNAVAILABLE) return API_ERRORS.SERVICE_UNAVAILABLE;
    if (errorCode === ERROR_CODES.API_TOO_MANY_REQUESTS) return API_ERRORS.TOO_MANY_REQUESTS;
    
    // Check Validation errors
    if (errorCode === ERROR_CODES.VALIDATION_REQUIRED) return VALIDATION_ERRORS.REQUIRED_FIELD;
    if (errorCode === ERROR_CODES.VALIDATION_FORMAT) return VALIDATION_ERRORS.INVALID_FORMAT;
    if (errorCode === ERROR_CODES.VALIDATION_MIN_LENGTH) return VALIDATION_ERRORS.MIN_LENGTH;
    if (errorCode === ERROR_CODES.VALIDATION_MAX_LENGTH) return VALIDATION_ERRORS.MAX_LENGTH;
    if (errorCode === ERROR_CODES.VALIDATION_EMAIL) return VALIDATION_ERRORS.INVALID_EMAIL;
    if (errorCode === ERROR_CODES.VALIDATION_PASSWORD) return VALIDATION_ERRORS.INVALID_PASSWORD;
    if (errorCode === ERROR_CODES.VALIDATION_PASSWORDS_MATCH) return VALIDATION_ERRORS.PASSWORDS_DONT_MATCH;
    if (errorCode === ERROR_CODES.VALIDATION_PHONE) return VALIDATION_ERRORS.INVALID_PHONE;
    
    // Check Resource errors
    if (errorCode === ERROR_CODES.RESOURCE_NOT_FOUND) return RESOURCE_ERRORS.NOT_FOUND;
    if (errorCode === ERROR_CODES.RESOURCE_ALREADY_EXISTS) return RESOURCE_ERRORS.ALREADY_EXISTS;
    if (errorCode === ERROR_CODES.RESOURCE_CONFLICT) return RESOURCE_ERRORS.CONFLICT;
    if (errorCode === ERROR_CODES.RESOURCE_DELETED) return RESOURCE_ERRORS.DELETED;
    
    // Check Business logic errors
    if (errorCode === ERROR_CODES.BUSINESS_LOAD_ASSIGNED) return BUSINESS_LOGIC_ERRORS.LOAD_ALREADY_ASSIGNED;
    if (errorCode === ERROR_CODES.BUSINESS_INSUFFICIENT_HOS) return BUSINESS_LOGIC_ERRORS.INSUFFICIENT_HOS;
    if (errorCode === ERROR_CODES.BUSINESS_INCOMPATIBLE_EQUIPMENT) return BUSINESS_LOGIC_ERRORS.INCOMPATIBLE_EQUIPMENT;
    if (errorCode === ERROR_CODES.BUSINESS_LOAD_EXPIRED) return BUSINESS_LOGIC_ERRORS.LOAD_EXPIRED;
    if (errorCode === ERROR_CODES.BUSINESS_DRIVER_UNAVAILABLE) return BUSINESS_LOGIC_ERRORS.DRIVER_UNAVAILABLE;
    if (errorCode === ERROR_CODES.BUSINESS_OUTSIDE_SERVICE_AREA) return BUSINESS_LOGIC_ERRORS.OUTSIDE_SERVICE_AREA;
    
    // Check Integration errors
    if (errorCode === ERROR_CODES.INTEGRATION_ELD_CONNECTION) return INTEGRATION_ERRORS.ELD_CONNECTION_FAILED;
    if (errorCode === ERROR_CODES.INTEGRATION_TMS_SYNC) return INTEGRATION_ERRORS.TMS_SYNC_FAILED;
    if (errorCode === ERROR_CODES.INTEGRATION_MAPPING) return INTEGRATION_ERRORS.MAPPING_SERVICE_ERROR;
    if (errorCode === ERROR_CODES.INTEGRATION_PAYMENT) return INTEGRATION_ERRORS.PAYMENT_PROCESSING_ERROR;
    if (errorCode === ERROR_CODES.INTEGRATION_WEATHER) return INTEGRATION_ERRORS.WEATHER_SERVICE_ERROR;
    
    // Check Generic errors
    if (errorCode === ERROR_CODES.GENERIC_UNKNOWN) return GENERIC_ERRORS.UNKNOWN_ERROR;
    if (errorCode === ERROR_CODES.GENERIC_OPERATION_FAILED) return GENERIC_ERRORS.OPERATION_FAILED;
    if (errorCode === ERROR_CODES.GENERIC_TRY_AGAIN) return GENERIC_ERRORS.PLEASE_TRY_AGAIN;
    if (errorCode === ERROR_CODES.GENERIC_CONTACT_SUPPORT) return GENERIC_ERRORS.CONTACT_SUPPORT;
    
    // Check for partial matches using string includes
    if (errorCode.includes('auth')) return AUTH_ERRORS.UNAUTHORIZED;
    if (errorCode.includes('network')) return API_ERRORS.NETWORK_ERROR;
    if (errorCode.includes('timeout')) return API_ERRORS.TIMEOUT;
    if (errorCode.includes('server')) return API_ERRORS.SERVER_ERROR;
    if (errorCode.includes('not found')) return RESOURCE_ERRORS.NOT_FOUND;
  }
  
  // Check for HTTP status codes (if number)
  if (typeof errorCode === 'number') {
    if (errorCode === 400) return API_ERRORS.BAD_REQUEST;
    if (errorCode === 401) return AUTH_ERRORS.UNAUTHORIZED;
    if (errorCode === 403) return AUTH_ERRORS.FORBIDDEN;
    if (errorCode === 404) return RESOURCE_ERRORS.NOT_FOUND;
    if (errorCode === 409) return RESOURCE_ERRORS.CONFLICT;
    if (errorCode === 429) return API_ERRORS.TOO_MANY_REQUESTS;
    if (errorCode >= 500) return API_ERRORS.SERVER_ERROR;
  }
  
  // Return fallback message or generic error
  return fallbackMessage || GENERIC_ERRORS.UNKNOWN_ERROR;
};