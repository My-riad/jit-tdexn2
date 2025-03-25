import * as tf from '@tensorflow/tfjs-node'; // @tensorflow/tfjs-node@4.10.0
import { LRUCache } from 'lru-cache'; // lru-cache@10.0.1

import { modelRegistry } from './model-registry';
import { 
  ModelType, 
  invokeEndpoint, 
  getSageMakerEndpointName, 
  USE_SAGEMAKER 
} from '../../../common/config/sagemaker.config';
import logger from '../../../common/utils/logger';
import { getEnv } from '../../../common/config/environment.config';

// Default model version to use when none is specified
const DEFAULT_MODEL_VERSION = 'latest';

// Cache TTL in milliseconds (default: 5 minutes)
const PREDICTION_CACHE_TTL = parseInt(getEnv('PREDICTION_CACHE_TTL', '300000'));

// Whether to use prediction cache
const USE_PREDICTION_CACHE = getEnv('USE_PREDICTION_CACHE', 'true') === 'true';

// Default confidence threshold for accepting predictions
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

// Initialize prediction cache
const predictionCache = new LRUCache<string, any>({
  max: 1000,
  ttl: PREDICTION_CACHE_TTL
});

/**
 * Interface defining options for prediction operations
 */
export interface PredictionOptions {
  // Model version to use, defaults to 'latest'
  version?: string;
  
  // Whether to use cache for this prediction
  useCache?: boolean;
  
  // Confidence threshold for accepting predictions
  confidenceThreshold?: number;
  
  // Options for preprocessing input data
  preprocessOptions?: Record<string, any>;
  
  // Options for postprocessing output data
  postprocessOptions?: Record<string, any>;
}

/**
 * Validates that the provided model type is a valid ModelType
 * 
 * @param modelType - Type of model to validate
 * @returns True if the model type is valid, throws an error otherwise
 */
function validateModelType(modelType: string): boolean {
  if (Object.values(ModelType).includes(modelType as ModelType)) {
    return true;
  }

  const validTypes = Object.values(ModelType).join(', ');
  throw new Error(`Invalid model type: ${modelType}. Must be one of: ${validTypes}`);
}

/**
 * Makes a prediction using a specified model type and input data
 * 
 * @param modelType - Type of model to use for prediction
 * @param inputData - Input data for prediction
 * @param options - Additional options for prediction
 * @returns Promise resolving to prediction results
 */
export async function predict(
  modelType: string,
  inputData: any,
  options: PredictionOptions = {}
): Promise<any> {
  try {
    // Validate model type
    validateModelType(modelType);
    
    // Determine model version to use
    const version = options.version || DEFAULT_MODEL_VERSION;
    
    // Check cache if enabled
    const useCache = options.useCache !== undefined ? options.useCache : USE_PREDICTION_CACHE;
    if (useCache) {
      const cacheKey = generateCacheKey(modelType, inputData, version);
      const cachedPrediction = getCachedPrediction(cacheKey);
      if (cachedPrediction) {
        logger.debug(`Using cached prediction for ${modelType}@${version}`);
        return cachedPrediction;
      }
    }
    
    // Preprocess input data
    const processedInput = preprocessInput(inputData, modelType);
    
    // Get the model
    const model = await modelRegistry.getModel(modelType, version);
    
    let prediction;
    
    if (!USE_SAGEMAKER) {
      // Using local TensorFlow model
      if (model.predict) {
        // Convert input to tensor if needed
        let tensorInput;
        if (processedInput instanceof tf.Tensor) {
          tensorInput = processedInput;
        } else if (Array.isArray(processedInput)) {
          tensorInput = tf.tensor(processedInput);
        } else {
          tensorInput = tf.tensor([processedInput]);
        }
        
        // Run prediction
        const result = model.predict(tensorInput);
        
        // Convert result to JavaScript value
        let outputData;
        if (result instanceof tf.Tensor) {
          outputData = await result.array();
          // Clean up tensors
          tensorInput.dispose();
          result.dispose();
        } else {
          outputData = result;
        }
        
        prediction = outputData;
      } else {
        throw new Error(`Model does not support predict method: ${modelType}@${version}`);
      }
    } else {
      // Using SageMaker endpoint
      prediction = await model.predict(processedInput, options.preprocessOptions);
    }
    
    // Postprocess prediction results
    const processedOutput = postprocessOutput(prediction, modelType, options);
    
    // Calculate confidence score
    const confidenceScore = calculateConfidence(processedOutput, modelType, inputData);
    processedOutput.confidence_score = confidenceScore;
    
    // Check if confidence meets threshold
    const confidenceThreshold = options.confidenceThreshold || DEFAULT_CONFIDENCE_THRESHOLD;
    if (confidenceScore < confidenceThreshold) {
      logger.debug(`Prediction confidence (${confidenceScore}) below threshold (${confidenceThreshold})`);
    }
    
    // Cache the prediction if enabled
    if (useCache) {
      const cacheKey = generateCacheKey(modelType, inputData, version);
      cachePrediction(cacheKey, processedOutput);
    }
    
    return processedOutput;
  } catch (error) {
    logger.error(`Prediction failed for model type: ${modelType}`, { error });
    throw error;
  }
}

