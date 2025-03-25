/**
 * Smart Hub Model for Optimization Engine
 * 
 * Defines the Mongoose model and extended interfaces for Smart Hubs within the optimization engine.
 * Smart Hubs are strategically identified locations where drivers can exchange loads to optimize
 * network efficiency. This model extends the base SmartHub interface with optimization-specific
 * properties and provides database operations for Smart Hub management.
 */

import { Document, Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { 
  SmartHub, 
  SmartHubType, 
  SmartHubAmenity, 
  SmartHubCreationParams,
  SmartHubUpdateParams
} from '../../../common/interfaces/smartHub.interface';
import logger from '../../../common/utils/logger';

/**
 * Extended Smart Hub interface with optimization-specific properties
 */
export interface OptimizationSmartHub extends SmartHub {
  /**
   * Metrics related to network optimization
   */
  optimization_metrics: {
    /**
     * Impact score of this hub on the overall network efficiency (0-100)
     */
    network_impact: number;
    
    /**
     * Score representing the geographic coverage importance (0-100)
     */
    geographic_coverage: number;
    
    /**
     * Current utilization rate as percentage of capacity (0-100)
     */
    utilization_rate: number;
  };
  
  /**
   * Historical performance metrics for this hub
   */
  historical_performance: {
    /**
     * Total number of load exchanges performed at this hub
     */
    exchange_count: number;
    
    /**
     * Percentage of successful exchanges without issues
     */
    success_rate: number;
    
    /**
     * Average waiting time in minutes for exchanges at this hub
     */
    average_wait_time: number;
  };
}

/**
 * Interface that extends OptimizationSmartHub with Mongoose Document properties
 */
export interface SmartHubDocument extends OptimizationSmartHub, Document {}

/**
 * Interface for recommended new Smart Hub locations based on network analysis
 */
export interface SmartHubRecommendation {
  /**
   * Recommended geographic location for the new Smart Hub
   */
  location: {
    latitude: number;
    longitude: number;
  };
  
  /**
   * Optimization score for this recommendation (0-100)
   */
  score: number;
  
  /**
   * Estimated impact of establishing a Smart Hub at this location
   */
  estimated_impact: {
    empty_miles_reduction: number;
    exchanges_per_day: number;
  };
  
  /**
   * Existing facilities near the recommended location
   */
  nearby_facilities: {
    name: string;
    distance: number; // In miles
    type: string;
  }[];
  
  /**
   * Recommended capacity for the new Smart Hub
   */
  recommended_capacity: number;
  
  /**
   * Recommended amenities for the new Smart Hub
   */
  recommended_amenities: SmartHubAmenity[];
}

/**
 * Mongoose schema for the Smart Hub model
 */
export const smartHubSchema = new Schema<SmartHubDocument>({
  hub_id: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  hub_type: { 
    type: String, 
    enum: Object.values(SmartHubType),
    required: true 
  },
  latitude: { 
    type: Number, 
    required: true
  },
  longitude: { 
    type: Number, 
    required: true
  },
  // GeoJSON location field for geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] format for GeoJSON
      required: true
    }
  },
  address: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  state: { 
    type: String, 
    required: true 
  },
  zip: { 
    type: String, 
    required: true 
  },
  amenities: [{ 
    type: String, 
    enum: Object.values(SmartHubAmenity) 
  }],
  capacity: { 
    type: Number, 
    required: true,
    min: 1
  },
  operating_hours: {
    open: { type: String, required: true },
    close: { type: String, required: true },
    days: [{ type: Number, min: 0, max: 6 }]
  },
  efficiency_score: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 50
  },
  optimization_metrics: {
    network_impact: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100,
      default: 50
    },
    geographic_coverage: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100,
      default: 50
    },
    utilization_rate: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100,
      default: 0
    }
  },
  historical_performance: {
    exchange_count: { 
      type: Number, 
      required: true,
      default: 0,
      min: 0
    },
    success_rate: { 
      type: Number, 
      required: true,
      default: 100,
      min: 0,
      max: 100
    },
    average_wait_time: { 
      type: Number, 
      required: true,
      default: 0,
      min: 0
    }
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Create a 2dsphere index for geospatial queries
smartHubSchema.index({ location: '2dsphere' });

/**
 * Mongoose model for Smart Hub database operations
 */
export const SmartHubModel = model<SmartHubDocument>('SmartHub', smartHubSchema);

/**
 * Creates a new Smart Hub with a generated UUID and default values
 * @param params Parameters for creating the Smart Hub
 * @returns The created Smart Hub with optimization properties
 */
export const createSmartHub = async (params: SmartHubCreationParams): Promise<OptimizationSmartHub> => {
  try {
    logger.info(`Creating new Smart Hub: ${params.name}`, { location: `${params.latitude},${params.longitude}` });
    
    // Generate a unique ID for the new Smart Hub
    const hub_id = uuidv4();
    
    // Calculate initial efficiency score based on amenities and location
    const initialScore = calculateInitialEfficiencyScore(params);
    
    // Create the Smart Hub document with default optimization metrics
    const smartHub = await SmartHubModel.create({
      hub_id,
      ...params,
      // Set GeoJSON location field for geospatial queries
      location: {
        type: 'Point',
        coordinates: [params.longitude, params.latitude]
      },
      efficiency_score: initialScore,
      optimization_metrics: {
        network_impact: calculateNetworkImpact(params.latitude, params.longitude),
        geographic_coverage: calculateGeographicCoverage(params.latitude, params.longitude),
        utilization_rate: 0  // New hub starts with 0 utilization
      },
      historical_performance: {
        exchange_count: 0,  // New hub starts with 0 exchanges
        success_rate: 100,  // Default to 100% success rate
        average_wait_time: 0 // Default to 0 minutes wait time
      },
      active: true
    });
    
    logger.info(`Successfully created Smart Hub with ID: ${hub_id}`);
    return smartHub.toObject() as OptimizationSmartHub;
  } catch (error) {
    logger.error('Error creating Smart Hub', { error });
    throw error;
  }
};

/**
 * Retrieves a Smart Hub by its ID
 * @param hubId The ID of the Smart Hub to retrieve
 * @returns The Smart Hub if found, null otherwise
 */
export const getSmartHubById = async (hubId: string): Promise<OptimizationSmartHub | null> => {
  try {
    logger.info(`Retrieving Smart Hub with ID: ${hubId}`);
    
    const smartHub = await SmartHubModel.findOne({ hub_id: hubId });
    
    if (!smartHub) {
      logger.info(`Smart Hub with ID ${hubId} not found`);
      return null;
    }
    
    return smartHub.toObject() as OptimizationSmartHub;
  } catch (error) {
    logger.error(`Error retrieving Smart Hub with ID: ${hubId}`, { error });
    throw error;
  }
};

/**
 * Updates a Smart Hub with new data
 * @param hubId The ID of the Smart Hub to update
 * @param updateParams The parameters to update
 * @returns The updated Smart Hub if found, null otherwise
 */
export const updateSmartHub = async (
  hubId: string, 
  updateParams: SmartHubUpdateParams
): Promise<OptimizationSmartHub | null> => {
  try {
    logger.info(`Updating Smart Hub with ID: ${hubId}`);
    
    // Check if the hub exists
    const existingHub = await SmartHubModel.findOne({ hub_id: hubId });
    
    if (!existingHub) {
      logger.info(`Smart Hub with ID ${hubId} not found for update`);
      return null;
    }
    
    const updates: any = { ...updateParams };
    
    // If location is updated, recalculate optimization metrics
    if (updateParams.latitude !== undefined || updateParams.longitude !== undefined) {
      logger.info(`Location updated for Smart Hub ${hubId}, recalculating optimization metrics`);
      
      const newLatitude = updateParams.latitude !== undefined ? updateParams.latitude : existingHub.latitude;
      const newLongitude = updateParams.longitude !== undefined ? updateParams.longitude : existingHub.longitude;
      
      // Update the location field for geospatial queries
      updates.location = {
        type: 'Point',
        coordinates: [newLongitude, newLatitude]
      };
      
      // Update optimization metrics based on new location
      updates.optimization_metrics = {
        ...(existingHub.optimization_metrics?.toObject() || {}),
        network_impact: calculateNetworkImpact(newLatitude, newLongitude),
        geographic_coverage: calculateGeographicCoverage(newLatitude, newLongitude)
      };
    }
    
    // Update the Smart Hub
    const updatedHub = await SmartHubModel.findOneAndUpdate(
      { hub_id: hubId },
      { 
        ...updates,
        updated_at: new Date()
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedHub) {
      logger.info(`Smart Hub with ID ${hubId} not found after update attempt`);
      return null;
    }
    
    logger.info(`Successfully updated Smart Hub with ID: ${hubId}`);
    return updatedHub.toObject() as OptimizationSmartHub;
  } catch (error) {
    logger.error(`Error updating Smart Hub with ID: ${hubId}`, { error });
    throw error;
  }
};

/**
 * Finds Smart Hubs near a specified location within a given radius
 * @param latitude The latitude coordinate of the center point
 * @param longitude The longitude coordinate of the center point
 * @param radiusInMiles The search radius in miles
 * @param filters Optional filters for hub type, amenities, and other properties
 * @returns Array of nearby Smart Hubs
 */
export const findNearbyHubs = async (
  latitude: number,
  longitude: number,
  radiusInMiles: number,
  filters: {
    hubTypes?: SmartHubType[];
    amenities?: SmartHubAmenity[];
    minCapacity?: number;
    minEfficiencyScore?: number;
    activeOnly?: boolean;
  } = {}
): Promise<OptimizationSmartHub[]> => {
  try {
    logger.info(`Finding Smart Hubs near location: ${latitude},${longitude} within ${radiusInMiles} miles`);
    
    // Convert miles to meters for geospatial query (1 mile ≈ 1609.34 meters)
    const radiusInMeters = radiusInMiles * 1609.34;
    
    // Build query object
    const query: any = {
      // Geospatial query to find locations within the radius
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude] // GeoJSON uses [longitude, latitude] order
          },
          $maxDistance: radiusInMeters
        }
      }
    };
    
    // Add filters if provided
    if (filters.hubTypes && filters.hubTypes.length > 0) {
      query.hub_type = { $in: filters.hubTypes };
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $all: filters.amenities };
    }
    
    if (filters.minCapacity !== undefined) {
      query.capacity = { $gte: filters.minCapacity };
    }
    
    if (filters.minEfficiencyScore !== undefined) {
      query.efficiency_score = { $gte: filters.minEfficiencyScore };
    }
    
    if (filters.activeOnly) {
      query.active = true;
    }
    
    // Execute the query
    const nearbyHubs = await SmartHubModel.find(query).exec();
    
    logger.info(`Found ${nearbyHubs.length} Smart Hubs near location: ${latitude},${longitude}`);
    return nearbyHubs.map(hub => hub.toObject() as OptimizationSmartHub);
  } catch (error) {
    logger.error(`Error finding nearby Smart Hubs`, { error, location: `${latitude},${longitude}` });
    throw error;
  }
};

