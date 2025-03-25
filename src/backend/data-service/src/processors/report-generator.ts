import fs from 'fs'; // Node.js file system module for file operations
import path from 'path'; // Node.js path module for handling file paths
import _ from 'lodash'; // Utility library for data manipulation and transformation // lodash@^4.17.21
import moment from 'moment'; // Date manipulation library for handling date-based data in reports // moment@^2.29.4
import { v4 as uuidv4 } from 'uuid'; // For generating unique identifiers for reports and sections // uuid@^9.0.0
import {
  IReportTemplate, // Import report template interfaces and enums for report generation
  IReportSection,
  IVisualizationConfig,
  VisualizationType,
  PageSize,
  PageOrientation
} from '../models/report-template.model';
import {
  IReport, // Import report interfaces and enums for report data structure
  IReportSectionData,
  IReportVisualizationData,
  ReportStatus
} from '../models/report.model';
import { IAnalyticsQuery } from '../models/analytics-query.model'; // Import analytics query interface for data retrieval
import { DataProcessor } from './data-processor'; // Import data processor for transforming and processing query results
import { ExportFormat } from '../models/data-export.model'; // Import export format enum for report export options
import { PdfExporter } from '../exporters/pdf-exporter'; // Import PDF exporter for generating PDF reports
import { ExcelExporter } from '../exporters/excel-exporter'; // Import Excel exporter for generating Excel reports
import { CsvExporter } from '../exporters/csv-exporter'; // Import CSV exporter for generating CSV reports
import logger from '../../../common/utils/logger'; // Import logging utility for error and info logging
import { createError } from '../../../common/utils/error-handler'; // Import error creation utility for standardized error handling

const REPORT_EXPORT_DIR = process.env.REPORT_EXPORT_DIR || './temp/reports'; // Global variable for report export directory

/**
 * Validates a report template to ensure it has all required properties
 * @param template - The report template to validate
 * @throws Error if validation fails
 */
function validateReportTemplate(template: IReportTemplate): void {
  // Check if template is defined
  if (!template) {
    throw createError('Report template cannot be null or undefined', { code: 'VAL_MISSING_FIELD', details: { field: 'template' } });
  }

  // Verify that template has a name
  if (!template.name) {
    throw createError('Report template must have a name', { code: 'VAL_MISSING_FIELD', details: { field: 'template.name' } });
  }

  // Verify that template has at least one section
  if (!template.sections || template.sections.length === 0) {
    throw createError('Report template must have at least one section', { code: 'VAL_MISSING_FIELD', details: { field: 'template.sections' } });
  }

  // Verify that each section has a title and visualizations
  template.sections.forEach(section => {
    if (!section.title) {
      throw createError('Report section must have a title', { code: 'VAL_MISSING_FIELD', details: { field: 'section.title' } });
    }
    if (!section.visualizations || section.visualizations.length === 0) {
      throw createError('Report section must have at least one visualization', { code: 'VAL_MISSING_FIELD', details: { field: 'section.visualizations' } });
    }

    // Verify that each visualization has a type and queryId
    section.visualizations.forEach(visualization => {
      if (!visualization.type) {
        throw createError('Visualization must have a type', { code: 'VAL_MISSING_FIELD', details: { field: 'visualization.type' } });
      }
      if (!visualization.queryId) {
        throw createError('Visualization must have a queryId', { code: 'VAL_MISSING_FIELD', details: { field: 'visualization.queryId' } });
      }
    });
  });
}

/**
 * Validates parameters for report generation
 * @param parameters - The parameters to validate
 * @param template - The report template to validate against
 * @throws Error if validation fails
 */
