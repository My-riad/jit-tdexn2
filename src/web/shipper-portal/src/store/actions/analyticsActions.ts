import { createAction } from '@reduxjs/toolkit'; // v1.9.5
import { 
  ShipperMetricsFilter, 
  OptimizationSavingsMetrics, 
  CarrierPerformanceMetrics, 
  RateComparisonMetrics, 
  OnTimePerformanceMetrics, 
  ShipperDashboardMetrics, 
  LaneAnalytics, 
  CarrierAnalytics, 
  OptimizationOpportunity 
} from '../../../common/interfaces/market.interface';

/**
 * Action type constants for analytics operations in the shipper portal
 */
export const ANALYTICS_ACTION_TYPES = {
  // Optimization savings action types
  FETCH_OPTIMIZATION_SAVINGS_REQUEST: 'analytics/fetchOptimizationSavingsRequest',
  FETCH_OPTIMIZATION_SAVINGS_SUCCESS: 'analytics/fetchOptimizationSavingsSuccess',
  FETCH_OPTIMIZATION_SAVINGS_FAILURE: 'analytics/fetchOptimizationSavingsFailure',

  // Carrier performance action types
  FETCH_CARRIER_PERFORMANCE_REQUEST: 'analytics/fetchCarrierPerformanceRequest',
  FETCH_CARRIER_PERFORMANCE_SUCCESS: 'analytics/fetchCarrierPerformanceSuccess',
  FETCH_CARRIER_PERFORMANCE_FAILURE: 'analytics/fetchCarrierPerformanceFailure',

  // Rate comparison action types
  FETCH_RATE_COMPARISON_REQUEST: 'analytics/fetchRateComparisonRequest',
  FETCH_RATE_COMPARISON_SUCCESS: 'analytics/fetchRateComparisonSuccess',
  FETCH_RATE_COMPARISON_FAILURE: 'analytics/fetchRateComparisonFailure',

  // On-time performance action types
  FETCH_ONTIME_PERFORMANCE_REQUEST: 'analytics/fetchOnTimePerformanceRequest',
  FETCH_ONTIME_PERFORMANCE_SUCCESS: 'analytics/fetchOnTimePerformanceSuccess',
  FETCH_ONTIME_PERFORMANCE_FAILURE: 'analytics/fetchOnTimePerformanceFailure',

  // Dashboard metrics action types
  FETCH_DASHBOARD_METRICS_REQUEST: 'analytics/fetchDashboardMetricsRequest',
  FETCH_DASHBOARD_METRICS_SUCCESS: 'analytics/fetchDashboardMetricsSuccess',
  FETCH_DASHBOARD_METRICS_FAILURE: 'analytics/fetchDashboardMetricsFailure',

  // Lane analytics action types
  FETCH_LANE_ANALYTICS_REQUEST: 'analytics/fetchLaneAnalyticsRequest',
  FETCH_LANE_ANALYTICS_SUCCESS: 'analytics/fetchLaneAnalyticsSuccess',
  FETCH_LANE_ANALYTICS_FAILURE: 'analytics/fetchLaneAnalyticsFailure',

  // Carrier analytics action types
  FETCH_CARRIER_ANALYTICS_REQUEST: 'analytics/fetchCarrierAnalyticsRequest',
  FETCH_CARRIER_ANALYTICS_SUCCESS: 'analytics/fetchCarrierAnalyticsSuccess',
  FETCH_CARRIER_ANALYTICS_FAILURE: 'analytics/fetchCarrierAnalyticsFailure',

  // Optimization opportunities action types
  FETCH_OPTIMIZATION_OPPORTUNITIES_REQUEST: 'analytics/fetchOptimizationOpportunitiesRequest',
  FETCH_OPTIMIZATION_OPPORTUNITIES_SUCCESS: 'analytics/fetchOptimizationOpportunitiesSuccess',
  FETCH_OPTIMIZATION_OPPORTUNITIES_FAILURE: 'analytics/fetchOptimizationOpportunitiesFailure',

  // Chart formatting action types
  FORMAT_OPTIMIZATION_SAVINGS_CHART: 'analytics/formatOptimizationSavingsChart',
  FORMAT_RATE_COMPARISON_CHART: 'analytics/formatRateComparisonChart',
  FORMAT_ONTIME_PERFORMANCE_CHART: 'analytics/formatOnTimePerformanceChart',

  // Cache management
  CLEAR_ANALYTICS_CACHE: 'analytics/clearAnalyticsCache'
};

