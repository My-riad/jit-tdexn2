import { io, Socket } from 'socket.io-client'; // ^4.7.1
import PushNotificationIOS from '@react-native-community/push-notification-ios'; // ^1.11.0
import PushNotification from 'react-native-push-notification'; // ^8.1.1
import NetInfo from '@react-native-community/netinfo'; // ^9.3.7

import apiClient from '../../../common/api/apiClient';
import commonNotificationService from '../../../common/services/notificationService';
import { API_ENDPOINTS } from '../../../common/constants/endpoints';
import { 
  Notification, 
  NotificationQueryOptions, 
  NotificationResponse, 
  NotificationPreference,
  NotificationPreferenceUpdate
} from '../../../common/interfaces/tracking.interface';
import logger from '../../../common/utils/logger';
import { 
  storeData, 
  retrieveData, 
  removeData,
  cacheData,
  getCachedData,
  addQueuedRequest,
  getQueuedRequests,
  removeQueuedRequest
} from './offlineStorageService';

// Constants
const NOTIFICATION_SOCKET_URL = 'wss://api.freightoptimization.com/driver-notifications';
const OFFLINE_NOTIFICATIONS_KEY = 'offline_notifications';
const NOTIFICATION_PREFERENCES_KEY = 'notification_preferences';
const NOTIFICATION_CHANNEL_ID = 'freight_optimization_channel';

// Driver-specific notification types
export enum DriverNotificationType {
  LOAD_OPPORTUNITY = 'load_opportunity',
  LOAD_STATUS = 'load_status',
  ACHIEVEMENT = 'achievement',
  BONUS_ZONE = 'bonus_zone',
  SMART_HUB = 'smart_hub',
  SYSTEM = 'system'
}

/**
 * Fetches notifications for a specific driver with optional filtering and pagination
 * @param driverId The driver's unique identifier
 * @param options Filtering and pagination options
 * @returns Promise with paginated notifications and total count
 */
const getDriverNotifications = async (
  driverId: string,
  options: NotificationQueryOptions = {}
): Promise<NotificationResponse> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Construct query parameters from options
      const queryParams = new URLSearchParams();
      
      if (options.page !== undefined) queryParams.append('page', options.page.toString());
      if (options.limit !== undefined) queryParams.append('limit', options.limit.toString());
      if (options.type) queryParams.append('type', options.type);
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      if (options.read !== undefined) queryParams.append('read', options.read.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortDirection) queryParams.append('sortDirection', options.sortDirection);
      
      // Make API request to get driver-specific notifications
      const url = `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}?${queryParams.toString()}`;
      const response = await apiClient.get<NotificationResponse>(url);
      
      logger.debug('Fetched driver notifications', {
        component: 'DriverNotificationService',
        driverId,
        count: response.data.notifications.length,
        total: response.data.total
      });
      
      // Cache the notifications for offline access
      await cacheData(
        `driver_notifications_${driverId}`,
        response.data,
        { expiration: 3600000 } // 1 hour
      );
      
      return response.data;
    } else {
      // Offline mode - get cached notifications
      logger.info('Device offline, retrieving cached notifications', {
        component: 'DriverNotificationService',
        driverId
      });
      
      const cachedData = await getCachedData<NotificationResponse>(
        `driver_notifications_${driverId}`,
        { notifications: [], total: 0 }
      );
      
      return cachedData || { notifications: [], total: 0 };
    }
  } catch (error) {
    logger.error('Failed to fetch driver notifications', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    
    // Try to get cached data in case of error
    const cachedData = await getCachedData<NotificationResponse>(
      `driver_notifications_${driverId}`,
      { notifications: [], total: 0 }
    );
    
    return cachedData || { notifications: [], total: 0 };
  }
};

/**
 * Fetches the count of unread notifications for a specific driver
 * @param driverId The driver's unique identifier
 * @returns Promise with the count of unread notifications
 */
