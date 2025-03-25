import { Model, ModelObject, QueryBuilder, Transaction } from 'objection'; // ^3.0.1
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import { 
  DriverAvailability, 
  DriverStatus, 
  HOSStatus,
  Driver 
} from '../../../common/interfaces/driver.interface';
import logger from '../../../common/utils/logger';
import { calculateDistance } from '../../../common/utils/geo-utils';

/**
 * Database model for driver availability in the freight optimization platform.
 * Extends Objection.js Model and implements the DriverAvailability interface.
 */
export class DriverAvailabilityModel extends Model implements DriverAvailability {
  // Properties matching DriverAvailability interface + model-specific properties
  availability_id!: string;
  driver_id!: string;
  status!: DriverStatus;
  current_location!: { latitude: number; longitude: number };
  available_from!: Date;
  available_until!: Date;
  hos_status!: HOSStatus;
  driving_minutes_remaining!: number;
  duty_minutes_remaining!: number;
  cycle_minutes_remaining!: number;
  max_distance!: number;
  created_at!: Date;
  updated_at!: Date;

  /**
   * Defines the database table name for this model
   */
  static get tableName() {
    return 'driver_availability';
  }

  /**
   * Defines the JSON schema for validation of driver availability data
   */
  static jsonSchema = {
    type: 'object',
    required: ['driver_id', 'status', 'current_location'],
    properties: {
      availability_id: { type: 'string' },
      driver_id: { type: 'string' },
      status: { type: 'string', enum: Object.values(DriverStatus) },
      current_location: { 
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' }
        },
        required: ['latitude', 'longitude']
      },
      available_from: { type: 'string', format: 'date-time' },
      available_until: { type: 'string', format: 'date-time' },
      hos_status: { type: 'string', enum: Object.values(HOSStatus) },
      driving_minutes_remaining: { type: 'number', minimum: 0 },
      duty_minutes_remaining: { type: 'number', minimum: 0 },
      cycle_minutes_remaining: { type: 'number', minimum: 0 },
      max_distance: { type: 'number', minimum: 0, default: 500 },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  };

  /**
   * Defines relationships with other models
   */
  static relationMappings = {
    driver: {
      relation: Model.BelongsToOneRelation,
      modelClass: __dirname + '/../driver/driver.model',
      join: {
        from: 'driver_availability.driver_id',
        to: 'drivers.driver_id'
      }
    }
  };

  /**
   * Find availability record for a specific driver
   * @param driverId - Driver ID to find availability for
   * @returns Promise resolving to the driver's availability record, or null if not found
   */
  static async findByDriverId(driverId: string): Promise<DriverAvailabilityModel | null> {
    try {
      const availability = await DriverAvailabilityModel.query()
        .findOne({ driver_id: driverId });
      
      return availability || null;
    } catch (error) {
      logger.error('Error finding driver availability by ID', { driverId, error });
      throw error;
    }
  }

  /**
   * Find available drivers based on criteria
   * @param criteria - Object containing search criteria
   * @returns Promise resolving to an array of available driver records
   */
  static async findAvailableDrivers(criteria: {
    location?: { latitude: number; longitude: number; radius: number };
    timeWindow?: { from: Date; until: Date };
    minHoursRemaining?: number;
    maxDistance?: number;
  }): Promise<DriverAvailabilityModel[]> {
    try {
      let query = DriverAvailabilityModel.query()
        .where('status', DriverStatus.AVAILABLE);
      
      const now = new Date();
      
      // Apply time window filter if provided
      if (criteria.timeWindow) {
        query = query.where('available_from', '<=', criteria.timeWindow.until)
                     .where('available_until', '>=', criteria.timeWindow.from);
      } else {
        // Default to drivers available now
        query = query.where('available_from', '<=', now)
                     .where('available_until', '>=', now);
      }
      
      // Apply HOS filter if provided
      if (criteria.minHoursRemaining) {
        const minMinutesRemaining = criteria.minHoursRemaining * 60;
        query = query.where('driving_minutes_remaining', '>=', minMinutesRemaining);
      }
      
      // Execute the query to get the base results
      let drivers = await query;
      
      // Apply location filter if provided (post-database filtering)
      if (criteria.location) {
        const { latitude, longitude, radius } = criteria.location;
        drivers = drivers.filter(driver => {
          const distance = calculateDistance(
            latitude,
            longitude,
            driver.current_location.latitude,
            driver.current_location.longitude,
            'miles'
          );
          return distance <= radius;
        });
      }
      
      // Apply max distance filter if provided
      if (criteria.maxDistance !== undefined) {
        drivers = drivers.filter(driver => 
          driver.max_distance >= criteria.maxDistance!
        );
      }
      
      return drivers;
    } catch (error) {
      logger.error('Error finding available drivers', { criteria, error });
      throw error;
    }
  }

