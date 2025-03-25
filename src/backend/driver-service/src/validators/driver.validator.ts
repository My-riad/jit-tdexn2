/**
 * Driver Validator Module
 * 
 * This module provides validation functions for driver-related data in the freight optimization platform.
 * It ensures data integrity and consistency before database operations.
 */

import Joi from 'joi'; // joi@17.9.2
import { 
  validateSchema, 
  isValidEmail, 
  isValidPhone, 
  isValidDate,
  createValidationError
} from '../../../common/utils/validation';

import {
  Driver,
  DriverCreationParams,
  DriverUpdateParams,
  DriverStatus,
  LicenseClass,
  LicenseEndorsement,
  HOSStatus,
  PreferenceType
} from '../../../common/interfaces/driver.interface';

import { 
  ErrorCodes
} from '../../../common/constants/error-codes';

/**
 * Validates driver creation parameters against schema requirements
 * 
 * @param driverData - Driver creation parameters to validate
 * @returns Validated driver creation data
 * @throws Validation error if data is invalid
 */
export async function validateDriverCreation(driverData: DriverCreationParams): Promise<DriverCreationParams> {
  // Define schema for driver creation
  const schema = Joi.object({
    user_id: Joi.string().uuid().required()
      .messages({
        'string.empty': 'User ID is required',
        'string.uuid': 'User ID must be a valid UUID',
        'any.required': 'User ID is required'
      }),
    carrier_id: Joi.string().uuid().required()
      .messages({
        'string.empty': 'Carrier ID is required',
        'string.uuid': 'Carrier ID must be a valid UUID',
        'any.required': 'Carrier ID is required'
      }),
    first_name: Joi.string().min(2).max(50).required()
      .messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least {#limit} characters',
        'string.max': 'First name cannot exceed {#limit} characters',
        'any.required': 'First name is required'
      }),
    last_name: Joi.string().min(2).max(50).required()
      .messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least {#limit} characters',
        'string.max': 'Last name cannot exceed {#limit} characters',
        'any.required': 'Last name is required'
      }),
    email: Joi.string().max(100).required().custom((value, helpers) => {
      if (!isValidEmail(value)) {
        return helpers.error('string.email');
      }
      return value;
    }).messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email cannot exceed {#limit} characters',
      'any.required': 'Email is required'
    }),
    phone: Joi.string().max(20).required().custom((value, helpers) => {
      if (!isValidPhone(value)) {
        return helpers.error('string.phone');
      }
      return value;
    }).messages({
      'string.empty': 'Phone number is required',
      'string.phone': 'Phone number must be a valid phone number',
      'string.max': 'Phone number cannot exceed {#limit} characters',
      'any.required': 'Phone number is required'
    }),
    license_number: Joi.string().min(5).max(30).required()
      .messages({
        'string.empty': 'License number is required',
        'string.min': 'License number must be at least {#limit} characters',
        'string.max': 'License number cannot exceed {#limit} characters',
        'any.required': 'License number is required'
      }),
    license_state: Joi.string().length(2).required()
      .messages({
        'string.empty': 'License state is required',
        'string.length': 'License state must be a 2-letter state code',
        'any.required': 'License state is required'
      }),
    license_class: Joi.string().valid(...Object.values(LicenseClass)).required()
      .messages({
        'string.empty': 'License class is required',
        'any.only': 'License class must be one of the valid license classes',
        'any.required': 'License class is required'
      }),
    license_endorsements: Joi.array().items(
      Joi.string().valid(...Object.values(LicenseEndorsement))
    ).default([])
      .messages({
        'array.base': 'License endorsements must be an array',
        'any.only': 'License endorsements must be valid endorsement types'
      }),
    license_expiration: Joi.date().required().custom((value, helpers) => {
      // License must not be expired and should be a future date
      if (!isValidDate(value, { minDate: new Date() })) {
        return helpers.error('date.future');
      }
      return value;
    }).messages({
      'date.base': 'License expiration must be a valid date',
      'date.future': 'License expiration date must be in the future',
      'any.required': 'License expiration date is required'
    }),
    home_address: Joi.object({
      street1: Joi.string().max(100).required()
        .messages({
          'string.empty': 'Street address is required',
          'string.max': 'Street address cannot exceed {#limit} characters',
          'any.required': 'Street address is required'
        }),
      street2: Joi.string().max(100).allow('', null),
      city: Joi.string().max(50).required()
        .messages({
          'string.empty': 'City is required',
          'string.max': 'City cannot exceed {#limit} characters',
          'any.required': 'City is required'
        }),
      state: Joi.string().length(2).required()
        .messages({
          'string.empty': 'State is required',
          'string.length': 'State must be a 2-letter state code',
          'any.required': 'State is required'
        }),
      postal_code: Joi.string().max(20).required()
        .messages({
          'string.empty': 'Postal code is required',
          'string.max': 'Postal code cannot exceed {#limit} characters',
          'any.required': 'Postal code is required'
        }),
      country: Joi.string().length(2).default('US')
        .messages({
          'string.length': 'Country must be a 2-letter country code'
        })
    }).required()
      .messages({
        'object.base': 'Home address must be a valid object',
        'any.required': 'Home address is required'
      }),
    eld_device_id: Joi.string().max(50).allow('', null),
    eld_provider: Joi.string().max(50).allow('', null)
  });

  // Validate data against schema
  const result = validateSchema(driverData, schema);

  if (!result.success) {
    throw createValidationError(
      'Driver validation failed', 
      result.error.details, 
      result.error.code || ErrorCodes.VAL_INVALID_INPUT
    );
  }

  return result.data;
}

