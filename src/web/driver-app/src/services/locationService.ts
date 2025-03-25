import {
  LocationService,
  GeolocationOptions,
  getCurrentPosition, // Assuming version 1.0.0
  watchPosition, // Assuming version 1.0.0
  clearWatch, // Assuming version 1.0.0
} from '../../common/services/locationService';
import {
  Position,
  EntityType,
  PositionSource,
} from '../../common/interfaces/tracking.interface';
import trackingApi from '../../common/api/trackingApi'; // Assuming version 1.0.0
import { calculateDistance } from '../../common/utils/geoUtils';
import logger from '../../common/utils/logger';
import {
  cacheData,
  getCachedData,
  addQueuedRequest,
} from './offlineStorageService'; // Assuming version 1.0.0
import BackgroundGeolocation from 'react-native-background-geolocation'; // ^4.11.1
import NetInfo from '@react-native-community/netinfo'; // ^9.3.7
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

// Global constants
const POSITION_CACHE_KEY = 'driver_position';
const POSITION_HISTORY_CACHE_KEY = 'driver_position_history';
const POSITION_UPDATE_ENDPOINT = '/api/v1/tracking/positions';
const DEFAULT_DISTANCE_FILTER = 10;
const DEFAULT_UPDATE_INTERVAL = 30000;
const MAX_CACHED_POSITIONS = 100;

/**
 * Configuration options for the driver location service
 */
export interface DriverLocationOptions extends GeolocationOptions {
  enableHighAccuracy?: boolean;
  updateInterval?: number;
  backgroundTracking?: boolean;
  significantChangesOnly?: boolean;
  distanceFilter?: number;
  watchOnMount?: boolean;
  autoSync?: boolean;
}

/**
 * Configuration options for the background geolocation service
 */
export interface BackgroundGeolocationConfig {
  desiredAccuracy: number;
  stationaryRadius: number;
  distanceFilter: number;
  debug: boolean;
  startOnBoot: boolean;
  stopOnTerminate: boolean;
  locationProvider: number;
  interval: number;
  fastestInterval: number;
  activitiesInterval: number;
  notificationTitle: string;
  notificationText: string;
  notificationIconColor: string;
}

/**
 * Configures the background geolocation service with the provided options
 * @param options DriverLocationOptions
 * @returns Promise that resolves to true if configuration was successful
 */
export const configureBackgroundGeolocation = async (options: DriverLocationOptions): Promise<boolean> => {
  // LD1: Check if the BackgroundGeolocation module is available
  if (!BackgroundGeolocation) {
    logger.error('BackgroundGeolocation module is not available.');
    return false;
  }

  // LD2: Configure the background geolocation service with the provided options
  BackgroundGeolocation.configure({
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    stationaryRadius: options.distanceFilter || DEFAULT_DISTANCE_FILTER,
    distanceFilter: options.distanceFilter || DEFAULT_DISTANCE_FILTER,
    debug: logger.getLogLevel() === 'debug',
    startOnBoot: false,
    stopOnTerminate: false,
    locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
    interval: options.updateInterval || DEFAULT_UPDATE_INTERVAL,
    fastestInterval: options.updateInterval ? options.updateInterval / 2 : DEFAULT_UPDATE_INTERVAL / 2,
    activitiesInterval: options.updateInterval || DEFAULT_UPDATE_INTERVAL,
    notificationTitle: 'Freight Optimization',
    notificationText: 'Tracking your location for optimized routes',
    notificationIconColor: '#1A73E8',
  });

  // LD3: Set up event listeners for location updates and errors
  BackgroundGeolocation.onLocation(location => {
    logger.info('Received background location update', { location });
  });

  BackgroundGeolocation.onMotionChange(motion => {
    logger.info('Received background motion change', { motion });
  });

  BackgroundGeolocation.onProviderChange(provider => {
    logger.info('Received background provider change', { provider });
  });

  BackgroundGeolocation.onHeartbeat(heartbeat => {
    logger.info('Received background heartbeat', { heartbeat });
  });

  BackgroundGeolocation.onHttp(response => {
    logger.info('Received background http response', { response });
  });

  BackgroundGeolocation.onError(error => {
    logger.error('Received background geolocation error', { error });
  });

  // LD4: Return a promise that resolves to true if configuration was successful
  return true;
};

/**
 * Starts the background geolocation service
 * @returns Promise that resolves to true if the service was started successfully
 */
