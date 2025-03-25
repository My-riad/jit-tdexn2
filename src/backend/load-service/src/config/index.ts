/**
 * Load Service Configuration
 * 
 * This module centralizes all configuration needed for the Load Service, including
 * service-specific constants, database settings, and integration configurations.
 * It exports service-specific settings and re-exports common configuration utilities.
 */

import {
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT
} from '../../../common/config/environment.config';

import {
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance
} from '../../../common/config/database.config';

import {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
} from '../../../common/config/kafka.config';

import {
  configureAWS,
  createS3Client
} from '../../../common/config/aws.config';

import logger from '../../../common/utils/logger';

// Service-specific constants
export const SERVICE_NAME = 'load-service';
export const PORT = getEnvNumber('LOAD_SERVICE_PORT', 3002);

// Document storage configuration
export const DOCUMENT_STORAGE_BUCKET = getEnv('DOCUMENT_STORAGE_BUCKET', 'freight-platform-documents');
export const DOCUMENT_STORAGE_PATH = getEnv('DOCUMENT_STORAGE_PATH', 'loads');
export const MAX_DOCUMENT_SIZE_MB = getEnvNumber('MAX_DOCUMENT_SIZE_MB', 10);
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// TMS Integration configuration
export const ENABLE_TMS_INTEGRATION = getEnvBoolean('ENABLE_TMS_INTEGRATION', false);
export const TMS_SYNC_INTERVAL = getEnvNumber('TMS_SYNC_INTERVAL', 15 * 60 * 1000); // 15 minutes in milliseconds
export const TMS_PROVIDERS = {
  MCLEOD: 'mcleod',
  TMW: 'tmw',
  MERCURYGATE: 'mercurygate'
};

// Kafka topics configuration
export const LOAD_EVENTS_TOPIC = getEnv('LOAD_EVENTS_TOPIC', 'load-events');
export const ASSIGNMENT_EVENTS_TOPIC = getEnv('ASSIGNMENT_EVENTS_TOPIC', 'assignment-events');
export const LOAD_CONSUMER_GROUP = getEnv('LOAD_CONSUMER_GROUP', 'load-service-group');

/**
 * Initializes all configurations required for the Load Service
 * 
 * @returns Promise that resolves when all configurations are initialized
 */
export const initializeConfigurations = async (): Promise<void> => {
  try {
    // Load environment variables
    loadEnvConfig();
    
    // Configure AWS services
    configureAWS();
    
    // Initialize database connection
    const dbConfig = getDatabaseConfig();
    createKnexInstance(dbConfig);
    
    logger.info(`${SERVICE_NAME} configurations initialized successfully`, {
      environment: NODE_ENV,
      tmsIntegration: ENABLE_TMS_INTEGRATION
    });
  } catch (error) {
    logger.error(`Failed to initialize ${SERVICE_NAME} configurations`, { error });
    throw error;
  }
};

/**
 * Creates and returns an S3 client for document storage operations
 * 
 * @returns Configured S3 client instance
 */
export const getS3DocumentClient = () => {
  return createS3Client();
};

/**
 * Returns the configuration for a specific TMS provider
 * 
 * @param providerType - The TMS provider type (mcleod, tmw, mercurygate)
 * @returns TMS provider configuration object
 */
export const getTmsConfig = (providerType: string) => {
  // Validate provider type
  if (!Object.values(TMS_PROVIDERS).includes(providerType)) {
    throw new Error(`Unsupported TMS provider: ${providerType}`);
  }
  
  // Get provider-specific configuration
  const baseUrl = getEnv(`TMS_${providerType.toUpperCase()}_BASE_URL`, '');
  const apiKey = getEnv(`TMS_${providerType.toUpperCase()}_API_KEY`, '');
  const apiSecret = getEnv(`TMS_${providerType.toUpperCase()}_API_SECRET`, '');
  const username = getEnv(`TMS_${providerType.toUpperCase()}_USERNAME`, '');
  const password = getEnv(`TMS_${providerType.toUpperCase()}_PASSWORD`, '');
  
  return {
    providerType,
    baseUrl,
    credentials: {
      apiKey,
      apiSecret,
      username,
      password
    },
    options: {
      timeout: getEnvNumber(`TMS_${providerType.toUpperCase()}_TIMEOUT`, 30000), // 30 seconds
      retryCount: getEnvNumber(`TMS_${providerType.toUpperCase()}_RETRY_COUNT`, 3)
    }
  };
};

// Re-export common configuration utilities
export {
  // Environment utilities
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  
  // Database utilities
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance,
  
  // Kafka utilities
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
};