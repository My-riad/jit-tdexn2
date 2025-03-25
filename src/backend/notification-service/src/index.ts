import http from 'http'; // HTTP server creation for Express and WebSocket // http@^0.0.1-security
import { initializeConfig } from '../../common/config';
import { initializeNotificationConfig, serviceConfig } from './config';
import logger from '../../common/utils/logger';
import { initializeApp, startServer } from './app';
import { initSystemEventConsumer } from './consumers/system-event.consumer';
import KafkaService from '../../event-bus/src/services/kafka.service';
import { NotificationService } from './services/notification.service';
import { TemplateService } from './services/template.service';

/**
 * Main function that initializes the application and starts the server
 * @returns Promise that resolves when the application is started
 */
const main = async (): Promise<void> => {
  try {
    // LD1: Initialize common configuration using initializeConfig
    await initializeConfig();

    // LD1: Initialize notification service configuration using initializeNotificationConfig
    await initializeNotificationConfig();

    // LD1: Initialize Express application using initializeApp
    const app = await initializeApp();

    // LD1: Start HTTP server using startServer
    const server = await startServer(app);

    // LD1: Create instances of required services (KafkaService, NotificationService, TemplateService)
    const kafkaService = new KafkaService(null as any); // TODO: Replace null with actual SchemaRegistryService instance
    const notificationService = new NotificationService(null as any, null as any, null as any); // TODO: Replace nulls with actual TemplateService and PreferenceService instances
    const templateService = new TemplateService();

    // LD1: Initialize system event consumer using initSystemEventConsumer
    await initSystemEventConsumer(kafkaService, notificationService, templateService);

    // LD1: Log successful startup of the notification service
    logger.info(`Notification service started successfully on port ${serviceConfig.port}`);

    // Set up graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    // LD1: Handle and log any errors during startup
    logger.error('Failed to start the notification service', { error });
    process.exit(1);
  }
};

/**
 * Sets up handlers for process termination signals to ensure graceful shutdown
 * @param server 
 */
const setupGracefulShutdown = (server: http.Server): void => {
  // LD1: Register handler for SIGTERM signal
  process.on('SIGTERM', () => shutdown(server));

  // LD1: Register handler for SIGINT signal
  process.on('SIGINT', () => shutdown(server));

  logger.info('Graceful shutdown handlers registered');
};

/**
 * Performs graceful shutdown of the application
 * @param server 
 * @returns Promise that resolves when shutdown is complete
 */
const shutdown = async (server: http.Server): Promise<void> => {
  // LD1: Log shutdown initiation
  logger.info('Initiating graceful shutdown');

  try {
    // LD1: Close HTTP server with a timeout
    server.close((err) => {
      if (err) {
        logger.error('Error closing HTTP server', { error: err });
      } else {
        logger.info('HTTP server closed');
      }
    });

    // LD1: Close Kafka connections
    // TODO: Implement Kafka connection closing logic
    logger.info('Kafka connections closed');

    // LD1: Close database connections
    // TODO: Implement database connection closing logic
    logger.info('Database connections closed');

    // LD1: Close Redis connections
    // TODO: Implement Redis connection closing logic
    logger.info('Redis connections closed');

    // LD1: Log successful shutdown
    logger.info('Graceful shutdown completed');

    // LD1: Exit process with success code after cleanup
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Start the application
main();