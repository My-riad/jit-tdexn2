/**
 * Utility functions for interacting with the browser's sessionStorage API with 
 * type safety, error handling, and serialization/deserialization of complex data types.
 * 
 * These functions provide a consistent interface for session-based client-side storage
 * that persists only for the duration of the page session.
 */

import logger from './logger';

/**
 * Stores a value in sessionStorage with proper serialization of objects and error handling
 * @param key The key under which to store the value
 * @param value The value to store (can be any serializable type)
 * @returns True if the operation was successful, false otherwise
 */
export function setItem(key: string, value: any): boolean {
  try {
    // Check if sessionStorage is available
    if (!isAvailable()) {
      logger.error('sessionStorage is not available in this environment', {
        component: 'sessionStorage'
      });
      return false;
    }

    // Handle special cases
    if (value === undefined) {
      // Store undefined as null to maintain consistency
      sessionStorage.setItem(key, 'null');
      return true;
    }

    // Handle objects, arrays, null by stringifying them
    const valueToStore = 
      value === null || typeof value === 'object' ? 
      JSON.stringify(value) : 
      String(value); // Convert primitives to string
    
    // Store the value
    sessionStorage.setItem(key, valueToStore);
    return true;
  } catch (error) {
    // Log errors (like quota exceeded or permission denied)
    logger.error('Failed to store data in sessionStorage', { 
      error,
      component: 'sessionStorage',
      key,
      valueType: typeof value 
    });
    return false;
  }
}

/**
 * Retrieves a value from sessionStorage with proper deserialization and type handling
 * @param key The key of the value to retrieve
 * @param defaultValue The default value to return if the key is not found or an error occurs
 * @returns The retrieved value or defaultValue if not found
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    // Check if sessionStorage is available
    if (!isAvailable()) {
      logger.error('sessionStorage is not available in this environment', {
        component: 'sessionStorage'
      });
      return defaultValue;
    }

    // Get the stored value
    const storedValue = sessionStorage.getItem(key);
    
    // Return default value if the key doesn't exist
    if (storedValue === null) {
      return defaultValue;
    }

    // Try to parse as JSON
    try {
      const parsedValue = JSON.parse(storedValue);
      return parsedValue as T;
    } catch (parseError) {
      // Not valid JSON, return as is
      return storedValue as unknown as T;
    }
  } catch (error) {
    // Log errors and return the default value
    logger.error('Failed to retrieve data from sessionStorage', { 
      error,
      component: 'sessionStorage',
      key 
    });
    return defaultValue;
  }
}

/**
 * Removes an item from sessionStorage with error handling
 * @param key The key of the item to remove
 * @returns True if the operation was successful, false otherwise
 */
export function removeItem(key: string): boolean {
  try {
    // Check if sessionStorage is available
    if (!isAvailable()) {
      logger.error('sessionStorage is not available in this environment', {
        component: 'sessionStorage'
      });
      return false;
    }

    // Remove the item
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    // Log errors
    logger.error('Failed to remove item from sessionStorage', { 
      error,
      component: 'sessionStorage',
      key 
    });
    return false;
  }
}

/**
 * Clears all items from sessionStorage with error handling
 * @returns True if the operation was successful, false otherwise
 */
export function clear(): boolean {
  try {
    // Check if sessionStorage is available
    if (!isAvailable()) {
      logger.error('sessionStorage is not available in this environment', {
        component: 'sessionStorage'
      });
      return false;
    }

    // Clear all items
    sessionStorage.clear();
    return true;
  } catch (error) {
    // Log errors
    logger.error('Failed to clear sessionStorage', { 
      error,
      component: 'sessionStorage'
    });
    return false;
  }
}

/**
 * Checks if sessionStorage is available in the current environment
 * @returns True if sessionStorage is available, false otherwise
 */
export function isAvailable(): boolean {
  try {
    const testKey = '__test_session_storage__';
    sessionStorage.setItem(testKey, 'test');
    const testResult = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    return testResult === 'test';
  } catch (e) {
    return false;
  }
}

/**
 * Gets all keys currently stored in sessionStorage
 * @returns Array of all keys in sessionStorage
 */
export function getKeys(): string[] {
  try {
    // Check if sessionStorage is available
    if (!isAvailable()) {
      logger.error('sessionStorage is not available in this environment', {
        component: 'sessionStorage'
      });
      return [];
    }

    // Get all keys
    return Object.keys(sessionStorage);
  } catch (error) {
    // Log errors and return an empty array
    logger.error('Failed to get keys from sessionStorage', { 
      error,
      component: 'sessionStorage'
    });
    return [];
  }
}

/**
 * Calculates the approximate size of data stored in sessionStorage
 * @returns Approximate size in bytes
 */
export function getSize(): number {
  try {
    // Check if sessionStorage is available
    if (!isAvailable()) {
      logger.error('sessionStorage is not available in this environment', {
        component: 'sessionStorage'
      });
      return 0;
    }

    // Calculate the size
    let totalSize = 0;
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        // Add the size of the key (2 bytes per character for UTF-16)
        totalSize += key.length * 2;
        
        // Add the size of the value (2 bytes per character for UTF-16)
        const value = sessionStorage.getItem(key) || '';
        totalSize += value.length * 2;
      }
    }
    
    return totalSize;
  } catch (error) {
    // Log errors and return 0
    logger.error('Failed to calculate sessionStorage size', { 
      error,
      component: 'sessionStorage'
    });
    return 0;
  }
}