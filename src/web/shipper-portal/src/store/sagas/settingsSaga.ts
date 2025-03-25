# src/web/shipper-portal/src/store/sagas/settingsSaga.ts
```typescript
import { takeLatest, call, put, all, fork } from 'redux-saga/effects'; // ^1.1.3
import * as actionTypes from '../actions/settingsActions';
import settingsService from '../../../services/settingsService';
import authService from '../../../common/services/authService';
import notificationService from '../../../common/services/notificationService';

/**
 * Saga for fetching user settings
 */
function* fetchUserSettingsSaga(): Generator {
  try {
    // LD1: Try to fetch user settings using authService.getUserSettings
    const settings: any = yield call(authService.getUserSettings);

    // LD1: If successful, dispatch FETCH_USER_SETTINGS_SUCCESS action with the settings data
    yield put({ type: actionTypes.FETCH_USER_SETTINGS_SUCCESS, payload: settings });
  } catch (error: any) {
    // LD1: If an error occurs, dispatch FETCH_USER_SETTINGS_FAILURE action with the error message
    yield put({ type: actionTypes.FETCH_USER_SETTINGS_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for updating user settings
 * @param action 
 */
function* updateUserSettingsSaga(action: any): Generator {
  // LD1: Extract settings from action payload
  const { settings } = action.payload;

  try {
    // LD1: Try to update user settings using authService.updateUserSettings
    const updatedSettings: any = yield call(authService.updateUserSettings, settings);

    // LD1: If successful, dispatch UPDATE_USER_SETTINGS_SUCCESS action with the updated settings
    yield put({ type: actionTypes.UPDATE_USER_SETTINGS_SUCCESS, payload: updatedSettings });

    // LD1: Show success notification
    notificationService.showSuccess('User settings updated successfully');
  } catch (error: any) {
    // LD1: If an error occurs, dispatch UPDATE_USER_SETTINGS_FAILURE action with the error message
    yield put({ type: actionTypes.UPDATE_USER_SETTINGS_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for fetching user profile
 */
function* fetchUserProfileSaga(): Generator {
  try {
    // LD1: Try to fetch user profile using authService.getUserProfile
    const profile: any = yield call(authService.getUserProfile);

    // LD1: If successful, dispatch FETCH_USER_PROFILE_SUCCESS action with the profile data
    yield put({ type: actionTypes.FETCH_USER_PROFILE_SUCCESS, payload: profile });
  } catch (error: any) {
    // LD1: If an error occurs, dispatch FETCH_USER_PROFILE_FAILURE action with the error message
    yield put({ type: actionTypes.FETCH_USER_PROFILE_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for updating user profile
 * @param action 
 */
function* updateUserProfileSaga(action: any): Generator {
  // LD1: Extract profile data from action payload
  const { profile } = action.payload;

  try {
    // LD1: Try to update user profile using authService.updateUserProfile
    const updatedProfile: any = yield call(authService.updateUserProfile, profile);

    // LD1: If successful, dispatch UPDATE_USER_PROFILE_SUCCESS action with the updated profile
    yield put({ type: actionTypes.UPDATE_USER_PROFILE_SUCCESS, payload: updatedProfile });

    // LD1: Show success notification
    notificationService.showSuccess('User profile updated successfully');
  } catch (error: any) {
    // LD1: If an error occurs, dispatch UPDATE_USER_PROFILE_FAILURE action with the error message
    yield put({ type: actionTypes.UPDATE_USER_PROFILE_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for uploading profile image
 * @param action 
 */
function* uploadProfileImageSaga(action: any): Generator {
  // LD1: Extract image file from action payload
  const imageFile = action.payload;

  try {
    // LD1: Try to upload profile image using authService.uploadProfileImage
    const imageUrl: any = yield call(authService.uploadProfileImage, imageFile);

    // LD1: If successful, dispatch UPLOAD_PROFILE_IMAGE_SUCCESS action with the image URL
    yield put({ type: actionTypes.UPLOAD_PROFILE_IMAGE_SUCCESS, payload: imageUrl });

    // LD1: Show success notification
    notificationService.showSuccess('Profile image uploaded successfully');
  } catch (error: any) {
    // LD1: If an error occurs, dispatch UPLOAD_PROFILE_IMAGE_FAILURE action with the error message
    yield put({ type: actionTypes.UPLOAD_PROFILE_IMAGE_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for fetching company settings
 * @param action 
 */
function* fetchCompanySettingsSaga(action: any): Generator {
  // LD1: Extract shipperId from action payload
  const { shipperId } = action.payload;

  try {
    // LD1: Try to fetch company settings using settingsService.getCompanySettings
    const company: any = yield call(settingsService.getCompanySettings, shipperId);

    // LD1: If successful, dispatch FETCH_COMPANY_SETTINGS_SUCCESS action with the company data
    yield put({ type: actionTypes.FETCH_COMPANY_SETTINGS_SUCCESS, payload: company });
  } catch (error: any) {
    // LD1: If an error occurs, dispatch FETCH_COMPANY_SETTINGS_FAILURE action with the error message
    yield put({ type: actionTypes.FETCH_COMPANY_SETTINGS_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for updating company settings
 * @param action 
 */
function* updateCompanySettingsSaga(action: any): Generator {
  // LD1: Extract shipperId and settings from action payload
  const { shipperId, settings } = action.payload;

  try {
    // LD1: Try to update company settings using settingsService.updateCompanySettings
    const updatedCompany: any = yield call(settingsService.updateCompanySettings, shipperId, settings);

    // LD1: If successful, dispatch UPDATE_COMPANY_SETTINGS_SUCCESS action with the updated company data
    yield put({ type: actionTypes.UPDATE_COMPANY_SETTINGS_SUCCESS, payload: updatedCompany });

    // LD1: Show success notification
    notificationService.showSuccess('Company settings updated successfully');
  } catch (error: any) {
    // LD1: If an error occurs, dispatch UPDATE_COMPANY_SETTINGS_FAILURE action with the error message
    yield put({ type: actionTypes.UPDATE_COMPANY_SETTINGS_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for uploading company logo
 * @param action 
 */
function* uploadCompanyLogoSaga(action: any): Generator {
  // LD1: Extract shipperId and logo file from action payload
  const { shipperId, logo } = action.payload;

  try {
    // LD1: Try to upload company logo using settingsService.uploadCompanyLogo
    const logoUrl: any = yield call(settingsService.uploadCompanyLogo, shipperId, logo);

    // LD1: If successful, dispatch UPLOAD_COMPANY_LOGO_SUCCESS action with the logo URL
    yield put({ type: actionTypes.UPLOAD_COMPANY_LOGO_SUCCESS, payload: logoUrl });

    // LD1: Show success notification
    notificationService.showSuccess('Company logo uploaded successfully');
  } catch (error: any) {
    // LD1: If an error occurs, dispatch UPLOAD_COMPANY_LOGO_FAILURE action with the error message
    yield put({ type: actionTypes.UPLOAD_COMPANY_LOGO_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for fetching notification settings
 */
function* fetchNotificationSettingsSaga(): Generator {
  try {
    // LD1: Get current user ID from state or session
    // Placeholder: Replace with actual logic to get user ID
    const userId = 'current-user-id';

    // LD1: Try to fetch notification preferences using settingsService.getNotificationPreferences
    const preferences: any = yield call(settingsService.getNotificationPreferences, userId);

    // LD1: If successful, dispatch FETCH_NOTIFICATION_SETTINGS_SUCCESS action with the preferences data
    yield put({ type: actionTypes.FETCH_NOTIFICATION_SETTINGS_SUCCESS, payload: preferences });
  } catch (error: any) {
    // LD1: If an error occurs, dispatch FETCH_NOTIFICATION_SETTINGS_FAILURE action with the error message
    yield put({ type: actionTypes.FETCH_NOTIFICATION_SETTINGS_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for updating notification settings
 * @param action 
 */
function* updateNotificationSettingsSaga(action: any): Generator {
  // LD1: Extract notification settings from action payload
  const { settings } = action.payload;

  try {
    // LD1: Get current user ID from state or session
    // Placeholder: Replace with actual logic to get user ID
    const userId = 'current-user-id';

    // LD1: Try to update notification preferences using settingsService.updateNotificationPreferences
    yield call(settingsService.updateNotificationPreferences, userId, settings);

    // LD1: If successful, dispatch UPDATE_NOTIFICATION_SETTINGS_SUCCESS action with the updated preferences
    yield put({ type: actionTypes.UPDATE_NOTIFICATION_SETTINGS_SUCCESS, payload: settings });

    // LD1: Show success notification
    notificationService.showSuccess('Notification settings updated successfully');
  } catch (error: any) {
    // LD1: If an error occurs, dispatch UPDATE_NOTIFICATION_SETTINGS_FAILURE action with the error message
    yield put({ type: actionTypes.UPDATE_NOTIFICATION_SETTINGS_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for fetching integration settings
  * @param action 
 */
function* fetchIntegrationSettingsSaga(action: any): Generator {
    // LD1: Extract shipperId from action payload
    const { shipperId } = action.payload;

    try {
        // LD1: Try to fetch integration settings using settingsService.getIntegrationSettings
        const integrationSettings: any = yield call(settingsService.getIntegrationSettings, shipperId);

        // LD1: If successful, dispatch FETCH_INTEGRATION_SETTINGS_SUCCESS action with the settings data
        yield put({ type: actionTypes.FETCH_INTEGRATION_SETTINGS_SUCCESS, payload: integrationSettings });
    } catch (error: any) {
        // LD1: If an error occurs, dispatch FETCH_INTEGRATION_SETTINGS_FAILURE action with the error message
        yield put({ type: actionTypes.FETCH_INTEGRATION_SETTINGS_FAILURE, message: error.message });

        // LD1: Show error notification if the request fails
        notificationService.showError(error.message);
    }
}

/**
 * Saga for fetching TMS connections
 * @param action 
 */
function* fetchTmsConnectionsSaga(action: any): Generator {
    // LD1: Extract shipperId from action payload
    const { shipperId } = action.payload;

    try {
        // LD1: Try to fetch TMS connections using settingsService.getTmsConnections
        const tmsConnections: any = yield call(settingsService.getTmsConnections, shipperId);

        // LD1: If successful, dispatch FETCH_TMS_CONNECTIONS_SUCCESS action with the connections data
        yield put({ type: actionTypes.FETCH_TMS_CONNECTIONS_SUCCESS, payload: tmsConnections });
    } catch (error: any) {
        // LD1: If an error occurs, dispatch FETCH_TMS_CONNECTIONS_FAILURE action with the error message
        yield put({ type: actionTypes.FETCH_TMS_CONNECTIONS_FAILURE, message: error.message });

        // LD1: Show error notification if the request fails
        notificationService.showError(error.message);
    }
}

/**
 * Saga for fetching payment methods
 * @param action 
 */
function* fetchPaymentMethodsSaga(action: any): Generator {
    // LD1: Extract shipperId from action payload
    const { shipperId } = action.payload;

    try {
        // LD1: Try to fetch payment methods using settingsService.getPaymentMethods
        const paymentMethods: any = yield call(settingsService.getPaymentMethods, shipperId);

        // LD1: If successful, dispatch FETCH_PAYMENT_METHODS_SUCCESS action with the payment methods data
        yield put({ type: actionTypes.FETCH_PAYMENT_METHODS_SUCCESS, payload: paymentMethods });
    } catch (error: any) {
        // LD1: If an error occurs, dispatch FETCH_PAYMENT_METHODS_FAILURE action with the error message
        yield put({ type: actionTypes.FETCH_PAYMENT_METHODS_FAILURE, message: error.message });

        // LD1: Show error notification if the request fails
        notificationService.showError(error.message);
    }
}

/**
 * Saga for fetching API keys
 * @param action 
 */
function* fetchApiKeysSaga(action: any): Generator {
  // LD1: Extract shipperId from action payload
  const { shipperId } = action.payload;

  try {
    // LD1: Try to fetch API keys using settingsService.getApiKeys
    const apiKeys: any = yield call(settingsService.getApiKeys, shipperId);

    // LD1: If successful, dispatch FETCH_API_KEYS_SUCCESS action with the API keys data
    yield put({ type: actionTypes.FETCH_API_KEYS_SUCCESS, payload: apiKeys });
  } catch (error: any) {
    // LD1: If an error occurs, dispatch FETCH_API_KEYS_FAILURE action with the error message
    yield put({ type: actionTypes.FETCH_API_KEYS_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for creating an API key
 * @param action 
 */
function* createApiKeySaga(action: any): Generator {
  // LD1: Extract shipperId and API key parameters from action payload
  const { shipperId, params } = action.payload;

  try {
    // LD1: Try to create API key using settingsService.createApiKey
    const { key, apiKey }: any = yield call(settingsService.createApiKey, shipperId, params);

    // LD1: If successful, dispatch CREATE_API_KEY_SUCCESS action with the new API key data
    yield put({ type: actionTypes.CREATE_API_KEY_SUCCESS, payload: { key, apiKey } });

    // LD1: Show success notification
    notificationService.showSuccess('API key created successfully');
  } catch (error: any) {
    // LD1: If an error occurs, dispatch CREATE_API_KEY_FAILURE action with the error message
    yield put({ type: actionTypes.CREATE_API_KEY_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for revoking an API key
 * @param action 
 */
function* revokeApiKeySaga(action: any): Generator {
  // LD1: Extract keyId from action payload
  const { keyId } = action.payload;

  try {
    // LD1: Try to revoke API key using settingsService.revokeApiKey
    yield call(settingsService.revokeApiKey, keyId);

    // LD1: If successful, dispatch REVOKE_API_KEY_SUCCESS action with the keyId
    yield put({ type: actionTypes.REVOKE_API_KEY_SUCCESS, payload: keyId });

    // LD1: Show success notification
    notificationService.showSuccess('API key revoked successfully');
  } catch (error: any) {
    // LD1: If an error occurs, dispatch REVOKE_API_KEY_FAILURE action with the error message
    yield put({ type: actionTypes.REVOKE_API_KEY_FAILURE, message: error.message });

    // LD1: Show error notification if the request fails
    notificationService.showError(error.message);
  }
}

/**
 * Saga for fetching users
 * @param action 
 */
function* fetchUsersSaga(action: any): Generator {
    // LD1: Extract shipperId and query parameters from action payload
    const { shipperId, params } = action.payload;

    try {
        // LD1: Try to fetch users using settingsService.getUserList
        const { users, total }: any = yield call(settingsService.getUserList, shipperId, params);

        // LD1: If successful, dispatch FETCH_USERS_SUCCESS action with the users data and total count
        yield put({ type: actionTypes.FETCH_USERS_SUCCESS, payload: { users, total } });
    } catch (error: any) {
        // LD1: If an error occurs, dispatch FETCH_USERS_FAILURE action with the error message
        yield put({ type: actionTypes.FETCH_USERS_FAILURE, message: error.message });

        // LD1: Show error notification if the request fails
        notificationService.showError(error.message);
    }
}

/**
 * Saga for inviting a user
 * @param action 
 */
function* inviteUserSaga(action: any): Generator {
    // LD1: Extract shipperId and invite parameters from action payload
    const { shipperId, params } = action.payload;

    try {
        // LD1: Try to invite user using settingsService.inviteUser
        yield call(settingsService.inviteUser, shipperId, params);

        // LD1: If successful, dispatch INVITE_USER_SUCCESS action
        yield put({ type: actionTypes.INVITE_USER_SUCCESS });

        // LD1: Show success notification
        notificationService.showSuccess('User invited successfully');
    } catch (error: any) {
        // LD1: If an error occurs, dispatch INVITE_USER_FAILURE action with the error message
        yield put({ type: actionTypes.INVITE_USER_FAILURE, message: error.message });

        // LD1: Show error notification if the request fails
        notificationService.showError(error.message);
    }
}

/**
 * Saga for updating a user's role
 * @param action 
 */
function* updateUserRoleSaga(action: any): Generator {
    // LD1: Extract userId and roleId from action payload
    const { userId, roleId } = action.payload;

    try {
        // LD1: Try to update user role using settingsService.updateUserRole
        yield call(settingsService.updateUserRole, userId, roleId);

        // LD1: If successful, dispatch UPDATE_USER_ROLE_SUCCESS action with the userId and roleId
        yield put({ type: actionTypes.UPDATE_USER_ROLE_SUCCESS, payload: { userId, roleId } });

        // LD1: Show success notification
        notificationService.showSuccess('User role updated successfully');
    } catch (error: any) {
        // LD1: If an error occurs, dispatch UPDATE_USER_ROLE_FAILURE action with the error message
        yield put({ type: actionTypes.UPDATE_USER_ROLE_FAILURE, message: error.message });

        // LD1: Show error notification if the request fails
        notificationService.showError(error.message);
    }
}

/**
 * Saga for deactivating a user
 * @param action 
 */
function* deactivateUserSaga(action: any): Generator {
    // LD1: Extract userId from action payload
    const { userId } = action.payload;

    try {
        // LD1: Try to deactivate user using settingsService.deactivateUser
        yield call(settingsService.deactivateUser, userId);

        // LD1: If successful, dispatch DEACTIVATE_USER_SUCCESS action with the userId
        yield put({ type: actionTypes.DEACTIVATE_USER_SUCCESS, payload: userId });

        // LD1: Show success notification
        notificationService.showSuccess('User deactivated successfully');
    } catch (error: any) {
        // LD1: If an error occurs, dispatch DEACTIVATE_USER_FAILURE action with the error message
        yield put({ type: actionTypes.DEACTIVATE_USER_FAILURE, message: error.message });

        // LD1: Show error notification if the request fails
        notificationService.showError(error.message);
    }
}

/**
 * Saga for reactivating a user
 * @param action 
 */
function* reactivateUserSaga(action: any): Generator {
    // LD1: Extract userId from action payload
    const { userId } = action.payload;

    try {
        // LD1: Try to reactivate user using settingsService.reactivateUser
        yield call(settingsService.reactivateUser, userId);

        // LD1: If successful, dispatch REACTIVATE_USER_SUCCESS action with the userId
        yield put({ type: actionTypes.REACTIVATE_USER_SUCCESS, payload: userId });

        // LD1: Show success notification
        notificationService.showSuccess('User reactivated successfully');
    } catch (error: any) {
        // LD1: If an error occurs, dispatch REACTIVATE_USER_FAILURE action with the error message
        yield put({ type: actionTypes.REACTIVATE_USER_FAILURE, message: error.message });

        // LD1: Show error notification if the request fails
        notificationService.showError(error.message);
    }
}

/**
 * Root saga that watches for settings-related actions
 */
function* watchSettings(): Generator {
  // LD1: Yield all to combine multiple takeLatest effects
  yield all([
    // LD2: Watch for FETCH_USER_SETTINGS_REQUEST and call fetchUserSettingsSaga
    takeLatest(actionTypes.FETCH_USER_SETTINGS_REQUEST, fetchUserSettingsSaga),

    // LD2: Watch for UPDATE_USER_SETTINGS_REQUEST and call updateUserSettingsSaga
    takeLatest(actionTypes.UPDATE_USER_SETTINGS_REQUEST, updateUserSettingsSaga),

    // LD2: Watch for FETCH_USER_PROFILE_REQUEST and call fetchUserProfileSaga
    takeLatest(actionTypes.FETCH_USER_PROFILE_REQUEST, fetchUserProfileSaga),

    // LD2: Watch for UPDATE_USER_PROFILE_REQUEST and call updateUserProfileSaga
    takeLatest(actionTypes.UPDATE_USER_PROFILE_REQUEST, updateUserProfileSaga),

    // LD2: Watch for UPLOAD_PROFILE_IMAGE_REQUEST and call uploadProfileImageSaga
    takeLatest(actionTypes.UPLOAD_PROFILE_IMAGE_REQUEST, uploadProfileImageSaga),

    // LD2: Watch for FETCH_COMPANY_SETTINGS_REQUEST and call fetchCompanySettingsSaga
    takeLatest(actionTypes.FETCH_COMPANY_SETTINGS_REQUEST, fetchCompanySettingsSaga),

    // LD2: Watch for UPDATE_COMPANY_SETTINGS_REQUEST and call updateCompanySettingsSaga
    takeLatest(actionTypes.UPDATE_COMPANY_SETTINGS_REQUEST, updateCompanySettingsSaga),

    // LD2: Watch for UPLOAD_COMPANY_LOGO_REQUEST and call uploadCompanyLogoSaga
    takeLatest(actionTypes.UPLOAD_COMPANY_LOGO_REQUEST, uploadCompanyLogoSaga),

    // LD2: Watch for FETCH_NOTIFICATION_SETTINGS_REQUEST and call fetchNotificationSettingsSaga
    takeLatest(actionTypes.FETCH_NOTIFICATION_SETTINGS_REQUEST, fetchNotificationSettingsSaga),

    // LD2: Watch for UPDATE_NOTIFICATION_SETTINGS_REQUEST and call updateNotificationSettingsSaga
    takeLatest(actionTypes.UPDATE_NOTIFICATION_SETTINGS_REQUEST, updateNotificationSettingsSaga),
    
    // LD2: Watch for FETCH_INTEGRATION_SETTINGS_REQUEST and call fetchIntegrationSettingsSaga
    takeLatest(actionTypes.FETCH_INTEGRATION_SETTINGS_REQUEST, fetchIntegrationSettingsSaga),

    // LD2: Watch for FETCH_TMS_CONNECTIONS_REQUEST and call fetchTmsConnectionsSaga
    takeLatest(actionTypes.FETCH_TMS_CONNECTIONS_REQUEST, fetchTmsConnectionsSaga),

    // LD2: Watch for FETCH_PAYMENT_METHODS_REQUEST and call fetchPaymentMethodsSaga
    takeLatest(actionTypes.FETCH_PAYMENT_METHODS_REQUEST, fetchPaymentMethodsSaga),

    // LD2: Watch for FETCH_API_KEYS_REQUEST and call fetchApiKeysSaga
    takeLatest(actionTypes.FETCH_API_KEYS_REQUEST, fetchApiKeysSaga),

    // LD2: Watch for CREATE_API_KEY_REQUEST and call createApiKeySaga
    takeLatest(actionTypes.CREATE_API_KEY_REQUEST, createApiKeySaga),

    // LD2: Watch for REVOKE_API_KEY_REQUEST and call revokeApiKeySaga
    takeLatest(actionTypes.REVOKE_API_KEY_REQUEST, revokeApiKeySaga),

    // LD2: Watch for FETCH_USERS_REQUEST and call fetchUsersSaga
    takeLatest(actionTypes.FETCH_USERS_REQUEST, fetchUsersSaga),

    // LD2: Watch for INVITE_USER_REQUEST and call inviteUserSaga
    takeLatest(actionTypes.INVITE_USER_REQUEST, inviteUserSaga),

    // LD2: Watch for UPDATE_USER_ROLE_REQUEST and call updateUserRoleSaga
    takeLatest(actionTypes.UPDATE_USER_ROLE_REQUEST, updateUserRoleSaga),

    // LD2: Watch for DEACTIVATE_USER_REQUEST and call deactivateUserSaga
    takeLatest(actionTypes.DEACTIVATE_USER_REQUEST, deactivateUserSaga),

    // LD2: Watch for REACTIVATE_USER_REQUEST and call reactivateUserSaga
    takeLatest(actionTypes.REACTIVATE_USER_REQUEST, reactivateUserSaga)
  ]);
}

// LD3: Export the watchSettings saga as the default export
export default watchSettings;