/**
 * Action creator to fetch optimization savings metrics with optional filters
 * @param filter Optional metrics filter parameters
 */
export const fetchOptimizationSavings = createAction<ShipperMetricsFilter | undefined>(
  ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_SAVINGS_REQUEST
);

/**
 * Action creator for successful retrieval of optimization savings metrics
 * @param payload The optimization savings metrics data
 */
export const fetchOptimizationSavingsSuccess = createAction<OptimizationSavingsMetrics>(
  ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_SAVINGS_SUCCESS
);

/**
 * Action creator for failed retrieval of optimization savings metrics
 * @param error The error that occurred during the request
 */
export const fetchOptimizationSavingsFailure = createAction<Error>(
  ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_SAVINGS_FAILURE
);

/**
 * Action creator to fetch carrier performance metrics with optional filters
 * @param filter Optional metrics filter parameters
 */
export const fetchCarrierPerformance = createAction<ShipperMetricsFilter | undefined>(
  ANALYTICS_ACTION_TYPES.FETCH_CARRIER_PERFORMANCE_REQUEST
);

/**
 * Action creator for successful retrieval of carrier performance metrics
 * @param payload The carrier performance metrics data
 */
export const fetchCarrierPerformanceSuccess = createAction<CarrierPerformanceMetrics>(
  ANALYTICS_ACTION_TYPES.FETCH_CARRIER_PERFORMANCE_SUCCESS
);

/**
 * Action creator for failed retrieval of carrier performance metrics
 * @param error The error that occurred during the request
 */
export const fetchCarrierPerformanceFailure = createAction<Error>(
  ANALYTICS_ACTION_TYPES.FETCH_CARRIER_PERFORMANCE_FAILURE
);

/**
 * Action creator to fetch rate comparison metrics with optional filters
 * @param filter Optional metrics filter parameters
 */
export const fetchRateComparison = createAction<ShipperMetricsFilter | undefined>(
  ANALYTICS_ACTION_TYPES.FETCH_RATE_COMPARISON_REQUEST
);

/**
 * Action creator for successful retrieval of rate comparison metrics
 * @param payload The rate comparison metrics data
 */
export const fetchRateComparisonSuccess = createAction<RateComparisonMetrics>(
  ANALYTICS_ACTION_TYPES.FETCH_RATE_COMPARISON_SUCCESS
);

/**
 * Action creator for failed retrieval of rate comparison metrics
 * @param error The error that occurred during the request
 */
export const fetchRateComparisonFailure = createAction<Error>(
  ANALYTICS_ACTION_TYPES.FETCH_RATE_COMPARISON_FAILURE
);

/**
 * Action creator to fetch on-time performance metrics with optional filters
 * @param filter Optional metrics filter parameters
 */
export const fetchOnTimePerformance = createAction<ShipperMetricsFilter | undefined>(
  ANALYTICS_ACTION_TYPES.FETCH_ONTIME_PERFORMANCE_REQUEST
);

/**
 * Action creator for successful retrieval of on-time performance metrics
 * @param payload The on-time performance metrics data
 */
export const fetchOnTimePerformanceSuccess = createAction<OnTimePerformanceMetrics>(
  ANALYTICS_ACTION_TYPES.FETCH_ONTIME_PERFORMANCE_SUCCESS
);

/**
 * Action creator for failed retrieval of on-time performance metrics
 * @param error The error that occurred during the request
 */
export const fetchOnTimePerformanceFailure = createAction<Error>(
  ANALYTICS_ACTION_TYPES.FETCH_ONTIME_PERFORMANCE_FAILURE
);

/**
 * Action creator to fetch dashboard metrics with optional filters
 * @param filter Optional metrics filter parameters
 */
export const fetchDashboardMetrics = createAction<ShipperMetricsFilter | undefined>(
  ANALYTICS_ACTION_TYPES.FETCH_DASHBOARD_METRICS_REQUEST
);

/**
 * Action creator for successful retrieval of dashboard metrics
 * @param payload The dashboard metrics data
 */
export const fetchDashboardMetricsSuccess = createAction<ShipperDashboardMetrics>(
  ANALYTICS_ACTION_TYPES.FETCH_DASHBOARD_METRICS_SUCCESS
);

