/**
 * Kafka Consumer Groups Configuration
 * 
 * This module defines all Kafka consumer group IDs used throughout the AI-driven 
 * Freight Optimization Platform. It serves as a centralized registry of consumer 
 * groups to ensure consistent naming and prevent duplicate consumer group creation
 * across microservices.
 * 
 * Consumer groups are used to coordinate the consumption of messages from Kafka topics
 * by distributing the partitions across all available consumers in the group.
 * This ensures parallel processing while maintaining message ordering within partitions.
 */

import { getEnv } from '../../../common/config/environment.config';

/**
 * Prefix for all consumer group IDs to ensure uniqueness across environments
 * Can be configured via the KAFKA_CONSUMER_GROUP_PREFIX environment variable
 */
const CONSUMER_GROUP_PREFIX = getEnv('KAFKA_CONSUMER_GROUP_PREFIX', 'freight-optimization');

/**
 * Creates a fully qualified consumer group ID with the configured prefix
 * 
 * @param groupName - The base name for the consumer group
 * @returns The fully qualified consumer group ID
 */
export function getConsumerGroupId(groupName: string): string {
  return `${CONSUMER_GROUP_PREFIX}-${groupName}`;
}

/**
 * Enumeration of all consumer group IDs used in the system
 * 
 * This enum provides a centralized registry of all consumer groups to prevent
 * duplicate consumer group creation across microservices.
 * 
 * When adding a new consumer group, add it to this enum and create a corresponding
 * constant export below.
 */
export enum ConsumerGroups {
  DRIVER_EVENTS_CONSUMER = 'driver-events',
  LOAD_EVENTS_CONSUMER = 'load-events',
  POSITION_UPDATES_CONSUMER = 'position-updates',
  LOAD_ASSIGNMENTS_CONSUMER = 'load-assignments',
  OPTIMIZATION_EVENTS_CONSUMER = 'optimization-events',
  GAMIFICATION_EVENTS_CONSUMER = 'gamification-events',
  NOTIFICATION_EVENTS_CONSUMER = 'notification-events',
  MARKET_EVENTS_CONSUMER = 'market-events',
  SYSTEM_EVENTS_CONSUMER = 'system-events',
  INTEGRATION_EVENTS_CONSUMER = 'integration-events',
  GEOFENCE_EVENTS_CONSUMER = 'geofence-events',
  ETA_UPDATES_CONSUMER = 'eta-updates',
  DRIVER_AVAILABILITY_CONSUMER = 'driver-availability',
  DRIVER_HOS_CONSUMER = 'driver-hos',
  ELD_UPDATES_CONSUMER = 'eld-updates',
}

/**
 * Consumer group for processing driver-related events
 * Used by services that need to process driver profile updates, status changes, etc.
 */
export const DRIVER_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.DRIVER_EVENTS_CONSUMER);

/**
 * Consumer group for processing load-related events
 * Used by services that need to process load creation, updates, status changes, etc.
 */
export const LOAD_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.LOAD_EVENTS_CONSUMER);

/**
 * Consumer group for processing real-time position updates
 * Used by tracking service, optimization engine, and geofencing services
 */
export const POSITION_UPDATES_CONSUMER = getConsumerGroupId(ConsumerGroups.POSITION_UPDATES_CONSUMER);

/**
 * Consumer group for processing load assignment events
 * Used by matching service, notification service, and analytics services
 */
export const LOAD_ASSIGNMENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.LOAD_ASSIGNMENTS_CONSUMER);

/**
 * Consumer group for processing optimization-related events
 * Used by services that need to respond to network optimization changes
 */
export const OPTIMIZATION_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.OPTIMIZATION_EVENTS_CONSUMER);

/**
 * Consumer group for processing gamification-related events
 * Used by services that manage driver scores, achievements, and rewards
 */
export const GAMIFICATION_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.GAMIFICATION_EVENTS_CONSUMER);

/**
 * Consumer group for processing notification events
 * Used by notification service to process events that require user notifications
 */
export const NOTIFICATION_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.NOTIFICATION_EVENTS_CONSUMER);

/**
 * Consumer group for processing market intelligence events
 * Used by services that process rate changes, demand forecasts, etc.
 */
export const MARKET_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.MARKET_EVENTS_CONSUMER);

/**
 * Consumer group for processing system events
 * Used by monitoring services to process errors, warnings, and status changes
 */
export const SYSTEM_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.SYSTEM_EVENTS_CONSUMER);

/**
 * Consumer group for processing external integration events
 * Used by services that handle events from external systems like TMS, ELD providers, etc.
 */
export const INTEGRATION_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.INTEGRATION_EVENTS_CONSUMER);

/**
 * Consumer group for processing geofence events
 * Used by services that respond to geofence entry/exit events
 */
export const GEOFENCE_EVENTS_CONSUMER = getConsumerGroupId(ConsumerGroups.GEOFENCE_EVENTS_CONSUMER);

/**
 * Consumer group for processing ETA updates
 * Used by services that need to respond to changes in estimated arrival times
 */
export const ETA_UPDATES_CONSUMER = getConsumerGroupId(ConsumerGroups.ETA_UPDATES_CONSUMER);

/**
 * Consumer group for processing driver availability status changes
 * Used by matching service and optimization engine to respond to driver availability
 */
export const DRIVER_AVAILABILITY_CONSUMER = getConsumerGroupId(ConsumerGroups.DRIVER_AVAILABILITY_CONSUMER);

/**
 * Consumer group for processing driver Hours of Service updates
 * Used by services that need to respond to changes in driver HOS status
 */
export const DRIVER_HOS_CONSUMER = getConsumerGroupId(ConsumerGroups.DRIVER_HOS_CONSUMER);

/**
 * Consumer group for processing Electronic Logging Device updates
 * Used by services that integrate with ELD providers and process ELD data
 */
export const ELD_UPDATES_CONSUMER = getConsumerGroupId(ConsumerGroups.ELD_UPDATES_CONSUMER);