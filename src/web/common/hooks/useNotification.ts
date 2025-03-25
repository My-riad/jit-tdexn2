import { useState, useEffect, useCallback, useRef } from 'react'; // ^18.2.0
import notificationService from '../services/notificationService';
import { Notification, NotificationQueryOptions, NotificationPreference, NotificationPreferenceUpdate } from '../interfaces/tracking.interface';
import { NotificationContainer } from '../../shared/components/feedback/NotificationToast';
import logger from '../utils/logger';

/**
 * Interface defining the return type of the useNotification hook
 */
interface UseNotificationResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  pagination: { total: number; page: number; limit: number; totalPages: number };
  preferences: NotificationPreference[];
  fetchNotifications: (options?: NotificationQueryOptions) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: NotificationPreferenceUpdate) => Promise<void>;
  showNotification: (notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; title?: string; duration?: number }) => void;
  dismissNotification: (id: string) => void;
}

/**
 * Interface defining the structure of a temporary toast notification
 */
interface ToastNotification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  duration?: number;
}

/**
 * Custom hook that provides notification functionality for the application
 * @returns Object containing notification state and methods
 */
const useNotification = (): UseNotificationResult => {
  // LD1: Initialize state for notifications, loading, error, unread count, pagination, and preferences
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  // LD1: Create a reference to the notification container component
  const notificationContainerRef = useRef<NotificationContainer>(null);

  // LD1: Implement fetchNotifications function to get notifications with optional filtering
  const fetchNotifications = useCallback(async (options?: NotificationQueryOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.getNotifications(options);
      setNotifications(response.notifications);
      setPagination({
        total: response.total,
        page: options?.page || 1,
        limit: options?.limit || 10,
        totalPages: Math.ceil(response.total / (options?.limit || 10)),
      });
      logger.info('Notifications fetched successfully', { component: 'useNotification' });
    } catch (err: any) {
      setError(err);
      logger.error('Failed to fetch notifications', { component: 'useNotification', error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  // LD1: Implement fetchUnreadCount function to get the count of unread notifications
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      logger.info('Unread notification count fetched successfully', { component: 'useNotification' });
    } catch (err: any) {
      setError(err);
      logger.error('Failed to fetch unread notification count', { component: 'useNotification', error: err });
    }
  }, []);

  // LD1: Implement markAsRead function to mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      logger.info(`Notification ${notificationId} marked as read`, { component: 'useNotification' });
    } catch (err: any) {
      setError(err);
      logger.error(`Failed to mark notification ${notificationId} as read`, {
        component: 'useNotification',
        notificationId,
        error: err,
      });
    }
  }, []);

  // LD1: Implement markAllAsRead function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
      logger.info('All notifications marked as read', { component: 'useNotification' });
    } catch (err: any) {
      setError(err);
      logger.error('Failed to mark all notifications as read', { component: 'useNotification', error: err });
    }
  }, []);

  // LD1: Implement deleteNotification function to delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      logger.info(`Notification ${notificationId} deleted`, { component: 'useNotification' });
    } catch (err: any) {
      setError(err);
      logger.error(`Failed to delete notification ${notificationId}`, {
        component: 'useNotification',
        notificationId,
        error: err,
      });
    }
  }, []);

  // LD1: Implement fetchPreferences function to get user notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const prefs = await notificationService.getUserPreferences();
      setPreferences(prefs);
      logger.info('Notification preferences fetched successfully', { component: 'useNotification' });
    } catch (err: any) {
      setError(err);
      logger.error('Failed to fetch notification preferences', { component: 'useNotification', error: err });
    }
  }, []);

  // LD1: Implement updatePreferences function to update user notification preferences
  const updatePreferences = useCallback(async (preferencesUpdate: NotificationPreferenceUpdate) => {
    try {
      const updatedPrefs = await notificationService.updateUserPreferences(preferencesUpdate);
      setPreferences(updatedPrefs);
      logger.info('Notification preferences updated successfully', { component: 'useNotification' });
    } catch (err: any) {
      setError(err);
      logger.error('Failed to update notification preferences', { component: 'useNotification', error: err });
    }
  }, []);

  // LD1: Implement showNotification function to display a temporary toast notification
  const showNotification = useCallback((notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; title?: string; duration?: number }) => {
    if (notificationContainerRef.current && notificationContainerRef.current.showNotification) {
      notificationContainerRef.current.showNotification(notification);
    } else {
      logger.warn('NotificationContainer not available, cannot show notification', {
        component: 'useNotification',
        notification,
      });
    }
  }, []);

  // LD1: Implement dismissNotification function to dismiss a temporary toast notification
  const dismissNotification = useCallback((id: string) => {
    if (notificationContainerRef.current && notificationContainerRef.current.dismissNotification) {
      notificationContainerRef.current.dismissNotification(id);
    } else {
      logger.warn('NotificationContainer not available, cannot dismiss notification', {
        component: 'useNotification',
        notificationId: id,
      });
    }
  }, []);

  // LD1: Set up WebSocket subscription for real-time notification updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToNotifications(notification => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      showNotification({
        type: notification.type === 'success' ? 'success' : notification.type === 'error' ? 'error' : 'info',
        message: notification.message,
        title: notification.title,
      });
    });

    // LD1: Clean up WebSocket subscription on component unmount
    return () => {
      unsubscribe();
      logger.info('Notification WebSocket unsubscribed', { component: 'useNotification' });
    };
  }, [showNotification]);

  // LD1: Return an object with all notification state and methods
  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    preferences,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    showNotification,
    dismissNotification,
  };
};

// IE3: Export the useNotification hook as the default export
export default useNotification;