import express, { Router } from 'express'; // express@4.18.2
import authRoutes from './auth.routes';
import driverRoutes from './driver.routes';
import carrierRoutes from './carrier.routes';
import loadRoutes from './load.routes';
import shipperRoutes from './shipper.routes';
import trackingRoutes from './tracking.routes';
import gamificationRoutes from './gamification.routes';
import { router as marketRoutes } from './market.routes';
import logger from '../../../common/utils/logger';

// Create a new Express router instance
const router = express.Router();

/**
 * Initializes and configures all route handlers for the API Gateway
 * 
 * @returns Configured Express router with all API routes
 */
function initializeRoutes(): Router {
  // Create a new Express router instance
  logger.info('Initializing API Gateway routes...');

  // Register authentication routes under /auth prefix
  router.use('/auth', authRoutes);

  // Register driver routes under /drivers prefix
  router.use('/drivers', driverRoutes);

  // Register carrier routes under /carriers prefix
  router.use('/carriers', carrierRoutes);

  // Register load routes under /loads prefix
  router.use('/loads', loadRoutes);

  // Register shipper routes under /shippers prefix
  router.use('/shippers', shipperRoutes);

  // Register tracking routes under /tracking prefix
  router.use('/tracking', trackingRoutes);

  // Register gamification routes under /gamification prefix
  router.use('/gamification', gamificationRoutes);

  // Register market intelligence routes under /market prefix
  router.use('/market', marketRoutes);

  // Return the configured router with all routes registered
  logger.info('API Gateway routes initialized successfully');
  return router;
}

// Export the configured router with all API routes for use in the main application
export default initializeRoutes();