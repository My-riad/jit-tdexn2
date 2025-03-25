import axios from 'axios';
import moment from 'moment';

import { EntityType, Position } from '../../common/interfaces/position.interface';
import { LoadStatus } from '../../common/interfaces/load.interface';
import { calculateDistance } from '../../common/utils/geo-utils';
import { PositionModel } from '../models/position.model';
import { HistoricalPositionModel } from '../models/historical-position.model';
import logger from '../../common/utils/logger';

// Constants for ETA calculation
const DEFAULT_SPEED_KMH = 65;
const TRAFFIC_FACTOR_WEIGHT = 0.3;
const HISTORICAL_SPEED_WEIGHT = 0.4;
const CURRENT_SPEED_WEIGHT = 0.3;
const MIN_CONFIDENCE_LEVEL = 0.5;
const MAX_CONFIDENCE_LEVEL = 0.95;

/**
 * Calculates the estimated time of arrival for an entity to a destination
 *
 * @param entityId - Unique identifier for the entity (driver, vehicle, load)
 * @param entityType - Type of the entity
 * @param destLatitude - Destination latitude
 * @param destLongitude - Destination longitude
 * @param options - Additional options for calculation
 * @returns Promise with ETA information including arrival time, confidence level, and factors
 */
export async function calculateETA(
  entityId: string,
  entityType: EntityType,
  destLatitude: number,
  destLongitude: number,
  options: {
    includeTraffic?: boolean;
    useHistoricalData?: boolean;
    adjustForDriverBehavior?: boolean;
    loadStatus?: LoadStatus;
  } = {}
): Promise<{
  arrivalTime: Date;
  confidenceLevel: number;
  remainingDistance: number;
  estimatedDuration: number; // in minutes
  factors: {
    currentSpeed?: number;
    historicalSpeed?: number;
    trafficFactor?: number;
    driverFactor?: number;
  };
}> {
  // Validate input parameters
  if (!entityId || !entityType) {
    throw new Error('Entity ID and type are required');
  }
  
  if (destLatitude < -90 || destLatitude > 90 || destLongitude < -180 || destLongitude > 180) {
    throw new Error('Invalid destination coordinates');
  }

  try {
    // Default options
    const {
      includeTraffic = true,
      useHistoricalData = true,
      adjustForDriverBehavior = true,
      loadStatus
    } = options;

    // Get current position of the entity
    const currentPosition = await PositionModel.getByEntityId(entityId, entityType);
    
    if (!currentPosition) {
      throw new Error(`No position data found for ${entityType} ${entityId}`);
    }

    // Calculate straight-line distance to destination in kilometers
    const remainingDistance = calculateDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      destLatitude,
      destLongitude,
      'km'
    );

    // Initialize factors object to track calculation components
    const factors: {
      currentSpeed?: number;
      historicalSpeed?: number;
      trafficFactor?: number;
      driverFactor?: number;
    } = {};

    // Get current speed from position data (convert from mph to km/h if needed)
    factors.currentSpeed = currentPosition.speed * 1.60934; // assuming position speed is in mph

    // Default to current speed if valid, otherwise use default speed
    let weightedSpeed = factors.currentSpeed > 0 ? factors.currentSpeed : DEFAULT_SPEED_KMH;

    // Get historical average speed if requested
    if (useHistoricalData) {
      try {
        // Calculate time window for historical data (last 30 days)
        const endTime = new Date();
        const startTime = new Date(endTime);
        startTime.setDate(startTime.getDate() - 30);

        // Get average speed from historical data
        factors.historicalSpeed = await HistoricalPositionModel.calculateAverageSpeed(
          entityId,
          entityType,
          startTime,
          endTime
        );

        // Only use historical speed if we got a valid value
        if (factors.historicalSpeed > 0) {
          // Mix current and historical speed based on weights
          weightedSpeed = (
            (factors.currentSpeed > 0 ? factors.currentSpeed * CURRENT_SPEED_WEIGHT : 0) +
            (factors.historicalSpeed * HISTORICAL_SPEED_WEIGHT)
          ) / (
            (factors.currentSpeed > 0 ? CURRENT_SPEED_WEIGHT : 0) +
            HISTORICAL_SPEED_WEIGHT
          );
        }
      } catch (error) {
        logger.error('Failed to get historical speed data', { error, entityId, entityType });
        // Continue with current speed if historical data fetch fails
      }
    }

    // Get traffic conditions if requested
    if (includeTraffic) {
      try {
        factors.trafficFactor = await getTrafficFactor(
          currentPosition.latitude,
          currentPosition.longitude,
          destLatitude,
          destLongitude
        );

        // Apply traffic factor to weighted speed
        weightedSpeed = weightedSpeed / factors.trafficFactor;
      } catch (error) {
        logger.error('Failed to get traffic data', { error, entityId, entityType });
        // Continue without traffic data if fetch fails
      }
    }

    // Calculate travel time in hours based on distance and speed
    let travelTimeHours = remainingDistance / weightedSpeed;

    // Adjust for driver behavior if requested
    if (adjustForDriverBehavior) {
      try {
        const adjustedTravelTimeMinutes = await adjustForDriverBehavior(
          entityId,
          travelTimeHours * 60
        );
        
        factors.driverFactor = adjustedTravelTimeMinutes / (travelTimeHours * 60);
        travelTimeHours = adjustedTravelTimeMinutes / 60;
      } catch (error) {
        logger.error('Failed to adjust for driver behavior', { error, entityId, entityType });
        // Continue without driver behavior adjustment if it fails
      }
    }

    // Calculate arrival time
    const currentTime = new Date();
    const arrivalTime = new Date(currentTime.getTime() + travelTimeHours * 60 * 60 * 1000);

    // Calculate confidence level based on available data
    const confidenceLevel = calculateConfidenceLevel({
      hasCurrentSpeed: factors.currentSpeed !== undefined && factors.currentSpeed > 0,
      hasHistoricalSpeed: factors.historicalSpeed !== undefined && factors.historicalSpeed > 0,
      hasTrafficData: factors.trafficFactor !== undefined,
      hasDriverBehavior: factors.driverFactor !== undefined,
      distance: remainingDistance,
      loadStatus: loadStatus
    });

    logger.debug('ETA calculated', {
      entityId,
      entityType,
      remainingDistance,
      estimatedDuration: travelTimeHours * 60,
      factors,
      confidenceLevel
    });

    return {
      arrivalTime,
      confidenceLevel,
      remainingDistance,
      estimatedDuration: Math.round(travelTimeHours * 60), // Convert to minutes
      factors
    };
  } catch (error) {
    logger.error('Failed to calculate ETA', { 
      error, 
      entityId, 
      entityType, 
      destination: { latitude: destLatitude, longitude: destLongitude } 
    });
    throw error;
  }
}

