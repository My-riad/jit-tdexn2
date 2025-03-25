import React from 'react'; // React v18.2.0
import { createStackNavigator } from '@react-navigation/stack'; // @react-navigation/stack v6.3.16
import { useTheme } from '@react-navigation/native'; // @react-navigation/native v6.1.6

import { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import AchievementsScreen from '../screens/AchievementsScreen';

// Create a stack navigator for profile-related screens
const Stack = createStackNavigator<ProfileStackParamList>();

/**
 * Creates a stack navigator for the profile-related screens
 * @returns React Navigation Stack Navigator component
 */
const ProfileNavigator: React.FC = () => {
  // Get theme colors using useTheme hook
  const { colors } = useTheme();

  // Define screen options with appropriate styling
  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.background.primary,
    },
    headerTintColor: colors.text.primary,
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerBackTitleVisible: false,
  };

  // Render Stack.Navigator with the defined screens
  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={screenOptions}
    >
      {/* Include ProfileScreen as the main profile view with name 'ProfileMain' */}
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      {/* Include SettingsScreen for app configuration with name 'Settings' */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      {/* Include NotificationsScreen for viewing notifications with name 'Notifications' */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      {/* Include LeaderboardScreen for viewing driver rankings with name 'Leaderboard' */}
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      {/* Include AchievementsScreen for viewing driver achievements with name 'Achievements' */}
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
    </Stack.Navigator>
  );
};

// Export the profile navigator component for use in the main tab navigation
export default ProfileNavigator;