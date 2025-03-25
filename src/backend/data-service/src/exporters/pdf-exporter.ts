import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit'; // pdfkit@3.0.1
import Table from 'pdfkit-table'; // pdfkit-table@0.1.99
import { IDataExport, ExportFormat } from '../models/data-export.model';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';

// Directory where temporary exports will be stored
const TEMP_EXPORT_DIR = process.env.TEMP_EXPORT_DIR || './temp/exports';

/**
 * Validates the export configuration to ensure it has all required properties for PDF export
 * 
 * @param exportConfig The export configuration to validate
 * @throws Error if validation fails
 */
function validateExportConfig(exportConfig: IDataExport): void {
  if (!exportConfig) {
    throw createError('Export configuration is required', {
      code: 'VAL_MISSING_FIELD',
      details: { field: 'exportConfig' }
    });
  }
  
  if (exportConfig.format !== ExportFormat.PDF) {
    throw createError('Invalid export format. Expected PDF', {
      code: 'VAL_INVALID_FORMAT',
      details: { format: exportConfig.format, expectedFormat: ExportFormat.PDF }
    });
  }
  
  if (!exportConfig.fileName) {
    throw createError('File name is required for PDF export', {
      code: 'VAL_MISSING_FIELD',
      details: { field: 'fileName' }
    });
  }
}

/**
 * Creates the export directory if it doesn't exist
 * 
 * @returns The path to the export directory
 */
async function prepareExportDirectory(): Promise<string> {
  // Ensure base directory exists
  if (!fs.existsSync(TEMP_EXPORT_DIR)) {
    fs.mkdirSync(TEMP_EXPORT_DIR, { recursive: true });
  }
  
  // Create date-based subdirectory for better organization
  const date = new Date();
  const dateDirName = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  const exportDir = path.join(TEMP_EXPORT_DIR, dateDirName);
  
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  return exportDir;
}

/**
 * Generates a file path for the PDF export file
 * 
 * @param exportDir The directory where the file will be stored
 * @param fileName The name of the file
 * @returns The full path to the PDF file
 */
