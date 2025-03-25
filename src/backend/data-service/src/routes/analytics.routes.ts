import { Router } from 'express'; // express@^4.17.1
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../../common/middleware/validation.middleware';
import {
  AnalyticsController,
  createAnalyticsQuery,
  getAnalyticsQuery,
  getAnalyticsQueries,
  updateAnalyticsQuery,
  deleteAnalyticsQuery,
  executeAnalyticsQuery,
  executeQueryDefinition,
  executePredefinedQuery,
  getEfficiencyMetrics,
  getDriverMetrics,
  getFinancialMetrics,
  getOperationalMetrics,
  getDashboardMetrics,
  getNetworkEfficiencyTrend,
  getEmptyMilesReduction,
  getDriverEfficiencyDistribution,
  getSmartHubUtilization
} from '../controllers/analytics.controller';

/**
 * Configures and returns an Express router with all analytics-related routes
 * @returns Configured Express router with analytics routes
 */
function configureAnalyticsRoutes(): Router {
  // Create a new Express router instance
  const router = Router();

  // Configure routes for analytics query management (CRUD operations)
  router.post('/queries', authenticate, createAnalyticsQuery);
  router.get('/queries/:id', authenticate, getAnalyticsQuery);
  router.get('/queries', authenticate, getAnalyticsQueries);
  router.put('/queries/:id', authenticate, updateAnalyticsQuery);
  router.delete('/queries/:id', authenticate, deleteAnalyticsQuery);

  // Configure routes for query execution
  router.post('/queries/:id/execute', authenticate, executeAnalyticsQuery);
  router.post('/execute-definition', authenticate, executeQueryDefinition);
  router.get('/predefined/:name/:type', authenticate, executePredefinedQuery);

  // Configure routes for predefined metrics
  router.get('/efficiency', authenticate, getEfficiencyMetrics);
  router.get('/drivers', authenticate, getDriverMetrics);
  router.get('/financial', authenticate, getFinancialMetrics);
  router.get('/operational', authenticate, getOperationalMetrics);
  router.get('/dashboard', authenticate, getDashboardMetrics);

  // Configure routes for specialized analytics
  router.get('/network-efficiency-trend', authenticate, getNetworkEfficiencyTrend);
  router.get('/empty-miles-reduction', authenticate, getEmptyMilesReduction);
  router.get('/driver-efficiency-distribution', authenticate, getDriverEfficiencyDistribution);
  router.get('/smart-hub-utilization', authenticate, getSmartHubUtilization);

  // Return the configured router
  return router;
}

// Export the configured analytics router for use in the application
export default configureAnalyticsRoutes();