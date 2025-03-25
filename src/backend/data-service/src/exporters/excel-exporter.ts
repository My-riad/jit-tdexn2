import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs'; // exceljs@4.3.0
import { IDataExport, ExportFormat } from '../models/data-export.model';
import { logger } from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';

// Temp directory for exports, configurable via environment variable
const TEMP_EXPORT_DIR = process.env.TEMP_EXPORT_DIR || './temp/exports';

/**
 * Validates the export configuration to ensure it has all required properties for Excel export
 * @param exportConfig The export configuration to validate
 */
function validateExportConfig(exportConfig: IDataExport): void {
  if (!exportConfig) {
    throw createError('Export configuration is required', {
      code: 'VAL_MISSING_FIELD',
      details: { field: 'exportConfig' }
    });
  }

  if (exportConfig.format !== ExportFormat.EXCEL) {
    throw createError('Invalid export format', {
      code: 'VAL_INVALID_FORMAT',
      details: { format: exportConfig.format, expectedFormat: ExportFormat.EXCEL }
    });
  }

  if (!exportConfig.fileName) {
    throw createError('File name is required for export', {
      code: 'VAL_MISSING_FIELD',
      details: { field: 'fileName' }
    });
  }
}

/**
 * Creates the export directory if it doesn't exist
 * @returns Path to the export directory
 */
async function prepareExportDirectory(): Promise<string> {
  // Create base export directory if it doesn't exist
  if (!fs.existsSync(TEMP_EXPORT_DIR)) {
    fs.mkdirSync(TEMP_EXPORT_DIR, { recursive: true });
  }

  // Create a date-based subdirectory for better organization
  const today = new Date();
  const dateDir = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const exportDir = path.join(TEMP_EXPORT_DIR, dateDir);

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  return exportDir;
}

/**
 * Generates a file path for the Excel export file
 * @param exportDir The directory where the file will be saved
 * @param fileName The name of the file to save
 * @returns Full path to the Excel file
 */
function generateExcelFilePath(exportDir: string, fileName: string): string {
  // Sanitize file name to remove invalid characters
  const sanitizedFileName = fileName.replace(/[\\/:*?"<>|]/g, '-');
  
  // Ensure fileName has .xlsx extension
  const excelFileName = sanitizedFileName.endsWith('.xlsx') 
    ? sanitizedFileName 
    : `${sanitizedFileName}.xlsx`;
  
  return path.join(exportDir, excelFileName);
}

/**
 * Extracts column headers from the data
 * @param data The data array to extract headers from
 * @returns Array of column headers
 */
function getColumnHeaders(data: Array<Record<string, any>>): string[] {
  if (!data || data.length === 0) {
    return [];
  }

  // Extract all unique keys from all objects in the data
  const keySet = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => keySet.add(key));
  });

  return Array.from(keySet);
}

/**
 * Formats column headers to be more readable
 * @param headers Array of column headers to format
 * @returns Formatted column headers
 */
function formatColumnHeaders(headers: string[]): string[] {
  return headers.map(header => {
    // Convert camelCase to Title Case with spaces
    const formatted = header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    // Replace underscores with spaces
    return formatted.replace(/_/g, ' ');
  });
}

/**
 * Adds metadata to the Excel workbook
 * @param workbook The workbook to add metadata to
 * @param exportConfig The export configuration containing metadata
 */
function addWorkbookMetadata(workbook: ExcelJS.Workbook, exportConfig: IDataExport): void {
  workbook.creator = 'Export Service';
  workbook.lastModifiedBy = 'Export Service';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Set properties from export configuration
  workbook.properties.title = exportConfig.name || 'Data Export';
  workbook.properties.subject = 'Data Export';
  workbook.properties.description = exportConfig.description || '';
  workbook.properties.keywords = 'export, data, freight optimization';
  workbook.properties.category = 'Reports';
  workbook.properties.company = 'Freight Optimization Platform';
}

/**
 * Converts data to Excel format using the provided export configuration
 * @param data The data to convert to Excel
 * @param exportConfig The export configuration
 * @returns Path to the generated Excel file
 */
async function convertToExcel(data: Array<Record<string, any>>, exportConfig: IDataExport): Promise<string> {
  // Validate the export configuration
  validateExportConfig(exportConfig);

  try {
    // Prepare the export directory
    const exportDir = await prepareExportDirectory();
    
    // Generate the Excel file path
    const filePath = generateExcelFilePath(exportDir, exportConfig.fileName);
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata to the workbook
    addWorkbookMetadata(workbook, exportConfig);
    
    // Add a worksheet
    const sheetName = exportConfig.sheetName || 'Data';
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Get column headers (either from data or from exportConfig)
    const headers = getColumnHeaders(data);
    const formattedHeaders = formatColumnHeaders(headers);
    
    // Only add headers if includeHeaders is true or undefined (default true)
    if (exportConfig.includeHeaders !== false && headers.length > 0) {
      // Add header row with styling
      const headerRow = worksheet.addRow(formattedHeaders);
      
      // Style the header row
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' } // Light gray background
        };
        cell.border = {
          bottom: { style: 'thin' }
        };
      });
      
      // Freeze the header row
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
      ];
    }
    
    // Add data rows
    if (data && data.length > 0) {
      data.forEach(item => {
        const rowData = headers.map(header => item[header] ?? '');
        worksheet.addRow(rowData);
      });
    }
    
    // Auto-filter the header row if there are headers
    if (exportConfig.includeHeaders !== false && headers.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length }
      };
    }
    
    // Auto-size columns for better readability
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellValue = cell.text || '';
        const cellLength = cellValue.length;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      
      // Set column width (with a minimum of 10 and maximum of 50)
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
    
    // Save the workbook to the file path
    await workbook.xlsx.writeFile(filePath);
    
    logger.info(`Excel file exported successfully`, { filePath, rowCount: data.length });
    
    return filePath;
  } catch (error) {
    logger.error('Failed to convert data to Excel', { error });
    throw createError('Failed to convert data to Excel', {
      code: 'SRV_INTERNAL_ERROR',
      details: { originalError: error }
    });
  }
}

/**
 * Class that handles exporting data to Excel format
 */
export class ExcelExporter {
  /**
   * Exports data to Excel format based on the provided configuration
   * @param data The data to export
   * @param exportConfig The export configuration
   * @returns Object containing the file path, row count, and file size
   */
  async export(data: Array<Record<string, any>>, exportConfig: IDataExport): Promise<{ filePath: string, rowCount: number, fileSize: number }> {
    logger.info('Starting Excel export process');
    
    try {
      // Validate that data is an array
      if (!Array.isArray(data)) {
        throw createError('Data must be an array for Excel export', {
          code: 'VAL_INVALID_INPUT',
          details: { type: typeof data }
        });
      }
      
      // Generate the Excel file
      const filePath = await convertToExcel(data, exportConfig);
      
      // Get file stats (size)
      const stats = fs.statSync(filePath);
      
      return {
        filePath,
        rowCount: data.length,
        fileSize: stats.size
      };
    } catch (error) {
      logger.error('Excel export failed', { error });
      throw createError('Excel export failed', {
        code: 'SRV_INTERNAL_ERROR',
        details: { originalError: error }
      });
    }
  }
  
  /**
   * Checks if this exporter supports the given format
   * @param format The format to check
   * @returns True if the format is supported, false otherwise
   */
  supportsFormat(format: ExportFormat): boolean {
    return format === ExportFormat.EXCEL;
  }
}

export default ExcelExporter;