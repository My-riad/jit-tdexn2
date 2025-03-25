import http from 'http'; // http@^1.0.0

import { startServer, gracefulShutdown } from './app';
import logger from '../../common/utils/logger';
import { handleError } from '../../common/utils/error-handler';

// Define global constants for port and service name
const SERVICE_NAME = 'gamification-service';

/**
 * Main function that starts the server and sets up process signal handlers
 * @returns Promise<void> Promise that resolves when the server is started
 */
async function main(): Promise<void> {
  try {
    // Log service startup
    logger.info(`${SERVICE_NAME} is starting...`);

    // Call startServer to initialize the Express application and event consumers
    const { server, driverActivityConsumer, loadCompletionConsumer } = await startServer();

    // Store server and consumer references for graceful shutdown
    const serverRef = server as http.Server;
    const consumers = { driverActivityConsumer, loadCompletionConsumer };

    // Set up signal handlers for SIGTERM and SIGINT
    setupSignalHandlers(serverRef, consumers);

  } catch (error: any) {
    // Handle any errors during startup
    handleError(error, 'GamificationService.main');
  }
}

/**
 * Sets up handlers for process termination signals to ensure graceful shutdown
 * @param server http.Server
 * @param consumers object
 * @returns void No return value
 */
function setupSignalHandlers(server: http.Server, consumers: { driverActivityConsumer: any; loadCompletionConsumer: any; }): void {
  // Set up handler for SIGTERM signal
  process.on('SIGTERM', async () => {
    // Log signal reception
    logger.info('SIGTERM signal received');

    // Call gracefulShutdown with server and consumer references
    await gracefulShutdown(server, consumers.driverActivityConsumer, consumers.loadCompletionConsumer);

    // Exit process with success code after shutdown
    process.exit(0);
  });

  // Set up handler for SIGINT signal
  process.on('SIGINT', async () => {
    // Log signal reception
    logger.info('SIGINT signal received');

    // Call gracefulShutdown with server and consumer references
    await gracefulShutdown(server, consumers.driverActivityConsumer, consumers.loadCompletionConsumer);

    // Exit process with success code after shutdown
    process.exit(0);
  });
}

// Call the main function to start the service
main();