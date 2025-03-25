/**
 * Map Utility Functions
 *
 * This module provides map-related helper functions for the driver mobile application,
 * including creating map markers, layers, and viewports from various data sources.
 * These utilities are essential for rendering the interactive maps in the driver app,
 * showing current location, recommended loads, routes, and other geographic elements.
 * 
 * @version 1.0.0
 */

import mapboxgl from 'mapbox-gl'; // v2.15.0
import { Position } from '../../../common/interfaces/tracking.interface';
import { Load, LoadRecommendation } from '../../../common/interfaces/load.interface';
import { BonusZone } from '../../../common/interfaces/gamification.interface';
import { calculateDistance, calculateBoundingBox, decodePath } from '../../../common/utils/geoUtils';

// Map display constants
export const DEFAULT_ZOOM = 12;
export const DEFAULT_PADDING = 50;
export const LOAD_MARKER_COLOR = "#1A73E8"; // Blue
export const SMART_HUB_MARKER_COLOR = "#34A853"; // Green
export const DRIVER_MARKER_COLOR = "#FBBC04"; // Orange/Yellow
export const BONUS_ZONE_COLOR = "#EA4335"; // Red
export const ROUTE_LINE_COLOR = "#1A73E8"; // Blue
export const DARK_MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
export const LIGHT_MAP_STYLE = "mapbox://styles/mapbox/streets-v11";

/**
 * Interface for map marker objects
 */
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  type: string;
  title?: string;
  subtitle?: string;
  data?: any;
  icon?: string;
  heading?: number;
}

/**
 * Interface for map viewport configuration
 */
export interface MapViewport {
  center?: { longitude: number; latitude: number };
  zoom?: number;
  bounds?: [[number, number], [number, number]];
  padding?: number;
  bearing?: number;
  pitch?: number;
}

/**
 * Interface for GeoJSON layer objects
 */
export interface GeoJSONLayer {
  id: string;
  type: string;
  features: object[];
  style?: object;
}

/**
 * Creates map marker data for load objects
 * 
 * @param loads - Array of load recommendation objects
 * @returns Array of marker objects ready for rendering on the map
 */
export function createLoadMarkers(loads: LoadRecommendation[]): MapMarker[] {
  return loads.map(load => {
    // In a real implementation, we would need to have access to the load's origin coordinates
    // This might come from a separate lookup or be attached to the recommendation object
    
    // For this implementation, we'll create a deterministic coordinate based on the load ID
    // This is just for demonstration purposes
    const idNum = parseInt(load.loadId.replace(/\D/g, ''), 10) || 0;
    const latitude = 40 + (idNum % 10) * 0.1;
    const longitude = -90 + (idNum % 20) * 0.1;
    
    return {
      id: load.loadId,
      latitude,
      longitude,
      color: LOAD_MARKER_COLOR,
      type: 'load',
      title: `${load.origin} → ${load.destination}`,
      subtitle: `$${load.rate.toFixed(2)} • Score: ${load.efficiencyScore}`,
      data: load,
    };
  });
}

/**
 * Creates a map marker for the driver's current position
 * 
 * @param position - Position object with latitude, longitude, and optional heading
 * @returns Marker object ready for rendering on the map
 */
export function createDriverMarker(position: Position): MapMarker {
  return {
    id: 'driver-current-position',
    latitude: position.latitude,
    longitude: position.longitude,
    color: DRIVER_MARKER_COLOR,
    type: 'driver',
    heading: position.heading,
  };
}

/**
 * Creates a GeoJSON layer for bonus zones
 * 
 * @param bonusZones - Array of bonus zone objects
 * @returns GeoJSON layer object ready for rendering on the map
 */
export function createBonusZoneLayer(bonusZones: BonusZone[]): GeoJSONLayer {
  // Create a GeoJSON feature collection for the bonus zones
  const features = bonusZones.map(zone => {
    // Convert the bonus zone boundary to GeoJSON coordinates
    // GeoJSON uses [longitude, latitude] format
    const coordinates = zone.boundary.map(point => [point.longitude, point.latitude]);
    
    // Close the polygon by adding the first point at the end
    if (coordinates.length > 0 && 
        (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
         coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
      coordinates.push([coordinates[0][0], coordinates[0][1]]);
    }
    
    // Create a GeoJSON polygon feature
    return {
      type: 'Feature',
      properties: {
        id: zone.id,
        name: zone.name,
        multiplier: zone.multiplier,
        reason: zone.reason,
        startTime: zone.startTime,
        endTime: zone.endTime,
        isActive: zone.isActive,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates], // GeoJSON polygons have nested arrays
      },
    };
  });
  
  // Create the GeoJSON layer
  return {
    id: 'bonus-zones',
    type: 'FeatureCollection',
    features,
    style: {
      fillColor: BONUS_ZONE_COLOR,
      fillOpacity: 0.3,
      strokeColor: BONUS_ZONE_COLOR,
      strokeWidth: 2,
      strokeOpacity: 0.8,
    },
  };
}

/**
 * Creates a GeoJSON layer for a route between origin and destination
 * 
 * @param origin - Position object for the route origin
 * @param destination - Position object for the route destination
 * @param encodedPath - Optional encoded polyline string representing the route
 * @returns GeoJSON layer object ready for rendering on the map
 */
