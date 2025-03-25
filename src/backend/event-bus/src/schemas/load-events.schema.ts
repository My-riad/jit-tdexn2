/**
 * Load Events Schema
 * 
 * This file defines Avro schemas for load-related events in the Kafka event bus.
 * It ensures consistent event structure and validation for all load events
 * published to the load events topic, enabling reliable event-driven
 * communication between microservices.
 */

import { Schema } from 'avsc'; // avsc@5.7.0
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import { LoadStatus, EquipmentType, LoadAssignmentType } from '../../../common/interfaces/load.interface';
import { LOAD_EVENTS } from '../config/topics';

/**
 * Schema definition for load event metadata
 * This schema defines the common metadata fields that are included with all load events
 */
export const loadEventMetadataSchema: Schema = {
  type: 'record',
  name: 'LoadEventMetadata',
  fields: [
    { name: 'event_id', type: 'string' },
    { name: 'event_type', type: 'string' },
    { name: 'event_version', type: 'string' },
    { name: 'event_time', type: 'string' },
    { name: 'producer', type: 'string' },
    { name: 'correlation_id', type: 'string' },
    { name: 'category', type: 'string', default: EventCategories.LOAD }
  ]
};

/**
 * Schema definition for LOAD_CREATED event payload
 * This schema defines the data structure for events triggered when a new load is created
 */
export const loadCreatedSchema: Schema = {
  type: 'record',
  name: 'LoadCreatedPayload',
  fields: [
    { name: 'load_id', type: 'string' },
    { name: 'shipper_id', type: 'string' },
    { name: 'reference_number', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'equipment_type', type: 'string' }, // Will contain EquipmentType enum values
    { name: 'weight', type: 'double' },
    { 
      name: 'dimensions', 
      type: {
        type: 'record',
        name: 'Dimensions',
        fields: [
          { name: 'length', type: 'double' },
          { name: 'width', type: 'double' },
          { name: 'height', type: 'double' }
        ]
      }
    },
    { name: 'volume', type: ['null', 'double'], default: null },
    { name: 'pallets', type: ['null', 'int'], default: null },
    { name: 'commodity', type: 'string' },
    { name: 'status', type: 'string' }, // Will contain LoadStatus enum values
    { name: 'pickup_earliest', type: 'string' }, // ISO timestamp
    { name: 'pickup_latest', type: 'string' }, // ISO timestamp
    { name: 'delivery_earliest', type: 'string' }, // ISO timestamp
    { name: 'delivery_latest', type: 'string' }, // ISO timestamp
    { name: 'offered_rate', type: 'double' },
    { name: 'special_instructions', type: ['null', 'string'], default: null },
    { name: 'is_hazardous', type: 'boolean' },
    { 
      name: 'temperature_requirements', 
      type: ['null', {
        type: 'record',
        name: 'TemperatureRequirements',
        fields: [
          { name: 'min_temp', type: 'double' },
          { name: 'max_temp', type: 'double' },
          { name: 'unit', type: 'string' } // e.g., "F" for Fahrenheit
        ]
      }], 
      default: null 
    },
    {
      name: 'locations',
      type: {
        type: 'array',
        items: {
          type: 'record',
          name: 'LoadLocation',
          fields: [
            { name: 'location_id', type: 'string' },
            { name: 'location_type', type: 'string' }, // Pickup, Delivery, Stop
            { name: 'facility_name', type: ['null', 'string'], default: null },
            { name: 'address', type: 'string' },
            { name: 'city', type: 'string' },
            { name: 'state', type: 'string' },
            { name: 'zip', type: 'string' },
            { name: 'latitude', type: 'double' },
            { name: 'longitude', type: 'double' },
            { name: 'earliest_time', type: 'string' }, // ISO timestamp
            { name: 'latest_time', type: 'string' }, // ISO timestamp
            { name: 'contact_name', type: ['null', 'string'], default: null },
            { name: 'contact_phone', type: ['null', 'string'], default: null },
            { name: 'special_instructions', type: ['null', 'string'], default: null }
          ]
        }
      }
    },
    { name: 'created_at', type: 'string' } // ISO timestamp
  ]
};

/**
 * Schema definition for LOAD_UPDATED event payload
 * This schema defines the data structure for events triggered when a load is updated
 */
