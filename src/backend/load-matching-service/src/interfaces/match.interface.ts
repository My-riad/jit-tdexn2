/**
 * Match Interfaces and Types
 * 
 * This file defines the core interfaces, enums, and types for load-driver matches
 * in the AI-driven Freight Optimization Platform. These data structures support
 * the platform's AI-driven load matching algorithms, network optimization, and
 * relay planning capabilities.
 */

import { LoadStatus } from '../../common/interfaces/load.interface';
import { SmartHub } from '../../common/interfaces/smartHub.interface';

/**
 * Enumeration of match types based on delivery strategy
 */
export enum MatchType {
  /**
   * Direct match where a single driver handles the entire load
   */
  DIRECT = 'DIRECT',
  
  /**
   * Relay match where multiple drivers handle different segments of the load
   */
  RELAY = 'RELAY',
  
  /**
   * Match involving an exchange at a Smart Hub location
   */
  SMART_HUB_EXCHANGE = 'SMART_HUB_EXCHANGE'
}

/**
 * Enumeration of possible match statuses throughout the matching lifecycle
 */
export enum MatchStatus {
  /**
   * Initial match status after creation, waiting for processing
   */
  PENDING = 'PENDING',
  
  /**
   * Match has been recommended to a driver but not yet accepted or reserved
   */
  RECOMMENDED = 'RECOMMENDED',
  
  /**
   * Match has been temporarily reserved for a driver
   */
  RESERVED = 'RESERVED',
  
  /**
   * Match has been accepted by the driver and confirmed
   */
  ACCEPTED = 'ACCEPTED',
  
  /**
   * Match was declined by the driver
   */
  DECLINED = 'DECLINED',
  
  /**
   * Match reservation expired without being accepted
   */
  EXPIRED = 'EXPIRED',
  
  /**
   * Match was cancelled by the system or admin
   */
  CANCELLED = 'CANCELLED'
}

/**
 * Enumeration of reasons why a driver might decline a load match
 */
export enum DeclineReason {
  /**
   * The offered rate is too low for the driver
   */
  RATE_TOO_LOW = 'RATE_TOO_LOW',
  
  /**
   * The load schedule conflicts with the driver's existing commitments
   */
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  
  /**
   * The load location doesn't align with driver preferences
   */
  LOCATION_PREFERENCE = 'LOCATION_PREFERENCE',
  
  /**
   * The required equipment doesn't match what the driver has available
   */
  EQUIPMENT_MISMATCH = 'EQUIPMENT_MISMATCH',
  
  /**
   * Issue with the size, weight, or dimensions of the load
   */
  LOAD_SIZE_ISSUE = 'LOAD_SIZE_ISSUE',
  
  /**
   * Known issues with pickup or delivery facilities
   */
  FACILITY_ISSUE = 'FACILITY_ISSUE',
  
  /**
   * Personal reasons not related to the load
   */
  PERSONAL_REASON = 'PERSONAL_REASON',
  
  /**
   * Any other reason not covered by the specific categories
   */
  OTHER = 'OTHER'
}

/**
 * Breakdown of factors contributing to a match's efficiency score
 */
export interface MatchScoreFactors {
  /**
   * Percentage reduction in empty miles compared to industry average
   * Range: 0-100
   */
  empty_miles_reduction: number;
  
  /**
   * Contribution to overall network optimization
   * Range: 0-100
   */
  network_contribution: number;
  
  /**
   * How well the match aligns with driver preferences
   * Range: 0-100
   */
  driver_preference_alignment: number;
  
  /**
   * Efficiency of time utilization (minimize waiting, maximize driving)
   * Range: 0-100
   */
  time_efficiency: number;
  
  /**
   * Contribution to Smart Hub utilization in the network
   * Range: 0-100
   */
  smart_hub_utilization: number;
  
  /**
   * Any additional scoring factors not covered by the standard categories
   */
  additional_factors: Record<string, number>;
}

/**
 * Core interface defining a match between a load and a driver
 */
export interface Match {
  /**
   * Unique identifier for the match
   */
  match_id: string;
  
  /**
   * Identifier of the load being matched
   */
  load_id: string;
  
