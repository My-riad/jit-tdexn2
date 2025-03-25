/**
 * Swagger Configuration Module
 * 
 * This module provides functions to set up and configure Swagger UI for API documentation,
 * load the appropriate Swagger JSON definition based on environment, and integrate it
 * with the Express application.
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express'; // swagger-ui-express@4.6.2
import * as fs from 'fs';
import * as path from 'path';
import { getEnv, IS_PRODUCTION } from '../../common/config/environment.config';
import logger from '../../common/utils/logger';

/**
 * Default options for Swagger UI configuration
 */
const SWAGGER_OPTIONS = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    tryItOutEnabled: true
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI-driven Freight Optimization Platform API Documentation'
};

/**
 * Sets up Swagger UI for API documentation in the Express application
 * 
 * @param app - Express application instance
 */
export const setupSwagger = (app: express.Application): void => {
  try {
    // Get the swagger document based on current environment
    const swaggerDocument = getSwaggerDocument();
    
    // Set up Swagger UI middleware with the document and options
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, SWAGGER_OPTIONS)
    );
    
    // Also serve the raw swagger JSON at a dedicated endpoint
    app.get('/api-docs.json', (req, res) => {
      res.json(swaggerDocument);
    });
    
    logger.info('Swagger documentation setup successfully', {
      endpoint: '/api-docs',
      jsonEndpoint: '/api-docs.json'
    });
  } catch (error) {
    logger.error('Failed to set up Swagger documentation', { error });
    // Don't throw here - we want the application to start even if Swagger setup fails
  }
};

/**
 * Loads and returns the appropriate Swagger JSON document based on environment
 * 
 * @returns Parsed Swagger JSON document
 */
export const getSwaggerDocument = (): Record<string, any> => {
  try {
    // Get the swagger file path based on environment
    const swaggerFilePath = getSwaggerFilePath();
    
    // Read and parse the swagger JSON file
    const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8');
    const swaggerDocument = JSON.parse(swaggerContent);
    
    // Apply any environment-specific modifications
    return modifySwaggerForEnvironment(swaggerDocument);
  } catch (error) {
    logger.error('Failed to load Swagger document', { error });
    // Return a minimal valid swagger document as fallback
    return {
      openapi: '3.0.0',
      info: {
        title: 'AI-driven Freight Optimization Platform API',
        version: '1.0.0',
        description: 'API documentation unavailable'
      },
      paths: {}
    };
  }
};

/**
 * Determines the appropriate Swagger file path based on current environment
 * 
 * @returns Path to the Swagger JSON file
 */
const getSwaggerFilePath = (): string => {
  // Define the base directory where swagger files are stored
  const baseDir = path.resolve(__dirname, '../../../docs/swagger');
  
  // Determine which file to use based on environment
  let fileName = 'swagger.json';
  
  if (IS_PRODUCTION) {
    fileName = 'swagger-production.json';
  } else if (process.env.NODE_ENV === 'staging') {
    fileName = 'swagger-staging.json';
  } else if (process.env.NODE_ENV === 'development') {
    fileName = 'swagger-development.json';
  }
  
  // Resolve the full path
  const filePath = path.join(baseDir, fileName);
  
  // Log which file we're using
  logger.info(`Using Swagger definition from: ${filePath}`, {
    environment: process.env.NODE_ENV || 'development'
  });
  
  return filePath;
};

/**
 * Modifies the Swagger document with environment-specific settings
 * 
 * @param swaggerDocument - The parsed Swagger document
 * @returns Modified Swagger document
 */
const modifySwaggerForEnvironment = (swaggerDocument: Record<string, any>): Record<string, any> => {
  // Create a copy of the document to avoid modifying the original
  const modifiedDocument = { ...swaggerDocument };
  
  // Get the base URL for the API from environment configuration
  const apiBaseUrl = getEnv('API_BASE_URL', 'http://localhost:3000');
  
  // Update the servers array in the Swagger document
  modifiedDocument.servers = [
    {
      url: apiBaseUrl,
      description: `${process.env.NODE_ENV || 'development'} server`
    }
  ];
  
  // For production, ensure security definitions are properly configured
  if (IS_PRODUCTION) {
    // Ensure all endpoints use HTTPS in production
    modifiedDocument.schemes = ['https'];
    
    // Additional production-specific modifications can be added here
  }
  
  return modifiedDocument;
};