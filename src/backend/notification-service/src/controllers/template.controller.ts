import { Request, Response, NextFunction, Router } from 'express'; // v4.18.2
import Joi from 'joi'; // v17.9.2

import { 
  TemplateService, 
  TemplateQueryOptions 
} from '../services/template.service';
import { NotificationTemplate, TemplateLocale } from '../models/notification-template.model';
import { NotificationType } from '../models/notification-preference.model';
import { NotificationChannelType } from '../models/notification-channel.model';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';

/**
 * Controller responsible for handling HTTP requests related to notification templates
 * in the freight optimization platform. Provides endpoints for creating, retrieving,
 * updating, and managing templates used for rendering notifications across different
 * channels (email, SMS, push, in-app).
 */
export class TemplateController {
  private templateService: TemplateService;

  /**
   * Initializes the template controller with a template service instance
   * 
   * @param templateService Instance of TemplateService for template operations
   */
  constructor(templateService: TemplateService) {
    this.templateService = templateService;
  }

  /**
   * Registers all template-related routes on the provided router
   * 
   * @param router Express router instance
   */
  registerRoutes(router: Router): void {
    // GET routes for retrieving templates
    router.get('/templates', this.getAllTemplates.bind(this));
    router.get('/templates/:id', this.getTemplateById.bind(this));
    router.get('/templates/name/:name', this.getTemplateByName.bind(this));
    router.get('/templates/type/:type', this.getTemplatesByType.bind(this));
    router.get('/templates/channel/:channel', this.getTemplatesByChannel.bind(this));

    // POST, PUT, DELETE routes for managing templates
    router.post('/templates', this.createTemplate.bind(this));
    router.put('/templates/:id', this.updateTemplate.bind(this));
    router.delete('/templates/:id', this.deleteTemplate.bind(this));
    
    // Additional routes for template operations
    router.post('/templates/:id/default', this.setDefaultTemplate.bind(this));
    router.post('/templates/render', this.renderTemplate.bind(this));
    router.post('/templates/defaults', this.createDefaultTemplates.bind(this));
  }

