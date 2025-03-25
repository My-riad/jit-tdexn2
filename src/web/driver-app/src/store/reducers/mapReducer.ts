import { MapActionTypes, MapAction } from '../actions/mapActions'; // Import action type constants for map-related Redux actions
import { MapViewport } from '../../utils/mapUtils'; // Import MapViewport interface for type definitions
import { Position, EntityPosition } from '../../../common/interfaces/tracking.interface'; // Import Position interface for type definitions
import { BonusZone } from '../../../common/interfaces/gamification.interface'; // Import BonusZone interface for type definitions

/**
 * Interface defining the shape of the map state in the Redux store
 */
export interface MapState {
  /**
   * Current map viewport settings (center, zoom, bounds, etc.)
   */
  viewport: MapViewport;
  /**
   * Map of layer IDs to visibility flags
   */
  layers: Record<string, boolean>;
  /**
   * Array of nearby driver positions
   */
  nearbyDrivers: EntityPosition[];
  /**
   * Array of Smart Hub data
   */
  smartHubs: any[];
  /**
   * Array of bonus zone data
   */
  bonusZones: BonusZone[];
  /**
   * Array of route points
   */
  route: Position[];
  /**
   * Estimated time of arrival data
   */
  eta: any;
  /**
   * Current map display mode (standard, satellite, terrain)
   */
  mapMode: string;
  /**
   * Whether the map should follow the driver's position
   */
  followMode: boolean;
  /**
   * Map of loading states for different operations
   */
  loading: Record<string, boolean>;
  /**
   * Map of error messages for different operations
   */
  errors: Record<string, string | null>;
}

/**
 * Initial state for the map reducer
 */
const initialState: MapState = {
  viewport: {
    center: { longitude: -95.7129, latitude: 37.0902 }, // Default center: USA
    zoom: 4, // Default zoom level
  },
  layers: {
    drivers: true,
    smartHubs: true,
    bonusZones: true,
    route: true,
  },
  nearbyDrivers: [],
  smartHubs: [],
  bonusZones: [],
  route: [],
  eta: null,
  mapMode: 'standard',
  followMode: false,
  loading: {
    nearbyDrivers: false,
    smartHubs: false,
    bonusZones: false,
    route: false,
    eta: false,
  },
  errors: {
    nearbyDrivers: null,
    smartHubs: null,
    bonusZones: null,
    route: null,
    eta: null,
  },
};

/**
 * Redux reducer function for handling map-related state updates
 * @param {MapState | undefined} state - Current state (or initial state if undefined)
 * @param {MapAction} action - Redux action to process
 * @returns {MapState} Updated state based on the action
 */