/**
 * Action creator for failed retrieval of dashboard metrics
 * @param error The error that occurred during the request
 */
export const fetchDashboardMetricsFailure = createAction<Error>(
  ANALYTICS_ACTION_TYPES.FETCH_DASHBOARD_METRICS_FAILURE
);

/**
 * Action creator to fetch analytics for a specific lane (origin-destination pair)
 * @param payload Object containing origin, destination, and optional timeframe
 */
export const fetchLaneAnalytics = createAction<{
  origin: string;
  destination: string;
  timeframe?: string;
}>(
  ANALYTICS_ACTION_TYPES.FETCH_LANE_ANALYTICS_REQUEST
);

/**
 * Action creator for successful retrieval of lane analytics
 * @param payload The lane analytics data
 */
export const fetchLaneAnalyticsSuccess = createAction<LaneAnalytics>(
  ANALYTICS_ACTION_TYPES.FETCH_LANE_ANALYTICS_SUCCESS
);

/**
 * Action creator for failed retrieval of lane analytics
 * @param error The error that occurred during the request
 */
export const fetchLaneAnalyticsFailure = createAction<Error>(
  ANALYTICS_ACTION_TYPES.FETCH_LANE_ANALYTICS_FAILURE
);

/**
 * Action creator to fetch detailed analytics for a specific carrier
 * @param payload Object containing carrierId and optional timeframe
 */
export const fetchCarrierAnalytics = createAction<{
  carrierId: string;
  timeframe?: string;
}>(
  ANALYTICS_ACTION_TYPES.FETCH_CARRIER_ANALYTICS_REQUEST
);

/**
 * Action creator for successful retrieval of carrier analytics
 * @param payload The carrier analytics data
 */
export const fetchCarrierAnalyticsSuccess = createAction<CarrierAnalytics>(
  ANALYTICS_ACTION_TYPES.FETCH_CARRIER_ANALYTICS_SUCCESS
);

/**
 * Action creator for failed retrieval of carrier analytics
 * @param error The error that occurred during the request
 */
export const fetchCarrierAnalyticsFailure = createAction<Error>(
  ANALYTICS_ACTION_TYPES.FETCH_CARRIER_ANALYTICS_FAILURE
);

/**
 * Action creator to fetch optimization opportunities for the shipper
 * @param filter Optional metrics filter parameters
 */
export const fetchOptimizationOpportunities = createAction<ShipperMetricsFilter | undefined>(
  ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_OPPORTUNITIES_REQUEST
);

/**
 * Action creator for successful retrieval of optimization opportunities
 * @param payload Array of optimization opportunity objects
 */
export const fetchOptimizationOpportunitiesSuccess = createAction<OptimizationOpportunity[]>(
  ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_OPPORTUNITIES_SUCCESS
);

/**
 * Action creator for failed retrieval of optimization opportunities
 * @param error The error that occurred during the request
 */
export const fetchOptimizationOpportunitiesFailure = createAction<Error>(
  ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_OPPORTUNITIES_FAILURE
);

/**
 * Action creator to format optimization savings data for chart display
 * @param payload The optimization savings metrics to format
 */
export const formatOptimizationSavingsChart = createAction<OptimizationSavingsMetrics>(
  ANALYTICS_ACTION_TYPES.FORMAT_OPTIMIZATION_SAVINGS_CHART
);

/**
 * Action creator to format rate comparison data for chart display
 * @param payload The rate comparison metrics to format
 */
export const formatRateComparisonChart = createAction<RateComparisonMetrics>(
  ANALYTICS_ACTION_TYPES.FORMAT_RATE_COMPARISON_CHART
);

/**
 * Action creator to format on-time performance data for chart display
 * @param payload The on-time performance metrics to format
 */
export const formatOnTimePerformanceChart = createAction<OnTimePerformanceMetrics>(
  ANALYTICS_ACTION_TYPES.FORMAT_ONTIME_PERFORMANCE_CHART
);

/**
 * Action creator to clear cached analytics data when needed
 * (e.g., after changing filters or when forcing a refresh)
 */
export const clearAnalyticsCache = createAction(
  ANALYTICS_ACTION_TYPES.CLEAR_ANALYTICS_CACHE
);