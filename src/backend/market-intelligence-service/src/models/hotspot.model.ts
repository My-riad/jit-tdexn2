import { Model } from 'objection';
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { db } from '../config';
import { Position } from '../../../common/interfaces/position.interface';
import { EquipmentType } from '../../../common/interfaces/load.interface';

/**
 * Enumeration of hotspot types indicating the nature of the market condition
 */
export enum HotspotType {
  DEMAND_SURGE = 'DEMAND_SURGE',
  SUPPLY_SHORTAGE = 'SUPPLY_SHORTAGE',
  RATE_OPPORTUNITY = 'RATE_OPPORTUNITY',
  REPOSITIONING_NEED = 'REPOSITIONING_NEED',
  WEATHER_IMPACT = 'WEATHER_IMPACT'
}

/**
 * Enumeration of severity levels for hotspots
 */
export enum HotspotSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Model representing a geographic area with significant market imbalances or opportunities
 * in the freight transportation industry
 */
export class Hotspot extends Model {
  // Properties
  hotspot_id!: string;
  name!: string;
  type!: HotspotType;
  severity!: HotspotSeverity;
  center!: Position;
  radius!: number;
  confidence_score!: number;
  bonus_amount!: number;
  region!: string;
  equipment_type!: EquipmentType;
  factors!: object;
  metadata!: object;
  detected_at!: Date;
  valid_from!: Date;
  valid_until!: Date;
  active!: boolean;

  /**
   * Creates a new Hotspot instance
   */
  constructor() {
    super();
    this.factors = {};
    this.metadata = {};
    this.active = true;
  }

  /**
   * Defines the database table name for this model
   */
  static get tableName(): string {
    return 'hotspots';
  }

  /**
   * Defines the JSON schema for validation of Hotspot objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['type', 'severity', 'center', 'radius'],
      properties: {
        hotspot_id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        type: { type: 'string', enum: Object.values(HotspotType) },
        severity: { type: 'string', enum: Object.values(HotspotSeverity) },
        center: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 }
          }
        },
        radius: { type: 'number', minimum: 0 },
        confidence_score: { type: 'number', minimum: 0, maximum: 1 },
        bonus_amount: { type: 'number', minimum: 0 },
        region: { type: 'string' },
        equipment_type: { type: 'string', enum: Object.values(EquipmentType) },
        factors: { type: 'object' },
        metadata: { type: 'object' },
        detected_at: { type: 'string', format: 'date-time' },
        valid_from: { type: 'string', format: 'date-time' },
        valid_until: { type: 'string', format: 'date-time' },
        active: { type: 'boolean' }
      }
    };
  }

  /**
   * Hook that runs before inserting a new hotspot record
   */
  static async beforeInsert({ items }: { items: Hotspot[] }) {
    for (const hotspot of items) {
      // Generate UUID if not provided
      if (!hotspot.hotspot_id) {
        hotspot.hotspot_id = uuidv4();
      }

      // Set detected_at to current time if not provided
      if (!hotspot.detected_at) {
        hotspot.detected_at = new Date();
      }

      // Set valid_from to current time if not provided
      if (!hotspot.valid_from) {
        hotspot.valid_from = new Date();
      }

      // Set valid_until based on valid_from if not provided
      if (!hotspot.valid_until) {
        // Default validity is 48 hours (2 days)
        const validUntil = new Date(hotspot.valid_from);
        validUntil.setHours(validUntil.getHours() + 48);
        hotspot.valid_until = validUntil;
      }

      // Set active to true if not provided
      if (hotspot.active === undefined) {
        hotspot.active = true;
      }

      // Set default confidence score if not provided
      if (hotspot.confidence_score === undefined) {
        hotspot.confidence_score = 0.8; // Default confidence score
      }

      // Initialize empty objects for factors and metadata if not provided
      if (!hotspot.factors) {
        hotspot.factors = {};
      }

      if (!hotspot.metadata) {
        hotspot.metadata = {};
      }
    }
  }

  /**
   * Checks if the hotspot is currently active and valid
   */
  isActive(): boolean {
    const now = new Date();
    return this.active && 
           now >= this.valid_from && 
           now <= this.valid_until;
  }

