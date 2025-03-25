import { OPTIMIZATION_ENGINE_PORT, getOptimizationConfig } from './config';
import { OptimizationService } from './services/optimization.service';
import { SmartHubService } from './services/smart-hub.service';
import { RelayService } from './services/relay.service';
import { PredictionService } from './services/prediction.service';
import { DriverPositionConsumer } from './consumers/driver-position.consumer';
import { LoadStatusConsumer } from './consumers/load-status.consumer';
import app from './app';
import logger from '../../common/utils/logger';
import { Kafka } from 'kafkajs'; // kafkajs@^2.2.4
import http from 'http'; // http@^0.0.1-security

// Define global constants for the current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Define global variables for services and consumers
const services = {
  optimizationService: null as OptimizationService | null,
  smartHubService: null as SmartHubService | null,
  relayService: null as RelayService | null,
  predictionService: null as PredictionService | null
};

const consumers = {
  driverPositionConsumer: null as DriverPositionConsumer | null,
  loadStatusConsumer: null as LoadStatusConsumer | null
};

let server: http.Server | null = null;
let kafka: Kafka | null = null;

/**
 * Initializes the Kafka client for event-driven communication
 * @returns Initialized Kafka client
 */
async function initializeKafka(): Promise<Kafka> {
  // LD1: Create a new Kafka client with broker configuration from environment
  const kafkaClient = new Kafka(getKafkaConfig());

  // Log successful Kafka initialization
  logger.info('Kafka client initialized');

  // Return the initialized Kafka client
  return kafkaClient;
}

/**
 * Initializes all required services for the optimization engine
 * @param kafka Initialized Kafka client
 * @returns Object containing all initialized service instances
 */
async function initializeServices(kafka: Kafka): Promise<typeof services> {
  // Get optimization configuration using getOptimizationConfig()
  const optimizationConfig = getOptimizationConfig();

  // Initialize OptimizationService with configuration
  services.optimizationService = new OptimizationService(optimizationConfig);

  // Initialize SmartHubService with configuration
  services.smartHubService = new SmartHubService();

  // Initialize RelayService with configuration
  services.relayService = new RelayService(logger, services.smartHubService);

  // Initialize PredictionService with configuration
  services.predictionService = new PredictionService({});

  // Log successful service initialization
  logger.info('All services initialized successfully');

  // Return object containing all initialized services
  return services;
}

/**
 * Initializes Kafka consumers for event processing
 * @param kafka Initialized Kafka client
 * @param services Object containing all initialized service instances
 * @returns Object containing all initialized consumer instances
 */
async function initializeConsumers(kafka: Kafka, services: typeof services): Promise<typeof consumers> {
  // Initialize DriverPositionConsumer with Kafka client and optimization service
  consumers.driverPositionConsumer = new DriverPositionConsumer(kafka);

  // Initialize LoadStatusConsumer with Kafka client and optimization service
  consumers.loadStatusConsumer = new LoadStatusConsumer(kafka);

  // Log successful consumer initialization
  logger.info('All consumers initialized successfully');

  // Return object containing all initialized consumers
  return consumers;
}

/**
 * Starts the HTTP server and event consumers
 * @returns Promise that resolves when server and consumers are started
 */
async function startServer(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Start HTTP server listening on OPTIMIZATION_ENGINE_PORT
    server = app.listen(OPTIMIZATION_ENGINE_PORT, async () => {
      logger.info(`Optimization Engine listening on port ${OPTIMIZATION_ENGINE_PORT}`);

      try {
        // Start all Kafka consumers to begin processing events
        await consumers.driverPositionConsumer!.start();
        await consumers.loadStatusConsumer!.start();

        // Log successful server and consumer startup
        logger.info('Server and consumers started successfully');
        resolve();
      } catch (consumerError) {
        logger.error('Failed to start consumers', { error: consumerError });
        reject(consumerError);
      }
    });

    server.on('error', (serverError) => {
      logger.error('Server startup failed', { error: serverError });
      reject(serverError);
    });
  });
}

/**
 * Handles graceful shutdown of the server, services, and consumers
 * @returns Promise that resolves when shutdown is complete
 */
async function gracefulShutdown(): Promise<void> {
  // Log shutdown initiation
  logger.info('Initiating graceful shutdown');

  try {
    // Stop all Kafka consumers
    await consumers.driverPositionConsumer!.stop();
    await consumers.loadStatusConsumer!.stop();

    // Close HTTP server to stop accepting new connections
    server!.close(async (err: Error) => {
      if (err) {
        logger.error('Error closing server', { error: err.message });
        process.exitCode = 1;
      }

      // Shutdown all services gracefully
      await services.optimizationService!.shutdown();

      // Log successful shutdown completion
      logger.info('Shutdown complete');
      process.exit();
    });
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
}

/**
 * Sets up process event handlers for graceful shutdown
 */
function setupShutdownHandlers(): void {
  // Set up handler for SIGTERM signal
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal');
    gracefulShutdown();
  });

  // Set up handler for SIGINT signal
  process.on('SIGINT', () => {
    logger.info('Received SIGINT signal');
    gracefulShutdown();
  });

  // Set up handler for uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  // Set up handler for unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', { reason, promise });
    process.exit(1);
  });
}

/**
 * Main function that orchestrates the application startup
 * @returns Promise that resolves when application is started
 */
async function main(): Promise<void> {
  try {
    // Initialize Kafka client
    kafka = await initializeKafka();

    // Initialize all required services
    await initializeServices(kafka);

    // Initialize event consumers
    await initializeConsumers(kafka, services);

    // Set up shutdown handlers
    setupShutdownHandlers();

    // Start the server and consumers
    await startServer();

    // Log successful application startup
    logger.info('Optimization Engine started successfully');
  } catch (error) {
    // Handle any startup errors
    logger.error('Optimization Engine failed to start', { error });
    process.exit(1);
  }
}

// Start the application
main();