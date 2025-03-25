import { Router } from 'express'; // express@^4.18.2
import { GeofenceController } from '../controllers/geofence.controller';
import { GeofenceService } from '../services/geofence.service';
import logger from '../../common/utils/logger';
import { Redis } from 'redis'; // ^4.6.7

/**
 * Initializes and configures the geofence routes
 * @returns Configured Express router with geofence routes
 */
function initializeGeofenceRoutes(): Router {
  // 1. Create a new GeofenceService instance
  const geofenceService = new GeofenceService({} as Redis, {} as any); // TODO: Fix this

  // 2. Create a new GeofenceController instance with the GeofenceService
  const geofenceController = new GeofenceController(geofenceService);

  // 3. Log the initialization of geofence routes
  logger.info('Initializing geofence routes');

  // 4. Return the router from the GeofenceController
  return geofenceController.router;
}

// Export the configured Express router with all geofence routes
export default initializeGeofenceRoutes();