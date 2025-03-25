import { Router, Request, Response } from 'express';
import axios from 'axios'; // axios@1.3.4
import { ServiceRegistry, SERVICES } from '../config/service-registry';
import { authenticate } from '../../../common/middleware/auth.middleware';
import logger from '../../../common/utils/logger';
import { EntityType } from '../../../common/interfaces/position.interface';

/**
 * Proxies a request to the tracking service and returns the response
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param path - Path to append to the tracking service URL
 * @returns Promise that resolves when the response is sent
 */
async function proxyRequest(req: Request, res: Response, path: string): Promise<void> {
  try {
    // Get the tracking service instance
    const trackingServiceInstance = ServiceRegistry.getServiceInstance(SERVICES.TRACKING_SERVICE);
    
    // Extract request details
    const method = req.method;
    const headers = {
      ...req.headers,
      'Content-Type': 'application/json',
      // Forward authorization header if present
      ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {})
    };
    
    // Don't forward these headers
    delete headers.host;
    delete headers['content-length'];
    
    const query = req.query;
    const body = req.body;
    
    // Construct the target URL
    const targetUrl = `${trackingServiceInstance.service.url}${path}`;
    
    logger.info(`Proxying ${method} request to tracking service`, {
      path,
      method,
      query: JSON.stringify(query)
    });
    
    // Make the request to the tracking service using the circuit breaker
    const response = await trackingServiceInstance.circuitBreaker.fire({
      method,
      url: targetUrl,
      headers,
      params: query,
      data: method !== 'GET' ? body : undefined
    });
    
    // Forward the response status and data to the client
    res.status(response.status).json(response.data);
    
    logger.info(`Successfully proxied ${method} request to tracking service`, {
      path,
      status: response.status
    });
  } catch (error) {
    logger.error('Error proxying request to tracking service', { 
      error: error.message,
      path,
      method: req.method
    });
    
    // Handle different error scenarios
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      logger.error(`Tracking service responded with error ${status}`, { data });
      res.status(status).json(data);
    } else if (error.request) {
      // The request was made but no response was received
      logger.error('No response received from tracking service', { path });
      res.status(503).json({
        message: 'Tracking service unavailable',
        code: 'EXT_SERVICE_UNAVAILABLE'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error('Error setting up request to tracking service', { error: error.message });
      res.status(500).json({
        message: 'Internal server error',
        code: 'SRV_INTERNAL_ERROR'
      });
    }
  }
}

/**
 * Creates and configures the Express router for tracking endpoints
 * 
 * @returns Configured Express router with tracking routes
 */
function createTrackingRouter(): Router {
  const router = Router();
  
  //----------------------------------------------------------------------
  // Position Routes
  //----------------------------------------------------------------------
  
  // Update position
  router.post('/positions', authenticate, (req: Request, res: Response) => {
    proxyRequest(req, res, '/positions');
  });
  
  // Batch update positions
  router.post('/positions/batch', authenticate, (req: Request, res: Response) => {
    proxyRequest(req, res, '/positions/batch');
  });
  
  // Get current position of an entity
  router.get('/positions/:entityId', authenticate, (req: Request, res: Response) => {
    const { entityId } = req.params;
    proxyRequest(req, res, `/positions/${entityId}`);
  });
  
  // Get current positions filtered by entity type and other criteria
  router.get('/positions', authenticate, (req: Request, res: Response) => {
    proxyRequest(req, res, '/positions');
  });
  
  //----------------------------------------------------------------------
  // Historical Position Routes
  //----------------------------------------------------------------------
  
  // Get position history for an entity
  router.get('/history/:entityId', authenticate, (req: Request, res: Response) => {
    const { entityId } = req.params;
    proxyRequest(req, res, `/history/${entityId}`);
  });
  
  // Get aggregated position history
  router.get('/history', authenticate, (req: Request, res: Response) => {
    proxyRequest(req, res, '/history');
  });
  
  //----------------------------------------------------------------------
  // Geofence Routes
  //----------------------------------------------------------------------
  
  // Create geofence
  router.post('/geofences', authenticate, (req: Request, res: Response) => {
    proxyRequest(req, res, '/geofences');
  });
  
  // Get all geofences
  router.get('/geofences', authenticate, (req: Request, res: Response) => {
    proxyRequest(req, res, '/geofences');
  });
  
  // Get geofence by ID
  router.get('/geofences/:geofenceId', authenticate, (req: Request, res: Response) => {
    const { geofenceId } = req.params;
    proxyRequest(req, res, `/geofences/${geofenceId}`);
  });
  
  // Update geofence
  router.put('/geofences/:geofenceId', authenticate, (req: Request, res: Response) => {
    const { geofenceId } = req.params;
    proxyRequest(req, res, `/geofences/${geofenceId}`);
  });
  
  // Delete geofence
  router.delete('/geofences/:geofenceId', authenticate, (req: Request, res: Response) => {
    const { geofenceId } = req.params;
    proxyRequest(req, res, `/geofences/${geofenceId}`);
  });
  
  // Get geofence events
  router.get('/geofences/:geofenceId/events', authenticate, (req: Request, res: Response) => {
    const { geofenceId } = req.params;
    proxyRequest(req, res, `/geofences/${geofenceId}/events`);
  });
  
  // Get active geofence events for an entity
  router.get('/geofences/events/:entityId', authenticate, (req: Request, res: Response) => {
    const { entityId } = req.params;
    proxyRequest(req, res, `/geofences/events/${entityId}`);
  });
  
  //----------------------------------------------------------------------
  // ETA Routes
  //----------------------------------------------------------------------
  
  // Calculate ETA for an entity to a destination
  router.get('/eta/:entityId', authenticate, (req: Request, res: Response) => {
    const { entityId } = req.params;
    proxyRequest(req, res, `/eta/${entityId}`);
  });
  
  // Batch calculate ETAs
  router.post('/eta/batch', authenticate, (req: Request, res: Response) => {
    proxyRequest(req, res, '/eta/batch');
  });
  
  //----------------------------------------------------------------------
  // Nearby Entity Routes
  //----------------------------------------------------------------------
  
  // Find entities near a location
  router.get('/nearby', authenticate, (req: Request, res: Response) => {
    proxyRequest(req, res, '/nearby');
  });
  
  return router;
}

// Create and export the router
const router = createTrackingRouter();
export default router;