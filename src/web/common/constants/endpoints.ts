/**
 * Defines all API endpoint URLs used across the frontend applications for communicating
 * with the backend services of the AI-driven Freight Optimization Platform.
 * This file centralizes endpoint definitions to ensure consistency and maintainability
 * across driver, carrier, and shipper interfaces.
 */

// Base URL for all API requests, falls back to production URL if environment variable not set
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.freightoptimization.com';

// Current API version string
export const API_VERSION = 'v1';

// Authentication service endpoint URLs
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/${API_VERSION}/auth/login`,
  REGISTER: `${API_BASE_URL}/api/${API_VERSION}/auth/register`,
  REFRESH_TOKEN: `${API_BASE_URL}/api/${API_VERSION}/auth/refresh-token`,
  LOGOUT: `${API_BASE_URL}/api/${API_VERSION}/auth/logout`,
  CURRENT_USER: `${API_BASE_URL}/api/${API_VERSION}/auth/me`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/${API_VERSION}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/${API_VERSION}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/${API_VERSION}/auth/change-password`,
  SETUP_MFA: `${API_BASE_URL}/api/${API_VERSION}/auth/mfa/setup`,
  VERIFY_MFA: `${API_BASE_URL}/api/${API_VERSION}/auth/mfa/verify`,
  DISABLE_MFA: `${API_BASE_URL}/api/${API_VERSION}/auth/mfa/disable`,
};

// Driver service endpoint URLs
export const DRIVER_ENDPOINTS = {
  BASE: `${API_BASE_URL}/api/${API_VERSION}/drivers`,
  GET_BY_ID: `${API_BASE_URL}/api/${API_VERSION}/drivers/:driverId`,
  CREATE: `${API_BASE_URL}/api/${API_VERSION}/drivers`,
  UPDATE: `${API_BASE_URL}/api/${API_VERSION}/drivers/:driverId`,
  DELETE: `${API_BASE_URL}/api/${API_VERSION}/drivers/:driverId`,
  AVAILABILITY: `${API_BASE_URL}/api/${API_VERSION}/drivers/:driverId/availability`,
  HOS: `${API_BASE_URL}/api/${API_VERSION}/drivers/:driverId/hos`,
  PREFERENCES: `${API_BASE_URL}/api/${API_VERSION}/drivers/:driverId/preferences`,
  PERFORMANCE: `${API_BASE_URL}/api/${API_VERSION}/drivers/:driverId/performance`,
};

// Load service endpoint URLs
export const LOAD_ENDPOINTS = {
  BASE: `${API_BASE_URL}/api/${API_VERSION}/loads`,
  GET_BY_ID: `${API_BASE_URL}/api/${API_VERSION}/loads/:loadId`,
  CREATE: `${API_BASE_URL}/api/${API_VERSION}/loads`,
  UPDATE: `${API_BASE_URL}/api/${API_VERSION}/loads/:loadId`,
  DELETE: `${API_BASE_URL}/api/${API_VERSION}/loads/:loadId`,
  STATUS: `${API_BASE_URL}/api/${API_VERSION}/loads/:loadId/status`,
  SEARCH: `${API_BASE_URL}/api/${API_VERSION}/loads/search`,
  DOCUMENTS: `${API_BASE_URL}/api/${API_VERSION}/loads/:loadId/documents`,
  ACCEPT: `${API_BASE_URL}/api/${API_VERSION}/loads/:loadId/accept`,
  DECLINE: `${API_BASE_URL}/api/${API_VERSION}/loads/:loadId/decline`,
};

// Carrier service endpoint URLs
export const CARRIER_ENDPOINTS = {
  BASE: `${API_BASE_URL}/api/${API_VERSION}/carriers`,
  GET_BY_ID: `${API_BASE_URL}/api/${API_VERSION}/carriers/:carrierId`,
  CREATE: `${API_BASE_URL}/api/${API_VERSION}/carriers`,
  UPDATE: `${API_BASE_URL}/api/${API_VERSION}/carriers/:carrierId`,
  DELETE: `${API_BASE_URL}/api/${API_VERSION}/carriers/:carrierId`,
  DRIVERS: `${API_BASE_URL}/api/${API_VERSION}/carriers/:carrierId/drivers`,
  VEHICLES: `${API_BASE_URL}/api/${API_VERSION}/carriers/:carrierId/vehicles`,
  PERFORMANCE: `${API_BASE_URL}/api/${API_VERSION}/carriers/:carrierId/performance`,
};

// Shipper service endpoint URLs
export const SHIPPER_ENDPOINTS = {
  BASE: `${API_BASE_URL}/api/${API_VERSION}/shippers`,
  GET_BY_ID: `${API_BASE_URL}/api/${API_VERSION}/shippers/:shipperId`,
  CREATE: `${API_BASE_URL}/api/${API_VERSION}/shippers`,
  UPDATE: `${API_BASE_URL}/api/${API_VERSION}/shippers/:shipperId`,
  DELETE: `${API_BASE_URL}/api/${API_VERSION}/shippers/:shipperId`,
  LOADS: `${API_BASE_URL}/api/${API_VERSION}/shippers/:shipperId/loads`,
  PERFORMANCE: `${API_BASE_URL}/api/${API_VERSION}/shippers/:shipperId/performance`,
};

