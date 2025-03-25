/**
 * Common Utilities Export Module
 *
 * This module serves as a centralized export point for all utility functions
 * used throughout the AI-driven Freight Optimization Platform. It aggregates
 * specialized utility modules to provide a single import source for common utilities,
 * promoting code reuse and standardization across microservices.
 * 
 * Using this module allows developers to access utility functions through a single import:
 * `import { formatDate, handleError, calculateDistance } from '@backend/common/utils';`
 * instead of importing from multiple individual utility files.
 */

// Import and re-export all date and time utility functions
export * from './date-time';

// Import and re-export all error handling utilities and classes
export * from './error-handler';

// Import and re-export all geospatial utilities
export * from './geo-utils';

// Import and re-export logger and related functions
export * from './logger';

// Import and re-export all validation utilities
export * from './validation';