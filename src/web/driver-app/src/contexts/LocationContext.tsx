import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'; //  ^18.2.0
import useDriverLocation, {
  DriverLocationOptions,
} from '../hooks/useDriverLocation';
import {
  Position,
  GeolocationPermission,
} from '../../common/interfaces/tracking.interface';
import { logger } from '../../common/utils/logger'; // Logging utility for operational logging and debugging

/**
 * @file
 * This file defines the LocationContext for the driver mobile application.
 * It provides a centralized way to access and manage the driver's location,
 * tracking status, and related functions.
 */

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
  isOnline: boolean;
  lastSyncedPosition: Position | null;
  pendingPositionUpdates: number;
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentPosition: () => Promise<Position | null>;
  requestPermission: () => Promise<boolean>;
  updateDriverPosition: (position: Position) => Promise<Position | null>;
  syncPendingPositions: () => Promise<boolean>;
  clearPendingPositions: () => void;
}

/**
 * The React context object for location functionality
 */
export const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

/**
 * Custom hook to access the LocationContext
 * @returns The location context value
 */
export const useLocationContext = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error(
      'useLocationContext must be used within a LocationProvider'
    );
  }
  return context;
};

/**
 * Context provider component for location functionality
 */
export const LocationProvider: React.FC<{
  children: React.ReactNode;
  driverId: string;
  vehicleId: string;
  options: DriverLocationOptions;
}> = ({ children, driverId, vehicleId, options }) => {
  // LD1: Initialize state for driver location options
  const [driverLocationOptions, setDriverLocationOptions] =
    useState<DriverLocationOptions>(options);

  // LD2: Use the useDriverLocation hook to get location data
  const locationData = useDriverLocation(driverId, vehicleId, driverLocationOptions);

  // LD3: Set default options on initial render
  useEffect(() => {
    logger.info('Setting default driver location options', {
      driverId,
      vehicleId,
      options,
    });
    setDriverLocationOptions(options);
  }, [driverId, vehicleId, options]);

  // LD4: Update options when props change
  useEffect(() => {
    setDriverLocationOptions(options);
  }, [options]);

  // LD5: Render the LocationContext.Provider with the locationData as value, wrapping the children
  return (
    <LocationContext.Provider value={locationData}>
      {children}
    </LocationContext.Provider>
  );
};