/**
 * Validates driver update parameters against schema requirements
 * 
 * @param driverData - Driver update parameters to validate
 * @returns Validated driver update data
 * @throws Validation error if data is invalid
 */
export async function validateDriverUpdate(driverData: DriverUpdateParams): Promise<DriverUpdateParams> {
  // Define schema for driver updates
  const schema = Joi.object({
    first_name: Joi.string().min(2).max(50)
      .messages({
        'string.min': 'First name must be at least {#limit} characters',
        'string.max': 'First name cannot exceed {#limit} characters'
      }),
    last_name: Joi.string().min(2).max(50)
      .messages({
        'string.min': 'Last name must be at least {#limit} characters',
        'string.max': 'Last name cannot exceed {#limit} characters'
      }),
    email: Joi.string().max(100).custom((value, helpers) => {
      if (value && !isValidEmail(value)) {
        return helpers.error('string.email');
      }
      return value;
    }).messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email cannot exceed {#limit} characters'
    }),
    phone: Joi.string().max(20).custom((value, helpers) => {
      if (value && !isValidPhone(value)) {
        return helpers.error('string.phone');
      }
      return value;
    }).messages({
      'string.phone': 'Phone number must be a valid phone number',
      'string.max': 'Phone number cannot exceed {#limit} characters'
    }),
    license_number: Joi.string().min(5).max(30)
      .messages({
        'string.min': 'License number must be at least {#limit} characters',
        'string.max': 'License number cannot exceed {#limit} characters'
      }),
    license_state: Joi.string().length(2)
      .messages({
        'string.length': 'License state must be a 2-letter state code'
      }),
    license_class: Joi.string().valid(...Object.values(LicenseClass))
      .messages({
        'any.only': 'License class must be one of the valid license classes'
      }),
    license_endorsements: Joi.array().items(
      Joi.string().valid(...Object.values(LicenseEndorsement))
    )
      .messages({
        'array.base': 'License endorsements must be an array',
        'any.only': 'License endorsements must be valid endorsement types'
      }),
    license_expiration: Joi.date().custom((value, helpers) => {
      if (value && !isValidDate(value, { minDate: new Date() })) {
        return helpers.error('date.future');
      }
      return value;
    }).messages({
      'date.base': 'License expiration must be a valid date',
      'date.future': 'License expiration date must be in the future'
    }),
    home_address: Joi.object({
      street1: Joi.string().max(100).required()
        .messages({
          'string.empty': 'Street address is required',
          'string.max': 'Street address cannot exceed {#limit} characters',
          'any.required': 'Street address is required'
        }),
      street2: Joi.string().max(100).allow('', null),
      city: Joi.string().max(50).required()
        .messages({
          'string.empty': 'City is required',
          'string.max': 'City cannot exceed {#limit} characters',
          'any.required': 'City is required'
        }),
      state: Joi.string().length(2).required()
        .messages({
          'string.empty': 'State is required',
          'string.length': 'State must be a 2-letter state code',
          'any.required': 'State is required'
        }),
      postal_code: Joi.string().max(20).required()
        .messages({
          'string.empty': 'Postal code is required',
          'string.max': 'Postal code cannot exceed {#limit} characters',
          'any.required': 'Postal code is required'
        }),
      country: Joi.string().length(2).default('US')
        .messages({
          'string.length': 'Country must be a 2-letter country code'
        })
    })
      .messages({
        'object.base': 'Home address must be a valid object'
      }),
    current_vehicle_id: Joi.string().uuid().allow(null)
      .messages({
        'string.uuid': 'Vehicle ID must be a valid UUID'
      }),
    current_load_id: Joi.string().uuid().allow(null)
      .messages({
        'string.uuid': 'Load ID must be a valid UUID'
      }),
    status: Joi.string().valid(...Object.values(DriverStatus))
      .messages({
        'any.only': 'Status must be one of the valid driver statuses'
      }),
    eld_device_id: Joi.string().max(50).allow('', null),
    eld_provider: Joi.string().max(50).allow('', null),
    active: Joi.boolean()
  });

  // Validate data against schema
  const result = validateSchema(driverData, schema);

  if (!result.success) {
    throw createValidationError(
      'Driver update validation failed', 
      result.error.details, 
      result.error.code || ErrorCodes.VAL_INVALID_INPUT
    );
  }

  return result.data;
}

