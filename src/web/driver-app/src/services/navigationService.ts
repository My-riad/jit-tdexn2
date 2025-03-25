import { Linking, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import MapboxDirections from '@mapbox/mapbox-sdk/services/directions';
import { v4 as uuidv4 } from 'uuid';
import { Position } from '../../../common/interfaces/tracking.interface';
import { calculateDistance } from '../../../common/utils/geoUtils';
import logger from '../../../common/utils/logger';
import { cacheData, getCachedData, addQueuedRequest } from './offlineStorageService';

// Constants
const ROUTE_CACHE_KEY_PREFIX = 'route_';
const ROUTE_CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const DEFAULT_NAVIGATION_PROVIDER = 'mapbox';

// Interfaces
export interface NavigationOptions {
  provider?: string;
  mode?: string;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  useImperialUnits?: boolean;
}

export interface DirectionsOptions {
  mode?: string;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  alternatives?: boolean;
  language?: string;
  units?: string;
}

export interface ETAOptions {
  includeTraffic?: boolean;
  departureTime?: Date;
}

export interface Route {
  routeId: string;
  distance: number;
  duration: number;
  geometry: string;
  points: Position[];
  legs: RouteLeg[];
  summary: string;
  warnings: string[];
  waypoints: Position[];
  provider: string;
  createdAt: Date;
}

export interface RouteLeg {
  distance: number;
  duration: number;
  steps: RouteStep[];
  summary: string;
}

export interface RouteStep {
  distance: number;
  duration: number;
  geometry: string;
  maneuver: any;
  name: string;
  mode: string;
  instruction: string;
}

export interface ETAResult {
  estimatedArrivalTime: Date;
  remainingDistance: number;
  remainingDuration: number;
  trafficDelay: number;
  confidence: number;
}

/**
 * Opens the device's native navigation app with directions to the destination
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 * @param destName - Destination name
 * @param options - Navigation options
 * @returns Promise that resolves to true if navigation was successfully launched
 */
export async function openExternalNavigation(
  destLat: number,
  destLng: number,
  destName: string,
  options?: NavigationOptions
): Promise<boolean> {
  try {
    const platform = Platform.OS;
    const provider = options?.provider || DEFAULT_NAVIGATION_PROVIDER;
    
    const navUrl = formatNavigationLink(destLat, destLng, destName, platform, provider);
    
    const supported = await Linking.canOpenURL(navUrl);
    if (!supported) {
      // Fallback to Google Maps if the preferred provider isn't supported
      const googleUrl = formatNavigationLink(destLat, destLng, destName, platform, 'google');
      logger.info('Primary navigation app not supported, falling back to Google Maps');
      await Linking.openURL(googleUrl);
      return true;
    }
    
    await Linking.openURL(navUrl);
    logger.info(`Opened external navigation to ${destName}`);
    return true;
  } catch (error) {
    logger.error('Failed to open external navigation', { error });
    return false;
  }
}

/**
 * Gets directions between two points using the configured navigation provider
 * @param origin - Origin position
 * @param destination - Destination position
 * @param options - Directions options
 * @returns Promise that resolves to a Route object or null if directions couldn't be retrieved
 */
export async function getDirections(
  origin: Position,
  destination: Position,
  options?: DirectionsOptions
): Promise<Route | null> {
  try {
    // Check if we're online
    const connectionInfo = await NetInfo.fetch();
    const isOnline = connectionInfo.isConnected && connectionInfo.isInternetReachable;
    
    // If we're offline, try to get cached route
    if (!isOnline) {
      logger.info('Device is offline, attempting to retrieve cached route');
      const originId = `${origin.latitude},${origin.longitude}`;
      const destinationId = `${destination.latitude},${destination.longitude}`;
      return await getCachedRoute(originId, destinationId);
    }
    
    // We're online, fetch fresh directions
    const provider = options?.mode === 'google' ? 'google' : 'mapbox';
    let route: Route | null = null;
    
    if (provider === 'mapbox') {
      route = await getMapboxDirections(origin, destination, options);
    } else {
      route = await getGoogleDirections(origin, destination, options);
    }
    
    // Cache the route for offline use if we got a valid result
    if (route) {
      const originId = `${origin.latitude},${origin.longitude}`;
      const destinationId = `${destination.latitude},${destination.longitude}`;
      await cacheRoute(originId, destinationId, route);
    }
    
    return route;
  } catch (error) {
    logger.error('Failed to get directions', { error });
    return null;
  }
}

/**
 * Gets directions using the Mapbox Directions API
 * @param origin - Origin position
 * @param destination - Destination position
 * @param options - Directions options
 * @returns Promise that resolves to a Route object or null if directions couldn't be retrieved
 */
async function getMapboxDirections(
  origin: Position,
  destination: Position,
  options?: DirectionsOptions
): Promise<Route | null> {
  try {
    if (!MAPBOX_ACCESS_TOKEN) {
      logger.error('Mapbox access token not configured');
      return null;
    }
    
    const directionsClient = MapboxDirections({ accessToken: MAPBOX_ACCESS_TOKEN });
    
    const profile = options?.mode === 'walking' ? 'walking' : 
                   options?.mode === 'cycling' ? 'cycling' : 'driving';
    
    const response = await directionsClient.getDirections({
      waypoints: [
        { coordinates: [origin.longitude, origin.latitude] },
        { coordinates: [destination.longitude, destination.latitude] }
      ],
      profile,
      geometries: 'geojson',
      overview: 'full',
      steps: true,
      annotations: ['distance', 'duration', 'speed'],
      alternatives: options?.alternatives === true,
      language: options?.language || 'en',
      exclude: [
        ...(options?.avoidTolls ? ['toll'] : []),
        ...(options?.avoidHighways ? ['motorway'] : []),
        ...(options?.avoidFerries ? ['ferry'] : [])
      ]
    }).send();
    
    if (response.statusCode !== 200 || !response.body || !response.body.routes || response.body.routes.length === 0) {
      logger.error('Invalid response from Mapbox Directions API', { 
        status: response.statusCode,
        body: response.body
      });
      return null;
    }
    
    const mapboxRoute = response.body.routes[0];
    
    // Convert to our Route format
    const route: Route = {
      routeId: uuidv4(),
      distance: mapboxRoute.distance / 1000, // Convert to km
      duration: mapboxRoute.duration / 60, // Convert to minutes
      geometry: JSON.stringify(mapboxRoute.geometry),
      points: mapboxRoute.geometry.coordinates.map(coord => ({
        longitude: coord[0],
        latitude: coord[1],
        heading: 0,
        speed: 0,
        accuracy: 0,
        timestamp: new Date().toISOString()
      })),
      legs: mapboxRoute.legs.map(leg => ({
        distance: leg.distance / 1000, // Convert to km
        duration: leg.duration / 60, // Convert to minutes
        steps: leg.steps.map(step => ({
          distance: step.distance / 1000, // Convert to km
          duration: step.duration / 60, // Convert to minutes
          geometry: JSON.stringify(step.geometry),
          maneuver: step.maneuver,
          name: step.name,
          mode: step.mode,
          instruction: step.maneuver.instruction
        })),
        summary: leg.summary || `${(leg.distance / 1000).toFixed(1)} km`
      })),
      summary: mapboxRoute.distance > 0 ? 
        `${(mapboxRoute.distance / 1000).toFixed(1)} km, ${Math.ceil(mapboxRoute.duration / 60)} min` : 
        'No route',
      warnings: mapboxRoute.warnings || [],
      waypoints: response.body.waypoints.map(wp => ({
        latitude: wp.location[1],
        longitude: wp.location[0],
        heading: 0,
        speed: 0,
        accuracy: 0,
        timestamp: new Date().toISOString()
      })),
      provider: 'mapbox',
      createdAt: new Date()
    };
    
    return route;
  } catch (error) {
    logger.error('Error getting directions from Mapbox', { error });
    return null;
  }
}

/**
 * Gets directions using the Google Directions API
 * @param origin - Origin position
 * @param destination - Destination position
 * @param options - Directions options
 * @returns Promise that resolves to a Route object or null if directions couldn't be retrieved
 */
async function getGoogleDirections(
  origin: Position,
  destination: Position,
  options?: DirectionsOptions
): Promise<Route | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      logger.error('Google Maps API key not configured');
      return null;
    }
    
    const mode = options?.mode || 'driving';
    const avoid = [
      ...(options?.avoidTolls ? ['tolls'] : []),
      ...(options?.avoidHighways ? ['highways'] : []),
      ...(options?.avoidFerries ? ['ferries'] : [])
    ].join('|');
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}${avoid ? `&avoid=${avoid}` : ''}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      logger.error('Invalid response from Google Directions API', { 
        status: data.status,
        errorMessage: data.error_message
      });
      return null;
    }
    
    const googleRoute = data.routes[0];
    
    // Convert to our Route format
    const route: Route = {
      routeId: uuidv4(),
      distance: googleRoute.legs.reduce((total, leg) => total + leg.distance.value / 1000, 0), // Convert to km
      duration: googleRoute.legs.reduce((total, leg) => total + leg.duration.value / 60, 0), // Convert to minutes
      geometry: googleRoute.overview_polyline.points,
      points: [], // Will be populated in a real implementation by decoding the polyline
      legs: googleRoute.legs.map(leg => ({
        distance: leg.distance.value / 1000, // Convert to km
        duration: leg.duration.value / 60, // Convert to minutes
        steps: leg.steps.map(step => ({
          distance: step.distance.value / 1000, // Convert to km
          duration: step.duration.value / 60, // Convert to minutes
          geometry: step.polyline.points,
          maneuver: {
            type: step.maneuver || 'unknown',
            instruction: step.html_instructions
          },
          name: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
          mode: step.travel_mode.toLowerCase(),
          instruction: step.html_instructions.replace(/<[^>]*>/g, '') // Strip HTML tags
        })),
        summary: `${leg.distance.text}, ${leg.duration.text}`
      })),
      summary: `${googleRoute.legs[0].distance.text}, ${googleRoute.legs[0].duration.text}`,
      warnings: googleRoute.warnings || [],
      waypoints: [
        {
          latitude: origin.latitude,
          longitude: origin.longitude,
          heading: 0,
          speed: 0,
          accuracy: 0,
          timestamp: new Date().toISOString()
        },
        {
          latitude: destination.latitude,
          longitude: destination.longitude,
          heading: 0,
          speed: 0,
          accuracy: 0,
          timestamp: new Date().toISOString()
        }
      ],
      provider: 'google',
      createdAt: new Date()
    };
    
    return route;
  } catch (error) {
    logger.error('Error getting directions from Google', { error });
    return null;
  }
}

