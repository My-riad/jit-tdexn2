import { Request, Response, NextFunction } from 'express'; //  ^4.18.2
import Joi from 'joi'; //  ^17.9.2

import { HistoricalPositionModel } from '../models/historical-position.model';
import { PositionService } from '../services/position.service';
import { ETAService } from '../services/eta.service';
import { EntityType } from '../../common/interfaces/position.interface';
import { validateQuery } from '../../common/middleware/validation.middleware';
import { AppError } from '../../common/utils/error-handler';
import logger from '../../common/utils/logger';

/**
 * Controller class that handles historical position data requests
 */
export class HistoryController {
  /**
   * Initializes the position service for retrieving position history
   */
  private positionService: PositionService;
  /**
   * Initializes the ETA service for distance calculations
   */
  private etaService: ETAService;

  /**
   * Creates a new HistoryController instance with required services
   * @param positionService 
   * @param etaService 
   */
  constructor(positionService: PositionService, etaService: ETAService) {
    this.positionService = positionService;
    this.etaService = etaService;
    logger.info('HistoryController initialized');
  }

  /**
   * Retrieves historical position data for a specific entity within a time range
   * @param req 
   * @param res 
   * @param next 
   */
  async getPositionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityId, entityType, startTime, endTime, limit, offset from request query parameters
      const { entityId, entityType, startTime, endTime, limit, offset } = req.query;

      // Convert entityType string to EntityType enum value
      const entityTypeEnum = entityType as EntityType;

      // Parse startTime and endTime strings to Date objects
      const startTimeDate = new Date(startTime as string);
      const endTimeDate = new Date(endTime as string);

      // Call positionService.getPositionHistory with the parameters
      const positions = await this.positionService.getPositionHistory(
        entityId as string,
        entityTypeEnum,
        startTimeDate,
        endTimeDate,
        {
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined
        }
      );