/**
 * Validates driver status update against allowed values
 * 
 * @param status - Driver status to validate
 * @returns Validated driver status
 * @throws Validation error if status is invalid
 */
export async function validateDriverStatusUpdate(status: DriverStatus): Promise<DriverStatus> {
  // Define schema for driver status
  const schema = Joi.string()
    .valid(...Object.values(DriverStatus))
    .required()
    .messages({
      'string.empty': 'Status is required',
      'any.only': 'Status must be one of the valid driver statuses',
      'any.required': 'Status is required'
    });

  // Validate status against schema
  const result = validateSchema(status, schema);

  if (!result.success) {
    throw createValidationError(
      'Driver status validation failed', 
      result.error.details, 
      result.error.code || ErrorCodes.VAL_INVALID_INPUT
    );
  }

  return result.data;
}

/**
 * Validates a driver ID format
 * 
 * @param driverId - Driver ID to validate
 * @returns Validated driver ID
 * @throws Validation error if driver ID is invalid
 */
export async function validateDriverId(driverId: string): Promise<string> {
  // Define schema for driver ID
  const schema = Joi.string()
    .required()
    .pattern(/^drv-[a-zA-Z0-9-]+$/)
    .messages({
      'string.empty': 'Driver ID is required',
      'string.pattern.base': 'Driver ID format is invalid',
      'any.required': 'Driver ID is required'
    });

  // Validate driver ID against schema
  const result = validateSchema(driverId, schema);

  if (!result.success) {
    throw createValidationError(
      'Driver ID validation failed', 
      result.error.details, 
      result.error.code || ErrorCodes.VAL_INVALID_FORMAT
    );
  }

  return result.data;
}

/**
 * Validates driver preference data
 * 
 * @param preferenceData - Driver preference data to validate
 * @returns Validated preference data
 * @throws Validation error if data is invalid
 */
