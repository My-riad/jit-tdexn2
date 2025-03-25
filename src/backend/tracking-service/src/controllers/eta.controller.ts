import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { ETAService } from '../services/eta.service';
import { EntityType } from '../../common/interfaces/position.interface';
import logger from '../../common/utils/logger';
import { createError } from '../../common/utils/error-handler';
import { StatusCodes } from '../../common/constants/status-codes';
import { ErrorCodes } from '../../common/constants/error-codes';

/**
 * Controller class that handles HTTP requests for ETA calculations
 */
export class ETAController {
  private ETAService: ETAService;

  /**
   * Creates a new ETAController instance with the provided ETAService
   * @param etaService - The ETAService instance to use for ETA calculations
   */
  constructor(etaService: ETAService) {
    this.ETAService = etaService;
    logger.info('ETA controller initialized');
  }

  /**
   * Handles requests for ETA calculations for a single entity to a destination
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getETA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity ID and type from request parameters
      const { entityId } = req.params;
      const entityType = req.params.entityType as EntityType;

      // Extract destination coordinates from query parameters
      const destLatitude = parseFloat(req.query.latitude as string);
      const destLongitude = parseFloat(req.query.longitude as string);

      // Validate input parameters
      if (!entityId) {
        throw createError('Entity ID is required', ErrorCodes.VAL_MISSING_FIELD, StatusCodes.BAD_REQUEST);
      }

      if (!entityType) {
        throw createError('Entity Type is required', ErrorCodes.TRACKING_INVALID_ENTITY_TYPE, StatusCodes.BAD_REQUEST);
      }

      if (isNaN(destLatitude) || isNaN(destLongitude)) {
        throw createError('Invalid latitude or longitude', ErrorCodes.TRACKING_INVALID_COORDINATES, StatusCodes.BAD_REQUEST);
      }

      // Extract optional parameters
      const includeTraffic = req.query.includeTraffic === 'true';
      const useHistoricalData = req.query.useHistoricalData === 'true';
      const adjustForDriverBehavior = req.query.adjustForDriverBehavior === 'true';

      // Call etaService.getETA with the extracted parameters
      const etaResult = await this.ETAService.getETA(
        entityId,
        entityType,
        destLatitude,
        destLongitude,
        { includeTraffic, useHistoricalData, adjustForDriverBehavior }
      );

      // Return the ETA result as JSON response
      res.status(StatusCodes.OK).json(etaResult);
    } catch (error) {
      // Handle errors with appropriate status codes and error messages
      logger.error('Error calculating ETA', { error });
      next(error);
    }
  }

  /**
   * Handles requests for ETA calculations using actual route information
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getETAWithRouteInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity ID and type from request parameters
      const { entityId } = req.params;
      const entityType = req.params.entityType as EntityType;

      // Extract destination coordinates and route points from request body
      const { latitude: destLatitude, longitude: destLongitude, routePoints } = req.body;

      // Validate input parameters
      if (!entityId) {
        throw createError('Entity ID is required', ErrorCodes.VAL_MISSING_FIELD, StatusCodes.BAD_REQUEST);
      }

      if (!entityType) {
        throw createError('Entity Type is required', ErrorCodes.TRACKING_INVALID_ENTITY_TYPE, StatusCodes.BAD_REQUEST);
      }

      if (isNaN(destLatitude) || isNaN(destLongitude)) {
        throw createError('Invalid latitude or longitude', ErrorCodes.TRACKING_INVALID_COORDINATES, StatusCodes.BAD_REQUEST);
      }

      if (!Array.isArray(routePoints)) {
        throw createError('Route points must be an array', ErrorCodes.VAL_INVALID_INPUT, StatusCodes.BAD_REQUEST);
      }

      // Extract optional parameters
      const includeTraffic = req.query.includeTraffic === 'true';
      const useHistoricalData = req.query.useHistoricalData === 'true';
      const adjustForDriverBehavior = req.query.adjustForDriverBehavior === 'true';

      // Call etaService.getETAWithRouteInfo with the extracted parameters
      const etaResult = await this.ETAService.getETAWithRouteInfo(
        entityId,
        entityType,
        destLatitude,
        destLongitude,
        routePoints,
        { includeTraffic, useHistoricalData, adjustForDriverBehavior }
      );

      // Return the route-based ETA result as JSON response
      res.status(StatusCodes.OK).json(etaResult);
    } catch (error) {
      // Handle errors with appropriate status codes and error messages
      logger.error('Error calculating ETA with route info', { error });
      next(error);
    }
  }

  /**
   * Handles requests for ETA calculations for multiple entities to the same destination
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getETAForMultipleEntities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity IDs array and entity type from request body
      const { entityIds, entityType, latitude: destLatitude, longitude: destLongitude } = req.body;

      // Validate input parameters
      if (!Array.isArray(entityIds) || entityIds.length === 0) {
        throw createError('Entity IDs array is required', ErrorCodes.VAL_MISSING_FIELD, StatusCodes.BAD_REQUEST);
      }

      if (!entityType) {
        throw createError('Entity Type is required', ErrorCodes.TRACKING_INVALID_ENTITY_TYPE, StatusCodes.BAD_REQUEST);
      }

      if (isNaN(destLatitude) || isNaN(destLongitude)) {
        throw createError('Invalid latitude or longitude', ErrorCodes.TRACKING_INVALID_COORDINATES, StatusCodes.BAD_REQUEST);
      }

      // Extract optional parameters
      const includeTraffic = req.query.includeTraffic === 'true';
      const useHistoricalData = req.query.useHistoricalData === 'true';
      const adjustForDriverBehavior = req.query.adjustForDriverBehavior === 'true';

      // Call etaService.getETAForMultipleEntities with the extracted parameters
      const etaResults = await this.ETAService.getETAForMultipleEntities(
        entityIds,
        entityType,
        destLatitude,
        destLongitude,
        { includeTraffic, useHistoricalData, adjustForDriverBehavior }
      );

      // Return the array of ETA results as JSON response
      res.status(StatusCodes.OK).json(etaResults);
    } catch (error) {
      // Handle errors with appropriate status codes and error messages
      logger.error('Error calculating ETAs for multiple entities', { error });
      next(error);
    }
  }

  /**
   * Handles requests for ETA calculations for a single entity to multiple destinations
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getETAToMultipleDestinations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity ID and type from request parameters
      const { entityId } = req.params;
      const entityType = req.params.entityType as EntityType;

      // Extract destinations array from request body
      const { destinations } = req.body;

      // Validate input parameters
      if (!entityId) {
        throw createError('Entity ID is required', ErrorCodes.VAL_MISSING_FIELD, StatusCodes.BAD_REQUEST);
      }

      if (!entityType) {
        throw createError('Entity Type is required', ErrorCodes.TRACKING_INVALID_ENTITY_TYPE, StatusCodes.BAD_REQUEST);
      }

      if (!Array.isArray(destinations) || destinations.length === 0) {
        throw createError('Destinations array is required', ErrorCodes.VAL_MISSING_FIELD, StatusCodes.BAD_REQUEST);
      }

      // Extract optional parameters
      const includeTraffic = req.query.includeTraffic === 'true';
      const useHistoricalData = req.query.useHistoricalData === 'true';
      const adjustForDriverBehavior = req.query.adjustForDriverBehavior === 'true';

      // Call etaService.getETAToMultipleDestinations with the extracted parameters
      const etaResults = await this.ETAService.getETAToMultipleDestinations(
        entityId,
        entityType,
        destinations,
        { includeTraffic, useHistoricalData, adjustForDriverBehavior }
      );

      // Return the array of ETA results as JSON response
      res.status(StatusCodes.OK).json(etaResults);
    } catch (error) {
      // Handle errors with appropriate status codes and error messages
      logger.error('Error calculating ETAs to multiple destinations', { error });
      next(error);
    }
  }

  /**
   * Handles requests for calculating the remaining distance to a destination
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getRemainingDistance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity ID and type from request parameters
      const { entityId } = req.params;
      const entityType = req.params.entityType as EntityType;

      // Extract destination coordinates from query parameters
      const destLatitude = parseFloat(req.query.latitude as string);
      const destLongitude = parseFloat(req.query.longitude as string);

      // Extract optional route points array from request body
      const { routePoints } = req.body;

      // Validate input parameters
      if (!entityId) {
        throw createError('Entity ID is required', ErrorCodes.VAL_MISSING_FIELD, StatusCodes.BAD_REQUEST);
      }

      if (!entityType) {
        throw createError('Entity Type is required', ErrorCodes.TRACKING_INVALID_ENTITY_TYPE, StatusCodes.BAD_REQUEST);
      }

      if (isNaN(destLatitude) || isNaN(destLongitude)) {
        throw createError('Invalid latitude or longitude', ErrorCodes.TRACKING_INVALID_COORDINATES, StatusCodes.BAD_REQUEST);
      }

      // Call etaService.getRemainingDistance with the extracted parameters
      const remainingDistance = await this.ETAService.getRemainingDistance(
        entityId,
        entityType,
        destLatitude,
        destLongitude,
        routePoints
      );

      // Return the remaining distance as JSON response
      res.status(StatusCodes.OK).json({ remainingDistance });
    } catch (error) {
      // Handle errors with appropriate status codes and error messages
      logger.error('Error calculating remaining distance', { error });
      next(error);
    }
  }

  /**
   * Handles requests to invalidate cached ETA results for an entity
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async invalidateETACache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity ID and type from request parameters
      const { entityId } = req.params;
      const entityType = req.params.entityType as EntityType;

      // Validate input parameters
      if (!entityId) {
        throw createError('Entity ID is required', ErrorCodes.VAL_MISSING_FIELD, StatusCodes.BAD_REQUEST);
      }

      if (!entityType) {
        throw createError('Entity Type is required', ErrorCodes.TRACKING_INVALID_ENTITY_TYPE, StatusCodes.BAD_REQUEST);
      }

      // Call etaService.invalidateETACache with the entity ID and type
      await this.ETAService.invalidateETACache(entityId, entityType);

      // Return success message as JSON response
      res.status(StatusCodes.OK).json({ message: 'ETA cache invalidated successfully' });
    } catch (error) {
      // Handle errors with appropriate status codes and error messages
      logger.error('Error invalidating ETA cache', { error });
      next(error);
    }
  }
}