import express, { Router } from 'express'; // express@^4.17.1
import Joi from 'joi'; // joi@^17.6.0
import { TmsController } from '../controllers/tms.controller';
import { TmsService } from '../services/tms.service';
import {
  authenticate,
  validateBody,
  validateParams,
  validateQuery,
  rateLimiter,
  RateLimiterMiddlewareOptions
} from '../../../common/middleware';
import {
  TmsConnectionCreationParams,
  TmsConnectionUpdateParams,
  TmsSyncRequest
} from '../models/tms-connection.model';

/**
 * Creates and configures the Express router for TMS integration endpoints
 * @returns Configured Express router with TMS routes
 */
export const createTmsRouter = (): Router => {
  // LD1: Create a new Express router instance
  const router = express.Router();

  // LD1: Initialize TMS service and controller instances
  const tmsService = new TmsService();
  const tmsController = new TmsController(tmsService);

  // LD1: Define validation schemas for request validation
  const tmsConnectionCreationSchema = Joi.object<TmsConnectionCreationParams>({
    owner_type: Joi.string().required(),
    owner_id: Joi.string().required(),
    provider_type: Joi.string().required(),
    integration_type: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().optional(),
    credentials: Joi.object().required(),
    settings: Joi.object().required(),
    test_connection: Joi.boolean().optional()
  });

  const tmsConnectionUpdateSchema = Joi.object<TmsConnectionUpdateParams>({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    credentials: Joi.object().optional(),
    settings: Joi.object().optional(),
    status: Joi.string().optional(),
    error_message: Joi.string().optional()
  });

  const tmsSyncRequestSchema = Joi.object<TmsSyncRequest>({
    connection_id: Joi.string().required(),
    entity_types: Joi.array().items(Joi.string()).optional(),
    force: Joi.boolean().optional(),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional()
  });

  const tmsConnectionIdSchema = Joi.object({
    connectionId: Joi.string().uuid().required()
  });

  const loadIdSchema = Joi.object({
    loadId: Joi.string().required()
  });

  const loadStatusSchema = Joi.object({
    status: Joi.string().required()
  });

  // LD1: Configure rate limiting options
  const rateLimitOptions: RateLimiterMiddlewareOptions = {
    limiterOptions: {
      points: 100, // 100 requests
      duration: 60, // per 60 seconds
    },
    keyGeneratorOptions: {
      userIdKey: 'user.id',
      pathLimiting: true,
      methodLimiting: true
    }
  };

  // LD1: Configure routes with appropriate middleware and controller methods
  router.post('/', authenticate, rateLimiter(rateLimitOptions), validateBody(tmsConnectionCreationSchema), (req, res, next) => tmsController.createConnection(req, res, next));

  router.get('/:connectionId', authenticate, rateLimiter(rateLimitOptions), validateParams(tmsConnectionIdSchema), (req, res, next) => tmsController.getConnection(req, res, next));

  router.get('/', authenticate, rateLimiter(rateLimitOptions), validateQuery(Joi.object({
    ownerType: Joi.string().required(),
    ownerId: Joi.string().required()
  })), (req, res, next) => tmsController.listConnections(req, res, next));

  router.put('/:connectionId', authenticate, rateLimiter(rateLimitOptions), validateParams(tmsConnectionIdSchema), validateBody(tmsConnectionUpdateSchema), (req, res, next) => tmsController.updateConnection(req, res, next));

  router.delete('/:connectionId', authenticate, rateLimiter(rateLimitOptions), validateParams(tmsConnectionIdSchema), (req, res, next) => tmsController.deleteConnection(req, res, next));

  router.post('/:connectionId/test', authenticate, rateLimiter(rateLimitOptions), validateParams(tmsConnectionIdSchema), (req, res, next) => tmsController.testConnection(req, res, next));

  router.post('/sync', authenticate, rateLimiter(rateLimitOptions), validateBody(tmsSyncRequestSchema), (req, res, next) => tmsController.syncTmsData(req, res, next));

  router.post('/:connectionId/loads', authenticate, rateLimiter(rateLimitOptions), validateParams(tmsConnectionIdSchema), (req, res, next) => tmsController.pushLoadToTms(req, res, next));

  router.patch('/:connectionId/loads/:loadId', authenticate, rateLimiter(rateLimitOptions), validateParams(tmsConnectionIdSchema.concat(loadIdSchema)), validateBody(loadStatusSchema), (req, res, next) => tmsController.updateLoadStatusInTms(req, res, next));

  // LD1: Return the configured router
  return router;
};

export default createTmsRouter;