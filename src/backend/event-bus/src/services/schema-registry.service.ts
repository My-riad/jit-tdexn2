import { Schema, Type } from 'avsc'; // avsc@5.7.0
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry'; // @kafkajs/confluent-schema-registry@3.3.0

import {
  SCHEMA_REGISTRY_URL,
  SCHEMA_REGISTRY_ENABLED,
  SCHEMA_VALIDATION_ENABLED
} from '../config';
import { Event } from '../../../common/interfaces/event.interface';
import { EventTypes } from '../../../common/constants/event-types';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';
import {
  driverEventSchemas
} from '../schemas/driver-events.schema';
import {
  loadEventSchemas
} from '../schemas/load-events.schema';
import {
  positionEventSchemas
} from '../schemas/position-events.schema';
import {
  optimizationEventSchemas
} from '../schemas/optimization-events.schema';
import {
  gamificationEventSchemas
} from '../schemas/gamification-events.schema';
import {
  marketEventSchemas
} from '../schemas/market-events.schema';
import {
  notificationEventSchemas
} from '../schemas/notification-events.schema';

/**
 * Interface for schema validation errors
 */
export interface ValidationError {
  message: string;
  path: string[];
  value: any;
  type: string;
}

/**
 * Interface defining the public API of the SchemaRegistryService
 */
export interface SchemaRegistryInterface {
  /**
   * Validates an event against its schema
   * @param event The event to validate
   * @returns Promise that resolves to true if validation succeeds
   */
  validateEvent<T extends Event>(event: T): Promise<boolean>;

  /**
   * Gets the schema for a specific event type
   * @param eventType The event type
   * @returns Schema for the event type or null if not found
   */
  getSchema(eventType: string): Schema | null;

  /**
   * Registers a schema with the Confluent Schema Registry
   * @param subject The subject to register the schema under
   * @param schema The schema to register
   * @returns Promise that resolves to the schema ID
   */
  registerSchema(subject: string, schema: Schema): Promise<number>;

  /**
   * Gets a registered schema from the Confluent Schema Registry
   * @param subject The subject of the schema
   * @param version The version of the schema
   * @returns Promise that resolves to the schema
   */
  getRegisteredSchema(subject: string, version: number): Promise<Schema>;

  /**
   * Encodes a message using the registered schema
   * @param schemaId The ID of the schema to use for encoding
   * @param message The message to encode
   * @returns Promise that resolves to the encoded message
   */
  encodeMessage(schemaId: number, message: any): Promise<Buffer>;

  /**
   * Decodes a message using the schema registry
   * @param message The message to decode
   * @returns Promise that resolves to the decoded message
   */
  decodeMessage(message: Buffer): Promise<any>;
}

/**
 * Service that manages schema validation and registration for the event bus
 */
export class SchemaRegistryService implements SchemaRegistryInterface {
  private schemaRegistry: SchemaRegistry | null = null;
  private isEnabled: boolean = false;
  private schemaCache: Map<string, Schema> = new Map();
  private eventSchemas: Record<string, Record<string, Schema>> = {
    driverEventSchemas: driverEventSchemas,
    loadEventSchemas: loadEventSchemas,
    positionEventSchemas: positionEventSchemas,
    optimizationEventSchemas: optimizationEventSchemas,
    gamificationEventSchemas: gamificationEventSchemas,
    marketEventSchemas: marketEventSchemas,
    notificationEventSchemas: notificationEventSchemas
  };

  /**
   * Creates a new SchemaRegistryService instance
   */
  constructor() {
    // Check if schema registry is enabled via configuration
    this.isEnabled = SCHEMA_REGISTRY_ENABLED;

    if (this.isEnabled) {
      // Initialize schema registry client if enabled
      this.schemaRegistry = new SchemaRegistry({ host: SCHEMA_REGISTRY_URL });
      logger.info('SchemaRegistryService initialized with schema registry.');
    } else {
      logger.warn('SchemaRegistryService is disabled via configuration.');
    }

    // Load all event schemas from schema definition files
    this.loadEventSchemas();

    logger.info(`SchemaRegistryService initialized. isEnabled: ${this.isEnabled}`);
  }

