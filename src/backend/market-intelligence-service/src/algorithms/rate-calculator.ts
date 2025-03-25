// rate-calculator.ts
/**
 * Core algorithm for calculating dynamic freight rates based on market conditions,
 * supply/demand ratios, historical trends, and network optimization factors.
 * This module implements the dynamic pricing model that adjusts load rates in
 * real-time to incentivize drivers to move where trucks are needed most.
 */

import { MarketRate } from '../models/market-rate.model'; // Version: N/A - Internal dependency
import { ExternalMarketDataService } from '../integrations/external-market-data'; // Version: N/A - Internal dependency
import { EquipmentType } from '../../../common/interfaces/load.interface'; // Version: N/A - Internal dependency
import logger from '../../../common/utils/logger'; // Version: N/A - Internal dependency
import { calculateDistance } from '../../../common/utils/geo-utils'; // Version: N/A - Internal dependency
import { getCurrentTimestamp, addDays, subtractDays } from '../../../common/utils/date-time'; // Version: N/A - Internal dependency
import { getMarketIntelligenceConfig } from '../config'; // Version: N/A - Internal dependency

/**
 * Interface defining the structure of rate calculation results
 */
export interface RateCalculationResult {
  totalRate: number;
  mileageRate: number;
  baseRate: number;
  adjustmentFactor: number;
  factors: Record<string, number>;
  confidence: number;
  calculatedAt: Date;
}

/**
 * Interface defining the structure of rate trend analysis results
 */
export interface RateTrendAnalysis {
  averageRate: number;
  minRate: number;
  maxRate: number;
  volatility: number;
  trend: string;
  forecast: Array<{ date: Date; prediction: number }>;
  confidence: number;
  dataPoints: number;
}

// Configuration constants for rate calculation
const BASE_MARKET_RATE_WEIGHT = 0.40;
const SUPPLY_DEMAND_WEIGHT = 0.25;
const HISTORICAL_TRENDS_WEIGHT = 0.15;
const URGENCY_WEIGHT = 0.10;
const NETWORK_OPTIMIZATION_WEIGHT = 0.10;
const MIN_RATE_ADJUSTMENT = -0.15;
const MAX_RATE_ADJUSTMENT = 0.30;
const HISTORICAL_DATA_WINDOW_DAYS = 90;

/**
 * Core algorithm class for calculating dynamic freight rates
 */
export class RateCalculator {
  private externalMarketDataService: ExternalMarketDataService;
  private config: any;

  /**
   * Initializes a new RateCalculator instance
   */
  constructor() {
    // Initialize ExternalMarketDataService instance
    this.externalMarketDataService = new ExternalMarketDataService();

    // Load configuration using getMarketIntelligenceConfig()
    this.config = getMarketIntelligenceConfig();

    // Set up logging with service context
    logger.info('RateCalculator initialized');
  }

