/**
 * Configuration Module for Load Matching Service
 * 
 * This module serves as the central configuration hub for the Load Matching Service,
 * importing and re-exporting common configuration utilities while adding
 * service-specific configuration settings.
 */

// Import common configuration utilities
import {
  loadEnvConfig,
  getEnv,
  requireEnv,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST
} from '../../../common/config/environment.config';

// Import database configuration utilities
import {
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance,
  validateDatabaseConnection
} from '../../../common/config/database.config';

// Import Kafka messaging configuration utilities
import {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
} from '../../../common/config/kafka.config';

// Import Redis caching configuration utilities
import {
  getRedisConfig,
  getDefaultRedisClient
} from '../../../common/config/redis.config';

// Import logging utility
import logger from '../../../common/utils/logger';

// Import mongoose for MongoDB ODM
import mongoose from 'mongoose'; // mongoose@6.0.0

// Service-specific configuration constants
export const RECOMMENDATION_EXPIRATION_HOURS = 24; // Default: 24 hours
export const RESERVATION_EXPIRATION_MINUTES = 15; // Default: 15 minutes
export const MAX_RECOMMENDATIONS_PER_DRIVER = 10; // Default: 10 recommendations

// Weight factors for calculating load match efficiency scores
export const SCORE_CALCULATION_WEIGHTS = {
  emptyMilesReduction: 0.30, // 30%
  networkContribution: 0.25, // 25%
  onTimePerformance: 0.20,   // 20%
  smartHubUtilization: 0.15, // 15%
  fuelEfficiency: 0.10       // 10%
};

/**
 * Initializes all configuration modules and ensures proper setup of the load matching service environment
 * 
 * @returns Promise resolving when configuration is initialized
 */
export const initializeConfig = async (): Promise<void> => {
  try {
    // Load environment variables
    loadEnvConfig();
    
    // Validate required environment variables for the load matching service
    requireEnv('MONGODB_URI');
    
    // Configure MongoDB connection
    const mongoConfig = getMongoDBConfig();
    
    try {
      await mongoose.connect(mongoConfig.uri, mongoConfig.options);
      logger.info('MongoDB connection established successfully');
    } catch (dbError) {
      logger.error('Failed to connect to MongoDB', { error: dbError });
      throw dbError;
    }
    
    // Initialize Redis client for caching load recommendations
    try {
      const redisClient = getDefaultRedisClient('load-matching-service');
      // Ping Redis to verify connection
      const pingResponse = await redisClient.ping();
      logger.info('Redis client initialized and connected successfully', { pingResponse });
    } catch (redisError) {
      logger.error('Failed to initialize Redis client', { error: redisError });
      throw redisError;
    }
    
    // Log successful initialization
    logger.info('Load matching service configuration initialized successfully', {
      environment: NODE_ENV
    });
  } catch (error) {
    logger.error('Failed to initialize load matching service configuration', { error });
    throw error;
  }
};

/**
 * Retrieves MongoDB connection configuration for the load matching service
 * 
 * @returns MongoDB connection configuration object
 */
export const getMongoDBConfig = () => {
  const uri = requireEnv('MONGODB_URI');
  
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: IS_PRODUCTION ? false : true, // Disable automatic index creation in production
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  };
  
  return { uri, options };
};

/**
 * Retrieves load matching service specific configuration settings
 * 
 * @returns Load matching service configuration object
 */
export const getMatchingServiceConfig = () => {
  // Get recommendation expiration time from environment variables or use default
  const recommendationExpirationHours = parseInt(
    getEnv('RECOMMENDATION_EXPIRATION_HOURS', RECOMMENDATION_EXPIRATION_HOURS.toString())
  );
  
  // Get reservation expiration time from environment variables or use default
  const reservationExpirationMinutes = parseInt(
    getEnv('RESERVATION_EXPIRATION_MINUTES', RESERVATION_EXPIRATION_MINUTES.toString())
  );
  
  // Get maximum recommendations per driver from environment variables or use default
  const maxRecommendationsPerDriver = parseInt(
    getEnv('MAX_RECOMMENDATIONS_PER_DRIVER', MAX_RECOMMENDATIONS_PER_DRIVER.toString())
  );
  
  // Get score calculation weights from environment variables or use default
  const scoreCalculationWeights = {
    emptyMilesReduction: parseFloat(
      getEnv('SCORE_WEIGHT_EMPTY_MILES', SCORE_CALCULATION_WEIGHTS.emptyMilesReduction.toString())
    ),
    networkContribution: parseFloat(
      getEnv('SCORE_WEIGHT_NETWORK', SCORE_CALCULATION_WEIGHTS.networkContribution.toString())
    ),
    onTimePerformance: parseFloat(
      getEnv('SCORE_WEIGHT_ON_TIME', SCORE_CALCULATION_WEIGHTS.onTimePerformance.toString())
    ),
    smartHubUtilization: parseFloat(
      getEnv('SCORE_WEIGHT_SMART_HUB', SCORE_CALCULATION_WEIGHTS.smartHubUtilization.toString())
    ),
    fuelEfficiency: parseFloat(
      getEnv('SCORE_WEIGHT_FUEL', SCORE_CALCULATION_WEIGHTS.fuelEfficiency.toString())
    )
  };
  
  return {
    recommendationExpirationHours,
    reservationExpirationMinutes,
    maxRecommendationsPerDriver,
    scoreCalculationWeights
  };
};

/**
 * Retrieves Kafka topic names used by the load matching service
 * 
 * @returns Object containing Kafka topic names
 */
export const getKafkaTopics = () => {
  const topicPrefix = getEnv('KAFKA_TOPIC_PREFIX', 'freight-optimization');
  
  // Input topics (consumed by this service)
  const inputTopics = {
    driverLocation: `${topicPrefix}.driver.location`,
    driverAvailability: `${topicPrefix}.driver.availability`,
    loadCreated: `${topicPrefix}.load.created`,
    loadUpdated: `${topicPrefix}.load.updated`,
    loadCancelled: `${topicPrefix}.load.cancelled`,
    optimizationResults: `${topicPrefix}.optimization.results`
  };
  
  // Output topics (produced by this service)
  const outputTopics = {
    matchRecommended: `${topicPrefix}.match.recommended`,
    matchReserved: `${topicPrefix}.match.reserved`,
    matchConfirmed: `${topicPrefix}.match.confirmed`,
    matchRejected: `${topicPrefix}.match.rejected`,
    matchExpired: `${topicPrefix}.match.expired`
  };
  
  return { inputTopics, outputTopics };
};

// Re-export common configuration utilities
export {
  // Environment configuration
  loadEnvConfig,
  getEnv,
  requireEnv,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  
  // Database configuration
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance,
  validateDatabaseConnection,
  
  // Kafka configuration
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig,
  
  // Redis configuration
  getRedisConfig,
  getDefaultRedisClient
};