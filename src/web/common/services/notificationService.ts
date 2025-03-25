/**
 * Notification Service
 * 
 * Provides functionality for managing notifications in the AI-driven Freight Optimization Platform.
 * Handles fetching notifications, tracking read status, managing notification preferences,
 * and enabling real-time notification updates through WebSocket connections.
 */

import { io, Socket } from 'socket.io-client'; // ^4.7.1

import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../constants/endpoints';
import { 
  Notification, 
  NotificationQueryOptions, 
  NotificationResponse, 
  NotificationPreference,
  NotificationPreferenceUpdate
} from '../interfaces/tracking.interface';
import logger from '../utils/logger';

// WebSocket endpoint for real-time notification updates
const NOTIFICATION_SOCKET_URL = 'wss://api.freightoptimization.com/notifications';

/**
 * Fetches notifications for the current user with optional filtering and pagination
 * @param options Filtering and pagination options
 * @returns Promise with paginated notifications and total count
 */
const getNotifications = async (options: NotificationQueryOptions = {}): Promise<NotificationResponse> => {
  try {
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
    
    // Make GET request to notifications endpoint with query parameters
    const url = `${API_ENDPOINTS.NOTIFICATIONS}?${queryParams.toString()}`;
    const response = await apiClient.get<NotificationResponse>(url);
    
    logger.debug('Fetched notifications', {
      component: 'NotificationService',
      count: response.data.notifications.length,
      total: response.data.total
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch notifications', {
      component: 'NotificationService',
      error
    });
    throw error;
  }
};

/**
 * Fetches the count of unread notifications for the current user
 * @returns Promise with the count of unread notifications
 */
const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get<{ count: number }>(`${API_ENDPOINTS.NOTIFICATIONS}/unread`);
    
    logger.debug('Fetched unread notification count', {
      component: 'NotificationService',
      count: response.data.count
    });
    
    return response.data.count;
  } catch (error) {
    logger.error('Failed to fetch unread notification count', {
      component: 'NotificationService',
      error
    });
    throw error;
  }
};

/**
 * Marks a specific notification as read
 * @param notificationId ID of the notification to mark as read
 * @returns Promise that resolves when the operation completes
 */
const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    await apiClient.put(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`);
    
    logger.debug('Marked notification as read', {
      component: 'NotificationService',
      notificationId
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', {
      component: 'NotificationService',
      notificationId,
      error
    });
    throw error;
  }
};

/**
 * Marks all notifications for the current user as read
 * @returns Promise that resolves when the operation completes
 */
const markAllAsRead = async (): Promise<void> => {
  try {
    await apiClient.put(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`);
    
    logger.debug('Marked all notifications as read', {
      component: 'NotificationService'
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', {
      component: 'NotificationService',
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
    await apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}`);
    
    logger.debug('Deleted notification', {
      component: 'NotificationService',
      notificationId
    });
  } catch (error) {
    logger.error('Failed to delete notification', {
      component: 'NotificationService',
      notificationId,
      error
    });
    throw error;
  }
};

/**
 * Fetches notification preferences for the current user
 * @returns Promise with the user's notification preferences
 */
const getUserPreferences = async (): Promise<NotificationPreference[]> => {
  try {
    const response = await apiClient.get<NotificationPreference[]>(API_ENDPOINTS.NOTIFICATION_PREFERENCES);
    
    logger.debug('Fetched notification preferences', {
      component: 'NotificationService',
      preferencesCount: response.data.length
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch notification preferences', {
      component: 'NotificationService',
      error
    });
    throw error;
  }
};

/**
 * Updates notification preferences for the current user
 * @param preferences Updated notification preferences
 * @returns Promise with the updated notification preferences
 */
const updateUserPreferences = async (preferences: NotificationPreferenceUpdate): Promise<NotificationPreference[]> => {
  try {
    const response = await apiClient.put<NotificationPreference[]>(
      API_ENDPOINTS.NOTIFICATION_PREFERENCES,
      preferences
    );
    
    logger.debug('Updated notification preferences', {
      component: 'NotificationService'
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to update notification preferences', {
      component: 'NotificationService',
      error
    });
    throw error;
  }
};

/**
 * Establishes a WebSocket connection to receive real-time notification updates
 * @param onNotification Callback function to handle incoming notifications
 * @returns Unsubscribe function to close the connection
 */
const subscribeToNotifications = (onNotification: (notification: Notification) => void): () => void => {
  let socket: Socket | null = null;
  
  try {
    // Create socket.io connection to the notification WebSocket endpoint
    socket = io(NOTIFICATION_SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    // Set up event handlers for connection states
    socket.on('connect', () => {
      logger.info('Connected to notification WebSocket', {
        component: 'NotificationService',
        socketId: socket?.id
      });
    });
    
    socket.on('disconnect', (reason) => {
      logger.info('Disconnected from notification WebSocket', {
        component: 'NotificationService',
        reason
      });
    });
    
    socket.on('connect_error', (error) => {
      logger.error('Failed to connect to notification WebSocket', {
        component: 'NotificationService',
        error
      });
    });
    
    socket.on('reconnect', (attemptNumber) => {
      logger.info('Reconnected to notification WebSocket', {
        component: 'NotificationService',
        attemptNumber
      });
    });
    
    socket.on('reconnect_error', (error) => {
      logger.error('Failed to reconnect to notification WebSocket', {
        component: 'NotificationService',
        error
      });
    });
    
    // Listen for 'notification' events
    socket.on('notification', (data: Notification) => {
      logger.debug('Received notification via WebSocket', {
        component: 'NotificationService',
        notificationId: data.id,
        type: data.type
      });
      
      // Call the provided callback with the notification data
      onNotification(data);
    });
    
    // Return an unsubscribe function that closes the socket connection
    return () => {
      if (socket) {
        logger.info('Closing notification WebSocket connection', {
          component: 'NotificationService'
        });
        socket.disconnect();
        socket = null;
      }
    };
  } catch (error) {
    logger.error('Error in notification subscription', {
      component: 'NotificationService',
      error
    });
    
    // Return a no-op unsubscribe function in case of errors
    return () => {};
  }
};

/**
 * Sends a test notification (for development and testing purposes)
 * @param data Test notification data including type, title, and message
 * @returns Promise that resolves when the operation completes
 */
const sendTestNotification = async (data: { type: string; title: string; message: string }): Promise<void> => {
  try {
    await apiClient.post(`${API_ENDPOINTS.NOTIFICATIONS}/test`, data);
    
    logger.debug('Sent test notification', {
      component: 'NotificationService',
      type: data.type,
      title: data.title
    });
  } catch (error) {
    logger.error('Failed to send test notification', {
      component: 'NotificationService',
      error
    });
    throw error;
  }
};

// Export all functions as a service object
export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserPreferences,
  updateUserPreferences,
  subscribeToNotifications,
  sendTestNotification
};