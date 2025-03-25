/**
 * Validation Utility Module
 * 
 * Provides validation functions for data validation across the AI-driven
 * Freight Optimization Platform. Includes schema validation, data sanitization,
 * and specialized validation functions for common data types like coordinates,
 * dates, and entity IDs.
 */

import Joi from 'joi'; // joi@17.9.2
import validator from 'validator'; // validator@13.9.0
import { AppError } from './error-handler';
import { ErrorCodes } from '../constants/error-codes';
import logger from './logger';

/**
 * Options for schema validation
 */
export interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  context?: Record<string, any>;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  success: boolean;
  data?: any;
  error?: ValidationError;
}

/**
 * Structure of validation errors
 */
export interface ValidationError {
  message: string;
  code: string;
  details: ValidationErrorDetails[];
}

/**
 * Detailed information about validation errors
 */
export interface ValidationErrorDetails {
  path: string[];
  message: string;
  type: string;
  context?: any;
}

/**
 * Options for date validation
 */
export interface DateValidationOptions {
  minDate?: Date;
  maxDate?: Date;
}

/**
 * Validates data against a Joi schema with standardized error handling
 * 
 * @param data - The data to validate
 * @param schema - The Joi schema to validate against
 * @param options - Additional validation options
 * @returns Result containing validated data or validation error
 */
export function validateSchema(data: any, schema: Joi.Schema, options?: ValidationOptions): ValidationResult {
  // Default options
  const validationOptions: ValidationOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false,
    ...options
  };

  // Perform validation
  const result = schema.validate(data, validationOptions);

  // If validation succeeds, return success result
  if (!result.error) {
    return {
      success: true,
      data: result.value
    };
  }

  // If validation fails, format error details
  const details = result.error.details.map(detail => ({
    path: detail.path,
    message: detail.message,
    type: detail.type,
    context: detail.context
  }));

  // Log validation error
  logger.debug('Validation failed', { 
    error: result.error.message,
    details
  });

  // Determine appropriate error code based on first error
  let errorCode = ErrorCodes.VAL_INVALID_INPUT;
  const firstError = result.error.details[0];
  if (firstError.type.includes('required')) {
    errorCode = ErrorCodes.VAL_MISSING_FIELD;
  } else if (firstError.type.includes('format') || firstError.type.includes('pattern')) {
    errorCode = ErrorCodes.VAL_INVALID_FORMAT;
  } else if (firstError.type.includes('min') || firstError.type.includes('max') || 
             firstError.type.includes('length') || firstError.type.includes('valid')) {
    errorCode = ErrorCodes.VAL_CONSTRAINT_VIOLATION;
  }

  // Return failure result
  return {
    success: false,
    error: {
      message: 'Validation failed',
      code: errorCode,
      details
    }
  };
}

/**
 * Validates if the provided latitude and longitude are valid geographic coordinates
 * 
 * @param latitude - The latitude value to validate
 * @param longitude - The longitude value to validate
 * @returns True if coordinates are valid, false otherwise
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  // Latitude must be between -90 and 90
  const isValidLatitude = typeof latitude === 'number' && latitude >= -90 && latitude <= 90;

  // Longitude must be between -180 and 180
  const isValidLongitude = typeof longitude === 'number' && longitude >= -180 && longitude <= 180;

  return isValidLatitude && isValidLongitude;
}

/**
 * Validates if the provided value is a valid date and optionally within a specified range
 * 
 * @param date - The date to validate
 * @param options - Additional validation options
 * @returns True if date is valid and meets criteria, false otherwise
 */
export function isValidDate(date: Date | string, options: DateValidationOptions = {}): boolean {
  // Convert string to Date if necessary
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid (not Invalid Date)
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return false;
  }

  // Check minimum date if specified
  if (options.minDate && dateObj < options.minDate) {
    return false;
  }

  // Check maximum date if specified
  if (options.maxDate && dateObj > options.maxDate) {
    return false;
  }

  return true;
}

/**
 * Validates if the provided string is a valid email address
 * 
 * @param email - The email to validate
 * @returns True if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return validator.isEmail(email);
}

/**
 * Validates if the provided string is a valid phone number
 * 
 * @param phone - The phone number to validate
 * @param locale - The locale to use for validation (defaults to 'en-US')
 * @returns True if phone number is valid, false otherwise
 */
export function isValidPhone(phone: string, locale: string = 'en-US'): boolean {
  return validator.isMobilePhone(phone, locale as any);
}

/**
 * Validates if the provided string is a valid UUID
 * 
 * @param uuid - The UUID to validate
 * @param version - The UUID version to validate against (defaults to '4')
 * @returns True if UUID is valid, false otherwise
 */
export function isValidUUID(uuid: string, version: string = '4'): boolean {
  return validator.isUUID(uuid, version as any);
}

/**
 * Validates if the provided ID matches the expected format for entity IDs
 * 
 * @param id - The ID to validate
 * @param entityPrefix - The expected entity prefix
 * @returns True if entity ID is valid, false otherwise
 */
export function isValidEntityId(id: string, entityPrefix: string): boolean {
  // Check if ID is defined and is a string
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Check if ID starts with the expected prefix
  if (!id.startsWith(entityPrefix + '-')) {
    return false;
  }

  // Validate the remaining part of the ID
  // Example format: "drv-12345-abcde"
  const idParts = id.split('-');
  
  // ID should have at least 3 parts (prefix, numeric part, alphanumeric part)
  if (idParts.length < 3) {
    return false;
  }

  // Validate numeric part
  if (!/^\d+$/.test(idParts[1])) {
    return false;
  }

  // Validate alphanumeric part
  if (!/^[a-zA-Z0-9]+$/.test(idParts[2])) {
    return false;
  }
  
  return true;
}

/**
 * Sanitizes input strings to prevent injection attacks
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string): string {
  if (!input) {
    return '';
  }
  
  // Escape HTML special characters
  let sanitized = validator.escape(input);
  
  // Remove potentially dangerous patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/expression\(/gi, '');
  sanitized = sanitized.replace(/eval\(/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');
  
  return sanitized;
}

/**
 * Creates a standardized validation error with detailed information
 * 
 * @param message - The error message
 * @param details - Additional error details
 * @param errorCode - The error code (defaults to VAL_INVALID_INPUT)
 * @returns Standardized validation error
 */
export function createValidationError(
  message: string,
  details: ValidationErrorDetails[] = [],
  errorCode: string = ErrorCodes.VAL_INVALID_INPUT
): AppError {
  return new AppError(message, {
    code: errorCode,
    details: {
      validationErrors: details
    }
  });
}