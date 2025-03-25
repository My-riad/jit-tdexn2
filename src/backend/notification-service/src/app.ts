import express from 'express'; // web framework for Node.js // express@^4.18.2
import cors from 'cors'; // middleware to enable CORS // cors@^2.8.5
import helmet from 'helmet'; // middleware to enhance security // helmet@^7.0.0
import compression from 'compression'; // middleware to compress responses // compression@^1.7.4
import bodyParser from 'body-parser'; // middleware to parse request bodies // body-parser@^1.20.2
import http from 'http'; // core Node.js module for creating HTTP servers // http@^0.0.1-security

import { initializeConfig } from '../../common/config';
import { initializeNotificationConfig, serviceConfig, websocketConfig } from './config';
import logger from '../../common/utils/logger';
import { errorMiddleware, notFoundMiddleware, loggingMiddleware } from '../../common/middleware';
import { configureNotificationRoutes } from './routes/notification.routes';
import configurePreferenceRoutes from './routes/preference.routes';
import createTemplateRouter from './routes/template.routes';
import { NotificationService } from './services/notification.service';
import { NotificationSocket } from './websocket/notification-socket';

/**
 * Initializes the Express application with middleware, routes, and configuration
 * @returns Configured Express application
 */
const initializeApp = async (): Promise<express.Application> => {
  // LD1: Initialize configuration using initializeConfig and initializeNotificationConfig
  await initializeConfig();
  await initializeNotificationConfig();

  // LD1: Create Express application instance
  const app = express();

  // LD1: Configure middleware (cors, helmet, compression, body-parser, logging)
  app.use(cors());
  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.json());
  app.use(loggingMiddleware(serviceConfig.name));

  // LD1: Create NotificationService instance
  const notificationService = new NotificationService(null as any, null as any, null as any);

  // LD1: Configure and register API routes for notifications, preferences, and templates
  app.use('/api/v1/notifications', configureNotificationRoutes({ notificationService }));
  app.use('/api/v1/preferences', configurePreferenceRoutes());
  app.use('/api/v1/templates', createTemplateRouter());

  // LD1: Register error handling middleware
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  // LD1: Log successful application initialization
  logger.info('App initialized successfully');

  // LD1: Return the configured Express application
  return app;
};

/**
 * Starts the HTTP server and initializes WebSocket connections
 * @param app 
 * @returns HTTP server instance
 */
const startServer = async (app: express.Application): Promise<http.Server> => {
  // LD1: Create HTTP server from Express application
  const server = http.createServer(app);

  // LD1: Get port from service configuration
  const port = serviceConfig.port;

  // LD1: Start server listening on configured port
  server.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });

  // LD1: Initialize WebSocket server if enabled in configuration
  if (websocketConfig.enabled) {
    const notificationService = new NotificationService(null as any, null as any, null as any);
    const notificationSocket = new NotificationSocket(notificationService);
    notificationSocket.initialize(server);

    server.on('upgrade', (request, socket, head) => {
      const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : null;
      if (pathname === websocketConfig.path) {
        notificationSocket.wss.handleUpgrade(request, socket, head, ws => {
          notificationSocket.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });
    logger.info('WebSocket server initialized');
  } else {
    logger.info('WebSocket server is disabled in configuration');
  }

  // LD1: Set up error handling for the server
  server.on('error', (error: Error) => {
    logger.error('Server error', { error });
  });

  // LD1: Return the HTTP server instance
  return server;
};

// Initialize and start the application
initializeApp()
  .then(app => startServer(app))
  .catch(error => {
    logger.error('Failed to start the application', { error });
    process.exit(1);
  });

export { initializeApp, startServer };