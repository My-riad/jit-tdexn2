import {
  Notification,
  NotificationPreference,
  NotificationQueryOptions,
  NotificationPreferenceUpdate,
} from '../../../common/interfaces/tracking.interface';
import { DriverNotificationType } from '../../services/notificationService';
import notificationService from '../../services/notificationService';
import { ThunkAction, ThunkDispatch } from 'redux-thunk'; // redux-thunk ^2.4.2
import { Action } from 'redux'; // redux ^4.2.1

// Action type constants
export const FETCH_NOTIFICATIONS_REQUEST = 'FETCH_NOTIFICATIONS_REQUEST';
export const FETCH_NOTIFICATIONS_SUCCESS = 'FETCH_NOTIFICATIONS_SUCCESS';
export const FETCH_NOTIFICATIONS_FAILURE = 'FETCH_NOTIFICATIONS_FAILURE';

export const FETCH_UNREAD_COUNT_REQUEST = 'FETCH_UNREAD_COUNT_REQUEST';
export const FETCH_UNREAD_COUNT_SUCCESS = 'FETCH_UNREAD_COUNT_SUCCESS';
export const FETCH_UNREAD_COUNT_FAILURE = 'FETCH_UNREAD_COUNT_FAILURE';

export const MARK_NOTIFICATION_READ_REQUEST = 'MARK_NOTIFICATION_READ_REQUEST';
export const MARK_NOTIFICATION_READ_SUCCESS = 'MARK_NOTIFICATION_READ_SUCCESS';
export const MARK_NOTIFICATION_READ_FAILURE = 'MARK_NOTIFICATION_READ_FAILURE';

export const MARK_ALL_NOTIFICATIONS_READ_REQUEST = 'MARK_ALL_NOTIFICATIONS_READ_REQUEST';
export const MARK_ALL_NOTIFICATIONS_READ_SUCCESS = 'MARK_ALL_NOTIFICATIONS_READ_SUCCESS';
export const MARK_ALL_NOTIFICATIONS_READ_FAILURE = 'MARK_ALL_NOTIFICATIONS_READ_FAILURE';

export const DELETE_NOTIFICATION_REQUEST = 'DELETE_NOTIFICATION_REQUEST';
export const DELETE_NOTIFICATION_SUCCESS = 'DELETE_NOTIFICATION_SUCCESS';
export const DELETE_NOTIFICATION_FAILURE = 'DELETE_NOTIFICATION_FAILURE';

export const FETCH_NOTIFICATION_PREFERENCES_REQUEST = 'FETCH_NOTIFICATION_PREFERENCES_REQUEST';
export const FETCH_NOTIFICATION_PREFERENCES_SUCCESS = 'FETCH_NOTIFICATION_PREFERENCES_SUCCESS';
export const FETCH_NOTIFICATION_PREFERENCES_FAILURE = 'FETCH_NOTIFICATION_PREFERENCES_FAILURE';

export const UPDATE_NOTIFICATION_PREFERENCES_REQUEST = 'UPDATE_NOTIFICATION_PREFERENCES_REQUEST';
export const UPDATE_NOTIFICATION_PREFERENCES_SUCCESS = 'UPDATE_NOTIFICATION_PREFERENCES_SUCCESS';
export const UPDATE_NOTIFICATION_PREFERENCES_FAILURE = 'UPDATE_NOTIFICATION_PREFERENCES_FAILURE';

export const FETCH_LOCATION_NOTIFICATIONS_REQUEST = 'FETCH_LOCATION_NOTIFICATIONS_REQUEST';
export const FETCH_LOCATION_NOTIFICATIONS_SUCCESS = 'FETCH_LOCATION_NOTIFICATIONS_SUCCESS';
export const FETCH_LOCATION_NOTIFICATIONS_FAILURE = 'FETCH_LOCATION_NOTIFICATIONS_FAILURE';

export const SYNC_OFFLINE_NOTIFICATIONS_REQUEST = 'SYNC_OFFLINE_NOTIFICATIONS_REQUEST';
export const SYNC_OFFLINE_NOTIFICATIONS_SUCCESS = 'SYNC_OFFLINE_NOTIFICATIONS_SUCCESS';
export const SYNC_OFFLINE_NOTIFICATIONS_FAILURE = 'SYNC_OFFLINE_NOTIFICATIONS_FAILURE';

