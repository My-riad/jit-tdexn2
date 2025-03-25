import { useState, useEffect, useCallback, useRef } from 'react';
import { setItem, getItem, removeItem, isAvailable } from '../utils/localStorage';

/**
 * Configuration options for the useLocalStorage hook
 */
export interface UseLocalStorageOptions {
  /**
   * Whether to sync state across tabs/windows
   * @default true
   */
  sync?: boolean;
  
  /**
   * Custom parser function for deserializing stored values
   * @default JSON.parse
   */
  parser?: (value: string) => any;
  
  /**
   * Custom serializer function for preparing values for storage
   * @default JSON.stringify
   */
  serializer?: (value: any) => string;
}

/**
 * A hook that provides localStorage functionality with React state-like syntax
 * 
 * @param key - The localStorage key to use
 * @param initialValue - The initial value to use if no value is found in localStorage
 * @param options - Configuration options for the hook behavior
 * @returns [storedValue, setValue, removeValue] - The current value, a function to update it, and a function to remove it
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Destructure options with defaults
  const { 
    sync = true,
    parser,
    serializer 
  } = options;

  // Function to get the initial value from localStorage or the provided initialValue
  const readValue = useCallback((): T => {
    // If localStorage is not available, return the initial value
    if (!isAvailable()) {
      return initialValue;
    }

    try {
      // Get the raw value
      const rawValue = localStorage.getItem(key);
      
      // Return initialValue if the value doesn't exist
      if (rawValue === null) {
        return initialValue;
      }

      // Handle undefined value
      if (rawValue === 'undefined') {
        return undefined as unknown as T;
      }

      // Use custom parser if provided
      if (parser) {
        try {
          return parser(rawValue) as T;
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}" with custom parser:`, error);
          return initialValue;
        }
      }

      // Otherwise use standard parsing
      try {
        return JSON.parse(rawValue) as T;
      } catch {
        // If parsing fails, return the raw value
        return rawValue as unknown as T;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, parser]);

  // State to store the value
  const [storedValue, setStoredValue] = useState<T>(readValue);
  
  // Reference to the current key for use in effects
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Function to update the value in state and localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Handle functional updates
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Update state
      setStoredValue(valueToStore);
      
      // Update localStorage if available
      if (isAvailable()) {
        // Handle special cases
        if (valueToStore === undefined) {
          localStorage.setItem(keyRef.current, 'undefined');
        } else if (valueToStore === null) {
          localStorage.setItem(keyRef.current, 'null');
        } else if (typeof valueToStore === 'object') {
          // Use custom serializer if provided
          if (serializer) {
            try {
              localStorage.setItem(keyRef.current, serializer(valueToStore));
            } catch (error) {
              console.error(`Error serializing value for localStorage key "${keyRef.current}":`, error);
            }
          } else {
            // Otherwise use standard JSON serialization
            localStorage.setItem(keyRef.current, JSON.stringify(valueToStore));
          }
        } else {
          // Store primitive values directly
          localStorage.setItem(keyRef.current, String(valueToStore));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${keyRef.current}":`, error);
    }
  }, [storedValue, serializer]);

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      // Reset state to initial value
      setStoredValue(initialValue);
      
      // Remove from localStorage if available
      if (isAvailable()) {
        localStorage.removeItem(keyRef.current);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${keyRef.current}":`, error);
    }
  }, [initialValue]);

  // Update the stored value when the key changes
  useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);

  // Sync with localStorage changes in other tabs/windows
  useEffect(() => {
    if (!isAvailable() || !sync) {
      return;
    }

    // Handler for storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === keyRef.current) {
        if (event.newValue === null) {
          // Item was removed
          setStoredValue(initialValue);
        } else {
          // Read the updated value
          setStoredValue(readValue());
        }
      }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sync, initialValue, readValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;