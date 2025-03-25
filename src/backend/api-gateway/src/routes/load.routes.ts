/**
 * Load Routes Module
 * 
 * This module defines API endpoints for all load-related operations in the
 * freight optimization platform. It serves as a gateway that forwards requests
 * to the Load Service microservice while handling authentication, authorization,
 * request validation, and error handling.
 * 
 * The routes follow RESTful principles and include operations for creating, retrieving,
 * updating, and deleting loads, as well as specialized operations like load assignment,
 * document management, and optimization.
 */

import { Router, Request, Response } from 'express';
import axios from 'axios'; // axios@1.3.4
import { authenticate, requireRole } from '../middleware/authentication';
import { ServiceRegistry, SERVICES } from '../config/service-registry';
import logger from '../../../common/utils/logger';
import { validateRequest } from '../middleware/request-validator';

/**
 * Proxies a request to the load service and returns the response
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param method - HTTP method to use (GET, POST, PUT, DELETE)
 * @param path - Path to append to the load service URL
 */
async function proxyRequest(req: Request, res: Response, method: string, path: string): Promise<void> {
  try {
    // Get the load service instance from the service registry
    const loadService = ServiceRegistry.getServiceInstance(SERVICES.LOAD_SERVICE);
    
    // Construct the full URL for the load service endpoint
    const url = `${loadService.service.url}${path}`;
    
    logger.info(`Proxying ${method} request to load service`, {
      path,
      method,
      userId: req.user?.sub
    });
    
    // Forward the request to the load service with the appropriate method
    const response = await loadService.circuitBreaker.fire({
      method,
      url,
      data: method !== 'GET' ? req.body : undefined,
      params: req.query,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'X-Request-ID': req.headers['x-request-id'],
        'X-Correlation-ID': req.headers['x-correlation-id'],
        // Forward user ID and roles for internal service authorization
        'X-User-ID': req.user?.sub,
        'X-User-Roles': req.user?.roles ? JSON.stringify(req.user.roles) : undefined
      }
    });
    
    // Return the load service response to the client
    return res.status(response.status).json(response.data);
  } catch (error) {
    // Handle and log any errors that occur during the request
    logger.error(`Error proxying request to load service: ${error.message}`, {
      path,
      method,
      error: error.response?.data || error.message,
      statusCode: error.response?.status,
      userId: req.user?.sub
    });
    
    // Return appropriate error response
    if (error.response) {
      // Forward the error response from the load service
      return res.status(error.response.status).json(error.response.data);
    } else if (error.name === 'CircuitBreakerError') {
      // Handle circuit breaker error (service unavailable)
      return res.status(503).json({
        code: 'SRV_SERVICE_UNAVAILABLE',
        message: 'Load service is currently unavailable. Please try again later.',
        statusCode: 503
      });
    } else {
      // Handle other errors (internal server error)
      return res.status(500).json({
        code: 'SRV_INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing your request.',
        statusCode: 500
      });
    }
  }
}

// Create a new router instance
const router = Router();

// Define all load-related routes

// GET /loads - Get a list of loads with optional filtering
router.get('/loads', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', '/loads');
});

// GET /loads/:loadId - Get a load by ID
router.get('/loads/:loadId', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/loads/${req.params.loadId}`);
});

// POST /loads - Create a new load
router.post('/loads', authenticate, requireRole(['admin', 'shipper_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'POST', '/loads');
});

// PUT /loads/:loadId - Update an existing load
router.put('/loads/:loadId', authenticate, requireRole(['admin', 'shipper_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/loads/${req.params.loadId}`);
});

// PUT /loads/:loadId/status - Update a load's status
router.put('/loads/:loadId/status', authenticate, requireRole(['admin', 'shipper_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'PUT', `/loads/${req.params.loadId}/status`);
});

// DELETE /loads/:loadId - Soft delete a load
router.delete('/loads/:loadId', authenticate, requireRole(['admin', 'shipper_admin']), (req, res) => {
  proxyRequest(req, res, 'DELETE', `/loads/${req.params.loadId}`);
});

// GET /loads/search - Search for loads based on various criteria
router.get('/loads/search', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', '/loads/search');
});