export const SUBSCRIBE_NOTIFICATIONS_REQUEST = 'SUBSCRIBE_NOTIFICATIONS_REQUEST';
export const SUBSCRIBE_NOTIFICATIONS_SUCCESS = 'SUBSCRIBE_NOTIFICATIONS_SUCCESS';
export const SUBSCRIBE_NOTIFICATIONS_FAILURE = 'SUBSCRIBE_NOTIFICATIONS_FAILURE';

export const NEW_NOTIFICATION = 'NEW_NOTIFICATION';
export const NOTIFICATION_READ = 'NOTIFICATION_READ';

// Define action types
export type NotificationActionTypes =
  | typeof FETCH_NOTIFICATIONS_REQUEST
  | typeof FETCH_NOTIFICATIONS_SUCCESS
  | typeof FETCH_NOTIFICATIONS_FAILURE
  | typeof FETCH_UNREAD_COUNT_REQUEST
  | typeof FETCH_UNREAD_COUNT_SUCCESS
  | typeof FETCH_UNREAD_COUNT_FAILURE
  | typeof MARK_NOTIFICATION_READ_REQUEST
  | typeof MARK_NOTIFICATION_READ_SUCCESS
  | typeof MARK_NOTIFICATION_READ_FAILURE
  | typeof MARK_ALL_NOTIFICATIONS_READ_REQUEST
  | typeof MARK_ALL_NOTIFICATIONS_READ_SUCCESS
  | typeof MARK_ALL_NOTIFICATIONS_READ_FAILURE
  | typeof DELETE_NOTIFICATION_REQUEST
  | typeof DELETE_NOTIFICATION_SUCCESS
  | typeof DELETE_NOTIFICATION_FAILURE
  | typeof FETCH_NOTIFICATION_PREFERENCES_REQUEST
  | typeof FETCH_NOTIFICATION_PREFERENCES_SUCCESS
  | typeof FETCH_NOTIFICATION_PREFERENCES_FAILURE
  | typeof UPDATE_NOTIFICATION_PREFERENCES_REQUEST
  | typeof UPDATE_NOTIFICATION_PREFERENCES_SUCCESS
  | typeof UPDATE_NOTIFICATION_PREFERENCES_FAILURE
  | typeof FETCH_LOCATION_NOTIFICATIONS_REQUEST
  | typeof FETCH_LOCATION_NOTIFICATIONS_SUCCESS
  | typeof FETCH_LOCATION_NOTIFICATIONS_FAILURE
  | typeof SYNC_OFFLINE_NOTIFICATIONS_REQUEST
  | typeof SYNC_OFFLINE_NOTIFICATIONS_SUCCESS
  | typeof SYNC_OFFLINE_NOTIFICATIONS_FAILURE
  | typeof SUBSCRIBE_NOTIFICATIONS_REQUEST
  | typeof SUBSCRIBE_NOTIFICATIONS_SUCCESS
  | typeof SUBSCRIBE_NOTIFICATIONS_FAILURE
  | typeof NEW_NOTIFICATION
  | typeof NOTIFICATION_READ;

// Define action interfaces
interface FetchNotificationsRequestAction {
  type: typeof FETCH_NOTIFICATIONS_REQUEST;
}

interface FetchNotificationsSuccessAction {
  type: typeof FETCH_NOTIFICATIONS_SUCCESS;
  payload: { notifications: Notification[]; total: number };
}

interface FetchNotificationsFailureAction {
  type: typeof FETCH_NOTIFICATIONS_FAILURE;
  payload: string;
}

interface FetchUnreadCountRequestAction {
  type: typeof FETCH_UNREAD_COUNT_REQUEST;
}

interface FetchUnreadCountSuccessAction {
  type: typeof FETCH_UNREAD_COUNT_SUCCESS;
  payload: number;
}

interface FetchUnreadCountFailureAction {
  type: typeof FETCH_UNREAD_COUNT_FAILURE;
  payload: string;
}

