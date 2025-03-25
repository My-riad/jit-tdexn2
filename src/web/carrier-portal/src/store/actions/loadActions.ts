import { createAction } from '@reduxjs/toolkit';
import {
  Load,
  LoadWithDetails,
  LoadDocument,
  LoadStatus,
  LoadCreationParams,
  LoadUpdateParams,
  LoadStatusUpdateParams,
  LoadSearchParams,
  LoadRecommendation
} from '../../../common/interfaces/load.interface';

/**
 * Enum of action type constants for load-related Redux actions
 */
export enum LoadActionTypes {
  // Fetch loads
  FETCH_LOADS_REQUEST = 'load/FETCH_LOADS_REQUEST',
  FETCH_LOADS_SUCCESS = 'load/FETCH_LOADS_SUCCESS',
  FETCH_LOADS_FAILURE = 'load/FETCH_LOADS_FAILURE',
  
  // Fetch load detail
  FETCH_LOAD_DETAIL_REQUEST = 'load/FETCH_LOAD_DETAIL_REQUEST',
  FETCH_LOAD_DETAIL_SUCCESS = 'load/FETCH_LOAD_DETAIL_SUCCESS',
  FETCH_LOAD_DETAIL_FAILURE = 'load/FETCH_LOAD_DETAIL_FAILURE',
  
  // Create load
  CREATE_LOAD_REQUEST = 'load/CREATE_LOAD_REQUEST',
  CREATE_LOAD_SUCCESS = 'load/CREATE_LOAD_SUCCESS',
  CREATE_LOAD_FAILURE = 'load/CREATE_LOAD_FAILURE',
  
  // Update load
  UPDATE_LOAD_REQUEST = 'load/UPDATE_LOAD_REQUEST',
  UPDATE_LOAD_SUCCESS = 'load/UPDATE_LOAD_SUCCESS',
  UPDATE_LOAD_FAILURE = 'load/UPDATE_LOAD_FAILURE',
  
  // Delete load
  DELETE_LOAD_REQUEST = 'load/DELETE_LOAD_REQUEST',
  DELETE_LOAD_SUCCESS = 'load/DELETE_LOAD_SUCCESS',
  DELETE_LOAD_FAILURE = 'load/DELETE_LOAD_FAILURE',
  
  // Update load status
  UPDATE_LOAD_STATUS_REQUEST = 'load/UPDATE_LOAD_STATUS_REQUEST',
  UPDATE_LOAD_STATUS_SUCCESS = 'load/UPDATE_LOAD_STATUS_SUCCESS',
  UPDATE_LOAD_STATUS_FAILURE = 'load/UPDATE_LOAD_STATUS_FAILURE',
  
  // Fetch load documents
  FETCH_LOAD_DOCUMENTS_REQUEST = 'load/FETCH_LOAD_DOCUMENTS_REQUEST',
  FETCH_LOAD_DOCUMENTS_SUCCESS = 'load/FETCH_LOAD_DOCUMENTS_SUCCESS',
  FETCH_LOAD_DOCUMENTS_FAILURE = 'load/FETCH_LOAD_DOCUMENTS_FAILURE',
  
  // Upload document
  UPLOAD_DOCUMENT_REQUEST = 'load/UPLOAD_DOCUMENT_REQUEST',
  UPLOAD_DOCUMENT_SUCCESS = 'load/UPLOAD_DOCUMENT_SUCCESS',
  UPLOAD_DOCUMENT_FAILURE = 'load/UPLOAD_DOCUMENT_FAILURE',
  
  // Delete document
  DELETE_DOCUMENT_REQUEST = 'load/DELETE_DOCUMENT_REQUEST',
  DELETE_DOCUMENT_SUCCESS = 'load/DELETE_DOCUMENT_SUCCESS',
  DELETE_DOCUMENT_FAILURE = 'load/DELETE_DOCUMENT_FAILURE',
  
  // Fetch optimizations
  FETCH_OPTIMIZATIONS_REQUEST = 'load/FETCH_OPTIMIZATIONS_REQUEST',
  FETCH_OPTIMIZATIONS_SUCCESS = 'load/FETCH_OPTIMIZATIONS_SUCCESS',
  FETCH_OPTIMIZATIONS_FAILURE = 'load/FETCH_OPTIMIZATIONS_FAILURE',
  
  // Assign load to driver
  ASSIGN_LOAD_REQUEST = 'load/ASSIGN_LOAD_REQUEST',
  ASSIGN_LOAD_SUCCESS = 'load/ASSIGN_LOAD_SUCCESS',
  ASSIGN_LOAD_FAILURE = 'load/ASSIGN_LOAD_FAILURE',
  
