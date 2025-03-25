import { Request, Response, NextFunction } from 'express'; // express
import { ForecastService } from '../services/forecast.service';
import {
  DemandForecast,
  ForecastTimeframe,
  ForecastQueryParams,
} from '../models/demand-forecast.model';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import logger from '../../../common/utils/logger';
import { AppError, handleError } from '../../../common/utils/error-handler';
import { validateRequest } from '../../../common/utils/validation';

// Define global constants for the controller
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const DEFAULT_FORECAST_REGIONS = ['midwest', 'northeast', 'southeast', 'southwest', 'west'];
const DEFAULT_EQUIPMENT_TYPES = [EquipmentType.DRY_VAN, EquipmentType.REFRIGERATED, EquipmentType.FLATBED];

/**
 * Validates forecast generation parameters from request
 * @param params - Forecast generation parameters
 * @returns True if parameters are valid, false otherwise
 */
const validateForecastParams = (params: any): boolean => {
  // Check if timeframe is a valid ForecastTimeframe enum value
  if (!Object.values(ForecastTimeframe).includes(params.timeframe)) {
    logger.warn(`Invalid timeframe: ${params.timeframe}`);
    return false;
  }

  // Validate regions array if provided
  if (params.regions && !Array.isArray(params.regions)) {
    logger.warn('Regions must be an array');
    return false;
  }

  // Validate equipment types array if provided
  if (params.equipmentTypes && !Array.isArray(params.equipmentTypes)) {
    logger.warn('Equipment types must be an array');
    return false;
  }

  // Return validation result
  return true;
};

/**
 * Parses and validates forecast query parameters from request
 * @param query - Query parameters from the request
 * @returns Parsed and validated query parameters
 */
const parseForecastQueryParams = (query: any): ForecastQueryParams => {
  // Extract timeframe parameter and convert to ForecastTimeframe enum
  const timeframe = query.timeframe as ForecastTimeframe;

  // Extract region parameter
  const region = query.region as string;

  // Extract equipment_type parameter and convert to EquipmentType enum
  const equipment_type = query.equipment_type as EquipmentType;

  // Extract origin_region and destination_region parameters for lane forecasts
  const origin_region = query.origin_region as string;
  const destination_region = query.destination_region as string;

  // Extract min_confidence parameter and convert to number
  const min_confidence = query.min_confidence ? parseFloat(query.min_confidence) : undefined;

  // Return structured query parameters object
  return {
    timeframe,
    region,
    equipment_type,
    origin_region,
    destination_region,
    min_confidence,
  };
};

/**
 * Controller class for handling demand forecast HTTP endpoints
 */
export class ForecastController {
  private forecastService: ForecastService;

  /**
   * Initializes the ForecastController with dependencies
   */
  constructor() {
    // Initialize ForecastService instance
    this.forecastService = new ForecastService();

    // Log controller initialization
    logger.info('ForecastController initialized');
  }

