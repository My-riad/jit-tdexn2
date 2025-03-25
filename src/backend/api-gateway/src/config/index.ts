/**
 * API Gateway Configuration Module
 * 
 * Central configuration file for the API Gateway that exports all configuration
 * components needed for the gateway's operation. This file serves as the main
 * entry point for accessing service registry, Swagger documentation setup, and
 * other configuration utilities specific to the API Gateway.
 */

// Import service registry functionality for service discovery and routing
import { ServiceRegistry, SERVICES, Service, ServiceInstance } from './service-registry';

// Import Swagger configuration for API documentation
import { setupSwagger, getSwaggerDocument } from './swagger';

// Import logging utility for configuration operations
import logger from '../../common/utils/logger';

// Import environment configuration utilities
import {
  getEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT
} from '../../common/config/environment.config';

/**
 * API Gateway configuration with environment-specific settings
 */
export const API_GATEWAY_CONFIG = {
  port: getEnvNumber('API_GATEWAY_PORT', 3000),
  host: getEnv('API_GATEWAY_HOST', '0.0.0.0'),
  basePath: getEnv('API_GATEWAY_BASE_PATH', '/api/v1'),
  enableSwagger: getEnvBoolean('ENABLE_SWAGGER', true),
  enableCors: getEnvBoolean('ENABLE_CORS', true),
  corsOrigin: getEnv('CORS_ORIGIN', '*'),
  rateLimitWindow: getEnvNumber('RATE_LIMIT_WINDOW', 15 * 60 * 1000), // 15 minutes in milliseconds
  rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 100), // 100 requests per window
  bodyLimit: getEnv('BODY_LIMIT', '1mb'),
  logLevel: getEnv('LOG_LEVEL', 'info')
};

/**
 * Initializes all configuration components for the API Gateway
 * 
 * @returns Promise that resolves when initialization is complete
 */
export const initializeConfig = async (): Promise<void> => {
  logger.info('Initializing API Gateway configuration...');
  
  try {
    // Initialize service registry
    await ServiceRegistry.initializeServiceRegistry();
    
    logger.info('API Gateway configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize API Gateway configuration', { error });
    throw error;
  }
};

/**
 * Returns the current API Gateway configuration based on environment
 * 
 * @returns API Gateway configuration object
 */
export const getApiGatewayConfig = (): typeof API_GATEWAY_CONFIG => {
  return API_GATEWAY_CONFIG;
};

// Re-export service registry components
export { ServiceRegistry, SERVICES, Service, ServiceInstance };

// Re-export Swagger configuration components
export { setupSwagger, getSwaggerDocument };