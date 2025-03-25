import express, { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ReservationService } from '../services/reservation.service';
import { MatchReservationParams } from '../interfaces/match.interface';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody } from '../../../common/middleware/validation.middleware';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';

/**
 * Validation schema for reservation creation
 */
const createReservationSchema = Joi.object({
  matchId: Joi.string().required(),
  driverId: Joi.string().required(),
  loadId: Joi.string().required(),
  expirationMinutes: Joi.number().integer().min(1).max(60).required()
});

/**
 * Validation schema for reservation conversion
 * No additional fields needed for conversion
 */
const convertReservationSchema = Joi.object({});

/**
 * Validation schema for reservation cancellation
 */
const cancelReservationSchema = Joi.object({
  reason: Joi.string().required()
});

/**
 * Controller responsible for handling HTTP requests related to load reservations
 * in the AI-driven Freight Optimization Platform.
 */
export class ReservationController {
  private controllerName: string;
  private reservationService: ReservationService;
  private router: express.Router;

  /**
   * Creates a new ReservationController instance and sets up routes
   * 
   * @param reservationService - Service for managing load reservations
   */
  constructor(reservationService: ReservationService) {
    this.controllerName = 'ReservationController';
    this.reservationService = reservationService;
    this.router = express.Router();
    this.setupRoutes();
  }

  /**
   * Sets up all routes for the reservation controller
   */
  private setupRoutes(): void {
    // Create a new reservation
    this.router.post(
      '/reservations',
      authenticate,
      validateBody(createReservationSchema),
      this.createReservation.bind(this)
    );

    // Get reservation by match ID
    this.router.get(
      '/reservations/match/:matchId',
      authenticate,
      this.getReservationByMatch.bind(this)
    );

    // Get reservations by driver ID
    this.router.get(
      '/reservations/driver/:driverId',
      authenticate,
      this.getReservationsByDriver.bind(this)
    );

    // Get reservations by load ID
    this.router.get(
      '/reservations/load/:loadId',
      authenticate,
      this.getReservationsByLoad.bind(this)
    );

    // Convert a reservation to an accepted match
    this.router.put(
      '/reservations/:reservationId/convert',
      authenticate,
      validateBody(convertReservationSchema),
      this.convertReservation.bind(this)
    );

    // Cancel a reservation
    this.router.put(
      '/reservations/:reservationId/cancel',
      authenticate,
      validateBody(cancelReservationSchema),
      this.cancelReservation.bind(this)
    );
  }

  /**
   * Returns the configured Express router
   * 
   * @returns Configured Express router
   */
  public getRouter(): express.Router {
    return this.router;
  }

  /**
   * Creates a new load reservation
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  private async createReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`${this.controllerName}: Request to create reservation`, {
        matchId: req.body.matchId,
        driverId: req.body.driverId,
        loadId: req.body.loadId
      });

      const { matchId, driverId, loadId, expirationMinutes } = req.body;

      const reservation = await this.reservationService.createReservation(
        matchId,
        driverId,
        loadId,
        expirationMinutes
      );

      res.status(StatusCodes.CREATED).json(reservation);
    } catch (error) {
      logger.error(`${this.controllerName}: Error creating reservation`, { error });
      next(error);
    }
  }

  /**
   * Gets the active reservation for a specific match
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  private async getReservationByMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matchId = req.params.matchId;
      logger.info(`${this.controllerName}: Request to get reservation by match ID`, { matchId });

      const reservation = await this.reservationService.getActiveReservationForMatch(matchId);

      if (!reservation) {
        logger.debug(`${this.controllerName}: No active reservation found for match`, { matchId });
        res.status(StatusCodes.NOT_FOUND).json({
          message: `No active reservation found for match ${matchId}`,
          code: ErrorCodes.RES_RESERVATION_NOT_FOUND
        });
        return;
      }

      res.status(StatusCodes.OK).json(reservation);
    } catch (error) {
      logger.error(`${this.controllerName}: Error getting reservation by match`, { 
        matchId: req.params.matchId,
        error 
      });
      next(error);
    }
  }

  /**
   * Gets all active reservations for a specific driver
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  private async getReservationsByDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.params.driverId;
      logger.info(`${this.controllerName}: Request to get reservations by driver ID`, { driverId });

      const reservations = await this.reservationService.getActiveReservationsForDriver(driverId);
      
      res.status(StatusCodes.OK).json(reservations);
    } catch (error) {
      logger.error(`${this.controllerName}: Error getting reservations by driver`, { 
        driverId: req.params.driverId,
        error 
      });
      next(error);
    }
  }

  /**
   * Gets all active reservations for a specific load
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  private async getReservationsByLoad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loadId = req.params.loadId;
      logger.info(`${this.controllerName}: Request to get reservations by load ID`, { loadId });

      const reservations = await this.reservationService.getActiveReservationsForLoad(loadId);
      
      res.status(StatusCodes.OK).json(reservations);
    } catch (error) {
      logger.error(`${this.controllerName}: Error getting reservations by load`, { 
        loadId: req.params.loadId,
        error 
      });
      next(error);
    }
  }

  /**
   * Converts a reservation to an accepted match
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  private async convertReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reservationId = req.params.reservationId;
      logger.info(`${this.controllerName}: Request to convert reservation`, { reservationId });

      const reservation = await this.reservationService.convertReservation(reservationId);
      
      res.status(StatusCodes.OK).json(reservation);
    } catch (error) {
      logger.error(`${this.controllerName}: Error converting reservation`, { 
        reservationId: req.params.reservationId,
        error 
      });
      next(error);
    }
  }

  /**
   * Cancels a reservation
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  private async cancelReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reservationId = req.params.reservationId;
      const { reason } = req.body;
      
      logger.info(`${this.controllerName}: Request to cancel reservation`, {
        reservationId,
        reason
      });

      const reservation = await this.reservationService.cancelReservation(reservationId, reason);
      
      res.status(StatusCodes.OK).json(reservation);
    } catch (error) {
      logger.error(`${this.controllerName}: Error cancelling reservation`, { 
        reservationId: req.params.reservationId,
        reason: req.body.reason,
        error 
      });
      next(error);
    }
  }
}