import { transaction } from 'objection'; // objection v3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0

import DriverScoreModel from '../models/driver-score.model';
import {
  ScoreCalculator,
  calculateDriverScore,
  SCORE_WEIGHTS
} from '../algorithms/score-calculator';
import LeaderboardService from './leaderboard.service';
import { Driver, DriverScore, LoadAssignment } from '../../../common/interfaces/driver.interface';
import { EventProducer } from '../../../common/interfaces/event.interface';
import AchievementEventsProducer from '../producers/achievement-events.producer';
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';

/**
 * Service class that manages driver efficiency scores in the gamification system
 * Handles score calculation, retrieval, updates, and historical tracking.
 * Integrates with the leaderboard service to update driver rankings based on score changes.
 *
 * Implements requirements from:
 * - F-004: Driver Score System
 * - Efficiency Score Calculation
 * - F-005: Leaderboards & AI-Powered Rewards
 */
class ScoreService {
  private scoreCalculator: ScoreCalculator;
  private leaderboardService: LeaderboardService;
  private eventProducer: EventProducer;

  /**
   * Creates a new ScoreService instance
   * @param leaderboardService The leaderboard service instance
   * @param eventProducer The event producer instance
   */
  constructor(leaderboardService: LeaderboardService, eventProducer: EventProducer) {
    this.scoreCalculator = new ScoreCalculator();
    this.leaderboardService = leaderboardService;
    this.eventProducer = eventProducer;
    logger.info('ScoreService initialized');
  }

  /**
   * Retrieves the current score for a driver
   * @param driverId The ID of the driver
   * @returns The driver's current score or null if not found
   */
  async getDriverScore(driverId: string): Promise<DriverScoreModel | null> {
    try {
      const score = await DriverScoreModel.getLatestScoreForDriver(driverId);
      logger.info(`Retrieved driver score for driver ${driverId}`, { driverId, scoreId: score?.score_id });
      return score;
    } catch (error) {
      logger.error(`Error retrieving driver score for driver ${driverId}`, { driverId, error });
      throw error;
    }
  }

  /**
   * Retrieves the score history for a driver with pagination
   * @param driverId The ID of the driver
   * @param page The page number (1-based)
   * @param pageSize The number of entries per page
   * @returns Paginated score history with metadata
   */
  async getDriverScoreHistory(driverId: string, page: number, pageSize: number): Promise<{ scores: DriverScoreModel[]; total: number; page: number; pageSize: number; }> {
    try {
      const { scores, total } = await DriverScoreModel.getScoreHistoryForDriver(driverId, pageSize, (page - 1) * pageSize);
      logger.info(`Retrieved driver score history for driver ${driverId}`, { driverId, page, pageSize, totalScores: total });
      return { scores, total, page, pageSize };
    } catch (error) {
      logger.error(`Error retrieving driver score history for driver ${driverId}`, { driverId, page, pageSize, error });
      throw error;
    }
  }

  /**
   * Retrieves scores for a driver within a specific date range
   * @param driverId The ID of the driver
   * @param startDate The start date of the range
   * @param endDate The end date of the range
   * @returns Array of score records within the date range
   */
  async getDriverScoresByDateRange(driverId: string, startDate: Date, endDate: Date): Promise<DriverScoreModel[]> {
    try {
      const scores = await DriverScoreModel.getScoresByDateRange(driverId, startDate, endDate);
      logger.info(`Retrieved driver scores by date range for driver ${driverId}`, { driverId, startDate, endDate, scoreCount: scores.length });
      return scores;
    } catch (error) {
      logger.error(`Error retrieving driver scores by date range for driver ${driverId}`, { driverId, startDate, endDate, error });
      throw error;
    }
  }

