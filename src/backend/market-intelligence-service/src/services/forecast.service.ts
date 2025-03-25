import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import {
  DemandForecast,
  RegionalDemandForecast,
  LaneDemandForecast,
  ForecastTimeframe,
  ForecastConfidenceLevel,
  DemandLevel,
  ForecastQueryParams,
  DemandForecastModel,
} from '../models/demand-forecast.model';
import { DemandForecaster } from '../algorithms/demand-forecaster';
import { HotspotDetector } from '../algorithms/hotspot-detector';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import { Position } from '../../../common/interfaces/position.interface';
import { logger } from '../../../common/utils/logger';
import { AppError, handleError } from '../../../common/utils/error-handler';
import { getCurrentDateTime, addDays } from '../../../common/utils/date-time';
import { redisClient, FORECAST_CACHE_TTL, getSageMakerConfig } from '../config';

// Define global constants for the service
const FORECAST_CACHE_PREFIX = 'forecast:'; // Prefix for cache keys
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7; // Default confidence threshold
const DEFAULT_FORECAST_REGIONS = ['midwest', 'northeast', 'southeast', 'southwest', 'west']; // Default regions
const DEFAULT_EQUIPMENT_TYPES = [EquipmentType.DRY_VAN, EquipmentType.REFRIGERATED, EquipmentType.FLATBED]; // Default equipment types

/**
 * Generates a cache key for storing forecast results
 * @param timeframe - Forecast timeframe
 * @param region - Region
 * @param equipmentType - Equipment type
 * @returns Cache key for the forecast
 */
const generateForecastCacheKey = (timeframe: ForecastTimeframe, region: string, equipmentType: EquipmentType): string => {
  // Combine FORECAST_CACHE_PREFIX with timeframe, region, and equipmentType
  const cacheKey = `${FORECAST_CACHE_PREFIX}${timeframe}:${region}:${equipmentType}`;
  // Return the formatted cache key
  return cacheKey;
};

/**
 * Retrieves a cached forecast if available
 * @param timeframe - Forecast timeframe
 * @param region - Region
 * @param equipmentType - Equipment type
 * @returns Cached forecast or null if not found
 */
const getCachedForecast = async (timeframe: ForecastTimeframe, region: string, equipmentType: EquipmentType): Promise<DemandForecast | null> => {
  try {
    // Generate cache key using generateForecastCacheKey
    const cacheKey = generateForecastCacheKey(timeframe, region, equipmentType);
    // Query Redis cache with the generated key
    const cachedData = await redisClient.get(cacheKey);
    // Parse the cached JSON data if found
    if (cachedData) {
      const forecast: DemandForecast = JSON.parse(cachedData);
      // Log retrieval from cache
      logger.info(`Retrieved forecast from cache: ${forecast.forecast_id}`);
      // Return the parsed forecast
      return forecast;
    }
    // Return null if not found
    return null;
  } catch (error) {
    // Handle errors during cache retrieval
    logger.error('Error retrieving forecast from cache', { error });
    return null;
  }
};

/**
 * Stores a forecast in the cache
 * @param forecast - Demand forecast
 * @param region - Region
 * @param equipmentType - Equipment type
 * @returns No return value
 */
const cacheForecast = async (forecast: DemandForecast, region: string, equipmentType: EquipmentType): Promise<void> => {
  try {
    // Generate cache key using generateForecastCacheKey
    const cacheKey = generateForecastCacheKey(forecast.timeframe, region, equipmentType);
    // Serialize the forecast to JSON
    const forecastString = JSON.stringify(forecast);
    // Store in Redis cache with the generated key
    await redisClient.set(cacheKey, forecastString, 'EX', FORECAST_CACHE_TTL);
    // Log successful caching
    logger.info(`Cached forecast: ${forecast.forecast_id}`);
  } catch (error) {
    // Handle errors during cache storage
    logger.error('Error caching forecast', { error });
  }
};

/**
 * Validates forecast query parameters
 * @param params - Forecast query parameters
 * @returns True if parameters are valid, false otherwise
 */
const validateForecastParams = (params: ForecastQueryParams): boolean => {
  // Check if required parameters are present
  if (!params) {
    logger.warn('Forecast query parameters are missing');
    return false;
  }

  // Validate parameter types and values
  if (params.timeframe && !Object.values(ForecastTimeframe).includes(params.timeframe)) {
    logger.warn(`Invalid timeframe: ${params.timeframe}`);
    return false;
  }

  // Return validation result
  return true;
};

/**
 * Checks if a forecast is still valid based on its generation time and timeframe
 * @param forecast - Demand forecast
 * @returns True if the forecast is still valid, false otherwise
 */
