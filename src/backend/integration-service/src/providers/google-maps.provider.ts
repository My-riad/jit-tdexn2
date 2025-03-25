import axios from 'axios'; // axios@^1.3.4
import { decode } from '@googlemaps/polyline-codec'; // @googlemaps/polyline-codec@^1.0.28
import { mappingConfig } from '../config';
import logger from '@common/utils/logger';
import { Position } from '@common/interfaces/position.interface';
import { calculateDistance } from '@common/utils/geo-utils';
import { IntegrationType } from '../models/integration.model';

// Define a constant for the provider name
const PROVIDER_NAME = 'google-maps';

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
  addressComponents: any[]; // Define more specific types if needed
  formattedAddress: string;
}

/**
 * Interface for directions request parameters
 */
export interface DirectionsRequest {
  origin: string;
  destination: string;
  waypoints?: string[];
  optimizeWaypoints?: boolean;
  truckRoute?: boolean;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  departureTime?: Date;
}

/**
 * Interface for directions results
 */
export interface DirectionsResult {
  routes: any[]; // Define more specific types if needed
  legs: any[]; // Define more specific types if needed
  steps: any[]; // Define more specific types if needed
  polyline: string;
}

/**
 * Interface for distance matrix request parameters
 */
export interface DistanceMatrixRequest {
  origins: string[];
  destinations: string[];
  mode?: string;
  avoid?: string;
  units?: string;
}

/**
 * Interface for distance matrix results
 */
export interface DistanceMatrixResult {
  rows: any[]; // Define more specific types if needed
}

/**
 * Interface for place details results
 */
export interface PlaceDetailsResult {
  address: string;
  phone: string;
  website: string;
  openingHours: any; // Define more specific types if needed
}

/**
 * Interface for nearby search request parameters
 */
export interface NearbySearchRequest {
  location: string;
  radius: number;
  type: string;
}

/**
 * Interface for nearby search results
 */
export interface NearbySearchResult {
  places: any[]; // Define more specific types if needed
}

/**
 * Interface for address validation results
 */
export interface AddressValidationResult {
  isValid: boolean;
  suggestions: string[];
}

/**
 * Interface for travel time estimation options
 */
export interface TravelTimeOptions {
  departureTime?: Date;
  trafficModel?: string;
}

/**
 * Interface for travel time estimation results
 */
export interface TravelTimeResult {
  duration: number;
  distance: number;
  formattedDuration: string;
  formattedDistance: string;
}

/**
 * Interface for waypoint optimization request parameters
 */
export interface WaypointOptimizationRequest {
  origin: string;
  destination: string;
  waypoints: string[];
}

/**
 * Interface for waypoint optimization results
 */
export interface WaypointOptimizationResult {
  optimizedWaypoints: string[];
  routeSummary: string;
  totalDistance: number;
  totalDuration: number;
}

/**
 * Interface for truck-friendly route request parameters
 */
export interface TruckRouteRequest {
  origin: string;
  destination: string;
  truckHeight: number;
  truckWidth: number;
  truckLength: number;
  truckWeight: number;
}

/**
 * Interface for truck-friendly route results
 */
export interface TruckRouteResult {
  routeSummary: string;
  warnings: string[];
}

/**
 * Provider class for Google Maps API integration that handles authentication, request formatting, and response parsing
 */
export class GoogleMapsProvider {
  private apiKey: string;
  private defaultRequestConfig: object;
  private baseUrl: string;

