/**
 * Service module for the shipper portal that provides carrier-related functionality,
 * including fetching carrier data, managing carrier relationships, and retrieving
 * carrier recommendations. This service acts as a wrapper around the common carrier
 * API client, adding shipper-specific business logic and data transformations.
 */

import * as carrierApi from '../../../common/api/carrierApi';
import { 
  Carrier, 
  CarrierSummary, 
  CarrierPerformanceMetrics,
  CarrierNetworkStatistics,
  CarrierRecommendation,
  CarrierShipperRelationship
} from '../../../common/interfaces/carrier.interface';
import { handleApiError } from '../../../common/utils/errorHandlers';
import { CARRIER_ENDPOINTS, getEndpointWithParams } from '../../../common/constants/endpoints';

/**
 * Parameters for updating a carrier-shipper relationship
 */
export interface CarrierRelationshipUpdateParams {
  /** Whether this carrier is preferred by the shipper */
  preferred?: boolean;
  /** Status of the relationship (active, inactive, pending) */
  status?: string;
  /** Contract number between shipper and carrier */
  contractNumber?: string;
  /** Start date of the contract */
  contractStartDate?: string;
  /** End date of the contract */
  contractEndDate?: string;
  /** Additional notes about the relationship */
  notes?: string;
}

/**
 * Parameters for comparing carriers
 */
export interface CarrierComparisonParams {
  /** Array of carrier IDs to compare */
  carrierIds: string[];
  /** Array of metric names to compare */
  metrics: string[];
  /** Time period for the comparison */
  timeframe?: { startDate: string; endDate: string };
}

/**
 * Parameters for retrieving historical performance
 */
export interface HistoricalPerformanceParams {
  /** Start date for the historical data */
  startDate: string;
  /** End date for the historical data */
  endDate: string;
  /** Time interval for data points */
  interval?: 'day' | 'week' | 'month';
  /** Specific metrics to include */
  metrics?: string[];
}

/**
 * Retrieves a list of carriers with optional filtering and pagination,
 * with additional shipper-specific data transformations
 * @param params Optional query parameters for filtering, sorting, and pagination
 * @returns Promise with carriers and total count
 */