interface MarkNotificationReadRequestAction {
  type: typeof MARK_NOTIFICATION_READ_REQUEST;
  payload: string;
}

interface MarkNotificationReadSuccessAction {
  type: typeof MARK_NOTIFICATION_READ_SUCCESS;
  payload: string;
}

interface MarkNotificationReadFailureAction {
  type: typeof MARK_NOTIFICATION_READ_FAILURE;
  payload: string;
}

interface MarkAllNotificationsReadRequestAction {
  type: typeof MARK_ALL_NOTIFICATIONS_READ_REQUEST;
}

interface MarkAllNotificationsReadSuccessAction {
  type: typeof MARK_ALL_NOTIFICATIONS_READ_SUCCESS;
}

interface MarkAllNotificationsReadFailureAction {
  type: typeof MARK_ALL_NOTIFICATIONS_READ_FAILURE;
  payload: string;
}

interface DeleteNotificationRequestAction {
  type: typeof DELETE_NOTIFICATION_REQUEST;
  payload: string;
}

interface DeleteNotificationSuccessAction {
  type: typeof DELETE_NOTIFICATION_SUCCESS;
  payload: string;
}

interface DeleteNotificationFailureAction {
  type: typeof DELETE_NOTIFICATION_FAILURE;
  payload: string;
}

interface FetchNotificationPreferencesRequestAction {
  type: typeof FETCH_NOTIFICATION_PREFERENCES_REQUEST;
}

interface FetchNotificationPreferencesSuccessAction {
  type: typeof FETCH_NOTIFICATION_PREFERENCES_SUCCESS;
  payload: NotificationPreference[];
}

interface FetchNotificationPreferencesFailureAction {
  type: typeof FETCH_NOTIFICATION_PREFERENCES_FAILURE;
  payload: string;
}

interface UpdateNotificationPreferencesRequestAction {
  type: typeof UPDATE_NOTIFICATION_PREFERENCES_REQUEST;
}

interface UpdateNotificationPreferencesSuccessAction {
  type: typeof UPDATE_NOTIFICATION_PREFERENCES_SUCCESS;
  payload: NotificationPreference[];
}

interface UpdateNotificationPreferencesFailureAction {
  type: typeof UPDATE_NOTIFICATION_PREFERENCES_FAILURE;
  payload: string;
}

interface FetchLocationNotificationsRequestAction {
  type: typeof FETCH_LOCATION_NOTIFICATIONS_REQUEST;
}

interface FetchLocationNotificationsSuccessAction {
  type: typeof FETCH_LOCATION_NOTIFICATIONS_SUCCESS;
  payload: Notification[];
}

interface FetchLocationNotificationsFailureAction {
  type: typeof FETCH_LOCATION_NOTIFICATIONS_FAILURE;
  payload: string;
}

interface SyncOfflineNotificationsRequestAction {
  type: typeof SYNC_OFFLINE_NOTIFICATIONS_REQUEST;
}

interface SyncOfflineNotificationsSuccessAction {
  type: typeof SYNC_OFFLINE_NOTIFICATIONS_SUCCESS;
  payload: { success: boolean; synced: number };
}

interface SyncOfflineNotificationsFailureAction {
  type: typeof SYNC_OFFLINE_NOTIFICATIONS_FAILURE;
  payload: string;
}

interface SubscribeNotificationsRequestAction {
  type: typeof SUBSCRIBE_NOTIFICATIONS_REQUEST;
}

interface SubscribeNotificationsSuccessAction {
  type: typeof SUBSCRIBE_NOTIFICATIONS_SUCCESS;
}

interface SubscribeNotificationsFailureAction {
  type: typeof SUBSCRIBE_NOTIFICATIONS_FAILURE;
  payload: string;
}

interface NewNotificationAction {
  type: typeof NEW_NOTIFICATION;
  payload: Notification;
}

interface NotificationReadAction {
  type: typeof NOTIFICATION_READ;
  payload: string;
}

