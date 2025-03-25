// src/web/common/hooks/index.ts
/**
 * An index file that exports all custom React hooks from the common hooks directory,
 * providing a centralized entry point for importing hooks throughout the application.
 * This simplifies imports by allowing developers to import multiple hooks from a single path.
 */

// Import authentication hook for re-export
import useAuth from './useAuth';

// Import debounce hook for re-export
import useDebounce from './useDebounce';

// Import form management hook for re-export
import useForm from './useForm';

// Import form hook type definitions for re-export
import { FormState, FormHandlers, UseFormOptions } from './useForm';

// Import geolocation hook for re-export
import useGeolocation from './useGeolocation';

// Import geolocation hook type definitions for re-export
import { GeolocationPermission, GeolocationOptions } from './useGeolocation';

// Import keypress hook for re-export
import useKeypress from './useKeypress';

// Import localStorage hook for re-export
import useLocalStorage from './useLocalStorage';

// Import localStorage hook type definitions for re-export
import { UseLocalStorageOptions } from './useLocalStorage';

// Import notification hook for re-export
import useNotification from './useNotification';

// Import previous value hook for re-export
import usePrevious from './usePrevious';

// Import toggle hook for re-export
import useToggle from './useToggle';

// Import window size hook for re-export
import useWindowSize from './useWindowSize';

// Export authentication hook for managing user authentication state and operations
export { useAuth };

// Export debounce hook for delaying function execution
export { useDebounce };

// Export form management hook for handling form state and validation
export { useForm };

// Export form state interface for type checking
export type { FormState };

// Export form handlers interface for type checking
export type { FormHandlers };

// Export form options interface for type checking
export type { UseFormOptions };

// Export geolocation hook for accessing user location
export { useGeolocation };

// Export geolocation permission enum for type checking
export { GeolocationPermission };

// Export geolocation options interface for type checking
export type { GeolocationOptions };

// Export keypress hook for detecting keyboard events
export { useKeypress };

// Export localStorage hook for persistent state management
export { useLocalStorage };

// Export localStorage options interface for type checking
export type { UseLocalStorageOptions };

// Export notification hook for managing system notifications
export { useNotification };

// Export previous value hook for comparing values across renders
export { usePrevious };

// Export toggle hook for managing boolean state
export { useToggle };

// Export window size hook for responsive design
export { useWindowSize };