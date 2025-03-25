import { DriverScore } from '../../../common/interfaces/driver.interface';
import DriverScoreModel from '../models/driver-score.model';
import { LoadAssignment, LoadAssignmentType } from '../../../common/interfaces/load.interface';
import { SmartHub } from '../../../common/interfaces/smartHub.interface';
import logger from '../../../common/utils/logger';
import { transaction } from 'objection'; // objection v3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0

/**
 * Constant weight factors for each component of the driver efficiency score
 * These weights are based on strategic importance to network optimization
 */
export const SCORE_WEIGHTS = {
  EMPTY_MILES: 0.3,         // 30% weight
  NETWORK_CONTRIBUTION: 0.25, // 25% weight
  ON_TIME: 0.2,             // 20% weight
  HUB_UTILIZATION: 0.15,    // 15% weight
  FUEL_EFFICIENCY: 0.1      // 10% weight
};

/**
 * Regional baseline values for empty miles percentage
 * These represent industry averages for different regions
 */
const REGIONAL_BASELINES = {
  EMPTY_MILES_PERCENTAGE: {
    NORTHEAST: 0.35, // 35% empty miles is typical in Northeast
    SOUTHEAST: 0.32, // 32% empty miles is typical in Southeast
    MIDWEST: 0.38,   // 38% empty miles is typical in Midwest
    SOUTHWEST: 0.36, // 36% empty miles is typical in Southwest
    WEST: 0.34,      // 34% empty miles is typical in West
    DEFAULT: 0.35    // 35% as default if region not specified
  }
};

/**
 * Helper function to calculate a driver's efficiency score based on metrics
 * 
 * @param driverId - The ID of the driver
 * @param metrics - Object containing score metrics
 * @returns Promise resolving to the calculated driver score model
 */
export async function calculateDriverScore(
  driverId: string,
  metrics: Record<string, any>
): Promise<DriverScoreModel> {
  const calculator = new ScoreCalculator();
  
  // Extract required metrics
  const {
    loadAssignment,
    additionalMetrics = {}
  } = metrics;
  
  return await calculator.calculateScore(driverId, loadAssignment, additionalMetrics);
}

/**
 * Gets the regional baseline for empty miles percentage
 * 
 * @param region - The region code (NORTHEAST, SOUTHEAST, etc.)
 * @returns Baseline empty miles percentage for the region
 */
function getRegionalBaseline(region: string): number {
  const baselines = REGIONAL_BASELINES.EMPTY_MILES_PERCENTAGE;
  return baselines[region] !== undefined ? baselines[region] : baselines.DEFAULT;
}

/**
 * Calculates the empty miles reduction component of the efficiency score
 * 
 * @param emptyMilesPercentage - Driver's empty miles percentage
 * @param region - Geographic region for baseline comparison
 * @returns Score component for empty miles reduction (0-100)
 */