  /**
   * Calculates a new score for a driver based on a completed load assignment
   * @param driverId The ID of the driver
   * @param loadAssignment The completed load assignment
   * @param additionalMetrics Additional metrics for score calculation
   * @returns The newly calculated score
   */
  async calculateScoreForLoad(driverId: string, loadAssignment: LoadAssignment, additionalMetrics: Record<string, any>): Promise<DriverScoreModel> {
    try {
      const scoreModel = await this.scoreCalculator.calculateScore(driverId, loadAssignment, additionalMetrics);
      await this.leaderboardService.updateDriverRanking(driverId, scoreModel);
      await this.checkScoreMilestones(driverId, 0, scoreModel.total_score);
      await this.publishScoreEvent(EventTypes.SCORE_UPDATED, { driver_id: driverId, score_id: scoreModel.score_id, total_score: scoreModel.total_score });
      logger.info(`Calculated score for load assignment for driver ${driverId}`, { driverId, assignmentId: loadAssignment.assignment_id, scoreId: scoreModel.score_id });
      return scoreModel;
    } catch (error) {
      logger.error(`Error calculating score for load assignment for driver ${driverId}`, { driverId, assignmentId: loadAssignment.assignment_id, error });
      throw error;
    }
  }

  /**
   * Calculates a historical score for a driver based on past performance
   * @param driverId The ID of the driver
   * @param startDate The start date for the historical period
   * @param endDate The end date for the historical period
   * @returns The calculated historical score
   */
  async calculateHistoricalScore(driverId: string, startDate: Date, endDate: Date): Promise<DriverScoreModel> {
    try {
      const scoreModel = await this.scoreCalculator.calculateHistoricalScore(driverId, startDate, endDate);
      await this.leaderboardService.updateDriverRanking(driverId, scoreModel);
      await this.publishScoreEvent(EventTypes.SCORE_UPDATED, { driver_id: driverId, score_id: scoreModel.score_id, total_score: scoreModel.total_score });
      logger.info(`Calculated historical score for driver ${driverId}`, { driverId, startDate, endDate, scoreId: scoreModel.score_id });
      return scoreModel;
    } catch (error) {
      logger.error(`Error calculating historical score for driver ${driverId}`, { driverId, startDate, endDate, error });
      throw error;
    }
  }

  /**
   * Updates a driver's score with new component scores
   * @param driverId The ID of the driver
   * @param scoreData The new score data
   * @returns The updated score model
   */
  async updateDriverScore(driverId: string, scoreData: { empty_miles_score: number; network_contribution_score: number; on_time_score: number; hub_utilization_score: number; fuel_efficiency_score: number; }): Promise<DriverScoreModel> {
    try {
      // 1. Get the driver's current score
      let currentScore = await this.getDriverScore(driverId);

      // 2. If no existing score, create a new one
      if (!currentScore) {
        currentScore = new DriverScoreModel();
        currentScore.driver_id = driverId;
      }

      // 3. Update the component scores with the provided data
      currentScore.empty_miles_score = scoreData.empty_miles_score;
      currentScore.network_contribution_score = scoreData.network_contribution_score;
      currentScore.on_time_score = scoreData.on_time_score;
      currentScore.hub_utilization_score = scoreData.hub_utilization_score;
      currentScore.fuel_efficiency_score = scoreData.fuel_efficiency_score;

      // 4. Calculate the new total score based on the weighted components
      const newTotalScore = currentScore.calculateWeightedScore();
      const previousScore = currentScore.total_score;
      currentScore.total_score = newTotalScore;

      // 5. Save the updated score to the database
      const updatedScore = await currentScore.updateTotalScore();

      // 6. Update the driver's leaderboard rankings with the new score
      await this.leaderboardService.updateDriverRanking(driverId, updatedScore);

      // 7. Check if the driver has reached any score milestones
      await this.checkScoreMilestones(driverId, previousScore, updatedScore.total_score);

      // 8. Publish a score updated event
      await this.publishScoreEvent(EventTypes.SCORE_UPDATED, { driver_id: driverId, score_id: updatedScore.score_id, total_score: updatedScore.total_score });

      // 9. Return the updated score model
      logger.info(`Updated driver score for driver ${driverId}`, { driverId, scoreId: updatedScore.score_id, newScore: updatedScore.total_score });
      return updatedScore;
    } catch (error) {
      logger.error(`Error updating driver score for driver ${driverId}`, { driverId, error });
      throw error;
    }
  }