  /**
   * Create a new driver availability record
   * @param availabilityData - Data for the new availability record
   * @param trx - Optional transaction object
   * @returns Promise resolving to the created availability record
   */
  static async createDriverAvailability(
    availabilityData: DriverAvailability,
    trx?: Transaction
  ): Promise<DriverAvailabilityModel> {
    try {
      const now = new Date();
      
      // Generate a UUID for the availability record
      const availability_id = uuidv4();
      
      // Set default values if not provided
      const data = {
        availability_id,
        ...availabilityData,
        created_at: now,
        updated_at: now,
        status: availabilityData.status || DriverStatus.AVAILABLE,
        max_distance: availabilityData.max_distance || 500,
      };
      
      // Create the record
      const query = DriverAvailabilityModel.query(trx);
      const result = await query.insert(data);
      
      logger.info('Created driver availability record', { 
        driver_id: availabilityData.driver_id,
        availability_id
      });
      
      return result;
    } catch (error) {
      logger.error('Error creating driver availability', { 
        driver_id: availabilityData.driver_id,
        error
      });
      throw error;
    }
  }

  /**
   * Update an existing driver availability record
   * @param driverId - ID of the driver to update
   * @param availabilityData - New availability data
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  static async updateDriverAvailability(
    driverId: string,
    availabilityData: Partial<DriverAvailability>,
    trx?: Transaction
  ): Promise<DriverAvailabilityModel> {
    try {
      // Find existing record
      let availability = await DriverAvailabilityModel.query(trx)
        .findOne({ driver_id: driverId });
      
      const now = new Date();
      
      if (!availability) {
        // If no record exists, create a new one
        logger.info('No availability record found for driver, creating new record', { driverId });
        
        return DriverAvailabilityModel.createDriverAvailability({
          driver_id: driverId,
          status: availabilityData.status || DriverStatus.AVAILABLE,
          current_location: availabilityData.current_location || { latitude: 0, longitude: 0 },
          available_from: availabilityData.available_from || now,
          available_until: availabilityData.available_until || new Date(now.getTime() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
          driving_minutes_remaining: availabilityData.driving_minutes_remaining || 0,
          duty_minutes_remaining: availabilityData.duty_minutes_remaining || 0,
          cycle_minutes_remaining: availabilityData.cycle_minutes_remaining || 0,
          hos_status: availabilityData.hos_status || HOSStatus.OFF_DUTY,
          updated_at: now,
          max_distance: availabilityData.max_distance || 500
        }, trx);
      }
      
      // Update existing record
      const updateData = {
        ...availabilityData,
        updated_at: now
      };
      
      availability = await DriverAvailabilityModel.query(trx)
        .patchAndFetchById(availability.availability_id, updateData);
      
      logger.info('Updated driver availability record', { driverId });
      
      return availability;
    } catch (error) {
      logger.error('Error updating driver availability', { driverId, error });
      throw error;
    }
  }

  /**
   * Update a driver's current location
   * @param driverId - ID of the driver to update
   * @param location - New location coordinates
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  static async updateDriverLocation(
    driverId: string,
    location: { latitude: number; longitude: number },
    trx?: Transaction
  ): Promise<DriverAvailabilityModel> {
    try {
      // Find existing record
      let availability = await DriverAvailabilityModel.query(trx)
        .findOne({ driver_id: driverId });
      
      const now = new Date();
      
      if (!availability) {
        // If no record exists, create a new one with default values
        logger.info('No availability record found for driver, creating new record', { driverId });
        
        return DriverAvailabilityModel.createDriverAvailability({
          driver_id: driverId,
          status: DriverStatus.AVAILABLE,
          current_location: location,
          available_from: now,
          available_until: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
          driving_minutes_remaining: 0,
          duty_minutes_remaining: 0,
          cycle_minutes_remaining: 0,
          hos_status: HOSStatus.OFF_DUTY,
          updated_at: now,
          max_distance: 500
        }, trx);
      }
      
      // Update existing record
      availability = await DriverAvailabilityModel.query(trx)
        .patchAndFetchById(availability.availability_id, {
          current_location: location,
          updated_at: now
        });
      
      logger.debug('Updated driver location', { 
        driverId,
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      return availability;
    } catch (error) {
      logger.error('Error updating driver location', { driverId, error });
      throw error;
    }
  }

  /**
   * Update a driver's status
   * @param driverId - ID of the driver to update
   * @param status - New driver status
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  static async updateDriverStatus(
    driverId: string,
    status: DriverStatus,
    trx?: Transaction
  ): Promise<DriverAvailabilityModel> {
    try {
      // Find existing record
      let availability = await DriverAvailabilityModel.query(trx)
        .findOne({ driver_id: driverId });
      
      const now = new Date();
      
      if (!availability) {
        // If no record exists, create a new one with default values
        logger.info('No availability record found for driver, creating new record', { driverId });
        
        return DriverAvailabilityModel.createDriverAvailability({
          driver_id: driverId,
          status: status,
          current_location: { latitude: 0, longitude: 0 },
          available_from: now,
          available_until: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
          driving_minutes_remaining: 0,
          duty_minutes_remaining: 0,
          cycle_minutes_remaining: 0,
          hos_status: HOSStatus.OFF_DUTY,
          updated_at: now,
          max_distance: 500
        }, trx);
      }
      
      // Update existing record
      availability = await DriverAvailabilityModel.query(trx)
        .patchAndFetchById(availability.availability_id, {
          status: status,
          updated_at: now
        });
      
      logger.info('Updated driver status', { driverId, status });
      
      return availability;
    } catch (error) {
      logger.error('Error updating driver status', { driverId, status, error });
      throw error;
    }
  }

  /**
   * Update a driver's Hours of Service data
   * @param driverId - ID of the driver to update
   * @param hosStatus - New HOS status
   * @param drivingMinutesRemaining - Remaining driving minutes
   * @param dutyMinutesRemaining - Remaining duty minutes
   * @param cycleMinutesRemaining - Remaining cycle minutes
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  static async updateDriverHOS(
    driverId: string,
    hosStatus: HOSStatus,
    drivingMinutesRemaining: number,
    dutyMinutesRemaining: number,
    cycleMinutesRemaining: number,
    trx?: Transaction
  ): Promise<DriverAvailabilityModel> {
    try {
      // Find existing record
      let availability = await DriverAvailabilityModel.query(trx)
        .findOne({ driver_id: driverId });
      
      const now = new Date();
      
      if (!availability) {
        // If no record exists, create a new one with default values
        logger.info('No availability record found for driver, creating new record', { driverId });
        
        return DriverAvailabilityModel.createDriverAvailability({
          driver_id: driverId,
          status: DriverStatus.AVAILABLE,
          current_location: { latitude: 0, longitude: 0 },
          available_from: now,
          available_until: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
          driving_minutes_remaining: drivingMinutesRemaining,
          duty_minutes_remaining: dutyMinutesRemaining,
          cycle_minutes_remaining: cycleMinutesRemaining,
          hos_status: hosStatus,
          updated_at: now,
          max_distance: 500
        }, trx);
      }
      
      // Update existing record
      availability = await DriverAvailabilityModel.query(trx)
        .patchAndFetchById(availability.availability_id, {
          hos_status: hosStatus,
          driving_minutes_remaining: drivingMinutesRemaining,
          duty_minutes_remaining: dutyMinutesRemaining,
          cycle_minutes_remaining: cycleMinutesRemaining,
          updated_at: now
        });
      
      logger.info('Updated driver HOS information', { 
        driverId, 
        hosStatus,
        drivingMinutesRemaining,
        dutyMinutesRemaining,
        cycleMinutesRemaining
      });
      
      return availability;
    } catch (error) {
      logger.error('Error updating driver HOS', { driverId, error });
      throw error;
    }
  }

  /**
   * Update a driver's availability time window
   * @param driverId - ID of the driver to update
   * @param availableFrom - Start of availability window
   * @param availableUntil - End of availability window
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  static async updateDriverTimeWindow(
    driverId: string,
    availableFrom: Date,
    availableUntil: Date,
    trx?: Transaction
  ): Promise<DriverAvailabilityModel> {
    try {
      // Validate time window
      if (availableFrom > availableUntil) {
        throw new Error('Available from date must be before available until date');
      }
      
      // Find existing record
      let availability = await DriverAvailabilityModel.query(trx)
        .findOne({ driver_id: driverId });
      
      const now = new Date();
      
      if (!availability) {
        // If no record exists, create a new one with default values
        logger.info('No availability record found for driver, creating new record', { driverId });
        
        return DriverAvailabilityModel.createDriverAvailability({
          driver_id: driverId,
          status: DriverStatus.AVAILABLE,
          current_location: { latitude: 0, longitude: 0 },
          available_from: availableFrom,
          available_until: availableUntil,
          driving_minutes_remaining: 0,
          duty_minutes_remaining: 0,
          cycle_minutes_remaining: 0,
          hos_status: HOSStatus.OFF_DUTY,
          updated_at: now,
          max_distance: 500
        }, trx);
      }
      
      // Update existing record
      availability = await DriverAvailabilityModel.query(trx)
        .patchAndFetchById(availability.availability_id, {
          available_from: availableFrom,
          available_until: availableUntil,
          updated_at: now
        });
      
      logger.info('Updated driver time window', { 
        driverId, 
        availableFrom, 
        availableUntil 
      });
      
      return availability;
    } catch (error) {
      logger.error('Error updating driver time window', { 
        driverId, 
        availableFrom, 
        availableUntil, 
        error 
      });
      throw error;
    }
  }

  /**
   * Update a driver's maximum distance preference
   * @param driverId - ID of the driver to update
   * @param maxDistance - Maximum distance in miles
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  static async updateMaxDistance(
    driverId: string,
    maxDistance: number,
    trx?: Transaction
  ): Promise<DriverAvailabilityModel> {
    try {
      // Find existing record
      let availability = await DriverAvailabilityModel.query(trx)
        .findOne({ driver_id: driverId });
      
      const now = new Date();
      
      if (!availability) {
        // If no record exists, create a new one with default values
        logger.info('No availability record found for driver, creating new record', { driverId });
        
        return DriverAvailabilityModel.createDriverAvailability({
          driver_id: driverId,
          status: DriverStatus.AVAILABLE,
          current_location: { latitude: 0, longitude: 0 },
          available_from: now,
          available_until: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
          driving_minutes_remaining: 0,
          duty_minutes_remaining: 0,
          cycle_minutes_remaining: 0,
          hos_status: HOSStatus.OFF_DUTY,
          updated_at: now,
          max_distance: maxDistance
        }, trx);
      }
      
      // Update existing record
      availability = await DriverAvailabilityModel.query(trx)
        .patchAndFetchById(availability.availability_id, {
          max_distance: maxDistance,
          updated_at: now
        });
      
      logger.info('Updated driver max distance', { driverId, maxDistance });
      
      return availability;
    } catch (error) {
      logger.error('Error updating driver max distance', { driverId, maxDistance, error });
      throw error;
    }
  }

  /**
   * Find available drivers near a specific location
   * @param location - Center location for search
   * @param radiusMiles - Search radius in miles
   * @param status - Optional driver status filter (defaults to AVAILABLE)
   * @returns Promise resolving to an array of nearby driver records
   */
  static async findDriversNearLocation(
    location: { latitude: number; longitude: number },
    radiusMiles: number,
    status: DriverStatus = DriverStatus.AVAILABLE
  ): Promise<DriverAvailabilityModel[]> {
    try {
      // Get all drivers with the specified status
      // We'll filter by location in memory since geospatial filtering
      // is more efficiently done with the calculateDistance function
      const drivers = await DriverAvailabilityModel.query()
        .where('status', status);
      
      // Filter drivers based on location
      const nearbyDrivers = drivers.filter(driver => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          driver.current_location.latitude,
          driver.current_location.longitude,
          'miles'
        );
        return distance <= radiusMiles;
      });
      
