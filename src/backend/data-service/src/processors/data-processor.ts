import _ from 'lodash'; // lodash@^4.17.21
import moment from 'moment'; // moment@^2.29.4
import { IAnalyticsQuery, AggregationType } from '../models/analytics-query.model';
import { formatDate, parseDate } from '../../../common/utils/date-time';
import logger from '../../../common/utils/logger';

/**
 * Formats a numeric value with specified precision and optional units
 * 
 * @param value - The numeric value to format
 * @param precision - The number of decimal places (default: 2)
 * @param unit - Optional unit to append to the formatted value
 * @returns Formatted numeric value with unit if provided
 */
export function formatNumericValue(value: number, precision: number = 2, unit?: string): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  
  const roundedValue = Number(value.toFixed(precision));
  const formattedValue = roundedValue.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
  
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * Formats a decimal value as a percentage with specified precision
 * 
 * @param value - The decimal value to format as percentage (e.g., 0.75 for 75%)
 * @param precision - The number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, precision: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  
  const percentValue = value * 100;
  const roundedValue = Number(percentValue.toFixed(precision));
  const formattedValue = roundedValue.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
  
  return `${formattedValue}%`;
}

/**
 * Formats a numeric value as currency with specified currency code
 * 
 * @param value - The numeric value to format as currency
 * @param currencyCode - The ISO currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currencyCode: string = 'USD'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Normalizes field names to a consistent format for processing
 * 
 * @param fieldName - Field name to normalize
 * @returns Normalized field name
 */
