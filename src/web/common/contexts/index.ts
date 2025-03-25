// Central barrel file for React context providers and hooks

// Import authentication context
import { AuthContext, AuthProvider, useAuthContext } from './AuthContext';
// Import loading context
import { LoadingContext, LoadingProvider, useLoadingContext } from './LoadingContext';
// Import location context
import { LocationContext, LocationProvider, useLocationContext } from './LocationContext';
// Import notification context
import { NotificationContext, NotificationProvider, useNotificationContext } from './NotificationContext';
// Import theme context
import { ThemeContext, ThemeProvider, useThemeContext, ThemeMode } from './ThemeContext';

// Export authentication context
export { AuthContext, AuthProvider, useAuthContext };

// Export loading context
export { LoadingContext, LoadingProvider, useLoadingContext };

// Export location context
export { LocationContext, LocationProvider, useLocationContext };

// Export notification context
export { NotificationContext, NotificationProvider, useNotificationContext };

// Export theme context
export { ThemeContext, ThemeProvider, useThemeContext, ThemeMode };