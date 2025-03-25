import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0
import compression from 'compression'; // compression@^1.7.4
import * as http from 'http'; // http@^0.0.1-security
import { Redis } from 'ioredis'; // ioredis@^5.3.2

import {
  config,
  TRACKING_SERVICE_PORT,
  WEBSOCKET_ENABLED,
  initializeTrackingConfig
} from './config';
import logger from '../../common/utils/logger';
import { positionRouter } from './routes/position.routes';
import geofenceRouter from './routes/geofence.routes';
import { historyRouter } from './routes/history.routes';
import { etaRouter } from './routes/eta.routes';
import { PositionSocket } from './websocket/position-socket';
import { PositionService } from './services/position.service';
import { errorMiddleware, notFoundMiddleware, loggingMiddleware } from '../../common/middleware';

/**
 * Initializes the Express application with middleware, routes, and configuration
 * @returns Configured Express application
 */
const initializeApp = (): express.Application => {
  // Create a new Express application instance
  const app = express();

  // Configure middleware
  // Enable Cross-Origin Resource Sharing (CORS) for all origins
  app.use(cors());

  // Enable security-related HTTP headers using Helmet
  app.use(helmet());

  // Enable compression to improve performance
  app.use(compression());

  // Parse request body as JSON
  app.use(express.json());

  // Apply logging middleware for request/response tracking
  app.use(loggingMiddleware('TrackingService'));

  // Register API routes
  // Mount the position router at the /api/v1/tracking path
  app.use('/api/v1/tracking', positionRouter);

  // Mount the geofence router at the /api/v1/tracking path
  app.use('/api/v1/tracking', geofenceRouter);

  // Mount the history router at the /api/v1/tracking path
  app.use('/api/v1/tracking', historyRouter);

  // Mount the ETA router at the /api/v1/tracking path
  app.use('/api/v1/tracking/eta', etaRouter);

  // Apply error handling middleware
  app.use(errorMiddleware);

  // Apply 404 not found middleware for unmatched routes
  app.use(notFoundMiddleware);

  // Return the configured Express application
  return app;
};

/**
 * Starts the HTTP server and initializes WebSocket if enabled
 * @returns Promise resolving to the HTTP server instance
 */
const startServer = async (): Promise<http.Server> => {
  // Initialize tracking service configuration
  initializeTrackingConfig();

  // Initialize the Express application
  const app = initializeApp();

  // Create an HTTP server with the Express app
  const server = http.createServer(app);

  // If WebSocket is enabled, initialize the PositionSocket with the HTTP server
  if (WEBSOCKET_ENABLED) {
    // Initialize Redis client for PositionSocket
    const redisClient = new Redis(config.getRedisConfig());

    // Create PositionService instance with Redis client
    const positionService = new PositionService(redisClient, null, null); // TODO: Fix this

    // Create a new PositionSocket instance with the PositionService
    const positionSocket = new PositionSocket(positionService);

    // Initialize the WebSocket server with the HTTP server
    positionSocket.initialize(server);
  }

  // Start the server listening on the configured port
  return new Promise((resolve, reject) => {
    server.listen(TRACKING_SERVICE_PORT, () => {
      // Log successful server startup
      logger.info(`Tracking service started on port ${TRACKING_SERVICE_PORT}`);
      resolve(server);
    }).on('error', (error) => {
      // Handle any startup errors
      logger.error('Failed to start tracking service', { error });
      reject(error);
    });
  });
};

// Export the configured Express application for testing
export const app = initializeApp();

// Export the server startup function for external invocation
export { startServer };