import axios from 'axios'; // axios@^1.3.4
import { decode } from '@googlemaps/polyline-codec'; // @googlemaps/polyline-codec@^1.0.28
import { mappingConfig } from '../config';
import logger from '@common/utils/logger';
import { Position } from '@common/interfaces/position.interface';
import { calculateDistance } from '@common/utils/geo-utils';
import { AppError } from '@common/utils/error-handler';
import { IntegrationType } from '../models/integration.model';
import { GoogleMapsProvider } from '../providers/google-maps.provider';
import { MapboxProvider } from '../providers/mapbox.provider';

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
 * Service class that provides a unified interface for mapping operations by abstracting multiple providers
 */
export class MappingService {
  private googleMapsProvider: GoogleMapsProvider | null = null;
  private mapboxProvider: MapboxProvider | null = null;
  private defaultProvider: string | null = null;

  /**
   * Initializes the mapping service with available providers based on configuration
   */
  constructor() {
    // Initialize Google Maps provider if configured
    if (mappingConfig.googleMaps && mappingConfig.googleMaps.apiKey) {
      this.googleMapsProvider = new GoogleMapsProvider();
    } else {
      logger.warn('Google Maps provider is not configured');
    }

    // Initialize Mapbox provider if configured
    if (mappingConfig.mapbox && mappingConfig.mapbox.apiKey) {
      this.mapboxProvider = new MapboxProvider();
    } else {
      logger.warn('Mapbox provider is not configured');
    }

    // Set default provider based on configuration
    this.defaultProvider = mappingConfig.googleMaps.apiKey ? 'googlemaps' : mappingConfig.mapbox.apiKey ? 'mapbox' : null;

    // Log successful initialization of the service
    logger.info('Mapping service initialized', {
      defaultProvider: this.defaultProvider,
      googleMapsEnabled: !!this.googleMapsProvider,
      mapboxEnabled: !!this.mapboxProvider,
    });
  }

  /**
   * Converts an address into geographic coordinates using the specified or default provider
   * @param address 
   * @param options 
   * @returns Promise resolving to geocoding result with coordinates and formatted address
   */
  async geocode(address: string, options: { provider?: string } = {}): Promise<GeocodingResult> {
    // Validate input address
    if (!address) {
      throw new AppError('Address is required for geocoding', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Determine which provider to use based on options or default
      const provider = this.getProvider(options);

      // Call the appropriate provider's geocode method
      const geocodingResult = await provider.geocode(address);

      // Return geocoding result
      logger.info('Geocoding successful', { address, provider: options.provider || this.defaultProvider, geocodingResult });
      return geocodingResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Geocoding failed', { address, provider: options.provider || this.defaultProvider, error });
      throw error;
    }
  }

  /**
   * Converts geographic coordinates into a human-readable address using the specified or default provider
   * @param latitude 
   * @param longitude 
   * @param options 
   * @returns Promise resolving to reverse geocoding result with address components
   */
  async reverseGeocode(latitude: number, longitude: number, options: { provider?: string } = {}): Promise<ReverseGeocodingResult> {
    // Validate input coordinates
    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required for reverse geocoding', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Determine which provider to use based on options or default
      const provider = this.getProvider(options);

      // Call the appropriate provider's reverseGeocode method
      const reverseGeocodingResult = await provider.reverseGeocode(latitude, longitude);

      // Return reverse geocoding result
      logger.info('Reverse geocoding successful', { latitude, longitude, provider: options.provider || this.defaultProvider, reverseGeocodingResult });
      return reverseGeocodingResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Reverse geocoding failed', { latitude, longitude, provider: options.provider || this.defaultProvider, error });
      throw error;
    }
  }

