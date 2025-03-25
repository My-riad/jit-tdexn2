import { AppRegistry, LogBox } from 'react-native'; // react-native 0.71.8
import { enableScreens } from 'react-native-screens'; // react-native-screens ^3.20.0
import App from './App.tsx'; // Import the root App component that contains the entire application structure
import { name as appName } from './app.json'; // Import the application name from app.json configuration

/**
 * Sets up the application with necessary configurations and optimizations
 */
const setupApp = () => {
  // LD1: Enable optimized screen rendering with enableScreens()
  enableScreens();

  // LD1: Configure LogBox to ignore specific warnings related to dependencies
  LogBox.ignoreLogs([
    'Require cycle:',
    'Non-serializable values were found in the navigation state',
  ]);

  // LD1: Set up global error handler for uncaught exceptions
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    handleGlobalError(error, isFatal);
  });
};

/**
 * Global error handler for uncaught exceptions in the application
 * @param {Error} error - The error object
 * @param {boolean} isFatal - Indicates if the error is fatal
 */
const handleGlobalError = (error: Error, isFatal: boolean) => {
  // LD1: Log the error details with stack trace
  console.error('Global error handler triggered', { error, isFatal });

  // LD1: Report the error to monitoring service if available
  // Example: Sentry.captureException(error);

  // LD1: Show user-friendly error message for fatal errors
  if (isFatal) {
    Alert.alert(
      'Unexpected Error',
      `An unexpected error occurred. The application will be restarted.\n\n${error.message}`,
      [
        {
          text: 'Restart',
          onPress: () => {
            // Restart the application (implementation depends on the environment)
            // For React Native, you might use CodePush or a similar solution
            console.log('Restarting the application...');
          },
        },
      ]
    );
  } else {
    // LD1: Allow the app to continue running if possible
    console.warn('Non-fatal error occurred. App may be unstable.');
  }
};

// LD1: Call setupApp() to initialize application configurations
setupApp();

// LD1: Register the App component with AppRegistry using the app name from app.json
AppRegistry.registerComponent(appName, () => App);

// LD1: Set up global error handling for uncaught exceptions
// This is a fallback in case the React Native environment doesn't properly
// propagate errors to the ErrorUtils.setGlobalHandler
console.error = (...args) => {
  // Default console.error functionality
  console.warn(...args);

  // Check if any of the arguments are an error object
  args.forEach(arg => {
    if (arg instanceof Error) {
      handleGlobalError(arg, false);
    }
  });
};