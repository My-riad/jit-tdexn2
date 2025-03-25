import logger from '../../../common/utils/logger';
import { EmailChannel } from '../channels/email.channel'; // EmailChannel@version
import { SMSChannel } from '../channels/sms.channel'; // SMSChannel@version
import { PushChannel } from '../channels/push.channel'; // PushChannel@version
import { InAppChannel } from '../channels/in-app.channel'; // InAppChannel@version
import { NotificationChannel, NotificationChannelType } from '../models/notification-channel.model';
import { Notification } from '../models/notification.model';
import { NotificationTemplate } from '../models/notification-template.model';

/**
 * Interface defining the contract for notification channel implementations
 */
export interface INotificationChannel {
  /**
   * Type of the notification channel
   */
  channelType: string;
  /**
   * Method to initialize the channel
   * @returns Promise resolving to success status of initialization
   */
  initialize(): Promise<boolean>;
  /**
   * Method to send a notification through the channel
   * @param notification The notification to send
   * @param template The template to use for the notification
   * @param recipientContact Contact information for the recipient
   * @returns Promise resolving to success status of notification delivery
   */
  send(notification: Notification, template: NotificationTemplate, recipientContact: any): Promise<boolean>;
  /**
   * Method to check if the channel is available
   * @returns Whether the channel is available for sending notifications
   */
  isAvailable(): boolean;
}

/**
 * Interface defining the data required to create a new notification channel
 */
export interface ChannelCreateData {
  /**
   * Name of the channel
   */
  name: string;
  /**
   * Type of the channel
   */
  type: NotificationChannelType;
  /**
   * Whether the channel is enabled
   */
  enabled: boolean;
  /**
   * Configuration for the channel
   */
  config: object;
  /**
   * Description of the channel
   */
  description: string;
}

/**
 * Interface defining the data that can be updated for a notification channel
 */
export interface ChannelUpdateData {
  /**
   * Name of the channel
   */
  name: string;
  /**
   * Whether the channel is enabled
   */
  enabled: boolean;
  /**
   * Configuration for the channel
   */
  config: object;
  /**
   * Description of the channel
   */
  description: string;
}

/**
 * Interface defining contact information for a recipient across different channels
 */
export interface RecipientContact {
  /**
   * Email address for EMAIL channel
   */
  email?: string;
  /**
   * Phone number for SMS channel
   */
  phone?: string;
  /**
   * Device tokens for PUSH channel
   */
  deviceTokens?: string[];
  /**
   * User ID for IN_APP channel
   */
  userId?: string;
  /**
   * Recipient name for personalization
   */
  name?: string;
}

/**
 * Service responsible for managing notification channels and coordinating message delivery across multiple channels (email, SMS, push, in-app).
 */
export class ChannelService {
  /**
   * Map of channel instances by channel type
   */
  private channels: Map<string, any>;
  /**
   * Flag indicating if the service has been initialized
   */
  private isInitialized: boolean;
  /**
   * Email channel implementation
   */
  private emailChannel: EmailChannel;
  /**
   * SMS channel implementation
   */
  private smsChannel: SMSChannel;
  /**
   * Push channel implementation
   */
  private pushChannel: PushChannel;
  /**
   * In-app channel implementation
   */
  private inAppChannel: InAppChannel;

  /**
   * Initializes the channel service with default channel implementations
   */
  constructor() {
    // Initialize channels map to store channel instances
    this.channels = new Map<string, any>();
    // Set isInitialized to false
    this.isInitialized = false;
    // Create instances of each channel type (email, SMS, push, in-app)
    this.emailChannel = new EmailChannel();
    this.smsChannel = new SMSChannel();
    this.pushChannel = new PushChannel();
    this.inAppChannel = new InAppChannel();
    // Store channel instances in the channels map
    this.channels.set(NotificationChannelType.EMAIL, this.emailChannel);
    this.channels.set(NotificationChannelType.SMS, this.smsChannel);
    this.channels.set(NotificationChannelType.PUSH, this.pushChannel);
    this.channels.set(NotificationChannelType.IN_APP, this.inAppChannel);
  }

