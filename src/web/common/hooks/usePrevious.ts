import { useRef, useEffect } from 'react'; // React ^18.2.0

/**
 * A custom React hook that returns the previous value of a variable across render cycles.
 * Useful for comparing current and previous values of props or state, implementing
 * comparison logic, or triggering effects when values change in a specific way.
 * 
 * @template T The type of the value being tracked
 * @param value The current value to track
 * @returns The previous value of the variable (undefined on first render)
 * 
 * @example
 * // Track changes in a prop value
 * const MyComponent = ({ value }) => {
 *   const previousValue = usePrevious(value);
 *   
 *   useEffect(() => {
 *     if (previousValue !== value) {
 *       console.log('Value changed from', previousValue, 'to', value);
 *     }
 *   }, [previousValue, value]);
 *   
 *   return <div>{value}</div>;
 * };
 */
function usePrevious<T>(value: T): T | undefined {
  // Create a ref using useRef to store the previous value
  const ref = useRef<T | undefined>(undefined);
  
  // Use useEffect to update the ref with the current value after each render
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  // Return the current value stored in the ref, which is the value from the previous render
  return ref.current;
}

export default usePrevious;