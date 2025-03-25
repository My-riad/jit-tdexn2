import Handlebars from 'handlebars'; // v4.7.7
import { Transaction } from 'objection'; // v3.0.1

import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';

import {
  NotificationTemplate,
  TemplateLocale
} from '../models/notification-template.model';
import { NotificationType } from '../models/notification-preference.model';
import { NotificationChannelType } from '../models/notification-channel.model';

/**
 * Interface defining the data required to create a new notification template
 */
interface TemplateCreateData {
  name: string;
  description: string;
  notificationType: NotificationType;
  channelType: NotificationChannelType;
  content: object;
  variables: string[];
  locale: TemplateLocale;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * Interface defining the data that can be updated for a notification template
 */
interface TemplateUpdateData {
  name?: string;
  description?: string;
  content?: object;
  variables?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

/**
 * Interface defining options for querying templates
 */
interface TemplateQueryOptions {
  notificationType?: NotificationType;
  channelType?: NotificationChannelType;
  locale?: TemplateLocale;
  isDefault?: boolean;
  isActive?: boolean;
  search?: string;
}

/**
 * Service responsible for managing notification templates, including creation,
 * retrieval, and rendering for different notification types and channels.
 */
class TemplateService {
  private Handlebars: typeof Handlebars;

  /**
   * Initializes the template service with Handlebars instance
   */
  constructor() {
    this.Handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Retrieves a template by ID
   * 
   * @param templateId - ID of the template to retrieve
   * @returns The template if found
   * @throws Error if template not found
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    if (!templateId) {
      throw createError(ErrorCodes.INVALID_TEMPLATE_DATA, 'Template ID is required');
    }

    logger.debug(`Getting template with ID: ${templateId}`);
    
    const template = await NotificationTemplate.query().findById(templateId);
    
    if (!template) {
      logger.error(`Template not found with ID: ${templateId}`);
      throw createError(ErrorCodes.TEMPLATE_NOT_FOUND, `Template not found with ID: ${templateId}`);
    }
    
    return template;
  }

  /**
   * Retrieves a template by name
   * 
   * @param templateName - Name of the template to retrieve
   * @returns The template if found
   * @throws Error if template not found
   */
  async getTemplateByName(templateName: string): Promise<NotificationTemplate> {
    if (!templateName) {
      throw createError(ErrorCodes.INVALID_TEMPLATE_DATA, 'Template name is required');
    }

    logger.debug(`Getting template with name: ${templateName}`);
    
    const template = await NotificationTemplate.query()
      .where('name', templateName)
      .first();
    
    if (!template) {
      logger.error(`Template not found with name: ${templateName}`);
      throw createError(ErrorCodes.TEMPLATE_NOT_FOUND, `Template not found with name: ${templateName}`);
    }
    
    return template;
  }

  /**
   * Gets the appropriate template for a notification type and channel
   * 
   * @param notificationType - Type of notification
   * @param channelType - Channel type
   * @param locale - Locale for the template
   * @param templateId - Optional specific template ID to use
   * @returns The appropriate template for the notification
   */
  async getTemplateForNotification(
    notificationType: string,
    channelType: string,
    locale: string = TemplateLocale.EN_US,
    templateId?: string
  ): Promise<NotificationTemplate> {
    // If a specific template ID is provided, try to get it
    if (templateId) {
      try {
        const template = await this.getTemplate(templateId);
        
        // Verify the template matches the requested notification type and channel
        if (template.notificationType !== notificationType || template.channelType !== channelType) {
          logger.warn(`Requested template ${templateId} does not match notification type ${notificationType} and channel ${channelType}`);
        }
        
        return template;
      } catch (error) {
        // If template not found or other error, fall back to default template
        logger.warn(`Failed to get specific template ${templateId}, falling back to default`, { error });
      }
    }
    
    // Get the default template for this notification type and channel
    logger.debug(`Getting default template for notification type: ${notificationType}, channel: ${channelType}, locale: ${locale}`);
    
    let template = await NotificationTemplate.getDefaultTemplate(
      notificationType as NotificationType,
      channelType as NotificationChannelType,
      locale
    );
    
    // If no template exists, create a default one
    if (!template) {
      logger.info(`No default template found, creating one for notification type: ${notificationType}, channel: ${channelType}, locale: ${locale}`);
      
      template = await NotificationTemplate.createDefaultTemplate(
        notificationType as NotificationType,
        channelType as NotificationChannelType,
        locale
      );
      
      logger.info(`Created default template with ID: ${template.id}`);
    }
    
    return template;
  }