  /**
   * Calculates a dynamic rate for a lane based on market conditions
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @param options Additional options for rate calculation
   * @returns Calculated rate with breakdown of factors
   */
  async calculateRate(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    options: any
  ): Promise<RateCalculationResult> {
    // Validate input parameters
    if (!originRegion || !destinationRegion || !equipmentType) {
      logger.error('Invalid input parameters for rate calculation', { originRegion, destinationRegion, equipmentType, options });
      throw new Error('Invalid input parameters');
    }

    // Log input parameters for debugging
    logger.info('Calculating rate for lane', { originRegion, destinationRegion, equipmentType, options });

    // Calculate base market rate using calculateBaseRate()
    const baseRate = await calculateBaseRate(originRegion, destinationRegion, equipmentType);

    // Get supply/demand ratio from external market data service
    const supplyDemandRatio = await this.externalMarketDataService.getSupplyDemandRatio(originRegion, destinationRegion, equipmentType);

    // Calculate supply/demand adjustment factor
    const supplyDemandFactor = calculateSupplyDemandFactor(supplyDemandRatio.ratio);

    // Get historical rates and calculate trend factor
    const endDate = new Date();
    const startDate = subtractDays(endDate, HISTORICAL_DATA_WINDOW_DAYS);
    const historicalRates = await MarketRate.findHistoricalRates(originRegion, destinationRegion, equipmentType, startDate, endDate);
    const historicalTrendFactor = calculateHistoricalTrendFactor(historicalRates);

    // Calculate urgency factor based on options
    const urgencyFactor = calculateUrgencyFactor(options);

    // Calculate network optimization value
    const networkOptimizationValue = await calculateNetworkOptimizationValue(originRegion, destinationRegion, equipmentType);

    // Apply weighted combination of all factors to base rate
    let adjustmentFactor =
      (BASE_MARKET_RATE_WEIGHT * 1) + // Base rate always has a factor of 1
      (SUPPLY_DEMAND_WEIGHT * supplyDemandFactor) +
      (HISTORICAL_TRENDS_WEIGHT * historicalTrendFactor) +
      (URGENCY_WEIGHT * urgencyFactor) +
      (NETWORK_OPTIMIZATION_WEIGHT * networkOptimizationValue);

    // Normalize the adjustment factor to be within acceptable bounds
    adjustmentFactor = normalizeAdjustmentFactor(adjustmentFactor);

    // Calculate the total rate
    const totalRate = baseRate * (1 + adjustmentFactor);

    // Calculate confidence score for the rate
    const factors = {
      baseRate: BASE_MARKET_RATE_WEIGHT,
      supplyDemand: SUPPLY_DEMAND_WEIGHT * supplyDemandFactor,
      historicalTrend: HISTORICAL_TRENDS_WEIGHT * historicalTrendFactor,
      urgency: URGENCY_WEIGHT * urgencyFactor,
      networkOptimization: NETWORK_OPTIMIZATION_WEIGHT * networkOptimizationValue
    };
    const confidence = calculateConfidenceScore(factors);

    // Calculate mileage rate
    const distanceMiles = calculateDistance(options.originLatitude, options.originLongitude, options.destinationLatitude, options.destinationLongitude, 'miles');
    const mileageRate = this.calculateMileageRate(totalRate, distanceMiles);

    // Return comprehensive rate calculation result with all factors
    const rateCalculationResult: RateCalculationResult = {
      totalRate,
      mileageRate,
      baseRate,
      adjustmentFactor,
      factors,
      confidence,
      calculatedAt: new Date()
    };

    logger.info('Rate calculation completed', { rateCalculationResult });
    return rateCalculationResult;
  }

  /**
   * Calculates a dynamic rate for a specific load
   * @param load The load object
   * @returns Calculated rate with breakdown of factors
   */
  async calculateLoadRate(load: any): Promise<RateCalculationResult> {
    // Extract origin and destination regions from load locations
    const originLocation = load.locations.find((loc: any) => loc.location_type === 'PICKUP');
    const destinationLocation = load.locations.find((loc: any) => loc.location_type === 'DELIVERY');

    if (!originLocation || !destinationLocation) {
      logger.error('Missing origin or destination location in load', { loadId: load.load_id });
      throw new Error('Missing origin or destination location in load');
    }

    const originRegion = originLocation.city + ', ' + originLocation.state;
    const destinationRegion = destinationLocation.city + ', ' + destinationLocation.state;

    // Extract equipment type from load
    const equipmentType = load.equipment_type;

    // Prepare options based on load characteristics (weight, dimensions, etc.)
    const options = {
      weight: load.weight,
      dimensions: load.dimensions,
      originLatitude: originLocation.latitude,
      originLongitude: originLocation.longitude,
      destinationLatitude: destinationLocation.latitude,
      destinationLongitude: destinationLocation.longitude,
      pickupEarliest: load.pickup_earliest,
      deliveryLatest: load.delivery_latest
    };

    // Calculate distance between origin and destination
    const distanceMiles = calculateDistance(originLocation.latitude, originLocation.longitude, destinationLocation.latitude, destinationLocation.longitude, 'miles');

    // Add time-sensitivity parameters based on pickup/delivery windows
    const pickupWindow = (load.pickup_latest.getTime() - load.pickup_earliest.getTime()) / (60 * 60 * 1000); // hours
    options.pickupWindow = pickupWindow;

    // Call calculateRate() with extracted parameters
    const rateCalculationResult = await this.calculateRate(originRegion, destinationRegion, equipmentType, options);

    logger.info('Load rate calculation completed', { loadId: load.load_id, rateCalculationResult });
    return rateCalculationResult;
  }

