// Utility module that provides permission checking functions for the driver mobile application.
// It defines permission constants, screen access rules, and helper functions to determine if a user has access to specific features based on their role and permissions.

// Import the authentication context hook to access auth state and permission checking functions
import { useAuthContext } from '../../../common/contexts/AuthContext';
// Import navigation types to define screen access permissions
import { MainTabParamList, LoadStackParamList, ProfileStackParamList } from '../navigation/types';

// Define the driver role constant
export const DRIVER_ROLE = 'driver';

// Define permission constants
export const PERMISSIONS = {
  VIEW_LOADS: 'view_loads',
  ACCEPT_LOADS: 'accept_loads',
  UPDATE_LOAD_STATUS: 'update_load_status',
  VIEW_EARNINGS: 'view_earnings',
  VIEW_LEADERBOARD: 'view_leaderboard',
  VIEW_MAP: 'view_map',
  USE_NAVIGATION: 'use_navigation',
  VIEW_PROFILE: 'view_profile',
  UPDATE_PROFILE: 'update_profile',
  VIEW_ACHIEVEMENTS: 'view_achievements',
} as const;

// Define screen permission mappings
export const SCREEN_PERMISSIONS: {
  [ScreenName in keyof MainTabParamList | keyof LoadStackParamList | keyof ProfileStackParamList]: string[];
} = {
  Home: [PERMISSIONS.VIEW_LOADS],
  Loads: [PERMISSIONS.VIEW_LOADS],
  LoadDetail: [PERMISSIONS.VIEW_LOADS],
  ActiveLoad: [PERMISSIONS.VIEW_LOADS, PERMISSIONS.UPDATE_LOAD_STATUS],
  LoadSearch: [PERMISSIONS.VIEW_LOADS],
  StatusUpdate: [PERMISSIONS.UPDATE_LOAD_STATUS],
  SmartHub: [PERMISSIONS.VIEW_LOADS],
  Map: [PERMISSIONS.VIEW_MAP],
  Earnings: [PERMISSIONS.VIEW_EARNINGS],
  ProfileMain: [PERMISSIONS.VIEW_PROFILE],
  Settings: [PERMISSIONS.VIEW_PROFILE, PERMISSIONS.UPDATE_PROFILE],
  Leaderboard: [PERMISSIONS.VIEW_LEADERBOARD],
  Achievements: [PERMISSIONS.VIEW_ACHIEVEMENTS],
  Notifications: [PERMISSIONS.VIEW_PROFILE],
};

/**
 * Checks if the current user has the driver role
 * @returns True if the user has the driver role, false otherwise
 */
export const isDriver = (): boolean => {
  // Get the authentication context using useAuthContext
  const { hasRole } = useAuthContext();
  // Use the hasRole function from auth context to check if user has DRIVER_ROLE
  const hasDriverRole = hasRole(DRIVER_ROLE);
  // Return the result of the role check
  return hasDriverRole;
};

/**
 * Checks if the current user has a specific permission
 * @param permission The permission to check
 * @returns True if the user has the specified permission, false otherwise
 */
export const hasPermission = (permission: string): boolean => {
  // Get the authentication context using useAuthContext
  const { hasPermission } = useAuthContext();
  // Use the hasPermission function from auth context to check if user has the specified permission
  const hasRequiredPermission = hasPermission(permission);
  // Return the result of the permission check
  return hasRequiredPermission;
};

/**
 * Checks if the current user can access a specific screen based on required permissions
 * @param screenName The name of the screen to check
 * @returns True if the user has all required permissions for the screen, false otherwise
 */
export const canAccessScreen = (screenName: string): boolean => {
  // Get the required permissions for the screen from SCREEN_PERMISSIONS
  const requiredPermissions = SCREEN_PERMISSIONS[screenName];

  // If no permissions are defined for the screen, return true (public screen)
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Get the authentication context using useAuthContext
  const { hasPermission } = useAuthContext();

  // Check if the user has all required permissions using hasPermission function
  const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));

  // Return true only if the user has all required permissions
  return hasAllPermissions;
};

/**
 * Checks if the current user can accept a load
 * @returns True if the user has permission to accept loads, false otherwise
 */
export const canAcceptLoad = (): boolean => {
  // Call hasPermission with PERMISSIONS.ACCEPT_LOADS
  const hasAcceptLoadPermission = hasPermission(PERMISSIONS.ACCEPT_LOADS);
  // Return the result of the permission check
  return hasAcceptLoadPermission;
};

/**
 * Checks if the current user can update a load status
 * @returns True if the user has permission to update load status, false otherwise
 */
export const canUpdateLoadStatus = (): boolean => {
  // Call hasPermission with PERMISSIONS.UPDATE_LOAD_STATUS
  const hasUpdateLoadStatusPermission = hasPermission(PERMISSIONS.UPDATE_LOAD_STATUS);
  // Return the result of the permission check
  return hasUpdateLoadStatusPermission;
};

/**
 * Checks if the current user can use the navigation feature
 * @returns True if the user has permission to use navigation, false otherwise
 */
export const canUseNavigation = (): boolean => {
  // Call hasPermission with PERMISSIONS.USE_NAVIGATION
  const hasUseNavigationPermission = hasPermission(PERMISSIONS.USE_NAVIGATION);
  // Return the result of the permission check
  return hasUseNavigationPermission;
};