  /**
   * Checks if a geographic point is within this hotspot
   * @param latitude - The latitude of the point to check
   * @param longitude - The longitude of the point to check
   * @returns True if the point is within the hotspot radius
   */
  isPointInHotspot(latitude: number, longitude: number): boolean {
    // Calculate distance in kilometers using the Haversine formula
    const earthRadiusKm = 6371; // Earth's radius in kilometers
    
    const dLat = this.degreesToRadians(latitude - this.center.latitude);
    const dLon = this.degreesToRadians(longitude - this.center.longitude);
    
    const lat1 = this.degreesToRadians(this.center.latitude);
    const lat2 = this.degreesToRadians(latitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = earthRadiusKm * c;
    
    // Convert radius from miles to kilometers (1 mile = 1.60934 km)
    const radiusKm = this.radius * 1.60934;
    
    return distanceKm <= radiusKm;
  }

  /**
   * Helper method to convert degrees to radians
   * @param degrees - The angle in degrees
   * @returns The angle in radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Finds a hotspot by its ID
   * @param hotspotId - The ID of the hotspot to find
   * @returns Promise resolving to the hotspot or undefined if not found
   */
  static async findById(hotspotId: string): Promise<Hotspot | undefined> {
    return Hotspot.query().findById(hotspotId);
  }

  /**
   * Finds all currently active hotspots
   * @returns Promise resolving to an array of active hotspots
   */
  static async findActive(): Promise<Hotspot[]> {
    const now = new Date();
    return Hotspot.query()
      .where('active', true)
      .where('valid_from', '<=', now)
      .where('valid_until', '>=', now);
  }

  /**
   * Finds hotspots of a specific type
   * @param type - The hotspot type to search for
   * @param activeOnly - Whether to return only active hotspots
   * @returns Promise resolving to an array of hotspots of the specified type
   */
  static async findByType(type: HotspotType, activeOnly: boolean = true): Promise<Hotspot[]> {
    let query = Hotspot.query().where('type', type);
    
    if (activeOnly) {
      const now = new Date();
      query = query
        .where('active', true)
        .where('valid_from', '<=', now)
        .where('valid_until', '>=', now);
    }
    
    return query;
  }

  /**
   * Finds hotspots of a specific severity level
   * @param severity - The severity level to search for
   * @param activeOnly - Whether to return only active hotspots
   * @returns Promise resolving to an array of hotspots of the specified severity
   */
  static async findBySeverity(severity: HotspotSeverity, activeOnly: boolean = true): Promise<Hotspot[]> {
    let query = Hotspot.query().where('severity', severity);
    
    if (activeOnly) {
      const now = new Date();
      query = query
        .where('active', true)
        .where('valid_from', '<=', now)
        .where('valid_until', '>=', now);
    }
    
    return query;
  }

  /**
   * Finds hotspots in a specific region
   * @param region - The region to search in
   * @param activeOnly - Whether to return only active hotspots
   * @returns Promise resolving to an array of hotspots in the specified region
   */
  static async findByRegion(region: string, activeOnly: boolean = true): Promise<Hotspot[]> {
    let query = Hotspot.query().where('region', region);
    
    if (activeOnly) {
      const now = new Date();
      query = query
        .where('active', true)
        .where('valid_from', '<=', now)
        .where('valid_until', '>=', now);
    }
    
    return query;
  }

  /**
   * Finds hotspots for a specific equipment type
   * @param equipmentType - The equipment type to search for
   * @param activeOnly - Whether to return only active hotspots
   * @returns Promise resolving to an array of hotspots for the specified equipment type
   */
  static async findByEquipmentType(equipmentType: EquipmentType, activeOnly: boolean = true): Promise<Hotspot[]> {
    let query = Hotspot.query().where('equipment_type', equipmentType);
    
    if (activeOnly) {
      const now = new Date();
      query = query
        .where('active', true)
        .where('valid_from', '<=', now)
        .where('valid_until', '>=', now);
    }
    
    return query;
  }

  /**
   * Finds hotspots near a specific location
   * @param latitude - The latitude of the location
   * @param longitude - The longitude of the location
   * @param radiusKm - The search radius in kilometers (default: 80 km / 50 miles)
   * @param activeOnly - Whether to return only active hotspots
   * @returns Promise resolving to an array of hotspots near the specified location
   */
  static async findNearLocation(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 80, 
    activeOnly: boolean = true
  ): Promise<Hotspot[]> {
    // Validate inputs
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
    
    if (radiusKm <= 0) {
      throw new Error('Radius must be greater than 0');
    }
    
    // Use PostGIS for the geospatial query
    let query = Hotspot.query()
      .whereRaw(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(center->>'longitude', center->>'latitude')::geometry, 4326),
          ST_SetSRID(ST_MakePoint(?, ?)::geometry, 4326),
          ?
        )`,
        [longitude, latitude, radiusKm * 1000] // Convert km to meters
      );
    
    if (activeOnly) {
      const now = new Date();
      query = query
        .where('active', true)
        .where('valid_from', '<=', now)
        .where('valid_until', '>=', now);
    }
    
    return query;
  }

  /**
   * Deactivates hotspots that have passed their valid_until date
   * @returns Promise resolving to the number of hotspots deactivated
   */
  static async deactivateExpired(): Promise<number> {
    const now = new Date();
    const result = await Hotspot.query()
      .patch({ active: false })
      .where('active', true)
      .where('valid_until', '<', now);
    
    return result;
  }
}

/**
 * Interface defining the parameters required for creating a new hotspot
 */
export interface HotspotCreationParams {
  name: string;
  type: HotspotType;
  severity: HotspotSeverity;
  center: Position;
  radius: number;
  confidence_score?: number;
  bonus_amount?: number;
  region?: string;
  equipment_type?: EquipmentType;
  factors?: object;
  metadata?: object;
  valid_from?: Date;
  valid_until?: Date;
}

/**
 * Interface defining the parameters that can be updated for an existing hotspot
 */
export interface HotspotUpdateParams {
  name?: string;
  severity?: HotspotSeverity;
  radius?: number;
  confidence_score?: number;
  bonus_amount?: number;
  factors?: object;
  metadata?: object;
  valid_until?: Date;
  active?: boolean;
}

/**
 * Interface defining the parameters for querying hotspots
 */
export interface HotspotQueryParams {
  type?: HotspotType;
  severity?: HotspotSeverity;
  region?: string;
  equipment_type?: EquipmentType;
  latitude?: number;
  longitude?: number;
  radius?: number;
  active_only?: boolean;
  min_confidence?: number;
  min_bonus?: number;
}