import { PayloadAction } from '@reduxjs/toolkit'; // redux-toolkit/PayloadAction
import { put, call, takeLatest, takeEvery, all, fork } from 'redux-saga/effects'; // redux-saga/effects
import { DriverActionTypes, fetchDriversSuccess, fetchDriversFailure, fetchDriverDetailSuccess, fetchDriverDetailFailure, createDriverSuccess, createDriverFailure, updateDriverSuccess, updateDriverFailure, deleteDriverSuccess, deleteDriverFailure, updateDriverAvailabilitySuccess, updateDriverAvailabilityFailure, fetchDriverAvailabilitySuccess, fetchDriverAvailabilityFailure, fetchDriverHOSSuccess, fetchDriverHOSFailure, fetchDriverPreferencesSuccess, fetchDriverPreferencesFailure, updateDriverPreferenceSuccess, updateDriverPreferenceFailure, fetchDriverScoreSuccess, fetchDriverScoreFailure, fetchDriverPerformanceSuccess, fetchDriverPerformanceFailure, fetchDriverLeaderboardSuccess, fetchDriverLeaderboardFailure, fetchDriversByStatusSuccess, fetchDriversByStatusFailure, fetchTopDriversSuccess, fetchTopDriversFailure, assignVehicleSuccess, assignVehicleFailure, unassignVehicleSuccess, unassignVehicleFailure, searchDriversSuccess, searchDriversFailure, validateDriverForLoadSuccess, validateDriverForLoadFailure } from '../actions/driverActions';
import { getAllDrivers, getDriverById, getDriverWithDetails, createDriver, updateDriver, deleteDriver, updateDriverStatus, getDriverAvailability, updateDriverAvailability, getDriverHOS, getDriverPreferences, updateDriverPreference, deleteDriverPreference, getDriverScore, getDriverPerformance, getDriverLeaderboard, getDriversByStatus, getTopPerformingDrivers, assignVehicleToDriver, unassignVehicleFromDriver, searchDrivers, validateDriverForLoad } from '../../services/driverService';
import logger from '../../../common/utils/logger';

/**
 * Saga worker function to fetch all drivers for a carrier
 * @param {PayloadAction<object>} action - The action containing optional parameters for filtering and pagination
 */
