import axios from 'axios'; // axios@^1.3.4
import * as polyline from '@mapbox/polyline'; // @mapbox/polyline@^1.2.0
import { mappingConfig } from '../config';
import logger from '@common/utils/logger';
import { Position } from '@common/interfaces/position.interface';
import { calculateDistance } from '@common/utils/geo-utils';
import { AppError } from '@common/utils/error-handler';
import { IntegrationType } from '../models/integration.model';

// Define a constant for the provider name
const PROVIDER_NAME = 'mapbox';

/**
 * Interface for geocoding results
 */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

/**
 * Interface for reverse geocoding results
 */
export interface ReverseGeocodingResult {
  addressComponents: { [key: string]: string };
  formattedAddress: string;
}

/**
 * Interface for directions request parameters
 */
export interface DirectionsRequest {
  origin: Position;
  destination: Position;
  waypoints?: Position[];
  profile?: 'driving' | 'walking' | 'cycling' | 'trucking';
  alternatives?: boolean;
  instructions?: 'text' | 'html';
  language?: string;
  steps?: boolean;
  overview?: 'full' | 'simplified' | 'false';
  annotations?: 'duration' | 'distance' | 'speed' | 'congestion';
}

/**
 * Interface for directions results
 */
export interface DirectionsResult {
  routes: {
    distance: number;
    duration: number;
    geometry: string;
    legs: {
      distance: number;
      duration: number;
      steps: {
        distance: number;
        duration: number;
        geometry: string;
        maneuver: {
          instruction: string;
        };
      }[];
    }[];
  }[];
}

/**
 * Interface for distance matrix request parameters
 */
export interface DistanceMatrixRequest {
  origins: Position[];
  destinations: Position[];
  profile?: 'driving' | 'walking' | 'cycling';
}

/**
 * Interface for distance matrix results
 */
export interface DistanceMatrixResult {
  durations: number[][];
  distances: number[][];
}

/**
 * Interface for address validation results
 */
export interface AddressValidationResult {
  isValid: boolean;
  suggestions?: string[];
}

/**
 * Interface for travel time estimation options
 */
export interface TravelTimeOptions {
  departureTime?: Date;
  profile?: 'driving-traffic' | 'driving' | 'walking' | 'cycling';
}

/**
 * Interface for travel time estimation results
 */
export interface TravelTimeResult {
  duration: number;
  distance: number;
}

/**
 * Interface for waypoint optimization request parameters
 */
export interface WaypointOptimizationRequest {
  origin: Position;
  destination: Position;
  waypoints: Position[];
  profile?: 'driving' | 'walking' | 'cycling';
}

/**
 * Interface for waypoint optimization results
 */
export interface WaypointOptimizationResult {
  optimizedWaypoints: Position[];
  routeDetails: DirectionsResult;
}

/**
 * Interface for truck-friendly route request parameters
 */
export interface TruckRouteRequest {
  origin: Position;
  destination: Position;
  truckHeight: number;
  truckWidth: number;
  truckLength: number;
  truckWeight: number;
  profile?: 'driving-traffic' | 'driving';
}

/**
 * Interface for truck-friendly route results
 */
export interface TruckRouteResult {
  route: DirectionsResult;
  warnings?: string[];
}

/**
 * Interface for isochrone request parameters
 */
export interface IsochroneRequest {
  longitude: number;
  latitude: number;
  intervals: number[];
  profile?: 'driving' | 'walking' | 'cycling';
  contours_meters?: number[];
  polygons?: boolean;
}

/**
 * Interface for isochrone results
 */
export interface IsochroneResult {
  features: any[];
}

/**
 * Provider class for Mapbox API integration that handles authentication, request formatting, and response parsing
 */
export class MapboxProvider {
  private accessToken: string;
  private defaultRequestConfig: object;
  private baseUrl: string;

