import { KafkaService } from '../../../event-bus/src/services/kafka.service';
import { Event, EventTypes, EventCategories, Topics, ConsumerGroups } from '../../../event-bus/src/config';
import logger from '../../../common/utils/logger';
import { NotificationService } from '../services/notification.service';
import { TemplateService } from '../services/template.service';
import {
  SystemErrorPayload,
  SystemWarningPayload,
  SystemInfoPayload,
  ServiceStatusPayload
} from '../interfaces/system-event.interface';

/**
 * Initializes the system event consumer to process system events from Kafka
 * @param kafkaService 
 * @param notificationService 
 * @param templateService 
 * @returns Promise that resolves when the consumer is initialized
 */
export const initSystemEventConsumer = async (
  kafkaService: KafkaService,
  notificationService: NotificationService,
  templateService: TemplateService
): Promise<void> => {
  // Register event handlers for different system event types
  kafkaService.registerEventHandler(
    EventTypes.SYSTEM_ERROR,
    async (event: Event) => handleSystemError(event, notificationService, templateService)
  );

  kafkaService.registerEventHandler(
    EventTypes.SYSTEM_WARNING,
    async (event: Event) => handleSystemWarning(event, notificationService, templateService)
  );

  kafkaService.registerEventHandler(
    EventTypes.SYSTEM_INFO,
    async (event: Event) => handleSystemInfo(event, notificationService, templateService)
  );

  kafkaService.registerEventHandler(
    EventTypes.SERVICE_STATUS_CHANGED,
    async (event: Event) => handleServiceStatusChanged(event, notificationService, templateService)
  );

  // Start consuming events from the SYSTEM_EVENTS topic
  await kafkaService.consumeEvents(
    [Topics.SYSTEM_EVENTS],
    ConsumerGroups.NOTIFICATION_SERVICE,
    {
      [EventTypes.SYSTEM_ERROR]: async (event: Event) =>
        handleSystemError(event, notificationService, templateService),
      [EventTypes.SYSTEM_WARNING]: async (event: Event) =>
        handleSystemWarning(event, notificationService, templateService),
      [EventTypes.SYSTEM_INFO]: async (event: Event) =>
        handleSystemInfo(event, notificationService, templateService),
      [EventTypes.SERVICE_STATUS_CHANGED]: async (event: Event) =>
        handleServiceStatusChanged(event, notificationService, templateService),
    }
  );

  // Log successful initialization of the system event consumer
  logger.info('System event consumer initialized successfully.');
};

/**
 * Handles SYSTEM_ERROR events by sending high priority notifications
 * @param event 
 * @param notificationService 
 * @param templateService 
 * @returns Promise that resolves when the event is processed
 */
const handleSystemError = async (
  event: Event,
  notificationService: NotificationService,
  templateService: TemplateService
): Promise<void> => {
  // Extract error details from event payload
  const payload = event.payload as SystemErrorPayload;

  // Log the system error event
  logger.error('Received system error event', { eventId: event.metadata.event_id, payload });

  // Determine notification recipients based on error severity and service
  const adminRecipients = await getAdminRecipients();
  const serviceOwners = await getServiceOwners(payload.serviceName);
  const recipients = [...new Set([...adminRecipients, ...serviceOwners])]; // Deduplicate

  // Create notification data with error details
  const notificationData = {
    userId: recipients.join(','), // Send to all recipients
    userType: 'admin', // All recipients are admins
    notificationType: 'system_alert',
    data: {
      errorCode: payload.errorCode,
      message: payload.message,
      serviceName: payload.serviceName,
      severity: payload.severity,
      timestamp: payload.timestamp,
      stackTrace: payload.stackTrace,
      context: payload.context,
    },
    priority: 1, // High priority
  };

  // Send high priority notification to system administrators
  await notificationService.sendNotification(notificationData);

  // Send topic notification to relevant stakeholders if applicable
  // This could be used to notify specific user groups about service outages
  // Example: await notificationService.sendTopicNotification({ topic: 'service-outages', ...notificationData });
};

/**
 * Handles SYSTEM_WARNING events by sending medium priority notifications
 * @param event 
 * @param notificationService 
 * @param templateService 
 * @returns Promise that resolves when the event is processed
 */
const handleSystemWarning = async (
  event: Event,
  notificationService: NotificationService,
  templateService: TemplateService
): Promise<void> => {
  // Extract warning details from event payload
  const payload = event.payload as SystemWarningPayload;

  // Log the system warning event
  logger.warn('Received system warning event', { eventId: event.metadata.event_id, payload });

  // Determine notification recipients based on warning context
  const adminRecipients = await getAdminRecipients();
  const serviceOwners = await getServiceOwners(payload.serviceName);
  const recipients = [...new Set([...adminRecipients, ...serviceOwners])]; // Deduplicate

  // Create notification data with warning details
  const notificationData = {
    userId: recipients.join(','), // Send to all recipients
    userType: 'admin', // All recipients are admins
    notificationType: 'system_alert',
    data: {
      warningCode: payload.warningCode,
      message: payload.message,
      serviceName: payload.serviceName,
      timestamp: payload.timestamp,
      context: payload.context,
    },
    priority: 2, // Medium priority
  };

  // Send medium priority notification to relevant administrators
  await notificationService.sendNotification(notificationData);

  // Send topic notification if the warning affects multiple users
  // This could be used to notify specific user groups about performance degradations
  // Example: await notificationService.sendTopicNotification({ topic: 'performance-alerts', ...notificationData });
};

