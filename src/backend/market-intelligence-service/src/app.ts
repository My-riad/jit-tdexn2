import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0
import compression from 'compression'; // compression@^1.7.4

import { rateRoutes } from './routes/rate.routes';
import { forecastRoutes } from './routes/forecast.routes';
import { hotspotRoutes } from './routes/hotspot.routes';
import { auctionRoutes } from './routes/auction.routes';
import { SERVICE_NAME } from './config';
import { loggingMiddleware } from '../../common/middleware/logging.middleware';
import { errorMiddleware, notFoundMiddleware } from '../../common/middleware/error.middleware';

/**
 * Initializes and configures the Express application with middleware and routes
 * @returns Configured Express application instance
 */
export const initializeApp = (): express.Application => {
  // Create a new Express application instance
  const app: express.Application = express();

  // Configure middleware: helmet for security headers
  app.use(helmet());

  // Configure middleware: cors for cross-origin requests
  app.use(cors());

  // Configure middleware: compression for response compression
  app.use(compression());

  // Configure middleware: express.json for parsing JSON request bodies
  app.use(express.json());

  // Configure middleware: express.urlencoded for parsing URL-encoded request bodies
  app.use(express.urlencoded({ extended: true }));

  // Configure middleware: loggingMiddleware for request/response logging
  app.use(loggingMiddleware(SERVICE_NAME));

  // Mount API routes: /rates for market rate endpoints
  app.use('/rates', rateRoutes);

  // Mount API routes: /forecasts for demand forecast endpoints
  app.use('/forecasts', forecastRoutes);

  // Mount API routes: /hotspots for hotspot endpoints
  app.use('/hotspots', hotspotRoutes);

  // Mount API routes: /auctions for auction endpoints
  app.use('/auctions', auctionRoutes);

  // Configure middleware: notFoundMiddleware for handling 404 errors
  app.use(notFoundMiddleware);

  // Configure middleware: errorMiddleware for centralized error handling
  app.use(errorMiddleware);

  // Return the configured Express application
  return app;
};

/**
 * Handler for the health check endpoint to verify service status
 * @param req Express Request object
 * @param res Express Response object
 */
const healthCheck = (req: express.Request, res: express.Response): void => {
  // Return a 200 OK response with service name and status information
  res.status(200).json({
    service: SERVICE_NAME,
    status: 'OK',
    uptime: process.uptime(),
    version: '1.0.0'
  });
};

// Initialize the Express application
const app: express.Application = initializeApp();

// Define a route for health checks
app.get('/health', healthCheck);

// Export the configured Express application
export { app, initializeApp };