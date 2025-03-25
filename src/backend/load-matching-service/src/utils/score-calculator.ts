/**
 * Score Calculator Module
 *
 * This module implements the efficiency score calculation algorithm for load-driver matches.
 * It evaluates and scores potential matches based on multiple weighted factors including 
 * empty miles reduction, network contribution, driver preferences, and Smart Hub utilization.
 * 
 * The scoring algorithm is a critical component of the AI-driven matching system, supporting
 * the platform's core optimization features by quantifying the efficiency of each potential match.
 */

import { logger } from 'winston'; // ^3.8.2
import { 
  MatchScoreFactors, 
  MatchType 
} from '../interfaces/match.interface';
import { 
  Load, 
  LoadLocation 
} from '../../common/interfaces/load.interface';
import { 
  Driver, 
  DriverPreference 
} from '../../common/interfaces/driver.interface';
import { SmartHub } from '../../common/interfaces/smartHub.interface';
import { 
  calculateDistance, 
  calculateMidpoint, 
  isPointNearPolyline 
} from '../../common/utils/geo-utils';
import { calculateTimeDifference } from '../../common/utils/date-time';

// Constants for score calculation
export const SCORE_WEIGHTS = {
  EMPTY_MILES_REDUCTION: 0.3,    // 30% weight
  NETWORK_CONTRIBUTION: 0.25,    // 25% weight
  DRIVER_PREFERENCE_ALIGNMENT: 0.2, // 20% weight
  TIME_EFFICIENCY: 0.15,         // 15% weight
  SMART_HUB_UTILIZATION: 0.1     // 10% weight
};

// Factor to normalize final scores to 0-100 scale
export const SCORE_NORMALIZATION_FACTOR = 100;

// Regional averages of empty miles percentages for baseline comparison
export const REGIONAL_AVERAGE_EMPTY_MILES = {
  NORTHEAST: 0.35, // 35% empty miles
  SOUTHEAST: 0.32, // 32% empty miles
  MIDWEST: 0.38,   // 38% empty miles
  SOUTHWEST: 0.36, // 36% empty miles
  WEST: 0.34,      // 34% empty miles
  DEFAULT: 0.35    // Default if region can't be determined
};

/**
 * Calculates the overall efficiency score for a potential load-driver match.
 * 
 * This is the main function that combines all individual score components using
 * the weighted algorithm defined in the platform's technical specifications.
 * 
 * @param load - The load to be matched
 * @param loadLocations - Array of load locations (pickup, delivery, etc.)
 * @param driver - The driver to be matched with the load
 * @param driverPreferences - Array of driver preferences
 * @param smartHubs - Array of Smart Hubs that might be relevant to the route
 * @param matchType - Type of match (direct, relay, or Smart Hub exchange)
 * @returns Object containing the overall efficiency score and individual score factors
 */
