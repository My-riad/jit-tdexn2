import {
  all,
  call,
  fork,
  put,
  takeLatest, // redux-saga/effects version ^1.1.3
} from 'redux-saga/effects';
import * as carrierActions from '../actions/carrierActions';
import {
  CarrierCreationParams,
  CarrierFilterParams,
  CarrierNetworkStatistics,
  CarrierRecommendation,
  CarrierSummary,
  CarrierUpdateParams, // Internal import
} from '../../../common/interfaces/carrier.interface';
import { logger } from '../../../common/utils/logger'; // Internal import
import * as carrierService from '../../services/carrierService'; // Internal import

/**
 * @description Saga that handles fetching carriers with optional filtering.
 * @param {object} action - The action object containing payload for filtering.
 * @returns {Generator} Redux saga generator function.
 */
function* fetchCarriersSaga(action: any): Generator {
  try {
    // 1. Extract filter parameters from action payload
    const filterParams: CarrierFilterParams | undefined = action.payload;

    // 2. Try to call carrierService.getCarriers with filter parameters
    const { carriers, total }: any = yield call(
      carrierService.getCarriers,
      filterParams
    );

    // 3. If successful, dispatch fetchCarriersSuccess with the response data
    yield put(
      carrierActions.fetchCarriersSuccess({
        carriers,
        total,
        page: filterParams?.page || 1,
        limit: filterParams?.limit || 10,
      })
    );
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch fetchCarriersFailure with the error message
    logger.error('Error fetching carriers', { error });
    yield put(carrierActions.fetchCarriersFailure(error.message));
  }
}

/**
 * @description Saga that handles fetching a specific carrier by ID.
 * @param {object} action - The action object containing the carrier ID.
 * @returns {Generator} Redux saga generator function.
 */
function* fetchCarrierByIdSaga(action: any): Generator {
  try {
    // 1. Extract carrier ID from action payload
    const carrierId: string = action.payload;

    // 2. Try to call carrierService.getCarrierDetails with the carrier ID
    const carrier: any = yield call(carrierService.getCarrierDetails, carrierId);

    // 3. If successful, dispatch fetchCarrierByIdSuccess with the carrier data
    yield put(carrierActions.fetchCarrierByIdSuccess(carrier));
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch fetchCarrierByIdFailure with the error message
    logger.error(`Error fetching carrier with ID ${action.payload}`, { error });
    yield put(carrierActions.fetchCarrierByIdFailure(error.message));
  }
}

/**
 * @description Saga that handles creating a new carrier.
 * @param {object} action - The action object containing the carrier creation parameters.
 * @returns {Generator} Redux saga generator function.
 */
function* createCarrierSaga(action: any): Generator {
  try {
    // 1. Extract carrier creation parameters from action payload
    const carrierData: CarrierCreationParams = action.payload;

    // 2. Try to call carrierService API to create a new carrier
    const newCarrier: any = yield call(carrierService.createCarrier, carrierData);

    // 3. If successful, dispatch createCarrierSuccess with the created carrier
    yield put(carrierActions.createCarrierSuccess(newCarrier));
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch createCarrierFailure with the error message
    logger.error('Error creating carrier', { error });
    yield put(carrierActions.createCarrierFailure(error.message));
  }
}

/**
 * @description Saga that handles updating an existing carrier.
 * @param {object} action - The action object containing the carrier ID and update parameters.
 * @returns {Generator} Redux saga generator function.
 */
function* updateCarrierSaga(action: any): Generator {
  try {
    // 1. Extract carrier ID and update parameters from action payload
    const { carrierId, updates }: { carrierId: string; updates: CarrierUpdateParams } =
      action.payload;

    // 2. Try to call carrierService API to update the carrier
    const updatedCarrier: any = yield call(carrierService.updateCarrier, carrierId, updates);

    // 3. If successful, dispatch updateCarrierSuccess with the updated carrier
    yield put(carrierActions.updateCarrierSuccess(updatedCarrier));
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch updateCarrierFailure with the error message
    logger.error(`Error updating carrier with ID ${action.payload.carrierId}`, {
      error,
    });
    yield put(carrierActions.updateCarrierFailure(error.message));
  }
}

/**
 * @description Saga that handles deleting a carrier.
 * @param {object} action - The action object containing the carrier ID.
 * @returns {Generator} Redux saga generator function.
 */
function* deleteCarrierSaga(action: any): Generator {
  try {
    // 1. Extract carrier ID from action payload
    const carrierId: string = action.payload;

    // 2. Try to call carrierService API to delete the carrier
    yield call(carrierService.deleteCarrier, carrierId);

    // 3. If successful, dispatch deleteCarrierSuccess with the result
    yield put(carrierActions.deleteCarrierSuccess(carrierId));
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch deleteCarrierFailure with the error message
    logger.error(`Error deleting carrier with ID ${action.payload}`, { error });
    yield put(carrierActions.deleteCarrierFailure(error.message));
  }
}

