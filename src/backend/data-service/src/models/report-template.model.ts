import mongoose, { Schema, Document } from 'mongoose';
import { AnalyticsQueryType } from '../models/analytics-query.model';

/**
 * Types of reports that can be created from templates
 */
export enum ReportType {
  /** Reports focused on efficiency metrics and optimizations */
  EFFICIENCY = 'EFFICIENCY',
  /** Reports focused on financial metrics and analysis */
  FINANCIAL = 'FINANCIAL',
  /** Reports focused on operational metrics and status */
  OPERATIONAL = 'OPERATIONAL',
  /** Reports focused on driver performance metrics */
  DRIVER_PERFORMANCE = 'DRIVER_PERFORMANCE',
  /** Reports focused on fleet utilization analysis */
  FLEET_UTILIZATION = 'FLEET_UTILIZATION',
  /** Custom report types defined by users */
  CUSTOM = 'CUSTOM'
}

/**
 * Types of visualizations that can be included in report templates
 */
export enum VisualizationType {
  /** Bar chart visualization */
  BAR_CHART = 'BAR_CHART',
  /** Line chart visualization */
  LINE_CHART = 'LINE_CHART',
  /** Pie chart visualization */
  PIE_CHART = 'PIE_CHART',
  /** Gauge chart visualization */
  GAUGE_CHART = 'GAUGE_CHART',
  /** Table visualization */
  TABLE = 'TABLE',
  /** Score card visualization */
  SCORE_CARD = 'SCORE_CARD',
  /** Progress bar visualization */
  PROGRESS_BAR = 'PROGRESS_BAR',
  /** Heat map visualization */
  HEAT_MAP = 'HEAT_MAP'
}

/**
 * Standard page sizes for report templates
 */
export enum PageSize {
  /** A4 paper size (210 × 297mm) */
  A4 = 'A4',
  /** US Letter size (8.5 × 11 inches) */
  LETTER = 'LETTER',
  /** US Legal size (8.5 × 14 inches) */
  LEGAL = 'LEGAL'
}

/**
 * Page orientation options for report templates
 */
export enum PageOrientation {
  /** Portrait orientation (taller than wide) */
  PORTRAIT = 'PORTRAIT',
  /** Landscape orientation (wider than tall) */
  LANDSCAPE = 'LANDSCAPE'
}

/**
 * Interface defining the configuration for a visualization within a report template
 */
export interface IVisualizationConfig {
  /** Unique identifier for the visualization */
  id: string;
  /** Title of the visualization */
  title: string;
  /** Optional description of the visualization */
  description: string;
  /** The type of visualization */
  type: VisualizationType;
  /** Reference to the analytics query that provides data */
  queryId: string;
  /** Width of the visualization in pixels or percentage */
  width: number;
  /** Height of the visualization in pixels */
  height: number;
  /** Additional options specific to the visualization type */
  options: {
    /** Color scheme for the visualization */
    colors?: string[];
    /** Whether to show a legend */
    showLegend?: boolean;
    /** Legend position if shown */
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
    /** Additional visualization-specific options */
    [key: string]: any;
  };
  /** Mapping of data fields to visualization properties */
  dataMapping: {
    /** X-axis field mapping */
    xAxis?: string;
    /** Y-axis field mapping */
    yAxis?: string;
    /** Series field mapping */
    series?: string;
    /** Value field mapping */
    value?: string;
    /** Label field mapping */
    label?: string;
    /** Additional data mapping properties */
    [key: string]: any;
  };
}

/**
 * Interface defining a section within a report template
 */
export interface IReportSection {
  /** Unique identifier for the section */
  id: string;
  /** Title of the section */
  title: string;
  /** Optional description of the section */
  description: string;
  /** Order of the section within the report */
  order: number;
  /** Visualizations included in the section */
  visualizations: IVisualizationConfig[];
}

/**
 * Interface defining the structure of a report template
 */
export interface IReportTemplate {
  /** Name of the report template */
  name: string;
  /** Description of the report template */
  description: string;
  /** Type of report */
  type: ReportType;
  /** Sections included in the report */
  sections: IReportSection[];
  /** Page size for the report */
  pageSize: PageSize;
  /** Page orientation for the report */
  pageOrientation: PageOrientation;
  /** HTML/CSS template for the report header */
  headerTemplate: string;
  /** HTML/CSS template for the report footer */
  footerTemplate: string;
  /** CSS styles for the report */
  styleTemplate: string;
  /** Parameter definitions that can be provided when generating reports */
  parameterDefinitions: {
    /** Definition of each parameter */
    [key: string]: {
      /** Data type of the parameter */
      type: string;
      /** Default value for the parameter */
      defaultValue?: any;
      /** Whether the parameter is required */
      required: boolean;
      /** Description of the parameter */
      description?: string;
    };
  };
  /** Whether this is a default template */
  isDefault: boolean;
  /** Tags for categorizing and searching templates */
  tags: string[];
  /** User or service that created the template */
  createdBy: string;
  /** When the template was created */
  createdAt: Date;
  /** When the template was last updated */
  updatedAt: Date;
}

/**
 * Mongoose document interface for report templates
 */
export interface IReportTemplateDocument extends IReportTemplate, Document {}

// Schema for visualization configuration
const visualizationConfigSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { 
    type: String, 
    enum: Object.values(VisualizationType),
    required: true 
  },
  queryId: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  options: {
    type: Schema.Types.Mixed,
    default: () => ({})
  },
  dataMapping: {
    type: Schema.Types.Mixed,
    default: () => ({})
  }
}, { _id: false });

// Schema for report sections
const reportSectionSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, required: true, min: 0 },
  visualizations: [visualizationConfigSchema]
}, { _id: false });

/**
 * Mongoose schema for report templates
 */
export const reportTemplateSchema = new Schema({
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
  sections: [reportSectionSchema],
  pageSize: { 
    type: String, 
    enum: Object.values(PageSize), 
    default: PageSize.A4 
  },
  pageOrientation: { 
    type: String, 
    enum: Object.values(PageOrientation), 
    default: PageOrientation.PORTRAIT 
  },
  headerTemplate: { 
    type: String, 
    default: '' 
  },
  footerTemplate: { 
    type: String, 
    default: '' 
  },
  styleTemplate: { 
    type: String, 
    default: '' 
  },
  parameterDefinitions: {
    type: Schema.Types.Mixed,
    default: () => ({})
  },
  isDefault: { 
    type: Boolean, 
    default: false,
    index: true
  },
  tags: { 
    type: [String], 
    default: [] 
  },
  createdBy: { 
    type: String, 
    required: true,
    index: true
  }
}, { 
  timestamps: true, 
  versionKey: false,
  collection: 'report_templates'
});

// Add indexes for commonly queried fields
reportTemplateSchema.index({ createdAt: -1 });
reportTemplateSchema.index({ type: 1, isDefault: 1 });
reportTemplateSchema.index({ tags: 1 });

/**
 * Mongoose model for report templates
 */
export const ReportTemplate = mongoose.model<IReportTemplateDocument>('ReportTemplate', reportTemplateSchema);

export default ReportTemplate;