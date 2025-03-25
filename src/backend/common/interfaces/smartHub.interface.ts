/**
 * Smart Hub Interfaces and Types
 * 
 * This file defines the core interfaces and types for Smart Hubs, which are strategically 
 * identified locations where drivers can exchange loads to optimize network efficiency.
 * Smart Hubs are a critical component of the platform's Network-Wide Efficiency Coordination
 * feature, enabling relay-based haul strategies and reducing empty miles.
 */

/**
 * Enumeration of possible Smart Hub facility types
 */
export enum SmartHubType {
  TRUCK_STOP = 'TRUCK_STOP',
  DISTRIBUTION_CENTER = 'DISTRIBUTION_CENTER',
  REST_AREA = 'REST_AREA',
  WAREHOUSE = 'WAREHOUSE',
  TERMINAL = 'TERMINAL',
  YARD = 'YARD',
  OTHER = 'OTHER'
}

/**
 * Enumeration of possible amenities available at a Smart Hub
 */
export enum SmartHubAmenity {
  PARKING = 'PARKING',
  RESTROOMS = 'RESTROOMS',
  FOOD = 'FOOD',
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
  SHOWER = 'SHOWER',
  LODGING = 'LODGING',
  SECURITY = 'SECURITY',
  LOADING_DOCK = 'LOADING_DOCK',
  SCALE = 'SCALE'
}

/**
 * Core interface defining a Smart Hub location for load exchanges
 */
export interface SmartHub {
  /**
   * Unique identifier for the Smart Hub
   */
  hub_id: string;
  
  /**
   * Name of the Smart Hub facility
   */
  name: string;
  
  /**
   * Type of facility serving as a Smart Hub
   */
  hub_type: SmartHubType;
  
  /**
   * Latitude coordinate of the Smart Hub location
   */
  latitude: number;
  
  /**
   * Longitude coordinate of the Smart Hub location
   */
  longitude: number;
  
  /**
   * Street address of the Smart Hub
   */
  address: string;
  
  /**
   * City of the Smart Hub location
   */
  city: string;
  
  /**
   * State/province of the Smart Hub location
   */
  state: string;
  
  /**
   * Postal/ZIP code of the Smart Hub location
   */
  zip: string;
  
  /**
   * Available amenities at the Smart Hub
   */
  amenities: SmartHubAmenity[];
  
  /**
   * Maximum number of trucks that can be accommodated simultaneously
   */
  capacity: number;
  
  /**
   * Operating hours of the Smart Hub
   * open/close: Time in 24-hour format (e.g., "08:00", "22:00")
   * days: Array of days of the week (0-6, where 0 is Sunday)
   */
  operating_hours: {
    open: string;
    close: string;
    days: number[];
  };
  
  /**
   * Score representing the hub's efficiency for load exchanges (0-100)
   */
  efficiency_score: number;
  
  /**
   * Whether the Smart Hub is currently active in the system
   */
  active: boolean;
  
  /**
   * When the Smart Hub was created in the system
   */
  created_at: Date;
  
  /**
   * When the Smart Hub was last updated
   */
  updated_at: Date;
}

/**
 * Parameters required for creating a new Smart Hub
 */
export interface SmartHubCreationParams {
  /**
   * Name of the Smart Hub facility
   */
  name: string;
  
  /**
   * Type of facility serving as a Smart Hub
   */
  hub_type: SmartHubType;
  
  /**
   * Latitude coordinate of the Smart Hub location
   */
  latitude: number;
  
  /**
   * Longitude coordinate of the Smart Hub location
   */
  longitude: number;
  
  /**
   * Street address of the Smart Hub
   */
  address: string;
  
  /**
   * City of the Smart Hub location
   */
  city: string;
  
  /**
   * State/province of the Smart Hub location
   */
  state: string;
  
  /**
   * Postal/ZIP code of the Smart Hub location
   */
  zip: string;
  
  /**
   * Available amenities at the Smart Hub
   */
  amenities: SmartHubAmenity[];
  
  /**
   * Maximum number of trucks that can be accommodated simultaneously
   */
  capacity: number;
  
  /**
   * Operating hours of the Smart Hub
   * open/close: Time in 24-hour format (e.g., "08:00", "22:00")
   * days: Array of days of the week (0-6, where 0 is Sunday)
   */
  operating_hours: {
    open: string;
    close: string;
    days: number[];
  };
}

/**
 * Parameters for updating an existing Smart Hub
 * All fields are optional to allow partial updates
 */
export interface SmartHubUpdateParams {
  /**
   * Name of the Smart Hub facility
   */
  name?: string;
  
  /**
   * Type of facility serving as a Smart Hub
   */
  hub_type?: SmartHubType;
  
  /**
   * Latitude coordinate of the Smart Hub location
   */
  latitude?: number;
  
  /**
   * Longitude coordinate of the Smart Hub location
   */
  longitude?: number;
  
  /**
   * Street address of the Smart Hub
   */
  address?: string;
  
