import { Notification, NotificationPreference } from '../../../common/interfaces';
import { AnyAction } from 'redux';
import {
  GET_NOTIFICATIONS_REQUEST,
  GET_NOTIFICATIONS_SUCCESS,
  GET_NOTIFICATIONS_FAILURE,
  GET_UNREAD_COUNT_REQUEST,
  GET_UNREAD_COUNT_SUCCESS,
  GET_UNREAD_COUNT_FAILURE,
  MARK_AS_READ_REQUEST,
  MARK_AS_READ_SUCCESS,
  MARK_AS_READ_FAILURE,
  MARK_ALL_AS_READ_REQUEST,
  MARK_ALL_AS_READ_SUCCESS,
  MARK_ALL_AS_READ_FAILURE,
  DELETE_NOTIFICATION_REQUEST,
  DELETE_NOTIFICATION_SUCCESS,
  DELETE_NOTIFICATION_FAILURE,
  RECEIVE_NEW_NOTIFICATION,
  UPDATE_NOTIFICATION_READ_STATUS,
  GET_PREFERENCES_REQUEST,
  GET_PREFERENCES_SUCCESS,
  GET_PREFERENCES_FAILURE,
  UPDATE_PREFERENCES_REQUEST,
  UPDATE_PREFERENCES_SUCCESS,
  UPDATE_PREFERENCES_FAILURE
} from '../actions/notificationActions';

/**
 * Interface defining the shape of the notification state in the Redux store
 */
interface NotificationState {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  unreadCount: number;
  preferences: NotificationPreference[];
  loading: boolean;
  loadingUnreadCount: boolean;
  markingAsRead: boolean;
  markingAllAsRead: boolean;
  deletingNotification: boolean;
  loadingPreferences: boolean;
  updatingPreferences: boolean;
  error: string | null;
}

/**
 * Initial state for the notification reducer
 */
const initialState: NotificationState = {
  notifications: [],
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  },
  unreadCount: 0,
  preferences: [],
  loading: false,
  loadingUnreadCount: false,
  markingAsRead: false,
  markingAllAsRead: false,
  deletingNotification: false,
  loadingPreferences: false,
  updatingPreferences: false,
  error: null
};

/**
 * Reducer function that handles notification-related actions and updates the notification state accordingly
 */
const notificationReducer = (state = initialState, action: AnyAction): NotificationState => {
  switch (action.type) {
    // Fetch notifications
    case GET_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case GET_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: action.payload.notifications,
        pagination: action.payload.pagination,
        error: null
      };
    case GET_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Get unread count
    case GET_UNREAD_COUNT_REQUEST:
      return {
        ...state,
        loadingUnreadCount: true,
        error: null
      };
    case GET_UNREAD_COUNT_SUCCESS:
      return {
        ...state,
        loadingUnreadCount: false,
        unreadCount: action.payload,
        error: null
      };
    case GET_UNREAD_COUNT_FAILURE:
      return {
        ...state,
        loadingUnreadCount: false,
        error: action.payload
      };
      
    // Mark as read
    case MARK_AS_READ_REQUEST:
      return {
        ...state,
        markingAsRead: true,
        error: null
      };
    case MARK_AS_READ_SUCCESS:
      return {
        ...state,
        markingAsRead: false,
        notifications: state.notifications.map(notification => 
          notification.id === action.payload ? { ...notification, read: true } : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        error: null
      };
    case MARK_AS_READ_FAILURE:
      return {
        ...state,
        markingAsRead: false,
        error: action.payload
      };
      
    // Mark all as read
    case MARK_ALL_AS_READ_REQUEST:
      return {
        ...state,
        markingAllAsRead: true,
        error: null
      };
    case MARK_ALL_AS_READ_SUCCESS:
      return {
        ...state,
        markingAllAsRead: false,
        notifications: state.notifications.map(notification => ({ ...notification, read: true })),
        unreadCount: 0,
        error: null
      };
    case MARK_ALL_AS_READ_FAILURE:
      return {
        ...state,
        markingAllAsRead: false,
        error: action.payload
      };
      
    // Delete notification
    case DELETE_NOTIFICATION_REQUEST:
      return {
        ...state,
        deletingNotification: true,
        error: null
      };
    case DELETE_NOTIFICATION_SUCCESS:
      const deletedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        deletingNotification: false,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
        unreadCount: deletedNotification && !deletedNotification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
        error: null
      };
    case DELETE_NOTIFICATION_FAILURE:
      return {
        ...state,
        deletingNotification: false,
        error: action.payload
      };
      
    // Real-time notification updates
    case RECEIVE_NEW_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case UPDATE_NOTIFICATION_READ_STATUS:
      const { notificationId, read } = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      const wasRead = notification ? notification.read : false;
      
      return {
        ...state,
        notifications: state.notifications.map(notification => 
          notification.id === notificationId
            ? { ...notification, read }
            : notification
        ),
        unreadCount: wasRead && !read
          ? state.unreadCount + 1
          : !wasRead && read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
      };
      
    // Notification preferences
    case GET_PREFERENCES_REQUEST:
      return {
        ...state,
        loadingPreferences: true,
        error: null
      };
    case GET_PREFERENCES_SUCCESS:
      return {
        ...state,
        loadingPreferences: false,
        preferences: action.payload,
        error: null
      };
    case GET_PREFERENCES_FAILURE:
      return {
        ...state,
        loadingPreferences: false,
        error: action.payload
      };
      
    case UPDATE_PREFERENCES_REQUEST:
      return {
        ...state,
        updatingPreferences: true,
        error: null
      };
    case UPDATE_PREFERENCES_SUCCESS:
      return {
        ...state,
        updatingPreferences: false,
        preferences: action.payload,
        error: null
      };
    case UPDATE_PREFERENCES_FAILURE:
      return {
        ...state,
        updatingPreferences: false,
        error: action.payload
      };
      
    default:
      return state;
  }
};

export default notificationReducer;