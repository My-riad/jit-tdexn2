/**
 * Auction Service
 *
 * This service manages load auctions, handling auction lifecycle, bid management,
 * and intelligent bid evaluation based on multiple factors including price,
 * driver efficiency score, and network contribution.
 */

import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import mongoose from 'mongoose'; // mongoose v6.0.0

import {
  LoadAuction,
  LoadAuctionModel,
  LoadAuctionCreationParams,
  LoadAuctionUpdateParams,
  LoadAuctionQueryParams,
  LoadAuctionWithBids,
  AuctionStatus,
  AuctionType
} from '../models/load-auction.model';
import {
  AuctionBid,
  AuctionBidModel,
  AuctionBidCreationParams,
  AuctionBidUpdateParams,
  AuctionBidStatus,
  AuctionBidQueryParams
} from '../models/auction-bid.model';
import { NetworkOptimizer } from '../../../optimization-engine/src/algorithms/network-optimizer';
import { Driver } from '../../../common/interfaces/driver.interface';
import { Load } from '../../../common/interfaces/load.interface';
import { logger } from '../../../common/utils/logger';

// Define default weights for auction scoring
const DEFAULT_NETWORK_EFFICIENCY_WEIGHT = 0.4;
const DEFAULT_PRICE_WEIGHT = 0.3;
const DEFAULT_DRIVER_SCORE_WEIGHT = 0.3;

/**
 * Service class for managing load auctions and bids with AI-driven evaluation
 */
export class AuctionService {
  private networkOptimizer: NetworkOptimizer;

  /**
   * Initializes a new AuctionService instance
   */
  constructor() {
    // Initialize the NetworkOptimizer for calculating network contribution scores
    this.networkOptimizer = new NetworkOptimizer();
  }

  /**
   * Creates a new load auction
   * @param params The parameters for creating the auction
   * @returns The created auction
   */
  async createAuction(params: LoadAuctionCreationParams): Promise<LoadAuction> {
    logger.info('Creating a new load auction', { params });

    // Validate auction creation parameters
    if (!params || !params.load_id || !params.title || !params.start_time || !params.end_time) {
      logger.error('Invalid auction creation parameters', { params });
      throw new Error('Invalid auction creation parameters');
    }

    // Generate a unique auction ID
    const auctionId = uuidv4();

    // Set default weights if not provided
    const networkEfficiencyWeight = params.network_efficiency_weight || DEFAULT_NETWORK_EFFICIENCY_WEIGHT;
    const priceWeight = params.price_weight || DEFAULT_PRICE_WEIGHT;
    const driverScoreWeight = params.driver_score_weight || DEFAULT_DRIVER_SCORE_WEIGHT;

    // Set initial auction status to DRAFT
    const initialStatus = AuctionStatus.DRAFT;

    // Create and save the auction in the database
    const auctionData: LoadAuction = {
      auction_id: auctionId,
      load_id: params.load_id,
      title: params.title,
      description: params.description || '',
      auction_type: params.auction_type || AuctionType.STANDARD,
      status: initialStatus,
      start_time: params.start_time,
      end_time: params.end_time,
      actual_start_time: null,
      actual_end_time: null,
      starting_price: params.starting_price,
      reserve_price: params.reserve_price || 0,
      current_price: params.starting_price,
      min_bid_increment: params.min_bid_increment,
      network_efficiency_weight: networkEfficiencyWeight,
      price_weight: priceWeight,
      driver_score_weight: driverScoreWeight,
      bids_count: 0,
      winning_bid_id: null,
      cancellation_reason: null,
      created_by: params.created_by,
      created_at: new Date(),
      updated_at: new Date()
    };

    const auction = new LoadAuctionModel(auctionData);
    await auction.save();

    logger.info('Created auction', { auctionId });

    // Return the created auction
    return auctionData;
  }

  /**
   * Retrieves an auction by its ID
   * @param auctionId The ID of the auction to retrieve
   * @returns The auction if found, null otherwise
   */
  async getAuctionById(auctionId: string): Promise<LoadAuction | null> {
    logger.info('Retrieving auction by ID', { auctionId });

    // Query the database for the auction with the given ID
    const auction = await LoadAuctionModel.findOne({ auction_id: auctionId }).lean();

    // Return the auction if found, null otherwise
    return auction;
  }

