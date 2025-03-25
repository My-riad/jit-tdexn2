import http from 'http'; // http@^1.0.0

import app from './app';
import logger from '../../common/utils/logger';
import { initializeConfig, API_GATEWAY_CONFIG } from './config';

/**
 * Initializes configuration and starts the API Gateway server
 * @returns Promise that resolves when server starts successfully
 */
const startServer = async (): Promise<void> => {
  try {
    // LD1: Initialize configuration using initializeConfig()
    await initializeConfig();

    // LD1: Create HTTP server from Express app
    const server = http.createServer(app);

    // LD1: Start listening on configured port and host
    server.listen(API_GATEWAY_CONFIG.port, API_GATEWAY_CONFIG.host, () => {
      // LD1: Log successful server start with port information
      logger.info(`API Gateway started on port ${API_GATEWAY_CONFIG.port} and host ${API_GATEWAY_CONFIG.host}`);
    });

    // Assign the server instance to the global scope for graceful shutdown
    (global as any).server = server;
  } catch (error) {
    // LD1: Handle and log any startup errors
    logger.error('API Gateway startup failed', { error });

    // LD1: Exit process with appropriate code
    process.exit(1);
  }
};

/**
 * Sets up handlers for graceful shutdown on process termination signals
 * @param server http.Server instance created from the Express app
 * @returns void No return value
 */
const setupGracefulShutdown = (server: http.Server): void => {
  // LD1: Set up handler for SIGTERM signal
  process.on('SIGTERM', () => {
    // LD1: Log shutdown initiation
    logger.info('SIGTERM signal received: Shutting down API Gateway...');

    // LD1: Close HTTP server connections
    server.close(() => {
      logger.info('API Gateway shutdown complete');

      // LD1: Exit process with appropriate code
      process.exit(0);
    });
  });

  // LD1: Set up handler for SIGINT signal
  process.on('SIGINT', () => {
    // LD1: Log shutdown initiation
    logger.info('SIGINT signal received: Shutting down API Gateway...');

    // LD1: Close HTTP server connections
    server.close(() => {
      logger.info('API Gateway shutdown complete');

      // LD1: Exit process with appropriate code
      process.exit(0);
    });
  });
};

/**
 * Sets up global handlers for uncaught exceptions and unhandled promise rejections
 * @returns void No return value
 */
const handleUncaughtErrors = (): void => {
  // LD1: Set up handler for uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    // LD1: Log error details
    logger.error('Uncaught exception', { error: err });

    // LD1: Exit process with error code
    process.exit(1);
  });

  // LD1: Set up handler for unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    // LD1: Log error details
    logger.error('Unhandled promise rejection', { reason, promise });

    // LD1: Exit process with error code
    process.exit(1);
  });
};

// LD1: Set up global error handlers
handleUncaughtErrors();

// LD1: Start the server
startServer().then(() => {
  // LD1: Set up graceful shutdown handlers after server starts
  if ((global as any).server) {
    setupGracefulShutdown((global as any).server);
  } else {
    logger.error('Server instance not found. Graceful shutdown may not function correctly.');
  }
}).catch(err => {
  logger.error('Failed to start server', { err });
});

// IE3: Export all functions for potential use in other modules
export {
    startServer,
    setupGracefulShutdown,
    handleUncaughtErrors
};