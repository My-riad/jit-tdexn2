import { ThunkAction, ThunkDispatch } from 'redux-thunk'; // ^2.4.2
import { Position, EntityPosition } from '../../../common/interfaces/tracking.interface';
import { BonusZone } from '../../../common/interfaces/gamification.interface';
import { trackingApi } from '../../../common/api/trackingApi';
import { gamificationApi } from '../../../common/api/gamificationApi';
import { MapViewport } from '../../utils/mapUtils';

/**
 * Enum for map action types
 */
export enum MapActionTypes {
  UPDATE_MAP_VIEWPORT = 'UPDATE_MAP_VIEWPORT',
  SET_MAP_CENTER = 'SET_MAP_CENTER',
  SET_MAP_ZOOM = 'SET_MAP_ZOOM',
  TOGGLE_MAP_LAYER = 'TOGGLE_MAP_LAYER',
  FETCH_NEARBY_DRIVERS_REQUEST = 'FETCH_NEARBY_DRIVERS_REQUEST',
  FETCH_NEARBY_DRIVERS_SUCCESS = 'FETCH_NEARBY_DRIVERS_SUCCESS',
  FETCH_NEARBY_DRIVERS_FAILURE = 'FETCH_NEARBY_DRIVERS_FAILURE',
  FETCH_SMART_HUBS_REQUEST = 'FETCH_SMART_HUBS_REQUEST',
  FETCH_SMART_HUBS_SUCCESS = 'FETCH_SMART_HUBS_SUCCESS',
  FETCH_SMART_HUBS_FAILURE = 'FETCH_SMART_HUBS_FAILURE',
  FETCH_BONUS_ZONES_REQUEST = 'FETCH_BONUS_ZONES_REQUEST',
  FETCH_BONUS_ZONES_SUCCESS = 'FETCH_BONUS_ZONES_SUCCESS',
  FETCH_BONUS_ZONES_FAILURE = 'FETCH_BONUS_ZONES_FAILURE',
  FETCH_ROUTE_REQUEST = 'FETCH_ROUTE_REQUEST',
  FETCH_ROUTE_SUCCESS = 'FETCH_ROUTE_SUCCESS',
  FETCH_ROUTE_FAILURE = 'FETCH_ROUTE_FAILURE',
  CALCULATE_ETA_REQUEST = 'CALCULATE_ETA_REQUEST',
  CALCULATE_ETA_SUCCESS = 'CALCULATE_ETA_SUCCESS',
  CALCULATE_ETA_FAILURE = 'CALCULATE_ETA_FAILURE',
  SET_MAP_MODE = 'SET_MAP_MODE',
  SET_FOLLOW_MODE = 'SET_FOLLOW_MODE',
  CLEAR_ROUTE = 'CLEAR_ROUTE',
}

/**
 * Interface for map action objects
 */
export interface UpdateMapViewportAction {
  type: typeof MapActionTypes.UPDATE_MAP_VIEWPORT;
  payload: MapViewport;
}

export interface SetMapCenterAction {
  type: typeof MapActionTypes.SET_MAP_CENTER;
  payload: { latitude: number; longitude: number };
}

export interface SetMapZoomAction {
  type: typeof MapActionTypes.SET_MAP_ZOOM;
  payload: number;
}

export interface ToggleMapLayerAction {
  type: typeof MapActionTypes.TOGGLE_MAP_LAYER;
  payload: { layerId: string; visible: boolean };
}

export interface FetchNearbyDriversRequestAction {
  type: typeof MapActionTypes.FETCH_NEARBY_DRIVERS_REQUEST;
}

export interface FetchNearbyDriversSuccessAction {
  type: typeof MapActionTypes.FETCH_NEARBY_DRIVERS_SUCCESS;
  payload: EntityPosition[];
}

export interface FetchNearbyDriversFailureAction {
  type: typeof MapActionTypes.FETCH_NEARBY_DRIVERS_FAILURE;
  payload: string;
}

export interface FetchSmartHubsRequestAction {
  type: typeof MapActionTypes.FETCH_SMART_HUBS_REQUEST;
}

export interface FetchSmartHubsSuccessAction {
  type: typeof MapActionTypes.FETCH_SMART_HUBS_SUCCESS;
  payload: any[];
}

export interface FetchSmartHubsFailureAction {
  type: typeof MapActionTypes.FETCH_SMART_HUBS_FAILURE;
  payload: string;
}

export interface FetchBonusZonesRequestAction {
  type: typeof MapActionTypes.FETCH_BONUS_ZONES_REQUEST;
}