  /**
   * Retrieves an auction with all its bids and load details
   * @param auctionId The ID of the auction to retrieve
   * @returns The auction with bids if found, null otherwise
   */
  async getAuctionWithBids(auctionId: string): Promise<LoadAuctionWithBids | null> {
    logger.info('Retrieving auction with bids', { auctionId });

    // Query the database for the auction with the given ID
    const auction = await LoadAuctionModel.findOne({ auction_id: auctionId }).lean();

    // If auction found, retrieve all bids for this auction
    if (auction) {
      const bids: AuctionBid[] = await AuctionBidModel.find({ auction_id: auctionId }).lean();

      // Retrieve load details for the auction
      const loadDetails: Load = { load_id: auction.load_id } as Load; // Placeholder - replace with actual load retrieval

      // If auction has a winning bid, retrieve the winning bid details
      let winningBid: AuctionBid | null = null;
      if (auction.winning_bid_id) {
        winningBid = await AuctionBidModel.findOne({ bid_id: auction.winning_bid_id }).lean();
      }

      // Combine auction, bids, and load details into a single object
      const auctionWithBids: LoadAuctionWithBids = {
        ...auction,
        bids: bids,
        load_details: loadDetails,
        winning_bid: winningBid
      };

      // Return the combined data if auction found, null otherwise
      return auctionWithBids;
    }

    return null;
  }

  /**
   * Updates an existing auction
   * @param auctionId The ID of the auction to update
   * @param params The parameters to update
   * @returns The updated auction if found, null otherwise
   */
  async updateAuction(auctionId: string, params: LoadAuctionUpdateParams): Promise<LoadAuction | null> {
    logger.info('Updating auction', { auctionId, params });

    // Validate update parameters
    if (!params || Object.keys(params).length === 0) {
      logger.warn('No update parameters provided', { auctionId });
      return this.getAuctionById(auctionId); // Return current auction if no updates
    }

    // Query the database for the auction with the given ID
    const auction = await LoadAuctionModel.findOne({ auction_id: auctionId });

    // If auction not found, return null
    if (!auction) {
      logger.warn('Auction not found for update', { auctionId });
      return null;
    }

    // Update the auction with the provided parameters
    if (params.title) auction.title = params.title;
    if (params.description) auction.description = params.description;
    if (params.status) auction.status = params.status;
    if (params.start_time) auction.start_time = params.start_time;
    if (params.end_time) auction.end_time = params.end_time;
    if (params.actual_start_time) auction.actual_start_time = params.actual_start_time;
    if (params.actual_end_time) auction.actual_end_time = params.actual_end_time;
    if (params.starting_price) auction.starting_price = params.starting_price;
    if (params.reserve_price) auction.reserve_price = params.reserve_price;
    if (params.current_price) auction.current_price = params.current_price;
    if (params.min_bid_increment) auction.min_bid_increment = params.min_bid_increment;
    if (params.network_efficiency_weight) auction.network_efficiency_weight = params.network_efficiency_weight;
    if (params.price_weight) auction.price_weight = params.price_weight;
    if (params.driver_score_weight) auction.driver_score_weight = params.driver_score_weight;
    if (params.bids_count) auction.bids_count = params.bids_count;
    if (params.winning_bid_id) auction.winning_bid_id = params.winning_bid_id;
    if (params.cancellation_reason) auction.cancellation_reason = params.cancellation_reason;
    auction.updated_at = new Date();

    // Save the updated auction to the database
    await auction.save();

    logger.info('Auction updated', { auctionId });

    // Return the updated auction
    return auction.toObject();
  }

  /**
   * Starts an auction, making it active for bidding
   * @param auctionId The ID of the auction to start
   * @returns The started auction if found and valid, null otherwise
   */
  async startAuction(auctionId: string): Promise<LoadAuction | null> {
    logger.info('Starting auction', { auctionId });

    // Query the database for the auction with the given ID
    const auction = await LoadAuctionModel.findOne({ auction_id: auctionId });

    // If auction not found, return null
    if (!auction) {
      logger.warn('Auction not found for start', { auctionId });
      return null;
    }

    // Validate that auction is in DRAFT or SCHEDULED status
    if (auction.status !== AuctionStatus.DRAFT && auction.status !== AuctionStatus.SCHEDULED) {
      logger.error('Auction cannot be started in its current status', { auctionId, status: auction.status });
      return null;
    }

    // Update auction status to ACTIVE
    auction.status = AuctionStatus.ACTIVE;
    auction.actual_start_time = new Date();
    auction.updated_at = new Date();

    // Save the updated auction to the database
    await auction.save();

    logger.info('Auction started', { auctionId });

    // Return the updated auction
    return auction.toObject();
  }

