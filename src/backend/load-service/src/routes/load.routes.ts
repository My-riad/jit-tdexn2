import { Router } from 'express'; // express@^4.18.2
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateParams, validateBody, validateQuery } from '../../../common/middleware/validation.middleware';
import { getLoadById, getLoadWithDetails, getLoadsByShipperId, searchLoads, createLoad, updateLoad, deleteLoad, getLoadStatusCounts, getLoadLocations, getLoadDocuments } from '../controllers/load.controller';
import { createLoadSchema, updateLoadSchema, loadIdSchema, loadSearchSchema } from '../validators/load.validator';

/**
 * Creates and configures the Express router for load-related endpoints
 * @returns Configured Express router with load routes
 */
function createLoadRouter(): Router {
  // 1. Create a new Express router instance
  const router = Router();

  // 2. Define routes for load operations with appropriate middleware
  // 2.1 Configure route for searching loads with criteria
  router.get('/', authenticate, validateQuery(loadSearchSchema), searchLoads);

  // 2.2 Configure route for retrieving a load by ID
  router.get('/:loadId', authenticate, validateParams(loadIdSchema), getLoadById);

  // 2.3 Configure route for retrieving a load with all details
  router.get('/:loadId/details', authenticate, validateParams(loadIdSchema), getLoadWithDetails);

  // 2.4 Configure route for retrieving loads by shipper ID
  router.get('/shipper/:shipperId', authenticate, getLoadsByShipperId);

  // 2.5 Configure route for creating a new load
  router.post('/', authenticate, validateBody(createLoadSchema), createLoad);

  // 2.6 Configure route for updating an existing load
  router.put('/:loadId', authenticate, validateParams(loadIdSchema), validateBody(updateLoadSchema), updateLoad);

  // 2.7 Configure route for deleting a load
  router.delete('/:loadId', authenticate, validateParams(loadIdSchema), deleteLoad);

  // 2.8 Configure route for getting load status counts
  router.get('/status/counts', authenticate, getLoadStatusCounts);

  // 2.9 Configure route for getting load locations
  router.get('/:loadId/locations', authenticate, validateParams(loadIdSchema), getLoadLocations);

  // 2.10 Configure route for getting load documents
  router.get('/:loadId/documents', authenticate, validateParams(loadIdSchema), getLoadDocuments);

  // 3. Return the configured router
  return router;
}

// Export the configured load router for use in the application
export default createLoadRouter();