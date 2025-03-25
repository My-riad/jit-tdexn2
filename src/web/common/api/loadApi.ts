/**
 * API client module for load-related operations in the AI-driven Freight Optimization Platform.
 * Provides functions for creating, retrieving, updating, and deleting loads, as well as
 * managing load status, documents, and recommendations.
 */

import { AxiosResponse, AxiosError } from 'axios'; // ^1.4.0
import apiClient from './apiClient';
import { 
  LOAD_ENDPOINTS, 
  OPTIMIZATION_ENDPOINTS,
  getEndpointWithParams 
} from '../constants/endpoints';
import { 
  Load, 
  LoadWithDetails, 
  LoadCreationParams, 
  LoadUpdateParams, 
  LoadStatusUpdateParams, 
  LoadSearchParams, 
  LoadDocument, 
  LoadDocumentType,
  LoadSummary,
  LoadRecommendation
} from '../interfaces/load.interface';
import logger from '../utils/logger';

/**
 * Retrieves a paginated list of loads with optional filtering
 * @param searchParams - Parameters for filtering and pagination
 * @returns Promise resolving to paginated load results
 */
export async function getLoads(searchParams?: LoadSearchParams): Promise<{ 
  loads: LoadSummary[]; 
  total: number; 
  page: number; 
  limit: number; 
}> {
  try {
    logger.debug('Retrieving loads with search parameters', { searchParams });
    
    const response = await apiClient.get(LOAD_ENDPOINTS.SEARCH, { 
      params: searchParams 
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to retrieve loads', { error, searchParams });
    throw error;
  }
}

/**
 * Retrieves detailed information about a specific load by ID
 * @param loadId - The ID of the load to retrieve
 * @param includeDetails - Whether to include additional details like locations, status history, etc.
 * @returns Promise resolving to load details
 */
export async function getLoadById(loadId: string, includeDetails: boolean = false): Promise<LoadWithDetails | Load> {
  try {
    logger.debug('Retrieving load by ID', { loadId, includeDetails });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.GET_BY_ID, { loadId });
    
    const response = await apiClient.get(endpoint, {
      params: includeDetails ? { includeDetails: true } : undefined
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to retrieve load by ID', { error, loadId });
    throw error;
  }
}

/**
 * Creates a new load in the system
 * @param loadData - The load data to create
 * @returns Promise resolving to the created load
 */
export async function createLoad(loadData: LoadCreationParams): Promise<Load> {
  try {
    // Create a sanitized version of the load data for logging (removing potential PII)
    const sanitizedLoadData = { ...loadData };
    if (sanitizedLoadData.specialInstructions) {
      sanitizedLoadData.specialInstructions = '***';
    }
    
    logger.debug('Creating new load', { loadData: sanitizedLoadData });
    
    const response = await apiClient.post(LOAD_ENDPOINTS.CREATE, loadData);
    
    return response.data;
  } catch (error) {
    logger.error('Failed to create load', { error });
    throw error;
  }
}

/**
 * Updates an existing load's information
 * @param loadId - The ID of the load to update
 * @param updateData - The data to update
 * @returns Promise resolving to the updated load
 */
export async function updateLoad(loadId: string, updateData: LoadUpdateParams): Promise<Load> {
  try {
    // Create a sanitized version of the update data for logging
    const sanitizedUpdateData = { ...updateData };
    if (sanitizedUpdateData.specialInstructions) {
      sanitizedUpdateData.specialInstructions = '***';
    }
    
    logger.debug('Updating load', { loadId, updateData: sanitizedUpdateData });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.UPDATE, { loadId });
    
    const response = await apiClient.put(endpoint, updateData);
    
    return response.data;
  } catch (error) {
    logger.error('Failed to update load', { error, loadId });
    throw error;
  }
}

/**
 * Deletes a load from the system
 * @param loadId - The ID of the load to delete
 * @returns Promise resolving to deletion result
 */
export async function deleteLoad(loadId: string): Promise<{ success: boolean; message: string; }> {
  try {
    logger.debug('Deleting load', { loadId });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.DELETE, { loadId });
    
    const response = await apiClient.delete(endpoint);
    
    return response.data;
  } catch (error) {
    logger.error('Failed to delete load', { error, loadId });
    throw error;
  }
}

/**
 * Updates the status of a load
 * @param loadId - The ID of the load to update
 * @param statusData - The status update data
 * @returns Promise resolving to the load with updated status
 */
export async function updateLoadStatus(loadId: string, statusData: LoadStatusUpdateParams): Promise<Load> {
  try {
    logger.debug('Updating load status', { loadId, statusData });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.STATUS, { loadId });
    
    const response = await apiClient.put(endpoint, statusData);
    
    return response.data;
  } catch (error) {
    logger.error('Failed to update load status', { error, loadId, status: statusData.status });
    throw error;
  }
}

