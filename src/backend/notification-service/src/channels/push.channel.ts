import logger, { info, error } from '../../../common/utils/logger';
import { NotificationTemplate, PushTemplateContent } from '../models/notification-template.model';
import { Notification, NotificationStatus } from '../models/notification.model';
import { NotificationChannelType } from '../models/notification-channel.model';
import { pushConfig } from '../config';
import { FirebaseProvider } from '../providers/firebase.provider';

/**
 * Interface defining the structure of push notification data sent to the provider
 */
interface PushNotificationData {
  /**
   * Title of the push notification
   */
  title: string;
  /**
   * Body text of the push notification
   */
  body: string;
  /**
   * Optional icon URL for the push notification
   */
  icon?: string;
  /**
   * Additional data payload for the push notification
   */
  data?: Record<string, any>;
  /**
   * Action to perform when notification is clicked
   */
  clickAction?: string;
}

/**
 * Implementation of the push notification channel using Firebase Cloud Messaging.
 * Handles push notification delivery to mobile devices and tracking of delivery status.
 */
export class PushChannel {
  private isInitialized: boolean;
  public channelType: string;
  private isEnabled: boolean;
  private pushProvider: FirebaseProvider | null;

  /**
   * Initializes the push notification channel with configuration settings
   */
  constructor() {
    this.channelType = NotificationChannelType.PUSH;
    this.isEnabled = pushConfig.enabled;
    this.isInitialized = false;
    this.pushProvider = null;
  }

  /**
   * Initializes the push notification provider for sending notifications
   * @returns Promise that resolves to true if initialization is successful, false otherwise
   */
  async initialize(): Promise<boolean> {
    // Check if push channel is enabled in configuration
    if (!this.isEnabled) {
      logger.info('Push notification channel is disabled by configuration');
      return false;
    }

    try {
      // Create and initialize the FirebaseProvider
      this.pushProvider = new FirebaseProvider();
      const initialized = await this.pushProvider.initialize();

      if (initialized) {
        this.isInitialized = true;
        logger.info('Push notification channel initialized successfully', {
          provider: pushConfig.provider
        });
        return true;
      } else {
        logger.error('Failed to initialize push notification provider', {
          provider: pushConfig.provider
        });
        return false;
      }
    } catch (err) {
      logger.error('Error initializing push notification channel', { error: err });
      return false;
    }
  }

  /**
   * Sends a push notification to the recipient device tokens
   * @param notification Notification object to be sent
   * @param template Template for rendering the notification content
   * @param deviceTokens Array of device tokens to send the notification to
   * @returns Promise that resolves to true if notification was sent successfully, false otherwise
   */
  async send(
    notification: Notification,
    template: NotificationTemplate,
    deviceTokens: string[]
  ): Promise<boolean> {
    // Verify channel is enabled and initialized
    if (!this.isEnabled || !this.isInitialized || !this.pushProvider) {
      logger.error('Push notification channel is not available', {
        notificationId: notification.id,
        enabled: this.isEnabled,
        initialized: this.isInitialized
      });
      await notification.markAsFailed('Push notification channel is not available');
      return false;
    }

    // Validate device tokens
    if (!this.validateDeviceTokens(deviceTokens)) {
      logger.error('Invalid device tokens for push notification', {
        notificationId: notification.id,
        tokenCount: deviceTokens ? deviceTokens.length : 0
      });
      await notification.markAsFailed('Invalid device tokens');
      return false;
    }

    try {
      // Render push notification template
      const pushContent = this.renderPushTemplate(template, notification);

      // Prepare notification data for Firebase
      const notificationData: PushNotificationData = {
        title: pushContent.title,
        body: pushContent.body,
        icon: pushContent.icon,
        data: {
          ...pushContent.data,
          notificationId: notification.id,
          referenceId: notification.referenceId,
          referenceType: notification.referenceType,
          notificationType: notification.notificationType
        },
        clickAction: pushContent.data?.clickAction || 'FLUTTER_NOTIFICATION_CLICK'
      };

      // Send push notification
      const result = await this.pushProvider.sendNotification(notificationData, deviceTokens);

      // Update notification status
      if (result.successCount > 0) {
        // Mark as sent at minimum
        await notification.markAsSent();

        // If all recipients received the notification, mark as delivered
        if (result.successCount === deviceTokens.length) {
          await notification.markAsDelivered();
        }

        logger.info('Push notification sent successfully', {
          notificationId: notification.id,
          successCount: result.successCount,
          failureCount: result.failureCount,
          totalTokens: deviceTokens.length
        });
        return true;
      } else {
        await notification.markAsFailed(`Failed to send to any device tokens (${deviceTokens.length})`);
        logger.error('Push notification delivery failed', {
          notificationId: notification.id,
          successCount: 0,
          failureCount: result.failureCount,
          totalTokens: deviceTokens.length
        });
        return false;
      }
    } catch (err) {
      await notification.markAsFailed(`Error sending push notification: ${err.message}`);
      logger.error('Exception while sending push notification', {
        notificationId: notification.id,
        error: err,
        deviceTokens: deviceTokens.length
      });
      return false;
    }
  }

