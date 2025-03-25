/**
 * Database Configuration Utility
 * 
 * This module provides configuration and connection management for the various
 * databases used by the AI-driven Freight Optimization Platform, including
 * PostgreSQL with PostGIS for relational data and TimescaleDB for time-series data.
 */

import { Knex } from 'knex';
import knex from 'knex'; // knex@2.4.2
import { Pool } from 'pg'; // pg@8.10.0
import { getEnv, getEnvNumber, requireEnv, NODE_ENV } from './environment.config';
import logger from '../utils/logger';

// Keep a singleton instance of Knex
let knexInstance: Knex | null = null;

/**
 * Interface for database configuration
 */
export interface DatabaseConfig {
  client: string;
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
  };
  pool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
    acquireTimeoutMillis: number;
  };
  debug: boolean;
  useNullAsDefault: boolean;
  migrations?: {
    tableName: string;
    directory: string;
  };
  seeds?: {
    directory: string;
  };
}

/**
 * Interface for TimescaleDB configuration
 */
export interface TimescaleConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  poolSize?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Retrieves database configuration based on the current environment
 * 
 * @returns Database configuration object for the current environment
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  logger.info(`Getting database configuration for environment: ${NODE_ENV}`);
  
  const host = getEnv('DB_HOST', 'localhost');
  const port = getEnvNumber('DB_PORT', 5432);
  const database = getEnv('DB_NAME', 'freight_optimization');
  const user = getEnv('DB_USER', 'postgres');
  const password = getEnv('DB_PASSWORD', '');
  const debug = NODE_ENV === 'development';
  
  // Connection pool configuration
  const minPoolSize = getEnvNumber('DB_POOL_MIN', NODE_ENV === 'production' ? 10 : 2);
  const maxPoolSize = getEnvNumber('DB_POOL_MAX', NODE_ENV === 'production' ? 50 : 10);
  const idleTimeoutMillis = getEnvNumber('DB_IDLE_TIMEOUT', 30000);
  const acquireTimeoutMillis = getEnvNumber('DB_ACQUIRE_TIMEOUT', 60000);
  
  // SSL configuration (enabled by default in production/staging)
  const sslEnabled = getEnv('DB_SSL_ENABLED', 
    (NODE_ENV === 'production' || NODE_ENV === 'staging') ? 'true' : 'false'
  ) === 'true';
  
  const sslRejectUnauthorized = getEnv('DB_SSL_REJECT_UNAUTHORIZED', 'true') === 'true';
  
  // Create the configuration object
  const config: DatabaseConfig = {
    client: 'pg',
    connection: {
      host,
      port,
      user,
      password,
      database,
      ...(sslEnabled ? { ssl: { rejectUnauthorized: sslRejectUnauthorized } } : {})
    },
    pool: {
      min: minPoolSize,
      max: maxPoolSize,
      idleTimeoutMillis,
      acquireTimeoutMillis
    },
    debug,
    useNullAsDefault: true,
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  };
  
  // Environment-specific adjustments
  if (NODE_ENV === 'test') {
    // Use a different database for testing
    const testDatabase = getEnv('TEST_DB_NAME', `${database}_test`);
    config.connection.database = testDatabase;
    // Smaller connection pool for tests
    config.pool.min = 1;
    config.pool.max = 5;
  }
  
  logger.info('Database configuration created', { 
    environment: NODE_ENV, 
    host: config.connection.host,
    database: config.connection.database,
    poolSize: `${config.pool.min}-${config.pool.max}` 
  });
  
  return config;
};

/**
 * Creates and configures a Knex instance for database access
 * 
 * @param config - Database configuration
 * @returns Configured Knex instance
 */
