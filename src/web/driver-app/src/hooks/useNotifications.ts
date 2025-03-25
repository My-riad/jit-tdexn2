import { useState, useEffect, useCallback, useRef } from 'react'; // react ^18.2.0
import NetInfo from '@react-native-community/netinfo'; // ^9.3.7
import Geolocation from '@react-native-community/geolocation'; // ^3.0.5
import { useDispatch, useSelector } from 'react-redux'; // react-redux ^8.0.5

import notificationService, { DriverNotificationType } from '../services/notificationService';
import useOfflineSync from './useOfflineSync';
import {
  Notification,
  NotificationQueryOptions,
  NotificationPreference,
  NotificationPreferenceUpdate
} from '../../../common/interfaces/tracking.interface';
import logger from '../../../common/utils/logger';
import * as notificationActions from '../store/actions/notificationActions';
import { NotificationContainer } from '../../../shared/components/feedback/NotificationToast';

/**
 * Interface defining the return type of the useNotifications hook
 */
interface UseNotificationsResult {
  notifications: Notification[];
  locationNotifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  preferences: NotificationPreference[];
  isOnline: boolean;
  isSynchronizing: boolean;
  fetchNotifications: (options?: NotificationQueryOptions) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: NotificationPreferenceUpdate) => Promise<void>;
  fetchLocationBasedNotifications: () => Promise<void>;
  syncOfflineNotifications: () => Promise<{ success: boolean; synced: number }>;
  showNotification: (notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; title?: string; duration?: number }) => void;
  dismissNotification: (id: string) => void;
}

/**
 * Interface defining configuration options for the useNotifications hook
 */
export interface UseNotificationsOptions {
  enableLocationBasedNotifications: boolean;
  locationNotificationRadius: number;
  locationUpdateInterval: number;
  enableRealTimeUpdates: boolean;
  autoSyncOfflineNotifications: boolean;
}

/**
 * Custom hook that provides driver-specific notification functionality for the mobile application
 * @param driverId The driver's unique identifier
 * @param options Configuration options for the hook
 * @returns Object containing notification state and methods
 */
