import { app, startServer, stopServer } from './app';
import logger from '../../common/utils/logger'; // version: according to package.json of common module

/**
 * Sets up event handlers for graceful shutdown on process termination signals
 */
const handleShutdown = (): void => {
  // 1. Set up event handler for SIGTERM signal
  process.on('SIGTERM', async () => {
    // 2. Set up event handler for SIGINT signal
    logger.info('Received SIGTERM signal: Shutting down Cache service...');
    // 3. In each handler, log shutdown initiation
    // 4. Call stopServer to gracefully stop the HTTP server
    await stopServer();
    // 5. Exit the process with appropriate code
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal: Shutting down Cache service...');
    await stopServer();
    process.exit(0);
  });
};

/**
 * Main function that initializes and starts the cache service
 * @returns Promise that resolves when server is started
 */
const main = async (): Promise<void> => {
  // 1. Log application startup
  logger.info('Starting Cache service...');

  // 2. Set up shutdown handlers
  handleShutdown();

  try {
    // 3. Start the HTTP server using startServer function
    await startServer();

    // 4. Log successful startup
    logger.info('Cache service started successfully.');
  } catch (error) {
    // 5. Handle any startup errors
    logger.error('Failed to start Cache service', { error });
    process.exit(1);
  }
};

// Call main function to start the application
main();

// Handle any unhandled promise rejections by logging and exiting
process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason,
    promise,
    stack: reason.stack,
  });
  process.exit(1);
});