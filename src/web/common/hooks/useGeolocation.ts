import { useState, useEffect, useCallback, useRef } from 'react'; //  ^18.2.0
import {
  Position,
  PositionSource,
} from '../interfaces/tracking.interface';
import {
  checkPermission,
  requestPermission,
  isLocationEnabled,
} from '../services/locationService';
import logger from '../utils/logger'; // Logging utility for operational logging and debugging

/**
 * Interface for geolocation options configuration
 */
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchOnMount?: boolean;
}

/**
 * Enum for geolocation permission states
 */
export enum GeolocationPermission {
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
  UNAVAILABLE = 'unavailable',
}

// Define default geolocation options
const DEFAULT_GEOLOCATION_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * A custom React hook that provides access to the browser's Geolocation API with enhanced functionality
 * @param options - Geolocation options
 * @returns An object containing the current position, error, loading state, and control functions
 */
const useGeolocation = (options: GeolocationOptions = {}) => {
  // LD1: Initialize state for position, error, loading, and permission status
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [permission, setPermission] = useState<GeolocationPermission>(GeolocationPermission.UNAVAILABLE);

  // LD2: Create a ref to track the watch ID for position watching
  const watchIdRef = useRef<number | null>(null);

  // LD3: Create a ref to track if the component is mounted
  const isMountedRef = useRef(true);

  // LD4: Merge provided options with default options
  const mergedOptions = { ...DEFAULT_GEOLOCATION_OPTIONS, ...options };

  // LD5: Create a function to get the current position
  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    try {
      const newPosition = await new Promise<Position>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (geoPosition: GeolocationPosition) => {
            resolve({
              latitude: geoPosition.coords.latitude,
              longitude: geoPosition.coords.longitude,
              accuracy: geoPosition.coords.accuracy,
              heading: geoPosition.coords.heading || 0,
              speed: geoPosition.coords.speed || 0,
              timestamp: new Date(geoPosition.timestamp).toISOString(),
              source: PositionSource.MOBILE_APP,
            });
          },
          (geoError: GeolocationPositionError) => {
            setError(geoError.message);
            reject(geoError);
          },
          mergedOptions
        );
      });
      setPosition(newPosition);
      setError(null);
    } catch (err: any) {
      logger.error('Error getting current position', { component: 'useGeolocation', error: err });
      setError(err.message);
      setPosition(null);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [mergedOptions]);

  // LD6: Create a function to start watching position changes
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setPermission(GeolocationPermission.UNAVAILABLE);
      return;
    }

    const watchSuccess = (geoPosition: GeolocationPosition) => {
      if (isMountedRef.current) {
        const newPosition: Position = {
          latitude: geoPosition.coords.latitude,
          longitude: geoPosition.coords.longitude,
          accuracy: geoPosition.coords.accuracy,
          heading: geoPosition.coords.heading || 0,
          speed: geoPosition.coords.speed || 0,
          timestamp: new Date(geoPosition.timestamp).toISOString(),
          source: PositionSource.MOBILE_APP,
        };
        setPosition(newPosition);
        setError(null);
      }
    };

    const watchError = (geoError: GeolocationPositionError) => {
      if (isMountedRef.current) {
        setError(geoError.message);
        setPosition(null);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      watchSuccess,
      watchError,
      mergedOptions
    );
    watchIdRef.current = watchId;
  }, [mergedOptions]);

  // LD7: Create a function to stop watching position changes
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // LD8: Create a function to request geolocation permission
  const requestGeolocationPermission = useCallback(async () => {
    try {
      const isGranted = await requestPermission();
      setPermission(isGranted ? GeolocationPermission.GRANTED : GeolocationPermission.DENIED);
    } catch (err: any) {
      logger.error('Error requesting geolocation permission', { component: 'useGeolocation', error: err });
      setPermission(GeolocationPermission.DENIED);
      setError(err.message);
    }
  }, []);

  // LD9: Check if location services are enabled and permission status on mount
  useEffect(() => {
    let didCancel = false;
    const checkLocationSettings = async () => {
      try {
        const isEnabled = await isLocationEnabled();
        const permissionStatus = await checkPermission();
        if (!didCancel) {
          setPermission(permissionStatus as GeolocationPermission);
          if (isEnabled && permissionStatus === GeolocationPermission.GRANTED && options.watchOnMount) {
            startWatching();
          }
        }
      } catch (err: any) {
        logger.error('Error checking location settings', { component: 'useGeolocation', error: err });
        if (!didCancel) {
          setError(err.message);
          setPermission(GeolocationPermission.UNAVAILABLE);
        }
      }
    };

    checkLocationSettings();

    return () => {
      didCancel = true;
    };
  }, [startWatching, options.watchOnMount]);

  // LD10: Clean up by stopping position watching on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [stopWatching]);

  // LD11: Return an object with position data, error state, and control functions
  return {
    position,
    error,
    loading,
    permission,
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestGeolocationPermission,
  };
};

export default useGeolocation;

// Export the GeolocationPermission enum
export { GeolocationPermission };

// Export the GeolocationOptions interface
export type { GeolocationOptions };