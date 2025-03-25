import { Model } from 'src/backend/common/models/index.ts'; // Base model class for database operations
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { NotificationType } from './notification-preference.model'; // Notification types supported by the system
import { NotificationChannelType } from './notification-channel.model'; // Channel types supported by the system
import Handlebars from 'handlebars'; // v4.7.7

/**
 * Enum defining the supported locales for notification templates
 */
export enum TemplateLocale {
  EN_US = 'en_US',
  ES_US = 'es_US',
  FR_CA = 'fr_CA'
}

/**
 * Interface defining the structure of email template content
 */
export interface EmailTemplateContent {
  /**
   * Email subject line
   */
  subject: string;
  
  /**
   * HTML content of the email
   */
  html: string;
  
  /**
   * Plain text version of the email
   */
  text: string;
}

/**
 * Interface defining the structure of SMS template content
 */
export interface SMSTemplateContent {
  /**
   * Text content of the SMS message
   */
  text: string;
}

/**
 * Interface defining the structure of push notification template content
 */
export interface PushTemplateContent {
  /**
   * Title of the push notification
   */
  title: string;
  
  /**
   * Body text of the push notification
   */
  body: string;
  
  /**
   * Optional icon URL for the push notification
   */
  icon?: string;
  
  /**
   * Optional additional data to include with the push notification
   */
  data?: Record<string, any>;
}

/**
 * Interface defining the structure of in-app notification template content
 */
export interface InAppTemplateContent {
  /**
   * Title of the in-app notification
   */
  title: string;
  
  /**
   * Body text of the in-app notification
   */
  body: string;
  
  /**
   * Optional icon URL for the in-app notification
   */
  icon?: string;
  
  /**
   * Optional URL to navigate to when the notification is clicked
   */
  actionUrl?: string;
}

/**
 * Union type for all template content types
 */
export type TemplateContent = 
  EmailTemplateContent | 
  SMSTemplateContent | 
  PushTemplateContent | 
  InAppTemplateContent;

/**
 * Model representing a notification template used for generating notification content
 * for different channels and notification types.
 */
export class NotificationTemplate extends Model {
  /**
   * Unique identifier for the notification template
   */
  id!: string;
  
  /**
   * Name of the template for easy reference
   */
  name!: string;
  
  /**
   * Optional description of the template
   */
  description?: string;
  
  /**
   * Type of notification this template is for
   */
  notificationType!: NotificationType;
  
  /**
   * Channel type this template is designed for
   */
  channelType!: NotificationChannelType;
  
  /**
   * Content of the template, structure depends on channel type
   */
  content!: TemplateContent;
  
  /**
   * Array of variable names that can be used in this template
   */
  variables!: string[];
  
  /**
   * Locale of the template (e.g., en_US, es_US, fr_CA)
   */
  locale!: string;
  
  /**
   * Version of the template (for tracking changes)
   */
  version!: string;
  
  /**
   * Whether this is the default template for this notification type and channel
   */
  isDefault!: boolean;
  
  /**
   * Whether this template is currently active
   */
  isActive!: boolean;
  
  /**
   * Timestamp when the notification template was created
   */
  createdAt!: Date;
  
  /**
   * Timestamp when the notification template was last updated
   */
  updatedAt!: Date;

  /**
   * Creates a new notification template instance
   */
  constructor() {
    super();
    
    // Initialize default values if not provided
    this.variables = [];
    this.isActive = true;
    this.isDefault = false;
    this.locale = TemplateLocale.EN_US;
    this.version = '1.0';
  }

  /**
   * Defines the database table name for this model
   */
  static get tableName(): string {
    return 'notification_templates';
  }

