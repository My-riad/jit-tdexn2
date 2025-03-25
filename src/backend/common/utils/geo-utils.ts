/**
 * Geospatial utility functions for the freight optimization platform
 * 
 * This module provides a comprehensive set of geographic calculations necessary for
 * tracking, routing, geofencing, and optimization algorithms throughout the platform.
 */

import * as turf from '@turf/turf'; // ^6.5.0

// Earth radius constants
export const EARTH_RADIUS_KM = 6371.0;
export const EARTH_RADIUS_MILES = 3958.8;

// Conversion constants
export const DEGREES_TO_RADIANS = Math.PI / 180;
export const RADIANS_TO_DEGREES = 180 / Math.PI;

/**
 * Interface representing a geographic point with latitude and longitude
 */
interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Interface representing a polygon bounding box
 */
interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * Type representing a polygon as an array of points
 */
type Polygon = Array<{ latitude: number; longitude: number }>;

/**
 * Type representing a polyline as an array of points
 */
type Polyline = Array<{ latitude: number; longitude: number }>;

/**
 * Calculates the distance between two geographic points using the Haversine formula
 * 
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lon1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lon2 - Longitude of the second point in decimal degrees
 * @param unit - Unit of distance ('km' or 'miles'), defaults to 'km'
 * @returns Distance between the points in the specified unit (km or miles)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'km' | 'miles' = 'km'
): number {
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = lat1 * DEGREES_TO_RADIANS;
  const lon1Rad = lon1 * DEGREES_TO_RADIANS;
  const lat2Rad = lat2 * DEGREES_TO_RADIANS;
  const lon2Rad = lon2 * DEGREES_TO_RADIANS;

  // Calculate differences between coordinates
  const deltaLat = lat2Rad - lat1Rad;
  const deltaLon = lon2Rad - lon1Rad;

  // Apply the Haversine formula
  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Multiply by Earth's radius in the requested unit
  const radius = unit === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;
  return radius * c;
}

/**
 * Calculates the initial bearing (forward azimuth) between two geographic points
 * 
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lon1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lon2 - Longitude of the second point in decimal degrees
 * @returns Bearing in degrees from north (0-360)
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

  // Calculate the forward azimuth using the spherical law of sines
  const y = Math.sin(lon2Rad - lon1Rad) * Math.cos(lat2Rad);
  const x = 
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad);
  let bearing = Math.atan2(y, x) * RADIANS_TO_DEGREES;

  // Normalize the bearing to a value between 0 and 360 degrees
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

/**
 * Determines if a geographic point is inside a polygon defined by an array of points
 * 
 * @param latitude - Latitude of the point to check
 * @param longitude - Longitude of the point to check
 * @param polygon - Array of points defining the polygon
 * @returns True if the point is inside the polygon, false otherwise
 */
export function isPointInPolygon(
  latitude: number,
  longitude: number,
  polygon: Polygon
): boolean {
  // Implementation of ray casting algorithm for point-in-polygon detection
  let isInside = false;
  const x = longitude;
  const y = latitude;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    // Check if ray from point crosses polygon edge
    const intersect = 
      (yi > y) !== (yj > y) && 
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    // Toggle inside/outside status if ray crosses edge
    if (intersect) {
      isInside = !isInside;
    }
  }

  return isInside;
}

/**
 * Calculates the geographic midpoint between two points
 * 
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lon1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lon2 - Longitude of the second point in decimal degrees
 * @returns Object containing latitude and longitude of the midpoint
 */
export function calculateMidpoint(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): GeoPoint {
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = lat1 * DEGREES_TO_RADIANS;
  const lon1Rad = lon1 * DEGREES_TO_RADIANS;
  const lat2Rad = lat2 * DEGREES_TO_RADIANS;
  const lon2Rad = lon2 * DEGREES_TO_RADIANS;

  // Calculate the midpoint using spherical geometry formulas
  const Bx = Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad);
  const By = Math.cos(lat2Rad) * Math.sin(lon2Rad - lon1Rad);
  const midLat = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + Bx) * (Math.cos(lat1Rad) + Bx) + By * By)
  );
  const midLon = lon1Rad + Math.atan2(By, Math.cos(lat1Rad) + Bx);

  // Convert the result back to degrees
  return {
    latitude: midLat * RADIANS_TO_DEGREES,
    longitude: midLon * RADIANS_TO_DEGREES
  };
}

/**
 * Calculates a destination point given a starting point, bearing, and distance
 * 
 * @param latitude - Latitude of the starting point in decimal degrees
 * @param longitude - Longitude of the starting point in decimal degrees
 * @param bearing - Bearing in degrees from north (0-360)
 * @param distance - Distance to travel
 * @param unit - Unit of distance ('km' or 'miles'), defaults to 'km'
 * @returns Object containing latitude and longitude of the destination point
 */
