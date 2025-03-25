/**
 * API client module for carrier-related operations in the AI-driven Freight Optimization Platform.
 * Provides functions to interact with the carrier service endpoints for managing carriers,
 * retrieving carrier data, and accessing carrier performance metrics.
 */

import apiClient from './apiClient';
import { CARRIER_ENDPOINTS, getEndpointWithParams } from '../constants/endpoints';
import { 
  Carrier, 
  CarrierCreationParams, 
  CarrierUpdateParams, 
  CarrierSummary,
  CarrierPerformanceMetrics,
  CarrierNetworkStatistics,
  CarrierRecommendation,
  CarrierType
} from '../interfaces/carrier.interface';
import { Driver } from '../interfaces/driver.interface';
import { Vehicle } from '../interfaces/vehicle.interface';
import { handleApiError } from '../utils/errorHandlers';

/**
 * Parameters for filtering carrier list requests
 */
interface CarrierFilterParams {
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Search term for filtering carriers */
  search?: string;
  /** Filter by carrier type */
  carrierType?: CarrierType;
  /** Filter by active status */
  active?: boolean;
  /** Minimum fleet size for filtering */
  minFleetSize?: number;
  /** Maximum fleet size for filtering */
  maxFleetSize?: number;
  /** Filter by geographic region */
  region?: string;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parameters for carrier performance metric requests
 */
interface PerformanceParams {
  /** Start date for performance period */
  startDate?: string;
  /** End date for performance period */
  endDate?: string;
  /** Timeframe for aggregating metrics */
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Parameters for carrier recommendation requests
 */
interface RecommendationParams {
  /** Maximum number of recommendations to return */
  limit?: number;
  /** Filter by geographic region */
  region?: string;
  /** Required equipment type */
  equipmentType?: string;
  /** Minimum network efficiency score */
  minNetworkScore?: number;
}

/**
 * Retrieves a list of carriers with optional filtering and pagination
 * @param params Optional query parameters for filtering, sorting, and pagination
 * @returns Promise with carriers and total count
 */
export const getAllCarriers = async (params?: CarrierFilterParams): Promise<{ carriers: CarrierSummary[]; total: number }> => {
  try {
    const response = await apiClient.get(CARRIER_ENDPOINTS.BASE, {
      params
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves detailed information for a specific carrier
 * @param carrierId The unique identifier of the carrier
 * @returns Promise with detailed carrier information
 */
export const getCarrierById = async (carrierId: string): Promise<Carrier> => {
  try {
    const endpoint = getEndpointWithParams(CARRIER_ENDPOINTS.GET_BY_ID, { carrierId });
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Creates a new carrier in the system
 * @param carrierData The carrier data to create
 * @returns Promise with created carrier data
 */
export const createCarrier = async (carrierData: CarrierCreationParams): Promise<Carrier> => {
  try {
    const response = await apiClient.post(CARRIER_ENDPOINTS.CREATE, carrierData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates an existing carrier's information
 * @param carrierId The unique identifier of the carrier to update
 * @param carrierData The updated carrier data
 * @returns Promise with updated carrier data
 */
export const updateCarrier = async (carrierId: string, carrierData: CarrierUpdateParams): Promise<Carrier> => {
  try {
    const endpoint = getEndpointWithParams(CARRIER_ENDPOINTS.UPDATE, { carrierId });
    const response = await apiClient.put(endpoint, carrierData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Removes a carrier from the system
 * @param carrierId The unique identifier of the carrier to delete
 * @returns Promise with success indicator
 */
export const deleteCarrier = async (carrierId: string): Promise<{ success: boolean }> => {
  try {
    const endpoint = getEndpointWithParams(CARRIER_ENDPOINTS.DELETE, { carrierId });
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves all drivers associated with a specific carrier
 * @param carrierId The unique identifier of the carrier
 * @param params Optional query parameters for filtering, sorting, and pagination
 * @returns Promise with drivers and total count
 */
export const getCarrierDrivers = async (
  carrierId: string,
  params?: Record<string, any>
): Promise<{ drivers: Driver[]; total: number }> => {
  try {
    const endpoint = getEndpointWithParams(CARRIER_ENDPOINTS.DRIVERS, { carrierId });
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves all vehicles associated with a specific carrier
 * @param carrierId The unique identifier of the carrier
 * @param params Optional query parameters for filtering, sorting, and pagination
 * @returns Promise with vehicles and total count
 */
export const getCarrierVehicles = async (
  carrierId: string,
  params?: Record<string, any>
): Promise<{ vehicles: Vehicle[]; total: number }> => {
  try {
    const endpoint = getEndpointWithParams(CARRIER_ENDPOINTS.VEHICLES, { carrierId });
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves performance metrics for a specific carrier
 * @param carrierId The unique identifier of the carrier
 * @param params Optional parameters for timeframe and period
 * @returns Promise with carrier performance metrics
 */
export const getCarrierPerformance = async (
  carrierId: string,
  params?: PerformanceParams
): Promise<CarrierPerformanceMetrics> => {
  try {
    const endpoint = getEndpointWithParams(CARRIER_ENDPOINTS.PERFORMANCE, { carrierId });
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves network contribution statistics for a specific carrier
 * @param carrierId The unique identifier of the carrier
 * @param params Optional parameters for timeframe and period
 * @returns Promise with carrier network statistics
 */
export const getCarrierNetworkStatistics = async (
  carrierId: string,
  params?: PerformanceParams
): Promise<CarrierNetworkStatistics> => {
  try {
    const endpoint = getEndpointWithParams(CARRIER_ENDPOINTS.PERFORMANCE, { carrierId });
    const networkEndpoint = `${endpoint}/network`;
    const response = await apiClient.get(networkEndpoint, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves recommended carriers for a specific load based on optimization factors
 * @param loadId The unique identifier of the load
 * @param params Optional parameters for filtering recommendations
 * @returns Promise with carrier recommendations
 */
export const getRecommendedCarriers = async (
  loadId: string,
  params?: RecommendationParams
): Promise<{ recommendations: CarrierRecommendation[] }> => {
  try {
    const response = await apiClient.get(`/api/v1/loads/${loadId}/recommended-carriers`, {
      params
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a list of top-performing carriers based on efficiency metrics
 * @param params Optional parameters for filtering
 * @returns Promise with top carrier summaries
 */
export const getTopPerformingCarriers = async (
  params?: Record<string, any>
): Promise<{ carriers: CarrierSummary[] }> => {
  try {
    const response = await apiClient.get(`/api/v1/carriers/top-performing`, {
      params
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};