import {
  Position,
  EntityPosition,
  PositionUpdate,
  NearbyQuery,
  EntityType,
  PositionSource,
} from '../interfaces/tracking.interface';
import trackingApi from '../api/trackingApi'; // Assuming version 1.0.0
import { calculateDistance } from '../utils/geoUtils';
import logger from '../utils/logger';

/**
 * Interface for geolocation options configuration
 */
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Default geolocation options
 */
const DEFAULT_POSITION_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Gets the current position using the browser's geolocation API
 * @param options Geolocation options
 * @returns Promise that resolves to the current position
 */
export const getCurrentPosition = (options?: GeolocationOptions): Promise<Position> => {
  return new Promise((resolve, reject) => {
    // LD1: Check if geolocation is available in the browser
    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser.');
      logger.error(error.message, { component: 'LocationService', error });
      return reject(error);
    }

    // LD2: Merge provided options with default options
    const mergedOptions = { ...DEFAULT_POSITION_OPTIONS, ...options };

    // LD3: Create a promise that wraps the geolocation API's getCurrentPosition method
    navigator.geolocation.getCurrentPosition(
      (browserPosition: GeolocationPosition) => {
        // LD4: On success, transform the browser position to our Position interface format
        const position: Position = {
          latitude: browserPosition.coords.latitude,
          longitude: browserPosition.coords.longitude,
          heading: browserPosition.coords.heading || 0,
          speed: browserPosition.coords.speed || 0,
          accuracy: browserPosition.coords.accuracy,
          timestamp: new Date(browserPosition.timestamp).toISOString(),
          source: PositionSource.MOBILE_APP,
        };
        resolve(position);
      },
      (error: GeolocationPositionError) => {
        // LD5: On error, log the error and reject the promise
        logger.error('Error getting current position', {
          component: 'LocationService',
          code: error.code,
          message: error.message,
        });
        reject(error);
      },
      mergedOptions
    );
  });
};

/**
 * Starts watching the user's position and provides updates
 * @param successCallback Function to call when a new position is available
 * @param errorCallback Function to call when an error occurs
 * @param options Geolocation options
 * @returns Watch ID that can be used to stop watching
 */
export const watchPosition = (
  successCallback: (position: Position) => void,
  errorCallback: (error: GeolocationPositionError) => void,
  options?: GeolocationOptions
): number => {
  // LD1: Check if geolocation is available in the browser
  if (!navigator.geolocation) {
    logger.error('Geolocation is not supported by this browser.', { component: 'LocationService' });
    errorCallback(new Error('Geolocation is not supported by this browser.') as GeolocationPositionError);
    return 0; // Invalid watch ID
  }

  // LD2: Merge provided options with default options
  const mergedOptions = { ...DEFAULT_POSITION_OPTIONS, ...options };

  // LD3: Create wrapper functions for the callbacks that transform browser positions to our format
  const wrappedSuccessCallback = (browserPosition: GeolocationPosition) => {
    const position: Position = {
      latitude: browserPosition.coords.latitude,
      longitude: browserPosition.coords.longitude,
      heading: browserPosition.coords.heading || 0,
      speed: browserPosition.coords.speed || 0,
      accuracy: browserPosition.coords.accuracy,
      timestamp: new Date(browserPosition.timestamp).toISOString(),
      source: PositionSource.MOBILE_APP,
    };
    successCallback(position);
  };

  const wrappedErrorCallback = (error: GeolocationPositionError) => {
    logger.error('Error getting position update', {
      component: 'LocationService',
      code: error.code,
      message: error.message,
    });
    errorCallback(error);
  };

  // LD4: Call the geolocation API's watchPosition method with the wrapper functions
  const watchId = navigator.geolocation.watchPosition(
    wrappedSuccessCallback,
    wrappedErrorCallback,
    mergedOptions
  );

  // LD5: Return the watch ID
  return watchId;
};

/**
 * Stops watching the user's position
 * @param watchId Watch ID to clear
 */
export const clearWatch = (watchId: number): void => {
  // LD1: Check if geolocation is available in the browser
  if (!navigator.geolocation) {
    logger.warn('Geolocation is not supported by this browser. Cannot clear watch.', { component: 'LocationService' });
    return;
  }

  // LD2: Call the geolocation API's clearWatch method with the provided watch ID
  navigator.geolocation.clearWatch(watchId);
};

