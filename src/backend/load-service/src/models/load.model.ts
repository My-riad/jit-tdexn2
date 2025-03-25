/**
 * Load Model
 * 
 * This model represents loads in the AI-driven Freight Optimization Platform.
 * It provides methods for CRUD operations, status management, and relationships
 * with associated entities like locations, status history, and documents.
 */

import { Model } from 'objection'; // objection@3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { Knex } from 'knex'; // knex@2.4.2
import { 
  Load, 
  LoadStatus, 
  EquipmentType,
  LoadWithDetails,
  LoadSearchParams
} from '../../../common/interfaces/load.interface';
import { LoadLocationModel } from './load-location.model';
import { LoadStatusModel } from './load-status.model';
import { LoadDocumentModel } from './load-document.model';
import db from '../../../common/config/database.config';
import logger from '../../../common/utils/logger';

// Initialize knex for Objection.js
const knex = db.getKnexInstance();
Model.knex(knex);

/**
 * LoadModel represents loads in the freight optimization platform
 * This is the core entity for freight transportation
 */
export class LoadModel extends Model implements Load {
  // Properties from Load interface
  load_id!: string;
  shipper_id!: string;
  reference_number!: string;
  description!: string;
  equipment_type!: EquipmentType;
  weight!: number;
  dimensions!: {
    length: number;
    width: number;
    height: number;
  };
  volume!: number;
  pallets!: number;
  commodity!: string;
  status!: LoadStatus;
  pickup_earliest!: Date;
  pickup_latest!: Date;
  delivery_earliest!: Date;
  delivery_latest!: Date;
  offered_rate!: number;
  special_instructions!: string;
  is_hazardous!: boolean;
  temperature_requirements?: {
    min_temp: number;
    max_temp: number;
  };
  created_at!: Date;
  updated_at!: Date;

  /**
   * Returns the database table name for this model
   */
  static get tableName(): string {
    return 'loads';
  }

