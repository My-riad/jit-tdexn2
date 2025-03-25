import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Enum defining the supported export formats
 */
export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json'
}

/**
 * Enum defining the possible statuses of an export job
 */
export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

/**
 * Interface defining the structure of a data export configuration and job
 */
export interface IDataExport {
  // Basic information
  name: string;
  description: string;
  format: ExportFormat;
  fileName: string;
  
  // Data source
  queryId?: string;  // Reference to a saved query
  reportId?: string; // Reference to a report
  
  // Export configuration
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  includeHeaders?: boolean;
  delimiter?: string;  // For CSV exports
  sheetName?: string;  // For Excel exports
  
  // Job status and result
  status: ExportStatus;
  filePath?: string;
  fileUrl?: string;
  fileSize?: number;
  rowCount?: number;
  error?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;  // When the export file will be deleted
}

/**
 * Interface extending IDataExport with Mongoose Document properties
 */
export interface IDataExportDocument extends IDataExport, Document {}

/**
 * Mongoose schema definition for data exports
 */
export const dataExportSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  format: {
    type: String,
    enum: Object.values(ExportFormat),
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  queryId: {
    type: Schema.Types.ObjectId,
    ref: 'Query'
  },
  reportId: {
    type: Schema.Types.ObjectId,
    ref: 'Report'
  },
  filters: {
    type: Schema.Types.Mixed
  },
  parameters: {
    type: Schema.Types.Mixed
  },
  includeHeaders: {
    type: Boolean,
    default: true
  },
  delimiter: {
    type: String,
    default: ','
  },
  sheetName: {
    type: String,
    default: 'Data Export'
  },
  status: {
    type: String,
    enum: Object.values(ExportStatus),
    default: ExportStatus.PENDING,
    required: true
  },
  filePath: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileSize: {
    type: Number
  },
  rowCount: {
    type: Number
  },
  error: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

/**
 * Mongoose model for data exports
 */
export const DataExport: Model<IDataExportDocument> = mongoose.model<IDataExportDocument>(
  'DataExport',
  dataExportSchema
);

export default DataExport;