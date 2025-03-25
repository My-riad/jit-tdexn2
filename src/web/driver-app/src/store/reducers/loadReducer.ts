/**
 * Redux reducer for managing load-related state in the driver mobile application.
 * Handles state updates for load recommendations, load details, load acceptance/rejection,
 * and active load tracking throughout the load lifecycle.
 */

import { LoadActionTypes, LoadAction } from '../actions/loadActions';
import { LoadRecommendation, LoadWithDetails } from '../../../common/interfaces/load.interface';

/**
 * Interface defining the structure of the load state in Redux store
 */
export interface LoadState {
  // Load recommendations from the AI optimization system
  recommendations: LoadRecommendation[];
  // Recommendations after filtering/sorting is applied
  filteredRecommendations: LoadRecommendation[];
  // Detailed information about a specific load
  loadDetails: LoadWithDetails | null;
  // The currently active load the driver is working on
  activeLoad: LoadWithDetails | null;
  // Information about a temporarily reserved load
  reservedLoad: { loadId: string; expiresAt: string } | null;
  // Loading states for various operations
  loading: boolean;
  loadDetailsLoading: boolean;
  acceptingLoad: boolean;
  decliningLoad: boolean;
  reservingLoad: boolean;
  updatingStatus: boolean;
  // Error information
  error: string | null;
  // Filtering and sorting state
  filterCriteria: object | null;
  sortBy: string;
  sortDirection: string;
}

/**
 * Initial state for the load reducer
 */
const initialState: LoadState = {
  recommendations: [],
  filteredRecommendations: [],
  loadDetails: null,
  activeLoad: null,
  reservedLoad: null,
  loading: false,
  loadDetailsLoading: false,
  acceptingLoad: false,
  decliningLoad: false,
  reservingLoad: false,
  updatingStatus: false,
  error: null,
  filterCriteria: null,
  sortBy: 'efficiencyScore', // Default sort by efficiency score
  sortDirection: 'desc' // Default sort direction (highest first)
};

/**
 * Redux reducer function that handles load-related state updates based on dispatched actions
 * 
 * @param state - Current state (or initial state if undefined)
 * @param action - Redux action dispatched
 * @returns Updated state based on the action
 */
