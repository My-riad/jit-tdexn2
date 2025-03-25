import { Document, Schema, model } from 'mongoose'; // mongoose@^7.4.3
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import logger from '../../../common/utils/logger';

/**
 * Enum defining the types of optimization jobs the system can perform
 */
export enum OptimizationJobType {
  LOAD_MATCHING = 'LOAD_MATCHING',
  SMART_HUB_IDENTIFICATION = 'SMART_HUB_IDENTIFICATION',
  RELAY_PLANNING = 'RELAY_PLANNING',
  NETWORK_OPTIMIZATION = 'NETWORK_OPTIMIZATION',
  DEMAND_PREDICTION = 'DEMAND_PREDICTION'
}

/**
 * Enum defining the possible statuses of an optimization job
 */
export enum OptimizationJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Interface for defining constraints to be applied during optimization
 */
export interface OptimizationConstraint {
  type: string;
  value: any;
  weight: number;
}

/**
 * Interface for parameters that configure an optimization job
 */
export interface OptimizationParameters {
  region: string;
  timeWindow: {
    start: Date;
    end: Date;
  };
  constraints: OptimizationConstraint[];
  optimizationGoal: string;
  weights: Record<string, number>;
  maxIterations?: number;
  additionalParams?: Record<string, any>;
}

/**
 * Main interface for optimization job entities in the system
 */
export interface OptimizationJob {
  job_id: string;
  job_type: OptimizationJobType;
  status: OptimizationJobStatus;
  parameters: OptimizationParameters;
  priority: number;
  progress: number;
  result_id?: string;
  error?: {
    message: string;
    stack?: string;
  };
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  processing_time_ms?: number;
  created_by: string;
}

/**
 * Interface that extends the OptimizationJob with Mongoose Document properties
 */
export interface OptimizationJobDocument extends OptimizationJob, Document {}

/**
 * Parameters required for creating a new optimization job
 */
export interface OptimizationJobCreationParams {
  job_type: OptimizationJobType;
  parameters: OptimizationParameters;
  priority?: number;
  created_by: string;
}

/**
 * Parameters for updating an existing optimization job
 */
export interface OptimizationJobUpdateParams {
  status?: OptimizationJobStatus;
  progress?: number;
  result_id?: string;
  error?: {
    message: string;
    stack?: string;
  };
  started_at?: Date;
  completed_at?: Date;
  processing_time_ms?: number;
}

/**
 * Simplified optimization job information for list views and summaries
 */
export interface OptimizationJobSummary {
  job_id: string;
  job_type: OptimizationJobType;
  status: OptimizationJobStatus;
  region: string;
  progress: number;
  created_at: Date;
  processing_time_ms?: number;
}

/**
 * Mongoose schema definition for the optimization job model
 */
