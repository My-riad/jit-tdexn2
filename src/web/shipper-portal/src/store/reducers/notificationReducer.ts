import * as actionTypes from '../actions/notificationActions';
import { Notification, NotificationPreference } from '../../../common/interfaces';
import { AnyAction } from 'redux';

/**
 * Interface defining the structure of the notification state in the Redux store
 */
export interface NotificationState {
  loading: boolean;
  loadingUnreadCount: boolean;
  markingAsRead: boolean;
  markingAllAsRead: boolean;
  deleting: boolean;
  subscribing: boolean;
  loadingPreferences: boolean;
  updatingPreferences: boolean;
  notifications: Array<Notification>;
  unreadCount: number;
  totalNotifications: number;
  currentPage: number;
  pageSize: number;
  unsubscribeFunction: Function | null;
  preferences: Array<NotificationPreference>;
  error: Error | null;
  unreadCountError: Error | null;
  markAsReadError: Error | null;
  markAllAsReadError: Error | null;
  deleteError: Error | null;
  subscribeError: Error | null;
  preferencesError: Error | null;
  updatePreferencesError: Error | null;
}

/**
 * Initial state for the notification reducer
 */
const initialState: NotificationState = {
  loading: false,
  loadingUnreadCount: false,
  markingAsRead: false,
  markingAllAsRead: false,
  deleting: false,
  subscribing: false,
  loadingPreferences: false,
  updatingPreferences: false,
  notifications: [],
  unreadCount: 0,
  totalNotifications: 0,
  currentPage: 1,
  pageSize: 10,
  unsubscribeFunction: null,
  preferences: [],
  error: null,
  unreadCountError: null,
  markAsReadError: null,
  markAllAsReadError: null,
  deleteError: null,
  subscribeError: null,
  preferencesError: null,
  updatePreferencesError: null
};

/**
 * Redux reducer function that handles state updates for notification-related actions
 * 
 * @param state Current state or initialState if undefined
 * @param action Action dispatched to the reducer
 * @returns Updated notification state
 */
const notificationReducer = (
  state: NotificationState = initialState,
  action: AnyAction
): NotificationState => {
  switch (action.type) {
    // Fetch notifications
    case actionTypes.FETCH_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case actionTypes.FETCH_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: action.payload.notifications,
        totalNotifications: action.payload.pagination.total,
        currentPage: action.payload.pagination.page,
        pageSize: action.payload.pagination.limit
      };
    case actionTypes.FETCH_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Fetch unread count
    case actionTypes.FETCH_UNREAD_COUNT_REQUEST:
      return {
        ...state,
        loadingUnreadCount: true,
        unreadCountError: null
      };
    case actionTypes.FETCH_UNREAD_COUNT_SUCCESS:
      return {
        ...state,
        loadingUnreadCount: false,
        unreadCount: action.payload
      };
    case actionTypes.FETCH_UNREAD_COUNT_FAILURE:
      return {
        ...state,
        loadingUnreadCount: false,
        unreadCountError: action.payload
      };

    // Mark notification as read
    case actionTypes.MARK_NOTIFICATION_READ_REQUEST:
      return {
        ...state,
        markingAsRead: true,
        markAsReadError: null
      };
    case actionTypes.MARK_NOTIFICATION_READ_SUCCESS:
      return {
        ...state,
        markingAsRead: false,
        notifications: state.notifications.map(notification => 
          notification.id === action.payload 
            ? { ...notification, read: true } 
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case actionTypes.MARK_NOTIFICATION_READ_FAILURE:
      return {
        ...state,
        markingAsRead: false,
        markAsReadError: action.payload
      };

    // Mark all notifications as read
    case actionTypes.MARK_ALL_NOTIFICATIONS_READ_REQUEST:
      return {
        ...state,
        markingAllAsRead: true,
        markAllAsReadError: null
      };
    case actionTypes.MARK_ALL_NOTIFICATIONS_READ_SUCCESS:
      return {
        ...state,
        markingAllAsRead: false,
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true
        })),
        unreadCount: 0
      };
    case actionTypes.MARK_ALL_NOTIFICATIONS_READ_FAILURE:
      return {
        ...state,
        markingAllAsRead: false,
        markAllAsReadError: action.payload
      };

    // Delete notification
    case actionTypes.DELETE_NOTIFICATION_REQUEST:
      return {
        ...state,
        deleting: true,
        deleteError: null
      };
    case actionTypes.DELETE_NOTIFICATION_SUCCESS:
      return {
        ...state,
        deleting: false,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
        totalNotifications: state.totalNotifications - 1,
        // Reduce unread count if the deleted notification was unread
        unreadCount: state.notifications.some(
          n => n.id === action.payload && !n.read
        )
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount
      };
    case actionTypes.DELETE_NOTIFICATION_FAILURE:
      return {
        ...state,
        deleting: false,
        deleteError: action.payload
      };

    // Real-time notification subscription
    case actionTypes.SUBSCRIBE_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        subscribing: true,
        subscribeError: null
      };
    case actionTypes.SUBSCRIBE_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        subscribing: false,
        unsubscribeFunction: action.payload
      };
    case actionTypes.SUBSCRIBE_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        subscribing: false,
        subscribeError: action.payload
      };
    case actionTypes.UNSUBSCRIBE_NOTIFICATIONS:
      return {
        ...state,
        unsubscribeFunction: null
      };

    // Real-time notification events
    case actionTypes.NOTIFICATION_RECEIVED:
      // Add new notification if it doesn't already exist
      if (!state.notifications.some(n => n.id === action.payload.id)) {
        return {
          ...state,
          notifications: [action.payload, ...state.notifications],
          unreadCount: state.unreadCount + 1,
          totalNotifications: state.totalNotifications + 1
        };
      }
      return state;
      
    case actionTypes.NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => 
          notification.id === action.payload.notificationId 
            ? { ...notification, read: action.payload.read } 
            : notification
        ),
        // Update unread count if marking as read
        unreadCount: action.payload.read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount
      };

    // Notification preferences
    case actionTypes.FETCH_NOTIFICATION_PREFERENCES_REQUEST:
      return {
        ...state,
        loadingPreferences: true,
        preferencesError: null
      };
    case actionTypes.FETCH_NOTIFICATION_PREFERENCES_SUCCESS:
      return {
        ...state,
        loadingPreferences: false,
        preferences: action.payload
      };
    case actionTypes.FETCH_NOTIFICATION_PREFERENCES_FAILURE:
      return {
        ...state,
        loadingPreferences: false,
        preferencesError: action.payload
      };

    case actionTypes.UPDATE_NOTIFICATION_PREFERENCES_REQUEST:
      return {
        ...state,
        updatingPreferences: true,
        updatePreferencesError: null
      };
    case actionTypes.UPDATE_NOTIFICATION_PREFERENCES_SUCCESS:
      return {
        ...state,
        updatingPreferences: false,
        preferences: action.payload
      };
    case actionTypes.UPDATE_NOTIFICATION_PREFERENCES_FAILURE:
      return {
        ...state,
        updatingPreferences: false,
        updatePreferencesError: action.payload
      };

    default:
      return state;
  }
};

export default notificationReducer;