const getDriverUnreadCount = async (driverId: string): Promise<number> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Make API request to get unread notification count
      const response = await apiClient.get<{ count: number }>(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/unread`
      );
      
      logger.debug('Fetched driver unread notification count', {
        component: 'DriverNotificationService',
        driverId,
        count: response.data.count
      });
      
      // Cache the count for offline access
      await cacheData(
        `driver_unread_count_${driverId}`,
        response.data.count,
        { expiration: 300000 } // 5 minutes
      );
      
      return response.data.count;
    } else {
      // Offline mode - calculate from cached notifications
      logger.info('Device offline, calculating unread count from cache', {
        component: 'DriverNotificationService',
        driverId
      });
      
      const cachedData = await getCachedData<NotificationResponse>(
        `driver_notifications_${driverId}`,
        { notifications: [], total: 0 }
      );
      
      const unreadCount = cachedData?.notifications.filter(notification => !notification.read).length || 0;
      
      return unreadCount;
    }
  } catch (error) {
    logger.error('Failed to fetch driver unread notification count', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    
    // Try to calculate from cached notifications in case of error
    const cachedData = await getCachedData<NotificationResponse>(
      `driver_notifications_${driverId}`,
      { notifications: [], total: 0 }
    );
    
    return cachedData?.notifications.filter(notification => !notification.read).length || 0;
  }
};

/**
 * Marks a specific notification as read
 * @param notificationId ID of the notification to mark as read
 * @returns Promise that resolves when the operation completes
 */
const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Make API request to mark notification as read
      await apiClient.put(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`);
      
      logger.debug('Marked notification as read', {
        component: 'DriverNotificationService',
        notificationId
      });
    } else {
      // Queue the request for when connection is restored
      await addQueuedRequest(
        `${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`,
        'PUT',
        {},
        { tags: ['notification', 'mark_read'] }
      );
      
      logger.info('Queued mark as read request for offline sync', {
        component: 'DriverNotificationService',
        notificationId
      });
    }
    
    // Update local cache regardless of connectivity
    try {
      // Get all cache keys and update notifications in each cache that contains this notification
      const keys = await getQueuedRequests();
      const notificationKeys = keys
        .filter(request => request.options?.tags?.includes('notification_cache'))
        .map(request => request.data.cacheKey);
      
      for (const cacheKey of notificationKeys) {
        const cachedData = await getCachedData<NotificationResponse>(cacheKey);
        
        if (cachedData && cachedData.notifications) {
          const updatedNotifications = cachedData.notifications.map(notification => {
            if (notification.id === notificationId) {
              return { ...notification, read: true };
            }
            return notification;
          });
          
          await cacheData(
            cacheKey,
            { ...cachedData, notifications: updatedNotifications },
            { expiration: 3600000 } // 1 hour
          );
        }
      }
    } catch (cacheError) {
      logger.error('Failed to update notification cache after marking as read', {
        component: 'DriverNotificationService',
        notificationId,
        error: cacheError
      });
    }
  } catch (error) {
    logger.error('Failed to mark notification as read', {
      component: 'DriverNotificationService',
      notificationId,
      error
    });
    throw error;
  }
};

/**
 * Marks all notifications as read for a specific driver
 * @param driverId The driver's unique identifier
 * @returns Promise that resolves when the operation completes
 */
