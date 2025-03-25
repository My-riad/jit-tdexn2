import { Model } from 'objection'; // objection@^3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { LoadStatus, LoadStatusHistory } from '../../../common/interfaces/load.interface';
import db from '../../../common/config/database.config';

/**
 * Model representing the load status history in the system.
 * Tracks all status changes for loads throughout their lifecycle,
 * providing an audit trail for compliance and analytics purposes.
 */
export class LoadStatusModel extends Model implements LoadStatusHistory {
  // Properties matching the LoadStatusHistory interface
  status_id!: string;
  load_id!: string;
  status!: LoadStatus;
  status_details!: Record<string, any>;
  latitude?: number;
  longitude?: number;
  updated_by!: string;
  updated_at!: Date;
  created_at!: Date;

  /**
   * Returns the database table name for this model
   */
  static get tableName(): string {
    return 'load_status_history';
  }

  /**
   * Defines the JSON schema for validation of load status history objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['load_id', 'status', 'updated_by'],
      properties: {
        status_id: { type: 'string', format: 'uuid' },
        load_id: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: Object.values(LoadStatus) },
        status_details: { 
          type: 'object',
          additionalProperties: true
        },
        latitude: { type: ['number', 'null'] },
        longitude: { type: ['number', 'null'] },
        updated_by: { type: 'string' },
        updated_at: { type: 'string', format: 'date-time' },
        created_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines relationships with other models
   */
  static get relationMappings() {
    return {
      load: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/../models/load.model`,
        join: {
          from: 'load_status_history.load_id',
          to: 'loads.load_id'
        }
      }
    };
  }

  /**
   * Retrieves a status history record by its ID
   * @param statusId The ID of the status record to retrieve
   * @returns The found status history record or undefined
   */
  static async get(statusId: string): Promise<LoadStatusModel | undefined> {
    return this.query().findById(statusId);
  }

  /**
   * Retrieves all status history records for a specific load
   * @param loadId The ID of the load to get status history for
   * @returns Array of status history records for the load
   */
  static async getByLoadId(loadId: string): Promise<LoadStatusModel[]> {
    return this.query()
      .where('load_id', loadId)
      .orderBy('created_at', 'asc');
  }

  /**
   * Retrieves the current (most recent) status for a load
   * @param loadId The ID of the load to get current status for
   * @returns The current status or null if no status found
   */
  static async getCurrentStatus(loadId: string): Promise<LoadStatus | null> {
    const latestStatus = await this.query()
      .where('load_id', loadId)
      .orderBy('created_at', 'desc')
      .first();
    
    return latestStatus ? latestStatus.status : null;
  }

  /**
   * Retrieves a chronological timeline of status changes for a load
   * @param loadId The ID of the load to get status timeline for
   * @returns Chronologically ordered array of status records
   */
  static async getStatusTimeline(loadId: string): Promise<LoadStatusModel[]> {
    return this.query()
      .where('load_id', loadId)
      .orderBy('created_at', 'asc');
  }

  /**
   * Creates a new status history record
   * @param statusData The status data to create
   * @returns The newly created status history record
   */
  static async create(statusData: {
    load_id: string;
    status: LoadStatus;
    status_details?: Record<string, any>;
    latitude?: number;
    longitude?: number;
    updated_by: string;
  }): Promise<LoadStatusModel> {
    const now = new Date();
    
    return this.query().insert({
      status_id: uuidv4(),
      ...statusData,
      status_details: statusData.status_details || {},
      created_at: now,
      updated_at: now
    });
  }

  /**
   * Gets counts of loads by current status
   * @param filterOptions Optional filtering criteria
   * @returns Object with status counts
   */
  static async getStatusCounts(filterOptions?: object): Promise<Record<LoadStatus, number>> {
    // Subquery to get the most recent status for each load
    const latestStatusSubquery = this.query()
      .select('load_id')
      .max('created_at as latest_time')
      .groupBy('load_id')
      .as('latest_status');
    
    // Main query to get status counts
    const counts = await this.query()
      .select('status')
      .count('* as count')
      .join(latestStatusSubquery, function() {
        this.on('load_status_history.load_id', '=', 'latest_status.load_id')
          .andOn('load_status_history.created_at', '=', 'latest_status.latest_time');
      })
      .groupBy('status');
    
    // Convert to record object
    const statusCounts: Record<LoadStatus, number> = {} as Record<LoadStatus, number>;
    
    // Initialize all statuses with zero count
    Object.values(LoadStatus).forEach(status => {
      statusCounts[status] = 0;
    });
    
    // Update with actual counts
    counts.forEach(item => {
      statusCounts[item.status as LoadStatus] = Number(item.count);
    });
    
    return statusCounts;
  }

  /**
   * Deletes all status history records for a load
   * @param loadId The ID of the load to delete status history for
   * @returns Number of status records deleted
   */
  static async deleteByLoadId(loadId: string): Promise<number> {
    return this.query().delete().where('load_id', loadId);
  }
}