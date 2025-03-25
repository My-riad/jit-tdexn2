/**
 * Error Service
 * 
 * A centralized error handling service for the web applications of the AI-driven Freight Optimization Platform.
 * This service provides standardized error processing, reporting, and user feedback mechanisms
 * to ensure consistent error handling across all frontend interfaces.
 */

import { AxiosError } from 'axios'; // ^1.4.0

import { handleApiError, createErrorWithCode, formatErrorMessage } from '../utils/errorHandlers';
import logger from '../utils/logger';
import { 
  ERROR_CODES, 
  getErrorMessage, 
  AUTH_ERRORS, 
  API_ERRORS, 
  VALIDATION_ERRORS, 
  RESOURCE_ERRORS, 
  BUSINESS_LOGIC_ERRORS 
} from '../constants/errorMessages';
import { StatusCodes, isClientError, isServerError } from '../constants/statusCodes';
import notificationService from './notificationService';

// Global constants
const ERROR_REPORTING_ENDPOINT = 'https://api.freight-optimization.com/api/v1/errors/report';
const MAX_ERROR_STACK_SIZE = 10;
const ERROR_STORAGE_KEY = 'error_history';

/**
 * Categories of errors for classification
 */
export enum ErrorCategory {
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  AUTH_ERROR = 'auth_error',
  NETWORK_ERROR = 'network_error',
  BUSINESS_ERROR = 'business_error',
  INTEGRATION_ERROR = 'integration_error',
  RESOURCE_ERROR = 'resource_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Severity levels for errors
 */
export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Standardized error object with additional properties
 */
export interface ProcessedError {
  /** User-friendly error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
  /** HTTP status code if applicable */
  status?: number;
  /** Additional error details */
  details?: Record<string, any>;
  /** Original error object */
  originalError?: Error;
  /** Category of the error */
  category?: ErrorCategory;
  /** Severity level of the error */
  severity?: ErrorSeverity;
  /** Timestamp when the error occurred */
  timestamp?: number;
}

/**
 * Options for error processing
 */
export interface ErrorProcessOptions {
  /** Whether to show a notification for this error */
  showNotification?: boolean;
  /** Whether to report this error to the error tracking service */
  reportError?: boolean;
  /** Additional context information for the error */
  context?: Record<string, any>;
  /** Override the default severity level */
  severity?: ErrorSeverity;
}

/**
 * Options for error notifications
 */
export interface ErrorNotificationOptions {
  /** Custom title for the notification */
  title?: string;
  /** Duration to show the notification in milliseconds */
  duration?: number;
  /** Severity level affecting notification styling */
  severity?: ErrorSeverity;
  /** Text for action button */
  actionText?: string;
  /** Handler for action button click */
  actionHandler?: () => void;
}

/**
 * Options for error reporting
 */
export interface ErrorReportOptions {
  /** User information for error context */
  user?: { id: string; role: string };
  /** Tags to categorize the error */
  tags?: Record<string, string>;
  /** Additional metadata for the error report */
  metadata?: Record<string, any>;
  /** Whether to store the error in local history */
  storeLocally?: boolean;
}

/**
 * Entry in the error history
 */
export interface ErrorHistoryEntry {
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Timestamp when the error occurred */
  timestamp: number;
  /** Category of the error */
  category: ErrorCategory;
  /** Severity level of the error */
  severity: ErrorSeverity;
  /** Context information for the error */
  context?: Record<string, any>;
}

/**
 * Processes any type of error into a standardized format with appropriate user feedback
 * 
 * @param error - The error to process
 * @param options - Options for error processing
 * @returns Standardized error object with message, code, and details
 */
export const processError = (
  error: Error | AxiosError | unknown,
  options: ErrorProcessOptions = {}
): ProcessedError => {
  // Default options
  const { 
    showNotification = true, 
    reportError: shouldReportError = true,
    context = {}
  } = options;

  // Initialize processedError with default values
  let processedError: ProcessedError;

  // Process different types of errors
  if (axios.isAxiosError(error)) {
    // Handle Axios errors
    processedError = handleApiError(error);
  } else if (error instanceof Error) {
    // Handle standard Error objects
    const errorCode = (error as any).code || ERROR_CODES.GENERIC_UNKNOWN;
    processedError = {
      message: error.message || getErrorMessage(errorCode),
      code: errorCode,
      originalError: error
    };
  } else {
    // Handle unknown error types
    processedError = {
      message: typeof error === 'string' ? error : 'An unknown error occurred.',
      code: ERROR_CODES.GENERIC_UNKNOWN
    };
  }

  // Classify the error and determine severity
  const category = classifyError(processedError);
  const severity = options.severity || getSeverityFromError(processedError);

  // Enhance processed error with additional information
  processedError.category = category;
  processedError.severity = severity;
  processedError.timestamp = Date.now();

  // Add context to error details
  if (Object.keys(context).length > 0) {
    processedError.details = {
      ...processedError.details,
      context
    };
  }

  // Log the error
  logger.error(`Error [${category}]: ${processedError.message}`, {
    component: 'ErrorService',
    code: processedError.code,
    severity,
    details: processedError.details,
    error: processedError.originalError
  });

  // Show notification if configured
  if (showNotification) {
    showErrorNotification(processedError.message, { severity });
  }

  // Report error if configured
  if (shouldReportError) {
    reportError(processedError, { storeLocally: true });
  }

  return processedError;
};

/**
 * Displays an error notification to the user
 * 
 * @param message - Error message to display
 * @param options - Options for the notification
 */
export const showErrorNotification = (
  message: string,
  options: ErrorNotificationOptions = {}
): void => {
  const { 
    title = 'Error', 
    duration = 5000, 
    severity = ErrorSeverity.MEDIUM,
    actionText,
    actionHandler
  } = options;

  // Determine notification type based on severity
  let type = 'error';
  if (severity === ErrorSeverity.LOW) {
    type = 'warning';
  } else if (severity === ErrorSeverity.CRITICAL) {
    type = 'critical';
  }

  // Format the message for display
  const formattedMessage = message.length > 150 
    ? `${message.substring(0, 150)}...` 
    : message;

  // Use notification service to display the error
  notificationService.showNotification({
    type,
    title,
    message: formattedMessage,
    duration,
    action: actionText ? {
      text: actionText,
      onClick: actionHandler
    } : undefined
  });

  logger.debug('Displayed error notification', {
    component: 'ErrorService',
    message: formattedMessage,
    severity,
    type
  });
};

/**
 * Reports an error to the error tracking service
 * 
 * @param error - The error to report
 * @param options - Options for error reporting
 * @returns Promise resolving to true if reporting was successful
 */
export const reportError = async (
  error: Error | ProcessedError,
  options: ErrorReportOptions = {}
): Promise<boolean> => {
  const { user, tags = {}, metadata = {}, storeLocally = true } = options;

  try {
    // Prepare processed error for reporting
    const processedError = 'code' in error ? error : processError(error, { showNotification: false, reportError: false });
    
    // Prepare the error report payload
    const errorReport = {
      message: processedError.message,
      code: processedError.code,
      category: processedError.category || classifyError(processedError),
      severity: processedError.severity || getSeverityFromError(processedError),
      timestamp: processedError.timestamp || Date.now(),
      details: processedError.details || {},
      stack: processedError.originalError?.stack,
      user,
      tags,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
        appVersion: process.env.REACT_APP_VERSION || 'unknown'
      }
    };

    // Store in local history if configured
    if (storeLocally) {
      storeErrorInHistory({
        message: processedError.message,
        code: processedError.code,
        timestamp: errorReport.timestamp,
        category: errorReport.category as ErrorCategory,
        severity: errorReport.severity as ErrorSeverity,
        context: { ...errorReport.details, ...metadata }
      });
    }

    // Send error report to tracking service
    const response = await fetch(ERROR_REPORTING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorReport),
      // Don't block UI thread waiting for response
      keepalive: true
    });

    const success = response.ok;
    logger.debug(`Error report ${success ? 'sent successfully' : 'failed'}`, {
      component: 'ErrorService',
      code: processedError.code,
      success
    });

    return success;
  } catch (reportingError) {
    // Don't use processError here to avoid infinite recursion
    logger.error('Failed to report error', {
      component: 'ErrorService',
      error: reportingError
    });
    return false;
  }
};

