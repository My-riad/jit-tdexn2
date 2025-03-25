/**
 * Load Validator
 * 
 * Defines validation schemas for load-related operations in the freight optimization platform.
 * This file contains Joi validation schemas for creating, updating, searching loads,
 * as well as validating load status updates and load IDs.
 */

import Joi from 'joi'; // joi@17.9.2
import { LoadStatus, EquipmentType, LoadLocationType } from '../../../common/interfaces/load.interface';
import { isValidCoordinates } from '../../../common/utils/validation';

/**
 * Helper schema for validating load dimensions
 */
const dimensionsSchema = Joi.object({
  length: Joi.number().min(0).required(),
  width: Joi.number().min(0).required(),
  height: Joi.number().min(0).required()
});

/**
 * Helper schema for validating temperature requirements for refrigerated loads
 */
const temperatureRequirementsSchema = Joi.object({
  min_temp: Joi.number().required(),
  max_temp: Joi.number().required()
}).custom((value, helpers) => {
  if (value.max_temp <= value.min_temp) {
    return helpers.error('custom.temperatureRange', { 
      message: 'Maximum temperature must be greater than minimum temperature' 
    });
  }
  return value;
});

/**
 * Helper schema for validating load locations
 */
const locationSchema = Joi.object({
  location_type: Joi.string().valid(...Object.values(LoadLocationType)).required(),
  facility_name: Joi.string().min(1).max(100).required(),
  address: Joi.string().min(5).max(200).required(),
  city: Joi.string().min(1).max(100).required(),
  state: Joi.string().length(2).required(),
  zip: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  earliest_time: Joi.date().required(),
  latest_time: Joi.date().required(),
  contact_name: Joi.string().min(1).max(100).required(),
  contact_phone: Joi.string().pattern(/^\(\d{3}\) \d{3}-\d{4}$/).required(),
  special_instructions: Joi.string().max(500).optional()
}).custom((value, helpers) => {
  // Validate time window
  if (value.latest_time <= value.earliest_time) {
    return helpers.error('custom.timeWindow', { 
      message: 'Latest time must be after earliest time' 
    });
  }
  
  // Validate coordinates
  if (!isValidCoordinates(value.latitude, value.longitude)) {
    return helpers.error('custom.coordinates', { 
      message: 'Invalid coordinates' 
    });
  }
  
  return value;
});

/**
 * Schema for validating load creation requests
 */
export const createLoadSchema = Joi.object({
  shipper_id: Joi.string().uuid().required(),
  reference_number: Joi.string().required(),
  description: Joi.string().max(500).optional(),
  equipment_type: Joi.string().valid(...Object.values(EquipmentType)).required(),
  weight: Joi.number().min(0).required(),
  dimensions: dimensionsSchema.required(),
  volume: Joi.number().min(0).optional(),
  pallets: Joi.number().integer().min(0).optional(),
  commodity: Joi.string().max(100).required(),
  pickup_earliest: Joi.date().required(),
  pickup_latest: Joi.date().required(),
  delivery_earliest: Joi.date().required(),
  delivery_latest: Joi.date().required(),
  offered_rate: Joi.number().min(0).required(),
  special_instructions: Joi.string().max(1000).optional(),
  is_hazardous: Joi.boolean().default(false),
  temperature_requirements: temperatureRequirementsSchema.optional(),
  locations: Joi.array().items(locationSchema).min(2).required()
}).custom((value, helpers) => {
  // Validate pickup time window
  if (value.pickup_latest <= value.pickup_earliest) {
    return helpers.error('custom.pickupWindow', { 
      message: 'Pickup latest time must be after pickup earliest time' 
    });
  }
  
  // Validate delivery time window
  if (value.delivery_latest <= value.delivery_earliest) {
    return helpers.error('custom.deliveryWindow', { 
      message: 'Delivery latest time must be after delivery earliest time' 
    });
  }
  
  // Validate transit time
  if (value.delivery_earliest <= value.pickup_latest) {
    return helpers.error('custom.transitTime', { 
      message: 'Delivery earliest time must be after pickup latest time' 
    });
  }
  
  // Check temperature requirements for refrigerated loads
  if (value.equipment_type === EquipmentType.REFRIGERATED && !value.temperature_requirements) {
    return helpers.error('custom.temperatureRequired', { 
      message: 'Temperature requirements are required for refrigerated loads' 
    });
  }
  
  // Validate locations array has at least one pickup and one delivery
  const hasPickup = value.locations.some(location => location.location_type === LoadLocationType.PICKUP);
  const hasDelivery = value.locations.some(location => location.location_type === LoadLocationType.DELIVERY);
  
  if (!hasPickup || !hasDelivery) {
    return helpers.error('custom.locations', { 
      message: 'Load must have at least one pickup and one delivery location' 
    });
  }
  
  return value;
});

/**
 * Schema for validating load update requests
 */
