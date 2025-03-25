# src/backend/notification-service/src/services/notification.service.ts
```typescript
import { Transaction } from 'objection'; // objection@^3.0.1
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
  NotificationQueryOptions
} from '../models/notification.model';
import {
  NotificationType
} from '../models/notification-preference.model';
import {
  NotificationChannelType
} from '../models/notification-channel.model';
import {
  TemplateService
} from './template.service';
import {
  ChannelService
} from './channel.service';
import {
  PreferenceService
} from './preference.service';

/**
 * Interface defining the data required to create a new notification
 */
interface NotificationCreateData {
  userId: string;
  userType: string;
  notificationType: NotificationType;
  templateId?: string;
  channelType?: NotificationChannelType;
  content?: object;
  data?: object;
  priority?: NotificationPriority;
  referenceId?: string;
  referenceType?: string;
  scheduledFor?: Date;
}

/**
 * Interface defining the data required to send a notification
 */
interface NotificationSendData {
  userId: string;
  userType: string;
  notificationType: NotificationType;
  data: object;
  priority?: NotificationPriority;
  channels?: NotificationChannelType[];
  templateId?: string;
  referenceId?: string;
  referenceType?: string;
  locale?: string;
}

/**
 * Interface defining the data required to send notifications to multiple users
 */
interface NotificationBulkSendData {
  recipients: Array<{ userId: string; userType: string; data?: object }>;
  notificationType: NotificationType;
  data: object;
  priority?: NotificationPriority;
  channels?: NotificationChannelType[];
  templateId?: string;
  referenceId?: string;
  referenceType?: string;
  locale?: string;
}

/**
 * Interface defining the data required to send a notification to a topic
 */
interface NotificationTopicData {
  topic: string;
  notificationType: NotificationType;
  data: object;
  templateId?: string;
  referenceId?: string;
  referenceType?: string;
  locale?: string;
}

/**
 * Interface defining the data required to schedule a notification
 */
interface NotificationScheduleData {
  scheduledFor: Date;
  userId: string;
  userType: string;
  notificationType: NotificationType;
  data: object;
  priority?: NotificationPriority;
  channels?: NotificationChannelType[];
  templateId?: string;
  referenceId?: string;
  referenceType?: string;
}

/**
 * Interface defining options for notification statistics
 */
interface NotificationStatsOptions {
  startDate?: Date;
  endDate?: Date;
  notificationType?: NotificationType;
  channelType?: NotificationChannelType;
  userType?: string;
}

/**
 * Interface defining notification statistics
 */
interface NotificationStatistics {
  totalCount: number;
  byStatus: Record<NotificationStatus, number>;
  byChannel: Record<NotificationChannelType, number>;
  byType: Record<NotificationType, number>;
  deliverySuccessRate: number;
  readRate: number;
  averageDeliveryTime: number;
}

/**
 * Service responsible for managing notifications, including creation, delivery, and tracking across multiple channels based on user preferences.
 */
export class NotificationService {
  /**
   * @param templateService - TemplateService
   */
  private templateService: TemplateService;
  /**
   * @param channelService - ChannelService
   */
  private channelService: ChannelService;
  /**
   * @param preferenceService - PreferenceService
   */
  private preferenceService: PreferenceService;

  /**
   * Initializes the notification service with required dependencies
   * @param templateService 
   * @param channelService 
   * @param preferenceService 
   */
  constructor(
    templateService: TemplateService,
    channelService: ChannelService,
    preferenceService: PreferenceService
  ) {
    this.templateService = templateService;
    this.channelService = channelService;
    this.preferenceService = preferenceService;
  }

  /**
   * Creates a new notification record
   * @param notificationData 
   * @returns The created notification
   */
  async createNotification(notificationData: NotificationCreateData): Promise<Notification> {
    // Validate notification data (userId, userType, notificationType, etc.)
    const validation = this.validateNotificationData(notificationData);
    if (!validation.isValid) {
      logger.error('Invalid notification data', { errors: validation.errors });
      throw createError(
        ErrorCodes.INVALID_NOTIFICATION_DATA,
        `Invalid notification data: ${validation.errors.join(', ')}`
      );
    }

    // Create new Notification instance with provided data
    const notification = new Notification();
    notification.userId = notificationData.userId;
    notification.userType = notificationData.userType;
    notification.notificationType = notificationData.notificationType;
    notification.templateId = notificationData.templateId;
    notification.channelType = notificationData.channelType || NotificationChannelType.IN_APP;
    notification.content = notificationData.content;
    notification.data = notificationData.data;
    notification.priority = notificationData.priority;
    notification.referenceId = notificationData.referenceId;
    notification.referenceType = notificationData.referenceType;
    notification.scheduledFor = notificationData.scheduledFor;

    // Save notification to database
    try {
      const createdNotification = await Notification.query().insert(notification);
      logger.info(`Created notification with ID: ${createdNotification.id}`);
      return createdNotification;
    } catch (error) {
      logger.error('Failed to create notification', { error, notificationData });
      throw createError(
        ErrorCodes.NOTIFICATION_CREATION_FAILED,
        'Failed to create notification',
        { originalError: error }
      );
    }
  }

  /**
   * Retrieves a notification by ID
   * @param notificationId 
   * @returns The notification if found
   */
  async getNotification(notificationId: string): Promise<Notification> {
    // Validate the notificationId parameter
    if (!notificationId) {
      throw createError(ErrorCodes.VAL_MISSING_FIELD, 'Notification ID is required');
    }

    // Query the database for notification with the specified ID
    const notification = await Notification.query().findById(notificationId);

    // If not found, throw NOTIFICATION_NOT_FOUND error
    if (!notification) {
      logger.error(`Notification not found with ID: ${notificationId}`);
      throw createError(ErrorCodes.NOTIFICATION_NOT_FOUND, `Notification not found with ID: ${notificationId}`);
    }

    // Return the notification
    return notification;
  }

  /**
   * Retrieves notifications for a specific user
   * @param userId 
   * @param userType 
   * @param options 
   * @returns Paginated notifications and total count
   */
  async getUserNotifications(
    userId: string,
    userType: string,
    options: NotificationQueryOptions = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    // Validate userId and userType parameters
    if (!userId || !userType) {
      throw createError(ErrorCodes.VAL_MISSING_FIELD, 'User ID and user type are required');
    }

    // Apply query options (pagination, filters, sorting)
    try {
      const result = await Notification.getUserNotifications(userId, userType, options);
      return result;
    } catch (error) {
      logger.error('Failed to retrieve user notifications', { error, userId, userType, options });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR,
        'Failed to retrieve user notifications',
        { originalError: error }
      );
    }
  }

  /**
   * Gets the count of unread notifications for a user
   * @param userId 
   * @param userType 
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string, userType: string): Promise<number> {
    // Validate userId and userType parameters
    if (!userId || !userType) {
      throw createError(ErrorCodes.VAL_MISSING_FIELD, 'User ID and user type are required');
    }

    // Call Notification.getUnreadCount with parameters
    try {
      const count = await Notification.getUnreadCount(userId, userType);
      return count;
    } catch (error) {
      logger.error('Failed to retrieve unread notification count', { error, userId, userType });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR,
        'Failed to retrieve unread notification count',
        { originalError: error }
      );
    }
  }

  /**
   * Marks a notification as read
   * @param notificationId 
   * @returns The updated notification
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    // Retrieve notification by ID
    const notification = await this.getNotification(notificationId);

    // Call notification.markAsRead() to update status
    try {
      const updatedNotification = await notification.markAsRead();
      logger.info(`Marked notification as read with ID: ${notificationId}`);
      return updatedNotification;
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR,
        'Failed to mark notification as read',
        { originalError: error }
      );
    }
  }

  /**
   * Marks all notifications for a user as read
   * @param userId 
   * @param userType 
   * @returns Number of notifications updated
   */
  async markAllAsRead(userId: string, userType: string): Promise<number> {
    // Validate userId and userType parameters
    if (!userId || !userType) {
      throw createError(ErrorCodes.VAL_MISSING_FIELD, 'User ID and user type are required');
    }

    // Call Notification.markAllAsRead with parameters
    try {
      const updatedCount = await Notification.markAllAsRead(userId, userType);
      logger.info(`Marked all notifications as read for user: ${userId} (${userType})`);
      return updatedCount;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId, userType });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR,
        'Failed to mark all notifications as read',
        { originalError: error }
      );
    }
  }

  /**
   * Deletes a notification
   * @param notificationId 
   * @returns True if deletion was successful
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    // Retrieve notification by ID
    const notification = await this.getNotification(notificationId);

    // Delete the notification from database
    try {
      await Notification.query().deleteById(notificationId);
      logger.info(`Deleted notification with ID: ${notificationId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete notification', { error, notificationId });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR,
        'Failed to delete notification',
        { originalError: error }
      );
    }
  }

  /**
   * Creates and sends a notification to a user
   * @param notificationData 
   * @returns The created and sent notification
   */
  async sendNotification(notificationData: NotificationSendData): Promise<Notification> {
    // Validate notification data
    const validation = this.validateNotificationData(notificationData);
    if (!validation.isValid) {
      logger.error('Invalid notification data', { errors: validation.errors });
      throw createError(
        ErrorCodes.INVALID_NOTIFICATION_DATA,
        `Invalid notification data: ${validation.errors.join(', ')}`
      );
    }

    // Determine appropriate channels based on user preferences
    const channels = notificationData.channels || await this.determineChannels(
      notificationData.userId,
      notificationData.userType,
      notificationData.notificationType,
      notificationData.priority
    );

    // Get template for notification type and channel
    const template = await this.templateService.getTemplateForNotification(
      notificationData.notificationType,
      channels[0], // Use the first channel for template retrieval
      notificationData.locale,
      notificationData.templateId
    );

    // Create notification record in database
    const notificationCreateData: NotificationCreateData = {
      userId: notificationData.userId,
      userType: notificationData.userType,
      notificationType: notificationData.notificationType,
      templateId: template.id,
      channelType: channels[0], // Store the primary channel
      content: template.content,
      data: notificationData.data,
      priority: notificationData.priority,
      referenceId: notificationData.referenceId,
      referenceType: notificationData.referenceType
    };
    const notification = await this.createNotification(notificationCreateData);

    // For each enabled channel:
    for (const channelType of channels) {
      try {
        // Render template with notification data
        const renderedContent = await this.templateService.renderTemplate(template, notificationData.data);

        // Send notification through channel service
        const recipientContact = {
          userId: notificationData.userId,
          name: `${notificationData.userType}-${notificationData.userId}` // Placeholder
        };
        const success = await this.channelService.sendNotification(
          notification,
          template,
          channelType,
          recipientContact
        );

        // Update notification status based on delivery result
        if (success) {
          logger.info(`Notification sent successfully via ${channelType}`, { notificationId: notification.id, channelType });
        } else {
          logger.error(`Failed to send notification via ${channelType}`, { notificationId: notification.id, channelType });
        }
      } catch (error) {
        logger.error(`Error sending notification via ${channelType}`, { error, notificationId: notification.id });
        await notification.markAsFailed(`Error sending via ${channelType}: ${error.message}`);
      }
    }

    // Return the notification with delivery status
    return notification;
  }

  /**
   * Sends the same notification to multiple users
   * @param bulkData 
   * @returns Results of the bulk send operation
   */
  async sendBulkNotifications(bulkData: NotificationBulkSendData): Promise<{ successful: number; failed: number; notifications: Notification[] }> {
    // Validate bulk notification data
    if (!bulkData || !bulkData.recipients || !Array.isArray(bulkData.recipients) || bulkData.recipients.length === 0) {
      throw createError(ErrorCodes.INVALID_NOTIFICATION_DATA, 'Invalid bulk notification data: Recipients array is required');
    }

    // Get template for notification type
    const template = await this.templateService.getTemplateForNotification(
      bulkData.notificationType,
      NotificationChannelType.IN_APP, // Use a default channel for template retrieval
      bulkData.locale,
      bulkData.templateId
    );

    let successful = 0;
    let failed = 0;
    const notifications: Notification[] = [];

    // Begin processing each recipient
    for (const recipient of bulkData.recipients) {
      try {
        // Determine appropriate channels
        const channels = bulkData.channels || await this.determineChannels(
          recipient.userId,
          recipient.userType,
          bulkData.notificationType,
          bulkData.priority
        );

        // Create notification record for each recipient
        const notificationCreateData: NotificationCreateData = {
          userId: recipient.userId,
          userType: recipient.userType,
          notificationType: bulkData.notificationType,
          templateId: template.id,
          channelType: channels[0], // Store the primary channel
          content: template.content,
          data: { ...bulkData.data, ...recipient.data }, // Merge common and recipient-specific data
          priority: bulkData.priority,
          referenceId: bulkData.referenceId,
          referenceType: bulkData.referenceType
        };
        const notification = await this.createNotification(notificationCreateData);

        // Send notification through appropriate channels
        for (const channelType of channels) {
          try {
            // Render template with notification data
            const renderedContent = await this.templateService.renderTemplate(template, { ...bulkData.data, ...recipient.data });

            // Send notification through channel service
            const recipientContact = {
              userId: recipient.userId,
              name: `${recipient.userType}-${recipient.userId}` // Placeholder
            };
            const success = await this.channelService.sendNotification(
              notification,
              template,
              channelType,
              recipientContact
            );

            // Update notification status based on delivery result
            if (success) {
              logger.info(`Notification sent successfully via ${channelType}`, { notificationId: notification.id, channelType });
            } else {
              logger.error(`Failed to send notification via ${channelType}`, { notificationId: notification.id, channelType });
            }
          } catch (error) {
            logger.error(`Error sending notification via ${channelType}`, { error, notificationId: notification.id });
            await notification.markAsFailed(`Error sending via ${channelType}: ${error.message}`);
          }
        }

        successful++;
        notifications.push(notification);
      } catch (error) {
        logger.error('Failed to send notification to recipient', { error, recipient });
        failed++;
      }
    }

    // Return summary of operation with created notifications
    return { successful, failed, notifications };
  }

  /**
   * Sends a notification to a topic (group of users)
   * @param topicData 
   * @returns True if notification was sent successfully
   */
  async sendTopicNotification(topicData: NotificationTopicData): Promise<boolean> {
    // Validate topic notification data
    if (!topicData || !topicData.topic || !topicData.notificationType || !topicData.data) {
      throw createError(ErrorCodes.INVALID_NOTIFICATION_DATA, 'Invalid topic notification data');
    }

    // Get template for notification type
    const template = await this.templateService.getTemplateForNotification(
      topicData.notificationType,
      NotificationChannelType.PUSH, // Topic notifications are typically push
      topicData.locale,
      topicData.templateId
    );

    // Render template with notification data
    const notification = new Notification();
    notification.notificationType = topicData.notificationType;
    notification.channelType = NotificationChannelType.PUSH;
    notification.content = template.content;
    notification.data = topicData.data;
    notification.referenceId = topicData.referenceId;
    notification.referenceType = topicData.referenceType;

    try {
      // Send notification to topic through channel service
      const success = await this.channelService.sendPushToTopic(notification, template, topicData.topic);

      // Log the topic notification delivery
      if (success) {
        logger.info(`Notification sent to topic successfully: ${topicData.topic}`);
        return true;
      } else {
        logger.error(`Failed to send notification to topic: ${topicData.topic}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error sending notification to topic: ${topicData.topic}`, { error });
      return false;
    }
  }

  /**
   * Schedules a notification to be sent at a future time
   * @param scheduleData 
   * @returns The scheduled notification
   */
  async scheduleNotification(scheduleData: NotificationScheduleData): Promise<Notification> {
    // Validate schedule data including scheduled time
    if (!scheduleData || !scheduleData.scheduledFor || !scheduleData.userId || !scheduleData.userType || !scheduleData.notificationType || !scheduleData.data) {
      throw createError(ErrorCodes.INVALID_NOTIFICATION_DATA, 'Invalid schedule data');
    }

    // Create notification with PENDING status
    const notificationCreateData: NotificationCreateData = {
      userId: scheduleData.userId,
      userType: scheduleData.userType,
      notificationType: scheduleData.notificationType,
      content: {}, // Content will be generated when the notification is processed
      data: scheduleData.data,
      priority: scheduleData.priority,
      referenceId: scheduleData.referenceId,
      referenceType: scheduleData.referenceType,
      scheduledFor: scheduleData.scheduledFor,
    };

    // Create the notification
    const notification = await this.createNotification(notificationCreateData);

    // Log the scheduled notification
    logger.info(`Scheduled notification with ID: ${notification.id} for ${scheduleData.scheduledFor}`);

    // Return the created notification
    return notification;
  }

  /**
   * Cancels a scheduled notification
   * @param notificationId 
   * @returns True if cancellation was successful
   */
  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    // Retrieve notification by ID
    const notification = await this.getNotification(notificationId);

    // Verify notification is in PENDING status and has scheduledFor date
    if (notification.status !== NotificationStatus.PENDING || !notification.scheduledFor) {
      throw createError(ErrorCodes.INVALID_NOTIFICATION_DATA, 'Notification is not in PENDING status or is not scheduled');
    }

    // Update notification status to CANCELLED
    notification.status = NotificationStatus.CANCELLED;

    // Save updated notification to database
    try {
      await notification.$query().patch({
        status: notification.status,
        updatedAt: new Date()
      });
      logger.info(`Cancelled scheduled notification with ID: ${notificationId}`);
      return true;
    } catch (error) {
      logger.error('Failed to cancel scheduled notification', { error, notificationId });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR,
        'Failed to cancel scheduled notification',
        { originalError: error }
      );
    }
  }

  /**
   * Processes notifications scheduled for delivery
   * @returns Results of the processing operation
   */
  async processScheduledNotifications(): Promise<{ processed: number; successful: number; failed: number }> {
    let processed = 0;
    let successful = 0;
    let failed = 0;

    // Query for PENDING notifications with scheduledFor <= current time
    const now = new Date();
    const notifications = await Notification.query()
      .where('status', NotificationStatus.PENDING)
      .where('scheduledFor', '<=', now);

    // For each scheduled notification:
    for (const notification of notifications) {
      processed++;
      try {
        // Send the notification
        await this.sendNotification({
          userId: notification.userId,
          userType: notification.userType,
          notificationType: notification.notificationType as NotificationType,
          data: notification.data,
          priority: notification.priority,
          templateId: notification.templateId,
          referenceId: notification.referenceId,
          referenceType: notification.referenceType
        });
        successful++;
      } catch (error) {
        failed++;
        logger.error(`Failed to process scheduled notification with ID: ${notification.id}`, { error });
        await notification.markAsFailed(`Failed to process scheduled notification: ${error.message}`);
      }
    }

    // Return summary of processing operation
    logger.info(`Processed scheduled notifications`, { processed, successful, failed });
    return { processed, successful, failed };
  }

  /**
   * Retries sending failed notifications
   * @param maxRetries 
   * @param maxAgeHours 
   * @returns Results of the retry operation
   */
  async retryFailedNotifications(maxRetries: number, maxAgeHours: number): Promise<{ retried: number; successful: number; failed: number }> {
    let retried = 0;
    let successful = 0;
    let failed = 0;

    // Query for FAILED notifications within age limit
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    const notifications = await Notification.query()
      .where('status', NotificationStatus.FAILED)
      .where('createdAt', '>=', cutoffDate)
      .andWhere(builder => {
        builder.where('data:retries', '<', maxRetries).orWhere('data:retries', null);
      });

    // For each failed notification:
    for (const notification of notifications) {
      retried++;
      try {
        // Increment retry count
        const retries = (notification.data && notification.data.retries) ? notification.data.retries + 1 : 1;
        await notification.$query().patch({
          data: { ...notification.data, retries },
          updatedAt: new Date()
        });

        // Resend the notification
        await this.sendNotification({
          userId: notification.userId,
          userType: notification.userType,
          notificationType: notification.notificationType as NotificationType,
          data: notification.data,
          priority: notification.priority,
          templateId: notification.templateId,
          referenceId: notification.referenceId,
          referenceType: notification.referenceType
        });
        successful++;
      } catch (error) {
        failed++;
        logger.error(`Failed to retry notification with ID: ${notification.id}`, { error });
        await notification.markAsFailed(`Failed to retry notification: ${error.message}`);
      }
    }

    // Return summary of retry operation
    logger.info(`Retried failed notifications`, { retried, successful, failed });
    return { retried, successful, failed };
  }

  /**
   * Deletes old notifications based on retention policy
   * @param daysToKeep 
   * @returns Number of notifications deleted
   */
  async cleanupOldNotifications(daysToKeep: number): Promise<number> {
    // Calculate cutoff date based on daysToKeep parameter
    if (!daysToKeep || typeof daysToKeep !== 'number' || daysToKeep <= 0) {
      throw createError(ErrorCodes.VAL_INVALID_INPUT, 'Invalid daysToKeep parameter');
    }

    // Call Notification.deleteOldNotifications with cutoff date
    try {
      const deletedCount = await Notification.deleteOldNotifications(daysToKeep);
      logger.info(`Cleaned up old notifications`, { daysToKeep, deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old notifications', { error, daysToKeep });
      throw createError(
        ErrorCodes.DB_QUERY_ERROR,
        'Failed to cleanup old notifications',
        { originalError: error }
      );
    }
  }

  /**
   * Gets statistics about notifications
   * @param options 
   * @returns Statistics about notifications
   */
  async getNotificationStatistics(options: NotificationStatsOptions): Promise<NotificationStatistics> {
    // Apply filter options (time range, notification types, etc.)
    // Query for total count of notifications
    // Query for counts by status (sent, delivered, failed, etc.)
    // Query for counts by channel type (email, SMS, push, in-app)
    // Query for counts by notification type
    // Calculate delivery success rate
    // Return compiled statistics
    return {
      totalCount: 0,
      byStatus: {
        [NotificationStatus.PENDING]: 0,
        [NotificationStatus.SENT]: 0,
        [NotificationStatus.DELIVERED]: 0,
        [NotificationStatus.FAILED]: 0,
        [NotificationStatus.CANCELLED]: 0
      },
      byChannel: {
        [NotificationChannelType.EMAIL]: 0,
        [NotificationChannelType.SMS]: 0,
        [NotificationChannelType.PUSH]: 0,
        [NotificationChannelType.IN_APP]: 0
      },
      byType: {
        [NotificationType.LOAD_OPPORTUNITY]: 0,
        [NotificationType.LOAD_STATUS]: 0,
        [NotificationType.DRIVER_STATUS]: 0,
        [NotificationType.ACHIEVEMENT]: 0,
        [NotificationType.SYSTEM_ALERT]: 0,
        [NotificationType.PAYMENT]: 0,
        [NotificationType.MARKET_INTELLIGENCE]: 0,
        [NotificationType.BONUS_ZONE]: 0
      },
      deliverySuccessRate: 0,
      readRate: 0,
      averageDeliveryTime: 0
    };
  }

  /**
   * Determines appropriate channels for a notification based on type and user preferences
   * @param userId 
   * @param userType 
   * @param notificationType 
   * @param priority 
   * @returns Array of channel types to use
   */
  async determineChannels(
    userId: string,
    userType: string,
    notificationType: string,
    priority: NotificationPriority
  ): Promise<string[]> {
    // Get user preferences for the notification type
    const preference = await this.getPreferenceByType(userId, userType, notificationType);

    // If user has explicit preferences, use those channels
    if (preference.channels && preference.channels.length > 0) {
      return preference.channels;
    }

    // If no preferences or all channels disabled, use default channels
    let channels = this.getDefaultChannelsForType(notificationType);

    // For high priority notifications, ensure push notification is included
    if (priority === NotificationPriority.HIGH && !channels.includes(NotificationChannelType.PUSH)) {
      channels = [NotificationChannelType.PUSH, ...channels];
    }

    return channels;
  }

  /**
   * Validates notification data before creation
   * @param data 
   * @returns Validation result with any errors
   */
  validateNotificationData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required fields (userId, userType, notificationType)
    if (!data.userId) {
      errors.push('User ID is required');
    }
    if (!data.userType) {
      errors.push('User type is required');
    }
    if (!data.notificationType) {
      errors.push('Notification type is required');
    }

    // Validate that notificationType is a valid enum value
    if (data.notificationType && !Object.values(NotificationType).includes(data.notificationType)) {
      errors.push(`Invalid notification type: ${data.notificationType}`);
    }

    // Validate channelType if provided
    if (data.channelType && !Object.values(NotificationChannelType).includes(data.channelType)) {
      errors.push(`Invalid channel type: ${data.channelType}`);
    }

    // Validate priority if provided
    if (data.priority && !Object.values(NotificationPriority).includes(data.priority)) {
      errors.push(`Invalid priority: ${data.priority}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}