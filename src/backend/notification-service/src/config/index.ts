/**
 * Notification Service Configuration
 * 
 * This module centralizes all configuration settings required for the Notification Service,
 * including service settings, processing parameters, and channel-specific configurations.
 * It leverages environment variables with sensible defaults to ensure the service can
 * operate across different environments.
 */

import {
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  getEnvObject,
  NODE_ENV,
  IS_PRODUCTION
} from '../../../common/config/environment.config';

import {
  getRedisConfig,
  getDefaultRedisClient
} from '../../../common/config/redis.config';

import {
  getKafkaConfig,
  getConsumerConfig,
  getProducerConfig
} from '../../../common/config/kafka.config';

import {
  createSNSClient,
  createSQSClient,
  getSecret
} from '../../../common/config/aws.config';

import logger from '../../../common/utils/logger';
import { NotificationChannelType } from '../models/notification-channel.model';

// Service configuration constants
const SERVICE_NAME = getEnv('SERVICE_NAME', 'notification-service');
const SERVICE_PORT = getEnvNumber('SERVICE_PORT', 3005);

// Kafka configuration
const NOTIFICATION_KAFKA_GROUP_ID = getEnv('NOTIFICATION_KAFKA_GROUP_ID', 'notification-service-group');
const NOTIFICATION_TOPIC = getEnv('NOTIFICATION_TOPIC', 'notifications');
const NOTIFICATION_EVENTS_TOPIC = getEnv('NOTIFICATION_EVENTS_TOPIC', 'notification-events');

// Processing configuration
const NOTIFICATION_DELIVERY_TIMEOUT = getEnvNumber('NOTIFICATION_DELIVERY_TIMEOUT', 30000);
const NOTIFICATION_RETRY_ATTEMPTS = getEnvNumber('NOTIFICATION_RETRY_ATTEMPTS', 3);
const NOTIFICATION_RETRY_DELAY = getEnvNumber('NOTIFICATION_RETRY_DELAY', 5000);
const NOTIFICATION_BATCH_SIZE = getEnvNumber('NOTIFICATION_BATCH_SIZE', 100);
const NOTIFICATION_PROCESSING_INTERVAL = getEnvNumber('NOTIFICATION_PROCESSING_INTERVAL', 5000);
const NOTIFICATION_CACHE_TTL = getEnvNumber('NOTIFICATION_CACHE_TTL', 86400); // 24 hours in seconds

// WebSocket configuration
const NOTIFICATION_WEBSOCKET_ENABLED = getEnvBoolean('NOTIFICATION_WEBSOCKET_ENABLED', true);
const NOTIFICATION_WEBSOCKET_PATH = getEnv('NOTIFICATION_WEBSOCKET_PATH', '/notifications');

// Email configuration
export const emailConfig = {
  provider: getEnv('EMAIL_PROVIDER', 'sendgrid'),
  fromEmail: getEnv('EMAIL_FROM_ADDRESS', 'notifications@freightoptimization.com'),
  fromName: getEnv('EMAIL_FROM_NAME', 'Freight Optimization Platform'),
  enabled: getEnvBoolean('EMAIL_ENABLED', true)
};

// SMS configuration
export const smsConfig = {
  provider: getEnv('SMS_PROVIDER', 'twilio'),
  fromNumber: getEnv('SMS_FROM_NUMBER', '+18005551234'),
  enabled: getEnvBoolean('SMS_ENABLED', true)
};

// Push notification configuration
export const pushConfig = {
  provider: getEnv('PUSH_PROVIDER', 'firebase'),
  enabled: getEnvBoolean('PUSH_ENABLED', true)
};

// In-app notification configuration
export const inAppConfig = {
  enabled: getEnvBoolean('IN_APP_ENABLED', true)
};

// SendGrid configuration (email provider)
export const sendgridConfig = {
  apiKey: getEnv('SENDGRID_API_KEY', ''),
  templates: getEnvObject('SENDGRID_TEMPLATES', {
    welcome: 'd-xxxxxxxxxxxxxxxxxxxx',
    passwordReset: 'd-xxxxxxxxxxxxxxxxxxxx',
    loadAssigned: 'd-xxxxxxxxxxxxxxxxxxxx',
    loadStatusChange: 'd-xxxxxxxxxxxxxxxxxxxx',
    loadDelivered: 'd-xxxxxxxxxxxxxxxxxxxx',
    achievementEarned: 'd-xxxxxxxxxxxxxxxxxxxx'
  })
};

// Twilio configuration (SMS provider)
export const twilioConfig = {
  accountSid: getEnv('TWILIO_ACCOUNT_SID', ''),
  authToken: getEnv('TWILIO_AUTH_TOKEN', '')
};

