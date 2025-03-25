import { Transaction } from 'objection'; // v3.0.1
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { 
  NotificationPreference,
  NotificationType,
  FrequencyType,
  FrequencySettings,
  TimeWindow
} from '../models/notification-preference.model';
import { NotificationChannelType } from '../models/notification-channel.model';

/**
 * Interface defining the data required to create a new notification preference
 */
interface PreferenceCreateData {
  userId: string;
  userType: string;
  notificationType: NotificationType;
  channels: NotificationChannelType[];
  enabled?: boolean;
  frequency?: FrequencySettings;
  timeWindow?: TimeWindow;
}

/**
 * Interface defining the data that can be updated for a notification preference
 */
interface PreferenceUpdateData {
  channels?: NotificationChannelType[];
  enabled?: boolean;
  frequency?: FrequencySettings;
  timeWindow?: TimeWindow;
}

/**
 * Interface defining options for querying preferences
 */
interface PreferenceQueryOptions {
  enabled?: boolean;
  notificationType?: NotificationType;
  channelType?: NotificationChannelType;
}

/**
 * Service responsible for managing user notification preferences, including creation,
 * retrieval, updating, and application of preferences for different notification types
 * and channels.
 */
export class PreferenceService {
  /**
   * Initializes the preference service
   */
  constructor() {
    // Initialize service with default configuration
  }

  /**
   * Creates a new notification preference for a user
   * 
   * @param preferenceData Data for creating the preference
   * @returns The created preference
   */
  async createPreference(preferenceData: PreferenceCreateData): Promise<NotificationPreference> {
    try {
      // Validate the preference data
      const validation = this.validatePreferenceData(preferenceData);
      if (!validation.isValid) {
        logger.error('Invalid preference data', { errors: validation.errors });
        throw createError(ErrorCodes.INVALID_PREFERENCE_DATA, `Invalid preference data: ${validation.errors.join(', ')}`);
      }

      // Check if preference already exists for this user and notification type
      const existingPreference = await NotificationPreference.getTypePreference(
        preferenceData.userId,
        preferenceData.userType,
        preferenceData.notificationType
      );

      if (existingPreference) {
        // Update the existing preference instead of creating a new one
        const updateData: PreferenceUpdateData = {
          channels: preferenceData.channels,
          enabled: preferenceData.enabled !== undefined ? preferenceData.enabled : true,
          frequency: preferenceData.frequency,
          timeWindow: preferenceData.timeWindow
        };

        return this.updatePreference(existingPreference.id, updateData);
      }

      // Create a new preference instance
      const preference = new NotificationPreference();
      preference.userId = preferenceData.userId;
      preference.userType = preferenceData.userType;
      preference.notificationType = preferenceData.notificationType;
      preference.channels = preferenceData.channels.map(c => c.toString());
      preference.enabled = preferenceData.enabled !== undefined ? preferenceData.enabled : true;
      
      if (preferenceData.frequency) {
        preference.frequency = preferenceData.frequency;
      }
      
      if (preferenceData.timeWindow) {
        preference.timeWindow = preferenceData.timeWindow;
      }

      // Save the preference to the database
      const createdPreference = await NotificationPreference.query().insert(preference);
      
      logger.info('Created notification preference', {
        userId: preference.userId,
        notificationType: preference.notificationType,
        preferenceId: createdPreference.id
      });

      return createdPreference;
    } catch (error) {
      logger.error('Failed to create notification preference', { error, preferenceData });
      throw createError(
        ErrorCodes.PREFERENCE_CREATION_FAILED, 
        'Failed to create notification preference', 
        { originalError: error }
      );
    }
  }