  /**
   * Ends an active auction and determines the winner
   * @param auctionId The ID of the auction to end
   * @returns The completed auction if found and valid, null otherwise
   */
  async endAuction(auctionId: string): Promise<LoadAuction | null> {
    logger.info('Ending auction', { auctionId });

    // Query the database for the auction with the given ID
    const auction = await LoadAuctionModel.findOne({ auction_id: auctionId });

    // If auction not found, return null
    if (!auction) {
      logger.warn('Auction not found for end', { auctionId });
      return null;
    }

    // Validate that auction is in ACTIVE status
    if (auction.status !== AuctionStatus.ACTIVE) {
      logger.error('Auction cannot be ended in its current status', { auctionId, status: auction.status });
      return null;
    }

    // Retrieve all active bids for this auction
    const bids: AuctionBid[] = await AuctionBidModel.find({ auction_id: auctionId, status: AuctionBidStatus.ACTIVE }).lean();

    // Evaluate bids to determine the winner based on weighted scores
    const winningBid = this.determineAuctionWinner(auction, bids);

    // Update auction status to COMPLETED
    auction.status = AuctionStatus.COMPLETED;
    auction.actual_end_time = new Date();
    auction.updated_at = new Date();

    // Set winning_bid_id to the ID of the winning bid
    if (winningBid) {
      auction.winning_bid_id = winningBid.bid_id;

      // Update winning bid status to ACCEPTED
      await AuctionBidModel.updateOne({ bid_id: winningBid.bid_id }, { status: AuctionBidStatus.ACCEPTED });

      // Update other bids status to REJECTED
      await AuctionBidModel.updateMany({ auction_id: auctionId, bid_id: { $ne: winningBid.bid_id } }, { status: AuctionBidStatus.REJECTED });
    }

    // Save the updated auction to the database
    await auction.save();

    logger.info('Auction ended', { auctionId, winningBidId: auction.winning_bid_id });

    // Return the updated auction
    return auction.toObject();
  }

  /**
   * Cancels an auction that hasn't been completed yet
   * @param auctionId The ID of the auction to cancel
   * @param reason The reason for cancellation
   * @returns The cancelled auction if found and valid, null otherwise
   */
  async cancelAuction(auctionId: string, reason: string): Promise<LoadAuction | null> {
    logger.info('Cancelling auction', { auctionId, reason });

    // Query the database for the auction with the given ID
    const auction = await LoadAuctionModel.findOne({ auction_id: auctionId });

    // If auction not found, return null
    if (!auction) {
      logger.warn('Auction not found for cancellation', { auctionId });
      return null;
    }

    // Validate that auction is not already in COMPLETED status
    if (auction.status === AuctionStatus.COMPLETED) {
      logger.error('Auction cannot be cancelled as it is already completed', { auctionId, status: auction.status });
      return null;
    }

    // Update auction status to CANCELLED
    auction.status = AuctionStatus.CANCELLED;
    auction.cancellation_reason = reason;
    auction.updated_at = new Date();

    // Save the updated auction to the database
    await auction.save();

    logger.info('Auction cancelled', { auctionId, reason });

    // Return the updated auction
    return auction.toObject();
  }

  /**
   * Queries auctions based on various filter criteria
   * @param params The query parameters
   * @returns Paginated auctions matching the query criteria
   */
  async queryAuctions(params: LoadAuctionQueryParams): Promise<{ auctions: LoadAuction[]; total: number; page: number; limit: number }> {
    logger.info('Querying auctions', { params });

    // Build a query based on the provided filter parameters
    const query: any = {};
    if (params.load_id) query.load_id = params.load_id;
    if (params.status) {
      query.status = Array.isArray(params.status) ? { $in: params.status } : params.status;
    }
    if (params.auction_type) query.auction_type = params.auction_type;
    if (params.start_time_after) query.start_time = { $gte: params.start_time_after };
    if (params.start_time_before) query.start_time = { ...query.start_time, $lte: params.start_time_before };
    if (params.end_time_after) query.end_time = { $gte: params.end_time_after };
    if (params.end_time_before) query.end_time = { ...query.end_time, $lte: params.end_time_before };
    if (params.min_price) query.current_price = { $gte: params.min_price };
    if (params.max_price) query.current_price = { ...query.current_price, $lte: params.max_price };
    if (params.created_by) query.created_by = params.created_by;
    if (params.created_after) query.created_at = { $gte: params.created_after };
    if (params.created_before) query.created_at = { ...query.created_at, $lte: params.created_before };
    if (params.has_bids === true) query.bids_count = { $gt: 0 };
    if (params.has_bids === false) query.bids_count = 0;
    if (params.has_winner === true) query.winning_bid_id = { $ne: null };
    if (params.has_winner === false) query.winning_bid_id = null;

    // Apply pagination parameters (page, limit) with defaults if not provided
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Execute the query to get matching auctions
    let sort: any = { created_at: -1 }; // Default sort
    if (params.sort_by) {
      sort = { [params.sort_by]: params.sort_direction === 'asc' ? 1 : -1 };
    }
    const auctions = await LoadAuctionModel.find(query).sort(sort).skip(skip).limit(limit).lean();

    // Count total matching auctions for pagination metadata
    const total = await LoadAuctionModel.countDocuments(query);

    logger.info('Query completed', { auctionCount: auctions.length, total });

    // Return the auctions with pagination metadata
    return { auctions, total, page, limit };
  }

