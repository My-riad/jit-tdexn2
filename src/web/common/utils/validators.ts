/**
 * A utility module providing validation functions for form inputs and data integrity
 * across the web applications of the AI-driven Freight Optimization Platform.
 * 
 * This module includes validators for common data types, specialized logistics-related
 * validations, and form validation helpers to ensure data integrity and provide
 * a consistent user experience.
 */

import { formatValidationErrors } from './errorHandlers';
import { isValidDate, isDateInFuture, isDateInPast } from './dateTimeUtils';
import { LoadCreationParams } from '../interfaces/load.interface';
import { DriverCreationParams } from '../interfaces/driver.interface';
import { VehicleCreationParams } from '../interfaces/vehicle.interface';

/**
 * Validates that a value is not empty, null, or undefined
 * @param value The value to validate
 * @returns True if valid, or an error message if invalid
 */
export const isRequired = (value: any): boolean | string => {
  if (value === undefined || value === null) {
    return 'This field is required';
  }

  if (typeof value === 'string' && value.trim() === '') {
    return 'This field is required';
  }

  if (Array.isArray(value) && value.length === 0) {
    return 'At least one item is required';
  }

  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
    return 'This field is required';
  }

  return true;
};

/**
 * Validates that a value is a properly formatted email address
 * @param value The email to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isEmail = (value: string, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }

  // Basic email format regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(String(value).toLowerCase())) {
    return 'Please enter a valid email address';
  }

  return true;
};

/**
 * Validates that a value is a properly formatted phone number
 * @param value The phone number to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isPhone = (value: string, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }

  // Accept formats like: (123) 456-7890, 123-456-7890, 1234567890
  const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  
  if (!phoneRegex.test(String(value))) {
    return 'Please enter a valid phone number';
  }

  return true;
};

/**
 * Validates that a value is a properly formatted US zip code
 * @param value The zip code to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isZipCode = (value: string, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }

  // US zip code: 5 digits or 5+4 format
  const zipRegex = /^\d{5}(?:[-\s]\d{4})?$/;
  
  if (!zipRegex.test(String(value))) {
    return 'Please enter a valid zip code (e.g., 12345 or 12345-6789)';
  }

  return true;
};

/**
 * Validates that a value is a properly formatted license plate
 * @param value The license plate to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isLicensePlate = (value: string, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }

  // Most US license plates: 1-8 alphanumeric characters, may include hyphens or spaces
  const plateRegex = /^[A-Z0-9][A-Z0-9\s-]{0,7}$/i;
  
  if (!plateRegex.test(String(value))) {
    return 'Please enter a valid license plate';
  }

  return true;
};

/**
 * Validates that a value is a properly formatted Vehicle Identification Number (VIN)
 * @param value The VIN to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isVIN = (value: string, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }

  const vinValue = String(value).toUpperCase();
  
  // Basic VIN check: 17 characters excluding I, O, Q
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  
  if (!vinRegex.test(vinValue)) {
    return 'Please enter a valid 17-character VIN';
  }

  // Could add additional VIN validation like checksum verification
  // for enhanced validation, but this covers basic format

  return true;
};

/**
 * Validates that a value is a valid latitude coordinate
 * @param value The latitude to validate
 * @returns True if valid, or an error message if invalid
 */
export const isLatitude = (value: number): boolean | string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Latitude must be a number';
  }
  
  if (value < -90 || value > 90) {
    return 'Latitude must be between -90 and 90 degrees';
  }
  
  return true;
};

/**
 * Validates that a value is a valid longitude coordinate
 * @param value The longitude to validate
 * @returns True if valid, or an error message if invalid
 */
export const isLongitude = (value: number): boolean | string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Longitude must be a number';
  }
  
  if (value < -180 || value > 180) {
    return 'Longitude must be between -180 and 180 degrees';
  }
  
  return true;
};

/**
 * Validates that a value is a valid geographic coordinate pair
 * @param value The coordinates object to validate
 * @returns True if valid, or an error message if invalid
 */
export const isCoordinates = (value: any): boolean | string => {
  if (!value || typeof value !== 'object') {
    return 'Coordinates must be an object with latitude and longitude';
  }
  
  if (value.latitude === undefined || value.longitude === undefined) {
    return 'Coordinates must contain latitude and longitude';
  }
  
  const latCheck = isLatitude(value.latitude);
  if (latCheck !== true) {
    return latCheck;
  }
  
  const lngCheck = isLongitude(value.longitude);
  if (lngCheck !== true) {
    return lngCheck;
  }
  
  return true;
};

