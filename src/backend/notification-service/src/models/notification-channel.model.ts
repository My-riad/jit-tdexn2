import { Model } from 'src/backend/common/models/index.ts'; // Base model class for database operations
import { v4 as uuidv4 } from 'uuid'; // Generate unique identifiers for notification channels (v9.0.0)

/**
 * Enum defining the types of notification channels supported by the system
 */
export enum NotificationChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

/**
 * Interface defining the structure of notification channel configuration
 */
export interface ChannelConfig {
  /**
   * The provider used for this channel (e.g., 'sendgrid' for email, 'twilio' for SMS)
   */
  provider: string;
  
  /**
   * Provider-specific settings for the channel
   */
  settings: Record<string, any>;
}

/**
 * Model representing a notification channel through which notifications can be delivered to users.
 * Supports email, SMS, push notifications, and in-app messages as defined in the technical specifications.
 */
export class NotificationChannel extends Model {
  /**
   * Unique identifier for the notification channel
   */
  id!: string;
  
  /**
   * Human-readable name for the notification channel
   */
  name!: string;
  
  /**
   * Type of notification channel (email, sms, push, in_app)
   */
  type!: NotificationChannelType;
  
  /**
   * Whether this channel is currently enabled for sending notifications
   */
  enabled!: boolean;
  
  /**
   * Configuration settings for the notification channel
   * Contains provider-specific settings
   */
  config!: ChannelConfig;
  
  /**
   * Optional description of the notification channel
   */
  description?: string;
  
  /**
   * Timestamp when the notification channel was created
   */
  createdAt!: Date;
  
  /**
   * Timestamp when the notification channel was last updated
   */
  updatedAt!: Date;

  /**
   * Defines the database table name for this model
   */
  static get tableName(): string {
    return 'notification_channels';
  }

  /**
   * Defines the JSON schema for validation of notification channel objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'type', 'enabled'],

      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        type: { 
          type: 'string', 
          enum: Object.values(NotificationChannelType) 
        },
        enabled: { type: 'boolean' },
        config: {
          type: 'object',
          required: ['provider'],
          properties: {
            provider: { type: 'string', minLength: 1 },
            settings: { type: 'object' }
          }
        },
        description: { type: 'string', maxLength: 1000 },
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
    this.description = this.description || '';
    
    // Ensure config is initialized
    this.config = this.config || { provider: '', settings: {} };
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
    // Using dynamic imports to avoid circular dependencies
    return {
      notifications: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/../notification/notification.model`,
        join: {
          from: 'notification_channels.id',
          to: 'notifications.channelId'
        }
      },
      preferences: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/../preference/notification-preference.model`,
        join: {
          from: 'notification_channels.id',
          to: 'notification_preferences.channelId'
        }
      }
    };
  }
}