export const createKnexInstance = (config: DatabaseConfig): Knex => {
  logger.info('Creating Knex instance', { 
    environment: NODE_ENV, 
    database: config.connection.database 
  });
  
  const instance = knex(config);
  
  // Initialize PostGIS extension if needed
  if (NODE_ENV !== 'test') {
    // We don't need to await this as it's just setting up the extension
    // for future queries. If it fails, it will log an error.
    instance.raw('CREATE EXTENSION IF NOT EXISTS postgis')
      .then(() => {
        logger.info('PostGIS extension enabled');
      })
      .catch((error) => {
        logger.error('Failed to enable PostGIS extension', { error });
      });
  }
  
  return instance;
};

/**
 * Gets a singleton Knex instance for the current environment
 * 
 * @returns Singleton Knex instance
 */
export const getKnexInstance = (): Knex => {
  if (!knexInstance) {
    const config = getDatabaseConfig();
    knexInstance = createKnexInstance(config);
    logger.info('Knex instance created', { environment: NODE_ENV });
  }
  
  return knexInstance;
};

/**
 * Closes the Knex database connection
 * 
 * @returns Promise that resolves when connection is closed
 */
export const closeKnexConnection = async (): Promise<void> => {
  if (knexInstance) {
    try {
      await knexInstance.destroy();
      logger.info('Knex connection closed');
      knexInstance = null;
    } catch (error) {
      logger.error('Failed to close Knex connection', { error });
    }
  }
  
  return Promise.resolve();
};

/**
 * Retrieves TimescaleDB configuration for time-series data
 * 
 * @returns TimescaleDB configuration object
 */
export const getTimescaleConfig = (): TimescaleConfig => {
  logger.info(`Getting TimescaleDB configuration for environment: ${NODE_ENV}`);
  
  const host = getEnv('TIMESCALE_HOST', getEnv('DB_HOST', 'localhost'));
  const port = getEnvNumber('TIMESCALE_PORT', getEnvNumber('DB_PORT', 5432));
  const database = getEnv('TIMESCALE_DB_NAME', `${getEnv('DB_NAME', 'freight_optimization')}_timeseries`);
  const user = getEnv('TIMESCALE_USER', getEnv('DB_USER', 'postgres'));
  const password = getEnv('TIMESCALE_PASSWORD', getEnv('DB_PASSWORD', ''));
  
  // Pool configuration
  const poolSize = getEnvNumber('TIMESCALE_POOL_SIZE', NODE_ENV === 'production' ? 30 : 5);
  const idleTimeoutMillis = getEnvNumber('TIMESCALE_IDLE_TIMEOUT', 30000);
  const connectionTimeoutMillis = getEnvNumber('TIMESCALE_CONNECTION_TIMEOUT', 60000);
  
  // SSL configuration (enabled by default in production/staging)
  const sslEnabled = getEnv('TIMESCALE_SSL_ENABLED', 
    (NODE_ENV === 'production' || NODE_ENV === 'staging') ? 'true' : 'false'
  ) === 'true';
  
  const sslRejectUnauthorized = getEnv('TIMESCALE_SSL_REJECT_UNAUTHORIZED', 'true') === 'true';
  
  // Create the configuration object
  const config: TimescaleConfig = {
    host,
    port,
    database,
    user,
    password,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: sslRejectUnauthorized } } : {}),
    poolSize,
    idleTimeoutMillis,
    connectionTimeoutMillis
  };
  
  // Environment-specific adjustments
  if (NODE_ENV === 'test') {
    // Use a different database for testing
    const testDatabase = getEnv('TEST_TIMESCALE_DB_NAME', `${database}_test`);
    config.database = testDatabase;
    // Smaller connection pool for tests
    config.poolSize = 2;
  }
  
  logger.info('TimescaleDB configuration created', { 
    environment: NODE_ENV, 
    host: config.host,
    database: config.database,
    poolSize: config.poolSize 
  });
  
  return config;
};

/**
 * Validates database connection by performing a test query
 * 
 * @returns Promise that resolves to true if connection is valid
 */
export const validateDatabaseConnection = async (): Promise<boolean> => {
  try {
    const db = getKnexInstance();
    await db.raw('SELECT 1');
    logger.info('Database connection validated successfully');
    return true;
  } catch (error) {
    logger.error('Database connection validation failed', { error });
    return false;
  }
};