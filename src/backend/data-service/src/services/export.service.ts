import fs from 'fs'; // fs@N/A
import path from 'path'; // path@N/A
import util from 'util'; // util@N/A
import mongoose from 'mongoose'; // mongoose@^7.0.0
import { DataExport, IDataExport, IDataExportDocument, ExportFormat, ExportStatus } from '../models/data-export.model';
import { CsvExporter } from '../exporters/csv-exporter';
import { ExcelExporter } from '../exporters/excel-exporter';
import { PdfExporter } from '../exporters/pdf-exporter';
import { AnalyticsService } from './analytics.service';
import { DataWarehouseService } from './data-warehouse.service';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';

// Global constants for export configuration
const EXPORT_EXPIRY_DAYS = process.env.EXPORT_EXPIRY_DAYS ? parseInt(process.env.EXPORT_EXPIRY_DAYS) : 7;
const EXPORT_BASE_URL = process.env.EXPORT_BASE_URL || '/api/v1/exports/download';

/**
 * Validates the export configuration to ensure it has all required properties
 * @param exportConfig The export configuration to validate
 * @throws Error if validation fails
 */
function validateExportConfig(exportConfig: IDataExport): void {
  // LD1: Check if exportConfig is defined
  if (!exportConfig) {
    throw createError('Export configuration is required', {
      code: 'VAL_MISSING_FIELD',
      details: { field: 'exportConfig' }
    });
  }

  // LD1: Verify that export format is valid
  if (!Object.values(ExportFormat).includes(exportConfig.format)) {
    throw createError('Invalid export format', {
      code: 'VAL_INVALID_FORMAT',
      details: { format: exportConfig.format, supportedFormats: Object.values(ExportFormat) }
    });
  }

  // LD1: Ensure fileName is provided
  if (!exportConfig.fileName) {
    throw createError('File name is required for export', {
      code: 'VAL_MISSING_FIELD',
      details: { field: 'fileName' }
    });
  }

  // LD1: Validate that either queryId or reportId is provided
  if (!exportConfig.queryId && !exportConfig.reportId) {
    throw createError('Either queryId or reportId must be provided', {
      code: 'VAL_MISSING_FIELD',
      details: { fields: ['queryId', 'reportId'] }
    });
  }
}

/**
 * Gets the appropriate exporter instance for the specified format
 * @param format The export format
 * @returns Exporter instance or null if format not supported
 */
function getExporterForFormat(format: ExportFormat): CsvExporter | ExcelExporter | PdfExporter | null {
  // LD1: Check the format value
  switch (format) {
    // LD1: Return the appropriate exporter instance based on format
    case ExportFormat.CSV:
      return new CsvExporter();
    case ExportFormat.EXCEL:
      return new ExcelExporter();
    case ExportFormat.PDF:
      return new PdfExporter();
    // LD1: Return null if format is not supported
    default:
      return null;
  }
}

/**
 * Generates a URL for accessing the exported file
 * @param exportId The ID of the export job
 * @param fileName The name of the exported file
 * @returns URL for accessing the exported file
 */
function generateExportUrl(exportId: string, fileName: string): string {
  // LD1: Combine the base URL with the export ID and file name
  let baseUrl = EXPORT_BASE_URL;
  if (!baseUrl.startsWith('/')) {
    baseUrl = '/' + baseUrl;
  }
  if (!baseUrl.endsWith('/')) {
    baseUrl = baseUrl + '/';
  }
  const url = `${baseUrl}${exportId}/${fileName}`;

  // LD1: Ensure the URL is properly formatted
  // LD1: Return the complete URL
  return url;
}

/**
 * Cleans up expired export files and database records
 * @returns Promise that resolves when cleanup is complete
 */
async function cleanupExpiredExports(): Promise<void> {
  try {
    // LD1: Find all exports with expiresAt date in the past
    const expiredExports = await DataExport.find({
      expiresAt: { $lt: new Date() },
      status: { $ne: ExportStatus.EXPIRED }
    }).exec();

    // LD1: For each expired export, delete the file if it exists
    for (const exportJob of expiredExports) {
      if (exportJob.filePath && fs.existsSync(exportJob.filePath)) {
        fs.unlinkSync(exportJob.filePath);
        logger.info(`Expired export file deleted: ${exportJob.filePath}`);
      }

      // LD1: Update the export status to EXPIRED
      exportJob.status = ExportStatus.EXPIRED;
      await exportJob.save();
      logger.info(`Export status updated to EXPIRED: ${exportJob.id}`);
    }

    // LD1: Log the cleanup results
    logger.info(`Cleanup completed. ${expiredExports.length} expired exports processed.`);
  } catch (error) {
    // LD1: Handle any errors during cleanup
    logger.error('Error cleaning up expired exports', { error });
  }
}

