import { Knex } from 'knex'; // knex@^2.4.2
import * as redis from 'redis'; // redis@^4.6.7
import { createHash } from 'crypto';
import { IAnalyticsQuery } from '../models/analytics-query.model';
import { getDataWarehouseConnection, getAnalyticsCacheClient, ANALYTICS_CACHE_TTL, MAX_EXPORT_ROWS } from '../config';
import { DataProcessor } from '../processors/data-processor';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import _ from 'lodash'; // lodash@^4.17.21

const CACHE_ENABLED = process.env.ANALYTICS_CACHE_ENABLED === 'true';

/**
 * Service that provides a unified interface for interacting with the data warehouse
 */
export class DataWarehouseService {
  private knexInstance: Knex;
  private cacheClient: redis.RedisClientType;
  private dataProcessor: DataProcessor;
  private cacheEnabled: boolean;

  /**
   * Creates a new DataWarehouseService instance
   */
  constructor() {
    this.dataProcessor = new DataProcessor();
    this.cacheEnabled = CACHE_ENABLED;
    logger.info('DataWarehouseService initialized');
  }

  /**
   * Initializes the service by establishing database and cache connections
   */
  async initialize(): Promise<void> {
    try {
      this.knexInstance = await getDataWarehouseConnection();
      if (this.cacheEnabled) {
        this.cacheClient = await getAnalyticsCacheClient();
      }
      logger.info('DataWarehouseService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize DataWarehouseService', { error });
      throw error;
    }
  }

  /**
   * Executes an analytics query based on its definition and parameters
   * @param queryDefinition - Analytics query definition
   * @param parameters - Query parameters
   * @returns Query results
   */
  async executeQuery(queryDefinition: IAnalyticsQuery, parameters: Record<string, any>): Promise<Array<Record<string, any>>> {
    if (!this.knexInstance) {
      throw createError('DataWarehouseService not initialized', { code: 'SRV_INTERNAL_ERROR' });
    }

    const cacheKey = generateCacheKey(queryDefinition, parameters);

    if (this.cacheEnabled) {
      const cachedResults = await this.getCachedResults(cacheKey);
      if (cachedResults) {
        logger.info(`Returning cached results for query: ${queryDefinition.name}`);
        return cachedResults;
      }
    }

    try {
      const query = buildQueryFromDefinition(this.knexInstance, queryDefinition, parameters);
      logger.info(`Executing query: ${queryDefinition.name}`);
      const results = await query;

      const processedResults = this.dataProcessor.processData(results, queryDefinition);

      if (this.cacheEnabled) {
        await this.cacheResults(cacheKey, processedResults);
      }

      return processedResults;
    } catch (error) {
      logger.error(`Error executing query: ${queryDefinition.name}`, { error });
      throw error;
    }
  }

  /**
   * Executes a raw SQL query against the data warehouse
   * @param sql - Raw SQL query string
   * @param bindings - Bindings for the SQL query
   * @returns Query results
   */
  async executeRawQuery(sql: string, bindings: any[]): Promise<Array<Record<string, any>>> {
    if (!this.knexInstance) {
      throw createError('DataWarehouseService not initialized', { code: 'SRV_INTERNAL_ERROR' });
    }

    try {
      logger.info('Executing raw SQL query');
      const results = await this.knexInstance.raw(sql, bindings);
      return results.rows;
    } catch (error) {
      logger.error('Error executing raw SQL query', { error });
      throw error;
    }
  }

  /**
   * Retrieves cached query results if available
   * @param cacheKey - Cache key for the query
   * @returns Cached results or null if not found
   */
  async getCachedResults(cacheKey: string): Promise<Array<Record<string, any>> | null> {
    if (!this.cacheEnabled || !this.cacheClient) {
      return null;
    }

    try {
      const cached = await this.cacheClient.get(cacheKey);
      if (cached) {
        logger.info('Cache hit', { cacheKey });
        return JSON.parse(cached);
      }
      logger.info('Cache miss', { cacheKey });
      return null;
    } catch (error) {
      logger.error('Error retrieving cached results', { error, cacheKey });
      return null;
    }
  }

