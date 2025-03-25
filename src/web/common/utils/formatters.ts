/**
 * Utility functions for formatting various data types consistently across the web applications
 * of the AI-driven Freight Optimization Platform. Provides standardized formatting for currency,
 * distances, weights, dimensions, addresses, phone numbers, and other domain-specific values.
 */

import { DECIMAL_PLACES, roundToDecimalPlaces } from './numberUtils';

/**
 * Constants for distance unit formatting
 */
export const DISTANCE_UNITS = {
  MILES: 'mi',
  KILOMETERS: 'km',
};

/**
 * Constants for weight unit formatting
 */
export const WEIGHT_UNITS = {
  POUNDS: 'lbs',
  KILOGRAMS: 'kg',
};

/**
 * Constants for volume unit formatting
 */
export const VOLUME_UNITS = {
  CUBIC_FEET: 'cu ft',
  CUBIC_METERS: 'm³',
};

/**
 * Constants for dimension unit formatting
 */
export const DIMENSION_UNITS = {
  FEET: 'ft',
  INCHES: 'in',
  METERS: 'm',
  CENTIMETERS: 'cm',
};

/**
 * Formats a number as currency with dollar sign and appropriate decimal places
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., '$1,234.56')
 */
export const formatCurrency = (
  value: number,
  options = { decimalPlaces: DECIMAL_PLACES.CURRENCY, symbol: '$', locale: 'en-US' }
): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options.decimalPlaces,
    maximumFractionDigits: options.decimalPlaces,
    currencyDisplay: 'symbol',
  }).format(value);
};

/**
 * Formats a number with thousands separators and specified decimal places
 * @param value - The number to format
 * @param decimalPlaces - Number of decimal places
 * @param locale - Locale to use for formatting
 * @returns Formatted number string (e.g., '1,234.56')
 */
export const formatNumber = (
  value: number,
  decimalPlaces = DECIMAL_PLACES.DEFAULT,
  locale = 'en-US'
): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
};

/**
 * Formats a number as a percentage with appropriate decimal places
 * @param value - The number to format
 * @param decimalPlaces - Number of decimal places
 * @param includeSymbol - Whether to include the % symbol
 * @returns Formatted percentage string (e.g., '42%' or '42.5%')
 */
export const formatPercentage = (
  value: number,
  decimalPlaces = DECIMAL_PLACES.PERCENTAGE,
  includeSymbol = true
): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  // Convert decimal to percentage if needed (e.g., 0.42 to 42)
  const percentValue = value < 1 && value > -1 ? value * 100 : value;
  
  const roundedValue = roundToDecimalPlaces(percentValue, decimalPlaces);
  const formattedValue = formatNumber(roundedValue, decimalPlaces);
  
  return includeSymbol ? `${formattedValue}%` : formattedValue;
};

/**
 * Formats a distance value with appropriate unit and decimal places
 * @param value - The distance value to format
 * @param unit - The unit of measurement
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted distance string (e.g., '123.4 mi')
 */
export const formatDistance = (
  value: number,
  unit = DISTANCE_UNITS.MILES,
  decimalPlaces = DECIMAL_PLACES.DISTANCE
): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const roundedValue = roundToDecimalPlaces(value, decimalPlaces);
  const formattedValue = formatNumber(roundedValue, decimalPlaces);
  
  return `${formattedValue} ${unit}`;
};

/**
 * Formats a weight value with appropriate unit and decimal places
 * @param value - The weight value to format
 * @param unit - The unit of measurement
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted weight string (e.g., '42,000 lbs')
 */
export const formatWeight = (
  value: number,
  unit = WEIGHT_UNITS.POUNDS,
  decimalPlaces = DECIMAL_PLACES.WEIGHT
): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const roundedValue = roundToDecimalPlaces(value, decimalPlaces);
  const formattedValue = formatNumber(roundedValue, decimalPlaces);
  
  return `${formattedValue} ${unit}`;
};

/**
 * Formats a volume value with appropriate unit and decimal places
 * @param value - The volume value to format
 * @param unit - The unit of measurement
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted volume string (e.g., '1,500 cu ft')
 */
export const formatVolume = (
  value: number,
  unit = VOLUME_UNITS.CUBIC_FEET,
  decimalPlaces = DECIMAL_PLACES.DEFAULT
): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const roundedValue = roundToDecimalPlaces(value, decimalPlaces);
  const formattedValue = formatNumber(roundedValue, decimalPlaces);
  
  return `${formattedValue} ${unit}`;
};

/**
 * Formats a single dimension value with appropriate unit
 * @param value - The dimension value to format
 * @param unit - The unit of measurement
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted dimension string (e.g., '53 ft')
 */
export const formatDimension = (
  value: number,
  unit = DIMENSION_UNITS.FEET,
  decimalPlaces = DECIMAL_PLACES.DEFAULT
): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const roundedValue = roundToDecimalPlaces(value, decimalPlaces);
  const formattedValue = formatNumber(roundedValue, decimalPlaces);
  
  return `${formattedValue} ${unit}`;
};

/**
 * Formats a set of dimensions (length, width, height) with appropriate units
 * @param dimensions - Object containing length, width, and height
 * @param unit - The unit of measurement
 * @param separator - Separator between dimensions
 * @returns Formatted dimensions string (e.g., '53 ft × 8.5 ft × 9 ft')
 */
export const formatDimensions = (
  dimensions: { length?: number; width?: number; height?: number },
  unit = DIMENSION_UNITS.FEET,
  separator = ' × '
): string => {
  if (!dimensions || 
      !Number.isFinite(dimensions.length) || 
      !Number.isFinite(dimensions.width) || 
      !Number.isFinite(dimensions.height)) {
    return '';
  }

  const formattedLength = formatDimension(dimensions.length!, unit);
  const formattedWidth = formatDimension(dimensions.width!, unit);
  const formattedHeight = formatDimension(dimensions.height!, unit);
  
  return `${formattedLength}${separator}${formattedWidth}${separator}${formattedHeight}`;
};

