import * as admin from 'firebase-admin';
import logger from '../../../common/utils/logger';
import { firebaseConfig } from '../config';
import { NotificationChannelType } from '../models/notification-channel.model';
import { DeliveryStatusType } from '../models/notification.model';

/**
 * Interface defining the structure of push notification data sent to Firebase
 */
export interface FirebaseNotificationData {
  title: string;
  body: string;
  icon?: string;
  clickAction?: string;
  data?: Record<string, any>;
}

/**
 * Interface defining the structure of Firebase's messaging response
 */
export interface FirebaseMessageResponse {
  successCount: number;
  failureCount: number;
  responses: any[];
  multicastId?: string;
}

/**
 * Provider class for Firebase Cloud Messaging integration.
 * Handles initialization of Firebase Admin SDK and provides methods for
 * sending push notifications to devices and topics.
 */
export class FirebaseProvider {
  private isInitialized: boolean = false;
  private admin: typeof admin | null = null;
  private messaging: admin.messaging.Messaging | null = null;
  private projectId: string;
  private credentials: Record<string, any>;

  constructor() {
    this.projectId = firebaseConfig.projectId;
    this.credentials = firebaseConfig.credentials;
  }

  /**
   * Initializes the Firebase Admin SDK for sending push notifications
   * @returns Promise that resolves to true if initialization is successful, false otherwise
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.credentials || !this.projectId) {
        logger.error('Firebase credentials or projectId not configured');
        return false;
      }

      // Initialize the Firebase Admin SDK
      this.admin = admin;
      const app = admin.initializeApp({
        credential: admin.credential.cert(this.credentials),
        projectId: this.projectId
      });

      // Get messaging instance
      this.messaging = admin.messaging(app);
      this.isInitialized = true;

      logger.info('Firebase Admin SDK initialized successfully', {
        projectId: this.projectId
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK', { error });
      return false;
    }
  }

  /**
   * Sends a push notification to one or more device tokens using Firebase Cloud Messaging
   * @param notificationData The notification data (title, body, etc.)
   * @param deviceTokens Array of device tokens to send notification to
   * @returns Promise that resolves to the Firebase messaging response
   */
  async sendNotification(
    notificationData: FirebaseNotificationData,
    deviceTokens: string[]
  ): Promise<FirebaseMessageResponse> {
    try {
      if (!this.isInitialized || !this.messaging) {
        throw new Error('Firebase not initialized');
      }

      if (!notificationData.title || !notificationData.body) {
        throw new Error('Notification title and body are required');
      }

      if (!this.validateDeviceTokens(deviceTokens)) {
        throw new Error('Invalid device tokens');
      }

      // Prepare notification message
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          imageUrl: notificationData.icon
        },
        data: notificationData.data || {},
        tokens: deviceTokens,
        android: {
          notification: {
            clickAction: notificationData.clickAction
          }
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
              'content-available': 1
            }
          }
        }
      };

      // Send the message
      const response = await this.messaging.sendMulticast(message);

      logger.info(`Push notification sent successfully`, {
        success: response.successCount,
        failure: response.failureCount,
        tokens: deviceTokens.length,
        channel: NotificationChannelType.PUSH,
        status: response.successCount > 0 ? DeliveryStatusType.DELIVERED : DeliveryStatusType.FAILED
      });

      return response;
    } catch (error) {
      logger.error('Failed to send push notification', { 
        error, 
        deviceTokens,
        channel: NotificationChannelType.PUSH,
        status: DeliveryStatusType.FAILED
      });
      throw error;
    }
  }

  /**
   * Sends a push notification to a topic that devices can subscribe to
   * @param notificationData The notification data (title, body, etc.)
   * @param topic The topic to send the notification to
   * @returns Promise that resolves to the Firebase messaging response
   */
  async sendToTopic(
    notificationData: FirebaseNotificationData,
    topic: string
  ): Promise<string> {
    try {
      if (!this.isInitialized || !this.messaging) {
        throw new Error('Firebase not initialized');
      }

      if (!notificationData.title || !notificationData.body) {
        throw new Error('Notification title and body are required');
      }

      if (!this.validateTopic(topic)) {
        throw new Error('Invalid topic format');
      }

      // Prepare notification message
      const message: admin.messaging.Message = {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          imageUrl: notificationData.icon
        },
        data: notificationData.data || {},
        topic: topic,
        android: {
          notification: {
            clickAction: notificationData.clickAction
          }
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
              'content-available': 1
            }
          }
        }
      };

      // Send the message
      const response = await this.messaging.send(message);

      logger.info(`Push notification sent to topic successfully`, {
        topic,
        messageId: response,
        channel: NotificationChannelType.PUSH,
        status: DeliveryStatusType.DELIVERED
      });

      return response;
    } catch (error) {
      logger.error('Failed to send push notification to topic', { 
        error, 
        topic,
        channel: NotificationChannelType.PUSH,
        status: DeliveryStatusType.FAILED
      });
      throw error;
    }
  }

  /**
   * Subscribes device tokens to a specific topic
   * @param deviceTokens Array of device tokens to subscribe
   * @param topic The topic to subscribe to
   * @returns Promise that resolves to the subscription response
   */
  async subscribeToTopic(deviceTokens: string[], topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      if (!this.isInitialized || !this.messaging) {
        throw new Error('Firebase not initialized');
      }

      if (!this.validateDeviceTokens(deviceTokens)) {
        throw new Error('Invalid device tokens');
      }

      if (!this.validateTopic(topic)) {
        throw new Error('Invalid topic format');
      }

      // Subscribe tokens to topic
      const response = await this.messaging.subscribeToTopic(deviceTokens, topic);

      logger.info(`Devices subscribed to topic successfully`, {
        topic,
        tokens: deviceTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return response;
    } catch (error) {
      logger.error('Failed to subscribe devices to topic', { error, topic, deviceTokens });
      throw error;
    }
  }

  /**
   * Unsubscribes device tokens from a specific topic
   * @param deviceTokens Array of device tokens to unsubscribe
   * @param topic The topic to unsubscribe from
   * @returns Promise that resolves to the unsubscription response
   */
  async unsubscribeFromTopic(deviceTokens: string[], topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      if (!this.isInitialized || !this.messaging) {
        throw new Error('Firebase not initialized');
      }

      if (!this.validateDeviceTokens(deviceTokens)) {
        throw new Error('Invalid device tokens');
      }

      if (!this.validateTopic(topic)) {
        throw new Error('Invalid topic format');
      }

      // Unsubscribe tokens from topic
      const response = await this.messaging.unsubscribeFromTopic(deviceTokens, topic);

      logger.info(`Devices unsubscribed from topic successfully`, {
        topic,
        tokens: deviceTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return response;
    } catch (error) {
      logger.error('Failed to unsubscribe devices from topic', { error, topic, deviceTokens });
      throw error;
    }
  }

  /**
   * Validates an array of device tokens for FCM
   * @param deviceTokens Array of device tokens to validate
   * @returns True if the device tokens array is valid, false otherwise
   */
  private validateDeviceTokens(deviceTokens: string[]): boolean {
    return Array.isArray(deviceTokens) && deviceTokens.length > 0;
  }

  /**
   * Validates a topic string format
   * @param topic Topic string to validate
   * @returns True if the topic format is valid, false otherwise
   */
  private validateTopic(topic: string): boolean {
    // FCM topics must match the pattern: /topics/[a-zA-Z0-9-_.~%]+
    if (!topic || typeof topic !== 'string') {
      return false;
    }
    
    // If topic starts with /topics/, remove it for the check
    const actualTopic = topic.startsWith('/topics/') ? topic.substring(8) : topic;
    
    // Check topic format according to FCM requirements
    return /^[a-zA-Z0-9-_.~%]+$/.test(actualTopic);
  }

  /**
   * Checks if the Firebase provider is initialized and available
   * @returns True if the provider is initialized, false otherwise
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

/**
 * Initializes the Firebase Admin SDK with the project credentials from configuration
 * @returns Promise that resolves to true if initialization is successful, false otherwise
 */
export async function initializeFirebase(): Promise<boolean> {
  try {
    if (!firebaseConfig.credentials || !firebaseConfig.projectId) {
      logger.error('Firebase credentials or projectId not configured');
      return false;
    }

    // Initialize the Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig.credentials),
      projectId: firebaseConfig.projectId
    });

    logger.info('Firebase Admin SDK initialized successfully', {
      projectId: firebaseConfig.projectId
    });

    return true;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK', { error });
    return false;
  }
}