function calculateEmptyMilesScore(emptyMilesPercentage: number, region: string): number {
  // Get baseline for comparison
  const baseline = getRegionalBaseline(region);
  
  // Calculate reduction from baseline (negative if worse than baseline)
  const reduction = baseline - emptyMilesPercentage;
  
  // Convert to percentage reduction
  const reductionPercentage = (reduction / baseline) * 100;
  
  // Scale to score (0-100)
  // Full score at 100% reduction, 50 at baseline, 0 at double baseline
  let score = 50 + (reductionPercentage * 0.5);
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates the network contribution component of the efficiency score
 * 
 * @param loadAssignment - The load assignment details
 * @param additionalMetrics - Additional metrics for calculation
 * @returns Score component for network contribution (0-100)
 */
function calculateNetworkContributionScore(
  loadAssignment: LoadAssignment,
  additionalMetrics: Record<string, any>
): number {
  // Extract relevant metrics
  const {
    networkImpact = 0,            // Default 0 impact
    loadBalancingContribution = 0, // Default 0 contribution
    highDemandAreaService = false, // Default false
    capacityUtilization = 0.7,     // Default 70% utilization
    strategicValue = 0             // Default 0 strategic value
  } = additionalMetrics;
  
  // Base score starts at 50
  let score = 50;
  
  // Add points for network impact (scale of -50 to +50)
  score += networkImpact;
  
  // Add points for load balancing (scale of 0 to 20)
  score += loadBalancingContribution;
  
  // Add points for serving high demand areas
  if (highDemandAreaService) {
    score += 15;
  }
  
  // Add points for capacity utilization (0 to 10)
  score += Math.min(10, capacityUtilization * 10);
  
  // Add points for strategic value (scale of 0 to 20)
  score += strategicValue;
  
  // Add points for relay participation
  if (loadAssignment.assignment_type === LoadAssignmentType.RELAY) {
    score += 10;
  }
  
  // Add points for Smart Hub exchange participation
  if (loadAssignment.assignment_type === LoadAssignmentType.SMART_HUB_EXCHANGE) {
    score += 15;
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates the on-time performance component of the efficiency score
 * 
 * @param loadAssignment - The load assignment details
 * @param additionalMetrics - Additional metrics for calculation
 * @returns Score component for on-time performance (0-100)
 */
function calculateOnTimeScore(
  loadAssignment: LoadAssignment,
  additionalMetrics: Record<string, any>
): number {
  // Extract timing information
  const {
    scheduledPickupTime,
    actualPickupTime,
    scheduledDeliveryTime,
    actualDeliveryTime,
    pickupWindowMinutes = 240, // Default 4-hour window
    deliveryWindowMinutes = 240 // Default 4-hour window
  } = additionalMetrics;
  
  // Default score (if timing data is missing)
  if (!scheduledPickupTime || !actualPickupTime || !scheduledDeliveryTime || !actualDeliveryTime) {
    logger.warn('Missing timing data for on-time score calculation', {
      assignmentId: loadAssignment.assignment_id
    });
    return 70; // Default score when timing data is incomplete
  }
  
  // Convert to date objects if they're strings
  const pickupScheduled = typeof scheduledPickupTime === 'string' 
    ? new Date(scheduledPickupTime) : scheduledPickupTime;
  
  const pickupActual = typeof actualPickupTime === 'string'
    ? new Date(actualPickupTime) : actualPickupTime;
  
  const deliveryScheduled = typeof scheduledDeliveryTime === 'string'
    ? new Date(scheduledDeliveryTime) : scheduledDeliveryTime;
  
  const deliveryActual = typeof actualDeliveryTime === 'string'
    ? new Date(actualDeliveryTime) : actualDeliveryTime;
  
  // Calculate deviations in minutes
  const pickupDeviation = (pickupActual.getTime() - pickupScheduled.getTime()) / (1000 * 60);
  const deliveryDeviation = (deliveryActual.getTime() - deliveryScheduled.getTime()) / (1000 * 60);
  
  // Calculate pickup score (100 for early, 80 for on-time, decreasing for late)
  let pickupScore = 0;
  if (pickupDeviation <= 0) {
    // Early or exactly on time
    pickupScore = 100;
  } else if (pickupDeviation <= pickupWindowMinutes) {
    // Within window
    pickupScore = 80;
  } else {
    // Late beyond window
    // Lose 1 point for every 1% of window time exceeded
    const excessPercentage = ((pickupDeviation - pickupWindowMinutes) / pickupWindowMinutes) * 100;
    pickupScore = Math.max(0, 80 - excessPercentage);
  }
  
  // Calculate delivery score (100 for early, 80 for on-time, decreasing for late)
  let deliveryScore = 0;
  if (deliveryDeviation <= 0) {
    // Early or exactly on time
    deliveryScore = 100;
  } else if (deliveryDeviation <= deliveryWindowMinutes) {
    // Within window
    deliveryScore = 80;
  } else {
    // Late beyond window
    // Lose 1 point for every 1% of window time exceeded
    const excessPercentage = ((deliveryDeviation - deliveryWindowMinutes) / deliveryWindowMinutes) * 100;
    deliveryScore = Math.max(0, 80 - excessPercentage);
  }
  
  // Combine scores (pickup 40%, delivery 60%)
  const combinedScore = (pickupScore * 0.4) + (deliveryScore * 0.6);
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, combinedScore));
}

/**
 * Calculates the Smart Hub utilization component of the efficiency score
 * 
 * @param loadAssignment - The load assignment details
 * @param additionalMetrics - Additional metrics for calculation
 * @returns Score component for Smart Hub utilization (0-100)
 */
function calculateHubUtilizationScore(
  loadAssignment: LoadAssignment,
  additionalMetrics: Record<string, any>
): number {
  // Check if this was a Smart Hub exchange
  const isSmartHubExchange = loadAssignment.assignment_type === LoadAssignmentType.SMART_HUB_EXCHANGE;
  
  if (isSmartHubExchange) {
    // Extract Smart Hub exchange details
    const {
      exchangeEfficiency = 0.8, // Default 80% efficiency
      exchangeDuration = 30,    // Default 30 minutes
      idealExchangeDuration = 20, // Ideal exchange takes 20 minutes
      smartHubId
    } = additionalMetrics;
    
    // Base score for participation
    let score = 85;
    
    // Add points for exchange efficiency (0-10)
    score += exchangeEfficiency * 10;
    
    // Adjust for exchange duration (longer than ideal reduces score)
    if (exchangeDuration > idealExchangeDuration) {
      // Lose half a point for each minute over ideal
      const durationPenalty = (exchangeDuration - idealExchangeDuration) * 0.5;
      score = Math.max(70, score - durationPenalty);
    } else {
      // Bonus for faster than ideal (up to 5 points)
      const durationBonus = Math.min(5, (idealExchangeDuration - exchangeDuration) * 0.5);
      score += durationBonus;
    }
    
    return Math.max(0, Math.min(100, score));
  } else {
    // Not a Smart Hub exchange - base score on historical utilization
    const {
      historicalHubUtilization = 0, // 0 to 1 scale
      recentHubVisits = 0,         // Count of recent visits
      totalLoads = 1               // Total loads (prevent division by zero)
    } = additionalMetrics;
    
    // Calculate visit ratio
    const visitRatio = Math.min(1, recentHubVisits / totalLoads);
    
    // Calculate combined score
    const score = 40 + (historicalHubUtilization * 30) + (visitRatio * 30);
    
    return Math.max(0, Math.min(100, score));
  }
}

/**
 * Calculates the fuel efficiency component of the efficiency score
 * 
 * @param loadAssignment - The load assignment details
 * @param additionalMetrics - Additional metrics for calculation
 * @returns Score component for fuel efficiency (0-100)
 */
function calculateFuelEfficiencyScore(
  loadAssignment: LoadAssignment,
  additionalMetrics: Record<string, any>
): number {
  // Extract fuel metrics
  const {
    actualFuelConsumed = 0,    // Gallons of fuel used
    expectedFuelConsumption = 0, // Expected gallons
    milesPerGallon = 0,         // Actual MPG
    expectedMilesPerGallon = 0, // Expected MPG
    idlingTime = 0,             // Minutes spent idling
    ecoDriverBehavior = 0       // Eco-driving score (0-100)
  } = additionalMetrics;
  
  // If we don't have actual and expected fuel consumption, use MPG
  if (actualFuelConsumed === 0 || expectedFuelConsumption === 0) {
    if (milesPerGallon > 0 && expectedMilesPerGallon > 0) {
      // Calculate efficiency ratio
      const mpgRatio = milesPerGallon / expectedMilesPerGallon;
      
      // Baseline score is 50
      // 100% of expected = 70 points
      // 110% of expected = 90 points
      // 90% of expected = 50 points
      // 80% of expected = 30 points
      let score = 70 + ((mpgRatio - 1) * 200);
      
      // Adjust for idling time (penalty of up to 10 points)
      const idlingPenalty = Math.min(10, idlingTime / 30);
      score -= idlingPenalty;
      
      // Adjust for eco-driving behavior (bonus of up to 10 points)
      const ecoDrivingBonus = ecoDriverBehavior / 10;
      score += ecoDrivingBonus;
      
      return Math.max(0, Math.min(100, score));
    } else {
      // Insufficient data
      logger.warn('Insufficient fuel data for fuel efficiency score calculation', {
        assignmentId: loadAssignment.assignment_id
      });
      return 50; // Default score when fuel data is missing
    }
  }
  
  // Calculate efficiency as ratio of expected to actual
  // Lower is better (less fuel than expected)
  const efficiencyRatio = actualFuelConsumed / expectedFuelConsumption;
  
  // Baseline score is 50
  // 100% of expected = 70 points
  // 90% of expected = 90 points
  // 110% of expected = 50 points
  // 120% of expected = 30 points
  let score = 70 - ((efficiencyRatio - 1) * 200);
  
  // Adjust for idling time (penalty of up to 10 points)
  const idlingPenalty = Math.min(10, idlingTime / 30);
  score -= idlingPenalty;
  
  // Adjust for eco-driving behavior (bonus of up to 10 points)
  const ecoDrivingBonus = ecoDriverBehavior / 10;
  score += ecoDrivingBonus;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Class responsible for calculating driver efficiency scores based on performance metrics
 */
export default class ScoreCalculator {
  // Properties to store constants
  private scoreWeights: typeof SCORE_WEIGHTS;
  private regionalBaselines: typeof REGIONAL_BASELINES;
  
  /**
   * Creates a new ScoreCalculator instance
   */
  constructor() {
    this.scoreWeights = SCORE_WEIGHTS;
    this.regionalBaselines = REGIONAL_BASELINES;
  }
  
  /**
   * Calculates a driver's efficiency score based on a completed load assignment
   * 
   * @param driverId - The ID of the driver
   * @param loadAssignment - The completed load assignment
   * @param additionalMetrics - Additional metrics for score calculation
   * @returns Promise resolving to the calculated driver score model
   */
  async calculateScore(
    driverId: string,
    loadAssignment: LoadAssignment,
    additionalMetrics: Record<string, any>
  ): Promise<DriverScoreModel> {
    try {
      logger.info('Calculating driver efficiency score', { driverId, assignmentId: loadAssignment.assignment_id });
      
      // Extract region from additional metrics or use default
      const region = additionalMetrics.region || 'DEFAULT';
      
      // Calculate component scores
      const emptyMilesScore = this.calculateEmptyMilesScore(
        additionalMetrics.emptyMilesPercentage || 0,
        region
      );
      
      const networkContributionScore = this.calculateNetworkContributionScore(
        loadAssignment,
        additionalMetrics
      );
      
      const onTimeScore = this.calculateOnTimeScore(
        loadAssignment,
        additionalMetrics
      );
      
      const hubUtilizationScore = this.calculateHubUtilizationScore(
        loadAssignment,
        additionalMetrics
      );
      
      const fuelEfficiencyScore = this.calculateFuelEfficiencyScore(
        loadAssignment,
        additionalMetrics
      );
      
      // Calculate weighted total score
      const totalScore = this.calculateWeightedScore(
        emptyMilesScore,
        networkContributionScore,
        onTimeScore,
        hubUtilizationScore,
        fuelEfficiencyScore
      );
      
      // Create score factors object for detailed breakdown
      const scoreFactors: Record<string, number> = {
        emptyMilesReduction: additionalMetrics.emptyMilesPercentage !== undefined 
          ? (this.getRegionalBaseline(region) - additionalMetrics.emptyMilesPercentage) 
          : 0,
        networkImpact: additionalMetrics.networkImpact || 0,
        pickupOnTime: additionalMetrics.actualPickupTime !== undefined,
        deliveryOnTime: additionalMetrics.actualDeliveryTime !== undefined,
        smartHubUsed: loadAssignment.assignment_type === LoadAssignmentType.SMART_HUB_EXCHANGE,
        fuelEfficiency: additionalMetrics.milesPerGallon || 0
      };
      
      // Create new score model
      const scoreModel = new DriverScoreModel();
      scoreModel.score_id = uuidv4();
      scoreModel.driver_id = driverId;
      scoreModel.total_score = totalScore;
      scoreModel.empty_miles_score = emptyMilesScore;
      scoreModel.network_contribution_score = networkContributionScore;
      scoreModel.on_time_score = onTimeScore;
      scoreModel.hub_utilization_score = hubUtilizationScore;
      scoreModel.fuel_efficiency_score = fuelEfficiencyScore;
      scoreModel.score_factors = scoreFactors;
      scoreModel.calculated_at = new Date();
      
      // Save to database using transaction
      const savedScore = await transaction(DriverScoreModel.knex(), async (trx) => {
        return await scoreModel.$query(trx).insert();
      });
      
      logger.info('Driver efficiency score calculated successfully', { 
        driverId, 
        score: totalScore,
        scoreId: savedScore.score_id
      });
      
      return savedScore;
    } catch (error) {
      logger.error('Error calculating driver efficiency score', { 
        driverId, 
        error, 
        assignmentId: loadAssignment.assignment_id 
      });
      throw error;
    }
  }
  
  /**
   * Calculates a historical score for a driver based on past performance
   * 
   * @param driverId - The ID of the driver
   * @param startDate - Start of the time period to analyze
   * @param endDate - End of the time period to analyze
   * @returns Promise resolving to the calculated historical score model
   */
  async calculateHistoricalScore(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DriverScoreModel> {
    try {
      logger.info('Calculating historical driver efficiency score', { 
        driverId, 
        startDate, 
        endDate 
      });
      
      // Fetch load assignments for the time period
      // This is a simplified example - in reality, you would query your load assignment repository
      const loadAssignments = []; // Placeholder for actual data fetching
      
      // If no assignments, return a default score
      if (loadAssignments.length === 0) {
        logger.info('No load assignments found for historical score calculation', { driverId });
        
        // Create new score model with default values
        const scoreModel = new DriverScoreModel();
        scoreModel.score_id = uuidv4();
        scoreModel.driver_id = driverId;
        scoreModel.total_score = 50;
        scoreModel.empty_miles_score = 50;
        scoreModel.network_contribution_score = 50;
        scoreModel.on_time_score = 50;
        scoreModel.hub_utilization_score = 50;
        scoreModel.fuel_efficiency_score = 50;
        scoreModel.score_factors = {};
        scoreModel.calculated_at = new Date();
        
        // Save to database
        return await scoreModel.$query().insert();
      }
      
      // Calculate average component scores
      let totalEmptyMilesScore = 0;
      let totalNetworkContributionScore = 0;
      let totalOnTimeScore = 0;
      let totalHubUtilizationScore = 0;
      let totalFuelEfficiencyScore = 0;
      
      // Process each assignment and accumulate scores
      for (const assignment of loadAssignments) {
        // Fetch additional metrics for this assignment
        const additionalMetrics = {}; // Placeholder for actual data fetching
        
        // Calculate component scores
        totalEmptyMilesScore += this.calculateEmptyMilesScore(
          additionalMetrics.emptyMilesPercentage || 0,
          additionalMetrics.region || 'DEFAULT'
        );
        
        totalNetworkContributionScore += this.calculateNetworkContributionScore(
          assignment,
          additionalMetrics
        );
        
        totalOnTimeScore += this.calculateOnTimeScore(
          assignment,
          additionalMetrics
        );
        
        totalHubUtilizationScore += this.calculateHubUtilizationScore(
          assignment,
          additionalMetrics
        );
        
        totalFuelEfficiencyScore += this.calculateFuelEfficiencyScore(
          assignment,
          additionalMetrics
        );
      }
      
      // Calculate averages
      const count = loadAssignments.length;
      const avgEmptyMilesScore = totalEmptyMilesScore / count;
      const avgNetworkContributionScore = totalNetworkContributionScore / count;
      const avgOnTimeScore = totalOnTimeScore / count;
      const avgHubUtilizationScore = totalHubUtilizationScore / count;
      const avgFuelEfficiencyScore = totalFuelEfficiencyScore / count;
      
      // Calculate total weighted score
      const totalScore = this.calculateWeightedScore(
        avgEmptyMilesScore,
        avgNetworkContributionScore,
        avgOnTimeScore,
        avgHubUtilizationScore,
        avgFuelEfficiencyScore
      );
      
      // Create new score model
      const scoreModel = new DriverScoreModel();
      scoreModel.score_id = uuidv4();
      scoreModel.driver_id = driverId;
      scoreModel.total_score = totalScore;
      scoreModel.empty_miles_score = avgEmptyMilesScore;
      scoreModel.network_contribution_score = avgNetworkContributionScore;
      scoreModel.on_time_score = avgOnTimeScore;
      scoreModel.hub_utilization_score = avgHubUtilizationScore;
      scoreModel.fuel_efficiency_score = avgFuelEfficiencyScore;
      scoreModel.score_factors = {
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
        assignments_count: count
      };
      scoreModel.calculated_at = new Date();
      
      // Save to database
      const savedScore = await scoreModel.$query().insert();
      
      logger.info('Historical driver efficiency score calculated successfully', { 
        driverId, 
        score: totalScore,
        scoreId: savedScore.score_id,
        assignmentsCount: count
      });
      
      return savedScore;
    } catch (error) {
      logger.error('Error calculating historical driver efficiency score', { 
        driverId, 
        error,
        startDate,
        endDate
      });
      throw error;
    }
  }
  
  /**
   * Recalculates scores for multiple drivers, typically after algorithm updates
   * 
   * @param driverIds - Array of driver IDs to recalculate
   * @returns Promise resolving to a map of driver IDs to their updated score models
   */
  async recalculateScores(driverIds: string[]): Promise<Record<string, DriverScoreModel>> {
    try {
      logger.info('Recalculating driver efficiency scores', { driverCount: driverIds.length });
      
      const results: Record<string, DriverScoreModel> = {};
      
      // Process each driver
      for (const driverId of driverIds) {
        try {
          // Fetch most recent load assignment for this driver
          // This is a simplified example - in reality, you would query your load assignment repository
          const recentAssignment = null; // Placeholder for actual data fetching
          
          if (!recentAssignment) {
            logger.warn('No recent assignment found for driver during recalculation', { driverId });
            continue;
          }
          
          // Fetch additional metrics for this assignment
          const additionalMetrics = {}; // Placeholder for actual data fetching
          
          // Calculate new score
          const score = await this.calculateScore(driverId, recentAssignment, additionalMetrics);
          
          // Store in results map
          results[driverId] = score;
          
        } catch (error) {
          logger.error('Error recalculating score for driver', { driverId, error });
          // Continue with next driver instead of failing the entire batch
        }
      }
      
      logger.info('Driver efficiency scores recalculated successfully', { 
        totalDrivers: driverIds.length,
        successfulRecalculations: Object.keys(results).length
      });
      
      return results;
    } catch (error) {
      logger.error('Error in batch recalculation of driver efficiency scores', { error });
      throw error;
    }
  }
  
  /**
   * Calculates the weighted total score from component scores
   * 
   * @param emptyMilesScore - Score for empty miles reduction
   * @param networkContributionScore - Score for network contribution
   * @param onTimeScore - Score for on-time performance
   * @param hubUtilizationScore - Score for Smart Hub utilization
   * @param fuelEfficiencyScore - Score for fuel efficiency
   * @returns The weighted total score (0-100)
   */
  calculateWeightedScore(
    emptyMilesScore: number,
    networkContributionScore: number,
    onTimeScore: number,
    hubUtilizationScore: number,
    fuelEfficiencyScore: number
  ): number {
    // Apply weights to each component score
    const weightedEmptyMiles = emptyMilesScore * this.scoreWeights.EMPTY_MILES;
    const weightedNetworkContribution = networkContributionScore * this.scoreWeights.NETWORK_CONTRIBUTION;
    const weightedOnTime = onTimeScore * this.scoreWeights.ON_TIME;
    const weightedHubUtilization = hubUtilizationScore * this.scoreWeights.HUB_UTILIZATION;
    const weightedFuelEfficiency = fuelEfficiencyScore * this.scoreWeights.FUEL_EFFICIENCY;
    
    // Calculate total score
    const totalScore = weightedEmptyMiles +
      weightedNetworkContribution +
      weightedOnTime +
      weightedHubUtilization +
      weightedFuelEfficiency;
    
    // Ensure score is between 0 and 100
    return this.normalizeScore(totalScore);
  }
  
  /**
   * Calculates the empty miles reduction component of the efficiency score
   * 
   * @param emptyMilesPercentage - Driver's empty miles percentage
   * @param region - Geographic region for baseline comparison
   * @returns Score component for empty miles reduction (0-100)
   */
  calculateEmptyMilesScore(emptyMilesPercentage: number, region: string): number {
    return calculateEmptyMilesScore(emptyMilesPercentage, region);
  }
  
  /**
   * Calculates the network contribution component of the efficiency score
   * 
   * @param loadAssignment - The load assignment details
   * @param additionalMetrics - Additional metrics for calculation
   * @returns Score component for network contribution (0-100)
   */
  calculateNetworkContributionScore(
    loadAssignment: LoadAssignment,
    additionalMetrics: Record<string, any>
  ): number {
    return calculateNetworkContributionScore(loadAssignment, additionalMetrics);
  }
  
  /**
   * Calculates the on-time performance component of the efficiency score
   * 
   * @param loadAssignment - The load assignment details
   * @param additionalMetrics - Additional metrics for calculation
   * @returns Score component for on-time performance (0-100)
   */
  calculateOnTimeScore(
    loadAssignment: LoadAssignment,
    additionalMetrics: Record<string, any>
  ): number {
    return calculateOnTimeScore(loadAssignment, additionalMetrics);
  }
  
  /**
   * Calculates the Smart Hub utilization component of the efficiency score
   * 
   * @param loadAssignment - The load assignment details
   * @param additionalMetrics - Additional metrics for calculation
   * @returns Score component for Smart Hub utilization (0-100)
   */
  calculateHubUtilizationScore(
    loadAssignment: LoadAssignment,
    additionalMetrics: Record<string, any>
  ): number {
    return calculateHubUtilizationScore(loadAssignment, additionalMetrics);
  }
  
  /**
   * Calculates the fuel efficiency component of the efficiency score
   * 
   * @param loadAssignment - The load assignment details
   * @param additionalMetrics - Additional metrics for calculation
   * @returns Score component for fuel efficiency (0-100)
   */
  calculateFuelEfficiencyScore(
    loadAssignment: LoadAssignment,
    additionalMetrics: Record<string, any>
  ): number {
    return calculateFuelEfficiencyScore(loadAssignment, additionalMetrics);
  }
  
  /**
   * Gets the regional baseline for empty miles percentage
   * 
   * @param region - The region code (NORTHEAST, SOUTHEAST, etc.)
   * @returns Baseline empty miles percentage for the region
   */
  getRegionalBaseline(region: string): number {
    return getRegionalBaseline(region);
  }
  
  /**
   * Ensures a score value is within the 0-100 range
   * 
   * @param score - The score to normalize
   * @returns Normalized score between 0 and 100
   */
  normalizeScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }
}