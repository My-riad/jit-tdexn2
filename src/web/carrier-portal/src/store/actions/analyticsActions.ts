import { PayloadAction } from '@reduxjs/toolkit';
import { AnalyticsFilter } from '../../../common/interfaces';

// Action Types
// Efficiency Metrics
export const FETCH_EFFICIENCY_METRICS_REQUEST = 'analytics/FETCH_EFFICIENCY_METRICS_REQUEST';
export const FETCH_EFFICIENCY_METRICS_SUCCESS = 'analytics/FETCH_EFFICIENCY_METRICS_SUCCESS';
export const FETCH_EFFICIENCY_METRICS_FAILURE = 'analytics/FETCH_EFFICIENCY_METRICS_FAILURE';

// Financial Metrics
export const FETCH_FINANCIAL_METRICS_REQUEST = 'analytics/FETCH_FINANCIAL_METRICS_REQUEST';
export const FETCH_FINANCIAL_METRICS_SUCCESS = 'analytics/FETCH_FINANCIAL_METRICS_SUCCESS';
export const FETCH_FINANCIAL_METRICS_FAILURE = 'analytics/FETCH_FINANCIAL_METRICS_FAILURE';

// Operational Metrics
export const FETCH_OPERATIONAL_METRICS_REQUEST = 'analytics/FETCH_OPERATIONAL_METRICS_REQUEST';
export const FETCH_OPERATIONAL_METRICS_SUCCESS = 'analytics/FETCH_OPERATIONAL_METRICS_SUCCESS';
export const FETCH_OPERATIONAL_METRICS_FAILURE = 'analytics/FETCH_OPERATIONAL_METRICS_FAILURE';

// Driver Performance Metrics
export const FETCH_DRIVER_PERFORMANCE_METRICS_REQUEST = 'analytics/FETCH_DRIVER_PERFORMANCE_METRICS_REQUEST';
export const FETCH_DRIVER_PERFORMANCE_METRICS_SUCCESS = 'analytics/FETCH_DRIVER_PERFORMANCE_METRICS_SUCCESS';
export const FETCH_DRIVER_PERFORMANCE_METRICS_FAILURE = 'analytics/FETCH_DRIVER_PERFORMANCE_METRICS_FAILURE';

// Dashboard Metrics
export const FETCH_DASHBOARD_METRICS_REQUEST = 'analytics/FETCH_DASHBOARD_METRICS_REQUEST';
export const FETCH_DASHBOARD_METRICS_SUCCESS = 'analytics/FETCH_DASHBOARD_METRICS_SUCCESS';
export const FETCH_DASHBOARD_METRICS_FAILURE = 'analytics/FETCH_DASHBOARD_METRICS_FAILURE';

// Empty Miles Chart
export const FETCH_EMPTY_MILES_CHART_REQUEST = 'analytics/FETCH_EMPTY_MILES_CHART_REQUEST';
export const FETCH_EMPTY_MILES_CHART_SUCCESS = 'analytics/FETCH_EMPTY_MILES_CHART_SUCCESS';
export const FETCH_EMPTY_MILES_CHART_FAILURE = 'analytics/FETCH_EMPTY_MILES_CHART_FAILURE';

// Network Contribution Chart
export const FETCH_NETWORK_CONTRIBUTION_CHART_REQUEST = 'analytics/FETCH_NETWORK_CONTRIBUTION_CHART_REQUEST';
export const FETCH_NETWORK_CONTRIBUTION_CHART_SUCCESS = 'analytics/FETCH_NETWORK_CONTRIBUTION_CHART_SUCCESS';
export const FETCH_NETWORK_CONTRIBUTION_CHART_FAILURE = 'analytics/FETCH_NETWORK_CONTRIBUTION_CHART_FAILURE';

// Smart Hub Usage Chart
export const FETCH_SMART_HUB_USAGE_CHART_REQUEST = 'analytics/FETCH_SMART_HUB_USAGE_CHART_REQUEST';
export const FETCH_SMART_HUB_USAGE_CHART_SUCCESS = 'analytics/FETCH_SMART_HUB_USAGE_CHART_SUCCESS';
export const FETCH_SMART_HUB_USAGE_CHART_FAILURE = 'analytics/FETCH_SMART_HUB_USAGE_CHART_FAILURE';

// Driver Efficiency Chart
export const FETCH_DRIVER_EFFICIENCY_CHART_REQUEST = 'analytics/FETCH_DRIVER_EFFICIENCY_CHART_REQUEST';
export const FETCH_DRIVER_EFFICIENCY_CHART_SUCCESS = 'analytics/FETCH_DRIVER_EFFICIENCY_CHART_SUCCESS';
export const FETCH_DRIVER_EFFICIENCY_CHART_FAILURE = 'analytics/FETCH_DRIVER_EFFICIENCY_CHART_FAILURE';

// Key Metrics Summary
export const FETCH_KEY_METRICS_SUMMARY_REQUEST = 'analytics/FETCH_KEY_METRICS_SUMMARY_REQUEST';
export const FETCH_KEY_METRICS_SUMMARY_SUCCESS = 'analytics/FETCH_KEY_METRICS_SUMMARY_SUCCESS';
export const FETCH_KEY_METRICS_SUMMARY_FAILURE = 'analytics/FETCH_KEY_METRICS_SUMMARY_FAILURE';

