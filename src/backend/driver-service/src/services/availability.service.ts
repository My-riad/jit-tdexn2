import { Transaction } from 'objection'; // objection@^3.0.1
import {

  DriverAvailability,
  DriverStatus,
} from '../../../common/interfaces/driver.interface';
import { DriverAvailabilityModel } from '../models/driver-availability.model';
import { HOSService } from './hos.service';
import { DriverEventsProducer } from '../producers/driver-events.producer';
import logger from '../../../common/utils/logger';
import { handleError, AppError } from '../../../common/utils/error-handler';
import { calculateDistance } from '../../../common/utils/geo-utils';

/**
 * Service for managing driver availability in the freight optimization platform
 */
export class AvailabilityService {
  private readonly serviceName: string = 'AvailabilityService';
  private readonly hosService: HOSService;
  private readonly eventsProducer: DriverEventsProducer;

  /**
   * Creates a new AvailabilityService instance
   * @param hosService The HOS service for HOS-related operations
   * @param eventsProducer The events producer for publishing availability events
   */
  constructor(hosService: HOSService, eventsProducer: DriverEventsProducer) {
    this.serviceName = 'AvailabilityService';
    this.hosService = hosService;
    this.eventsProducer = eventsProducer;
  }

  /**
   * Get the current availability status for a driver
   * @param driverId The ID of the driver
   * @returns Promise resolving to the driver's availability data
   */
  async getDriverAvailability(driverId: string): Promise<DriverAvailability> {
    logger.info(`Getting availability data for driver: ${driverId}`);
    try {
      const availability = await DriverAvailabilityModel.findByDriverId(driverId);

      if (!availability) {
        throw new AppError(`Availability data not found for driver: ${driverId}`, { code: 'RES_DRIVER_NOT_FOUND' });
      }

      return availability;
    } catch (error) {
      logger.error(`Error getting driver availability for driver: ${driverId}`, { error });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Update a driver's availability with new data
   * @param driverId The ID of the driver
   * @param availabilityData The new availability data
   * @param trx Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  async updateDriverAvailability(
    driverId: string,
    availabilityData: DriverAvailability,
    trx?: Transaction
  ): Promise<DriverAvailability> {
    logger.info(`Updating availability for driver: ${driverId}`, { availabilityData });
    try {
      // Check if the driver has an existing availability record
      let availability = await DriverAvailabilityModel.findByDriverId(driverId);

      if (!availability) {
        // If no record exists, create a new one
        logger.info(`No availability record found for driver, creating new record: ${driverId}`);
        availability = await DriverAvailabilityModel.createDriverAvailability(availabilityData, trx);
      } else {
        // If a record exists, update it
        availability = await DriverAvailabilityModel.updateDriverAvailability(driverId, availabilityData, trx);
      }

      // Publish an availability update event
      await this.eventsProducer.publishAvailabilityUpdate(driverId, availabilityData.status, availabilityData);

      return availability;
    } catch (error) {
      logger.error(`Error updating driver availability for driver: ${driverId}`, { error, availabilityData });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Update a driver's availability status
   * @param driverId The ID of the driver
   * @param status The new status of the driver
   * @param trx Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  async updateDriverStatus(
    driverId: string,
    status: DriverStatus,
    trx?: Transaction
  ): Promise<DriverAvailability> {
    logger.info(`Updating status for driver: ${driverId} to ${status}`);
    try {
      // Update the driver status
      const availability = await DriverAvailabilityModel.updateDriverStatus(driverId, status, trx);

      // Publish a status update event
      await this.eventsProducer.publishAvailabilityUpdate(driverId, status, { status });

      return availability;
    } catch (error) {
      logger.error(`Error updating driver status for driver: ${driverId}`, { error, status });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Update a driver's current location
   * @param driverId The ID of the driver
   * @param location The new location coordinates
   * @param trx Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  async updateDriverLocation(
    driverId: string,
    location: { latitude: number; longitude: number },
    trx?: Transaction
  ): Promise<DriverAvailability> {
    logger.info(`Updating location for driver: ${driverId}`, { location });
    try {
      // Validate the location object
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        throw new AppError('Invalid location data provided', { code: 'VAL_INVALID_INPUT' });
      }

      // Update the driver location
      const availability = await DriverAvailabilityModel.updateDriverLocation(driverId, location, trx);

      // Publish a location update event
      await this.eventsProducer.publishAvailabilityUpdate(driverId, availability.status, { location });

      return availability;
    } catch (error) {
      logger.error(`Error updating driver location for driver: ${driverId}`, { error, location });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Update a driver's Hours of Service data in availability record
   * @param driverId The ID of the driver
   * @param hosData The new HOS data
   * @param trx Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  async updateDriverHOS(
    driverId: string,
    hosData: {
      status: DriverStatus;
      driving_minutes_remaining: number;
      duty_minutes_remaining: number;
      cycle_minutes_remaining: number;
    },
    trx?: Transaction
  ): Promise<DriverAvailability> {
    logger.info(`Updating HOS for driver: ${driverId}`, { hosData });
    try {
      // Extract HOS fields from the provided data
      const { status, driving_minutes_remaining, duty_minutes_remaining, cycle_minutes_remaining } = hosData;

      // Update the HOS data
      const availability = await DriverAvailabilityModel.updateDriverHOS(
        driverId,
        status,
        driving_minutes_remaining,
        duty_minutes_remaining,
        cycle_minutes_remaining,
        trx
      );

      // Publish an HOS update event
      await this.eventsProducer.publishAvailabilityUpdate(driverId, status, { hosData });

      return availability;
    } catch (error) {
      logger.error(`Error updating HOS for driver: ${driverId}`, { error, hosData });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Update a driver's availability time window
   * @param driverId The ID of the driver
   * @param availableFrom Start of availability window
   * @param availableUntil End of availability window
   * @param trx Optional transaction object
   * @returns Promise resolving to the updated availability record
   */
  async updateDriverTimeWindow(
    driverId: string,
    availableFrom: Date,
    availableUntil: Date,
    trx?: Transaction
  ): Promise<DriverAvailability> {
    logger.info(`Updating time window for driver: ${driverId}`, { availableFrom, availableUntil });
    try {
      // Validate that availableFrom is before availableUntil
      if (availableFrom > availableUntil) {
        throw new AppError('Available from date must be before available until date', { code: 'VAL_INVALID_INPUT' });
      }

      // Update the time window
      const availability = await DriverAvailabilityModel.updateDriverTimeWindow(driverId, availableFrom, availableUntil, trx);

      // Publish a time window update event
      await this.eventsProducer.publishAvailabilityUpdate(driverId, availability.status, { availableFrom, availableUntil });

      return availability;
    } catch (error) {
      logger.error(`Error updating time window for driver: ${driverId}`, { error, availableFrom, availableUntil });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Find available drivers based on various criteria
   * @param criteria Object containing search criteria
   * @returns Promise resolving to an array of available driver records
   */
  async findAvailableDrivers(criteria: any): Promise<DriverAvailability[]> {
    logger.info('Finding available drivers', { criteria });
    try {
      const availabilityRecords = await DriverAvailabilityModel.findAvailableDrivers(criteria);
      return availabilityRecords;
    } catch (error) {
      logger.error('Error finding available drivers', { error, criteria });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Find available drivers near a specific location
   * @param location Center location for search
   * @param radiusMiles Search radius in miles
   * @param status Optional driver status filter (defaults to AVAILABLE)
   * @returns Promise resolving to an array of nearby driver records
   */
  async findDriversNearLocation(
    location: { latitude: number; longitude: number },
    radiusMiles: number,
    status: DriverStatus = DriverStatus.AVAILABLE
  ): Promise<DriverAvailability[]> {
    logger.info(`Finding drivers near location: ${location.latitude}, ${location.longitude} within ${radiusMiles} miles`);
    try {
      // Validate the location object
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        throw new AppError('Invalid location data provided', { code: 'VAL_INVALID_INPUT' });
      }

      const availabilityRecords = await DriverAvailabilityModel.findDriversNearLocation(location, radiusMiles, status);
      return availabilityRecords;
    } catch (error) {
      logger.error(`Error finding drivers near location: ${location.latitude}, ${location.longitude}`, { error, radiusMiles, status });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Check if a driver is available for a specific load
   * @param driverId The ID of the driver to check
   * @param loadDetails Details of the load to check availability for
   * @returns Promise resolving to availability result with reasons if not available
   */
  async checkDriverAvailabilityForLoad(
    driverId: string,
    loadDetails: {
      origin: { latitude: number; longitude: number };
      destination: { latitude: number; longitude: number };
      pickup_time: Date;
    }
  ): Promise<{ available: boolean; reasons?: string[] }> {
    logger.info(`Checking availability for driver: ${driverId} for load`, { loadDetails });
    try {
      // Get the driver's current availability record
      const availability = await DriverAvailabilityModel.findByDriverId(driverId);

      if (!availability) {
        return { available: false, reasons: ['Driver availability record not found'] };
      }

      // Call DriverAvailabilityModel.checkDriverAvailabilityForLoad with driver ID and load details
      const availabilityResult = await DriverAvailabilityModel.checkDriverAvailabilityForLoad(driverId, loadDetails);

      // If HOS validation is needed, call hosService.validateHOSForLoad
      // Combine the results of basic availability and HOS checks
      return availabilityResult;
    } catch (error) {
      logger.error(`Error checking driver availability for load: ${driverId}`, { error, loadDetails });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Predict a driver's availability at a future point in time
   * @param driverId The ID of the driver
   * @param futureTime The future time to predict availability for
   * @returns Promise resolving to the predicted availability
   */
  async predictDriverAvailability(driverId: string, futureTime: Date): Promise<DriverAvailability> {
    logger.info(`Predicting availability for driver: ${driverId} at ${futureTime}`);
    try {
      // Get the driver's current availability record
      const availability = await DriverAvailabilityModel.findByDriverId(driverId);

      if (!availability) {
        throw new AppError(`Availability data not found for driver: ${driverId}`, { code: 'RES_DRIVER_NOT_FOUND' });
      }

      // Call hosService.predictAvailableHours to get future HOS data
      const hosData = await this.hosService.predictAvailableHours(driverId, futureTime);

      // Create a predicted availability object based on current data and HOS predictions
      const predictedAvailability: DriverAvailability = {
        driver_id: driverId,
        status: availability.status, // Assuming status doesn't change
        current_location: availability.current_location, // Assuming location doesn't change
        available_from: futureTime,
        available_until: new Date(futureTime.getTime() + 24 * 60 * 60 * 1000), // Assuming available for 24 hours
        driving_minutes_remaining: hosData.drivingMinutes,
        duty_minutes_remaining: hosData.dutyMinutes,
        cycle_minutes_remaining: hosData.cycleMinutes,
        updated_at: new Date()
      };

      return predictedAvailability;
    } catch (error) {
      logger.error(`Error predicting availability for driver: ${driverId} at ${futureTime}`, { error });
      throw handleError(error, this.serviceName);
    }
  }

  /**
   * Find drivers available during a specific time window
   * @param startTime The start time of the window
   * @param endTime The end time of the window
   * @param additionalCriteria Additional criteria to filter drivers
   * @returns Promise resolving to an array of available driver records
   */
  async getDriversAvailableForTimeWindow(
    startTime: Date,
    endTime: Date,
    additionalCriteria: any = {}
  ): Promise<DriverAvailability[]> {
    logger.info(`Finding drivers available between ${startTime} and ${endTime}`, { additionalCriteria });
    try {
      // Validate that startTime is before endTime
      if (startTime > endTime) {
        throw new AppError('Start time must be before end time', { code: 'VAL_INVALID_INPUT' });
      }

      // Combine time window with any additional criteria provided
      const criteria = {
        timeWindow: { from: startTime, until: endTime },
        ...additionalCriteria
      };

      // Call findAvailableDrivers with the combined criteria
      const availabilityRecords = await DriverAvailabilityModel.findAvailableDrivers(criteria);
      return availabilityRecords;
    } catch (error) {
      logger.error(`Error finding drivers available between ${startTime} and ${endTime}`, { error, additionalCriteria });
      throw handleError(error, this.serviceName);
    }
  }
}