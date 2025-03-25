import React from 'react'; // React core library for component creation // version ^18.2.0
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Function to create a bottom tab navigator // version ^6.5.7
import { useNavigation } from '@react-navigation/native'; // Hook to access navigation object // version ^6.1.6
import { HomeIcon, TruckIcon, MapIcon, ChartBarIcon, UserIcon } from '@heroicons/react/24/outline'; // Icon components for tab navigation // version ^2.0.18
import { useSelector } from 'react-redux'; // Hook to access Redux state // version ^8.0.5

import { MainTabParamList } from './types'; // Type definition for the main tab navigator's screen parameters
import HomeScreen from '../screens/HomeScreen'; // Screen component for the home dashboard
import LoadNavigator from './LoadNavigator'; // Nested navigator for load-related screens
import MapScreen from '../screens/MapScreen'; // Screen component for the map view
import EarningsScreen from '../screens/EarningsScreen'; // Screen component for earnings and gamification
import ProfileNavigator from './ProfileNavigator'; // Nested navigator for profile-related screens
import BottomNavigation from '../../shared/components/navigation/BottomNavigation'; // Reusable bottom navigation component
import theme from '../styles/theme'; // Theme configuration for consistent styling

// Create a bottom tab navigator
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Creates a bottom tab navigator for the main screens of the driver app
 */
const MainTabNavigator: React.FC = () => {
  // LD1: Get the navigation object using useNavigation hook
  const navigation = useNavigation();

  // LD1: Get the active load from Redux state using useSelector
  const activeLoad = useSelector((state: any) => state.load.activeLoad);

  // LD1: Define tab navigation items with appropriate icons and labels
  const tabItems = [
    { id: 'Home', label: 'Home', path: 'Home', icon: React.createElement(HomeIcon) },
    { id: 'Loads', label: 'Loads', path: 'Loads', icon: React.createElement(TruckIcon) },
    { id: 'Map', label: 'Map', path: 'Map', icon: React.createElement(MapIcon) },
    { id: 'Earnings', label: 'Earnings', path: 'Earnings', icon: React.createElement(ChartBarIcon) },
    { id: 'Profile', label: 'Profile', path: 'Profile', icon: React.createElement(UserIcon) },
  ];

  // LD1: Create a custom tab bar component using BottomNavigation
  const tabBar = (props: any) => (
    <BottomNavigation
      items={tabItems}
      activeItemId={props.state.routeNames[props.state.index]}
      onItemClick={(itemId) => {
        // LD1: Handle tab item clicks by navigating to the appropriate screen
        const route = tabItems.find((item) => item.id === itemId);
        if (route) {
          navigation.navigate(route.id as never);
        }
      }}
    />
  );

  // LD1: Configure the Tab.Navigator with screenOptions for appearance
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide the default tab bar
      }}
      tabBar={tabBar} // Use the custom tab bar
    >
      {/* LD1: Add HomeScreen as the Home tab */}
      <Tab.Screen name="Home" component={HomeScreen} />

      {/* LD1: Add LoadNavigator as the Loads tab */}
      <Tab.Screen name="Loads" component={LoadNavigator} />

      {/* LD1: Add MapScreen as the Map tab */}
      <Tab.Screen name="Map" component={MapScreen} />

      {/* LD1: Add EarningsScreen as the Earnings tab */}
      <Tab.Screen name="Earnings" component={EarningsScreen} />

      {/* LD1: Add ProfileNavigator as the Profile tab */}
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
};

// LD1: Export the configured Tab.Navigator component
export default MainTabNavigator;