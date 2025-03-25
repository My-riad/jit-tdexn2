/**
 * Redux saga implementation for handling load-related asynchronous operations
 * in the shipper portal of the AI-driven Freight Optimization Platform.
 * This file contains saga generators that intercept load actions and perform
 * side effects such as API calls, error handling, and success/failure action dispatching.
 */

import { takeLatest, takeEvery, put, call, all, fork } from 'redux-saga/effects'; // ^1.1.3
import {
  LOAD_ACTION_TYPES,
  fetchLoadsSuccess,
  fetchLoadsFailure,
  fetchLoadByIdSuccess,
  fetchLoadByIdFailure,
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
  uploadLoadDocumentSuccess,
  uploadLoadDocumentFailure,
  deleteLoadDocumentSuccess,
  deleteLoadDocumentFailure,
  getCarrierRecommendationsSuccess,
  getCarrierRecommendationsFailure,
  assignLoadToCarrierSuccess,
  assignLoadToCarrierFailure,
} from '../actions/loadActions';
import loadService from '../../services/loadService';
import {
  LoadSearchParams,
  LoadCreationParams,
  LoadUpdateParams,
  LoadStatusUpdateParams,
  LoadDocumentType
} from '../../../common/interfaces/load.interface';
import logger from '../../../common/utils/logger';

/**
 * Saga that handles fetching loads with optional filtering
 * @param action - The action object containing search parameters
 */
function* fetchLoadsSaga(action: { type: string; payload?: LoadSearchParams }): Generator<any, void, any> {
  try {
    // Extract search parameters from action payload
    const searchParams: LoadSearchParams | undefined = action.payload;

    // Try to call loadService.getLoads with search parameters
    const { loads, total, page, limit } = yield call(loadService.getLoads, searchParams);

    // If successful, dispatch fetchLoadsSuccess with the response data
    yield put(fetchLoadsSuccess(loads, { total, page, limit }));
  } catch (error) {
    // If an error occurs, log the error and dispatch fetchLoadsFailure with the error message
    logger.error('Error fetching loads', { error });
    yield put(fetchLoadsFailure(error.message));
  }
}

/**
 * Saga that handles fetching a specific load by ID
 * @param action - The action object containing the load ID
 */
function* fetchLoadByIdSaga(action: { type: string; payload: { loadId: string } }): Generator<any, void, any> {
  try {
    // Extract load ID and includeDetails flag from action payload
    const { loadId } = action.payload;

    // Try to call loadService.getLoadById with the load ID and includeDetails flag
    const load = yield call(loadService.getLoadById, loadId, true);

    // If successful, dispatch fetchLoadByIdSuccess with the load data
    yield put(fetchLoadByIdSuccess(load));
  } catch (error) {
    // If an error occurs, log the error and dispatch fetchLoadByIdFailure with the error message
    logger.error('Error fetching load by ID', { error });
    yield put(fetchLoadByIdFailure(error.message));
  }
}

/**
 * Saga that handles creating a new load
 * @param action - The action object containing the load data
 */
function* createLoadSaga(action: { type: string; payload: LoadCreationParams }): Generator<any, void, any> {
  try {
    // Extract load creation parameters from action payload
    const loadData: LoadCreationParams = action.payload;

    // Try to call loadService.createLoad with the load data
    const createdLoad = yield call(loadService.createLoad, loadData);

    // If successful, dispatch createLoadSuccess with the created load
    yield put(createLoadSuccess(createdLoad));
  } catch (error) {
    // If an error occurs, log the error and dispatch createLoadFailure with the error message
    logger.error('Error creating load', { error });
    yield put(createLoadFailure(error.message));
  }
}

/**
 * Saga that handles updating an existing load
 * @param action - The action object containing the load ID and update data
 */
function* updateLoadSaga(action: { type: string; payload: { loadId: string; updateData: LoadUpdateParams } }): Generator<any, void, any> {
  try {
    // Extract load ID and update parameters from action payload
    const { loadId, updateData } = action.payload;

    // Try to call loadService.updateLoad with the load ID and update data
    const updatedLoad = yield call(loadService.updateLoad, loadId, updateData);

    // If successful, dispatch updateLoadSuccess with the updated load
    yield put(updateLoadSuccess(updatedLoad));
  } catch (error) {
    // If an error occurs, log the error and dispatch updateLoadFailure with the error message
    logger.error('Error updating load', { error });
    yield put(updateLoadFailure(error.message));
  }
}

