import { Router } from 'express';
import joi from 'joi';
import { PreferenceController } from '../controllers/preference.controller';
import { PreferenceService } from '../services/preference.service';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';

/**
 * Configures and returns an Express router with all notification preference routes
 * for the freight optimization platform.
 * 
 * This router handles all endpoints related to user notification preferences,
 * including creation, retrieval, updating, and management of notification preferences
 * for different notification types and channels.
 * 
 * @returns Configured Express router with preference routes
 */
function configurePreferenceRoutes(): Router {
  const router = Router();
  
  // Create service and controller instances
  const preferenceService = new PreferenceService();
  const preferenceController = new PreferenceController(preferenceService);

  // Apply authentication middleware to all routes
  // This ensures that only authenticated users can access preference endpoints
  router.use(authenticate);

  // Define validation schemas for routes
  // These will be used when the platform needs more granular validation
  // than what's currently implemented in the controller
  const userQuerySchema = joi.object({
    userId: joi.string().required().description('User ID to get preferences for'),
    userType: joi.string().required().description('Type of user (driver, carrier, shipper)')
  });

  const idParamSchema = joi.object({
    id: joi.string().required().description('Notification preference ID')
  });

  // Register all routes using the controller's method
  // The controller's registerRoutes method will set up the following endpoints:
  // - GET /preferences - Get all preferences for a user
  // - GET /preferences/:id - Get a specific preference by ID
  // - POST /preferences - Create a new preference
  // - PUT /preferences/:id - Update an existing preference
  // - DELETE /preferences/:id - Delete a preference
  // - POST /preferences/default - Create default preferences for a user
  // - PUT /preferences/:id/enable - Enable a specific notification type
  // - PUT /preferences/:id/disable - Disable a specific notification type
  // - PUT /preferences/:id/channels - Update channels for a notification type
  // - PUT /preferences/:id/frequency - Update frequency for a notification type
  // - PUT /preferences/:id/time-window - Update time window for a notification type
  preferenceController.registerRoutes(router);

  return router;
}

export default configurePreferenceRoutes;