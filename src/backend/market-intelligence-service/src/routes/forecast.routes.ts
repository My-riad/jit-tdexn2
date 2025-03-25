import express, { Router } from 'express'; // express@^4.18.2
import { ForecastController } from '../controllers/forecast.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';

// Initialize ForecastController instance
const forecastController = new ForecastController();

// Create Express router instance
const router: Router = express.Router();

/**
 * Express router for demand forecast endpoints in the market intelligence service.
 * Defines routes for generating, retrieving, and analyzing demand forecasts to support
 * predictive load surge alerts, dynamic bonus zones, and network-wide optimization features.
 */

/**
 * @route POST /forecast/generate
 * @description Generate a new demand forecast based on specified parameters
 * @access Protected
 */
router.post(
  '/generate',
  authenticate,
  validateBody(forecastController.getValidationSchemas().generateForecast.body),
  forecastController.generateForecast.bind(forecastController)
);

/**
 * @route GET /forecast/latest
 * @description Get the latest forecast for specified parameters
 * @access Protected
 */
router.get(
  '/latest',
  authenticate,
  validateQuery(forecastController.getValidationSchemas().getLatestForecast.query),
  forecastController.getLatestForecast.bind(forecastController)
);

/**
 * @route GET /forecast/:forecastId
 * @description Get a specific forecast by its ID
 * @access Protected
 */
router.get(
  '/:forecastId',
  authenticate,
  validateParams(forecastController.getValidationSchemas().getForecastById.params),
  forecastController.getForecastById.bind(forecastController)
);

/**
 * @route GET /forecast/
 * @description Query forecasts based on various parameters
 * @access Protected
 */
router.get(
  '/',
  authenticate,
  validateQuery(forecastController.getValidationSchemas().queryForecasts.query),
  forecastController.queryForecasts.bind(forecastController)
);

/**
 * @route POST /forecast/:forecastId/hotspots
 * @description Generate hotspots based on a specific forecast
 * @access Protected
 */
router.post(
  '/:forecastId/hotspots',
  authenticate,
  validateParams(forecastController.getValidationSchemas().generateHotspotsFromForecast.params),
  validateBody(forecastController.getValidationSchemas().generateHotspotsFromForecast.body),
  forecastController.generateHotspotsFromForecast.bind(forecastController)
);

/**
 * @route POST /forecast/accuracy
 * @description Evaluate the accuracy of past forecasts against actual outcomes
 * @access Protected
 */
router.post(
  '/accuracy',
  authenticate,
  validateBody(forecastController.getValidationSchemas().evaluateForecastAccuracy.body),
  forecastController.evaluateForecastAccuracy.bind(forecastController)
);

/**
 * @route GET /forecast/timeframe/:timeframe
 * @description Get forecasts for a specific timeframe
 * @access Protected
 */
router.get(
  '/timeframe/:timeframe',
  authenticate,
  validateParams(forecastController.getValidationSchemas().getForecastsByTimeframe.params),
  forecastController.getForecastsByTimeframe.bind(forecastController)
);

/**
 * @route GET /forecast/region/:region
 * @description Get forecasts for a specific region
 * @access Protected
 */
router.get(
  '/region/:region',
  authenticate,
  validateParams(forecastController.getValidationSchemas().getForecastsByRegion.params),
  forecastController.getForecastsByRegion.bind(forecastController)
);

/**
 * @route GET /forecast/equipment/:equipmentType
 * @description Get forecasts for a specific equipment type
 * @access Protected
 */
router.get(
  '/equipment/:equipmentType',
  authenticate,
  validateParams(forecastController.getValidationSchemas().getForecastsByEquipmentType.params),
  forecastController.getForecastsByEquipmentType.bind(forecastController)
);

// Export the router for use in the main application
export { router };