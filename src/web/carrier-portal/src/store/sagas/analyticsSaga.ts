# src/web/carrier-portal/src/store/sagas/analyticsSaga.ts
```typescript
import { PayloadAction } from '@reduxjs/toolkit'; //  ^1.9.0
import { takeLatest, call, put, all, fork } from 'redux-saga/effects'; //  ^1.2.1

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
    EXPORT_ANALYTICS_REPORT_FAILURE,
  fetchEfficiencyMetricsSuccess,
  fetchEfficiencyMetricsFailure,
  fetchFinancialMetricsSuccess,
  fetchFinancialMetricsFailure,
  fetchOperationalMetricsSuccess,
  fetchOperationalMetricsFailure,
  fetchDriverPerformanceMetricsSuccess,
  fetchDriverPerformanceMetricsFailure,
  fetchDashboardMetricsSuccess,
  fetchDashboardMetricsFailure,
  fetchEmptyMilesChartSuccess,
  fetchEmptyMilesChartFailure,
  fetchNetworkContributionChartSuccess,
  fetchNetworkContributionChartFailure,
  fetchSmartHubUsageChartSuccess,
  fetchSmartHubUsageChartFailure,
  fetchDriverEfficiencyChartSuccess,
  fetchDriverEfficiencyChartFailure,
  fetchKeyMetricsSummarySuccess,
  fetchKeyMetricsSummaryFailure,
    exportAnalyticsReportSuccess,
    exportAnalyticsReportFailure,
} from '../actions/analyticsActions';
import {
  getEfficiencyMetrics,
  getFinancialMetrics,
  getOperationalMetrics,
  getDriverPerformanceMetrics,
  getDashboardMetrics,
  getEmptyMilesChart,
  getNetworkContributionChart,
  getSmartHubUsageChart,
  getDriverEfficiencyChart,
  getKeyMetricsSummary,
    exportAnalyticsReport,
} from '../../services/analyticsService';
import logger from '../../../common/utils/logger';
import { AnalyticsFilter } from '../../../common/interfaces';

/**
 * Saga for fetching efficiency metrics data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchEfficiencyMetricsSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch efficiency metrics data using getEfficiencyMetrics service with action.payload
    const data: any = yield call(getEfficiencyMetrics, action.payload);
    // LD1: If successful, dispatch fetchEfficiencyMetricsSuccess action with the response data
    yield put(fetchEfficiencyMetricsSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch efficiency metrics', { error });
    // LD1: Dispatch fetchEfficiencyMetricsFailure action with the error message
    yield put(fetchEfficiencyMetricsFailure(error.message));
  }
}

/**
 * Saga for fetching financial metrics data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchFinancialMetricsSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch financial metrics data using getFinancialMetrics service with action.payload
    const data: any = yield call(getFinancialMetrics, action.payload);
    // LD1: If successful, dispatch fetchFinancialMetricsSuccess action with the response data
    yield put(fetchFinancialMetricsSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch financial metrics', { error });
    // LD1: Dispatch fetchFinancialMetricsFailure action with the error message
    yield put(fetchFinancialMetricsFailure(error.message));
  }
}

/**
 * Saga for fetching operational metrics data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchOperationalMetricsSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch operational metrics data using getOperationalMetrics service with action.payload
    const data: any = yield call(getOperationalMetrics, action.payload);
    // LD1: If successful, dispatch fetchOperationalMetricsSuccess action with the response data
    yield put(fetchOperationalMetricsSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch operational metrics', { error });
    // LD1: Dispatch fetchOperationalMetricsFailure action with the error message
    yield put(fetchOperationalMetricsFailure(error.message));
  }
}

/**
 * Saga for fetching driver performance metrics data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchDriverPerformanceMetricsSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch driver performance metrics data using getDriverPerformanceMetrics service with action.payload
    const data: any = yield call(getDriverPerformanceMetrics, action.payload);
    // LD1: If successful, dispatch fetchDriverPerformanceMetricsSuccess action with the response data
    yield put(fetchDriverPerformanceMetricsSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch driver performance metrics', { error });
    // LD1: Dispatch fetchDriverPerformanceMetricsFailure action with the error message
    yield put(fetchDriverPerformanceMetricsFailure(error.message));
  }
}

/**
 * Saga for fetching dashboard metrics data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchDashboardMetricsSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch dashboard metrics data using getDashboardMetrics service with action.payload
    const data: any = yield call(getDashboardMetrics, action.payload);
    // LD1: If successful, dispatch fetchDashboardMetricsSuccess action with the response data
    yield put(fetchDashboardMetricsSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch dashboard metrics', { error });
    // LD1: Dispatch fetchDashboardMetricsFailure action with the error message
    yield put(fetchDashboardMetricsFailure(error.message));
  }
}

/**
 * Saga for fetching empty miles chart data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchEmptyMilesChartSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch empty miles chart data using getEmptyMilesChart service with action.payload
    const data: any = yield call(getEmptyMilesChart, action.payload);
    // LD1: If successful, dispatch fetchEmptyMilesChartSuccess action with the response data
    yield put(fetchEmptyMilesChartSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch empty miles chart', { error });
    // LD1: Dispatch fetchEmptyMilesChartFailure action with the error message
    yield put(fetchEmptyMilesChartFailure(error.message));
  }
}

/**
 * Saga for fetching network contribution chart data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchNetworkContributionChartSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch network contribution chart data using getNetworkContributionChart service with action.payload
    const data: any = yield call(getNetworkContributionChart, action.payload);
    // LD1: If successful, dispatch fetchNetworkContributionChartSuccess action with the response data
    yield put(fetchNetworkContributionChartSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch network contribution chart', { error });
    // LD1: Dispatch fetchNetworkContributionChartFailure action with the error message
    yield put(fetchNetworkContributionChartFailure(error.message));
  }
}

/**
 * Saga for fetching smart hub usage chart data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchSmartHubUsageChartSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch smart hub usage chart data using getSmartHubUsageChart service with action.payload
    const data: any = yield call(getSmartHubUsageChart, action.payload);
    // LD1: If successful, dispatch fetchSmartHubUsageChartSuccess action with the response data
    yield put(fetchSmartHubUsageChartSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch smart hub usage chart', { error });
    // LD1: Dispatch fetchSmartHubUsageChartFailure action with the error message
    yield put(fetchSmartHubUsageChartFailure(error.message));
  }
}

/**
 * Saga for fetching driver efficiency chart data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchDriverEfficiencyChartSaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch driver efficiency chart data using getDriverEfficiencyChart service with action.payload
    const data: any = yield call(getDriverEfficiencyChart, action.payload);
    // LD1: If successful, dispatch fetchDriverEfficiencyChartSuccess action with the response data
    yield put(fetchDriverEfficiencyChartSuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch driver efficiency chart', { error });
    // LD1: Dispatch fetchDriverEfficiencyChartFailure action with the error message
    yield put(fetchDriverEfficiencyChartFailure(error.message));
  }
}

/**
 * Saga for fetching key metrics summary data
 * @param {PayloadAction<AnalyticsFilter>} action - The action containing the analytics filter
 * @returns {Generator} - A saga generator function
 */
function* fetchKeyMetricsSummarySaga(action: PayloadAction<AnalyticsFilter>): Generator {
  try {
    // LD1: Try to fetch key metrics summary data using getKeyMetricsSummary service with action.payload
    const data: any = yield call(getKeyMetricsSummary, action.payload);
    // LD1: If successful, dispatch fetchKeyMetricsSummarySuccess action with the response data
    yield put(fetchKeyMetricsSummarySuccess(data));
  } catch (error: any) {
    // LD1: If an error occurs, log the error
    logger.error('Failed to fetch key metrics summary', { error });
    // LD1: Dispatch fetchKeyMetricsSummaryFailure action with the error message
    yield put(fetchKeyMetricsSummaryFailure(error.message));
  }
}

/**
 * Saga for exporting analytics report
 * @param {PayloadAction<{ reportType: string, filters: AnalyticsFilter, format: string }>} action - The action containing the report parameters
 * @returns {Generator} - A saga generator function
 */
function* exportAnalyticsReportSaga(action: PayloadAction<{ reportType: string, filters: AnalyticsFilter, format: string }>): Generator {
    try {
        // LD1: Extract reportType, filters, and format from action.payload
        const { reportType, filters, format } = action.payload;

        // LD1: Try to export analytics report using exportAnalyticsReport service with the extracted parameters
        const blob: Blob = yield call(exportAnalyticsReport, reportType, filters, format);

        // LD1: If successful, create a download link for the blob data
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;

        // LD1: Trigger a download with a filename based on reportType and format
        link.setAttribute('download', `analytics_report_${reportType}.${format}`);
        document.body.appendChild(link);
        link.click();

        // LD1: Clean up the URL object
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // LD1: Dispatch exportAnalyticsReportSuccess action
        yield put(exportAnalyticsReportSuccess());
    } catch (error: any) {
        // LD1: If an error occurs, log the error
        logger.error('Failed to export analytics report', { error });
        // LD1: Dispatch exportAnalyticsReportFailure action with the error message
        yield put(exportAnalyticsReportFailure(error.message));
    }
}

/**
 * Watcher saga for efficiency metrics fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchEfficiencyMetrics(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_EFFICIENCY_METRICS_REQUEST actions
  // LD1: When action is dispatched, call fetchEfficiencyMetricsSaga with the action
  yield takeLatest(FETCH_EFFICIENCY_METRICS_REQUEST, fetchEfficiencyMetricsSaga);
}

/**
 * Watcher saga for financial metrics fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchFinancialMetrics(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_FINANCIAL_METRICS_REQUEST actions
  // LD1: When action is dispatched, call fetchFinancialMetricsSaga with the action
  yield takeLatest(FETCH_FINANCIAL_METRICS_REQUEST, fetchFinancialMetricsSaga);
}

/**
 * Watcher saga for operational metrics fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchOperationalMetrics(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_OPERATIONAL_METRICS_REQUEST actions
  // LD1: When action is dispatched, call fetchOperationalMetricsSaga with the action
  yield takeLatest(FETCH_OPERATIONAL_METRICS_REQUEST, fetchOperationalMetricsSaga);
}

/**
 * Watcher saga for driver performance metrics fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchDriverPerformanceMetrics(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_DRIVER_PERFORMANCE_METRICS_REQUEST actions
  // LD1: When action is dispatched, call fetchDriverPerformanceMetricsSaga with the action
  yield takeLatest(FETCH_DRIVER_PERFORMANCE_METRICS_REQUEST, fetchDriverPerformanceMetricsSaga);
}

/**
 * Watcher saga for dashboard metrics fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchDashboardMetrics(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_DASHBOARD_METRICS_REQUEST actions
  // LD1: When action is dispatched, call fetchDashboardMetricsSaga with the action
  yield takeLatest(FETCH_DASHBOARD_METRICS_REQUEST, fetchDashboardMetricsSaga);
}

/**
 * Watcher saga for empty miles chart fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchEmptyMilesChart(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_EMPTY_MILES_CHART_REQUEST actions
  // LD1: When action is dispatched, call fetchEmptyMilesChartSaga with the action
  yield takeLatest(FETCH_EMPTY_MILES_CHART_REQUEST, fetchEmptyMilesChartSaga);
}

/**
 * Watcher saga for network contribution chart fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchNetworkContributionChart(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_NETWORK_CONTRIBUTION_CHART_REQUEST actions
  // LD1: When action is dispatched, call fetchNetworkContributionChartSaga with the action
  yield takeLatest(FETCH_NETWORK_CONTRIBUTION_CHART_REQUEST, fetchNetworkContributionChartSaga);
}

/**
 * Watcher saga for smart hub usage chart fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchSmartHubUsageChart(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_SMART_HUB_USAGE_CHART_REQUEST actions
  // LD1: When action is dispatched, call fetchSmartHubUsageChartSaga with the action
  yield takeLatest(FETCH_SMART_HUB_USAGE_CHART_REQUEST, fetchSmartHubUsageChartSaga);
}

/**
 * Watcher saga for driver efficiency chart fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchDriverEfficiencyChart(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_DRIVER_EFFICIENCY_CHART_REQUEST actions
  // LD1: When action is dispatched, call fetchDriverEfficiencyChartSaga with the action
  yield takeLatest(FETCH_DRIVER_EFFICIENCY_CHART_REQUEST, fetchDriverEfficiencyChartSaga);
}

/**
 * Watcher saga for key metrics summary fetch requests
 * @returns {Generator} - A saga generator function
 */
function* watchFetchKeyMetricsSummary(): Generator {
  // LD1: Use takeLatest effect to watch for FETCH_KEY_METRICS_SUMMARY_REQUEST actions
  // LD1: When action is dispatched, call fetchKeyMetricsSummarySaga with the action
  yield takeLatest(FETCH_KEY_METRICS_SUMMARY_REQUEST, fetchKeyMetricsSummarySaga);
}

/**
 * Watcher saga for analytics report export requests
 * @returns {Generator} - A saga generator function
 */
function* watchExportAnalyticsReport(): Generator {
    // LD1: Use takeLatest effect to watch for EXPORT_ANALYTICS_REPORT_REQUEST actions
    // LD1: When action is dispatched, call exportAnalyticsReportSaga with the action
    yield takeLatest(EXPORT_ANALYTICS_REPORT_REQUEST, exportAnalyticsReportSaga);
}

/**
 * Root saga that combines all analytics-related sagas
 * @returns {Generator} - A saga generator function
 */
export default function* analyticsSagas(): Generator {
  // LD1: Use all effect to combine and fork all analytics watcher sagas:
  yield all([
    // LD1: fork(watchFetchEfficiencyMetrics)
    fork(watchFetchEfficiencyMetrics),
    // LD1: fork(watchFetchFinancialMetrics)
    fork(watchFetchFinancialMetrics),
    // LD1: fork(watchFetchOperationalMetrics)
    fork(watchFetchOperationalMetrics),
    // LD1: fork(watchFetchDriverPerformanceMetrics)
    fork(watchFetchDriverPerformanceMetrics),
    // LD1: fork(watchFetchDashboardMetrics)
    fork(watchFetchDashboardMetrics),
    // LD1: fork(watchFetchEmptyMilesChart)
    fork(watchFetchEmptyMilesChart),
    // LD1: fork(watchFetchNetworkContributionChart)
    fork(watchFetchNetworkContributionChart),
    // LD1: fork(watchFetchSmartHubUsageChart)
    fork(watchFetchSmartHubUsageChart),
    // LD1: fork(watchFetchDriverEfficiencyChart)
    fork(watchFetchDriverEfficiencyChart),
    // LD1: fork(watchFetchKeyMetricsSummary)
    fork(watchFetchKeyMetricsSummary),
      // LD1: fork(watchExportAnalyticsReport)
      fork(watchExportAnalyticsReport),
  ]);
}