export function calculateDestinationPoint(
  latitude: number,
  longitude: number,
  bearing: number,
  distance: number,
  unit: 'km' | 'miles' = 'km'
): GeoPoint {
  // Convert latitude, longitude, and bearing from degrees to radians
  const latRad = latitude * DEGREES_TO_RADIANS;
  const lonRad = longitude * DEGREES_TO_RADIANS;
  const bearingRad = bearing * DEGREES_TO_RADIANS;

  // Select the appropriate Earth radius based on the unit parameter
  const radius = unit === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;

  // Calculate the angular distance by dividing the distance by Earth's radius
  const angularDistance = distance / radius;

  // Apply the formula to find the destination point coordinates
  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );
  
  const destLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLatRad)
  );

  // Convert the result back to degrees
  return {
    latitude: destLatRad * RADIANS_TO_DEGREES,
    longitude: destLonRad * RADIANS_TO_DEGREES
  };
}

/**
 * Calculates a bounding box around a center point with a specified radius
 * 
 * @param latitude - Latitude of the center point in decimal degrees
 * @param longitude - Longitude of the center point in decimal degrees
 * @param radiusKm - Radius in kilometers
 * @returns Object containing min/max latitude and longitude values
 */
export function calculateBoundingBox(
  latitude: number,
  longitude: number,
  radiusKm: number
): BoundingBox {
  // Calculate the approximate latitude change for the given radius
  const latChange = radiusKm / EARTH_RADIUS_KM * RADIANS_TO_DEGREES;
  
  // Calculate the approximate longitude change for the given radius and latitude
  const lonChange = 
    radiusKm / (EARTH_RADIUS_KM * Math.cos(latitude * DEGREES_TO_RADIANS)) * RADIANS_TO_DEGREES;
  
  // Compute the minimum and maximum latitude and longitude values
  return {
    minLat: latitude - latChange,
    maxLat: latitude + latChange,
    minLon: longitude - lonChange,
    maxLon: longitude + lonChange
  };
}

/**
 * Determines if a point is within a specified distance of a polyline
 * 
 * @param latitude - Latitude of the point to check
 * @param longitude - Longitude of the point to check
 * @param polyline - Array of points defining the polyline
 * @param thresholdKm - Threshold distance in kilometers
 * @returns True if the point is within the threshold distance of the polyline
 */
export function isPointNearPolyline(
  latitude: number,
  longitude: number,
  polyline: Polyline,
  thresholdKm: number
): boolean {
  // Iterate through each segment of the polyline
  for (let i = 0; i < polyline.length - 1; i++) {
    // Calculate the minimum distance from the point to the current segment
    const distance = calculateDistanceFromPointToLine(
      latitude,
      longitude,
      polyline[i].latitude,
      polyline[i].longitude,
      polyline[i + 1].latitude,
      polyline[i + 1].longitude
    );
    
    // If the distance is less than the threshold, return true
    if (distance < thresholdKm) {
      return true;
    }
  }
  
  // If no segment is within the threshold distance, return false
  return false;
}

/**
 * Calculates the area of a polygon defined by an array of geographic points
 * 
 * @param polygon - Array of points defining the polygon
 * @param unit - Unit of area ('km' or 'miles'), defaults to 'km'
 * @returns Area of the polygon in square kilometers or miles
 */
export function calculateAreaOfPolygon(
  polygon: Polygon,
  unit: 'km' | 'miles' = 'km'
): number {
  // Convert the polygon to GeoJSON format for turf.js
  const points = polygon.map(point => [point.longitude, point.latitude]);
  points.push(points[0]); // Close the polygon by adding the first point at the end
  
  const polygonGeoJSON = turf.polygon([points]);
  
  // Use turf.js area calculation for accurate geodesic area measurement
  const areaInSquareMeters = turf.area(polygonGeoJSON);
  
  // Convert the result to the requested unit
  if (unit === 'km') {
    return areaInSquareMeters / 1_000_000; // Convert from m² to km²
  } else {
    return areaInSquareMeters / 2_589_988; // Convert from m² to miles²
  }
}

/**
 * Simplifies a polygon by reducing the number of points while preserving its shape
 * 
 * @param polygon - Array of points defining the polygon
 * @param tolerance - Tolerance level for simplification (higher values simplify more)
 * @returns Simplified polygon with fewer points
 */
