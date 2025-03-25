import { AnyAction } from 'redux';
import { DriverActionTypes } from '../actions/driverActions';
import {
  Driver,
  DriverWithDetails,
  DriverSummary,
  DriverAvailability,
  DriverHOS,
  DriverPreference,
  DriverScore,
  DriverPerformanceMetrics,
  DriverStatus
} from '../../../common/interfaces/driver.interface';

/**
 * Interface defining the shape of the driver state in the Redux store
 */
export interface DriverState {
  // Data fields
  drivers: DriverSummary[];
  driverDetail: DriverWithDetails | null;
  driversByStatus: Record<string, DriverSummary[]>;
  topDrivers: DriverSummary[];
  availability: DriverAvailability | null;
  hosRecords: DriverHOS[];
  preferences: DriverPreference[];
  score: DriverScore | null;
  performanceMetrics: DriverPerformanceMetrics | null;
  leaderboard: { entries: any[], total: number };
  validationResult: { eligible: boolean, reasons?: string[] } | null;
  
  // Loading status flags
  loading: boolean;
  loadingDetail: boolean;
  loadingByStatus: Record<string, boolean>;
  loadingTopDrivers: boolean;
  loadingAvailability: boolean;
  loadingHOS: boolean;
  loadingPreferences: boolean;
  loadingScore: boolean;
  loadingPerformance: boolean;
  loadingLeaderboard: boolean;
  validating: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  updatingAvailability: boolean;
  updatingPreference: boolean;
  assigningVehicle: boolean;
  unassigningVehicle: boolean;
  searching: boolean;
  
  // Error fields
  error: string | null;
  detailError: string | null;
  errorsByStatus: Record<string, string | null>;
  topDriversError: string | null;
  availabilityError: string | null;
  hosError: string | null;
  preferencesError: string | null;
  scoreError: string | null;
  performanceError: string | null;
  leaderboardError: string | null;
  validationError: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  availabilityUpdateError: string | null;
  preferenceUpdateError: string | null;
  vehicleAssignmentError: string | null;
  vehicleUnassignmentError: string | null;
  searchError: string | null;
  
