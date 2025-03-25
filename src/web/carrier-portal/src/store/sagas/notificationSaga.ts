/**
 * Redux-Saga middleware for handling notification-related asynchronous operations
 * in the carrier portal. This file contains saga generators for notification API calls
 * and manages WebSocket connections for real-time notification updates.
 */

import { eventChannel, END } from 'redux-saga'; // ^1.2.3
import { 
  call, 
  put, 
  takeLatest, 
  takeEvery, 
  all, 
  fork, 
  select, 
  take, 
  cancel, 
  cancelled 
} from 'redux-saga/effects'; // ^1.2.3
import { PayloadAction } from '@reduxjs/toolkit'; // ^1.9.0

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
  UPDATE_PREFERENCES_FAILURE,
  getNotificationsSuccess, 
  getNotificationsFailure, 
  getUnreadCountSuccess, 
  getUnreadCountFailure, 
  markAsReadSuccess, 
  markAsReadFailure, 
  markAllAsReadSuccess, 
  markAllAsReadFailure, 
  deleteNotificationSuccess, 
  deleteNotificationFailure, 
  receiveNewNotification, 
  updateNotificationReadStatus, 
  getPreferencesSuccess, 
  getPreferencesFailure, 
  updatePreferencesSuccess, 
  updatePreferencesFailure 
} from '../actions/notificationActions';

import notificationService from '../../../common/services/notificationService';
import { 
  Notification, 
  NotificationQueryOptions, 
  NotificationPreference, 
  NotificationPreferenceUpdate 
} from '../../../common/interfaces/tracking.interface';
import logger from '../../../common/utils/logger';

/**
 * Saga that handles fetching notifications with optional filtering and pagination
 * @param action The action containing query options
 */
function* getNotificationsSaga(action: PayloadAction<NotificationQueryOptions>) {
  try {
    logger.info('Fetching notifications', {
      component: 'NotificationSaga',
      queryOptions: action.payload
    });

    // Call the notification service API to fetch notifications
    const response = yield call(notificationService.getNotifications, action.payload);
    
    // Dispatch success action with the received data
    yield put(getNotificationsSuccess(response));
    
    logger.debug('Notifications fetched successfully', {
      component: 'NotificationSaga',
      count: response.notifications.length
    });
  } catch (error) {
    // Log the error
    logger.error('Failed to fetch notifications', {
      component: 'NotificationSaga',
      error
    });
    
    // Dispatch failure action with error message
    yield put(getNotificationsFailure(error.message || 'Failed to fetch notifications'));
  }
}

/**
 * Saga that handles fetching the unread notification count
 */
function* getUnreadCountSaga() {
  try {
    logger.info('Fetching unread notification count', {
      component: 'NotificationSaga'
    });

    // Call the notification service API to fetch unread count
    const count = yield call(notificationService.getUnreadCount);
    
    // Dispatch success action with the count
    yield put(getUnreadCountSuccess(count));
    
    logger.debug('Unread count fetched successfully', {
      component: 'NotificationSaga',
      count
    });
  } catch (error) {
    // Log the error
    logger.error('Failed to fetch unread count', {
      component: 'NotificationSaga',
      error
    });
    
    // Dispatch failure action with error message
    yield put(getUnreadCountFailure(error.message || 'Failed to fetch unread notification count'));
  }
}

/**
 * Saga that handles marking a notification as read
 * @param action The action containing the notification ID
 */
function* markAsReadSaga(action: PayloadAction<string>) {
  try {
    const notificationId = action.payload;
    
    logger.info('Marking notification as read', {
      component: 'NotificationSaga',
      notificationId
    });

    // Call the notification service API to mark notification as read
    yield call(notificationService.markAsRead, notificationId);
    
    // Dispatch success action with the notification ID
    yield put(markAsReadSuccess(notificationId));
    
    // After marking as read, refresh the unread count
    yield put({ type: GET_UNREAD_COUNT_REQUEST });
    
    logger.debug('Notification marked as read successfully', {
      component: 'NotificationSaga',
      notificationId
    });
  } catch (error) {
    // Log the error
    logger.error('Failed to mark notification as read', {
      component: 'NotificationSaga',
      notificationId: action.payload,
      error
    });
    
    // Dispatch failure action with error message
    yield put(markAsReadFailure(error.message || 'Failed to mark notification as read'));
  }
}

/**
 * Saga that handles marking all notifications as read
 */
function* markAllAsReadSaga() {
  try {
    logger.info('Marking all notifications as read', {
      component: 'NotificationSaga'
    });

    // Call the notification service API to mark all notifications as read
    yield call(notificationService.markAllAsRead);
    
    // Dispatch success action
    yield put(markAllAsReadSuccess());
    
    // After marking all as read, refresh the unread count (should be 0)
    yield put({ type: GET_UNREAD_COUNT_REQUEST });
    
    // Also refresh the notifications list to reflect the updated read status
    yield put({ type: GET_NOTIFICATIONS_REQUEST, payload: {} });
    
    logger.debug('All notifications marked as read successfully', {
      component: 'NotificationSaga'
    });
  } catch (error) {
    // Log the error
    logger.error('Failed to mark all notifications as read', {
      component: 'NotificationSaga',
      error
    });
    
    // Dispatch failure action with error message
    yield put(markAllAsReadFailure(error.message || 'Failed to mark all notifications as read'));
  }
}

/**
 * Saga that handles deleting a notification
 * @param action The action containing the notification ID
 */