const isForecastValid = (forecast: DemandForecast): boolean => {
  // Get current date/time
  const now = getCurrentDateTime();
  // Check if forecast's valid_until date is in the future
  return forecast.valid_until > now;
};

/**
 * Service class for managing demand forecasts in the freight market
 */
export class ForecastService {
  private forecaster: DemandForecaster;
  private hotspotDetector: HotspotDetector;

  /**
   * Initializes the ForecastService
   */
  constructor() {
    // Initialize DemandForecaster instance
    this.forecaster = new DemandForecaster();
    // Initialize HotspotDetector instance
    this.hotspotDetector = new HotspotDetector();
    // Log service initialization
    logger.info('ForecastService initialized');
  }

  /**
   * Generates a new demand forecast for specified parameters
   * @param timeframe - Forecast timeframe
   * @param regions - Array of regions
   * @param equipmentTypes - Array of equipment types
   * @returns Generated demand forecast
   */
  async generateForecast(timeframe: ForecastTimeframe, regions: string[], equipmentTypes: EquipmentType[]): Promise<DemandForecast> {
    try {
      // Set default regions and equipment types if not provided
      const forecastRegions = regions || DEFAULT_FORECAST_REGIONS;
      const forecastEquipmentTypes = equipmentTypes || DEFAULT_EQUIPMENT_TYPES;

      // Call forecaster.generateForecast with parameters
      const forecast = await this.forecaster.generateForecast(timeframe, forecastRegions, forecastEquipmentTypes);

      // Store the generated forecast in the database
      const demandForecastDocument = new DemandForecastModel(forecast);
      await demandForecastDocument.save();

      // Cache the forecast for future queries
      for (const region of forecastRegions) {
        for (const equipmentType of forecastEquipmentTypes) {
          await cacheForecast(forecast, region, equipmentType);
        }
      }

      // Log forecast generation
      logger.info('Forecast generated and saved', { forecastId: forecast.forecast_id, timeframe: forecast.timeframe });

      // Return the generated forecast
      return forecast;
    } catch (error) {
      // Handle errors during forecast generation
      logger.error('Error generating forecast', { error });
      throw handleError(error, 'ForecastService.generateForecast');
    }
  }

  /**
   * Retrieves the latest forecast for specified parameters
   * @param timeframe - Forecast timeframe
   * @param region - Region
   * @param equipmentType - Equipment type
   * @returns Latest matching forecast or null if none exists
   */
  async getLatestForecast(timeframe: ForecastTimeframe, region: string, equipmentType: EquipmentType): Promise<DemandForecast | null> {
    try {
      // Check cache for matching forecast
      const cachedForecast = await getCachedForecast(timeframe, region, equipmentType);
      if (cachedForecast) {
        // If found in cache, validate and return the cached forecast
        if (isForecastValid(cachedForecast)) {
          logger.info(`Returning cached forecast: ${cachedForecast.forecast_id}`);
          return cachedForecast;
        } else {
          // If cached forecast is invalid, invalidate it
          await this.invalidateForecastCache(timeframe, region, equipmentType);
          logger.info(`Invalidated expired forecast: ${cachedForecast.forecast_id}`);
        }
      }

      // If not in cache or invalid, query database for most recent forecast
      const queryParams: ForecastQueryParams = { timeframe, region, equipment_type: equipmentType };
      const forecasts = await this.queryForecasts(queryParams);
      const latestForecast = forecasts.length > 0 ? forecasts[0] : null;

      if (latestForecast) {
        // Validate retrieved forecast
        if (isForecastValid(latestForecast)) {
          // If valid forecast found, cache it and return
          await cacheForecast(latestForecast, region, equipmentType);
          logger.info(`Returning latest forecast from database: ${latestForecast.forecast_id}`);
          return latestForecast;
        } else {
          logger.warn(`Latest forecast from database is invalid: ${latestForecast.forecast_id}`);
        }
      }

      // If no valid forecast found, return null
      logger.info('No valid forecast found');
      return null;
    } catch (error) {
      // Handle errors during forecast retrieval
      logger.error('Error retrieving latest forecast', { error });
      throw handleError(error, 'ForecastService.getLatestForecast');
    }
  }

  /**
   * Retrieves a specific forecast by its ID
   * @param forecastId - The forecast ID
   * @returns The forecast with the specified ID or null if not found
   */
  async getForecastById(forecastId: string): Promise<DemandForecast | null> {
    try {
      // Query database for forecast with the specified ID
      const forecast = await DemandForecastModel.findOne({ forecast_id: forecastId }).exec();
      // If found, return the forecast
      if (forecast) {
        logger.info(`Returning forecast by ID: ${forecastId}`);
        return forecast;
      }
      // If not found, return null
      logger.warn(`Forecast not found with ID: ${forecastId}`);
      return null;
    } catch (error) {
      // Handle errors during forecast retrieval
      logger.error('Error retrieving forecast by ID', { error });
      throw handleError(error, 'ForecastService.getForecastById');
    }
  }

