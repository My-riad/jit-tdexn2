import { Twilio, MessageInstance } from 'twilio'; // twilio@4.11.0
import logger from '../../../common/utils/logger';
import { twilioConfig, smsConfig } from '../config';
import { NotificationChannelType } from '../models/notification-channel.model';
import { DeliveryStatusType } from '../models/notification.model';

/**
 * Interface defining the structure of SMS data sent to Twilio
 */
export interface TwilioSMSData {
  /**
   * Recipient phone number
   */
  to: string;
  
  /**
   * Sender phone number (optional, uses default if not provided)
   */
  from?: string;
  
  /**
   * SMS message content
   */
  body: string;
  
  /**
   * URL for delivery status callbacks (optional)
   */
  statusCallback?: string;
  
  /**
   * Optional array of media URLs to include in MMS
   */
  mediaUrl?: string[];
}

/**
 * Interface defining the structure of Twilio's API response
 */
export interface TwilioResponse {
  sid: string;
  status: string;
  dateCreated: string;
  dateUpdated: string;
  dateSent: string;
  errorCode: number;
  errorMessage: string;
  price: string;
  priceUnit: string;
}

/**
 * Provider class for Twilio SMS service integration. Handles initialization of Twilio client and provides 
 * methods for sending SMS messages with delivery tracking.
 */
export class TwilioProvider {
  /**
   * Flag indicating whether the Twilio client is initialized
   */
  private isInitialized: boolean;
  
  /**
   * Twilio client instance
   */
  private client: Twilio | null;
  
  /**
   * Twilio account SID from configuration
   */
  private accountSid: string;
  
  /**
   * Twilio auth token from configuration
   */
  private authToken: string;
  
  /**
   * Default sender phone number from configuration
   */
  private fromNumber: string;

  /**
   * Initializes the Twilio provider with configuration settings
   */
  constructor() {
    this.isInitialized = false;
    this.client = null;
    this.accountSid = twilioConfig.accountSid;
    this.authToken = twilioConfig.authToken;
    this.fromNumber = smsConfig.fromNumber;
  }