export interface FetchBonusZonesSuccessAction {
  type: typeof MapActionTypes.FETCH_BONUS_ZONES_SUCCESS;
  payload: BonusZone[];
}

export interface FetchBonusZonesFailureAction {
  type: typeof MapActionTypes.FETCH_BONUS_ZONES_FAILURE;
  payload: string;
}

export interface FetchRouteRequestAction {
  type: typeof MapActionTypes.FETCH_ROUTE_REQUEST;
}

export interface FetchRouteSuccessAction {
  type: typeof MapActionTypes.FETCH_ROUTE_SUCCESS;
  payload: Position[];
}

export interface FetchRouteFailureAction {
  type: typeof MapActionTypes.FETCH_ROUTE_FAILURE;
  payload: string;
}

export interface CalculateETARequestAction {
  type: typeof MapActionTypes.CALCULATE_ETA_REQUEST;
}

export interface CalculateETASuccessAction {
  type: typeof MapActionTypes.CALCULATE_ETA_SUCCESS;
  payload: any;
}

export interface CalculateETAFailureAction {
  type: typeof MapActionTypes.CALCULATE_ETA_FAILURE;
  payload: string;
}

export interface SetMapModeAction {
  type: typeof MapActionTypes.SET_MAP_MODE;
  payload: string;
}

export interface SetFollowModeAction {
  type: typeof MapActionTypes.SET_FOLLOW_MODE;
  payload: boolean;
}

export interface ClearRouteAction {
  type: typeof MapActionTypes.CLEAR_ROUTE;
}

export type MapAction =
  | UpdateMapViewportAction
  | SetMapCenterAction
  | SetMapZoomAction
  | ToggleMapLayerAction
  | FetchNearbyDriversRequestAction
  | FetchNearbyDriversSuccessAction
  | FetchNearbyDriversFailureAction
  | FetchSmartHubsRequestAction
  | FetchSmartHubsSuccessAction
  | FetchSmartHubsFailureAction
  | FetchBonusZonesRequestAction
  | FetchBonusZonesSuccessAction
  | FetchBonusZonesFailureAction
  | FetchRouteRequestAction
  | FetchRouteSuccessAction
  | FetchRouteFailureAction
  | CalculateETARequestAction
  | CalculateETASuccessAction
  | CalculateETAFailureAction
  | SetMapModeAction
  | SetFollowModeAction
  | ClearRouteAction;

/**
 * Action creator for updating the map viewport settings
 * @param viewport New viewport settings
 * @returns Action object with type and payload
 */
export const updateMapViewport = (viewport: MapViewport): MapAction => ({
  type: MapActionTypes.UPDATE_MAP_VIEWPORT,
  payload: viewport,
});

/**
 * Action creator for setting the map center coordinates
 * @param latitude 
 * @param longitude 
 * @returns Action object with type and payload
 */
export const setMapCenter = (latitude: number, longitude: number): MapAction => ({
  type: MapActionTypes.SET_MAP_CENTER,
  payload: { latitude, longitude },
});

/**
 * Action creator for setting the map zoom level
 * @param zoom 
 * @returns Action object with type and payload
 */
export const setMapZoom = (zoom: number): MapAction => ({
  type: MapActionTypes.SET_MAP_ZOOM,
  payload: zoom,
});

/**
 * Action creator for toggling the visibility of a map layer
 * @param layerId 
 * @param visible 
 * @returns Action object with type and payload
 */
export const toggleMapLayer = (layerId: string, visible: boolean): MapAction => ({
  type: MapActionTypes.TOGGLE_MAP_LAYER,
  payload: { layerId, visible },
});

/**
 * Define RootState type
 */
export type RootState = any;

/**
 * Async action creator for fetching nearby drivers
 * @param latitude 
 * @param longitude 
 * @param radius 
 * @returns Thunk action that returns a Promise
 */
