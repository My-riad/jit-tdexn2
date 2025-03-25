import { Model } from 'src/backend/common/models/index.ts';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { NotificationType } from './notification-preference.model';
import { NotificationChannelType } from './notification-channel.model';

/**
 * Enum defining the possible statuses of a notification
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Enum defining the priority levels for notifications
 */
export enum NotificationPriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}

/**
 * Interface defining the structure of notification content
 */
export interface NotificationContent {
  /**
   * Title of the notification (for push and in-app)
   */
  title?: string;
  
  /**
   * Body text of the notification (for push and in-app)
   */
  body?: string;
  
  /**
   * Subject line (for email)
   */
  subject?: string;
  
  /**
   * HTML content (for email)
   */
  html?: string;
  
  /**
   * Plain text content (for email and SMS)
   */
  text?: string;
  
  /**
   * Icon URL (for push and in-app)
   */
  icon?: string;
  
  /**
   * URL to navigate to when notification is clicked
   */
  actionUrl?: string;
  
  /**
   * Additional data for the notification
   */
  data?: Record<string, any>;
}

/**
 * Interface defining options for querying notifications
 */
export interface NotificationQueryOptions {
  /**
   * Page number for pagination
   */
  page?: number;
  
  /**
   * Number of items per page
   */
  limit?: number;
  
  /**
   * Filter by read status
   */
  read?: boolean;
  
  /**
   * Filter by notification type
   */
  notificationType?: string;
  
  /**
   * Filter by channel type
   */
  channelType?: string;
  
  /**
   * Filter by notification status
   */
  status?: string;
  
  /**
   * Filter by start date
   */
  startDate?: Date;
  
  /**
   * Filter by end date
   */
  endDate?: Date;
  
  /**
   * Field to sort by
   */
  sortBy?: string;
  
  /**
   * Sort direction (asc or desc)
   */
  sortDirection?: string;
}

/**
 * Model representing a notification sent to a user through one or more channels.
 */
export class Notification extends Model {
  /**
   * Unique identifier for the notification
   */
  id!: string;
  
  /**
   * ID of the user who will receive this notification
   */
  userId!: string;
  
  /**
   * Type of user (driver, carrier, shipper, etc.)
   */
  userType!: string;
  
  /**
   * Type of notification (load opportunity, status update, etc.)
   */
  notificationType!: string;
  
  /**
   * ID of the template used for this notification
   */
  templateId?: string;
  
  /**
   * Channel through which the notification is sent
   */
  channelType!: string;
  
  /**
   * Notification content (varies by channel type)
   */
  content!: NotificationContent;
  
  /**
   * Additional data associated with the notification
   */
  data?: Record<string, any>;
  
  /**
   * Current status of the notification
   */
  status!: string;
  
  /**
   * Whether the notification has been read by the user
   */
  read!: boolean;
  
  /**
   * ID of the related entity (load, driver, etc.)
   */
  referenceId?: string;
  
  /**
   * Type of the related entity
   */
  referenceType?: string;
  
  /**
   * Priority level of the notification
   */
  priority!: number;
  
  /**
   * Date/time when the notification is scheduled to be sent
   */
  scheduledFor?: Date;
  
  /**
   * Date/time when the notification was sent
   */
  sentAt?: Date;
  
  /**
   * Date/time when the notification was delivered
   */
  deliveredAt?: Date;
  
  /**
   * Date/time when the notification was read
   */
  readAt?: Date;
  
  /**
   * Date/time when the notification was created
   */
  createdAt!: Date;
  
  /**
   * Date/time when the notification was last updated
   */
  updatedAt!: Date;

  /**
   * Creates a new notification instance
   */
  constructor() {
    super();
    
    // Initialize default values if not provided
    this.status = NotificationStatus.PENDING;
    this.read = false;
    this.priority = NotificationPriority.LOW;
    this.data = {};
  }

  /**
   * Defines the database table name for this model
   */
  static get tableName(): string {
    return 'notifications';
  }

