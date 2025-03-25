import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import {
  Hotspot,
  HotspotType,
  HotspotSeverity,
  HotspotCreationParams,
  MarketRate,
} from '../models/hotspot.model';
import {
  DemandForecast,
  RegionalDemandForecast,
  LaneDemandForecast,
  DemandLevel,
} from '../models/demand-forecast.model';
import { ExternalMarketDataService } from '../integrations/external-market-data';
import { Position } from '../../../common/interfaces/position.interface';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import {
  calculateDistance,
  calculateBoundingBox,
  createCirclePolygon,
} from '../../../common/utils/geo-utils';
import { logger } from '../../../common/utils/logger';
import { getCurrentDateTime, addDays, subtractDays } from '../../../common/utils/date-time';

// Global constants for hotspot detection
const DEFAULT_HOTSPOT_RADIUS_KM = 50; // Default hotspot radius in kilometers
const DEFAULT_HOTSPOT_VALIDITY_DAYS = 3; // Default hotspot validity period in days
const HIGH_DEMAND_THRESHOLD = 0.8; // Threshold for high demand levels
const SUPPLY_SHORTAGE_THRESHOLD = 0.6; // Threshold for supply shortages
const RATE_OPPORTUNITY_THRESHOLD = 0.15; // Threshold for rate opportunities
const CONFIDENCE_THRESHOLD = 0.7; // Minimum confidence score for hotspot validity
const HISTORICAL_DATA_DAYS = 30; // Number of days to look back for historical data
const DEFAULT_BONUS_AMOUNT = 100; // Default bonus amount for hotspots

/**
 * Calculates the severity level of a hotspot based on various factors
 * @param demandScore - Demand score (0-1)
 * @param confidenceScore - Confidence score (0-1)
 * @param supplyDemandRatio - Supply/demand ratio
 * @returns Severity level of the hotspot (LOW, MEDIUM, HIGH, CRITICAL)
 */
function calculateHotspotSeverity(
  demandScore: number,
  confidenceScore: number,
  supplyDemandRatio: number
): HotspotSeverity {
  // Calculate a composite score based on demand, confidence, and supply/demand ratio
  const compositeScore = (demandScore * 0.5) + (confidenceScore * 0.3) - (supplyDemandRatio * 0.2);

  // Apply thresholds to determine the appropriate severity level
  if (compositeScore >= 0.8) {
    return HotspotSeverity.CRITICAL;
  } else if (compositeScore >= 0.6) {
    return HotspotSeverity.HIGH;
  } else if (compositeScore >= 0.4) {
    return HotspotSeverity.MEDIUM;
  } else {
    return HotspotSeverity.LOW;
  }
}

/**
 * Calculates the bonus amount for a hotspot based on severity and market conditions
 * @param severity - Severity level of the hotspot
 * @param type - Type of the hotspot
 * @param baseRate - Base rate for the lane
 * @returns Calculated bonus amount in dollars
 */
function calculateBonusAmount(
  severity: HotspotSeverity,
  type: HotspotType,
  baseRate: number
): number {
  // Start with a base bonus amount
  let bonusAmount = DEFAULT_BONUS_AMOUNT;

  // Apply multipliers based on hotspot severity
  switch (severity) {
    case HotspotSeverity.CRITICAL:
      bonusAmount *= 1.5;
      break;
    case HotspotSeverity.HIGH:
      bonusAmount *= 1.2;
      break;
    case HotspotSeverity.MEDIUM:
      bonusAmount *= 1.1;
      break;
    case HotspotSeverity.LOW:
      bonusAmount *= 1.05;
      break;
  }

  // Apply adjustments based on hotspot type
  switch (type) {
    case HotspotType.DEMAND_SURGE:
      bonusAmount *= 1.1;
      break;
    case HotspotType.SUPPLY_SHORTAGE:
      bonusAmount *= 1.2;
      break;
    case HotspotType.RATE_OPPORTUNITY:
      bonusAmount *= 0.9;
      break;
    case HotspotType.REPOSITIONING_NEED:
      bonusAmount *= 1.15;
      break;
    case HotspotType.WEATHER_IMPACT:
      bonusAmount *= 1.3;
      break;
  }

  // Consider the base rate for percentage-based calculations
  if (baseRate > 0) {
    bonusAmount = Math.max(bonusAmount, baseRate * 0.05); // Ensure bonus is at least 5% of base rate
  }

  // Ensure the bonus amount is within reasonable limits
  bonusAmount = Math.min(bonusAmount, 500); // Cap at $500

  return bonusAmount;
}