export const getCarriers = async (params?: object): Promise<{ carriers: CarrierSummary[]; total: number }> => {
  try {
    // Call the carrier API to get carriers
    const result = await carrierApi.getAllCarriers(params);

    // Apply any shipper-specific transformations or enhancements
    // This could include adding relationship data, custom flags, etc.
    const enhancedCarriers = result.carriers.map(carrier => ({
      ...carrier,
      // Add any shipper-specific fields or transformations here
    }));

    return {
      carriers: enhancedCarriers,
      total: result.total
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves detailed information for a specific carrier including
 * shipper-specific relationship data
 * @param carrierId The unique identifier of the carrier
 * @returns Promise with detailed carrier information
 */
export const getCarrierDetails = async (carrierId: string): Promise<Carrier> => {
  try {
    // Get the base carrier information
    const carrier = await carrierApi.getCarrierById(carrierId);

    // Try to get the relationship information
    try {
      const relationship = await getCarrierRelationship(carrierId);
      
      // Return carrier with relationship data
      return {
        ...carrier,
        // Add relationship data or other shipper-specific fields
        relationship
      };
    } catch (relationshipError) {
      // If relationship fetch fails, still return the carrier data
      return carrier;
    }
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves performance metrics for a specific carrier with shipper-specific context
 * @param carrierId The unique identifier of the carrier
 * @param params Optional parameters for timeframe and metrics
 * @returns Promise with carrier performance metrics
 */
export const getCarrierPerformanceMetrics = async (
  carrierId: string,
  params?: object
): Promise<CarrierPerformanceMetrics> => {
  try {
    const metrics = await carrierApi.getCarrierPerformance(carrierId, params);

    // Apply any shipper-specific context or enhancements
    // This could include comparing to shipper averages or adding contextual data
    return {
      ...metrics,
      // Add shipper-specific context if needed
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves network contribution statistics for a specific carrier
 * @param carrierId The unique identifier of the carrier
 * @param params Optional parameters for timeframe
 * @returns Promise with carrier network statistics
 */
export const getCarrierNetworkStats = async (
  carrierId: string,
  params?: object
): Promise<CarrierNetworkStatistics> => {
  try {
    return await carrierApi.getCarrierNetworkStatistics(carrierId, params);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves recommended carriers for a specific load based on optimization factors
 * @param loadId The unique identifier of the load
 * @param params Optional parameters for filtering
 * @returns Promise with carrier recommendations
 */
export const getRecommendedCarriersForLoad = async (
  loadId: string,
  params?: object
): Promise<{ recommendations: CarrierRecommendation[] }> => {
  try {
    const result = await carrierApi.getRecommendedCarriers(loadId, params);

    // Apply any shipper-specific filtering or sorting
    // For example, prioritize preferred carriers or add shipper-specific context
    const enhancedRecommendations = result.recommendations.map(recommendation => ({
      ...recommendation,
      // Add any shipper-specific enhancements
    }));

    return {
      recommendations: enhancedRecommendations
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves a list of top-performing carriers based on efficiency metrics
 * @param params Optional parameters for filtering
 * @returns Promise with top carrier summaries
 */
export const getTopCarriers = async (
  params?: object
): Promise<{ carriers: CarrierSummary[] }> => {
  try {
    return await carrierApi.getTopPerformingCarriers(params);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves the relationship information between the shipper and a specific carrier
 * @param carrierId The unique identifier of the carrier
 * @returns Promise with relationship information
 */
export const getCarrierRelationship = async (carrierId: string): Promise<CarrierShipperRelationship> => {
  try {
    // Construct the endpoint for shipper-carrier relationship
    // This would typically be managed by the shipper's backend service
    const currentUser = localStorage.getItem('currentUser');
    const shipperId = JSON.parse(currentUser || '{}').shipperId;
    
    if (!shipperId) {
      throw new Error('Shipper ID not found in current user context');
    }
    
    const endpoint = `/api/v1/shippers/${shipperId}/carrier-relationships/${carrierId}`;
    
    // Use the API client to make the request
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch carrier relationship: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates the relationship information between the shipper and a specific carrier
 * @param carrierId The unique identifier of the carrier
 * @param relationshipData Data to update in the relationship
 * @returns Promise with updated relationship information
 */
export const updateCarrierRelationship = async (
  carrierId: string,
  relationshipData: CarrierRelationshipUpdateParams
): Promise<CarrierShipperRelationship> => {
  try {
    // Construct the endpoint for shipper-carrier relationship
    const currentUser = localStorage.getItem('currentUser');
    const shipperId = JSON.parse(currentUser || '{}').shipperId;
    
    if (!shipperId) {
      throw new Error('Shipper ID not found in current user context');
    }
    
    const endpoint = `/api/v1/shippers/${shipperId}/carrier-relationships/${carrierId}`;
    
    // Use the API client to make the request
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(relationshipData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update carrier relationship: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves historical performance data for a carrier over a specified time period
 * @param carrierId The unique identifier of the carrier
 * @param timeframe Parameters for the time period and intervals
 * @returns Promise with array of performance metrics over time
 */
export const getCarrierHistoricalPerformance = async (
  carrierId: string,
  timeframe: HistoricalPerformanceParams
): Promise<Array<CarrierPerformanceMetrics>> => {
  try {
    const endpoint = getEndpointWithParams(CARRIER_ENDPOINTS.PERFORMANCE, { carrierId });
    const historicalEndpoint = `${endpoint}/historical`;
    
    const response = await fetch(historicalEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timeframe),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch historical performance: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Compares multiple carriers based on specified metrics
 * @param carrierIds Array of carrier IDs to compare
 * @param metrics Array of metric names to compare
 * @returns Promise with comparison data by carrier and metric
 */
export const compareCarriers = async (
  carrierIds: Array<string>,
  metrics: Array<string>
): Promise<{ [carrierId: string]: { [metric: string]: number } }> => {
  try {
    // This would be a specialized endpoint in the backend
    const endpoint = '/api/v1/carriers/compare';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ carrierIds, metrics }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to compare carriers: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw handleApiError(error);
  }
};