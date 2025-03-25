/**
 * Relay Plan Model
 * 
 * This file defines the data models and interfaces for relay plans, which enable multiple drivers 
 * to handle different segments of a single load's journey. Relay plans are a core component of 
 * the Dynamic Relay Hauls & Load Swaps feature, supporting the creation of optimized multi-driver 
 * routes with coordinated handoffs at Smart Hubs.
 */

import { SmartHub, SmartHubAmenity } from '../../../common/interfaces/smartHub.interface';
import { Load, LoadAssignmentType } from '../../../common/interfaces/load.interface';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { Document, Schema, model } from 'mongoose'; // v6.0.0

/**
 * Enumeration of possible statuses for a relay plan
 */
export enum RelayPlanStatus {
  DRAFT = 'DRAFT',             // Initial creation, not yet finalized
  PROPOSED = 'PROPOSED',       // Proposed to drivers but not yet accepted
  ACCEPTED = 'ACCEPTED',       // All drivers have accepted their segments
  IN_PROGRESS = 'IN_PROGRESS', // At least one segment is active
  COMPLETED = 'COMPLETED',     // All segments have been completed
  CANCELLED = 'CANCELLED'      // Plan was cancelled before completion
}

/**
 * Enumeration of possible statuses for a handoff between drivers
 */
export enum HandoffStatus {
  SCHEDULED = 'SCHEDULED',     // Planned but not yet started
  IN_PROGRESS = 'IN_PROGRESS', // Handoff is currently taking place
  COMPLETED = 'COMPLETED',     // Handoff has been successfully completed
  DELAYED = 'DELAYED',         // Handoff is delayed beyond scheduled time
  FAILED = 'FAILED'            // Handoff could not be completed
}

/**
 * Enumeration of possible statuses for a relay segment
 */
export enum SegmentStatus {
  PLANNED = 'PLANNED',         // Segment is planned but not assigned
  ASSIGNED = 'ASSIGNED',       // Segment is assigned to a driver
  IN_PROGRESS = 'IN_PROGRESS', // Driver is actively working on this segment
  COMPLETED = 'COMPLETED',     // Segment has been completed
  CANCELLED = 'CANCELLED'      // Segment was cancelled
}

/**
 * Interface for geographic locations with coordinates and name
 */
export interface Location {
  latitude: number;
  longitude: number;
  name: string;
}

/**
 * Interface for handoff locations where drivers exchange loads
 */
export interface HandoffLocation {
  handoff_id: string;           // Unique identifier for this handoff
  hub_id: string;               // Reference to the Smart Hub
  name: string;                 // Name of the handoff location
  location: {                   // Geographic coordinates
    latitude: number;
    longitude: number;
  };
  scheduled_time: Date;         // When the handoff is scheduled to occur
  actual_time: Date;            // When the handoff actually occurred
  status: HandoffStatus;        // Current status of the handoff
  outgoing_driver_id: string;   // Driver passing the load
  incoming_driver_id: string;   // Driver receiving the load
  notes: string;                // Any special instructions or notes
}

/**
 * Interface for relay segments with operational details
 */
export interface RelaySegmentDetail {
  segment_id: string;           // Unique identifier for this segment
  driver_id: string;            // Driver assigned to this segment
  assignment_id: string;        // Reference to the load assignment
  start_location: Location;     // Starting point of this segment
  end_location: Location;       // Ending point of this segment
  estimated_distance: number;   // Distance in miles
  estimated_duration: number;   // Duration in minutes
  planned_start_time: Date;     // When segment is scheduled to start
  planned_end_time: Date;       // When segment is scheduled to end
  actual_start_time: Date;      // When segment actually started
  actual_end_time: Date;        // When segment actually ended
  status: SegmentStatus;        // Current status of the segment
  route_polyline: string;       // Encoded polyline of the route
}

/**
 * Interface for efficiency metrics of a relay plan compared to direct haul
 */
export interface RelayEfficiencyMetrics {
  empty_miles_reduction: number;     // Reduction in empty miles (percentage)
  driver_home_time_improvement: number; // Improvement in driver home time (hours)
  cost_savings: number;             // Cost savings in USD
  co2_reduction: number;            // CO2 emissions reduction (kg)
  total_distance: number;           // Total distance for relay plan (miles)
  direct_haul_distance: number;     // Distance if done as direct haul (miles)
  efficiency_score: number;         // Overall efficiency score (0-100)
}

/**
 * Core interface for relay plan entities
 */