/**
 * Saga that handles deleting a load
 * @param action - The action object containing the load ID
 */
function* deleteLoadSaga(action: { type: string; payload: { loadId: string } }): Generator<any, void, any> {
  try {
    // Extract load ID from action payload
    const { loadId } = action.payload;

    // Try to call loadService.deleteLoad with the load ID
    yield call(loadService.deleteLoad, loadId);

    // If successful, dispatch deleteLoadSuccess with the result
    yield put(deleteLoadSuccess(loadId));
  } catch (error) {
    // If an error occurs, log the error and dispatch deleteLoadFailure with the error message
    logger.error('Error deleting load', { error });
    yield put(deleteLoadFailure(error.message));
  }
}

/**
 * Saga that handles updating a load's status
 * @param action - The action object containing the load ID and status update parameters
 */
function* updateLoadStatusSaga(action: { type: string; payload: { loadId: string; statusData: LoadStatusUpdateParams } }): Generator<any, void, any> {
  try {
    // Extract load ID and status update parameters from action payload
    const { loadId, statusData } = action.payload;

    // Try to call loadService.updateLoadStatus with the load ID and status data
    yield call(loadService.updateLoadStatus, loadId, statusData);

    // If successful, dispatch updateLoadStatusSuccess with the updated load
    yield put(updateLoadStatusSuccess(loadId, statusData.status, statusData.statusDetails));
  } catch (error) {
    // If an error occurs, log the error and dispatch updateLoadStatusFailure with the error message
    logger.error('Error updating load status', { error });
    yield put(updateLoadStatusFailure(error.message));
  }
}

/**
 * Saga that handles fetching documents associated with a load
 * @param action - The action object containing the load ID and document type
 */
function* fetchLoadDocumentsSaga(action: { type: string; payload: { loadId: string } }): Generator<any, void, any> {
  try {
    // Extract load ID and document type from action payload
    const { loadId } = action.payload;

    // Try to call loadService.getLoadDocuments with the load ID and document type
    const documents = yield call(loadService.getLoadDocuments, loadId);

    // If successful, dispatch fetchLoadDocumentsSuccess with the documents
    yield put(fetchLoadDocumentsSuccess(loadId, documents));
  } catch (error) {
    // If an error occurs, log the error and dispatch fetchLoadDocumentsFailure with the error message
    logger.error('Error fetching load documents', { error });
    yield put(fetchLoadDocumentsFailure(error.message));
  }
}

/**
 * Saga that handles uploading a document for a load
 * @param action - The action object containing the load ID, file, document type, and metadata
 */
function* uploadLoadDocumentSaga(action: { type: string; payload: { loadId: string; documentFile: File; documentType: LoadDocumentType } }): Generator<any, void, any> {
  try {
    // Extract load ID, file, document type, and metadata from action payload
    const { loadId, documentFile, documentType } = action.payload;

    // Try to call loadService.uploadLoadDocument with the parameters
    const document = yield call(loadService.uploadLoadDocument, loadId, documentFile, documentType);

    // If successful, dispatch uploadLoadDocumentSuccess with the uploaded document
    yield put(uploadLoadDocumentSuccess(loadId, document));
  } catch (error) {
    // If an error occurs, log the error and dispatch uploadLoadDocumentFailure with the error message
    logger.error('Error uploading load document', { error });
    yield put(uploadLoadDocumentFailure(error.message));
  }
}

/**
 * Saga that handles deleting a document from a load
 * @param action - The action object containing the load ID and document ID
 */