/**
 * Validates that a value is a number
 * @param value The value to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isNumber = (value: any, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return 'Please enter a valid number';
  }
  
  return true;
};

/**
 * Validates that a value is an integer
 * @param value The value to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isInteger = (value: any, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  const numberCheck = isNumber(value);
  if (numberCheck !== true) {
    return numberCheck;
  }
  
  const numValue = Number(value);
  if (!Number.isInteger(numValue)) {
    return 'Please enter a whole number without decimals';
  }
  
  return true;
};

/**
 * Validates that a value is a positive number
 * @param value The value to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isPositiveNumber = (value: any, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  const numberCheck = isNumber(value);
  if (numberCheck !== true) {
    return numberCheck;
  }
  
  const numValue = Number(value);
  if (numValue <= 0) {
    return 'Please enter a positive number';
  }
  
  return true;
};

/**
 * Validates that a value is a non-negative number (zero or positive)
 * @param value The value to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isNonNegativeNumber = (value: any, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  const numberCheck = isNumber(value);
  if (numberCheck !== true) {
    return numberCheck;
  }
  
  const numValue = Number(value);
  if (numValue < 0) {
    return 'Please enter a non-negative number';
  }
  
  return true;
};

/**
 * Validates that a number is within a specified range
 * @param value The value to validate
 * @param min The minimum allowed value (inclusive)
 * @param max The maximum allowed value (inclusive)
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isInRange = (
  value: any, 
  min: number, 
  max: number, 
  optional = false
): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  const numberCheck = isNumber(value);
  if (numberCheck !== true) {
    return numberCheck;
  }
  
  const numValue = Number(value);
  if (numValue < min || numValue > max) {
    return `Please enter a number between ${min} and ${max}`;
  }
  
  return true;
};

/**
 * Validates that a string has at least a minimum length
 * @param value The string to validate
 * @param minLength The minimum required length
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isMinLength = (
  value: string, 
  minLength: number, 
  optional = false
): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  if (typeof value !== 'string') {
    return 'Expected a text value';
  }
  
  if (value.length < minLength) {
    return `Must be at least ${minLength} characters`;
  }
  
  return true;
};

/**
 * Validates that a string does not exceed a maximum length
 * @param value The string to validate
 * @param maxLength The maximum allowed length
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isMaxLength = (
  value: string, 
  maxLength: number, 
  optional = false
): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  if (typeof value !== 'string') {
    return 'Expected a text value';
  }
  
  if (value.length > maxLength) {
    return `Must not exceed ${maxLength} characters`;
  }
  
  return true;
};

/**
 * Validates that a string's length is between a minimum and maximum
 * @param value The string to validate
 * @param minLength The minimum required length
 * @param maxLength The maximum allowed length
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isLengthBetween = (
  value: string, 
  minLength: number, 
  maxLength: number, 
  optional = false
): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  const minLengthCheck = isMinLength(value, minLength);
  if (minLengthCheck !== true) {
    return minLengthCheck;
  }
  
  const maxLengthCheck = isMaxLength(value, maxLength);
  if (maxLengthCheck !== true) {
    return maxLengthCheck;
  }
  
  return true;
};

/**
 * Validates that a value is a valid date and time string
 * @param value The date/time string to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isValidDateTime = (value: string, optional = false): boolean | string => {
  if ((value === undefined || value === null || value === '') && optional) {
    return true;
  }
  
  const date = new Date(value);
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Please enter a valid date and time';
  }
  
  return true;
};

/**
 * Validates that a time window has valid start and end times with start before end
 * @param startTime The start time
 * @param endTime The end time
 * @returns True if valid, or an error message if invalid
 */
export const isValidTimeWindow = (startTime: string, endTime: string): boolean | string => {
  const startTimeCheck = isValidDateTime(startTime);
  if (startTimeCheck !== true) {
    return 'Invalid start time: ' + startTimeCheck;
  }
  
  const endTimeCheck = isValidDateTime(endTime);
  if (endTimeCheck !== true) {
    return 'Invalid end time: ' + endTimeCheck;
  }
  
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  if (startDate >= endDate) {
    return 'Start time must be before end time';
  }
  
  return true;
};

