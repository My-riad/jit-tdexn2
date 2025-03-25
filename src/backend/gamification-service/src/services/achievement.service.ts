import { transaction } from 'objection'; // objection@^3.0.1
import {
  Achievement,
  AchievementCategory,
  AchievementLevel,
  AchievementProgress,
  DriverAchievement,
  AchievementCriteria
} from '../../../common/interfaces/achievement.interface';
import { EventProducer } from '../../../common/interfaces/event.interface';
import AchievementModel from '../models/achievement.model';
import DriverAchievementModel from '../models/driver-achievement.model';
import AchievementDetector, { detectAchievements, getDriverAchievementProgress } from '../algorithms/achievement-detector';
import AchievementEventsProducer from '../producers/achievement-events.producer';
import DriverScoreModel from '../models/driver-score.model';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';

/**
 * Service class that manages achievements in the gamification system
 */
export class AchievementService {
  private AchievementEventsProducer: any;
  private AchievementDetector: any;
  /**
   * Creates a new AchievementService instance
   * @param {EventProducer} eventProducer
   */
  constructor(
    private eventProducer: EventProducer
  ) {
    // Initialize the eventProducer with the provided EventProducer instance
    this.eventProducer = eventProducer;
    // Create a new AchievementDetector instance
    this.AchievementDetector = new AchievementDetector();
  }

