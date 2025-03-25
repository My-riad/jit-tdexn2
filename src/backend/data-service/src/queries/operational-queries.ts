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
 * Predefined query for analyzing on-time delivery performance
 */
export const onTimeDeliveryQuery: IAnalyticsQuery = {
  name: 'OnTimeDelivery',
  description: 'Measures the percentage of loads delivered within their scheduled delivery window',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'load_assignments',
  fields: [
    { field: 'date_trunc(\'month\', updated_at)', alias: 'month' },
    { field: 'count(*)', alias: 'total_deliveries' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.COMPLETED }
  ],
  aggregations: [
    { 
      type: AggregationType.COUNT, 
      field: 'case when delivered_at <= delivery_latest then 1 else null end', 
      alias: 'on_time_deliveries' 
    }
  ],
  groupBy: ['date_trunc(\'month\', updated_at)'],
  sort: [
    { field: 'month', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing load fulfillment rates
 */
export const loadFulfillmentRateQuery: IAnalyticsQuery = {
  name: 'LoadFulfillmentRate',
  description: 'Measures the percentage of loads that were successfully assigned and delivered',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'loads',
  fields: [
    { field: 'date_trunc(\'week\', created_at)', alias: 'week' },
    { field: 'count(*)', alias: 'total_loads' }
  ],
  filters: [],
  aggregations: [
    { 
      type: AggregationType.COUNT, 
      field: 'case when status in (\'' + LoadStatus.COMPLETED + '\', \'' + LoadStatus.DELIVERED + '\') then 1 else null end', 
      alias: 'fulfilled_loads' 
    }
  ],
  groupBy: ['date_trunc(\'week\', created_at)'],
  sort: [
    { field: 'week', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing driver utilization
 */
export const driverUtilizationQuery: IAnalyticsQuery = {
  name: 'DriverUtilization',
  description: 'Measures how effectively drivers are being utilized based on active time vs. total available time',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'drivers',
  fields: [
    { field: 'drivers.driver_id', alias: 'driver_id' },
    { field: 'drivers.first_name', alias: 'first_name' },
    { field: 'drivers.last_name', alias: 'last_name' },
    { field: 'carriers.name', alias: 'carrier_name' }
  ],
  filters: [
    { field: 'drivers.active', operator: FilterOperator.EQUALS, value: true }
  ],
  aggregations: [
    { 
      type: AggregationType.SUM, 
      field: 'extract(epoch from (load_assignments.completed_at - load_assignments.created_at))/3600', 
      alias: 'active_hours' 
    },
    { 
      type: AggregationType.COUNT, 
      field: 'load_assignments.assignment_id', 
      alias: 'load_count' 
    }
  ],
  groupBy: ['drivers.driver_id', 'drivers.first_name', 'drivers.last_name', 'carriers.name'],
  sort: [
    { field: 'active_hours', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: 'datetime',
    endDate: 'datetime'
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing load cycle times
 */
export const loadCycleTimeQuery: IAnalyticsQuery = {
  name: 'LoadCycleTime',
  description: 'Measures the average time from load assignment to delivery completion',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'load_assignments',
  fields: [
    { field: 'date_trunc(\'month\', created_at)', alias: 'month' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.COMPLETED }
  ],
  aggregations: [
    { 
      type: AggregationType.AVG, 
      field: 'extract(epoch from (completed_at - created_at))/3600', 
      alias: 'avg_cycle_time_hours' 
    },
    { 
      type: AggregationType.MIN, 
      field: 'extract(epoch from (completed_at - created_at))/3600', 
      alias: 'min_cycle_time_hours' 
    },
    { 
      type: AggregationType.MAX, 
      field: 'extract(epoch from (completed_at - created_at))/3600', 
      alias: 'max_cycle_time_hours' 
    }
  ],
  groupBy: ['date_trunc(\'month\', created_at)'],
  sort: [
    { field: 'month', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.MONTH,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing truck utilization
 */
export const truckUtilizationQuery: IAnalyticsQuery = {
  name: 'TruckUtilization',
  description: 'Measures how effectively trucks are being utilized and identifies repositioning opportunities',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'vehicles',
  fields: [
    { field: 'vehicles.vehicle_id', alias: 'vehicle_id' },
    { field: 'vehicles.plate_number', alias: 'plate_number' },
    { field: 'carriers.name', alias: 'carrier_name' }
  ],
  filters: [
    { field: 'vehicles.status', operator: FilterOperator.EQUALS, value: 'ACTIVE' }
  ],
  aggregations: [
    { 
      type: AggregationType.SUM, 
      field: 'extract(epoch from (load_assignments.completed_at - load_assignments.created_at))/3600', 
      alias: 'active_hours' 
    },
    { 
      type: AggregationType.COUNT, 
      field: 'load_assignments.assignment_id', 
      alias: 'load_count' 
    }
  ],
  groupBy: ['vehicles.vehicle_id', 'vehicles.plate_number', 'carriers.name'],
  sort: [
    { field: 'active_hours', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: 'datetime',
    endDate: 'datetime'
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing load acceptance rates by drivers
 */
export const loadAcceptanceRateQuery: IAnalyticsQuery = {
  name: 'LoadAcceptanceRate',
  description: 'Measures the percentage of recommended loads that are accepted by drivers',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'load_recommendations',
  fields: [
    { field: 'drivers.driver_id', alias: 'driver_id' },
    { field: 'drivers.first_name', alias: 'first_name' },
    { field: 'drivers.last_name', alias: 'last_name' },
    { field: 'count(*)', alias: 'total_recommendations' }
  ],
  filters: [],
  aggregations: [
    { 
      type: AggregationType.COUNT, 
      field: 'case when load_recommendations.status = \'ACCEPTED\' then 1 else null end', 
      alias: 'accepted_loads' 
    }
  ],
  groupBy: ['drivers.driver_id', 'drivers.first_name', 'drivers.last_name'],
  sort: [
    { field: 'total_recommendations', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: 'datetime',
    endDate: 'datetime'
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing operational issues and exceptions
 */
export const operationalIssuesQuery: IAnalyticsQuery = {
  name: 'OperationalIssues',
  description: 'Identifies and categorizes operational issues and exceptions',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'load_status_history',
  fields: [
    { field: 'status_details->\'issue_type\'', alias: 'issue_type' },
    { field: 'count(*)', alias: 'issue_count' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.EXCEPTION }
  ],
  groupBy: ['status_details->\'issue_type\''],
  sort: [
    { field: 'issue_count', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: 'datetime',
    endDate: 'datetime'
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing load density by geographic region
 */
export const loadDensityByRegionQuery: IAnalyticsQuery = {
  name: 'LoadDensityByRegion',
  description: 'Maps load density by geographic region to identify high and low demand areas',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'load_locations',
  fields: [
    { field: 'state', alias: 'region' },
    { field: 'count(*)', alias: 'load_count' }
  ],
  filters: [
    { field: 'location_type', operator: FilterOperator.EQUALS, value: 'PICKUP' }
  ],
  groupBy: ['state'],
  sort: [
    { field: 'load_count', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: 'datetime',
    endDate: 'datetime'
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing pickup delays and their causes
 */
export const pickupDelayAnalysisQuery: IAnalyticsQuery = {
  name: 'PickupDelayAnalysis',
  description: 'Analyzes pickup delays and their causes to identify improvement opportunities',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'load_status_history',
  fields: [
    { field: 'status_details->\'delay_reason\'', alias: 'delay_reason' },
    { field: 'count(*)', alias: 'delay_count' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.DELAYED },
    { field: 'status_details->\'location_type\'', operator: FilterOperator.EQUALS, value: 'PICKUP' }
  ],
  aggregations: [
    { 
      type: AggregationType.AVG, 
      field: 'status_details->\'delay_minutes\'', 
      alias: 'avg_delay_minutes' 
    }
  ],
  groupBy: ['status_details->\'delay_reason\''],
  sort: [
    { field: 'delay_count', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: 'datetime',
    endDate: 'datetime'
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing delivery delays and their causes
 */
export const deliveryDelayAnalysisQuery: IAnalyticsQuery = {
  name: 'DeliveryDelayAnalysis',
  description: 'Analyzes delivery delays and their causes to identify improvement opportunities',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'load_status_history',
  fields: [
    { field: 'status_details->\'delay_reason\'', alias: 'delay_reason' },
    { field: 'count(*)', alias: 'delay_count' }
  ],
  filters: [
    { field: 'status', operator: FilterOperator.EQUALS, value: LoadStatus.DELAYED },
    { field: 'status_details->\'location_type\'', operator: FilterOperator.EQUALS, value: 'DELIVERY' }
  ],
  aggregations: [
    { 
      type: AggregationType.AVG, 
      field: 'status_details->\'delay_minutes\'', 
      alias: 'avg_delay_minutes' 
    }
  ],
  groupBy: ['status_details->\'delay_reason\''],
  sort: [
    { field: 'delay_count', direction: SortDirection.DESC }
  ],
  parameters: {
    startDate: 'datetime',
    endDate: 'datetime'
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing Hours of Service compliance metrics
 */
export const hosComplianceQuery: IAnalyticsQuery = {
  name: 'HoSCompliance',
  description: 'Monitors Hours of Service compliance across drivers',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'driver_hos',
  fields: [
    { field: 'drivers.driver_id', alias: 'driver_id' },
    { field: 'drivers.first_name', alias: 'first_name' },
    { field: 'drivers.last_name', alias: 'last_name' },
    { field: 'carriers.name', alias: 'carrier_name' }
  ],
  filters: [],
  aggregations: [
    { 
      type: AggregationType.COUNT, 
      field: 'case when driving_minutes_remaining < 60 then 1 else null end', 
      alias: 'near_drive_limit_count' 
    },
    { 
      type: AggregationType.COUNT, 
      field: 'case when on_duty_minutes_remaining < 60 then 1 else null end', 
      alias: 'near_duty_limit_count' 
    },
    { 
      type: AggregationType.MIN, 
      field: 'driving_minutes_remaining', 
      alias: 'min_driving_minutes' 
    }
  ],
  groupBy: ['drivers.driver_id', 'drivers.first_name', 'drivers.last_name', 'carriers.name'],
  sort: [
    { field: 'min_driving_minutes', direction: SortDirection.ASC }
  ],
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Predefined query for analyzing operational performance trends over time
 */
export const operationalTrendQuery: IAnalyticsQuery = {
  name: 'OperationalTrends',
  description: 'Tracks key operational metrics over time to identify trends and patterns',
  type: AnalyticsQueryType.OPERATIONAL,
  collection: 'loads',
  fields: [
    { field: 'date_trunc(\'week\', created_at)', alias: 'week' }
  ],
  filters: [],
  aggregations: [
    { 
      type: AggregationType.COUNT, 
      field: '*', 
      alias: 'total_loads' 
    },
    { 
      type: AggregationType.COUNT, 
      field: 'case when status = \'' + LoadStatus.COMPLETED + '\' then 1 else null end', 
      alias: 'completed_loads' 
    },
    { 
      type: AggregationType.COUNT, 
      field: 'case when status = \'' + LoadStatus.CANCELLED + '\' then 1 else null end', 
      alias: 'cancelled_loads' 
    },
    { 
      type: AggregationType.AVG, 
      field: 'extract(epoch from (updated_at - created_at))/3600', 
      alias: 'avg_completion_time_hours' 
    }
  ],
  groupBy: ['date_trunc(\'week\', created_at)'],
  sort: [
    { field: 'week', direction: SortDirection.ASC }
  ],
  timeGranularity: TimeGranularity.WEEK,
  parameters: {},
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Create a map of all operational queries for easy lookup
export const operationalQueries: Map<string, IAnalyticsQuery> = new Map();
operationalQueries.set(onTimeDeliveryQuery.name, onTimeDeliveryQuery);
operationalQueries.set(loadFulfillmentRateQuery.name, loadFulfillmentRateQuery);
operationalQueries.set(driverUtilizationQuery.name, driverUtilizationQuery);
operationalQueries.set(loadCycleTimeQuery.name, loadCycleTimeQuery);
operationalQueries.set(truckUtilizationQuery.name, truckUtilizationQuery);
operationalQueries.set(loadAcceptanceRateQuery.name, loadAcceptanceRateQuery);
operationalQueries.set(operationalIssuesQuery.name, operationalIssuesQuery);
operationalQueries.set(loadDensityByRegionQuery.name, loadDensityByRegionQuery);
operationalQueries.set(pickupDelayAnalysisQuery.name, pickupDelayAnalysisQuery);
operationalQueries.set(deliveryDelayAnalysisQuery.name, deliveryDelayAnalysisQuery);
operationalQueries.set(hosComplianceQuery.name, hosComplianceQuery);
operationalQueries.set(operationalTrendQuery.name, operationalTrendQuery);

// Default export
export default operationalQueries;