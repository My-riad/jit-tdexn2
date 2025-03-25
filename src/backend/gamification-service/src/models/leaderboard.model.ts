import { Model } from 'objection'; // v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0

/**
 * Represents a leaderboard that tracks driver rankings based on efficiency scores.
 * Supports different leaderboard types (weekly, monthly) and regions,
 * with functionality for managing entries, calculating rankings,
 * and determining bonus rewards for top performers.
 * 
 * Implements requirements from F-005: Leaderboards & AI-Powered Rewards
 */
export default class LeaderboardModel extends Model {
  id!: string;
  name!: string;
  leaderboard_type!: string;
  timeframe!: string;
  region!: string;
  start_period!: Date;
  end_period!: Date;
  is_active!: boolean;
  last_updated!: Date;
  bonus_structure!: Record<string, number>;
  created_at!: Date;
  updated_at!: Date;

  /**
   * Returns the database table name for this model
   */
  static get tableName(): string {
    return 'leaderboards';
  }

  /**
   * Defines the JSON schema for validation of leaderboard objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'leaderboard_type', 'timeframe', 'start_period', 'end_period'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1 },
        leaderboard_type: { 
          type: 'string', 
          enum: ['efficiency', 'network_contribution', 'on_time', 'hub_utilization', 'fuel_efficiency', 'overall'] 
        },
        timeframe: { 
          type: 'string', 
          enum: ['weekly', 'monthly', 'quarterly', 'yearly'] 
        },
        region: { type: ['string', 'null'] },
        start_period: { type: 'string', format: 'date-time' },
        end_period: { type: 'string', format: 'date-time' },
        is_active: { type: 'boolean', default: true },
        last_updated: { type: 'string', format: 'date-time' },
        bonus_structure: { 
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines relationships to other models using path references
   * to avoid circular dependencies
   */
  static get relationMappings() {
    return {
      entries: {
        relation: Model.HasManyRelation,
        modelClass: '../models/leaderboard-entry.model',
        join: {
          from: 'leaderboards.id',
          to: 'leaderboard_entries.leaderboard_id'
        }
      }
    };
  }

  /**
   * Lifecycle hook that runs before inserting a new leaderboard record
   */
  $beforeInsert() {
    this.id = this.id || uuidv4();
    this.is_active = this.is_active !== undefined ? this.is_active : true;
    this.last_updated = new Date();
    this.created_at = new Date();
    this.updated_at = new Date();
    
    // Initialize default bonus structure if not provided
    if (!this.bonus_structure) {
      this.bonus_structure = {
        '1': 450, // First place gets $450
        '2': 400, // Second place gets $400
        '3': 350, // Third place gets $350
        '4': 300, // Fourth place gets $300
        '5': 250, // Fifth place gets $250
        '6-10': 200, // 6th to 10th place get $200
        '11-20': 100, // 11th to 20th place get $100
        '21-50': 50   // 21st to 50th place get $50
      };
    }
  }

  /**
   * Lifecycle hook that runs before updating a leaderboard record
   */
  $beforeUpdate() {
    this.updated_at = new Date();
  }

  /**
   * Gets all entries for this leaderboard with pagination
   * @param page Page number (1-based)
   * @param pageSize Number of entries per page
   * @returns Promise resolving to paginated entries and total count
   */
  async getEntries(page: number = 1, pageSize: number = 20): Promise<{ entries: any[]; total: number }> {
    const offset = (page - 1) * pageSize;
    
    const entries = await this.$relatedQuery('entries')
      .orderBy('rank', 'asc')
      .limit(pageSize)
      .offset(offset);
      
    const total = await this.$relatedQuery('entries').resultSize();
    
    return { entries, total };
  }

  /**
   * Gets the top N entries for this leaderboard
   * @param limit Number of top entries to retrieve
   * @returns Promise resolving to array of top entries
   */
  async getTopEntries(limit: number = 10): Promise<any[]> {
    return this.$relatedQuery('entries')
      .orderBy('rank', 'asc')
      .limit(limit);
  }

