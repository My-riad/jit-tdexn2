/**
 * Redux action creators and action type constants for load-related operations
 * in the shipper portal of the AI-driven Freight Optimization Platform.
 * 
 * This file defines actions for creating, retrieving, updating, and deleting loads,
 * as well as managing load status, documents, and carrier recommendations.
 */
import { createAction } from '@reduxjs/toolkit'; // v1.9.5
import {
  LoadSearchParams,
  LoadCreationParams,
  LoadUpdateParams,
  LoadStatusUpdateParams,
  LoadDocumentType
} from '../../../common/interfaces/load.interface';

/**
 * Constants for all load-related Redux action types
 */
export const LOAD_ACTION_TYPES = {
  // Fetch loads (list)
  FETCH_LOADS_REQUEST: 'load/fetchLoadsRequest',
  FETCH_LOADS_SUCCESS: 'load/fetchLoadsSuccess',
  FETCH_LOADS_FAILURE: 'load/fetchLoadsFailure',
  
  // Fetch single load details
  FETCH_LOAD_DETAIL_REQUEST: 'load/fetchLoadDetailRequest',
  FETCH_LOAD_DETAIL_SUCCESS: 'load/fetchLoadDetailSuccess',
  FETCH_LOAD_DETAIL_FAILURE: 'load/fetchLoadDetailFailure',
  
  // Create load
  CREATE_LOAD_REQUEST: 'load/createLoadRequest',
  CREATE_LOAD_SUCCESS: 'load/createLoadSuccess',
  CREATE_LOAD_FAILURE: 'load/createLoadFailure',
  
  // Update load
  UPDATE_LOAD_REQUEST: 'load/updateLoadRequest',
  UPDATE_LOAD_SUCCESS: 'load/updateLoadSuccess',
  UPDATE_LOAD_FAILURE: 'load/updateLoadFailure',
  
  // Delete load
  DELETE_LOAD_REQUEST: 'load/deleteLoadRequest',
  DELETE_LOAD_SUCCESS: 'load/deleteLoadSuccess',
  DELETE_LOAD_FAILURE: 'load/deleteLoadFailure',
  
  // Update load status
  UPDATE_LOAD_STATUS_REQUEST: 'load/updateLoadStatusRequest',
  UPDATE_LOAD_STATUS_SUCCESS: 'load/updateLoadStatusSuccess',
  UPDATE_LOAD_STATUS_FAILURE: 'load/updateLoadStatusFailure',
  
  // Load documents
  FETCH_LOAD_DOCUMENTS_REQUEST: 'load/fetchLoadDocumentsRequest',
  FETCH_LOAD_DOCUMENTS_SUCCESS: 'load/fetchLoadDocumentsSuccess',
  FETCH_LOAD_DOCUMENTS_FAILURE: 'load/fetchLoadDocumentsFailure',
  
  UPLOAD_LOAD_DOCUMENT_REQUEST: 'load/uploadLoadDocumentRequest',
  UPLOAD_LOAD_DOCUMENT_SUCCESS: 'load/uploadLoadDocumentSuccess',
  UPLOAD_LOAD_DOCUMENT_FAILURE: 'load/uploadLoadDocumentFailure',
  
  DELETE_LOAD_DOCUMENT_REQUEST: 'load/deleteLoadDocumentRequest',
  DELETE_LOAD_DOCUMENT_SUCCESS: 'load/deleteLoadDocumentSuccess',
  DELETE_LOAD_DOCUMENT_FAILURE: 'load/deleteLoadDocumentFailure',
  
  // Carrier recommendations
  GET_CARRIER_RECOMMENDATIONS_REQUEST: 'load/getCarrierRecommendationsRequest',
  GET_CARRIER_RECOMMENDATIONS_SUCCESS: 'load/getCarrierRecommendationsSuccess',
  GET_CARRIER_RECOMMENDATIONS_FAILURE: 'load/getCarrierRecommendationsFailure',
  
  // Assign load to carrier
  ASSIGN_LOAD_TO_CARRIER_REQUEST: 'load/assignLoadToCarrierRequest',
  ASSIGN_LOAD_TO_CARRIER_SUCCESS: 'load/assignLoadToCarrierSuccess',
  ASSIGN_LOAD_TO_CARRIER_FAILURE: 'load/assignLoadToCarrierFailure',
  
  // Clear load cache (utility action)
  CLEAR_LOAD_CACHE: 'load/clearLoadCache'
};

/**
 * Action creator for requesting a list of loads with optional filtering
 */
export const fetchLoads = createAction(
  LOAD_ACTION_TYPES.FETCH_LOADS_REQUEST,
  (params?: LoadSearchParams) => ({
    payload: params
  })
);

