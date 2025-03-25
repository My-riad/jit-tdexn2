/**
 * Load Location Model
 * 
 * This model represents pickup, delivery, and intermediate stop locations associated 
 * with loads in the freight optimization platform. It provides methods for CRUD operations 
 * and geospatial queries.
 */

import { Model } from 'objection'; // objection@3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { LoadLocation, LoadLocationType } from '../../../common/interfaces/load.interface';
import db from '../../../common/config/database.config';

// Initialize knex for Objection.js
const knex = db.getKnexInstance();
Model.knex(knex);

/**
 * LoadLocationModel represents locations associated with loads
 * This includes pickup, delivery, and intermediate stop locations
 */
export class LoadLocationModel extends Model implements LoadLocation {
  // Properties from LoadLocation interface
  location_id!: string;
  load_id!: string;
  location_type!: LoadLocationType;
  facility_name!: string;
  address!: string;
  city!: string;
  state!: string;
  zip!: string;
  latitude!: number;
  longitude!: number;
  earliest_time!: Date;
  latest_time!: Date;
  contact_name!: string;
  contact_phone!: string;
  special_instructions!: string;
  created_at!: Date;
  updated_at!: Date;

  /**
   * Returns the database table name for this model
   */
  static get tableName(): string {
    return 'load_locations';
  }

