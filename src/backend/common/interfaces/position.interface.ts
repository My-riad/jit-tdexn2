/**
 * Position Interfaces and Types
 * 
 * This file defines the core interfaces and types for position data
 * used throughout the freight optimization platform. These interfaces
 * standardize the data structures for real-time position tracking,
 * historical position data, and geospatial queries.
 */

/**
 * Types of entities that can be tracked in the system
 */
export enum EntityType {
  DRIVER = 'driver',
  VEHICLE = 'vehicle',
  LOAD = 'load',
  SMART_HUB = 'smart_hub'
}

/**
 * Sources of position data in the system
 */
export enum PositionSource {
  MOBILE_APP = 'mobile_app',
  ELD = 'eld',
  GPS_DEVICE = 'gps_device',
  MANUAL = 'manual',
  SYSTEM = 'system'
}

/**
 * Core structure of position data
 */
export interface Position {
  /** Latitude in decimal degrees */
  latitude: number;
  
  /** Longitude in decimal degrees */
  longitude: number;
  
  /** Heading in degrees (0-359, 0 = North, 90 = East, etc.) */
  heading: number;
  
  /** Speed in miles per hour */
  speed: number;
  
  /** Position accuracy in meters */
  accuracy: number;
  
  /** Source of the position data */
  source: PositionSource;
  
  /** Timestamp when the position was recorded */
  timestamp: Date;
}

/**
 * Associates position data with a specific entity
 */
export interface EntityPosition {
  /** Unique identifier of the entity */
  entity_id: string;
  
  /** Type of the entity */
  entity_type: EntityType;
  
  /** Position data of the entity */
  position: Position;
}

/**
 * Structure for incoming position updates
 */
export interface PositionUpdate {
  /** Unique identifier of the entity */
  entity_id: string;
  
  /** Type of the entity */
  entity_type: EntityType;
  
  /** Latitude in decimal degrees */
  latitude: number;
  
  /** Longitude in decimal degrees */
  longitude: number;
  
  /** Heading in degrees (0-359, 0 = North, 90 = East, etc.) */
  heading: number;
  
  /** Speed in miles per hour */
  speed: number;
  
  /** Position accuracy in meters */
  accuracy: number;
  
  /** Source of the position data */
  source: PositionSource;
  
  /** Timestamp when the position was recorded */
  timestamp: Date;
}

/**
 * Structure for historical position records
 */
export interface HistoricalPosition {
  /** Unique identifier for this position record */
  position_id: string;
  
  /** Unique identifier of the entity */
  entity_id: string;
  
  /** Type of the entity */
  entity_type: EntityType;
  
  /** Latitude in decimal degrees */
  latitude: number;
  
  /** Longitude in decimal degrees */
  longitude: number;
  
  /** Heading in degrees (0-359, 0 = North, 90 = East, etc.) */
  heading: number;
  
  /** Speed in miles per hour */
  speed: number;
  
  /** Position accuracy in meters */
  accuracy: number;
  
  /** Source of the position data */
  source: PositionSource;
  
  /** Timestamp when the position was stored in the database */
  recorded_at: Date;
}

/**
 * Parameters for querying entities near a specific location
 */
export interface NearbyQuery {
  /** Latitude of the center point in decimal degrees */
  latitude: number;
  
  /** Longitude of the center point in decimal degrees */
  longitude: number;
  
  /** Search radius in miles */
  radius: number;
  
  /** Type of entities to search for (optional - all types if not specified) */
  entity_type: EntityType;
  
  /** Maximum number of results to return */
  limit: number;
}

/**
 * Structure for position events published to the event bus
 */
export interface PositionEvent {
  /** Unique identifier of the entity */
  entity_id: string;
  
  /** Type of the entity */
  entity_type: EntityType;
  
  /** Position data */
  position: Position;
  
  /** Timestamp when the event was generated */
  event_time: Date;
}