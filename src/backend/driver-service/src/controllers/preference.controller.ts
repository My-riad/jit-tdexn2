import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { PreferenceService } from '../services/preference.service';
import { DriverPreference, PreferenceType } from '../../../common/interfaces/driver.interface';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';

/**
 * Controller class for handling HTTP requests related to driver preferences
 * in the freight optimization platform. Provides endpoints for creating,
 * retrieving, updating, and deleting driver preferences that influence
 * load matching and driver experience.
 */
export class PreferenceController {
  private preferenceService: PreferenceService;

  /**
   * Creates a new PreferenceController instance
   * @param preferenceService The preference service to use for handling driver preference operations
   */
  constructor(preferenceService: PreferenceService) {
    this.preferenceService = preferenceService;
  }

  /**
   * Retrieves all preferences for a specific driver
   * @param req Express Request object containing driver ID in params
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public getDriverPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;
      logger.debug('Getting driver preferences', { driverId });
      
      const preferences = await this.preferenceService.getDriverPreferences(driverId);
      res.status(StatusCodes.OK).json(preferences);
    } catch (error) {
      logger.error('Error getting driver preferences', { error, driverId: req.params.driverId });
      next(error);
    }
  };

  /**
   * Retrieves preferences of a specific type for a driver
   * @param req Express Request object containing driver ID and preference type in params
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public getDriverPreferencesByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId, preferenceType } = req.params;
      
      if (!Object.values(PreferenceType).includes(preferenceType as PreferenceType)) {
        throw new AppError('Invalid preference type', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: { 
            preferenceType,
            validTypes: Object.values(PreferenceType)
          }
        });
      }
      
      logger.debug('Getting driver preferences by type', { driverId, preferenceType });
      
      const preferences = await this.preferenceService.getDriverPreferencesByType(
        driverId, 
        preferenceType as PreferenceType
      );
      
      res.status(StatusCodes.OK).json(preferences);
    } catch (error) {
      logger.error('Error getting driver preferences by type', { 
        error, 
        driverId: req.params.driverId,
        preferenceType: req.params.preferenceType
      });
      next(error);
    }
  };

  /**
   * Retrieves a specific preference by ID
   * @param req Express Request object containing preference ID in params
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public getPreferenceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { preferenceId } = req.params;
      logger.debug('Getting preference by ID', { preferenceId });
      
      const preference = await this.preferenceService.getPreferenceById(preferenceId);
      res.status(StatusCodes.OK).json(preference);
    } catch (error) {
      logger.error('Error getting preference by ID', { error, preferenceId: req.params.preferenceId });
      next(error);
    }
  };

  /**
   * Creates a new preference for a driver
   * @param req Express Request object containing driver ID in params and preference data in body
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public createDriverPreference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;
      const preferenceData: Partial<DriverPreference> = req.body;
      
      logger.debug('Creating driver preference', { driverId, preferenceData });
      
      const createdPreference = await this.preferenceService.createDriverPreference(driverId, preferenceData);
      res.status(StatusCodes.CREATED).json(createdPreference);
    } catch (error) {
      logger.error('Error creating driver preference', { 
        error, 
        driverId: req.params.driverId,
        preferenceData: req.body
      });
      next(error);
    }
  };

  /**
   * Updates an existing driver preference
   * @param req Express Request object containing driver ID and preference ID in params, and updated data in body
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public updateDriverPreference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId, preferenceId } = req.params;
      const preferenceData: Partial<DriverPreference> = req.body;
      
      logger.debug('Updating driver preference', { driverId, preferenceId, preferenceData });
      
      const updatedPreference = await this.preferenceService.updateDriverPreference(
        driverId,
        preferenceId,
        preferenceData
      );
      
      res.status(StatusCodes.OK).json(updatedPreference);
    } catch (error) {
      logger.error('Error updating driver preference', { 
        error, 
        driverId: req.params.driverId,
        preferenceId: req.params.preferenceId
      });
      next(error);
    }
  };

  /**
   * Deletes a specific driver preference
   * @param req Express Request object containing driver ID and preference ID in params
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public deleteDriverPreference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId, preferenceId } = req.params;
      logger.debug('Deleting driver preference', { driverId, preferenceId });
      
      await this.preferenceService.deleteDriverPreference(driverId, preferenceId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      logger.error('Error deleting driver preference', { 
        error, 
        driverId: req.params.driverId,
        preferenceId: req.params.preferenceId
      });
      next(error);
    }
  };

  /**
   * Deletes all preferences for a driver
   * @param req Express Request object containing driver ID in params
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public deleteAllDriverPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;
      logger.debug('Deleting all driver preferences', { driverId });
      
      await this.preferenceService.deleteAllDriverPreferences(driverId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      logger.error('Error deleting all driver preferences', { error, driverId: req.params.driverId });
      next(error);
    }
  };

  /**
   * Creates multiple driver preferences in a single request
   * @param req Express Request object containing driver ID in params and array of preference data in body
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public bulkCreateDriverPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;
      const preferencesData: Partial<DriverPreference>[] = req.body;
      
      if (!Array.isArray(preferencesData)) {
        throw new AppError('Request body must be an array of preferences', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: { driverId }
        });
      }
      
      logger.debug('Bulk creating driver preferences', { driverId, count: preferencesData.length });
      
      const createdPreferences = await this.preferenceService.bulkCreateDriverPreferences(
        driverId,
        preferencesData
      );
      
      res.status(StatusCodes.CREATED).json(createdPreferences);
    } catch (error) {
      logger.error('Error bulk creating driver preferences', { 
        error, 
        driverId: req.params.driverId,
        preferencesCount: Array.isArray(req.body) ? req.body.length : 'invalid'
      });
      next(error);
    }
  };

  /**
   * Retrieves all preferences of a specific type across all drivers
   * @param req Express Request object containing preference type in params
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  public getPreferencesByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { preferenceType } = req.params;
      
      if (!Object.values(PreferenceType).includes(preferenceType as PreferenceType)) {
        throw new AppError('Invalid preference type', {
          code: ErrorCodes.VAL_INVALID_INPUT,
          details: { 
            preferenceType,
            validTypes: Object.values(PreferenceType)
          }
        });
      }
      
      logger.debug('Getting preferences by type', { preferenceType });
      
      const preferences = await this.preferenceService.getPreferencesByType(preferenceType as PreferenceType);
      res.status(StatusCodes.OK).json(preferences);
    } catch (error) {
      logger.error('Error getting preferences by type', { error, preferenceType: req.params.preferenceType });
      next(error);
    }
  };
}