/**
 * Caches a route for offline access
 * @param originId - Origin identifier
 * @param destinationId - Destination identifier
 * @param route - Route object to cache
 * @returns Promise that resolves to true if the route was cached successfully
 */
async function cacheRoute(
  originId: string,
  destinationId: string,
  route: Route
): Promise<boolean> {
  try {
    const cacheKey = `${ROUTE_CACHE_KEY_PREFIX}${originId}_${destinationId}`;
    const success = await cacheData(cacheKey, route, { expiration: ROUTE_CACHE_EXPIRATION });
    logger.debug(`Route cached with key: ${cacheKey}`);
    return success;
  } catch (error) {
    logger.error('Failed to cache route', { error });
    return false;
  }
}

/**
 * Retrieves a cached route
 * @param originId - Origin identifier
 * @param destinationId - Destination identifier
 * @returns Promise that resolves to the cached route or null if not found
 */
async function getCachedRoute(
  originId: string,
  destinationId: string
): Promise<Route | null> {
  try {
    const cacheKey = `${ROUTE_CACHE_KEY_PREFIX}${originId}_${destinationId}`;
    const cachedRoute = await getCachedData<Route>(cacheKey);
    
    if (cachedRoute) {
      logger.debug(`Retrieved cached route for ${originId} to ${destinationId}`);
      return cachedRoute;
    }
    
    logger.debug(`No cached route found for ${originId} to ${destinationId}`);
    return null;
  } catch (error) {
    logger.error('Failed to retrieve cached route', { error });
    return null;
  }
}