/**
 * Merges overlapping hotspots of the same type to prevent duplication
 * @param hotspots - Array of hotspots to merge
 * @returns Array of merged hotspots with duplicates removed
 */
function mergeOverlappingHotspots(hotspots: HotspotCreationParams[]): HotspotCreationParams[] {
  // Group hotspots by type
  const hotspotsByType: { [type: string]: HotspotCreationParams[] } = {};
  for (const hotspot of hotspots) {
    if (!hotspotsByType[hotspot.type]) {
      hotspotsByType[hotspot.type] = [];
    }
    hotspotsByType[hotspot.type].push(hotspot);
  }

  const mergedHotspots: HotspotCreationParams[] = [];

  // For each type, identify hotspots with overlapping areas
  for (const type in hotspotsByType) {
    if (hotspotsByType.hasOwnProperty(type)) {
      const hotspotsOfType = hotspotsByType[type];

      // TODO: Implement overlap detection and merging logic
      // This is a placeholder - implement actual merging logic here
      // For now, just add all hotspots of this type to the merged list
      mergedHotspots.push(...hotspotsOfType);
    }
  }

  return mergedHotspots;
}

/**
 * Detects areas with high demand based on forecast data
 * @param forecast - Demand forecast data
 * @returns Array of hotspot creation parameters for demand surge areas
 */
async function detectDemandSurgeHotspots(
  forecast: DemandForecast
): Promise<HotspotCreationParams[]> {
  const hotspots: HotspotCreationParams[] = [];

  // Analyze regional forecasts from the demand forecast data
  if (forecast.regional_forecasts) {
    for (const regionalForecast of forecast.regional_forecasts) {
      // Identify regions with demand levels above the HIGH_DEMAND_THRESHOLD
      if (
        regionalForecast.demand_levels &&
        Object.values(regionalForecast.demand_levels).some(
          (level) => level === DemandLevel.HIGH || level === DemandLevel.VERY_HIGH
        )
      ) {
        // Filter out regions with low confidence scores
        if (regionalForecast.confidence_score >= CONFIDENCE_THRESHOLD) {
          // Create hotspot parameters for each identified region
          const hotspotParams: HotspotCreationParams = {
            name: `Demand Surge in ${regionalForecast.region}`,
            type: HotspotType.DEMAND_SURGE,
            severity: calculateHotspotSeverity(
              regionalForecast.confidence_score,
              regionalForecast.confidence_score,
              0.5 // Placeholder - replace with actual supply/demand ratio
            ),
            center: regionalForecast.center,
            radius: regionalForecast.radius || DEFAULT_HOTSPOT_RADIUS_KM,
            confidence_score: regionalForecast.confidence_score,
            region: regionalForecast.region,
            bonus_amount: calculateBonusAmount(
              calculateHotspotSeverity(
                regionalForecast.confidence_score,
                regionalForecast.confidence_score,
                0.5 // Placeholder - replace with actual supply/demand ratio
              ),
              HotspotType.DEMAND_SURGE,
              0 // Placeholder - replace with actual base rate
            ),
          };
          hotspots.push(hotspotParams);
        }
      }
    }
  }

  return hotspots;
}

/**
 * Detects areas with supply shortages based on supply/demand ratios
 * @param regions - Array of regions to check
 * @param equipmentTypes - Array of equipment types to check
 * @returns Array of hotspot creation parameters for supply shortage areas
 */
