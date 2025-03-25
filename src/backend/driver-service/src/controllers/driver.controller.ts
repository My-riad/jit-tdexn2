import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { DriverService } from '../services/driver.service';
import {
  Driver,
  DriverStatus,
  DriverCreationParams,
  DriverUpdateParams,
  DriverSearchParams
} from '../../../common/interfaces/driver.interface';
import logger from '../../../common/utils/logger';
import { handleError, AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * Controller for handling HTTP requests related to driver management
 */
export class DriverController {
  public controllerName: string = 'DriverController';

  constructor(private driverService: DriverService) {
    // Store the provided driver service for driver-related operations
    this.driverService = driverService;
  }

  /**
   * Get a driver by ID
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  getDriverById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Log the driver data request
      logger.info(`[${this.controllerName}] Getting driver data for driverId: ${driverId}`);

      // Call driverService.getDriverById to get the driver record
      const driver: Driver = await this.driverService.getDriverById(driverId);

      // Return the driver data in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId });
      next(error);
    }
  };

  /**
   * Get a driver by user ID
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  getDriverByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the user ID from the request parameters
      const userId: string = req.params.userId;

      // Log the driver data request by user ID
      logger.info(`[${this.controllerName}] Getting driver data for userId: ${userId}`);

      // Call driverService.getDriverByUserId to get the driver record
      const driver: Driver = await this.driverService.getDriverByUserId(userId);

      // Return the driver data in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { userId: req.params.userId });
      next(error);
    }
  };

  /**
   * Get all drivers for a specific carrier
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  getDriversByCarrierId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the carrier ID from the request parameters
      const carrierId: string = req.params.carrierId;
	  const page: number = parseInt(req.query.page as string) || 1;
      const limit: number = parseInt(req.query.limit as string) || 20;
      const filters: any = req.query.filters ? JSON.parse(req.query.filters as string) : {};
      const sortBy: string = req.query.sortBy as string || 'created_at';
      const sortDirection: 'asc' | 'desc' = (req.query.sortDirection as 'asc' | 'desc') || 'desc';

      // Log the drivers request by carrier ID
      logger.info(`[${this.controllerName}] Getting drivers for carrierId: ${carrierId}`);

      // Call driverService.getDriversByCarrierId with carrier ID and options
      const drivers: Driver[] = await this.driverService.getDriversByCarrierId(carrierId, {page, limit, filters, sortBy, sortDirection});

      // Return the array of driver records in the response with 200 OK status
      res.status(200).json(drivers);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { carrierId: req.params.carrierId });
      next(error);
    }
  };

  /**
   * Get a driver with all related details
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  getDriverWithDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Log the detailed driver data request
      logger.info(`[${this.controllerName}] Getting detailed driver data for driverId: ${driverId}`);

      // Call driverService.getDriverWithDetails to get the driver with all details
      const driver = await this.driverService.getDriverWithDetails(driverId);

      // Return the detailed driver data in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId });
      next(error);
    }
  };

  /**
   * Get a summary of driver information
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  getDriverSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Log the driver summary request
      logger.info(`[${this.controllerName}] Getting driver summary for driverId: ${driverId}`);

      // Call driverService.getDriverSummary to get the driver summary
      const driver = await this.driverService.getDriverSummary(driverId);

      // Return the driver summary in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId });
      next(error);
    }
  };

  /**
   * Create a new driver record
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  createDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver creation data from the request body
      const driverData: DriverCreationParams = req.body;

      // Log the driver creation request
      logger.info(`[${this.controllerName}] Creating new driver`);

      // Call driverService.createDriver with the driver data
      const driver: Driver = await this.driverService.createDriver(driverData);

      // Return the created driver record in the response with 201 Created status
      res.status(201).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverData: req.body });
      next(error);
    }
  };

  /**
   * Update an existing driver record
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  updateDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the driver update data from the request body
      const driverData: DriverUpdateParams = req.body;

      // Log the driver update request
      logger.info(`[${this.controllerName}] Updating driver with driverId: ${driverId}`);

      // Call driverService.updateDriver with driver ID and update data
      const driver: Driver = await this.driverService.updateDriver(driverId, driverData);

      // Return the updated driver record in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId, driverData: req.body });
      next(error);
    }
  };

  /**
   * Update a driver's status
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  updateDriverStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the status from the request body
      const status: DriverStatus = req.body.status;

      // Log the status update request
      logger.info(`[${this.controllerName}] Updating status for driverId: ${driverId} to status: ${status}`);

      // Call driverService.updateDriverStatus with driver ID and status
      const driver: Driver = await this.driverService.updateDriverStatus(driverId, status);

      // Return the updated driver record in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId, status: req.body.status });
      next(error);
    }
  };

  /**
   * Update a driver's efficiency score
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  updateDriverEfficiencyScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the score from the request body
      const score: number = req.body.score;

      // Log the efficiency score update request
      logger.info(`[${this.controllerName}] Updating efficiency score for driverId: ${driverId} to score: ${score}`);

      // Call driverService.updateDriverEfficiencyScore with driver ID and score
      const driver: Driver = await this.driverService.updateDriverEfficiencyScore(driverId, score);

      // Return the updated driver record in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId, score: req.body.score });
      next(error);
    }
  };

  /**
   * Deactivate a driver
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  deactivateDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Log the driver deactivation request
      logger.info(`[${this.controllerName}] Deactivating driver with driverId: ${driverId}`);

      // Call driverService.deactivateDriver with the driver ID
      const driver: Driver = await this.driverService.deactivateDriver(driverId);

      // Return the updated driver record in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId });
      next(error);
    }
  };

  /**
   * Activate a driver
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  activateDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Log the driver activation request
      logger.info(`[${this.controllerName}] Activating driver with driverId: ${driverId}`);

      // Call driverService.activateDriver with the driver ID
      const driver: Driver = await this.driverService.activateDriver(driverId);

      // Return the updated driver record in the response with 200 OK status
      res.status(200).json(driver);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId });
      next(error);
    }
  };

  /**
   * Search for drivers based on various criteria
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  searchDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the search parameters from the request query
      const searchParams: DriverSearchParams = req.query as any;

      // Log the driver search request
      logger.info(`[${this.controllerName}] Searching for drivers with parameters: ${JSON.stringify(searchParams)}`);

      // Call driverService.searchDrivers with the search parameters
      const searchResults = await this.driverService.searchDrivers(searchParams);

      // Return the search results with pagination info in the response with 200 OK status
      res.status(200).json(searchResults);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { searchParams: req.query });
      next(error);
    }
  };

  /**
   * Validate if a driver is eligible for a specific load
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise that resolves when the response is sent
   */
  validateDriverForLoad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the load details from the request body
      const loadDetails: any = req.body;

      // Log the driver validation request
      logger.info(`[${this.controllerName}] Validating driver ${driverId} for load`);

      // Call driverService.validateDriverForLoad with driver ID and load details
      const validationResult = await this.driverService.validateDriverForLoad(driverId, loadDetails);

      // Return the validation result in the response with 200 OK status
      res.status(200).json(validationResult);
    } catch (error: any) {
      // Catch any errors and pass them to the error handling middleware
      handleError(error, this.controllerName, { driverId: req.params.driverId, loadDetails: req.body });
      next(error);
    }
  };
}