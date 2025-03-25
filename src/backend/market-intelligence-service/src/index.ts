import http from 'http'; // http@^1.0.0
import { app, initializeApp } from './app';
import { initializeConfig, SERVICE_NAME } from './config';
import logger from '../../common/utils/logger';

// Define the port the service will run on, defaulting to 3004 if not specified in the environment
const PORT = process.env.PORT || 3004;

// Declare the server variable in the global scope
declare global {
  var server: http.Server;
}

/**
 * Initializes the application and starts the HTTP server
 * @returns Promise<void> Promise that resolves when server is started
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize service configuration
    initializeConfig();

    // Initialize Express application
    const expressApp = initializeApp();

    // Create HTTP server with the Express app
    global.server = http.createServer(expressApp);

    // Start listening on the specified PORT
    global.server.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} started and listening on port ${PORT}`);
    });
  } catch (error) {
    // Handle any errors during startup
    logger.error('Startup error', { error });
    process.exit(1); // Exit the process with an error code
  }
};

/**
 * Handles graceful shutdown of the server and resources
 * @param signal The signal received (e.g., SIGINT, SIGTERM)
 * @returns void
 */
const gracefulShutdown = (signal: string): void => {
  logger.info(`Initiating graceful shutdown due to signal: ${signal}`);

  // Close the HTTP server with a timeout
  global.server.close((err) => {
    if (err) {
      logger.error('Error closing HTTP server', { error: err.message });
      process.exitCode = 1;
    } else {
      logger.info('HTTP server closed successfully');
    }

    // Close database connections
    // TODO: Implement database connection closing logic here

    // Close Redis connections
    // TODO: Implement Redis connection closing logic here

    // Close Kafka producers/consumers
    // TODO: Implement Kafka producer/consumer closing logic here

    logger.info('Shutdown complete. Exiting process.');
    process.exit(); // Exit the process
  });
};

// Start the server
startServer();

// Handle process termination signals for graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);