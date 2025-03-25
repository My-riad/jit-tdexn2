import { Router, Request, Response, NextFunction } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2

import { AuctionService } from '../services/auction.service';
import { MarketEventsProducer } from '../producers/market-events.producer';
import {
  LoadAuction,
  LoadAuctionCreationParams,
  LoadAuctionUpdateParams,
  LoadAuctionQueryParams,
  AuctionStatus,
  AuctionBid
} from '../models/load-auction.model';
import {
  AuctionBidCreationParams,
  AuctionBidUpdateParams
} from '../models/auction-bid.model';
import { validateBody, validateQuery, validateParams } from '../../../common/middleware/validation.middleware';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';

/**
 * Controller class for handling auction-related HTTP requests
 */
export class AuctionController {
  private auctionService: AuctionService;
  private marketEventsProducer: MarketEventsProducer;
  public router: Router;

  /**
   * Initializes a new AuctionController instance and sets up routes
   * @param auctionService The auction service to use
   * @param marketEventsProducer The market events producer to use
   */
  constructor(auctionService: AuctionService, marketEventsProducer: MarketEventsProducer) {
    // Store the provided AuctionService instance
    this.auctionService = auctionService;
    // Store the provided MarketEventsProducer instance
    this.marketEventsProducer = marketEventsProducer;
    // Initialize Express router
    this.router = Router();
    // Set up auction routes
    this.setupRoutes();
    // Set up bid routes
    this.setupBidRoutes();
  }

  /**
   * Sets up all auction and bid routes
   */
  private setupRoutes(): void {
    // Set up auction routes
    this.setupAuctionRoutes();
    // Set up bid routes
    this.setupBidRoutes();
  }

  /**
   * Sets up routes for auction management
   */
  private setupAuctionRoutes(): void {
    // Set up POST /auctions route with validation for creating auctions
    this.router.post(
      '/auctions',
      validateBody(
        Joi.object({
          load_id: Joi.string().required(),
          title: Joi.string().required(),
          description: Joi.string().optional(),
          auction_type: Joi.string().optional(),
          start_time: Joi.date().iso().required(),
          end_time: Joi.date().iso().greater(Joi.ref('start_time')).required(),
          starting_price: Joi.number().required(),
          reserve_price: Joi.number().optional(),
          min_bid_increment: Joi.number().required(),
          network_efficiency_weight: Joi.number().min(0).max(1).optional(),
          price_weight: Joi.number().min(0).max(1).optional(),
          driver_score_weight: Joi.number().min(0).max(1).optional(),
          created_by: Joi.string().required()
        })
      ),
      this.createAuction.bind(this)
    );

    // Set up GET /auctions route with validation for querying auctions
    this.router.get(
      '/auctions',
      validateQuery(
        Joi.object({
          load_id: Joi.string().optional(),
          status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
          auction_type: Joi.string().optional(),
          start_time_after: Joi.date().iso().optional(),
          start_time_before: Joi.date().iso().optional(),
          end_time_after: Joi.date().iso().optional(),
          end_time_before: Joi.date().iso().optional(),
          min_price: Joi.number().optional(),
          max_price: Joi.number().optional(),
          created_by: Joi.string().optional(),
          created_after: Joi.date().iso().optional(),
          created_before: Joi.date().iso().optional(),
          has_bids: Joi.boolean().optional(),
          has_winner: Joi.boolean().optional(),
          page: Joi.number().integer().min(1).optional(),
          limit: Joi.number().integer().min(1).max(100).optional(),
          sort_by: Joi.string().optional(),
          sort_direction: Joi.string().valid('asc', 'desc').optional()
        })
      ),
      this.getAuctions.bind(this)
    );

    // Set up GET /auctions/:auctionId route with validation for getting auction details
    this.router.get(
      '/auctions/:auctionId',
      validateParams(
        Joi.object({
          auctionId: Joi.string().uuid().required()
        })
      ),
      this.getAuctionById.bind(this)
    );

    // Set up PUT /auctions/:auctionId route with validation for updating auctions
    this.router.put(
      '/auctions/:auctionId',
      validateParams(
        Joi.object({
          auctionId: Joi.string().uuid().required()
        })
      ),
      validateBody(
        Joi.object({
          title: Joi.string().optional(),
          description: Joi.string().optional(),
          status: Joi.string().valid(...Object.values(AuctionStatus)).optional(),
          start_time: Joi.date().iso().optional(),
          end_time: Joi.date().iso().greater(Joi.ref('start_time')).optional(),
          starting_price: Joi.number().optional(),
          reserve_price: Joi.number().optional(),
          min_bid_increment: Joi.number().optional(),
          network_efficiency_weight: Joi.number().min(0).max(1).optional(),
          price_weight: Joi.number().min(0).max(1).optional(),
          driver_score_weight: Joi.number().min(0).max(1).optional(),
          bids_count: Joi.number().integer().min(0).optional(),
          winning_bid_id: Joi.string().uuid().allow(null).optional(),
          cancellation_reason: Joi.string().optional()
        })
      ),
      this.updateAuction.bind(this)
    );

    // Set up POST /auctions/:auctionId/start route with validation for starting auctions
    this.router.post(
      '/auctions/:auctionId/start',
      validateParams(
        Joi.object({
          auctionId: Joi.string().uuid().required()
        })
      ),
      this.startAuction.bind(this)
    );

    // Set up POST /auctions/:auctionId/end route with validation for ending auctions
    this.router.post(
      '/auctions/:auctionId/end',
      validateParams(
        Joi.object({
          auctionId: Joi.string().uuid().required()
        })
      ),
      this.endAuction.bind(this)
    );

    // Set up POST /auctions/:auctionId/cancel route with validation for cancelling auctions
    this.router.post(
      '/auctions/:auctionId/cancel',
      validateParams(
        Joi.object({
          auctionId: Joi.string().uuid().required()
        })
      ),
      validateBody(
        Joi.object({
          reason: Joi.string().required()
        })
      ),
      this.cancelAuction.bind(this)
    );
  }

