import { Router } from 'express'; // express ^4.17.1
import { Redis } from 'ioredis'; // ^5.0.0

import { HistoryController, historyQuerySchema, trajectoryQuerySchema, heatmapQuerySchema, commonRoutesQuerySchema, remainingDistanceQuerySchema } from '../controllers/history.controller';
import { PositionService } from '../services/position.service';
import { ETAService } from '../services/eta.service';
import { authenticate } from '../../common/middleware/auth.middleware';
import { validateQuery } from '../../common/middleware/validation.middleware';
import { EntityType } from '../../common/interfaces/position.interface';
import { config } from '../config';
import logger from '../../common/utils/logger';

/**
 * Creates and configures the Express router for historical position data endpoints
 * @returns Configured Express router with history routes
 */
export const createHistoryRouter = (): Router => {
  // Create a new Express router instance
  const router = Router();

  // Initialize Redis client for position service
  const redisClient = new Redis({
    host: config.getDatabaseConfig().connection.host,
    port: config.getDatabaseConfig().connection.port,
    password: config.getDatabaseConfig().connection.password,
    db: 0,
  });

  // Create PositionService instance with Redis client
  const positionService = new PositionService(redisClient, null, null);

  // Create ETAService instance
  const etaService = new ETAService();

  // Create HistoryController instance with PositionService and ETAService
  const historyController = new HistoryController(positionService, etaService);

  // Configure routes with appropriate middleware and controller methods
  router.get(
    '/history',
    authenticate,
    validateQuery(historyQuerySchema),
    historyController.getPositionHistory.bind(historyController)
  );

  router.get(
    '/trajectory',
    authenticate,
    validateQuery(trajectoryQuerySchema),
    historyController.getTrajectory.bind(historyController)
  );

  router.get(
    '/distance',
    authenticate,
    validateQuery(historyQuerySchema),
    historyController.calculateDistance.bind(historyController)
  );

  router.get(
    '/average-speed',
    authenticate,
    validateQuery(historyQuerySchema),
    historyController.calculateAverageSpeed.bind(historyController)
  );

  router.get(
    '/heatmap',
    authenticate,
    validateQuery(heatmapQuerySchema),
    historyController.getHeatmapData.bind(historyController)
  );

  router.get(
    '/common-routes',
    authenticate,
    validateQuery(commonRoutesQuerySchema),
    historyController.findCommonRoutes.bind(historyController)
  );

  router.get(
    '/remaining-distance',
    authenticate,
    validateQuery(remainingDistanceQuerySchema),
    historyController.getRemainingDistance.bind(historyController)
  );

  // Return the configured router
  return router;
};

// Export the router with configured historical position data routes
export const router = createHistoryRouter();