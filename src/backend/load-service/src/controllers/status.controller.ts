// joi@^17.9.2
import Joi from 'joi';
// express@^4.18.2
import { Request, Response, NextFunction } from 'express';

import { LoadStatusService } from '../services/load-status.service';
import { LoadStatus, LoadStatusUpdateParams } from '../../../common/interfaces/load.interface';
import { validateBody, validateParams } from '../../../common/middleware/validation.middleware';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';

/**
 * Controller class that handles HTTP requests related to load status operations
 */
export class StatusController {
  /**
   * Creates a new StatusController instance
   * @param statusService The LoadStatusService instance
   */
  constructor(private statusService: LoadStatusService) {
    // Store the provided status service instance
    this.statusService = statusService;
  }

  /**
   * Returns the Joi validation schema for status update requests
   * @returns Joi.Schema: Validation schema for status updates
   */
  private getStatusValidationSchema(): Joi.Schema {
    // Define a Joi schema for validating status update requests
    const schema = Joi.object({
      // Require status field as a valid LoadStatus enum value
      status: Joi.string().valid(...Object.values(LoadStatus)).required(),
      // Make status_details optional as an object
      status_details: Joi.object().optional(),
      // Make latitude and longitude optional as numbers
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      // Make updated_by optional as a string
      updated_by: Joi.string().optional()
    });

    // Return the compiled schema
    return schema;
  }

  /**
   * Returns the Joi validation schema for load ID parameters
   * @returns Joi.Schema: Validation schema for load ID
   */
  private getLoadIdValidationSchema(): Joi.Schema {
    // Define a Joi schema for validating load ID parameters
    const schema = Joi.object({
      // Require loadId as a string in UUID format
      loadId: Joi.string().uuid().required()
    });

    // Return the compiled schema
    return schema;
  }

  /**
   * Handles request to get the complete status history for a load
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void>: Void promise that resolves when the response is sent
   */
  getStatusHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract loadId from request parameters
      const { loadId } = req.params;

      // Call statusService.getStatusHistory with the loadId
      const statusHistory = await this.statusService.getStatusHistory(loadId);

      // Return the status history with 200 OK status code
      res.status(StatusCodes.OK).json(statusHistory);
    } catch (error: any) {
      // Log and forward any errors to the error handling middleware
      logger.error('Error in getStatusHistory controller', { error: error.message, loadId: req.params.loadId });
      next(error);
    }
  };

  /**
   * Handles request to get a chronological timeline of status changes for a load
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void>: Void promise that resolves when the response is sent
   */
  getStatusTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract loadId from request parameters
      const { loadId } = req.params;

      // Call statusService.getStatusTimeline with the loadId
      const statusTimeline = await this.statusService.getStatusTimeline(loadId);

      // Return the status timeline with 200 OK status code
      res.status(StatusCodes.OK).json(statusTimeline);
    } catch (error: any) {
      // Log and forward any errors to the error handling middleware
      logger.error('Error in getStatusTimeline controller', { error: error.message, loadId: req.params.loadId });
      next(error);
    }
  };

  /**
   * Handles request to get the current status of a load
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void>: Void promise that resolves when the response is sent
   */
  getCurrentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract loadId from request parameters
      const { loadId } = req.params;

      // Call statusService.getCurrentStatus with the loadId
      const currentStatus = await this.statusService.getCurrentStatus(loadId);

      // If no status is found, return 404 Not Found
      if (!currentStatus) {
        logger.warn(`No current status found for load ${loadId}`);
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Current status not found' });
      }

      // Otherwise, return the current status with 200 OK status code
      res.status(StatusCodes.OK).json({ status: currentStatus });
    } catch (error: any) {
      // Log and forward any errors to the error handling middleware
      logger.error('Error in getCurrentStatus controller', { error: error.message, loadId: req.params.loadId });
      next(error);
    }
  };

  /**
   * Handles request to update the status of a load
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void>: Void promise that resolves when the response is sent
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract loadId from request parameters
      const { loadId } = req.params;

      // Extract status update data from request body
      const statusData: LoadStatusUpdateParams = req.body;

      // Call statusService.updateStatus with loadId and status data
      const updatedLoad = await this.statusService.updateStatus(loadId, statusData);

      // Return the updated load with 200 OK status code
      res.status(StatusCodes.OK).json(updatedLoad);
    } catch (error: any) {
      // Log and forward any errors to the error handling middleware
      logger.error('Error in updateStatus controller', { error: error.message, loadId: req.params.loadId, statusData: req.body });
      next(error);
    }
  };

  /**
   * Handles request to get counts of loads by status
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void>: Void promise that resolves when the response is sent
   */
  getStatusCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract filter options from request query parameters
      const filterOptions = req.query;

      // Call statusService.getStatusCounts with filter options
      const statusCounts = await this.statusService.getStatusCounts(filterOptions);

      // Return the status counts with 200 OK status code
      res.status(StatusCodes.OK).json(statusCounts);
    } catch (error: any) {
      // Log and forward any errors to the error handling middleware
      logger.error('Error in getStatusCounts controller', { error: error.message, filterOptions: req.query });
      next(error);
    }
  };

  /**
   * Handles request to get the rules for valid status transitions
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void>: Void promise that resolves when the response is sent
   */
  getStatusTransitionRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Call statusService.getStatusTransitionRules
      const transitionRules = this.statusService.getStatusTransitionRules();

      // Return the transition rules with 200 OK status code
      res.status(StatusCodes.OK).json(transitionRules);
    } catch (error: any) {
      // Log and forward any errors to the error handling middleware
      logger.error('Error in getStatusTransitionRules controller', { error: error.message });
      next(error);
    }
  };
}