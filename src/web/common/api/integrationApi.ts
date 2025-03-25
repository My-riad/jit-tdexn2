/**
 * API client module for the Integration Service that provides functions to interact
 * with external systems such as ELD providers, TMS systems, payment processors,
 * mapping services, and weather data providers.
 * 
 * This module serves as a centralized client for all integration-related API calls
 * in the AI-driven Freight Optimization Platform.
 */

import { AxiosResponse } from 'axios'; // ^1.4.0
import apiClient from './apiClient';
import { 
  INTEGRATION_ENDPOINTS,
  getEndpointWithParams
} from '../constants/endpoints';

/**
 * Creates a new ELD connection for a carrier
 * @param connectionData Connection configuration data
 * @returns Promise resolving to the created ELD connection
 */
const createEldConnection = (connectionData: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.ELD}/connections`, connectionData);
};

/**
 * Retrieves all ELD connections for a carrier
 * @param carrierId The carrier ID
 * @returns Promise resolving to the list of ELD connections
 */
const getEldConnections = (carrierId: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.ELD}/connections`, {
    params: { carrierId }
  });
};

/**
 * Retrieves a specific ELD connection by ID
 * @param connectionId The connection ID
 * @returns Promise resolving to the ELD connection details
 */
const getEldConnection = (connectionId: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.ELD}/connections/${connectionId}`);
};

/**
 * Updates an existing ELD connection
 * @param connectionId The connection ID
 * @param connectionData Updated connection data
 * @returns Promise resolving to the updated ELD connection
 */
const updateEldConnection = (connectionId: string, connectionData: any): Promise<AxiosResponse> => {
  return apiClient.put(`${INTEGRATION_ENDPOINTS.ELD}/connections/${connectionId}`, connectionData);
};

/**
 * Deletes an ELD connection
 * @param connectionId The connection ID
 * @returns Promise resolving to a success indicator
 */
const deleteEldConnection = (connectionId: string): Promise<AxiosResponse> => {
  return apiClient.delete(`${INTEGRATION_ENDPOINTS.ELD}/connections/${connectionId}`);
};

/**
 * Generates an OAuth authorization URL for a specific ELD provider
 * @param params Provider-specific parameters for authorization
 * @returns Promise resolving to the authorization URL
 */
const getEldAuthorizationUrl = (params: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.ELD}/authorize`, params);
};

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param params Authorization code and provider-specific parameters
 * @returns Promise resolving to the ELD connection details with tokens
 */
const exchangeEldToken = (params: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.ELD}/token`, params);
};

/**
 * Validates an ELD connection by making a test API call
 * @param connectionId The connection ID
 * @returns Promise resolving to the validation result
 */
const validateEldConnection = (connectionId: string): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.ELD}/connections/${connectionId}/validate`);
};

/**
 * Retrieves the current Hours of Service data for a driver from their ELD
 * @param driverId The driver ID
 * @returns Promise resolving to the driver's HOS data
 */
const getDriverHOS = (driverId: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.ELD}/drivers/${driverId}/hos`);
};

/**
 * Retrieves the HOS logs for a driver within a specified time range
 * @param driverId The driver ID
 * @param startDate Start date for logs (ISO format)
 * @param endDate End date for logs (ISO format)
 * @returns Promise resolving to the driver's HOS logs
 */
const getDriverHOSLogs = (driverId: string, startDate: string, endDate: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.ELD}/drivers/${driverId}/hos/logs`, {
    params: { startDate, endDate }
  });
};

/**
 * Creates a new TMS connection for a carrier
 * @param connectionData Connection configuration data
 * @returns Promise resolving to the created TMS connection
 */
const createTmsConnection = (connectionData: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.TMS}/connections`, connectionData);
};

/**
 * Retrieves all TMS connections for a carrier
 * @param carrierId The carrier ID
 * @returns Promise resolving to the list of TMS connections
 */
const getTmsConnections = (carrierId: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.TMS}/connections`, {
    params: { carrierId }
  });
};

/**
 * Retrieves a specific TMS connection by ID
 * @param connectionId The connection ID
 * @returns Promise resolving to the TMS connection details
 */
const getTmsConnection = (connectionId: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.TMS}/connections/${connectionId}`);
};

/**
 * Updates an existing TMS connection
 * @param connectionId The connection ID
 * @param connectionData Updated connection data
 * @returns Promise resolving to the updated TMS connection
 */
const updateTmsConnection = (connectionId: string, connectionData: any): Promise<AxiosResponse> => {
  return apiClient.put(`${INTEGRATION_ENDPOINTS.TMS}/connections/${connectionId}`, connectionData);
};

/**
 * Deletes a TMS connection
 * @param connectionId The connection ID
 * @returns Promise resolving to a success indicator
 */
const deleteTmsConnection = (connectionId: string): Promise<AxiosResponse> => {
  return apiClient.delete(`${INTEGRATION_ENDPOINTS.TMS}/connections/${connectionId}`);
};

/**
 * Tests a TMS connection
 * @param connectionId The connection ID
 * @returns Promise resolving to the test result
 */
const testTmsConnection = (connectionId: string): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.TMS}/connections/${connectionId}/test`);
};

/**
 * Triggers synchronization between TMS and platform
 * @param syncRequest Synchronization parameters
 * @returns Promise resolving to the sync results
 */
const syncTmsData = (syncRequest: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.TMS}/sync`, syncRequest);
};

/**
 * Retrieves all payment methods for a carrier
 * @param carrierId The carrier ID
 * @returns Promise resolving to the list of payment methods
 */
const getPaymentMethods = (carrierId: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.PAYMENT}/methods`, {
    params: { carrierId }
  });
};

/**
 * Retrieves a specific payment method by ID
 * @param paymentMethodId The payment method ID
 * @returns Promise resolving to the payment method details
 */
