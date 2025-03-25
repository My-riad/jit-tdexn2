/**
 * Achievement Detection Algorithm
 * 
 * This module implements the core logic for detecting and processing driver achievements
 * based on their performance metrics. It analyzes driver scores and other metrics against
 * achievement criteria to determine when achievements should be awarded.
 */

import { 
  Achievement, 
  AchievementCategory, 
  AchievementLevel, 
  AchievementCriteria, 
  AchievementProgress,
  AchievementEvent,
  DriverAchievement,
  MetricType,
  TimeframeType
} from '../../../common/interfaces/achievement.interface';
import { DriverScore } from '../../../common/interfaces/driver.interface';
import AchievementModel from '../models/achievement.model';
import DriverAchievementModel from '../models/driver-achievement.model';
import DriverScoreModel from '../models/driver-score.model';
import { EventTypes } from '../../../common/constants/event-types';
import { transaction } from 'objection'; // objection v3.0.1
import logger from '../../../common/utils/logger';

/**
 * Class responsible for detecting achievements based on driver performance metrics
 */
class AchievementDetector {
  // Cache for storing driver achievement progress
  private driverProgressCache: Map<string, AchievementProgress[]>;

  /**
   * Creates a new AchievementDetector instance
   */
  constructor() {
    this.driverProgressCache = new Map<string, AchievementProgress[]>();
  }

