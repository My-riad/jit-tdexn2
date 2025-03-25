import { AnyAction } from 'redux';
import { 
  Carrier, 
  CarrierSummary, 
  CarrierPerformanceMetrics, 
  CarrierRecommendation, 
  CarrierNetworkStatistics 
} from '../../../common/interfaces/carrier.interface';
import { Driver } from '../../../common/interfaces/driver.interface';
import { Vehicle } from '../../../common/interfaces/vehicle.interface';
import * as actionTypes from '../actions/carrierActions';

/**
 * Interface defining the structure of the carrier state in the Redux store
 */
interface CarrierState {
  // Loading states for various carrier operations
  loading: boolean;
  loadingDetail: boolean;
  loadingDrivers: boolean;
  loadingVehicles: boolean;
  loadingPerformance: boolean;
  loadingSummary: boolean;
  loadingRecommendations: boolean;
  loadingNetworkStats: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Data states
  carriers: Array<CarrierSummary>;
  selectedCarrier: Carrier | null;
  drivers: Array<Driver>;
  vehicles: Array<Vehicle>;
  performanceMetrics: CarrierPerformanceMetrics | null;
  carrierSummary: CarrierSummary | null;
  recommendations: Array<CarrierRecommendation>;
  networkStats: CarrierNetworkStatistics | null;
  
  // Pagination
  totalCarriers: number;
  currentPage: number;
  pageSize: number;
  
  // Error states
  error: Error | null;
  detailError: Error | null;
  driversError: Error | null;
  vehiclesError: Error | null;
  performanceError: Error | null;
  summaryError: Error | null;
  recommendationsError: Error | null;
  networkStatsError: Error | null;
  createError: Error | null;
  updateError: Error | null;
  deleteError: Error | null;
}

/**
 * Initial state for the carrier reducer
 */
const initialState: CarrierState = {
  // Loading states
  loading: false,
  loadingDetail: false,
  loadingDrivers: false,
  loadingVehicles: false,
  loadingPerformance: false,
  loadingSummary: false,
  loadingRecommendations: false,
  loadingNetworkStats: false,
  creating: false,
  updating: false,
  deleting: false,
  
  // Data states
  carriers: [],
  selectedCarrier: null,
  drivers: [],
  vehicles: [],
  performanceMetrics: null,
  carrierSummary: null,
  recommendations: [],
  networkStats: null,
  
  // Pagination
  totalCarriers: 0,
  currentPage: 1,
  pageSize: 10,
  
  // Error states
  error: null,
  detailError: null,
  driversError: null,
  vehiclesError: null,
  performanceError: null,
  summaryError: null,
  recommendationsError: null,
  networkStatsError: null,
  createError: null,
  updateError: null,
  deleteError: null,
};

/**
 * Redux reducer function that handles state updates for carrier-related actions
 */
