/**
 * Optimization Engine Configuration
 *
 * This module centralizes all configuration settings specific to the Optimization Engine,
 * extending common configuration with optimization-specific settings. It provides
 * a unified entry point for accessing configuration values within the optimization engine.
 * 
 * @version 1.0.0
 */

// Import common configuration utilities
import {
  getEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION
} from '../../../common/config/environment.config';

// Import ML model configuration
import {
  ModelType,
  getSageMakerEndpointName,
  USE_SAGEMAKER,
  LOCAL_MODEL_PATH
} from '../../../common/config/sagemaker.config';

// Import Redis configuration
import { getRedisConfig } from '../../../common/config/redis.config';

// Import database configuration
import { getDatabaseConfig } from '../../../common/config/database.config';

// Import logger
import logger from '../../../common/utils/logger';

// Server configuration
export const OPTIMIZATION_ENGINE_PORT = getEnvNumber('OPTIMIZATION_ENGINE_PORT', 3004);

// Job queue configuration
export const OPTIMIZATION_JOB_QUEUE_NAME = getEnv('OPTIMIZATION_JOB_QUEUE_NAME', 'optimization-jobs');
export const MAX_CONCURRENT_JOBS = getEnvNumber('MAX_CONCURRENT_JOBS', 5);
export const JOB_TIMEOUT_MS = getEnvNumber('JOB_TIMEOUT_MS', 300000); // 5 minutes
export const DEFAULT_JOB_PRIORITY = getEnvNumber('DEFAULT_JOB_PRIORITY', 10);

// Optimization algorithm weights
export const OPTIMIZATION_WEIGHTS = {
  EMPTY_MILES_REDUCTION: getEnvNumber('WEIGHT_EMPTY_MILES_REDUCTION', 30),
  NETWORK_CONTRIBUTION: getEnvNumber('WEIGHT_NETWORK_CONTRIBUTION', 25),
  ON_TIME_PERFORMANCE: getEnvNumber('WEIGHT_ON_TIME_PERFORMANCE', 20),
  SMART_HUB_UTILIZATION: getEnvNumber('WEIGHT_SMART_HUB_UTILIZATION', 15),
  FUEL_EFFICIENCY: getEnvNumber('WEIGHT_FUEL_EFFICIENCY', 10)
};

// ML model configuration
export const MODEL_CACHE_TTL_MS = getEnvNumber('MODEL_CACHE_TTL_MS', 3600000); // 1 hour
export const USE_PREDICTION_CACHE = getEnvBoolean('USE_PREDICTION_CACHE', true);
export const PREDICTION_CACHE_TTL = getEnvNumber('PREDICTION_CACHE_TTL', 300000); // 5 minutes
export const DEFAULT_CONFIDENCE_THRESHOLD = getEnvNumber('DEFAULT_CONFIDENCE_THRESHOLD', 0.7);

// Geospatial configuration
export const GEOSPATIAL_PRECISION = getEnvNumber('GEOSPATIAL_PRECISION', 5);
export const DEFAULT_SEARCH_RADIUS_KM = getEnvNumber('DEFAULT_SEARCH_RADIUS_KM', 50);

// Smart Hub configuration
export const SMART_HUB_MIN_CROSSOVER_COUNT = getEnvNumber('SMART_HUB_MIN_CROSSOVER_COUNT', 10);

// Relay planning configuration
export const RELAY_MAX_SEGMENT_HOURS = getEnvNumber('RELAY_MAX_SEGMENT_HOURS', 11);
export const RELAY_MIN_SEGMENT_HOURS = getEnvNumber('RELAY_MIN_SEGMENT_HOURS', 2);

/**
 * Returns the complete optimization engine configuration object
 * 
 * @returns Complete optimization engine configuration
 */
