import apiClient from '../../../common/api/apiClient';
import { handleApiError } from '../../../common/utils/errorHandlers';
import { formatDateParam } from '../../../common/utils/dateTimeUtils';
import { AxiosResponse } from 'axios'; // ^1.4.0
import { 
  AnalyticsFilter, 
  EfficiencyMetrics, 
  FinancialMetrics, 
  OperationalMetrics, 
  DriverPerformanceMetrics, 
  DashboardMetrics,
  ChartData,
  KeyMetricsSummary
} from '@company/analytics-types'; // ^1.0.0

// Define API endpoints for analytics
const API_ENDPOINTS = {
  EFFICIENCY_METRICS: '/analytics/efficiency',
  FINANCIAL_METRICS: '/analytics/financial',
  OPERATIONAL_METRICS: '/analytics/operational',
  DRIVER_PERFORMANCE: '/analytics/driver-performance',
  DASHBOARD_METRICS: '/analytics/dashboard',
  EMPTY_MILES_CHART: '/analytics/charts/empty-miles',
  NETWORK_CONTRIBUTION_CHART: '/analytics/charts/network-contribution',
  SMART_HUB_USAGE_CHART: '/analytics/charts/smart-hub-usage',
  DRIVER_EFFICIENCY_CHART: '/analytics/charts/driver-efficiency',
  KEY_METRICS_SUMMARY: '/analytics/key-metrics',
  EXPORT_REPORT: '/analytics/export'
};

/**
 * Fetches efficiency metrics data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to efficiency metrics data
 */
export const getEfficiencyMetrics = async (filters: AnalyticsFilter): Promise<EfficiencyMetrics> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<EfficiencyMetrics> = await apiClient.get(
      API_ENDPOINTS.EFFICIENCY_METRICS,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches financial metrics data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to financial metrics data
 */
export const getFinancialMetrics = async (filters: AnalyticsFilter): Promise<FinancialMetrics> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<FinancialMetrics> = await apiClient.get(
      API_ENDPOINTS.FINANCIAL_METRICS,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches operational metrics data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to operational metrics data
 */
export const getOperationalMetrics = async (filters: AnalyticsFilter): Promise<OperationalMetrics> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<OperationalMetrics> = await apiClient.get(
      API_ENDPOINTS.OPERATIONAL_METRICS,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches driver performance metrics data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to driver performance metrics data
 */
export const getDriverPerformanceMetrics = async (filters: AnalyticsFilter): Promise<DriverPerformanceMetrics> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<DriverPerformanceMetrics> = await apiClient.get(
      API_ENDPOINTS.DRIVER_PERFORMANCE,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches dashboard metrics data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to dashboard metrics data
 */
export const getDashboardMetrics = async (filters: AnalyticsFilter): Promise<DashboardMetrics> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<DashboardMetrics> = await apiClient.get(
      API_ENDPOINTS.DASHBOARD_METRICS,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches empty miles chart data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to empty miles chart data
 */
export const getEmptyMilesChart = async (filters: AnalyticsFilter): Promise<ChartData> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<ChartData> = await apiClient.get(
      API_ENDPOINTS.EMPTY_MILES_CHART,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches network contribution chart data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to network contribution chart data
 */
export const getNetworkContributionChart = async (filters: AnalyticsFilter): Promise<ChartData> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<ChartData> = await apiClient.get(
      API_ENDPOINTS.NETWORK_CONTRIBUTION_CHART,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches smart hub usage chart data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to smart hub usage chart data
 */
export const getSmartHubUsageChart = async (filters: AnalyticsFilter): Promise<ChartData> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<ChartData> = await apiClient.get(
      API_ENDPOINTS.SMART_HUB_USAGE_CHART,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches driver efficiency chart data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to driver efficiency chart data
 */
export const getDriverEfficiencyChart = async (filters: AnalyticsFilter): Promise<ChartData> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<ChartData> = await apiClient.get(
      API_ENDPOINTS.DRIVER_EFFICIENCY_CHART,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetches key metrics summary data from the API
 * @param filters Filtering options for the data
 * @returns Promise resolving to key metrics summary data
 */
export const getKeyMetricsSummary = async (filters: AnalyticsFilter): Promise<KeyMetricsSummary> => {
  try {
    const params = prepareRequestParams(filters);
    
    const response: AxiosResponse<KeyMetricsSummary> = await apiClient.get(
      API_ENDPOINTS.KEY_METRICS_SUMMARY,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Exports analytics report data in the specified format
 * @param reportType Type of report to export (e.g., 'efficiency', 'financial', 'operational')
 * @param filters Filtering options for the data
 * @param format Export format (e.g., 'pdf', 'csv', 'excel')
 * @returns Promise resolving to report data as a Blob
 */
export const exportAnalyticsReport = async (
  reportType: string,
  filters: AnalyticsFilter,
  format: string
): Promise<Blob> => {
  try {
    const params = {
      ...prepareRequestParams(filters),
      reportType,
      format
    };
    
    const response: AxiosResponse<Blob> = await apiClient.get(
      API_ENDPOINTS.EXPORT_REPORT,
      { 
        params,
        responseType: 'blob'
      }
    );
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Helper function to prepare request parameters from filters
 * @param filters Filter options for analytics data
 * @returns Formatted request parameters
 */
const prepareRequestParams = (filters: AnalyticsFilter): object => {
  const params: any = {};
  
  // Add date range parameters if present
  if (filters.startDate) {
    params.startDate = formatDateParam(filters.startDate);
  }
  
  if (filters.endDate) {
    params.endDate = formatDateParam(filters.endDate);
  }
  
  // Add timeframe parameter if present (e.g., 'last30days', 'last7days', etc.)
  if (filters.timeframe) {
    params.timeframe = filters.timeframe;
  }
  
  // Add driver filter if present
  if (filters.driverId) {
    params.driverId = filters.driverId;
  }
  
  // Add vehicle filter if present
  if (filters.vehicleId) {
    params.vehicleId = filters.vehicleId;
  }
  
  // Add region filter if present
  if (filters.region) {
    params.region = filters.region;
  }
  
  // Add any additional filter parameters
  if (filters.additionalFilters) {
    Object.entries(filters.additionalFilters).forEach(([key, value]) => {
      params[key] = value;
    });
  }
  
  return params;
};