import { createAction } from '@reduxjs/toolkit'; // ^1.9.5
import {
  EntityType,
  Position,
  EntityPosition,
  HistoricalPosition,
  NearbyQuery,
  Geofence,
  GeofenceEvent,
  ETARequest,
  ETAResponse,
  TrajectoryResponse
} from '../../../common/interfaces/tracking.interface';

/**
 * Redux action types for tracking-related functionality
 */
export const TRACKING_ACTION_TYPES = {
  // Current position actions
  FETCH_CURRENT_POSITION_REQUEST: 'tracking/fetchCurrentPosition/request',
  FETCH_CURRENT_POSITION_SUCCESS: 'tracking/fetchCurrentPosition/success',
  FETCH_CURRENT_POSITION_FAILURE: 'tracking/fetchCurrentPosition/failure',

  // Position history actions
  FETCH_POSITION_HISTORY_REQUEST: 'tracking/fetchPositionHistory/request',
  FETCH_POSITION_HISTORY_SUCCESS: 'tracking/fetchPositionHistory/success',
  FETCH_POSITION_HISTORY_FAILURE: 'tracking/fetchPositionHistory/failure',

  // Trajectory actions
  FETCH_TRAJECTORY_REQUEST: 'tracking/fetchTrajectory/request',
  FETCH_TRAJECTORY_SUCCESS: 'tracking/fetchTrajectory/success',
  FETCH_TRAJECTORY_FAILURE: 'tracking/fetchTrajectory/failure',

  // Nearby entities actions
  FIND_NEARBY_ENTITIES_REQUEST: 'tracking/findNearbyEntities/request',
  FIND_NEARBY_ENTITIES_SUCCESS: 'tracking/findNearbyEntities/success',
  FIND_NEARBY_ENTITIES_FAILURE: 'tracking/findNearbyEntities/failure',

  // ETA actions
  FETCH_ETA_REQUEST: 'tracking/fetchETA/request',
  FETCH_ETA_SUCCESS: 'tracking/fetchETA/success',
  FETCH_ETA_FAILURE: 'tracking/fetchETA/failure',

  // Geofence CRUD actions
  CREATE_GEOFENCE_REQUEST: 'tracking/createGeofence/request',
  CREATE_GEOFENCE_SUCCESS: 'tracking/createGeofence/success',
  CREATE_GEOFENCE_FAILURE: 'tracking/createGeofence/failure',

  UPDATE_GEOFENCE_REQUEST: 'tracking/updateGeofence/request',
  UPDATE_GEOFENCE_SUCCESS: 'tracking/updateGeofence/success',
  UPDATE_GEOFENCE_FAILURE: 'tracking/updateGeofence/failure',

  DELETE_GEOFENCE_REQUEST: 'tracking/deleteGeofence/request',
  DELETE_GEOFENCE_SUCCESS: 'tracking/deleteGeofence/success',
  DELETE_GEOFENCE_FAILURE: 'tracking/deleteGeofence/failure',

  FETCH_GEOFENCE_REQUEST: 'tracking/fetchGeofence/request',
  FETCH_GEOFENCE_SUCCESS: 'tracking/fetchGeofence/success',
  FETCH_GEOFENCE_FAILURE: 'tracking/fetchGeofence/failure',

  FETCH_GEOFENCES_BY_ENTITY_REQUEST: 'tracking/fetchGeofencesByEntity/request',
  FETCH_GEOFENCES_BY_ENTITY_SUCCESS: 'tracking/fetchGeofencesByEntity/success',
  FETCH_GEOFENCES_BY_ENTITY_FAILURE: 'tracking/fetchGeofencesByEntity/failure',

  FETCH_NEARBY_GEOFENCES_REQUEST: 'tracking/fetchNearbyGeofences/request',
  FETCH_NEARBY_GEOFENCES_SUCCESS: 'tracking/fetchNearbyGeofences/success',
  FETCH_NEARBY_GEOFENCES_FAILURE: 'tracking/fetchNearbyGeofences/failure',

  FETCH_GEOFENCE_EVENTS_REQUEST: 'tracking/fetchGeofenceEvents/request',
  FETCH_GEOFENCE_EVENTS_SUCCESS: 'tracking/fetchGeofenceEvents/success',
  FETCH_GEOFENCE_EVENTS_FAILURE: 'tracking/fetchGeofenceEvents/failure',

  // Analytics actions
  FETCH_TRAVELED_DISTANCE_REQUEST: 'tracking/fetchTraveledDistance/request',
  FETCH_TRAVELED_DISTANCE_SUCCESS: 'tracking/fetchTraveledDistance/success',
  FETCH_TRAVELED_DISTANCE_FAILURE: 'tracking/fetchTraveledDistance/failure',

  FETCH_AVERAGE_SPEED_REQUEST: 'tracking/fetchAverageSpeed/request',
  FETCH_AVERAGE_SPEED_SUCCESS: 'tracking/fetchAverageSpeed/success',
  FETCH_AVERAGE_SPEED_FAILURE: 'tracking/fetchAverageSpeed/failure',

  // Real-time updates
  START_POSITION_UPDATES: 'tracking/startPositionUpdates',
  STOP_POSITION_UPDATES: 'tracking/stopPositionUpdates',
  RECEIVE_POSITION_UPDATE: 'tracking/receivePositionUpdate',

  // Geofence events
  START_GEOFENCE_EVENTS: 'tracking/startGeofenceEvents',
  STOP_GEOFENCE_EVENTS: 'tracking/stopGeofenceEvents',
  RECEIVE_GEOFENCE_EVENT: 'tracking/receiveGeofenceEvent',

  // Cache management
  CLEAR_TRACKING_CACHE: 'tracking/clearCache'
};

