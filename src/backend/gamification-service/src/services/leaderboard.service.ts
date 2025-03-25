import { transaction } from 'objection'; // v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0

import LeaderboardModel from '../models/leaderboard.model';
import LeaderboardEntryModel from '../models/leaderboard-entry.model';
import DriverScoreModel from '../models/driver-score.model';
import { Driver } from '../../../common/interfaces/driver.interface';
import { EventProducer, GamificationEvent } from '../../../common/interfaces/event.interface';
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';

/**
 * Service class that manages leaderboards and driver rankings in the gamification system
 * Handles creating, updating, and querying leaderboards that rank drivers based on their efficiency scores
 * 
 * Implements requirements from:
 * - F-005: Leaderboards & AI-Powered Rewards
 * - Driver Management Screen: Driver Leaderboard
 * - Driver Mobile Application: Earnings and Leaderboard Screen
 */
class LeaderboardService {
  private eventProducer: EventProducer;

  /**
   * Creates a new LeaderboardService instance
   * @param eventProducer Event producer for publishing leaderboard events
   */
  constructor(eventProducer: EventProducer) {
    this.eventProducer = eventProducer;
    logger.info('LeaderboardService initialized');
  }

  /**
   * Creates a new leaderboard with the specified parameters
   * @param leaderboardData Data for creating the leaderboard
   * @returns The newly created leaderboard
   */
  async createLeaderboard(leaderboardData: {
    name: string;
    leaderboard_type: string;
    timeframe: string;
    region?: string;
    start_period: Date;
    end_period: Date;
    bonus_structure?: Record<string, number>;
  }): Promise<LeaderboardModel> {
    try {
      // Validate the leaderboard data
      if (!leaderboardData.name || !leaderboardData.leaderboard_type || !leaderboardData.timeframe) {
        throw createError('Missing required leaderboard fields', {
          code: ErrorCodes.VAL_MISSING_FIELD
        });
      }

      if (!leaderboardData.start_period || !leaderboardData.end_period) {
        throw createError('Start and end periods are required', {
          code: ErrorCodes.VAL_MISSING_FIELD
        });
      }

      if (new Date(leaderboardData.start_period) >= new Date(leaderboardData.end_period)) {
        throw createError('Start period must be before end period', {
          code: ErrorCodes.VAL_CONSTRAINT_VIOLATION
        });
      }

      // Create the leaderboard
      const leaderboard = await LeaderboardModel.query().insert(leaderboardData);
      
      logger.info(`Created new leaderboard: ${leaderboard.id}`, {
        leaderboardId: leaderboard.id,
        leaderboardType: leaderboard.leaderboard_type,
        timeframe: leaderboard.timeframe
      });

      // Publish leaderboard created event
      await this.publishLeaderboardEvent(EventTypes.LEADERBOARD_UPDATED, {
        leaderboard_id: leaderboard.id,
        action: 'created',
        leaderboard_data: {
          name: leaderboard.name,
          type: leaderboard.leaderboard_type,
          timeframe: leaderboard.timeframe,
          region: leaderboard.region,
          start_period: leaderboard.start_period,
          end_period: leaderboard.end_period
        }
      });

      return leaderboard;
    } catch (error) {
      logger.error('Error creating leaderboard', { error });
      throw error;
    }
  }

  /**
   * Retrieves a leaderboard by its ID
   * @param leaderboardId The ID of the leaderboard to retrieve
   * @returns The leaderboard if found, null otherwise
   */
  async getLeaderboardById(leaderboardId: string): Promise<LeaderboardModel | null> {
    try {
      const leaderboard = await LeaderboardModel.query().findById(leaderboardId);
      
      logger.debug(`Retrieved leaderboard by ID: ${leaderboardId}`, {
        leaderboardFound: !!leaderboard
      });
      
      return leaderboard;
    } catch (error) {
      logger.error('Error retrieving leaderboard by ID', {
        leaderboardId,
        error
      });
      
      throw error;
    }
  }