  /**
   * Creates a new achievement in the system
   * @param {Partial<Achievement>} achievementData
   * @returns {Promise<Achievement>} The newly created achievement
   */
  async createAchievement(achievementData: Partial<Achievement>): Promise<Achievement> {
    logger.info('Creating a new achievement', { achievementData });
    // Validate the achievement data
    if (!achievementData.name || !achievementData.description || !achievementData.category || !achievementData.level || !achievementData.points || !achievementData.criteria) {
      logger.error('Invalid achievement data provided', { achievementData });
      throw createError('Invalid achievement data provided', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    try {
      // Create a new AchievementModel instance with the provided data
      const achievement = await AchievementModel.query().insert(achievementData);
      // Save the achievement to the database
      logger.debug('Achievement created successfully', { achievementId: achievement.id });
      // Return the created achievement
      return achievement;
    } catch (error: any) {
      logger.error('Error creating achievement', { error: error.message, achievementData });
      throw createError('Error creating achievement', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves an achievement by its ID
   * @param {string} id
   * @returns {Promise<Achievement | null>} The achievement if found, null otherwise
   */
  async getAchievementById(id: string): Promise<Achievement | null> {
    logger.info('Retrieving achievement by ID', { achievementId: id });
    try {
      // Query the database for an achievement with the provided ID
      const achievement = await AchievementModel.query().findById(id);
      // Return the achievement if found, null otherwise
      if (!achievement) {
        logger.warn('Achievement not found', { achievementId: id });
      }
      return achievement || null;
    } catch (error: any) {
      logger.error('Error retrieving achievement by ID', { error: error.message, achievementId: id });
      throw createError('Error retrieving achievement by ID', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves all achievements with optional filtering and pagination
   * @param {object} filters
   * @param {object} pagination
   * @returns {Promise<{ achievements: Achievement[]; total: number; page: number; pageSize: number; }>} Paginated achievements with metadata
   */
  async getAllAchievements(filters: object, pagination: object): Promise<{ achievements: Achievement[]; total: number; page: number; pageSize: number; }> {
    logger.info('Retrieving all achievements', { filters, pagination });
    try {
      // Build a query for achievements with the provided filters
      let query = AchievementModel.query();

      // Apply pagination parameters (page, pageSize)
      const page = (pagination as any).page || 1;
      const pageSize = (pagination as any).pageSize || 10;
      const offset = (page - 1) * pageSize;

      // Execute the query to get achievements and total count
      const achievements = await query.limit(pageSize).offset(offset);
      const total = await AchievementModel.query().count().first();

      // Return the achievements with pagination metadata
      return {
        achievements,
        total: total ? Number((total as any).count) : 0,
        page,
        pageSize
      };
    } catch (error: any) {
      logger.error('Error retrieving all achievements', { error: error.message, filters, pagination });
      throw createError('Error retrieving all achievements', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Updates an existing achievement
   * @param {string} id
   * @param {Partial<Achievement>} updateData
   * @returns {Promise<Achievement | null>} The updated achievement if found, null otherwise
   */
  async updateAchievement(id: string, updateData: Partial<Achievement>): Promise<Achievement | null> {
    logger.info('Updating an achievement', { achievementId: id, updateData });
    // Validate the update data
    if (updateData.name === '' || updateData.description === '' || updateData.category === '' || updateData.level === '' || updateData.points === '' || updateData.criteria === '') {
      logger.error('Invalid achievement update data provided', { achievementId: id, updateData });
      throw createError('Invalid achievement update data provided', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    try {
      // Query the database for an achievement with the provided ID
      const achievement = await AchievementModel.query().findById(id);

      // If found, update the achievement with the provided data
      if (achievement) {
        await AchievementModel.query().patchAndFetchById(id, updateData);
        logger.debug('Achievement updated successfully', { achievementId: id });
        // Save the updated achievement to the database
        return achievement;
      } else {
        logger.warn('Achievement not found for update', { achievementId: id });
        return null;
      }
    } catch (error: any) {
      logger.error('Error updating achievement', { error: error.message, achievementId: id, updateData });
      throw createError('Error updating achievement', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Deletes an achievement from the system
   * @param {string} id
   * @returns {Promise<boolean>} True if the achievement was deleted, false if not found
   */
  async deleteAchievement(id: string): Promise<boolean> {
    logger.info('Deleting an achievement', { achievementId: id });
    try {
      // Query the database for an achievement with the provided ID
      const achievement = await AchievementModel.query().findById(id);
      if (achievement) {
        // If found, delete the achievement from the database
        await AchievementModel.query().deleteById(id);
        logger.debug('Achievement deleted successfully', { achievementId: id });
        // Return true if deleted, false if not found
        return true;
      } else {
        logger.warn('Achievement not found for deletion', { achievementId: id });
        return false;
      }
    } catch (error: any) {
      logger.error('Error deleting achievement', { error: error.message, achievementId: id });
      throw createError('Error deleting achievement', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves all achievements earned by a driver
   * @param {string} driverId
   * @param {object} filters
   * @param {object} pagination
   * @returns {Promise<{ driverAchievements: DriverAchievement[]; total: number; page: number; pageSize: number; }>} Paginated driver achievements with metadata
   */
  async getDriverAchievements(driverId: string, filters: object, pagination: object): Promise<{ driverAchievements: DriverAchievement[]; total: number; page: number; pageSize: number; }> {
    logger.info('Retrieving all achievements earned by a driver', { driverId, filters, pagination });
    try {
      // Build a query for driver achievements with the provided driver ID and filters
      let query = DriverAchievementModel.query().where('driverId', driverId);

      // Apply pagination parameters (page, pageSize)
      const page = (pagination as any).page || 1;
      const pageSize = (pagination as any).pageSize || 10;
      const offset = (page - 1) * pageSize;

      // Execute the query to get driver achievements and total count
      const driverAchievements = await query.limit(pageSize).offset(offset);
      const total = await DriverAchievementModel.query().where('driverId', driverId).count().first();

      // Return the driver achievements with pagination metadata
      return {
        driverAchievements,
        total: total ? Number((total as any).count) : 0,
        page,
        pageSize
      };
    } catch (error: any) {
      logger.error('Error retrieving all achievements earned by a driver', { error: error.message, driverId, filters, pagination });
      throw createError('Error retrieving all achievements earned by a driver', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves a driver's progress toward all achievements
   * @param {string} driverId
   * @returns {Promise<AchievementProgress[]>} Array of achievement progress objects for the driver
   */
  async getDriverAchievementProgress(driverId: string): Promise<AchievementProgress[]> {
    logger.info(`Getting achievement progress for driver ${driverId}`);
    // Call the getDriverAchievementProgress function from the achievement detector
    const achievementProgress = await getDriverAchievementProgress(driverId);
    // Return the achievement progress array
    return achievementProgress;
  }

  /**
   * Manually awards an achievement to a driver
   * @param {string} driverId
   * @param {string} achievementId
   * @param {Record<string, any>} achievementData
   * @returns {Promise<DriverAchievement>} The awarded driver achievement
   */
  async awardAchievement(driverId: string, achievementId: string, achievementData: Record<string, any>): Promise<DriverAchievement> {
    logger.info(`Manually awarding achievement ${achievementId} to driver ${driverId}`, { driverId, achievementId, achievementData });
    try {
      // Validate that the driver and achievement exist
      const achievement = await AchievementModel.query().findById(achievementId);
      if (!achievement) {
        logger.warn('Achievement not found', { achievementId });
        throw createError('Achievement not found', { code: ErrorCodes.RES_SMART_HUB_NOT_FOUND });
      }

      // Check if the driver already has the achievement
      const existingAchievement = await DriverAchievementModel.query()
        .where('driverId', driverId)
        .where('achievementId', achievementId)
        .first();

      if (existingAchievement) {
        logger.warn('Driver already has achievement', { driverId, achievementId });
        throw createError('Driver already has achievement', { code: ErrorCodes.CONF_ALREADY_EXISTS });
      }

      // Create a new DriverAchievementModel instance
      const driverAchievement = await DriverAchievementModel.query().insert({
        driverId,
        achievementId,
        earnedAt: new Date(),
        achievementData
      });

      // Publish an achievement earned event
      (this.eventProducer as AchievementEventsProducer).publishAchievementEarned(driverId, achievement, driverAchievement);
      logger.debug('Achievement awarded successfully', { driverId, achievementId });
      // Return the created driver achievement
      return driverAchievement;
    } catch (error: any) {
      logger.error('Error awarding achievement', { error: error.message, driverId, achievementId, achievementData });
      throw createError('Error awarding achievement', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Revokes an achievement from a driver
   * @param {string} driverId
   * @param {string} achievementId
   * @param {string} reason
   * @returns {Promise<boolean>} True if the achievement was revoked, false if not found
   */
  async revokeAchievement(driverId: string, achievementId: string, reason: string): Promise<boolean> {
    logger.info(`Revoking achievement ${achievementId} from driver ${driverId}`, { driverId, achievementId, reason });
    try {
      // Query the database for a driver achievement with the provided driver ID and achievement ID
      const driverAchievement = await DriverAchievementModel.query()
        .where('driverId', driverId)
        .where('achievementId', achievementId)
        .first();

      if (driverAchievement) {
        // If found, delete the driver achievement from the database
        await DriverAchievementModel.query()
          .delete()
          .where('driverId', driverId)
          .where('achievementId', achievementId);

        // Get the achievement details
        const achievement = await AchievementModel.query().findById(achievementId);

        // Publish an achievement revoked event with the reason
        if (achievement) {
          (this.eventProducer as AchievementEventsProducer).publishAchievementRevoked(driverId, achievement, reason);
        }

        logger.debug('Achievement revoked successfully', { driverId, achievementId });
        // Return true if revoked, false if not found
        return true;
      } else {
        logger.warn('Driver achievement not found for revocation', { driverId, achievementId });
        return false;
      }
    } catch (error: any) {
      logger.error('Error revoking achievement', { error: error.message, driverId, achievementId, reason });
      throw createError('Error revoking achievement', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Checks if a driver has earned any new achievements based on their performance metrics
   * @param {string} driverId
   * @returns {Promise<AchievementProgress[]>} Array of achievement progress objects, including newly earned achievements
   */
  async checkAchievements(driverId: string): Promise<AchievementProgress[]> {
    logger.info(`Checking achievements for driver ${driverId}`);
    try {
      // Get the latest driver score for the driver
      const driverScore = await DriverScoreModel.getLatestScoreForDriver(driverId);

      if (!driverScore) {
        logger.warn('Driver score not found', { driverId });
        return [];
      }

      // Call the detectAchievements function with the driver ID and score
      const achievementProgress = await detectAchievements(driverId, driverScore);

      // For each newly earned achievement, publish an achievement earned event
      achievementProgress.filter(progress => progress.isCompleted).forEach(async progress => {
        const achievement = await AchievementModel.query().findById(progress.achievementId);
        const driverAchievement = await DriverAchievementModel.query()
          .where('driverId', driverId)
          .where('achievementId', progress.achievementId)
          .first();

        if (achievement && driverAchievement) {
          (this.eventProducer as AchievementEventsProducer).publishAchievementEarned(driverId, achievement, driverAchievement);
        }
      });

      logger.debug('Achievements checked successfully', { driverId });
      // Return the achievement progress array
      return achievementProgress;
    } catch (error: any) {
      logger.error('Error checking achievements', { error: error.message, driverId });
      throw createError('Error checking achievements', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Processes driver activity to check for newly earned achievements
   * @param {string} driverId
   * @param {object} activityData
   * @returns {Promise<AchievementProgress[]>} Array of achievement progress objects, including newly earned achievements
   */
  async processDriverActivity(driverId: string, activityData: object): Promise<AchievementProgress[]> {
    logger.info(`Processing driver activity for driver ${driverId}`, { activityData });
    try {
      // Get the latest driver score for the driver
      const driverScore = await DriverScoreModel.getLatestScoreForDriver(driverId);

      if (!driverScore) {
        logger.warn('Driver score not found', { driverId });
        return [];
      }

      // Call the detectAchievements function with the driver ID, score, and activity data
      const achievementProgress = await detectAchievements(driverId, driverScore);

      // For each newly earned achievement, publish an achievement earned event
      achievementProgress.filter(progress => progress.isCompleted).forEach(async progress => {
        const achievement = await AchievementModel.query().findById(progress.achievementId);
        const driverAchievement = await DriverAchievementModel.query()
          .where('driverId', driverId)
          .where('achievementId', progress.achievementId)
          .first();

        if (achievement && driverAchievement) {
          (this.eventProducer as AchievementEventsProducer).publishAchievementEarned(driverId, achievement, driverAchievement);
        }
      });

      logger.debug('Driver activity processed successfully', { driverId, activityData });
      // Return the achievement progress array
      return achievementProgress;
    } catch (error: any) {
      logger.error('Error processing driver activity', { error: error.message, driverId, activityData });
      throw createError('Error processing driver activity', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves achievements filtered by category
   * @param {AchievementCategory} category
   * @param {object} pagination
   * @returns {Promise<{ achievements: Achievement[]; total: number; page: number; pageSize: number; }>} Paginated achievements with metadata
   */
  async getAchievementsByCategory(category: AchievementCategory, pagination: object): Promise<{ achievements: Achievement[]; total: number; page: number; pageSize: number; }> {
    logger.info('Retrieving achievements by category', { category, pagination });
    try {
      // Build a query for achievements with the provided category
      let query = AchievementModel.query().where('category', category);

      // Apply pagination parameters (page, pageSize)
      const page = (pagination as any).page || 1;
      const pageSize = (pagination as any).pageSize || 10;
      const offset = (page - 1) * pageSize;

      // Execute the query to get achievements and total count
      const achievements = await query.limit(pageSize).offset(offset);
      const total = await AchievementModel.query().where('category', category).count().first();

      // Return the achievements with pagination metadata
      return {
        achievements,
        total: total ? Number((total as any).count) : 0,
        page,
        pageSize
      };
    } catch (error: any) {
      logger.error('Error retrieving achievements by category', { error: error.message, category, pagination });
      throw createError('Error retrieving achievements by category', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves achievements filtered by level
   * @param {AchievementLevel} level
   * @param {object} pagination
   * @returns {Promise<{ achievements: Achievement[]; total: number; page: number; pageSize: number; }>} Paginated achievements with metadata
   */
  async getAchievementsByLevel(level: AchievementLevel, pagination: object): Promise<{ achievements: Achievement[]; total: number; page: number; pageSize: number; }> {
    logger.info('Retrieving achievements by level', { level, pagination });
    try {
      // Build a query for achievements with the provided level
      let query = AchievementModel.query().where('level', level);

      // Apply pagination parameters (page, pageSize)
      const page = (pagination as any).page || 1;
      const pageSize = (pagination as any).pageSize || 10;
      const offset = (page - 1) * pageSize;

      // Execute the query to get achievements and total count
      const achievements = await query.limit(pageSize).offset(offset);
      const total = await AchievementModel.query().where('level', level).count().first();

      // Return the achievements with pagination metadata
      return {
        achievements,
        total: total ? Number((total as any).count) : 0,
        page,
        pageSize
      };
    } catch (error: any) {
      logger.error('Error retrieving achievements by level', { error: error.message, level, pagination });
      throw createError('Error retrieving achievements by level', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves drivers with the most achievements
   * @param {number} limit
   * @returns {Promise<{ driverId: string; achievementCount: number; totalPoints: number; }[]>} Array of top achievers with achievement counts and points
   */
  async getTopAchievers(limit: number): Promise<{ driverId: string; achievementCount: number; totalPoints: number; }[]> {
    logger.info('Retrieving top achievers', { limit });
    try {
      // Query the database to count achievements and sum points by driver
      const topAchievers = await DriverAchievementModel.query()
        .select('driverId')
        .count('achievementId as achievementCount')
        .sum('points as totalPoints')
        .groupBy('driverId')
        .orderBy([
          { column: 'achievementCount', order: 'desc' },
          { column: 'totalPoints', order: 'desc' }
        ])
        .limit(limit);

      logger.debug('Top achievers retrieved successfully', { topAchievers });
      // Return the top achievers array
      return topAchievers as any;
    } catch (error: any) {
      logger.error('Error retrieving top achievers', { error: error.message, limit });
      throw createError('Error retrieving top achievers', { code: ErrorCodes.SRV_INTERNAL_ERROR, details: { error: error.message } });
    }
  }
}

export default AchievementService;