/**
 * Preprocesses input data for a specific model type
 * 
 * @param inputData - Input data for prediction
 * @param modelType - Type of model
 * @returns Preprocessed input data ready for model inference
 */
export function preprocessInput(inputData: any, modelType: string): any {
  // Validate input data
  if (!inputData) {
    throw new Error('Input data is required for prediction');
  }
  
  // Apply model-specific preprocessing
  switch (modelType) {
    case ModelType.DEMAND_PREDICTION: {
      // Format location, time, and region data for demand prediction
      const { region, location, radius_km, start_time, end_time, ...rest } = inputData;
      
      if (!region || !location || !start_time || !end_time) {
        throw new Error('Demand prediction requires region, location, start_time, and end_time');
      }
      
      return {
        region,
        latitude: location.latitude || location.lat,
        longitude: location.longitude || location.lng,
        radius_km: radius_km || 50, // Default 50km radius
        start_timestamp: start_time instanceof Date ? start_time.toISOString() : start_time,
        end_timestamp: end_time instanceof Date ? end_time.toISOString() : end_time,
        ...rest
      };
    }
    
    case ModelType.SUPPLY_PREDICTION: {
      // Format driver availability and location data for supply prediction
      const { region, location, radius_km, start_time, end_time, ...rest } = inputData;
      
      if (!region || !location || !start_time || !end_time) {
        throw new Error('Supply prediction requires region, location, start_time, and end_time');
      }
      
      return {
        region,
        latitude: location.latitude || location.lat,
        longitude: location.longitude || location.lng,
        radius_km: radius_km || 50, // Default 50km radius
        start_timestamp: start_time instanceof Date ? start_time.toISOString() : start_time,
        end_timestamp: end_time instanceof Date ? end_time.toISOString() : end_time,
        ...rest
      };
    }
    
    case ModelType.NETWORK_OPTIMIZATION: {
      // Format network state and constraints for optimization
      const { current_state, proposed_change, constraints, ...rest } = inputData;
      
      if (!current_state) {
        throw new Error('Network optimization requires current_state');
      }
      
      return {
        current_state,
        proposed_change: proposed_change || null,
        constraints: constraints || {},
        ...rest
      };
    }
    
    case ModelType.DRIVER_BEHAVIOR: {
      // Format driver history and preferences for behavior prediction
      const { driver_id, current_location, destination, history, preferences, ...rest } = inputData;
      
      if (!driver_id || !current_location) {
        throw new Error('Driver behavior prediction requires driver_id and current_location');
      }
      
      return {
        driver_id,
        current_latitude: current_location.latitude || current_location.lat,
        current_longitude: current_location.longitude || current_location.lng,
        destination_latitude: destination?.latitude || destination?.lat,
        destination_longitude: destination?.longitude || destination?.lng,
        history: history || [],
        preferences: preferences || {},
        ...rest
      };
    }
    
    case ModelType.PRICE_OPTIMIZATION: {
      // Format route and market condition data for price optimization
      const { origin, destination, equipment_type, distance, pickup_date, ...rest } = inputData;
      
      if (!origin || !destination || !equipment_type) {
        throw new Error('Price optimization requires origin, destination, and equipment_type');
      }
      
      return {
        origin,
        destination,
        equipment_type,
        distance: distance || 0,
        pickup_date: pickup_date instanceof Date ? pickup_date.toISOString() : pickup_date,
        ...rest
      };
    }
    
    default:
      // For unknown model types, pass through the input data
      logger.warn(`No preprocessing defined for model type: ${modelType}, using raw input`);
      return inputData;
  }
}

/**
 * Postprocesses raw model output into structured prediction results
 * 
 * @param rawOutput - Raw model output
 * @param modelType - Type of model
 * @param options - Additional options for postprocessing
 * @returns Structured prediction results
 */