/**
 * Calculates ETA using actual route information rather than straight-line distance
 *
 * @param entityId - Unique identifier for the entity
 * @param entityType - Type of the entity
 * @param destLatitude - Destination latitude
 * @param destLongitude - Destination longitude
 * @param routePoints - Array of route points (waypoints)
 * @param options - Additional options for calculation
 * @returns Promise with ETA information based on actual route
 */
export async function calculateETAWithRoute(
  entityId: string,
  entityType: EntityType,
  destLatitude: number,
  destLongitude: number,
  routePoints: Array<{ latitude: number; longitude: number }>,
  options: {
    includeTraffic?: boolean;
    useHistoricalData?: boolean;
    adjustForDriverBehavior?: boolean;
    loadStatus?: LoadStatus;
  } = {}
): Promise<{
  arrivalTime: Date;
  confidenceLevel: number;
  remainingDistance: number;
  estimatedDuration: number; // in minutes
  segmentETAs?: Array<{ latitude: number; longitude: number; eta: Date }>;
  factors: {
    currentSpeed?: number;
    historicalSpeed?: number;
    trafficFactor?: number;
    driverFactor?: number;
  };
}> {
  // Validate input parameters
  if (!entityId || !entityType) {
    throw new Error('Entity ID and type are required');
  }
  
  if (destLatitude < -90 || destLatitude > 90 || destLongitude < -180 || destLongitude > 180) {
    throw new Error('Invalid destination coordinates');
  }

  if (!Array.isArray(routePoints) || routePoints.length === 0) {
    // Fall back to straight-line calculation if no route points
    return calculateETA(entityId, entityType, destLatitude, destLongitude, options);
  }

  try {
    // Default options
    const {
      includeTraffic = true,
      useHistoricalData = true,
      adjustForDriverBehavior = true,
      loadStatus
    } = options;

    // Get current position of the entity
    const currentPosition = await PositionModel.getByEntityId(entityId, entityType);
    
    if (!currentPosition) {
      throw new Error(`No position data found for ${entityType} ${entityId}`);
    }

    // Calculate remaining distance along the route
    const remainingDistance = calculateRemainingDistance(
      {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude
      },
      destLatitude,
      destLongitude,
      routePoints
    );

    // Initialize factors object to track calculation components
    const factors: {
      currentSpeed?: number;
      historicalSpeed?: number;
      trafficFactor?: number;
      driverFactor?: number;
      segmentFactors?: Array<{
        startIndex: number;
        endIndex: number;
        trafficFactor: number;
      }>;
    } = {};

    // Get current speed from position data (convert from mph to km/h if needed)
    factors.currentSpeed = currentPosition.speed * 1.60934; // assuming position speed is in mph

    // Default to current speed if valid, otherwise use default speed
    let weightedSpeed = factors.currentSpeed > 0 ? factors.currentSpeed : DEFAULT_SPEED_KMH;

    // Get historical average speed if requested
    if (useHistoricalData) {
      try {
        // Calculate time window for historical data (last 30 days)
        const endTime = new Date();
        const startTime = new Date(endTime);
        startTime.setDate(startTime.getDate() - 30);

        // Get average speed from historical data
        factors.historicalSpeed = await HistoricalPositionModel.calculateAverageSpeed(
          entityId,
          entityType,
          startTime,
          endTime
        );

        // Only use historical speed if we got a valid value
        if (factors.historicalSpeed > 0) {
          // Mix current and historical speed based on weights
          weightedSpeed = (
            (factors.currentSpeed > 0 ? factors.currentSpeed * CURRENT_SPEED_WEIGHT : 0) +
            (factors.historicalSpeed * HISTORICAL_SPEED_WEIGHT)
          ) / (
            (factors.currentSpeed > 0 ? CURRENT_SPEED_WEIGHT : 0) +
            HISTORICAL_SPEED_WEIGHT
          );
        }
      } catch (error) {
        logger.error('Failed to get historical speed data', { error, entityId, entityType });
        // Continue with current speed if historical data fetch fails
      }
    }

    // Find closest point on route to current position
    let closestPointIndex = 0;
    let minDistance = Number.MAX_VALUE;
    
    for (let i = 0; i < routePoints.length; i++) {
      const distance = calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        routePoints[i].latitude,
        routePoints[i].longitude,
        'km'
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = i;
      }
    }

    // Create route segments from closest point to destination
    const segments: Array<{
      start: { latitude: number; longitude: number };
      end: { latitude: number; longitude: number };
      distance: number;
    }> = [];

    // Start with segment from current position to closest route point (if not already at a route point)
    if (minDistance > 0.1) { // If more than 100m away from route point
      segments.push({
        start: {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude
        },
        end: routePoints[closestPointIndex],
        distance: minDistance
      });
    }

    // Add segments between route points
    for (let i = closestPointIndex; i < routePoints.length - 1; i++) {
      const distance = calculateDistance(
        routePoints[i].latitude,
        routePoints[i].longitude,
        routePoints[i + 1].latitude,
        routePoints[i + 1].longitude,
        'km'
      );
      
      segments.push({
        start: routePoints[i],
        end: routePoints[i + 1],
        distance
      });
    }

    // Add final segment to destination if last route point is not the destination
    const lastPoint = routePoints[routePoints.length - 1];
    const finalDistance = calculateDistance(
      lastPoint.latitude,
      lastPoint.longitude,
      destLatitude,
      destLongitude,
      'km'
    );
    
    if (finalDistance > 0.1) { // If more than 100m from destination
      segments.push({
        start: lastPoint,
        end: { latitude: destLatitude, longitude: destLongitude },
        distance: finalDistance
      });
    }

    // Calculate traffic factors for segments if requested
    let aggregateTrafficFactor = 1.0;
    let trafficCoverage = 0;
    const segmentETAs: Array<{ latitude: number; longitude: number; eta: Date }> = [];
    
    if (includeTraffic) {
      factors.segmentFactors = [];
      
      for (let i = 0; i < segments.length; i++) {
        try {
          const segment = segments[i];
          const trafficFactor = await getTrafficFactor(
            segment.start.latitude,
            segment.start.longitude,
            segment.end.latitude,
            segment.end.longitude
          );
          
          factors.segmentFactors.push({
            startIndex: i,
            endIndex: i,
            trafficFactor
          });
          
          // Weight the aggregate traffic factor by segment distance
          aggregateTrafficFactor += trafficFactor * (segment.distance / remainingDistance);
          trafficCoverage += segment.distance / remainingDistance;
        } catch (error) {
          logger.error('Failed to get traffic data for segment', { 
            error, 
            segmentIndex: i,
            segment: segments[i]
          });
          // Continue without traffic data for this segment
        }
      }
      
      // Normalize the aggregate traffic factor based on coverage
      if (trafficCoverage > 0) {
        aggregateTrafficFactor /= trafficCoverage;
        factors.trafficFactor = aggregateTrafficFactor;
        
        // Apply traffic factor to weighted speed
        weightedSpeed = weightedSpeed / aggregateTrafficFactor;
      }
    }

    // Calculate travel time for each segment based on weighted speed
    let totalTravelTimeHours = 0;
    let cumulativeTravelTimeHours = 0;
    let currentTime = new Date();
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Apply segment-specific traffic factor if available
      let segmentSpeed = weightedSpeed;
      
      if (factors.segmentFactors) {
        const segmentFactor = factors.segmentFactors.find(f => f.startIndex === i && f.endIndex === i);
        if (segmentFactor) {
          segmentSpeed = weightedSpeed / segmentFactor.trafficFactor;
        }
      }
      
      // Calculate travel time for this segment
      const segmentTravelTimeHours = segment.distance / segmentSpeed;
      totalTravelTimeHours += segmentTravelTimeHours;
      
      // Calculate ETA for this segment endpoint
      cumulativeTravelTimeHours += segmentTravelTimeHours;
      const segmentETA = new Date(currentTime.getTime() + cumulativeTravelTimeHours * 60 * 60 * 1000);
      
      segmentETAs.push({
        latitude: segment.end.latitude,
        longitude: segment.end.longitude,
        eta: segmentETA
      });
    }

    // Adjust for driver behavior if requested
    if (adjustForDriverBehavior) {
      try {
        const adjustedTravelTimeMinutes = await adjustForDriverBehavior(
          entityId,
          totalTravelTimeHours * 60
        );
        
        factors.driverFactor = adjustedTravelTimeMinutes / (totalTravelTimeHours * 60);
        totalTravelTimeHours = adjustedTravelTimeMinutes / 60;
      } catch (error) {
        logger.error('Failed to adjust for driver behavior', { error, entityId, entityType });
        // Continue without driver behavior adjustment if it fails
      }
    }

    // Calculate final arrival time
    const arrivalTime = new Date(currentTime.getTime() + totalTravelTimeHours * 60 * 60 * 1000);

    // Calculate confidence level based on available data
    const confidenceLevel = calculateConfidenceLevel({
      hasCurrentSpeed: factors.currentSpeed !== undefined && factors.currentSpeed > 0,
      hasHistoricalSpeed: factors.historicalSpeed !== undefined && factors.historicalSpeed > 0,
      hasTrafficData: factors.trafficFactor !== undefined,
      hasDriverBehavior: factors.driverFactor !== undefined,
      hasRouteData: true,
      distance: remainingDistance,
      trafficCoverage,
      loadStatus
    });

    logger.debug('Route-based ETA calculated', {
      entityId,
      entityType,
      remainingDistance,
      estimatedDuration: totalTravelTimeHours * 60,
      segments: segments.length,
      factors,
      confidenceLevel
    });

    return {
      arrivalTime,
      confidenceLevel,
      remainingDistance,
      estimatedDuration: Math.round(totalTravelTimeHours * 60), // Convert to minutes
      segmentETAs,
      factors
    };
  } catch (error) {
    logger.error('Failed to calculate route-based ETA', { 
      error, 
      entityId, 
      entityType, 
      destination: { latitude: destLatitude, longitude: destLongitude },
      routePoints: routePoints.length
    });
    throw error;
  }
}