const markAllAsRead = async (driverId: string): Promise<void> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Make API request to mark all notifications as read
      await apiClient.put(`${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/read-all`);
      
      logger.debug('Marked all notifications as read for driver', {
        component: 'DriverNotificationService',
        driverId
      });
    } else {
      // Queue the request for when connection is restored
      await addQueuedRequest(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/read-all`,
        'PUT',
        {},
        { tags: ['notification', 'mark_all_read'] }
      );
      
      logger.info('Queued mark all as read request for offline sync', {
        component: 'DriverNotificationService',
        driverId
      });
    }
    
    // Update local cache regardless of connectivity
    try {
      const cacheKey = `driver_notifications_${driverId}`;
      const cachedData = await getCachedData<NotificationResponse>(cacheKey);
      
      if (cachedData && cachedData.notifications) {
        const updatedNotifications = cachedData.notifications.map(notification => ({
          ...notification,
          read: true
        }));
        
        await cacheData(
          cacheKey,
          { ...cachedData, notifications: updatedNotifications },
          { expiration: 3600000 } // 1 hour
        );
      }
      
      // Update unread count cache
      await cacheData(
        `driver_unread_count_${driverId}`,
        0,
        { expiration: 300000 } // 5 minutes
      );
    } catch (cacheError) {
      logger.error('Failed to update notification cache after marking all as read', {
        component: 'DriverNotificationService',
        driverId,
        error: cacheError
      });
    }
  } catch (error) {
    logger.error('Failed to mark all notifications as read', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    throw error;
  }
};

/**
 * Deletes a specific notification
 * @param notificationId ID of the notification to delete
 * @returns Promise that resolves when the operation completes
 */
const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Make API request to delete the notification
      await apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}`);
      
      logger.debug('Deleted notification', {
        component: 'DriverNotificationService',
        notificationId
      });
    } else {
      // Queue the request for when connection is restored
      await addQueuedRequest(
        `${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}`,
        'DELETE',
        {},
        { tags: ['notification', 'delete'] }
      );
      
      logger.info('Queued delete notification request for offline sync', {
        component: 'DriverNotificationService',
        notificationId
      });
    }
    
    // Update local cache regardless of connectivity
    try {
      // Get all cache keys and update notifications in each cache that contains this notification
      const keys = await getQueuedRequests();
      const notificationKeys = keys
        .filter(request => request.options?.tags?.includes('notification_cache'))
        .map(request => request.data.cacheKey);
      
      for (const cacheKey of notificationKeys) {
        const cachedData = await getCachedData<NotificationResponse>(cacheKey);
        
        if (cachedData && cachedData.notifications) {
          const updatedNotifications = cachedData.notifications.filter(
            notification => notification.id !== notificationId
          );
          
          await cacheData(
            cacheKey,
            { ...cachedData, notifications: updatedNotifications, total: cachedData.total - 1 },
            { expiration: 3600000 } // 1 hour
          );
        }
      }
    } catch (cacheError) {
      logger.error('Failed to update notification cache after deletion', {
        component: 'DriverNotificationService',
        notificationId,
        error: cacheError
      });
    }
  } catch (error) {
    logger.error('Failed to delete notification', {
      component: 'DriverNotificationService',
      notificationId,
      error
    });
    throw error;
  }
};

/**
 * Fetches notification preferences for a specific driver
 * @param driverId The driver's unique identifier
 * @returns Promise with the user's notification preferences
 */
