/**
 * Validation Middleware Module
 * 
 * Provides request validation middleware factories for Express applications in the
 * AI-driven Freight Optimization Platform. These middlewares validate different parts
 * of HTTP requests (body, query parameters, URL parameters) against Joi schemas to
 * ensure data integrity and prevent invalid inputs from reaching service handlers.
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'; // joi@17.9.2
import { validateSchema } from '../utils/validation';
import { AppError } from '../utils/error-handler';
import { ErrorCodes } from '../constants/error-codes';
import { StatusCodes } from '../constants/status-codes';
import logger from '../utils/logger';

/**
 * Interface defining validation schemas for different request components
 */
export interface ValidationSchemas {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}

/**
 * Middleware factory that validates multiple parts of a request against provided schemas
 * 
 * @param schemas - Object containing Joi schemas for body, query, and/or params
 * @returns Express middleware function that validates request components
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body if schema provided
      if (schemas.body) {
        const bodyValidation = validateSchema(req.body, schemas.body);
        if (!bodyValidation.success) {
          return next(
            new AppError('Invalid request body', {
              code: ErrorCodes.VAL_INVALID_INPUT,
              statusCode: StatusCodes.BAD_REQUEST,
              details: bodyValidation.error
            })
          );
        }
        req.body = bodyValidation.data;
      }

      // Validate query parameters if schema provided
      if (schemas.query) {
        const queryValidation = validateSchema(req.query, schemas.query);
        if (!queryValidation.success) {
          return next(
            new AppError('Invalid query parameters', {
              code: ErrorCodes.VAL_INVALID_INPUT,
              statusCode: StatusCodes.BAD_REQUEST,
              details: queryValidation.error
            })
          );
        }
        req.query = queryValidation.data;
      }

      // Validate URL parameters if schema provided
      if (schemas.params) {
        const paramsValidation = validateSchema(req.params, schemas.params);
        if (!paramsValidation.success) {
          return next(
            new AppError('Invalid URL parameters', {
              code: ErrorCodes.VAL_INVALID_INPUT,
              statusCode: StatusCodes.BAD_REQUEST,
              details: paramsValidation.error
            })
          );
        }
        req.params = paramsValidation.data;
      }

      // All validations passed, proceed to next middleware
      next();
    } catch (error) {
      // Handle unexpected errors during validation
      logger.error('Unexpected error during request validation', { error });
      next(new AppError('Validation failed due to an internal error', {
        code: ErrorCodes.UNEX_UNEXPECTED_ERROR,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR
      }));
    }
  };
};

/**
 * Middleware factory that validates only the request body against a provided schema
 * 
 * @param schema - Joi schema to validate the request body against
 * @returns Express middleware function that validates request body
 */
export const validateBody = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validation = validateSchema(req.body, schema);
      
      if (!validation.success) {
        // Log validation error
        logger.debug('Request body validation failed', {
          path: req.path,
          body: req.body,
          errors: validation.error
        });
        
        // Return validation error
        return next(
          new AppError('Invalid request body', {
            code: ErrorCodes.VAL_INVALID_INPUT,
            statusCode: StatusCodes.BAD_REQUEST,
            details: validation.error
          })
        );
      }
      
      // Replace request body with validated data
      req.body = validation.data;
      next();
    } catch (error) {
      // Handle unexpected errors during validation
      logger.error('Unexpected error during body validation', { error });
      next(new AppError('Body validation failed due to an internal error', {
        code: ErrorCodes.UNEX_UNEXPECTED_ERROR,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR
      }));
    }
  };
};

/**
 * Middleware factory that validates only the request query parameters against a provided schema
 * 
 * @param schema - Joi schema to validate the request query parameters against
 * @returns Express middleware function that validates request query parameters
 */
export const validateQuery = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request query parameters
      const validation = validateSchema(req.query, schema);
      
      if (!validation.success) {
        // Log validation error
        logger.debug('Query parameter validation failed', {
          path: req.path,
          query: req.query,
          errors: validation.error
        });
        
        // Return validation error
        return next(
          new AppError('Invalid query parameters', {
            code: ErrorCodes.VAL_INVALID_INPUT,
            statusCode: StatusCodes.BAD_REQUEST,
            details: validation.error
          })
        );
      }
      
      // Replace request query with validated data
      req.query = validation.data;
      next();
    } catch (error) {
      // Handle unexpected errors during validation
      logger.error('Unexpected error during query validation', { error });
      next(new AppError('Query validation failed due to an internal error', {
        code: ErrorCodes.UNEX_UNEXPECTED_ERROR,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR
      }));
    }
  };
};

/**
 * Middleware factory that validates only the request URL parameters against a provided schema
 * 
 * @param schema - Joi schema to validate the request URL parameters against
 * @returns Express middleware function that validates request URL parameters
 */
export const validateParams = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request URL parameters
      const validation = validateSchema(req.params, schema);
      
      if (!validation.success) {
        // Log validation error
        logger.debug('URL parameter validation failed', {
          path: req.path,
          params: req.params,
          errors: validation.error
        });
        
        // Return validation error
        return next(
          new AppError('Invalid URL parameters', {
            code: ErrorCodes.VAL_INVALID_INPUT,
            statusCode: StatusCodes.BAD_REQUEST,
            details: validation.error
          })
        );
      }
      
      // Replace request params with validated data
      req.params = validation.data;
      next();
    } catch (error) {
      // Handle unexpected errors during validation
      logger.error('Unexpected error during URL parameter validation', { error });
      next(new AppError('Parameter validation failed due to an internal error', {
        code: ErrorCodes.UNEX_UNEXPECTED_ERROR,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR
      }));
    }
  };
};