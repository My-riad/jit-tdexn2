import { Request, Response, NextFunction } from 'express'; // express@^4.17.1
import { TmsService } from '../services/tms.service';
import {
  TmsConnectionCreationParams,
  TmsConnectionUpdateParams,
  TmsSyncRequest,
  Load,
  LoadStatus,
} from '../models/tms-connection.model';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

/**
 * Controller responsible for handling HTTP requests related to Transportation Management System (TMS) integrations.
 * It provides endpoints for creating, retrieving, updating, and deleting TMS connections, as well as synchronizing data
 * between the platform and external TMS systems. This controller acts as an intermediary between the Express routes
 * and the TMS service layer.
 */
export class TmsController {
  /**
   * Initializes the TMS controller with a TMS service instance
   * @param tmsService - The TMS service instance
   */
  constructor(private tmsService: TmsService) {
    this.tmsService = tmsService;
    logger.info('TmsController initialized');
  }

  /**
   * Creates a new TMS connection
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async createConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract TMS connection creation parameters from request body
      const params: TmsConnectionCreationParams = req.body;

      // LD1: Validate required parameters
      if (!params.owner_type || !params.owner_id || !params.provider_type || !params.integration_type || !params.name || !params.credentials || !params.settings) {
        throw new AppError('Missing required parameters for TMS connection creation', { code: 'VAL_INVALID_INPUT' });
      }

      // LD1: Call tmsService.createConnection with the parameters
      const connection = await this.tmsService.createConnection(params);

      // LD1: Return 201 status with the created connection response
      res.status(201).json(connection);
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves a TMS connection by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async getConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract connection ID from request parameters
      const { connectionId } = req.params;

      // LD1: Call tmsService.getConnection with the connection ID
      const connection = await this.tmsService.getConnection(connectionId);

      // LD1: Return 200 status with the connection details
      res.status(200).json(connection);
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Lists all TMS connections for a specific owner
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async listConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract owner type and owner ID from request query parameters
      const { ownerType, ownerId } = req.query;

      // LD1: Validate required parameters
      if (!ownerType || !ownerId) {
        throw new AppError('Missing required parameters: ownerType and ownerId', { code: 'VAL_INVALID_INPUT' });
      }

      // LD1: Call tmsService.listConnections with owner type and ID
      const connections = await this.tmsService.listConnections(ownerType as string, ownerId as string);

      // LD1: Return 200 status with the list of connections
      res.status(200).json(connections);
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Updates an existing TMS connection
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async updateConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract connection ID from request parameters
      const { connectionId } = req.params;

      // LD1: Extract update parameters from request body
      const params: TmsConnectionUpdateParams = req.body;

      // LD1: Call tmsService.updateConnection with the connection ID and update parameters
      const connection = await this.tmsService.updateConnection(connectionId, params);

      // LD1: Return 200 status with the updated connection
      res.status(200).json(connection);
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Deletes a TMS connection
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async deleteConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract connection ID from request parameters
      const { connectionId } = req.params;

      // LD1: Call tmsService.deleteConnection with the connection ID
      await this.tmsService.deleteConnection(connectionId);

      // LD1: Return 204 status with no content on successful deletion
      res.status(204).send();
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Tests a TMS connection to verify credentials and connectivity
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract connection ID from request parameters
      const { connectionId } = req.params;

      // LD1: Call tmsService.testConnection with the connection ID
      const testResult = await this.tmsService.testConnection(connectionId);

      // LD1: Return 200 status with the test result
      res.status(200).json({ success: testResult });
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Synchronizes data between the platform and the TMS
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async syncTmsData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract sync request parameters from request body
      const syncRequest: TmsSyncRequest = req.body;

      // LD1: Validate required parameters
      if (!syncRequest.connection_id) {
        throw new AppError('Missing required parameter: connection_id', { code: 'VAL_INVALID_INPUT' });
      }

      // LD1: Call tmsService.syncData with the sync request
      const syncResult = await this.tmsService.syncData(syncRequest);

      // LD1: Return 200 status with the synchronization results
      res.status(200).json(syncResult);
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Pushes a load from the platform to the TMS
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async pushLoadToTms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract connection ID from request parameters
      const { connectionId } = req.params;

      // LD1: Extract load data from request body
      const load: Load = req.body;

      // LD1: Call tmsService.pushLoad with the connection ID and load data
      const pushResult = await this.tmsService.pushLoad(connectionId, load);

      // LD1: Return 200 status with the push result
      res.status(200).json({ success: pushResult });
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Updates the status of a load in the TMS
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void> - No direct return, sends HTTP response
   */
  async updateLoadStatusInTms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract connection ID and load ID from request parameters
      const { connectionId, loadId } = req.params;

      // LD1: Extract load status from request body
      const { status } = req.body;

      // LD1: Call tmsService.updateLoadStatus with the connection ID, load ID, and status
      const updateResult = await this.tmsService.updateLoadStatus(connectionId, loadId, status);

      // LD1: Return 200 status with the update result
      res.status(200).json({ success: updateResult });
    } catch (error) {
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  }
}