export async function validateDriverPreference(preferenceData: object): Promise<object> {
  // Define schema for driver preferences
  const schema = Joi.object({
    driver_id: Joi.string()
      .pattern(/^drv-[a-zA-Z0-9-]+$/)
      .required()
      .messages({
        'string.empty': 'Driver ID is required',
        'string.pattern.base': 'Driver ID format is invalid',
        'any.required': 'Driver ID is required'
      }),
    preference_type: Joi.string()
      .valid(...Object.values(PreferenceType))
      .required()
      .messages({
        'string.empty': 'Preference type is required',
        'any.only': 'Preference type must be one of the valid preference types',
        'any.required': 'Preference type is required'
      }),
    preference_value: Joi.string().required()
      .messages({
        'string.empty': 'Preference value is required',
        'any.required': 'Preference value is required'
      }),
    priority: Joi.number().integer().min(1).max(10).default(5)
      .messages({
        'number.base': 'Priority must be a number',
        'number.integer': 'Priority must be an integer',
        'number.min': 'Priority must be at least {#limit}',
        'number.max': 'Priority cannot exceed {#limit}'
      })
  });

  // Validate preference data against schema
  const result = validateSchema(preferenceData, schema);

  if (!result.success) {
    throw createValidationError(
      'Driver preference validation failed', 
      result.error.details, 
      result.error.code || ErrorCodes.VAL_INVALID_INPUT
    );
  }

  return result.data;
}

/**
 * Validates driver availability data
 * 
 * @param availabilityData - Driver availability data to validate
 * @returns Validated availability data
 * @throws Validation error if data is invalid
 */
export async function validateDriverAvailability(availabilityData: object): Promise<object> {
  // Define schema for driver availability
  const schema = Joi.object({
    driver_id: Joi.string()
      .pattern(/^drv-[a-zA-Z0-9-]+$/)
      .required()
      .messages({
        'string.empty': 'Driver ID is required',
        'string.pattern.base': 'Driver ID format is invalid',
        'any.required': 'Driver ID is required'
      }),
    status: Joi.string()
      .valid(...Object.values(DriverStatus))
      .required()
      .messages({
        'string.empty': 'Status is required',
        'any.only': 'Status must be one of the valid driver statuses',
        'any.required': 'Status is required'
      }),
    current_location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required()
        .messages({
          'number.base': 'Latitude must be a number',
          'number.min': 'Latitude cannot be less than {#limit}',
          'number.max': 'Latitude cannot exceed {#limit}',
          'any.required': 'Latitude is required'
        }),
      longitude: Joi.number().min(-180).max(180).required()
        .messages({
          'number.base': 'Longitude must be a number',
          'number.min': 'Longitude cannot be less than {#limit}',
          'number.max': 'Longitude cannot exceed {#limit}',
          'any.required': 'Longitude is required'
        })
    }).required()
      .messages({
        'object.base': 'Current location must be a valid object',
        'any.required': 'Current location is required'
      }),
    available_from: Joi.date().required()
      .messages({
        'date.base': 'Available from must be a valid date',
        'any.required': 'Available from is required'
      }),
    available_until: Joi.date().greater(Joi.ref('available_from')).required()
      .messages({
        'date.base': 'Available until must be a valid date',
        'date.greater': 'Available until must be after available from',
        'any.required': 'Available until is required'
      }),
    driving_minutes_remaining: Joi.number().integer().min(0).max(660).required()
      .messages({
        'number.base': 'Driving minutes remaining must be a number',
        'number.integer': 'Driving minutes remaining must be an integer',
        'number.min': 'Driving minutes remaining cannot be negative',
        'number.max': 'Driving minutes remaining cannot exceed {#limit}',
        'any.required': 'Driving minutes remaining is required'
      }),
    duty_minutes_remaining: Joi.number().integer().min(0).max(840).required()
      .messages({
        'number.base': 'Duty minutes remaining must be a number',
        'number.integer': 'Duty minutes remaining must be an integer',
        'number.min': 'Duty minutes remaining cannot be negative',
        'number.max': 'Duty minutes remaining cannot exceed {#limit}',
        'any.required': 'Duty minutes remaining is required'
      }),
    cycle_minutes_remaining: Joi.number().integer().min(0).max(3600).required()
      .messages({
        'number.base': 'Cycle minutes remaining must be a number',
        'number.integer': 'Cycle minutes remaining must be an integer',
        'number.min': 'Cycle minutes remaining cannot be negative',
        'number.max': 'Cycle minutes remaining cannot exceed {#limit}',
        'any.required': 'Cycle minutes remaining is required'
      })
  });

  // Validate availability data against schema
  const result = validateSchema(availabilityData, schema);

  if (!result.success) {
    throw createValidationError(
      'Driver availability validation failed', 
      result.error.details, 
      result.error.code || ErrorCodes.VAL_INVALID_INPUT
    );
  }

  return result.data;
}