/**
 * @description Saga that handles fetching drivers associated with a carrier.
 * @param {object} action - The action object containing the carrier ID.
 * @returns {Generator} Redux saga generator function.
 */
function* fetchCarrierDriversSaga(action: any): Generator {
  try {
    // 1. Extract carrier ID from action payload
    const { carrierId, page, limit } = action.payload;

    // 2. Try to call carrierService API to fetch carrier drivers
    const { drivers, total }: any = yield call(carrierService.getCarrierDrivers, carrierId, { page, limit });

    // 3. If successful, dispatch fetchCarrierDriversSuccess with the drivers data
    yield put(
      carrierActions.fetchCarrierDriversSuccess({
        drivers,
        total,
        page: page || 1,
        limit: limit || 10,
      })
    );
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch fetchCarrierDriversFailure with the error message
    logger.error(`Error fetching drivers for carrier with ID ${action.payload.carrierId}`, {
      error,
    });
    yield put(carrierActions.fetchCarrierDriversFailure(error.message));
  }
}

/**
 * @description Saga that handles fetching vehicles associated with a carrier.
 * @param {object} action - The action object containing the carrier ID.
 * @returns {Generator} Redux saga generator function.
 */
function* fetchCarrierVehiclesSaga(action: any): Generator {
  try {
    // 1. Extract carrier ID from action payload
    const { carrierId, page, limit } = action.payload;

    // 2. Try to call carrierService API to fetch carrier vehicles
    const { vehicles, total }: any = yield call(carrierService.getCarrierVehicles, carrierId, { page, limit });

    // 3. If successful, dispatch fetchCarrierVehiclesSuccess with the vehicles data
    yield put(
      carrierActions.fetchCarrierVehiclesSuccess({
        vehicles,
        total,
        page: page || 1,
        limit: limit || 10,
      })
    );
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch fetchCarrierVehiclesFailure with the error message
    logger.error(`Error fetching vehicles for carrier with ID ${action.payload.carrierId}`, {
      error,
    });
    yield put(carrierActions.fetchCarrierVehiclesFailure(error.message));
  }
}

/**
 * @description Saga that handles fetching performance metrics for a carrier.
 * @param {object} action - The action object containing the carrier ID and parameters.
 * @returns {Generator} Redux saga generator function.
 */
function* fetchCarrierPerformanceSaga(action: any): Generator {
  try {
    // 1. Extract carrier ID and parameters from action payload
    const { carrierId, startDate, endDate } = action.payload;

    // 2. Try to call carrierService.getCarrierPerformanceMetrics with the carrier ID and parameters
    const performanceMetrics: any = yield call(
      carrierService.getCarrierPerformanceMetrics,
      carrierId,
      { startDate, endDate }
    );

    // 3. If successful, dispatch fetchCarrierPerformanceSuccess with the performance metrics
    yield put(carrierActions.fetchCarrierPerformanceSuccess(performanceMetrics));
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch fetchCarrierPerformanceFailure with the error message
    logger.error(
      `Error fetching performance metrics for carrier with ID ${action.payload.carrierId}`,
      { error }
    );
    yield put(carrierActions.fetchCarrierPerformanceFailure(error.message));
  }
}

/**
 * @description Saga that handles fetching a summary for a carrier.
 * @param {object} action - The action object containing the carrier ID.
 * @returns {Generator} Redux saga generator function.
 */
function* fetchCarrierSummarySaga(action: any): Generator {
  try {
    // 1. Extract carrier ID from action payload
    const carrierId: string = action.payload;

    // 2. Try to call carrierService API to fetch carrier summary
    const carrierSummary: CarrierSummary = yield call(carrierService.getCarrierDetails, carrierId);

    // 3. If successful, dispatch fetchCarrierSummarySuccess with the summary data
    yield put(carrierActions.fetchCarrierSummarySuccess(carrierSummary));
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch fetchCarrierSummaryFailure with the error message
    logger.error(`Error fetching summary for carrier with ID ${action.payload}`, {
      error,
    });
    yield put(carrierActions.fetchCarrierSummaryFailure(error.message));
  }
}

/**
 * @description Saga that handles fetching carrier recommendations for a load.
 * @param {object} action - The action object containing the load ID and parameters.
 * @returns {Generator} Redux saga generator function.
 */