/**
 * Retrieves traffic factor for a route segment from external mapping service
 *
 * @param startLat - Starting latitude
 * @param startLon - Starting longitude
 * @param endLat - Ending latitude
 * @param endLon - Ending longitude
 * @returns Promise with traffic factor (1.0 = normal, >1.0 = slower, <1.0 = faster)
 */
async function getTrafficFactor(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<number> {
  try {
    // Get mapping service API configuration from environment variables
    const apiKey = process.env.MAPPING_API_KEY;
    const apiUrl = process.env.MAPPING_API_URL || 'https://api.mapping-service.com/traffic';
    
    if (!apiKey) {
      logger.warn('No mapping API key found, returning default traffic factor');
      return 1.0; // Default to no traffic impact
    }

    // Make API request to get traffic information
    const response = await axios.get(apiUrl, {
      params: {
        key: apiKey,
        origin: `${startLat},${startLon}`,
        destination: `${endLat},${endLon}`,
        mode: 'driving',
        departure_time: 'now'
      },
      timeout: 5000 // 5 second timeout
    });

    // Parse the response to extract traffic factor
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      // Extract duration with and without traffic
      const baseSeconds = response.data.routes[0].legs[0].duration.value;
      const trafficSeconds = response.data.routes[0].legs[0].duration_in_traffic.value;
      
      // Calculate traffic factor as ratio of duration with traffic to baseline duration
      const trafficFactor = trafficSeconds / baseSeconds;
      
      // Apply bounds to ensure reasonable values (e.g., 0.5 to 2.0)
      return Math.max(0.5, Math.min(2.0, trafficFactor));
    }

    // If response doesn't contain expected data, return default
    logger.warn('Unexpected response format from mapping API', { response: response.data });
    return 1.0;
  } catch (error) {
    logger.error('Failed to get traffic factor', { 
      error, 
      coordinates: { startLat, startLon, endLat, endLon } 
    });
    return 1.0; // Default to no traffic impact on error
  }
}