/**
 * Service that manages the export of data in various formats
 */
export class ExportService {
  // LD1: Define private properties for dependencies
  private analyticsService: AnalyticsService;
  private dataWarehouseService: DataWarehouseService;
  private csvExporter: CsvExporter;
  private excelExporter: ExcelExporter;
  private pdfExporter: PdfExporter;

  /**
   * Creates a new ExportService instance
   * @param analyticsService The analytics service
   * @param dataWarehouseService The data warehouse service
   */
  constructor(analyticsService: AnalyticsService, dataWarehouseService: DataWarehouseService) {
    // LD1: Initialize the analytics service
    this.analyticsService = analyticsService;
    // LD1: Initialize the data warehouse service
    this.dataWarehouseService = dataWarehouseService;
    // LD1: Initialize the exporters (CSV, Excel, PDF)
    this.csvExporter = new CsvExporter();
    this.excelExporter = new ExcelExporter();
    this.pdfExporter = new PdfExporter();

    // LD1: Schedule periodic cleanup of expired exports
    this.scheduleCleanup();

    // LD1: Log service initialization
    logger.info('ExportService initialized');
  }

  /**
   * Creates a new export job
   * @param exportConfig The export configuration
   * @returns Created export job
   */
  async createExport(exportConfig: IDataExport): Promise<IDataExport> {
    try {
      // LD1: Validate the export configuration
      validateExportConfig(exportConfig);

      // LD1: Set initial status to PENDING
      exportConfig.status = ExportStatus.PENDING;

      // LD1: Calculate expiration date based on configuration
      const expiryDays = EXPORT_EXPIRY_DAYS;
      exportConfig.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

      // LD1: Create a new DataExport document
      const newExport = new DataExport(exportConfig);

      // LD1: Save the document to the database
      const savedExport = await newExport.save();

      // LD1: Return the created export job
      logger.info(`Export job created: ${savedExport.id}`, { exportId: savedExport.id, format: savedExport.format });
      return savedExport;
    } catch (error) {
      // LD1: Handle any errors during creation
      logger.error('Error creating export job', { error, exportConfig });
      throw createError('Failed to create export job', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves an export job by ID
   * @param exportId The ID of the export job
   * @returns Export job or null if not found
   */
  async getExport(exportId: string): Promise<IDataExport | null> {
    try {
      // LD1: Validate the export ID
      if (!mongoose.Types.ObjectId.isValid(exportId)) {
        throw createError('Invalid export ID', { code: 'VAL_INVALID_INPUT', details: { exportId } });
      }

      // LD1: Find the export by ID in the database
      const exportJob = await DataExport.findById(exportId).lean();

      // LD1: Return the export or null if not found
      if (!exportJob) {
        logger.warn(`Export job not found: ${exportId}`);
        return null;
      }

      // LD1: Log retrieval
      logger.info(`Export job retrieved: ${exportJob.id}`, { exportId: exportJob.id, format: exportJob.format });
      return exportJob;
    } catch (error) {
      // LD1: Handle any errors during retrieval
      logger.error('Error retrieving export job', { error, exportId });
      throw createError('Failed to retrieve export job', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Retrieves export jobs with optional filtering
   * @param filters Filters to apply to the query
   * @returns Array of export jobs
   */
  async getExports(filters: any): Promise<Array<IDataExport>> {
    try {
      // LD1: Build a query based on the provided filters
      const query = DataExport.find(filters).lean();

      // LD1: Execute the query to retrieve export jobs
      const exportJobs = await query.exec();

      // LD1: Return the array of export jobs
      logger.info(`Retrieved ${exportJobs.length} export jobs`, { filters });
      return exportJobs;
    } catch (error) {
      // LD1: Handle any errors during retrieval
      logger.error('Error retrieving export jobs', { error, filters });
      throw createError('Failed to retrieve export jobs', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Processes an export job by generating the file in the specified format
   * @param exportId The ID of the export job
   * @returns Processed export job
   */
  async processExport(exportId: string): Promise<IDataExport> {
    try {
      // LD1: Retrieve the export job by ID
      let exportJob = await this.getExport(exportId);

      // LD1: If not found, throw an error
      if (!exportJob) {
        throw createError('Export job not found', { code: 'RES_NOT_FOUND', details: { exportId } });
      }

      // LD1: Update status to PROCESSING
      exportJob.status = ExportStatus.PROCESSING;
      exportJob = await DataExport.findByIdAndUpdate(exportId, { status: ExportStatus.PROCESSING }, { new: true }).lean() as IDataExportDocument;

      // LD1: Get the appropriate exporter for the format
      const exporter = getExporterForFormat(exportJob.format);

      // LD1: If format not supported, throw an error
      if (!exporter) {
        throw createError('Unsupported export format', { code: 'VAL_INVALID_FORMAT', details: { format: exportJob.format } });
      }

      // LD1: Retrieve data based on queryId or reportId
      let data: Array<Record<string, any>>;
      if (exportJob.queryId) {
        data = await this.analyticsService.executeQuery(exportJob.queryId, exportJob.parameters, {});
      } else if (exportJob.reportId) {
        // TODO: Implement report execution logic
        throw createError('Report execution not yet implemented', { code: 'SRV_NOT_IMPLEMENTED' });
      } else {
        throw createError('No queryId or reportId specified', { code: 'VAL_MISSING_FIELD', details: { fields: ['queryId', 'reportId'] } });
      }

      // LD1: Generate the export file using the exporter
      const exportResult = await exporter.export(data, exportJob);

      // LD1: Update the export job with file path, size, and row count
      exportJob.filePath = exportResult.filePath;
      exportJob.fileSize = exportResult.fileSize;
      exportJob.rowCount = exportResult.rowCount;

      // LD1: Generate a download URL for the file
      exportJob.fileUrl = generateExportUrl(exportId, path.basename(exportResult.filePath));

      // LD1: Update status to COMPLETED
      exportJob.status = ExportStatus.COMPLETED;

      // LD1: Save the updated export job
      await DataExport.findByIdAndUpdate(exportId, {
        status: ExportStatus.COMPLETED,
        filePath: exportJob.filePath,
        fileSize: exportJob.fileSize,
        rowCount: exportJob.rowCount,
        fileUrl: exportJob.fileUrl
      }, { new: true }).lean();

      // LD1: Return the processed export job
      logger.info(`Export job processed successfully: ${exportId}`, { exportId, format: exportJob.format, filePath: exportJob.filePath });
      return exportJob;
    } catch (error) {
      // LD1: Handle any errors during processing and update status to FAILED
      logger.error(`Error processing export job: ${exportId}`, { error, exportId });
      await DataExport.findByIdAndUpdate(exportId, { status: ExportStatus.FAILED, error: error.message }, { new: true }).lean();
      throw createError('Failed to process export job', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Deletes an export job and its associated file
   * @param exportId The ID of the export job
   * @returns True if deletion was successful
   */
  async deleteExport(exportId: string): Promise<boolean> {
    try {
      // LD1: Retrieve the export job by ID
      const exportJob = await this.getExport(exportId);

      // LD1: If not found, return false
      if (!exportJob) {
        logger.warn(`Export job not found for deletion: ${exportId}`);
        return false;
      }

      // LD1: Delete the export file if it exists
      if (exportJob.filePath && fs.existsSync(exportJob.filePath)) {
        fs.unlinkSync(exportJob.filePath);
        logger.info(`Export file deleted: ${exportJob.filePath}`);
      }

      // LD1: Delete the export job from the database
      await DataExport.deleteOne({ _id: exportId });

      // LD1: Return true if deletion was successful
      logger.info(`Export job deleted: ${exportId}`);
      return true;
    } catch (error) {
      // LD1: Handle any errors during deletion
      logger.error('Error deleting export job', { error, exportId });
      return false;
    }
  }

  /**
   * Retrieves the file path for an export job
   * @param exportId The ID of the export job
   * @returns File information or null if not found
   */
  async getExportFile(exportId: string): Promise<{ filePath: string, fileName: string, mimeType: string } | null> {
    try {
      // LD1: Retrieve the export job by ID
      const exportJob = await this.getExport(exportId);

      // LD1: If not found or status not COMPLETED, return null
      if (!exportJob || exportJob.status !== ExportStatus.COMPLETED) {
        logger.warn(`Export job not found or not completed: ${exportId}`);
        return null;
      }

      // LD1: Determine the MIME type based on the export format
      let mimeType: string;
      switch (exportJob.format) {
        case ExportFormat.CSV:
          mimeType = 'text/csv';
          break;
        case ExportFormat.EXCEL:
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case ExportFormat.PDF:
          mimeType = 'application/pdf';
          break;
        case ExportFormat.JSON:
          mimeType = 'application/json';
          break;
        default:
          mimeType = 'application/octet-stream';
      }

      // LD1: Return the file path, file name, and MIME type
      return {
        filePath: exportJob.filePath,
        fileName: exportJob.fileName,
        mimeType
      };
    } catch (error) {
      // LD1: Handle any errors during retrieval
      logger.error('Error retrieving export file', { error, exportId });
      return null;
    }
  }

  /**
   * Exports data directly without creating a persistent job
   * @param data The data to export
   * @param format The export format
   * @param fileName The name of the file
   * @param options Additional export options
   * @returns Export result with file information
   */
  async exportData(
    data: Array<Record<string, any>>,
    format: ExportFormat,
    fileName: string,
    options: any
  ): Promise<{ filePath: string; rowCount: number; fileSize: number }> {
    try {
      // LD1: Validate the input parameters
      if (!data || !Array.isArray(data)) {
        throw createError('Data must be an array', { code: 'VAL_INVALID_INPUT', details: { type: typeof data } });
      }
      if (!format) {
        throw createError('Export format is required', { code: 'VAL_MISSING_FIELD', details: { field: 'format' } });
      }
      if (!fileName) {
        throw createError('File name is required', { code: 'VAL_MISSING_FIELD', details: { field: 'fileName' } });
      }

      // LD1: Get the appropriate exporter for the format
      const exporter = getExporterForFormat(format);
      if (!exporter) {
        throw createError('Unsupported export format', { code: 'VAL_INVALID_FORMAT', details: { format } });
      }

      // LD1: Create a temporary export configuration
      const exportConfig: IDataExport = {
        name: 'Ad-hoc Export',
        description: 'Temporary export job',
        format: format,
        fileName: fileName,
        createdBy: 'system', // Or identify the user if available
        createdAt: new Date(),
        updatedAt: new Date(),
        status: ExportStatus.PENDING // This won't be persisted
      };

      // LD1: Generate the export file using the exporter
      const exportResult = await exporter.export(data, exportConfig);

      // LD1: Return the export result with file path, row count, and file size
      logger.info('Data exported successfully', { format, fileName, rowCount: data.length, fileSize: exportResult.fileSize });
      return exportResult;
    } catch (error) {
      // LD1: Handle any errors during export
      logger.error('Error exporting data', { error, format, fileName });
      throw createError('Failed to export data', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Exports the results of an analytics query
   * @param queryId The ID of the analytics query
   * @param format The export format
   * @param fileName The name of the file
   * @param parameters Parameters for the query
   * @param options Additional export options
   * @returns Export result with file information
   */
  async exportQueryResults(
    queryId: string,
    format: ExportFormat,
    fileName: string,
    parameters: any,
    options: any
  ): Promise<{ filePath: string; rowCount: number; fileSize: number }> {
    try {
      // LD1: Validate the input parameters
      if (!queryId) {
        throw createError('Query ID is required', { code: 'VAL_MISSING_FIELD', details: { field: 'queryId' } });
      }
      if (!format) {
        throw createError('Export format is required', { code: 'VAL_MISSING_FIELD', details: { field: 'format' } });
      }
      if (!fileName) {
        throw createError('File name is required', { code: 'VAL_MISSING_FIELD', details: { field: 'fileName' } });
      }

      // LD1: Execute the analytics query to get the data
      const data = await this.analyticsService.executeQuery(queryId, parameters, options);

      // LD1: Export the query results using the exportData method
      const exportResult = await this.exportData(data, format, fileName, options);

      // LD1: Return the export result
      logger.info('Query results exported successfully', { queryId, format, fileName, rowCount: data.length, fileSize: exportResult.fileSize });
      return exportResult;
    } catch (error) {
      // LD1: Handle any errors during export
      logger.error('Error exporting query results', { error, queryId, format, fileName });
      throw createError('Failed to export query results', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Creates and immediately processes an export job
   * @param exportConfig The export configuration
   * @returns Processed export job
   */
  async createAndProcessExport(exportConfig: IDataExport): Promise<IDataExport> {
    try {
      // LD1: Create a new export job using createExport
      const newExport = await this.createExport(exportConfig);

      // LD1: Process the export job using processExport
      const processedExport = await this.processExport(newExport.id);

      // LD1: Return the processed export job
      return processedExport;
    } catch (error) {
      // LD1: Handle any errors during creation or processing
      logger.error('Error creating and processing export job', { error, exportConfig });
      throw createError('Failed to create and process export job', { code: 'SRV_INTERNAL_ERROR', details: { error } });
    }
  }

  /**
   * Schedules periodic cleanup of expired exports
   */
  scheduleCleanup(): void {
    // LD1: Set up a periodic interval (e.g., daily) to run cleanupExpiredExports
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
    setInterval(cleanupExpiredExports, cleanupInterval);

    // LD1: Log the scheduling of cleanup
    logger.info('Scheduled periodic cleanup of expired exports', { interval: cleanupInterval });
  }

  
}

// LD1: Export the ExportService class for use in controllers and other services
export { ExportService };

// LD1: Default export of the ExportService class
export default ExportService;