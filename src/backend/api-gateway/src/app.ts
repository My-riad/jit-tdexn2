import express from 'express'; // express@4.18.2
import cors from 'cors'; // cors@2.8.5
import helmet from 'helmet'; // helmet@6.0.1
import compression from 'compression'; // compression@1.7.4
import morgan from 'morgan'; // morgan@1.10.0

import logger from '../../common/utils/logger';
import errorHandler from './middleware/error-handler';
import { requestValidator } from './middleware/request-validator';
import { publicApiRateLimiter, authenticatedApiRateLimiter } from './middleware/rate-limiter';
import { authenticate, optionalAuthenticate } from './middleware/authentication';
import routes from './routes';
import { API_GATEWAY_CONFIG, initializeConfig, setupSwagger } from './config';

// Create a new Express application
const app = express();

/**
 * Configures all middleware for the Express application
 * @param app Express application instance
 */
const configureMiddleware = (app: express.Application): void => {
  // Configure JSON body parser with size limits from configuration
  app.use(express.json({ limit: API_GATEWAY_CONFIG.bodyLimit }));

  // Configure URL-encoded body parser for form submissions
  app.use(express.urlencoded({ extended: true }));

  // Apply helmet middleware for security headers
  app.use(helmet());

  // Apply compression middleware for response compression
  app.use(compression());

  // Configure CORS if enabled in configuration
  if (API_GATEWAY_CONFIG.enableCors) {
    app.use(cors({
      origin: API_GATEWAY_CONFIG.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-User-ID'],
      credentials: true
    }));
    logger.info('CORS enabled with origin:', { origin: API_GATEWAY_CONFIG.corsOrigin });
  } else {
    logger.warn('CORS is disabled');
  }

  // Apply morgan request logging middleware in development mode
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Apply rate limiting middleware for API endpoints
  app.use(publicApiRateLimiter());
  app.use(authenticatedApiRateLimiter());

  // Apply request validation middleware using OpenAPI schemas
  app.use(requestValidator());
};

/**
 * Configures all routes for the Express application
 * @param app Express application instance
 */
const configureRoutes = (app: express.Application): void => {
  // Set up health check endpoints for monitoring
  app.get('/health', (req, res) => res.status(200).send('API Gateway is healthy'));

  // Mount all API routes under the configured base path
  app.use(API_GATEWAY_CONFIG.basePath, routes);

  // Set up Swagger documentation if enabled in configuration
  if (API_GATEWAY_CONFIG.enableSwagger) {
    setupSwagger(app);
  }

  // Configure 404 handler for undefined routes
  app.use((req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      code: 'RES_ROUTE_NOT_FOUND',
      message: 'Route not found',
      statusCode: 404
    });
  });

  // Apply global error handling middleware
  app.use(errorHandler);
};

/**
 * Starts the Express server on the configured port
 * @param app Express application instance
 */
const startServer = async (app: express.Application): Promise<void> => {
  try {
    // Initialize configuration components
    await initializeConfig();

    // Start the server on the configured host and port
    app.listen(API_GATEWAY_CONFIG.port, API_GATEWAY_CONFIG.host, () => {
      logger.info(`API Gateway started on port ${API_GATEWAY_CONFIG.port} and host ${API_GATEWAY_CONFIG.host}`);
    });
  } catch (error) {
    // Handle and log any startup errors
    logger.error('API Gateway startup failed', { error });
    process.exit(1);
  }
};

// Configure middleware and routes
configureMiddleware(app);
configureRoutes(app);

// Start the server
startServer(app).catch(err => {
  logger.error('Failed to start server', { err });
});

// Export the configured Express application for use in index.ts
export default app;