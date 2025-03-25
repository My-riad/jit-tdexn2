import { useState, useEffect, useCallback } from 'react'; // ^18.2.0

/**
 * Options for the useKeypress hook
 */
interface UseKeypressOptions {
  /**
   * Whether to prevent the default browser behavior when the key is pressed
   */
  preventDefault?: boolean;
  
  /**
   * Whether to stop the event propagation when the key is pressed
   */
  stopPropagation?: boolean;
  
  /**
   * The keyboard event to listen for ('keydown', 'keyup', 'keypress')
   * @default 'keydown'
   */
  keyEvent?: 'keydown' | 'keyup' | 'keypress';
  
  /**
   * The target element to attach the event listener to
   * @default document
   */
  target?: Window | Document | HTMLElement | null;
  
  /**
   * Whether the hook is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * A hook that detects when specified keys are pressed and executes a callback function
 * 
 * @param targetKey - The key or keys to detect presses for
 * @param callback - The function to call when the key is pressed
 * @param options - Additional options for the hook
 * @returns Whether the specified key(s) are currently pressed
 * 
 * @example
 * // Single key
 * const isEnterPressed = useKeypress('Enter', () => handleSubmit());
 * 
 * @example
 * // Multiple keys
 * const isNavigationKey = useKeypress(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], 
 *   (event) => handleNavigation(event.key));
 * 
 * @example
 * // With options
 * const isSubmitting = useKeypress('Enter', handleSubmit, { 
 *   preventDefault: true,
 *   enabled: isFormValid
 * });
 */
const useKeypress = (
  targetKey: string | string[],
  callback: (event: KeyboardEvent) => void,
  options: UseKeypressOptions = {}
): boolean => {
  // Convert targetKey to an array if it's a single string
  const keys = Array.isArray(targetKey) ? targetKey : [targetKey];
  
  // Initialize state to track whether any of the target keys are pressed
  const [keyPressed, setKeyPressed] = useState(false);
  
  // Extract options with defaults
  const {
    preventDefault = false,
    stopPropagation = false,
    keyEvent = 'keydown',
    target = typeof document !== 'undefined' ? document : null,
    enabled = true
  } = options;

  // Create a memoized keydown handler
  const downHandler = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      if (keys.includes(event.key)) {
        setKeyPressed(true);
        callback(event);
        
        if (preventDefault) {
          event.preventDefault();
        }
        
        if (stopPropagation) {
          event.stopPropagation();
        }
      }
    },
    [keys, callback, preventDefault, stopPropagation, enabled]
  );
  
  // Create a memoized keyup handler
  const upHandler = useCallback(
    (event: KeyboardEvent) => {
      if (keys.includes(event.key)) {
        setKeyPressed(false);
      }
    },
    [keys]
  );
  
  // Use useEffect to add and remove event listeners for keydown and keyup events
  useEffect(() => {
    if (!target || !enabled) return;
    
    target.addEventListener(keyEvent, downHandler as EventListener);
    target.addEventListener('keyup', upHandler as EventListener);
    
    // Cleanup function to remove event listeners
    return () => {
      target.removeEventListener(keyEvent, downHandler as EventListener);
      target.removeEventListener('keyup', upHandler as EventListener);
    };
  }, [target, keyEvent, downHandler, upHandler, enabled]);
  
  // Return the current pressed state
  return keyPressed;
};

export default useKeypress;