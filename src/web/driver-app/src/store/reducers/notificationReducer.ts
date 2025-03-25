import {
  Notification,
  NotificationPreference,
} from '../../../common/interfaces/tracking.interface';
import { DriverNotificationType } from '../../services/notificationService'; // DriverNotificationType
import {
  FETCH_NOTIFICATIONS_FAILURE,
  FETCH_NOTIFICATIONS_REQUEST,
  FETCH_NOTIFICATIONS_SUCCESS,
  FETCH_UNREAD_COUNT_REQUEST,
  FETCH_UNREAD_COUNT_SUCCESS,
  FETCH_UNREAD_COUNT_FAILURE,
  MARK_NOTIFICATION_READ_REQUEST,
  MARK_NOTIFICATION_READ_SUCCESS,
  MARK_NOTIFICATION_READ_FAILURE,
  MARK_ALL_NOTIFICATIONS_READ_REQUEST,
  MARK_ALL_NOTIFICATIONS_READ_SUCCESS,
  MARK_ALL_NOTIFICATIONS_READ_FAILURE,
  DELETE_NOTIFICATION_REQUEST,
  DELETE_NOTIFICATION_SUCCESS,
  DELETE_NOTIFICATION_FAILURE,
  FETCH_NOTIFICATION_PREFERENCES_REQUEST,
  FETCH_NOTIFICATION_PREFERENCES_SUCCESS,
  FETCH_NOTIFICATION_PREFERENCES_FAILURE,
  UPDATE_NOTIFICATION_PREFERENCES_REQUEST,
  UPDATE_NOTIFICATION_PREFERENCES_SUCCESS,
  UPDATE_NOTIFICATION_PREFERENCES_FAILURE,
  FETCH_LOCATION_NOTIFICATIONS_REQUEST,
  FETCH_LOCATION_NOTIFICATIONS_SUCCESS,
  FETCH_LOCATION_NOTIFICATIONS_FAILURE,
  SYNC_OFFLINE_NOTIFICATIONS_REQUEST,
  SYNC_OFFLINE_NOTIFICATIONS_SUCCESS,
  SYNC_OFFLINE_NOTIFICATIONS_FAILURE,
  SUBSCRIBE_NOTIFICATIONS_REQUEST,
  SUBSCRIBE_NOTIFICATIONS_SUCCESS,
  SUBSCRIBE_NOTIFICATIONS_FAILURE,
  NEW_NOTIFICATION,
  NOTIFICATION_READ,
  NotificationActionTypes,
  NotificationAction,
} from '../actions/notificationActions';

/**
 * @interface NotificationState
 * @description Interface defining the structure of the notification state in the Redux store
 */
export interface NotificationState {
  /**
   * @member notifications
   * @member_type Notification[]
   * @export_type named
   * @description Array of notifications
   */
  notifications: Notification[];
  /**
   * @member unreadCount
   * @member_type number
   * @export_type named
   * @description Number of unread notifications
   */
  unreadCount: number;
  /**
   * @member preferences
   * @member_type NotificationPreference[]
   * @export_type named
   * @description Array of notification preferences
   */
  preferences: NotificationPreference[];
  /**
   * @member locationNotifications
   * @member_type Notification[]
   * @export_type named
   * @description Array of location-based notifications
   */
  locationNotifications: Notification[];
  /**
   * @member loading
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if notifications are currently being fetched
   */
  loading: boolean;
  /**
   * @member loadingUnreadCount
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if the unread count is currently being fetched
   */
  loadingUnreadCount: boolean;
  /**
   * @member markingAsRead
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if a notification is currently being marked as read
   */
  markingAsRead: boolean;
  /**
   * @member markingAllAsRead
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if all notifications are currently being marked as read
   */
  markingAllAsRead: boolean;
  /**
   * @member deletingNotification
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if a notification is currently being deleted
   */
  deletingNotification: boolean;
  /**
   * @member loadingPreferences
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if notification preferences are currently being fetched
   */
  loadingPreferences: boolean;
  /**
   * @member updatingPreferences
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if notification preferences are currently being updated
   */
  updatingPreferences: boolean;
  /**
   * @member loadingLocationNotifications
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if location-based notifications are currently being fetched
   */
  loadingLocationNotifications: boolean;
  /**
   * @member syncing
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if offline notifications are currently being synced
   */
  syncing: boolean;
  /**
   * @member subscribing
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if the app is currently subscribing to real-time updates
   */
  subscribing: boolean;
    /**
   * @member isSubscribed
   * @member_type boolean
   * @export_type named
   * @description Boolean indicating if the app is currently subscribed to real-time updates
   */
  isSubscribed: boolean;
  /**
   * @member lastSyncTime
   * @member_type string | null
   * @export_type named
   * @description Timestamp of the last successful sync of offline notifications
   */
  lastSyncTime: string | null;
  /**
   * @member error
   * @member_type string | null
   * @export_type named
   * @description Error message if any operation fails
   */
  error: string | null;
}