  /**
   * Creates a new notification template
   * 
   * @param templateData - Data for the new template
   * @returns The created template
   * @throws Error if template creation fails
   */
  async createTemplate(templateData: TemplateCreateData): Promise<NotificationTemplate> {
    // Validate template data
    const validation = this.validateTemplateData(templateData, false);
    if (!validation.isValid) {
      logger.error('Invalid template data', { errors: validation.errors });
      throw createError(
        ErrorCodes.INVALID_TEMPLATE_DATA,
        `Invalid template data: ${validation.errors.join(', ')}`
      );
    }
    
    // Check if template with this name already exists
    const existingTemplate = await NotificationTemplate.query()
      .where('name', templateData.name)
      .first();
      
    if (existingTemplate) {
      logger.error(`Template with name "${templateData.name}" already exists`);
      throw createError(
        ErrorCodes.TEMPLATE_CREATION_FAILED,
        `Template with name "${templateData.name}" already exists`
      );
    }
    
    try {
      // Create the new template
      const template = new NotificationTemplate();
      
      // Assign properties from template data
      template.name = templateData.name;
      template.description = templateData.description;
      template.notificationType = templateData.notificationType;
      template.channelType = templateData.channelType;
      template.content = templateData.content;
      template.variables = templateData.variables;
      template.locale = templateData.locale;
      template.isDefault = templateData.isDefault;
      template.isActive = templateData.isActive !== undefined ? templateData.isActive : true;
      
      // Validate template content
      const contentValidation = template.validateContent();
      if (!contentValidation.valid) {
        logger.error('Invalid template content', { errors: contentValidation.errors });
        throw createError(
          ErrorCodes.INVALID_TEMPLATE_DATA,
          `Invalid template content: ${contentValidation.errors.join(', ')}`
        );
      }
      
      // If this template is being set as default, update other templates
      if (template.isDefault) {
        await this.updateDefaultTemplateStatus(
          template.notificationType,
          template.channelType,
          template.locale
        );
      }
      
      // Save the template
      const savedTemplate = await NotificationTemplate.query().insert(template);
      
      logger.info(`Created template with ID: ${savedTemplate.id}`);
      return savedTemplate;
    } catch (error) {
      logger.error('Failed to create template', { error });
      throw createError(
        ErrorCodes.TEMPLATE_CREATION_FAILED,
        'Failed to create template',
        { originalError: error }
      );
    }
  }

