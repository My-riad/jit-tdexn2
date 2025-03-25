import { useState, useEffect, useCallback } from 'react'; //  ^18.2.0
import {
  GeolocationPermission,
  GeolocationOptions,
  useGeolocation, // Default import for geolocation functionality
} from '../../common/hooks/useGeolocation';
import {
  Position,
  EntityType,
} from '../../common/interfaces/index';
import {
  DriverLocationService,
  DriverLocationOptions,
} from '../services/locationService';
import useOfflineSync from './useOfflineSync';
import logger from '../../common/utils/logger'; // Logging utility for operational logging and debugging

// Global constants for position update interval and offline storage key
const POSITION_UPDATE_INTERVAL = 30000;
const OFFLINE_STORAGE_KEY = 'driver_positions';

/**
 * Interface for the return value of the useDriverLocation hook
 */
interface DriverLocationHookResult {
  position: Position | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  permissionStatus: GeolocationPermission;
  isWatching: boolean;
  isLocationEnabled: boolean;
  isOnline: boolean;
  lastSyncedPosition: Position | null;
  pendingPositionUpdates: number;
  watchPosition: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<Position | null>;
  requestPermission: () => Promise<boolean>;
  updateDriverPosition: (position: Position) => Promise<Position | null>;
  syncPendingPositions: () => Promise<boolean>;
  clearPendingPositions: () => void;
}

/**
 * A custom React hook that provides driver-specific location tracking functionality
 * @param driverId - The ID of the driver
 * @param vehicleId - The ID of the vehicle
 * @param options - Driver location options
 * @returns An object containing driver position data, error state, and control functions
 */
const useDriverLocation = (
  driverId: string,
  vehicleId: string,
  options: DriverLocationOptions = {}
): DriverLocationHookResult => {
  // LD1: Initialize the base geolocation hook with provided options
  const {
    position,
    error,
    loading,
    permission: geolocationPermission,
    getCurrentPosition: getGeoLocation,
    startWatching: startGeoWatching,
    stopWatching: stopGeoWatching,
    requestGeolocationPermission,
  } = useGeolocation(options);

  // LD2: Create a reference to the DriverLocationService instance
  const locationServiceRef = useRef<DriverLocationService | null>(null);

  // LD3: Initialize state for online status, last synced position, and pending updates
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSyncedPosition, setLastSyncedPosition] = useState<Position | null>(null);
  const [pendingPositionUpdates, setPendingPositionUpdates] = useState<number>(0);

  // LD4: Use the useOfflineSync hook to manage offline data synchronization
  const {
    isOnline: isSyncOnline,
    isSynchronizing,
    lastSyncTime,
    pendingOperations,
    synchronize,
    queueRequest,
    cacheData,
    getCachedData,
    clearOfflineData
  } = useOfflineSync();

  // LD5: Create a function to get the current driver position
  const getCurrentPosition = useCallback(async (): Promise<Position | null> => {
    if (!locationServiceRef.current) {
      logger.error('Location service not initialized.');
      return null;
    }
    try {
      const currentPosition = await locationServiceRef.current.getDriverPosition();
      return currentPosition;
    } catch (err) {
      logger.error('Error getting current driver position', { component: 'useDriverLocation', error: err });
      return null;
    }
  }, []);

  // LD6: Create a function to update the driver's position in the tracking service
  const updateDriverPosition = useCallback(async (position: Position): Promise<Position | null> => {
    if (!locationServiceRef.current) {
      logger.error('Location service not initialized.');
      return null;
    }
    try {
      const updatedPosition = await locationServiceRef.current.updateEntityPosition(
        driverId,
        EntityType.DRIVER,
        position
      );
      setLastSyncedPosition(position);
      return updatedPosition;
    } catch (err) {
      logger.error('Error updating driver position', { component: 'useDriverLocation', error: err });
      return null;
    }
  }, [driverId]);

  // LD7: Create a function to start tracking the driver's position
  const watchPosition = useCallback(() => {
    if (!locationServiceRef.current) {
      logger.error('Location service not initialized.');
      return;
    }
    locationServiceRef.current.startTracking(
      (position: Position) => {
        updateDriverPosition(position);
      },
      (error: GeolocationPositionError) => {
        logger.error('Error watching driver position', { component: 'useDriverLocation', error });
      }
    );
  }, [updateDriverPosition]);

  // LD8: Create a function to stop tracking the driver's position
  const stopWatching = useCallback(() => {
    if (!locationServiceRef.current) {
      logger.error('Location service not initialized.');
      return;
    }
    locationServiceRef.current.stopTracking();
  }, []);

  // LD9: Create a function to sync pending position updates when coming back online
  const syncPendingPositions = useCallback(async (): Promise<boolean> => {
    if (!locationServiceRef.current) {
      logger.error('Location service not initialized.');
      return false;
    }
    try {
      const syncResult = await locationServiceRef.current.syncOfflineData();
      return syncResult.success;
    } catch (err) {
      logger.error('Error syncing pending positions', { component: 'useDriverLocation', error: err });
      return false;
    }
  }, []);

  // LD10: Create a function to clear pending position updates
  const clearPendingPositions = useCallback(async (): Promise<void> => {
    try {
      await clearOfflineData();
      setPendingPositionUpdates(0);
    } catch (err) {
      logger.error('Error clearing pending positions', { component: 'useDriverLocation', error: err });
    }
  }, [clearOfflineData]);

  // LD11: Set up effect to initialize the location service on mount
  useEffect(() => {
    locationServiceRef.current = new DriverLocationService(driverId, vehicleId, options);
    return () => {
      locationServiceRef.current?.stopTracking();
      locationServiceRef.current = null;
    };
  }, [driverId, vehicleId, options]);

  // LD12: Set up effect to start tracking if watchOnMount is true
  useEffect(() => {
    if (options.watchOnMount) {
      watchPosition();
    }
    return () => {
      stopWatching();
    };
  }, [options.watchOnMount, watchPosition, stopWatching]);

  // LD13: Set up effect to attempt syncing when coming back online
  useEffect(() => {
    if (isSyncOnline && pendingOperations > 0) {
      syncPendingPositions();
    }
  }, [isSyncOnline, pendingOperations, syncPendingPositions]);

  // LD14: Set up effect to clean up on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  // LD15: Return an object with position data, error state, and control functions
  return {
    position,
    error,
    loading,
    permissionStatus: geolocationPermission,
    isWatching: !!locationServiceRef.current?.isCurrentlyWatching(),
    isLocationEnabled: geolocationPermission === GeolocationPermission.GRANTED,
    isOnline: isSyncOnline,
    lastSyncedPosition,
    pendingPositionUpdates,
    watchPosition,
    stopWatching,
    getCurrentPosition,
    requestPermission: requestGeolocationPermission,
    updateDriverPosition,
    syncPendingPositions,
    clearPendingPositions,
  };
};

export default useDriverLocation;
export type { DriverLocationOptions };