export const getOptimizationConfig = () => {
  logger.info('Loading optimization engine configuration');
  
  return {
    // Server settings
    port: OPTIMIZATION_ENGINE_PORT,
    
    // Environment information
    environment: NODE_ENV,
    isProduction: IS_PRODUCTION,
    
    // Job processing settings
    jobQueue: {
      name: OPTIMIZATION_JOB_QUEUE_NAME,
      maxConcurrentJobs: MAX_CONCURRENT_JOBS,
      jobTimeoutMs: JOB_TIMEOUT_MS,
      defaultPriority: DEFAULT_JOB_PRIORITY
    },
    
    // Optimization weights
    weights: OPTIMIZATION_WEIGHTS,
    
    // ML model settings
    models: {
      useSageMaker: USE_SAGEMAKER,
      localModelPath: LOCAL_MODEL_PATH,
      cacheEnabled: USE_PREDICTION_CACHE,
      cacheTtl: PREDICTION_CACHE_TTL,
      confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD
    },
    
    // Geospatial settings
    geospatial: {
      precision: GEOSPATIAL_PRECISION,
      defaultSearchRadius: DEFAULT_SEARCH_RADIUS_KM
    },
    
    // Smart Hub settings
    smartHub: {
      minCrossoverCount: SMART_HUB_MIN_CROSSOVER_COUNT
    },
    
    // Relay planning settings
    relayPlanning: {
      maxSegmentHours: RELAY_MAX_SEGMENT_HOURS,
      minSegmentHours: RELAY_MIN_SEGMENT_HOURS
    },
    
    // Include Redis and database configurations
    redis: getRedisConfig(),
    database: getDatabaseConfig()
  };
};

/**
 * Returns the configuration for the optimization job queue
 * 
 * @returns Job queue configuration for Bull
 */
export const getJobQueueConfig = () => {
  const redisConfig = getRedisConfig();
  
  return {
    name: OPTIMIZATION_JOB_QUEUE_NAME,
    redis: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      tls: redisConfig.tls ? {} : undefined
    },
    defaultJobOptions: {
      priority: DEFAULT_JOB_PRIORITY,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      timeout: JOB_TIMEOUT_MS,
      removeOnComplete: true,
      removeOnFail: false
    },
    limiter: {
      max: MAX_CONCURRENT_JOBS,
      duration: 1000 // 1 second
    }
  };
};

/**
 * Returns the weight configuration for optimization algorithms
 * 
 * @returns Optimization weight configuration
 */
export const getOptimizationWeights = () => {
  // Validate that weights sum to 100
  const totalWeight = Object.values(OPTIMIZATION_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight !== 100) {
    logger.warn(`Optimization weights do not sum to 100. Current sum: ${totalWeight}`);
  }
  
  return OPTIMIZATION_WEIGHTS;
};

/**
 * Returns the configuration for ML models used in optimization
 * 
 * @param modelType - Type of model to get configuration for
 * @returns Model-specific configuration
 */
export const getModelConfig = (modelType: ModelType) => {
  if (USE_SAGEMAKER) {
    // Using SageMaker for model hosting
    const endpointName = getSageMakerEndpointName(modelType, 'latest');
    
    return {
      type: modelType,
      useSageMaker: true,
      endpoint: endpointName,
      confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
      cacheTtl: MODEL_CACHE_TTL_MS
    };
  } else {
    // Using local models
    const modelPath = `${LOCAL_MODEL_PATH}/${modelType}`;
    
    return {
      type: modelType,
      useSageMaker: false,
      modelPath,
      confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
      cacheTtl: MODEL_CACHE_TTL_MS
    };
  }
};

/**
 * Returns the configuration for prediction caching
 * 
 * @returns Prediction cache configuration
 */
export const getPredictionCacheConfig = () => {
  return {
    enabled: USE_PREDICTION_CACHE,
    ttl: PREDICTION_CACHE_TTL
  };
};

/**
 * Returns the configuration for Smart Hub identification algorithms
 * 
 * @returns Smart Hub configuration
 */
export const getSmartHubConfig = () => {
  return {
    minCrossoverCount: SMART_HUB_MIN_CROSSOVER_COUNT,
    geospatialPrecision: GEOSPATIAL_PRECISION,
    defaultSearchRadius: DEFAULT_SEARCH_RADIUS_KM
  };
};

/**
 * Returns the configuration for relay planning algorithms
 * 
 * @returns Relay planning configuration
 */
export const getRelayPlanningConfig = () => {
  return {
    maxSegmentHours: RELAY_MAX_SEGMENT_HOURS,
    minSegmentHours: RELAY_MIN_SEGMENT_HOURS,
    // HOS limits from regulations
    hosLimits: {
      maxDrivingHours: 11,  // Maximum driving hours before required rest
      maxDutyHours: 14,     // Maximum on-duty hours
      minRestHours: 10      // Minimum rest hours required
    }
  };
};