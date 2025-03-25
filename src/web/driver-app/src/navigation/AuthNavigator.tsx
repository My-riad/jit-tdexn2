import React from 'react'; // React v18.2.0
import { createStackNavigator } from '@react-navigation/stack'; // @react-navigation/stack v6.3.16
import { useTheme } from '@react-navigation/native'; // @react-navigation/native v6.1.6

import { AuthStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

/**
 * Creates a stack navigator for the authentication flow
 * @returns {JSX.Element} React Navigation Stack Navigator component
 */
const AuthNavigator: React.FC = () => {
  // LD1: Create a stack navigator using createStackNavigator
  const Stack = createStackNavigator<AuthStackParamList>();

  // LD1: Get theme colors using useTheme hook
  const { colors } = useTheme();

  // LD1: Define screen options with appropriate styling
  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.background.primary,
      shadowColor: 'transparent', // removes the shadow on iOS
      elevation: 0, // removes the shadow on Android
    },
    headerTintColor: colors.text.primary,
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerBackTitleVisible: false,
  };

  // LD1: Render Stack.Navigator with the defined screens
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={screenOptions}
    >
      {/* LD1: Include LoginScreen as the default screen */}
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />

      {/* LD1: Include RegistrationScreen for new user registration */}
      <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: 'Sign Up' }} />

      {/* LD1: Include ForgotPasswordScreen for password recovery */}
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
    </Stack.Navigator>
  );
};

// LD1: Export the authentication navigator component for use in the app navigation structure
export default AuthNavigator;