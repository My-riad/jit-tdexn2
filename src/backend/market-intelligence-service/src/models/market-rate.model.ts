import { v4 as uuidv4 } from 'uuid';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import logger from '../../../common/utils/logger';
import { db } from '../config/database.config';

// Global constants
const TABLE_NAME = 'market_rates';
const DEFAULT_SAMPLE_SIZE = 10;

/**
 * Model representing market rate data for freight lanes and equipment types.
 * Supports the platform's dynamic pricing capabilities and market intelligence features.
 */
class MarketRate {
  rate_id: string;
  origin_region: string;
  destination_region: string;
  equipment_type: EquipmentType;
  average_rate: number;
  min_rate: number;
  max_rate: number;
  sample_size: number;
  recorded_at: Date;
  created_at: Date;
  updated_at: Date;

  /**
   * Creates a new MarketRate instance
   * @param data Market rate data object
   */
  constructor(data: any) {
    this.rate_id = data.rate_id || uuidv4();
    this.origin_region = data.origin_region;
    this.destination_region = data.destination_region;
    this.equipment_type = data.equipment_type;
    this.average_rate = data.average_rate;
    this.min_rate = data.min_rate;
    this.max_rate = data.max_rate;
    this.sample_size = data.sample_size || DEFAULT_SAMPLE_SIZE;
    this.recorded_at = data.recorded_at ? new Date(data.recorded_at) : new Date();
    this.created_at = data.created_at ? new Date(data.created_at) : new Date();
    this.updated_at = data.updated_at ? new Date(data.updated_at) : new Date();
  }

