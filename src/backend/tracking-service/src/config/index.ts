/**
 * Tracking Service Configuration
 * 
 * This module serves as the central point for accessing all configuration parameters 
 * needed by the tracking service components, including position tracking, ETA calculation,
 * and geofence detection. It imports and re-exports common configuration utilities
 * while adding tracking-specific configuration settings.
 */

// Import common configuration utilities and constants
import {
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT
} from '../../common/config/environment.config';

// Import database configuration utilities
import {
  getDatabaseConfig,
  getTimescaleConfig
} from '../../common/config/database.config';

// Import Redis configuration
import {
  getRedisConfig
} from '../../common/config/redis.config';

// Import Kafka configuration
import {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
} from '../../common/config/kafka.config';

// Import logger for configuration logging
import logger from '../../common/utils/logger';

// Tracking service specific configuration constants
export const TRACKING_SERVICE_PORT = getEnvNumber('TRACKING_SERVICE_PORT', 3004);

// Position tracking configuration
export const POSITION_CACHE_TTL = getEnvNumber('POSITION_CACHE_TTL', 300); // 5 minutes
export const POSITION_CACHE_PREFIX = getEnv('POSITION_CACHE_PREFIX', 'position:cache:');
export const POSITION_HISTORY_RETENTION_DAYS = getEnvNumber('POSITION_HISTORY_RETENTION_DAYS', 90);
export const SIGNIFICANT_MOVEMENT_THRESHOLD = getEnvNumber('SIGNIFICANT_MOVEMENT_THRESHOLD', 25); // in meters
export const POSITION_UPDATE_TOPIC = getEnv('POSITION_UPDATE_TOPIC', 'position-updates');

// ETA calculation configuration
export const ETA_CACHE_TTL = getEnvNumber('ETA_CACHE_TTL', 300); // 5 minutes
export const ETA_CACHE_PREFIX = getEnv('ETA_CACHE_PREFIX', 'eta:cache:');
export const ETA_DEFAULT_CONFIDENCE_THRESHOLD = getEnvNumber('ETA_DEFAULT_CONFIDENCE_THRESHOLD', 0.7);

// Geofence configuration
export const GEOFENCE_ENABLED = getEnvBoolean('GEOFENCE_ENABLED', true);
export const GEOFENCE_CACHE_TTL = getEnvNumber('GEOFENCE_CACHE_TTL', 300); // 5 minutes
export const GEOFENCE_CACHE_PREFIX = getEnv('GEOFENCE_CACHE_PREFIX', 'geofence:cache:');
export const GEOFENCE_EVENT_TOPIC = getEnv('GEOFENCE_EVENT_TOPIC', 'geofence-events');

// WebSocket configuration
export const WEBSOCKET_ENABLED = getEnvBoolean('WEBSOCKET_ENABLED', true);
export const WEBSOCKET_PATH = getEnv('WEBSOCKET_PATH', '/tracking');

/**
 * Returns the complete tracking service configuration
 * 
 * @returns Configuration object with all tracking service settings
 */
export const getTrackingConfig = () => {
  return {
    // Server settings
    port: TRACKING_SERVICE_PORT,
    
    // Position tracking settings
    position: {
      cacheTTL: POSITION_CACHE_TTL,
      cachePrefix: POSITION_CACHE_PREFIX,
      historyRetentionDays: POSITION_HISTORY_RETENTION_DAYS,
      significantMovementThreshold: SIGNIFICANT_MOVEMENT_THRESHOLD,
      updateTopic: POSITION_UPDATE_TOPIC
    },
    
    // ETA calculation settings
    eta: {
      cacheTTL: ETA_CACHE_TTL,
      cachePrefix: ETA_CACHE_PREFIX,
      defaultConfidenceThreshold: ETA_DEFAULT_CONFIDENCE_THRESHOLD
    },
    
    // Geofence settings
    geofence: {
      enabled: GEOFENCE_ENABLED,
      cacheTTL: GEOFENCE_CACHE_TTL,
      cachePrefix: GEOFENCE_CACHE_PREFIX,
      eventTopic: GEOFENCE_EVENT_TOPIC
    },
    
    // WebSocket settings
    websocket: {
      enabled: WEBSOCKET_ENABLED,
      path: WEBSOCKET_PATH
    }
  };
};

/**
 * Returns position tracking specific configuration
 * 
 * @returns Configuration object with position tracking settings
 */
export const getPositionConfig = () => {
  return {
    cacheTTL: POSITION_CACHE_TTL,
    cachePrefix: POSITION_CACHE_PREFIX,
    historyRetentionDays: POSITION_HISTORY_RETENTION_DAYS,
    significantMovementThreshold: SIGNIFICANT_MOVEMENT_THRESHOLD,
    updateTopic: POSITION_UPDATE_TOPIC
  };
};

/**
 * Returns ETA calculation specific configuration
 * 
 * @returns Configuration object with ETA calculation settings
 */
export const getETAConfig = () => {
  return {
    cacheTTL: ETA_CACHE_TTL,
    cachePrefix: ETA_CACHE_PREFIX,
    defaultConfidenceThreshold: ETA_DEFAULT_CONFIDENCE_THRESHOLD
  };
};

/**
 * Returns geofence specific configuration
 * 
 * @returns Configuration object with geofence settings
 */
export const getGeofenceConfig = () => {
  return {
    enabled: GEOFENCE_ENABLED,
    cacheTTL: GEOFENCE_CACHE_TTL,
    cachePrefix: GEOFENCE_CACHE_PREFIX,
    eventTopic: GEOFENCE_EVENT_TOPIC
  };
};

/**
 * Returns WebSocket specific configuration
 * 
 * @returns Configuration object with WebSocket settings
 */
export const getWebSocketConfig = () => {
  return {
    enabled: WEBSOCKET_ENABLED,
    path: WEBSOCKET_PATH
  };
};

/**
 * Initializes tracking service configuration and validates required settings
 */
export const initializeTrackingConfig = (): void => {
  try {
    // Load environment variables
    loadEnvConfig();
    
    // Validate required environment variables
    // We'll check a few key ones, but could add more as needed
    if (GEOFENCE_ENABLED) {
      requireEnv('GEOFENCE_EVENT_TOPIC');
    }
    
    logger.info('Tracking service configuration initialized successfully', {
      environment: NODE_ENV,
      port: TRACKING_SERVICE_PORT
    });
  } catch (error) {
    logger.error('Failed to initialize tracking service configuration', { error });
    throw error;
  }
};

// Create a pre-initialized configuration object for convenience
export const config = getTrackingConfig();

// Re-export common configuration utilities and constants
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
  getTimescaleConfig,
  
  // Redis utilities
  getRedisConfig,
  
  // Kafka utilities
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
};