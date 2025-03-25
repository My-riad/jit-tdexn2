import { createAction } from '@reduxjs/toolkit';
import { 
  Notification, 
  NotificationQueryOptions, 
  NotificationPreference, 
  NotificationPreferenceUpdate 
} from '../../../common/interfaces';

// Fetch notifications
export const FETCH_NOTIFICATIONS_REQUEST = 'notification/FETCH_NOTIFICATIONS_REQUEST';
export const FETCH_NOTIFICATIONS_SUCCESS = 'notification/FETCH_NOTIFICATIONS_SUCCESS';
export const FETCH_NOTIFICATIONS_FAILURE = 'notification/FETCH_NOTIFICATIONS_FAILURE';

// Fetch unread notification count
export const FETCH_UNREAD_COUNT_REQUEST = 'notification/FETCH_UNREAD_COUNT_REQUEST';
export const FETCH_UNREAD_COUNT_SUCCESS = 'notification/FETCH_UNREAD_COUNT_SUCCESS';
export const FETCH_UNREAD_COUNT_FAILURE = 'notification/FETCH_UNREAD_COUNT_FAILURE';

// Mark notification as read
export const MARK_NOTIFICATION_READ_REQUEST = 'notification/MARK_NOTIFICATION_READ_REQUEST';
export const MARK_NOTIFICATION_READ_SUCCESS = 'notification/MARK_NOTIFICATION_READ_SUCCESS';
export const MARK_NOTIFICATION_READ_FAILURE = 'notification/MARK_NOTIFICATION_READ_FAILURE';

// Mark all notifications as read
export const MARK_ALL_NOTIFICATIONS_READ_REQUEST = 'notification/MARK_ALL_NOTIFICATIONS_READ_REQUEST';
export const MARK_ALL_NOTIFICATIONS_READ_SUCCESS = 'notification/MARK_ALL_NOTIFICATIONS_READ_SUCCESS';
export const MARK_ALL_NOTIFICATIONS_READ_FAILURE = 'notification/MARK_ALL_NOTIFICATIONS_READ_FAILURE';

// Delete notification
export const DELETE_NOTIFICATION_REQUEST = 'notification/DELETE_NOTIFICATION_REQUEST';
export const DELETE_NOTIFICATION_SUCCESS = 'notification/DELETE_NOTIFICATION_SUCCESS';
export const DELETE_NOTIFICATION_FAILURE = 'notification/DELETE_NOTIFICATION_FAILURE';

// Real-time notification subscription
export const SUBSCRIBE_NOTIFICATIONS_REQUEST = 'notification/SUBSCRIBE_NOTIFICATIONS_REQUEST';
export const SUBSCRIBE_NOTIFICATIONS_SUCCESS = 'notification/SUBSCRIBE_NOTIFICATIONS_SUCCESS';
export const SUBSCRIBE_NOTIFICATIONS_FAILURE = 'notification/SUBSCRIBE_NOTIFICATIONS_FAILURE';
export const UNSUBSCRIBE_NOTIFICATIONS = 'notification/UNSUBSCRIBE_NOTIFICATIONS';
export const NOTIFICATION_RECEIVED = 'notification/NOTIFICATION_RECEIVED';
export const NOTIFICATION_READ = 'notification/NOTIFICATION_READ';

// Notification preferences
export const FETCH_NOTIFICATION_PREFERENCES_REQUEST = 'notification/FETCH_NOTIFICATION_PREFERENCES_REQUEST';
export const FETCH_NOTIFICATION_PREFERENCES_SUCCESS = 'notification/FETCH_NOTIFICATION_PREFERENCES_SUCCESS';
export const FETCH_NOTIFICATION_PREFERENCES_FAILURE = 'notification/FETCH_NOTIFICATION_PREFERENCES_FAILURE';
export const UPDATE_NOTIFICATION_PREFERENCES_REQUEST = 'notification/UPDATE_NOTIFICATION_PREFERENCES_REQUEST';
export const UPDATE_NOTIFICATION_PREFERENCES_SUCCESS = 'notification/UPDATE_NOTIFICATION_PREFERENCES_SUCCESS';
export const UPDATE_NOTIFICATION_PREFERENCES_FAILURE = 'notification/UPDATE_NOTIFICATION_PREFERENCES_FAILURE';