// Firebase configuration (push notification provider)
export const firebaseConfig = {
  projectId: getEnv('FIREBASE_PROJECT_ID', ''),
  credentials: getEnvObject('FIREBASE_CREDENTIALS', {})
};

// Service-level configuration
export const serviceConfig = {
  name: SERVICE_NAME,
  port: SERVICE_PORT,
  kafkaGroupId: NOTIFICATION_KAFKA_GROUP_ID,
  notificationTopic: NOTIFICATION_TOPIC,
  notificationEventsTopic: NOTIFICATION_EVENTS_TOPIC
};

// Processing configuration
export const processingConfig = {
  deliveryTimeout: NOTIFICATION_DELIVERY_TIMEOUT,
  retryAttempts: NOTIFICATION_RETRY_ATTEMPTS,
  retryDelay: NOTIFICATION_RETRY_DELAY,
  batchSize: NOTIFICATION_BATCH_SIZE,
  processingInterval: NOTIFICATION_PROCESSING_INTERVAL,
  cacheTTL: NOTIFICATION_CACHE_TTL
};

// WebSocket configuration for real-time notifications
export const websocketConfig = {
  enabled: NOTIFICATION_WEBSOCKET_ENABLED,
  path: NOTIFICATION_WEBSOCKET_PATH
};

/**
 * Returns the complete notification service configuration
 * @returns Complete notification service configuration object
 */
export const getNotificationServiceConfig = () => {
  return {
    service: serviceConfig,
    processing: processingConfig,
    websocket: websocketConfig,
    channels: {
      email: emailConfig,
      sms: smsConfig,
      push: pushConfig,
      inApp: inAppConfig
    },
    providers: {
      sendgrid: sendgridConfig,
      twilio: twilioConfig,
      firebase: firebaseConfig
    }
  };
};

/**
 * Returns the configuration for a specific notification channel
 * @param channelType - The type of notification channel
 * @returns Channel-specific configuration
 */
export const getChannelConfig = (channelType: NotificationChannelType) => {
  switch (channelType) {
    case NotificationChannelType.EMAIL:
      return emailConfig;
    case NotificationChannelType.SMS:
      return smsConfig;
    case NotificationChannelType.PUSH:
      return pushConfig;
    case NotificationChannelType.IN_APP:
      return inAppConfig;
    default:
      throw new Error(`Unsupported channel type: ${channelType}`);
  }
};

/**
 * Initializes the notification service configuration
 * Loads secrets from AWS Secrets Manager in production environments
 * @returns Promise that resolves when initialization is complete
 */
export const initializeNotificationConfig = async (): Promise<void> => {
  try {
    logger.info('Initializing notification service configuration');
    
    // Initialize Redis client for notification caching
    const redisClient = getDefaultRedisClient('notification-service');
    
    // Configure Kafka for event-driven notifications
    const kafkaConfig = getKafkaConfig();
    const consumerConfig = getConsumerConfig(NOTIFICATION_KAFKA_GROUP_ID);
    const producerConfig = getProducerConfig();
    
    // Setup AWS clients if needed
    if (IS_PRODUCTION) {
      // Initialize SNS client for push notifications
      const snsClient = createSNSClient();
      // Initialize SQS client for queuing notifications
      const sqsClient = createSQSClient();
      
      // Load secrets from AWS Secrets Manager
      try {
        // Load SendGrid API key
        const sendgridSecrets = await getSecret('notification-service/sendgrid');
        if (sendgridSecrets && sendgridSecrets.apiKey) {
          sendgridConfig.apiKey = sendgridSecrets.apiKey;
        }
        
        // Load Twilio credentials
        const twilioSecrets = await getSecret('notification-service/twilio');
        if (twilioSecrets) {
          twilioConfig.accountSid = twilioSecrets.accountSid || twilioConfig.accountSid;
          twilioConfig.authToken = twilioSecrets.authToken || twilioConfig.authToken;
        }
        
        // Load Firebase credentials
        const firebaseSecrets = await getSecret('notification-service/firebase');
        if (firebaseSecrets && firebaseSecrets.credentials) {
          firebaseConfig.credentials = firebaseSecrets.credentials;
        }
      } catch (error) {
        logger.error('Failed to load secrets from AWS Secrets Manager', { error });
        // Continue with default/environment values
      }
    }
    
    logger.info('Notification service configuration initialized successfully', {
      channels: {
        email: emailConfig.enabled,
        sms: smsConfig.enabled,
        push: pushConfig.enabled,
        inApp: inAppConfig.enabled
      }
    });
  } catch (error) {
    logger.error('Failed to initialize notification service configuration', { error });
    throw error;
  }
};