  /**
   * Saves the market rate record to the database
   * @returns The saved market rate record
   */
  async save(): Promise<MarketRate> {
    try {
      // Check if record already exists
      const existing = await db.query(
        `SELECT * FROM ${TABLE_NAME} WHERE rate_id = $1`,
        [this.rate_id]
      );

      if (existing.rows && existing.rows.length > 0) {
        // Update existing record
        logger.info(`Updating existing market rate record: ${this.rate_id}`);
        
        await db.query(
          `UPDATE ${TABLE_NAME} 
           SET origin_region = $1, 
               destination_region = $2, 
               equipment_type = $3, 
               average_rate = $4, 
               min_rate = $5, 
               max_rate = $6, 
               sample_size = $7, 
               recorded_at = $8, 
               updated_at = $9 
           WHERE rate_id = $10`,
          [
            this.origin_region,
            this.destination_region,
            this.equipment_type,
            this.average_rate,
            this.min_rate,
            this.max_rate,
            this.sample_size,
            this.recorded_at,
            new Date(),
            this.rate_id
          ]
        );
      } else {
        // Insert new record
        logger.info(`Creating new market rate record: ${this.rate_id}`);
        
        await db.query(
          `INSERT INTO ${TABLE_NAME} 
           (rate_id, origin_region, destination_region, equipment_type, 
            average_rate, min_rate, max_rate, sample_size, 
            recorded_at, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            this.rate_id,
            this.origin_region,
            this.destination_region,
            this.equipment_type,
            this.average_rate,
            this.min_rate,
            this.max_rate,
            this.sample_size,
            this.recorded_at,
            this.created_at,
            this.updated_at
          ]
        );
      }

      return this;
    } catch (error) {
      logger.error('Error saving market rate record', { error, rateId: this.rate_id });
      throw error;
    }
  }

  /**
   * Finds a market rate record by its ID
   * @param rateId The unique ID of the market rate record
   * @returns The found market rate record or null if not found
   */
  static async findById(rateId: string): Promise<MarketRate | null> {
    try {
      const result = await db.query(
        `SELECT * FROM ${TABLE_NAME} WHERE rate_id = $1`,
        [rateId]
      );

      if (!result.rows || result.rows.length === 0) {
        logger.debug(`No market rate found with ID: ${rateId}`);
        return null;
      }

      return new MarketRate(result.rows[0]);
    } catch (error) {
      logger.error('Error finding market rate by ID', { error, rateId });
      throw error;
    }
  }

  /**
   * Finds the most recent market rate for a specific lane and equipment type
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @returns The most recent market rate record or null if not found
   */
  static async findByLane(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType
  ): Promise<MarketRate | null> {
    try {
      const result = await db.query(
        `SELECT * FROM ${TABLE_NAME} 
         WHERE origin_region = $1 
         AND destination_region = $2 
         AND equipment_type = $3 
         ORDER BY recorded_at DESC 
         LIMIT 1`,
        [originRegion, destinationRegion, equipmentType]
      );

      if (!result.rows || result.rows.length === 0) {
        logger.debug(`No market rate found for lane: ${originRegion} -> ${destinationRegion}, equipment: ${equipmentType}`);
        return null;
      }

      return new MarketRate(result.rows[0]);
    } catch (error) {
      logger.error('Error finding market rate by lane', {
        error,
        originRegion,
        destinationRegion,
        equipmentType
      });
      throw error;
    }
  }

  /**
   * Finds historical market rates for a specific lane and equipment type within a date range
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @param startDate The start date of the range
   * @param endDate The end date of the range
   * @returns Array of historical market rate records
   */
  static async findHistoricalRates(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    startDate: Date,
    endDate: Date
  ): Promise<MarketRate[]> {
    try {
      const result = await db.query(
        `SELECT * FROM ${TABLE_NAME} 
         WHERE origin_region = $1 
         AND destination_region = $2 
         AND equipment_type = $3 
         AND recorded_at BETWEEN $4 AND $5 
         ORDER BY recorded_at ASC`,
        [originRegion, destinationRegion, equipmentType, startDate, endDate]
      );

      logger.info(`Found ${result.rows.length} historical market rates for lane`, {
        originRegion,
        destinationRegion,
        equipmentType,
        startDate,
        endDate
      });

      return result.rows.map(row => new MarketRate(row));
    } catch (error) {
      logger.error('Error finding historical market rates', {
        error,
        originRegion,
        destinationRegion,
        equipmentType,
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Calculates the average rate for a specific lane and equipment type over a time period
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @param startDate The start date of the period
   * @param endDate The end date of the period
   * @returns The calculated average rate
   */
  static async calculateAverageRate(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Calculate weighted average based on sample_size
      const result = await db.query(
        `SELECT SUM(average_rate * sample_size) / SUM(sample_size) as weighted_avg 
         FROM ${TABLE_NAME} 
         WHERE origin_region = $1 
         AND destination_region = $2 
         AND equipment_type = $3 
         AND recorded_at BETWEEN $4 AND $5`,
        [originRegion, destinationRegion, equipmentType, startDate, endDate]
      );

      const weightedAvg = result.rows[0]?.weighted_avg || 0;
      
      logger.info(`Calculated average rate for lane: ${originRegion} -> ${destinationRegion}`, {
        equipmentType,
        rate: weightedAvg,
        startDate,
        endDate
      });

      return weightedAvg;
    } catch (error) {
      logger.error('Error calculating average rate', {
        error,
        originRegion,
        destinationRegion,
        equipmentType,
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Finds market rates for similar lanes when exact match is not available
   * @param originRegion The origin region
   * @param destinationRegion The destination region
   * @param equipmentType The equipment type
   * @returns Array of market rates for similar lanes
   */
  static async findSimilarLanes(
    originRegion: string,
    destinationRegion: string,
    equipmentType: EquipmentType
  ): Promise<MarketRate[]> {
    try {
      // Find lanes with either the same origin or destination
      const result = await db.query(
        `SELECT DISTINCT ON (origin_region, destination_region) * 
         FROM ${TABLE_NAME} 
         WHERE (origin_region = $1 OR destination_region = $2) 
         AND equipment_type = $3 
         ORDER BY origin_region, destination_region, recorded_at DESC`,
        [originRegion, destinationRegion, equipmentType]
      );

      logger.info(`Found ${result.rows.length} similar lanes`, {
        originRegion,
        destinationRegion,
        equipmentType
      });

      return result.rows.map(row => new MarketRate(row));
    } catch (error) {
      logger.error('Error finding similar lanes', {
        error,
        originRegion,
        destinationRegion,
        equipmentType
      });
      throw error;
    }
  }

  /**
   * Deletes a market rate record from the database
   * @returns True if deletion was successful, false otherwise
   */
  async delete(): Promise<boolean> {
    try {
      const result = await db.query(
        `DELETE FROM ${TABLE_NAME} WHERE rate_id = $1`,
        [this.rate_id]
      );

      const success = result.rowCount > 0;
      
      if (success) {
        logger.info(`Deleted market rate record: ${this.rate_id}`);
      } else {
        logger.warn(`No market rate record found to delete with ID: ${this.rate_id}`);
      }

      return success;
    } catch (error) {
      logger.error('Error deleting market rate record', { error, rateId: this.rate_id });
      throw error;
    }
  }

  /**
   * Retrieves all market rate records with optional filtering
   * @param filters Optional filters to apply
   * @param pagination Optional pagination parameters
   * @returns Object containing market rates and total count
   */
  static async findAll(
    filters: {
      originRegion?: string;
      destinationRegion?: string;
      equipmentType?: EquipmentType;
      startDate?: Date;
      endDate?: Date;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ rates: MarketRate[]; total: number }> {
    try {
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Add filters to query
      if (filters.originRegion) {
        conditions.push(`origin_region = $${paramIndex++}`);
        params.push(filters.originRegion);
      }

      if (filters.destinationRegion) {
        conditions.push(`destination_region = $${paramIndex++}`);
        params.push(filters.destinationRegion);
      }

      if (filters.equipmentType) {
        conditions.push(`equipment_type = $${paramIndex++}`);
        params.push(filters.equipmentType);
      }

      if (filters.startDate) {
        conditions.push(`recorded_at >= $${paramIndex++}`);
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push(`recorded_at <= $${paramIndex++}`);
        params.push(filters.endDate);
      }

      // Build WHERE clause
      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}` 
        : '';

      // Add pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;
      
      // Add sorting
      const sortBy = pagination.sortBy || 'recorded_at';
      const sortDirection = pagination.sortDirection || 'DESC';
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${TABLE_NAME} ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);

      // Get paginated results
      const query = `
        SELECT * FROM ${TABLE_NAME} 
        ${whereClause} 
        ORDER BY ${sortBy} ${sortDirection} 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      
      const queryParams = [...params, limit, offset];
      const result = await db.query(query, queryParams);

      logger.info(`Found ${result.rows.length} market rates (total: ${total})`, {
        filters,
        pagination
      });

      return {
        rates: result.rows.map(row => new MarketRate(row)),
        total
      };
    } catch (error) {
      logger.error('Error finding market rates', {
        error,
        filters,
        pagination
      });
      throw error;
    }
  }
}

export { MarketRate };