function generatePdfFilePath(exportDir: string, fileName: string): string {
  // Sanitize fileName to remove any invalid characters
  const sanitizedFileName = fileName.replace(/[/\\?%*:|"<>]/g, '-');
  
  // Ensure fileName has the .pdf extension
  const fileNameWithExt = sanitizedFileName.endsWith('.pdf') 
    ? sanitizedFileName 
    : `${sanitizedFileName}.pdf`;
  
  return path.join(exportDir, fileNameWithExt);
}

/**
 * Converts data to PDF format using the provided export configuration
 *
 * @param data The data to convert to PDF
 * @param exportConfig The export configuration
 * @returns The path to the generated PDF file
 */
async function convertToPdf(data: Array<Record<string, any>>, exportConfig: IDataExport): Promise<string> {
  try {
    // Validate export configuration
    validateExportConfig(exportConfig);
    
    // Prepare export directory
    const exportDir = await prepareExportDirectory();
    
    // Generate file path
    const filePath = generatePdfFilePath(exportDir, exportConfig.fileName);
    
    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      autoFirstPage: true,
      // Set page orientation based on configuration or default to portrait
      layout: exportConfig.parameters?.orientation === 'landscape' ? 'landscape' : 'portrait'
    }) as PDFDocument & { table: (options: any) => Promise<void> };
    
    // Create a write stream to the file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Add document metadata
    addDocumentMetadata(doc, exportConfig);
    
    // Add title and description
    doc.fontSize(18).text(exportConfig.name || 'Data Export', {
      align: 'center'
    });
    
    if (exportConfig.description) {
      doc.moveDown()
        .fontSize(12)
        .text(exportConfig.description, {
          align: 'center'
        });
    }
    
    doc.moveDown().moveDown();
    
    // Extract column headers if includeHeaders is true (default: true)
    const includeHeaders = exportConfig.includeHeaders !== false;
    let headers: string[] = [];
    
    if (includeHeaders && data.length > 0) {
      headers = getColumnHeaders(data);
    }
    
    // Format the column headers for better readability
    const formattedHeaders = formatColumnHeaders(headers);
    
    // Create a table with the data
    if (data.length > 0) {
      // Format data for the table with proper headers
      const formattedData = formatDataForTable(data, headers);
      
      // Create table
      await doc.table({
        headers: includeHeaders ? formattedHeaders : [],
        rows: formattedData,
        widths: Array(headers.length).fill('*'), // Equal width columns
        padding: 10
      });
    } else {
      // No data to display
      doc.fontSize(12).text('No data available for this export.', {
        align: 'center'
      });
    }
    
    // Add pagination
    const totalPages = doc.bufferedPageRange().count;
    let currentPage = 0;
    
    for (let i = 0; i < totalPages; i++) {
      currentPage = i;
      doc.switchToPage(i);
      
      // Add page number at the bottom
      doc.fontSize(10)
        .text(
          `Page ${currentPage + 1} of ${totalPages}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
    }
    
    // Add timestamp and export info in footer
    doc.fontSize(8)
      .text(
        `Exported on: ${new Date().toLocaleString()} | Freight Optimization Platform`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );
    
    // Finalize PDF and end stream
    doc.end();
    
    // Wait for the stream to finish
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(filePath);
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    logger.error('Error generating PDF export', { error });
    throw error;
  }
}

/**
 * Extracts column headers from the data
 * 
 * @param data The data to extract headers from
 * @returns Array of column headers
 */
function getColumnHeaders(data: Array<Record<string, any>>): string[] {
  if (!data || data.length === 0) {
    return [];
  }
  
  // Get all unique keys from all objects in the data array
  const headerSet = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => headerSet.add(key));
  });
  
  return Array.from(headerSet);
}

/**
 * Formats column headers to be more readable
 * 
 * @param headers The headers to format
 * @returns Formatted column headers
 */
function formatColumnHeaders(headers: string[]): string[] {
  return headers.map(header => {
    // Convert camelCase to Title Case with spaces
    const formatted = header
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize the first letter
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim(); // Remove extra spaces
    
    return formatted;
  });
}

/**
 * Adds metadata to the PDF document
 * 
 * @param doc The PDF document
 * @param exportConfig The export configuration
 */
function addDocumentMetadata(doc: PDFDocument, exportConfig: IDataExport): void {
  // Add document metadata
  doc.info.Title = exportConfig.name || 'Data Export';
  doc.info.Author = 'Freight Optimization Platform';
  doc.info.Subject = 'Data Export';
  doc.info.Keywords = 'freight, optimization, export, data';
  doc.info.CreationDate = new Date();
}

/**
 * Formats data for display in the PDF table
 * 
 * @param data The data to format
 * @param headers The column headers
 * @returns Formatted data rows for the table
 */
function formatDataForTable(data: Array<Record<string, any>>, headers: string[]): Array<string[]> {
  return data.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Format different value types appropriately
      if (value === null || value === undefined) {
        return '';
      } else if (value instanceof Date) {
        return value.toLocaleString();
      } else if (typeof value === 'object') {
        return JSON.stringify(value);
      } else {
        return String(value);
      }
    });
  });
}

/**
 * Class that handles exporting data to PDF format
 */
export class PdfExporter {
  /**
   * Exports data to PDF format based on the provided configuration
   * 
   * @param data The data to export
   * @param exportConfig The export configuration
   * @returns Export result with file information
   */
  async export(data: Array<Record<string, any>>, exportConfig: IDataExport): Promise<{ filePath: string, rowCount: number, fileSize: number }> {
    try {
      logger.info('Starting PDF export', { exportName: exportConfig.name });
      
      // Validate that data is an array
      if (!Array.isArray(data)) {
        throw createError('Data must be an array for PDF export', {
          code: 'VAL_INVALID_INPUT',
          details: { expectedType: 'array' }
        });
      }
      
      // Convert data to PDF
      const filePath = await convertToPdf(data, exportConfig);
      
      // Get file statistics
      const stats = fs.statSync(filePath);
      
      return {
        filePath,
        rowCount: data.length,
        fileSize: stats.size
      };
    } catch (error) {
      logger.error('PDF export failed', { error, exportName: exportConfig.name });
      throw createError('Failed to export data to PDF', {
        code: 'SRV_INTERNAL_ERROR',
        details: { originalError: error }
      });
    }
  }
  
  /**
   * Checks if this exporter supports the given format
   * 
   * @param format The format to check
   * @returns True if the format is supported, false otherwise
   */
  supportsFormat(format: ExportFormat): boolean {
    return format === ExportFormat.PDF;
  }
}

// Export both as named export and default export
export default PdfExporter;