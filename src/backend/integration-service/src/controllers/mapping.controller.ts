import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2
import { MappingService } from '../services/mapping.service';
import { Position } from '@common/interfaces/position.interface';
import { AppError } from '@common/utils/error-handler';
import logger from '@common/utils/logger';

/**
 * Controller class that handles HTTP requests for mapping and geospatial operations
 */
export class MappingController {
  /**
   * Initializes the mapping controller with the mapping service
   * @param mappingService 
   */
  constructor(private mappingService: MappingService) {
    this.mappingService = mappingService;
    logger.info('MappingController initialized');
  }

  /**
   * Handles requests to convert an address into geographic coordinates
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async geocode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract address and provider options from request body
      const { address, provider } = req.body;

      // Call the mapping service's geocode method with the address and options
      const geocodingResult = await this.mappingService.geocode(address, { provider });

      // Return the geocoding result as JSON response
      res.json(geocodingResult);
      logger.info('Geocoding request successful', { address, provider });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to convert geographic coordinates into a human-readable address
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async reverseGeocode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract latitude, longitude, and provider options from request body
      const { latitude, longitude, provider } = req.body;

      // Call the mapping service's reverseGeocode method with the coordinates and options
      const reverseGeocodingResult = await this.mappingService.reverseGeocode(latitude, longitude, { provider });

      // Return the reverse geocoding result as JSON response
      res.json(reverseGeocodingResult);
      logger.info('Reverse geocoding request successful', { latitude, longitude, provider });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to calculate directions between an origin and destination
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async getDirections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract directions request parameters and provider options from request body
      const { origin, destination, waypoints, profile, alternatives, instructions, language, steps, overview, annotations, provider } = req.body;

      // Call the mapping service's getDirections method with the request and options
      const directionsResult = await this.mappingService.getDirections({ origin, destination, waypoints, profile, alternatives, instructions, language, steps, overview, annotations }, { provider });

      // Return the directions result as JSON response
      res.json(directionsResult);
      logger.info('Get directions request successful', { origin, destination, provider });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to calculate travel distance and time for a matrix of origins and destinations
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async getDistanceMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract distance matrix request parameters and provider options from request body
      const { origins, destinations, profile, provider } = req.body;

      // Call the mapping service's getDistanceMatrix method with the request and options
      const distanceMatrixResult = await this.mappingService.getDistanceMatrix({ origins, destinations, profile }, { provider });

      // Return the distance matrix result as JSON response
      res.json(distanceMatrixResult);
      logger.info('Get distance matrix request successful', { origins, destinations, provider });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to validate an address by geocoding it and checking the result quality
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async validateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract address and provider options from request body
      const { address, provider } = req.body;

      // Call the mapping service's validateAddress method with the address and options
      const addressValidationResult = await this.mappingService.validateAddress(address, { provider });

      // Return the address validation result as JSON response
      res.json(addressValidationResult);
      logger.info('Validate address request successful', { address, provider });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to estimate travel time between two points considering traffic conditions
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async estimateTravelTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract origin, destination, travel options, and provider options from request body
      const { origin, destination, options, provider } = req.body;

      // Call the mapping service's estimateTravelTime method with the parameters
      const travelTimeResult = await this.mappingService.estimateTravelTime(origin, destination, options, { provider });

      // Return the travel time estimation result as JSON response
      res.json(travelTimeResult);
      logger.info('Estimate travel time request successful', { origin, destination, provider });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to optimize the order of waypoints to minimize travel time or distance
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async optimizeWaypoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract waypoint optimization request parameters and provider options from request body
      const { origin, destination, waypoints, profile, provider } = req.body;

      // Call the mapping service's optimizeWaypoints method with the request and options
      const waypointOptimizationResult = await this.mappingService.optimizeWaypoints({ origin, destination, waypoints, profile }, { provider });

      // Return the waypoint optimization result as JSON response
      res.json(waypointOptimizationResult);
      logger.info('Optimize waypoints request successful', { origin, destination, waypoints, provider });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to find a route suitable for commercial trucks considering height, weight, and other restrictions
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async findTruckFriendlyRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract truck route request parameters and provider options from request body
      const { origin, destination, truckHeight, truckWidth, truckLength, truckWeight, profile, provider } = req.body;

      // Call the mapping service's findTruckFriendlyRoute method with the request and options
      const truckRouteResult = await this.mappingService.findTruckFriendlyRoute({ origin, destination, truckHeight, truckWidth, truckLength, truckWeight, profile }, { provider });

      // Return the truck route result as JSON response
      res.json(truckRouteResult);
      logger.info('Find truck friendly route request successful', { origin, destination, truckHeight, truckWidth, truckLength, truckWeight, provider });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to get isochrone (time-based travel distance) polygons for a location
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async getIsochrone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract isochrone request parameters from request body
      const { latitude, longitude, intervals, profile, contours_meters, polygons } = req.body;

      // Call the mapping service's getIsochrone method with the request
      const isochroneResult = await this.mappingService.getIsochrone({ latitude, longitude, intervals, profile, contours_meters, polygons });

      // Return the isochrone result as JSON response
      res.json(isochroneResult);
      logger.info('Get isochrone request successful', { latitude, longitude, intervals, profile });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to get information about available mapping providers
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise that resolves when the response is sent
   */
  async getProviderInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Call the mapping service's getAvailableProviders method
      const providerInfo = this.mappingService.getAvailableProviders();

