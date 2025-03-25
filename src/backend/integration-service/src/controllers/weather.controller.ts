import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { WeatherService, RouteWeatherRiskAnalysis, OptimalDepartureRequest } from '../services/weather.service';
import { WeatherOptions, ForecastOptions, AlertOptions, HistoricalWeatherOptions, WeatherMapOptions, RouteWeatherRequest as RouteWeatherRequestType } from '../providers/weather-api.provider';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';

/**
 * Controller class that handles HTTP requests for weather-related functionality
 */
class WeatherController {
  private weatherService: WeatherService;

  /**
   * Initializes the weather controller with a weather service instance
   */
  constructor() {
    // Initialize the WeatherService instance
    this.weatherService = new WeatherService();

    // Log successful initialization of the weather controller
    logger.info('Weather controller initialized successfully');
  }

  /**
   * Handles requests for current weather conditions at a specific location
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   * @returns Promise<void> Resolves when the response is sent
   */
  async getCurrentWeather(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract latitude, longitude, and options from request query parameters
      const { latitude, longitude, ...options } = req.query;

      // Validate the required parameters
      const { latitude: validatedLatitude, longitude: validatedLongitude } = this.validateCoordinates(latitude, longitude);

      // Call weatherService.getCurrentWeather with the parameters
      const currentWeather = await this.weatherService.getCurrentWeather(
        validatedLatitude,
        validatedLongitude,
        options as WeatherOptions // Type assertion for options
      );

      // Return the current weather data in the response
      res.status(200).json(currentWeather);
    } catch (error: any) {
      // Handle and pass any errors to the next middleware
      this.handleControllerError(error, 'getCurrentWeather', next);
    }
  }

  /**
   * Handles requests for weather forecast at a specific location
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   * @returns Promise<void> Resolves when the response is sent
   */
  async getForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract latitude, longitude, and options from request query parameters
      const { latitude, longitude, ...options } = req.query;

      // Validate the required parameters
      const { latitude: validatedLatitude, longitude: validatedLongitude } = this.validateCoordinates(latitude, longitude);

      // Call weatherService.getForecast with the parameters
      const forecast = await this.weatherService.getForecast(
        validatedLatitude,
        validatedLongitude,
        options as ForecastOptions // Type assertion for options
      );

      // Return the forecast data in the response
      res.status(200).json(forecast);
    } catch (error: any) {
      // Handle and pass any errors to the next middleware
      this.handleControllerError(error, 'getForecast', next);
    }
  }

  /**
   * Handles requests for weather conditions along a route with multiple waypoints
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   * @returns Promise<void> Resolves when the response is sent
   */
  async getRouteWeather(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract route request data from request body
      const routeRequest = req.body as RouteWeatherRequestType;

      // Validate the required parameters
      if (!routeRequest || !routeRequest.waypoints || routeRequest.waypoints.length === 0) {
        throw new AppError('Route waypoints are required', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Call weatherService.getRouteWeather with the request data
      const routeWeather = await this.weatherService.getRouteWeather(routeRequest);

      // Return the route weather data in the response
      res.status(200).json(routeWeather);
    } catch (error: any) {
      // Handle and pass any errors to the next middleware
      this.handleControllerError(error, 'getRouteWeather', next);
    }
  }

  /**
   * Handles requests for active weather alerts and warnings for a location
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   * @returns Promise<void> Resolves when the response is sent
   */
  async getWeatherAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract latitude, longitude, and options from request query parameters
      const { latitude, longitude, ...options } = req.query;

      // Validate the required parameters
      const { latitude: validatedLatitude, longitude: validatedLongitude } = this.validateCoordinates(latitude, longitude);

      // Call weatherService.getWeatherAlerts with the parameters
      const weatherAlerts = await this.weatherService.getWeatherAlerts(
        validatedLatitude,
        validatedLongitude,
        options as AlertOptions // Type assertion for options
      );

      // Return the weather alerts data in the response
      res.status(200).json(weatherAlerts);
    } catch (error: any) {
      // Handle and pass any errors to the next middleware
      this.handleControllerError(error, 'getWeatherAlerts', next);
    }
  }

  /**
   * Handles requests for historical weather data for a specific location and time
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   * @returns Promise<void> Resolves when the response is sent
   */
  async getHistoricalWeather(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract latitude, longitude, and options from request query parameters
      const { latitude, longitude, ...options } = req.query;

      // Validate the required parameters
      const { latitude: validatedLatitude, longitude: validatedLongitude } = this.validateCoordinates(latitude, longitude);

      // Call weatherService.getHistoricalWeather with the parameters
      const historicalWeather = await this.weatherService.getHistoricalWeather(
        validatedLatitude,
        validatedLongitude,
        options as HistoricalWeatherOptions // Type assertion for options
      );

      // Return the historical weather data in the response
      res.status(200).json(historicalWeather);
    } catch (error: any) {
      // Handle and pass any errors to the next middleware
      this.handleControllerError(error, 'getHistoricalWeather', next);
    }
  }

  /**
   * Handles requests for weather map layer URLs for visualization
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   * @returns Promise<void> Resolves when the response is sent
   */
  async getWeatherMap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract options from request query parameters
      const options = req.query;

      // Validate the required parameters
      if (!options || !options.layer) {
        throw new AppError('Map layer is required', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Call weatherService.getWeatherMap with the options
      const weatherMap = await this.weatherService.getWeatherMap(options as WeatherMapOptions); // Type assertion for options

      // Return the weather map data in the response
      res.status(200).json(weatherMap);
    } catch (error: any) {
      // Handle and pass any errors to the next middleware
      this.handleControllerError(error, 'getWeatherMap', next);
    }
  }

  /**
   * Handles requests for analyzing weather conditions along a route to identify potential risks
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   * @returns Promise<void> Resolves when the response is sent
   */
  async analyzeRouteWeatherRisks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract route request data from request body
      const routeRequest = req.body as RouteWeatherRequestType;

      // Validate the required parameters
      if (!routeRequest || !routeRequest.waypoints || routeRequest.waypoints.length === 0) {
        throw new AppError('Route waypoints are required', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Call weatherService.analyzeRouteWeatherRisks with the request data
      const riskAnalysis = await this.weatherService.analyzeRouteWeatherRisks(routeRequest);

      // Return the risk analysis data in the response
      res.status(200).json(riskAnalysis);
    } catch (error: any) {
      // Handle and pass any errors to the next middleware
      this.handleControllerError(error, 'analyzeRouteWeatherRisks', next);
    }
  }

  /**
   * Handles requests for determining the optimal departure time based on weather forecasts
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   * @returns Promise<void> Resolves when the response is sent
   */
  async getOptimalDepartureTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract departure request data from request body
      const departureRequest = req.body as OptimalDepartureRequest;

      // Validate the required parameters
      if (!departureRequest || !departureRequest.waypoints || departureRequest.waypoints.length === 0) {
        throw new AppError('Route waypoints are required', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      if (!departureRequest.departureWindowStart || !departureRequest.departureWindowEnd) {
        throw new AppError('Departure window start and end times are required', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Call weatherService.getOptimalDepartureTime with the request data
      const optimalDeparture = await this.weatherService.getOptimalDepartureTime(departureRequest);

      // Return the optimal departure recommendations in the response
      res.status(200).json(optimalDeparture);
    } catch (error: any) {
      // Handle and pass any errors to the next middleware
      this.handleControllerError(error, 'getOptimalDepartureTime', next);
    }
  }

  /**
   * Validates latitude and longitude parameters
   * @param latitude Latitude parameter
   * @param longitude Longitude parameter
   * @returns Validated and parsed coordinates
   */
  private validateCoordinates(
    latitude: number | string | undefined,
    longitude: number | string | undefined
  ): { latitude: number; longitude: number } {
    // Check if latitude and longitude are provided
    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required', { code: ErrorCodes.VAL_MISSING_FIELD });
    }

    // Parse latitude and longitude to numbers if they are strings
    const parsedLatitude = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const parsedLongitude = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

    // Check if latitude is a number and within valid range (-90 to 90)
    if (typeof parsedLatitude !== 'number' || parsedLatitude < -90 || parsedLatitude > 90) {
      throw new AppError('Invalid latitude value', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Check if longitude is a number and within valid range (-180 to 180)
    if (typeof parsedLongitude !== 'number' || parsedLongitude < -180 || parsedLongitude > 180) {
      throw new AppError('Invalid longitude value', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Return the validated coordinates as numbers
    return { latitude: parsedLatitude, longitude: parsedLongitude };
  }

  /**
   * Handles and standardizes errors from controller operations
   * @param error The error object
   * @param operation The name of the operation where the error occurred
   * @param next Express NextFunction for error handling
   * @returns void Passes the error to the next middleware
   */
  private handleControllerError(error: Error, operation: string, next: NextFunction): void {
    // Log the error with operation details
    logger.error(`Weather controller operation failed: ${operation}`, { error: error.message, operation: operation });
  
    // Check if error is already an AppError
    if (error instanceof AppError) {
      return next(error); // Pass the existing AppError to the next middleware
    }
  
    // Create a standardized AppError with appropriate error code
    const appError = new AppError(`Weather controller operation failed: ${operation}`, {
      code: ErrorCodes.EXT_WEATHER_SERVICE_ERROR,
      details: { originalError: error.message },
    });
  
    // Pass the standardized AppError to the next middleware
    next(appError);
  }
}

// Export the WeatherController class
export { WeatherController };