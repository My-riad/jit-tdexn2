import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../../common/utils/logger';
import { setItem, getItem, removeItem, clear } from '../../../common/utils/localStorage';

// Constants
const QUEUED_REQUESTS_KEY = 'queued_requests';
const CACHED_DATA_KEY_PREFIX = 'cached_data_';
const DEFAULT_CACHE_EXPIRATION = 86400000; // 24 hours in milliseconds

// Interfaces
export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
  retryCount: number;
  options?: any;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  expiration: number;
}

/**
 * Stores data in persistent storage with error handling
 * @param key The key to store the value under
 * @param value The value to store
 * @returns Promise that resolves to true if storage was successful
 */
export async function storeData(key: string, value: any): Promise<boolean> {
  try {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    logger.debug(`Successfully stored data for key: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Failed to store data for key: ${key}`, { error });
    return false;
  }
}

/**
 * Retrieves data from persistent storage with error handling
 * @param key The key to retrieve the value for
 * @param defaultValue The default value to return if the key doesn't exist
 * @returns Promise that resolves to the retrieved value or defaultValue if not found
 */
export async function retrieveData<T>(key: string, defaultValue?: T): Promise<T | null | undefined> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    
    if (jsonValue === null) {
      logger.debug(`No data found for key: ${key}, returning default value`);
      return defaultValue;
    }
    
    try {
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch {
      // If it's not JSON, return as is
      return jsonValue as unknown as T;
    }
  } catch (error) {
    logger.error(`Failed to retrieve data for key: ${key}`, { error });
    return defaultValue;
  }
}

/**
 * Removes data from persistent storage with error handling
 * @param key The key to remove
 * @returns Promise that resolves to true if removal was successful
 */
export async function removeData(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    logger.debug(`Successfully removed data for key: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Failed to remove data for key: ${key}`, { error });
    return false;
  }
}

/**
 * Clears all data from persistent storage with error handling
 * @returns Promise that resolves to true if clearing was successful
 */
export async function clearAllData(): Promise<boolean> {
  try {
    await AsyncStorage.clear();
    logger.info('Successfully cleared all data from storage');
    return true;
  } catch (error) {
    logger.error('Failed to clear all data from storage', { error });
    return false;
  }
}

/**
 * Retrieves all queued API requests for offline synchronization
 * @returns Promise that resolves to an array of queued requests
 */
export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const requests = await retrieveData<QueuedRequest[]>(QUEUED_REQUESTS_KEY, []);
  logger.debug(`Retrieved ${requests?.length || 0} queued requests`);
  return requests || [];
}

/**
 * Saves the queue of API requests to persistent storage
 * @param requests Array of queued requests to save
 * @returns Promise that resolves to true if saving was successful
 */
export async function saveQueuedRequests(requests: QueuedRequest[]): Promise<boolean> {
  const result = await storeData(QUEUED_REQUESTS_KEY, requests);
  logger.debug(`Saved ${requests.length} queued requests`);
  return result;
}

/**
 * Adds a new API request to the offline queue
 * @param endpoint API endpoint for the request
 * @param method HTTP method for the request
 * @param data Request payload
 * @param options Additional request options
 * @returns Promise that resolves to an object indicating if the request was queued and its ID
 */
export async function addQueuedRequest(
  endpoint: string,
  method: string,
  data: any,
  options?: any
): Promise<{ queued: boolean; id: string }> {
  const requestId = uuidv4();
  
  try {
    const requests = await getQueuedRequests();
    
    const newRequest: QueuedRequest = {
      id: requestId,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      options
    };
    
    requests.push(newRequest);
    const saved = await saveQueuedRequests(requests);
    
    logger.info(
      `Added request to queue: ${method} ${endpoint}`,
      { requestId, saved }
    );
    
    return { queued: saved, id: requestId };
  } catch (error) {
    logger.error(`Failed to add request to queue: ${method} ${endpoint}`, { error });
    return { queued: false, id: requestId };
  }
}

