import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify'; // csv-stringify@6.2.3
import { IDataExport, ExportFormat } from '../models/data-export.model';
import logger from '../../../common/utils/logger';
import { createError } from '../../../common/utils/error-handler';

// Directory for temporary export files
const TEMP_EXPORT_DIR = process.env.TEMP_EXPORT_DIR || './temp/exports';

/**
 * Validates the export configuration to ensure it has all required properties for CSV export
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

  if (exportConfig.format !== ExportFormat.CSV) {
    throw createError('Invalid export format, expected CSV', {
      code: 'VAL_INVALID_FORMAT',
      details: { provided: exportConfig.format, expected: ExportFormat.CSV }
    });
  }

  if (!exportConfig.fileName) {
    throw createError('File name is required for export', {
      code: 'VAL_MISSING_FIELD',
      details: { field: 'fileName' }
    });
  }

  // Validate delimiter if provided
  if (exportConfig.delimiter && exportConfig.delimiter.length !== 1) {
    throw createError('Delimiter must be a single character', {
      code: 'VAL_INVALID_FORMAT',
      details: { field: 'delimiter', value: exportConfig.delimiter }
    });
  }
}

/**
 * Creates the export directory if it doesn't exist
 * @returns Path to the export directory
 */
async function prepareExportDirectory(): Promise<string> {
  // Ensure base export directory exists
  if (!fs.existsSync(TEMP_EXPORT_DIR)) {
    fs.mkdirSync(TEMP_EXPORT_DIR, { recursive: true });
  }

  // Create a date-based subdirectory for better organization
  const date = new Date();
  const dateDirName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const exportDir = path.join(TEMP_EXPORT_DIR, dateDirName);
  
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  return exportDir;
}

/**
 * Generates a file path for the CSV export file
 * @param exportDir Directory where the file will be stored
 * @param fileName Name of the file
 * @returns Full path to the CSV file
 */
function generateCsvFilePath(exportDir: string, fileName: string): string {
  // Sanitize the fileName to remove invalid characters
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  
  // Ensure the fileName has a .csv extension
  const fileNameWithExt = sanitizedFileName.endsWith('.csv') 
    ? sanitizedFileName 
    : `${sanitizedFileName}.csv`;
  
  return path.join(exportDir, fileNameWithExt);
}

/**
 * Extracts column headers from the data
 * @param data Array of data objects
 * @returns Array of column headers
 */
function getColumnHeaders(data: Array<Record<string, any>>): string[] {
  if (!data || data.length === 0) {
    return [];
  }

  // Get all unique keys from all objects in the data array
  const headers = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => headers.add(key));
  });

  return Array.from(headers);
}

/**
 * Formats column headers to be more readable
 * @param headers Array of column headers
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
 * Converts data to CSV format using the provided export configuration
 * @param data Array of data objects to convert to CSV
 * @param exportConfig Export configuration options
 * @returns Path to the generated CSV file
 */
async function convertToCsv(data: Array<Record<string, any>>, exportConfig: IDataExport): Promise<string> {
  try {
    // Validate the export configuration
    validateExportConfig(exportConfig);

    // Prepare the export directory
    const exportDir = await prepareExportDirectory();
    
    // Generate the CSV file path
    const filePath = generateCsvFilePath(exportDir, exportConfig.fileName);

    // Get column headers from data if includeHeaders is true
    const headers = exportConfig.includeHeaders !== false ? getColumnHeaders(data) : [];
    
    // Format column headers for better readability if needed
    const formattedHeaders = exportConfig.includeHeaders !== false 
      ? formatColumnHeaders(headers)
      : [];
    
    // Configure csv-stringify options
    const options = {
      header: exportConfig.includeHeaders !== false,
      columns: exportConfig.includeHeaders !== false ? headers.map((header, index) => ({
        key: header,
        header: formattedHeaders[index]
      })) : undefined,
      delimiter: exportConfig.delimiter || ',',
    };

    // Create a promise that resolves when the CSV is written
    return new Promise<string>((resolve, reject) => {
      const stringifier = stringify(data, options);
      const writeStream = fs.createWriteStream(filePath);
      
      writeStream.on('finish', () => {
        resolve(filePath);
      });
      
      writeStream.on('error', (error) => {
        reject(error);
      });
      
      stringifier.on('error', (error) => {
        reject(error);
      });
      
      stringifier.pipe(writeStream);
    });
  } catch (error) {
    logger.error('Error converting data to CSV', { error });
    throw error;
  }
}

/**
 * Class that handles exporting data to CSV format
 */
export class CsvExporter {
  /**
   * Exports data to CSV format based on the provided configuration
   * @param data Array of data objects to export
   * @param exportConfig Export configuration options
   * @returns Object containing the file path, row count, and file size
   */
  async export(data: Array<Record<string, any>>, exportConfig: IDataExport): Promise<{ filePath: string, rowCount: number, fileSize: number }> {
    try {
      logger.info('Starting CSV export process', { fileName: exportConfig.fileName });

      if (!Array.isArray(data)) {
        throw createError('Data must be an array for CSV export', {
          code: 'VAL_INVALID_INPUT',
          details: { type: typeof data }
        });
      }

      // Convert data to CSV and get file path
      const filePath = await convertToCsv(data, exportConfig);

      // Get file stats
      const stats = fs.statSync(filePath);

      return {
        filePath,
        rowCount: data.length,
        fileSize: stats.size
      };
    } catch (error) {
      logger.error('CSV export failed', { error, fileName: exportConfig.fileName });
      throw createError('Failed to export data to CSV', {
        code: 'SRV_INTERNAL_ERROR',
        details: { originalError: error }
      });
    }
  }

  /**
   * Checks if this exporter supports the given format
   * @param format Export format to check
   * @returns True if the format is supported, false otherwise
   */
  supportsFormat(format: ExportFormat): boolean {
    return format === ExportFormat.CSV;
  }
}

export default CsvExporter;