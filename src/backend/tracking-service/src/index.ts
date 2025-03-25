import { startServer } from './app';
import logger from '../../common/utils/logger';

/**
 * Main function that starts the tracking service
 */
const main = async (): Promise<void> => {
  // Log the start of the tracking service initialization
  logger.info('Starting tracking service...');

  try {
    // Call the startServer function to initialize and start the HTTP server
    const server = await startServer();

    // Log successful startup with the server port
    logger.info(`Tracking service started successfully on port ${server.address().port}`);
  } catch (error) {
    // Handle any errors during startup by logging them
    logger.error('Failed to start tracking service', { error });

    // For unhandled errors, log them and exit the process with a non-zero status code
    logger.error('Unhandled exception: Failed to start tracking service, exiting process', { error });
    process.exit(1);
  }
};

// Invoke the main function to start the tracking service
main();