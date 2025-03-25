import React from 'react'; // version ^18.2.0
import { createStackNavigator } from '@react-navigation/stack'; // version ^6.3.16
import { useTheme } from '@react-navigation/native'; // version ^6.1.6

import LoadListScreen from '../screens/LoadListScreen'; // Screen component for displaying load recommendations
import LoadDetailScreen from '../screens/LoadDetailScreen'; // Screen component for displaying load details
import ActiveLoadScreen from '../screens/ActiveLoadScreen'; // Screen component for managing active loads
import LoadSearchScreen from '../screens/LoadSearchScreen'; // Screen component for searching available loads
import StatusUpdateScreen from '../screens/StatusUpdateScreen'; // Screen component for updating load status
import SmartHubScreen from '../screens/SmartHubScreen'; // Screen component for viewing Smart Hub details
import { LoadStackParamList } from './types'; // Type definition for load stack navigator parameters

// Create a stack navigator instance
const LoadStack = createStackNavigator<LoadStackParamList>();

/**
 * Component that defines the navigation structure for load-related screens
 * @returns Stack navigator component for load-related screens
 */
const LoadNavigator: React.FC = () => {
  // Get theme colors using useTheme hook
  const { colors } = useTheme();

  // Define screen options with appropriate styling
  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.text.primary,
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerBackTitleVisible: false,
  };

  // Render Stack.Navigator with the defined screen options
  return (
    <LoadStack.Navigator initialRouteName="LoadList" screenOptions={screenOptions}>
      {/* Include LoadListScreen as the initial screen */}
      <LoadStack.Screen
        name="LoadList"
        component={LoadListScreen}
        options={{ title: 'Recommended Loads' }}
      />
      {/* Include LoadDetailScreen with custom transition and gesture handling */}
      <LoadStack.Screen
        name="LoadDetail"
        component={LoadDetailScreen}
        options={{
          title: 'Load Details',
          gestureEnabled: true,
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 500 } },
            close: { animation: 'timing', config: { duration: 500 } },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
            overlayStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
                extrapolate: 'clamp',
              }),
            },
          }),
        }}
      />
      {/* Include ActiveLoadScreen with custom transition */}
      <LoadStack.Screen
        name="ActiveLoad"
        component={ActiveLoadScreen}
        options={{
          title: 'Active Load',
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 300 } },
            close: { animation: 'timing', config: { duration: 300 } },
          },
        }}
      />
      {/* Include LoadSearchScreen with modal presentation style */}
      <LoadStack.Screen
        name="LoadSearch"
        component={LoadSearchScreen}
        options={{
          title: 'Search Loads',
          presentation: 'modal',
        }}
      />
      {/* Include StatusUpdateScreen with modal presentation style */}
      <LoadStack.Screen
        name="StatusUpdate"
        component={StatusUpdateScreen}
        options={{
          title: 'Update Status',
          presentation: 'modal',
        }}
      />
      {/* Include SmartHubScreen with custom transition */}
      <LoadStack.Screen
        name="SmartHub"
        component={SmartHubScreen}
        options={{
          title: 'Smart Hub Details',
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 400 } },
            close: { animation: 'timing', config: { duration: 400 } },
          },
        }}
      />
    </LoadStack.Navigator>
  );
};

// Export the load navigator component for use in the main tab navigator
export default LoadNavigator;