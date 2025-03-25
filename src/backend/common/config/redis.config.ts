/**
 * Redis Configuration Module
 * 
 * This module provides functions to create, configure and manage Redis client
 * connections based on environment settings. It includes support for standalone Redis,
 * Redis Cluster, and Redis Sentinel configurations with proper connection pooling,
 * error handling, and cleanup.
 */

import Redis from 'ioredis'; // ioredis@5.3.2
import {
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean
} from './environment.config';
import logger from '../utils/logger';

// Store Redis clients to reuse connections and ensure proper cleanup
const redisClients = new Map<string, Redis>();

/**
 * Interface defining Redis configuration options
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  tls: boolean;
  connectTimeout: number;
  maxRetriesPerRequest: number;
  retryTimeout: number;
}

/**
 * Retrieves Redis configuration from environment variables with sensible defaults
 * 
 * @returns Configuration object for Redis client
 */
export const getRedisConfig = (): RedisConfig => {
  const host = getEnv('REDIS_HOST', '127.0.0.1');
  const port = getEnvNumber('REDIS_PORT', 6379);
  const password = getEnv('REDIS_PASSWORD', '');
  const db = getEnvNumber('REDIS_DB', 0);
  const tls = getEnvBoolean('REDIS_TLS', false);
  const connectTimeout = getEnvNumber('REDIS_CONNECT_TIMEOUT', 10000);
  const maxRetriesPerRequest = getEnvNumber('REDIS_MAX_RETRIES', 3);
  const retryTimeout = getEnvNumber('REDIS_RETRY_TIMEOUT', 5000);

  const config: RedisConfig = {
    host,
    port,
    db,
    tls,
    connectTimeout,
    maxRetriesPerRequest,
    retryTimeout
  };

  // Only include password if it's set
  if (password) {
    config.password = password;
  }

  return config;
};

/**
 * Gets or creates a Redis client instance with default configuration
 * 
 * @param clientName - Unique name to identify this client (defaults to 'default')
 * @returns Configured Redis client instance
 */
export const getDefaultRedisClient = (clientName = 'default'): Redis => {
  // Check if a client with this name already exists
  if (redisClients.has(clientName)) {
    return redisClients.get(clientName)!;
  }

  // Create a new Redis client with configuration from environment
  const config = getRedisConfig();
  logger.debug('Creating new Redis client with configuration', {
    clientName,
    config: { ...config, password: config.password ? '***' : undefined }
  });

  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    tls: config.tls ? {} : undefined,
    connectTimeout: config.connectTimeout,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, config.retryTimeout);
      logger.debug(`Redis retrying connection (attempt ${times}) in ${delay}ms`, { clientName });
      return delay;
    }
  });

  // Set up event handlers
  client.on('connect', () => {
    logger.info(`Redis client connected successfully`, { clientName, host: config.host, port: config.port });
  });

  client.on('error', (err) => {
    logger.error(`Redis client encountered an error`, { clientName, error: err });
  });

  client.on('ready', () => {
    logger.info(`Redis client ready to receive commands`, { clientName });
  });

  client.on('reconnecting', () => {
    logger.info(`Redis client reconnecting`, { clientName });
  });

  // Store the client for reuse
  redisClients.set(clientName, client);
  return client;
};

/**
 * Safely closes a Redis client connection and removes it from the clients map
 * 
 * @param client - The Redis client to close (optional if clientName is provided)
 * @param clientName - The name of the client to close (defaults to 'default')
 * @returns Promise that resolves when connection is closed
 */
export const closeRedisClient = async (client?: Redis, clientName = 'default'): Promise<void> => {
  // Get the client either from parameter or from the map
  const redisClient = client || redisClients.get(clientName);
  
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClients.delete(clientName);
      logger.info(`Redis client closed successfully`, { clientName });
    } catch (error) {
      logger.error(`Error closing Redis client`, { clientName, error });
      // Force disconnect if quit fails
      redisClient.disconnect();
      redisClients.delete(clientName);
    }
  } else {
    logger.debug(`No Redis client to close`, { clientName });
  }
};

/**
 * Safely closes all Redis client connections
 * 
 * @returns Promise that resolves when all connections are closed
 */
export const closeAllRedisClients = async (): Promise<void> => {
  const closePromises: Promise<void>[] = [];
  
  redisClients.forEach((client, name) => {
    closePromises.push(closeRedisClient(client, name));
  });
  
  await Promise.all(closePromises);
  redisClients.clear();
  logger.info('All Redis clients closed successfully');
};

/**
 * Creates a Redis Cluster client for high availability and sharding
 * 
 * @param nodes - Array of cluster nodes in host:port format
 * @param options - Additional cluster options
 * @returns Configured Redis Cluster client
 */
