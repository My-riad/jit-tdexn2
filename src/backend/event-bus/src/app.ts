import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0
import compression from 'compression'; // compression@^1.7.4
import morgan from 'morgan'; // morgan@^1.10.0
import {
  EVENT_BUS_SERVICE_NAME,
  EVENT_BUS_PORT,
  EVENT_BUS_HOST
} from './config';
import KafkaService from './services/kafka.service';
import SchemaRegistryService from './services/schema-registry.service';
import healthRoutes from './routes/health.routes';
import topicsRoutes from './routes/topics.routes';
import { loggingMiddleware, responseLoggingMiddleware } from '../../common/middleware/logging.middleware';
import { errorMiddleware, notFoundMiddleware } from '../../common/middleware/error.middleware';
import logger from '../../common/utils/logger';

// Create an Express application instance
const app = express();

// Create instances of KafkaService and SchemaRegistryService
const schemaRegistryService = new SchemaRegistryService();
const kafkaService = new KafkaService(schemaRegistryService);

/**
 * Initializes all required services for the Event Bus
 * @returns Promise that resolves when all services are initialized
 */
const initializeServices = async (): Promise<void> => {
  try {
    // Initialize Schema Registry service
    logger.info('Initializing Schema Registry service...');
    // No specific initialization needed for SchemaRegistryService

    // Initialize Kafka service with the Schema Registry service
    logger.info('Initializing Kafka service...');
    await kafkaService.initialize();

    // Log successful service initialization
    logger.info('All services initialized successfully.');
  } catch (error: any) {
    // Log and handle any errors during service initialization
    logger.error('Service initialization failed.', { error: error.message });
    throw error; // Re-throw the error to prevent server startup
  }
};

/**
 * Configures Express middleware for the application
 * @returns void
 */
const setupMiddleware = (): void => {
  // Apply helmet middleware for security headers
  app.use(helmet());

  // Apply CORS middleware for cross-origin requests
  app.use(cors());

  // Apply compression middleware for response compression
  app.use(compression());

  // Apply JSON body parser middleware
  app.use(express.json());

  // Apply URL-encoded body parser middleware
  app.use(express.urlencoded({ extended: true }));

  // Apply logging middleware with service name
  app.use(loggingMiddleware(EVENT_BUS_SERVICE_NAME));

  // Apply morgan request logger in development mode
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
};

/**
 * Configures API routes for the application
 * @returns void
 */
const setupRoutes = (): void => {
  // Mount health check routes at /health
  app.use('/health', healthRoutes);

  // Mount topic management routes at /api/v1
  app.use('/api/v1', topicsRoutes);

  // Apply not found middleware for unmatched routes
  app.use(notFoundMiddleware);

  // Apply error middleware for centralized error handling
  app.use(errorMiddleware);

  // Log successful route setup
  logger.info('API routes setup completed.');
};

/**
 * Starts the HTTP server on the configured port
 * @returns Promise that resolves when the server is started
 */
const startServer = async (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // Create HTTP server with the Express application
    const server = app.listen(EVENT_BUS_PORT, EVENT_BUS_HOST, () => {
      // Log successful server start with port information
      logger.info(`Server listening on port ${EVENT_BUS_PORT}`);
      resolve();
    });

    // Handle server startup errors
    server.on('error', (error: Error) => {
      logger.error('Server startup failed.', { error: error.message });
      reject(error);
    });
  });
};

/**
 * Configures graceful shutdown handlers for the application
 * @returns void
 */
const setupGracefulShutdown = (): void => {
  // Register handler for SIGTERM signal
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal. Starting graceful shutdown...');
    await shutdown();
  });

  // Register handler for SIGINT signal
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal. Starting graceful shutdown...');
    await shutdown();
  });

  // Define shutdown function
  const shutdown = async () => {
    try {
      // Log shutdown signal reception
      logger.info('Shutdown signal received. Closing server connections...');

      // Close HTTP server connections
      // server.close((err) => { // Removed server from global scope
      //   if (err) {
      //     logger.error('Error closing server connections', { error: err.message });
      //     process.exitCode = 1;
      //   }
      // });

      // Shut down Kafka service
      logger.info('Shutting down Kafka service...');
      await kafkaService.shutdown();

      // Log successful shutdown
      logger.info('Shutdown completed successfully. Exiting process.');

      // Exit process with success code
      process.exit(0);
    } catch (error: any) {
      // Log shutdown errors
      logger.error('Error during shutdown.', { error: error.message });
      process.exitCode = 1;
    } finally {
      // Exit process after shutdown attempts
      process.exit();
    }
  };
};

// Initialize the application
(async () => {
  try {
    // Initialize services
    await initializeServices();

    // Set up middleware
    setupMiddleware();

    // Set up routes
    setupRoutes();

    // Set up graceful shutdown handlers
    setupGracefulShutdown();

    // Start the server
    await startServer();
  } catch (error: any) {
    // Log and exit if startup fails
    logger.error('Application startup failed.', { error: error.message });
    process.exit(1);
  }
})();

// Export the configured Express application
export { app };

// Export functions to initialize services
export { initializeServices };

// Export functions to set up middleware
export { setupMiddleware };

// Export functions to set up routes
export { setupRoutes };

// Export functions to start the server
export { startServer };

// Export functions to set up graceful shutdown
export { setupGracefulShutdown };