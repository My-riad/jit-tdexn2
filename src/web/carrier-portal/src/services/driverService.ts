/**
 * Driver service module for the carrier portal of the AI-driven Freight Optimization Platform.
 * Provides functions to interact with the backend API for retrieving, creating, updating,
 * and managing drivers, their availability, performance metrics, and related data.
 * 
 * @module driverService
 */

import apiClient from '../../../common/api/apiClient';
import driverApi from '../../../common/api/driverApi';
import { 
  Driver, 
  DriverCreationParams, 
  DriverUpdateParams, 
  DriverAvailability, 
  DriverHOS, 
  DriverPreference, 
  DriverScore, 
  DriverPerformanceMetrics, 
  DriverStatus,
  DriverSearchParams 
} from '../../../common/interfaces/driver.interface';
import { handleApiError } from '../../../common/utils/errorHandlers';

/**
 * Retrieves all drivers for a carrier with optional filtering and pagination
 * 
 * @param {Object} params - Optional parameters for filtering and pagination
 * @returns {Promise<{ drivers: Driver[]; total: number; }>} Promise resolving to drivers array and total count
 */
export const getAllDrivers = async (params?: { 
  carrierId?: string; 
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  status?: DriverStatus[];
}): Promise<{ drivers: Driver[]; total: number; }> => {
  try {
    const carrierId = params?.carrierId || localStorage.getItem('carrierId');
    if (!carrierId) {
      throw new Error('Carrier ID is required');
    }
    
    const response = await driverApi.getDriversByCarrierId(carrierId, params);
    return {
      drivers: response,
      total: response.length // API returns the full array, we calculate the total here
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a specific driver by ID
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @returns {Promise<Driver>} Promise resolving to the driver data
 */
export const getDriverById = async (driverId: string): Promise<Driver> => {
  try {
    return await driverApi.getDriverById(driverId);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a driver with all related details
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @returns {Promise<DriverWithDetails>} Promise resolving to the detailed driver data
 */
export const getDriverWithDetails = async (driverId: string): Promise<any> => {
  try {
    return await driverApi.getDriverWithDetails(driverId);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Creates a new driver record
 * 
 * @param {DriverCreationParams} driverData - The driver data to create
 * @returns {Promise<Driver>} Promise resolving to the created driver data
 */
export const createDriver = async (driverData: DriverCreationParams): Promise<Driver> => {
  try {
    return await driverApi.createDriver(driverData);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates an existing driver record
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {DriverUpdateParams} driverData - The driver data to update
 * @returns {Promise<Driver>} Promise resolving to the updated driver data
 */
export const updateDriver = async (driverId: string, driverData: DriverUpdateParams): Promise<Driver> => {
  try {
    return await driverApi.updateDriver(driverId, driverData);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Deletes a driver record (typically soft delete)
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @returns {Promise<{ success: boolean; }>} Promise resolving to success status
 */
export const deleteDriver = async (driverId: string): Promise<{ success: boolean; }> => {
  try {
    const response = await apiClient.delete(`/api/v1/drivers/${driverId}`);
    return { success: true };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates a driver's status
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {DriverStatus} status - The new status to set
 * @returns {Promise<Driver>} Promise resolving to the updated driver data
 */
export const updateDriverStatus = async (driverId: string, status: DriverStatus): Promise<Driver> => {
  try {
    return await driverApi.updateDriverStatus(driverId, status);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a driver's availability information
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @returns {Promise<DriverAvailability>} Promise resolving to the driver availability data
 */
export const getDriverAvailability = async (driverId: string): Promise<DriverAvailability> => {
  try {
    return await driverApi.getDriverAvailability(driverId);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates a driver's availability information
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {Partial<DriverAvailability>} availabilityData - The availability data to update
 * @returns {Promise<DriverAvailability>} Promise resolving to the updated availability data
 */
export const updateDriverAvailability = async (
  driverId: string, 
  availabilityData: Partial<DriverAvailability>
): Promise<DriverAvailability> => {
  try {
    return await driverApi.updateDriverAvailability(driverId, availabilityData);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a driver's Hours of Service records
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {Object} options - Optional parameters for filtering HOS records
 * @returns {Promise<DriverHOS[]>} Promise resolving to an array of HOS records
 */
export const getDriverHOS = async (
  driverId: string, 
  options?: { 
    startDate?: string; 
    endDate?: string; 
    limit?: number;
  }
): Promise<DriverHOS[]> => {
  try {
    return await driverApi.getDriverHOS(driverId, options);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a driver's preferences
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @returns {Promise<DriverPreference[]>} Promise resolving to an array of driver preferences
 */
export const getDriverPreferences = async (driverId: string): Promise<DriverPreference[]> => {
  try {
    return await driverApi.getDriverPreferences(driverId);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates or creates a driver preference
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {DriverPreference} preference - The preference data to update or create
 * @returns {Promise<DriverPreference>} Promise resolving to the updated preference
 */
export const updateDriverPreference = async (
  driverId: string, 
  preference: DriverPreference
): Promise<DriverPreference> => {
  try {
    return await driverApi.updateDriverPreference(driverId, preference);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Deletes a driver preference
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {string} preferenceId - The unique identifier of the preference to delete
 * @returns {Promise<void>} Promise resolving when the preference is deleted
 */
export const deleteDriverPreference = async (
  driverId: string, 
  preferenceId: string
): Promise<void> => {
  try {
    await driverApi.deleteDriverPreference(driverId, preferenceId);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a driver's efficiency score details
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @returns {Promise<DriverScore>} Promise resolving to the driver score data
 */
export const getDriverScore = async (driverId: string): Promise<DriverScore> => {
  try {
    return await driverApi.getDriverScore(driverId);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a driver's performance metrics for a specified time period
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {Object} params - Optional period start/end dates
 * @returns {Promise<DriverPerformanceMetrics>} Promise resolving to the driver performance metrics
 */
export const getDriverPerformance = async (
  driverId: string, 
  params?: { 
    startDate?: string; 
    endDate?: string; 
  }
): Promise<DriverPerformanceMetrics> => {
  try {
    return await driverApi.getDriverPerformance(driverId, params);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a driver's earnings data for a specified time period
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {Object} params - Optional period start/end dates
 * @returns {Promise<DriverEarnings>} Promise resolving to the driver earnings data
 */
export const getDriverEarnings = async (
  driverId: string, 
  params?: { 
    startDate?: string; 
    endDate?: string; 
  }
): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/v1/drivers/${driverId}/earnings`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves the driver leaderboard for the carrier
 * 
 * @param {Object} params - Optional filtering and pagination parameters
 * @returns {Promise<{ entries: DriverLeaderboardEntry[]; total: number; }>} Promise resolving to leaderboard entries and total count
 */
export const getDriverLeaderboard = async (params?: {
  carrierId?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  region?: string;
  limit?: number;
  page?: number;
}): Promise<{ entries: any[]; total: number; }> => {
  try {
    const carrierId = params?.carrierId || localStorage.getItem('carrierId');
    if (!carrierId) {
      throw new Error('Carrier ID is required');
    }
    
    const response = await apiClient.get(`/api/v1/gamification/leaderboards/carrier/${carrierId}`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves drivers filtered by status
 * 
 * @param {DriverStatus} status - The status to filter by
 * @param {Object} params - Optional pagination parameters
 * @returns {Promise<{ drivers: Driver[]; total: number; }>} Promise resolving to filtered drivers and total count
 */
export const getDriversByStatus = async (
  status: DriverStatus, 
  params?: { 
    page?: number; 
    limit?: number; 
  }
): Promise<{ drivers: Driver[]; total: number; }> => {
  try {
    const carrierId = localStorage.getItem('carrierId');
    if (!carrierId) {
      throw new Error('Carrier ID is required');
    }
    
    const response = await apiClient.get(`/api/v1/carriers/${carrierId}/drivers`, { 
      params: { 
        status,
        ...params 
      } 
    });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves drivers with expired or soon-to-expire licenses
 * 
 * @param {number} daysThreshold - Number of days threshold for expiration (default 30)
 * @returns {Promise<{ drivers: Driver[]; total: number; }>} Promise resolving to drivers with expiring licenses and total count
 */
export const getDriversWithExpiredLicenses = async (
  daysThreshold: number = 30
): Promise<{ drivers: Driver[]; total: number; }> => {
  try {
    const carrierId = localStorage.getItem('carrierId');
    if (!carrierId) {
      throw new Error('Carrier ID is required');
    }
    
    const response = await apiClient.get(`/api/v1/carriers/${carrierId}/drivers/expiring-licenses`, { 
      params: { daysThreshold } 
    });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves the top performing drivers based on efficiency score
 * 
 * @param {number} limit - Maximum number of drivers to return (default 5)
 * @returns {Promise<{ drivers: Driver[]; total: number; }>} Promise resolving to top drivers and total count
 */
export const getTopPerformingDrivers = async (
  limit: number = 5
): Promise<{ drivers: Driver[]; total: number; }> => {
  try {
    const carrierId = localStorage.getItem('carrierId');
    if (!carrierId) {
      throw new Error('Carrier ID is required');
    }
    
    const response = await apiClient.get(`/api/v1/carriers/${carrierId}/drivers/top-performing`, { 
      params: { limit } 
    });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Assigns a vehicle to a driver
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {string} vehicleId - The unique identifier of the vehicle
 * @returns {Promise<Driver>} Promise resolving to the updated driver data
 */
export const assignVehicleToDriver = async (
  driverId: string, 
  vehicleId: string
): Promise<Driver> => {
  try {
    const response = await apiClient.post(`/api/v1/drivers/${driverId}/vehicles`, { vehicleId });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Removes vehicle assignment from a driver
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @returns {Promise<Driver>} Promise resolving to the updated driver data
 */
export const unassignVehicleFromDriver = async (driverId: string): Promise<Driver> => {
  try {
    const response = await apiClient.delete(`/api/v1/drivers/${driverId}/vehicles`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Finds drivers near a specific location
 * 
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} radiusMiles - Search radius in miles (default 50)
 * @returns {Promise<{ drivers: Driver[]; total: number; }>} Promise resolving to nearby drivers and total count
 */
export const getDriversNearLocation = async (
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<{ drivers: Driver[]; total: number; }> => {
  try {
    const carrierId = localStorage.getItem('carrierId');
    if (!carrierId) {
      throw new Error('Carrier ID is required');
    }
    
    const response = await apiClient.get(`/api/v1/carriers/${carrierId}/drivers/nearby`, { 
      params: { 
        latitude,
        longitude,
        radius: radiusMiles
      } 
    });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves drivers with sufficient available Hours of Service
 * 
 * @param {number} requiredHours - Minimum required hours available (default 4)
 * @returns {Promise<{ drivers: Driver[]; total: number; }>} Promise resolving to available drivers and total count
 */
export const getDriversWithAvailableHOS = async (
  requiredHours: number = 4
): Promise<{ drivers: Driver[]; total: number; }> => {
  try {
    const carrierId = localStorage.getItem('carrierId');
    if (!carrierId) {
      throw new Error('Carrier ID is required');
    }
    
    const response = await apiClient.get(`/api/v1/carriers/${carrierId}/drivers/available-hos`, { 
      params: { requiredHours } 
    });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Searches for drivers based on various criteria
 * 
 * @param {DriverSearchParams} searchParams - Search parameters for filtering drivers
 * @returns {Promise<{ drivers: Driver[]; total: number; page: number; limit: number; }>} Promise resolving to search results with pagination info
 */
export const searchDrivers = async (
  searchParams: DriverSearchParams
): Promise<{ drivers: Driver[]; total: number; page: number; limit: number; }> => {
  try {
    return await driverApi.searchDrivers(searchParams);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Validates if a driver is eligible for a specific load
 * 
 * @param {string} driverId - The unique identifier of the driver
 * @param {Object} loadDetails - The load details to validate against
 * @returns {Promise<{ eligible: boolean; reasons?: string[]; }>} Promise resolving to validation result
 */
export const validateDriverForLoad = async (
  driverId: string, 
  loadDetails: Record<string, any>
): Promise<{ eligible: boolean; reasons?: string[]; }> => {
  try {
    return await driverApi.validateDriverForLoad(driverId, loadDetails);
  } catch (error) {
    throw handleApiError(error);
  }
};