export function simplifyPolygon(
  polygon: Polygon,
  tolerance: number
): Polygon {
  // Convert the polygon to GeoJSON format for turf.js
  const points = polygon.map(point => [point.longitude, point.latitude]);
  points.push(points[0]); // Close the polygon by adding the first point at the end
  
  const polygonGeoJSON = turf.polygon([points]);
  
  // Use turf.js simplify function with the Douglas-Peucker algorithm
  const simplified = turf.simplify(polygonGeoJSON, {
    tolerance,
    highQuality: true
  });
  
  // Extract the coordinates from the result
  const coordinates = simplified.geometry.coordinates[0];
  
  // Convert back to our Polygon format (excluding the last point which is a duplicate of the first)
  return coordinates.slice(0, -1).map(coord => ({
    latitude: coord[1],
    longitude: coord[0]
  }));
}

/**
 * Calculates the centroid (geometric center) of a polygon
 * 
 * @param polygon - Array of points defining the polygon
 * @returns Object containing latitude and longitude of the centroid
 */
export function calculateCentroid(
  polygon: Polygon
): GeoPoint {
  // Convert the polygon to GeoJSON format for turf.js
  const points = polygon.map(point => [point.longitude, point.latitude]);
  points.push(points[0]); // Close the polygon by adding the first point at the end
  
  const polygonGeoJSON = turf.polygon([points]);
  
  // Use turf.js centroid function for accurate calculation
  const centroid = turf.centroid(polygonGeoJSON);
  
  // Extract the coordinates from the result
  const [longitude, latitude] = centroid.geometry.coordinates;
  
  return { latitude, longitude };
}

/**
 * Creates a circular polygon centered at a point with a specified radius
 * 
 * @param latitude - Latitude of the center point in decimal degrees
 * @param longitude - Longitude of the center point in decimal degrees
 * @param radiusKm - Radius in kilometers
 * @param points - Number of points to generate for the circle (default: 64)
 * @returns Array of points forming a circular polygon
 */
export function createCirclePolygon(
  latitude: number,
  longitude: number,
  radiusKm: number,
  points: number = 64
): Polygon {
  // Create a GeoJSON point for the center
  const center = turf.point([longitude, latitude]);
  
  // Use turf.js circle function to generate a circular polygon
  const circle = turf.circle(center, radiusKm, {
    steps: points,
    units: 'kilometers'
  });
  
  // Extract the coordinates from the result
  const coordinates = circle.geometry.coordinates[0];
  
  // Convert to our Polygon format (excluding the last point which is a duplicate of the first)
  return coordinates.slice(0, -1).map(coord => ({
    latitude: coord[1],
    longitude: coord[0]
  }));
}

/**
 * Calculates the minimum distance from a point to a line segment
 * 
 * @param pointLat - Latitude of the point
 * @param pointLon - Longitude of the point
 * @param lineLat1 - Latitude of the first endpoint of the line segment
 * @param lineLon1 - Longitude of the first endpoint of the line segment
 * @param lineLat2 - Latitude of the second endpoint of the line segment
 * @param lineLon2 - Longitude of the second endpoint of the line segment
 * @returns Minimum distance from the point to the line segment in kilometers
 */
export function calculateDistanceFromPointToLine(
  pointLat: number,
  pointLon: number,
  lineLat1: number,
  lineLon1: number,
  lineLat2: number,
  lineLon2: number
): number {
  // Calculate the length of the line segment
  const segmentLength = calculateDistance(lineLat1, lineLon1, lineLat2, lineLon2);
  
  // If the length is zero, return the distance from the point to either end of the segment
  if (segmentLength === 0) {
    return calculateDistance(pointLat, pointLon, lineLat1, lineLon1);
  }
  
  // Convert to Cartesian coordinates for simplicity
  // This is an approximation that works for small distances
  const x = (pointLon - lineLon1) * Math.cos(lineLat1 * DEGREES_TO_RADIANS);
  const y = (pointLat - lineLat1);
  const dx = (lineLon2 - lineLon1) * Math.cos(lineLat1 * DEGREES_TO_RADIANS);
  const dy = (lineLat2 - lineLat1);
  
  // Calculate the projection of the point onto the line segment
  const projection = (x * dx + y * dy) / (dx * dx + dy * dy);
  
  // If the projection falls outside the segment, return the distance to the nearest endpoint
  if (projection < 0) {
    return calculateDistance(pointLat, pointLon, lineLat1, lineLon1);
  }
  if (projection > 1) {
    return calculateDistance(pointLat, pointLon, lineLat2, lineLon2);
  }
  
  // Calculate the perpendicular distance to the line
  const projectedLat = lineLat1 + projection * (lineLat2 - lineLat1);
  const projectedLon = lineLon1 + projection * (lineLon2 - lineLon1);
  
  return calculateDistance(pointLat, pointLon, projectedLat, projectedLon);
}