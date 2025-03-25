/**
 * optimization-events.schema.ts
 * 
 * This file defines Avro schemas for optimization-related events in the Kafka event bus.
 * These schemas ensure consistent event structure and validation for all optimization events
 * published to the optimization events topic, enabling reliable event-driven communication
 * between microservices.
 */

import { Schema } from 'avsc'; // avsc@5.7.0
import { 
  EventCategories,
  EventTypes,
  OPTIMIZATION_REQUESTED,
  OPTIMIZATION_COMPLETED,
  SMART_HUB_IDENTIFIED,
  RELAY_PLAN_CREATED
} from '../../../common/constants/event-types';
import { OPTIMIZATION_EVENTS } from '../config/topics';

/**
 * Common metadata for all optimization events
 * Contains standardized fields for event tracking and correlation
 */
export const optimizationEventMetadataSchema: Schema = {
  type: 'record',
  name: 'OptimizationEventMetadata',
  fields: [
    { name: 'event_id', type: 'string' },
    { name: 'event_type', type: 'string' },
    { name: 'event_version', type: 'string' },
    { name: 'event_time', type: 'string' },
    { name: 'producer', type: 'string' },
    { name: 'correlation_id', type: 'string' },
    { name: 'category', type: 'string', default: EventCategories.OPTIMIZATION }
  ]
};

/**
 * Schema for OPTIMIZATION_REQUESTED event
 * Triggered when a new optimization job is requested
 */
export const optimizationRequestedSchema: Schema = {
  type: 'record',
  name: 'OptimizationRequestedPayload',
  fields: [
    { name: 'job_id', type: 'string' },
    { name: 'job_type', type: 'string' },
    { name: 'region', type: 'string' },
    {
      name: 'time_window',
      type: {
        type: 'record',
        name: 'TimeWindow',
        fields: [
          { name: 'start', type: 'string' },
          { name: 'end', type: 'string' }
        ]
      }
    },
    {
      name: 'parameters',
      type: {
        type: 'map',
        values: ['null', 'string', 'int', 'double', 'boolean']
      }
    },
    { name: 'requested_by', type: 'string' },
    { name: 'requested_at', type: 'string' },
    { name: 'priority', type: 'int', default: 1 }
  ]
};

/**
 * Schema for OPTIMIZATION_COMPLETED event
 * Triggered when an optimization job is completed with results
 */
export const optimizationCompletedSchema: Schema = {
  type: 'record',
  name: 'OptimizationCompletedPayload',
  fields: [
    { name: 'result_id', type: 'string' },
    { name: 'job_id', type: 'string' },
    { name: 'job_type', type: 'string' },
    { name: 'region', type: 'string' },
    {
      name: 'time_window',
      type: {
        type: 'record',
        name: 'ResultTimeWindow',
        fields: [
          { name: 'start', type: 'string' },
          { name: 'end', type: 'string' }
        ]
      }
    },
    {
      name: 'load_matches',
      type: {
        type: 'array',
        items: {
          type: 'record',
          name: 'LoadMatch',
          fields: [
            { name: 'driver_id', type: 'string' },
            { name: 'load_id', type: 'string' },
            { name: 'score', type: 'double' },
            { name: 'empty_miles_saved', type: 'double' },
            { name: 'network_contribution', type: 'double' },
            { name: 'estimated_revenue', type: 'double' },
            { name: 'estimated_completion_time', type: 'string' },
            {
              name: 'score_factors',
              type: {
                type: 'map',
                values: 'double'
              }
            }
          ]
        }
      },
      default: []
    },
    {
      name: 'network_metrics',
      type: [
        'null',
        {
          type: 'record',
          name: 'NetworkMetrics',
          fields: [
            { name: 'total_loads', type: 'int' },
            { name: 'total_drivers', type: 'int' },
            { name: 'matched_loads', type: 'int' },
            { name: 'matched_drivers', type: 'int' },
            { name: 'total_miles', type: 'double' },
            { name: 'loaded_miles', type: 'double' },
            { name: 'empty_miles', type: 'double' },
            { name: 'empty_miles_percentage', type: 'double' },
            { name: 'total_revenue', type: 'double' },
            { name: 'revenue_per_mile', type: 'double' },
            { name: 'network_efficiency_score', type: 'double' }
          ]
        }
      ],
      default: null
    },
    { name: 'created_at', type: 'string' },
    { name: 'expires_at', type: 'string' }
  ]
};