      logger.debug('Found drivers near location', { 
        latitude: location.latitude, 
        longitude: location.longitude,
        radiusMiles,
        count: nearbyDrivers.length
      });
      
      return nearbyDrivers;
    } catch (error) {
      logger.error('Error finding drivers near location', { 
        location, 
        radiusMiles, 
        error 
      });
      throw error;
    }
  }

  /**
   * Check if a driver is available for a specific load
   * @param driverId - ID of the driver to check
   * @param loadDetails - Details of the load to check availability for
   * @returns Promise resolving to an object indicating availability and reasons if not available
   */
  static async checkDriverAvailabilityForLoad(
    driverId: string,
    loadDetails: {
      origin: { latitude: number; longitude: number };
      destination: { latitude: number; longitude: number };
      pickup_time: Date;
      delivery_time: Date;
      estimated_driving_minutes: number;
    }
  ): Promise<{ available: boolean; reasons?: string[] }> {
    try {
      // Get the driver's availability record
      const availability = await DriverAvailabilityModel.findByDriverId(driverId);
      
      if (!availability) {
        return { 
          available: false, 
          reasons: ['Driver availability record not found'] 
        };
      }
      
      // Check if driver is available
      if (availability.status !== DriverStatus.AVAILABLE) {
        return { 
          available: false, 
          reasons: [`Driver is not available (current status: ${availability.status})`] 
        };
      }
      
      const reasons: string[] = [];
      
      // Check if pickup time is within availability window
      if (loadDetails.pickup_time < availability.available_from || 
          loadDetails.pickup_time > availability.available_until) {
        reasons.push('Pickup time is outside driver\'s availability window');
      }
      
      // Check if the current location is valid
      if (!availability.current_location || 
          availability.current_location.latitude === undefined || 
          availability.current_location.longitude === undefined) {
        reasons.push('Driver\'s current location is not specified');
      } else {
        // Check if load origin is within driver's max distance
        const distanceToOrigin = calculateDistance(
          availability.current_location.latitude,
          availability.current_location.longitude,
          loadDetails.origin.latitude,
          loadDetails.origin.longitude,
          'miles'
        );
        
        if (distanceToOrigin > availability.max_distance) {
          reasons.push(`Load origin is ${Math.round(distanceToOrigin)} miles away, but driver's max distance is ${availability.max_distance} miles`);
        }
      }
      
      // Check if driver has sufficient HOS remaining
      if (loadDetails.estimated_driving_minutes > availability.driving_minutes_remaining) {
        reasons.push(`Load requires ${loadDetails.estimated_driving_minutes} minutes of driving, but driver only has ${availability.driving_minutes_remaining} minutes remaining`);
      }
      
      // If any reasons were found, the driver is not available
      if (reasons.length > 0) {
        return { available: false, reasons };
      }
      
      // Driver is available for the load
      return { available: true };
    } catch (error) {
      logger.error('Error checking driver availability for load', { driverId, error });
      throw error;
    }
  }
}