  /**
   * Retrieves all active leaderboards with optional filtering
   * @param filters Optional filters for region, leaderboardType, and timeframe
   * @returns Array of active leaderboards
   */
  async getActiveLeaderboards(filters: {
    region?: string;
    leaderboardType?: string;
    timeframe?: string;
  } = {}): Promise<LeaderboardModel[]> {
    try {
      const leaderboards = await LeaderboardModel.findActive(filters);
      
      logger.debug('Retrieved active leaderboards', {
        count: leaderboards.length,
        filters
      });
      
      return leaderboards;
    } catch (error) {
      logger.error('Error retrieving active leaderboards', {
        filters,
        error
      });
      
      throw error;
    }
  }

  /**
   * Retrieves leaderboards that are currently active for the given date
   * @param date The date to check, defaults to current date
   * @param filters Optional filters for region, leaderboardType, and timeframe
   * @returns Array of current leaderboards
   */
  async getCurrentLeaderboards(date: Date = new Date(), filters: {
    region?: string;
    leaderboardType?: string;
    timeframe?: string;
    isActive?: boolean;
  } = {}): Promise<LeaderboardModel[]> {
    try {
      const leaderboards = await LeaderboardModel.findByPeriod(date, filters);
      
      logger.debug('Retrieved current leaderboards', {
        date: date.toISOString(),
        count: leaderboards.length,
        filters
      });
      
      return leaderboards;
    } catch (error) {
      logger.error('Error retrieving current leaderboards', {
        date: date.toISOString(),
        filters,
        error
      });
      
      throw error;
    }
  }

  /**
   * Retrieves entries for a specific leaderboard with pagination
   * @param leaderboardId The ID of the leaderboard
   * @param page The page number (1-based)
   * @param pageSize The number of entries per page
   * @returns Paginated leaderboard entries with metadata
   */
  async getLeaderboardEntries(
    leaderboardId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ entries: LeaderboardEntryModel[]; total: number; page: number; pageSize: number; }> {
    try {
      const leaderboard = await this.getLeaderboardById(leaderboardId);
      
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, {
          code: ErrorCodes.RES_LOAD_NOT_FOUND
        });
      }
      
      const { entries, total } = await leaderboard.getEntries(page, pageSize);
      
      logger.debug('Retrieved leaderboard entries', {
        leaderboardId,
        page,
        pageSize,
        totalEntries: total
      });
      