  /**
   * Queries forecasts based on various parameters
   * @param params - Forecast query parameters
   * @returns Array of forecasts matching the query parameters
   */
  async queryForecasts(params: ForecastQueryParams): Promise<DemandForecast[]> {
    try {
      // Validate query parameters
      if (!validateForecastParams(params)) {
        throw new AppError('Invalid query parameters', { code: 'VAL_INVALID_INPUT' });
      }

      // Build database query based on parameters
      const query: any = {};
      if (params.timeframe) query.timeframe = params.timeframe;
      if (params.region) query['regional_forecasts.region'] = params.region;
      if (params.equipment_type) query['regional_forecasts.demand_levels.equipment_type'] = params.equipment_type;

      // Execute query against the database
      const forecasts = await DemandForecastModel.find(query).exec();

      // Filter out invalid forecasts
      const validForecasts = forecasts.filter(forecast => isForecastValid(forecast));

      // Log the number of forecasts found
      logger.info(`Found ${validForecasts.length} forecasts matching query parameters`);

      // Return matching forecasts
      return validForecasts;
    } catch (error) {
      // Handle errors during forecast querying
      logger.error('Error querying forecasts', { error });
      throw handleError(error, 'ForecastService.queryForecasts');
    }
  }

  /**
   * Generates hotspots based on a demand forecast
   * @param forecastId - The ID of the demand forecast
   * @param options - Options for hotspot generation
   * @returns Array of hotspot objects
   */
  async generateHotspotsFromForecast(forecastId: string, options: any = {}): Promise<object[]> {
    try {
      // Retrieve the forecast by ID
      const forecast = await this.getForecastById(forecastId);
      // If forecast not found, throw error
      if (!forecast) {
        throw new AppError(`Forecast not found with ID: ${forecastId}`, { code: 'RES_FORECAST_NOT_FOUND' });
      }

      // Use hotspotDetector to identify potential hotspots
      const hotspots = await this.hotspotDetector.detectHotspots(forecast);

      // Log the number of hotspots generated
      logger.info(`Generated ${hotspots.length} hotspots from forecast: ${forecastId}`);

      // Return the generated hotspots
      return hotspots;
    } catch (error) {
      // Handle errors during hotspot generation
      logger.error('Error generating hotspots from forecast', { error });
      throw handleError(error, 'ForecastService.generateHotspotsFromForecast');
    }
  }

  /**
   * Evaluates the accuracy of past forecasts against actual outcomes
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Accuracy metrics for past forecasts
   */
  async evaluateForecastAccuracy(startDate: Date, endDate: Date): Promise<object> {
    try {
      // Call forecaster.evaluateForecastAccuracy with date range
      const accuracyMetrics = await this.forecaster.evaluateForecastAccuracy(startDate, endDate);

      // Log accuracy metrics
      logger.info('Evaluated forecast accuracy', { startDate, endDate, accuracyMetrics });

      // Return the accuracy metrics
      return accuracyMetrics;
    } catch (error) {
      // Handle errors during accuracy evaluation
      logger.error('Error evaluating forecast accuracy', { error });
      throw handleError(error, 'ForecastService.evaluateForecastAccuracy');
    }
  }

  /**
   * Schedules regular forecast generation runs
   * @returns No return value
   */
  async scheduleForecastGeneration(): Promise<void> {
    // TODO: Implement the logic to schedule forecast generation runs
    logger.info('Scheduling regular forecast generation runs');
  }

  /**
   * Refreshes the cache for recent forecasts
   * @returns No return value
   */
  async refreshForecastCache(): Promise<void> {
    // TODO: Implement the logic to refresh the cache for recent forecasts
    logger.info('Refreshing forecast cache');
  }

  /**
   * Invalidates cached forecasts for specific parameters
   * @param timeframe - Forecast timeframe
   * @param region - Region
   * @param equipmentType - Equipment type
   * @returns No return value
   */
  async invalidateForecastCache(timeframe: ForecastTimeframe, region: string, equipmentType: EquipmentType): Promise<void> {
    try {
      // Generate cache key for the specified parameters
      const cacheKey = generateForecastCacheKey(timeframe, region, equipmentType);
      // Remove the entry from Redis cache
      await redisClient.del(cacheKey);
      // Log cache invalidation
      logger.info(`Invalidated forecast cache for key: ${cacheKey}`);
    } catch (error) {
      // Handle errors during cache invalidation
      logger.error('Error invalidating forecast cache', { error });
    }
  }