      // Return the provider information as JSON response
      res.json(providerInfo);
      logger.info('Get provider info request successful');
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }
}

// Define Joi validation schema for geocode request body
export const geocodeSchema = Joi.object({
  address: Joi.string().required(),
  provider: Joi.string().optional(),
});

// Define Joi validation schema for reverse geocode request body
export const reverseGeocodeSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  provider: Joi.string().optional(),
});

// Define Joi validation schema for directions request body
export const directionsSchema = Joi.object({
  origin: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  destination: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  waypoints: Joi.array().items(Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  })).optional(),
  profile: Joi.string().valid('driving', 'walking', 'cycling', 'trucking').optional(),
  alternatives: Joi.boolean().optional(),
  instructions: Joi.string().valid('text', 'html').optional(),
  language: Joi.string().optional(),
  steps: Joi.boolean().optional(),
  overview: Joi.string().valid('full', 'simplified', 'false').optional(),
  annotations: Joi.string().valid('duration', 'distance', 'speed', 'congestion').optional(),
  provider: Joi.string().optional(),
});

// Define Joi validation schema for distance matrix request body
export const distanceMatrixSchema = Joi.object({
  origins: Joi.array().items(Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  })).required(),
  destinations: Joi.array().items(Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  })).required(),
  profile: Joi.string().valid('driving', 'walking', 'cycling').optional(),
  provider: Joi.string().optional(),
});

// Define Joi validation schema for address validation request body
export const validateAddressSchema = Joi.object({
  address: Joi.string().required(),
  provider: Joi.string().optional(),
});

// Define Joi validation schema for travel time estimation request body
export const travelTimeSchema = Joi.object({
  origin: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  destination: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  options: Joi.object({
    departureTime: Joi.date().optional(),
    profile: Joi.string().valid('driving-traffic', 'driving', 'walking', 'cycling').optional()
  }).optional(),
  provider: Joi.string().optional(),
});

// Define Joi validation schema for waypoint optimization request body
export const waypointOptimizationSchema = Joi.object({
  origin: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  destination: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  waypoints: Joi.array().items(Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  })).min(2).required(),
  profile: Joi.string().valid('driving', 'walking', 'cycling').optional(),
  provider: Joi.string().optional(),
});

// Define Joi validation schema for truck route request body
export const truckRouteSchema = Joi.object({
  origin: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  destination: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  truckHeight: Joi.number().required(),
  truckWidth: Joi.number().required(),
  truckLength: Joi.number().required(),
  truckWeight: Joi.number().required(),
  profile: Joi.string().valid('driving-traffic', 'driving').optional(),
  provider: Joi.string().optional(),
});

// Define Joi validation schema for isochrone request body
export const isochroneSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  intervals: Joi.array().items(Joi.number()).required(),
  profile: Joi.string().valid('driving', 'walking', 'cycling').optional(),
  contours_meters: Joi.array().items(Joi.number()).optional(),
  polygons: Joi.boolean().optional(),
});