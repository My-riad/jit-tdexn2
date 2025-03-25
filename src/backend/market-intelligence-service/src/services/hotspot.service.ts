import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import {
  Hotspot,
  HotspotType,
  HotspotSeverity,
  HotspotCreationParams,
  HotspotUpdateParams,
  HotspotQueryParams
} from '../models/hotspot.model';
import { HotspotDetector } from '../algorithms/hotspot-detector';
import { ForecastService } from '../services/forecast.service';
import { RateService } from '../services/rate.service';
import { ForecastTimeframe } from '../models/demand-forecast.model';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import { Position } from '../../../common/interfaces/position.interface';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';
import { getCurrentDateTime, addDays, subtractDays } from '../../../common/utils/date-time';

// Define global constants for the service
const DEFAULT_HOTSPOT_VALIDITY_DAYS = 3;
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const DEFAULT_REGIONS = ['midwest', 'northeast', 'southeast', 'southwest', 'west'];
const DEFAULT_EQUIPMENT_TYPES = [EquipmentType.DRY_VAN, EquipmentType.REFRIGERATED, EquipmentType.FLATBED];

/**
 * Validates hotspot creation or update parameters
 * @param params - The parameters to validate
 * @returns True if parameters are valid, false otherwise
 */
function validateHotspotParams(params: any): boolean {
  // Check if required parameters are present
  if (!params) {
    logger.warn('Hotspot parameters are missing');
    return false;
  }

  // Validate parameter types and values
  if (typeof params.name !== 'string' || params.name.length === 0) {
    logger.warn('Invalid hotspot name');
    return false;
  }

  // Return validation result
  return true;
}

/**
 * Validates hotspot query parameters
 * @param params - The query parameters to validate
 * @returns True if parameters are valid, false otherwise
 */
function validateQueryParams(params: HotspotQueryParams): boolean {
  // Check if at least one query parameter is provided
  if (!params || Object.keys(params).length === 0) {
    logger.warn('No query parameters provided');
    return false;
  }

  // Validate parameter types and values
  if (params.latitude && typeof params.latitude !== 'number') {
    logger.warn('Invalid latitude value');
    return false;
  }

  // Return validation result
  return true;
}

/**
 * Checks if a hotspot is still valid based on its validity period
 * @param hotspot - The hotspot to check
 * @returns True if the hotspot is still valid, false otherwise
 */
function isHotspotValid(hotspot: Hotspot): boolean {
  // Check if hotspot is active
  if (!hotspot.active) {
    return false;
  }

  // Check if current time is between valid_from and valid_until
  const now = new Date();
  return now >= hotspot.valid_from && now <= hotspot.valid_until;
}

/**
 * Interface for hotspot detection accuracy evaluation metrics
 */
export interface HotspotAccuracyMetrics {
  overall_accuracy: number;
  type_accuracy: { [type: string]: number };
  region_accuracy: { [region: string]: number };
  severity_accuracy: { [severity: string]: number };
  equipment_type_accuracy: { [equipmentType: string]: number };
  evaluation_period: { start: Date; end: Date };
  sample_size: number;
}

/**
 * Service for managing hotspots in the freight market
 */
export class HotspotService {
  private hotspotDetector: HotspotDetector;
  private forecastService: ForecastService;
  private rateService: RateService;

  /**
   * Initializes a new HotspotService instance
   */
  constructor() {
    // Initialize HotspotDetector instance
    this.hotspotDetector = new HotspotDetector();

    // Initialize ForecastService instance
    this.forecastService = new ForecastService();

    // Initialize RateService instance
    this.rateService = new RateService();

    // Log service initialization
    logger.info('HotspotService initialized');
  }