/**
 * Checks the current geolocation permission status
 * @returns Promise that resolves to the permission status (granted, denied, prompt)
 */
export const checkPermission = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // LD1: Check if the Permissions API is available in the browser
    if (!navigator.permissions) {
      logger.warn('Permissions API is not supported by this browser. Attempting fallback.', { component: 'LocationService' });
      // LD3: If not available, attempt to get the current position to determine permission status
      return navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            return resolve('denied');
          }
          return resolve('prompt');
        },
        { timeout: 100 }
      );
    }

    // LD2: If available, query the geolocation permission status
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      resolve(result.state);
    }).catch(error => {
      logger.error('Error querying geolocation permission', { component: 'LocationService', error });
      reject(error);
    });
  });
};

/**
 * Requests geolocation permission from the user
 * @returns Promise that resolves to true if permission was granted
 */
export const requestPermission = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // LD1: Attempt to get the current position with a minimal timeout
    navigator.geolocation.getCurrentPosition(
      () => {
        // LD2: If successful, permission was granted, resolve to true
        resolve(true);
      },
      (error) => {
        // LD3: If unsuccessful, permission was denied, resolve to false
        if (error.code === error.PERMISSION_DENIED) {
          resolve(false);
        } else {
          resolve(false); // Treat other errors as denied
        }
      },
      { timeout: 100 }
    );
  });
};

/**
 * Checks if location services are enabled on the device
 * @returns Promise that resolves to true if location services are enabled
 */
export const isLocationEnabled = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // LD1: Attempt to get the current position with a minimal timeout
    navigator.geolocation.getCurrentPosition(
      () => {
        // LD2: If successful, location services are enabled, resolve to true
        resolve(true);
      },
      (error) => {
        // LD3: If unsuccessful with a specific error code, location services are disabled, resolve to false
        if (error.code === error.POSITION_UNAVAILABLE) {
          resolve(false);
        } else {
          resolve(true); // Treat other errors as enabled
        }
      },
      { timeout: 100 }
    );
  });
};

/**
 * Updates an entity's position in the tracking service
 * @param entityId Unique identifier of the entity
 * @param entityType Type of entity (driver, vehicle, or load)
 * @param position Position data
 * @returns Promise that resolves to the updated entity position
 */
export const updateEntityPosition = (
  entityId: string,
  entityType: EntityType,
  position: Position
): Promise<EntityPosition> => {
  // LD1: Create a PositionUpdate object with the entity ID, type, and position data
  const positionUpdate: PositionUpdate = {
    entityId,
    entityType,
    latitude: position.latitude,
    longitude: position.longitude,
    heading: position.heading,
    speed: position.speed,
    accuracy: position.accuracy,
    source: position.source,
    timestamp: position.timestamp,
  };

  // LD2: Call the tracking API's updatePosition method with the update object
  // LD3: Return the promise that resolves to the updated entity position
  return trackingApi.updatePosition(positionUpdate);
};

/**
 * Finds entities near a specific location
 * @param query Parameters for the nearby search
 * @returns Promise that resolves to an array of nearby entity positions
 */
export const findNearbyEntities = (
  query: NearbyQuery
): Promise<EntityPosition[]> => {
  // LD1: Call the tracking API's findNearbyEntities method with the query parameters
  // LD2: Return the promise that resolves to an array of nearby entity positions
  return trackingApi.findNearbyEntities(query);
};

/**
 * Service class that provides geolocation functionality for web applications
 */
export class LocationService {
  options: GeolocationOptions;
  watchId: number | null;
  isWatching: boolean;
  lastPosition: Position | null;

  /**
   * Creates a new LocationService instance
   * @param options Geolocation options
   */
  constructor(options?: GeolocationOptions) {
    // LD1: Initialize the service with default options
    this.options = DEFAULT_POSITION_OPTIONS;

    // LD2: Merge provided options with defaults
    this.options = { ...this.options, ...options };

    // LD3: Set initial state (watchId = null, isWatching = false, lastPosition = null)
    this.watchId = null;
    this.isWatching = false;
    this.lastPosition = null;
  }

  /**
   * Gets the current position
   * @param options Geolocation options
   * @returns Promise that resolves to the current position
   */
  async getCurrentPosition(options?: GeolocationOptions): Promise<Position> {
    // LD1: Merge provided options with instance options
    const mergedOptions = { ...this.options, ...options };

    // LD2: Call the getCurrentPosition function with the merged options
    const position = await getCurrentPosition(mergedOptions);

    // LD3: Update lastPosition with the result
    this.lastPosition = position;

    // LD4: Return the promise
    return position;
  }

