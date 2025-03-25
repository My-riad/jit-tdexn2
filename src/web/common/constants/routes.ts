/**
 * Route Constants
 * 
 * This file defines all route path constants used across the frontend applications
 * for consistent navigation. It centralizes route definitions to ensure
 * consistency and maintainability across driver, carrier, and shipper interfaces.
 */

/**
 * Authentication route paths for login, registration, and password management
 */
export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
};

/**
 * Common route paths shared across all applications
 */
export const COMMON_ROUTES = {
  HOME: '/',
  NOT_FOUND: '*',
};

/**
 * Route paths for the driver mobile application using React Navigation naming convention
 */
export const DRIVER_APP_ROUTES = {
  HOME: 'Home',
  LOAD_LIST: 'LoadList',
  LOAD_DETAIL: 'LoadDetail',
  ACTIVE_LOAD: 'ActiveLoad',
  MAP: 'Map',
  EARNINGS: 'Earnings',
  PROFILE: 'Profile',
  NOTIFICATIONS: 'Notifications',
  SETTINGS: 'Settings',
  LEADERBOARD: 'Leaderboard',
  ACHIEVEMENTS: 'Achievements',
  SMART_HUB: 'SmartHub',
  LOAD_SEARCH: 'LoadSearch',
  STATUS_UPDATE: 'StatusUpdate',
};

/**
 * Route paths for the carrier management portal using React Router path format
 */
export const CARRIER_PORTAL_ROUTES = {
  DASHBOARD: '/dashboard',
  FLEET: '/fleet',
  DRIVERS: '/drivers',
  LOADS: '/loads',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  LOAD_DETAIL: '/loads/:loadId',
  DRIVER_DETAIL: '/drivers/:driverId',
  VEHICLE_DETAIL: '/fleet/vehicles/:vehicleId',
  EFFICIENCY: '/analytics/efficiency',
  FINANCIAL: '/analytics/financial',
  OPERATIONAL: '/analytics/operational',
  CREATE_LOAD: '/loads/create',
  CREATE_DRIVER: '/drivers/create',
  CREATE_VEHICLE: '/fleet/vehicles/create',
};

/**
 * Route paths for the shipper portal using React Router path format
 */
export const SHIPPER_PORTAL_ROUTES = {
  DASHBOARD: '/dashboard',
  LOADS: '/loads',
  TRACKING: '/tracking',
  CARRIERS: '/carriers',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  CREATE_LOAD: '/loads/create',
  LOAD_DETAIL: '/loads/:loadId',
  CARRIER_DETAIL: '/carriers/:carrierId',
};