  /**
   * Detects achievements that a driver has earned based on their performance metrics
   * 
   * @param driverId The ID of the driver
   * @param driverScore The driver's current performance metrics
   * @returns Array of achievement progress objects, including newly earned achievements
   */
  async detectAchievementsForDriver(
    driverId: string,
    driverScore: DriverScoreModel
  ): Promise<AchievementProgress[]> {
    logger.info(`Detecting achievements for driver ${driverId}`, { driverId });

    try {
      // Get all active achievements
      const achievements = await AchievementModel.query()
        .where('isActive', true);

      // Get already earned achievements for this driver
      const earnedAchievements = await DriverAchievementModel.query()
        .where('driverId', driverId)
        .select('achievementId');

      // Create a set of earned achievement IDs for quick lookup
      const earnedAchievementIds = new Set(
        earnedAchievements.map(earned => earned.achievementId)
      );

      // Filter out already earned achievements
      const availableAchievements = achievements.filter(
        achievement => !earnedAchievementIds.has(achievement.id)
      );

      // Check each achievement to see if criteria are met
      let newlyEarnedAchievements: AchievementProgress[] = [];
      
      await transaction(AchievementModel.knex(), async (trx) => {
        for (const achievement of availableAchievements) {
          // Check if driver meets criteria for this achievement
          const meetsAchievementCriteria = this.evaluateAchievementCriteria(
            achievement,
            driverScore,
            {} // Additional metrics if needed
          );

          // Calculate progress for this achievement
          const achievementProgress = this.calculateAchievementProgress(
            achievement,
            driverScore,
            {} // Additional metrics if needed
          );

          // If criteria are met, create a new driver achievement record
          if (meetsAchievementCriteria) {
            logger.info(`Driver ${driverId} earned achievement ${achievement.id}: ${achievement.name}`, 
              { driverId, achievementId: achievement.id });

            // Create achievement record
            await DriverAchievementModel.query(trx)
              .insert({
                driverId,
                achievementId: achievement.id,
                earnedAt: new Date(),
                achievementData: {
                  score: driverScore.total_score,
                  achievement: achievement.name,
                  points: achievement.points
                }
              });

            // Mark the achievement as completed in progress tracking
            achievementProgress.isCompleted = true;
            achievementProgress.completedAt = new Date();
            
            newlyEarnedAchievements.push(achievementProgress);
          }
        }
      });

      // Get updated progress for all achievements
      const progress = await this.getDriverProgress(driverId);
      
      // Update the driver's progress in the cache
      this.updateDriverProgress(driverId, progress);

      return progress;
    } catch (error) {
      logger.error(`Error detecting achievements for driver ${driverId}`, { 
        driverId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Processes an achievement-related event to update achievement progress
   * 
   * @param event The achievement event to process
   * @returns Updated achievement progress after processing the event
   */
  async processEvent(event: AchievementEvent): Promise<AchievementProgress[]> {
    logger.info(`Processing achievement event ${event.eventType}`, {
      driverId: event.driverId,
      eventType: event.eventType
    });

    try {
      // Extract relevant data from the event
      const { driverId, eventType, data } = event;

      // Get driver's current score
      const driverScore = await DriverScoreModel.getLatestScoreForDriver(driverId);

      if (!driverScore) {
        logger.warn(`No driver score found for driver ${driverId}`, { driverId });
        return [];
      }

      // Additional metrics might be included in the event data
      const additionalMetrics = data || {};

      // Detect achievements based on current score and event data
      return await this.detectAchievementsForDriver(driverId, driverScore);
    } catch (error) {
      logger.error(`Error processing achievement event`, { 
        event, 
        error 
      });
      throw error;
    }
  }

  /**
   * Gets a driver's progress toward all achievements
   * 
   * @param driverId The ID of the driver
   * @returns Array of achievement progress objects for the driver
   */
  async getDriverProgress(driverId: string): Promise<AchievementProgress[]> {
    logger.debug(`Getting achievement progress for driver ${driverId}`, { driverId });

    try {
      // Check if we have cached progress for this driver
      if (this.driverProgressCache.has(driverId)) {
        return this.driverProgressCache.get(driverId) || [];
      }

      // Get all active achievements
      const achievements = await AchievementModel.query()
        .where('isActive', true);

      // Get already earned achievements for this driver
      const earnedAchievements = await DriverAchievementModel.query()
        .where('driverId', driverId)
        .join('achievements', 'driver_achievements.achievementId', 'achievements.id')
        .select(
          'driver_achievements.achievementId',
          'driver_achievements.earnedAt',
          'achievements.*'
        );

      // Create a map of earned achievement IDs for quick lookup
      const earnedAchievementMap = new Map<string, DriverAchievement>();
      earnedAchievements.forEach(earned => {
        earnedAchievementMap.set(earned.achievementId, earned);
      });

      // Get driver's current score
      const driverScore = await DriverScoreModel.getLatestScoreForDriver(driverId);

      if (!driverScore) {
        logger.warn(`No driver score found for driver ${driverId}`, { driverId });
        return [];
      }

      // Calculate progress for each achievement
      const progress: AchievementProgress[] = achievements.map(achievement => {
        const isEarned = earnedAchievementMap.has(achievement.id);
        const earnedData = earnedAchievementMap.get(achievement.id);

        if (isEarned && earnedData) {
          // Achievement already earned
          return {
            achievementId: achievement.id,
            achievement,
            currentValue: achievement.criteria.threshold,
            targetValue: achievement.criteria.threshold,
            progressPercentage: 100,
            isCompleted: true,
            completedAt: earnedData.earnedAt
          };
        } else {
          // Calculate progress toward this achievement
          return this.calculateAchievementProgress(
            achievement,
            driverScore,
            {} // Additional metrics if needed
          );
        }
      });

      // Cache the progress
      this.updateDriverProgress(driverId, progress);

      return progress;
    } catch (error) {
      logger.error(`Error getting achievement progress for driver ${driverId}`, { 
        driverId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Updates a driver's progress toward achievements in the cache
   * 
   * @param driverId The ID of the driver
   * @param progress Array of achievement progress objects
   */
  updateDriverProgress(driverId: string, progress: AchievementProgress[]): void {
    this.driverProgressCache.set(driverId, progress);
  }

  /**
   * Clears the achievement progress cache for a driver
   * 
   * @param driverId The ID of the driver
   */
  clearDriverProgressCache(driverId: string): void {
    this.driverProgressCache.delete(driverId);
  }

  /**
   * Evaluates if a driver meets the criteria for an achievement
   * 
   * @param achievement The achievement to evaluate
   * @param driverScore The driver's current performance metrics
   * @param additionalMetrics Additional metrics not included in the driver score
   * @returns True if the driver meets the criteria, false otherwise
   */
  evaluateAchievementCriteria(
    achievement: Achievement,
    driverScore: DriverScoreModel,
    additionalMetrics: Record<string, any>
  ): boolean {
    // Use the helper function to evaluate criteria
    return evaluateCriteria(achievement.criteria, driverScore, additionalMetrics);
  }

  /**
   * Calculates a driver's progress toward an achievement
   * 
   * @param achievement The achievement to calculate progress for
   * @param driverScore The driver's current performance metrics
   * @param additionalMetrics Additional metrics not included in the driver score
   * @returns Achievement progress object with current progress
   */
  calculateAchievementProgress(
    achievement: Achievement,
    driverScore: DriverScoreModel,
    additionalMetrics: Record<string, any>
  ): AchievementProgress {
    // Calculate progress percentage
    const currentValue = this.getMetricValue(
      achievement.criteria.metricType,
      driverScore,
      additionalMetrics
    );
    const targetValue = achievement.criteria.threshold;
    
    // Calculate progress as a percentage (0-100)
    const progressPercentage = calculateProgress(
      achievement.criteria,
      driverScore,
      additionalMetrics
    );

    // Check if the achievement is completed
    const isCompleted = this.evaluateAchievementCriteria(
      achievement,
      driverScore,
      additionalMetrics
    );

    return {
      achievementId: achievement.id,
      achievement,
      currentValue,
      targetValue,
      progressPercentage,
      isCompleted,
      completedAt: isCompleted ? new Date() : null
    };
  }

  /**
   * Extracts a metric value from driver score or additional metrics
   * 
   * @param metricType The type of metric to extract
   * @param driverScore The driver's current performance metrics
   * @param additionalMetrics Additional metrics not included in the driver score
   * @returns The value of the requested metric
   */
  getMetricValue(
    metricType: MetricType,
    driverScore: DriverScoreModel,
    additionalMetrics: Record<string, any>
  ): number {
    switch (metricType) {
      case MetricType.EFFICIENCY_SCORE:
        return driverScore.total_score;
      case MetricType.EMPTY_MILES_REDUCTION:
        return driverScore.empty_miles_score;
      case MetricType.NETWORK_CONTRIBUTION:
        return driverScore.network_contribution_score;
      case MetricType.ON_TIME_PERCENTAGE:
        return driverScore.on_time_score;
      case MetricType.SMART_HUB_USAGE:
        return driverScore.hub_utilization_score;
      case MetricType.FUEL_EFFICIENCY:
        return driverScore.fuel_efficiency_score;
      case MetricType.LOADS_COMPLETED:
        return additionalMetrics.loadsCompleted || 0;
      case MetricType.MILES_DRIVEN:
        return additionalMetrics.milesDriven || 0;
      case MetricType.RELAY_PARTICIPATION:
        return additionalMetrics.relayParticipations || 0;
      default:
        return 0;
    }
  }

  /**
   * Compares two values using the specified comparison operator
   * 
   * @param value The value to compare
   * @param operator The comparison operator
   * @param threshold The threshold value to compare against
   * @returns Result of the comparison
   */
  compareValues(
    value: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case '>=':
        return value >= threshold;
      case '>':
        return value > threshold;
      case '=':
      case '==':
        return value === threshold;
      case '<':
        return value < threshold;
      case '<=':
        return value <= threshold;
      default:
        return false;
    }
  }
}

/**
 * Evaluates if a driver meets the criteria for an achievement
 * 
 * @param criteria The achievement criteria to evaluate
 * @param driverScore The driver's current performance metrics
 * @param additionalMetrics Additional metrics not included in the driver score
 * @returns True if the driver meets the criteria, false otherwise
 */
export function evaluateCriteria(
  criteria: AchievementCriteria,
  driverScore: DriverScoreModel,
  additionalMetrics: Record<string, any>
): boolean {
  // Get the detector instance to use its utility methods
  const detector = new AchievementDetector();
  
  // Extract the current value for the metric type
  const currentValue = detector.getMetricValue(
    criteria.metricType,
    driverScore,
    additionalMetrics
  );
  
  // Compare the current value to the threshold using the specified operator
  return detector.compareValues(
    currentValue,
    criteria.comparisonOperator,
    criteria.threshold
  );
}

/**
 * Calculates a driver's progress toward an achievement
 * 
 * @param criteria The achievement criteria to calculate progress for
 * @param driverScore The driver's current performance metrics
 * @param additionalMetrics Additional metrics not included in the driver score
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  criteria: AchievementCriteria,
  driverScore: DriverScoreModel,
  additionalMetrics: Record<string, any>
): number {
  // Get the detector instance to use its utility methods
  const detector = new AchievementDetector();
  
  // Extract the current value for the metric type
  const currentValue = detector.getMetricValue(
    criteria.metricType,
    driverScore,
    additionalMetrics
  );
  
  // Calculate the progress as a percentage
  let progressPercentage: number;
  
  // For "less than" comparisons, we need to invert the calculation
  if (criteria.comparisonOperator === '<' || criteria.comparisonOperator === '<=') {
    // If the current value is already below the threshold, it's 100% progress
    if (currentValue <= criteria.threshold) {
      progressPercentage = 100;
    } else {
      // Calculate inverse progress - the closer to the threshold, the better
      const baseValue = criteria.additionalParams?.baseValue || (criteria.threshold * 2);
      progressPercentage = Math.max(0, (baseValue - currentValue) / (baseValue - criteria.threshold) * 100);
    }
  } else {
    // For "greater than" or "equal to" comparisons
    // Calculate progress as current value / threshold
    progressPercentage = (currentValue / criteria.threshold) * 100;
  }
  
  // Ensure the progress is between 0 and 100
  return Math.max(0, Math.min(100, progressPercentage));
}

/**
 * Detects achievements that a driver has earned based on their performance metrics
 * 
 * @param driverId The ID of the driver
 * @param driverScore The driver's current performance metrics
 * @returns Array of achievement progress objects, including newly earned achievements
 */
export async function detectAchievements(
  driverId: string,
  driverScore: DriverScoreModel
): Promise<AchievementProgress[]> {
  const detector = new AchievementDetector();
  return await detector.detectAchievementsForDriver(driverId, driverScore);
}

/**
 * Processes an achievement-related event to update achievement progress
 * 
 * @param event The achievement event to process
 * @returns Updated achievement progress after processing the event
 */
export async function processAchievementEvent(
  event: AchievementEvent
): Promise<AchievementProgress[]> {
  const detector = new AchievementDetector();
  return await detector.processEvent(event);
}

/**
 * Gets a driver's progress toward all achievements
 * 
 * @param driverId The ID of the driver
 * @returns Array of achievement progress objects for the driver
 */
export async function getDriverAchievementProgress(
  driverId: string
): Promise<AchievementProgress[]> {
  const detector = new AchievementDetector();
  return await detector.getDriverProgress(driverId);
}

// Export the AchievementDetector class as the default export
export default AchievementDetector;