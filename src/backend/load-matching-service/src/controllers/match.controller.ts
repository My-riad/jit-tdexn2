// src/backend/load-matching-service/src/controllers/match.controller.ts
import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { MatchingService } from '../services/matching.service';
import { RecommendationService } from '../services/recommendation.service';
import { Match, MatchCreationParams, MatchUpdateParams, MatchAcceptParams, MatchDeclineParams, MatchRecommendationParams, MatchReservationParams, RelayMatch } from '../interfaces/match.interface';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';

/**
 * Controller responsible for handling HTTP requests related to load-driver matches
 */
export class MatchController {
  public controllerName: string = 'MatchController';

  /**
   * Creates a new MatchController instance
   * @param matchingService 
   * @param recommendationService 
   */
  constructor(
    private matchingService: MatchingService,
    private recommendationService: RecommendationService
  ) {
    // Initialize the controller name
    this.controllerName = 'MatchController';
    // Store the provided matching service for match operations
    this.matchingService = matchingService;
    // Store the provided recommendation service for recommendation operations
    this.recommendationService = recommendationService;
  }

  /**
   * Get a match by ID
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  getMatchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract match_id from request parameters
      const { match_id } = req.params;

      // Log the request to get match by ID
      logger.info(`${this.controllerName}: Getting match by ID: ${match_id}`);

      // Call matchingService.getMatchById with the match ID
      const match = await this.matchingService.getMatchById(match_id);

      // Return the match with 200 OK status
      res.status(StatusCodes.OK).json(match);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Get a relay match by ID
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  getRelayMatchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract relay_id from request parameters
      const { relay_id } = req.params;

      // Log the request to get relay match by ID
      logger.info(`${this.controllerName}: Getting relay match by ID: ${relay_id}`);

      // Call matchingService.getRelayMatchById with the relay ID
      const relayMatch = await this.matchingService.getRelayMatchById(relay_id);

      // Return the relay match with 200 OK status
      res.status(StatusCodes.OK).json(relayMatch);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Get matches for a specific driver with optional status filtering
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  getMatchesForDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract driver_id from request parameters
      const { driver_id } = req.params;

      // Extract status filter from query parameters
      const { status } = req.query;
      const statuses = status ? (Array.isArray(status) ? status : [status]) as Match['status'][] : undefined;

      // Log the request to get matches for driver
      logger.info(`${this.controllerName}: Getting matches for driver ${driver_id} with statuses ${statuses}`);

      // Call matchingService.getMatchesForDriver with driver ID and status filter
      const matches = await this.matchingService.getMatchesForDriver(driver_id, statuses);

      // Return the matches with 200 OK status
      res.status(StatusCodes.OK).json(matches);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Get matches for a specific load with optional status filtering
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  getMatchesForLoad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract load_id from request parameters
      const { load_id } = req.params;

      // Extract status filter from query parameters
      const { status } = req.query;
      const statuses = status ? (Array.isArray(status) ? status : [status]) as Match['status'][] : undefined;

      // Log the request to get matches for load
      logger.info(`${this.controllerName}: Getting matches for load ${load_id} with statuses ${statuses}`);

      // Call matchingService.getMatchesForLoad with load ID and status filter
      const matches = await this.matchingService.getMatchesForLoad(load_id, statuses);

      // Return the matches with 200 OK status
      res.status(StatusCodes.OK).json(matches);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Create a new match between a driver and a load
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  createMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract match creation parameters from request body
      const matchData: MatchCreationParams = req.body;

      // Log the request to create match
      logger.info(`${this.controllerName}: Creating match`, { loadId: matchData.load_id, driverId: matchData.driver_id });

      // Call matchingService.createMatch with the parameters
      const createdMatch = await this.matchingService.createMatch(matchData);

      // Return the created match with 201 CREATED status
      res.status(StatusCodes.CREATED).json(createdMatch);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Update an existing match
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  updateMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract match_id from request parameters
      const { match_id } = req.params;

      // Extract update parameters from request body
      const updates: MatchUpdateParams = req.body;

      // Log the request to update match
      logger.info(`${this.controllerName}: Updating match ${match_id}`, { updates });

      // Call matchingService.updateMatch with match ID and updates
      const updatedMatch = await this.matchingService.updateMatch(match_id, updates);

      // Return the updated match with 200 OK status
      res.status(StatusCodes.OK).json(updatedMatch);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Accept a match, converting it from reserved to accepted
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  acceptMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract match_id from request parameters
      const { match_id } = req.params;

      // Extract driver_id and accepted_rate from request body
      const acceptParams: MatchAcceptParams = req.body;
      acceptParams.match_id = match_id;

      // Log the request to accept match
      logger.info(`${this.controllerName}: Accepting match ${match_id} for driver ${acceptParams.driver_id}`);

      // Call matchingService.acceptMatch with the parameters
      const acceptedMatch = await this.matchingService.acceptMatch(acceptParams);

      // Return the accepted match with 200 OK status
      res.status(StatusCodes.OK).json(acceptedMatch);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Decline a match, recording the reason
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  declineMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract match_id from request parameters
      const { match_id } = req.params;

      // Extract driver_id, decline_reason, and decline_notes from request body
      const declineParams: MatchDeclineParams = req.body;
      declineParams.match_id = match_id;

      // Log the request to decline match
      logger.info(`${this.controllerName}: Declining match ${match_id} for driver ${declineParams.driver_id}`);

      // Call matchingService.declineMatch with the parameters
      const declinedMatch = await this.matchingService.declineMatch(declineParams);

      // Return the declined match with 200 OK status
      res.status(StatusCodes.OK).json(declinedMatch);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Reserve a match for a driver, preventing others from accepting it
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  reserveMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract match_id from request parameters
      const { match_id } = req.params;

      // Extract driver_id and expiration_minutes from request body
      const reservationParams: MatchReservationParams = req.body;

      // Log the request to reserve match
      logger.info(`${this.controllerName}: Reserving match ${match_id} for driver ${reservationParams.driver_id}`);

      // Call matchingService.reserveMatch with the parameters
      const reservedMatch = await this.matchingService.reserveMatch(match_id, reservationParams.driver_id, reservationParams.expiration_minutes);

      // Return the reserved match with 200 OK status
      res.status(StatusCodes.OK).json(reservedMatch);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Generate load match recommendations for a driver based on optimization
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  generateRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract driver_id and recommendation parameters from request body
      const recommendationParams: MatchRecommendationParams = req.body;

      // Log the request to generate recommendations
      logger.info(`${this.controllerName}: Generating recommendations for driver ${recommendationParams.driver_id}`);

      // Call matchingService.generateMatchRecommendations with the parameters
      const recommendations = await this.matchingService.generateMatchRecommendations(recommendationParams);

      // Return the recommendations with 200 OK status
      res.status(StatusCodes.OK).json(recommendations);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Generate relay match recommendations for long-haul loads
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  generateRelayRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract relay parameters from request body
      const relayParams = req.body;

      // Log the request to generate relay recommendations
      logger.info(`${this.controllerName}: Generating relay recommendations`);

      // Call matchingService.generateRelayRecommendations with the parameters
      const recommendations = await this.matchingService.generateRelayRecommendations(relayParams);

      // Return the relay recommendations with 200 OK status
      res.status(StatusCodes.OK).json(recommendations);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Get active load recommendations for a driver
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  getActiveRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract driver_id from request parameters
      const { driver_id } = req.params;

      // Log the request to get active recommendations
      logger.info(`${this.controllerName}: Getting active recommendations for driver ${driver_id}`);

      // Call recommendationService.getActiveRecommendationsForDriver with driver ID
      const recommendations = await this.recommendationService.getActiveRecommendationsForDriver(driver_id, req.query);

      // Return the recommendations with 200 OK status
      res.status(StatusCodes.OK).json(recommendations);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Mark a recommendation as viewed by the driver
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  viewRecommendation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract recommendation_id from request parameters
      const { recommendation_id } = req.params;

      // Log the request to view recommendation
      logger.info(`${this.controllerName}: Viewing recommendation ${recommendation_id}`);

      // Call recommendationService.markRecommendationAsViewed with recommendation ID
      await this.recommendationService.markRecommendationAsViewed(recommendation_id);

      // Return success response with 200 OK status
      res.status(StatusCodes.OK).send();
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Get statistics about match performance and efficiency
   * @param req 
   * @param res 
   * @param next 
   * @returns Promise that resolves when the response is sent
   */
  getMatchStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract filter parameters from query parameters
      const filters = req.query;

      // Log the request to get match statistics
      logger.info(`${this.controllerName}: Getting match statistics`);

      // Call matchingService.getMatchStatistics with filters
      const statistics = await this.matchingService.getMatchStatistics(filters);

      // Return the statistics with 200 OK status
      res.status(StatusCodes.OK).json(statistics);
    } catch (error: any) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };
}