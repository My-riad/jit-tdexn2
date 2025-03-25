/**
 * Utility functions for string manipulation and formatting across the web applications 
 * of the AI-driven Freight Optimization Platform. Provides standardized string operations 
 * to ensure consistent text handling, formatting, and manipulation throughout the application.
 */

/**
 * Checks if a string is empty, null, or undefined
 *
 * @param value - The string to check
 * @returns True if the string is empty, null, or undefined, false otherwise
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return value === null || value === undefined || value.trim() === '';
};

/**
 * Capitalizes the first letter of a string
 *
 * @param value - The string to capitalize
 * @returns String with first letter capitalized
 */
export const capitalize = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 * Converts a camelCase string to snake_case
 *
 * @param value - The camelCase string to convert
 * @returns String converted to snake_case
 */
export const camelToSnakeCase = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/([A-Z])/g, '_$1').toLowerCase();
};

/**
 * Converts a snake_case string to camelCase
 *
 * @param value - The snake_case string to convert
 * @returns String converted to camelCase
 */
export const snakeToCamelCase = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Converts a kebab-case string to camelCase
 *
 * @param value - The kebab-case string to convert
 * @returns String converted to camelCase
 */
export const kebabToCamelCase = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Converts a camelCase string to kebab-case
 *
 * @param value - The camelCase string to convert
 * @returns String converted to kebab-case
 */
export const camelToKebabCase = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/([A-Z])/g, '-$1').toLowerCase();
};

/**
 * Converts a string to title case (first letter of each word capitalized)
 *
 * @param value - The string to convert
 * @returns String converted to title case
 */
export const toTitleCase = (value: string | null | undefined): string => {
  if (!value) return '';
  return value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Formats an enum value (typically UPPER_SNAKE_CASE) to a human-readable string
 *
 * @param value - The enum value to format
 * @returns Formatted human-readable string
 */
export const formatEnumValue = (value: string | null | undefined): string => {
  if (!value) return '';
  return toTitleCase(value.replace(/_/g, ' ').toLowerCase());
};

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 *
 * @param value - The string to truncate
 * @param maxLength - Maximum length before truncation (default: 50)
 * @param ellipsis - The ellipsis string to append (default: '...')
 * @returns Truncated string with ellipsis if truncated
 */
export const truncate = (
  value: string | null | undefined,
  maxLength = 50,
  ellipsis = '...'
): string => {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Removes special characters from a string, leaving only alphanumeric characters
 *
 * @param value - The string to clean
 * @returns String with special characters removed
 */
export const removeSpecialCharacters = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Removes all non-digit characters from a string
 *
 * @param value - The string to clean
 * @returns String with only digits
 */
export const removeNonDigits = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

/**
 * Pluralizes a word based on a count value
 *
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word (optional, defaults to singular + 's')
 * @param count - The count to determine pluralization
 * @returns Singular or plural form based on count
 */
export const pluralize = (
  singular: string,
  plural: string | undefined = undefined,
  count: number
): string => {
  if (!singular) return '';
  if (count === 1) return singular;
  return plural || `${singular}s`;
};

/**
 * Formats a number as a string with commas as thousand separators
 *
 * @param value - The number to format
 * @returns Number formatted with commas
 */
export const formatWithCommas = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Escapes HTML special characters in a string to prevent XSS attacks
 *
 * @param value - The string to escape
 * @returns HTML-escaped string
 */
export const escapeHtml = (value: string | null | undefined): string => {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generates a unique string ID for client-side use
 *
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export const generateUniqueId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}-${randomStr}`;
};

/**
 * Extracts initials from a full name
 *
 * @param fullName - The full name to extract initials from
 * @param maxInitials - Maximum number of initials to extract (default: 2)
 * @returns Initials string
 */
export const formatInitials = (fullName: string | null | undefined, maxInitials = 2): string => {
  if (!fullName) return '';
  
  const nameParts = fullName.split(' ').filter(part => part.length > 0);
  let initials = nameParts
    .map(part => part.charAt(0))
    .slice(0, maxInitials)
    .join('');
  
  return initials.toUpperCase();
};