import express, { Router, Request, Response } from 'express'; // express@^4.17.1
import Joi from 'joi'; // joi@^17.6.0
import Redis from 'ioredis'; // ioredis@^5.0.0
import { ETAController } from '../controllers/eta.controller';
import { ETAService } from '../services/eta.service';
import { authenticate } from '../../common/middleware/auth.middleware';
import { validateQuery, validateParams, validateBody } from '../../common/middleware/validation.middleware';
import { EntityType } from '../../common/interfaces/position.interface';
import { config } from '../config';

// Define Joi schema for validating entity ID and type parameters
const entityParamsSchema = Joi.object({
  entityId: Joi.string().required().messages({
    'any.required': 'Entity ID is required',
    'string.empty': 'Entity ID cannot be empty'
  }),
  entityType: Joi.string().valid(...Object.values(EntityType)).required().messages({
    'any.required': 'Entity Type is required',
    'any.only': 'Invalid Entity Type'
  })
});

// Define Joi schema for validating ETA query parameters
const etaQuerySchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'any.required': 'Latitude is required',
    'number.min': 'Latitude must be greater than or equal to -90',
    'number.max': 'Latitude must be less than or equal to 90'
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'any.required': 'Longitude is required',
    'number.min': 'Longitude must be greater than or equal to -180',
    'number.max': 'Longitude must be less than or equal to 180'
  }),
  includeTraffic: Joi.boolean().optional(),
  useHistoricalData: Joi.boolean().optional(),
  adjustForDriverBehavior: Joi.boolean().optional()
});

// Define Joi schema for validating route information in request body
const routeInfoSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'any.required': 'Latitude is required',
    'number.min': 'Latitude must be greater than or equal to -90',
    'number.max': 'Latitude must be less than or equal to 90'
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'any.required': 'Longitude is required',
    'number.min': 'Longitude must be greater than or equal to -180',
    'number.max': 'Longitude must be less than or equal to 180'
  }),
  routePoints: Joi.array().items(Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  })).min(1).required().messages({
    'any.required': 'Route points are required',
    'array.min': 'At least one route point is required'
  })
});

// Define Joi schema for validating multiple entities request body
const multipleEntitiesSchema = Joi.object({
  entityIds: Joi.array().items(Joi.string()).min(1).required().messages({
    'any.required': 'Entity IDs are required',
    'array.min': 'At least one entity ID is required'
  }),
  entityType: Joi.string().valid(...Object.values(EntityType)).required().messages({
    'any.required': 'Entity Type is required',
    'any.only': 'Invalid Entity Type'
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    'any.required': 'Latitude is required',
    'number.min': 'Latitude must be greater than or equal to -90',
    'number.max': 'Latitude must be less than or equal to 90'
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'any.required': 'Longitude is required',
    'number.min': 'Longitude must be greater than or equal to -180',
    'number.max': 'Longitude must be less than or equal to 180'
  })
});

// Define Joi schema for validating multiple destinations request body
const multipleDestinationsSchema = Joi.object({
  destinations: Joi.array().items(Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  })).min(1).required().messages({
    'any.required': 'Destinations are required',
    'array.min': 'At least one destination is required'
  })
});

/**
 * Creates and configures the Express router for ETA endpoints
 * @returns Configured Express router with ETA routes
 */
export function createETARouter(): Router {
  // Create a new Express router instance
  const router = express.Router();

  // Initialize Redis client for ETA service
  const redisClient = new Redis({ // ioredis@^5.0.0
    host: config.getDatabaseConfig().connection.host,
    port: config.getDatabaseConfig().connection.port,
    password: config.getDatabaseConfig().connection.password,
    db: 0
  });

  // Create ETAService instance with dependencies
  const etaService = new ETAService();

  // Create ETAController instance with ETAService
  const etaController = new ETAController(etaService);

  // Configure routes with appropriate middleware and controller methods
  router.get(
    '/:entityType/:entityId',
    authenticate,
    validateParams(entityParamsSchema),
    validateQuery(etaQuerySchema),
    (req: Request, res: Response, next: NextFunction) => {
      etaController.getETA(req, res, next);
    }
  );

  router.post(
    '/:entityType/:entityId',
    authenticate,
    validateParams(entityParamsSchema),
    validateQuery(etaQuerySchema),
    validateBody(routeInfoSchema),
    (req: Request, res: Response, next: NextFunction) => {
      etaController.getETAWithRouteInfo(req, res, next);
    }
  );

  router.post(
    '/multiple',
    authenticate,
    validateBody(multipleEntitiesSchema),
    validateQuery(etaQuerySchema),
    (req: Request, res: Response, next: NextFunction) => {
      etaController.getETAForMultipleEntities(req, res, next);
    }
  );

  router.post(
    '/:entityType/:entityId/destinations',
    authenticate,
    validateParams(entityParamsSchema),
    validateBody(multipleDestinationsSchema),
    validateQuery(etaQuerySchema),
    (req: Request, res: Response, next: NextFunction) => {
      etaController.getETAToMultipleDestinations(req, res, next);
    }
  );

  router.get(
    '/:entityType/:entityId/distance',
    authenticate,
    validateParams(entityParamsSchema),
    validateQuery(etaQuerySchema),
    (req: Request, res: Response, next: NextFunction) => {
      etaController.getRemainingDistance(req, res, next);
    }
  );

  router.delete(
    '/:entityType/:entityId/cache',
    authenticate,
    validateParams(entityParamsSchema),
    (req: Request, res: Response, next: NextFunction) => {
      etaController.invalidateETACache(req, res, next);
    }
  );

  // Return the configured router
  return router;
}

// Create and export the configured router
export const router = createETARouter();