/**
 * Calculates the confidence level for an ETA prediction
 *
 * @param factors - Factors influencing confidence calculation
 * @returns Confidence level between 0 and 1
 */
function calculateConfidenceLevel(factors: {
  hasCurrentSpeed?: boolean;
  hasHistoricalSpeed?: boolean;
  hasTrafficData?: boolean;
  hasDriverBehavior?: boolean;
  hasRouteData?: boolean;
  distance?: number;
  trafficCoverage?: number;
  loadStatus?: LoadStatus;
}): number {
  // Base confidence starts at minimum level
  let confidence = MIN_CONFIDENCE_LEVEL;
  
  // Data quality factors
  if (factors.hasCurrentSpeed) confidence += 0.05;
  if (factors.hasHistoricalSpeed) confidence += 0.1;
  if (factors.hasTrafficData) confidence += 0.1;
  if (factors.hasDriverBehavior) confidence += 0.05;
  if (factors.hasRouteData) confidence += 0.1;
  
  // Distance factor - confidence decreases with longer distances
  if (factors.distance !== undefined) {
    if (factors.distance < 50) confidence += 0.1; // Short trips are more predictable
    else if (factors.distance > 500) confidence -= 0.1; // Long trips are less predictable
  }
  
  // Traffic coverage factor - more coverage = higher confidence
  if (factors.trafficCoverage !== undefined) {
    confidence += factors.trafficCoverage * 0.1;
  }
  
  // Load status factor
  if (factors.loadStatus) {
    switch (factors.loadStatus) {
      case LoadStatus.IN_TRANSIT:
      case LoadStatus.LOADED:
        confidence += 0.05; // In progress, more predictable
        break;
      case LoadStatus.AT_PICKUP:
      case LoadStatus.AT_DROPOFF:
        confidence += 0.02; // At facility, somewhat predictable but depends on loading/unloading
        break;
      case LoadStatus.DELAYED:
      case LoadStatus.EXCEPTION:
        confidence -= 0.1; // Issues reduce confidence
        break;
      default:
        // Other statuses don't affect confidence
        break;
    }
  }
  
  // Apply bounds to ensure confidence is within allowed range
  return Math.max(MIN_CONFIDENCE_LEVEL, Math.min(MAX_CONFIDENCE_LEVEL, confidence));
}