  /**
   * Initializes the Twilio client for sending SMS messages
   * 
   * @returns Promise that resolves to true if initialization is successful, false otherwise
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if credentials are configured
      if (!this.accountSid || !this.authToken) {
        logger.error('Twilio account SID or auth token not configured');
        return false;
      }

      // Create Twilio client instance
      this.client = new Twilio(this.accountSid, this.authToken);
      this.isInitialized = true;
      
      logger.info('Twilio SMS provider initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Twilio SMS provider', { error });
      this.isInitialized = false;
      this.client = null;
      return false;
    }
  }

  /**
   * Sends an SMS message using the Twilio API
   * 
   * @param smsData SMS message data containing recipient, content, etc.
   * @returns Promise that resolves to the Twilio API response with delivery status
   */
  async sendSMS(smsData: TwilioSMSData): Promise<object> {
    try {
      // Check if Twilio is initialized
      if (!this.isInitialized || !this.client) {
        await this.initialize();
        if (!this.isInitialized || !this.client) {
          throw new Error('Twilio client not initialized');
        }
      }

      // Validate required fields
      if (!smsData.to || !smsData.body) {
        throw new Error('SMS recipient and body are required');
      }

      // Validate phone number format
      if (!this.validatePhoneNumber(smsData.to)) {
        throw new Error(`Invalid recipient phone number format: ${smsData.to}`);
      }

      // Set default from number if not provided
      const from = smsData.from || this.fromNumber;

      // Prepare message data
      const messageData: any = {
        to: smsData.to,
        from: from,
        body: smsData.body
      };

      // Add optional parameters if provided
      if (smsData.statusCallback) {
        messageData.statusCallback = smsData.statusCallback;
      }

      if (smsData.mediaUrl && smsData.mediaUrl.length > 0) {
        messageData.mediaUrl = smsData.mediaUrl;
      }

      // Send SMS message
      const message = await this.client.messages.create(messageData);

      logger.info('SMS message sent successfully', {
        to: smsData.to,
        messageSid: message.sid,
        status: message.status
      });

      // Map the Twilio status to a DeliveryStatusType
      let deliveryStatus = DeliveryStatusType.PENDING;
      if (message.status === 'delivered') {
        deliveryStatus = DeliveryStatusType.DELIVERED;
      } else if (message.status === 'failed' || message.status === 'undelivered') {
        deliveryStatus = DeliveryStatusType.FAILED;
      }

      // Return the Twilio response with delivery status
      return {
        providerResponse: {
          sid: message.sid,
          status: message.status,
          dateCreated: message.dateCreated,
          dateUpdated: message.dateUpdated,
          dateSent: message.dateSent,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
          price: message.price,
          priceUnit: message.priceUnit
        },
        deliveryStatus,
        channel: NotificationChannelType.SMS
      };
    } catch (error) {
      logger.error('Failed to send SMS message', { 
        error, 
        to: smsData.to, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Sends the same SMS message to multiple recipients
   * 
   * @param smsData Base SMS message data (without recipient)
   * @param recipients Array of recipient phone numbers
   * @returns Promise that resolves to an array of Twilio API responses
   */
  async sendBulkSMS(smsData: Omit<TwilioSMSData, 'to'>, recipients: string[]): Promise<object[]> {
    try {
      // Check if Twilio is initialized
      if (!this.isInitialized || !this.client) {
        await this.initialize();
        if (!this.isInitialized || !this.client) {
          throw new Error('Twilio client not initialized');
        }
      }

      // Validate data and recipients
      if (!smsData.body) {
        throw new Error('SMS body is required');
      }

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new Error('At least one recipient is required for bulk SMS');
      }

      // Create a promise for each recipient
      const sendPromises = recipients.map(recipient => {
        // Validate phone number format
        if (!this.validatePhoneNumber(recipient)) {
          logger.warn(`Skipping invalid phone number in bulk send: ${recipient}`);
          return Promise.resolve({
            error: `Invalid phone number format: ${recipient}`,
            deliveryStatus: DeliveryStatusType.FAILED,
            channel: NotificationChannelType.SMS
          });
        }

        // Send individual SMS
        return this.sendSMS({
          ...smsData,
          to: recipient
        });
      });

      // Wait for all messages to be sent
      const results = await Promise.all(sendPromises);

      logger.info('Bulk SMS messages sent', {
        count: recipients.length,
        successCount: results.filter(r => 
          !('error' in r) || (r as any).deliveryStatus !== DeliveryStatusType.FAILED
        ).length
      });

      return results;
    } catch (error) {
      logger.error('Failed to send bulk SMS messages', { 
        error, 
        recipientCount: recipients?.length,
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Validates a phone number format
   * 
   * @param phoneNumber Phone number to validate
   * @returns True if the phone number format is valid, false otherwise
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic regex pattern for international phone number format with optional +
    // This validates that the phone number has the correct format, but not that it's an actual working number
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Looks up phone number information using Twilio's Lookup API
   * 
   * @param phoneNumber Phone number to look up
   * @returns Promise that resolves to phone number information
   */
  async lookupPhoneNumber(phoneNumber: string): Promise<object> {
    try {
      // Check if Twilio is initialized
      if (!this.isInitialized || !this.client) {
        await this.initialize();
        if (!this.isInitialized || !this.client) {
          throw new Error('Twilio client not initialized');
        }
      }

      // Use Twilio's Lookup API to validate and get information about the phone number
      const lookupResult = await this.client.lookups.v2.phoneNumbers(phoneNumber)
        .fetch({ fields: 'line_type_intelligence' });

      logger.info('Phone number lookup completed', {
        phoneNumber,
        valid: !!lookupResult.valid
      });

      return lookupResult;
    } catch (error) {
      logger.error('Failed to look up phone number', { 
        error, 
        phoneNumber,
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Checks if the Twilio provider is initialized and available
   * 
   * @returns True if the provider is initialized, false otherwise
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

/**
 * Initializes the Twilio client with the account SID and auth token from configuration
 * 
 * @returns Promise that resolves to true if initialization is successful, false otherwise
 */
export async function initializeTwilio(): Promise<boolean> {
  try {
    // Check if Twilio account SID and auth token are configured
    if (!twilioConfig.accountSid || !twilioConfig.authToken) {
      logger.error('Twilio account SID or auth token not configured');
      return false;
    }

    // Create a new Twilio client
    const client = new Twilio(twilioConfig.accountSid, twilioConfig.authToken);
    
    // Test the client by making a simple API call
    await client.api.accounts(twilioConfig.accountSid).fetch();
    
    logger.info('Twilio client initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Twilio client', { error });
    return false;
  }
}

/**
 * Sends an SMS message using the Twilio API
 * 
 * @param smsData SMS message data containing recipient, content, etc.
 * @returns Promise that resolves to the Twilio API response
 */
export async function sendSMS(smsData: TwilioSMSData): Promise<object> {
  try {
    // Create Twilio client
    const client = new Twilio(twilioConfig.accountSid, twilioConfig.authToken);

    // Validate required fields
    if (!smsData.to || !smsData.body) {
      throw new Error('SMS recipient and body are required');
    }

    // Validate phone number format
    if (!validatePhoneNumber(smsData.to)) {
      throw new Error(`Invalid recipient phone number format: ${smsData.to}`);
    }

    // Prepare message data
    const messageData: any = {
      to: smsData.to,
      from: smsData.from || smsConfig.fromNumber,
      body: smsData.body
    };

    // Add optional parameters if provided
    if (smsData.statusCallback) {
      messageData.statusCallback = smsData.statusCallback;
    }

    if (smsData.mediaUrl && smsData.mediaUrl.length > 0) {
      messageData.mediaUrl = smsData.mediaUrl;
    }

    // Send SMS message
    const message = await client.messages.create(messageData);

    logger.info('SMS message sent successfully', {
      to: smsData.to,
      messageSid: message.sid,
      status: message.status
    });

    return message;
  } catch (error) {
    logger.error('Failed to send SMS message', { 
      error, 
      to: smsData.to,
      errorMessage: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Validates a phone number format
 * 
 * @param phoneNumber Phone number to validate
 * @returns True if the phone number format is valid, false otherwise
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Basic regex pattern for international phone number format with optional +
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}