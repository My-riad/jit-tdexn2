/**
 * Recommendation Model
 * 
 * Implements the database model for load recommendations in the AI-driven Freight Optimization Platform.
 * This file defines the Mongoose schema and model for storing and retrieving personalized load
 * recommendations for drivers, including efficiency scores, match details, and load information.
 * The recommendation model is a critical component of the AI-driven load matching system that
 * helps drivers find optimal loads.
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { 
  MatchRecommendation,
  MatchType,
  MatchScoreFactors
} from '../interfaces/match.interface';
import { MatchModel } from './match.model';

/**
 * Schema for load details included in recommendations
 */
const loadDetailsSchema = new mongoose.Schema({
  origin: {
    type: String,
    required: true,
    description: 'Origin location of the load'
  },
  destination: {
    type: String,
    required: true,
    description: 'Destination location of the load'
  },
  pickup_time: {
    type: Date,
    required: true,
    description: 'Earliest pickup time for the load'
  },
  delivery_time: {
    type: Date,
    required: true,
    description: 'Earliest delivery time for the load'
  },
  equipment_type: {
    type: String,
    required: true,
    description: 'Type of equipment required for the load'
  },
  weight: {
    type: Number,
    required: true,
    description: 'Weight of the load in pounds'
  },
  distance: {
    type: Number,
    required: true,
    description: 'Distance of the load in miles'
  },
  shipper_name: {
    type: String,
    required: false,
    description: 'Name of the shipper'
  },
  commodity: {
    type: String,
    required: false,
    description: 'Type of commodity being transported'
  }
});

/**
 * Schema for score factors that contribute to the efficiency score
 */
const scoreFactorsSchema = new mongoose.Schema({
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
 * Main schema for load recommendations
 */
const recommendationSchema = new mongoose.Schema({
  recommendation_id: {
    type: String,
    required: true,
    unique: true,
    description: 'Unique identifier for the recommendation'
  },
  match_id: {
    type: String,
    required: true,
    index: true,
    description: 'Reference to the match being recommended'
  },
  load_id: {
    type: String,
    required: true,
    index: true,
    description: 'Reference to the load being recommended'
  },
  driver_id: {
    type: String,
    required: true,
    index: true,
    description: 'Reference to the driver receiving the recommendation'
  },
  match_type: {
    type: String,
    enum: Object.values(MatchType),
    default: MatchType.DIRECT,
    required: true,
    description: 'Type of match (direct, relay, smart hub exchange)'
  },
  efficiency_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    description: 'Overall efficiency score for the recommendation (0-100)'
  },
  score_factors: {
    type: scoreFactorsSchema,
    required: true,
    description: 'Breakdown of factors contributing to the efficiency score'
  },
  proposed_rate: {
    type: Number,
    required: true,
    description: 'Proposed payment rate for the load'
  },
  load_details: {
    type: loadDetailsSchema,
    required: true,
    description: 'Details about the load being recommended'
  },
  empty_miles: {
    type: Number,
    required: true,
    description: 'Empty miles required to reach the load pickup'
  },
  loaded_miles: {
    type: Number,
    required: true,
    description: 'Miles with load from pickup to delivery'
  },
  deadhead_percentage: {
    type: Number,
    required: true,
    description: 'Percentage of empty miles relative to total trip'
  },
  status: {
    type: String,
    enum: ['active', 'viewed', 'accepted', 'declined', 'expired'],
    default: 'active',
    required: true,
    index: true,
    description: 'Current status of the recommendation'
  },
  expires_at: {
    type: Date,
    required: true,
    index: true,
    description: 'Timestamp when the recommendation expires'
  },
  viewed_at: {
    type: Date,
    required: false,
    description: 'Timestamp when the recommendation was viewed by the driver'
  },
  relay_id: {
    type: String,
    required: false,
    index: true,
    description: 'Reference to parent relay if this is part of a relay recommendation'
  },
  smart_hub_id: {
    type: String,
    required: false,
    description: 'Reference to Smart Hub if this is a hub-based recommendation'
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
    description: 'Timestamp when the recommendation was created'
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true,
    description: 'Timestamp when the recommendation was last updated'
  }
});

// Add additional indexes for common query patterns
recommendationSchema.index({ driver_id: 1, status: 1 });
recommendationSchema.index({ load_id: 1, status: 1 });
recommendationSchema.index({ efficiency_score: -1 });
recommendationSchema.index({ created_at: -1 });
recommendationSchema.index({ expires_at: 1, status: 1 });

// Pre-save hook to ensure recommendation_id is set and timestamps are updated
recommendationSchema.pre('save', function(next) {
  if (!this.recommendation_id) {
    this.recommendation_id = uuidv4();
  }
  this.updated_at = new Date();
  
  // Set default expiration if not provided (24 hours from creation)
  if (!this.expires_at) {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    this.expires_at = expirationDate;
  }
  
  next();
});

// Post-findOneAndUpdate hook to handle side effects after status changes
recommendationSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  
  // Perform side effects based on status changes
  if (doc.status === 'accepted') {
    // Update the corresponding match when a recommendation is accepted
    // This would be implemented in a real system
  } else if (doc.status === 'declined') {
    // Update the corresponding match when a recommendation is declined
    // This would be implemented in a real system
  } else if (doc.status === 'expired') {
    // Clean up any pending operations for expired recommendations
    // This would be implemented in a real system
  }
});