      return {
        entries,
        total,
        page,
        pageSize
      };
    } catch (error) {
      logger.error('Error retrieving leaderboard entries', {
        leaderboardId,
        page,
        pageSize,
        error
      });
      
      throw error;
    }
  }

  /**
   * Retrieves the top N entries for a specific leaderboard
   * @param leaderboardId The ID of the leaderboard
   * @param limit The maximum number of entries to retrieve
   * @returns Array of top leaderboard entries
   */
  async getTopLeaderboardEntries(
    leaderboardId: string,
    limit: number = 10
  ): Promise<LeaderboardEntryModel[]> {
    try {
      const leaderboard = await this.getLeaderboardById(leaderboardId);
      
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, {
          code: ErrorCodes.RES_LOAD_NOT_FOUND
        });
      }
      
      const entries = await leaderboard.getTopEntries(limit);
      
      logger.debug('Retrieved top leaderboard entries', {
        leaderboardId,
        limit,
        entriesRetrieved: entries.length
      });
      
      return entries;
    } catch (error) {
      logger.error('Error retrieving top leaderboard entries', {
        leaderboardId,
        limit,
        error
      });
      
      throw error;
    }
  }

  /**
   * Retrieves a driver's entry in a specific leaderboard
   * @param leaderboardId The ID of the leaderboard
   * @param driverId The ID of the driver
   * @returns The driver's leaderboard entry if found, null otherwise
   */
  async getDriverLeaderboardEntry(
    leaderboardId: string,
    driverId: string
  ): Promise<LeaderboardEntryModel | null> {
    try {
      const leaderboard = await this.getLeaderboardById(leaderboardId);
      
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, {
          code: ErrorCodes.RES_LOAD_NOT_FOUND
        });
      }
      
      const entry = await leaderboard.getDriverEntry(driverId);
      
      logger.debug('Retrieved driver leaderboard entry', {
        leaderboardId,
        driverId,
        entryFound: !!entry
      });
      
      return entry;
    } catch (error) {
      logger.error('Error retrieving driver leaderboard entry', {
        leaderboardId,
        driverId,
        error
      });
      
      throw error;
    }
  }

  /**
   * Retrieves all leaderboard entries for a specific driver with pagination
   * @param driverId The ID of the driver
   * @param filters Optional filters
   * @param page The page number (1-based)
   * @param pageSize The number of entries per page
   * @returns Paginated driver leaderboard entries with metadata
   */
  async getDriverLeaderboardEntries(
    driverId: string,
    filters: {
      timeframe?: string;
      leaderboardType?: string;
      region?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ entries: LeaderboardEntryModel[]; total: number; page: number; pageSize: number; }> {
    try {
      const { entries, total } = await LeaderboardEntryModel.getDriverEntries(
        driverId,
        filters,
        page,
        pageSize
      );
      
      logger.debug('Retrieved driver leaderboard entries', {
        driverId,
        filters,
        page,
        pageSize,
        totalEntries: total
      });
      
      return {
        entries,
        total,
        page,
        pageSize
      };
    } catch (error) {
      logger.error('Error retrieving driver leaderboard entries', {
        driverId,
        filters,
        page,
        pageSize,
        error
      });
      
      throw error;
    }
  }

  /**
   * Updates a driver's ranking in relevant leaderboards based on their new score
   * @param driverId The ID of the driver
   * @param scoreModel The driver's score model
   * @returns Array of updated leaderboard entries
   */
  async updateDriverRanking(
    driverId: string,
    scoreModel: DriverScoreModel
  ): Promise<LeaderboardEntryModel[]> {
    try {
      // Get the driver details to access region information
      // Using Driver service/repository to get driver information
      const driverService = require('../driver/driver.service');
      const driver = await driverService.getDriverById(driverId);
      
      if (!driver) {
        throw createError(`Driver not found with ID: ${driverId}`, {
          code: ErrorCodes.RES_DRIVER_NOT_FOUND
        });
      }
      
      // Find all active leaderboards that the driver should be part of
      const currentDate = new Date();
      const relevantLeaderboards = await this.getCurrentLeaderboards(currentDate, {
        region: driver.carrier?.region, // Filter by driver's region if available
        isActive: true
      });
      
      if (relevantLeaderboards.length === 0) {
        logger.info('No active leaderboards found for driver', {
          driverId,
          region: driver.carrier?.region
        });
        return [];
      }
      
      // Array to store updated entries
      const updatedEntries: LeaderboardEntryModel[] = [];
      
      // Update the driver's ranking in each relevant leaderboard
      for (const leaderboard of relevantLeaderboards) {
        // Using transaction to ensure atomic updates
        await transaction(LeaderboardModel.knex(), async (trx) => {
          // Check if the driver already has an entry in this leaderboard
          let entry = await LeaderboardEntryModel.query(trx)
            .findOne({
              leaderboard_id: leaderboard.id,
              driver_id: driverId
            });
          
          const previousRank = entry?.rank || 0;
          
          // If no entry exists, create one
          if (!entry) {
            entry = await LeaderboardEntryModel.query(trx).insert({
              leaderboard_id: leaderboard.id,
              driver_id: driverId,
              driver_name: `${driver.first_name} ${driver.last_name}`,
              rank: 999999, // Temporary high rank to be updated
              previous_rank: 0,
              rank_change: 0,
              score: scoreModel.total_score,
              bonus_amount: 0,
              bonus_paid: false
            });
          } else {
            // Update the existing entry with the new score
            entry = await entry.$query(trx).patchAndFetch({
              score: scoreModel.total_score,
              previous_rank: entry.rank,
              updated_at: new Date()
            });
          }
          
          // Get all entries for this leaderboard to recalculate ranks
          const allEntries = await LeaderboardEntryModel.query(trx)
            .where('leaderboard_id', leaderboard.id)
            .orderBy('score', 'desc');
          
          // Update ranks for all entries
          for (let i = 0; i < allEntries.length; i++) {
            const currentEntry = allEntries[i];
            const newRank = i + 1;
            
            if (currentEntry.rank !== newRank) {
              await currentEntry.$query(trx).patchAndFetch({
                rank: newRank,
                rank_change: currentEntry.previous_rank ? currentEntry.previous_rank - newRank : 0
              });
            }
          }
          
          // Fetch the updated entry
          entry = await LeaderboardEntryModel.query(trx)
            .findOne({
              leaderboard_id: leaderboard.id,
              driver_id: driverId
            });
          
          if (entry) {
            updatedEntries.push(entry);
            
            // Update leaderboard's last_updated timestamp
            await leaderboard.$query(trx).patchAndFetch({
              last_updated: new Date()
            });
            
            // If rank changed significantly, publish an event
            if (previousRank !== entry.rank && (previousRank === 0 || Math.abs(previousRank - entry.rank) >= 3)) {
              await this.publishLeaderboardEvent(EventTypes.LEADERBOARD_RANK_CHANGED, {
                leaderboard_id: leaderboard.id,
                driver_id: driverId,
                previous_rank: previousRank,
                new_rank: entry.rank,
                score: entry.score
              });
            }
          }
        });
      }
      
      logger.info('Updated driver rankings in leaderboards', {
        driverId,
        leaderboardsUpdated: updatedEntries.length,
        newScore: scoreModel.total_score
      });
      
      return updatedEntries;
    } catch (error) {
      logger.error('Error updating driver ranking', {
        driverId,
        error
      });
      
      throw error;
    }
  }

  /**
   * Recalculates all rankings for a specific leaderboard
   * @param leaderboardId The ID of the leaderboard to recalculate
   * @returns The updated leaderboard
   */
  async recalculateLeaderboard(leaderboardId: string): Promise<LeaderboardModel> {
    try {
      const leaderboard = await this.getLeaderboardById(leaderboardId);
      
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, {
          code: ErrorCodes.RES_LOAD_NOT_FOUND
        });
      }
      
      // Using transaction to ensure atomic updates
      return await transaction(LeaderboardModel.knex(), async (trx) => {
        // Get all driver scores relevant to this leaderboard
        // This would typically involve getting scores for drivers in the relevant region
        // and within the leaderboard's time period
        
        // For this implementation, we'll simply get all entries and resort them
        const entries = await LeaderboardEntryModel.query(trx)
          .where('leaderboard_id', leaderboardId)
          .orderBy('score', 'desc');
        
        // Update ranks for all entries
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const newRank = i + 1;
          
          if (entry.rank !== newRank) {
            await entry.$query(trx).patchAndFetch({
              previous_rank: entry.rank,
              rank: newRank,
              rank_change: entry.rank - newRank
            });
          }
        }
        
        // Update the leaderboard's last_updated timestamp
        const updatedLeaderboard = await leaderboard.$query(trx).patchAndFetch({
          last_updated: new Date()
        });
        
        // Publish leaderboard updated event
        await this.publishLeaderboardEvent(EventTypes.LEADERBOARD_UPDATED, {
          leaderboard_id: leaderboardId,
          action: 'recalculated',
          entry_count: entries.length
        });
        
        logger.info('Recalculated leaderboard rankings', {
          leaderboardId,
          entriesProcessed: entries.length
        });
        
        return updatedLeaderboard;
      });
    } catch (error) {
      logger.error('Error recalculating leaderboard', {
        leaderboardId,
        error
      });
      
      throw error;
    }
  }

  /**
   * Processes leaderboards that are ending soon, finalizing rankings and creating new periods
   * @param daysThreshold Number of days threshold for ending leaderboards (default: 1)
   * @returns Arrays of ended and newly created leaderboards
   */
  async processEndingLeaderboards(
    daysThreshold: number = 1
  ): Promise<{ ended: LeaderboardModel[]; created: LeaderboardModel[] }> {
    try {
      // Find leaderboards that are ending within the threshold
      const endingLeaderboards = await LeaderboardModel.findEndingSoon(daysThreshold);
      
      if (endingLeaderboards.length === 0) {
        logger.info('No leaderboards ending soon');
        return { ended: [], created: [] };
      }
      
      const endedLeaderboards: LeaderboardModel[] = [];
      const createdLeaderboards: LeaderboardModel[] = [];
      
      // Process each ending leaderboard
      for (const leaderboard of endingLeaderboards) {
        // Finalize the rankings
        await this.finalizeLeaderboardRankings(leaderboard.id);
        
        // Process bonus payments
        await this.processBonusPayments(leaderboard.id);
        
        // Create new leaderboard for the next period
        const newLeaderboard = await this.createNextPeriodLeaderboard(leaderboard.id);
        
        // Deactivate the ended leaderboard
        const deactivatedLeaderboard = await leaderboard.deactivate();
        
        endedLeaderboards.push(deactivatedLeaderboard);
        createdLeaderboards.push(newLeaderboard);
        
        // Publish leaderboard period ended event
        await this.publishLeaderboardEvent(EventTypes.LEADERBOARD_PERIOD_ENDED, {
          leaderboard_id: leaderboard.id,
          new_leaderboard_id: newLeaderboard.id,
          period: {
            start: leaderboard.start_period,
            end: leaderboard.end_period
          },
          next_period: {
            start: newLeaderboard.start_period,
            end: newLeaderboard.end_period
          }
        });
      }
      
      logger.info('Processed ending leaderboards', {
        processedCount: endingLeaderboards.length,
        endedCount: endedLeaderboards.length,
        createdCount: createdLeaderboards.length
      });
      
      return {
        ended: endedLeaderboards,
        created: createdLeaderboards
      };
    } catch (error) {
      logger.error('Error processing ending leaderboards', {
        daysThreshold,
        error
      });
      
      throw error;
    }
  }

  /**
   * Finalizes the rankings for a leaderboard, typically called when a leaderboard period ends
   * @param leaderboardId The ID of the leaderboard to finalize
   * @returns The finalized leaderboard
   */
  async finalizeLeaderboardRankings(leaderboardId: string): Promise<LeaderboardModel> {
    try {
      const leaderboard = await this.getLeaderboardById(leaderboardId);
      
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, {
          code: ErrorCodes.RES_LOAD_NOT_FOUND
        });
      }
      
      // First, recalculate all rankings to ensure they're accurate
      await this.recalculateLeaderboard(leaderboardId);
      
      // Mark the leaderboard as finalized by updating is_active to false
      const finalizedLeaderboard = await leaderboard.$query().patchAndFetch({
        is_active: false,
        updated_at: new Date()
      });
      
      logger.info('Finalized leaderboard rankings', {
        leaderboardId,
        name: leaderboard.name
      });
      
      return finalizedLeaderboard;
    } catch (error) {
      logger.error('Error finalizing leaderboard rankings', {
        leaderboardId,
        error
      });
      
      throw error;
    }
  }

  /**
   * Processes bonus payments for top-ranked drivers in a finalized leaderboard
   * @param leaderboardId The ID of the leaderboard
   * @returns Array of processed bonus payments
   */
  async processBonusPayments(
    leaderboardId: string
  ): Promise<{ driverId: string; rank: number; bonusAmount: number }[]> {
    try {
      const leaderboard = await this.getLeaderboardById(leaderboardId);
      
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, {
          code: ErrorCodes.RES_LOAD_NOT_FOUND
        });
      }
      
      // Get the top entries from the leaderboard
      const topEntries = await this.getTopLeaderboardEntries(leaderboardId, 50);
      
      if (topEntries.length === 0) {
        logger.info('No entries found for bonus payments', { leaderboardId });
        return [];
      }
      
      const processedBonuses: { driverId: string; rank: number; bonusAmount: number }[] = [];
      
      // Process bonus payments for each qualifying entry
      for (const entry of topEntries) {
        // Get the bonus amount based on the driver's rank
        const bonusAmount = leaderboard.getBonusAmount(entry.rank);
        
        if (bonusAmount > 0) {
          // Update the entry with the bonus amount and mark as paid
          await entry.$query().patchAndFetch({
            bonus_amount: bonusAmount,
            bonus_paid: true,
            updated_at: new Date()
          });
          
          // Record the processed bonus
          processedBonuses.push({
            driverId: entry.driver_id,
            rank: entry.rank,
            bonusAmount
          });
          
          // TODO: Integrate with payment service to trigger actual payment
          // This would typically involve calling a payment service or adding to a payment queue
          logger.info('Processed bonus payment', {
            leaderboardId,
            driverId: entry.driver_id,
            rank: entry.rank,
            bonusAmount
          });
        }
      }
      
      logger.info('Completed bonus payment processing', {
        leaderboardId,
        paymentsProcessed: processedBonuses.length,
        totalAmount: processedBonuses.reduce((sum, item) => sum + item.bonusAmount, 0)
      });
      
      return processedBonuses;
    } catch (error) {
      logger.error('Error processing bonus payments', {
        leaderboardId,
        error
      });
      
      throw error;
    }
  }

  /**
   * Creates a new leaderboard for the next time period based on an existing leaderboard
   * @param leaderboardId The ID of the existing leaderboard
   * @returns The newly created leaderboard for the next period
   */
  async createNextPeriodLeaderboard(leaderboardId: string): Promise<LeaderboardModel> {
    try {
      const leaderboard = await this.getLeaderboardById(leaderboardId);
      
      if (!leaderboard) {
        throw createError(`Leaderboard not found with ID: ${leaderboardId}`, {
          code: ErrorCodes.RES_LOAD_NOT_FOUND
        });
      }
      
      // Generate the next period leaderboard
      const newLeaderboard = await leaderboard.generateNextPeriod();
      
      logger.info('Created next period leaderboard', {
        previousLeaderboardId: leaderboardId,
        newLeaderboardId: newLeaderboard.id,
        name: newLeaderboard.name,
        startPeriod: newLeaderboard.start_period,
        endPeriod: newLeaderboard.end_period
      });
      
      return newLeaderboard;
    } catch (error) {
      logger.error('Error creating next period leaderboard', {
        leaderboardId,
        error
      });
      
      throw error;
    }
  }

  /**
   * Publishes a leaderboard-related event to the event bus
   * @param eventType The type of event to publish
   * @param payload The event payload
   */
  private async publishLeaderboardEvent(
    eventType: string,
    payload: Record<string, any>
  ): Promise<void> {
    try {
      // Create the event with metadata
      const event: GamificationEvent = {
        metadata: this.createEventMetadata(eventType),
        payload
      };
      
      // Publish the event
      await this.eventProducer.produceEvent(event);
      
      logger.debug('Published leaderboard event', {
        eventType,
        eventId: event.metadata.event_id
      });
    } catch (error) {
      logger.error('Error publishing leaderboard event', {
        eventType,
        payload,
        error
      });
      // Don't rethrow - event publishing should not break the main flow
    }
  }

  /**
   * Creates standardized event metadata for leaderboard events
   * @param eventType The type of event
   * @returns Event metadata object
   */
  private createEventMetadata(eventType: string): {
    event_id: string;
    event_type: string;
    event_version: string;
    event_time: string;
    producer: string;
    correlation_id: string;
    category: string;
  } {
    return {
      event_id: uuidv4(),
      event_type: eventType,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: 'gamification-service',
      correlation_id: uuidv4(),
      category: EventCategories.GAMIFICATION
    };
  }
}

export default LeaderboardService;