import express from 'express'; // express@4.18.2
import { verifyAccessToken, extractTokenFromHeader } from '../utils/token.utils';
import { validateAccessToken, refreshTokens } from '../services/token.service';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import { UserProfile } from '../../../common/interfaces/user.interface';

/**
 * Express middleware that enforces JWT authentication for protected routes
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requireJwtAuth = (
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
): void => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    // If no authorization header present, return 401 unauthorized
    if (!authHeader) {
      logger.debug('Missing authorization header');
      return res.status(StatusCodes.UNAUTHORIZED).json(
        createError('Authentication required', {
          code: ErrorCodes.AUTH_MISSING_TOKEN,
          statusCode: StatusCodes.UNAUTHORIZED
        })
      );
    }
    
    // Extract token from authorization header
    const token = extractTokenFromHeader(authHeader);
    
    // If no token could be extracted, return 401 unauthorized
    if (!token) {
      logger.debug('Invalid authorization header format');
      return res.status(StatusCodes.UNAUTHORIZED).json(
        createError('Invalid authorization format', {
          code: ErrorCodes.AUTH_MISSING_TOKEN,
          statusCode: StatusCodes.UNAUTHORIZED
        })
      );
    }
    
    // Validate the token and get user profile
    validateAccessToken(token)
      .then(userProfile => {
        // Attach user to request object for use in route handlers
        req.user = userProfile;
        
        logger.debug('Successfully authenticated user', { userId: userProfile.user_id });
        next();
      })
      .catch(error => {
        logger.warn('Token validation failed', { error });
        
        // Handle different token error scenarios
        if (error.code === ErrorCodes.AUTH_EXPIRED_TOKEN) {
          return res.status(StatusCodes.UNAUTHORIZED).json(
            createError('Access token has expired', {
              code: ErrorCodes.AUTH_EXPIRED_TOKEN,
              statusCode: StatusCodes.UNAUTHORIZED
            })
          );
        }
        
        return res.status(StatusCodes.UNAUTHORIZED).json(
          createError('Invalid authentication token', {
            code: ErrorCodes.AUTH_INVALID_TOKEN,
            statusCode: StatusCodes.UNAUTHORIZED
          })
        );
      });
  } catch (error) {
    logger.error('Authentication middleware error', { error });
    return res.status(StatusCodes.UNAUTHORIZED).json(
      createError('Authentication failed', {
        code: ErrorCodes.AUTH_INVALID_TOKEN,
        statusCode: StatusCodes.UNAUTHORIZED
      })
    );
  }
};

/**
 * Express middleware that authenticates if token is present but doesn't require it
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const optionalJwtAuth = (
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
): void => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    // If no authorization header present, continue without authentication
    if (!authHeader) {
      logger.debug('No authorization header, continuing without authentication');
      return next();
    }
    
    // Extract token from authorization header
    const token = extractTokenFromHeader(authHeader);
    
    // If no token could be extracted, continue without authentication
    if (!token) {
      logger.debug('Invalid authorization header format, continuing without authentication');
      return next();
    }
    
    // Validate the token and get user profile
    validateAccessToken(token)
      .then(userProfile => {
        // Attach user to request object for use in route handlers
        req.user = userProfile;
        
        logger.debug('Successfully authenticated user with optional auth', { userId: userProfile.user_id });
        next();
      })
      .catch(error => {
        // Log the error but continue without authentication
        logger.debug('Optional authentication failed, continuing without authentication', { error });
        next();
      });
  } catch (error) {
    // Log the error but continue without authentication
    logger.debug('Optional authentication error, continuing without authentication', { error });
    next();
  }
};

/**
 * Express middleware that handles token refresh requests
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const handleTokenRefresh = async (
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
): Promise<void> => {
  try {
    // Get refresh token from request body
    const { refreshToken } = req.body;
    
    // Validate refresh token is provided
    if (!refreshToken) {
      logger.debug('No refresh token provided');
      return res.status(StatusCodes.BAD_REQUEST).json(
        createError('Refresh token is required', {
          code: ErrorCodes.AUTH_MISSING_TOKEN,
          statusCode: StatusCodes.BAD_REQUEST
        })
      );
    }
    
    // Get client information for security tracking
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    
    // Refresh the tokens
    const tokens = await refreshTokens(refreshToken, ipAddress, userAgent);
    
    logger.info('Successfully refreshed tokens', { 
      ip: ipAddress,
      userAgent: userAgent.substring(0, 50) // Truncate for log safety
    });
    
    // Return new tokens
    return res.status(StatusCodes.OK).json({ 
      success: true,
      data: tokens
    });
  } catch (error) {
    logger.warn('Token refresh failed', { error });
    
    // Handle specific error types
    if (error.code === ErrorCodes.AUTH_EXPIRED_TOKEN) {
      return res.status(StatusCodes.UNAUTHORIZED).json(
        createError('Refresh token has expired, please log in again', {
          code: ErrorCodes.AUTH_EXPIRED_TOKEN,
          statusCode: StatusCodes.UNAUTHORIZED
        })
      );
    }
    
    if (error.code === ErrorCodes.AUTH_INVALID_TOKEN) {
      return res.status(StatusCodes.UNAUTHORIZED).json(
        createError('Invalid refresh token', {
          code: ErrorCodes.AUTH_INVALID_TOKEN,
          statusCode: StatusCodes.UNAUTHORIZED
        })
      );
    }
    
    // Generic error handling
    return res.status(StatusCodes.UNAUTHORIZED).json(
      createError('Token refresh failed', {
        code: ErrorCodes.AUTH_INVALID_TOKEN,
        statusCode: StatusCodes.UNAUTHORIZED
      })
    );
  }
};

/**
 * Utility function to extract user profile from a JWT token
 * 
 * @param token - JWT token to extract user from
 * @returns Promise resolving to user profile
 */
export const extractUserFromToken = async (token: string): Promise<UserProfile> => {
  try {
    const userProfile = await validateAccessToken(token);
    return userProfile;
  } catch (error) {
    logger.error('Failed to extract user from token', { error });
    throw error;
  }
};

// Add type augmentation for Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}