  /**
   * Creates a new hotspot in the system
   * @param params - Hotspot creation parameters
   * @returns The created hotspot
   */
  async createHotspot(params: HotspotCreationParams): Promise<Hotspot> {
    // Validate hotspot creation parameters
    if (!validateHotspotParams(params)) {
      throw new AppError('Invalid hotspot creation parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Set default values for any missing parameters
    // Handled in the Hotspot model

    // Use hotspotDetector.createHotspot to create the hotspot
    const newHotspot = await Hotspot.query().insert(params);

    // Log the creation of the new hotspot
    logger.info('Hotspot created', { hotspotId: newHotspot.hotspot_id });

    // Return the created hotspot
    return newHotspot;
  }

  /**
   * Retrieves a specific hotspot by ID
   * @param hotspotId - The ID of the hotspot to retrieve
   * @returns The hotspot with the specified ID or null if not found
   */
  async getHotspotById(hotspotId: string): Promise<Hotspot | null> {
    // Call Hotspot.findById with the specified ID
    const hotspot = await Hotspot.findById(hotspotId);

    // Return the found hotspot or null if not found
    return hotspot || null;
  }

  /**
   * Updates an existing hotspot
   * @param hotspotId - The ID of the hotspot to update
   * @param params - The parameters to update
   * @returns The updated hotspot or null if not found
   */
  async updateHotspot(hotspotId: string, params: HotspotUpdateParams): Promise<Hotspot | null> {
    // Validate update parameters
    if (!validateHotspotParams(params)) {
      throw new AppError('Invalid hotspot update parameters', { code: 'VAL_INVALID_INPUT' });
    }

    // Retrieve the existing hotspot by ID
    const existingHotspot = await Hotspot.findById(hotspotId);

    // If hotspot not found, return null
    if (!existingHotspot) {
      logger.warn(`Hotspot not found with ID: ${hotspotId}`);
      return null;
    }

    // Update the hotspot with the new parameters
    await Hotspot.query().patch(params).where('hotspot_id', hotspotId);

    // Retrieve the updated hotspot
    const updatedHotspot = await Hotspot.findById(hotspotId);

    // Log the update operation
    logger.info('Hotspot updated', { hotspotId });

    // Return the updated hotspot
    return updatedHotspot || null;
  }

  /**
   * Deletes a hotspot from the system
   * @param hotspotId - The ID of the hotspot to delete
   * @returns True if the hotspot was deleted, false if not found
   */
  async deleteHotspot(hotspotId: string): Promise<boolean> {
    // Retrieve the existing hotspot by ID
    const existingHotspot = await Hotspot.findById(hotspotId);

    // If hotspot not found, return false
    if (!existingHotspot) {
      logger.warn(`Hotspot not found with ID: ${hotspotId}`);
      return false;
    }

    // Delete the hotspot from the database
    await Hotspot.query().delete().where('hotspot_id', hotspotId);

    // Log the deletion operation
    logger.info('Hotspot deleted', { hotspotId });

    // Return true indicating successful deletion
    return true;
  }

  /**
   * Deactivates a hotspot without deleting it
   * @param hotspotId - The ID of the hotspot to deactivate
   * @returns The deactivated hotspot or null if not found
   */
  async deactivateHotspot(hotspotId: string): Promise<Hotspot | null> {
    // Retrieve the existing hotspot by ID
    const existingHotspot = await Hotspot.findById(hotspotId);

    // If hotspot not found, return null
    if (!existingHotspot) {
      logger.warn(`Hotspot not found with ID: ${hotspotId}`);
      return null;
    }

    // Set the hotspot's active status to false
    await Hotspot.query().patch({ active: false }).where('hotspot_id', hotspotId);

    // Retrieve the deactivated hotspot
    const deactivatedHotspot = await Hotspot.findById(hotspotId);

    // Log the deactivation operation
    logger.info('Hotspot deactivated', { hotspotId });

    // Return the deactivated hotspot
    return deactivatedHotspot || null;
  }

  /**
   * Queries hotspots based on various parameters
   * @param params - The query parameters
   * @returns Array of hotspots matching the query parameters
   */
  async queryHotspots(params: HotspotQueryParams): Promise<Hotspot[]> {
    // Validate query parameters
    if (!validateQueryParams(params)) {
      throw new AppError('Invalid query parameters', { code: 'VAL_INVALID_INPUT' });
    }

    let query = Hotspot.query();

    if (params.type) {
      query = query.where('type', params.type);
    }
    if (params.severity) {
      query = query.where('severity', params.severity);
    }
    if (params.region) {
      query = query.where('region', params.region);
    }
	if (params.equipment_type) {
		query = query.where('equipment_type', params.equipment_type);
	}
    if (params.latitude && params.longitude && params.radius) {
      query = query.whereRaw(
        `ST_DWithin(ST_MakePoint(longitude, latitude), ST_MakePoint(?, ?), ?)`,
        [params.longitude, params.latitude, params.radius]
      );
    }
    if (params.active_only !== undefined) {
      query = query.where('active', params.active_only);
    }
    if (params.min_confidence) {
      query = query.where('confidence_score', '>=', params.min_confidence);
    }
    if (params.min_bonus) {
      query = query.where('bonus_amount', '>=', params.min_bonus);
    }

    // Execute query against the database
    const hotspots = await query;

    // Log the number of hotspots found
    logger.info(`Found ${hotspots.length} hotspots matching query parameters`);

    // Return the matching hotspots
    return hotspots;
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
   * Retrieves hotspots of a specific severity level
   * @param severity - The severity level to search for
   * @param activeOnly - Whether to return only active hotspots
   * @returns Array of hotspots of the specified severity
   */
  async getHotspotsBySeverity(severity: HotspotSeverity, activeOnly: boolean = true): Promise<Hotspot[]> {
    // Call Hotspot.findBySeverity() with the specified severity and activeOnly flag
    const hotspots = await Hotspot.findBySeverity(severity, activeOnly);

    // Return the array of matching hotspots
    return hotspots;
  }

  /**
   * Retrieves hotspots in a specific region
   * @param region - The region to search in
   * @param activeOnly - Whether to return only active hotspots
   * @returns Array of hotspots in the specified region
   */
  async getHotspotsByRegion(region: string, activeOnly: boolean = true): Promise<Hotspot[]> {
    // Call Hotspot.findByRegion() with the specified region and activeOnly flag
    const hotspots = await Hotspot.findByRegion(region, activeOnly);

    // Return the array of matching hotspots
    return hotspots;
  }

  /**
   * Retrieves hotspots for a specific equipment type
   * @param equipmentType - The equipment type to search for
   * @param activeOnly - Whether to return only active hotspots
   * @returns Array of hotspots for the specified equipment type
   */
  async getHotspotsByEquipmentType(equipmentType: EquipmentType, activeOnly: boolean = true): Promise<Hotspot[]> {
    // Call Hotspot.findByEquipmentType() with the specified equipment type and activeOnly flag
    const hotspots = await Hotspot.findByEquipmentType(equipmentType, activeOnly);

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
   * Detects and creates new hotspots based on market conditions
   * @param options - Options for hotspot detection
   * @returns Array of newly created hotspots
   */
  async detectAndCreateHotspots(options: any = {}): Promise<Hotspot[]> {
    // Extract regions and equipment types from options or use defaults
    const regions = options.regions || DEFAULT_REGIONS;
    const equipmentTypes = options.equipmentTypes || DEFAULT_EQUIPMENT_TYPES;

    // Get the latest forecast from forecastService
    const forecast = await this.forecastService.getLatestForecast(ForecastTimeframe.NEXT_48_HOURS, regions[0], equipmentTypes[0]);

    if (!forecast) {
      logger.warn('No forecast available, skipping hotspot detection');
      return [];
    }

    // Call hotspotDetector.detectHotspots with forecast and parameters
    const detectedHotspots = await this.hotspotDetector.detectHotspots(forecast, regions, equipmentTypes);

    // Filter hotspots based on confidence threshold
    const filteredHotspots = detectedHotspots.filter(hotspot => hotspot.confidence_score && hotspot.confidence_score >= DEFAULT_CONFIDENCE_THRESHOLD);

    // Save the detected hotspots to the database
    const createdHotspots: Hotspot[] = [];
    for (const hotspot of filteredHotspots) {
      const createdHotspot = await Hotspot.query().insert(hotspot);
      createdHotspots.push(createdHotspot);
    }

    // Log the hotspot detection results
    logger.info(`Detected and created ${createdHotspots.length} hotspots`);

    // Return the newly created hotspots
    return createdHotspots;
  }

  /**
   * Detects hotspots based on a specific forecast
   * @param forecastId - The ID of the forecast to use
   * @param options - Options for hotspot detection
   * @returns Array of hotspots detected from the forecast
   */
  async detectHotspotsByForecastId(forecastId: string, options: any = {}): Promise<Hotspot[]> {
    // Call forecastService.getForecastById to retrieve the forecast
    const forecast = await this.forecastService.getForecastById(forecastId);

    // If forecast not found, throw error
    if (!forecast) {
      throw new AppError(`Forecast not found with ID: ${forecastId}`, { code: 'RES_FORECAST_NOT_FOUND' });
    }

    // Call hotspotDetector.detectHotspots with the forecast and options
    const detectedHotspots = await this.hotspotDetector.detectHotspots(forecast);

    // Save the detected hotspots to the database
    const createdHotspots: Hotspot[] = [];
    for (const hotspot of detectedHotspots) {
      const createdHotspot = await Hotspot.query().insert(hotspot);
      createdHotspots.push(createdHotspot);
    }

    // Return the created hotspots
    return createdHotspots;
  }

  /**
   * Evaluates the accuracy of past hotspot detections
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Accuracy metrics for past hotspots
   */
  async evaluateHotspotAccuracy(startDate: Date, endDate: Date): Promise<HotspotAccuracyMetrics> {
    // TODO: Implement the logic to evaluate hotspot accuracy
    logger.info('Evaluating hotspot accuracy', { startDate, endDate });
    return {
      overall_accuracy: 0,
      type_accuracy: {},
      region_accuracy: {},
      severity_accuracy: {},
	  equipment_type_accuracy: {},
      evaluation_period: { start: startDate, end: endDate },
      sample_size: 0
    };
  }

  /**
   * Deactivates hotspots that have passed their valid_until date
   * @returns Number of hotspots deactivated
   */
  async cleanupExpiredHotspots(): Promise<number> {
    // Call Hotspot.deactivateExpired() to update expired hotspots
    const deactivatedCount = await Hotspot.deactivateExpired();

    // Log the number of deactivated hotspots
    logger.info(`Deactivated ${deactivatedCount} expired hotspots`);

    // Return the count of deactivated hotspots
    return deactivatedCount;
  }

  /**
   * Schedules regular hotspot detection runs
   */
  async scheduleHotspotDetection(): Promise<void> {
    // TODO: Implement the logic to schedule hotspot detection runs
    logger.info('Scheduling regular hotspot detection runs');
  }
}

// Export the class for use in other modules
export { HotspotService };

// Export utility functions
export { validateHotspotParams, validateQueryParams, isHotspotValid };