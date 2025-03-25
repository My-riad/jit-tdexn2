# src/web/shipper-portal/src/store/sagas/notificationSaga.ts
```typescript
import {
  all,
  call,
  cancelled,
  fork,
  put,
  select,
  takeLatest, // redux-saga/effects ^1.1.3
  takeEvery, // redux-saga/effects ^1.1.3
} from 'redux-saga/effects';
import * as actionTypes from '../actions/notificationActions';
import {
  deleteNotificationFailure,
  deleteNotificationSuccess,
  fetchNotificationPreferencesFailure,
  fetchNotificationPreferencesSuccess,
  fetchNotificationsFailure,
  fetchNotificationsSuccess,
  fetchUnreadCountFailure,
  fetchUnreadCountSuccess,
  markAllNotificationsReadFailure,
  markAllNotificationsReadSuccess,
  markNotificationReadFailure,
  markNotificationReadSuccess,
  notificationRead,
  notificationReceived,
  subscribeNotificationsFailure,
  subscribeNotificationsSuccess,
  unsubscribeNotifications,
  updateNotificationPreferencesFailure,
  updateNotificationPreferencesSuccess,
  updateNotificationPreferencesFailure as updateNotificationPreferencesFailureAction,
} from '../actions/notificationActions';
import { notificationService } from '../../../common/services/notificationService'; // src/web/common/services/notificationService.ts
import logger from '../../../common/utils/logger'; // src/web/common/utils/logger.ts
import {
  Notification,
  NotificationQueryOptions,
} from '../../../common/interfaces'; // src/web/common/interfaces/index.ts

/**
 * @description Saga that handles fetching notifications with optional filtering and pagination
 * @param {object} action - The action object containing the payload with query options
 * @returns {Generator} Redux saga generator function
 */
function* fetchNotificationsSaga(action: { payload: NotificationQueryOptions }): Generator {
  // LD1: Extract query options from action payload
  const queryOptions: NotificationQueryOptions = action.payload;

  try {
    // LD2: Try to call notificationService.getNotifications with query options
    const { notifications, total, page, limit }: any = yield call(
      notificationService.getNotifications,
      queryOptions
    );

    // LD3: If successful, dispatch fetchNotificationsSuccess with the notifications and pagination data
    yield put(
      fetchNotificationsSuccess({
        notifications,
        pagination: { total, page, limit },
      })
    );
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchNotificationsFailure with the error message
    logger.error('Failed to fetch notifications', {
      component: 'notificationSaga',
      error,
    });
    yield put(fetchNotificationsFailure(error.message));
  }
}

/**
 * @description Saga that handles fetching the count of unread notifications
 * @returns {Generator} Redux saga generator function
 */
function* fetchUnreadCountSaga(): Generator {
  try {
    // LD1: Try to call notificationService.getUnreadCount
    const count: any = yield call(notificationService.getUnreadCount);

    // LD2: If successful, dispatch fetchUnreadCountSuccess with the count
    yield put(fetchUnreadCountSuccess(count));
  } catch (error: any) {
    // LD3: If an error occurs, log the error and dispatch fetchUnreadCountFailure with the error message
    logger.error('Failed to fetch unread notification count', {
      component: 'notificationSaga',
      error,
    });
    yield put(fetchUnreadCountFailure(error.message));
  }
}

/**
 * @description Saga that handles marking a specific notification as read
 * @param {object} action - The action object containing the payload with the notification ID
 * @returns {Generator} Redux saga generator function
 */
function* markNotificationReadSaga(action: { payload: string }): Generator {
  // LD1: Extract notification ID from action payload
  const notificationId: string = action.payload;

  try {
    // LD2: Try to call notificationService.markAsRead with the notification ID
    yield call(notificationService.markAsRead, notificationId);

    // LD3: If successful, dispatch markNotificationReadSuccess with the notification ID
    yield put(markNotificationReadSuccess(notificationId));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch markNotificationReadFailure with the error message
    logger.error('Failed to mark notification as read', {
      component: 'notificationSaga',
      notificationId,
      error,
    });
    yield put(markNotificationReadFailure(error.message));
  }
}

/**
 * @description Saga that handles marking all notifications as read
 * @returns {Generator} Redux saga generator function
 */
function* markAllNotificationsReadSaga(): Generator {
  try {
    // LD1: Try to call notificationService.markAllAsRead
    yield call(notificationService.markAllAsRead);

    // LD2: If successful, dispatch markAllNotificationsReadSuccess
    yield put(markAllNotificationsReadSuccess());
  } catch (error: any) {
    // LD3: If an error occurs, log the error and dispatch markAllNotificationsReadFailure with the error message
    logger.error('Failed to mark all notifications as read', {
      component: 'notificationSaga',
      error,
    });
    yield put(markAllNotificationsReadFailure(error.message));
  }
}

/**
 * @description Saga that handles deleting a specific notification
 * @param {object} action - The action object containing the payload with the notification ID
 * @returns {Generator} Redux saga generator function
 */
function* deleteNotificationSaga(action: { payload: string }): Generator {
  // LD1: Extract notification ID from action payload
  const notificationId: string = action.payload;

  try {
    // LD2: Try to call notificationService.deleteNotification with the notification ID
    yield call(notificationService.deleteNotification, notificationId);

    // LD3: If successful, dispatch deleteNotificationSuccess with the notification ID
    yield put(deleteNotificationSuccess(notificationId));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch deleteNotificationFailure with the error message
    logger.error('Failed to delete notification', {
      component: 'notificationSaga',
      notificationId,
      error,
    });
    yield put(deleteNotificationFailure(error.message));
  }
}

/**
 * @description Saga that handles subscribing to real-time notification updates via WebSocket
 * @returns {Generator} Redux saga generator function
 */
function* subscribeNotificationsSaga(): Generator {
  try {
    // LD1: Create a handler function for incoming notifications that dispatches notificationReceived action
    const onNotification = (notification: Notification) => {
      put(notificationReceived(notification));
    };

    // LD2: Create a handler function for notification read status updates that dispatches notificationRead action
    const onNotificationRead = (notificationId: string, read: boolean) => {
      put(notificationRead({ notificationId, read }));
    };

    // LD3: Try to call notificationService.subscribeToNotifications with the handlers
    const unsubscribe: any = yield call(notificationService.subscribeToNotifications, onNotification);

    // LD4: If successful, dispatch subscribeNotificationsSuccess with the unsubscribe function
    yield put(subscribeNotificationsSuccess(unsubscribe));

    // LD5: Use the cancelled effect to check if the saga was cancelled
    yield cancelled();
  } catch (error: any) {
    // LD6: If an error occurs, log the error and dispatch subscribeNotificationsFailure with the error message
    logger.error('Failed to subscribe to notifications', {
      component: 'notificationSaga',
      error,
    });
    yield put(subscribeNotificationsFailure(error.message));
  } finally {
    // LD7: If cancelled, call the unsubscribe function to clean up the WebSocket connection
    if (yield cancelled()) {
      yield put(unsubscribeNotifications());
    }
  }
}

/**
 * @description Saga that handles unsubscribing from real-time notification updates
 * @returns {Generator} Redux saga generator function
 */
function* unsubscribeNotificationsSaga(): Generator {
  // LD1: Use select effect to get the unsubscribe function from the state
  const unsubscribe: any = yield select((state) => state.notifications.unsubscribe);

  // LD2: If the unsubscribe function exists, call it to close the WebSocket connection
  if (unsubscribe) {
    unsubscribe();
  }
}

/**
 * @description Saga that handles fetching notification preferences for the current user
 * @returns {Generator} Redux saga generator function
 */
function* fetchNotificationPreferencesSaga(): Generator {
  try {
    // LD1: Try to call notificationService.getUserPreferences
    const preferences: any = yield call(notificationService.getUserPreferences);

    // LD2: If successful, dispatch fetchNotificationPreferencesSuccess with the preferences
    yield put(fetchNotificationPreferencesSuccess(preferences));
  } catch (error: any) {
    // LD3: If an error occurs, log the error and dispatch fetchNotificationPreferencesFailure with the error message
    logger.error('Failed to fetch notification preferences', {
      component: 'notificationSaga',
      error,
    });
    yield put(fetchNotificationPreferencesFailure(error.message));
  }
}

/**
 * @description Saga that handles updating notification preferences for the current user
 * @param {object} action - The action object containing the payload with the preference update data
 * @returns {Generator} Redux saga generator function
 */
function* updateNotificationPreferencesSaga(action: { payload: any }): Generator {
  // LD1: Extract preference update data from action payload
  const preferences: any = action.payload;

  try {
    // LD2: Try to call notificationService.updateUserPreferences with the update data
    const updatedPreferences: any = yield call(
      notificationService.updateUserPreferences,
      preferences
    );

    // LD3: If successful, dispatch updateNotificationPreferencesSuccess with the updated preferences
    yield put(updateNotificationPreferencesSuccess(updatedPreferences));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch updateNotificationPreferencesFailure with the error message
    logger.error('Failed to update notification preferences', {
      component: 'notificationSaga',
      error,
    });
    yield put(updateNotificationPreferencesFailureAction(error.message));
  }
}

/**
 * @description Root saga watcher that listens for notification-related actions and triggers the appropriate sagas
 * @returns {Generator} Redux saga generator function
 */
function* watchNotifications(): Generator {
  // LD1: Yield all to combine multiple takeLatest effects
  yield all([
    // LD2: Use takeLatest for FETCH_NOTIFICATIONS_REQUEST to handle fetchNotificationsSaga
    takeLatest(actionTypes.FETCH_NOTIFICATIONS_REQUEST, fetchNotificationsSaga),

    // LD3: Use takeLatest for FETCH_UNREAD_COUNT_REQUEST to handle fetchUnreadCountSaga
    takeLatest(actionTypes.FETCH_UNREAD_COUNT_REQUEST, fetchUnreadCountSaga),

    // LD4: Use takeLatest for MARK_NOTIFICATION_READ_REQUEST to handle markNotificationReadSaga
    takeLatest(actionTypes.MARK_NOTIFICATION_READ_REQUEST, markNotificationReadSaga),

    // LD5: Use takeLatest for MARK_ALL_NOTIFICATIONS_READ_REQUEST to handle markAllNotificationsReadSaga
    takeLatest(
      actionTypes.MARK_ALL_NOTIFICATIONS_READ_REQUEST,
      markAllNotificationsReadSaga
    ),

    // LD6: Use takeLatest for DELETE_NOTIFICATION_REQUEST to handle deleteNotificationSaga
    takeLatest(actionTypes.DELETE_NOTIFICATION_REQUEST, deleteNotificationSaga),

    // LD7: Use takeLatest for SUBSCRIBE_NOTIFICATIONS_REQUEST to handle subscribeNotificationsSaga
    takeLatest(
      actionTypes.SUBSCRIBE_NOTIFICATIONS_REQUEST,
      subscribeNotificationsSaga
    ),

    // LD8: Use takeLatest for UNSUBSCRIBE_NOTIFICATIONS to handle unsubscribeNotificationsSaga
    takeLatest(actionTypes.UNSUBSCRIBE_NOTIFICATIONS, unsubscribeNotificationsSaga),

    // LD9: Use takeLatest for FETCH_NOTIFICATION_PREFERENCES_REQUEST to handle fetchNotificationPreferencesSaga
    takeLatest(
      actionTypes.FETCH_NOTIFICATION_PREFERENCES_REQUEST,
      fetchNotificationPreferencesSaga
    ),

    // LD10: Use takeLatest for UPDATE_NOTIFICATION_PREFERENCES_REQUEST to handle updateNotificationPreferencesSaga
    takeLatest(
      actionTypes.UPDATE_NOTIFICATION_PREFERENCES_REQUEST,
      updateNotificationPreferencesSaga
    ),
  ]);
}

// IE3: Export the root saga watcher for notification-related actions to be used in the root saga
export default watchNotifications;