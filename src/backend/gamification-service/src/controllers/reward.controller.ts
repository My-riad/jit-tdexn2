import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import RewardService from '../services/reward.service';
import DriverBonusModel from '../models/driver-bonus.model';
import { EventProducer } from '../../../common/interfaces/event.interface';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';
import { Position } from '../../../common/interfaces/position.interface';
import { LoadAssignment } from '../../../common/interfaces/load.interface';

/**
 * Controller class that handles HTTP requests related to driver rewards and bonuses
 */
export class RewardController {
  /**
   * Creates a new RewardController instance
   * @param rewardService The reward service instance
   * @param eventProducer The event producer instance
   */
  constructor(
    private rewardService: RewardService,
    private eventProducer: EventProducer
  ) {
    // Log the initialization of the RewardController
    logger.info('RewardController initialized');
  }

  /**
   * Retrieves all bonuses for a specific driver with optional filtering
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async getDriverBonuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Extract filter parameters from request query (paid, startDate, endDate, minAmount, maxAmount)
      const filters: { paid?: boolean; startDate?: Date; endDate?: Date; minAmount?: number; maxAmount?: number; } = {
        paid: req.query.paid ? req.query.paid === 'true' : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
      };

      // Call rewardService.getDriverBonuses with driverId and filters
      const bonuses = await this.rewardService.getDriverBonuses(driverId, filters);

      // Return the bonuses as JSON response with 200 status code
      res.status(200).json(bonuses);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error retrieving driver bonuses', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Retrieves a specific driver bonus by its ID
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async getDriverBonusById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract bonusId from request parameters
      const { bonusId } = req.params;

      // Call rewardService.getDriverBonusById with bonusId
      const bonus = await this.rewardService.getDriverBonusById(bonusId);

      // If bonus not found, return 404 error
      if (!bonus) {
        throw createError(`Bonus not found with ID: ${bonusId}`, { code: ErrorCodes.NOT_FOUND });
      }

      // Return the bonus as JSON response with 200 status code
      res.status(200).json(bonus);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error retrieving driver bonus by ID', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Retrieves all unpaid bonuses for a specific driver
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async getUnpaidBonusesForDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Call rewardService.getUnpaidBonusesForDriver with driverId
      const unpaidBonuses = await this.rewardService.getUnpaidBonusesForDriver(driverId);

      // Return the unpaid bonuses as JSON response with 200 status code
      res.status(200).json(unpaidBonuses);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error retrieving unpaid bonuses for driver', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Calculates the total amount of unpaid bonuses for a driver
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async getTotalUnpaidAmount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Call rewardService.getTotalUnpaidAmount with driverId
      const totalUnpaidAmount = await this.rewardService.getTotalUnpaidAmount(driverId);

      // Return the total unpaid amount as JSON response with 200 status code
      res.status(200).json({ totalUnpaidAmount });
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error calculating total unpaid amount', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Creates a new bonus for a driver
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async createBonusForDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract bonus data from request body (driverId, zoneId, assignmentId, bonusAmount, bonusReason)
      const { driverId, zoneId, assignmentId, bonusAmount, bonusReason } = req.body;

      // Call rewardService.createBonusForDriver with the extracted data
      const bonus = await this.rewardService.createBonusForDriver(driverId, zoneId, assignmentId, bonusAmount, bonusReason);

      // Return the created bonus as JSON response with 201 status code
      res.status(201).json(bonus);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error creating bonus for driver', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Marks a bonus as paid
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async markBonusAsPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract bonusId from request parameters
      const { bonusId } = req.params;

      // Call rewardService.markBonusAsPaid with bonusId
      const updatedBonus = await this.rewardService.markBonusAsPaid(bonusId);

      // Return the updated bonus as JSON response with 200 status code
      res.status(200).json(updatedBonus);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error marking bonus as paid', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Processes rewards for top-ranked drivers in a leaderboard
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processLeaderboardRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract leaderboardId from request parameters
      const { leaderboardId } = req.params;

      // Call rewardService.processLeaderboardRewards with leaderboardId
      const processedRewards = await this.rewardService.processLeaderboardRewards(leaderboardId);

      // Return the processed rewards as JSON response with 200 status code
      res.status(200).json(processedRewards);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error processing leaderboard rewards', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Processes rewards for newly earned achievements
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processAchievementRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId and achievementId from request body
      const { driverId, achievementId } = req.body;

      // Call rewardService.processAchievementRewards with driverId and achievementId
      const createdBonus = await this.rewardService.processAchievementRewards(driverId, achievementId);

      // Return the created bonus (if any) as JSON response with 200 status code
      res.status(200).json(createdBonus);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error processing achievement rewards', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Processes rewards for drivers operating in bonus zones
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processBonusZoneRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId, assignmentId, and position data from request body
      const { driverId, assignmentId, position } = req.body;

      // Call rewardService.processBonusZoneRewards with driverId, assignmentId, and position
      const createdBonus = await this.rewardService.processBonusZoneRewards(driverId, assignmentId, position);

      // Return the created bonus (if any) as JSON response with 200 status code
      res.status(200).json(createdBonus);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error processing bonus zone rewards', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Processes rewards for completing a load assignment
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processLoadCompletionRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId and loadAssignment data from request body
      const { driverId, loadAssignment } = req.body;

      // Call rewardService.processLoadCompletionRewards with driverId and loadAssignment
      const createdBonuses = await this.rewardService.processLoadCompletionRewards(driverId, loadAssignment);

      // Return the created bonuses as JSON response with 200 status code
      res.status(200).json(createdBonuses);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error processing load completion rewards', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Processes fuel discount rewards based on driver efficiency score
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processFuelDiscountRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Call rewardService.processFuelDiscountRewards with driverId
      const fuelDiscount = await this.rewardService.processFuelDiscountRewards(driverId);

      // Return the calculated fuel discount as JSON response with 200 status code
      res.status(200).json(fuelDiscount);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error processing fuel discount rewards', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Processes weekly bonuses for all active weekly leaderboards
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processWeeklyBonuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Call rewardService.processWeeklyBonuses
      const processedWeeklyBonuses = await this.rewardService.processWeeklyBonuses();

      // Return the processed weekly bonuses as JSON response with 200 status code
      res.status(200).json(processedWeeklyBonuses);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error processing weekly bonuses', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Processes monthly bonuses for all active monthly leaderboards
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processMonthlyBonuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Call rewardService.processMonthlyBonuses
      const processedMonthlyBonuses = await this.rewardService.processMonthlyBonuses();

      // Return the processed monthly bonuses as JSON response with 200 status code
      res.status(200).json(processedMonthlyBonuses);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error processing monthly bonuses', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Gets a summary of all rewards for a driver
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async getDriverRewardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Extract startDate and endDate from request query
      const { startDate, endDate } = req.query;

      // Call rewardService.getDriverRewardSummary with driverId, startDate, and endDate
      const rewardSummary = await this.rewardService.getDriverRewardSummary(driverId, new Date(startDate as string), new Date(endDate as string));

      // Return the reward summary as JSON response with 200 status code
      res.status(200).json(rewardSummary);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error getting reward summary for driver', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Checks if a driver has access to premium loads based on their efficiency score
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async checkPremiumLoadAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Call rewardService.checkPremiumLoadAccess with driverId
      const premiumLoadAccess = await this.rewardService.checkPremiumLoadAccess(driverId);

      // Return the access status and score as JSON response with 200 status code
      res.status(200).json(premiumLoadAccess);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error checking premium load access', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Processes the redemption of a non-monetary reward like fuel discounts
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async redeemReward(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId, rewardType, and redemptionDetails from request body
      const { driverId, rewardType, redemptionDetails } = req.body;

      // Call rewardService.redeemReward with the extracted data
      const redemptionConfirmation = await this.rewardService.redeemReward(driverId, rewardType, redemptionDetails);

      // Return the redemption confirmation as JSON response with 200 status code
      res.status(200).json(redemptionConfirmation);
    } catch (error: any) {
      // Log the error and pass it to the next middleware
      logger.error('Error redeeming reward', { error: error.message, stack: error.stack });
      next(error);
    }
  }
}

// Export the RewardController class for use in route configuration
export default RewardController;