export function calculateEfficiencyScore(
  load: Load,
  loadLocations: LoadLocation[],
  driver: Driver,
  driverPreferences: DriverPreference[],
  smartHubs: SmartHub[],
  matchType: string
): { score: number; factors: MatchScoreFactors } {
  try {
    // Calculate individual score components
    const emptyMilesReductionScore = calculateEmptyMilesReductionScore(load, loadLocations, driver);
    const networkContributionScore = calculateNetworkContributionScore(load, loadLocations, driver, matchType);
    const driverPreferenceAlignmentScore = calculateDriverPreferenceAlignmentScore(load, loadLocations, driver, driverPreferences);
    const timeEfficiencyScore = calculateTimeEfficiencyScore(load, loadLocations, driver);
    const smartHubUtilizationScore = calculateSmartHubUtilizationScore(load, loadLocations, driver, smartHubs, matchType);

    // Store the individual score factors
    const scoreFactors: MatchScoreFactors = {
      empty_miles_reduction: emptyMilesReductionScore * SCORE_NORMALIZATION_FACTOR,
      network_contribution: networkContributionScore * SCORE_NORMALIZATION_FACTOR,
      driver_preference_alignment: driverPreferenceAlignmentScore * SCORE_NORMALIZATION_FACTOR,
      time_efficiency: timeEfficiencyScore * SCORE_NORMALIZATION_FACTOR,
      smart_hub_utilization: smartHubUtilizationScore * SCORE_NORMALIZATION_FACTOR,
      additional_factors: {} // No additional factors for now
    };

    // Calculate the weighted sum of all score components
    const weightedScore = 
      emptyMilesReductionScore * SCORE_WEIGHTS.EMPTY_MILES_REDUCTION +
      networkContributionScore * SCORE_WEIGHTS.NETWORK_CONTRIBUTION +
      driverPreferenceAlignmentScore * SCORE_WEIGHTS.DRIVER_PREFERENCE_ALIGNMENT +
      timeEfficiencyScore * SCORE_WEIGHTS.TIME_EFFICIENCY +
      smartHubUtilizationScore * SCORE_WEIGHTS.SMART_HUB_UTILIZATION;

    // Normalize the final score to a 0-100 scale
    const finalScore = weightedScore * SCORE_NORMALIZATION_FACTOR;

    logger.debug(`Calculated efficiency score for load ${load.load_id} and driver ${driver.driver_id}: ${finalScore.toFixed(2)}`);

    return {
      score: Math.round(finalScore),
      factors: scoreFactors
    };
  } catch (error) {
    logger.error(`Error calculating efficiency score for load ${load.load_id} and driver ${driver.driver_id}:`, error);
    
    // Return a default low score in case of error
    return {
      score: 0,
      factors: {
        empty_miles_reduction: 0,
        network_contribution: 0,
        driver_preference_alignment: 0,
        time_efficiency: 0,
        smart_hub_utilization: 0,
        additional_factors: {}
      }
    };
  }
}

/**
 * Calculates the score component for empty miles reduction.
 * 
 * This score evaluates how much a potential match would reduce empty miles
 * compared to the regional average, rewarding more efficient route combinations.
 * 
 * @param load - The load to be matched
 * @param loadLocations - Array of load locations (pickup, delivery, etc.)
 * @param driver - The driver to be matched with the load
 * @returns Score for empty miles reduction (0-1)
 */
function calculateEmptyMilesReductionScore(
  load: Load,
  loadLocations: LoadLocation[],
  driver: Driver
): number {
  try {
    // Get pickup and delivery locations
    const pickupLocation = loadLocations.find(loc => loc.location_type === 'PICKUP');
    const deliveryLocation = loadLocations.find(loc => loc.location_type === 'DELIVERY');

    if (!pickupLocation || !deliveryLocation) {
      logger.warn(`Missing pickup or delivery location for load ${load.load_id}`);
      return 0;
    }

    // Calculate deadhead miles - distance from driver's current location to pickup
    const deadheadMiles = calculateDistance(
      driver.current_location.latitude,
      driver.current_location.longitude,
      pickupLocation.latitude,
      pickupLocation.longitude,
      'miles'
    );

    // Calculate loaded miles - distance from pickup to delivery
    const loadedMiles = calculateDistance(
      pickupLocation.latitude,
      pickupLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude,
      'miles'
    );

    // Calculate total trip miles
    const totalMiles = deadheadMiles + loadedMiles;

    // Calculate empty miles percentage for this trip
    const emptyMilesPercentage = deadheadMiles / totalMiles;

    // Get the regional average empty miles for comparison
    const driverRegion = getRegionFromLocation(driver.current_location.latitude, driver.current_location.longitude);
    const regionalAverage = REGIONAL_AVERAGE_EMPTY_MILES[driverRegion] || REGIONAL_AVERAGE_EMPTY_MILES.DEFAULT;

    // Calculate the reduction compared to regional average
    const reductionPercentage = Math.max(0, regionalAverage - emptyMilesPercentage);

    // Normalize the score - a perfect score would be reducing empty miles to zero
    // from the regional average
    const normalizedScore = normalizeScore(reductionPercentage, 0, regionalAverage);

    logger.debug(`Empty miles reduction score for load ${load.load_id}: ${normalizedScore.toFixed(2)}`);
    
    return normalizedScore;
  } catch (error) {
    logger.error(`Error calculating empty miles reduction score:`, error);
    return 0;
  }
}

