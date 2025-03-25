import { getDefaultConnection } from '../../../common/config/database.config';
import { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { decodeToken } from '../utils/token.utils';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';

// Database table name for tokens
const TABLE_NAME = 'tokens';

/**
 * Enum defining token types for authentication
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh'
}

/**
 * Interface representing a token record in the database
 */
export interface Token {
  token_id: string;
  user_id: string;
  jti: string;
  token_type: TokenType;
  expires_at: Date;
  revoked: boolean;
  revoked_at: Date | null;
  ip_address: string;
  user_agent: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Saves a token to the database
 *
 * @param userId - User ID associated with the token
 * @param jti - JWT ID of the token
 * @param tokenType - Type of token (access or refresh)
 * @param expiresAt - When the token expires
 * @param ipAddress - IP address from which the token was created
 * @param userAgent - User agent from which the token was created
 * @returns Promise resolving to the ID of the saved token
 */
export async function saveToken(
  userId: string,
  jti: string,
  tokenType: TokenType,
  expiresAt: Date,
  ipAddress: string,
  userAgent: string
): Promise<string> {
  try {
    const db = await getDefaultConnection();
    const tokenId = uuid();
    
    const [token] = await db(TABLE_NAME)
      .insert({
        token_id: tokenId,
        user_id: userId,
        jti,
        token_type: tokenType,
        expires_at: expiresAt,
        revoked: false,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('token_id');
    
    logger.info('Token saved', { 
      tokenId: tokenId, 
      userId, 
      tokenType, 
      expiresAt 
    });
    
    return tokenId;
  } catch (error) {
    logger.error('Error saving token', { error, userId, jti, tokenType });
    throw createError('Failed to save token', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { userId, tokenType }
    });
  }
}

/**
 * Retrieves a token by its database ID
 *
 * @param tokenId - Database ID of the token
 * @returns Promise resolving to the token if found, null otherwise
 */
export async function getTokenById(tokenId: string): Promise<Token | null> {
  try {
    const db = await getDefaultConnection();
    
    const token = await db(TABLE_NAME)
      .where({ token_id: tokenId })
      .first();
    
    return token || null;
  } catch (error) {
    logger.error('Error retrieving token by ID', { error, tokenId });
    throw createError('Failed to retrieve token', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { tokenId }
    });
  }
}

/**
 * Retrieves a token by its JWT ID (jti)
 *
 * @param jti - JWT ID of the token
 * @returns Promise resolving to the token if found, null otherwise
 */
export async function getTokenByJti(jti: string): Promise<Token | null> {
  try {
    const db = await getDefaultConnection();
    
    const token = await db(TABLE_NAME)
      .where({ jti })
      .first();
    
    return token || null;
  } catch (error) {
    logger.error('Error retrieving token by JTI', { error, jti });
    throw createError('Failed to retrieve token', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { jti }
    });
  }
}

/**
 * Retrieves all active tokens for a user
 *
 * @param userId - User ID to get tokens for
 * @param tokenType - Optional token type filter
 * @returns Promise resolving to array of active token records
 */
export async function getUserActiveTokens(
  userId: string,
  tokenType?: TokenType
): Promise<Token[]> {
  try {
    const db = await getDefaultConnection();
    const now = new Date();
    
    let query = db(TABLE_NAME)
      .where({ 
        user_id: userId,
        revoked: false
      })
      .andWhere('expires_at', '>', now);
    
    if (tokenType) {
      query = query.andWhere({ token_type: tokenType });
    }
    
    const tokens = await query;
    
    return tokens;
  } catch (error) {
    logger.error('Error retrieving user active tokens', { error, userId, tokenType });
    throw createError('Failed to retrieve active tokens', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { userId, tokenType }
    });
  }
}

/**
 * Revokes a token by its database ID
 *
 * @param tokenId - Database ID of the token to revoke
 * @returns Promise resolving to true if token was revoked, false if token not found
 */
export async function revokeToken(tokenId: string): Promise<boolean> {
  try {
    const db = await getDefaultConnection();
    const now = new Date();
    
    const updateCount = await db(TABLE_NAME)
      .where({ token_id: tokenId })
      .update({
        revoked: true,
        revoked_at: now,
        updated_at: now
      });
    
    if (updateCount > 0) {
      logger.info('Token revoked', { tokenId });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error revoking token', { error, tokenId });
    throw createError('Failed to revoke token', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { tokenId }
    });
  }
}

