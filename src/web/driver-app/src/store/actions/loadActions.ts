/**
 * Redux action creators for load-related operations in the driver mobile application
 * Manages actions for fetching load recommendations, load details, accepting/declining loads,
 * updating load status, and managing the active load in the Redux store.
 */

import { Action, Dispatch } from 'redux'; // ^4.2.1
import { ThunkAction, ThunkDispatch } from 'redux-thunk'; // ^2.4.2

import { 
  LoadRecommendation, 
  LoadWithDetails, 
  LoadStatusUpdateParams 
} from '../../../common/interfaces/load.interface';

import { 
  getLoadRecommendations, 
  getLoadById, 
  acceptLoad, 
  declineLoad, 
  reserveLoad, 
  updateLoadStatus 
} from '../../../common/api/loadApi';

/**
 * Enumeration of all possible load action types for Redux actions
 */
export enum LoadActionTypes {
  FETCH_LOAD_RECOMMENDATIONS_REQUEST = 'FETCH_LOAD_RECOMMENDATIONS_REQUEST',
  FETCH_LOAD_RECOMMENDATIONS_SUCCESS = 'FETCH_LOAD_RECOMMENDATIONS_SUCCESS',
  FETCH_LOAD_RECOMMENDATIONS_FAILURE = 'FETCH_LOAD_RECOMMENDATIONS_FAILURE',
  
  FETCH_LOAD_DETAILS_REQUEST = 'FETCH_LOAD_DETAILS_REQUEST',
  FETCH_LOAD_DETAILS_SUCCESS = 'FETCH_LOAD_DETAILS_SUCCESS',
  FETCH_LOAD_DETAILS_FAILURE = 'FETCH_LOAD_DETAILS_FAILURE',
  
  ACCEPT_LOAD_REQUEST = 'ACCEPT_LOAD_REQUEST',
  ACCEPT_LOAD_SUCCESS = 'ACCEPT_LOAD_SUCCESS',
  ACCEPT_LOAD_FAILURE = 'ACCEPT_LOAD_FAILURE',
  
  DECLINE_LOAD_REQUEST = 'DECLINE_LOAD_REQUEST',
  DECLINE_LOAD_SUCCESS = 'DECLINE_LOAD_SUCCESS',
  DECLINE_LOAD_FAILURE = 'DECLINE_LOAD_FAILURE',
  
  RESERVE_LOAD_REQUEST = 'RESERVE_LOAD_REQUEST',
  RESERVE_LOAD_SUCCESS = 'RESERVE_LOAD_SUCCESS',
  RESERVE_LOAD_FAILURE = 'RESERVE_LOAD_FAILURE',
  
  UPDATE_LOAD_STATUS_REQUEST = 'UPDATE_LOAD_STATUS_REQUEST',
  UPDATE_LOAD_STATUS_SUCCESS = 'UPDATE_LOAD_STATUS_SUCCESS',
  UPDATE_LOAD_STATUS_FAILURE = 'UPDATE_LOAD_STATUS_FAILURE',
  
  SET_ACTIVE_LOAD = 'SET_ACTIVE_LOAD',
  CLEAR_ACTIVE_LOAD = 'CLEAR_ACTIVE_LOAD',
  
  FILTER_RECOMMENDATIONS = 'FILTER_RECOMMENDATIONS',
  SORT_RECOMMENDATIONS = 'SORT_RECOMMENDATIONS'
}

// Define action types for each possible load action
interface FetchLoadRecommendationsRequestAction {
  type: LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_REQUEST;
}

interface FetchLoadRecommendationsSuccessAction {
  type: LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_SUCCESS;
  payload: LoadRecommendation[];
}

interface FetchLoadRecommendationsFailureAction {
  type: LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_FAILURE;
  payload: string;
}

interface FetchLoadDetailsRequestAction {
  type: LoadActionTypes.FETCH_LOAD_DETAILS_REQUEST;
}

interface FetchLoadDetailsSuccessAction {
  type: LoadActionTypes.FETCH_LOAD_DETAILS_SUCCESS;
  payload: LoadWithDetails;
}

interface FetchLoadDetailsFailureAction {
  type: LoadActionTypes.FETCH_LOAD_DETAILS_FAILURE;
  payload: string;
}

interface AcceptLoadRequestAction {
  type: LoadActionTypes.ACCEPT_LOAD_REQUEST;
}

interface AcceptLoadSuccessAction {
  type: LoadActionTypes.ACCEPT_LOAD_SUCCESS;
  payload: any; // The result from the API
}

interface AcceptLoadFailureAction {
  type: LoadActionTypes.ACCEPT_LOAD_FAILURE;
  payload: string;
}

interface DeclineLoadRequestAction {
  type: LoadActionTypes.DECLINE_LOAD_REQUEST;
}

interface DeclineLoadSuccessAction {
  type: LoadActionTypes.DECLINE_LOAD_SUCCESS;
  payload: string; // loadId
}

interface DeclineLoadFailureAction {
  type: LoadActionTypes.DECLINE_LOAD_FAILURE;
  payload: string;
}

