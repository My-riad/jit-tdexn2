/**
 * Auction Bid Model
 * 
 * This file defines the data structures and mongoose schema for auction bids in the
 * AI-driven Freight Optimization Platform. Auction bids represent offers from drivers
 * or carriers to take on loads, with AI-driven evaluation based on network-wide
 * efficiency rather than just price.
 */

import { Document, Schema, model } from 'mongoose'; // mongoose v6.0.0
import { Load } from '../../../common/interfaces/load.interface';
import { Driver } from '../../../common/interfaces/driver.interface';

/**
 * Enumeration of possible auction bid statuses
 */
export enum AuctionBidStatus {
  PENDING = 'PENDING',       // Bid is under review
  ACTIVE = 'ACTIVE',         // Bid is active and being considered
  ACCEPTED = 'ACCEPTED',     // Bid has been accepted
  REJECTED = 'REJECTED',     // Bid has been rejected
  WITHDRAWN = 'WITHDRAWN',   // Bid was withdrawn by the bidder
  EXPIRED = 'EXPIRED'        // Bid expired without action
}

/**
 * Main interface for auction bids in the system
 */
export interface AuctionBid {
  bid_id: string;                      // Unique identifier for the bid
  auction_id: string;                  // ID of the auction this bid belongs to
  load_id: string;                     // ID of the load being bid on
  bidder_id: string;                   // ID of the driver or carrier placing the bid
  bidder_type: 'driver' | 'carrier';   // Type of entity placing the bid
  amount: number;                      // Bid amount in USD
  status: AuctionBidStatus;            // Current status of the bid
  efficiency_score: number;            // Calculated efficiency score (0-100)
  network_contribution_score: number;  // How much this bid contributes to network optimization (0-100)
  driver_score: number;                // Driver's historical efficiency score (0-100)
  weighted_score: number;              // Final weighted score combining price and efficiency
  notes: string;                       // Additional notes or conditions
  created_at: Date;                    // When the bid was created
  updated_at: Date;                    // When the bid was last updated
}

/**
 * MongoDB document interface extending AuctionBid for database operations
 */
export interface AuctionBidDocument extends AuctionBid, Document {
  // Mongoose document methods are included automatically
}

/**
 * Parameters required for creating a new auction bid
 */
export interface AuctionBidCreationParams {
  auction_id: string;                  // ID of the auction
  load_id: string;                     // ID of the load
  bidder_id: string;                   // ID of the bidder
  bidder_type: 'driver' | 'carrier';   // Type of bidder
  amount: number;                      // Bid amount
  notes: string;                       // Optional notes or conditions
}

/**
 * Parameters for updating an existing auction bid
 */
export interface AuctionBidUpdateParams {
  amount?: number;                      // Updated bid amount
  status?: AuctionBidStatus;            // Updated status
  efficiency_score?: number;            // Updated efficiency score
  network_contribution_score?: number;  // Updated network contribution score
  driver_score?: number;                // Updated driver score
  weighted_score?: number;              // Updated weighted score
  notes?: string;                       // Updated notes
}

/**
 * Extended interface that includes bidder, auction, and load details for comprehensive bid views
 */
export interface AuctionBidWithDetails extends AuctionBid {
  bidder_details: object;              // Details about the bidder (driver or carrier)
  auction_details: object;             // Details about the auction
  load_details: object;                // Details about the load
}

/**
 * Mongoose schema for the auction bid model
 */
export const AuctionBidSchema = new Schema<AuctionBidDocument>({
  bid_id: {
    type: String,
    required: true,
    unique: true
  },
  auction_id: {
    type: String,
    required: true,
    index: true
  },
  load_id: {
    type: String,
    required: true,
    index: true
  },
  bidder_id: {
    type: String,
    required: true,
    index: true
  },
  bidder_type: {
    type: String,
    required: true,
    enum: ['driver', 'carrier']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(AuctionBidStatus),
    default: AuctionBidStatus.PENDING
  },
  efficiency_score: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
    default: 0
  },
  network_contribution_score: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
    default: 0
  },
  driver_score: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
    default: 0
  },
  weighted_score: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
    default: 0,
    index: true
  },
  notes: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  updated_at: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  collection: 'auction_bids',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Create compound indexes for common query patterns
AuctionBidSchema.index({ auction_id: 1, bidder_id: 1 }, { unique: true });
AuctionBidSchema.index({ auction_id: 1, weighted_score: -1 });
AuctionBidSchema.index({ bidder_id: 1, created_at: -1 });

/**
 * Mongoose model for AuctionBid documents in MongoDB
 */
export const AuctionBidModel = model<AuctionBidDocument>('AuctionBid', AuctionBidSchema);

/**
 * Interface for query parameters when retrieving auction bids
 */
export interface AuctionBidQueryParams {
  auction_id?: string;                 // Filter by auction ID
  load_id?: string;                    // Filter by load ID
  bidder_id?: string;                  // Filter by bidder ID
  bidder_type?: 'driver' | 'carrier';  // Filter by bidder type
  status?: AuctionBidStatus;           // Filter by status
  min_amount?: number;                 // Minimum bid amount
  max_amount?: number;                 // Maximum bid amount
  min_efficiency_score?: number;       // Minimum efficiency score
  created_after?: Date;                // Created after specified date
  created_before?: Date;               // Created before specified date
  page?: number;                       // Page number for pagination
  limit?: number;                      // Number of results per page
  sort_by?: string;                    // Field to sort by
  sort_direction?: 'asc' | 'desc';     // Sort direction
}