// Fetch notifications actions
export const fetchNotifications = createAction<NotificationQueryOptions>(FETCH_NOTIFICATIONS_REQUEST);
export const fetchNotificationsSuccess = createAction<{
  notifications: Notification[];
  pagination: object;
}>(FETCH_NOTIFICATIONS_SUCCESS);
export const fetchNotificationsFailure = createAction<string>(FETCH_NOTIFICATIONS_FAILURE);

// Fetch unread notification count actions
export const fetchUnreadCount = createAction(FETCH_UNREAD_COUNT_REQUEST);
export const fetchUnreadCountSuccess = createAction<number>(FETCH_UNREAD_COUNT_SUCCESS);
export const fetchUnreadCountFailure = createAction<string>(FETCH_UNREAD_COUNT_FAILURE);

// Mark notification as read actions
export const markNotificationRead = createAction<string>(MARK_NOTIFICATION_READ_REQUEST);
export const markNotificationReadSuccess = createAction<string>(MARK_NOTIFICATION_READ_SUCCESS);
export const markNotificationReadFailure = createAction<string>(MARK_NOTIFICATION_READ_FAILURE);

// Mark all notifications as read actions
export const markAllNotificationsRead = createAction(MARK_ALL_NOTIFICATIONS_READ_REQUEST);
export const markAllNotificationsReadSuccess = createAction(MARK_ALL_NOTIFICATIONS_READ_SUCCESS);
export const markAllNotificationsReadFailure = createAction<string>(MARK_ALL_NOTIFICATIONS_READ_FAILURE);

// Delete notification actions
export const deleteNotification = createAction<string>(DELETE_NOTIFICATION_REQUEST);
export const deleteNotificationSuccess = createAction<string>(DELETE_NOTIFICATION_SUCCESS);
export const deleteNotificationFailure = createAction<string>(DELETE_NOTIFICATION_FAILURE);

// Real-time notification subscription actions
export const subscribeNotifications = createAction(SUBSCRIBE_NOTIFICATIONS_REQUEST);
export const subscribeNotificationsSuccess = createAction<Function>(SUBSCRIBE_NOTIFICATIONS_SUCCESS);
export const subscribeNotificationsFailure = createAction<string>(SUBSCRIBE_NOTIFICATIONS_FAILURE);
export const unsubscribeNotifications = createAction(UNSUBSCRIBE_NOTIFICATIONS);
export const notificationReceived = createAction<Notification>(NOTIFICATION_RECEIVED);
export const notificationRead = createAction<{
  notificationId: string;
  read: boolean;
}>(NOTIFICATION_READ);

// Notification preferences actions
export const fetchNotificationPreferences = createAction(FETCH_NOTIFICATION_PREFERENCES_REQUEST);
export const fetchNotificationPreferencesSuccess = createAction<NotificationPreference[]>(FETCH_NOTIFICATION_PREFERENCES_SUCCESS);
export const fetchNotificationPreferencesFailure = createAction<string>(FETCH_NOTIFICATION_PREFERENCES_FAILURE);
export const updateNotificationPreferences = createAction<NotificationPreferenceUpdate>(UPDATE_NOTIFICATION_PREFERENCES_REQUEST);
export const updateNotificationPreferencesSuccess = createAction<NotificationPreference[]>(UPDATE_NOTIFICATION_PREFERENCES_SUCCESS);
export const updateNotificationPreferencesFailure = createAction<string>(UPDATE_NOTIFICATION_PREFERENCES_FAILURE);