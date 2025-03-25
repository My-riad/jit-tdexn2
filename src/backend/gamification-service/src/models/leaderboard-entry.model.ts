import { Model } from 'objection'; // v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import LeaderboardModel from './leaderboard.model';

/**
 * Objection.js model class for leaderboard entries that track driver rankings based on efficiency scores.
 * Represents individual entries in a leaderboard, tracking driver rankings, scores, and bonus information.
 * Supports the gamification features by maintaining driver positions in various leaderboards.
 * 
 * Implements requirements from:
 * - F-005: Leaderboards & AI-Powered Rewards
 * - Driver Management Screen: Driver Leaderboard
 * - Driver Mobile Application: Earnings and Leaderboard Screen
 */
export default class LeaderboardEntryModel extends Model {
  entry_id!: string;
  leaderboard_id!: string;
  driver_id!: string;
  driver_name!: string;
  rank!: number;
  previous_rank!: number;
  rank_change!: number;
  score!: number;
  bonus_amount!: number;
  bonus_paid!: boolean;
  created_at!: Date;
  updated_at!: Date;

  /**
   * Returns the database table name for this model
   */
  static get tableName(): string {
    return 'leaderboard_entries';
  }

  /**
   * Defines the JSON schema for validation of leaderboard entry objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['leaderboard_id', 'driver_id', 'driver_name', 'rank', 'score'],
      properties: {
        entry_id: { type: 'string', format: 'uuid' },
        leaderboard_id: { type: 'string', format: 'uuid' },
        driver_id: { type: 'string', format: 'uuid' },
        driver_name: { type: 'string', minLength: 1 },
        rank: { type: 'integer', minimum: 1 },
        previous_rank: { type: 'integer', minimum: 0, default: 0 },
        rank_change: { type: 'integer', default: 0 },
        score: { type: 'number', minimum: 0, maximum: 100 },
        bonus_amount: { type: 'number', minimum: 0, default: 0 },
        bonus_paid: { type: 'boolean', default: false },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines relationships to other models
   */
  static get relationMappings() {
    return {
      leaderboard: {
        relation: Model.BelongsToOneRelation,
        modelClass: LeaderboardModel,
        join: {
          from: 'leaderboard_entries.leaderboard_id',
          to: 'leaderboards.id'
        }
      }
    };
  }

  /**
   * Lifecycle hook that runs before inserting a new leaderboard entry record
   */
  $beforeInsert() {
    this.entry_id = this.entry_id || uuidv4();
    this.created_at = new Date();
    this.updated_at = new Date();
    
    // Calculate rank_change if previous_rank is provided
    if (this.previous_rank && this.previous_rank > 0) {
      this.rank_change = this.previous_rank - this.rank;
    } else {
      this.rank_change = 0;
    }
    
    // Set default bonus_paid status if not provided
    this.bonus_paid = this.bonus_paid !== undefined ? this.bonus_paid : false;
  }

  /**
   * Lifecycle hook that runs before updating a leaderboard entry record
   */
  $beforeUpdate() {
    this.updated_at = new Date();
    
    // If rank is being updated and we have a previous rank, calculate the change
    if (this.rank !== undefined && this.previous_rank) {
      this.rank_change = this.previous_rank - this.rank;
    }
  }

  /**
   * Calculates the change in rank compared to previous rank
   * @returns The change in rank (positive for improvement, negative for decline)
   */
  calculateRankChange(): number {
    if (!this.previous_rank || this.previous_rank === 0) {
      return 0;
    }
    return this.previous_rank - this.rank;
  }

  /**
   * Updates the rank of this entry and calculates rank change
   * @param newRank The new rank to set
   * @returns Promise resolving to the updated model instance
   */
  async updateRank(newRank: number): Promise<LeaderboardEntryModel> {
    this.previous_rank = this.rank;
    this.rank = newRank;
    this.rank_change = this.calculateRankChange();
    
    return this.$query().patchAndFetch({
      rank: this.rank,
      previous_rank: this.previous_rank,
      rank_change: this.rank_change,
      updated_at: new Date()
    });
  }

  /**
   * Marks the bonus as paid for this leaderboard entry
   * @returns Promise resolving to the updated model instance
   */
  async markBonusPaid(): Promise<LeaderboardEntryModel> {
    this.bonus_paid = true;
    
    return this.$query().patchAndFetch({
      bonus_paid: true,
      updated_at: new Date()
    });
  }

  /**
   * Finds a leaderboard entry for a specific driver and leaderboard
   * @param driverId The driver's ID
   * @param leaderboardId The leaderboard's ID
   * @returns Promise resolving to the entry or undefined if not found
   */
  static async findByDriverAndLeaderboard(
    driverId: string,
    leaderboardId: string
  ): Promise<LeaderboardEntryModel | undefined> {
    return LeaderboardEntryModel.query()
      .where('driver_id', driverId)
      .where('leaderboard_id', leaderboardId)
      .first();
  }

  /**
   * Gets the top N entries for a specific leaderboard
   * @param leaderboardId The leaderboard's ID
   * @param limit Number of entries to retrieve (default: 10)
   * @returns Promise resolving to an array of top entries
   */
  static async getTopEntries(
    leaderboardId: string,
    limit: number = 10
  ): Promise<LeaderboardEntryModel[]> {
    return LeaderboardEntryModel.query()
      .where('leaderboard_id', leaderboardId)
      .orderBy('rank', 'asc')
      .limit(limit);
  }

  /**
   * Gets all leaderboard entries for a specific driver
   * @param driverId The driver's ID
   * @param filters Optional filters for timeframe, leaderboardType, etc.
   * @param page Page number (1-based)
   * @param pageSize Number of entries per page
   * @returns Promise resolving to paginated entries and total count
   */
  static async getDriverEntries(
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
  ): Promise<{ entries: LeaderboardEntryModel[]; total: number }> {
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;
    
    // Build the base query
    let query = LeaderboardEntryModel.query()
      .where('driver_id', driverId)
      .withGraphJoined('leaderboard');
    
    // Apply additional filters
    if (filters.timeframe) {
      query = query.where('leaderboard.timeframe', filters.timeframe);
    }
    
    if (filters.leaderboardType) {
      query = query.where('leaderboard.leaderboard_type', filters.leaderboardType);
    }
    
    if (filters.region) {
      query = query.where('leaderboard.region', filters.region);
    }
    
    if (filters.startDate) {
      query = query.where('leaderboard.start_period', '>=', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.where('leaderboard.end_period', '<=', filters.endDate);
    }
    
    // Get total count
    const total = await query.clone().resultSize();
    
    // Get paginated results
    const entries = await query
      .orderBy('leaderboard.end_period', 'desc')
      .orderBy('rank', 'asc')
      .limit(pageSize)
      .offset(offset);
    
    return { entries, total };
  }
}