export const createRedisCluster = (
  nodes: string[],
  options?: Redis.ClusterOptions
): Redis.Cluster => {
  if (!nodes || nodes.length === 0) {
    throw new Error('Redis cluster nodes must be provided');
  }

  // Parse nodes into the format required by ioredis
  const clusterNodes = nodes.map(node => {
    const [host, portStr] = node.split(':');
    const port = parseInt(portStr || '6379', 10);
    return { host, port };
  });

  // Get cluster configuration from environment or use provided options
  const defaultOptions: Redis.ClusterOptions = {
    redisOptions: {
      password: getEnv('REDIS_PASSWORD', ''),
      tls: getEnvBoolean('REDIS_TLS', false) ? {} : undefined,
      connectTimeout: getEnvNumber('REDIS_CONNECT_TIMEOUT', 10000),
      maxRetriesPerRequest: getEnvNumber('REDIS_MAX_RETRIES', 3),
    },
    clusterRetryStrategy: (times: number) => {
      const delay = Math.min(times * 100, getEnvNumber('REDIS_RETRY_TIMEOUT', 5000));
      logger.debug(`Redis cluster retrying connection (attempt ${times}) in ${delay}ms`);
      return delay;
    },
    // Allow reading from replicas for better performance
    enableReadyCheck: true,
    scaleReads: 'slave', // 'slave' is the term used in ioredis API, representing read replicas
    maxRedirections: getEnvNumber('REDIS_MAX_REDIRECTIONS', 16),
    retryDelayOnFailover: getEnvNumber('REDIS_RETRY_DELAY_FAILOVER', 100),
    retryDelayOnClusterDown: getEnvNumber('REDIS_RETRY_DELAY_DOWN', 1000),
    ...options
  };

  logger.debug('Creating new Redis cluster client', {
    nodes: clusterNodes.map(n => `${n.host}:${n.port}`),
    options: { 
      ...defaultOptions, 
      redisOptions: { 
        ...defaultOptions.redisOptions, 
        password: defaultOptions.redisOptions?.password ? '***' : undefined 
      } 
    }
  });

  // Create the cluster client
  const cluster = new Redis.Cluster(clusterNodes, defaultOptions);

  // Set up event handlers
  cluster.on('connect', () => {
    logger.info('Redis cluster client connected successfully');
  });

  cluster.on('error', (err) => {
    logger.error('Redis cluster client encountered an error', { error: err });
  });

  cluster.on('ready', () => {
    logger.info('Redis cluster client ready to receive commands');
  });

  cluster.on('reconnecting', () => {
    logger.info('Redis cluster client reconnecting');
  });

  return cluster;
};

/**
 * Creates a Redis Sentinel client for high availability
 * 
 * @param name - The name of the Sentinel master
 * @param sentinels - Array of sentinel nodes in host:port format
 * @param options - Additional sentinel options
 * @returns Configured Redis Sentinel client
 */
export const createRedisSentinel = (
  name: string,
  sentinels: string[],
  options?: Redis.RedisOptions
): Redis => {
  if (!name) {
    throw new Error('Redis sentinel master name must be provided');
  }

  if (!sentinels || sentinels.length === 0) {
    throw new Error('Redis sentinel nodes must be provided');
  }

  // Parse sentinels into the format required by ioredis
  const sentinelNodes = sentinels.map(node => {
    const [host, portStr] = node.split(':');
    const port = parseInt(portStr || '26379', 10);
    return { host, port };
  });

  // Get sentinel configuration from environment or use provided options
  const defaultOptions: Redis.RedisOptions = {
    password: getEnv('REDIS_PASSWORD', ''),
    db: getEnvNumber('REDIS_DB', 0),
    tls: getEnvBoolean('REDIS_TLS', false) ? {} : undefined,
    connectTimeout: getEnvNumber('REDIS_CONNECT_TIMEOUT', 10000),
    maxRetriesPerRequest: getEnvNumber('REDIS_MAX_RETRIES', 3),
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 100, getEnvNumber('REDIS_RETRY_TIMEOUT', 5000));
      logger.debug(`Redis sentinel retrying connection (attempt ${times}) in ${delay}ms`);
      return delay;
    },
    sentinelRetryStrategy: (times: number) => {
      const delay = Math.min(times * 100, getEnvNumber('REDIS_SENTINEL_RETRY_TIMEOUT', 5000));
      logger.debug(`Redis sentinel discovery retrying (attempt ${times}) in ${delay}ms`);
      return delay;
    },
    sentinels: sentinelNodes,
    name,
    sentinelPassword: getEnv('REDIS_SENTINEL_PASSWORD', ''),
    ...options
  };

  logger.debug('Creating new Redis sentinel client', {
    name,
    sentinels: sentinelNodes.map(n => `${n.host}:${n.port}`),
    options: { 
      ...defaultOptions, 
      password: defaultOptions.password ? '***' : undefined,
      sentinelPassword: defaultOptions.sentinelPassword ? '***' : undefined
    }
  });

  // Create the sentinel client
  const client = new Redis(defaultOptions);

  // Set up event handlers
  client.on('connect', () => {
    logger.info('Redis sentinel client connected successfully');
  });

  client.on('error', (err) => {
    logger.error('Redis sentinel client encountered an error', { error: err });
  });

  client.on('ready', () => {
    logger.info('Redis sentinel client ready to receive commands');
  });

  client.on('reconnecting', () => {
    logger.info('Redis sentinel client reconnecting');
  });

  client.on('+switch-master', (args) => {
    logger.info('Redis sentinel master switched', { args });
  });

  return client;
};