import { Router } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2

import { EldController } from '../controllers/eld.controller';
import { EldService } from '../services/eld.service';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { EldAuthorizationRequest, EldTokenExchangeRequest, EldConnectionCreationParams, EldConnectionUpdateParams } from '../models/eld-connection.model';
import logger from '../../../common/utils/logger';

/**
 * Initializes the ELD routes with the controller instance
 * @param eldController 
 * @returns Configured Express router with ELD routes
 */
const initializeRoutes = (eldController: EldController): Router => {
  // Create a new Express router instance
  const router = Router();

  // Define validation schemas for request body, params, and query
  const eldAuthorizationRequestSchema = Joi.object<EldAuthorizationRequest>({
    driver_id: Joi.string().required(),
    provider_type: Joi.string().required(),
    redirect_uri: Joi.string().uri().required(),
    state: Joi.string().required(),
  });

  const eldTokenExchangeRequestSchema = Joi.object<EldTokenExchangeRequest>({
    driver_id: Joi.string().required(),
    provider_type: Joi.string().required(),
    code: Joi.string().required(),
    redirect_uri: Joi.string().uri().required(),
  });

  const eldConnectionCreationParamsSchema = Joi.object<EldConnectionCreationParams>({
    driver_id: Joi.string().required(),
    provider_type: Joi.string().required(),
    provider_account_id: Joi.string().required(),
    access_token: Joi.string().required(),
    refresh_token: Joi.string().required(),
    token_expires_at: Joi.date().required(),
  });

  const eldConnectionUpdateParamsSchema = Joi.object<EldConnectionUpdateParams>({
    access_token: Joi.string(),
    refresh_token: Joi.string(),
    token_expires_at: Joi.date(),
    status: Joi.string(),
    last_sync_at: Joi.date(),
    error_message: Joi.string().allow(null),
  }).min(1);

  const connectionIdParamsSchema = Joi.object({
    connection_id: Joi.string().required(),
  });

  const driverIdParamsSchema = Joi.object({
    driver_id: Joi.string().required(),
  });

  const hosLogsQuerySchema = Joi.object({
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().required(),
  });

  // Register OAuth flow routes (getAuthorizationUrl, exchangeToken)
  router.post('/auth/url', validateBody(eldAuthorizationRequestSchema), eldController.getAuthorizationUrl);
  router.post('/auth/token', validateBody(eldTokenExchangeRequestSchema), eldController.exchangeToken);

  // Register connection management routes (create, get, getByDriverId, update, delete)
  router.post('/connections', authenticate, validateBody(eldConnectionCreationParamsSchema), eldController.createConnection);
  router.get('/connections/:connection_id', authenticate, validateParams(connectionIdParamsSchema), eldController.getConnection);
  router.get('/connections/driver/:driver_id', authenticate, validateParams(driverIdParamsSchema), eldController.getConnectionByDriverId);
  router.put('/connections/:connection_id', authenticate, validateParams(connectionIdParamsSchema), validateBody(eldConnectionUpdateParamsSchema), eldController.updateConnection);
  router.delete('/connections/:connection_id', authenticate, validateParams(connectionIdParamsSchema), eldController.deleteConnection);

  // Register HOS data retrieval routes (getDriverHOS, getDriverHOSLogs)
  router.get('/hos/:driver_id', authenticate, validateParams(driverIdParamsSchema), eldController.getDriverHOS);
  router.get('/hos/:driver_id/logs', authenticate, validateParams(driverIdParamsSchema), validateQuery(hosLogsQuerySchema), eldController.getDriverHOSLogs);

  // Register driver location route (getDriverLocation)
  router.get('/location/:driver_id', authenticate, validateParams(driverIdParamsSchema), eldController.getDriverLocation);

  // Register connection validation route (validateConnection)
  router.post('/connections/:connection_id/validate', authenticate, validateParams(connectionIdParamsSchema), eldController.validateConnection);

  // Log successful route initialization
  logger.info('ELD routes initialized');

  // Return the configured router
  return router;
};

// Export the initializeRoutes function as the default export
export default initializeRoutes;