export const loadUpdatedSchema: Schema = {
  type: 'record',
  name: 'LoadUpdatedPayload',
  fields: [
    { name: 'load_id', type: 'string' },
    { name: 'shipper_id', type: 'string' },
    { name: 'reference_number', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'equipment_type', type: 'string' },
    { name: 'weight', type: 'double' },
    { name: 'dimensions', type: 'Dimensions' }, // Reuse the Dimensions record
    { name: 'volume', type: ['null', 'double'], default: null },
    { name: 'pallets', type: ['null', 'int'], default: null },
    { name: 'commodity', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'pickup_earliest', type: 'string' },
    { name: 'pickup_latest', type: 'string' },
    { name: 'delivery_earliest', type: 'string' },
    { name: 'delivery_latest', type: 'string' },
    { name: 'offered_rate', type: 'double' },
    { name: 'special_instructions', type: ['null', 'string'], default: null },
    { name: 'is_hazardous', type: 'boolean' },
    { name: 'temperature_requirements', type: ['null', 'TemperatureRequirements'], default: null },
    { name: 'updated_at', type: 'string' }, // ISO timestamp
    { name: 'updated_by', type: 'string' }, // User ID or system identifier
    { name: 'updated_fields', type: { type: 'array', items: 'string' } } // List of fields that were updated
  ]
};

/**
 * Schema definition for LOAD_DELETED event payload
 * This schema defines the data structure for events triggered when a load is deleted
 */
export const loadDeletedSchema: Schema = {
  type: 'record',
  name: 'LoadDeletedPayload',
  fields: [
    { name: 'load_id', type: 'string' },
    { name: 'shipper_id', type: 'string' },
    { name: 'deleted_at', type: 'string' }, // ISO timestamp
    { name: 'deleted_by', type: 'string' }, // User ID or system identifier
    { name: 'reason', type: ['null', 'string'], default: null }
  ]
};

/**
 * Schema definition for LOAD_STATUS_CHANGED event payload
 * This schema defines the data structure for events triggered when a load's status changes
 */
export const loadStatusChangedSchema: Schema = {
  type: 'record',
  name: 'LoadStatusChangedPayload',
  fields: [
    { name: 'load_id', type: 'string' },
    { name: 'previous_status', type: 'string' }, // Previous LoadStatus
    { name: 'new_status', type: 'string' }, // New LoadStatus
    { name: 'timestamp', type: 'string' }, // ISO timestamp
    { name: 'actor_id', type: 'string' }, // User or system that changed the status
    { name: 'actor_type', type: 'string' }, // "driver", "shipper", "system", etc.
    { 
      name: 'location', 
      type: ['null', {
        type: 'record',
        name: 'Location',
        fields: [
          { name: 'latitude', type: 'double' },
          { name: 'longitude', type: 'double' }
        ]
      }],
      default: null
    },
    { 
      name: 'status_details', 
      type: ['null', { 
        type: 'map', 
        values: ['null', 'string', 'int', 'double', 'boolean'] 
      }],
      default: null
    }
  ]
};

/**
 * Schema definition for LOAD_ASSIGNED event payload
 * This schema defines the data structure for events triggered when a load is assigned to a driver
 */
export const loadAssignedSchema: Schema = {
  type: 'record',
  name: 'LoadAssignedPayload',
  fields: [
    { name: 'load_id', type: 'string' },
    { name: 'assignment_id', type: 'string' },
    { name: 'driver_id', type: 'string' },
    { name: 'vehicle_id', type: 'string' },
    { name: 'carrier_id', type: 'string' },
    { name: 'assignment_type', type: 'string' }, // Will contain LoadAssignmentType enum values
    { name: 'agreed_rate', type: 'double' },
    { name: 'efficiency_score', type: 'double' }, // 0-100 score for this assignment
    { name: 'segment_start_location', type: ['null', 'Location'], default: null }, // For relay assignments
    { name: 'segment_end_location', type: ['null', 'Location'], default: null }, // For relay assignments
    { name: 'assigned_at', type: 'string' }, // ISO timestamp
    { name: 'assigned_by', type: 'string' } // User ID or system identifier
  ]
};

/**
 * Schema definition for LOAD_UNASSIGNED event payload
 * This schema defines the data structure for events triggered when a load is unassigned from a driver
 */