export const updateLoadSchema = Joi.object({
  reference_number: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
  equipment_type: Joi.string().valid(...Object.values(EquipmentType)).optional(),
  weight: Joi.number().min(0).optional(),
  dimensions: dimensionsSchema.optional(),
  volume: Joi.number().min(0).optional(),
  pallets: Joi.number().integer().min(0).optional(),
  commodity: Joi.string().max(100).optional(),
  pickup_earliest: Joi.date().optional(),
  pickup_latest: Joi.date().optional(),
  delivery_earliest: Joi.date().optional(),
  delivery_latest: Joi.date().optional(),
  offered_rate: Joi.number().min(0).optional(),
  special_instructions: Joi.string().max(1000).optional(),
  is_hazardous: Joi.boolean().optional(),
  temperature_requirements: temperatureRequirementsSchema.optional()
}).custom((value, helpers) => {
  // Validate pickup time window if both values are provided
  if (value.pickup_earliest && value.pickup_latest && value.pickup_latest <= value.pickup_earliest) {
    return helpers.error('custom.pickupWindow', { 
      message: 'Pickup latest time must be after pickup earliest time' 
    });
  }
  
  // Validate delivery time window if both values are provided
  if (value.delivery_earliest && value.delivery_latest && value.delivery_latest <= value.delivery_earliest) {
    return helpers.error('custom.deliveryWindow', { 
      message: 'Delivery latest time must be after delivery earliest time' 
    });
  }
  
  // Validate transit time if both values are provided
  if (value.pickup_latest && value.delivery_earliest && value.delivery_earliest <= value.pickup_latest) {
    return helpers.error('custom.transitTime', { 
      message: 'Delivery earliest time must be after pickup latest time' 
    });
  }
  
  // Check temperature requirements for refrigerated loads
  if (value.equipment_type === EquipmentType.REFRIGERATED && !value.temperature_requirements) {
    return helpers.error('custom.temperatureRequired', { 
      message: 'Temperature requirements are required for refrigerated loads' 
    });
  }
  
  return value;
});

/**
 * Schema for validating load status update requests
 */
export const updateLoadStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(LoadStatus)).required(),
  status_details: Joi.object().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  updated_by: Joi.string().optional()
}).custom((value, helpers) => {
  // Both latitude and longitude must be provided together
  if ((value.latitude !== undefined && value.longitude === undefined) || 
      (value.latitude === undefined && value.longitude !== undefined)) {
    return helpers.error('custom.coordinates', { 
      message: 'Both latitude and longitude must be provided together' 
    });
  }
  
  // If coordinates are provided, validate them
  if (value.latitude !== undefined && value.longitude !== undefined) {
    if (!isValidCoordinates(value.latitude, value.longitude)) {
      return helpers.error('custom.coordinates', { 
        message: 'Invalid coordinates' 
      });
    }
  }
  
  return value;
});

/**
 * Schema for validating load search parameters
 */
export const loadSearchSchema = Joi.object({
  shipper_id: Joi.string().uuid().optional(),
  status: Joi.array().items(Joi.string().valid(...Object.values(LoadStatus))).optional(),
  equipment_type: Joi.array().items(Joi.string().valid(...Object.values(EquipmentType))).optional(),
  weight_min: Joi.number().min(0).optional(),
  weight_max: Joi.number().min(0).optional(),
  pickup_date_start: Joi.date().optional(),
  pickup_date_end: Joi.date().optional(),
  delivery_date_start: Joi.date().optional(),
  delivery_date_end: Joi.date().optional(),
  origin_latitude: Joi.number().min(-90).max(90).optional(),
  origin_longitude: Joi.number().min(-180).max(180).optional(),
  origin_radius: Joi.number().min(0).optional(),
  destination_latitude: Joi.number().min(-90).max(90).optional(),
  destination_longitude: Joi.number().min(-180).max(180).optional(),
  destination_radius: Joi.number().min(0).optional(),
  reference_number: Joi.string().optional(),
  is_hazardous: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string().optional(),
  sort_direction: Joi.string().valid('asc', 'desc').default('asc')
}).custom((value, helpers) => {
  // Validate origin search parameters
  if (value.origin_latitude !== undefined || value.origin_longitude !== undefined || value.origin_radius !== undefined) {
    if (value.origin_latitude === undefined || value.origin_longitude === undefined || value.origin_radius === undefined) {
      return helpers.error('custom.originSearch', { 
        message: 'When searching by origin, latitude, longitude, and radius must all be provided' 
      });
    }
  }
  
  // Validate destination search parameters
  if (value.destination_latitude !== undefined || value.destination_longitude !== undefined || value.destination_radius !== undefined) {
    if (value.destination_latitude === undefined || value.destination_longitude === undefined || value.destination_radius === undefined) {
      return helpers.error('custom.destinationSearch', { 
        message: 'When searching by destination, latitude, longitude, and radius must all be provided' 
      });
    }
  }
  
  // Validate weight range
  if (value.weight_min !== undefined && value.weight_max !== undefined && value.weight_max < value.weight_min) {
    return helpers.error('custom.weightRange', { 
      message: 'Maximum weight must be greater than or equal to minimum weight' 
    });
  }
  
  // Validate pickup date range
  if (value.pickup_date_start !== undefined && value.pickup_date_end !== undefined && 
      value.pickup_date_end < value.pickup_date_start) {
    return helpers.error('custom.pickupDateRange', { 
      message: 'Pickup date end must be after pickup date start' 
    });
  }
  
  // Validate delivery date range
  if (value.delivery_date_start !== undefined && value.delivery_date_end !== undefined && 
      value.delivery_date_end < value.delivery_date_start) {
    return helpers.error('custom.deliveryDateRange', { 
      message: 'Delivery date end must be after delivery date start' 
    });
  }
  
  return value;
});

/**
 * Schema for validating load ID parameters
 */
export const loadIdSchema = Joi.object({
  loadId: Joi.string().uuid().required()
});