/**
 * Utility functions for password management in the authentication service.
 * Provides core functionality for secure password handling throughout the
 * authentication system, including hashing, comparison, validation, and security checks.
 */

import * as bcrypt from 'bcrypt'; // bcrypt@5.1.0
import * as zxcvbn from 'zxcvbn'; // zxcvbn@4.4.2
import * as hibp from 'hibp'; // hibp@11.0.0
import * as generatePassword from 'generate-password'; // generate-password@1.7.0
import * as crypto from 'crypto';

import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';

// Constants for password policies
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;
const MIN_PASSWORD_STRENGTH = 3;
const PASSWORD_HISTORY_LIMIT = 12;

/**
 * Hashes a plain text password using bcrypt
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    logger.info('Hashing password');
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password', { error });
    throw createError(
      'Failed to hash password',
      { 
        code: ErrorCodes.SRV_INTERNAL_ERROR,
        isOperational: true
      }
    );
  }
}

/**
 * Compares a plain text password with a hashed password
 * 
 * @param plainPassword - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error('Error comparing passwords', { error });
    throw createError(
      'Failed to compare passwords',
      { 
        code: ErrorCodes.SRV_INTERNAL_ERROR,
        isOperational: true
      }
    );
  }
}

/**
 * Validates password strength against policy requirements
 * 
 * @param password - Password to validate
 * @returns Promise resolving to validation result with strength score
 */
export async function validatePasswordStrength(password: string): Promise<{ 
  valid: boolean; 
  message?: string; 
  score: number; 
}> {
  try {
    logger.info('Validating password strength');
    
    // Check for minimum length
    if (password.length < MIN_PASSWORD_LENGTH) {
      return {
        valid: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        score: 0
      };
    }
    
    // Use zxcvbn to calculate password strength score (0-4)
    const result = zxcvbn(password);
    const score = result.score;
    
    // Check for minimum strength requirement
    if (score < MIN_PASSWORD_STRENGTH) {
      return {
        valid: false,
        message: 'Password is too weak. Please use a stronger password with a mix of characters, numbers, and symbols.',
        score
      };
    }
    
    // Verify password contains required character types
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return {
        valid: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        score
      };
    }
    
    // All checks passed
    return {
      valid: true,
      score
    };
  } catch (error) {
    logger.error('Error validating password strength', { error });
    throw createError(
      'Failed to validate password strength',
      { 
        code: ErrorCodes.SRV_INTERNAL_ERROR,
        isOperational: true
      }
    );
  }
}

/**
 * Checks if a password has been used previously by the user
 * 
 * @param newPassword - New password to check
 * @param passwordHistory - Array of previously used hashed passwords
 * @returns Promise resolving to true if password is not in history, false if it is
 */
export async function checkPasswordHistory(newPassword: string, passwordHistory: string[]): Promise<boolean> {
  try {
    logger.info('Checking password history');
    
    // Check against the most recent PASSWORD_HISTORY_LIMIT entries
    const recentHistory = passwordHistory.slice(-PASSWORD_HISTORY_LIMIT);
    
    // Check if the new password matches any in the history
    for (const historicalPassword of recentHistory) {
      if (await comparePassword(newPassword, historicalPassword)) {
        return false; // Password found in history
      }
    }
    
    return true; // Password not found in history
  } catch (error) {
    logger.error('Error checking password history', { error });
    throw createError(
      'Failed to check password history',
      { 
        code: ErrorCodes.SRV_INTERNAL_ERROR,
        isOperational: true
      }
    );
  }
}

/**
 * Checks if a password has appeared in known data breaches
 * 
 * @param password - Password to check
 * @returns Promise resolving to result indicating if password was found in breaches and count
 */
export async function checkPasswordBreached(password: string): Promise<{ 
  breached: boolean; 
  count?: number; 
}> {
  try {
    logger.info('Checking if password has been breached');
    
    // Check if the password appears in breach data
    const count = await hibp.pwnedPassword(password);
    
    if (count > 0) {
      logger.warn('Password found in breach data', { count });
      return { 
        breached: true,
        count
      };
    }
    
    return { breached: false };
  } catch (error) {
    // Handle API errors gracefully
    logger.warn('HIBP service unavailable, skipping breach check', { error });
    // Default to not breached if service is unavailable
    return { breached: false };
  }
}

/**
 * Generates a secure temporary password
 * 
 * @param options - Options for password generation
 * @returns Generated password
 */
export function generateTemporaryPassword(options: {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
} = {}): string {
  try {
    logger.info('Generating temporary password');
    
    // Set default options
    const defaultOptions = {
      length: MIN_PASSWORD_LENGTH,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      strict: true // Ensure all character requirements are met
    };
    
    // Merge with user options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Generate password
    return generatePassword.generate(mergedOptions);
  } catch (error) {
    logger.error('Error generating temporary password', { error });
    throw createError(
      'Failed to generate temporary password',
      { 
        code: ErrorCodes.SRV_INTERNAL_ERROR,
        isOperational: true
      }
    );
  }
}

/**
 * Generates a secure token for password reset
 * 
 * @returns Password reset token
 */
export function generatePasswordResetToken(): string {
  try {
    logger.info('Generating password reset token');
    
    // Generate a 32-byte random token and convert to hex
    return crypto.randomBytes(32).toString('hex');
  } catch (error) {
    logger.error('Error generating password reset token', { error });
    throw createError(
      'Failed to generate password reset token',
      { 
        code: ErrorCodes.SRV_INTERNAL_ERROR,
        isOperational: true
      }
    );
  }
}

/**
 * Validates that password and confirmation match
 * 
 * @param password - Password
 * @param confirmPassword - Password confirmation
 * @returns True if passwords match, false otherwise
 */
export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}