interface ReserveLoadRequestAction {
  type: LoadActionTypes.RESERVE_LOAD_REQUEST;
}

interface ReserveLoadSuccessAction {
  type: LoadActionTypes.RESERVE_LOAD_SUCCESS;
  payload: any; // The reservation result
}

interface ReserveLoadFailureAction {
  type: LoadActionTypes.RESERVE_LOAD_FAILURE;
  payload: string;
}

interface UpdateLoadStatusRequestAction {
  type: LoadActionTypes.UPDATE_LOAD_STATUS_REQUEST;
}

interface UpdateLoadStatusSuccessAction {
  type: LoadActionTypes.UPDATE_LOAD_STATUS_SUCCESS;
  payload: LoadWithDetails;
}

interface UpdateLoadStatusFailureAction {
  type: LoadActionTypes.UPDATE_LOAD_STATUS_FAILURE;
  payload: string;
}

interface SetActiveLoadAction {
  type: LoadActionTypes.SET_ACTIVE_LOAD;
  payload: LoadWithDetails;
}

interface ClearActiveLoadAction {
  type: LoadActionTypes.CLEAR_ACTIVE_LOAD;
}

interface FilterRecommendationsAction {
  type: LoadActionTypes.FILTER_RECOMMENDATIONS;
  payload: object; // Filter criteria
}

interface SortRecommendationsAction {
  type: LoadActionTypes.SORT_RECOMMENDATIONS;
  payload: {
    sortBy: string;
    sortDirection: string;
  };
}

/**
 * Union type of all possible load action objects for type checking
 */
export type LoadAction =
  | FetchLoadRecommendationsRequestAction
  | FetchLoadRecommendationsSuccessAction
  | FetchLoadRecommendationsFailureAction
  | FetchLoadDetailsRequestAction
  | FetchLoadDetailsSuccessAction
  | FetchLoadDetailsFailureAction
  | AcceptLoadRequestAction
  | AcceptLoadSuccessAction
  | AcceptLoadFailureAction
  | DeclineLoadRequestAction
  | DeclineLoadSuccessAction
  | DeclineLoadFailureAction
  | ReserveLoadRequestAction
  | ReserveLoadSuccessAction
  | ReserveLoadFailureAction
  | UpdateLoadStatusRequestAction
  | UpdateLoadStatusSuccessAction
  | UpdateLoadStatusFailureAction
  | SetActiveLoadAction
  | ClearActiveLoadAction
  | FilterRecommendationsAction
  | SortRecommendationsAction;

// Define a type for the root application state
export interface AppState {
  // This is a placeholder for TypeScript
  // The actual state structure would typically be imported from a separate file
}

/**
 * Fetches load recommendations for a driver based on their ID and optional parameters
 * 
 * @param driverId - The ID of the driver to fetch recommendations for
 * @param options - Optional parameters for filtering recommendations (count, location)
 * @returns Thunk action that resolves when the operation completes
 */
