import axios, { AxiosInstance } from 'axios'; // axios@1.4.0
import axiosRetry from 'axios-retry'; // axios-retry@3.5.0
import { MarketRate } from '../models/market-rate.model';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { formatDate, getCurrentDateTime } from '../../../common/utils/date-time';
import { getExternalMarketDataConfig, redisClient } from '../config';

/**
 * Enumeration of supported external market data providers
 */
export enum MarketDataProvider {
  DAT = 'DAT',
  TRUCKSTOP = 'TRUCKSTOP',
  FREIGHTWAVES = 'FREIGHTWAVES',
  SONAR = 'SONAR',
  WEATHER = 'WEATHER'
}

/**
 * Enumeration of available market data endpoints
 */
export enum MarketDataEndpoint {
  CURRENT_RATES = 'CURRENT_RATES',
  HISTORICAL_RATES = 'HISTORICAL_RATES',
  SUPPLY_DEMAND = 'SUPPLY_DEMAND',
  MARKET_TRENDS = 'MARKET_TRENDS',
  WEATHER_IMPACTS = 'WEATHER_IMPACTS',
  FUEL_PRICES = 'FUEL_PRICES',
  SEASONAL_TRENDS = 'SEASONAL_TRENDS'
}

// Global constants for caching and retry configuration
const API_CACHE_PREFIX = 'external-market-data:';
const DEFAULT_CACHE_TTL = 1800; // 30 minutes in seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Generates a cache key for storing external API responses
 * @param provider The name of the data provider
 * @param endpoint The API endpoint being accessed
 * @param params The parameters used in the API request
 * @returns Cache key for the API response
 */
const generateCacheKey = (provider: string, endpoint: string, params: any): string => {
  // Combine API_CACHE_PREFIX with provider and endpoint
  let cacheKey = `${API_CACHE_PREFIX}${provider}:${endpoint}`;
  
  // Sort and stringify params to ensure consistent keys
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj: any, key: string) => {
        obj[key] = params[key];
        return obj;
      }, {});
    cacheKey += `:${JSON.stringify(sortedParams)}`;
  }

  // Return the formatted cache key
  return cacheKey;
};

/**
 * Retrieves a cached API response if available
 * @param cacheKey The key to use when querying the cache
 * @returns Cached response or null if not found
 */
const getCachedResponse = async (cacheKey: string): Promise<any | null> => {
  try {
    // Query Redis cache with the provided key
    const cachedData = await redisClient.get(cacheKey);
    
    // Parse the cached JSON data if found
    if (cachedData) {
      const parsedResponse = JSON.parse(cachedData);
      logger.debug(`Retrieved cached response for key: ${cacheKey}`);
      return parsedResponse;
    }
    
    // Return null if no data was found
    return null;
  } catch (error) {
    logger.error(`Error retrieving cached response for key: ${cacheKey}`, { error });
    return null;
  }
};

/**
 * Stores an API response in the cache
 * @param cacheKey The key to use when storing the response
 * @param response The API response to cache
 * @param ttl Time to live in seconds for the cache entry
 */
const cacheResponse = async (cacheKey: string, response: any, ttl: number = DEFAULT_CACHE_TTL): Promise<void> => {
  try {
    // Serialize the response to JSON
    const serializedResponse = JSON.stringify(response);
    
    // Store in Redis cache with the provided key
    await redisClient.set(cacheKey, serializedResponse, 'EX', ttl);
    
    logger.debug(`Cached response for key: ${cacheKey} with TTL: ${ttl} seconds`);
  } catch (error) {
    logger.error(`Error caching response for key: ${cacheKey}`, { error });
  }
};

/**
 * Creates a configured Axios instance for a specific provider
 * @param provider The name of the data provider
 * @param config The configuration object for the provider
 * @returns Configured Axios instance
 */