  /**
   * Updates an existing notification template
   * 
   * @param templateId - ID of the template to update
   * @param templateData - Data to update
   * @returns The updated template
   * @throws Error if template update fails
   */
  async updateTemplate(
    templateId: string,
    templateData: TemplateUpdateData
  ): Promise<NotificationTemplate> {
    // Validate template data
    const validation = this.validateTemplateData(templateData, true);
    if (!validation.isValid) {
      logger.error('Invalid template data for update', { errors: validation.errors });
      throw createError(
        ErrorCodes.INVALID_TEMPLATE_DATA,
        `Invalid template data: ${validation.errors.join(', ')}`
      );
    }
    
    // Get the existing template
    const template = await this.getTemplate(templateId);
    
    try {
      // If updating content, validate it
      if (templateData.content) {
        // Update content in the template
        template.content = templateData.content;
        
        // If variables are updated, update them too
        if (templateData.variables) {
          template.variables = templateData.variables;
        }
        
        // Validate the updated content
        const contentValidation = template.validateContent();
        if (!contentValidation.valid) {
          logger.error('Invalid template content in update', { errors: contentValidation.errors });
          throw createError(
            ErrorCodes.INVALID_TEMPLATE_DATA,
            `Invalid template content: ${contentValidation.errors.join(', ')}`
          );
        }
      }
      
      // If isDefault is changing to true, update other templates
      if (templateData.isDefault === true && !template.isDefault) {
        await this.updateDefaultTemplateStatus(
          template.notificationType,
          template.channelType,
          template.locale
        );
      }
      
      // Update the template with the provided data
      const updateData: Partial<NotificationTemplate> = {
        ...templateData,
        updatedAt: new Date()
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Update the template
      const updatedTemplate = await NotificationTemplate.query()
        .updateAndFetchById(templateId, updateData);
      
      logger.info(`Updated template with ID: ${updatedTemplate.id}`);
      return updatedTemplate;
    } catch (error) {
      logger.error(`Failed to update template with ID: ${templateId}`, { error });
      throw createError(
        ErrorCodes.TEMPLATE_CREATION_FAILED,
        `Failed to update template with ID: ${templateId}`,
        { originalError: error }
      );
    }
  }

  /**
   * Deletes a notification template
   * 
   * @param templateId - ID of the template to delete
   * @returns True if deletion was successful
   * @throws Error if template deletion fails
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    // Get the template to check if it exists and if it's a default template
    const template = await this.getTemplate(templateId);
    
    // Don't allow deletion of default templates without alternate default
    if (template.isDefault) {
      // Check if there's another template that could become the default
      const alternateTemplate = await NotificationTemplate.query()
        .where('notificationType', template.notificationType)
        .where('channelType', template.channelType)
        .where('locale', template.locale)
        .where('id', '!=', templateId)
        .where('isActive', true)
        .first();
      
      if (!alternateTemplate) {
        logger.error(`Cannot delete default template with ID: ${templateId} as no alternate template exists`);
        throw createError(
          ErrorCodes.TEMPLATE_CREATION_FAILED,
          `Cannot delete default template with ID: ${templateId} as no alternate template exists`
        );
      }
      
      // Set the alternate template as default
      await this.setDefaultTemplate(alternateTemplate.id);
    }
    
    try {
      // Delete the template
      const deletedCount = await NotificationTemplate.query()
        .deleteById(templateId);
      
      if (deletedCount === 0) {
        logger.error(`Failed to delete template with ID: ${templateId}`);
        throw createError(
          ErrorCodes.TEMPLATE_CREATION_FAILED,
          `Failed to delete template with ID: ${templateId}`
        );
      }
      
      logger.info(`Deleted template with ID: ${templateId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete template with ID: ${templateId}`, { error });
      throw createError(
        ErrorCodes.TEMPLATE_CREATION_FAILED,
        `Failed to delete template with ID: ${templateId}`,
        { originalError: error }
      );
    }
  }

  /**
   * Renders a template with provided data
   * 
   * @param template - The template to render
   * @param data - Data to use for rendering
   * @returns Rendered template content
   * @throws Error if template rendering fails
   */
  async renderTemplate(
    template: NotificationTemplate,
    data: object
  ): Promise<object> {
    if (!template) {
      throw createError(ErrorCodes.TEMPLATE_RENDERING_FAILED, 'Template is required');
    }
    
    if (!data) {
      throw createError(ErrorCodes.TEMPLATE_RENDERING_FAILED, 'Data is required for rendering');
    }
    
    if (!template.isActive) {
      throw createError(
        ErrorCodes.TEMPLATE_RENDERING_FAILED,
        `Cannot render inactive template with ID: ${template.id}`
      );
    }
    
    try {
      // Ensure all required variables are provided
      for (const variable of template.variables) {
        if (!(variable in data)) {
          throw createError(
            ErrorCodes.TEMPLATE_RENDERING_FAILED,
            `Missing required variable: ${variable}`
          );
        }
      }
      
      // Render the template
      const renderedContent = template.render(data);
      
      logger.debug(`Rendered template with ID: ${template.id}`);
      return renderedContent;
    } catch (error) {
      logger.error(`Failed to render template with ID: ${template.id}`, { error });
      throw createError(
        ErrorCodes.TEMPLATE_RENDERING_FAILED,
        `Failed to render template: ${error.message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Gets all templates for a specific notification type
   * 
   * @param notificationType - Type of notification
   * @returns Array of templates for the notification type
   */
  async getTemplatesByType(notificationType: string): Promise<NotificationTemplate[]> {
    if (!notificationType) {
      throw createError(ErrorCodes.INVALID_TEMPLATE_DATA, 'Notification type is required');
    }
    
    logger.debug(`Getting templates for notification type: ${notificationType}`);
    
    const templates = await NotificationTemplate.query()
      .where('notificationType', notificationType);
    
    return templates;
  }

  /**
   * Gets all templates for a specific channel type
   * 
   * @param channelType - Type of channel
   * @returns Array of templates for the channel type
   */
  async getTemplatesByChannel(channelType: string): Promise<NotificationTemplate[]> {
    if (!channelType) {
      throw createError(ErrorCodes.INVALID_TEMPLATE_DATA, 'Channel type is required');
    }
    
    logger.debug(`Getting templates for channel type: ${channelType}`);
    
    const templates = await NotificationTemplate.query()
      .where('channelType', channelType);
    
    return templates;
  }

  /**
   * Sets a template as the default for its notification type and channel
   * 
   * @param templateId - ID of the template to set as default
   * @returns The updated template
   * @throws Error if setting default template fails
   */
  async setDefaultTemplate(templateId: string): Promise<NotificationTemplate> {
    // Get the template
    const template = await this.getTemplate(templateId);
    
    try {
      // Begin a transaction to ensure atomicity
      const updatedTemplate = await Transaction.transaction(
        NotificationTemplate.knex(),
        async (trx) => {
          // Find the current default template
          const currentDefault = await NotificationTemplate.query(trx)
            .where('notificationType', template.notificationType)
            .where('channelType', template.channelType)
            .where('locale', template.locale)
            .where('isDefault', true)
            .where('id', '!=', templateId)
            .first();
          
          // If there's a current default, update it
          if (currentDefault) {
            await NotificationTemplate.query(trx)
              .updateAndFetchById(currentDefault.id, { isDefault: false });
            
            logger.debug(`Removed default status from template with ID: ${currentDefault.id}`);
          }
          
          // Set the new template as default
          const updated = await NotificationTemplate.query(trx)
            .updateAndFetchById(templateId, { isDefault: true });
          
          logger.info(`Set template with ID: ${templateId} as default`);
          return updated;
        }
      );
      
      return updatedTemplate;
    } catch (error) {
      logger.error(`Failed to set template with ID: ${templateId} as default`, { error });
      throw createError(
        ErrorCodes.TEMPLATE_CREATION_FAILED,
        `Failed to set template with ID: ${templateId} as default`,
        { originalError: error }
      );
    }
  }

  /**
   * Validates template data before creation or update
   * 
   * @param data - Template data to validate
   * @param isUpdate - Whether this is an update operation
   * @returns Validation result with any errors
   */
  validateTemplateData(
    data: Partial<TemplateCreateData>,
    isUpdate: boolean
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields for creation
    if (!isUpdate) {
      if (!data.name) errors.push('Template name is required');
      if (!data.notificationType) errors.push('Notification type is required');
      if (!data.channelType) errors.push('Channel type is required');
      if (!data.content) errors.push('Template content is required');
    }
    
    // Validate notification type if provided
    if (data.notificationType && !Object.values(NotificationType).includes(data.notificationType)) {
      errors.push(`Invalid notification type: ${data.notificationType}`);
    }
    
    // Validate channel type if provided
    if (data.channelType && !Object.values(NotificationChannelType).includes(data.channelType)) {
      errors.push(`Invalid channel type: ${data.channelType}`);
    }
    
    // Validate locale if provided
    if (data.locale && !Object.values(TemplateLocale).includes(data.locale)) {
      errors.push(`Invalid locale: ${data.locale}`);
    }
    
    // Validate content structure based on channel type
    if (data.content && data.channelType) {
      switch (data.channelType) {
        case NotificationChannelType.EMAIL:
          const emailContent = data.content as any;
          if (!emailContent.subject) errors.push('Email subject is required');
          if (!emailContent.html) errors.push('Email HTML content is required');
          if (!emailContent.text) errors.push('Email text content is required');
          break;
          
        case NotificationChannelType.SMS:
          const smsContent = data.content as any;
          if (!smsContent.text) errors.push('SMS text content is required');
          break;
          
        case NotificationChannelType.PUSH:
          const pushContent = data.content as any;
          if (!pushContent.title) errors.push('Push notification title is required');
          if (!pushContent.body) errors.push('Push notification body is required');
          break;
          
        case NotificationChannelType.IN_APP:
          const inAppContent = data.content as any;
          if (!inAppContent.title) errors.push('In-app notification title is required');
          if (!inAppContent.body) errors.push('In-app notification body is required');
          break;
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Creates default templates for all notification types and channels
   * 
   * @returns Number of templates created
   */
  async createDefaultTemplates(): Promise<number> {
    let createdCount = 0;
    
    // Create default templates for each notification type and channel type combination
    for (const notificationType of Object.values(NotificationType)) {
      for (const channelType of Object.values(NotificationChannelType)) {
        // Check if a default template already exists
        const existingTemplate = await NotificationTemplate.getDefaultTemplate(
          notificationType,
          channelType
        );
        
        if (!existingTemplate) {
          // Create default template
          await NotificationTemplate.createDefaultTemplate(
            notificationType,
            channelType
          );
          
          createdCount++;
          logger.info(`Created default template for ${notificationType} via ${channelType}`);
        }
      }
    }
    
    logger.info(`Created ${createdCount} default templates`);
    return createdCount;
  }

  /**
   * Updates the default template status for a notification type, channel, and locale
   * 
   * @param notificationType - Type of notification
   * @param channelType - Type of channel
   * @param locale - Locale
   */
  private async updateDefaultTemplateStatus(
    notificationType: string,
    channelType: string,
    locale: string
  ): Promise<void> {
    try {
      // Begin a transaction to ensure atomicity
      await Transaction.transaction(
        NotificationTemplate.knex(),
        async (trx) => {
          // Find the current default template
          const currentDefault = await NotificationTemplate.query(trx)
            .where('notificationType', notificationType)
            .where('channelType', channelType)
            .where('locale', locale)
            .where('isDefault', true)
            .first();
          
          // If there's a current default, update it
          if (currentDefault) {
            await NotificationTemplate.query(trx)
              .updateAndFetchById(currentDefault.id, { isDefault: false });
            
            logger.debug(`Removed default status from template with ID: ${currentDefault.id}`);
          }
        }
      );
    } catch (error) {
      logger.error('Failed to update default template status', { error });
      throw error;
    }
  }

  /**
   * Registers custom Handlebars helpers for template rendering
   */
  private registerHelpers(): void {
    // Date formatting helper
    this.Handlebars.registerHelper('formatDate', (date, format) => {
      if (!date) return '';
      
      const d = new Date(date);
      
      // Simple format implementation
      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
      }
      
      return d.toISOString();
    });
    
    // Currency formatting helper
    this.Handlebars.registerHelper('formatCurrency', (amount, currency = 'USD') => {
      if (amount === undefined || amount === null) return '';
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    });
    
    // Number formatting helper
    this.Handlebars.registerHelper('formatNumber', (number, decimals = 0) => {
      if (number === undefined || number === null) return '';
      
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(number);
    });
    
    // Equality comparison helper
    this.Handlebars.registerHelper('eq', function(v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
    
    // Not equal comparison helper
    this.Handlebars.registerHelper('neq', function(v1, v2, options) {
      if (v1 !== v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
    
    // Greater than helper
    this.Handlebars.registerHelper('gt', function(v1, v2, options) {
      if (v1 > v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
    
    // Less than helper
    this.Handlebars.registerHelper('lt', function(v1, v2, options) {
      if (v1 < v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
    
    // String uppercase helper
    this.Handlebars.registerHelper('uppercase', (str) => {
      if (!str) return '';
      return str.toUpperCase();
    });
    
    // String lowercase helper
    this.Handlebars.registerHelper('lowercase', (str) => {
      if (!str) return '';
      return str.toLowerCase();
    });
    
    // Truncate helper
    this.Handlebars.registerHelper('truncate', (str, length) => {
      if (!str) return '';
      if (str.length <= length) return str;
      return str.substring(0, length) + '...';
    });
  }
}

export { TemplateService, TemplateCreateData, TemplateUpdateData, TemplateQueryOptions };