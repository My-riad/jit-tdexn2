/**
 * Driver Analytics Queries
 * 
 * This file defines a collection of predefined analytics queries related to driver metrics.
 * These queries are used for generating reports, dashboards, and analytics visualizations
 * focused on driver performance, efficiency, earnings, and operational metrics.
 * 
 * Each query follows the IAnalyticsQuery interface and includes the necessary fields,
 * filters, aggregations, and parameters to retrieve meaningful data about driver performance.
 */

import { 
  IAnalyticsQuery, 
  AnalyticsQueryType, 
  AggregationType, 
  TimeGranularity, 
  FilterOperator, 
  SortDirection 
} from '../models/analytics-query.model';
import { Driver } from '../../common/interfaces/driver.interface';

/**
 * Query for analyzing driver efficiency scores over time
 * Used to track driver performance improvements and trends
 */
const driverEfficiencyScoreQuery: IAnalyticsQuery = {
  name: 'driver_efficiency_score',
  description: 'Analyzes driver efficiency scores over time to track performance improvements',
  type: AnalyticsQueryType.DRIVER,
  collection: 'driver_scores',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'total_score', alias: 'efficiency_score' },
    { field: 'calculated_at', alias: 'date', dataType: 'date' }
  ],
  aggregations: [
    { type: AggregationType.AVG, field: 'total_score', alias: 'average_score' },
    { type: AggregationType.MAX, field: 'total_score', alias: 'max_score' },
    { type: AggregationType.MIN, field: 'total_score', alias: 'min_score' }
  ],
  groupBy: ['driver_id'],
  sort: [
    { field: 'calculated_at', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.DAY,
  parameters: {
    startDate: null,
    endDate: null,
    driverId: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Comprehensive query for driver performance metrics
 * Includes efficiency, on-time rates, and earnings
 */
const driverPerformanceMetricsQuery: IAnalyticsQuery = {
  name: 'driver_performance_metrics',
  description: 'Provides comprehensive performance metrics for drivers including efficiency, on-time rates, and earnings',
  type: AnalyticsQueryType.DRIVER,
  collection: 'driver_performance_metrics',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'loads_completed', alias: 'loads_completed' },
    { field: 'on_time_percentage', alias: 'on_time_percentage' },
    { field: 'total_miles', alias: 'total_miles' },
    { field: 'loaded_miles', alias: 'loaded_miles' },
    { field: 'empty_miles', alias: 'empty_miles' },
    { field: 'empty_miles_percentage', alias: 'empty_miles_percentage' },
    { field: 'fuel_efficiency', alias: 'fuel_efficiency' },
    { field: 'revenue_generated', alias: 'revenue_generated' },
    { field: 'revenue_per_mile', alias: 'revenue_per_mile' },
    { field: 'efficiency_score', alias: 'efficiency_score' },
    { field: 'period_start', alias: 'period_start', dataType: 'date' },
    { field: 'period_end', alias: 'period_end', dataType: 'date' }
  ],
  aggregations: [
    { type: AggregationType.AVG, field: 'efficiency_score', alias: 'average_efficiency' },
    { type: AggregationType.AVG, field: 'on_time_percentage', alias: 'average_on_time' },
    { type: AggregationType.SUM, field: 'revenue_generated', alias: 'total_revenue' },
    { type: AggregationType.AVG, field: 'empty_miles_percentage', alias: 'average_empty_miles' }
  ],
  groupBy: ['driver_id'],
  sort: [
    { field: 'efficiency_score', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {
    startDate: null,
    endDate: null,
    carrierId: null,
    minEfficiencyScore: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query for generating driver leaderboards based on efficiency scores
 * Used for gamification features and driver recognition
 */
const driverLeaderboardQuery: IAnalyticsQuery = {
  name: 'driver_leaderboard',
  description: 'Generates leaderboards of top-performing drivers based on efficiency scores',
  type: AnalyticsQueryType.DRIVER,
  collection: 'driver_scores',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'total_score', alias: 'efficiency_score' },
    { field: 'calculated_at', alias: 'date', dataType: 'date' }
  ],
  aggregations: [
    { type: AggregationType.AVG, field: 'total_score', alias: 'average_score' }
  ],
  groupBy: ['driver_id'],
  sort: [
    { field: 'average_score', direction: SortDirection.DESC }
  ],
  limit: 100,
  parameters: {
    startDate: null,
    endDate: null,
    carrierId: null,
    region: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query for analyzing driver empty miles and reduction trends
 * Critical for measuring the platform's impact on deadhead reduction
 */
const driverEmptyMilesQuery: IAnalyticsQuery = {
  name: 'driver_empty_miles',
  description: 'Analyzes driver empty miles and reduction trends over time',
  type: AnalyticsQueryType.DRIVER,
  collection: 'driver_performance_metrics',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'total_miles', alias: 'total_miles' },
    { field: 'loaded_miles', alias: 'loaded_miles' },
    { field: 'empty_miles', alias: 'empty_miles' },
    { field: 'empty_miles_percentage', alias: 'empty_miles_percentage' },
    { field: 'period_start', alias: 'period_start', dataType: 'date' },
    { field: 'period_end', alias: 'period_end', dataType: 'date' }
  ],
  aggregations: [
    { type: AggregationType.AVG, field: 'empty_miles_percentage', alias: 'average_empty_percentage' },
    { type: AggregationType.SUM, field: 'empty_miles', alias: 'total_empty_miles' },
    { type: AggregationType.SUM, field: 'total_miles', alias: 'total_all_miles' }
  ],
  groupBy: ['driver_id'],
  sort: [
    { field: 'empty_miles_percentage', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {
    startDate: null,
    endDate: null,
    carrierId: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query for analyzing driver contribution to network efficiency
 * Measures how individual drivers impact the overall optimization network
 */
const driverNetworkContributionQuery: IAnalyticsQuery = {
  name: 'driver_network_contribution',
  description: 'Analyzes how drivers contribute to overall network efficiency',
  type: AnalyticsQueryType.DRIVER,
  collection: 'driver_scores',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'network_contribution_score', alias: 'network_contribution' },
    { field: 'calculated_at', alias: 'date', dataType: 'date' }
  ],
  aggregations: [
    { type: AggregationType.AVG, field: 'network_contribution_score', alias: 'average_contribution' }
  ],
  groupBy: ['driver_id'],
  sort: [
    { field: 'average_contribution', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {
    startDate: null,
    endDate: null,
    minContribution: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query for analyzing driver on-time performance
 * Tracks pickup and delivery punctuality
 */
const driverOnTimePerformanceQuery: IAnalyticsQuery = {
  name: 'driver_on_time_performance',
  description: 'Analyzes driver on-time pickup and delivery performance',
  type: AnalyticsQueryType.DRIVER,
  collection: 'load_assignments',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'load_id', alias: 'load_id' },
    { field: 'on_time_pickup', alias: 'on_time_pickup', dataType: 'boolean' },
    { field: 'on_time_delivery', alias: 'on_time_delivery', dataType: 'boolean' },
    { field: 'pickup_timestamp', alias: 'pickup_time', dataType: 'date' },
    { field: 'delivery_timestamp', alias: 'delivery_time', dataType: 'date' }
  ],
  aggregations: [
    { type: AggregationType.COUNT, field: 'load_id', alias: 'total_loads' },
    { type: AggregationType.SUM, field: 'on_time_pickup', alias: 'on_time_pickups' },
    { type: AggregationType.SUM, field: 'on_time_delivery', alias: 'on_time_deliveries' }
  ],
  groupBy: ['driver_id'],
  parameters: {
    startDate: null,
    endDate: null,
    carrierId: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query for analyzing driver participation in Smart Hub exchanges
 * Measures how drivers utilize the Smart Hub network for load exchanges
 */
const driverSmartHubUtilizationQuery: IAnalyticsQuery = {
  name: 'driver_smart_hub_utilization',
  description: 'Analyzes driver participation in Smart Hub exchanges',
  type: AnalyticsQueryType.DRIVER,
  collection: 'driver_smart_hub_visits',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'hub_id', alias: 'hub_id' },
    { field: 'visit_timestamp', alias: 'visit_time', dataType: 'date' },
    { field: 'exchange_completed', alias: 'exchange_completed', dataType: 'boolean' },
    { field: 'time_saved', alias: 'time_saved_minutes' },
    { field: 'miles_saved', alias: 'miles_saved' }
  ],
  aggregations: [
    { type: AggregationType.COUNT, field: 'hub_id', alias: 'total_visits' },
    { type: AggregationType.SUM, field: 'exchange_completed', alias: 'completed_exchanges' },
    { type: AggregationType.SUM, field: 'miles_saved', alias: 'total_miles_saved' },
    { type: AggregationType.AVG, field: 'time_saved', alias: 'average_time_saved' }
  ],
  groupBy: ['driver_id'],
  sort: [
    { field: 'total_visits', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {
    startDate: null,
    endDate: null,
    hubId: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query for analyzing driver earnings trends over time
 * Tracks base earnings and efficiency bonuses
 */
const driverEarningsTrendQuery: IAnalyticsQuery = {
  name: 'driver_earnings_trend',
  description: 'Analyzes driver earnings trends over time',
  type: AnalyticsQueryType.DRIVER,
  collection: 'driver_earnings',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'earning_date', alias: 'date', dataType: 'date' },
    { field: 'base_earnings', alias: 'base_earnings' },
    { field: 'efficiency_bonus', alias: 'efficiency_bonus' },
    { field: 'total_earnings', alias: 'total_earnings' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'total_earnings', alias: 'period_earnings' },
    { type: AggregationType.SUM, field: 'efficiency_bonus', alias: 'period_bonuses' },
    { type: AggregationType.AVG, field: 'total_earnings', alias: 'average_daily_earnings' }
  ],
  groupBy: ['driver_id', 'earning_date'],
  sort: [
    { field: 'earning_date', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {
    startDate: null,
    endDate: null,
    driverId: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query for analyzing the distribution of driver efficiency scores
 * Used to visualize score distribution across the driver population
 */
const driverEfficiencyDistributionQuery: IAnalyticsQuery = {
  name: 'driver_efficiency_distribution',
  description: 'Analyzes the distribution of driver efficiency scores across the platform',
  type: AnalyticsQueryType.DRIVER,
  collection: 'drivers',
  fields: [
    { field: 'efficiency_score', alias: 'score' }
  ],
  aggregations: [
    { type: AggregationType.COUNT, field: 'driver_id', alias: 'driver_count' }
  ],
  groupBy: ['efficiency_score'],
  sort: [
    { field: 'efficiency_score', direction: SortDirection.ASC }
  ],
  parameters: {
    carrierId: null,
    minScore: null,
    maxScore: null,
    bucketSize: 5 // Group scores into buckets of 5 points (0-5, 6-10, etc.)
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query for analyzing driver load acceptance rates and patterns
 * Tracks how drivers respond to load offers
 */
const driverLoadAcceptanceRateQuery: IAnalyticsQuery = {
  name: 'driver_load_acceptance_rate',
  description: 'Analyzes driver load acceptance rates and patterns',
  type: AnalyticsQueryType.DRIVER,
  collection: 'load_offers',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'offer_timestamp', alias: 'offer_date', dataType: 'date' },
    { field: 'accepted', alias: 'accepted', dataType: 'boolean' },
    { field: 'load_efficiency_score', alias: 'load_score' },
    { field: 'response_time_seconds', alias: 'response_time' }
  ],
  aggregations: [
    { type: AggregationType.COUNT, field: 'driver_id', alias: 'total_offers' },
    { type: AggregationType.SUM, field: 'accepted', alias: 'accepted_offers' },
    { type: AggregationType.AVG, field: 'response_time_seconds', alias: 'average_response_time' }
  ],
  groupBy: ['driver_id'],
  sort: [
    { field: 'total_offers', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: null,
    endDate: null,
    carrierId: null,
    minAcceptanceRate: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Map of all driver-related analytics queries for easy lookup by name
 */
const driverQueries = new Map<string, IAnalyticsQuery>([
  ['driver_efficiency_score', driverEfficiencyScoreQuery],
  ['driver_performance_metrics', driverPerformanceMetricsQuery],
  ['driver_leaderboard', driverLeaderboardQuery],
  ['driver_empty_miles', driverEmptyMilesQuery],
  ['driver_network_contribution', driverNetworkContributionQuery],
  ['driver_on_time_performance', driverOnTimePerformanceQuery],
  ['driver_smart_hub_utilization', driverSmartHubUtilizationQuery],
  ['driver_earnings_trend', driverEarningsTrendQuery],
  ['driver_efficiency_distribution', driverEfficiencyDistributionQuery],
  ['driver_load_acceptance_rate', driverLoadAcceptanceRateQuery]
]);

// Export individual queries for direct access
export {
  driverEfficiencyScoreQuery,
  driverPerformanceMetricsQuery,
  driverLeaderboardQuery,
  driverEmptyMilesQuery,
  driverNetworkContributionQuery,
  driverOnTimePerformanceQuery,
  driverSmartHubUtilizationQuery,
  driverEarningsTrendQuery,
  driverEfficiencyDistributionQuery,
  driverLoadAcceptanceRateQuery,
  driverQueries
};

// Default export of the driver queries map
export default driverQueries;