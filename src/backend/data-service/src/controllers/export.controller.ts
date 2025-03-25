import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import fs from 'fs'; // fs@N/A
import path from 'path'; // path@N/A
import { ExportService } from '../services/export.service'; // src/backend/data-service/src/services/export.service.ts
import { IDataExport, ExportFormat, ExportStatus } from '../models/data-export.model'; // src/backend/data-service/src/models/data-export.model.ts
import logger from '../../../common/utils/logger'; // src/backend/common/utils/logger.ts
import { AppError } from '../../../common/utils/error-handler'; // src/backend/common/utils/error-handler.ts
import { getMimeTypeForFormat } from '../utils/export.utils'; // src/backend/data-service/src/utils/export.utils.ts
import mime from 'mime-types'; // mime-types@^2.1.35

/**
 * Validates the export request body to ensure it has all required properties
 * @param exportConfig The export configuration to validate
 * @returns True if the request is valid, false otherwise
 */
function validateExportRequest(exportConfig: IDataExport): boolean {
  // LD1: Check if exportConfig is defined
  if (!exportConfig) {
    logger.error('Export configuration is missing');
    return false;
  }

  // LD1: Verify that export format is valid (CSV, EXCEL, PDF, JSON)
  if (!Object.values(ExportFormat).includes(exportConfig.format)) {
    logger.error(`Invalid export format: ${exportConfig.format}`);
    return false;
  }

  // LD1: Ensure fileName is provided
  if (!exportConfig.fileName) {
    logger.error('File name is required for export');
    return false;
  }

  // LD1: Validate that either queryId or reportId is provided
  if (!exportConfig.queryId && !exportConfig.reportId) {
    logger.error('Either queryId or reportId must be provided');
    return false;
  }

  // If all validations pass, return true
  return true;
}

/**
 * Controller class that handles HTTP requests related to data exports
 */
export class ExportController {
  // LD1: Define private properties for dependencies
  private exportService: ExportService;

  /**
   * Creates a new ExportController instance
   * @param exportService The export service
   */
  constructor(exportService: ExportService) {
    // LD1: Initialize the export service
    this.exportService = exportService;
    // LD1: Log controller initialization
    logger.info('ExportController initialized');
  }

  /**
   * Creates a new export job based on the request body
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   * @returns Promise that resolves when the response is sent
   */
  async createExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract export configuration from request body
      const exportConfig: IDataExport = req.body;

      // LD1: Validate the export configuration
      if (!validateExportRequest(exportConfig)) {
        return next(new AppError('Invalid export request', { code: 'VAL_INVALID_INPUT', statusCode: 400 }));
      }

      // LD1: Add user ID from authenticated request to createdBy field
      exportConfig.createdBy = req.user?.user_id || 'anonymous';

      // LD1: Call exportService.createExport to create the export job
      const createdExport = await this.exportService.createExport(exportConfig);

