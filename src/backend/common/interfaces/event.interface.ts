/**
 * Event interface definitions for the platform's event-driven architecture
 * 
 * This file defines standardized interfaces for events used across the platform's
 * microservices, enabling consistent event handling and communication.
 */

import { EventTypes, EventCategories } from '../constants/event-types';

/**
 * Standard metadata structure for all events in the platform
 * Contains essential information about the event for routing and processing
 */
export interface EventMetadata {
  /**
   * Unique identifier for the event
   */
  event_id: string;

  /**
   * Type of event from the EventTypes enum
   */
  event_type: EventTypes;

  /**
   * Version of the event schema
   */
  event_version: string;

  /**
   * ISO timestamp when the event was created
   */
  event_time: string;

  /**
   * Service that produced the event
   */
  producer: string;

  /**
   * ID for correlating related events
   */
  correlation_id: string;

  /**
   * Category of the event from EventCategories enum
   */
  category: EventCategories;
}

/**
 * Generic event interface with metadata and payload
 * Base interface for all events in the system
 */
export interface Event {
  /**
   * Standard metadata for the event
   */
  metadata: EventMetadata;

  /**
   * Event payload data
   */
  payload: any;
}

/**
 * Specialized event interface for driver-related events
 */
export interface DriverEvent extends Event {
  /**
   * Driver-specific event data
   */
  payload: object;
}

/**
 * Specialized event interface for load-related events
 */
export interface LoadEvent extends Event {
  /**
   * Load-specific event data
   */
  payload: object;
}

/**
 * Specialized event interface for position update events
 */
export interface PositionEvent extends Event {
  /**
   * Position-specific event data
   */
  payload: object;
}

/**
 * Specialized event interface for optimization-related events
 */
export interface OptimizationEvent extends Event {
  /**
   * Optimization-specific event data
   */
  payload: object;
}

/**
 * Specialized event interface for gamification-related events
 */
export interface GamificationEvent extends Event {
  /**
   * Gamification-specific event data
   */
  payload: object;
}

/**
 * Specialized event interface for market intelligence events
 */
export interface MarketEvent extends Event {
  /**
   * Market-specific event data
   */
  payload: object;
}

/**
 * Specialized event interface for notification events
 */
export interface NotificationEvent extends Event {
  /**
   * Notification-specific event data
   */
  payload: object;
}

/**
 * Specialized event interface for geofence-related events
 */
export interface GeofenceEvent extends Event {
  /**
   * Geofence-specific event data
   */
  payload: object;
}

/**
 * Interface for event producers to standardize event production
 * Implementations will handle the actual delivery to the messaging system
 */
export interface EventProducer {
  /**
   * Produces an event to the messaging system
   * @param event The event to produce
   * @returns Promise that resolves when the event is produced
   */
  produceEvent(event: Event): Promise<void>;
}

/**
 * Interface for event consumers to standardize event consumption
 * Implementations will handle receiving events from the messaging system
 */
export interface EventConsumer {
  /**
   * Consumes an event from the messaging system
   * @param event The event to consume
   * @returns Promise that resolves when the event is consumed
   */
  consumeEvent(event: Event): Promise<void>;
}

/**
 * Type definition for event handler functions
 * Used to register handlers for specific event types
 * 
 * @param event The event to handle
 * @returns Promise that resolves when the event is handled
 */
export type EventHandler = (event: Event) => Promise<void>;