import express from 'express';
import axios from 'axios';

import { authenticate, requireRole } from '../middleware/authentication';
import { requestValidator } from '../middleware/request-validator';
import { ServiceRegistry, SERVICES } from '../config';
import logger from '../../../common/utils/logger';

// Create a new router instance
const router = express.Router();

/**
 * Utility function to proxy requests to the carrier service
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param method - HTTP method to use for the proxied request
 * @param path - Path to append to the carrier service URL
 */
async function proxyRequest(
  req: express.Request,
  res: express.Response,
  method: string,
  path: string
): Promise<void> {
  try {
    // Get the carrier service URL from the ServiceRegistry
    const carrierServiceInstance = ServiceRegistry.getServiceInstance(SERVICES.CARRIER_SERVICE);
    
    // Construct the full URL for the request
    const url = `${carrierServiceInstance.service.url}${path}`;
    
    // Log the outgoing request
    logger.info(`Proxying ${method} request to carrier service: ${url}`, {
      method,
      url,
      path: req.path,
      originalUrl: req.originalUrl
    });
    
    // Forward the request to the carrier service with the same method, headers, and body
    const response = await carrierServiceInstance.circuitBreaker.fire({
      method,
      url,
      data: method !== 'GET' ? req.body : undefined,
      params: method === 'GET' ? req.query : undefined,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'X-Request-ID': req.headers['x-request-id'],
        'X-User-ID': req.user?.sub || ''
      }
    });
    
    // Return the response from the carrier service to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    // Log the error
    logger.error('Error proxying request to carrier service', {
      error: error.message,
      path: req.path,
      method
    });
    
    // Handle errors and return appropriate error responses
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      res.status(502).json({
        code: 'SRV_DEPENDENCY_FAILURE',
        message: 'Carrier service unavailable',
        statusCode: 502
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({
        code: 'SRV_INTERNAL_ERROR',
        message: 'Error processing request',
        statusCode: 500
      });
    }
  }
}

// GET /carriers - Get a list of carriers with optional filtering
router.get('/carriers', authenticate, requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'GET', req.path);
});

// GET /carriers/:carrierId - Get detailed information about a specific carrier
router.get('/carriers/:carrierId', authenticate, requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'GET', req.path);
});

// POST /carriers - Create a new carrier
router.post('/carriers', authenticate, requireRole(['admin', 'carrier_admin']), requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'POST', req.path);
});

// PUT /carriers/:carrierId - Update an existing carrier
router.put('/carriers/:carrierId', authenticate, requireRole(['admin', 'carrier_admin']), requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'PUT', req.path);
});

// DELETE /carriers/:carrierId - Delete a carrier (soft delete)
router.delete('/carriers/:carrierId', authenticate, requireRole(['admin']), requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'DELETE', req.path);
});

// GET /carriers/:carrierId/drivers - Get all drivers associated with a carrier
router.get('/carriers/:carrierId/drivers', authenticate, requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'GET', req.path);
});

// GET /carriers/:carrierId/vehicles - Get all vehicles associated with a carrier
router.get('/carriers/:carrierId/vehicles', authenticate, requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'GET', req.path);
});

// GET /carriers/:carrierId/loads - Get all loads associated with a carrier
router.get('/carriers/:carrierId/loads', authenticate, requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'GET', req.path);
});

// GET /carriers/:carrierId/performance - Get performance metrics for a carrier
router.get('/carriers/:carrierId/performance', authenticate, requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'GET', req.path);
});

// GET /carriers/:carrierId/network-statistics - Get network contribution statistics for a carrier
router.get('/carriers/:carrierId/network-statistics', authenticate, requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'GET', req.path);
});

// GET /carriers/:carrierId/relationships - Get shipper relationships for a carrier
router.get('/carriers/:carrierId/relationships', authenticate, requestValidator, async (req, res) => {
  await proxyRequest(req, res, 'GET', req.path);
});

// POST /carriers/:carrierId/relationships/:shipperId - Create a relationship between a carrier and shipper
router.post(
  '/carriers/:carrierId/relationships/:shipperId', 
  authenticate, 
  requireRole(['admin', 'carrier_admin', 'shipper_admin']), 
  requestValidator, 
  async (req, res) => {
    await proxyRequest(req, res, 'POST', req.path);
  }
);

// PUT /carriers/:carrierId/relationships/:shipperId - Update a relationship between a carrier and shipper
router.put(
  '/carriers/:carrierId/relationships/:shipperId', 
  authenticate, 
  requireRole(['admin', 'carrier_admin', 'shipper_admin']), 
  requestValidator, 
  async (req, res) => {
    await proxyRequest(req, res, 'PUT', req.path);
  }
);

// DELETE /carriers/:carrierId/relationships/:shipperId - Delete a relationship between a carrier and shipper
router.delete(
  '/carriers/:carrierId/relationships/:shipperId', 
  authenticate, 
  requireRole(['admin', 'carrier_admin', 'shipper_admin']), 
  requestValidator, 
  async (req, res) => {
    await proxyRequest(req, res, 'DELETE', req.path);
  }
);

export default router;