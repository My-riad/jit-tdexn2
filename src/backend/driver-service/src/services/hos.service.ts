import { Transaction } from 'objection'; // objection.js v3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import { DriverHOS, HOSStatus } from '../../../common/interfaces/driver.interface';
import db from '../../../common/config/database.config';
import logger from '../../../common/utils/logger';
import { DriverEventsProducer } from '../producers/driver-events.producer';

/**
 * Service for managing driver Hours of Service (HOS) data and compliance
 */
export class HOSService {
  private readonly eventsProducer: DriverEventsProducer;

  /**
   * Creates a new HOSService instance
   * @param eventsProducer The events producer for publishing HOS updates
   */
  constructor(eventsProducer: DriverEventsProducer) {
    this.eventsProducer = eventsProducer;
  }

  /**
   * Get the current HOS status for a driver
   * @param driverId The ID of the driver
   * @returns Promise resolving to the driver's current HOS data
   */
  async getDriverHOS(driverId: string): Promise<DriverHOS> {
    logger.info(`Getting HOS data for driver: ${driverId}`);
    try {
      const hosData = await db.knex('driver_hos')
        .where({ driver_id: driverId })
        .orderBy('recorded_at', 'desc')
        .first();

      if (!hosData) {
        throw new Error(`HOS data not found for driver: ${driverId}`);
      }

      return hosData;
    } catch (error) {
      logger.error(`Error getting HOS data for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Get HOS history for a driver within a time range
   * @param driverId The ID of the driver
   * @param startDate The start date for the history
   * @param endDate The end date for the history
   * @returns Promise resolving to an array of driver HOS records
   */
  async getDriverHOSHistory(driverId: string, startDate: Date, endDate: Date): Promise<DriverHOS[]> {
    logger.info(`Getting HOS history for driver: ${driverId}`, { startDate, endDate });
    try {
      const hosHistory = await db.knex('driver_hos')
        .where({ driver_id: driverId })
        .whereBetween('recorded_at', [startDate, endDate])
        .orderBy('recorded_at', 'desc');

      return hosHistory;
    } catch (error) {
      logger.error(`Error getting HOS history for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Update a driver's HOS status with new data
   * @param driverId The ID of the driver
   * @param hosData The new HOS data
   * @param trx Optional database transaction
   * @returns Promise resolving to the updated HOS record
   */
  async updateDriverHOS(driverId: string, hosData: DriverHOS, trx?: Transaction): Promise<DriverHOS> {
    logger.info(`Updating HOS for driver: ${driverId}`, { hosData });
    try {
      // Verify that the driver exists
      const driver = await db.knex('drivers').where({ driver_id: driverId }).first();
      if (!driver) {
        throw new Error(`Driver not found: ${driverId}`);
      }

      // Prepare the HOS data
      const now = new Date();
      const newHosData = {
        hos_id: uuidv4(),
        driver_id: driverId,
        status: hosData.status,
        status_since: now,
        driving_minutes_remaining: hosData.driving_minutes_remaining,
        duty_minutes_remaining: hosData.duty_minutes_remaining,
        cycle_minutes_remaining: hosData.cycle_minutes_remaining,
        location: hosData.location,
        vehicle_id: hosData.vehicle_id,
        eld_log_id: hosData.eld_log_id,
        recorded_at: now
      };

      // Create a new HOS record
      const query = trx ? db.knex.transacting(trx) : db.knex;
      const createdHos = await query('driver_hos').insert(newHosData).returning('*');

      // Update driver's availability
      await DriverHOSModel.updateDriverAvailability(driverId, hosData, trx);

      // Update driver's status
      await DriverModel.updateDriverStatus(driverId, hosData.status, trx);

      // Publish an HOS update event
      this.eventsProducer.publishHOSUpdate(driverId, hosData.status, hosData);

      return createdHos[0];
    } catch (error) {
      logger.error(`Error updating HOS for driver: ${driverId}`, { error, hosData });
      throw error;
    }
  }

  /**
   * Fetch the latest HOS data from a driver's ELD provider
   * @param driverId The ID of the driver
   * @returns Promise resolving to the fetched HOS data
   */
  async fetchHOSFromELD(driverId: string): Promise<DriverHOS> {
    logger.info(`Fetching HOS data from ELD for driver: ${driverId}`);
    try {
      // Retrieve the driver record to get ELD integration details
      const driver = await DriverModel.findById(driverId);
      if (!driver) {
        throw new Error(`Driver not found: ${driverId}`);
      }

      if (!driver.eld_device_id || !driver.eld_provider) {
        throw new Error(`No ELD integration configured for driver: ${driverId}`);
      }

      // Get the appropriate ELD provider
      const eldProvider = EldProviderFactory.getProvider(driver.eld_provider);

      // Fetch HOS data from the ELD provider
      const hosData = await eldProvider.getDriverHOS(driverId, driver.eld_device_id);

      // Update the driver's HOS record
      const updatedHosData = await this.updateDriverHOS(driverId, hosData);

      return updatedHosData;
    } catch (error) {
      logger.error(`Error fetching HOS data from ELD for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Check if a driver is compliant with HOS regulations
   * @param driverId The ID of the driver
   * @returns Promise resolving to compliance status and any violations
   */
  async checkHOSCompliance(driverId: string): Promise<{ compliant: boolean; violations: string[] }> {
    logger.info(`Checking HOS compliance for driver: ${driverId}`);
    try {
      // Get the driver's current HOS status
      const hosData = await this.getDriverHOS(driverId);
      if (!hosData) {
        return { compliant: false, violations: ['No HOS data found for driver'] };
      }

      const violations: string[] = [];

      // Check for various compliance issues
      if (hosData.driving_minutes_remaining <= 0) {
        violations.push('Driving time exceeded');
      }
      if (hosData.duty_minutes_remaining <= 0) {
        violations.push('On-duty time exceeded');
      }
      if (hosData.cycle_minutes_remaining <= 0) {
        violations.push('Cycle time exceeded');
      }

      // Return compliance status
      return { compliant: violations.length === 0, violations };
    } catch (error) {
      logger.error(`Error checking HOS compliance for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Calculate available driving hours for a specific trip
   * @param driverId The ID of the driver
   * @param estimatedDrivingMinutes The estimated driving time for the trip
   * @returns Promise resolving to availability status and remaining minutes
   */
  async calculateAvailableHours(driverId: string, estimatedDrivingMinutes: number): Promise<{ available: boolean; remainingMinutes: number }> {
    logger.info(`Calculating available hours for driver: ${driverId}`, { estimatedDrivingMinutes });
    try {
      // Get the driver's current HOS status
      const hosData = await this.getDriverHOS(driverId);
      if (!hosData) {
        return { available: false, remainingMinutes: 0 };
      }

      // Compare driving_minutes_remaining with estimatedDrivingMinutes
      const remainingMinutes = hosData.driving_minutes_remaining - estimatedDrivingMinutes;
      const available = remainingMinutes >= 0;

      return { available, remainingMinutes };
    } catch (error) {
      logger.error(`Error calculating available hours for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Predict a driver's available hours at a future point in time
   * @param driverId The ID of the driver
   * @param futureTime The future time to predict availability for
   * @returns Promise resolving to predicted available hours
   */
  async predictAvailableHours(driverId: string, futureTime: Date): Promise<{ drivingMinutes: number; dutyMinutes: number; cycleMinutes: number }> {
    logger.info(`Predicting available hours for driver: ${driverId} at ${futureTime}`);
    try {
      // Get the driver's current HOS status
      const hosData = await this.getDriverHOS(driverId);
      if (!hosData) {
        throw new Error(`No HOS records found for driver: ${driverId}`);
      }

      // Calculate time difference between now and futureTime
      const now = new Date();
      const minutesToFuture = Math.floor((futureTime.getTime() - now.getTime()) / 60000);

      // Apply HOS rules to predict available hours at the future time
      let drivingMinutes = hosData.driving_minutes_remaining;
      let dutyMinutes = hosData.duty_minutes_remaining;
      let cycleMinutes = hosData.cycle_minutes_remaining;

      // This is a simplified prediction and would need to be enhanced with
      // actual driver schedules, planned stops, rest periods, etc.
      drivingMinutes = Math.max(0, drivingMinutes - minutesToFuture);
      dutyMinutes = Math.max(0, dutyMinutes - minutesToFuture);
      cycleMinutes = Math.max(0, cycleMinutes - minutesToFuture);

      return { drivingMinutes, dutyMinutes, cycleMinutes };
    } catch (error) {
      logger.error(`Error predicting available hours for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Validate if a driver has sufficient HOS to complete a load
   * @param driverId The ID of the driver
   * @param loadDetails The details of the load
   * @returns Promise resolving to validation result and reason if invalid
   */
  async validateHOSForLoad(driverId: string, loadDetails: any): Promise<{ valid: boolean; reason?: string }> {
    logger.info(`Validating HOS for driver: ${driverId} for load`, { loadDetails });
    try {
      // Get the driver's current HOS status
      const hosData = await this.getDriverHOS(driverId);
      if (!hosData) {
        return { valid: false, reason: 'No HOS records found for driver' };
      }

      // Check if pickup time is compatible with current HOS status
      const now = new Date();
      const minutesToPickup = Math.floor((loadDetails.pickup_time.getTime() - now.getTime()) / 60000);

      // Check if driver will have enough hours for the entire trip
      if (hosData.driving_minutes_remaining < loadDetails.estimatedDrivingMinutes) {
        return {
          valid: false,
          reason: `Insufficient driving hours: Need ${loadDetails.estimatedDrivingMinutes} minutes, have ${hosData.driving_minutes_remaining} minutes`
        };
      }

      return { valid: true };
    } catch (error) {
      logger.error(`Error validating HOS for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Update driver availability based on HOS data
   * @param driverId The ID of the driver
   * @param hosData The HOS data to use for the update
   * @param trx Optional database transaction
   * @returns Promise resolving when the availability is updated
   */
  async updateDriverAvailabilityFromHOS(driverId: string, hosData: DriverHOS, trx?: Transaction): Promise<void> {
    logger.info(`Updating availability for driver: ${driverId}`, { hosData });
    try {
      // Get the driver's current availability record
      const availability = await DriverAvailabilityModel.findByDriverId(driverId);

      // Update the availability with new HOS status and remaining hours
      if (availability) {
        await DriverAvailabilityModel.updateDriverAvailability(driverId, {
          status: hosData.status,
          driving_minutes_remaining: hosData.driving_minutes_remaining,
          duty_minutes_remaining: hosData.duty_minutes_remaining,
          cycle_minutes_remaining: hosData.cycle_minutes_remaining,
          updated_at: new Date()
        }, trx);
      }

      logger.info(`Updated availability for driver: ${driverId}`);
    } catch (error) {
      logger.error(`Error updating availability for driver: ${driverId}`, { error, hosData });
      throw error;
    }
  }
}