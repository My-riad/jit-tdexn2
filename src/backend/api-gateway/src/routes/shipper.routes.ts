/**
 * Shipper Routes
 * 
 * This module defines API endpoints for shipper management in the freight optimization platform.
 * It handles routing for shipper-related operations such as creating, retrieving, updating,
 * and deleting shippers, as well as managing shipper facilities, carrier preferences,
 * and performance metrics.
 */

import express from 'express';
import axios from 'axios';

import { authenticate, requireRole } from '../middleware/authentication';
import { requestValidator } from '../middleware/request-validator';
import { ServiceRegistry, SERVICES } from '../config';
import logger from '../../../common/utils/logger';

// Create the router
const router = express.Router();

/**
 * Utility function to proxy requests to the shipper service
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param method - HTTP method to use for the proxied request
 * @param path - Path to append to the service URL
 */
async function proxyRequest(
  req: express.Request,
  res: express.Response,
  method: string,
  path: string
): Promise<void> {
  try {
    // Get the shipper service instance from the registry
    const serviceInstance = ServiceRegistry.getServiceInstance(SERVICES.SHIPPER_SERVICE);
    const fullUrl = `${serviceInstance.service.url}${path}`;

    // Log the outgoing request
    logger.info(`Proxying ${method} request to shipper service: ${method} ${path}`, {
      userId: req.user?.sub,
      route: req.path
    });

    // Build the request configuration for axios
    const requestConfig = {
      method,
      url: fullUrl,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
        'x-user-id': req.user?.sub, // Pass user ID to service
        'x-user-roles': req.user?.roles ? JSON.stringify(req.user.roles) : '[]' // Pass user roles to service
      },
      data: method !== 'GET' ? req.body : undefined,
      params: method === 'GET' ? req.query : undefined
    };

    // Use the circuit breaker to make the request
    const response = await serviceInstance.circuitBreaker.fire(requestConfig);

    // Return the response from the shipper service
    return res.status(response.status).json(response.data);
  } catch (error) {
    // Handle errors from the shipper service
    logger.error('Error proxying request to shipper service', {
      userId: req.user?.sub,
      route: req.path,
      error: error.message
    });

    // If the error is from the circuit breaker
    if (error.name === 'CircuitBreakerError') {
      return res.status(503).json({
        code: 'SRV_SERVICE_UNAVAILABLE',
        message: 'Shipper service is currently unavailable',
        statusCode: 503
      });
    }

    // If the error has a response, forward the status and data from the service
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    // Otherwise, return a generic error
    return res.status(500).json({
      code: 'SRV_INTERNAL_ERROR',
      message: 'An error occurred while processing the request',
      statusCode: 500
    });
  }
}

// Configure the routes

/**
 * GET /shippers
 * Get a list of shippers with optional filtering
 */
router.get('/shippers', authenticate, requestValidator(), (req, res) => {
  proxyRequest(req, res, 'GET', '/shippers');
});

/**
 * GET /shippers/:shipperId
 * Get detailed information about a specific shipper
 */
router.get('/shippers/:shipperId', authenticate, requestValidator(), (req, res) => {
  proxyRequest(req, res, 'GET', `/shippers/${req.params.shipperId}`);
});

/**
 * POST /shippers
 * Create a new shipper
 */
