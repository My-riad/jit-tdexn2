import { Request, Response, NextFunction, Router } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2
import { GeofenceService } from '../services/geofence.service';
import { GeofenceModel } from '../models/geofence.model';
import { GeofenceEventModel } from '../models/geofence-event.model';
import { EntityType, GeofenceEventType } from '../../common/interfaces/position.interface';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validation.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/utils/error-handler';
import logger from '../../common/utils/logger';
import { ErrorCodes } from '../../common/constants/error-codes';
import { StatusCodes } from '../../common/constants/status-codes';

/**
 * Controller class that handles HTTP requests related to geofences
 */
export class GeofenceController {
  public geofenceService: GeofenceService;
  public router: Router;

  /**
   * Creates a new GeofenceController instance
   * @param geofenceService - The geofence service
   */
  constructor(geofenceService: GeofenceService) {
    // Initialize the geofence service
    this.geofenceService = geofenceService;

    // Initialize the Express router
    this.router = Router();

    // Set up route handlers with validation and authentication middleware
    this.initializeRoutes();

    // Log the initialization of the controller
    logger.info('GeofenceController initialized');
  }

  /**
   * Sets up all route handlers for geofence operations
   */
  public initializeRoutes(): void {
    // Set up POST /geofences route for creating geofences
    this.router.post(
      '/geofences',
      authenticate,
      validateBody(this.createGeofenceSchema()),
      this.createGeofence.bind(this)
    );

    // Set up GET /geofences route for listing geofences
    this.router.get(
      '/geofences',
      authenticate,
      this.getGeofences.bind(this)
    );

    // Set up GET /geofences/:geofenceId route for retrieving a specific geofence
    this.router.get(
      '/geofences/:geofenceId',
      authenticate,
      validateParams(this.geofenceParamsSchema()),
      this.getGeofence.bind(this)
    );

    // Set up PUT /geofences/:geofenceId route for updating a geofence
    this.router.put(
      '/geofences/:geofenceId',
      authenticate,
      validateParams(this.geofenceParamsSchema()),
      validateBody(this.updateGeofenceSchema()),
      this.updateGeofence.bind(this)
    );

    // Set up DELETE /geofences/:geofenceId route for deleting a geofence
    this.router.delete(
      '/geofences/:geofenceId',
      authenticate,
      validateParams(this.geofenceParamsSchema()),
      this.deleteGeofence.bind(this)
    );

    // Set up GET /geofences/entity/:entityId route for retrieving geofences by entity
    this.router.get(
      '/geofences/entity/:entityId',
      authenticate,
      validateParams(this.entityParamsSchema()),
      this.getGeofencesByEntity.bind(this)
    );

    // Set up GET /geofences/nearby route for retrieving nearby geofences
    this.router.get(
      '/geofences/nearby',
      authenticate,
      validateQuery(this.nearbyQuerySchema()),
      this.getNearbyGeofences.bind(this)
    );

    // Set up GET /geofences/:geofenceId/events route for retrieving geofence events
    this.router.get(
      '/geofences/:geofenceId/events',
      authenticate,
      validateParams(this.geofenceParamsSchema()),
      validateQuery(this.eventQuerySchema()),
      this.getGeofenceEvents.bind(this)
    );

    // Set up POST /geofences/:geofenceId/events route for creating a geofence event
    this.router.post(
      '/geofences/:geofenceId/events',
      authenticate,
      validateParams(this.geofenceParamsSchema()),
      validateBody(this.createEventSchema()),
      this.createGeofenceEvent.bind(this)
    );

    // Set up GET /geofences/events/entity/:entityId route for retrieving events by entity
    this.router.get(
      '/geofences/events/entity/:entityId',
      authenticate,
      validateParams(this.entityParamsSchema()),
      validateQuery(this.eventQuerySchema()),
      this.getEventsByEntity.bind(this)
    );
  }

  /**
   * Handles POST requests to create a new geofence
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async createGeofence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract geofence data from request body
      const geofenceData = req.body;

      // Call geofenceService.createGeofence with the data
      const createdGeofence = await this.geofenceService.createGeofence(geofenceData);

      // Return 201 Created with the created geofence
      res.status(StatusCodes.CREATED).json(createdGeofence);

      // Log the successful creation
      logger.info(`Geofence created successfully: ${createdGeofence.geofence_id}`);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles GET requests to list geofences with optional filtering
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async getGeofences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters for filtering (entityType, activeOnly)
      const { entityType, activeOnly } = req.query;
      let geofences: GeofenceModel[];

      // Call geofenceService.getGeofencesByEntityType if entityType is provided
      if (entityType) {
        geofences = await this.geofenceService.getGeofencesByEntityType(
          entityType as EntityType,
          activeOnly === 'true'
        );
      } else {
        // Otherwise, get all geofences
        geofences = await GeofenceModel.query();
      }

      // Return 200 OK with the list of geofences
      res.status(StatusCodes.OK).json(geofences);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles GET requests to retrieve a specific geofence by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async getGeofence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract geofenceId from request parameters
      const { geofenceId } = req.params;

      // Call geofenceService.getGeofence with the ID
      const geofence = await this.geofenceService.getGeofence(geofenceId);

      // If geofence not found, throw NOT_FOUND error
      if (!geofence) {
        throw new AppError(`Geofence with ID ${geofenceId} not found`, {
          code: ErrorCodes.RES_SMART_HUB_NOT_FOUND,
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      // Return 200 OK with the geofence data
      res.status(StatusCodes.OK).json(geofence);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles PUT requests to update an existing geofence
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async updateGeofence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract geofenceId from request parameters
      const { geofenceId } = req.params;

      // Extract update data from request body
      const updateData = req.body;

      // Call geofenceService.updateGeofence with ID and data
      const updatedGeofence = await this.geofenceService.updateGeofence(geofenceId, updateData);

      // If geofence not found, throw NOT_FOUND error
      if (!updatedGeofence) {
        throw new AppError(`Geofence with ID ${geofenceId} not found`, {
          code: ErrorCodes.RES_SMART_HUB_NOT_FOUND,
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      // Return 200 OK with the updated geofence
      res.status(StatusCodes.OK).json(updatedGeofence);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles DELETE requests to remove a geofence
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async deleteGeofence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract geofenceId from request parameters
      const { geofenceId } = req.params;

      // Call geofenceService.deleteGeofence with the ID
      const deleted = await this.geofenceService.deleteGeofence(geofenceId);

      // If geofence not found, throw NOT_FOUND error
      if (!deleted) {
        throw new AppError(`Geofence with ID ${geofenceId} not found`, {
          code: ErrorCodes.RES_SMART_HUB_NOT_FOUND,
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      // Return 204 No Content on successful deletion
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles GET requests to retrieve geofences associated with a specific entity
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async getGeofencesByEntity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityId from request parameters
      const { entityId } = req.params;

      // Extract entityType and activeOnly from query parameters
      const { entityType, activeOnly } = req.query;

      // Call geofenceService.getGeofencesByEntityId with parameters
      const geofences = await this.geofenceService.getGeofencesByEntityId(
        entityId,
        entityType as EntityType,
        activeOnly === 'true'
      );

      // Return 200 OK with the list of geofences
      res.status(StatusCodes.OK).json(geofences);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles GET requests to find geofences near a specific location
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async getNearbyGeofences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract latitude, longitude, radius from query parameters
      const { latitude, longitude, radius } = req.query;

      // Extract optional filters (entityType, activeOnly, limit) from query
      const { entityType, activeOnly, limit } = req.query;

      // Call geofenceService.getNearbyGeofences with parameters
      const geofences = await this.geofenceService.getNearbyGeofences(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseFloat(radius as string),
        {
          entityType: entityType as EntityType,
          activeOnly: activeOnly === 'true',
          limit: limit ? parseInt(limit as string, 10) : undefined,
        }
      );

      // Return 200 OK with the list of nearby geofences
      res.status(StatusCodes.OK).json(geofences);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles GET requests to retrieve events for a specific geofence
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async getGeofenceEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract geofenceId from request parameters
      const { geofenceId } = req.params;

      // Extract time range and pagination parameters from query
      const { startTime, endTime, limit, offset, eventType } = req.query;

      // Call geofenceService.getGeofenceEventsByGeofence with parameters
      const events = await this.geofenceService.getGeofenceEventsByGeofence(
        geofenceId,
        new Date(startTime as string),
        new Date(endTime as string),
        {
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
          eventType: eventType as GeofenceEventType,
        }
      );

      // Return 200 OK with the list of events
      res.status(StatusCodes.OK).json(events);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles POST requests to manually create a geofence event
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async createGeofenceEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract geofenceId from request parameters
      const { geofenceId } = req.params;

      // Extract event data from request body
      const { entityId, entityType, eventType, latitude, longitude, timestamp, metadata } = req.body;

      // Call geofenceService.createGeofenceEvent with parameters
      const event = await this.geofenceService.createGeofenceEvent(
        geofenceId,
        entityId,
        entityType as EntityType,
        eventType as GeofenceEventType,
        latitude,
        longitude,
        timestamp ? new Date(timestamp as string) : new Date(),
        metadata
      );

      // Return 201 Created with the created event
      res.status(StatusCodes.CREATED).json(event);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Handles GET requests to retrieve geofence events for a specific entity
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async getEventsByEntity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract entityId from request parameters
      const { entityId } = req.params;

      // Extract entityType, time range, and pagination from query
      const { entityType, startTime, endTime, limit, offset, eventType } = req.query;

      // Call geofenceService.getGeofenceEvents with parameters
      const events = await this.geofenceService.getGeofenceEvents(
        entityId,
        entityType as EntityType,
        new Date(startTime as string),
        new Date(endTime as string),
        {
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
          eventType: eventType as GeofenceEventType,
        }
      );

      // Return 200 OK with the list of events
      res.status(StatusCodes.OK).json(events);
    } catch (error) {
      // Handle errors with next(error)
      next(error);
    }
  }

  /**
   * Joi schema for validating geofence creation requests
   */
  private createGeofenceSchema(): Joi.Schema {
    return Joi.object({
      name: Joi.string().required().min(1).max(255).messages({
        'any.required': 'Name is required',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 1 character',
        'string.max': 'Name cannot exceed 255 characters',
      }),
      description: Joi.string().max(1000).allow(null, '').messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
      geofence_type: Joi.string().valid('CIRCLE', 'POLYGON', 'CORRIDOR').required().messages({
        'any.only': 'Geofence type must be one of CIRCLE, POLYGON, or CORRIDOR',
        'any.required': 'Geofence type is required',
      }),
      entity_type: Joi.string().valid(...Object.values(EntityType)).required().messages({
        'any.only': 'Entity type must be a valid entity type',
        'any.required': 'Entity type is required',
      }),
      entity_id: Joi.string().allow(null, '').messages({
        'string.base': 'Entity ID must be a string',
      }),
      center_latitude: Joi.number().when('geofence_type', {
        is: 'CIRCLE',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Center latitude is required for CIRCLE geofences',
      }),
      center_longitude: Joi.number().when('geofence_type', {
        is: 'CIRCLE',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Center longitude is required for CIRCLE geofences',
      }),
      radius: Joi.number().when('geofence_type', {
        is: 'CIRCLE',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Radius is required for CIRCLE geofences',
      }),
      coordinates: Joi.array().items(Joi.object({
        latitude: Joi.number().required().min(-90).max(90).messages({
          'any.required': 'Latitude is required',
          'number.min': 'Latitude must be greater than or equal to -90',
          'number.max': 'Latitude must be less than or equal to 90',
        }),
        longitude: Joi.number().required().min(-180).max(180).messages({
          'any.required': 'Longitude is required',
          'number.min': 'Longitude must be greater than or equal to -180',
          'number.max': 'Longitude must be less than or equal to 180',
        }),
      })).min(3).when('geofence_type', {
        is: 'POLYGON',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Coordinates are required for POLYGON geofences',
        'array.min': 'Coordinates must have at least 3 points',
      }),
      corridor_width: Joi.number().when('geofence_type', {
        is: 'CORRIDOR',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Corridor width is required for CORRIDOR geofences',
      }),
      metadata: Joi.object().allow(null).messages({
        'object.base': 'Metadata must be an object',
      }),
      active: Joi.boolean().default(true).messages({
        'boolean.base': 'Active must be a boolean',
      }),
      start_date: Joi.date().iso().allow(null).messages({
        'date.format': 'Start date must be a valid ISO date',
      }),
      end_date: Joi.date().iso().allow(null).greater(Joi.ref('start_date')).messages({
        'date.format': 'End date must be a valid ISO date',
        'date.greater': 'End date must be greater than start date',
      }),
    });
  }

  /**
   * Joi schema for validating geofence update requests
   */
  private updateGeofenceSchema(): Joi.Schema {
    return Joi.object({
      name: Joi.string().min(1).max(255).messages({
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 1 character',
        'string.max': 'Name cannot exceed 255 characters',
      }),
      description: Joi.string().max(1000).allow(null, '').messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
      geofence_type: Joi.string().valid('CIRCLE', 'POLYGON', 'CORRIDOR').messages({
        'any.only': 'Geofence type must be one of CIRCLE, POLYGON, or CORRIDOR',
      }),
      entity_type: Joi.string().valid(...Object.values(EntityType)).messages({
        'any.only': 'Entity type must be a valid entity type',
      }),
      entity_id: Joi.string().allow(null, '').messages({
        'string.base': 'Entity ID must be a string',
      }),
      center_latitude: Joi.number().when('geofence_type', {
        is: 'CIRCLE',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Center latitude is required for CIRCLE geofences',
      }),
      center_longitude: Joi.number().when('geofence_type', {
        is: 'CIRCLE',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Center longitude is required for CIRCLE geofences',
      }),
      radius: Joi.number().when('geofence_type', {
        is: 'CIRCLE',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Radius is required for CIRCLE geofences',
      }),
      coordinates: Joi.array().items(Joi.object({
        latitude: Joi.number().required().min(-90).max(90).messages({
          'any.required': 'Latitude is required',
          'number.min': 'Latitude must be greater than or equal to -90',
          'number.max': 'Latitude must be less than or equal to 90',
        }),
        longitude: Joi.number().required().min(-180).max(180).messages({
          'any.required': 'Longitude is required',
          'number.min': 'Longitude must be greater than or equal to -180',
          'number.max': 'Longitude must be less than or equal to 180',
        }),
      })).min(3).when('geofence_type', {
        is: 'POLYGON',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Coordinates are required for POLYGON geofences',
        'array.min': 'Coordinates must have at least 3 points',
      }),
      corridor_width: Joi.number().when('geofence_type', {
        is: 'CORRIDOR',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }).messages({
        'any.required': 'Corridor width is required for CORRIDOR geofences',
      }),
      metadata: Joi.object().allow(null).messages({
        'object.base': 'Metadata must be an object',
      }),
      active: Joi.boolean().messages({
        'boolean.base': 'Active must be a boolean',
      }),
      start_date: Joi.date().iso().allow(null).messages({
        'date.format': 'Start date must be a valid ISO date',
      }),
      end_date: Joi.date().iso().allow(null).greater(Joi.ref('start_date')).messages({
        'date.format': 'End date must be a valid ISO date',
        'date.greater': 'End date must be greater than start date',
      }),
    }).min(1); // At least one field must be present for update
  }

