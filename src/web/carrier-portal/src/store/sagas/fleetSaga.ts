import { PayloadAction } from '@reduxjs/toolkit'; // Redux Toolkit v1.9.0+
import { takeLatest, all, call, put } from 'redux-saga/effects'; // redux-saga/effects ^1.1.3
import * as fleetService from '../../services/fleetService';
import { FleetActionTypes } from '../actions/fleetActions';
import logger from '../../../common/utils/logger';
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
  FleetOptimizationRecommendations
} from '../../../common/interfaces/vehicle.interface';

/**
 * Saga for handling vehicle list fetch requests
 * @param {PayloadAction<{ carrierId: string; searchParams?: any }>} action - The action containing the carrierId and optional searchParams
 * @returns {Generator} - A saga generator function
 */
function* fetchVehiclesSaga(action: PayloadAction<{ carrierId: string; searchParams?: any }>): Generator {
  try {
    // LD1: Extract carrierId and searchParams from action payload
    const { carrierId, searchParams } = action.payload;
    logger.info(`Fetching vehicles for carrier ${carrierId}`, { component: 'fleetSaga', carrierId, searchParams });

    // LD1: Try to fetch vehicles using fleetService.getAllVehicles with searchParams
    const { vehicles, total } = yield call(fleetService.getAllVehicles, searchParams);

    // LD1: If successful, dispatch FETCH_VEHICLES_SUCCESS action with vehicles data and pagination info
    yield put({
      type: FleetActionTypes.FETCH_VEHICLES_SUCCESS,
      payload: { vehicles, total, page: searchParams?.page, limit: searchParams?.limit },
    });
    logger.debug(`Successfully fetched ${vehicles.length} vehicles for carrier ${carrierId}`, { component: 'fleetSaga', carrierId, count: vehicles.length });
  } catch (error: any) {
    // LD1: If fetch fails, dispatch FETCH_VEHICLES_FAILURE action with error message
    logger.error(`Failed to fetch vehicles for carrier ${action.payload.carrierId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.FETCH_VEHICLES_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling vehicle detail fetch requests
 * @param {PayloadAction<{ vehicleId: string }>} action - The action containing the vehicleId
 * @returns {Generator} - A saga generator function
 */
function* fetchVehicleDetailSaga(action: PayloadAction<{ vehicleId: string }>): Generator {
  try {
    // LD1: Extract vehicleId from action payload
    const { vehicleId } = action.payload;
    logger.info(`Fetching vehicle detail for vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId });

    // LD1: Try to fetch vehicle details using fleetService.getVehicleById with vehicleId
    const vehicle: VehicleWithDetails = yield call(fleetService.getVehicleById, vehicleId);

    // LD1: If successful, dispatch FETCH_VEHICLE_DETAIL_SUCCESS action with vehicle details
    yield put({
      type: FleetActionTypes.FETCH_VEHICLE_DETAIL_SUCCESS,
      payload: vehicle,
    });
    logger.debug(`Successfully fetched vehicle detail for vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId });
  } catch (error: any) {
    // LD1: If fetch fails, dispatch FETCH_VEHICLE_DETAIL_FAILURE action with error message
    logger.error(`Failed to fetch vehicle detail for vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.FETCH_VEHICLE_DETAIL_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling vehicle creation requests
 * @param {PayloadAction<{ vehicleData: any }>} action - The action containing the vehicleData
 * @returns {Generator} - A saga generator function
 */
function* createVehicleSaga(action: PayloadAction<{ vehicleData: any }>): Generator {
  try {
    // LD1: Extract vehicleData from action payload
    const { vehicleData } = action.payload;
    logger.info('Creating vehicle', { component: 'fleetSaga', vehicleData });

    // LD1: Try to create vehicle using fleetService.createVehicle with vehicleData
    const vehicle: Vehicle = yield call(fleetService.createVehicle, vehicleData);

    // LD1: If successful, dispatch CREATE_VEHICLE_SUCCESS action with created vehicle
    yield put({
      type: FleetActionTypes.CREATE_VEHICLE_SUCCESS,
      payload: vehicle,
    });
    logger.debug(`Successfully created vehicle ${vehicle.vehicle_id}`, { component: 'fleetSaga', vehicleId: vehicle.vehicle_id });
  } catch (error: any) {
    // LD1: If creation fails, dispatch CREATE_VEHICLE_FAILURE action with error message
    logger.error('Failed to create vehicle', { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.CREATE_VEHICLE_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling vehicle update requests
 * @param {PayloadAction<{ vehicleId: string; updateData: any }>} action - The action containing the vehicleId and updateData
 * @returns {Generator} - A saga generator function
 */
function* updateVehicleSaga(action: PayloadAction<{ vehicleId: string; updateData: any }>): Generator {
  try {
    // LD1: Extract vehicleId and updateData from action payload
    const { vehicleId, updateData } = action.payload;
    logger.info(`Updating vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId, updateData });

    // LD1: Try to update vehicle using fleetService.updateVehicle with vehicleId and updateData
    const vehicle: Vehicle = yield call(fleetService.updateVehicle, vehicleId, updateData);

    // LD1: If successful, dispatch UPDATE_VEHICLE_SUCCESS action with updated vehicle
    yield put({
      type: FleetActionTypes.UPDATE_VEHICLE_SUCCESS,
      payload: vehicle,
    });
    logger.debug(`Successfully updated vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId });
  } catch (error: any) {
    // LD1: If update fails, dispatch UPDATE_VEHICLE_FAILURE action with error message
    logger.error(`Failed to update vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.UPDATE_VEHICLE_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling vehicle deletion requests
 * @param {PayloadAction<{ vehicleId: string }>} action - The action containing the vehicleId
 * @returns {Generator} - A saga generator function
 */
function* deleteVehicleSaga(action: PayloadAction<{ vehicleId: string }>): Generator {
  try {
    // LD1: Extract vehicleId from action payload
    const { vehicleId } = action.payload;
    logger.info(`Deleting vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId });

    // LD1: Try to delete vehicle using fleetService.deleteVehicle with vehicleId
    yield call(fleetService.deleteVehicle, vehicleId);

    // LD1: If successful, dispatch DELETE_VEHICLE_SUCCESS action with vehicleId
    yield put({
      type: FleetActionTypes.DELETE_VEHICLE_SUCCESS,
      payload: vehicleId,
    });
    logger.debug(`Successfully deleted vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId });
  } catch (error: any) {
    // LD1: If deletion fails, dispatch DELETE_VEHICLE_FAILURE action with error message
    logger.error(`Failed to delete vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.DELETE_VEHICLE_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling vehicle maintenance history fetch requests
 * @param {PayloadAction<{ vehicleId: string; params?: any }>} action - The action containing the vehicleId and optional params
 * @returns {Generator} - A saga generator function
 */
function* fetchVehicleMaintenanceSaga(action: PayloadAction<{ vehicleId: string; params?: any }>): Generator {
  try {
    // LD1: Extract vehicleId and params from action payload
    const { vehicleId, params } = action.payload;
    logger.info(`Fetching maintenance history for vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId, params });

    // LD1: Try to fetch maintenance history using fleetService.getVehicleMaintenanceHistory with vehicleId and params
    const data: { maintenance: VehicleMaintenance[]; total: number } = yield call(fleetService.getVehicleMaintenanceHistory, vehicleId, params);

    // LD1: If successful, dispatch FETCH_VEHICLE_MAINTENANCE_SUCCESS action with maintenance records
    yield put({
      type: FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_SUCCESS,
      payload: data,
    });
    logger.debug(`Successfully fetched maintenance history for vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId, count: data.maintenance.length });
  } catch (error: any) {
    // LD1: If fetch fails, dispatch FETCH_VEHICLE_MAINTENANCE_FAILURE action with error message
    logger.error(`Failed to fetch maintenance history for vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling maintenance record creation requests
 * @param {PayloadAction<{ vehicleId: string; maintenanceData: any }>} action - The action containing the vehicleId and maintenanceData
 * @returns {Generator} - A saga generator function
 */
function* addMaintenanceRecordSaga(action: PayloadAction<{ vehicleId: string; maintenanceData: any }>): Generator {
  try {
    // LD1: Extract vehicleId and maintenanceData from action payload
    const { vehicleId, maintenanceData } = action.payload;
    logger.info(`Adding maintenance record for vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId, maintenanceData });

    // LD1: Try to add maintenance record using fleetService.scheduleVehicleMaintenance with vehicleId and maintenanceData
    const maintenanceRecord: VehicleMaintenance = yield call(fleetService.scheduleVehicleMaintenance, vehicleId, maintenanceData);

    // LD1: If successful, dispatch ADD_MAINTENANCE_RECORD_SUCCESS action with maintenance record
    yield put({
      type: FleetActionTypes.ADD_MAINTENANCE_RECORD_SUCCESS,
      payload: maintenanceRecord,
    });
    logger.debug(`Successfully added maintenance record for vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId, maintenanceRecordId: maintenanceRecord.maintenance_id });
  } catch (error: any) {
    // LD1: If addition fails, dispatch ADD_MAINTENANCE_RECORD_FAILURE action with error message
    logger.error(`Failed to add maintenance record for vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.ADD_MAINTENANCE_RECORD_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling vehicle utilization metrics fetch requests
 * @param {PayloadAction<{ vehicleId: string; params?: any }>} action - The action containing the vehicleId and optional params
 * @returns {Generator} - A saga generator function
 */
function* fetchVehicleUtilizationSaga(action: PayloadAction<{ vehicleId: string; params?: any }>): Generator {
  try {
    // LD1: Extract vehicleId and params from action payload
    const { vehicleId, params } = action.payload;
    logger.info(`Fetching utilization metrics for vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId, params });

    // LD1: Try to fetch utilization metrics using fleetService.getVehicleUtilization with vehicleId and params
    const utilization: VehicleUtilization = yield call(fleetService.getVehicleUtilization, vehicleId, params);

    // LD1: If successful, dispatch FETCH_VEHICLE_UTILIZATION_SUCCESS action with utilization data
    yield put({
      type: FleetActionTypes.FETCH_VEHICLE_UTILIZATION_SUCCESS,
      payload: utilization,
    });
    logger.debug(`Successfully fetched utilization metrics for vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId });
  } catch (error: any) {
    // LD1: If fetch fails, dispatch FETCH_VEHICLE_UTILIZATION_FAILURE action with error message
    logger.error(`Failed to fetch utilization metrics for vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.FETCH_VEHICLE_UTILIZATION_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling fleet-wide utilization metrics fetch requests
 * @param {PayloadAction<{ carrierId: string; params?: any }>} action - The action containing the carrierId and optional params
 * @returns {Generator} - A saga generator function
 */
function* fetchFleetUtilizationSaga(action: PayloadAction<{ carrierId: string; params?: any }>): Generator {
  try {
    // LD1: Extract carrierId and params from action payload
    const { carrierId, params } = action.payload;
    logger.info(`Fetching fleet utilization metrics for carrier ${carrierId}`, { component: 'fleetSaga', carrierId, params });

    // LD1: Try to fetch fleet utilization metrics using fleetService.getFleetPerformance with carrierId and params
    const fleetUtilization: VehiclePerformanceMetrics = yield call(fleetService.getFleetPerformance, carrierId, params);

    // LD1: If successful, dispatch FETCH_FLEET_UTILIZATION_SUCCESS action with fleet utilization data
    yield put({
      type: FleetActionTypes.FETCH_FLEET_UTILIZATION_SUCCESS,
      payload: fleetUtilization,
    });
    logger.debug(`Successfully fetched fleet utilization metrics for carrier ${carrierId}`, { component: 'fleetSaga', carrierId });
  } catch (error: any) {
    // LD1: If fetch fails, dispatch FETCH_FLEET_UTILIZATION_FAILURE action with error message
    logger.error(`Failed to fetch fleet utilization metrics for carrier ${action.payload.carrierId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.FETCH_FLEET_UTILIZATION_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling fleet summary statistics fetch requests
 * @param {PayloadAction<{ carrierId: string }>} action - The action containing the carrierId
 * @returns {Generator} - A saga generator function
 */
function* fetchFleetSummarySaga(action: PayloadAction<{ carrierId: string }>): Generator {
  try {
    // LD1: Extract carrierId from action payload
    const { carrierId } = action.payload;
    logger.info(`Fetching fleet summary for carrier ${carrierId}`, { component: 'fleetSaga', carrierId });

    // LD1: Try to fetch fleet summary using fleetService.getFleetSummary with carrierId
    const fleetSummary = yield call(fleetService.getFleetSummary, carrierId);

    // LD1: If successful, dispatch FETCH_FLEET_SUMMARY_SUCCESS action with summary data
    yield put({
      type: FleetActionTypes.FETCH_FLEET_SUMMARY_SUCCESS,
      payload: fleetSummary,
    });
    logger.debug(`Successfully fetched fleet summary for carrier ${carrierId}`, { component: 'fleetSaga', carrierId });
  } catch (error: any) {
    // LD1: If fetch fails, dispatch FETCH_FLEET_SUMMARY_FAILURE action with error message
    logger.error(`Failed to fetch fleet summary for carrier ${action.payload.carrierId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.FETCH_FLEET_SUMMARY_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling fetch requests for vehicles needing maintenance
 * @param {PayloadAction<{ carrierId: string }>} action - The action containing the carrierId
 * @returns {Generator} - A saga generator function
 */
function* fetchVehiclesNeedingMaintenanceSaga(action: PayloadAction<{ carrierId: string }>): Generator {
  try {
    // LD1: Extract carrierId from action payload
    const { carrierId } = action.payload;
    logger.info(`Fetching vehicles needing maintenance for carrier ${carrierId}`, { component: 'fleetSaga', carrierId });

    // LD1: Try to fetch vehicles needing maintenance using fleetService.getAllVehicles with carrierId and maintenance_due=true
    const { vehicles } = yield call(fleetService.getAllVehicles, { carrier_id: carrierId, maintenance_due: true });

    // LD1: If successful, dispatch FETCH_MAINTENANCE_NEEDED_SUCCESS action with vehicles data
    yield put({
      type: FleetActionTypes.FETCH_MAINTENANCE_NEEDED_SUCCESS,
      payload: vehicles,
    });
    logger.debug(`Successfully fetched vehicles needing maintenance for carrier ${carrierId}`, { component: 'fleetSaga', carrierId, count: vehicles.length });
  } catch (error: any) {
    // LD1: If fetch fails, dispatch FETCH_MAINTENANCE_NEEDED_FAILURE action with error message
    logger.error(`Failed to fetch vehicles needing maintenance for carrier ${action.payload.carrierId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.FETCH_MAINTENANCE_NEEDED_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling vehicle status update requests
 * @param {PayloadAction<{ vehicleId: string; status: string; notes?: string }>} action - The action containing the vehicleId, status, and optional notes
 * @returns {Generator} - A saga generator function
 */
function* updateVehicleStatusSaga(action: PayloadAction<{ vehicleId: string; status: string; notes?: string }>): Generator {
  try {
    // LD1: Extract vehicleId, status, and notes from action payload
    const { vehicleId, status, notes } = action.payload;
    logger.info(`Updating status of vehicle ${vehicleId} to ${status}`, { component: 'fleetSaga', vehicleId, status, notes });

    // LD1: Try to update vehicle status using fleetService.updateVehicleStatus with vehicleId, status, and notes
    const vehicle: Vehicle = yield call(fleetService.updateVehicleStatus, vehicleId, status as VehicleStatus, notes);

    // LD1: If successful, dispatch UPDATE_VEHICLE_STATUS_SUCCESS action with updated vehicle
    yield put({
      type: FleetActionTypes.UPDATE_VEHICLE_STATUS_SUCCESS,
      payload: vehicle,
    });
    logger.debug(`Successfully updated status of vehicle ${vehicleId} to ${status}`, { component: 'fleetSaga', vehicleId, status });
  } catch (error: any) {
    // LD1: If update fails, dispatch UPDATE_VEHICLE_STATUS_FAILURE action with error message
    logger.error(`Failed to update status of vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.UPDATE_VEHICLE_STATUS_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling driver assignment to vehicle requests
 * @param {PayloadAction<{ vehicleId: string; driverId: string }>} action - The action containing the vehicleId and driverId
 * @returns {Generator} - A saga generator function
 */
function* assignDriverSaga(action: PayloadAction<{ vehicleId: string; driverId: string }>): Generator {
  try {
    // LD1: Extract vehicleId and driverId from action payload
    const { vehicleId, driverId } = action.payload;
    logger.info(`Assigning driver ${driverId} to vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId, driverId });

    // LD1: Try to assign driver using fleetService.assignDriverToVehicle with vehicleId and driverId
    const vehicle: Vehicle = yield call(fleetService.assignDriverToVehicle, vehicleId, driverId);

    // LD1: If successful, dispatch ASSIGN_DRIVER_SUCCESS action with updated vehicle
    yield put({
      type: FleetActionTypes.ASSIGN_DRIVER_SUCCESS,
      payload: vehicle,
    });
    logger.debug(`Successfully assigned driver ${driverId} to vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId, driverId });
  } catch (error: any) {
    // LD1: If assignment fails, dispatch ASSIGN_DRIVER_FAILURE action with error message
    logger.error(`Failed to assign driver ${action.payload.driverId} to vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.ASSIGN_DRIVER_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling driver unassignment from vehicle requests
 * @param {PayloadAction<{ vehicleId: string }>} action - The action containing the vehicleId
 * @returns {Generator} - A saga generator function
 */
function* unassignDriverSaga(action: PayloadAction<{ vehicleId: string }>): Generator {
  try {
    // LD1: Extract vehicleId from action payload
    const { vehicleId } = action.payload;
    logger.info(`Unassigning driver from vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId });

    // LD1: Try to unassign driver using fleetService.unassignDriverFromVehicle with vehicleId
    const vehicle: Vehicle = yield call(fleetService.unassignDriverFromVehicle, vehicleId);

    // LD1: If unassignment fails, dispatch UNASSIGN_DRIVER_FAILURE action with error message
    yield put({
      type: FleetActionTypes.UNASSIGN_DRIVER_SUCCESS,
      payload: vehicle,
    });
    logger.debug(`Successfully unassigned driver from vehicle ${vehicleId}`, { component: 'fleetSaga', vehicleId });
  } catch (error: any) {
    // LD1: If unassignment fails, dispatch UNASSIGN_DRIVER_FAILURE action with error message
    logger.error(`Failed to unassign driver from vehicle ${action.payload.vehicleId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.UNASSIGN_DRIVER_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Saga for handling optimization recommendations fetch requests
 * @param {PayloadAction<{ carrierId: string }>} action - The action containing the carrierId
 * @returns {Generator} - A saga generator function
 */
function* fetchOptimizationRecommendationsSaga(action: PayloadAction<{ carrierId: string }>): Generator {
  try {
    // LD1: Extract carrierId from action payload
    const { carrierId } = action.payload;
    logger.info(`Fetching optimization recommendations for carrier ${carrierId}`, { component: 'fleetSaga', carrierId });

    // LD1: Try to fetch optimization recommendations using fleetService.getOptimizationRecommendations with carrierId
    const recommendations: FleetOptimizationRecommendations = yield call(fleetService.getOptimizationRecommendations, carrierId);

    // LD1: If successful, dispatch FETCH_OPTIMIZATION_RECOMMENDATIONS_SUCCESS action with recommendations
    yield put({
      type: FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_SUCCESS,
      payload: recommendations,
    });
     logger.debug(`Successfully fetched optimization recommendations for carrier ${carrierId}`, { component: 'fleetSaga', carrierId, count: recommendations.recommendations.length });
  } catch (error: any) {
    // LD1: If fetch fails, dispatch FETCH_OPTIMIZATION_RECOMMENDATIONS_FAILURE action with error message
    logger.error(`Failed to fetch optimization recommendations for carrier ${action.payload.carrierId}`, { component: 'fleetSaga', error });
    yield put({
      type: FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_FAILURE,
      payload: { error: error.message },
    });
  }
}

/**
 * Root saga watcher for fleet-related actions
 * @returns {Generator} - A saga generator function
 */
export function* watchFleet(): Generator {
  // LD1: Use all effect to combine multiple takeLatest effects:
  yield all([
    // LD1: takeLatest(FleetActionTypes.FETCH_VEHICLES_REQUEST, fetchVehiclesSaga)
    takeLatest(FleetActionTypes.FETCH_VEHICLES_REQUEST, fetchVehiclesSaga),
    // LD1: takeLatest(FleetActionTypes.FETCH_VEHICLE_DETAIL_REQUEST, fetchVehicleDetailSaga)
    takeLatest(FleetActionTypes.FETCH_VEHICLE_DETAIL_REQUEST, fetchVehicleDetailSaga),
    // LD1: takeLatest(FleetActionTypes.CREATE_VEHICLE_REQUEST, createVehicleSaga)
    takeLatest(FleetActionTypes.CREATE_VEHICLE_REQUEST, createVehicleSaga),
    // LD1: takeLatest(FleetActionTypes.UPDATE_VEHICLE_REQUEST, updateVehicleSaga)
    takeLatest(FleetActionTypes.UPDATE_VEHICLE_REQUEST, updateVehicleSaga),
    // LD1: takeLatest(FleetActionTypes.DELETE_VEHICLE_REQUEST, deleteVehicleSaga)
    takeLatest(FleetActionTypes.DELETE_VEHICLE_REQUEST, deleteVehicleSaga),
    // LD1: takeLatest(FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_REQUEST, fetchVehicleMaintenanceSaga)
    takeLatest(FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_REQUEST, fetchVehicleMaintenanceSaga),
    // LD1: takeLatest(FleetActionTypes.ADD_MAINTENANCE_RECORD_REQUEST, addMaintenanceRecordSaga)
    takeLatest(FleetActionTypes.ADD_MAINTENANCE_RECORD_REQUEST, addMaintenanceRecordSaga),
    // LD1: takeLatest(FleetActionTypes.FETCH_VEHICLE_UTILIZATION_REQUEST, fetchVehicleUtilizationSaga)
    takeLatest(FleetActionTypes.FETCH_VEHICLE_UTILIZATION_REQUEST, fetchVehicleUtilizationSaga),
    // LD1: takeLatest(FleetActionTypes.FETCH_FLEET_UTILIZATION_REQUEST, fetchFleetUtilizationSaga)
    takeLatest(FleetActionTypes.FETCH_FLEET_UTILIZATION_REQUEST, fetchFleetUtilizationSaga),
    // LD1: takeLatest(FleetActionTypes.FETCH_FLEET_SUMMARY_REQUEST, fetchFleetSummarySaga)
    takeLatest(FleetActionTypes.FETCH_FLEET_SUMMARY_REQUEST, fetchFleetSummarySaga),
    // LD1: takeLatest(FleetActionTypes.FETCH_MAINTENANCE_NEEDED_REQUEST, fetchVehiclesNeedingMaintenanceSaga)
    takeLatest(FleetActionTypes.FETCH_MAINTENANCE_NEEDED_REQUEST, fetchVehiclesNeedingMaintenanceSaga),
    // LD1: takeLatest(FleetActionTypes.UPDATE_VEHICLE_STATUS_REQUEST, updateVehicleStatusSaga)
    takeLatest(FleetActionTypes.UPDATE_VEHICLE_STATUS_REQUEST, updateVehicleStatusSaga),
    // LD1: takeLatest(FleetActionTypes.ASSIGN_DRIVER_REQUEST, assignDriverSaga)
    takeLatest(FleetActionTypes.ASSIGN_DRIVER_REQUEST, assignDriverSaga),
    // LD1: takeLatest(FleetActionTypes.UNASSIGN_DRIVER_REQUEST, unassignDriverSaga)
    takeLatest(FleetActionTypes.UNASSIGN_DRIVER_REQUEST, unassignDriverSaga),
    // LD1: takeLatest(FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_REQUEST, fetchOptimizationRecommendationsSaga)
    takeLatest(FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_REQUEST, fetchOptimizationRecommendationsSaga)
  ]);
}

// Default export of the fleet saga watcher for use in the root saga
export default watchFleet;