  /**
   * Gets a specific driver's entry in this leaderboard
   * @param driverId The driver's ID
   * @returns Promise resolving to the driver's entry or null if not found
   */
  async getDriverEntry(driverId: string): Promise<any | null> {
    return this.$relatedQuery('entries')
      .where('driver_id', driverId)
      .first();
  }

  /**
   * Updates the last_updated timestamp of this leaderboard
   * @returns Promise resolving to the updated model instance
   */
  async updateLastUpdated(): Promise<LeaderboardModel> {
    this.last_updated = new Date();
    return this.$query().patchAndFetchById(this.id, {
      last_updated: this.last_updated
    });
  }

  /**
   * Deactivates this leaderboard
   * @returns Promise resolving to the updated model instance
   */
  async deactivate(): Promise<LeaderboardModel> {
    this.is_active = false;
    return this.$query().patchAndFetchById(this.id, {
      is_active: false,
      updated_at: new Date()
    });
  }

  /**
   * Gets the bonus amount for a specific rank
   * @param rank The rank to get the bonus amount for
   * @returns The bonus amount for the specified rank
   */
  getBonusAmount(rank: number): number {
    // Check if there's a specific amount for this rank as a string key
    const rankKey = rank.toString();
    if (this.bonus_structure && this.bonus_structure[rankKey] !== undefined) {
      return this.bonus_structure[rankKey];
    }
    
    // Check for range keys like "6-10"
    for (const key in this.bonus_structure) {
      if (key.includes('-')) {
        const [start, end] = key.split('-').map(Number);
        if (rank >= start && rank <= end) {
          return this.bonus_structure[key];
        }
      }
    }
    
    // Default bonus structure if no specific rank or range is found
    if (rank <= 5) {
      return 500 - (rank - 1) * 50; // 500, 450, 400, 350, 300
    } else if (rank <= 10) {
      return 250 - (rank - 6) * 25; // 250, 225, 200, 175, 150
    } else if (rank <= 20) {
      return 100;
    } else if (rank <= 50) {
      return 50;
    }
    
    return 0; // No bonus for ranks beyond 50
  }

  /**
   * Generates a new leaderboard for the next time period
   * @returns Promise resolving to the newly created leaderboard
   */
  async generateNextPeriod(): Promise<LeaderboardModel> {
    let newStartPeriod: Date;
    let newEndPeriod: Date;
    let periodName: string;
    
    // Calculate next period based on timeframe
    const currentEnd = new Date(this.end_period);
    
    switch(this.timeframe) {
      case 'weekly':
        // New period starts the day after the current end date
        newStartPeriod = new Date(currentEnd);
        newStartPeriod.setDate(newStartPeriod.getDate() + 1);
        
        // End date is 7 days after start
        newEndPeriod = new Date(newStartPeriod);
        newEndPeriod.setDate(newEndPeriod.getDate() + 6); // 7 days total (inclusive of start)
        
        // Format: "Weekly May 15-21, 2023"
        periodName = `Weekly ${formatDateRange(newStartPeriod, newEndPeriod)}`;
        break;
        
      case 'monthly':
        // New period starts the day after the current end date
        newStartPeriod = new Date(currentEnd);
        newStartPeriod.setDate(newStartPeriod.getDate() + 1);
        
        // End date is the last day of the next month
        newEndPeriod = new Date(newStartPeriod);
        newEndPeriod.setMonth(newEndPeriod.getMonth() + 1);
        newEndPeriod.setDate(0); // Last day of the month
        
        // Format: "Monthly June 2023"
        periodName = `Monthly ${formatMonth(newStartPeriod)}`;
        break;
        
      case 'quarterly':
        // New period starts the day after the current end date
        newStartPeriod = new Date(currentEnd);
        newStartPeriod.setDate(newStartPeriod.getDate() + 1);
        
        // End date is approximately 3 months later
        newEndPeriod = new Date(newStartPeriod);
        newEndPeriod.setMonth(newEndPeriod.getMonth() + 3);
        newEndPeriod.setDate(newEndPeriod.getDate() - 1); // Adjust to get exactly 3 months
        
        // Format: "Q3 2023"
        const quarter = Math.floor(newStartPeriod.getMonth() / 3) + 1;
        periodName = `Q${quarter} ${newStartPeriod.getFullYear()}`;
        break;
        
      case 'yearly':
        // New period starts the day after the current end date
        newStartPeriod = new Date(currentEnd);
        newStartPeriod.setDate(newStartPeriod.getDate() + 1);
        
        // End date is approximately 1 year later
        newEndPeriod = new Date(newStartPeriod);
        newEndPeriod.setFullYear(newEndPeriod.getFullYear() + 1);
        newEndPeriod.setDate(newEndPeriod.getDate() - 1); // Adjust to get exactly 1 year
        
        // Format: "2023 Annual"
        periodName = `${newStartPeriod.getFullYear()} Annual`;
        break;
        
      default:
        throw new Error(`Unsupported timeframe: ${this.timeframe}`);
    }
    
    // Generate name if it follows a date pattern
    let newName = this.name;
    if (this.name.includes(this.timeframe.charAt(0).toUpperCase() + this.timeframe.slice(1))) {
      // If the name follows the pattern like "Weekly May 8-14, 2023", replace with new period
      newName = `${this.leaderboard_type.charAt(0).toUpperCase() + this.leaderboard_type.slice(1)} ${periodName}`;
    }
    
    // Add region if present
    if (this.region && !newName.includes(this.region)) {
      newName += ` - ${this.region}`;
    }
    
    // Create new leaderboard
    const newLeaderboard = await LeaderboardModel.query().insert({
      name: newName,
      leaderboard_type: this.leaderboard_type,
      timeframe: this.timeframe,
      region: this.region,
      start_period: newStartPeriod,
      end_period: newEndPeriod,
      is_active: true,
      bonus_structure: { ...this.bonus_structure } // Clone the bonus structure
    });
    
    return newLeaderboard;
  }

