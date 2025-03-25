import express from 'express'; // version ^4.18.2
import cors from 'cors'; // version ^2.8.5
import helmet from 'helmet'; // version ^6.0.1
import compression from 'compression'; // version ^1.7.4
import { rateLimiter } from '../../common/middleware/rate-limiter.middleware'; // version ^6.7.0
import { CACHE_SERVICE_HOST, CACHE_SERVICE_PORT, getCacheServiceConfig } from './config';
import { router } from './routes/cache.routes';
import { errorMiddleware, notFoundMiddleware } from '../../common/middleware/error.middleware';
import { loggingMiddleware } from '../../common/middleware/logging.middleware';
import logger from '../../common/utils/logger';

// Define global variables
const app = express();
let server: any = null;

/**
 * Initializes the Express application with middleware and routes
 * @returns Configured Express application
 */
const initializeApp = (): express.Application => {
  // 1. Create a new Express application
  logger.info('Initializing Express application');

  // 2. Apply helmet middleware for security headers
  logger.debug('Applying helmet middleware');
  app.use(helmet());

  // 3. Apply CORS middleware with appropriate configuration
  logger.debug('Applying CORS middleware');
  app.use(cors({
    origin: '*', // Allow all origins - adjust for production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
  }));

  // 4. Apply compression middleware for response compression
  logger.debug('Applying compression middleware');
  app.use(compression());

  // 5. Apply JSON body parser middleware
  logger.debug('Applying JSON body parser middleware');
  app.use(express.json({ limit: '1mb' }));

  // 6. Apply URL-encoded body parser middleware
  logger.debug('Applying URL-encoded body parser middleware');
  app.use(express.urlencoded({ extended: true }));

  // 7. Apply logging middleware with service name
  logger.debug('Applying logging middleware');
  app.use(loggingMiddleware('CacheService'));

  // 8. Register cache routes under the /api/cache path
  logger.debug('Registering cache routes');
  app.use('/api/cache', router);

  // 9. Apply not found middleware for unmatched routes
  logger.debug('Applying not found middleware');
  app.use(notFoundMiddleware);

  // 10. Apply error middleware for centralized error handling
  logger.debug('Applying error middleware');
  app.use(errorMiddleware);

  // 11. Return the configured Express application
  logger.info('Express application initialized successfully');
  return app;
};

/**
 * Starts the HTTP server on the configured host and port
 * @returns Promise that resolves when server is started
 */
const startServer = async (): Promise<void> => {
  // 1. Get cache service configuration
  const config = getCacheServiceConfig();

  // 2. Extract host and port from configuration
  const host = config.host;
  const port = config.port;

  // 3. Create HTTP server with the Express application
  logger.debug('Creating HTTP server');
  const app = initializeApp();
  server = app.listen(port, host, () => {

    // 4. Start listening on the specified host and port
    logger.info(`Cache service listening on ${host}:${port}`);

    // 5. Log successful server start with host and port information
    logger.info('Cache service started successfully', { host, port });
  });

  // 6. Set up error event handler for the server
  server.on('error', (error: Error) => {
    logger.error('Cache service server error', { error });
  });

  // 7. Return a promise that resolves when server is started
  return Promise.resolve();
};

/**
 * Gracefully stops the HTTP server
 * @returns Promise that resolves when server is stopped
 */
const stopServer = async (): Promise<void> => {
  // 1. Check if server is running
  if (server) {
    // 2. If server is running, close it gracefully
    logger.info('Stopping Cache service server');
    await new Promise<void>((resolve, reject) => {
      server.close((err: Error) => {
        if (err) {
          logger.error('Error stopping Cache service server', { error: err });
          reject(err);
          return;
        }
        logger.info('Cache service server stopped successfully');
        resolve();
      });
    });
  } else {
    // 3. If server is not running, log that no server needs to be stopped
    logger.info('No Cache service server to stop');
  }

  // 4. Return a promise that resolves when server is stopped
  return Promise.resolve();
};

/**
 * Handles application shutdown gracefully on process termination signals
 */
const handleShutdown = (): void => {
  // 1. Set up event handler for SIGTERM signal
  process.on('SIGTERM', async () => {
    // 2. Set up event handler for SIGINT signal
    logger.info('Received SIGTERM signal: Shutting down Cache service...');
    // 3. In each handler, log shutdown initiation
    await stopServer();
    // 4. Call stopServer to gracefully stop the HTTP server
    process.exit(0);
    // 5. Exit the process with appropriate code
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal: Shutting down Cache service...');
    await stopServer();
    process.exit(0);
  });
};

// Initialize and start the server
startServer();

// Set up shutdown handlers
handleShutdown();

// Export the configured Express application for testing and importing
export { app, startServer, stopServer };