  /**
   * Generates a new demand forecast based on request parameters
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async generateForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract timeframe, regions, and equipmentTypes from request body
      const { timeframe, regions, equipmentTypes } = req.body;

      // Validate request parameters
      if (!validateRequest(req.body, { timeframe: Joi.string().required().valid(...Object.values(ForecastTimeframe)), regions: Joi.array().items(Joi.string()), equipmentTypes: Joi.array().items(Joi.string().valid(...Object.values(EquipmentType))) })) { // Joi
        throw new AppError('Invalid request parameters', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.generateForecast with parameters
      const forecast: DemandForecast = await this.forecastService.generateForecast(timeframe, regions, equipmentTypes);

      // Return 201 Created with the generated forecast
      res.status(201).json(forecast);
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.generateForecast');
      next(error);
    }
  }

  /**
   * Retrieves the latest forecast for specified parameters
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getLatestForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract timeframe, region, and equipmentType from query parameters
      const { timeframe, region, equipment_type } = req.query;

       // Validate query parameters
       if (!validateRequest(req.query, { timeframe: Joi.string().required().valid(...Object.values(ForecastTimeframe)), region: Joi.string(), equipment_type: Joi.string().valid(...Object.values(EquipmentType)) })) { // Joi
        throw new AppError('Invalid query parameters', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.getLatestForecast with parameters
      const forecast: DemandForecast | null = await this.forecastService.getLatestForecast(timeframe as ForecastTimeframe, region as string, equipment_type as EquipmentType);

      // If forecast found, return 200 OK with forecast data
      if (forecast) {
        res.status(200).json(forecast);
      } else {
        // If no forecast found, return 404 Not Found
        res.status(404).json({ message: 'Forecast not found' });
      }
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.getLatestForecast');
      next(error);
    }
  }

  /**
   * Retrieves a specific forecast by its ID
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getForecastById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract forecastId from request parameters
      const { forecastId } = req.params;

      // Validate forecastId format
      if (!validateRequest(req.params, { forecastId: Joi.string().uuid().required() })) { // Joi
        throw new AppError('Invalid forecastId format', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.getForecastById with forecastId
      const forecast: DemandForecast | null = await this.forecastService.getForecastById(forecastId);

      // If forecast found, return 200 OK with forecast data
      if (forecast) {
        res.status(200).json(forecast);
      } else {
        // If no forecast found, return 404 Not Found
        res.status(404).json({ message: 'Forecast not found' });
      }
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.getForecastById');
      next(error);
    }
  }

  /**
   * Queries forecasts based on various parameters
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async queryForecasts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Parse query parameters using parseForecastQueryParams
      const queryParams: ForecastQueryParams = parseForecastQueryParams(req.query);

      // Validate query parameters
       if (!validateRequest(req.query, { timeframe: Joi.string().valid(...Object.values(ForecastTimeframe)), region: Joi.string(), equipment_type: Joi.string().valid(...Object.values(EquipmentType)), origin_region: Joi.string(), destination_region: Joi.string(), min_confidence: Joi.number() })) { // Joi
        throw new AppError('Invalid query parameters', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.queryForecasts with query parameters
      const forecasts: DemandForecast[] = await this.forecastService.queryForecasts(queryParams);

      // Return 200 OK with array of matching forecasts
      res.status(200).json(forecasts);
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.queryForecasts');
      next(error);
    }
  }

  /**
   * Generates hotspots based on a specific forecast
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async generateHotspotsFromForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract forecastId from request parameters
      const { forecastId } = req.params;

      // Extract options from request body (confidence threshold, etc.)
      const options = req.body;

      // Validate forecastId and options
       if (!validateRequest(req.params, { forecastId: Joi.string().uuid().required() })) { // Joi
        throw new AppError('Invalid forecastId format', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.generateHotspotsFromForecast with parameters
      const hotspots: object[] = await this.forecastService.generateHotspotsFromForecast(forecastId, options);

      // Return 200 OK with generated hotspots
      res.status(200).json(hotspots);
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.generateHotspotsFromForecast');
      next(error);
    }
  }

  /**
   * Evaluates the accuracy of past forecasts against actual outcomes
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async evaluateForecastAccuracy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract startDate and endDate from request body
      const { startDate, endDate } = req.body;

      // Validate date parameters
       if (!validateRequest(req.body, { startDate: Joi.date().required(), endDate: Joi.date().required() })) { // Joi
        throw new AppError('Invalid date parameters', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.evaluateForecastAccuracy with date range
      const accuracyMetrics: object = await this.forecastService.evaluateForecastAccuracy(startDate, endDate);

      // Return 200 OK with accuracy metrics
      res.status(200).json(accuracyMetrics);
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.evaluateForecastAccuracy');
      next(error);
    }
  }
    /**
   * Retrieves forecasts for a specific timeframe
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getForecastsByTimeframe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract timeframe from request parameters
      const { timeframe } = req.params;

      // Validate timeframe parameter
       if (!validateRequest(req.params, { timeframe: Joi.string().required().valid(...Object.values(ForecastTimeframe)) })) { // Joi
        throw new AppError('Invalid timeframe parameter', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.getForecastsByTimeframe with timeframe
      const forecasts: DemandForecast[] = await this.forecastService.getForecastsByTimeframe(timeframe as ForecastTimeframe);

      // Return 200 OK with matching forecasts
      res.status(200).json(forecasts);
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.getForecastsByTimeframe');
      next(error);
    }
  }

  /**
   * Retrieves forecasts for a specific region
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getForecastsByRegion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract region from request parameters
      const { region } = req.params;

      // Validate region parameter
       if (!validateRequest(req.params, { region: Joi.string().required() })) { // Joi
        throw new AppError('Invalid region parameter', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.getForecastsByRegion with region
      const forecasts: DemandForecast[] = await this.forecastService.getForecastsByRegion(region);

      // Return 200 OK with matching forecasts
      res.status(200).json(forecasts);
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.getForecastsByRegion');
      next(error);
    }
  }

  /**
   * Retrieves forecasts for a specific equipment type
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getForecastsByEquipmentType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract equipmentType from request parameters
      const { equipmentType } = req.params;

      // Validate equipmentType parameter
       if (!validateRequest(req.params, { equipmentType: Joi.string().required().valid(...Object.values(EquipmentType)) })) { // Joi
        throw new AppError('Invalid equipmentType parameter', { code: 'VAL_INVALID_INPUT', statusCode: 400 });
      }

      // Call forecastService.getForecastsByEquipmentType with equipmentType
      const forecasts: DemandForecast[] = await this.forecastService.getForecastsByEquipmentType(equipmentType as EquipmentType);

      // Return 200 OK with matching forecasts
      res.status(200).json(forecasts);
    } catch (error) {
      // Handle errors with appropriate error responses
      handleError(error, 'ForecastController.getForecastsByEquipmentType');
      next(error);
    }
  }
}