import express from 'express'; // express@^4.18.2
import cors from 'cors'; // cors@^2.8.5
import helmet from 'helmet'; // helmet@^7.0.0

import config from '../../common/config';
const { getKafkaConfig, getDatabaseConfig, getRedisConfig } = config;
import { errorMiddleware, loggingMiddleware, notFoundMiddleware } from '../../common/middleware';
import logger from '../../common/utils/logger';
import { handleError } from '../../common/utils/error-handler';
import KafkaService from '../../event-bus/src/services/kafka.service';
import configureAchievementRoutes from './routes/achievement.routes';
import { bonusZoneRouter } from './routes/bonus-zone.routes';
import configureLeaderboardRoutes from './routes/leaderboard.routes';
import { createRewardRouter } from './routes/reward.routes';
import AchievementService from './services/achievement.service';
import ScoreService from './services/score.service';
import LeaderboardService from './services/leaderboard.service';
import AchievementEventsProducer from './producers/achievement-events.producer';
import DriverActivityConsumer from './consumers/driver-activity.consumer';
import LoadCompletionConsumer from './consumers/load-completion.consumer';

// Define global constants for port and service name
export const PORT = process.env.PORT || 3004;
export const SERVICE_NAME = 'gamification-service';

/**
 * Initializes the Express application with middleware and routes
 * @returns Configured Express application
 */
const initializeApp = (): express.Application => {
  // Create a new Express application instance
  const app = express();

  // Configure middleware (CORS, Helmet, JSON parsing, logging)
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(loggingMiddleware(SERVICE_NAME));

  // Initialize services (AchievementService, ScoreService, LeaderboardService)
  // These services handle the core business logic of the gamification system
  const achievementService = new AchievementService();
  const scoreService = new ScoreService();
  const leaderboardService = new LeaderboardService();

  // Initialize event producer (AchievementEventsProducer)
  // This producer is responsible for publishing achievement-related events to Kafka
  const eventProducer = new AchievementEventsProducer();

  // Configure and mount API routes for achievements, scores, leaderboards, rewards, and bonus zones
  // These routes define the API endpoints for interacting with the gamification system
  app.use('/achievements', configureAchievementRoutes(achievementService, eventProducer));
  app.use('/scores', createScoreRoutes(scoreService, eventProducer));
  app.use('/leaderboards', configureLeaderboardRoutes(leaderboardService, eventProducer));
  app.use('/rewards', createRewardRouter(eventProducer));
  app.use('/bonus-zones', bonusZoneRouter);

  // Add error handling and 404 middleware
  // These middleware components handle errors and non-existent routes
  app.use(errorMiddleware);
  app.use(notFoundMiddleware);

  // Return the configured Express application
  return app;
};

/**
 * Initializes Kafka consumers for processing events
 * @param achievementService 
 * @param scoreService 
 * @param eventProducer 
 * @returns Promise<{ driverActivityConsumer: DriverActivityConsumer; loadCompletionConsumer: LoadCompletionConsumer; }>
 */
const initializeEventConsumers = async (
  achievementService: AchievementService,
  scoreService: ScoreService,
  eventProducer: AchievementEventsProducer
): Promise<{ driverActivityConsumer: DriverActivityConsumer; loadCompletionConsumer: LoadCompletionConsumer; }> => {
  // Create a KafkaService instance
  const kafkaService = new KafkaService();

  // Initialize the DriverActivityConsumer with services
  const driverActivityConsumer = new DriverActivityConsumer(kafkaService, achievementService, scoreService);

  // Initialize the LoadCompletionConsumer with services
  const loadCompletionConsumer = new LoadCompletionConsumer(kafkaService, achievementService, scoreService, eventProducer);

  // Start the consumers to begin processing events
  await driverActivityConsumer.initialize();
  await loadCompletionConsumer.initialize();

  // Return the initialized consumers
  return { driverActivityConsumer, loadCompletionConsumer };
};

/**
 * Starts the Express server and initializes event consumers
 * @returns Promise<void>
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize the Express application
    const app = initializeApp();

    // Initialize services (AchievementService, ScoreService, LeaderboardService)
    const achievementService = new AchievementService();
    const scoreService = new ScoreService();
    const leaderboardService = new LeaderboardService();

    // Initialize the event producer
    const eventProducer = new AchievementEventsProducer();

    // Initialize event consumers
    const { driverActivityConsumer, loadCompletionConsumer } = await initializeEventConsumers(
      achievementService,
      scoreService,
      eventProducer
    );

    // Start the HTTP server on the configured port
    const server = app.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} started on port ${PORT}`);
    });

    // Handle graceful shutdown signals
    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      await gracefulShutdown(server, driverActivityConsumer, loadCompletionConsumer);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      await gracefulShutdown(server, driverActivityConsumer, loadCompletionConsumer);
    });
  } catch (error) {
    // Handle any errors during startup
    handleError(error, 'GamificationService.startServer');
  }
};

/**
 * Gracefully shuts down the server and event consumers
 * @param server 
 * @param driverActivityConsumer 
 * @param loadCompletionConsumer 
 * @returns Promise<void>
 */
const gracefulShutdown = async (
  server: any,
  driverActivityConsumer: DriverActivityConsumer,
  loadCompletionConsumer: LoadCompletionConsumer
): Promise<void> => {
  try {
    // Log shutdown initiation
    logger.info('Initiating graceful shutdown...');

    // Close the HTTP server
    server.close(async () => {
      logger.info('HTTP server closed');

      // Shutdown the driver activity consumer
      await driverActivityConsumer.shutdown();

      // Shutdown the load completion consumer
      await loadCompletionConsumer.shutdown();

      // Close database connections
      // await closeDatabaseConnections();

      // Log successful shutdown
      logger.info('Gamification service shut down successfully');
      process.exit(0);
    });
  } catch (error) {
    // Handle any errors during shutdown
    handleError(error, 'GamificationService.gracefulShutdown');
    process.exit(1);
  }
};

// Start the server
startServer();