// src/backend/driver-service/src/services/driver.service.ts
import { Transaction } from 'knex'; // knex@^2.4.2
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0

import {
  Driver,
  DriverStatus,
  DriverCreationParams,
  DriverUpdateParams,
  DriverAvailability,
  DriverHOS,
  DriverPreference,
  DriverSearchParams,
  DriverSummary,
  DriverWithDetails,
} from '../../../common/interfaces/driver.interface';
import { DriverModel } from '../models/driver.model';
import {
  validateDriverCreation,
  validateDriverUpdate,
  validateDriverStatusUpdate,
  validateDriverId,
  validateDriverPreference,
  validateDriverAvailability,
  validateDriverHOS,
  validateDriverSearch,
} from '../validators/driver.validator';
import { AppError, handleError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { DriverEventsProducer } from '../producers/driver-events.producer';
import { getKnexInstance } from '../../../common/config/database.config';
import logger from '../../../common/utils/logger';

/**
 * Service class for managing driver operations
 */
export class DriverService {
  private readonly serviceName: string = 'DriverService';
  private eventsProducer: DriverEventsProducer;

  /**
   * Creates a new DriverService instance
   */
  constructor(eventsProducer: DriverEventsProducer) {
    this.eventsProducer = eventsProducer;
  }

  /**
   * Retrieves a driver by ID
   * @param driverId - The driver ID to find
   * @returns Promise resolving to the driver record
   */
  async getDriverById(driverId: string): Promise<Driver> {
    try {
      await validateDriverId(driverId);
      const driver = await DriverModel.findById(driverId);

      if (!driver) {
        throw new AppError('Driver not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND });
      }

      return driver;
    } catch (error: any) {
      handleError(error, this.serviceName, { driverId });
      throw error;
    }
  }

  /**
   * Retrieves a driver by user ID
   * @param userId - The user ID to find
   * @returns Promise resolving to the driver record
   */
  async getDriverByUserId(userId: string): Promise<Driver> {
    try {
      const driver = await DriverModel.findByUserId(userId);

      if (!driver) {
        throw new AppError('Driver not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND });
      }

      return driver;
    } catch (error: any) {
      handleError(error, this.serviceName, { userId });
      throw error;
    }
  }

  /**
   * Retrieves all drivers for a specific carrier
   * @param carrierId - The carrier ID to find drivers for
   * @param options - Optional pagination and filtering options
   * @returns Promise resolving to an array of driver records
   */
  async getDriversByCarrierId(carrierId: string, options: any): Promise<Driver[]> {
    try {
      const drivers = await DriverModel.findByCarrierId(carrierId, options);
      return drivers;
    } catch (error: any) {
      handleError(error, this.serviceName, { carrierId, options });
      throw error;
    }
  }

  /**
   * Retrieves a driver with all related details
   * @param driverId - The driver ID to find
   * @returns Promise resolving to the driver with all details
   */
  async getDriverWithDetails(driverId: string): Promise<DriverWithDetails> {
    try {
      await validateDriverId(driverId);
      const driver = await DriverModel.getDriverWithDetails(driverId);

      if (!driver) {
        throw new AppError('Driver not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND });
      }

      return driver;
    } catch (error: any) {
      handleError(error, this.serviceName, { driverId });
      throw error;
    }
  }

  /**
   * Retrieves a summary of driver information
   * @param driverId - The driver ID to find
   * @returns Promise resolving to a driver summary
   */
  async getDriverSummary(driverId: string): Promise<DriverSummary> {
    try {
      await validateDriverId(driverId);
      const driverSummary = await DriverModel.getDriverSummary(driverId);

      if (!driverSummary) {
        throw new AppError('Driver not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND });
      }

      return driverSummary;
    } catch (error: any) {
      handleError(error, this.serviceName, { driverId });
      throw error;
    }
  }

  /**
   * Creates a new driver record
   * @param driverData - Data for the new driver
   * @returns Promise resolving to the created driver record
   */
  async createDriver(driverData: DriverCreationParams): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverCreation(driverData);

      const existingDriver = await DriverModel.findByUserId(driverData.user_id);
      if (existingDriver) {
        throw new AppError('Driver already exists with this user ID', { code: ErrorCodes.DRV_ALREADY_EXISTS });
      }

      trx = await this.startTransaction();
      const driver = await DriverModel.createDriver(driverData, trx);
      await this.eventsProducer.produceDriverCreatedEvent(driver);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverData });
      throw error;
    }
  }

  /**
   * Updates an existing driver record
   * @param driverId - ID of the driver to update
   * @param driverData - New driver data
   * @returns Promise resolving to the updated driver record
   */
  async updateDriver(driverId: string, driverData: DriverUpdateParams): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);
      await validateDriverUpdate(driverData);

      trx = await this.startTransaction();
      const driver = await DriverModel.updateDriver(driverId, driverData, trx);
      await this.eventsProducer.produceDriverUpdatedEvent(driver);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId, driverData });
      throw error;
    }
  }

  /**
   * Updates a driver's status
   * @param driverId - ID of the driver to update
   * @param status - New driver status
   * @returns Promise resolving to the updated driver record
   */
  async updateDriverStatus(driverId: string, status: DriverStatus): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);
      await validateDriverStatusUpdate(status);

      trx = await this.startTransaction();
      const driver = await DriverModel.updateDriverStatus(driverId, status, trx);
      await this.eventsProducer.produceDriverStatusChangedEvent(driverId, status, driver.status);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId, status });
      throw error;
    }
  }

  /**
   * Updates a driver's current location
   * @param driverId - ID of the driver to update
   * @param location - New location coordinates
   * @returns Promise resolving to the updated driver record
   */
  async updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);
      // Basic validation for location data
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        throw new AppError('Invalid location data', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      trx = await this.startTransaction();
      const driver = await DriverModel.updateDriverLocation(driverId, location, trx);
      await this.eventsProducer.produceDriverLocationUpdatedEvent(driverId, location);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId, location });
      throw error;
    }
  }

  /**
   * Updates a driver's Hours of Service data
   * @param driverId - ID of the driver to update
   * @param hosData - New HOS data
   * @returns Promise resolving to the updated driver record
   */
  async updateDriverHOS(driverId: string, hosData: DriverHOS): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);
      await validateDriverHOS(hosData);

      trx = await this.startTransaction();
      const driver = await DriverModel.updateDriverHOS(driverId, hosData, trx);
      await this.eventsProducer.produceDriverHOSUpdatedEvent(driverId, hosData.status, hosData);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId, hosData });
      throw error;
    }
  }

  /**
   * Updates a driver's current load assignment
   * @param driverId - ID of the driver to update
   * @param loadId - ID of the load to assign
   * @returns Promise resolving to the updated driver record
   */
  async updateDriverLoad(driverId: string, loadId: string): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);

      trx = await this.startTransaction();
      const driver = await DriverModel.updateDriverLoad(driverId, loadId, trx);
      await this.eventsProducer.produceDriverUpdatedEvent(driver);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId, loadId });
      throw error;
    }
  }

  /**
   * Updates a driver's current vehicle assignment
   * @param driverId - ID of the driver to update
   * @param vehicleId - ID of the vehicle to assign
   * @returns Promise resolving to the updated driver record
   */
  async updateDriverVehicle(driverId: string, vehicleId: string): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);

      trx = await this.startTransaction();
      const driver = await DriverModel.updateDriverVehicle(driverId, vehicleId, trx);
      await this.eventsProducer.produceDriverUpdatedEvent(driver);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId, vehicleId });
      throw error;
    }
  }

  /**
   * Updates a driver's efficiency score
   * @param driverId - ID of the driver to update
   * @param score - New efficiency score
   * @returns Promise resolving to the updated driver record
   */
  async updateDriverEfficiencyScore(driverId: string, score: number): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);
      if (typeof score !== 'number' || score < 0 || score > 100) {
        throw new AppError('Invalid efficiency score', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      trx = await this.startTransaction();
      const driver = await DriverModel.updateDriverEfficiencyScore(driverId, score, trx);
      await this.eventsProducer.produceDriverScoreUpdatedEvent(driverId, score, { score });
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId, score });
      throw error;
    }
  }

  /**
   * Deactivates a driver
   * @param driverId - ID of the driver to deactivate
   * @returns Promise resolving to the updated driver record
   */
  async deactivateDriver(driverId: string): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);

      trx = await this.startTransaction();
      const driver = await DriverModel.deactivateDriver(driverId, trx);
      await this.eventsProducer.produceDriverStatusChangedEvent(driverId, DriverStatus.INACTIVE, driver.status);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId });
      throw error;
    }
  }

  /**
   * Activates a driver
   * @param driverId - ID of the driver to activate
   * @returns Promise resolving to the updated driver record
   */
  async activateDriver(driverId: string): Promise<Driver> {
    let trx: Transaction;
    try {
      await validateDriverId(driverId);

      trx = await this.startTransaction();
      const driver = await DriverModel.activateDriver(driverId, trx);
      await this.eventsProducer.produceDriverStatusChangedEvent(driverId, DriverStatus.ACTIVE, driver.status);
      await trx.commit();

      return driver;
    } catch (error: any) {
      if (trx) {
        await trx.rollback();
      }
      handleError(error, this.serviceName, { driverId });
      throw error;
    }
  }

  /**
   * Finds available drivers based on criteria
   * @param criteria - Object containing search criteria
   * @returns Promise resolving to an array of available driver records
   */
  async findAvailableDrivers(criteria: any): Promise<Driver[]> {
    try {
      const drivers = await DriverModel.findAvailableDrivers(criteria);
      return drivers;
    } catch (error: any) {
      handleError(error, this.serviceName, { criteria });
      throw error;
    }
  }

  /**
   * Searches for drivers based on various criteria
   * @param searchParams - Object containing search parameters
   * @returns Promise resolving to search results with pagination info
   */
  async searchDrivers(searchParams: DriverSearchParams): Promise<{
    drivers: Driver[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      await validateDriverSearch(searchParams);
      return await DriverModel.searchDrivers(searchParams);
    } catch (error: any) {
      handleError(error, this.serviceName, { searchParams });
      throw error;
    }
  }

  /**
   * Validates if a driver is eligible for a specific load
   * @param driverId - ID of the driver to validate
   * @param loadDetails - Details of the load to check
   * @returns Promise resolving to eligibility result with reasons if not eligible
   */
  async validateDriverForLoad(driverId: string, loadDetails: any): Promise<{ eligible: boolean; reasons?: string[] }> {
    try {
      await validateDriverId(driverId);
      return await DriverModel.validateDriverForLoad(driverId, loadDetails);
    } catch (error: any) {
      handleError(error, this.serviceName, { driverId, loadDetails });
      throw error;
    }
  }

  /**
   * Starts a new database transaction
   * @returns Promise resolving to a Knex transaction object
   */
  private async startTransaction(): Promise<Transaction> {
    const knex = getKnexInstance();
    return knex.transaction();
  }
}