// Vehicle service endpoint URLs
export const VEHICLE_ENDPOINTS = {
  BASE: `${API_BASE_URL}/api/${API_VERSION}/vehicles`,
  GET_BY_ID: `${API_BASE_URL}/api/${API_VERSION}/vehicles/:vehicleId`,
  CREATE: `${API_BASE_URL}/api/${API_VERSION}/vehicles`,
  UPDATE: `${API_BASE_URL}/api/${API_VERSION}/vehicles/:vehicleId`,
  DELETE: `${API_BASE_URL}/api/${API_VERSION}/vehicles/:vehicleId`,
};

// Gamification service endpoint URLs
export const GAMIFICATION_ENDPOINTS = {
  SCORES: `${API_BASE_URL}/api/${API_VERSION}/gamification/scores`,
  ACHIEVEMENTS: `${API_BASE_URL}/api/${API_VERSION}/gamification/achievements`,
  LEADERBOARDS: `${API_BASE_URL}/api/${API_VERSION}/gamification/leaderboards`,
  REWARDS: `${API_BASE_URL}/api/${API_VERSION}/gamification/rewards`,
  BONUS_ZONES: `${API_BASE_URL}/api/${API_VERSION}/gamification/bonus-zones`,
};

// Tracking service endpoint URLs
export const TRACKING_ENDPOINTS = {
  POSITIONS: `${API_BASE_URL}/api/${API_VERSION}/tracking/positions`,
  HISTORY: `${API_BASE_URL}/api/${API_VERSION}/tracking/history`,
  ETA: `${API_BASE_URL}/api/${API_VERSION}/tracking/eta`,
  NEARBY: `${API_BASE_URL}/api/${API_VERSION}/tracking/nearby`,
  GEOFENCES: `${API_BASE_URL}/api/${API_VERSION}/tracking/geofences`,
  GEOFENCE_EVENTS: `${API_BASE_URL}/api/${API_VERSION}/tracking/geofence-events`,
};

// Market intelligence service endpoint URLs
export const MARKET_ENDPOINTS = {
  RATES: `${API_BASE_URL}/api/${API_VERSION}/market/rates`,
  FORECASTS: `${API_BASE_URL}/api/${API_VERSION}/market/forecasts`,
  HOTSPOTS: `${API_BASE_URL}/api/${API_VERSION}/market/hotspots`,
  AUCTIONS: `${API_BASE_URL}/api/${API_VERSION}/market/auctions`,
};

// Optimization engine endpoint URLs
export const OPTIMIZATION_ENDPOINTS = {
  MATCHES: `${API_BASE_URL}/api/${API_VERSION}/optimization/matches`,
  HUBS: `${API_BASE_URL}/api/${API_VERSION}/optimization/hubs`,
  RELAYS: `${API_BASE_URL}/api/${API_VERSION}/optimization/relays`,
  FORECAST: `${API_BASE_URL}/api/${API_VERSION}/optimization/forecast`,
};

// Integration service endpoint URLs
export const INTEGRATION_ENDPOINTS = {
  ELD: `${API_BASE_URL}/api/${API_VERSION}/integrations/eld`,
  TMS: `${API_BASE_URL}/api/${API_VERSION}/integrations/tms`,
  PAYMENT: `${API_BASE_URL}/api/${API_VERSION}/integrations/payment`,
  MAPPING: `${API_BASE_URL}/api/${API_VERSION}/integrations/mapping`,
  WEATHER: `${API_BASE_URL}/api/${API_VERSION}/integrations/weather`,
};

// Notification service endpoint URLs
export const NOTIFICATION_ENDPOINTS = {
  BASE: `${API_BASE_URL}/api/${API_VERSION}/notifications`,
  PREFERENCES: `${API_BASE_URL}/api/${API_VERSION}/notifications/preferences`,
  MARK_READ: `${API_BASE_URL}/api/${API_VERSION}/notifications/:notificationId/read`,
  MARK_ALL_READ: `${API_BASE_URL}/api/${API_VERSION}/notifications/read-all`,
};

// WebSocket connection endpoint URLs
export const WEBSOCKET_ENDPOINTS = {
  POSITIONS: `${API_BASE_URL.replace('http', 'ws')}/ws/positions`,
  NOTIFICATIONS: `${API_BASE_URL.replace('http', 'ws')}/ws/notifications`,
};

/**
 * Replaces path parameters in endpoint URLs with actual values
 * 
 * @param endpoint - The endpoint URL containing parameter placeholders (e.g., "/api/v1/drivers/:driverId")
 * @param params - Object containing parameter key-value pairs (e.g., { driverId: "123" })
 * @returns Endpoint URL with parameters replaced
 * 
 * @example
 * getEndpointWithParams(DRIVER_ENDPOINTS.GET_BY_ID, { driverId: "123" })
 * // Returns "https://api.freightoptimization.com/api/v1/drivers/123"
 */
export const getEndpointWithParams = (
  endpoint: string,
  params: Record<string, string | number>
): string => {
  let result = endpoint;
  
  // Replace each parameter in the endpoint string
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  
  return result;
};