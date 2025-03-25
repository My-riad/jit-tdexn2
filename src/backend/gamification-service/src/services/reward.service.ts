import { transaction } from 'objection'; // objection v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0

import { DriverBonusModel } from '../models/driver-bonus.model';
import { BonusZoneModel } from '../models/bonus-zone.model';
import { LeaderboardModel } from '../models/leaderboard.model';
import { LeaderboardEntryModel } from '../models/leaderboard-entry.model';
import { DriverScoreModel } from '../models/driver-score.model';
import { AchievementModel } from '../models/achievement.model';
import { DriverAchievementModel } from '../models/driver-achievement.model';
import { LeaderboardService } from './leaderboard.service';
import { BonusZoneService } from './bonus-zone.service';
import { ScoreService } from './score.service';
import { AchievementService } from './achievement.service';
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import { EventProducer, GamificationEvent } from '../../../common/interfaces/event.interface';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { logger } from '../../../common/utils/logger';
import { LoadAssignment } from '../../../common/interfaces/load.interface';
import { Position } from '../../../common/interfaces/position.interface';

/**
 * Service class that manages rewards in the gamification system
 */
export class RewardService {
  /**
   * Creates a new RewardService instance
   * @param leaderboardService The leaderboard service instance
   * @param bonusZoneService The bonus zone service instance
   * @param scoreService The score service instance
   * @param achievementService The achievement service instance
   * @param eventProducer The event producer instance
   */
  constructor(
    private leaderboardService: LeaderboardService,
    private bonusZoneService: BonusZoneService,
    private scoreService: ScoreService,
    private achievementService: AchievementService,
    private eventProducer: EventProducer
  ) {
    logger.info('RewardService initialized');
  }

