import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import * as mime from 'mime-types';

import { ReportingService } from '../services/reporting.service';
import { IReportTemplate, ReportType } from '../models/report-template.model';
import { IReport, ReportStatus } from '../models/report.model';
import { ExportFormat } from '../models/data-export.model';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

/**
 * Validates the report template request body to ensure it has all required properties
 * 
 * @param templateData - The template data to validate
 * @returns True if the request is valid, false otherwise
 */
function validateReportTemplateRequest(templateData: IReportTemplate): boolean {
  if (!templateData) return false;
  if (!templateData.name) return false;
  if (!templateData.type) return false;
  if (!templateData.sections || templateData.sections.length === 0) return false;
  
  return true;
}

/**
 * Validates the parameters for report generation against a template
 * 
 * @param parameters - The parameters to validate
 * @param template - The template to validate against
 * @returns True if the parameters are valid, false otherwise
 */
function validateReportParameters(parameters: object, template: IReportTemplate): boolean {
  if (!parameters) return false;
  
  // Check required parameters
  if (template.parameterDefinitions) {
    for (const [paramName, paramDef] of Object.entries(template.parameterDefinitions)) {
      if (paramDef.required && (parameters[paramName] === undefined || parameters[paramName] === null)) {
        return false;
      }
    }
  }
  
  // Validate date range parameters if they exist
  if (parameters['startDate'] && parameters['endDate']) {
    const startDate = new Date(parameters['startDate']);
    const endDate = new Date(parameters['endDate']);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
      return false;
    }
  }
  
  return true;
}

/**
 * Determines the appropriate MIME type based on the export format
 * 
 * @param format - The export format
 * @returns MIME type for the specified format
 */
