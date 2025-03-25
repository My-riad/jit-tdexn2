import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0
import compression from 'compression'; // compression@^1.7.4
import { initializeApp as initializeOpenApi } from '../../../common/config/openapi';
import {
  getDriverServiceConfig,
  initializeDriverServiceConfig
} from './config';
import {
  loggingMiddleware,
  errorMiddleware,
  notFoundMiddleware
} from '../../common/middleware';
import logger from '../../common/utils/logger';
import driverRoutes from './routes/driver.routes';
import availabilityRoutes from './routes/availability.routes';
import hosRoutes from './routes/hos.routes';
import preferenceRoutes from './routes/preference.routes';
import { DriverService } from './services/driver.service';
import { HOSService } from './services/hos.service';
import { DriverEventsProducer } from './producers/driver-events.producer';
import { EldUpdatesConsumer } from './consumers/eld-updates.consumer';
import { LocationUpdatesConsumer } from './consumers/location-updates.consumer';
import KafkaService from '../../../event-bus/src/services/kafka.service';

// Declare module for process augmentation
declare global {
  namespace NodeJS {
    interface Process {
      serviceName: string;
    }
  }
}

// Initialize configuration
initializeDriverServiceConfig();

// Get service configuration
const config = getDriverServiceConfig();

// Set service name in process
process.serviceName = config.serviceName;

// Create a new Express application instance
const app = express();

// Middleware configuration
app.use(helmet()); // Secures HTTP headers
app.use(cors({ origin: config.corsOrigins })); // Enables Cross-Origin Resource Sharing
app.use(compression()); // Compresses HTTP responses
app.use(express.json()); // Parses JSON request bodies

// Logging middleware
app.use(loggingMiddleware(config.serviceName));

/**
 * Initializes and configures the Express application with middleware and routes
 * @returns Configured Express application
 */
const initializeApp = (): express.Application => {
  // Log the start of the initialization process
  logger.info('Initializing Express application...');

  // Log the configured middleware
  logger.debug('Configuring middleware...');

  // Register API routes
  logger.debug('Registering API routes...');
  const kafkaService = new KafkaService(null as any); // TODO: Fix this
  const eventsProducer = new DriverEventsProducer(kafkaService);
  const hosService = new HOSService(eventsProducer);
  const driverService = new DriverService(eventsProducer);

  app.use('/drivers', driverRoutes(driverService));
  app.use('/drivers', availabilityRoutes(hosService, eventsProducer));
  app.use('/drivers', hosRoutes());
  app.use('/drivers', preferenceRoutes());

  // Add 404 handler for non-existent routes
  app.use(notFoundMiddleware);

  // Add global error handling middleware
  app.use(errorMiddleware);

  // Log successful initialization
  logger.info('Express application initialized successfully.');

  // Return the configured Express application
  return app;
};

// Initialize Open API documentation
initializeApp();

// Initialize Open API documentation
initializeOpenApi(app, config.port);

// Export the app instance
export const appInstance = app;

// Initialize services
const driverService = new DriverService(new DriverEventsProducer(new KafkaService(null as any))); // TODO: Fix this
const hosService = new HOSService(new DriverEventsProducer(new KafkaService(null as any))); // TODO: Fix this

// Initialize event consumers
export const eldUpdatesConsumer = new EldUpdatesConsumer(hosService, new DriverEventsProducer(new KafkaService(null as any))); // TODO: Fix this
export const locationUpdatesConsumer = new LocationUpdatesConsumer();

// Server and Kafka management variables
let server: any;

/**
 * Starts the HTTP server and initializes Kafka consumers
 */
const startServer = async (): Promise<void> => {
  try {
    // Get driver service configuration
    const config = getDriverServiceConfig();

    // Initialize the Express application
    const app = initializeApp();

    // Start the HTTP server on the configured port
    server = app.listen(config.port, config.host, () => {
      logger.info(`${config.serviceName} started and listening on ${config.host}:${config.port}`);
    });

    // Connect and start Kafka consumers
    await eldUpdatesConsumer.connect();
    await eldUpdatesConsumer.start();
    await locationUpdatesConsumer.connect();
    await locationUpdatesConsumer.start();

    logger.info('Kafka consumers started successfully.');
  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
};

/**
 * Gracefully shuts down the server and Kafka consumers
 */
const shutdownServer = async (): Promise<void> => {
  logger.info('Shutting down server...');
  try {
    // Stop and disconnect Kafka consumers
    await eldUpdatesConsumer.stop();
    await locationUpdatesConsumer.stop();

    // Close the HTTP server
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Shutdown failed', { error });
    process.exit(1);
  }
};

// Handle process termination signals
process.on('SIGTERM', shutdownServer);
process.on('SIGINT', shutdownServer);

// Start the server
startServer();