  // Pagination data
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  
  // Search results
  searchResults: {
    drivers: DriverSummary[];
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Initial state for the driver reducer
 */
export const initialState: DriverState = {
  // Data fields
  drivers: [],
  driverDetail: null,
  driversByStatus: {},
  topDrivers: [],
  availability: null,
  hosRecords: [],
  preferences: [],
  score: null,
  performanceMetrics: null,
  leaderboard: { entries: [], total: 0 },
  validationResult: null,
  
  // Loading status flags
  loading: false,
  loadingDetail: false,
  loadingByStatus: {},
  loadingTopDrivers: false,
  loadingAvailability: false,
  loadingHOS: false,
  loadingPreferences: false,
  loadingScore: false,
  loadingPerformance: false,
  loadingLeaderboard: false,
  validating: false,
  creating: false,
  updating: false,
  deleting: false,
  updatingAvailability: false,
  updatingPreference: false,
  assigningVehicle: false,
  unassigningVehicle: false,
  searching: false,
  
  // Error fields
  error: null,
  detailError: null,
  errorsByStatus: {},
  topDriversError: null,
  availabilityError: null,
  hosError: null,
  preferencesError: null,
  scoreError: null,
  performanceError: null,
  leaderboardError: null,
  validationError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  availabilityUpdateError: null,
  preferenceUpdateError: null,
  vehicleAssignmentError: null,
  vehicleUnassignmentError: null,
  searchError: null,
  
  // Pagination data
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
  },
  
  // Search results
  searchResults: {
    drivers: [],
    total: 0,
    page: 1,
    limit: 10,
  },
};

/**
 * Redux reducer function for managing driver state
 * 
 * @param state - Current state, defaults to initialState
 * @param action - Action to process
 * @returns Updated state based on the action
 */
const driverReducer = (state = initialState, action: AnyAction): DriverState => {
  switch (action.type) {
    // Fetch drivers
    case DriverActionTypes.FETCH_DRIVERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case DriverActionTypes.FETCH_DRIVERS_SUCCESS:
      return {
        ...state,
        drivers: action.payload.drivers,
        pagination: {
          ...state.pagination,
          total: action.payload.total,
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
        },
        loading: false,
      };
    case DriverActionTypes.FETCH_DRIVERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Fetch driver detail
    case DriverActionTypes.FETCH_DRIVER_DETAIL_REQUEST:
      return {
        ...state,
        loadingDetail: true,
        detailError: null,
      };
    case DriverActionTypes.FETCH_DRIVER_DETAIL_SUCCESS:
      return {
        ...state,
        driverDetail: action.payload,
        loadingDetail: false,
      };
    case DriverActionTypes.FETCH_DRIVER_DETAIL_FAILURE:
      return {
        ...state,
        loadingDetail: false,
        detailError: action.payload,
      };

    // Create driver
    case DriverActionTypes.CREATE_DRIVER_REQUEST:
      return {
        ...state,
        creating: true,
        createError: null,
      };
    case DriverActionTypes.CREATE_DRIVER_SUCCESS:
      return {
        ...state,
        drivers: [...state.drivers, action.payload],
        creating: false,
      };
    case DriverActionTypes.CREATE_DRIVER_FAILURE:
      return {
        ...state,
        creating: false,
        createError: action.payload,
      };

    // Update driver
    case DriverActionTypes.UPDATE_DRIVER_REQUEST:
      return {
        ...state,
        updating: true,
        updateError: null,
      };
    case DriverActionTypes.UPDATE_DRIVER_SUCCESS: {
      const updatedDriver = action.payload;
      return {
        ...state,
        drivers: state.drivers.map(driver => 
          driver.id === updatedDriver.id ? { ...driver, ...updatedDriver } : driver
        ),
        driverDetail: state.driverDetail && state.driverDetail.id === updatedDriver.id
          ? { ...state.driverDetail, ...updatedDriver }
          : state.driverDetail,
        updating: false,
      };
    }
    case DriverActionTypes.UPDATE_DRIVER_FAILURE:
      return {
        ...state,
        updating: false,
        updateError: action.payload,
      };

    // Delete driver
    case DriverActionTypes.DELETE_DRIVER_REQUEST:
      return {
        ...state,
        deleting: true,
        deleteError: null,
      };
    case DriverActionTypes.DELETE_DRIVER_SUCCESS: {
      const deletedDriverId = action.payload;
      return {
        ...state,
        drivers: state.drivers.filter(driver => driver.id !== deletedDriverId),
        driverDetail: state.driverDetail && state.driverDetail.id === deletedDriverId
          ? null
          : state.driverDetail,
        deleting: false,
      };
    }
    case DriverActionTypes.DELETE_DRIVER_FAILURE:
      return {
        ...state,
        deleting: false,
        deleteError: action.payload,
      };

    // Update driver availability
    case DriverActionTypes.UPDATE_DRIVER_AVAILABILITY_REQUEST:
      return {
        ...state,
        updatingAvailability: true,
        availabilityUpdateError: null,
      };
    case DriverActionTypes.UPDATE_DRIVER_AVAILABILITY_SUCCESS:
      return {
        ...state,
        availability: action.payload,
        updatingAvailability: false,
      };
    case DriverActionTypes.UPDATE_DRIVER_AVAILABILITY_FAILURE:
      return {
        ...state,
        updatingAvailability: false,
        availabilityUpdateError: action.payload,
      };

    // Fetch driver availability
    case DriverActionTypes.FETCH_DRIVER_AVAILABILITY_REQUEST:
      return {
        ...state,
        loadingAvailability: true,
        availabilityError: null,
      };
    case DriverActionTypes.FETCH_DRIVER_AVAILABILITY_SUCCESS:
      return {
        ...state,
        availability: action.payload,
        loadingAvailability: false,
      };
    case DriverActionTypes.FETCH_DRIVER_AVAILABILITY_FAILURE:
      return {
        ...state,
        loadingAvailability: false,
        availabilityError: action.payload,
      };

    // Fetch driver HOS
    case DriverActionTypes.FETCH_DRIVER_HOS_REQUEST:
      return {
        ...state,
        loadingHOS: true,
        hosError: null,
      };
    case DriverActionTypes.FETCH_DRIVER_HOS_SUCCESS:
      return {
        ...state,
        hosRecords: action.payload,
        loadingHOS: false,
      };
    case DriverActionTypes.FETCH_DRIVER_HOS_FAILURE:
      return {
        ...state,
        loadingHOS: false,
        hosError: action.payload,
      };

    // Fetch driver preferences
    case DriverActionTypes.FETCH_DRIVER_PREFERENCES_REQUEST:
      return {
        ...state,
        loadingPreferences: true,
        preferencesError: null,
      };
    case DriverActionTypes.FETCH_DRIVER_PREFERENCES_SUCCESS:
      return {
        ...state,
        preferences: action.payload,
        loadingPreferences: false,
      };
    case DriverActionTypes.FETCH_DRIVER_PREFERENCES_FAILURE:
      return {
        ...state,
        loadingPreferences: false,
        preferencesError: action.payload,
      };

    // Update driver preference
    case DriverActionTypes.UPDATE_DRIVER_PREFERENCE_REQUEST:
      return {
        ...state,
        updatingPreference: true,
        preferenceUpdateError: null,
      };
    case DriverActionTypes.UPDATE_DRIVER_PREFERENCE_SUCCESS: {
      const updatedPreference = action.payload;
      return {
        ...state,
        preferences: state.preferences.map(preference => 
          preference.id === updatedPreference.id ? updatedPreference : preference
        ),
        updatingPreference: false,
      };
    }
    case DriverActionTypes.UPDATE_DRIVER_PREFERENCE_FAILURE:
      return {
        ...state,
        updatingPreference: false,
        preferenceUpdateError: action.payload,
      };

    // Fetch driver score
    case DriverActionTypes.FETCH_DRIVER_SCORE_REQUEST:
      return {
        ...state,
        loadingScore: true,
        scoreError: null,
      };
    case DriverActionTypes.FETCH_DRIVER_SCORE_SUCCESS:
      return {
        ...state,
        score: action.payload,
        loadingScore: false,
      };
    case DriverActionTypes.FETCH_DRIVER_SCORE_FAILURE:
      return {
        ...state,
        loadingScore: false,
        scoreError: action.payload,
      };

    // Fetch driver performance
    case DriverActionTypes.FETCH_DRIVER_PERFORMANCE_REQUEST:
      return {
        ...state,
        loadingPerformance: true,
        performanceError: null,
      };
    case DriverActionTypes.FETCH_DRIVER_PERFORMANCE_SUCCESS:
      return {
        ...state,
        performanceMetrics: action.payload,
        loadingPerformance: false,
      };
    case DriverActionTypes.FETCH_DRIVER_PERFORMANCE_FAILURE:
      return {
        ...state,
        loadingPerformance: false,
        performanceError: action.payload,
      };

    // Fetch driver leaderboard
    case DriverActionTypes.FETCH_DRIVER_LEADERBOARD_REQUEST:
      return {
        ...state,
        loadingLeaderboard: true,
        leaderboardError: null,
      };
    case DriverActionTypes.FETCH_DRIVER_LEADERBOARD_SUCCESS:
      return {
        ...state,
        leaderboard: action.payload,
        loadingLeaderboard: false,
      };
    case DriverActionTypes.FETCH_DRIVER_LEADERBOARD_FAILURE:
      return {
        ...state,
        loadingLeaderboard: false,
        leaderboardError: action.payload,
      };

    // Fetch drivers by status
    case DriverActionTypes.FETCH_DRIVERS_BY_STATUS_REQUEST: {
      const { status } = action.payload;
      return {
        ...state,
        loadingByStatus: {
          ...state.loadingByStatus,
          [status]: true,
        },
        errorsByStatus: {
          ...state.errorsByStatus,
          [status]: null,
        },
      };
    }
    case DriverActionTypes.FETCH_DRIVERS_BY_STATUS_SUCCESS: {
      const { status, drivers } = action.payload;
      return {
        ...state,
        driversByStatus: {
          ...state.driversByStatus,
          [status]: drivers,
        },
        loadingByStatus: {
          ...state.loadingByStatus,
          [status]: false,
        },
      };
    }
    case DriverActionTypes.FETCH_DRIVERS_BY_STATUS_FAILURE: {
      const { status, error } = action.payload;
      return {
        ...state,
        loadingByStatus: {
          ...state.loadingByStatus,
          [status]: false,
        },
        errorsByStatus: {
          ...state.errorsByStatus,
          [status]: error,
        },
      };
    }

    // Fetch top drivers
    case DriverActionTypes.FETCH_TOP_DRIVERS_REQUEST:
      return {
        ...state,
        loadingTopDrivers: true,
        topDriversError: null,
      };
    case DriverActionTypes.FETCH_TOP_DRIVERS_SUCCESS:
      return {
        ...state,
        topDrivers: action.payload.drivers,
        loadingTopDrivers: false,
      };
    case DriverActionTypes.FETCH_TOP_DRIVERS_FAILURE:
      return {
        ...state,
        loadingTopDrivers: false,
        topDriversError: action.payload,
      };

    // Assign vehicle
    case DriverActionTypes.ASSIGN_VEHICLE_REQUEST:
      return {
        ...state,
        assigningVehicle: true,
        vehicleAssignmentError: null,
      };
    case DriverActionTypes.ASSIGN_VEHICLE_SUCCESS: {
      const updatedDriver = action.payload;
      return {
        ...state,
        drivers: state.drivers.map(driver => 
          driver.id === updatedDriver.id ? { ...driver, currentVehicleId: updatedDriver.currentVehicleId } : driver
        ),
        driverDetail: state.driverDetail && state.driverDetail.id === updatedDriver.id
          ? { ...state.driverDetail, currentVehicleId: updatedDriver.currentVehicleId }
          : state.driverDetail,
        assigningVehicle: false,
      };
    }
    case DriverActionTypes.ASSIGN_VEHICLE_FAILURE:
      return {
        ...state,
        assigningVehicle: false,
        vehicleAssignmentError: action.payload,
      };

    // Unassign vehicle
    case DriverActionTypes.UNASSIGN_VEHICLE_REQUEST:
      return {
        ...state,
        unassigningVehicle: true,
        vehicleUnassignmentError: null,
      };
    case DriverActionTypes.UNASSIGN_VEHICLE_SUCCESS: {
      const updatedDriver = action.payload;
      return {
        ...state,
        drivers: state.drivers.map(driver => 
          driver.id === updatedDriver.id ? { ...driver, currentVehicleId: undefined } : driver
        ),
        driverDetail: state.driverDetail && state.driverDetail.id === updatedDriver.id
          ? { ...state.driverDetail, currentVehicleId: undefined }
          : state.driverDetail,
        unassigningVehicle: false,
      };
    }
    case DriverActionTypes.UNASSIGN_VEHICLE_FAILURE:
      return {
        ...state,
        unassigningVehicle: false,
        vehicleUnassignmentError: action.payload,
      };

    // Search drivers
    case DriverActionTypes.SEARCH_DRIVERS_REQUEST:
      return {
        ...state,
        searching: true,
        searchError: null,
      };
    case DriverActionTypes.SEARCH_DRIVERS_SUCCESS:
      return {
        ...state,
        searchResults: {
          drivers: action.payload.drivers,
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit,
        },
        searching: false,
      };
    case DriverActionTypes.SEARCH_DRIVERS_FAILURE:
      return {
        ...state,
        searching: false,
        searchError: action.payload,
      };

    // Validate driver for load
    case DriverActionTypes.VALIDATE_DRIVER_FOR_LOAD_REQUEST:
      return {
        ...state,
        validating: true,
        validationError: null,
        validationResult: null,
      };
    case DriverActionTypes.VALIDATE_DRIVER_FOR_LOAD_SUCCESS:
      return {
        ...state,
        validationResult: action.payload,
        validating: false,
      };
    case DriverActionTypes.VALIDATE_DRIVER_FOR_LOAD_FAILURE:
      return {
        ...state,
        validating: false,
        validationError: action.payload,
      };

    default:
      return state;
  }
};

export default driverReducer;