/**
 * Calculates the estimated time of arrival based on current position, route, and traffic conditions
 * @param currentPosition - Current position
 * @param route - Route object
 * @param options - ETA calculation options
 * @returns Promise that resolves to an ETA result object
 */
export async function calculateETA(
  currentPosition: Position,
  route: Route,
  options?: ETAOptions
): Promise<ETAResult> {
  try {
    // Find nearest point on route
    const nearestPoint = findNearestPointOnRoute(currentPosition, route);
    
    // Calculate remaining distance
    const remainingDistance = calculateRemainingDistance(nearestPoint.index, route);
    
    // Calculate remaining duration based on the route's original duration
    // and the proportion of distance already traveled
    const totalDistance = route.distance;
    const distanceTraveled = totalDistance - remainingDistance;
    const proportionTraveled = totalDistance > 0 ? distanceTraveled / totalDistance : 0;
    let remainingDuration = route.duration * (1 - proportionTraveled);
    
    // Adjust for traffic if requested
    let trafficDelay = 0;
    if (options?.includeTraffic) {
      // In a real implementation, this would call a traffic API
      // For now, we'll simulate a random delay between 0-15 minutes
      trafficDelay = Math.random() * 15;
      remainingDuration += trafficDelay;
    }
    
    // Calculate estimated arrival time
    const now = options?.departureTime || new Date();
    const estimatedArrivalTime = new Date(now.getTime() + remainingDuration * 60 * 1000);
    
    // Assign a confidence level based on factors like distance from route,
    // traffic conditions, and time of day
    const confidence = nearestPoint.distance < 0.1 ? 90 - (trafficDelay * 2) : 70 - (trafficDelay * 2);
    
    const etaResult: ETAResult = {
      estimatedArrivalTime,
      remainingDistance,
      remainingDuration,
      trafficDelay,
      confidence: Math.max(0, Math.min(100, confidence))
    };
    
    logger.debug(`Calculated ETA: ${estimatedArrivalTime.toISOString()}`, {
      remainingDistance,
      remainingDuration,
      confidence: etaResult.confidence
    });
    
    return etaResult;
  } catch (error) {
    logger.error('Failed to calculate ETA', { error });
    
    // Return a fallback ETA with low confidence
    const now = options?.departureTime || new Date();
    const estimatedArrivalTime = new Date(now.getTime() + route.duration * 60 * 1000);
    
    return {
      estimatedArrivalTime,
      remainingDistance: route.distance,
      remainingDuration: route.duration,
      trafficDelay: 0,
      confidence: 50
    };
  }
}