/**
 * Formats a phone number according to US format or specified format
 * @param phoneNumber - The phone number to format
 * @param format - Format pattern to use (# will be replaced with digits)
 * @returns Formatted phone number string (e.g., '(555) 123-4567')
 */
export const formatPhoneNumber = (
  phoneNumber: string,
  format = '(###) ###-####'
): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Ensure we have the expected number of digits for the format
  // (assuming format uses all #s to represent digits)
  const requiredDigits = format.split('').filter(char => char === '#').length;
  
  if (digits.length < requiredDigits) {
    return phoneNumber; // Return original if not enough digits
  }
  
  // Replace # with digits in the format
  let formattedNumber = format;
  for (let i = 0; i < requiredDigits; i++) {
    formattedNumber = formattedNumber.replace('#', digits[i]);
  }
  
  return formattedNumber;
};

/**
 * Formats an address object into a readable address string
 * @param address - Address object with components
 * @param includeCountry - Whether to include the country
 * @returns Formatted address string (e.g., '123 Main St, Anytown, CA 12345')
 */
export const formatAddress = (
  address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  },
  includeCountry = false
): string => {
  if (!address) {
    return '';
  }

  const { street1, street2, city, state, zipCode, country } = address;
  
  const streetAddress = [street1, street2].filter(Boolean).join(', ');
  const cityStateZip = [
    city,
    state && zipCode ? `${state} ${zipCode}` : (state || zipCode)
  ].filter(Boolean).join(', ');
  
  const parts = [streetAddress, cityStateZip].filter(Boolean);
  
  if (includeCountry && country) {
    parts.push(country);
  }
  
  return parts.join(', ');
};

/**
 * Formats a rate per mile value with currency symbol and appropriate decimal places
 * @param rate - The total rate
 * @param miles - The total miles
 * @param options - Formatting options
 * @returns Formatted rate per mile string (e.g., '$3.25/mi')
 */
export const formatRatePerMile = (
  rate: number,
  miles: number,
  options = { decimalPlaces: 2, symbol: '$' }
): string => {
  if (!Number.isFinite(rate) || !Number.isFinite(miles)) {
    return '';
  }
  
  if (miles <= 0) {
    return '';
  }
  
  const ratePerMile = rate / miles;
  const roundedRate = roundToDecimalPlaces(ratePerMile, options.decimalPlaces);
  
  return `${options.symbol}${formatNumber(roundedRate, options.decimalPlaces)}/mi`;
};

/**
 * Formats an efficiency score as a whole number with optional suffix
 * @param score - The efficiency score to format
 * @param includeSuffix - Whether to include the 'pts' suffix
 * @returns Formatted efficiency score string (e.g., '87' or '87 pts')
 */
export const formatEfficiencyScore = (
  score: number,
  includeSuffix = false
): string => {
  if (!Number.isFinite(score)) {
    return '';
  }
  
  const roundedScore = Math.round(score);
  const formattedScore = formatNumber(roundedScore, 0);
  
  return includeSuffix ? `${formattedScore} pts` : formattedScore;
};

/**
 * Formats a load status enum value into a human-readable string
 * @param status - The load status enum value
 * @returns Formatted load status string (e.g., 'In Transit' from 'IN_TRANSIT')
 */
export const formatLoadStatus = (
  status: string
): string => {
  if (!status || typeof status !== 'string') {
    return '';
  }
  
  // Convert from UPPER_SNAKE_CASE to Title Case
  const formattedStatus = status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Handle special cases for better readability
  switch (status) {
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'AT_PICKUP':
      return 'At Pickup';
    case 'AT_DELIVERY':
      return 'At Delivery';
    case 'AT_DROPOFF':
      return 'At Dropoff';
    default:
      return formattedStatus;
  }
};

/**
 * Formats a driver status enum value into a human-readable string
 * @param status - The driver status enum value
 * @returns Formatted driver status string (e.g., 'On Duty' from 'ON_DUTY')
 */
export const formatDriverStatus = (
  status: string
): string => {
  if (!status || typeof status !== 'string') {
    return '';
  }
  
  // Convert from UPPER_SNAKE_CASE to Title Case
  const formattedStatus = status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Handle special cases for better readability
  switch (status) {
    case 'ON_DUTY':
      return 'On Duty';
    case 'OFF_DUTY':
      return 'Off Duty';
    case 'DRIVING':
      return 'Driving';
    default:
      return formattedStatus;
  }
};

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param ellipsis - String to append when truncated
 * @returns Truncated text string with ellipsis if truncated
 */
export const truncateText = (
  text: string,
  maxLength = 50,
  ellipsis = '...'
): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Capitalizes the first letter of a string
 * @param text - The string to capitalize
 * @returns String with first letter capitalized
 */
export const capitalizeFirstLetter = (
  text: string
): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Formats a file size in bytes to a human-readable format
 * @param bytes - The file size in bytes
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted file size string (e.g., '1.5 MB')
 */
export const formatFileSize = (
  bytes: number,
  decimalPlaces = 2
): string => {
  if (!Number.isFinite(bytes)) {
    return '';
  }
  
  if (bytes === 0) {
    return '0 Bytes';
  }
  
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = bytes / Math.pow(k, i);
  const roundedSize = roundToDecimalPlaces(size, decimalPlaces);
  
  return `${formatNumber(roundedSize, decimalPlaces)} ${units[i]}`;
};