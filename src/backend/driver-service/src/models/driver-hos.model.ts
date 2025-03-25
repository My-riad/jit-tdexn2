import { Transaction } from 'objection'; // objection.js v3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import { DriverHOS, HOSStatus } from '../../../common/interfaces/driver.interface';
import db from '../../../common/config/database.config';
import logger from '../../../common/utils/logger';

/**
 * Model class for interacting with driver Hours of Service (HOS) records in the database
 */
export class DriverHOSModel {
  /**
   * Private constructor to prevent direct instantiation as this is a static utility class
   */
  private constructor() {
    // Private constructor to enforce static usage
  }

  /**
   * Retrieves the most recent HOS record for a specific driver
   * 
   * @param driverId The unique identifier of the driver
   * @returns Promise resolving to the driver's most recent HOS record or null if not found
   */
  public static async findByDriverId(driverId: string): Promise<DriverHOS | null> {
    try {
      logger.info(`Finding most recent HOS record for driver: ${driverId}`);
      
      const hosRecord = await db.knex('driver_hos')
        .where({ driver_id: driverId })
        .orderBy('recorded_at', 'desc')
        .first();
      
      return hosRecord || null;
    } catch (error) {
      logger.error(`Error finding HOS record for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves HOS history for a driver within a specified time range
   * 
   * @param driverId The unique identifier of the driver
   * @param startDate The start date for the history query
   * @param endDate The end date for the history query
   * @param options Additional query options like pagination
   * @returns Promise resolving to an array of driver HOS records
   */
  public static async findHOSHistory(
    driverId: string,
    startDate: Date,
    endDate: Date,
    options: { page?: number; limit?: number } = {}
  ): Promise<DriverHOS[]> {
    try {
      logger.info(`Finding HOS history for driver: ${driverId}`, {
        startDate,
        endDate,
        options
      });
      
      let query = db.knex('driver_hos')
        .where({ driver_id: driverId })
        .whereBetween('recorded_at', [startDate, endDate]);
      
      // Apply pagination if provided
      if (options.page !== undefined && options.limit !== undefined) {
        const offset = (options.page - 1) * options.limit;
        query = query.offset(offset).limit(options.limit);
      }
      
      // Order by recorded_at in descending order
      query = query.orderBy('recorded_at', 'desc');
      
      return await query;
    } catch (error) {
      logger.error(`Error finding HOS history for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Creates a new HOS record for a driver
   * 
   * @param hosData The HOS data to create
   * @param trx Optional transaction instance
   * @returns Promise resolving to the created HOS record
   */
  public static async createHOSRecord(
    hosData: DriverHOS,
    trx?: Transaction
  ): Promise<DriverHOS> {
    try {
      logger.info(`Creating new HOS record for driver: ${hosData.driver_id}`);
      
      // Generate a new UUID if not provided
      if (!hosData.hos_id) {
        hosData.hos_id = uuidv4();
      }
      
      // Set recorded_at to current timestamp if not provided
      if (!hosData.recorded_at) {
        hosData.recorded_at = new Date();
      }
      
      const query = trx ? db.knex.transacting(trx) : db.knex;
      const result = await query('driver_hos').insert(hosData).returning('*');
      
      return result[0];
    } catch (error) {
      logger.error(`Error creating HOS record for driver: ${hosData.driver_id}`, { error });
      throw error;
    }
  }

  /**
   * Updates a driver's availability based on their HOS status
   * 
   * @param driverId The unique identifier of the driver
   * @param hosData The HOS data to use for the update
   * @param trx Optional transaction instance
   * @returns Promise resolving when the update is complete
   */
  public static async updateDriverAvailability(
    driverId: string,
    hosData: DriverHOS,
    trx?: Transaction
  ): Promise<void> {
    const knexTrx = trx || await db.knex.transaction();
    
    try {
      logger.info(`Updating availability for driver: ${driverId}`);
      
      // Extract HOS data
      const { status, driving_minutes_remaining, duty_minutes_remaining, cycle_minutes_remaining } = hosData;
      
      // Determine driver availability status based on HOS status
      let driverStatus;
      if (status === HOSStatus.OFF_DUTY || status === HOSStatus.SLEEPER_BERTH) {
        driverStatus = 'AVAILABLE';
      } else if (status === HOSStatus.DRIVING) {
        driverStatus = 'DRIVING';
      } else {
        driverStatus = 'ON_DUTY';
      }
      
      // Update driver availability
      await knexTrx('driver_availability')
        .where({ driver_id: driverId })
        .update({
          status: driverStatus,
          driving_minutes_remaining,
          duty_minutes_remaining,
          cycle_minutes_remaining,
          updated_at: new Date()
        });
      
      // Commit the transaction if we started it
      if (!trx) {
        await knexTrx.commit();
      }
    } catch (error) {
      // Rollback the transaction if we started it
      if (!trx) {
        await knexTrx.rollback();
      }
      
      logger.error(`Error updating driver availability: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Calculates a driver's available hours based on HOS regulations
   * 
   * @param driverId The unique identifier of the driver
   * @param currentStatus The current HOS status of the driver
   * @param statusSince The timestamp when the current status began
   * @returns Promise resolving to the calculated available hours
   */
  public static async calculateAvailableHours(
    driverId: string,
    currentStatus: HOSStatus,
    statusSince: Date
  ): Promise<{ driving_minutes_remaining: number; duty_minutes_remaining: number; cycle_minutes_remaining: number }> {
    try {
      logger.info(`Calculating available hours for driver: ${driverId}`);
      
      // Get HOS history for the past 8 days (for 70-hour/8-day rule)
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      
      const hosHistory = await DriverHOSModel.findHOSHistory(driverId, eightDaysAgo, new Date());
      
      // Default maximum values (in minutes) based on FMCSA regulations
      const MAX_DRIVING_MINUTES = 11 * 60; // 11 hours driving limit
      const MAX_DUTY_MINUTES = 14 * 60;     // 14 hours on-duty limit
      const MAX_CYCLE_MINUTES = 70 * 60;    // 70 hours in 8 days limit
      
      // Calculate time spent in each status
      let drivingMinutes = 0;
      let dutyMinutes = 0;
      let cycleMinutes = 0;
      
      // Calculate minutes since current status began
      const now = new Date();
      const minutesSinceStatusChange = Math.floor((now.getTime() - statusSince.getTime()) / 60000);
      
      // Add current status time
      if (currentStatus === HOSStatus.DRIVING) {
        drivingMinutes += minutesSinceStatusChange;
        dutyMinutes += minutesSinceStatusChange;
        cycleMinutes += minutesSinceStatusChange;
      } else if (currentStatus === HOSStatus.ON_DUTY) {
        dutyMinutes += minutesSinceStatusChange;
        cycleMinutes += minutesSinceStatusChange;
      }
      
      // Process history to calculate used hours in current period
      // This is a simplified calculation and would need to be enhanced
      // with actual FMCSA HOS rule implementation including breaks,
      // reset periods, etc.
      for (let i = 0; i < hosHistory.length - 1; i++) {
        const current = hosHistory[i];
        const next = hosHistory[i + 1];
        
        // Calculate duration between status changes
        const durationMinutes = Math.floor(
          (current.recorded_at.getTime() - next.recorded_at.getTime()) / 60000
        );
        
        if (current.status === HOSStatus.DRIVING) {
          drivingMinutes += durationMinutes;
          dutyMinutes += durationMinutes;
          cycleMinutes += durationMinutes;
        } else if (current.status === HOSStatus.ON_DUTY) {
          dutyMinutes += durationMinutes;
          cycleMinutes += durationMinutes;
        }
      }
      
      // Calculate remaining minutes
      const drivingMinutesRemaining = Math.max(0, MAX_DRIVING_MINUTES - drivingMinutes);
      const dutyMinutesRemaining = Math.max(0, MAX_DUTY_MINUTES - dutyMinutes);
      const cycleMinutesRemaining = Math.max(0, MAX_CYCLE_MINUTES - cycleMinutes);
      
      return {
        driving_minutes_remaining: drivingMinutesRemaining,
        duty_minutes_remaining: dutyMinutesRemaining,
        cycle_minutes_remaining: cycleMinutesRemaining
      };
    } catch (error) {
      logger.error(`Error calculating available hours for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Generates a summary of a driver's duty status over a time period
   * 
   * @param driverId The unique identifier of the driver
   * @param startDate The start date for the summary
   * @param endDate The end date for the summary
   * @returns Promise resolving to a summary of time spent in each status
   */
  public static async getDriverDutyStatusSummary(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    driving_minutes: number;
    on_duty_minutes: number;
    off_duty_minutes: number;
    sleeper_berth_minutes: number;
    total_minutes: number;
  }> {
    try {
      logger.info(`Getting duty status summary for driver: ${driverId}`, {
        startDate,
        endDate
      });
      
      // Get HOS history for the specified time period
      const hosHistory = await DriverHOSModel.findHOSHistory(driverId, startDate, endDate);
      
      // Initialize counters
      let drivingMinutes = 0;
      let onDutyMinutes = 0;
      let offDutyMinutes = 0;
      let sleeperBerthMinutes = 0;
      
      // Process history to calculate time in each status
      for (let i = 0; i < hosHistory.length - 1; i++) {
        const current = hosHistory[i];
        const next = hosHistory[i + 1];
        
        // Calculate duration between status changes
        const durationMinutes = Math.floor(
          (current.recorded_at.getTime() - next.recorded_at.getTime()) / 60000
        );
        
        switch (current.status) {
          case HOSStatus.DRIVING:
            drivingMinutes += durationMinutes;
            break;
          case HOSStatus.ON_DUTY:
            onDutyMinutes += durationMinutes;
            break;
          case HOSStatus.OFF_DUTY:
            offDutyMinutes += durationMinutes;
            break;
          case HOSStatus.SLEEPER_BERTH:
            sleeperBerthMinutes += durationMinutes;
            break;
        }
      }
      
      // Calculate total minutes in the period
      const totalMinutes = Math.floor(
        (endDate.getTime() - startDate.getTime()) / 60000
      );
      
      return {
        driving_minutes: drivingMinutes,
        on_duty_minutes: onDutyMinutes,
        off_duty_minutes: offDutyMinutes,
        sleeper_berth_minutes: sleeperBerthMinutes,
        total_minutes: totalMinutes
      };
    } catch (error) {
      logger.error(`Error getting duty status summary for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Validates if a driver has sufficient HOS to complete a load
   * 
   * @param driverId The unique identifier of the driver
   * @param loadDetails Details about the load to validate
   * @returns Promise resolving to validation result and reason if invalid
   */
  public static async validateHOSForLoad(
    driverId: string,
    loadDetails: {
      estimated_driving_minutes: number;
      pickup_time: Date;
      delivery_time: Date;
    }
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      logger.info(`Validating HOS for driver: ${driverId} for load`, { loadDetails });
      
      // Get current HOS status
      const currentHOS = await DriverHOSModel.findByDriverId(driverId);
      if (!currentHOS) {
        return { valid: false, reason: 'No HOS records found for driver' };
      }
      
      // Check if load pickup time is compatible with current HOS status
      const now = new Date();
      const minutesToPickup = Math.floor(
        (loadDetails.pickup_time.getTime() - now.getTime()) / 60000
      );
      
      // Check if driver will have enough hours for the entire trip
      if (currentHOS.driving_minutes_remaining < loadDetails.estimated_driving_minutes) {
        return {
          valid: false,
          reason: `Insufficient driving hours: Need ${loadDetails.estimated_driving_minutes} minutes, have ${currentHOS.driving_minutes_remaining} minutes`
        };
      }
      
      // Check on-duty hours
      // For simplicity, we're assuming the entire driving time plus 1 hour for loading/unloading
      const estimatedDutyMinutes = loadDetails.estimated_driving_minutes + 60;
      if (currentHOS.duty_minutes_remaining < estimatedDutyMinutes) {
        return {
          valid: false,
          reason: `Insufficient duty hours: Need ${estimatedDutyMinutes} minutes, have ${currentHOS.duty_minutes_remaining} minutes`
        };
      }
      
      // Check cycle hours
      if (currentHOS.cycle_minutes_remaining < estimatedDutyMinutes) {
        return {
          valid: false,
          reason: `Insufficient cycle hours: Need ${estimatedDutyMinutes} minutes, have ${currentHOS.cycle_minutes_remaining} minutes`
        };
      }
      
      // If we made it here, the driver has sufficient hours
      return { valid: true };
    } catch (error) {
      logger.error(`Error validating HOS for driver: ${driverId}`, { error });
      throw error;
    }
  }

  /**
   * Predicts a driver's HOS availability at a future point in time
   * 
   * @param driverId The unique identifier of the driver
   * @param targetDate The future date to predict availability for
   * @returns Promise resolving to predicted available hours
   */
  public static async predictHOSAvailability(
    driverId: string,
    targetDate: Date
  ): Promise<{
    driving_minutes_remaining: number;
    duty_minutes_remaining: number;
    cycle_minutes_remaining: number;
  }> {
    try {
      logger.info(`Predicting HOS availability for driver: ${driverId} at ${targetDate}`);
      
      // Get current HOS status
      const currentHOS = await DriverHOSModel.findByDriverId(driverId);
      if (!currentHOS) {
        throw new Error(`No HOS records found for driver: ${driverId}`);
      }
      
      // Default maximum values (in minutes) based on FMCSA regulations
      const MAX_DRIVING_MINUTES = 11 * 60; // 11 hours driving limit
      const MAX_DUTY_MINUTES = 14 * 60;    // 14 hours on-duty limit
      const MAX_CYCLE_MINUTES = 70 * 60;   // 70 hours in 8 days limit
      
      // Calculate time difference between now and target date
      const now = new Date();
      const minutesToTarget = Math.floor((targetDate.getTime() - now.getTime()) / 60000);
      
      // If target date is in the past, return current HOS
      if (minutesToTarget <= 0) {
        return {
          driving_minutes_remaining: currentHOS.driving_minutes_remaining,
          duty_minutes_remaining: currentHOS.duty_minutes_remaining,
          cycle_minutes_remaining: currentHOS.cycle_minutes_remaining
        };
      }
      
      // Predict future HOS availability based on current status and elapsed time
      // This is a very simplified prediction and would need to be enhanced with
      // actual driver schedules, planned stops, rest periods, etc.
      
      let drivingMinutesRemaining = currentHOS.driving_minutes_remaining;
      let dutyMinutesRemaining = currentHOS.duty_minutes_remaining;
      let cycleMinutesRemaining = currentHOS.cycle_minutes_remaining;
      
      // Adjust based on current status
      if (currentHOS.status === HOSStatus.OFF_DUTY || currentHOS.status === HOSStatus.SLEEPER_BERTH) {
        // If currently off duty or in sleeper berth, apply rest rules
        
        // Calculate time since current status began
        const minutesSinceStatusChange = Math.floor(
          (now.getTime() - currentHOS.status_since.getTime()) / 60000
        );
        
        // Check for 10-hour reset (simplified)
        if (minutesSinceStatusChange + minutesToTarget >= 10 * 60) {
          // Full reset of driving and duty hours
          drivingMinutesRemaining = MAX_DRIVING_MINUTES;
          dutyMinutesRemaining = MAX_DUTY_MINUTES;
        }
        
        // Check for 34-hour reset (simplified)
        if (minutesSinceStatusChange + minutesToTarget >= 34 * 60) {
          // Full reset of cycle hours
          cycleMinutesRemaining = MAX_CYCLE_MINUTES;
        }
      } else {
        // If currently driving or on duty, subtract elapsed time
        const minutesUsed = Math.min(minutesToTarget, dutyMinutesRemaining);
        
        if (currentHOS.status === HOSStatus.DRIVING) {
          drivingMinutesRemaining = Math.max(0, drivingMinutesRemaining - minutesUsed);
        }
        
        dutyMinutesRemaining = Math.max(0, dutyMinutesRemaining - minutesUsed);
        cycleMinutesRemaining = Math.max(0, cycleMinutesRemaining - minutesUsed);
      }
      
      return {
        driving_minutes_remaining: drivingMinutesRemaining,
        duty_minutes_remaining: dutyMinutesRemaining,
        cycle_minutes_remaining: cycleMinutesRemaining
      };
    } catch (error) {
      logger.error(`Error predicting HOS availability for driver: ${driverId}`, { error });
      throw error;
    }
  }
}