const getPaymentMethod = (paymentMethodId: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.PAYMENT}/methods/${paymentMethodId}`);
};

/**
 * Creates a tokenization session for securely collecting payment method information
 * @param params Session parameters
 * @returns Promise resolving to the tokenization session details
 */
const createTokenizationSession = (params: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.PAYMENT}/tokenize`, params);
};

/**
 * Processes the callback from tokenization session and creates a payment method
 * @param carrierId The carrier ID
 * @param callbackData Callback data from tokenization provider
 * @returns Promise resolving to the created payment method
 */
const processTokenCallback = (carrierId: string, callbackData: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.PAYMENT}/callback`, {
    carrierId,
    ...callbackData
  });
};

/**
 * Deletes a payment method
 * @param paymentMethodId The payment method ID
 * @returns Promise resolving to a success indicator
 */
const deletePaymentMethod = (paymentMethodId: string): Promise<AxiosResponse> => {
  return apiClient.delete(`${INTEGRATION_ENDPOINTS.PAYMENT}/methods/${paymentMethodId}`);
};

/**
 * Sets a payment method as the default for a carrier
 * @param paymentMethodId The payment method ID
 * @returns Promise resolving to the updated payment method
 */
const setDefaultPaymentMethod = (paymentMethodId: string): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.PAYMENT}/methods/${paymentMethodId}/default`);
};

/**
 * Processes a payment using a specified payment method
 * @param paymentRequest Payment details
 * @returns Promise resolving to the payment result
 */
const processPayment = (paymentRequest: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.PAYMENT}/process`, paymentRequest);
};

/**
 * Checks the status of a payment
 * @param paymentId The payment ID
 * @returns Promise resolving to the payment status
 */
const getPaymentStatus = (paymentId: string): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.PAYMENT}/status/${paymentId}`);
};

/**
 * Calculates directions between an origin and destination
 * @param directionsRequest Origin, destination, and routing preferences
 * @returns Promise resolving to the directions result
 */
const getDirections = (directionsRequest: any): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.MAPPING}/directions`, directionsRequest);
};

/**
 * Converts an address into geographic coordinates
 * @param address The address to geocode
 * @param options Additional geocoding options
 * @returns Promise resolving to the geocoding result
 */
const geocode = (address: string, options: any = {}): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.MAPPING}/geocode`, { 
    address, 
    ...options 
  });
};

/**
 * Validates an address by geocoding it and checking the result quality
 * @param address The address to validate
 * @param options Additional validation options
 * @returns Promise resolving to the address validation result
 */
const validateAddress = (address: string, options: any = {}): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.MAPPING}/validate-address`, { 
    address, 
    ...options 
  });
};

/**
 * Gets current weather conditions for a specific location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param options Additional weather options
 * @returns Promise resolving to the current weather data
 */
const getCurrentWeather = (latitude: number, longitude: number, options: any = {}): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.WEATHER}/current`, {
    params: {
      latitude,
      longitude,
      ...options
    }
  });
};

/**
 * Gets weather forecast for a specific location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param options Additional forecast options
 * @returns Promise resolving to the forecast data
 */
const getWeatherForecast = (latitude: number, longitude: number, options: any = {}): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.WEATHER}/forecast`, {
    params: {
      latitude,
      longitude,
      ...options
    }
  });
};

/**
 * Gets weather conditions along a route with multiple waypoints
 * @param waypoints Array of waypoint coordinates [lat, lng]
 * @param departureTime ISO string of departure time
 * @returns Promise resolving to the route weather data
 */
const getRouteWeather = (waypoints: [number, number][], departureTime: string): Promise<AxiosResponse> => {
  return apiClient.post(`${INTEGRATION_ENDPOINTS.WEATHER}/route`, {
    waypoints,
    departureTime
  });
};

/**
 * Gets active weather alerts and warnings for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param options Additional alert options
 * @returns Promise resolving to the weather alerts
 */
const getWeatherAlerts = (latitude: number, longitude: number, options: any = {}): Promise<AxiosResponse> => {
  return apiClient.get(`${INTEGRATION_ENDPOINTS.WEATHER}/alerts`, {
    params: {
      latitude,
      longitude,
      ...options
    }
  });
};

// Group all ELD-related functions
const eld = {
  createConnection: createEldConnection,
  getConnections: getEldConnections,
  getConnection: getEldConnection,
  updateConnection: updateEldConnection,
  deleteConnection: deleteEldConnection,
  getAuthorizationUrl: getEldAuthorizationUrl,
  exchangeToken: exchangeEldToken,
  validateConnection: validateEldConnection,
  getDriverHOS,
  getDriverHOSLogs
};

// Group all TMS-related functions
const tms = {
  createConnection: createTmsConnection,
  getConnections: getTmsConnections,
  getConnection: getTmsConnection,
  updateConnection: updateTmsConnection,
  deleteConnection: deleteTmsConnection,
  testConnection: testTmsConnection,
  syncData: syncTmsData
};

// Group all payment-related functions
const payment = {
  getMethods: getPaymentMethods,
  getMethod: getPaymentMethod,
  createTokenizationSession,
  processTokenCallback,
  deleteMethod: deletePaymentMethod,
  setDefaultMethod: setDefaultPaymentMethod,
  processPayment,
  getStatus: getPaymentStatus
};

// Group all mapping-related functions
const mapping = {
  getDirections,
  geocode,
  validateAddress
};

// Group all weather-related functions
const weather = {
  getCurrent: getCurrentWeather,
  getForecast: getWeatherForecast,
  getRouteWeather,
  getAlerts: getWeatherAlerts
};

// Export the API client with all integration functions grouped by domain
export default {
  eld,
  tms,
  payment,
  mapping,
  weather
};