async function detectSupplyShortageHotspots(
  regions: string[],
  equipmentTypes: EquipmentType[]
): Promise<HotspotCreationParams[]> {
  const hotspots: HotspotCreationParams[] = [];

  // For each region and equipment type, retrieve supply/demand ratio
  for (const region of regions) {
    for (const equipmentType of equipmentTypes) {
      // TODO: Implement logic to retrieve supply/demand ratio
      const supplyDemandRatio = 0.4; // Placeholder - replace with actual data

      // Identify combinations with ratios below the SUPPLY_SHORTAGE_THRESHOLD
      if (supplyDemandRatio < SUPPLY_SHORTAGE_THRESHOLD) {
        // Create hotspot parameters for each identified shortage
        const hotspotParams: HotspotCreationParams = {
          name: `Supply Shortage in ${region} for ${equipmentType}`,
          type: HotspotType.SUPPLY_SHORTAGE,
          severity: calculateHotspotSeverity(
            0.7, // Placeholder - replace with actual demand score
            0.8, // Placeholder - replace with actual confidence score
            supplyDemandRatio
          ),
          center: { latitude: 0, longitude: 0 }, // Placeholder - replace with actual coordinates
          radius: DEFAULT_HOTSPOT_RADIUS_KM,
          confidence_score: 0.8, // Placeholder - replace with actual confidence score
          region: region,
          equipment_type: equipmentType,
          bonus_amount: calculateBonusAmount(
            calculateHotspotSeverity(
              0.7, // Placeholder - replace with actual demand score
              0.8, // Placeholder - replace with actual confidence score
              supplyDemandRatio
            ),
            HotspotType.SUPPLY_SHORTAGE,
            0 // Placeholder - replace with actual base rate
          ),
        };
        hotspots.push(hotspotParams);
      }
    }
  }

  return hotspots;
}

/**
 * Detects lanes with favorable rate opportunities based on market data
 * @param regions - Array of regions to check
 * @param equipmentTypes - Array of equipment types to check
 * @returns Array of hotspot creation parameters for rate opportunity areas
 */
async function detectRateOpportunityHotspots(
  regions: string[],
  equipmentTypes: EquipmentType[]
): Promise<HotspotCreationParams[]> {
  const hotspots: HotspotCreationParams[] = [];

  // For each origin-destination pair and equipment type, analyze historical rates
  for (const originRegion of regions) {
    for (const destinationRegion of regions) {
      if (originRegion === destinationRegion) continue; // Skip same-region lanes
      for (const equipmentType of equipmentTypes) {
        // TODO: Implement logic to retrieve current and historical rates
        const currentRate = 1200; // Placeholder - replace with actual data
        const historicalAverageRate = 1000; // Placeholder - replace with actual data

        // Identify lanes with rates above the RATE_OPPORTUNITY_THRESHOLD
        if (currentRate > historicalAverageRate * (1 + RATE_OPPORTUNITY_THRESHOLD)) {
          // Create hotspot parameters for each identified opportunity
          const hotspotParams: HotspotCreationParams = {
            name: `Rate Opportunity: ${originRegion} -> ${destinationRegion} for ${equipmentType}`,
            type: HotspotType.RATE_OPPORTUNITY,
            severity: calculateHotspotSeverity(
              0.6, // Placeholder - replace with actual demand score
              0.7, // Placeholder - replace with actual confidence score
              0.6 // Placeholder - replace with actual supply/demand ratio
            ),
            center: { latitude: 0, longitude: 0 }, // Placeholder - replace with actual coordinates
            radius: DEFAULT_HOTSPOT_RADIUS_KM,
            confidence_score: 0.7, // Placeholder - replace with actual confidence score
            region: originRegion,
            equipment_type: equipmentType,
            bonus_amount: calculateBonusAmount(
              calculateHotspotSeverity(
                0.6, // Placeholder - replace with actual demand score
                0.7, // Placeholder - replace with actual confidence score
                0.6 // Placeholder - replace with actual supply/demand ratio
              ),
              HotspotType.RATE_OPPORTUNITY,
              currentRate // Use current rate as base
            ),
          };
          hotspots.push(hotspotParams);
        }
      }
    }
  }

  return hotspots;
}

/**
 * Detects areas where truck repositioning is needed based on network imbalances
 * @param forecast - Demand forecast data
 * @returns Array of hotspot creation parameters for repositioning need areas
 */
