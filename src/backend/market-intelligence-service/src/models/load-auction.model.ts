/**
 * Load Auction Model
 * 
 * This file defines the data structures and mongoose schema for load auctions in the
 * AI-driven Freight Optimization Platform. Load auctions allow drivers to bid on loads
 * with AI prioritizing network-wide efficiency rather than just the highest bid.
 */

import { Document, Schema, model } from 'mongoose'; // mongoose v6.0.0
import { Load } from '../../../common/interfaces/load.interface';
import { AuctionBid } from './auction-bid.model';

/**
 * Enumeration of possible auction statuses throughout the auction lifecycle
 */
export enum AuctionStatus {
  DRAFT = 'DRAFT',           // Initial creation, not yet visible to bidders
  SCHEDULED = 'SCHEDULED',   // Auction is scheduled for future start
  ACTIVE = 'ACTIVE',         // Auction is currently accepting bids
  COMPLETED = 'COMPLETED',   // Auction has finished with a winner
  CANCELLED = 'CANCELLED'    // Auction was cancelled before completion
}

/**
 * Enumeration of auction types with different bidding mechanics
 */
export enum AuctionType {
  STANDARD = 'STANDARD',     // Traditional auction with ascending bids
  REVERSE = 'REVERSE',       // Reverse auction with descending prices
  SEALED = 'SEALED'          // Sealed-bid auction where bids are not visible to others
}

/**
 * Main interface for load auctions in the system
 */
export interface LoadAuction {
  auction_id: string;                // Unique identifier for the auction
  load_id: string;                   // ID of the load being auctioned
  title: string;                     // Title of the auction
  description: string;               // Description of the auction
  auction_type: AuctionType;         // Type of auction
  status: AuctionStatus;             // Current status of the auction
  start_time: Date;                  // Scheduled start time
  end_time: Date;                    // Scheduled end time
  actual_start_time: Date;           // Actual time the auction started
  actual_end_time: Date;             // Actual time the auction ended
  starting_price: number;            // Initial price for the auction
  reserve_price: number;             // Minimum price that must be met
  current_price: number;             // Current highest/lowest bid price
  min_bid_increment: number;         // Minimum increment for new bids
  network_efficiency_weight: number; // Weight given to network efficiency (0-1)
  price_weight: number;              // Weight given to price (0-1)
  driver_score_weight: number;       // Weight given to driver's score (0-1)
  bids_count: number;                // Number of bids received
  winning_bid_id: string;            // ID of the winning bid
  cancellation_reason: string;       // Reason if auction was cancelled
  created_by: string;                // User who created the auction
  created_at: Date;                  // When the auction was created
  updated_at: Date;                  // When the auction was last updated
}

/**
 * MongoDB document interface extending LoadAuction for database operations
 */
export interface LoadAuctionDocument extends LoadAuction, Document {
  // Mongoose document methods are included automatically
}

/**
 * Parameters required for creating a new load auction
 */
export interface LoadAuctionCreationParams {
  load_id: string;                   // ID of the load to auction
  title: string;                     // Title of the auction
  description: string;               // Description of the auction
  auction_type: AuctionType;         // Type of auction
  start_time: Date;                  // Scheduled start time
  end_time: Date;                    // Scheduled end time
  starting_price: number;            // Initial price for the auction
  reserve_price: number;             // Minimum price that must be met
  min_bid_increment: number;         // Minimum increment for new bids
  network_efficiency_weight: number; // Weight given to network efficiency (0-1)
  price_weight: number;              // Weight given to price (0-1)
  driver_score_weight: number;       // Weight given to driver's score (0-1)
  created_by: string;                // User creating the auction
}

/**
 * Parameters for updating an existing load auction
 */
