import { createAction } from '@reduxjs/toolkit';
import { 
  Notification, 
  NotificationQueryOptions, 
  NotificationPreference, 
  NotificationPreferenceUpdate 
} from '../../../common/interfaces/tracking.interface';

// Action Types
export const GET_NOTIFICATIONS_REQUEST = 'notification/GET_NOTIFICATIONS_REQUEST';
export const GET_NOTIFICATIONS_SUCCESS = 'notification/GET_NOTIFICATIONS_SUCCESS';
export const GET_NOTIFICATIONS_FAILURE = 'notification/GET_NOTIFICATIONS_FAILURE';

export const GET_UNREAD_COUNT_REQUEST = 'notification/GET_UNREAD_COUNT_REQUEST';
export const GET_UNREAD_COUNT_SUCCESS = 'notification/GET_UNREAD_COUNT_SUCCESS';
export const GET_UNREAD_COUNT_FAILURE = 'notification/GET_UNREAD_COUNT_FAILURE';

export const MARK_AS_READ_REQUEST = 'notification/MARK_AS_READ_REQUEST';
export const MARK_AS_READ_SUCCESS = 'notification/MARK_AS_READ_SUCCESS';
export const MARK_AS_READ_FAILURE = 'notification/MARK_AS_READ_FAILURE';

export const MARK_ALL_AS_READ_REQUEST = 'notification/MARK_ALL_AS_READ_REQUEST';
export const MARK_ALL_AS_READ_SUCCESS = 'notification/MARK_ALL_AS_READ_SUCCESS';
export const MARK_ALL_AS_READ_FAILURE = 'notification/MARK_ALL_AS_READ_FAILURE';

export const DELETE_NOTIFICATION_REQUEST = 'notification/DELETE_NOTIFICATION_REQUEST';
export const DELETE_NOTIFICATION_SUCCESS = 'notification/DELETE_NOTIFICATION_SUCCESS';
export const DELETE_NOTIFICATION_FAILURE = 'notification/DELETE_NOTIFICATION_FAILURE';

export const RECEIVE_NEW_NOTIFICATION = 'notification/RECEIVE_NEW_NOTIFICATION';
export const UPDATE_NOTIFICATION_READ_STATUS = 'notification/UPDATE_NOTIFICATION_READ_STATUS';

export const GET_PREFERENCES_REQUEST = 'notification/GET_PREFERENCES_REQUEST';
export const GET_PREFERENCES_SUCCESS = 'notification/GET_PREFERENCES_SUCCESS';
export const GET_PREFERENCES_FAILURE = 'notification/GET_PREFERENCES_FAILURE';

export const UPDATE_PREFERENCES_REQUEST = 'notification/UPDATE_PREFERENCES_REQUEST';
export const UPDATE_PREFERENCES_SUCCESS = 'notification/UPDATE_PREFERENCES_SUCCESS';
export const UPDATE_PREFERENCES_FAILURE = 'notification/UPDATE_PREFERENCES_FAILURE';

// Action Creators
export const getNotificationsRequest = createAction<NotificationQueryOptions>(
  GET_NOTIFICATIONS_REQUEST
);

export const getNotificationsSuccess = createAction<{
  notifications: Notification[];
  pagination: object;
}>(GET_NOTIFICATIONS_SUCCESS);

export const getNotificationsFailure = createAction<string>(
  GET_NOTIFICATIONS_FAILURE
);

export const getUnreadCountRequest = createAction(
  GET_UNREAD_COUNT_REQUEST
);

export const getUnreadCountSuccess = createAction<number>(
  GET_UNREAD_COUNT_SUCCESS
);

export const getUnreadCountFailure = createAction<string>(
  GET_UNREAD_COUNT_FAILURE
);

export const markAsReadRequest = createAction<string>(
  MARK_AS_READ_REQUEST
);

export const markAsReadSuccess = createAction<string>(
  MARK_AS_READ_SUCCESS
);

export const markAsReadFailure = createAction<string>(
  MARK_AS_READ_FAILURE
);

export const markAllAsReadRequest = createAction(
  MARK_ALL_AS_READ_REQUEST
);

export const markAllAsReadSuccess = createAction(
  MARK_ALL_AS_READ_SUCCESS
);

export const markAllAsReadFailure = createAction<string>(
  MARK_ALL_AS_READ_FAILURE
);

export const deleteNotificationRequest = createAction<string>(
  DELETE_NOTIFICATION_REQUEST
);

export const deleteNotificationSuccess = createAction<string>(
  DELETE_NOTIFICATION_SUCCESS
);

export const deleteNotificationFailure = createAction<string>(
  DELETE_NOTIFICATION_FAILURE
);

export const receiveNewNotification = createAction<Notification>(
  RECEIVE_NEW_NOTIFICATION
);

export const updateNotificationReadStatus = createAction<{
  notificationId: string;
  read: boolean;
}>(UPDATE_NOTIFICATION_READ_STATUS);

export const getPreferencesRequest = createAction(
  GET_PREFERENCES_REQUEST
);

export const getPreferencesSuccess = createAction<NotificationPreference[]>(
  GET_PREFERENCES_SUCCESS
);

export const getPreferencesFailure = createAction<string>(
  GET_PREFERENCES_FAILURE
);

export const updatePreferencesRequest = createAction<NotificationPreferenceUpdate>(
  UPDATE_PREFERENCES_REQUEST
);

export const updatePreferencesSuccess = createAction<NotificationPreference[]>(
  UPDATE_PREFERENCES_SUCCESS
);

export const updatePreferencesFailure = createAction<string>(
  UPDATE_PREFERENCES_FAILURE
);