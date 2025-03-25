import React, { createContext, useContext, ReactNode } from 'react'; // ^18.2.0
import useNotification from '../hooks/useNotification';
import { Notification, NotificationPreference } from '../interfaces/tracking.interface';
import logger from '../utils/logger';

/**
 * Interface defining the notification context type
 */
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  preferences: NotificationPreference[];
  fetchNotifications: (options?: any) => void;
  fetchUnreadCount: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  fetchPreferences: () => void;
  updatePreferences: (preferences: any) => void;
  showNotification: (notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; title?: string; duration?: number }) => void;
  dismissNotification: (id: string) => void;
}

/**
 * Props for the NotificationProvider component
 */
interface NotificationProviderProps {
  children: ReactNode;
}

// LD1: Create the notification context with a default value of null
const NotificationContext = createContext<NotificationContextType | null>(null);

// LD1: Define the initial notification state
const initialNotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  preferences: [],
};

/**
 * Notification context provider component that wraps the application and provides notification state and functions
 * @param { children }: { children: ReactNode } - React children components to be wrapped by the provider
 * @returns {JSX.Element} The provider component with children
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // LD1: Use the useNotification hook to get notification state and functions
  const {
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
  } = useNotification();

  // LD1: Create a context value object with notification state and functions
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
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

  // LD1: Log notification state changes when debugging
  if (process.env.NODE_ENV === 'development') {
    logger.debug('NotificationContext state updated', {
      notifications: notifications.length,
      unreadCount,
      loading,
      error,
      preferences: preferences.length,
    });
  }

  // LD1: Return the NotificationContext.Provider with the context value and children
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to use the notification context in components
 * @returns {NotificationContextType} Notification context with state and functions
 */
export const useNotificationContext = (): NotificationContextType => {
  // LD1: Get the context using React's useContext hook
  const context = useContext(NotificationContext);

  // LD1: Throw an error if the hook is used outside of a NotificationProvider
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }

  // LD1: Return the notification context
  return context;
};

// IE3: Export the notification context for direct access if needed
export { NotificationContext };

// IE3: Export the notification provider component for wrapping the application
// Export the notification context hook for use in components