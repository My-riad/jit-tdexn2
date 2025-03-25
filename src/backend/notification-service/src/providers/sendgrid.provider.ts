import * as sgMail from '@sendgrid/mail';
import * as sgClient from '@sendgrid/client';
import logger from '../../../common/utils/logger';
import { sendgridConfig, emailConfig } from '../config';
import { NotificationChannelType } from '../models/notification-channel.model';
import { DeliveryStatusType } from '../models/notification.model';

/**
 * Interface defining the structure of email data sent to SendGrid
 */
export interface SendgridEmailData {
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
  categories?: string[];
}

/**
 * Interface defining the structure of template data sent to SendGrid
 */
export interface SendgridTemplateData {
  to: string;
  toName?: string;
  from?: string;
  fromName?: string;
  templateId: string;
  dynamicData: Record<string, any>;
  categories?: string[];
}

/**
 * Interface defining the structure of SendGrid's API response
 */
export interface SendgridResponse {
  statusCode: number;
  body: any;
  headers: any;
}

/**
 * Provider class for SendGrid email service integration.
 * Handles initialization of SendGrid client and provides methods for sending emails with delivery tracking.
 */
export class SendgridProvider {
  private isInitialized: boolean;
  private client: any;
  private apiKey: string;
  private templates: Record<string, string>;
  private fromEmail: string;
  private fromName: string;

  /**
   * Initializes the SendGrid provider with configuration settings
   */
  constructor() {
    this.isInitialized = false;
    this.client = null;
    this.apiKey = sendgridConfig.apiKey;
    this.templates = sendgridConfig.templates;
    this.fromEmail = emailConfig.fromEmail;
    this.fromName = emailConfig.fromName;
  }

  /**
   * Initializes the SendGrid client for sending emails
   * @returns Promise that resolves to true if initialization is successful, false otherwise
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        logger.error('SendGrid API key not configured');
        return false;
      }

      sgMail.setApiKey(this.apiKey);
      sgClient.setApiKey(this.apiKey);
      
      this.isInitialized = true;
      logger.info('SendGrid client initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize SendGrid client', { error });
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Sends an email using the SendGrid API
   * @param emailData Object containing email data
   * @returns Promise that resolves to the SendGrid API response
   */
  async sendEmail(emailData: SendgridEmailData): Promise<any> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate required fields
      if (!emailData.to || !emailData.subject || (!emailData.html && !emailData.text)) {
        throw new Error('Missing required email fields: to, subject, and either html or text is required');
      }

      if (!this.validateEmail(emailData.to)) {
        throw new Error(`Invalid recipient email address: ${emailData.to}`);
      }

      // Use default from email/name if not provided
      const from = {
        email: emailData.from || this.fromEmail,
        name: emailData.fromName || this.fromName
      };

      // Prepare email message
      const msg = {
        to: { email: emailData.to, name: emailData.toName || '' },
        from,
        subject: emailData.subject,
        html: emailData.html || '',
        text: emailData.text || '',
        attachments: emailData.attachments || [],
        categories: emailData.categories || []
      };

      // Send the email
      const response = await sgMail.send(msg);
      
      logger.info('Email sent successfully via SendGrid', {
        to: emailData.to,
        subject: emailData.subject,
        messageId: response[0]?.headers['x-message-id'] || null
      });

