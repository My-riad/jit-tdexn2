import mongoose from 'mongoose'; // mongoose@^7.0.0
import { IAnalyticsQuery, AnalyticsQuery } from '../models/analytics-query.model';
import { AnalyticsQueryType } from '../models/analytics-query.model';
import { DataWarehouseService } from './data-warehouse.service';
import { efficiencyQueries } from '../queries/efficiency-queries';
import { driverQueries } from '../queries/driver-queries';
import { financialQueries } from '../queries/financial-queries';
import { operationalQueries } from '../queries/operational-queries';
import { DataProcessor } from '../processors/data-processor';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import _ from 'lodash'; // lodash@^4.17.21

/**
 * Service that provides analytics capabilities for the freight optimization platform
 */
export class AnalyticsService {
  private dataWarehouseService: DataWarehouseService;
  private dataProcessor: DataProcessor;

  /**
   * Creates a new AnalyticsService instance
   * @param dataWarehouseService - Data warehouse service for executing queries
   */
  constructor(dataWarehouseService: DataWarehouseService) {
    this.dataWarehouseService = dataWarehouseService;
    this.dataProcessor = new DataProcessor();
    logger.info('AnalyticsService initialized');
  }

  /**
   * Creates a new analytics query definition
   * @param queryData - Data for the new query
   * @returns Created query definition
   */
  async createQuery(queryData: IAnalyticsQuery): Promise<IAnalyticsQuery> {
    // Validate the query data
    this.validateQueryDefinition(queryData);

    try {
      // Create a new AnalyticsQuery document
      const newQuery = new AnalyticsQuery(queryData);

      // Save the document to the database
      const savedQuery = await newQuery.save();

      // Return the created query definition
      logger.info(`Analytics query created: ${savedQuery.name}`, { queryId: savedQuery.id });
      return savedQuery;
    } catch (error) {
      // Handle any errors during creation
      logger.error('Error creating analytics query', { error, queryData });
      throw createError('Failed to create analytics query', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves an analytics query by ID
   * @param queryId - ID of the query to retrieve
   * @returns Query definition or null if not found
   */
  async getQuery(queryId: string): Promise<IAnalyticsQuery | null> {
    // Validate the query ID
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      throw createError('Invalid query ID', { code: 'VAL_INVALID_INPUT', details: { queryId } });
    }

    try {
      // Find the query by ID in the database
      const query = await AnalyticsQuery.findById(queryId).lean();

      // Return the query or null if not found
      if (!query) {
        logger.warn(`Analytics query not found: ${queryId}`);
        return null;
      }

      logger.info(`Analytics query retrieved: ${query.name}`, { queryId: query.id });
      return query;
    } catch (error) {
      // Handle any errors during retrieval
      logger.error('Error retrieving analytics query', { error, queryId });
      throw createError('Failed to retrieve analytics query', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves analytics queries with optional filtering
   * @param filters - Filters to apply to the query
   * @returns Array of query definitions
   */
  async getQueries(filters: any): Promise<Array<IAnalyticsQuery>> {
    try {
      // Build a query based on the provided filters
      const query = AnalyticsQuery.find(filters).lean();

      // Execute the query to retrieve query definitions
      const queries = await query.exec();

      // Return the array of query definitions
      logger.info(`Retrieved ${queries.length} analytics queries`, { filters });
      return queries;
    } catch (error) {
      // Handle any errors during retrieval
      logger.error('Error retrieving analytics queries', { error, filters });
      throw createError('Failed to retrieve analytics queries', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Updates an existing analytics query
   * @param queryId - ID of the query to update
   * @param queryData - Data to update the query with
   * @returns Updated query or null if not found
   */
  async updateQuery(queryId: string, queryData: IAnalyticsQuery): Promise<IAnalyticsQuery | null> {
    // Validate the query ID and update data
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      throw createError('Invalid query ID', { code: 'VAL_INVALID_INPUT', details: { queryId } });
    }
    this.validateQueryDefinition(queryData);

    try {
      // Find the query by ID
      const query = await AnalyticsQuery.findById(queryId);

      // If not found, return null
      if (!query) {
        logger.warn(`Analytics query not found for update: ${queryId}`);
        return null;
      }

      // Update the query with the new data
      query.set(queryData);

      // Save the updated query
      const updatedQuery = await query.save();

      // Return the updated query
      logger.info(`Analytics query updated: ${updatedQuery.name}`, { queryId: updatedQuery.id });
      return updatedQuery;
    } catch (error) {
      // Handle any errors during update
      logger.error('Error updating analytics query', { error, queryId, queryData });
      throw createError('Failed to update analytics query', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Deletes an analytics query
   * @param queryId - ID of the query to delete
   * @returns True if deletion was successful
   */
  async deleteQuery(queryId: string): Promise<boolean> {
    // Validate the query ID
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      throw createError('Invalid query ID', { code: 'VAL_INVALID_INPUT', details: { queryId } });
    }

    try {
      // Find the query by ID
      const query = await AnalyticsQuery.findById(queryId);

      // If not found, return false
      if (!query) {
        logger.warn(`Analytics query not found for deletion: ${queryId}`);
        return false;
      }

      // Delete the query from the database
      await query.deleteOne();

      // Return true if deletion was successful
      logger.info(`Analytics query deleted: ${queryId}`);
      return true;
    } catch (error) {
      // Handle any errors during deletion
      logger.error('Error deleting analytics query', { error, queryId });
      throw createError('Failed to delete analytics query', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Executes an analytics query by ID with optional parameters
   * @param queryId - ID of the query to execute
   * @param parameters - Parameters to pass to the query
   * @param options - Options for query execution
   * @returns Query results
   */
  async executeQuery(queryId: string, parameters: any, options: any): Promise<Array<Record<string, any>>> {
    // Validate the query ID
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      throw createError('Invalid query ID', { code: 'VAL_INVALID_INPUT', details: { queryId } });
    }

    try {
      // Retrieve the query definition
      const queryDefinition = await this.getQuery(queryId);

      // If not found, throw an error
      if (!queryDefinition) {
        throw createError('Analytics query not found', { code: 'RES_ANALYTICS_QUERY_NOT_FOUND', details: { queryId } });
      }

      // Execute the query definition with the provided parameters
      return this.executeQueryDefinition(queryDefinition, parameters, options);
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error executing analytics query', { error, queryId, parameters, options });
      throw error;
    }
  }

  /**
   * Executes an analytics query from a definition object
   * @param queryDefinition - Query definition object
   * @param parameters - Parameters to pass to the query
   * @param options - Options for query execution
   * @returns Query results
   */
  async executeQueryDefinition(queryDefinition: IAnalyticsQuery, parameters: any, options: any): Promise<Array<Record<string, any>>> {
    // Validate the query definition
    this.validateQueryDefinition(queryDefinition);

    try {
      // Merge the provided parameters into the query definition
      const mergedQueryDefinition = this.mergeQueryParameters(queryDefinition, parameters);

      // Execute the query using the data warehouse service
      const rawResults = await this.dataWarehouseService.executeQuery(mergedQueryDefinition, parameters);

      // Process the results using the data processor
      const processedResults = this.processQueryResults(rawResults, mergedQueryDefinition, options);

      // Return the processed results
      logger.info(`Analytics query executed successfully: ${queryDefinition.name}`, {
        queryType: queryDefinition.type,
        recordCount: processedResults.length
      });
      return processedResults;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error executing analytics query definition', { error, queryDefinition, parameters, options });
      throw error;
    }
  }

  /**
   * Retrieves a predefined query by name
   * @param queryName - Name of the predefined query
   * @param queryType - Type of the query (e.g., EFFICIENCY, FINANCIAL)
   * @returns Predefined query or null if not found
   */
  getPredefinedQuery(queryName: string, queryType: AnalyticsQueryType): IAnalyticsQuery | null {
    // Determine which query map to use based on queryType
    let queryMap: Map<string, IAnalyticsQuery>;
    switch (queryType) {
      case AnalyticsQueryType.EFFICIENCY:
        queryMap = efficiencyQueries;
        break;
      case AnalyticsQueryType.DRIVER:
        queryMap = driverQueries;
        break;
      case AnalyticsQueryType.FINANCIAL:
        queryMap = financialQueries;
        break;
      case AnalyticsQueryType.OPERATIONAL:
        queryMap = operationalQueries;
        break;
      default:
        logger.warn(`Unsupported query type: ${queryType}`);
        return null;
    }

    // Look up the query by name in the appropriate map
    const query = queryMap.get(queryName);

    // Return the query or null if not found
    if (!query) {
      logger.warn(`Predefined query not found: ${queryName} of type ${queryType}`);
      return null;
    }

    logger.info(`Predefined query retrieved: ${queryName} of type ${queryType}`);
    return query;
  }

  /**
   * Executes a predefined query by name
   * @param queryName - Name of the predefined query
   * @param queryType - Type of the query (e.g., EFFICIENCY, FINANCIAL)
   * @param parameters - Parameters to pass to the query
   * @param options - Options for query execution
   * @returns Query results
   */
  async executePredefinedQuery(queryName: string, queryType: AnalyticsQueryType, parameters: any, options: any): Promise<Array<Record<string, any>>> {
    try {
      // Retrieve the predefined query by name and type
      const queryDefinition = this.getPredefinedQuery(queryName, queryType);

      // If not found, throw an error
      if (!queryDefinition) {
        throw createError('Predefined query not found', { code: 'RES_ANALYTICS_QUERY_NOT_FOUND', details: { queryName, queryType } });
      }

      // Execute the query definition with the provided parameters
      return this.executeQueryDefinition(queryDefinition, parameters, options);
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error executing predefined query', { error, queryName, queryType, parameters, options });
      throw error;
    }
  }

  /**
   * Retrieves efficiency metrics using predefined queries
   * @param parameters - Parameters to pass to the queries
   * @param options - Options for query execution
   * @returns Efficiency metrics object
   */
  async getEfficiencyMetrics(parameters: any, options: any): Promise<object> {
    try {
      // Execute predefined efficiency metrics queries
      const networkEfficiency = await this.executePredefinedQuery('network_efficiency_score', AnalyticsQueryType.EFFICIENCY, parameters, options);
      const emptyMilesReduction = await this.executePredefinedQuery('empty_miles_reduction', AnalyticsQueryType.EFFICIENCY, parameters, options);
      const smartHubUtilization = await this.executePredefinedQuery('smart_hub_utilization', AnalyticsQueryType.EFFICIENCY, parameters, options);

      // Process and combine the results
      const combinedMetrics = {
        networkEfficiency: networkEfficiency[0]?.average_efficiency_score || 0,
        emptyMilesReduction: emptyMilesReduction[0]?.total_empty_miles_saved || 0,
        smartHubUtilization: smartHubUtilization[0]?.exchange_count || 0
      };

      // Return the combined metrics object
      logger.info('Efficiency metrics retrieved successfully', { metrics: combinedMetrics });
      return combinedMetrics;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving efficiency metrics', { error, parameters, options });
      throw createError('Failed to retrieve efficiency metrics', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves driver performance metrics using predefined queries
   * @param parameters - Parameters to pass to the queries
   * @param options - Options for query execution
   * @returns Driver metrics object
   */
  async getDriverMetrics(parameters: any, options: any): Promise<object> {
    try {
      // Execute predefined driver metrics queries
      const driverPerformance = await this.executePredefinedQuery('driver_performance_metrics', AnalyticsQueryType.DRIVER, parameters, options);
      const driverLeaderboard = await this.executePredefinedQuery('driver_leaderboard', AnalyticsQueryType.DRIVER, parameters, options);

      // Process and combine the results
      const combinedMetrics = {
        driverPerformance: driverPerformance[0] || {},
        driverLeaderboard: driverLeaderboard || []
      };

      // Return the combined metrics object
      logger.info('Driver metrics retrieved successfully', { metrics: combinedMetrics });
      return combinedMetrics;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving driver metrics', { error, parameters, options });
      throw createError('Failed to retrieve driver metrics', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves financial metrics using predefined queries
   * @param parameters - Parameters to pass to the queries
   * @param options - Options for query execution
   * @returns Financial metrics object
   */
  async getFinancialMetrics(parameters: any, options: any): Promise<object> {
    try {
      // Execute predefined financial metrics queries
      const revenueAnalysis = await this.executePredefinedQuery('revenue-analysis', AnalyticsQueryType.FINANCIAL, parameters, options);
      const costSavings = await this.executePredefinedQuery('cost-savings', AnalyticsQueryType.FINANCIAL, parameters, options);

      // Process and combine the results
      const combinedMetrics = {
        revenueAnalysis: revenueAnalysis[0] || {},
        costSavings: costSavings[0] || {}
      };

      // Return the combined metrics object
      logger.info('Financial metrics retrieved successfully', { metrics: combinedMetrics });
      return combinedMetrics;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving financial metrics', { error, parameters, options });
      throw createError('Failed to retrieve financial metrics', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves operational metrics using predefined queries
   * @param parameters - Parameters to pass to the queries
   * @param options - Options for query execution
   * @returns Operational metrics object
   */
  async getOperationalMetrics(parameters: any, options: any): Promise<object> {
    try {
      // Execute predefined operational metrics queries
      const onTimeDelivery = await this.executePredefinedQuery('OnTimeDelivery', AnalyticsQueryType.OPERATIONAL, parameters, options);
      const loadFulfillmentRate = await this.executePredefinedQuery('LoadFulfillmentRate', AnalyticsQueryType.OPERATIONAL, parameters, options);

      // Process and combine the results
      const combinedMetrics = {
        onTimeDelivery: onTimeDelivery[0] || {},
        loadFulfillmentRate: loadFulfillmentRate[0] || {}
      };

      // Return the combined metrics object
      logger.info('Operational metrics retrieved successfully', { metrics: combinedMetrics });
      return combinedMetrics;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving operational metrics', { error, parameters, options });
      throw createError('Failed to retrieve operational metrics', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves a comprehensive set of metrics for dashboards
   * @param parameters - Parameters to pass to the queries
   * @param options - Options for query execution
   * @returns Dashboard metrics object
   */
  async getDashboardMetrics(parameters: any, options: any): Promise<object> {
    try {
      // Execute getEfficiencyMetrics
      const efficiencyMetrics = await this.getEfficiencyMetrics(parameters, options);

      // Execute getFinancialMetrics
      const financialMetrics = await this.getFinancialMetrics(parameters, options);

      // Execute getOperationalMetrics
      const operationalMetrics = await this.getOperationalMetrics(parameters, options);

      // Execute getDriverMetrics
      const driverMetrics = await this.getDriverMetrics(parameters, options);

      // Combine all metrics into a single dashboard object
      const dashboardMetrics = {
        efficiency: efficiencyMetrics,
        financial: financialMetrics,
        operational: operationalMetrics,
        driver: driverMetrics
      };

      // Return the combined dashboard metrics
      logger.info('Dashboard metrics retrieved successfully', { metrics: dashboardMetrics });
      return dashboardMetrics;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving dashboard metrics', { error, parameters, options });
      throw createError('Failed to retrieve dashboard metrics', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves network efficiency trend data over time
   * @param parameters - Parameters for the query
   * @returns Trend data
   */
  async getNetworkEfficiencyTrend(parameters: any): Promise<Array<Record<string, any>>> {
    try {
      // Execute the predefined efficiency trend query
      const trendData = await this.executePredefinedQuery('efficiency_trend', AnalyticsQueryType.EFFICIENCY, parameters, {});

      // Process the results for time-series visualization
      const processedTrendData = trendData.map(item => ({
        date: item.date,
        average_efficiency_score: item.average_efficiency_score
      }));

      // Return the trend data
      logger.info('Network efficiency trend data retrieved successfully', { recordCount: processedTrendData.length });
      return processedTrendData;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving network efficiency trend data', { error, parameters });
      throw createError('Failed to retrieve network efficiency trend data', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves empty miles reduction metrics
   * @param parameters - Parameters for the query
   * @returns Empty miles reduction metrics
   */
  async getEmptyMilesReduction(parameters: any): Promise<object> {
    try {
      // Execute the predefined empty miles reduction query
      const reductionData = await this.executePredefinedQuery('empty_miles_reduction', AnalyticsQueryType.EFFICIENCY, parameters, {});

      // Process the results to calculate reduction percentages
      const totalEmptyMilesBefore = reductionData[0]?.total_empty_miles_before || 0;
      const totalEmptyMilesAfter = reductionData[0]?.total_empty_miles_after || 0;

      const reductionPercentage = totalEmptyMilesBefore > 0
        ? ((totalEmptyMilesBefore - totalEmptyMilesAfter) / totalEmptyMilesBefore) * 100
        : 0;

      const reductionMetrics = {
        totalEmptyMilesBefore,
        totalEmptyMilesAfter,
        reductionPercentage
      };

      // Return the empty miles reduction metrics
      logger.info('Empty miles reduction metrics retrieved successfully', { metrics: reductionMetrics });
      return reductionMetrics;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving empty miles reduction metrics', { error, parameters });
      throw createError('Failed to retrieve empty miles reduction metrics', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves the distribution of driver efficiency scores
   * @param parameters - Parameters for the query
   * @returns Distribution data
   */
  async getDriverEfficiencyDistribution(parameters: any): Promise<Array<Record<string, any>>> {
    try {
      // Execute the predefined driver efficiency distribution query
      const distributionData = await this.executePredefinedQuery('driver_efficiency_distribution', AnalyticsQueryType.DRIVER, parameters, {});

      // Process the results for histogram visualization
      const processedDistributionData = distributionData.map(item => ({
        score: item.score,
        driver_count: item.driver_count
      }));

      // Return the distribution data
      logger.info('Driver efficiency distribution data retrieved successfully', { recordCount: processedDistributionData.length });
      return processedDistributionData;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving driver efficiency distribution data', { error, parameters });
      throw createError('Failed to retrieve driver efficiency distribution data', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves Smart Hub utilization metrics
   * @param parameters - Parameters for the query
   * @returns Smart Hub utilization metrics
   */
  async getSmartHubUtilization(parameters: any): Promise<object> {
    try {
      // Execute the predefined Smart Hub utilization query
      const utilizationData = await this.executePredefinedQuery('smart_hub_utilization', AnalyticsQueryType.EFFICIENCY, parameters, {});

      // Process the results to calculate utilization rates
      const totalExchanges = utilizationData.reduce((sum, item) => sum + item.exchange_count, 0);
      const averageEfficiencyImpact = utilizationData.reduce((sum, item) => sum + item.average_efficiency_impact, 0) / utilizationData.length;

      const utilizationMetrics = {
        totalExchanges,
        averageEfficiencyImpact
      };

      // Return the Smart Hub utilization metrics
      logger.info('Smart Hub utilization metrics retrieved successfully', { metrics: utilizationMetrics });
      return utilizationMetrics;
    } catch (error) {
      // Handle any errors during execution
      logger.error('Error retrieving Smart Hub utilization metrics', { error, parameters });
      throw createError('Failed to retrieve Smart Hub utilization metrics', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Validates an analytics query definition for required fields and proper structure
   * @param queryDefinition - Analytics query definition
   */
  validateQueryDefinition(queryDefinition: IAnalyticsQuery): void {
    // Check if queryDefinition is defined
    if (!queryDefinition) {
      throw createError('Query definition is required', { code: 'VAL_INVALID_INPUT' });
    }

    // Validate required fields (name, type, collection)
    if (!queryDefinition.name) {
      throw createError('Query name is required', { code: 'VAL_INVALID_INPUT', details: { field: 'name' } });
    }
    if (!queryDefinition.type) {
      throw createError('Query type is required', { code: 'VAL_INVALID_INPUT', details: { field: 'type' } });
    }
    if (!queryDefinition.collection) {
      throw createError('Query collection is required', { code: 'VAL_INVALID_INPUT', details: { field: 'collection' } });
    }

    // Validate that fields array is present and not empty
    if (!queryDefinition.fields || queryDefinition.fields.length === 0) {
      throw createError('Query fields are required and must not be empty', { code: 'VAL_INVALID_INPUT', details: { field: 'fields' } });
    }

    // Validate that each field has a field name
    queryDefinition.fields.forEach(field => {
      if (!field.field) {
        throw createError('Each query field must have a field name', { code: 'VAL_INVALID_INPUT', details: { field: 'fields.field' } });
      }
    });

    // Validate that aggregations have proper type and field
    queryDefinition.aggregations?.forEach(agg => {
      if (!agg.type) {
        throw createError('Each aggregation must have a type', { code: 'VAL_INVALID_INPUT', details: { field: 'aggregations.type' } });
      }
      if (!agg.field) {
        throw createError('Each aggregation must have a field', { code: 'VAL_INVALID_INPUT', details: { field: 'aggregations.field' } });
      }
    });

    // Validate that filters have proper field, operator, and value
    queryDefinition.filters?.forEach(filter => {
      if (!filter.field) {
        throw createError('Each filter must have a field', { code: 'VAL_INVALID_INPUT', details: { field: 'filters.field' } });
      }
      if (!filter.operator) {
        throw createError('Each filter must have an operator', { code: 'VAL_INVALID_INPUT', details: { field: 'filters.operator' } });
      }
      if (filter.value === undefined) {
        throw createError('Each filter must have a value', { code: 'VAL_INVALID_INPUT', details: { field: 'filters.value' } });
      }
    });

    // Validate that sort criteria have proper field and direction
    queryDefinition.sort?.forEach(sort => {
      if (!sort.field) {
        throw createError('Each sort criteria must have a field', { code: 'VAL_INVALID_INPUT', details: { field: 'sort.field' } });
      }
      if (!sort.direction) {
        throw createError('Each sort criteria must have a direction', { code: 'VAL_INVALID_INPUT', details: { field: 'sort.direction' } });
      }
    });
  }

  /**
   * Merges user-provided parameters into a query definition
   * @param queryDefinition - Query definition
   * @param parameters - Parameters to merge
   * @returns Query definition with merged parameters
   */
  mergeQueryParameters(queryDefinition: IAnalyticsQuery, parameters: any): IAnalyticsQuery {
    // Create a deep clone of the query definition
    const mergedQueryDefinition: IAnalyticsQuery = _.cloneDeep(queryDefinition);

    // If no parameters provided, return the cloned definition
    if (!parameters) {
      return mergedQueryDefinition;
    }

    // For each parameter in the parameters object
    for (const key in parameters) {
      if (parameters.hasOwnProperty(key)) {
        const value = parameters[key];

        // Find any placeholders in the query definition that match the parameter name
        const regex = new RegExp(`:${key}`, 'g');

        // Replace the placeholders with the parameter value
        mergedQueryDefinition.collection = mergedQueryDefinition.collection.replace(regex, value);
        mergedQueryDefinition.fields.forEach(field => {
          if (field.field) {
            field.field = field.field.replace(regex, value);
          }
        });
        mergedQueryDefinition.filters?.forEach(filter => {
          if (filter.field) {
            filter.field = filter.field.replace(regex, value);
          }
          if (typeof filter.value === 'string') {
            filter.value = filter.value.replace(regex, value);
          }
        });
      }
    }

    // Return the updated query definition
    return mergedQueryDefinition;
  }

  /**
   * Processes raw query results into the desired format
   * @param results - Raw query results
   * @param queryDefinition - Query definition
   * @param options - Options for processing
   * @returns Processed query results
   */
  processQueryResults(results: Array<Record<string, any>>, queryDefinition: IAnalyticsQuery, options: any): Array<Record<string, any>> {
    // Initialize the data processor
    const dataProcessor = new DataProcessor();

    // Apply field aliases from query definition
    let processedResults = results.map(row => {
      const newRow: Record<string, any> = {};
      queryDefinition.fields.forEach(field => {
        newRow[field.alias || field.field] = row[field.field];
      });
      return newRow;
    });

    // Apply data type conversions if specified
    processedResults = processedResults.map(row => {
      const newRow: Record<string, any> = {};
      queryDefinition.fields.forEach(field => {
        let value = row[field.alias || field.field];
        if (field.dataType === 'number') {
          value = Number(value);
        } else if (field.dataType === 'date') {
          value = new Date(value);
        }
        newRow[field.alias || field.field] = value;
      });
      return newRow;
    });

    // Apply any transformations specified in options
    if (options?.transformations) {
      options.transformations.forEach(transformation => {
        processedResults = dataProcessor.transformData(processedResults, transformation.type, transformation.options);
      });
    }

    // Format dates according to options
    if (options?.dateFormat) {
      processedResults = processedResults.map(row => {
        const newRow: Record<string, any> = {};
        queryDefinition.fields.forEach(field => {
          let value = row[field.alias || field.field];
          if (field.dataType === 'date') {
            value = dataProcessor.formatField(value, 'date', { format: options.dateFormat });
          }
          newRow[field.alias || field.field] = value;
        });
        return newRow;
      });
    }

    // Apply any aggregations or calculations
    if (queryDefinition.aggregations && queryDefinition.aggregations.length > 0) {
      processedResults = dataProcessor.applyAggregations(processedResults, queryDefinition);
    }

    // Return the processed results
    return processedResults;
  }
}

export default AnalyticsService;