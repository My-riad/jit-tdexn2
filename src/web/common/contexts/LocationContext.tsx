import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'; //  ^18.2.0
import {
  Position,
  EntityType,
  PositionSource,
} from '../interfaces/tracking.interface';
import useGeolocation, {
  GeolocationPermission,
  GeolocationOptions,
} from '../hooks/useGeolocation';
import { updateEntityPosition } from '../services/locationService';
import logger from '../utils/logger'; // Logging utility for operational logging and debugging

// Define default geolocation options
const DEFAULT_LOCATION_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  watchOnMount: false,
};

/**
 * Interface for the location context value
 */
interface LocationContextType {
  position: Position | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  permissionStatus: GeolocationPermission;
  isWatching: boolean;
  isLocationEnabled: boolean;
  watchPosition: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<Position | null>;
  requestPermission: () => Promise<boolean>;
  updatePosition: (
    entityId: string,
    entityType: EntityType
  ) => Promise<Position | null>;
}

// Create the LocationContext with a default value of null
export const LocationContext = createContext<LocationContextType | null>(null);

/**
 * React context provider component for location functionality
 */
export const LocationProvider: React.FC<{
  children: React.ReactNode;
  options?: GeolocationOptions;
}> = ({ children, options }) => {
  // LD1: Merge provided options with default options
  const mergedOptions = { ...DEFAULT_LOCATION_OPTIONS, ...options };

  // LD2: Use the useGeolocation hook to access and monitor geolocation
  const {
    position,
    error,
    loading,
    permission: permissionStatus,
    startWatching,
    stopWatching,
    getCurrentPosition: getGeoLocation,
  } = useGeolocation(mergedOptions);

  // LD3: Initialize state for isWatching and isLocationEnabled
  const [isWatching, setIsWatching] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // LD4: useCallback for memoizing functions
  const memoizedWatchPosition = useCallback(() => {
    startWatching();
    setIsWatching(true);
  }, [startWatching]);

  const memoizedStopWatching = useCallback(() => {
    stopWatching();
    setIsWatching(false);
  }, [stopWatching]);

  const memoizedGetCurrentPosition = useCallback(async () => {
    try {
      const newPosition = await getGeoLocation();
      setIsLocationEnabled(true);
      return newPosition;
    } catch (err) {
      logger.error('Error getting current position', {
        component: 'LocationProvider',
        error: err,
      });
      setIsLocationEnabled(false);
      return null;
    }
  }, [getGeoLocation]);

  const memoizedRequestPermission = useCallback(async () => {
    // Placeholder for permission request logic
    return true;
  }, []);

  // LD5: useEffect for side effects
  useEffect(() => {
    // LD5.1: Start watching position if specified in options
    if (mergedOptions.watchOnMount) {
      memoizedWatchPosition();
    }

    // LD5.2: Stop watching position on unmount
    return () => {
      memoizedStopWatching();
    };
  }, [memoizedWatchPosition, memoizedStopWatching, mergedOptions.watchOnMount]);

  // LD6: Function to update entity position
  const updatePositionFn = useCallback(
    async (entityId: string, entityType: EntityType) => {
      if (!position) {
        logger.warn('No current position available', {
          component: 'LocationProvider',
        });
        return null;
      }

      try {
        const updatedPosition = await updateEntityPosition(
          entityId,
          entityType,
          position
        );
        logger.info('Position updated successfully', {
          component: 'LocationProvider',
          entityId,
          entityType,
        });
        return updatedPosition;
      } catch (err) {
        logger.error('Error updating entity position', {
          component: 'LocationProvider',
          entityId,
          entityType,
          error: err,
        });
        return null;
      }
    },
    [position]
  );

  // LD7: Provide LocationContext.Provider with value containing position data and location functions
  const contextValue: LocationContextType = {
    position,
    error,
    loading,
    permissionStatus,
    isWatching,
    isLocationEnabled,
    watchPosition: memoizedWatchPosition,
    stopWatching: memoizedStopWatching,
    getCurrentPosition: memoizedGetCurrentPosition,
    requestPermission: memoizedRequestPermission,
    updatePosition: updatePositionFn,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

/**
 * Custom hook to use the LocationContext
 */
export function useLocationContext(): LocationContextType {
  // LD1: Call useContext with LocationContext
  const context = useContext(LocationContext);

  // LD2: Throw an error if the context is undefined (not used within a provider)
  if (!context) {
    throw new Error(
      'useLocationContext must be used within a LocationProvider'
    );
  }

  // LD3: Return the context value
  return context;
}