  /**
   * Places a new bid on an active auction
   * @param params The bid creation parameters
   * @returns The created bid
   */
  async placeBid(params: AuctionBidCreationParams): Promise<AuctionBid> {
    logger.info('Placing a new bid', { params });

    // Validate bid creation parameters
    if (!params || !params.auction_id || !params.bidder_id || !params.amount) {
      logger.error('Invalid bid creation parameters', { params });
      throw new Error('Invalid bid creation parameters');
    }

    // Check that the auction exists and is in ACTIVE status
    const auction = await LoadAuctionModel.findOne({ auction_id: params.auction_id, status: AuctionStatus.ACTIVE });
    if (!auction) {
      logger.error('Auction not found or not active', { auctionId: params.auction_id });
      throw new Error('Auction not found or not active');
    }

    // Verify that the bidder hasn't already placed a bid on this auction
    const existingBid = await AuctionBidModel.findOne({ auction_id: params.auction_id, bidder_id: params.bidder_id });
    if (existingBid) {
      logger.error('Bidder has already placed a bid on this auction', { auctionId: params.auction_id, bidderId: params.bidder_id });
      throw new Error('Bidder has already placed a bid on this auction');
    }

    // Calculate efficiency score for the bidder
    const { efficiency_score, network_contribution_score } = await this.calculateBidEfficiencyScore(params.bidder_id, params.bidder_type, auction.load_id);

    // Calculate weighted score based on auction weights
    const bidAmount = params.amount;
    const weightedScore = this.calculateWeightedScore({
      bid_id: '', // Placeholder
      auction_id: params.auction_id,
      load_id: auction.load_id,
      bidder_id: params.bidder_id,
      bidder_type: params.bidder_type,
      amount: bidAmount,
      status: AuctionBidStatus.PENDING,
      efficiency_score: efficiency_score,
      network_contribution_score: network_contribution_score,
      driver_score: 0, // Placeholder
      weighted_score: 0, // Placeholder
      notes: params.notes || '',
      created_at: new Date(),
      updated_at: new Date()
    }, auction);

    // Generate a unique bid ID
    const bidId = uuidv4();

    // Create and save the bid in the database
    const bidData: AuctionBid = {
      bid_id: bidId,
      auction_id: params.auction_id,
      load_id: auction.load_id,
      bidder_id: params.bidder_id,
      bidder_type: params.bidder_type,
      amount: bidAmount,
      status: AuctionBidStatus.PENDING,
      efficiency_score: efficiency_score,
      network_contribution_score: network_contribution_score,
      driver_score: 0, // Placeholder
      weighted_score: weightedScore,
      notes: params.notes || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const bid = new AuctionBidModel(bidData);
    await bid.save();

    // Update the auction's bids_count
    auction.bids_count = (auction.bids_count || 0) + 1;
    await auction.save();

    logger.info('Bid placed', { bidId, auctionId: params.auction_id });

    // Return the created bid
    return bidData;
  }

  /**
   * Updates an existing bid on an active auction
   * @param bidId The ID of the bid to update
   * @param params The parameters to update
   * @returns The updated bid if found, null otherwise
   */
  async updateBid(bidId: string, params: AuctionBidUpdateParams): Promise<AuctionBid | null> {
    logger.info('Updating bid', { bidId, params });

    // Validate update parameters
    if (!params || Object.keys(params).length === 0) {
      logger.warn('No update parameters provided', { bidId });
      return AuctionBidModel.findOne({ bid_id: bidId }).lean(); // Return current bid if no updates
    }

    // Query the database for the bid with the given ID
    const bid = await AuctionBidModel.findOne({ bid_id: bidId });

    // If bid not found, return null
    if (!bid) {
      logger.warn('Bid not found for update', { bidId });
      return null;
    }

    // Check that the associated auction is still in ACTIVE status
    const auction = await LoadAuctionModel.findOne({ auction_id: bid.auction_id, status: AuctionStatus.ACTIVE });
    if (!auction) {
      logger.error('Auction not found or not active', { auctionId: bid.auction_id });
      throw new Error('Auction not found or not active');
    }

    // If amount is updated, recalculate weighted score
    if (params.amount) {
      bid.amount = params.amount;
      bid.weighted_score = this.calculateWeightedScore(bid, auction);
    }

    // Update the bid with the provided parameters
    if (params.status) bid.status = params.status;
    if (params.efficiency_score) bid.efficiency_score = params.efficiency_score;
    if (params.network_contribution_score) bid.network_contribution_score = params.network_contribution_score;
    if (params.driver_score) bid.driver_score = params.driver_score;
    if (params.notes) bid.notes = params.notes;
    bid.updated_at = new Date();

    // Save the updated bid to the database
    await bid.save();

    logger.info('Bid updated', { bidId });

    // Return the updated bid
    return bid.toObject();
  }

  /**
   * Withdraws a bid from an active auction
   * @param bidId The ID of the bid to withdraw
   * @returns The withdrawn bid if found, null otherwise
   */
  async withdrawBid(bidId: string): Promise<AuctionBid | null> {
    logger.info('Withdrawing bid', { bidId });

    // Query the database for the bid with the given ID
    const bid = await AuctionBidModel.findOne({ bid_id: bidId });

    // If bid not found, return null
    if (!bid) {
      logger.warn('Bid not found for withdrawal', { bidId });
      return null;
    }

    // Check that the associated auction is still in ACTIVE status
    const auction = await LoadAuctionModel.findOne({ auction_id: bid.auction_id, status: AuctionStatus.ACTIVE });
    if (!auction) {
      logger.error('Auction not found or not active', { auctionId: bid.auction_id });
      throw new Error('Auction not found or not active');
    }

    // Update bid status to WITHDRAWN
    bid.status = AuctionBidStatus.WITHDRAWN;
    bid.updated_at = new Date();

    // Save the updated bid to the database
    await bid.save();

    // Update the auction's bids_count
    auction.bids_count = Math.max(0, (auction.bids_count || 1) - 1);
    await auction.save();

    logger.info('Bid withdrawn', { bidId });

    // Return the updated bid
    return bid.toObject();
  }

  /**
   * Retrieves all bids for a specific auction
   * @param auctionId The ID of the auction
   * @returns Array of bids for the auction
   */
  async getBidsByAuctionId(auctionId: string): Promise<AuctionBid[]> {
    logger.info('Retrieving bids by auction ID', { auctionId });

    // Query the database for bids with the given auction ID
    const bids = await AuctionBidModel.find({ auction_id: auctionId }).lean();

    logger.info('Bids retrieved', { auctionId, bidCount: bids.length });

    // Return the array of bids
    return bids;
  }

  /**
   * Retrieves all bids placed by a specific bidder
   * @param bidderId The ID of the bidder
   * @param bidderType The type of bidder (driver or carrier)
   * @returns Array of bids placed by the bidder
   */
  async getBidsByBidderId(bidderId: string, bidderType: string): Promise<AuctionBid[]> {
    logger.info('Retrieving bids by bidder ID', { bidderId, bidderType });

    // Query the database for bids with the given bidder ID and type
    const bids = await AuctionBidModel.find({ bidder_id: bidderId, bidder_type: bidderType }).lean();

    logger.info('Bids retrieved', { bidderId, bidderType, bidCount: bids.length });

    // Return the array of bids
    return bids;
  }

  /**
   * Evaluates all bids for an auction and returns weighted scores
   * @param auctionId The ID of the auction
   * @returns Array of bids with calculated weighted scores
   */
  async evaluateBids(auctionId: string): Promise<AuctionBid[]> {
    logger.info('Evaluating bids', { auctionId });

    // Query the database for the auction with the given ID
    const auction = await LoadAuctionModel.findOne({ auction_id: auctionId });
    if (!auction) {
      logger.error('Auction not found', { auctionId });
      throw new Error('Auction not found');
    }

    // Retrieve all active bids for this auction
    const bids: AuctionBid[] = await AuctionBidModel.find({ auction_id: auctionId, status: AuctionBidStatus.ACTIVE }).lean();

    // For each bid, calculate or update the weighted score
    const scoredBids = bids.map(bid => ({
      ...bid,
      weighted_score: this.calculateWeightedScore(bid, auction)
    }));

    // Sort bids by weighted score (lower is better)
    scoredBids.sort((a, b) => a.weighted_score - b.weighted_score);

    logger.info('Bids evaluated', { auctionId, bidCount: scoredBids.length });

    // Return the sorted array of bids with scores
    return scoredBids;
  }

  /**
   * Calculates the efficiency score for a potential bid
   * @param bidderId The ID of the bidder
   * @param bidderType The type of bidder (driver or carrier)
   * @param loadId The ID of the load
   * @returns Calculated efficiency and network contribution scores
   */
  async calculateBidEfficiencyScore(bidderId: string, bidderType: string, loadId: string): Promise<{ efficiency_score: number; network_contribution_score: number }> {
    logger.info('Calculating bid efficiency score', { bidderId, bidderType, loadId });

    // Retrieve driver information for the bidder
    const driver: Driver = { driver_id: bidderId, efficiency_score: 70 } as Driver; // Placeholder - replace with actual driver retrieval

    // Retrieve load information
    const load: Load = { load_id: loadId } as Load; // Placeholder - replace with actual load retrieval

    // Get driver's efficiency score from their profile
    const driverEfficiencyScore = driver.efficiency_score || 0;

    // Calculate network contribution score using NetworkOptimizer
    const networkContributionScore = await this.networkOptimizer.calculateNetworkContribution(driver, load, [], []); // Placeholder

    logger.info('Bid efficiency score calculated', { bidderId, bidderType, loadId, driverEfficiencyScore, networkContributionScore });

    // Return both scores
    return {
      efficiency_score: driverEfficiencyScore,
      network_contribution_score: networkContributionScore
    };
  }

  /**
   * Calculates the weighted score for a bid based on auction weights
   * @param bid The auction bid
   * @param auction The load auction
   * @returns Weighted score where lower values indicate better bids
   */
  calculateWeightedScore(bid: AuctionBid, auction: LoadAuction): number {
    // Normalize the bid amount relative to other bids (lower is better)
    const normalizedBidAmount = bid.amount / auction.starting_price;

    // Normalize the efficiency score (higher is better)
    const normalizedEfficiencyScore = bid.efficiency_score / 100;

    // Use the network contribution score as is (higher is better)
    const networkContributionScore = bid.network_contribution_score / 100;

    // Apply weights from the auction to each component
    const weightedBidAmount = normalizedBidAmount * auction.price_weight;
    const weightedEfficiencyScore = (1 - normalizedEfficiencyScore) * auction.network_efficiency_weight; // Invert for minimization
    const weightedNetworkContribution = (1 - networkContributionScore) * auction.driver_score_weight; // Invert for minimization

    // Calculate the final weighted score
    const weightedScore = weightedBidAmount + weightedEfficiencyScore + weightedNetworkContribution;

    logger.debug('Weighted score calculated', { bidId: bid.bid_id, weightedScore });

    // Return the weighted score
    return weightedScore;
  }

  /**
   * Determines the winner of an auction based on weighted bid scores
   * @param auction The load auction
   * @param bids Array of bids for the auction
   * @returns The winning bid or null if no valid bids
   */
  determineAuctionWinner(auction: LoadAuction, bids: AuctionBid[]): AuctionBid | null {
    logger.info('Determining auction winner', { auctionId: auction.auction_id, bidCount: bids.length });

    // Filter bids to include only ACTIVE status bids
    const activeBids = bids.filter(bid => bid.status === AuctionBidStatus.ACTIVE);

    // If no active bids, return null
    if (activeBids.length === 0) {
      logger.warn('No active bids found for auction', { auctionId: auction.auction_id });
      return null;
    }

    // Calculate or retrieve weighted scores for all bids
    const scoredBids = activeBids.map(bid => ({
      ...bid,
      weighted_score: this.calculateWeightedScore(bid, auction)
    }));

    // Sort bids by weighted score (lower is better)
    scoredBids.sort((a, b) => a.weighted_score - b.weighted_score);

    // Return the bid with the lowest weighted score as the winner
    const winningBid = scoredBids[0];

    logger.info('Auction winner determined', { auctionId: auction.auction_id, winningBidId: winningBid.bid_id });

    return winningBid;
  }
}