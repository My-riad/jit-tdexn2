import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

import useOfflineSync, { OfflineSyncOptions, SyncResult } from '../hooks/useOfflineSync';
import logger from '../../common/utils/logger';

// Constants
const DEFAULT_SYNC_INTERVAL = 60000; // 60 seconds
const DEFAULT_OFFLINE_SYNC_OPTIONS: OfflineSyncOptions = {
  maxRetryAttempts: 3,
  autoSync: true,
  defaultCacheExpiration: 86400000 // 24 hours
};

/**
 * Interface for the offline context value
 */
interface OfflineContextType {
  isOnline: boolean;
  isSynchronizing: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  synchronize: () => Promise<SyncResult>;
  queueRequest: (endpoint: string, method: string, data?: any, options?: any) => Promise<{ queued: boolean, id: string }>;
  cacheData: (key: string, data: any, options?: any) => Promise<boolean>;
  getCachedData: (key: string, defaultValue?: any) => Promise<any>;
  clearOfflineData: () => Promise<boolean>;
  enableAutoSync: () => void;
  disableAutoSync: () => void;
  isAutoSyncEnabled: boolean;
}

/**
 * Props for the OfflineProvider component
 */
interface OfflineProviderProps {
  children: React.ReactNode;
  options?: OfflineSyncOptions;
  syncInterval?: number;
}

// Create the context with a default undefined value
const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

/**
 * Custom hook to use the OfflineContext
 * @returns The offline context value
 */
const useOfflineContext = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOfflineContext must be used within an OfflineProvider');
  }
  return context;
};

/**
 * React context provider component for offline functionality
 * @param props Component props including children and offline options
 * @returns OfflineProvider component
 */
const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children,
  options = DEFAULT_OFFLINE_SYNC_OPTIONS,
  syncInterval = DEFAULT_SYNC_INTERVAL
}) => {
  // State for managing auto-sync
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(options.autoSync ?? true);
  const [syncIntervalId, setSyncIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Initialize the offline sync hook with the provided options
  const {
    isOnline,
    isSynchronizing,
    lastSyncTime,
    pendingOperations,
    synchronize,
    queueRequest,
    cacheData,
    getCachedData,
    clearOfflineData
  } = useOfflineSync({
    ...options,
    autoSync: isAutoSyncEnabled
  });

  /**
   * Enables automatic synchronization
   */
  const enableAutoSync = useCallback(() => {
    logger.info('Enabling auto-sync for offline data');
    setIsAutoSyncEnabled(true);
  }, []);

  /**
   * Disables automatic synchronization
   */
  const disableAutoSync = useCallback(() => {
    logger.info('Disabling auto-sync for offline data');
    setIsAutoSyncEnabled(false);
  }, []);

  // Set up a periodic synchronization interval if auto-sync is enabled
  useEffect(() => {
    if (isAutoSyncEnabled && isOnline && syncInterval > 0) {
      logger.debug(`Setting up automatic sync interval every ${syncInterval}ms`);
      
      const intervalId = setInterval(() => {
        if (isOnline && !isSynchronizing && pendingOperations > 0) {
          logger.debug('Executing automatic sync');
          synchronize().catch(error => {
            logger.error('Automatic sync failed', { error });
          });
        }
      }, syncInterval);
      
      setSyncIntervalId(intervalId);
      
      return () => {
        if (intervalId) {
          logger.debug('Clearing automatic sync interval');
          clearInterval(intervalId);
        }
      };
    } else if (syncIntervalId) {
      logger.debug('Clearing automatic sync interval due to state change');
      clearInterval(syncIntervalId);
      setSyncIntervalId(null);
    }
    
    return undefined;
  }, [isAutoSyncEnabled, isOnline, syncInterval, isSynchronizing, pendingOperations, synchronize, syncIntervalId]);

  // Set up a listener to detect when the app goes online after being offline
  useEffect(() => {
    logger.debug('Setting up network change listener for offline context');
    
    const unsubscribe = NetInfo.addEventListener(state => {
      const currentlyOnline = state.isConnected === true && state.isInternetReachable !== false;
      
      // Only log significant changes to avoid noise
      if (currentlyOnline !== isOnline) {
        logger.info(`Network status changed: ${currentlyOnline ? 'online' : 'offline'}`);
        
        // If transitioning from offline to online, try to sync pending operations
        if (currentlyOnline && !isOnline && isAutoSyncEnabled && pendingOperations > 0) {
          logger.info('Network restored, triggering sync of pending operations');
          
          // Wait a bit to ensure connection is stable
          setTimeout(() => {
            synchronize().catch(error => {
              logger.error('Failed to synchronize after network restoration', { error });
            });
          }, 2000);
        }
      }
    });
    
    return () => {
      logger.debug('Cleaning up network change listener for offline context');
      unsubscribe();
    };
  }, [isOnline, isAutoSyncEnabled, pendingOperations, synchronize]);

  // Combine all offline functionality into the context value
  const contextValue: OfflineContextType = {
    isOnline,
    isSynchronizing,
    lastSyncTime,
    pendingOperations,
    synchronize,
    queueRequest,
    cacheData,
    getCachedData,
    clearOfflineData,
    enableAutoSync,
    disableAutoSync,
    isAutoSyncEnabled
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

export { OfflineProvider, useOfflineContext, OfflineContext };