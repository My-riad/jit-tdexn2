import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import onFinished from 'on-finished'; // on-finished@2.4.1
import logger from '../utils/logger';

// Global environment variable
const NODE_ENV = process.env.NODE_ENV || 'development';

// Extend Express Request to include our custom properties
interface ExtendedRequest extends Request {
  requestId?: string;
  startTime?: number;
}

/**
 * Generates a unique request ID for tracing and correlation
 * @returns Unique UUID v4 identifier
 */
export const generateRequestId = (): string => {
  return uuidv4();
};

/**
 * Sanitizes request headers to remove sensitive information before logging
 * @param headers Request headers object
 * @returns Sanitized headers object
 */
const sanitizeHeaders = (headers: Record<string, any>): Record<string, any> => {
  // Create a copy of the headers to avoid modifying the original
  const sanitized = { ...headers };
  
  // List of sensitive headers to redact
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'password',
    'secret',
    'token',
    'api-key',
    'session',
    'csrf-token',
    'x-csrf-token'
  ];
  
  // Redact all sensitive headers
  sensitiveHeaders.forEach(header => {
    const headerLower = header.toLowerCase();
    Object.keys(sanitized).forEach(key => {
      if (key.toLowerCase().includes(headerLower)) {
        sanitized[key] = '[REDACTED]';
      }
    });
  });
  
  return sanitized;
};

/**
 * Middleware for logging incoming HTTP requests with details and request ID
 * @param serviceName Name of the service using this middleware
 * @returns Express middleware function
 */
export const requestLoggingMiddleware = (serviceName: string): express.RequestHandler => {
  return (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      // Generate and attach request ID if not already present
      const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
      req.requestId = requestId;
      
      // Add request ID to response headers for client-side tracing
      res.setHeader('x-request-id', requestId);
      
      // Store request start time for duration calculation
      req.startTime = Date.now();
      
      // Sanitize headers before logging
      const sanitizedHeaders = sanitizeHeaders(req.headers as Record<string, any>);
      
      // Log request details
      logger.info(`${serviceName} - Incoming request ${req.method} ${req.path}`, {
        requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
        headers: sanitizedHeaders,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        serviceName
      });
      
      // If in development mode, log more detailed information
      if (NODE_ENV === 'development') {
        // Avoid logging large request bodies
        const bodyToLog = req.body && typeof req.body === 'object' 
          ? JSON.stringify(req.body).length > 1000 
            ? { _note: 'Body too large to log, truncated', _preview: JSON.stringify(req.body).substring(0, 1000) }
            : req.body
          : req.body;
        
        logger.debug(`${serviceName} - Request details`, {
          requestId,
          body: bodyToLog,
          params: req.params,
          serviceName
        });
      }
      
      next();
    } catch (error) {
      // Log the error but don't block the request
      logger.error(`${serviceName} - Error in request logging middleware`, {
        error,
        path: req.path,
        method: req.method,
        serviceName
      });
      next();
    }
  };
};

/**
 * Middleware for logging HTTP responses with status code, duration, and size
 * @param serviceName Name of the service using this middleware
 * @returns Express middleware function
 */
export const responseLoggingMiddleware = (serviceName: string): express.RequestHandler => {
  return (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      // Use on-finished to hook into response completion event
      onFinished(res, (err, res) => {
        try {
          const requestId = req.requestId;
          const startTime = req.startTime;
          
          // Calculate request duration
          const duration = startTime ? Date.now() - startTime : 0;
          
          // Get response details
          const statusCode = res.statusCode;
          const contentLength = parseInt(res.get('content-length') || '0', 10);
          
          // Define log level based on status code
          const logLevel = statusCode >= 500 ? 'error' : 
                           statusCode >= 400 ? 'warn' : 'info';
          
          // Log response details with appropriate level
          if (logLevel === 'error') {
            logger.error(`${serviceName} - Outgoing response ${statusCode} ${req.method} ${req.path}`, {
              requestId,
              method: req.method,
              path: req.path,
              statusCode,
              duration: `${duration}ms`,
              contentLength,
              contentType: res.get('content-type'),
              serviceName
            });
          } else if (logLevel === 'warn') {
            logger.warn(`${serviceName} - Outgoing response ${statusCode} ${req.method} ${req.path}`, {
              requestId,
              method: req.method,
              path: req.path,
              statusCode,
              duration: `${duration}ms`,
              contentLength,
              contentType: res.get('content-type'),
              serviceName
            });
          } else {
            logger.info(`${serviceName} - Outgoing response ${statusCode} ${req.method} ${req.path}`, {
              requestId,
              method: req.method,
              path: req.path,
              statusCode,
              duration: `${duration}ms`,
              contentLength,
              contentType: res.get('content-type'),
              serviceName
            });
          }
          
          // Log error details for status codes >= 400
          if (statusCode >= 400) {
            logger.debug(`${serviceName} - Error response details`, {
              requestId,
              statusCode,
              method: req.method,
              path: req.path,
              error: res.locals?.error, // Accessing error if stored in locals
              serviceName
            });
          }
        } catch (error) {
          // Log the error but don't block the request processing
          logger.error(`${serviceName} - Error in response logging finisher`, {
            error,
            path: req.path,
            method: req.method,
            serviceName
          });
        }
      });
      
      next();
    } catch (error) {
      // Log the error but don't block the request
      logger.error(`${serviceName} - Error in response logging middleware`, {
        error,
        path: req.path,
        method: req.method,
        serviceName
      });
      next();
    }
  };
};

/**
 * Combined middleware that applies both request and response logging with service context
 * @param serviceName Name of the service using this middleware
 * @returns Express middleware function
 */
export const loggingMiddleware = (serviceName: string): express.RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Apply request logging first
    requestLoggingMiddleware(serviceName)(req, res, (err) => {
      if (err) return next(err);
      
      // Then apply response logging
      responseLoggingMiddleware(serviceName)(req, res, next);
    });
  };
};