export interface LoadAuctionUpdateParams {
  title?: string;                     // Updated title
  description?: string;               // Updated description
  status?: AuctionStatus;             // Updated status
  start_time?: Date;                  // Updated start time
  end_time?: Date;                    // Updated end time
  actual_start_time?: Date;           // Updated actual start time
  actual_end_time?: Date;             // Updated actual end time
  starting_price?: number;            // Updated starting price
  reserve_price?: number;             // Updated reserve price
  current_price?: number;             // Updated current price
  min_bid_increment?: number;         // Updated bid increment
  network_efficiency_weight?: number; // Updated network efficiency weight
  price_weight?: number;              // Updated price weight
  driver_score_weight?: number;       // Updated driver score weight
  bids_count?: number;                // Updated bid count
  winning_bid_id?: string;            // Updated winning bid
  cancellation_reason?: string;       // Updated cancellation reason
}

/**
 * Parameters for querying load auctions with filtering, pagination, and sorting
 */
export interface LoadAuctionQueryParams {
  load_id?: string;                   // Filter by load ID
  status?: AuctionStatus | AuctionStatus[]; // Filter by status
  auction_type?: AuctionType;         // Filter by auction type
  start_time_after?: Date;            // Filter by start time after
  start_time_before?: Date;           // Filter by start time before
  end_time_after?: Date;              // Filter by end time after
  end_time_before?: Date;             // Filter by end time before
  min_price?: number;                 // Filter by minimum current price
  max_price?: number;                 // Filter by maximum current price
  created_by?: string;                // Filter by creator
  created_after?: Date;               // Filter by creation time after
  created_before?: Date;              // Filter by creation time before
  has_bids?: boolean;                 // Filter for auctions with/without bids
  has_winner?: boolean;               // Filter for auctions with/without winner
  page?: number;                      // Page number for pagination
  limit?: number;                     // Results per page
  sort_by?: string;                   // Field to sort by
  sort_direction?: 'asc' | 'desc';    // Sort direction
}

/**
 * Extended interface that includes bids and load details for comprehensive auction views
 */
export interface LoadAuctionWithBids extends LoadAuction {
  bids: AuctionBid[];                 // All bids on this auction
  load_details: Load;                 // Details of the load being auctioned
  winning_bid: AuctionBid;           // The winning bid details
}

/**
 * Mongoose schema for the load auction model
 */
export const LoadAuctionSchema = new Schema<LoadAuctionDocument>({
  auction_id: {
    type: String,
    required: true,
    unique: true
  },
  load_id: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  auction_type: {
    type: String,
    required: true,
    enum: Object.values(AuctionType),
    default: AuctionType.STANDARD
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(AuctionStatus),
    default: AuctionStatus.DRAFT,
    index: true
  },
  start_time: {
    type: Date,
    required: true,
    index: true
  },
  end_time: {
    type: Date,
    required: true,
    index: true
  },
  actual_start_time: {
    type: Date,
    required: false
  },
  actual_end_time: {
    type: Date,
    required: false
  },
  starting_price: {
    type: Number,
    required: true,
    min: 0
  },
  reserve_price: {
    type: Number,
    required: false,
    min: 0
  },
  current_price: {
    type: Number,
    required: true,
    min: 0,
    default: function(this: any) {
      return this.starting_price;
    }
  },
  min_bid_increment: {
    type: Number,
    required: true,
    min: 0
  },
  network_efficiency_weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.5
  },
  price_weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.3
  },
  driver_score_weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.2
  },
  bids_count: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  winning_bid_id: {
    type: String,
    required: false,
    index: true
  },
  cancellation_reason: {
    type: String,
    required: false
  },
  created_by: {
    type: String,
    required: true
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
  collection: 'load_auctions',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Create compound indexes for common query patterns
LoadAuctionSchema.index({ load_id: 1, status: 1 });
LoadAuctionSchema.index({ created_by: 1, created_at: -1 });
LoadAuctionSchema.index({ start_time: 1, status: 1 });
LoadAuctionSchema.index({ end_time: 1, status: 1 });

/**
 * Mongoose model for LoadAuction documents in MongoDB
 */
export const LoadAuctionModel = model<LoadAuctionDocument>('LoadAuction', LoadAuctionSchema);