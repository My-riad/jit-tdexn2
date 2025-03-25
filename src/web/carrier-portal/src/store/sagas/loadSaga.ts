import { PayloadAction } from '@reduxjs/toolkit'; // redux-saga/toolkit v1.9.0
import { call, put, takeLatest, all, select } from 'redux-saga/effects'; // redux-saga/effects v1.2.1
import {
  LoadActionTypes,
  fetchLoadsSuccess,
  fetchLoadsFailure,
  fetchLoadDetailSuccess,
  fetchLoadDetailFailure,
  createLoadSuccess,
  createLoadFailure,
  updateLoadSuccess,
  updateLoadFailure,
  deleteLoadSuccess,
  deleteLoadFailure,
  updateLoadStatusSuccess,
  updateLoadStatusFailure,
  fetchLoadDocumentsSuccess,
  fetchLoadDocumentsFailure,
  uploadDocumentSuccess,
  uploadDocumentFailure,
  deleteDocumentSuccess,
  deleteDocumentFailure,
  fetchOptimizationsSuccess,
  fetchOptimizationsFailure,
  assignLoadSuccess,
  assignLoadFailure,
  fetchDriverRecommendationsSuccess,
  fetchDriverRecommendationsFailure,
  applyOptimizationSuccess,
  applyOptimizationFailure,
  fetchLoadsByStatusSuccess,
  fetchLoadsByStatusFailure,
  fetchActiveLoadsSuccess,
  fetchActiveLoadsFailure,
  fetchPendingLoadsSuccess,
  fetchPendingLoadsFailure,
  fetchCompletedLoadsSuccess,
  fetchCompletedLoadsFailure,
  fetchUpcomingDeliveriesSuccess,
  fetchUpcomingDeliveriesFailure
} from '../actions/loadActions';
import {
  getCarrierLoads,
  getLoadDetails,
  createCarrierLoad,
  updateCarrierLoad,
  deleteCarrierLoad,
  updateLoadStatusForCarrier,
  getLoadDocumentsForCarrier,
  uploadLoadDocumentForCarrier,
  deleteLoadDocumentForCarrier,
  assignLoadToDriver,
  getLoadOptimizationOpportunities
} from '../../services/loadService';
import { validateDriverForLoad } from '../../services/driverService';
import { getOptimizationRecommendations, applyOptimizationRecommendation } from '../../services/optimizationService';
import { RootState } from '../reducers/rootReducer';
import logger from '../../../common/utils/logger';

/**
 * Saga for fetching loads for a carrier
 * @param action 
 */
