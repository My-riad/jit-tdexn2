import { Document, Schema, model } from 'mongoose'; // mongoose@^7.4.3
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { OptimizationJobType } from './optimization-job.model';
import { Load } from '../../../common/interfaces/load.interface';
import { Driver } from '../../../common/interfaces/driver.interface';
import { SmartHub } from '../../../common/interfaces/smartHub.interface';
import logger from '../../../common/utils/logger';

/**
 * Interface for load-driver matches produced by optimization algorithms
 */
export interface LoadMatch {
  driver_id: string;
  load_id: string;
  score: number;
  empty_miles_saved: number;
  network_contribution: number;
  estimated_earnings: number;
  compatibility_factors: Record<string, number>;
}

/**
 * Interface for recommended Smart Hub locations from optimization algorithms
 */
export interface SmartHubRecommendation {
  location: { latitude: number; longitude: number };
  score: number;
  estimated_impact: { empty_miles_reduction: number; exchanges_per_day: number };
  nearby_facilities: { name: string; distance: number; type: string }[];
  recommended_capacity: number;
  recommended_amenities: string[];
}

/**
 * Interface for segments of a relay plan with driver assignments
 */
export interface RelaySegment {
  segment_id: string;
  driver_id: string;
  start_location: { latitude: number; longitude: number; name: string };
  end_location: { latitude: number; longitude: number; name: string };
  estimated_distance: number;
  estimated_duration: number;
  estimated_start_time: Date;
  estimated_end_time: Date;
}

/**
 * Interface for handoff locations where drivers exchange loads in a relay plan
 */
export interface HandoffLocation {
  hub_id: string;
  name: string;
  location: { latitude: number; longitude: number };
  scheduled_time: Date;
  instructions: string;
}

/**
 * Interface for relay plans with multiple drivers handling segments of a load
 */
export interface RelayPlan {
  plan_id: string;
  load_id: string;
  segments: RelaySegment[];
  handoff_locations: HandoffLocation[];
  total_distance: number;
  total_duration: number;
  efficiency_score: number;
  estimated_savings: number;
  empty_miles_saved: number;
}

/**
 * Interface for demand forecasts predicting load and truck availability
 */
export interface DemandForecast {
  region: string;
  time_window: { start: Date; end: Date };
  load_demand: number;
  truck_supply: number;
  confidence: number;
  hotspots: { latitude: number; longitude: number; intensity: number }[];
}

/**
 * Interface for network-wide optimization metrics
 */
export interface NetworkOptimizationMetrics {
  total_loads: number;
  total_drivers: number;
  matched_loads: number;
  matched_drivers: number;
  total_miles: number;
  loaded_miles: number;
  empty_miles: number;
  empty_miles_percentage: number;
  network_efficiency_score: number;
}

/**
 * Main interface for optimization results containing various types of optimization outputs
 */
export interface OptimizationResult {
  result_id: string;
  job_id: string;
  job_type: OptimizationJobType;
  load_matches: LoadMatch[];
  smart_hub_recommendations: SmartHubRecommendation[];
  relay_plans: RelayPlan[];
  demand_forecasts: DemandForecast[];
  network_metrics: NetworkOptimizationMetrics;
  created_at: Date;
}

/**
 * Interface that extends OptimizationResult with Mongoose Document properties
 */
export interface OptimizationResultDocument extends OptimizationResult, Document {}

/**
 * Parameters required for creating a new optimization result
 */
export interface OptimizationResultCreationParams {
  job_id: string;
  job_type: OptimizationJobType;
  load_matches: LoadMatch[];
  smart_hub_recommendations: SmartHubRecommendation[];
  relay_plans: RelayPlan[];
  demand_forecasts: DemandForecast[];
  network_metrics: NetworkOptimizationMetrics;
}

/**
 * Mongoose schema definition for the optimization result model
 */