/**
 * Validates that an address object has all required fields
 * @param address The address object to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isValidAddress = (address: any, optional = false): boolean | string => {
  if ((address === undefined || address === null) && optional) {
    return true;
  }
  
  if (!address || typeof address !== 'object') {
    return 'Address information is required';
  }
  
  if (!address.street1) {
    return 'Street address is required';
  }
  
  if (!address.city) {
    return 'City is required';
  }
  
  if (!address.state) {
    return 'State is required';
  }
  
  if (!address.zipCode) {
    return 'Zip code is required';
  }
  
  const zipCheck = isZipCode(address.zipCode);
  if (zipCheck !== true) {
    return zipCheck;
  }
  
  return true;
};

/**
 * Validates that contact information has valid phone and/or email
 * @param contactInfo The contact info object to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isValidContactInfo = (contactInfo: any, optional = false): boolean | string => {
  if ((contactInfo === undefined || contactInfo === null) && optional) {
    return true;
  }
  
  if (!contactInfo || typeof contactInfo !== 'object') {
    return 'Contact information is required';
  }
  
  // Require at least one contact method
  if (!contactInfo.phone && !contactInfo.email) {
    return 'At least one contact method (phone or email) is required';
  }
  
  if (contactInfo.phone) {
    const phoneCheck = isPhone(contactInfo.phone);
    if (phoneCheck !== true) {
      return phoneCheck;
    }
  }
  
  if (contactInfo.email) {
    const emailCheck = isEmail(contactInfo.email);
    if (emailCheck !== true) {
      return emailCheck;
    }
  }
  
  return true;
};

/**
 * Validates that load dimensions are valid and within acceptable ranges
 * @param dimensions The dimensions object to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isValidLoadDimensions = (dimensions: any, optional = false): boolean | string => {
  if ((dimensions === undefined || dimensions === null) && optional) {
    return true;
  }
  
  if (!dimensions || typeof dimensions !== 'object') {
    return 'Dimensions information is required';
  }
  
  // Check that all dimension properties exist
  if (dimensions.length === undefined || dimensions.width === undefined || dimensions.height === undefined) {
    return 'Length, width, and height are all required';
  }
  
  // Validate length (standard trailer length is up to 53 feet)
  const lengthCheck = isInRange(dimensions.length, 0, 60);
  if (lengthCheck !== true) {
    return 'Length: ' + lengthCheck;
  }
  
  // Validate width (standard trailer width is 8.5 feet)
  const widthCheck = isInRange(dimensions.width, 0, 10);
  if (widthCheck !== true) {
    return 'Width: ' + widthCheck;
  }
  
  // Validate height (standard trailer height is 13.5 feet)
  const heightCheck = isInRange(dimensions.height, 0, 15);
  if (heightCheck !== true) {
    return 'Height: ' + heightCheck;
  }
  
  return true;
};

/**
 * Validates that a temperature range is valid with min less than max
 * @param temperatureRange The temperature range object to validate
 * @param optional Whether the field is optional (default: false)
 * @returns True if valid, or an error message if invalid
 */
export const isValidTemperatureRange = (temperatureRange: any, optional = false): boolean | string => {
  if ((temperatureRange === undefined || temperatureRange === null) && optional) {
    return true;
  }
  
  if (!temperatureRange || typeof temperatureRange !== 'object') {
    return 'Temperature range information is required';
  }
  
  // Check that all required properties exist
  if (temperatureRange.min === undefined || temperatureRange.max === undefined || temperatureRange.unit === undefined) {
    return 'Minimum temperature, maximum temperature, and unit are all required';
  }
  
  // Validate min and max are numbers
  const minCheck = isNumber(temperatureRange.min);
  if (minCheck !== true) {
    return 'Minimum temperature: ' + minCheck;
  }
  
  const maxCheck = isNumber(temperatureRange.max);
  if (maxCheck !== true) {
    return 'Maximum temperature: ' + maxCheck;
  }
  
  // Validate min is less than max
  if (Number(temperatureRange.min) >= Number(temperatureRange.max)) {
    return 'Minimum temperature must be less than maximum temperature';
  }
  
  // Validate unit is a valid temperature unit
  if (temperatureRange.unit !== 'F' && temperatureRange.unit !== 'C') {
    return 'Temperature unit must be either F or C';
  }
  
  return true;
};

/**
 * Validates a form object against a validation schema
 * @param values The form values to validate
 * @param validationSchema Object defining validation rules for each field
 * @returns Object containing validation errors, if any
 */
