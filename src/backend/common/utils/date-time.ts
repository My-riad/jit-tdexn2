/**
 * Date and Time Utility Module
 * 
 * This module provides standardized date and time manipulation functions for the 
 * AI-driven Freight Optimization Platform. It centralizes common date-time operations 
 * used across microservices, ensuring consistent handling of timestamps, durations, 
 * and date comparisons throughout the system.
 */

import {
  format,
  parseISO,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  addMinutes,
  addHours,
  addDays,
  isAfter,
  isBefore,
  isEqual,
  isValid
} from 'date-fns'; // ^2.30.0

import {
  utcToZonedTime,
  zonedTimeToUtc
} from 'date-fns-tz'; // ^2.0.0

/**
 * Formats a date object or ISO string into a standardized string format
 * 
 * @param date - Date to format (Date object or ISO string)
 * @param formatString - Format string (e.g., 'yyyy-MM-dd HH:mm:ss')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatString: string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Formats a date to ISO 8601 format for consistent API responses and event timestamps
 * 
 * @param date - Date to format (Date object or ISO string)
 * @returns ISO 8601 formatted date string
 */
export function formatISODate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj.toISOString();
}

/**
 * Parses a date string into a Date object
 * 
 * @param dateString - Date string to parse
 * @returns Parsed Date object
 * @throws Error if the date string cannot be parsed
 */
export function parseDate(dateString: string): Date {
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return parsedDate;
}

/**
 * Gets the current timestamp in ISO format
 * 
 * @returns Current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculates the difference between two dates in minutes, hours, or days
 * 
 * @param startDate - Start date (Date object or ISO string)
 * @param endDate - End date (Date object or ISO string)
 * @param unit - Unit of time difference ('minutes', 'hours', or 'days')
 * @returns Time difference in the specified unit
 */
export function calculateTimeDifference(
  startDate: Date | string,
  endDate: Date | string,
  unit: 'minutes' | 'hours' | 'days'
): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  switch (unit) {
    case 'minutes':
      return differenceInMinutes(end, start);
    case 'hours':
      return differenceInHours(end, start);
    case 'days':
      return differenceInDays(end, start);
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

/**
 * Adds a specified amount of time (minutes, hours, days) to a date
 * 
 * @param date - Base date (Date object or ISO string)
 * @param amount - Amount of time to add
 * @param unit - Unit of time to add ('minutes', 'hours', or 'days')
 * @returns New date with added time
 */
export function addTime(
  date: Date | string,
  amount: number,
  unit: 'minutes' | 'hours' | 'days'
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  switch (unit) {
    case 'minutes':
      return addMinutes(dateObj, amount);
    case 'hours':
      return addHours(dateObj, amount);
    case 'days':
      return addDays(dateObj, amount);
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

/**
 * Checks if the first date is after the second date
 * 
 * @param date - Date to check (Date object or ISO string)
 * @param dateToCompare - Date to compare against (Date object or ISO string)
 * @returns True if first date is after second date
 */
export function isDateAfter(
  date: Date | string,
  dateToCompare: Date | string
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const compareObj = typeof dateToCompare === 'string' ? parseISO(dateToCompare) : dateToCompare;
  return isAfter(dateObj, compareObj);
}

/**
 * Checks if the first date is before the second date
 * 
 * @param date - Date to check (Date object or ISO string)
 * @param dateToCompare - Date to compare against (Date object or ISO string)
 * @returns True if first date is before second date
 */
export function isDateBefore(
  date: Date | string,
  dateToCompare: Date | string
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const compareObj = typeof dateToCompare === 'string' ? parseISO(dateToCompare) : dateToCompare;
  return isBefore(dateObj, compareObj);
}

/**
 * Checks if two dates are equal (ignoring milliseconds)
 * 
 * @param date1 - First date (Date object or ISO string)
 * @param date2 - Second date (Date object or ISO string)
 * @returns True if dates are equal
 */
export function areDatesEqual(
  date1: Date | string,
  date2: Date | string
): boolean {
  const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isEqual(date1Obj, date2Obj);
}

/**
 * Checks if a date object or string is valid
 * 
 * @param date - Date to validate (Date object or ISO string)
 * @returns True if date is valid
 */
export function isValidDate(date: Date | string): boolean {
  if (typeof date === 'string') {
    try {
      date = parseISO(date);
    } catch {
      return false;
    }
  }
  return isValid(date);
}

/**
 * Converts a date to a specific timezone
 * 
 * @param date - Date to convert (Date object or ISO string)
 * @param timezone - Target timezone (e.g., 'America/New_York')
 * @returns Date converted to specified timezone
 */
export function convertToTimezone(
  date: Date | string,
  timezone: string
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return utcToZonedTime(dateObj, timezone);
}

/**
 * Converts a date from a specific timezone to UTC
 * 
 * @param date - Date to convert (Date object or ISO string)
 * @param timezone - Source timezone (e.g., 'America/New_York')
 * @returns Date converted to UTC
 */
export function convertToUTC(
  date: Date | string,
  timezone: string
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return zonedTimeToUtc(dateObj, timezone);
}

/**
 * Checks if a date is within a specified time window
 * 
 * @param date - Date to check (Date object or ISO string)
 * @param startWindow - Start of time window (Date object or ISO string)
 * @param endWindow - End of time window (Date object or ISO string)
 * @returns True if date is within the time window
 */
export function isWithinTimeWindow(
  date: Date | string,
  startWindow: Date | string,
  endWindow: Date | string
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const startObj = typeof startWindow === 'string' ? parseISO(startWindow) : startWindow;
  const endObj = typeof endWindow === 'string' ? parseISO(endWindow) : endWindow;

  return (isAfter(dateObj, startObj) || isEqual(dateObj, startObj)) && 
         (isBefore(dateObj, endObj) || isEqual(dateObj, endObj));
}

/**
 * Calculates minutes remaining until a target date
 * 
 * @param targetDate - Target date (Date object or ISO string)
 * @param fromDate - Starting date (Date object or ISO string, defaults to current time)
 * @returns Minutes remaining (negative if target date is in the past)
 */
export function calculateMinutesRemaining(
  targetDate: Date | string,
  fromDate: Date | string = new Date()
): number {
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  const from = typeof fromDate === 'string' ? parseISO(fromDate) : fromDate;
  return differenceInMinutes(target, from);
}

/**
 * Formats a duration in minutes to a human-readable string (e.g., '2h 30m')
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) {
    return '0m';
  }

  const isNegative = minutes < 0;
  const absoluteMinutes = Math.abs(minutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const remainingMinutes = absoluteMinutes % 60;

  let result = '';
  if (hours > 0) {
    result += `${hours}h`;
  }
  
  if (remainingMinutes > 0) {
    if (hours > 0) {
      result += ' ';
    }
    result += `${remainingMinutes}m`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Formats hours of service time remaining in the standard HH:MM format required for ELD compliance
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted HOS time string (HH:MM)
 */
export function formatHoursOfService(minutes: number): string {
  const absoluteMinutes = Math.abs(minutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const remainingMinutes = absoluteMinutes % 60;

  // Format with leading zeros
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = remainingMinutes.toString().padStart(2, '0');

  return `${minutes < 0 ? '-' : ''}${hoursStr}:${minutesStr}`;
}

/**
 * Gets the start of day (00:00:00) for a given date
 * 
 * @param date - Date (Date object or ISO string)
 * @returns Date object set to start of day
 */
export function getStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Gets the end of day (23:59:59.999) for a given date
 * 
 * @param date - Date (Date object or ISO string)
 * @returns Date object set to end of day
 */
export function getEndOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}