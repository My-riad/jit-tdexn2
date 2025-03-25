/**
 * Demand Forecast Model
 * 
 * This file defines the data models and interfaces for demand forecasts in the 
 * freight optimization platform. Demand forecasts represent predictions of freight 
 * demand across different regions, lanes, and equipment types, enabling proactive 
 * positioning of trucks, dynamic pricing adjustments, and identification of market 
 * opportunities.
 * 
 * Key components:
 * - Regional forecasts: Demand predictions for specific geographic areas
 * - Lane forecasts: Demand predictions for specific origin-destination pairs
 * - Confidence metrics: Indicators of prediction reliability
 * - Temporal dimensions: Different forecast timeframes (24h, 48h, 7d, 30d)
 */

import { Document, Schema, model } from 'mongoose'; // mongoose v6.0.0
import { Position } from '../../../common/interfaces/position.interface';
import { EquipmentType } from '../../../common/interfaces/load.interface';

/**
 * Enumeration of time periods for demand forecasts
 */
export enum ForecastTimeframe {
  NEXT_24_HOURS = 'NEXT_24_HOURS',
  NEXT_48_HOURS = 'NEXT_48_HOURS',
  NEXT_7_DAYS = 'NEXT_7_DAYS',
  NEXT_30_DAYS = 'NEXT_30_DAYS'
}

/**
 * Enumeration of confidence levels for forecast predictions
 */
export enum ForecastConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Enumeration of demand intensity levels for forecasts
 */
export enum DemandLevel {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW'
}

/**
 * Interface for region-specific demand forecasts
 * Represents demand predictions for a specific geographic region
 */
export interface RegionalDemandForecast {
  /** Region identifier (e.g., "Midwest", "Chicago Area") */
  region: string;
  
  /** Geographic center of the region */
  center: {
    latitude: number;
    longitude: number;
  };
  
  /** Radius of the region in miles */
  radius: number;
  
  /** Demand levels by equipment type */
  demand_levels: {
    [key in EquipmentType]?: DemandLevel;
  };
  
  /** Expected number of loads by equipment type */
  expected_load_count: {
    [key in EquipmentType]?: number;
  };
  
  /** Expected rate change as percentage (e.g., 0.05 for 5% increase) */
  expected_rate_change: {
    [key in EquipmentType]?: number;
  };
  
  /** Confidence score from 0-100 */
  confidence_score: number;
}

/**
 * Interface for lane-specific demand forecasts between origin-destination pairs
 * Represents demand predictions for specific freight lanes between regions
 */
export interface LaneDemandForecast {
  /** Origin region identifier */
  origin_region: string;
  
  /** Destination region identifier */
  destination_region: string;
  
  /** Geographic coordinates of origin */
  origin_coordinates: {
    latitude: number;
    longitude: number;
  };
  
  /** Geographic coordinates of destination */
  destination_coordinates: {
    latitude: number;
    longitude: number;
  };
  
  /** Demand levels by equipment type */
  demand_levels: {
    [key in EquipmentType]?: DemandLevel;
  };
  
  /** Expected number of loads by equipment type */
  expected_load_count: {
    [key in EquipmentType]?: number;
  };
  
  /** Expected rate change as percentage (e.g., 0.05 for 5% increase) */
  expected_rate_change: {
    [key in EquipmentType]?: number;
  };
  
  /** Confidence score from 0-100 */
  confidence_score: number;
}

/**
 * Main interface for demand forecasts with regional and lane predictions
 * Represents a complete forecast instance with all predictions and metadata
 */
export interface DemandForecast {
  /** Unique identifier for this forecast */
  forecast_id: string;
  
  /** Time period this forecast covers */
  timeframe: ForecastTimeframe;
  
  /** When this forecast was generated */
  generated_at: Date;
  
  /** When this forecast expires */
  valid_until: Date;
  
  /** Overall confidence level classification */
  confidence_level: ForecastConfidenceLevel;
  
  /** Overall confidence score from 0-100 */
  overall_confidence_score: number;
  
  /** Region-specific forecasts */
  regional_forecasts: RegionalDemandForecast[];
  
  /** Lane-specific forecasts */
  lane_forecasts: LaneDemandForecast[];
  
  /** Factors influencing this forecast (e.g., weather, seasonality) with weights */
  factors: {
    [key: string]: number;
  };
  
  /** Version of the forecasting model used */
  model_version: string;
}

/**
 * MongoDB document interface extending DemandForecast for database operations
 */
export interface DemandForecastDocument extends DemandForecast, Document {}

/**
 * Interface for query parameters when retrieving forecasts
 * Used to filter forecast results based on various criteria
 */
export interface ForecastQueryParams {
  /** Time period to query */
  timeframe?: ForecastTimeframe;
  
  /** Filter by region */
  region?: string;
  
  /** Filter by equipment type */
  equipment_type?: EquipmentType;
  
  /** Filter by origin region (for lane forecasts) */
  origin_region?: string;
  
  /** Filter by destination region (for lane forecasts) */
  destination_region?: string;
  
  /** Minimum confidence score (0-100) */
  min_confidence?: number;
  
  /** Minimum demand level */
  min_demand_level?: DemandLevel;
}

/**
 * Mongoose schema for the demand forecast model
 * Defines the structure and validation for forecast documents in MongoDB
 */
export const DemandForecastSchema = new Schema<DemandForecastDocument>({
  forecast_id: {
    type: String,
    required: true,
    unique: true
  },
  timeframe: {
    type: String,
    enum: Object.values(ForecastTimeframe),
    required: true
  },
  generated_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  valid_until: {
    type: Date,
    required: true
  },
  confidence_level: {
    type: String,
    enum: Object.values(ForecastConfidenceLevel),
    required: true
  },
  overall_confidence_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  regional_forecasts: [{
    region: {
      type: String,
      required: true
    },
    center: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    radius: {
      type: Number,
      required: true
    },
    demand_levels: {
      type: Map,
      of: {
        type: String,
        enum: Object.values(DemandLevel)
      }
    },
    expected_load_count: {
      type: Map,
      of: Number
    },
    expected_rate_change: {
      type: Map,
      of: Number
    },
    confidence_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  lane_forecasts: [{
    origin_region: {
      type: String,
      required: true
    },
    destination_region: {
      type: String,
      required: true
    },
    origin_coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    destination_coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    demand_levels: {
      type: Map,
      of: {
        type: String,
        enum: Object.values(DemandLevel)
      }
    },
    expected_load_count: {
      type: Map,
      of: Number
    },
    expected_rate_change: {
      type: Map,
      of: Number
    },
    confidence_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  factors: {
    type: Map,
    of: Number
  },
  model_version: {
    type: String,
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  },
  collection: 'demand_forecasts'
});

// Create indexes on frequently queried fields for performance
DemandForecastSchema.index({ timeframe: 1 });
DemandForecastSchema.index({ 'regional_forecasts.region': 1 });
DemandForecastSchema.index({ 'lane_forecasts.origin_region': 1, 'lane_forecasts.destination_region': 1 });
DemandForecastSchema.index({ valid_until: 1 });
DemandForecastSchema.index({ generated_at: 1 });
DemandForecastSchema.index({ overall_confidence_score: 1 });

/**
 * Mongoose model for DemandForecast documents in MongoDB
 */
export const DemandForecastModel = model<DemandForecastDocument>('DemandForecast', DemandForecastSchema);