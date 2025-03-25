/**
 * Tracking Interfaces
 * 
 * This file defines TypeScript interfaces for the tracking functionality in the freight optimization platform.
 * These interfaces are used for real-time position tracking, geofence management, historical position data,
 * and ETA calculations. They provide type safety for the tracking API and ensure consistent data structures
 * between frontend and backend components.
 */

/**
 * Defines the types of entities that can be tracked in the system
 */
export enum EntityType {
  DRIVER = 'driver',
  VEHICLE = 'vehicle',
  LOAD = 'load',
  SMART_HUB = 'smart_hub'
}

/**
 * Defines the sources of position data in the system
 */
export enum PositionSource {
  MOBILE_APP = 'mobile_app',
  ELD = 'eld',
  GPS_DEVICE = 'gps_device',
  MANUAL = 'manual'
}

/**
 * Defines the types of geofences that can be created in the system
 */
export enum GeofenceType {
  CIRCLE = 'circle',
  POLYGON = 'polygon',
  CORRIDOR = 'corridor'
}

/**
 * Defines the types of events that can occur when an entity interacts with a geofence
 */
export enum GeofenceEventType {
  ENTER = 'enter',
  EXIT = 'exit',
  DWELL = 'dwell'
}

/**
 * Defines the structure of position data for tracked entities
 */
export interface Position {
  /**
   * Latitude coordinate in decimal degrees
   */
  latitude: number;
  
  /**
   * Longitude coordinate in decimal degrees
   */
  longitude: number;
  
  /**
   * Heading in degrees (0-359, where 0 is North)
   */
  heading: number;
  
  /**
   * Speed in miles per hour
   */
  speed: number;
  
  /**
   * Position accuracy in meters
   */
  accuracy: number;
  
  /**
   * ISO timestamp when position was recorded
   */
  timestamp: string;
  
  /**
   * Source of the position data
   */
  source: PositionSource;
}

/**
 * Associates position data with a specific entity
 */
export interface EntityPosition {
  /**
   * Unique identifier for the entity
   */
  entityId: string;
  
  /**
   * Type of entity (driver, vehicle, load, etc.)
   */
  entityType: EntityType;
  
  /**
   * Current position information
   */
  position: Position;
  
  /**
   * Additional metadata about the entity position
   */
  metadata?: Record<string, any>;
}

/**
 * Defines the structure for updating an entity's position
 */
export interface PositionUpdate {
  /**
   * Unique identifier for the entity
   */
  entityId: string;
  
  /**
   * Type of entity (driver, vehicle, load, etc.)
   */
  entityType: EntityType;
  
  /**
   * Latitude coordinate in decimal degrees
   */
  latitude: number;
  
  /**
   * Longitude coordinate in decimal degrees
   */
  longitude: number;
  
  /**
   * Heading in degrees (0-359, where 0 is North)
   */
  heading: number;
  
  /**
   * Speed in miles per hour
   */
  speed: number;
  
  /**
   * Position accuracy in meters
   */
  accuracy: number;
  
  /**
   * Source of the position data
   */
  source: PositionSource;
  
  /**
   * ISO timestamp when position was recorded
   */
  timestamp: string;
}

/**
 * Defines the structure of historical position data for tracked entities
 */
export interface HistoricalPosition {
  /**
   * Unique identifier for the position record
   */
  positionId: string;
  
  /**
   * Unique identifier for the entity
   */
  entityId: string;
  
  /**
   * Type of entity (driver, vehicle, load, etc.)
   */
  entityType: EntityType;
  
  /**
   * Latitude coordinate in decimal degrees
   */
  latitude: number;
  
  /**
   * Longitude coordinate in decimal degrees
   */
  longitude: number;
  
  /**
   * Heading in degrees (0-359, where 0 is North)
   */
  heading: number;
  
  /**
   * Speed in miles per hour
   */
  speed: number;
  
  /**
   * Position accuracy in meters
   */
  accuracy: number;
  
  /**
   * Source of the position data
   */
  source: PositionSource;
  
  /**
   * ISO timestamp when position was recorded
   */
  recordedAt: string;
}

/**
 * Defines the structure of a simplified trajectory response for visualization
 */
export interface TrajectoryResponse {
  /**
   * Unique identifier for the entity
   */
  entityId: string;
  
  /**
   * Type of entity (driver, vehicle, load, etc.)
   */
  entityType: EntityType;
  
  /**
   * ISO timestamp of the start of the trajectory period
   */
  startTime: string;
  
  /**
   * ISO timestamp of the end of the trajectory period
   */
  endTime: string;
  
  /**
   * Tolerance value used for simplification algorithm (in meters)
   */
  simplificationTolerance: number;
  
  /**
   * GeoJSON LineString representing the simplified trajectory
   */
  trajectory: {
    type: string;
    coordinates: Array<[number, number]>;
  };
  
  /**
   * Number of points in the original trajectory
   */
  originalPointCount: number;
  
  /**
   * Number of points in the simplified trajectory
   */
  simplifiedPointCount: number;
}

/**
 * Defines parameters for querying entities near a specific location
 */
export interface NearbyQuery {
  /**
   * Latitude coordinate of the center point
   */
  latitude: number;
  
