import React, { useEffect } from 'react'; // React core library and useEffect hook // react ^18.2.0
import { StatusBar } from 'react-native'; // React Native component for controlling the app status bar // react-native 0.71.4
import SplashScreen from 'react-native-splash-screen'; // Manages the native splash screen // react-native-splash-screen ^3.3.0
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Provides safe area insets // react-native-safe-area-context ^4.5.0
import { Provider } from 'react-redux'; // Connects Redux store to React components // react-redux ^8.0.5
import { PersistGate } from 'redux-persist/integration/react'; // Handles Redux persistence loading // redux-persist/integration/react ^6.0.0

import AppNavigator from './src/navigation/AppNavigator'; // Root navigation component
import { AuthProvider } from '../common/contexts/AuthContext'; // Authentication context provider
import { ThemeProvider } from '../common/contexts/ThemeContext'; // Theme context provider
import { NotificationProvider } from '../common/contexts/NotificationContext'; // Notification context provider
import { LoadingProvider } from '../common/contexts/LoadingContext'; // Loading context provider
import { OfflineProvider } from './src/contexts/OfflineContext'; // Offline context provider
import { DriverLocationProvider } from './src/contexts/LocationContext'; // Driver location context provider
import GlobalStyles from '../shared/styles/globalStyles'; // Global styles for consistent UI
import { store, persistor } from './src/store'; // Redux store and persistor

/**
 * Root component that sets up the application structure and providers
 */
const App: React.FC = () => {
  // LD1: Use useEffect to hide the splash screen after component mounts
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  // LD1: Set up StatusBar configuration for the app
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setTranslucent(true);
  }, []);

  // LD1: Render the SafeAreaProvider as the outermost wrapper
  return (
    <SafeAreaProvider>
      {/* LD1: Render the Redux Provider with the store */}
      <Provider store={store}>
        {/* LD1: Render the PersistGate with the persistor to handle Redux persistence */}
        <PersistGate loading={null} persistor={persistor}>
          {/* LD1: Render the AuthProvider for authentication state management */}
          <AuthProvider>
            {/* LD1: Render the ThemeProvider for theme management */}
            <ThemeProvider>
              {/* LD1: Render the NotificationProvider for notification management */}
              <NotificationProvider>
                {/* LD1: Render the LoadingProvider for loading state management */}
                <LoadingProvider>
                  {/* LD1: Render the OfflineProvider for offline functionality */}
                  <OfflineProvider>
                    {/* LD1: Render the DriverLocationProvider for location tracking */}
                    <DriverLocationProvider>
                      {/* LD1: Render the GlobalStyles component for consistent styling */}
                      <GlobalStyles />
                      {/* LD1: Render the AppNavigator as the main content of the application */}
                      <AppNavigator />
                    </DriverLocationProvider>
                  </OfflineProvider>
                </LoadingProvider>
              </NotificationProvider>
            </ThemeProvider>
          </AuthProvider>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
};

// LD1: Export the App component as the root component of the application
export default App;