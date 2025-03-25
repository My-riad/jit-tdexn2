import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import ScoreService from '../services/score.service';
import DriverScoreModel from '../models/driver-score.model';
import { DriverScore } from '../../../common/interfaces/driver.interface';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';

/**
 * Controller class for handling driver score-related HTTP requests
 */
export default class ScoreController {
  scoreService: ScoreService;

  /**
   * Creates a new ScoreController instance
   * @param scoreService The score service instance
   */
  constructor(scoreService: ScoreService) {
    this.scoreService = scoreService;

    // Bind all methods to ensure correct 'this' context when used as route handlers
    this.getDriverScore = this.getDriverScore.bind(this);
    this.getDriverScoreHistory = this.getDriverScoreHistory.bind(this);
    this.getDriverScoresByDateRange = this.getDriverScoresByDateRange.bind(this);
    this.calculateScoreForLoad = this.calculateScoreForLoad.bind(this);
    this.calculateHistoricalScore = this.calculateHistoricalScore.bind(this);
    this.updateDriverScore = this.updateDriverScore.bind(this);
    this.recalculateDriverScores = this.recalculateDriverScores.bind(this);
    this.getTopScores = this.getTopScores.bind(this);
  }

  /**
   * Retrieves the current score for a driver
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Resolves when the response is sent
   */
  async getDriverScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Validate that driverId is provided
      if (!driverId) {
        throw createError('Driver ID is required', { code: ErrorCodes.VAL_MISSING_FIELD });
      }

      // Call this.scoreService.getDriverScore with the driverId
      const score = await this.scoreService.getDriverScore(driverId);

      // If no score is found, return a 404 error
      if (!score) {
        throw createError(`Score not found for driver ID: ${driverId}`, { code: ErrorCodes.RES_DRIVER_NOT_FOUND, statusCode: 404 });
      }

