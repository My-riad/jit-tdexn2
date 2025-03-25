import { useState, useCallback } from 'react';

/**
 * A custom React hook that provides a simple way to toggle a boolean state value.
 * This hook abstracts the state management for toggle functionality, making it easy
 * to implement toggle behavior in components like switches, checkboxes, expandable
 * sections, and modals.
 *
 * @param initialState - The initial boolean state (defaults to false if not provided)
 * @returns A tuple containing the current state and functions to toggle, set to true, and set to false
 * 
 * @example
 * // Basic usage
 * const [isOpen, toggle, open, close] = useToggle();
 * 
 * @example
 * // With initial state
 * const [isActive, toggleActive, activate, deactivate] = useToggle(true);
 */
const useToggle = (initialState: boolean = false): [boolean, () => void, () => void, () => void] => {
  // Initialize state with the provided initialState (defaults to false if not provided)
  const [state, setState] = useState<boolean>(initialState);
  
  // Create a memoized toggle function that flips the current state value
  const toggle = useCallback(() => {
    setState(prevState => !prevState);
  }, []);
  
  // Create a memoized setOn function that sets the state to true
  const setOn = useCallback(() => {
    setState(true);
  }, []);
  
  // Create a memoized setOff function that sets the state to false
  const setOff = useCallback(() => {
    setState(false);
  }, []);
  
  // Return a tuple containing the current state and the three functions
  return [state, toggle, setOn, setOff];
};

export default useToggle;