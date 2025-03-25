/**
 * Geospatial Utility Functions
 *
 * This module provides utility functions for geospatial calculations in the
 * AI-driven Freight Optimization Platform. These functions support location-based
 * features including distance calculations, coordinate transformations, geofence
 * operations, and other geographic utilities.
 * 
 * @version 1.0.0
 */

import { Position, Geofence, GeofenceType } from '../interfaces/tracking.interface';

// Constants
/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Earth's radius in miles
 */
const EARTH_RADIUS_MI = 3959;

/**
 * Conversion factor from degrees to radians
 */
const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Conversion factor from radians to degrees
 */
const RADIANS_TO_DEGREES = 180 / Math.PI;

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * 
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lon1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lon2 - Longitude of the second point in decimal degrees
 * @param unit - Unit of measurement ('km' for kilometers, 'mi' for miles), defaults to 'mi'
 * @returns The distance between the two points in the specified unit
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: string = 'mi'
): number {
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = lat1 * DEGREES_TO_RADIANS;
  const lon1Rad = lon1 * DEGREES_TO_RADIANS;
  const lat2Rad = lat2 * DEGREES_TO_RADIANS;
  const lon2Rad = lon2 * DEGREES_TO_RADIANS;

  // Calculate differences between coordinates
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Multiply by Earth's radius in the specified unit
  const radius = unit.toLowerCase() === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_MI;
  return radius * c;
}

/**
 * Calculates the bearing (direction) from one geographic coordinate to another
 * 
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lon1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lon2 - Longitude of the second point in decimal degrees
 * @returns The bearing in degrees (0-360) from the first point to the second
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = lat1 * DEGREES_TO_RADIANS;
  const lon1Rad = lon1 * DEGREES_TO_RADIANS;
  const lat2Rad = lat2 * DEGREES_TO_RADIANS;
  const lon2Rad = lon2 * DEGREES_TO_RADIANS;

  // Calculate the bearing using the formula
  const y = Math.sin(lon2Rad - lon1Rad) * Math.cos(lat2Rad);
  const x = 
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad);
  
  // Convert from radians to degrees and normalize to 0-360
  let bearing = Math.atan2(y, x) * RADIANS_TO_DEGREES;
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

/**
 * Determines if a geographic point is inside a polygon defined by an array of coordinates
 * using the ray-casting algorithm
 * 
 * @param lat - Latitude of the point to check
 * @param lon - Longitude of the point to check
 * @param polygon - Array of coordinates forming the polygon
 * @returns True if the point is inside the polygon, false otherwise
 */
export function isPointInPolygon(
  lat: number,
  lon: number,
  polygon: Array<{latitude: number, longitude: number}>
): boolean {
  // Ensure the polygon has at least 3 points
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    
    // Ray casting algorithm
    const intersect = ((yi > lat) !== (yj > lat)) && 
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      
    if (intersect) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Creates a polygon approximating a circle around a center point
 * 
 * @param centerLat - Latitude of the center point in decimal degrees
 * @param centerLon - Longitude of the center point in decimal degrees
 * @param radiusKm - Radius of the circle in kilometers
 * @param numPoints - Number of points to use for the polygon approximation (default: 32)
 * @returns An array of coordinates forming a circle polygon
 */
export function createCircle(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  numPoints: number = 32
): Array<{latitude: number, longitude: number}> {
  const points: Array<{latitude: number, longitude: number}> = [];
  
  // Convert center point to radians
  const centerLatRad = centerLat * DEGREES_TO_RADIANS;
  const centerLonRad = centerLon * DEGREES_TO_RADIANS;
  
  // Convert radius from kilometers to radians
  const radiusRad = radiusKm / EARTH_RADIUS_KM;
  
  // Calculate points around the circle
  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    
    // Calculate point at the specified angle and radius from center
    const latRad = Math.asin(
      Math.sin(centerLatRad) * Math.cos(radiusRad) +
      Math.cos(centerLatRad) * Math.sin(radiusRad) * Math.cos(angle)
    );
    
    const lonRad = centerLonRad + Math.atan2(
      Math.sin(angle) * Math.sin(radiusRad) * Math.cos(centerLatRad),
      Math.cos(radiusRad) - Math.sin(centerLatRad) * Math.sin(latRad)
    );
    
    // Convert back to degrees
    points.push({
      latitude: latRad * RADIANS_TO_DEGREES,
      longitude: lonRad * RADIANS_TO_DEGREES
    });
  }
  
  // Close the polygon by adding the first point at the end
  points.push(points[0]);
  
  return points;
}

