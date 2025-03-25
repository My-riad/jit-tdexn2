import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0
import compression from 'compression'; // compression@^1.7.4
import http from 'http'; // http@0.0.0
import 'express-async-errors'; // express-async-errors@^3.1.1

import { initializeAuthConfig } from './config';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import roleRouter from './routes/role.routes';
import { errorMiddleware, notFoundMiddleware } from '../../common/middleware/error.middleware';
import { loggingMiddleware } from '../../common/middleware/logging.middleware';
import { rateLimiter } from '../../common/middleware/rate-limiter.middleware';
import logger from '../../common/utils/logger';

// Define global constants
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'auth-service';

/**
 * Configures Express middleware for the authentication service
 * @param app - Express.Application instance
 */
const configureMiddleware = (app: express.Application): void => {
  // LD1: Apply helmet middleware for security headers
  app.use(helmet());

  // LD1: Configure CORS with appropriate options
  const corsOptions = {
    origin: '*', // Allow all origins - configure this in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies to be sent
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID']
  };
  app.use(cors(corsOptions));

  // LD1: Apply compression middleware for response compression
  app.use(compression());

  // LD1: Configure JSON body parsing with size limits
  app.use(express.json({ limit: '2mb' }));

  // LD1: Apply URL-encoded body parsing for form submissions
  app.use(express.urlencoded({ extended: true }));

  // LD1: Apply logging middleware with service name
  app.use(loggingMiddleware(SERVICE_NAME));

  // LD1: Apply rate limiting middleware for sensitive endpoints
  app.use('/api/v1/auth/login', rateLimiter({
    limiterOptions: {
      points: 5, // 5 requests
      duration: 60, // per 60 seconds
      blockDuration: 300 // Block for 5 minutes
    },
    keyGeneratorOptions: {
      ipHeaders: ['x-forwarded-for']
    },
    useRedis: false,
    skipSuccessfulRequests: true
  }));

  // LD1: Configure health check endpoint
  app.get('/health', healthCheck);
};

/**
 * Configures API routes for the authentication service
 * @param app - Express.Application instance
 */
const configureRoutes = (app: express.Application): void => {
  // LD1: Mount authentication routes at /api/v1/auth
  app.use('/api/v1/auth', authRouter);

  // LD1: Mount user management routes at /api/v1/users
  app.use('/api/v1/users', userRouter);

  // LD1: Mount role management routes at /api/v1/roles
  app.use('/api/v1/roles', roleRouter);

  // LD1: Apply not found middleware for undefined routes
  app.use(notFoundMiddleware);

  // LD1: Apply error handling middleware as the final middleware
  app.use(errorMiddleware);
};

/**
 * Initializes and starts the Express server for the authentication service
 * @returns Promise resolving to the HTTP server instance
 */
const startServer = async (): Promise<http.Server> => {
  // LD1: Initialize authentication configuration
  initializeAuthConfig();

  // LD1: Create Express application
  const app = express();

  // LD1: Configure middleware
  configureMiddleware(app);

  // LD1: Configure routes
  configureRoutes(app);

  // LD1: Start HTTP server on the specified port
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} started on port ${PORT}`);
      resolve(server);
    });

    server.on('error', (err) => {
      logger.error(`${SERVICE_NAME} failed to start`, { error: err });
      reject(err);
    });
  });
};

/**
 * Handler for the health check endpoint
 * @param req - Express.Request instance
 * @param res - Express.Response instance
 */
const healthCheck = (req: express.Request, res: express.Response): void => {
  // LD1: Return 200 OK status with service name and status
  res.status(200).json({
    service: SERVICE_NAME,
    status: 'healthy'
  });
};

// Export the startServer function
export { startServer };