  /**
   * Analyzes rate trends for a specific lane and equipment type
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @param days The number of days to look back for trend analysis
   * @returns Analysis of rate trends
   */
  async analyzeRateTrends(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    days: number
  ): Promise<RateTrendAnalysis> {
    // Set default days parameter if not provided
    const trendDays = days || 30;

    // Calculate date range for analysis
    const endDate = new Date();
    const startDate = subtractDays(endDate, trendDays);

    // Retrieve historical rate data for the specified period
    const historicalRates = await MarketRate.findHistoricalRates(originRegion, destinationRegion, equipmentType, startDate, endDate);

    // Calculate rate statistics (min, max, average, median)
    const averageRate = historicalRates.reduce((sum, rate) => sum + rate.average_rate, 0) / historicalRates.length;
    const minRate = Math.min(...historicalRates.map(rate => rate.min_rate));
    const maxRate = Math.max(...historicalRates.map(rate => rate.max_rate));

    // Identify trends using statistical analysis
    const trend = 'stable'; // Implement trend analysis logic here

    // Calculate rate volatility and stability metrics
    const volatility = 0.1; // Implement volatility calculation logic here

    // Generate forecast for future rates
    const forecast = []; // Implement forecasting logic here

    // Calculate confidence score
    const confidence = 0.8; // Implement confidence calculation logic here

    // Return comprehensive trend analysis
    const rateTrendAnalysis: RateTrendAnalysis = {
      averageRate,
      minRate,
      maxRate,
      volatility,
      trend,
      forecast,
      confidence,
      dataPoints: historicalRates.length
    };

    logger.info('Rate trend analysis completed', { originRegion, destinationRegion, equipmentType, trendDays, rateTrendAnalysis });
    return rateTrendAnalysis;
  }

  /**
   * Calculates a per-mile rate based on total distance and base rate
   * @param totalRate The total rate for the load
   * @param distanceMiles The total distance in miles
   * @returns Per-mile rate in dollars
   */
  calculateMileageRate(totalRate: number, distanceMiles: number): number {
    // Validate input parameters
    if (!totalRate || !distanceMiles) {
      logger.error('Invalid input parameters for mileage rate calculation', { totalRate, distanceMiles });
      throw new Error('Invalid input parameters');
    }

    // Calculate per-mile rate by dividing total rate by distance
    let mileageRate = totalRate / distanceMiles;

    // Apply minimum per-mile rate if calculated rate is too low
    const minMileageRate = 2.0; // Minimum acceptable per-mile rate
    if (mileageRate < minMileageRate) {
      mileageRate = minMileageRate;
    }

    // Apply maximum per-mile rate if calculated rate is too high
    const maxMileageRate = 5.0; // Maximum acceptable per-mile rate
    if (mileageRate > maxMileageRate) {
      mileageRate = maxMileageRate;
    }

    logger.info('Mileage rate calculated', { totalRate, distanceMiles, mileageRate });
    return mileageRate;
  }

  /**
   * Applies special rate rules based on load characteristics
   * @param baseRate The base rate for the load
   * @param loadDetails The load details object
   * @returns Adjusted rate after applying special rules
   */
  applySpecialRateRules(baseRate: number, loadDetails: any): number {
    // Validate input parameters
    if (!baseRate || !loadDetails) {
      logger.error('Invalid input parameters for special rate rules', { baseRate, loadDetails });
      throw new Error('Invalid input parameters');
    }

    let adjustedRate = baseRate;

    // Check for hazardous materials and apply surcharge if needed
    if (loadDetails.isHazardous) {
      adjustedRate += 100; // $100 surcharge for hazardous materials
    }

    // Check for temperature-controlled requirements and apply surcharge if needed
    if (loadDetails.temperatureRequirements) {
      adjustedRate += 50; // $50 surcharge for temperature control
    }

    // Apply weight-based adjustments for heavy loads
    if (loadDetails.weight > 40000) {
      adjustedRate += 75; // $75 surcharge for heavy loads
    }

    // Apply dimensional adjustments for oversized loads
    if (loadDetails.dimensions?.length > 53) {
      adjustedRate += 125; // $125 surcharge for oversized loads
    }

    // Apply any seasonal or holiday surcharges
    const currentDate = new Date();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    if (month === 11 && day >= 20 || month === 0 && day <= 5) {
      adjustedRate += 200; // $200 holiday surcharge
    }

    logger.info('Special rate rules applied', { baseRate, loadDetails, adjustedRate });
    return adjustedRate;
  }
}