  /**
   * Validates an event against its schema
   * @param event The event to validate
   * @returns Promise that resolves to true if validation succeeds
   */
  async validateEvent<T extends Event>(event: T): Promise<boolean> {
    // Check if schema validation is enabled, return true if not
    if (!SCHEMA_VALIDATION_ENABLED) {
      logger.debug('Schema validation is disabled, skipping validation.');
      return true;
    }

    // Extract event type from event metadata
    const eventType = event.metadata.event_type;

    // Get the appropriate schema for the event type
    const schema = this.getSchema(eventType);

    // If no schema exists, log warning and return true
    if (!schema) {
      logger.warn(`No schema found for event type: ${eventType}. Skipping validation.`);
      return true;
    }

    try {
      // Validate the event against the schema
      const avroType = Type.forSchema(schema);
      avroType.fromBuffer(Buffer.from(JSON.stringify(event.payload)));
      return true; // Return true if validation succeeds
    } catch (error: any) {
      // Throw validation error with details if validation fails
      logger.error(`Event validation failed for event type: ${eventType}`, {
        error: error.message,
        event: event
      });
      throw new AppError(`Event validation failed for event type: ${eventType}: ${error.message}`, {
        code: 'VAL_INVALID_INPUT',
        details: {
          message: error.message,
          path: error.path,
          value: error.value,
          type: error.type
        } as ValidationError
      });
    }
  }

  /**
   * Gets the schema for a specific event type
   * @param eventType The event type
   * @returns Schema for the event type or null if not found
   */
  getSchema(eventType: string): Schema | null {
    // Check if schema is already in cache, return it if found
    if (this.schemaCache.has(eventType)) {
      return this.schemaCache.get(eventType) || null;
    }

    let schema: Schema | undefined;

    // Find the schema category based on event type
    for (const category in this.eventSchemas) {
      if (Object.prototype.hasOwnProperty.call(this.eventSchemas, category)) {
        const schemas = this.eventSchemas[category];
        if (schemas && schemas[eventType]) {
          schema = schemas[eventType];
          break;
        }
      }
    }

    // If schema is found, compile it and cache it
    if (schema) {
      this.schemaCache.set(eventType, schema);
      return schema; // Return the schema
    }

    return null; // Return null if not found
  }

  /**
   * Registers a schema with the Confluent Schema Registry
   * @param subject The subject to register the schema under
   * @param schema The schema to register
   * @returns Promise that resolves to the schema ID
   */
  async registerSchema(subject: string, schema: Schema): Promise<number> {
    // Check if schema registry is enabled, throw error if not
    if (!this.isEnabled || !this.schemaRegistry) {
      throw new AppError('Schema Registry is disabled.', { code: 'SRV_SERVICE_UNAVAILABLE' });
    }

    try {
      // Register the schema with the Confluent Schema Registry
      const schemaId = await this.schemaRegistry.register(subject, schema);
      logger.info(`Schema registered successfully for subject: ${subject}, schemaId: ${schemaId}`);
      return schemaId; // Return the schema ID
    } catch (error: any) {
      // Log registration failure
      logger.error(`Schema registration failed for subject: ${subject}`, { error: error.message });
      throw new AppError(`Schema registration failed for subject: ${subject}: ${error.message}`, {
        code: 'SRV_INTERNAL_ERROR',
        details: { subject: subject, schema: schema, error: error.message }
      });
    }
  }

  /**
   * Gets a registered schema from the Confluent Schema Registry
   * @param subject The subject of the schema
   * @param version The version of the schema
   * @returns Promise that resolves to the schema
   */
  async getRegisteredSchema(subject: string, version: number): Promise<Schema> {
    // Check if schema registry is enabled, throw error if not
    if (!this.isEnabled || !this.schemaRegistry) {
      throw new AppError('Schema Registry is disabled.', { code: 'SRV_SERVICE_UNAVAILABLE' });
    }

    try {
      // Get the schema from the Confluent Schema Registry
      const schema = await this.schemaRegistry.getSchema(subject, version);
      return schema; // Return the schema
    } catch (error: any) {
      // Log schema retrieval failure
      logger.error(`Schema retrieval failed for subject: ${subject}, version: ${version}`, { error: error.message });
      throw new AppError(`Schema retrieval failed for subject: ${subject}, version: ${version}: ${error.message}`, {
        code: 'RES_SCHEMA_NOT_FOUND',
        details: { subject: subject, version: version, error: error.message }
      });
    }
  }