  /**
   * Identifier of the driver being matched
   */
  driver_id: string;
  
  /**
   * Identifier of the vehicle being used
   */
  vehicle_id: string;
  
  /**
   * Type of match (direct, relay, Smart Hub exchange)
   */
  match_type: MatchType;
  
  /**
   * Current status of the match
   */
  status: MatchStatus;
  
  /**
   * Overall efficiency score for this match (0-100)
   */
  efficiency_score: number;
  
  /**
   * Breakdown of factors contributing to the efficiency score
   */
  score_factors: MatchScoreFactors;
  
  /**
   * Rate proposed by the system for this match
   */
  proposed_rate: number;
  
  /**
   * Rate accepted by the driver (may differ from proposed rate)
   */
  accepted_rate: number;
  
  /**
   * Time when a reservation expires, requiring driver action
   */
  reservation_expiry: Date;
  
  /**
   * Reason for declining the match, if applicable
   */
  decline_reason: DeclineReason;
  
  /**
   * Additional notes provided when declining
   */
  decline_notes: string;
  
  /**
   * When the match was created
   */
  created_at: Date;
  
  /**
   * When the match was last updated
   */
  updated_at: Date;
}

/**
 * Interface for individual segments of a relay match
 */
export interface RelaySegment {
  /**
   * Unique identifier for the segment
   */
  segment_id: string;
  
  /**
   * Identifier of the relay match this segment belongs to
   */
  relay_id: string;
  
  /**
   * Order of this segment in the relay sequence (0-based)
   */
  segment_order: number;
  
  /**
   * Driver assigned to this segment
   */
  driver_id: string;
  
  /**
   * Vehicle used for this segment
   */
  vehicle_id: string;
  
  /**
   * Starting location of this segment
   */
  start_location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  
  /**
   * Ending location of this segment
   */
  end_location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  
  /**
   * Smart Hub ID at the starting point, if applicable
   */
  start_hub_id: string;
  
  /**
   * Smart Hub ID at the ending point, if applicable
   */
  end_hub_id: string;
  
  /**
   * Estimated distance of this segment in miles
   */
  estimated_distance: number;
  
  /**
   * Estimated duration of this segment in minutes
   */
  estimated_duration: number;
  
  /**
   * Scheduled start time for this segment
   */
  scheduled_start_time: Date;
  
  /**
   * Scheduled end time for this segment
   */
  scheduled_end_time: Date;
  
  /**
   * Rate for this individual segment
   */
  segment_rate: number;
  
  /**
   * Current status of this segment
   */
  status: MatchStatus;
}

/**
 * Interface for relay-based matches involving multiple drivers
 */
export interface RelayMatch {
  /**
   * Unique identifier for the relay match
   */
  relay_id: string;
  
  /**
   * Identifier of the load being transported
   */
  load_id: string;
  
  /**
   * Individual segments that make up this relay
   */
  segments: RelaySegment[];
  
  /**
   * Overall efficiency score for the entire relay
   */
  total_efficiency_score: number;
  
  /**
   * Current status of the relay match
   */
  status: MatchStatus;
  
  /**
   * When the relay match was created
   */
  created_at: Date;
  
  /**
   * When the relay match was last updated
   */
  updated_at: Date;
}

/**
 * Event tracking for match status changes and history
 */
export interface MatchEvent {
  /**
   * Unique identifier for the event
   */
  event_id: string;
  
  /**
   * Identifier of the match this event relates to
   */
  match_id: string;
  
  /**
   * Type of event (e.g., "status_changed", "rate_updated")
   */
  event_type: string;
  
  /**
   * Additional event-specific data
   */
  event_data: Record<string, any>;
  
  /**
   * Identifier of the user or system that triggered the event
   */
  actor_id: string;
  
  /**
   * Type of actor (e.g., "driver", "system", "admin")
   */
  actor_type: string;
  
  /**
   * When the event occurred
   */
  created_at: Date;
}

/**
 * Parameters required for creating a new match
 */
export interface MatchCreationParams {
  /**
   * Identifier of the load to match
   */
  load_id: string;
  
