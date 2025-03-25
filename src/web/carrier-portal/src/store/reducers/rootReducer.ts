import { combineReducers } from 'redux'; // redux v4.2.1+

import authReducer from './authReducer';
import fleetReducer from './fleetReducer';
import driverReducer from './driverReducer';
import loadReducer from './loadReducer';
import analyticsReducer from './analyticsReducer';
import settingsReducer from './settingsReducer';
import notificationReducer from './notificationReducer';

/**
 * Combined root reducer created using Redux's combineReducers utility
 */
const rootReducer = combineReducers({
  /**
   * Authentication state including user info, tokens, and auth status
   */
  auth: authReducer,
  /**
   * Fleet management state including vehicles, maintenance, and utilization
   */
  fleet: fleetReducer,
  /**
   * Driver management state including driver profiles, availability, and performance
   */
  driver: driverReducer,
  /**
   * Load management state including loads, assignments, and documents
   */
  load: loadReducer,
  /**
   * Analytics state including reports, metrics, and visualizations
   */
  analytics: analyticsReducer,
  /**
   * Application settings and preferences
   */
  settings: settingsReducer,
  /**
   * Notification state including alerts and messages
   */
  notification: notificationReducer
});

export default rootReducer;