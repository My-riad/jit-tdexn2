import { AxiosResponse } from 'axios'; // ^1.4.0

import apiClient from './apiClient';
import { getEndpointWithParams, DRIVER_ENDPOINTS } from '../constants/endpoints';
import {
  Driver,
  DriverStatus,
  DriverCreationParams,
  DriverUpdateParams,
  DriverAvailability,
  DriverHOS,
  DriverPreference,
  DriverScore,
  DriverLocation,
  DriverSummary,
  DriverWithDetails,
  DriverPerformanceMetrics,
  DriverSearchParams
} from '../interfaces/driver.interface';

/**
 * Retrieves a driver by their ID
 * @param driverId - The unique identifier of the driver
 * @returns Promise resolving to the driver data
 */
const getDriverById = async (driverId: string): Promise<Driver> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.GET_BY_ID, { driverId });
  const response = await apiClient.get<Driver>(endpoint);
  return response.data;
};

/**
 * Retrieves a driver by their user ID
 * @param userId - The user ID associated with the driver
 * @returns Promise resolving to the driver data
 */
const getDriverByUserId = async (userId: string): Promise<Driver> => {
  const endpoint = `${DRIVER_ENDPOINTS.BASE}/user/${userId}`;
  const response = await apiClient.get<Driver>(endpoint);
  return response.data;
};

/**
 * Retrieves all drivers for a specific carrier
 * @param carrierId - The unique identifier of the carrier
 * @param options - Optional query parameters like pagination
 * @returns Promise resolving to an array of driver data
 */
const getDriversByCarrierId = async (
  carrierId: string, 
  options: Record<string, any> = {}
): Promise<Driver[]> => {
  const endpoint = `${DRIVER_ENDPOINTS.BASE}/carrier/${carrierId}`;
  const response = await apiClient.get<Driver[]>(endpoint, { params: options });
  return response.data;
};

/**
 * Retrieves a driver with all related details
 * @param driverId - The unique identifier of the driver
 * @returns Promise resolving to the detailed driver data
 */
const getDriverWithDetails = async (driverId: string): Promise<DriverWithDetails> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/details`, { driverId });
  const response = await apiClient.get<DriverWithDetails>(endpoint);
  return response.data;
};

/**
 * Retrieves a summary of driver information
 * @param driverId - The unique identifier of the driver
 * @returns Promise resolving to the driver summary data
 */
const getDriverSummary = async (driverId: string): Promise<DriverSummary> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/summary`, { driverId });
  const response = await apiClient.get<DriverSummary>(endpoint);
  return response.data;
};

/**
 * Creates a new driver record
 * @param driverData - The driver data to create
 * @returns Promise resolving to the created driver data
 */
const createDriver = async (driverData: DriverCreationParams): Promise<Driver> => {
  const response = await apiClient.post<Driver>(DRIVER_ENDPOINTS.BASE, driverData);
  return response.data;
};

/**
 * Updates an existing driver record
 * @param driverId - The unique identifier of the driver
 * @param driverData - The driver data to update
 * @returns Promise resolving to the updated driver data
 */
const updateDriver = async (
  driverId: string, 
  driverData: DriverUpdateParams
): Promise<Driver> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.UPDATE, { driverId });
  const response = await apiClient.put<Driver>(endpoint, driverData);
  return response.data;
};

/**
 * Updates a driver's status
 * @param driverId - The unique identifier of the driver
 * @param status - The new status to set
 * @returns Promise resolving to the updated driver data
 */
const updateDriverStatus = async (
  driverId: string, 
  status: DriverStatus
): Promise<Driver> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/status`, { driverId });
  const response = await apiClient.put<Driver>(endpoint, { status });
  return response.data;
};

/**
 * Updates a driver's efficiency score
 * @param driverId - The unique identifier of the driver
 * @param score - The new efficiency score
 * @returns Promise resolving to the updated driver data
 */
const updateDriverEfficiencyScore = async (
  driverId: string, 
  score: number
): Promise<Driver> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/efficiency-score`, { driverId });
  const response = await apiClient.put<Driver>(endpoint, { score });
  return response.data;
};

/**
 * Retrieves a driver's availability information
 * @param driverId - The unique identifier of the driver
 * @returns Promise resolving to the driver availability data
 */
const getDriverAvailability = async (driverId: string): Promise<DriverAvailability> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.AVAILABILITY, { driverId });
  const response = await apiClient.get<DriverAvailability>(endpoint);
  return response.data;
};

/**
 * Updates a driver's availability information
 * @param driverId - The unique identifier of the driver
 * @param availabilityData - The availability data to update
 * @returns Promise resolving to the updated availability data
 */
const updateDriverAvailability = async (
  driverId: string, 
  availabilityData: Partial<DriverAvailability>
): Promise<DriverAvailability> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.AVAILABILITY, { driverId });
  const response = await apiClient.put<DriverAvailability>(endpoint, availabilityData);
  return response.data;
};

/**
 * Retrieves a driver's Hours of Service records
 * @param driverId - The unique identifier of the driver
 * @param options - Optional query parameters for filtering HOS records
 * @returns Promise resolving to an array of HOS records
 */
const getDriverHOS = async (
  driverId: string, 
  options: Record<string, any> = {}
): Promise<DriverHOS[]> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.HOS, { driverId });
  const response = await apiClient.get<DriverHOS[]>(endpoint, { params: options });
  return response.data;
};