function getMimeTypeForFormat(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.CSV:
      return 'text/csv';
    case ExportFormat.EXCEL:
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case ExportFormat.PDF:
      return 'application/pdf';
    case ExportFormat.JSON:
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Controller class that handles HTTP requests related to report templates and reports
 */
export class ReportingController {
  private reportingService: ReportingService;
  
  /**
   * Creates a new ReportingController instance
   */
  constructor() {
    this.reportingService = new ReportingService();
    logger.info('ReportingController initialized');
  }
  
  /**
   * Creates a new report template based on the request body
   */
  async createReportTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Creating report template');
      
      const templateData: IReportTemplate = req.body;
      
      if (!validateReportTemplateRequest(templateData)) {
        throw new AppError('Invalid template data', {
          code: 'VAL_INVALID_INPUT',
          statusCode: 400,
          details: { message: 'Template must include name, type, and at least one section' }
        });
      }
      
      // Add user ID from authenticated request
      if (!req.user || !req.user.id) {
        throw new AppError('User authentication required', {
          code: 'AUTH_MISSING_TOKEN',
          statusCode: 401
        });
      }
      
      templateData.createdBy = req.user.id;
      
      const createdTemplate = await this.reportingService.createReportTemplate(templateData);
      
      res.status(201).json({
        success: true,
        data: createdTemplate
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Retrieves a report template by ID
   */
  async getReportTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Retrieving report template with ID: ${req.params.id}`);
      
      const templateId = req.params.id;
      const template = await this.reportingService.getReportTemplate(templateId);
      
      if (!template) {
        throw new AppError('Report template not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { templateId }
        });
      }
      
      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Retrieves report templates with optional filtering
   */
  async getReportTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Retrieving report templates');
      
      const filter = {
        type: req.query.type as ReportType,
        createdBy: req.query.createdBy as string,
        isDefault: req.query.isDefault === 'true' ? true : 
                  req.query.isDefault === 'false' ? false : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
      };
      
      const templates = await this.reportingService.getReportTemplates(filter);
      
      res.status(200).json({
        success: true,
        count: templates.length,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Updates an existing report template
   */
  async updateReportTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Updating report template with ID: ${req.params.id}`);
      
      const templateId = req.params.id;
      const updateData = req.body;
      
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new AppError('No update data provided', {
          code: 'VAL_INVALID_INPUT',
          statusCode: 400
        });
      }
      
      const updatedTemplate = await this.reportingService.updateReportTemplate(templateId, updateData);
      
      if (!updatedTemplate) {
        throw new AppError('Report template not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { templateId }
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedTemplate
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Deletes a report template
   */
  async deleteReportTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Deleting report template with ID: ${req.params.id}`);
      
      const templateId = req.params.id;
      const result = await this.reportingService.deleteReportTemplate(templateId);
      
      if (!result) {
        throw new AppError('Report template not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { templateId }
        });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Retrieves default report templates by type
   */
  async getDefaultTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Retrieving default report templates');
      
      const type = req.query.type as ReportType;
      const templates = await this.reportingService.getDefaultTemplates(type);
      
      res.status(200).json({
        success: true,
        count: templates.length,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Generates a report based on a template and parameters
   */
  async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Generating report from template ID: ${req.params.templateId}`);
      
      const templateId = req.params.templateId;
      const parameters = req.body.parameters || {};
      
      // Get the template first to validate parameters
      const template = await this.reportingService.getReportTemplate(templateId);
      
      if (!template) {
        throw new AppError('Report template not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { templateId }
        });
      }
      
      if (!validateReportParameters(parameters, template)) {
        throw new AppError('Invalid report parameters', {
          code: 'VAL_INVALID_INPUT',
          statusCode: 400,
          details: { message: 'One or more required parameters are missing or invalid' }
        });
      }
      
      // Add user ID from authenticated request
      if (!req.user || !req.user.id) {
        throw new AppError('User authentication required', {
          code: 'AUTH_MISSING_TOKEN',
          statusCode: 401
        });
      }
      
      const userId = req.user.id;
      
      const report = await this.reportingService.generateReport(templateId, parameters, userId);
      
      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Retrieves a report by ID
   */
  async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Retrieving report with ID: ${req.params.id}`);
      
      const reportId = req.params.id;
      const report = await this.reportingService.getReport(reportId);
      
      if (!report) {
        throw new AppError('Report not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { reportId }
        });
      }
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Retrieves reports with optional filtering
   */
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Retrieving reports');
      
      const filter = {
        type: req.query.type as ReportType,
        status: req.query.status as ReportStatus,
        createdBy: req.query.createdBy as string,
        templateId: req.query.templateId as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };
      
      const reports = await this.reportingService.getReports(filter);
      
      res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Updates an existing report
   */
  async updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Updating report with ID: ${req.params.id}`);
      
      const reportId = req.params.id;
      const updateData = req.body;
      
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new AppError('No update data provided', {
          code: 'VAL_INVALID_INPUT',
          statusCode: 400
        });
      }
      
      const updatedReport = await this.reportingService.updateReport(reportId, updateData);
      
      if (!updatedReport) {
        throw new AppError('Report not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { reportId }
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedReport
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Deletes a report
   */
  async deleteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Deleting report with ID: ${req.params.id}`);
      
      const reportId = req.params.id;
      const result = await this.reportingService.deleteReport(reportId);
      
      if (!result) {
        throw new AppError('Report not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { reportId }
        });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Exports a report to the specified format
   */
  async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Exporting report with ID: ${req.params.id}`);
      
      const reportId = req.params.id;
      const format = req.query.format as ExportFormat || ExportFormat.PDF;
      
      if (!Object.values(ExportFormat).includes(format)) {
        throw new AppError('Invalid export format', {
          code: 'VAL_INVALID_INPUT',
          statusCode: 400,
          details: { format, validFormats: Object.values(ExportFormat) }
        });
      }
      
      const { filePath, fileName } = await this.reportingService.exportReport(reportId, format);
      
      if (!filePath || !fs.existsSync(filePath)) {
        throw new AppError('Report export failed', {
          code: 'SRV_INTERNAL_ERROR',
          statusCode: 500
        });
      }
      
      const mimeType = getMimeTypeForFormat(format);
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (error) => {
        logger.error(`Error streaming file: ${error.message}`, { error });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file'
          });
        }
      });
      
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Publishes a report, making it available to users
   */
  async publishReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Publishing report with ID: ${req.params.id}`);
      
      const reportId = req.params.id;
      const publishedReport = await this.reportingService.publishReport(reportId);
      
      if (!publishedReport) {
        throw new AppError('Report not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { reportId }
        });
      }
      
      res.status(200).json({
        success: true,
        data: publishedReport
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Archives a report that is no longer needed
   */
  async archiveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Archiving report with ID: ${req.params.id}`);
      
      const reportId = req.params.id;
      const archivedReport = await this.reportingService.archiveReport(reportId);
      
      if (!archivedReport) {
        throw new AppError('Report not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { reportId }
        });
      }
      
      res.status(200).json({
        success: true,
        data: archivedReport
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Schedules a report for recurring generation
   */
  async scheduleReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Scheduling report for template ID: ${req.params.templateId}`);
      
      const templateId = req.params.templateId;
      const scheduleConfig = req.body.scheduleConfig;
      const parameters = req.body.parameters || {};
      
      if (!scheduleConfig) {
        throw new AppError('Schedule configuration is required', {
          code: 'VAL_MISSING_FIELD',
          statusCode: 400
        });
      }
      
      // Get the template first to validate parameters
      const template = await this.reportingService.getReportTemplate(templateId);
      
      if (!template) {
        throw new AppError('Report template not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { templateId }
        });
      }
      
      if (!validateReportParameters(parameters, template)) {
        throw new AppError('Invalid report parameters', {
          code: 'VAL_INVALID_INPUT',
          statusCode: 400,
          details: { message: 'One or more required parameters are missing or invalid' }
        });
      }
      
      // Add user ID from authenticated request
      if (!req.user || !req.user.id) {
        throw new AppError('User authentication required', {
          code: 'AUTH_MISSING_TOKEN',
          statusCode: 401
        });
      }
      
      const userId = req.user.id;
      
      const scheduledReport = await this.reportingService.scheduleReport(
        templateId, 
        scheduleConfig, 
        parameters, 
        userId
      );
      
      res.status(201).json({
        success: true,
        data: scheduledReport
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Stops a scheduled report from running
   */
  async unscheduleReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Unscheduling report with ID: ${req.params.id}`);
      
      const reportId = req.params.id;
      const result = await this.reportingService.unscheduleReport(reportId);
      
      if (!result) {
        throw new AppError('Scheduled report not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404,
          details: { reportId }
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Report unscheduled successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Retrieves reports generated from a specific template
   */
  async getReportsByTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Retrieving reports for template ID: ${req.params.templateId}`);
      
      const templateId = req.params.templateId;
      const reports = await this.reportingService.getReportsByTemplate(templateId);
      
      res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Generates an efficiency report using a default template
   */
  async generateEfficiencyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Generating efficiency report');
      
      const parameters = req.body.parameters || {};
      
      // Add user ID from authenticated request
      if (!req.user || !req.user.id) {
        throw new AppError('User authentication required', {
          code: 'AUTH_MISSING_TOKEN',
          statusCode: 401
        });
      }
      
      const userId = req.user.id;
      
      const report = await this.reportingService.generateEfficiencyReport(parameters, userId);
      
      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Generates a financial report using a default template
   */
  async generateFinancialReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Generating financial report');
      
      const parameters = req.body.parameters || {};
      
      // Add user ID from authenticated request
      if (!req.user || !req.user.id) {
        throw new AppError('User authentication required', {
          code: 'AUTH_MISSING_TOKEN',
          statusCode: 401
        });
      }
      
      const userId = req.user.id;
      
      const report = await this.reportingService.generateFinancialReport(parameters, userId);
      
      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Generates an operational report using a default template
   */
  async generateOperationalReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Generating operational report');
      
      const parameters = req.body.parameters || {};
      
      // Add user ID from authenticated request
      if (!req.user || !req.user.id) {
        throw new AppError('User authentication required', {
          code: 'AUTH_MISSING_TOKEN',
          statusCode: 401
        });
      }
      
      const userId = req.user.id;
      
      const report = await this.reportingService.generateOperationalReport(parameters, userId);
      
      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Generates a driver performance report using a default template
   */
  async generateDriverPerformanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Generating driver performance report');
      
      const parameters = req.body.parameters || {};
      
      // Add user ID from authenticated request
      if (!req.user || !req.user.id) {
        throw new AppError('User authentication required', {
          code: 'AUTH_MISSING_TOKEN',
          statusCode: 401
        });
      }
      
      const userId = req.user.id;
      
      const report = await this.reportingService.generateDriverPerformanceReport(parameters, userId);
      
      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Generates a fleet utilization report using a default template
   */
  async generateFleetUtilizationReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Generating fleet utilization report');
      
      const parameters = req.body.parameters || {};
      
      // Add user ID from authenticated request
      if (!req.user || !req.user.id) {
        throw new AppError('User authentication required', {
          code: 'AUTH_MISSING_TOKEN',
          statusCode: 401
        });
      }
      
      const userId = req.user.id;
      
      const report = await this.reportingService.generateFleetUtilizationReport(parameters, userId);
      
      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Downloads a report file
   */
  async downloadReportFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Downloading report file for report ID: ${req.params.id}`);
      
      const reportId = req.params.id;
      const format = req.query.format as ExportFormat || ExportFormat.PDF;
      
      if (!Object.values(ExportFormat).includes(format)) {
        throw new AppError('Invalid export format', {
          code: 'VAL_INVALID_INPUT',
          statusCode: 400,
          details: { format, validFormats: Object.values(ExportFormat) }
        });
      }
      
      const { filePath, fileName } = await this.reportingService.exportReport(reportId, format);
      
      if (!filePath || !fs.existsSync(filePath)) {
        throw new AppError('Report file not found', {
          code: 'RES_DOCUMENT_NOT_FOUND',
          statusCode: 404
        });
      }
      
      const mimeType = getMimeTypeForFormat(format);
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (error) => {
        logger.error(`Error streaming file: ${error.message}`, { error });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file'
          });
        }
      });
      
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

export default ReportingController;