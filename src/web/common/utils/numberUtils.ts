/**
 * Utility functions for number manipulation, formatting, and validation across the web applications 
 * of the AI-driven Freight Optimization Platform. Provides standardized number handling to ensure 
 * consistent calculations and display throughout the application.
 */

/**
 * Constants for decimal place precision in different contexts
 */
export const DECIMAL_PLACES = {
  DEFAULT: 2,
  CURRENCY: 2,
  PERCENTAGE: 1,
  DISTANCE: 1,
  WEIGHT: 0,
  VOLUME: 1,
  DIMENSION: 1,
  EFFICIENCY_SCORE: 0,
  RATE_PER_MILE: 2
};

/**
 * Constants for different rounding methods
 */
export const ROUNDING_METHODS = {
  ROUND: 'round',
  FLOOR: 'floor',
  CEIL: 'ceil'
};

/**
 * Constants for locale-specific number formatting
 */
export const NUMBER_FORMATS = {
  DEFAULT: 'en-US',
  CURRENCY: 'en-US',
  PERCENTAGE: 'en-US'
};

/**
 * Rounds a number to a specified number of decimal places using the specified rounding method
 * @param value - The number to round
 * @param decimalPlaces - The number of decimal places to round to
 * @param method - The rounding method to use (round, floor, or ceil)
 * @returns The rounded number
 */
export const roundToDecimalPlaces = (
  value: number,
  decimalPlaces: number = DECIMAL_PLACES.DEFAULT,
  method: string = ROUNDING_METHODS.ROUND
): number => {
  if (!Number.isFinite(value)) {
    return NaN;
  }
  
  const multiplier = Math.pow(10, decimalPlaces);
  
  switch (method) {
    case ROUNDING_METHODS.FLOOR:
      return Math.floor(value * multiplier) / multiplier;
    case ROUNDING_METHODS.CEIL:
      return Math.ceil(value * multiplier) / multiplier;
    case ROUNDING_METHODS.ROUND:
    default:
      return Math.round(value * multiplier) / multiplier;
  }
};

/**
 * Constrains a number within a minimum and maximum range
 * @param value - The number to constrain
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The constrained number
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return NaN;
  }
  
  return Math.min(Math.max(value, min), max);
};

/**
 * Safely parses a string or other value to a number, with fallback to default value
 * @param value - The value to parse
 * @param defaultValue - The default value to return if parsing fails
 * @returns The parsed number or default value
 */
export const parseNumber = (value: any, defaultValue: number = 0): number => {
  if (value == null) {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : defaultValue;
  }
  
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

/**
 * Formats a number with thousands separators
 * @param value - The number to format
 * @returns Formatted number string with commas
 */
export const formatWithCommas = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '';
  }
  
  return value.toLocaleString(NUMBER_FORMATS.DEFAULT);
};

/**
 * Calculates a percentage of a value
 * @param value - The base value
 * @param percentage - The percentage to calculate
 * @returns The calculated percentage value
 */
export const calculatePercentage = (value: number, percentage: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(percentage)) {
    return NaN;
  }
  
  return (value * percentage) / 100;
};

/**
 * Calculates the percentage change between two values
 * @param oldValue - The original value
 * @param newValue - The new value
 * @returns The percentage change
 */
export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
  if (!Number.isFinite(oldValue) || !Number.isFinite(newValue)) {
    return NaN;
  }
  
  if (oldValue === 0) {
    return newValue > 0 ? Infinity : newValue < 0 ? -Infinity : 0;
  }
  
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Calculates the sum of an array of numbers
 * @param values - The array of numbers to sum
 * @returns The sum of the values
 */
export const sum = (values: number[]): number => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(val => Number.isFinite(val));
  return validValues.reduce((acc, val) => acc + val, 0);
};

/**
 * Calculates the average of an array of numbers
 * @param values - The array of numbers to average
 * @returns The average of the values
 */
export const average = (values: number[]): number => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(val => Number.isFinite(val));
  if (validValues.length === 0) {
    return 0;
  }
  
  return sum(validValues) / validValues.length;
};

/**
 * Calculates the median of an array of numbers
 * @param values - The array of numbers to find the median of
 * @returns The median of the values
 */
export const median = (values: number[]): number => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(val => Number.isFinite(val));
  if (validValues.length === 0) {
    return 0;
  }
  
  const sorted = [...validValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Finds the minimum value in an array of numbers
 * @param values - The array of numbers to find the minimum of
 * @returns The minimum value
 */
export const min = (values: number[]): number => {
  if (!Array.isArray(values) || values.length === 0) {
    return Infinity;
  }
  
  const validValues = values.filter(val => Number.isFinite(val));
  if (validValues.length === 0) {
    return Infinity;
  }
  
  return Math.min(...validValues);
};

/**
 * Finds the maximum value in an array of numbers
 * @param values - The array of numbers to find the maximum of
 * @returns The maximum value
 */
export const max = (values: number[]): number => {
  if (!Array.isArray(values) || values.length === 0) {
    return -Infinity;
  }
  
  const validValues = values.filter(val => Number.isFinite(val));
  if (validValues.length === 0) {
    return -Infinity;
  }
  
  return Math.max(...validValues);
};

/**
 * Checks if a value is a valid number or can be converted to a valid number
 * @param value - The value to check
 * @returns True if the value is numeric, false otherwise
 */
export const isNumeric = (value: any): boolean => {
  if (value == null) {
    return false;
  }
  
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  
  const parsed = parseFloat(String(value));
  return !isNaN(parsed) && Number.isFinite(parsed);
};

/**
 * Formats a number to a fixed number of decimal places without rounding
 * @param value - The number to format
 * @param decimalPlaces - The number of decimal places to format to
 * @returns The formatted number string
 */
export const toFixedNoRounding = (
  value: number,
  decimalPlaces: number = DECIMAL_PLACES.DEFAULT
): string => {
  if (!Number.isFinite(value)) {
    return '';
  }
  
  const stringValue = value.toString();
  const parts = stringValue.split('.');
  
  if (parts.length === 1) {
    return decimalPlaces > 0
      ? `${parts[0]}.${new Array(decimalPlaces).fill('0').join('')}`
      : parts[0];
  }
  
  const decimal = parts[1];
  
  if (decimal.length <= decimalPlaces) {
    return `${parts[0]}.${decimal}${new Array(decimalPlaces - decimal.length).fill('0').join('')}`;
  }
  
  return `${parts[0]}.${decimal.substring(0, decimalPlaces)}`;
};

/**
 * Generates a random number between min and max (inclusive)
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random number between min and max
 */
export const randomBetween = (min: number, max: number): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return NaN;
  }
  
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  
  return actualMin + Math.random() * (actualMax - actualMin);
};

/**
 * Calculates the rate per mile given a total rate and distance
 * @param rate - The total rate
 * @param miles - The distance in miles
 * @returns The rate per mile
 */
export const calculateRatePerMile = (rate: number, miles: number): number => {
  if (!Number.isFinite(rate) || !Number.isFinite(miles)) {
    return NaN;
  }
  
  if (miles <= 0) {
    return NaN;
  }
  
  return roundToDecimalPlaces(rate / miles, DECIMAL_PLACES.RATE_PER_MILE);
};