/**
 * Retrieves documents associated with a load
 * @param loadId - The ID of the load
 * @param documentType - Optional filter for document type
 * @returns Promise resolving to array of load documents
 */
export async function getLoadDocuments(loadId: string, documentType?: LoadDocumentType): Promise<LoadDocument[]> {
  try {
    logger.debug('Retrieving load documents', { loadId, documentType });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.DOCUMENTS, { loadId });
    
    const response = await apiClient.get(endpoint, {
      params: documentType ? { documentType } : undefined
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to retrieve load documents', { error, loadId });
    throw error;
  }
}

/**
 * Uploads a document for a specific load
 * @param loadId - The ID of the load
 * @param formData - FormData containing the document file and metadata
 * @returns Promise resolving to the uploaded document
 */
export async function uploadLoadDocument(loadId: string, formData: FormData): Promise<LoadDocument> {
  try {
    logger.debug('Uploading document for load', { loadId });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.DOCUMENTS, { loadId });
    
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to upload load document', { error, loadId });
    throw error;
  }
}

/**
 * Deletes a document associated with a load
 * @param loadId - The ID of the load
 * @param documentId - The ID of the document to delete
 * @returns Promise resolving to deletion result
 */
export async function deleteLoadDocument(loadId: string, documentId: string): Promise<{ success: boolean; message: string; }> {
  try {
    logger.debug('Deleting load document', { loadId, documentId });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.DOCUMENTS, { loadId });
    
    const response = await apiClient.delete(endpoint, {
      params: { documentId }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to delete load document', { error, loadId, documentId });
    throw error;
  }
}

/**
 * Retrieves AI-recommended loads for a driver
 * @param driverId - The ID of the driver
 * @param options - Optional parameters for filtering recommendations
 * @returns Promise resolving to load recommendations
 */
export async function getLoadRecommendations(
  driverId: string, 
  options: { count?: number; location?: { latitude: number; longitude: number }; } = {}
): Promise<{ recommendations: LoadRecommendation[]; }> {
  try {
    logger.debug('Retrieving load recommendations for driver', { driverId, options });
    
    const response = await apiClient.get(OPTIMIZATION_ENDPOINTS.MATCHES, {
      params: {
        driverId,
        ...options
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to retrieve load recommendations', { error, driverId });
    throw error;
  }
}

/**
 * Accepts a load assignment for a driver
 * @param loadId - The ID of the load to accept
 * @param driverId - The ID of the driver accepting the load
 * @param acceptanceData - Additional acceptance data
 * @returns Promise resolving to assignment result
 */
export async function acceptLoad(
  loadId: string, 
  driverId: string, 
  acceptanceData: { vehicleId?: string; notes?: string; } = {}
): Promise<{ success: boolean; assignment: object; }> {
  try {
    logger.debug('Accepting load', { loadId, driverId });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.ACCEPT, { loadId });
    
    const response = await apiClient.post(endpoint, {
      driverId,
      ...acceptanceData
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to accept load', { error, loadId, driverId });
    throw error;
  }
}

/**
 * Declines a load recommendation for a driver
 * @param loadId - The ID of the load to decline
 * @param driverId - The ID of the driver declining the load
 * @param declineData - Reason for declining
 * @returns Promise resolving to decline result
 */
export async function declineLoad(
  loadId: string, 
  driverId: string, 
  declineData: { reason: string; notes?: string; } = { reason: 'other' }
): Promise<{ success: boolean; message: string; }> {
  try {
    logger.debug('Declining load', { loadId, driverId });
    
    const endpoint = getEndpointWithParams(LOAD_ENDPOINTS.DECLINE, { loadId });
    
    const response = await apiClient.post(endpoint, {
      driverId,
      ...declineData
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to decline load', { error, loadId, driverId });
    throw error;
  }
}

/**
 * Temporarily reserves a load for a driver
 * @param loadId - The ID of the load to reserve
 * @param driverId - The ID of the driver reserving the load
 * @param expirationMinutes - How long to reserve the load in minutes (default: 15)
 * @returns Promise resolving to reservation result
 */
export async function reserveLoad(
  loadId: string, 
  driverId: string, 
  expirationMinutes: number = 15
): Promise<{ success: boolean; reservation: object; expiresAt: string; }> {
  try {
    logger.debug('Reserving load', { loadId, driverId, expirationMinutes });
    
    // For reservation, we'll use a dedicated endpoint
    const response = await apiClient.post(`${LOAD_ENDPOINTS.BASE}/${loadId}/reserve`, {
      driverId,
      expirationMinutes
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to reserve load', { error, loadId, driverId });
    throw error;
  }
}