const useNotifications = (
  driverId: string,
  options: UseNotificationsOptions
): UseNotificationsResult => {
  // LD1: Initialize Redux dispatch and selector hooks
  const dispatch = useDispatch();
  const notificationState = useSelector((state: any) => state.notification);

  // LD2: Initialize offline sync hook for handling offline notifications
  const offlineSync = useOfflineSync({ autoSync: options.autoSyncOfflineNotifications });

  // LD3: Initialize state for location-based notifications and location tracking
  const [locationNotifications, setLocationNotifications] = useState<Notification[]>([]);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState<boolean>(options.enableLocationBasedNotifications);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationWatchId = useRef<number | null>(null);

  // LD4: Create fetchNotifications function to get driver notifications with optional filtering
  const fetchNotifications = useCallback(async (queryOptions?: NotificationQueryOptions) => {
    try {
      logger.info(`Fetching notifications for driver ${driverId}`, { component: 'useNotifications' });
      await dispatch(notificationActions.fetchNotifications(driverId, queryOptions));
    } catch (error: any) {
      logger.error(`Failed to fetch notifications for driver ${driverId}`, { component: 'useNotifications', error });
    }
  }, [dispatch, driverId]);

  // LD5: Create fetchUnreadCount function to get the count of unread notifications
  const fetchUnreadCount = useCallback(async () => {
    try {
      logger.info(`Fetching unread count for driver ${driverId}`, { component: 'useNotifications' });
      await dispatch(notificationActions.fetchUnreadCount(driverId));
    } catch (error: any) {
      logger.error(`Failed to fetch unread count for driver ${driverId}`, { component: 'useNotifications', error });
    }
  }, [dispatch, driverId]);

  // LD6: Create markAsRead function to mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      logger.info(`Marking notification ${notificationId} as read`, { component: 'useNotifications' });
      await dispatch(notificationActions.markNotificationAsRead(notificationId));
      await fetchUnreadCount(); // Refresh unread count after marking as read
    } catch (error: any) {
      logger.error(`Failed to mark notification ${notificationId} as read`, { component: 'useNotifications', error });
    }
  }, [dispatch, fetchUnreadCount]);

  // LD7: Create markAllAsRead function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      logger.info(`Marking all notifications as read for driver ${driverId}`, { component: 'useNotifications' });
      await dispatch(notificationActions.markAllNotificationsAsRead(driverId));
      await fetchUnreadCount(); // Refresh unread count after marking all as read
    } catch (error: any) {
      logger.error(`Failed to mark all notifications as read for driver ${driverId}`, { component: 'useNotifications', error });
    }
  }, [dispatch, fetchUnreadCount, driverId]);

  // LD8: Create deleteNotification function to delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      logger.info(`Deleting notification ${notificationId}`, { component: 'useNotifications' });
      await dispatch(notificationActions.deleteNotification(notificationId));
      await fetchNotifications(); // Refresh notifications after deletion
    } catch (error: any) {
      logger.error(`Failed to delete notification ${notificationId}`, { component: 'useNotifications', error });
    }
  }, [dispatch, fetchNotifications]);

  // LD9: Create fetchPreferences function to get driver notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      logger.info(`Fetching notification preferences for driver ${driverId}`, { component: 'useNotifications' });
      await dispatch(notificationActions.fetchNotificationPreferences(driverId));
    } catch (error: any) {
      logger.error(`Failed to fetch notification preferences for driver ${driverId}`, { component: 'useNotifications', error });
    }
  }, [dispatch, driverId]);

  // LD10: Create updatePreferences function to update driver notification preferences
  const updatePreferences = useCallback(async (preferences: NotificationPreferenceUpdate) => {
    try {
      logger.info(`Updating notification preferences for driver ${driverId}`, { component: 'useNotifications', preferences });
      await dispatch(notificationActions.updateNotificationPreferences(driverId, preferences));
      await fetchPreferences(); // Refresh preferences after update
    } catch (error: any) {
      logger.error(`Failed to update notification preferences for driver ${driverId}`, { component: 'useNotifications', error });
    }
  }, [dispatch, fetchPreferences, driverId]);

  // LD11: Create fetchLocationBasedNotifications function to get notifications based on driver's location
  const fetchLocationBasedNotifications = useCallback(async () => {
    if (!currentLocation) {
      logger.warn('Cannot fetch location-based notifications: no current location', { component: 'useNotifications' });
      return;
    }

    try {
      logger.info(`Fetching location-based notifications for driver ${driverId}`, { component: 'useNotifications', location: currentLocation, radius: options.locationNotificationRadius });
      await dispatch(notificationActions.fetchLocationNotifications(driverId, currentLocation, options.locationNotificationRadius));
      const locationNotifications = await notificationService.getLocationBasedNotifications(driverId, currentLocation, options.locationNotificationRadius);
      setLocationNotifications(locationNotifications);
    } catch (error: any) {
      logger.error(`Failed to fetch location-based notifications for driver ${driverId}`, { component: 'useNotifications', location: currentLocation, radius: options.locationNotificationRadius, error });
    }
  }, [dispatch, driverId, currentLocation, options.locationNotificationRadius]);

  // LD12: Create syncOfflineNotifications function to synchronize stored offline notifications
  const syncOfflineNotifications = useCallback(async () => {
    try {
      logger.info(`Syncing offline notifications for driver ${driverId}`, { component: 'useNotifications' });
      dispatch({ type: notificationActions.SYNC_OFFLINE_NOTIFICATIONS_REQUEST });
      const syncResult = await notificationService.syncOfflineNotifications(driverId);
      dispatch({
        type: notificationActions.SYNC_OFFLINE_NOTIFICATIONS_SUCCESS,
        payload: syncResult,
      });
      return syncResult;
    } catch (error: any) {
      logger.error(`Failed to sync offline notifications for driver ${driverId}`, { component: 'useNotifications', error });
      dispatch({
        type: notificationActions.SYNC_OFFLINE_NOTIFICATIONS_FAILURE,
        payload: error.message,
      });
      return { success: false, synced: 0 };
    }
  }, [dispatch, driverId]);

  // LD13: Create showNotification function to display a temporary toast notification
  const showNotification = useCallback((notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; title?: string; duration?: number }) => {
    const { showNotification, dismissNotification } = NotificationContainer.useNotificationContainer();
    return showNotification(notification);
  }, []);

  // LD14: Create dismissNotification function to dismiss a temporary toast notification
  const dismissNotification = useCallback((id: string) => {
    const { dismissNotification } = NotificationContainer.useNotificationContainer();
    return dismissNotification(id);
  }, []);

  // LD15: Set up WebSocket subscription for real-time notification updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    if (options.enableRealTimeUpdates) {
      logger.info(`Subscribing to real-time notifications for driver ${driverId}`, { component: 'useNotifications' });
      unsubscribe = dispatch(notificationActions.subscribeToNotifications(driverId)) as any;
    }

    return () => {
      if (unsubscribe) {
        logger.info(`Unsubscribing from real-time notifications for driver ${driverId}`, { component: 'useNotifications' });
        unsubscribe();
      }
    };
  }, [dispatch, driverId, options.enableRealTimeUpdates]);

  // LD16: Set up location tracking for location-based notifications if enabled
  useEffect(() => {
    if (locationTrackingEnabled) {
      logger.info(`Starting location tracking for driver ${driverId}`, { component: 'useNotifications', interval: options.locationUpdateInterval });

      const watchId = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          logger.debug(`Location updated: ${latitude}, ${longitude}`, { component: 'useNotifications' });
        },
        (error) => {
          logger.error('Location tracking error', { component: 'useNotifications', error });
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
          distanceFilter: 10,
          interval: options.locationUpdateInterval,
        }
      );
      locationWatchId.current = watchId;
    } else {
      logger.info(`Location tracking disabled for driver ${driverId}`, { component: 'useNotifications' });
    }

    return () => {
      if (locationWatchId.current !== null) {
        Geolocation.clearWatch(locationWatchId.current);
        locationWatchId.current = null;
        logger.info(`Location tracking stopped for driver ${driverId}`, { component: 'useNotifications' });
      }
    };
  }, [locationTrackingEnabled, driverId, options.locationUpdateInterval]);

  // LD17: Set up effect to synchronize offline notifications when coming back online
  useEffect(() => {
    if (offlineSync.isOnline && options.autoSyncOfflineNotifications) {
      logger.info(`Auto-syncing offline notifications for driver ${driverId}`, { component: 'useNotifications' });
      syncOfflineNotifications();
    }
  }, [offlineSync.isOnline, options.autoSyncOfflineNotifications, syncOfflineNotifications, driverId]);

  // LD18: Clean up WebSocket subscription and location tracking on component unmount
  useEffect(() => {
    return () => {
      if (locationWatchId.current !== null) {
        Geolocation.clearWatch(locationWatchId.current);
        locationWatchId.current = null;
        logger.info(`Location tracking stopped on unmount for driver ${driverId}`, { component: 'useNotifications' });
      }
    };
  }, [driverId]);

  // LD19: Return an object with all notification state and methods
  return {
    notifications: notificationState.notifications,
    locationNotifications,
    unreadCount: notificationState.unreadCount,
    loading: notificationState.loading,
    error: notificationState.error,
    preferences: notificationState.preferences,
    isOnline: offlineSync.isOnline,
    isSynchronizing: offlineSync.isSynchronizing,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    fetchLocationBasedNotifications,
    syncOfflineNotifications,
    showNotification,
    dismissNotification,
  };
};

export default useNotifications;