/**
 * Stores an error in the local error history
 * 
 * @param error - Error entry to store
 */
const storeErrorInHistory = (error: ErrorHistoryEntry): void => {
  try {
    // Get existing error history
    const history = getErrorHistory();
    
    // Add new error to the beginning of the array
    history.unshift(error);
    
    // Limit history size
    const limitedHistory = history.slice(0, MAX_ERROR_STACK_SIZE);
    
    // Save updated history
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (err) {
    // Log but don't process to avoid potential infinite loop
    logger.error('Failed to store error in history', {
      component: 'ErrorService',
      error: err
    });
  }
};

/**
 * Retrieves the history of errors stored locally
 * 
 * @returns Array of historical error entries
 */
export const getErrorHistory = (): ErrorHistoryEntry[] => {
  try {
    const historyJson = localStorage.getItem(ERROR_STORAGE_KEY);
    if (!historyJson) return [];
    
    const history = JSON.parse(historyJson);
    if (!Array.isArray(history)) return [];
    
    return history;
  } catch (err) {
    logger.error('Failed to retrieve error history', {
      component: 'ErrorService',
      error: err
    });
    return [];
  }
};

/**
 * Clears the locally stored error history
 */
export const clearErrorHistory = (): void => {
  try {
    localStorage.removeItem(ERROR_STORAGE_KEY);
    logger.debug('Error history cleared', {
      component: 'ErrorService'
    });
  } catch (err) {
    logger.error('Failed to clear error history', {
      component: 'ErrorService',
      error: err
    });
  }
};

/**
 * Classifies an error into a specific category
 * 
 * @param error - The error to classify
 * @returns Category of the error
 */
export const classifyError = (error: Error | ProcessedError): ErrorCategory => {
  // If already classified, return the category
  if ('category' in error && error.category) {
    return error.category;
  }

  // Get error code or use unknown
  const code = 'code' in error ? error.code : '';
  const status = 'status' in error ? error.status : undefined;

  // Classify based on error code
  if (code.startsWith('auth/')) {
    return ErrorCategory.AUTH_ERROR;
  }
  
  if (code.startsWith('validation/')) {
    return ErrorCategory.VALIDATION_ERROR;
  }
  
  if (code.startsWith('api/')) {
    return ErrorCategory.API_ERROR;
  }
  
  if (code.startsWith('resource/')) {
    return ErrorCategory.RESOURCE_ERROR;
  }
  
  if (code.startsWith('business/')) {
    return ErrorCategory.BUSINESS_ERROR;
  }
  
  if (code.startsWith('integration/')) {
    return ErrorCategory.INTEGRATION_ERROR;
  }
  
  if (code === ERROR_CODES.API_NETWORK_ERROR) {
    return ErrorCategory.NETWORK_ERROR;
  }

  // Classify based on HTTP status if available
  if (status) {
    if (status === StatusCodes.UNAUTHORIZED || status === StatusCodes.FORBIDDEN) {
      return ErrorCategory.AUTH_ERROR;
    }
    
    if (status === StatusCodes.BAD_REQUEST || status === StatusCodes.UNPROCESSABLE_ENTITY) {
      return ErrorCategory.VALIDATION_ERROR;
    }
    
    if (status === StatusCodes.NOT_FOUND || status === StatusCodes.CONFLICT) {
      return ErrorCategory.RESOURCE_ERROR;
    }
    
    if (isClientError(status)) {
      return ErrorCategory.API_ERROR;
    }
    
    if (isServerError(status)) {
      return ErrorCategory.API_ERROR;
    }
  }

  // Check the error message for clues
  const message = error.message || '';
  if (message.includes('authentication') || message.includes('login') || message.includes('authorization')) {
    return ErrorCategory.AUTH_ERROR;
  }
  
  if (message.includes('validation') || message.includes('invalid input')) {
    return ErrorCategory.VALIDATION_ERROR;
  }
  
  if (message.includes('network') || message.includes('connection')) {
    return ErrorCategory.NETWORK_ERROR;
  }

  // Default to unknown
  return ErrorCategory.UNKNOWN_ERROR;
};

/**
 * Determines the severity level of an error
 * 
 * @param error - The error to evaluate
 * @returns Severity level of the error
 */
export const getSeverityFromError = (error: Error | ProcessedError): ErrorSeverity => {
  // If already has severity, return it
  if ('severity' in error && error.severity) {
    return error.severity;
  }

  // Get category (classify if needed)
  const category = 'category' in error ? error.category : classifyError(error);
  const status = 'status' in error ? error.status : undefined;
  const code = 'code' in error ? error.code : '';

  // Critical errors
  if (category === ErrorCategory.NETWORK_ERROR) {
    return ErrorSeverity.HIGH; // Network issues are high severity
  }
  
  if (category === ErrorCategory.AUTH_ERROR && 
      (code === ERROR_CODES.AUTH_SESSION_EXPIRED || code === ERROR_CODES.AUTH_TOKEN_EXPIRED)) {
    return ErrorSeverity.HIGH; // Session expiration is high severity
  }
  
  if (status && isServerError(status)) {
    return ErrorSeverity.HIGH; // Server errors are high severity
  }

  // High severity errors
  if (category === ErrorCategory.BUSINESS_ERROR) {
    return ErrorSeverity.MEDIUM; // Business logic errors are medium severity
  }
  
  if (category === ErrorCategory.RESOURCE_ERROR) {
    return ErrorSeverity.MEDIUM; // Resource errors are medium severity
  }
  
  if (category === ErrorCategory.AUTH_ERROR) {
    return ErrorSeverity.HIGH; // Most auth errors are high severity
  }

  // Medium severity errors
  if (category === ErrorCategory.VALIDATION_ERROR) {
    return ErrorSeverity.LOW; // Validation errors are low severity
  }
  
  if (category === ErrorCategory.API_ERROR && status && status < 500) {
    return ErrorSeverity.MEDIUM; // Client API errors are medium severity
  }

  // Default to medium severity
  return ErrorSeverity.MEDIUM;
};

// Create a utility to check if an object is an Axios error
// This is needed since we're using the import but need its type
const axios = { isAxiosError: (err: any): err is AxiosError => err?.isAxiosError === true };

// Export default object with all functions
export default {
  processError,
  showErrorNotification,
  reportError,
  getErrorHistory,
  clearErrorHistory
};