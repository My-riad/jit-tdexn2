import { takeLatest, call, put, all, fork } from 'redux-saga/effects'; // ^1.1.3
import {
  ANALYTICS_ACTION_TYPES,
  fetchOptimizationSavingsSuccess,
  fetchOptimizationSavingsFailure,
  fetchCarrierPerformanceSuccess,
  fetchCarrierPerformanceFailure,
  fetchRateComparisonSuccess,
  fetchRateComparisonFailure,
  fetchOnTimePerformanceSuccess,
  fetchOnTimePerformanceFailure,
  fetchDashboardMetricsSuccess,
  fetchDashboardMetricsFailure,
  fetchLaneAnalyticsSuccess,
  fetchLaneAnalyticsFailure,
  fetchCarrierAnalyticsSuccess,
  fetchCarrierAnalyticsFailure,
  fetchOptimizationOpportunitiesSuccess,
  fetchOptimizationOpportunitiesFailure
} from '../actions/analyticsActions';

import {
  getOptimizationSavings,
  getCarrierPerformance,
  getRateComparison,
  getOnTimePerformance,
  getDashboardMetrics,
  getMarketInsights,
  getLoadAnalytics,
  getCustomAnalytics,
  exportAnalyticsData
} from '../../services/analyticsService';

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
 * Saga worker function that fetches optimization savings metrics from the API
 * 
 * @param action The action containing the shipper ID and optional filter parameters
 */