  // Fetch driver recommendations
  FETCH_DRIVER_RECOMMENDATIONS_REQUEST = 'load/FETCH_DRIVER_RECOMMENDATIONS_REQUEST',
  FETCH_DRIVER_RECOMMENDATIONS_SUCCESS = 'load/FETCH_DRIVER_RECOMMENDATIONS_SUCCESS',
  FETCH_DRIVER_RECOMMENDATIONS_FAILURE = 'load/FETCH_DRIVER_RECOMMENDATIONS_FAILURE',
  
  // Apply optimization
  APPLY_OPTIMIZATION_REQUEST = 'load/APPLY_OPTIMIZATION_REQUEST',
  APPLY_OPTIMIZATION_SUCCESS = 'load/APPLY_OPTIMIZATION_SUCCESS',
  APPLY_OPTIMIZATION_FAILURE = 'load/APPLY_OPTIMIZATION_FAILURE',
  
  // Fetch loads by status
  FETCH_LOADS_BY_STATUS_REQUEST = 'load/FETCH_LOADS_BY_STATUS_REQUEST',
  FETCH_LOADS_BY_STATUS_SUCCESS = 'load/FETCH_LOADS_BY_STATUS_SUCCESS',
  FETCH_LOADS_BY_STATUS_FAILURE = 'load/FETCH_LOADS_BY_STATUS_FAILURE',
  
  // Fetch active loads
  FETCH_ACTIVE_LOADS_REQUEST = 'load/FETCH_ACTIVE_LOADS_REQUEST',
  FETCH_ACTIVE_LOADS_SUCCESS = 'load/FETCH_ACTIVE_LOADS_SUCCESS',
  FETCH_ACTIVE_LOADS_FAILURE = 'load/FETCH_ACTIVE_LOADS_FAILURE',
  
  // Fetch pending loads
  FETCH_PENDING_LOADS_REQUEST = 'load/FETCH_PENDING_LOADS_REQUEST',
  FETCH_PENDING_LOADS_SUCCESS = 'load/FETCH_PENDING_LOADS_SUCCESS',
  FETCH_PENDING_LOADS_FAILURE = 'load/FETCH_PENDING_LOADS_FAILURE',
  
  // Fetch completed loads
  FETCH_COMPLETED_LOADS_REQUEST = 'load/FETCH_COMPLETED_LOADS_REQUEST',
  FETCH_COMPLETED_LOADS_SUCCESS = 'load/FETCH_COMPLETED_LOADS_SUCCESS',
  FETCH_COMPLETED_LOADS_FAILURE = 'load/FETCH_COMPLETED_LOADS_FAILURE',
  
  // Fetch upcoming deliveries
  FETCH_UPCOMING_DELIVERIES_REQUEST = 'load/FETCH_UPCOMING_DELIVERIES_REQUEST',
  FETCH_UPCOMING_DELIVERIES_SUCCESS = 'load/FETCH_UPCOMING_DELIVERIES_SUCCESS',
  FETCH_UPCOMING_DELIVERIES_FAILURE = 'load/FETCH_UPCOMING_DELIVERIES_FAILURE'
}

// Action creator for requesting loads for a carrier with optional search parameters
export const fetchLoads = createAction<{carrierId: string, searchParams?: LoadSearchParams}>(
  LoadActionTypes.FETCH_LOADS_REQUEST
);

// Action creator for successful load fetch operations
export const fetchLoadsSuccess = createAction<{ loads: Load[], total: number, page: number, limit: number }>(
  LoadActionTypes.FETCH_LOADS_SUCCESS
);

// Action creator for failed load fetch operations
export const fetchLoadsFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_LOADS_FAILURE
);

// Action creator for requesting detailed information for a specific load
export const fetchLoadDetail = createAction<{ loadId: string }>(
  LoadActionTypes.FETCH_LOAD_DETAIL_REQUEST
);

// Action creator for successful load detail fetch operations
export const fetchLoadDetailSuccess = createAction<{ load: LoadWithDetails }>(
  LoadActionTypes.FETCH_LOAD_DETAIL_SUCCESS
);

// Action creator for failed load detail fetch operations
export const fetchLoadDetailFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_LOAD_DETAIL_FAILURE
);

// Action creator for creating a new load
export const createLoad = createAction<{ carrierId: string, loadData: LoadCreationParams }>(
  LoadActionTypes.CREATE_LOAD_REQUEST
);

// Action creator for successful load creation operations
export const createLoadSuccess = createAction<{ load: Load }>(
  LoadActionTypes.CREATE_LOAD_SUCCESS
);

// Action creator for failed load creation operations
export const createLoadFailure = createAction<{ error: string }>(
  LoadActionTypes.CREATE_LOAD_FAILURE
);