/**
 * Action creator for successful load list retrieval
 */
export const fetchLoadsSuccess = createAction(
  LOAD_ACTION_TYPES.FETCH_LOADS_SUCCESS,
  (loads, pagination) => ({
    payload: { loads, pagination }
  })
);

/**
 * Action creator for failed load list retrieval
 */
export const fetchLoadsFailure = createAction(
  LOAD_ACTION_TYPES.FETCH_LOADS_FAILURE,
  (error) => ({
    payload: { error }
  })
);

/**
 * Action creator for requesting a specific load by ID
 */
export const fetchLoadById = createAction(
  LOAD_ACTION_TYPES.FETCH_LOAD_DETAIL_REQUEST,
  (loadId: string) => ({
    payload: { loadId }
  })
);

/**
 * Action creator for successful load detail retrieval
 */
export const fetchLoadByIdSuccess = createAction(
  LOAD_ACTION_TYPES.FETCH_LOAD_DETAIL_SUCCESS,
  (load) => ({
    payload: load
  })
);

/**
 * Action creator for failed load detail retrieval
 */
export const fetchLoadByIdFailure = createAction(
  LOAD_ACTION_TYPES.FETCH_LOAD_DETAIL_FAILURE,
  (error, loadId) => ({
    payload: { error, loadId }
  })
);

/**
 * Action creator for creating a new load
 */
export const createLoad = createAction(
  LOAD_ACTION_TYPES.CREATE_LOAD_REQUEST,
  (loadData: LoadCreationParams) => ({
    payload: loadData
  })
);

/**
 * Action creator for successful load creation
 */
export const createLoadSuccess = createAction(
  LOAD_ACTION_TYPES.CREATE_LOAD_SUCCESS,
  (load) => ({
    payload: load
  })
);

/**
 * Action creator for failed load creation
 */
export const createLoadFailure = createAction(
  LOAD_ACTION_TYPES.CREATE_LOAD_FAILURE,
  (error) => ({
    payload: { error }
  })
);

/**
 * Action creator for updating an existing load
 */
export const updateLoad = createAction(
  LOAD_ACTION_TYPES.UPDATE_LOAD_REQUEST,
  (loadId: string, updateData: LoadUpdateParams) => ({
    payload: { loadId, updateData }
  })
);

/**
 * Action creator for successful load update
 */
export const updateLoadSuccess = createAction(
  LOAD_ACTION_TYPES.UPDATE_LOAD_SUCCESS,
  (load) => ({
    payload: load
  })
);

/**
 * Action creator for failed load update
 */
export const updateLoadFailure = createAction(
  LOAD_ACTION_TYPES.UPDATE_LOAD_FAILURE,
  (error, loadId) => ({
    payload: { error, loadId }
  })
);

/**
 * Action creator for deleting a load
 */
export const deleteLoad = createAction(
  LOAD_ACTION_TYPES.DELETE_LOAD_REQUEST,
  (loadId: string) => ({
    payload: { loadId }
  })
);

/**
 * Action creator for successful load deletion
 */
export const deleteLoadSuccess = createAction(
  LOAD_ACTION_TYPES.DELETE_LOAD_SUCCESS,
  (loadId: string) => ({
    payload: { loadId }
  })
);

/**
 * Action creator for failed load deletion
 */
export const deleteLoadFailure = createAction(
  LOAD_ACTION_TYPES.DELETE_LOAD_FAILURE,
  (error, loadId) => ({
    payload: { error, loadId }
  })
);

/**
 * Action creator for updating a load's status
 */
export const updateLoadStatus = createAction(
  LOAD_ACTION_TYPES.UPDATE_LOAD_STATUS_REQUEST,
  (loadId: string, statusData: LoadStatusUpdateParams) => ({
    payload: { loadId, statusData }
  })
);

/**
 * Action creator for successful load status update
 */
export const updateLoadStatusSuccess = createAction(
  LOAD_ACTION_TYPES.UPDATE_LOAD_STATUS_SUCCESS,
  (loadId, status, statusDetails) => ({
    payload: { loadId, status, statusDetails }
  })
);

/**
 * Action creator for failed load status update
 */
export const updateLoadStatusFailure = createAction(
  LOAD_ACTION_TYPES.UPDATE_LOAD_STATUS_FAILURE,
  (error, loadId) => ({
    payload: { error, loadId }
  })
);

/**
 * Action creator for requesting documents associated with a load
 */
export const fetchLoadDocuments = createAction(
  LOAD_ACTION_TYPES.FETCH_LOAD_DOCUMENTS_REQUEST,
  (loadId: string) => ({
    payload: { loadId }
  })
);