  /**
   * Calculates directions between an origin and destination using the specified or default provider
   * @param request 
   * @param options 
   * @returns Promise resolving to directions result with routes, legs, steps, and polylines
   */
  async getDirections(request: DirectionsRequest, options: { provider?: string } = {}): Promise<DirectionsResult> {
    // Validate input request parameters
    if (!request.origin || !request.destination) {
      throw new AppError('Origin and destination are required for directions', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Determine which provider to use based on options or default
      const provider = this.getProvider(options);

      // Call the appropriate provider's getDirections method
      const directionsResult = await provider.getDirections(request);

      // Return directions result
      logger.info('Directions request successful', { request, provider: options.provider || this.defaultProvider, directionsResult });
      return directionsResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Directions request failed', { request, provider: options.provider || this.defaultProvider, error });
      throw error;
    }
  }

  /**
   * Calculates travel distance and time for a matrix of origins and destinations using the specified or default provider
   * @param request 
   * @param options 
   * @returns Promise resolving to distance matrix with travel times and distances
   */
  async getDistanceMatrix(request: DistanceMatrixRequest, options: { provider?: string } = {}): Promise<DistanceMatrixResult> {
    // Validate input request parameters
    if (!request.origins || !request.destinations) {
      throw new AppError('Origins and destinations are required for distance matrix', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Determine which provider to use based on options or default
      const provider = this.getProvider(options);

      // Call the appropriate provider's getDistanceMatrix method
      const distanceMatrixResult = await provider.getDistanceMatrix(request);

      // Return distance matrix result
      logger.info('Distance matrix request successful', { request, provider: options.provider || this.defaultProvider, distanceMatrixResult });
      return distanceMatrixResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Distance matrix request failed', { request, provider: options.provider || this.defaultProvider, error });
      throw error;
    }
  }

  /**
   * Validates an address by geocoding it and checking the result quality using the specified or default provider
   * @param address 
   * @param options 
   * @returns Promise resolving to validation result with validity status and suggestions
   */
  async validateAddress(address: string, options: { provider?: string } = {}): Promise<AddressValidationResult> {
    // Validate input address
    if (!address) {
      throw new AppError('Address is required for address validation', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Determine which provider to use based on options or default
      const provider = this.getProvider(options);

      // Call the appropriate provider's validateAddress method
      const addressValidationResult = await provider.validateAddress(address);

      // Return address validation result
      logger.info('Address validation successful', { address, provider: options.provider || this.defaultProvider, addressValidationResult });
      return addressValidationResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Address validation failed', { address, provider: options.provider || this.defaultProvider, error });
      throw error;
    }
  }

  /**
   * Estimates travel time between two points considering traffic conditions using the specified or default provider
   * @param origin 
   * @param destination 
   * @param options 
   * @param providerOptions 
   * @returns Promise resolving to travel time estimation with duration and distance
   */
  async estimateTravelTime(origin: Position, destination: Position, options: TravelTimeOptions, providerOptions: { provider?: string } = {}): Promise<TravelTimeResult> {
    // Validate input positions
    if (!origin || !destination) {
      throw new AppError('Origin and destination are required for travel time estimation', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Determine which provider to use based on options or default
      const provider = this.getProvider(providerOptions);

      // Call the appropriate provider's estimateTravelTime method
      const travelTimeResult = await provider.estimateTravelTime(origin, destination, options);

      // Return travel time estimation result
      logger.info('Travel time estimation successful', { origin, destination, provider: providerOptions.provider || this.defaultProvider, travelTimeResult });
      return travelTimeResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Travel time estimation failed', { origin, destination, provider: providerOptions.provider || this.defaultProvider, error });
      throw error;
    }
  }

  /**
   * Optimizes the order of waypoints to minimize travel time or distance using the specified or default provider
   * @param request 
   * @param options 
   * @returns Promise resolving to optimized waypoint order with route details
   */
  async optimizeWaypoints(request: WaypointOptimizationRequest, options: { provider?: string } = {}): Promise<WaypointOptimizationResult> {
    // Validate input request parameters
    if (!request.origin || !request.destination || !request.waypoints || request.waypoints.length < 2) {
      throw new AppError('Origin, destination, and at least two waypoints are required for waypoint optimization', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Determine which provider to use based on options or default
      const provider = this.getProvider(options);

      // Call the appropriate provider's optimizeWaypoints method
      const waypointOptimizationResult = await provider.optimizeWaypoints(request);

      // Return waypoint optimization result
      logger.info('Waypoint optimization successful', { request, provider: options.provider || this.defaultProvider, waypointOptimizationResult });
      return waypointOptimizationResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Waypoint optimization failed', { request, provider: options.provider || this.defaultProvider, error });
      throw error;
    }
  }

  /**
   * Finds a route suitable for commercial trucks considering height, weight, and other restrictions using the specified or default provider
   * @param request 
   * @param options 
   * @returns Promise resolving to truck-friendly route with restrictions considered
   */
  async findTruckFriendlyRoute(request: TruckRouteRequest, options: { provider?: string } = {}): Promise<TruckRouteResult> {
    // Validate input request parameters including truck dimensions
    if (!request.origin || !request.destination || !request.truckHeight || !request.truckWidth || !request.truckLength || !request.truckWeight) {
      throw new AppError('Origin, destination, and truck dimensions are required for truck-friendly route', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Determine which provider to use based on options or default
      const provider = this.getProvider(options);

      // Call the appropriate provider's findTruckFriendlyRoute method
      const truckRouteResult = await provider.findTruckFriendlyRoute(request);

      // Return truck route result
      logger.info('Truck-friendly route request successful', { request, provider: options.provider || this.defaultProvider, truckRouteResult });
      return truckRouteResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Truck-friendly route request failed', { request, provider: options.provider || this.defaultProvider, error });
      throw error;
    }
  }

  /**
   * Gets isochrone (time-based travel distance) polygons for a location using Mapbox provider
   * @param request 
   * @returns Promise resolving to isochrone polygons for different time intervals
   */
  async getIsochrone(request: IsochroneRequest): Promise<IsochroneResult> {
    // Validate input request parameters
    if (!request?.latitude || !request?.longitude || !request?.intervals || request.intervals.length === 0) {
      throw new AppError('Latitude, longitude, and intervals are required for isochrone generation', { code: 'VAL_MISSING_FIELD' });
    }

    try {
      // Check if Mapbox provider is available (only Mapbox supports isochrones)
      if (!this.mapboxProvider) {
        throw new AppError('Isochrone generation is only supported by Mapbox provider', { code: 'VAL_UNSUPPORTED_FEATURE' });
      }

      // Call the Mapbox provider's getIsochrone method
      const isochroneResult = await this.mapboxProvider.getIsochrone(request);

      // Return isochrone result
      logger.info('Isochrone generation successful', { request, isochroneResult });
      return isochroneResult;
    } catch (error: any) {
      // Handle and log any errors
      logger.error('Isochrone generation failed', { request, error });
      throw error;
    }
  }

  /**
   * Returns information about available mapping providers
   * @returns Object containing information about available providers and the default provider
   */
  getAvailableProviders(): object {
    // Create an array of available provider names
    const availableProviders: string[] = [];
    if (this.googleMapsProvider) {
      availableProviders.push('googlemaps');
    }
    if (this.mapboxProvider) {
      availableProviders.push('mapbox');
    }

    // Add the default provider name
    const providerInfo = {
      availableProviders: availableProviders,
      defaultProvider: this.defaultProvider,
    };

    // Return the provider information object
    logger.info('Available mapping providers requested', { providerInfo });
    return providerInfo;
  }

  /**
   * Determines which provider to use based on options or default configuration
   * @param options 
   * @returns The selected mapping provider instance
   */
  private getProvider(options: { provider?: string }): GoogleMapsProvider | MapboxProvider {
    // Extract provider name from options if present
    const providerName = options.provider?.toLowerCase();

    // If no provider specified, use the default provider
    const provider = providerName || this.defaultProvider;

    // Validate that the requested provider is available
    if (provider === 'googlemaps' && this.googleMapsProvider) {
      return this.googleMapsProvider;
    } else if (provider === 'mapbox' && this.mapboxProvider) {
      return this.mapboxProvider;
    } else {
      // Throw an error if the requested provider is not available
      logger.error(`Requested mapping provider is not available: ${provider}`);
      throw new AppError(`Requested mapping provider is not available: ${provider}`, { code: 'VAL_INVALID_INPUT' });
    }
  }
}

// Export the service class and interfaces
export {
  GeocodingResult,
  ReverseGeocodingResult,
  DirectionsRequest,
  DirectionsResult,
  DistanceMatrixRequest,
  DistanceMatrixResult,
  AddressValidationResult,
  TravelTimeOptions,
  TravelTimeResult,
  WaypointOptimizationRequest,
  WaypointOptimizationResult,
  TruckRouteRequest,
  TruckRouteResult,
  IsochroneRequest,
  IsochroneResult,
};