// GET /loads/shipper/:shipperId - Get all loads for a specific shipper
router.get('/loads/shipper/:shipperId', authenticate, requireRole(['admin', 'shipper_admin']), (req, res) => {
  proxyRequest(req, res, 'GET', `/loads/shipper/${req.params.shipperId}`);
});

// GET /loads/driver/:driverId - Get all loads assigned to a specific driver
router.get('/loads/driver/:driverId', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', `/loads/driver/${req.params.driverId}`);
});

// GET /loads/carrier/:carrierId - Get all loads assigned to a specific carrier
router.get('/loads/carrier/:carrierId', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'GET', `/loads/carrier/${req.params.carrierId}`);
});

// GET /loads/:loadId/documents - Get all documents for a load
router.get('/loads/:loadId/documents', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/loads/${req.params.loadId}/documents`);
});

// POST /loads/:loadId/documents - Upload a document for a load
router.post('/loads/:loadId/documents', authenticate, requireRole(['admin', 'shipper_admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'POST', `/loads/${req.params.loadId}/documents`);
});

// GET /loads/:loadId/documents/:documentId - Get a specific document for a load
router.get('/loads/:loadId/documents/:documentId', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/loads/${req.params.loadId}/documents/${req.params.documentId}`);
});

// DELETE /loads/:loadId/documents/:documentId - Delete a document from a load
router.delete('/loads/:loadId/documents/:documentId', authenticate, requireRole(['admin', 'shipper_admin', 'carrier_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'DELETE', `/loads/${req.params.loadId}/documents/${req.params.documentId}`);
});

// GET /loads/:loadId/status-history - Get the status history for a load
router.get('/loads/:loadId/status-history', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/loads/${req.params.loadId}/status-history`);
});

// GET /loads/available - Get available loads that match criteria
router.get('/loads/available', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', '/loads/available');
});

// GET /loads/nearby - Find loads near a specific location
router.get('/loads/nearby', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver']), (req, res) => {
  proxyRequest(req, res, 'GET', '/loads/nearby');
});

// POST /loads/:loadId/assign - Assign a load to a driver
router.post('/loads/:loadId/assign', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'load_matching']), (req, res) => {
  proxyRequest(req, res, 'POST', `/loads/${req.params.loadId}/assign`);
});

// POST /loads/:loadId/unassign - Unassign a driver from a load
router.post('/loads/:loadId/unassign', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'POST', `/loads/${req.params.loadId}/unassign`);
});

// POST /loads/:loadId/reserve - Reserve a load for potential assignment
router.post('/loads/:loadId/reserve', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver', 'load_matching']), (req, res) => {
  proxyRequest(req, res, 'POST', `/loads/${req.params.loadId}/reserve`);
});

// POST /loads/:loadId/release - Release a previously reserved load
router.post('/loads/:loadId/release', authenticate, requireRole(['admin', 'carrier_admin', 'dispatcher', 'driver', 'load_matching']), (req, res) => {
  proxyRequest(req, res, 'POST', `/loads/${req.params.loadId}/release`);
});

// GET /loads/:loadId/eta - Get the estimated time of arrival for a load
router.get('/loads/:loadId/eta', authenticate, (req, res) => {
  proxyRequest(req, res, 'GET', `/loads/${req.params.loadId}/eta`);
});

// POST /loads/:loadId/optimize - Request optimization suggestions for a load
router.post('/loads/:loadId/optimize', authenticate, requireRole(['admin', 'shipper_admin', 'carrier_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'POST', `/loads/${req.params.loadId}/optimize`);
});

// POST /loads/batch - Create multiple loads in a batch operation
router.post('/loads/batch', authenticate, requireRole(['admin', 'shipper_admin']), (req, res) => {
  proxyRequest(req, res, 'POST', '/loads/batch');
});

// GET /loads/statistics - Get statistical information about loads
router.get('/loads/statistics', authenticate, requireRole(['admin', 'shipper_admin', 'carrier_admin', 'dispatcher']), (req, res) => {
  proxyRequest(req, res, 'GET', '/loads/statistics');
});

// Export the router as the default export
export default router;