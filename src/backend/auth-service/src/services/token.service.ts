import * as jwt from 'jsonwebtoken'; // jsonwebtoken@9.0.0
import { 
  UserProfile, 
  AuthTokens
} from '../../../common/interfaces/user.interface';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  blacklistToken
} from '../utils/token.utils';
import {
  TokenType,
  saveToken,
  getTokenByJti,
  revokeTokenByJti,
  isTokenRevoked
} from '../models/token.model';
import {
  JWT_ACCESS_EXPIRATION,
  JWT_REFRESH_EXPIRATION
} from '../config';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * Validates an access token and returns the user profile
 * 
 * @param token - Access token to validate
 * @returns User profile extracted from the token
 */
export const validateAccessToken = async (token: string): Promise<UserProfile> => {
  try {
    // Verify the token using the token utility
    const userProfile = verifyAccessToken(token);
    return userProfile;
  } catch (error) {
    logger.error('Access token validation failed', { error });
    
    if (error.code === ErrorCodes.AUTH_EXPIRED_TOKEN) {
      throw createError('Access token has expired', {
        code: ErrorCodes.AUTH_EXPIRED_TOKEN,
        statusCode: 401
      });
    }
    
    throw createError('Invalid access token', {
      code: ErrorCodes.AUTH_INVALID_TOKEN,
      statusCode: 401
    });
  }
};

/**
 * Creates a new token pair (access and refresh) for a user
 * 
 * @param userProfile - User profile to include in the token
 * @param ipAddress - IP address of the client
 * @param userAgent - User agent of the client
 * @returns Token pair including access and refresh tokens
 */
export const createTokens = async (
  userProfile: UserProfile,
  ipAddress: string,
  userAgent: string
): Promise<AuthTokens> => {
  try {
    // Generate token pair using utility function
    const tokens = generateTokenPair(userProfile);
    
    // Extract JWT ID from refresh token to store in database
    const decoded = jwt.decode(tokens.refreshToken) as any;
    if (!decoded || !decoded.jti) {
      throw new Error('Failed to decode refresh token');
    }
    
    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + JWT_REFRESH_EXPIRATION);
    
    // Save refresh token in database for tracking
    await saveToken(
      userProfile.user_id,
      decoded.jti,
      TokenType.REFRESH,
      expiresAt,
      ipAddress,
      userAgent
    );
    
    logger.info('New tokens created for user', {
      userId: userProfile.user_id,
      tokenType: 'refresh',
      ipAddress
    });
    
    return tokens;
  } catch (error) {
    logger.error('Failed to create tokens', { error, userId: userProfile.user_id });
    throw createError('Failed to create authentication tokens', {
      code: ErrorCodes.AUTH_INVALID_TOKEN,
      statusCode: 500
    });
  }
};

/**
 * Refreshes an access token using a valid refresh token
 * 
 * @param refreshToken - Refresh token to use
 * @param ipAddress - IP address of the client
 * @param userAgent - User agent of the client
 * @returns New token pair
 */
export const refreshTokens = async (
  refreshToken: string,
  ipAddress: string,
  userAgent: string
): Promise<AuthTokens> => {
  try {
    // Verify the refresh token
    const { user_id, jti } = verifyRefreshToken(refreshToken);
    
    // Check if token is revoked in the database
    if (await isTokenRevoked(jti)) {
      logger.warn('Attempted to use revoked refresh token', { jti, ipAddress });
      throw createError('Invalid refresh token - token has been revoked', {
        code: ErrorCodes.AUTH_INVALID_TOKEN,
        statusCode: 401
      });
    }
    
    // Revoke the old refresh token (token rotation)
    await revokeTokenByJti(jti);
    
    // Get the user profile - in a real implementation, you'd fetch this from the database
    // For now, we'll extract it from the token itself
    const decoded = jwt.decode(refreshToken) as any;
    const userProfile: UserProfile = {
      user_id,
      email: decoded.email || '',
      first_name: decoded.first_name || '',
      last_name: decoded.last_name || '',
      phone: decoded.phone || '',
      user_type: decoded.user_type,
      status: decoded.status,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      carrier_id: decoded.carrier_id,
      shipper_id: decoded.shipper_id,
      driver_id: decoded.driver_id,
      email_verified: decoded.email_verified || false,
      mfa_enabled: decoded.mfa_enabled || false
    };
    
    // Generate new token pair
    const newTokens = await createTokens(userProfile, ipAddress, userAgent);
    
    logger.info('Tokens refreshed for user', {
      userId: user_id,
      ipAddress
    });
    
    return newTokens;
  } catch (error) {
    logger.error('Failed to refresh tokens', { error });
    
    if (error.code === ErrorCodes.AUTH_EXPIRED_TOKEN) {
      throw createError('Refresh token has expired', {
        code: ErrorCodes.AUTH_EXPIRED_TOKEN,
        statusCode: 401
      });
    }
    
    throw createError('Invalid refresh token', {
      code: ErrorCodes.AUTH_INVALID_TOKEN,
      statusCode: 401
    });
  }
};

