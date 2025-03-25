import { Router } from 'express'; // express@^4.18.2
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { AvailabilityController } from '../controllers/availability.controller';
import { validateDriverAvailability, validateDriverStatusUpdate, validateDriverHOS, validateDriverSearch, validateDriverId } from '../validators/driver.validator';

/**
 * Configures and returns an Express router with all driver availability routes
 * @param availabilityController - The availability controller
 * @returns Configured Express router with availability routes
 */
const configureAvailabilityRoutes = (availabilityController: AvailabilityController): Router => {
  // Create a new Express router instance
  const router = Router();

  /**
   * @openapi
   * /drivers/{driverId}/availability:
   *   get:
   *     summary: Retrieve driver availability
   *     description: Retrieves the availability information for a specific driver.
   *     tags: [Availability]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the driver to retrieve availability for.
   *     responses:
   *       200:
   *         description: Successfully retrieved driver availability.
   *       404:
   *         description: Driver not found.
   *       500:
   *         description: Internal server error.
   */
  // Configure GET /drivers/:driverId/availability route for retrieving driver availability
  router.get('/:driverId/availability', authenticate, validateParams(validateDriverId), availabilityController.getDriverAvailability.bind(availabilityController));

  /**
   * @openapi
   * /drivers/{driverId}/availability:
   *   put:
   *     summary: Update driver availability
   *     description: Updates the availability information for a specific driver.
   *     tags: [Availability]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the driver to update availability for.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/DriverAvailability'
   *     responses:
   *       200:
   *         description: Successfully updated driver availability.
   *       400:
   *         description: Invalid request body.
   *       404:
   *         description: Driver not found.
   *       500:
   *         description: Internal server error.
   */
  // Configure PUT /drivers/:driverId/availability route for updating driver availability
  router.put('/:driverId/availability', authenticate, validateParams(validateDriverId), validateBody(validateDriverAvailability), availabilityController.updateDriverAvailability.bind(availabilityController));

  /**
   * @openapi
   * /drivers/{driverId}/status:
   *   put:
   *     summary: Update driver status
   *     description: Updates the status of a specific driver.
   *     tags: [Availability]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the driver to update status for.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, INACTIVE, AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, SUSPENDED]
   *     responses:
   *       200:
   *         description: Successfully updated driver status.
   *       400:
   *         description: Invalid request body.
   *       404:
   *         description: Driver not found.
   *       500:
   *         description: Internal server error.
   */
  // Configure PUT /drivers/:driverId/status route for updating driver status
  router.put('/:driverId/status', authenticate, validateParams(validateDriverId), validateBody(validateDriverStatusUpdate), availabilityController.updateDriverStatus.bind(availabilityController));

  /**
   * @openapi
   * /drivers/{driverId}/location:
   *   put:
   *     summary: Update driver location
   *     description: Updates the location of a specific driver.
   *     tags: [Availability]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the driver to update location for.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               latitude:
   *                 type: number
   *               longitude:
   *                 type: number
   *     responses:
   *       200:
   *         description: Successfully updated driver location.
   *       400:
   *         description: Invalid request body.
   *       404:
   *         description: Driver not found.
   *       500:
   *         description: Internal server error.
   */
  // Configure PUT /drivers/:driverId/location route for updating driver location
  router.put('/:driverId/location', authenticate, validateParams(validateDriverId), availabilityController.updateDriverLocation.bind(availabilityController));

  /**
   * @openapi
   * /drivers/{driverId}/hos:
   *   put:
   *     summary: Update driver HOS data
   *     description: Updates the Hours of Service (HOS) data for a specific driver.
   *     tags: [Availability]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the driver to update HOS data for.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, INACTIVE, AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, SUSPENDED]
   *               driving_minutes_remaining:
   *                 type: number
   *               duty_minutes_remaining:
   *                 type: number
   *               cycle_minutes_remaining:
   *                 type: number
   *     responses:
   *       200:
   *         description: Successfully updated driver HOS data.
   *       400:
   *         description: Invalid request body.
   *       404:
   *         description: Driver not found.
   *       500:
   *         description: Internal server error.
   */
  // Configure PUT /drivers/:driverId/hos route for updating driver HOS data
  router.put('/:driverId/hos', authenticate, validateParams(validateDriverId), validateBody(validateDriverHOS), availabilityController.updateDriverHOSStatus.bind(availabilityController));

  /**
   * @openapi
   * /drivers/{driverId}/time-window:
   *   put:
   *     summary: Update driver time window
   *     description: Updates the availability time window for a specific driver.
   *     tags: [Availability]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the driver to update time window for.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               available_from:
   *                 type: string
   *                 format: date-time
   *               available_until:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Successfully updated driver time window.
   *       400:
   *         description: Invalid request body.
   *       404:
   *         description: Driver not found.
   *       500:
   *         description: Internal server error.
   */
  // Configure PUT /drivers/:driverId/time-window route for updating driver time window
  router.put('/:driverId/time-window', authenticate, validateParams(validateDriverId), availabilityController.updateDriverTimeWindow.bind(availabilityController));

  /**
   * @openapi
   * /drivers/available:
   *   get:
   *     summary: Find available drivers
   *     description: Finds available drivers based on various criteria.
   *     tags: [Availability]
   *     parameters:
   *       - in: query
   *         name: location
   *         schema:
   *           type: object
   *           properties:
   *             latitude:
   *               type: number
   *             longitude:
   *               type: number
   *             radius:
   *               type: number
   *         description: Location criteria for finding drivers near a specific location.
   *       - in: query
   *         name: timeWindow
   *         schema:
   *           type: object
   *           properties:
   *             from:
   *               type: string
   *               format: date-time
   *             until:
   *               type: string
   *               format: date-time
   *         description: Time window criteria for finding drivers available during a specific time.
   *     responses:
   *       200:
   *         description: Successfully found available drivers.
   *       400:
   *         description: Invalid query parameters.
   *       500:
   *         description: Internal server error.
   */
  // Configure GET /drivers/available route for finding available drivers
  router.get('/available', authenticate, validateQuery(validateDriverSearch), availabilityController.findAvailableDrivers.bind(availabilityController));

  /**
   * @openapi
   * /drivers/nearby:
   *   get:
   *     summary: Find drivers near a location
   *     description: Finds drivers near a specific location based on latitude, longitude, and radius.
   *     tags: [Availability]
   *     parameters:
   *       - in: query
   *         name: latitude
   *         schema:
   *           type: number
   *         required: true
   *         description: Latitude of the center point.
   *       - in: query
   *         name: longitude
   *         schema:
   *           type: number
   *         required: true
   *         description: Longitude of the center point.
   *       - in: query
   *         name: radius
   *         schema:
   *           type: number
   *         required: true
   *         description: Radius in miles.
   *     responses:
   *       200:
   *         description: Successfully found drivers near the location.
   *       400:
   *         description: Invalid query parameters.
   *       500:
   *         description: Internal server error.
   */
  // Configure GET /drivers/nearby route for finding drivers near a location
  router.get('/nearby', authenticate, validateQuery(validateDriverSearch), availabilityController.findDriversNearLocation.bind(availabilityController));

  /**
   * @openapi
   * /drivers/{driverId}/check-load:
   *   post:
   *     summary: Check driver availability for load
   *     description: Checks if a driver is available for a specific load based on location and time.
   *     tags: [Availability]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the driver to check availability for.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               origin:
   *                 type: object
   *                 properties:
   *                   latitude:
   *                     type: number
   *                   longitude:
   *                     type: number
   *               destination:
   *                 type: object
   *                 properties:
   *                   latitude:
   *                     type: number
   *                   longitude:
   *                     type: number
   *               pickup_time:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Successfully checked driver availability for load.
   *       400:
   *         description: Invalid request body.
   *       404:
   *         description: Driver not found.
   *       500:
   *         description: Internal server error.
   */
  // Configure POST /drivers/:driverId/check-load route for checking driver availability for a load
  router.post('/:driverId/check-load', authenticate, validateParams(validateDriverId), availabilityController.checkDriverAvailabilityForLoad.bind(availabilityController));

  /**
   * @openapi
   * /drivers/{driverId}/predict:
   *   get:
   *     summary: Predict driver availability
   *     description: Predicts the availability of a driver at a future point in time.
   *     tags: [Availability]
   *     parameters:
   *       - in: path
   *         name: driverId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the driver to predict availability for.
   *       - in: query
   *         name: futureTime
   *         schema:
   *           type: string
   *           format: date-time
   *         required: true
   *         description: The future time to predict availability for.
   *     responses:
   *       200:
   *         description: Successfully predicted driver availability.
   *       400:
   *         description: Invalid query parameters.
   *       404:
   *         description: Driver not found.
   *       500:
   *         description: Internal server error.
   */
  // Configure GET /drivers/:driverId/predict route for predicting driver availability
  router.get('/:driverId/predict', authenticate, validateParams(validateDriverId), availabilityController.predictDriverAvailability.bind(availabilityController));

  // Return the configured router
  return router;
};

export default configureAvailabilityRoutes;