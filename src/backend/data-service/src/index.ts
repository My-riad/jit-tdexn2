import { startServer } from './app';
import logger from '../../common/utils/logger';

// Define the service name
const SERVICE_NAME = 'data-service';

/**
 * Main function that starts the data service and handles any startup errors
 */
async function main(): Promise<void> {
  // Log the start of the data service initialization
  logger.info(`${SERVICE_NAME} initializing...`);

  try {
    // Call the startServer function to initialize configuration and start the HTTP server
    await startServer();

    // Log successful startup of the data service
    logger.info(`${SERVICE_NAME} started successfully`);
  } catch (error) {
    // Catch and log any errors that occur during startup
    logger.error(`${SERVICE_NAME} failed to start`, { error });

    // For unhandled errors, exit the process with a non-zero status code
    process.exit(1);
  }
}

// Run the main function to start the service
main();