  /**
   * Defines the JSON schema for validation of load objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['shipper_id', 'reference_number', 'equipment_type', 'weight'],
      properties: {
        load_id: { type: 'string', format: 'uuid' },
        shipper_id: { type: 'string', format: 'uuid' },
        reference_number: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', maxLength: 1000 },
        equipment_type: { type: 'string', enum: Object.values(EquipmentType) },
        weight: { type: 'number', minimum: 0 },
        dimensions: {
          type: 'object',
          properties: {
            length: { type: 'number', minimum: 0 },
            width: { type: 'number', minimum: 0 },
            height: { type: 'number', minimum: 0 }
          }
        },
        volume: { type: 'number', minimum: 0 },
        pallets: { type: 'number', minimum: 0, maximum: 1000 },
        commodity: { type: 'string', maxLength: 100 },
        status: { type: 'string', enum: Object.values(LoadStatus) },
        pickup_earliest: { type: 'string', format: 'date-time' },
        pickup_latest: { type: 'string', format: 'date-time' },
        delivery_earliest: { type: 'string', format: 'date-time' },
        delivery_latest: { type: 'string', format: 'date-time' },
        offered_rate: { type: 'number', minimum: 0 },
        special_instructions: { type: 'string', maxLength: 2000 },
        is_hazardous: { type: 'boolean' },
        temperature_requirements: {
          type: 'object',
          properties: {
            min_temp: { type: 'number' },
            max_temp: { type: 'number' }
          }
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines relationships with other models
   */
  static get relationMappings() {
    return {
      shipper: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/../../../shipper-service/src/models/shipper.model`,
        join: {
          from: 'loads.shipper_id',
          to: 'shippers.shipper_id'
        }
      },
      locations: {
        relation: Model.HasManyRelation,
        modelClass: LoadLocationModel,
        join: {
          from: 'loads.load_id',
          to: 'load_locations.load_id'
        }
      },
      statusHistory: {
        relation: Model.HasManyRelation,
        modelClass: LoadStatusModel,
        join: {
          from: 'loads.load_id',
          to: 'load_status_history.load_id'
        }
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: LoadDocumentModel,
        join: {
          from: 'loads.load_id',
          to: 'load_documents.load_id'
        }
      },
      assignments: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/../../../assignment-service/src/models/load-assignment.model`,
        join: {
          from: 'loads.load_id',
          to: 'load_assignments.load_id'
        }
      }
    };
  }

  /**
   * Retrieves a load by its ID
   * 
   * @param loadId - The unique identifier of the load
   * @returns The found load or undefined if not found
   */
  static async get(loadId: string): Promise<LoadModel | undefined> {
    try {
      return await LoadModel.query()
        .findById(loadId)
        .first();
    } catch (error) {
      logger.error(`Error retrieving load with ID ${loadId}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves a load with all its related details (locations, status history, documents)
   * 
   * @param loadId - The unique identifier of the load
   * @returns The load with all details or undefined if not found
   */
  static async getWithDetails(loadId: string): Promise<LoadWithDetails | undefined> {
    try {
      const load = await LoadModel.query()
        .findById(loadId)
        .first();

      if (!load) {
        return undefined;
      }

      // Fetch related data
      const [locations, statusHistory, documents] = await Promise.all([
        LoadLocationModel.getByLoadId(loadId),
        LoadStatusModel.getByLoadId(loadId),
        LoadDocumentModel.getByLoadId(loadId)
      ]);

      // Fetch shipper information (simplified for now)
      const shipper = { shipper_id: load.shipper_id };

      // Fetch assignments (if assignment service is available)
      const assignments = []; // Would fetch from assignment service in a real implementation

      // Combine into a LoadWithDetails object
      return {
        ...load,
        locations,
        status_history: statusHistory,
        documents,
        assignments,
        shipper
      } as LoadWithDetails;
    } catch (error) {
      logger.error(`Error retrieving load details for load ID ${loadId}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves all loads for a specific shipper with pagination
   * 
   * @param shipperId - The ID of the shipper
   * @param options - Pagination and sorting options
   * @returns Object containing loads array and total count
   */
  static async getByShipperId(
    shipperId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: string;
      status?: LoadStatus[];
    } = {}
  ): Promise<{ loads: LoadModel[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortDirection = 'desc',
        status
      } = options;

      const offset = (page - 1) * limit;

      // Start building the query
      let query = LoadModel.query()
        .where('shipper_id', shipperId);

      // Add status filter if provided
      if (status && status.length > 0) {
        query = query.whereIn('status', status);
      }

      // Add sorting
      query = query.orderBy(sortBy, sortDirection as 'asc' | 'desc');

      // Execute the query with pagination
      const [loads, countResult] = await Promise.all([
        query.clone().limit(limit).offset(offset),
        query.clone().count('* as count').first()
      ]);

      const total = countResult ? Number(countResult.count) : 0;

      return { loads, total };
    } catch (error) {
      logger.error(`Error retrieving loads for shipper ID ${shipperId}`, { error });
      throw error;
    }
  }

  /**
   * Searches for loads based on various criteria with pagination
   * 
   * @param searchParams - Search parameters
   * @returns Object containing matching loads and total count
   */
  static async search(searchParams: LoadSearchParams): Promise<{ loads: LoadModel[]; total: number }> {
    try {
      const {
        shipper_id,
        status,
        equipment_type,
        weight_min,
        weight_max,
        pickup_date_start,
        pickup_date_end,
        delivery_date_start,
        delivery_date_end,
        origin_latitude,
        origin_longitude,
        origin_radius,
        destination_latitude,
        destination_longitude,
        destination_radius,
        reference_number,
        is_hazardous,
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_direction = 'desc'
      } = searchParams;

      const offset = (page - 1) * limit;

      // Start building the main query
      let query = LoadModel.query();

      // Apply filters
      if (shipper_id) {
        query = query.where('shipper_id', shipper_id);
      }

      if (status && status.length > 0) {
        query = query.whereIn('status', status);
      }

      if (equipment_type && equipment_type.length > 0) {
        query = query.whereIn('equipment_type', equipment_type);
      }

      if (weight_min !== undefined) {
        query = query.where('weight', '>=', weight_min);
      }

      if (weight_max !== undefined) {
        query = query.where('weight', '<=', weight_max);
      }

      if (pickup_date_start) {
        query = query.where('pickup_earliest', '>=', pickup_date_start);
      }

      if (pickup_date_end) {
        query = query.where('pickup_latest', '<=', pickup_date_end);
      }

      if (delivery_date_start) {
        query = query.where('delivery_earliest', '>=', delivery_date_start);
      }

      if (delivery_date_end) {
        query = query.where('delivery_latest', '<=', delivery_date_end);
      }

      if (reference_number) {
        query = query.where('reference_number', 'ilike', `%${reference_number}%`);
      }

      if (is_hazardous !== undefined) {
        query = query.where('is_hazardous', is_hazardous);
      }

      // Geographic filters require joining with location table and using PostGIS
      if (origin_latitude && origin_longitude && origin_radius) {
        query = query
          .joinRelated('locations')
          .where('locations.location_type', 'PICKUP')
          .whereRaw(
            `ST_DWithin(
              ST_SetSRID(ST_MakePoint(locations.longitude, locations.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
              ? * 1609.34
            )`,
            [origin_longitude, origin_latitude, origin_radius]
          );
      }

      if (destination_latitude && destination_longitude && destination_radius) {
        query = query
          .joinRelated('locations')
          .where('locations.location_type', 'DELIVERY')
          .whereRaw(
            `ST_DWithin(
              ST_SetSRID(ST_MakePoint(locations.longitude, locations.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
              ? * 1609.34
            )`,
            [destination_longitude, destination_latitude, destination_radius]
          );
      }

      // Add sorting
      query = query.orderBy(sort_by, sort_direction as 'asc' | 'desc');

      // Execute the query with pagination
      const [loads, countResult] = await Promise.all([
        query.clone().limit(limit).offset(offset),
        query.clone().count('* as count').first()
      ]);

      const total = countResult ? Number(countResult.count) : 0;

      return { loads, total };
    } catch (error) {
      logger.error('Error searching loads', { error, searchParams });
      throw error;
    }
  }

  /**
   * Creates a new load in the database
   * 
   * @param loadData - The load data to create
   * @returns The newly created load
   */
  static async create(loadData: Partial<Load>): Promise<LoadModel> {
    try {
      const loadId = uuidv4();
      const now = new Date();

      // Set initial status and timestamps
      const newLoad = {
        ...loadData,
        load_id: loadId,
        status: loadData.status || LoadStatus.CREATED,
        created_at: now,
        updated_at: now
      };

      // Begin a transaction for creating the load and initial status
      const trx = await LoadModel.startTransaction();

      try {
        // Insert the load
        const createdLoad = await LoadModel.query(trx)
          .insert(newLoad)
          .returning('*');

        // Create initial status history record
        await LoadStatusModel.create({
          load_id: loadId,
          status: createdLoad.status,
          status_details: { message: 'Load created' },
          updated_by: 'system' // This would typically be the actual user
        });

        // Commit the transaction
        await trx.commit();

        logger.info(`Created new load with ID ${loadId}`);
        return createdLoad;
      } catch (error) {
        // Rollback the transaction on error
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Error creating load', { error, loadData });
      throw error;
    }
  }

  /**
   * Updates an existing load
   * 
   * @param loadId - The ID of the load to update
   * @param loadData - The updated load data
   * @returns The updated load or undefined if not found
   */
  static async update(loadId: string, loadData: Partial<Load>): Promise<LoadModel | undefined> {
    try {
      // Check if load exists
      const existingLoad = await LoadModel.query()
        .findById(loadId)
        .first();

      if (!existingLoad) {
        return undefined;
      }

      // Update the load
      const updatedLoad = await LoadModel.query()
        .patchAndFetchById(loadId, {
          ...loadData,
          updated_at: new Date()
        });

      logger.info(`Updated load with ID ${loadId}`);
      return updatedLoad;
    } catch (error) {
      logger.error(`Error updating load with ID ${loadId}`, { error, loadData });
      throw error;
    }
  }

  /**
   * Updates the status of a load and creates a status history record
   * 
   * @param loadId - The ID of the load to update
   * @param statusData - The status update data
   * @returns The updated load or undefined if not found
   */
  static async updateStatus(
    loadId: string,
    statusData: {
      status: LoadStatus;
      status_details?: Record<string, any>;
      latitude?: number;
      longitude?: number;
      updated_by: string;
    }
  ): Promise<LoadModel | undefined> {
    // Begin a transaction for updating load status and creating history
    const trx = await LoadModel.startTransaction();

    try {
      // Get current load
      const load = await LoadModel.query(trx)
        .findById(loadId)
        .first();

      if (!load) {
        await trx.rollback();
        return undefined;
      }

      // Validate the status transition
      if (!this.isValidStatusTransition(load.status, statusData.status)) {
        await trx.rollback();
        throw new Error(`Invalid status transition from ${load.status} to ${statusData.status}`);
      }

      // Update the load status
      const updatedLoad = await LoadModel.query(trx)
        .patchAndFetchById(loadId, {
          status: statusData.status,
          updated_at: new Date()
        });

      // Create a status history record
      await LoadStatusModel.create({
        load_id: loadId,
        status: statusData.status,
        status_details: statusData.status_details || {},
        latitude: statusData.latitude,
        longitude: statusData.longitude,
        updated_by: statusData.updated_by
      });

      // Commit the transaction
      await trx.commit();

      logger.info(`Updated status of load ${loadId} to ${statusData.status}`);
      return updatedLoad;
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback();
      logger.error(`Error updating status for load ${loadId}`, { error, statusData });
      throw error;
    }
  }

  /**
   * Deletes a load and all associated data
   * 
   * @param loadId - The ID of the load to delete
   * @returns True if load was deleted, false if not found
   */
  static async delete(loadId: string): Promise<boolean> {
    // Begin a transaction for deleting load and related data
    const trx = await LoadModel.startTransaction();

    try {
      // Delete related data first (foreign key constraints)
      await Promise.all([
        LoadLocationModel.deleteByLoadId(loadId),
        LoadStatusModel.deleteByLoadId(loadId),
        LoadDocumentModel.deleteByLoadId(loadId)
        // Would also delete assignments here if that model is available
      ]);

      // Delete the load
      const deleted = await LoadModel.query(trx)
        .deleteById(loadId);

      // Commit the transaction
      await trx.commit();

      const wasDeleted = deleted > 0;
      logger.info(`Deleted load with ID ${loadId}: ${wasDeleted}`);
      return wasDeleted;
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback();
      logger.error(`Error deleting load with ID ${loadId}`, { error });
      throw error;
    }
  }

  /**
   * Gets counts of loads by status
   * 
   * @param filterOptions - Optional filtering options
   * @returns Object with status counts
   */
  static async getStatusCounts(filterOptions?: {
    shipper_id?: string;
  }): Promise<Record<LoadStatus, number>> {
    try {
      let query = LoadModel.query()
        .select('status')
        .count('* as count')
        .groupBy('status');

      // Apply filters if provided
      if (filterOptions?.shipper_id) {
        query = query.where('shipper_id', filterOptions.shipper_id);
      }

      const counts = await query;

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
    } catch (error) {
      logger.error('Error getting load status counts', { error, filterOptions });
      throw error;
    }
  }

  /**
   * Checks if a status transition is valid based on the current status
   * 
   * @param currentStatus - The current status of the load
   * @param newStatus - The proposed new status
   * @returns True if the transition is valid, false otherwise
   */
  static isValidStatusTransition(currentStatus: LoadStatus, newStatus: LoadStatus): boolean {
    // Define allowed transitions for each status
    const validTransitions: Record<LoadStatus, LoadStatus[]> = {
      [LoadStatus.CREATED]: [LoadStatus.PENDING, LoadStatus.CANCELLED],
      [LoadStatus.PENDING]: [LoadStatus.OPTIMIZING, LoadStatus.AVAILABLE, LoadStatus.CANCELLED],
      [LoadStatus.OPTIMIZING]: [LoadStatus.AVAILABLE, LoadStatus.CANCELLED],
      [LoadStatus.AVAILABLE]: [LoadStatus.RESERVED, LoadStatus.CANCELLED, LoadStatus.EXPIRED],
      [LoadStatus.RESERVED]: [LoadStatus.ASSIGNED, LoadStatus.AVAILABLE, LoadStatus.CANCELLED],
      [LoadStatus.ASSIGNED]: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
      [LoadStatus.IN_TRANSIT]: [LoadStatus.AT_PICKUP, LoadStatus.DELAYED, LoadStatus.CANCELLED],
      [LoadStatus.AT_PICKUP]: [LoadStatus.LOADED, LoadStatus.EXCEPTION, LoadStatus.CANCELLED],
      [LoadStatus.LOADED]: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
      [LoadStatus.DELAYED]: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
      [LoadStatus.EXCEPTION]: [LoadStatus.RESOLVED, LoadStatus.CANCELLED],
      [LoadStatus.RESOLVED]: [LoadStatus.AT_PICKUP, LoadStatus.AT_DROPOFF, LoadStatus.CANCELLED],
      [LoadStatus.AT_DROPOFF]: [LoadStatus.DELIVERED, LoadStatus.EXCEPTION, LoadStatus.CANCELLED],
      [LoadStatus.DELIVERED]: [LoadStatus.COMPLETED, LoadStatus.EXCEPTION],
      [LoadStatus.COMPLETED]: [],
      [LoadStatus.CANCELLED]: [],
      [LoadStatus.EXPIRED]: [LoadStatus.AVAILABLE]
    };

    // Check if the new status is in the list of valid transitions
    return validTransitions[currentStatus]?.includes(newStatus) || currentStatus === newStatus;
  }

  /**
   * Finds loads with pickup or delivery locations near a specified point
   * 
   * @param latitude - The latitude of the center point
   * @param longitude - The longitude of the center point
   * @param radiusMiles - The radius in miles to search within
   * @param status - Optional filter for load status
   * @returns Array of nearby loads
   */
  static async getNearbyLoads(
    latitude: number,
    longitude: number,
    radiusMiles: number,
    status?: LoadStatus
  ): Promise<LoadModel[]> {
    try {
      // Build a query that joins with load_locations to find nearby loads
      let query = LoadModel.query()
        .distinct('loads.*')
        .join('load_locations', 'loads.load_id', 'load_locations.load_id')
        .whereRaw(
          `ST_DWithin(
            ST_SetSRID(ST_MakePoint(load_locations.longitude, load_locations.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
            ? * 1609.34
          )`,
          [longitude, latitude, radiusMiles]
        );

      // Filter by status if provided
      if (status) {
        query = query.where('loads.status', status);
      }

      // Calculate distance and order by proximity
      query = query
        .select(
          LoadModel.raw(
            `ST_Distance(
              ST_SetSRID(ST_MakePoint(load_locations.longitude, load_locations.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
            ) as distance`,
            [longitude, latitude]
          )
        )
        .orderBy('distance');

      return await query;
    } catch (error) {
      logger.error('Error finding nearby loads', { error, latitude, longitude, radiusMiles });
      throw error;
    }
  }

  /**
   * Gets loads that are available for assignment
   * 
   * @param filterOptions - Optional filtering options
   * @returns Array of available loads
   */
  static async getAvailableLoads(filterOptions?: {
    equipment_type?: EquipmentType[];
    weight_min?: number;
    weight_max?: number;
    origin_latitude?: number;
    origin_longitude?: number;
    origin_radius?: number;
  }): Promise<LoadModel[]> {
    try {
      let query = LoadModel.query()
        .where('status', LoadStatus.AVAILABLE);

      // Apply additional filters if provided
      if (filterOptions) {
        const {
          equipment_type,
          weight_min,
          weight_max,
          origin_latitude,
          origin_longitude,
          origin_radius
        } = filterOptions;

        if (equipment_type && equipment_type.length > 0) {
          query = query.whereIn('equipment_type', equipment_type);
        }

        if (weight_min !== undefined) {
          query = query.where('weight', '>=', weight_min);
        }

        if (weight_max !== undefined) {
          query = query.where('weight', '<=', weight_max);
        }

        // Geographic filter for origin
        if (origin_latitude && origin_longitude && origin_radius) {
          query = query
            .join('load_locations', function() {
              this.on('loads.load_id', '=', 'load_locations.load_id')
                .andOn('load_locations.location_type', '=', LoadModel.raw("'PICKUP'"));
            })
            .whereRaw(
              `ST_DWithin(
                ST_SetSRID(ST_MakePoint(load_locations.longitude, load_locations.latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                ? * 1609.34
              )`,
              [origin_longitude, origin_latitude, origin_radius]
            );
        }
      }

      return await query;
    } catch (error) {
      logger.error('Error getting available loads', { error, filterOptions });
      throw error;
    }
  }
}