export const validateForm = (
  values: Record<string, any>,
  validationSchema: Record<string, (value: any) => boolean | string>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.keys(validationSchema).forEach(field => {
    if (validationSchema[field]) {
      const validationResult = validationSchema[field](values[field]);
      if (validationResult !== true) {
        errors[field] = validationResult as string;
      }
    }
  });
  
  return errors;
};

/**
 * Validates load creation parameters against business rules
 * @param params Load creation parameters to validate
 * @returns Object containing validation errors, if any
 */
export const validateLoadCreation = (params: LoadCreationParams): Record<string, string> => {
  const validationSchema = {
    shipperId: (value: string) => isRequired(value),
    referenceNumber: (value: string) => isMinLength(value, 1),
    description: (value: string) => isMaxLength(value, 500, true),
    equipmentType: (value: string) => isRequired(value),
    weight: (value: number) => isPositiveNumber(value),
    dimensions: (value: any) => isValidLoadDimensions(value),
    volume: (value: number) => isNonNegativeNumber(value, true),
    pallets: (value: number) => isNonNegativeNumber(value, true),
    pickupEarliest: (value: string) => isValidDateTime(value),
    pickupLatest: (value: string) => isValidDateTime(value),
    deliveryEarliest: (value: string) => isValidDateTime(value),
    deliveryLatest: (value: string) => isValidDateTime(value),
    offeredRate: (value: number) => isPositiveNumber(value),
    specialInstructions: (value: string) => isMaxLength(value, 1000, true),
    locations: (value: any[]) => {
      if (!Array.isArray(value) || value.length < 2) {
        return 'At least pickup and delivery locations are required';
      }
      return true;
    }
  };
  
  // Basic field validation
  const errors = validateForm(params, validationSchema);
  
  // Custom validation for time windows
  if (params.pickupEarliest && params.pickupLatest) {
    const pickupWindowCheck = isValidTimeWindow(params.pickupEarliest, params.pickupLatest);
    if (pickupWindowCheck !== true) {
      errors.pickupWindow = pickupWindowCheck as string;
    }
  }
  
  if (params.deliveryEarliest && params.deliveryLatest) {
    const deliveryWindowCheck = isValidTimeWindow(params.deliveryEarliest, params.deliveryLatest);
    if (deliveryWindowCheck !== true) {
      errors.deliveryWindow = deliveryWindowCheck as string;
    }
  }
  
  // Ensure delivery window is after pickup window
  if (
    params.pickupLatest && 
    params.deliveryEarliest && 
    new Date(params.pickupLatest) > new Date(params.deliveryEarliest)
  ) {
    errors.deliveryEarliest = 'Delivery window must be after pickup window';
  }
  
  // Validate each location
  if (Array.isArray(params.locations)) {
    params.locations.forEach((location, index) => {
      if (location.locationType !== 'pickup' && location.locationType !== 'delivery' && location.locationType !== 'stop') {
        errors[`locations[${index}].locationType`] = 'Invalid location type';
      }
      
      const addressCheck = isValidAddress(location.address);
      if (addressCheck !== true) {
        errors[`locations[${index}].address`] = addressCheck as string;
      }
      
      if (location.earliestTime && location.latestTime) {
        const timeWindowCheck = isValidTimeWindow(location.earliestTime, location.latestTime);
        if (timeWindowCheck !== true) {
          errors[`locations[${index}].timeWindow`] = timeWindowCheck as string;
        }
      }
      
      const contactCheck = isValidContactInfo(
        { name: location.contactName, phone: location.contactPhone },
        true
      );
      if (contactCheck !== true) {
        errors[`locations[${index}].contact`] = contactCheck as string;
      }
    });
  }
  
  // Validate temperature requirements if specified
  if (params.temperatureRequirements) {
    const tempCheck = isValidTemperatureRange(params.temperatureRequirements);
    if (tempCheck !== true) {
      errors.temperatureRequirements = tempCheck as string;
    }
  }
  
  return errors;
};

/**
 * Validates driver creation parameters against business rules
 * @param params Driver creation parameters to validate
 * @returns Object containing validation errors, if any
 */
