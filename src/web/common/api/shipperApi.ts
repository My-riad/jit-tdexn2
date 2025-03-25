/**
 * API client for shipper-related operations in the AI-driven Freight Optimization Platform.
 * Provides functions to interact with the shipper service endpoints for creating, retrieving,
 * updating, and deleting shipper profiles, as well as accessing shipper-specific data like
 * performance metrics, load statistics, and optimization savings.
 */

import { AxiosResponse } from 'axios'; // ^1.4.0
import apiClient from './apiClient';
import { 
  SHIPPER_ENDPOINTS, 
  getEndpointWithParams 
} from '../constants/endpoints';
import {
  Shipper,
  ShipperCreationParams,
  ShipperUpdateParams,
  ShipperSummary,
  ShipperPerformanceMetrics,
  ShipperLoadStatistics,
  OptimizationSavings,
  ShipperMarketInsight,
  ShipperCarrierPreference,
  ShipperSettings
} from '../interfaces/shipper.interface';
import {
  LoadSummary,
  LoadCreationParams
} from '../interfaces/load.interface';

/**
 * Retrieves a list of all shippers with optional filtering and pagination
 * @param params Optional parameters for filtering and pagination
 * @returns Promise resolving to a paginated list of shipper summaries
 */
export const getShippers = (
  params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }
): Promise<AxiosResponse<{
  data: ShipperSummary[];
  total: number;
  page: number;
  limit: number;
}>> => {
  return apiClient.get(SHIPPER_ENDPOINTS.BASE, { params });
};

/**
 * Retrieves detailed information for a specific shipper by ID
 * @param shipperId The ID of the shipper to retrieve
 * @returns Promise resolving to the shipper details
 */
export const getShipperById = (
  shipperId: string
): Promise<AxiosResponse<Shipper>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId });
  return apiClient.get(endpoint);
};

/**
 * Creates a new shipper with the provided information
 * @param shipperData The shipper data to create
 * @returns Promise resolving to the created shipper
 */
export const createShipper = (
  shipperData: ShipperCreationParams
): Promise<AxiosResponse<Shipper>> => {
  return apiClient.post(SHIPPER_ENDPOINTS.CREATE, shipperData);
};

/**
 * Updates an existing shipper with the provided information
 * @param shipperId The ID of the shipper to update
 * @param shipperData The updated shipper data
 * @returns Promise resolving to the updated shipper
 */
export const updateShipper = (
  shipperId: string,
  shipperData: ShipperUpdateParams
): Promise<AxiosResponse<Shipper>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.UPDATE, { shipperId });
  return apiClient.put(endpoint, shipperData);
};

/**
 * Deletes a shipper by ID
 * @param shipperId The ID of the shipper to delete
 * @returns Promise resolving to a success indicator
 */
export const deleteShipper = (
  shipperId: string
): Promise<AxiosResponse<{ success: boolean }>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.DELETE, { shipperId });
  return apiClient.delete(endpoint);
};

/**
 * Retrieves loads associated with a specific shipper
 * @param shipperId The ID of the shipper
 * @param params Optional parameters for filtering and pagination
 * @returns Promise resolving to a paginated list of load summaries
 */
export const getShipperLoads = (
  shipperId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string[];
  }
): Promise<AxiosResponse<{
  data: LoadSummary[];
  total: number;
  page: number;
  limit: number;
}>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.LOADS, { shipperId });
  return apiClient.get(endpoint, { params });
};

/**
 * Creates a new load for a specific shipper
 * @param shipperId The ID of the shipper
 * @param loadData The load data to create
 * @returns Promise resolving to the created load summary
 */
export const createShipperLoad = (
  shipperId: string,
  loadData: LoadCreationParams
): Promise<AxiosResponse<LoadSummary>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.LOADS, { shipperId });
  return apiClient.post(endpoint, loadData);
};

/**
 * Retrieves performance metrics for a specific shipper
 * @param shipperId The ID of the shipper
 * @param params Optional parameters for date range filtering
 * @returns Promise resolving to the shipper performance metrics
 */
