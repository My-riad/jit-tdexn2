/**
 * Driver Service Configuration Module
 * 
 * This module provides configuration settings specific to driver management,
 * HOS tracking, and ELD integrations. It extends the common configuration
 * with driver-specific settings and provides utilities for accessing ELD
 * provider configurations.
 */

import dotenv from 'dotenv'; // dotenv@16.0.3
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
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
} from '../../../common/config/kafka.config';
import {
  getRedisConfig,
  getDefaultRedisClient
} from '../../../common/config/redis.config';
import logger from '../../../common/utils/logger';

// Driver service specific constants
export const SERVICE_NAME = 'driver-service';
export const DEFAULT_PORT = 3002;
export const DEFAULT_HOST = '0.0.0.0';
export const API_VERSION = 'v1';

// HOS (Hours of Service) default configuration constants
// Based on FMCSA regulations
export const DEFAULT_HOS_DRIVING_LIMIT_MINUTES = 660; // 11 hours
export const DEFAULT_HOS_DUTY_LIMIT_MINUTES = 840; // 14 hours
export const DEFAULT_HOS_CYCLE_LIMIT_MINUTES = 3600; // 60 hours/7 days or 70 hours/8 days

/**
 * Interface for ELD provider configuration
 */
export interface EldProviderConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  timeout: number;
}

/**
 * Retrieves the configuration for the Driver Service
 * 
 * @returns Driver service configuration object
 */
export const getDriverServiceConfig = () => {
  return {
    serviceName: SERVICE_NAME,
    port: getEnvNumber('DRIVER_SERVICE_PORT', DEFAULT_PORT),
    host: getEnv('DRIVER_SERVICE_HOST', DEFAULT_HOST),
    apiVersion: getEnv('DRIVER_SERVICE_API_VERSION', API_VERSION),
    databaseSchema: getEnv('DRIVER_SERVICE_DB_SCHEMA', 'driver'),
    corsOrigins: getEnv('DRIVER_SERVICE_CORS_ORIGINS', '*'),
    logLevel: getEnv('DRIVER_SERVICE_LOG_LEVEL', 'info'),
    apiRateLimit: {
      windowMs: getEnvNumber('DRIVER_SERVICE_RATE_LIMIT_WINDOW_MS', 60 * 1000), // 1 minute
      max: getEnvNumber('DRIVER_SERVICE_RATE_LIMIT_MAX', 100) // 100 requests per minute
    },
    auth: {
      jwtSecret: getEnv('DRIVER_SERVICE_JWT_SECRET', 'development-secret-key'),
      jwtExpiresIn: getEnv('DRIVER_SERVICE_JWT_EXPIRES_IN', '1d'),
      tokenIssuer: getEnv('DRIVER_SERVICE_TOKEN_ISSUER', 'freight-optimization-platform')
    },
    kafka: {
      topicPrefix: getEnv('DRIVER_SERVICE_KAFKA_TOPIC_PREFIX', 'driver-'),
      consumerGroupId: getEnv('DRIVER_SERVICE_KAFKA_CONSUMER_GROUP', 'driver-service-group'),
      topics: {
        driverLocation: getEnv('DRIVER_SERVICE_TOPIC_DRIVER_LOCATION', 'driver-location'),
        driverStatus: getEnv('DRIVER_SERVICE_TOPIC_DRIVER_STATUS', 'driver-status'),
        driverHos: getEnv('DRIVER_SERVICE_TOPIC_DRIVER_HOS', 'driver-hos'),
        driverEvents: getEnv('DRIVER_SERVICE_TOPIC_DRIVER_EVENTS', 'driver-events')
      }
    },
    eldIntegration: {
      enabled: getEnvBoolean('DRIVER_SERVICE_ELD_INTEGRATION_ENABLED', true),
      syncIntervalMinutes: getEnvNumber('DRIVER_SERVICE_ELD_SYNC_INTERVAL_MINUTES', 15),
      retryFailedSyncMinutes: getEnvNumber('DRIVER_SERVICE_ELD_RETRY_INTERVAL_MINUTES', 5),
      providers: getEnv('DRIVER_SERVICE_ELD_PROVIDERS', 'keeptruckin,omnitracs,samsara')
        .split(',')
        .map(provider => provider.trim())
    }
  };
};

/**
 * Retrieves the configuration for a specific ELD provider
 * 
 * @param providerName - Name of the ELD provider
 * @returns Configuration for the specified ELD provider
 */
