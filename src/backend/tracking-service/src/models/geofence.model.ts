import { Model, raw, QueryBuilder } from 'objection'; // ^2.2.0
import { EntityType, GeofenceType } from '../../common/interfaces/position.interface';
import { isPointInPolygon } from '../../common/utils/geo-utils';
import logger from '../../common/utils/logger';

/**
 * Database model for geofences with methods for geospatial operations and queries
 */
export class GeofenceModel extends Model {
  // Properties
  geofence_id!: string;
  name!: string;
  description?: string;
  geofence_type!: GeofenceType;
  entity_type!: EntityType;
  entity_id?: string;
  geometry?: any; // PostGIS geometry object
  center_latitude?: number;
  center_longitude?: number;
  radius?: number;
  coordinates?: Array<{latitude: number, longitude: number}>;
  corridor_width?: number;
  metadata?: Record<string, any>;
  active!: boolean;
  start_date?: Date;
  end_date?: Date;
  created_at!: Date;
  updated_at!: Date;

  /**
   * Creates a new GeofenceModel instance
   */
  constructor() {
    super();
    this.active = true;
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  /**
   * Defines the database table name for this model
   * @returns The name of the database table ('geofences')
   */
  static get tableName(): string {
    return 'geofences';
  }

  /**
   * Defines the JSON schema for validation of geofence objects
   * @returns JSON schema object defining the structure and validation rules
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['geofence_id', 'name', 'geofence_type', 'entity_type', 'active'],
      properties: {
        geofence_id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'], maxLength: 1000 },
        geofence_type: { type: 'string', enum: Object.values(GeofenceType) },
        entity_type: { type: 'string', enum: Object.values(EntityType) },
        entity_id: { type: ['string', 'null'] },
        geometry: { type: 'object' },
        center_latitude: { type: ['number', 'null'], minimum: -90, maximum: 90 },
        center_longitude: { type: ['number', 'null'], minimum: -180, maximum: 180 },
        radius: { type: ['number', 'null'], minimum: 0 },
        coordinates: { 
          type: ['array', 'null'],
          items: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 }
            }
          },
          minItems: 3
        },
        corridor_width: { type: ['number', 'null'], minimum: 0 },
        metadata: { type: ['object', 'null'] },
        active: { type: 'boolean' },
        start_date: { type: ['string', 'object', 'null'], format: 'date-time' },
        end_date: { type: ['string', 'object', 'null'], format: 'date-time' },
        created_at: { type: ['string', 'object'], format: 'date-time' },
        updated_at: { type: ['string', 'object'], format: 'date-time' }
      }
    };
  }

  /**
   * Defines the primary key column for the model
   * @returns The name of the primary key column ('geofence_id')
   */
  static get idColumn(): string {
    return 'geofence_id';
  }

  /**
   * Defines relationships to other models using a function to avoid circular dependencies
   * @returns Object defining relationships to GeofenceEvent model
   */
  static get relationMappings() {
    return {
      events: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/geofence-event.model`,
        join: {
          from: 'geofences.geofence_id',
          to: 'geofence_events.geofence_id'
        }
      }
    };
  }

  /**
   * Finds a geofence by its ID
   * @param geofenceId - The ID of the geofence to find
   * @returns The geofence model or null if not found
   */
  static async findById(geofenceId: string): Promise<GeofenceModel | null> {
    logger.debug(`Finding geofence by ID: ${geofenceId}`);
    try {
      return await this.query().findById(geofenceId);
    } catch (error) {
      logger.error(`Error finding geofence by ID: ${geofenceId}`, { error });
      throw error;
    }
  }

  /**
   * Finds geofences associated with a specific entity type
   * @param entityType - The type of entity to find geofences for
   * @param activeOnly - Whether to return only active geofences (default: true)
   * @returns Array of geofences for the specified entity type
   */
  static async findByEntityType(
    entityType: EntityType, 
    activeOnly: boolean = true
  ): Promise<GeofenceModel[]> {
    logger.debug(`Finding geofences by entity type: ${entityType}, activeOnly: ${activeOnly}`);
    try {
      const query = this.query().where('entity_type', entityType);
      
      if (activeOnly) {
        query.where('active', true)
          .where(builder => {
            builder.where('start_date', null)
              .orWhere('start_date', '<=', new Date());
          })
          .where(builder => {
            builder.where('end_date', null)
              .orWhere('end_date', '>=', new Date());
          });
      }
      
      return await query;
    } catch (error) {
      logger.error(`Error finding geofences by entity type: ${entityType}`, { error });
      throw error;
    }
  }

  /**
   * Finds geofences associated with a specific entity
   * @param entityId - The ID of the entity
   * @param entityType - The type of entity
   * @param activeOnly - Whether to return only active geofences (default: true)
   * @returns Array of geofences for the specified entity
   */
  static async findByEntityId(
    entityId: string, 
    entityType: EntityType, 
    activeOnly: boolean = true
  ): Promise<GeofenceModel[]> {
    logger.debug(`Finding geofences by entity ID: ${entityId}, type: ${entityType}, activeOnly: ${activeOnly}`);
    try {
      const query = this.query()
        .where('entity_id', entityId)
        .where('entity_type', entityType);
      
      if (activeOnly) {
        query.where('active', true)
          .where(builder => {
            builder.where('start_date', null)
              .orWhere('start_date', '<=', new Date());
          })
          .where(builder => {
            builder.where('end_date', null)
              .orWhere('end_date', '>=', new Date());
          });
      }
      
      return await query;
    } catch (error) {
      logger.error(`Error finding geofences by entity ID: ${entityId}`, { error });
      throw error;
    }
  }

  /**
   * Finds geofences near a specific location
   * @param latitude - Latitude of the point
   * @param longitude - Longitude of the point
   * @param radiusInMeters - Search radius in meters
   * @param options - Additional search options
   * @returns Array of geofences within the specified radius
   */
  static async findNearby(
    latitude: number, 
    longitude: number, 
    radiusInMeters: number,
    options?: {
      entityType?: EntityType,
      active?: boolean,
      limit?: number
    }
  ): Promise<GeofenceModel[]> {
    logger.debug(`Finding geofences near [${latitude}, ${longitude}] within ${radiusInMeters}m`);
    try {
      // Create a PostGIS point from the provided coordinates
      const point = raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [longitude, latitude]);
      
      // Build query to find geofences within the radius
      const query = this.query()
        .whereRaw(`ST_DWithin(geometry::geography, ${point}::geography, ?)`, [radiusInMeters]);
      
      // Apply optional filters
      if (options?.entityType) {
        query.where('entity_type', options.entityType);
      }
      
      if (options?.active) {
        query.where('active', true)
          .where(builder => {
            builder.where('start_date', null)
              .orWhere('start_date', '<=', new Date());
          })
          .where(builder => {
            builder.where('end_date', null)
              .orWhere('end_date', '>=', new Date());
          });
      }
      
      if (options?.limit && options.limit > 0) {
        query.limit(options.limit);
      }
      
      return await query;
    } catch (error) {
      logger.error(`Error finding geofences near [${latitude}, ${longitude}]`, { error });
      throw error;
    }
  }

  /**
   * Creates a circular geofence
   * @param centerLatitude - Latitude of the circle center
   * @param centerLongitude - Longitude of the circle center
   * @param radiusInMeters - Radius of the circle in meters
   * @returns Geometry object representing a circle
   */
  static createCircle(centerLatitude: number, centerLongitude: number, radiusInMeters: number): any {
    logger.debug(`Creating circle geofence at [${centerLatitude}, ${centerLongitude}] with radius ${radiusInMeters}m`);
    if (typeof centerLatitude !== 'number' || typeof centerLongitude !== 'number' || typeof radiusInMeters !== 'number') {
      throw new Error('Invalid parameters for circle creation: latitude, longitude, and radius must be numbers');
    }
    
    if (centerLatitude < -90 || centerLatitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90 degrees');
    }
    
    if (centerLongitude < -180 || centerLongitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180 degrees');
    }
    
    if (radiusInMeters <= 0) {
      throw new Error('Invalid radius: must be greater than 0');
    }
    
    // Create a PostGIS geometry representing a circle
    const point = raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [centerLongitude, centerLatitude]);
    return raw(`ST_Buffer(${point}::geography, ?)::geometry`, [radiusInMeters]);
  }

  /**
   * Creates a polygon geofence from coordinates
   * @param coordinates - Array of latitude/longitude points defining the polygon
   * @returns Geometry object representing a polygon
   */
  static createPolygon(coordinates: Array<{latitude: number, longitude: number}>): any {
    logger.debug(`Creating polygon geofence with ${coordinates?.length || 0} points`);
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      throw new Error('Invalid coordinates for polygon creation: need at least 3 points');
    }
    
    // Validate coordinate values
    coordinates.forEach((point, index) => {
      if (typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
        throw new Error(`Invalid coordinate at index ${index}: latitude and longitude must be numbers`);
      }
      
      if (point.latitude < -90 || point.latitude > 90) {
        throw new Error(`Invalid latitude at index ${index}: must be between -90 and 90 degrees`);
      }
      
      if (point.longitude < -180 || point.longitude > 180) {
        throw new Error(`Invalid longitude at index ${index}: must be between -180 and 180 degrees`);
      }
    });
    
    // Ensure the polygon is closed (first and last points are the same)
    let polygonCoords = [...coordinates];
    if (
      polygonCoords[0].latitude !== polygonCoords[polygonCoords.length - 1].latitude || 
      polygonCoords[0].longitude !== polygonCoords[polygonCoords.length - 1].longitude
    ) {
      polygonCoords.push(polygonCoords[0]);
    }
    
    // Convert to WKT format for PostGIS
    const pointsStr = polygonCoords
      .map(point => `${point.longitude} ${point.latitude}`)
      .join(',');
    
    return raw(`ST_GeomFromText('POLYGON((${pointsStr}))', 4326)`);
  }

  /**
   * Creates a corridor geofence along a path with a specified width
   * @param pathCoordinates - Array of points defining the path centerline
   * @param widthInMeters - Width of the corridor in meters
   * @returns Geometry object representing a corridor
   */
  static createCorridor(
    pathCoordinates: Array<{latitude: number, longitude: number}>,
    widthInMeters: number
  ): any {
    logger.debug(`Creating corridor geofence with ${pathCoordinates?.length || 0} points and width ${widthInMeters}m`);
    if (!Array.isArray(pathCoordinates) || pathCoordinates.length < 2) {
      throw new Error('Invalid parameters for corridor creation: need at least 2 points');
    }
    
    if (typeof widthInMeters !== 'number' || widthInMeters <= 0) {
      throw new Error('Invalid corridor width: must be a positive number');
    }
    
    // Validate coordinate values
    pathCoordinates.forEach((point, index) => {
      if (typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
        throw new Error(`Invalid coordinate at index ${index}: latitude and longitude must be numbers`);
      }
      
      if (point.latitude < -90 || point.latitude > 90) {
        throw new Error(`Invalid latitude at index ${index}: must be between -90 and 90 degrees`);
      }
      
      if (point.longitude < -180 || point.longitude > 180) {
        throw new Error(`Invalid longitude at index ${index}: must be between -180 and 180 degrees`);
      }
    });
    
    // Create a linestring from the path coordinates
    const pointsStr = pathCoordinates
      .map(point => `${point.longitude} ${point.latitude}`)
      .join(',');
    
    const linestring = raw(`ST_GeomFromText('LINESTRING(${pointsStr})', 4326)`);
    
    // Buffer the linestring to create a corridor
    return raw(`ST_Buffer(${linestring}::geography, ?)::geometry`, [widthInMeters]);
  }

  /**
   * Checks if a point is inside this geofence
   * @param latitude - Latitude of the point to check
   * @param longitude - Longitude of the point to check
   * @returns True if the point is inside the geofence, false otherwise
   */
  async containsPoint(latitude: number, longitude: number): Promise<boolean> {
    logger.debug(`Checking if geofence ${this.geofence_id} contains point [${latitude}, ${longitude}]`);
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid coordinates: latitude and longitude must be numbers');
    }
    
    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90 degrees');
    }
    
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180 degrees');
    }
    
    try {
      // For polygons with stored coordinates, use the imported utility function
      if (this.geofence_type === GeofenceType.POLYGON && Array.isArray(this.coordinates) && this.coordinates.length > 2) {
        return isPointInPolygon(latitude, longitude, this.coordinates);
      }
      
      // For geometry stored in the database, use PostGIS
      const point = raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [longitude, latitude]);
      
      const result = await GeofenceModel.query()
        .select(raw(`ST_Contains(geometry, ${point}) as contains`))
        .where('geofence_id', this.geofence_id)
        .first();
      
      return result && result.contains;
    } catch (error) {
      logger.error(`Error checking if geofence contains point`, { error, geofenceId: this.geofence_id });
      throw error;
    }
  }

  /**
   * Gets the center point of the geofence
   * @returns Object with latitude and longitude of the center
   */
  async getCenter(): Promise<{latitude: number, longitude: number}> {
    logger.debug(`Getting center of geofence ${this.geofence_id}`);
    
    // For circles, use the stored center coordinates
    if (this.geofence_type === GeofenceType.CIRCLE && 
        typeof this.center_latitude === 'number' && 
        typeof this.center_longitude === 'number') {
      return {
        latitude: this.center_latitude,
        longitude: this.center_longitude
      };
    }
    
    try {
      // For other geofence types, calculate the centroid using PostGIS
      const result = await GeofenceModel.query()
        .select(raw(`
          ST_Y(ST_Centroid(geometry)) as latitude,
          ST_X(ST_Centroid(geometry)) as longitude
        `))
        .where('geofence_id', this.geofence_id)
        .first();
      
      if (!result) {
        throw new Error(`Could not calculate center for geofence ${this.geofence_id}`);
      }
      
      return {
        latitude: result.latitude,
        longitude: result.longitude
      };
    } catch (error) {
      logger.error(`Error getting center of geofence`, { error, geofenceId: this.geofence_id });
      throw error;
    }
  }

  /**
   * Gets the bounding box of the geofence
   * @returns Object with min/max latitude and longitude
   */
  async getBoundingBox(): Promise<{
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  }> {
    logger.debug(`Getting bounding box of geofence ${this.geofence_id}`);
    try {
      const result = await GeofenceModel.query()
        .select(raw(`
          ST_XMin(ST_Envelope(geometry)) as min_lon,
          ST_YMin(ST_Envelope(geometry)) as min_lat,
          ST_XMax(ST_Envelope(geometry)) as max_lon,
          ST_YMax(ST_Envelope(geometry)) as max_lat
        `))
        .where('geofence_id', this.geofence_id)
        .first();
      
      if (!result) {
        throw new Error(`Could not calculate bounding box for geofence ${this.geofence_id}`);
      }
      
      return {
        minLat: result.min_lat,
        maxLat: result.max_lat,
        minLon: result.min_lon,
        maxLon: result.max_lon
      };
    } catch (error) {
      logger.error(`Error getting bounding box of geofence`, { error, geofenceId: this.geofence_id });
      throw error;
    }
  }

  /**
   * Calculates the area of the geofence in square meters
   * @returns Area in square meters
   */
  async calculateArea(): Promise<number> {
    logger.debug(`Calculating area of geofence ${this.geofence_id}`);
    try {
      const result = await GeofenceModel.query()
        .select(raw(`ST_Area(geometry::geography) as area`))
        .where('geofence_id', this.geofence_id)
        .first();
      
      return result ? result.area : 0;
    } catch (error) {
      logger.error(`Error calculating area of geofence`, { error, geofenceId: this.geofence_id });
      throw error;
    }
  }

  /**
   * Checks if the geofence is currently active based on active flag and date range
   * @returns True if the geofence is active, false otherwise
   */
  isActive(): boolean {
    const now = new Date();
    
    // Check if geofence is marked as active
    if (!this.active) {
      return false;
    }
    
    // Check if current date is within start_date and end_date range
    if (this.start_date && this.start_date > now) {
      return false;
    }
    
    if (this.end_date && this.end_date < now) {
      return false;
    }
    
    return true;
  }

  /**
   * Converts the model to a JSON representation
   * @returns JSON representation of the geofence
   */
  toJSON(): Record<string, any> {
    const json: Record<string, any> = {
      ...this,
      isActive: this.isActive()
    };
    
    // Format dates for client consumption
    if (this.start_date) {
      json.start_date = this.start_date.toISOString();
    }
    
    if (this.end_date) {
      json.end_date = this.end_date.toISOString();
    }
    
    if (this.created_at) {
      json.created_at = this.created_at.toISOString();
    }
    
    if (this.updated_at) {
      json.updated_at = this.updated_at.toISOString();
    }
    
    return json;
  }
}