/**
 * Removes a request from the offline queue by ID
 * @param requestId ID of the request to remove
 * @returns Promise that resolves to true if removal was successful
 */
export async function removeQueuedRequest(requestId: string): Promise<boolean> {
  try {
    const requests = await getQueuedRequests();
    const initialLength = requests.length;
    
    const filteredRequests = requests.filter(request => request.id !== requestId);
    
    if (filteredRequests.length === initialLength) {
      logger.debug(`Request with ID ${requestId} not found in queue`);
      return false;
    }
    
    const saved = await saveQueuedRequests(filteredRequests);
    logger.info(`Removed request with ID ${requestId} from queue`);
    
    return saved;
  } catch (error) {
    logger.error(`Failed to remove request with ID ${requestId}`, { error });
    return false;
  }
}

/**
 * Caches data for offline access with optional expiration
 * @param key The key to store the cached data under
 * @param data The data to cache
 * @param options Cache options (e.g., expiration time)
 * @returns Promise that resolves to true if caching was successful
 */
export async function cacheData(
  key: string,
  data: any,
  options?: { expiration?: number }
): Promise<boolean> {
  const cacheKey = `${CACHED_DATA_KEY_PREFIX}${key}`;
  
  const cacheEntry: CacheEntry = {
    data,
    timestamp: Date.now(),
    expiration: options?.expiration || DEFAULT_CACHE_EXPIRATION
  };
  
  const result = await storeData(cacheKey, cacheEntry);
  logger.debug(`Cached data for key: ${key}, expiration: ${cacheEntry.expiration}ms`);
  
  return result;
}

/**
 * Retrieves cached data with expiration checking
 * @param key The key to retrieve cached data for
 * @param defaultValue The default value to return if cache doesn't exist or is expired
 * @returns Promise that resolves to the cached data or defaultValue if not found or expired
 */
export async function getCachedData<T>(key: string, defaultValue?: T): Promise<T | null | undefined> {
  const cacheKey = `${CACHED_DATA_KEY_PREFIX}${key}`;
  
  try {
    const cacheEntry = await retrieveData<CacheEntry>(cacheKey);
    
    if (!cacheEntry) {
      logger.debug(`No cache entry found for key: ${key}`);
      return defaultValue;
    }
    
    const now = Date.now();
    const isExpired = now - cacheEntry.timestamp > cacheEntry.expiration;
    
    if (isExpired) {
      logger.debug(`Cache entry expired for key: ${key}`);
      await removeData(cacheKey);
      return defaultValue;
    }
    
    logger.debug(`Retrieved valid cache entry for key: ${key}`);
    return cacheEntry.data;
  } catch (error) {
    logger.error(`Failed to retrieve cached data for key: ${key}`, { error });
    return defaultValue;
  }
}

/**
 * Removes cached data by key
 * @param key The key to remove cached data for
 * @returns Promise that resolves to true if removal was successful
 */
export async function removeCachedData(key: string): Promise<boolean> {
  const cacheKey = `${CACHED_DATA_KEY_PREFIX}${key}`;
  const result = await removeData(cacheKey);
  logger.debug(`Removed cached data for key: ${key}`);
  return result;
}

/**
 * Clears all cached data but preserves queued requests
 * @returns Promise that resolves to true if clearing was successful
 */
export async function clearAllCachedData(): Promise<boolean> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHED_DATA_KEY_PREFIX));
    
    if (cacheKeys.length === 0) {
      logger.debug('No cached data to clear');
      return true;
    }
    
    await AsyncStorage.multiRemove(cacheKeys);
    logger.info(`Cleared ${cacheKeys.length} cached items`);
    
    return true;
  } catch (error) {
    logger.error('Failed to clear all cached data', { error });
    return false;
  }
}

/**
 * Checks if the device is currently connected to the network
 * @returns Promise that resolves to true if connected, false otherwise
 */
export async function isNetworkConnected(): Promise<boolean> {
  try {
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected === true;
    
    logger.debug(`Network connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    return isConnected;
  } catch (error) {
    logger.error('Failed to check network connection status', { error });
    return false;
  }
}