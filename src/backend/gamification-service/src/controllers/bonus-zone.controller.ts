import { Request, Response, NextFunction } from 'express'; // express ^4.18.2
import { BonusZoneService } from '../services/bonus-zone.service';
import BonusZoneModel from '../models/bonus-zone.model';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';
import { Position } from '../../../common/interfaces/position.interface';

/**
 * Controller class for handling bonus zone-related HTTP requests
 */
export default class BonusZoneController {
  private bonusZoneService: BonusZoneService;

  /**
   * Initializes a new BonusZoneController instance
   * @param bonusZoneService - The BonusZoneService instance to use
   */
  constructor(bonusZoneService: BonusZoneService) {
    this.bonusZoneService = bonusZoneService;

    // Bind all class methods to this instance to maintain proper context
    this.createBonusZone = this.createBonusZone.bind(this);
    this.createCircularBonusZone = this.createCircularBonusZone.bind(this);
    this.getBonusZone = this.getBonusZone.bind(this);
    this.getAllBonusZones = this.getAllBonusZones.bind(this);
    this.getActiveBonusZones = this.getActiveBonusZones.bind(this);
    this.updateBonusZone = this.updateBonusZone.bind(this);
    this.deactivateBonusZone = this.deactivateBonusZone.bind(this);
    this.deleteBonusZone = this.deleteBonusZone.bind(this);
    this.checkPositionInBonusZone = this.checkPositionInBonusZone.bind(this);
    this.getBonusZonesInRadius = this.getBonusZonesInRadius.bind(this);
    this.createDriverBonus = this.createDriverBonus.bind(this);
    this.getDriverBonusesForZone = this.getDriverBonusesForZone.bind(this);
  }

