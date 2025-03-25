import { Router } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2

import { HOSController } from '../controllers/hos.controller';
import { HOSService } from '../services/hos.service';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateParams, validateQuery, validateBody } from '../../../common/middleware/validation.middleware';
import { validateDriverHOS, validateDriverId } from '../validators/driver.validator';
import { DriverEventsProducer } from '../producers/driver-events.producer';

/**
 * Creates and configures the Express router for HOS endpoints
 * @returns Configured Express router with HOS routes
 */
function createHOSRouter(): Router {
  // 1. Create a new Express router instance
  const router = Router();

  // 2. Initialize the HOSController with dependencies
  const hosController = new HOSController(new HOSService(new DriverEventsProducer()));

  // 3. Define routes for HOS operations with appropriate middleware
  // Route to get the current HOS status for a driver
  router.get(
    '/:driver_id',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    hosController.getDriverHOS.bind(hosController)
  );

  // Route to get HOS history for a driver within a time range
  router.get(
    '/:driver_id/history',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    validateQuery(Joi.object({
      startDate: Joi.date().iso().required().messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format',
        'any.required': 'Start date is required'
      }),
      endDate: Joi.date().iso().required().messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'any.required': 'End date is required'
      })
    })),
    hosController.getDriverHOSHistory.bind(hosController)
  );

  // Route to update a driver's HOS status with new data
  router.put(
    '/:driver_id',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    validateBody(Joi.object({
      status: Joi.string().required().messages({
        'string.empty': 'HOS status is required',
        'any.required': 'HOS status is required'
      }),
      driving_minutes_remaining: Joi.number().required().messages({
        'number.base': 'Driving minutes remaining is required',
        'any.required': 'Driving minutes remaining is required'
      }),
      duty_minutes_remaining: Joi.number().required().messages({
        'number.base': 'Duty minutes remaining is required',
        'any.required': 'Duty minutes remaining is required'
      }),
      cycle_minutes_remaining: Joi.number().required().messages({
        'number.base': 'Cycle minutes remaining is required',
        'any.required': 'Cycle minutes remaining is required'
      }),
      location: Joi.object({
        latitude: Joi.number().required().messages({
          'number.base': 'Latitude is required',
          'any.required': 'Latitude is required'
        }),
        longitude: Joi.number().required().messages({
          'number.base': 'Longitude is required',
          'any.required': 'Longitude is required'
        })
      }).required().messages({
        'object.base': 'Location is required',
        'any.required': 'Location is required'
      })
    })),
    hosController.updateDriverHOS.bind(hosController)
  );

  // Route to fetch the latest HOS data from a driver's ELD provider
  router.get(
    '/:driver_id/sync',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    hosController.syncDriverHOSFromELD.bind(hosController)
  );

  // Route to check if a driver is compliant with HOS regulations
  router.get(
    '/:driver_id/compliance',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    hosController.checkHOSCompliance.bind(hosController)
  );

  // Route to calculate available driving hours for a specific trip
  router.get(
    '/:driver_id/availability',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    validateQuery(Joi.object({
      estimatedDrivingMinutes: Joi.number().required().messages({
        'number.base': 'Estimated driving minutes is required',
        'any.required': 'Estimated driving minutes is required'
      })
    })),
    hosController.calculateAvailableHours.bind(hosController)
  );

  // Route to get a summary of a driver's duty status over a time period
  router.get(
    '/:driver_id/summary',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    validateQuery(Joi.object({
      startDate: Joi.date().iso().required().messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format',
        'any.required': 'Start date is required'
      }),
      endDate: Joi.date().iso().required().messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'any.required': 'End date is required'
      })
    })),
    hosController.getDriverDutyStatusSummary.bind(hosController)
  );

  // Route to predict a driver's HOS availability at a future point in time
  router.get(
    '/:driver_id/predict',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    validateQuery(Joi.object({
      targetDate: Joi.date().iso().required().messages({
        'date.base': 'Target date must be a valid date',
        'date.format': 'Target date must be in ISO format',
        'any.required': 'Target date is required'
      })
    })),
    hosController.predictHOSAvailability.bind(hosController)
  );

  // Route to validate if a driver has sufficient HOS to complete a load
  router.post(
    '/:driver_id/validate',
    authenticate,
    validateParams(Joi.object({
      driver_id: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
      })
    })),
    validateBody(Joi.object({
      estimatedDrivingMinutes: Joi.number().required().messages({
        'number.base': 'Estimated driving minutes is required',
        'any.required': 'Estimated driving minutes is required'
      }),
      pickup_time: Joi.date().iso().required().messages({
        'date.base': 'Pickup time must be a valid date',
        'date.format': 'Pickup time must be in ISO format',
        'any.required': 'Pickup time is required'
      }),
      delivery_time: Joi.date().iso().required().messages({
        'date.base': 'Delivery time must be a valid date',
        'date.format': 'Delivery time must be in ISO format',
        'any.required': 'Delivery time is required'
      })
    })),
    hosController.validateHOSForLoad.bind(hosController)
  );

  // 4. Return the configured router
  return router;
}

// Export the configured HOS router
export default createHOSRouter();