/**
 * Calculates an initial efficiency score for a new Smart Hub based on its properties
 * This is a simplified calculation - a real implementation would be more sophisticated
 * @param params The Smart Hub creation parameters
 * @returns Initial efficiency score (0-100)
 */
const calculateInitialEfficiencyScore = (params: SmartHubCreationParams): number => {
  // Base score
  let score = 50;
  
  // Adjust based on number of amenities (more amenities = better score)
  score += Math.min(params.amenities.length * 5, 25);
  
  // Adjust based on capacity (higher capacity = better score)
  score += Math.min(params.capacity / 5, 15);
  
  // Adjust based on operating hours (more hours = better score)
  const hoursOpen = calculateDailyOperatingHours(params.operating_hours);
  score += Math.min(hoursOpen / 2, 10);
  
  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(score, 100));
};

/**
 * Calculates the network impact score for a location
 * This is a placeholder implementation - a real implementation would use network analysis
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @returns Network impact score (0-100)
 */
const calculateNetworkImpact = (latitude: number, longitude: number): number => {
  // In a real implementation, this would analyze the location's impact on the network
  // For now, we'll just return a default value
  return 50;
};

/**
 * Calculates the geographic coverage score for a location
 * This is a placeholder implementation - a real implementation would analyze coverage
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @returns Geographic coverage score (0-100)
 */
const calculateGeographicCoverage = (latitude: number, longitude: number): number => {
  // In a real implementation, this would analyze how the location improves network coverage
  // For now, we'll just return a default value
  return 50;
};

/**
 * Calculates the average daily operating hours of a Smart Hub
 * @param operatingHours The operating hours object
 * @returns Average daily operating hours
 */
const calculateDailyOperatingHours = (operatingHours: { open: string; close: string; days: number[] }): number => {
  // Parse hours from strings like "08:00" and "22:00"
  const openHour = parseInt(operatingHours.open.split(':')[0]);
  const openMinute = parseInt(operatingHours.open.split(':')[1]);
  const closeHour = parseInt(operatingHours.close.split(':')[0]);
  const closeMinute = parseInt(operatingHours.close.split(':')[1]);
  
  // Calculate total minutes open
  let minutesOpen = (closeHour * 60 + closeMinute) - (openHour * 60 + openMinute);
  
  // Handle overnight hours (e.g., 22:00 to 06:00)
  if (minutesOpen <= 0) {
    minutesOpen += 24 * 60; // Add 24 hours in minutes
  }
  
  // Convert to hours
  return minutesOpen / 60;
};