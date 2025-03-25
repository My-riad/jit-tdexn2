import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import {
  storeData,
  retrieveData,
  removeData,
  getQueuedRequests,
  saveQueuedRequests,
  addQueuedRequest,
  removeQueuedRequest,
  cacheData,
  getCachedData,
  QueuedRequest
} from '../services/offlineStorageService';
import logger from '../../common/utils/logger';

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const SYNC_RETRY_DELAY = 5000; // 5 seconds
const DEFAULT_CACHE_EXPIRATION = 86400000; // 24 hours in milliseconds

// Interfaces
export interface OfflineSyncOptions {
  maxRetryAttempts?: number;
  autoSync?: boolean;
  defaultCacheExpiration?: number;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<any>;
}

interface OfflineSyncHookResult {
  isOnline: boolean;
  isSynchronizing: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  synchronize: () => Promise<SyncResult>;
  queueRequest: (endpoint: string, method: string, data?: any, options?: any) => Promise<{ queued: boolean, id: string }>;
  cacheData: (key: string, data: any, options?: any) => Promise<boolean>;
  getCachedData: (key: string, defaultValue?: any) => Promise<any>;
  clearOfflineData: () => Promise<boolean>;
}

/**
 * Custom React hook that provides offline data synchronization capabilities for the driver mobile application.
 * Manages the queuing of API requests when offline, caching of data, and synchronization with the backend
 * when connectivity is restored.
 * 
 * @param options Configuration options for offline synchronization
 * @returns Object containing offline synchronization state and methods
 */