/**
 * Request the current position of an entity
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 * @param bypassCache Optional flag to bypass cache and fetch fresh data
 */
export const fetchCurrentPosition = createAction(
  TRACKING_ACTION_TYPES.FETCH_CURRENT_POSITION_REQUEST,
  (entityId: string, entityType: EntityType, bypassCache?: boolean) => ({
    payload: { entityId, entityType, bypassCache }
  })
);

/**
 * Request position history for an entity within a specific time range
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 * @param startTime ISO timestamp of the start of the history period
 * @param endTime ISO timestamp of the end of the history period
 * @param options Additional options for the history request
 */
export const fetchPositionHistory = createAction(
  TRACKING_ACTION_TYPES.FETCH_POSITION_HISTORY_REQUEST,
  (entityId: string, entityType: EntityType, startTime: string, endTime: string, options?: any) => ({
    payload: { entityId, entityType, startTime, endTime, options }
  })
);

/**
 * Request trajectory data for an entity (simplified path for visualization)
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 * @param startTime ISO timestamp of the start of the trajectory period
 * @param endTime ISO timestamp of the end of the trajectory period
 * @param simplificationTolerance Optional tolerance in meters for simplifying the path
 * @param bypassCache Optional flag to bypass cache and fetch fresh data
 */
export const fetchTrajectory = createAction(
  TRACKING_ACTION_TYPES.FETCH_TRAJECTORY_REQUEST,
  (
    entityId: string,
    entityType: EntityType,
    startTime: string,
    endTime: string,
    simplificationTolerance?: number,
    bypassCache?: boolean
  ) => ({
    payload: { entityId, entityType, startTime, endTime, simplificationTolerance, bypassCache }
  })
);

/**
 * Find entities near a specific location
 * @param query The query parameters including coordinates, radius, and filters
 */
export const findNearbyEntities = createAction(
  TRACKING_ACTION_TYPES.FIND_NEARBY_ENTITIES_REQUEST,
  (query: NearbyQuery) => ({
    payload: query
  })
);

/**
 * Request estimated time of arrival (ETA) for an entity to a destination
 * @param request The ETA request parameters
 * @param bypassCache Optional flag to bypass cache and recalculate ETA
 */
export const fetchETA = createAction(
  TRACKING_ACTION_TYPES.FETCH_ETA_REQUEST,
  (request: ETARequest, bypassCache?: boolean) => ({
    payload: { request, bypassCache }
  })
);

/**
 * Create a new geofence
 * @param geofence The geofence data (without ID and creation timestamp)
 */
export const createGeofence = createAction(
  TRACKING_ACTION_TYPES.CREATE_GEOFENCE_REQUEST,
  (geofence: Omit<Geofence, 'geofenceId' | 'createdAt'>) => ({
    payload: geofence
  })
);

/**
 * Update an existing geofence
 * @param geofenceId The ID of the geofence to update
 * @param geofence The partial geofence data to update
 */
export const updateGeofence = createAction(
  TRACKING_ACTION_TYPES.UPDATE_GEOFENCE_REQUEST,
  (geofenceId: string, geofence: Partial<Omit<Geofence, 'geofenceId' | 'createdAt'>>) => ({
    payload: { geofenceId, geofence }
  })
);

/**
 * Delete a geofence
 * @param geofenceId The ID of the geofence to delete
 */
export const deleteGeofence = createAction(
  TRACKING_ACTION_TYPES.DELETE_GEOFENCE_REQUEST,
  (geofenceId: string) => ({
    payload: geofenceId
  })
);