/**
 * Calculates the score component for contribution to overall network efficiency.
 * 
 * This score evaluates how a particular match contributes to the optimization of
 * the entire freight network, based on load destination, supply/demand imbalances,
 * and the match type.
 * 
 * @param load - The load to be matched
 * @param loadLocations - Array of load locations (pickup, delivery, etc.)
 * @param driver - The driver to be matched with the load
 * @param matchType - Type of match (direct, relay, or Smart Hub exchange)
 * @returns Score for network contribution (0-1)
 */
function calculateNetworkContributionScore(
  load: Load,
  loadLocations: LoadLocation[],
  driver: Driver,
  matchType: string
): number {
  try {
    // Get the delivery location
    const deliveryLocation = loadLocations.find(loc => loc.location_type === 'DELIVERY');

    if (!deliveryLocation) {
      logger.warn(`Missing delivery location for load ${load.load_id}`);
      return 0;
    }

    // Determine region of delivery
    const deliveryRegion = getRegionFromLocation(deliveryLocation.latitude, deliveryLocation.longitude);

    // Base score starts at 0.5 (neutral contribution)
    let baseScore = 0.5;

    // Adjust score based on supply/demand imbalance in destination region
    // Note: In a real implementation, this would query a market intelligence service
    // for actual supply/demand data. For now, we use a simplified approach.
    
    // Example: Check if delivery is to a high-demand region
    // This would be replaced with actual market data
    const isHighDemandRegion = [
      'NORTHEAST', 'SOUTHEAST', 'MIDWEST' // Example high-demand regions
    ].includes(deliveryRegion);

    if (isHighDemandRegion) {
      baseScore += 0.2; // Significant boost for delivering to high-demand regions
    }

    // Adjust score based on match type
    // Relay and Smart Hub matches contribute more to network efficiency
    if (matchType === MatchType.RELAY) {
      baseScore += 0.15;
    } else if (matchType === MatchType.SMART_HUB_EXCHANGE) {
      baseScore += 0.25;
    }

    // Check if the load's destination positions the driver well for future loads
    // This would ideally be based on forecasted load availability in the area
    
    // Example simple check: Is driver's home base near the delivery location?
    if (driver.home_address) {
      const distanceToHome = calculateDistance(
        deliveryLocation.latitude,
        deliveryLocation.longitude,
        driver.home_address.latitude,
        driver.home_address.longitude,
        'miles'
      );

      if (distanceToHome < 100) {
        baseScore += 0.1; // Boost for deliveries that end near driver's home
      }
    }

    // Normalize final score to 0-1 range
    const normalizedScore = Math.min(1, Math.max(0, baseScore));

    logger.debug(`Network contribution score for load ${load.load_id}: ${normalizedScore.toFixed(2)}`);
    
    return normalizedScore;
  } catch (error) {
    logger.error(`Error calculating network contribution score:`, error);
    return 0;
  }
}

/**
 * Calculates the score component for alignment with driver preferences.
 * 
 * This score evaluates how well a potential match aligns with a driver's stated
 * preferences, such as preferred regions, load types, and home time requirements.
 * 
 * @param load - The load to be matched
 * @param loadLocations - Array of load locations (pickup, delivery, etc.)
 * @param driver - The driver to be matched with the load
 * @param driverPreferences - Array of driver preferences
 * @returns Score for driver preference alignment (0-1)
 */
