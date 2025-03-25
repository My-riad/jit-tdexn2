// src/web/shipper-portal/src/services/loadService.ts

/**
 * Service that provides load management functionality for the shipper portal of the AI-driven Freight Optimization Platform.
 * It handles creating, retrieving, updating, and deleting loads, as well as managing load status, documents, and carrier recommendations.
 */

import { AxiosError } from 'axios'; // ^1.4.0
import * as loadApi from '../../../common/api/loadApi';
import {
  Load,
  LoadWithDetails,
  LoadCreationParams,
  LoadUpdateParams,
  LoadStatusUpdateParams,
  LoadSearchParams,
  LoadStatus,
  LoadDocument,
  LoadDocumentType,
  LoadSummary,
  CarrierRecommendation
} from '../../../common/interfaces/load.interface';
import { handleApiError, retryWithBackoff } from '../../../common/utils/errorHandlers';
import logger from '../../../common/utils/logger';
import { isAuthenticated, getCurrentUser } from '../../../common/services/authService';
import notificationService from '../../../common/services/notificationService';
import documentService from './documentService';
import trackingService from './trackingService';
import { Position } from '../../../common/interfaces/tracking.interface';

// Define global constants for caching
const LOAD_CACHE_PREFIX = 'shipper_load_';
const LOAD_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const LOAD_LIST_CACHE_PREFIX = 'shipper_load_list_';
const LOAD_LIST_CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutes

/**
 * Retrieves a paginated list of loads with optional filtering for the shipper portal
 * @param searchParams - Parameters for filtering and pagination
 * @param bypassCache - Optional flag to bypass the cache and fetch fresh data
 * @returns Promise resolving to paginated load results
 */
