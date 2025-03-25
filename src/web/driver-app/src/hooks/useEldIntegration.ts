import { useState, useEffect, useCallback, useRef } from 'react'; // react ^18.2.0
import NetInfo from '@react-native-community/netinfo'; // @react-native-community/netinfo ^9.3.10

import useAuth from '../../../common/hooks/useAuth';
import useLocalStorage from '../../../common/hooks/useLocalStorage';
import EldIntegrationService from '../services/eldIntegrationService';
import { EldConnectionParams, EldConnectionResponse } from '../services/eldIntegrationService';
import { DriverHOS } from '../../../common/interfaces/driver.interface';
import logger from '../../../common/utils/logger';

// Define global constants for cache keys and sync interval
const ELD_CONNECTION_CACHE_KEY = 'eld_connection';
const HOS_CACHE_KEY = 'driver_hos_data';
const HOS_SYNC_INTERVAL = 900000; // 15 minutes in milliseconds

/**
 * Interface for the return type of the useEldIntegration hook,
 * defining the structure of the object containing ELD integration state and methods.
 */
interface UseEldIntegrationResult {
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  eldConnection: EldConnectionResponse | null;
  hosData: DriverHOS | null;
  connectToEldProvider: (params: EldConnectionParams) => Promise<EldConnectionResponse>;
  disconnectFromEldProvider: (connectionId: string) => Promise<boolean>;
  getDriverHOS: (driverId: string) => Promise<DriverHOS>;
  getDriverHOSLogs: (driverId: string, startDate: Date, endDate: Date) => Promise<DriverHOS[]>;
    hasSufficientHoursForTrip: (driverId: string, estimatedDrivingMinutes: number) => Promise<boolean>;
  validateEldConnection: (connectionId: string) => Promise<boolean>;
  syncHosData: (driverId: string) => Promise<boolean>;
}

/**
 * Custom hook that provides ELD integration functionality for the driver mobile app
 * @returns {UseEldIntegrationResult} Object with ELD state and methods
 */
const useEldIntegration = (): UseEldIntegrationResult => {
  // LD1: Initialize the EldIntegrationService instance using useRef
  const eldServiceRef = useRef(new EldIntegrationService());

  // LD1: Create state for loading status during async operations
  const [loading, setLoading] = useState<boolean>(false);

  // LD1: Create state for error messages from ELD operations
  const [error, setError] = useState<string | null>(null);

  // LD1: Create state for the current ELD connection
  const [eldConnection, setEldConnection] = useState<EldConnectionResponse | null>(null);

  // LD1: Create state for the driver's HOS data
  const [hosData, setHosData] = useState<DriverHOS | null>(null);

  // LD1: Create state for network connectivity status
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // LD1: Get the current authenticated user from useAuth hook
  const { authState } = useAuth();
  const driverId = authState.user?.driverId;

  // LD1: Create a function to initialize the ELD service
  const initializeEldService = useCallback(async () => {
    logger.info('Initializing ELD service');
  }, []);

  // LD1: Create a function to connect to an ELD provider
  const connectToEldProvider = useCallback(async (params: EldConnectionParams): Promise<EldConnectionResponse> => {
    setLoading(true);
    setError(null);
    try {
      const connection = await eldServiceRef.current.connectToEldProvider(params);
      setEldConnection(connection);
      return connection;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to ELD provider');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // LD1: Create a function to disconnect from an ELD provider
  const disconnectFromEldProvider = useCallback(async (connectionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const success = await eldServiceRef.current.disconnectFromEldProvider(connectionId);
      setEldConnection(null);
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect from ELD provider');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // LD1: Create a function to get the driver's current HOS data
  const getDriverHOS = useCallback(async (driverId: string): Promise<DriverHOS> => {
    setLoading(true);
    setError(null);
    try {
      const hos = await eldServiceRef.current.getDriverHOS(driverId);
      setHosData(hos);
      return hos;
    } catch (err: any) {
      setError(err.message || 'Failed to get driver HOS data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // LD1: Create a function to get the driver's HOS logs for a date range
  const getDriverHOSLogs = useCallback(async (driverId: string, startDate: Date, endDate: Date): Promise<DriverHOS[]> => {
    setLoading(true);
    setError(null);
    try {
      return await eldServiceRef.current.getDriverHOSLogs(driverId, startDate, endDate);
    } catch (err: any) {
      setError(err.message || 'Failed to get driver HOS logs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // LD1: Create a function to check if a driver has sufficient hours for a trip
  const hasSufficientHoursForTrip = useCallback(async (driverId: string, estimatedDrivingMinutes: number): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
          return await eldServiceRef.current.hasSufficientHoursForTrip(driverId, estimatedDrivingMinutes);
      } catch (err: any) {
          setError(err.message || 'Failed to check driver hours');
          return false;
      } finally {
          setLoading(false);
      }
  }, []);

  // LD1: Create a function to validate an ELD connection
  const validateEldConnection = useCallback(async (connectionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      return await eldServiceRef.current.validateEldConnection(connectionId);
    } catch (err: any) {
      setError(err.message || 'Failed to validate ELD connection');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // LD1: Create a function to sync HOS data when coming back online
  const syncHosData = useCallback(async (driverId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      return await eldServiceRef.current.syncHosData(driverId);
    } catch (err: any) {
      setError(err.message || 'Failed to sync HOS data');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // LD1: Set up an effect to initialize the ELD service on component mount
  useEffect(() => {
    initializeEldService();
  }, [initializeEldService]);

  // LD1: Set up an effect to load the current ELD connection when user changes
  useEffect(() => {
    const loadEldConnection = async () => {
      if (!driverId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const connection = await eldServiceRef.current.getEldConnection(driverId);
        setEldConnection(connection);
      } catch (err: any) {
        setError(err.message || 'Failed to load ELD connection');
      } finally {
        setLoading(false);
      }
    };

    loadEldConnection();
  }, [driverId]);

  // LD1: Set up an effect to periodically sync HOS data when online
  useEffect(() => {
    let syncInterval: NodeJS.Timeout | null = null;

    const startHosSync = () => {
      if (driverId) {
        syncInterval = setInterval(() => {
          syncHosData(driverId);
        }, HOS_SYNC_INTERVAL);
        logger.info('HOS sync interval started', { driverId, interval: HOS_SYNC_INTERVAL });
      }
    };

    const stopHosSync = () => {
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        logger.info('HOS sync interval stopped', { driverId });
      }
    };

    if (isOnline && driverId) {
      startHosSync();
    }

    return () => {
      stopHosSync();
    };
  }, [isOnline, driverId, syncHosData]);

  // LD1: Set up an effect to monitor network connectivity changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected === true);
      logger.info(`Network connectivity changed: ${state.isConnected}`);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // LD1: Clean up intervals and subscriptions on component unmount
  useEffect(() => {
    return () => {
      logger.info('Cleaning up ELD integration hook');
    };
  }, []);

  // LD1: Return object with ELD state and methods
  return {
    loading,
    error,
    isOnline,
    eldConnection,
    hosData,
    connectToEldProvider,
    disconnectFromEldProvider,
    getDriverHOS,
    getDriverHOSLogs,
    hasSufficientHoursForTrip,
    validateEldConnection,
    syncHosData,
  };
};

export default useEldIntegration;