function calculateDriverPreferenceAlignmentScore(
  load: Load,
  loadLocations: LoadLocation[],
  driver: Driver,
  driverPreferences: DriverPreference[]
): number {
  try {
    if (!driverPreferences || driverPreferences.length === 0) {
      // No preferences specified, default to neutral score
      return 0.5;
    }

    let totalScore = 0;
    let totalWeight = 0;

    // Get pickup and delivery locations
    const pickupLocation = loadLocations.find(loc => loc.location_type === 'PICKUP');
    const deliveryLocation = loadLocations.find(loc => loc.location_type === 'DELIVERY');

    if (!pickupLocation || !deliveryLocation) {
      logger.warn(`Missing pickup or delivery location for load ${load.load_id}`);
      return 0.5;
    }

    // Process each driver preference
    for (const preference of driverPreferences) {
      const preferenceWeight = preference.priority || 1;
      totalWeight += preferenceWeight;

      switch (preference.preference_type) {
        case 'REGION': {
          // Check if load delivery is in preferred region
          const deliveryRegion = getRegionFromLocation(deliveryLocation.latitude, deliveryLocation.longitude);
          if (preference.preference_value === deliveryRegion) {
            totalScore += preferenceWeight;
          }
          break;
        }
        
        case 'LOAD_TYPE': {
          // Check if load matches preferred equipment type
          if (preference.preference_value === load.equipment_type) {
            totalScore += preferenceWeight;
          }
          break;
        }
        
        case 'MAX_DISTANCE': {
          // Check if load distance is within preferred maximum
          const tripDistance = calculateDistance(
            pickupLocation.latitude,
            pickupLocation.longitude,
            deliveryLocation.latitude,
            deliveryLocation.longitude,
            'miles'
          );
          
          const maxDistance = parseInt(preference.preference_value, 10);
          if (!isNaN(maxDistance) && tripDistance <= maxDistance) {
            totalScore += preferenceWeight;
          }
          break;
        }
        
        case 'HOME_TIME': {
          // Check for home time alignment
          const homeTimeScore = calculateHomeTimeAlignment(load, loadLocations, driver);
          totalScore += preferenceWeight * homeTimeScore;
          break;
        }
        
        case 'AVOID_LOCATION': {
          // Check if load avoids specific locations
          // This would need a more sophisticated implementation with geocoding
          // For now, just a basic check if load locations match the avoidance area
          const avoidArea = preference.preference_value.toLowerCase();
          const pickupCity = pickupLocation.city?.toLowerCase() || '';
          const deliveryCity = deliveryLocation.city?.toLowerCase() || '';
          
          if (!pickupCity.includes(avoidArea) && !deliveryCity.includes(avoidArea)) {
            totalScore += preferenceWeight;
          }
          break;
        }
        
        default:
          // Unhandled preference type, ignore
          totalWeight -= preferenceWeight;
          break;
      }
    }

    // Calculate the weighted average of preference scores
    const weightedScore = totalWeight > 0 ? totalScore / totalWeight : 0.5;
    
    // Normalize to ensure it's in the 0-1 range
    const normalizedScore = Math.min(1, Math.max(0, weightedScore));

    logger.debug(`Driver preference alignment score for load ${load.load_id}: ${normalizedScore.toFixed(2)}`);
    
    return normalizedScore;
  } catch (error) {
    logger.error(`Error calculating driver preference alignment score:`, error);
    return 0.5; // Default to neutral score on error
  }
}

/**
 * Calculates the score component for time efficiency.
 * 
 * This score evaluates the efficiency of time utilization for a potential match,
 * considering factors such as transit time, wait time, and delivery windows.
 * 
 * @param load - The load to be matched
 * @param loadLocations - Array of load locations (pickup, delivery, etc.)
 * @param driver - The driver to be matched with the load
 * @returns Score for time efficiency (0-1)
 */