export const getLoads = async (
  searchParams: LoadSearchParams = {},
  bypassCache: boolean = false
): Promise<{ loads: LoadSummary[]; total: number; page: number; limit: number; }> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  // Generate cache key based on search parameters
  const cacheKey = `${LOAD_LIST_CACHE_PREFIX}${JSON.stringify(searchParams)}`;

  // Try to get cached load list data if bypassCache is false
  if (!bypassCache) {
    try {
      const cachedLoads = storageService.getItem<{ loads: LoadSummary[]; total: number; page: number; limit: number; }>(cacheKey);
      if (cachedLoads) {
        logger.debug('Returning cached load list', { cacheKey, searchParams });
        return cachedLoads;
      }
    } catch (cacheError) {
      logger.warn('Error retrieving load list from cache, ignoring', { cacheKey, searchParams, cacheError });
    }
  }

  try {
    // If no valid cache or bypassCache is true, call loadApi.getLoads
    logger.debug('Fetching load list from API', { searchParams });
    const loadList = await loadApi.getLoads(searchParams);

    // Cache the results for future use
    try {
      storageService.setItem(cacheKey, loadList);
      setTimeout(() => {
        clearLoadListCache();
      }, LOAD_LIST_CACHE_EXPIRY);
      logger.debug('Caching load list', { cacheKey, searchParams });
    } catch (cacheError) {
      logger.warn('Error caching load list', { cacheKey, searchParams, cacheError });
    }

    // Return the load list data
    return loadList;
  } catch (error) {
    // Handle and log any errors, showing appropriate notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to retrieve loads', { searchParams, error: apiError });
    notificationService.showErrorNotification(`Failed to retrieve loads: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Retrieves detailed information about a specific load by ID
 * @param loadId - The ID of the load to retrieve
 * @param includeDetails - Whether to include additional details like locations, status history, etc.
 * @param bypassCache - Optional flag to bypass the cache and fetch fresh data
 * @returns Promise resolving to load details
 */
export const getLoadById = async (
  loadId: string,
  includeDetails: boolean = false,
  bypassCache: boolean = false
): Promise<LoadWithDetails | Load> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  // Generate cache key based on load ID and includeDetails flag
  const cacheKey = `${LOAD_CACHE_PREFIX}${loadId}_${includeDetails}`;

  // Try to get cached load data if bypassCache is false
  if (!bypassCache) {
    try {
      const cachedLoad = storageService.getItem<LoadWithDetails | Load>(cacheKey);
      if (cachedLoad) {
        logger.debug('Returning cached load', { loadId, includeDetails, cacheKey });
        return cachedLoad;
      }
    } catch (cacheError) {
      logger.warn('Error retrieving load from cache, ignoring', { loadId, includeDetails, cacheKey, cacheError });
    }
  }

  try {
    // If no valid cache or bypassCache is true, call loadApi.getLoadById
    logger.debug('Fetching load from API', { loadId, includeDetails });
    const load = await loadApi.getLoadById(loadId, includeDetails);

    // Cache the result for future use
    try {
      storageService.setItem(cacheKey, load);
      setTimeout(() => {
        clearLoadCache(loadId);
      }, LOAD_CACHE_EXPIRY);
      logger.debug('Caching load', { loadId, includeDetails, cacheKey });
    } catch (cacheError) {
      logger.warn('Error caching load', { loadId, includeDetails, cacheKey, cacheError });
    }

    // Return the load data
    return load;
  } catch (error) {
    // Handle and log any errors, showing appropriate notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to retrieve load', { loadId, includeDetails, error: apiError });
    notificationService.showErrorNotification(`Failed to retrieve load: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Creates a new load in the system
 * @param loadData - The load data to create
 * @returns Promise resolving to the created load
 */
export const createLoad = async (loadData: LoadCreationParams): Promise<Load> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Validate required load data fields
    if (!loadData.shipperId || !loadData.referenceNumber) {
      logger.error('Missing required load data fields');
      throw new Error('Missing required load data fields');
    }

    // Call loadApi.createLoad with load data
    logger.debug('Creating load', { loadData });
    const createdLoad = await loadApi.createLoad(loadData);

    // Clear any cached load lists that might be affected
    clearLoadListCache();

    // Show success notification
    notificationService.showSuccessNotification('Load created successfully');

    // Return the created load data
    return createdLoad;
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to create load', { loadData, error: apiError });
    notificationService.showErrorNotification(`Failed to create load: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Updates an existing load's information
 * @param loadId - The ID of the load to update
 * @param updateData - The data to update
 * @returns Promise resolving to the updated load
 */
export const updateLoad = async (loadId: string, updateData: LoadUpdateParams): Promise<Load> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Call loadApi.updateLoad with load ID and update data
    logger.debug('Updating load', { loadId, updateData });
    const updatedLoad = await loadApi.updateLoad(loadId, updateData);

    // Clear any cached load data for this load
    clearLoadCache(loadId);

    // Clear any cached load lists that might be affected
    clearLoadListCache();

    // Show success notification
    notificationService.showSuccessNotification('Load updated successfully');

    // Return the updated load data
    return updatedLoad;
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to update load', { loadId, updateData, error: apiError });
    notificationService.showErrorNotification(`Failed to update load: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Deletes a load from the system
 * @param loadId - The ID of the load to delete
 * @returns Promise resolving to deletion result
 */
export const deleteLoad = async (loadId: string): Promise<{ success: boolean; message: string; }> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Call loadApi.deleteLoad with load ID
    logger.debug('Deleting load', { loadId });
    const deletionResult = await loadApi.deleteLoad(loadId);

    // Clear any cached load data for this load
    clearLoadCache(loadId);

    // Clear any cached load lists that might be affected
    clearLoadListCache();

    // Show success notification
    notificationService.showSuccessNotification('Load deleted successfully');

    // Return the deletion result
    return deletionResult;
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to delete load', { loadId, error: apiError });
    notificationService.showErrorNotification(`Failed to delete load: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Updates the status of a load
 * @param loadId - The ID of the load to update
 * @param statusData - The status update data
 * @returns Promise resolving to the load with updated status
 */
export const updateLoadStatus = async (loadId: string, statusData: LoadStatusUpdateParams): Promise<Load> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Call loadApi.updateLoadStatus with load ID and status data
    logger.debug('Updating load status', { loadId, statusData });
    const updatedLoad = await loadApi.updateLoadStatus(loadId, statusData);

    // Clear any cached load data for this load
    clearLoadCache(loadId);

    // Clear any cached load lists that might be affected
    clearLoadListCache();

    // Show success notification
    notificationService.showSuccessNotification('Load status updated successfully');

    // Return the load with updated status
    return updatedLoad;
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to update load status', { loadId, statusData, error: apiError });
    notificationService.showErrorNotification(`Failed to update load status: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Retrieves documents associated with a load
 * @param loadId The ID of the load
 * @param documentType Optional filter for document type
 * @param bypassCache Optional flag to bypass the cache and fetch fresh data
 * @returns Promise resolving to array of load documents
 */
export const getLoadDocuments = async (
  loadId: string,
  documentType?: LoadDocumentType,
  bypassCache: boolean = false
): Promise<LoadDocument[]> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Call documentService.getLoadDocuments with load ID, document type, and bypassCache flag
    const documents = await documentService.getLoadDocuments(loadId, documentType, bypassCache);

    // Return the array of load documents
    return documents;
  } catch (error) {
    // Handle and log any errors, showing appropriate notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to retrieve load documents', { loadId, documentType, error: apiError });
    notificationService.showErrorNotification(`Failed to retrieve documents: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Uploads a document for a specific load
 * @param loadId The ID of the load
 * @param file The file to upload
 * @param documentType The type of document
 * @param metadata Additional metadata for the document
 * @returns Promise resolving to the uploaded document
 */
export const uploadLoadDocument = async (
  loadId: string,
  file: File,
  documentType: LoadDocumentType,
  metadata: Record<string, any> = {}
): Promise<LoadDocument> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Call documentService.uploadLoadDocument with load ID, file, document type, and metadata
    const uploadedDocument = await documentService.uploadLoadDocument(loadId, file, documentType, metadata);

    // Clear any cached documents for this load
    clearDocumentCache(loadId);

    // Show success notification
    notificationService.showSuccessNotification('Document uploaded successfully');

    // Return the uploaded document information
    return uploadedDocument;
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to upload document', { loadId, filename: file.name, error: apiError });
    notificationService.showErrorNotification(`Failed to upload document: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Deletes a document associated with a load
 * @param loadId The ID of the load
 * @param documentId The ID of the document to delete
 * @returns Promise resolving to deletion result
 */
export const deleteLoadDocument = async (
  loadId: string,
  documentId: string
): Promise<{ success: boolean; message: string; }> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Call documentService.deleteLoadDocument with load ID and document ID
    const deletionResult = await documentService.deleteLoadDocument(loadId, documentId);

    // Clear any cached documents for this load
    clearDocumentCache(loadId);

    // Show success notification
    notificationService.showSuccessNotification('Document deleted successfully');

    // Return the deletion result
    return deletionResult;
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to delete document', { loadId, documentId, error: apiError });
    notificationService.showErrorNotification(`Failed to delete document: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Gets real-time tracking information for a load
 * @param loadId The ID of the load
 * @returns Promise resolving to tracking information
 */
export const getLoadTracking = async (loadId: string): Promise<{
  position: Position | null;
  eta: { estimatedArrivalTime: string; } | null;
}> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Get the load details to determine the assigned vehicle/driver
    const load = await getLoadById(loadId, true);

    // If load is assigned, get current position using trackingService.getCurrentPosition
    if (load && (load as LoadWithDetails).assignments && (load as LoadWithDetails).assignments.length > 0) {
      const assignment = (load as LoadWithDetails).assignments[0];
      const position = await trackingService.getCurrentPosition(assignment.vehicleId, 'vehicle');

      // If position is available, calculate ETA using trackingService.getETA
      if (position && (load as LoadWithDetails).locations && (load as LoadWithDetails).locations.length > 0) {
        const deliveryLocation = (load as LoadWithDetails).locations.find(loc => loc.locationType === 'delivery');
        if (deliveryLocation) {
          const eta = await trackingService.getETA(
            assignment.vehicleId,
            'vehicle',
            deliveryLocation.coordinates.latitude,
            deliveryLocation.coordinates.longitude,
            { considerTraffic: true, considerWeather: true, considerHOS: true }
          );

          return { position, eta };
        }
      }
      return { position: null, eta: null };
    }
    return { position: null, eta: null };
  } catch (error) {
    // Handle and log any errors, showing appropriate notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to get load tracking', { loadId, error: apiError });
    notificationService.showErrorNotification(`Failed to get load tracking: ${apiError.message}`);
    return { position: null, eta: null };
  }
};

/**
 * Subscribes to real-time updates for a specific load
 * @param loadId Load ID
 * @param onPositionUpdate Callback for position updates
 * @param onStatusUpdate Callback for status updates
 * @returns Unsubscribe function that closes all subscriptions when called
 */
export const subscribeToLoadUpdates = (
  loadId: string,
  onPositionUpdate: (position: Position) => void,
  onStatusUpdate: (status: LoadStatus, details: any) => void
): Function => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    return () => {}; // Return a no-op unsubscribe function
  }

  // Subscribe to position updates using trackingService.subscribeToPositionUpdates
  const unsubscribePositionUpdates = trackingService.subscribeToPositionUpdates(
    loadId,
    'load',
    onPositionUpdate,
    (error) => {
      logger.error('Error subscribing to position updates', { loadId, error });
      notificationService.showErrorNotification(`Error subscribing to position updates: ${error.message}`);
    }
  );

  // Subscribe to load status updates
  // TODO: Implement WebSocket subscription for load status updates

  // Return unsubscribe function that closes all subscriptions when called
  return () => {
    unsubscribePositionUpdates();
    // TODO: Implement WebSocket unsubscription for load status updates
  };
};

/**
 * Gets AI-recommended carriers for a load
 * @param loadId The ID of the load
 * @param options Additional options for carrier recommendations
 * @returns Promise resolving to carrier recommendations
 */
export const getCarrierRecommendations = async (
  loadId: string,
  options: any = {}
): Promise<{ carriers: CarrierRecommendation[]; }> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Call the carrier recommendation API endpoint with load ID and options
    logger.debug('Fetching carrier recommendations', { loadId, options });
    const recommendations = await loadApi.getLoadRecommendations(loadId, options);

    // Return the carrier recommendations with scoring factors
    return recommendations;
  } catch (error) {
    // Handle and log any errors, showing appropriate notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to retrieve carrier recommendations', { loadId, options, error: apiError });
    notificationService.showErrorNotification(`Failed to retrieve carrier recommendations: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Assigns a load to a specific carrier
 * @param loadId The ID of the load
 * @param carrierId The ID of the carrier to assign the load to
 * @param assignmentData Additional assignment data
 * @returns Promise resolving to assignment result
 */
export const assignLoadToCarrier = async (
  loadId: string,
  carrierId: string,
  assignmentData: any = {}
): Promise<{ success: boolean; assignment: any; }> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Call the load assignment API endpoint with load ID, carrier ID, and assignment data
    logger.debug('Assigning load to carrier', { loadId, carrierId, assignmentData });
    const assignmentResult = await loadApi.acceptLoad(loadId, carrierId, assignmentData);

    // Clear any cached load data for this load
    clearLoadCache(loadId);

    // Show success notification
    notificationService.showSuccessNotification('Load assigned to carrier successfully');

    // Return the assignment result
    return assignmentResult;
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to assign load to carrier', { loadId, carrierId, assignmentData, error: apiError });
    notificationService.showErrorNotification(`Failed to assign load to carrier: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Clears cached load data for a specific load
 * @param loadId The ID of the load
 */
export const clearLoadCache = (loadId: string): void => {
  // Generate cache key based on load ID
  const cacheKey = `${LOAD_CACHE_PREFIX}${loadId}`;

  try {
    // Remove the cache entry from storage
    storageService.removeItem(cacheKey);
    logger.debug('Cleared load cache', { loadId, cacheKey });
  } catch (error) {
    logger.error('Error clearing load cache', { loadId, cacheKey, error });
  }
};

/**
 * Clears all cached load list data
 */
export const clearLoadListCache = (): void => {
  try {
    // Get all storage keys that match the load list cache prefix
    const allKeys = storageService.getKeys();
    const matchingKeys = allKeys.filter(key => key.startsWith(LOAD_LIST_CACHE_PREFIX));

    // Remove each load list cache entry from storage
    matchingKeys.forEach(key => {
      storageService.removeItem(key);
      logger.debug('Cleared load list cache', { cacheKey: key });
    });
  } catch (error) {
    logger.error('Error clearing load list cache', { error });
  }
};

// Export all functions as a service object
export default {
  getLoads,
  getLoadById,
  createLoad,
  updateLoad,
  deleteLoad,
  updateLoadStatus,
  getLoadDocuments,
  uploadLoadDocument,
  deleteLoadDocument,
  getLoadTracking,
  subscribeToLoadUpdates,
  getCarrierRecommendations,
  assignLoadToCarrier,
  clearLoadCache,
  clearLoadListCache
};