  /**
   * Defines the JSON schema for validation of notification objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'userType', 'notificationType', 'channelType', 'content'],

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
        templateId: { type: 'string' },
        channelType: { 
          type: 'string', 
          enum: Object.values(NotificationChannelType) 
        },
        content: { 
          type: 'object',
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            subject: { type: 'string' },
            html: { type: 'string' },
            text: { type: 'string' },
            icon: { type: 'string' },
            actionUrl: { type: 'string' },
            data: { type: 'object' }
          }
        },
        data: { type: 'object' },
        status: { 
          type: 'string', 
          enum: Object.values(NotificationStatus),
          default: NotificationStatus.PENDING
        },
        read: { type: 'boolean', default: false },
        referenceId: { type: 'string' },
        referenceType: { type: 'string' },
        priority: { 
          type: 'integer', 
          minimum: 1, 
          maximum: 3,
          default: NotificationPriority.LOW
        },
        scheduledFor: { type: 'string', format: 'date-time' },
        sentAt: { type: 'string', format: 'date-time' },
        deliveredAt: { type: 'string', format: 'date-time' },
        readAt: { type: 'string', format: 'date-time' },
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
    this.status = this.status || NotificationStatus.PENDING;
    this.read = this.read !== undefined ? this.read : false;
    this.priority = this.priority || NotificationPriority.LOW;
    this.data = this.data || {};
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
      template: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/notification-template.model`,
        join: {
          from: 'notifications.templateId',
          to: 'notification_templates.id'
        }
      },
      channel: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/notification-channel.model`,
        join: {
          from: 'notifications.channelType',
          to: 'notification_channels.type'
        }
      }
    };
  }

  /**
   * Marks the notification as sent
   * 
   * @returns Updated notification instance
   */
  async markAsSent(): Promise<Notification> {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    await this.$query().patch({
      status: this.status,
      sentAt: this.sentAt,
      updatedAt: new Date()
    });
    return this;
  }

  /**
   * Marks the notification as delivered
   * 
   * @returns Updated notification instance
   */
  async markAsDelivered(): Promise<Notification> {
    this.status = NotificationStatus.DELIVERED;
    this.deliveredAt = new Date();
    await this.$query().patch({
      status: this.status,
      deliveredAt: this.deliveredAt,
      updatedAt: new Date()
    });
    return this;
  }

  /**
   * Marks the notification as read
   * 
   * @returns Updated notification instance
   */
  async markAsRead(): Promise<Notification> {
    this.read = true;
    this.readAt = new Date();
    await this.$query().patch({
      read: this.read,
      readAt: this.readAt,
      updatedAt: new Date()
    });
    return this;
  }

  /**
   * Marks the notification as failed
   * 
   * @param errorMessage The error message explaining the failure
   * @returns Updated notification instance
   */
  async markAsFailed(errorMessage: string): Promise<Notification> {
    this.status = NotificationStatus.FAILED;
    this.data = this.data || {};
    this.data.error = errorMessage;
    await this.$query().patch({
      status: this.status,
      data: this.data,
      updatedAt: new Date()
    });
    return this;
  }

  /**
   * Retrieves notifications for a specific user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @param options Query options for filtering and pagination
   * @returns Paginated notifications and total count
   */
  static async getUserNotifications(
    userId: string,
    userType: string,
    options: NotificationQueryOptions = {}
  ): Promise<{ notifications: Notification[], total: number }> {
    // Default values for pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    
    // Build the query
    let query = this.query()
      .where('userId', userId)
      .where('userType', userType);
    
    // Apply filters if provided
    if (options.read !== undefined) {
      query = query.where('read', options.read);
    }
    
    if (options.notificationType) {
      query = query.where('notificationType', options.notificationType);
    }
    
    if (options.channelType) {
      query = query.where('channelType', options.channelType);
    }
    
    if (options.status) {
      query = query.where('status', options.status);
    }
    
    if (options.startDate) {
      query = query.where('createdAt', '>=', options.startDate);
    }
    
    if (options.endDate) {
      query = query.where('createdAt', '<=', options.endDate);
    }
    
    // Apply sorting
    const sortBy = options.sortBy || 'createdAt';
    const sortDirection = options.sortDirection || 'desc';
    query = query.orderBy(sortBy, sortDirection);
    
    // Execute the query with pagination
    const [notifications, countResult] = await Promise.all([
      query.clone().limit(limit).offset(offset),
      query.clone().count('id as count').first()
    ]);
    
    return {
      notifications: notifications,
      total: countResult ? (countResult as any).count : 0
    };
  }

  /**
   * Gets the count of unread notifications for a user
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @returns Count of unread notifications
   */
  static async getUnreadCount(userId: string, userType: string): Promise<number> {
    const result = await this.query()
      .where('userId', userId)
      .where('userType', userType)
      .where('read', false)
      .count('id as count')
      .first();
    
    return result ? (result as any).count : 0;
  }

  /**
   * Marks all notifications for a user as read
   * 
   * @param userId ID of the user
   * @param userType Type of user (driver, carrier, shipper)
   * @returns Number of notifications updated
   */
  static async markAllAsRead(userId: string, userType: string): Promise<number> {
    const now = new Date();
    
    const result = await this.query()
      .patch({
        read: true,
        readAt: now,
        updatedAt: now
      })
      .where('userId', userId)
      .where('userType', userType)
      .where('read', false);
    
    return result;
  }

  /**
   * Deletes notifications older than the specified age
   * 
   * @param daysToKeep Number of days to keep notifications before deleting
   * @returns Number of notifications deleted
   */
  static async deleteOldNotifications(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await this.query()
      .delete()
      .where('createdAt', '<', cutoffDate);
    
    return result;
  }
}