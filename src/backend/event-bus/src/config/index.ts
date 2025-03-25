/**
 * Event Bus Configuration Module
 *
 * This module serves as the central configuration hub for the event bus service,
 * exporting all configuration settings, constants, and utility functions needed
 * for Kafka messaging, topic management, consumer groups, and schema registry.
 *
 * It aggregates configuration from various sources and provides a single entry point
 * for all configuration-related imports throughout the event bus service.
 */

import { getEnv, getEnvNumber, getEnvBoolean } from '../../../common/config/environment.config';
import {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig,
  getAdminConfig,
  getTopicConfig,
  KAFKA_DEFAULT_PARTITIONS,
  KAFKA_DEFAULT_REPLICATION_FACTOR
} from '../../../common/config/kafka.config';
import { Topics, getTopicName } from './topics';
import { ConsumerGroups, getConsumerGroupId } from './consumer-groups';

/**
 * Name of the event bus service for identification in logs and events
 * Can be configured via the EVENT_BUS_SERVICE_NAME environment variable
 */
export const EVENT_BUS_SERVICE_NAME = getEnv('EVENT_BUS_SERVICE_NAME', 'event-bus-service');

/**
 * Port number on which the event bus service will listen
 * Can be configured via the EVENT_BUS_PORT environment variable
 */
export const EVENT_BUS_PORT = getEnvNumber('EVENT_BUS_PORT', 3002);

/**
 * Host address on which the event bus service will bind
 * Can be configured via the EVENT_BUS_HOST environment variable
 */
export const EVENT_BUS_HOST = getEnv('EVENT_BUS_HOST', '0.0.0.0');

/**
 * URL of the Confluent Schema Registry for message schema validation
 * Can be configured via the SCHEMA_REGISTRY_URL environment variable
 */
export const SCHEMA_REGISTRY_URL = getEnv('SCHEMA_REGISTRY_URL', 'http://localhost:8081');

/**
 * Flag to enable or disable integration with the schema registry
 * Can be configured via the SCHEMA_REGISTRY_ENABLED environment variable
 */
export const SCHEMA_REGISTRY_ENABLED = getEnvBoolean('SCHEMA_REGISTRY_ENABLED', true);

/**
 * Flag to enable or disable schema validation for incoming and outgoing messages
 * Can be configured via the SCHEMA_VALIDATION_ENABLED environment variable
 */
export const SCHEMA_VALIDATION_ENABLED = getEnvBoolean('SCHEMA_VALIDATION_ENABLED', true);

/**
 * Flag to enable or disable automatic creation of topics when they don't exist
 * Can be configured via the TOPIC_AUTO_CREATION_ENABLED environment variable
 */
export const TOPIC_AUTO_CREATION_ENABLED = getEnvBoolean('TOPIC_AUTO_CREATION_ENABLED', true);

// Re-export Kafka configuration functions and constants
export {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig,
  getAdminConfig,
  getTopicConfig,
  KAFKA_DEFAULT_PARTITIONS,
  KAFKA_DEFAULT_REPLICATION_FACTOR
};

// Re-export topic-related constants and functions
export {
  Topics,
  getTopicName
};

// Re-export consumer group constants and functions
export {
  ConsumerGroups,
  getConsumerGroupId
};

/**
 * Maps an event category to its corresponding Kafka topic
 * 
 * Used by the event bus to route events to the appropriate topic based on
 * their category. Ensures consistent topic usage across the platform.
 * 
 * @param category - The event category to map (from EventCategories enum)
 * @returns The corresponding Kafka topic name from the Topics enum
 */
export const getTopicForCategory = (category: string): string => {
  // Map the category to the corresponding topic in the Topics enum
  switch (category) {
    case 'DRIVER':
      return Topics.DRIVER_EVENTS;
    case 'LOAD':
      return Topics.LOAD_EVENTS;
    case 'POSITION':
      return Topics.POSITION_UPDATES;
    case 'ASSIGNMENT':
      return Topics.LOAD_ASSIGNMENTS;
    case 'OPTIMIZATION':
      return Topics.OPTIMIZATION_EVENTS;
    case 'GAMIFICATION':
      return Topics.GAMIFICATION_EVENTS;
    case 'NOTIFICATION':
      return Topics.NOTIFICATION_EVENTS;
    case 'MARKET':
      return Topics.MARKET_EVENTS;
    case 'SYSTEM':
      return Topics.SYSTEM_EVENTS;
    case 'INTEGRATION':
      return Topics.INTEGRATION_EVENTS;
    case 'GEOFENCE':
      return Topics.GEOFENCE_EVENTS;
    default:
      // Default to system events for unknown categories
      return Topics.SYSTEM_EVENTS;
  }
};