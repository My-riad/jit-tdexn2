/**
 * Market Intelligence Service Configuration
 * 
 * This module provides service-specific configuration settings for the Market Intelligence Service,
 * initializes connections to required services, and re-exports common configuration utilities.
 * It serves as the central configuration point for all market intelligence components including 
 * rate calculation, demand forecasting, and hotspot detection.
 */

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
  getRedisConfig,
  getDefaultRedisClient
} from '../../../common/config/redis.config';

import {
  getDatabaseConfig,
  getKnexInstance
} from '../../../common/config/database.config';

import {
  getSageMakerEndpointName,
  invokeEndpoint,
  ModelType
} from '../../../common/config/sagemaker.config';

import {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
} from '../../../common/config/kafka.config';

import logger from '../../../common/utils/logger';
import Redis from 'ioredis';
import { Knex } from 'knex';

// Constants for the market intelligence service
const SERVICE_NAME = 'market-intelligence-service';
const DEFAULT_CACHE_TTL = 3600; // 1 hour in seconds
const RATE_CACHE_TTL = 1800; // 30 minutes in seconds
const FORECAST_CACHE_TTL = 3600; // 1 hour in seconds
const HOTSPOT_CACHE_TTL = 1800; // 30 minutes in seconds
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

// Initialize clients
let redisClient: Redis;
let dbClient: Knex;

/**
 * Initializes all configuration for the Market Intelligence Service
 */
export const initializeConfig = (): void => {
  try {
    // Load environment variables
    loadEnvConfig();
    
    logger.info(`Initializing ${SERVICE_NAME} configuration`);
    
    // Initialize Redis client for caching market data
    redisClient = getDefaultRedisClient(SERVICE_NAME);
    
    // Initialize database connections for market data storage
    dbClient = getKnexInstance();
    
    // Configure Kafka producers and consumers for market intelligence events
    // This will be initialized when needed by the specific components

    logger.info(`${SERVICE_NAME} configuration initialized successfully`);
  } catch (error) {
    logger.error(`Failed to initialize ${SERVICE_NAME} configuration`, { error });
    throw error;
  }
};

/**
 * Interface for market intelligence configuration
 */
export interface MarketIntelligenceConfig {
  rateSettings: {
    baseRateWeight: number;
    supplyDemandWeight: number;
    historicalTrendWeight: number;
    urgencyWeight: number;
    networkOptimizationWeight: number;
    minRateAdjustment: number;
    maxRateAdjustment: number;
    dynamicPricingEnabled: boolean;
  };
  forecastSettings: {
    predictionHorizon: number; // in hours
    confidenceThreshold: number;
    updateFrequency: number; // in minutes
    historicalDataWindow: number; // in days
    forecastModelEndpoint: string;
  };
  hotspotSettings: {
    defaultRadius: number; // in miles
    minConfidence: number;
    minDemandIncrease: number; // percentage
    validityDays: number;
    bonusMultiplierRange: {
      min: number;
      max: number;
    };
    hotspotModelEndpoint: string;
  };
  externalDataProviders: {
    marketRateProvider: {
      apiKey: string;
      endpoint: string;
      requestLimit: number;
      cacheTime: number; // in seconds
    };
    weatherDataProvider: {
      apiKey: string;
      endpoint: string;
      requestLimit: number;
      cacheTime: number; // in seconds
    };
    fuelPriceProvider: {
      apiKey: string;
      endpoint: string;
      requestLimit: number;
      cacheTime: number; // in seconds
    };
  };
}

/**
 * Interface for hotspot configuration
 */
export interface HotspotConfig {
  defaultRadius: number; // in miles
  minConfidence: number;
  validityDays: number;
}

/**
 * Returns the configuration settings for the Market Intelligence Service
 * 
 * @returns Configuration object with service settings
 */
