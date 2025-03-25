import { Transaction } from 'objection'; // objection@^3.0.1
import { DriverPreferenceModel } from '../models/driver-preference.model';
import { DriverPreference, PreferenceType } from '../../../common/interfaces/driver.interface';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * Service class for managing driver preferences
 * Provides methods for creating, retrieving, updating, and deleting driver preferences
 * that influence load matching, driver experience, and optimization algorithms
 */
export class PreferenceService {
  /**
   * Creates a new PreferenceService instance
   */
  constructor() {
    // Initialize the service
  }

  /**
   * Retrieves all preferences for a specific driver
   * @param driverId The driver ID to get preferences for
   * @returns Promise resolving to an array of driver preferences
   */
  async getDriverPreferences(driverId: string): Promise<DriverPreference[]> {
    try {
      logger.debug('Getting driver preferences', { driverId });
      return await DriverPreferenceModel.findByDriverId(driverId);
    } catch (error) {
      logger.error('Error getting driver preferences', { error, driverId });
      throw new AppError('Failed to get driver preferences', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { driverId }
      });
    }
  }

  /**
   * Retrieves preferences of a specific type for a driver
   * @param driverId The driver ID to get preferences for
   * @param preferenceType The type of preference to retrieve
   * @returns Promise resolving to an array of driver preferences
   */
  async getDriverPreferencesByType(driverId: string, preferenceType: PreferenceType): Promise<DriverPreference[]> {
    try {
      logger.debug('Getting driver preferences by type', { driverId, preferenceType });
      return await DriverPreferenceModel.findByDriverAndType(driverId, preferenceType);
    } catch (error) {
      logger.error('Error getting driver preferences by type', { error, driverId, preferenceType });
      throw new AppError('Failed to get driver preferences by type', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { driverId, preferenceType }
      });
    }
  }

  /**
   * Retrieves a specific preference by ID
   * @param preferenceId The ID of the preference to retrieve
   * @returns Promise resolving to the driver preference
   */
  async getPreferenceById(preferenceId: string): Promise<DriverPreference> {
    try {
      logger.debug('Getting preference by ID', { preferenceId });
      const preference = await DriverPreferenceModel.findById(preferenceId);
      
      if (!preference) {
        throw new AppError('Driver preference not found', {
          code: ErrorCodes.RES_DRIVER_NOT_FOUND,
          details: { preferenceId }
        });
      }
      
      return preference;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error getting preference by ID', { error, preferenceId });
      throw new AppError('Failed to get preference by ID', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { preferenceId }
      });
    }
  }

  /**
   * Creates a new preference for a driver
   * @param driverId The ID of the driver to create the preference for
   * @param preferenceData The preference data to create
   * @param trx Optional transaction object
   * @returns Promise resolving to the created driver preference
   */
  async createDriverPreference(
    driverId: string, 
    preferenceData: Partial<DriverPreference>, 
    trx?: Transaction
  ): Promise<DriverPreference> {
    try {
      logger.debug('Creating driver preference', { driverId, preferenceData });
      
      // Validate preference data
      this.validatePreferenceData(preferenceData);
      
      // Ensure driver ID is set
      const data = {
        ...preferenceData,
        driver_id: driverId
      };
      
      return await DriverPreferenceModel.createPreference(data, trx);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error creating driver preference', { error, driverId, preferenceData });
      throw new AppError('Failed to create driver preference', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { driverId }
      });
    }
  }

  /**
   * Updates an existing driver preference
   * @param driverId The ID of the driver who owns the preference
   * @param preferenceId The ID of the preference to update
   * @param preferenceData The new preference data
   * @param trx Optional transaction object
   * @returns Promise resolving to the updated driver preference
   */
  async updateDriverPreference(
    driverId: string,
    preferenceId: string,
    preferenceData: Partial<DriverPreference>,
    trx?: Transaction
  ): Promise<DriverPreference> {
    try {
      logger.debug('Updating driver preference', { driverId, preferenceId, preferenceData });
      
      // Verify the preference exists and belongs to the driver
      const existingPreference = await DriverPreferenceModel.findById(preferenceId);
      
      if (!existingPreference) {
        throw new AppError('Driver preference not found', {
          code: ErrorCodes.RES_DRIVER_NOT_FOUND,
          details: { preferenceId }
        });
      }
      
      if (existingPreference.driver_id !== driverId) {
        throw new AppError('Preference does not belong to this driver', {
          code: ErrorCodes.AUTHZ_RESOURCE_FORBIDDEN,
          details: { driverId, preferenceId }
        });
      }
      
      // Validate preference data
      this.validatePreferenceData(preferenceData);
      
      // Update the preference
      const updatedPreference = await DriverPreferenceModel.updatePreference(
        preferenceId,
        preferenceData,
        trx
      );
      
      if (!updatedPreference) {
        throw new AppError('Failed to update driver preference', {
          code: ErrorCodes.DB_QUERY_ERROR,
          details: { preferenceId }
        });
      }
      
      return updatedPreference;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error updating driver preference', { error, driverId, preferenceId, preferenceData });
      throw new AppError('Failed to update driver preference', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { driverId, preferenceId }
      });
    }
  }

  /**
   * Deletes a specific driver preference
   * @param driverId The ID of the driver who owns the preference
   * @param preferenceId The ID of the preference to delete
   * @param trx Optional transaction object
   * @returns Promise resolving to the number of deleted records
   */
  async deleteDriverPreference(
    driverId: string,
    preferenceId: string,
    trx?: Transaction
  ): Promise<number> {
    try {
      logger.debug('Deleting driver preference', { driverId, preferenceId });
      
      // Verify the preference exists and belongs to the driver
      const existingPreference = await DriverPreferenceModel.findById(preferenceId);
      
      if (!existingPreference) {
        throw new AppError('Driver preference not found', {
          code: ErrorCodes.RES_DRIVER_NOT_FOUND,
          details: { preferenceId }
        });
      }
      
      if (existingPreference.driver_id !== driverId) {
        throw new AppError('Preference does not belong to this driver', {
          code: ErrorCodes.AUTHZ_RESOURCE_FORBIDDEN,
          details: { driverId, preferenceId }
        });
      }
      
      // Delete the preference
      return await DriverPreferenceModel.deletePreference(preferenceId, trx);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error deleting driver preference', { error, driverId, preferenceId });
      throw new AppError('Failed to delete driver preference', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { driverId, preferenceId }
      });
    }
  }

  /**
   * Deletes all preferences for a driver
   * @param driverId The ID of the driver whose preferences should be deleted
   * @param trx Optional transaction object
   * @returns Promise resolving to the number of deleted records
   */
  async deleteAllDriverPreferences(driverId: string, trx?: Transaction): Promise<number> {
    try {
      logger.debug('Deleting all driver preferences', { driverId });
      return await DriverPreferenceModel.deleteDriverPreferences(driverId, trx);
    } catch (error) {
      logger.error('Error deleting all driver preferences', { error, driverId });
      throw new AppError('Failed to delete all driver preferences', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { driverId }
      });
    }
  }

  /**
   * Creates multiple driver preferences in a single transaction
   * @param driverId The ID of the driver to create preferences for
   * @param preferencesData Array of preference data to create
   * @param trx Optional transaction object
   * @returns Promise resolving to an array of created driver preferences
   */
  async bulkCreateDriverPreferences(
    driverId: string,
    preferencesData: Partial<DriverPreference>[],
    trx?: Transaction
  ): Promise<DriverPreference[]> {
    try {
      logger.debug('Bulk creating driver preferences', { driverId, count: preferencesData.length });
      
      // Validate each preference
      preferencesData.forEach(prefData => {
        this.validatePreferenceData(prefData);
      });
      
      return await DriverPreferenceModel.bulkCreatePreferences(driverId, preferencesData, trx);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error bulk creating driver preferences', { error, driverId, count: preferencesData.length });
      throw new AppError('Failed to bulk create driver preferences', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { driverId }
      });
    }
  }

  /**
   * Retrieves all preferences of a specific type across all drivers
   * @param preferenceType The type of preference to retrieve
   * @returns Promise resolving to an array of driver preferences
   */
  async getPreferencesByType(preferenceType: PreferenceType): Promise<DriverPreference[]> {
    try {
      logger.debug('Getting preferences by type', { preferenceType });
      return await DriverPreferenceModel.getPreferencesByType(preferenceType);
    } catch (error) {
      logger.error('Error getting preferences by type', { error, preferenceType });
      throw new AppError('Failed to get preferences by type', {
        code: ErrorCodes.DB_QUERY_ERROR,
        details: { preferenceType }
      });
    }
  }

  /**
   * Validates preference data before creation or update
   * @param preferenceData The preference data to validate
   * @returns True if valid, throws error if invalid
   */
  private validatePreferenceData(preferenceData: Partial<DriverPreference>): boolean {
    // Check if preference type is valid
    if (preferenceData.preference_type && 
        !Object.values(PreferenceType).includes(preferenceData.preference_type)) {
      throw new AppError('Invalid preference type', {
        code: ErrorCodes.VAL_INVALID_INPUT,
        details: { 
          preferenceType: preferenceData.preference_type,
          validTypes: Object.values(PreferenceType)
        }
      });
    }
    
    // Validate preference_value is not empty if provided
    if (preferenceData.preference_value !== undefined && 
        (preferenceData.preference_value === null || preferenceData.preference_value.trim() === '')) {
      throw new AppError('Preference value cannot be empty', {
        code: ErrorCodes.VAL_INVALID_INPUT,
        details: { preferenceType: preferenceData.preference_type }
      });
    }
    
    // Validate priority (if provided)
    if (preferenceData.priority !== undefined) {
      const priority = Number(preferenceData.priority);
      if (isNaN(priority) || priority < 1 || priority > 10) {
        throw new AppError('Priority must be a number between 1 and 10', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: { priority: preferenceData.priority }
        });
      }
    }
    
    return true;
  }
}