export function createRouteLayer(
  origin: Position,
  destination: Position,
  encodedPath?: string
): GeoJSONLayer {
  let coordinates: [number, number][];
  
  // If an encoded path is provided, decode it
  if (encodedPath) {
    // Use the decodePath utility to convert the encoded path to coordinates
    const decodedCoordinates = decodePath(encodedPath);
    // Convert to GeoJSON format [longitude, latitude]
    coordinates = decodedCoordinates.map(coord => [coord.longitude, coord.latitude]);
  } else {
    // If no encoded path, create a simple straight line from origin to destination
    coordinates = [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ];
  }
  
  // Create a GeoJSON LineString feature
  const feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
  
  // Create the GeoJSON layer
  return {
    id: 'route',
    type: 'FeatureCollection',
    features: [feature],
    style: {
      strokeColor: ROUTE_LINE_COLOR,
      strokeWidth: 4,
      strokeOpacity: 0.8,
    },
  };
}

/**
 * Creates a map viewport centered on the current location
 * 
 * @param currentPosition - Position object with latitude and longitude
 * @param zoom - Optional zoom level (defaults to DEFAULT_ZOOM)
 * @returns Viewport object with center coordinates and zoom level
 */
export function createViewportForCurrentLocation(
  currentPosition: Position,
  zoom?: number
): MapViewport {
  return {
    center: {
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
    },
    zoom: zoom !== undefined ? zoom : DEFAULT_ZOOM,
  };
}

/**
 * Creates a map viewport that includes all provided positions
 * 
 * @param positions - Array of position objects
 * @param options - Optional configuration including padding
 * @returns Viewport object with bounds that include all positions
 */
export function createViewportForPositions(
  positions: Position[],
  options?: { padding?: number }
): MapViewport | null {
  // If no positions, return null
  if (!positions.length) {
    return null;
  }
  
  // If only one position, create a viewport centered on that position
  if (positions.length === 1) {
    return createViewportForCurrentLocation(positions[0]);
  }
  
  // Calculate the bounding box that contains all positions
  const boundingBox = calculateBoundingBox(
    positions.map(pos => ({ latitude: pos.latitude, longitude: pos.longitude }))
  );
  
  // Create the viewport with the calculated bounds
  return {
    bounds: [
      [boundingBox.minLon, boundingBox.minLat],
      [boundingBox.maxLon, boundingBox.maxLat],
    ],
    padding: options?.padding !== undefined ? options.padding : DEFAULT_PADDING,
  };
}

/**
 * Gets the appropriate map style based on user preferences
 * 
 * @param isDarkMode - Whether the app is in dark mode
 * @returns Mapbox style URL
 */
export function getMapStyle(isDarkMode: boolean): string {
  return isDarkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
}

/**
 * Calculates the distance from current position to a load's origin
 * 
 * @param currentPosition - Current position object
 * @param load - Load object
 * @param unit - Optional unit of measurement ('km' or 'mi', defaults to 'mi')
 * @returns Distance in the specified unit
 */
export function calculateDistanceToLoad(
  currentPosition: Position,
  load: Load,
  unit: string = 'mi'
): number {
  // In a real implementation, we would need access to the load's origin coordinates
  // For now, we'll use a placeholder approach similar to createLoadMarkers
  
  // For this implementation, we'll create a deterministic coordinate based on the load ID
  const idNum = parseInt(load.id.replace(/\D/g, ''), 10) || 0;
  const originLatitude = 40 + (idNum % 10) * 0.1;
  const originLongitude = -90 + (idNum % 20) * 0.1;
  
  // Calculate the distance using the utility function
  return calculateDistance(
    currentPosition.latitude,
    currentPosition.longitude,
    originLatitude,
    originLongitude,
    unit
  );
}

/**
 * Sorts an array of loads by distance from current position
 * 
 * @param loads - Array of load recommendation objects
 * @param currentPosition - Current position object
 * @returns Sorted array of loads with distance property added
 */
export function sortLoadsByDistance(
  loads: LoadRecommendation[],
  currentPosition: Position
): (LoadRecommendation & { distance: number })[] {
  // Calculate distance for each load and add it as a property
  const loadsWithDistance = loads.map(load => {
    // Convert LoadRecommendation to Load for calculateDistanceToLoad
    // This is a simplification - in a real implementation we would have
    // a more consistent way to handle the different interfaces
    const loadAsLoad = {
      id: load.loadId,
      // Add other required Load properties
    } as unknown as Load;
    
    const distance = calculateDistanceToLoad(currentPosition, loadAsLoad);
    return { ...load, distance };
  });
  
  // Sort by distance (ascending)
  return loadsWithDistance.sort((a, b) => a.distance - b.distance);
}

/**
 * Determines if a position is within any bonus zone
 * 
 * @param position - Position object
 * @param bonusZones - Array of bonus zone objects
 * @returns The bonus zone containing the position, or null if none
 */
export function isPositionInBonusZone(
  position: Position,
  bonusZones: BonusZone[]
): BonusZone | null {
  for (const zone of bonusZones) {
    // Check if the position is inside the polygon defined by the zone boundary
    const isInside = isPointInPolygon(position.latitude, position.longitude, zone.boundary);
    if (isInside) {
      return zone;
    }
  }
  return null;
}

/**
 * Helper function to determine if a point is inside a polygon
 * Ray-casting algorithm
 * 
 * @param lat - Latitude of the point
 * @param lon - Longitude of the point
 * @param polygon - Array of coordinates forming the polygon
 * @returns True if the point is inside the polygon, false otherwise
 */
function isPointInPolygon(
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