/**
 * Updates a driver's Hours of Service status
 * @param driverId - The unique identifier of the driver
 * @param hosData - The HOS data to update
 * @returns Promise resolving to the updated HOS record
 */
const updateDriverHOS = async (
  driverId: string, 
  hosData: Partial<DriverHOS>
): Promise<DriverHOS> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.HOS, { driverId });
  const response = await apiClient.put<DriverHOS>(endpoint, hosData);
  return response.data;
};

/**
 * Retrieves a driver's preferences
 * @param driverId - The unique identifier of the driver
 * @returns Promise resolving to an array of driver preferences
 */
const getDriverPreferences = async (driverId: string): Promise<DriverPreference[]> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.PREFERENCES, { driverId });
  const response = await apiClient.get<DriverPreference[]>(endpoint);
  return response.data;
};

/**
 * Updates or creates a driver preference
 * @param driverId - The unique identifier of the driver
 * @param preference - The preference data to update or create
 * @returns Promise resolving to the updated preference
 */
const updateDriverPreference = async (
  driverId: string, 
  preference: DriverPreference
): Promise<DriverPreference> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.PREFERENCES, { driverId });
  const response = await apiClient.put<DriverPreference>(endpoint, preference);
  return response.data;
};

/**
 * Deletes a driver preference
 * @param driverId - The unique identifier of the driver
 * @param preferenceId - The unique identifier of the preference to delete
 * @returns Promise resolving when the preference is deleted
 */
const deleteDriverPreference = async (
  driverId: string, 
  preferenceId: string
): Promise<void> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.PREFERENCES}/${preferenceId}`, { driverId });
  await apiClient.delete(endpoint);
};

/**
 * Retrieves a driver's performance metrics
 * @param driverId - The unique identifier of the driver
 * @param options - Optional query parameters for filtering performance data
 * @returns Promise resolving to the driver performance metrics
 */
const getDriverPerformance = async (
  driverId: string, 
  options: Record<string, any> = {}
): Promise<DriverPerformanceMetrics> => {
  const endpoint = getEndpointWithParams(DRIVER_ENDPOINTS.PERFORMANCE, { driverId });
  const response = await apiClient.get<DriverPerformanceMetrics>(endpoint, { params: options });
  return response.data;
};

/**
 * Retrieves a driver's efficiency score details
 * @param driverId - The unique identifier of the driver
 * @returns Promise resolving to the driver score data
 */
const getDriverScore = async (driverId: string): Promise<DriverScore> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/score`, { driverId });
  const response = await apiClient.get<DriverScore>(endpoint);
  return response.data;
};

/**
 * Updates a driver's current location
 * @param driverId - The unique identifier of the driver
 * @param locationData - The location data to update
 * @returns Promise resolving to the updated location data
 */
const updateDriverLocation = async (
  driverId: string, 
  locationData: DriverLocation
): Promise<DriverLocation> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/location`, { driverId });
  const response = await apiClient.post<DriverLocation>(endpoint, locationData);
  return response.data;
};

/**
 * Searches for drivers based on various criteria
 * @param searchParams - The search parameters
 * @returns Promise resolving to search results with pagination info
 */
const searchDrivers = async (
  searchParams: DriverSearchParams
): Promise<{ drivers: Driver[]; total: number; page: number; limit: number; }> => {
  const endpoint = `${DRIVER_ENDPOINTS.BASE}/search`;
  const response = await apiClient.get(endpoint, { params: searchParams });
  return response.data;
};

/**
 * Validates if a driver is eligible for a specific load
 * @param driverId - The unique identifier of the driver
 * @param loadDetails - The load details to validate against
 * @returns Promise resolving to validation result
 */
const validateDriverForLoad = async (
  driverId: string, 
  loadDetails: Record<string, any>
): Promise<{ eligible: boolean; reasons?: string[]; }> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/validate`, { driverId });
  const response = await apiClient.post(endpoint, loadDetails);
  return response.data;
};

/**
 * Activates a deactivated driver
 * @param driverId - The unique identifier of the driver
 * @returns Promise resolving to the updated driver data
 */
const activateDriver = async (driverId: string): Promise<Driver> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/activate`, { driverId });
  const response = await apiClient.put<Driver>(endpoint);
  return response.data;
};

/**
 * Deactivates an active driver
 * @param driverId - The unique identifier of the driver
 * @returns Promise resolving to the updated driver data
 */
const deactivateDriver = async (driverId: string): Promise<Driver> => {
  const endpoint = getEndpointWithParams(`${DRIVER_ENDPOINTS.GET_BY_ID}/deactivate`, { driverId });
  const response = await apiClient.put<Driver>(endpoint);
  return response.data;
};

export default {
  getDriverById,
  getDriverByUserId,
  getDriversByCarrierId,
  getDriverWithDetails,
  getDriverSummary,
  createDriver,
  updateDriver,
  updateDriverStatus,
  updateDriverEfficiencyScore,
  getDriverAvailability,
  updateDriverAvailability,
  getDriverHOS,
  updateDriverHOS,
  getDriverPreferences,
  updateDriverPreference,
  deleteDriverPreference,
  getDriverPerformance,
  getDriverScore,
  updateDriverLocation,
  searchDrivers,
  validateDriverForLoad,
  activateDriver,
  deactivateDriver
};