/**
 * Calculates the base market rate for a lane based on historical and current data
 * @param originRegion The origin region
 * @param destinationRegion The destination region
 * @param equipmentType The equipment type
 * @returns Base market rate in dollars
 */
async function calculateBaseRate(originRegion: string, destinationRegion: string, equipmentType: EquipmentType): Promise<number> {
  try {
    // Try to get current market rate from internal database
    let marketRate = await MarketRate.findByLane(originRegion, destinationRegion, equipmentType);

    // If not found, fetch from external market data service
    if (!marketRate) {
      logger.info('No market rate found in internal database, fetching from external source', { originRegion, destinationRegion, equipmentType });
      const externalMarketData = new ExternalMarketDataService();
      const currentMarketRate = await externalMarketData.getCurrentMarketRate(originRegion, destinationRegion, equipmentType);

      // Create a new MarketRate instance
      marketRate = new MarketRate({
        origin_region: originRegion,
        destination_region: destinationRegion,
        equipment_type: equipmentType,
        average_rate: currentMarketRate.rate,
        min_rate: currentMarketRate.min,
        max_rate: currentMarketRate.max,
        sample_size: 10, // Assuming a default sample size
        recorded_at: new Date()
      });

      // Save the market rate to the database
      await marketRate.save();
    }

    // Apply validation to ensure rate is within reasonable bounds
    if (marketRate.average_rate <= 0) {
      logger.warn('Invalid base rate found, using default value', { originRegion, destinationRegion, equipmentType, rate: marketRate.average_rate });
      return 1000; // Default base rate
    }

    // Log the base rate calculation
    logger.info('Base rate calculated', { originRegion, destinationRegion, equipmentType, rate: marketRate.average_rate });

    // Return the calculated base rate
    return marketRate.average_rate;
  } catch (error) {
    logger.error('Error calculating base rate', { error, originRegion, destinationRegion, equipmentType });
    throw error;
  }
}

/**
 * Calculates an adjustment factor based on current supply/demand ratio
 * @param supplyDemandRatio Supply/demand ratio
 * @returns Adjustment factor between MIN_RATE_ADJUSTMENT and MAX_RATE_ADJUSTMENT
 */
function calculateSupplyDemandFactor(supplyDemandRatio: number): number {
  // Analyze the supply/demand ratio (values < 1 indicate higher demand than supply)
  let adjustment = 0;

  // Calculate adjustment factor based on the ratio
  if (supplyDemandRatio < 1) {
    adjustment = 0.1 * (1 - supplyDemandRatio); // Increase rate if demand is higher
  } else {
    adjustment = -0.05 * (supplyDemandRatio - 1); // Decrease rate if supply is higher
  }

  // Apply logarithmic scaling to prevent extreme adjustments
  adjustment = Math.log(1 + Math.abs(adjustment)) * Math.sign(adjustment);

  // Ensure adjustment is within MIN_RATE_ADJUSTMENT and MAX_RATE_ADJUSTMENT bounds
  adjustment = normalizeAdjustmentFactor(adjustment);

  logger.info('Supply/demand factor calculated', { supplyDemandRatio, adjustment });
  return adjustment;
}

/**
 * Calculates an adjustment factor based on historical rate trends
 * @param historicalRates Array of historical rates
 * @returns Adjustment factor based on historical trends
 */
function calculateHistoricalTrendFactor(historicalRates: Array<{ rate: number; date: Date }>): number {
  // Analyze historical rate data to identify trends
  let trendFactor = 0;

  // Calculate rate of change over different time periods
  if (historicalRates.length > 2) {
    const recentRate = historicalRates[historicalRates.length - 1].rate;
    const pastRate = historicalRates[0].rate;
    trendFactor = (recentRate - pastRate) / pastRate;
  }

  // Apply weighted average to recent vs older trends
  trendFactor *= 0.5; // Reduce impact of historical trends

  // Normalize the trend factor to a reasonable adjustment range
  trendFactor = normalizeAdjustmentFactor(trendFactor);

  logger.info('Historical trend factor calculated', { trendFactor });
  return trendFactor;
}

