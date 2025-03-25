/**
 * Models for load-driver matches in the AI-driven Freight Optimization Platform
 * 
 * This file defines the Mongoose schemas and models for both direct matches and 
 * relay-based matches, which are core components of the load matching service.
 * These models store the relationships between drivers and loads, along with
 * efficiency scores, match statuses, and other metadata needed for the
 * optimization system.
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { 
  Match, 
  MatchType, 
  MatchStatus, 
  DeclineReason, 
  MatchScoreFactors, 
  RelayMatch, 
  RelaySegment 
} from '../interfaces/match.interface';
import { LoadStatus } from '../../../common/interfaces/load.interface';

/**
 * Schema for match score factors that contribute to the efficiency score
 */
const matchScoreFactorsSchema = new mongoose.Schema({
  empty_miles_reduction: {
    type: Number,
    required: true,
    description: 'Score component for reduction in empty miles'
  },
  network_contribution: {
    type: Number,
    required: true,
    description: 'Score component for contribution to overall network efficiency'
  },
  driver_preference_alignment: {
    type: Number,
    required: true,
    description: 'Score component for alignment with driver preferences'
  },
  time_efficiency: {
    type: Number,
    required: true,
    description: 'Score component for time-based efficiency'
  },
  smart_hub_utilization: {
    type: Number,
    required: true,
    description: 'Score component for utilization of Smart Hubs'
  },
  additional_factors: {
    type: Object,
    required: false,
    description: 'Additional scoring factors as key-value pairs'
  }
});

/**
 * Schema for load-driver matches
 */
const matchSchema = new mongoose.Schema({
  match_id: {
    type: String,
    required: true,
    unique: true,
    description: 'Unique identifier for the match'
  },
  load_id: {
    type: String,
    required: true,
    index: true,
    description: 'Reference to the load being matched'
  },
  driver_id: {
    type: String,
    required: true,
    index: true,
    description: 'Reference to the driver being matched'
  },
  vehicle_id: {
    type: String,
    required: true,
    description: 'Reference to the vehicle being used'
  },
  match_type: {
    type: String,
    enum: Object.values(MatchType),
    default: MatchType.DIRECT,
    required: true,
    description: 'Type of match (direct, relay, smart hub exchange)'
  },
  status: {
    type: String,
    enum: Object.values(MatchStatus),
    default: MatchStatus.PENDING,
    required: true,
    index: true,
    description: 'Current status of the match'
  },
  efficiency_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    description: 'Overall efficiency score for the match (0-100)'
  },
  score_factors: {
    type: matchScoreFactorsSchema,
    required: true,
    description: 'Breakdown of factors contributing to the efficiency score'
  },
  proposed_rate: {
    type: Number,
    required: true,
    description: 'Proposed payment rate for the load'
  },
  accepted_rate: {
    type: Number,
    required: false,
    description: 'Final accepted payment rate if different from proposed'
  },
  reservation_expiry: {
    type: Date,
    required: false,
    index: true,
    description: 'Expiration time for a reserved match'
  },
  decline_reason: {
    type: String,
    enum: Object.values(DeclineReason),
    required: false,
    description: 'Reason for declining the match if declined'
  },
  decline_notes: {
    type: String,
    required: false,
    description: 'Additional notes about why the match was declined'
  },
  empty_miles: {
    type: Number,
    required: false,
    description: 'Empty miles required to reach the load pickup'
  },
  loaded_miles: {
    type: Number,
    required: false,
    description: 'Miles with load from pickup to delivery'
  },
  deadhead_percentage: {
    type: Number,
    required: false,
    description: 'Percentage of empty miles relative to total trip'
  },
  relay_id: {
    type: String,
    required: false,
    index: true,
    description: 'Reference to parent relay match if part of a relay'
  },
  segment_index: {
    type: Number,
    required: false,
    description: 'Position in the relay sequence if part of a relay'
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
    description: 'Timestamp when the match was created'
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true,
    description: 'Timestamp when the match was last updated'
  }
});

// Add additional indexes for common query patterns
matchSchema.index({ driver_id: 1, status: 1 });
matchSchema.index({ load_id: 1, status: 1 });
matchSchema.index({ efficiency_score: -1 });
matchSchema.index({ created_at: -1 });
matchSchema.index({ reservation_expiry: 1, status: 1 });

/**
 * Schema for locations within relay segments
 */
const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    description: 'Latitude coordinate of the location'
  },
  longitude: {
    type: Number,
    required: true,
    description: 'Longitude coordinate of the location'
  },
  name: {
    type: String,
    required: false,
    description: 'Optional name of the location'
  }
});

/**
 * Schema for relay segments
 */