router.post(
  '/shippers',
  authenticate,
  requireRole(['admin', 'shipper_admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(req, res, 'POST', '/shippers');
  }
);

/**
 * PUT /shippers/:shipperId
 * Update an existing shipper
 */
router.put(
  '/shippers/:shipperId',
  authenticate,
  requireRole(['admin', 'shipper_admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(req, res, 'PUT', `/shippers/${req.params.shipperId}`);
  }
);

/**
 * DELETE /shippers/:shipperId
 * Delete a shipper (soft delete)
 */
router.delete(
  '/shippers/:shipperId',
  authenticate,
  requireRole(['admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(req, res, 'DELETE', `/shippers/${req.params.shipperId}`);
  }
);

/**
 * GET /shippers/:shipperId/facilities
 * Get all facilities associated with a shipper
 */
router.get('/shippers/:shipperId/facilities', authenticate, requestValidator(), (req, res) => {
  proxyRequest(req, res, 'GET', `/shippers/${req.params.shipperId}/facilities`);
});

/**
 * POST /shippers/:shipperId/facilities
 * Create a new facility for a shipper
 */
router.post(
  '/shippers/:shipperId/facilities',
  authenticate,
  requireRole(['admin', 'shipper_admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(req, res, 'POST', `/shippers/${req.params.shipperId}/facilities`);
  }
);

/**
 * GET /shippers/:shipperId/facilities/:facilityId
 * Get detailed information about a specific facility
 */
router.get(
  '/shippers/:shipperId/facilities/:facilityId',
  authenticate,
  requestValidator(),
  (req, res) => {
    proxyRequest(
      req,
      res,
      'GET',
      `/shippers/${req.params.shipperId}/facilities/${req.params.facilityId}`
    );
  }
);

/**
 * PUT /shippers/:shipperId/facilities/:facilityId
 * Update an existing facility
 */
router.put(
  '/shippers/:shipperId/facilities/:facilityId',
  authenticate,
  requireRole(['admin', 'shipper_admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(
      req,
      res,
      'PUT',
      `/shippers/${req.params.shipperId}/facilities/${req.params.facilityId}`
    );
  }
);

/**
 * DELETE /shippers/:shipperId/facilities/:facilityId
 * Delete a facility (soft delete)
 */
router.delete(
  '/shippers/:shipperId/facilities/:facilityId',
  authenticate,
  requireRole(['admin', 'shipper_admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(
      req,
      res,
      'DELETE',
      `/shippers/${req.params.shipperId}/facilities/${req.params.facilityId}`
    );
  }
);

/**
 * GET /shippers/:shipperId/loads
 * Get all loads associated with a shipper
 */
router.get('/shippers/:shipperId/loads', authenticate, requestValidator(), (req, res) => {
  proxyRequest(req, res, 'GET', `/shippers/${req.params.shipperId}/loads`);
});

/**
 * GET /shippers/:shipperId/performance
 * Get performance metrics for a shipper
 */
router.get('/shippers/:shipperId/performance', authenticate, requestValidator(), (req, res) => {
  proxyRequest(req, res, 'GET', `/shippers/${req.params.shipperId}/performance`);
});

/**
 * GET /shippers/:shipperId/carrier-preferences
 * Get carrier preferences for a shipper
 */
router.get(
  '/shippers/:shipperId/carrier-preferences',
  authenticate,
  requestValidator(),
  (req, res) => {
    proxyRequest(req, res, 'GET', `/shippers/${req.params.shipperId}/carrier-preferences`);
  }
);

/**
 * POST /shippers/:shipperId/carrier-preferences
 * Create a new carrier preference for a shipper
 */
router.post(
  '/shippers/:shipperId/carrier-preferences',
  authenticate,
  requireRole(['admin', 'shipper_admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(req, res, 'POST', `/shippers/${req.params.shipperId}/carrier-preferences`);
  }
);

/**
 * PUT /shippers/:shipperId/carrier-preferences/:preferenceId
 * Update an existing carrier preference
 */
router.put(
  '/shippers/:shipperId/carrier-preferences/:preferenceId',
  authenticate,
  requireRole(['admin', 'shipper_admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(
      req,
      res,
      'PUT',
      `/shippers/${req.params.shipperId}/carrier-preferences/${req.params.preferenceId}`
    );
  }
);

/**
 * DELETE /shippers/:shipperId/carrier-preferences/:preferenceId
 * Delete a carrier preference
 */
router.delete(
  '/shippers/:shipperId/carrier-preferences/:preferenceId',
  authenticate,
  requireRole(['admin', 'shipper_admin']),
  requestValidator(),
  (req, res) => {
    proxyRequest(
      req,
      res,
      'DELETE',
      `/shippers/${req.params.shipperId}/carrier-preferences/${req.params.preferenceId}`
    );
  }
);

/**
 * GET /shippers/:shipperId/carrier-recommendations
 * Get carrier recommendations for a specific load based on optimization
 */
router.get(
  '/shippers/:shipperId/carrier-recommendations',
  authenticate,
  requireRole(['admin', 'shipper_admin', 'shipper_user']),
  requestValidator(),
  (req, res) => {
    proxyRequest(req, res, 'GET', `/shippers/${req.params.shipperId}/carrier-recommendations`);
  }
);

/**
 * GET /shippers/:shipperId/optimization-savings
 * Get optimization savings metrics for a shipper
 */
router.get(
  '/shippers/:shipperId/optimization-savings',
  authenticate,
  requestValidator(),
  (req, res) => {
    proxyRequest(req, res, 'GET', `/shippers/${req.params.shipperId}/optimization-savings`);
  }
);

/**
 * GET /shippers/search
 * Search for shippers based on various criteria
 */
router.get('/shippers/search', authenticate, requestValidator(), (req, res) => {
  proxyRequest(req, res, 'GET', '/shippers/search');
});

/**
 * GET /shippers/:shipperId/statistics
 * Get statistical information about a shipper's loads and carriers
 */
router.get('/shippers/:shipperId/statistics', authenticate, requestValidator(), (req, res) => {
  proxyRequest(req, res, 'GET', `/shippers/${req.params.shipperId}/statistics`);
});

export default router;