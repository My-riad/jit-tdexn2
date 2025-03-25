import { initializeApp, startServer, setupGracefulShutdown } from './app';
import logger from '../../common/utils/logger'; // version: 1.0
import * as config from './config'; // version: 1.0

/**
 * Initializes the application and starts the server
 * @returns Promise<void>: Promise that resolves when the server is started
 */
const bootstrap = async (): Promise<void> => {
  try {
    // LD1: Log service startup message
    logger.info(`${config.SERVICE_NAME} is starting...`);

    // LD1: Initialize service configurations
    await config.initializeConfigurations();

    // LD1: Initialize the Express application
    const app = await initializeApp();

    // LD1: Start the HTTP server on the configured port
    const server = await startServer(app);

    // LD1: Set up graceful shutdown handlers
    setupGracefulShutdown(server);

    // LD1: Log successful server startup
    logger.info(`${config.SERVICE_NAME} started successfully`);
  } catch (error: any) {
    // LD1: Handle and log any errors during startup
    logger.error(`${config.SERVICE_NAME} failed to start`, { error: error.message });
    process.exit(1); // Exit process with error code
  }
};

// Start the application bootstrap process
bootstrap();