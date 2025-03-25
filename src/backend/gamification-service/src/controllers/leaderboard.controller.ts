import { Request, Response, NextFunction } from 'express'; // express ^4.18.2
import LeaderboardService from '../services/leaderboard.service';
import LeaderboardModel from '../models/leaderboard.model';
import LeaderboardEntryModel from '../models/leaderboard-entry.model';
import { Driver } from '../../../common/interfaces/driver.interface';
import { EventProducer } from '../../../common/interfaces/event.interface';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';

/**
 * Controller class that handles HTTP requests related to leaderboards in the gamification system
 */
class LeaderboardController {
  private leaderboardService: LeaderboardService;
  private eventProducer: EventProducer;

  /**
   * Creates a new LeaderboardController instance
   * @param leaderboardService Service for leaderboard operations
   * @param eventProducer Event producer for publishing leaderboard events
   */
  constructor(leaderboardService: LeaderboardService, eventProducer: EventProducer) {
    this.leaderboardService = leaderboardService;
    this.eventProducer = eventProducer;
    logger.info('LeaderboardController initialized');
  }

  /**
   * Handles GET request to retrieve all active leaderboards with optional filtering
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getLeaderboards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        leaderboardType: req.query.leaderboardType as string,
        timeframe: req.query.timeframe as string,
        region: req.query.region as string
      };

      const leaderboards = await this.leaderboardService.getActiveLeaderboards(filters);
      
      res.json(leaderboards);
      
      logger.info('Retrieved leaderboards', {
        count: leaderboards.length,
        filters
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles GET request to retrieve leaderboards that are currently active
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getCurrentLeaderboards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        leaderboardType: req.query.leaderboardType as string,
        timeframe: req.query.timeframe as string,
        region: req.query.region as string
      };

      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      const leaderboards = await this.leaderboardService.getCurrentLeaderboards(date, filters);
      
      res.json(leaderboards);
      
      logger.info('Retrieved current leaderboards', {
        count: leaderboards.length,
        date: date.toISOString(),
        filters
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles GET request to retrieve a specific leaderboard by ID
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getLeaderboardById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leaderboardId } = req.params;
      
      const leaderboard = await this.leaderboardService.getLeaderboardById(leaderboardId);
      
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, {
          code: ErrorCodes.RES_LOAD_NOT_FOUND
        });
      }
      
      res.json(leaderboard);
      
      logger.info('Retrieved leaderboard by ID', {
        leaderboardId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST request to create a new leaderboard
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async createLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderboardData = req.body;
      
      const leaderboard = await this.leaderboardService.createLeaderboard(leaderboardData);
      
      res.status(201).json(leaderboard);
      
      logger.info('Created new leaderboard', {
        leaderboardId: leaderboard.id,
        leaderboardType: leaderboard.leaderboard_type,
        timeframe: leaderboard.timeframe
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles GET request to retrieve entries for a specific leaderboard with pagination
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getLeaderboardEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leaderboardId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      
      const result = await this.leaderboardService.getLeaderboardEntries(
        leaderboardId,
        page,
        pageSize
      );
      
      res.json(result);
      
      logger.info('Retrieved leaderboard entries', {
        leaderboardId,
        page,
        pageSize,
        totalEntries: result.total
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles GET request to retrieve the top N entries for a specific leaderboard
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getTopLeaderboardEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leaderboardId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const entries = await this.leaderboardService.getTopLeaderboardEntries(
        leaderboardId,
        limit
      );
      
      res.json(entries);
      
      logger.info('Retrieved top leaderboard entries', {
        leaderboardId,
        limit,
        entriesRetrieved: entries.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles GET request to retrieve a driver's entry in a specific leaderboard
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getDriverLeaderboardEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leaderboardId, driverId } = req.params;
      
      const entry = await this.leaderboardService.getDriverLeaderboardEntry(
        leaderboardId,
        driverId
      );
      
      if (!entry) {
        throw createError(`Driver entry not found for driver ${driverId} in leaderboard ${leaderboardId}`, {
          code: ErrorCodes.RES_DRIVER_NOT_FOUND
        });
      }
      
      res.json(entry);
      
      logger.info('Retrieved driver leaderboard entry', {
        leaderboardId,
        driverId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles GET request to retrieve all leaderboard entries for a specific driver with pagination
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getDriverLeaderboardEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      const filters = {
        timeframe: req.query.timeframe as string,
        leaderboardType: req.query.leaderboardType as string,
        region: req.query.region as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };
      
      const result = await this.leaderboardService.getDriverLeaderboardEntries(
        driverId,
        filters,
        page,
        pageSize
      );
      
      res.json(result);
      
      logger.info('Retrieved driver leaderboard entries', {
        driverId,
        filters,
        page,
        pageSize,
        totalEntries: result.total
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST request to recalculate all rankings for a specific leaderboard
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async recalculateLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leaderboardId } = req.params;
      
      const leaderboard = await this.leaderboardService.recalculateLeaderboard(leaderboardId);
      
      res.json(leaderboard);
      
      logger.info('Recalculated leaderboard rankings', {
        leaderboardId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST request to finalize the rankings for a leaderboard
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async finalizeLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leaderboardId } = req.params;
      
      const leaderboard = await this.leaderboardService.finalizeLeaderboardRankings(leaderboardId);
      
      res.json(leaderboard);
      
      logger.info('Finalized leaderboard rankings', {
        leaderboardId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST request to process bonus payments for top-ranked drivers in a leaderboard
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async processBonusPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leaderboardId } = req.params;
      
      const bonusPayments = await this.leaderboardService.processBonusPayments(leaderboardId);
      
      res.json(bonusPayments);
      
      logger.info('Processed bonus payments', {
        leaderboardId,
        paymentsCount: bonusPayments.length,
        totalAmount: bonusPayments.reduce((sum, item) => sum + item.bonusAmount, 0)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST request to create a new leaderboard for the next time period
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async createNextPeriodLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leaderboardId } = req.params;
      
      const newLeaderboard = await this.leaderboardService.createNextPeriodLeaderboard(leaderboardId);
      
      res.status(201).json(newLeaderboard);
      
      logger.info('Created next period leaderboard', {
        previousLeaderboardId: leaderboardId,
        newLeaderboardId: newLeaderboard.id
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST request to process leaderboards that are ending soon
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async processEndingLeaderboards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const daysThreshold = parseInt(req.query.daysThreshold as string) || 1;
      
      const result = await this.leaderboardService.processEndingLeaderboards(daysThreshold);
      
      res.json(result);
      
      logger.info('Processed ending leaderboards', {
        endedCount: result.ended.length,
        createdCount: result.created.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LeaderboardController;