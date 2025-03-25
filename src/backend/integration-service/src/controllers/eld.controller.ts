import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2
import {
  EldService,
} from '../services/eld.service';
import {
  EldProviderType,
  EldConnection,
  EldConnectionCreationParams,
  EldConnectionUpdateParams,
  EldAuthorizationRequest,
  EldTokenExchangeRequest,
  EldConnectionStatus,
} from '../models/eld-connection.model';
import { DriverHOS } from '../../../common/interfaces/driver.interface';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { validateBody, validateQuery, validateParams } from '../../../common/middleware/validation.middleware';
import logger from '../../../common/utils/logger';

/**
 * Controller for handling ELD integration API endpoints
 */
export class EldController {
  /**
   * Initializes the ELD controller with the ELD service
   * @param eldService 
   */
  constructor(
    private readonly eldService: EldService,
  ) {
    // Log controller initialization
    logger.info('EldController initialized');
  }

  /**
   * Generates an OAuth authorization URL for a specific ELD provider
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the authorization URL in the response
   */
  getAuthorizationUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request body
      const schema = Joi.object<EldAuthorizationRequest>({
        driver_id: Joi.string().required(),
        provider_type: Joi.string().valid(...Object.values(EldProviderType)).required(),
        redirect_uri: Joi.string().uri().required(),
        state: Joi.string().required(),
      });

      // Validate the request body against the schema
      const { error, value } = schema.validate(req.body);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request body', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract driver_id, provider_type, redirect_uri, and state from request body
      const { driver_id, provider_type, redirect_uri, state } = value;

      // Define the scope for the ELD connection
      const scope = 'read';

      // Call eldService.getAuthorizationUrl with the extracted parameters
      const authorizationUrl = await this.eldService.getAuthorizationUrl(
        driver_id,
        provider_type,
        redirect_uri,
        state,
        scope
      );

      // Return the authorization URL in the response
      res.status(200).send({ authorizationUrl });
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Exchanges an authorization code for access and refresh tokens
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the created ELD connection in the response
   */
  exchangeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request body
      const schema = Joi.object<EldTokenExchangeRequest>({
        driver_id: Joi.string().required(),
        provider_type: Joi.string().valid(...Object.values(EldProviderType)).required(),
        code: Joi.string().required(),
        redirect_uri: Joi.string().uri().required(),
      });

      // Validate the request body against the schema
      const { error, value } = schema.validate(req.body);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request body', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract driver_id, provider_type, code, and redirect_uri from request body
      const { driver_id, provider_type, code, redirect_uri } = value;

      // Call eldService.exchangeCodeForTokens with the extracted parameters
      const connection = await this.eldService.exchangeCodeForTokens(
        driver_id,
        provider_type,
        code,
        redirect_uri
      );

      // Return the created ELD connection in the response
      res.status(201).send(connection);
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Creates a new ELD connection manually
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the created ELD connection in the response
   */
  createConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request body
      const schema = Joi.object<Omit<EldConnectionCreationParams, 'provider_account_id'>>({
        driver_id: Joi.string().required(),
        provider_type: Joi.string().valid(...Object.values(EldProviderType)).required(),
        access_token: Joi.string().required(),
        refresh_token: Joi.string().required(),
        token_expires_at: Joi.date().required(),
      });

      // Validate the request body against the schema
      const { error, value } = schema.validate(req.body);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request body', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract connection parameters from request body
      const connectionParams: EldConnectionCreationParams = {
        ...value,
        provider_account_id: '', // Manually created connections don't have a provider account ID
      };

      // Call eldService.createConnection with the parameters
      const connection = await this.eldService.createConnection(connectionParams);

      // Return the created ELD connection in the response
      res.status(201).send(connection);
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Updates an existing ELD connection
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the updated ELD connection in the response
   */
  updateConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request parameters
      const paramsSchema = Joi.object({
        connection_id: Joi.string().required(),
      });

      // Validate the request parameters against the schema
      const { error: paramsError, value: paramsValue } = paramsSchema.validate(req.params);
      if (paramsError) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: paramsError.details,
        });
      }

      // Extract connection_id from request parameters
      const { connection_id } = paramsValue;

      // Define the validation schema for the request body
      const bodySchema = Joi.object<EldConnectionUpdateParams>({
        access_token: Joi.string(),
        refresh_token: Joi.string(),
        token_expires_at: Joi.date(),
        status: Joi.string().valid(...Object.values(EldConnectionStatus)),
        last_sync_at: Joi.date(),
        error_message: Joi.string().allow(null),
      }).min(1); // Ensure at least one field is present in the body

      // Validate the request body against the schema
      const { error: bodyError, value: bodyValue } = bodySchema.validate(req.body);
      if (bodyError) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request body', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: bodyError.details,
        });
      }

      // Extract update parameters from request body
      const updateParams: EldConnectionUpdateParams = bodyValue;

      // Call eldService.updateConnection with the parameters
      const connection = await this.eldService.updateConnection(connection_id, updateParams);

      // Return the updated ELD connection in the response
      res.status(200).send(connection);
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Retrieves an ELD connection by ID
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the ELD connection in the response
   */
  getConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request parameters
      const schema = Joi.object({
        connection_id: Joi.string().required(),
      });

      // Validate the request parameters against the schema
      const { error, value } = schema.validate(req.params);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract connection_id from request parameters
      const { connection_id } = value;

      // Call eldService.getConnection with the connection_id
      const connection = await this.eldService.getConnection(connection_id);

      // Return the ELD connection in the response
      res.status(200).send(connection);
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Retrieves an ELD connection by driver ID
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the ELD connection in the response
   */
  getConnectionByDriverId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request parameters
      const schema = Joi.object({
        driver_id: Joi.string().required(),
      });

      // Validate the request parameters against the schema
      const { error, value } = schema.validate(req.params);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract driver_id from request parameters
      const { driver_id } = value;

      // Call eldService.getConnectionByDriverId with the driver_id
      const connection = await this.eldService.getConnectionByDriverId(driver_id);

      // Return the ELD connection in the response
      res.status(200).send(connection);
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Deletes an ELD connection
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends a success message in the response
   */
  deleteConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request parameters
      const schema = Joi.object({
        connection_id: Joi.string().required(),
      });

      // Validate the request parameters against the schema
      const { error, value } = schema.validate(req.params);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract connection_id from request parameters
      const { connection_id } = value;

      // Call eldService.deleteConnection with the connection_id
      await this.eldService.deleteConnection(connection_id);

      // Return a success message in the response
      res.status(200).send({ message: 'ELD connection deleted successfully' });
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Retrieves the current Hours of Service data for a driver
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the driver's HOS data in the response
   */
  getDriverHOS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request parameters
      const schema = Joi.object({
        driver_id: Joi.string().required(),
      });

      // Validate the request parameters against the schema
      const { error, value } = schema.validate(req.params);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract driver_id from request parameters
      const { driver_id } = value;

      // Call eldService.getDriverHOS with the driver_id
      const hosData = await this.eldService.getDriverHOS(driver_id);

      // Return the driver's HOS data in the response
      res.status(200).send(hosData);
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Retrieves the HOS logs for a driver within a specified time range
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the driver's HOS logs in the response
   */
  getDriverHOSLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request parameters
      const paramsSchema = Joi.object({
        driver_id: Joi.string().required(),
      });

      // Validate the request parameters against the schema
      const { error: paramsError, value: paramsValue } = paramsSchema.validate(req.params);
      if (paramsError) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: paramsError.details,
        });
      }

      // Extract driver_id from request parameters
      const { driver_id } = paramsValue;

      // Define the validation schema for the request query parameters
      const querySchema = Joi.object({
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().required(),
      });

      // Validate the request query parameters against the schema
      const { error: queryError, value: queryValue } = querySchema.validate(req.query);
      if (queryError) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid query parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: queryError.details,
        });
      }

      // Extract start_date and end_date from request query parameters
      const { start_date, end_date } = queryValue;

      // Call eldService.getDriverHOSLogs with the parameters
      const hosLogs = await this.eldService.getDriverHOSLogs(driver_id, start_date as Date, end_date as Date);

      // Return the driver's HOS logs in the response
      res.status(200).send(hosLogs);
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Retrieves the current location of a driver
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the driver's location in the response
   */
  getDriverLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request parameters
      const schema = Joi.object({
        driver_id: Joi.string().required(),
      });

      // Validate the request parameters against the schema
      const { error, value } = schema.validate(req.params);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract driver_id from request parameters
      const { driver_id } = value;

      // Call eldService.getDriverLocation with the driver_id
      const location = await this.eldService.getDriverLocation(driver_id);

      // Return the driver's location in the response
      res.status(200).send(location);
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };

  /**
   * Validates an ELD connection by making a test API call
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Sends the validation result in the response
   */
  validateConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Define the validation schema for the request parameters
      const schema = Joi.object({
        connection_id: Joi.string().required(),
      });

      // Validate the request parameters against the schema
      const { error, value } = schema.validate(req.params);
      if (error) {
        // If validation fails, throw an AppError with appropriate details
        throw new AppError('Invalid request parameters', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: error.details,
        });
      }

      // Extract connection_id from request parameters
      const { connection_id } = value;

      // Call eldService.validateConnection with the connection_id
      const isValid = await this.eldService.validateConnection(connection_id);

      // Return the validation result in the response
      res.status(200).send({ isValid });
    } catch (error) {
      // Handle errors with appropriate error codes and messages
      next(error);
    }
  };
}