  /**
   * Starts watching the user's position
   * @param successCallback Function to call when a new position is available
   * @param errorCallback Function to call when an error occurs
   * @param options Geolocation options
   * @returns True if watching started successfully
   */
  startWatching(
    successCallback: (position: Position) => void,
    errorCallback: (error: GeolocationPositionError) => void,
    options?: GeolocationOptions
  ): boolean {
    // LD1: If already watching, return true
    if (this.isWatching) {
      return true;
    }

    // LD2: Merge provided options with instance options
    const mergedOptions = { ...this.options, ...options };

    // LD3: Create wrapper success callback that updates lastPosition and calls the provided callback
    const wrappedSuccessCallback = (position: Position) => {
      this.lastPosition = position;
      successCallback(position);
    };

    // LD4: Call watchPosition with the callbacks and options
    this.watchId = watchPosition(wrappedSuccessCallback, errorCallback, mergedOptions);

    // LD5: Store the watch ID and set isWatching to true
    this.isWatching = true;

    // LD6: Return true
    return true;
  }

  /**
   * Stops watching the user's position
   * @returns True if watching was stopped successfully
   */
  stopWatching(): boolean {
    // LD1: If not watching, return true
    if (!this.isWatching) {
      return true;
    }

    // LD2: Call clearWatch with the stored watch ID
    if (this.watchId !== null) {
      clearWatch(this.watchId);
    }

    // LD3: Reset the watch ID and set isWatching to false
    this.watchId = null;
    this.isWatching = false;

    // LD4: Return true
    return true;
  }

  /**
   * Updates an entity's position in the tracking service
   * @param entityId Unique identifier of the entity
   * @param entityType Type of entity (driver, vehicle, or load)
   * @param position Position data
   * @returns Promise that resolves to the updated entity position
   */
  updateEntityPosition(
    entityId: string,
    entityType: EntityType,
    position: Position
  ): Promise<EntityPosition> {
    // LD1: Call the updateEntityPosition function with the provided parameters
    // LD2: Return the promise
    return updateEntityPosition(entityId, entityType, position);
  }

  /**
   * Finds entities near a specific location
   * @param query Parameters for the nearby search
   * @returns Promise that resolves to an array of nearby entity positions
   */
  findNearbyEntities(query: NearbyQuery): Promise<EntityPosition[]> {
    // LD1: Call the findNearbyEntities function with the provided query
    // LD2: Return the promise
    return findNearbyEntities(query);
  }

  /**
   * Gets the last known position without requesting a new one
   * @returns The last known position or null if not available
   */
  getLastPosition(): Position | null {
    // LD1: Return the lastPosition property
    return this.lastPosition;
  }

  /**
   * Checks if position watching is currently active
   * @returns True if watching is active, false otherwise
   */
  isCurrentlyWatching(): boolean {
    // LD1: Return the isWatching property
    return this.isWatching;
  }

  /**
   * Calculates the distance from the current position to another position
   * @param targetPosition The target position to calculate the distance to
   * @param unit The unit of measurement ('km' or 'mi'), defaults to 'mi'
   * @returns Promise that resolves to the distance in the specified unit
   */
  async calculateDistanceToPosition(targetPosition: Position, unit: string = 'mi'): Promise<number> {
    // LD1: Get the current position if lastPosition is not available
    let currentPosition = this.lastPosition;
    if (!currentPosition) {
      try {
        currentPosition = await this.getCurrentPosition();
      } catch (error) {
        logger.error('Failed to get current position for distance calculation', { component: 'LocationService', error });
        throw error;
      }
    }

    // LD2: Use calculateDistance utility to determine distance between positions
    const distance = calculateDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      targetPosition.latitude,
      targetPosition.longitude,
      unit
    );

    // LD3: Return the calculated distance
    return distance;
  }
}

// Export the getCurrentPosition function
export { getCurrentPosition };

// Export the watchPosition function
export { watchPosition };

// Export the clearWatch function
export { clearWatch };

// Export the checkPermission function
export { checkPermission };

// Export the requestPermission function
export { requestPermission };

// Export the isLocationEnabled function
export { isLocationEnabled };

// Export the updateEntityPosition function
export { updateEntityPosition };

// Export the findNearbyEntities function
export { findNearbyEntities };