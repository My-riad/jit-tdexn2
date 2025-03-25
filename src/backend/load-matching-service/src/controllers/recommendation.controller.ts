import { Request, Response, NextFunction } from 'express'; // express ^4.18.2
import Joi from 'joi'; // joi ^17.9.2

import { RecommendationService } from '../services/recommendation.service';
import { MatchRecommendation, DeclineReason } from '../interfaces/match.interface';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';

/**
 * Controller class that handles HTTP requests related to load recommendations
 */
class RecommendationController {
  /**
   * Creates a new RecommendationController instance
   * @param recommendationService recommendationService
   */
  constructor(private readonly recommendationService: RecommendationService) {
    // Store the provided recommendation service for handling business logic
    this.recommendationService = recommendationService;
  }

  /**
   * Retrieves a specific recommendation by ID
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async getRecommendationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract recommendation ID from request parameters
      const recommendationId: string = req.params.id;

      // Call recommendationService.getRecommendationById with the ID
      const recommendation: MatchRecommendation = await this.recommendationService.getRecommendationById(recommendationId);

      // Return the recommendation with 200 OK status
      res.status(StatusCodes.OK).json(recommendation);
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }

  /**
   * Retrieves active recommendations for a specific driver
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async getActiveRecommendationsForDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID from request parameters
      const driverId: string = req.params.driverId;

      // Extract query parameters for filtering, sorting, and pagination
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string, 10) : undefined,
        sort: req.query.sort ? req.query.sort : undefined
      };

      // Call recommendationService.getActiveRecommendationsForDriver with driver ID and options
      const recommendations: MatchRecommendation[] = await this.recommendationService.getActiveRecommendationsForDriver(driverId, options);

      // Return the recommendations with 200 OK status
      res.status(StatusCodes.OK).json(recommendations);
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }

  /**
   * Creates a new recommendation based on a match
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async createRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract match ID, load details, and expiration minutes from request body
      const { matchId, loadDetails, expirationMinutes } = req.body;

      // Call recommendationService.createRecommendation with the extracted data
      const recommendation: MatchRecommendation = await this.recommendationService.createRecommendation(matchId, loadDetails, expirationMinutes);

      // Return the created recommendation with 201 Created status
      res.status(StatusCodes.CREATED).json(recommendation);
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }

  /**
   * Updates an existing recommendation
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async updateRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract recommendation ID from request parameters
      const recommendationId: string = req.params.id;

      // Extract update data from request body
      const updateData = req.body;

      // Determine the update type (accept, decline, expire) based on the data
      if (updateData.status === 'accepted') {
        // Call the appropriate service method based on the update type
        const recommendation = await this.recommendationService.markRecommendationAsAccepted(recommendationId);
        // Return the updated recommendation with 200 OK status
        return res.status(StatusCodes.OK).json(recommendation);
      } else if (updateData.status === 'declined') {
        // Extract decline reason from request body
        const { reason } = req.body;
        // Call the appropriate service method based on the update type
        const recommendation = await this.recommendationService.markRecommendationAsDeclined(recommendationId, reason);
        // Return the updated recommendation with 200 OK status
        return res.status(StatusCodes.OK).json(recommendation);
      } else if (updateData.status === 'expired') {
        // Call the appropriate service method based on the update type
        const recommendation = await this.recommendationService.deactivateRecommendation(recommendationId);
        // Return the updated recommendation with 200 OK status
        return res.status(StatusCodes.OK).json(recommendation);
      } else if (updateData.status === 'viewed') {
         // Call the appropriate service method based on the update type
         const recommendation = await this.recommendationService.markRecommendationAsViewed(recommendationId);
         // Return the updated recommendation with 200 OK status
         return res.status(StatusCodes.OK).json(recommendation);
      } else {
        throw new AppError('Invalid update operation', { code: ErrorCodes.VAL_INVALID_INPUT, statusCode: StatusCodes.BAD_REQUEST });
      }
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }

  /**
   * Marks a recommendation as viewed by the driver
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async markRecommendationAsViewed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract recommendation ID from request parameters
      const recommendationId: string = req.params.id;

      // Call recommendationService.markRecommendationAsViewed with the ID
      const recommendation: MatchRecommendation = await this.recommendationService.markRecommendationAsViewed(recommendationId);

      // Return the updated recommendation with 200 OK status
      res.status(StatusCodes.OK).json(recommendation);
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }

  /**
   * Marks a recommendation as accepted by the driver
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async markRecommendationAsAccepted(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract recommendation ID from request parameters
      const recommendationId: string = req.params.id;

      // Call recommendationService.markRecommendationAsAccepted with the ID
      const recommendation: MatchRecommendation = await this.recommendationService.markRecommendationAsAccepted(recommendationId);

      // Return the updated recommendation with 200 OK status
      res.status(StatusCodes.OK).json(recommendation);
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }

  /**
   * Marks a recommendation as declined by the driver
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async markRecommendationAsDeclined(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract recommendation ID from request parameters
      const recommendationId: string = req.params.id;

      // Extract decline reason from request body
      const { reason } = req.body;

      // Call recommendationService.markRecommendationAsDeclined with the ID and reason
      const recommendation: MatchRecommendation = await this.recommendationService.markRecommendationAsDeclined(recommendationId, reason);

      // Return the updated recommendation with 200 OK status
      res.status(StatusCodes.OK).json(recommendation);
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }

  /**
   * Deactivates a recommendation by marking it as expired
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async deactivateRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract recommendation ID from request parameters
      const recommendationId: string = req.params.id;

      // Call recommendationService.markRecommendationAsExpired with the ID
      const recommendation: MatchRecommendation = await this.recommendationService.markRecommendationAsExpired(recommendationId);

      // Return the updated recommendation with 200 OK status
      res.status(StatusCodes.OK).json(recommendation);
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }

  /**
   * Retrieves statistics about recommendation usage and performance
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  public async getRecommendationStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract filter parameters from request query
      const filters = req.query;

      // Call recommendationService.getRecommendationStatistics with the filters
      const statistics: object = await this.recommendationService.getRecommendationStatistics(filters);

      // Return the statistics with 200 OK status
      res.status(StatusCodes.OK).json(statistics);
    } catch (error) {
      // If an error occurs, pass it to the next middleware
      next(error);
    }
  }
}

// Define validation schemas for recommendation controller endpoints
const recommendationValidationSchemas = {
  getRecommendationById: {
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  },
  getActiveRecommendationsForDriver: {
    params: Joi.object({
      driverId: Joi.string().uuid().required()
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).optional(),
      skip: Joi.number().integer().min(0).optional(),
      sort: Joi.string().optional()
    })
  },
  createRecommendation: {
    body: Joi.object({
      matchId: Joi.string().uuid().required(),
      loadDetails: Joi.object().required(), // TODO: Define a more specific schema for loadDetails
      expirationMinutes: Joi.number().integer().min(1).max(1440).optional()
    })
  },
  updateRecommendation: {
    params: Joi.object({
      id: Joi.string().uuid().required()
    }),
    body: Joi.object({
      status: Joi.string().valid('accepted', 'declined', 'expired', 'viewed').required(),
      reason: Joi.string().valid(...Object.values(DeclineReason)).optional()
    }).required()
  },
  markRecommendationAsViewed: {
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  },
  markRecommendationAsDeclined: {
    params: Joi.object({
      id: Joi.string().uuid().required()
    }),
    body: Joi.object({
      reason: Joi.string().valid(...Object.values(DeclineReason)).required()
    })
  },
  deactivateRecommendation: {
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  },
  getRecommendationStatistics: {
    query: Joi.object({
      // TODO: Define specific filter parameters and their validation rules
    })
  }
};

export { RecommendationController, recommendationValidationSchemas };