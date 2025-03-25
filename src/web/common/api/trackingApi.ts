/**
 * API client module for interacting with the tracking service of the AI-driven 
 * Freight Optimization Platform. Provides functions for position tracking, ETA 
 * calculations, geofence management, and historical position data retrieval.
 * This module is used by the driver mobile app, carrier portal, and shipper portal
 * to access real-time tracking functionality.
 */

import apiClient from './apiClient';
import { 
  getEndpointWithParams, 
  TRACKING_ENDPOINTS 
} from '../constants/endpoints';
import {
  EntityType,
  PositionUpdate,
  Position,
  EntityPosition,
  HistoricalPosition,
  NearbyQuery,
  TrajectoryResponse,
  ETARequest,
  ETAResponse,
  Geofence,
  GeofenceEvent,
  GeofenceType,
  GeofenceEventType
} from '../interfaces/tracking.interface';
import { handleApiError } from '../utils/errorHandlers';

/**
 * Updates the position of an entity (driver, vehicle, or load)
 * @param positionUpdate Position update data
 * @returns The updated entity position
 */
export const updatePosition = async (
  positionUpdate: PositionUpdate
): Promise<EntityPosition> => {
  try {
    const response = await apiClient.post(
      TRACKING_ENDPOINTS.POSITIONS,
      positionUpdate
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates positions for multiple entities in a single request
 * @param positionUpdates Array of position update data
 * @returns Array of updated entity positions
 */
export const bulkUpdatePositions = async (
  positionUpdates: PositionUpdate[]
): Promise<EntityPosition[]> => {
  try {
    const response = await apiClient.post(
      `${TRACKING_ENDPOINTS.POSITIONS}/bulk`,
      positionUpdates
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets the current position for a specific entity
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity (driver, vehicle, or load)
 * @returns The current position of the entity
 */
export const getCurrentPosition = async (
  entityId: string,
  entityType: EntityType
): Promise<EntityPosition> => {
  try {
    const response = await apiClient.get(TRACKING_ENDPOINTS.POSITIONS, {
      params: { entityId, entityType }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets historical positions for an entity within a time range
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity (driver, vehicle, or load)
 * @param options Options for filtering historical positions
 * @returns Array of historical positions
 */
export const getPositionHistory = async (
  entityId: string,
  entityType: EntityType,
  options: {
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<HistoricalPosition[]> => {
  try {
    const response = await apiClient.get(TRACKING_ENDPOINTS.HISTORY, {
      params: {
        entityId,
        entityType,
        ...options
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets a simplified trajectory for an entity within a time range
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity (driver, vehicle, or load)
 * @param options Options for trajectory generation
 * @returns Simplified trajectory data
 */
export const getTrajectory = async (
  entityId: string,
  entityType: EntityType,
  options: {
    startTime?: string;
    endTime?: string;
    simplificationTolerance?: number;
  } = {}
): Promise<TrajectoryResponse> => {
  try {
    const response = await apiClient.get(`${TRACKING_ENDPOINTS.HISTORY}/trajectory`, {
      params: {
        entityId,
        entityType,
        ...options
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Finds entities near a specific location
 * @param query Parameters for the nearby search
 * @returns Array of nearby entity positions
 */
export const findNearbyEntities = async (
  query: NearbyQuery
): Promise<EntityPosition[]> => {
  try {
    const response = await apiClient.get(TRACKING_ENDPOINTS.NEARBY, {
      params: query
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Calculates the total distance traveled by an entity within a time range
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity (driver, vehicle, or load)
 * @param startTime Start time in ISO format
 * @param endTime End time in ISO format
 * @returns Total distance in kilometers
 */
export const calculateTraveledDistance = async (
  entityId: string,
  entityType: EntityType,
  startTime: string,
  endTime: string
): Promise<{ distance: number }> => {
  try {
    const response = await apiClient.get(`${TRACKING_ENDPOINTS.POSITIONS}/distance`, {
      params: {
        entityId,
        entityType,
        startTime,
        endTime
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Calculates the average speed of an entity within a time range
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity (driver, vehicle, or load)
 * @param startTime Start time in ISO format
 * @param endTime End time in ISO format
 * @returns Average speed in kilometers per hour
 */
export const calculateAverageSpeed = async (
  entityId: string,
  entityType: EntityType,
  startTime: string,
  endTime: string
): Promise<{ speed: number }> => {
  try {
    const response = await apiClient.get(`${TRACKING_ENDPOINTS.POSITIONS}/speed`, {
      params: {
        entityId,
        entityType,
        startTime,
        endTime
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets the estimated time of arrival for an entity to a destination
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity (driver, vehicle, or load)
 * @param destinationLatitude Destination latitude
 * @param destinationLongitude Destination longitude
 * @param options Additional options for ETA calculation
 * @returns ETA calculation result
 */
export const getETA = async (
  entityId: string,
  entityType: EntityType,
  destinationLatitude: number,
  destinationLongitude: number,
  options: {
    considerTraffic?: boolean;
    considerWeather?: boolean;
    considerDriverPatterns?: boolean;
    considerHOS?: boolean;
  } = {}
): Promise<ETAResponse> => {
  try {
    const response = await apiClient.get(TRACKING_ENDPOINTS.ETA, {
      params: {
        entityId,
        entityType,
        destinationLatitude,
        destinationLongitude,
        ...options
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets the estimated time of arrival using actual route information
 * @param request ETA request with route information
 * @returns ETA calculation result
 */
export const getETAWithRouteInfo = async (
  request: ETARequest
): Promise<ETAResponse> => {
  try {
    const response = await apiClient.post(`${TRACKING_ENDPOINTS.ETA}/route`, request);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets ETAs for multiple entities to the same destination
 * @param entityIds Array of entity IDs
 * @param entityType Type of entities
 * @param destinationLatitude Destination latitude
 * @param destinationLongitude Destination longitude
 * @param options Additional options for ETA calculation
 * @returns Array of ETA calculation results
 */
export const getETAForMultipleEntities = async (
  entityIds: string[],
  entityType: EntityType,
  destinationLatitude: number,
  destinationLongitude: number,
  options: {
    considerTraffic?: boolean;
    considerWeather?: boolean;
    considerDriverPatterns?: boolean;
    considerHOS?: boolean;
  } = {}
): Promise<ETAResponse[]> => {
  try {
    const response = await apiClient.post(`${TRACKING_ENDPOINTS.ETA}/multiple-entities`, {
      entityIds,
      entityType,
      destinationLatitude,
      destinationLongitude,
      ...options
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets the remaining distance to a destination for an entity
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity (driver, vehicle, or load)
 * @param destinationLatitude Destination latitude
 * @param destinationLongitude Destination longitude
 * @returns Remaining distance in kilometers
 */
export const getRemainingDistance = async (
  entityId: string,
  entityType: EntityType,
  destinationLatitude: number,
  destinationLongitude: number
): Promise<{ distance: number }> => {
  try {
    const response = await apiClient.get(`${TRACKING_ENDPOINTS.ETA}/distance`, {
      params: {
        entityId,
        entityType,
        destinationLatitude,
        destinationLongitude
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Creates a new geofence
 * @param geofence Geofence data (without geofenceId and createdAt)
 * @returns The created geofence
 */
export const createGeofence = async (
  geofence: Omit<Geofence, 'geofenceId' | 'createdAt'>
): Promise<Geofence> => {
  try {
    const response = await apiClient.post(TRACKING_ENDPOINTS.GEOFENCES, geofence);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets a specific geofence by ID
 * @param geofenceId Unique identifier of the geofence
 * @returns The requested geofence
 */
export const getGeofence = async (
  geofenceId: string
): Promise<Geofence> => {
  try {
    const endpoint = getEndpointWithParams(
      `${TRACKING_ENDPOINTS.GEOFENCES}/:geofenceId`,
      { geofenceId }
    );
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates an existing geofence
 * @param geofenceId Unique identifier of the geofence
 * @param geofence Geofence data to update
 * @returns The updated geofence
 */
export const updateGeofence = async (
  geofenceId: string,
  geofence: Partial<Omit<Geofence, 'geofenceId' | 'createdAt'>>
): Promise<Geofence> => {
  try {
    const endpoint = getEndpointWithParams(
      `${TRACKING_ENDPOINTS.GEOFENCES}/:geofenceId`,
      { geofenceId }
    );
    const response = await apiClient.put(endpoint, geofence);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Deletes a geofence
 * @param geofenceId Unique identifier of the geofence
 */
export const deleteGeofence = async (
  geofenceId: string
): Promise<void> => {
  try {
    const endpoint = getEndpointWithParams(
      `${TRACKING_ENDPOINTS.GEOFENCES}/:geofenceId`,
      { geofenceId }
    );
    await apiClient.delete(endpoint);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets geofences associated with a specific entity
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity
 * @param activeOnly Whether to return only active geofences
 * @returns Array of geofences
 */
export const getGeofencesByEntity = async (
  entityId: string,
  entityType: EntityType,
  activeOnly: boolean = true
): Promise<Geofence[]> => {
  try {
    const endpoint = getEndpointWithParams(
      `${TRACKING_ENDPOINTS.GEOFENCES}/entity/:entityId`,
      { entityId }
    );
    const response = await apiClient.get(endpoint, {
      params: {
        entityType,
        activeOnly
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Finds geofences near a specific location
 * @param latitude Latitude of the center point
 * @param longitude Longitude of the center point
 * @param radius Search radius in kilometers
 * @param options Additional options for filtering
 * @returns Array of nearby geofences
 */
export const getNearbyGeofences = async (
  latitude: number,
  longitude: number,
  radius: number,
  options: {
    entityType?: EntityType;
    activeOnly?: boolean;
    limit?: number;
  } = {}
): Promise<Geofence[]> => {
  try {
    const response = await apiClient.get(`${TRACKING_ENDPOINTS.GEOFENCES}/nearby`, {
      params: {
        latitude,
        longitude,
        radius,
        ...options
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets events for a specific geofence
 * @param geofenceId Unique identifier of the geofence
 * @param options Options for filtering events
 * @returns Array of geofence events
 */
export const getGeofenceEvents = async (
  geofenceId: string,
  options: {
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
    eventType?: GeofenceEventType;
  } = {}
): Promise<GeofenceEvent[]> => {
  try {
    const endpoint = getEndpointWithParams(
      `${TRACKING_ENDPOINTS.GEOFENCES}/:geofenceId/events`,
      { geofenceId }
    );
    const response = await apiClient.get(endpoint, {
      params: options
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets geofence events for a specific entity
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity
 * @param options Options for filtering events
 * @returns Array of geofence events
 */
export const getGeofenceEventsByEntity = async (
  entityId: string,
  entityType: EntityType,
  options: {
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
    eventType?: GeofenceEventType;
  } = {}
): Promise<GeofenceEvent[]> => {
  try {
    const endpoint = getEndpointWithParams(
      `${TRACKING_ENDPOINTS.GEOFENCE_EVENTS}/entity/:entityId`,
      { entityId }
    );
    const response = await apiClient.get(endpoint, {
      params: {
        entityType,
        ...options
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};