function* fetchDriversSaga(action: PayloadAction<object>): Generator {
  try {
    // LD1: Call getAllDrivers service with action.payload
    const result: any = yield call(getAllDrivers, action.payload);

    // LD1: If successful, dispatch fetchDriversSuccess action with the result
    yield put(fetchDriversSuccess(result));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriversFailure action with error message
    yield put(fetchDriversFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching drivers:', { error });
  }
}

/**
 * Saga worker function to fetch a specific driver's details
 * @param {PayloadAction<string>} action - The action containing the driver ID
 */
function* fetchDriverDetailSaga(action: PayloadAction<string>): Generator {
  try {
    // LD1: Call getDriverWithDetails service with driver ID from action.payload
    const driver: any = yield call(getDriverWithDetails, action.payload);

    // LD1: If successful, dispatch fetchDriverDetailSuccess action with the result
    yield put(fetchDriverDetailSuccess(driver));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriverDetailFailure action with error message
    yield put(fetchDriverDetailFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching driver details:', { error });
  }
}

/**
 * Saga worker function to create a new driver
 * @param {PayloadAction<DriverCreationParams>} action - The action containing the driver data
 */
function* createDriverSaga(action: PayloadAction<any>): Generator {
  try {
    // LD1: Call createDriver service with driver data from action.payload
    const newDriver: any = yield call(createDriver, action.payload);

    // LD1: If successful, dispatch createDriverSuccess action with the created driver
    yield put(createDriverSuccess(newDriver));
  } catch (error: any) {
    // LD1: If error occurs, dispatch createDriverFailure action with error message
    yield put(createDriverFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error creating driver:', { error });
  }
}

/**
 * Saga worker function to update an existing driver
 * @param {PayloadAction<{ driverId: string, driverData: DriverUpdateParams }>} action - The action containing the driver ID and update data
 */
function* updateDriverSaga(action: PayloadAction<{ driverId: string; driverData: any; }>): Generator {
  try {
    // LD1: Call updateDriver service with driver ID and update data from action.payload
    const updatedDriver: any = yield call(updateDriver, action.payload.driverId, action.payload.driverData);

    // LD1: If successful, dispatch updateDriverSuccess action with the updated driver
    yield put(updateDriverSuccess(updatedDriver));
  } catch (error: any) {
    // LD1: If error occurs, dispatch updateDriverFailure action with error message
    yield put(updateDriverFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error updating driver:', { error });
  }
}

/**
 * Saga worker function to delete a driver
 * @param {PayloadAction<string>} action - The action containing the driver ID
 */
function* deleteDriverSaga(action: PayloadAction<string>): Generator {
  try {
    // LD1: Call deleteDriver service with driver ID from action.payload
    yield call(deleteDriver, action.payload);

    // LD1: If successful, dispatch deleteDriverSuccess action with the driver ID
    yield put(deleteDriverSuccess(action.payload));
  } catch (error: any) {
    // LD1: If error occurs, dispatch deleteDriverFailure action with error message
    yield put(deleteDriverFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error deleting driver:', { error });
  }
}

/**
 * Saga worker function to update a driver's availability
 * @param {PayloadAction<{ driverId: string, availabilityData: Partial<DriverAvailability> }>} action - The action containing the driver ID and availability data
 */
function* updateDriverAvailabilitySaga(action: PayloadAction<{ driverId: string; availabilityData: any; }>): Generator {
  try {
    // LD1: Call updateDriverAvailability service with driver ID and availability data from action.payload
    const updatedAvailability: any = yield call(updateDriverAvailability, action.payload.driverId, action.payload.availabilityData);

    // LD1: If successful, dispatch updateDriverAvailabilitySuccess action with the updated availability
    yield put(updateDriverAvailabilitySuccess(updatedAvailability));
  } catch (error: any) {
    // LD1: If error occurs, dispatch updateDriverAvailabilityFailure action with error message
    yield put(updateDriverAvailabilityFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error updating driver availability:', { error });
  }
}

/**
 * Saga worker function to fetch a driver's availability
 * @param {PayloadAction<string>} action - The action containing the driver ID
 */
function* fetchDriverAvailabilitySaga(action: PayloadAction<string>): Generator {
  try {
    // LD1: Call getDriverAvailability service with driver ID from action.payload
    const availability: any = yield call(getDriverAvailability, action.payload);

    // LD1: If successful, dispatch fetchDriverAvailabilitySuccess action with the availability data
    yield put(fetchDriverAvailabilitySuccess(availability));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriverAvailabilityFailure action with error message
    yield put(fetchDriverAvailabilityFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching driver availability:', { error });
  }
}

/**
 * Saga worker function to fetch a driver's Hours of Service records
 * @param {PayloadAction<{ driverId: string, options?: object }>} action - The action containing the driver ID and options
 */
function* fetchDriverHOSSaga(action: PayloadAction<{ driverId: string; options?: object; }>): Generator {
  try {
    // LD1: Call getDriverHOS service with driver ID and options from action.payload
    const hosRecords: any = yield call(getDriverHOS, action.payload.driverId, action.payload.options);

    // LD1: If successful, dispatch fetchDriverHOSSuccess action with the HOS records
    yield put(fetchDriverHOSSuccess(hosRecords));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriverHOSFailure action with error message
    yield put(fetchDriverHOSFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching driver HOS:', { error });
  }
}

/**
 * Saga worker function to fetch a driver's preferences
 * @param {PayloadAction<string>} action - The action containing the driver ID
 */
function* fetchDriverPreferencesSaga(action: PayloadAction<string>): Generator {
  try {
    // LD1: Call getDriverPreferences service with driver ID from action.payload
    const preferences: any = yield call(getDriverPreferences, action.payload);

    // LD1: If successful, dispatch fetchDriverPreferencesSuccess action with the preferences
    yield put(fetchDriverPreferencesSuccess(preferences));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriverPreferencesFailure action with error message
    yield put(fetchDriverPreferencesFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching driver preferences:', { error });
  }
}

/**
 * Saga worker function to update a driver preference
 * @param {PayloadAction<{ driverId: string, preference: DriverPreference }>} action - The action containing the driver ID and preference
 */
function* updateDriverPreferenceSaga(action: PayloadAction<{ driverId: string; preference: any; }>): Generator {
  try {
    // LD1: Call updateDriverPreference service with driver ID and preference from action.payload
    const updatedPreference: any = yield call(updateDriverPreference, action.payload.driverId, action.payload.preference);

    // LD1: If successful, dispatch updateDriverPreferenceSuccess action with the updated preference
    yield put(updateDriverPreferenceSuccess(updatedPreference));
  } catch (error: any) {
    // LD1: If error occurs, dispatch updateDriverPreferenceFailure action with error message
    yield put(updateDriverPreferenceFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error updating driver preference:', { error });
  }
}

/**
 * Saga worker function to fetch a driver's efficiency score
 * @param {PayloadAction<string>} action - The action containing the driver ID
 */
function* fetchDriverScoreSaga(action: PayloadAction<string>): Generator {
  try {
    // LD1: Call getDriverScore service with driver ID from action.payload
    const score: any = yield call(getDriverScore, action.payload);

    // LD1: If successful, dispatch fetchDriverScoreSuccess action with the score data
    yield put(fetchDriverScoreSuccess(score));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriverScoreFailure action with error message
    yield put(fetchDriverScoreFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching driver score:', { error });
  }
}

/**
 * Saga worker function to fetch a driver's performance metrics
 * @param {PayloadAction<{ driverId: string, params?: object }>} action - The action containing the driver ID and params
 */
function* fetchDriverPerformanceSaga(action: PayloadAction<{ driverId: string; params?: object; }>): Generator {
  try {
    // LD1: Call getDriverPerformance service with driver ID and params from action.payload
    const metrics: any = yield call(getDriverPerformance, action.payload.driverId, action.payload.params);

    // LD1: If successful, dispatch fetchDriverPerformanceSuccess action with the performance metrics
    yield put(fetchDriverPerformanceSuccess(metrics));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriverPerformanceFailure action with error message
    yield put(fetchDriverPerformanceFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching driver performance:', { error });
  }
}

/**
 * Saga worker function to fetch the driver leaderboard
 * @param {PayloadAction<object>} action - The action containing optional parameters for filtering and pagination
 */
function* fetchDriverLeaderboardSaga(action: PayloadAction<object>): Generator {
  try {
    // LD1: Call getDriverLeaderboard service with params from action.payload
    const leaderboardData: any = yield call(getDriverLeaderboard, action.payload);

    // LD1: If successful, dispatch fetchDriverLeaderboardSuccess action with the leaderboard data
    yield put(fetchDriverLeaderboardSuccess(leaderboardData));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriverLeaderboardFailure action with error message
    yield put(fetchDriverLeaderboardFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching driver leaderboard:', { error });
  }
}

/**
 * Saga worker function to fetch drivers filtered by status
 * @param {PayloadAction<{ status: DriverStatus, params?: object }>} action - The action containing the status and params
 */
function* fetchDriversByStatusSaga(action: PayloadAction<{ status: any; params?: object; }>): Generator {
  try {
    // LD1: Call getDriversByStatus service with status and params from action.payload
    const result: any = yield call(getDriversByStatus, action.payload.status, action.payload.params);

    // LD1: If successful, dispatch fetchDriversByStatusSuccess action with the filtered drivers
    yield put(fetchDriversByStatusSuccess(result));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchDriversByStatusFailure action with error message
    yield put(fetchDriversByStatusFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching drivers by status:', { error });
  }
}

/**
 * Saga worker function to fetch top performing drivers
 * @param {PayloadAction<number>} action - The action containing the limit
 */
function* fetchTopDriversSaga(action: PayloadAction<number>): Generator {
  try {
    // LD1: Call getTopPerformingDrivers service with limit from action.payload
    const result: any = yield call(getTopPerformingDrivers, action.payload);

    // LD1: If successful, dispatch fetchTopDriversSuccess action with the top drivers
    yield put(fetchTopDriversSuccess(result));
  } catch (error: any) {
    // LD1: If error occurs, dispatch fetchTopDriversFailure action with error message
    yield put(fetchTopDriversFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error fetching top drivers:', { error });
  }
}

/**
 * Saga worker function to assign a vehicle to a driver
 * @param {PayloadAction<{ driverId: string, vehicleId: string }>} action - The action containing the driver ID and vehicle ID
 */
function* assignVehicleSaga(action: PayloadAction<{ driverId: string; vehicleId: string; }>): Generator {
  try {
    // LD1: Call assignVehicleToDriver service with driver ID and vehicle ID from action.payload
    const updatedDriver: any = yield call(assignVehicleToDriver, action.payload.driverId, action.payload.vehicleId);

    // LD1: If successful, dispatch assignVehicleSuccess action with the updated driver
    yield put(assignVehicleSuccess(updatedDriver));
  } catch (error: any) {
    // LD1: If error occurs, dispatch assignVehicleFailure action with error message
    yield put(assignVehicleFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error assigning vehicle to driver:', { error });
  }
}

/**
 * Saga worker function to unassign a vehicle from a driver
 * @param {PayloadAction<string>} action - The action containing the driver ID
 */
function* unassignVehicleSaga(action: PayloadAction<string>): Generator {
  try {
    // LD1: Call unassignVehicleFromDriver service with driver ID from action.payload
    const updatedDriver: any = yield call(unassignVehicleFromDriver, action.payload);

    // LD1: If successful, dispatch unassignVehicleSuccess action with the updated driver
    yield put(unassignVehicleSuccess(updatedDriver));
  } catch (error: any) {
    // LD1: If error occurs, dispatch unassignVehicleFailure action with error message
    yield put(unassignVehicleFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error unassigning vehicle from driver:', { error });
  }
}

/**
 * Saga worker function to search for drivers with various criteria
 * @param {PayloadAction<DriverSearchParams>} action - The action containing the search parameters
 */
function* searchDriversSaga(action: PayloadAction<any>): Generator {
  try {
    // LD1: Call searchDrivers service with search parameters from action.payload
    const searchResults: any = yield call(searchDrivers, action.payload);

    // LD1: If successful, dispatch searchDriversSuccess action with the search results
    yield put(searchDriversSuccess(searchResults));
  } catch (error: any) {
    // LD1: If error occurs, dispatch searchDriversFailure action with error message
    yield put(searchDriversFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error searching drivers:', { error });
  }
}

/**
 * Saga worker function to validate if a driver is eligible for a load
 * @param {PayloadAction<{ driverId: string, loadDetails: object }>} action - The action containing the driver ID and load details
 */
function* validateDriverForLoadSaga(action: PayloadAction<{ driverId: string; loadDetails: object; }>): Generator {
  try {
    // LD1: Call validateDriverForLoad service with driver ID and load details from action.payload
    const validationResult: any = yield call(validateDriverForLoad, action.payload.driverId, action.payload.loadDetails);

    // LD1: If successful, dispatch validateDriverForLoadSuccess action with the validation result
    yield put(validateDriverForLoadSuccess(validationResult));
  } catch (error: any) {
    // LD1: If error occurs, dispatch validateDriverForLoadFailure action with error message
    yield put(validateDriverForLoadFailure(error.message));

    // LD1: Log any errors that occur during the process
    logger.error('Error validating driver for load:', { error });
  }
}

/**
 * Root saga watcher that listens for driver-related actions and triggers the appropriate saga workers
 */
function* watchDriver(): Generator {
  // LD1: Use all effect to combine multiple takeLatest/takeEvery effects:
  yield all([
    // LD1: Listen for FETCH_DRIVERS_REQUEST action and trigger fetchDriversSaga
    takeLatest(DriverActionTypes.FETCH_DRIVERS_REQUEST, fetchDriversSaga),

    // LD1: Listen for FETCH_DRIVER_DETAIL_REQUEST action and trigger fetchDriverDetailSaga
    takeLatest(DriverActionTypes.FETCH_DRIVER_DETAIL_REQUEST, fetchDriverDetailSaga),

    // LD1: Listen for CREATE_DRIVER_REQUEST action and trigger createDriverSaga
    takeLatest(DriverActionTypes.CREATE_DRIVER_REQUEST, createDriverSaga),

    // LD1: Listen for UPDATE_DRIVER_REQUEST action and trigger updateDriverSaga
    takeLatest(DriverActionTypes.UPDATE_DRIVER_REQUEST, updateDriverSaga),

    // LD1: Listen for DELETE_DRIVER_REQUEST action and trigger deleteDriverSaga
    takeLatest(DriverActionTypes.DELETE_DRIVER_REQUEST, deleteDriverSaga),

    // LD1: Listen for UPDATE_DRIVER_AVAILABILITY_REQUEST action and trigger updateDriverAvailabilitySaga
    takeLatest(DriverActionTypes.UPDATE_DRIVER_AVAILABILITY_REQUEST, updateDriverAvailabilitySaga),

    // LD1: Listen for FETCH_DRIVER_AVAILABILITY_REQUEST action and trigger fetchDriverAvailabilitySaga
    takeLatest(DriverActionTypes.FETCH_DRIVER_AVAILABILITY_REQUEST, fetchDriverAvailabilitySaga),

    // LD1: Listen for FETCH_DRIVER_HOS_REQUEST action and trigger fetchDriverHOSSaga
    takeLatest(DriverActionTypes.FETCH_DRIVER_HOS_REQUEST, fetchDriverHOSSaga),

    // LD1: Listen for FETCH_DRIVER_PREFERENCES_REQUEST action and trigger fetchDriverPreferencesSaga
    takeLatest(DriverActionTypes.FETCH_DRIVER_PREFERENCES_REQUEST, fetchDriverPreferencesSaga),

    // LD1: Listen for UPDATE_DRIVER_PREFERENCE_REQUEST action and trigger updateDriverPreferenceSaga
    takeLatest(DriverActionTypes.UPDATE_DRIVER_PREFERENCE_REQUEST, updateDriverPreferenceSaga),

    // LD1: Listen for FETCH_DRIVER_SCORE_REQUEST action and trigger fetchDriverScoreSaga
    takeLatest(DriverActionTypes.FETCH_DRIVER_SCORE_REQUEST, fetchDriverScoreSaga),

    // LD1: Listen for FETCH_DRIVER_PERFORMANCE_REQUEST action and trigger fetchDriverPerformanceSaga
    takeLatest(DriverActionTypes.FETCH_DRIVER_PERFORMANCE_REQUEST, fetchDriverPerformanceSaga),

    // LD1: Listen for FETCH_DRIVER_LEADERBOARD_REQUEST action and trigger fetchDriverLeaderboardSaga
    takeLatest(DriverActionTypes.FETCH_DRIVER_LEADERBOARD_REQUEST, fetchDriverLeaderboardSaga),

    // LD1: Listen for FETCH_DRIVERS_BY_STATUS_REQUEST action and trigger fetchDriversByStatusSaga
    takeLatest(DriverActionTypes.FETCH_DRIVERS_BY_STATUS_REQUEST, fetchDriversByStatusSaga),

    // LD1: Listen for FETCH_TOP_DRIVERS_REQUEST action and trigger fetchTopDriversSaga
    takeLatest(DriverActionTypes.FETCH_TOP_DRIVERS_REQUEST, fetchTopDriversSaga),

    // LD1: Listen for ASSIGN_VEHICLE_REQUEST action and trigger assignVehicleSaga
    takeLatest(DriverActionTypes.ASSIGN_VEHICLE_REQUEST, assignVehicleSaga),

    // LD1: Listen for UNASSIGN_VEHICLE_REQUEST action and trigger unassignVehicleSaga
    takeLatest(DriverActionTypes.UNASSIGN_VEHICLE_REQUEST, unassignVehicleSaga),

    // LD1: Listen for SEARCH_DRIVERS_REQUEST action and trigger searchDriversSaga
    takeLatest(DriverActionTypes.SEARCH_DRIVERS_REQUEST, searchDriversSaga),

    // LD1: Listen for VALIDATE_DRIVER_FOR_LOAD_REQUEST action and trigger validateDriverForLoadSaga
    takeLatest(DriverActionTypes.VALIDATE_DRIVER_FOR_LOAD_REQUEST, validateDriverForLoadSaga),
  ]);
}

// Export the default saga watcher for use in the root saga
export default watchDriver;