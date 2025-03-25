import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^6.1.5
import compression from 'compression'; // compression@^1.7.4
import rateLimit from 'express-rate-limit'; // express-rate-limit@^6.7.0

import { initializeDataServiceConfig } from './config';
import analyticsRoutes from './routes/analytics.routes';
import exportRoutes from './routes/export.routes';
import reportingRoutes from './routes/reporting.routes';
import { errorMiddleware, notFoundMiddleware } from '../../common/middleware/error.middleware';
import { loggingMiddleware } from '../../common/middleware/logging.middleware';
import logger from '../../common/utils/logger';

// Define global constants from environment variables
const PORT = process.env.PORT || 3003;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = 'data-service';

/**
 * Creates and configures the Express application with middleware and routes
 * @returns Configured Express application
 */
const createApp = (): express.Application => {
  // LD1: Create a new Express application instance
  const app = express();

  // LD1: Apply security middleware (helmet) to set security headers
  app.use(helmet());

  // LD1: Configure CORS with appropriate options
  const corsOptions = {
    origin: '*', // Allow all origins (configure for production)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));

  // LD1: Apply compression middleware to reduce response size
  app.use(compression());

  // LD1: Configure JSON body parsing with size limits
  app.use(express.json({ limit: '1mb' }));

  // LD1: Apply URL-encoded body parsing for form submissions
  app.use(express.urlencoded({ extended: true }));

  // LD1: Apply rate limiting middleware to prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  app.use(limiter);

  // LD1: Apply logging middleware with service name
  app.use(loggingMiddleware(SERVICE_NAME));

  // LD1: Register API routes for analytics, export, and reporting
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/exports', exportRoutes);
  app.use('/api/v1/reporting', reportingRoutes);

  // LD1: Apply not found middleware for unmatched routes
  app.use(notFoundMiddleware);

  // LD1: Apply error handling middleware for centralized error processing
  app.use(errorMiddleware);

  // LD1: Return the configured Express application
  return app;
};

/**
 * Initializes the data service configuration and starts the HTTP server
 * @returns Promise that resolves when server is started
 */
const startServer = async (): Promise<void> => {
  try {
    // LD1: Initialize data service configuration
    await initializeDataServiceConfig();

    // LD1: Create and configure the Express application
    const app = createApp();

    // LD1: Start the HTTP server on the configured port
    app.listen(PORT, () => {
      // LD1: Log successful server startup
      logger.info(`${SERVICE_NAME} listening on port ${PORT} in ${NODE_ENV} mode`);
    });
  } catch (error) {
    // LD1: Handle and log any startup errors
    logger.error(`${SERVICE_NAME} failed to start`, { error });
  }
};

// Export the configured Express application for testing and programmatic use
export const app = createApp();

// Start the server
if (process.env.NODE_ENV !== 'test') {
  startServer();
}