const loadReducer = (state: LoadState = initialState, action: LoadAction): LoadState => {
  switch (action.type) {
    // Recommendations request handling
    case LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_SUCCESS:
      return {
        ...state,
        recommendations: action.payload,
        filteredRecommendations: action.payload,
        loading: false,
        error: null
      };
    
    case LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    // Load details request handling
    case LoadActionTypes.FETCH_LOAD_DETAILS_REQUEST:
      return {
        ...state,
        loadDetailsLoading: true,
        error: null
      };
    
    case LoadActionTypes.FETCH_LOAD_DETAILS_SUCCESS:
      return {
        ...state,
        loadDetails: action.payload,
        loadDetailsLoading: false,
        error: null
      };
    
    case LoadActionTypes.FETCH_LOAD_DETAILS_FAILURE:
      return {
        ...state,
        loadDetailsLoading: false,
        error: action.payload
      };
    
    // Load acceptance handling
    case LoadActionTypes.ACCEPT_LOAD_REQUEST:
      return {
        ...state,
        acceptingLoad: true,
        error: null
      };
    
    case LoadActionTypes.ACCEPT_LOAD_SUCCESS:
      return {
        ...state,
        acceptingLoad: false,
        // If we have load details, set it as the active load
        activeLoad: state.loadDetails,
        // Clear the reserved load if it matches the accepted load
        reservedLoad: state.reservedLoad?.loadId === state.loadDetails?.id ? null : state.reservedLoad,
        error: null
      };
    
    case LoadActionTypes.ACCEPT_LOAD_FAILURE:
      return {
        ...state,
        acceptingLoad: false,
        error: action.payload
      };
    
    // Load decline handling
    case LoadActionTypes.DECLINE_LOAD_REQUEST:
      return {
        ...state,
        decliningLoad: true,
        error: null
      };
    
    case LoadActionTypes.DECLINE_LOAD_SUCCESS:
      return {
        ...state,
        decliningLoad: false,
        // Remove the declined load from recommendations
        recommendations: state.recommendations.filter(load => load.loadId !== action.payload),
        filteredRecommendations: state.filteredRecommendations.filter(load => load.loadId !== action.payload),
        // Clear load details if it matches the declined load
        loadDetails: state.loadDetails?.id === action.payload ? null : state.loadDetails,
        error: null
      };
    
    case LoadActionTypes.DECLINE_LOAD_FAILURE:
      return {
        ...state,
        decliningLoad: false,
        error: action.payload
      };
    
    // Load reservation handling
    case LoadActionTypes.RESERVE_LOAD_REQUEST:
      return {
        ...state,
        reservingLoad: true,
        error: null
      };
    
    case LoadActionTypes.RESERVE_LOAD_SUCCESS:
      return {
        ...state,
        reservingLoad: false,
        reservedLoad: {
          loadId: action.payload.loadId || (state.loadDetails?.id as string),
          expiresAt: action.payload.expiresAt
        },
        error: null
      };
    
    case LoadActionTypes.RESERVE_LOAD_FAILURE:
      return {
        ...state,
        reservingLoad: false,
        error: action.payload
      };
    
    // Load status update handling
    case LoadActionTypes.UPDATE_LOAD_STATUS_REQUEST:
      return {
        ...state,
        updatingStatus: true,
        error: null
      };
    
    case LoadActionTypes.UPDATE_LOAD_STATUS_SUCCESS:
      return {
        ...state,
        activeLoad: action.payload,
        updatingStatus: false,
        error: null
      };
    
    case LoadActionTypes.UPDATE_LOAD_STATUS_FAILURE:
      return {
        ...state,
        updatingStatus: false,
        error: action.payload
      };
    
    // Active load management
    case LoadActionTypes.SET_ACTIVE_LOAD:
      return {
        ...state,
        activeLoad: action.payload
      };
    
    case LoadActionTypes.CLEAR_ACTIVE_LOAD:
      return {
        ...state,
        activeLoad: null
      };
    
    // Filtering and sorting
    case LoadActionTypes.FILTER_RECOMMENDATIONS:
      // Apply filtering logic
      const filterCriteria = action.payload;
      const filteredLoads = state.recommendations.filter(load => {
        // Simple implementation - would need to expand based on actual filter criteria structure
        let matchesFilter = true;
        
        // Example filtering based on common criteria
        if (filterCriteria.equipmentType && load.equipmentType !== filterCriteria.equipmentType) {
          matchesFilter = false;
        }
        
        if (filterCriteria.minRate && load.rate < filterCriteria.minRate) {
          matchesFilter = false;
        }
        
        if (filterCriteria.maxDistance && load.distance > filterCriteria.maxDistance) {
          matchesFilter = false;
        }
        
        if (filterCriteria.minEfficiencyScore && load.efficiencyScore < filterCriteria.minEfficiencyScore) {
          matchesFilter = false;
        }
        
        return matchesFilter;
      });
      
      return {
        ...state,
        filteredRecommendations: filteredLoads,
        filterCriteria
      };
    
    case LoadActionTypes.SORT_RECOMMENDATIONS:
      // Get sort parameters
      const { sortBy, sortDirection } = action.payload;
      
      // Clone the array to avoid mutating state
      const sortedLoads = [...state.filteredRecommendations].sort((a, b) => {
        // Perform the sort based on the specified field
        let comparison = 0;
        
        switch (sortBy) {
          case 'efficiencyScore':
            comparison = a.efficiencyScore - b.efficiencyScore;
            break;
          case 'rate':
            comparison = a.rate - b.rate;
            break;
          case 'ratePerMile':
            comparison = a.ratePerMile - b.ratePerMile;
            break;
          case 'distance':
            comparison = a.distance - b.distance;
            break;
          case 'pickupDate':
            comparison = new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
            break;
          default:
            comparison = 0;
        }
        
        // Apply sort direction
        return sortDirection === 'asc' ? comparison : -comparison;
      });
      
      return {
        ...state,
        filteredRecommendations: sortedLoads,
        sortBy,
        sortDirection
      };
    
    // Default case - return unchanged state
    default:
      return state;
  }
};

export default loadReducer;