  /**
   * Identifier of the driver to match
   */
  driver_id: string;
  
  /**
   * Identifier of the vehicle to use
   */
  vehicle_id: string;
  
  /**
   * Type of match to create
   */
  match_type: MatchType;
  
  /**
   * Calculated efficiency score
   */
  efficiency_score: number;
  
  /**
   * Breakdown of scoring factors
   */
  score_factors: MatchScoreFactors;
  
  /**
   * Proposed rate for the match
   */
  proposed_rate: number;
}

/**
 * Parameters for updating an existing match
 * All fields are optional to allow partial updates
 */
export interface MatchUpdateParams {
  /**
   * New status to set
   */
  status?: MatchStatus;
  
  /**
   * Accepted rate (when driver accepts)
   */
  accepted_rate?: number;
  
  /**
   * Reservation expiration time
   */
  reservation_expiry?: Date;
  
  /**
   * Reason for declining
   */
  decline_reason?: DeclineReason;
  
  /**
   * Additional notes for declination
   */
  decline_notes?: string;
}

/**
 * Parameters for requesting load recommendations for a driver
 */
export interface MatchRecommendationParams {
  /**
   * Driver requesting recommendations
   */
  driver_id: string;
  
  /**
   * Current location of the driver
   */
  current_location: {
    latitude: number;
    longitude: number;
  };
  
  /**
   * Available driving hours remaining
   */
  available_hours: number;
  
  /**
   * Type of equipment available
   */
  equipment_type: string;
  
  /**
   * Maximum deadhead distance the driver is willing to travel
   */
  max_distance: number;
  
  /**
   * Minimum acceptable rate per mile
   */
  min_rate: number;
  
  /**
   * Preferred geographic regions
   */
  preferred_regions: string[];
  
  /**
   * Maximum number of recommendations to return
   */
  limit: number;
}

/**
 * Load recommendation with detailed information for driver decision-making
 */
export interface MatchRecommendation {
  /**
   * Unique identifier for the match
   */
  match_id: string;
  
  /**
   * Identifier of the recommended load
   */
  load_id: string;
  
  /**
   * Identifier of the driver receiving the recommendation
   */
  driver_id: string;
  
  /**
   * Type of match (direct, relay, etc.)
   */
  match_type: MatchType;
  
  /**
   * Overall efficiency score for this match
   */
  efficiency_score: number;
  
  /**
   * Breakdown of scoring factors
   */
  score_factors: MatchScoreFactors;
  
  /**
   * Proposed rate for the load
   */
  proposed_rate: number;
  
  /**
   * Essential details about the load
   */
  load_details: {
    origin: string;
    destination: string;
    pickup_time: Date;
    delivery_time: Date;
    equipment_type: string;
    weight: number;
  };
  
  /**
   * Empty miles to reach the load pickup
   */
  empty_miles: number;
  
  /**
   * Loaded miles for this load
   */
  loaded_miles: number;
  
  /**
   * Percentage of deadhead miles for this trip
   */
  deadhead_percentage: number;
  
  /**
   * When the reservation for this recommendation expires
   */
  reservation_expiry: Date;
}

/**
 * Parameters for reserving a match for a driver
 */
export interface MatchReservationParams {
  /**
   * Identifier of the match to reserve
   */
  match_id: string;
  
  /**
   * Driver requesting the reservation
   */
  driver_id: string;
  
  /**
   * How long to hold the reservation (in minutes)
   */
  expiration_minutes: number;
}

/**
 * Parameters for accepting a match
 */
export interface MatchAcceptParams {
  /**
   * Identifier of the match to accept
   */
  match_id: string;
  
  /**
   * Driver accepting the match
   */
  driver_id: string;
  
  /**
   * Rate accepted by the driver
   */
  accepted_rate: number;
}

/**
 * Parameters for declining a match
 */
export interface MatchDeclineParams {
  /**
   * Identifier of the match to decline
   */
  match_id: string;
  
  /**
   * Driver declining the match
   */
  driver_id: string;
  
  /**
   * Reason for declining
   */
  decline_reason: DeclineReason;
  
  /**
   * Additional notes explaining the declination
   */
  decline_notes: string;
}