function validateReportParameters(parameters: any, template: IReportTemplate): void {
  // Check if parameters object is defined
  if (!parameters) {
    return; // No parameters to validate
  }

  // Validate required parameters based on template's parameterDefinitions
  if (template.parameterDefinitions) {
    for (const paramName in template.parameterDefinitions) {
      if (template.parameterDefinitions.hasOwnProperty(paramName)) {
        const paramDef = template.parameterDefinitions[paramName];
        if (paramDef.required && (parameters[paramName] === undefined || parameters[paramName] === null)) {
          throw createError(`Required parameter '${paramName}' is missing`, { code: 'VAL_MISSING_FIELD', details: { field: `parameters.${paramName}` } });
        }

        // Validate date ranges if provided
        if (paramDef.type === 'date' && parameters[paramName]) {
          if (!moment(parameters[paramName]).isValid()) {
            throw createError(`Invalid date format for parameter '${paramName}'`, { code: 'VAL_INVALID_FORMAT', details: { field: `parameters.${paramName}`, expectedFormat: 'YYYY-MM-DD' } });
          }
        }
      }
    }
  }
}

/**
 * Creates the report directory if it doesn't exist
 * @returns Path to the report directory
 */
async function prepareReportDirectory(): Promise<string> {
  // Ensure the base report directory exists, create if not
  if (!fs.existsSync(REPORT_EXPORT_DIR)) {
    fs.mkdirSync(REPORT_EXPORT_DIR, { recursive: true });
  }

  // Create a date-based subdirectory for better organization
  const date = new Date();
  const dateDirName = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  const reportDir = path.join(REPORT_EXPORT_DIR, dateDirName);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Return the full path to the report directory
  return reportDir;
}

/**
 * Generates a file path for the report file
 * @param exportDir - The directory where the file will be stored
 * @param reportName - The name of the report
 * @param format - The export format
 * @returns Full path to the report file
 */
