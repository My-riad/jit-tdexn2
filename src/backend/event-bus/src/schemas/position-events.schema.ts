import { Schema } from 'avsc'; // avsc@5.7.0
import { 
  EventTypes, 
  EventCategories 
} from '../../../common/constants/event-types';
import { 
  EntityType, 
  PositionSource 
} from '../../../common/interfaces/position.interface';
import { POSITION_UPDATES } from '../config/topics';

/**
 * Avro schema definition for position event metadata
 * Contains common fields present in all position events
 */
export const positionEventMetadataSchema: Schema = {
  type: 'record',
  name: 'PositionEventMetadata',
  fields: [
    { name: 'event_id', type: 'string' },
    { name: 'event_type', type: 'string' },
    { name: 'event_version', type: 'string' },
    { name: 'event_time', type: 'string' },
    { name: 'producer', type: 'string' },
    { name: 'correlation_id', type: 'string' },
    { name: 'category', type: 'string', default: EventCategories.POSITION }
  ]
};

/**
 * Avro schema definition for POSITION_UPDATED event payload
 * This schema defines the structure for real-time position updates
 * Used for tracking vehicles and drivers in real-time
 */
export const positionUpdatedSchema: Schema = {
  type: 'record',
  name: 'PositionUpdatedPayload',
  fields: [
    { name: 'entity_id', type: 'string' },
    { name: 'entity_type', type: 'string' }, // Values should match EntityType enum
    { name: 'latitude', type: 'double' },
    { name: 'longitude', type: 'double' },
    { name: 'heading', type: 'double' },
    { name: 'speed', type: 'double' },
    { name: 'accuracy', type: 'double' },
    { name: 'source', type: 'string' }, // Values should match PositionSource enum
    { name: 'timestamp', type: 'string' },
    { 
      name: 'additional_data', 
      type: ['null', { type: 'map', values: ['null', 'string', 'int', 'double', 'boolean'] }],
      default: null
    }
  ]
};

/**
 * Avro schema definition for POSITION_HISTORY_RECORDED event payload
 * This schema defines the structure for position history records
 * Used for historical tracking, analytics, and optimization
 */
export const positionHistoryRecordedSchema: Schema = {
  type: 'record',
  name: 'PositionHistoryRecordedPayload',
  fields: [
    { name: 'position_id', type: 'string' },
    { name: 'entity_id', type: 'string' },
    { name: 'entity_type', type: 'string' }, // Values should match EntityType enum
    { name: 'latitude', type: 'double' },
    { name: 'longitude', type: 'double' },
    { name: 'heading', type: 'double' },
    { name: 'speed', type: 'double' },
    { name: 'accuracy', type: 'double' },
    { name: 'source', type: 'string' }, // Values should match PositionSource enum
    { name: 'recorded_at', type: 'string' },
    { name: 'storage_tier', type: ['null', 'string'], default: null }
  ]
};

/**
 * Map of all position event schemas indexed by event type
 * Used to select the appropriate schema based on the event type
 */
export const positionEventSchemas = {
  [EventTypes.POSITION_UPDATED]: positionUpdatedSchema,
  [EventTypes.POSITION_HISTORY_RECORDED]: positionHistoryRecordedSchema
};

/**
 * Default export containing the position events topic and all associated schemas
 * Used by the event bus for publishing and subscribing to position events
 */
export default {
  topic: POSITION_UPDATES,
  schemas: positionEventSchemas
};