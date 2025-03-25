import { Request, Response, NextFunction } from 'express'; // express@4.18.2
import { NotificationService } from '../services/notification.service';
import { TemplateService } from '../services/template.service';
import { PreferenceService } from '../services/preference.service';
import { Notification } from '../models/notification.model';
import { NotificationType, FrequencyType, FrequencySettings, TimeWindow } from '../models/notification-preference.model';
import { NotificationChannelType } from '../models/notification-channel.model';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * Controller responsible for handling HTTP requests related to notifications,
 * providing endpoints for creating, retrieving, and managing notifications.
 */
export class NotificationController {
  /**
   * @param notificationService - NotificationService
   */
  private notificationService: NotificationService;
  /**
   * @param templateService - TemplateService
   */
  private templateService: TemplateService;
  /**
   * @param preferenceService - PreferenceService
   */
  private preferenceService: PreferenceService;

  /**
   * Initializes the notification controller with required services
   * @param notificationService 
   * @param templateService 
   * @param preferenceService 
   */
  constructor(
    notificationService: NotificationService,
    templateService: TemplateService,
    preferenceService: PreferenceService
  ) {
    this.notificationService = notificationService;
    this.templateService = templateService;
    this.preferenceService = preferenceService;
  }

  /**
   * Creates a new notification
   * @param req 
   * @param res 
   * @param next 
   */
  async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract notification data from request body
      const notificationData = req.body;

      // LD1: Validate required fields
      if (!notificationData.userId || !notificationData.userType || !notificationData.notificationType) {
        logger.error('Missing required fields for creating notification');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required fields: userId, userType, notificationType');
      }

      // LD1: Call notificationService.createNotification with the data
      const createdNotification = await this.notificationService.createNotification(notificationData);