/**
 * Calculates an adjustment factor based on the urgency of the load
 * @param options Options object
 * @returns Urgency-based adjustment factor
 */
function calculateUrgencyFactor(options: any): number {
  // Extract time-sensitive parameters from options
  const pickupWindow = options.pickupWindow || 4; // Default 4-hour pickup window

  // Calculate time remaining until pickup/delivery deadlines
  let urgencyFactor = 0;

  // Determine urgency level based on time windows
  if (pickupWindow < 2) {
    urgencyFactor = 0.1; // High urgency
  } else if (pickupWindow < 4) {
    urgencyFactor = 0.05; // Medium urgency
  }

  // Apply higher adjustments for more urgent loads
  urgencyFactor *= 0.2; // Reduce overall impact of urgency

  logger.info('Urgency factor calculated', { pickupWindow, urgencyFactor });
  return urgencyFactor;
}

/**
 * Calculates the value of a load to overall network optimization
 * @param originRegion The origin region
 * @param destinationRegion The destination region
 * @param equipmentType The equipment type
 * @returns Network optimization value as an adjustment factor
 */
async function calculateNetworkOptimizationValue(originRegion: string, destinationRegion: string, equipmentType: EquipmentType): Promise<number> {
  // Analyze current network state and imbalances
  let optimizationValue = 0;

  // Determine if the load helps address network imbalances
  const isBackhaul = originRegion > destinationRegion; // Simplified backhaul check

  // Calculate value based on how much the load improves network efficiency
  if (isBackhaul) {
    optimizationValue = 0.05; // Reward backhaul loads
  }

  // Apply higher adjustments for loads that significantly improve network balance
  optimizationValue *= 0.3; // Reduce overall impact of network optimization

  logger.info('Network optimization value calculated', { originRegion, destinationRegion, equipmentType, optimizationValue });
  return optimizationValue;
}

/**
 * Ensures an adjustment factor is within acceptable bounds
 * @param factor The adjustment factor
 * @returns Normalized adjustment factor
 */
function normalizeAdjustmentFactor(factor: number): number {
  // Check if factor is outside MIN_RATE_ADJUSTMENT and MAX_RATE_ADJUSTMENT bounds
  let normalizedFactor = factor;

  // If below minimum, set to MIN_RATE_ADJUSTMENT
  if (normalizedFactor < MIN_RATE_ADJUSTMENT) {
    normalizedFactor = MIN_RATE_ADJUSTMENT;
  }

  // If above maximum, set to MAX_RATE_ADJUSTMENT
  if (normalizedFactor > MAX_RATE_ADJUSTMENT) {
    normalizedFactor = MAX_RATE_ADJUSTMENT;
  }

  logger.info('Adjustment factor normalized', { factor, normalizedFactor });
  return normalizedFactor;
}

/**
 * Calculates a confidence score for the rate calculation
 * @param factors Object containing individual factors
 * @returns Confidence score between 0 and 1
 */
function calculateConfidenceScore(factors: any): number {
  // Evaluate data quality for each factor
  let confidence = 1;

  // Consider sample size and data freshness
  if (factors.baseRate < 0.5) {
    confidence -= 0.1;
  }
  if (factors.supplyDemand < 0.5) {
    confidence -= 0.05;
  }
  if (factors.historicalTrend < 0.5) {
    confidence -= 0.05;
  }

  // Apply weighted scoring based on factor importance
  confidence = Math.max(0, Math.min(1, confidence)); // Ensure between 0 and 1

  logger.info('Confidence score calculated', { factors, confidence });
  return confidence;
}

// Export the RateCalculator class
export { RateCalculator };

// Export the RateCalculationResult interface
export type { RateCalculationResult };

// Export the RateTrendAnalysis interface
export type { RateTrendAnalysis };

// Export utility functions for individual factor calculations
export { calculateBaseRate };
export { calculateSupplyDemandFactor };
export { calculateHistoricalTrendFactor };