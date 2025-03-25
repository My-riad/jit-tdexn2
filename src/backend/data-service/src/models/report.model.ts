import mongoose, { Schema, Document } from 'mongoose';
import { ReportType } from '../models/report-template.model';

/**
 * Possible statuses of a report
 */
export enum ReportStatus {
  /** Report in draft state, not yet fully generated */
  DRAFT = 'DRAFT',
  /** Report has been successfully generated */
  GENERATED = 'GENERATED',
  /** Report has been published and is available to users */
  PUBLISHED = 'PUBLISHED',
  /** Report has been archived */
  ARCHIVED = 'ARCHIVED',
  /** Report generation failed */
  FAILED = 'FAILED'
}

/**
 * Interface defining the structure of visualization data within a report
 */
export interface IReportVisualizationData {
  /** Unique identifier for the visualization */
  id: string;
  /** Title of the visualization */
  title: string;
  /** Description of the visualization */
  description: string;
  /** Type of visualization (bar chart, line chart, etc.) */
  type: string;
  /** The actual data for the visualization */
  data: Array<Record<string, any>>;
  /** Visualization-specific options */
  options: Record<string, any>;
  /** Reference to the analytics query that produced this data */
  queryId: string;
}

/**
 * Interface defining the structure of a section within a report
 */
export interface IReportSectionData {
  /** Unique identifier for the section */
  id: string;
  /** Title of the section */
  title: string;
  /** Description of the section */
  description: string;
  /** Order of the section within the report */
  order: number;
  /** Visualizations included in this section */
  visualizations: IReportVisualizationData[];
}

/**
 * Interface defining the structure of a report
 */
export interface IReport {
  /** Name of the report */
  name: string;
  /** Description of the report */
  description: string;
  /** Type of report */
  type: ReportType;
  /** ID of the template used to generate this report */
  templateId: string;
  /** Current status of the report */
  status: ReportStatus;
  /** Sections containing the report content */
  sections: IReportSectionData[];
  /** Parameters used when generating the report */
  parameters: Record<string, any>;
  /** URL to the generated report file (PDF, etc.) */
  fileUrl: string;
  /** Size of the generated file in bytes */
  fileSize: number;
  /** Whether this report is scheduled for regular generation */
  isScheduled: boolean;
  /** Configuration for scheduled generation */
  scheduleConfig: Record<string, any>;
  /** Tags for categorizing and searching reports */
  tags: string[];
  /** User or service that created the report */
  createdBy: string;
  /** When the report was created */
  createdAt: Date;
  /** When the report was generated */
  generatedAt: Date;
  /** When the report was published */
  publishedAt: Date;
  /** When the report was archived */
  archivedAt: Date;
  /** When the report was last updated */
  updatedAt: Date;
}

/**
 * Mongoose document interface for reports
 */
export interface IReportDocument extends IReport, Document {}

/**
 * Schema for report visualization data
 */
const reportVisualizationDataSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, required: true },
  data: { 
    type: [Schema.Types.Mixed],
    default: []
  },
  options: { 
    type: Schema.Types.Mixed,
    default: {}
  },
  queryId: { type: String, required: true }
}, { _id: false });

/**
 * Schema for report section data
 */
const reportSectionDataSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, required: true, min: 0 },
  visualizations: [reportVisualizationDataSchema]
}, { _id: false });

/**
 * Mongoose schema for reports
 */
export const reportSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    index: true
  },
  description: { 
    type: String, 
    trim: true 
  },
  type: { 
    type: String, 
    enum: Object.values(ReportType), 
    required: true,
    index: true
  },
  templateId: { 
    type: String,
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: Object.values(ReportStatus), 
    default: ReportStatus.DRAFT,
    index: true
  },
  sections: [reportSectionDataSchema],
  parameters: {
    type: Schema.Types.Mixed,
    default: {}
  },
  fileUrl: { 
    type: String 
  },
  fileSize: { 
    type: Number, 
    min: 0 
  },
  isScheduled: { 
    type: Boolean, 
    default: false,
    index: true
  },
  scheduleConfig: {
    type: Schema.Types.Mixed,
    default: {}
  },
  tags: { 
    type: [String], 
    default: [] 
  },
  createdBy: { 
    type: String, 
    required: true,
    index: true
  },
  generatedAt: { 
    type: Date 
  },
  publishedAt: { 
    type: Date 
  },
  archivedAt: { 
    type: Date 
  }
}, { 
  timestamps: true, 
  versionKey: false,
  collection: 'reports'
});

// Add indexes for commonly queried fields
reportSchema.index({ createdAt: -1 });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ isScheduled: 1, status: 1 });

/**
 * Mongoose model for reports
 */
export const Report = mongoose.model<IReportDocument>('Report', reportSchema);

export default Report;