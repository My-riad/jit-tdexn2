import { Request, Response, NextFunction, Router } from 'express';
import logger from '../../../common/utils/logger';
import { 
  PreferenceService, 
  PreferenceCreateData, 
  PreferenceUpdateData 
} from '../services/preference.service';
import { 
  NotificationPreference, 
  NotificationType, 
  FrequencyType 
} from '../models/notification-preference.model';
import { NotificationChannelType } from '../models/notification-channel.model';

/**
 * Controller responsible for handling HTTP requests related to notification preferences
 * in the freight optimization platform. Provides endpoints for creating, retrieving,
 * updating, and managing user notification preferences.
 */
export class PreferenceController {
  private preferenceService: PreferenceService;

  /**
   * Creates a new instance of the PreferenceController
   * 
   * @param preferenceService The service to use for preference operations
   */
  constructor(preferenceService: PreferenceService) {
    this.preferenceService = preferenceService;
  }

  /**
   * Registers all preference-related routes on the provided router
   * 
   * @param router Express router to register routes on
   */
  public registerRoutes(router: Router): void {
    // Get all preferences for a user
    router.get('/preferences', this.getUserPreferences.bind(this));
    
    // Get a specific preference by ID
    router.get('/preferences/:id', this.getPreference.bind(this));
    
    // Create a new preference
    router.post('/preferences', this.createPreference.bind(this));
    
    // Update an existing preference
    router.put('/preferences/:id', this.updatePreference.bind(this));
    
    // Delete a preference
    router.delete('/preferences/:id', this.deletePreference.bind(this));
    
    // Create default preferences for a user
    router.post('/preferences/default', this.createDefaultPreferences.bind(this));
    
    // Enable a specific notification type
    router.put('/preferences/:id/enable', this.enablePreference.bind(this));
    
    // Disable a specific notification type
    router.put('/preferences/:id/disable', this.disablePreference.bind(this));
    
    // Update channels for a notification type
    router.put('/preferences/:id/channels', this.updateChannels.bind(this));
    
    // Update frequency for a notification type
    router.put('/preferences/:id/frequency', this.updateFrequency.bind(this));
    
    // Update time window for a notification type
    router.put('/preferences/:id/time-window', this.updateTimeWindow.bind(this));
  }

