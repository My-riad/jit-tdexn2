import { Model, ModelObject, QueryBuilder, Transaction } from 'objection'; // ^3.0.1
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import {
  Driver,
  DriverStatus,
  DriverCreationParams,
  DriverUpdateParams,
  LicenseClass,
  LicenseEndorsement,
  HOSStatus
} from '../../../common/interfaces/driver.interface';
import { getKnexInstance } from '../../../common/config/database.config';
import logger from '../../../common/utils/logger';
import { DriverAvailabilityModel } from './driver-availability.model';
import { DriverHOSModel } from './driver-hos.model';
import { DriverPreferenceModel } from './driver-preference.model';

/**
 * Database model for truck drivers, implementing the Driver interface
 */
class DriverModel extends Model implements Driver {
  // Properties from Driver interface
  driver_id!: string;
  user_id!: string;
  carrier_id!: string;
  first_name!: string;
  last_name!: string;
  email!: string;
  phone!: string;
  license_number!: string;
  license_state!: string;
  license_class!: LicenseClass;
  license_endorsements!: LicenseEndorsement[];
  license_expiration!: Date;
  home_address!: object;
  current_location!: object;
  current_vehicle_id!: string;
  current_load_id!: string;
  status!: DriverStatus;
  hos_status!: HOSStatus;
  hos_status_since!: Date;
  driving_minutes_remaining!: number;
  duty_minutes_remaining!: number;
  cycle_minutes_remaining!: number;
  efficiency_score!: number;
  eld_device_id!: string;
  eld_provider!: string;
  created_at!: Date;
  updated_at!: Date;
  active!: boolean;

  /**
   * Creates a new DriverModel instance
   */
  constructor() {
    super();
  }

  /**
   * Returns the database table name for this model
   * @returns The name of the database table
   */
  static get tableName() {
    return 'drivers';
  }