  /**
   * Joi schema for validating geofence ID parameters
   */
  private geofenceParamsSchema(): Joi.Schema {
    return Joi.object({
      geofenceId: Joi.string().uuid().required().messages({
        'string.uuid': 'Geofence ID must be a valid UUID',
        'any.required': 'Geofence ID is required',
      }),
    });
  }

  /**
   * Joi schema for validating entity ID parameters
   */
  private entityParamsSchema(): Joi.Schema {
    return Joi.object({
      entityId: Joi.string().required().messages({
        'string.base': 'Entity ID must be a string',
        'any.required': 'Entity ID is required',
      }),
    });
  }

  /**
   * Joi schema for validating nearby geofence query parameters
   */
  private nearbyQuerySchema(): Joi.Schema {
    return Joi.object({
      latitude: Joi.number().min(-90).max(90).required().messages({
        'number.base': 'Latitude must be a number',
        'number.min': 'Latitude must be greater than or equal to -90',
        'number.max': 'Latitude must be less than or equal to 90',
        'any.required': 'Latitude is required',
      }),
      longitude: Joi.number().min(-180).max(180).required().messages({
        'number.base': 'Longitude must be a number',
        'number.min': 'Longitude must be greater than or equal to -180',
        'number.max': 'Longitude must be less than or equal to 180',
        'any.required': 'Longitude is required',
      }),
      radius: Joi.number().min(0).default(1000).messages({
        'number.base': 'Radius must be a number',
        'number.min': 'Radius must be greater than or equal to 0',
      }),
      entityType: Joi.string().valid(...Object.values(EntityType)).messages({
        'string.base': 'Entity type must be a string',
        'any.only': 'Entity type must be a valid entity type',
      }),
      activeOnly: Joi.boolean().messages({
        'boolean.base': 'Active only must be a boolean',
      }),
      limit: Joi.number().integer().min(1).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be greater than or equal to 1',
      }),
    });
  }

  /**
   * Joi schema for validating event query parameters
   */
  private eventQuerySchema(): Joi.Schema {
    return Joi.object({
      startTime: Joi.date().iso().messages({
        'date.format': 'Start time must be a valid ISO date',
      }),
      endTime: Joi.date().iso().greater(Joi.ref('startTime')).messages({
        'date.format': 'End time must be a valid ISO date',
        'date.greater': 'End time must be greater than start time',
      }),
      limit: Joi.number().integer().min(1).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be greater than or equal to 1',
      }),
      offset: Joi.number().integer().min(0).messages({
        'number.base': 'Offset must be a number',
        'number.integer': 'Offset must be an integer',
        'number.min': 'Offset must be greater than or equal to 0',
      }),
      eventType: Joi.string().valid(...Object.values(GeofenceEventType)).messages({
        'string.base': 'Event type must be a string',
        'any.only': 'Event type must be a valid event type',
      }),
    });
  }

  /**
   * Joi schema for validating event creation requests
   */
  private createEventSchema(): Joi.Schema {
    return Joi.object({
      entityId: Joi.string().required().messages({
        'string.base': 'Entity ID must be a string',
        'any.required': 'Entity ID is required',
      }),
      entityType: Joi.string().valid(...Object.values(EntityType)).required().messages({
        'string.base': 'Entity type must be a string',
        'any.only': 'Entity type must be a valid entity type',
        'any.required': 'Entity type is required',
      }),
      eventType: Joi.string().valid(...Object.values(GeofenceEventType)).required().messages({
        'string.base': 'Event type must be a string',
        'any.only': 'Event type must be a valid event type',
        'any.required': 'Event type is required',
      }),
      latitude: Joi.number().min(-90).max(90).required().messages({
        'number.base': 'Latitude must be a number',
        'number.min': 'Latitude must be greater than or equal to -90',
        'number.max': 'Latitude must be less than or equal to 90',
        'any.required': 'Latitude is required',
      }),
      longitude: Joi.number().min(-180).max(180).required().messages({
        'number.base': 'Longitude must be a number',
        'number.min': 'Longitude must be greater than or equal to -180',
        'number.max': 'Longitude must be less than or equal to 180',
        'any.required': 'Longitude is required',
      }),
      timestamp: Joi.date().iso().default(() => new Date()).messages({
        'date.format': 'Timestamp must be a valid ISO date',
      }),
      metadata: Joi.object().allow(null).messages({
        'object.base': 'Metadata must be an object',
      }),
    });
  }
}