const carrierReducer = (
  state: CarrierState = initialState,
  action: AnyAction
): CarrierState => {
  switch (action.type) {
    // Fetch carriers list
    case actionTypes.FETCH_CARRIERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case actionTypes.FETCH_CARRIERS_SUCCESS:
      return {
        ...state,
        loading: false,
        carriers: action.payload.carriers,
        totalCarriers: action.payload.total,
        currentPage: action.payload.page,
        pageSize: action.payload.limit
      };
    case actionTypes.FETCH_CARRIERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: new Error(action.payload)
      };

    // Fetch specific carrier
    case actionTypes.FETCH_CARRIER_REQUEST:
      return {
        ...state,
        loadingDetail: true,
        detailError: null
      };
    case actionTypes.FETCH_CARRIER_SUCCESS:
      return {
        ...state,
        loadingDetail: false,
        selectedCarrier: action.payload
      };
    case actionTypes.FETCH_CARRIER_FAILURE:
      return {
        ...state,
        loadingDetail: false,
        detailError: new Error(action.payload)
      };

    // Create carrier
    case actionTypes.CREATE_CARRIER_REQUEST:
      return {
        ...state,
        creating: true,
        createError: null
      };
    case actionTypes.CREATE_CARRIER_SUCCESS:
      return {
        ...state,
        creating: false,
        carriers: [...state.carriers, action.payload],
        totalCarriers: state.totalCarriers + 1
      };
    case actionTypes.CREATE_CARRIER_FAILURE:
      return {
        ...state,
        creating: false,
        createError: new Error(action.payload)
      };

    // Update carrier
    case actionTypes.UPDATE_CARRIER_REQUEST:
      return {
        ...state,
        updating: true,
        updateError: null
      };
    case actionTypes.UPDATE_CARRIER_SUCCESS:
      return {
        ...state,
        updating: false,
        selectedCarrier: action.payload,
        carriers: state.carriers.map(carrier => 
          carrier.id === action.payload.id ? action.payload : carrier
        )
      };
    case actionTypes.UPDATE_CARRIER_FAILURE:
      return {
        ...state,
        updating: false,
        updateError: new Error(action.payload)
      };

    // Delete carrier
    case actionTypes.DELETE_CARRIER_REQUEST:
      return {
        ...state,
        deleting: true,
        deleteError: null
      };
    case actionTypes.DELETE_CARRIER_SUCCESS:
      return {
        ...state,
        deleting: false,
        carriers: state.carriers.filter(carrier => carrier.id !== action.payload),
        totalCarriers: state.totalCarriers - 1,
        selectedCarrier: state.selectedCarrier?.id === action.payload 
          ? null 
          : state.selectedCarrier
      };
    case actionTypes.DELETE_CARRIER_FAILURE:
      return {
        ...state,
        deleting: false,
        deleteError: new Error(action.payload)
      };

    // Fetch carrier drivers
    case actionTypes.FETCH_CARRIER_DRIVERS_REQUEST:
      return {
        ...state,
        loadingDrivers: true,
        driversError: null
      };
    case actionTypes.FETCH_CARRIER_DRIVERS_SUCCESS:
      return {
        ...state,
        loadingDrivers: false,
        drivers: action.payload.drivers
      };
    case actionTypes.FETCH_CARRIER_DRIVERS_FAILURE:
      return {
        ...state,
        loadingDrivers: false,
        driversError: new Error(action.payload)
      };

    // Fetch carrier vehicles
    case actionTypes.FETCH_CARRIER_VEHICLES_REQUEST:
      return {
        ...state,
        loadingVehicles: true,
        vehiclesError: null
      };
    case actionTypes.FETCH_CARRIER_VEHICLES_SUCCESS:
      return {
        ...state,
        loadingVehicles: false,
        vehicles: action.payload.vehicles
      };
    case actionTypes.FETCH_CARRIER_VEHICLES_FAILURE:
      return {
        ...state,
        loadingVehicles: false,
        vehiclesError: new Error(action.payload)
      };

    // Fetch carrier performance metrics
    case actionTypes.FETCH_CARRIER_PERFORMANCE_REQUEST:
      return {
        ...state,
        loadingPerformance: true,
        performanceError: null
      };
    case actionTypes.FETCH_CARRIER_PERFORMANCE_SUCCESS:
      return {
        ...state,
        loadingPerformance: false,
        performanceMetrics: action.payload
      };
    case actionTypes.FETCH_CARRIER_PERFORMANCE_FAILURE:
      return {
        ...state,
        loadingPerformance: false,
        performanceError: new Error(action.payload)
      };

    // Fetch carrier summary
    case actionTypes.FETCH_CARRIER_SUMMARY_REQUEST:
      return {
        ...state,
        loadingSummary: true,
        summaryError: null
      };
    case actionTypes.FETCH_CARRIER_SUMMARY_SUCCESS:
      return {
        ...state,
        loadingSummary: false,
        carrierSummary: action.payload
      };
    case actionTypes.FETCH_CARRIER_SUMMARY_FAILURE:
      return {
        ...state,
        loadingSummary: false,
        summaryError: new Error(action.payload)
      };

    // Fetch carrier recommendations
    case actionTypes.FETCH_CARRIER_RECOMMENDATIONS_REQUEST:
      return {
        ...state,
        loadingRecommendations: true,
        recommendationsError: null
      };
    case actionTypes.FETCH_CARRIER_RECOMMENDATIONS_SUCCESS:
      return {
        ...state,
        loadingRecommendations: false,
        recommendations: action.payload.recommendations
      };
    case actionTypes.FETCH_CARRIER_RECOMMENDATIONS_FAILURE:
      return {
        ...state,
        loadingRecommendations: false,
        recommendationsError: new Error(action.payload)
      };

    // Fetch carrier network statistics
    case actionTypes.FETCH_CARRIER_NETWORK_STATS_REQUEST:
      return {
        ...state,
        loadingNetworkStats: true,
        networkStatsError: null
      };
    case actionTypes.FETCH_CARRIER_NETWORK_STATS_SUCCESS:
      return {
        ...state,
        loadingNetworkStats: false,
        networkStats: action.payload
      };
    case actionTypes.FETCH_CARRIER_NETWORK_STATS_FAILURE:
      return {
        ...state,
        loadingNetworkStats: false,
        networkStatsError: new Error(action.payload)
      };

    // Clear carrier cache
    case actionTypes.CLEAR_CARRIER_CACHE:
      return {
        ...state,
        selectedCarrier: null,
        drivers: [],
        vehicles: [],
        performanceMetrics: null,
        carrierSummary: null,
        recommendations: [],
        networkStats: null
      };

    default:
      return state;
  }
};

export default carrierReducer;