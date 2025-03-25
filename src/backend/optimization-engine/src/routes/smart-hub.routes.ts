import express, { Router } from 'express'; // express@^4.18.2
import { SmartHubController } from '../controllers/smart-hub.controller';
import { SmartHubService } from '../services/smart-hub.service';
import { validateRequest } from '../../../common/middleware/validation.middleware';
import { authMiddleware } from '../../../common/middleware/auth.middleware';
import { logger } from '../../../common/utils/logger';

/**
 * Initializes and configures the Smart Hub routes with the controller
 * @returns Configured Express router with Smart Hub routes
 */
const initializeSmartHubRoutes = (): Router => {
  // LD1: Create a new Express Router instance
  const router = express.Router();

  // LD1: Initialize the SmartHubService
  const smartHubService = new SmartHubService();

  // LD1: Initialize the SmartHubController with the service
  const smartHubController = new SmartHubController(smartHubService);

  // LD1: Define all route endpoints and map them to controller methods
  // LD1: Apply authentication and validation middleware to routes
  // LD1: Route for creating a new Smart Hub
  router.post(
    '/',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.createSmartHub(req, res, next) // Controller method
  );

  // LD1: Route for retrieving a Smart Hub by ID
  router.get(
    '/:hubId',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.getSmartHubById(req, res, next) // Controller method
  );

  // LD1: Route for searching Smart Hubs based on query parameters
  router.get(
    '/',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.getSmartHubs(req, res, next) // Controller method
  );

  // LD1: Route for updating a Smart Hub with new data
  router.put(
    '/:hubId',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.updateSmartHub(req, res, next) // Controller method
  );

  // LD1: Route for marking a Smart Hub as inactive (soft delete)
  router.delete(
    '/:hubId',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.deleteSmartHub(req, res, next) // Controller method
  );

  // LD1: Route for finding Smart Hubs near a specified location
  router.get(
    '/nearby',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.findNearbyHubs(req, res, next) // Controller method
  );

  // LD1: Route for finding optimal Smart Hubs for load exchanges between two drivers
  router.post(
    '/exchange/optimal',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.findOptimalExchangePoints(req, res, next) // Controller method
  );

  // LD1: Route for retrieving analytics data for a Smart Hub or all Smart Hubs
  router.get(
    '/analytics',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.getSmartHubAnalytics(req, res, next) // Controller method
  );

  // LD1: Route for updating the efficiency score of a Smart Hub
  router.put(
    '/:hubId/efficiency',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.updateHubEfficiencyScore(req, res, next) // Controller method
  );

  // LD1: Route for identifying potential locations for new Smart Hubs
  router.post(
    '/opportunities',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.identifyNewHubOpportunities(req, res, next) // Controller method
  );

  // LD1: Route for calculating the network coverage of existing Smart Hubs
  router.get(
    '/coverage',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.calculateNetworkCoverage(req, res, next) // Controller method
  );

  // LD1: Route for recording a usage event for a Smart Hub
  router.post(
    '/:hubId/usage',
    authMiddleware, // Authentication middleware
    (req, res, next) => smartHubController.updateHubUsage(req, res, next) // Controller method
  );

  // LD1: Log route initialization
  logger.info('Smart Hub routes initialized');

  // LD1: Return the configured router
  return router;
};

// IE3: Be generous about your exports so long as it doesn't create a security risk.
export { initializeSmartHubRoutes };

// LD1: Export the router initialization function as default
export default initializeSmartHubRoutes;