/**
 * Static method to find active recommendations for a driver
 */
recommendationSchema.statics.findByDriverId = async function(driverId: string, options: any = {}) {
  const query = {
    driver_id: driverId,
    status: { $in: ['active', 'viewed'] },
    expires_at: { $gt: new Date() }
  };
  
  // Apply any additional query options
  const limit = options.limit || 10;
  const skip = options.skip || 0;
  const sort = options.sort || { efficiency_score: -1 };
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/**
 * Static method to find all active recommendations in the system
 */
recommendationSchema.statics.findActiveRecommendations = async function() {
  return this.find({
    status: { $in: ['active', 'viewed'] },
    expires_at: { $gt: new Date() }
  });
};

/**
 * Static method to mark a recommendation as viewed by the driver
 */
recommendationSchema.statics.markAsViewed = async function(recommendationId: string) {
  return this.findOneAndUpdate(
    { recommendation_id: recommendationId },
    { 
      status: 'viewed',
      viewed_at: new Date(),
      updated_at: new Date()
    },
    { new: true }
  );
};

/**
 * Static method to mark a recommendation as expired
 */
recommendationSchema.statics.markAsExpired = async function(recommendationId: string) {
  return this.findOneAndUpdate(
    { recommendation_id: recommendationId },
    { 
      status: 'expired',
      updated_at: new Date()
    },
    { new: true }
  );
};

/**
 * Static method to find recommendations that have expired
 */
recommendationSchema.statics.findExpiredRecommendations = async function() {
  return this.find({
    status: { $in: ['active', 'viewed'] },
    expires_at: { $lt: new Date() }
  });
};

/**
 * Static method to create a recommendation from a match
 */
recommendationSchema.statics.createFromMatch = async function(matchId: string, loadDetails: any, expirationMinutes: number = 1440) {
  // Find the match to get match data
  const match = await MatchModel.findOne({ match_id: matchId });
  if (!match) {
    throw new Error(`Match with ID ${matchId} not found`);
  }
  
  // Create expiration time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
  
  // Create and return the recommendation
  return this.create({
    match_id: matchId,
    load_id: match.load_id,
    driver_id: match.driver_id,
    match_type: match.match_type,
    efficiency_score: match.efficiency_score,
    score_factors: match.score_factors,
    proposed_rate: match.proposed_rate,
    load_details: loadDetails,
    empty_miles: match.empty_miles || 0,
    loaded_miles: match.loaded_miles || 0,
    deadhead_percentage: match.deadhead_percentage || 0,
    expires_at: expiresAt
  });
};

// Create and export the model
const RecommendationModel = mongoose.model('Recommendation', recommendationSchema);

export { RecommendationModel };