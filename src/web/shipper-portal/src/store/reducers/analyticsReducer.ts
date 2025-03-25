import { createReducer, PayloadAction } from '@reduxjs/toolkit'; // v1.9.5
import { ANALYTICS_ACTION_TYPES } from '../actions/analyticsActions';
import {
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
 * Interface defining the structure of the analytics state slice in the Redux store
 */
export interface AnalyticsState {
  // Data states
  optimizationSavings: OptimizationSavingsMetrics | null;
  carrierPerformance: CarrierPerformanceMetrics | null;
  rateComparison: RateComparisonMetrics | null;
  onTimePerformance: OnTimePerformanceMetrics | null;
  dashboardMetrics: ShipperDashboardMetrics | null;
  laneAnalytics: LaneAnalytics | null;
  carrierAnalytics: CarrierAnalytics | null;
  optimizationOpportunities: OptimizationOpportunity[] | null;
  
  // Chart data states
  optimizationSavingsChart: any | null;
  rateComparisonChart: any | null;
  onTimePerformanceChart: any | null;
  
  // Loading states
  loading: {
    optimizationSavings: boolean;
    carrierPerformance: boolean;
    rateComparison: boolean;
    onTimePerformance: boolean;
    dashboardMetrics: boolean;
    laneAnalytics: boolean;
    carrierAnalytics: boolean;
    optimizationOpportunities: boolean;
  };
  
  // Error states
  error: {
    optimizationSavings: string | null;
    carrierPerformance: string | null;
    rateComparison: string | null;
    onTimePerformance: string | null;
    dashboardMetrics: string | null;
    laneAnalytics: string | null;
    carrierAnalytics: string | null;
    optimizationOpportunities: string | null;
  };
}

/**
 * Initial state for the analytics reducer
 */
const initialState: AnalyticsState = {
  // Initialize data states as null
  optimizationSavings: null,
  carrierPerformance: null,
  rateComparison: null,
  onTimePerformance: null,
  dashboardMetrics: null,
  laneAnalytics: null,
  carrierAnalytics: null,
  optimizationOpportunities: null,
  
  // Initialize chart data states as null
  optimizationSavingsChart: null,
  rateComparisonChart: null,
  onTimePerformanceChart: null,
  
  // Initialize loading states as false
  loading: {
    optimizationSavings: false,
    carrierPerformance: false,
    rateComparison: false,
    onTimePerformance: false,
    dashboardMetrics: false,
    laneAnalytics: false,
    carrierAnalytics: false,
    optimizationOpportunities: false,
  },
  
  // Initialize error states as null
  error: {
    optimizationSavings: null,
    carrierPerformance: null,
    rateComparison: null,
    onTimePerformance: null,
    dashboardMetrics: null,
    laneAnalytics: null,
    carrierAnalytics: null,
    optimizationOpportunities: null,
  },
};

/**
 * Redux reducer for managing analytics state in the shipper portal
 */
const analyticsReducer = createReducer(initialState, (builder) => {
  builder
    // Optimization Savings Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_SAVINGS_REQUEST, (state) => {
      state.loading.optimizationSavings = true;
      state.error.optimizationSavings = null;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_SAVINGS_SUCCESS, (state, action: PayloadAction<OptimizationSavingsMetrics>) => {
      state.optimizationSavings = action.payload;
      state.loading.optimizationSavings = false;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_SAVINGS_FAILURE, (state, action: PayloadAction<Error>) => {
      state.error.optimizationSavings = action.payload.message;
      state.loading.optimizationSavings = false;
    })
    
    // Carrier Performance Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_CARRIER_PERFORMANCE_REQUEST, (state) => {
      state.loading.carrierPerformance = true;
      state.error.carrierPerformance = null;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_CARRIER_PERFORMANCE_SUCCESS, (state, action: PayloadAction<CarrierPerformanceMetrics>) => {
      state.carrierPerformance = action.payload;
      state.loading.carrierPerformance = false;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_CARRIER_PERFORMANCE_FAILURE, (state, action: PayloadAction<Error>) => {
      state.error.carrierPerformance = action.payload.message;
      state.loading.carrierPerformance = false;
    })
    
    // Rate Comparison Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_RATE_COMPARISON_REQUEST, (state) => {
      state.loading.rateComparison = true;
      state.error.rateComparison = null;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_RATE_COMPARISON_SUCCESS, (state, action: PayloadAction<RateComparisonMetrics>) => {
      state.rateComparison = action.payload;
      state.loading.rateComparison = false;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_RATE_COMPARISON_FAILURE, (state, action: PayloadAction<Error>) => {
      state.error.rateComparison = action.payload.message;
      state.loading.rateComparison = false;
    })
    
    // On-Time Performance Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_ONTIME_PERFORMANCE_REQUEST, (state) => {
      state.loading.onTimePerformance = true;
      state.error.onTimePerformance = null;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_ONTIME_PERFORMANCE_SUCCESS, (state, action: PayloadAction<OnTimePerformanceMetrics>) => {
      state.onTimePerformance = action.payload;
      state.loading.onTimePerformance = false;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_ONTIME_PERFORMANCE_FAILURE, (state, action: PayloadAction<Error>) => {
      state.error.onTimePerformance = action.payload.message;
      state.loading.onTimePerformance = false;
    })
    
    // Dashboard Metrics Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_DASHBOARD_METRICS_REQUEST, (state) => {
      state.loading.dashboardMetrics = true;
      state.error.dashboardMetrics = null;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_DASHBOARD_METRICS_SUCCESS, (state, action: PayloadAction<ShipperDashboardMetrics>) => {
      state.dashboardMetrics = action.payload;
      state.loading.dashboardMetrics = false;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_DASHBOARD_METRICS_FAILURE, (state, action: PayloadAction<Error>) => {
      state.error.dashboardMetrics = action.payload.message;
      state.loading.dashboardMetrics = false;
    })
    
    // Lane Analytics Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_LANE_ANALYTICS_REQUEST, (state) => {
      state.loading.laneAnalytics = true;
      state.error.laneAnalytics = null;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_LANE_ANALYTICS_SUCCESS, (state, action: PayloadAction<LaneAnalytics>) => {
      state.laneAnalytics = action.payload;
      state.loading.laneAnalytics = false;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_LANE_ANALYTICS_FAILURE, (state, action: PayloadAction<Error>) => {
      state.error.laneAnalytics = action.payload.message;
      state.loading.laneAnalytics = false;
    })
    
    // Carrier Analytics Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_CARRIER_ANALYTICS_REQUEST, (state) => {
      state.loading.carrierAnalytics = true;
      state.error.carrierAnalytics = null;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_CARRIER_ANALYTICS_SUCCESS, (state, action: PayloadAction<CarrierAnalytics>) => {
      state.carrierAnalytics = action.payload;
      state.loading.carrierAnalytics = false;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_CARRIER_ANALYTICS_FAILURE, (state, action: PayloadAction<Error>) => {
      state.error.carrierAnalytics = action.payload.message;
      state.loading.carrierAnalytics = false;
    })
    
    // Optimization Opportunities Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_OPPORTUNITIES_REQUEST, (state) => {
      state.loading.optimizationOpportunities = true;
      state.error.optimizationOpportunities = null;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_OPPORTUNITIES_SUCCESS, (state, action: PayloadAction<OptimizationOpportunity[]>) => {
      state.optimizationOpportunities = action.payload;
      state.loading.optimizationOpportunities = false;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_OPPORTUNITIES_FAILURE, (state, action: PayloadAction<Error>) => {
      state.error.optimizationOpportunities = action.payload.message;
      state.loading.optimizationOpportunities = false;
    })
    
    // Chart Formatting Handlers
    .addCase(ANALYTICS_ACTION_TYPES.FORMAT_OPTIMIZATION_SAVINGS_CHART, (state, action: PayloadAction<any>) => {
      state.optimizationSavingsChart = action.payload;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FORMAT_RATE_COMPARISON_CHART, (state, action: PayloadAction<any>) => {
      state.rateComparisonChart = action.payload;
    })
    .addCase(ANALYTICS_ACTION_TYPES.FORMAT_ONTIME_PERFORMANCE_CHART, (state, action: PayloadAction<any>) => {
      state.onTimePerformanceChart = action.payload;
    })
    
    // Cache Clear Handler
    .addCase(ANALYTICS_ACTION_TYPES.CLEAR_ANALYTICS_CACHE, () => {
      // Reset data states to initial values
      return initialState;
    });
});

export default analyticsReducer;