import { createReducer, PayloadAction } from '@reduxjs/toolkit';
import { AnalyticsFilter } from '../../../common/interfaces';
import {
  FETCH_EFFICIENCY_METRICS_REQUEST,
  FETCH_EFFICIENCY_METRICS_SUCCESS,
  FETCH_EFFICIENCY_METRICS_FAILURE,
  FETCH_FINANCIAL_METRICS_REQUEST,
  FETCH_FINANCIAL_METRICS_SUCCESS,
  FETCH_FINANCIAL_METRICS_FAILURE,
  FETCH_OPERATIONAL_METRICS_REQUEST,
  FETCH_OPERATIONAL_METRICS_SUCCESS,
  FETCH_OPERATIONAL_METRICS_FAILURE,
  FETCH_DRIVER_PERFORMANCE_METRICS_REQUEST,
  FETCH_DRIVER_PERFORMANCE_METRICS_SUCCESS,
  FETCH_DRIVER_PERFORMANCE_METRICS_FAILURE,
  FETCH_DASHBOARD_METRICS_REQUEST,
  FETCH_DASHBOARD_METRICS_SUCCESS,
  FETCH_DASHBOARD_METRICS_FAILURE,
  FETCH_EMPTY_MILES_CHART_REQUEST,
  FETCH_EMPTY_MILES_CHART_SUCCESS,
  FETCH_EMPTY_MILES_CHART_FAILURE,
  FETCH_NETWORK_CONTRIBUTION_CHART_REQUEST,
  FETCH_NETWORK_CONTRIBUTION_CHART_SUCCESS,
  FETCH_NETWORK_CONTRIBUTION_CHART_FAILURE,
  FETCH_SMART_HUB_USAGE_CHART_REQUEST,
  FETCH_SMART_HUB_USAGE_CHART_SUCCESS,
  FETCH_SMART_HUB_USAGE_CHART_FAILURE,
  FETCH_DRIVER_EFFICIENCY_CHART_REQUEST,
  FETCH_DRIVER_EFFICIENCY_CHART_SUCCESS,
  FETCH_DRIVER_EFFICIENCY_CHART_FAILURE,
  FETCH_KEY_METRICS_SUMMARY_REQUEST,
  FETCH_KEY_METRICS_SUMMARY_SUCCESS,
  FETCH_KEY_METRICS_SUMMARY_FAILURE,
  EXPORT_ANALYTICS_REPORT_REQUEST,
  EXPORT_ANALYTICS_REPORT_SUCCESS,
  EXPORT_ANALYTICS_REPORT_FAILURE
} from '../actions/analyticsActions';

/**
 * Interface defining the shape of the analytics state
 */
interface AnalyticsState {
  /**
   * Flag indicating if any analytics data is currently being loaded
   */
  loading: boolean;
  
  /**
   * Error message if any analytics request has failed, null otherwise
   */
  error: string | null;
  
  /**
   * Efficiency metrics data including fleet score, empty miles percentage, and utilization
   */
  efficiencyMetrics: any | null;
  
  /**
   * Financial metrics data including revenue, costs, and profitability
   */
  financialMetrics: any | null;
  
  /**
   * Operational metrics data including on-time performance and load fulfillment
   */
  operationalMetrics: any | null;
  
  /**
   * Driver performance metrics data including efficiency scores and compliance
   */
  driverPerformanceMetrics: any | null;
  
  /**
   * Summary metrics for the dashboard view
   */
  dashboardMetrics: any | null;
  
  /**
   * Chart data for empty miles visualization
   */
  emptyMilesChart: any | null;
  
  /**
   * Chart data for network contribution visualization
   */
  networkContributionChart: any | null;
  
  /**
   * Chart data for smart hub usage visualization
   */
  smartHubUsageChart: any | null;
  
  /**
   * Chart data for driver efficiency visualization
   */
  driverEfficiencyChart: any | null;
  
  /**
   * Summary of key metrics for the analytics dashboard
   */
  keyMetricsSummary: any | null;
  
  /**
   * Flag indicating if a report export is in progress
   */
  exportingReport: boolean;
  