export const getMarketIntelligenceConfig = (): MarketIntelligenceConfig => {
  // Get configuration from environment variables or use defaults
  return {
    rateSettings: {
      baseRateWeight: getEnvNumber('MARKET_BASE_RATE_WEIGHT', 40) / 100,
      supplyDemandWeight: getEnvNumber('MARKET_SUPPLY_DEMAND_WEIGHT', 25) / 100,
      historicalTrendWeight: getEnvNumber('MARKET_HISTORICAL_TREND_WEIGHT', 15) / 100,
      urgencyWeight: getEnvNumber('MARKET_URGENCY_WEIGHT', 10) / 100,
      networkOptimizationWeight: getEnvNumber('MARKET_NETWORK_OPTIMIZATION_WEIGHT', 10) / 100,
      minRateAdjustment: getEnvNumber('MARKET_MIN_RATE_ADJUSTMENT', -10) / 100, // -10%
      maxRateAdjustment: getEnvNumber('MARKET_MAX_RATE_ADJUSTMENT', 20) / 100, // +20%
      dynamicPricingEnabled: getEnvBoolean('MARKET_DYNAMIC_PRICING_ENABLED', true)
    },
    forecastSettings: {
      predictionHorizon: getEnvNumber('MARKET_PREDICTION_HORIZON', 48), // 48 hours
      confidenceThreshold: getEnvNumber('MARKET_CONFIDENCE_THRESHOLD', 75) / 100, // 75%
      updateFrequency: getEnvNumber('MARKET_FORECAST_UPDATE_FREQUENCY', 4), // 4 hours
      historicalDataWindow: getEnvNumber('MARKET_HISTORICAL_DATA_WINDOW', 90), // 90 days
      forecastModelEndpoint: getEnv('MARKET_FORECAST_MODEL_ENDPOINT', 'freight-optimization-demand-prediction-v1')
    },
    hotspotSettings: {
      defaultRadius: getEnvNumber('MARKET_HOTSPOT_DEFAULT_RADIUS', 50), // 50 miles
      minConfidence: getEnvNumber('MARKET_HOTSPOT_MIN_CONFIDENCE', 80) / 100, // 80%
      minDemandIncrease: getEnvNumber('MARKET_HOTSPOT_MIN_DEMAND_INCREASE', 20) / 100, // 20%
      validityDays: getEnvNumber('MARKET_HOTSPOT_VALIDITY_DAYS', 2), // 2 days
      bonusMultiplierRange: {
        min: getEnvNumber('MARKET_BONUS_MULTIPLIER_MIN', 5) / 100 + 1, // 1.05 (5% bonus)
        max: getEnvNumber('MARKET_BONUS_MULTIPLIER_MAX', 30) / 100 + 1 // 1.30 (30% bonus)
      },
      hotspotModelEndpoint: getEnv('MARKET_HOTSPOT_MODEL_ENDPOINT', 'freight-optimization-hotspot-detection-v1')
    },
    externalDataProviders: {
      marketRateProvider: {
        apiKey: getEnv('MARKET_RATE_API_KEY', ''),
        endpoint: getEnv('MARKET_RATE_API_ENDPOINT', 'https://api.marketrate.example.com'),
        requestLimit: getEnvNumber('MARKET_RATE_API_LIMIT', 1000),
        cacheTime: getEnvNumber('MARKET_RATE_CACHE_TIME', RATE_CACHE_TTL)
      },
      weatherDataProvider: {
        apiKey: getEnv('WEATHER_API_KEY', ''),
        endpoint: getEnv('WEATHER_API_ENDPOINT', 'https://api.weather.example.com'),
        requestLimit: getEnvNumber('WEATHER_API_LIMIT', 500),
        cacheTime: getEnvNumber('WEATHER_CACHE_TIME', 3600)
      },
      fuelPriceProvider: {
        apiKey: getEnv('FUEL_PRICE_API_KEY', ''),
        endpoint: getEnv('FUEL_PRICE_API_ENDPOINT', 'https://api.fuelprice.example.com'),
        requestLimit: getEnvNumber('FUEL_PRICE_API_LIMIT', 300),
        cacheTime: getEnvNumber('FUEL_PRICE_CACHE_TIME', 86400) // 24 hours
      }
    }
  };
};

/**
 * Interface for SageMaker ML model configuration
 */