      return {
        status: DeliveryStatusType.DELIVERED,
        response: response[0],
        provider: 'sendgrid',
        channel: NotificationChannelType.EMAIL,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to send email via SendGrid', { 
        error, 
        to: emailData.to,
        subject: emailData.subject 
      });

      return {
        status: DeliveryStatusType.FAILED,
        error: error.message || 'Unknown SendGrid error',
        provider: 'sendgrid',
        channel: NotificationChannelType.EMAIL,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Sends an email using a SendGrid template
   * @param templateData Object containing template data
   * @returns Promise that resolves to the SendGrid API response
   */
  async sendTemplateEmail(templateData: SendgridTemplateData): Promise<any> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate required fields
      if (!templateData.to || !templateData.templateId || !templateData.dynamicData) {
        throw new Error('Missing required template fields: to, templateId, and dynamicData are required');
      }

      if (!this.validateEmail(templateData.to)) {
        throw new Error(`Invalid recipient email address: ${templateData.to}`);
      }

      // Use default from email/name if not provided
      const from = {
        email: templateData.from || this.fromEmail,
        name: templateData.fromName || this.fromName
      };

      // Prepare template message
      const msg = {
        to: { email: templateData.to, name: templateData.toName || '' },
        from,
        templateId: templateData.templateId,
        dynamicTemplateData: templateData.dynamicData,
        categories: templateData.categories || []
      };

      // Send the templated email
      const response = await sgMail.send(msg);
      
      logger.info('Template email sent successfully via SendGrid', {
        to: templateData.to,
        templateId: templateData.templateId,
        messageId: response[0]?.headers['x-message-id'] || null
      });

      return {
        status: DeliveryStatusType.DELIVERED,
        response: response[0],
        provider: 'sendgrid',
        channel: NotificationChannelType.EMAIL,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to send template email via SendGrid', { 
        error, 
        to: templateData.to,
        templateId: templateData.templateId 
      });

      return {
        status: DeliveryStatusType.FAILED,
        error: error.message || 'Unknown SendGrid template error',
        provider: 'sendgrid',
        channel: NotificationChannelType.EMAIL,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Sends the same email to multiple recipients
   * @param emailData Base email data
   * @param recipients Array of recipient email addresses
   * @returns Promise that resolves to the SendGrid API response
   */
  async sendBulkEmail(emailData: SendgridEmailData, recipients: string[]): Promise<any> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate required fields
      if (!emailData.subject || (!emailData.html && !emailData.text) || !recipients || recipients.length === 0) {
        throw new Error('Missing required fields for bulk email');
      }

      // Validate all recipient emails
      const invalidEmails = recipients.filter(email => !this.validateEmail(email));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid recipient email addresses: ${invalidEmails.join(', ')}`);
      }

      // Use default from email/name if not provided
      const from = {
        email: emailData.from || this.fromEmail,
        name: emailData.fromName || this.fromName
      };

      // Create personalizations for each recipient
      const personalizations = recipients.map(recipient => ({
        to: [{ email: recipient }],
        subject: emailData.subject
      }));

      // Prepare bulk email message
      const msg = {
        personalizations,
        from,
        subject: emailData.subject,
        html: emailData.html || '',
        text: emailData.text || '',
        attachments: emailData.attachments || [],
        categories: emailData.categories || []
      };

      // Send the bulk email
      const response = await sgMail.send(msg);
      
      logger.info('Bulk email sent successfully via SendGrid', {
        recipientCount: recipients.length,
        subject: emailData.subject,
        messageId: response[0]?.headers['x-message-id'] || null
      });

      return {
        status: DeliveryStatusType.DELIVERED,
        response: response[0],
        provider: 'sendgrid',
        channel: NotificationChannelType.EMAIL,
        recipientCount: recipients.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to send bulk email via SendGrid', { 
        error, 
        recipientCount: recipients?.length,
        subject: emailData.subject 
      });

      return {
        status: DeliveryStatusType.FAILED,
        error: error.message || 'Unknown SendGrid bulk email error',
        provider: 'sendgrid',
        channel: NotificationChannelType.EMAIL,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Retrieves a template from SendGrid by ID
   * @param templateId ID of the template to retrieve
   * @returns Promise that resolves to the template details
   */
  async getTemplate(templateId: string): Promise<any> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const request = {
        method: 'GET',
        url: `/v3/templates/${templateId}`
      };

      const [response] = await sgClient.request(request);
      
      logger.info(`Retrieved template ${templateId} from SendGrid successfully`);
      
      return response.body;
    } catch (error) {
      logger.error(`Failed to retrieve template ${templateId} from SendGrid`, { error });
      throw error;
    }
  }

  /**
   * Validates an email address format
   * @param email Email address to validate
   * @returns True if the email format is valid, false otherwise
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Checks if the SendGrid provider is initialized and available
   * @returns True if the provider is initialized, false otherwise
   */
  isAvailable(): boolean {
    return this.isInitialized && emailConfig.enabled;
  }
}

/**
 * Initializes the SendGrid client with the API key from configuration
 * @returns Promise that resolves to true if initialization is successful, false otherwise
 */
export async function initializeSendgrid(): Promise<boolean> {
  try {
    if (!sendgridConfig.apiKey) {
      logger.error('SendGrid API key not configured');
      return false;
    }

    sgMail.setApiKey(sendgridConfig.apiKey);
    logger.info('SendGrid client initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize SendGrid client', { error });
    return false;
  }
}

/**
 * Sends an email using the SendGrid API
 * @param emailData Object containing email data
 * @returns Promise that resolves to the SendGrid API response
 */
export async function sendEmail(emailData: SendgridEmailData): Promise<object> {
  try {
    // Check if SendGrid is initialized
    if (!sgMail) {
      await initializeSendgrid();
    }

    // Validate required fields
    if (!emailData.to || !emailData.subject || (!emailData.html && !emailData.text)) {
      throw new Error('Missing required email fields: to, subject, and either html or text is required');
    }

    if (!validateEmail(emailData.to)) {
      throw new Error(`Invalid recipient email address: ${emailData.to}`);
    }

    // Use default from email/name if not provided
    const from = {
      email: emailData.from || emailConfig.fromEmail,
      name: emailData.fromName || emailConfig.fromName
    };

    // Prepare email message
    const msg = {
      to: { email: emailData.to, name: emailData.toName || '' },
      from,
      subject: emailData.subject,
      html: emailData.html || '',
      text: emailData.text || '',
      attachments: emailData.attachments || [],
      categories: emailData.categories || []
    };

    // Send the email
    const response = await sgMail.send(msg);
    
    logger.info('Email sent successfully via SendGrid', {
      to: emailData.to,
      subject: emailData.subject,
      messageId: response[0]?.headers['x-message-id'] || null
    });

    return {
      status: DeliveryStatusType.DELIVERED,
      response: response[0],
      provider: 'sendgrid',
      channel: NotificationChannelType.EMAIL,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to send email via SendGrid', { 
      error, 
      to: emailData.to,
      subject: emailData.subject 
    });
    
    return {
      status: DeliveryStatusType.FAILED,
      error: error.message || 'Unknown SendGrid error',
      provider: 'sendgrid',
      channel: NotificationChannelType.EMAIL,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Validates an email address format
 * @param email Email address to validate
 * @returns True if the email format is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}