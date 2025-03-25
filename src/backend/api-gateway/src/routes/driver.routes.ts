import { Router, Request, Response } from 'express';
import axios from 'axios'; // axios@1.3.4
import { authenticate, requireRole } from '../middleware/authentication';
import { ServiceRegistry, SERVICES } from '../config/service-registry';
import logger from '../../../common/utils/logger';
import { validateRequest } from '../../../common/middleware/validation.middleware';

// Create Express router
const router = Router();

/**
 * Proxies a request to the driver service and returns the response
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param method - HTTP method to use for the driver service request
 * @param path - Path to append to the driver service URL
 * @returns Promise that resolves when the response is sent
 */
async function proxyRequest(req: Request, res: Response, method: string, path: string): Promise<void> {
  try {
    // Get the driver service instance from the service registry
    const driverService = ServiceRegistry.getServiceInstance(SERVICES.DRIVER_SERVICE);
    
    // Construct the full URL for the driver service endpoint
    const url = `${driverService.service.url}${path}`;
    
    logger.info(`Proxying ${method} request to driver service`, { 
      path,
      method,
      targetUrl: url
    });
    
    // Forward the request to the driver service with the appropriate method
    const response = await driverService.circuitBreaker.fire({
      method,
      url,
      data: method !== 'GET' ? req.body : undefined,
      params: req.query,
      headers: {
        // Forward authentication header if present
        ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}),
        // Forward content type if present
        ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {}),
        // Add user ID from authenticated request if available
        ...(req.user?.sub ? { 'X-User-ID': req.user.sub } : {})
      }
    });
    
    // Return the driver service response to the client
    return res.status(response.status).json(response.data);
  } catch (error) {
    // Handle and log any errors that occur during the request
    logger.error(`Error proxying request to driver service`, {
      path,
      method,
      error: error.message,
      stack: error.stack
    });
    
    // If the error has a response, forward it to the client
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Otherwise, return a generic error
    return res.status(500).json({
      code: 'SRV_INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
}

// GET routes - Define specific routes before generic ones to avoid routing conflicts
router.get('/drivers/user/:userId', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/user/${req.params.userId}`);
});

router.get('/drivers/carrier/:carrierId', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/carrier/${req.params.carrierId}`);
});

router.get('/drivers/available', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'shipper_admin']), (req, res) => {
  proxyRequest(req, res, 'GET', '/drivers/available');
});

router.get('/drivers/near', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'shipper_admin']), (req, res) => {
  proxyRequest(req, res, 'GET', '/drivers/near');
});

router.get('/drivers/:driverId/summary', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/summary`);
});

router.get('/drivers/:driverId/availability', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/availability`);
});

router.get('/drivers/:driverId/hos', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/hos`);
});

router.get('/drivers/:driverId/hos/history', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/hos/history`);
});

router.get('/drivers/:driverId/hos/compliance', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/hos/compliance`);
});

router.get('/drivers/:driverId/hos/summary', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/hos/summary`);
});

router.get('/drivers/:driverId/hos/predict', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/hos/predict`);
});

router.get('/drivers/:driverId/preferences', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/preferences`);
});

router.get('/drivers/:driverId/performance', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}/performance`);
});

router.get('/drivers/:driverId', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/drivers/${req.params.driverId}`);
});

router.get('/drivers', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'GET', '/drivers');
});

// POST routes
router.post('/drivers', authenticate, requireRole(['admin', 'carrier_admin']), (req, res) => {
  proxyRequest(req, res, 'POST', '/drivers');
});

router.post('/drivers/:driverId/hos/sync', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'POST', `/drivers/${req.params.driverId}/hos/sync`);
});

router.post('/drivers/:driverId/preferences', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'POST', `/drivers/${req.params.driverId}/preferences`);
});

router.post('/drivers/:driverId/eld/connect', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'POST', `/drivers/${req.params.driverId}/eld/connect`);
});

router.post('/drivers/:driverId/eld/disconnect', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'POST', `/drivers/${req.params.driverId}/eld/disconnect`);
});

router.post('/drivers/:driverId/availability/load', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'load_matching']), (req, res) => {
  proxyRequest(req, res, 'POST', `/drivers/${req.params.driverId}/availability/load`);
});

// PUT routes
router.put('/drivers/:driverId/status', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/drivers/${req.params.driverId}/status`);
});

router.put('/drivers/:driverId/load', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/drivers/${req.params.driverId}/load`);
});

router.put('/drivers/:driverId/score', authenticate, requireRole(['admin', 'system']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/drivers/${req.params.driverId}/score`);
});

router.put('/drivers/:driverId/availability', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/drivers/${req.params.driverId}/availability`);
});

router.put('/drivers/:driverId/location', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/drivers/${req.params.driverId}/location`);
});

router.put('/drivers/:driverId/hos', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/drivers/${req.params.driverId}/hos`);
});

router.put('/drivers/:driverId/preferences/:preferenceId', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/drivers/${req.params.driverId}/preferences/${req.params.preferenceId}`);
});

router.put('/drivers/:driverId', authenticate, requireRole(['admin', 'carrier_admin', 'driver']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/drivers/${req.params.driverId}`);
});

// DELETE routes
router.delete('/drivers/:driverId/preferences/:preferenceId', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'DELETE', `/drivers/${req.params.driverId}/preferences/${req.params.preferenceId}`);
});

router.delete('/drivers/:driverId', authenticate, requireRole(['admin', 'carrier_admin']), (req, res) => {
  proxyRequest(req, res, 'DELETE', `/drivers/${req.params.driverId}`);
});

export default router;