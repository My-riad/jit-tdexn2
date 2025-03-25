import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0
import morgan from 'morgan'; // morgan@^1.10.0
import compression from 'compression'; // compression@^1.7.4

import { config } from './config';
import logger from '../../common/utils/logger';
import { errorMiddleware, notFoundMiddleware } from '../../common/middleware/error.middleware';
import eldRoutes from './routes/eld.routes';
import createTmsRouter from './routes/tms.routes';
import paymentRoutes from './routes/payment.routes';
import mappingRoutes from './routes/mapping.routes';
import weatherRoutes from './routes/weather.routes';
import { handleKeepTruckinWebhook, handleOmnitracsWebhook, handleSamsaraWebhook } from './webhooks/eld-webhook';
import { handlePaymentWebhook, rawBodyParser } from './webhooks/payment-webhook';
import { handleMcLeodWebhook, handleTmwWebhook, handleMercuryGateWebhook } from './webhooks/tms-webhook';

/**
 * Initializes the Express application with middleware, routes, and webhook handlers
 * @returns Configured Express application
 */
const initializeApp = (): express.Application => {
  // LD1: Create a new Express application instance
  const app: express.Application = express();

  // LD1: Initialize integration service configuration
  config.initializeIntegrationConfig();

  // LD1: Configure middleware (helmet, cors, morgan, compression, json parser)
  app.use(helmet()); // Secures HTTP headers
  app.use(cors()); // Enables Cross-Origin Resource Sharing
  app.use(morgan('dev')); // Logs HTTP requests
  app.use(compression()); // Compresses HTTP responses
  app.use(express.json()); // Parses JSON request bodies

  // LD1: Register API routes for different integration types (ELD, TMS, payment, mapping, weather)
  app.use('/api/v1/eld', eldRoutes());
  app.use('/api/v1/tms', createTmsRouter());
  app.use('/api/v1/payment', paymentRoutes());
  app.use('/api/v1/mapping', mappingRoutes());
  app.use('/api/v1/weather', weatherRoutes());

  // LD1: Register webhook handlers for external system callbacks
  // ELD Webhooks
  app.post('/webhooks/eld/keeptruckin', handleKeepTruckinWebhook);
  app.post('/webhooks/eld/omnitracs', handleOmnitracsWebhook);
  app.post('/webhooks/eld/samsara', handleSamsaraWebhook);

  // TMS Webhooks
  app.post('/webhooks/tms/mcleod', handleMcLeodWebhook);
  app.post('/webhooks/tms/tmw', handleTmwWebhook);
  app.post('/webhooks/tms/mercurygate', handleMercuryGateWebhook);

  // Payment Webhooks
  app.post('/webhooks/payment', rawBodyParser, handlePaymentWebhook);

  // LD1: Configure error handling middleware
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  // LD1: Return the configured Express application
  return app;
};

/**
 * Starts the Express server on the configured port
 * @param app Configured Express application
 * @returns HTTP server instance
 */
const startServer = (app: express.Application): any => {
  // LD1: Get the port from environment variables or use default (3003)
  const port = process.env.PORT || 3003;

  // LD1: Start the server listening on the specified port
  const server = app.listen(port, () => {
    logger.info(`Integration Service listening on port ${port}`);
  });

  // LD1: Return the HTTP server instance
  return server;
};

// LD1: Initialize the application
const app = initializeApp();

// LD1: Start the server
const server = startServer(app);

// LD1: Export the configured Express application for testing and importing in other files
export { app, server };