/**
 * Handles SYSTEM_INFO events by sending low priority notifications
 * @param event 
 * @param notificationService 
 * @param templateService 
 * @returns Promise that resolves when the event is processed
 */
const handleSystemInfo = async (
  event: Event,
  notificationService: NotificationService,
  templateService: TemplateService
): Promise<void> => {
  // Extract info details from event payload
  const payload = event.payload as SystemInfoPayload;

  // Log the system info event
  logger.info('Received system info event', { eventId: event.metadata.event_id, payload });

  // Determine if the info requires notifications
  // This could be based on specific info codes or content
  const shouldNotify = true; // Example: Implement logic based on payload

  if (shouldNotify) {
    // Determine notification recipients
    const adminRecipients = await getAdminRecipients();

    // Create notification data with info details
    const notificationData = {
      userId: adminRecipients.join(','), // Send to all recipients
      userType: 'admin', // All recipients are admins
      notificationType: 'system_alert',
      data: {
        infoCode: payload.infoCode,
        message: payload.message,
        serviceName: payload.serviceName,
        timestamp: payload.timestamp,
        context: payload.context,
      },
      priority: 3, // Low priority
    };

    // Send low priority notification to relevant stakeholders
    await notificationService.sendNotification(notificationData);
  }
};

/**
 * Handles SERVICE_STATUS_CHANGED events by notifying affected users
 * @param event 
 * @param notificationService 
 * @param templateService 
 * @returns Promise that resolves when the event is processed
 */
const handleServiceStatusChanged = async (
  event: Event,
  notificationService: NotificationService,
  templateService: TemplateService
): Promise<void> => {
  // Extract service status details from event payload
  const payload = event.payload as ServiceStatusPayload;

  // Log the service status change event
  logger.info('Received service status change event', { eventId: event.metadata.event_id, payload });

  // Determine notification priority based on status (down = high, degraded = medium, up = low)
  let priority = 3; // Default to low priority
  if (payload.status === 'down') {
    priority = 1; // High priority
  } else if (payload.status === 'degraded') {
    priority = 2; // Medium priority
  }

  // Create notification data with service status details
  const notificationData = {
    userId: 'all', // Send to all users
    userType: 'all', // All user types
    notificationType: 'system_alert',
    data: {
      serviceName: payload.serviceName,
      status: payload.status,
      previousStatus: payload.previousStatus,
      timestamp: payload.timestamp,
      reason: payload.reason,
      affectedComponents: payload.affectedComponents,
      estimatedResolutionTime: payload.estimatedResolutionTime,
    },
    priority: priority,
  };

  // Send notification to system administrators
  const adminRecipients = await getAdminRecipients();
  notificationData.userId = adminRecipients.join(',');
  notificationData.userType = 'admin';
  await notificationService.sendNotification(notificationData);

  // If service affects users, send topic notification to affected user groups
  if (payload.affectedComponents && payload.affectedComponents.length > 0) {
    // Example: await notificationService.sendTopicNotification({ topic: 'affected-users', ...notificationData });
  }
};

/**
 * Gets the list of system administrator recipients for system notifications
 * @returns Promise that resolves to an array of admin user IDs
 */
const getAdminRecipients = async (): Promise<string[]> => {
  // Query the database for users with system administrator role
  // Replace this with actual database query logic
  const adminUserIds = ['admin1', 'admin2', 'admin3']; // Example
  return adminUserIds;
};

/**
 * Gets the list of service owner recipients for a specific service
 * @param serviceName 
 * @returns Promise that resolves to an array of service owner user IDs
 */
const getServiceOwners = async (serviceName: string): Promise<string[]> => {
  // Query the database for users responsible for the specified service
  // Replace this with actual database query logic
  const serviceOwnerIds = ['owner1', 'owner2']; // Example
  return serviceOwnerIds;
};

/**
 * Interface for system error event payloads
 */
interface SystemErrorPayload {
  errorCode: string;
  message: string;
  serviceName: string;
  severity: string;
  timestamp: string;
  stackTrace?: string;
  context?: object;
}

/**
 * Interface for system warning event payloads
 */
interface SystemWarningPayload {
  warningCode: string;
  message: string;
  serviceName: string;
  timestamp: string;
  context?: object;
}

/**
 * Interface for system info event payloads
 */
interface SystemInfoPayload {
  infoCode: string;
  message: string;
  serviceName: string;
  timestamp: string;
  context?: object;
}

/**
 * Interface for service status change event payloads
 */
interface ServiceStatusPayload {
  serviceName: string;
  status: string;
  previousStatus: string;
  timestamp: string;
  reason: string;
  affectedComponents?: string[];
  estimatedResolutionTime?: string;
}