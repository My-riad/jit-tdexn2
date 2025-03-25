import { Router } from 'express'; // express@^4.18.2
import { WeatherController } from '../controllers/weather.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateQuery } from '../../../common/middleware/validation.middleware';
import { 
  currentWeatherSchema, 
  forecastSchema, 
  routeWeatherSchema, 
  alertsSchema, 
  historicalWeatherSchema,
  weatherMapSchema,
  routeRiskAnalysisSchema,
  optimalDepartureSchema
} from '../controllers/weather.controller';
import logger from '../../../common/utils/logger';

/**
 * Initializes the weather routes with the controller instance
 * @param WeatherController weatherController
 * @returns Router Configured Express router with weather routes
 */
const initializeRoutes = (weatherController: WeatherController): Router => {
  // Create a new Express router instance
  const router = Router();

  // Register current weather route (GET /current)
  router.get('/current', 
    validateQuery(currentWeatherSchema), // Apply validation middleware to routes with request data
    weatherController.getCurrentWeather.bind(weatherController)
  );

  // Register forecast route (GET /forecast)
  router.get('/forecast',
    validateQuery(forecastSchema), // Apply validation middleware to routes with request data
    weatherController.getForecast.bind(weatherController)
  );

  // Register route weather route (POST /route)
  router.post('/route',
    validateBody(routeWeatherSchema), // Apply validation middleware to routes with request data
    weatherController.getRouteWeather.bind(weatherController)
  );

  // Register weather alerts route (GET /alerts)
  router.get('/alerts',
    validateQuery(alertsSchema), // Apply validation middleware to routes with request data
    weatherController.getWeatherAlerts.bind(weatherController)
  );

  // Register historical weather route (GET /historical)
  router.get('/historical',
    validateQuery(historicalWeatherSchema), // Apply validation middleware to routes with request data
    weatherController.getHistoricalWeather.bind(weatherController)
  );

  // Register weather map route (GET /map)
  router.get('/map',
    validateQuery(weatherMapSchema), // Apply validation middleware to routes with request data
    weatherController.getWeatherMap.bind(weatherController)
  );

  // Register route risk analysis route (POST /route/risks)
  router.post('/route/risks',
    authenticate, // Apply authentication middleware to protected routes
    validateBody(routeRiskAnalysisSchema), // Apply validation middleware to routes with request data
    weatherController.analyzeRouteWeatherRisks.bind(weatherController)
  );

  // Register optimal departure time route (POST /optimal-departure)
  router.post('/optimal-departure',
    authenticate, // Apply authentication middleware to protected routes
    validateBody(optimalDepartureSchema), // Apply validation middleware to routes with request data
    weatherController.getOptimalDepartureTime.bind(weatherController)
  );

  // Log successful route initialization
  logger.info('Weather routes initialized successfully');

  // Return the configured router
  return router;
};

// Export the function that initializes and returns Express router with configured weather routes
export default initializeRoutes;