      // Return the historical positions as JSON response
      res.json(positions);
    } catch (error) {
      // Handle errors with next(error) for error middleware processing
      next(error);
    }
  }

  /**
   * Retrieves a simplified trajectory for an entity as a GeoJSON LineString
   * @param req 
   * @param res 
   * @param next 
   */
  async getTrajectory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityId, entityType, startTime, endTime, simplificationTolerance from request query parameters
      const { entityId, entityType, startTime, endTime, simplificationTolerance } = req.query;

      // Convert entityType string to EntityType enum value
      const entityTypeEnum = entityType as EntityType;

      // Parse startTime and endTime strings to Date objects
      const startTimeDate = new Date(startTime as string);
      const endTimeDate = new Date(endTime as string);

      // Call HistoricalPositionModel.getTrajectory with the parameters
      const trajectory = await HistoricalPositionModel.getTrajectory(
        entityId as string,
        entityTypeEnum,
        startTimeDate,
        endTimeDate,
        simplificationTolerance ? parseFloat(simplificationTolerance as string) : undefined
      );

      // Return the trajectory as GeoJSON response
      res.json(trajectory);
    } catch (error) {
      // Handle errors with next(error) for error middleware processing
      next(error);
    }
  }

  /**
   * Calculates the total distance traveled by an entity within a time range
   * @param req 
   * @param res 
   * @param next 
   */
  async calculateDistance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityId, entityType, startTime, endTime from request query parameters
      const { entityId, entityType, startTime, endTime } = req.query;

      // Convert entityType string to EntityType enum value
      const entityTypeEnum = entityType as EntityType;

      // Parse startTime and endTime strings to Date objects
      const startTimeDate = new Date(startTime as string);
      const endTimeDate = new Date(endTime as string);

      // Call HistoricalPositionModel.calculateDistance with the parameters
      const distance = await HistoricalPositionModel.calculateDistance(
        entityId as string,
        entityTypeEnum,
        startTimeDate,
        endTimeDate
      );

      // Return the calculated distance as JSON response
      res.json({ distance });
    } catch (error) {
      // Handle errors with next(error) for error middleware processing
      next(error);
    }
  }

  /**
   * Calculates the average speed of an entity within a time range
   * @param req 
   * @param res 
   * @param next 
   */
  async calculateAverageSpeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityId, entityType, startTime, endTime from request query parameters
      const { entityId, entityType, startTime, endTime } = req.query;

      // Convert entityType string to EntityType enum value
      const entityTypeEnum = entityType as EntityType;

      // Parse startTime and endTime strings to Date objects
      const startTimeDate = new Date(startTime as string);
      const endTimeDate = new Date(endTime as string);

      // Call HistoricalPositionModel.calculateAverageSpeed with the parameters
      const averageSpeed = await HistoricalPositionModel.calculateAverageSpeed(
        entityId as string,
        entityTypeEnum,
        startTimeDate,
        endTimeDate
      );

      // Return the calculated average speed as JSON response
      res.json({ averageSpeed });
    } catch (error) {
      // Handle errors with next(error) for error middleware processing
      next(error);
    }
  }

  /**
   * Generates heatmap data based on position density for visualization
   * @param req 
   * @param res 
   * @param next 
   */
  async getHeatmapData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityType, startTime, endTime, boundingBox from request query parameters
      const { entityType, startTime, endTime, boundingBox } = req.query;

      // Convert entityType string to EntityType enum value
      const entityTypeEnum = entityType as EntityType;

      // Parse startTime and endTime strings to Date objects
      const startTimeDate = new Date(startTime as string);
      const endTimeDate = new Date(endTime as string);

      // Parse boundingBox string to bounding box object with coordinates
      const boundingBoxObj = JSON.parse(boundingBox as string);

      // Call HistoricalPositionModel.getHeatmapData with the parameters
      const heatmapData = await HistoricalPositionModel.getHeatmapData(
        entityTypeEnum,
        startTimeDate,
        endTimeDate,
        boundingBoxObj
      );

      // Return the heatmap data as JSON response
      res.json(heatmapData);
    } catch (error) {
      // Handle errors with next(error) for error middleware processing
      next(error);
    }
  }

  /**
   * Identifies common routes taken by entities for pattern analysis
   * @param req 
   * @param res 
   * @param next 
   */
  async findCommonRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityType, startTime, endTime, similarityThreshold from request query parameters
      const { entityType, startTime, endTime, similarityThreshold } = req.query;

      // Convert entityType string to EntityType enum value
      const entityTypeEnum = entityType as EntityType;

      // Parse startTime and endTime strings to Date objects
      const startTimeDate = new Date(startTime as string);
      const endTimeDate = new Date(endTime as string);

      // Parse similarityThreshold string to number
      const similarityThresholdNum = parseFloat(similarityThreshold as string);

      // Call HistoricalPositionModel.findCommonRoutes with the parameters
      const commonRoutes = await HistoricalPositionModel.findCommonRoutes(
        entityTypeEnum,
        startTimeDate,
        endTimeDate,
        similarityThresholdNum
      );

      // Return the common routes data as JSON response
      res.json(commonRoutes);
    } catch (error) {
      // Handle errors with next(error) for error middleware processing
      next(error);
    }
  }

  /**
   * Calculates the remaining distance to a destination for an entity
   * @param req 
   * @param res 
   * @param next 
   */
  async getRemainingDistance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityId, entityType, destLatitude, destLongitude, routePoints from request query parameters
      const { entityId, entityType, destLatitude, destLongitude, routePoints } = req.query;

      // Convert entityType string to EntityType enum value
      const entityTypeEnum = entityType as EntityType;

      // Parse destLatitude and destLongitude strings to numbers
      const destLatitudeNum = parseFloat(destLatitude as string);
      const destLongitudeNum = parseFloat(destLongitude as string);

      let routePointsArray: Array<{ latitude: number; longitude: number }> | undefined = undefined;

      // Parse routePoints string to array of coordinates if provided
      if (routePoints) {
        try {
          routePointsArray = JSON.parse(routePoints as string);
        } catch (err) {
          throw new AppError('Invalid routePoints format. Must be a valid JSON array of {latitude, longitude} objects.', { code: 'VAL_INVALID_INPUT' });
        }
      }

      // Call etaService.getRemainingDistance with the parameters
      const remainingDistance = await this.etaService.getRemainingDistance(
        entityId as string,
        entityTypeEnum,
        destLatitudeNum,
        destLongitudeNum,
        routePointsArray
      );

      // Return the remaining distance as JSON response
      res.json({ remainingDistance });
    } catch (error) {
      // Handle errors with next(error) for error middleware processing
      next(error);
    }
  }
}

/**
 * Joi validation schema for history endpoint query parameters
 */
export const historyQuerySchema = Joi.object({
  entityId: Joi.string().uuid().required(),
  entityType: Joi.string().valid(EntityType.DRIVER, EntityType.VEHICLE).required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  limit: Joi.number().integer().min(1).max(1000).optional(),
  offset: Joi.number().integer().min(0).optional()
});

/**
 * Joi validation schema for trajectory endpoint query parameters
 */
export const trajectoryQuerySchema = Joi.object({
  entityId: Joi.string().uuid().required(),
  entityType: Joi.string().valid(EntityType.DRIVER, EntityType.VEHICLE).required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  simplificationTolerance: Joi.number().min(0).max(1).optional()
});

/**
 * Joi validation schema for heatmap endpoint query parameters
 */
export const heatmapQuerySchema = Joi.object({
  entityType: Joi.string().valid(EntityType.DRIVER, EntityType.VEHICLE).required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  boundingBox: Joi.string().required() // Expecting a JSON string
});

/**
 * Joi validation schema for common routes endpoint query parameters
 */
export const commonRoutesQuerySchema = Joi.object({
  entityType: Joi.string().valid(EntityType.DRIVER, EntityType.VEHICLE).required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  similarityThreshold: Joi.number().min(0).max(1).optional()
});

/**
 * Joi validation schema for remaining distance endpoint query parameters
 */
export const remainingDistanceQuerySchema = Joi.object({
  entityId: Joi.string().uuid().required(),
  entityType: Joi.string().valid(EntityType.DRIVER, EntityType.VEHICLE).required(),
  destLatitude: Joi.number().min(-90).max(90).required(),
  destLongitude: Joi.number().min(-180).max(180).required(),
  routePoints: Joi.string().optional() // Expecting a JSON string
});