  /**
   * Initializes all notification channels
   * @param server WebSocket server instance
   * @returns Promise that resolves to true if initialization is successful, false otherwise
   */
  async initialize(server: any): Promise<boolean> {
    try {
      // Initialize email channel
      const emailInitialized = await this.emailChannel.initialize();
      if (!emailInitialized) {
        logger.error('Failed to initialize email channel');
      }

      // Initialize SMS channel
      const smsInitialized = await this.smsChannel.initialize();
      if (!smsInitialized) {
        logger.error('Failed to initialize SMS channel');
      }

      // Initialize push channel
      const pushInitialized = await this.pushChannel.initialize();
      if (!pushInitialized) {
        logger.error('Failed to initialize push channel');
      }

      // Initialize in-app channel with WebSocket server instance
      const inAppInitialized = await this.inAppChannel.initialize();
      if (!inAppInitialized) {
        logger.error('Failed to initialize in-app channel');
      }

      // Set isInitialized to true if all channels initialize successfully
      this.isInitialized = emailInitialized && smsInitialized && pushInitialized && inAppInitialized;

      if (this.isInitialized) {
        // Log successful initialization
        logger.info('All notification channels initialized successfully');
      } else {
        logger.warn('One or more notification channels failed to initialize');
      }

      // Return true if initialization was successful, false otherwise
      return this.isInitialized;
    } catch (error) {
      // Handle and log any initialization errors
      logger.error('Error initializing notification channels', { error });
      return false;
    }
  }

  /**
   * Gets all available notification channels
   * @returns Map of channel instances by channel type
   */
  getChannels(): Map<string, any> {
    // Return the channels map containing all channel instances
    return this.channels;
  }

  /**
   * Gets a notification channel by ID
   * @param channelId The ID of the channel to retrieve
   * @returns The channel if found, null otherwise
   */
  async getChannelById(channelId: string): Promise<NotificationChannel> {
    // Query the database for channel with the specified ID
    const channel = await NotificationChannel.query().findById(channelId);
    // Return the channel if found, null otherwise
    return channel;
  }

  /**
   * Gets a notification channel implementation by type
   * @param channelType The type of channel to retrieve
   * @returns The channel implementation if available, null otherwise
   */
  getChannelByType(channelType: string): any {
    // Get channel implementation from channels map by type
    const channel = this.channels.get(channelType);
    // Check if channel is available
    if (channel && channel.isAvailable()) {
      // Return the channel implementation if available, null otherwise
      return channel;
    }
    return null;
  }

  /**
   * Gets the default channel for a notification type
   * @param notificationType The type of notification
   * @returns The default channel ID for the notification type
   */
  async getDefaultChannelForType(notificationType: string): Promise<string> {
    // Determine appropriate default channel based on notification type
    let defaultChannel: string;
    // For LOAD_OPPORTUNITY, return PUSH channel
    if (notificationType === 'load_opportunity') {
      defaultChannel = NotificationChannelType.PUSH;
    }
    // For LOAD_STATUS, return IN_APP channel
    else if (notificationType === 'load_status') {
      defaultChannel = NotificationChannelType.IN_APP;
    }
    // For ACHIEVEMENT, return PUSH channel
    else if (notificationType === 'achievement') {
      defaultChannel = NotificationChannelType.PUSH;
    }
    // For SYSTEM, return EMAIL channel
    else if (notificationType === 'system') {
      defaultChannel = NotificationChannelType.EMAIL;
    }
    // For other types, return IN_APP channel
    else {
      defaultChannel = NotificationChannelType.IN_APP;
    }
    // Return the channel ID
    return defaultChannel;
  }

  /**
   * Gets all available notification channels
   * @returns Array of available notification channels
   */
  async getAvailableChannels(): Promise<NotificationChannel[]> {
    // Query the database for all enabled notification channels
    const channels = await NotificationChannel.query().where('enabled', true);
    // Return array of available channels
    return channels;
  }

