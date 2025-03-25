/**
 * Request Validation Middleware
 * 
 * This module provides Express middleware for validating incoming API requests
 * against OpenAPI/Swagger schema definitions. It ensures all requests to the 
 * API Gateway conform to the defined API contracts, providing early validation
 * and consistent error responses for invalid requests.
 */

import { Request, Response, NextFunction } from 'express';
import * as OpenApiValidator from 'express-openapi-validator'; // express-openapi-validator@5.0.1
import Joi from 'joi'; // joi@17.9.2

import { AppError } from '../../../common/utils/error-handler';
import { validateSchema, createValidationError } from '../../../common/utils/validation';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';
import { getSwaggerDocument } from '../config/swagger';

/**
 * Enum defining the types of request data that can be validated
 */
export enum ValidationType {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params'
}

/**
 * Express middleware that validates incoming requests against OpenAPI schema definitions.
 * 
 * @returns Express middleware function
 */
export function requestValidator() {
  try {
    // Get the Swagger document from configuration
    const swaggerDocument = getSwaggerDocument();
    
    logger.debug('Initializing OpenAPI request validator');
    
    // Configure OpenAPI validator with the Swagger document
    const middleware = OpenApiValidator.middleware({
      apiSpec: swaggerDocument,
      validateRequests: true,
      validateResponses: false,
      validateSecurity: false,
      ignoreUndocumented: true,
      validateFormats: true,
      operationHandlers: false,
      validateApiSpec: false,
    });

    // Return middleware that validates requests against the OpenAPI schema
    return (req: Request, res: Response, next: NextFunction) => {
      // Apply the OpenAPI validator middleware
      middleware(req, res, (err: any) => {
        if (err) {
          // Handle validation errors
          const validationError = handleValidationError(err);
          return next(validationError);
        }
        next();
      });
    };
  } catch (error) {
    // Log error and return a middleware that passes requests through if setup fails
    logger.error('Failed to set up request validator middleware', { error });
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
}

/**
 * Validates a request body, query parameters, or path parameters against a Joi schema.
 * 
 * @param schema - Joi schema to validate against
 * @param type - Part of the request to validate (body, query, params)
 * @returns Express middleware function
 */
export function validateRequest(schema: Joi.Schema, type: ValidationType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract data based on validation type
      const dataToValidate = req[type];
      
      // Validate data against the provided schema
      const validationResult = validateSchema(dataToValidate, schema);
      
      if (!validationResult.success) {
        // If validation fails, create a standardized validation error
        const errorDetails = validationResult.error?.details || [];
        const errorMessage = validationResult.error?.message || 'Validation failed';
        const errorCode = validationResult.error?.code || ErrorCodes.VAL_INVALID_INPUT;
        
        logger.debug(`Request ${type} validation failed`, { 
          path: req.path,
          type,
          errors: errorDetails
        });
        
        // Return validation error
        throw createValidationError(errorMessage, errorDetails, errorCode);
      }
      
      // Replace the original data with validated data (this also removes any extra fields)
      req[type] = validationResult.data;
      
      // Proceed to next middleware
      next();
    } catch (error) {
      // Pass any errors to error handling middleware
      next(error);
    }
  };
}

/**
 * Converts OpenAPI validation errors to standardized AppError format.
 * 
 * @param err - Error from OpenAPI validator
 * @returns Standardized validation error
 */
function handleValidationError(err: Error): AppError {
  logger.debug('OpenAPI validation error', { error: err });
  
  // Extract error details from the OpenAPI validation error
  const error = err as any;
  const path = error.path || '';
  const errorDetails = [];
  
  // Determine the appropriate error code based on error type
  let errorCode = ErrorCodes.VAL_INVALID_INPUT;
  
  // Handle route not found errors
  if (error.status === 404) {
    return new AppError(`Resource not found: ${path}`, {
      statusCode: StatusCodes.NOT_FOUND,
      code: 'RES_ROUTE_NOT_FOUND',
      details: { path }
    });
  }
  
  // Handle method not allowed errors
  if (error.status === 405) {
    return new AppError(`Method not allowed: ${error.message}`, {
      statusCode: StatusCodes.METHOD_NOT_ALLOWED,
      code: 'VAL_METHOD_NOT_ALLOWED',
      details: { path, method: error.method }
    });
  }
  
  // Process validation errors
  if (error.errors && Array.isArray(error.errors)) {
    // Process each validation error
    for (const validationError of error.errors) {
      const errorPath = validationError.path || '';
      const errorMessage = validationError.message || 'Validation error';
      const errorType = validationError.errorCode || 'invalid_request';
      
      // Determine specific error code based on the error message
      let specificErrorCode = errorCode;
      
      if (errorMessage.toLowerCase().includes('required')) {
        specificErrorCode = ErrorCodes.VAL_MISSING_FIELD;
      } else if (
        errorMessage.toLowerCase().includes('format') || 
        errorMessage.toLowerCase().includes('pattern') ||
        errorMessage.toLowerCase().includes('type')
      ) {
        specificErrorCode = ErrorCodes.VAL_INVALID_FORMAT;
      } else if (
        errorMessage.toLowerCase().includes('minimum') ||
        errorMessage.toLowerCase().includes('maximum') ||
        errorMessage.toLowerCase().includes('minlength') ||
        errorMessage.toLowerCase().includes('maxlength') ||
        errorMessage.toLowerCase().includes('enum')
      ) {
        specificErrorCode = ErrorCodes.VAL_CONSTRAINT_VIOLATION;
      }
      
      // Add detailed error information
      errorDetails.push({
        path: errorPath.split('.'),
        message: errorMessage,
        type: errorType,
        context: validationError.params
      });
      
      // Update the overall error code to the most specific one found
      if (specificErrorCode !== ErrorCodes.VAL_INVALID_INPUT) {
        errorCode = specificErrorCode;
      }
    }
  } else {
    // Handle case where errors array is not present
    errorDetails.push({
      path: path.split('.'),
      message: error.message || 'Invalid request',
      type: 'invalid_request'
    });
  }
  
  // If no details were added, use the error message
  if (errorDetails.length === 0) {
    errorDetails.push({
      path: [],
      message: error.message || 'Invalid request',
      type: 'invalid_request'
    });
  }
  
  // Create a standardized validation error with detailed information
  return createValidationError(
    'Request validation failed',
    errorDetails,
    errorCode
  );
}