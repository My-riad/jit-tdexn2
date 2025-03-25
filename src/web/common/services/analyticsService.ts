/**
 * Analytics Service
 * 
 * A common analytics service that provides functionality for data analysis, metrics collection,
 * and visualization across all web applications of the AI-driven Freight Optimization Platform.
 * 
 * This service handles API communication with backend analytics endpoints, data transformation,
 * caching, and error handling for analytics operations.
 */

import { cloneDeep, merge } from 'lodash'; // ^4.17.21
import axios from 'axios'; // ^1.4.0

import apiClient from '../api/apiClient';
import { API_BASE_URL } from '../constants/endpoints';
import logger from '../utils/logger';
import { handleApiError } from '../utils/errorHandlers';
import { formatDate } from '../utils/dateTimeUtils';
import { StorageType, storageService } from './storageService';

// Cache configuration
const ANALYTICS_CACHE_KEY = 'analytics_data';
const ANALYTICS_CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

// API endpoints for analytics
const ANALYTICS_ENDPOINTS = {
  EFFICIENCY: `${API_BASE_URL}/api/v1/analytics/efficiency`,
  FINANCIAL: `${API_BASE_URL}/api/v1/analytics/financial`,
  OPERATIONAL: `${API_BASE_URL}/api/v1/analytics/operational`,
  DRIVER_PERFORMANCE: `${API_BASE_URL}/api/v1/analytics/driver-performance`,
  DASHBOARD: `${API_BASE_URL}/api/v1/analytics/dashboard`,
  EXPORT: `${API_BASE_URL}/api/v1/analytics/export`
};

/**
 * Filter parameters for analytics requests
 */
export interface MetricsFilter {
  startDate?: string | Date;
  endDate?: string | Date;
  timeframe?: string;
  region?: string;
  driverId?: string;
  carrierId?: string;
  vehicleId?: string;
  shipperId?: string;
  loadType?: string;
  comparison?: boolean;
  groupBy?: string;
}

/**
 * Generic structure for chart data
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
  title?: string;
}

/**
 * Efficiency metrics data structure
 */
export interface EfficiencyMetrics {
  score: number;
  emptyMiles: number;
  utilization: number;
  smartHubUsage: number;
  relayOpportunities: number;
  trend: Array<{date: string, score: number}>;
}

/**
 * Financial metrics data structure
 */
export interface FinancialMetrics {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: Array<{date: string, value: number}>;
  };
  costSavings: {
    fuelSavings: number;
    timeSavings: number;
    maintenanceSavings: number;
    totalSavings: number;
  };
  revenuePerMile: number;
  profitMargin: number;
}

/**
 * Operational metrics data structure
 */
export interface OperationalMetrics {
  loadFulfillmentRate: number;
  onTimeDelivery: number;
  averageTransitTime: number;
  vehicleUtilization: number;
  driverUtilization: number;
  issueRate: number;
}

/**
 * Driver performance metrics data structure
 */
export interface DriverPerformanceMetrics {
  topPerformers: Array<{
    driverId: string;
    name: string;
    score: number;
    change: number;
  }>;
  averageScore: number;
  scoreDistribution: Array<{range: string, count: number}>;
  improvementRate: number;
}

/**
 * Combined metrics for the main dashboard
 */
export interface DashboardMetrics {
  efficiency: EfficiencyMetrics;
  financial: FinancialMetrics;
  operational: OperationalMetrics;
  driverPerformance: DriverPerformanceMetrics;
}

/**
 * Executes an analytics query to the backend API with caching support
 * 
 * @param endpoint - API endpoint to query
 * @param filters - Metrics filters to apply to the query
 * @param useCache - Whether to use cached data if available
 * @returns Query results from the API or cache
 */
