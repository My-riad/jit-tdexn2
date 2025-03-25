import { Router } from 'express'; // v4.18.2
import Joi from 'joi'; // v17.9.2

import { TemplateController } from '../controllers/template.controller';
import { TemplateService } from '../services/template.service';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { logger } from '../../../common/utils/logger';
import { NotificationType } from '../models/notification-preference.model';
import { NotificationChannelType } from '../models/notification-channel.model';
import { TemplateLocale } from '../models/notification-template.model';

/**
 * Validation schema for template creation requests
 */
const createTemplateSchema: Joi.Schema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().optional().max(500),
  notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
  channelType: Joi.string().valid(...Object.values(NotificationChannelType)).required(),
  content: Joi.object().required(),
  variables: Joi.array().items(Joi.string()).required(),
  locale: Joi.string().valid(...Object.values(TemplateLocale)).optional(),
  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
}).options({ abortEarly: false });

/**
 * Validation schema for template update requests
 */
const updateTemplateSchema: Joi.Schema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  content: Joi.object().optional(),
  variables: Joi.array().items(Joi.string()).optional(),
  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
}).options({ abortEarly: false });

/**
 * Validation schema for template ID route parameters
 */
const templateIdParamSchema: Joi.Schema = Joi.object({
  id: Joi.string().uuid().required()
}).options({ abortEarly: false });

/**
 * Validation schema for template name route parameters
 */
const templateNameParamSchema: Joi.Schema = Joi.object({
  name: Joi.string().min(3).max(100).required()
}).options({ abortEarly: false });

/**
 * Validation schema for template type route parameters
 */
const templateTypeParamSchema: Joi.Schema = Joi.object({
  type: Joi.string().valid(...Object.values(NotificationType)).required()
}).options({ abortEarly: false });

/**
 * Validation schema for template channel route parameters
 */
const templateChannelParamSchema: Joi.Schema = Joi.object({
  channel: Joi.string().valid(...Object.values(NotificationChannelType)).required()
}).options({ abortEarly: false });

/**
 * Validation schema for template query parameters
 */
const templateQuerySchema: Joi.Schema = Joi.object({
  notificationType: Joi.string().valid(...Object.values(NotificationType)).optional(),
  channelType: Joi.string().valid(...Object.values(NotificationChannelType)).optional(),
  locale: Joi.string().valid(...Object.values(TemplateLocale)).optional(),
  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(100).optional()
}).options({ abortEarly: false });

/**
 * Validation schema for template rendering requests
 */
const renderTemplateSchema: Joi.Schema = Joi.object({
  templateId: Joi.string().uuid().required(),
  data: Joi.object().required()
}).options({ abortEarly: false });

/**
 * Creates and configures an Express router for template management endpoints
 * @returns Configured Express router with template routes
 */
function createTemplateRouter(): Router {
  // Create a new Express router instance
  const router = express.Router();

  // Create a new TemplateService instance
  const templateService = new TemplateService();

  // Create a new TemplateController instance with the template service
  const templateController = new TemplateController(templateService);

  // Register template routes using the controller's registerRoutes method
  templateController.registerRoutes(router);

  // Log successful router creation
  logger.info('Template router created successfully');

  // Return the configured router
  return router;
}

// Export the configured template router for use in the application
export default createTemplateRouter();