// Export Analytics Report
export const EXPORT_ANALYTICS_REPORT_REQUEST = 'analytics/EXPORT_ANALYTICS_REPORT_REQUEST';
export const EXPORT_ANALYTICS_REPORT_SUCCESS = 'analytics/EXPORT_ANALYTICS_REPORT_SUCCESS';
export const EXPORT_ANALYTICS_REPORT_FAILURE = 'analytics/EXPORT_ANALYTICS_REPORT_FAILURE';

// Action Creators
// Efficiency Metrics
export const fetchEfficiencyMetrics = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_EFFICIENCY_METRICS_REQUEST,
  payload: filters
});

export const fetchEfficiencyMetricsSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_EFFICIENCY_METRICS_SUCCESS,
  payload: data
});

export const fetchEfficiencyMetricsFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_EFFICIENCY_METRICS_FAILURE,
  payload: error
});

// Financial Metrics
export const fetchFinancialMetrics = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_FINANCIAL_METRICS_REQUEST,
  payload: filters
});

export const fetchFinancialMetricsSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_FINANCIAL_METRICS_SUCCESS,
  payload: data
});

export const fetchFinancialMetricsFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_FINANCIAL_METRICS_FAILURE,
  payload: error
});

// Operational Metrics
export const fetchOperationalMetrics = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_OPERATIONAL_METRICS_REQUEST,
  payload: filters
});

export const fetchOperationalMetricsSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_OPERATIONAL_METRICS_SUCCESS,
  payload: data
});

export const fetchOperationalMetricsFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_OPERATIONAL_METRICS_FAILURE,
  payload: error
});

// Driver Performance Metrics
export const fetchDriverPerformanceMetrics = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_DRIVER_PERFORMANCE_METRICS_REQUEST,
  payload: filters
});

export const fetchDriverPerformanceMetricsSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_DRIVER_PERFORMANCE_METRICS_SUCCESS,
  payload: data
});

export const fetchDriverPerformanceMetricsFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_DRIVER_PERFORMANCE_METRICS_FAILURE,
  payload: error
});

// Dashboard Metrics
export const fetchDashboardMetrics = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_DASHBOARD_METRICS_REQUEST,
  payload: filters
});

export const fetchDashboardMetricsSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_DASHBOARD_METRICS_SUCCESS,
  payload: data
});

export const fetchDashboardMetricsFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_DASHBOARD_METRICS_FAILURE,
  payload: error
});

// Empty Miles Chart
export const fetchEmptyMilesChart = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_EMPTY_MILES_CHART_REQUEST,
  payload: filters
});

export const fetchEmptyMilesChartSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_EMPTY_MILES_CHART_SUCCESS,
  payload: data
});

export const fetchEmptyMilesChartFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_EMPTY_MILES_CHART_FAILURE,
  payload: error
});

// Network Contribution Chart
export const fetchNetworkContributionChart = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_NETWORK_CONTRIBUTION_CHART_REQUEST,
  payload: filters
});

export const fetchNetworkContributionChartSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_NETWORK_CONTRIBUTION_CHART_SUCCESS,
  payload: data
});

export const fetchNetworkContributionChartFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_NETWORK_CONTRIBUTION_CHART_FAILURE,
  payload: error
});

// Smart Hub Usage Chart
export const fetchSmartHubUsageChart = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_SMART_HUB_USAGE_CHART_REQUEST,
  payload: filters
});

export const fetchSmartHubUsageChartSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_SMART_HUB_USAGE_CHART_SUCCESS,
  payload: data
});

export const fetchSmartHubUsageChartFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_SMART_HUB_USAGE_CHART_FAILURE,
  payload: error
});

// Driver Efficiency Chart
export const fetchDriverEfficiencyChart = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_DRIVER_EFFICIENCY_CHART_REQUEST,
  payload: filters
});

export const fetchDriverEfficiencyChartSuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_DRIVER_EFFICIENCY_CHART_SUCCESS,
  payload: data
});

export const fetchDriverEfficiencyChartFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_DRIVER_EFFICIENCY_CHART_FAILURE,
  payload: error
});

// Key Metrics Summary
export const fetchKeyMetricsSummary = (filters: AnalyticsFilter): PayloadAction<AnalyticsFilter> => ({
  type: FETCH_KEY_METRICS_SUMMARY_REQUEST,
  payload: filters
});

export const fetchKeyMetricsSummarySuccess = (data: any): PayloadAction<any> => ({
  type: FETCH_KEY_METRICS_SUMMARY_SUCCESS,
  payload: data
});

export const fetchKeyMetricsSummaryFailure = (error: string): PayloadAction<string> => ({
  type: FETCH_KEY_METRICS_SUMMARY_FAILURE,
  payload: error
});

// Export Analytics Report
export const exportAnalyticsReport = (
  exportParams: { reportType: string, filters: AnalyticsFilter, format: string }
): PayloadAction<{ reportType: string, filters: AnalyticsFilter, format: string }> => ({
  type: EXPORT_ANALYTICS_REPORT_REQUEST,
  payload: exportParams
});

export const exportAnalyticsReportSuccess = (): PayloadAction<void> => ({
  type: EXPORT_ANALYTICS_REPORT_SUCCESS,
  payload: undefined
});

export const exportAnalyticsReportFailure = (error: string): PayloadAction<string> => ({
  type: EXPORT_ANALYTICS_REPORT_FAILURE,
  payload: error
});