/**
 * Finds points within a specified distance of a reference point
 * 
 * @param referenceLat - Latitude of the reference point in decimal degrees
 * @param referenceLon - Longitude of the reference point in decimal degrees
 * @param points - Array of coordinates to check
 * @param maxDistanceKm - Maximum distance in kilometers
 * @returns Array of nearby points with their distances, sorted by proximity
 */
export function findNearbyPoints(
  referenceLat: number,
  referenceLon: number,
  points: Array<{latitude: number, longitude: number}>,
  maxDistanceKm: number
): Array<{point: {latitude: number, longitude: number}, distance: number}> {
  const nearbyPoints: Array<{point: {latitude: number, longitude: number}, distance: number}> = [];
  
  // Calculate distance from reference point to each point
  for (const point of points) {
    const distance = calculateDistance(
      referenceLat,
      referenceLon,
      point.latitude,
      point.longitude,
      'km'
    );
    
    // Include points within the maximum distance
    if (distance <= maxDistanceKm) {
      nearbyPoints.push({
        point,
        distance
      });
    }
  }
  
  // Sort by distance (closest first)
  return nearbyPoints.sort((a, b) => a.distance - b.distance);
}

/**
 * Calculates the midpoint between two geographic coordinates
 * 
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lon1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lon2 - Longitude of the second point in decimal degrees
 * @returns The midpoint coordinates {latitude, longitude}
 */
export function calculateMidpoint(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): {latitude: number, longitude: number} {
  // Convert to radians
  const lat1Rad = lat1 * DEGREES_TO_RADIANS;
  const lon1Rad = lon1 * DEGREES_TO_RADIANS;
  const lat2Rad = lat2 * DEGREES_TO_RADIANS;
  const lon2Rad = lon2 * DEGREES_TO_RADIANS;
  
  // Calculate midpoint using spherical geometry
  const Bx = Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad);
  const By = Math.cos(lat2Rad) * Math.sin(lon2Rad - lon1Rad);
  
  const midLat = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + Bx) * (Math.cos(lat1Rad) + Bx) + By * By)
  );
  
  const midLon = lon1Rad + Math.atan2(By, Math.cos(lat1Rad) + Bx);
  
  // Convert back to degrees
  return {
    latitude: midLat * RADIANS_TO_DEGREES,
    longitude: midLon * RADIANS_TO_DEGREES
  };
}

/**
 * Calculates a bounding box that contains all provided points
 * 
 * @param points - Array of coordinates
 * @returns Bounding box with minLat, maxLat, minLon, maxLon properties
 */
export function calculateBoundingBox(
  points: Array<{latitude: number, longitude: number}>
): {minLat: number, maxLat: number, minLon: number, maxLon: number} {
  if (points.length === 0) {
    throw new Error('At least one point is required to calculate a bounding box');
  }
  
  // Initialize with the first point
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;
  
  // Find min/max values
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }
  
  return {
    minLat,
    maxLat,
    minLon,
    maxLon
  };
}

/**
 * Calculates the minimum distance from a point to a line segment
 * Helper function for isPointNearRoute
 * 
 * @param lat - Latitude of the point
 * @param lon - Longitude of the point
 * @param lat1 - Latitude of the first endpoint of the line segment
 * @param lon1 - Longitude of the first endpoint of the line segment
 * @param lat2 - Latitude of the second endpoint of the line segment
 * @param lon2 - Longitude of the second endpoint of the line segment
 * @returns The minimum distance in kilometers
 */
