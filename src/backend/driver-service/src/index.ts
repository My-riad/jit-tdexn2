import { startServer, shutdownServer } from './app';
import { initializeDriverServiceConfig } from './config';
import logger from '../../common/utils/logger';

/**
 * Main function that initializes the application and starts the server
 */
async function main(): Promise<void> {
  try {
    // LD1: Initialize driver service configuration
    initializeDriverServiceConfig();

    // LD2: Start the server
    await startServer();

    // LD3: Log successful startup
    logger.info('Driver service started successfully.');
  } catch (error: any) {
    // LD4: Handle and log any startup errors
    logger.error('Driver service failed to start.', { error: error.message });
    process.exit(1);
  }
}

/**
 * Sets up event listeners for graceful shutdown of the application
 */
function setupGracefulShutdown(): void {
  // LD1: Set up event listener for SIGTERM signal
  process.on('SIGTERM', () => {
    // LD2: Log shutdown event
    logger.info('Received SIGTERM signal. Shutting down...');

    // LD3: Call shutdownServer function when shutdown is triggered
    shutdownServer()
      .then(() => {
        // LD4: Exit process with appropriate code after shutdown
        logger.info('Driver service shutdown completed.');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error during shutdown:', { error: err.message });
        process.exit(1);
      });
  });

  // LD5: Set up event listener for SIGINT signal
  process.on('SIGINT', () => {
    // LD6: Log shutdown event
    logger.info('Received SIGINT signal. Shutting down...');

    // LD7: Call shutdownServer function when shutdown is triggered
    shutdownServer()
      .then(() => {
        // LD8: Exit process with appropriate code after shutdown
        logger.info('Driver service shutdown completed.');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error during shutdown:', { error: err.message });
        process.exit(1);
      });
  });

  // LD9: Set up event listener for uncaught exceptions
  process.on('uncaughtException', (err) => {
    // LD10: Log the uncaught exception
    logger.error('Uncaught exception:', { error: err.message, stack: err.stack });

    // LD11: Attempt a graceful shutdown
    shutdownServer()
      .then(() => {
        logger.info('Driver service shutdown completed after uncaught exception.');
        process.exit(1); // Exit with a non-zero code to indicate an error
      })
      .catch((shutdownErr) => {
        logger.error('Error during shutdown after uncaught exception:', { error: shutdownErr.message });
        process.exit(1); // Exit with a non-zero code to indicate an error
      });
  });

  // LD12: Set up event listener for unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    // LD13: Log the unhandled promise rejection
    logger.error('Unhandled promise rejection:', { reason: reason, promise: promise });

    // LD14: Attempt a graceful shutdown
    shutdownServer()
      .then(() => {
        logger.info('Driver service shutdown completed after unhandled rejection.');
        process.exit(1); // Exit with a non-zero code to indicate an error
      })
      .catch((shutdownErr) => {
        logger.error('Error during shutdown after unhandled rejection:', { error: shutdownErr.message });
        process.exit(1); // Exit with a non-zero code to indicate an error
      });
  });
}

// Call setupGracefulShutdown to configure shutdown handling
setupGracefulShutdown();

// Call main to start the application
main();