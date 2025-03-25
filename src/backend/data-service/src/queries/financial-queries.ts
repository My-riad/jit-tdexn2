import { 
  IAnalyticsQuery, 
  AnalyticsQueryType, 
  AggregationType, 
  TimeGranularity, 
  FilterOperator, 
  SortDirection 
} from '../models/analytics-query.model';
import { getKnexInstance } from '../../common/config/database.config';
import { LoadStatus } from '../../common/interfaces/load.interface';

/**
 * Predefined query for analyzing revenue trends over time across the platform
 */
export const revenueAnalysisQuery: IAnalyticsQuery = {
  name: 'Revenue Analysis',
  description: 'Analyzes revenue trends over time periods with daily, weekly, and monthly breakdowns',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'load_assignments',
  fields: [
    { field: 'created_at', alias: 'period' },
    { field: 'agreed_rate', alias: 'revenue' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'agreed_rate', alias: 'total_revenue' },
    { type: AggregationType.COUNT, field: 'assignment_id', alias: 'load_count' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.COMPLETED }
  ],
  groupBy: ['period'],
  sort: [
    { field: 'period', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.DAY,
  parameters: {
    startDate: null,
    endDate: null,
    granularity: TimeGranularity.DAY // Can be changed to WEEK or MONTH
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing driver earnings and efficiency correlation
 */
export const driverEarningsQuery: IAnalyticsQuery = {
  name: 'Driver Earnings Analysis',
  description: 'Analyzes correlation between driver efficiency scores and earnings to track 15-25% improvement target',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'load_assignments',
  fields: [
    { field: 'driver_id', alias: 'driver_id' },
    { field: 'efficiency_score', alias: 'efficiency_score' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'agreed_rate', alias: 'total_earnings' },
    { type: AggregationType.AVG, field: 'efficiency_score', alias: 'avg_efficiency_score' },
    { type: AggregationType.COUNT, field: 'assignment_id', alias: 'load_count' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.COMPLETED }
  ],
  groupBy: ['driver_id'],
  sort: [
    { field: 'total_earnings', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: null,
    endDate: null,
    minEfficiencyScore: null,
    maxEfficiencyScore: null,
    includeHistoricalComparison: true // For measuring improvement over time
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing cost savings from optimization
 */
export const costSavingsQuery: IAnalyticsQuery = {
  name: 'Optimization Cost Savings',
  description: 'Analyzes cost savings achieved through system optimization and empty mile reduction',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'optimization_metrics',
  fields: [
    { field: 'created_at', alias: 'period' },
    { field: 'empty_miles_saved', alias: 'empty_miles_saved' },
    { field: 'cost_per_mile', alias: 'cost_per_mile' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'empty_miles_saved', alias: 'total_miles_saved' },
    { type: AggregationType.SUM, field: 'cost_savings', alias: 'total_cost_savings' },
    { type: AggregationType.AVG, field: 'cost_per_mile', alias: 'avg_cost_per_mile' }
  ],
  groupBy: ['period'],
  sort: [
    { field: 'period', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {
    startDate: null,
    endDate: null,
    includeYTD: true
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing rate trends and market comparisons
 */
export const rateAnalysisQuery: IAnalyticsQuery = {
  name: 'Rate Market Analysis',
  description: 'Analyzes rate trends and compares to market averages to identify competitive advantages',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'market_rates',
  fields: [
    { field: 'origin_region', alias: 'origin' },
    { field: 'destination_region', alias: 'destination' },
    { field: 'equipment_type', alias: 'equipment_type' },
    { field: 'recorded_at', alias: 'period' }
  ],
  aggregations: [
    { type: AggregationType.AVG, field: 'average_rate', alias: 'avg_market_rate' },
    { type: AggregationType.AVG, field: 'platform_rate', alias: 'avg_platform_rate' },
    { type: AggregationType.AVG, field: 'platform_rate_difference_pct', alias: 'avg_savings_pct' }
  ],
  groupBy: ['origin', 'destination', 'equipment_type', 'period'],
  sort: [
    { field: 'avg_savings_pct', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {
    startDate: null,
    endDate: null,
    equipmentTypes: null,
    regions: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing revenue per mile metrics
 */
export const revenueMileQuery: IAnalyticsQuery = {
  name: 'Revenue Per Mile Analysis',
  description: 'Analyzes revenue per mile metrics for loads and carriers to optimize pricing strategies',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'load_assignments',
  fields: [
    { field: 'created_at', alias: 'period' },
    { field: 'carrier_id', alias: 'carrier_id' },
    { field: 'total_miles', alias: 'miles' },
    { field: 'agreed_rate', alias: 'revenue' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'total_miles', alias: 'total_miles' },
    { type: AggregationType.SUM, field: 'agreed_rate', alias: 'total_revenue' },
    { type: AggregationType.AVG, field: 'rate_per_mile', alias: 'avg_rate_per_mile' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.COMPLETED }
  ],
  groupBy: ['carrier_id', 'period'],
  sort: [
    { field: 'avg_rate_per_mile', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {
    startDate: null,
    endDate: null,
    minRatePerMile: null,
    maxRatePerMile: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing financial trends over time
 */
export const financialTrendAnalysisQuery: IAnalyticsQuery = {
  name: 'Financial Trend Analysis',
  description: 'Analyzes overall financial trends over time periods for executive dashboards',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'financial_metrics',
  fields: [
    { field: 'recorded_at', alias: 'period' },
    { field: 'revenue', alias: 'revenue' },
    { field: 'costs', alias: 'costs' },
    { field: 'margin', alias: 'margin' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'revenue', alias: 'total_revenue' },
    { type: AggregationType.SUM, field: 'costs', alias: 'total_costs' },
    { type: AggregationType.AVG, field: 'margin', alias: 'avg_margin' }
  ],
  groupBy: ['period'],
  sort: [
    { field: 'period', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {
    startDate: null,
    endDate: null,
    includeForecast: false
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing financial metrics by geographic region
 */
export const regionFinancialMetricsQuery: IAnalyticsQuery = {
  name: 'Regional Financial Metrics',
  description: 'Analyzes financial performance across different geographic regions for market targeting',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'load_assignments',
  fields: [
    { field: 'region', alias: 'region' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'agreed_rate', alias: 'total_revenue' },
    { type: AggregationType.COUNT, field: 'assignment_id', alias: 'load_count' },
    { type: AggregationType.AVG, field: 'rate_per_mile', alias: 'avg_rate_per_mile' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.COMPLETED }
  ],
  groupBy: ['region'],
  sort: [
    { field: 'total_revenue', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: null,
    endDate: null,
    regions: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing carrier financial performance
 */
export const carrierFinancialPerformanceQuery: IAnalyticsQuery = {
  name: 'Carrier Financial Performance',
  description: 'Analyzes financial performance metrics for carriers to identify top performers',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'load_assignments',
  fields: [
    { field: 'carrier_id', alias: 'carrier_id' },
    { field: 'carrier_name', alias: 'carrier_name' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'agreed_rate', alias: 'total_revenue' },
    { type: AggregationType.COUNT, field: 'assignment_id', alias: 'load_count' },
    { type: AggregationType.AVG, field: 'rate_per_mile', alias: 'avg_rate_per_mile' },
    { type: AggregationType.AVG, field: 'on_time_delivery', alias: 'on_time_percentage' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.COMPLETED }
  ],
  groupBy: ['carrier_id', 'carrier_name'],
  sort: [
    { field: 'total_revenue', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: null,
    endDate: null,
    minLoads: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing savings from network optimization
 */
export const optimizationSavingsQuery: IAnalyticsQuery = {
  name: 'Network Optimization Savings',
  description: 'Analyzes financial savings achieved through network optimization techniques',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'optimization_metrics',
  fields: [
    { field: 'created_at', alias: 'period' },
    { field: 'optimization_type', alias: 'optimization_type' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'cost_savings', alias: 'total_savings' },
    { type: AggregationType.SUM, field: 'empty_miles_saved', alias: 'empty_miles_saved' },
    { type: AggregationType.COUNT, field: 'load_id', alias: 'optimized_load_count' }
  ],
  groupBy: ['period', 'optimization_type'],
  sort: [
    { field: 'period', direction: SortDirection.ASC },
    { field: 'total_savings', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {
    startDate: null,
    endDate: null,
    optimizationTypes: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing return on investment for driver incentives
 */
export const incentiveROIQuery: IAnalyticsQuery = {
  name: 'Driver Incentive ROI',
  description: 'Analyzes return on investment for driver incentives and bonuses to optimize gamification',
  type: AnalyticsQueryType.FINANCIAL,
  collection: 'driver_bonuses',
  fields: [
    { field: 'created_at', alias: 'period' },
    { field: 'bonus_type', alias: 'bonus_type' }
  ],
  aggregations: [
    { type: AggregationType.SUM, field: 'bonus_amount', alias: 'total_bonus_amount' },
    { type: AggregationType.SUM, field: 'value_generated', alias: 'total_value_generated' },
    { type: AggregationType.COUNT, field: 'driver_id', alias: 'driver_count' }
  ],
  groupBy: ['period', 'bonus_type'],
  sort: [
    { field: 'period', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {
    startDate: null,
    endDate: null,
    bonusTypes: null
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Map of all financial queries for easy lookup
 */
export const financialQueries = new Map<string, IAnalyticsQuery>([
  ['revenue-analysis', revenueAnalysisQuery],
  ['driver-earnings', driverEarningsQuery],
  ['cost-savings', costSavingsQuery],
  ['rate-analysis', rateAnalysisQuery],
  ['revenue-mile', revenueMileQuery],
  ['financial-trend', financialTrendAnalysisQuery],
  ['region-financial', regionFinancialMetricsQuery],
  ['carrier-performance', carrierFinancialPerformanceQuery],
  ['optimization-savings', optimizationSavingsQuery],
  ['incentive-roi', incentiveROIQuery]
]);

export default financialQueries;