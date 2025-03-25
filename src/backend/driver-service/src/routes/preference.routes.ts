import express from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams } from '../../../common/middleware/validation.middleware';
import { PreferenceController } from '../controllers/preference.controller';
import { PreferenceService } from '../services/preference.service';
import { validateDriverPreference, validateDriverId } from '../validators/driver.validator';

// Create a new Express router
const router = express.Router();

/**
 * Configures and returns the router with all preference-related routes
 * @returns Configured Express router with preference routes
 */
function setupPreferenceRoutes(): express.Router {
  // Initialize PreferenceService instance
  const preferenceService = new PreferenceService();

  // Initialize PreferenceController with the service
  const preferenceController = new PreferenceController(preferenceService);

  // Define validation schemas for request parameters and body data
  const driverIdSchema = Joi.object({
    driverId: Joi.string().required().messages({
      'string.empty': 'Driver ID is required',
      'any.required': 'Driver ID is required'
    })
  });

  const preferenceIdSchema = Joi.object({
    driverId: Joi.string().required().messages({
      'string.empty': 'Driver ID is required',
      'any.required': 'Driver ID is required'
    }),
    preferenceId: Joi.string().required().messages({
      'string.empty': 'Preference ID is required',
      'any.required': 'Preference ID is required'
    })
  });

  const preferenceTypeSchema = Joi.object({
    driverId: Joi.string().required().messages({
      'string.empty': 'Driver ID is required',
      'any.required': 'Driver ID is required'
    }),
    preferenceType: Joi.string().required().messages({
      'string.empty': 'Preference Type is required',
      'any.required': 'Preference Type is required'
    })
  });

  const preferenceDataSchema = Joi.object({
    preference_type: Joi.string().required().messages({
      'string.empty': 'Preference Type is required',
      'any.required': 'Preference Type is required'
    }),
    preference_value: Joi.string().required().messages({
      'string.empty': 'Preference Value is required',
      'any.required': 'Preference Value is required'
    }),
    priority: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Priority must be a number',
      'number.integer': 'Priority must be an integer',
      'number.min': 'Priority must be at least 1',
      'number.max': 'Priority must be at most 10'
    })
  });

  // Set up GET route for retrieving all preferences for a driver
  router.get('/:driverId', 
    authenticate, 
    validateParams(driverIdSchema), 
    preferenceController.getDriverPreferences
  );

  // Set up GET route for retrieving preferences by type for a driver
  router.get('/:driverId/:preferenceType', 
    authenticate, 
    validateParams(preferenceTypeSchema), 
    preferenceController.getDriverPreferencesByType
  );

  // Set up GET route for retrieving a specific preference by ID
  router.get('/:driverId/preference/:preferenceId', 
    authenticate, 
    validateParams(preferenceIdSchema), 
    preferenceController.getPreferenceById
  );

  // Set up POST route for creating a new preference for a driver
  router.post('/:driverId', 
    authenticate, 
    validateParams(driverIdSchema), 
    validateBody(preferenceDataSchema), 
    preferenceController.createDriverPreference
  );

  // Set up POST route for bulk creating multiple preferences for a driver
  router.post('/:driverId/bulk', 
    authenticate, 
    validateParams(driverIdSchema), 
    validateBody(Joi.array().items(preferenceDataSchema)), 
    preferenceController.bulkCreateDriverPreferences
  );

  // Set up PUT route for updating an existing preference
  router.put('/:driverId/preference/:preferenceId', 
    authenticate, 
    validateParams(preferenceIdSchema), 
    validateBody(preferenceDataSchema), 
    preferenceController.updateDriverPreference
  );

  // Set up DELETE route for deleting a specific preference
  router.delete('/:driverId/preference/:preferenceId', 
    authenticate, 
    validateParams(preferenceIdSchema), 
    preferenceController.deleteDriverPreference
  );

  // Set up DELETE route for deleting all preferences for a driver
  router.delete('/:driverId', 
    authenticate, 
    validateParams(driverIdSchema), 
    preferenceController.deleteAllDriverPreferences
  );

  // Set up GET route for retrieving all preferences of a specific type across all drivers
  router.get('/type/:preferenceType', 
    authenticate, 
    validateParams(Joi.object({
      preferenceType: Joi.string().required().messages({
        'string.empty': 'Preference Type is required',
        'any.required': 'Preference Type is required'
      })
    })),
    preferenceController.getPreferencesByType
  );

  // Return the configured router
  return router;
}

export default setupPreferenceRoutes;