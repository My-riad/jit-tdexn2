import React from 'react'; // React core library // react ^18.2.0
import { AppRegistry, LogBox } from 'react-native'; // React Native modules // react-native 0.71.8
import { enableScreens } from 'react-native-screens'; // Optimizes screen rendering // react-native-screens ^3.20.0

import App from './App'; // Root component of the application
import { name as appName } from './app.json'; // Application name from app.json

/**
 * Sets up the application with necessary configurations and optimizations
 */
const setupApp = (): void => {
  // LD1: Enable optimized screen rendering with enableScreens()
  enableScreens();

  // LD2: Configure LogBox to ignore specific warnings related to dependencies
  LogBox.ignoreLogs([
    'Require cycle:',
    'Remote debugger',
    'RCTBridge',
    'Setting a timer',
    'Animated: `useNativeDriver`',
    'Module RNSentry',
  ]);

  // LD3: Set up global error handler for uncaught exceptions
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    handleGlobalError(error, isFatal);
  });
};

/**
 * Global error handler for uncaught exceptions in the application
 * @param error The error object
 * @param isFatal Indicates if the error is fatal
 */
const handleGlobalError = (error: Error, isFatal: boolean): void => {
  // LD1: Log the error details with stack trace
  console.error('Global error handler triggered', {
    error,
    isFatal,
    message: error.message,
    stack: error.stack,
  });

  // LD2: Report the error to monitoring service if available
  // Example: Sentry.captureException(error);

  // LD3: Show user-friendly error message for fatal errors
  if (isFatal) {
    Alert.alert(
      'Unexpected Error',
      `The application has encountered a critical error:\n\n${error.message}\n\nIt may be unstable. Please restart the app.`,
      [{ text: 'Restart' }]
    );
  }

  // LD4: Allow the app to continue running if possible
  // In non-fatal cases, the app may recover, but further issues are possible
};

// LD1: Call setupApp() to initialize application configurations
setupApp();

// LD1: Register the App component with AppRegistry using the app name from app.json
AppRegistry.registerComponent(appName, () => App);

// LD1: Set up global error handling for uncaught exceptions
// This ensures that even errors outside React components are caught
if (__DEV__) {
  // In development, use the default React Native error handling
  console.warn(
    'Running in development mode - using default React Native error handling'
  );
} else {
  // In production, override the console.error method to prevent logs
  console.error = () => {};
}