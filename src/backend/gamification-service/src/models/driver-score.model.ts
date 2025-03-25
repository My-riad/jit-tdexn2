import { Model } from 'objection'; // objection v3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import { DriverScore } from '../../../common/interfaces/driver.interface';

/**
 * Objection.js model class for driver efficiency scores in the gamification system
 */
class DriverScoreModel extends Model {
  // Properties
  score_id!: string;
  driver_id!: string;
  total_score!: number;
  empty_miles_score!: number;
  network_contribution_score!: number;
  on_time_score!: number;
  hub_utilization_score!: number;
  fuel_efficiency_score!: number;
  score_factors!: Record<string, number>;
  calculated_at!: Date;
  created_at!: Date;
  updated_at!: Date;

  /**
   * Creates a new DriverScoreModel instance
   */
  constructor() {
    super();
  }

  /**
   * Returns the database table name for this model
   */
  static tableName(): string {
    return 'driver_scores';
  }

  /**
   * Defines the JSON schema for validation of driver score objects
   */
  static jsonSchema = {
    type: 'object',
    required: ['driver_id', 'total_score', 'calculated_at'],
    properties: {
      score_id: { type: 'string', format: 'uuid' },
      driver_id: { type: 'string', format: 'uuid' },
      total_score: { type: 'number', minimum: 0, maximum: 100 },
      empty_miles_score: { type: 'number', minimum: 0, maximum: 100 },
      network_contribution_score: { type: 'number', minimum: 0, maximum: 100 },
      on_time_score: { type: 'number', minimum: 0, maximum: 100 },
      hub_utilization_score: { type: 'number', minimum: 0, maximum: 100 },
      fuel_efficiency_score: { type: 'number', minimum: 0, maximum: 100 },
      score_factors: { type: 'object' },
      calculated_at: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  };

  /**
   * Defines relationships to other models
   */
  static relationMappings = () => {
    // Dynamically import models to avoid circular dependencies
    const { Driver } = require('../driver/driver.model');

    return {
      driver: {
        relation: Model.BelongsToOneRelation,
        modelClass: Driver,
        join: {
          from: 'driver_scores.driver_id',
          to: 'drivers.driver_id'
        }
      }
    };
  };

  /**
   * Lifecycle hook that runs before inserting a new score record
   */
  $beforeInsert(): void {
    this.score_id = this.score_id || uuidv4();
    this.calculated_at = this.calculated_at || new Date();
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  /**
   * Lifecycle hook that runs before updating a score record
   */
  $beforeUpdate(): void {
    this.updated_at = new Date();
  }

  /**
   * Calculates the total score based on weighted component scores
   * 
   * @returns The calculated total score (0-100)
   */
  calculateWeightedScore(): number {
    // Define weight factors for each component score based on requirements
    const weights = {
      empty_miles: 0.3,
      network_contribution: 0.25,
      on_time: 0.2,
      hub_utilization: 0.15,
      fuel_efficiency: 0.1
    };

    // Calculate weighted score components
    const emptyMilesWeighted = this.empty_miles_score * weights.empty_miles;
    const networkContributionWeighted = this.network_contribution_score * weights.network_contribution;
    const onTimeWeighted = this.on_time_score * weights.on_time;
    const hubUtilizationWeighted = this.hub_utilization_score * weights.hub_utilization;
    const fuelEfficiencyWeighted = this.fuel_efficiency_score * weights.fuel_efficiency;

    // Sum the weighted components
    const totalScore = emptyMilesWeighted +
      networkContributionWeighted +
      onTimeWeighted +
      hubUtilizationWeighted +
      fuelEfficiencyWeighted;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, totalScore));
  }

  /**
   * Updates the total score based on current component scores
   * 
   * @returns Promise resolving to the updated model instance
   */
  async updateTotalScore(): Promise<DriverScoreModel> {
    this.total_score = this.calculateWeightedScore();
    return await this.$query().updateAndFetch();
  }

  /**
   * Retrieves the most recent score record for a driver
   * 
   * @param driverId The ID of the driver
   * @returns Promise resolving to the latest score or undefined if none exists
   */
  static async getLatestScoreForDriver(driverId: string): Promise<DriverScoreModel | undefined> {
    return await DriverScoreModel.query()
      .where('driver_id', driverId)
      .orderBy('calculated_at', 'desc')
      .limit(1)
      .first();
  }

  /**
   * Retrieves the score history for a driver with pagination
   * 
   * @param driverId The ID of the driver
   * @param limit Maximum number of records to return
   * @param offset Number of records to skip
   * @returns Promise resolving to paginated scores and total count
   */
  static async getScoreHistoryForDriver(
    driverId: string,
    limit: number,
    offset: number
  ): Promise<{ scores: DriverScoreModel[]; total: number }> {
    const [scores, countResult] = await Promise.all([
      DriverScoreModel.query()
        .where('driver_id', driverId)
        .orderBy('calculated_at', 'desc')
        .limit(limit)
        .offset(offset),
      DriverScoreModel.query()
        .where('driver_id', driverId)
        .count('score_id as count')
        .first()
    ]);

    const total = countResult ? Number((countResult as any).count) : 0;
    
    return {
      scores,
      total
    };
  }

  /**
   * Retrieves scores for a driver within a specific date range
   * 
   * @param driverId The ID of the driver
   * @param startDate Start of the date range
   * @param endDate End of the date range
   * @returns Promise resolving to an array of score records
   */
  static async getScoresByDateRange(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DriverScoreModel[]> {
    return await DriverScoreModel.query()
      .where('driver_id', driverId)
      .where('calculated_at', '>=', startDate)
      .where('calculated_at', '<=', endDate)
      .orderBy('calculated_at', 'asc');
  }

  /**
   * Retrieves the top N driver scores
   * 
   * @param limit Maximum number of records to return
   * @param region Optional region to filter by
   * @returns Promise resolving to an array of top score records
   */
  static async getTopScores(limit: number, region?: string): Promise<DriverScoreModel[]> {
    // Build a query to get the most recent score for each driver
    let query = DriverScoreModel.query()
      .select('driver_scores.*')
      .join(
        DriverScoreModel.query()
          .select('driver_id')
          .max('calculated_at as latest_calculated_at')
          .groupBy('driver_id')
          .as('latest_scores'),
        function() {
          this.on('driver_scores.driver_id', '=', 'latest_scores.driver_id')
            .andOn('driver_scores.calculated_at', '=', 'latest_scores.latest_calculated_at');
        }
      );

    // If region is specified, filter by driver's region
    if (region) {
      query = query
        .join('drivers', 'driver_scores.driver_id', 'drivers.driver_id')
        .join('carriers', 'drivers.carrier_id', 'carriers.carrier_id')
        .where('carriers.region', region);
    }

    // Order by score and limit results
    return await query
      .orderBy('total_score', 'desc')
      .limit(limit);
  }

  /**
   * Converts the model instance to a plain JSON object
   * 
   * @returns Plain object representation of the driver score
   */
  toJSON(): DriverScore {
    return {
      score_id: this.score_id,
      driver_id: this.driver_id,
      total_score: this.total_score,
      empty_miles_score: this.empty_miles_score,
      network_contribution_score: this.network_contribution_score,
      on_time_score: this.on_time_score,
      hub_utilization_score: this.hub_utilization_score,
      fuel_efficiency_score: this.fuel_efficiency_score,
      score_factors: this.score_factors,
      calculated_at: this.calculated_at
    };
  }
}

export default DriverScoreModel;