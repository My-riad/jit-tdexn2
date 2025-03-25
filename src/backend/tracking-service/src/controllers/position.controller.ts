import { Request, Response, NextFunction } from 'express'; // express@^4.17.1
import { PositionService } from '../services/position.service';
import { EntityType, Position, PositionUpdate, NearbyQuery, EntityPosition } from '../../common/interfaces/position.interface';
import { AppError } from '../../common/utils/error-handler';
import { ErrorCodes } from '../../common/constants/error-codes';
import { StatusCodes } from '../../common/constants/status-codes';
import logger from '../../common/utils/logger';

/**
 * Controller class that handles HTTP requests for position-related operations
 */
export class PositionController {
  positionService: PositionService;

  /**
   * Creates a new PositionController instance
   * @param positionService - The position service to use for position-related operations
   */
  constructor(positionService: PositionService) {
    // Initialize the position service instance
    this.positionService = positionService;

    // Log the initialization of the position controller
    logger.info('Position controller initialized');
  }

  /**
   * Updates the position of an entity
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async updatePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract position update data from request body
      const positionUpdate: PositionUpdate = req.body;

      // Call positionService.updatePosition with the update data
      const updatedPosition: Position | null = await this.positionService.updatePosition(positionUpdate);

      // If successful, return 200 OK with the updated position
      if (updatedPosition) {
        res.status(StatusCodes.OK).json(updatedPosition);
        return;
      }

      // If position not found, return 404 Not Found
      next(new AppError('Position not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND }));
    } catch (error) {
      // Log the error
      logger.error('Error updating position', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }

  /**
   * Updates positions for multiple entities in a single request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async bulkUpdatePositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract array of position updates from request body
      const positionUpdates: PositionUpdate[] = req.body;

      // Validate that the input is an array
      if (!Array.isArray(positionUpdates)) {
        throw new AppError('Request body must be an array of position updates', { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST });
      }

      // Call positionService.bulkUpdatePositions with the updates array
      const updatedPositions: Position[] = await this.positionService.bulkUpdatePositions(positionUpdates);

      // If successful, return 200 OK with the array of updated positions
      res.status(StatusCodes.OK).json(updatedPositions);
    } catch (error) {
      // Log the error
      logger.error('Error bulk updating positions', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }

  /**
   * Gets the current position for a specific entity
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async getCurrentPosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity_id and entity_type from request parameters
      const entityId: string = req.params.entity_id;
      const entityType: EntityType = req.params.entity_type as EntityType;

      // Call positionService.getCurrentPosition with the entity information
      const position: Position | null = await this.positionService.getCurrentPosition(entityId, entityType);

      // If position found, return 200 OK with the position data
      if (position) {
        res.status(StatusCodes.OK).json(position);
        return;
      }

      // If position not found, return 404 Not Found
      next(new AppError('Position not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND }));
    } catch (error) {
      // Log the error
      logger.error('Error getting current position', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }

  /**
   * Gets historical positions for an entity within a time range
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async getPositionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity_id and entity_type from request parameters
      const entityId: string = req.params.entity_id;
      const entityType: EntityType = req.params.entity_type as EntityType;

      // Extract startTime, endTime, limit, and offset from query parameters
      const startTime: Date = new Date(req.query.startTime as string);
      const endTime: Date = new Date(req.query.endTime as string);
      const limit: number = parseInt(req.query.limit as string, 10) || undefined;
      const offset: number = parseInt(req.query.offset as string, 10) || undefined;

      // Call positionService.getPositionHistory with the parameters
      const positions: Position[] = await this.positionService.getPositionHistory(entityId, entityType, startTime, endTime, { limit, offset });

      // If successful, return 200 OK with the array of historical positions
      res.status(StatusCodes.OK).json(positions);
    } catch (error) {
      // Log the error
      logger.error('Error getting position history', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }
  
  /**
   * Gets a simplified trajectory for an entity within a time range
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async getTrajectory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
          // Extract entity_id and entity_type from request parameters
          const entityId: string = req.params.entity_id;
          const entityType: EntityType = req.params.entity_type as EntityType;

          // Extract startTime, endTime, and simplificationFactor from query parameters
          const startTime: Date = new Date(req.query.startTime as string);
          const endTime: Date = new Date(req.query.endTime as string);
          const simplificationFactor: number = parseFloat(req.query.simplificationFactor as string) || 0.5;

          // Call positionService.getPositionHistory with the parameters
          const positions: Position[] = await this.positionService.getPositionHistory(entityId, entityType, startTime, endTime, {});

          // Apply trajectory simplification algorithm to reduce data points
          // TODO: Implement trajectory simplification algorithm
          const simplifiedTrajectory = positions; // Placeholder

          // If successful, return 200 OK with the simplified trajectory
          res.status(StatusCodes.OK).json(simplifiedTrajectory);
      } catch (error) {
          // Log the error
          logger.error('Error getting trajectory', { error });

          // If validation error, return 400 Bad Request
          if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
              next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
              return;
          }

          // If other error, pass to error handling middleware
          next(error);
      }
  }

  /**
   * Finds entities near a specific location
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async findNearbyEntities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract latitude, longitude, radius, entity_type, and limit from query parameters
      const latitude: number = parseFloat(req.query.latitude as string);
      const longitude: number = parseFloat(req.query.longitude as string);
      const radius: number = parseFloat(req.query.radius as string);
      const entityType: EntityType = req.query.entity_type as EntityType;
      const limit: number = parseInt(req.query.limit as string, 10) || undefined;

      // Create a NearbyQuery object with the parameters
      const query: NearbyQuery = {
        latitude,
        longitude,
        radius,
        entity_type: entityType,
        limit
      };

      // Call positionService.getNearbyEntities with the query
      const nearbyEntities: EntityPosition[] = await this.positionService.getNearbyEntities(query);

      // If successful, return 200 OK with the array of nearby entities
      res.status(StatusCodes.OK).json(nearbyEntities);
    } catch (error) {
      // Log the error
      logger.error('Error finding nearby entities', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }

  /**
   * Calculates the total distance traveled by an entity within a time range
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async calculateTraveledDistance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity_id and entity_type from request parameters
      const entityId: string = req.params.entity_id;
      const entityType: EntityType = req.params.entity_type as EntityType;

      // Extract startTime and endTime from query parameters
      const startTime: Date = new Date(req.query.startTime as string);
      const endTime: Date = new Date(req.query.endTime as string);

      // Call positionService.getPositionHistory with the parameters
      const distance: number | null = await this.positionService.calculateDistance(entityId, entityType, startTime, endTime);

      // If successful, return 200 OK with the total distance in kilometers
      if (distance !== null) {
        res.status(StatusCodes.OK).json({ distance_km: distance });
        return;
      }

      // If no positions found, return 200 OK with distance of 0
      res.status(StatusCodes.OK).json({ distance_km: 0 });
    } catch (error) {
      // Log the error
      logger.error('Error calculating traveled distance', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }

  /**
   * Calculates the average speed of an entity within a time range
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async calculateAverageSpeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity_id and entity_type from request parameters
      const entityId: string = req.params.entity_id;
      const entityType: EntityType = req.params.entity_type as EntityType;

      // Extract startTime and endTime from query parameters
      const startTime: Date = new Date(req.query.startTime as string);
      const endTime: Date = new Date(req.query.endTime as string);

      // Call positionService.getPositionHistory with the parameters
      const speed: number | null = await this.positionService.calculateAverageSpeed(entityId, entityType, startTime, endTime);

      // If successful, return 200 OK with the average speed in km/h
      if (speed !== null) {
        res.status(StatusCodes.OK).json({ average_speed_kmh: speed });
        return;
      }

      // If insufficient data, return 200 OK with speed of 0
      res.status(StatusCodes.OK).json({ average_speed_kmh: 0 });
    } catch (error) {
      // Log the error
      logger.error('Error calculating average speed', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }

  /**
   * Calculates the distance between two entities or an entity and coordinates
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async calculateDistanceBetween(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity_id1 and entity_type1 from request parameters
      const entityId1: string = req.params.entity_id;
      const entityType1: EntityType = req.params.entity_type as EntityType;

      // Extract entity_id2 and entity_type2 or latitude and longitude from query parameters
      const entityId2OrLatitude: string | number = req.query.entityId2 || parseFloat(req.query.latitude as string);
      const entityType2OrLongitude: EntityType | number = req.query.entityType2 as EntityType || parseFloat(req.query.longitude as string);

      // Call positionService.calculateDistance with the parameters
      const distance: number | null = await this.positionService.calculateDistance(entityId1, entityType1, entityId2OrLatitude, entityType2OrLongitude);

      // If successful, return 200 OK with the distance in kilometers
      if (distance !== null) {
        res.status(StatusCodes.OK).json({ distance_km: distance });
        return;
      }

      // If entities not found, return 404 Not Found
      next(new AppError('One or both entities not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND }));
    } catch (error) {
      // Log the error
      logger.error('Error calculating distance between entities', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }

  /**
   * Deletes the position record for an entity
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - Promise that resolves when the response is sent
   */
  async deletePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entity_id and entity_type from request parameters
      const entityId: string = req.params.entity_id;
      const entityType: EntityType = req.params.entity_type as EntityType;

      // Call positionService.deletePosition with the entity information
      const deleted: boolean = await this.positionService.deletePosition(entityId, entityType);

      // If successful, return 200 OK with success message
      if (deleted) {
        res.status(StatusCodes.OK).json({ message: 'Position deleted successfully' });
        return;
      }

      // If position not found, return 404 Not Found
      next(new AppError('Position not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND }));
    } catch (error) {
      // Log the error
      logger.error('Error deleting position', { error });

      // If validation error, return 400 Bad Request
      if (error instanceof AppError && error.code === ErrorCodes.VAL_INVALID_INPUT) {
        next(new AppError(error.message, { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST, details: error.details }));
        return;
      }

      // If other error, pass to error handling middleware
      next(error);
    }
  }
}