function calculateTimeEfficiencyScore(
  load: Load,
  loadLocations: LoadLocation[],
  driver: Driver
): number {
  try {
    // Get pickup and delivery locations
    const pickupLocation = loadLocations.find(loc => loc.location_type === 'PICKUP');
    const deliveryLocation = loadLocations.find(loc => loc.location_type === 'DELIVERY');

    if (!pickupLocation || !deliveryLocation) {
      logger.warn(`Missing pickup or delivery location for load ${load.load_id}`);
      return 0;
    }

    // Calculate distance from driver to pickup
    const distanceToPickup = calculateDistance(
      driver.current_location.latitude,
      driver.current_location.longitude,
      pickupLocation.latitude,
      pickupLocation.longitude,
      'miles'
    );

    // Calculate distance from pickup to delivery
    const tripDistance = calculateDistance(
      pickupLocation.latitude,
      pickupLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude,
      'miles'
    );

    // Estimate transit times based on average speed (55 mph)
    const AVG_SPEED_MPH = 55;
    const timeToPickupHours = distanceToPickup / AVG_SPEED_MPH;
    const transitTimeHours = tripDistance / AVG_SPEED_MPH;

    // Calculate current time and projected arrival time at pickup
    const now = new Date();
    const projectedPickupArrival = new Date(now.getTime() + timeToPickupHours * 60 * 60 * 1000);

    // Check pickup window compatibility
    const pickupWindowLength = calculateTimeDifference(load.pickup_earliest, load.pickup_latest, 'hours');
    const timeUntilPickupWindow = calculateTimeDifference(now, load.pickup_earliest, 'hours');
    const timeUntilPickupWindowEnd = calculateTimeDifference(now, load.pickup_latest, 'hours');

    // Calculate window scores - higher scores for larger windows and better timing
    let pickupWindowScore = 0;
    
    // If we can make the pickup window
    if (timeUntilPickupWindowEnd > timeToPickupHours) {
      // Perfect scenario: arrive right at the start of the window
      const idealDifference = Math.abs(timeUntilPickupWindow - timeToPickupHours);
      pickupWindowScore = normalizeScore(idealDifference, 5, 0); // Closer to ideal time = higher score
      
      // Bonus for wider pickup windows that offer flexibility
      pickupWindowScore += normalizeScore(pickupWindowLength, 1, 12) * 0.3;
    }

    // Check delivery window compatibility
    const deliveryWindowLength = calculateTimeDifference(load.delivery_earliest, load.delivery_latest, 'hours');
    const projectedDeliveryTime = new Date(projectedPickupArrival.getTime() + transitTimeHours * 60 * 60 * 1000);
    
    let deliveryWindowScore = 0;
    
    // If we can arrive within the delivery window
    if (projectedDeliveryTime >= load.delivery_earliest && projectedDeliveryTime <= load.delivery_latest) {
      deliveryWindowScore = 1; // Perfect delivery timing
    } else {
      // Calculate how far outside the window we are
      const earliestDelivery = new Date(projectedPickupArrival.getTime() + transitTimeHours * 60 * 60 * 1000);
      
      if (earliestDelivery < load.delivery_earliest) {
        // We arrive too early - waiting time
        const waitingHours = calculateTimeDifference(earliestDelivery, load.delivery_earliest, 'hours');
        deliveryWindowScore = normalizeScore(waitingHours, 24, 0); // Less waiting = higher score
      } else {
        // We arrive too late - missed window
        const lateHours = calculateTimeDifference(load.delivery_latest, earliestDelivery, 'hours');
        deliveryWindowScore = 0; // Late delivery gets zero score
      }
    }
    
    // Consider driver's Hours of Service (HOS) availability
    const requiredDrivingHours = timeToPickupHours + transitTimeHours;
    const driverHoursAvailable = driver.driving_minutes_remaining / 60; // Convert to hours
    
    let hosScore = 0;
    if (driverHoursAvailable >= requiredDrivingHours) {
      // Driver has enough hours - perfect
      hosScore = 1;
    } else if (driverHoursAvailable > 0) {
      // Driver has some hours but not enough - partial score
      hosScore = driverHoursAvailable / requiredDrivingHours;
    }
    
    // Combine all time efficiency factors with appropriate weights
    const timeEfficiencyScore = 
      (pickupWindowScore * 0.4) +
      (deliveryWindowScore * 0.4) +
      (hosScore * 0.2);
    
    // Normalize final score
    const normalizedScore = Math.min(1, Math.max(0, timeEfficiencyScore));
    
    logger.debug(`Time efficiency score for load ${load.load_id}: ${normalizedScore.toFixed(2)}`);
    
    return normalizedScore;
  } catch (error) {
    logger.error(`Error calculating time efficiency score:`, error);
    return 0;
  }
}