async function detectRepositioningNeedHotspots(
  forecast: DemandForecast
): Promise<HotspotCreationParams[]> {
  const hotspots: HotspotCreationParams[] = [];

  // Analyze lane forecasts to identify imbalanced flows
  if (forecast.lane_forecasts) {
    for (const laneForecast of forecast.lane_forecasts) {
      // TODO: Implement logic to compare inbound and outbound demand
      const inboundDemand = 0.3; // Placeholder - replace with actual data
      const outboundDemand = 0.7; // Placeholder - replace with actual data

      // Identify origin regions with high outbound demand but low inbound demand
      if (outboundDemand > inboundDemand * 2) {
        // Create hotspot parameters for each identified repositioning need
        const hotspotParams: HotspotCreationParams = {
          name: `Repositioning Need in ${laneForecast.origin_region}`,
          type: HotspotType.REPOSITIONING_NEED,
          severity: calculateHotspotSeverity(
            0.7, // Placeholder - replace with actual demand score
            0.7, // Placeholder - replace with actual confidence score
            0.5 // Placeholder - replace with actual supply/demand ratio
          ),
          center: laneForecast.origin_coordinates,
          radius: DEFAULT_HOTSPOT_RADIUS_KM,
          confidence_score: laneForecast.confidence_score,
          region: laneForecast.origin_region,
          bonus_amount: calculateBonusAmount(
            calculateHotspotSeverity(
              0.7, // Placeholder - replace with actual demand score
              0.7, // Placeholder - replace with actual confidence score
              0.5 // Placeholder - replace with actual supply/demand ratio
            ),
            HotspotType.REPOSITIONING_NEED,
            0 // Placeholder - replace with actual base rate
          ),
        };
        hotspots.push(hotspotParams);
      }
    }
  }

  return hotspots;
}

/**
 * Detects areas with significant weather impacts that affect freight movement
 * @returns Array of hotspot creation parameters for weather impact areas
 */
async function detectWeatherImpactHotspots(): Promise<HotspotCreationParams[]> {
  const hotspots: HotspotCreationParams[] = [];

  // TODO: Implement logic to retrieve weather impact data from external service
  // Retrieve weather impact data from external market data service
  // const weatherImpacts = await this.marketDataService.getWeatherImpacts();

  // Placeholder data for testing
  const weatherImpacts = [
    {
      region: 'Midwest',
      impact: 'high',
      startDate: new Date(),
      endDate: addDays(new Date(), 2),
      description: 'Severe thunderstorms and flooding expected',
    },
  ];

  // For each identified weather impact area, create hotspot parameters
  for (const weatherImpact of weatherImpacts) {
    const hotspotParams: HotspotCreationParams = {
      name: `Weather Impact in ${weatherImpact.region}`,
      type: HotspotType.WEATHER_IMPACT,
      severity: weatherImpact.impact === 'severe' ? HotspotSeverity.CRITICAL : HotspotSeverity.HIGH,
      center: { latitude: 0, longitude: 0 }, // Placeholder - replace with actual coordinates
      radius: DEFAULT_HOTSPOT_RADIUS_KM,
      valid_from: weatherImpact.startDate,
      valid_until: weatherImpact.endDate,
      region: weatherImpact.region,
      confidence_score: 0.9, // Placeholder - replace with actual confidence score
      bonus_amount: calculateBonusAmount(
        weatherImpact.impact === 'severe' ? HotspotSeverity.CRITICAL : HotspotSeverity.HIGH,
        HotspotType.WEATHER_IMPACT,
        0 // Placeholder - replace with actual base rate
      ),
    };
    hotspots.push(hotspotParams);
  }

  return hotspots;
}

/**
 * Core class responsible for detecting and managing hotspots in the freight market
 */
class HotspotDetector {
  private marketDataService: ExternalMarketDataService;

  /**
   * Initializes a new HotspotDetector instance
   * @param options - Options for configuring the HotspotDetector
   */
  constructor(options: any = {}) {
    // Initialize ExternalMarketDataService for market data
    this.marketDataService = new ExternalMarketDataService();

    // Set up any configuration options
    // Placeholder - implement configuration options here

    // Log successful initialization
    logger.info('HotspotDetector initialized');
  }

