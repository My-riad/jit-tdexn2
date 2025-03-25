/**
 * Utility functions for interacting with the browser's localStorage API with type safety,
 * error handling, and serialization/deserialization of complex data types.
 * Provides a consistent interface for persistent client-side storage across the application.
 */

/**
 * Stores a value in localStorage with proper serialization of objects and error handling
 * @param key The key to store the value under
 * @param value The value to store
 * @returns True if the operation was successful, false otherwise
 */
export function setItem(key: string, value: any): boolean {
  try {
    // Check if localStorage is available
    if (!isAvailable()) {
      console.error('localStorage is not available in this environment');
      return false;
    }

    // Handle undefined (localStorage can't store undefined)
    if (value === undefined) {
      localStorage.setItem(key, 'undefined');
      return true;
    }

    // For objects and arrays, use JSON serialization
    if (value !== null && typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      // For primitive types, store directly
      localStorage.setItem(key, String(value));
    }
    
    return true;
  } catch (error) {
    // Handle errors like quota exceeded or permission denied
    console.error('Error storing data in localStorage:', error);
    return false;
  }
}

/**
 * Retrieves a value from localStorage with proper deserialization and type handling
 * @param key The key to retrieve the value for
 * @param defaultValue The default value to return if the key doesn't exist
 * @returns The retrieved value or defaultValue if not found
 */
export function getItem<T>(key: string, defaultValue?: T): T | null | undefined {
  try {
    // Check if localStorage is available
    if (!isAvailable()) {
      console.error('localStorage is not available in this environment');
      return defaultValue;
    }

    // Retrieve the stored value
    const storedValue = localStorage.getItem(key);
    
    // Return defaultValue if the value doesn't exist
    if (storedValue === null) {
      return defaultValue;
    }

    // Handle special case for undefined
    if (storedValue === 'undefined') {
      return undefined as unknown as T;
    }

    // Try to parse as JSON for objects/arrays
    try {
      return JSON.parse(storedValue) as T;
    } catch {
      // If parsing fails, return the raw string value
      return storedValue as unknown as T;
    }
  } catch (error) {
    // Handle any errors during retrieval or parsing
    console.error('Error retrieving data from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Removes an item from localStorage with error handling
 * @param key The key to remove
 * @returns True if the operation was successful, false otherwise
 */
export function removeItem(key: string): boolean {
  try {
    // Check if localStorage is available
    if (!isAvailable()) {
      console.error('localStorage is not available in this environment');
      return false;
    }

    // Remove the item
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    // Handle any errors during removal
    console.error('Error removing data from localStorage:', error);
    return false;
  }
}

/**
 * Clears all items from localStorage with error handling
 * @returns True if the operation was successful, false otherwise
 */
export function clear(): boolean {
  try {
    // Check if localStorage is available
    if (!isAvailable()) {
      console.error('localStorage is not available in this environment');
      return false;
    }

    // Clear all items
    localStorage.clear();
    return true;
  } catch (error) {
    // Handle any errors during clearing
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Checks if localStorage is available in the current environment
 * @returns True if localStorage is available, false otherwise
 */
export function isAvailable(): boolean {
  try {
    // Check if localStorage is defined
    if (typeof localStorage === 'undefined') {
      return false;
    }

    // Test setting and retrieving a value
    const testKey = '__test_localStorage__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    // Return false if any error occurs
    return false;
  }
}

/**
 * Gets all keys currently stored in localStorage
 * @returns Array of all keys in localStorage
 */
export function getKeys(): string[] {
  try {
    // Check if localStorage is available
    if (!isAvailable()) {
      console.error('localStorage is not available in this environment');
      return [];
    }

    // Get all keys
    return Object.keys(localStorage);
  } catch (error) {
    // Handle any errors during retrieval
    console.error('Error getting keys from localStorage:', error);
    return [];
  }
}

/**
 * Calculates the approximate size of data stored in localStorage
 * @returns Approximate size in bytes
 */
export function getSize(): number {
  try {
    // Check if localStorage is available
    if (!isAvailable()) {
      console.error('localStorage is not available in this environment');
      return 0;
    }

    // Calculate total size
    let size = 0;
    const keys = getKeys();
    
    for (const key of keys) {
      // Add key length
      size += key.length;
      
      // Add value length
      const value = localStorage.getItem(key) || '';
      size += value.length;
    }
    
    // Return size in bytes (approximation as 2 bytes per character in UTF-16)
    return size * 2;
  } catch (error) {
    // Handle any errors during calculation
    console.error('Error calculating localStorage size:', error);
    return 0;
  }
}