/**
 * Calculates the score component for Smart Hub utilization.
 * 
 * This score evaluates how effectively a potential match utilizes Smart Hubs
 * in the network, which is particularly relevant for relay and exchange match types.
 * 
 * @param load - The load to be matched
 * @param loadLocations - Array of load locations (pickup, delivery, etc.)
 * @param driver - The driver to be matched with the load
 * @param smartHubs - Array of Smart Hubs that might be relevant to the route
 * @param matchType - Type of match (direct, relay, or Smart Hub exchange)
 * @returns Score for Smart Hub utilization (0-1)
 */
function calculateSmartHubUtilizationScore(
  load: Load,
  loadLocations: LoadLocation[],
  driver: Driver,
  smartHubs: SmartHub[],
  matchType: string
): number {
  try {
    // For direct matches, Smart Hub utilization doesn't apply
    if (matchType === MatchType.DIRECT) {
      return 0;
    }

    // Get pickup and delivery locations
    const pickupLocation = loadLocations.find(loc => loc.location_type === 'PICKUP');
    const deliveryLocation = loadLocations.find(loc => loc.location_type === 'DELIVERY');

    if (!pickupLocation || !deliveryLocation) {
      logger.warn(`Missing pickup or delivery location for load ${load.load_id}`);
      return 0;
    }

    // Calculate full route as a simplified straight line
    const routePoints = [
      { latitude: driver.current_location.latitude, longitude: driver.current_location.longitude },
      { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
      { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
    ];

    // For relay or Smart Hub exchange matches, find relevant hubs
    const relevantHubs: Array<{ hub: SmartHub, score: number }> = [];
    
    // Find hubs that are near the route and calculate their relevance score
    for (const hub of smartHubs) {
      // Check if hub is near the route with a 20 mile threshold
      if (isPointNearPolyline(hub.latitude, hub.longitude, routePoints, 20)) {
        // Calculate distance from the hub to the ideal midpoint of the route
        const midpoint = calculateMidpoint(
          pickupLocation.latitude,
          pickupLocation.longitude,
          deliveryLocation.latitude,
          deliveryLocation.longitude
        );
        
        const distanceToMidpoint = calculateDistance(
          hub.latitude,
          hub.longitude,
          midpoint.latitude,
          midpoint.longitude,
          'miles'
        );
        
        // Score the hub based on its proximity to the ideal midpoint
        // and its own efficiency score
        const proximityScore = normalizeScore(distanceToMidpoint, 200, 0);
        const hubEfficiencyScore = hub.efficiency_score / 100; // Convert to 0-1 scale
        
        // Combine factors into a hub relevance score
        const hubScore = (proximityScore * 0.7) + (hubEfficiencyScore * 0.3);
        
        relevantHubs.push({ hub, score: hubScore });
      }
    }

    // Sort hubs by score and take the highest scoring one
    relevantHubs.sort((a, b) => b.score - a.score);
    
    // Calculate final score based on best hub's score
    let finalScore = 0;
    
    if (relevantHubs.length > 0) {
      // Use the best hub's score
      finalScore = relevantHubs[0].score;
      
      // Apply a bonus for the appropriate match type
      if (matchType === MatchType.SMART_HUB_EXCHANGE) {
        // Smart Hub matches receive a full weight
        finalScore = finalScore;
      } else if (matchType === MatchType.RELAY) {
        // Relay matches receive a slight reduction
        finalScore = finalScore * 0.8;
      }
    }
    
    logger.debug(`Smart Hub utilization score for load ${load.load_id}: ${finalScore.toFixed(2)}`);
    
    return Math.min(1, Math.max(0, finalScore));
  } catch (error) {
    logger.error(`Error calculating Smart Hub utilization score:`, error);
    return 0;
  }
}

/**
 * Normalizes a raw score to a 0-1 scale based on min and max values.
 * 
 * @param rawScore - The raw score to normalize
 * @param minValue - Minimum value for normalization
 * @param maxValue - Maximum value for normalization
 * @returns Normalized score between 0 and 1
 */
function normalizeScore(
  rawScore: number,
  minValue: number,
  maxValue: number
): number {
  // Handle case where min and max are the same
  if (minValue === maxValue) {
    return rawScore >= minValue ? 1 : 0;
  }
  
  // Ensure the raw score is within bounds
  const clampedScore = Math.min(Math.max(rawScore, minValue), maxValue);
  
  // Normalize to 0-1 range
  return (clampedScore - minValue) / (maxValue - minValue);
}

/**
 * Determines the geographic region based on coordinates.
 * 
 * This is a simplified implementation that divides the US into regions
 * based on latitude and longitude boundaries.
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Region identifier (NORTHEAST, SOUTHEAST, etc.)
 */
function getRegionFromLocation(
  latitude: number,
  longitude: number
): string {
  // Simplified region boundaries for US regions
  // Northeast: North of 37°N, East of 85°W
  if (latitude >= 37 && longitude >= -85) {
    return 'NORTHEAST';
  }
  
  // Southeast: South of 37°N, East of 92°W
  if (latitude < 37 && longitude >= -92) {
    return 'SOUTHEAST';
  }
  
  // Midwest: North of 37°N, Between 85°W and 104°W
  if (latitude >= 37 && longitude < -85 && longitude >= -104) {
    return 'MIDWEST';
  }
  
  // Southwest: South of 37°N, Between 92°W and 115°W
  if (latitude < 37 && longitude < -92 && longitude >= -115) {
    return 'SOUTHWEST';
  }
  
  // West: West of 104°N for north, West of 115°W for south
  if ((latitude >= 37 && longitude < -104) || (latitude < 37 && longitude < -115)) {
    return 'WEST';
  }
  
  // Default if location doesn't fit defined regions
  return 'DEFAULT';
}

/**
 * Calculates how well a load aligns with a driver's home time preferences.
 * 
 * This function evaluates how a potential load delivery positions the driver
 * relative to their home location, which is especially important for drivers
 * with home time preferences.
 * 
 * @param load - The load to be matched
 * @param loadLocations - Array of load locations (pickup, delivery, etc.)
 * @param driver - The driver to be matched with the load
 * @returns Score for home time alignment (0-1)
 */
function calculateHomeTimeAlignment(
  load: Load,
  loadLocations: LoadLocation[],
  driver: Driver
): number {
  try {
    if (!driver.home_address) {
      // No home address defined, return neutral score
      return 0.5;
    }

    // Get delivery location
    const deliveryLocation = loadLocations.find(loc => loc.location_type === 'DELIVERY');

    if (!deliveryLocation) {
      logger.warn(`Missing delivery location for load ${load.load_id}`);
      return 0.5;
    }

    // Calculate distance from delivery location to driver's home
    const distanceToHome = calculateDistance(
      deliveryLocation.latitude,
      deliveryLocation.longitude,
      driver.home_address.latitude,
      driver.home_address.longitude,
      'miles'
    );

    // Calculate score based on distance to home
    // Perfect: delivery ends at home (0 miles)
    // Good: within 50 miles of home
    // Acceptable: within 200 miles of home
    // Poor: > 200 miles from home
    let homeDistanceScore = 0;
    
    if (distanceToHome <= 50) {
      homeDistanceScore = normalizeScore(distanceToHome, 50, 0);
    } else if (distanceToHome <= 200) {
      homeDistanceScore = normalizeScore(distanceToHome, 200, 50) * 0.5; // Half score for 50-200 miles
    }

    // Consider delivery time relative to weekends/preferred home time
    // This would ideally use the driver's specific home time preferences
    // For now, we use a simplified approach:
    let timeAlignmentScore = 0.5; // Neutral default
    
    // Example: Boost score if delivery is on Friday (setting up for weekend home time)
    const deliveryDate = new Date(load.delivery_latest);
    const dayOfWeek = deliveryDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayOfWeek === 5) { // Friday
      timeAlignmentScore = 0.8; // Good alignment with weekend
    } else if (dayOfWeek === 4 || dayOfWeek === 0) { // Thursday or Sunday
      timeAlignmentScore = 0.6; // Decent alignment
    }
    
    // Combine distance and time factors
    const combinedScore = (homeDistanceScore * 0.7) + (timeAlignmentScore * 0.3);
    
    return Math.min(1, Math.max(0, combinedScore));
  } catch (error) {
    logger.error(`Error calculating home time alignment:`, error);
    return 0.5; // Default to neutral score on error
  }
}