  /**
   * Recalculates scores for multiple drivers, typically after algorithm updates
   * @param driverIds Array of driver IDs to recalculate
   * @returns Map of driver IDs to their updated score models
   */
  async recalculateDriverScores(driverIds: string[]): Promise<Record<string, DriverScoreModel>> {
    try {
      logger.info(`Recalculating scores for ${driverIds.length} drivers`);
      const results: Record<string, DriverScoreModel> = {};

      for (const driverId of driverIds) {
        try {
          // Fetch the most recent load assignment for this driver
          const score = await this.getDriverScore(driverId);

          if (!score) {
            logger.warn(`No score found for driver ${driverId}, skipping recalculation`);
            continue;
          }

          // Recalculate the score using the existing data
          const updatedScore = await DriverScoreModel.query().patchAndFetchById(score.score_id, {
            total_score: score.calculateWeightedScore()
          });

          if (updatedScore) {
            results[driverId] = updatedScore;
            await this.leaderboardService.updateDriverRanking(driverId, updatedScore);
            await this.publishScoreEvent(EventTypes.SCORE_UPDATED, { driver_id: driverId, score_id: updatedScore.score_id, total_score: updatedScore.total_score });
            logger.info(`Recalculated score for driver ${driverId}`, { driverId, scoreId: updatedScore.score_id, newScore: updatedScore.total_score });
          } else {
            logger.warn(`Failed to update score for driver ${driverId}`);
          }
        } catch (error) {
          logger.error(`Error recalculating score for driver ${driverId}`, { driverId, error });
        }
      }

      logger.info(`Successfully recalculated scores for ${Object.keys(results).length} drivers`);
      return results;
    } catch (error) {
      logger.error('Error recalculating driver scores', { error });
      throw error;
    }
  }

  /**
   * Checks if a driver has reached any score milestones and publishes events if so
   * @param driverId The ID of the driver
   * @param previousScore The driver's previous score
   * @param newScore The driver's new score
   */
  async checkScoreMilestones(driverId: string, previousScore: number, newScore: number): Promise<void> {
    const SCORE_MILESTONES = [50, 75, 90, 95, 100]; // Global variable
    for (const milestone of SCORE_MILESTONES) {
      if (previousScore < milestone && newScore >= milestone) {
        // Driver has crossed a milestone
        logger.info(`Driver ${driverId} reached score milestone: ${milestone}`);
        await this.publishScoreEvent(EventTypes.SCORE_MILESTONE_REACHED, { driver_id: driverId, milestone: milestone });
      }
    }
  }

  /**
   * Publishes a score-related event to the event bus
   * @param eventType The type of event to publish
   * @param payload The event payload
   */
  async publishScoreEvent(eventType: string, payload: Record<string, any>): Promise<void> {
    try {
      const event: any = { // GamificationEvent
        metadata: this.createEventMetadata(eventType),
        payload: payload
      };
      await this.eventProducer.produceEvent(event);
      logger.info(`Published event ${eventType}`, { eventId: event.metadata.event_id });
    } catch (error) {
      logger.error(`Error publishing event ${eventType}`, { error });
      throw error;
    }
  }

  /**
   * Creates standardized event metadata for score events
   * @param eventType The type of event
   * @returns Event metadata object
   */
  private createEventMetadata(eventType: string): { event_id: string; event_type: string; event_version: string; event_time: string; producer: string; correlation_id: string; category: string; } {
    const eventId = uuidv4();
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

export default ScoreService;