      // LD1: Return 201 status with created notification
      res.status(201).json(createdNotification);
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error creating notification', { error });
      next(error);
    }
  }

  /**
   * Retrieves a notification by ID
   * @param req 
   * @param res 
   * @param next 
   */
  async getNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract notificationId from request parameters
      const { notificationId } = req.params;

      // LD1: Call notificationService.getNotification with the ID
      const notification = await this.notificationService.getNotification(notificationId);

      // LD1: Return 200 status with notification data
      res.status(200).json(notification);
    } catch (error) {
      // LD1: Catch and handle any errors including NOTIFICATION_NOT_FOUND
      logger.error('Error getting notification', { error });
      next(error);
    }
  }

  /**
   * Retrieves notifications for a specific user
   * @param req 
   * @param res 
   * @param next 
   */
  async getNotificationsForRecipient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract userId and userType from request parameters
      const { userId, userType } = req.params;

      // LD1: Extract query parameters for filtering and pagination
      const { page, limit, read, notificationType, channelType, status, startDate, endDate, sortBy, sortDirection } = req.query;

      // LD1: Validate user parameters
      if (!userId || !userType) {
        logger.error('Missing required parameters: userId and userType');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required parameters: userId and userType');
      }

      // LD1: Call notificationService.getUserNotifications with parameters
      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        read: read ? (read === 'true') : undefined,
        notificationType: notificationType as string,
        channelType: channelType as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sortBy: sortBy as string,
        sortDirection: sortDirection as string,
      };
      const { notifications, total } = await this.notificationService.getUserNotifications(userId, userType, options);

      // LD1: Return 200 status with paginated notifications and total count
      res.status(200).json({ notifications, total });
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error getting notifications for recipient', { error });
      next(error);
    }
  }

  /**
   * Gets the count of unread notifications for a user
   * @param req 
   * @param res 
   * @param next 
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract userId and userType from request parameters
      const { userId, userType } = req.params;

      // LD1: Validate user parameters
      if (!userId || !userType) {
        logger.error('Missing required parameters: userId and userType');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required parameters: userId and userType');
      }

      // LD1: Call notificationService.getUnreadCount with parameters
      const count = await this.notificationService.getUnreadCount(userId, userType);

      // LD1: Return 200 status with unread count
      res.status(200).json({ unreadCount: count });
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error getting unread count', { error });
      next(error);
    }
  }

  /**
   * Marks a notification as read
   * @param req 
   * @param res 
   * @param next 
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract notificationId from request parameters
      const { notificationId } = req.params;

      // LD1: Call notificationService.markAsRead with the ID
      const updatedNotification = await this.notificationService.markAsRead(notificationId);

      // LD1: Return 200 status with updated notification
      res.status(200).json(updatedNotification);
    } catch (error) {
      // LD1: Catch and handle any errors including NOTIFICATION_NOT_FOUND
      logger.error('Error marking notification as read', { error });
      next(error);
    }
  }

  /**
   * Marks all notifications for a user as read
   * @param req 
   * @param res 
   * @param next 
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract userId and userType from request parameters
      const { userId, userType } = req.params;

      // LD1: Validate user parameters
      if (!userId || !userType) {
        logger.error('Missing required parameters: userId and userType');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required parameters: userId and userType');
      }

      // LD1: Call notificationService.markAllAsRead with parameters
      const updatedCount = await this.notificationService.markAllAsRead(userId, userType);

      // LD1: Return 200 status with count of updated notifications
      res.status(200).json({ updatedCount });
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error marking all notifications as read', { error });
      next(error);
    }
  }

  /**
   * Deletes a notification
   * @param req 
   * @param res 
   * @param next 
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract notificationId from request parameters
      const { notificationId } = req.params;

      // LD1: Call notificationService.deleteNotification with the ID
      await this.notificationService.deleteNotification(notificationId);

      // LD1: Return 204 status (No Content) on successful deletion
      res.status(204).send();
    } catch (error) {
      // LD1: Catch and handle any errors including NOTIFICATION_NOT_FOUND
      logger.error('Error deleting notification', { error });
      next(error);
    }
  }

  /**
   * Sends a notification to a user
   * @param req 
   * @param res 
   * @param next 
   */
  async sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract notification data from request body
      const notificationData = req.body;

      // LD1: Validate required fields (userId, userType, notificationType, data)
      if (!notificationData.userId || !notificationData.userType || !notificationData.notificationType || !notificationData.data) {
        logger.error('Missing required fields for sending notification');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required fields: userId, userType, notificationType, data');
      }

      // LD1: Call notificationService.sendNotification with the data
      const sentNotification = await this.notificationService.sendNotification(notificationData);

      // LD1: Return 201 status with created and sent notification
      res.status(201).json(sentNotification);
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error sending notification', { error });
      next(error);
    }
  }

  /**
   * Sends notifications to multiple users
   * @param req 
   * @param res 
   * @param next 
   */
  async sendBulkNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract bulk notification data from request body
      const bulkData = req.body;

      // LD1: Validate required fields (recipients, notificationType, data)
      if (!bulkData.recipients || !bulkData.notificationType || !bulkData.data) {
        logger.error('Missing required fields for sending bulk notifications');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required fields: recipients, notificationType, data');
      }

      // LD1: Call notificationService.sendBulkNotifications with the data
      const results = await this.notificationService.sendBulkNotifications(bulkData);

      // LD1: Return 200 status with results of bulk send operation
      res.status(200).json(results);
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error sending bulk notifications', { error });
      next(error);
    }
  }

  /**
   * Sends a notification to a topic (group of users)
   * @param req 
   * @param res 
   * @param next 
   */
  async sendTopicNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract topic notification data from request body
      const topicData = req.body;

      // LD1: Validate required fields (topic, notificationType, data)
      if (!topicData.topic || !topicData.notificationType || !topicData.data) {
        logger.error('Missing required fields for sending topic notification');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required fields: topic, notificationType, data');
      }

      // LD1: Call notificationService.sendTopicNotification with the data
      const success = await this.notificationService.sendTopicNotification(topicData);

      // LD1: Return 200 status with success indicator
      res.status(200).json({ success });
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error sending topic notification', { error });
      next(error);
    }
  }

  /**
   * Schedules a notification to be sent at a future time
   * @param req 
   * @param res 
   * @param next 
   */
  async scheduleNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract schedule data from request body
      const scheduleData = req.body;

      // LD1: Validate required fields (scheduledFor, userId, userType, notificationType, data)
      if (!scheduleData.scheduledFor || !scheduleData.userId || !scheduleData.userType || !scheduleData.notificationType || !scheduleData.data) {
        logger.error('Missing required fields for scheduling notification');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required fields: scheduledFor, userId, userType, notificationType, data');
      }

      // LD1: Call notificationService.scheduleNotification with the data
      const scheduledNotification = await this.notificationService.scheduleNotification(scheduleData);

      // LD1: Return 201 status with scheduled notification
      res.status(201).json(scheduledNotification);
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error scheduling notification', { error });
      next(error);
    }
  }

  /**
   * Cancels a scheduled notification
   * @param req 
   * @param res 
   * @param next 
   */
  async cancelScheduledNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract notificationId from request parameters
      const { notificationId } = req.params;

      // LD1: Call notificationService.cancelScheduledNotification with the ID
      const success = await this.notificationService.cancelScheduledNotification(notificationId);

      // LD1: Return 200 status with success indicator
      res.status(200).json({ success });
    } catch (error) {
      // LD1: Catch and handle any errors including NOTIFICATION_NOT_FOUND
      logger.error('Error cancelling scheduled notification', { error });
      next(error);
    }
  }

  /**
   * Gets statistics about notifications
   * @param req 
   * @param res 
   * @param next 
   */
  async getNotificationStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract query parameters for filtering (startDate, endDate, notificationType, etc.)
      const { startDate, endDate, notificationType, channelType, userType } = req.query;

      // LD1: Call notificationService.getNotificationStatistics with options
      const options = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        notificationType: notificationType as string,
        channelType: channelType as string,
        userType: userType as string,
      };
      const statistics = await this.notificationService.getNotificationStatistics(options);

      // LD1: Return 200 status with notification statistics
      res.status(200).json(statistics);
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error getting notification statistics', { error });
      next(error);
    }
  }

    /**
   * Gets notification preferences for a user
   * @param req 
   * @param res 
   * @param next 
   */
  async getUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract userId and userType from request parameters
      const { userId, userType } = req.params;

      // LD1: Validate user parameters
      if (!userId || !userType) {
        logger.error('Missing required parameters: userId and userType');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required parameters: userId and userType');
      }

      // LD1: Call preferenceService.getUserPreferences with parameters
      const preferences = await this.preferenceService.getUserPreferences(userId, userType);

      // LD1: Return 200 status with user preferences
      res.status(200).json(preferences);
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error getting user preferences', { error });
      next(error);
    }
  }

  /**
   * Updates a notification preference for a user
   * @param req 
   * @param res 
   * @param next 
   */
  async updatePreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract userId, userType, and notificationType from request parameters
      const { userId, userType, notificationType } = req.params;

      // LD1: Extract preference data from request body
      const preferenceData = req.body;

      // LD1: Validate parameters and data
      if (!userId || !userType || !notificationType) {
        logger.error('Missing required parameters: userId, userType, and notificationType');
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Missing required parameters: userId, userType, and notificationType');
      }

      // LD1: Call preferenceService.updatePreference with parameters and data
      const updatedPreference = await this.preferenceService.updatePreference(notificationType, preferenceData);

      // LD1: Return 200 status with updated preference
      res.status(200).json(updatedPreference);
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error updating notification preference', { error });
      next(error);
    }
  }

  /**
   * Gets notification templates based on filters
   * @param req 
   * @param res 
   * @param next 
   */
  async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract query parameters for filtering (notificationType, channelType)
      const { notificationType, channelType } = req.query;

      let templates;

      // LD1: If notificationType is provided, call templateService.getTemplatesByType
      if (notificationType) {
        templates = await this.templateService.getTemplatesByType(notificationType as string);
      }
      // LD1: If channelType is provided, call templateService.getTemplatesByChannel
      else if (channelType) {
        templates = await this.templateService.getTemplatesByChannel(channelType as string);
      }
      // LD1: If both are provided, filter results accordingly
      else if (notificationType && channelType) {
        const allTemplates = await this.templateService.getTemplatesByType(notificationType as string);
        templates = allTemplates.filter(template => template.channelType === channelType);
      }
      else {
        throw createError(ErrorCodes.INVALID_REQUEST_DATA, 'Either notificationType or channelType must be provided');
      }

      // LD1: Return 200 status with matching templates
      res.status(200).json(templates);
    } catch (error) {
      // LD1: Catch and handle any errors
      logger.error('Error getting notification templates', { error });
      next(error);
    }
  }

  /**
   * Gets a notification template by ID
   * @param req 
   * @param res 
   * @param next 
   */
  async getTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract templateId from request parameters
      const { templateId } = req.params;

      // LD1: Call templateService.getTemplate with the ID
      const template = await this.templateService.getTemplate(templateId);

      // LD1: Return 200 status with template data
      res.status(200).json(template);
    } catch (error) {
      // LD1: Catch and handle any errors including TEMPLATE_NOT_FOUND
      logger.error('Error getting notification template', { error });
      next(error);
    }
  }

  /**
   * Renders a template with provided data
   * @param req 
   * @param res 
   * @param next 
   */
  async renderTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract templateId from request parameters
      const { templateId } = req.params;

      // LD1: Extract data from request body
      const data = req.body;

      // LD1: Call templateService.getTemplate to get the template
      const template = await this.templateService.getTemplate(templateId);

      // LD1: Call templateService.renderTemplate with template and data
      const renderedContent = await this.templateService.renderTemplate(template, data);

      // LD1: Return 200 status with rendered content
      res.status(200).json(renderedContent);
    } catch (error) {
      // LD1: Catch and handle any errors including TEMPLATE_NOT_FOUND
      logger.error('Error rendering notification template', { error });
      next(error);
    }
  }
}