import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { HotspotService } from '../services/hotspot.service';
import { HotspotType, HotspotSeverity, HotspotCreationParams, HotspotUpdateParams, HotspotQueryParams } from '../models/hotspot.model';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';

// Initialize HotspotService instance
const hotspotService = new HotspotService();

/**
 * Creates a new hotspot in the system
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const createHotspot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract hotspot creation parameters from request body
    const params: HotspotCreationParams = req.body;

    // Call hotspotService.createHotspot with the parameters
    const newHotspot = await hotspotService.createHotspot(params);

    // Log the creation of the new hotspot
    logger.info('Hotspot created', { hotspotId: newHotspot.hotspot_id });

    // Return HTTP 201 Created response with the created hotspot
    res.status(StatusCodes.CREATED).json(newHotspot);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Retrieves a specific hotspot by ID
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const getHotspotById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract hotspot ID from request parameters
    const hotspotId: string = req.params.id;

    // Call hotspotService.getHotspotById with the ID
    const hotspot = await hotspotService.getHotspotById(hotspotId);

    // If hotspot not found, throw NOT_FOUND error
    if (!hotspot) {
      throw new AppError(`Hotspot with ID ${hotspotId} not found`, { code: ErrorCodes.RES_NOT_FOUND });
    }

    // Return HTTP 200 OK response with the hotspot data
    res.status(StatusCodes.OK).json(hotspot);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Updates an existing hotspot
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const updateHotspot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract hotspot ID from request parameters
    const hotspotId: string = req.params.id;

    // Extract update parameters from request body
    const params: HotspotUpdateParams = req.body;

    // Call hotspotService.updateHotspot with ID and parameters
    const updatedHotspot = await hotspotService.updateHotspot(hotspotId, params);

    // If hotspot not found, throw NOT_FOUND error
    if (!updatedHotspot) {
      throw new AppError(`Hotspot with ID ${hotspotId} not found`, { code: ErrorCodes.RES_NOT_FOUND });
    }

    // Log the update operation
    logger.info('Hotspot updated', { hotspotId });

    // Return HTTP 200 OK response with the updated hotspot
    res.status(StatusCodes.OK).json(updatedHotspot);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Deletes a hotspot from the system
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const deleteHotspot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract hotspot ID from request parameters
    const hotspotId: string = req.params.id;

    // Call hotspotService.deleteHotspot with the ID
    const deleted = await hotspotService.deleteHotspot(hotspotId);

    // If hotspot not found, throw NOT_FOUND error
    if (!deleted) {
      throw new AppError(`Hotspot with ID ${hotspotId} not found`, { code: ErrorCodes.RES_NOT_FOUND });
    }

    // Log the deletion operation
    logger.info('Hotspot deleted', { hotspotId });

    // Return HTTP 204 No Content response
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Deactivates a hotspot without deleting it
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const deactivateHotspot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract hotspot ID from request parameters
    const hotspotId: string = req.params.id;

    // Call hotspotService.deactivateHotspot with the ID
    const deactivatedHotspot = await hotspotService.deactivateHotspot(hotspotId);

    // If hotspot not found, throw NOT_FOUND error
    if (!deactivatedHotspot) {
      throw new AppError(`Hotspot with ID ${hotspotId} not found`, { code: ErrorCodes.RES_NOT_FOUND });
    }

    // Log the deactivation operation
    logger.info('Hotspot deactivated', { hotspotId });

    // Return HTTP 200 OK response with the deactivated hotspot
    res.status(StatusCodes.OK).json(deactivatedHotspot);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Queries hotspots based on various parameters
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const queryHotspots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract query parameters from request query
    const params: HotspotQueryParams = req.query as any;

    // Call hotspotService.queryHotspots with the parameters
    const hotspots = await hotspotService.queryHotspots(params);

    // Return HTTP 200 OK response with the matching hotspots
    res.status(StatusCodes.OK).json(hotspots);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Retrieves all currently active hotspots
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const getActiveHotspots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Call hotspotService.getActiveHotspots
    const activeHotspots = await hotspotService.getActiveHotspots();

    // Return HTTP 200 OK response with the active hotspots
    res.status(StatusCodes.OK).json(activeHotspots);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Retrieves hotspots of a specific type
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const getHotspotsByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract type and activeOnly flag from request query
    const type: HotspotType = req.query.type as HotspotType;
    const activeOnly: boolean = req.query.activeOnly === 'true';

    // Call hotspotService.getHotspotsByType with the parameters
    const hotspots = await hotspotService.getHotspotsByType(type, activeOnly);

    // Return HTTP 200 OK response with the matching hotspots
    res.status(StatusCodes.OK).json(hotspots);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Retrieves hotspots of a specific severity level
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const getHotspotsBySeverity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract severity and activeOnly flag from request query
    const severity: HotspotSeverity = req.query.severity as HotspotSeverity;
    const activeOnly: boolean = req.query.activeOnly === 'true';

    // Call hotspotService.getHotspotsBySeverity with the parameters
    const hotspots = await hotspotService.getHotspotsBySeverity(severity, activeOnly);

    // Return HTTP 200 OK response with the matching hotspots
    res.status(StatusCodes.OK).json(hotspots);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Retrieves hotspots in a specific region
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const getHotspotsByRegion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract region and activeOnly flag from request query
    const region: string = req.query.region as string;
    const activeOnly: boolean = req.query.activeOnly === 'true';

    // Call hotspotService.getHotspotsByRegion with the parameters
    const hotspots = await hotspotService.getHotspotsByRegion(region, activeOnly);

    // Return HTTP 200 OK response with the matching hotspots
    res.status(StatusCodes.OK).json(hotspots);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Retrieves hotspots for a specific equipment type
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const getHotspotsByEquipmentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract equipmentType and activeOnly flag from request query
    const equipmentType: string = req.query.equipmentType as string;
    const activeOnly: boolean = req.query.activeOnly === 'true';

    // Call hotspotService.getHotspotsByEquipmentType with the parameters
    const hotspots = await hotspotService.getHotspotsByEquipmentType(equipmentType, activeOnly);

    // Return HTTP 200 OK response with the matching hotspots
    res.status(StatusCodes.OK).json(hotspots);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Retrieves hotspots near a specific location
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const getHotspotsNearLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract latitude, longitude, radius, and activeOnly flag from request query
    const latitude: number = parseFloat(req.query.latitude as string);
    const longitude: number = parseFloat(req.query.longitude as string);
    const radius: number = parseFloat(req.query.radius as string);
    const activeOnly: boolean = req.query.activeOnly === 'true';

    // Validate latitude and longitude parameters
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new AppError('Invalid latitude or longitude', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Call hotspotService.getHotspotsNearLocation with the parameters
    const hotspots = await hotspotService.getHotspotsNearLocation(latitude, longitude, radius, activeOnly);

    // Return HTTP 200 OK response with the nearby hotspots
    res.status(StatusCodes.OK).json(hotspots);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Detects and creates new hotspots based on market conditions
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const detectAndCreateHotspots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract detection options from request body
    const options: any = req.body;

    // Call hotspotService.detectAndCreateHotspots with the options
    const newHotspots = await hotspotService.detectAndCreateHotspots(options);

    // Log the hotspot detection results
    logger.info(`Detected and created ${newHotspots.length} hotspots`);

    // Return HTTP 200 OK response with the newly created hotspots
    res.status(StatusCodes.OK).json(newHotspots);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Evaluates the accuracy of past hotspot detections
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const evaluateHotspotAccuracy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract start date and end date from request query
    const startDate: Date = new Date(req.query.startDate as string);
    const endDate: Date = new Date(req.query.endDate as string);

    // Parse dates to Date objects
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('Invalid start or end date', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Call hotspotService.evaluateHotspotAccuracy with the date range
    const accuracyMetrics = await hotspotService.evaluateHotspotAccuracy(startDate, endDate);

    // Return HTTP 200 OK response with the accuracy metrics
    res.status(StatusCodes.OK).json(accuracyMetrics);
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};

/**
 * Deactivates hotspots that have passed their valid_until date
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void>
 */
export const cleanupExpiredHotspots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Call hotspotService.cleanupExpiredHotspots
    const deactivatedCount = await hotspotService.cleanupExpiredHotspots();

    // Log the number of deactivated hotspots
    logger.info(`Deactivated ${deactivatedCount} expired hotspots`);

    // Return HTTP 200 OK response with the count of deactivated hotspots
    res.status(StatusCodes.OK).json({ deactivatedCount });
  } catch (error) {
    // Catch and handle any errors with the next function
    next(error);
  }
};