  /**
   * Defines the JSON schema for validation of driver data
   * @returns JSON schema object for validation
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'user_id',
        'carrier_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'license_number',
        'license_state',
        'license_class'
      ],
      properties: {
        driver_id: { type: 'string' },
        user_id: { type: 'string' },
        carrier_id: { type: 'string' },
        first_name: { type: 'string', minLength: 1, maxLength: 255 },
        last_name: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        phone: { type: 'string', maxLength: 50 },
        license_number: { type: 'string', maxLength: 50 },
        license_state: { type: 'string', maxLength: 2 },
        license_class: { type: 'string', enum: Object.values(LicenseClass) },
        license_endorsements: {
          type: 'array',
          items: { type: 'string', enum: Object.values(LicenseEndorsement) }
        },
        license_expiration: { type: 'string', format: 'date-time' },
        home_address: {
          type: 'object',
          properties: {
            street1: { type: 'string' },
            street2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            postal_code: { type: 'string' },
            country: { type: 'string' }
          }
        },
        current_location: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' }
          }
        },
        current_vehicle_id: { type: ['string', 'null'] },
        current_load_id: { type: ['string', 'null'] },
        status: {
          type: 'string',
          enum: Object.values(DriverStatus),
          default: DriverStatus.INACTIVE
        },
        hos_status: {
          type: 'string',
          enum: Object.values(HOSStatus),
          default: HOSStatus.OFF_DUTY
        },
        hos_status_since: { type: 'string', format: 'date-time' },
        driving_minutes_remaining: { type: 'integer', default: 0 },
        duty_minutes_remaining: { type: 'integer', default: 0 },
        cycle_minutes_remaining: { type: 'integer', default: 0 },
        efficiency_score: { type: 'number', default: 0 },
        eld_device_id: { type: ['string', 'null'] },
        eld_provider: { type: ['string', 'null'] },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        active: { type: 'boolean', default: true }
      }
    };
  }

  /**
   * Defines relationships with other models
   * @returns Object defining relationships to other models
   */
  static get relationMappings() {
    return {
      carrier: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('../../../common/models/carrier.model'),
        join: {
          from: 'drivers.carrier_id',
          to: 'carriers.carrier_id'
        }
      },
      preferences: {
        relation: Model.HasManyRelation,
        modelClass: require('./driver-preference.model'),
        join: {
          from: 'drivers.driver_id',
          to: 'driver_preferences.driver_id'
        }
      },
      hos_records: {
        relation: Model.HasManyRelation,
        modelClass: require('./driver-hos.model'),
        join: {
          from: 'drivers.driver_id',
          to: 'driver_hos.driver_id'
        }
      },
      availability: {
        relation: Model.HasOneRelation,
        modelClass: require('./driver-availability.model'),
        join: {
          from: 'drivers.driver_id',
          to: 'driver_availability.driver_id'
        }
      }
    };
  }

  /**
   * Find a driver by ID
   * @param driverId - The driver ID to find
   * @returns Promise resolving to the driver record
   */
  static async findById(driverId: string): Promise<DriverModel | null> {
    try {
      const driver = await DriverModel.query().findById(driverId);
      return driver || null;
    } catch (error) {
      logger.error('Error finding driver by ID', { driverId, error });
      throw error;
    }
  }

  /**
   * Find a driver by user ID
   * @param userId - The user ID to find
   * @returns Promise resolving to the driver record
   */
  static async findByUserId(userId: string): Promise<DriverModel | null> {
    try {
      const driver = await DriverModel.query().findOne({ user_id: userId });
      return driver || null;
    } catch (error) {
      logger.error('Error finding driver by user ID', { userId, error });
      throw error;
    }
  }

  /**
   * Find all drivers for a specific carrier
   * @param carrierId - The carrier ID to find drivers for
   * @param options - Optional pagination and filtering options
   * @returns Promise resolving to an array of driver records
   */
  static async findByCarrierId(
    carrierId: string,
    options: {
      page?: number;
      limit?: number;
      filters?: Record<string, any>;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<DriverModel[]> {
    try {
      let query = DriverModel.query().where('carrier_id', carrierId);

      // Apply filters if provided
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          query = query.where(key, value);
        }
      }

      // Apply sorting if provided
      if (options.sortBy) {
        const direction = options.sortDirection || 'asc';
        query = query.orderBy(options.sortBy, direction);
      }

      // Apply pagination if provided
      if (options.page && options.limit) {
        const offset = (options.page - 1) * options.limit;
        query = query.offset(offset).limit(options.limit);
      }

      return await query;
    } catch (error) {
      logger.error('Error finding drivers by carrier ID', { carrierId, options, error });
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
    hosRemaining?: { driving: number; duty: number; cycle: number };
    licenseEndorsements?: LicenseEndorsement[];
    efficiencyScore?: { min: number };
  }): Promise<DriverModel[]> {
    try {
      // First, find drivers with status AVAILABLE
      let query = DriverModel.query()
        .where('status', DriverStatus.AVAILABLE)
        .where('active', true);

      // If license endorsements are specified, filter by them
      if (criteria.licenseEndorsements && criteria.licenseEndorsements.length > 0) {
        // This is a simplification - in a real system, this would need to be
        // handled differently as JSON arrays in SQL require specific handling
        for (const endorsement of criteria.licenseEndorsements) {
          query = query.whereJsonSupersetOf('license_endorsements', [endorsement]);
        }
      }

      // If minimum efficiency score is specified, filter by it
      if (criteria.efficiencyScore?.min) {
        query = query.where('efficiency_score', '>=', criteria.efficiencyScore.min);
      }

      // If HOS requirements are specified, filter by them
      if (criteria.hosRemaining) {
        if (criteria.hosRemaining.driving > 0) {
          query = query.where('driving_minutes_remaining', '>=', criteria.hosRemaining.driving * 60);
        }
        if (criteria.hosRemaining.duty > 0) {
          query = query.where('duty_minutes_remaining', '>=', criteria.hosRemaining.duty * 60);
        }
        if (criteria.hosRemaining.cycle > 0) {
          query = query.where('cycle_minutes_remaining', '>=', criteria.hosRemaining.cycle * 60);
        }
      }

      // Execute the query for base filterable criteria
      let drivers = await query;

      // For location-based filtering, we'll need to filter the results in memory
      // In a real implementation, this would use PostGIS or similar for efficiency
      if (criteria.location) {
        const { latitude, longitude, radius } = criteria.location;
        // Use DriverAvailabilityModel for location-based filtering
        const availableDriverIds = await DriverAvailabilityModel
          .findDriversNearLocation({ latitude, longitude }, radius)
          .then(results => results.map(r => r.driver_id));

        drivers = drivers.filter(driver => availableDriverIds.includes(driver.driver_id));
      }

      // If time window is specified, we need to check availability
      if (criteria.timeWindow) {
        const driverIds = drivers.map(d => d.driver_id);
        // Use DriverAvailabilityModel to check time window availability
        const availableDriverIds = await DriverAvailabilityModel
          .findAvailableDrivers({
            timeWindow: criteria.timeWindow
          })
          .then(results => results.map(r => r.driver_id));

        drivers = drivers.filter(driver => availableDriverIds.includes(driver.driver_id));
      }

      return drivers;
    } catch (error) {
      logger.error('Error finding available drivers', { criteria, error });
      throw error;
    }
  }

  /**
   * Create a new driver record
   * @param driverData - Data for the new driver
   * @param trx - Optional transaction object
   * @returns Promise resolving to the created driver record
   */
  static async createDriver(
    driverData: DriverCreationParams,
    trx?: Transaction
  ): Promise<DriverModel> {
    const knexInstance = getKnexInstance();
    const transaction = trx || await knexInstance.transaction();
    
    try {
      const now = new Date();
      
      // Generate a UUID for the driver_id
      const driver_id = uuidv4();
      
      // Prepare the driver record with defaults
      const driverRecord = {
        driver_id,
        ...driverData,
        status: DriverStatus.INACTIVE,
        hos_status: HOSStatus.OFF_DUTY,
        hos_status_since: now,
        driving_minutes_remaining: 0,
        duty_minutes_remaining: 0,
        cycle_minutes_remaining: 0,
        efficiency_score: 0,
        current_location: driverData.current_location || { latitude: 0, longitude: 0 },
        current_vehicle_id: null,
        current_load_id: null,
        created_at: now,
        updated_at: now,
        active: true
      };
      
      // Create the driver record
      const driver = await DriverModel.query(transaction).insert(driverRecord);
      
      // Create related availability record
      await DriverAvailabilityModel.createDriverAvailability({
        driver_id,
        status: DriverStatus.INACTIVE,
        current_location: driver.current_location,
        available_from: now,
        available_until: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
        driving_minutes_remaining: 0,
        duty_minutes_remaining: 0,
        cycle_minutes_remaining: 0,
        updated_at: now
      }, transaction);
      
      // If ELD data is provided, create initial HOS record
      if (driverData.eld_device_id && driverData.eld_provider) {
        await DriverHOSModel.createHOSRecord({
          hos_id: uuidv4(),
          driver_id,
          status: HOSStatus.OFF_DUTY,
          status_since: now,
          driving_minutes_remaining: 0,
          duty_minutes_remaining: 0,
          cycle_minutes_remaining: 0,
          location: driver.current_location,
          vehicle_id: null,
          eld_log_id: `init-${driver_id}`,
          recorded_at: now
        }, transaction);
      }
      
      // If driver preferences are provided, create them
      if (driverData.preferences) {
        await DriverPreferenceModel.bulkCreatePreferences(
          driver_id,
          driverData.preferences,
          transaction
        );
      }
      
      // If this is our transaction, commit it
      if (!trx) {
        await transaction.commit();
      }
      
      logger.info('Created new driver', { driver_id, email: driver.email });
      
      return driver;
    } catch (error) {
      // If this is our transaction, roll it back
      if (!trx) {
        await transaction.rollback();
      }
      
      logger.error('Error creating driver', { error, driverData });
      throw error;
    }
  }

  /**
   * Update an existing driver record
   * @param driverId - ID of the driver to update
   * @param driverData - New driver data
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async updateDriver(
    driverId: string,
    driverData: DriverUpdateParams,
    trx?: Transaction
  ): Promise<DriverModel> {
    try {
      const now = new Date();
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(trx)
        .patchAndFetchById(driverId, {
          ...driverData,
          updated_at: now
        });
      
      // If status has changed, update availability
      if (driverData.status) {
        await DriverAvailabilityModel.updateDriverStatus(driverId, driverData.status, trx);
      }
      
      logger.info('Updated driver', { driverId });
      
      return updatedDriver;
    } catch (error) {
      logger.error('Error updating driver', { error, driverId, driverData });
      throw error;
    }
  }

  /**
   * Update a driver's status
   * @param driverId - ID of the driver to update
   * @param status - New driver status
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async updateDriverStatus(
    driverId: string,
    status: DriverStatus,
    trx?: Transaction
  ): Promise<DriverModel> {
    try {
      const now = new Date();
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(trx)
        .patchAndFetchById(driverId, {
          status,
          updated_at: now
        });
      
      // Update driver availability
      await DriverAvailabilityModel.updateDriverStatus(driverId, status, trx);
      
      logger.info('Updated driver status', { driverId, status });
      
      return updatedDriver;
    } catch (error) {
      logger.error('Error updating driver status', { error, driverId, status });
      throw error;
    }
  }

  /**
   * Update a driver's current location
   * @param driverId - ID of the driver to update
   * @param location - New location coordinates
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async updateDriverLocation(
    driverId: string,
    location: { latitude: number; longitude: number },
    trx?: Transaction
  ): Promise<DriverModel> {
    try {
      const now = new Date();
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(trx)
        .patchAndFetchById(driverId, {
          current_location: location,
          updated_at: now
        });
      
      // Update driver availability with new location
      await DriverAvailabilityModel.updateDriverLocation(driverId, location, trx);
      
      logger.info('Updated driver location', { 
        driverId, 
        latitude: location.latitude, 
        longitude: location.longitude 
      });
      
      return updatedDriver;
    } catch (error) {
      logger.error('Error updating driver location', { error, driverId, location });
      throw error;
    }
  }

  /**
   * Update a driver's Hours of Service data
   * @param driverId - ID of the driver to update
   * @param hosData - New HOS data
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async updateDriverHOS(
    driverId: string,
    hosData: {
      status: HOSStatus;
      driving_minutes_remaining: number;
      duty_minutes_remaining: number;
      cycle_minutes_remaining: number;
      location?: { latitude: number; longitude: number };
      vehicle_id?: string;
      eld_log_id?: string;
    },
    trx?: Transaction
  ): Promise<DriverModel> {
    const knexInstance = getKnexInstance();
    const transaction = trx || await knexInstance.transaction();
    
    try {
      const now = new Date();
      
      // Create a new HOS record
      await DriverHOSModel.createHOSRecord({
        hos_id: uuidv4(),
        driver_id: driverId,
        status: hosData.status,
        status_since: now,
        driving_minutes_remaining: hosData.driving_minutes_remaining,
        duty_minutes_remaining: hosData.duty_minutes_remaining,
        cycle_minutes_remaining: hosData.cycle_minutes_remaining,
        location: hosData.location || { latitude: 0, longitude: 0 },
        vehicle_id: hosData.vehicle_id || null,
        eld_log_id: hosData.eld_log_id || `manual-${Date.now()}`,
        recorded_at: now
      }, transaction);
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(transaction)
        .patchAndFetchById(driverId, {
          hos_status: hosData.status,
          hos_status_since: now,
          driving_minutes_remaining: hosData.driving_minutes_remaining,
          duty_minutes_remaining: hosData.duty_minutes_remaining,
          cycle_minutes_remaining: hosData.cycle_minutes_remaining,
          updated_at: now
        });
      
      // Update driver availability with HOS data
      await DriverAvailabilityModel.updateDriverHOS(
        driverId,
        hosData.status,
        hosData.driving_minutes_remaining,
        hosData.duty_minutes_remaining,
        hosData.cycle_minutes_remaining,
        transaction
      );
      
      // If this is our transaction, commit it
      if (!trx) {
        await transaction.commit();
      }
      
      logger.info('Updated driver HOS', { driverId, status: hosData.status });
      
      return updatedDriver;
    } catch (error) {
      // If this is our transaction, roll it back
      if (!trx) {
        await transaction.rollback();
      }
      
      logger.error('Error updating driver HOS', { error, driverId, hosData });
      throw error;
    }
  }

  /**
   * Update a driver's current load assignment
   * @param driverId - ID of the driver to update
   * @param loadId - ID of the load to assign
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async updateDriverLoad(
    driverId: string,
    loadId: string,
    trx?: Transaction
  ): Promise<DriverModel> {
    try {
      const now = new Date();
      
      // Get current driver data
      const driver = await DriverModel.query(trx).findById(driverId);
      if (!driver) {
        throw new Error(`Driver not found: ${driverId}`);
      }
      
      // Determine new status if driver is currently available
      const newStatus = driver.status === DriverStatus.AVAILABLE
        ? DriverStatus.ON_DUTY
        : driver.status;
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(trx)
        .patchAndFetchById(driverId, {
          current_load_id: loadId,
          status: newStatus,
          updated_at: now
        });
      
      // Update driver availability if status changed
      if (newStatus !== driver.status) {
        await DriverAvailabilityModel.updateDriverStatus(driverId, newStatus, trx);
      }
      
      logger.info('Updated driver load assignment', { driverId, loadId });
      
      return updatedDriver;
    } catch (error) {
      logger.error('Error updating driver load', { error, driverId, loadId });
      throw error;
    }
  }

  /**
   * Update a driver's current vehicle assignment
   * @param driverId - ID of the driver to update
   * @param vehicleId - ID of the vehicle to assign
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async updateDriverVehicle(
    driverId: string,
    vehicleId: string,
    trx?: Transaction
  ): Promise<DriverModel> {
    try {
      const now = new Date();
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(trx)
        .patchAndFetchById(driverId, {
          current_vehicle_id: vehicleId,
          updated_at: now
        });
      
      logger.info('Updated driver vehicle assignment', { driverId, vehicleId });
      
      return updatedDriver;
    } catch (error) {
      logger.error('Error updating driver vehicle', { error, driverId, vehicleId });
      throw error;
    }
  }

  /**
   * Update a driver's efficiency score
   * @param driverId - ID of the driver to update
   * @param score - New efficiency score
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async updateDriverEfficiencyScore(
    driverId: string,
    score: number,
    trx?: Transaction
  ): Promise<DriverModel> {
    try {
      const now = new Date();
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(trx)
        .patchAndFetchById(driverId, {
          efficiency_score: score,
          updated_at: now
        });
      
      logger.info('Updated driver efficiency score', { driverId, score });
      
      return updatedDriver;
    } catch (error) {
      logger.error('Error updating driver efficiency score', { error, driverId, score });
      throw error;
    }
  }

  /**
   * Deactivate a driver
   * @param driverId - ID of the driver to deactivate
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async deactivateDriver(
    driverId: string,
    trx?: Transaction
  ): Promise<DriverModel> {
    try {
      const now = new Date();
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(trx)
        .patchAndFetchById(driverId, {
          active: false,
          status: DriverStatus.INACTIVE,
          updated_at: now
        });
      
      // Update driver availability
      await DriverAvailabilityModel.updateDriverStatus(driverId, DriverStatus.INACTIVE, trx);
      
      logger.info('Deactivated driver', { driverId });
      
      return updatedDriver;
    } catch (error) {
      logger.error('Error deactivating driver', { error, driverId });
      throw error;
    }
  }

  /**
   * Activate a driver
   * @param driverId - ID of the driver to activate
   * @param trx - Optional transaction object
   * @returns Promise resolving to the updated driver record
   */
  static async activateDriver(
    driverId: string,
    trx?: Transaction
  ): Promise<DriverModel> {
    try {
      const now = new Date();
      
      // Update the driver record
      const updatedDriver = await DriverModel.query(trx)
        .patchAndFetchById(driverId, {
          active: true,
          status: DriverStatus.AVAILABLE,
          updated_at: now
        });
      
      // Update driver availability
      await DriverAvailabilityModel.updateDriverStatus(driverId, DriverStatus.AVAILABLE, trx);
      
      logger.info('Activated driver', { driverId });
      
      return updatedDriver;
    } catch (error) {
      logger.error('Error activating driver', { error, driverId });
      throw error;
    }
  }

  /**
   * Get a driver record with all related details
   * @param driverId - ID of the driver to retrieve
   * @returns Promise resolving to the driver record with all related details
   */
  static async getDriverWithDetails(driverId: string): Promise<any> {
    try {
      // Get the driver with related data
      const driver = await DriverModel.query()
        .findById(driverId)
        .withGraphFetched('[carrier, preferences]');
      
      if (!driver) {
        return null;
      }
      
      // Get driver's current HOS status
      const hosData = await DriverHOSModel.findByDriverId(driverId);
      
      // Get driver's availability record
      const availability = await DriverAvailabilityModel.findByDriverId(driverId);
      
      // Combine into a comprehensive driver object
      const driverWithDetails = {
        ...driver,
        hos: hosData,
        availability
      };
      
      return driverWithDetails;
    } catch (error) {
      logger.error('Error getting driver with details', { error, driverId });
      throw error;
    }
  }

  /**
   * Search for drivers based on various criteria
   * @param searchParams - Object containing search parameters
   * @returns Promise resolving to search results with pagination info
   */
  static async searchDrivers(searchParams: {
    carrier_id?: string;
    status?: DriverStatus[];
    name?: string;
    email?: string;
    license?: string;
    location?: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    efficiency_score?: {
      min?: number;
      max?: number;
    };
    active?: boolean;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
  }): Promise<{
    drivers: DriverModel[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Start building the query
      let query = DriverModel.query();
      
      // Apply filters
      if (searchParams.carrier_id) {
        query = query.where('carrier_id', searchParams.carrier_id);
      }
      
      if (searchParams.status && searchParams.status.length > 0) {
        query = query.whereIn('status', searchParams.status);
      }
      
      if (searchParams.name) {
        query = query.where(function() {
          this.whereRaw('LOWER(first_name) LIKE ?', [`%${searchParams.name!.toLowerCase()}%`])
              .orWhereRaw('LOWER(last_name) LIKE ?', [`%${searchParams.name!.toLowerCase()}%`]);
        });
      }
      
      if (searchParams.email) {
        query = query.whereRaw('LOWER(email) LIKE ?', [`%${searchParams.email.toLowerCase()}%`]);
      }
      
      if (searchParams.license) {
        query = query.where('license_number', searchParams.license);
      }
      
      if (searchParams.efficiency_score) {
        if (searchParams.efficiency_score.min !== undefined) {
          query = query.where('efficiency_score', '>=', searchParams.efficiency_score.min);
        }
        if (searchParams.efficiency_score.max !== undefined) {
          query = query.where('efficiency_score', '<=', searchParams.efficiency_score.max);
        }
      }
      
      if (searchParams.active !== undefined) {
        query = query.where('active', searchParams.active);
      }
      
      // Count total before applying pagination
      const countQuery = query.clone();
      const total = await countQuery.resultSize();
      
      // Apply sorting
      const sortBy = searchParams.sort_by || 'created_at';
      const sortDirection = searchParams.sort_direction || 'desc';
      query = query.orderBy(sortBy, sortDirection);
      
      // Apply pagination
      const page = searchParams.page || 1;
      const limit = searchParams.limit || 10;
      const offset = (page - 1) * limit;
      
      query = query.offset(offset).limit(limit);
      
      // Execute the query
      const drivers = await query;
      
      // For location-based filtering (if specified), filter the results post-query
      let filteredDrivers = drivers;
      if (searchParams.location) {
        // This would be much more efficient with PostGIS, but we'll use the helper
        // function from DriverAvailabilityModel as a demonstration
        const nearbyDriverIds = await DriverAvailabilityModel
          .findDriversNearLocation(
            searchParams.location,
            searchParams.location.radius
          )
          .then(results => results.map(r => r.driver_id));
        
        filteredDrivers = drivers.filter(d => nearbyDriverIds.includes(d.driver_id));
      }
      
      return {
        drivers: filteredDrivers,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error('Error searching drivers', { error, searchParams });
      throw error;
    }
  }

  /**
   * Get a summary of driver information for list views
   * @param driverId - ID of the driver to summarize
   * @returns Promise resolving to a simplified driver summary
   */
  static async getDriverSummary(driverId: string): Promise<any> {
    try {
      // Get basic driver info
      const driver = await DriverModel.query()
        .findById(driverId)
        .select([
          'driver_id',
          'first_name',
          'last_name',
          'carrier_id',
          'status',
          'current_location',
          'current_load_id',
          'current_vehicle_id',
          'driving_minutes_remaining',
          'duty_minutes_remaining',
          'efficiency_score'
        ])
        .withGraphFetched('carrier(selectName)');
      
      if (!driver) {
        return null;
      }
      
      // Initialize city and state as unknown
      let city = 'Unknown';
      let state = 'Unknown';
      
      // In a real implementation, we would use a geocoding service to get city/state
      // from the coordinates. For this implementation, we'll return the coordinates.
      
      return {
        driver_id: driver.driver_id,
        name: `${driver.first_name} ${driver.last_name}`,
        carrier_name: driver.carrier ? driver.carrier.name : 'Unknown',
        status: driver.status,
        current_location: {
          city,
          state,
          coordinates: driver.current_location
        },
        current_load_id: driver.current_load_id,
        current_vehicle_id: driver.current_vehicle_id,
        hos_remaining: {
          driving: Math.floor(driver.driving_minutes_remaining / 60),
          duty: Math.floor(driver.duty_minutes_remaining / 60)
        },
        efficiency_score: driver.efficiency_score
      };
    } catch (error) {
      logger.error('Error getting driver summary', { error, driverId });
      throw error;
    }
  }

  /**
   * Validate if a driver is eligible for a specific load
   * @param driverId - ID of the driver to validate
   * @param loadDetails - Details of the load to check
   * @returns Promise resolving to eligibility result with reasons if not eligible
   */
  static async validateDriverForLoad(
    driverId: string,
    loadDetails: {
      origin: { latitude: number; longitude: number };
      destination: { latitude: number; longitude: number };
      pickup_time: Date;
      delivery_time: Date;
      equipment_type: string;
      estimated_driving_minutes: number;
      required_endorsements?: LicenseEndorsement[];
    }
  ): Promise<{ eligible: boolean; reasons?: string[] }> {
    try {
      // Get driver with related data
      const driver = await DriverModel.query()
        .findById(driverId)
        .withGraphFetched('preferences');
      
      if (!driver) {
        return { eligible: false, reasons: ['Driver not found'] };
      }
      
      const reasons: string[] = [];
      
      // Check if driver is active and available
      if (!driver.active) {
        reasons.push('Driver is not active');
      }
      
      if (driver.status !== DriverStatus.AVAILABLE) {
        reasons.push(`Driver is not available (current status: ${driver.status})`);
      }
      
      // Check if driver has required endorsements
      if (loadDetails.required_endorsements && loadDetails.required_endorsements.length > 0) {
        for (const endorsement of loadDetails.required_endorsements) {
          if (!driver.license_endorsements.includes(endorsement)) {
            reasons.push(`Driver is missing required endorsement: ${endorsement}`);
          }
        }
      }
      
      // Check if driver has sufficient HOS remaining
      // We'll use DriverHOSModel for this
      const hosValidation = await DriverHOSModel.validateHOSForLoad(driverId, {
        estimated_driving_minutes: loadDetails.estimated_driving_minutes,
        pickup_time: loadDetails.pickup_time,
        delivery_time: loadDetails.delivery_time
      });
      
      if (!hosValidation.valid) {
        reasons.push(hosValidation.reason || 'HOS validation failed');
      }
      
      // Check if load is within driver's preferred regions and load types
      // This would be a more complex check in a real system
      // For now, we'll just simulate this check
      
      // If any reasons were found, the driver is not eligible
      if (reasons.length > 0) {
        return { eligible: false, reasons };
      }
      
      // Driver is eligible for the load
      return { eligible: true };
    } catch (error) {
      logger.error('Error validating driver for load', { error, driverId, loadDetails });
      throw error;
    }
  }
}

export { DriverModel };