export function postprocessOutput(
  rawOutput: any,
  modelType: string,
  options: PredictionOptions = {}
): any {
  if (!rawOutput) {
    throw new Error('Model output is empty');
  }
  
  // Apply model-specific postprocessing
  switch (modelType) {
    case ModelType.DEMAND_PREDICTION: {
      // Format load count and confidence
      let predictedCount = 0;
      
      if (Array.isArray(rawOutput)) {
        if (Array.isArray(rawOutput[0])) {
          // Handle nested array output
          predictedCount = Math.round(rawOutput[0][0]);
        } else {
          // Handle flat array output
          predictedCount = Math.round(rawOutput[0]);
        }
      } else if (typeof rawOutput === 'object' && rawOutput.predictions) {
        // Handle SageMaker format
        predictedCount = Math.round(rawOutput.predictions[0]);
      } else if (typeof rawOutput === 'number') {
        // Handle direct number output
        predictedCount = Math.round(rawOutput);
      } else {
        // Try to extract from unknown format
        predictedCount = Math.round(parseFloat(String(rawOutput)));
      }
      
      return {
        predicted_load_count: Math.max(0, predictedCount), // Ensure non-negative
        prediction_details: {
          raw_output: rawOutput
        }
      };
    }
    
    case ModelType.SUPPLY_PREDICTION: {
      // Format truck count and confidence
      let predictedCount = 0;
      
      if (Array.isArray(rawOutput)) {
        if (Array.isArray(rawOutput[0])) {
          // Handle nested array output
          predictedCount = Math.round(rawOutput[0][0]);
        } else {
          // Handle flat array output
          predictedCount = Math.round(rawOutput[0]);
        }
      } else if (typeof rawOutput === 'object' && rawOutput.predictions) {
        // Handle SageMaker format
        predictedCount = Math.round(rawOutput.predictions[0]);
      } else if (typeof rawOutput === 'number') {
        // Handle direct number output
        predictedCount = Math.round(rawOutput);
      } else {
        // Try to extract from unknown format
        predictedCount = Math.round(parseFloat(String(rawOutput)));
      }
      
      return {
        predicted_truck_count: Math.max(0, predictedCount), // Ensure non-negative
        prediction_details: {
          raw_output: rawOutput
        }
      };
    }
    
    case ModelType.NETWORK_OPTIMIZATION: {
      // Format efficiency scores and recommendations
      let efficiencyScore = 0;
      let emptyMilesImpact = 0;
      let recommendations = [];
      
      if (typeof rawOutput === 'object') {
        if (rawOutput.efficiency_score !== undefined) {
          efficiencyScore = rawOutput.efficiency_score;
        } else if (rawOutput.predictions && Array.isArray(rawOutput.predictions)) {
          efficiencyScore = rawOutput.predictions[0];
        }
        
        if (rawOutput.empty_miles_impact !== undefined) {
          emptyMilesImpact = rawOutput.empty_miles_impact;
        } else if (rawOutput.predictions && rawOutput.predictions.length > 1) {
          emptyMilesImpact = rawOutput.predictions[1];
        }
        
        if (rawOutput.recommendations) {
          recommendations = rawOutput.recommendations;
        }
      } else if (Array.isArray(rawOutput)) {
        if (rawOutput.length > 0) efficiencyScore = rawOutput[0];
        if (rawOutput.length > 1) emptyMilesImpact = rawOutput[1];
      }
      
      return {
        efficiency_score: efficiencyScore,
        empty_miles_impact: emptyMilesImpact,
        recommendations: recommendations || [],
        prediction_details: {
          raw_output: rawOutput
        }
      };
    }
    
    case ModelType.DRIVER_BEHAVIOR: {
      // Format behavior patterns and preferences
      let routePreferences = {};
      let restStopPreferences = {};
      let drivingPattern = {};
      
      if (typeof rawOutput === 'object') {
        if (rawOutput.route_preferences) {
          routePreferences = rawOutput.route_preferences;
        }
        
        if (rawOutput.rest_stop_preferences) {
          restStopPreferences = rawOutput.rest_stop_preferences;
        }
        
        if (rawOutput.driving_pattern) {
          drivingPattern = rawOutput.driving_pattern;
        }
      } else if (Array.isArray(rawOutput) && rawOutput.length >= 3) {
        // Assume three components in a specific order
        routePreferences = { score: rawOutput[0] };
        restStopPreferences = { score: rawOutput[1] };
        drivingPattern = { score: rawOutput[2] };
      }
      
      return {
        route_preferences: routePreferences,
        rest_stop_preferences: restStopPreferences,
        driving_pattern: drivingPattern,
        prediction_details: {
          raw_output: rawOutput
        }
      };
    }
    
    case ModelType.PRICE_OPTIMIZATION: {
      // Format rate recommendations
      let baseRate = 0;
      let minRate = 0;
      let maxRate = 0;
      
      if (typeof rawOutput === 'object') {
        if (rawOutput.base_rate !== undefined) {
          baseRate = rawOutput.base_rate;
          minRate = rawOutput.min_rate !== undefined ? rawOutput.min_rate : baseRate * 0.9;
          maxRate = rawOutput.max_rate !== undefined ? rawOutput.max_rate : baseRate * 1.1;
        } else if (rawOutput.predictions && Array.isArray(rawOutput.predictions)) {
          baseRate = rawOutput.predictions[0];
          minRate = rawOutput.predictions.length > 1 ? rawOutput.predictions[1] : baseRate * 0.9;
          maxRate = rawOutput.predictions.length > 2 ? rawOutput.predictions[2] : baseRate * 1.1;
        }
      } else if (Array.isArray(rawOutput)) {
        if (rawOutput.length > 0) baseRate = rawOutput[0];
        if (rawOutput.length > 1) minRate = rawOutput[1];
        if (rawOutput.length > 2) maxRate = rawOutput[2];
      } else if (typeof rawOutput === 'number') {
        baseRate = rawOutput;
        minRate = baseRate * 0.9;
        maxRate = baseRate * 1.1;
      }
      
      return {
        base_rate: parseFloat(baseRate.toFixed(2)),
        min_rate: parseFloat(minRate.toFixed(2)),
        max_rate: parseFloat(maxRate.toFixed(2)),
        prediction_details: {
          raw_output: rawOutput
        }
      };
    }
    
    default:
      // For unknown model types, return raw output
      logger.warn(`No postprocessing defined for model type: ${modelType}, returning raw output`);
      return {
        raw_output: rawOutput
      };
  }
}

