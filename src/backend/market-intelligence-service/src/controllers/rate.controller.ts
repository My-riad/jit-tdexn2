import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2
import { RateService } from '../services/rate.service';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';

// Define global constants for the service
const SERVICE_NAME = 'market-intelligence-service';

/**
 * Controller for handling market rate and dynamic pricing HTTP requests
 */
export class RateController {
  private rateService: RateService;

  /**
   * Initializes a new RateController instance
   */
  constructor() {
    // Initialize RateService instance
    this.rateService = new RateService();

    // Set up logging with service context
    logger.info('RateController initialized', { service: SERVICE_NAME });
  }

  /**
   * Handles requests to get current market rate for a specific lane and equipment type
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with market rate data
   */
  async getMarketRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to get market rate', { query: req.query });

    try {
      // Extract originRegion, destinationRegion, and equipmentType from query parameters
      const { originRegion, destinationRegion, equipmentType } = req.query;

      // Validate that the required parameters are present
      if (!originRegion || !destinationRegion || !equipmentType) {
        logger.error('Missing required parameters for getMarketRate', { query: req.query });
        return next(createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT }));
      }

      // Call rateService.getMarketRate() with the extracted parameters
      const marketRate = await this.rateService.getMarketRate(
        String(originRegion),
        String(destinationRegion),
        equipmentType as EquipmentType
      );

      // Log the successful retrieval of the market rate
      logger.info('Market rate retrieved successfully', { marketRate });

      // Return the market rate data in the response
      res.status(StatusCodes.OK).json(marketRate);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in getMarketRate', { error });
      next(error);
    }
  }

  /**
   * Handles requests to get historical market rates for a specific lane and equipment type
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with historical rate data
   */
  async getHistoricalRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to get historical rates', { query: req.query });

    try {
      // Extract originRegion, destinationRegion, equipmentType, startDate, and endDate from query parameters
      const { originRegion, destinationRegion, equipmentType, startDate, endDate } = req.query;

      // Validate that the required parameters are present
      if (!originRegion || !destinationRegion || !equipmentType || !startDate || !endDate) {
        logger.error('Missing required parameters for getHistoricalRates', { query: req.query });
        return next(createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT }));
      }

      // Convert startDate and endDate to Date objects
      const startDateObj = new Date(String(startDate));
      const endDateObj = new Date(String(endDate));

      // Call rateService.getHistoricalRates() with the extracted parameters
      const historicalRates = await this.rateService.getHistoricalRates(
        String(originRegion),
        String(destinationRegion),
        equipmentType as EquipmentType,
        startDateObj,
        endDateObj
      );

      // Log the successful retrieval of the historical rates
      logger.info('Historical rates retrieved successfully', { historicalRates });

      // Return the historical rate data in the response
      res.status(StatusCodes.OK).json(historicalRates);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in getHistoricalRates', { error });
      next(error);
    }
  }

  /**
   * Handles requests to calculate a dynamic rate for a specific lane based on market conditions
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with calculated rate data
   */
  async calculateRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to calculate rate', { query: req.query, body: req.body });

    try {
      // Extract originRegion, destinationRegion, and equipmentType from query parameters
      const { originRegion, destinationRegion, equipmentType } = req.query;

      // Extract options from request body
      const options = req.body;

      // Validate that the required parameters are present
      if (!originRegion || !destinationRegion || !equipmentType) {
        logger.error('Missing required parameters for calculateRate', { query: req.query, body: req.body });
        return next(createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT }));
      }

      // Call rateService.calculateRate() with the extracted parameters
      const calculatedRate = await this.rateService.calculateRate(
        String(originRegion),
        String(destinationRegion),
        equipmentType as EquipmentType,
        options
      );

      // Log the successful calculation of the rate
      logger.info('Rate calculated successfully', { calculatedRate });

      // Return the calculated rate data in the response
      res.status(StatusCodes.OK).json(calculatedRate);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in calculateRate', { error });
      next(error);
    }
  }

  /**
   * Handles requests to calculate a dynamic rate for a specific load
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with calculated rate data
   */
  async calculateLoadRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to calculate load rate', { body: req.body });

    try {
      // Extract load data from request body
      const loadData = req.body;

      // Call rateService.calculateLoadRate() with the load data
      const calculatedRate = await this.rateService.calculateLoadRate(loadData);

      // Log the successful calculation of the load rate
      logger.info('Load rate calculated successfully', { calculatedRate });

      // Return the calculated rate data in the response
      res.status(StatusCodes.OK).json(calculatedRate);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in calculateLoadRate', { error });
      next(error);
    }
  }

  /**
   * Handles requests to analyze rate trends for a specific lane and equipment type
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with rate trend analysis
   */
  async analyzeRateTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to analyze rate trends', { query: req.query });

    try {
      // Extract originRegion, destinationRegion, equipmentType, and days from query parameters
      const { originRegion, destinationRegion, equipmentType, days } = req.query;

      // Validate that the required parameters are present
      if (!originRegion || !destinationRegion || !equipmentType || !days) {
        logger.error('Missing required parameters for analyzeRateTrends', { query: req.query });
        return next(createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT }));
      }

      // Convert days to a number
      const daysNum = Number(days);

      // Call rateService.analyzeRateTrends() with the extracted parameters
      const trendAnalysis = await this.rateService.analyzeRateTrends(
        String(originRegion),
        String(destinationRegion),
        equipmentType as EquipmentType,
        daysNum
      );

      // Log the successful analysis of the rate trends
      logger.info('Rate trends analyzed successfully', { trendAnalysis });

      // Return the trend analysis data in the response
      res.status(StatusCodes.OK).json(trendAnalysis);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in analyzeRateTrends', { error });
      next(error);
    }
  }

  /**
   * Handles requests to get the current supply/demand ratio for a specific lane
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with supply/demand ratio data
   */
  async getSupplyDemandRatio(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to get supply/demand ratio', { query: req.query });

    try {
      // Extract originRegion, destinationRegion, and equipmentType from query parameters
      const { originRegion, destinationRegion, equipmentType } = req.query;

      // Validate that the required parameters are present
      if (!originRegion || !destinationRegion || !equipmentType) {
        logger.error('Missing required parameters for getSupplyDemandRatio', { query: req.query });
        return next(createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT }));
      }

      // Call rateService.getSupplyDemandRatio() with the extracted parameters
      const supplyDemandRatio = await this.rateService.getSupplyDemandRatio(
        String(originRegion),
        String(destinationRegion),
        equipmentType as EquipmentType
      );

      // Log the successful retrieval of the supply/demand ratio
      logger.info('Supply/demand ratio retrieved successfully', { supplyDemandRatio });

      // Return the supply/demand ratio data in the response
      res.status(StatusCodes.OK).json(supplyDemandRatio);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in getSupplyDemandRatio', { error });
      next(error);
    }
  }

  /**
   * Handles requests to calculate a rate adjustment factor based on market conditions
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with rate adjustment factor
   */
  async calculateRateAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to calculate rate adjustment', { query: req.query, body: req.body });

    try {
      // Extract originRegion, destinationRegion, and equipmentType from query parameters
      const { originRegion, destinationRegion, equipmentType } = req.query;

      // Extract options from request body
      const options = req.body;

      // Validate that the required parameters are present
      if (!originRegion || !destinationRegion || !equipmentType) {
        logger.error('Missing required parameters for calculateRateAdjustment', { query: req.query, body: req.body });
        return next(createError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT }));
      }

      // Call rateService.calculateRateAdjustment() with the extracted parameters
      const adjustmentFactor = await this.rateService.calculateRateAdjustment(
        String(originRegion),
        String(destinationRegion),
        equipmentType as EquipmentType,
        options
      );

      // Log the successful calculation of the adjustment factor
      logger.info('Rate adjustment factor calculated successfully', { adjustmentFactor });

      // Return the adjustment factor data in the response
      res.status(StatusCodes.OK).json(adjustmentFactor);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in calculateRateAdjustment', { error });
      next(error);
    }
  }

  /**
   * Handles requests to synchronize market rates from external sources to the database
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with synchronization results
   */
  async syncMarketRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to sync market rates');

    try {
      // Call rateService.syncMarketRates() to perform the synchronization
      const syncResult = await this.rateService.syncMarketRates();

      // Log the successful synchronization of market rates
      logger.info('Market rates synchronized successfully', { syncResult });

      // Return the synchronization results in the response
      res.status(StatusCodes.OK).json(syncResult);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in syncMarketRates', { error });
      next(error);
    }
  }

  /**
   * Handles requests to create a new market rate record in the database
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with created market rate data
   */
  async createMarketRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to create market rate', { body: req.body });

    try {
      // Extract rate data from request body
      const rateData = req.body;

      // Call rateService.createMarketRate() with the rate data
      const createdRate = await this.rateService.createMarketRate(rateData);

      // Log the successful creation of the market rate
      logger.info('Market rate created successfully', { rateId: createdRate.rate_id });

      // Return the created market rate data in the response with 201 status code
      res.status(StatusCodes.CREATED).json(createdRate);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in createMarketRate', { error });
      next(error);
    }
  }

  /**
   * Handles requests to update an existing market rate record in the database
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with updated market rate data
   */
  async updateMarketRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to update market rate', { params: req.params, body: req.body });

    try {
      // Extract rateId from request parameters
      const { rateId } = req.params;

      // Extract rate data from request body
      const rateData = req.body;

      // Call rateService.updateMarketRate() with the rateId and rate data
      const updatedRate = await this.rateService.updateMarketRate(rateId, rateData);

      // Log the successful update of the market rate
      logger.info('Market rate updated successfully', { rateId: updatedRate.rate_id });

      // Return the updated market rate data in the response
      res.status(StatusCodes.OK).json(updatedRate);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in updateMarketRate', { error });
      next(error);
    }
  }

  /**
   * Handles requests to retrieve market rates with optional filtering and pagination
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Sends JSON response with market rates and total count
   */
  async getMarketRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Log the incoming request
    logger.info('Received request to get market rates', { query: req.query });

    try {
      // Extract filter parameters from query parameters
      const filters = {
        originRegion: req.query.originRegion ? String(req.query.originRegion) : undefined,
        destinationRegion: req.query.destinationRegion ? String(req.query.destinationRegion) : undefined,
        equipmentType: req.query.equipmentType ? (req.query.equipmentType as EquipmentType) : undefined,
        startDate: req.query.startDate ? new Date(String(req.query.startDate)) : undefined,
        endDate: req.query.endDate ? new Date(String(req.query.endDate)) : undefined,
      };

      // Extract pagination parameters from query parameters
      const pagination = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
        sortDirection: req.query.sortDirection === 'ASC' || req.query.sortDirection === 'DESC' ? req.query.sortDirection : undefined,
      };

      // Call rateService.getMarketRates() with the filters and pagination
      const result = await this.rateService.getMarketRates(filters, pagination);

      // Log the successful retrieval of the market rates
      logger.info('Market rates retrieved successfully', { total: result.total, returned: result.rates.length });

      // Return the market rates and total count in the response
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      // Handle any errors with the next() function
      logger.error('Error in getMarketRates', { error });
      next(error);
    }
  }

  /**
   * Returns Joi validation schemas for request validation middleware
   * @returns object Object containing validation schemas for different endpoints
   */
  getValidationSchemas() {
    return {
      getMarketRate: {
        query: Joi.object({
          originRegion: Joi.string().required(),
          destinationRegion: Joi.string().required(),
          equipmentType: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED).required(),
        }),
      },
      getHistoricalRates: {
        query: Joi.object({
          originRegion: Joi.string().required(),
          destinationRegion: Joi.string().required(),
          equipmentType: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED).required(),
          startDate: Joi.date().iso().required(),
          endDate: Joi.date().iso().required(),
        }),
      },
      calculateRate: {
        query: Joi.object({
          originRegion: Joi.string().required(),
          destinationRegion: Joi.string().required(),
          equipmentType: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED).required(),
        }),
        body: Joi.object().required(), // Define specific schema for options if needed
      },
      calculateLoadRate: {
        body: Joi.object().required(), // Define specific schema for load data if needed
      },
      analyzeRateTrends: {
        query: Joi.object({
          originRegion: Joi.string().required(),
          destinationRegion: Joi.string().required(),
          equipmentType: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED).required(),
          days: Joi.number().integer().min(1).max(365).required(),
        }),
      },
      getSupplyDemandRatio: {
        query: Joi.object({
          originRegion: Joi.string().required(),
          destinationRegion: Joi.string().required(),
          equipmentType: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED).required(),
        }),
      },
      calculateRateAdjustment: {
        query: Joi.object({
          originRegion: Joi.string().required(),
          destinationRegion: Joi.string().required(),
          equipmentType: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED).required(),
        }),
        body: Joi.object().required(), // Define specific schema for options if needed
      },
      createMarketRate: {
        body: Joi.object({
          origin_region: Joi.string().required(),
          destination_region: Joi.string().required(),
          equipment_type: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED).required(),
          average_rate: Joi.number().required(),
          min_rate: Joi.number().required(),
          max_rate: Joi.number().required(),
          sample_size: Joi.number().integer().min(1).default(10),
          recorded_at: Joi.date().iso().default(() => new Date()),
        }).required(),
      },
      updateMarketRate: {
        params: Joi.object({
          rateId: Joi.string().uuid().required(),
        }),
        body: Joi.object({
          origin_region: Joi.string(),
          destination_region: Joi.string(),
          equipment_type: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED),
          average_rate: Joi.number(),
          min_rate: Joi.number(),
          max_rate: Joi.number(),
          sample_size: Joi.number().integer().min(1),
          recorded_at: Joi.date().iso(),
        }).min(1).required(),
      },
      getMarketRates: {
        query: Joi.object({
          originRegion: Joi.string(),
          destinationRegion: Joi.string(),
          equipmentType: Joi.string().valid(EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REFRIGERATED),
          startDate: Joi.date().iso(),
          endDate: Joi.date().iso(),
          page: Joi.number().integer().min(1),
          limit: Joi.number().integer().min(1).max(100),
          sortBy: Joi.string().valid('recorded_at', 'average_rate', 'origin_region', 'destination_region'),
          sortDirection: Joi.string().valid('ASC', 'DESC'),
        }),
      },
    };
  }
}