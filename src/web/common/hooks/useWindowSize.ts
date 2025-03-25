import { useState, useEffect, useCallback } from 'react'; // react v18.2.0

/**
 * Interface for the window dimensions returned by the useWindowSize hook
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Custom hook that tracks and returns the current window dimensions
 * 
 * This hook automatically updates when the window is resized, making it useful
 * for implementing responsive UI components and layouts that need to adapt to
 * different screen sizes.
 * 
 * @returns An object containing the current window width and height
 */
const useWindowSize = (): WindowSize => {
  // Initialize state with default dimensions or zeroes for SSR environments
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Get current window dimensions safely (handling SSR environment)
  const getWindowSize = useCallback((): WindowSize => {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
      };
    }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  // Memoized resize handler to prevent unnecessary re-renders
  const handleResize = useCallback(() => {
    setWindowSize(getWindowSize());
  }, [getWindowSize]);

  useEffect(() => {
    // Return early if running on server
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial size
    setWindowSize(getWindowSize());
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Clean up event listener on unmount to prevent memory leaks
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [getWindowSize, handleResize]);

  return windowSize;
};

export default useWindowSize;