  /**
   * Sets up routes for bid management
   */
  private setupBidRoutes(): void {
    // Set up POST /auctions/:auctionId/bids route with validation for placing bids
    this.router.post(
      '/auctions/:auctionId/bids',
      validateParams(
        Joi.object({
          auctionId: Joi.string().uuid().required()
        })
      ),
      validateBody(
        Joi.object({
          bidder_id: Joi.string().required(),
          bidder_type: Joi.string().valid('driver', 'carrier').required(),
          amount: Joi.number().required(),
          notes: Joi.string().optional()
        })
      ),
      this.placeBid.bind(this)
    );

    // Set up GET /auctions/:auctionId/bids route with validation for getting auction bids
    this.router.get(
      '/auctions/:auctionId/bids',
      validateParams(
        Joi.object({
          auctionId: Joi.string().uuid().required()
        })
      ),
      this.getAuctionBids.bind(this)
    );

    // Set up GET /bids/:bidId route with validation for getting bid details
    this.router.get(
      '/bids/:bidId',
      validateParams(
        Joi.object({
          bidId: Joi.string().uuid().required()
        })
      ),
      this.getBidById.bind(this)
    );

    // Set up PUT /bids/:bidId route with validation for updating bids
    this.router.put(
      '/bids/:bidId',
      validateParams(
        Joi.object({
          bidId: Joi.string().uuid().required()
        })
      ),
      validateBody(
        Joi.object({
          amount: Joi.number().optional(),
          status: Joi.string().optional(),
          efficiency_score: Joi.number().optional(),
          network_contribution_score: Joi.number().optional(),
          driver_score: Joi.number().optional(),
          notes: Joi.string().optional()
        })
      ),
      this.updateBid.bind(this)
    );

    // Set up POST /bids/:bidId/withdraw route with validation for withdrawing bids
    this.router.post(
      '/bids/:bidId/withdraw',
      validateParams(
        Joi.object({
          bidId: Joi.string().uuid().required()
        })
      ),
      this.withdrawBid.bind(this)
    );

    //Set up GET /bidders/:bidderId/bids route with validation for getting bidder's bids
    this.router.get(
      '/bidders/:bidderId/bids',
      validateParams(
        Joi.object({
          bidderId: Joi.string().required()
        })
      ),
      validateQuery(
        Joi.object({
          bidderType: Joi.string().valid('driver', 'carrier').required()
        })
      ),
      this.getBidderBids.bind(this)
    );
  }