export const getShipperPerformance = (
  shipperId: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<AxiosResponse<ShipperPerformanceMetrics>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.PERFORMANCE, { shipperId });
  return apiClient.get(endpoint, { params });
};

/**
 * Retrieves load statistics for a specific shipper
 * @param shipperId The ID of the shipper
 * @param params Optional parameters for date range filtering
 * @returns Promise resolving to the shipper load statistics
 */
export const getShipperLoadStatistics = (
  shipperId: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<AxiosResponse<ShipperLoadStatistics>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId }) + '/load-statistics';
  return apiClient.get(endpoint, { params });
};

/**
 * Retrieves optimization savings data for a specific shipper
 * @param shipperId The ID of the shipper
 * @param params Optional parameters for date range filtering
 * @returns Promise resolving to the optimization savings data
 */
export const getShipperOptimizationSavings = (
  shipperId: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<AxiosResponse<OptimizationSavings>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId }) + '/optimization-savings';
  return apiClient.get(endpoint, { params });
};

/**
 * Retrieves market insights specific to a shipper's lanes and load patterns
 * @param shipperId The ID of the shipper
 * @param params Optional parameters for filtering
 * @returns Promise resolving to an array of market insights
 */
export const getShipperMarketInsights = (
  shipperId: string,
  params?: {
    limit?: number;
    relevanceThreshold?: number;
  }
): Promise<AxiosResponse<ShipperMarketInsight[]>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId }) + '/market-insights';
  return apiClient.get(endpoint, { params });
};

/**
 * Retrieves a shipper's carrier preferences
 * @param shipperId The ID of the shipper
 * @returns Promise resolving to an array of carrier preferences
 */
export const getShipperCarrierPreferences = (
  shipperId: string
): Promise<AxiosResponse<ShipperCarrierPreference[]>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId }) + '/carrier-preferences';
  return apiClient.get(endpoint);
};

/**
 * Updates a shipper's preference for a specific carrier
 * @param shipperId The ID of the shipper
 * @param carrierId The ID of the carrier
 * @param preferenceData The updated preference data
 * @returns Promise resolving to the updated carrier preference
 */
export const updateShipperCarrierPreference = (
  shipperId: string,
  carrierId: string,
  preferenceData: {
    preferenceLevel: 'preferred' | 'approved' | 'restricted' | 'blocked';
    notes?: string;
  }
): Promise<AxiosResponse<ShipperCarrierPreference>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId }) + `/carrier-preferences/${carrierId}`;
  return apiClient.put(endpoint, preferenceData);
};

/**
 * Retrieves settings and preferences for a specific shipper
 * @param shipperId The ID of the shipper
 * @returns Promise resolving to the shipper settings
 */
export const getShipperSettings = (
  shipperId: string
): Promise<AxiosResponse<ShipperSettings>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId }) + '/settings';
  return apiClient.get(endpoint);
};

/**
 * Updates settings and preferences for a specific shipper
 * @param shipperId The ID of the shipper
 * @param settingsData The updated settings data
 * @returns Promise resolving to the updated shipper settings
 */
export const updateShipperSettings = (
  shipperId: string,
  settingsData: Partial<ShipperSettings>
): Promise<AxiosResponse<ShipperSettings>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId }) + '/settings';
  return apiClient.put(endpoint, settingsData);
};

/**
 * Retrieves recommended carriers for a specific shipper based on network optimization scores
 * @param shipperId The ID of the shipper
 * @param params Optional parameters for filtering
 * @returns Promise resolving to an array of recommended carriers with scores
 */
export const getRecommendedCarriers = (
  shipperId: string,
  params?: {
    limit?: number;
    origin?: string;
    destination?: string;
    equipmentType?: string;
  }
): Promise<AxiosResponse<Array<{
  carrierId: string;
  carrierName: string;
  score: number;
  onTimePercentage: number;
  availableTrucks: number;
  averageRate: number;
}>>> => {
  const endpoint = getEndpointWithParams(SHIPPER_ENDPOINTS.GET_BY_ID, { shipperId }) + '/recommended-carriers';
  return apiClient.get(endpoint, { params });
};