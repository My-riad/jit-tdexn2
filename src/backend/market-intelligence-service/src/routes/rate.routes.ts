import express, { Router } from 'express'; // express@^4.18.2
import { RateController } from '../controllers/rate.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';

// Create a new express Router instance
const router: Router = express.Router();

// Instantiate the RateController
const rateController = new RateController();

/**
 * @description Get current market rate for a specific lane and equipment type
 * @route GET /current
 * @middleware authenticate - Authenticates the request
 * @middleware validateQuery - Validates the query parameters against the schema defined in rateController.getValidationSchemas().getMarketRate.query
 * @handler rateController.getMarketRate - Handles the request to retrieve the market rate
 */
router.get('/current',
  authenticate,
  validateQuery(rateController.getValidationSchemas().getMarketRate.query),
  rateController.getMarketRate.bind(rateController)
);

/**
 * @description Get historical market rates for a specific lane and equipment type
 * @route GET /historical
 * @middleware authenticate - Authenticates the request
 * @middleware validateQuery - Validates the query parameters against the schema defined in rateController.getValidationSchemas().getHistoricalRates.query
 * @handler rateController.getHistoricalRates - Handles the request to retrieve historical market rates
 */
router.get('/historical',
  authenticate,
  validateQuery(rateController.getValidationSchemas().getHistoricalRates.query),
  rateController.getHistoricalRates.bind(rateController)
);

/**
 * @description Calculate a dynamic rate for a specific lane based on market conditions
 * @route POST /calculate
 * @middleware authenticate - Authenticates the request
 * @middleware validateQuery - Validates the query parameters against the schema defined in rateController.getValidationSchemas().calculateRate.query
 * @middleware validateBody - Validates the request body against the schema defined in rateController.getValidationSchemas().calculateRate.body
 * @handler rateController.calculateRate - Handles the request to calculate the dynamic rate
 */
router.post('/calculate',
  authenticate,
  validateQuery(rateController.getValidationSchemas().calculateRate.query),
  validateBody(rateController.getValidationSchemas().calculateRate.body),
  rateController.calculateRate.bind(rateController)
);

/**
 * @description Calculate a dynamic rate for a specific load
 * @route POST /calculate-load
 * @middleware authenticate - Authenticates the request
 * @middleware validateBody - Validates the request body against the schema defined in rateController.getValidationSchemas().calculateLoadRate.body
 * @handler rateController.calculateLoadRate - Handles the request to calculate the dynamic rate for a load
 */
router.post('/calculate-load',
  authenticate,
  validateBody(rateController.getValidationSchemas().calculateLoadRate.body),
  rateController.calculateLoadRate.bind(rateController)
);

/**
 * @description Analyze rate trends for a specific lane and equipment type
 * @route GET /trends
 * @middleware authenticate - Authenticates the request
 * @middleware validateQuery - Validates the query parameters against the schema defined in rateController.getValidationSchemas().analyzeRateTrends.query
 * @handler rateController.analyzeRateTrends - Handles the request to analyze rate trends
 */
router.get('/trends',
  authenticate,
  validateQuery(rateController.getValidationSchemas().analyzeRateTrends.query),
  rateController.analyzeRateTrends.bind(rateController)
);

/**
 * @description Get the current supply/demand ratio for a specific lane
 * @route GET /supply-demand
 * @middleware authenticate - Authenticates the request
 * @middleware validateQuery - Validates the query parameters against the schema defined in rateController.getValidationSchemas().getSupplyDemandRatio.query
 * @handler rateController.getSupplyDemandRatio - Handles the request to retrieve the supply/demand ratio
 */
router.get('/supply-demand',
  authenticate,
  validateQuery(rateController.getValidationSchemas().getSupplyDemandRatio.query),
  rateController.getSupplyDemandRatio.bind(rateController)
);

/**
 * @description Calculate a rate adjustment factor based on market conditions
 * @route POST /adjustment
 * @middleware authenticate - Authenticates the request
 * @middleware validateQuery - Validates the query parameters against the schema defined in rateController.getValidationSchemas().calculateRateAdjustment.query
 * @middleware validateBody - Validates the request body against the schema defined in rateController.getValidationSchemas().calculateRateAdjustment.body
 * @handler rateController.calculateRateAdjustment - Handles the request to calculate the rate adjustment factor
 */
router.post('/adjustment',
  authenticate,
  validateQuery(rateController.getValidationSchemas().calculateRateAdjustment.query),
  validateBody(rateController.getValidationSchemas().calculateRateAdjustment.body),
  rateController.calculateRateAdjustment.bind(rateController)
);

/**
 * @description Synchronize market rates from external sources to the database
 * @route POST /sync
 * @middleware authenticate - Authenticates the request
 * @handler rateController.syncMarketRates - Handles the request to synchronize market rates
 */
router.post('/sync',
  authenticate,
  rateController.syncMarketRates.bind(rateController)
);

/**
 * @description Create a new market rate record in the database
 * @route POST /
 * @middleware authenticate - Authenticates the request
 * @middleware validateBody - Validates the request body against the schema defined in rateController.getValidationSchemas().createMarketRate.body
 * @handler rateController.createMarketRate - Handles the request to create a new market rate
 */
router.post('/',
  authenticate,
  validateBody(rateController.getValidationSchemas().createMarketRate.body),
  rateController.createMarketRate.bind(rateController)
);

/**
 * @description Update an existing market rate record in the database
 * @route PUT /:rateId
 * @middleware authenticate - Authenticates the request
 * @middleware validateParams - Validates the URL parameters against the schema defined in rateController.getValidationSchemas().updateMarketRate.params
 * @middleware validateBody - Validates the request body against the schema defined in rateController.getValidationSchemas().updateMarketRate.body
 * @handler rateController.updateMarketRate - Handles the request to update an existing market rate
 */
router.put('/:rateId',
  authenticate,
  validateParams(rateController.getValidationSchemas().updateMarketRate.params),
  validateBody(rateController.getValidationSchemas().updateMarketRate.body),
  rateController.updateMarketRate.bind(rateController)
);

/**
 * @description Retrieve market rates with optional filtering and pagination
 * @route GET /
 * @middleware authenticate - Authenticates the request
 * @middleware validateQuery - Validates the query parameters against the schema defined in rateController.getValidationSchemas().getMarketRates.query
 * @handler rateController.getMarketRates - Handles the request to retrieve market rates
 */
router.get('/',
  authenticate,
  validateQuery(rateController.getValidationSchemas().getMarketRates.query),
  rateController.getMarketRates.bind(rateController)
);

// Export the router for use in the main application
export { router };