/**
 * Revokes a token to prevent its future use
 * 
 * @param token - Token to revoke
 * @returns True if token was successfully revoked
 */
export const revokeToken = async (token: string): Promise<boolean> => {
  try {
    // Decode the token to get the JWT ID
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.jti) {
      logger.warn('Cannot revoke token: No JTI found');
      return false;
    }
    
    // Revoke the token in the database
    const revokedInDb = await revokeTokenByJti(decoded.jti);
    
    // Add the token to the in-memory blacklist
    blacklistToken(token);
    
    logger.info('Token revoked', { jti: decoded.jti });
    return revokedInDb;
  } catch (error) {
    logger.error('Failed to revoke token', { error });
    return false;
  }
};

/**
 * Validates a token and extends the session if needed
 * 
 * @param token - Access token to validate
 * @returns User profile and optionally a new token if the current one is about to expire
 */
export const validateAndExtendSession = async (token: string): Promise<{
  userProfile: UserProfile;
  newToken?: string;
}> => {
  try {
    // Verify the token
    const userProfile = verifyAccessToken(token);
    
    // Check token expiration time
    const decoded = jwt.decode(token) as any;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = decoded.exp;
    const timeRemaining = expiresAt - now;
    
    // If token is close to expiration (e.g., less than 25% of its lifetime remaining),
    // generate a new token
    const tokenLifetime = JWT_ACCESS_EXPIRATION;
    const refreshThreshold = tokenLifetime * 0.25;
    
    if (timeRemaining < refreshThreshold) {
      // Generate a new access token
      const newToken = generateAccessToken(userProfile);
      return { userProfile, newToken };
    }
    
    return { userProfile };
  } catch (error) {
    logger.error('Session validation failed', { error });
    
    if (error.code === ErrorCodes.AUTH_EXPIRED_TOKEN) {
      throw createError('Session has expired', {
        code: ErrorCodes.AUTH_EXPIRED_TOKEN,
        statusCode: 401
      });
    }
    
    throw createError('Invalid session', {
      code: ErrorCodes.AUTH_INVALID_TOKEN,
      statusCode: 401
    });
  }
};

/**
 * Retrieves metadata about a token without validating it
 * 
 * @param token - Token to decode
 * @returns Token metadata including issuedAt, expiresAt, and userId
 */
export const getTokenMetadata = async (token: string): Promise<{
  issuedAt: Date;
  expiresAt: Date;
  userId: string;
}> => {
  try {
    // Decode the token without verification
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.iat || !decoded.exp || !decoded.user_id) {
      throw new Error('Invalid token format');
    }
    
    return {
      issuedAt: new Date(decoded.iat * 1000),
      expiresAt: new Date(decoded.exp * 1000),
      userId: decoded.user_id
    };
  } catch (error) {
    logger.error('Failed to decode token', { error });
    throw createError('Invalid token format', {
      code: ErrorCodes.AUTH_INVALID_TOKEN,
      statusCode: 400
    });
  }
};

/**
 * Checks if a token has been revoked
 * 
 * @param token - Token to check
 * @returns True if token is revoked
 */
export const checkTokenRevocationStatus = async (token: string): Promise<boolean> => {
  try {
    // Decode the token to get the JWT ID
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.jti) {
      return false;
    }
    
    // Check if token is revoked in the database
    return await isTokenRevoked(decoded.jti);
  } catch (error) {
    logger.error('Failed to check token revocation status', { error });
    return false;
  }
};

export {
  validateAccessToken,
  createTokens,
  refreshTokens,
  revokeToken,
  validateAndExtendSession,
  getTokenMetadata,
  checkTokenRevocationStatus
};