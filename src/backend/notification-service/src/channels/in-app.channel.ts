import { EventEmitter } from 'events';
import logger from '../../../common/utils/logger';
import { NotificationTemplate } from '../models/notification-template.model';
import { Notification, DeliveryStatusType } from '../models/notification.model';
import { NotificationChannelType } from '../models/notification-channel.model';
import { inAppConfig } from '../config';

/**
 * Interface defining the structure of in-app notification template content
 */
export interface InAppTemplateContent {
  /**
   * Title of the in-app notification
   */
  title: string;
  
  /**
   * Body text of the in-app notification
   */
  body: string;
  
  /**
   * Optional URL for an icon to display in the notification
   */
  icon?: string;
  
  /**
   * Optional URL to navigate to when the notification is clicked
   */
  actionUrl?: string;
}

/**
 * Interface defining the contract for WebSocket notification delivery
 */
export interface IWebSocketNotifier {
  /**
   * Method to send a notification via WebSocket
   * @param notification The notification to send
   * @returns Promise resolving to success status of notification delivery
   */
  sendNotification(notification: Notification): Promise<boolean>;
}

/**
 * Interface defining the structure of notification events
 */
export interface NotificationEvent {
  /**
   * Type of notification event
   */
  type: string;
  
  /**
   * The notification object
   */
  notification: Notification;
  
  /**
   * The rendered notification content
   */
  content?: InAppTemplateContent;
  
  /**
   * Whether notification delivery was successful
   */
  success?: boolean;
}

/**
 * Implementation of the in-app notification channel using WebSockets.
 * Handles notification formatting, delivery, and tracking of delivery status.
 */
export class InAppChannel {
  /**
   * Flag indicating if the channel has been initialized
   */
  private isInitialized: boolean;
  
  /**
   * The type of channel (in-app)
   */
  public channelType: string;
  
  /**
   * Flag indicating if the channel is enabled in configuration
   */
  private isEnabled: boolean;
  
  /**
   * WebSocket notifier implementation for sending notifications
   */
  private socketNotifier: IWebSocketNotifier;
  
  /**
   * Event emitter for notification events
   */
  private eventEmitter: EventEmitter;
  
  /**
   * Initializes the in-app notification channel with configuration settings
   * @param socketNotifier WebSocket notifier implementation
   */
  constructor(socketNotifier: IWebSocketNotifier) {
    this.channelType = NotificationChannelType.IN_APP;
    this.isEnabled = inAppConfig.enabled;
    this.isInitialized = false;
    this.socketNotifier = socketNotifier;
    this.eventEmitter = new EventEmitter();
  }
  
  /**
   * Initializes the in-app notification channel
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    try {
      // Check if WebSocket notification socket interface is available
      if (!this.socketNotifier) {
        logger.error('WebSocket notifier is not available for in-app notifications');
        this.isInitialized = false;
        return;
      }
      
      this.isInitialized = true;
      
      // Set up event listeners for notification events
      this.eventEmitter.on('notification-sent', 
        (notification: Notification, success: boolean) => {
          this.onNotificationSent(notification, success);
        }
      );
      
      logger.info('In-app notification channel initialized successfully', {
        channelType: this.channelType,
        enabled: this.isEnabled
      });
    } catch (error) {
      logger.error('Failed to initialize in-app notification channel', { error });
      this.isInitialized = false;
      throw error;
    }
  }
  
  /**
   * Sends an in-app notification to the recipient
   * @param notification The notification to send
   * @param template The notification template
   * @param recipientId The ID of the recipient
   * @param recipientType The type of recipient (driver, carrier, etc.)
   * @returns Promise that resolves to true if notification was sent successfully, false otherwise
   */
  public async send(
    notification: Notification,
    template: NotificationTemplate,
    recipientId: string,
    recipientType: string
  ): Promise<boolean> {
    // Check if channel is enabled and initialized
    if (!this.isEnabled || !this.isInitialized) {
      logger.info('In-app notification channel is disabled or not initialized', {
        notificationId: notification.id,
        enabled: this.isEnabled,
        initialized: this.isInitialized
      });
      return false;
    }
    
    try {
      // Render in-app notification template with notification data
      const content = this.renderInAppTemplate(template, notification);
      
      logger.info('Sending in-app notification', {
        notificationId: notification.id,
        recipientId,
        recipientType
      });
      
      // Emit a 'send-notification' event with the notification and rendered content
      this.eventEmitter.emit('send-notification', {
        type: 'send-notification',
        notification,
        content
      });
      
      // Use the socketNotifier interface to send the notification
      const success = await this.socketNotifier.sendNotification(notification);
      
      // Update notification delivery status based on success
      if (success) {
        await notification.updateDeliveryStatus(DeliveryStatusType.DELIVERED);
        logger.info('In-app notification delivered successfully', {
          notificationId: notification.id,
          recipientId
        });
      } else {
        await notification.updateDeliveryStatus(DeliveryStatusType.FAILED);
        logger.error('Failed to deliver in-app notification', {
          notificationId: notification.id,
          recipientId
        });
      }
      
      // Emit notification-sent event for tracking
      this.eventEmitter.emit('notification-sent', notification, success);
      
      return success;
    } catch (error) {
      logger.error('Error sending in-app notification', {
        notificationId: notification.id,
        recipientId,
        error
      });
      
      // Update notification status to FAILED
      await notification.updateDeliveryStatus(DeliveryStatusType.FAILED);
      
      // Emit notification-sent event for tracking
      this.eventEmitter.emit('notification-sent', notification, false);
      
      return false;
    }
  }
  
  /**
   * Checks if the in-app notification channel is available for sending notifications
   * @returns True if the channel is enabled and initialized, false otherwise
   */
  public isAvailable(): boolean {
    return this.isEnabled && this.isInitialized;
  }
  
  /**
   * Renders the in-app notification template with notification data
   * @param template The notification template
   * @param notification The notification object
   * @returns Object containing rendered title, body, icon, and actionUrl
   */
  private renderInAppTemplate(
    template: NotificationTemplate,
    notification: Notification
  ): InAppTemplateContent {
    // Extract template content for in-app notification
    const templateContent = template.render(notification.data || {}) as InAppTemplateContent;
    
    return {
      title: templateContent.title,
      body: templateContent.body,
      icon: templateContent.icon,
      actionUrl: templateContent.actionUrl
    };
  }
  
  /**
   * Handles notification sent event from the WebSocket service
   * @param notification The notification that was sent
   * @param success Whether the notification was delivered successfully
   */
  private onNotificationSent(notification: Notification, success: boolean): void {
    if (success) {
      notification.updateDeliveryStatus(DeliveryStatusType.DELIVERED);
      logger.info('In-app notification marked as delivered', {
        notificationId: notification.id
      });
    } else {
      notification.updateDeliveryStatus(DeliveryStatusType.FAILED);
      logger.info('In-app notification marked as failed', {
        notificationId: notification.id
      });
    }
  }
}