/**
 * Revokes a token by its JWT ID (jti)
 *
 * @param jti - JWT ID of the token to revoke
 * @returns Promise resolving to true if token was revoked, false if token not found
 */
export async function revokeTokenByJti(jti: string): Promise<boolean> {
  try {
    const db = await getDefaultConnection();
    const now = new Date();
    
    const updateCount = await db(TABLE_NAME)
      .where({ jti })
      .update({
        revoked: true,
        revoked_at: now,
        updated_at: now
      });
    
    if (updateCount > 0) {
      logger.info('Token revoked by JTI', { jti });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error revoking token by JTI', { error, jti });
    throw createError('Failed to revoke token', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { jti }
    });
  }
}

/**
 * Revokes all tokens for a user
 *
 * @param userId - User ID to revoke tokens for
 * @param tokenType - Optional token type filter
 * @returns Promise resolving to the number of tokens revoked
 */
export async function revokeAllUserTokens(
  userId: string,
  tokenType?: TokenType
): Promise<number> {
  try {
    const db = await getDefaultConnection();
    const now = new Date();
    
    let query = db(TABLE_NAME)
      .where({ 
        user_id: userId,
        revoked: false
      });
    
    if (tokenType) {
      query = query.andWhere({ token_type: tokenType });
    }
    
    const updateCount = await query.update({
      revoked: true,
      revoked_at: now,
      updated_at: now
    });
    
    logger.info('All user tokens revoked', { 
      userId, 
      tokenType, 
      count: updateCount 
    });
    
    return updateCount;
  } catch (error) {
    logger.error('Error revoking all user tokens', { error, userId, tokenType });
    throw createError('Failed to revoke user tokens', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { userId, tokenType }
    });
  }
}

/**
 * Checks if a token is revoked
 *
 * @param jti - JWT ID of the token to check
 * @returns Promise resolving to true if token is revoked, false otherwise
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  try {
    const db = await getDefaultConnection();
    
    const token = await db(TABLE_NAME)
      .where({ jti })
      .first();
    
    // If token doesn't exist in database, it's not considered revoked
    // However, this could be a security risk, so you might want to customize this behavior
    if (!token) {
      return false;
    }
    
    return token.revoked === true;
  } catch (error) {
    logger.error('Error checking if token is revoked', { error, jti });
    throw createError('Failed to check token revocation status', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { jti }
    });
  }
}

/**
 * Removes expired tokens from the database
 *
 * @returns Promise resolving to the number of tokens removed
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const db = await getDefaultConnection();
    const now = new Date();
    
    const deleteCount = await db(TABLE_NAME)
      .where('expires_at', '<', now)
      .delete();
    
    logger.info('Cleaned up expired tokens', { count: deleteCount });
    
    return deleteCount;
  } catch (error) {
    logger.error('Error cleaning up expired tokens', { error });
    throw createError('Failed to clean up expired tokens', {
      code: ErrorCodes.DB_QUERY_ERROR
    });
  }
}

/**
 * Counts active sessions for a user based on refresh tokens
 *
 * @param userId - User ID to count sessions for
 * @returns Promise resolving to the number of active sessions
 */
export async function countUserActiveSessions(userId: string): Promise<number> {
  try {
    const db = await getDefaultConnection();
    const now = new Date();
    
    const result = await db(TABLE_NAME)
      .where({
        user_id: userId,
        token_type: TokenType.REFRESH,
        revoked: false
      })
      .andWhere('expires_at', '>', now)
      .count('token_id as count')
      .first();
    
    return parseInt(result?.count as string, 10) || 0;
  } catch (error) {
    logger.error('Error counting user active sessions', { error, userId });
    throw createError('Failed to count active sessions', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { userId }
    });
  }
}

/**
 * Gets the oldest active session for a user
 * Useful for enforcing maximum concurrent session limits
 *
 * @param userId - User ID to get oldest session for
 * @returns Promise resolving to the oldest token record if found, null otherwise
 */
export async function getOldestUserSession(userId: string): Promise<Token | null> {
  try {
    const db = await getDefaultConnection();
    const now = new Date();
    
    const token = await db(TABLE_NAME)
      .where({
        user_id: userId,
        token_type: TokenType.REFRESH,
        revoked: false
      })
      .andWhere('expires_at', '>', now)
      .orderBy('created_at', 'asc')
      .first();
    
    return token || null;
  } catch (error) {
    logger.error('Error getting oldest user session', { error, userId });
    throw createError('Failed to get oldest user session', {
      code: ErrorCodes.DB_QUERY_ERROR,
      details: { userId }
    });
  }
}