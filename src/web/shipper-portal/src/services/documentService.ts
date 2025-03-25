/**
 * Service that provides document management functionality for the shipper portal of the AI-driven Freight Optimization Platform.
 * It handles retrieving, uploading, downloading, viewing, and deleting load-related documents such as bills of lading, proof of delivery, and rate confirmations.
 */

import { AxiosError } from 'axios'; // ^1.4.0
import * as loadApi from '../../../common/api/loadApi';
import { LoadDocument, LoadDocumentType } from '../../../common/interfaces/load.interface';
import { handleApiError, retryWithBackoff } from '../../../common/utils/errorHandlers';
import logger from '../../../common/utils/logger';
import { isAuthenticated } from '../../../common/services/authService';
import notificationService from '../../../common/services/notificationService';
import storageService from '../../../common/services/storageService';

// Constants for document management
const DOCUMENT_CACHE_PREFIX = 'shipper_document_';
const DOCUMENT_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

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

  // Generate cache key based on load ID and document type
  const cacheKey = `${DOCUMENT_CACHE_PREFIX}${loadId}${documentType ? `_${documentType}` : ''}`;

  // Try to get cached documents if bypassCache is false
  if (!bypassCache) {
    try {
      const cachedDocuments = storageService.getItem<LoadDocument[]>(cacheKey);
      if (cachedDocuments) {
        logger.debug('Returning cached documents', { loadId, documentType, cacheKey });
        return cachedDocuments;
      }
    } catch (cacheError) {
      logger.warn('Error retrieving documents from cache, ignoring', { loadId, documentType, cacheKey, cacheError });
    }
  }

  try {
    // If no valid cache or bypassCache is true, call loadApi.getLoadDocuments
    const documents = await loadApi.getLoadDocuments(loadId, documentType);

    // Cache the results for future use
    try {
      storageService.setItem(cacheKey, documents);
      setTimeout(() => {
        clearDocumentCache(loadId);
      }, DOCUMENT_CACHE_EXPIRY);
      logger.debug('Caching documents', { loadId, documentType, cacheKey });
    } catch (cacheError) {
      logger.warn('Error caching documents', { loadId, documentType, cacheKey, cacheError });
    }

    // Return the documents array
    return documents;
  } catch (error) {
    // Handle and log any errors, showing appropriate notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to retrieve load documents', { loadId, documentType, error: apiError });
    notificationService.showErrorNotification(`Failed to retrieve documents for load ${loadId}: ${apiError.message}`);
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

  // Validate the file type and size
  const validationResult = validateDocumentFile(file);
  if (!validationResult.valid) {
    logger.error('Invalid file for upload', { loadId, filename: file.name, error: validationResult.error });
    notificationService.showErrorNotification(`Invalid file: ${validationResult.error}`);
    throw new Error(validationResult.error);
  }

  try {
    // Create a FormData object and append file, document type, and metadata
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    // Call loadApi.uploadLoadDocument with the FormData
    const uploadedDocument = await loadApi.uploadLoadDocument(loadId, formData);

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
    // Call loadApi.deleteLoadDocument with load ID and document ID
    const deletionResult = await loadApi.deleteLoadDocument(loadId, documentId);

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
 * Downloads a document to the user's device
 * @param document The document to download
 * @returns Promise resolving when download is initiated
 */
export const downloadDocument = async (document: LoadDocument): Promise<void> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Create a temporary anchor element
    const link = document.createElement('a');

    // Set the href attribute to the document URL
    link.href = document.url;

    // Set the download attribute to the document filename
    link.download = document.filename;

    // Trigger a click on the anchor element to start the download
    link.click();

    // Remove the temporary anchor element
    link.remove();
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to download document', { documentId: document.id, error: apiError });
    notificationService.showErrorNotification(`Failed to download document: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Opens a document in a new browser tab for viewing
 * @param document The document to view
 * @returns Promise resolving when document is opened
 */
export const viewDocument = async (document: LoadDocument): Promise<void> => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    logger.error('User is not authenticated');
    throw new Error('User is not authenticated');
  }

  try {
    // Open a new browser tab with the document URL
    window.open(document.url, '_blank');
  } catch (error) {
    // Handle and log any errors, showing appropriate error notifications
    const apiError = handleApiError(error as AxiosError);
    logger.error('Failed to view document', { documentId: document.id, error: apiError });
    notificationService.showErrorNotification(`Failed to view document: ${apiError.message}`);
    throw apiError;
  }
};

/**
 * Validates a file for document upload
 * @param file The file to validate
 * @returns Validation result with optional error message
 */
export const validateDocumentFile = (file: File): { valid: boolean; error?: string; } => {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Validate file type against ALLOWED_DOCUMENT_TYPES
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid document type. Allowed types: PDF, JPEG, PNG, DOC, DOCX' };
  }

  // Validate file size against MAX_DOCUMENT_SIZE
  if (file.size > MAX_DOCUMENT_SIZE) {
    return { valid: false, error: 'File size exceeds the maximum allowed size (10MB)' };
  }

  // Return { valid: true } if file is valid
  return { valid: true };
};

/**
 * Gets a human-readable label for a document type
 * @param documentType The document type
 * @returns Human-readable document type label
 */
export const getDocumentTypeLabel = (documentType: LoadDocumentType): string => {
  // Map the LoadDocumentType enum value to a user-friendly string
  switch (documentType) {
    case LoadDocumentType.BILL_OF_LADING:
      return 'Bill of Lading';
    case LoadDocumentType.PROOF_OF_DELIVERY:
      return 'Proof of Delivery';
    case LoadDocumentType.RATE_CONFIRMATION:
      return 'Rate Confirmation';
    case LoadDocumentType.INVOICE:
      return 'Invoice';
    case LoadDocumentType.CUSTOMS_DOCUMENT:
      return 'Customs Document';
    case LoadDocumentType.HAZMAT_DOCUMENT:
      return 'Hazmat Document';
    case LoadDocumentType.INSPECTION_DOCUMENT:
      return 'Inspection Document';
    case LoadDocumentType.OTHER:
      return 'Other Document';
    default:
      return 'Document';
  }
};

/**
 * Clears cached document data for a specific load
 * @param loadId The ID of the load
 */
export const clearDocumentCache = (loadId: string): void => {
  // Generate cache key pattern based on load ID
  const cacheKeyPattern = `${DOCUMENT_CACHE_PREFIX}${loadId}`;

  try {
    // Get all storage keys that match the pattern
    const allKeys = storageService.getKeys();
    const matchingKeys = allKeys.filter(key => key.startsWith(cacheKeyPattern));

    // Remove each matching cache entry from storage
    matchingKeys.forEach(key => {
      storageService.removeItem(key);
      logger.debug('Cleared document cache', { loadId, cacheKey: key });
    });
  } catch (error) {
    logger.error('Error clearing document cache', { loadId, cacheKeyPattern, error });
  }
};

// Export all functions as a service object
export default {
  getLoadDocuments,
  uploadLoadDocument,
  deleteLoadDocument,
  downloadDocument,
  viewDocument,
  validateDocumentFile,
  getDocumentTypeLabel,
  clearDocumentCache
};