  /**
   * Defines the JSON schema for validation of load location objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['load_id', 'location_type', 'address', 'latitude', 'longitude'],
      properties: {
        location_id: { type: 'string', format: 'uuid' },
        load_id: { type: 'string', format: 'uuid' },
        location_type: { type: 'string', enum: Object.values(LoadLocationType) },
        facility_name: { type: 'string', maxLength: 200 },
        address: { type: 'string', maxLength: 500 },
        city: { type: 'string', maxLength: 100 },
        state: { type: 'string', maxLength: 50 },
        zip: { type: 'string', maxLength: 20 },
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
        earliest_time: { type: 'string', format: 'date-time' },
        latest_time: { type: 'string', format: 'date-time' },
        contact_name: { type: 'string', maxLength: 100 },
        contact_phone: { type: 'string', maxLength: 50 },
        special_instructions: { type: 'string', maxLength: 1000 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines relationships with other models
   */
  static get relationMappings() {
    // Using dynamic import to avoid circular dependencies
    return {
      load: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('../load.model').LoadModel,
        join: {
          from: 'load_locations.load_id',
          to: 'loads.load_id'
        }
      }
    };
  }

  /**
   * Retrieves a load location by its ID
   * 
   * @param locationId - The unique identifier of the location
   * @returns The found load location or undefined if not found
   */
  static async get(locationId: string): Promise<LoadLocationModel | undefined> {
    return await LoadLocationModel.query()
      .findById(locationId)
      .first();
  }

  /**
   * Retrieves all locations for a specific load
   * 
   * @param loadId - The ID of the load
   * @returns Array of load locations associated with the load
   */
  static async getByLoadId(loadId: string): Promise<LoadLocationModel[]> {
    return await LoadLocationModel.query()
      .where('load_id', loadId)
      .orderBy('location_type');
  }

  /**
   * Retrieves the pickup location for a specific load
   * 
   * @param loadId - The ID of the load
   * @returns The pickup location or undefined if not found
   */
  static async getPickupLocation(loadId: string): Promise<LoadLocationModel | undefined> {
    return await LoadLocationModel.query()
      .where({
        load_id: loadId,
        location_type: LoadLocationType.PICKUP
      })
      .first();
  }

  /**
   * Retrieves the delivery location for a specific load
   * 
   * @param loadId - The ID of the load
   * @returns The delivery location or undefined if not found
   */
  static async getDeliveryLocation(loadId: string): Promise<LoadLocationModel | undefined> {
    return await LoadLocationModel.query()
      .where({
        load_id: loadId,
        location_type: LoadLocationType.DELIVERY
      })
      .first();
  }

  /**
   * Creates a new load location
   * 
   * @param locationData - The location data to create
   * @returns The newly created load location
   */
  static async create(locationData: Partial<LoadLocation>): Promise<LoadLocationModel> {
    const locationId = locationData.location_id || uuidv4();
    
    return await LoadLocationModel.query()
      .insert({
        location_id: locationId,
        ...locationData,
        created_at: new Date(),
        updated_at: new Date()
      });
  }

  /**
   * Creates multiple load locations for a load
   * 
   * @param loadId - The ID of the load
   * @param locationsData - Array of location data to create
   * @returns Array of created load locations
   */
  static async createMany(
    loadId: string,
    locationsData: Partial<LoadLocation>[]
  ): Promise<LoadLocationModel[]> {
    const trx = await LoadLocationModel.startTransaction();
    
    try {
      const locations = await Promise.all(
        locationsData.map(async (locationData) => {
          const locationId = locationData.location_id || uuidv4();
          
          return await LoadLocationModel.query(trx)
            .insert({
              location_id: locationId,
              load_id: loadId,
              ...locationData,
              created_at: new Date(),
              updated_at: new Date()
            });
        })
      );
      
      await trx.commit();
      return locations;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Updates an existing load location
   * 
   * @param locationId - The ID of the location to update
   * @param locationData - The updated location data
   * @returns The updated location or undefined if not found
   */
  static async update(
    locationId: string,
    locationData: Partial<LoadLocation>
  ): Promise<LoadLocationModel | undefined> {
    const location = await LoadLocationModel.query()
      .findById(locationId);
    
    if (!location) {
      return undefined;
    }
    
    return await LoadLocationModel.query()
      .patchAndFetchById(locationId, {
        ...locationData,
        updated_at: new Date()
      });
  }

  /**
   * Deletes a load location
   * 
   * @param locationId - The ID of the location to delete
   * @returns True if location was deleted, false if not found
   */
  static async delete(locationId: string): Promise<boolean> {
    const count = await LoadLocationModel.query()
      .deleteById(locationId);
    
    return count > 0;
  }

  /**
   * Deletes all locations for a specific load
   * 
   * @param loadId - The ID of the load
   * @returns Number of deleted locations
   */
  static async deleteByLoadId(loadId: string): Promise<number> {
    return await LoadLocationModel.query()
      .delete()
      .where('load_id', loadId);
  }

  /**
   * Finds load locations within a specified radius of a point
   * 
   * @param latitude - The latitude of the center point
   * @param longitude - The longitude of the center point
   * @param radiusMiles - The radius in miles to search within
   * @param locationType - Optional filter for location type
   * @returns Array of nearby load locations
   */
  static async findNearby(
    latitude: number,
    longitude: number,
    radiusMiles: number,
    locationType?: LoadLocationType
  ): Promise<LoadLocationModel[]> {
    // Build the query using PostGIS ST_DWithin function
    // ST_DWithin returns true if points are within specified distance
    let query = LoadLocationModel.query()
      .select('*')
      .whereRaw(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
          ? * 1609.34
        )`,
        [longitude, latitude, radiusMiles]
      );
    
    // Add location type filter if provided
    if (locationType) {
      query = query.where('location_type', locationType);
    }
    
    // Calculate distance and order by proximity
    query = query
      .select(
        LoadLocationModel.raw(
          `ST_Distance(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
          ) as distance`,
          [longitude, latitude]
        )
      )
      .orderBy('distance');
    
    return await query;
  }

  /**
   * Validates and geocodes an address
   * 
   * @param locationData - The location data to validate
   * @returns Location data with geocoded coordinates
   */
  static async validateAddress(
    locationData: Partial<LoadLocation>
  ): Promise<Partial<LoadLocation>> {
    // Check if we have all the address components
    if (!locationData.address || !locationData.city || !locationData.state || !locationData.zip) {
      throw new Error('Address information is incomplete');
    }
    
    // If we already have coordinates, return the data as is
    if (locationData.latitude !== undefined && locationData.longitude !== undefined) {
      return locationData;
    }
    
    // In a real implementation, we would call a geocoding service here
    // For now, we'll throw an error since geocoding isn't implemented yet
    throw new Error('Geocoding service not implemented yet');
    
    // A real implementation would look something like this:
    /*
    const geocodingResponse = await geocodingService.geocode({
      address: locationData.address,
      city: locationData.city,
      state: locationData.state,
      zip: locationData.zip
    });
    
    return {
      ...locationData,
      latitude: geocodingResponse.latitude,
      longitude: geocodingResponse.longitude
    };
    */
  }
}