export async function executeQuery(
  endpoint: string,
  filters: MetricsFilter = {},
  useCache: boolean = true
): Promise<any> {
  try {
    // Generate a cache key based on the endpoint and filters
    const cacheKey = generateCacheKey(endpoint, filters);
    
    // Try to get data from cache if useCache is true
    if (useCache) {
      const cachedData = storageService.getItem<{
        data: any;
        timestamp: number;
      }>(cacheKey);
      
      // Check if we have valid cached data that hasn't expired
      if (cachedData && 
          cachedData.data && 
          cachedData.timestamp && 
          (Date.now() - cachedData.timestamp < ANALYTICS_CACHE_EXPIRY)) {
        logger.debug('Using cached analytics data', { 
          endpoint,
          cacheAge: Date.now() - cachedData.timestamp
        });
        return cachedData.data;
      }
    }
    
    // Format date filters if provided
    const formattedFilters = { ...filters };
    if (formattedFilters.startDate) {
      formattedFilters.startDate = formatDate(formattedFilters.startDate, 'yyyy-MM-dd');
    }
    if (formattedFilters.endDate) {
      formattedFilters.endDate = formatDate(formattedFilters.endDate, 'yyyy-MM-dd');
    }
    
    // Make API request
    logger.debug('Fetching analytics data from API', { endpoint, filters: formattedFilters });
    const response = await apiClient.get(endpoint, { params: formattedFilters });
    
    // Cache the result if useCache is true
    if (useCache) {
      storageService.setItem(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      logger.debug('Cached analytics data', { endpoint });
    }
    
    return response.data;
  } catch (error) {
    logger.error('Failed to execute analytics query', { 
      endpoint, 
      error
    });
    throw handleApiError(error as any);
  }
}

/**
 * Retrieves efficiency metrics data
 * 
 * @param filters - Optional filters to apply to the query
 * @param useCache - Whether to use cached data if available
 * @returns Efficiency metrics data
 */
export async function getEfficiencyMetrics(
  filters: MetricsFilter = {},
  useCache: boolean = true
): Promise<EfficiencyMetrics> {
  try {
    logger.info('Getting efficiency metrics', { filters });
    const data = await executeQuery(ANALYTICS_ENDPOINTS.EFFICIENCY, filters, useCache);
    return data as EfficiencyMetrics;
  } catch (error) {
    logger.error('Failed to get efficiency metrics', { error, filters });
    throw error;
  }
}

/**
 * Retrieves financial metrics data
 * 
 * @param filters - Optional filters to apply to the query
 * @param useCache - Whether to use cached data if available
 * @returns Financial metrics data
 */
export async function getFinancialMetrics(
  filters: MetricsFilter = {},
  useCache: boolean = true
): Promise<FinancialMetrics> {
  try {
    logger.info('Getting financial metrics', { filters });
    const data = await executeQuery(ANALYTICS_ENDPOINTS.FINANCIAL, filters, useCache);
    return data as FinancialMetrics;
  } catch (error) {
    logger.error('Failed to get financial metrics', { error, filters });
    throw error;
  }
}

/**
 * Retrieves operational metrics data
 * 
 * @param filters - Optional filters to apply to the query
 * @param useCache - Whether to use cached data if available
 * @returns Operational metrics data
 */
export async function getOperationalMetrics(
  filters: MetricsFilter = {},
  useCache: boolean = true
): Promise<OperationalMetrics> {
  try {
    logger.info('Getting operational metrics', { filters });
    const data = await executeQuery(ANALYTICS_ENDPOINTS.OPERATIONAL, filters, useCache);
    return data as OperationalMetrics;
  } catch (error) {
    logger.error('Failed to get operational metrics', { error, filters });
    throw error;
  }
}

/**
 * Retrieves driver performance metrics data
 * 
 * @param filters - Optional filters to apply to the query
 * @param useCache - Whether to use cached data if available
 * @returns Driver performance metrics data
 */
export async function getDriverPerformanceMetrics(
  filters: MetricsFilter = {},
  useCache: boolean = true
): Promise<DriverPerformanceMetrics> {
  try {
    logger.info('Getting driver performance metrics', { filters });
    const data = await executeQuery(ANALYTICS_ENDPOINTS.DRIVER_PERFORMANCE, filters, useCache);
    return data as DriverPerformanceMetrics;
  } catch (error) {
    logger.error('Failed to get driver performance metrics', { error, filters });
    throw error;
  }
}

/**
 * Retrieves all key metrics for the dashboard
 * 
 * @param filters - Optional filters to apply to the query
 * @param useCache - Whether to use cached data if available
 * @returns Combined dashboard metrics data
 */
export async function getDashboardMetrics(
  filters: MetricsFilter = {},
  useCache: boolean = true
): Promise<DashboardMetrics> {
  try {
    logger.info('Getting dashboard metrics', { filters });
    const data = await executeQuery(ANALYTICS_ENDPOINTS.DASHBOARD, filters, useCache);
    return data as DashboardMetrics;
  } catch (error) {
    logger.error('Failed to get dashboard metrics', { error, filters });
    throw error;
  }
}

/**
 * Formats metrics data for use in charts
 * 
 * @param metricsData - Raw metrics data to format
 * @param chartType - Type of chart to format data for (bar, line, pie, etc.)
 * @param options - Additional formatting options
 * @returns Formatted chart data
 */
export function formatMetricsForChart(
  metricsData: any,
  chartType: string,
  options: any = {}
): ChartData {
  try {
    // Default colors for charts
    const defaultColors = {
      primary: '#1A73E8',
      secondary: '#34A853',
      tertiary: '#FBBC04',
      quaternary: '#EA4335',
      background: [
        'rgba(26, 115, 232, 0.7)',
        'rgba(52, 168, 83, 0.7)',
        'rgba(251, 188, 4, 0.7)',
        'rgba(234, 67, 53, 0.7)',
        'rgba(26, 115, 232, 0.5)',
        'rgba(52, 168, 83, 0.5)',
        'rgba(251, 188, 4, 0.5)',
        'rgba(234, 67, 53, 0.5)'
      ]
    };
    
    // Merge default options with provided options
    const mergedOptions = merge({
      colors: defaultColors,
      title: '',
      stacked: false
    }, options);
    
    // Initialize chart data structure
    const chartData: ChartData = {
      labels: [],
      datasets: [],
      title: mergedOptions.title
    };
    
    // Format data based on chart type
    switch (chartType.toLowerCase()) {
      case 'line': {
        // Line chart for trend data
        if (metricsData.trend) {
          chartData.labels = metricsData.trend.map((item: any) => item.date);
          chartData.datasets.push({
            label: 'Value',
            data: metricsData.trend.map((item: any) => item.value || item.score),
            borderColor: mergedOptions.colors.primary,
            backgroundColor: 'rgba(26, 115, 232, 0.1)'
          });
        } else if (metricsData.revenue && metricsData.revenue.trend) {
          chartData.labels = metricsData.revenue.trend.map((item: any) => item.date);
          chartData.datasets.push({
            label: 'Revenue',
            data: metricsData.revenue.trend.map((item: any) => item.value),
            borderColor: mergedOptions.colors.primary,
            backgroundColor: 'rgba(26, 115, 232, 0.1)'
          });
        }
        break;
      }
      
      case 'bar': {
        // Bar chart for comparative data
        if (metricsData.scoreDistribution) {
          chartData.labels = metricsData.scoreDistribution.map((item: any) => item.range);
          chartData.datasets.push({
            label: 'Driver Count',
            data: metricsData.scoreDistribution.map((item: any) => item.count),
            backgroundColor: mergedOptions.colors.background
          });
        } else if (metricsData.costSavings) {
          chartData.labels = ['Fuel', 'Time', 'Maintenance', 'Total'];
          chartData.datasets.push({
            label: 'Cost Savings',
            data: [
              metricsData.costSavings.fuelSavings,
              metricsData.costSavings.timeSavings,
              metricsData.costSavings.maintenanceSavings,
              metricsData.costSavings.totalSavings
            ],
            backgroundColor: mergedOptions.colors.background.slice(0, 4)
          });
        }
        break;
      }
      
      case 'pie':
      case 'doughnut': {
        // Pie/doughnut chart for distribution data
        if (metricsData.scoreDistribution) {
          chartData.labels = metricsData.scoreDistribution.map((item: any) => item.range);
          chartData.datasets.push({
            label: 'Distribution',
            data: metricsData.scoreDistribution.map((item: any) => item.count),
            backgroundColor: mergedOptions.colors.background
          });
        } else if (metricsData.utilization !== undefined) {
          chartData.labels = ['Utilized', 'Unutilized'];
          chartData.datasets.push({
            label: 'Utilization',
            data: [metricsData.utilization, 100 - metricsData.utilization],
            backgroundColor: [mergedOptions.colors.primary, 'rgba(200, 200, 200, 0.7)']
          });
        } else if (metricsData.emptyMiles !== undefined) {
          chartData.labels = ['Loaded Miles', 'Empty Miles'];
          chartData.datasets.push({
            label: 'Miles Distribution',
            data: [100 - metricsData.emptyMiles, metricsData.emptyMiles],
            backgroundColor: [mergedOptions.colors.secondary, mergedOptions.colors.quaternary]
          });
        }
        break;
      }
      
      case 'radar': {
        // Radar chart for multi-dimensional metrics
        if (metricsData.score !== undefined) {
          chartData.labels = [
            'Efficiency Score', 
            'Utilization', 
            'Empty Miles Reduction', 
            'Smart Hub Usage', 
            'Relay Opportunities'
          ];
          chartData.datasets.push({
            label: 'Performance Metrics',
            data: [
              metricsData.score,
              metricsData.utilization,
              100 - metricsData.emptyMiles,
              metricsData.smartHubUsage,
              metricsData.relayOpportunities
            ],
            backgroundColor: 'rgba(26, 115, 232, 0.2)',
            borderColor: mergedOptions.colors.primary
          });
        }
        break;
      }
      
      default: {
        // Default handling for unknown chart types
        logger.warn('Unknown chart type specified, falling back to basic format', { chartType });
        if (Array.isArray(metricsData)) {
          chartData.labels = metricsData.map((item, index) => `Item ${index + 1}`);
          chartData.datasets.push({
            label: 'Values',
            data: metricsData,
            backgroundColor: mergedOptions.colors.background
          });
        } else {
          const keys = Object.keys(metricsData).filter(key => 
            typeof metricsData[key] === 'number'
          );
          chartData.labels = keys;
          chartData.datasets.push({
            label: 'Values',
            data: keys.map(key => metricsData[key]),
            backgroundColor: mergedOptions.colors.background.slice(0, keys.length)
          });
        }
      }
    }
    
    return chartData;
  } catch (error) {
    logger.error('Failed to format metrics for chart', { error, chartType });
    // Return empty chart data structure on error
    return {
      labels: [],
      datasets: []
    };
  }
}

/**
 * Exports analytics data as a downloadable report
 * 
 * @param reportType - Type of report to export
 * @param filters - Filters to apply to the exported data
 * @param format - Export format (pdf, csv, excel)
 * @returns Report data as a downloadable blob
 */
export async function exportAnalyticsReport(
  reportType: string,
  filters: MetricsFilter = {},
  format: string = 'pdf'
): Promise<Blob> {
  try {
    logger.info('Exporting analytics report', { reportType, format, filters });
    
    // Format date filters if provided
    const formattedFilters = { ...filters };
    if (formattedFilters.startDate) {
      formattedFilters.startDate = formatDate(formattedFilters.startDate, 'yyyy-MM-dd');
    }
    if (formattedFilters.endDate) {
      formattedFilters.endDate = formatDate(formattedFilters.endDate, 'yyyy-MM-dd');
    }
    
    // Make API request with blob response type
    const response = await apiClient.get(`${ANALYTICS_ENDPOINTS.EXPORT}/${reportType}`, {
      params: {
        ...formattedFilters,
        format
      },
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to export analytics report', { error, reportType, format });
    throw handleApiError(error as any);
  }
}

/**
 * Clears all cached analytics data
 */
export function clearAnalyticsCache(): void {
  logger.info('Clearing analytics cache');
  const cacheKeys = storageService.getKeys().filter(key => 
    key.startsWith(ANALYTICS_CACHE_KEY)
  );
  
  for (const key of cacheKeys) {
    storageService.removeItem(key);
  }
  
  logger.debug('Analytics cache cleared', { keysRemoved: cacheKeys.length });
}

/**
 * Generates a cache key based on endpoint and filters
 * 
 * @param endpoint - API endpoint
 * @param filters - Query filters
 * @returns Generated cache key
 */
export function generateCacheKey(endpoint: string, filters: MetricsFilter): string {
  // Extract the endpoint name from the full URL
  const endpointName = endpoint.split('/').pop() || 'analytics';
  
  // Create a base key with the endpoint name
  const baseKey = `${ANALYTICS_CACHE_KEY}_${endpointName}`;
  
  // If no filters, return just the base key
  if (!filters || Object.keys(filters).length === 0) {
    return baseKey;
  }
  
  // Create a copy of filters to avoid modifying the original
  const filtersCopy = cloneDeep(filters);
  
  // Format dates consistently for cache key generation
  if (filtersCopy.startDate) {
    filtersCopy.startDate = formatDate(filtersCopy.startDate, 'yyyy-MM-dd');
  }
  if (filtersCopy.endDate) {
    filtersCopy.endDate = formatDate(filtersCopy.endDate, 'yyyy-MM-dd');
  }
  
  // Create a deterministic string representation of the filters
  const filtersString = Object.entries(filtersCopy)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${baseKey}_${filtersString}`;
}

// Default export of the analytics service
export default {
  executeQuery,
  getEfficiencyMetrics,
  getFinancialMetrics,
  getOperationalMetrics,
  getDriverPerformanceMetrics,
  getDashboardMetrics,
  formatMetricsForChart,
  exportAnalyticsReport,
  clearAnalyticsCache
};