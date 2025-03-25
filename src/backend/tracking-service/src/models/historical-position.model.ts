import { Model, raw } from 'objection'; // v2.2.0
import knexPostgis from 'knex-postgis'; // v0.14.1
import { EntityType, PositionSource, HistoricalPosition } from '../../common/interfaces/position.interface';

/**
 * Database model for historical position data with time-series and geospatial capabilities.
 * This model represents the time-series storage of entity positions (drivers, vehicles) and
 * provides methods for querying historical positions, calculating trajectories, and performing
 * analytics on movement patterns.
 */
export class HistoricalPositionModel extends Model {
  position_id!: string;
  entity_id!: string;
  entity_type!: EntityType;
  latitude!: number;
  longitude!: number;
  heading!: number;
  speed!: number;
  accuracy!: number;
  source!: PositionSource;
  recorded_at!: Date;
  created_at!: Date;

  /**
   * Creates a new HistoricalPositionModel instance
   */
  constructor() {
    super();
    this.heading = 0;
    this.speed = 0;
    this.accuracy = 0;
    this.created_at = new Date();
  }

  /**
   * Defines the database table name for this model
   */
  static get tableName(): string {
    return 'historical_positions';
  }

  /**
   * Defines the JSON schema for validation of historical position objects
   */
  static jsonSchema = {
    type: 'object',
    required: ['position_id', 'entity_id', 'entity_type', 'latitude', 'longitude', 'recorded_at'],
    properties: {
      position_id: { type: 'string', format: 'uuid' },
      entity_id: { type: 'string' },
      entity_type: { type: 'string', enum: Object.values(EntityType) },
      latitude: { type: 'number', minimum: -90, maximum: 90 },
      longitude: { type: 'number', minimum: -180, maximum: 180 },
      heading: { type: 'number', minimum: 0, maximum: 359 },
      speed: { type: 'number', minimum: 0 },
      accuracy: { type: 'number', minimum: 0 },
      source: { type: 'string', enum: Object.values(PositionSource) },
      recorded_at: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' }
    }
  };

  /**
   * Defines the primary key column for the model
   */
  static get idColumn(): string {
    return 'position_id';
  }

  /**
   * Gets historical positions for an entity within a time range
   * 
   * @param entityId - ID of the entity to get positions for
   * @param entityType - Type of the entity
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @param options - Additional options (limit, offset, orderDirection)
   * @returns Array of historical positions within the specified time range
   */
  static async getByEntityId(
    entityId: string,
    entityType: EntityType,
    startTime: Date,
    endTime: Date,
    options: { limit?: number; offset?: number; orderDirection?: 'asc' | 'desc' } = {}
  ): Promise<HistoricalPositionModel[]> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (!startTime || !endTime) {
      throw new Error('Start and end times are required');
    }
    
    // Create query
    let query = this.query()
      .where('entity_id', entityId)
      .where('entity_type', entityType)
      .where('recorded_at', '>=', startTime)
      .where('recorded_at', '<=', endTime);
    
    // Apply limit and offset from options if provided
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    
    if (options.offset !== undefined) {
      query = query.offset(options.offset);
    }
    
    // Apply ordering by recorded_at (default: ascending)
    const orderDirection = options.orderDirection || 'asc';
    query = query.orderBy('recorded_at', orderDirection);
    