// Action creator for updating an existing load
export const updateLoad = createAction<{ loadId: string, loadData: LoadUpdateParams }>(
  LoadActionTypes.UPDATE_LOAD_REQUEST
);

// Action creator for successful load update operations
export const updateLoadSuccess = createAction<{ load: Load }>(
  LoadActionTypes.UPDATE_LOAD_SUCCESS
);

// Action creator for failed load update operations
export const updateLoadFailure = createAction<{ error: string }>(
  LoadActionTypes.UPDATE_LOAD_FAILURE
);

// Action creator for deleting a load
export const deleteLoad = createAction<{ loadId: string }>(
  LoadActionTypes.DELETE_LOAD_REQUEST
);

// Action creator for successful load deletion operations
export const deleteLoadSuccess = createAction<{ loadId: string }>(
  LoadActionTypes.DELETE_LOAD_SUCCESS
);

// Action creator for failed load deletion operations
export const deleteLoadFailure = createAction<{ error: string }>(
  LoadActionTypes.DELETE_LOAD_FAILURE
);

// Action creator for updating the status of a load
export const updateLoadStatus = createAction<{ loadId: string, statusData: LoadStatusUpdateParams }>(
  LoadActionTypes.UPDATE_LOAD_STATUS_REQUEST
);

// Action creator for successful load status update operations
export const updateLoadStatusSuccess = createAction<{ loadId: string, status: LoadStatus, statusDetails?: Record<string, any> }>(
  LoadActionTypes.UPDATE_LOAD_STATUS_SUCCESS
);

// Action creator for failed load status update operations
export const updateLoadStatusFailure = createAction<{ error: string }>(
  LoadActionTypes.UPDATE_LOAD_STATUS_FAILURE
);

// Action creator for requesting documents associated with a load
export const fetchLoadDocuments = createAction<{ loadId: string }>(
  LoadActionTypes.FETCH_LOAD_DOCUMENTS_REQUEST
);

// Action creator for successful load document fetch operations
export const fetchLoadDocumentsSuccess = createAction<{ loadId: string, documents: LoadDocument[] }>(
  LoadActionTypes.FETCH_LOAD_DOCUMENTS_SUCCESS
);

// Action creator for failed load document fetch operations
export const fetchLoadDocumentsFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_LOAD_DOCUMENTS_FAILURE
);

// Action creator for uploading a document to a load
export const uploadDocument = createAction<{ loadId: string, file: File, documentType: string, metadata?: Record<string, any> }>(
  LoadActionTypes.UPLOAD_DOCUMENT_REQUEST
);

// Action creator for successful document upload operations
export const uploadDocumentSuccess = createAction<{ loadId: string, document: LoadDocument }>(
  LoadActionTypes.UPLOAD_DOCUMENT_SUCCESS
);

// Action creator for failed document upload operations
export const uploadDocumentFailure = createAction<{ error: string }>(
  LoadActionTypes.UPLOAD_DOCUMENT_FAILURE
);

// Action creator for deleting a document from a load
export const deleteDocument = createAction<{ loadId: string, documentId: string }>(
  LoadActionTypes.DELETE_DOCUMENT_REQUEST
);

// Action creator for successful document deletion operations
export const deleteDocumentSuccess = createAction<{ loadId: string, documentId: string }>(
  LoadActionTypes.DELETE_DOCUMENT_SUCCESS
);

// Action creator for failed document deletion operations
export const deleteDocumentFailure = createAction<{ error: string }>(
  LoadActionTypes.DELETE_DOCUMENT_FAILURE
);

// Action creator for requesting optimization recommendations for loads
export const fetchOptimizations = createAction<{ carrierId: string }>(
  LoadActionTypes.FETCH_OPTIMIZATIONS_REQUEST
);

// Action creator for successful optimization fetch operations
export const fetchOptimizationsSuccess = createAction<{ recommendations: Array<{ description: string, savingsEstimate: number, loadIds: string[] }> }>(
  LoadActionTypes.FETCH_OPTIMIZATIONS_SUCCESS
);

// Action creator for failed optimization fetch operations
export const fetchOptimizationsFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_OPTIMIZATIONS_FAILURE
);

// Action creator for assigning a load to a driver
export const assignLoad = createAction<{ loadId: string, driverId: string, vehicleId: string }>(
  LoadActionTypes.ASSIGN_LOAD_REQUEST
);

// Action creator for successful load assignment operations
export const assignLoadSuccess = createAction<{ loadId: string, assignment: { driverId: string, vehicleId: string, assignmentId: string } }>(
  LoadActionTypes.ASSIGN_LOAD_SUCCESS
);