function generateReportFilePath(exportDir: string, reportName: string, format: ExportFormat): string {
  // Sanitize the reportName to remove invalid characters
  const sanitizedReportName = reportName.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Determine the file extension based on the format
  let fileExtension: string;
  switch (format) {
    case ExportFormat.PDF:
      fileExtension = 'pdf';
      break;
    case ExportFormat.EXCEL:
      fileExtension = 'xlsx';
      break;
    case ExportFormat.CSV:
      fileExtension = 'csv';
      break;
    case ExportFormat.JSON:
      fileExtension = 'json';
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  // Join the exportDir with the sanitized reportName and extension
  return path.join(exportDir, `${sanitizedReportName}.${fileExtension}`);
}

/**
 * Applies report parameters to an analytics query
 * @param query - The analytics query to apply parameters to
 * @param parameters - The parameters to apply
 * @returns Updated query with parameters applied
 */
function applyParametersToQuery(query: IAnalyticsQuery, parameters: any): IAnalyticsQuery {
  // Create a deep clone of the original query
  const updatedQuery = _.cloneDeep(query);

  // Apply date range parameters if provided
  if (parameters?.startDate && parameters?.endDate) {
    // Assuming date range is applied as a filter
    if (!updatedQuery.filters) {
      updatedQuery.filters = [];
    }
    updatedQuery.filters.push({
      field: 'date', // Assuming 'date' is the field to filter
      operator: 'BETWEEN',
      value: [parameters.startDate, parameters.endDate]
    });
  }

  // Apply filter parameters if provided
  if (parameters?.filters) {
    // Assuming filters are applied as additional filters
    if (!updatedQuery.filters) {
      updatedQuery.filters = [];
    }
    // Merge existing filters with new filters
    updatedQuery.filters = [...updatedQuery.filters, ...parameters.filters];
  }

  // Apply grouping parameters if provided
  if (parameters?.groupBy) {
    // Assuming groupBy is applied as a grouping field
    if (!updatedQuery.groupBy) {
      updatedQuery.groupBy = [];
    }
    // Merge existing groupBy with new groupBy
    updatedQuery.groupBy = [...updatedQuery.groupBy, ...parameters.groupBy];
  }

  // Apply sorting parameters if provided
  if (parameters?.sort) {
    // Assuming sort is applied as a sorting field
    if (!updatedQuery.sort) {
      updatedQuery.sort = [];
    }
    // Merge existing sort with new sort
    updatedQuery.sort = [...updatedQuery.sort, ...parameters.sort];
  }

  // Apply pagination parameters if provided
  if (parameters?.limit) {
    updatedQuery.limit = parameters.limit;
  }
  if (parameters?.offset) {
    updatedQuery.offset = parameters.offset;
  }

  // Return the updated query
  return updatedQuery;
}

/**
 * Class that generates reports based on templates and analytics queries
 */
export class ReportGenerator {
  private dataProcessor: DataProcessor;
  private exporters: Map<ExportFormat, any>;

  /**
   * Creates a new ReportGenerator instance
   */
  constructor() {
    // Initialize the data processor
    this.dataProcessor = new DataProcessor();

    // Register exporters for different formats (PDF, Excel, CSV)
    this.exporters = new Map<ExportFormat, any>();
    this.registerExporter(ExportFormat.PDF, new PdfExporter());
    this.registerExporter(ExportFormat.EXCEL, new ExcelExporter());
    this.registerExporter(ExportFormat.CSV, new CsvExporter());

    // Log initialization of the report generator
    logger.info('Report generator initialized');
  }

  /**
   * Generates a report based on a template and query results
   * @param template - The report template to use
   * @param queries - A map of analytics queries to execute
   * @param queryResults - A map of pre-executed query results
   * @param parameters - Parameters to apply to the queries
   * @returns Generated report
   */
  async generateReport(
    template: IReportTemplate,
    queries: Map<string, IAnalyticsQuery>,
    queryResults: Map<string, Array<Record<string, any>>>,
    parameters: any
  ): Promise<IReport> {
    try {
      // Log the start of report generation
      logger.info(`Generating report from template: ${template.name}`);

      // Validate the report template
      validateReportTemplate(template);

      // Validate the report parameters
      validateReportParameters(parameters, template);

      // Create a new report object with basic metadata
      const report: IReport = {
        name: template.name,
        description: template.description,
        type: template.type,
        templateId: template.name, // Assuming template.name is the ID
        status: ReportStatus.DRAFT,
        sections: [],
        parameters: parameters || {},
        fileUrl: null as any,
        fileSize: 0,
        isScheduled: false,
        scheduleConfig: {},
        tags: template.tags,
        createdBy: template.createdBy,
        createdAt: new Date(),
        generatedAt: null as any,
        publishedAt: null as any,
        archivedAt: null as any,
        updatedAt: new Date()
      };

      // Process each section in the template
      for (const sectionTemplate of template.sections) {
        // Create a new section data object
        const sectionData: IReportSectionData = {
          id: sectionTemplate.id || uuidv4(),
          title: sectionTemplate.title,
          description: sectionTemplate.description,
          order: sectionTemplate.order,
          visualizations: []
        };

        // For each section, process its visualizations
        for (const visualizationConfig of sectionTemplate.visualizations) {
          // For each visualization, retrieve and process the corresponding query results
          const query = queries.get(visualizationConfig.queryId);
          if (!query) {
            logger.warn(`Query not found for visualization: ${visualizationConfig.id}`, { queryId: visualizationConfig.queryId });
            continue; // Skip this visualization if query is not found
          }

          // Apply parameters to the query
          const parameterizedQuery = applyParametersToQuery(query, parameters);

          // Retrieve query results
          const queryResult = queryResults.get(visualizationConfig.queryId) || [];

          // Format the data for the specific visualization type
          const visualizationData = this.processVisualization(visualizationConfig, queryResult);

          // Add the processed visualization to the section
          sectionData.visualizations.push(visualizationData);
        }

        // Add the completed section to the report
        report.sections.push(sectionData);
      }

      // Set the report status to GENERATED
      report.status = ReportStatus.GENERATED;
      report.generatedAt = new Date();

      // Return the generated report
      logger.info(`Report generated successfully: ${template.name}`);
      return report;
    } catch (error) {
      // Handle any errors during generation
      logger.error(`Report generation failed for template: ${template.name}`, { error });
      throw error;
    }
  }

  /**
   * Exports a report to the specified format
   * @param report - The report to export
   * @param format - The format to export to
   * @returns Export result with file information
   */
  async exportReport(report: IReport, format: ExportFormat): Promise<{ filePath: string; fileSize: number }> {
    try {
      // Log the start of report export
      logger.info(`Exporting report: ${report.name} to format: ${format}`);

      // Validate that the report is in GENERATED status
      if (report.status !== ReportStatus.GENERATED) {
        throw createError('Report must be in GENERATED status to export', { code: 'VAL_INVALID_STATE', details: { status: report.status } });
      }

      // Get the appropriate exporter for the specified format
      const exporter = this.getExporter(format);

      // Prepare the report directory
      const reportDir = await prepareReportDirectory();

      // Generate a file path for the report
      const reportFilePath = generateReportFilePath(reportDir, report.name, format);

      // Prepare the data for export by flattening the report structure
      const exportData = this.prepareDataForExport(report);

      // Call the exporter to generate the file
      const exportResult = await exporter.export(exportData, {
        ...report,
        fileName: reportFilePath
      });

      // Update report with file information
      report.fileUrl = exportResult.filePath;
      report.fileSize = exportResult.fileSize;

      // Return the file path and size
      logger.info(`Report exported successfully: ${report.name}`, { filePath: exportResult.filePath, fileSize: exportResult.fileSize });
      return exportResult;
    } catch (error) {
      // Handle any errors during export
      logger.error(`Report export failed for report: ${report.name}`, { error, format });
      throw error;
    }
  }

  /**
   * Processes data for a specific visualization
   * @param visualizationConfig - The visualization configuration
   * @param queryResult - The query result data
   * @returns Processed visualization data
   */
  processVisualization(
    visualizationConfig: IVisualizationConfig,
    queryResult: Array<Record<string, any>>
  ): IReportVisualizationData {
    try {
      // Create a new visualization data object
      const visualizationData: IReportVisualizationData = {
        id: visualizationConfig.id || uuidv4(),
        title: visualizationConfig.title,
        description: visualizationConfig.description,
        type: visualizationConfig.type,
        data: [],
        options: visualizationConfig.options || {},
        queryId: visualizationConfig.queryId
      };

      // Process the query result data using the data processor
      let processedData = queryResult;

      // Format the data for the specific visualization type
      processedData = this.formatDataForVisualization(processedData, visualizationConfig.type, visualizationConfig.options);

      // Apply any visualization-specific options
      visualizationData.data = processedData;

      // Return the processed visualization data
      return visualizationData;
    } catch (error) {
      // Handle any errors during visualization processing
      logger.error(`Visualization processing failed for visualization: ${visualizationConfig.id}`, { error, visualizationType: visualizationConfig.type });
      throw error;
    }
  }

  /**
   * Formats data for a specific visualization type
   * @param data - The data to format
   * @param visualizationType - The visualization type
   * @param options - Visualization-specific options
   * @returns Formatted data for visualization
   */
  formatDataForVisualization(
    data: Array<Record<string, any>>,
    visualizationType: VisualizationType,
    options: any = {}
  ): Array<Record<string, any>> {
    try {
      // Use the data processor to prepare data for the specific visualization type
      return this.dataProcessor.prepareForVisualization(data, visualizationType, options) as Array<Record<string, any>>;
    } catch (error) {
      // Handle any errors during data formatting
      logger.error(`Data formatting failed for visualization type: ${visualizationType}`, { error, options });
      throw error;
    }
  }

  /**
   * Prepares report data for export to various formats
   * @param report - The report to prepare data for
   * @returns Flattened data ready for export
   */
  prepareDataForExport(report: IReport): Array<Record<string, any>> {
    try {
      // Extract all visualization data from all sections
      const visualizationData = report.sections.flatMap(section => section.visualizations);

      // Flatten nested objects if needed
      let exportData = visualizationData.flatMap(visualization => visualization.data);

      // Apply consistent field naming
      exportData = exportData.map(record => {
        const formattedRecord: Record<string, any> = {};
        for (const key in record) {
          if (record.hasOwnProperty(key)) {
            const newKey = key.replace(/[^a-zA-Z0-9]/g, '_');
            formattedRecord[newKey] = record[key];
          }
        }
        return formattedRecord;
      });

      // Format values based on export requirements
      exportData = exportData.map(record => {
        const formattedRecord: Record<string, any> = {};
        for (const key in record) {
          if (record.hasOwnProperty(key)) {
            const value = record[key];
            if (value instanceof Date) {
              formattedRecord[key] = value.toISOString();
            } else {
              formattedRecord[key] = value;
            }
          }
        }
        return formattedRecord;
      });

      // Return the export-ready data
      return exportData;
    } catch (error) {
      // Handle any errors during data preparation
      logger.error('Data preparation failed for export', { error });
      throw error;
    }
  }

  /**
   * Registers an exporter for a specific format
   * @param format - The format to register the exporter for
   * @param exporter - The exporter instance
   */
  registerExporter(format: ExportFormat, exporter: any): void {
    // Validate that the exporter has an export method
    if (typeof exporter.export !== 'function') {
      throw new Error('Exporter must have an export method');
    }

    // Add the exporter to the exporters map with the format as key
    this.exporters.set(format, exporter);

    // Log the registration of the exporter
    logger.info(`Registered exporter for format: ${format}`);
  }

  /**
   * Gets the appropriate exporter for a format
   * @param format - The format to get the exporter for
   * @returns Exporter for the specified format
   */
  getExporter(format: ExportFormat): any {
    // Look up the exporter in the exporters map
    const exporter = this.exporters.get(format);

    // If no exporter found, throw an error
    if (!exporter) {
      throw new Error(`No exporter found for format: ${format}`);
    }

    // Return the exporter
    return exporter;
  }

  /**
   * Publishes a report, making it available to users
   * @param report - The report to publish
   * @returns Published report
   */
  async publishReport(report: IReport): Promise<IReport> {
    try {
      // Validate that the report is in GENERATED status
      if (report.status !== ReportStatus.GENERATED) {
        throw createError('Report must be in GENERATED status to publish', { code: 'VAL_INVALID_STATE', details: { status: report.status } });
      }

      // Update the report status to PUBLISHED
      report.status = ReportStatus.PUBLISHED;
      report.publishedAt = new Date();

      // Return the updated report
      logger.info(`Report published successfully: ${report.name}`);
      return report;
    } catch (error) {
      // Handle any errors during publishing
      logger.error(`Report publishing failed for report: ${report.name}`, { error });
      throw error;
    }
  }

  /**
   * Archives a report that is no longer needed
   * @param report - The report to archive
   * @returns Archived report
   */
  async archiveReport(report: IReport): Promise<IReport> {
    try {
      // Validate that the report is in PUBLISHED status
      if (report.status !== ReportStatus.PUBLISHED) {
        throw createError('Report must be in PUBLISHED status to archive', { code: 'VAL_INVALID_STATE', details: { status: report.status } });
      }

      // Update the report status to ARCHIVED
      report.status = ReportStatus.ARCHIVED;
      report.archivedAt = new Date();

      // Return the updated report
      logger.info(`Report archived successfully: ${report.name}`);
      return report;
    } catch (error) {
      // Handle any errors during archiving
      logger.error(`Report archiving failed for report: ${report.name}`, { error });
      throw error;
    }
  }
}

// Export the ReportGenerator class for use in the reporting service
export { ReportGenerator };

// Export utility function for validating report templates
export { validateReportTemplate };

// Export utility function for validating report parameters
export { validateReportParameters };

// Default export of the ReportGenerator class
export default ReportGenerator;