/**
 * Fetch a specific geofence by ID
 * @param geofenceId The ID of the geofence to fetch
 * @param bypassCache Optional flag to bypass cache and fetch fresh data
 */
export const fetchGeofence = createAction(
  TRACKING_ACTION_TYPES.FETCH_GEOFENCE_REQUEST,
  (geofenceId: string, bypassCache?: boolean) => ({
    payload: { geofenceId, bypassCache }
  })
);

/**
 * Fetch geofences associated with a specific entity
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 * @param activeOnly Optional flag to fetch only active geofences
 * @param bypassCache Optional flag to bypass cache and fetch fresh data
 */
export const fetchGeofencesByEntity = createAction(
  TRACKING_ACTION_TYPES.FETCH_GEOFENCES_BY_ENTITY_REQUEST,
  (entityId: string, entityType: EntityType, activeOnly?: boolean, bypassCache?: boolean) => ({
    payload: { entityId, entityType, activeOnly, bypassCache }
  })
);

/**
 * Fetch geofences near a specific location
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @param radius The search radius in miles
 * @param options Additional options for filtering geofences
 */
export const fetchNearbyGeofences = createAction(
  TRACKING_ACTION_TYPES.FETCH_NEARBY_GEOFENCES_REQUEST,
  (latitude: number, longitude: number, radius: number, options?: any) => ({
    payload: { latitude, longitude, radius, options }
  })
);

/**
 * Fetch geofence events for a specific entity
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 * @param options Additional options for filtering events
 */
export const fetchGeofenceEvents = createAction(
  TRACKING_ACTION_TYPES.FETCH_GEOFENCE_EVENTS_REQUEST,
  (entityId: string, entityType: EntityType, options?: any) => ({
    payload: { entityId, entityType, options }
  })
);

/**
 * Fetch the total distance traveled by an entity within a time period
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 * @param startTime ISO timestamp of the start of the period
 * @param endTime ISO timestamp of the end of the period
 */
export const fetchTraveledDistance = createAction(
  TRACKING_ACTION_TYPES.FETCH_TRAVELED_DISTANCE_REQUEST,
  (entityId: string, entityType: EntityType, startTime: string, endTime: string) => ({
    payload: { entityId, entityType, startTime, endTime }
  })
);

/**
 * Fetch the average speed of an entity within a time period
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 * @param startTime ISO timestamp of the start of the period
 * @param endTime ISO timestamp of the end of the period
 */
export const fetchAverageSpeed = createAction(
  TRACKING_ACTION_TYPES.FETCH_AVERAGE_SPEED_REQUEST,
  (entityId: string, entityType: EntityType, startTime: string, endTime: string) => ({
    payload: { entityId, entityType, startTime, endTime }
  })
);

/**
 * Start receiving real-time position updates for an entity
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 */
export const startPositionUpdates = createAction(
  TRACKING_ACTION_TYPES.START_POSITION_UPDATES,
  (entityId: string, entityType: EntityType) => ({
    payload: { entityId, entityType }
  })
);

/**
 * Stop receiving real-time position updates for an entity
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 */
export const stopPositionUpdates = createAction(
  TRACKING_ACTION_TYPES.STOP_POSITION_UPDATES,
  (entityId: string, entityType: EntityType) => ({
    payload: { entityId, entityType }
  })
);

/**
 * Handle a received real-time position update
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 * @param position The new position data
 */
export const receivePositionUpdate = createAction(
  TRACKING_ACTION_TYPES.RECEIVE_POSITION_UPDATE,
  (entityId: string, entityType: EntityType, position: Position) => ({
    payload: { entityId, entityType, position }
  })
);

/**
 * Start receiving real-time geofence events for an entity
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 */
export const startGeofenceEvents = createAction(
  TRACKING_ACTION_TYPES.START_GEOFENCE_EVENTS,
  (entityId: string, entityType: EntityType) => ({
    payload: { entityId, entityType }
  })
);

/**
 * Stop receiving real-time geofence events for an entity
 * @param entityId The ID of the entity
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 */
export const stopGeofenceEvents = createAction(
  TRACKING_ACTION_TYPES.STOP_GEOFENCE_EVENTS,
  (entityId: string, entityType: EntityType) => ({
    payload: { entityId, entityType }
  })
);

/**
 * Handle a received real-time geofence event
 * @param event The geofence event data
 */
export const receiveGeofenceEvent = createAction(
  TRACKING_ACTION_TYPES.RECEIVE_GEOFENCE_EVENT,
  (event: GeofenceEvent) => ({
    payload: event
  })
);

/**
 * Clear all tracking-related cache data
 */
export const clearTrackingCache = createAction(
  TRACKING_ACTION_TYPES.CLEAR_TRACKING_CACHE
);