  /**
   * Error message if a report export has failed, null otherwise
   */
  exportError: string | null;
}

/**
 * Initial state for the analytics reducer
 */
const initialState: AnalyticsState = {
  loading: false,
  error: null,
  efficiencyMetrics: null,
  financialMetrics: null,
  operationalMetrics: null,
  driverPerformanceMetrics: null,
  dashboardMetrics: null,
  emptyMilesChart: null,
  networkContributionChart: null,
  smartHubUsageChart: null,
  driverEfficiencyChart: null,
  keyMetricsSummary: null,
  exportingReport: false,
  exportError: null
};

/**
 * Analytics reducer that handles all analytics-related state updates
 * including efficiency metrics, financial data, operational statistics,
 * and various chart data for the carrier portal dashboard
 */
const analyticsReducer = createReducer(initialState, (builder) => {
  builder
    // Efficiency Metrics
    .addCase(FETCH_EFFICIENCY_METRICS_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_EFFICIENCY_METRICS_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.efficiencyMetrics = action.payload;
    })
    .addCase(FETCH_EFFICIENCY_METRICS_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Financial Metrics
    .addCase(FETCH_FINANCIAL_METRICS_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_FINANCIAL_METRICS_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.financialMetrics = action.payload;
    })
    .addCase(FETCH_FINANCIAL_METRICS_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Operational Metrics
    .addCase(FETCH_OPERATIONAL_METRICS_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_OPERATIONAL_METRICS_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.operationalMetrics = action.payload;
    })
    .addCase(FETCH_OPERATIONAL_METRICS_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Driver Performance Metrics
    .addCase(FETCH_DRIVER_PERFORMANCE_METRICS_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_DRIVER_PERFORMANCE_METRICS_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.driverPerformanceMetrics = action.payload;
    })
    .addCase(FETCH_DRIVER_PERFORMANCE_METRICS_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Dashboard Metrics
    .addCase(FETCH_DASHBOARD_METRICS_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_DASHBOARD_METRICS_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.dashboardMetrics = action.payload;
    })
    .addCase(FETCH_DASHBOARD_METRICS_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Empty Miles Chart
    .addCase(FETCH_EMPTY_MILES_CHART_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_EMPTY_MILES_CHART_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.emptyMilesChart = action.payload;
    })
    .addCase(FETCH_EMPTY_MILES_CHART_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Network Contribution Chart
    .addCase(FETCH_NETWORK_CONTRIBUTION_CHART_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_NETWORK_CONTRIBUTION_CHART_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.networkContributionChart = action.payload;
    })
    .addCase(FETCH_NETWORK_CONTRIBUTION_CHART_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Smart Hub Usage Chart
    .addCase(FETCH_SMART_HUB_USAGE_CHART_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_SMART_HUB_USAGE_CHART_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.smartHubUsageChart = action.payload;
    })
    .addCase(FETCH_SMART_HUB_USAGE_CHART_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Driver Efficiency Chart
    .addCase(FETCH_DRIVER_EFFICIENCY_CHART_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_DRIVER_EFFICIENCY_CHART_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.driverEfficiencyChart = action.payload;
    })
    .addCase(FETCH_DRIVER_EFFICIENCY_CHART_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Key Metrics Summary
    .addCase(FETCH_KEY_METRICS_SUMMARY_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FETCH_KEY_METRICS_SUMMARY_SUCCESS, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.keyMetricsSummary = action.payload;
    })
    .addCase(FETCH_KEY_METRICS_SUMMARY_FAILURE, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Export Analytics Report
    .addCase(EXPORT_ANALYTICS_REPORT_REQUEST, (state) => {
      state.exportingReport = true;
      state.exportError = null;
    })
    .addCase(EXPORT_ANALYTICS_REPORT_SUCCESS, (state) => {
      state.exportingReport = false;
    })
    .addCase(EXPORT_ANALYTICS_REPORT_FAILURE, (state, action: PayloadAction<string>) => {
      state.exportingReport = false;
      state.exportError = action.payload;
    });
});

export default analyticsReducer;