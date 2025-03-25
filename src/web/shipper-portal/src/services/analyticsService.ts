/**
 * Analytics Service
 * 
 * Provides functionality for accessing analytics data for the shipper portal.
 * This service enables retrieval of efficiency metrics, cost savings, carrier
 * performance, and optimization data for visualization in dashboards and reports.
 */

import { AxiosResponse } from 'axios'; // ^1.4.0
import apiClient from '../../../common/api/apiClient';
import { getEndpointWithParams, API_BASE_URL, API_VERSION } from '../../../common/constants/endpoints';

/**
 * Retrieves optimization savings metrics for the shipper over a specified time period
 * 
 * @param shipperId - ID of the shipper
 * @param dateRange - Start and end dates for the analytics period
 * @returns Promise resolving to optimization savings data
 */
export const getOptimizationSavings = async (
  shipperId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<{ 
  thisWeek: number; 
  thisMonth: number; 
  ytd: number; 
  trend: Array<{ date: string; savings: number }> 
}> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/shippers/${shipperId}/optimization-savings`;
  
  const response: AxiosResponse = await apiClient.get(endpoint, {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString()
    }
  });
  
  return response.data;
};

/**
 * Retrieves performance metrics for carriers used by the shipper
 * 
 * @param shipperId - ID of the shipper
 * @param dateRange - Start and end dates for the analytics period
 * @returns Promise resolving to carrier performance metrics
 */
export const getCarrierPerformance = async (
  shipperId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<{
  onTimeDelivery: number;
  avgCarrierScore: number;
  issueRate: number;
  carrierPerformance: Array<{
    carrierId: string;
    name: string;
    score: number;
    onTimeRate: number;
    issueCount: number;
  }>
}> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/shippers/${shipperId}/carrier-performance`;
  
  const response: AxiosResponse = await apiClient.get(endpoint, {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString()
    }
  });
  
  return response.data;
};

/**
 * Retrieves rate comparison data showing how the shipper's rates compare to market averages
 * 
 * @param shipperId - ID of the shipper
 * @param dateRange - Start and end dates for the analytics period
 * @param lanes - Optional array of lane identifiers to filter the comparison
 * @returns Promise resolving to rate comparison data
 */
export const getRateComparison = async (
  shipperId: string,
  dateRange: { startDate: Date; endDate: Date },
  lanes: string[]
): Promise<{
  overall: {
    actual: number;
    market: number;
    savings: number;
    savingsPercentage: number;
  };
  byLane: Array<{
    origin: string;
    destination: string;
    actual: number;
    market: number;
    savings: number;
    savingsPercentage: number;
  }>
}> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/shippers/${shipperId}/rate-comparison`;
  
  const response: AxiosResponse = await apiClient.get(endpoint, {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      lanes: lanes.join(',')
    }
  });
  
  return response.data;
};

/**
 * Retrieves on-time performance metrics for the shipper's loads
 * 
 * @param shipperId - ID of the shipper
 * @param dateRange - Start and end dates for the analytics period
 * @returns Promise resolving to on-time performance data
 */
export const getOnTimePerformance = async (
  shipperId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<{
  overall: number;
  byCarrier: Array<{
    carrierId: string;
    name: string;
    onTimeRate: number;
    earlyRate: number;
    lateRate: number;
  }>
}> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/shippers/${shipperId}/on-time-performance`;
  
  const response: AxiosResponse = await apiClient.get(endpoint, {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString()
    }
  });
  
  return response.data;
};

/**
 * Retrieves a summary of key metrics for the shipper dashboard
 * 
 * @param shipperId - ID of the shipper
 * @returns Promise resolving to dashboard summary metrics
 */