  /**
   * Detects all types of hotspots based on current market conditions and forecasts
   * @param forecast - Demand forecast data
   * @param regions - Array of regions to check
   * @param equipmentTypes - Array of equipment types to check
   * @returns Array of detected and created hotspots
   */
  async detectHotspots(
    forecast: DemandForecast,
    regions: string[] = ['Midwest', 'Southeast', 'Southwest', 'Northeast', 'West'],
    equipmentTypes: EquipmentType[] = [EquipmentType.DRY_VAN, EquipmentType.REFRIGERATED, EquipmentType.FLATBED]
  ): Promise<Hotspot[]> {
    // Validate input parameters
    if (!forecast) {
      throw new Error('Demand forecast is required');
    }

    // Set default regions and equipment types if not provided
    // Regions and equipmentTypes are defaulted in the function signature

    // Detect demand surge hotspots from forecast data
    const demandSurgeHotspotsParams = await detectDemandSurgeHotspots(forecast);

    // Detect supply shortage hotspots for specified regions and equipment types
    const supplyShortageHotspotsParams = await detectSupplyShortageHotspots(regions, equipmentTypes);

    // Detect rate opportunity hotspots for specified regions and equipment types
    const rateOpportunityHotspotsParams = await detectRateOpportunityHotspots(regions, equipmentTypes);

    // Detect repositioning need hotspots from forecast data
    const repositioningNeedHotspotsParams = await detectRepositioningNeedHotspots(forecast);

    // Detect weather impact hotspots
    const weatherImpactHotspotsParams = await detectWeatherImpactHotspots();

    // Merge overlapping hotspots to prevent duplication
    const allHotspotsParams = [
      ...demandSurgeHotspotsParams,
      ...supplyShortageHotspotsParams,
      ...rateOpportunityHotspotsParams,
      ...repositioningNeedHotspotsParams,
      ...weatherImpactHotspotsParams,
    ];
    const mergedHotspotsParams = mergeOverlappingHotspots(allHotspotsParams);

    // Create Hotspot records in the database for each detected hotspot
    const createdHotspots: Hotspot[] = [];
    for (const hotspotParams of mergedHotspotsParams) {
      const createdHotspot = await this.createHotspot(hotspotParams);
      createdHotspots.push(createdHotspot);
    }

    // Return array of created Hotspot instances
    return createdHotspots;
  }

  /**
   * Detects areas with high demand based on forecast data
   * @param forecast - Demand forecast data
   * @returns Array of created demand surge hotspots
   */
  async detectDemandSurgeHotspots(forecast: DemandForecast): Promise<Hotspot[]> {
    // Call the detectDemandSurgeHotspots function to get hotspot parameters
    const demandSurgeHotspotsParams = await detectDemandSurgeHotspots(forecast);

    // Create Hotspot records in the database for each detected hotspot
    const createdHotspots: Hotspot[] = [];
    for (const hotspotParams of demandSurgeHotspotsParams) {
      const createdHotspot = await this.createHotspot(hotspotParams);
      createdHotspots.push(createdHotspot);
    }

    // Return array of created Hotspot instances
    return createdHotspots;
  }

  /**
   * Detects areas with supply shortages based on supply/demand ratios
   * @param regions - Array of regions to check
   * @param equipmentTypes - Array of equipment types to check
   * @returns Array of created supply shortage hotspots
   */
  async detectSupplyShortageHotspots(
    regions: string[],
    equipmentTypes: EquipmentType[]
  ): Promise<Hotspot[]> {
    // Call the detectSupplyShortageHotspots function to get hotspot parameters
    const supplyShortageHotspotsParams = await detectSupplyShortageHotspots(regions, equipmentTypes);

    // Create Hotspot records in the database for each detected hotspot
    const createdHotspots: Hotspot[] = [];
    for (const hotspotParams of supplyShortageHotspotsParams) {
      const createdHotspot = await this.createHotspot(hotspotParams);
      createdHotspots.push(createdHotspot);
    }

    // Return array of created Hotspot instances
    return createdHotspots;
  }

  /**
   * Detects lanes with favorable rate opportunities based on market data
   * @param regions - Array of regions to check
   * @param equipmentTypes - Array of equipment types to check
   * @returns Array of created rate opportunity hotspots
   */
  async detectRateOpportunityHotspots(
    regions: string[],
    equipmentTypes: EquipmentType[]
  ): Promise<Hotspot[]> {
    // Call the detectRateOpportunityHotspots function to get hotspot parameters
    const rateOpportunityHotspotsParams = await detectRateOpportunityHotspots(regions, equipmentTypes);

    // Create Hotspot records in the database for each detected hotspot
    const createdHotspots: Hotspot[] = [];
    for (const hotspotParams of rateOpportunityHotspotsParams) {
      const createdHotspot = await this.createHotspot(hotspotParams);
      createdHotspots.push(createdHotspot);
    }

    // Return array of created Hotspot instances
    return createdHotspots;
  }

