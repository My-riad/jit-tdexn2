import logger, { info, error } from '../../../common/utils/logger';
import { NotificationTemplate } from '../models/notification-template.model';
import { Notification, DeliveryStatusType } from '../models/notification.model';
import { NotificationChannelType } from '../models/notification-channel.model';
import { emailConfig } from '../config';
import { SendgridProvider } from '../providers/sendgrid.provider';

/**
 * Interface defining the structure of email template content
 */
export interface EmailTemplateContent {
  /**
   * Subject line of the email
   */
  subject: string;
  
  /**
   * HTML content of the email
   */
  html: string;
  
  /**
   * Plain text version of the email
   */
  text: string;
}

/**
 * Interface defining the structure of email data sent to the provider
 */
export interface EmailData {
  /**
   * Recipient email address
   */
  to: string;
  
  /**
   * Recipient name
   */
  toName: string;
  
  /**
   * Sender email address
   */
  from: string;
  
  /**
   * Sender name
   */
  fromName: string;
  
  /**
   * Email subject line
   */
  subject: string;
  
  /**
   * HTML content of the email
   */
  html: string;
  
  /**
   * Plain text version of the email
   */
  text: string;
}

/**
 * Implementation of the email notification channel using SendGrid.
 * Handles email delivery, template rendering, and tracking of delivery status.
 */
export class EmailChannel {
  /**
   * Flag indicating if the channel has been initialized
   */
  private isInitialized: boolean;
  
  /**
   * The type of notification channel (email)
   */
  public channelType: string;
  
  /**
   * Flag indicating if the email channel is enabled
   */
  private isEnabled: boolean;
  
  /**
   * SendGrid provider instance for sending emails
   */
  private emailProvider: SendgridProvider | null;
  
  /**
   * Default from email address
   */
  private fromEmail: string;
  
  /**
   * Default from name
   */
  private fromName: string;
  
  /**
   * Initializes the email notification channel with configuration settings
   */
  constructor() {
    this.channelType = NotificationChannelType.EMAIL;
    this.isEnabled = emailConfig.enabled;
    this.isInitialized = false;
    this.fromEmail = emailConfig.fromEmail;
    this.fromName = emailConfig.fromName;
    this.emailProvider = null;
  }
  
  /**
   * Initializes the email provider for sending notifications
   * 
   * @returns Promise that resolves to true if initialization is successful, false otherwise
   */
  public async initialize(): Promise<boolean> {
    // Check if email channel is enabled in configuration
    if (!this.isEnabled) {
      logger.info('Email notification channel is disabled');
      return false;
    }
    
    try {
      // Create and initialize SendGrid provider
      this.emailProvider = new SendgridProvider();
      const initialized = await this.emailProvider.initialize();
      
      if (initialized) {
        this.isInitialized = true;
        logger.info('Email notification channel initialized successfully');
        return true;
      } else {
        logger.error('Failed to initialize email notification channel');
        return false;
      }
    } catch (err) {
      logger.error('Error initializing email notification channel', { error: err });
      this.isInitialized = false;
      return false;
    }
  }
  
  /**
   * Sends an email notification to the recipient
   * 
   * @param notification Notification object with content and metadata
   * @param template Notification template to render
   * @param recipientEmail Email address of the recipient
   * @param recipientName Name of the recipient
   * @returns Promise that resolves to true if email was sent successfully, false otherwise
   */
  public async send(
    notification: Notification,
    template: NotificationTemplate,
    recipientEmail: string,
    recipientName: string
  ): Promise<boolean> {
    // Check if channel is enabled and initialized
    if (!this.isEnabled || !this.isInitialized || !this.emailProvider) {
      logger.info('Email notification channel is not available', {
        enabled: this.isEnabled,
        initialized: this.isInitialized,
        providerAvailable: !!this.emailProvider
      });
      return false;
    }
    
    // Validate recipient email
    if (!this.validateEmail(recipientEmail)) {
      logger.error('Invalid recipient email address', { email: recipientEmail });
      // Update notification status to SKIPPED
      await notification.updateDeliveryStatus(
        this.channelType,
        DeliveryStatusType.SKIPPED,
        `Invalid recipient email address: ${recipientEmail}`
      );
      return false;
    }
    
    try {
      // Render the email template with notification data
      const renderedContent = this.renderEmailTemplate(template, notification);
      
      // Prepare email data
      const emailData: EmailData = {
        to: recipientEmail,
        toName: recipientName,
        from: this.fromEmail,
        fromName: this.fromName,
        subject: renderedContent.subject,
        html: renderedContent.html,
        text: renderedContent.text
      };
      
      // Send the email
      const result = await this.emailProvider.sendEmail({
        to: emailData.to,
        toName: emailData.toName,
        from: emailData.from,
        fromName: emailData.fromName,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });
      
      // Update notification delivery status based on result
      if (result && result.status === DeliveryStatusType.DELIVERED) {
        await notification.updateDeliveryStatus(
          this.channelType,
          DeliveryStatusType.DELIVERED,
          null,
          { messageId: result.response?.headers?.['x-message-id'] || null }
        );
        logger.info('Email notification sent successfully', {
          notificationId: notification.id,
          recipientEmail,
          subject: emailData.subject
        });
        return true;
      } else {
        // Handle failure
        await notification.updateDeliveryStatus(
          this.channelType,
          DeliveryStatusType.FAILED,
          result?.error || 'Email sending failed'
        );
        logger.error('Failed to send email notification', {
          notificationId: notification.id,
          recipientEmail,
          error: result?.error
        });
        return false;
      }
    } catch (err) {
      // Update notification status to FAILED
      await notification.updateDeliveryStatus(
        this.channelType,
        DeliveryStatusType.FAILED,
        err.message || 'Error sending email notification'
      );
      logger.error('Error sending email notification', {
        notificationId: notification.id,
        recipientEmail,
        error: err
      });
      return false;
    }
  }
  
  /**
   * Checks if the email notification channel is available for sending notifications
   * 
   * @returns True if the channel is enabled and initialized, false otherwise
   */
  public isAvailable(): boolean {
    return this.isEnabled && this.isInitialized && this.emailProvider?.isAvailable() === true;
  }
  
  /**
   * Renders the email notification template with notification data
   * 
   * @param template The notification template
   * @param notification The notification containing data for template rendering
   * @returns Object containing rendered subject, html, and text content
   */
  private renderEmailTemplate(
    template: NotificationTemplate,
    notification: Notification
  ): EmailTemplateContent {
    // Extract template content for email
    const emailContent = template.content as EmailTemplateContent;
    
    // Combine notification data and any additional data
    const templateData = {
      ...notification.data
    };
    
    // Render all content with template data
    const renderedContent: EmailTemplateContent = {
      subject: template.render(templateData).subject,
      html: template.render(templateData).html,
      text: template.render(templateData).text
    };
    
    return renderedContent;
  }
  
  /**
   * Validates an email address format
   * 
   * @param email Email address to validate
   * @returns True if the email format is valid, false otherwise
   */
  private validateEmail(email: string): boolean {
    // Basic email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}