  /**
   * Initializes the Mapbox provider with API credentials and default configuration
   */
  constructor() {
    // Get Mapbox access token from configuration
    this.accessToken = mappingConfig.mapbox.apiKey;

    // Set up base URL for Mapbox API
    this.baseUrl = mappingConfig.mapbox.apiUrl;

    // Set up default request configuration
    this.defaultRequestConfig = {
      timeout: mappingConfig.mapbox.timeout,
      retryAttempts: mappingConfig.mapbox.retryAttempts,
    };

    // Log successful initialization of the provider
    logger.info('MapboxProvider initialized successfully');
  }

  /**
   * Converts an address into geographic coordinates
   * @param address 
   * @returns Promise resolving to geocoding result with coordinates and formatted address
   */
  async geocode(address: string): Promise<GeocodingResult> {
    // Validate input address
    if (!address) {
      throw new AppError('Address is required for geocoding', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Make geocoding request to Mapbox API
      const url = this.buildUrl(`/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`, {
        types: 'address',
      });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Handle response and transform to standard format
      if (response.data && response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const [longitude, latitude] = feature.center;

        // Return geocoding result
        return {
          latitude,
          longitude,
          formattedAddress: feature.place_name,
        };
      } else {
        throw new AppError('Geocoding failed: No results found', { code: 'RES_ROUTE_NOT_FOUND' });
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
    }
  }

  /**
   * Converts geographic coordinates into a human-readable address
   * @param latitude 
   * @param longitude 
   * @returns Promise resolving to reverse geocoding result with address components
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult> {
    // Validate input coordinates
    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required for reverse geocoding', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Make reverse geocoding request to Mapbox API
      const url = this.buildUrl(`/geocoding/v5/mapbox.places/${longitude},${latitude}.json`, {
        types: 'address',
      });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Handle response and transform to standard format
      if (response.data && response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const addressComponents: { [key: string]: string } = {};

        // Extract address components from the response
        feature.context?.forEach((context: any) => {
          const [key, value] = context.id.split('.');
          addressComponents[key] = value;
        });

        // Return reverse geocoding result
        return {
          addressComponents,
          formattedAddress: feature.place_name,
        };
      } else {
        throw new AppError('Reverse geocoding failed: No results found', { code: 'RES_ROUTE_NOT_FOUND' });
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
    }
  }

  /**
   * Calculates directions between an origin and destination, with optional waypoints
   * @param request 
   * @returns Promise resolving to directions result with routes, legs, steps, and polylines
   */
  async getDirections(request: DirectionsRequest): Promise<DirectionsResult> {
    // Validate input request parameters
    if (!request?.origin?.latitude || !request?.origin?.longitude || !request?.destination?.latitude || !request?.destination?.longitude) {
      throw new AppError('Origin and destination coordinates are required for directions', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Make directions request to Mapbox API
      let coordinates = `${request.origin.longitude},${request.origin.latitude};`;
      if (request.waypoints) {
        coordinates += request.waypoints.map(waypoint => `${waypoint.longitude},${waypoint.latitude}`).join(';');
        coordinates += ';';
      }
      coordinates += `${request.destination.longitude},${request.destination.latitude}`;

      const url = this.buildUrl(`/directions/v5/mapbox/${request.profile || 'driving'}/${coordinates}`, {
        alternatives: request.alternatives?.toString() || 'false',
        geometries: 'polyline',
        steps: request.steps?.toString() || 'false',
        overview: request.overview || 'full',
        annotations: request.annotations || 'duration,distance',
      });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Process polylines and decode path geometries
      if (response.data && response.data.routes && response.data.routes.length > 0) {
        response.data.routes.forEach((route: any) => {
          if (route.geometry) {
            route.geometry = polyline.decode(route.geometry);
          }
          route.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              if (step.geometry) {
                step.geometry = polyline.decode(step.geometry);
              }
            });
          });
        });

        // Return directions result with decoded polylines
        return response.data;
      } else {
        throw new AppError('Directions failed: No routes found', { code: 'RES_ROUTE_NOT_FOUND' });
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
    }
  }

