import { Router } from 'express'; // express@^4.17.1
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { HotspotController } from '../controllers/hotspot.controller';

const router = Router();

/**
 * Express router for hotspot-related endpoints in the market intelligence service.
 * Defines routes for creating, retrieving, updating, and managing hotspots, which represent geographic areas with significant market imbalances or opportunities such as high demand, supply shortages, or favorable rates.
 * These hotspots are used to create dynamic bonus zones and provide predictive load surge alerts.
 */

// Route to create a new hotspot
router.post(
  '/',
  authenticate,
  validateBody(HotspotController.getValidationSchemas().createHotspot.body),
  HotspotController.createHotspot
);

// Route to get a specific hotspot by ID
router.get(
  '/:hotspotId',
  authenticate,
  validateParams(HotspotController.getValidationSchemas().getHotspotById.params),
  HotspotController.getHotspotById
);

// Route to update an existing hotspot
router.put(
  '/:hotspotId',
  authenticate,
  validateParams(HotspotController.getValidationSchemas().updateHotspot.params),
  validateBody(HotspotController.getValidationSchemas().updateHotspot.body),
  HotspotController.updateHotspot
);

// Route to delete a hotspot
router.delete(
  '/:hotspotId',
  authenticate,
  validateParams(HotspotController.getValidationSchemas().deleteHotspot.params),
  HotspotController.deleteHotspot
);

// Route to deactivate a hotspot without deleting it
router.put(
  '/:hotspotId/deactivate',
  authenticate,
  validateParams(HotspotController.getValidationSchemas().deactivateHotspot.params),
  HotspotController.deactivateHotspot
);

// Route to query hotspots based on various parameters
router.get(
  '/query',
  authenticate,
  validateQuery(HotspotController.getValidationSchemas().queryHotspots.query),
  HotspotController.queryHotspots
);

// Route to get all currently active hotspots
router.get(
  '/active',
  authenticate,
  HotspotController.getActiveHotspots
);

// Route to get hotspots of a specific type
router.get(
  '/by-type',
  authenticate,
  validateQuery(HotspotController.getValidationSchemas().getHotspotsByType.query),
  HotspotController.getHotspotsByType
);

// Route to get hotspots of a specific severity level
router.get(
  '/by-severity',
  authenticate,
  validateQuery(HotspotController.getValidationSchemas().getHotspotsBySeverity.query),
  HotspotController.getHotspotsBySeverity
);

// Route to get hotspots in a specific region
router.get(
  '/by-region',
  authenticate,
  validateQuery(HotspotController.getValidationSchemas().getHotspotsByRegion.query),
  HotspotController.getHotspotsByRegion
);

// Route to get hotspots for a specific equipment type
router.get(
  '/by-equipment',
  authenticate,
  validateQuery(HotspotController.getValidationSchemas().getHotspotsByEquipmentType.query),
  HotspotController.getHotspotsByEquipmentType
);

// Route to get hotspots near a specific location
router.get(
  '/near-location',
  authenticate,
  validateQuery(HotspotController.getValidationSchemas().getHotspotsNearLocation.query),
  HotspotController.getHotspotsNearLocation
);

// Route to detect and create new hotspots based on market conditions
router.post(
  '/detect',
  authenticate,
  validateBody(HotspotController.getValidationSchemas().detectAndCreateHotspots.body),
  HotspotController.detectAndCreateHotspots
);

// Route to evaluate the accuracy of past hotspot detections
router.get(
  '/evaluate-accuracy',
  authenticate,
  validateQuery(HotspotController.getValidationSchemas().evaluateHotspotAccuracy.query),
  HotspotController.evaluateHotspotAccuracy
);

// Route to deactivate hotspots that have passed their valid_until date
router.post(
  '/cleanup-expired',
  authenticate,
  HotspotController.cleanupExpiredHotspots
);

export default router;