function* fetchCarrierRecommendationsSaga(action: any): Generator {
  try {
    // 1. Extract load ID and parameters from action payload
    const { loadId, limit } = action.payload;

    // 2. Try to call carrierService.getRecommendedCarriersForLoad with the load ID and parameters
    const { recommendations }: any = yield call(
      carrierService.getRecommendedCarriersForLoad,
      loadId,
      { limit }
    );

    // 3. If successful, dispatch fetchCarrierRecommendationsSuccess with the recommendations
    yield put(
      carrierActions.fetchCarrierRecommendationsSuccess({
        recommendations,
        total: recommendations.length, // Assuming the API returns the total count
      })
    );
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch fetchCarrierRecommendationsFailure with the error message
    logger.error(
      `Error fetching carrier recommendations for load with ID ${action.payload.loadId}`,
      { error }
    );
    yield put(carrierActions.fetchCarrierRecommendationsFailure(error.message));
  }
}

/**
 * @description Saga that handles fetching network statistics for a carrier.
 * @param {object} action - The action object containing the carrier ID and parameters.
 * @returns {Generator} Redux saga generator function.
 */
function* fetchCarrierNetworkStatsSaga(action: any): Generator {
  try {
    // 1. Extract carrier ID and parameters from action payload
    const { carrierId, startDate, endDate } = action.payload;

    // 2. Try to call carrierService.getCarrierNetworkStats with the carrier ID and parameters
    const networkStats: CarrierNetworkStatistics = yield call(
      carrierService.getCarrierNetworkStats,
      carrierId,
      { startDate, endDate }
    );

    // 3. If successful, dispatch fetchCarrierNetworkStatsSuccess with the network statistics
    yield put(carrierActions.fetchCarrierNetworkStatsSuccess(networkStats));
  } catch (error: any) {
    // 4. If an error occurs, log the error and dispatch fetchCarrierNetworkStatsFailure with the error message
    logger.error(
      `Error fetching network statistics for carrier with ID ${action.payload.carrierId}`,
      { error }
    );
    yield put(carrierActions.fetchCarrierNetworkStatsFailure(error.message));
  }
}

/**
 * @description Root saga watcher that listens for carrier-related actions and triggers the appropriate sagas.
 * @returns {Generator} Redux saga generator function.
 */
export default function* watchCarriers(): Generator {
  // 1. Yield all to combine multiple takeLatest effects
  yield all([
    // 2. Use takeLatest for FETCH_CARRIERS_REQUEST to handle fetchCarriersSaga
    takeLatest(carrierActions.FETCH_CARRIERS_REQUEST, fetchCarriersSaga),

    // 3. Use takeLatest for FETCH_CARRIER_REQUEST to handle fetchCarrierByIdSaga
    takeLatest(carrierActions.FETCH_CARRIER_REQUEST, fetchCarrierByIdSaga),

    // 4. Use takeLatest for CREATE_CARRIER_REQUEST to handle createCarrierSaga
    takeLatest(carrierActions.CREATE_CARRIER_REQUEST, createCarrierSaga),

    // 5. Use takeLatest for UPDATE_CARRIER_REQUEST to handle updateCarrierSaga
    takeLatest(carrierActions.UPDATE_CARRIER_REQUEST, updateCarrierSaga),

    // 6. Use takeLatest for DELETE_CARRIER_REQUEST to handle deleteCarrierSaga
    takeLatest(carrierActions.DELETE_CARRIER_REQUEST, deleteCarrierSaga),

    // 7. Use takeLatest for FETCH_CARRIER_DRIVERS_REQUEST to handle fetchCarrierDriversSaga
    takeLatest(carrierActions.FETCH_CARRIER_DRIVERS_REQUEST, fetchCarrierDriversSaga),

    // 8. Use takeLatest for FETCH_CARRIER_VEHICLES_REQUEST to handle fetchCarrierVehiclesSaga
    takeLatest(carrierActions.FETCH_CARRIER_VEHICLES_REQUEST, fetchCarrierVehiclesSaga),

    // 9. Use takeLatest for FETCH_CARRIER_PERFORMANCE_REQUEST to handle fetchCarrierPerformanceSaga
    takeLatest(carrierActions.FETCH_CARRIER_PERFORMANCE_REQUEST, fetchCarrierPerformanceSaga),

    // 10. Use takeLatest for FETCH_CARRIER_SUMMARY_REQUEST to handle fetchCarrierSummarySaga
    takeLatest(carrierActions.FETCH_CARRIER_SUMMARY_REQUEST, fetchCarrierSummarySaga),

    // 11. Use takeLatest for FETCH_CARRIER_RECOMMENDATIONS_REQUEST to handle fetchCarrierRecommendationsSaga
    takeLatest(carrierActions.FETCH_CARRIER_RECOMMENDATIONS_REQUEST, fetchCarrierRecommendationsSaga),

    // 12. Use takeLatest for FETCH_CARRIER_NETWORK_STATS_REQUEST to handle fetchCarrierNetworkStatsSaga
    takeLatest(carrierActions.FETCH_CARRIER_NETWORK_STATS_REQUEST, fetchCarrierNetworkStatsSaga),
  ]);
}