const getDriverNotificationPreferences = async (
  driverId: string
): Promise<NotificationPreference[]> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Make API request to get notification preferences
      const response = await apiClient.get<NotificationPreference[]>(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/preferences`
      );
      
      logger.debug('Fetched driver notification preferences', {
        component: 'DriverNotificationService',
        driverId,
        preferencesCount: response.data.length
      });
      
      // Cache the preferences for offline access
      await cacheData(
        `driver_notification_preferences_${driverId}`,
        response.data,
        { expiration: 86400000 } // 24 hours
      );
      
      return response.data;
    } else {
      // Offline mode - get cached preferences
      logger.info('Device offline, retrieving cached notification preferences', {
        component: 'DriverNotificationService',
        driverId
      });
      
      const cachedData = await getCachedData<NotificationPreference[]>(
        `driver_notification_preferences_${driverId}`,
        []
      );
      
      return cachedData || [];
    }
  } catch (error) {
    logger.error('Failed to fetch driver notification preferences', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    
    // Try to get cached preferences in case of error
    const cachedData = await getCachedData<NotificationPreference[]>(
      `driver_notification_preferences_${driverId}`,
      []
    );
    
    return cachedData || [];
  }
};

/**
 * Updates notification preferences for a specific driver
 * @param driverId The driver's unique identifier
 * @param preferences Updated notification preferences
 * @returns Promise with the updated notification preferences
 */
const updateDriverNotificationPreferences = async (
  driverId: string,
  preferences: NotificationPreferenceUpdate
): Promise<NotificationPreference[]> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Make API request to update notification preferences
      const response = await apiClient.put<NotificationPreference[]>(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/preferences`,
        preferences
      );
      
      logger.debug('Updated driver notification preferences', {
        component: 'DriverNotificationService',
        driverId
      });
      
      // Cache the updated preferences
      await cacheData(
        `driver_notification_preferences_${driverId}`,
        response.data,
        { expiration: 86400000 } // 24 hours
      );
      
      return response.data;
    } else {
      // Queue the request for when connection is restored
      await addQueuedRequest(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/preferences`,
        'PUT',
        preferences,
        { tags: ['notification', 'preferences'] }
      );
      
      logger.info('Queued notification preferences update for offline sync', {
        component: 'DriverNotificationService',
        driverId
      });
      
      // Update the cached preferences optimistically
      const cachedPreferences = await getCachedData<NotificationPreference[]>(
        `driver_notification_preferences_${driverId}`,
        []
      );
      
      // Merge the preferences update with cached preferences
      let updatedPreferences = [...(cachedPreferences || [])];
      
      if (preferences.enabledTypes) {
        updatedPreferences = updatedPreferences.map(pref => {
          if (preferences.enabledTypes?.hasOwnProperty(pref.type)) {
            return {
              ...pref,
              enabled: preferences.enabledTypes[pref.type]
            };
          }
          return pref;
        });
      }
      
      if (preferences.channels) {
        updatedPreferences = updatedPreferences.map(pref => {
          if (preferences.channels?.hasOwnProperty(pref.type)) {
            return {
              ...pref,
              channels: preferences.channels[pref.type]
            };
          }
          return pref;
        });
      }
      
      // Cache the updated preferences
      await cacheData(
        `driver_notification_preferences_${driverId}`,
        updatedPreferences,
        { expiration: 86400000 } // 24 hours
      );
      
      return updatedPreferences;
    }
  } catch (error) {
    logger.error('Failed to update driver notification preferences', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    throw error;
  }
};

/**
 * Fetches notifications based on the driver's current location
 * @param driverId The driver's unique identifier
 * @param position The driver's current position (latitude, longitude)
 * @param radius The radius in miles to search for notifications
 * @returns Promise with an array of location-based notifications
 */
const getLocationBasedNotifications = async (
  driverId: string,
  position: { latitude: number; longitude: number },
  radius: number = 50
): Promise<Notification[]> => {
  try {
    // Check network connectivity - location-based notifications require connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (!isConnected) {
      logger.info('Device offline, location-based notifications unavailable', {
        component: 'DriverNotificationService',
        driverId
      });
      return [];
    }
    
    // Make API request to get location-based notifications
    const response = await apiClient.get<Notification[]>(
      `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/location`,
      {
        params: {
          latitude: position.latitude,
          longitude: position.longitude,
          radius
        }
      }
    );
    
    logger.debug('Fetched location-based notifications', {
      component: 'DriverNotificationService',
      driverId,
      count: response.data.length,
      position,
      radius
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch location-based notifications', {
      component: 'DriverNotificationService',
      driverId,
      position,
      radius,
      error
    });
    return [];
  }
};

/**
 * Establishes a WebSocket connection to receive real-time notification updates
 * @param driverId The driver's unique identifier
 * @param onNotification Callback function to handle incoming notifications
 * @param onNotificationRead Callback function to handle read status updates
 * @returns Unsubscribe function to close the connection
 */
const subscribeToDriverNotifications = (
  driverId: string,
  onNotification: (notification: Notification) => void,
  onNotificationRead?: (notificationId: string) => void
): (() => void) => {
  let socket: Socket | null = null;
  
  try {
    // Check network connectivity
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected;
      
      if (!isConnected) {
        logger.info('Device offline, WebSocket connection unavailable', {
          component: 'DriverNotificationService',
          driverId
        });
        return;
      }
      
      // Create socket.io connection to the driver notification WebSocket endpoint
      socket = io(`${NOTIFICATION_SOCKET_URL}/${driverId}`, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        query: { driverId }
      });
      
      // Set up event handlers for connection states
      socket.on('connect', () => {
        logger.info('Connected to driver notification WebSocket', {
          component: 'DriverNotificationService',
          driverId,
          socketId: socket?.id
        });
      });
      
      socket.on('disconnect', (reason) => {
        logger.info('Disconnected from driver notification WebSocket', {
          component: 'DriverNotificationService',
          driverId,
          reason
        });
      });
      
      socket.on('connect_error', (error) => {
        logger.error('Failed to connect to driver notification WebSocket', {
          component: 'DriverNotificationService',
          driverId,
          error
        });
      });
      
      socket.on('reconnect', (attemptNumber) => {
        logger.info('Reconnected to driver notification WebSocket', {
          component: 'DriverNotificationService',
          driverId,
          attemptNumber
        });
      });
      
      // Listen for 'notification' events
      socket.on('notification', (data: Notification) => {
        logger.debug('Received notification via WebSocket', {
          component: 'DriverNotificationService',
          driverId,
          notificationId: data.id,
          type: data.type
        });
        
        // Call the provided callback with the notification data
        onNotification(data);
      });
      
      // Listen for 'notification_read' events if callback provided
      if (onNotificationRead) {
        socket.on('notification_read', (data: { id: string }) => {
          logger.debug('Received notification read status via WebSocket', {
            component: 'DriverNotificationService',
            driverId,
            notificationId: data.id
          });
          
          // Call the provided callback with the notification ID
          onNotificationRead(data.id);
        });
      }
    });
    
    // Return an unsubscribe function that closes the socket connection
    return () => {
      if (socket) {
        logger.info('Closing driver notification WebSocket connection', {
          component: 'DriverNotificationService',
          driverId
        });
        socket.disconnect();
        socket = null;
      }
    };
  } catch (error) {
    logger.error('Error in driver notification subscription', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    
    // Return a no-op unsubscribe function in case of errors
    return () => {};
  }
};

/**
 * Retrieves notifications that were stored while the device was offline
 * @param driverId The driver's unique identifier
 * @returns Promise with an array of stored offline notifications
 */
const getOfflineNotifications = async (driverId: string): Promise<Notification[]> => {
  try {
    const offlineNotifications = await retrieveData<Notification[]>(
      `${OFFLINE_NOTIFICATIONS_KEY}_${driverId}`,
      []
    );
    
    logger.debug('Retrieved offline notifications', {
      component: 'DriverNotificationService',
      driverId,
      count: offlineNotifications?.length || 0
    });
    
    return offlineNotifications || [];
  } catch (error) {
    logger.error('Failed to retrieve offline notifications', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    return [];
  }
};

/**
 * Synchronizes stored offline notifications when connectivity is restored
 * @param driverId The driver's unique identifier
 * @returns Promise with result of synchronization
 */
const syncOfflineNotifications = async (
  driverId: string
): Promise<{ success: boolean; synced: number }> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (!isConnected) {
      logger.info('Device offline, cannot sync notifications', {
        component: 'DriverNotificationService',
        driverId
      });
      return { success: false, synced: 0 };
    }
    
    // Get queued notification operations
    const queuedRequests = await getQueuedRequests();
    const notificationRequests = queuedRequests.filter(request => 
      request.options?.tags?.includes('notification')
    );
    
    if (notificationRequests.length === 0) {
      logger.info('No notification requests to sync', {
        component: 'DriverNotificationService',
        driverId
      });
      return { success: true, synced: 0 };
    }
    
    logger.info(`Starting sync of ${notificationRequests.length} notification requests`, {
      component: 'DriverNotificationService',
      driverId
    });
    
    let syncedCount = 0;
    
    // Process each request
    for (const request of notificationRequests) {
      try {
        // Execute the request
        if (request.method === 'PUT') {
          await apiClient.put(request.endpoint, request.data);
        } else if (request.method === 'DELETE') {
          await apiClient.delete(request.endpoint);
        } else if (request.method === 'POST') {
          await apiClient.post(request.endpoint, request.data);
        }
        
        // Remove the request from the queue
        await removeQueuedRequest(request.id);
        syncedCount++;
        
        logger.debug(`Synced notification request: ${request.method} ${request.endpoint}`, {
          component: 'DriverNotificationService',
          driverId,
          requestId: request.id
        });
      } catch (requestError) {
        logger.error(`Failed to sync notification request: ${request.method} ${request.endpoint}`, {
          component: 'DriverNotificationService',
          driverId,
          requestId: request.id,
          error: requestError
        });
      }
    }
    
    logger.info(`Completed sync of notification requests: ${syncedCount}/${notificationRequests.length} succeeded`, {
      component: 'DriverNotificationService',
      driverId
    });
    
    return { success: true, synced: syncedCount };
  } catch (error) {
    logger.error('Failed to sync offline notifications', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    return { success: false, synced: 0 };
  }
};

/**
 * Configures push notification handling for the device
 * @param driverId The driver's unique identifier
 * @returns Promise that resolves to true if configuration was successful
 */
const configurePushNotifications = async (driverId: string): Promise<boolean> => {
  try {
    // Configure PushNotification library
    PushNotification.configure({
      // (required) Called when a remote or local notification is opened or received
      onNotification: (notification) => {
        logger.debug('Received push notification', {
          component: 'DriverNotificationService',
          driverId,
          notification
        });
        
        // Process the notification
        handleNotificationOpen(notification);
        
        // Required on iOS only
        if (notification.finish) {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },
      
      // (optional) Called when Token is generated
      onRegister: (tokenData) => {
        const { token, os } = tokenData;
        
        logger.info('Registered device for push notifications', {
          component: 'DriverNotificationService',
          driverId,
          deviceType: os
        });
        
        // Register the token with the server
        registerDeviceForPushNotifications(driverId, token, os)
          .catch(error => {
            logger.error('Failed to register device token with server', {
              component: 'DriverNotificationService',
              driverId,
              error
            });
          });
      },
      
      // (optional) Called when the user fails to register for remote notifications
      onRegistrationError: (error) => {
        logger.error('Failed to register for push notifications', {
          component: 'DriverNotificationService',
          driverId,
          error
        });
      },
      
      // Should the initial notification be popped automatically
      popInitialNotification: true,
      
      // Request permissions for iOS
      requestPermissions: true,
      
      // IOS ONLY
      permissions: {
        alert: true,
        badge: true,
        sound: true
      }
    });
    
    // Create a notification channel for Android
    PushNotification.createChannel(
      {
        channelId: NOTIFICATION_CHANNEL_ID,
        channelName: 'Freight Optimization Notifications',
        channelDescription: 'Notifications for the freight optimization platform',
        playSound: true,
        soundName: 'default',
        importance: 4, // High importance
        vibrate: true
      },
      (created) => {
        logger.debug(`Notification channel ${created ? 'created' : 'already exists'}`, {
          component: 'DriverNotificationService',
          driverId,
          channelId: NOTIFICATION_CHANNEL_ID
        });
      }
    );
    
    logger.info('Push notifications configured successfully', {
      component: 'DriverNotificationService',
      driverId
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to configure push notifications', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    return false;
  }
};

/**
 * Registers the device token with the server for push notifications
 * @param driverId The driver's unique identifier
 * @param deviceToken The device token for push notifications
 * @param deviceType The type of device (ios, android)
 * @returns Promise that resolves to true if registration was successful
 */
const registerDeviceForPushNotifications = async (
  driverId: string,
  deviceToken: string,
  deviceType: string
): Promise<boolean> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Make API request to register device token
      await apiClient.post(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/devices`,
        {
          deviceToken,
          deviceType,
          platform: deviceType
        }
      );
      
      logger.info('Registered device for push notifications with server', {
        component: 'DriverNotificationService',
        driverId,
        deviceType
      });
      
      return true;
    } else {
      // Queue the request for when connection is restored
      await addQueuedRequest(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/devices`,
        'POST',
        {
          deviceToken,
          deviceType,
          platform: deviceType
        },
        { tags: ['notification', 'device_registration'] }
      );
      
      logger.info('Queued device registration for push notifications for offline sync', {
        component: 'DriverNotificationService',
        driverId,
        deviceType
      });
      
      return true;
    }
  } catch (error) {
    logger.error('Failed to register device for push notifications', {
      component: 'DriverNotificationService',
      driverId,
      deviceType,
      error
    });
    return false;
  }
};

/**
 * Unregisters the device from push notifications
 * @param driverId The driver's unique identifier
 * @param deviceToken The device token to unregister
 * @returns Promise that resolves to true if unregistration was successful
 */
const unregisterDeviceForPushNotifications = async (
  driverId: string,
  deviceToken: string
): Promise<boolean> => {
  try {
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Make API request to unregister device token
      await apiClient.delete(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/devices/${deviceToken}`
      );
      
      logger.info('Unregistered device from push notifications', {
        component: 'DriverNotificationService',
        driverId
      });
      
      return true;
    } else {
      // Queue the request for when connection is restored
      await addQueuedRequest(
        `${API_ENDPOINTS.DRIVER_NOTIFICATIONS}/${driverId}/devices/${deviceToken}`,
        'DELETE',
        {},
        { tags: ['notification', 'device_unregistration'] }
      );
      
      logger.info('Queued device unregistration from push notifications for offline sync', {
        component: 'DriverNotificationService',
        driverId
      });
      
      return true;
    }
  } catch (error) {
    logger.error('Failed to unregister device from push notifications', {
      component: 'DriverNotificationService',
      driverId,
      error
    });
    return false;
  }
};

