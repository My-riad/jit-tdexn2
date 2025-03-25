/**
 * Efficiency Analytics Queries
 * 
 * This module defines a collection of predefined analytics queries related to efficiency metrics.
 * These queries are used to generate reports, dashboards, and visualizations focusing on
 * network efficiency, empty mile reduction, Smart Hub utilization, and other key performance
 * indicators across the freight optimization platform.
 */

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
import { SmartHubType } from '../../common/interfaces/smartHub.interface';

/**
 * Query to analyze overall network efficiency scores across the platform.
 * This query provides metrics for the efficiency dashboard showing the overall
 * system performance.
 */
export const networkEfficiencyScoreQuery: IAnalyticsQuery = {
  name: 'network_efficiency_score',
  description: 'Analyzes overall network efficiency scores across the platform',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'efficiency_score', alias: 'score' },
    { field: 'created_at', alias: 'date' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.AVG, 
      field: 'efficiency_score', 
      alias: 'average_efficiency_score' 
    }
  ],
  groupBy: ['created_at'],
  sort: [
    { field: 'created_at', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.DAY,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze empty miles reduction trends over time.
 * This query supports the empty miles reduction chart in the analytics dashboard.
 */
export const emptyMilesReductionQuery: IAnalyticsQuery = {
  name: 'empty_miles_reduction',
  description: 'Analyzes empty miles reduction trends over time',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'created_at', alias: 'date' },
    { field: 'empty_miles_before', alias: 'before_optimization' },
    { field: 'empty_miles_after', alias: 'after_optimization' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.SUM, 
      field: 'empty_miles_before', 
      alias: 'total_empty_miles_before' 
    },
    { 
      type: AggregationType.SUM, 
      field: 'empty_miles_after', 
      alias: 'total_empty_miles_after' 
    }
  ],
  groupBy: ['created_at'],
  sort: [
    { field: 'created_at', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze Smart Hub utilization and impact on efficiency.
 * This query provides data for the Smart Hub usage dashboard.
 */
export const smartHubUtilizationQuery: IAnalyticsQuery = {
  name: 'smart_hub_utilization',
  description: 'Analyzes Smart Hub utilization and impact on efficiency',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_exchanges',
  fields: [
    { field: 'hub_id', alias: 'smart_hub_id' },
    { field: 'hub_name', alias: 'smart_hub_name' },
    { field: 'hub_type', alias: 'smart_hub_type' },
    { field: 'exchange_date', alias: 'date' }
  ],
  filters: [],
  aggregations: [
    { 
      type: AggregationType.COUNT, 
      field: 'exchange_id', 
      alias: 'exchange_count' 
    },
    { 
      type: AggregationType.AVG, 
      field: 'efficiency_impact', 
      alias: 'average_efficiency_impact' 
    },
    { 
      type: AggregationType.SUM, 
      field: 'empty_miles_saved', 
      alias: 'total_empty_miles_saved' 
    }
  ],
  groupBy: ['hub_id', 'hub_name', 'hub_type', 'exchange_date'],
  sort: [
    { field: 'exchange_count', direction: SortDirection.DESC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze relay participation rates and efficiency impact.
 * This query provides data for understanding the effectiveness of dynamic relay hauls.
 */
export const relayParticipationQuery: IAnalyticsQuery = {
  name: 'relay_participation',
  description: 'Analyzes relay participation rates and efficiency impact',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'assignment_type', alias: 'type' },
    { field: 'created_at', alias: 'date' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.COUNT, 
      field: 'assignment_id', 
      alias: 'assignment_count' 
    },
    { 
      type: AggregationType.AVG, 
      field: 'efficiency_score', 
      alias: 'average_efficiency_score' 
    }
  ],
  groupBy: ['assignment_type', 'created_at'],
  sort: [
    { field: 'created_at', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze efficiency metrics broken down by geographic region.
 * This query supports regional performance comparison visualizations.
 */
export const efficiencyByRegionQuery: IAnalyticsQuery = {
  name: 'efficiency_by_region',
  description: 'Analyzes efficiency metrics broken down by geographic region',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'region', alias: 'region_name' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.AVG, 
      field: 'efficiency_score', 
      alias: 'average_efficiency_score' 
    },
    { 
      type: AggregationType.SUM, 
      field: 'empty_miles_saved', 
      alias: 'total_empty_miles_saved' 
    },
    { 
      type: AggregationType.COUNT, 
      field: 'assignment_id', 
      alias: 'assignment_count' 
    }
  ],
  groupBy: ['region'],
  sort: [
    { field: 'average_efficiency_score', direction: SortDirection.DESC }
  ],
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze efficiency metrics broken down by carrier.
 * This query supports carrier performance comparison visualizations.
 */
export const efficiencyByCarrierQuery: IAnalyticsQuery = {
  name: 'efficiency_by_carrier',
  description: 'Analyzes efficiency metrics broken down by carrier',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'carrier_id', alias: 'carrier_id' },
    { field: 'carrier_name', alias: 'carrier_name' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.AVG, 
      field: 'efficiency_score', 
      alias: 'average_efficiency_score' 
    },
    { 
      type: AggregationType.SUM, 
      field: 'empty_miles_saved', 
      alias: 'total_empty_miles_saved' 
    },
    { 
      type: AggregationType.COUNT, 
      field: 'assignment_id', 
      alias: 'assignment_count' 
    }
  ],
  groupBy: ['carrier_id', 'carrier_name'],
  sort: [
    { field: 'average_efficiency_score', direction: SortDirection.DESC }
  ],
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze efficiency metrics broken down by equipment type.
 * This query provides insights into how different equipment types perform in terms of efficiency.
 */
export const efficiencyByEquipmentTypeQuery: IAnalyticsQuery = {
  name: 'efficiency_by_equipment_type',
  description: 'Analyzes efficiency metrics broken down by equipment type',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'equipment_type', alias: 'equipment_type' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.AVG, 
      field: 'efficiency_score', 
      alias: 'average_efficiency_score' 
    },
    { 
      type: AggregationType.SUM, 
      field: 'empty_miles_saved', 
      alias: 'total_empty_miles_saved' 
    },
    { 
      type: AggregationType.COUNT, 
      field: 'assignment_id', 
      alias: 'assignment_count' 
    }
  ],
  groupBy: ['equipment_type'],
  sort: [
    { field: 'average_efficiency_score', direction: SortDirection.DESC }
  ],
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze efficiency score trends over time.
 * This query supports the efficiency trend chart in the analytics dashboard.
 */
export const efficiencyTrendQuery: IAnalyticsQuery = {
  name: 'efficiency_trend',
  description: 'Analyzes efficiency score trends over time',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'created_at', alias: 'date' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.AVG, 
      field: 'efficiency_score', 
      alias: 'average_efficiency_score' 
    }
  ],
  groupBy: ['created_at'],
  sort: [
    { field: 'created_at', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to generate the key metrics summary table with current vs. previous period comparisons.
 * This query supports the key metrics summary in the analytics dashboard.
 */
export const keyMetricsSummaryQuery: IAnalyticsQuery = {
  name: 'key_metrics_summary',
  description: 'Generates the key metrics summary table with current vs. previous period comparisons',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'efficiency_metrics',
  fields: [
    { field: 'metric_name', alias: 'metric' },
    { field: 'current_value', alias: 'current' },
    { field: 'previous_value', alias: 'previous' },
    { field: 'target_value', alias: 'target' }
  ],
  filters: [],
  aggregations: [],
  sort: [
    { field: 'metric_order', direction: SortDirection.ASC }
  ],
  parameters: {
    current_period_start: '',
    current_period_end: '',
    previous_period_start: '',
    previous_period_end: ''
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze fuel savings resulting from efficiency improvements.
 * This query provides data for environmental impact dashboards.
 */
export const fuelSavingsQuery: IAnalyticsQuery = {
  name: 'fuel_savings',
  description: 'Analyzes fuel savings resulting from efficiency improvements',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'created_at', alias: 'date' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.SUM, 
      field: 'fuel_saved_gallons', 
      alias: 'total_fuel_saved' 
    },
    { 
      type: AggregationType.SUM, 
      field: 'fuel_cost_saved', 
      alias: 'total_fuel_cost_saved' 
    }
  ],
  groupBy: ['created_at'],
  sort: [
    { field: 'created_at', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Query to analyze CO2 emissions reduction from efficiency improvements.
 * This query provides data for environmental impact dashboards.
 */
export const co2EmissionsReductionQuery: IAnalyticsQuery = {
  name: 'co2_emissions_reduction',
  description: 'Analyzes CO2 emissions reduction from efficiency improvements',
  type: AnalyticsQueryType.EFFICIENCY,
  collection: 'load_assignments',
  fields: [
    { field: 'created_at', alias: 'date' }
  ],
  filters: [
    { 
      field: 'status', 
      operator: FilterOperator.EQUALS, 
      value: LoadStatus.COMPLETED 
    }
  ],
  aggregations: [
    { 
      type: AggregationType.SUM, 
      field: 'co2_emissions_saved', 
      alias: 'total_co2_saved' 
    }
  ],
  groupBy: ['created_at'],
  sort: [
    { field: 'created_at', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Collection of all efficiency-related analytics queries.
 * This map provides easy lookup of queries by name.
 */
export const efficiencyQueries = new Map<string, IAnalyticsQuery>([
  [networkEfficiencyScoreQuery.name, networkEfficiencyScoreQuery],
  [emptyMilesReductionQuery.name, emptyMilesReductionQuery],
  [smartHubUtilizationQuery.name, smartHubUtilizationQuery],
  [relayParticipationQuery.name, relayParticipationQuery],
  [efficiencyByRegionQuery.name, efficiencyByRegionQuery],
  [efficiencyByCarrierQuery.name, efficiencyByCarrierQuery],
  [efficiencyByEquipmentTypeQuery.name, efficiencyByEquipmentTypeQuery],
  [efficiencyTrendQuery.name, efficiencyTrendQuery],
  [keyMetricsSummaryQuery.name, keyMetricsSummaryQuery],
  [fuelSavingsQuery.name, fuelSavingsQuery],
  [co2EmissionsReductionQuery.name, co2EmissionsReductionQuery]
]);

/**
 * Default export of all efficiency-related analytics queries.
 */
export default efficiencyQueries;