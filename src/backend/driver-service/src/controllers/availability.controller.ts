import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import {
  AvailabilityService,
} from '../services/availability.service';
import {
  DriverAvailability,
  DriverStatus,
  HOSStatus,
} from '../../../common/interfaces/driver.interface';
import logger from '../../../common/utils/logger';
import { handleError, AppError } from '../../../common/utils/error-handler';

/**
 * Controller responsible for handling HTTP requests related to driver availability
 */
export class AvailabilityController {
  private readonly controllerName: string = 'AvailabilityController';

  /**
   * Creates a new AvailabilityController instance
   * @param availabilityService The availability service for availability-related operations
   */
  constructor(private availabilityService: AvailabilityService) {
    this.controllerName = 'AvailabilityController';
  }

  /**
   * Get the current availability status for a driver
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async getDriverAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Log the availability data request
      logger.info(`Getting availability data for driver: ${driverId}`, { controller: this.controllerName, method: 'getDriverAvailability' });

      // Call availabilityService.getDriverAvailability to get the availability record
      const availability: DriverAvailability = await this.availabilityService.getDriverAvailability(driverId);

      // Return the availability data in the response with 200 OK status
      res.status(200).json(availability);
    } catch (error: any) {
      // Log the error
      logger.error(`Error getting driver availability`, { controller: this.controllerName, method: 'getDriverAvailability', error: error.message });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Update a driver's availability with new data
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async updateDriverAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the availability data from the request body
      const availabilityData: DriverAvailability = req.body;

      // Log the availability update request
      logger.info(`Updating availability for driver: ${driverId}`, { controller: this.controllerName, method: 'updateDriverAvailability', availabilityData });

      // Call availabilityService.updateDriverAvailability to update the record
      const updatedAvailability: DriverAvailability = await this.availabilityService.updateDriverAvailability(driverId, availabilityData);

      // Return the updated availability data in the response with 200 OK status
      res.status(200).json(updatedAvailability);
    } catch (error: any) {
      // Log the error
      logger.error(`Error updating driver availability`, { controller: this.controllerName, method: 'updateDriverAvailability', error: error.message, availabilityData: req.body });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Update a driver's availability status
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async updateDriverStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the status from the request body
      const status: DriverStatus = req.body.status;

      // Log the status update request
      logger.info(`Updating status for driver: ${driverId} to ${status}`, { controller: this.controllerName, method: 'updateDriverStatus', status });

      // Call availabilityService.updateDriverStatus to update the status
      const updatedAvailability: DriverAvailability = await this.availabilityService.updateDriverStatus(driverId, status);

      // Return the updated availability data in the response with 200 OK status
      res.status(200).json(updatedAvailability);
    } catch (error: any) {
      // Log the error
      logger.error(`Error updating driver status`, { controller: this.controllerName, method: 'updateDriverStatus', error: error.message, status: req.body.status });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Update a driver's current location
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async updateDriverLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the location object from the request body
      const location: { latitude: number; longitude: number } = req.body;

      // Log the location update request
      logger.info(`Updating location for driver: ${driverId}`, { controller: this.controllerName, method: 'updateDriverLocation', location });

      // Call availabilityService.updateDriverLocation to update the location
      const updatedAvailability: DriverAvailability = await this.availabilityService.updateDriverLocation(driverId, location);

      // Return the updated availability data in the response with 200 OK status
      res.status(200).json(updatedAvailability);
    } catch (error: any) {
      // Log the error
      logger.error(`Error updating driver location`, { controller: this.controllerName, method: 'updateDriverLocation', error: error.message, location: req.body });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Update a driver's Hours of Service data
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async updateDriverHOSStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the HOS data from the request body
      const hosData: {
        status: DriverStatus;
        driving_minutes_remaining: number;
        duty_minutes_remaining: number;
        cycle_minutes_remaining: number;
      } = req.body;

      // Log the HOS update request
      logger.info(`Updating HOS for driver: ${driverId}`, { controller: this.controllerName, method: 'updateDriverHOSStatus', hosData });

      // Call availabilityService.updateDriverHOS to update the HOS data
      const updatedAvailability: DriverAvailability = await this.availabilityService.updateDriverHOS(driverId, hosData);

      // Return the updated availability data in the response with 200 OK status
      res.status(200).json(updatedAvailability);
    } catch (error: any) {
      // Log the error
      logger.error(`Error updating HOS for driver`, { controller: this.controllerName, method: 'updateDriverHOSStatus', error: error.message, hosData: req.body });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Update a driver's availability time window
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async updateDriverTimeWindow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the available_from and available_until dates from the request body
      const { available_from, available_until } = req.body;

      // Log the time window update request
      logger.info(`Updating time window for driver: ${driverId}`, { controller: this.controllerName, method: 'updateDriverTimeWindow', available_from, available_until });

      // Call availabilityService.updateDriverTimeWindow to update the time window
      const updatedAvailability: DriverAvailability = await this.availabilityService.updateDriverTimeWindow(driverId, available_from, available_until);

      // Return the updated availability data in the response with 200 OK status
      res.status(200).json(updatedAvailability);
    } catch (error: any) {
      // Log the error
      logger.error(`Error updating time window for driver`, { controller: this.controllerName, method: 'updateDriverTimeWindow', error: error.message, available_from: req.body.available_from, available_until: req.body.available_until });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Update a driver's maximum distance preference
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async updateMaxDistance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the max_distance value from the request body
      const { max_distance } = req.body;

      // Log the max distance update request
      logger.info(`Updating max distance for driver: ${driverId}`, { controller: this.controllerName, method: 'updateMaxDistance', max_distance });

      // Call availabilityService.updateMaxDistance to update the max distance
      const updatedAvailability: DriverAvailability = await this.availabilityService.updateDriverTimeWindow(driverId, max_distance);

      // Return the updated availability data in the response with 200 OK status
      res.status(200).json(updatedAvailability);
    } catch (error: any) {
      // Log the error
      logger.error(`Error updating max distance for driver`, { controller: this.controllerName, method: 'updateMaxDistance', error: error.message, max_distance: req.body.max_distance });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Find available drivers based on various criteria
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async findAvailableDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the search criteria from the request query parameters
      const criteria: any = req.query;

      // Log the available drivers search request
      logger.info(`Finding available drivers`, { controller: this.controllerName, method: 'findAvailableDrivers', criteria });

      // Call availabilityService.findAvailableDrivers with the provided criteria
      const availabilityRecords: DriverAvailability[] = await this.availabilityService.findAvailableDrivers(criteria);

      // Return the array of availability records in the response with 200 OK status
      res.status(200).json(availabilityRecords);
    } catch (error: any) {
      // Log the error
      logger.error(`Error finding available drivers`, { controller: this.controllerName, method: 'findAvailableDrivers', error: error.message, criteria: req.query });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Find available drivers near a specific location
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async findDriversNearLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the location coordinates and radius from the request query parameters
      const latitude: number = parseFloat(req.query.latitude as string);
      const longitude: number = parseFloat(req.query.longitude as string);
      const radiusMiles: number = parseFloat(req.query.radius as string);

      // Extract the optional status parameter from the request query
      const status: DriverStatus = req.query.status as DriverStatus;

      // Log the nearby drivers search request
      logger.info(`Finding drivers near location: ${latitude}, ${longitude} within ${radiusMiles} miles`, { controller: this.controllerName, method: 'findDriversNearLocation', latitude, longitude, radiusMiles, status });

      // Call availabilityService.findDriversNearLocation with the parameters
      const availabilityRecords: DriverAvailability[] = await this.availabilityService.findDriversNearLocation({ latitude, longitude }, radiusMiles, status);

      // Return the array of availability records in the response with 200 OK status
      res.status(200).json(availabilityRecords);
    } catch (error: any) {
      // Log the error
      logger.error(`Error finding drivers near location`, { controller: this.controllerName, method: 'findDriversNearLocation', error: error.message, latitude: req.query.latitude, longitude: req.query.longitude, radiusMiles: req.query.radius, status: req.query.status });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Check if a driver is available for a specific load
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async checkDriverAvailabilityForLoad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the load details from the request body
      const loadDetails: {
        origin: { latitude: number; longitude: number };
        destination: { latitude: number; longitude: number };
        pickup_time: Date;
      } = req.body;

      // Log the availability check request
      logger.info(`Checking availability for driver: ${driverId} for load`, { controller: this.controllerName, method: 'checkDriverAvailabilityForLoad', driverId, loadDetails });

      // Call availabilityService.checkDriverAvailabilityForLoad with driver ID and load details
      const availabilityResult: { available: boolean; reasons?: string[] } = await this.availabilityService.checkDriverAvailabilityForLoad(driverId, loadDetails);

      // Return the availability result in the response with 200 OK status
      res.status(200).json(availabilityResult);
    } catch (error: any) {
      // Log the error
      logger.error(`Error checking driver availability for load`, { controller: this.controllerName, method: 'checkDriverAvailabilityForLoad', error: error.message, driverId, loadDetails: req.body });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }

  /**
   * Predict a driver's availability at a future point in time
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async predictDriverAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract the driver ID from the request parameters
      const driverId: string = req.params.driverId;

      // Extract the future time from the request query parameters
      const futureTime: Date = new Date(req.query.futureTime as string);

      // Log the availability prediction request
      logger.info(`Predicting availability for driver: ${driverId} at ${futureTime}`, { controller: this.controllerName, method: 'predictDriverAvailability', driverId, futureTime });

      // Call availabilityService.predictDriverAvailability with driver ID and future time
      const predictedAvailability: DriverAvailability = await this.availabilityService.predictDriverAvailability(driverId, futureTime);

      // Return the predicted availability in the response with 200 OK status
      res.status(200).json(predictedAvailability);
    } catch (error: any) {
      // Log the error
      logger.error(`Error predicting availability for driver`, { controller: this.controllerName, method: 'predictDriverAvailability', error: error.message, driverId, futureTime: req.query.futureTime });

      // Pass any errors to the error handling middleware
      next(handleError(error, this.controllerName));
    }
  }
}