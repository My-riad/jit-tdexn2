import { combineReducers } from 'redux'; //  ^4.2.1
import authReducer from './authReducer';
import loadReducer from './loadReducer';
import trackingReducer from './trackingReducer';
import carrierReducer from './carrierReducer';
import analyticsReducer from './analyticsReducer';
import settingsReducer from './settingsReducer';
import notificationReducer from './notificationReducer';

/**
 * Root reducer for the shipper portal Redux store.
 * Combines all individual reducers into a single reducer function,
 * creating a unified state tree for the application.
 */
const rootReducer = combineReducers({
  /**
   * Authentication state including user info, tokens, and login status
   */
  auth: authReducer,
  /**
   * Load-related state including load listings, details, and documents
   */
  loads: loadReducer,
  /**
   * Tracking-related state including positions, ETAs, and geofences
   */
  tracking: trackingReducer,
  /**
   * Carrier-related state including carrier listings, details, and performance metrics
   */
  carriers: carrierReducer,
  /**
   * Analytics-related state including optimization savings and performance metrics
   */
  analytics: analyticsReducer,
  /**
   * Settings-related state including user, company, and notification settings
   */
  settings: settingsReducer,
  /**
   * Notification-related state including notification listings and preferences
   */
  notifications: notificationReducer,
});

export default rootReducer;