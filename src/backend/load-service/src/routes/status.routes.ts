import express from 'express'; // version: ^4.18.2
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateParams, validateBody } from '../../../common/middleware/validation.middleware';
import { StatusController } from '../controllers/status.controller';
import { LoadStatusService } from '../services/load-status.service';
import LoadEventsProducer from '../producers/load-events.producer';

/**
 * Creates and configures the Express router for load status-related endpoints
 * @returns Configured Express router with status routes
 */
function createStatusRouter(): express.Router {
  // 1. Create a new Express router instance
  const router = express.Router();

  // 2. Initialize the LoadEventsProducer for publishing status change events
  const eventsProducer = new LoadEventsProducer();

  // 3. Initialize the LoadStatusService with the events producer
  const statusService = new LoadStatusService(eventsProducer);

  // 4. Initialize the StatusController with the status service
  const statusController = new StatusController(statusService);

  // 5. Define routes for status operations with appropriate middleware
  // 6. Configure route for retrieving status history for a load
  router.get(
    '/:loadId/history',
    authenticate,
    validateParams(statusController.getLoadIdValidationSchema()),
    statusController.getStatusHistory
  );

  // 7. Configure route for retrieving status timeline for a load
  router.get(
    '/:loadId/timeline',
    authenticate,
    validateParams(statusController.getLoadIdValidationSchema()),
    statusController.getStatusTimeline
  );

  // 8. Configure route for retrieving current status of a load
  router.get(
    '/:loadId/current',
    authenticate,
    validateParams(statusController.getLoadIdValidationSchema()),
    statusController.getCurrentStatus
  );

  // 9. Configure route for updating the status of a load
  router.put(
    '/:loadId',
    authenticate,
    validateParams(statusController.getLoadIdValidationSchema()),
    validateBody(statusController.getStatusValidationSchema()),
    statusController.updateStatus
  );

  // 10. Configure route for getting counts of loads by status
  router.get(
    '/counts',
    authenticate,
    statusController.getStatusCounts
  );

  // 11. Configure route for getting status transition rules
  router.get(
    '/transition-rules',
    authenticate,
    statusController.getStatusTransitionRules
  );

  // 12. Return the configured router
  return router;
}

// Export the configured status router for use in the application
export default createStatusRouter();