function normalizeFieldName(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Detects the data type of a value for appropriate formatting
 * 
 * @param value - Value to detect type for
 * @returns Detected data type as string
 */
function detectDataType(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  if (value instanceof Date) {
    return 'date';
  }
  
  if (typeof value === 'string') {
    // Check if string is a date
    const parsedDate = moment(value, moment.ISO_8601, true);
    if (parsedDate.isValid()) {
      return 'date';
    }
    return 'string';
  }
  
  if (typeof value === 'number') {
    return 'number';
  }
  
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  
  if (Array.isArray(value)) {
    return 'array';
  }
  
  if (typeof value === 'object') {
    return 'object';
  }
  
  return 'string';
}

/**
 * Aggregates data based on specified aggregation type and field
 * 
 * @param data - Array of data records to aggregate
 * @param field - Field to aggregate
 * @param aggregationType - Type of aggregation to perform
 * @returns Aggregated value
 */
function aggregateData(
  data: Array<Record<string, any>>,
  field: string,
  aggregationType: AggregationType
): number {
  // Filter out null/undefined values
  const validData = data.filter(record => 
    record[field] !== null && 
    record[field] !== undefined && 
    !isNaN(Number(record[field]))
  );
  
  // Extract values
  const values = validData.map(record => Number(record[field]));
  
  // Handle empty array case
  if (values.length === 0) {
    return 0;
  }
  
  // Perform aggregation
  switch (aggregationType) {
    case AggregationType.SUM:
      return _.sum(values);
    
    case AggregationType.AVG:
      return _.mean(values);
    
    case AggregationType.MIN:
      return _.min(values) || 0;
    
    case AggregationType.MAX:
      return _.max(values) || 0;
    
    case AggregationType.COUNT:
      return values.length;
    
    default:
      logger.error(`Unsupported aggregation type: ${aggregationType}`);
      return 0;
  }
}

/**
 * Groups data by specified field(s) for aggregation and analysis
 * 
 * @param data - Array of data records to group
 * @param fields - Field(s) to group by
 * @returns Grouped data object
 */
function groupDataBy(
  data: Array<Record<string, any>>,
  fields: string | string[]
): Record<string, Array<Record<string, any>>> {
  const fieldArray = Array.isArray(fields) ? fields : [fields];
  
  if (fieldArray.length === 1) {
    return _.groupBy(data, fieldArray[0]);
  }
  
  // For multiple fields, create a composite key
  return _.groupBy(data, (record) => {
    return fieldArray.map(field => {
      const value = record[field];
      return value !== null && value !== undefined ? value.toString() : 'null';
    }).join('|');
  });
}

/**
 * Pivots data to transform rows into columns for cross-tabulation
 * 
 * @param data - Array of data records to pivot
 * @param rowField - Field to use for rows
 * @param columnField - Field to use for columns
 * @param valueField - Field containing values to aggregate
 * @param aggregationType - Type of aggregation to perform
 * @returns Pivoted data array
 */
function pivotData(
  data: Array<Record<string, any>>,
  rowField: string,
  columnField: string,
  valueField: string,
  aggregationType: AggregationType
): Array<Record<string, any>> {
  // Group data by row field
  const groupedByRow = groupDataBy(data, rowField);
  
  // Create result array
  const result: Array<Record<string, any>> = [];
  
  // Process each row group
  Object.entries(groupedByRow).forEach(([rowValue, rowData]) => {
    // Create a record for this row
    const record: Record<string, any> = {
      [rowField]: rowValue
    };
    
    // Group row data by column field
    const groupedByColumn = groupDataBy(rowData, columnField);
    
    // Process each column group
    Object.entries(groupedByColumn).forEach(([columnValue, columnData]) => {
      // Aggregate values for this column
      const aggregatedValue = aggregateData(columnData, valueField, aggregationType);
      
      // Add to record
      record[columnValue] = aggregatedValue;
    });
    
    // Add record to result
    result.push(record);
  });
  
  return result;
}

/**
 * Calculates trend data for time-series analysis
 * 
 * @param data - Array of data records to analyze
 * @param dateField - Field containing date values
 * @param valueField - Field containing values to track
 * @param interval - Time interval for grouping ('day', 'week', 'month')
 * @returns Trend data with calculated metrics
 */
function calculateTrends(
  data: Array<Record<string, any>>,
  dateField: string,
  valueField: string,
  interval: string
): Array<Record<string, any>> {
  // Sort data by date
  const sortedData = _.sortBy(data, (record) => {
    const dateValue = record[dateField];
    return moment(dateValue).valueOf();
  });
  
  // Group data by interval
  const groupedData: Record<string, Array<Record<string, any>>> = {};
  
  sortedData.forEach(record => {
    const dateValue = record[dateField];
    if (!dateValue) return;
    
    const momentDate = moment(dateValue);
    let intervalKey: string;
    
    switch (interval) {
      case 'day':
        intervalKey = momentDate.format('YYYY-MM-DD');
        break;
      case 'week':
        intervalKey = `${momentDate.year()}-W${momentDate.isoWeek()}`;
        break;
      case 'month':
        intervalKey = momentDate.format('YYYY-MM');
        break;
      default:
        intervalKey = momentDate.format('YYYY-MM-DD');
    }
    
    if (!groupedData[intervalKey]) {
      groupedData[intervalKey] = [];
    }
    
    groupedData[intervalKey].push(record);
  });
  
  // Calculate aggregated values for each interval
  const trendData: Array<Record<string, any>> = [];
  let previousValue: number | null = null;
  
  Object.entries(groupedData)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .forEach(([intervalKey, intervalData], index) => {
      // Calculate aggregated value
      const value = aggregateData(intervalData, valueField, AggregationType.AVG);
      
      // Create trend record
      const trendRecord: Record<string, any> = {
        interval: intervalKey,
        value: value,
        count: intervalData.length
      };
      
      // Calculate change and growth rate if not first interval
      if (previousValue !== null) {
        const change = value - previousValue;
        const growthRate = previousValue !== 0 ? (change / previousValue) : 0;
        
        trendRecord.change = change;
        trendRecord.growthRate = growthRate;
      }
      
      // Calculate moving average (3-period)
      if (index >= 2 && trendData.length >= 2) {
        const sumLast3 = 
          value + 
          trendData[trendData.length - 1].value + 
          trendData[trendData.length - 2].value;
        
        trendRecord.movingAvg3 = sumLast3 / 3;
      }
      
      trendData.push(trendRecord);
      previousValue = value;
    });
  
  return trendData;
}

/**
 * Calculates percentile values for a dataset
 * 
 * @param values - Array of numeric values
 * @param percentiles - Array of percentiles to calculate (0-100)
 * @returns Object with percentile values
 */
function calculatePercentiles(
  values: Array<number>,
  percentiles: Array<number>
): Record<string, number> {
  // Handle empty array
  if (values.length === 0) {
    return percentiles.reduce((result, percentile) => {
      result[`p${percentile}`] = 0;
      return result;
    }, {} as Record<string, number>);
  }
  
  // Sort values
  const sortedValues = [...values].sort((a, b) => a - b);
  const result: Record<string, number> = {};
  
  // Calculate each percentile
  percentiles.forEach(percentile => {
    if (percentile < 0 || percentile > 100) {
      throw new Error(`Invalid percentile: ${percentile}. Must be between 0 and 100.`);
    }
    
    if (percentile === 0) {
      result[`p${percentile}`] = sortedValues[0];
      return;
    }
    
    if (percentile === 100) {
      result[`p${percentile}`] = sortedValues[sortedValues.length - 1];
      return;
    }
    
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    
    if (lowerIndex === upperIndex) {
      result[`p${percentile}`] = sortedValues[lowerIndex];
    } else {
      const weight = index - lowerIndex;
      result[`p${percentile}`] = 
        sortedValues[lowerIndex] * (1 - weight) + 
        sortedValues[upperIndex] * weight;
    }
  });
  
  return result;
}

/**
 * Class that handles data processing, transformation, and enrichment for analytics and reporting
 */
export class DataProcessor {
  private formatters: Map<string, Function>;
  private transformers: Map<string, Function>;
  
  /**
   * Creates a new DataProcessor instance with registered formatters and transformers
   */
  constructor() {
    // Initialize formatters map
    this.formatters = new Map<string, Function>();
    
    // Register default formatters
    this.formatters.set('number', (value: number, options: any = {}) => {
      const { precision = 2, unit } = options;
      return formatNumericValue(value, precision, unit);
    });
    
    this.formatters.set('percentage', (value: number, options: any = {}) => {
      const { precision = 1 } = options;
      return formatPercentage(value, precision);
    });
    
    this.formatters.set('currency', (value: number, options: any = {}) => {
      const { currencyCode = 'USD' } = options;
      return formatCurrency(value, currencyCode);
    });
    
    this.formatters.set('date', (value: Date | string, options: any = {}) => {
      const { format = 'MM/DD/YYYY' } = options;
      return formatDate(value, format);
    });
    
    // Initialize transformers map
    this.transformers = new Map<string, Function>();
    
    // Register default transformers
    this.transformers.set('groupBy', groupDataBy);
    this.transformers.set('pivot', pivotData);
    this.transformers.set('trend', calculateTrends);
    this.transformers.set('percentile', calculatePercentiles);
  }
  
  /**
   * Processes raw data based on query definition and transformation rules
   * 
   * @param rawData - Array of raw data records to process
   * @param queryDefinition - Analytics query definition
   * @returns Processed data ready for visualization or export
   */
  processData(
    rawData: Array<Record<string, any>>,
    queryDefinition: IAnalyticsQuery
  ): Array<Record<string, any>> {
    try {
      logger.info(`Processing data for query: ${queryDefinition.name}`, {
        queryType: queryDefinition.type,
        recordCount: rawData.length
      });
      
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        logger.info('No data to process, returning empty array');
        return [];
      }
      
      // Create a copy of the raw data to avoid modifying the original
      let processedData = _.cloneDeep(rawData);
      
      // Apply field selection if fields are specified
      if (queryDefinition.fields && queryDefinition.fields.length > 0) {
        processedData = processedData.map(record => {
          const result: Record<string, any> = {};
          
          queryDefinition.fields.forEach(fieldDef => {
            const { field, alias } = fieldDef;
            const resultKey = alias || field;
            
            if (field.includes('.')) {
              // Handle nested fields using lodash get
              result[resultKey] = _.get(record, field);
            } else {
              result[resultKey] = record[field];
            }
          });
          
          return result;
        });
      }
      
      // Apply field renaming (in case any fields were specified without aliases)
      if (queryDefinition.fields && queryDefinition.fields.length > 0) {
        processedData = processedData.map(record => {
          const result: Record<string, any> = {};
          
          Object.keys(record).forEach(key => {
            const fieldDef = queryDefinition.fields.find(f => f.field === key);
            if (fieldDef && fieldDef.alias) {
              result[fieldDef.alias] = record[key];
            } else {
              result[key] = record[key];
            }
          });
          
          return result;
        });
      }
      
      // Apply data type conversions if specified
      if (queryDefinition.fields && queryDefinition.fields.length > 0) {
        processedData = processedData.map(record => {
          const result = { ...record };
          
          queryDefinition.fields.forEach(fieldDef => {
            const { field, alias, dataType } = fieldDef;
            const resultKey = alias || field;
            
            if (dataType && result[resultKey] !== undefined && result[resultKey] !== null) {
              switch (dataType.toLowerCase()) {
                case 'number':
                  result[resultKey] = Number(result[resultKey]);
                  break;
                
                case 'string':
                  result[resultKey] = String(result[resultKey]);
                  break;
                
                case 'boolean':
                  result[resultKey] = Boolean(result[resultKey]);
                  break;
                
                case 'date':
                  if (!(result[resultKey] instanceof Date)) {
                    try {
                      result[resultKey] = parseDate(result[resultKey]);
                    } catch (error) {
                      logger.error(`Failed to parse date for field ${resultKey}`, { 
                        error, 
                        value: result[resultKey] 
                      });
                    }
                  }
                  break;
              }
            }
          });
          
          return result;
        });
      }
      
      // Apply filters if specified
      if (queryDefinition.filters && queryDefinition.filters.length > 0) {
        processedData = processedData.filter(record => {
          return queryDefinition.filters!.every(filter => {
            const { field, operator, value } = filter;
            const recordValue = record[field];
            
            // Skip null/undefined values
            if (recordValue === undefined || recordValue === null) {
              return false;
            }
            
            switch (operator) {
              case 'EQUALS':
                return recordValue == value;
              
              case 'NOT_EQUALS':
                return recordValue != value;
              
              case 'GREATER_THAN':
                return recordValue > value;
              
              case 'LESS_THAN':
                return recordValue < value;
              
              case 'GREATER_THAN_EQUALS':
                return recordValue >= value;
              
              case 'LESS_THAN_EQUALS':
                return recordValue <= value;
              
              case 'CONTAINS':
                return String(recordValue).includes(String(value));
              
              case 'NOT_CONTAINS':
                return !String(recordValue).includes(String(value));
              
              case 'IN':
                return Array.isArray(value) && value.includes(recordValue);
              
              case 'NOT_IN':
                return Array.isArray(value) && !value.includes(recordValue);
              
              case 'BETWEEN':
                return Array.isArray(value) && 
                  value.length === 2 && 
                  recordValue >= value[0] && 
                  recordValue <= value[1];
              
              default:
                logger.warn(`Unsupported filter operator: ${operator}`);
                return true;
            }
          });
        });
      }
      
      // Apply aggregations if specified
      if (queryDefinition.aggregations && queryDefinition.aggregations.length > 0) {
        processedData = this.applyAggregations(processedData, queryDefinition);
      }
      
      // Apply grouping if specified
      if (queryDefinition.groupBy && queryDefinition.groupBy.length > 0) {
        processedData = this.applyGrouping(processedData, queryDefinition);
      }
      
      // Apply sorting if specified
      if (queryDefinition.sort && queryDefinition.sort.length > 0) {
        processedData = this.applySorting(processedData, queryDefinition);
      }
      
      // Apply pagination if limit and offset are specified
      if (queryDefinition.limit !== undefined || queryDefinition.offset !== undefined) {
        processedData = this.applyPagination(processedData, queryDefinition);
      }
      
      logger.info(`Data processing completed for query: ${queryDefinition.name}`, {
        recordCount: processedData.length
      });
      
      return processedData;
    } catch (error) {
      logger.error('Error processing data', { error, queryName: queryDefinition.name });
      throw error;
    }
  }
  
  /**
   * Registers a custom formatter function for specific data types
   * 
   * @param dataType - The data type to register formatter for
   * @param formatterFn - The formatter function
   */
  registerFormatter(dataType: string, formatterFn: Function): void {
    if (typeof formatterFn !== 'function') {
      throw new Error('Formatter must be a function');
    }
    
    this.formatters.set(dataType.toLowerCase(), formatterFn);
    logger.info(`Registered formatter for data type: ${dataType}`);
  }
  
  /**
   * Registers a custom transformer function for specific transformations
   * 
   * @param transformationType - The transformation type to register
   * @param transformerFn - The transformer function
   */
  registerTransformer(transformationType: string, transformerFn: Function): void {
    if (typeof transformerFn !== 'function') {
      throw new Error('Transformer must be a function');
    }
    
    this.transformers.set(transformationType.toLowerCase(), transformerFn);
    logger.info(`Registered transformer for type: ${transformationType}`);
  }
  
  /**
   * Formats a field value based on its data type and formatting options
   * 
   * @param value - The value to format
   * @param dataType - The data type of the value
   * @param options - Formatting options
   * @returns Formatted value
   */
  formatField(value: any, dataType?: string, options: any = {}): any {
    if (value === null || value === undefined) {
      return null;
    }
    
    // Detect data type if not provided
    const effectiveDataType = dataType || detectDataType(value);
    
    // Get formatter for data type
    const formatter = this.formatters.get(effectiveDataType.toLowerCase());
    
    if (formatter) {
      try {
        return formatter(value, options);
      } catch (error) {
        logger.error(`Error formatting value of type ${effectiveDataType}`, { error, value });
        return value;
      }
    }
    
    // Return original value if no formatter found
    return value;
  }
  
  /**
   * Applies a specific transformation to the data
   * 
   * @param data - Data to transform
   * @param transformationType - Type of transformation to apply
   * @param options - Transformation options
   * @returns Transformed data
   */
  transformData(
    data: Array<Record<string, any>>,
    transformationType: string,
    options: any = {}
  ): Array<Record<string, any>> {
    // Get transformer for transformation type
    const transformer = this.transformers.get(transformationType.toLowerCase());
    
    if (transformer) {
      try {
        return transformer(data, options);
      } catch (error) {
        logger.error(`Error applying transformation ${transformationType}`, { error });
        return data;
      }
    }
    
    // Return original data if no transformer found
    logger.warn(`No transformer found for type: ${transformationType}`);
    return data;
  }
  
  /**
   * Applies aggregations to the data based on query definition
   * 
   * @param data - Data to aggregate
   * @param queryDefinition - Analytics query definition
   * @returns Data with aggregations applied
   */
  applyAggregations(
    data: Array<Record<string, any>>,
    queryDefinition: IAnalyticsQuery
  ): Array<Record<string, any>> {
    // If no aggregations, return original data
    if (!queryDefinition.aggregations || queryDefinition.aggregations.length === 0) {
      return data;
    }
    
    // If groupBy fields are specified, we need to group the data first
    if (queryDefinition.groupBy && queryDefinition.groupBy.length > 0) {
      // Group the data
      const groupedData = this.applyGrouping(data, queryDefinition);
      
      // Apply aggregations to each group
      return groupedData;
    }
    
    // Apply aggregations to the entire dataset
    const result: Record<string, any> = {};
    
    // Add groupBy fields if specified
    if (queryDefinition.groupBy && queryDefinition.groupBy.length > 0) {
      queryDefinition.groupBy.forEach(groupField => {
        result[groupField] = 'All'; // Use 'All' as a placeholder for the total
      });
    }
    
    // Apply each aggregation
    queryDefinition.aggregations.forEach(agg => {
      const { field, type, alias } = agg;
      const resultField = alias || `${type}_${field}`;
      result[resultField] = aggregateData(data, field, type);
    });
    
    return [result];
  }
  
  /**
   * Groups data based on groupBy fields in the query definition
   * 
   * @param data - Data to group
   * @param queryDefinition - Analytics query definition
   * @returns Grouped data
   */
  applyGrouping(
    data: Array<Record<string, any>>,
    queryDefinition: IAnalyticsQuery
  ): Array<Record<string, any>> {
    // If no groupBy fields, return original data
    if (!queryDefinition.groupBy || queryDefinition.groupBy.length === 0) {
      return data;
    }
    
    // Group the data
    const grouped = groupDataBy(data, queryDefinition.groupBy);
    
    // Transform grouped data into an array format
    return Object.entries(grouped).map(([groupKey, groupData]) => {
      const result: Record<string, any> = {};
      
      // Parse group key if it's a composite key
      if (queryDefinition.groupBy!.length > 1) {
        const groupValues = groupKey.split('|');
        queryDefinition.groupBy!.forEach((field, index) => {
          result[field] = groupValues[index];
        });
      } else {
        result[queryDefinition.groupBy![0]] = groupKey;
      }
      
      // Apply aggregations if specified
      if (queryDefinition.aggregations && queryDefinition.aggregations.length > 0) {
        queryDefinition.aggregations.forEach(agg => {
          const { field, type, alias } = agg;
          const resultField = alias || `${type}_${field}`;
          result[resultField] = aggregateData(groupData, field, type);
        });
      } else {
        // If no aggregations, add count
        result.count = groupData.length;
      }
      
      return result;
    });
  }
  
  /**
   * Sorts data based on sort criteria in the query definition
   * 
   * @param data - Data to sort
   * @param queryDefinition - Analytics query definition
   * @returns Sorted data
   */
  applySorting(
    data: Array<Record<string, any>>,
    queryDefinition: IAnalyticsQuery
  ): Array<Record<string, any>> {
    // If no sort criteria, return original data
    if (!queryDefinition.sort || queryDefinition.sort.length === 0) {
      return data;
    }
    
    const fields: string[] = [];
    const orders: boolean[] = [];
    
    queryDefinition.sort.forEach(sortCriteria => {
      fields.push(sortCriteria.field);
      orders.push(sortCriteria.direction === 'ASC');
    });
    
    return _.orderBy(data, fields, orders as ['asc' | 'desc']);
  }
  
  /**
   * Applies pagination to the data based on limit and offset in the query definition
   * 
   * @param data - Data to paginate
   * @param queryDefinition - Analytics query definition
   * @returns Paginated data
   */
  applyPagination(
    data: Array<Record<string, any>>,
    queryDefinition: IAnalyticsQuery
  ): Array<Record<string, any>> {
    const offset = queryDefinition.offset || 0;
    
    if (queryDefinition.limit !== undefined) {
      return _.slice(data, offset, offset + queryDefinition.limit);
    }
    
    if (offset > 0) {
      return _.slice(data, offset);
    }
    
    return data;
  }
  
  /**
   * Enriches data with additional calculated fields or metadata
   * 
   * @param data - Data to enrich
   * @param enrichmentOptions - Options for enrichment
   * @returns Enriched data
   */
  enrichData(
    data: Array<Record<string, any>>,
    enrichmentOptions: any = {}
  ): Array<Record<string, any>> {
    const { 
      calculatedFields = [],
      metadata = {},
      addStatistics = false,
      percentiles = []
    } = enrichmentOptions;
    
    let enrichedData = _.cloneDeep(data);
    
    // Add calculated fields
    if (calculatedFields.length > 0) {
      enrichedData = enrichedData.map(record => {
        const result = { ...record };
        
        calculatedFields.forEach(calcField => {
          const { name, formula, parameters } = calcField;
          
          try {
            // Create function from formula string
            const formulaFn = new Function(...Object.keys(parameters), 'record', `return ${formula}`);
            
            // Execute formula with parameters and record
            result[name] = formulaFn(...Object.values(parameters), record);
          } catch (error) {
            logger.error(`Error calculating field ${name}`, { error, formula });
            result[name] = null;
          }
        });
        
        return result;
      });
    }
    
    // Add metadata
    if (Object.keys(metadata).length > 0) {
      const metadataObject = {
        _metadata: metadata
      };
      
      // Add metadata to the first record only, will be extracted by client
      if (enrichedData.length > 0) {
        enrichedData[0] = { ...enrichedData[0], ...metadataObject };
      } else {
        enrichedData = [metadataObject as Record<string, any>];
      }
    }
    
    // Add statistics
    if (addStatistics) {
      const statistics: Record<string, any> = {
        _statistics: {
          count: data.length
        }
      };
      
      // Find numeric fields
      const numericFields = Object.keys(data[0] || {}).filter(key => {
        return data.some(record => typeof record[key] === 'number');
      });
      
      // Calculate statistics for numeric fields
      numericFields.forEach(field => {
        const values = data
          .map(record => record[field])
          .filter(val => val !== null && val !== undefined && !isNaN(Number(val)))
          .map(val => Number(val));
        
        if (values.length > 0) {
          statistics._statistics[field] = {
            min: _.min(values),
            max: _.max(values),
            avg: _.mean(values),
            sum: _.sum(values),
            count: values.length
          };
          
          // Add percentiles if requested
          if (percentiles.length > 0) {
            statistics._statistics[field].percentiles = 
              calculatePercentiles(values, percentiles);
          }
        }
      });
      
      // Add statistics to the first record only, will be extracted by client
      if (enrichedData.length > 0) {
        enrichedData[0] = { ...enrichedData[0], ...statistics };
      } else {
        enrichedData = [statistics as Record<string, any>];
      }
    }
    
    return enrichedData;
  }
  
  /**
   * Prepares data specifically for visualization requirements
   * 
   * @param data - Data to prepare for visualization
   * @param visualizationType - Type of visualization (chart, table, map, gauge)
   * @param options - Visualization-specific options
   * @returns Data formatted for the specific visualization type
   */
  prepareForVisualization(
    data: Array<Record<string, any>>,
    visualizationType: string,
    options: any = {}
  ): object {
    switch (visualizationType.toLowerCase()) {
      case 'chart':
        return this.prepareForChart(data, options);
      
      case 'table':
        return this.prepareForTable(data, options);
      
      case 'map':
        return this.prepareForMap(data, options);
      
      case 'gauge':
        return this.prepareForGauge(data, options);
      
      default:
        logger.warn(`Unsupported visualization type: ${visualizationType}`);
        return { data };
    }
  }
  
  /**
   * Prepares data for export to various formats (CSV, Excel, JSON)
   * 
   * @param data - Data to prepare for export
   * @param exportFormat - Export format (csv, excel, json)
   * @param options - Export-specific options
   * @returns Data formatted for export
   */
  prepareForExport(
    data: Array<Record<string, any>>,
    exportFormat: string,
    options: any = {}
  ): Array<Record<string, any>> {
    const { 
      flattenObjects = true,
      includeHeaders = true,
      columnOrder = [],
      headerMap = {}
    } = options;
    
    let exportData = _.cloneDeep(data);
    
    // Remove metadata and statistics
    exportData = exportData.map(record => {
      const result = { ...record };
      delete result._metadata;
      delete result._statistics;
      return result;
    });
    
    // Flatten nested objects if needed
    if (flattenObjects) {
      exportData = exportData.map(record => {
        const flatRecord: Record<string, any> = {};
        
        // Recursively flatten nested objects
        const flatten = (obj: Record<string, any>, prefix = '') => {
          Object.entries(obj).forEach(([key, value]) => {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
              flatten(value, newKey);
            } else {
              flatRecord[newKey] = value;
            }
          });
        };
        
        flatten(record);
        return flatRecord;
      });
    }
    
    // Apply column ordering if specified
    if (columnOrder.length > 0) {
      exportData = exportData.map(record => {
        const orderedRecord: Record<string, any> = {};
        
        // Add columns in specified order
        columnOrder.forEach(column => {
          if (record[column] !== undefined) {
            orderedRecord[column] = record[column];
          }
        });
        
        // Add remaining columns
        Object.entries(record).forEach(([key, value]) => {
          if (!columnOrder.includes(key)) {
            orderedRecord[key] = value;
          }
        });
        
        return orderedRecord;
      });
    }
    
    // Apply header mapping if specified
    if (Object.keys(headerMap).length > 0 && includeHeaders) {
      // For CSV and Excel, handle in the actual export implementation
      // For JSON, we can rename the keys here
      if (exportFormat.toLowerCase() === 'json') {
        exportData = exportData.map(record => {
          const mappedRecord: Record<string, any> = {};
          
          Object.entries(record).forEach(([key, value]) => {
            const mappedKey = headerMap[key] || key;
            mappedRecord[mappedKey] = value;
          });
          
          return mappedRecord;
        });
      }
    }
    
    // Format values based on export format
    switch (exportFormat.toLowerCase()) {
      case 'csv':
      case 'excel':
        // For CSV and Excel, convert all values to strings
        exportData = exportData.map(record => {
          const formattedRecord: Record<string, any> = {};
          
          Object.entries(record).forEach(([key, value]) => {
            if (value instanceof Date) {
              formattedRecord[key] = formatDate(value, 'yyyy-MM-dd HH:mm:ss');
            } else if (Array.isArray(value)) {
              formattedRecord[key] = JSON.stringify(value);
            } else if (value !== null && typeof value === 'object') {
              formattedRecord[key] = JSON.stringify(value);
            } else {
              formattedRecord[key] = value;
            }
          });
          
          return formattedRecord;
        });
        break;
      
      case 'json':
        // For JSON, leave as is
        break;
      
      default:
        logger.warn(`Unsupported export format: ${exportFormat}`);
    }
    
    return exportData;
  }
  
  // Private helper methods for visualization preparation
  
  private prepareForChart(data: Array<Record<string, any>>, options: any): object {
    const { 
      categoryField, 
      seriesField,
      valueField,
      chartType = 'bar',
      multiSeries = false
    } = options;
    
    if (!categoryField || !valueField) {
      logger.error('Category field and value field are required for chart preparation');
      return { data };
    }
    
    if (multiSeries && !seriesField) {
      logger.error('Series field is required for multi-series charts');
      return { data };
    }
    
    if (multiSeries) {
      // Prepare multi-series chart data
      const seriesMap: Record<string, Array<Record<string, any>>> = {};
      
      // Group by series
      data.forEach(record => {
        const seriesValue = String(record[seriesField]);
        
        if (!seriesMap[seriesValue]) {
          seriesMap[seriesValue] = [];
        }
        
        seriesMap[seriesValue].push(record);
      });
      
      // Create series array
      const series = Object.entries(seriesMap).map(([seriesName, seriesData]) => {
        return {
          name: seriesName,
          data: seriesData.map(record => ({
            category: record[categoryField],
            value: record[valueField]
          }))
        };
      });
      
      // Extract unique categories
      const categories = _.uniq(data.map(record => record[categoryField]));
      
      return {
        chartType,
        categories,
        series
      };
    } else {
      // Prepare single-series chart data
      const categories = data.map(record => record[categoryField]);
      const values = data.map(record => record[valueField]);
      
      return {
        chartType,
        categories,
        series: [
          {
            name: valueField,
            data: values
          }
        ]
      };
    }
  }
  
  private prepareForTable(data: Array<Record<string, any>>, options: any): object {
    const { 
      columns = [],
      pagination = true,
      formatters = {}
    } = options;
    
    // If columns are specified, use them
    let tableColumns = columns;
    
    // Otherwise, derive columns from data
    if (tableColumns.length === 0 && data.length > 0) {
      tableColumns = Object.keys(data[0]).map(key => ({
        field: key,
        header: key
      }));
    }
    
    // Apply formatters if specified
    let tableData = data;
    
    if (Object.keys(formatters).length > 0) {
      tableData = data.map(record => {
        const formattedRecord = { ...record };
        
        Object.entries(formatters).forEach(([field, formatter]) => {
          if (record[field] !== undefined) {
            formattedRecord[field] = this.formatField(
              record[field], 
              formatter.type, 
              formatter.options
            );
          }
        });
        
        return formattedRecord;
      });
    }
    
    return {
      columns: tableColumns,
      data: tableData,
      pagination
    };
  }
  
  private prepareForMap(data: Array<Record<string, any>>, options: any): object {
    const { 
      latitudeField = 'latitude',
      longitudeField = 'longitude',
      valueField,
      labelField,
      colorField,
      colorScale = 'viridis',
      markerType = 'circle'
    } = options;
    
    // Prepare map data
    const mapData = data.map(record => {
      const mapPoint: Record<string, any> = {
        latitude: record[latitudeField],
        longitude: record[longitudeField]
      };
      
      if (valueField) {
        mapPoint.value = record[valueField];
      }
      
      if (labelField) {
        mapPoint.label = record[labelField];
      }
      
      if (colorField) {
        mapPoint.color = record[colorField];
      }
      
      // Include original record for tooltip/popup
      mapPoint.properties = { ...record };
      
      return mapPoint;
    });
    
    return {
      type: 'point',
      data: mapData,
      markerType,
      colorScale
    };
  }
  
  private prepareForGauge(data: Array<Record<string, any>>, options: any): object {
    const { 
      valueField,
      minValue = 0,
      maxValue = 100,
      thresholds = []
    } = options;
    
    if (!valueField) {
      logger.error('Value field is required for gauge preparation');
      return { data };
    }
    
    // For gauge, we need a single value
    const value = data.length > 0 ? data[0][valueField] : 0;
    
    return {
      value,
      minValue,
      maxValue,
      thresholds
    };
  }
}

export default DataProcessor;