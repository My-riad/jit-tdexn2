import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import {
  AchievementService,
} from '../services/achievement.service';
import {
  Achievement,
  AchievementCategory,
  AchievementLevel,
  AchievementProgress,
  DriverAchievement,
} from '../../../common/interfaces/achievement.interface';
import { EventProducer } from '../../../common/interfaces/event.interface';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';

/**
 * Controller class that handles HTTP requests related to achievements in the gamification system
 */
export class AchievementController {
  /**
   * Creates a new AchievementController instance
   * @param {AchievementService} achievementService
   * @param {EventProducer} eventProducer
   */
  constructor(
    private achievementService: AchievementService,
    private eventProducer: EventProducer
  ) {
    // Initialize the achievementService with the provided AchievementService instance
    this.achievementService = achievementService;
    // Initialize the eventProducer with the provided EventProducer instance
    this.eventProducer = eventProducer;
  }

  /**
   * Handles request to create a new achievement
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async createAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract achievement data from request body
      const achievementData: Achievement = req.body;

      // Call achievementService.createAchievement with the data
      const createdAchievement = await this.achievementService.createAchievement(achievementData);

      // Return 201 Created response with the created achievement
      res.status(StatusCodes.CREATED).json(createdAchievement);
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to retrieve an achievement by ID
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async getAchievementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract achievement ID from request parameters
      const { id } = req.params;

      // Call achievementService.getAchievementById with the ID
      const achievement = await this.achievementService.getAchievementById(id);

      // If achievement is found, return 200 OK with the achievement
      if (achievement) {
        res.status(StatusCodes.OK).json(achievement);
      } else {
        // If achievement is not found, return 404 Not Found
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Achievement not found' });
      }
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to retrieve all achievements with optional filtering and pagination
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async getAllAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract filter parameters from request query
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      // Extract pagination parameters (page, pageSize) from request query
      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10,
      };

      // Call achievementService.getAllAchievements with filters and pagination
      const { achievements, total, page, pageSize } = await this.achievementService.getAllAchievements(filters, pagination);

      // Return 200 OK with paginated achievements and metadata
      res.status(StatusCodes.OK).json({
        achievements,
        total,
        page,
        pageSize,
      });
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to update an existing achievement
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async updateAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract achievement ID from request parameters
      const { id } = req.params;

      // Extract update data from request body
      const updateData: Partial<Achievement> = req.body;

      // Call achievementService.updateAchievement with ID and update data
      const updatedAchievement = await this.achievementService.updateAchievement(id, updateData);

      // If achievement is found and updated, return 200 OK with updated achievement
      if (updatedAchievement) {
        res.status(StatusCodes.OK).json(updatedAchievement);
      } else {
        // If achievement is not found, return 404 Not Found
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Achievement not found' });
      }
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to delete an achievement
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async deleteAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract achievement ID from request parameters
      const { id } = req.params;

      // Call achievementService.deleteAchievement with the ID
      const deleted = await this.achievementService.deleteAchievement(id);

      // If achievement is found and deleted, return 204 No Content
      if (deleted) {
        res.status(StatusCodes.NO_CONTENT).send();
      } else {
        // If achievement is not found, return 404 Not Found
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Achievement not found' });
      }
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to retrieve all achievements earned by a driver
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async getDriverAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID from request parameters
      const { driverId } = req.params;

      // Extract filter parameters from request query
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      // Extract pagination parameters (page, pageSize) from request query
      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10,
      };

      // Call achievementService.getDriverAchievements with driver ID, filters, and pagination
      const { driverAchievements, total, page, pageSize } = await this.achievementService.getDriverAchievements(driverId, filters, pagination);

      // Return 200 OK with paginated driver achievements and metadata
      res.status(StatusCodes.OK).json({
        driverAchievements,
        total,
        page,
        pageSize,
      });
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to retrieve a driver's progress toward all achievements
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async getDriverAchievementProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID from request parameters
      const { driverId } = req.params;

      // Call achievementService.getDriverAchievementProgress with the driver ID
      const achievementProgress = await this.achievementService.getDriverAchievementProgress(driverId);

      // Return 200 OK with the achievement progress array
      res.status(StatusCodes.OK).json(achievementProgress);
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to manually award an achievement to a driver
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async awardAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID from request parameters
      const { driverId, achievementId } = req.params;

      // Extract achievement data from request body
      const achievementData = req.body;

      // Call achievementService.awardAchievement with driver ID, achievement ID, and data
      const awardedAchievement = await this.achievementService.awardAchievement(driverId, achievementId, achievementData);

      // Return 201 Created with the awarded driver achievement
      res.status(StatusCodes.CREATED).json(awardedAchievement);
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to revoke an achievement from a driver
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async revokeAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID from request parameters
      const { driverId, achievementId } = req.params;

      // Extract revocation reason from request body
      const { reason } = req.body;

      // Call achievementService.revokeAchievement with driver ID, achievement ID, and reason
      const revoked = await this.achievementService.revokeAchievement(driverId, achievementId, reason);

      // If achievement is found and revoked, return 204 No Content
      if (revoked) {
        res.status(StatusCodes.NO_CONTENT).send();
      } else {
        // If achievement is not found, return 404 Not Found
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Achievement not found' });
      }
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to check if a driver has earned any new achievements
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async checkAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID from request parameters
      const { driverId } = req.params;

      // Call achievementService.checkAchievements with the driver ID
      const achievementProgress = await this.achievementService.checkAchievements(driverId);

      // Return 200 OK with the achievement progress array, including newly earned achievements
      res.status(StatusCodes.OK).json(achievementProgress);
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to process driver activity and check for newly earned achievements
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async processDriverActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID from request parameters
      const { driverId } = req.params;

      // Extract activity data from request body
      const activityData = req.body;

      // Call achievementService.processDriverActivity with driver ID and activity data
      const achievementProgress = await this.achievementService.processDriverActivity(driverId, activityData);

      // Return 200 OK with the achievement progress array, including newly earned achievements
      res.status(StatusCodes.OK).json(achievementProgress);
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to retrieve achievements filtered by category
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async getAchievementsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract category from request parameters
      const { category } = req.params;

      // Validate category parameter
      if (!Object.values(AchievementCategory).includes(category as AchievementCategory)) {
        throw createError('Invalid achievement category', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Extract pagination parameters (page, pageSize) from request query
      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10,
      };

      // Call achievementService.getAchievementsByCategory with category and pagination
      const { achievements, total, page, pageSize } = await this.achievementService.getAchievementsByCategory(category as AchievementCategory, pagination);

      // Return 200 OK with paginated achievements and metadata
      res.status(StatusCodes.OK).json({
        achievements,
        total,
        page,
        pageSize,
      });
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to retrieve achievements filtered by level
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async getAchievementsByLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract level from request parameters
      const { level } = req.params;

      // Validate level parameter
      if (!Object.values(AchievementLevel).includes(level as AchievementLevel)) {
        throw createError('Invalid achievement level', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Extract pagination parameters (page, pageSize) from request query
      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10,
      };

      // Call achievementService.getAchievementsByLevel with level and pagination
      const { achievements, total, page, pageSize } = await this.achievementService.getAchievementsByLevel(level as AchievementLevel, pagination);

      // Return 200 OK with paginated achievements and metadata
      res.status(StatusCodes.OK).json({
        achievements,
        total,
        page,
        pageSize,
      });
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles request to retrieve drivers with the most achievements
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns {Promise<void>} No direct return value, sends HTTP response
   */
  async getTopAchievers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract limit parameter from request query (default to 10)
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      // Call achievementService.getTopAchievers with the limit
      const topAchievers = await this.achievementService.getTopAchievers(limit);

      // Return 200 OK with the array of top achievers
      res.status(StatusCodes.OK).json(topAchievers);
    } catch (error: any) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }
}