export type NotificationAction =
  | FetchNotificationsRequestAction
  | FetchNotificationsSuccessAction
  | FetchNotificationsFailureAction
  | FetchUnreadCountRequestAction
  | FetchUnreadCountSuccessAction
  | FetchUnreadCountFailureAction
  | MarkNotificationReadRequestAction
  | MarkNotificationReadSuccessAction
  | MarkNotificationReadFailureAction
  | MarkAllNotificationsReadRequestAction
  | MarkAllNotificationsReadSuccessAction
  | MarkAllNotificationsReadFailureAction
  | DeleteNotificationRequestAction
  | DeleteNotificationSuccessAction
  | DeleteNotificationFailureAction
  | FetchNotificationPreferencesRequestAction
  | FetchNotificationPreferencesSuccessAction
  | FetchNotificationPreferencesFailureAction
  | UpdateNotificationPreferencesRequestAction
  | UpdateNotificationPreferencesSuccessAction
  | UpdateNotificationPreferencesFailureAction
  | FetchLocationNotificationsRequestAction
  | FetchLocationNotificationsSuccessAction
  | FetchLocationNotificationsFailureAction
  | SyncOfflineNotificationsRequestAction
  | SyncOfflineNotificationsSuccessAction
  | SyncOfflineNotificationsFailureAction
  | SubscribeNotificationsRequestAction
  | SubscribeNotificationsSuccessAction
  | SubscribeNotificationsFailureAction
  | NewNotificationAction
  | NotificationReadAction;

// Define Thunk action creators
/**
 * Thunk action creator that fetches notifications for the current driver
 * @param driverId The driver's unique identifier
 * @param options Filtering and pagination options
 * @returns Thunk action that fetches notifications
 */