const relaySegmentSchema = new mongoose.Schema({
  segment_id: {
    type: String,
    required: true,
    description: 'Unique identifier for the relay segment'
  },
  segment_order: {
    type: Number,
    required: true,
    description: 'Order of this segment in the relay sequence'
  },
  driver_id: {
    type: String,
    required: true,
    description: 'Driver assigned to this segment'
  },
  vehicle_id: {
    type: String,
    required: true,
    description: 'Vehicle used for this segment'
  },
  start_location: {
    type: locationSchema,
    required: true,
    description: 'Starting location for this segment'
  },
  end_location: {
    type: locationSchema,
    required: true,
    description: 'Ending location for this segment'
  },
  start_hub_id: {
    type: String,
    required: false,
    description: 'Smart Hub ID at the start of the segment, if applicable'
  },
  end_hub_id: {
    type: String,
    required: false,
    description: 'Smart Hub ID at the end of the segment, if applicable'
  },
  estimated_distance: {
    type: Number,
    required: true,
    description: 'Estimated distance for this segment in miles'
  },
  estimated_duration: {
    type: Number,
    required: true,
    description: 'Estimated duration for this segment in minutes'
  },
  scheduled_start_time: {
    type: Date,
    required: true,
    description: 'Scheduled start time for this segment'
  },
  scheduled_end_time: {
    type: Date,
    required: true,
    description: 'Scheduled end time for this segment'
  },
  segment_rate: {
    type: Number,
    required: true,
    description: 'Payment rate for this segment'
  },
  status: {
    type: String,
    enum: Object.values(MatchStatus),
    default: MatchStatus.PENDING,
    required: true,
    description: 'Current status of this segment'
  },
  match_id: {
    type: String,
    required: false,
    description: 'Reference to the individual match for this segment'
  }
});

/**
 * Schema for relay matches
 */
const relayMatchSchema = new mongoose.Schema({
  relay_id: {
    type: String,
    required: true,
    unique: true,
    description: 'Unique identifier for the relay match'
  },
  load_id: {
    type: String,
    required: true,
    index: true,
    description: 'Reference to the load being transported'
  },
  segments: {
    type: [relaySegmentSchema],
    required: true,
    description: 'Array of segments that make up the relay'
  },
  total_efficiency_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    description: 'Overall efficiency score for the entire relay'
  },
  status: {
    type: String,
    enum: Object.values(MatchStatus),
    default: MatchStatus.PENDING,
    required: true,
    index: true,
    description: 'Current status of the relay match'
  },
  total_distance: {
    type: Number,
    required: true,
    description: 'Total distance of the relay in miles'
  },
  total_duration: {
    type: Number,
    required: true,
    description: 'Total estimated duration of the relay in minutes'
  },
  total_rate: {
    type: Number,
    required: true,
    description: 'Total payment rate for the entire relay'
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
    description: 'Timestamp when the relay match was created'
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true,
    description: 'Timestamp when the relay match was last updated'
  }
});

// Add additional indexes for relay matches
relayMatchSchema.index({ load_id: 1 });
relayMatchSchema.index({ status: 1 });
relayMatchSchema.index({ total_efficiency_score: -1 });
relayMatchSchema.index({ created_at: -1 });

// Pre-save hook for matches
matchSchema.pre('save', function(next) {
  if (!this.match_id) {
    this.match_id = uuidv4();
  }
  this.updated_at = new Date();
  next();
});

// Pre-save hook for relay matches
relayMatchSchema.pre('save', function(next) {
  if (!this.relay_id) {
    this.relay_id = uuidv4();
  }
  this.updated_at = new Date();
  
  // Ensure each segment has a segment_id
  if (this.segments && Array.isArray(this.segments)) {
    this.segments.forEach(segment => {
      if (!segment.segment_id) {
        segment.segment_id = uuidv4();
      }
    });
  }
  
  next();
});

// Static methods for Match model
matchSchema.statics.findByDriverAndStatus = async function(driverId: string, statuses: string[]) {
  return this.find({
    driver_id: driverId,
    status: { $in: statuses }
  }).sort({ efficiency_score: -1, created_at: -1 });
};

matchSchema.statics.findByLoadAndStatus = async function(loadId: string, statuses: string[]) {
  return this.find({
    load_id: loadId,
    status: { $in: statuses }
  }).sort({ efficiency_score: -1, created_at: -1 });
};

matchSchema.statics.findExpiredReservations = async function() {
  return this.find({
    status: MatchStatus.RESERVED,
    reservation_expiry: { $lt: new Date() }
  });
};

matchSchema.statics.updateMatchStatus = async function(matchId: string, newStatus: string, additionalUpdates = {}) {
  const match = await this.findOne({ match_id: matchId });
  if (!match) {
    throw new Error(`Match with ID ${matchId} not found`);
  }
  
  match.status = newStatus;
  match.updated_at = new Date();
  
  // Apply any additional updates
  Object.keys(additionalUpdates).forEach(key => {
    match[key] = additionalUpdates[key];
  });
  
  return match.save();
};

// Create and export models
const MatchModel = mongoose.model<Match & mongoose.Document>('Match', matchSchema);
const RelayMatchModel = mongoose.model<RelayMatch & mongoose.Document>('RelayMatch', relayMatchSchema);

export { MatchModel, RelayMatchModel };