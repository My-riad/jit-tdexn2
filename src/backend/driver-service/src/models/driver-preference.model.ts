import { Model, ModelObject, QueryBuilder, Transaction } from 'objection'; // objection@^3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { DriverPreference, PreferenceType } from '../../../common/interfaces/driver.interface';
import logger from '../../../common/utils/logger';

/**
 * Database model for driver preferences, implementing the DriverPreference interface
 * Handles storage, retrieval, and management of driver preference records
 * used for load matching and driver experience optimization
 */
class DriverPreferenceModel extends Model implements DriverPreference {
  preference_id!: string;
  driver_id!: string;
  preference_type!: PreferenceType;
  preference_value!: string;
  priority!: number;
  created_at!: Date;
  updated_at!: Date;

  /**
   * Returns the database table name for this model
   * @returns The name of the database table
   */
  static tableName = 'driver_preferences';

  /**
   * Defines the JSON schema for validation of driver preference data
   * @returns JSON schema object for validation
   */
  static jsonSchema = {
    type: 'object',
    required: ['driver_id', 'preference_type', 'preference_value'],
    properties: {
      preference_id: { type: 'string' },
      driver_id: { type: 'string' },
      preference_type: { type: 'string' },
      preference_value: { type: 'string' },
      priority: { type: 'integer', default: 1 },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  };

  /**
   * Defines relationships with other models
   * @returns Object defining relationships to other models
   */
  static relationMappings = {
    driver: {
      relation: Model.BelongsToOneRelation,
      modelClass: 'src/backend/driver-service/src/models/driver.model',
      join: {
        from: 'driver_preferences.driver_id',
        to: 'drivers.driver_id'
      }
    }
  };

  /**
   * Find a preference by ID
   * @param preferenceId The preference ID to find
   * @returns Promise resolving to the preference record or null if not found
   */
  static async findById(preferenceId: string): Promise<DriverPreferenceModel | null> {
    try {
      logger.debug('Finding driver preference by ID', { preferenceId });
      return await DriverPreferenceModel.query().findById(preferenceId);
    } catch (error) {
      logger.error('Error finding driver preference by ID', { error, preferenceId });
      throw error;
    }
  }

  /**
   * Find all preferences for a specific driver
   * @param driverId The driver ID to find preferences for
   * @returns Promise resolving to an array of preference records
   */
  static async findByDriverId(driverId: string): Promise<DriverPreferenceModel[]> {
    try {
      logger.debug('Finding driver preferences by driver ID', { driverId });
      return await DriverPreferenceModel.query()
        .where('driver_id', driverId)
        .orderBy('priority', 'desc')
        .orderBy('created_at', 'asc');
    } catch (error) {
      logger.error('Error finding driver preferences by driver ID', { error, driverId });
      throw error;
    }
  }

  /**
   * Find preferences of a specific type for a driver
   * @param driverId The driver ID to find preferences for
   * @param preferenceType The preference type to filter by
   * @returns Promise resolving to an array of preference records
   */
  static async findByDriverAndType(driverId: string, preferenceType: PreferenceType): Promise<DriverPreferenceModel[]> {
    try {
      logger.debug('Finding driver preferences by driver ID and type', { driverId, preferenceType });
      return await DriverPreferenceModel.query()
        .where('driver_id', driverId)
        .where('preference_type', preferenceType)
        .orderBy('priority', 'desc')
        .orderBy('created_at', 'asc');
    } catch (error) {
      logger.error('Error finding driver preferences by driver ID and type', { error, driverId, preferenceType });
      throw error;
    }
  }

  /**
   * Create a new driver preference record
   * @param preferenceData The preference data to create
   * @param trx Optional transaction object
   * @returns Promise resolving to the created preference record
   */
  static async createPreference(preferenceData: Partial<DriverPreference>, trx?: Transaction): Promise<DriverPreferenceModel> {
    try {
      logger.debug('Creating driver preference', { preferenceData });
      const now = new Date();
      const preference = {
        preference_id: preferenceData.preference_id || uuidv4(),
        ...preferenceData,
        priority: preferenceData.priority || 1,
        created_at: now,
        updated_at: now
      };

      return await DriverPreferenceModel.query(trx).insert(preference);
    } catch (error) {
      logger.error('Error creating driver preference', { error, preferenceData });
      throw error;
    }
  }

  /**
   * Update an existing driver preference record
   * @param preferenceId The ID of the preference to update
   * @param preferenceData The new preference data
   * @param trx Optional transaction object
   * @returns Promise resolving to the updated preference record
   */
  static async updatePreference(
    preferenceId: string, 
    preferenceData: Partial<DriverPreference>, 
    trx?: Transaction
  ): Promise<DriverPreferenceModel | null> {
    try {
      logger.debug('Updating driver preference', { preferenceId, preferenceData });
      const updatedPreference = {
        ...preferenceData,
        updated_at: new Date()
      };

      return await DriverPreferenceModel.query(trx)
        .patchAndFetchById(preferenceId, updatedPreference);
    } catch (error) {
      logger.error('Error updating driver preference', { error, preferenceId, preferenceData });
      throw error;
    }
  }

  /**
   * Delete a driver preference record
   * @param preferenceId The ID of the preference to delete
   * @param trx Optional transaction object
   * @returns Promise resolving to the number of deleted records
   */
  static async deletePreference(preferenceId: string, trx?: Transaction): Promise<number> {
    try {
      logger.debug('Deleting driver preference', { preferenceId });
      return await DriverPreferenceModel.query(trx)
        .deleteById(preferenceId);
    } catch (error) {
      logger.error('Error deleting driver preference', { error, preferenceId });
      throw error;
    }
  }

  /**
   * Delete all preferences for a driver
   * @param driverId The ID of the driver whose preferences should be deleted
   * @param trx Optional transaction object
   * @returns Promise resolving to the number of deleted records
   */
  static async deleteDriverPreferences(driverId: string, trx?: Transaction): Promise<number> {
    try {
      logger.debug('Deleting all driver preferences', { driverId });
      return await DriverPreferenceModel.query(trx)
        .delete()
        .where('driver_id', driverId);
    } catch (error) {
      logger.error('Error deleting driver preferences', { error, driverId });
      throw error;
    }
  }

  /**
   * Get all preferences of a specific type across all drivers
   * @param preferenceType The preference type to filter by
   * @returns Promise resolving to an array of preference records
   */
  static async getPreferencesByType(preferenceType: PreferenceType): Promise<DriverPreferenceModel[]> {
    try {
      logger.debug('Getting preferences by type', { preferenceType });
      return await DriverPreferenceModel.query()
        .where('preference_type', preferenceType)
        .orderBy('driver_id')
        .orderBy('priority', 'desc');
    } catch (error) {
      logger.error('Error getting preferences by type', { error, preferenceType });
      throw error;
    }
  }

  /**
   * Create multiple driver preference records in a single transaction
   * @param driverId The driver ID for all preferences
   * @param preferencesData Array of preference data objects to create
   * @param trx Optional transaction object
   * @returns Promise resolving to an array of created preference records
   */
  static async bulkCreatePreferences(
    driverId: string, 
    preferencesData: Partial<DriverPreference>[], 
    trx?: Transaction
  ): Promise<DriverPreferenceModel[]> {
    try {
      logger.debug('Bulk creating driver preferences', { driverId, preferencesCount: preferencesData.length });
      const now = new Date();
      const preferences = preferencesData.map(prefData => ({
        preference_id: prefData.preference_id || uuidv4(),
        driver_id: driverId,
        preference_type: prefData.preference_type,
        preference_value: prefData.preference_value,
        priority: prefData.priority || 1,
        created_at: now,
        updated_at: now
      }));

      return await DriverPreferenceModel.query(trx).insert(preferences);
    } catch (error) {
      logger.error('Error bulk creating driver preferences', { error, driverId, preferencesCount: preferencesData.length });
      throw error;
    }
  }
}

export { DriverPreferenceModel };