/**
 * Schema for SMART_HUB_IDENTIFIED event
 * Triggered when a Smart Hub location is identified by the optimization engine
 */
export const smartHubIdentifiedSchema: Schema = {
  type: 'record',
  name: 'SmartHubIdentifiedPayload',
  fields: [
    { name: 'hub_id', type: 'string' },
    { name: 'name', type: 'string' },
    {
      name: 'location',
      type: {
        type: 'record',
        name: 'HubLocation',
        fields: [
          { name: 'latitude', type: 'double' },
          { name: 'longitude', type: 'double' }
        ]
      }
    },
    { name: 'score', type: 'double' },
    { name: 'potential_exchanges', type: 'int' },
    { name: 'estimated_savings', type: 'double' },
    {
      name: 'nearby_drivers',
      type: {
        type: 'array',
        items: 'string'
      }
    },
    {
      name: 'nearby_loads',
      type: {
        type: 'array',
        items: 'string'
      }
    },
    { name: 'identified_at', type: 'string' },
    { name: 'result_id', type: 'string' }
  ]
};

/**
 * Schema for RELAY_PLAN_CREATED event
 * Triggered when a relay plan is created by the optimization engine
 */
export const relayPlanCreatedSchema: Schema = {
  type: 'record',
  name: 'RelayPlanCreatedPayload',
  fields: [
    { name: 'plan_id', type: 'string' },
    { name: 'load_id', type: 'string' },
    {
      name: 'segments',
      type: {
        type: 'array',
        items: {
          type: 'record',
          name: 'RelaySegment',
          fields: [
            { name: 'segment_id', type: 'string' },
            { name: 'driver_id', type: 'string' },
            {
              name: 'start_location',
              type: {
                type: 'record',
                name: 'SegmentLocation',
                fields: [
                  { name: 'latitude', type: 'double' },
                  { name: 'longitude', type: 'double' },
                  { name: 'name', type: 'string' }
                ]
              }
            },
            { name: 'end_location', type: 'SegmentLocation' },
            { name: 'estimated_distance', type: 'double' },
            { name: 'estimated_duration', type: 'double' },
            { name: 'estimated_start_time', type: 'string' },
            { name: 'estimated_end_time', type: 'string' }
          ]
        }
      }
    },
    {
      name: 'handoff_locations',
      type: {
        type: 'array',
        items: {
          type: 'record',
          name: 'HandoffLocation',
          fields: [
            { name: 'hub_id', type: 'string' },
            {
              name: 'location',
              type: {
                type: 'record',
                name: 'HandoffCoordinates',
                fields: [
                  { name: 'latitude', type: 'double' },
                  { name: 'longitude', type: 'double' },
                  { name: 'name', type: 'string' }
                ]
              }
            }
          ]
        }
      }
    },
    { name: 'total_distance', type: 'double' },
    { name: 'total_duration', type: 'double' },
    { name: 'efficiency_score', type: 'double' },
    { name: 'estimated_savings', type: 'double' },
    { name: 'created_at', type: 'string' },
    { name: 'result_id', type: 'string' }
  ]
};

/**
 * Map of event type to corresponding schema
 * Enables dynamic schema lookup based on event type
 */
export const optimizationEventSchemas = {
  [EventTypes.OPTIMIZATION_REQUESTED]: optimizationRequestedSchema,
  [EventTypes.OPTIMIZATION_COMPLETED]: optimizationCompletedSchema,
  [EventTypes.SMART_HUB_IDENTIFIED]: smartHubIdentifiedSchema,
  [EventTypes.RELAY_PLAN_CREATED]: relayPlanCreatedSchema
};

/**
 * Default export containing the topic name and all associated schemas
 * Provides a convenient way to access all optimization event schemas
 */
export default {
  topic: OPTIMIZATION_EVENTS,
  schemas: optimizationEventSchemas
};