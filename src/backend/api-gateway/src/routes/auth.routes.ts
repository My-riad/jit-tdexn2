import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios'; // axios@1.3.4
import { ServiceRegistry, SERVICES } from '../config';
import { authenticate } from '../middleware/authentication';
import { publicApiRateLimiter } from '../middleware/rate-limiter';
import { requestValidator } from '../middleware/request-validator';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';

// Initialize router
const router = Router();

/**
 * Proxies authentication requests to the auth service
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
async function proxyAuthRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get auth service instance
    const authService = ServiceRegistry.getServiceInstance(SERVICES.AUTH_SERVICE);
    
    // Extract request details for proxying
    const path = req.path;
    const method = req.method;
    const body = req.body;
    const headers = {
      ...req.headers,
      'content-type': 'application/json',
    };
    
    // Remove host header to avoid conflicts
    delete headers.host;
    
    // Forward the request to the auth service
    const response = await authService.circuitBreaker.fire({
      method,
      url: `${authService.service.url}${path}`,
      data: method !== 'GET' ? body : undefined,
      params: req.query,
      headers,
      timeout: 10000, // 10 second timeout for auth requests
    });
    
    // Return the auth service response
    return res.status(response.status).json(response.data);
  } catch (error) {
    // Handle various error types
    if (error.response) {
      // Auth service returned an error response
      return res.status(error.response.status).json(error.response.data);
    } else if (error.name === 'CircuitBreakerError') {
      // Circuit breaker is open - service is unavailable
      const serviceError = createError('Authentication service is currently unavailable', {
        code: 'SRV_SERVICE_UNAVAILABLE',
        statusCode: 503,
      });
      return res.status(serviceError.statusCode).json(serviceError);
    } else {
      // Unexpected error
      logger.error('Error forwarding request to auth service', { 
        path: req.path,
        method: req.method,
        error 
      });
      const unexpectedError = createError('An unexpected error occurred during authentication', {
        code: 'SRV_INTERNAL_ERROR',
        statusCode: 500,
      });
      return res.status(unexpectedError.statusCode).json(unexpectedError);
    }
  }
}

/**
 * Sets up all authentication routes with appropriate middleware
 */
function setupAuthRoutes(): Router {
  logger.info('Setting up authentication routes');
  
  // Apply rate limiting to all auth routes
  router.use(publicApiRateLimiter());
  
  // Apply request validation middleware
  router.use(requestValidator());
  
  // ===== Public routes (no authentication required) =====
  
  // Basic authentication
  router.post('/login', proxyAuthRequest);
  router.post('/register', proxyAuthRequest);
  router.post('/refresh-token', proxyAuthRequest);
  router.post('/validate-token', proxyAuthRequest);
  
  // Password management
  router.post('/forgot-password', proxyAuthRequest);
  router.post('/reset-password', proxyAuthRequest);
  router.get('/verify-reset-token/:token', proxyAuthRequest);
  
  // OAuth routes
  router.get('/oauth/google', proxyAuthRequest);
  router.get('/oauth/google/callback', proxyAuthRequest);
  router.get('/oauth/microsoft', proxyAuthRequest);
  router.get('/oauth/microsoft/callback', proxyAuthRequest);
  
  // MFA verification
  router.post('/mfa/verify', proxyAuthRequest);
  
  // ===== Protected routes (authentication required) =====
  
  // User profile management
  router.get('/me', authenticate, proxyAuthRequest);
  router.put('/me', authenticate, proxyAuthRequest);
  
  // Logout and password change
  router.post('/logout', authenticate, proxyAuthRequest);
  router.post('/change-password', authenticate, proxyAuthRequest);
  
  // Multi-factor authentication management
  router.post('/mfa/setup', authenticate, proxyAuthRequest);
  router.post('/mfa/enable', authenticate, proxyAuthRequest);
  router.post('/mfa/disable', authenticate, proxyAuthRequest);
  
  // Session management
  router.get('/sessions', authenticate, proxyAuthRequest);
  router.delete('/sessions/:sessionId', authenticate, proxyAuthRequest);
  router.delete('/sessions', authenticate, proxyAuthRequest); // Revoke all sessions
  
  // Token management
  router.post('/tokens/revoke', authenticate, proxyAuthRequest);
  
  // API key management for service-to-service communication
  router.post('/apikeys', authenticate, proxyAuthRequest);
  router.get('/apikeys', authenticate, proxyAuthRequest);
  router.delete('/apikeys/:keyId', authenticate, proxyAuthRequest);
  
  return router;
}

// Export the configured router
export default setupAuthRoutes();