  /**
   * City of the Smart Hub location
   */
  city?: string;
  
  /**
   * State/province of the Smart Hub location
   */
  state?: string;
  
  /**
   * Postal/ZIP code of the Smart Hub location
   */
  zip?: string;
  
  /**
   * Available amenities at the Smart Hub
   */
  amenities?: SmartHubAmenity[];
  
  /**
   * Maximum number of trucks that can be accommodated simultaneously
   */
  capacity?: number;
  
  /**
   * Operating hours of the Smart Hub
   * open/close: Time in 24-hour format (e.g., "08:00", "22:00")
   * days: Array of days of the week (0-6, where 0 is Sunday)
   */
  operating_hours?: {
    open: string;
    close: string;
    days: number[];
  };
  
  /**
   * Whether the Smart Hub is currently active in the system
   */
  active?: boolean;
}

/**
 * Parameters for searching and filtering Smart Hubs
 */
export interface SmartHubSearchParams {
  /**
   * Center latitude for proximity search
   */
  latitude?: number;
  
  /**
   * Center longitude for proximity search
   */
  longitude?: number;
  
  /**
   * Search radius in miles from the specified lat/long
   */
  radius?: number;
  
  /**
   * Filter by facility types
   */
  hub_types?: SmartHubType[];
  
  /**
   * Filter by required amenities (all specified amenities must be present)
   */
  amenities?: SmartHubAmenity[];
  
  /**
   * Filter by minimum capacity
   */
  min_capacity?: number;
  
  /**
   * Filter by minimum efficiency score
   */
  min_efficiency_score?: number;
  
  /**
   * Filter to only include active hubs
   */
  active_only?: boolean;
  
  /**
   * Page number for pagination
   */
  page?: number;
  
  /**
   * Number of results per page
   */
  limit?: number;
  
  /**
   * Field to sort results by
   */
  sort_by?: string;
  
  /**
   * Sort order ('asc' or 'desc')
   */
  sort_order?: string;
}

/**
 * Analytics data for Smart Hub performance and utilization
 */
export interface SmartHubAnalytics {
  /**
   * Smart Hub identifier
   */
  hub_id: string;
  
  /**
   * Total number of load exchanges at this hub
   */
  exchange_count: number;
  
  /**
   * Percentage of successful exchanges (without delays or issues)
   */
  success_rate: number;
  
  /**
   * Average wait time in minutes for load exchanges
   */
  average_wait_time: number;
  
  /**
   * Utilization breakdown by hour of day
   */
  utilization_by_hour: { hour: number; count: number }[];
  
  /**
   * Utilization breakdown by day of week
   */
  utilization_by_day: { day: number; count: number }[];
  
  /**
   * Estimated empty miles saved through exchanges at this hub
   */
  empty_miles_saved: number;
  
  /**
   * Time period for the analytics data
   */
  time_period: {
    start: Date;
    end: Date;
  };
}

/**
 * Recommendation for a new Smart Hub location based on network analysis
 */
export interface SmartHubRecommendation {
  /**
   * Recommended geographic location for the new Smart Hub
   */
  location: {
    latitude: number;
    longitude: number;
  };
  
  /**
   * Optimization score for this recommendation (0-100)
   */
  score: number;
  
  /**
   * Estimated impact of establishing a Smart Hub at this location
   */
  estimated_impact: {
    empty_miles_reduction: number;
    exchanges_per_day: number;
  };
  
  /**
   * Existing facilities near the recommended location
   */
  nearby_facilities: {
    name: string;
    distance: number; // In miles
    type: string;
  }[];
  
  /**
   * Recommended capacity for the new Smart Hub
   */
  recommended_capacity: number;
  
  /**
   * Recommended amenities for the new Smart Hub
   */
  recommended_amenities: SmartHubAmenity[];
}

/**
 * Segment of a route for relay planning and Smart Hub identification
 */
export interface RouteSegment {
  /**
   * Starting geographic location of the segment
   */
  start_location: {
    latitude: number;
    longitude: number;
  };
  
  /**
   * Ending geographic location of the segment
   */
  end_location: {
    latitude: number;
    longitude: number;
  };
  
  /**
   * Distance of the segment in miles
   */
  distance: number;
  
  /**
   * Estimated duration to travel the segment in minutes
   */
  estimated_duration: number;
}

/**
 * Plan for a relay-based haul using Smart Hubs as exchange points
 */
export interface RelayPlan {
  /**
   * Identifier of the load being transported
   */
  load_id: string;
  
  /**
   * Route segments that make up the complete journey
   */
  segments: RouteSegment[];
  
  /**
   * Smart Hubs used as exchange points between segments
   */
  exchange_points: SmartHub[];
  
  /**
   * Driver assignments for each segment
   */
  driver_assignments: {
    driver_id: string;
    segment_index: number;
  }[];
  
  /**
   * Estimated savings from using this relay plan
   */
  estimated_savings: {
    empty_miles: number;
    driver_hours: number;
    cost: number;
  };
}