// Action creator for failed load assignment operations
export const assignLoadFailure = createAction<{ error: string }>(
  LoadActionTypes.ASSIGN_LOAD_FAILURE
);

// Action creator for requesting load recommendations for a driver
export const fetchDriverRecommendations = createAction<{ driverId: string, count?: number }>(
  LoadActionTypes.FETCH_DRIVER_RECOMMENDATIONS_REQUEST
);

// Action creator for successful driver recommendations fetch operations
export const fetchDriverRecommendationsSuccess = createAction<{ driverId: string, recommendations: LoadRecommendation[] }>(
  LoadActionTypes.FETCH_DRIVER_RECOMMENDATIONS_SUCCESS
);

// Action creator for failed driver recommendations fetch operations
export const fetchDriverRecommendationsFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_DRIVER_RECOMMENDATIONS_FAILURE
);

// Action creator for applying an optimization recommendation
export const applyOptimization = createAction<{ recommendationId: string, loadIds: string[] }>(
  LoadActionTypes.APPLY_OPTIMIZATION_REQUEST
);

// Action creator for successful optimization application operations
export const applyOptimizationSuccess = createAction<{ recommendationId: string, affectedLoads: string[] }>(
  LoadActionTypes.APPLY_OPTIMIZATION_SUCCESS
);

// Action creator for failed optimization application operations
export const applyOptimizationFailure = createAction<{ error: string }>(
  LoadActionTypes.APPLY_OPTIMIZATION_FAILURE
);

// Action creator for requesting loads filtered by status
export const fetchLoadsByStatus = createAction<{ carrierId: string, status: LoadStatus[], page?: number, limit?: number }>(
  LoadActionTypes.FETCH_LOADS_BY_STATUS_REQUEST
);

// Action creator for successful loads by status fetch operations
export const fetchLoadsByStatusSuccess = createAction<{ loads: Load[], total: number, page: number, limit: number }>(
  LoadActionTypes.FETCH_LOADS_BY_STATUS_SUCCESS
);

// Action creator for failed loads by status fetch operations
export const fetchLoadsByStatusFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_LOADS_BY_STATUS_FAILURE
);

// Action creator for requesting active loads for a carrier
export const fetchActiveLoads = createAction<{ carrierId: string, page?: number, limit?: number }>(
  LoadActionTypes.FETCH_ACTIVE_LOADS_REQUEST
);

// Action creator for successful active loads fetch operations
export const fetchActiveLoadsSuccess = createAction<{ loads: Load[], total: number, page: number, limit: number }>(
  LoadActionTypes.FETCH_ACTIVE_LOADS_SUCCESS
);

// Action creator for failed active loads fetch operations
export const fetchActiveLoadsFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_ACTIVE_LOADS_FAILURE
);

// Action creator for requesting pending loads for a carrier
export const fetchPendingLoads = createAction<{ carrierId: string, page?: number, limit?: number }>(
  LoadActionTypes.FETCH_PENDING_LOADS_REQUEST
);

// Action creator for successful pending loads fetch operations
export const fetchPendingLoadsSuccess = createAction<{ loads: Load[], total: number, page: number, limit: number }>(
  LoadActionTypes.FETCH_PENDING_LOADS_SUCCESS
);

// Action creator for failed pending loads fetch operations
export const fetchPendingLoadsFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_PENDING_LOADS_FAILURE
);

// Action creator for requesting completed loads for a carrier
export const fetchCompletedLoads = createAction<{ carrierId: string, page?: number, limit?: number }>(
  LoadActionTypes.FETCH_COMPLETED_LOADS_REQUEST
);

// Action creator for successful completed loads fetch operations
export const fetchCompletedLoadsSuccess = createAction<{ loads: Load[], total: number, page: number, limit: number }>(
  LoadActionTypes.FETCH_COMPLETED_LOADS_SUCCESS
);

// Action creator for failed completed loads fetch operations
export const fetchCompletedLoadsFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_COMPLETED_LOADS_FAILURE
);

// Action creator for requesting upcoming deliveries for a carrier
export const fetchUpcomingDeliveries = createAction<{ carrierId: string, days?: number, limit?: number }>(
  LoadActionTypes.FETCH_UPCOMING_DELIVERIES_REQUEST
);

// Action creator for successful upcoming deliveries fetch operations
export const fetchUpcomingDeliveriesSuccess = createAction<{ loads: Load[], total: number }>(
  LoadActionTypes.FETCH_UPCOMING_DELIVERIES_SUCCESS
);

// Action creator for failed upcoming deliveries fetch operations
export const fetchUpcomingDeliveriesFailure = createAction<{ error: string }>(
  LoadActionTypes.FETCH_UPCOMING_DELIVERIES_FAILURE
);