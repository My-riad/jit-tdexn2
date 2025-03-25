import mongoose, { Schema } from 'mongoose';

/**
 * Types of analytics queries for categorization
 */
export enum AnalyticsQueryType {
  /** Queries related to efficiency metrics */
  EFFICIENCY = 'EFFICIENCY',
  /** Queries related to financial metrics */
  FINANCIAL = 'FINANCIAL',
  /** Queries related to operational metrics */
  OPERATIONAL = 'OPERATIONAL',
  /** Queries related to driver performance */
  DRIVER = 'DRIVER',
  /** Custom queries that don't fit the standard categories */
  CUSTOM = 'CUSTOM'
}

/**
 * Types of aggregation operations that can be performed in queries
 */
export enum AggregationType {
  /** Sum operation */
  SUM = 'SUM',
  /** Average operation */
  AVG = 'AVG',
  /** Minimum value operation */
  MIN = 'MIN',
  /** Maximum value operation */
  MAX = 'MAX',
  /** Count operation */
  COUNT = 'COUNT'
}

/**
 * Time granularity options for time-based analytics queries
 */
export enum TimeGranularity {
  /** Day level granularity */
  DAY = 'DAY',
  /** Week level granularity */
  WEEK = 'WEEK',
  /** Month level granularity */
  MONTH = 'MONTH',
  /** Quarter level granularity */
  QUARTER = 'QUARTER',
  /** Year level granularity */
  YEAR = 'YEAR'
}

/**
 * Filter operators for query conditions
 */
export enum FilterOperator {
  /** Equals operator (=) */
  EQUALS = 'EQUALS',
  /** Not equals operator (!=) */
  NOT_EQUALS = 'NOT_EQUALS',
  /** Greater than operator (>) */
  GREATER_THAN = 'GREATER_THAN',
  /** Less than operator (<) */
  LESS_THAN = 'LESS_THAN',
  /** Greater than or equal to operator (>=) */
  GREATER_THAN_EQUALS = 'GREATER_THAN_EQUALS',
  /** Less than or equal to operator (<=) */
  LESS_THAN_EQUALS = 'LESS_THAN_EQUALS',
  /** Contains substring operator */
  CONTAINS = 'CONTAINS',
  /** Does not contain substring operator */
  NOT_CONTAINS = 'NOT_CONTAINS',
  /** In array operator */
  IN = 'IN',
  /** Not in array operator */
  NOT_IN = 'NOT_IN',
  /** Between two values operator */
  BETWEEN = 'BETWEEN'
}

/**
 * Sort directions for query results
 */
export enum SortDirection {
  /** Ascending order */
  ASC = 'ASC',
  /** Descending order */
  DESC = 'DESC'
}

/**
 * Interface defining the structure of a query field
 */
export interface IQueryField {
  /** The field name or path in the data */
  field: string;
  /** Optional alias for the field in results */
  alias?: string;
  /** Optional data type for the field */
  dataType?: string;
}

/**
 * Interface defining the structure of a query filter condition
 */
export interface IQueryFilter {
  /** The field name to filter on */
  field: string;
  /** The operator to apply to the field */
  operator: FilterOperator;
  /** The value to compare against */
  value: any;
}

/**
 * Interface defining the structure of a query aggregation operation
 */
export interface IQueryAggregation {
  /** The type of aggregation to perform */
  type: AggregationType;
  /** The field to aggregate */
  field: string;
  /** Optional alias for the aggregation result */
  alias?: string;
}

/**
 * Interface defining the structure of a query sort specification
 */
export interface IQuerySort {
  /** The field to sort by */
  field: string;
  /** The direction to sort */
  direction: SortDirection;
}

/**
 * Main interface defining the complete structure of an analytics query
 */
export interface IAnalyticsQuery {
  /** The name of the query */
  name: string;
  /** Optional description of the query's purpose */
  description?: string;
  /** The category of the query */
  type: AnalyticsQueryType;
  /** The database collection to query */
  collection: string;
  /** The fields to select in the query */
  fields: IQueryField[];
  /** Optional filter conditions for the query */
  filters?: IQueryFilter[];
  /** Optional aggregation operations to perform */
  aggregations?: IQueryAggregation[];
  /** Optional fields to group by */
  groupBy?: string[];
  /** Optional sort specifications */
  sort?: IQuerySort[];
  /** Optional limit on results returned */
  limit?: number;
  /** Optional offset for pagination */
  offset?: number;
  /** Optional time granularity for time-based queries */
  timeGranularity?: TimeGranularity;
  /** Optional dynamic parameters for the query */
  parameters?: Record<string, any>;
  /** The user or service that created the query */
  createdBy: string;
  /** When the query was created */
  createdAt: Date;
  /** When the query was last updated */
  updatedAt: Date;
}

// Schema definitions
const queryFieldSchema = new Schema({
  field: { type: String, required: true },
  alias: { type: String },
  dataType: { type: String }
}, { _id: false });

const queryFilterSchema = new Schema({
  field: { type: String, required: true },
  operator: { 
    type: String, 
    enum: Object.values(FilterOperator), 
    required: true 
  },
  value: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

const queryAggregationSchema = new Schema({
  type: { 
    type: String, 
    enum: Object.values(AggregationType), 
    required: true 
  },
  field: { type: String, required: true },
  alias: { type: String }
}, { _id: false });

const querySortSchema = new Schema({
  field: { type: String, required: true },
  direction: { 
    type: String, 
    enum: Object.values(SortDirection), 
    required: true 
  }
}, { _id: false });

/**
 * Mongoose schema definition for analytics queries
 */
export const analyticsQuerySchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    index: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  type: { 
    type: String, 
    enum: Object.values(AnalyticsQueryType), 
    required: true,
    index: true
  },
  collection: { 
    type: String, 
    required: true, 
    trim: true,
    index: true
  },
  fields: { 
    type: [queryFieldSchema], 
    required: true 
  },
  filters: { 
    type: [queryFilterSchema], 
    default: [] 
  },
  aggregations: { 
    type: [queryAggregationSchema], 
    default: [] 
  },
  groupBy: { 
    type: [String], 
    default: [] 
  },
  sort: { 
    type: [querySortSchema], 
    default: [] 
  },
  limit: { 
    type: Number, 
    min: 0 
  },
  offset: { 
    type: Number, 
    min: 0, 
    default: 0 
  },
  timeGranularity: { 
    type: String, 
    enum: Object.values(TimeGranularity) 
  },
  parameters: { 
    type: Schema.Types.Mixed, 
    default: () => ({}) 
  },
  createdBy: { 
    type: String, 
    required: true,
    index: true
  }
}, { 
  timestamps: true, 
  versionKey: false,
  collection: 'analytics_queries'
});

// Add indexes for commonly queried fields
analyticsQuerySchema.index({ createdAt: 1 });
analyticsQuerySchema.index({ type: 1, createdAt: -1 });
analyticsQuerySchema.index({ createdBy: 1, type: 1 });

/**
 * Mongoose model for analytics queries
 */
export const AnalyticsQuery = mongoose.model<IAnalyticsQuery & mongoose.Document>('AnalyticsQuery', analyticsQuerySchema);

export default AnalyticsQuery;