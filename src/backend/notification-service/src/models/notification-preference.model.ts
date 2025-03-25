import { Model } from 'src/backend/common/models/index.ts';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { NotificationChannelType } from './notification-channel.model';

/**
 * Enum defining the types of notifications supported by the system
 */
export enum NotificationType {
  LOAD_OPPORTUNITY = 'load_opportunity',
  LOAD_STATUS = 'load_status',
  DRIVER_STATUS = 'driver_status',
  ACHIEVEMENT = 'achievement',
  SYSTEM_ALERT = 'system_alert',
  PAYMENT = 'payment',
  REMINDER = 'reminder',
  MARKET_INTELLIGENCE = 'market_intelligence'
}

/**
 * Enum defining the frequency types for notification delivery
 */
export enum FrequencyType {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom'
}

/**
 * Interface defining the structure of notification frequency settings
 */
export interface FrequencySettings {
  /**
   * The type of frequency (immediate, daily, weekly, custom)
   */
  type: FrequencyType;
  
  /**
   * The value associated with the frequency type (e.g., hour of day for daily)
   */
  value?: number;
  
  /**
   * Maximum number of notifications allowed per day
   */
  maxPerDay?: number;
}

/**
 * Interface defining the structure of preferred notification time windows
 */
export interface TimeWindow {
  /**
   * Start time in HH:MM format
   */
  start: string;
  
  /**
   * End time in HH:MM format
   */
  end: string;
  
  /**
   * Timezone identifier (e.g., 'America/New_York')
   */
  timezone: string;
}

/**
 * Model representing a user's notification preferences for different notification types and channels.
 */
export class NotificationPreference extends Model {
  /**
   * Unique identifier for the notification preference
   */
  id!: string;
  
  /**
   * ID of the user who owns this preference
   */
  userId!: string;
  
  /**
   * Type of user (driver, carrier, shipper, etc.)
   */
  userType!: string;
  
  /**
   * Type of notification this preference applies to
   */
  notificationType!: string;
  
  /**
   * Array of channel types through which the user wants to receive this notification type
   */
  channels!: string[];
  
  /**
   * Whether notifications of this type are enabled for the user
   */
  enabled!: boolean;
  
  /**
   * Settings for notification frequency
   */
  frequency?: FrequencySettings;
  
  /**
   * Preferred time window for receiving notifications
   */
  timeWindow?: TimeWindow;
  
  /**
   * Timestamp when the notification preference was created
   */
  createdAt!: Date;
  
  /**
   * Timestamp when the notification preference was last updated
   */
  updatedAt!: Date;

  /**
   * Creates a new notification preference instance
   */
  constructor() {
    super();
    
    // Initialize default values if not provided
    this.enabled = true;
    this.channels = [];
    this.frequency = {
      type: FrequencyType.IMMEDIATE,
      maxPerDay: 100
    };
  }

  /**
   * Defines the database table name for this model
   */
  static get tableName(): string {
    return 'notification_preferences';
  }

  /**
   * Defines the JSON schema for validation of notification preference objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'userType', 'notificationType', 'channels', 'enabled'],

      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string' },
        userType: { 
          type: 'string', 
          enum: ['driver', 'carrier', 'shipper', 'admin'] 
        },
        notificationType: { 
          type: 'string', 
          enum: Object.values(NotificationType) 
        },
        channels: { 
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(NotificationChannelType)
          }
        },
        enabled: { type: 'boolean' },
        frequency: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: Object.values(FrequencyType) 
            },
            value: { type: 'number' },
            maxPerDay: { type: 'number' }
          }
        },
        timeWindow: {
          type: 'object',
          properties: {
            start: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
            end: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
            timezone: { type: 'string' }
          }
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Lifecycle hook that runs before inserting a new record
   */
  $beforeInsert(): void {
    this.id = this.id || uuidv4();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Set default values for optional fields if not provided
    this.enabled = this.enabled !== undefined ? this.enabled : true;
    this.channels = this.channels || [];
    this.frequency = this.frequency || {
      type: FrequencyType.IMMEDIATE,
      maxPerDay: 100
    };
  }

  /**
   * Lifecycle hook that runs before updating an existing record
   */
  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  /**
   * Defines relationships with other models
   */
  static get relationMappings() {
    return {
      channels: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/notification-channel.model`,
        join: {
          from: 'notification_preferences.id',
          through: {
            from: 'notification_preference_channels.preferenceId',
            to: 'notification_preference_channels.channelId'
          },
          to: 'notification_channels.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/../../../common/models/user/user.model`,
        join: {
          from: 'notification_preferences.userId',
          to: 'users.id'
        }
      }
    };
  }

  /**
   * Retrieves all notification preferences for a specific user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @returns Array of user's notification preferences
   */
  static async getUserPreferences(userId: string, userType: string): Promise<NotificationPreference[]> {
    return this.query()
      .where('userId', userId)
      .where('userType', userType);
  }

  /**
   * Retrieves a user's preference for a specific notification type
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param notificationType Type of notification
   * @returns User's preference for the specified notification type
   */
  static async getTypePreference(
    userId: string, 
    userType: string, 
    notificationType: string
  ): Promise<NotificationPreference> {
    return this.query()
      .where('userId', userId)
      .where('userType', userType)
      .where('notificationType', notificationType)
      .first();
  }

  /**
   * Checks if the current time is within the preferred time window
   * 
   * @returns True if current time is within the preferred window, false otherwise
   */
  isInTimeWindow(): boolean {
    // If no time window is defined, assume all times are valid
    if (!this.timeWindow) {
      return true;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour}:${currentMinute}`;

    // Parse time window start and end
    const [startHour, startMinute] = this.timeWindow.start.split(':').map(Number);
    const [endHour, endMinute] = this.timeWindow.end.split(':').map(Number);

    // Convert all to minutes for easier comparison
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Check if current time is within the window
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
  }

  /**
   * Determines if a notification should be sent based on preferences
   * 
   * @param channelType The notification channel type
   * @returns True if notification should be sent, false otherwise
   */
  shouldSendNotification(channelType: string): boolean {
    // Check if notifications are enabled
    if (!this.enabled) {
      return false;
    }

    // Check if the specified channel is in the channels array
    if (!this.channels.includes(channelType)) {
      return false;
    }

    // Check if current time is within the preferred time window
    if (!this.isInTimeWindow()) {
      return false;
    }

    // Additional checks based on frequency could be implemented here
    // For example, check when the last notification was sent and if it meets frequency requirements

    return true;
  }
}