export const fetchLoadRecommendations = (
  driverId: string,
  options: { count?: number; location?: { latitude: number; longitude: number } } = {}
): ThunkAction<Promise<void>, AppState, unknown, LoadAction> => {
  return async (dispatch: ThunkDispatch<AppState, unknown, LoadAction>) => {
    dispatch({ type: LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_REQUEST });
    
    try {
      const response = await getLoadRecommendations(driverId, options);
      
      dispatch({
        type: LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_SUCCESS,
        payload: response.recommendations
      });
      
      return Promise.resolve();
    } catch (error) {
      dispatch({
        type: LoadActionTypes.FETCH_LOAD_RECOMMENDATIONS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      return Promise.reject(error);
    }
  };
};

/**
 * Fetches detailed information about a specific load
 * 
 * @param loadId - The ID of the load to fetch details for
 * @returns Thunk action that resolves when the operation completes
 */
export const fetchLoadDetails = (
  loadId: string
): ThunkAction<Promise<void>, AppState, unknown, LoadAction> => {
  return async (dispatch: ThunkDispatch<AppState, unknown, LoadAction>) => {
    dispatch({ type: LoadActionTypes.FETCH_LOAD_DETAILS_REQUEST });
    
    try {
      const loadDetails = await getLoadById(loadId, true) as LoadWithDetails;
      
      dispatch({
        type: LoadActionTypes.FETCH_LOAD_DETAILS_SUCCESS,
        payload: loadDetails
      });
      
      return Promise.resolve();
    } catch (error) {
      dispatch({
        type: LoadActionTypes.FETCH_LOAD_DETAILS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      return Promise.reject(error);
    }
  };
};

/**
 * Accepts a load for a driver
 * 
 * @param loadId - The ID of the load to accept
 * @param driverId - The ID of the driver accepting the load
 * @param acceptanceData - Additional data for acceptance (vehicle ID, notes)
 * @returns Thunk action that resolves when the operation completes
 */
export const acceptLoadAction = (
  loadId: string,
  driverId: string,
  acceptanceData: { vehicleId?: string; notes?: string } = {}
): ThunkAction<Promise<void>, AppState, unknown, LoadAction> => {
  return async (dispatch: ThunkDispatch<AppState, unknown, LoadAction>) => {
    dispatch({ type: LoadActionTypes.ACCEPT_LOAD_REQUEST });
    
    try {
      const result = await acceptLoad(loadId, driverId, acceptanceData);
      
      dispatch({
        type: LoadActionTypes.ACCEPT_LOAD_SUCCESS,
        payload: result
      });
      
      return Promise.resolve();
    } catch (error) {
      dispatch({
        type: LoadActionTypes.ACCEPT_LOAD_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      return Promise.reject(error);
    }
  };
};

/**
 * Declines a load recommendation for a driver
 * 
 * @param loadId - The ID of the load to decline
 * @param driverId - The ID of the driver declining the load
 * @param declineData - Reason for declining the load
 * @returns Thunk action that resolves when the operation completes
 */
export const declineLoadAction = (
  loadId: string,
  driverId: string,
  declineData: { reason: string; notes?: string } = { reason: 'other' }
): ThunkAction<Promise<void>, AppState, unknown, LoadAction> => {
  return async (dispatch: ThunkDispatch<AppState, unknown, LoadAction>) => {
    dispatch({ type: LoadActionTypes.DECLINE_LOAD_REQUEST });
    
    try {
      await declineLoad(loadId, driverId, declineData);
      
      dispatch({
        type: LoadActionTypes.DECLINE_LOAD_SUCCESS,
        payload: loadId
      });
      
      return Promise.resolve();
    } catch (error) {
      dispatch({
        type: LoadActionTypes.DECLINE_LOAD_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      return Promise.reject(error);
    }
  };
};

/**
 * Temporarily reserves a load for a driver
 * 
 * @param loadId - The ID of the load to reserve
 * @param driverId - The ID of the driver reserving the load
 * @param expirationMinutes - How long the reservation should last (default: 15 minutes)
 * @returns Thunk action that resolves when the operation completes
 */
export const reserveLoadAction = (
  loadId: string,
  driverId: string,
  expirationMinutes: number = 15
): ThunkAction<Promise<void>, AppState, unknown, LoadAction> => {
  return async (dispatch: ThunkDispatch<AppState, unknown, LoadAction>) => {
    dispatch({ type: LoadActionTypes.RESERVE_LOAD_REQUEST });
    
    try {
      const result = await reserveLoad(loadId, driverId, expirationMinutes);
      
      dispatch({
        type: LoadActionTypes.RESERVE_LOAD_SUCCESS,
        payload: result
      });
      
      return Promise.resolve();
    } catch (error) {
      dispatch({
        type: LoadActionTypes.RESERVE_LOAD_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      return Promise.reject(error);
    }
  };
};

/**
 * Updates the status of a load
 * 
 * @param loadId - The ID of the load to update
 * @param statusData - The new status data
 * @returns Thunk action that resolves when the operation completes
 */
export const updateLoadStatusAction = (
  loadId: string,
  statusData: LoadStatusUpdateParams
): ThunkAction<Promise<void>, AppState, unknown, LoadAction> => {
  return async (dispatch: ThunkDispatch<AppState, unknown, LoadAction>) => {
    dispatch({ type: LoadActionTypes.UPDATE_LOAD_STATUS_REQUEST });
    
    try {
      const updatedLoad = await updateLoadStatus(loadId, statusData);
      
      dispatch({
        type: LoadActionTypes.UPDATE_LOAD_STATUS_SUCCESS,
        payload: updatedLoad
      });
      
      return Promise.resolve();
    } catch (error) {
      dispatch({
        type: LoadActionTypes.UPDATE_LOAD_STATUS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      return Promise.reject(error);
    }
  };
};

/**
 * Sets the active load in the Redux store
 * 
 * @param load - The load to set as active
 * @returns Action object with the load payload
 */
export const setActiveLoad = (load: LoadWithDetails): SetActiveLoadAction => ({
  type: LoadActionTypes.SET_ACTIVE_LOAD,
  payload: load
});

/**
 * Clears the active load from the Redux store
 * 
 * @returns Action object to clear the active load
 */
export const clearActiveLoad = (): ClearActiveLoadAction => ({
  type: LoadActionTypes.CLEAR_ACTIVE_LOAD
});

/**
 * Filters load recommendations based on provided criteria
 * 
 * @param filterCriteria - Object containing filter criteria
 * @returns Action object with filter criteria payload
 */
export const filterRecommendations = (filterCriteria: object): FilterRecommendationsAction => ({
  type: LoadActionTypes.FILTER_RECOMMENDATIONS,
  payload: filterCriteria
});

/**
 * Sorts load recommendations based on a field and direction
 * 
 * @param sortBy - Field to sort by (e.g., 'rate', 'distance')
 * @param sortDirection - Direction to sort ('asc' or 'desc')
 * @returns Action object with sort parameters payload
 */
export const sortRecommendations = (
  sortBy: string,
  sortDirection: string
): SortRecommendationsAction => ({
  type: LoadActionTypes.SORT_RECOMMENDATIONS,
  payload: { sortBy, sortDirection }
});