export const mapReducer = (state: MapState = initialState, action: MapAction): MapState => {
  // Use switch statement to handle different action types
  switch (action.type) {
    // For UPDATE_MAP_VIEWPORT, update viewport settings
    case MapActionTypes.UPDATE_MAP_VIEWPORT:
      return {
        ...state,
        viewport: {
          ...state.viewport,
          ...action.payload,
        },
      };
    // For SET_MAP_CENTER, update center coordinates in viewport
    case MapActionTypes.SET_MAP_CENTER:
      return {
        ...state,
        viewport: {
          ...state.viewport,
          center: action.payload,
        },
      };
    // For SET_MAP_ZOOM, update zoom level in viewport
    case MapActionTypes.SET_MAP_ZOOM:
      return {
        ...state,
        viewport: {
          ...state.viewport,
          zoom: action.payload,
        },
      };
    // For TOGGLE_MAP_LAYER, update layer visibility settings
    case MapActionTypes.TOGGLE_MAP_LAYER:
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.payload.layerId]: action.payload.visible,
        },
      };
    // For FETCH_NEARBY_DRIVERS_REQUEST, set loading state
    case MapActionTypes.FETCH_NEARBY_DRIVERS_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          nearbyDrivers: true,
        },
        errors: {
          ...state.errors,
          nearbyDrivers: null,
        },
      };
    // For FETCH_NEARBY_DRIVERS_SUCCESS, update nearby drivers data
    case MapActionTypes.FETCH_NEARBY_DRIVERS_SUCCESS:
      return {
        ...state,
        nearbyDrivers: action.payload,
        loading: {
          ...state.loading,
          nearbyDrivers: false,
        },
      };
    // For FETCH_NEARBY_DRIVERS_FAILURE, set error state
    case MapActionTypes.FETCH_NEARBY_DRIVERS_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          nearbyDrivers: false,
        },
        errors: {
          ...state.errors,
          nearbyDrivers: action.payload,
        },
      };
    // For FETCH_SMART_HUBS_REQUEST, set loading state
    case MapActionTypes.FETCH_SMART_HUBS_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          smartHubs: true,
        },
        errors: {
          ...state.errors,
          smartHubs: null,
        },
      };
    // For FETCH_SMART_HUBS_SUCCESS, update Smart Hubs data
    case MapActionTypes.FETCH_SMART_HUBS_SUCCESS:
      return {
        ...state,
        smartHubs: action.payload,
        loading: {
          ...state.loading,
          smartHubs: false,
        },
      };
    // For FETCH_SMART_HUBS_FAILURE, set error state
    case MapActionTypes.FETCH_SMART_HUBS_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          smartHubs: false,
        },
        errors: {
          ...state.errors,
          smartHubs: action.payload,
        },
      };
    // For FETCH_BONUS_ZONES_REQUEST, set loading state
    case MapActionTypes.FETCH_BONUS_ZONES_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          bonusZones: true,
        },
        errors: {
          ...state.errors,
          bonusZones: null,
        },
      };
    // For FETCH_BONUS_ZONES_SUCCESS, update bonus zones data
    case MapActionTypes.FETCH_BONUS_ZONES_SUCCESS:
      return {
        ...state,
        bonusZones: action.payload,
        loading: {
          ...state.loading,
          bonusZones: false,
        },
      };
    // For FETCH_BONUS_ZONES_FAILURE, set error state
    case MapActionTypes.FETCH_BONUS_ZONES_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          bonusZones: false,
        },
        errors: {
          ...state.errors,
          bonusZones: action.payload,
        },
      };
    // For FETCH_ROUTE_REQUEST, set loading state
    case MapActionTypes.FETCH_ROUTE_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          route: true,
        },
        errors: {
          ...state.errors,
          route: null,
        },
      };
    // For FETCH_ROUTE_SUCCESS, update route data
    case MapActionTypes.FETCH_ROUTE_SUCCESS:
      return {
        ...state,
        route: action.payload,
        loading: {
          ...state.loading,
          route: false,
        },
      };
    // For FETCH_ROUTE_FAILURE, set error state
    case MapActionTypes.FETCH_ROUTE_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          route: false,
        },
        errors: {
          ...state.errors,
          route: action.payload,
        },
      };
    // For CALCULATE_ETA_REQUEST, set loading state
    case MapActionTypes.CALCULATE_ETA_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          eta: true,
        },
        errors: {
          ...state.errors,
          eta: null,
        },
      };
    // For CALCULATE_ETA_SUCCESS, update ETA data
    case MapActionTypes.CALCULATE_ETA_SUCCESS:
      return {
        ...state,
        eta: action.payload,
        loading: {
          ...state.loading,
          eta: false,
        },
      };
    // For CALCULATE_ETA_FAILURE, set error state
    case MapActionTypes.CALCULATE_ETA_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          eta: false,
        },
        errors: {
          ...state.errors,
          eta: action.payload,
        },
      };
    // For SET_MAP_MODE, update map mode
    case MapActionTypes.SET_MAP_MODE:
      return {
        ...state,
        mapMode: action.payload,
      };
    // For SET_FOLLOW_MODE, update follow mode setting
    case MapActionTypes.SET_FOLLOW_MODE:
      return {
        ...state,
        followMode: action.payload,
      };
      // For CLEAR_ROUTE, clear route data
    case MapActionTypes.CLEAR_ROUTE:
      return {
        ...state,
        route: [],
      };
    // Return unchanged state for unknown action types
    default:
      return state;
  }
};

// Export the map reducer function for use in the Redux store
export default mapReducer;