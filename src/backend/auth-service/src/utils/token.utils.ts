import * as jwt from 'jsonwebtoken'; // jsonwebtoken@9.0.0
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION } from '../config';
import { UserProfile, AuthTokens } from '../../../common/interfaces/user.interface';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';

// In-memory token blacklist
// NOTE: In production, this would be replaced with Redis or another persistent store
const tokenBlacklist = new Set<string>();

/**
 * Custom error class for token-related errors
 */
export class TokenError extends Error {
  code: string;
  originalError?: any;

  /**
   * Creates a new TokenError instance
   * 
   * @param message - Error message
   * @param code - Error code
   * @param originalError - Original error that caused this error (if any)
   */
  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.name = 'TokenError';
    this.code = code;
    this.originalError = originalError;
    Error.captureStackTrace(this, TokenError);
  }
}

/**
 * Generates a JWT access token for a user
 * 
 * @param userProfile - User profile to include in the token payload
 * @returns Signed JWT access token
 */
export const generateAccessToken = (userProfile: UserProfile): string => {
  try {
    // Create token payload
    const payload = {
      ...userProfile,
      // Standard JWT claims
      iat: Math.floor(Date.now() / 1000), // Issued at (in seconds)
      exp: Math.floor(Date.now() / 1000) + JWT_ACCESS_EXPIRATION, // Expiration time
      jti: uuidv4() // Unique token identifier
    };

    // Sign the token with the secret
    return jwt.sign(payload, JWT_SECRET);
  } catch (error) {
    logger.error('Failed to generate access token', { error });
    throw new TokenError(
      'Failed to generate access token',
      ErrorCodes.AUTH_INVALID_TOKEN,
      error
    );
  }
};

/**
 * Generates a JWT refresh token for a user
 * 
 * @param userProfile - User profile to include in the token payload
 * @returns Signed JWT refresh token
 */
export const generateRefreshToken = (userProfile: UserProfile): string => {
  try {
    // Create a minimal payload for refresh token (only include what's necessary)
    const payload = {
      user_id: userProfile.user_id,
      roles: userProfile.roles,
      // Standard JWT claims
      iat: Math.floor(Date.now() / 1000), // Issued at (in seconds)
      exp: Math.floor(Date.now() / 1000) + JWT_REFRESH_EXPIRATION, // Expiration time
      jti: uuidv4() // Unique token identifier
    };

    // Sign the token with the secret
    return jwt.sign(payload, JWT_SECRET);
  } catch (error) {
    logger.error('Failed to generate refresh token', { error });
    throw new TokenError(
      'Failed to generate refresh token',
      ErrorCodes.AUTH_INVALID_TOKEN,
      error
    );
  }
};

/**
 * Generates both access and refresh tokens for a user
 * 
 * @param userProfile - User profile to include in the token payload
 * @returns Object containing access and refresh tokens
 */
export const generateTokenPair = (userProfile: UserProfile): AuthTokens => {
  try {
    const accessToken = generateAccessToken(userProfile);
    const refreshToken = generateRefreshToken(userProfile);

    return {
      accessToken,
      refreshToken,
      idToken: accessToken, // For our system, idToken is same as accessToken
      expiresIn: JWT_ACCESS_EXPIRATION,
      tokenType: 'Bearer'
    };
  } catch (error) {
    logger.error('Failed to generate token pair', { error });
    throw new TokenError(
      'Failed to generate token pair',
      ErrorCodes.AUTH_INVALID_TOKEN,
      error
    );
  }
};

/**
 * Verifies a JWT access token and returns the user profile
 * 
 * @param token - JWT access token to verify
 * @returns User profile extracted from the token
 */
export const verifyAccessToken = (token: string): UserProfile => {
  try {
    // Decode the token to get the jti (JWT ID)
    const decoded = jwt.decode(token) as any;
    
    // Check if token is blacklisted
    if (decoded && decoded.jti && isTokenBlacklisted(decoded.jti)) {
      throw new TokenError(
        'Token has been revoked',
        ErrorCodes.AUTH_INVALID_TOKEN
      );
    }

    // Verify the token
    const payload = jwt.verify(token, JWT_SECRET) as UserProfile;
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Access token expired', { error });
      throw new TokenError(
        'Access token has expired',
        ErrorCodes.AUTH_EXPIRED_TOKEN,
        error
      );
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid access token', { error });
      throw new TokenError(
        'Invalid access token',
        ErrorCodes.AUTH_INVALID_TOKEN,
        error
      );
    }
    
    if (error instanceof TokenError) {
      throw error;
    }
    
    logger.error('Access token verification failed', { error });
    throw new TokenError(
      'Access token verification failed',
      ErrorCodes.AUTH_INVALID_TOKEN,
      error
    );
  }
};

