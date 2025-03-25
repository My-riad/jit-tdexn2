/**
 * Date and time utility functions for the AI-driven Freight Optimization Platform
 * Provides consistent date/time handling for load scheduling, driver availability, and analytics
 */

import {
  format,
  parse,
  addDays as addDaysOriginal,
  addHours as addHoursOriginal,
  addMinutes as addMinutesOriginal,
  addMonths,
  subDays as subDaysOriginal,
  subHours as subHoursOriginal,
  subMinutes as subMinutesOriginal,
  differenceInMinutes as differenceInMinutesOriginal,
  differenceInHours as differenceInHoursOriginal,
  differenceInDays as differenceInDaysOriginal,
  isAfter,
  isBefore,
  isEqual,
  isToday as isTodayOriginal,
  startOfDay as startOfDayOriginal,
  endOfDay as endOfDayOriginal,
  startOfWeek as startOfWeekOriginal,
  endOfWeek as endOfWeekOriginal,
  startOfMonth as startOfMonthOriginal,
  endOfMonth as endOfMonthOriginal,
} from 'date-fns'; // v2.29.3

import { formatRelative } from 'date-fns'; // v2.29.3
import { format as formatTz, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'; // v2.0.0

/**
 * Standard date format constants
 */
export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  MEDIUM: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  ISO: 'yyyy-MM-dd',
  API: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
};

/**
 * Standard time format constants
 */
export const TIME_FORMATS = {
  SHORT: 'h:mm a',
  MEDIUM: 'h:mm:ss a',
  MILITARY: 'HH:mm',
  SECONDS: 'HH:mm:ss',
  ISO: 'HH:mm:ss.SSS'
};

/**
 * Standard date-time format constants
 */
export const DATETIME_FORMATS = {
  SHORT: 'MM/dd/yyyy h:mm a',
  MEDIUM: 'MMM d, yyyy h:mm a',
  LONG: 'MMMM d, yyyy h:mm:ss a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
};

/**
 * Validates if a date value is usable
 * 
 * @param date The date to validate
 * @returns Whether the date is valid
 */
const isValidDate = (date: Date | string | number | null | undefined): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Ensures a value is a Date object
 * 
 * @param date A date value to convert
 * @returns A Date object
 */
const ensureDate = (date: Date | string | number): Date => {
  return date instanceof Date ? date : new Date(date);
};

/**
 * Formats a date object or string into a standardized date string
 * 
 * @param date The date to format
 * @param formatString The format string to use (from DATE_FORMATS)
 * @returns Formatted date string or empty string if input is invalid
 */
export const formatDate = (
  date: Date | string | number | null | undefined,
  formatString: string = DATE_FORMATS.MEDIUM
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = date instanceof Date ? date : new Date(date as Date | string | number);
  return format(dateObj, formatString);
};

/**
 * Formats a date object or string into a standardized time string
 * 
 * @param date The date to format
 * @param formatString The format string to use (from TIME_FORMATS)
 * @param timezone The timezone to use for formatting
 * @returns Formatted time string or empty string if input is invalid
 */
export const formatTime = (
  date: Date | string | number | null | undefined,
  formatString: string = TIME_FORMATS.SHORT,
  timezone: string = 'UTC'
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = date instanceof Date ? date : new Date(date as Date | string | number);
  if (timezone !== 'UTC') {
    const zonedDate = utcToZonedTime(dateObj, timezone);
    return formatTz(zonedDate, formatString, { timeZone: timezone });
  }
  
  return format(dateObj, formatString);
};

/**
 * Formats a date object or string into a standardized date and time string
 * 
 * @param date The date to format
 * @param formatString The format string to use (from DATETIME_FORMATS)
 * @param timezone The timezone to use for formatting
 * @returns Formatted date and time string or empty string if input is invalid
 */
export const formatDateTime = (
  date: Date | string | number | null | undefined,
  formatString: string = DATETIME_FORMATS.SHORT,
  timezone: string = 'UTC'
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = date instanceof Date ? date : new Date(date as Date | string | number);
  if (timezone !== 'UTC') {
    const zonedDate = utcToZonedTime(dateObj, timezone);
    return formatTz(zonedDate, formatString, { timeZone: timezone });
  }
  
  return format(dateObj, formatString);
};

/**
 * Parses a date string into a Date object
 * 
 * @param dateString The string to parse
 * @param formatString The format string to use (from DATE_FORMATS)
 * @returns Date object or null if parsing fails
 */
