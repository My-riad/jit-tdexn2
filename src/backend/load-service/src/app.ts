import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0
import compression from 'compression'; // compression@^1.7.4
import http from 'http'; // built-in
import * as config from './config';
import createLoadRouter from './routes/load.routes';
import createStatusRouter from './routes/status.routes';
import createDocumentRouter from './routes/document.routes';
import * as commonMiddleware from '../../common/middleware';
import logger from '../../common/utils/logger';
import LoadService from './services/load.service';
import LoadStatusService from './services/load-status.service';
import DocumentService from './services/document.service';
import LoadEventsProducer from './producers/load-events.producer';

// Define global variables for the Express app and HTTP server
let app: express.Application;
let server: http.Server;

/**
 * Initializes the Express application with middleware, routes, and error handling
 * @returns Promise<express.Application>: Configured Express application
 */
const initializeApp = async (): Promise<express.Application> => {
  // LD1: Initialize service configurations
  await config.initializeConfigurations();

  // LD1: Create Express application instance
  app = express();

  // LD1: Configure middleware (helmet, cors, compression, JSON parsing)
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());

  // LD1: Set up request logging middleware
  app.use(commonMiddleware.requestLoggingMiddleware(config.SERVICE_NAME));

  // LD1: Initialize services (LoadService, LoadStatusService, DocumentService)
  const loadEventsProducer = new LoadEventsProducer();
  const loadService = new LoadService(loadEventsProducer);
  const loadStatusService = new LoadStatusService(loadEventsProducer);
  const documentService = new DocumentService(loadEventsProducer);

  // LD1: Initialize the LoadEventsProducer
  // No specific initialization steps are needed for the producer itself

  // LD1: Create route handlers for loads, status, and documents
  const loadRouter = createLoadRouter();
  const statusRouter = createStatusRouter();
  const documentRouter = createDocumentRouter();

  // LD1: Register routes with the application
  app.use('/api/v1/loads', loadRouter);
  app.use('/api/v1/status', statusRouter);
  app.use('/api/v1/documents', documentRouter);

  // LD1: Add 404 handler for unmatched routes
  app.use(commonMiddleware.notFoundMiddleware);

  // LD1: Add global error handling middleware
  app.use(commonMiddleware.errorMiddleware);

  // LD1: Return the configured Express application
  return app;
};

/**
 * Starts the HTTP server on the configured port
 * @param app Express.Application
 * @returns Promise<http.Server>: Running HTTP server instance
 */
const startServer = async (app: express.Application): Promise<http.Server> => {
  return new Promise((resolve, reject) => {
    // LD1: Create HTTP server with the Express application
    server = http.createServer(app);

    // LD1: Start listening on the configured port
    server.listen(config.PORT, () => {
      // LD1: Log successful server start
      logger.info(`${config.SERVICE_NAME} started listening on port ${config.PORT}`);

      // LD1: Return the server instance
      resolve(server);
    });

    // LD1: Handle and log any server startup errors
    server.on('error', (error) => {
      logger.error(`${config.SERVICE_NAME} failed to start`, { error });
      reject(error);
    });
  });
};

/**
 * Sets up handlers for graceful shutdown on process termination signals
 * @param server http.Server
 */
const setupGracefulShutdown = (server: http.Server): void => {
  // LD1: Register handler for SIGTERM signal
  process.on('SIGTERM', shutdown);

  // LD1: Register handler for SIGINT signal
  process.on('SIGINT', shutdown);

  // LD1: Implement shutdown function that closes server connections
  async function shutdown() {
    logger.info('Starting graceful shutdown');

    try {
      // LD1: Ensure database connections are closed properly
      // await db.closeKnexConnection();

      // LD1: Ensure Kafka connections are closed properly
      // await kafkaService.shutdown();

      // LD1: Close server connections
      server.close(() => {
        logger.info('Server closed');

        // LD1: Exit process with appropriate status code
        process.exit(0);
      });
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }
};

// Export functions to initialize, start, and manage the application
export { initializeApp, startServer, setupGracefulShutdown };