function* deleteNotificationSaga(action: PayloadAction<string>) {
  try {
    const notificationId = action.payload;
    
    logger.info('Deleting notification', {
      component: 'NotificationSaga',
      notificationId
    });

    // Call the notification service API to delete notification
    yield call(notificationService.deleteNotification, notificationId);
    
    // Dispatch success action with the notification ID
    yield put(deleteNotificationSuccess(notificationId));
    
    // After deleting, refresh the unread count as it might have changed
    yield put({ type: GET_UNREAD_COUNT_REQUEST });
    
    logger.debug('Notification deleted successfully', {
      component: 'NotificationSaga',
      notificationId
    });
  } catch (error) {
    // Log the error
    logger.error('Failed to delete notification', {
      component: 'NotificationSaga',
      notificationId: action.payload,
      error
    });
    
    // Dispatch failure action with error message
    yield put(deleteNotificationFailure(error.message || 'Failed to delete notification'));
  }
}

/**
 * Saga that handles fetching notification preferences
 */
function* getPreferencesSaga() {
  try {
    logger.info('Fetching notification preferences', {
      component: 'NotificationSaga'
    });

    // Call the notification service API to fetch preferences
    const preferences = yield call(notificationService.getUserPreferences);
    
    // Dispatch success action with the preferences
    yield put(getPreferencesSuccess(preferences));
    
    logger.debug('Notification preferences fetched successfully', {
      component: 'NotificationSaga',
      preferencesCount: preferences.length
    });
  } catch (error) {
    // Log the error
    logger.error('Failed to fetch notification preferences', {
      component: 'NotificationSaga',
      error
    });
    
    // Dispatch failure action with error message
    yield put(getPreferencesFailure(error.message || 'Failed to fetch notification preferences'));
  }
}

/**
 * Saga that handles updating notification preferences
 * @param action The action containing the updated preferences
 */
function* updatePreferencesSaga(action: PayloadAction<NotificationPreferenceUpdate>) {
  try {
    logger.info('Updating notification preferences', {
      component: 'NotificationSaga'
    });

    // Call the notification service API to update preferences
    const updatedPreferences = yield call(
      notificationService.updateUserPreferences, 
      action.payload
    );
    
    // Dispatch success action with the updated preferences
    yield put(updatePreferencesSuccess(updatedPreferences));
    
    logger.debug('Notification preferences updated successfully', {
      component: 'NotificationSaga'
    });
  } catch (error) {
    // Log the error
    logger.error('Failed to update notification preferences', {
      component: 'NotificationSaga',
      error
    });
    
    // Dispatch failure action with error message
    yield put(updatePreferencesFailure(error.message || 'Failed to update notification preferences'));
  }
}

/**
 * Creates an event channel for WebSocket notifications
 * @returns A Redux-Saga event channel for notifications
 */
function createNotificationChannel() {
  return eventChannel(emitter => {
    logger.info('Setting up notification WebSocket channel', {
      component: 'NotificationSaga'
    });

    // Subscribe to real-time notifications using the notification service
    const unsubscribe = notificationService.subscribeToNotifications((notification: Notification) => {
      logger.debug('Received notification through WebSocket', {
        component: 'NotificationSaga',
        notificationType: notification.type
      });
      
      // Emit the notification through the channel
      emitter(notification);
    });

    // Return an unsubscribe function that will be called when the channel is closed
    return () => {
      logger.info('Closing notification WebSocket channel', {
        component: 'NotificationSaga'
      });
      unsubscribe();
    };
  });
}

/**
 * Saga that watches the notification channel for real-time updates
 */
function* watchNotificationChannel() {
  // Create the notification channel
  const channel = yield call(createNotificationChannel);
  
  try {
    logger.info('Watching notification channel for updates', {
      component: 'NotificationSaga'
    });
    
    // Keep taking notifications from the channel until it closes
    while (true) {
      // Take a notification from the channel
      const notification = yield take(channel);
      
      logger.debug('Processing notification from channel', {
        component: 'NotificationSaga',
        notificationType: notification.type
      });
      
      // Dispatch an action with the new notification
      yield put(receiveNewNotification(notification));
      
      // Also update the unread count since we received a new notification
      yield put({ type: GET_UNREAD_COUNT_REQUEST });
    }
  } catch (error) {
    logger.error('Error in notification channel', {
      component: 'NotificationSaga',
      error
    });
  } finally {
    // If the saga was cancelled, close the channel
    if (yield cancelled()) {
      logger.info('Notification channel watch cancelled', {
        component: 'NotificationSaga'
      });
      channel.close();
    }
  }
}

/**
 * Root saga for notifications - watches for all notification-related actions
 */
function* watchNotifications() {
  // Fork the notification channel watcher to handle real-time updates
  const channelTask = yield fork(watchNotificationChannel);
  
  // Watch for specific notification actions and handle them with the appropriate sagas
  yield all([
    takeLatest(GET_NOTIFICATIONS_REQUEST, getNotificationsSaga),
    takeLatest(GET_UNREAD_COUNT_REQUEST, getUnreadCountSaga),
    takeLatest(MARK_AS_READ_REQUEST, markAsReadSaga),
    takeLatest(MARK_ALL_AS_READ_REQUEST, markAllAsReadSaga),
    takeLatest(DELETE_NOTIFICATION_REQUEST, deleteNotificationSaga),
    takeLatest(GET_PREFERENCES_REQUEST, getPreferencesSaga),
    takeLatest(UPDATE_PREFERENCES_REQUEST, updatePreferencesSaga)
  ]);
}

// Export the root saga as the default export
export default watchNotifications;