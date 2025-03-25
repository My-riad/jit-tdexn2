# src/backend/load-service/src/controllers/load.controller.ts
```typescript
import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { LoadService } from '../services/load.service';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { createLoadSchema, updateLoadSchema, loadIdSchema, loadSearchSchema } from '../validators/load.validator';
import { createError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';
import { LoadCreationParams, LoadUpdateParams, LoadSearchParams } from '../../../common/interfaces/load.interface';

/**
 * Controller responsible for handling HTTP requests related to load management in the AI-driven Freight Optimization Platform.
 * It provides endpoints for creating, retrieving, updating, and deleting loads, as well as searching for loads based on various criteria.
 * This controller acts as the interface between the API layer and the load service business logic.
 */

/**
 * Retrieves a load by its ID
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Sends load data or error response
 */
export const getLoadById = [
  validateParams(loadIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract loadId from request parameters
      const { loadId } = req.params;

      // LD1: Call loadService.getLoadById(loadId) to retrieve the load
      const loadService = new LoadService();
      const load = await loadService.getLoadById(loadId);

      // LD1: If load is found, return it with 200 OK status
      if (load) {
        logger.info(`Load with ID ${loadId} retrieved successfully`);
        res.status(StatusCodes.OK).json(load);
      } else {
        // LD1: If load is not found, create a NOT_FOUND error and pass to next()
        logger.warn(`Load with ID ${loadId} not found`);
        next(createError('Load not found', ErrorCodes.LOAD_NOT_FOUND, StatusCodes.NOT_FOUND));
      }
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error retrieving load by ID', { error });
      next(error);
    }
  }
];

/**
 * Retrieves a load with all its related details (locations, status history, documents)
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Sends load data with details or error response
 */
export const getLoadWithDetails = [
  validateParams(loadIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract loadId from request parameters
      const { loadId } = req.params;

      // LD1: Call loadService.getLoadWithDetails(loadId) to retrieve the load with all related details
      const loadService = new LoadService();
      const load = await loadService.getLoadWithDetails(loadId);

      // LD1: If load is found, return it with 200 OK status
      if (load) {
        logger.info(`Load with details for ID ${loadId} retrieved successfully`);
        res.status(StatusCodes.OK).json(load);
      } else {
        // LD1: If load is not found, create a NOT_FOUND error and pass to next()
        logger.warn(`Load with details for ID ${loadId} not found`);
        next(createError('Load not found', ErrorCodes.LOAD_NOT_FOUND, StatusCodes.NOT_FOUND));
      }
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error retrieving load with details', { error });
      next(error);
    }
  }
];

/**
 * Retrieves all loads for a specific shipper with pagination
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Sends paginated loads and total count or error response
 */
export const getLoadsByShipperId = [
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract shipperId from request parameters
      const { shipperId } = req.params;

      // LD1: Extract pagination options from query parameters (page, limit, sortBy, sortDirection)
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortDirection = req.query.sortDirection as string | undefined;

      // LD1: Call loadService.getLoadsByShipperId(shipperId, options) to retrieve loads
      const loadService = new LoadService();
      const { loads, total } = await loadService.getLoadsByShipperId(shipperId, { page, limit, sortBy, sortDirection });

      // LD1: Return the loads array and total count with 200 OK status
      logger.info(`Retrieved ${loads.length} loads for shipper ID ${shipperId}`);
      res.status(StatusCodes.OK).json({ loads, total });
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error retrieving loads by shipper ID', { error });
      next(error);
    }
  }
];

/**
 * Searches for loads based on various criteria with pagination
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Sends matching loads and total count or error response
 */
export const searchLoads = [
  validateQuery(loadSearchSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract search parameters from query parameters
      const searchParams: LoadSearchParams = req.query as any;

      // LD1: Call loadService.searchLoads(searchParams) to find matching loads
      const loadService = new LoadService();
      const { loads, total } = await loadService.searchLoads(searchParams);

      // LD1: Return the matching loads array and total count with 200 OK status
      logger.info(`Found ${loads.length} loads matching search criteria`);
      res.status(StatusCodes.OK).json({ loads, total });
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error searching loads', { error });
      next(error);
    }
  }
];

/**
 * Creates a new load with associated locations
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Sends created load data or error response
 */
export const createLoad = [
  validateBody(createLoadSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract load creation data from request body
      const loadData: LoadCreationParams = req.body;

      // LD1: Call loadService.createLoad(loadData) to create the load
      const loadService = new LoadService();
      const createdLoad = await loadService.createLoad(loadData);

      // LD1: Return the created load with 201 CREATED status
      logger.info(`Created new load with ID ${createdLoad.load_id}`);
      res.status(StatusCodes.CREATED).json(createdLoad);
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error creating load', { error });
      next(error);
    }
  }
];

/**
 * Updates an existing load
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Sends updated load data or error response
 */
export const updateLoad = [
  validateParams(loadIdSchema),
  validateBody(updateLoadSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract loadId from request parameters
      const { loadId } = req.params;

      // LD1: Extract load update data from request body
      const loadData: LoadUpdateParams = req.body;

      // LD1: Call loadService.updateLoad(loadId, loadData) to update the load
      const loadService = new LoadService();
      const updatedLoad = await loadService.updateLoad(loadId, loadData);

      // LD1: If load is found and updated, return it with 200 OK status
      if (updatedLoad) {
        logger.info(`Updated load with ID ${loadId}`);
        res.status(StatusCodes.OK).json(updatedLoad);
      } else {
        // LD1: If load is not found, create a NOT_FOUND error and pass to next()
        logger.warn(`Load with ID ${loadId} not found for update`);
        next(createError('Load not found', ErrorCodes.LOAD_NOT_FOUND, StatusCodes.NOT_FOUND));
      }
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error updating load', { error });
      next(error);
    }
  }
];

/**
 * Deletes a load and all associated data
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 */
export const deleteLoad = [
  validateParams(loadIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract loadId from request parameters
      const { loadId } = req.params;

      // LD1: Call loadService.deleteLoad(loadId) to delete the load
      const loadService = new LoadService();
      const deleted = await loadService.deleteLoad(loadId);

      // LD1: If load is deleted successfully, return success message with 200 OK status
      if (deleted) {
        logger.info(`Deleted load with ID ${loadId}`);
        res.status(StatusCodes.OK).json({ message: 'Load deleted successfully' });
      } else {
        // LD1: If load is not found, create a NOT_FOUND error and pass to next()
        logger.warn(`Load with ID ${loadId} not found for deletion`);
        next(createError('Load not found', ErrorCodes.LOAD_NOT_FOUND, StatusCodes.NOT_FOUND));
      }
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error deleting load', { error });
      next(error);
    }
  }
];

/**
 * Gets counts of loads by status
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 */
export const getLoadStatusCounts = [
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract filter options from query parameters (shipperId)
      const shipperId = req.query.shipperId as string | undefined;

      // LD1: Call loadService.getLoadStatusCounts(shipperId) to get status counts
      const loadService = new LoadService();
      const statusCounts = await loadService.getLoadStatusCounts(shipperId);

      // LD1: Return the object with status types as keys and counts as values with 200 OK status
      logger.info('Retrieved load status counts');
      res.status(StatusCodes.OK).json(statusCounts);
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error getting load status counts', { error });
      next(error);
    }
  }
];

/**
 * Gets all locations associated with a load
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 */
export const getLoadLocations = [
  validateParams(loadIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract loadId from request parameters
      const { loadId } = req.params;

      // LD1: Call loadService.getLoadLocations(loadId) to retrieve locations
      const loadService = new LoadService();
      const locations = await loadService.getLoadLocations(loadId);

      // LD1: Return the array of load locations with 200 OK status
      logger.info(`Retrieved locations for load ID ${loadId}`);
      res.status(StatusCodes.OK).json(locations);
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error getting load locations', { error });
      next(error);
    }
  }
];

/**
 * Gets all documents associated with a load
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 */
export const getLoadDocuments = [
  validateParams(loadIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // LD1: Extract loadId from request parameters
      const { loadId } = req.params;

      // LD1: Call loadService.getLoadDocuments(loadId) to retrieve documents
      const loadService = new LoadService();
      const documents = await loadService.getLoadDocuments(loadId);

      // LD1: Return the array of load documents with 200 OK status
      logger.info(`Retrieved documents for load ID ${loadId}`);
      res.status(StatusCodes.OK).json(documents);
    } catch (error) {
      // LD1: Catch any errors and pass to next() for error handling middleware
      logger.error('Error getting load documents', { error });
      next(error);
    }
  }
];