  /**
   * Sends a push notification to a topic that devices can subscribe to
   * @param notification Notification object to be sent
   * @param template Template for rendering the notification content
   * @param topic Topic to send the notification to
   * @returns Promise that resolves to true if notification was sent successfully, false otherwise
   */
  async sendToTopic(
    notification: Notification,
    template: NotificationTemplate,
    topic: string
  ): Promise<boolean> {
    // Verify channel is enabled and initialized
    if (!this.isEnabled || !this.isInitialized || !this.pushProvider) {
      logger.error('Push notification channel is not available', {
        notificationId: notification.id,
        enabled: this.isEnabled,
        initialized: this.isInitialized
      });
      await notification.markAsFailed('Push notification channel is not available');
      return false;
    }

    // Validate topic
    if (!topic || typeof topic !== 'string') {
      logger.error('Invalid topic for push notification', {
        notificationId: notification.id,
        topic
      });
      await notification.markAsFailed('Invalid topic');
      return false;
    }

    try {
      // Render push notification template
      const pushContent = this.renderPushTemplate(template, notification);

      // Prepare notification data for Firebase
      const notificationData: PushNotificationData = {
        title: pushContent.title,
        body: pushContent.body,
        icon: pushContent.icon,
        data: {
          ...pushContent.data,
          notificationId: notification.id,
          referenceId: notification.referenceId,
          referenceType: notification.referenceType,
          notificationType: notification.notificationType
        },
        clickAction: pushContent.data?.clickAction || 'FLUTTER_NOTIFICATION_CLICK'
      };

      // Send push notification to topic
      const result = await this.pushProvider.sendToTopic(notificationData, topic);

      if (result) {
        // For topic messages, we can only mark as sent since we don't know delivery status
        await notification.markAsSent();
        
        logger.info('Push notification sent to topic successfully', {
          notificationId: notification.id,
          topic,
          messageId: result
        });
        return true;
      } else {
        await notification.markAsFailed(`Failed to send to topic: ${topic}`);
        logger.error('Push notification to topic failed', {
          notificationId: notification.id,
          topic
        });
        return false;
      }
    } catch (err) {
      await notification.markAsFailed(`Error sending push notification to topic: ${err.message}`);
      logger.error('Exception while sending push notification to topic', {
        notificationId: notification.id,
        error: err,
        topic
      });
      return false;
    }
  }

  /**
   * Renders the push notification template with notification data
   * @param template Template object containing push notification content
   * @param notification Notification object with data for template rendering
   * @returns Rendered PushTemplateContent object with title, body, and data
   */
  private renderPushTemplate(
    template: NotificationTemplate,
    notification: Notification
  ): PushTemplateContent {
    // Extract template content for push notification
    const renderedContent = template.render(notification.data || {}) as PushTemplateContent;
    
    // Validate the required fields
    if (!renderedContent.title || !renderedContent.body) {
      logger.warn('Push notification template missing required fields', {
        notificationId: notification.id,
        templateId: template.id,
        hasTitle: !!renderedContent.title,
        hasBody: !!renderedContent.body
      });
    }

    return renderedContent;
  }

  /**
   * Checks if the push notification channel is available for sending notifications
   * @returns True if the channel is enabled and initialized, false otherwise
   */
  isAvailable(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  /**
   * Validates an array of device tokens
   * @param deviceTokens Array of device tokens to validate
   * @returns True if the device tokens array is valid, false otherwise
   */
  private validateDeviceTokens(deviceTokens: string[]): boolean {
    return Array.isArray(deviceTokens) && deviceTokens.length > 0;
  }
}