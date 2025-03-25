import { Router } from 'express'; // express@^4.17.1
import Joi from 'joi'; // joi@^17.6.0
import { PositionController } from '../controllers/position.controller';
import { PositionService } from '../services/position.service';
import { authenticate } from '../../common/middleware/auth.middleware';
import { validateQuery, validateParams, validateBody } from '../../common/middleware/validation.middleware';
import { EntityType } from '../../common/interfaces/position.interface';
import { config } from '../config';
import Redis from 'ioredis'; // ioredis@^5.0.0

// Define Joi schema for validating entity ID and type parameters
const entityParamsSchema = Joi.object({
  entity_id: Joi.string().required(),
  entity_type: Joi.string().valid(...Object.values(EntityType)).required()
});

// Define Joi schema for validating position update request body
const positionUpdateSchema = Joi.object({
  entity_id: Joi.string().required(),
  entity_type: Joi.string().valid(...Object.values(EntityType)).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  heading: Joi.number().min(0).max(359).optional(),
  speed: Joi.number().min(0).optional(),
  accuracy: Joi.number().min(0).optional(),
  source: Joi.string().required(),
  timestamp: Joi.date().iso().required()
});

// Define Joi schema for validating bulk position update request body
const bulkPositionUpdateSchema = Joi.array().items(positionUpdateSchema);

// Define Joi schema for validating position history query parameters
const historyQuerySchema = Joi.object({
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional()
});

// Define Joi schema for validating nearby entities query parameters
const nearbyQuerySchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(0).required(),
  entity_type: Joi.string().valid(...Object.values(EntityType)).required(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

// Define Joi schema for validating distance calculation query parameters
const distanceQuerySchema = Joi.object({
    entityId2: Joi.string().optional(),
    entityType2: Joi.string().valid(...Object.values(EntityType)).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional()
}).xor('entityId2', 'latitude');

/**
 * Creates and configures the Express router for position endpoints
 * @returns Configured Express router with position routes
 */
export const createPositionRouter = (): Router => {
  // Create a new Express router instance
  const router = Router();

  // Initialize Redis client for position service
  const redisClient = new Redis(config.getRedisConfig());

  // Create PositionService instance with dependencies
  const positionService = new PositionService(redisClient);

  // Create PositionController instance with PositionService
  const positionController = new PositionController(positionService);

  // Configure routes with appropriate middleware and controller methods
  router.put(
    '/positions/:entity_id/:entity_type',
    authenticate,
    validateParams(entityParamsSchema),
    validateBody(positionUpdateSchema),
    positionController.updatePosition.bind(positionController)
  );

  router.post(
    '/positions/bulk',
    authenticate,
    validateBody(bulkPositionUpdateSchema),
    positionController.bulkUpdatePositions.bind(positionController)
  );

  router.get(
    '/positions/:entity_id/:entity_type',
    authenticate,
    validateParams(entityParamsSchema),
    positionController.getCurrentPosition.bind(positionController)
  );

  router.get(
    '/positions/:entity_id/:entity_type/history',
    authenticate,
    validateParams(entityParamsSchema),
    validateQuery(historyQuerySchema),
    positionController.getPositionHistory.bind(positionController)
  );

  router.get(
      '/positions/:entity_id/:entity_type/trajectory',
      authenticate,
      validateParams(entityParamsSchema),
      validateQuery(historyQuerySchema),
      positionController.getTrajectory.bind(positionController)
  );

  router.get(
    '/nearby',
    authenticate,
    validateQuery(nearbyQuerySchema),
    positionController.findNearbyEntities.bind(positionController)
  );

  router.get(
    '/distance/:entity_id/:entity_type',
    authenticate,
    validateParams(entityParamsSchema),
    validateQuery(distanceQuerySchema),
    positionController.calculateDistanceBetween.bind(positionController)
  );

  router.get(
    '/speed/:entity_id/:entity_type',
    authenticate,
    validateParams(entityParamsSchema),
    validateQuery(historyQuerySchema),
    positionController.calculateAverageSpeed.bind(positionController)
  );

  router.delete(
    '/positions/:entity_id/:entity_type',
    authenticate,
    validateParams(entityParamsSchema),
    positionController.deletePosition.bind(positionController)
  );

  // Return the configured router
  return router;
};

// Export the configured router
export const router = createPositionRouter();