export const optimizationResultSchema = new Schema<OptimizationResultDocument>({
  result_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
  load_matches: [{
    driver_id: {
      type: String,
      required: true
    },
    load_id: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    empty_miles_saved: {
      type: Number,
      required: true
    },
    network_contribution: {
      type: Number,
      required: true
    },
    estimated_earnings: {
      type: Number,
      required: true
    },
    compatibility_factors: {
      type: Map,
      of: Number
    }
  }],
  smart_hub_recommendations: [{
    location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    estimated_impact: {
      empty_miles_reduction: {
        type: Number,
        required: true
      },
      exchanges_per_day: {
        type: Number,
        required: true
      }
    },
    nearby_facilities: [{
      name: {
        type: String,
        required: true
      },
      distance: {
        type: Number,
        required: true
      },
      type: {
        type: String,
        required: true
      }
    }],
    recommended_capacity: {
      type: Number,
      required: true
    },
    recommended_amenities: [{
      type: String,
      required: true
    }]
  }],
  relay_plans: [{
    plan_id: {
      type: String,
      required: true
    },
    load_id: {
      type: String,
      required: true
    },
    segments: [{
      segment_id: {
        type: String,
        required: true
      },
      driver_id: {
        type: String,
        required: true
      },
      start_location: {
        latitude: {
          type: Number,
          required: true
        },
        longitude: {
          type: Number,
          required: true
        },
        name: {
          type: String,
          required: true
        }
      },
      end_location: {
        latitude: {
          type: Number,
          required: true
        },
        longitude: {
          type: Number,
          required: true
        },
        name: {
          type: String,
          required: true
        }
      },
      estimated_distance: {
        type: Number,
        required: true
      },
      estimated_duration: {
        type: Number,
        required: true
      },
      estimated_start_time: {
        type: Date,
        required: true
      },
      estimated_end_time: {
        type: Date,
        required: true
      }
    }],
    handoff_locations: [{
      hub_id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      location: {
        latitude: {
          type: Number,
          required: true
        },
        longitude: {
          type: Number,
          required: true
        }
      },
      scheduled_time: {
        type: Date,
        required: true
      },
      instructions: {
        type: String,
        required: false
      }
    }],
    total_distance: {
      type: Number,
      required: true
    },
    total_duration: {
      type: Number,
      required: true
    },
    efficiency_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    estimated_savings: {
      type: Number,
      required: true
    },
    empty_miles_saved: {
      type: Number,
      required: true
    }
  }],
  demand_forecasts: [{
    region: {
      type: String,
      required: true
    },
    time_window: {
      start: {
        type: Date,
        required: true
      },
      end: {
        type: Date,
        required: true
      }
    },
    load_demand: {
      type: Number,
      required: true
    },
    truck_supply: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    hotspots: [{
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },
      intensity: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      }
    }]
  }],
  network_metrics: {
    total_loads: {
      type: Number,
      required: true
    },
    total_drivers: {
      type: Number,
      required: true
    },
    matched_loads: {
      type: Number,
      required: true
    },
    matched_drivers: {
      type: Number,
      required: true
    },
    total_miles: {
      type: Number,
      required: true
    },
    loaded_miles: {
      type: Number,
      required: true
    },
    empty_miles: {
      type: Number,
      required: true
    },
    empty_miles_percentage: {
      type: Number,
      required: true
    },
    network_efficiency_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  versionKey: false
});

// Add compound indexes to optimize queries
optimizationResultSchema.index({ job_type: 1, created_at: -1 });

/**
 * Mongoose model for optimization result database operations
 */
export const OptimizationResultModel = model<OptimizationResultDocument>(
  'OptimizationResult',
  optimizationResultSchema
);

/**
 * Helper function to create a new optimization result with a generated ID
 * @param params The optimization result creation parameters
 * @returns The created optimization result
 */
export const createOptimizationResult = async (
  params: OptimizationResultCreationParams
): Promise<OptimizationResult> => {
  try {
    const resultId = uuidv4();
    const optimizationResult = new OptimizationResultModel({
      result_id: resultId,
      job_id: params.job_id,
      job_type: params.job_type,
      load_matches: params.load_matches || [],
      smart_hub_recommendations: params.smart_hub_recommendations || [],
      relay_plans: params.relay_plans || [],
      demand_forecasts: params.demand_forecasts || [],
      network_metrics: params.network_metrics,
      created_at: new Date()
    });

    await optimizationResult.save();
    
    logger.info(`Created optimization result with ID: ${resultId}`, {
      jobId: params.job_id,
      jobType: params.job_type
    });
    
    return optimizationResult;
  } catch (error) {
    logger.error('Failed to create optimization result', { error });
    throw error;
  }
};

/**
 * Helper function to retrieve an optimization result by its ID
 * @param resultId The ID of the result to retrieve
 * @returns The optimization result if found, null otherwise
 */
export const getOptimizationResultById = async (
  resultId: string
): Promise<OptimizationResult | null> => {
  try {
    const result = await OptimizationResultModel.findOne({ result_id: resultId });
    
    if (!result) {
      logger.info(`Optimization result not found: ${resultId}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Error retrieving optimization result: ${resultId}`, { error });
    throw error;
  }
};

/**
 * Helper function to retrieve an optimization result by its associated job ID
 * @param jobId The ID of the job associated with the result
 * @returns The optimization result if found, null otherwise
 */
export const getOptimizationResultByJobId = async (
  jobId: string
): Promise<OptimizationResult | null> => {
  try {
    const result = await OptimizationResultModel.findOne({ job_id: jobId });
    
    if (!result) {
      logger.info(`Optimization result not found for job ID: ${jobId}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Error retrieving optimization result for job ID: ${jobId}`, { error });
    throw error;
  }
};