function* fetchLoadsSaga(action: PayloadAction<{ carrierId: string, searchParams?: any }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract carrierId and search parameters from action payload
    const { carrierId, searchParams } = action.payload;

    // LD1: Call getCarrierLoads service with carrierId and search parameters
    const { loads, total, page, limit } = yield call(getCarrierLoads, carrierId, searchParams);

    // LD1: Dispatch fetchLoadsSuccess action with the response data
    yield put(fetchLoadsSuccess({ loads, total, page, limit }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch loads', { error });

    // LD1: Dispatch fetchLoadsFailure action with the error message
    yield put(fetchLoadsFailure(error.message));
  }
}

/**
 * Saga for fetching detailed information for a specific load
 * @param action 
 */
function* fetchLoadDetailSaga(action: PayloadAction<{ loadId: string }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId from action payload
    const { loadId } = action.payload;

    // LD1: Call getLoadDetails service with loadId
    const load = yield call(getLoadDetails, loadId);

    // LD1: Dispatch fetchLoadDetailSuccess action with the response data
    yield put(fetchLoadDetailSuccess({ load }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch load detail', { error });

    // LD1: Dispatch fetchLoadDetailFailure action with the error message
    yield put(fetchLoadDetailFailure(error.message));
  }
}

/**
 * Saga for creating a new load for a carrier
 * @param action 
 */
function* createLoadSaga(action: PayloadAction<{ carrierId: string, loadData: any }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract carrierId and loadData from action payload
    const { carrierId, loadData } = action.payload;

    // LD1: Call createCarrierLoad service with carrierId and loadData
    const load = yield call(createCarrierLoad, carrierId, loadData);

    // LD1: Dispatch createLoadSuccess action with the response data
    yield put(createLoadSuccess({ load }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to create load', { error });

    // LD1: Dispatch createLoadFailure action with the error message
    yield put(createLoadFailure(error.message));
  }
}

/**
 * Saga for updating an existing load
 * @param action 
 */
function* updateLoadSaga(action: PayloadAction<{ loadId: string, loadData: any }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId and updateData from action payload
    const { loadId, loadData } = action.payload;

    // LD1: Call updateCarrierLoad service with loadId and updateData
    const load = yield call(updateCarrierLoad, loadId, loadData);

    // LD1: Dispatch updateLoadSuccess action with the response data
    yield put(updateLoadSuccess({ load }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to update load', { error });

    // LD1: Dispatch updateLoadFailure action with the error message
    yield put(updateLoadFailure(error.message));
  }
}

/**
 * Saga for deleting a load
 * @param action 
 */
function* deleteLoadSaga(action: PayloadAction<{ loadId: string }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId from action payload
    const { loadId } = action.payload;

    // LD1: Call deleteCarrierLoad service with loadId
    yield call(deleteCarrierLoad, loadId);

    // LD1: Dispatch deleteLoadSuccess action with the loadId
    yield put(deleteLoadSuccess({ loadId }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to delete load', { error });

    // LD1: Dispatch deleteLoadFailure action with the error message
    yield put(deleteLoadFailure(error.message));
  }
}

/**
 * Saga for updating the status of a load
 * @param action 
 */
function* updateLoadStatusSaga(action: PayloadAction<{ loadId: string, statusData: any, coordinates: any }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId, status, statusDetails, and coordinates from action payload
    const { loadId, statusData, coordinates } = action.payload;

    // LD1: Call updateLoadStatusForCarrier service with loadId, status, statusDetails, and coordinates
    const load = yield call(updateLoadStatusForCarrier, loadId, statusData.status, statusData.statusDetails, coordinates);

    // LD1: Dispatch updateLoadStatusSuccess action with the response data
    yield put(updateLoadStatusSuccess({ loadId, status: load.status, statusDetails: load.statusDetails }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to update load status', { error });

    // LD1: Dispatch updateLoadStatusFailure action with the error message
    yield put(updateLoadStatusFailure(error.message));
  }
}

/**
 * Saga for fetching documents associated with a load
 * @param action 
 */
function* fetchLoadDocumentsSaga(action: PayloadAction<{ loadId: string }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId and documentType from action payload
    const { loadId } = action.payload;

    // LD1: Call getLoadDocumentsForCarrier service with loadId and documentType
    const documents = yield call(getLoadDocumentsForCarrier, loadId);

    // LD1: Dispatch fetchLoadDocumentsSuccess action with the response data
    yield put(fetchLoadDocumentsSuccess({ loadId, documents }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch load documents', { error });

    // LD1: Dispatch fetchLoadDocumentsFailure action with the error message
    yield put(fetchLoadDocumentsFailure(error.message));
  }
}

/**
 * Saga for uploading a document to a load
 * @param action 
 */
function* uploadDocumentSaga(action: PayloadAction<{ loadId: string, file: File, documentType: string, metadata?: Record<string, any> }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId and formData from action payload
    const { loadId, file, documentType, metadata } = action.payload;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // LD1: Call uploadLoadDocumentForCarrier service with loadId and formData
    const document = yield call(uploadLoadDocumentForCarrier, loadId, formData);

    // LD1: Dispatch uploadDocumentSuccess action with the response data
    yield put(uploadDocumentSuccess({ loadId, document }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to upload document', { error });

    // LD1: Dispatch uploadDocumentFailure action with the error message
    yield put(uploadDocumentFailure(error.message));
  }
}

/**
 * Saga for deleting a document from a load
 * @param action 
 */
function* deleteDocumentSaga(action: PayloadAction<{ loadId: string, documentId: string }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId and documentId from action payload
    const { loadId, documentId } = action.payload;

    // LD1: Call deleteLoadDocumentForCarrier service with loadId and documentId
    yield call(deleteLoadDocumentForCarrier, loadId, documentId);

    // LD1: Dispatch deleteDocumentSuccess action with the documentId
    yield put(deleteDocumentSuccess({ loadId, documentId }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to delete document', { error });

    // LD1: Dispatch deleteDocumentFailure action with the error message
    yield put(deleteDocumentFailure(error.message));
  }
}

/**
 * Saga for fetching optimization recommendations for loads
 * @param action 
 */
function* fetchOptimizationsSaga(action: PayloadAction<{ carrierId: string }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract carrierId from action payload
    const { carrierId } = action.payload;

    // LD1: Call getLoadOptimizationOpportunities service with carrierId
    const recommendations = yield call(getLoadOptimizationOpportunities, carrierId);

    // LD1: Dispatch fetchOptimizationsSuccess action with the response data
    yield put(fetchOptimizationsSuccess({ recommendations }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch optimizations', { error });

    // LD1: Dispatch fetchOptimizationsFailure action with the error message
    yield put(fetchOptimizationsFailure(error.message));
  }
}

/**
 * Saga for assigning a load to a driver
 * @param action 
 */
function* assignLoadSaga(action: PayloadAction<{ loadId: string, driverId: string, vehicleId: string, assignmentData: any }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId, driverId, vehicleId, and assignmentData from action payload
    const { loadId, driverId, vehicleId, assignmentData } = action.payload;

    // LD1: Call validateDriverForLoad service to check if driver is eligible for the load
    const validationResult = yield call(validateDriverForLoad, driverId, { loadId });

    // LD1: If driver is not eligible, throw an error with the reasons
    if (!validationResult.eligible) {
      throw new Error(`Driver is not eligible for this load. Reasons: ${validationResult.reasons?.join(', ') || 'Unknown reasons'}`);
    }

    // LD1: Call assignLoadToDriver service with loadId, driverId, vehicleId, and assignmentData
    const assignment = yield call(assignLoadToDriver, loadId, driverId, vehicleId, assignmentData);

    // LD1: Dispatch assignLoadSuccess action with the response data
    yield put(assignLoadSuccess({ loadId, assignment }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to assign load', { error });

    // LD1: Dispatch assignLoadFailure action with the error message
    yield put(assignLoadFailure(error.message));
  }
}

/**
 * Saga for fetching driver recommendations for a load
 * @param action 
 */
function* fetchDriverRecommendationsSaga(action: PayloadAction<{ loadId: string }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract loadId from action payload
    const { loadId } = action.payload;

    // LD1: Get the load details using getLoadDetails service
    const load = yield call(getLoadDetails, loadId);

    // LD1: Use the load details to get driver recommendations from the optimization service
    const recommendations = yield call(getOptimizationRecommendations, load.shipperId);

    // LD1: Dispatch fetchDriverRecommendationsSuccess action with the recommendations
    yield put(fetchDriverRecommendationsSuccess({ driverId: load.shipperId, recommendations }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch driver recommendations', { error });

    // LD1: Dispatch fetchDriverRecommendationsFailure action with the error message
    yield put(fetchDriverRecommendationsFailure(error.message));
  }
}

/**
 * Saga for applying an optimization recommendation
 * @param action 
 */
function* applyOptimizationSaga(action: PayloadAction<{ recommendationId: string, loadIds: string[] }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract recommendationId from action payload
    const { recommendationId } = action.payload;

    // LD1: Call applyOptimizationRecommendation service with recommendationId
    yield call(applyOptimizationRecommendation, recommendationId);

    // LD1: Dispatch applyOptimizationSuccess action with the response data
    yield put(applyOptimizationSuccess({ recommendationId, affectedLoads: [] }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to apply optimization', { error });

    // LD1: Dispatch applyOptimizationFailure action with the error message
    yield put(applyOptimizationFailure(error.message));
  }
}

/**
 * Saga for fetching loads filtered by status
 * @param action 
 */
function* fetchLoadsByStatusSaga(action: PayloadAction<{ carrierId: string, status: LoadStatus[], page?: number, limit?: number }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract carrierId, status, and search parameters from action payload
    const { carrierId, status, page, limit } = action.payload;
    const searchParams = { status, page, limit };

    // LD1: Call getCarrierLoads service with carrierId and search parameters including status filter
    const { loads, total } = yield call(getCarrierLoads, carrierId, searchParams);

    // LD1: Dispatch fetchLoadsByStatusSuccess action with the response data
    yield put(fetchLoadsByStatusSuccess({ loads, total, page: searchParams.page || 1, limit: searchParams.limit || 10 }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch loads by status', { error });

    // LD1: Dispatch fetchLoadsByStatusFailure action with the error message
    yield put(fetchLoadsByStatusFailure(error.message));
  }
}

/**
 * Saga for fetching active loads for a carrier
 * @param action 
 */
function* fetchActiveLoadsSaga(action: PayloadAction<{ carrierId: string, page?: number, limit?: number }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract carrierId from action payload
    const { carrierId, page, limit } = action.payload;
    const searchParams = { page, limit };

    // LD1: Call getCarrierLoads service with carrierId and active status filter
    const { loads, total } = yield call(getCarrierLoads, carrierId, searchParams);

    // LD1: Dispatch fetchActiveLoadsSuccess action with the response data
    yield put(fetchActiveLoadsSuccess({ loads, total, page: searchParams.page || 1, limit: searchParams.limit || 10 }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch active loads', { error });

    // LD1: Dispatch fetchActiveLoadsFailure action with the error message
    yield put(fetchActiveLoadsFailure(error.message));
  }
}

/**
 * Saga for fetching pending loads for a carrier
 * @param action 
 */
function* fetchPendingLoadsSaga(action: PayloadAction<{ carrierId: string, page?: number, limit?: number }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract carrierId from action payload
    const { carrierId, page, limit } = action.payload;
    const searchParams = { page, limit };

    // LD1: Call getCarrierLoads service with carrierId and pending status filter
    const { loads, total } = yield call(getCarrierLoads, carrierId, searchParams);

    // LD1: Dispatch fetchPendingLoadsSuccess action with the response data
    yield put(fetchPendingLoadsSuccess({ loads, total, page: searchParams.page || 1, limit: searchParams.limit || 10 }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch pending loads', { error });

    // LD1: Dispatch fetchPendingLoadsFailure action with the error message
    yield put(fetchPendingLoadsFailure(error.message));
  }
}

/**
 * Saga for fetching completed loads for a carrier
 * @param action 
 */
function* fetchCompletedLoadsSaga(action: PayloadAction<{ carrierId: string, page?: number, limit?: number }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract carrierId from action payload
    const { carrierId, page, limit } = action.payload;
    const searchParams = { page, limit };

    // LD1: Call getCarrierLoads service with carrierId and completed status filter
    const { loads, total } = yield call(getCarrierLoads, carrierId, searchParams);

    // LD1: Dispatch fetchCompletedLoadsSuccess action with the response data
    yield put(fetchCompletedLoadsSuccess({ loads, total, page: searchParams.page || 1, limit: searchParams.limit || 10 }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch completed loads', { error });

    // LD1: Dispatch fetchCompletedLoadsFailure action with the error message
    yield put(fetchCompletedLoadsFailure(error.message));
  }
}

/**
 * Saga for fetching upcoming deliveries for a carrier
 * @param action 
 */
function* fetchUpcomingDeliveriesSaga(action: PayloadAction<{ carrierId: string, days?: number, limit?: number }>): Generator {
  try {
    // LD1: Try to execute the following steps
    // LD1: Extract carrierId from action payload
    const { carrierId, days, limit } = action.payload;
    const searchParams = { days, limit };

    // LD1: Call getCarrierLoads service with carrierId and upcoming delivery filter
    const { loads, total } = yield call(getCarrierLoads, carrierId, searchParams);

    // LD1: Dispatch fetchUpcomingDeliveriesSuccess action with the response data
    yield put(fetchUpcomingDeliveriesSuccess({ loads, total }));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch upcoming deliveries', { error });

    // LD1: Dispatch fetchUpcomingDeliveriesFailure action with the error message
    yield put(fetchUpcomingDeliveriesFailure(error.message));
  }
}

/**
 * Selector function to get the current carrier ID from the state
 * @param state 
 */
const getCarrierIdSelector = (state: RootState): string => state.auth.user?.carrierId || '';

/**
 * Root saga watcher for load-related actions
 */
export function* watchLoad() {
  // LD1: Use all effect to combine all takeLatest effects:
  yield all([
    // LD1: takeLatest(FETCH_LOADS_REQUEST, fetchLoadsSaga)
    takeLatest(LoadActionTypes.FETCH_LOADS_REQUEST, fetchLoadsSaga),
    // LD1: takeLatest(FETCH_LOAD_DETAIL_REQUEST, fetchLoadDetailSaga)
    takeLatest(LoadActionTypes.FETCH_LOAD_DETAIL_REQUEST, fetchLoadDetailSaga),
    // LD1: takeLatest(CREATE_LOAD_REQUEST, createLoadSaga)
    takeLatest(LoadActionTypes.CREATE_LOAD_REQUEST, createLoadSaga),
    // LD1: takeLatest(UPDATE_LOAD_REQUEST, updateLoadSaga)
    takeLatest(LoadActionTypes.UPDATE_LOAD_REQUEST, updateLoadSaga),
    // LD1: takeLatest(DELETE_LOAD_REQUEST, deleteLoadSaga)
    takeLatest(LoadActionTypes.DELETE_LOAD_REQUEST, deleteLoadSaga),
    // LD1: takeLatest(UPDATE_LOAD_STATUS_REQUEST, updateLoadStatusSaga)
    takeLatest(LoadActionTypes.UPDATE_LOAD_STATUS_REQUEST, updateLoadStatusSaga),
    // LD1: takeLatest(FETCH_LOAD_DOCUMENTS_REQUEST, fetchLoadDocumentsSaga)
    takeLatest(LoadActionTypes.FETCH_LOAD_DOCUMENTS_REQUEST, fetchLoadDocumentsSaga),
    // LD1: takeLatest(UPLOAD_DOCUMENT_REQUEST, uploadDocumentSaga)
    takeLatest(LoadActionTypes.UPLOAD_DOCUMENT_REQUEST, uploadDocumentSaga),
    // LD1: takeLatest(DELETE_DOCUMENT_REQUEST, deleteDocumentSaga)
    takeLatest(LoadActionTypes.DELETE_DOCUMENT_REQUEST, deleteDocumentSaga),
    // LD1: takeLatest(FETCH_OPTIMIZATIONS_REQUEST, fetchOptimizationsSaga)
    takeLatest(LoadActionTypes.FETCH_OPTIMIZATIONS_REQUEST, fetchOptimizationsSaga),
    // LD1: takeLatest(ASSIGN_LOAD_REQUEST, assignLoadSaga)
    takeLatest(LoadActionTypes.ASSIGN_LOAD_REQUEST, assignLoadSaga),
    // LD1: takeLatest(FETCH_DRIVER_RECOMMENDATIONS_REQUEST, fetchDriverRecommendationsSaga)
    takeLatest(LoadActionTypes.FETCH_DRIVER_RECOMMENDATIONS_REQUEST, fetchDriverRecommendationsSaga),
    // LD1: takeLatest(APPLY_OPTIMIZATION_REQUEST, applyOptimizationSaga)
    takeLatest(LoadActionTypes.APPLY_OPTIMIZATION_REQUEST, applyOptimizationSaga),
    // LD1: takeLatest(FETCH_LOADS_BY_STATUS_REQUEST, fetchLoadsByStatusSaga)
    takeLatest(LoadActionTypes.FETCH_LOADS_BY_STATUS_REQUEST, fetchLoadsByStatusSaga),
    // LD1: takeLatest(FETCH_ACTIVE_LOADS_REQUEST, fetchActiveLoadsSaga)
    takeLatest(LoadActionTypes.FETCH_ACTIVE_LOADS_REQUEST, fetchActiveLoadsSaga),
    // LD1: takeLatest(FETCH_PENDING_LOADS_REQUEST, fetchPendingLoadsSaga)
    takeLatest(LoadActionTypes.FETCH_PENDING_LOADS_REQUEST, fetchPendingLoadsSaga),
    // LD1: takeLatest(FETCH_COMPLETED_LOADS_REQUEST, fetchCompletedLoadsSaga)
    takeLatest(LoadActionTypes.FETCH_COMPLETED_LOADS_REQUEST, fetchCompletedLoadsSaga),
    // LD1: takeLatest(FETCH_UPCOMING_DELIVERIES_REQUEST, fetchUpcomingDeliveriesSaga)
    takeLatest(LoadActionTypes.FETCH_UPCOMING_DELIVERIES_REQUEST, fetchUpcomingDeliveriesSaga),
  ]);
}

// Default export of the load saga watcher for use in the root saga
export default watchLoad;