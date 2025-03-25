import React, { useEffect } from 'react'; // React core library and useEffect hook // react ^18.2.0
import { NavigationContainer } from '@react-navigation/native'; // Manages navigation state // @react-navigation/native v6.1.6
import { createStackNavigator } from '@react-navigation/stack'; // Creates stack-based navigation // @react-navigation/stack v6.3.16
import { useSelector } from 'react-redux'; // Accesses Redux state // react-redux v8.0.5

import { RootStackParamList } from './types'; // Navigation types
import AuthNavigator from './AuthNavigator'; // Authentication flow navigator
import MainTabNavigator from './MainTabNavigator'; // Main application navigator
import { useAuthContext } from '../../common/contexts/AuthContext'; // Authentication context
import { useOfflineContext } from '../contexts/OfflineContext'; // Offline context
import { useLocationContext } from '../contexts/LocationContext'; // Location context

/**
 * Root navigation component for the driver mobile application
 */
const AppNavigator: React.FC = () => {
  // LD1: Create a stack navigator using createStackNavigator
  const Stack = createStackNavigator<RootStackParamList>();

  // LD1: Get authentication state from the auth context using useAuthContext
  const { authState } = useAuthContext();
  const isAuthenticated = authState.isAuthenticated;

  // LD1: Get offline state from the offline context using useOfflineContext
  const { isOnline, synchronize } = useOfflineContext();

  // LD1: Get location state from the location context using useLocationContext
  const location = useLocationContext();

  // LD1: Get active load from Redux state using useSelector
  const activeLoad = useSelector((state: any) => state.load.activeLoad);

  // LD1: Set up synchronization of offline data when coming back online
  useEffect(() => {
    if (isOnline) {
      synchronize().catch(error => {
        console.error('Failed to synchronize offline data', error);
      });
    }
  }, [isOnline, synchronize]);

  // LD1: Set up location tracking for authenticated users
  useEffect(() => {
    if (isAuthenticated && location) {
      if (location.isLocationEnabled) {
        location.startTracking();
      } else {
        location.stopTracking();
      }
    }
  }, [isAuthenticated, location]);

  // LD1: Render NavigationContainer as the root navigation component
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // LD1: Configure screen options to hide headers
          gestureEnabled: false, // LD1: Disable gestures for the root navigator
        }}
      >
        {/* LD1: Conditionally render either AuthNavigator or MainTabNavigator based on isAuthenticated state */}
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// LD1: Export the root navigation component for use in the App component
export default AppNavigator;