/**
 * Finds the nearest point on a route to a given position
 * @param position - Position to find the nearest point for
 * @param route - Route to search
 * @returns Object containing the nearest point, index, and distance
 */
function findNearestPointOnRoute(
  position: Position,
  route: Route
): { point: Position; index: number; distance: number } {
  let minDistance = Infinity;
  let nearestPoint = route.points[0];
  let nearestIndex = 0;
  
  // Iterate through route points to find the closest one
  for (let i = 0; i < route.points.length; i++) {
    const point = route.points[i];
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      point.latitude,
      point.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
      nearestIndex = i;
    }
  }
  
  return {
    point: nearestPoint,
    index: nearestIndex,
    distance: minDistance
  };
}

/**
 * Calculates the remaining distance along a route from a given point
 * @param startIndex - Index to start from in the route points array
 * @param route - Route object
 * @returns Remaining distance in kilometers
 */
function calculateRemainingDistance(
  startIndex: number,
  route: Route
): number {
  let remainingDistance = 0;
  
  // Sum the distances between consecutive points
  for (let i = startIndex; i < route.points.length - 1; i++) {
    const point1 = route.points[i];
    const point2 = route.points[i + 1];
    
    remainingDistance += calculateDistance(
      point1.latitude,
      point1.longitude,
      point2.latitude,
      point2.longitude
    );
  }
  
  return remainingDistance;
}

/**
 * Formats a navigation link for the specified platform and provider
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 * @param destName - Destination name
 * @param platform - Device platform (ios/android)
 * @param provider - Navigation provider
 * @returns Formatted navigation URL
 */
function formatNavigationLink(
  destLat: number,
  destLng: number,
  destName: string,
  platform: string,
  provider: string
): string {
  const encodedName = encodeURIComponent(destName);
  
  // iOS specific links
  if (platform === 'ios') {
    // Apple Maps (default on iOS)
    if (provider === 'apple') {
      return `maps://maps.apple.com/?daddr=${destLat},${destLng}&q=${encodedName}`;
    }
    // Google Maps
    if (provider === 'google') {
      return `comgooglemaps://?daddr=${destLat},${destLng}&q=${encodedName}&directionsmode=driving`;
    }
    // Waze
    if (provider === 'waze') {
      return `waze://?ll=${destLat},${destLng}&navigate=yes`;
    }
  }
  
  // Android specific links
  if (platform === 'android') {
    // Google Maps (default on Android)
    if (provider === 'google') {
      return `geo:${destLat},${destLng}?q=${destLat},${destLng}(${encodedName})`;
    }
    // Waze
    if (provider === 'waze') {
      return `waze://?ll=${destLat},${destLng}&navigate=yes`;
    }
  }
  
  // Fallback to web URL for Google Maps (works on both platforms)
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
}