  /**
   * Creates a new bonus zone
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async createBonusZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract bonus zone data from request body
      const zoneData = req.body;

      // Call bonusZoneService.createBonusZone with the data
      const newBonusZone = await this.bonusZoneService.createBonusZone(zoneData);

      // Return 201 Created response with the created bonus zone
      res.status(StatusCodes.CREATED).json(newBonusZone);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error creating bonus zone', { error });
      next(error);
    }
  }

  /**
   * Creates a circular bonus zone around a center point
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async createCircularBonusZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract center coordinates, radius, and other parameters from request body
      const { name, centerLat, centerLng, radiusKm, multiplier, reason, startTime, endTime } = req.body;

      // Call bonusZoneService.createCircularBonusZone with the parameters
      const newBonusZone = await this.bonusZoneService.createCircularBonusZone(
        name,
        centerLat,
        centerLng,
        radiusKm,
        multiplier,
        reason,
        startTime,
        endTime
      );

      // Return 201 Created response with the created circular bonus zone
      res.status(StatusCodes.CREATED).json(newBonusZone);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error creating circular bonus zone', { error });
      next(error);
    }
  }

  /**
   * Retrieves a bonus zone by its ID
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getBonusZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract zone ID from request parameters
      const { id } = req.params;

      // Call bonusZoneService.getBonusZone with the ID
      const bonusZone = await this.bonusZoneService.getBonusZone(id);

      // If zone not found, return 404 Not Found response
      if (!bonusZone) {
        logger.warn(`Bonus zone not found with ID: ${id}`);
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Bonus zone not found' });
        return;
      }

      // If zone found, return 200 OK response with the zone data
      res.status(StatusCodes.OK).json(bonusZone);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error getting bonus zone', { error });
      next(error);
    }
  }

  /**
   * Retrieves all bonus zones, optionally filtered by active status
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getAllBonusZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract activeOnly query parameter (default to false)
      const activeOnly = req.query.activeOnly === 'true';

      // Call bonusZoneService.getAllBonusZones with activeOnly parameter
      const bonusZones = await this.bonusZoneService.getAllBonusZones(activeOnly);

      // Return 200 OK response with the array of bonus zones
      res.status(StatusCodes.OK).json(bonusZones);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error getting all bonus zones', { error });
      next(error);
    }
  }

  /**
   * Retrieves all currently active bonus zones
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getActiveBonusZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Call bonusZoneService.getActiveBonusZones
      const activeBonusZones = await this.bonusZoneService.getActiveBonusZones();

      // Return 200 OK response with the array of active bonus zones
      res.status(StatusCodes.OK).json(activeBonusZones);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error getting active bonus zones', { error });
      next(error);
    }
  }

  /**
   * Updates an existing bonus zone
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async updateBonusZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract zone ID from request parameters
      const { id } = req.params;

      // Extract update data from request body
      const updateData = req.body;

      // Call bonusZoneService.updateBonusZone with ID and update data
      const updatedBonusZone = await this.bonusZoneService.updateBonusZone(id, updateData);

      // If zone not found, return 404 Not Found response
      if (!updatedBonusZone) {
        logger.warn(`Bonus zone not found for update with ID: ${id}`);
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Bonus zone not found' });
        return;
      }

      // If zone updated, return 200 OK response with the updated zone
      res.status(StatusCodes.OK).json(updatedBonusZone);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error updating bonus zone', { error });
      next(error);
    }
  }

  /**
   * Deactivates a bonus zone
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async deactivateBonusZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract zone ID from request parameters
      const { id } = req.params;

      // Call bonusZoneService.deactivateBonusZone with the ID
      const deactivatedBonusZone = await this.bonusZoneService.deactivateBonusZone(id);

      // If zone not found, return 404 Not Found response
      if (!deactivatedBonusZone) {
        logger.warn(`Bonus zone not found for deactivation with ID: ${id}`);
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Bonus zone not found' });
        return;
      }

      // If zone deactivated, return 200 OK response with the deactivated zone
      res.status(StatusCodes.OK).json(deactivatedBonusZone);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error deactivating bonus zone', { error });
      next(error);
    }
  }

  /**
   * Deletes a bonus zone
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async deleteBonusZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract zone ID from request parameters
      const { id } = req.params;

      // Call bonusZoneService.deleteBonusZone with the ID
      const deleted = await this.bonusZoneService.deleteBonusZone(id);

      // If zone not found, return 404 Not Found response
      if (!deleted) {
        logger.warn(`Bonus zone not found for deletion with ID: ${id}`);
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Bonus zone not found' });
        return;
      }

      // If zone deleted, return 204 No Content response
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error deleting bonus zone', { error });
      next(error);
    }
  }

  /**
   * Checks if a position is within any active bonus zone
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async checkPositionInBonusZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract position (latitude, longitude) from request body
      const position: Position = req.body;

      // Call bonusZoneService.checkPositionInBonusZone with the position
      const result = await this.bonusZoneService.checkPositionInBonusZone(position);

      // Return 200 OK response with result indicating if position is in a bonus zone
      // Include the bonus zone details if position is in a zone
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error checking position in bonus zone', { error });
      next(error);
    }
  }

  /**
   * Finds all bonus zones within a specified radius of a position
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getBonusZonesInRadius(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract position (latitude, longitude) and radius from request query
      const { latitude, longitude, radius } = req.query;

      // Validate that latitude, longitude, and radius are provided
      if (!latitude || !longitude || !radius) {
        throw new AppError('Missing required parameters: latitude, longitude, radius', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Convert latitude, longitude, and radius to numbers
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const rad = parseFloat(radius as string);

      // Validate that latitude, longitude, and radius are valid numbers
      if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
        throw new AppError('Invalid parameters: latitude, longitude, radius must be numbers', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Call bonusZoneService.getBonusZonesInRadius with position and radius
      const bonusZones = await this.bonusZoneService.getBonusZonesInRadius({ latitude: lat, longitude: lng } as Position, rad);

      // Return 200 OK response with array of bonus zones within the radius
      res.status(StatusCodes.OK).json(bonusZones);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error getting bonus zones in radius', { error });
      next(error);
    }
  }

  /**
   * Creates a bonus award for a driver in a bonus zone
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async createDriverBonus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID, zone ID, assignment ID, bonus amount, and reason from request body
      const { driverId, zoneId, assignmentId, bonusAmount, reason } = req.body;

      // Call bonusZoneService.createDriverBonus with the parameters
      const newDriverBonus = await this.bonusZoneService.createDriverBonus(driverId, zoneId, assignmentId, bonusAmount, reason);

      // Return 201 Created response with the created driver bonus
      res.status(StatusCodes.CREATED).json(newDriverBonus);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error creating driver bonus', { error });
      next(error);
    }
  }

  /**
   * Retrieves all driver bonuses awarded for a specific bonus zone
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getDriverBonusesForZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract zone ID from request parameters
      const { zoneId } = req.params;

      // Call bonusZoneService.getDriverBonusesForZone with the zone ID
      const driverBonuses = await this.bonusZoneService.getDriverBonusesForZone(zoneId);

      // Return 200 OK response with array of driver bonuses for the zone
      res.status(StatusCodes.OK).json(driverBonuses);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      logger.error('Error getting driver bonuses for zone', { error });
      next(error);
    }
  }
}