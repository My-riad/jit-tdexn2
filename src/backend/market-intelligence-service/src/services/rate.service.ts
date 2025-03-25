import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { MarketRate } from '../models/market-rate.model';
import { RateCalculator, RateCalculationResult, RateTrendAnalysis } from '../algorithms/rate-calculator';
import { ExternalMarketDataService } from '../integrations/external-market-data';
import { EquipmentType, Load } from '../../../common/interfaces/load.interface';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { calculateDistance } from '../../../common/utils/geo-utils';
import { getMarketIntelligenceConfig } from '../config';

// Define global constants for the service
const SERVICE_NAME = 'market-intelligence-service';
const DEFAULT_HISTORICAL_DAYS = 90;
const RATE_CACHE_TTL = 1800;

/**
 * Service responsible for market rate calculations, analysis, and management in the freight optimization platform.
 * It provides functionality for retrieving current market rates, calculating dynamic pricing based on market conditions,
 * analyzing rate trends, and managing market rate data. This service is a core component of the platform's market intelligence capabilities.
 */
export class RateService {
  private rateCalculator: RateCalculator;
  private externalMarketDataService: ExternalMarketDataService;
  private config: any;

  /**
   * Initializes a new RateService instance.
   * This constructor sets up the RateCalculator, ExternalMarketDataService, and loads the configuration.
   */
  constructor() {
    // Initialize RateCalculator instance
    this.rateCalculator = new RateCalculator();

    // Initialize ExternalMarketDataService instance
    this.externalMarketDataService = new ExternalMarketDataService();

    // Load configuration using getMarketIntelligenceConfig()
    this.config = getMarketIntelligenceConfig();

    // Set up logging with service context
    logger.info('RateService initialized', { service: SERVICE_NAME });
  }

  /**
   * Retrieves the current market rate for a specific lane and equipment type.
   * This method first attempts to retrieve the rate from the internal database. If not found,
   * it fetches the rate from an external market data service.
   *
   * @param originRegion The origin region.
   * @param destinationRegion The destination region.
   * @param equipmentType The equipment type.
   * @returns A promise that resolves with the current market rate information.
   * @throws Error if any of the input parameters are invalid.
   */
  async getMarketRate(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType
  ): Promise<{ rate: number; min: number; max: number; confidence: number; }> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      logger.error('Invalid input parameters for getMarketRate', { originRegion, destinationRegion, equipmentType });
      throw createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Log the retrieval attempt
    logger.info('Retrieving market rate for lane', { originRegion, destinationRegion, equipmentType });