interface SageMakerConfig {
  demandForecastModel: {
    endpointName: string;
    modelParameters: {
      confidenceThreshold: number;
      predictionHorizon: number;
    };
  };
  pricingModel: {
    endpointName: string;
    modelParameters: {
      minRateAdjustment: number;
      maxRateAdjustment: number;
    };
  };
  hotspotModel?: {
    endpointName: string;
    modelParameters: {
      minConfidence: number;
      defaultRadius: number;
    };
  };
}

/**
 * Returns SageMaker configuration specific to market intelligence models
 * 
 * @returns Configuration for SageMaker ML models
 */
export const getSageMakerConfig = (): SageMakerConfig => {
  const modelVersion = getEnv('MARKET_ML_MODEL_VERSION', 'v1.0.0');
  
  return {
    demandForecastModel: {
      endpointName: getSageMakerEndpointName(ModelType.DEMAND_PREDICTION, modelVersion),
      modelParameters: {
        confidenceThreshold: getEnvNumber('MARKET_CONFIDENCE_THRESHOLD', 75) / 100,
        predictionHorizon: getEnvNumber('MARKET_PREDICTION_HORIZON', 48)
      }
    },
    pricingModel: {
      endpointName: getSageMakerEndpointName(ModelType.PRICE_OPTIMIZATION, modelVersion),
      modelParameters: {
        minRateAdjustment: getEnvNumber('MARKET_MIN_RATE_ADJUSTMENT', -10) / 100,
        maxRateAdjustment: getEnvNumber('MARKET_MAX_RATE_ADJUSTMENT', 20) / 100
      }
    },
    hotspotModel: {
      endpointName: getSageMakerEndpointName(ModelType.DEMAND_PREDICTION, modelVersion),
      modelParameters: {
        minConfidence: getEnvNumber('MARKET_HOTSPOT_MIN_CONFIDENCE', 80) / 100,
        defaultRadius: getEnvNumber('MARKET_HOTSPOT_DEFAULT_RADIUS', 50)
      }
    }
  };
};

/**
 * Interface for external market data configuration
 */
interface ExternalMarketDataConfig {
  marketRateProvider: {
    apiKey: string;
    endpoint: string;
    requestLimit: number;
    cacheTime: number;
  };
  weatherDataProvider: {
    apiKey: string;
    endpoint: string;
    requestLimit: number;
    cacheTime: number;
  };
  fuelPriceProvider: {
    apiKey: string;
    endpoint: string;
    requestLimit: number;
    cacheTime: number;
  };
}

/**
 * Returns configuration for external market data integrations
 * 
 * @returns Configuration for external data providers
 */
export const getExternalMarketDataConfig = (): ExternalMarketDataConfig => {
  return {
    marketRateProvider: {
      apiKey: getEnv('MARKET_RATE_API_KEY', ''),
      endpoint: getEnv('MARKET_RATE_API_ENDPOINT', 'https://api.marketrate.example.com'),
      requestLimit: getEnvNumber('MARKET_RATE_API_LIMIT', 1000),
      cacheTime: getEnvNumber('MARKET_RATE_CACHE_TIME', RATE_CACHE_TTL)
    },
    weatherDataProvider: {
      apiKey: getEnv('WEATHER_API_KEY', ''),
      endpoint: getEnv('WEATHER_API_ENDPOINT', 'https://api.weather.example.com'),
      requestLimit: getEnvNumber('WEATHER_API_LIMIT', 500),
      cacheTime: getEnvNumber('WEATHER_CACHE_TIME', 3600)
    },
    fuelPriceProvider: {
      apiKey: getEnv('FUEL_PRICE_API_KEY', ''),
      endpoint: getEnv('FUEL_PRICE_API_ENDPOINT', 'https://api.fuelprice.example.com'),
      requestLimit: getEnvNumber('FUEL_PRICE_API_LIMIT', 300),
      cacheTime: getEnvNumber('FUEL_PRICE_CACHE_TIME', 86400) // 24 hours
    }
  };
};

// Export clients and constants
export {
  redisClient,
  dbClient,
  RATE_CACHE_TTL,
  FORECAST_CACHE_TTL,
  HOTSPOT_CACHE_TTL
};