function* deleteLoadDocumentSaga(action: { type: string; payload: { loadId: string; documentId: string } }): Generator<any, void, any> {
  try {
    // Extract load ID and document ID from action payload
    const { loadId, documentId } = action.payload;

    // Try to call loadService.deleteLoadDocument with the load ID and document ID
    yield call(loadService.deleteLoadDocument, loadId, documentId);

    // If successful, dispatch deleteLoadDocumentSuccess with the result
    yield put(deleteLoadDocumentSuccess(loadId, documentId));
  } catch (error) {
    // If an error occurs, log the error and dispatch deleteLoadDocumentFailure with the error message
    logger.error('Error deleting load document', { error });
    yield put(deleteLoadDocumentFailure(error.message));
  }
}

/**
 * Saga that handles getting AI-recommended carriers for a load
 * @param action - The action object containing the load ID
 */
function* getCarrierRecommendationsSaga(action: { type: string; payload: { loadId: string } }): Generator<any, void, any> {
  try {
    // Extract load ID and options from action payload
    const { loadId } = action.payload;

    // Try to call loadService.getCarrierRecommendations with the load ID and options
    const recommendations = yield call(loadService.getCarrierRecommendations, loadId);

    // If successful, dispatch getCarrierRecommendationsSuccess with the recommendations
    yield put(getCarrierRecommendationsSuccess(loadId, recommendations));
  } catch (error) {
    // If an error occurs, log the error and dispatch getCarrierRecommendationsFailure with the error message
    logger.error('Error getting carrier recommendations', { error });
    yield put(getCarrierRecommendationsFailure(error.message));
  }
}

/**
 * Saga that handles assigning a load to a specific carrier
 * @param action - The action object containing the load ID, carrier ID, and assignment data
 */
function* assignLoadToCarrierSaga(action: { type: string; payload: { loadId: string; carrierId: string; rate?: number } }): Generator<any, void, any> {
  try {
    // Extract load ID, carrier ID, and assignment data from action payload
    const { loadId, carrierId, rate } = action.payload;

    // Try to call loadService.assignLoadToCarrier with the parameters
    const assignmentResult = yield call(loadService.assignLoadToCarrier, loadId, carrierId, { rate });

    // If successful, dispatch assignLoadToCarrierSuccess with the assignment result
    yield put(assignLoadToCarrierSuccess(loadId, carrierId, assignmentResult.assignment.id, rate));
  } catch (error) {
    // If an error occurs, log the error and dispatch assignLoadToCarrierFailure with the error message
    logger.error('Error assigning load to carrier', { error });
    yield put(assignLoadToCarrierFailure(error.message));
  }
}

/**
 * Root saga watcher that listens for load-related actions and triggers the appropriate sagas
 */
export default function* watchLoads(): Generator<any, void, any> {
  // Yield all to combine multiple takeLatest and takeEvery effects
  yield all([
    takeLatest(LOAD_ACTION_TYPES.FETCH_LOADS_REQUEST, fetchLoadsSaga),
    takeLatest(LOAD_ACTION_TYPES.FETCH_LOAD_DETAIL_REQUEST, fetchLoadByIdSaga),
    takeLatest(LOAD_ACTION_TYPES.CREATE_LOAD_REQUEST, createLoadSaga),
    takeLatest(LOAD_ACTION_TYPES.UPDATE_LOAD_REQUEST, updateLoadSaga),
    takeLatest(LOAD_ACTION_TYPES.DELETE_LOAD_REQUEST, deleteLoadSaga),
    takeLatest(LOAD_ACTION_TYPES.UPDATE_LOAD_STATUS_REQUEST, updateLoadStatusSaga),
    takeLatest(LOAD_ACTION_TYPES.FETCH_LOAD_DOCUMENTS_REQUEST, fetchLoadDocumentsSaga),
    takeLatest(LOAD_ACTION_TYPES.UPLOAD_LOAD_DOCUMENT_REQUEST, uploadLoadDocumentSaga),
    takeLatest(LOAD_ACTION_TYPES.DELETE_LOAD_DOCUMENT_REQUEST, deleteLoadDocumentSaga),
    takeLatest(LOAD_ACTION_TYPES.GET_CARRIER_RECOMMENDATIONS_REQUEST, getCarrierRecommendationsSaga),
    takeLatest(LOAD_ACTION_TYPES.ASSIGN_LOAD_TO_CARRIER_REQUEST, assignLoadToCarrierSaga),
  ]);
}