  /**
   * Retrieves all bonuses for a specific driver with optional filtering
   * @param driverId The ID of the driver
   * @param filters Optional filters for payment status and date range
   * @returns Array of driver bonus records
   */
  async getDriverBonuses(driverId: string, filters: { paid?: boolean; startDate?: Date; endDate?: Date; minAmount?: number; maxAmount?: number; }): Promise<DriverBonusModel[]> {
    logger.info(`Retrieving bonuses for driver ${driverId}`, { driverId, filters });

    try {
      // Build a query for driver bonuses with the provided driver ID
      let query = DriverBonusModel.query().where('driverId', driverId);

      // If filters.paid is provided, filter by payment status
      if (filters.paid !== undefined) {
        query = query.where('paid', filters.paid);
      }

      // If filters.startDate is provided, filter by earnedAt >= startDate
      if (filters.startDate) {
        query = query.where('earnedAt', '>=', filters.startDate);
      }

      // If filters.endDate is provided, filter by earnedAt <= endDate
      if (filters.endDate) {
        query = query.where('earnedAt', '<=', filters.endDate);
      }

      // If filters.minAmount is provided, filter by bonusAmount >= minAmount
      if (filters.minAmount !== undefined) {
        query = query.where('bonusAmount', '>=', filters.minAmount);
      }

      // If filters.maxAmount is provided, filter by bonusAmount <= maxAmount
      if (filters.maxAmount !== undefined) {
        query = query.where('bonusAmount', '<=', filters.maxAmount);
      }

      // Execute the query and return the results
      const bonuses = await query;

      // Log the driver bonuses retrieval
      logger.debug(`Retrieved ${bonuses.length} bonuses for driver ${driverId}`, { driverId, bonusIds: bonuses.map(b => b.id) });

      return bonuses;
    } catch (error) {
      logger.error(`Error retrieving bonuses for driver ${driverId}`, { driverId, error });
      throw createError('Error retrieving driver bonuses', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Retrieves a specific driver bonus by its ID
   * @param bonusId The ID of the driver bonus
   * @returns The driver bonus if found, null otherwise
   */
  async getDriverBonusById(bonusId: string): Promise<DriverBonusModel | null> {
    logger.info(`Retrieving driver bonus by ID: ${bonusId}`);

    try {
      // Query the database for a driver bonus with the provided ID
      const bonus = await DriverBonusModel.query().findById(bonusId);

      // Log the bonus retrieval attempt
      logger.debug(`Bonus retrieval attempt for ID: ${bonusId}`, { bonusFound: !!bonus });

      // Return the bonus if found, null otherwise
      return bonus || null;
    } catch (error) {
      logger.error(`Error retrieving bonus by ID: ${bonusId}`, { bonusId, error });
      throw createError('Error retrieving driver bonus by ID', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Retrieves all unpaid bonuses for a specific driver
   * @param driverId The ID of the driver
   * @returns Array of unpaid bonus records
   */
  async getUnpaidBonusesForDriver(driverId: string): Promise<DriverBonusModel[]> {
    logger.info(`Retrieving unpaid bonuses for driver ${driverId}`);

    try {
      // Call DriverBonusModel.getUnpaidBonusesForDriver with the driver ID
      const unpaidBonuses = await DriverBonusModel.getUnpaidBonusesForDriver(driverId);

      // Log the unpaid bonuses retrieval
      logger.debug(`Retrieved ${unpaidBonuses.length} unpaid bonuses for driver ${driverId}`, { driverId, bonusIds: unpaidBonuses.map(b => b.id) });

      // Return the array of unpaid bonus records
      return unpaidBonuses;
    } catch (error) {
      logger.error(`Error retrieving unpaid bonuses for driver ${driverId}`, { driverId, error });
      throw createError('Error retrieving unpaid driver bonuses', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Calculates the total amount of unpaid bonuses for a driver
   * @param driverId The ID of the driver
   * @returns The total unpaid amount
   */
  async getTotalUnpaidAmount(driverId: string): Promise<number> {
    logger.info(`Calculating total unpaid amount for driver ${driverId}`);

    try {
      // Call DriverBonusModel.getTotalUnpaidAmount with the driver ID
      const totalUnpaidAmount = await DriverBonusModel.getTotalUnpaidAmount(driverId);

      // Log the total unpaid amount calculation
      logger.debug(`Total unpaid amount for driver ${driverId}: ${totalUnpaidAmount}`, { driverId, totalUnpaidAmount });

      // Return the total unpaid amount
      return totalUnpaidAmount;
    } catch (error) {
      logger.error(`Error calculating total unpaid amount for driver ${driverId}`, { driverId, error });
      throw createError('Error calculating total unpaid amount', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Creates a new bonus for a driver
   * @param driverId The ID of the driver
   * @param zoneId The ID of the bonus zone
   * @param assignmentId The ID of the load assignment
   * @param bonusAmount The amount of the bonus
   * @param bonusReason The reason for the bonus
   * @returns The newly created driver bonus
   */
  async createBonusForDriver(driverId: string, zoneId: string, assignmentId: string, bonusAmount: number, bonusReason: string): Promise<DriverBonusModel> {
    logger.info(`Creating bonus for driver ${driverId} in zone ${zoneId}`, { driverId, zoneId, assignmentId, bonusAmount, bonusReason });

    try {
      // Validate the bonus parameters
      if (!driverId || !zoneId || !assignmentId || !bonusAmount || !bonusReason) {
        throw createError('Missing required parameters for bonus creation', { code: ErrorCodes.VAL_MISSING_FIELD });
      }

      // Create a new DriverBonusModel instance with the provided data
      const newBonus = {
        driverId,
        zoneId,
        assignmentId,
        bonusAmount,
        bonusReason
      };
      const bonus = await DriverBonusModel.query().insert(newBonus);

      // Publish a REWARD_CREATED event
      await this.publishRewardEvent(EventTypes.REWARD_CREATED, {
        driver_id: driverId,
        bonus_id: bonus.id,
        zone_id: zoneId,
        assignment_id: assignmentId,
        bonus_amount: bonusAmount,
        bonus_reason: bonusReason
      });

      // Log the bonus creation
      logger.debug(`Created bonus for driver ${driverId} in zone ${zoneId}`, { driverId, bonusId: bonus.id, zoneId, assignmentId, bonusAmount, bonusReason });

      // Return the created bonus
      return bonus;
    } catch (error) {
      logger.error(`Error creating bonus for driver ${driverId} in zone ${zoneId}`, { driverId, zoneId, assignmentId, bonusAmount, bonusReason, error });
      throw createError('Error creating driver bonus', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Marks a bonus as paid
   * @param bonusId The ID of the bonus to mark as paid
   * @returns The updated driver bonus
   */
  async markBonusAsPaid(bonusId: string): Promise<DriverBonusModel> {
    logger.info(`Marking bonus ${bonusId} as paid`);

    try {
      // Get the bonus by ID
      const bonus = await this.getDriverBonusById(bonusId);

      // If not found, throw a NOT_FOUND error
      if (!bonus) {
        throw createError(`Bonus not found with ID: ${bonusId}`, { code: ErrorCodes.NOT_FOUND });
      }

      // Call the bonus's markAsPaid method
      const updatedBonus = await bonus.markAsPaid();

      // Publish a REWARD_ISSUED event
      await this.publishRewardEvent(EventTypes.REWARD_ISSUED, {
        driver_id: updatedBonus.driverId,
        bonus_id: updatedBonus.id,
        bonus_amount: updatedBonus.bonusAmount
      });

      logger.debug(`Bonus ${bonusId} marked as paid`, { bonusId });

      // Return the updated bonus
      return updatedBonus;
    } catch (error) {
      logger.error(`Error marking bonus ${bonusId} as paid`, { bonusId, error });
      throw createError('Error marking bonus as paid', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Processes rewards for top-ranked drivers in a leaderboard
   * @param leaderboardId The ID of the leaderboard
   * @returns Array of processed rewards
   */
  async processLeaderboardRewards(leaderboardId: string): Promise<{ driverId: string; rank: number; bonusAmount: number; }[]> {
    logger.info(`Processing leaderboard rewards for leaderboard ${leaderboardId}`);

    try {
      // Get the leaderboard by ID
      const leaderboard = await this.leaderboardService.getLeaderboardById(leaderboardId);

      // If not found, throw a NOT_FOUND error
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, { code: ErrorCodes.NOT_FOUND });
      }

      // Get the top entries from the leaderboard
      const topEntries = await this.leaderboardService.getTopLeaderboardEntries(leaderboardId, 50);

      const processedRewards: { driverId: string; rank: number; bonusAmount: number; }[] = [];

      // For each top entry, calculate the bonus amount based on rank
      for (const entry of topEntries) {
        const bonusAmount = leaderboard.getBonusAmount(entry.rank);

        // Create a bonus record for each eligible driver
        const bonusReason = `Leaderboard reward for rank ${entry.rank} in ${leaderboard.name}`;
        await this.createBonusForDriver(entry.driverId, 'leaderboard', leaderboardId, bonusAmount, bonusReason);

        // Mark the bonus as paid in the leaderboard entry
        await LeaderboardEntryModel.query().patchAndFetchById(entry.entry_id, { bonus_amount: bonusAmount, bonus_paid: true });

        processedRewards.push({
          driverId: entry.driver_id,
          rank: entry.rank,
          bonusAmount: bonusAmount
        });
      }

      logger.debug(`Processed leaderboard rewards for ${topEntries.length} drivers in leaderboard ${leaderboardId}`, { leaderboardId, driverCount: topEntries.length });

      // Return the array of processed rewards
      return processedRewards;
    } catch (error) {
      logger.error(`Error processing leaderboard rewards for leaderboard ${leaderboardId}`, { leaderboardId, error });
      throw createError('Error processing leaderboard rewards', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Processes rewards for newly earned achievements
   * @param driverId The ID of the driver
   * @param achievementId The ID of the achievement
   * @returns The created bonus if applicable, null otherwise
   */
  async processAchievementRewards(driverId: string, achievementId: string): Promise<DriverBonusModel | null> {
    logger.info(`Processing achievement rewards for driver ${driverId} and achievement ${achievementId}`);

    try {
      // Get the achievement by ID
      const achievement = await this.achievementService.getAchievementById(achievementId);

      // If not found, throw a NOT_FOUND error
      if (!achievement) {
        throw createError(`Achievement not found with ID: ${achievementId}`, { code: ErrorCodes.NOT_FOUND });
      }

      // Check if the achievement has an associated reward value
      if (!achievement.points || achievement.points <= 0) {
        logger.info(`Achievement ${achievementId} has no reward value`, { achievementId });
        return null;
      }

      // Create a bonus record for the driver with the achievement reward amount
      const bonusReason = `Achievement reward for ${achievement.name}`;
      const bonus = await this.createBonusForDriver(driverId, 'achievement', achievementId, achievement.points, bonusReason);

      logger.debug(`Created bonus for driver ${driverId} for achievement ${achievementId}`, { driverId, achievementId, bonusId: bonus.id });

      // Return the created bonus
      return bonus;
    } catch (error) {
      logger.error(`Error processing achievement rewards for driver ${driverId} and achievement ${achievementId}`, { driverId, achievementId, error });
      throw createError('Error processing achievement rewards', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Processes rewards for drivers operating in bonus zones
   * @param driverId The ID of the driver
   * @param assignmentId The ID of the load assignment
   * @param position The driver's current position
   * @returns The created bonus if applicable, null otherwise
   */
  async processBonusZoneRewards(driverId: string, assignmentId: string, position: Position): Promise<DriverBonusModel | null> {
    logger.info(`Processing bonus zone rewards for driver ${driverId} at position`, { driverId, assignmentId, position });

    try {
      // Get active bonus zones that contain the provided position
      const { inBonusZone, bonusZone } = await this.bonusZoneService.checkPositionInBonusZone(position);

      // If no applicable zones, return null
      if (!inBonusZone || !bonusZone) {
        logger.info(`No active bonus zones found for position`, { latitude: position.latitude, longitude: position.longitude });
        return null;
      }

      // For the applicable zone, calculate the bonus amount based on the zone multiplier
      const bonusAmount = bonusZone.multiplier * 100; // Example calculation

      // Create a bonus record for the driver with the calculated amount
      const bonusReason = `Bonus zone reward for operating in ${bonusZone.name}`;
      const bonus = await this.createBonusForDriver(driverId, bonusZone.id, assignmentId, bonusAmount, bonusReason);

      logger.debug(`Created bonus for driver ${driverId} in bonus zone ${bonusZone.id}`, { driverId, bonusZoneId: bonusZone.id, bonusAmount });

      // Return the created bonus
      return bonus;
    } catch (error) {
      logger.error(`Error processing bonus zone rewards for driver ${driverId} at position`, { driverId, assignmentId, position, error });
      throw createError('Error processing bonus zone rewards', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Processes rewards for completing a load assignment
   * @param driverId The ID of the driver
   * @param loadAssignment The completed load assignment
   * @returns Array of created bonuses
   */
  async processLoadCompletionRewards(driverId: string, loadAssignment: LoadAssignment): Promise<DriverBonusModel[]> {
    logger.info(`Processing load completion rewards for driver ${driverId} and load ${loadAssignment.load_id}`);

    try {
      const createdBonuses: DriverBonusModel[] = [];

      // Calculate the driver's new score based on the completed load
      const newScore = await this.scoreService.calculateScoreForLoad(driverId, loadAssignment, {});

      // Check for achievement unlocks based on the new score
      const achievementProgress = await this.achievementService.checkAchievements(driverId);

      // Check if the load delivery location is in any bonus zones
      const deliveryPosition: Position = {
        latitude: 0, //loadAssignment.delivery_latitude,
        longitude: 0, //loadAssignment.delivery_longitude,
        heading: 0,
        speed: 0,
        accuracy: 0,
        source: 'system',
        timestamp: new Date()
      };
      const { inBonusZone, bonusZone } = await this.bonusZoneService.checkPositionInBonusZone(deliveryPosition);

      // Process any applicable achievement rewards
      if (achievementProgress && achievementProgress.length > 0) {
        for (const progress of achievementProgress) {
          if (progress.isCompleted) {
            const achievementBonus = await this.processAchievementRewards(driverId, progress.achievementId);
            if (achievementBonus) {
              createdBonuses.push(achievementBonus);
            }
          }
        }
      }

      // Process any applicable bonus zone rewards
      if (inBonusZone && bonusZone) {
        const bonusZoneBonus = await this.processBonusZoneRewards(driverId, loadAssignment.assignment_id, deliveryPosition);
        if (bonusZoneBonus) {
          createdBonuses.push(bonusZoneBonus);
        }
      }

      logger.debug(`Processed load completion rewards for driver ${driverId} and load ${loadAssignment.load_id}`, { driverId, loadId: loadAssignment.load_id, bonusesCreated: createdBonuses.length });

      // Return the array of created bonuses
      return createdBonuses;
    } catch (error) {
      logger.error(`Error processing load completion rewards for driver ${driverId} and load ${loadAssignment.load_id}`, { driverId, loadId: loadAssignment.load_id, error });
      throw createError('Error processing load completion rewards', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Processes fuel discount rewards based on driver efficiency score
   * @param driverId The ID of the driver
   * @returns The calculated fuel discount
   */
  async processFuelDiscountRewards(driverId: string): Promise<{ discountPercentage: number; discountAmount: number; }> {
    logger.info(`Processing fuel discount rewards for driver ${driverId}`);

    try {
      // Get the driver's current efficiency score
      const driverScore = await this.getDriverScore(driverId);

      // If no score is found, return default values
      if (!driverScore) {
        logger.warn(`No score found for driver ${driverId}, returning default fuel discount`);
        return { discountPercentage: 0, discountAmount: 0 };
      }

      // Calculate the discount percentage based on the score (higher score = higher discount)
      let discountPercentage = 0;
      if (driverScore.total_score >= 90) {
        discountPercentage = 0.10; // 10% discount
      } else if (driverScore.total_score >= 80) {
        discountPercentage = 0.05; // 5% discount
      }

      // Apply any additional bonuses for using AI-recommended routes
      // Placeholder - implement additional bonus logic here

      // Calculate the discount amount (example: 10% on $500 fuel purchase)
      const fuelPurchaseAmount = 500; // Placeholder - replace with actual fuel purchase amount
      const discountAmount = fuelPurchaseAmount * discountPercentage;

      logger.debug(`Calculated fuel discount for driver ${driverId}`, { driverId, discountPercentage, discountAmount });

      // Return the calculated discount information
      return { discountPercentage, discountAmount };
    } catch (error) {
      logger.error(`Error processing fuel discount rewards for driver ${driverId}`, { driverId, error });
      throw createError('Error processing fuel discount rewards', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Processes weekly bonuses for all active weekly leaderboards
   * @returns Array of processed weekly bonuses by leaderboard
   */
  async processWeeklyBonuses(): Promise<{ leaderboardId: string; rewards: { driverId: string; rank: number; bonusAmount: number; }[]; }[]> {
    logger.info('Processing weekly bonuses for all active weekly leaderboards');

    try {
      // Get all active weekly leaderboards
      const weeklyLeaderboards = await this.leaderboardService.getActiveLeaderboards({ timeframe: 'weekly' });

      const allProcessedBonuses: { leaderboardId: string; rewards: { driverId: string; rank: number; bonusAmount: number; }[]; }[] = [];

      // For each leaderboard, process the rewards for top-ranked drivers
      for (const leaderboard of weeklyLeaderboards) {
        const processedBonuses = await this.processLeaderboardRewards(leaderboard.id);
        allProcessedBonuses.push({
          leaderboardId: leaderboard.id,
          rewards: processedBonuses
        });
      }

      logger.info(`Processed weekly bonuses for ${weeklyLeaderboards.length} leaderboards`, { leaderboardCount: weeklyLeaderboards.length });

      // Return the array of processed weekly bonuses
      return allProcessedBonuses;
    } catch (error) {
      logger.error('Error processing weekly bonuses', { error });
      throw createError('Error processing weekly bonuses', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Processes monthly bonuses for all active monthly leaderboards
   * @returns Array of processed monthly bonuses by leaderboard
   */
  async processMonthlyBonuses(): Promise<{ leaderboardId: string; rewards: { driverId: string; rank: number; bonusAmount: number; }[]; }[]> {
    logger.info('Processing monthly bonuses for all active monthly leaderboards');

    try {
      // Get all active monthly leaderboards
      const monthlyLeaderboards = await this.leaderboardService.getActiveLeaderboards({ timeframe: 'monthly' });

      const allProcessedBonuses: { leaderboardId: string; rewards: { driverId: string; rank: number; bonusAmount: number; }[]; }[] = [];

      // For each leaderboard, process the rewards for top-ranked drivers
      for (const leaderboard of monthlyLeaderboards) {
        const processedBonuses = await this.processLeaderboardRewards(leaderboard.id);
        allProcessedBonuses.push({
          leaderboardId: leaderboard.id,
          rewards: processedBonuses
        });
      }

      logger.info(`Processed monthly bonuses for ${monthlyLeaderboards.length} leaderboards`, { leaderboardCount: monthlyLeaderboards.length });

      // Return the array of processed monthly bonuses
      return allProcessedBonuses;
    } catch (error) {
      logger.error('Error processing monthly bonuses', { error });
      throw createError('Error processing monthly bonuses', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Gets a summary of all rewards for a driver
   * @param driverId The ID of the driver
   * @param startDate The start date for the summary
   * @param endDate The end date for the summary
   * @returns Summary of driver rewards
   */
  async getDriverRewardSummary(driverId: string, startDate: Date, endDate: Date): Promise<{ totalBonuses: number; paidBonuses: number; unpaidBonuses: number; bonusesByType: Record<string, number>; fuelDiscounts: number; }> {
    logger.info(`Getting reward summary for driver ${driverId}`, { driverId, startDate, endDate });

    try {
      // Get all bonuses for the driver within the date range
      const bonuses = await this.getDriverBonuses(driverId, { startDate, endDate });

      // Calculate the total bonus amount
      const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);

      // Calculate the paid and unpaid bonus amounts
      const paidBonuses = bonuses.filter(bonus => bonus.paid).reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
      const unpaidBonuses = bonuses.filter(bonus => !bonus.paid).reduce((sum, bonus) => sum + bonus.bonusAmount, 0);

      // Categorize bonuses by type (achievement, leaderboard, bonus zone)
      const bonusesByType: Record<string, number> = {};
      bonuses.forEach(bonus => {
        const type = bonus.zoneId === 'leaderboard' ? 'leaderboard' : bonus.zoneId === 'achievement' ? 'achievement' : 'bonus_zone';
        bonusesByType[type] = (bonusesByType[type] || 0) + bonus.bonusAmount;
      });

      // Calculate the total fuel discounts earned
      const fuelDiscounts = 0; // Placeholder - replace with actual calculation

      logger.debug(`Reward summary for driver ${driverId}`, { driverId, totalBonuses, paidBonuses, unpaidBonuses, bonusesByType, fuelDiscounts });

      // Return the comprehensive reward summary
      return {
        totalBonuses,
        paidBonuses,
        unpaidBonuses,
        bonusesByType,
        fuelDiscounts
      };
    } catch (error) {
      logger.error(`Error getting reward summary for driver ${driverId}`, { driverId, startDate, endDate, error });
      throw createError('Error getting driver reward summary', { code: ErrorCodes.DB_QUERY_ERROR, details: { error } });
    }
  }

  /**
   * Publishes a reward-related event to the event bus
   * @param eventType The type of event to publish
   * @param payload The event payload
   */
  private async publishRewardEvent(eventType: string, payload: Record<string, any>): Promise<void> {
    try {
      // Create a GamificationEvent object with the appropriate metadata
      const event: GamificationEvent = {
        metadata: this.createEventMetadata(eventType),
        payload
      };

      // Call the eventProducer's produceEvent method to publish the event
      await this.eventProducer.produceEvent(event);

      // Log the event publication
      logger.debug(`Published reward event: ${eventType}`, { eventId: event.metadata.event_id });
    } catch (error) {
      logger.error(`Error publishing reward event: ${eventType}`, { payload, error });
      // Don't rethrow - event publishing should not break the main flow
    }
  }

  /**
   * Creates standardized event metadata for reward events
   * @param eventType The type of event
   * @returns Event metadata object
   */
  private createEventMetadata(eventType: string): { event_id: string; event_type: string; event_version: string; event_time: string; producer: string; correlation_id: string; category: string; } {
    // Generate a unique event ID using uuidv4
    const eventId = uuidv4();

    // Return the constructed metadata object
    return {
      event_id: eventId,
      event_type: eventType,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: 'gamification-service',
      correlation_id: uuidv4(),
      category: EventCategories.GAMIFICATION
    };
  }
}

export default RewardService;