const useOfflineSync = (options: OfflineSyncOptions = {}): OfflineSyncHookResult => {
  // Configure options with defaults
  const maxRetryAttempts = options.maxRetryAttempts ?? MAX_RETRY_ATTEMPTS;
  const autoSync = options.autoSync ?? true;
  const defaultCacheExpiration = options.defaultCacheExpiration ?? DEFAULT_CACHE_EXPIRATION;

  // State for tracking online status and synchronization
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSynchronizing, setIsSynchronizing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingOperations, setPendingOperations] = useState<number>(0);
  
  // Refs for tracking sync state between renders
  const synchronizingRef = useRef<boolean>(false);
  const networkListener = useRef<NetInfo.NetInfoSubscription | null>(null);

  /**
   * Updates the pending operations count based on the current queue
   */
  const updatePendingOperationsCount = useCallback(async () => {
    try {
      const requests = await getQueuedRequests();
      setPendingOperations(requests.length);
      logger.debug('Updated pending operations count', { count: requests.length });
    } catch (error) {
      logger.error('Failed to update pending operations count', { error });
    }
  }, []);

  /**
   * Initializes the hook by checking network status and pending operations
   */
  const initialize = useCallback(async () => {
    try {
      // Check initial network state
      const netInfo = await NetInfo.fetch();
      const initialOnlineState = netInfo.isConnected === true && netInfo.isInternetReachable !== false;
      setIsOnline(initialOnlineState);
      
      // Update pending operations count
      await updatePendingOperationsCount();
      
      logger.info('Offline sync hook initialized', { 
        isOnline: initialOnlineState, 
        autoSync, 
        maxRetryAttempts,
        defaultCacheExpiration
      });
    } catch (error) {
      logger.error('Failed to initialize offline sync hook', { error });
    }
  }, [autoSync, maxRetryAttempts, defaultCacheExpiration, updatePendingOperationsCount]);

  /**
   * Adds a request to the offline queue when offline, or tries to execute it immediately when online
   * @param endpoint API endpoint
   * @param method HTTP method
   * @param data Request data
   * @param options Additional request options
   * @returns Object indicating if request was queued successfully and the request ID
   */
  const queueRequest = useCallback(async (
    endpoint: string,
    method: string,
    data?: any,
    options?: any
  ): Promise<{ queued: boolean, id: string }> => {
    if (isOnline && !options?.forceQueue) {
      // If we're online, try to make the request immediately
      try {
        logger.debug(`Executing request immediately: ${method} ${endpoint}`);
        
        // Prepare fetch options
        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {})
          },
        };
        
        // Add body for non-GET requests
        if (method !== 'GET' && data) {
          fetchOptions.body = JSON.stringify(data);
        }
        
        // Make the request
        const response = await fetch(endpoint, fetchOptions);
        
        // Check if successful
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        
        logger.info(`Successfully executed request: ${method} ${endpoint}`);
        return { queued: false, id: uuidv4() };
      } catch (error) {
        // If the request fails, queue it for later
        logger.warn(`Failed to execute request, queueing instead: ${method} ${endpoint}`, { error });
        return addQueuedRequest(endpoint, method, data, options);
      }
    } else {
      // If we're offline, queue the request
      logger.debug(`Queueing offline request: ${method} ${endpoint}`);
      
      const result = await addQueuedRequest(endpoint, method, data, options);
      
      if (result.queued) {
        logger.info(`Successfully queued offline request: ${method} ${endpoint}`, { requestId: result.id });
        await updatePendingOperationsCount();
      }
      
      return result;
    }
  }, [isOnline, updatePendingOperationsCount]);

  /**
   * Caches data for offline access
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options
   * @returns True if caching was successful
   */
  const cacheDataFn = useCallback(async (
    key: string,
    data: any,
    options?: { expiration?: number }
  ): Promise<boolean> => {
    try {
      const expiration = options?.expiration ?? defaultCacheExpiration;
      const result = await cacheData(key, data, { expiration });
      
      logger.debug(`Cached data with key: ${key}`, { 
        success: result, 
        expiration 
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to cache data with key: ${key}`, { error });
      return false;
    }
  }, [defaultCacheExpiration]);

  /**
   * Retrieves cached data
   * @param key Cache key
   * @param defaultValue Default value if cache doesn't exist
   * @returns Cached data or default value
   */
  const getCachedDataFn = useCallback(async <T>(
    key: string,
    defaultValue?: T
  ): Promise<T | null | undefined> => {
    try {
      const data = await getCachedData<T>(key, defaultValue);
      const found = data !== defaultValue;
      
      logger.debug(`Retrieved cached data for key: ${key}`, { found });
      
      return data;
    } catch (error) {
      logger.error(`Failed to retrieve cached data for key: ${key}`, { error });
      return defaultValue;
    }
  }, []);

  /**
   * Determines if a request failure is a transient error that should be retried
   * @param error The error that occurred
   * @returns True if the error is transient and should be retried
   */
  const isTransientError = useCallback((error: any): boolean => {
    // Network errors are typically transient
    if (error instanceof TypeError && error.message.includes('Network')) {
      return true;
    }
    
    // Consider server errors (5xx) as transient
    if (error.status && error.status >= 500 && error.status < 600) {
      return true;
    }
    
    // Consider throttling/rate limiting as transient
    if (error.status === 429) {
      return true;
    }
    
    // Gateway errors can be transient
    if (error.status === 502 || error.status === 503 || error.status === 504) {
      return true;
    }
    
    // Default to non-transient for other errors
    return false;
  }, []);

  /**
   * Processes a single queued request
   * @param request The request to process
   * @returns Object indicating success or failure of the request
   */
  const processQueuedRequest = useCallback(async (
    request: QueuedRequest
  ): Promise<{ success: boolean, error?: any, transient?: boolean }> => {
    logger.debug(`Processing queued request: ${request.method} ${request.endpoint}`, {
      requestId: request.id,
      retryCount: request.retryCount
    });
    
    try {
      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...(request.options?.headers || {})
        },
      };
      
      // Add body for non-GET requests
      if (request.method !== 'GET' && request.data) {
        fetchOptions.body = JSON.stringify(request.data);
      }
      
      // Send the request
      const response = await fetch(request.endpoint, fetchOptions);
      
      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`Request failed with status ${response.status}: ${errorText}`, {
          requestId: request.id
        });
        
        const error = {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        };
        
        return {
          success: false,
          error,
          transient: isTransientError(error)
        };
      }
      
      logger.info(`Successfully processed queued request: ${request.method} ${request.endpoint}`, {
        requestId: request.id,
        status: response.status
      });
      
      return { success: true };
    } catch (error) {
      logger.error(`Error processing queued request: ${request.method} ${request.endpoint}`, {
        requestId: request.id,
        error
      });
      
      return { 
        success: false, 
        error,
        transient: isTransientError(error)
      };
    }
  }, [isTransientError]);

  /**
   * Synchronizes all queued requests with the backend
   * @returns Object with synchronization results
   */
  const synchronize = useCallback(async (): Promise<SyncResult> => {
    // Prevent multiple simultaneous synchronizations
    if (synchronizingRef.current) {
      logger.info('Synchronization already in progress, skipping');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [{ message: 'Synchronization already in progress' }]
      };
    }
    
    // Check if we're online
    if (!isOnline) {
      logger.info('Cannot synchronize while offline');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [{ message: 'Device is offline' }]
      };
    }
    
    // Set synchronization state
    synchronizingRef.current = true;
    setIsSynchronizing(true);
    
    logger.info('Starting synchronization of queued requests');
    
    try {
      // Get all queued requests
      const queuedRequests = await getQueuedRequests();
      
      if (queuedRequests.length === 0) {
        logger.info('No queued requests to synchronize');
        setLastSyncTime(new Date());
        synchronizingRef.current = false;
        setIsSynchronizing(false);
        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          errors: []
        };
      }
      
      logger.info(`Synchronizing ${queuedRequests.length} queued requests`);
      
      // Process results
      let syncedCount = 0;
      let failedCount = 0;
      const errors: Array<any> = [];
      const remainingRequests: QueuedRequest[] = [];
      
      // Process each request
      for (const request of queuedRequests) {
        const result = await processQueuedRequest(request);
        
        if (result.success) {
          // Request succeeded, remove from queue
          syncedCount++;
          await removeQueuedRequest(request.id);
        } else {
          // Request failed, handle based on retry count and error type
          const isTransient = result.transient !== false; // Default to true for backward compatibility
          
          if (!isTransient || request.retryCount >= maxRetryAttempts) {
            // Non-transient error or max retries reached, remove from queue and report error
            failedCount++;
            await removeQueuedRequest(request.id);
            errors.push({
              requestId: request.id,
              endpoint: request.endpoint,
              method: request.method,
              error: result.error,
              message: isTransient 
                ? `Max retry attempts (${maxRetryAttempts}) reached` 
                : 'Permanent error, not retrying'
            });
          } else {
            // Transient error, increment retry count and keep in queue
            const updatedRequest = {
              ...request,
              retryCount: request.retryCount + 1
            };
            remainingRequests.push(updatedRequest);
            errors.push({
              requestId: request.id,
              endpoint: request.endpoint,
              method: request.method,
              retryCount: updatedRequest.retryCount,
              error: result.error,
              message: 'Will retry later'
            });
          }
        }
      }
      
      // Save remaining requests to the queue
      if (remainingRequests.length > 0) {
        await saveQueuedRequests(remainingRequests);
      }
      
      // Update state
      await updatePendingOperationsCount();
      setLastSyncTime(new Date());
      
      const success = failedCount === 0;
      logger.info(`Synchronization completed: ${syncedCount} synced, ${failedCount} failed, ${remainingRequests.length} pending retry`, {
        success
      });
      
      return {
        success,
        syncedCount,
        failedCount,
        errors
      };
    } catch (error) {
      logger.error('Error during synchronization', { error });
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [{ message: 'Synchronization error', error }]
      };
    } finally {
      synchronizingRef.current = false;
      setIsSynchronizing(false);
    }
  }, [isOnline, maxRetryAttempts, processQueuedRequest, updatePendingOperationsCount]);

  /**
   * Clears all offline data (queued requests and cached data)
   * @returns True if clearing was successful
   */
  const clearOfflineData = useCallback(async (): Promise<boolean> => {
    try {
      logger.info('Clearing all offline data');
      
      // Clear queued requests
      await saveQueuedRequests([]);
      
      // Clear all cached data from offlineStorageService
      // Using its built-in mechanism would be ideal but we'll implement a fallback
      try {
        // First try using the clearAllCachedData function if it exists
        const moduleAny = require('../services/offlineStorageService');
        if (moduleAny.clearAllCachedData) {
          await moduleAny.clearAllCachedData();
        } else {
          throw new Error('clearAllCachedData function not found');
        }
      } catch (clearError) {
        // Fallback to manual clearing
        logger.warn('Using fallback method to clear cached data', { clearError });
        
        // Note: This is a simplified approach. A better implementation would
        // track cached keys or scan AsyncStorage for cache keys.
        const keys = await retrieveData<string[]>('cachedDataKeys', []);
        for (const key of keys) {
          await removeData(`cachedData_${key}`);
        }
        await removeData('cachedDataKeys');
      }
      
      // Update state
      await updatePendingOperationsCount();
      
      logger.info('Successfully cleared all offline data');
      return true;
    } catch (error) {
      logger.error('Failed to clear offline data', { error });
      return false;
    }
  }, [updatePendingOperationsCount]);

  // Set up network state listener on mount
  useEffect(() => {
    // Initial setup
    initialize();
    
    // Set up network listener
    networkListener.current = NetInfo.addEventListener(state => {
      const newConnectionStatus = state.isConnected === true && state.isInternetReachable !== false;
      
      logger.debug('Network connection changed', { 
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type 
      });
      
      // Only take action if state is actually changing
      if (isOnline !== newConnectionStatus) {
        // If we're transitioning from offline to online and auto-sync is enabled
        if (!isOnline && newConnectionStatus && autoSync) {
          logger.info('Network connection restored, triggering auto-sync');
          // Add a small delay to ensure connection is stable
          setTimeout(() => {
            if (!synchronizingRef.current) {
              synchronize().catch(error => {
                logger.error('Auto-sync failed', { error });
              });
            }
          }, SYNC_RETRY_DELAY);
        }
        
        setIsOnline(newConnectionStatus);
      }
    });
    
    // Clean up on unmount
    return () => {
      if (networkListener.current) {
        networkListener.current();
        networkListener.current = null;
        logger.debug('Network listener cleaned up');
      }
    };
  }, [autoSync, isOnline, initialize, synchronize]);

  // Return the hook interface
  return {
    isOnline,
    isSynchronizing,
    lastSyncTime,
    pendingOperations,
    synchronize,
    queueRequest,
    cacheData: cacheDataFn,
    getCachedData: getCachedDataFn,
    clearOfflineData
  };
};

export default useOfflineSync;