export const startBackgroundGeolocation = async (): Promise<boolean> => {
  // LD1: Check if the BackgroundGeolocation module is available
  if (!BackgroundGeolocation) {
    logger.error('BackgroundGeolocation module is not available.');
    return false;
  }

  // LD2: Request location permissions if needed
  BackgroundGeolocation.requestAuthorization();

  // LD3: Start the background geolocation service
  BackgroundGeolocation.start();

  // LD4: Return a promise that resolves to true if the service was started successfully
  return true;
};

/**
 * Stops the background geolocation service
 * @returns Promise that resolves to true if the service was stopped successfully
 */
export const stopBackgroundGeolocation = async (): Promise<boolean> => {
  // LD1: Check if the BackgroundGeolocation module is available
  if (!BackgroundGeolocation) {
    logger.error('BackgroundGeolocation module is not available.');
    return false;
  }

  // LD2: Stop the background geolocation service
  BackgroundGeolocation.stop();

  // LD3: Return a promise that resolves to true if the service was stopped successfully
  return true;
};

/**
 * Caches the driver's position for offline access
 * @param driverId string
 * @param position Position
 * @returns Promise that resolves to true if the position was cached successfully
 */
export const cacheDriverPosition = async (driverId: string, position: Position): Promise<boolean> => {
  // LD1: Create a cache key using the driver ID
  const cacheKey = `${POSITION_CACHE_KEY}_${driverId}`;

  // LD2: Cache the position data using the offlineStorageService
  const cached = await cacheData(cacheKey, position);

  // LD3: Return a promise that resolves to true if the position was cached successfully
  return cached;
};

/**
 * Retrieves the cached driver position
 * @param driverId string
 * @returns Promise that resolves to the cached position or null if not found
 */
export const getCachedDriverPosition = async (driverId: string): Promise<Position | null> => {
  // LD1: Create a cache key using the driver ID
  const cacheKey = `${POSITION_CACHE_KEY}_${driverId}`;

  // LD2: Retrieve the cached position data using the offlineStorageService
  const position = await getCachedData<Position>(cacheKey);

  // LD3: Return a promise that resolves to the cached position or null if not found
  return position || null;
};

/**
 * Caches a position update in the position history
 * @param driverId string
 * @param position Position
 * @returns Promise that resolves to true if the position was cached successfully
 */
export const cachePositionHistory = async (driverId: string, position: Position): Promise<boolean> => {
  // LD1: Create a cache key using the driver ID
  const cacheKey = `${POSITION_HISTORY_CACHE_KEY}_${driverId}`;

  // LD2: Retrieve the existing position history from cache
  const history = await getCachedPositionHistory(driverId);

  // LD3: Add the new position to the history
  history.push(position);

  // LD4: Limit the history to MAX_CACHED_POSITIONS by removing oldest entries if needed
  while (history.length > MAX_CACHED_POSITIONS) {
    history.shift();
  }

  // LD5: Cache the updated position history
  const cached = await cacheData(cacheKey, history);

  // LD6: Return a promise that resolves to true if the position was cached successfully
  return cached;
};

/**
 * Retrieves the cached position history for a driver
 * @param driverId string
 * @returns Promise that resolves to an array of cached positions
 */
export const getCachedPositionHistory = async (driverId: string): Promise<Position[]> => {
  // LD1: Create a cache key using the driver ID
  const cacheKey = `${POSITION_HISTORY_CACHE_KEY}_${driverId}`;

  // LD2: Retrieve the cached position history using the offlineStorageService
  const history = await getCachedData<Position[]>(cacheKey);

  // LD3: Return a promise that resolves to the cached position history or an empty array if not found
  return history || [];
};

/**
 * Queues a position update for later synchronization when offline
 * @param driverId string
 * @param vehicleId string
 * @param position Position
 * @returns Promise that resolves to true if the update was queued successfully
 */
export const queuePositionUpdate = async (driverId: string, vehicleId: string, position: Position): Promise<boolean> => {
  // LD1: Create a position update request object
  const requestData = {
    entityId: driverId,
    entityType: EntityType.DRIVER,
    latitude: position.latitude,
    longitude: position.longitude,
    heading: position.heading,
    speed: position.speed,
    accuracy: position.accuracy,
    source: PositionSource.MOBILE_APP,
    timestamp: position.timestamp,
  };

  // LD2: Add the request to the offline queue using addQueuedRequest
  const { queued } = await addQueuedRequest(POSITION_UPDATE_ENDPOINT, 'POST', requestData);

  // LD3: Return a promise that resolves to true if the update was queued successfully
  return queued;
};

/**
 * Extended location service class with driver-specific functionality
 */
export class DriverLocationService extends LocationService {
  driverId: string;
  vehicleId: string;
  options: DriverLocationOptions;
  isBackgroundTrackingEnabled: boolean;
  isOnline: boolean;
  pendingUpdates: Position[];