/**
 * Service class that provides navigation and routing functionality for the driver app
 */
export class NavigationService {
  private options: NavigationOptions;
  private provider: string;
  private isOnline: boolean = true;
  private mapboxClient: any = null;
  
  /**
   * Creates a new NavigationService instance
   * @param options - Navigation options
   */
  constructor(options?: NavigationOptions) {
    this.options = options || {};
    this.provider = this.options.provider || DEFAULT_NAVIGATION_PROVIDER;
    
    // Initialize Mapbox client if using Mapbox
    if (this.provider === 'mapbox' && MAPBOX_ACCESS_TOKEN) {
      this.mapboxClient = MapboxDirections({ accessToken: MAPBOX_ACCESS_TOKEN });
    }
    
    // Set up network connectivity monitoring
    NetInfo.addEventListener(state => {
      this.handleNetworkChange(state);
    });
    
    logger.info('NavigationService initialized', { provider: this.provider });
  }
  
  /**
   * Navigates to a destination using the device's native navigation app
   * @param destLat - Destination latitude
   * @param destLng - Destination longitude
   * @param destName - Destination name
   * @param options - Navigation options
   * @returns Promise that resolves to true if navigation was successfully launched
   */
  async navigate(
    destLat: number,
    destLng: number,
    destName: string,
    options?: NavigationOptions
  ): Promise<boolean> {
    const navigationOptions = { ...this.options, ...options };
    const result = await openExternalNavigation(destLat, destLng, destName, navigationOptions);
    logger.info(`Navigation requested to ${destName}`, { 
      success: result,
      provider: navigationOptions.provider
    });
    return result;
  }
  
  /**
   * Gets a route between two points
   * @param origin - Origin position
   * @param destination - Destination position
   * @param options - Directions options
   * @returns Promise that resolves to a Route object or null if route couldn't be retrieved
   */
  async getRoute(
    origin: Position,
    destination: Position,
    options?: DirectionsOptions
  ): Promise<Route | null> {
    const directionOptions = { ...this.options, ...options };
    const route = await getDirections(origin, destination, directionOptions);
    logger.info('Route request', {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      success: !!route
    });
    return route;
  }
  
  /**
   * Gets the estimated time of arrival to a destination
   * @param currentPosition - Current position
   * @param destination - Destination position
   * @param options - ETA options
   * @returns Promise that resolves to an ETA result object
   */
  async getETA(
    currentPosition: Position,
    destination: Position,
    options?: ETAOptions
  ): Promise<ETAResult> {
    // First, check if we have a route between these points
    const originId = `${currentPosition.latitude},${currentPosition.longitude}`;
    const destinationId = `${destination.latitude},${destination.longitude}`;
    
    let route = await getCachedRoute(originId, destinationId);
    
    // If no cached route, try to get a new one
    if (!route) {
      route = await this.getRoute(currentPosition, destination);
    }
    
    if (!route) {
      logger.error('Unable to calculate ETA: No route available');
      // Return a default ETA with very low confidence
      return {
        estimatedArrivalTime: new Date(Date.now() + 60 * 60 * 1000), // Now + 1 hour
        remainingDistance: calculateDistance(
          currentPosition.latitude,
          currentPosition.longitude,
          destination.latitude,
          destination.longitude
        ),
        remainingDuration: 60, // Default to 60 minutes
        trafficDelay: 0,
        confidence: 10
      };
    }
    
    const eta = await calculateETA(currentPosition, route, options);
    logger.info('ETA calculation', {
      destination: `${destination.latitude},${destination.longitude}`,
      eta: eta.estimatedArrivalTime.toISOString(),
      confidence: eta.confidence
    });
    
    return eta;
  }
  
  /**
   * Handles changes in network connectivity
   * @param state - Network state information
   */
  private handleNetworkChange(state: any): void {
    const wasOnline = this.isOnline;
    this.isOnline = !!state.isConnected && !!state.isInternetReachable;
    
    if (wasOnline !== this.isOnline) {
      logger.info(`Network connectivity changed: ${this.isOnline ? 'Online' : 'Offline'}`);
    }
  }
}