export const parseDate = (
  dateString: string,
  formatString: string = DATE_FORMATS.MEDIUM
): Date | null => {
  if (!dateString) {
    return null;
  }
  
  try {
    return parse(dateString, formatString, new Date());
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Parses a date and time string into a Date object
 * 
 * @param dateTimeString The string to parse
 * @param formatString The format string to use (from DATETIME_FORMATS)
 * @param timezone The timezone of the input string
 * @returns Date object or null if parsing fails
 */
export const parseDateTime = (
  dateTimeString: string,
  formatString: string = DATETIME_FORMATS.SHORT,
  timezone: string = 'UTC'
): Date | null => {
  if (!dateTimeString) {
    return null;
  }
  
  try {
    const parsedDate = parse(dateTimeString, formatString, new Date());
    
    if (timezone !== 'UTC') {
      return zonedTimeToUtc(parsedDate, timezone);
    }
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing date and time:', error);
    return null;
  }
};

/**
 * Gets the current date and time
 * 
 * @param timezone The timezone to get the current date and time in
 * @returns Current date and time
 */
export const getCurrentDateTime = (timezone: string = 'UTC'): Date => {
  const now = new Date();
  
  if (timezone !== 'UTC') {
    return utcToZonedTime(now, timezone);
  }
  
  return now;
};

/**
 * Gets the current date and time as a formatted string
 * 
 * @param formatString The format string to use (from DATETIME_FORMATS)
 * @param timezone The timezone to get the current date and time in
 * @returns Formatted current date and time string
 */
export const getCurrentDateTimeString = (
  formatString: string = DATETIME_FORMATS.SHORT,
  timezone: string = 'UTC'
): string => {
  const now = getCurrentDateTime(timezone);
  return formatDateTime(now, formatString, timezone);
};

/**
 * Formats a time window with start and end times
 * 
 * @param startTime The start time
 * @param endTime The end time
 * @param formatString The format string to use (from TIME_FORMATS)
 * @param timezone The timezone to use for formatting
 * @returns Formatted time window (e.g., '9:00 AM - 11:00 AM')
 */
export const formatTimeWindow = (
  startTime: Date | string | number | null | undefined,
  endTime: Date | string | number | null | undefined,
  formatString: string = TIME_FORMATS.SHORT,
  timezone: string = 'UTC'
): string => {
  const formattedStartTime = formatTime(startTime, formatString, timezone);
  const formattedEndTime = formatTime(endTime, formatString, timezone);
  
  if (!formattedStartTime || !formattedEndTime) {
    return '';
  }
  
  return `${formattedStartTime} - ${formattedEndTime}`;
};

/**
 * Formats a date range with start and end dates
 * 
 * @param startDate The start date
 * @param endDate The end date
 * @param formatString The format string to use (from DATE_FORMATS)
 * @returns Formatted date range (e.g., 'Jan 1, 2023 - Jan 15, 2023')
 */
export const formatDateRange = (
  startDate: Date | string | number | null | undefined,
  endDate: Date | string | number | null | undefined,
  formatString: string = DATE_FORMATS.MEDIUM
): string => {
  const formattedStartDate = formatDate(startDate, formatString);
  const formattedEndDate = formatDate(endDate, formatString);
  
  if (!formattedStartDate || !formattedEndDate) {
    return '';
  }
  
  return `${formattedStartDate} - ${formattedEndDate}`;
};

/**
 * Adds the specified number of days to a date
 * 
 * @param date The date to add days to
 * @param days The number of days to add
 * @returns New date with days added
 */
export const addDays = (date: Date | string | number, days: number): Date => {
  const dateObj = ensureDate(date);
  return addDaysOriginal(dateObj, days);
};

/**
 * Adds the specified number of hours to a date
 * 
 * @param date The date to add hours to
 * @param hours The number of hours to add
 * @returns New date with hours added
 */
export const addHours = (date: Date | string | number, hours: number): Date => {
  const dateObj = ensureDate(date);
  return addHoursOriginal(dateObj, hours);
};

/**
 * Adds the specified number of minutes to a date
 * 
 * @param date The date to add minutes to
 * @param minutes The number of minutes to add
 * @returns New date with minutes added
 */
export const addMinutes = (date: Date | string | number, minutes: number): Date => {
  const dateObj = ensureDate(date);
  return addMinutesOriginal(dateObj, minutes);
};

/**
 * Subtracts the specified number of days from a date
 * 
 * @param date The date to subtract days from
 * @param days The number of days to subtract
 * @returns New date with days subtracted
 */
export const subtractDays = (date: Date | string | number, days: number): Date => {
  const dateObj = ensureDate(date);
  return subDaysOriginal(dateObj, days);
};

/**
 * Subtracts the specified number of hours from a date
 * 
 * @param date The date to subtract hours from
 * @param hours The number of hours to subtract
 * @returns New date with hours subtracted
 */
export const subtractHours = (date: Date | string | number, hours: number): Date => {
  const dateObj = ensureDate(date);
  return subHoursOriginal(dateObj, hours);
};

/**
 * Subtracts the specified number of minutes from a date
 * 
 * @param date The date to subtract minutes from
 * @param minutes The number of minutes to subtract
 * @returns New date with minutes subtracted
 */
export const subtractMinutes = (date: Date | string | number, minutes: number): Date => {
  const dateObj = ensureDate(date);
  return subMinutesOriginal(dateObj, minutes);
};

/**
 * Calculates the duration between two dates in minutes
 * 
 * @param startDate The start date
 * @param endDate The end date
 * @returns Duration in minutes (absolute value)
 */
export const calculateDurationInMinutes = (
  startDate: Date | string | number,
  endDate: Date | string | number
): number => {
  const startObj = ensureDate(startDate);
  const endObj = ensureDate(endDate);
  return Math.abs(differenceInMinutesOriginal(endObj, startObj));
};

/**
 * Calculates the duration between two dates in hours
 * 
 * @param startDate The start date
 * @param endDate The end date
 * @returns Duration in hours (absolute value)
 */
export const calculateDurationInHours = (
  startDate: Date | string | number,
  endDate: Date | string | number
): number => {
  const startObj = ensureDate(startDate);
  const endObj = ensureDate(endDate);
  return Math.abs(differenceInHoursOriginal(endObj, startObj));
};

/**
 * Calculates the duration between two dates in days
 * 
 * @param startDate The start date
 * @param endDate The end date
 * @returns Duration in days (absolute value)
 */
export const calculateDurationInDays = (
  startDate: Date | string | number,
  endDate: Date | string | number
): number => {
  const startObj = ensureDate(startDate);
  const endObj = ensureDate(endDate);
  return Math.abs(differenceInDaysOriginal(endObj, startObj));
};

/**
 * Formats a duration in minutes into a human-readable string
 * 
 * @param minutes The duration in minutes
 * @returns Formatted duration (e.g., '2h 30m')
 */
export const formatDuration = (minutes: number): string => {
  if (isNaN(minutes) || minutes < 0) {
    return '';
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Formats hours and minutes into a standardized HOS format
 * 
 * @param hours The number of hours
 * @param minutes The number of minutes
 * @returns Formatted hours and minutes (e.g., '8:45')
 */
export const formatHoursMinutes = (hours: number, minutes: number): string => {
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0) {
    return '';
  }
  
  const formattedHours = Math.floor(hours);
  const formattedMinutes = String(Math.round(minutes)).padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes}`;
};

/**
 * Formats a date relative to the current time
 * 
 * @param date The date to format
 * @param baseDate The date to use as the reference point
 * @returns Relative time string (e.g., 'yesterday', 'in 2 days')
 */
export const formatRelativeTime = (
  date: Date | string | number,
  baseDate: Date = new Date()
): string => {
  const dateObj = ensureDate(date);
  return formatRelative(dateObj, baseDate);
};

/**
 * Formats an estimated time of arrival
 * 
 * @param eta The estimated time of arrival
 * @param includeRelative Whether to include relative time
 * @param timezone The timezone to use for formatting
 * @returns Formatted ETA (e.g., '3:45 PM (in 2 hours)')
 */
export const formatETA = (
  eta: Date | string | number | null | undefined,
  includeRelative: boolean = true,
  timezone: string = 'UTC'
): string => {
  if (!isValidDate(eta)) {
    return '';
  }
  
  const etaObj = ensureDate(eta as Date | string | number);
  const timeString = formatTime(etaObj, TIME_FORMATS.SHORT, timezone);
  
  if (includeRelative) {
    const relativeTime = formatRelativeTime(etaObj);
    return `${timeString} (${relativeTime})`;
  }
  
  return timeString;
};

/**
 * Checks if a date is before another date
 * 
 * @param date The date to check
 * @param dateToCompare The date to compare against
 * @returns True if date is before dateToCompare
 */
export const isDateBefore = (
  date: Date | string | number,
  dateToCompare: Date | string | number
): boolean => {
  const dateObj = ensureDate(date);
  const compareObj = ensureDate(dateToCompare);
  return isBefore(dateObj, compareObj);
};

/**
 * Checks if a date is after another date
 * 
 * @param date The date to check
 * @param dateToCompare The date to compare against
 * @returns True if date is after dateToCompare
 */
export const isDateAfter = (
  date: Date | string | number,
  dateToCompare: Date | string | number
): boolean => {
  const dateObj = ensureDate(date);
  const compareObj = ensureDate(dateToCompare);
  return isAfter(dateObj, compareObj);
};

/**
 * Checks if a date is between two other dates
 * 
 * @param date The date to check
 * @param startDate The start of the range
 * @param endDate The end of the range
 * @param inclusive Whether to include startDate and endDate in the comparison
 * @returns True if date is between startDate and endDate
 */
export const isDateBetween = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number,
  inclusive: boolean = true
): boolean => {
  const dateObj = ensureDate(date);
  const startObj = ensureDate(startDate);
  const endObj = ensureDate(endDate);
  
  if (inclusive) {
    return (isAfter(dateObj, startObj) || isEqual(dateObj, startObj)) && 
           (isBefore(dateObj, endObj) || isEqual(dateObj, endObj));
  }
  
  return isAfter(dateObj, startObj) && isBefore(dateObj, endObj);
};

/**
 * Checks if a date is today
 * Re-export from date-fns
 */
export const isToday = isTodayOriginal;

/**
 * Checks if a date is tomorrow
 * 
 * @param date The date to check
 * @returns True if date is tomorrow
 */
export const isTomorrow = (date: Date | string | number): boolean => {
  const dateObj = ensureDate(date);
  const tomorrow = addDays(startOfDayOriginal(new Date()), 1);
  return (
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Formats a date for user-friendly display, using relative terms when appropriate
 * 
 * @param date The date to format
 * @param formatString The format string to use (from DATE_FORMATS)
 * @returns User-friendly date string (e.g., 'Today', 'Tomorrow', 'Jan 15, 2023')
 */
export const formatDateForDisplay = (
  date: Date | string | number | null | undefined,
  formatString: string = DATE_FORMATS.MEDIUM
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = ensureDate(date as Date | string | number);
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  }
  
  return formatDate(dateObj, formatString);
};

/**
 * Gets the start of the day for a given date
 * 
 * @param date The date to get the start of day for
 * @returns Date set to the start of the day (00:00:00)
 */
export const getStartOfDay = (date: Date | string | number = new Date()): Date => {
  const dateObj = ensureDate(date);
  return startOfDayOriginal(dateObj);
};

/**
 * Gets the end of the day for a given date
 * 
 * @param date The date to get the end of day for
 * @returns Date set to the end of the day (23:59:59.999)
 */
export const getEndOfDay = (date: Date | string | number = new Date()): Date => {
  const dateObj = ensureDate(date);
  return endOfDayOriginal(dateObj);
};

/**
 * Gets the start of the week for a given date
 * 
 * @param date The date to get the start of week for
 * @param options Options for determining the start of week
 * @returns Date set to the start of the week
 */
export const getStartOfWeek = (
  date: Date | string | number = new Date(),
  options: { weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 } = { weekStartsOn: 0 }
): Date => {
  const dateObj = ensureDate(date);
  return startOfWeekOriginal(dateObj, options);
};

/**
 * Gets the end of the week for a given date
 * 
 * @param date The date to get the end of week for
 * @param options Options for determining the end of week
 * @returns Date set to the end of the week
 */
export const getEndOfWeek = (
  date: Date | string | number = new Date(),
  options: { weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 } = { weekStartsOn: 0 }
): Date => {
  const dateObj = ensureDate(date);
  return endOfWeekOriginal(dateObj, options);
};

/**
 * Gets the start of the month for a given date
 * 
 * @param date The date to get the start of month for
 * @returns Date set to the start of the month
 */
export const getStartOfMonth = (date: Date | string | number = new Date()): Date => {
  const dateObj = ensureDate(date);
  return startOfMonthOriginal(dateObj);
};

/**
 * Gets the end of the month for a given date
 * 
 * @param date The date to get the end of month for
 * @returns Date set to the end of the month
 */
export const getEndOfMonth = (date: Date | string | number = new Date()): Date => {
  const dateObj = ensureDate(date);
  return endOfMonthOriginal(dateObj);
};

/**
 * Converts a date to a specific timezone
 * 
 * @param date The date to convert
 * @param timezone The timezone to convert to
 * @returns Date converted to the specified timezone
 */
export const convertToTimezone = (
  date: Date | string | number,
  timezone: string = 'UTC'
): Date => {
  const dateObj = ensureDate(date);
  return utcToZonedTime(dateObj, timezone);
};