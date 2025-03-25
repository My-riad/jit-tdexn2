import {
  app,
  initializeServices,
  setupMiddleware,
  setupRoutes,
  startServer,
  setupGracefulShutdown
} from './app'; // Import the Express application and setup functions
import logger from '../../common/utils/logger'; // Import logging utility for application logs
import { EVENT_BUS_SERVICE_NAME } from './config'; // Import service name for logging and identification

/**
 * Initializes and starts the Event Bus service
 */
const bootstrap = async (): Promise<void> => {
  try {
    // Log service startup with service name
    logger.info(`${EVENT_BUS_SERVICE_NAME} - Starting service...`);

    // Set up middleware for the Express application
    setupMiddleware();

    // Set up routes for the Express application
    setupRoutes();

    // Initialize required services (Kafka, Schema Registry)
    await initializeServices();

    // Set up graceful shutdown handlers
    setupGracefulShutdown();

    // Start the HTTP server
    await startServer();

    // Log successful service startup
    logger.info(`${EVENT_BUS_SERVICE_NAME} - Service started successfully`);
  } catch (error: any) {
    // Handle any errors during startup and log them
    logger.error(`${EVENT_BUS_SERVICE_NAME} - Service startup failed`, { error: error.message });
  }
};

// Start the Event Bus service
bootstrap();