export const fetchNearbyDrivers = (
  latitude: number,
  longitude: number,
  radius: number
): ThunkAction<Promise<void>, RootState, unknown, MapAction> => {
  return async (dispatch: ThunkDispatch<RootState, unknown, MapAction>) => {
    dispatch({ type: MapActionTypes.FETCH_NEARBY_DRIVERS_REQUEST });
    try {
      const drivers = await trackingApi.findNearbyEntities({
        latitude,
        longitude,
        radius,
        entityType: 'driver',
      });
      dispatch({
        type: MapActionTypes.FETCH_NEARBY_DRIVERS_SUCCESS,
        payload: drivers,
      });
    } catch (error: any) {
      dispatch({
        type: MapActionTypes.FETCH_NEARBY_DRIVERS_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Async action creator for fetching nearby Smart Hubs
 * @param latitude 
 * @param longitude 
 * @param radius 
 * @returns Thunk action that returns a Promise
 */
export const fetchNearbySmartHubs = (
  latitude: number,
  longitude: number,
  radius: number
): ThunkAction<Promise<void>, RootState, unknown, MapAction> => {
  return async (dispatch: ThunkDispatch<RootState, unknown, MapAction>) => {
    dispatch({ type: MapActionTypes.FETCH_SMART_HUBS_REQUEST });
    try {
      const smartHubs = await trackingApi.findNearbyEntities({
        latitude,
        longitude,
        radius,
        entityType: 'smart_hub',
      });
      dispatch({
        type: MapActionTypes.FETCH_SMART_HUBS_SUCCESS,
        payload: smartHubs,
      });
    } catch (error: any) {
      dispatch({
        type: MapActionTypes.FETCH_SMART_HUBS_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Async action creator for fetching bonus zones
 * @param latitude 
 * @param longitude 
 * @param radius 
 * @returns Thunk action that returns a Promise
 */
export const fetchBonusZones = (
  latitude: number,
  longitude: number,
  radius: number
): ThunkAction<Promise<void>, RootState, unknown, MapAction> => {
  return async (dispatch: ThunkDispatch<RootState, unknown, MapAction>) => {
    dispatch({ type: MapActionTypes.FETCH_BONUS_ZONES_REQUEST });
    try {
      const bonusZones = await gamificationApi.getBonusZonesInRadius(latitude, longitude, radius);
      dispatch({
        type: MapActionTypes.FETCH_BONUS_ZONES_SUCCESS,
        payload: bonusZones,
      });
    } catch (error: any) {
      dispatch({
        type: MapActionTypes.FETCH_BONUS_ZONES_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Async action creator for fetching a route between two points
 * @param origin 
 * @param destination 
 * @param options 
 * @returns Thunk action that returns a Promise
 */
export const fetchRoute = (
  origin: Position,
  destination: Position,
  options: any
): ThunkAction<Promise<void>, RootState, unknown, MapAction> => {
  return async (dispatch: ThunkDispatch<RootState, unknown, MapAction>) => {
    dispatch({ type: MapActionTypes.FETCH_ROUTE_REQUEST });
    try {
      const route = await trackingApi.getTrajectory(
        origin.latitude.toString(),
        origin.longitude.toString(),
        destination.latitude.toString(),
        destination.longitude.toString(),
        options
      );
      dispatch({
        type: MapActionTypes.FETCH_ROUTE_SUCCESS,
        payload: [origin, ...route, destination],
      });
    } catch (error: any) {
      dispatch({
        type: MapActionTypes.FETCH_ROUTE_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Async action creator for calculating estimated time of arrival
 * @param entityId 
 * @param destination 
 * @param routePoints 
 * @param options 
 * @returns Thunk action that returns a Promise
 */
export const calculateETA = (
  entityId: string,
  destination: Position,
  routePoints: Position[],
  options: any
): ThunkAction<Promise<void>, RootState, unknown, MapAction> => {
  return async (dispatch: ThunkDispatch<RootState, unknown, MapAction>) => {
    dispatch({ type: MapActionTypes.CALCULATE_ETA_REQUEST });
    try {
      const eta = await trackingApi.getETAWithRouteInfo({
        entityId,
        entityType: 'driver', // Assuming entity is always a driver
        destinationLatitude: destination.latitude,
        destinationLongitude: destination.longitude,
        routePoints,
        options,
      });
      dispatch({
        type: MapActionTypes.CALCULATE_ETA_SUCCESS,
        payload: eta,
      });
    } catch (error: any) {
      dispatch({
        type: MapActionTypes.CALCULATE_ETA_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Action creator for setting the map display mode
 * @param mode 
 * @returns Action object with type and payload
 */
export const setMapMode = (mode: string): MapAction => ({
  type: MapActionTypes.SET_MAP_MODE,
  payload: mode,
});

/**
 * Action creator for setting whether the map should follow the driver's position
 * @param enabled 
 * @returns Action object with type and payload
 */
export const setFollowMode = (enabled: boolean): MapAction => ({
  type: MapActionTypes.SET_FOLLOW_MODE,
  payload: enabled,
});

/**
 * Action creator for clearing the current route data
 * @returns Action object with type
 */
export const clearRoute = (): MapAction => ({
  type: MapActionTypes.CLEAR_ROUTE,
});

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  MapAction
>;