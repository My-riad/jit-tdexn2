import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'; // v9.0.0
import { createError } from '../utils/error-handler';
import logger from '../utils/logger';
import { ErrorCodes } from '../constants/error-codes';
import { StatusCodes } from '../constants/status-codes';

// Global configuration values (preferably from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key';
const JWT_ISSUER = process.env.JWT_ISSUER || 'freight-optimization-platform';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'freight-optimization-api';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload;
    }
  }
}

/**
 * Extracts JWT token from the Authorization header
 * 
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null if not found
 */
function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  return null;
}

/**
 * Utility function to verify and decode JWT tokens
 * 
 * @param token - The JWT token to verify
 * @returns Decoded token payload if valid
 * @throws Error if token verification fails
 */
function verifyToken(token: string): jwt.JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    
    return decoded as jwt.JwtPayload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw createError('Token has expired', { code: ErrorCodes.AUTH_EXPIRED_TOKEN });
    } else if (error.name === 'JsonWebTokenError') {
      throw createError('Invalid token', { code: ErrorCodes.AUTH_INVALID_TOKEN });
    } else {
      throw createError('Token verification failed', { code: ErrorCodes.AUTH_INVALID_TOKEN });
    }
  }
}

/**
 * Express middleware that enforces authentication for protected routes
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract authorization header
    const authHeader = req.headers.authorization;
    
    // Check if authorization header exists
    if (!authHeader) {
      logger.debug('Authentication failed: Missing token');
      res.status(StatusCodes.UNAUTHORIZED).json(
        createError('Authentication token is missing', { code: ErrorCodes.AUTH_MISSING_TOKEN })
      );
      return;
    }
    
    // Extract token from header
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      logger.debug('Authentication failed: Invalid token format');
      res.status(StatusCodes.UNAUTHORIZED).json(
        createError('Invalid token format', { code: ErrorCodes.AUTH_INVALID_TOKEN })
      );
      return;
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Attach user data to request
      req.user = decoded;
      logger.debug('Authentication successful', { userId: decoded.sub });
      next();
    } catch (error) {
      logger.error('Authentication failed: Token verification failed', { error });
      res.status(StatusCodes.UNAUTHORIZED).json(error);
    }
  } catch (error) {
    logger.error('Authentication failed: Unexpected error', { error });
    res.status(StatusCodes.UNAUTHORIZED).json(
      createError('Authentication failed', { code: ErrorCodes.AUTH_INVALID_TOKEN })
    );
  }
}

/**
 * Express middleware that authenticates if token is present but doesn't require it
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract authorization header
    const authHeader = req.headers.authorization;
    
    // If no header, proceed without authentication
    if (!authHeader) {
      logger.debug('Optional authentication: No token present');
      next();
      return;
    }
    
    // Extract token from header
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      logger.debug('Optional authentication: Invalid token format');
      next();
      return;
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Attach user data to request
      req.user = decoded;
      logger.debug('Optional authentication successful', { userId: decoded.sub });
    } catch (error) {
      // Log error but continue without authentication
      logger.debug('Optional authentication failed', { error });
    }
    
    // Always proceed to next middleware
    next();
  } catch (error) {
    // Log error but continue without authentication
    logger.debug('Optional authentication failed', { error });
    next();
  }
}

export {
  authenticate,
  optionalAuthenticate,
  verifyToken
};