  /**
   * Detects areas where truck repositioning is needed based on network imbalances
   * @param forecast - Demand forecast data
   * @returns Array of created repositioning need hotspots
   */
  async detectRepositioningNeedHotspots(forecast: DemandForecast): Promise<Hotspot[]> {
    // Call the detectRepositioningNeedHotspots function to get hotspot parameters
    const repositioningNeedHotspotsParams = await detectRepositioningNeedHotspots(forecast);

    // Create Hotspot records in the database for each detected hotspot
    const createdHotspots: Hotspot[] = [];
    for (const hotspotParams of repositioningNeedHotspotsParams) {
      const createdHotspot = await this.createHotspot(hotspotParams);
      createdHotspots.push(createdHotspot);
    }

    // Return array of created Hotspot instances
    return createdHotspots;
  }

  /**
   * Detects areas with significant weather impacts that affect freight movement
   * @returns Array of created weather impact hotspots
   */
  async detectWeatherImpactHotspots(): Promise<Hotspot[]> {
    // Call the detectWeatherImpactHotspots function to get hotspot parameters
    const weatherImpactHotspotsParams = await detectWeatherImpactHotspots();

    // Create Hotspot records in the database for each detected hotspot
    const createdHotspots: Hotspot[] = [];
    for (const hotspotParams of weatherImpactHotspotsParams) {
      const createdHotspot = await this.createHotspot(hotspotParams);
      createdHotspots.push(createdHotspot);
    }

    // Return array of created Hotspot instances
    return createdHotspots;
  }

  /**
   * Retrieves all currently active hotspots
   * @returns Array of active hotspots
   */
  async getActiveHotspots(): Promise<Hotspot[]> {
    // Call Hotspot.findActive() to retrieve active hotspots
    const activeHotspots = await Hotspot.findActive();

    // Return the array of active hotspots
    return activeHotspots;
  }

  /**
   * Retrieves hotspots of a specific type
   * @param type - The hotspot type to search for
   * @param activeOnly - Whether to return only active hotspots
   * @returns Array of hotspots of the specified type
   */
  async getHotspotsByType(type: HotspotType, activeOnly: boolean = true): Promise<Hotspot[]> {
    // Call Hotspot.findByType() with the specified type and activeOnly flag
    const hotspots = await Hotspot.findByType(type, activeOnly);

    // Return the array of matching hotspots
    return hotspots;
  }

  /**
   * Retrieves hotspots near a specific location
   * @param latitude - The latitude of the location
   * @param longitude - The longitude of the location
   * @param radiusKm - The search radius in kilometers
   * @param activeOnly - Whether to return only active hotspots
   * @returns Array of hotspots near the specified location
   */
  async getHotspotsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    activeOnly: boolean = true
  ): Promise<Hotspot[]> {
    // Call Hotspot.findNearLocation() with the specified parameters
    const hotspots = await Hotspot.findNearLocation(latitude, longitude, radiusKm, activeOnly);

    // Return the array of nearby hotspots
    return hotspots;
  }

  /**
   * Creates a new hotspot in the database
   * @param params - Hotspot creation parameters
   * @returns The created hotspot
   */
  async createHotspot(params: HotspotCreationParams): Promise<Hotspot> {
    // Validate the hotspot creation parameters
    if (!params) {
      throw new Error('Hotspot creation parameters are required');
    }

    // Set default values for any missing parameters
    // Handled in the Hotspot model

    // Create a new Hotspot instance with the parameters
    const newHotspot = new Hotspot(params);

    // Save the hotspot to the database
    await newHotspot.save();

    // Return the created hotspot instance
    return newHotspot;
  }

  /**
   * Deactivates hotspots that have passed their valid_until date
   * @returns Number of hotspots deactivated
   */
  async deactivateExpiredHotspots(): Promise<number> {
    // Call Hotspot.deactivateExpired() to update expired hotspots
    const deactivatedCount = await Hotspot.deactivateExpired();

    // Log the number of deactivated hotspots
    logger.info(`Deactivated ${deactivatedCount} expired hotspots`);

    // Return the count of deactivated hotspots
    return deactivatedCount;
  }
}

// Export the class for use in other modules
export { HotspotDetector };

// Export utility functions
export { calculateHotspotSeverity, calculateBonusAmount, mergeOverlappingHotspots };