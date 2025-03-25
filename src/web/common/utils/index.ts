/**
 * A barrel file that exports all utility functions from the common/utils directory,
 * providing a centralized access point for utility functions used across the web applications
 * of the AI-driven Freight Optimization Platform. This simplifies imports by allowing consumers
 * to import from a single location rather than from individual utility files.
 */

// Export all utility functions from dateTimeUtils
export * as dateTimeUtils from './dateTimeUtils';

// Export all utility functions from errorHandlers
export * as errorHandlers from './errorHandlers';

// Export all utility functions from formatters
export * as formatters from './formatters';

// Export all utility functions from geoUtils
export * as geoUtils from './geoUtils';

// Export all utility functions from localStorage
export * as localStorage from './localStorage';

// Export logger instance for application-wide logging
export { default as logger, createLogger, formatLogMessage } from './logger';

// Export all utility functions from numberUtils
export * as numberUtils from './numberUtils';

// Export all utility functions from responsive
export * as responsive from './responsive';

// Export all utility functions from sessionStorage
export * as sessionStorage from './sessionStorage';

// Export all utility functions from stringUtils
export * as stringUtils from './stringUtils';

// Export all utility functions from validators
export * as validators from './validators';