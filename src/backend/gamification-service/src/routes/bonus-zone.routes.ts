import express from 'express'; // express ^4.18.2
import Joi from 'joi'; // joi ^17.9.2
import BonusZoneController from '../controllers/bonus-zone.controller';
import BonusZoneService from '../services/bonus-zone.service';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';

// Create a new Express router
const bonusZoneRouter = express.Router();

/**
 * Sets up all bonus zone routes with the appropriate middleware and controllers
 */
function setupBonusZoneRoutes(): express.Router {
  // Initialize the BonusZoneService
  const bonusZoneService = new BonusZoneService();

  // Initialize the BonusZoneController with the service
  const bonusZoneController = new BonusZoneController(bonusZoneService);

  // Route for creating a new bonus zone
  bonusZoneRouter.post(
    '/',
    authenticate,
    validateBody(
      Joi.object({
        name: Joi.string().required(),
        boundary: Joi.array().items(
          Joi.object({
            latitude: Joi.number().min(-90).max(90).required(),
            longitude: Joi.number().min(-180).max(180).required(),
          })
        ).min(3).required(),
        multiplier: Joi.number().min(1.0).required(),
        reason: Joi.string().required(),
        startTime: Joi.date().iso().required(),
        endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
        isActive: Joi.boolean(),
      })
    ),
    bonusZoneController.createBonusZone
  );

  // Route for creating a circular bonus zone
  bonusZoneRouter.post(
    '/circular',
    authenticate,
    validateBody(
      Joi.object({
        name: Joi.string().required(),
        centerLat: Joi.number().min(-90).max(90).required(),
        centerLng: Joi.number().min(-180).max(180).required(),
        radiusKm: Joi.number().min(0).required(),
        multiplier: Joi.number().min(1.0).required(),
        reason: Joi.string().required(),
        startTime: Joi.date().iso().required(),
        endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
      })
    ),
    bonusZoneController.createCircularBonusZone
  );

  // Route for getting a bonus zone by ID
  bonusZoneRouter.get(
    '/:id',
    authenticate,
    validateParams(
      Joi.object({
        id: Joi.string().uuid().required(),
      })
    ),
    bonusZoneController.getBonusZone
  );

  // Route for getting all bonus zones
  bonusZoneRouter.get(
    '/',
    authenticate,
    validateQuery(
      Joi.object({
        activeOnly: Joi.boolean().optional(),
      })
    ),
    bonusZoneController.getAllBonusZones
  );

  // Route for getting all active bonus zones
  bonusZoneRouter.get(
    '/active',
    authenticate,
    bonusZoneController.getActiveBonusZones
  );

  // Route for updating a bonus zone
  bonusZoneRouter.put(
    '/:id',
    authenticate,
    validateParams(
      Joi.object({
        id: Joi.string().uuid().required(),
      })
    ),
    validateBody(
      Joi.object({
        name: Joi.string(),
        boundary: Joi.array().items(
          Joi.object({
            latitude: Joi.number().min(-90).max(90).required(),
            longitude: Joi.number().min(-180).max(180).required(),
          })
        ).min(3),
        multiplier: Joi.number().min(1.0),
        reason: Joi.string(),
        startTime: Joi.date().iso(),
        endTime: Joi.date().iso().greater(Joi.ref('startTime')),
        isActive: Joi.boolean(),
      }).min(1) // At least one field must be present in the body
    ),
    bonusZoneController.updateBonusZone
  );

  // Route for deactivating a bonus zone
  bonusZoneRouter.patch(
    '/:id/deactivate',
    authenticate,
    validateParams(
      Joi.object({
        id: Joi.string().uuid().required(),
      })
    ),
    bonusZoneController.deactivateBonusZone
  );

  // Route for deleting a bonus zone
  bonusZoneRouter.delete(
    '/:id',
    authenticate,
    validateParams(
      Joi.object({
        id: Joi.string().uuid().required(),
      })
    ),
    bonusZoneController.deleteBonusZone
  );

  // Route for checking if a position is in a bonus zone
  bonusZoneRouter.post(
    '/check-position',
    authenticate,
    validateBody(
      Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
      })
    ),
    bonusZoneController.checkPositionInBonusZone
  );

  // Route for getting bonus zones in a radius
  bonusZoneRouter.get(
    '/radius',
    authenticate,
    validateQuery(
      Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        radius: Joi.number().min(0).required(),
      })
    ),
    bonusZoneController.getBonusZonesInRadius
  );

  // Route for creating a driver bonus
  bonusZoneRouter.post(
    '/driver-bonus',
    authenticate,
    validateBody(
      Joi.object({
        driverId: Joi.string().uuid().required(),
        zoneId: Joi.string().uuid().required(),
        assignmentId: Joi.string().uuid().allow(null).optional(),
        bonusAmount: Joi.number().min(0).required(),
        reason: Joi.string().required(),
      })
    ),
    bonusZoneController.createDriverBonus
  );

  // Route for getting driver bonuses for a zone
  bonusZoneRouter.get(
    '/:zoneId/driver-bonuses',
    authenticate,
    validateParams(
      Joi.object({
        zoneId: Joi.string().uuid().required(),
      })
    ),
    bonusZoneController.getDriverBonusesForZone
  );

  // Return the configured router
  return bonusZoneRouter;
}

// Export the configured bonus zone router for use in the main application
export const bonusZoneRouter = setupBonusZoneRoutes();