  /**
   * Defines the JSON schema for validation of notification template objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'notificationType', 'channelType', 'content'],

      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        notificationType: { 
          type: 'string', 
          enum: Object.values(NotificationType) 
        },
        channelType: { 
          type: 'string', 
          enum: Object.values(NotificationChannelType) 
        },
        content: { 
          type: 'object',
          // Content schema depends on the channel type
          // This will be validated in custom validation logic
        },
        variables: { 
          type: 'array',
          items: { type: 'string' }
        },
        locale: { 
          type: 'string', 
          enum: Object.values(TemplateLocale)
        },
        version: { type: 'string' },
        isDefault: { type: 'boolean' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Lifecycle hook that runs before inserting a new record
   */
  $beforeInsert(): void {
    this.id = this.id || uuidv4();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Set default values for optional fields if not provided
    this.variables = this.variables || [];
    this.isActive = this.isActive !== undefined ? this.isActive : true;
    this.isDefault = this.isDefault !== undefined ? this.isDefault : false;
    this.locale = this.locale || TemplateLocale.EN_US;
    this.version = this.version || '1.0';
    this.description = this.description || '';
  }

  /**
   * Lifecycle hook that runs before updating an existing record
   */
  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  /**
   * Defines relationships with other models
   */
  static get relationMappings() {
    return {
      notifications: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/notification.model`,
        join: {
          from: 'notification_templates.id',
          to: 'notifications.templateId'
        }
      }
    };
  }

  /**
   * Renders the template with provided data
   * 
   * @param data Object containing values for variables in the template
   * @returns Rendered template content
   */
  render(data: Record<string, any>): TemplateContent {
    // Validate that the template is active
    if (!this.isActive) {
      throw new Error(`Template ${this.id} is not active`);
    }
    
    // Validate that all required variables are provided in the data
    for (const variable of this.variables) {
      if (!(variable in data)) {
        throw new Error(`Missing required variable: ${variable}`);
      }
    }
    
    // Create a deep copy of the content to avoid modifying the original
    const content = JSON.parse(JSON.stringify(this.content));
    
    // Render the content based on the channel type
    switch (this.channelType) {
      case NotificationChannelType.EMAIL:
        const emailContent = content as EmailTemplateContent;
        emailContent.subject = Handlebars.compile(emailContent.subject)(data);
        emailContent.html = Handlebars.compile(emailContent.html)(data);
        emailContent.text = Handlebars.compile(emailContent.text)(data);
        return emailContent;
        
      case NotificationChannelType.SMS:
        const smsContent = content as SMSTemplateContent;
        smsContent.text = Handlebars.compile(smsContent.text)(data);
        return smsContent;
        
      case NotificationChannelType.PUSH:
        const pushContent = content as PushTemplateContent;
        pushContent.title = Handlebars.compile(pushContent.title)(data);
        pushContent.body = Handlebars.compile(pushContent.body)(data);
        return pushContent;
        
      case NotificationChannelType.IN_APP:
        const inAppContent = content as InAppTemplateContent;
        inAppContent.title = Handlebars.compile(inAppContent.title)(data);
        inAppContent.body = Handlebars.compile(inAppContent.body)(data);
        return inAppContent;
        
      default:
        throw new Error(`Unsupported channel type: ${this.channelType}`);
    }
  }

  /**
   * Gets the default template for a specific notification type, channel type, and locale
   * 
   * @param notificationType Type of notification
   * @param channelType Type of channel
   * @param locale Locale of the template
   * @returns The default template if found, null otherwise
   */
  static async getDefaultTemplate(
    notificationType: NotificationType,
    channelType: NotificationChannelType,
    locale: string = TemplateLocale.EN_US
  ): Promise<NotificationTemplate | null> {
    // Try to find a template matching the criteria
    let template = await this.query()
      .where('notificationType', notificationType)
      .where('channelType', channelType)
      .where('locale', locale)
      .where('isDefault', true)
      .where('isActive', true)
      .first();
    
    // If not found and locale is not the default, try to find a default template in the default locale
    if (!template && locale !== TemplateLocale.EN_US) {
      template = await this.query()
        .where('notificationType', notificationType)
        .where('channelType', channelType)
        .where('locale', TemplateLocale.EN_US)
        .where('isDefault', true)
        .where('isActive', true)
        .first();
    }
    
    return template || null;
  }

  /**
   * Creates a default template for a specific notification type and channel type
   * 
   * @param notificationType Type of notification
   * @param channelType Type of channel
   * @param locale Locale of the template
   * @returns The created default template
   */
  static async createDefaultTemplate(
    notificationType: NotificationType,
    channelType: NotificationChannelType,
    locale: string = TemplateLocale.EN_US
  ): Promise<NotificationTemplate> {
    // Generate a default name
    const name = `Default ${notificationType} template for ${channelType} (${locale})`;
    
    // Generate default content based on channel type
    let content: TemplateContent;
    let variables: string[] = ['firstName', 'lastName'];
    
    switch (channelType) {
      case NotificationChannelType.EMAIL:
        content = {
          subject: 'Notification from Freight Optimization Platform',
          html: '<p>Hello {{firstName}} {{lastName}},</p><p>This is a notification from the Freight Optimization Platform.</p>',
          text: 'Hello {{firstName}} {{lastName}}, This is a notification from the Freight Optimization Platform.'
        };
        break;
        
      case NotificationChannelType.SMS:
        content = {
          text: 'Hello {{firstName}}, This is a notification from the Freight Optimization Platform.'
        };
        break;
        
      case NotificationChannelType.PUSH:
        content = {
          title: 'Freight Optimization',
          body: 'Hello {{firstName}}, you have a new notification.'
        };
        break;
        
      case NotificationChannelType.IN_APP:
        content = {
          title: 'Notification',
          body: 'Hello {{firstName}}, you have a new notification.',
          actionUrl: '/notifications'
        };
        break;
        
      default:
        throw new Error(`Unsupported channel type: ${channelType}`);
    }
    
    // Add notification-type specific variables
    switch (notificationType) {
      case NotificationType.LOAD_OPPORTUNITY:
        variables = [...variables, 'loadId', 'origin', 'destination', 'rate'];
        break;
        
      case NotificationType.LOAD_STATUS:
        variables = [...variables, 'loadId', 'status', 'location'];
        break;
        
      case NotificationType.ACHIEVEMENT:
        variables = [...variables, 'achievementName', 'points'];
        break;
        
      case NotificationType.PAYMENT:
        variables = [...variables, 'amount', 'loadId', 'paymentDate'];
        break;
    }
    
    // Create the template
    const template = new NotificationTemplate();
    template.name = name;
    template.description = `Automatically generated default template for ${notificationType} notifications via ${channelType}`;
    template.notificationType = notificationType;
    template.channelType = channelType;
    template.content = content;
    template.variables = variables;
    template.locale = locale;
    template.isDefault = true;
    template.isActive = true;
    
    // Save to database
    return this.query().insert(template);
  }

  /**
   * Validates the template content for the specified channel type
   * 
   * @returns Validation result with any errors
   */
  validateContent(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate content structure based on channel type
    switch (this.channelType) {
      case NotificationChannelType.EMAIL:
        const emailContent = this.content as EmailTemplateContent;
        if (!emailContent.subject) errors.push('Email subject is required');
        if (!emailContent.html) errors.push('Email HTML content is required');
        if (!emailContent.text) errors.push('Email text content is required');
        break;
        
      case NotificationChannelType.SMS:
        const smsContent = this.content as SMSTemplateContent;
        if (!smsContent.text) errors.push('SMS text content is required');
        break;
        
      case NotificationChannelType.PUSH:
        const pushContent = this.content as PushTemplateContent;
        if (!pushContent.title) errors.push('Push notification title is required');
        if (!pushContent.body) errors.push('Push notification body is required');
        break;
        
      case NotificationChannelType.IN_APP:
        const inAppContent = this.content as InAppTemplateContent;
        if (!inAppContent.title) errors.push('In-app notification title is required');
        if (!inAppContent.body) errors.push('In-app notification body is required');
        break;
        
      default:
        errors.push(`Unsupported channel type: ${this.channelType}`);
    }
    
    // Validate that all variables used in the content are defined
    const contentStr = JSON.stringify(this.content);
    const variableRegex = /{{([^}]+)}}/g;
    let match;
    
    while ((match = variableRegex.exec(contentStr)) !== null) {
      const variable = match[1].trim();
      if (!this.variables.includes(variable)) {
        errors.push(`Template uses undefined variable: ${variable}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}