/**
 * Sends a push notification to one or more device tokens using Firebase Cloud Messaging
 * @param notificationData The notification data (title, body, etc.)
 * @param deviceTokens Array of device tokens to send notification to
 * @returns Promise that resolves to the Firebase messaging response
 */
export async function sendNotification(
  notificationData: FirebaseNotificationData,
  deviceTokens: string[]
): Promise<FirebaseMessageResponse> {
  try {
    // Check if Firebase is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }

    if (!notificationData.title || !notificationData.body) {
      throw new Error('Notification title and body are required');
    }

    if (!validateDeviceTokens(deviceTokens)) {
      throw new Error('Invalid device tokens');
    }

    const messaging = admin.messaging();

    // Prepare notification message
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        imageUrl: notificationData.icon
      },
      data: notificationData.data || {},
      tokens: deviceTokens,
      android: {
        notification: {
          clickAction: notificationData.clickAction
        }
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1,
            'content-available': 1
          }
        }
      }
    };

    // Send the message
    const response = await messaging.sendMulticast(message);

    logger.info(`Push notification sent successfully`, {
      success: response.successCount,
      failure: response.failureCount,
      tokens: deviceTokens.length,
      channel: NotificationChannelType.PUSH,
      status: response.successCount > 0 ? DeliveryStatusType.DELIVERED : DeliveryStatusType.FAILED
    });

    return response;
  } catch (error) {
    logger.error('Failed to send push notification', { 
      error, 
      deviceTokens,
      channel: NotificationChannelType.PUSH,
      status: DeliveryStatusType.FAILED
    });
    throw error;
  }
}