// Initial state for the notification reducer
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  preferences: [],
  locationNotifications: [],
  loading: false,
  loadingUnreadCount: false,
  markingAsRead: false,
  markingAllAsRead: false,
  deletingNotification: false,
  loadingPreferences: false,
  updatingPreferences: false,
  loadingLocationNotifications: false,
  syncing: false,
  subscribing: false,
  isSubscribed: false,
  lastSyncTime: null,
  error: null,
};

/**
 * @function notificationReducer
 * @description Redux reducer function that handles state updates for notification-related actions
 * @param {NotificationState | undefined} state - The current state of the notification state.
 * @param {NotificationAction} action - The action dispatched to the reducer.
 * @returns {NotificationState} Updated notification state
 * @export_type default
 */
const notificationReducer = (
  state: NotificationState = initialState,
  action: NotificationAction
): NotificationState => {
  // Initialize state with default values if undefined
  switch (action.type) {
    // Use switch statement to handle different action types

    // Handle FETCH_NOTIFICATIONS_REQUEST action
    case FETCH_NOTIFICATIONS_REQUEST:
      // Set loading to true and clear any errors
      return { ...state, loading: true, error: null };

    // Handle FETCH_NOTIFICATIONS_SUCCESS action
    case FETCH_NOTIFICATIONS_SUCCESS:
      // Update notifications array and set loading to false
      return {
        ...state,
        notifications: action.payload.notifications,
        loading: false,
      };

    // Handle FETCH_NOTIFICATIONS_FAILURE action
    case FETCH_NOTIFICATIONS_FAILURE:
      // Set error message and loading to false
      return { ...state, error: action.payload, loading: false };

    // Handle FETCH_UNREAD_COUNT_REQUEST action
    case FETCH_UNREAD_COUNT_REQUEST:
      // Set loadingUnreadCount to true
      return { ...state, loadingUnreadCount: true };

    // Handle FETCH_UNREAD_COUNT_SUCCESS action
    case FETCH_UNREAD_COUNT_SUCCESS:
      // Update unreadCount and set loadingUnreadCount to false
      return { ...state, unreadCount: action.payload, loadingUnreadCount: false };

    // Handle FETCH_UNREAD_COUNT_FAILURE action
    case FETCH_UNREAD_COUNT_FAILURE:
      // Set error message and loadingUnreadCount to false
      return { ...state, error: action.payload, loadingUnreadCount: false };

    // Handle MARK_NOTIFICATION_READ_REQUEST action
    case MARK_NOTIFICATION_READ_REQUEST:
      // Set markingAsRead to true
      return { ...state, markingAsRead: true };

    // Handle MARK_NOTIFICATION_READ_SUCCESS action
    case MARK_NOTIFICATION_READ_SUCCESS:
      // Update notification read status and decrement unreadCount
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload ? { ...notification, read: true } : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        markingAsRead: false,
      };

    // Handle MARK_NOTIFICATION_READ_FAILURE action
    case MARK_NOTIFICATION_READ_FAILURE:
      // Set error message and markingAsRead to false
      return { ...state, error: action.payload, markingAsRead: false };

    // Handle MARK_ALL_NOTIFICATIONS_READ_REQUEST action
    case MARK_ALL_NOTIFICATIONS_READ_REQUEST:
      // Set markingAllAsRead to true
      return { ...state, markingAllAsRead: true };

    // Handle MARK_ALL_NOTIFICATIONS_READ_SUCCESS action
    case MARK_ALL_NOTIFICATIONS_READ_SUCCESS:
      // Mark all notifications as read and set unreadCount to 0
      return {
        ...state,
        notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
        unreadCount: 0,
        markingAllAsRead: false,
      };

    // Handle MARK_ALL_NOTIFICATIONS_READ_FAILURE action
    case MARK_ALL_NOTIFICATIONS_READ_FAILURE:
      // Set error message and markingAllAsRead to false
      return { ...state, error: action.payload, markingAllAsRead: false };

    // Handle DELETE_NOTIFICATION_REQUEST action
    case DELETE_NOTIFICATION_REQUEST:
      // Set deletingNotification to true
      return { ...state, deletingNotification: true };

    // Handle DELETE_NOTIFICATION_SUCCESS action
    case DELETE_NOTIFICATION_SUCCESS:
      // Remove deleted notification from state
      return {
        ...state,
        notifications: state.notifications.filter((notification) => notification.id !== action.payload),
        deletingNotification: false,
      };

    // Handle DELETE_NOTIFICATION_FAILURE action
    case DELETE_NOTIFICATION_FAILURE:
      // Set error message and deletingNotification to false
      return { ...state, error: action.payload, deletingNotification: false };

    // Handle FETCH_NOTIFICATION_PREFERENCES_REQUEST action
    case FETCH_NOTIFICATION_PREFERENCES_REQUEST:
      // Set loadingPreferences to true
      return { ...state, loadingPreferences: true, error: null };

    // Handle FETCH_NOTIFICATION_PREFERENCES_SUCCESS action
    case FETCH_NOTIFICATION_PREFERENCES_SUCCESS:
      // Update preferences and set loadingPreferences to false
      return { ...state, preferences: action.payload, loadingPreferences: false };

    // Handle FETCH_NOTIFICATION_PREFERENCES_FAILURE action
    case FETCH_NOTIFICATION_PREFERENCES_FAILURE:
      // Set error message and loadingPreferences to false
      return { ...state, error: action.payload, loadingPreferences: false };

    // Handle UPDATE_NOTIFICATION_PREFERENCES_REQUEST action
    case UPDATE_NOTIFICATION_PREFERENCES_REQUEST:
      // Set updatingPreferences to true
      return { ...state, updatingPreferences: true, error: null };

    // Handle UPDATE_NOTIFICATION_PREFERENCES_SUCCESS action
    case UPDATE_NOTIFICATION_PREFERENCES_SUCCESS:
      // Update preferences and set updatingPreferences to false
      return { ...state, preferences: action.payload, updatingPreferences: false };

    // Handle UPDATE_NOTIFICATION_PREFERENCES_FAILURE action
    case UPDATE_NOTIFICATION_PREFERENCES_FAILURE:
      // Set error message and updatingPreferences to false
      return { ...state, error: action.payload, updatingPreferences: false };

    // Handle FETCH_LOCATION_NOTIFICATIONS_REQUEST action
    case FETCH_LOCATION_NOTIFICATIONS_REQUEST:
      // Set loadingLocationNotifications to true
      return { ...state, loadingLocationNotifications: true, error: null };

    // Handle FETCH_LOCATION_NOTIFICATIONS_SUCCESS action
    case FETCH_LOCATION_NOTIFICATIONS_SUCCESS:
      // Update locationNotifications and set loadingLocationNotifications to false
      return {
        ...state,
        locationNotifications: action.payload,
        loadingLocationNotifications: false,
      };

    // Handle FETCH_LOCATION_NOTIFICATIONS_FAILURE action
    case FETCH_LOCATION_NOTIFICATIONS_FAILURE:
      // Set error message and loadingLocationNotifications to false
      return { ...state, error: action.payload, loadingLocationNotifications: false };

    // Handle SYNC_OFFLINE_NOTIFICATIONS_REQUEST action
    case SYNC_OFFLINE_NOTIFICATIONS_REQUEST:
      // Set syncing to true
      return { ...state, syncing: true, error: null };

    // Handle SYNC_OFFLINE_NOTIFICATIONS_SUCCESS action
    case SYNC_OFFLINE_NOTIFICATIONS_SUCCESS:
      // Update sync status and set syncing to false
      return {
        ...state,
        syncing: false,
        lastSyncTime: new Date().toISOString(),
      };

    // Handle SYNC_OFFLINE_NOTIFICATIONS_FAILURE action
    case SYNC_OFFLINE_NOTIFICATIONS_FAILURE:
      // Set error message and syncing to false
      return { ...state, error: action.payload, syncing: false };
      
    // Handle SUBSCRIBE_NOTIFICATIONS_REQUEST action
    case SUBSCRIBE_NOTIFICATIONS_REQUEST:
      // Set subscribing to true
      return { ...state, subscribing: true, error: null };

    // Handle SUBSCRIBE_NOTIFICATIONS_SUCCESS action
    case SUBSCRIBE_NOTIFICATIONS_SUCCESS:
      // Update subscription status and set subscribing to false
      return {
        ...state,
        subscribing: false,
        isSubscribed: true,
      };

    // Handle SUBSCRIBE_NOTIFICATIONS_FAILURE action
    case SUBSCRIBE_NOTIFICATIONS_FAILURE:
      // Set error message and subscribing to false
      return { ...state, error: action.payload, subscribing: false, isSubscribed: false };

    // Handle NEW_NOTIFICATION action
    case NEW_NOTIFICATION:
      // Add new notification to state and increment unreadCount
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };

    // Handle NOTIFICATION_READ action
    case NOTIFICATION_READ:
      // Update notification read status from external source
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload ? { ...notification, read: true } : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    // Return the updated state or original state if no changes
    default:
      return state;
  }
};

/**
 * @export_type default
 * @description Default export of the notification reducer function for use in the root reducer
 */
export default notificationReducer;