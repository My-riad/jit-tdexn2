import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { AnalyticsService } from '../services/analytics.service';
import { IAnalyticsQuery, AnalyticsQueryType } from '../models/analytics-query.model';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';

/**
 * Controller that handles HTTP requests for analytics operations
 */
export class AnalyticsController {
  private analyticsService: AnalyticsService;

  /**
   * Creates a new AnalyticsController instance
   */
  constructor(analyticsService: AnalyticsService) {
    // Initialize the analytics service
    this.analyticsService = analyticsService;
    logger.info('AnalyticsController initialized');
  }

  /**
   * Creates a new analytics query definition
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async createAnalyticsQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of analytics query creation
    logger.info('Creating a new analytics query');

    try {
      // Extract query data from request body
      const queryData: IAnalyticsQuery = req.body;

      // Validate that required fields are present (name, type, collection, fields)
      if (!queryData.name || !queryData.type || !queryData.collection || !queryData.fields) {
        throw createError('Missing required fields in query data', { code: 'VAL_INVALID_INPUT' });
      }

      // Set the createdBy field to the user ID from the request (assuming user ID is available in the request)
      queryData.createdBy = 'user-123'; // Replace with actual user ID from request

      // Call analyticsService.createQuery with the query data
      const createdQuery = await this.analyticsService.createQuery(queryData);

      // Return the created query as JSON response with 201 status code
      res.status(201).json(createdQuery);
      logger.info(`Analytics query created successfully: ${createdQuery.name}`, { queryId: createdQuery.id });
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error creating analytics query', { error });
      next(error);
    }
  }

  /**
   * Retrieves an analytics query by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getAnalyticsQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of analytics query retrieval
    logger.info('Retrieving an analytics query by ID');

    try {
      // Extract query ID from request parameters
      const queryId: string = req.params.id;

      // Validate that query ID is provided
      if (!queryId) {
        throw createError('Query ID is required', { code: 'VAL_INVALID_INPUT' });
      }

      // Call analyticsService.getQuery with the query ID
      const query = await this.analyticsService.getQuery(queryId);

      // If query is found, return it as JSON response with 200 status code
      if (query) {
        res.status(200).json(query);
        logger.info(`Analytics query retrieved successfully: ${query.name}`, { queryId: query.id });
      } else {
        // If query is not found, return 404 status code with appropriate message
        res.status(404).json({ message: 'Analytics query not found' });
        logger.warn(`Analytics query not found: ${queryId}`);
      }
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving analytics query', { error });
      next(error);
    }
  }

  /**
   * Retrieves analytics queries with optional filtering
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getAnalyticsQueries(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of analytics queries retrieval
    logger.info('Retrieving analytics queries with optional filtering');

    try {
      // Extract filter parameters from request query (type, createdBy, etc.)
      const filters = req.query;

      // Call analyticsService.getQueries with the filter parameters
      const queries = await this.analyticsService.getQueries(filters);

      // Return the list of queries as JSON response with 200 status code
      res.status(200).json(queries);
      logger.info(`Retrieved ${queries.length} analytics queries with filters`, { filters });
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving analytics queries', { error });
      next(error);
    }
  }

  /**
   * Updates an existing analytics query
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async updateAnalyticsQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of analytics query update
    logger.info('Updating an existing analytics query');

    try {
      // Extract query ID from request parameters
      const queryId: string = req.params.id;

      // Extract update data from request body
      const queryData: IAnalyticsQuery = req.body;

      // Validate that query ID is provided
      if (!queryId) {
        throw createError('Query ID is required', { code: 'VAL_INVALID_INPUT' });
      }

      // Call analyticsService.updateQuery with the query ID and update data
      const updatedQuery = await this.analyticsService.updateQuery(queryId, queryData);

      // If query is found and updated, return it as JSON response with 200 status code
      if (updatedQuery) {
        res.status(200).json(updatedQuery);
        logger.info(`Analytics query updated successfully: ${updatedQuery.name}`, { queryId: updatedQuery.id });
      } else {
        // If query is not found, return 404 status code with appropriate message
        res.status(404).json({ message: 'Analytics query not found' });
        logger.warn(`Analytics query not found for update: ${queryId}`);
      }
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error updating analytics query', { error });
      next(error);
    }
  }

  /**
   * Deletes an analytics query
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async deleteAnalyticsQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of analytics query deletion
    logger.info('Deleting an analytics query');

    try {
      // Extract query ID from request parameters
      const queryId: string = req.params.id;

      // Validate that query ID is provided
      if (!queryId) {
        throw createError('Query ID is required', { code: 'VAL_INVALID_INPUT' });
      }

      // Call analyticsService.deleteQuery with the query ID
      const deleted = await this.analyticsService.deleteQuery(queryId);

      // If deletion is successful, return 204 status code with no content
      if (deleted) {
        res.status(204).send();
        logger.info(`Analytics query deleted successfully: ${queryId}`);
      } else {
        // If query is not found, return 404 status code with appropriate message
        res.status(404).json({ message: 'Analytics query not found' });
        logger.warn(`Analytics query not found for deletion: ${queryId}`);
      }
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error deleting analytics query', { error });
      next(error);
    }
  }

  /**
   * Executes an analytics query by ID with optional parameters
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async executeAnalyticsQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of analytics query execution
    logger.info('Executing an analytics query by ID');

    try {
      // Extract query ID from request parameters
      const queryId: string = req.params.id;

      // Extract execution parameters from request body
      const parameters = req.body;

      // Extract options from request query (format, pagination, etc.)
      const options = req.query;

      // Validate that query ID is provided
      if (!queryId) {
        throw createError('Query ID is required', { code: 'VAL_INVALID_INPUT' });
      }

      // Call analyticsService.executeQuery with the query ID, parameters, and options
      const results = await this.analyticsService.executeQuery(queryId, parameters, options);

      // Return the query results as JSON response with 200 status code
      res.status(200).json(results);
      logger.info(`Analytics query executed successfully: ${queryId}`);
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error executing analytics query', { error });
      next(error);
    }
  }

  /**
   * Executes an analytics query from a definition object
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async executeQueryDefinition(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of query definition execution
    logger.info('Executing an analytics query from a definition object');

    try {
      // Extract query definition from request body
      const queryDefinition: IAnalyticsQuery = req.body.queryDefinition;

      // Extract execution parameters from request body
      const parameters = req.body.parameters;

      // Extract options from request query (format, pagination, etc.)
      const options = req.query;

      // Validate that query definition is provided and has required fields
      if (!queryDefinition || !queryDefinition.name || !queryDefinition.type || !queryDefinition.collection || !queryDefinition.fields) {
        throw createError('Invalid query definition', { code: 'VAL_INVALID_INPUT' });
      }

      // Call analyticsService.executeQueryDefinition with the definition, parameters, and options
      const results = await this.analyticsService.executeQueryDefinition(queryDefinition, parameters, options);

      // Return the query results as JSON response with 200 status code
      res.status(200).json(results);
      logger.info(`Analytics query definition executed successfully: ${queryDefinition.name}`);
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error executing analytics query definition', { error });
      next(error);
    }
  }

  /**
   * Executes a predefined query by name and type
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async executePredefinedQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of predefined query execution
    logger.info('Executing a predefined query by name and type');

    try {
      // Extract query name from request parameters
      const queryName: string = req.params.name;

      // Extract query type from request parameters or query
      const queryType: AnalyticsQueryType = (req.params.type || req.query.type) as AnalyticsQueryType;

      // Extract execution parameters from request body
      const parameters = req.body;

      // Extract options from request query (format, pagination, etc.)
      const options = req.query;

      // Validate that query name and type are provided
      if (!queryName || !queryType) {
        throw createError('Query name and type are required', { code: 'VAL_INVALID_INPUT' });
      }

      // Call analyticsService.executePredefinedQuery with the name, type, parameters, and options
      const results = await this.analyticsService.executePredefinedQuery(queryName, queryType, parameters, options);

      // Return the query results as JSON response with 200 status code
      res.status(200).json(results);
      logger.info(`Predefined query executed successfully: ${queryName} of type ${queryType}`);
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error executing predefined query', { error });
      next(error);
    }
  }

  /**
   * Retrieves efficiency metrics using predefined queries
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getEfficiencyMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of efficiency metrics retrieval
    logger.info('Retrieving efficiency metrics using predefined queries');

    try {
      // Extract parameters from request query (timeframe, filters, etc.)
      const parameters = req.query;

      // Extract options from request query (format, aggregation, etc.)
      const options = req.query;

      // Call analyticsService.getEfficiencyMetrics with the parameters and options
      const metrics = await this.analyticsService.getEfficiencyMetrics(parameters, options);

      // Return the efficiency metrics as JSON response with 200 status code
      res.status(200).json(metrics);
      logger.info('Efficiency metrics retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving efficiency metrics', { error });
      next(error);
    }
  }

  /**
   * Retrieves driver performance metrics using predefined queries
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getDriverMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of driver metrics retrieval
    logger.info('Retrieving driver performance metrics using predefined queries');

    try {
      // Extract parameters from request query (driverId, timeframe, filters, etc.)
      const parameters = req.query;

      // Extract options from request query (format, aggregation, etc.)
      const options = req.query;

      // Call analyticsService.getDriverMetrics with the parameters and options
      const metrics = await this.analyticsService.getDriverMetrics(parameters, options);

      // Return the driver metrics as JSON response with 200 status code
      res.status(200).json(metrics);
      logger.info('Driver metrics retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving driver metrics', { error });
      next(error);
    }
  }

  /**
   * Retrieves financial metrics using predefined queries
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getFinancialMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of financial metrics retrieval
    logger.info('Retrieving financial metrics using predefined queries');

    try {
      // Extract parameters from request query (timeframe, filters, etc.)
      const parameters = req.query;

      // Extract options from request query (format, aggregation, etc.)
      const options = req.query;

      // Call analyticsService.getFinancialMetrics with the parameters and options
      const metrics = await this.analyticsService.getFinancialMetrics(parameters, options);

      // Return the financial metrics as JSON response with 200 status code
      res.status(200).json(metrics);
      logger.info('Financial metrics retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving financial metrics', { error });
      next(error);
    }
  }

  /**
   * Retrieves operational metrics using predefined queries
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getOperationalMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of operational metrics retrieval
    logger.info('Retrieving operational metrics using predefined queries');

    try {
      // Extract parameters from request query (timeframe, filters, etc.)
      const parameters = req.query;

      // Extract options from request query (format, aggregation, etc.)
      const options = req.query;

      // Call analyticsService.getOperationalMetrics with the parameters and options
      const metrics = await this.analyticsService.getOperationalMetrics(parameters, options);

      // Return the operational metrics as JSON response with 200 status code
      res.status(200).json(metrics);
      logger.info('Operational metrics retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving operational metrics', { error });
      next(error);
    }
  }

  /**
   * Retrieves a comprehensive set of metrics for dashboards
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getDashboardMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of dashboard metrics retrieval
    logger.info('Retrieving a comprehensive set of metrics for dashboards');

    try {
      // Extract parameters from request query (timeframe, filters, etc.)
      const parameters = req.query;

      // Extract options from request query (format, aggregation, etc.)
      const options = req.query;

      // Call analyticsService.getDashboardMetrics with the parameters and options
      const metrics = await this.analyticsService.getDashboardMetrics(parameters, options);

      // Return the dashboard metrics as JSON response with 200 status code
      res.status(200).json(metrics);
      logger.info('Dashboard metrics retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving dashboard metrics', { error });
      next(error);
    }
  }

  /**
   * Retrieves network efficiency trend data over time
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getNetworkEfficiencyTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of network efficiency trend retrieval
    logger.info('Retrieving network efficiency trend data over time');

    try {
      // Extract parameters from request query (timeframe, granularity, etc.)
      const parameters = req.query;

      // Call analyticsService.getNetworkEfficiencyTrend with the parameters
      const trendData = await this.analyticsService.getNetworkEfficiencyTrend(parameters);

      // Return the trend data as JSON response with 200 status code
      res.status(200).json(trendData);
      logger.info('Network efficiency trend data retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving network efficiency trend data', { error });
      next(error);
    }
  }

  /**
   * Retrieves empty miles reduction metrics
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getEmptyMilesReduction(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of empty miles reduction metrics retrieval
    logger.info('Retrieving empty miles reduction metrics');

    try {
      // Extract parameters from request query (timeframe, comparison, etc.)
      const parameters = req.query;

      // Call analyticsService.getEmptyMilesReduction with the parameters
      const reductionMetrics = await this.analyticsService.getEmptyMilesReduction(parameters);

      // Return the empty miles reduction metrics as JSON response with 200 status code
      res.status(200).json(reductionMetrics);
      logger.info('Empty miles reduction metrics retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving empty miles reduction metrics', { error });
      next(error);
    }
  }

  /**
   * Retrieves the distribution of driver efficiency scores
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getDriverEfficiencyDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of driver efficiency distribution retrieval
    logger.info('Retrieving the distribution of driver efficiency scores');

    try {
      // Extract parameters from request query (timeframe, filters, etc.)
      const parameters = req.query;

      // Call analyticsService.getDriverEfficiencyDistribution with the parameters
      const distributionData = await this.analyticsService.getDriverEfficiencyDistribution(parameters);

      // Return the distribution data as JSON response with 200 status code
      res.status(200).json(distributionData);
      logger.info('Driver efficiency distribution data retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving driver efficiency distribution data', { error });
      next(error);
    }
  }

  /**
   * Retrieves Smart Hub utilization metrics
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getSmartHubUtilization(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the start of Smart Hub utilization metrics retrieval
    logger.info('Retrieving Smart Hub utilization metrics');

    try {
      // Extract parameters from request query (hubId, timeframe, etc.)
      const parameters = req.query;

      // Call analyticsService.getSmartHubUtilization with the parameters
      const utilizationMetrics = await this.analyticsService.getSmartHubUtilization(parameters);

      // Return the Smart Hub utilization metrics as JSON response with 200 status code
      res.status(200).json(utilizationMetrics);
      logger.info('Smart Hub utilization metrics retrieved successfully');
    } catch (error) {
      // Catch any errors, log them, and pass to error handling middleware
      logger.error('Error retrieving Smart Hub utilization metrics', { error });
      next(error);
    }
  }
}

// Create a new instance of the AnalyticsService
import DataWarehouseService from '../services/data-warehouse.service';
const dataWarehouseService = new DataWarehouseService();
const analyticsController = new AnalyticsController(new AnalyticsService(dataWarehouseService));

// Export the AnalyticsController class for use in route definitions
export default AnalyticsController;

// Export individual controller methods for direct use in routes
export const createAnalyticsQuery = analyticsController.createAnalyticsQuery.bind(analyticsController);
export const getAnalyticsQuery = analyticsController.getAnalyticsQuery.bind(analyticsController);
export const getAnalyticsQueries = analyticsController.getAnalyticsQueries.bind(analyticsController);
export const updateAnalyticsQuery = analyticsController.updateAnalyticsQuery.bind(analyticsController);
export const deleteAnalyticsQuery = analyticsController.deleteAnalyticsQuery.bind(analyticsController);
export const executeAnalyticsQuery = analyticsController.executeAnalyticsQuery.bind(analyticsController);
export const executeQueryDefinition = analyticsController.executeQueryDefinition.bind(analyticsController);
export const executePredefinedQuery = analyticsController.executePredefinedQuery.bind(analyticsController);
export const getEfficiencyMetrics = analyticsController.getEfficiencyMetrics.bind(analyticsController);
export const getDriverMetrics = analyticsController.getDriverMetrics.bind(analyticsController);
export const getFinancialMetrics = analyticsController.getFinancialMetrics.bind(analyticsController);
export const getOperationalMetrics = analyticsController.getOperationalMetrics.bind(analyticsController);
export const getDashboardMetrics = analyticsController.getDashboardMetrics.bind(analyticsController);
export const getNetworkEfficiencyTrend = analyticsController.getNetworkEfficiencyTrend.bind(analyticsController);
export const getEmptyMilesReduction = analyticsController.getEmptyMilesReduction.bind(analyticsController);
export const getDriverEfficiencyDistribution = analyticsController.getDriverEfficiencyDistribution.bind(analyticsController);
export const getSmartHubUtilization = analyticsController.getSmartHubUtilization.bind(analyticsController);