export const loadUnassignedSchema: Schema = {
  type: 'record',
  name: 'LoadUnassignedPayload',
  fields: [
    { name: 'load_id', type: 'string' },
    { name: 'assignment_id', type: 'string' },
    { name: 'driver_id', type: 'string' },
    { name: 'vehicle_id', type: 'string' },
    { name: 'carrier_id', type: 'string' },
    { name: 'unassigned_at', type: 'string' }, // ISO timestamp
    { name: 'unassigned_by', type: 'string' }, // User ID or system identifier
    { name: 'reason', type: ['null', 'string'], default: null }
  ]
};

/**
 * Schema definition for LOAD_COMPLETED event payload
 * This schema defines the data structure for events triggered when a load is successfully delivered and completed
 */
export const loadCompletedSchema: Schema = {
  type: 'record',
  name: 'LoadCompletedPayload',
  fields: [
    { name: 'load_id', type: 'string' },
    { name: 'assignment_id', type: 'string' },
    { name: 'driver_id', type: 'string' },
    { name: 'vehicle_id', type: 'string' },
    { name: 'carrier_id', type: 'string' },
    { name: 'shipper_id', type: 'string' },
    { name: 'completed_at', type: 'string' }, // ISO timestamp
    { name: 'location', type: 'Location' }, // Where the load was completed
    { name: 'actual_pickup_time', type: 'string' }, // ISO timestamp
    { name: 'actual_delivery_time', type: 'string' }, // ISO timestamp
    { name: 'total_distance', type: 'double' }, // Total miles driven
    { name: 'empty_miles', type: 'double' }, // Empty miles driven
    { name: 'loaded_miles', type: 'double' }, // Loaded miles driven
    { name: 'fuel_used', type: ['null', 'double'], default: null }, // Gallons of fuel used if available
    { 
      name: 'documents', 
      type: ['null', {
        type: 'array',
        items: {
          type: 'record',
          name: 'Document',
          fields: [
            { name: 'document_id', type: 'string' },
            { name: 'document_type', type: 'string' }, // BOL, POD, etc.
            { name: 'storage_url', type: 'string' } // URL to retrieve the document
          ]
        }
      }],
      default: null
    },
    { name: 'completion_notes', type: ['null', 'string'], default: null }
  ]
};

/**
 * Schema definition for LOAD_CANCELLED event payload
 * This schema defines the data structure for events triggered when a load is cancelled
 */
export const loadCancelledSchema: Schema = {
  type: 'record',
  name: 'LoadCancelledPayload',
  fields: [
    { name: 'load_id', type: 'string' },
    { name: 'shipper_id', type: 'string' },
    { name: 'assignment_id', type: ['null', 'string'], default: null }, // May be null if cancelled before assignment
    { name: 'driver_id', type: ['null', 'string'], default: null }, // May be null if cancelled before assignment
    { name: 'carrier_id', type: ['null', 'string'], default: null }, // May be null if cancelled before assignment
    { name: 'cancelled_at', type: 'string' }, // ISO timestamp
    { name: 'cancelled_by', type: 'string' }, // User ID or system identifier
    { name: 'cancellation_reason', type: 'string' },
    { name: 'cancellation_fees', type: ['null', 'double'], default: null } // Any fees associated with cancellation
  ]
};

/**
 * Map of load event schemas indexed by event type
 * This provides a convenient way to look up the appropriate schema for a given event type
 */
export const loadEventSchemas: Record<string, Schema> = {
  [EventTypes.LOAD_CREATED]: loadCreatedSchema,
  [EventTypes.LOAD_UPDATED]: loadUpdatedSchema,
  [EventTypes.LOAD_DELETED]: loadDeletedSchema,
  [EventTypes.LOAD_STATUS_CHANGED]: loadStatusChangedSchema,
  [EventTypes.LOAD_ASSIGNED]: loadAssignedSchema,
  [EventTypes.LOAD_UNASSIGNED]: loadUnassignedSchema,
  [EventTypes.LOAD_COMPLETED]: loadCompletedSchema,
  [EventTypes.LOAD_CANCELLED]: loadCancelledSchema
};

/**
 * Default export containing the load events topic and associated schemas
 * Provides all necessary schema information for load events in a single export
 */
export default {
  topic: LOAD_EVENTS,
  schemas: loadEventSchemas
};