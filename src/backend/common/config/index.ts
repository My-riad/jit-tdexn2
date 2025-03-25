/**
 * Centralized Configuration Module
 * 
 * This is the main entry point for accessing all configuration utilities
 * across the AI-driven Freight Optimization Platform. It provides a unified
 * interface for environment variables, database connections, AWS services,
 * Kafka messaging, Redis caching, and SageMaker ML services.
 */

// Environment configuration
export {
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  getEnvArray,
  getEnvObject,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  IS_STAGING
} from './environment.config';

// AWS service configuration
export {
  configureAWS,
  createS3Client,
  createDynamoDBClient,
  createSageMakerClient,
  createSageMakerRuntimeClient,
  createCloudWatchClient,
  createSNSClient,
  createSQSClient,
  createSecretsManagerClient,
  getSecret,
  uploadToS3,
  downloadFromS3,
  getAWSConfig,
  AWS_REGION
} from './aws.config';

// Database configuration
export {
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance,
  closeKnexConnection,
  getTimescaleConfig,
  validateDatabaseConnection
} from './database.config';

// Kafka messaging configuration
export {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig,
  getAdminConfig,
  getTopicConfig,
  KAFKA_DEFAULT_PARTITIONS,
  KAFKA_DEFAULT_REPLICATION_FACTOR
} from './kafka.config';

// Redis caching configuration
export {
  getRedisConfig,
  getDefaultRedisClient,
  closeRedisClient,
  closeAllRedisClients,
  createRedisCluster,
  createRedisSentinel
} from './redis.config';

// SageMaker ML configuration
export {
  ModelType,
  getSageMakerEndpointName,
  getModelArtifactPath,
  getLatestModelVersion,
  invokeEndpoint,
  checkEndpointStatus,
  createEndpoint,
  deleteEndpoint,
  listEndpoints,
  registerModel,
  deregisterModel,
  createModelConfig,
  SAGEMAKER_ENDPOINT_PREFIX,
  SAGEMAKER_MODEL_BUCKET,
  SAGEMAKER_REGION,
  USE_SAGEMAKER,
  LOCAL_MODEL_PATH
} from './sagemaker.config';

import { loadEnvConfig } from './environment.config';
import { configureAWS } from './aws.config';
import { validateDatabaseConnection } from './database.config';
import logger from '../utils/logger';

/**
 * Initializes all configuration modules and ensures proper setup
 * of the application environment
 */
export const initializeConfig = async (): Promise<void> => {
  try {
    // Load environment variables
    loadEnvConfig();
    
    // Configure AWS SDK
    configureAWS();
    
    // Validate database connection
    const dbValid = await validateDatabaseConnection();
    if (!dbValid) {
      throw new Error('Database connection validation failed');
    }
    
    logger.info('Configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize configuration', { error });
    throw error;
  }
};