/**
 * Adjusts ETA based on historical driver behavior patterns
 *
 * @param entityId - ID of the entity (driver)
 * @param baseETA - Base ETA in minutes
 * @returns Promise with adjusted ETA in minutes
 */
async function adjustForDriverBehavior(
  entityId: string,
  baseETA: number
): Promise<number> {
  try {
    // This would typically involve querying a database for driver behavior patterns
    // For now, we'll simulate this with a simple adjustment based on entity ID

    // Use entity ID to generate a consistent adjustment factor
    const hash = Array.from(entityId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const adjustmentFactor = 0.9 + (hash % 20) / 100; // Range from 0.9 to 1.09
    
    // Apply adjustment factor to base ETA
    return baseETA * adjustmentFactor;
  } catch (error) {
    logger.error('Failed to adjust for driver behavior', { error, entityId });
    return baseETA; // Return unadjusted ETA on error
  }
}

/**
 * Calculates the remaining distance to destination considering route information
 *
 * @param currentPosition - Current position
 * @param destLatitude - Destination latitude
 * @param destLongitude - Destination longitude
 * @param routePoints - Array of route points
 * @returns Remaining distance in kilometers
 */
export function calculateRemainingDistance(
  currentPosition: { latitude: number; longitude: number },
  destLatitude: number,
  destLongitude: number,
  routePoints?: Array<{ latitude: number; longitude: number }>
): number {
  // If no route points provided, calculate straight-line distance
  if (!routePoints || routePoints.length === 0) {
    return calculateDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      destLatitude,
      destLongitude,
      'km'
    );
  }

  // Find closest point on route to current position
  let closestPointIndex = 0;
  let minDistance = Number.MAX_VALUE;
  
  for (let i = 0; i < routePoints.length; i++) {
    const distance = calculateDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      routePoints[i].latitude,
      routePoints[i].longitude,
      'km'
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPointIndex = i;
    }
  }

  // Calculate remaining distance by summing distances from closest point to destination
  let remainingDistance = 0;
  
  // Add distance from current position to closest route point
  remainingDistance += minDistance;
  
  // Add distances between route points
  for (let i = closestPointIndex; i < routePoints.length - 1; i++) {
    remainingDistance += calculateDistance(
      routePoints[i].latitude,
      routePoints[i].longitude,
      routePoints[i + 1].latitude,
      routePoints[i + 1].longitude,
      'km'
    );
  }
  
  // Add distance from last route point to destination
  const lastPoint = routePoints[routePoints.length - 1];
  remainingDistance += calculateDistance(
    lastPoint.latitude,
    lastPoint.longitude,
    destLatitude,
    destLongitude,
    'km'
  );
  
  return remainingDistance;
}