/**
 * Action creator for successful load document retrieval
 */
export const fetchLoadDocumentsSuccess = createAction(
  LOAD_ACTION_TYPES.FETCH_LOAD_DOCUMENTS_SUCCESS,
  (loadId, documents) => ({
    payload: { loadId, documents }
  })
);

/**
 * Action creator for failed load document retrieval
 */
export const fetchLoadDocumentsFailure = createAction(
  LOAD_ACTION_TYPES.FETCH_LOAD_DOCUMENTS_FAILURE,
  (error, loadId) => ({
    payload: { error, loadId }
  })
);

/**
 * Action creator for uploading a document for a load
 */
export const uploadLoadDocument = createAction(
  LOAD_ACTION_TYPES.UPLOAD_LOAD_DOCUMENT_REQUEST,
  (loadId: string, documentFile: File, documentType: LoadDocumentType) => ({
    payload: { loadId, documentFile, documentType }
  })
);

/**
 * Action creator for successful document upload
 */
export const uploadLoadDocumentSuccess = createAction(
  LOAD_ACTION_TYPES.UPLOAD_LOAD_DOCUMENT_SUCCESS,
  (loadId, document) => ({
    payload: { loadId, document }
  })
);

/**
 * Action creator for failed document upload
 */
export const uploadLoadDocumentFailure = createAction(
  LOAD_ACTION_TYPES.UPLOAD_LOAD_DOCUMENT_FAILURE,
  (error, loadId) => ({
    payload: { error, loadId }
  })
);

/**
 * Action creator for deleting a document from a load
 */
export const deleteLoadDocument = createAction(
  LOAD_ACTION_TYPES.DELETE_LOAD_DOCUMENT_REQUEST,
  (loadId: string, documentId: string) => ({
    payload: { loadId, documentId }
  })
);

/**
 * Action creator for successful document deletion
 */
export const deleteLoadDocumentSuccess = createAction(
  LOAD_ACTION_TYPES.DELETE_LOAD_DOCUMENT_SUCCESS,
  (loadId, documentId) => ({
    payload: { loadId, documentId }
  })
);

/**
 * Action creator for failed document deletion
 */
export const deleteLoadDocumentFailure = createAction(
  LOAD_ACTION_TYPES.DELETE_LOAD_DOCUMENT_FAILURE,
  (error, loadId, documentId) => ({
    payload: { error, loadId, documentId }
  })
);

/**
 * Action creator for requesting AI-recommended carriers for a load
 */
export const getCarrierRecommendations = createAction(
  LOAD_ACTION_TYPES.GET_CARRIER_RECOMMENDATIONS_REQUEST,
  (loadId: string) => ({
    payload: { loadId }
  })
);

/**
 * Action creator for successful carrier recommendation retrieval
 */
export const getCarrierRecommendationsSuccess = createAction(
  LOAD_ACTION_TYPES.GET_CARRIER_RECOMMENDATIONS_SUCCESS,
  (loadId, recommendations) => ({
    payload: { loadId, recommendations }
  })
);

/**
 * Action creator for failed carrier recommendation retrieval
 */
export const getCarrierRecommendationsFailure = createAction(
  LOAD_ACTION_TYPES.GET_CARRIER_RECOMMENDATIONS_FAILURE,
  (error, loadId) => ({
    payload: { error, loadId }
  })
);

/**
 * Action creator for assigning a load to a specific carrier
 */
export const assignLoadToCarrier = createAction(
  LOAD_ACTION_TYPES.ASSIGN_LOAD_TO_CARRIER_REQUEST,
  (loadId: string, carrierId: string, rate?: number) => ({
    payload: { loadId, carrierId, rate }
  })
);

/**
 * Action creator for successful load assignment to carrier
 */
export const assignLoadToCarrierSuccess = createAction(
  LOAD_ACTION_TYPES.ASSIGN_LOAD_TO_CARRIER_SUCCESS,
  (loadId, carrierId, assignmentId, rate) => ({
    payload: { loadId, carrierId, assignmentId, rate }
  })
);

/**
 * Action creator for failed load assignment to carrier
 */
export const assignLoadToCarrierFailure = createAction(
  LOAD_ACTION_TYPES.ASSIGN_LOAD_TO_CARRIER_FAILURE,
  (error, loadId, carrierId) => ({
    payload: { error, loadId, carrierId }
  })
);

/**
 * Action creator for clearing cached load data
 */
export const clearLoadCache = createAction(LOAD_ACTION_TYPES.CLEAR_LOAD_CACHE);