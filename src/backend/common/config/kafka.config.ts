/**
 * Kafka Configuration Module
 * 
 * This module provides standardized configuration for Kafka clients, producers, consumers,
 * and admin clients to ensure consistent Kafka connectivity across all microservices in the
 * AI-driven Freight Optimization Platform.
 * 
 * It supports the event-driven architecture of the platform by configuring Kafka as the main
 * event bus for high-volume events like position updates, status changes, and messaging.
 */

import { KafkaConfig, ProducerConfig, ConsumerConfig, AdminConfig } from 'kafkajs'; // kafkajs@2.2.4
import { getEnv, getEnvArray, getEnvNumber, getEnvBoolean } from './environment.config';
import logger from '../utils/logger';

// Global Kafka configuration constants from environment variables
const KAFKA_BROKERS = getEnvArray('KAFKA_BROKERS', ['localhost:9092']);
const KAFKA_CLIENT_ID = getEnv('KAFKA_CLIENT_ID', 'freight-optimization-platform');
const KAFKA_CONNECTION_TIMEOUT = getEnvNumber('KAFKA_CONNECTION_TIMEOUT', 3000);
const KAFKA_REQUEST_TIMEOUT = getEnvNumber('KAFKA_REQUEST_TIMEOUT', 30000);
const KAFKA_RETRY_MAX_RETRIES = getEnvNumber('KAFKA_RETRY_MAX_RETRIES', 5);
const KAFKA_RETRY_INITIAL_RETRY_TIME = getEnvNumber('KAFKA_RETRY_INITIAL_RETRY_TIME', 300);
const KAFKA_RETRY_MAX_RETRY_TIME = getEnvNumber('KAFKA_RETRY_MAX_RETRY_TIME', 30000);

// Producer specific configuration
const KAFKA_PRODUCER_ACKS = getEnvNumber('KAFKA_PRODUCER_ACKS', -1); // -1 means all (strongest guarantee)
const KAFKA_PRODUCER_COMPRESSION_TYPE = getEnv('KAFKA_PRODUCER_COMPRESSION_TYPE', 'gzip');

// Consumer specific configuration
const KAFKA_CONSUMER_AUTO_COMMIT = getEnvBoolean('KAFKA_CONSUMER_AUTO_COMMIT', true);
const KAFKA_CONSUMER_AUTO_COMMIT_INTERVAL = getEnvNumber('KAFKA_CONSUMER_AUTO_COMMIT_INTERVAL', 5000);
const KAFKA_CONSUMER_SESSION_TIMEOUT = getEnvNumber('KAFKA_CONSUMER_SESSION_TIMEOUT', 30000);
const KAFKA_CONSUMER_HEARTBEAT_INTERVAL = getEnvNumber('KAFKA_CONSUMER_HEARTBEAT_INTERVAL', 3000);
const KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION = getEnvNumber('KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION', 1048576); // 1MB
const KAFKA_CONSUMER_RETRY_MAX_RETRIES = getEnvNumber('KAFKA_CONSUMER_RETRY_MAX_RETRIES', 10);

// Admin client specific configuration
const KAFKA_ADMIN_ALLOW_AUTO_TOPIC_CREATION = getEnvBoolean('KAFKA_ADMIN_ALLOW_AUTO_TOPIC_CREATION', true);

// Topic configuration defaults
const KAFKA_DEFAULT_PARTITIONS = getEnvNumber('KAFKA_DEFAULT_PARTITIONS', 3);
const KAFKA_DEFAULT_REPLICATION_FACTOR = getEnvNumber('KAFKA_DEFAULT_REPLICATION_FACTOR', 3);

/**
 * Interface defining the structure of Kafka configuration
 */
interface KafkaConfiguration {
  brokers: string[];
  clientId: string;
  connectionTimeout: number;
  requestTimeout: number;
  retry: {
    maxRetries: number;
    initialRetryTime: number;
    maxRetryTime: number;
  };
}

/**
 * Returns the base Kafka client configuration
 * 
 * This function creates the foundation Kafka client configuration used by all Kafka clients.
 * It retrieves settings from environment variables with sensible defaults.
 * 
 * @returns Kafka client configuration object
 */
export const getKafkaConfig = (): KafkaConfig => {
  logger.info('Initializing Kafka client configuration', {
    brokers: KAFKA_BROKERS,
    clientId: KAFKA_CLIENT_ID
  });

  return {
    brokers: KAFKA_BROKERS,
    clientId: KAFKA_CLIENT_ID,
    connectionTimeout: KAFKA_CONNECTION_TIMEOUT,
    requestTimeout: KAFKA_REQUEST_TIMEOUT,
    retry: {
      maxRetries: KAFKA_RETRY_MAX_RETRIES,
      initialRetryTime: KAFKA_RETRY_INITIAL_RETRY_TIME,
      maxRetryTime: KAFKA_RETRY_MAX_RETRY_TIME,
    }
  };
};

/**
 * Returns the Kafka producer configuration
 * 
 * This function creates configuration for Kafka producers with settings optimized for
 * reliability and performance. The default configuration prioritizes message durability
 * with 'acks: -1' (all brokers must acknowledge) and enables idempotence to prevent
 * duplicate messages.
 * 
 * @returns Kafka producer configuration object
 */
