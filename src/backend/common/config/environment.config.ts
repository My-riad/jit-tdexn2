/**
 * Environment Configuration Utility
 * 
 * This module provides a centralized way to access environment variables with
 * type conversion, validation, and default values. It serves as the foundation
 * for all other configuration modules by providing a standardized way to
 * interact with environment-specific settings.
 */

import dotenv from 'dotenv'; // dotenv@16.0.3
import logger from '../utils/logger';

// Global environment variables
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';
export const IS_STAGING = NODE_ENV === 'staging';

/**
 * Loads environment variables from .env files based on the current NODE_ENV
 * 
 * This function will load:
 * - Base .env file for common configuration
 * - Environment-specific .env file (e.g., .env.development)
 */
export const loadEnvConfig = (): void => {
  try {
    // Load the base .env file first
    dotenv.config();
    
    // Then load environment-specific .env file
    const envFile = `.env.${NODE_ENV}`;
    dotenv.config({ path: envFile });
    
    logger.info(`Environment config loaded for ${NODE_ENV}`, { 
      environment: NODE_ENV 
    });
  } catch (error) {
    logger.error('Failed to load environment configuration', { 
      error,
      environment: NODE_ENV 
    });
  }
};

/**
 * Safely retrieves an environment variable with a fallback default value
 * 
 * @param key - The name of the environment variable
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @returns The value of the environment variable or the default value
 */
export const getEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

/**
 * Retrieves a required environment variable, throwing an error if it doesn't exist
 * 
 * @param key - The name of the required environment variable
 * @returns The value of the required environment variable
 * @throws Error if the environment variable is not defined
 */
export const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    const error = new Error(`Required environment variable ${key} is not defined`);
    logger.error(`Missing required environment variable: ${key}`, { error });
    throw error;
  }
  return value;
};

/**
 * Retrieves an environment variable as a number with a fallback default value
 * 
 * @param key - The name of the environment variable
 * @param defaultValue - The default value to return if the environment variable is not defined or invalid
 * @returns The numeric value of the environment variable or the default value
 */
export const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const stringValue = process.env[key];
  if (stringValue === undefined) {
    return defaultValue;
  }
  
  const numberValue = Number(stringValue);
  if (isNaN(numberValue)) {
    logger.warn(`Environment variable ${key} is not a valid number: "${stringValue}"`);
    return defaultValue;
  }
  
  return numberValue;
};

/**
 * Retrieves an environment variable as a boolean with a fallback default value
 * 
 * @param key - The name of the environment variable
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @returns The boolean value of the environment variable or the default value
 */
export const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const stringValue = process.env[key];
  if (stringValue === undefined) {
    return defaultValue;
  }
  
  const normalizedValue = stringValue.toLowerCase().trim();
  if (['true', '1', 'yes'].includes(normalizedValue)) {
    return true;
  }
  
  if (['false', '0', 'no'].includes(normalizedValue)) {
    return false;
  }
  
  logger.warn(`Environment variable ${key} is not a valid boolean: "${stringValue}"`);
  return defaultValue;
};

/**
 * Retrieves an environment variable as an array by splitting a comma-separated string
 * 
 * @param key - The name of the environment variable
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @returns Array value from the environment variable or the default value
 */
export const getEnvArray = (key: string, defaultValue: string[] = []): string[] => {
  const stringValue = process.env[key];
  if (!stringValue) {
    return defaultValue;
  }
  
  return stringValue
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

/**
 * Retrieves an environment variable as a JSON object
 * 
 * @param key - The name of the environment variable
 * @param defaultValue - The default value to return if the environment variable is not defined or invalid
 * @returns Object parsed from the environment variable or the default value
 */
export const getEnvObject = (
  key: string,
  defaultValue: Record<string, any>
): Record<string, any> => {
  const stringValue = process.env[key];
  if (!stringValue) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(stringValue) as Record<string, any>;
  } catch (error) {
    logger.warn(`Environment variable ${key} is not a valid JSON object`, { error });
    return defaultValue;
  }
};

/**
 * Returns the current environment name (development, test, staging, production)
 * 
 * @returns The current environment name
 */
export const getEnvironment = (): string => {
  return NODE_ENV;
};

/**
 * Checks if the current environment is production
 * 
 * @returns True if in production environment
 */
export const isProduction = (): boolean => {
  return IS_PRODUCTION;
};

/**
 * Checks if the current environment is development
 * 
 * @returns True if in development environment
 */
export const isDevelopment = (): boolean => {
  return IS_DEVELOPMENT;
};

/**
 * Checks if the current environment is test
 * 
 * @returns True if in test environment
 */
export const isTest = (): boolean => {
  return IS_TEST;
};

/**
 * Checks if the current environment is staging
 * 
 * @returns True if in staging environment
 */
export const isStaging = (): boolean => {
  return IS_STAGING;
};