export const fetchNotifications = (
  driverId: string,
  options: NotificationQueryOptions
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch FETCH_NOTIFICATIONS_REQUEST action
    dispatch({ type: FETCH_NOTIFICATIONS_REQUEST });

    try {
      // Call notificationService.getDriverNotifications with driverId and options
      const data = await notificationService.getDriverNotifications(driverId, options);

      // On success, dispatch FETCH_NOTIFICATIONS_SUCCESS with the notifications data
      dispatch({
        type: FETCH_NOTIFICATIONS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // On failure, dispatch FETCH_NOTIFICATIONS_FAILURE with the error message
      dispatch({
        type: FETCH_NOTIFICATIONS_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that fetches the count of unread notifications
 * @param driverId The driver's unique identifier
 * @returns Thunk action that fetches unread count
 */
export const fetchUnreadCount = (
  driverId: string
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch FETCH_UNREAD_COUNT_REQUEST action
    dispatch({ type: FETCH_UNREAD_COUNT_REQUEST });

    try {
      // Call notificationService.getDriverUnreadCount with driverId
      const count = await notificationService.getDriverUnreadCount(driverId);

      // On success, dispatch FETCH_UNREAD_COUNT_SUCCESS with the count
      dispatch({
        type: FETCH_UNREAD_COUNT_SUCCESS,
        payload: count,
      });
    } catch (error: any) {
      // On failure, dispatch FETCH_UNREAD_COUNT_FAILURE with the error message
      dispatch({
        type: FETCH_UNREAD_COUNT_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that marks a notification as read
 * @param notificationId ID of the notification to mark as read
 * @returns Thunk action that marks notification as read
 */
export const markNotificationRead = (
  notificationId: string
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch MARK_NOTIFICATION_READ_REQUEST action with notificationId
    dispatch({
      type: MARK_NOTIFICATION_READ_REQUEST,
      payload: notificationId,
    });

    try {
      // Call notificationService.markAsRead with notificationId
      await notificationService.markAsRead(notificationId);

      // On success, dispatch MARK_NOTIFICATION_READ_SUCCESS with notificationId
      dispatch({
        type: MARK_NOTIFICATION_READ_SUCCESS,
        payload: notificationId,
      });
    } catch (error: any) {
      // On failure, dispatch MARK_NOTIFICATION_READ_FAILURE with the error message
      dispatch({
        type: MARK_NOTIFICATION_READ_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that marks all notifications as read for a driver
 * @param driverId The driver's unique identifier
 * @returns Thunk action that marks all notifications as read
 */
export const markAllNotificationsRead = (
  driverId: string
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch MARK_ALL_NOTIFICATIONS_READ_REQUEST action
    dispatch({ type: MARK_ALL_NOTIFICATIONS_READ_REQUEST });

    try {
      // Call notificationService.markAllAsRead with driverId
      await notificationService.markAllAsRead(driverId);

      // On success, dispatch MARK_ALL_NOTIFICATIONS_READ_SUCCESS
      dispatch({ type: MARK_ALL_NOTIFICATIONS_READ_SUCCESS });
    } catch (error: any) {
      // On failure, dispatch MARK_ALL_NOTIFICATIONS_READ_FAILURE with the error message
      dispatch({
        type: MARK_ALL_NOTIFICATIONS_READ_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that deletes a notification
 * @param notificationId ID of the notification to delete
 * @returns Thunk action that deletes a notification
 */
export const deleteNotification = (
  notificationId: string
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch DELETE_NOTIFICATION_REQUEST action with notificationId
    dispatch({
      type: DELETE_NOTIFICATION_REQUEST,
      payload: notificationId,
    });

    try {
      // Call notificationService.deleteNotification with notificationId
      await notificationService.deleteNotification(notificationId);

      // On success, dispatch DELETE_NOTIFICATION_SUCCESS with notificationId
      dispatch({
        type: DELETE_NOTIFICATION_SUCCESS,
        payload: notificationId,
      });
    } catch (error: any) {
      // On failure, dispatch DELETE_NOTIFICATION_FAILURE with the error message
      dispatch({
        type: DELETE_NOTIFICATION_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that fetches notification preferences for a driver
 * @param driverId The driver's unique identifier
 * @returns Thunk action that fetches notification preferences
 */
export const fetchNotificationPreferences = (
  driverId: string
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch FETCH_NOTIFICATION_PREFERENCES_REQUEST action
    dispatch({ type: FETCH_NOTIFICATION_PREFERENCES_REQUEST });

    try {
      // Call notificationService.getDriverNotificationPreferences with driverId
      const preferences = await notificationService.getDriverNotificationPreferences(driverId);

      // On success, dispatch FETCH_NOTIFICATION_PREFERENCES_SUCCESS with the preferences
      dispatch({
        type: FETCH_NOTIFICATION_PREFERENCES_SUCCESS,
        payload: preferences,
      });
    } catch (error: any) {
      // On failure, dispatch FETCH_NOTIFICATION_PREFERENCES_FAILURE with the error message
      dispatch({
        type: FETCH_NOTIFICATION_PREFERENCES_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that updates notification preferences for a driver
 * @param driverId The driver's unique identifier
 * @param preferences Updated notification preferences
 * @returns Thunk action that updates notification preferences
 */
export const updateNotificationPreferences = (
  driverId: string,
  preferences: NotificationPreferenceUpdate
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch UPDATE_NOTIFICATION_PREFERENCES_REQUEST action
    dispatch({ type: UPDATE_NOTIFICATION_PREFERENCES_REQUEST });

    try {
      // Call notificationService.updateDriverNotificationPreferences with driverId and preferences
      const updatedPreferences = await notificationService.updateDriverNotificationPreferences(driverId, preferences);

      // On success, dispatch UPDATE_NOTIFICATION_PREFERENCES_SUCCESS with the updated preferences
      dispatch({
        type: UPDATE_NOTIFICATION_PREFERENCES_SUCCESS,
        payload: updatedPreferences,
      });
    } catch (error: any) {
      // On failure, dispatch UPDATE_NOTIFICATION_PREFERENCES_FAILURE with the error message
      dispatch({
        type: UPDATE_NOTIFICATION_PREFERENCES_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that fetches notifications based on driver's location
 * @param driverId The driver's unique identifier
 * @param position The driver's current position (latitude, longitude)
 * @param radius The radius in miles to search for notifications
 * @returns Thunk action that fetches location-based notifications
 */
export const fetchLocationNotifications = (
  driverId: string,
  position: { latitude: number; longitude: number },
  radius: number
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch FETCH_LOCATION_NOTIFICATIONS_REQUEST action
    dispatch({ type: FETCH_LOCATION_NOTIFICATIONS_REQUEST });

    try {
      // Call notificationService.getLocationBasedNotifications with driverId, position, and radius
      const notifications = await notificationService.getLocationBasedNotifications(driverId, position, radius);

      // On success, dispatch FETCH_LOCATION_NOTIFICATIONS_SUCCESS with the notifications
      dispatch({
        type: FETCH_LOCATION_NOTIFICATIONS_SUCCESS,
        payload: notifications,
      });
    } catch (error: any) {
      // On failure, dispatch FETCH_LOCATION_NOTIFICATIONS_FAILURE with the error message
      dispatch({
        type: FETCH_LOCATION_NOTIFICATIONS_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that synchronizes offline notifications when connectivity is restored
 * @param driverId The driver's unique identifier
 * @returns Thunk action that syncs offline notifications
 */
export const syncOfflineNotifications = (
  driverId: string
): ThunkAction<void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch SYNC_OFFLINE_NOTIFICATIONS_REQUEST action
    dispatch({ type: SYNC_OFFLINE_NOTIFICATIONS_REQUEST });

    try {
      // Call notificationService.syncOfflineNotifications with driverId
      const syncResult = await notificationService.syncOfflineNotifications(driverId);

      // On success, dispatch SYNC_OFFLINE_NOTIFICATIONS_SUCCESS with the sync results
      dispatch({
        type: SYNC_OFFLINE_NOTIFICATIONS_SUCCESS,
        payload: syncResult,
      });
    } catch (error: any) {
      // On failure, dispatch SYNC_OFFLINE_NOTIFICATIONS_FAILURE with the error message
      dispatch({
        type: SYNC_OFFLINE_NOTIFICATIONS_FAILURE,
        payload: error.message,
      });
    }
  };
};

/**
 * Thunk action creator that subscribes to real-time notification updates
 * @param driverId The driver's unique identifier
 * @returns Thunk action that subscribes to notifications
 */
export const subscribeToNotifications = (
  driverId: string
): ThunkAction<() => void, {}, null, NotificationAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<{}, {}, NotificationAction>) => {
    // Dispatch SUBSCRIBE_NOTIFICATIONS_REQUEST action
    dispatch({ type: SUBSCRIBE_NOTIFICATIONS_REQUEST });

    try {
      // Call notificationService.subscribeToDriverNotifications with driverId
      const unsubscribe = notificationService.subscribeToDriverNotifications(
        driverId,
        (notification) => {
          // Pass callback functions for handling new notifications and notification read events
          dispatch(handleNewNotification(notification));
        },
        (notificationId) => {
          dispatch(handleNotificationRead(notificationId));
        }
      );

      // On successful subscription, dispatch SUBSCRIBE_NOTIFICATIONS_SUCCESS
      dispatch({ type: SUBSCRIBE_NOTIFICATIONS_SUCCESS });

      // Return the unsubscribe function for cleanup
      return unsubscribe;
    } catch (error: any) {
      // On failure, dispatch SUBSCRIBE_NOTIFICATIONS_FAILURE with the error message
      dispatch({
        type: SUBSCRIBE_NOTIFICATIONS_FAILURE,
        payload: error.message,
      });
      return () => {}; // Return a no-op unsubscribe function
    }
  };
};

/**
 * Action creator for when a new notification is received in real-time
 * @param notification New notification object
 * @returns Redux action with the new notification
 */
export const handleNewNotification = (notification: Notification): NotificationAction => {
  // Return an action object with type NEW_NOTIFICATION and the notification payload
  return {
    type: NEW_NOTIFICATION,
    payload: notification,
  };
};

/**
 * Action creator for when a notification is marked as read from another device
 * @param notificationId ID of the notification that was read
 * @returns Redux action with the notification ID
 */
export const handleNotificationRead = (notificationId: string): NotificationAction => {
  // Return an action object with type NOTIFICATION_READ and the notificationId payload
  return {
    type: NOTIFICATION_READ,
    payload: notificationId,
  };
};