export const getProducerConfig = (): ProducerConfig => {
  logger.info('Initializing Kafka producer configuration');

  return {
    // Acknowledgment level:
    // -1 = acks from all replicas (strongest guarantee)
    // 0 = no acks (fastest but can lose messages)
    // 1 = ack from leader only (balanced)
    acks: KAFKA_PRODUCER_ACKS,
    // Compression reduces bandwidth usage and storage at the cost of CPU
    compression: KAFKA_PRODUCER_COMPRESSION_TYPE as any, // Type assertion for string from env
    // Idempotent producers ensure exactly-once delivery semantics
    idempotent: true,
    // Retry configuration for failed message sends
    retry: {
      maxRetries: KAFKA_RETRY_MAX_RETRIES,
      initialRetryTime: KAFKA_RETRY_INITIAL_RETRY_TIME,
      maxRetryTime: KAFKA_RETRY_MAX_RETRY_TIME,
    }
  };
};

/**
 * Returns the Kafka consumer configuration for a specific consumer group
 * 
 * This function creates configuration for Kafka consumers with settings balanced for
 * reliability and performance. It includes configurations for auto-commit behavior,
 * session management, and retry policies.
 * 
 * @param groupId - The consumer group ID
 * @returns Kafka consumer configuration object
 */
export const getConsumerConfig = (groupId: string): ConsumerConfig => {
  logger.info('Initializing Kafka consumer configuration', { groupId });

  return {
    groupId,
    // Auto-commit offsets configuration
    // When true, consumer will commit offsets automatically at specified interval
    autoCommit: KAFKA_CONSUMER_AUTO_COMMIT,
    autoCommitInterval: KAFKA_CONSUMER_AUTO_COMMIT_INTERVAL,
    // Session management
    // How long a consumer can be out of contact before being removed from the group
    sessionTimeout: KAFKA_CONSUMER_SESSION_TIMEOUT,
    // How frequently the consumer sends heartbeats to the coordinator
    heartbeatInterval: KAFKA_CONSUMER_HEARTBEAT_INTERVAL,
    // Performance tuning
    // Maximum number of bytes to fetch per partition per request
    maxBytesPerPartition: KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION,
    // Retry configuration for failed consumer operations
    retry: {
      maxRetries: KAFKA_CONSUMER_RETRY_MAX_RETRIES,
      initialRetryTime: KAFKA_RETRY_INITIAL_RETRY_TIME,
      maxRetryTime: KAFKA_RETRY_MAX_RETRY_TIME
    }
  };
};

/**
 * Returns the Kafka admin client configuration
 * 
 * This function creates configuration for Kafka admin clients used for topic management
 * and other administrative operations.
 * 
 * @returns Kafka admin client configuration object
 */
export const getAdminConfig = (): AdminConfig => {
  logger.info('Initializing Kafka admin client configuration');

  return {
    // Whether to automatically create topics when they don't exist
    allowAutoTopicCreation: KAFKA_ADMIN_ALLOW_AUTO_TOPIC_CREATION,
    // Retry configuration for failed admin operations
    retry: {
      maxRetries: KAFKA_RETRY_MAX_RETRIES,
      initialRetryTime: KAFKA_RETRY_INITIAL_RETRY_TIME,
      maxRetryTime: KAFKA_RETRY_MAX_RETRY_TIME
    }
  };
};

/**
 * Returns the configuration for creating a new Kafka topic
 * 
 * This function creates standardized configuration for Kafka topics with sensible defaults
 * that can be overridden by environment variables or parameters.
 * 
 * @param topic - The topic name
 * @param numPartitions - Number of partitions for the topic (default: from environment)
 * @param replicationFactor - Replication factor for the topic (default: from environment)
 * @returns Topic configuration object
 */
export const getTopicConfig = (
  topic: string,
  numPartitions: number = KAFKA_DEFAULT_PARTITIONS,
  replicationFactor: number = KAFKA_DEFAULT_REPLICATION_FACTOR
): { topic: string; numPartitions: number; replicationFactor: number; configEntries?: Array<{ name: string; value: string }> } => {
  logger.info('Creating Kafka topic configuration', {
    topic,
    numPartitions,
    replicationFactor
  });

  return {
    topic,
    numPartitions,
    replicationFactor,
    configEntries: [
      {
        // cleanup.policy: 'delete' (standard time-based deletion) or 'compact' (key-based compaction)
        name: 'cleanup.policy',
        value: getEnv('KAFKA_TOPIC_CLEANUP_POLICY', 'delete')
      },
      {
        // retention.ms: how long messages are kept in milliseconds (default: 7 days)
        name: 'retention.ms',
        value: getEnv('KAFKA_TOPIC_RETENTION_MS', '604800000')
      },
      {
        // min.insync.replicas: minimum number of replicas that must acknowledge writes
        // for producer with acks=all (-1), this setting affects durability
        name: 'min.insync.replicas',
        value: getEnv('KAFKA_TOPIC_MIN_INSYNC_REPLICAS', '2')
      }
    ]
  };
};

// Export configuration constants for use in other modules
export { KAFKA_DEFAULT_PARTITIONS, KAFKA_DEFAULT_REPLICATION_FACTOR };