  /**
   * Finds active leaderboards with optional filtering
   * @param filters Optional filters for region, leaderboardType, and timeframe
   * @returns Promise resolving to array of active leaderboards
   */
  static async findActive(filters: {
    region?: string;
    leaderboardType?: string;
    timeframe?: string;
  } = {}): Promise<LeaderboardModel[]> {
    let query = LeaderboardModel.query().where('is_active', true);
    
    if (filters.region) {
      query = query.where('region', filters.region);
    }
    
    if (filters.leaderboardType) {
      query = query.where('leaderboard_type', filters.leaderboardType);
    }
    
    if (filters.timeframe) {
      query = query.where('timeframe', filters.timeframe);
    }
    
    return query;
  }

  /**
   * Finds leaderboards that cover a specific date
   * @param date The date to check
   * @param filters Optional filters for region, leaderboardType, timeframe, and isActive
   * @returns Promise resolving to array of matching leaderboards
   */
  static async findByPeriod(date: Date, filters: {
    region?: string;
    leaderboardType?: string;
    timeframe?: string;
    isActive?: boolean;
  } = {}): Promise<LeaderboardModel[]> {
    let query = LeaderboardModel.query()
      .where('start_period', '<=', date)
      .where('end_period', '>=', date);
    
    if (filters.region) {
      query = query.where('region', filters.region);
    }
    
    if (filters.leaderboardType) {
      query = query.where('leaderboard_type', filters.leaderboardType);
    }
    
    if (filters.timeframe) {
      query = query.where('timeframe', filters.timeframe);
    }
    
    if (filters.isActive !== undefined) {
      query = query.where('is_active', filters.isActive);
    }
    
    return query;
  }

  /**
   * Finds leaderboards that are ending soon
   * @param daysThreshold Number of days threshold (default: 1)
   * @returns Promise resolving to array of leaderboards ending soon
   */
  static async findEndingSoon(daysThreshold: number = 1): Promise<LeaderboardModel[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return LeaderboardModel.query()
      .where('end_period', '<=', thresholdDate)
      .where('is_active', true);
  }
}

/**
 * Helper function to format a date range like "May 15-21, 2023"
 */
function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleString('en-US', { month: 'long' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();
  
  return `${startMonth} ${startDay}-${endDay}, ${year}`;
}

/**
 * Helper function to format a month like "June 2023"
 */
function formatMonth(date: Date): string {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}