/**
 * Verifies a JWT refresh token and returns the user ID
 * 
 * @param token - JWT refresh token to verify
 * @returns Object containing user_id and jti
 */
export const verifyRefreshToken = (token: string): { user_id: string; jti: string } => {
  try {
    // Decode the token to get the jti (JWT ID)
    const decoded = jwt.decode(token) as any;
    
    // Check if token is blacklisted
    if (decoded && decoded.jti && isTokenBlacklisted(decoded.jti)) {
      throw new TokenError(
        'Refresh token has been revoked',
        ErrorCodes.AUTH_INVALID_TOKEN
      );
    }

    // Verify the token
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    if (!payload.user_id || !payload.jti) {
      throw new TokenError(
        'Invalid refresh token format',
        ErrorCodes.AUTH_INVALID_TOKEN
      );
    }
    
    return { 
      user_id: payload.user_id,
      jti: payload.jti
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Refresh token expired', { error });
      throw new TokenError(
        'Refresh token has expired',
        ErrorCodes.AUTH_EXPIRED_TOKEN,
        error
      );
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid refresh token', { error });
      throw new TokenError(
        'Invalid refresh token',
        ErrorCodes.AUTH_INVALID_TOKEN,
        error
      );
    }
    
    if (error instanceof TokenError) {
      throw error;
    }
    
    logger.error('Refresh token verification failed', { error });
    throw new TokenError(
      'Refresh token verification failed',
      ErrorCodes.AUTH_INVALID_TOKEN,
      error
    );
  }
};

/**
 * Generates a new access token using a valid refresh token
 * 
 * @param refreshToken - Refresh token to validate
 * @param userProfile - User profile to include in new access token
 * @returns New access token
 */
export const refreshAccessToken = (
  refreshToken: string,
  userProfile: UserProfile
): string => {
  try {
    // Verify the refresh token
    verifyRefreshToken(refreshToken);
    
    // Generate a new access token
    return generateAccessToken(userProfile);
  } catch (error) {
    logger.error('Failed to refresh access token', { error });
    
    if (error instanceof TokenError) {
      throw error;
    }
    
    throw new TokenError(
      'Failed to refresh access token',
      ErrorCodes.AUTH_INVALID_TOKEN,
      error
    );
  }
};

/**
 * Rotates a refresh token by generating a new one and blacklisting the old one
 * 
 * @param oldRefreshToken - Current refresh token to rotate
 * @param userProfile - User profile to include in new refresh token
 * @returns New refresh token
 */
export const rotateRefreshToken = (
  oldRefreshToken: string,
  userProfile: UserProfile
): string => {
  try {
    // Verify the old refresh token
    const { jti } = verifyRefreshToken(oldRefreshToken);
    
    // Blacklist the old token
    blacklistToken(oldRefreshToken);
    
    // Generate a new refresh token
    return generateRefreshToken(userProfile);
  } catch (error) {
    logger.error('Failed to rotate refresh token', { error });
    
    if (error instanceof TokenError) {
      throw error;
    }
    
    throw new TokenError(
      'Failed to rotate refresh token',
      ErrorCodes.AUTH_INVALID_TOKEN,
      error
    );
  }
};

/**
 * Adds a token to the blacklist to prevent its future use
 * 
 * @param token - Token to blacklist
 * @returns True if token was successfully blacklisted
 */
export const blacklistToken = (token: string): boolean => {
  try {
    // Decode the token without verification to get the jti
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.jti) {
      logger.warn('Cannot blacklist token: No JTI found');
      return false;
    }
    
    // Add the jti to the blacklist
    tokenBlacklist.add(decoded.jti);
    
    logger.info('Token blacklisted', { jti: decoded.jti });
    return true;
  } catch (error) {
    logger.error('Failed to blacklist token', { error });
    return false;
  }
};

/**
 * Checks if a token is in the blacklist
 * 
 * @param jti - JWT ID to check
 * @returns True if token is blacklisted
 */
export const isTokenBlacklisted = (jti: string): boolean => {
  return tokenBlacklist.has(jti);
};

/**
 * Decodes a JWT token without verifying its signature
 * 
 * @param token - JWT token to decode
 * @returns Decoded token payload
 */
export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Failed to decode token', { error });
    throw new TokenError(
      'Failed to decode token',
      ErrorCodes.AUTH_INVALID_TOKEN,
      error
    );
  }
};

/**
 * Extracts a JWT token from an Authorization header
 * 
 * @param authorizationHeader - Authorization header value
 * @returns Extracted token or null if not found
 */
export const extractTokenFromHeader = (authorizationHeader: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  // Check if the header has the correct format
  if (!authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  // Extract the token part after 'Bearer '
  return authorizationHeader.substring(7);
};

export {
  TokenError,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  rotateRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  decodeToken,
  extractTokenFromHeader
};