  /**
   * Retrieves a notification preference by ID
   * 
   * @param preferenceId ID of the preference to retrieve
   * @returns The preference if found
   */
  async getPreference(preferenceId: string): Promise<NotificationPreference> {
    try {
      if (!preferenceId) {
        throw createError(ErrorCodes.VAL_MISSING_FIELD, 'Preference ID is required');
      }

      const preference = await NotificationPreference.query().findById(preferenceId);
      
      if (!preference) {
        throw createError(ErrorCodes.PREFERENCE_NOT_FOUND, `Preference with ID ${preferenceId} not found`);
      }

      return preference;
    } catch (error) {
      if (error.code === ErrorCodes.PREFERENCE_NOT_FOUND) {
        throw error;
      }
      
      logger.error('Failed to retrieve notification preference', { error, preferenceId });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to retrieve notification preference', 
        { originalError: error }
      );
    }
  }

  /**
   * Retrieves all notification preferences for a specific user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @returns Array of user's notification preferences
   */
  async getUserPreferences(userId: string, userType: string): Promise<NotificationPreference[]> {
    try {
      if (!userId || !userType) {
        throw createError(ErrorCodes.VAL_MISSING_FIELD, 'User ID and user type are required');
      }

      const preferences = await NotificationPreference.getUserPreferences(userId, userType);
      
      return preferences;
    } catch (error) {
      logger.error('Failed to retrieve user notification preferences', { error, userId, userType });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to retrieve user notification preferences', 
        { originalError: error }
      );
    }
  }

  /**
   * Retrieves a user's preference for a specific notification type
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @returns User's preference for the specified notification type
   */
  async getPreferenceByType(
    userId: string, 
    userType: string, 
    notificationType: string
  ): Promise<NotificationPreference> {
    try {
      if (!userId || !userType || !notificationType) {
        throw createError(ErrorCodes.VAL_MISSING_FIELD, 'User ID, user type, and notification type are required');
      }

      let preference = await NotificationPreference.getTypePreference(userId, userType, notificationType);
      
      // If preference doesn't exist, create a default one
      if (!preference) {
        const defaultChannels = this.getDefaultChannelsForType(notificationType);
        
        const preferenceData: PreferenceCreateData = {
          userId,
          userType,
          notificationType: notificationType as NotificationType,
          channels: defaultChannels as NotificationChannelType[],
          enabled: true
        };
        
        preference = await this.createPreference(preferenceData);
      }

      return preference;
    } catch (error) {
      logger.error('Failed to retrieve notification preference by type', { 
        error, userId, userType, notificationType 
      });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to retrieve notification preference by type', 
        { originalError: error }
      );
    }
  }

  /**
   * Updates an existing notification preference
   * 
   * @param preferenceId ID of the preference to update
   * @param preferenceData Data to update the preference with
   * @returns The updated preference
   */
  async updatePreference(
    preferenceId: string, 
    preferenceData: PreferenceUpdateData
  ): Promise<NotificationPreference> {
    try {
      // Retrieve the preference first to ensure it exists
      const preference = await this.getPreference(preferenceId);
      
      // Validate update data if provided
      if (preferenceData.channels && !Array.isArray(preferenceData.channels)) {
        throw createError(ErrorCodes.VAL_INVALID_FORMAT, 'Channels must be an array');
      }

      // Build the update data
      const updateData: Partial<NotificationPreference> = {};
      
      if (preferenceData.channels !== undefined) {
        updateData.channels = preferenceData.channels.map(c => c.toString());
      }
      
      if (preferenceData.enabled !== undefined) {
        updateData.enabled = preferenceData.enabled;
      }
      
      if (preferenceData.frequency !== undefined) {
        updateData.frequency = preferenceData.frequency;
      }
      
      if (preferenceData.timeWindow !== undefined) {
        updateData.timeWindow = preferenceData.timeWindow;
      }

      // Update the preference in the database
      const updatedPreference = await NotificationPreference.query()
        .patchAndFetchById(preferenceId, updateData);

      logger.info('Updated notification preference', {
        preferenceId,
        userId: preference.userId,
        notificationType: preference.notificationType
      });

      return updatedPreference;
    } catch (error) {
      if (error.code === ErrorCodes.PREFERENCE_NOT_FOUND) {
        throw error;
      }
      
      logger.error('Failed to update notification preference', { error, preferenceId, preferenceData });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to update notification preference', 
        { originalError: error }
      );
    }
  }

  /**
   * Deletes a notification preference
   * 
   * @param preferenceId ID of the preference to delete
   * @returns True if deletion was successful
   */
  async deletePreference(preferenceId: string): Promise<boolean> {
    try {
      // Retrieve the preference first to ensure it exists
      const preference = await this.getPreference(preferenceId);
      
      // Delete the preference
      const deletedCount = await NotificationPreference.query().deleteById(preferenceId);
      
      logger.info('Deleted notification preference', {
        preferenceId,
        userId: preference.userId,
        notificationType: preference.notificationType
      });

      return deletedCount > 0;
    } catch (error) {
      if (error.code === ErrorCodes.PREFERENCE_NOT_FOUND) {
        throw error;
      }
      
      logger.error('Failed to delete notification preference', { error, preferenceId });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to delete notification preference', 
        { originalError: error }
      );
    }
  }

  /**
   * Enables notifications for a specific type for a user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @returns The updated preference
   */
  async enableNotificationType(
    userId: string, 
    userType: string, 
    notificationType: string
  ): Promise<NotificationPreference> {
    try {
      // Get the preference (or create default if doesn't exist)
      let preference = await this.getPreferenceByType(userId, userType, notificationType);
      
      // If already enabled, just return the preference
      if (preference.enabled) {
        return preference;
      }
      
      // Update the preference to enable it
      return this.updatePreference(preference.id, { enabled: true });
    } catch (error) {
      logger.error('Failed to enable notification type', { error, userId, userType, notificationType });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to enable notification type', 
        { originalError: error }
      );
    }
  }

  /**
   * Disables notifications for a specific type for a user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @returns The updated preference
   */
  async disableNotificationType(
    userId: string, 
    userType: string, 
    notificationType: string
  ): Promise<NotificationPreference> {
    try {
      // Get the preference (or create default if doesn't exist)
      let preference = await this.getPreferenceByType(userId, userType, notificationType);
      
      // If already disabled, just return the preference
      if (!preference.enabled) {
        return preference;
      }
      
      // Update the preference to disable it
      return this.updatePreference(preference.id, { enabled: false });
    } catch (error) {
      logger.error('Failed to disable notification type', { error, userId, userType, notificationType });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to disable notification type', 
        { originalError: error }
      );
    }
  }

  /**
   * Updates the channels for a specific notification type for a user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @param channels Array of channel types to enable
   * @returns The updated preference
   */
  async updateChannels(
    userId: string, 
    userType: string, 
    notificationType: string, 
    channels: string[]
  ): Promise<NotificationPreference> {
    try {
      // Get the preference (or create default if doesn't exist)
      let preference = await this.getPreferenceByType(userId, userType, notificationType);
      
      // Update the preference with new channels
      return this.updatePreference(preference.id, { 
        channels: channels as NotificationChannelType[] 
      });
    } catch (error) {
      logger.error('Failed to update notification channels', { 
        error, userId, userType, notificationType, channels 
      });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to update notification channels', 
        { originalError: error }
      );
    }
  }

  /**
   * Updates the frequency settings for a specific notification type for a user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @param frequency Frequency settings
   * @returns The updated preference
   */
  async updateFrequency(
    userId: string, 
    userType: string, 
    notificationType: string, 
    frequency: FrequencySettings
  ): Promise<NotificationPreference> {
    try {
      // Get the preference (or create default if doesn't exist)
      let preference = await this.getPreferenceByType(userId, userType, notificationType);
      
      // Update the preference with new frequency settings
      return this.updatePreference(preference.id, { frequency });
    } catch (error) {
      logger.error('Failed to update notification frequency', { 
        error, userId, userType, notificationType, frequency 
      });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to update notification frequency', 
        { originalError: error }
      );
    }
  }

  /**
   * Updates the time window for a specific notification type for a user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @param timeWindow Time window settings
   * @returns The updated preference
   */
  async updateTimeWindow(
    userId: string, 
    userType: string, 
    notificationType: string, 
    timeWindow: TimeWindow
  ): Promise<NotificationPreference> {
    try {
      // Get the preference (or create default if doesn't exist)
      let preference = await this.getPreferenceByType(userId, userType, notificationType);
      
      // Update the preference with new time window
      return this.updatePreference(preference.id, { timeWindow });
    } catch (error) {
      logger.error('Failed to update notification time window', { 
        error, userId, userType, notificationType, timeWindow 
      });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to update notification time window', 
        { originalError: error }
      );
    }
  }

  /**
   * Gets the enabled channels for a specific notification type for a user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @returns Array of enabled channel types
   */
  async getEnabledChannels(
    userId: string, 
    userType: string, 
    notificationType: string
  ): Promise<string[]> {
    try {
      // Get the preference (or create default if doesn't exist)
      let preference = await this.getPreferenceByType(userId, userType, notificationType);
      
      // If notifications are disabled, return empty array
      if (!preference.enabled) {
        return [];
      }
      
      // Return the enabled channels
      return preference.channels && preference.channels.length > 0 
        ? preference.channels 
        : this.getDefaultChannelsForType(notificationType);
    } catch (error) {
      logger.error('Failed to get enabled notification channels', { 
        error, userId, userType, notificationType 
      });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR, 
        'Failed to get enabled notification channels', 
        { originalError: error }
      );
    }
  }

  /**
   * Determines if a notification should be sent based on user preferences
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @param channelType Channel type to check
   * @returns True if notification should be sent, false otherwise
   */
  async shouldSendNotification(
    userId: string, 
    userType: string, 
    notificationType: string, 
    channelType: string
  ): Promise<boolean> {
    try {
      // Get the preference (or create default if doesn't exist)
      let preference = await this.getPreferenceByType(userId, userType, notificationType);
      
      // Use the model's method to check if notification should be sent
      return preference.shouldSendNotification(channelType);
    } catch (error) {
      logger.error('Failed to check if notification should be sent', { 
        error, userId, userType, notificationType, channelType 
      });
      // In case of error, default to false to avoid unwanted notifications
      return false;
    }
  }

  /**
   * Creates default preferences for a user for all notification types
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @returns Array of created preferences
   */
  async createDefaultPreferences(
    userId: string, 
    userType: string
  ): Promise<NotificationPreference[]> {
    // Use a transaction to ensure all preferences are created or none
    const trx = await Transaction.start(NotificationPreference.knex());
    
    try {
      const preferences: NotificationPreference[] = [];
      
      // Create default preferences for each notification type
      for (const type of Object.values(NotificationType)) {
        // Check if preference already exists
        const existingPreference = await NotificationPreference.query(trx)
          .where('userId', userId)
          .where('userType', userType)
          .where('notificationType', type)
          .first();
          
        if (!existingPreference) {
          // Get default channels for this notification type
          const defaultChannels = this.getDefaultChannelsForType(type);
          
          // Create preference data
          const preferenceData: PreferenceCreateData = {
            userId,
            userType,
            notificationType: type as NotificationType,
            channels: defaultChannels as NotificationChannelType[],
            enabled: true,
            frequency: {
              type: FrequencyType.IMMEDIATE,
              maxPerDay: 100
            }
          };
          
          // Create the preference within the transaction
          const preference = new NotificationPreference();
          preference.userId = preferenceData.userId;
          preference.userType = preferenceData.userType;
          preference.notificationType = preferenceData.notificationType;
          preference.channels = preferenceData.channels.map(c => c.toString());
          preference.enabled = preferenceData.enabled;
          preference.frequency = preferenceData.frequency;
          
          const createdPreference = await NotificationPreference.query(trx).insert(preference);
          preferences.push(createdPreference);
        } else {
          preferences.push(existingPreference);
        }
      }
      
      // Commit the transaction
      await trx.commit();
      
      logger.info('Created default notification preferences', { userId, userType, count: preferences.length });
      
      return preferences;
    } catch (error) {
      // Rollback the transaction in case of error
      await trx.rollback();
      
      logger.error('Failed to create default notification preferences', { error, userId, userType });
      throw createError(
        ErrorCodes.DB_TRANSACTION_ERROR, 
        'Failed to create default notification preferences', 
        { originalError: error }
      );
    }
  }

  /**
   * Gets the default channels for a notification type
   * 
   * @param notificationType Type of notification
   * @returns Array of default channel types
   */
  getDefaultChannelsForType(notificationType: string): string[] {
    // Define defaults based on notification type
    switch (notificationType) {
      case NotificationType.LOAD_OPPORTUNITY:
        return [NotificationChannelType.PUSH, NotificationChannelType.IN_APP];
        
      case NotificationType.LOAD_STATUS:
        return [NotificationChannelType.PUSH, NotificationChannelType.IN_APP];
        
      case NotificationType.DRIVER_STATUS:
        return [NotificationChannelType.IN_APP, NotificationChannelType.EMAIL];
        
      case NotificationType.ACHIEVEMENT:
        return [NotificationChannelType.PUSH, NotificationChannelType.IN_APP];
        
      case NotificationType.SYSTEM_ALERT:
        return [NotificationChannelType.PUSH, NotificationChannelType.EMAIL, NotificationChannelType.IN_APP];
        
      case NotificationType.PAYMENT:
        return [NotificationChannelType.PUSH, NotificationChannelType.EMAIL, NotificationChannelType.IN_APP];
        
      case NotificationType.MARKET_INTELLIGENCE:
        return [NotificationChannelType.IN_APP, NotificationChannelType.EMAIL];
        
      default:
        return [NotificationChannelType.IN_APP];
    }
  }

  /**
   * Validates preference data before creation or update
   * 
   * @param data Data to validate
   * @returns Validation result with any errors
   */
  private validatePreferenceData(data: any): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!data.userId) {
      errors.push('User ID is required');
    }
    
    if (!data.userType) {
      errors.push('User type is required');
    }
    
    if (!data.notificationType) {
      errors.push('Notification type is required');
    } else if (!Object.values(NotificationType).includes(data.notificationType as NotificationType)) {
      errors.push('Invalid notification type');
    }
    
    // Validate channels if provided
    if (data.channels) {
      if (!Array.isArray(data.channels)) {
        errors.push('Channels must be an array');
      } else {
        for (const channel of data.channels) {
          if (!Object.values(NotificationChannelType).includes(channel as NotificationChannelType)) {
            errors.push(`Invalid channel type: ${channel}`);
          }
        }
      }
    }
    
    // Validate frequency if provided
    if (data.frequency) {
      if (!data.frequency.type) {
        errors.push('Frequency type is required');
      } else if (!Object.values(FrequencyType).includes(data.frequency.type as FrequencyType)) {
        errors.push('Invalid frequency type');
      }
      
      if (data.frequency.maxPerDay !== undefined && (isNaN(data.frequency.maxPerDay) || data.frequency.maxPerDay < 0)) {
        errors.push('Max notifications per day must be a positive number');
      }
    }
    
    // Validate time window if provided
    if (data.timeWindow) {
      if (!data.timeWindow.start || !data.timeWindow.end) {
        errors.push('Time window must include start and end times');
      }
      
      if (!data.timeWindow.timezone) {
        errors.push('Time window must include a timezone');
      }
      
      // Additional validation for time format could be added here
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}