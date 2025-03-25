import http from 'http'; // http@^1.0.0
import { startServer } from './app';
import logger from '../../common/utils/logger';

// Define global variables
let server: http.Server;

/**
 * Main function that initializes and starts the Authentication Service
 */
const main = async (): Promise<void> => {
  try {
    // LD1: Call startServer() to initialize and start the Express application
    server = await startServer();

    // LD1: Set up graceful shutdown handlers
    setupGracefulShutdown(server);

    // LD1: Set up global error handlers
    handleUncaughtErrors();

    // LD1: Log successful service startup
    logger.info('Authentication service started successfully');
  } catch (error) {
    // LD1: Handle and log any startup errors
    logger.error('Authentication service failed to start', { error });
    process.exit(1);
  }
};

/**
 * Sets up handlers for graceful shutdown on process termination signals
 * @param server - http.Server instance created from the Express app
 */
const setupGracefulShutdown = (server: http.Server): void => {
  // LD1: Set up handler for SIGTERM signal
  process.on('SIGTERM', async () => {
    // LD1: Log shutdown initiation
    logger.info('Received SIGTERM signal, initiating graceful shutdown...');
    await shutdownServer();
  });

  // LD1: Set up handler for SIGINT signal
  process.on('SIGINT', async () => {
    // LD1: Log shutdown initiation
    logger.info('Received SIGINT signal, initiating graceful shutdown...');
    await shutdownServer();
  });
};

/**
 * Sets up global handlers for uncaught exceptions and unhandled promise rejections
 */
const handleUncaughtErrors = (): void => {
  // LD1: Set up handler for uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    // LD1: Log error details with stack trace
    logger.error('Uncaught exception', {
      error: err.message,
      stack: err.stack
    });

    // LD1: Exit process with error code after logging
    process.exit(1);
  });

  // LD1: Set up handler for unhandled promise rejections
  process.on('unhandledRejection', (reason: Error | any) => {
    // LD1: Log error details with stack trace
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined
    });

    // LD1: Exit process with error code after logging
    process.exit(1);
  });
};

/**
 * Performs graceful shutdown of the server
 */
const shutdownServer = async (): Promise<void> => {
  // LD1: Log shutdown initiation
  logger.info('Shutting down server...');

  // LD1: Close HTTP server connections with a timeout
  server.close((err) => {
    if (err) {
      logger.error('Error closing server', { error: err });
      process.exitCode = 1;
    }

    // LD1: Log successful shutdown completion
    logger.info('Server shut down successfully');

    // LD1: Exit process with success code
    process.exit();
  });
};

// Start the service
main();