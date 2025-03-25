import { Router } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2
import { MappingController } from '../controllers/mapping.controller';
import { MappingService } from '../services/mapping.service';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { geocodeSchema, reverseGeocodeSchema, directionsSchema, distanceMatrixSchema, validateAddressSchema, travelTimeSchema, waypointOptimizationSchema, truckRouteSchema, isochroneSchema } from '../controllers/mapping.controller';
import logger from '../../../common/utils/logger';

/**
 * Initializes the mapping routes with the controller instance
 * @param mappingController 
 * @returns Configured Express router with mapping routes
 */
const initializeRoutes = (mappingController: MappingController): Router => {
  // Create a new Express router instance
  const router = Router();

  // Register geocoding routes (geocode, reverseGeocode)
  router.post('/geocode', authenticate, validateBody(geocodeSchema), mappingController.geocode.bind(mappingController));
  router.post('/reverse-geocode', authenticate, validateBody(reverseGeocodeSchema), mappingController.reverseGeocode.bind(mappingController));

  // Register routing routes (getDirections, getDistanceMatrix)
  router.post('/directions', authenticate, validateBody(directionsSchema), mappingController.getDirections.bind(mappingController));
  router.post('/distance-matrix', authenticate, validateBody(distanceMatrixSchema), mappingController.getDistanceMatrix.bind(mappingController));

  // Register address validation route (validateAddress)
  router.post('/validate-address', authenticate, validateBody(validateAddressSchema), mappingController.validateAddress.bind(mappingController));

  // Register travel time estimation route (estimateTravelTime)
  router.post('/travel-time', authenticate, validateBody(travelTimeSchema), mappingController.estimateTravelTime.bind(mappingController));

  // Register waypoint optimization route (optimizeWaypoints)
  router.post('/optimize-waypoints', authenticate, validateBody(waypointOptimizationSchema), mappingController.optimizeWaypoints.bind(mappingController));

  // Register truck-friendly routing route (findTruckFriendlyRoute)
  router.post('/truck-route', authenticate, validateBody(truckRouteSchema), mappingController.findTruckFriendlyRoute.bind(mappingController));

  // Register isochrone generation route (getIsochrone)
  router.post('/isochrone', authenticate, validateBody(isochroneSchema), mappingController.getIsochrone.bind(mappingController));

  // Register provider information route (getProviderInfo)
  router.get('/providers', authenticate, mappingController.getProviderInfo.bind(mappingController));

  // Log successful route initialization
  logger.info('Mapping routes initialized');

  // Return the configured router
  return router;
};

// Export the function that initializes and returns Express router with configured mapping routes
export default initializeRoutes;