export interface RelayPlan {
  plan_id: string;                  // Unique identifier for this plan
  load_id: string;                  // Reference to the load
  status: RelayPlanStatus;          // Current status of the plan
  segments: RelaySegmentDetail[];   // Segments that make up the relay plan
  handoff_locations: HandoffLocation[]; // Locations where drivers exchange the load
  efficiency_metrics: RelayEfficiencyMetrics; // Calculated efficiency metrics
  created_at: Date;                 // When the plan was created
  updated_at: Date;                 // When the plan was last updated
  created_by: string;               // User ID of creator
  notes: string;                    // Any additional notes
}

/**
 * Parameters required for creating a new relay plan
 */
export interface RelayPlanCreationParams {
  load_id: string;                  // Reference to the load
  segments: Omit<RelaySegmentDetail, 'segment_id' | 'actual_start_time' | 'actual_end_time' | 'status'>[]; // Segment details without runtime fields
  handoff_locations: Omit<HandoffLocation, 'handoff_id' | 'actual_time' | 'status'>[]; // Handoff locations without runtime fields
  created_by: string;               // User ID of creator
  notes: string;                    // Any additional notes
}

/**
 * Parameters for updating an existing relay plan
 */
export interface RelayPlanUpdateParams {
  status?: RelayPlanStatus;         // Updated status
  segments?: Partial<RelaySegmentDetail>[]; // Partial segment updates
  handoff_locations?: Partial<HandoffLocation>[]; // Partial handoff location updates
  notes?: string;                   // Updated notes
}

/**
 * Interface that extends RelayPlan with Mongoose Document properties
 */
export interface RelayPlanDocument extends RelayPlan, Document {}

/**
 * Generates a unique ID for a new relay plan
 * @returns A unique relay plan ID with 'rp-' prefix
 */
export function createRelayPlanId(): string {
  return `rp-${uuidv4()}`;
}

/**
 * Generates a unique ID for a relay segment
 * @returns A unique segment ID with 'rs-' prefix
 */
export function createSegmentId(): string {
  return `rs-${uuidv4()}`;
}

/**
 * Mongoose schema definition for the relay plan model
 */
export const relayPlanSchema = new Schema<RelayPlanDocument>({
  plan_id: {
    type: String,
    required: true,
    unique: true,
    default: createRelayPlanId
  },
  load_id: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(RelayPlanStatus),
    default: RelayPlanStatus.DRAFT,
    required: true
  },
  segments: [{
    segment_id: {
      type: String,
      required: true,
      default: createSegmentId
    },
    driver_id: {
      type: String,
      required: true
    },
    assignment_id: {
      type: String,
      required: false
    },
    start_location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    end_location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    estimated_distance: {
      type: Number,
      required: true
    },
    estimated_duration: {
      type: Number,
      required: true
    },
    planned_start_time: {
      type: Date,
      required: true
    },
    planned_end_time: {
      type: Date,
      required: true
    },
    actual_start_time: {
      type: Date,
      required: false
    },
    actual_end_time: {
      type: Date,
      required: false
    },
    status: {
      type: String,
      enum: Object.values(SegmentStatus),
      default: SegmentStatus.PLANNED,
      required: true
    },
    route_polyline: {
      type: String,
      required: false
    }
  }],
  handoff_locations: [{
    handoff_id: {
      type: String,
      required: true,
      default: uuidv4
    },
    hub_id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    scheduled_time: {
      type: Date,
      required: true
    },
    actual_time: {
      type: Date,
      required: false
    },
    status: {
      type: String,
      enum: Object.values(HandoffStatus),
      default: HandoffStatus.SCHEDULED,
      required: true
    },
    outgoing_driver_id: {
      type: String,
      required: true
    },
    incoming_driver_id: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      required: false
    }
  }],
  efficiency_metrics: {
    empty_miles_reduction: {
      type: Number,
      required: true
    },
    driver_home_time_improvement: {
      type: Number,
      required: true
    },
    cost_savings: {
      type: Number,
      required: true
    },
    co2_reduction: {
      type: Number,
      required: true
    },
    total_distance: {
      type: Number,
      required: true
    },
    direct_haul_distance: {
      type: Number,
      required: true
    },
    efficiency_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  created_by: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  // Create indexes for common query patterns
  indexes: [
    { load_id: 1 },
    { status: 1 },
    { 'segments.driver_id': 1 },
    { 'handoff_locations.hub_id': 1 },
    { created_at: 1 }
  ]
});

/**
 * Mongoose model for relay plan database operations
 */
export const RelayPlanModel = model<RelayPlanDocument>('RelayPlan', relayPlanSchema);