export const getEldProviderConfig = (providerName: string): EldProviderConfig => {
  const provider = providerName.toLowerCase();

  switch (provider) {
    case 'keeptruckin':
      return {
        apiKey: requireEnv('ELD_KEEPTRUCKIN_API_KEY'),
        apiSecret: requireEnv('ELD_KEEPTRUCKIN_API_SECRET'),
        baseUrl: getEnv('ELD_KEEPTRUCKIN_BASE_URL', 'https://api.keeptruckin.com/v1'),
        timeout: getEnvNumber('ELD_KEEPTRUCKIN_TIMEOUT', 30000)
      };

    case 'omnitracs':
      return {
        apiKey: requireEnv('ELD_OMNITRACS_API_KEY'),
        apiSecret: requireEnv('ELD_OMNITRACS_API_SECRET'),
        baseUrl: getEnv('ELD_OMNITRACS_BASE_URL', 'https://api.omnitracs.com/v1'),
        timeout: getEnvNumber('ELD_OMNITRACS_TIMEOUT', 30000)
      };

    case 'samsara':
      return {
        apiKey: requireEnv('ELD_SAMSARA_API_KEY'),
        apiSecret: requireEnv('ELD_SAMSARA_API_SECRET'),
        baseUrl: getEnv('ELD_SAMSARA_BASE_URL', 'https://api.samsara.com/v1'),
        timeout: getEnvNumber('ELD_SAMSARA_TIMEOUT', 30000)
      };

    default:
      throw new Error(`Unsupported ELD provider: ${providerName}`);
  }
};

/**
 * Retrieves the configuration for Hours of Service tracking
 * 
 * @returns HOS configuration object
 */
export const getHosConfig = () => {
  return {
    drivingLimitMinutes: getEnvNumber(
      'HOS_DRIVING_LIMIT_MINUTES',
      DEFAULT_HOS_DRIVING_LIMIT_MINUTES
    ),
    dutyLimitMinutes: getEnvNumber(
      'HOS_DUTY_LIMIT_MINUTES',
      DEFAULT_HOS_DUTY_LIMIT_MINUTES
    ),
    cycleLimitMinutes: getEnvNumber(
      'HOS_CYCLE_LIMIT_MINUTES',
      DEFAULT_HOS_CYCLE_LIMIT_MINUTES
    ),
    cycleType: getEnv('HOS_CYCLE_TYPE', '7day'), // '7day' or '8day'
    breakRequiredMinutes: getEnvNumber('HOS_BREAK_REQUIRED_MINUTES', 30),
    breakAfterDrivingMinutes: getEnvNumber('HOS_BREAK_AFTER_DRIVING_MINUTES', 480), // 8 hours
    restartRequiredHours: getEnvNumber('HOS_RESTART_REQUIRED_HOURS', 34),
    splitSleeper: getEnvBoolean('HOS_SPLIT_SLEEPER_ENABLED', true),
    personalConveyance: getEnvBoolean('HOS_PERSONAL_CONVEYANCE_ENABLED', true),
    yardMoves: getEnvBoolean('HOS_YARD_MOVES_ENABLED', true),
    adverseDriving: getEnvBoolean('HOS_ADVERSE_DRIVING_ENABLED', true),
    adverseDrivingExtensionMinutes: getEnvNumber('HOS_ADVERSE_DRIVING_EXTENSION_MINUTES', 120), // 2 hours
    enforcementLevel: getEnv('HOS_ENFORCEMENT_LEVEL', 'strict') // 'strict', 'moderate', or 'warning'
  };
};

/**
 * Initializes all configuration for the Driver Service
 */
export const initializeDriverServiceConfig = (): void => {
  try {
    // Load environment variables
    loadEnvConfig();

    // Initialize database connection
    const dbConfig = getDatabaseConfig();
    createKnexInstance(dbConfig);

    // Initialize Kafka producers and consumers if needed
    // This would typically be done in the service initialization,
    // but configuration can be set up in advance

    // Initialize Redis client if needed
    // This would typically be done in the service initialization

    logger.info(`${SERVICE_NAME} configuration initialized successfully`);
  } catch (error) {
    logger.error(`Failed to initialize ${SERVICE_NAME} configuration`, { error });
    throw error;
  }
};

// Re-export common configuration utilities
export {
  // Environment configuration
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION,
  
  // Database configuration
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance,
  
  // Kafka configuration
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig,
  
  // Redis configuration
  getRedisConfig,
  getDefaultRedisClient
};