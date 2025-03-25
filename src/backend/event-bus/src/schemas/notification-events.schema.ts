import { Schema } from 'avsc'; // avsc@5.7.0
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import { 
  NotificationType
} from '../../../notification-service/src/models/notification-preference.model';
import {
  NotificationPriority,
  RecipientType,
  DeliveryStatusType
} from '../../../notification-service/src/models/notification.model';
import {
  NotificationChannelType
} from '../../../notification-service/src/models/notification-channel.model';
import { NOTIFICATION_EVENTS } from '../config/topics';

/**
 * Avro schema for notification event metadata
 * Common metadata fields included in all notification events
 */
export const notificationEventMetadataSchema: Schema = {
  type: 'record',
  name: 'NotificationEventMetadata',
  fields: [
    { name: 'event_id', type: 'string' },
    { name: 'event_type', type: 'string' },
    { name: 'event_version', type: 'string' },
    { name: 'event_time', type: 'string' },
    { name: 'producer', type: 'string' },
    { name: 'correlation_id', type: 'string' },
    { name: 'category', type: 'string', default: EventCategories.NOTIFICATION }
  ]
};

/**
 * Avro schema for NOTIFICATION_CREATED event payload
 * Contains all fields necessary for creating a new notification
 */
export const notificationCreatedSchema: Schema = {
  type: 'record',
  name: 'NotificationCreatedPayload',
  fields: [
    { name: 'notification_id', type: 'string' },
    { name: 'recipient_id', type: 'string' },
    { name: 'recipient_type', type: 'string' },
    { name: 'notification_type', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'message', type: 'string' },
    { name: 'data', type: ['null', { type: 'map', values: ['null', 'string', 'int', 'double', 'boolean'] }], default: null },
    { name: 'priority', type: 'string' },
    { name: 'channels', type: { type: 'array', items: 'string' } },
    { name: 'action_url', type: ['null', 'string'], default: null },
    { name: 'expires_at', type: ['null', 'string'], default: null },
    { name: 'template_id', type: ['null', 'string'], default: null },
    { name: 'created_by', type: ['null', 'string'], default: null },
    { name: 'created_at', type: 'string' }
  ]
};

/**
 * Avro schema for NOTIFICATION_DELIVERED event payload
 * Represents a notification delivery attempt result
 */
export const notificationDeliveredSchema: Schema = {
  type: 'record',
  name: 'NotificationDeliveredPayload',
  fields: [
    { name: 'notification_id', type: 'string' },
    { name: 'recipient_id', type: 'string' },
    { name: 'channel_id', type: 'string' },
    { name: 'channel_type', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'details', type: ['null', { type: 'map', values: ['null', 'string', 'int', 'double', 'boolean'] }], default: null },
    { name: 'delivered_at', type: 'string' }
  ]
};

/**
 * Avro schema for NOTIFICATION_READ event payload
 * Represents a notification being read by a recipient
 */
export const notificationReadSchema: Schema = {
  type: 'record',
  name: 'NotificationReadPayload',
  fields: [
    { name: 'notification_id', type: 'string' },
    { name: 'recipient_id', type: 'string' },
    { name: 'read_at', type: 'string' },
    { name: 'source', type: ['null', 'string'], default: null }
  ]
};

/**
 * Map of all notification event schemas indexed by event type
 * This enables dynamic selection of the appropriate schema based on event type
 */
export const notificationEventSchemas = {
  [EventTypes.NOTIFICATION_CREATED]: notificationCreatedSchema,
  [EventTypes.NOTIFICATION_DELIVERED]: notificationDeliveredSchema,
  [EventTypes.NOTIFICATION_READ]: notificationReadSchema
};

/**
 * Default export containing the notification events topic and all associated schemas
 * Enables easy consumption of all notification schema data
 */
export default {
  topic: NOTIFICATION_EVENTS,
  schemas: notificationEventSchemas
};