/**
 * Displays a local notification on the device
 * @param options Notification options (title, message, data)
 */
const showLocalNotification = (
  options: { title: string; message: string; data?: object }
): void => {
  try {
    PushNotification.localNotification({
      channelId: NOTIFICATION_CHANNEL_ID,
      title: options.title,
      message: options.message,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
      data: options.data
    });
    
    logger.debug('Displayed local notification', {
      component: 'DriverNotificationService',
      title: options.title
    });
  } catch (error) {
    logger.error('Failed to display local notification', {
      component: 'DriverNotificationService',
      title: options.title,
      error
    });
  }
};

/**
 * Handles when a user taps on a notification
 * @param notification The notification object
 */
const handleNotificationOpen = (notification: any): void => {
  try {
    logger.debug('Handling notification open', {
      component: 'DriverNotificationService',
      notification
    });
    
    // Extract notification data and ID
    const notificationData = notification.data || {};
    const notificationId = notificationData.id;
    
    // Mark the notification as read if it has an ID
    if (notificationId) {
      markAsRead(notificationId).catch(error => {
        logger.error('Failed to mark notification as read after opening', {
          component: 'DriverNotificationService',
          notificationId,
          error
        });
      });
    }
    
    // Determine notification type and perform appropriate action
    // This would typically involve navigation in a real app
    const notificationType = notificationData.type;
    
    switch (notificationType) {
      case DriverNotificationType.LOAD_OPPORTUNITY:
        // Navigate to load details screen
        logger.debug('Navigate to load opportunity', {
          component: 'DriverNotificationService',
          loadId: notificationData.loadId
        });
        break;
        
      case DriverNotificationType.LOAD_STATUS:
        // Navigate to active load screen
        logger.debug('Navigate to load status', {
          component: 'DriverNotificationService',
          loadId: notificationData.loadId
        });
        break;
        
      case DriverNotificationType.ACHIEVEMENT:
        // Navigate to achievements screen
        logger.debug('Navigate to achievement', {
          component: 'DriverNotificationService',
          achievementId: notificationData.achievementId
        });
        break;
        
      case DriverNotificationType.BONUS_ZONE:
        // Navigate to map view with bonus zones
        logger.debug('Navigate to bonus zone', {
          component: 'DriverNotificationService',
          zoneId: notificationData.zoneId
        });
        break;
        
      case DriverNotificationType.SMART_HUB:
        // Navigate to smart hub details
        logger.debug('Navigate to smart hub', {
          component: 'DriverNotificationService',
          hubId: notificationData.hubId
        });
        break;
        
      default:
        // For system or unknown notification types
        logger.debug('Unhandled notification type', {
          component: 'DriverNotificationService',
          type: notificationType
        });
    }
  } catch (error) {
    logger.error('Error handling notification open', {
      component: 'DriverNotificationService',
      error
    });
  }
};

// Export all functions as a service object
export default {
  getDriverNotifications,
  getDriverUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getDriverNotificationPreferences,
  updateDriverNotificationPreferences,
  getLocationBasedNotifications,
  subscribeToDriverNotifications,
  getOfflineNotifications,
  syncOfflineNotifications,
  configurePushNotifications,
  registerDeviceForPushNotifications,
  unregisterDeviceForPushNotifications,
  showLocalNotification,
  handleNotificationOpen
};