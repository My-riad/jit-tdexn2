/**
 * Data Service Configuration Module
 * 
 * This module provides centralized configuration for the Data Service component,
 * including settings for analytics databases, caching strategies, and export
 * configurations. It extends the common configuration modules with
 * data-service specific settings and utilities.
 */

import { Knex } from 'knex';
import * as redis from 'redis';
import {
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION
} from '../../../common/config/environment.config';

import {
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance
} from '../../../common/config/database.config';

import {
  getRedisConfig,
  getDefaultRedisClient
} from '../../../common/config/redis.config';

import {
  createS3Client,
  uploadToS3,
  downloadFromS3
} from '../../../common/config/aws.config';

import logger from '../../../common/utils/logger';

// Cache singleton instances
let dataWarehouseConnection: Knex | null = null;
let analyticsCacheClient: redis.RedisClientType | null = null;

/**
 * Default cache TTL for analytics queries in seconds
 */
export const ANALYTICS_CACHE_TTL = getEnvNumber('ANALYTICS_CACHE_TTL', 3600); // 1 hour default

/**
 * Maximum number of rows allowed for data exports
 */
export const MAX_EXPORT_ROWS = getEnvNumber('MAX_EXPORT_ROWS', 100000);

/**
 * Configuration for data warehouse connection
 */
export const DATA_WAREHOUSE_CONFIG = {
  client: 'pg',
  connection: {
    host: getEnv('DATA_WAREHOUSE_HOST', getEnv('DB_HOST', 'localhost')),
    port: getEnvNumber('DATA_WAREHOUSE_PORT', getEnvNumber('DB_PORT', 5432)),
    user: getEnv('DATA_WAREHOUSE_USER', getEnv('DB_USER', 'postgres')),
    password: getEnv('DATA_WAREHOUSE_PASSWORD', getEnv('DB_PASSWORD', '')),
    database: getEnv('DATA_WAREHOUSE_NAME', `${getEnv('DB_NAME', 'freight_optimization')}_analytics`),
    ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: getEnvNumber('DATA_WAREHOUSE_POOL_MIN', 2),
    max: getEnvNumber('DATA_WAREHOUSE_POOL_MAX', 10),
    idleTimeoutMillis: getEnvNumber('DATA_WAREHOUSE_IDLE_TIMEOUT', 30000),
    acquireTimeoutMillis: getEnvNumber('DATA_WAREHOUSE_ACQUIRE_TIMEOUT', 60000)
  },
  debug: !IS_PRODUCTION && getEnvBoolean('DATA_WAREHOUSE_DEBUG', false)
};

/**
 * Supported export formats
 */
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'xlsx',
  PDF: 'pdf'
};

/**
 * Creates or retrieves a connection to the data warehouse for analytics queries
 * 
 * @returns Knex instance connected to the data warehouse
 */
export const getDataWarehouseConnection = async (): Promise<Knex> => {
  if (dataWarehouseConnection) {
    return dataWarehouseConnection;
  }

  try {
    dataWarehouseConnection = createKnexInstance(DATA_WAREHOUSE_CONFIG);
    
    // Test the connection
    await dataWarehouseConnection.raw('SELECT 1');
    logger.info('Data warehouse connection established successfully');
    
    return dataWarehouseConnection;
  } catch (error) {
    logger.error('Failed to establish data warehouse connection', { error });
    throw error;
  }
};

/**
 * Creates or retrieves a Redis client for caching analytics query results
 * 
 * @returns Redis client for analytics caching
 */
export const getAnalyticsCacheClient = async (): Promise<redis.RedisClientType | null> => {
  if (analyticsCacheClient) {
    return analyticsCacheClient;
  }

  try {
    // Use caching only if enabled
    const cacheEnabled = getEnvBoolean('ANALYTICS_CACHE_ENABLED', true);
    if (!cacheEnabled) {
      logger.info('Analytics caching is disabled');
      return null;
    }

    // Get Redis configuration with analytics-specific overrides
    const redisConfig = getRedisConfig();
    const redisHost = getEnv('ANALYTICS_REDIS_HOST', redisConfig.host);
    const redisPort = getEnvNumber('ANALYTICS_REDIS_PORT', redisConfig.port);
    const redisDb = getEnvNumber('ANALYTICS_REDIS_DB', 1); // Use a different DB for analytics

    // Create Redis client for analytics
    analyticsCacheClient = getDefaultRedisClient('analytics');
    
    // Connect and test
    await analyticsCacheClient.connect();
    logger.info('Analytics cache client connected successfully', { 
      host: redisHost, 
      port: redisPort, 
      db: redisDb 
    });
    
    return analyticsCacheClient;
  } catch (error) {
    logger.error('Failed to establish analytics cache connection', { error });
    // Return null instead of throwing to make caching optional
    // The service can continue to work without caching
    return null;
  }
};

/**
 * Retrieves configuration for data export storage
 * 
 * @returns Configuration object for export storage
 */
export const getExportStorageConfig = (): object => {
  const storageType = getEnv('EXPORT_STORAGE_TYPE', 'S3').toUpperCase();
  
  if (storageType === 'S3') {
    return {
      type: 'S3',
      bucket: requireEnv('EXPORT_S3_BUCKET'),
      pathPrefix: getEnv('EXPORT_S3_PATH_PREFIX', 'exports/'),
      region: getEnv('AWS_REGION', 'us-east-1'),
      expiration: getEnvNumber('EXPORT_URL_EXPIRATION', 86400) // 24 hours default
    };
  } else if (storageType === 'LOCAL') {
    return {
      type: 'LOCAL',
      path: getEnv('EXPORT_LOCAL_PATH', './exports'),
      baseUrl: getEnv('EXPORT_BASE_URL', ''),
      retention: getEnvNumber('EXPORT_RETENTION_DAYS', 30) // 30 days default
    };
  } else {
    throw new Error(`Unsupported export storage type: ${storageType}`);
  }
};

/**
 * Initializes all configuration for the data service
 * 
 * @returns Promise that resolves when initialization is complete
 */
export const initializeDataServiceConfig = async (): Promise<void> => {
  try {
    // Load environment variables
    loadEnvConfig();
    
    // Initialize data warehouse connection
    await getDataWarehouseConnection();
    
    // Initialize analytics cache if enabled
    if (getEnvBoolean('ANALYTICS_CACHE_ENABLED', true)) {
      await getAnalyticsCacheClient();
    }
    
    // Initialize export storage configuration
    getExportStorageConfig();
    
    logger.info('Data service configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize data service configuration', { error });
    throw error;
  }
};

// Re-export common configuration utilities
export {
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION
};