  /**
   * Creates a new DriverLocationService instance
   * @param driverId string
   * @param vehicleId string
   * @param options DriverLocationOptions
   */
  constructor(driverId: string, vehicleId: string, options: DriverLocationOptions) {
    // LD1: Call the parent LocationService constructor with the options
    super(options);

    // LD2: Initialize the driver ID and vehicle ID properties
    this.driverId = driverId;
    this.vehicleId = vehicleId;

    // LD3: Merge provided options with default driver location options
    this.options = {
      enableHighAccuracy: true,
      updateInterval: 30000,
      backgroundTracking: false,
      significantChangesOnly: true,
      distanceFilter: 10,
      watchOnMount: true,
      autoSync: true,
      ...options,
    };

    // LD4: Initialize background tracking status and online status
    this.isBackgroundTrackingEnabled = this.options.backgroundTracking || false;
    this.isOnline = true;
    this.pendingUpdates = [];

    // LD5: Set up network connectivity monitoring
    NetInfo.addEventListener(state => this.handleNetworkChange(state));

    // LD6: Initialize the pending updates array
  }

  /**
   * Updates the driver's position in the tracking service
   * @param position Position
   * @returns Promise that resolves to the updated position or null if update failed
   */
  async updateDriverPosition(position: Position): Promise<Position | null> {
    // LD1: Check if the driver ID and vehicle ID are set
    if (!this.driverId || !this.vehicleId) {
      logger.error('Driver ID or Vehicle ID is not set.');
      return null;
    }

    try {
      // LD2: If online, send the position update to the tracking service
      if (this.isOnline) {
        await trackingApi.updatePosition({
          entityId: this.driverId,
          entityType: EntityType.DRIVER,
          latitude: position.latitude,
          longitude: position.longitude,
          heading: position.heading,
          speed: position.speed,
          accuracy: position.accuracy,
          source: position.source,
          timestamp: position.timestamp,
        });
      } else {
        // LD3: If offline, cache the position and queue the update for later
        await queuePositionUpdate(this.driverId, this.vehicleId, position);
      }

      // LD4: Update the last position property
      this.lastPosition = position;

      // LD5: Cache the position for offline access
      await cacheDriverPosition(this.driverId, position);

      // LD6: Add the position to the position history cache
      await cachePositionHistory(this.driverId, position);

      // LD7: Return the updated position or null if update failed
      return position;
    } catch (error) {
      logger.error('Failed to update driver position', { error });
      return null;
    }
  }

  /**
   * Gets the current driver position
   * @returns Promise that resolves to the current position or null if not available
   */
  async getDriverPosition(): Promise<Position | null> {
    // LD1: Check if the last position is available
    if (this.lastPosition) {
      return this.lastPosition;
    }

    // LD2: If not available and online, try to get the current position
    if (this.isOnline) {
      try {
        const position = await getCurrentPosition(this.options);
        this.lastPosition = position;
        return position;
      } catch (error) {
        logger.error('Failed to get current position', { error });
        return null;
      }
    }

    // LD3: If offline, try to get the cached position
    try {
      const position = await getCachedDriverPosition(this.driverId);
      return position;
    } catch (error) {
      logger.error('Failed to get cached position', { error });
      return null;
    }
  }

  /**
   * Starts tracking the driver's position
   * @param successCallback Function
   * @param errorCallback Function
   * @returns Promise that resolves to true if tracking started successfully
   */
  async startTracking(successCallback: Function, errorCallback: Function): Promise<boolean> {
    // LD1: If background tracking is enabled in options, start background geolocation
    if (this.isBackgroundTrackingEnabled) {
      configureBackgroundGeolocation(this.options);
      startBackgroundGeolocation();
    } else {
      // LD2: Otherwise, use the standard startWatching method from the parent class
      super.startWatching(
        (position: Position) => {
          this.updateDriverPosition(position);
          successCallback(position);
        },
        (error: GeolocationPositionError) => {
          errorCallback(error);
        },
        this.options
      );
    }

    // LD3: Log the tracking start
    logger.info('Started tracking driver position');

    // LD4: Return a promise that resolves to true if tracking started successfully
    return true;
  }

  /**
   * Stops tracking the driver's position
   * @returns Promise that resolves to true if tracking stopped successfully
   */
  async stopTracking(): Promise<boolean> {
    // LD1: If background tracking is enabled, stop background geolocation
    if (this.isBackgroundTrackingEnabled) {
      stopBackgroundGeolocation();
    } else {
      // LD2: Otherwise, use the standard stopWatching method from the parent class
      super.stopWatching();
    }

    // LD3: Log the tracking stop
    logger.info('Stopped tracking driver position');

    // LD4: Return a promise that resolves to true if tracking stopped successfully
    return true;
  }

