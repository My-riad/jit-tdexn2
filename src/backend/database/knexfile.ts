/**
 * Knex Database Configuration
 * 
 * This file defines database connection settings for different environments 
 * (development, test, staging, production). It's used by the Knex CLI for
 * running migrations and seeds, and serves as the central configuration
 * for database connections across the AI-driven Freight Optimization Platform.
 * 
 * The configuration supports:
 * - PostgreSQL with PostGIS for relational data
 * - TimescaleDB for time-series data like position updates
 * - Different pool sizes and settings per environment
 * - Environment-specific migrations and seeds
 */

import path from 'path';
import { getDatabaseConfig, getTimescaleConfig } from '../common/config/database.config';
import { NODE_ENV, getEnv } from '../common/config/environment.config';
import logger from '../common/utils/logger';

/**
 * Retrieves migration configuration for Knex based on the environment
 * 
 * @param directory - Optional custom migrations directory name
 * @returns Migration configuration object with directory and table name
 */
function getMigrationConfig(directory = 'migrations') {
  // Define migrations directory path relative to this file
  const migrationsDir = path.join(__dirname, directory);
  
  // Define migrations table name for tracking applied migrations
  const migrationsTableName = 'knex_migrations';
  
  logger.info(`Configuring migrations with directory: ${migrationsDir}`);
  
  return {
    directory: migrationsDir,
    tableName: migrationsTableName
  };
}

/**
 * Retrieves seed configuration for Knex based on the environment
 * 
 * @returns Seed configuration object with directory
 */
function getSeedConfig() {
  // Define seeds directory path relative to this file
  const seedsDir = path.join(__dirname, 'seeds');
  
  logger.info(`Configuring seeds with directory: ${seedsDir}`);
  
  return {
    directory: seedsDir
  };
}

// Log current environment
logger.info(`Initializing Knex configuration for environment: ${NODE_ENV}`);

// Create configuration for all environments
const config = {
  // Development environment configuration
  development: {
    client: 'postgresql',
    connection: getDatabaseConfig().connection,
    pool: {
      min: 2,
      max: 10
    },
    migrations: getMigrationConfig(),
    seeds: getSeedConfig(),
    debug: true
  },
  
  // Test environment configuration
  test: {
    client: 'postgresql',
    connection: getDatabaseConfig().connection,
    pool: {
      min: 2,
      max: 10
    },
    migrations: getMigrationConfig(),
    seeds: getSeedConfig(),
    debug: false
  },
  
  // Staging environment configuration
  staging: {
    client: 'postgresql',
    connection: getDatabaseConfig().connection,
    pool: {
      min: 2,
      max: 20
    },
    migrations: getMigrationConfig(),
    seeds: getSeedConfig(),
    debug: false
  },
  
  // Production environment configuration
  production: {
    client: 'postgresql',
    connection: getDatabaseConfig().connection,
    pool: {
      min: 5,
      max: 30
    },
    migrations: getMigrationConfig(),
    seeds: getSeedConfig(),
    debug: false
  },
  
  // Special configuration for TimescaleDB time-series database
  timescale: {
    client: 'postgresql',
    connection: getTimescaleConfig(),
    pool: {
      min: 2,
      max: 20
    },
    migrations: getMigrationConfig('timescale_migrations'),
    debug: false
  }
};

// Export the configuration
export default config;