function* fetchOptimizationSavings(action: { 
  type: string; 
  payload: { shipperId: string; filter?: ShipperMetricsFilter }
}) {
  try {
    // Extract shipperId and filter from the action payload
    const { shipperId, filter } = action.payload;
    
    // Prepare the date range for the API call
    const dateRange = {
      startDate: filter?.startDate ? new Date(filter.startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: filter?.endDate ? new Date(filter.endDate) : new Date()
    };
    
    // Call the analytics service to get optimization savings data
    const response = yield call(getOptimizationSavings, shipperId, dateRange);
    
    // Dispatch success action with the response data
    yield put(fetchOptimizationSavingsSuccess(response));
  } catch (error) {
    // Dispatch failure action with the error
    yield put(fetchOptimizationSavingsFailure(error as Error));
  }
}

/**
 * Saga worker function that fetches carrier performance metrics from the API
 * 
 * @param action The action containing the shipper ID and optional filter parameters
 */
function* fetchCarrierPerformance(action: { 
  type: string; 
  payload: { shipperId: string; filter?: ShipperMetricsFilter }
}) {
  try {
    // Extract shipperId and filter from the action payload
    const { shipperId, filter } = action.payload;
    
    // Prepare the date range for the API call
    const dateRange = {
      startDate: filter?.startDate ? new Date(filter.startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: filter?.endDate ? new Date(filter.endDate) : new Date()
    };
    
    // Call the analytics service to get carrier performance data
    const response = yield call(getCarrierPerformance, shipperId, dateRange);
    
    // Dispatch success action with the response data
    yield put(fetchCarrierPerformanceSuccess(response));
  } catch (error) {
    // Dispatch failure action with the error
    yield put(fetchCarrierPerformanceFailure(error as Error));
  }
}

/**
 * Saga worker function that fetches rate comparison data from the API
 * 
 * @param action The action containing the shipper ID, optional filter parameters, and lanes
 */
function* fetchRateComparison(action: { 
  type: string; 
  payload: { shipperId: string; filter?: ShipperMetricsFilter; lanes?: string[] }
}) {
  try {
    // Extract shipperId, filter and lanes from the action payload
    const { shipperId, filter, lanes = [] } = action.payload;
    
    // Prepare the date range for the API call
    const dateRange = {
      startDate: filter?.startDate ? new Date(filter.startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: filter?.endDate ? new Date(filter.endDate) : new Date()
    };
    
    // Call the analytics service to get rate comparison data
    const response = yield call(getRateComparison, shipperId, dateRange, lanes);
    
    // Dispatch success action with the response data
    yield put(fetchRateComparisonSuccess(response));
  } catch (error) {
    // Dispatch failure action with the error
    yield put(fetchRateComparisonFailure(error as Error));
  }
}

/**
 * Saga worker function that fetches on-time performance metrics from the API
 * 
 * @param action The action containing the shipper ID and optional filter parameters
 */
function* fetchOnTimePerformance(action: { 
  type: string; 
  payload: { shipperId: string; filter?: ShipperMetricsFilter }
}) {
  try {
    // Extract shipperId and filter from the action payload
    const { shipperId, filter } = action.payload;
    
    // Prepare the date range for the API call
    const dateRange = {
      startDate: filter?.startDate ? new Date(filter.startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: filter?.endDate ? new Date(filter.endDate) : new Date()
    };
    
    // Call the analytics service to get on-time performance data
    const response = yield call(getOnTimePerformance, shipperId, dateRange);
    
    // Dispatch success action with the response data
    yield put(fetchOnTimePerformanceSuccess(response));
  } catch (error) {
    // Dispatch failure action with the error
    yield put(fetchOnTimePerformanceFailure(error as Error));
  }
}

/**
 * Saga worker function that fetches dashboard summary metrics from the API
 * 
 * @param action The action containing the shipper ID
 */
function* fetchDashboardMetrics(action: { type: string; payload: { shipperId: string } }) {
  try {
    // Extract shipperId from the action payload
    const { shipperId } = action.payload;
    
    // Call the analytics service to get dashboard metrics
    const response = yield call(getDashboardMetrics, shipperId);
    
    // Dispatch success action with the response data
    yield put(fetchDashboardMetricsSuccess(response));
  } catch (error) {
    // Dispatch failure action with the error
    yield put(fetchDashboardMetricsFailure(error as Error));
  }
}

/**
 * Saga worker function that fetches analytics for a specific shipping lane
 * 
 * @param action The action containing the shipper ID, origin, destination, and optional filter
 */
function* fetchLaneAnalytics(action: { 
  type: string; 
  payload: { 
    shipperId: string; 
    origin: string; 
    destination: string; 
    filter?: ShipperMetricsFilter 
  }
}) {
  try {
    // Extract shipperId, origin, destination and filter from the action payload
    const { shipperId, origin, destination, filter } = action.payload;
    
    // Prepare params for the API call
    const params = {
      startDate: filter?.startDate ? new Date(filter.startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: filter?.endDate ? new Date(filter.endDate) : new Date(),
      origins: [origin],
      destinations: [destination],
      groupBy: filter?.groupBy || 'week' as 'day' | 'week' | 'month'
    };
    
    // Call the analytics service to get lane analytics data
    const response = yield call(getLoadAnalytics, shipperId, params);
    
    // Dispatch success action with the response data
    yield put(fetchLaneAnalyticsSuccess(response as unknown as LaneAnalytics));
  } catch (error) {
    // Dispatch failure action with the error
    yield put(fetchLaneAnalyticsFailure(error as Error));
  }
}

/**
 * Saga worker function that fetches detailed analytics for a specific carrier
 * 
 * @param action The action containing the shipper ID, carrier ID, and optional filter
 */
function* fetchCarrierAnalytics(action: { 
  type: string; 
  payload: { 
    shipperId: string; 
    carrierId: string; 
    filter?: ShipperMetricsFilter 
  }
}) {
  try {
    // Extract shipperId, carrierId and filter from the action payload
    const { shipperId, carrierId, filter } = action.payload;
    
    // Define a custom query for carrier analytics
    const queryDefinition = {
      query: "CARRIER_ANALYTICS",
      parameters: {
        shipperId,
        carrierId,
        startDate: filter?.startDate ? new Date(filter.startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: filter?.endDate ? new Date(filter.endDate) : new Date(),
      }
    };
    
    // Call the analytics service with the custom query
    const response = yield call(getCustomAnalytics, queryDefinition);
    
    // Dispatch success action with the response data
    yield put(fetchCarrierAnalyticsSuccess(response as CarrierAnalytics));
  } catch (error) {
    // Dispatch failure action with the error
    yield put(fetchCarrierAnalyticsFailure(error as Error));
  }
}

/**
 * Saga worker function that fetches optimization opportunities for the shipper
 * 
 * @param action The action containing the shipper ID
 */
function* fetchOptimizationOpportunities(action: { type: string; payload: { shipperId: string } }) {
  try {
    // Extract shipperId from the action payload
    const { shipperId } = action.payload;
    
    // Call the analytics service to get market insights with opportunities
    const response = yield call(getMarketInsights, shipperId);
    
    // Extract the opportunities from the response
    const opportunities = response.opportunities.map((opportunity) => ({
      description: opportunity.description,
      potentialSavings: opportunity.potentialSavings
    })) as OptimizationOpportunity[];
    
    // Dispatch success action with the opportunities data
    yield put(fetchOptimizationOpportunitiesSuccess(opportunities));
  } catch (error) {
    // Dispatch failure action with the error
    yield put(fetchOptimizationOpportunitiesFailure(error as Error));
  }
}

/**
 * Saga worker function that formats optimization savings data for chart visualization
 * 
 * @param action The action containing the optimization savings data to format
 */
function* formatOptimizationSavingsChart(action: { type: string; payload: OptimizationSavingsMetrics }) {
  try {
    const { payload } = action;
    
    // Transform the trend data into the format expected by chart components
    const chartData = payload.trend.map(dataPoint => ({
      date: new Date(dataPoint.date).toLocaleDateString(),
      savings: dataPoint.savings,
      tooltipContent: `$${dataPoint.savings.toLocaleString()} saved on ${new Date(dataPoint.date).toLocaleDateString()}`
    }));
    
    // Return the formatted data (this would typically be handled by the Redux store)
    return chartData;
  } catch (error) {
    console.error("Error formatting optimization savings chart data:", error);
    return [];
  }
}

/**
 * Saga worker function that formats rate comparison data for chart visualization
 * 
 * @param action The action containing the rate comparison data to format
 */
function* formatRateComparisonChart(action: { type: string; payload: RateComparisonMetrics }) {
  try {
    const { payload } = action;
    
    // Transform the lane-by-lane data into the format expected by chart components
    const chartData = payload.byLane.map(lane => ({
      lane: `${lane.origin} → ${lane.destination}`,
      actual: lane.actual,
      market: lane.market,
      savings: lane.savings,
      savingsPercentage: lane.savingsPercentage,
      tooltipContent: `Saved ${lane.savingsPercentage.toFixed(1)}% ($${lane.savings.toLocaleString()})`
    }));
    
    // Return the formatted data (this would typically be handled by the Redux store)
    return chartData;
  } catch (error) {
    console.error("Error formatting rate comparison chart data:", error);
    return [];
  }
}

/**
 * Saga worker function that formats on-time performance data for chart visualization
 * 
 * @param action The action containing the on-time performance data to format
 */
function* formatOnTimePerformanceChart(action: { type: string; payload: OnTimePerformanceMetrics }) {
  try {
    const { payload } = action;
    
    // Transform the carrier data into the format expected by chart components
    const chartData = payload.byCarrier.map(carrier => ({
      carrier: carrier.name,
      onTimeRate: carrier.onTimeRate * 100, // Convert to percentage
      earlyRate: carrier.earlyRate * 100, // Convert to percentage
      lateRate: carrier.lateRate * 100, // Convert to percentage
      tooltipContent: `On-time: ${(carrier.onTimeRate * 100).toFixed(1)}%, Early: ${(carrier.earlyRate * 100).toFixed(1)}%, Late: ${(carrier.lateRate * 100).toFixed(1)}%`
    }));
    
    // Return the formatted data (this would typically be handled by the Redux store)
    return chartData;
  } catch (error) {
    console.error("Error formatting on-time performance chart data:", error);
    return [];
  }
}

/**
 * Watcher saga for analytics-related actions
 */
function* watchAnalytics() {
  yield all([
    takeLatest(ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_SAVINGS_REQUEST, fetchOptimizationSavings),
    takeLatest(ANALYTICS_ACTION_TYPES.FETCH_CARRIER_PERFORMANCE_REQUEST, fetchCarrierPerformance),
    takeLatest(ANALYTICS_ACTION_TYPES.FETCH_RATE_COMPARISON_REQUEST, fetchRateComparison),
    takeLatest(ANALYTICS_ACTION_TYPES.FETCH_ONTIME_PERFORMANCE_REQUEST, fetchOnTimePerformance),
    takeLatest(ANALYTICS_ACTION_TYPES.FETCH_DASHBOARD_METRICS_REQUEST, fetchDashboardMetrics),
    takeLatest(ANALYTICS_ACTION_TYPES.FETCH_LANE_ANALYTICS_REQUEST, fetchLaneAnalytics),
    takeLatest(ANALYTICS_ACTION_TYPES.FETCH_CARRIER_ANALYTICS_REQUEST, fetchCarrierAnalytics),
    takeLatest(ANALYTICS_ACTION_TYPES.FETCH_OPTIMIZATION_OPPORTUNITIES_REQUEST, fetchOptimizationOpportunities),
    takeLatest(ANALYTICS_ACTION_TYPES.FORMAT_OPTIMIZATION_SAVINGS_CHART, formatOptimizationSavingsChart),
    takeLatest(ANALYTICS_ACTION_TYPES.FORMAT_RATE_COMPARISON_CHART, formatRateComparisonChart),
    takeLatest(ANALYTICS_ACTION_TYPES.FORMAT_ONTIME_PERFORMANCE_CHART, formatOnTimePerformanceChart),
  ]);
}

export default watchAnalytics;