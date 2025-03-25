import { Router } from 'express'; // express@^4.18.2
import { DriverController } from '../controllers/driver.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import {
  validateDriverCreation,
  validateDriverUpdate,
  validateDriverStatusUpdate,
  validateDriverId,
  validateDriverSearch
} from '../validators/driver.validator';

/**
 * Configures and returns an Express router with all driver management routes
 * @param driverController - Instance of the DriverController to handle requests
 * @returns Configured Express router with driver routes
 */
export default function configureDriverRoutes(driverController: DriverController): Router {
  // Create a new Express router instance
  const router = Router();

  // Configure GET /drivers/:driverId route for retrieving a driver by ID
  router.get('/:driverId', 
    validateParams(validateDriverId),
    driverController.getDriverById
  );

  // Configure GET /drivers/user/:userId route for retrieving a driver by user ID
  router.get('/user/:userId',
    driverController.getDriverByUserId
  );

  // Configure GET /drivers/carrier/:carrierId route for retrieving drivers by carrier ID
  router.get('/carrier/:carrierId',
    driverController.getDriversByCarrierId
  );

  // Configure GET /drivers/:driverId/details route for retrieving a driver with all details
  router.get('/:driverId/details',
    validateParams(validateDriverId),
    driverController.getDriverWithDetails
  );

  // Configure GET /drivers/:driverId/summary route for retrieving a driver summary
  router.get('/:driverId/summary',
    validateParams(validateDriverId),
    driverController.getDriverSummary
  );

  // Configure POST /drivers route for creating a new driver
  router.post('/',
    validateBody(validateDriverCreation),
    driverController.createDriver
  );

  // Configure PUT /drivers/:driverId route for updating a driver
  router.put('/:driverId',
    validateParams(validateDriverId),
    validateBody(validateDriverUpdate),
    driverController.updateDriver
  );

  // Configure PUT /drivers/:driverId/status route for updating a driver's status
  router.put('/:driverId/status',
    validateParams(validateDriverId),
    validateBody(validateDriverStatusUpdate),
    driverController.updateDriverStatus
  );

  // Configure PUT /drivers/:driverId/efficiency-score route for updating a driver's efficiency score
  router.put('/:driverId/efficiency-score',
    validateParams(validateDriverId),
    driverController.updateDriverEfficiencyScore
  );

  // Configure PUT /drivers/:driverId/deactivate route for deactivating a driver
  router.put('/:driverId/deactivate',
    validateParams(validateDriverId),
    driverController.deactivateDriver
  );

  // Configure PUT /drivers/:driverId/activate route for activating a driver
  router.put('/:driverId/activate',
    validateParams(validateDriverId),
    driverController.activateDriver
  );

  // Configure GET /drivers/search route for searching drivers
  router.get('/search',
    validateQuery(validateDriverSearch),
    driverController.searchDrivers
  );

  // Configure POST /drivers/:driverId/validate-load route for validating a driver for a load
  router.post('/:driverId/validate-load',
    validateParams(validateDriverId),
    driverController.validateDriverForLoad
  );

  // Apply authentication middleware to all routes
  router.use(authenticate);

  // Return the configured router
  return router;
}