const createAxiosInstance = (provider: string, config: any): AxiosInstance => {
  // Create new Axios instance with base URL and timeout
  const instance = axios.create({
    baseURL: config.endpoint,
    timeout: 10000, // 10 seconds
  });

  // Add API key to headers or query parameters as required
  if (config.apiKey) {
    instance.interceptors.request.use((requestConfig: any) => {
      if (requestConfig.method === 'get') {
        requestConfig.params = { ...requestConfig.params, apiKey: config.apiKey };
      } else {
        requestConfig.headers['X-API-Key'] = config.apiKey;
      }
      return requestConfig;
    });
  }

  // Configure retry mechanism with MAX_RETRY_ATTEMPTS and RETRY_DELAY_MS
  axiosRetry(instance, {
    retries: MAX_RETRY_ATTEMPTS,
    retryDelay: (retryCount) => {
      logger.info(`Retrying API request to ${provider} (attempt ${retryCount})`);
      return retryCount * RETRY_DELAY_MS;
    },
    retryCondition: (error) => {
      // Retry on network errors or 5xx status codes
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
    },
  });

  // Add request and response interceptors for logging
  instance.interceptors.request.use((requestConfig: any) => {
    logger.debug(`Sending API request to ${provider}: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`, {
      params: requestConfig.params,
      headers: requestConfig.headers,
    });
    return requestConfig;
  });

  instance.interceptors.response.use(
    (response) => {
      logger.debug(`Received API response from ${provider} with status ${response.status}`);
      return response;
    },
    (error) => {
      logger.error(`API request to ${provider} failed`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );

  // Return the configured instance
  return instance;
};

/**
 * Service for integrating with external freight market data providers
 */
class ExternalMarketDataService {
  private config: any;
  private apiClients: { [provider: string]: AxiosInstance };
  private rateLimiters: { [provider: string]: any }; // Replace 'any' with a proper type if using rate limiters

  /**
   * Initializes the ExternalMarketDataService
   */
  constructor() {
    // Load configuration using getExternalMarketDataConfig()
    this.config = getExternalMarketDataConfig();

    // Initialize API clients for each configured provider
    this.apiClients = {};
    for (const provider in this.config) {
      if (this.config.hasOwnProperty(provider)) {
        this.apiClients[provider] = createAxiosInstance(provider, this.config[provider]);
      }
    }

    // Set up rate limiters to prevent API abuse
    this.rateLimiters = {}; // Implement rate limiting logic if needed

    // Log service initialization
    logger.info('ExternalMarketDataService initialized', {
      providers: Object.keys(this.apiClients),
    });
  }

  /**
   * Gets the current market rate for a specific lane and equipment type
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @returns Current market rate information
   */
  async getCurrentMarketRate(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType
  ): Promise<{ rate: number; min: number; max: number; confidence: number; }> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      throw createError('Missing required parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Generate cache key for this request
    const cacheKey = generateCacheKey('primary', 'currentMarketRate', { originRegion, destinationRegion, equipmentType });

    // Check cache for recent data
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.info(`Returning cached market rate for ${originRegion} -> ${destinationRegion}`);
      return cachedResponse;
    }

    try {
      // Query primary rate provider
      const provider = 'marketRateProvider'; // Replace with actual provider selection logic
      const client = this.getProviderClient(provider);
      if (!client) {
        throw createError(`No API client configured for provider: ${provider}`, { code: 'EXT_SERVICE_UNAVAILABLE' });
      }

      const normalizedOrigin = this.normalizeRegionName(originRegion, provider);
      const normalizedDestination = this.normalizeRegionName(destinationRegion, provider);
      const normalizedEquipment = this.normalizeEquipmentType(equipmentType, provider);

      const response = await client.get(MarketDataEndpoint.CURRENT_RATES, {
        params: {
          origin: normalizedOrigin,
          destination: normalizedDestination,
          equipment: normalizedEquipment,
        },
      });

      // Process and normalize the response data
      const rate = response.data?.rate || 0;
      const min = response.data?.min || rate * 0.8;
      const max = response.data?.max || rate * 1.2;
      const confidence = response.data?.confidence || 0.7;

      const marketRateInfo = { rate, min, max, confidence };

      // Cache the result for future requests
      await cacheResponse(cacheKey, marketRateInfo, this.config[provider].cacheTime);

      // Return the market rate information
      return marketRateInfo;
    } catch (error: any) {
      // If primary provider fails, try fallback providers
      logger.warn(`Failed to get market rate from primary provider, attempting fallback`, { error: error.message });
      // Implement fallback logic here if needed
      this.handleApiError(error, 'marketRateProvider', MarketDataEndpoint.CURRENT_RATES);
      throw error;
    }
  }

  /**
   * Gets historical market rates for a specific lane and equipment type
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @param startDate The start date for the historical data
   * @param endDate The end date for the historical data
   * @returns Array of historical rates with dates
   */
  async getHistoricalRates(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ rate: number; date: Date; }>> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType || !startDate || !endDate) {
      throw createError('Missing required parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Format date parameters for API requests
    const formattedStartDate = formatDate(startDate, 'yyyy-MM-dd');
    const formattedEndDate = formatDate(endDate, 'yyyy-MM-dd');

    // Generate cache key for this request
    const cacheKey = generateCacheKey('historical', 'historicalRates', { originRegion, destinationRegion, equipmentType, formattedStartDate, formattedEndDate });

    // Check cache for recent data
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.info(`Returning cached historical rates for ${originRegion} -> ${destinationRegion}`);
      return cachedResponse;
    }

    try {
      // Query historical data provider
      const provider = 'marketRateProvider'; // Replace with actual provider selection logic
      const client = this.getProviderClient(provider);
      if (!client) {
        throw createError(`No API client configured for provider: ${provider}`, { code: 'EXT_SERVICE_UNAVAILABLE' });
      }

      const normalizedOrigin = this.normalizeRegionName(originRegion, provider);
      const normalizedDestination = this.normalizeRegionName(destinationRegion, provider);
      const normalizedEquipment = this.normalizeEquipmentType(equipmentType, provider);

      const response = await client.get(MarketDataEndpoint.HISTORICAL_RATES, {
        params: {
          origin: normalizedOrigin,
          destination: normalizedDestination,
          equipment: normalizedEquipment,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
      });

      // Process and normalize the response data
      const historicalRates = response.data?.map((item: any) => ({
        rate: item.rate || 0,
        date: new Date(item.date),
      })) || [];

      // Cache the result for future requests
      await cacheResponse(cacheKey, historicalRates, this.config[provider].cacheTime);

      // Return the historical rates array
      return historicalRates;
    } catch (error: any) {
      // If primary provider fails, try fallback providers
      logger.warn(`Failed to get historical rates from primary provider, attempting fallback`, { error: error.message });
      // Implement fallback logic here if needed
      this.handleApiError(error, 'marketRateProvider', MarketDataEndpoint.HISTORICAL_RATES);
      throw error;
    }
  }

  /**
   * Gets the current supply/demand ratio for a specific lane
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @returns Supply/demand ratio with confidence score
   */
  async getSupplyDemandRatio(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType
  ): Promise<{ ratio: number; confidence: number; }> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      throw createError('Missing required parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Generate cache key for this request
    const cacheKey = generateCacheKey('supplyDemand', 'supplyDemandRatio', { originRegion, destinationRegion, equipmentType });

    // Check cache for recent data
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.info(`Returning cached supply/demand ratio for ${originRegion} -> ${destinationRegion}`);
      return cachedResponse;
    }

    try {
      // Query supply/demand data provider
      const provider = 'marketRateProvider'; // Replace with actual provider selection logic
      const client = this.getProviderClient(provider);
      if (!client) {
        throw createError(`No API client configured for provider: ${provider}`, { code: 'EXT_SERVICE_UNAVAILABLE' });
      }

      const normalizedOrigin = this.normalizeRegionName(originRegion, provider);
      const normalizedDestination = this.normalizeRegionName(destinationRegion, provider);
      const normalizedEquipment = this.normalizeEquipmentType(equipmentType, provider);

      const response = await client.get(MarketDataEndpoint.SUPPLY_DEMAND, {
        params: {
          origin: normalizedOrigin,
          destination: normalizedDestination,
          equipment: normalizedEquipment,
        },
      });

      // Process and normalize the response data
      const ratio = response.data?.ratio || 1.0;
      const confidence = response.data?.confidence || 0.7;

      const supplyDemandInfo = { ratio, confidence };

      // Cache the result for future requests
      await cacheResponse(cacheKey, supplyDemandInfo, this.config[provider].cacheTime);

      // Return the supply/demand ratio information
      return supplyDemandInfo;
    } catch (error: any) {
      // If primary provider fails, try fallback providers
      logger.warn(`Failed to get supply/demand ratio from primary provider, attempting fallback`, { error: error.message });
      // Implement fallback logic here if needed
      this.handleApiError(error, 'marketRateProvider', MarketDataEndpoint.SUPPLY_DEMAND);
      throw error;
    }
  }

  /**
   * Gets market trend information for a specific lane or region
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @param days The number of days to look back for trend analysis
   * @returns Market trend information with forecast
   */
  async getMarketTrends(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    days: number
  ): Promise<{ trend: 'up' | 'down' | 'stable'; magnitude: number; confidence: number; forecast: Array<{ date: Date; prediction: number; }>; }> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      throw createError('Missing required parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Set default days parameter if not provided
    const trendDays = days || 30;

    // Generate cache key for this request
    const cacheKey = generateCacheKey('marketTrends', 'marketTrends', { originRegion, destinationRegion, equipmentType, trendDays });

    // Check cache for recent data
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.info(`Returning cached market trends for ${originRegion} -> ${destinationRegion}`);
      return cachedResponse;
    }

    try {
      // Query market trends provider
      const provider = 'marketRateProvider'; // Replace with actual provider selection logic
      const client = this.getProviderClient(provider);
      if (!client) {
        throw createError(`No API client configured for provider: ${provider}`, { code: 'EXT_SERVICE_UNAVAILABLE' });
      }

      const normalizedOrigin = this.normalizeRegionName(originRegion, provider);
      const normalizedDestination = this.normalizeRegionName(destinationRegion, provider);
      const normalizedEquipment = this.normalizeEquipmentType(equipmentType, provider);

      const response = await client.get(MarketDataEndpoint.MARKET_TRENDS, {
        params: {
          origin: normalizedOrigin,
          destination: normalizedDestination,
          equipment: normalizedEquipment,
          days: trendDays,
        },
      });

      // Process and normalize the response data
      const trend = response.data?.trend || 'stable';
      const magnitude = response.data?.magnitude || 0;
      const confidence = response.data?.confidence || 0.7;
      const forecast = response.data?.forecast?.map((item: any) => ({
        date: new Date(item.date),
        prediction: item.prediction || 0,
      })) || [];

      const marketTrendInfo = { trend, magnitude, confidence, forecast };

      // Cache the result for future requests
      await cacheResponse(cacheKey, marketTrendInfo, this.config[provider].cacheTime);

      // Return the market trend information
      return marketTrendInfo;
    } catch (error: any) {
      // If primary provider fails, try fallback providers
      logger.warn(`Failed to get market trends from primary provider, attempting fallback`, { error: error.message });
      // Implement fallback logic here if needed
      this.handleApiError(error, 'marketRateProvider', MarketDataEndpoint.MARKET_TRENDS);
      throw error;
    }
  }

  /**
   * Gets weather impact information for freight movement in specific regions
   * @param regions Array of regions to get weather impacts for
   * @param forecastDays Number of days to forecast
   * @returns Weather impact information by region
   */
  async getWeatherImpacts(
    regions: string[],
    forecastDays: number
  ): Promise<Array<{ region: string; impact: 'none' | 'low' | 'medium' | 'high' | 'severe'; startDate: Date; endDate: Date; description: string; }>> {
    // Validate input parameters
    if (!regions || regions.length === 0) {
      throw createError('Missing required parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Set default forecast days if not provided
    const days = forecastDays || 7;

    // Generate cache key for this request
    const cacheKey = generateCacheKey('weatherImpacts', 'weatherImpacts', { regions, days });

    // Check cache for recent data
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.info(`Returning cached weather impacts for regions: ${regions.join(', ')}`);
      return cachedResponse;
    }

    try {
      // Query weather data provider
      const provider = 'weatherDataProvider';
      const client = this.getProviderClient(provider);
      if (!client) {
        throw createError(`No API client configured for provider: ${provider}`, { code: 'EXT_SERVICE_UNAVAILABLE' });
      }

      const response = await client.get(MarketDataEndpoint.WEATHER_IMPACTS, {
        params: {
          regions: regions.map(region => this.normalizeRegionName(region, provider)),
          forecastDays: days,
        },
      });

      // Process and normalize the response data
      const weatherImpacts = response.data?.map((item: any) => ({
        region: item.region,
        impact: item.impact || 'none',
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        description: item.description || '',
      })) || [];

      // Cache the result for future requests
      await cacheResponse(cacheKey, weatherImpacts, this.config[provider].cacheTime);

      // Return the weather impact information
      return weatherImpacts;
    } catch (error: any) {
      // If primary provider fails, try fallback providers
      logger.warn(`Failed to get weather impacts from primary provider, attempting fallback`, { error: error.message });
      // Implement fallback logic here if needed
      this.handleApiError(error, 'weatherDataProvider', MarketDataEndpoint.WEATHER_IMPACTS);
      throw error;
    }
  }

  /**
   * Gets current and forecasted fuel prices by region
   * @param regions Array of regions to get fuel prices for
   * @param includeForecast Whether to include forecasted prices
   * @returns Fuel price information by region
   */
  async getFuelPrices(
    regions: string[],
    includeForecast: boolean
  ): Promise<{ current: { [region: string]: number }; forecast?: Array<{ date: Date; prices: { [region: string]: number } }> }> {
    // Validate input parameters
    if (!regions || regions.length === 0) {
      throw createError('Missing required parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Generate cache key for this request
    const cacheKey = generateCacheKey('fuelPrices', 'fuelPrices', { regions, includeForecast });

    // Check cache for recent data
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.info(`Returning cached fuel prices for regions: ${regions.join(', ')}`);
      return cachedResponse;
    }

    try {
      // Query fuel price data provider
      const provider = 'fuelPriceProvider';
      const client = this.getProviderClient(provider);
      if (!client) {
        throw createError(`No API client configured for provider: ${provider}`, { code: 'EXT_SERVICE_UNAVAILABLE' });
      }

      const response = await client.get(MarketDataEndpoint.FUEL_PRICES, {
        params: {
          regions: regions.map(region => this.normalizeRegionName(region, provider)),
          includeForecast,
        },
      });

      // Process and normalize the response data
      const currentPrices = response.data?.current || {};
      const forecast = response.data?.forecast?.map((item: any) => ({
        date: new Date(item.date),
        prices: item.prices || {},
      }));

      const fuelPriceInfo = { current: currentPrices, forecast };

      // Cache the result for future requests
      await cacheResponse(cacheKey, fuelPriceInfo, this.config[provider].cacheTime);

      // Return the fuel price information
      return fuelPriceInfo;
    } catch (error: any) {
      // If primary provider fails, try fallback providers
      logger.warn(`Failed to get fuel prices from primary provider, attempting fallback`, { error: error.message });
      // Implement fallback logic here if needed
      this.handleApiError(error, 'fuelPriceProvider', MarketDataEndpoint.FUEL_PRICES);
      throw error;
    }
  }

  /**
   * Gets seasonal trend information for freight movement
   * @param region The region to get seasonal trends for
   * @param equipmentType The equipment type
   * @param startDate The start date for the seasonal data
   * @param endDate The end date for the seasonal data
   * @returns Seasonal trend information
   */
  async getSeasonalTrends(
    region: string,
    equipmentType: EquipmentType,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ period: string; trend: 'up' | 'down' | 'stable'; magnitude: number; }>> {
    // Validate input parameters
    if (!region || !equipmentType || !startDate || !endDate) {
      throw createError('Missing required parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Generate cache key for this request
    const cacheKey = generateCacheKey('seasonalTrends', 'seasonalTrends', { region, equipmentType, startDate, endDate });

    // Check cache for recent data
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.info(`Returning cached seasonal trends for region: ${region}`);
      return cachedResponse;
    }

    try {
      // Query seasonal trends provider
      const provider = 'marketRateProvider'; // Replace with actual provider selection logic
      const client = this.getProviderClient(provider);
      if (!client) {
        throw createError(`No API client configured for provider: ${provider}`, { code: 'EXT_SERVICE_UNAVAILABLE' });
      }

      const normalizedRegion = this.normalizeRegionName(region, provider);
      const normalizedEquipment = this.normalizeEquipmentType(equipmentType, provider);
      const formattedStartDate = formatDate(startDate, 'yyyy-MM-dd');
      const formattedEndDate = formatDate(endDate, 'yyyy-MM-dd');

      const response = await client.get(MarketDataEndpoint.SEASONAL_TRENDS, {
        params: {
          region: normalizedRegion,
          equipment: normalizedEquipment,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
      });

      // Process and normalize the response data
      const seasonalTrends = response.data?.map((item: any) => ({
        period: item.period,
        trend: item.trend || 'stable',
        magnitude: item.magnitude || 0,
      })) || [];

      // Cache the result for future requests
      await cacheResponse(cacheKey, seasonalTrends, this.config[provider].cacheTime);

      // Return the seasonal trend information
      return seasonalTrends;
    } catch (error: any) {
      // If primary provider fails, try fallback providers
      logger.warn(`Failed to get seasonal trends from primary provider, attempting fallback`, { error: error.message });
      // Implement fallback logic here if needed
      this.handleApiError(error, 'marketRateProvider', MarketDataEndpoint.SEASONAL_TRENDS);
      throw error;
    }
  }

  /**
   * Synchronizes market rates from external sources to the database
   * @returns Result of the synchronization operation
   */
  async syncAllMarketRates(): Promise<{ success: boolean; count: number; }> {
    try {
      // Query external rate providers for current rates across major lanes
      // This is a placeholder - implement actual data retrieval logic here
      const rates = [
        { origin_region: 'Chicago, IL', destination_region: 'Detroit, MI', equipment_type: EquipmentType.DRY_VAN, average_rate: 950, min_rate: 800, max_rate: 1100, sample_size: 25, recorded_at: getCurrentDateTime() },
        { origin_region: 'Detroit, MI', destination_region: 'Chicago, IL', equipment_type: EquipmentType.REFRIGERATED, average_rate: 1200, min_rate: 1000, max_rate: 1400, sample_size: 18, recorded_at: getCurrentDateTime() },
        { origin_region: 'Los Angeles, CA', destination_region: 'Dallas, TX', equipment_type: EquipmentType.FLATBED, average_rate: 2500, min_rate: 2200, max_rate: 2800, sample_size: 12, recorded_at: getCurrentDateTime() },
      ];

      let count = 0;
      for (const rateData of rates) {
        // Process and normalize the response data
        const marketRate = new MarketRate(rateData);

        // Create or update MarketRate records in the database
        await marketRate.save();
        count++;
      }

      // Log synchronization results
      logger.info(`Successfully synchronized ${count} market rates to the database`);

      // Return success status and count of synchronized rates
      return { success: true, count };
    } catch (error) {
      logger.error('Failed to synchronize market rates', { error });
      return { success: false, count: 0 };
    }
  }

  /**
   * Gets the API client for a specific provider
   * @param provider The name of the data provider
   * @returns API client for the provider or null if not configured
   */
  private getProviderClient(provider: string): AxiosInstance | null {
    // Check if provider exists in apiClients
    if (this.apiClients[provider]) {
      return this.apiClients[provider];
    }

    // Return the client if found, otherwise null
    logger.warn(`No API client configured for provider: ${provider}`);
    return null;
  }

  /**
   * Handles errors from external API requests
   * @param error The error object
   * @param provider The name of the data provider
   * @param endpoint The API endpoint being accessed
   */
  private handleApiError(error: any, provider: string, endpoint: string): void {
    // Log error details with provider and endpoint context
    logger.error(`Error calling ${provider} ${endpoint}`, {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Check for rate limiting or authentication issues
    if (error.response?.status === 429) {
      logger.warn(`Rate limit exceeded for ${provider}`);
      // Implement rate limiting handling logic here if needed
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      logger.error(`Authentication error for ${provider}`);
      // Implement authentication handling logic here if needed
    }

    // Update provider status if persistent errors occur
    // Implement provider status tracking and health check logic if needed

    // Throw appropriate error for caller to handle
    throw createError(`External API error: ${error.message}`, { code: 'EXT_SERVICE_ERROR' });
  }

  /**
   * Normalizes region names for consistent API requests
   * @param region The region name to normalize
   * @param provider The name of the data provider
   * @returns Normalized region name for the specified provider
   */
  private normalizeRegionName(region: string, provider: string): string {
    // Apply provider-specific region name mapping
    let normalizedRegion = region;
    switch (provider) {
      case 'DAT':
        normalizedRegion = region.toUpperCase();
        break;
      case 'TRUCKSTOP':
        normalizedRegion = region.toLowerCase();
        break;
      default:
        break;
    }

    // Convert to standard format (uppercase, lowercase, etc.)
    return normalizedRegion;
  }

  /**
   * Normalizes equipment types for consistent API requests
   * @param equipmentType The equipment type to normalize
   * @param provider The name of the data provider
   * @returns Normalized equipment type for the specified provider
   */
  private normalizeEquipmentType(equipmentType: EquipmentType, provider: string): string {
    // Apply provider-specific equipment type mapping
    let normalizedEquipment = equipmentType;
    switch (provider) {
      case 'DAT':
        normalizedEquipment = equipmentType.toUpperCase();
        break;
      case 'TRUCKSTOP':
        normalizedEquipment = equipmentType.toLowerCase();
        break;
      default:
        break;
    }

    // Convert to format expected by the provider
    return normalizedEquipment;
  }
}

// Export the class for use in other modules
export { ExternalMarketDataService };