export const optimizationJobSchema = new Schema<OptimizationJobDocument>({
  job_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  job_type: {
    type: String,
    required: true,
    enum: Object.values(OptimizationJobType)
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(OptimizationJobStatus),
    default: OptimizationJobStatus.PENDING,
    index: true
  },
  parameters: {
    region: {
      type: String,
      required: true,
      index: true
    },
    timeWindow: {
      start: {
        type: Date,
        required: true
      },
      end: {
        type: Date,
        required: true
      }
    },
    constraints: [{
      type: {
        type: String,
        required: true
      },
      value: {
        type: Schema.Types.Mixed,
        required: true
      },
      weight: {
        type: Number,
        required: true
      }
    }],
    optimizationGoal: {
      type: String,
      required: true
    },
    weights: {
      type: Map,
      of: Number
    },
    maxIterations: {
      type: Number
    },
    additionalParams: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  priority: {
    type: Number,
    required: true,
    default: 5,
    min: 1,
    max: 10,
    index: true
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  result_id: {
    type: String,
    index: true
  },
  error: {
    message: String,
    stack: String
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  processing_time_ms: {
    type: Number
  },
  created_by: {
    type: String,
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  versionKey: false
});

// Add compound indexes to optimize queries
optimizationJobSchema.index({ status: 1, job_type: 1, priority: -1 });
optimizationJobSchema.index({ 'parameters.region': 1, status: 1 });
optimizationJobSchema.index({ created_at: -1 });

// Add a pre-save hook to validate time windows
optimizationJobSchema.pre('save', function(next) {
  const job = this;
  if (job.parameters.timeWindow.start >= job.parameters.timeWindow.end) {
    const error = new Error('Time window start must be before end time');
    logger.error('Validation error in OptimizationJob', { error });
    return next(error);
  }
  next();
});

/**
 * Mongoose model for optimization job database operations
 */
export const OptimizationJobModel = model<OptimizationJobDocument>('OptimizationJob', optimizationJobSchema);

/**
 * Helper function to create a new optimization job with a generated ID
 * @param params The job creation parameters
 * @returns The created job document
 */
export const createOptimizationJob = async (params: OptimizationJobCreationParams): Promise<OptimizationJobDocument> => {
  try {
    const jobId = uuidv4();
    const job = new OptimizationJobModel({
      job_id: jobId,
      job_type: params.job_type,
      parameters: params.parameters,
      priority: params.priority || 5,
      status: OptimizationJobStatus.PENDING,
      progress: 0,
      created_at: new Date(),
      created_by: params.created_by
    });
    
    const savedJob = await job.save();
    logger.info(`Created optimization job with ID: ${jobId}`, { 
      jobType: params.job_type,
      region: params.parameters.region
    });
    
    return savedJob;
  } catch (error) {
    logger.error('Failed to create optimization job', { error });
    throw error;
  }
};

/**
 * Helper function to update the status of an optimization job
 * @param jobId The ID of the job to update
 * @param updateParams The parameters to update
 * @returns The updated job document
 */
export const updateOptimizationJobStatus = async (
  jobId: string, 
  updateParams: OptimizationJobUpdateParams
): Promise<OptimizationJobDocument | null> => {
  try {
    const updates: Record<string, any> = {};
    
    if (updateParams.status) {
      updates.status = updateParams.status;
    }
    
    if (updateParams.progress !== undefined) {
      updates.progress = updateParams.progress;
    }
    
    if (updateParams.result_id) {
      updates.result_id = updateParams.result_id;
    }
    
    if (updateParams.error) {
      updates.error = updateParams.error;
    }
    
    if (updateParams.started_at) {
      updates.started_at = updateParams.started_at;
    }
    
    if (updateParams.completed_at) {
      updates.completed_at = updateParams.completed_at;
    }
    
    if (updateParams.processing_time_ms !== undefined) {
      updates.processing_time_ms = updateParams.processing_time_ms;
    }
    
    // Special case for transition to PROCESSING
    if (updateParams.status === OptimizationJobStatus.PROCESSING && !updateParams.started_at) {
      updates.started_at = new Date();
    }
    
    // Special case for transition to COMPLETED or FAILED
    if ((updateParams.status === OptimizationJobStatus.COMPLETED || 
         updateParams.status === OptimizationJobStatus.FAILED) && 
        !updateParams.completed_at) {
      updates.completed_at = new Date();
      
      // Calculate processing time if not provided
      if (updateParams.processing_time_ms === undefined) {
        const job = await OptimizationJobModel.findOne({ job_id: jobId });
        if (job && job.started_at) {
          updates.processing_time_ms = new Date().getTime() - job.started_at.getTime();
        }
      }
    }
    
    const updatedJob = await OptimizationJobModel.findOneAndUpdate(
      { job_id: jobId },
      { $set: updates },
      { new: true }
    );
    
    if (updatedJob) {
      logger.info(`Updated optimization job status: ${jobId}`, { 
        jobType: updatedJob.job_type,
        newStatus: updateParams.status,
        progress: updateParams.progress
      });
    } else {
      logger.error(`Failed to update optimization job: ${jobId} - Job not found`);
    }
    
    return updatedJob;
  } catch (error) {
    logger.error(`Failed to update optimization job: ${jobId}`, { error });
    throw error;
  }
};

/**
 * Helper function to retrieve an optimization job by its ID
 * @param jobId The ID of the job to retrieve
 * @returns The job document or null if not found
 */
export const getOptimizationJobById = async (jobId: string): Promise<OptimizationJobDocument | null> => {
  try {
    const job = await OptimizationJobModel.findOne({ job_id: jobId });
    
    if (!job) {
      logger.info(`Optimization job not found: ${jobId}`);
    }
    
    return job;
  } catch (error) {
    logger.error(`Error retrieving optimization job: ${jobId}`, { error });
    throw error;
  }
};