  /**
   * Encodes a message using the registered schema
   * @param schemaId The ID of the schema to use for encoding
   * @param message The message to encode
   * @returns Promise that resolves to the encoded message
   */
  async encodeMessage(schemaId: number, message: any): Promise<Buffer> {
    // Check if schema registry is enabled, throw error if not
    if (!this.isEnabled || !this.schemaRegistry) {
      throw new AppError('Schema Registry is disabled.', { code: 'SRV_SERVICE_UNAVAILABLE' });
    }

    try {
      // Encode the message using the schema ID
      const encodedMessage = await this.schemaRegistry.encode(schemaId, message);
      return encodedMessage; // Return the encoded message buffer
    } catch (error: any) {
      // Log encoding failure
      logger.error(`Message encoding failed for schemaId: ${schemaId}`, { error: error.message });
      throw new AppError(`Message encoding failed for schemaId: ${schemaId}: ${error.message}`, {
        code: 'SRV_INTERNAL_ERROR',
        details: { schemaId: schemaId, message: message, error: error.message }
      });
    }
  }

  /**
   * Decodes a message using the schema registry
   * @param message The message to decode
   * @returns Promise that resolves to the decoded message
   */
  async decodeMessage(message: Buffer): Promise<any> {
    // Check if schema registry is enabled, throw error if not
    if (!this.isEnabled || !this.schemaRegistry) {
      throw new AppError('Schema Registry is disabled.', { code: 'SRV_SERVICE_UNAVAILABLE' });
    }

    try {
      // Decode the message using the schema registry
      const decodedMessage = await this.schemaRegistry.decode(message);
      return decodedMessage; // Return the decoded message
    } catch (error: any) {
      // Log decoding failure
      logger.error('Message decoding failed', { error: error.message });
      throw new AppError(`Message decoding failed: ${error.message}`, {
        code: 'SRV_INTERNAL_ERROR',
        details: { error: error.message }
      });
    }
  }

  /**
   * Loads all event schemas from schema definition files
   */
  loadEventSchemas(): void {
    let totalSchemas = 0;

    // Load driver event schemas
    Object.keys(driverEventSchemas).forEach(key => {
      this.schemaCache.set(key, driverEventSchemas[key]);
    });
    totalSchemas += Object.keys(driverEventSchemas).length;

    // Load load event schemas
    Object.keys(loadEventSchemas).forEach(key => {
      this.schemaCache.set(key, loadEventSchemas[key]);
    });
    totalSchemas += Object.keys(loadEventSchemas).length;

    // Load position event schemas
    Object.keys(positionEventSchemas).forEach(key => {
      this.schemaCache.set(key, positionEventSchemas[key]);
    });
    totalSchemas += Object.keys(positionEventSchemas).length;

    // Load optimization event schemas
    Object.keys(optimizationEventSchemas).forEach(key => {
      this.schemaCache.set(key, optimizationEventSchemas[key]);
    });
    totalSchemas += Object.keys(optimizationEventSchemas).length;

    // Load gamification event schemas
    Object.keys(gamificationEventSchemas).forEach(key => {
      this.schemaCache.set(key, gamificationEventSchemas[key]);
    });
    totalSchemas += Object.keys(gamificationEventSchemas).length;

    // Load market event schemas
    Object.keys(marketEventSchemas).forEach(key => {
      this.schemaCache.set(key, marketEventSchemas[key]);
    });
    totalSchemas += Object.keys(marketEventSchemas).length;

    // Load notification event schemas
    Object.keys(notificationEventSchemas).forEach(key => {
      this.schemaCache.set(key, notificationEventSchemas[key]);
    });
    totalSchemas += Object.keys(notificationEventSchemas).length;

    // Log the number of loaded schemas
    logger.info(`Loaded ${totalSchemas} event schemas into the schema cache.`);
  }
}

// Export the class
export default SchemaRegistryService;