  /**
   * Creates a new auction
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async createAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract auction creation parameters from request body
      const params = req.body as LoadAuctionCreationParams;

      // Call auctionService.createAuction with the parameters
      const auction = await this.auctionService.createAuction(params);

      // Publish auction created event using marketEventsProducer
      await this.marketEventsProducer.produceAuctionCreatedEvent(auction);

      // Return 201 Created response with the created auction
      res.status(StatusCodes.CREATED).json(auction);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves auctions based on query parameters
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async getAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters from request
      const params = req.query as LoadAuctionQueryParams;

      // Call auctionService.queryAuctions with the parameters
      const { auctions, total, page, limit } = await this.auctionService.queryAuctions(params);

      // Return 200 OK response with the auctions and pagination metadata
      res.status(StatusCodes.OK).json({ auctions, total, page, limit });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves an auction by its ID
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async getAuctionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract auction ID from request parameters
      const auctionId = req.params.auctionId;

      // Call auctionService.getAuctionWithBids with the auction ID
      const auction = await this.auctionService.getAuctionWithBids(auctionId);

      // If auction not found, throw NOT_FOUND error
      if (!auction) {
        throw new AppError(`Auction with id ${auctionId} not found`, { code: ErrorCodes.NFND_AUCTION_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
      }

      // Return 200 OK response with the auction details
      res.status(StatusCodes.OK).json(auction);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Updates an existing auction
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async updateAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract auction ID from request parameters
      const auctionId = req.params.auctionId;

      // Extract update parameters from request body
      const params = req.body as LoadAuctionUpdateParams;

      // Call auctionService.updateAuction with the ID and parameters
      const auction = await this.auctionService.updateAuction(auctionId, params);

      // If auction not found, throw NOT_FOUND error
      if (!auction) {
        throw new AppError(`Auction with id ${auctionId} not found`, { code: ErrorCodes.NFND_AUCTION_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
      }

      // Return 200 OK response with the updated auction
      res.status(StatusCodes.OK).json(auction);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Starts an auction, making it active for bidding
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async startAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract auction ID from request parameters
      const auctionId = req.params.auctionId;

      // Call auctionService.startAuction with the auction ID
      const auction = await this.auctionService.startAuction(auctionId);

      // If auction not found, throw NOT_FOUND error
      if (!auction) {
        throw new AppError(`Auction with id ${auctionId} not found`, { code: ErrorCodes.NFND_AUCTION_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
      }

      // Return 200 OK response with the started auction
      res.status(StatusCodes.OK).json(auction);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Ends an active auction and determines the winner
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async endAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract auction ID from request parameters
      const auctionId = req.params.auctionId;

      // Call auctionService.endAuction with the auction ID
      const auction = await this.auctionService.endAuction(auctionId);

      // If auction not found, throw NOT_FOUND error
      if (!auction) {
        throw new AppError(`Auction with id ${auctionId} not found`, { code: ErrorCodes.NFND_AUCTION_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
      }

      // Publish auction completed event using marketEventsProducer
      // TODO: Get winning bid
      const winningBid: AuctionBid = {} as AuctionBid;
      await this.marketEventsProducer.produceAuctionCompletedEvent(auction, winningBid);

      // Return 200 OK response with the completed auction
      res.status(StatusCodes.OK).json(auction);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Cancels an auction that hasn't been completed yet
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async cancelAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract auction ID from request parameters
      const auctionId = req.params.auctionId;

      // Extract cancellation reason from request body
      const reason = req.body.reason;

      // Call auctionService.cancelAuction with the ID and reason
      const auction = await this.auctionService.cancelAuction(auctionId, reason);

      // If auction not found, throw NOT_FOUND error
      if (!auction) {
        throw new AppError(`Auction with id ${auctionId} not found`, { code: ErrorCodes.NFND_AUCTION_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
      }

      // Return 200 OK response with the cancelled auction
      res.status(StatusCodes.OK).json(auction);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Places a new bid on an active auction
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async placeBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract auction ID from request parameters
      const auctionId = req.params.auctionId;

      // Extract bid creation parameters from request body
      const params = req.body as AuctionBidCreationParams;

      // Set auction_id in bid parameters from URL parameter
      params.auction_id = auctionId;

      // Call auctionService.placeBid with the parameters
      const bid = await this.auctionService.placeBid(params);

      // Publish bid placed event using marketEventsProducer
      await this.marketEventsProducer.produceAuctionBidPlacedEvent(bid);

      // Return 201 Created response with the created bid
      res.status(StatusCodes.CREATED).json(bid);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves all bids for a specific auction
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async getAuctionBids(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract auction ID from request parameters
      const auctionId = req.params.auctionId;

      // Call auctionService.getBidsByAuctionId with the auction ID
      const bids = await this.auctionService.getBidsByAuctionId(auctionId);

      // Return 200 OK response with the bids
      res.status(StatusCodes.OK).json(bids);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves a bid by its ID
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async getBidById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract bid ID from request parameters
      const bidId = req.params.bidId;

      // Call auctionService to retrieve the bid
      const bid = await this.auctionService.getAuctionById(bidId);

      // If bid not found, throw NOT_FOUND error
      if (!bid) {
        throw new AppError(`Bid with id ${bidId} not found`, { code: ErrorCodes.NFND_BID_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
      }

      // Return 200 OK response with the bid details
      res.status(StatusCodes.OK).json(bid);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Updates an existing bid
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async updateBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract bid ID from request parameters
      const bidId = req.params.bidId;

      // Extract update parameters from request body
      const params = req.body as AuctionBidUpdateParams;

      // Call auctionService.updateBid with the ID and parameters
      const bid = await this.auctionService.updateBid(bidId, params);

      // If bid not found, throw NOT_FOUND error
      if (!bid) {
        throw new AppError(`Bid with id ${bidId} not found`, { code: ErrorCodes.NFND_BID_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
      }

      // Return 200 OK response with the updated bid
      res.status(StatusCodes.OK).json(bid);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Withdraws a bid from an active auction
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async withdrawBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract bid ID from request parameters
      const bidId = req.params.bidId;

      // Call auctionService.withdrawBid with the bid ID
      const bid = await this.auctionService.withdrawBid(bidId);

      // If bid not found, throw NOT_FOUND error
      if (!bid) {
        throw new AppError(`Bid with id ${bidId} not found`, { code: ErrorCodes.NFND_BID_NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
      }

      // Return 200 OK response with the withdrawn bid
      res.status(StatusCodes.OK).json(bid);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves all bids placed by a specific bidder
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   */
  private async getBidderBids(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract bidder ID from request parameters
      const bidderId = req.params.bidderId;

      // Extract bidder type from query parameters
      const bidderType = req.query.bidderType as string;

      // Call auctionService.getBidsByBidderId with the ID and type
      const bids = await this.auctionService.getBidsByBidderId(bidderId, bidderType);

      // Return 200 OK response with the bids
      res.status(StatusCodes.OK).json(bids);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Returns the configured router with all auction routes
   * @returns Express router with configured routes
   */
  public getRouter(): Router {
    // Return the router instance with all configured routes
    return this.router;
  }
}