function distanceToSegment(
  lat: number, 
  lon: number, 
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Convert to Cartesian coordinates for simplicity
  // This is an approximation that works for small distances
  const x = lon;
  const y = lat;
  const x1 = lon1;
  const y1 = lat1;
  const x2 = lon2;
  const y2 = lat2;
  
  // Calculate the length squared of the line segment
  const lengthSquared = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  
  // If the segment is actually a point, return distance to the point
  if (lengthSquared === 0) {
    return calculateDistance(lat, lon, lat1, lon1, 'km');
  }
  
  // Calculate the projection of the point onto the line
  let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared;
  
  // Constrain t to the segment [0, 1]
  t = Math.max(0, Math.min(1, t));
  
  // Calculate the closest point on the segment
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  
  // Return the distance to the closest point
  return calculateDistance(lat, lon, projY, projX, 'km');
}

/**
 * Determines if a point is within a specified distance of a route
 * 
 * @param lat - Latitude of the point in decimal degrees
 * @param lon - Longitude of the point in decimal degrees
 * @param routePoints - Array of coordinates defining the route
 * @param maxDistanceKm - Maximum distance in kilometers
 * @returns True if the point is near the route, false otherwise
 */
export function isPointNearRoute(
  lat: number,
  lon: number,
  routePoints: Array<{latitude: number, longitude: number}>,
  maxDistanceKm: number
): boolean {
  // Need at least two points to define a route
  if (routePoints.length < 2) {
    return false;
  }
  
  // Check each segment of the route
  for (let i = 0; i < routePoints.length - 1; i++) {
    const segment1 = routePoints[i];
    const segment2 = routePoints[i + 1];
    
    const distance = distanceToSegment(
      lat, 
      lon, 
      segment1.latitude, 
      segment1.longitude, 
      segment2.latitude, 
      segment2.longitude
    );
    
    if (distance <= maxDistanceKm) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculates the area of a polygon defined by an array of coordinates
 * using the Shoelace formula (Gauss's area formula)
 * 
 * @param polygon - Array of coordinates forming the polygon
 * @returns The area of the polygon in square kilometers
 */
export function calculateAreaOfPolygon(
  polygon: Array<{latitude: number, longitude: number}>
): number {
  // Need at least 3 points to form a polygon
  if (polygon.length < 3) {
    return 0;
  }
  
  // Implementation of the Shoelace formula
  let area = 0;
  
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    
    // Convert to radians for proper area calculation
    const lat1 = polygon[i].latitude * DEGREES_TO_RADIANS;
    const lon1 = polygon[i].longitude * DEGREES_TO_RADIANS;
    const lat2 = polygon[j].latitude * DEGREES_TO_RADIANS;
    const lon2 = polygon[j].longitude * DEGREES_TO_RADIANS;
    
    area += lon1 * Math.sin(lat2) - lon2 * Math.sin(lat1);
  }
  
  // Calculate the final area and convert to square kilometers
  // The factor 0.5 is from the Shoelace formula
  // The factor EARTH_RADIUS_KM^2 converts to square kilometers
  area = Math.abs(area * 0.5 * EARTH_RADIUS_KM * EARTH_RADIUS_KM);
  
  return area;
}

/**
 * Decodes an encoded polyline string into an array of coordinates
 * Implementation of Google's polyline encoding algorithm
 * 
 * @param encodedPath - Encoded polyline string
 * @returns Array of decoded coordinates
 */
export function decodePath(encodedPath: string): Array<{latitude: number, longitude: number}> {
  const coordinates: Array<{latitude: number, longitude: number}> = [];
  let index = 0;
  const len = encodedPath.length;
  let lat = 0;
  let lng = 0;
  
  while (index < len) {
    let result = 1;
    let shift = 0;
    let b: number;
    
    // Decode latitude
    do {
      b = encodedPath.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    
    lat += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    
    result = 1;
    shift = 0;
    
    // Decode longitude
    do {
      b = encodedPath.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    
    lng += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    
    coordinates.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5
    });
  }
  
  return coordinates;
}

/**
 * Encodes an array of coordinates into a polyline string
 * Implementation of Google's polyline encoding algorithm
 * 
 * @param path - Array of coordinates to encode
 * @returns Encoded polyline string
 */
export function encodePath(path: Array<{latitude: number, longitude: number}>): string {
  if (path.length === 0) {
    return '';
  }
  
  let result = '';
  let prevLat = 0;
  let prevLng = 0;
  
  for (const point of path) {
    // Convert to integer values, multiply by 1e5 to preserve 5 decimal places
    const lat = Math.round(point.latitude * 1e5);
    const lng = Math.round(point.longitude * 1e5);
    
    // Encode the differences from the previous point
    encodeValue(lat - prevLat);
    encodeValue(lng - prevLng);
    
    // Update previous values
    prevLat = lat;
    prevLng = lng;
  }
  
  return result;
  
  // Helper function to encode a single value
  function encodeValue(value: number): void {
    // Left shift by 1 and invert if negative
    value = value < 0 ? ~(value << 1) : (value << 1);
    
    // Handle multi-byte encoding
    while (value >= 0x20) {
      result += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    
    result += String.fromCharCode(value + 63);
  }
}

/**
 * Formats a distance value with the appropriate unit
 * 
 * @param distance - Distance value to format
 * @param unit - Unit of measurement ('km' or 'mi'), defaults to 'mi'
 * @param decimals - Number of decimal places, defaults to 1
 * @returns Formatted distance string with unit
 */
export function formatDistance(
  distance: number,
  unit: string = 'mi',
  decimals: number = 1
): string {
  // Round to the specified number of decimal places
  const roundedDistance = parseFloat(distance.toFixed(decimals));
  
  // Add the appropriate unit
  const formattedUnit = unit.toLowerCase() === 'km' ? 'km' : 'mi';
  
  return `${roundedDistance} ${formattedUnit}`;
}

/**
 * Determines if a geofence is currently active based on its start and end dates
 * 
 * @param geofence - Geofence object to check
 * @returns True if the geofence is active, false otherwise
 */
export function isGeofenceActive(geofence: Geofence): boolean {
  // Check if the active property is explicitly set to false
  if (geofence.active === false) {
    return false;
  }
  
  const now = new Date();
  
  // Check start date if specified
  if (geofence.startDate && new Date(geofence.startDate) > now) {
    return false;
  }
  
  // Check end date if specified
  if (geofence.endDate && new Date(geofence.endDate) < now) {
    return false;
  }
  
  return true;
}

/**
 * Converts a geofence object to a polygon array of coordinates
 * 
 * @param geofence - Geofence object to convert
 * @returns Array of coordinates forming the geofence boundary
 */
export function convertGeofenceToPolygon(
  geofence: Geofence
): Array<{latitude: number, longitude: number}> {
  // Handle geofence type
  switch (geofence.geofenceType) {
    case GeofenceType.CIRCLE:
      // Verify required properties for circle geofence
      if (
        typeof geofence.centerLatitude !== 'number' ||
        typeof geofence.centerLongitude !== 'number' ||
        typeof geofence.radius !== 'number'
      ) {
        throw new Error('Circle geofence must have centerLatitude, centerLongitude, and radius properties');
      }
      
      // Create a circle polygon
      return createCircle(
        geofence.centerLatitude,
        geofence.centerLongitude,
        geofence.radius * 1.60934, // Convert miles to kilometers
        64 // Use more points for accuracy
      );
      
    case GeofenceType.POLYGON:
      // Verify required properties for polygon geofence
      if (!geofence.coordinates || !Array.isArray(geofence.coordinates) || geofence.coordinates.length < 3) {
        throw new Error('Polygon geofence must have at least 3 coordinates');
      }
      
      // Return the existing coordinates
      return geofence.coordinates;
      
    case GeofenceType.CORRIDOR:
      // Verify required properties for corridor geofence
      if (
        !geofence.coordinates || 
        !Array.isArray(geofence.coordinates) || 
        geofence.coordinates.length < 2 ||
        typeof geofence.corridorWidth !== 'number'
      ) {
        throw new Error('Corridor geofence must have at least 2 coordinates and a corridorWidth property');
      }
      
      // Create a corridor polygon from the route and width
      // This is a simplified implementation - a proper corridor would use buffering algorithms
      const route = geofence.coordinates;
      const widthKm = geofence.corridorWidth * 1.60934; // Convert miles to kilometers
      const corridorPolygon: Array<{latitude: number, longitude: number}> = [];
      
      // Create left side of corridor
      for (let i = 0; i < route.length; i++) {
        const point = route[i];
        let bearing: number;
        
        if (i === 0) {
          // First point - use bearing to next point minus 90 degrees
          bearing = (calculateBearing(
            point.latitude, 
            point.longitude, 
            route[i + 1].latitude, 
            route[i + 1].longitude
          ) - 90 + 360) % 360;
        } else if (i === route.length - 1) {
          // Last point - use bearing from previous point minus 90 degrees
          bearing = (calculateBearing(
            route[i - 1].latitude, 
            route[i - 1].longitude, 
            point.latitude, 
            point.longitude
          ) - 90 + 360) % 360;
        } else {
          // Middle point - use average bearing minus 90 degrees
          const bearingTo = calculateBearing(
            point.latitude, 
            point.longitude, 
            route[i + 1].latitude, 
            route[i + 1].longitude
          );
          const bearingFrom = calculateBearing(
            route[i - 1].latitude, 
            route[i - 1].longitude, 
            point.latitude, 
            point.longitude
          );
          bearing = ((bearingFrom + bearingTo) / 2 - 90 + 360) % 360;
        }
        
        // Calculate point at bearing and width
        const lat1Rad = point.latitude * DEGREES_TO_RADIANS;
        const lon1Rad = point.longitude * DEGREES_TO_RADIANS;
        const bearingRad = bearing * DEGREES_TO_RADIANS;
        const distRad = widthKm / 2 / EARTH_RADIUS_KM;
        
        const lat2Rad = Math.asin(
          Math.sin(lat1Rad) * Math.cos(distRad) +
          Math.cos(lat1Rad) * Math.sin(distRad) * Math.cos(bearingRad)
        );
        
        const lon2Rad = lon1Rad + Math.atan2(
          Math.sin(bearingRad) * Math.sin(distRad) * Math.cos(lat1Rad),
          Math.cos(distRad) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
        );
        
        corridorPolygon.push({
          latitude: lat2Rad * RADIANS_TO_DEGREES,
          longitude: lon2Rad * RADIANS_TO_DEGREES
        });
      }
      
      // Create right side of corridor (in reverse order)
      for (let i = route.length - 1; i >= 0; i--) {
        const point = route[i];
        let bearing: number;
        
        if (i === route.length - 1) {
          // Last point - use bearing from previous point plus 90 degrees
          bearing = (calculateBearing(
            route[i - 1].latitude, 
            route[i - 1].longitude, 
            point.latitude, 
            point.longitude
          ) + 90) % 360;
        } else if (i === 0) {
          // First point - use bearing to next point plus 90 degrees
          bearing = (calculateBearing(
            point.latitude, 
            point.longitude, 
            route[i + 1].latitude, 
            route[i + 1].longitude
          ) + 90) % 360;
        } else {
          // Middle point - use average bearing plus 90 degrees
          const bearingTo = calculateBearing(
            point.latitude, 
            point.longitude, 
            route[i + 1].latitude, 
            route[i + 1].longitude
          );
          const bearingFrom = calculateBearing(
            route[i - 1].latitude, 
            route[i - 1].longitude, 
            point.latitude, 
            point.longitude
          );
          bearing = ((bearingFrom + bearingTo) / 2 + 90) % 360;
        }
        
        // Calculate point at bearing and width
        const lat1Rad = point.latitude * DEGREES_TO_RADIANS;
        const lon1Rad = point.longitude * DEGREES_TO_RADIANS;
        const bearingRad = bearing * DEGREES_TO_RADIANS;
        const distRad = widthKm / 2 / EARTH_RADIUS_KM;
        
        const lat2Rad = Math.asin(
          Math.sin(lat1Rad) * Math.cos(distRad) +
          Math.cos(lat1Rad) * Math.sin(distRad) * Math.cos(bearingRad)
        );
        
        const lon2Rad = lon1Rad + Math.atan2(
          Math.sin(bearingRad) * Math.sin(distRad) * Math.cos(lat1Rad),
          Math.cos(distRad) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
        );
        
        corridorPolygon.push({
          latitude: lat2Rad * RADIANS_TO_DEGREES,
          longitude: lon2Rad * RADIANS_TO_DEGREES
        });
      }
      
      // Close the polygon by adding the first point again
      corridorPolygon.push(corridorPolygon[0]);
      
      return corridorPolygon;
      
    default:
      throw new Error(`Unsupported geofence type: ${geofence.geofenceType}`);
  }
}