      // Return the driver score as JSON response
      res.json(score);
    } catch (error) {
      // Catch and pass any errors to the error middleware
      next(error);
    }
  }

  /**
   * Retrieves the score history for a driver with pagination
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Resolves when the response is sent
   */
  async getDriverScoreHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Extract page and pageSize from query parameters with defaults
      const page = parseInt(req.query.page as string, 10) || 1;
      const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

      // Validate that driverId is provided
      if (!driverId) {
        throw createError('Driver ID is required', { code: ErrorCodes.VAL_MISSING_FIELD });
      }

      // Call this.scoreService.getDriverScoreHistory with driverId, page, and pageSize
      const scoreHistory = await this.scoreService.getDriverScoreHistory(driverId, page, pageSize);

      // Return the paginated score history as JSON response
      res.json(scoreHistory);
    } catch (error) {
      // Catch and pass any errors to the error middleware
      next(error);
    }
  }

  /**
   * Retrieves scores for a driver within a specific date range
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Resolves when the response is sent
   */
  async getDriverScoresByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Extract startDate and endDate from query parameters
      const { startDate, endDate } = req.query;

      // Validate that driverId, startDate, and endDate are provided
      if (!driverId || !startDate || !endDate) {
        throw createError('Driver ID, start date, and end date are required', { code: ErrorCodes.VAL_MISSING_FIELD });
      }

      // Convert startDate and endDate strings to Date objects
      const startDateObj = new Date(startDate as string);
      const endDateObj = new Date(endDate as string);

      // Call this.scoreService.getDriverScoresByDateRange with driverId, startDate, and endDate
      const scoreRecords = await this.scoreService.getDriverScoresByDateRange(driverId, startDateObj, endDateObj);

      // Return the score records as JSON response
      res.json(scoreRecords);
    } catch (error) {
      // Catch and pass any errors to the error middleware
      next(error);
    }
  }

  /**
   * Calculates a new score for a driver based on a completed load assignment
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Resolves when the response is sent
   */
  async calculateScoreForLoad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Extract loadAssignment and additionalMetrics from request body
      const { loadAssignment, additionalMetrics } = req.body;

      // Validate that driverId and loadAssignment are provided
      if (!driverId || !loadAssignment) {
        throw createError('Driver ID and load assignment are required', { code: ErrorCodes.VAL_MISSING_FIELD });
      }

      // Call this.scoreService.calculateScoreForLoad with driverId, loadAssignment, and additionalMetrics
      const calculatedScore = await this.scoreService.calculateScoreForLoad(driverId, loadAssignment, additionalMetrics);

      // Return the calculated score as JSON response
      res.status(201).json(calculatedScore); // 201 Created
    } catch (error) {
      // Catch and pass any errors to the error middleware
      next(error);
    }
  }

  /**
   * Calculates a historical score for a driver based on past performance
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Resolves when the response is sent
   */
  async calculateHistoricalScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Extract startDate and endDate from request body
      const { startDate, endDate } = req.body;

      // Validate that driverId, startDate, and endDate are provided
      if (!driverId || !startDate || !endDate) {
        throw createError('Driver ID, start date, and end date are required', { code: ErrorCodes.VAL_MISSING_FIELD });
      }

      // Convert startDate and endDate strings to Date objects
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      // Call this.scoreService.calculateHistoricalScore with driverId, startDate, and endDate
      const historicalScore = await this.scoreService.calculateHistoricalScore(driverId, startDateObj, endDateObj);

      // Return the calculated historical score as JSON response
      res.status(200).json(historicalScore);
    } catch (error) {
      // Catch and pass any errors to the error middleware
      next(error);
    }
  }

  /**
   * Updates a driver's score with new component scores
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Resolves when the response is sent
   */
  async updateDriverScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverId from request parameters
      const { driverId } = req.params;

      // Extract scoreData from request body
      const { scoreData } = req.body;

      // Validate that driverId and scoreData are provided
      if (!driverId || !scoreData) {
        throw createError('Driver ID and score data are required', { code: ErrorCodes.VAL_MISSING_FIELD });
      }

      // Validate that scoreData contains valid component scores
      if (
        typeof scoreData.empty_miles_score !== 'number' ||
        typeof scoreData.network_contribution_score !== 'number' ||
        typeof scoreData.on_time_score !== 'number' ||
        typeof scoreData.hub_utilization_score !== 'number' ||
        typeof scoreData.fuel_efficiency_score !== 'number'
      ) {
        throw createError('Score data must contain valid component scores', { code: ErrorCodes.VAL_INVALID_INPUT });
      }

      // Call this.scoreService.updateDriverScore with driverId and scoreData
      const updatedScore = await this.scoreService.updateDriverScore(driverId, scoreData);

      // Return the updated score as JSON response
      res.json(updatedScore);
    } catch (error) {
      // Catch and pass any errors to the error middleware
      next(error);
    }
  }

  /**
   * Recalculates scores for multiple drivers, typically after algorithm updates
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Resolves when the response is sent
   */
  async recalculateDriverScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driverIds array from request body
      const { driverIds } = req.body;

      // Validate that driverIds is provided and is an array
      if (!driverIds || !Array.isArray(driverIds)) {
        throw createError('Driver IDs array is required', { code: ErrorCodes.VAL_MISSING_FIELD });
      }

      // Call this.scoreService.recalculateDriverScores with driverIds
      const updatedScores = await this.scoreService.recalculateDriverScores(driverIds);

      // Return the updated scores as JSON response
      res.json(updatedScores);
    } catch (error) {
      // Catch and pass any errors to the error middleware
      next(error);
    }
  }

  /**
   * Retrieves the top N driver scores, optionally filtered by region
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Resolves when the response is sent
   */
  async getTopScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract limit from query parameters with a default value
      const limit = parseInt(req.query.limit as string, 10) || 10;

      // Extract region from query parameters (optional)
      const region = req.query.region as string | undefined;

      // Call DriverScoreModel.getTopScores with limit and region
      const topScores = await DriverScoreModel.getTopScores(limit, region);

      // Return the top scores as JSON response
      res.json(topScores);
    } catch (error) {
      // Catch and pass any errors to the error middleware
      next(error);
    }
  }
}