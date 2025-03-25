import logger from '../../../common/utils/logger';
import { NotificationTemplate } from '../models/notification-template.model';
import { Notification, DeliveryStatusType } from '../models/notification.model';
import { NotificationChannelType } from '../models/notification-channel.model';
import { smsConfig } from '../config';
import { TwilioProvider } from '../providers/twilio.provider';

/**
 * Interface defining the structure of SMS template content
 */
export interface SMSTemplateContent {
  /**
   * Text content of the SMS message
   */
  text: string;
}

/**
 * Interface defining the structure of SMS data sent to the provider
 */
export interface SMSData {
  /**
   * Recipient phone number
   */
  to: string;
  /**
   * Sender phone number
   */
  from: string;
  /**
   * SMS message content
   */
  body: string;
  /**
   * Optional URL for delivery status callbacks
   */
  statusCallback?: string;
}

/**
 * Implementation of the SMS notification channel using Twilio.
 * Handles SMS delivery, template rendering, and tracking of delivery status.
 */
export class SMSChannel {
  /**
   * Flag indicating whether the channel is initialized
   */
  private isInitialized: boolean;
  
  /**
   * Type of notification channel
   */
  public channelType: string;
  
  /**
   * Whether this channel is enabled in configuration
   */
  private isEnabled: boolean;
  
  /**
   * SMS provider instance (Twilio)
   */
  private smsProvider: TwilioProvider | null;
  
  /**
   * Default sender phone number
   */
  private fromNumber: string;

  /**
   * Initializes the SMS notification channel with configuration settings
   */
  constructor() {
    this.channelType = NotificationChannelType.SMS;
    this.isEnabled = smsConfig.enabled;
    this.isInitialized = false;
    this.fromNumber = smsConfig.fromNumber;
    this.smsProvider = null;
  }

  /**
   * Initializes the SMS provider for sending notifications
   * 
   * @returns Promise that resolves to true if initialization is successful, false otherwise
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if SMS channel is enabled in configuration
      if (!this.isEnabled) {
        logger.info('SMS notification channel is disabled in configuration');
        return false;
      }

      // Create and initialize the SMS provider (Twilio)
      this.smsProvider = new TwilioProvider();
      const initialized = await this.smsProvider.initialize();
      
      if (initialized) {
        this.isInitialized = true;
        logger.info('SMS notification channel initialized successfully', {
          provider: smsConfig.provider,
          fromNumber: this.fromNumber
        });
        return true;
      } else {
        logger.error('Failed to initialize SMS provider');
        return false;
      }
    } catch (error) {
      logger.error('Error initializing SMS notification channel', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Sends an SMS notification to the recipient
   * 
   * @param notification The notification to send
   * @param template The template to use for rendering the SMS content
   * @param recipientPhoneNumber The recipient's phone number
   * @param recipientName The recipient's name for personalization
   * @returns Promise that resolves to true if SMS was sent successfully, false otherwise
   */
  async send(
    notification: Notification,
    template: NotificationTemplate,
    recipientPhoneNumber: string,
    recipientName: string
  ): Promise<boolean> {
    try {
      // Check if channel is enabled and initialized
      if (!this.isEnabled || !this.isInitialized || !this.smsProvider) {
        logger.warn('SMS notification channel is not available', {
          enabled: this.isEnabled,
          initialized: this.isInitialized,
          notificationId: notification.id
        });
        await notification.updateDeliveryStatus(DeliveryStatusType.SKIPPED);
        return false;
      }

      // Validate recipient phone number
      if (!this.validatePhoneNumber(recipientPhoneNumber)) {
        logger.warn('Invalid recipient phone number', {
          phoneNumber: recipientPhoneNumber,
          notificationId: notification.id
        });
        await notification.updateDeliveryStatus(DeliveryStatusType.SKIPPED);
        return false;
      }

      // Render SMS template with notification data
      const templateContent = this.renderSMSTemplate(template, notification);
      
      // Prepare SMS data
      const smsData = {
        to: recipientPhoneNumber,
        from: this.fromNumber,
        body: templateContent.text
      };

      // Send SMS using Twilio provider
      logger.info('Sending SMS notification', {
        recipient: recipientPhoneNumber,
        notificationId: notification.id,
        templateId: template.id
      });
      
      const result = await this.smsProvider.sendSMS(smsData);
      
      // Update notification delivery status based on result
      await notification.updateDeliveryStatus(DeliveryStatusType.DELIVERED);
      
      logger.info('SMS notification sent successfully', {
        recipient: recipientPhoneNumber,
        notificationId: notification.id,
        result
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send SMS notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        recipient: recipientPhoneNumber,
        notificationId: notification.id
      });
      
      // Update notification status to failed
      await notification.updateDeliveryStatus(DeliveryStatusType.FAILED);
      
      return false;
    }
  }

  /**
   * Checks if the SMS notification channel is available for sending notifications
   * 
   * @returns True if the channel is enabled and initialized, false otherwise
   */
  isAvailable(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  /**
   * Renders the SMS notification template with notification data
   * 
   * @param template The template to render
   * @param notification The notification containing data for template rendering
   * @returns Object containing rendered text content
   */
  private renderSMSTemplate(
    template: NotificationTemplate,
    notification: Notification
  ): SMSTemplateContent {
    // Extract template content for SMS (text)
    const content = template.render(notification.data || {});
    return content as SMSTemplateContent;
  }

  /**
   * Validates a phone number format using Twilio provider
   * 
   * @param phoneNumber The phone number to validate
   * @returns True if the phone number format is valid, false otherwise
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    if (!this.smsProvider) {
      return false;
    }
    return this.smsProvider.validatePhoneNumber(phoneNumber);
  }
}