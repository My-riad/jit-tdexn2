import {
  NotificationService
} from '../../src/services/notification.service';
import {
  TemplateService
} from '../../src/services/template.service';
import {
  ChannelService
} from '../../src/services/channel.service';
import {
  PreferenceService
} from '../../src/services/preference.service';
import {
  Notification,
  NotificationStatus,
  NotificationPriority
} from '../../src/models/notification.model';
import {
  NotificationType
} from '../../src/models/notification-preference.model';
import {
  NotificationChannelType
} from '../../src/models/notification-channel.model';
import {
  ErrorCodes
} from '../../../common/constants/error-codes';

// Mock the Notification model
jest.mock('../../src/models/notification.model', () => {
  const originalModule = jest.requireActual('../../src/models/notification.model');
  return {
    ...originalModule,
    Notification: {
      query: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({
          id: 'mock-notification-id',
          userId: 'mock-user-id',
          userType: 'mock-user-type',
          notificationType: 'mock-notification-type',
          channelType: 'mock-channel-type',
          content: {
            title: 'Mock Title',
            body: 'Mock Body'
          },
          data: {},
          priority: NotificationPriority.LOW,
          status: NotificationStatus.PENDING,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        findById: jest.fn().mockResolvedValue({
          id: 'mock-notification-id',
          userId: 'mock-user-id',
          userType: 'mock-user-type',
          notificationType: 'mock-notification-type',
          channelType: 'mock-channel-type',
          content: {
            title: 'Mock Title',
            body: 'Mock Body'
          },
          data: {},
          priority: NotificationPriority.LOW,
          status: NotificationStatus.PENDING,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          markAsRead: jest.fn().mockResolvedValue({
            id: 'mock-notification-id',
            userId: 'mock-user-id',
            userType: 'mock-user-type',
            notificationType: 'mock-notification-type',
            channelType: 'mock-channel-type',
            content: {
              title: 'Mock Title',
              body: 'Mock Body'
            },
            data: {},
            priority: NotificationPriority.LOW,
            status: NotificationStatus.DELIVERED,
            read: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          $query: jest.fn(() => ({
            delete: jest.fn().mockResolvedValue(1)
          }))
        }),
        getUserNotifications: jest.fn().mockResolvedValue({
          notifications: [{
            id: 'mock-notification-id',
            userId: 'mock-user-id',
            userType: 'mock-user-type',
            notificationType: 'mock-notification-type',
            channelType: 'mock-channel-type',
            content: {
              title: 'Mock Title',
              body: 'Mock Body'
            },
            data: {},
            priority: NotificationPriority.LOW,
            status: NotificationStatus.PENDING,
            read: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }],
          total: 1
        }),
        getUnreadCount: jest.fn().mockResolvedValue(1),
        markAllAsRead: jest.fn().mockResolvedValue(1),
        deleteOldNotifications: jest.fn().mockResolvedValue(1)
      }),
    }
  };
});

// Mock the TemplateService
jest.mock('../../src/services/template.service', () => {
  return {
    TemplateService: jest.fn().mockImplementation(() => {
      return {
        getTemplateForNotification: jest.fn().mockResolvedValue({
          id: 'mock-template-id',
          name: 'mock-template',
          notificationType: 'mock-notification-type',
          channelType: 'mock-channel-type',
          content: {
            title: 'Mock Title',
            body: 'Mock Body'
          },
          variables: [],
          locale: 'en_US',
          version: '1.0',
          isDefault: true,
          isActive: true,
          render: jest.fn().mockReturnValue({
            title: 'Mock Title',
            body: 'Mock Body'
          })
        }),
        renderTemplate: jest.fn().mockResolvedValue({
          title: 'Mock Title',
          body: 'Mock Body'
        })
      };
    })
  };
});

// Mock the ChannelService
jest.mock('../../src/services/channel.service', () => {
  return {
    ChannelService: jest.fn().mockImplementation(() => {
      return {
        sendNotification: jest.fn().mockResolvedValue(true),
        sendPushToTopic: jest.fn().mockResolvedValue(true)
      };
    })
  };
});

// Mock the PreferenceService
jest.mock('../../src/services/preference.service', () => {
  return {
    PreferenceService: jest.fn().mockImplementation(() => {
      return {
        getPreferenceByType: jest.fn().mockResolvedValue({
          id: 'mock-preference-id',
          userId: 'mock-user-id',
          userType: 'mock-user-type',
          notificationType: 'mock-notification-type',
          channels: ['mock-channel-type'],
          enabled: true,
          frequency: {
            type: 'immediate',
            maxPerDay: 100
          },
          timeWindow: {
            start: '09:00',
            end: '17:00',
            timezone: 'UTC'
          },
          shouldSendNotification: jest.fn().mockReturnValue(true)
        }),
        getEnabledChannels: jest.fn().mockResolvedValue(['mock-channel-type']),
        getDefaultChannelsForType: jest.fn().mockReturnValue(['mock-channel-type'])
      };
    })
  };
});

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let templateService: TemplateService;
  let channelService: ChannelService;
  let preferenceService: PreferenceService;

  beforeEach(() => {
    templateService = new TemplateService() as jest.Mocked<TemplateService>;
    channelService = new ChannelService() as jest.Mocked<ChannelService>;
    preferenceService = new PreferenceService() as jest.Mocked<PreferenceService>;
    notificationService = new NotificationService(templateService, channelService, preferenceService);
  });

  it('should be defined', () => {
    expect(notificationService).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockNotificationData = {
        userId: 'test-user',
        userType: 'driver',
        notificationType: NotificationType.LOAD_OPPORTUNITY,
        channelType: NotificationChannelType.PUSH,
        content: {
          title: 'New Load Opportunity',
          body: 'A new load is available'
        },
        data: {
          loadId: 'load-123'
        },
        priority: NotificationPriority.HIGH
      };

      const notification = await notificationService.createNotification(mockNotificationData);

      expect(notification).toBeDefined();
      expect(notification.userId).toBe(mockNotificationData.userId);
      expect(notification.userType).toBe(mockNotificationData.userType);
      expect(notification.notificationType).toBe(mockNotificationData.notificationType);
      expect(notification.channelType).toBe(mockNotificationData.channelType);
      expect(Notification.query().insert).toHaveBeenCalledWith(expect.objectContaining(mockNotificationData));
    });

    it('should throw an error if notification data is invalid', async () => {
      const mockInvalidNotificationData = {
        userId: '', // Invalid: missing userId
        userType: 'driver',
        notificationType: NotificationType.LOAD_OPPORTUNITY,
        channelType: NotificationChannelType.PUSH,
        content: {
          title: 'New Load Opportunity',
          body: 'A new load is available'
        },
        data: {
          loadId: 'load-123'
        },
        priority: NotificationPriority.HIGH
      };

      await expect(notificationService.createNotification(mockInvalidNotificationData as any)).rejects.toThrowError(ErrorCodes.INVALID_NOTIFICATION_DATA);
      expect(Notification.query().insert).not.toHaveBeenCalled();
    });
  });

  describe('getNotification', () => {
    it('should retrieve a notification by ID', async () => {
      const mockNotificationId = 'mock-notification-id';
      const notification = await notificationService.getNotification(mockNotificationId);

      expect(notification).toBeDefined();
      expect(notification.id).toBe(mockNotificationId);
      expect(Notification.query().findById).toHaveBeenCalledWith(mockNotificationId);
    });

    it('should throw an error if notification is not found', async () => {
      (Notification.query().findById as jest.Mock).mockResolvedValue(undefined);
      const mockNotificationId = 'non-existent-id';

      await expect(notificationService.getNotification(mockNotificationId)).rejects.toThrowError(ErrorCodes.NOTIFICATION_NOT_FOUND);
      expect(Notification.query().findById).toHaveBeenCalledWith(mockNotificationId);
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve notifications for a user', async () => {
      const mockUserId = 'test-user';
      const mockUserType = 'driver';
      const options = {
        page: 1,
        limit: 10,
        read: false,
        notificationType: NotificationType.LOAD_OPPORTUNITY,
        channelType: NotificationChannelType.PUSH,
        status: NotificationStatus.PENDING,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      };

      const result = await notificationService.getUserNotifications(mockUserId, mockUserType, options);

      expect(result).toBeDefined();
      expect(result.notifications).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(Notification.getUserNotifications).toHaveBeenCalledWith(mockUserId, mockUserType, options);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockNotificationId = 'mock-notification-id';
      const notification = await notificationService.markAsRead(mockNotificationId);

      expect(notification).toBeDefined();
      expect(notification.id).toBe(mockNotificationId);
      expect(notification.status).toBe(NotificationStatus.DELIVERED);
      expect(notification.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications for a user as read', async () => {
      const mockUserId = 'test-user';
      const mockUserType = 'driver';
      const updatedCount = await notificationService.markAllAsRead(mockUserId, mockUserType);

      expect(updatedCount).toBeGreaterThanOrEqual(0);
      expect(Notification.markAllAsRead).toHaveBeenCalledWith(mockUserId, mockUserType);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const mockNotificationId = 'mock-notification-id';
      const result = await notificationService.deleteNotification(mockNotificationId);

      expect(result).toBe(true);
      expect(Notification.query().deleteById).toHaveBeenCalledWith(mockNotificationId);
    });
  });

  describe('sendNotification', () => {
    it('should send a notification through appropriate channels', async () => {
      const mockNotificationData = {
        userId: 'test-user',
        userType: 'driver',
        notificationType: NotificationType.LOAD_OPPORTUNITY,
        data: {
          loadId: 'load-123'
        },
        priority: NotificationPriority.HIGH
      };

      const notification = await notificationService.sendNotification(mockNotificationData);

      expect(notification).toBeDefined();
      expect(preferenceService.getEnabledChannels).toHaveBeenCalledWith(
        mockNotificationData.userId,
        mockNotificationData.userType,
        mockNotificationData.notificationType
      );
      expect(templateService.getTemplateForNotification).toHaveBeenCalledWith(
        mockNotificationData.notificationType,
        expect.any(String),
        undefined,
        undefined
      );
      expect(channelService.sendNotification).toHaveBeenCalled();
    });

    it('should handle delivery failure', async () => {
      (channelService.sendNotification as jest.Mock).mockResolvedValue(false);

      const mockNotificationData = {
        userId: 'test-user',
        userType: 'driver',
        notificationType: NotificationType.LOAD_OPPORTUNITY,
        data: {
          loadId: 'load-123'
        },
        priority: NotificationPriority.HIGH
      };

      const notification = await notificationService.sendNotification(mockNotificationData);

      expect(notification).toBeDefined();
      expect(channelService.sendNotification).toHaveBeenCalled();
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send notifications to multiple recipients', async () => {
      const mockBulkData = {
        recipients: [
          { userId: 'user1', userType: 'driver' },
          { userId: 'user2', userType: 'driver' }
        ],
        notificationType: NotificationType.LOAD_OPPORTUNITY,
        data: {
          loadId: 'load-123'
        },
        priority: NotificationPriority.HIGH
      };

      const result = await notificationService.sendBulkNotifications(mockBulkData);

      expect(result).toBeDefined();
      expect(result.successful).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(result.notifications).toBeInstanceOf(Array);
      expect(channelService.sendNotification).toHaveBeenCalledTimes(mockBulkData.recipients.length);
    });
  });

  describe('sendTopicNotification', () => {
    it('should send a notification to a topic', async () => {
      const mockTopicData = {
        topic: 'test-topic',
        notificationType: NotificationType.LOAD_OPPORTUNITY,
        data: {
          loadId: 'load-123'
        }
      };

      const result = await notificationService.sendTopicNotification(mockTopicData);

      expect(result).toBe(true);
      expect(channelService.sendPushToTopic).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockTopicData.topic
      );
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule a notification for future delivery', async () => {
      const mockScheduleData = {
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
        userId: 'test-user',
        userType: 'driver',
        notificationType: NotificationType.LOAD_OPPORTUNITY,
        data: {
          loadId: 'load-123'
        },
        priority: NotificationPriority.HIGH
      };

      const notification = await notificationService.scheduleNotification(mockScheduleData);

      expect(notification).toBeDefined();
      expect(notification.status).toBe(NotificationStatus.PENDING);
      expect(Notification.query().insert).toHaveBeenCalledWith(expect.objectContaining({
        scheduledFor: mockScheduleData.scheduledFor
      }));
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process notifications scheduled for current time', async () => {
      (Notification.query as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([{
          id: 'mock-notification-id',
          userId: 'test-user',
          userType: 'driver',
          notificationType: NotificationType.LOAD_OPPORTUNITY,
          channelType: NotificationChannelType.PUSH,
          content: {
            title: 'New Load Opportunity',
            body: 'A new load is available'
          },
          data: {
            loadId: 'load-123'
          },
          priority: NotificationPriority.HIGH,
          status: NotificationStatus.PENDING,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }])
      });

      const result = await notificationService.processScheduledNotifications();

      expect(result).toBeDefined();
      expect(result.processed).toBeGreaterThanOrEqual(0);
      expect(result.successful).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(channelService.sendNotification).toHaveBeenCalledTimes(result.processed);
    });
  });

  describe('retryFailedNotifications', () => {
    it('should retry sending failed notifications', async () => {
      (Notification.query as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([{
          id: 'mock-notification-id',
          userId: 'test-user',
          userType: 'driver',
          notificationType: NotificationType.LOAD_OPPORTUNITY,
          channelType: NotificationChannelType.PUSH,
          content: {
            title: 'New Load Opportunity',
            body: 'A new load is available'
          },
          data: {
            loadId: 'load-123'
          },
          priority: NotificationPriority.HIGH,
          status: NotificationStatus.FAILED,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }])
      });

      const result = await notificationService.retryFailedNotifications(3, 24);

      expect(result).toBeDefined();
      expect(result.retried).toBeGreaterThanOrEqual(0);
      expect(result.successful).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(channelService.sendNotification).toHaveBeenCalledTimes(result.retried);
    });
  });

  describe('determineChannels', () => {
    it('should determine appropriate channels based on user preferences', async () => {
      const mockUserId = 'test-user';
      const mockUserType = 'driver';
      const mockNotificationType = NotificationType.LOAD_OPPORTUNITY;
      const mockPriority = NotificationPriority.HIGH;

      const channels = await notificationService.determineChannels(mockUserId, mockUserType, mockNotificationType, mockPriority);

      expect(channels).toBeDefined();
      expect(channels).toBeInstanceOf(Array);
      expect(preferenceService.getEnabledChannels).toHaveBeenCalledWith(mockUserId, mockUserType, mockNotificationType);
    });

    it('should include push notifications for high priority notifications', async () => {
      (preferenceService.getEnabledChannels as jest.Mock).mockResolvedValue(['email']);
      const mockUserId = 'test-user';
      const mockUserType = 'driver';
      const mockNotificationType = NotificationType.LOAD_OPPORTUNITY;
      const mockPriority = NotificationPriority.HIGH;

      const channels = await notificationService.determineChannels(mockUserId, mockUserType, mockNotificationType, mockPriority);

      expect(channels).toBeDefined();
      expect(channels).toBeInstanceOf(Array);
      expect(channels).toContain('push');
    });
  });
});