    try {
      // Try to get current market rate from internal database
      const marketRate = await MarketRate.findByLane(originRegion, destinationRegion, equipmentType);

      // If found, return the market rate information
      if (marketRate) {
        logger.info('Market rate found in internal database', { originRegion, destinationRegion, equipmentType, rateId: marketRate.rate_id });
        return {
          rate: marketRate.average_rate,
          min: marketRate.min_rate,
          max: marketRate.max_rate,
          confidence: 0.8, // Assuming a default confidence score
        };
      }

      // If not found in database, fetch from external market data service
      logger.info('Market rate not found in internal database, fetching from external source', { originRegion, destinationRegion, equipmentType });
      const externalMarketData = await this.externalMarketDataService.getCurrentMarketRate(originRegion, destinationRegion, equipmentType);

      // Log the retrieved market rate
      logger.info('Market rate retrieved from external source', { originRegion, destinationRegion, equipmentType, rate: externalMarketData.rate });

      // Return the market rate information with min, max, and confidence score
      return externalMarketData;
    } catch (error) {
      logger.error('Error retrieving market rate', { error, originRegion, destinationRegion, equipmentType });
      throw createError('Failed to retrieve market rate', { code: ErrorCodes.EXT_SERVICE_ERROR, details: { originRegion, destinationRegion, equipmentType } });
    }
  }

  /**
   * Retrieves historical market rates for a specific lane and equipment type within a date range.
   * This method retrieves historical rates from the database and supplements with external data if needed.
   *
   * @param originRegion The origin region.
   * @param destinationRegion The destination region.
   * @param equipmentType The equipment type.
   * @param startDate The start date of the historical data range.
   * @param endDate The end date of the historical data range.
   * @returns A promise that resolves with an array of historical rates.
   * @throws Error if any of the input parameters are invalid.
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
      logger.error('Invalid input parameters for getHistoricalRates', { originRegion, destinationRegion, equipmentType, startDate, endDate });
      throw createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Log the retrieval attempt
    logger.info('Retrieving historical market rates for lane', { originRegion, destinationRegion, equipmentType, startDate, endDate });

    try {
      // Retrieve historical rates from database
      const historicalRates = await MarketRate.findHistoricalRates(originRegion, destinationRegion, equipmentType, startDate, endDate);

      // Log the number of historical rates found
      logger.info(`Found ${historicalRates.length} historical rates in database`, { originRegion, destinationRegion, equipmentType, startDate, endDate });

      // Format and return the historical rates array
      return historicalRates.map(rate => ({
        rate: rate.average_rate,
        date: rate.recorded_at,
      }));
    } catch (error) {
      logger.error('Error retrieving historical market rates', { error, originRegion, destinationRegion, equipmentType, startDate, endDate });
      throw createError('Failed to retrieve historical market rates', { code: ErrorCodes.EXT_SERVICE_ERROR, details: { originRegion, destinationRegion, equipmentType, startDate, endDate } });
    }
  }

  /**
   * Calculates a dynamic rate for a specific lane based on market conditions.
   * This method uses the RateCalculator to perform the core rate calculation.
   *
   * @param originRegion The origin region.
   * @param destinationRegion The destination region.
   * @param equipmentType The equipment type.
   * @param options Additional options for rate calculation.
   * @returns A promise that resolves with the calculated rate and breakdown of factors.
   * @throws Error if any of the input parameters are invalid.
   */
  async calculateRate(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    options: any
  ): Promise<RateCalculationResult> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      logger.error('Invalid input parameters for calculateRate', { originRegion, destinationRegion, equipmentType, options });
      throw createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Log the calculation request
    logger.info('Calculating dynamic rate for lane', { originRegion, destinationRegion, equipmentType, options });

    try {
      // Delegate to rateCalculator.calculateRate() for the core calculation
      const rateCalculationResult = await this.rateCalculator.calculateRate(originRegion, destinationRegion, equipmentType, options);

      // Log the calculation result
      logger.info('Dynamic rate calculation completed', { originRegion, destinationRegion, equipmentType, rate: rateCalculationResult.totalRate });

      // Return the comprehensive rate calculation result with all factors
      return rateCalculationResult;
    } catch (error) {
      logger.error('Error calculating dynamic rate', { error, originRegion, destinationRegion, equipmentType, options });
      throw createError('Failed to calculate dynamic rate', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { originRegion, destinationRegion, equipmentType, options } });
    }
  }

  /**
   * Calculates a dynamic rate for a specific load.
   * This method extracts the necessary parameters from the load object and delegates to the RateCalculator.
   *
   * @param load The load object.
   * @returns A promise that resolves with the calculated rate and breakdown of factors.
   * @throws Error if the load object is invalid or missing required information.
   */
  async calculateLoadRate(load: Load): Promise<RateCalculationResult> {
    // Validate the load object
    if (!load) {
      logger.error('Invalid load object for calculateLoadRate', { load });
      throw createError('Invalid load object', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Log the load rate calculation request
    logger.info('Calculating dynamic rate for load', { loadId: load.load_id });

    try {
      // Delegate to rateCalculator.calculateLoadRate() for the calculation
      const rateCalculationResult = await this.rateCalculator.calculateLoadRate(load);

      // Log the calculation result
      logger.info('Dynamic rate calculation for load completed', { loadId: load.load_id, rate: rateCalculationResult.totalRate });

      // Return the rate calculation result
      return rateCalculationResult;
    } catch (error) {
      logger.error('Error calculating dynamic rate for load', { error, loadId: load.load_id });
      throw createError('Failed to calculate dynamic rate for load', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { loadId: load.load_id } });
    }
  }

  /**
   * Analyzes rate trends for a specific lane and equipment type.
   * This method uses the RateCalculator to perform the trend analysis.
   *
   * @param originRegion The origin region.
   * @param destinationRegion The destination region.
   * @param equipmentType The equipment type.
   * @param days The number of days to look back for trend analysis.
   * @returns A promise that resolves with the analysis of rate trends.
   * @throws Error if any of the input parameters are invalid.
   */
  async analyzeRateTrends(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    days: number
  ): Promise<RateTrendAnalysis> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      logger.error('Invalid input parameters for analyzeRateTrends', { originRegion, destinationRegion, equipmentType, days });
      throw createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Log the trend analysis request
    logger.info('Analyzing rate trends for lane', { originRegion, destinationRegion, equipmentType, days });

    try {
      // Delegate to rateCalculator.analyzeRateTrends() for the analysis
      const rateTrendAnalysis = await this.rateCalculator.analyzeRateTrends(originRegion, destinationRegion, equipmentType, days);

      // Log the trend analysis result
      logger.info('Rate trend analysis completed', { originRegion, destinationRegion, equipmentType, days, trend: rateTrendAnalysis.trend });

      // Return the comprehensive trend analysis
      return rateTrendAnalysis;
    } catch (error) {
      logger.error('Error analyzing rate trends', { error, originRegion, destinationRegion, equipmentType, days });
      throw createError('Failed to analyze rate trends', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { originRegion, destinationRegion, equipmentType, days } });
    }
  }

  /**
   * Retrieves the current supply/demand ratio for a specific lane.
   * This method fetches the supply/demand ratio from an external market data service.
   *
   * @param originRegion The origin region.
   * @param destinationRegion The destination region.
   * @param equipmentType The equipment type.
   * @returns A promise that resolves with the supply/demand ratio and confidence score.
   * @throws Error if any of the input parameters are invalid.
   */
  async getSupplyDemandRatio(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType
  ): Promise<{ ratio: number; confidence: number; }> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      logger.error('Invalid input parameters for getSupplyDemandRatio', { originRegion, destinationRegion, equipmentType });
      throw createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Log the retrieval request
    logger.info('Retrieving supply/demand ratio for lane', { originRegion, destinationRegion, equipmentType });

    try {
      // Fetch supply/demand ratio from external market data service
      const supplyDemandInfo = await this.externalMarketDataService.getSupplyDemandRatio(originRegion, destinationRegion, equipmentType);

      // Log the retrieved ratio
      logger.info('Supply/demand ratio retrieved', { originRegion, destinationRegion, equipmentType, ratio: supplyDemandInfo.ratio });

      // Return the supply/demand ratio information
      return supplyDemandInfo;
    } catch (error) {
      logger.error('Error retrieving supply/demand ratio', { error, originRegion, destinationRegion, equipmentType });
      throw createError('Failed to retrieve supply/demand ratio', { code: ErrorCodes.EXT_SERVICE_ERROR, details: { originRegion, destinationRegion, equipmentType } });
    }
  }

  /**
   * Calculates a rate adjustment factor based on market conditions.
   * This method calculates a rate adjustment factor based on market conditions.
   *
   * @param originRegion The origin region.
   * @param destinationRegion The destination region.
   * @param equipmentType The equipment type.
   * @param options Additional options for rate calculation.
   * @returns A promise that resolves with the rate adjustment factor and confidence score.
   * @throws Error if any of the input parameters are invalid.
   */
  async calculateRateAdjustment(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    options: any
  ): Promise<{ adjustmentFactor: number; confidence: number; }> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      logger.error('Invalid input parameters for calculateRateAdjustment', { originRegion, destinationRegion, equipmentType, options });
      throw createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Log the calculation request
    logger.info('Calculating rate adjustment factor for lane', { originRegion, destinationRegion, equipmentType, options });

    try {
      // Calculate base rate for the lane
      const baseRate = await calculateBaseRate(originRegion, destinationRegion, equipmentType);

      // Get supply/demand ratio for the lane
      const supplyDemandRatio = await this.getSupplyDemandRatio(originRegion, destinationRegion, equipmentType);

      // Calculate adjustment factor based on market conditions
      let adjustmentFactor = supplyDemandRatio.ratio - 1;

      // Apply business rules and constraints to the adjustment
      adjustmentFactor = Math.max(Math.min(adjustmentFactor, 0.2), -0.1); // Limit adjustment to +/- 20%

      // Return the adjustment factor with confidence score
      return {
        adjustmentFactor,
        confidence: supplyDemandRatio.confidence,
      };
    } catch (error) {
      logger.error('Error calculating rate adjustment factor', { error, originRegion, destinationRegion, equipmentType, options });
      throw createError('Failed to calculate rate adjustment factor', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { originRegion, destinationRegion, equipmentType, options } });
    }
  }

  /**
   * Synchronizes market rates from external sources to the database.
   * This method fetches current rates from external providers, processes, and stores them in the database.
   *
   * @returns A promise that resolves with the result of the synchronization operation.
   */
  async syncMarketRates(): Promise<{ success: boolean; count: number; }> {
    // Log the synchronization request
    logger.info('Synchronizing market rates from external sources');

    try {
      // Call externalMarketDataService.syncAllMarketRates() to fetch current rates
      const syncResult = await this.externalMarketDataService.syncAllMarketRates();

      // Log synchronization results
      logger.info(`Successfully synchronized ${syncResult.count} market rates to the database`);

      // Return success status and count of synchronized rates
      return syncResult;
    } catch (error) {
      logger.error('Failed to synchronize market rates', { error });
      return { success: false, count: 0 };
    }
  }

  /**
   * Creates a new market rate record in the database.
   * This method creates a new MarketRate instance and saves it to the database.
   *
   * @param rateData The data for the new market rate record.
   * @returns A promise that resolves with the created market rate record.
   * @throws Error if the rate data is invalid or the record cannot be created.
   */
  async createMarketRate(rateData: any): Promise<MarketRate> {
    // Log the creation request
    logger.info('Creating new market rate record', { rateData });

    try {
      // Create a new MarketRate instance with the provided data
      const marketRate = new MarketRate(rateData);

      // Save the market rate record to the database
      await marketRate.save();

      // Log the creation operation
      logger.info('Market rate record created', { rateId: marketRate.rate_id });

      // Return the created market rate
      return marketRate;
    } catch (error) {
      logger.error('Error creating market rate record', { error, rateData });
      throw createError('Failed to create market rate record', { code: ErrorCodes.DB_QUERY_ERROR, details: { rateData } });
    }
  }

  /**
   * Updates an existing market rate record in the database.
   * This method finds an existing record by ID, updates its data, and saves the updated record to the database.
   *
   * @param rateId The ID of the market rate record to update.
   * @param rateData The data to update the market rate record with.
   * @returns A promise that resolves with the updated market rate record.
   * @throws Error if the rate ID is invalid, the record is not found, or the update fails.
   */
  async updateMarketRate(rateId: string, rateData: any): Promise<MarketRate> {
    // Log the update request
    logger.info('Updating market rate record', { rateId, rateData });

    try {
      // Find the existing market rate record by ID
      const marketRate = await MarketRate.findById(rateId);

      // If not found, throw a not found error
      if (!marketRate) {
        logger.warn('Market rate record not found', { rateId });
        throw createError('Market rate record not found', { code: ErrorCodes.RES_LOAD_NOT_FOUND, details: { rateId } });
      }

      // Update the market rate with the provided data
      Object.assign(marketRate, rateData);

      // Save the updated record to the database
      await marketRate.save();

      // Log the update operation
      logger.info('Market rate record updated', { rateId: marketRate.rate_id });

      // Return the updated market rate
      return marketRate;
    } catch (error) {
      logger.error('Error updating market rate record', { error, rateId, rateData });
      throw createError('Failed to update market rate record', { code: ErrorCodes.DB_QUERY_ERROR, details: { rateId, rateData } });
    }
  }

  /**
   * Retrieves market rates with optional filtering and pagination.
   * This method allows retrieving market rates based on various filter criteria and supports pagination for large datasets.
   *
   * @param filters Optional filters to apply to the query.
   * @param pagination Optional pagination parameters.
   * @returns A promise that resolves with an object containing the market rates and total count.
   */
  async getMarketRates(
    filters: {
      originRegion?: string;
      destinationRegion?: string;
      equipmentType?: EquipmentType;
      startDate?: Date;
      endDate?: Date;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ rates: MarketRate[]; total: number }> {
    // Log the query operation
    logger.info('Retrieving market rates with filters and pagination', { filters, pagination });

    try {
      // Call MarketRate.findAll() with the filters and pagination
      const result = await MarketRate.findAll(filters, pagination);

      // Log the query operation
      logger.info(`Found ${result.rates.length} market rates (total: ${result.total})`, { filters, pagination });

      // Return the market rates and total count
      return result;
    } catch (error) {
      logger.error('Error finding market rates', { error, filters, pagination });
      throw createError('Failed to find market rates', { code: ErrorCodes.DB_QUERY_ERROR, details: { filters, pagination } });
    }
  }

  /**
   * Validates a region name for rate operations.
   * This method checks if a region name is valid according to business rules.
   *
   * @param region The region name to validate.
   * @returns True if the region is valid, false otherwise.
   */
  validateRegion(region: string): boolean {
    // Check if region is defined and not empty
    if (!region || region.trim() === '') {
      return false;
    }

    // Validate region format according to business rules
    const regionRegex = /^[a-zA-Z\s,-]+$/;
    if (!regionRegex.test(region)) {
      return false;
    }

    // Return validation result
    return true;
  }

  /**
   * Normalizes a region name for consistent processing.
   * This method converts a region name to a standard format for consistent processing.
   *
   * @param region The region name to normalize.
   * @returns The normalized region name.
   */
  normalizeRegion(region: string): string {
    // Convert region to uppercase
    let normalizedRegion = region.toUpperCase();

    // Remove any special characters or extra spaces
    normalizedRegion = normalizedRegion.replace(/[^A-Z0-9\s]/g, '').trim();

    // Apply standard abbreviations if applicable
    // Example: "SAINT LOUIS" -> "ST LOUIS"

    // Return the normalized region name
    return normalizedRegion;
  }
}