  /**
   * Sends a notification through a specific channel
   * @param notification The notification to send
   * @param template The template to use for the notification
   * @param channelType The type of channel to send the notification through
   * @param recipientContact Contact information for the recipient
   * @returns Promise that resolves to true if notification was sent successfully, false otherwise
   */
  async sendNotification(
    notification: Notification,
    template: NotificationTemplate,
    channelType: string,
    recipientContact: RecipientContact
  ): Promise<boolean> {
    // Validate notification, template, and channel type
    if (!notification || !template || !channelType) {
      logger.error('Invalid parameters for sendNotification', { notification, template, channelType });
      return false;
    }

    // Get channel implementation by type
    const channel = this.getChannelByType(channelType);

    // Check if channel is available
    if (!channel) {
      logger.warn(`Channel ${channelType} is not available`);
      return false;
    }

    // Extract appropriate recipient contact information based on channel type
    let recipientInfo: string;
    if (channelType === NotificationChannelType.EMAIL && recipientContact.email) {
      recipientInfo = recipientContact.email;
    } else if (channelType === NotificationChannelType.SMS && recipientContact.phone) {
      recipientInfo = recipientContact.phone;
    } else if (channelType === NotificationChannelType.PUSH && recipientContact.deviceTokens) {
      recipientInfo = recipientContact.deviceTokens.join(', ');
    } else if (channelType === NotificationChannelType.IN_APP && recipientContact.userId) {
      recipientInfo = recipientContact.userId;
    } else {
      logger.error(`Recipient contact information is missing for channel type ${channelType}`, {
        channelType,
        recipientContact
      });
      return false;
    }

    try {
      let success: boolean;
      // For EMAIL channel, send email using emailChannel.send()
      if (channelType === NotificationChannelType.EMAIL && recipientContact.email) {
        success = await this.emailChannel.send(notification, template, recipientContact.email, recipientContact.name || '');
      }
      // For SMS channel, send SMS using smsChannel.send()
      else if (channelType === NotificationChannelType.SMS && recipientContact.phone) {
        success = await this.smsChannel.send(notification, template, recipientContact.phone, recipientContact.name || '');
      }
      // For PUSH channel, send push notification using pushChannel.send()
      else if (channelType === NotificationChannelType.PUSH && recipientContact.deviceTokens) {
        success = await this.pushChannel.send(notification, template, recipientContact.deviceTokens);
      }
      // For IN_APP channel, send in-app notification using inAppChannel.send()
      else if (channelType === NotificationChannelType.IN_APP && recipientContact.userId) {
        success = await this.inAppChannel.send(notification, template, recipientContact.userId, recipientContact.name || '');
      }
      else {
        logger.error(`Invalid channel type or missing recipient information for channel type ${channelType}`, {
          channelType,
          recipientContact
        });
        return false;
      }

      // Log successful notification delivery
      if (success) {
        logger.info(`Notification sent successfully via ${channelType}`, {
          notificationId: notification.id,
          channelType,
          recipientInfo
        });
        return true;
      } else {
        logger.error(`Failed to send notification via ${channelType}`, {
          notificationId: notification.id,
          channelType,
          recipientInfo
        });
        return false;
      }
    } catch (err) {
      // Handle and log any delivery errors
      logger.error(`Error sending notification via ${channelType}`, {
        notificationId: notification.id,
        channelType,
        recipientInfo,
        error: err
      });
      return false;
    }
  }

  /**
   * Sends a push notification to a topic
   * @param notification The notification to send
   * @param template The template to use for the notification
   * @param topic The topic to send the notification to
   * @returns Promise that resolves to true if notification was sent successfully, false otherwise
   */
  async sendPushToTopic(notification: Notification, template: NotificationTemplate, topic: string): Promise<boolean> {
    // Validate notification, template, and topic
    if (!notification || !template || !topic) {
      logger.error('Invalid parameters for sendPushToTopic', { notification, template, topic });
      return false;
    }

    // Check if push channel is available
    if (!this.pushChannel || !this.pushChannel.isAvailable()) {
      logger.warn('Push channel is not available');
      return false;
    }

    try {
      // Send push notification to topic using pushChannel.sendToTopic()
      const success = await this.pushChannel.sendToTopic(notification, template, topic);

      // Log successful notification delivery
      if (success) {
        logger.info('Push notification sent to topic successfully', {
          notificationId: notification.id,
          topic
        });
        return true;
      } else {
        logger.error('Failed to send push notification to topic', {
          notificationId: notification.id,
          topic
        });
        return false;
      }
    } catch (err) {
      // Handle and log any delivery errors
      logger.error('Error sending push notification to topic', {
        notificationId: notification.id,
        topic,
        error: err
      });
      return false;
    }
  }

