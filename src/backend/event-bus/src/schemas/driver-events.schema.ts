import { Schema } from 'avsc'; // avsc@5.7.0

import {
  EventTypes,
  EventCategories
} from '../../../common/constants/event-types';

import {
  DriverStatus,
  HOSStatus,
  LicenseClass,
  LicenseEndorsement
} from '../../../common/interfaces/driver.interface';

import { DRIVER_EVENTS } from '../config/topics';

// Common event metadata schema
export const driverEventMetadataSchema = {
  type: 'record',
  name: 'DriverEventMetadata',
  fields: [
    { name: 'event_id', type: 'string' },
    { name: 'event_type', type: 'string' },
    { name: 'event_version', type: 'string' },
    { name: 'event_time', type: 'string' },
    { name: 'producer', type: 'string' },
    { name: 'correlation_id', type: 'string' },
    { name: 'category', type: 'string', default: EventCategories.DRIVER }
  ]
};

// Driver creation event payload schema
export const driverCreatedSchema = {
  type: 'record',
  name: 'DriverCreatedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'user_id', type: 'string' },
    { name: 'carrier_id', type: 'string' },
    { name: 'first_name', type: 'string' },
    { name: 'last_name', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'phone', type: 'string' },
    { name: 'license_number', type: 'string' },
    { name: 'license_state', type: 'string' },
    { name: 'license_class', type: 'string' },
    { name: 'license_endorsements', type: { type: 'array', items: 'string' } },
    { name: 'license_expiration', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'created_at', type: 'string' }
  ]
};

// Driver update event payload schema
export const driverUpdatedSchema = {
  type: 'record',
  name: 'DriverUpdatedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'user_id', type: 'string' },
    { name: 'carrier_id', type: 'string' },
    { name: 'first_name', type: 'string' },
    { name: 'last_name', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'phone', type: 'string' },
    { name: 'license_number', type: 'string' },
    { name: 'license_state', type: 'string' },
    { name: 'license_class', type: 'string' },
    { name: 'license_endorsements', type: { type: 'array', items: 'string' } },
    { name: 'license_expiration', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'updated_at', type: 'string' },
    { name: 'updated_fields', type: { type: 'array', items: 'string' } }
  ]
};

// Driver deletion event payload schema
export const driverDeletedSchema = {
  type: 'record',
  name: 'DriverDeletedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'carrier_id', type: 'string' },
    { name: 'deleted_at', type: 'string' },
    { name: 'deleted_by', type: 'string' },
    { name: 'reason', type: ['null', 'string'], default: null }
  ]
};

// Driver status change event payload schema
export const driverStatusChangedSchema = {
  type: 'record',
  name: 'DriverStatusChangedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'previous_status', type: 'string' },
    { name: 'new_status', type: 'string' },
    { name: 'timestamp', type: 'string' },
    { name: 'actor_id', type: 'string' },
    { name: 'actor_type', type: 'string' },
    { 
      name: 'location', 
      type: [
        'null',
        {
          type: 'record',
          name: 'Location',
          fields: [
            { name: 'latitude', type: 'double' },
            { name: 'longitude', type: 'double' }
          ]
        }
      ],
      default: null
    },
    { name: 'status_details', type: ['null', 'string'], default: null }
  ]
};

// Driver availability change event payload schema
export const driverAvailabilityChangedSchema = {
  type: 'record',
  name: 'DriverAvailabilityChangedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'status', type: 'string' },
    { 
      name: 'current_location', 
      type: {
        type: 'record',
        name: 'CurrentLocation',
        fields: [
          { name: 'latitude', type: 'double' },
          { name: 'longitude', type: 'double' }
        ]
      }
    },
    { name: 'available_from', type: 'string' },
    { name: 'available_until', type: ['null', 'string'], default: null },
    { name: 'driving_minutes_remaining', type: 'int' },
    { name: 'duty_minutes_remaining', type: 'int' },
    { name: 'cycle_minutes_remaining', type: 'int' },
    { name: 'updated_at', type: 'string' }
  ]
};

// Driver HOS update event payload schema
export const driverHosUpdatedSchema = {
  type: 'record',
  name: 'DriverHosUpdatedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'hos_id', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'status_since', type: 'string' },
    { name: 'driving_minutes_remaining', type: 'int' },
    { name: 'duty_minutes_remaining', type: 'int' },
    { name: 'cycle_minutes_remaining', type: 'int' },
    { 
      name: 'location', 
      type: {
        type: 'record',
        name: 'HosLocation',
        fields: [
          { name: 'latitude', type: 'double' },
          { name: 'longitude', type: 'double' }
        ]
      }
    },
    { name: 'vehicle_id', type: ['null', 'string'], default: null },
    { name: 'eld_log_id', type: ['null', 'string'], default: null },
    { name: 'recorded_at', type: 'string' }
  ]
};

// Driver score update event payload schema
export const driverScoreUpdatedSchema = {
  type: 'record',
  name: 'DriverScoreUpdatedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'score_id', type: 'string' },
    { name: 'total_score', type: 'double' },
    { name: 'empty_miles_score', type: 'double' },
    { name: 'network_contribution_score', type: 'double' },
    { name: 'on_time_score', type: 'double' },
    { name: 'hub_utilization_score', type: 'double' },
    { name: 'fuel_efficiency_score', type: 'double' },
    { name: 'score_factors', type: { type: 'map', values: 'double' } },
    { name: 'calculated_at', type: 'string' }
  ]
};

// Driver achievement earned event payload schema
export const driverAchievementEarnedSchema = {
  type: 'record',
  name: 'DriverAchievementEarnedPayload',
  fields: [
    { name: 'driver_id', type: 'string' },
    { name: 'achievement_id', type: 'string' },
    { name: 'achievement_name', type: 'string' },
    { name: 'achievement_type', type: 'string' },
    { name: 'level', type: 'int' },
    { name: 'points', type: 'int' },
    { name: 'earned_at', type: 'string' },
    { 
      name: 'achievement_data', 
      type: [
        'null', 
        { 
          type: 'map', 
          values: ['null', 'string', 'int', 'double', 'boolean'] 
        }
      ],
      default: null
    }
  ]
};

// Map of event types to their corresponding schemas
export const driverEventSchemas = {
  [EventTypes.DRIVER_CREATED]: driverCreatedSchema,
  [EventTypes.DRIVER_UPDATED]: driverUpdatedSchema,
  [EventTypes.DRIVER_DELETED]: driverDeletedSchema,
  [EventTypes.DRIVER_STATUS_CHANGED]: driverStatusChangedSchema,
  [EventTypes.DRIVER_AVAILABILITY_CHANGED]: driverAvailabilityChangedSchema,
  [EventTypes.DRIVER_HOS_UPDATED]: driverHosUpdatedSchema,
  [EventTypes.DRIVER_SCORE_UPDATED]: driverScoreUpdatedSchema,
  [EventTypes.DRIVER_ACHIEVEMENT_EARNED]: driverAchievementEarnedSchema
};

// Default export with topic name and schemas
export default {
  topic: DRIVER_EVENTS,
  schemas: driverEventSchemas
};