/**
 * Validates driver Hours of Service (HOS) data
 * 
 * @param hosData - Driver HOS data to validate
 * @returns Validated HOS data
 * @throws Validation error if data is invalid
 */
export async function validateDriverHOS(hosData: object): Promise<object> {
  // Define schema for driver HOS
  const schema = Joi.object({
    driver_id: Joi.string()
      .pattern(/^drv-[a-zA-Z0-9-]+$/)
      .required()
      .messages({
        'string.empty': 'Driver ID is required',
        'string.pattern.base': 'Driver ID format is invalid',
        'any.required': 'Driver ID is required'
      }),
    status: Joi.string()
      .valid(...Object.values(HOSStatus))
      .required()
      .messages({
        'string.empty': 'HOS status is required',
        'any.only': 'HOS status must be one of the valid HOS statuses',
        'any.required': 'HOS status is required'
      }),
    status_since: Joi.date()
      .max('now')
      .required()
      .messages({
        'date.base': 'Status since must be a valid date',
        'date.max': 'Status since cannot be in the future',
        'any.required': 'Status since is required'
      }),
    driving_minutes_remaining: Joi.number().integer().min(0).max(660).required()
      .messages({
        'number.base': 'Driving minutes remaining must be a number',
        'number.integer': 'Driving minutes remaining must be an integer',
        'number.min': 'Driving minutes remaining cannot be negative',
        'number.max': 'Driving minutes remaining cannot exceed {#limit}',
        'any.required': 'Driving minutes remaining is required'
      }),
    duty_minutes_remaining: Joi.number().integer().min(0).max(840).required()
      .messages({
        'number.base': 'Duty minutes remaining must be a number',
        'number.integer': 'Duty minutes remaining must be an integer',
        'number.min': 'Duty minutes remaining cannot be negative',
        'number.max': 'Duty minutes remaining cannot exceed {#limit}',
        'any.required': 'Duty minutes remaining is required'
      }),
    cycle_minutes_remaining: Joi.number().integer().min(0).max(3600).required()
      .messages({
        'number.base': 'Cycle minutes remaining must be a number',
        'number.integer': 'Cycle minutes remaining must be an integer',
        'number.min': 'Cycle minutes remaining cannot be negative',
        'number.max': 'Cycle minutes remaining cannot exceed {#limit}',
        'any.required': 'Cycle minutes remaining is required'
      }),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required()
        .messages({
          'number.base': 'Latitude must be a number',
          'number.min': 'Latitude cannot be less than {#limit}',
          'number.max': 'Latitude cannot exceed {#limit}',
          'any.required': 'Latitude is required'
        }),
      longitude: Joi.number().min(-180).max(180).required()
        .messages({
          'number.base': 'Longitude must be a number',
          'number.min': 'Longitude cannot be less than {#limit}',
          'number.max': 'Longitude cannot exceed {#limit}',
          'any.required': 'Longitude is required'
        })
    }).required()
      .messages({
        'object.base': 'Location must be a valid object',
        'any.required': 'Location is required'
      }),
    vehicle_id: Joi.string().uuid().allow(null)
      .messages({
        'string.uuid': 'Vehicle ID must be a valid UUID'
      }),
    eld_log_id: Joi.string().allow('', null)
  });

  // Validate HOS data against schema
  const result = validateSchema(hosData, schema);

  if (!result.success) {
    throw createValidationError(
      'Driver HOS validation failed', 
      result.error.details, 
      result.error.code || ErrorCodes.VAL_INVALID_INPUT
    );
  }

  return result.data;
}