  /**
   * Handles GET request to retrieve all notification preferences for a user
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async getUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const userType = req.query.userType as string;
      
      if (!userId || !userType) {
        res.status(400).json({ error: 'User ID and user type are required' });
        return;
      }
      
      logger.info('Retrieving user notification preferences', { userId, userType });
      const preferences = await this.preferenceService.getUserPreferences(userId, userType);
      
      res.status(200).json(preferences);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve a specific notification preference by ID
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async getPreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceId = req.params.id;
      
      logger.info('Retrieving notification preference by ID', { preferenceId });
      const preference = await this.preferenceService.getPreference(preferenceId);
      
      res.status(200).json(preference);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles POST request to create a new notification preference
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async createPreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceData: PreferenceCreateData = req.body;
      
      logger.info('Creating new notification preference', { 
        userId: preferenceData.userId,
        userType: preferenceData.userType,
        notificationType: preferenceData.notificationType
      });
      
      const createdPreference = await this.preferenceService.createPreference(preferenceData);
      
      res.status(201).json(createdPreference);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to update an existing notification preference
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async updatePreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceId = req.params.id;
      const updateData: PreferenceUpdateData = req.body;
      
      logger.info('Updating notification preference', { preferenceId });
      const updatedPreference = await this.preferenceService.updatePreference(preferenceId, updateData);
      
      res.status(200).json(updatedPreference);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles DELETE request to delete a notification preference
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async deletePreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceId = req.params.id;
      
      logger.info('Deleting notification preference', { preferenceId });
      await this.preferenceService.deletePreference(preferenceId);
      
      res.status(200).json({ message: 'Preference deleted successfully' });
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles POST request to create default preferences for all notification types for a user
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async createDefaultPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, userType } = req.body;
      
      if (!userId || !userType) {
        res.status(400).json({ error: 'User ID and user type are required' });
        return;
      }
      
      logger.info('Creating default notification preferences', { userId, userType });
      const preferences = await this.preferenceService.createDefaultPreferences(userId, userType);
      
      res.status(201).json(preferences);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to enable a notification preference
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async enablePreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceId = req.params.id;
      
      // Get the preference first to extract the necessary data
      const preference = await this.preferenceService.getPreference(preferenceId);
      
      logger.info('Enabling notification preference', { 
        preferenceId,
        userId: preference.userId,
        notificationType: preference.notificationType
      });
      
      // Enable the notification type
      const updatedPreference = await this.preferenceService.enableNotificationType(
        preference.userId,
        preference.userType,
        preference.notificationType
      );
      
      res.status(200).json(updatedPreference);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to disable a notification preference
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async disablePreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceId = req.params.id;
      
      // Get the preference first to extract the necessary data
      const preference = await this.preferenceService.getPreference(preferenceId);
      
      logger.info('Disabling notification preference', { 
        preferenceId,
        userId: preference.userId,
        notificationType: preference.notificationType
      });
      
      // Disable the notification type
      const updatedPreference = await this.preferenceService.disableNotificationType(
        preference.userId,
        preference.userType,
        preference.notificationType
      );
      
      res.status(200).json(updatedPreference);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to update channels for a notification preference
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async updateChannels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceId = req.params.id;
      const { channels } = req.body;
      
      if (!channels || !Array.isArray(channels)) {
        res.status(400).json({ error: 'Channels must be provided as an array' });
        return;
      }
      
      // Get the preference first to extract the necessary data
      const preference = await this.preferenceService.getPreference(preferenceId);
      
      logger.info('Updating notification channels', { 
        preferenceId,
        userId: preference.userId,
        notificationType: preference.notificationType,
        channels
      });
      
      // Update the channels
      const updatedPreference = await this.preferenceService.updateChannels(
        preference.userId,
        preference.userType,
        preference.notificationType,
        channels
      );
      
      res.status(200).json(updatedPreference);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to update frequency settings for a notification preference
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async updateFrequency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceId = req.params.id;
      const { frequency } = req.body;
      
      if (!frequency || !frequency.type) {
        res.status(400).json({ error: 'Valid frequency settings must be provided' });
        return;
      }
      
      // Get the preference first to extract the necessary data
      const preference = await this.preferenceService.getPreference(preferenceId);
      
      logger.info('Updating notification frequency', { 
        preferenceId,
        userId: preference.userId,
        notificationType: preference.notificationType,
        frequency
      });
      
      // Update the frequency
      const updatedPreference = await this.preferenceService.updateFrequency(
        preference.userId,
        preference.userType,
        preference.notificationType,
        frequency
      );
      
      res.status(200).json(updatedPreference);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to update time window for a notification preference
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public async updateTimeWindow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferenceId = req.params.id;
      const { timeWindow } = req.body;
      
      if (!timeWindow || !timeWindow.start || !timeWindow.end || !timeWindow.timezone) {
        res.status(400).json({ error: 'Valid time window settings must be provided' });
        return;
      }
      
      // Get the preference first to extract the necessary data
      const preference = await this.preferenceService.getPreference(preferenceId);
      
      logger.info('Updating notification time window', { 
        preferenceId,
        userId: preference.userId,
        notificationType: preference.notificationType,
        timeWindow
      });
      
      // Update the time window
      const updatedPreference = await this.preferenceService.updateTimeWindow(
        preference.userId,
        preference.userType,
        preference.notificationType,
        timeWindow
      );
      
      res.status(200).json(updatedPreference);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Helper method to handle errors in controller methods
   * 
   * @param error The error to handle
   * @param next Express next function
   */
  private handleError(error: Error, next: NextFunction): void {
    logger.error('Preference controller error', { error });
    next(error);
  }
}