  /**
   * Retrieves forecasts for a specific timeframe
   * @param timeframe - Forecast timeframe
   * @returns Array of forecasts for the specified timeframe
   */
  async getForecastsByTimeframe(timeframe: ForecastTimeframe): Promise<DemandForecast[]> {
    try {
      // Query database for forecasts with the specified timeframe
      const forecasts = await DemandForecastModel.find({ timeframe }).exec();
      // Filter out invalid forecasts
      const validForecasts = forecasts.filter(forecast => isForecastValid(forecast));
      // Log the number of forecasts found
      logger.info(`Found ${validForecasts.length} forecasts for timeframe: ${timeframe}`);
      // Return matching forecasts
      return validForecasts;
    } catch (error) {
      // Handle errors during forecast retrieval
      logger.error('Error retrieving forecasts by timeframe', { error });
      throw handleError(error, 'ForecastService.getForecastsByTimeframe');
    }
  }

  /**
   * Retrieves forecasts for a specific region
   * @param region - Region
   * @returns Array of forecasts for the specified region
   */
  async getForecastsByRegion(region: string): Promise<DemandForecast[]> {
    try {
      // Query database for forecasts with regional_forecasts containing the specified region
      const forecasts = await DemandForecastModel.find({ 'regional_forecasts.region': region }).exec();
      // Filter out invalid forecasts
      const validForecasts = forecasts.filter(forecast => isForecastValid(forecast));
      // Log the number of forecasts found
      logger.info(`Found ${validForecasts.length} forecasts for region: ${region}`);
      // Return matching forecasts
      return validForecasts;
    } catch (error) {
      // Handle errors during forecast retrieval
      logger.error('Error retrieving forecasts by region', { error });
      throw handleError(error, 'ForecastService.getForecastsByRegion');
    }
  }

  /**
   * Retrieves forecasts for a specific equipment type
   * @param equipmentType - Equipment type
   * @returns Array of forecasts for the specified equipment type
   */
  async getForecastsByEquipmentType(equipmentType: EquipmentType): Promise<DemandForecast[]> {
    try {
      // Query database for forecasts relevant to the specified equipment type
      const forecasts = await DemandForecastModel.find({ 'regional_forecasts.demand_levels': { $exists: true, $not: { $size: 0 } } }).exec();
      // Filter out invalid forecasts
      const validForecasts = forecasts.filter(forecast => isForecastValid(forecast));
      // Log the number of forecasts found
      logger.info(`Found ${validForecasts.length} forecasts for equipment type: ${equipmentType}`);
      // Return matching forecasts
      return validForecasts;
    } catch (error) {
      // Handle errors during forecast retrieval
      logger.error('Error retrieving forecasts by equipment type', { error });
      throw handleError(error, 'ForecastService.getForecastsByEquipmentType');
    }
  }

  /**
   * Extracts regional forecast data for a specific region from a forecast
   * @param forecast - Demand forecast
   * @param region - Region
   * @returns Regional forecast data or null if not found
   */
  async getRegionalForecast(forecast: DemandForecast, region: string): Promise<RegionalDemandForecast | null> {
    try {
      // Find the regional forecast for the specified region in the forecast's regional_forecasts array
      const regionalForecast = forecast.regional_forecasts.find(rf => rf.region === region) || null;
      // If found, return the regional forecast
      if (regionalForecast) {
        logger.info(`Returning regional forecast for region: ${region}`);
        return regionalForecast;
      }
      // If not found, return null
      logger.warn(`No regional forecast found for region: ${region}`);
      return null;
    } catch (error) {
      // Handle errors during regional forecast retrieval
      logger.error('Error retrieving regional forecast', { error });
      throw handleError(error, 'ForecastService.getRegionalForecast');
    }
  }

  /**
   * Extracts lane forecast data for a specific origin-destination pair from a forecast
   * @param forecast - Demand forecast
   * @param originRegion - Origin region
   * @param destinationRegion - Destination region
   * @returns Lane forecast data or null if not found
   */
  async getLaneForecast(forecast: DemandForecast, originRegion: string, destinationRegion: string): Promise<LaneDemandForecast | null> {
    try {
      // Find the lane forecast for the specified origin-destination pair in the forecast's lane_forecasts array
      const laneForecast = forecast.lane_forecasts.find(lf => lf.origin_region === originRegion && lf.destination_region === destinationRegion) || null;
      // If found, return the lane forecast
      if (laneForecast) {
        logger.info(`Returning lane forecast for lane: ${originRegion} -> ${destinationRegion}`);
        return laneForecast;
      }
      // If not found, return null
      logger.warn(`No lane forecast found for lane: ${originRegion} -> ${destinationRegion}`);
      return null;
    } catch (error) {
      // Handle errors during lane forecast retrieval
      logger.error('Error retrieving lane forecast', { error });
      throw handleError(error, 'ForecastService.getLaneForecast');
    }
  }
}