/**
 * Sends a push notification to a topic that devices can subscribe to
 * @param notificationData The notification data (title, body, etc.)
 * @param topic The topic to send the notification to
 * @returns Promise that resolves to the Firebase messaging response
 */
export async function sendToTopic(
  notificationData: FirebaseNotificationData,
  topic: string
): Promise<string> {
  try {
    // Check if Firebase is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }

    if (!notificationData.title || !notificationData.body) {
      throw new Error('Notification title and body are required');
    }

    // Validate topic format
    const topicRegex = /^[a-zA-Z0-9-_.~%]+$/;
    const actualTopic = topic.startsWith('/topics/') ? topic.substring(8) : topic;
    if (!topic || typeof topic !== 'string' || !topicRegex.test(actualTopic)) {
      throw new Error('Invalid topic format');
    }

    const messaging = admin.messaging();

    // Prepare notification message
    const message: admin.messaging.Message = {
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        imageUrl: notificationData.icon
      },
      data: notificationData.data || {},
      topic: actualTopic,
      android: {
        notification: {
          clickAction: notificationData.clickAction
        }
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1,
            'content-available': 1
          }
        }
      }
    };

    // Send the message
    const response = await messaging.send(message);

    logger.info(`Push notification sent to topic successfully`, {
      topic,
      messageId: response,
      channel: NotificationChannelType.PUSH,
      status: DeliveryStatusType.DELIVERED
    });

    return response;
  } catch (error) {
    logger.error('Failed to send push notification to topic', { 
      error, 
      topic,
      channel: NotificationChannelType.PUSH,
      status: DeliveryStatusType.FAILED
    });
    throw error;
  }
}

/**
 * Validates an array of device tokens for FCM
 * @param deviceTokens Array of device tokens to validate
 * @returns True if the device tokens array is valid, false otherwise
 */
function validateDeviceTokens(deviceTokens: string[]): boolean {
  return Array.isArray(deviceTokens) && deviceTokens.length > 0;
}