export const getDashboardMetrics = async (
  shipperId: string
): Promise<{
  activeSummary: {
    total: number;
    inTransit: number;
    atPickup: number;
    atDelivery: number;
    pending: number;
    issues: number;
  };
  savingsSummary: {
    thisWeek: number;
    thisMonth: number;
    ytd: number;
  };
  carrierSummary: {
    onTimeDelivery: number;
    avgScore: number;
    issueRate: number;
  }
}> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/shippers/${shipperId}/dashboard-metrics`;
  
  const response: AxiosResponse = await apiClient.get(endpoint);
  
  return response.data;
};

/**
 * Retrieves market insights and trends relevant to the shipper
 * 
 * @param shipperId - ID of the shipper
 * @param filters - Optional filters for regions and equipment types
 * @returns Promise resolving to market insights data
 */
export const getMarketInsights = async (
  shipperId: string,
  filters: { regions?: string[]; equipmentTypes?: string[] } = {}
): Promise<{
  trends: Array<{
    lane: string;
    trend: string;
    percentage: number;
    recommendation: string;
  }>;
  capacityAlerts: Array<{
    region: string;
    timeframe: string;
    severity: string;
    details: string;
  }>;
  opportunities: Array<{
    description: string;
    potentialSavings: number;
  }>
}> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/shippers/${shipperId}/market-insights`;
  
  const response: AxiosResponse = await apiClient.get(endpoint, {
    params: {
      regions: filters.regions ? filters.regions.join(',') : undefined,
      equipmentTypes: filters.equipmentTypes ? filters.equipmentTypes.join(',') : undefined
    }
  });
  
  return response.data;
};

/**
 * Retrieves analytics data for loads shipped by the shipper
 * 
 * @param shipperId - ID of the shipper
 * @param params - Parameters for load analytics including date range, grouping, and filters
 * @returns Promise resolving to load analytics data
 */
export const getLoadAnalytics = async (
  shipperId: string,
  params: {
    startDate: Date;
    endDate: Date;
    groupBy?: 'day' | 'week' | 'month';
    equipmentTypes?: string[];
    origins?: string[];
    destinations?: string[];
  }
): Promise<{
  totalLoads: number;
  totalWeight: number;
  totalMiles: number;
  avgRate: number;
  avgRatePerMile: number;
  timeDistribution: Array<{
    period: string;
    loadCount: number;
    weight: number;
    miles: number;
  }>;
  equipmentDistribution: Array<{
    type: string;
    loadCount: number;
    percentage: number;
  }>
}> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/shippers/${shipperId}/load-analytics`;
  
  // Convert array parameters to comma-separated strings
  const queryParams = {
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    groupBy: params.groupBy,
    equipmentTypes: params.equipmentTypes ? params.equipmentTypes.join(',') : undefined,
    origins: params.origins ? params.origins.join(',') : undefined,
    destinations: params.destinations ? params.destinations.join(',') : undefined
  };
  
  const response: AxiosResponse = await apiClient.get(endpoint, { params: queryParams });
  
  return response.data;
};

/**
 * Executes a custom analytics query with specified parameters
 * 
 * @param queryDefinition - Object containing the query string and parameters
 * @returns Promise resolving to custom analytics query results
 */
export const getCustomAnalytics = async (
  queryDefinition: { query: string; parameters: Record<string, any> }
): Promise<any> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/custom`;
  
  const response: AxiosResponse = await apiClient.post(endpoint, queryDefinition);
  
  return response.data;
};

/**
 * Exports analytics data in the specified format
 * 
 * @param reportType - Type of report to export
 * @param params - Parameters for the export including shipper ID, date range, and format
 * @returns Promise resolving to exported data as a Blob
 */
export const exportAnalyticsData = async (
  reportType: string,
  params: {
    shipperId: string;
    startDate: Date;
    endDate: Date;
    format: 'csv' | 'excel' | 'pdf';
  }
): Promise<Blob> => {
  const endpoint = `${API_BASE_URL}/api/${API_VERSION}/analytics/export/${reportType}`;
  
  const response: AxiosResponse = await apiClient.get(endpoint, {
    params: {
      shipperId: params.shipperId,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      format: params.format
    },
    responseType: 'blob'
  });
  
  return response.data;
};