  /**
   * Initializes the Google Maps provider with API credentials and default configuration
   */
  constructor() {
    // Get Google Maps API key from configuration
    this.apiKey = mappingConfig.googleMaps.apiKey;

    // Set up base URL for Google Maps API
    this.baseUrl = mappingConfig.googleMaps.apiUrl;

    // Set up default request configuration
    this.defaultRequestConfig = {
      timeout: mappingConfig.googleMaps.timeout,
      retryAttempts: mappingConfig.googleMaps.retryAttempts,
    };

    // Log successful initialization of the provider
    logger.info('Google Maps provider initialized', {
      provider: PROVIDER_NAME,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Converts an address into geographic coordinates
   * @param address
   * @returns Promise resolving to geocoding result with coordinates and formatted address
   */
  async geocode(address: string): Promise<GeocodingResult> {
    // Validate input address
    if (!address) {
      throw new Error('Address is required for geocoding');
    }

    try {
      // Make geocoding request to Google Maps API
      const url = this.buildUrl('/maps/api/geocode/json', { address });
      logger.debug('Geocoding request to Google Maps API', { address, url });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Handle response and transform to standard format
      const data = response.data;
      if (data.status === 'OK') {
        const result = data.results[0];
        const geocodingResult: GeocodingResult = {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
        };
        logger.info('Geocoding successful', { address, geocodingResult });
        return geocodingResult;
      } else {
        logger.error('Geocoding failed', { address, status: data.status, error_message: data.error_message });
        throw new Error(`Geocoding failed with status: ${data.status}`);
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
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
      throw new Error('Latitude and longitude are required for reverse geocoding');
    }

    try {
      // Make reverse geocoding request to Google Maps API
      const latlng = `${latitude},${longitude}`;
      const url = this.buildUrl('/maps/api/geocode/json', { latlng });
      logger.debug('Reverse geocoding request to Google Maps API', { latitude, longitude, url });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Handle response and transform to standard format
      const data = response.data;
      if (data.status === 'OK') {
        const result = data.results[0];
        const reverseGeocodingResult: ReverseGeocodingResult = {
          addressComponents: result.address_components,
          formattedAddress: result.formatted_address,
        };
        logger.info('Reverse geocoding successful', { latitude, longitude, reverseGeocodingResult });
        return reverseGeocodingResult;
      } else {
        logger.error('Reverse geocoding failed', { latitude, longitude, status: data.status, error_message: data.error_message });
        throw new Error(`Reverse geocoding failed with status: ${data.status}`);
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
    }
  }

  /**
   * Calculates directions between an origin and destination, with optional waypoints
   * @param request
   * @returns Promise resolving to directions result with routes, legs, steps, and polylines
   */
  async getDirections(request: DirectionsRequest): Promise<DirectionsResult> {
    // Validate input request parameters
    if (!request.origin || !request.destination) {
      throw new Error('Origin and destination are required for directions');
    }

    try {
      // Prepare request parameters
      const params: any = {
        origin: request.origin,
        destination: request.destination,
        waypoints: request.waypoints ? request.waypoints.join('|') : undefined,
        optimize: request.optimizeWaypoints,
        avoidTolls: request.avoidTolls,
        avoidHighways: request.avoidHighways,
        avoidFerries: request.avoidFerries,
        departure_time: request.departureTime ? request.departureTime.getTime() / 1000 : undefined,
      };

      // Make directions request to Google Maps API
      const url = this.buildUrl('/maps/api/directions/json', params);
      logger.debug('Directions request to Google Maps API', { request, url });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Process polylines and decode path geometries
      const data = response.data;
      if (data.status === 'OK') {
        const route = data.routes[0];
        const polyline = route.overview_polyline.points;
        const decodedPath = decode(polyline);

        // Return directions result with decoded polylines
        const directionsResult: DirectionsResult = {
          routes: data.routes,
          legs: route.legs,
          steps: route.legs[0].steps,
          polyline: decodedPath,
        };
        logger.info('Directions request successful', { request, directionsResult });
        return directionsResult;
      } else {
        logger.error('Directions request failed', { request, status: data.status, error_message: data.error_message });
        throw new Error(`Directions request failed with status: ${data.status}`);
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
    }
  }

  /**
   * Calculates travel distance and time for a matrix of origins and destinations
   * @param request
   * @returns Promise resolving to distance matrix with travel times and distances
   */
  async getDistanceMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrixResult> {
    // Validate input request parameters
    if (!request.origins || !request.destinations) {
      throw new Error('Origins and destinations are required for distance matrix');
    }

    try {
      // Make distance matrix request to Google Maps API
      const params: any = {
        origins: request.origins.join('|'),
        destinations: request.destinations.join('|'),
        mode: request.mode,
        avoid: request.avoid,
        units: request.units,
      };
      const url = this.buildUrl('/maps/api/distancematrix/json', params);
      logger.debug('Distance matrix request to Google Maps API', { request, url });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Transform response to standard format
      const data = response.data;
      if (data.status === 'OK') {
        const distanceMatrixResult: DistanceMatrixResult = {
          rows: data.rows,
        };
        logger.info('Distance matrix request successful', { request, distanceMatrixResult });
        return distanceMatrixResult;
      } else {
        logger.error('Distance matrix request failed', { request, status: data.status, error_message: data.error_message });
        throw new Error(`Distance matrix request failed with status: ${data.status}`);
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
    }
  }

  /**
   * Retrieves details about a place using its place_id
   * @param placeId
   * @returns Promise resolving to place details including address, phone, hours, etc.
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
    // Validate input place ID
    if (!placeId) {
      throw new Error('Place ID is required for place details');
    }

    try {
      // Make place details request to Google Maps API
      const url = this.buildUrl('/maps/api/place/details/json', { placeid: placeId });
      logger.debug('Place details request to Google Maps API', { placeId, url });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Transform response to standard format
      const data = response.data;
      if (data.status === 'OK') {
        const result = data.result;
        const placeDetailsResult: PlaceDetailsResult = {
          address: result.formatted_address,
          phone: result.formatted_phone_number,
          website: result.website,
          openingHours: result.opening_hours,
        };
        logger.info('Place details request successful', { placeId, placeDetailsResult });
        return placeDetailsResult;
      } else {
        logger.error('Place details request failed', { placeId, status: data.status, error_message: data.error_message });
        throw new Error(`Place details request failed with status: ${data.status}`);
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
    }
  }

  /**
   * Searches for places of a specific type near a location
   * @param request
   * @returns Promise resolving to nearby places matching the search criteria
   */
  async findNearbyPlaces(request: NearbySearchRequest): Promise<NearbySearchResult> {
    // Validate input request parameters
    if (!request.location || !request.radius || !request.type) {
      throw new Error('Location, radius, and type are required for nearby search');
    }

    try {
      // Make nearby search request to Google Maps API
      const url = this.buildUrl('/maps/api/place/nearbysearch/json', {
        location: request.location,
        radius: request.radius,
        type: request.type,
      });
      logger.debug('Nearby search request to Google Maps API', { request, url });
      const response = await axios.get(url, this.defaultRequestConfig);

      // Transform response to standard format
      const data = response.data;
      if (data.status === 'OK') {
        const nearbySearchResult: NearbySearchResult = {
          places: data.results,
        };
        logger.info('Nearby search request successful', { request, nearbySearchResult });
        return nearbySearchResult;
      } else {
        logger.error('Nearby search request failed', { request, status: data.status, error_message: data.error_message });
        throw new Error(`Nearby search request failed with status: ${data.status}`);
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
    }
  }

  /**
   * Validates an address by geocoding it and checking the result quality
   * @param address
   * @returns Promise resolving to validation result with validity status and suggestions
   */
  async validateAddress(address: string): Promise<AddressValidationResult> {
    try {
      // Call geocode method with the address
      const geocodingResult = await this.geocode(address);

      // Analyze the geocoding result for accuracy and completeness
      const isValid = !!geocodingResult && !!geocodingResult.formattedAddress;

      // Determine if the address is valid based on result quality
      const suggestions: string[] = [];
      if (!isValid) {
        // Generate suggestions for invalid or ambiguous addresses
        suggestions.push('Check the spelling and formatting of the address.');
        suggestions.push('Try a more specific address with street number and name.');
      }

      // Return validation result with status and any suggestions
      const validationResult: AddressValidationResult = {
        isValid,
        suggestions,
      };
      logger.info('Address validation result', { address, validationResult });
      return validationResult;
    } catch (error: any) {
      logger.error('Address validation failed', { address, error });
      return {
        isValid: false,
        suggestions: ['An error occurred while validating the address.'],
      };
    }
  }

  /**
   * Estimates travel time between two points considering traffic conditions
   * @param origin
   * @param destination
   * @param options
   * @returns Promise resolving to travel time estimation with duration and distance
   */
  async estimateTravelTime(origin: Position, destination: Position, options: TravelTimeOptions): Promise<TravelTimeResult> {
    // Validate input positions
    if (!origin || !destination) {
      throw new Error('Origin and destination positions are required for travel time estimation');
    }

    try {
      // Prepare request parameters including departure time for traffic
      const directionsRequest: DirectionsRequest = {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        departureTime: options.departureTime,
      };

      // Call getDirections with the prepared parameters
      const directionsResult = await this.getDirections(directionsRequest);

      // Extract duration and distance information from the result
      if (directionsResult && directionsResult.legs && directionsResult.legs.length > 0) {
        const leg = directionsResult.legs[0];
        const duration = leg.duration.value; // Duration in seconds
        const distance = leg.distance.value; // Distance in meters

        // Return travel time estimation with formatted duration and distance
        const travelTimeResult: TravelTimeResult = {
          duration: duration,
          distance: distance,
          formattedDuration: leg.duration.text,
          formattedDistance: leg.distance.text,
        };
        logger.info('Travel time estimation successful', { origin, destination, travelTimeResult });
        return travelTimeResult;
      } else {
        logger.warn('No legs found in directions result', { origin, destination });
        throw new Error('No travel time information found');
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
    }
  }

  /**
   * Optimizes the order of waypoints to minimize travel time or distance
   * @param request
   * @returns Promise resolving to optimized waypoint order with route details
   */
  async optimizeWaypoints(request: WaypointOptimizationRequest): Promise<WaypointOptimizationResult> {
    // Validate input request parameters
    if (!request.origin || !request.destination || !request.waypoints || request.waypoints.length < 2) {
      throw new Error('Origin, destination, and at least two waypoints are required for waypoint optimization');
    }

    try {
      // Prepare directions request with optimize parameter
      const directionsRequest: DirectionsRequest = {
        origin: request.origin,
        destination: request.destination,
        waypoints: request.waypoints,
        optimizeWaypoints: true,
      };

      // Call getDirections with the prepared parameters
      const directionsResult = await this.getDirections(directionsRequest);

      // Extract optimized waypoint order from the response
      if (directionsResult && directionsResult.routes && directionsResult.routes.length > 0) {
        const route = directionsResult.routes[0];
        const waypointOrder = route.waypoint_order;

        // Return optimization result with ordered waypoints and route details
        const optimizedWaypoints = waypointOrder.map((index: number) => request.waypoints[index]);
        const waypointOptimizationResult: WaypointOptimizationResult = {
          optimizedWaypoints: optimizedWaypoints,
          routeSummary: route.summary,
          totalDistance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0),
          totalDuration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0),
        };
        logger.info('Waypoint optimization successful', { request, waypointOptimizationResult });
        return waypointOptimizationResult;
      } else {
        logger.warn('No routes found in directions result', { request });
        throw new Error('No waypoint optimization information found');
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
    }
  }

  /**
   * Finds a route suitable for commercial trucks considering height, weight, and other restrictions
   * @param request
   * @returns Promise resolving to truck-friendly route with restrictions considered
   */
  async findTruckFriendlyRoute(request: TruckRouteRequest): Promise<TruckRouteResult> {
    // Validate input request parameters including truck dimensions
    if (!request.origin || !request.destination || !request.truckHeight || !request.truckWidth || !request.truckLength || !request.truckWeight) {
      throw new Error('Origin, destination, and truck dimensions are required for truck-friendly route');
    }

    try {
      // Prepare directions request with truck-specific parameters
      const directionsRequest: DirectionsRequest = {
        origin: request.origin,
        destination: request.destination,
        avoidTolls: true,
        avoidHighways: true,
        avoidFerries: true,
      };

      // Call getDirections with the prepared parameters
      const directionsResult = await this.getDirections(directionsRequest);

      // Process the response to highlight any potential restriction issues
      if (directionsResult && directionsResult.routes && directionsResult.routes.length > 0) {
        const route = directionsResult.routes[0];
        const warnings: string[] = [];

        // Add logic to analyze the route and identify potential restrictions
        // This could involve checking for low bridges, weight restrictions, etc.

        // Return truck route result with warnings about potential restrictions
        const truckRouteResult: TruckRouteResult = {
          routeSummary: route.summary,
          warnings: warnings,
        };
        logger.info('Truck-friendly route request successful', { request, truckRouteResult });
        return truckRouteResult;
      } else {
        logger.warn('No routes found in directions result', { request });
        throw new Error('No truck-friendly route information found');
      }
    } catch (error: any) {
      // Handle API errors
      return this.handleApiError(error);
    }
  }

  /**
   * Handles and logs Google Maps API errors
   * @param error
   * @returns never
   */
  private handleApiError(error: Error): never {
    // Log error details
    logger.error('Google Maps API error', { error });

    // Format error message
    const errorMessage = `Google Maps API request failed: ${error.message}`;

    // Throw standardized error with appropriate status code
    throw new Error(errorMessage);
  }

  /**
   * Builds a URL for Google Maps API requests
   * @param endpoint
   * @param params
   * @returns Formatted URL with parameters
   */
  private buildUrl(endpoint: string, params: object): string {
    // Combine base URL with endpoint
    let url = `${this.baseUrl}${endpoint}`;

    // Add API key to parameters
    const allParams = { ...params, key: this.apiKey };

    // Append query parameters to URL
    const queryParams = new URLSearchParams();
    for (const key in allParams) {
      if (allParams[key] !== undefined && allParams[key] !== null) {
        queryParams.append(key, allParams[key]);
      }
    }
    url += `?${queryParams.toString()}`;

    // Return complete URL
    return url;
  }
}