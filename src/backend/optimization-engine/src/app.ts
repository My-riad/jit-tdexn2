import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0
import compression from 'compression'; // compression@^1.7.4

import createOptimizationRouter from './routes/optimization.routes';
import createRelayRouter from './routes/relay.routes';
import initializeSmartHubRoutes from './routes/smart-hub.routes';
import { OptimizationService } from './services/optimization.service';
import { SmartHubService } from './services/smart-hub.service';
import { RelayService } from './services/relay.service';
import { OPTIMIZATION_ENGINE_PORT, getOptimizationConfig } from './config';
import { errorMiddleware, notFoundMiddleware } from '../../common/middleware/error.middleware';
import { loggingMiddleware } from '../../common/middleware/logging.middleware';
import logger from '../../common/utils/logger';

// LD1: Create a new Express application instance
const app = express();

/**
 * Initializes all required services for the optimization engine
 * @returns Object containing initialized service instances
 */
const initializeServices = () => {
  // LD1: Initialize OptimizationService with configuration
  const optimizationService = new OptimizationService(getOptimizationConfig());

  // LD1: Initialize SmartHubService with configuration
  const smartHubService = new SmartHubService();

  // LD1: Initialize RelayService with configuration
  const relayService = new RelayService(logger, smartHubService);

  // LD1: Return object containing all initialized services
  return {
    optimizationService,
    smartHubService,
    relayService
  };
};

/**
 * Configures middleware for the Express application
 * @param app Express.Application
 */
const setupMiddleware = (app: express.Application) => {
  // LD1: Apply helmet middleware for security headers
  app.use(helmet());

  // LD1: Apply CORS middleware with appropriate configuration
  app.use(cors());

  // LD1: Apply compression middleware for response compression
  app.use(compression());

  // LD1: Apply JSON body parser middleware
  app.use(express.json());

  // LD1: Apply URL-encoded body parser middleware
  app.use(express.urlencoded({ extended: true }));

  // LD1: Apply logging middleware with service name
  app.use(loggingMiddleware('optimization-engine'));

  // LD1: Log middleware setup completion
  logger.info('Middleware setup completed');
};

/**
 * Configures API routes for the Express application
 * @param app Express.Application
 * @param services Object
 */
const setupRoutes = (app: express.Application, services: any) => {
  // LD1: Create optimization router with optimization service
  const optimizationRouter = createOptimizationRouter(services.optimizationService);

  // LD1: Create relay router with relay service
  const relayRouter = createRelayRouter(services.relayService);

  // LD1: Create smart hub router with smart hub service
  const smartHubRouter = initializeSmartHubRoutes();

  // LD1: Mount optimization router at /api/v1/optimization
  app.use('/api/v1/optimization', optimizationRouter);

  // LD1: Mount relay router at /api/v1/relay
  app.use('/api/v1/relay', relayRouter);

  // LD1: Mount smart hub router at /api/v1/smart-hubs
  app.use('/api/v1/smart-hubs', smartHubRouter);

  // LD1: Add health check endpoint at /health
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // LD1: Apply not found middleware for unmatched routes
  app.use(notFoundMiddleware);

  // LD1: Apply error middleware for error handling
  app.use(errorMiddleware);

  // LD1: Log routes setup completion
  logger.info('Routes setup completed');
};

/**
 * Configures error handling for the Express application
 * @param app Express.Application
 */
const setupErrorHandling = (app: express.Application) => {
  // LD1: Apply not found middleware for unmatched routes
  app.use(notFoundMiddleware);

  // LD1: Apply error middleware for error handling
  app.use(errorMiddleware);

  // Set up uncaught exception handler
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', { error });
    process.exit(1); // Exit application
  });

  // Set up unhandled rejection handler
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled rejection', { reason, promise });
  });

  // LD1: Log error handling setup completion
  logger.info('Error handling setup completed');
};

/**
 * Starts the Express server on the configured port
 * @param app Express.Application
 * @returns HTTP server instance
 */
const startServer = (app: express.Application) => {
  // LD1: Start server listening on OPTIMIZATION_ENGINE_PORT
  const server = app.listen(OPTIMIZATION_ENGINE_PORT, () => {
    // LD1: Log server start with port number
    logger.info(`Optimization Engine listening on port ${OPTIMIZATION_ENGINE_PORT}`);
  });

  // LD1: Return the server instance
  return server;
};

/**
 * Handles graceful shutdown of the server and services
 * @param server HTTP server instance
 * @param services Object
 */
const gracefulShutdown = async (server: any, services: any) => {
  // LD1: Log shutdown initiation
  logger.info('Initiating graceful shutdown');

  // LD1: Close HTTP server to stop accepting new connections
  server.close(async (err: Error) => {
    if (err) {
      logger.error('Error closing server', { error: err.message });
      process.exitCode = 1;
    }
    // LD1: Shutdown optimization service gracefully
    await services.optimizationService.shutdown();

    // LD1: Shutdown other services as needed
    // LD1: Log successful shutdown completion
    logger.info('Shutdown complete');
    process.exit();
  });
};

// LD1: Initialize services
const services = initializeServices();

// LD1: Set up middleware
setupMiddleware(app);

// LD1: Set up routes
setupRoutes(app, services);

// LD1: Set up error handling
setupErrorHandling(app);

// LD1: Start the server
const server = startServer(app);

// LD1: Handle graceful shutdown
process.on('SIGINT', () => gracefulShutdown(server, services));
process.on('SIGTERM', () => gracefulShutdown(server, services));

// IE3: Be generous about your exports so long as it doesn't create a security risk.
export { app };