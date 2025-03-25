import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { HOSService } from '../services/hos.service';
import { DriverHOS, HOSStatus } from '../../../common/interfaces/driver.interface';
import { DriverHOSModel } from '../models/driver-hos.model';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';

/**
 * Controller for handling Hours of Service (HOS) related HTTP requests
 */
export class HOSController {
  /**
   * Creates a new HOSController instance
   * @param hosService The HOS service for handling business logic
   */
  constructor(private hosService: HOSService) {
    this.hosService = hosService;
  }

  /**
   * Get the current HOS status for a driver
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async getDriverHOS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Call hosService.getDriverHOS with the driver_id
      const hosData = await this.hosService.getDriverHOS(driver_id);

      // LD3: Return the HOS data with 200 OK status
      res.status(StatusCodes.OK).json(hosData);
    } catch (error: any) {
      // LD4: Catch and handle any errors with appropriate status codes
      logger.error('Error getting driver HOS', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.NOT_FOUND, statusCode: StatusCodes.NOT_FOUND }));
    }
  }

  /**
   * Get HOS history for a driver within a time range
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async getDriverHOSHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Extract startDate and endDate from query parameters
      const { startDate, endDate } = req.query;

      // LD3: Parse and validate date parameters
      const parsedStartDate = new Date(startDate as string);
      const parsedEndDate = new Date(endDate as string);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        throw createError('Invalid date format. Please use a valid ISO date string.', { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST });
      }

      // LD4: Call hosService.getDriverHOSHistory with driver_id and date range
      const hosHistory = await this.hosService.getDriverHOSHistory(driver_id, parsedStartDate, parsedEndDate);

      // LD5: Return the HOS history with 200 OK status
      res.status(StatusCodes.OK).json(hosHistory);
    } catch (error: any) {
      // LD6: Catch and handle any errors with appropriate status codes
      logger.error('Error getting driver HOS history', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.NOT_FOUND, statusCode: StatusCodes.NOT_FOUND }));
    }
  }

  /**
   * Update a driver's HOS status with new data
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async updateDriverHOS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Extract HOS data from request body
      const hosData: DriverHOS = req.body;

      // LD3: Call hosService.updateDriverHOS with driver_id and HOS data
      const updatedHosData = await this.hosService.updateDriverHOS(driver_id, hosData);

      // LD4: Return the updated HOS data with 200 OK status
      res.status(StatusCodes.OK).json(updatedHosData);
    } catch (error: any) {
      // LD5: Catch and handle any errors with appropriate status codes
      logger.error('Error updating driver HOS', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST }));
    }
  }

  /**
   * Fetch the latest HOS data from a driver's ELD provider
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async syncDriverHOSFromELD(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Call hosService.fetchHOSFromELD with driver_id
      const fetchedHosData = await this.hosService.fetchHOSFromELD(driver_id);

      // LD3: Return the fetched HOS data with 200 OK status
      res.status(StatusCodes.OK).json(fetchedHosData);
    } catch (error: any) {
      // LD4: Catch and handle any errors with appropriate status codes, especially integration errors
      logger.error('Error syncing driver HOS from ELD', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.INTEGRATION_ERROR, statusCode: StatusCodes.INTERNAL_SERVER_ERROR }));
    }
  }

  /**
   * Check if a driver is compliant with HOS regulations
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async checkHOSCompliance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Call hosService.checkHOSCompliance with driver_id
      const complianceResult = await this.hosService.checkHOSCompliance(driver_id);

      // LD3: Return the compliance status and any violations with 200 OK status
      res.status(StatusCodes.OK).json(complianceResult);
    } catch (error: any) {
      // LD4: Catch and handle any errors with appropriate status codes
      logger.error('Error checking HOS compliance', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST }));
    }
  }

  /**
   * Calculate available driving hours for a specific trip
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async calculateAvailableHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Extract estimatedDrivingMinutes from query parameters
      const { estimatedDrivingMinutes } = req.query;

      // LD3: Validate that estimatedDrivingMinutes is a positive number
      const parsedMinutes = Number(estimatedDrivingMinutes);
      if (isNaN(parsedMinutes) || parsedMinutes <= 0) {
        throw createError('Invalid estimatedDrivingMinutes. Please provide a positive number.', { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST });
      }

      // LD4: Call hosService.calculateAvailableHours with driver_id and estimatedDrivingMinutes
      const availability = await this.hosService.calculateAvailableHours(driver_id, parsedMinutes);

      // LD5: Return the availability status and remaining minutes with 200 OK status
      res.status(StatusCodes.OK).json(availability);
    } catch (error: any) {
      // LD6: Catch and handle any errors with appropriate status codes
      logger.error('Error calculating available hours', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST }));
    }
  }

  /**
   * Get a summary of a driver's duty status over a time period
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async getDriverDutyStatusSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Extract startDate and endDate from query parameters
      const { startDate, endDate } = req.query;

      // LD3: Parse and validate date parameters
      const parsedStartDate = new Date(startDate as string);
      const parsedEndDate = new Date(endDate as string);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        throw createError('Invalid date format. Please use a valid ISO date string.', { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST });
      }

      // LD4: Call DriverHOSModel.getDriverDutyStatusSummary with driver_id and date range
      const dutyStatusSummary = await DriverHOSModel.getDriverDutyStatusSummary(driver_id, parsedStartDate, parsedEndDate);

      // LD5: Return the duty status summary with 200 OK status
      res.status(StatusCodes.OK).json(dutyStatusSummary);
    } catch (error: any) {
      // LD6: Catch and handle any errors with appropriate status codes
      logger.error('Error getting driver duty status summary', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.NOT_FOUND, statusCode: StatusCodes.NOT_FOUND }));
    }
  }

  /**
   * Predict a driver's HOS availability at a future point in time
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async predictHOSAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Extract targetDate from query parameters
      const { targetDate } = req.query;

      // LD3: Parse and validate the target date
      const parsedTargetDate = new Date(targetDate as string);

      if (isNaN(parsedTargetDate.getTime())) {
        throw createError('Invalid date format. Please use a valid ISO date string.', { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST });
      }

      // LD4: Call hosService.predictAvailableHours with driver_id and targetDate
      const predictedAvailability = await this.hosService.predictAvailableHours(driver_id, parsedTargetDate);

      // LD5: Return the predicted available hours with 200 OK status
      res.status(StatusCodes.OK).json(predictedAvailability);
    } catch (error: any) {
      // LD6: Catch and handle any errors with appropriate status codes
      logger.error('Error predicting HOS availability', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST }));
    }
  }

  /**
   * Validate if a driver has sufficient HOS to complete a load
   * @param req express.Request
   * @param res express.Response
   * @param next express.NextFunction
   * @returns Promise<void> Promise that resolves when the response is sent
   */
  async validateHOSForLoad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract driver_id from request parameters
      const { driver_id } = req.params;

      // LD2: Extract load details from request body
      const loadDetails = req.body;

      // LD3: Call hosService.validateHOSForLoad with driver_id and load details
      const validationResult = await this.hosService.validateHOSForLoad(driver_id, loadDetails);

      // LD4: Return the validation result with 200 OK status
      res.status(StatusCodes.OK).json(validationResult);
    } catch (error: any) {
      // LD5: Catch and handle any errors with appropriate status codes
      logger.error('Error validating HOS for load', { error: error.message, stack: error.stack });
      next(createError(error.message, { code: ErrorCodes.INVALID_REQUEST, statusCode: StatusCodes.BAD_REQUEST }));
    }
  }
}