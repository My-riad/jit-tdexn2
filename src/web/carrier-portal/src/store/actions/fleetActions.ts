# src/web/carrier-portal/src/store/actions/fleetActions.ts
```typescript
import { PayloadAction } from '@reduxjs/toolkit'; // Redux Toolkit v1.9.0+
import { AppThunk } from '../index';
import {
  Vehicle,
  VehicleSummary,
  VehicleWithDetails,
  VehicleCreationParams,
  VehicleUpdateParams,
  VehicleSearchParams,
  VehicleMaintenance,
  VehicleStatus,
  VehiclePerformanceMetrics,
  VehicleUtilization,
} from '../../../common/interfaces/vehicle.interface';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getFleetSummary,
  getVehiclePerformance,
  getVehicleUtilization,
  getFleetPerformance,
  getVehicleMaintenanceHistory,
  scheduleVehicleMaintenance,
  updateVehicleStatus,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
  getOptimizationRecommendations
} from '../../services/fleetService';

// Define action type constants
export enum FleetActionTypes {
  FETCH_VEHICLES_REQUEST = 'fleet/FETCH_VEHICLES_REQUEST',
  FETCH_VEHICLES_SUCCESS = 'fleet/FETCH_VEHICLES_SUCCESS',
  FETCH_VEHICLES_FAILURE = 'fleet/FETCH_VEHICLES_FAILURE',
  FETCH_VEHICLE_DETAIL_REQUEST = 'fleet/FETCH_VEHICLE_DETAIL_REQUEST',
  FETCH_VEHICLE_DETAIL_SUCCESS = 'fleet/FETCH_VEHICLE_DETAIL_SUCCESS',
  FETCH_VEHICLE_DETAIL_FAILURE = 'fleet/FETCH_VEHICLE_DETAIL_FAILURE',
  CREATE_VEHICLE_REQUEST = 'fleet/CREATE_VEHICLE_REQUEST',
  CREATE_VEHICLE_SUCCESS = 'fleet/CREATE_VEHICLE_SUCCESS',
  CREATE_VEHICLE_FAILURE = 'fleet/CREATE_VEHICLE_FAILURE',
  UPDATE_VEHICLE_REQUEST = 'fleet/UPDATE_VEHICLE_REQUEST',
  UPDATE_VEHICLE_SUCCESS = 'fleet/UPDATE_VEHICLE_SUCCESS',
  UPDATE_VEHICLE_FAILURE = 'fleet/UPDATE_VEHICLE_FAILURE',
  DELETE_VEHICLE_REQUEST = 'fleet/DELETE_VEHICLE_REQUEST',
  DELETE_VEHICLE_SUCCESS = 'fleet/DELETE_VEHICLE_SUCCESS',
  DELETE_VEHICLE_FAILURE = 'fleet/DELETE_VEHICLE_FAILURE',
  FETCH_VEHICLE_MAINTENANCE_REQUEST = 'fleet/FETCH_VEHICLE_MAINTENANCE_REQUEST',
  FETCH_VEHICLE_MAINTENANCE_SUCCESS = 'fleet/FETCH_VEHICLE_MAINTENANCE_SUCCESS',
  FETCH_VEHICLE_MAINTENANCE_FAILURE = 'fleet/FETCH_VEHICLE_MAINTENANCE_FAILURE',
  ADD_MAINTENANCE_RECORD_REQUEST = 'fleet/ADD_MAINTENANCE_RECORD_REQUEST',
  ADD_MAINTENANCE_RECORD_SUCCESS = 'fleet/ADD_MAINTENANCE_RECORD_SUCCESS',
  ADD_MAINTENANCE_RECORD_FAILURE = 'fleet/ADD_MAINTENANCE_RECORD_FAILURE',
  UPDATE_MAINTENANCE_RECORD_REQUEST = 'fleet/UPDATE_MAINTENANCE_RECORD_REQUEST',
  UPDATE_MAINTENANCE_RECORD_SUCCESS = 'fleet/UPDATE_MAINTENANCE_RECORD_SUCCESS',
  UPDATE_MAINTENANCE_RECORD_FAILURE = 'fleet/UPDATE_MAINTENANCE_RECORD_FAILURE',
  FETCH_VEHICLE_POSITIONS_REQUEST = 'fleet/FETCH_VEHICLE_POSITIONS_REQUEST',
  FETCH_VEHICLE_POSITIONS_SUCCESS = 'fleet/FETCH_VEHICLE_POSITIONS_SUCCESS',
  FETCH_VEHICLE_POSITIONS_FAILURE = 'fleet/FETCH_VEHICLE_POSITIONS_FAILURE',
  FETCH_VEHICLE_UTILIZATION_REQUEST = 'fleet/FETCH_VEHICLE_UTILIZATION_REQUEST',
  FETCH_VEHICLE_UTILIZATION_SUCCESS = 'fleet/FETCH_VEHICLE_UTILIZATION_SUCCESS',
  FETCH_VEHICLE_UTILIZATION_FAILURE = 'fleet/FETCH_VEHICLE_UTILIZATION_FAILURE',
  FETCH_FLEET_UTILIZATION_REQUEST = 'fleet/FETCH_FLEET_UTILIZATION_REQUEST',
  FETCH_FLEET_UTILIZATION_SUCCESS = 'fleet/FETCH_FLEET_UTILIZATION_SUCCESS',
  FETCH_FLEET_UTILIZATION_FAILURE = 'fleet/FETCH_FLEET_UTILIZATION_FAILURE',
  FETCH_VEHICLE_CURRENT_POSITION_REQUEST = 'fleet/FETCH_VEHICLE_CURRENT_POSITION_REQUEST',
  FETCH_VEHICLE_CURRENT_POSITION_SUCCESS = 'fleet/FETCH_VEHICLE_CURRENT_POSITION_SUCCESS',
  FETCH_VEHICLE_CURRENT_POSITION_FAILURE = 'fleet/FETCH_VEHICLE_CURRENT_POSITION_FAILURE',
  FETCH_FLEET_SUMMARY_REQUEST = 'fleet/FETCH_FLEET_SUMMARY_REQUEST',
  FETCH_FLEET_SUMMARY_SUCCESS = 'fleet/FETCH_FLEET_SUMMARY_SUCCESS',
  FETCH_FLEET_SUMMARY_FAILURE = 'fleet/FETCH_FLEET_SUMMARY_FAILURE',
  FETCH_MAINTENANCE_NEEDED_REQUEST = 'fleet/FETCH_MAINTENANCE_NEEDED_REQUEST',
  FETCH_MAINTENANCE_NEEDED_SUCCESS = 'fleet/FETCH_MAINTENANCE_NEEDED_SUCCESS',
  FETCH_MAINTENANCE_NEEDED_FAILURE = 'fleet/FETCH_MAINTENANCE_NEEDED_FAILURE',
  UPDATE_VEHICLE_STATUS_REQUEST = 'fleet/UPDATE_VEHICLE_STATUS_REQUEST',
  UPDATE_VEHICLE_STATUS_SUCCESS = 'fleet/UPDATE_VEHICLE_STATUS_SUCCESS',
  UPDATE_VEHICLE_STATUS_FAILURE = 'fleet/UPDATE_VEHICLE_STATUS_FAILURE',
  ASSIGN_DRIVER_REQUEST = 'fleet/ASSIGN_DRIVER_REQUEST',
  ASSIGN_DRIVER_SUCCESS = 'fleet/ASSIGN_DRIVER_SUCCESS',
  ASSIGN_DRIVER_FAILURE = 'fleet/ASSIGN_DRIVER_FAILURE',
  UNASSIGN_DRIVER_REQUEST = 'fleet/UNASSIGN_DRIVER_REQUEST',
  UNASSIGN_DRIVER_SUCCESS = 'fleet/UNASSIGN_DRIVER_SUCCESS',
  UNASSIGN_DRIVER_FAILURE = 'fleet/UNASSIGN_DRIVER_FAILURE',
  FETCH_OPTIMIZATION_RECOMMENDATIONS_REQUEST = 'fleet/FETCH_OPTIMIZATION_RECOMMENDATIONS_REQUEST',
  FETCH_OPTIMIZATION_RECOMMENDATIONS_SUCCESS = 'fleet/FETCH_OPTIMIZATION_RECOMMENDATIONS_SUCCESS',
  FETCH_OPTIMIZATION_RECOMMENDATIONS_FAILURE = 'fleet/FETCH_OPTIMIZATION_RECOMMENDATIONS_FAILURE',
}

// Define action interfaces
interface FetchVehiclesRequestAction {
  type: typeof FleetActionTypes.FETCH_VEHICLES_REQUEST;
}

interface FetchVehiclesSuccessAction {
  type: typeof FleetActionTypes.FETCH_VEHICLES_SUCCESS;
  payload: { vehicles: VehicleSummary[]; total: number; page: number; limit: number; };
}

interface FetchVehiclesFailureAction {
  type: typeof FleetActionTypes.FETCH_VEHICLES_FAILURE;
  payload: { error: string; };
}

type FleetAction =
  | { type: string; payload: any };

// Thunk action creator for fetching vehicles
export const fetchVehicles = (carrierId: string, searchParams?: VehicleSearchParams): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.FETCH_VEHICLES_REQUEST });
    try {
      const data = await getAllVehicles(searchParams);
      dispatch({
        type: FleetActionTypes.FETCH_VEHICLES_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.FETCH_VEHICLES_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for fetching vehicle detail
export const fetchVehicleDetail = (vehicleId: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.FETCH_VEHICLE_DETAIL_REQUEST });
    try {
      const data = await getVehicleById(vehicleId);
      dispatch({
        type: FleetActionTypes.FETCH_VEHICLE_DETAIL_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.FETCH_VEHICLE_DETAIL_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for creating a new vehicle
export const createNewVehicle = (vehicleData: VehicleCreationParams): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.CREATE_VEHICLE_REQUEST });
    try {
      const data = await createVehicle(vehicleData);
      dispatch({
        type: FleetActionTypes.CREATE_VEHICLE_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.CREATE_VEHICLE_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for updating an existing vehicle
export const updateExistingVehicle = (vehicleId: string, updateData: VehicleUpdateParams): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.UPDATE_VEHICLE_REQUEST });
    try {
      const data = await updateVehicle(vehicleId, updateData);
      dispatch({
        type: FleetActionTypes.UPDATE_VEHICLE_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.UPDATE_VEHICLE_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for deleting a vehicle
export const deleteExistingVehicle = (vehicleId: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.DELETE_VEHICLE_REQUEST });
    try {
      await deleteVehicle(vehicleId);
      dispatch({
        type: FleetActionTypes.DELETE_VEHICLE_SUCCESS,
        payload: vehicleId,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.DELETE_VEHICLE_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for fetching maintenance history for a vehicle
export const fetchVehicleMaintenance = (vehicleId: string, params: object): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_REQUEST });
    try {
      const data = await getVehicleMaintenanceHistory(vehicleId, params);
      dispatch({
        type: FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for adding a maintenance record for a vehicle
export const addMaintenanceRecord = (vehicleId: string, maintenanceData: object): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.ADD_MAINTENANCE_RECORD_REQUEST });
    try {
      const data = await scheduleVehicleMaintenance(vehicleId, maintenanceData);
      dispatch({
        type: FleetActionTypes.ADD_MAINTENANCE_RECORD_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.ADD_MAINTENANCE_RECORD_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for fetching utilization metrics for a vehicle
export const fetchVehicleUtilization = (vehicleId: string, params: object): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.FETCH_VEHICLE_UTILIZATION_REQUEST });
    try {
      const data = await getVehicleUtilization(vehicleId, params);
      dispatch({
        type: FleetActionTypes.FETCH_VEHICLE_UTILIZATION_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.FETCH_VEHICLE_UTILIZATION_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for fetching utilization metrics for the entire fleet
export const fetchFleetUtilization = (carrierId: string, params: object): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.FETCH_FLEET_UTILIZATION_REQUEST });
    try {
      const data = await getFleetPerformance(carrierId, params);
      dispatch({
        type: FleetActionTypes.FETCH_FLEET_UTILIZATION_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.FETCH_FLEET_UTILIZATION_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for fetching summary statistics for the carrier's fleet
export const fetchFleetSummary = (carrierId: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.FETCH_FLEET_SUMMARY_REQUEST });
    try {
      const data = await getFleetSummary(carrierId);
      dispatch({
        type: FleetActionTypes.FETCH_FLEET_SUMMARY_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.FETCH_FLEET_SUMMARY_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for fetching vehicles that need maintenance
export const fetchVehiclesNeedingMaintenance = (carrierId: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.FETCH_MAINTENANCE_NEEDED_REQUEST });
    try {
      const data = await getAllVehicles({ carrier_id: carrierId, maintenance_due: true });
      dispatch({
        type: FleetActionTypes.FETCH_MAINTENANCE_NEEDED_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.FETCH_MAINTENANCE_NEEDED_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for updating the status of a vehicle
export const updateVehicleStatusAction = (vehicleId: string, status: VehicleStatus, notes: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.UPDATE_VEHICLE_STATUS_REQUEST });
    try {
      const data = await updateVehicleStatus(vehicleId, status, notes);
      dispatch({
        type: FleetActionTypes.UPDATE_VEHICLE_STATUS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.UPDATE_VEHICLE_STATUS_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for assigning a driver to a vehicle
export const assignDriver = (vehicleId: string, driverId: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.ASSIGN_DRIVER_REQUEST });
    try {
      const data = await assignDriverToVehicle(vehicleId, driverId);
      dispatch({
        type: FleetActionTypes.ASSIGN_DRIVER_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.ASSIGN_DRIVER_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for removing driver assignment from a vehicle
export const unassignDriver = (vehicleId: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.UNASSIGN_DRIVER_REQUEST });
    try {
      const data = await unassignDriverFromVehicle(vehicleId);
      dispatch({
        type: FleetActionTypes.UNASSIGN_DRIVER_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.UNASSIGN_DRIVER_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

// Thunk action creator for fetching optimization recommendations for the fleet
export const fetchOptimizationRecommendations = (carrierId: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_REQUEST });
    try {
      const data = await getOptimizationRecommendations(carrierId);
      dispatch({
        type: FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      dispatch({
        type: FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_FAILURE,
        payload: { error: error.message },
      });
    }
  };
};

export type FleetAction =
  | FetchVehiclesRequestAction
  | FetchVehiclesSuccessAction
  | FetchVehiclesFailureAction;