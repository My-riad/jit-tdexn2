/**
 * topics.ts
 * 
 * This file defines Kafka topic names used throughout the AI-driven Freight Optimization Platform.
 * It serves as a centralized registry of topics to ensure consistent naming and
 * prevent duplicate topic creation across microservices.
 */

import { getEnv } from '../../../common/config/environment.config';
import { EventCategories } from '../../../common/constants/event-types';

// Retrieve the Kafka topic prefix from environment variables with default
const TOPIC_PREFIX = getEnv('KAFKA_TOPIC_PREFIX', 'freight-optimization');

/**
 * Helper function to generate a topic name with the configured prefix
 * 
 * @param category - The category for the topic name
 * @returns The fully qualified topic name with prefix
 */
export const getTopicName = (category: string): string => {
  return `${TOPIC_PREFIX}-${category.toLowerCase()}`;
};

/**
 * Enum of Kafka topic names for various event categories
 * This serves as the centralized registry of all topic names used in the platform
 */
export enum Topics {
  DRIVER_EVENTS = 'DRIVER_EVENTS',
  LOAD_EVENTS = 'LOAD_EVENTS',
  POSITION_UPDATES = 'POSITION_UPDATES',
  LOAD_ASSIGNMENTS = 'LOAD_ASSIGNMENTS',
  OPTIMIZATION_EVENTS = 'OPTIMIZATION_EVENTS',
  GAMIFICATION_EVENTS = 'GAMIFICATION_EVENTS',
  NOTIFICATION_EVENTS = 'NOTIFICATION_EVENTS',
  MARKET_EVENTS = 'MARKET_EVENTS',
  SYSTEM_EVENTS = 'SYSTEM_EVENTS',
  INTEGRATION_EVENTS = 'INTEGRATION_EVENTS',
  GEOFENCE_EVENTS = 'GEOFENCE_EVENTS'
}

// Exported topic name constants with prefix
// These provide the actual topic names used in production

/**
 * Topic for driver-related events
 * Includes events like driver creation, updates, status changes, etc.
 */
export const DRIVER_EVENTS = getTopicName(EventCategories.DRIVER);

/**
 * Topic for load-related events
 * Includes events like load creation, updates, status changes, etc.
 */
export const LOAD_EVENTS = getTopicName(EventCategories.LOAD);

/**
 * Topic for real-time position updates
 * High-volume stream of driver and vehicle position updates
 */
export const POSITION_UPDATES = getTopicName(EventCategories.POSITION);

/**
 * Topic for load assignment events
 * Includes assignment creation, updates, completions, and cancellations
 */
export const LOAD_ASSIGNMENTS = getTopicName(EventCategories.ASSIGNMENT);

/**
 * Topic for optimization-related events
 * Includes optimization requests, completions, and results
 */
export const OPTIMIZATION_EVENTS = getTopicName(EventCategories.OPTIMIZATION);

/**
 * Topic for gamification-related events
 * Includes score updates, achievements, leaderboards, and bonus zones
 */
export const GAMIFICATION_EVENTS = getTopicName(EventCategories.GAMIFICATION);

/**
 * Topic for notification events
 * Includes notification creation, delivery status, and read receipts
 */
export const NOTIFICATION_EVENTS = getTopicName(EventCategories.NOTIFICATION);

/**
 * Topic for market intelligence events
 * Includes rate updates, forecasts, hotspots, and auctions
 */
export const MARKET_EVENTS = getTopicName(EventCategories.MARKET);

/**
 * Topic for system events
 * Includes errors, warnings, info, and service status changes
 */
export const SYSTEM_EVENTS = getTopicName(EventCategories.SYSTEM);

/**
 * Topic for external integration events
 * Includes ELD and TMS connections, disconnections, and data receipt
 */
export const INTEGRATION_EVENTS = getTopicName(EventCategories.INTEGRATION);

/**
 * Topic for geofence entry/exit events
 * Tracks when vehicles enter or exit defined geographic boundaries
 */
export const GEOFENCE_EVENTS = getTopicName(EventCategories.GEOFENCE);