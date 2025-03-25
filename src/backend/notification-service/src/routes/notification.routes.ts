import express, { Router } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { NotificationType, FrequencyType, FrequencySettings, TimeWindow } from '../models/notification-preference.model';
import { NotificationChannelType } from '../models/notification-channel.model';

/**
 * Configures and returns an Express router with all notification-related routes
 * @param services - An object containing the NotificationService instance
 * @returns Configured Express router with notification routes
 */
export const configureNotificationRoutes = (services: { notificationService: NotificationService }): express.Router => {
  // LD1: Create a new Express router instance
  const router = express.Router();

  // LD1: Extract notificationService from the provided services object
  const { notificationService } = services;

  // LD1: Create a new NotificationController instance with the notificationService
  const notificationController = new NotificationController(
    notificationService,
    // Assuming templateService and preferenceService are available in the services object
    // If not, you'll need to adjust how these are accessed/injected
    (services as any).templateService,
    (services as any).preferenceService
  );

  // LD1: Define validation schemas for request validation
  const notificationIdSchema = Joi.object({
    notificationId: Joi.string().uuid().required()
  });

  const userIdAndTypeSchema = Joi.object({
    userId: Joi.string().required(),
    userType: Joi.string().valid('driver', 'carrier', 'shipper', 'admin').required()
  });

  const createNotificationSchema = Joi.object({
    userId: Joi.string().required(),
    userType: Joi.string().valid('driver', 'carrier', 'shipper', 'admin').required(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
    templateId: Joi.string().uuid().optional(),
    channelType: Joi.string().valid(...Object.values(NotificationChannelType)).optional(),
    content: Joi.object().optional(),
    data: Joi.object().optional(),
    priority: Joi.number().integer().min(1).max(3).optional(),
    referenceId: Joi.string().optional(),
    referenceType: Joi.string().optional(),
    scheduledFor: Joi.date().iso().optional()
  });

  const sendNotificationSchema = Joi.object({
    userId: Joi.string().required(),
    userType: Joi.string().valid('driver', 'carrier', 'shipper', 'admin').required(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
    data: Joi.object().required(),
    priority: Joi.number().integer().min(1).max(3).optional(),
    channels: Joi.array().items(Joi.string().valid(...Object.values(NotificationChannelType))).optional(),
    templateId: Joi.string().uuid().optional(),
    referenceId: Joi.string().optional(),
    referenceType: Joi.string().optional(),
    locale: Joi.string().optional()
  });

  const sendBulkNotificationsSchema = Joi.object({
    recipients: Joi.array().items(Joi.object({
      userId: Joi.string().required(),
      userType: Joi.string().valid('driver', 'carrier', 'shipper', 'admin').required(),
      data: Joi.object().optional()
    })).required(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
    data: Joi.object().required(),
    priority: Joi.number().integer().min(1).max(3).optional(),
    channels: Joi.array().items(Joi.string().valid(...Object.values(NotificationChannelType))).optional(),
    templateId: Joi.string().uuid().optional(),
    referenceId: Joi.string().optional(),
    referenceType: Joi.string().optional(),
    locale: Joi.string().optional()
  });

  const sendTopicNotificationSchema = Joi.object({
    topic: Joi.string().required(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
    data: Joi.object().required(),
    templateId: Joi.string().uuid().optional(),
    referenceId: Joi.string().optional(),
    referenceType: Joi.string().optional(),
    locale: Joi.string().optional()
  });

  const scheduleNotificationSchema = Joi.object({
    scheduledFor: Joi.date().iso().required(),
    userId: Joi.string().required(),
    userType: Joi.string().valid('driver', 'carrier', 'shipper', 'admin').required(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
    data: Joi.object().required(),
    priority: Joi.number().integer().min(1).max(3).optional(),
    channels: Joi.array().items(Joi.string().valid(...Object.values(NotificationChannelType))).optional(),
    templateId: Joi.string().uuid().optional(),
    referenceId: Joi.string().optional(),
    referenceType: Joi.string().optional()
  });

  const getNotificationStatisticsSchema = Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).optional(),
    channelType: Joi.string().valid(...Object.values(NotificationChannelType)).optional(),
    userType: Joi.string().valid('driver', 'carrier', 'shipper', 'admin').optional()
  });

  // LD1: Configure routes for notification management (GET, POST, PUT, DELETE)
  router.post('/', authenticate, validateBody(createNotificationSchema), (req, res, next) => notificationController.createNotification(req, res, next));
  router.get('/:notificationId', authenticate, validateParams(notificationIdSchema), (req, res, next) => notificationController.getNotification(req, res, next));
  router.get('/user/:userId/:userType', authenticate, validateParams(userIdAndTypeSchema), validateQuery({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    read: Joi.boolean().optional(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).optional(),
    channelType: Joi.string().valid(...Object.values(NotificationChannelType)).optional(),
    status: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    sortBy: Joi.string().optional(),
    sortDirection: Joi.string().valid('asc', 'desc').optional()
  }), (req, res, next) => notificationController.getNotificationsForRecipient(req, res, next));
  router.get('/unread/:userId/:userType', authenticate, validateParams(userIdAndTypeSchema), (req, res, next) => notificationController.getUnreadCount(req, res, next));
  router.put('/:notificationId/read', authenticate, validateParams(notificationIdSchema), (req, res, next) => notificationController.markAsRead(req, res, next));
  router.put('/user/:userId/:userType/readall', authenticate, validateParams(userIdAndTypeSchema), (req, res, next) => notificationController.markAllAsRead(req, res, next));
  router.delete('/:notificationId', authenticate, validateParams(notificationIdSchema), (req, res, next) => notificationController.deleteNotification(req, res, next));

  // LD1: Configure routes for sending notifications (single, bulk, topic)
  router.post('/send', authenticate, validateBody(sendNotificationSchema), (req, res, next) => notificationController.sendNotification(req, res, next));
  router.post('/send/bulk', authenticate, validateBody(sendBulkNotificationsSchema), (req, res, next) => notificationController.sendBulkNotifications(req, res, next));
  router.post('/send/topic', authenticate, validateBody(sendTopicNotificationSchema), (req, res, next) => notificationController.sendTopicNotification(req, res, next));

  // LD1: Configure routes for notification scheduling
  router.post('/schedule', authenticate, validateBody(scheduleNotificationSchema), (req, res, next) => notificationController.scheduleNotification(req, res, next));
  router.delete('/schedule/:notificationId', authenticate, validateParams(notificationIdSchema), (req, res, next) => notificationController.cancelScheduledNotification(req, res, next));

  // LD1: Configure routes for notification statistics
  router.get('/statistics', authenticate, validateQuery(getNotificationStatisticsSchema), (req, res, next) => notificationController.getNotificationStatistics(req, res, next));

  // LD1: Return the configured router
  return router;
};