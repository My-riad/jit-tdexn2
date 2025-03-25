import { useState, useEffect, useRef } from 'react'; // react ^18.2.0

/**
 * A custom React hook that provides debouncing functionality.
 * 
 * This hook delays updating a value until after a specified delay has elapsed
 * since the last time it was invoked. It's particularly useful for handling
 * user input events like search queries, form inputs, or window resize events
 * where we want to limit the frequency of expensive operations.
 * 
 * Use cases:
 * - Search inputs to limit API requests while typing
 * - Form validation that should only run after user stops typing
 * - Window resize handlers to prevent excessive calculations
 * - Throttling expensive UI updates
 * 
 * @template T The type of the value to debounce
 * @param value The value to debounce
 * @param delay The delay in milliseconds before updating the debounced value
 * @returns The debounced value that updates only after the specified delay
 * 
 * @example
 * // Basic usage with a search input
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * // The API call will only be made after 500ms of inactivity
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     searchApi(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
function useDebounce<T>(value: T, delay: number): T {
  // Initialize state for the debounced value with the initial value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  // Create a timeout reference using useRef to store the timeout ID
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    // Clear any existing timeout to cancel pending updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout to update the debounced value after the specified delay
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Return a cleanup function that clears the timeout when the component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]); // Re-run the effect when value or delay changes
  
  // Return the debounced value
  return debouncedValue;
}

export default useDebounce;