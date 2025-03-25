import { Transaction } from 'objection'; // v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import BonusZoneModel from '../models/bonus-zone.model';
import DriverBonusModel from '../models/driver-bonus.model';
import { Position, Driver } from '../../../common/interfaces';
import { createCirclePolygon, calculateDistance } from '../../../common/utils/geo-utils';
import { AppError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { getKnexInstance } from '../../../common/config/database.config';
import { calculateBonusAmount } from '../../market-intelligence-service/src/algorithms/hotspot-detector';

// Global constants for bonus zone management
const DEFAULT_BONUS_ZONE_RADIUS_KM = 25; // Default bonus zone radius in kilometers
const MIN_BONUS_ZONE_RADIUS_KM = 5; // Minimum bonus zone radius in kilometers
const MAX_BONUS_ZONE_RADIUS_KM = 100; // Maximum bonus zone radius in kilometers
const DEFAULT_BONUS_MULTIPLIER = 1.5; // Default bonus multiplier
const MAX_BONUS_MULTIPLIER = 3.0; // Maximum bonus multiplier

/**
 * Service class for managing bonus zones in the gamification system
 */
export class BonusZoneService {
  private knex;

  /**
   * Initializes a new BonusZoneService instance
   */
  constructor() {
    // Initialize database connection using getKnexInstance()
    this.knex = getKnexInstance();

    // Log service initialization
    logger.info('BonusZoneService initialized');
  }

  /**
   * Creates a new bonus zone in the system
   * @param zoneData - Data for the new bonus zone
   * @returns The newly created bonus zone
   */
  async createBonusZone(zoneData: any): Promise<BonusZoneModel> {
    // Validate zone data (name, boundary, multiplier, etc.)
    if (!zoneData.name || !zoneData.boundary || !zoneData.multiplier || !zoneData.reason || !zoneData.startTime || !zoneData.endTime) {
      throw new AppError('Missing required fields for bonus zone', { code: 'VAL_INVALID_INPUT' });
    }

    // Ensure multiplier is within allowed range
    if (zoneData.multiplier < 1.0 || zoneData.multiplier > MAX_BONUS_MULTIPLIER) {
      throw new AppError(`Multiplier must be between 1.0 and ${MAX_BONUS_MULTIPLIER}`, { code: 'VAL_INVALID_INPUT' });
    }

    // Ensure radius is within allowed range if creating circular zone
    if (zoneData.radius && (zoneData.radius < MIN_BONUS_ZONE_RADIUS_KM || zoneData.radius > MAX_BONUS_ZONE_RADIUS_KM)) {
      throw new AppError(`Radius must be between ${MIN_BONUS_ZONE_RADIUS_KM} and ${MAX_BONUS_ZONE_RADIUS_KM} km`, { code: 'VAL_INVALID_INPUT' });
    }

    try {
      // Create the bonus zone record in the database
      const bonusZone = await BonusZoneModel.query().insert(zoneData);

      // Log the creation of the new bonus zone
      logger.info(`Created new bonus zone: ${bonusZone.id}`, { bonusZoneId: bonusZone.id, zoneName: bonusZone.name });

      // Return the created bonus zone model
      return bonusZone;
    } catch (error) {
      logger.error('Error creating bonus zone', { error, zoneData });
      throw new AppError('Failed to create bonus zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Creates a circular bonus zone around a center point
   * @param name - Name of the bonus zone
   * @param centerLat - Latitude of the center point
   * @param centerLng - Longitude of the center point
   * @param radiusKm - Radius in kilometers
   * @param multiplier - Bonus multiplier value
   * @param reason - Reason for creating the bonus zone
   * @param startTime - Start time for the bonus zone
   * @param endTime - End time for the bonus zone
   * @returns The newly created circular bonus zone
   */
  async createCircularBonusZone(
    name: string,
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    multiplier: number,
    reason: string,
    startTime: Date,
    endTime: Date
  ): Promise<BonusZoneModel> {
    // Validate input parameters
    if (!name || !centerLat || !centerLng || !radiusKm || !multiplier || !reason || !startTime || !endTime) {
      throw new AppError('Missing required parameters for circular bonus zone', { code: 'VAL_INVALID_INPUT' });
    }

    // Ensure radius is within allowed range
    if (radiusKm < MIN_BONUS_ZONE_RADIUS_KM || radiusKm > MAX_BONUS_ZONE_RADIUS_KM) {
      throw new AppError(`Radius must be between ${MIN_BONUS_ZONE_RADIUS_KM} and ${MAX_BONUS_ZONE_RADIUS_KM} km`, { code: 'VAL_INVALID_INPUT' });
    }

    // Ensure multiplier is within allowed range
    if (multiplier < 1.0 || multiplier > MAX_BONUS_MULTIPLIER) {
      throw new AppError(`Multiplier must be between 1.0 and ${MAX_BONUS_MULTIPLIER}`, { code: 'VAL_INVALID_INPUT' });
    }

    try {
      // Use BonusZoneModel.createCircularZone to create the zone
      const bonusZone = BonusZoneModel.createCircularZone(name, centerLat, centerLng, radiusKm, multiplier, reason, startTime, endTime);

      // Save the zone to the database
      await BonusZoneModel.query().insert(bonusZone);

      // Log the creation of the circular bonus zone
      logger.info(`Created new circular bonus zone: ${bonusZone.id}`, { bonusZoneId: bonusZone.id, zoneName: bonusZone.name, centerLat, centerLng, radiusKm });

      // Return the created bonus zone model
      return bonusZone;
    } catch (error) {
      logger.error('Error creating circular bonus zone', { error, name, centerLat, centerLng, radiusKm, multiplier, reason, startTime, endTime });
      throw new AppError('Failed to create circular bonus zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves a bonus zone by its ID
   * @param id - ID of the bonus zone to retrieve
   * @returns The bonus zone if found, null otherwise
   */
  async getBonusZone(id: string): Promise<BonusZoneModel | null> {
    try {
      // Query the database for the bonus zone with the given ID
      const bonusZone = await BonusZoneModel.query().findById(id);

      // Return the bonus zone if found, null otherwise
      return bonusZone || null;
    } catch (error) {
      logger.error('Error getting bonus zone', { error, bonusZoneId: id });
      throw new AppError('Failed to get bonus zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves all bonus zones, optionally filtered by active status
   * @param activeOnly - If true, only retrieves active bonus zones
   * @returns Array of bonus zones
   */
  async getAllBonusZones(activeOnly?: boolean): Promise<BonusZoneModel[]> {
    try {
      let query = BonusZoneModel.query();

      // If activeOnly is true, filter for zones where isActive is true
      if (activeOnly) {
        query = query.where('isActive', true);
        query = query.where('startTime', '<=', new Date());
        query = query.where('endTime', '>=', new Date());
      }

      // Query the database for bonus zones
      const bonusZones = await query;

      // Log the retrieval of bonus zones
      logger.info(`Retrieved ${bonusZones.length} bonus zones`, { activeOnly });

      // Return the array of bonus zones
      return bonusZones;
    } catch (error) {
      logger.error('Error getting all bonus zones', { error, activeOnly });
      throw new AppError('Failed to get all bonus zones', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves all currently active bonus zones
   * @returns Array of active bonus zones
   */
  async getActiveBonusZones(): Promise<BonusZoneModel[]> {
    try {
      // Call getAllBonusZones with activeOnly set to true
      const activeBonusZones = await this.getAllBonusZones(true);

      // Further filter the results to ensure zones are currently active
      const currentlyActiveZones = activeBonusZones.filter(zone => zone.isCurrentlyActive());

      // Log the retrieval of active bonus zones
      logger.info(`Retrieved ${currentlyActiveZones.length} active bonus zones`);

      // Return the array of active bonus zones
      return currentlyActiveZones;
    } catch (error) {
      logger.error('Error getting active bonus zones', { error });
      throw new AppError('Failed to get active bonus zones', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Updates an existing bonus zone
   * @param id - ID of the bonus zone to update
   * @param updateData - Data to update the bonus zone with
   * @returns The updated bonus zone if found, null otherwise
   */
  async updateBonusZone(id: string, updateData: any): Promise<BonusZoneModel | null> {
    // Validate update data
    if (!updateData) {
      throw new AppError('No update data provided', { code: 'VAL_INVALID_INPUT' });
    }

    // Ensure multiplier is within allowed range if provided
    if (updateData.multiplier && (updateData.multiplier < 1.0 || updateData.multiplier > MAX_BONUS_MULTIPLIER)) {
      throw new AppError(`Multiplier must be between 1.0 and ${MAX_BONUS_MULTIPLIER}`, { code: 'VAL_INVALID_INPUT' });
    }

    try {
      // Query the database for the bonus zone with the given ID
      const bonusZone = await BonusZoneModel.query().findById(id);

      // If not found, return null
      if (!bonusZone) {
        logger.warn(`Bonus zone not found for update`, { bonusZoneId: id });
        return null;
      }

      // Update the bonus zone with the provided data
      await BonusZoneModel.query().patch(updateData).findById(id);

      // Log the update operation
      logger.info(`Updated bonus zone: ${id}`, { bonusZoneId: id, updateData });

      // Return the updated bonus zone
      return await BonusZoneModel.query().findById(id);
    } catch (error) {
      logger.error('Error updating bonus zone', { error, bonusZoneId: id, updateData });
      throw new AppError('Failed to update bonus zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Deactivates a bonus zone
   * @param id - ID of the bonus zone to deactivate
   * @returns The deactivated bonus zone if found, null otherwise
   */
  async deactivateBonusZone(id: string): Promise<BonusZoneModel | null> {
    try {
      // Query the database for the bonus zone with the given ID
      const bonusZone = await BonusZoneModel.query().findById(id);

      // If not found, return null
      if (!bonusZone) {
        logger.warn(`Bonus zone not found for deactivation`, { bonusZoneId: id });
        return null;
      }

      // Set isActive to false
      await BonusZoneModel.query().patch({ isActive: false }).findById(id);

      // Log the deactivation
      logger.info(`Deactivated bonus zone: ${id}`, { bonusZoneId: id });

      // Return the deactivated bonus zone
      return await BonusZoneModel.query().findById(id);
    } catch (error) {
      logger.error('Error deactivating bonus zone', { error, bonusZoneId: id });
      throw new AppError('Failed to deactivate bonus zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Deletes a bonus zone
   * @param id - ID of the bonus zone to delete
   * @returns True if the zone was deleted, false otherwise
   */
  async deleteBonusZone(id: string): Promise<boolean> {
    try {
      // Query the database for the bonus zone with the given ID
      const bonusZone = await BonusZoneModel.query().findById(id);

      // If not found, return false
      if (!bonusZone) {
        logger.warn(`Bonus zone not found for deletion`, { bonusZoneId: id });
        return false;
      }

      // Delete the bonus zone from the database
      await BonusZoneModel.query().deleteById(id);

      // Log the deletion
      logger.info(`Deleted bonus zone: ${id}`, { bonusZoneId: id });

      // Return true indicating successful deletion
      return true;
    } catch (error) {
      logger.error('Error deleting bonus zone', { error, bonusZoneId: id });
      throw new AppError('Failed to delete bonus zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Checks if a driver is currently in any active bonus zone
   * @param driver - The driver object with current location
   * @returns Object indicating if driver is in a bonus zone and which zone
   */
  async checkDriverInBonusZone(driver: Driver): Promise<{ inBonusZone: boolean; bonusZone?: BonusZoneModel }> {
    // Validate driver has current location
    if (!driver.current_location || !driver.current_location.latitude || !driver.current_location.longitude) {
      return { inBonusZone: false };
    }

    try {
      // Get all active bonus zones
      const activeBonusZones = await this.getActiveBonusZones();

      // Check if driver's current location is within any active zone
      for (const bonusZone of activeBonusZones) {
        if (bonusZone.containsPoint(driver.current_location.latitude, driver.current_location.longitude)) {
          logger.info(`Driver ${driver.driver_id} is in bonus zone ${bonusZone.id}`, { driverId: driver.driver_id, bonusZoneId: bonusZone.id });
          return { inBonusZone: true, bonusZone };
        }
      }

      // If not in any zone, return false
      return { inBonusZone: false };
    } catch (error) {
      logger.error('Error checking driver in bonus zone', { error, driverId: driver.driver_id });
      throw new AppError('Failed to check driver in bonus zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Checks if a position is within any active bonus zone
   * @param position - The position object with latitude and longitude
   * @returns Object indicating if position is in a bonus zone and which zone
   */
  async checkPositionInBonusZone(position: Position): Promise<{ inBonusZone: boolean; bonusZone?: BonusZoneModel }> {
    // Validate position has latitude and longitude
    if (!position || !position.latitude || !position.longitude) {
      throw new AppError('Missing required parameters for position', { code: 'VAL_INVALID_INPUT' });
    }

    try {
      // Get all active bonus zones
      const activeBonusZones = await this.getActiveBonusZones();

      // Check if position is within any active zone
      for (const bonusZone of activeBonusZones) {
        if (bonusZone.containsPoint(position.latitude, position.longitude)) {
          logger.info(`Position is in bonus zone ${bonusZone.id}`, { latitude: position.latitude, longitude: position.longitude, bonusZoneId: bonusZone.id });
          return { inBonusZone: true, bonusZone };
        }
      }

      // If not in any zone, return false
      return { inBonusZone: false };
    } catch (error) {
      logger.error('Error checking position in bonus zone', { error, latitude: position.latitude, longitude: position.longitude });
      throw new AppError('Failed to check position in bonus zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Finds all bonus zones within a specified radius of a position
   * @param position - The position object with latitude and longitude
   * @param radiusKm - The radius in kilometers
   * @returns Array of bonus zones within the radius
   */
  async getBonusZonesInRadius(position: Position, radiusKm: number): Promise<BonusZoneModel[]> {
    // Validate position has latitude and longitude
    if (!position || !position.latitude || !position.longitude) {
      throw new AppError('Missing required parameters for position', { code: 'VAL_INVALID_INPUT' });
    }

    try {
      // Get all active bonus zones
      const activeBonusZones = await this.getActiveBonusZones();

      // Calculate distance from position to each zone's center
      const nearbyZones = activeBonusZones.filter(zone => {
        const distance = calculateDistance(position.latitude, position.longitude, zone.boundary[0].latitude, zone.boundary[0].longitude);
        return distance <= radiusKm;
      });

      // Log the retrieval of nearby bonus zones
      logger.info(`Found ${nearbyZones.length} bonus zones within ${radiusKm} km of position`, { latitude: position.latitude, longitude: position.longitude, radiusKm });

      // Return the filtered array of bonus zones
      return nearbyZones;
    } catch (error) {
      logger.error('Error getting bonus zones in radius', { error, latitude: position.latitude, longitude: position.longitude, radiusKm });
      throw new AppError('Failed to get bonus zones in radius', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Creates a bonus award for a driver in a bonus zone
   * @param driverId - ID of the driver receiving the bonus
   * @param zoneId - ID of the bonus zone where the driver earned the bonus
   * @param assignmentId - ID of the load assignment associated with the bonus
   * @param bonusAmount - The amount of the bonus
   * @param reason - The reason for the bonus
   * @returns The created driver bonus
   */
  async createDriverBonus(driverId: string, zoneId: string, assignmentId: string, bonusAmount: number, reason: string): Promise<any> {
    // Validate input parameters
    if (!driverId || !zoneId || !bonusAmount || !reason) {
      throw new AppError('Missing required parameters for driver bonus', { code: 'VAL_INVALID_INPUT' });
    }

    try {
      // Check if bonus zone exists and is active
      const bonusZone = await this.getBonusZone(zoneId);
      if (!bonusZone || !bonusZone.isCurrentlyActive()) {
        throw new AppError('Bonus zone not found or not active', { code: 'VAL_INVALID_INPUT' });
      }

      // Create a new driver bonus record
      const driverBonus = await DriverBonusModel.query().insert({
        driverId,
        zoneId,
        assignmentId,
        bonusAmount,
        bonusReason: reason,
      });

      // Log the bonus creation
      logger.info(`Created new driver bonus for driver ${driverId} in zone ${zoneId}`, { driverId, bonusZoneId: zoneId, bonusAmount, assignmentId });

      // Return the created driver bonus
      return driverBonus;
    } catch (error) {
      logger.error('Error creating driver bonus', { error, driverId, zoneId, bonusAmount, assignmentId });
      throw new AppError('Failed to create driver bonus', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves all driver bonuses awarded for a specific bonus zone
   * @param zoneId - ID of the bonus zone
   * @returns Array of driver bonuses for the zone
   */
  async getDriverBonusesForZone(zoneId: string): Promise<any[]> {
    // Validate zone ID
    if (!zoneId) {
      throw new AppError('Missing required parameter: zoneId', { code: 'VAL_INVALID_INPUT' });
    }

    try {
      // Query the database for driver bonuses with the specified zone ID
      const driverBonuses = await DriverBonusModel.getBonusesForZone(zoneId);

      // Log the retrieval of driver bonuses
      logger.info(`Retrieved ${driverBonuses.length} driver bonuses for zone ${zoneId}`, { bonusZoneId: zoneId });

      // Return the array of driver bonuses
      return driverBonuses;
    } catch (error) {
      logger.error('Error getting driver bonuses for zone', { error, bonusZoneId: zoneId });
      throw new AppError('Failed to get driver bonuses for zone', { code: 'DB_QUERY_ERROR', details: { error } });
    }
  }

  /**
   * Calculates an appropriate bonus multiplier based on market conditions
   * @param reason - The reason for the bonus
   * @param factors - Factors influencing the bonus multiplier
   * @returns Calculated bonus multiplier
   */
  calculateBonusMultiplier(reason: string, factors: any): number {
    // Start with default multiplier
    let multiplier = DEFAULT_BONUS_MULTIPLIER;

    // Adjust based on provided factors (demand, supply, urgency)
    // Placeholder - implement actual calculation logic here

    // Ensure multiplier is within allowed range
    multiplier = Math.max(1.0, Math.min(multiplier, MAX_BONUS_MULTIPLIER));

    // Log the calculated multiplier
    logger.info(`Calculated bonus multiplier: ${multiplier}`, { reason, factors });

    // Return the calculated multiplier
    return multiplier;
  }
}