/**
 * Validates driver search parameters
 * 
 * @param searchParams - Driver search parameters to validate
 * @returns Validated search parameters
 * @throws Validation error if parameters are invalid
 */
export async function validateDriverSearch(searchParams: object): Promise<object> {
  // Define schema for driver search
  const schema = Joi.object({
    carrier_id: Joi.string().uuid()
      .messages({
        'string.uuid': 'Carrier ID must be a valid UUID'
      }),
    status: Joi.array().items(
      Joi.string().valid(...Object.values(DriverStatus))
    )
      .messages({
        'array.base': 'Status must be an array',
        'any.only': 'Status values must be valid driver statuses'
      }),
    location_radius: Joi.object({
      latitude: Joi.number().min(-90).max(90).required()
        .messages({
          'number.base': 'Latitude must be a number',
          'number.min': 'Latitude cannot be less than {#limit}',
          'number.max': 'Latitude cannot exceed {#limit}',
          'any.required': 'Latitude is required'
        }),
      longitude: Joi.number().min(-180).max(180).required()
        .messages({
          'number.base': 'Longitude must be a number',
          'number.min': 'Longitude cannot be less than {#limit}',
          'number.max': 'Longitude cannot exceed {#limit}',
          'any.required': 'Longitude is required'
        }),
      radius: Joi.number().positive().max(500).required()
        .messages({
          'number.base': 'Radius must be a number',
          'number.positive': 'Radius must be positive',
          'number.max': 'Radius cannot exceed {#limit} miles',
          'any.required': 'Radius is required'
        })
    })
      .messages({
        'object.base': 'Location radius must be a valid object'
      }),
    min_hours_available: Joi.number().min(0)
      .messages({
        'number.base': 'Minimum hours available must be a number',
        'number.min': 'Minimum hours available cannot be negative'
      }),
    license_endorsements: Joi.array().items(
      Joi.string().valid(...Object.values(LicenseEndorsement))
    )
      .messages({
        'array.base': 'License endorsements must be an array',
        'any.only': 'License endorsements must be valid endorsement types'
      }),
    min_efficiency_score: Joi.number().min(0).max(100)
      .messages({
        'number.base': 'Minimum efficiency score must be a number',
        'number.min': 'Minimum efficiency score cannot be negative',
        'number.max': 'Minimum efficiency score cannot exceed {#limit}'
      }),
    available_after: Joi.date()
      .messages({
        'date.base': 'Available after must be a valid date'
      }),
    available_before: Joi.date()
      .greater(Joi.ref('available_after'))
      .messages({
        'date.base': 'Available before must be a valid date',
        'date.greater': 'Available before must be after available after'
      }),
    page: Joi.number().integer().min(1).default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least {#limit}'
      }),
    limit: Joi.number().integer().min(1).max(100).default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least {#limit}',
        'number.max': 'Limit cannot exceed {#limit}'
      }),
    sort_by: Joi.string().valid(
      'first_name', 'last_name', 'status', 'efficiency_score', 'created_at', 'updated_at'
    ).default('created_at')
      .messages({
        'any.only': 'Sort by must be one of the allowed fields'
      }),
    sort_direction: Joi.string().valid('asc', 'desc').default('desc')
      .messages({
        'any.only': 'Sort direction must be either "asc" or "desc"'
      })
  });

  // Validate search parameters against schema
  const result = validateSchema(searchParams, schema);

  if (!result.success) {
    throw createValidationError(
      'Driver search validation failed', 
      result.error.details, 
      result.error.code || ErrorCodes.VAL_INVALID_INPUT
    );
  }

  return result.data;
}