  /**
   * Synchronizes cached position updates when coming back online
   * @returns Promise that resolves to the synchronization result
   */
  async syncOfflineData(): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
    // LD1: Check if there are pending updates to sync
    const queuedRequests = await getQueuedRequests();
    if (!queuedRequests || queuedRequests.length === 0) {
      logger.info('No pending updates to sync.');
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    let syncedCount = 0;
    let failedCount = 0;

    // LD2: If no pending updates, return success with zero counts
    for (const request of queuedRequests) {
      try {
        // LD3: For each pending update, try to send it to the tracking service
        if (request.endpoint === POSITION_UPDATE_ENDPOINT && request.method === 'POST') {
          const position = request.data as Position;
          await trackingApi.updatePosition({
            entityId: this.driverId,
            entityType: EntityType.DRIVER,
            latitude: position.latitude,
            longitude: position.longitude,
            heading: position.heading,
            speed: position.speed,
            accuracy: position.accuracy,
            source: position.source,
            timestamp: position.timestamp,
          });
          // LD4: Clear successfully synced updates from the pending list
          await removeQueuedRequest(request.id);
          syncedCount++;
        }
      } catch (error) {
        logger.error(`Failed to sync offline data for request ${request.id}`, { error });
        failedCount++;
      }
    }

    // LD5: Track successful and failed updates
    logger.info(`Synced ${syncedCount} offline updates, ${failedCount} failed.`);

    // LD6: Return the synchronization result with counts
    return { success: failedCount === 0, syncedCount, failedCount };
  }

  /**
   * Handles changes in network connectivity
   * @param state object
   */
  handleNetworkChange(state: any): void {
    // LD1: Update the isOnline property based on the network state
    this.isOnline = state.isConnected === true;

    // LD2: If coming back online, attempt to sync offline data
    if (this.isOnline && this.options.autoSync) {
      this.syncOfflineData();
    }

    // LD3: Log the network state change
    logger.info(`Network state changed: ${this.isOnline ? 'Online' : 'Offline'}`);
  }

  /**
   * Handles location updates from the background geolocation service
   * @param location object
   */
  handleBackgroundLocationUpdate(location: any): void {
    // LD1: Convert the background location format to our Position interface
    const position: Position = {
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.coords.heading || 0,
      speed: location.coords.speed || 0,
      accuracy: location.coords.accuracy,
      timestamp: new Date(location.timestamp).toISOString(),
      source: PositionSource.MOBILE_APP,
    };

    // LD2: Update the driver position with the new location
    this.updateDriverPosition(position);

    // LD3: Log the background location update
    logger.debug('Received background location update', { position });
  }

  /**
   * Determines if a position update should be sent based on distance and time thresholds
   * @param newPosition Position
   * @returns True if the position should be updated, false otherwise
   */
  shouldUpdatePosition(newPosition: Position): boolean {
    // LD1: If no last position, return true
    if (!this.lastPosition) {
      return true;
    }

    // LD2: Calculate time since last update
    const timeSinceLastUpdate = new Date(newPosition.timestamp).getTime() - new Date(this.lastPosition.timestamp).getTime();

    // LD3: If time since last update exceeds update interval, return true
    if (timeSinceLastUpdate >= (this.options.updateInterval || DEFAULT_UPDATE_INTERVAL)) {
      return true;
    }

    // LD4: If significantChangesOnly option is enabled, calculate distance from last position
    if (this.options.significantChangesOnly) {
      const distance = calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        newPosition.latitude,
        newPosition.longitude,
        'mi'
      );

      // LD5: If distance exceeds distance filter, return true
      if (distance >= (this.options.distanceFilter || DEFAULT_DISTANCE_FILTER)) {
        return true;
      }
    }

    // LD6: Otherwise, return false
    return false;
  }
}

// Export the DriverLocationService class
export { DriverLocationService };

// Export the DriverLocationOptions interface
export type { DriverLocationOptions };

// Export the configureBackgroundGeolocation function
export { configureBackgroundGeolocation };

// Export the startBackgroundGeolocation function
export { startBackgroundGeolocation };

// Export the stopBackgroundGeolocation function
export { stopBackgroundGeolocation };

// Export the cacheDriverPosition function
export { cacheDriverPosition };

// Export the getCachedDriverPosition function
export { getCachedDriverPosition };