  /**
   * Creates a new notification channel
   * @param channelData Data for the new channel
   * @returns The created channel
   */
  async createChannel(channelData: ChannelCreateData): Promise<NotificationChannel> {
    // Validate channel data (type, name, config)
    if (!channelData || !channelData.type || !channelData.name || !channelData.config) {
      throw new Error('Invalid channel data');
    }

    // Check if a channel with the same type already exists
    const existingChannel = await NotificationChannel.query().where('type', channelData.type).first();
    if (existingChannel) {
      throw new Error(`Channel with type ${channelData.type} already exists`);
    }

    // Create new NotificationChannel instance with provided data
    const newChannel = await NotificationChannel.query().insert(channelData);

    // Log channel creation
    logger.info('Notification channel created', { channelId: newChannel.id, channelType: newChannel.type });

    // Return the created channel
    return newChannel;
  }

  /**
   * Updates an existing notification channel
   * @param channelId ID of the channel to update
   * @param channelData Data to update the channel with
   * @returns The updated channel
   */
  async updateChannel(channelId: string, channelData: ChannelUpdateData): Promise<NotificationChannel> {
    // Retrieve channel by ID
    const channel = await NotificationChannel.query().findById(channelId);
    if (!channel) {
      throw new Error(`Channel with ID ${channelId} not found`);
    }

    // Validate update data
    if (!channelData) {
      throw new Error('Invalid update data');
    }

    // Update channel with new data
    await NotificationChannel.query().patchAndFetchById(channelId, channelData);

    // Retrieve the updated channel
    const updatedChannel = await NotificationChannel.query().findById(channelId);

    // Log channel update
    logger.info('Notification channel updated', { channelId, channelType: updatedChannel.type });

    // Return the updated channel
    return updatedChannel;
  }

  /**
   * Deletes a notification channel
   * @param channelId ID of the channel to delete
   * @returns True if deletion was successful, false otherwise
   */
  async deleteChannel(channelId: string): Promise<boolean> {
    // Retrieve channel by ID
    const channel = await NotificationChannel.query().findById(channelId);
    if (!channel) {
      throw new Error(`Channel with ID ${channelId} not found`);
    }

    // Delete the channel from the database
    await NotificationChannel.query().deleteById(channelId);

    // Log channel deletion
    logger.info('Notification channel deleted', { channelId, channelType: channel.type });

    // Return true if deletion was successful, false otherwise
    return true;
  }

  /**
   * Enables a notification channel
   * @param channelId ID of the channel to enable
   * @returns The updated channel
   */
  async enableChannel(channelId: string): Promise<NotificationChannel> {
    // Retrieve channel by ID
    const channel = await NotificationChannel.query().findById(channelId);
    if (!channel) {
      throw new Error(`Channel with ID ${channelId} not found`);
    }

    // Update channel to set enabled=true
    await NotificationChannel.query().patchAndFetchById(channelId, { enabled: true });

    // Retrieve the updated channel
    const updatedChannel = await NotificationChannel.query().findById(channelId);

    // Log channel enablement
    logger.info('Notification channel enabled', { channelId, channelType: updatedChannel.type });

    // Return the updated channel
    return updatedChannel;
  }

  /**
   * Disables a notification channel
   * @param channelId ID of the channel to disable
   * @returns The updated channel
   */
  async disableChannel(channelId: string): Promise<NotificationChannel> {
    // Retrieve channel by ID
    const channel = await NotificationChannel.query().findById(channelId);
    if (!channel) {
      throw new Error(`Channel with ID ${channelId} not found`);
    }

    // Update channel to set enabled=false
    await NotificationChannel.query().patchAndFetchById(channelId, { enabled: false });

    // Retrieve the updated channel
    const updatedChannel = await NotificationChannel.query().findById(channelId);

    // Log channel disablement
    logger.info('Notification channel disabled', { channelId, channelType: updatedChannel.type });

    // Return the updated channel
    return updatedChannel;
  }
}