export const validateDriverCreation = (params: DriverCreationParams): Record<string, string> => {
  const validationSchema = {
    userId: (value: string) => isRequired(value),
    carrierId: (value: string) => isRequired(value),
    firstName: (value: string) => isRequired(value),
    lastName: (value: string) => isRequired(value),
    email: (value: string) => isEmail(value),
    phone: (value: string) => isPhone(value),
    licenseNumber: (value: string) => isRequired(value),
    licenseState: (value: string) => isRequired(value),
    licenseClass: (value: string) => isRequired(value),
    licenseEndorsements: (value: any) => {
      if (!Array.isArray(value)) {
        return 'License endorsements must be an array';
      }
      return true;
    },
    licenseExpiration: (value: string) => {
      const dateCheck = isValidDate(value);
      if (dateCheck !== true) {
        return 'Please enter a valid expiration date';
      }
      
      const futureCheck = isDateInFuture(value);
      if (futureCheck !== true) {
        return 'License expiration date must be in the future';
      }
      
      return true;
    },
    homeAddress: (value: any) => isValidAddress(value)
  };
  
  // Basic field validation
  const errors = validateForm(params, validationSchema);
  
  // Validate license class is valid
  if (
    params.licenseClass && 
    !['class_a', 'class_b', 'class_c'].includes(params.licenseClass)
  ) {
    errors.licenseClass = 'Invalid license class';
  }
  
  // Validate endorsements are valid
  if (Array.isArray(params.licenseEndorsements)) {
    const validEndorsements = ['hazmat', 'tanker', 'passenger', 'school_bus', 'double_triple', 'combination'];
    params.licenseEndorsements.forEach((endorsement, index) => {
      if (!validEndorsements.includes(endorsement)) {
        errors[`licenseEndorsements[${index}]`] = `Invalid endorsement: ${endorsement}`;
      }
    });
  }
  
  return errors;
};

/**
 * Validates vehicle creation parameters against business rules
 * @param params Vehicle creation parameters to validate
 * @returns Object containing validation errors, if any
 */
export const validateVehicleCreation = (params: VehicleCreationParams): Record<string, string> => {
  const validationSchema = {
    carrier_id: (value: string) => isRequired(value),
    type: (value: string) => isRequired(value),
    vin: (value: string) => isVIN(value),
    make: (value: string) => isRequired(value),
    model: (value: string) => isRequired(value),
    year: (value: number) => {
      const currentYear = new Date().getFullYear();
      return isInRange(value, 1980, currentYear + 1);
    },
    plate_number: (value: string) => isLicensePlate(value),
    plate_state: (value: string) => isRequired(value),
    weight_capacity: (value: number) => isPositiveNumber(value),
    volume_capacity: (value: number) => isPositiveNumber(value),
    dimensions: (value: any) => {
      if (!value || typeof value !== 'object') {
        return 'Dimensions are required';
      }
      
      if (value.length === undefined || value.width === undefined || value.height === undefined) {
        return 'Length, width, and height are all required';
      }
      
      const lengthCheck = isPositiveNumber(value.length);
      if (lengthCheck !== true) {
        return 'Length: ' + lengthCheck;
      }
      
      const widthCheck = isPositiveNumber(value.width);
      if (widthCheck !== true) {
        return 'Width: ' + widthCheck;
      }
      
      const heightCheck = isPositiveNumber(value.height);
      if (heightCheck !== true) {
        return 'Height: ' + heightCheck;
      }
      
      return true;
    },
    fuel_type: (value: string) => isRequired(value),
    fuel_capacity: (value: number) => isPositiveNumber(value),
    average_mpg: (value: number) => isPositiveNumber(value),
    odometer: (value: number) => isNonNegativeNumber(value)
  };
  
  // Basic field validation
  const errors = validateForm(params, validationSchema);
  
  // Validate vehicle type is valid
  const validVehicleTypes = [
    'TRACTOR', 'STRAIGHT_TRUCK', 'DRY_VAN_TRAILER', 'REFRIGERATED_TRAILER',
    'FLATBED_TRAILER', 'TANKER_TRAILER', 'LOWBOY_TRAILER', 'STEP_DECK_TRAILER', 'SPECIALIZED'
  ];
  
  if (params.type && !validVehicleTypes.includes(params.type)) {
    errors.type = 'Invalid vehicle type';
  }
  
  // Validate fuel type is valid
  const validFuelTypes = [
    'DIESEL', 'GASOLINE', 'ELECTRIC', 'HYBRID', 'NATURAL_GAS', 'HYDROGEN'
  ];
  
  if (params.fuel_type && !validFuelTypes.includes(params.fuel_type)) {
    errors.fuel_type = 'Invalid fuel type';
  }
  
  return errors;
};

// Re-export date validation functions from dateTimeUtils
export { isValidDate, isDateInFuture, isDateInPast };