    return query;
  }

  /**
   * Gets a simplified trajectory for an entity as a GeoJSON LineString
   * 
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @param simplificationTolerance - Tolerance for simplifying the trajectory (default: 0.0001)
   * @returns GeoJSON LineString representing the simplified trajectory
   */
  static async getTrajectory(
    entityId: string,
    entityType: EntityType,
    startTime: Date,
    endTime: Date,
    simplificationTolerance: number = 0.0001
  ): Promise<object> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (!startTime || !endTime) {
      throw new Error('Start and end times are required');
    }
    
    // Get a reference to the PostGIS instance using the model's knex
    const st = knexPostgis(this.knex());
    
    // Use PostGIS functions to create a simplified trajectory as GeoJSON
    const result = await this.query()
      .select(
        raw(
          `ST_AsGeoJSON(
            ST_Simplify(
              ST_MakeLine(
                ST_MakePoint(longitude, latitude) ORDER BY recorded_at
              ),
              ?
            )
          ) as trajectory`,
          [simplificationTolerance]
        )
      )
      .where('entity_id', entityId)
      .where('entity_type', entityType)
      .where('recorded_at', '>=', startTime)
      .where('recorded_at', '<=', endTime)
      .first();
    
    if (!result || !result.trajectory) {
      return { type: 'LineString', coordinates: [] };
    }
    
    return JSON.parse(result.trajectory);
  }

  /**
   * Calculates the total distance traveled by an entity within a time range
   * 
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @returns Total distance traveled in meters
   */
  static async calculateDistance(
    entityId: string,
    entityType: EntityType,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (!startTime || !endTime) {
      throw new Error('Start and end times are required');
    }
    
    // Get historical positions for the entity within the time range
    const positions = await this.getByEntityId(entityId, entityType, startTime, endTime, { orderDirection: 'asc' });
    
    if (positions.length < 2) {
      return 0; // Can't calculate distance with fewer than 2 points
    }
    
    // Calculate distance using the Haversine formula via PostGIS
    let totalDistance = 0;
    
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      
      const result = await this.knex().raw(
        `SELECT ST_Distance_Sphere(
          ST_MakePoint(?, ?),
          ST_MakePoint(?, ?)
        ) as distance`,
        [prev.longitude, prev.latitude, curr.longitude, curr.latitude]
      );
      
      totalDistance += parseFloat(result.rows[0].distance);
    }
    
    return totalDistance;
  }

  /**
   * Calculates the average speed of an entity within a time range
   * 
   * @param entityId - ID of the entity
   * @param entityType - Type of the entity
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @returns Average speed in kilometers per hour
   */
  static async calculateAverageSpeed(
    entityId: string,
    entityType: EntityType,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    // Validate input parameters
    if (!entityId || !entityType) {
      throw new Error('Entity ID and type are required');
    }
    
    if (!startTime || !endTime) {
      throw new Error('Start and end times are required');
    }
    
    // Calculate the total distance traveled
    const distanceInMeters = await this.calculateDistance(entityId, entityType, startTime, endTime);
    
    // Calculate the total time elapsed between startTime and endTime
    const timeDiffMs = endTime.getTime() - startTime.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    
    if (timeDiffHours === 0) {
      return 0; // Avoid division by zero
    }
    
    // Calculate average speed in kilometers per hour
    const distanceInKm = distanceInMeters / 1000;
    const averageSpeedKmh = distanceInKm / timeDiffHours;
    
    return averageSpeedKmh;
  }

  /**
   * Generates heatmap data based on position density
   * 
   * @param entityType - Type of entity to generate heatmap for
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @param boundingBox - Geographic bounding box to limit results
   * @returns Array of points with intensity values for heatmap visualization
   */
  static async getHeatmapData(
    entityType: EntityType,
    startTime: Date,
    endTime: Date,
    boundingBox: { minLat: number; minLng: number; maxLat: number; maxLng: number }
  ): Promise<object[]> {
    // Validate input parameters
    if (!startTime || !endTime) {
      throw new Error('Start and end times are required');
    }
    
    if (!boundingBox) {
      throw new Error('Bounding box is required');
    }
    
    // Build the query to generate heatmap data using PostGIS functions
    let query = this.knex()
      .with('filtered_positions', (qb) => {
        qb.select('latitude', 'longitude')
          .from(this.tableName)
          .where('recorded_at', '>=', startTime)
          .where('recorded_at', '<=', endTime)
          .whereBetween('latitude', [boundingBox.minLat, boundingBox.maxLat])
          .whereBetween('longitude', [boundingBox.minLng, boundingBox.maxLng]);
        
        if (entityType) {
          qb.where('entity_type', entityType);
        }
      })
      .select(
        raw('ST_X(grid_point) as longitude'),
        raw('ST_Y(grid_point) as latitude'),
        raw('COUNT(*) as intensity')
      )
      .from(raw(`
        (SELECT 
          ST_SnapToGrid(
            ST_MakePoint(longitude, latitude),
            0.01
          ) as grid_point
        FROM filtered_positions) as grid_points
      `))
      .groupBy('grid_point')
      .orderBy('intensity', 'desc');
    
    const results = await query;
    
    // Format results for heatmap visualization
    return results.map((row) => ({
      longitude: parseFloat(row.longitude),
      latitude: parseFloat(row.latitude),
      intensity: parseInt(row.intensity, 10)
    }));
  }

  /**
   * Identifies common routes taken by entities
   * 
   * @param entityType - Type of entities to analyze
   * @param startTime - Start of the time range
   * @param endTime - End of the time range
   * @param similarityThreshold - Threshold for route similarity (default: 0.001)
   * @returns Array of common routes with frequency counts
   */
  static async findCommonRoutes(
    entityType: EntityType,
    startTime: Date,
    endTime: Date,
    similarityThreshold: number = 0.001
  ): Promise<object[]> {
    // Validate input parameters
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    if (!startTime || !endTime) {
      throw new Error('Start and end times are required');
    }
    
    // Get all unique entity IDs for the specified entity type and time range
    const entityIdsResult = await this.query()
      .distinct('entity_id')
      .where('entity_type', entityType)
      .where('recorded_at', '>=', startTime)
      .where('recorded_at', '<=', endTime);
    
    const entityIds = entityIdsResult.map(row => row.entity_id);
    
    if (entityIds.length === 0) {
      return [];
    }
    
    // Get trajectories for each entity
    const trajectories = [];
    for (const entityId of entityIds) {
      const trajectory = await this.getTrajectory(entityId, entityType, startTime, endTime);
      if (trajectory && trajectory.coordinates && trajectory.coordinates.length > 1) {
        trajectories.push({
          entityId,
          trajectory
        });
      }
    }
    
    if (trajectories.length < 2) {
      return []; // Need at least 2 trajectories to find common routes
    }
    
    // Cluster trajectories based on similarity
    const clusters = [];
    const assignedTrajectories = new Set();
    
    for (let i = 0; i < trajectories.length; i++) {
      if (assignedTrajectories.has(i)) continue;
      
      const cluster = [trajectories[i]];
      assignedTrajectories.add(i);
      
      for (let j = i + 1; j < trajectories.length; j++) {
        if (assignedTrajectories.has(j)) continue;
        
        // Calculate similarity between trajectories using Hausdorff distance
        const similarity = await this._calculateTrajectorySimilarity(
          trajectories[i].trajectory,
          trajectories[j].trajectory
        );
        
        if (similarity <= similarityThreshold) {
          cluster.push(trajectories[j]);
          assignedTrajectories.add(j);
        }
      }
      
      clusters.push(cluster);
    }
    
    // Format results
    return clusters.map(cluster => ({
      route: cluster[0].trajectory, // Use the first trajectory as representative
      frequency: cluster.length,
      entityIds: cluster.map(item => item.entityId)
    })).sort((a, b) => b.frequency - a.frequency); // Sort by frequency (descending)
  }

  /**
   * Helper method to calculate similarity between two trajectories
   * using Hausdorff distance through PostGIS
   * 
   * @private
   */
  private static async _calculateTrajectorySimilarity(
    trajectory1: any,
    trajectory2: any
  ): Promise<number> {
    const line1 = this._geoJsonToWkt(trajectory1);
    const line2 = this._geoJsonToWkt(trajectory2);
    
    const result = await this.knex().raw(
      `SELECT ST_HausdorffDistance(
        ST_GeomFromText(?),
        ST_GeomFromText(?)
      ) as distance`,
      [line1, line2]
    );
    
    return parseFloat(result.rows[0].distance);
  }

  /**
   * Helper method to convert GeoJSON to WKT format
   * 
   * @private
   */
  private static _geoJsonToWkt(geojson: any): string {
    if (geojson.type !== 'LineString' || !Array.isArray(geojson.coordinates)) {
      throw new Error('Invalid GeoJSON LineString');
    }
    
    const pointsText = geojson.coordinates
      .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
      .join(',');
    
    return `LINESTRING(${pointsText})`;
  }

  /**
   * Converts the model instance to the HistoricalPosition interface format
   */
  toInterface(): HistoricalPosition {
    return {
      position_id: this.position_id,
      entity_id: this.entity_id,
      entity_type: this.entity_type,
      latitude: this.latitude,
      longitude: this.longitude,
      heading: this.heading,
      speed: this.speed,
      accuracy: this.accuracy,
      source: this.source,
      recorded_at: this.recorded_at
    };
  }
}