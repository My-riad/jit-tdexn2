import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import { API_GATEWAY_CONFIG, ServiceRegistry, SERVICES } from '../config';

// Configuration constants for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key';
const JWT_ISSUER = process.env.JWT_ISSUER || 'freight-optimization-platform';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'freight-optimization-api';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Express middleware that enforces authentication for protected routes in the API Gateway
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract the authorization header
    const authHeader = req.headers.authorization;
    
    // Check if authorization header is present
    if (!authHeader) {
      logger.debug('Authentication failed: Missing authorization header', {
        path: req.path,
        method: req.method
      });
      
      const error = createError('Authentication token is missing', {
        code: ErrorCodes.AUTH_MISSING_TOKEN,
        statusCode: StatusCodes.UNAUTHORIZED
      });
      
      return res.status(error.statusCode).json(error);
    }
    
    // Extract token from header
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      logger.debug('Authentication failed: Invalid authorization header format', {
        path: req.path,
        method: req.method
      });
      
      const error = createError('Invalid authorization header format', {
        code: ErrorCodes.AUTH_MISSING_TOKEN,
        statusCode: StatusCodes.UNAUTHORIZED
      });
      
      return res.status(error.statusCode).json(error);
    }
    
    try {
      // Verify the token
      const decoded = await verifyToken(token);
      
      // Attach user information to the request
      req.user = decoded;
      
      logger.debug('Authentication successful', { 
        userId: decoded.sub,
        path: req.path,
        method: req.method
      });
      
      return next();
    } catch (error) {
      // Handle token verification errors
      if (error.name === 'TokenExpiredError') {
        logger.debug('Authentication failed: Token expired', {
          path: req.path,
          method: req.method,
          error: error.message
        });
        
        const apiError = createError('Authentication token has expired', {
          code: ErrorCodes.AUTH_EXPIRED_TOKEN,
          statusCode: StatusCodes.UNAUTHORIZED
        });
        
        return res.status(apiError.statusCode).json(apiError);
      } else {
        logger.debug('Authentication failed: Invalid token', {
          path: req.path,
          method: req.method,
          error: error.message
        });
        
        const apiError = createError('Invalid authentication token', {
          code: ErrorCodes.AUTH_INVALID_TOKEN,
          statusCode: StatusCodes.UNAUTHORIZED
        });
        
        return res.status(apiError.statusCode).json(apiError);
      }
    }
  } catch (error) {
    // Handle unexpected errors
    logger.error('Unexpected error during authentication', {
      path: req.path,
      method: req.method,
      error
    });
    
    const apiError = createError('Authentication failed due to server error', {
      code: ErrorCodes.SRV_INTERNAL_ERROR,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR
    });
    
    return res.status(apiError.statusCode).json(apiError);
  }
};

/**
 * Express middleware that authenticates if token is present but doesn't require it
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract the authorization header
    const authHeader = req.headers.authorization;
    
    // If no authorization header, continue without authentication
    if (!authHeader) {
      return next();
    }
    
    // Extract token from header
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      // If header exists but token is invalid, still continue
      return next();
    }
    
    try {
      // Verify the token
      const decoded = await verifyToken(token);
      
      // Attach user information to the request
      req.user = decoded;
      
      logger.debug('Optional authentication successful', {
        userId: decoded.sub,
        path: req.path,
        method: req.method
      });
    } catch (error) {
      // In optional mode, we log but don't block on errors
      logger.debug('Optional authentication failed, continuing', {
        path: req.path,
        method: req.method,
        error: error.message
      });
    }
    
    return next();
  } catch (error) {
    // For unexpected errors, log but don't block
    logger.error('Unexpected error during optional authentication', {
      path: req.path,
      method: req.method,
      error
    });
    
    return next();
  }
};

/**
 * Express middleware that enforces role-based authorization for protected routes
 * 
 * @param roles - Array of roles allowed to access the route
 * @returns Express middleware function
 */
export const requireRole = (roles: string[]): (req: Request, res: Response, next: NextFunction) => void => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      logger.debug('Authorization failed: No authenticated user', {
        path: req.path,
        method: req.method,
        requiredRoles: roles
      });
      
      const error = createError('Authentication required', {
        code: ErrorCodes.AUTH_MISSING_TOKEN,
        statusCode: StatusCodes.UNAUTHORIZED
      });
      
      return res.status(error.statusCode).json(error);
    }
    
    // Extract user roles from the token
    const userRoles = req.user.roles || [];
    
    // Check if user has any of the required roles
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (hasRequiredRole) {
      return next();
    } else {
      logger.debug('Authorization failed: Insufficient permissions', {
        userId: req.user.sub,
        path: req.path,
        method: req.method,
        userRoles,
        requiredRoles: roles
      });
      
      const error = createError('Insufficient permissions for this operation', {
        code: ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS,
        statusCode: StatusCodes.FORBIDDEN
      });
      
      return res.status(error.statusCode).json(error);
    }
  };
};

/**
 * Utility function to verify and decode JWT tokens
 * 
 * @param token - JWT token to verify
 * @returns Decoded token payload if valid
 * @throws Error if token is invalid
 */
export const verifyToken = async (token: string): Promise<any> => {
  // First try to validate with the auth service
  try {
    // Validate token with auth service
    return await validateTokenWithAuthService(token);
  } catch (error) {
    // If auth service validation fails, fall back to local validation
    logger.debug('Auth service validation failed, falling back to local validation', {
      error: error.message
    });
    
    // Verify token locally
    return new Promise((resolve, reject) => {
      jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }
};

/**
 * Extracts JWT token from the Authorization header
 * 
 * @param authHeader - Authorization header string
 * @returns Extracted token or null if not found
 */
const extractTokenFromHeader = (authHeader: string): string | null => {
  // Check for Bearer token format
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  return null;
};

/**
 * Validates a token by making a request to the auth service
 * 
 * @param token - JWT token to validate
 * @returns User profile from the auth service if token is valid
 * @throws Error if token is invalid or auth service is unavailable
 */
const validateTokenWithAuthService = async (token: string): Promise<any> => {
  try {
    // Get auth service from registry
    const authService = ServiceRegistry.getServiceInstance(SERVICES.AUTH_SERVICE);
    
    // Make request to auth service for token validation
    const response = await authService.circuitBreaker.fire({
      method: 'POST',
      url: `${authService.service.url}/auth/validate-token`,
      data: { token },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout for token validation
    });
    
    // Return user profile from response
    return response.data.user;
  } catch (error) {
    logger.debug('Token validation with auth service failed', {
      error: error.message
    });
    
    // Handle different error scenarios
    if (error.name === 'CircuitBreakerError') {
      throw new Error('Auth service is unavailable');
    } else if (error.response) {
      // If auth service returned a specific error, use that
      const errorMessage = error.response.data?.message || 'Token validation failed';
      throw new Error(errorMessage);
    } else {
      // Otherwise throw a generic error
      throw new Error('Auth service communication error');
    }
  }
};