  /**
   * Stores query results in the cache
   * @param cacheKey - Cache key for the query
   * @param results - Query results to cache
   */
  async cacheResults(cacheKey: string, results: Array<Record<string, any>>): Promise<void> {
    if (!this.cacheEnabled || !this.cacheClient) {
      return;
    }

    try {
      const serializedResults = JSON.stringify(results);
      await this.cacheClient.set(cacheKey, serializedResults, { EX: ANALYTICS_CACHE_TTL });
      logger.info('Cached results', { cacheKey, ttl: ANALYTICS_CACHE_TTL });
    } catch (error) {
      logger.error('Error caching results', { error, cacheKey });
    }
  }

  /**
   * Invalidates cached results for a specific query or pattern
   * @param pattern - Cache key pattern to invalidate
   */
  async invalidateCache(pattern: string): Promise<void> {
    if (!this.cacheEnabled || !this.cacheClient) {
      return;
    }

    try {
      // Use SCAN to find keys matching the pattern
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [nextCursor, matchedKeys] = await this.cacheClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keys.push(...matchedKeys);
      } while (cursor !== '0');

      if (keys.length > 0) {
        await this.cacheClient.del(keys);
        logger.info(`Invalidated ${keys.length} cache entries`, { pattern });
      } else {
        logger.info('No cache entries found to invalidate', { pattern });
      }
    } catch (error) {
      logger.error('Error invalidating cache', { error, pattern });
    }
  }

  /**
   * Gets the execution plan for a query for optimization purposes
   * @param queryDefinition - Analytics query definition
   * @param parameters - Query parameters
   * @returns Query execution plan
   */
  async getQueryExplainPlan(queryDefinition: IAnalyticsQuery, parameters: Record<string, any>): Promise<Array<Record<string, any>>> {
    if (!this.knexInstance) {
      throw createError('DataWarehouseService not initialized', { code: 'SRV_INTERNAL_ERROR' });
    }

    try {
      const query = buildQueryFromDefinition(this.knexInstance, queryDefinition, parameters);
      const explainQuery = `EXPLAIN ${query.toString()}`;
      logger.info(`Executing explain query: ${queryDefinition.name}`);
      const results = await this.knexInstance.raw(explainQuery);
      return results.rows;
    } catch (error) {
      logger.error(`Error getting query explain plan: ${queryDefinition.name}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves the schema information for a table in the data warehouse
   * @param tableName - Table name
   * @returns Table schema information
   */
  async getTableSchema(tableName: string): Promise<Array<Record<string, any>>> {
    if (!this.knexInstance) {
      throw createError('DataWarehouseService not initialized', { code: 'SRV_INTERNAL_ERROR' });
    }

    try {
      const sql = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
      `;
      logger.info(`Retrieving schema for table: ${tableName}`);
      const results = await this.knexInstance.raw(sql);
      return results.rows;
    } catch (error) {
      logger.error(`Error retrieving schema for table: ${tableName}`, { error });
      throw error;
    }
  }

  /**
   * Executes a query with pagination support for large result sets
   * @param queryDefinition - Analytics query definition
   * @param parameters - Query parameters
   * @param pageSize - Number of records per page
   * @param pageNumber - Page number to retrieve
   * @returns Paginated query results with metadata
   */
  async executeQueryWithPagination(
    queryDefinition: IAnalyticsQuery,
    parameters: Record<string, any>,
    pageSize: number,
    pageNumber: number
  ): Promise<{ data: Array<Record<string, any>>; total: number; page: number; pageSize: number; pageCount: number }> {
    if (!this.knexInstance) {
      throw createError('DataWarehouseService not initialized', { code: 'SRV_INTERNAL_ERROR' });
    }

    try {
      const baseQuery = buildQueryFromDefinition(this.knexInstance, queryDefinition, parameters);

      // Count query
      const countQuery = this.knexInstance.from(baseQuery.clone().as('data')).count('* as total').first();
      const countResult = await countQuery;
      const total = Number(countResult?.total || 0);

      // Apply pagination
      const offset = (pageNumber - 1) * pageSize;
      const paginatedQuery = baseQuery.limit(pageSize).offset(offset);

      logger.info(`Executing paginated query: ${queryDefinition.name}, page: ${pageNumber}, pageSize: ${pageSize}`);
      const results = await paginatedQuery;

      const processedResults = this.dataProcessor.processData(results, queryDefinition);

      const pageCount = Math.ceil(total / pageSize);

      return {
        data: processedResults,
        total,
        page: pageNumber,
        pageSize,
        pageCount
      };
    } catch (error) {
      logger.error(`Error executing paginated query: ${queryDefinition.name}`, { error });
      throw error;
    }
  }

  /**
   * Executes a query as a stream for processing large result sets
   * @param queryDefinition - Analytics query definition
   * @param parameters - Query parameters
   * @returns Stream of query results
   */
  async executeQueryStream(queryDefinition: IAnalyticsQuery, parameters: Record<string, any>): Promise<NodeJS.ReadableStream> {
    if (!this.knexInstance) {
      throw createError('DataWarehouseService not initialized', { code: 'SRV_INTERNAL_ERROR' });
    }

    try {
      const query = buildQueryFromDefinition(this.knexInstance, queryDefinition, parameters);
      logger.info(`Executing query as stream: ${queryDefinition.name}`);
      return query.stream();
    } catch (error) {
      logger.error(`Error executing query as stream: ${queryDefinition.name}`, { error });
      throw error;
    }
  }

  /**
   * Closes database and cache connections
   */
  async close(): Promise<void> {
    try {
      if (this.knexInstance) {
        await this.knexInstance.destroy();
        logger.info('Knex connection destroyed');
      }

      if (this.cacheClient) {
        await this.cacheClient.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing connections', { error });
    }
  }
}

/**
 * Generates a unique cache key for a query based on its definition and parameters
 * @param queryDefinition - Analytics query definition
 * @param parameters - Query parameters
 * @returns Unique cache key for the query
 */
function generateCacheKey(queryDefinition: IAnalyticsQuery, parameters: Record<string, any>): string {
  // Create a string representation of the query definition
  let keyString = JSON.stringify(queryDefinition);

  // Add parameters to the string representation if provided
  if (parameters && Object.keys(parameters).length > 0) {
    keyString += JSON.stringify(parameters);
  }

  // Generate a hash of the string using MD5
  const hash = createHash('md5').update(keyString).digest('hex');
  return `analytics:${hash}`;
}

/**
 * Builds a Knex query from an analytics query definition
 * @param knexInstance - Knex instance
 * @param queryDefinition - Analytics query definition
 * @param parameters - Query parameters
 * @returns Knex query builder instance
 */
function buildQueryFromDefinition(knexInstance: Knex, queryDefinition: IAnalyticsQuery, parameters: Record<string, any>): Knex.QueryBuilder {
  // Initialize a query builder for the specified collection/table
  let query = knexInstance(queryDefinition.collection);

  // Apply field selection based on query fields
  if (queryDefinition.fields && queryDefinition.fields.length > 0) {
    const selectFields = queryDefinition.fields.map(field => {
      if (field.alias) {
        return { [field.alias]: field.field };
      }
      return field.field;
    });
    query = query.select(selectFields);
  }

  // Apply filters if specified in the query
  if (queryDefinition.filters && queryDefinition.filters.length > 0) {
    query = applyFilters(query, queryDefinition.filters, parameters);
  }

  // Apply joins if specified in the query
  if (queryDefinition.joins && queryDefinition.joins.length > 0) {
    query = applyJoins(query, queryDefinition.joins);
  }

  // Apply grouping if specified in the query
  if (queryDefinition.groupBy && queryDefinition.groupBy.length > 0) {
    query = query.groupBy(queryDefinition.groupBy);
  }

  // Apply sorting if specified in the query
  if (queryDefinition.sort && queryDefinition.sort.length > 0) {
    query = query.orderBy(queryDefinition.sort.map(s => ({ column: s.field, order: s.direction.toLowerCase() })));
  }

  // Apply pagination if limit and offset are specified
  if (queryDefinition.limit !== undefined) {
    query = query.limit(queryDefinition.limit);
  }
  if (queryDefinition.offset !== undefined) {
    query = query.offset(queryDefinition.offset);
  }

  // Replace any parameter placeholders with actual values
  if (parameters && Object.keys(parameters).length > 0) {
    Object.entries(parameters).forEach(([key, value]) => {
      query = query.replace(`:${key}`, value);
    });
  }

  return query;
}

/**
 * Applies filters to a Knex query based on query definition
 * @param query - Knex query builder instance
 * @param filters - Array of filter objects
 * @param parameters - Query parameters
 * @returns Query with filters applied
 */
function applyFilters(query: Knex.QueryBuilder, filters: any[], parameters: Record<string, any>): Knex.QueryBuilder {
  if (!filters || filters.length === 0) {
    return query;
  }

  filters.forEach(filter => {
    let { field, operator, value } = filter;

    // Replace any parameter placeholders in the value
    if (parameters && typeof value === 'string') {
      Object.entries(parameters).forEach(([key, paramValue]) => {
        value = value.replace(`:${key}`, paramValue);
      });
    }

    switch (operator) {
      case 'EQUALS':
        query = query.where(field, value);
        break;
      case 'NOT_EQUALS':
        query = query.whereNot(field, value);
        break;
      case 'GREATER_THAN':
        query = query.where(field, '>', value);
        break;
      case 'LESS_THAN':
        query = query.where(field, '<', value);
        break;
      case 'GREATER_THAN_EQUALS':
        query = query.where(field, '>=', value);
        break;
      case 'LESS_THAN_EQUALS':
        query = query.where(field, '<=', value);
        break;
      case 'CONTAINS':
        query = query.where(field, 'like', `%${value}%`);
        break;
      case 'NOT_CONTAINS':
        query = query.where(field, 'not like', `%${value}%`);
        break;
      case 'IN':
        if (Array.isArray(value)) {
          query = query.whereIn(field, value);
        }
        break;
      case 'NOT_IN':
        if (Array.isArray(value)) {
          query = query.whereNotIn(field, value);
        }
        break;
      case 'BETWEEN':
        if (Array.isArray(value) && value.length === 2) {
          query = query.whereBetween(field, value);
        }
        break;
      case 'NULL':
        query = query.whereNull(field);
        break;
      case 'NOT_NULL':
        query = query.whereNotNull(field);
        break;
      default:
        logger.warn(`Unsupported filter operator: ${operator}`);
    }
  });

  return query;
}

/**
 * Applies joins to a Knex query based on query definition
 * @param query - Knex query builder instance
 * @param joins - Array of join objects
 * @returns Query with joins applied
 */
function applyJoins(query: Knex.QueryBuilder, joins: any[]): Knex.QueryBuilder {
  if (!joins || joins.length === 0) {
    return query;
  }

  joins.forEach(join => {
    const { table, alias, type, condition } = join;
    switch (type) {
      case 'leftJoin':
        query = query.leftJoin(`${table} as ${alias}`, condition[0], condition[1]);
        break;
      case 'rightJoin':
        query = query.rightJoin(`${table} as ${alias}`, condition[0], condition[1]);
        break;
      case 'innerJoin':
        query = query.innerJoin(`${table} as ${alias}`, condition[0], condition[1]);
        break;
      case 'outerJoin':
        query = query.outerJoin(`${table} as ${alias}`, condition[0], condition[1]);
        break;
      default:
        logger.warn(`Unsupported join type: ${type}`);
    }
  });

  return query;
}

export default DataWarehouseService;