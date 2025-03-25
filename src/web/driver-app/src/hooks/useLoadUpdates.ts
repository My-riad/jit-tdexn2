import { useEffect, useState, useCallback } from 'react'; //  ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; //  ^8.1.1
import { io } from 'socket.io-client'; // ^4.7.1

import { 
  LoadWithDetails, 
  LoadStatus, 
  LoadStatusUpdateParams 
} from '../../../common/interfaces/load.interface';
import { 
  updateLoadStatusAction, 
  setActiveLoad, 
  clearActiveLoad 
} from '../../store/actions/loadActions';
import notificationService from '../../../common/services/notificationService';
import useAuth from '../../../common/hooks/useAuth';
import logger from '../../../common/utils/logger';
import { getLoadById } from '../../../common/api/loadApi';
import useDriverLocation from './useDriverLocation';

/**
 * Interface defining the return type of the useLoadUpdates hook
 */
interface UseLoadUpdatesResult {
  activeLoad: LoadWithDetails | null;
  loading: boolean;
  error: string | null;
  refreshLoad: () => Promise<void>;
  updateLoadStatus: (status: LoadStatus, details?: Record<string, any>) => Promise<void>;
}

/**
 * A custom hook that provides real-time updates for a driver's active load
 * @param loadId - The ID of the load to fetch updates for
 * @returns An object containing the active load, loading state, and update functions
 */
const useLoadUpdates = (loadId: string): UseLoadUpdatesResult => {
  // 1. Get the current authenticated driver from useAuth hook
  const { authState } = useAuth();
  const driver = authState.user;

  // 2. Get the current driver location from useDriverLocation hook
  const { position: driverPosition } = useDriverLocation(driver?.id || '', '');

  // 3. Access the Redux store using useSelector to get the active load state
  const activeLoad = useSelector((state: any) => state.load.activeLoad) as LoadWithDetails | null;

  // 4. Initialize dispatch function using useDispatch
  const dispatch = useDispatch();

  // 5. Set up state for tracking loading status and errors
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 6. Define a refreshLoad callback function to fetch the latest load details
  const refreshLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadDetails = await getLoadById(loadId, true) as LoadWithDetails;
      dispatch(setActiveLoad(loadDetails));
    } catch (err: any) {
      setError(err.message || 'Failed to refresh load details');
      logger.error('Failed to refresh load details', { loadId, error: err });
    } finally {
      setLoading(false);
    }
  }, [loadId, dispatch]);

  // 7. Define an updateLoadStatus callback function to update the load status
  const updateLoadStatus = useCallback(
    async (status: LoadStatus, details?: Record<string, any>) => {
      if (!driver) {
        setError('Driver information is not available.');
        return;
      }

      const statusData: LoadStatusUpdateParams = {
        status,
        statusDetails: details,
        updatedBy: driver.id,
        coordinates: driverPosition || undefined,
      };

      try {
        await dispatch(updateLoadStatusAction(loadId, statusData));
        await refreshLoad(); // Refresh load details after status update
      } catch (err: any) {
        setError(err.message || 'Failed to update load status');
        logger.error('Failed to update load status', { loadId, status, error: err });
      }
    },
    [loadId, driver, driverPosition, dispatch, refreshLoad]
  );

  // 8. Set up a useEffect to fetch the initial load details when the component mounts or loadId changes
  useEffect(() => {
    if (loadId) {
      refreshLoad();
    } else {
      dispatch(clearActiveLoad());
    }
  }, [loadId, dispatch, refreshLoad]);

  // 9. Set up a useEffect to subscribe to real-time notifications for load updates
  useEffect(() => {
    let unsubscribe: () => void;

    if (loadId) {
      unsubscribe = notificationService.subscribeToNotifications((notification) => {
        if (notification.type === 'load_update' && notification.loadId === loadId) {
          logger.debug('Received load update notification', { loadId, notification });
          refreshLoad();
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
        logger.debug('Unsubscribed from load updates');
      }
    };
  }, [loadId, refreshLoad]);

  // 10. Set up a useEffect to periodically refresh the load details at a defined interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (loadId) {
        refreshLoad();
      }
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(intervalId);
  }, [loadId, refreshLoad]);

  // 11. Return the active load, loading state, error state, and update functions
  return {
    activeLoad,
    loading,
    error,
    refreshLoad,
    updateLoadStatus,
  };
};

export default useLoadUpdates;

/**
 * Interface defining the return type of the useLoadUpdates hook
 */
export interface UseLoadUpdatesResult {
  activeLoad: LoadWithDetails | null;
  loading: boolean;
  error: string | null;
  refreshLoad: () => Promise<void>;
  updateLoadStatus: (status: LoadStatus, details?: Record<string, any>) => Promise<void>;
}