import request from 'supertest'; // supertest@^6.3.3
import express, { Express } from 'express'; // express@^4.18.2
import { MockAdapter, default as axios } from 'axios-mock-adapter'; // axios-mock-adapter@^1.21.4
import { initializeApp, startServer } from '../../src/app';
import { NotificationService } from '../../src/services/notification.service';
import { Notification } from '../../src/models/notification.model';
import { NotificationType } from '../../src/models/notification-preference.model';
import { NotificationChannelType } from '../../src/models/notification-channel.model';
import { NotificationStatus } from '../../src/models/notification.model';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';
import { Server } from 'http';

const axiosMock = new MockAdapter(axios); // axios@^1.4.0

describe('Notification API Integration Tests', () => {
  let app: Express;
  let server: Server;
  let notificationService: NotificationService;
  const testPort = 3002;

  beforeAll(async () => {
    // Initialize the app and start the server
    app = await initializeApp();
    server = await startServer(app);
  });

  afterAll(async () => {
    // Close the server after all tests
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error('Error closing server', { error: err });
          reject(err);
          return;
        }
        logger.info('Server closed successfully');
        resolve();
      });
    });
  });

  beforeEach(() => {
    // Reset the mock adapter before each test
    axiosMock.reset();
  });

  it('should create a new notification', async () => {
    const newNotification = {
      userId: 'test-user-123',
      userType: 'driver',
      notificationType: NotificationType.LOAD_OPPORTUNITY,
      channelType: NotificationChannelType.IN_APP,
      content: { title: 'New Load', body: 'A new load is available' },
    };

    const response = await request(app)
      .post('/api/v1/notifications')
      .send(newNotification);

    expect(response.statusCode).toEqual(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.userId).toEqual(newNotification.userId);
    expect(response.body.status).toEqual(NotificationStatus.PENDING);
  });

  it('should get a notification by ID', async () => {
    // First, create a notification to retrieve
    const createResponse = await request(app)
      .post('/api/v1/notifications')
      .send({
        userId: 'test-user-456',
        userType: 'driver',
        notificationType: NotificationType.LOAD_STATUS,
        channelType: NotificationChannelType.IN_APP,
        content: { title: 'Load Update', body: 'Your load has been updated' },
      });

    const notificationId = createResponse.body.id;

    // Now, retrieve the notification by ID
    const response = await request(app)
      .get(`/api/v1/notifications/${notificationId}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.id).toEqual(notificationId);
    expect(response.body.userId).toEqual('test-user-456');
  });

  it('should return 404 if notification ID is not found', async () => {
    const invalidNotificationId = 'non-existent-id';

    const response = await request(app)
      .get(`/api/v1/notifications/${invalidNotificationId}`);

    expect(response.statusCode).toEqual(404);
    expect(response.body.code).toEqual(ErrorCodes.RES_LOAD_NOT_FOUND);
  });

  it('should send a notification', async () => {
    const sendNotificationData = {
      userId: 'test-user-789',
      userType: 'driver',
      notificationType: NotificationType.SYSTEM_ALERT,
      data: { message: 'System maintenance scheduled' },
    };

    // Mock external service calls if needed
    axiosMock.onPost('/api/external-service').reply(200, { success: true });

    const response = await request(app)
      .post('/api/v1/notifications/send')
      .send(sendNotificationData);

    expect(response.statusCode).toEqual(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.userId).toEqual(sendNotificationData.userId);
    expect(response.body.status).toEqual(NotificationStatus.PENDING);
  });

  it('should return 400 if required fields are missing when sending a notification', async () => {
    const invalidNotificationData = {
      userId: 'test-user-101',
      userType: 'driver',
    };

    const response = await request(app)
      .post('/api/v1/notifications/send')
      .send(invalidNotificationData);

    expect(response.statusCode).toEqual(400);
    expect(response.body.code).toEqual(ErrorCodes.VAL_INVALID_INPUT);
  });
});