  /**
   * Handles request to retrieve all templates with optional filtering
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getAllTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters for filtering
      const queryOptions: TemplateQueryOptions = {
        notificationType: req.query.notificationType as NotificationType,
        channelType: req.query.channelType as NotificationChannelType,
        locale: req.query.locale as TemplateLocale,
        isDefault: req.query.isDefault === 'true',
        isActive: req.query.isActive === 'true',
        search: req.query.search as string
      };

      // Remove undefined properties
      Object.keys(queryOptions).forEach(key => {
        if (queryOptions[key] === undefined) {
          delete queryOptions[key];
        }
      });

      logger.debug('Getting all templates with filters', { queryOptions });
      
      // Note: The TemplateService must implement a method to handle filtering templates
      // based on the provided query options. This is inferred from the imported methods.
      const templates = await NotificationTemplate.query()
        .modify(query => {
          if (queryOptions.notificationType) {
            query.where('notificationType', queryOptions.notificationType);
          }
          if (queryOptions.channelType) {
            query.where('channelType', queryOptions.channelType);
          }
          if (queryOptions.locale) {
            query.where('locale', queryOptions.locale);
          }
          if (queryOptions.isDefault !== undefined) {
            query.where('isDefault', queryOptions.isDefault);
          }
          if (queryOptions.isActive !== undefined) {
            query.where('isActive', queryOptions.isActive);
          }
          if (queryOptions.search) {
            query.where(function() {
              this.whereRaw('LOWER(name) LIKE ?', [`%${queryOptions.search.toLowerCase()}%`])
                .orWhereRaw('LOWER(description) LIKE ?', [`%${queryOptions.search.toLowerCase()}%`]);
            });
          }
        });
      
      res.status(StatusCodes.OK).json(templates);
    } catch (error) {
      logger.error('Error retrieving templates', { error });
      next(error);
    }
  }

  /**
   * Handles request to retrieve a template by its ID
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          'Template ID is required'
        );
      }
      
      logger.debug(`Getting template with ID: ${id}`);
      
      const template = await this.templateService.getTemplate(id);
      
      res.status(StatusCodes.OK).json(template);
    } catch (error) {
      logger.error(`Error retrieving template by ID: ${req.params.id}`, { error });
      next(error);
    }
  }

  /**
   * Handles request to retrieve a template by its name
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getTemplateByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      
      if (!name) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          'Template name is required'
        );
      }
      
      logger.debug(`Getting template with name: ${name}`);
      
      const template = await this.templateService.getTemplateByName(name);
      
      res.status(StatusCodes.OK).json(template);
    } catch (error) {
      logger.error(`Error retrieving template by name: ${req.params.name}`, { error });
      next(error);
    }
  }

  /**
   * Handles request to retrieve templates by notification type
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getTemplatesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type } = req.params;
      
      if (!type) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          'Notification type is required'
        );
      }
      
      // Validate that the type is a valid NotificationType
      if (!Object.values(NotificationType).includes(type as NotificationType)) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          `Invalid notification type: ${type}`
        );
      }
      
      logger.debug(`Getting templates for notification type: ${type}`);
      
      const templates = await this.templateService.getTemplatesByType(type);
      
      res.status(StatusCodes.OK).json(templates);
    } catch (error) {
      logger.error(`Error retrieving templates by type: ${req.params.type}`, { error });
      next(error);
    }
  }

  /**
   * Handles request to retrieve templates by channel type
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getTemplatesByChannel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { channel } = req.params;
      
      if (!channel) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          'Channel type is required'
        );
      }
      
      // Validate that the channel is a valid NotificationChannelType
      if (!Object.values(NotificationChannelType).includes(channel as NotificationChannelType)) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          `Invalid channel type: ${channel}`
        );
      }
      
      logger.debug(`Getting templates for channel type: ${channel}`);
      
      const templates = await this.templateService.getTemplatesByChannel(channel);
      
      res.status(StatusCodes.OK).json(templates);
    } catch (error) {
      logger.error(`Error retrieving templates by channel: ${req.params.channel}`, { error });
      next(error);
    }
  }

  /**
   * Handles request to create a new notification template
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255),
        description: Joi.string().max(1000),
        notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
        channelType: Joi.string().valid(...Object.values(NotificationChannelType)).required(),
        content: Joi.object().required(),
        variables: Joi.array().items(Joi.string()),
        locale: Joi.string().valid(...Object.values(TemplateLocale)),
        isDefault: Joi.boolean(),
        isActive: Joi.boolean()
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          `Invalid template data: ${error.message}`
        );
      }
      
      logger.debug('Creating new template', { templateName: value.name });
      
      const template = await this.templateService.createTemplate(value);
      
      res.status(StatusCodes.CREATED).json(template);
    } catch (error) {
      logger.error('Error creating template', { error, data: req.body });
      next(error);
    }
  }

  /**
   * Handles request to update an existing notification template
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          'Template ID is required'
        );
      }
      
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().max(255),
        description: Joi.string().max(1000),
        content: Joi.object(),
        variables: Joi.array().items(Joi.string()),
        isDefault: Joi.boolean(),
        isActive: Joi.boolean()
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          `Invalid template data: ${error.message}`
        );
      }
      
      logger.debug(`Updating template with ID: ${id}`, { updateData: value });
      
      const template = await this.templateService.updateTemplate(id, value);
      
      res.status(StatusCodes.OK).json(template);
    } catch (error) {
      logger.error(`Error updating template: ${req.params.id}`, { error, data: req.body });
      next(error);
    }
  }

  /**
   * Handles request to delete a notification template
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          'Template ID is required'
        );
      }
      
      logger.debug(`Deleting template with ID: ${id}`);
      
      const deleted = await this.templateService.deleteTemplate(id);
      
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      logger.error(`Error deleting template: ${req.params.id}`, { error });
      next(error);
    }
  }

  /**
   * Handles request to set a template as the default for its type and channel
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async setDefaultTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          'Template ID is required'
        );
      }
      
      logger.debug(`Setting template with ID: ${id} as default`);
      
      const template = await this.templateService.setDefaultTemplate(id);
      
      res.status(StatusCodes.OK).json(template);
    } catch (error) {
      logger.error(`Error setting template as default: ${req.params.id}`, { error });
      next(error);
    }
  }

  /**
   * Handles request to render a template with provided data
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async renderTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const schema = Joi.object({
        templateId: Joi.string().required(),
        data: Joi.object().required()
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        throw createError(
          ErrorCodes.VAL_INVALID_INPUT,
          `Invalid render request: ${error.message}`
        );
      }
      
      const { templateId, data } = value;
      
      logger.debug(`Rendering template with ID: ${templateId}`, { dataKeys: Object.keys(data) });
      
      // Get the template first
      const template = await this.templateService.getTemplate(templateId);
      
      // Then render it with the provided data
      const renderedContent = await this.templateService.renderTemplate(template, data);
      
      res.status(StatusCodes.OK).json(renderedContent);
    } catch (error) {
      logger.error('Error rendering template', { error, data: req.body });
      next(error);
    }
  }

  /**
   * Handles request to create default templates for all notification types and channels
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async createDefaultTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('Creating default templates');
      
      const createdCount = await this.templateService.createDefaultTemplates();
      
      res.status(StatusCodes.CREATED).json({ 
        message: 'Default templates created successfully',
        count: createdCount 
      });
    } catch (error) {
      logger.error('Error creating default templates', { error });
      next(error);
    }
  }
}