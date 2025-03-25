import { config } from 'dotenv'; // dotenv@^16.0.3
config();
import logger from '../../common/utils/logger';
import { handleError } from '../../common/utils/error-handler';
import { app, server } from './app';

// Define the service name
const SERVICE_NAME = 'integration-service';

/**
 * Gracefully shuts down the server and performs cleanup operations
 * @param signal The signal received that triggered the shutdown
 */
const handleShutdown = (signal: string): void => {
  // Log the shutdown signal received
  logger.info(`Received shutdown signal: ${signal}`, { service: SERVICE_NAME });

  // Close the HTTP server with a timeout
  server.close((err: Error | undefined) => {
    if (err) {
      // Log any errors during server closure
      logger.error('Error during server close', { error: err.message, service: SERVICE_NAME });
      process.exitCode = 1;
    }
    // Perform any necessary cleanup operations
    logger.info('Performing cleanup operations', { service: SERVICE_NAME });
    // Add cleanup logic here (e.g., database connection termination, resource release)

    // Exit the process with appropriate code
    logger.info('Exiting process', { service: SERVICE_NAME, exitCode: process.exitCode });
    process.exit();
  });
};

// Listen for shutdown signals and trigger graceful shutdown
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack, service: SERVICE_NAME });
  handleError(err, SERVICE_NAME);
  process.exit(1); // Exit the process with an error code
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled rejection', { reason: reason, promise: promise, service: SERVICE_NAME });
  handleError(reason, SERVICE_NAME);
  process.exit(1); // Exit the process with an error code
});