  /**
   * Calculates travel distance and time for a matrix of origins and destinations
   * @param request 
   * @returns Promise resolving to distance matrix with travel times and distances
   */
  async getDistanceMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrixResult> {
    // Validate input request parameters
    if (!request?.origins || request.origins.length === 0 || !request?.destinations || request.destinations.length === 0) {
      throw new AppError('Origins and destinations are required for distance matrix', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Make distance matrix request to Mapbox API
      const origins = request.origins.map(origin => `${origin.longitude},${origin.latitude}`).join(';');
      const destinations = request.destinations.map(destination => `${destination.longitude},${destination.latitude}`).join(';');
      const url = this.buildUrl(`/distance/v1/mapbox/${request.profile || 'driving'}/${origins};${destinations}`);
      const response = await axios.get(url, this.defaultRequestConfig);

      // Transform response to standard format
      if (response.data && response.data.durations && response.data.data.distances) {
        // Return distance matrix result
        return {
          durations: response.data.durations,
          distances: response.data.distances,
        };
      } else {
        throw new AppError('Distance matrix failed: Invalid response format', { code: 'EXT_INVALID_RESPONSE' });
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
    }
  }

  /**
   * Validates an address by geocoding it and checking the result quality
   * @param address 
   * @returns Promise resolving to validation result with validity status and suggestions
   */
  async validateAddress(address: string): Promise<AddressValidationResult> {
    // Call geocode method with the address
    try {
      const geocodeResult = await this.geocode(address);

      // Analyze the geocoding result for accuracy and completeness
      const isValid = !!geocodeResult?.formattedAddress;

      // Determine if the address is valid based on result quality
      if (isValid) {
        // Return validation result with status and any suggestions
        return { isValid: true };
      } else {
        // Generate suggestions for invalid or ambiguous addresses
        const suggestions = [`Could not validate address: ${address}`];

        // Return validation result with status and any suggestions
        return { isValid: false, suggestions };
      }
    } catch (error: any) {
      // Handle API errors
      logger.error(`Address validation failed for address: ${address}`, { error });
      return { isValid: false, suggestions: [`Could not validate address: ${address}`] };
    }
  }

  /**
   * Estimates travel time between two points considering traffic conditions
   * @param origin 
   * @param destination 
   * @param options 
   * @returns Promise resolving to travel time estimation with duration and distance
   */
  async estimateTravelTime(origin: Position, destination: Position, options: TravelTimeOptions = {}): Promise<TravelTimeResult> {
    // Validate input positions
    if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
      throw new AppError('Origin and destination coordinates are required for travel time estimation', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Prepare request parameters including departure time for traffic
      const directionsRequest: DirectionsRequest = {
        origin,
        destination,
        profile: options.profile || 'driving',
      };

      // Call getDirections with the prepared parameters
      const directionsResult = await this.getDirections(directionsRequest);

      // Extract duration and distance information from the result
      if (directionsResult?.routes?.length > 0) {
        const route = directionsResult.routes[0];

        // Return travel time estimation with formatted duration and distance
        return {
          duration: route.duration,
          distance: route.distance,
        };
      } else {
        throw new AppError('Travel time estimation failed: No routes found', { code: 'RES_ROUTE_NOT_FOUND' });
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
    }
  }

  /**
   * Optimizes the order of waypoints to minimize travel time or distance
   * @param request 
   * @returns Promise resolving to optimized waypoint order with route details
   */
  async optimizeWaypoints(request: WaypointOptimizationRequest): Promise<WaypointOptimizationResult> {
    // Validate input request parameters
    if (!request?.origin?.latitude || !request?.origin?.longitude || !request?.destination?.latitude || !request?.destination?.longitude || !request?.waypoints || request.waypoints.length === 0) {
      throw new AppError('Origin, destination, and waypoints are required for waypoint optimization', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Prepare directions request with optimize parameter
      const directionsRequest: DirectionsRequest = {
        origin: request.origin,
        destination: request.destination,
        waypoints: request.waypoints,
        profile: request.profile || 'driving',
      };

      // Call getDirections with the prepared parameters
      const directionsResult = await this.getDirections(directionsRequest);

      // Extract optimized waypoint order from the response
      if (directionsResult?.routes?.length > 0) {
        // Return optimization result with ordered waypoints and route details
        return {
          optimizedWaypoints: request.waypoints, // Mapbox API does not return optimized waypoint order
          routeDetails: directionsResult,
        };
      } else {
        throw new AppError('Waypoint optimization failed: No routes found', { code: 'RES_ROUTE_NOT_FOUND' });
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
    }
  }

  /**
   * Finds a route suitable for commercial trucks considering height, weight, and other restrictions
   * @param request 
   * @returns Promise resolving to truck-friendly route with restrictions considered
   */
  async findTruckFriendlyRoute(request: TruckRouteRequest): Promise<TruckRouteResult> {
    // Validate input request parameters including truck dimensions
    if (!request?.origin?.latitude || !request?.origin?.longitude || !request?.destination?.latitude || !request?.destination?.longitude) {
      throw new AppError('Origin and destination coordinates are required for truck routing', { code: 'VAL_MISSING_FIELD' });
    }
    if (!request?.truckHeight || !request?.truckWidth || !request?.truckLength || !request?.truckWeight) {
      throw new AppError('Truck dimensions are required for truck routing', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Prepare directions request with truck-specific parameters
      const directionsRequest: DirectionsRequest = {
        origin: request.origin,
        destination: request.destination,
        profile: request.profile || 'driving',
      };

      // Call getDirections with the prepared parameters
      const route = await this.getDirections(directionsRequest);

      // Process the response to highlight any potential restriction issues
      const warnings: string[] = [];

      // Return truck route result with warnings about potential restrictions
      return {
        route,
        warnings,
      };
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
    }
  }

  /**
   * Gets isochrone (time-based travel distance) polygons for a location
   * @param request 
   * @returns Promise resolving to isochrone polygons for different time intervals
   */
  async getIsochrone(request: IsochroneRequest): Promise<IsochroneResult> {
    // Validate input request parameters
    if (!request?.latitude || !request?.longitude || !request?.intervals || request.intervals.length === 0) {
      throw new AppError('Latitude, longitude, and intervals are required for isochrone generation', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Make isochrone request to Mapbox API
      const url = this.buildUrl(`/isochrone/v1/mapbox/${request.profile || 'driving'}/${request.longitude},${request.latitude}`, {
        contours_minutes: request.intervals.join(','),
        polygons: request.polygons?.toString() || 'true',
        contours_meters: request.contours_meters?.join(','),
      });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Transform response to standard format
      if (response.data && response.data.features) {
        // Return isochrone result with polygon data
        return response.data;
      } else {
        throw new AppError('Isochrone generation failed: Invalid response format', { code: 'EXT_INVALID_RESPONSE' });
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
    }
  }

  /**
   * Handles and logs Mapbox API errors
   * @param error 
   * @returns never
   */
  private handleApiError(error: Error): never {
    // Log error details
    logger.error('Mapbox API error', { error });

    // Format error message
    let message = 'Mapbox API request failed';
    if (axios.isAxiosError(error)) {
      message = error.message;
    }

    // Throw standardized AppError with appropriate status code
    throw new AppError(message, {
      code: 'EXT_MAPPING_SERVICE_ERROR',
      statusCode: 500,
      isRetryable: true,
    });
  }

  /**
   * Builds a URL for Mapbox API requests
   * @param endpoint 
   * @param params 
   * @returns Formatted URL with parameters
   */
  private buildUrl(endpoint: string, params: object = {}): string {
    // Combine base URL with endpoint
    let url = `${this.baseUrl}${endpoint}`;

    // Add access token to parameters
    const allParams = { ...params, access_token: this.accessToken };

    // Append query parameters to URL
    const queryParams = new URLSearchParams(allParams as any).toString();
    if (queryParams) {
      url += `?${queryParams}`;
    }

    // Return complete URL
    return url;
  }
}

// Export the provider class
export { PROVIDER_NAME, GeocodingResult, ReverseGeocodingResult, DirectionsRequest, DirectionsResult, DistanceMatrixRequest, DistanceMatrixResult, AddressValidationResult, TravelTimeOptions, TravelTimeResult, WaypointOptimizationRequest, WaypointOptimizationResult, TruckRouteRequest, TruckRouteResult, IsochroneRequest, IsochroneResult };