  /**
   * Longitude coordinate of the center point
   */
  longitude: number;
  
  /**
   * Search radius in miles
   */
  radius: number;
  
  /**
   * Type of entities to find (optional, if not specified will return all types)
   */
  entityType?: EntityType;
  
  /**
   * Maximum number of results to return
   */
  limit?: number;
}

/**
 * Defines the structure of a geofence for detecting when entities enter or exit geographic areas
 */
export interface Geofence {
  /**
   * Unique identifier for the geofence
   */
  geofenceId: string;
  
  /**
   * Human-readable name for the geofence
   */
  name: string;
  
  /**
   * Optional description of the geofence purpose
   */
  description?: string;
  
  /**
   * Type of geofence (circle, polygon, corridor)
   */
  geofenceType: GeofenceType;
  
  /**
   * Type of entity this geofence applies to (optional)
   */
  entityType?: EntityType;
  
  /**
   * Specific entity ID this geofence applies to (optional)
   */
  entityId?: string;
  
  /**
   * Center latitude for circular geofences
   */
  centerLatitude?: number;
  
  /**
   * Center longitude for circular geofences
   */
  centerLongitude?: number;
  
  /**
   * Radius in miles for circular geofences
   */
  radius?: number;
  
  /**
   * Array of coordinates for polygon and corridor geofences
   */
  coordinates?: Array<{latitude: number, longitude: number}>;
  
  /**
   * Width in miles for corridor geofences
   */
  corridorWidth?: number;
  
  /**
   * Additional metadata for the geofence
   */
  metadata?: Record<string, any>;
  
  /**
   * Whether the geofence is currently active
   */
  active: boolean;
  
  /**
   * ISO timestamp when the geofence becomes active (optional)
   */
  startDate?: string;
  
  /**
   * ISO timestamp when the geofence expires (optional)
   */
  endDate?: string;
  
  /**
   * ISO timestamp when the geofence was created
   */
  createdAt: string;
}

/**
 * Defines the structure of events generated when entities interact with geofences
 */
export interface GeofenceEvent {
  /**
   * Unique identifier for the event
   */
  eventId: string;
  
  /**
   * Identifier of the geofence that triggered the event
   */
  geofenceId: string;
  
  /**
   * Identifier of the entity that triggered the event
   */
  entityId: string;
  
  /**
   * Type of entity that triggered the event
   */
  entityType: EntityType;
  
  /**
   * Type of event (enter, exit, dwell)
   */
  eventType: GeofenceEventType;
  
  /**
   * Latitude where the event occurred
   */
  latitude: number;
  
  /**
   * Longitude where the event occurred
   */
  longitude: number;
  
  /**
   * ISO timestamp when the event occurred
   */
  timestamp: string;
  
  /**
   * Additional metadata about the event
   */
  metadata?: Record<string, any>;
}

/**
 * Defines the parameters for requesting an ETA calculation
 */
export interface ETARequest {
  /**
   * Unique identifier for the entity
   */
  entityId: string;
  
  /**
   * Type of entity (driver, vehicle, load)
   */
  entityType: EntityType;
  
  /**
   * Destination latitude
   */
  destinationLatitude: number;
  
  /**
   * Destination longitude
   */
  destinationLongitude: number;
  
  /**
   * Optional route points to consider in the calculation
   */
  routePoints?: Array<{latitude: number, longitude: number}>;
  
  /**
   * Additional options for the ETA calculation
   */
  options?: {
    /**
     * Consider traffic in the calculation
     */
    considerTraffic?: boolean;
    
    /**
     * Consider weather in the calculation
     */
    considerWeather?: boolean;
    
    /**
     * Consider historical driver patterns
     */
    considerDriverPatterns?: boolean;
    
    /**
     * Consider hours of service constraints
     */
    considerHOS?: boolean;
  };
}

/**
 * Defines the structure of an ETA calculation response
 */
export interface ETAResponse {
  /**
   * Unique identifier for the entity
   */
  entityId: string;
  
  /**
   * Type of entity (driver, vehicle, load)
   */
  entityType: EntityType;
  
  /**
   * Destination latitude
   */
  destinationLatitude: number;
  
  /**
   * Destination longitude
   */
  destinationLongitude: number;
  
  /**
   * ISO timestamp of the estimated arrival time
   */
  estimatedArrivalTime: string;
  
  /**
   * Confidence level of the ETA (0-100)
   */
  confidenceLevel: number;
  
  /**
   * Remaining distance in miles
   */
  remainingDistance: number;
  
  /**
   * Remaining time in minutes
   */
  remainingTimeMinutes: number;
  
  /**
   * Average speed used in the calculation (mph)
   */
  averageSpeed: number;
  
  /**
   * Factors that influenced the ETA calculation
   */
  factors?: {
    /**
     * Traffic impact (in minutes)
     */
    trafficImpact?: number;
    
    /**
     * Weather impact (in minutes)
     */
    weatherImpact?: number;
    
    /**
     * Required rest time (in minutes)
     */
    requiredRestTime?: number;
    
    /**
     * Other delay factors
     */
    otherDelays?: Record<string, number>;
  };
  
  /**
   * ISO timestamp when the ETA was calculated
   */
  calculatedAt: string;
}