      // LD1: Return 201 Created response with the created export job
      res.status(201).json(createdExport);
    } catch (error) {
      // LD1: Handle any errors and pass to next middleware
      logger.error('Error creating export', { error });
      next(error);
    }
  }

  /**
   * Retrieves an export job by ID
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   * @returns Promise that resolves when the response is sent
   */
  async getExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract export ID from request parameters
      const exportId: string = req.params.id;

      // LD1: Call exportService.getExport to retrieve the export job
      const exportJob = await this.exportService.getExport(exportId);

      // LD1: If export not found, return 404 Not Found response
      if (!exportJob) {
        return next(new AppError('Export not found', { code: 'RES_NOT_FOUND', statusCode: 404 }));
      }

      // LD1: Return 200 OK response with the export job
      res.status(200).json(exportJob);
    } catch (error) {
      // LD1: Handle any errors and pass to next middleware
      logger.error('Error getting export', { error });
      next(error);
    }
  }

  /**
   * Retrieves export jobs with optional filtering
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   * @returns Promise that resolves when the response is sent
   */
  async getExports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract filter parameters from request query
      const filters: any = req.query;

      // LD1: Call exportService.getExports to retrieve export jobs
      const exportJobs = await this.exportService.getExports(filters);

      // LD1: Return 200 OK response with the export jobs
      res.status(200).json(exportJobs);
    } catch (error) {
      // LD1: Handle any errors and pass to next middleware
      logger.error('Error getting exports', { error });
      next(error);
    }
  }

  /**
   * Processes an export job by generating the file in the specified format
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   * @returns Promise that resolves when the response is sent
   */
  async processExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract export ID from request parameters
      const exportId: string = req.params.id;

      // LD1: Call exportService.processExport to process the export job
      const processedExport = await this.exportService.processExport(exportId);

      // LD1: Return 200 OK response with the processed export job
      res.status(200).json(processedExport);
    } catch (error) {
      // LD1: Handle any errors and pass to next middleware
      logger.error('Error processing export', { error });
      next(error);
    }
  }

  /**
   * Deletes an export job and its associated file
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   * @returns Promise that resolves when the response is sent
   */
  async deleteExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract export ID from request parameters
      const exportId: string = req.params.id;

      // LD1: Call exportService.deleteExport to delete the export job
      const deletionSuccessful = await this.exportService.deleteExport(exportId);

      // LD1: If deletion successful, return 204 No Content response
      if (deletionSuccessful) {
        return res.status(204).send();
      }

      // LD1: If export not found, return 404 Not Found response
      return next(new AppError('Export not found', { code: 'RES_NOT_FOUND', statusCode: 404 }));
    } catch (error) {
      // LD1: Handle any errors and pass to next middleware
      logger.error('Error deleting export', { error });
      next(error);
    }
  }

  /**
   * Downloads an export file
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   * @returns Promise that resolves when the file is sent
   */
  async downloadExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract export ID from request parameters
      const exportId: string = req.params.id;

      // LD1: Call exportService.getExportFile to get the file information
      const fileInfo = await this.exportService.getExportFile(exportId);

      // LD1: If file not found or export not completed, return 404 Not Found response
      if (!fileInfo) {
        return next(new AppError('Export file not found or not completed', { code: 'RES_NOT_FOUND', statusCode: 404 }));
      }

      // LD1: Set appropriate Content-Type header based on file format
      const mimeType = mime.lookup(fileInfo.filePath) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);

      // LD1: Set Content-Disposition header for download with the file name
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);

      // LD1: Stream the file to the response
      const fileStream = fs.createReadStream(fileInfo.filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        logger.error('Error streaming export file', { error, exportId });
        next(new AppError('Error streaming export file', { code: 'SRV_INTERNAL_ERROR', statusCode: 500 }));
      });
    } catch (error) {
      // LD1: Handle any errors and pass to next middleware
      logger.error('Error downloading export', { error });
      next(error);
    }
  }

  /**
   * Creates and immediately processes an export job
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   * @returns Promise that resolves when the response is sent
   */
  async createAndProcessExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract export configuration from request body
      const exportConfig: IDataExport = req.body;

      // LD1: Validate the export configuration
      if (!validateExportRequest(exportConfig)) {
        return next(new AppError('Invalid export request', { code: 'VAL_INVALID_INPUT', statusCode: 400 }));
      }

      // LD1: Add user ID from authenticated request to createdBy field
      exportConfig.createdBy = req.user?.user_id || 'anonymous';

      // LD1: Call exportService.createAndProcessExport to create and process the export job
      const processedExport = await this.exportService.createAndProcessExport(exportConfig);

      // LD1: Return 202 Accepted response with the export job details and download URL
      res.status(202).json({
        message: 'Export job created and processing. Use the downloadUrl to retrieve the file when complete.',
        exportId: processedExport.id,
        downloadUrl: processedExport.fileUrl
      });
    } catch (error) {
      // LD1: Handle any errors and pass to next middleware
      logger.error('Error creating and processing export', { error });
      next(error);
    }
  }

  /**
   * Exports the results of an analytics query directly
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   * @returns Promise that resolves when the response is sent
   */
  async exportQueryResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // LD1: Extract query ID, format, and parameters from request body
      const { queryId, format, fileName, parameters } = req.body;

      // LD1: Validate the required parameters
      if (!queryId || !format || !fileName) {
        return next(new AppError('Missing required parameters: queryId, format, fileName', { code: 'VAL_INVALID_INPUT', statusCode: 400 }));
      }

      // LD1: Call exportService.exportQueryResults to export the query results
      const exportResult = await this.exportService.exportQueryResults(queryId, format, fileName, parameters, {});

      // LD1: Set appropriate Content-Type header based on file format
      const mimeType = getMimeTypeForFormat(format);
      res.setHeader('Content-Type', mimeType);

      // LD1: Set Content-Disposition header for download with the file name
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // LD1: Stream the file to the response
      const fileStream = fs.createReadStream(exportResult.filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        logger.error('Error streaming query results', { error, queryId });
        next(new AppError('Error streaming query results', { code: 'SRV_INTERNAL_ERROR', statusCode: 500 }));
      });
    } catch (error) {
      // LD1: Handle any errors and pass to next middleware
      logger.error('Error exporting query results', { error });
      next(error);
    }
  }
}

// LD1: Export the ExportController class for use in route configuration
export { ExportController };

// LD1: Default export of the ExportController class
export default ExportController;