/**
 * Calculates a confidence score for a prediction
 * 
 * @param prediction - Prediction results
 * @param modelType - Type of model
 * @param inputData - Input data used for prediction
 * @returns Confidence score between 0 and 1
 */
function calculateConfidence(
  prediction: any,
  modelType: string,
  inputData: any
): number {
  // Base confidence - may be provided directly by the model
  let confidence = 0.5; // Default middle confidence
  
  // Apply model-specific confidence calculation
  switch (modelType) {
    case ModelType.DEMAND_PREDICTION:
    case ModelType.SUPPLY_PREDICTION: {
      // For prediction models, check if the model provided confidence directly
      if (prediction.prediction_details?.raw_output?.confidence) {
        confidence = prediction.prediction_details.raw_output.confidence;
      } else if (prediction.prediction_details?.raw_output?.probabilities) {
        // Use probability if available
        confidence = prediction.prediction_details.raw_output.probabilities[0];
      } else {
        // Calculate based on historical accuracy for similar inputs
        // This is a placeholder - in a real system, this would be more sophisticated
        confidence = 0.7 + (Math.random() * 0.2); // Random value between 0.7-0.9
      }
      break;
    }
    
    case ModelType.NETWORK_OPTIMIZATION: {
      // For optimization models, confidence can be based on the quality of the solution
      if (prediction.efficiency_score !== undefined) {
        // Higher efficiency scores generally mean higher confidence
        confidence = Math.min(0.5 + (prediction.efficiency_score / 200), 0.95);
      }
      break;
    }
    
    case ModelType.DRIVER_BEHAVIOR: {
      // For behavior models, confidence can be based on the amount of historical data
      confidence = 0.75; // Reasonable default
      break;
    }
    
    case ModelType.PRICE_OPTIMIZATION: {
      // For price models, confidence can be based on market data quality
      // Smaller ranges between min/max indicate higher confidence
      if (prediction.base_rate && prediction.min_rate && prediction.max_rate) {
        const range = (prediction.max_rate - prediction.min_rate) / prediction.base_rate;
        confidence = Math.max(0.5, 1 - range);
      }
      break;
    }
    
    default:
      confidence = 0.5; // Default for unknown model types
  }
  
  // Ensure confidence is within valid range
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Retrieves a cached prediction if available and valid
 * 
 * @param cacheKey - Cache key for the prediction
 * @returns Cached prediction or null if not found or expired
 */
function getCachedPrediction(cacheKey: string): any | null {
  if (!USE_PREDICTION_CACHE) {
    return null;
  }
  
  const cached = predictionCache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for key: ${cacheKey}`);
    return cached;
  }
  
  logger.debug(`Cache miss for key: ${cacheKey}`);
  return null;
}

/**
 * Caches a prediction result for future use
 * 
 * @param cacheKey - Cache key for the prediction
 * @param prediction - Prediction results to cache
 */
function cachePrediction(cacheKey: string, prediction: any): void {
  if (!USE_PREDICTION_CACHE) {
    return;
  }
  
  predictionCache.set(cacheKey, prediction);
  logger.debug(`Cached prediction with key: ${cacheKey}`);
}

/**
 * Generates a consistent cache key from prediction parameters
 * 
 * @param modelType - Type of model
 * @param inputData - Input data for prediction
 * @param version - Model version
 * @returns Unique cache key for the prediction
 */
function generateCacheKey(modelType: string, inputData: any, version: string): string {
  // Normalize input data for consistent key generation
  const normalizedInput = JSON.stringify(inputData, (key, value) => {
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
  
  // Create a hash of the model type, version, and input data
  const key = `${modelType}:${version}:${normalizedInput}`;
  
  // In a production system, we'd want to hash this to a fixed length
  // For simplicity, we'll just return the string
  return key;
}

/**
 * Class that provides prediction capabilities using machine learning models
 */
export class Predictor {
  private predictionCache: LRUCache<string, any>;
  private config: Record<string, any>;
  
  /**
   * Initializes the Predictor with configuration options
   * 
   * @param options - Configuration options
   */
  constructor(options: Record<string, any> = {}) {
    // Default configuration
    this.config = {
      cacheTtl: PREDICTION_CACHE_TTL,
      enableCaching: USE_PREDICTION_CACHE,
      defaultModelVersion: DEFAULT_MODEL_VERSION,
      confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
      ...options
    };
    
    // Initialize cache if enabled
    if (this.config.enableCaching) {
      this.predictionCache = new LRUCache<string, any>({
        max: this.config.cacheSize || 1000,
        ttl: this.config.cacheTtl
      });
    }
  }
  
  /**
   * Makes a prediction using a specified model type and input data
   * 
   * @param modelType - Type of model to use for prediction
   * @param inputData - Input data for prediction
   * @param options - Additional options for prediction
   * @returns Promise resolving to prediction results
   */
  async predict(
    modelType: string,
    inputData: any,
    options: PredictionOptions = {}
  ): Promise<any> {
    return predict(modelType, inputData, {
      ...options,
      useCache: options.useCache !== undefined ? options.useCache : this.config.enableCaching
    });
  }
  
  /**
   * Predicts load demand for a specific region and time window
   * 
   * @param region - Geographic region
   * @param location - Center location for prediction
   * @param radiusKm - Radius around center location in kilometers
   * @param startTime - Start of time window
   * @param endTime - End of time window
   * @param options - Additional options for prediction
   * @returns Promise resolving to demand forecast with confidence score
   */
  async predictDemand(
    region: string,
    location: { latitude: number; longitude: number } | { lat: number; lng: number },
    radiusKm: number,
    startTime: Date,
    endTime: Date,
    options: PredictionOptions = {}
  ): Promise<{ predicted_load_count: number; confidence_score: number }> {
    const inputData = {
      region,
      location,
      radius_km: radiusKm,
      start_time: startTime,
      end_time: endTime
    };
    
    const result = await this.predict(ModelType.DEMAND_PREDICTION, inputData, options);
    return {
      predicted_load_count: result.predicted_load_count,
      confidence_score: result.confidence_score
    };
  }
  
  /**
   * Predicts truck supply for a specific region and time window
   * 
   * @param region - Geographic region
   * @param location - Center location for prediction
   * @param radiusKm - Radius around center location in kilometers
   * @param startTime - Start of time window
   * @param endTime - End of time window
   * @param options - Additional options for prediction
   * @returns Promise resolving to supply forecast with confidence score
   */
  async predictSupply(
    region: string,
    location: { latitude: number; longitude: number } | { lat: number; lng: number },
    radiusKm: number,
    startTime: Date,
    endTime: Date,
    options: PredictionOptions = {}
  ): Promise<{ predicted_truck_count: number; confidence_score: number }> {
    const inputData = {
      region,
      location,
      radius_km: radiusKm,
      start_time: startTime,
      end_time: endTime
    };
    
    const result = await this.predict(ModelType.SUPPLY_PREDICTION, inputData, options);
    return {
      predicted_truck_count: result.predicted_truck_count,
      confidence_score: result.confidence_score
    };
  }
  
  /**
   * Predicts driver behavior patterns such as preferred routes and rest stops
   * 
   * @param driverId - ID of the driver
   * @param currentLocation - Current driver location
   * @param destination - Optional destination location
   * @param options - Additional options for prediction
   * @returns Promise resolving to driver behavior predictions
   */
  async predictDriverBehavior(
    driverId: string,
    currentLocation: { latitude: number; longitude: number } | { lat: number; lng: number },
    destination?: { latitude: number; longitude: number } | { lat: number; lng: number },
    options: PredictionOptions = {}
  ): Promise<{
    route_preferences: any;
    rest_stop_preferences: any;
    driving_pattern: any;
    confidence_score: number;
  }> {
    const inputData = {
      driver_id: driverId,
      current_location: currentLocation,
      destination
    };
    
    const result = await this.predict(ModelType.DRIVER_BEHAVIOR, inputData, options);
    return {
      route_preferences: result.route_preferences,
      rest_stop_preferences: result.rest_stop_preferences,
      driving_pattern: result.driving_pattern,
      confidence_score: result.confidence_score
    };
  }
  
  /**
   * Predicts the optimal price for a load based on market conditions
   * 
   * @param origin - Origin location
   * @param destination - Destination location
   * @param equipmentType - Type of equipment required
   * @param distance - Trip distance in miles
   * @param pickupDate - Scheduled pickup date
   * @param options - Additional options for prediction
   * @returns Promise resolving to price prediction with confidence score
   */
  async predictOptimalPrice(
    origin: string,
    destination: string,
    equipmentType: string,
    distance: number,
    pickupDate: Date,
    options: PredictionOptions = {}
  ): Promise<{
    base_rate: number;
    min_rate: number;
    max_rate: number;
    confidence_score: number;
  }> {
    const inputData = {
      origin,
      destination,
      equipment_type: equipmentType,
      distance,
      pickup_date: pickupDate
    };
    
    const result = await this.predict(ModelType.PRICE_OPTIMIZATION, inputData, options);
    return {
      base_rate: result.base_rate,
      min_rate: result.min_rate,
      max_rate: result.max_rate,
      confidence_score: result.confidence_score
    };
  }
  
  /**
   * Predicts the network-wide efficiency impact of a specific load assignment
   * 
   * @param currentNetworkState - Current state of the network
   * @param proposedChange - Proposed change to evaluate
   * @param options - Additional options for prediction
   * @returns Promise resolving to network efficiency prediction
   */
  async predictNetworkEfficiency(
    currentNetworkState: any,
    proposedChange: any,
    options: PredictionOptions = {}
  ): Promise<{
    efficiency_score: number;
    empty_miles_impact: number;
    confidence_score: number;
  }> {
    const inputData = {
      current_state: currentNetworkState,
      proposed_change: proposedChange
    };
    
    const result = await this.predict(ModelType.NETWORK_OPTIMIZATION, inputData, options);
    return {
      efficiency_score: result.efficiency_score,
      empty_miles_impact: result.empty_miles_impact,
      confidence_score: result.confidence_score
    };
  }
  
  /**
   * Clears the prediction cache
   * 
   * @param modelType - Optional model type to clear cache for specific type only
   */
  clearCache(modelType?: string): void {
    if (!this.predictionCache) return;
    
    if (modelType) {
      // Clear cache for specific model type
      validateModelType(modelType);
      
      // Since LRUCache doesn't support partial clearing, we need to iterate
      const keysToDelete: string[] = [];
      this.predictionCache.forEach((value, key) => {
        if (key.startsWith(`${modelType}:`)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.predictionCache.delete(key));
      logger.info(`Cleared prediction cache for model type: ${modelType}`);
    } else {
      // Clear entire cache
      this.predictionCache.clear();
      logger.info('Cleared entire prediction cache');
    }
  }
  
  /**
   * Gets the appropriate model version to use for a prediction
   * 
   * @param modelType - Type of model
   * @param version - Requested version, or undefined for default
   * @returns Promise resolving to the model version to use
   */
  async getModelVersion(modelType: string, version?: string): Promise<string> {
    validateModelType(modelType);
    
    if (!version || version === 'latest') {
      return await modelRegistry.getLatestModelVersion(modelType);
    }
    
    return version;
  }
}

// Create a singleton instance for easy access
export const predictor = new Predictor();