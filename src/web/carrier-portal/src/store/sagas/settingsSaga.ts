# src/web/carrier-portal/src/store/sagas/settingsSaga.ts
```typescript
import { put, call, takeLatest, all, fork } from 'redux-saga/effects'; // redux-saga/effects ^1.1.0
import settingsService from '../../services/settingsService';
import integrationService from '../../services/integrationService';
import logger from '../../../common/utils/logger';
import {
  GET_USER_PROFILE_REQUEST,
  GET_USER_PROFILE_SUCCESS,
  GET_USER_PROFILE_FAILURE,
  UPDATE_USER_PROFILE_REQUEST,
  UPDATE_USER_PROFILE_SUCCESS,
  UPDATE_USER_PROFILE_FAILURE,
  UPLOAD_PROFILE_IMAGE_REQUEST,
  UPLOAD_PROFILE_IMAGE_SUCCESS,
  UPLOAD_PROFILE_IMAGE_FAILURE,
  GET_COMPANY_SETTINGS_REQUEST,
  GET_COMPANY_SETTINGS_SUCCESS,
  GET_COMPANY_SETTINGS_FAILURE,
  UPDATE_COMPANY_SETTINGS_REQUEST,
  UPDATE_COMPANY_SETTINGS_SUCCESS,
  UPDATE_COMPANY_SETTINGS_FAILURE,
  UPLOAD_COMPANY_LOGO_REQUEST,
  UPLOAD_COMPANY_LOGO_SUCCESS,
  UPLOAD_COMPANY_LOGO_FAILURE,
  GET_NOTIFICATION_SETTINGS_REQUEST,
  GET_NOTIFICATION_SETTINGS_SUCCESS,
  GET_NOTIFICATION_SETTINGS_FAILURE,
  UPDATE_NOTIFICATION_SETTINGS_REQUEST,
  UPDATE_NOTIFICATION_SETTINGS_SUCCESS,
  UPDATE_NOTIFICATION_SETTINGS_FAILURE,
  GET_INTEGRATION_SETTINGS_REQUEST,
  GET_INTEGRATION_SETTINGS_SUCCESS,
  GET_INTEGRATION_SETTINGS_FAILURE,
  GET_ELD_CONNECTIONS_REQUEST,
  GET_ELD_CONNECTIONS_SUCCESS,
  GET_ELD_CONNECTIONS_FAILURE,
  GET_TMS_CONNECTIONS_REQUEST,
  GET_TMS_CONNECTIONS_SUCCESS,
  GET_TMS_CONNECTIONS_FAILURE,
    GET_PAYMENT_METHODS_REQUEST,
    GET_PAYMENT_METHODS_SUCCESS,
    GET_PAYMENT_METHODS_FAILURE,
  GET_API_KEYS_REQUEST,
  GET_API_KEYS_SUCCESS,
  GET_API_KEYS_FAILURE,
  CREATE_API_KEY_REQUEST,
  CREATE_API_KEY_SUCCESS,
  CREATE_API_KEY_FAILURE,
  REVOKE_API_KEY_REQUEST,
  REVOKE_API_KEY_SUCCESS,
  REVOKE_API_KEY_FAILURE,
    GET_USER_LIST_REQUEST,
    GET_USER_LIST_SUCCESS,
    GET_USER_LIST_FAILURE,
    INVITE_USER_REQUEST,
    INVITE_USER_SUCCESS,
    INVITE_USER_FAILURE,
    UPDATE_USER_ROLE_REQUEST,
    UPDATE_USER_ROLE_SUCCESS,
    UPDATE_USER_ROLE_FAILURE,
    DEACTIVATE_USER_REQUEST,
    DEACTIVATE_USER_SUCCESS,
    DEACTIVATE_USER_FAILURE,
    REACTIVATE_USER_REQUEST,
    REACTIVATE_USER_SUCCESS,
    REACTIVATE_USER_FAILURE,
} from '../actions/settingsActions';
import { UserProfile, CarrierUpdateParams } from '../../../common/interfaces/user.interface';
import { NotificationSettings } from '../../services/settingsService';

/**
 * Saga worker that handles fetching user profile data
 */
function* getUserProfileSaga(): Generator<any, void, UserProfile> {
  try {
    // Try to call settingsService.getUserProfile()
    const profile: UserProfile = yield call(settingsService.getUserProfile);
    // If successful, dispatch GET_USER_PROFILE_SUCCESS with the profile data
    yield put({ type: GET_USER_PROFILE_SUCCESS, payload: profile });
  } catch (error: any) {
    // If error occurs, dispatch GET_USER_PROFILE_FAILURE with the error message
    yield put({ type: GET_USER_PROFILE_FAILURE, payload: error.message });
    // Log any errors that occur
    logger.error('Failed to fetch user profile', { error });
  }
}

/**
 * Saga worker that handles updating user profile data
 * @param action Action
 */
function* updateUserProfileSaga(action: { type: string; payload: UserProfile }): Generator<any, void, any> {
  try {
    // Extract profile data from action.payload
    const profileData: UserProfile = action.payload;
    // Try to call settingsService.updateUserProfile(profileData)
    const updatedProfile: UserProfile = yield call(settingsService.updateUserProfile, profileData);
    // If successful, dispatch UPDATE_USER_PROFILE_SUCCESS with the updated profile
    yield put({ type: UPDATE_USER_PROFILE_SUCCESS, payload: updatedProfile });
  } catch (error: any) {
    // If error occurs, dispatch UPDATE_USER_PROFILE_FAILURE with the error message
    yield put({ type: UPDATE_USER_PROFILE_FAILURE, payload: error.message });
    // Log any errors that occur
    logger.error('Failed to update user profile', { error });
  }
}

/**
 * Saga worker that handles uploading user profile image
 * @param action Action
 */
function* uploadProfileImageSaga(action: { type: string; payload: File }): Generator<any, void, any> {
  try {
    // Extract image file from action.payload
    const imageFile: File = action.payload;
    // Try to call settingsService.uploadProfileImage(imageFile)
    const result: { imageUrl: string } = yield call(settingsService.uploadProfileImage, imageFile);
    // If successful, dispatch UPLOAD_PROFILE_IMAGE_SUCCESS with the image URL
    yield put({ type: UPLOAD_PROFILE_IMAGE_SUCCESS, payload: result.imageUrl });
  } catch (error: any) {
    // If error occurs, dispatch UPLOAD_PROFILE_IMAGE_FAILURE with the error message
    yield put({ type: UPLOAD_PROFILE_IMAGE_FAILURE, payload: error.message });
    // Log any errors that occur
    logger.error('Failed to upload profile image', { error });
  }
}

/**
 * Saga worker that handles fetching company settings
 */
function* getCompanySettingsSaga(): Generator<any, void, any> {
  try {
    // Try to call settingsService.getCompanySettings()
    const companyData = yield call(settingsService.getCompanySettings);
    // If successful, dispatch GET_COMPANY_SETTINGS_SUCCESS with the company data
    yield put({ type: GET_COMPANY_SETTINGS_SUCCESS, payload: companyData });
  } catch (error: any) {
    // If error occurs, dispatch GET_COMPANY_SETTINGS_FAILURE with the error message
    yield put({ type: GET_COMPANY_SETTINGS_FAILURE, payload: error.message });
    // Log any errors that occur
    logger.error('Failed to fetch company settings', { error });
  }
}

/**
 * Saga worker that handles updating company settings
 * @param action Action
 */
function* updateCompanySettingsSaga(action: { type: string; payload: CarrierUpdateParams }): Generator<any, void, any> {
  try {
    // Extract company data from action.payload
    const companyData: CarrierUpdateParams = action.payload;
    // Try to call settingsService.updateCompanySettings(companyData)
    const updatedCompanyData = yield call(settingsService.updateCompanySettings, companyData);
    // If successful, dispatch UPDATE_COMPANY_SETTINGS_SUCCESS with the updated company data
    yield put({ type: UPDATE_COMPANY_SETTINGS_SUCCESS, payload: updatedCompanyData });
  } catch (error: any) {
    // If error occurs, dispatch UPDATE_COMPANY_SETTINGS_FAILURE with the error message
    yield put({ type: UPDATE_COMPANY_SETTINGS_FAILURE, payload: error.message });
    // Log any errors that occur
    logger.error('Failed to update company settings', { error });
  }
}

/**
 * Saga worker that handles uploading company logo
 * @param action Action
 */
function* uploadCompanyLogoSaga(action: { type: string; payload: File }): Generator<any, void, any> {
  try {
    // Extract logo file from action.payload
    const logoFile: File = action.payload;
    // Try to call settingsService.uploadCompanyLogo(logoFile)
    const result: { logoUrl: string } = yield call(settingsService.uploadCompanyLogo, logoFile);
    // If successful, dispatch UPLOAD_COMPANY_LOGO_SUCCESS with the logo URL
    yield put({ type: UPLOAD_COMPANY_LOGO_SUCCESS, payload: result.logoUrl });
  } catch (error: any) {
    // If error occurs, dispatch UPLOAD_COMPANY_LOGO_FAILURE with the error message
    yield put({ type: UPLOAD_COMPANY_LOGO_FAILURE, payload: error.message });
    // Log any errors that occur
    logger.error('Failed to upload company logo', { error });
  }
}

/**
 * Saga worker that handles fetching notification settings
 */
function* getNotificationSettingsSaga(): Generator<any, void, NotificationSettings> {
  try {
    // Try to call settingsService.getNotificationSettings()
    const settingsData: NotificationSettings = yield call(settingsService.getNotificationSettings);
    // If successful, dispatch GET_NOTIFICATION_SETTINGS_SUCCESS with the settings data
    yield put({ type: GET_NOTIFICATION_SETTINGS_SUCCESS, payload: settingsData });
  } catch (error: any) {
    // If error occurs, dispatch GET_NOTIFICATION_SETTINGS_FAILURE with the error message
    yield put({ type: GET_NOTIFICATION_SETTINGS_FAILURE, payload: error.message });
    // Log any errors that occur
    logger.error('Failed to fetch notification settings', { error });
  }
}

/**
 * Saga worker that handles updating notification settings
 * @param action Action
 */
function* updateNotificationSettingsSaga(action: { type: string; payload: NotificationSettings }): Generator<any, void, any> {
  try {
    // Extract notification settings from action.payload
    const settings: NotificationSettings = action.payload;
    // Try to call settingsService.updateNotificationSettings(settings)
    const updatedSettings: NotificationSettings = yield call(settingsService.updateNotificationSettings, settings);
    // If successful, dispatch UPDATE_NOTIFICATION_SETTINGS_SUCCESS with the updated settings
    yield put({ type: UPDATE_NOTIFICATION_SETTINGS_SUCCESS, payload: updatedSettings });
  } catch (error: any) {
    // If error occurs, dispatch UPDATE_NOTIFICATION_SETTINGS_FAILURE with the error message
    yield put({ type: UPDATE_NOTIFICATION_SETTINGS_FAILURE, payload: error.message });
    // Log any errors that occur
    logger.error('Failed to update notification settings', { error });
  }
}

/**
 * Saga worker that handles fetching integration settings
 */
function* getIntegrationSettingsSaga(): Generator<any, void, any> {
    try {
        // Get carrier ID from state
        const carrierId = 'carrierId'; // TODO: Replace with actual carrier ID retrieval
        // Try to call integrationService.getIntegrationSettings(carrierId)
        const settingsData = yield call(integrationService.getIntegrationSettings, carrierId);
        // If successful, dispatch GET_INTEGRATION_SETTINGS_SUCCESS with the settings data
        yield put({ type: GET_INTEGRATION_SETTINGS_SUCCESS, payload: settingsData });
    } catch (error: any) {
        // If error occurs, dispatch GET_INTEGRATION_SETTINGS_FAILURE with the error message
        yield put({ type: GET_INTEGRATION_SETTINGS_FAILURE, payload: error.message });
        // Log any errors that occur
        logger.error('Failed to fetch integration settings', { error });
    }
}

/**
 * Saga worker that handles fetching ELD connections
 */
function* getEldConnectionsSaga(): Generator<any, void, any> {
    try {
        // Get carrier ID from state
        const carrierId = 'carrierId'; // TODO: Replace with actual carrier ID retrieval
        // Try to call integrationService.getEldConnections(carrierId)
        const connectionsData = yield call(integrationService.getEldConnections, carrierId);
        // If successful, dispatch GET_ELD_CONNECTIONS_SUCCESS with the connections data
        yield put({ type: GET_ELD_CONNECTIONS_SUCCESS, payload: connectionsData });
    } catch (error: any) {
        // If error occurs, dispatch GET_ELD_CONNECTIONS_FAILURE with the error message
        yield put({ type: GET_ELD_CONNECTIONS_FAILURE, payload: error.message });
        // Log any errors that occur
        logger.error('Failed to fetch ELD connections', { error });
    }
}

/**
 * Saga worker that handles fetching TMS connections
 */
function* getTmsConnectionsSaga(): Generator<any, void, any> {
    try {
        // Get carrier ID from state
        const carrierId = 'carrierId'; // TODO: Replace with actual carrier ID retrieval
        // Try to call integrationService.getTmsConnections(carrierId)
        const connectionsData = yield call(integrationService.getTmsConnections, carrierId);
        // If successful, dispatch GET_TMS_CONNECTIONS_SUCCESS with the connections data
        yield put({ type: GET_TMS_CONNECTIONS_SUCCESS, payload: connectionsData });
    } catch (error: any) {
        // If error occurs, dispatch GET_TMS_CONNECTIONS_FAILURE with the error message
        yield put({ type: GET_TMS_CONNECTIONS_FAILURE, payload: error.message });
        // Log any errors that occur
        logger.error('Failed to fetch TMS connections', { error });
    }
}

/**
 * Saga worker that handles fetching payment methods
 */
function* getPaymentMethodsSaga(): Generator<any, void, any> {
    try {
        // Get carrier ID from state
        const carrierId = 'carrierId'; // TODO: Replace with actual carrier ID retrieval
        // Try to call integrationService.getPaymentMethods(carrierId)
        const paymentMethodsData = yield call(integrationService.getPaymentMethods, carrierId);
        // If successful, dispatch GET_PAYMENT_METHODS_SUCCESS with the payment methods data
        yield put({ type: GET_PAYMENT_METHODS_SUCCESS, payload: paymentMethodsData });
    } catch (error: any) {
        // If error occurs, dispatch GET_PAYMENT_METHODS_FAILURE with the error message
        yield put({ type: GET_PAYMENT_METHODS_FAILURE, payload: error.message });
        // Log any errors that occur
        logger.error('Failed to fetch payment methods', { error });
    }
}

/**
 * Saga worker that handles fetching API keys
 */
function* getApiKeysSaga(): Generator<any, void, any> {
    try {
        // Get carrier ID from state
        const carrierId = 'carrierId'; // TODO: Replace with actual carrier ID retrieval
        // Try to call integrationService.getApiKeys(carrierId)
        const apiKeysData = yield call(integrationService.getApiKeys, carrierId);
        // If successful, dispatch GET_API_KEYS_SUCCESS with the API keys data
        yield put({ type: GET_API_KEYS_SUCCESS, payload: apiKeysData });
    } catch (error: any) {
        // If error occurs, dispatch GET_API_KEYS_FAILURE with the error message
        yield put({ type: GET_API_KEYS_FAILURE, payload: error.message });
        // Log any errors that occur
        logger.error('Failed to fetch API keys', { error });
    }
}

/**
 * Saga worker that handles creating a new API key
 * @param action Action
 */
function* createApiKeySaga(action: { type: string; payload: any }): Generator<any, void, any> {
    try {
        // Get carrier ID from state
        const carrierId = 'carrierId'; // TODO: Replace with actual carrier ID retrieval
        // Extract key data from action.payload
        const keyData = action.payload;
        // Try to call integrationService.createApiKey(carrierId, keyData)
        const newApiKeyData = yield call(integrationService.createApiKey, carrierId, keyData);
        // If successful, dispatch CREATE_API_KEY_SUCCESS with the new key data
        yield put({ type: CREATE_API_KEY_SUCCESS, payload: newApiKeyData });
    } catch (error: any) {
        // If error occurs, dispatch CREATE_API_KEY_FAILURE with the error message
        yield put({ type: CREATE_API_KEY_FAILURE, payload: error.message });
        // Log any errors that occur
        logger.error('Failed to create API key:', error);
    }
}

/**
 * Saga worker that handles revoking an API key
 * @param action Action
 */
function* revokeApiKeySaga(action: { type: string; payload: string }): Generator<any, void, any> {
    try {
        // Extract key ID from action.payload
        const keyId = action.payload;
        // Try to call integrationService.revokeApiKey(keyId)
        yield call(integrationService.revokeApiKey, keyId);
        // If successful, dispatch REVOKE_API_KEY_SUCCESS with the key ID
        yield put({ type: REVOKE_API_KEY_SUCCESS, payload: keyId });
    } catch (error: any) {
        // If error occurs, dispatch REVOKE_API_KEY_FAILURE with the error message
        yield put({ type: REVOKE_API_KEY_FAILURE, payload: error.message });
        // Log any errors that occur
        logger.error('Failed to revoke API key:', error);
    }
}

/**
 * Saga worker that handles fetching the list of users
 * @param action Action
 */
function* getUserListSaga(action: { type: string; payload: any }): Generator<any, void, any> {
    try {
        // Extract pagination parameters from action.payload
        const params = action.payload;
        // Try to call a service method to get the user list
        // const { users, total } = yield call(userService.getUsers, params);
        const users = [];
        const total = 0;
        // If successful, dispatch GET_USER_LIST_SUCCESS with the users and total count
        yield put({
            type: GET_USER_LIST_SUCCESS,
            payload: { users, total },
        });
    } catch (error: any) {
        // If error occurs, dispatch GET_USER_LIST_FAILURE with the error message
        yield put({
            type: GET_USER_LIST_FAILURE,
            payload: error.message,
        });
        // Log any errors that occur
        logger.error('Error fetching user list:', error);
    }
}

/**
 * Saga worker that handles inviting a new user
 * @param action Action
 */
function* inviteUserSaga(action: { type: string; payload: any }): Generator<any, void, any> {
    try {
        // Extract user data from action.payload
        const userData = action.payload;
        // Try to call a service method to invite a new user
        // const message = yield call(userService.inviteUser(userData);
        const message = 'Success';
        // If successful, dispatch INVITE_USER_SUCCESS with success message
        yield put({
            type: INVITE_USER_SUCCESS,
            payload: message,
        });
    } catch (error: any) {
        // If error occurs, dispatch INVITE_USER_FAILURE with the error message
        yield put({
            type: INVITE_USER_FAILURE,
            payload: error.message,
        });
        // Log any errors that occur
        logger.error('Error inviting user:', error);
    }
}

/**
 * Saga worker that handles updating a user's role
 * @param action Action
 */
function* updateUserRoleSaga(action: { type: string; payload: any }): Generator<any, void, any> {
    try {
        // Extract user ID and role from action.payload
        const { userId, role } = action.payload;
        // Try to call a service method to update the user's role
        // const user = yield call(userService.updateUserRole(userId, role);
        const user = {};
        // If successful, dispatch UPDATE_USER_ROLE_SUCCESS with the updated user data
        yield put({
            type: UPDATE_USER_ROLE_SUCCESS,
            payload: user,
        });
    } catch (error: any) {
        // If error occurs, dispatch UPDATE_USER_ROLE_FAILURE with the error message
        yield put({
            type: UPDATE_USER_ROLE_FAILURE,
            payload: error.message,
        });
        // Log any errors that occur
        logger.error('Error updating user role:', error);
    }
}

/**
 * Saga worker that handles deactivating a user
 * @param action Action
 */
function* deactivateUserSaga(action: { type: string; payload: any }): Generator<any, void, any> {
    try {
        // Extract user ID from action.payload
        const { userId } = action.payload;
        // Try to call a service method to deactivate the user
        // const user = yield call(userService.deactivateUser(userId);
        const user = {};
        // If successful, dispatch DEACTIVATE_USER_SUCCESS with the updated user data
        yield put({
            type: DEACTIVATE_USER_SUCCESS,
            payload: user,
        });
    } catch (error: any) {
        // If error occurs, dispatch DEACTIVATE_USER_FAILURE with the error message
        yield put({
            type: DEACTIVATE_USER_FAILURE,
            payload: error.message,
        });
        // Log any errors that occur
        logger.error('Error deactivating user:', error);
    }
}

/**
 * Saga worker that handles reactivating a user
 * @param action Action
 */
function* reactivateUserSaga(action: { type: string; payload: any }): Generator<any, void, any> {
    try {
        // Extract user ID from action.payload
        const { userId } = action.payload;
        // Try to call a service method to reactivate the user
        // const user = yield call(userService.reactivateUser(userId);
        const user = {};
        // If successful, dispatch REACTIVATE_USER_SUCCESS with the updated user data
        yield put({
            type: REACTIVATE_USER_SUCCESS,
            payload: user,
        });
    } catch (error: any) {
        // If error occurs, dispatch REACTIVATE_USER_FAILURE with the error message
        yield put({
            type: REACTIVATE_USER_FAILURE,
            payload: error.message,
        });
        // Log any errors that occur
        logger.error('Error reactivating user:', error);
    }
}

/**
 * Root saga watcher that listens for settings-related actions and triggers the appropriate saga workers
 */
function* watchSettings(): Generator<any, void, any> {
  // Use all effect to combine all saga watchers
  yield all([
    // Use takeLatest to watch for GET_USER_PROFILE_REQUEST and trigger getUserProfileSaga
    takeLatest(GET_USER_PROFILE_REQUEST, getUserProfileSaga),
    // Use takeLatest to watch for UPDATE_USER_PROFILE_REQUEST and trigger updateUserProfileSaga
    takeLatest(UPDATE_USER_PROFILE_REQUEST, updateUserProfileSaga),
    // Use takeLatest to watch for UPLOAD_PROFILE_IMAGE_REQUEST and trigger uploadProfileImageSaga
    takeLatest(UPLOAD_PROFILE_IMAGE_REQUEST, uploadProfileImageSaga),
    // Use takeLatest to watch for GET_COMPANY_SETTINGS_REQUEST and trigger getCompanySettingsSaga
    takeLatest(GET_COMPANY_SETTINGS_REQUEST, getCompanySettingsSaga),
    // Use takeLatest to watch for UPDATE_COMPANY_SETTINGS_REQUEST and trigger updateCompanySettingsSaga
    takeLatest(UPDATE_COMPANY_SETTINGS_REQUEST, updateCompanySettingsSaga),
    // Use takeLatest to watch for UPLOAD_COMPANY_LOGO_REQUEST and trigger uploadCompanyLogoSaga
    takeLatest(UPLOAD_COMPANY_LOGO_REQUEST, uploadCompanyLogoSaga),
    // Use takeLatest to watch for GET_NOTIFICATION_SETTINGS_REQUEST and trigger getNotificationSettingsSaga
    takeLatest(GET_NOTIFICATION_SETTINGS_REQUEST, getNotificationSettingsSaga),
    // Use takeLatest to watch for UPDATE_NOTIFICATION_SETTINGS_REQUEST and trigger updateNotificationSettingsSaga
    takeLatest(UPDATE_NOTIFICATION_SETTINGS_REQUEST, updateNotificationSettingsSaga),
        // Use takeLatest to watch for GET_INTEGRATION_SETTINGS_REQUEST and trigger getIntegrationSettingsSaga
        takeLatest(GET_INTEGRATION_SETTINGS_REQUEST, getIntegrationSettingsSaga),
        // Use takeLatest to watch for GET_ELD_CONNECTIONS_REQUEST and trigger getEldConnectionsSaga
        takeLatest(GET_ELD_CONNECTIONS_REQUEST, getEldConnectionsSaga),
        // Use takeLatest to watch for GET_TMS_CONNECTIONS_REQUEST and trigger getTmsConnectionsSaga
        takeLatest(GET_TMS_CONNECTIONS_REQUEST, getTmsConnectionsSaga),
        // Use takeLatest to watch for GET_PAYMENT_METHODS_REQUEST and trigger getPaymentMethodsSaga
        takeLatest(GET_PAYMENT_METHODS_REQUEST, getPaymentMethodsSaga),
        // Use takeLatest to watch for GET_API_KEYS_REQUEST and trigger getApiKeysSaga
        takeLatest(GET_API_KEYS_REQUEST, getApiKeysSaga),
        // Use takeLatest to watch for CREATE_API_KEY_REQUEST and trigger createApiKeySaga
        takeLatest(CREATE_API_KEY_REQUEST, createApiKeySaga),
        // Use takeLatest to watch for REVOKE_API_KEY_REQUEST and trigger revokeApiKeySaga
        takeLatest(REVOKE_API_KEY_REQUEST, revokeApiKeySaga),
        // Use takeLatest to watch for GET_USER_LIST_REQUEST and trigger getUserListSaga
        takeLatest(GET_USER_LIST_REQUEST, getUserListSaga),
        // Use takeLatest to watch for INVITE_USER_REQUEST and trigger inviteUserSaga
        takeLatest(INVITE_USER_REQUEST, inviteUserSaga),
        // Use takeLatest to watch for UPDATE_USER_ROLE_REQUEST and trigger updateUserRoleSaga
        takeLatest(UPDATE_USER_ROLE_REQUEST, updateUserRoleSaga),
        // Use takeLatest to watch for DEACTIVATE_USER_REQUEST and trigger deactivateUserSaga
        takeLatest(DEACTIVATE_USER_REQUEST, deactivateUserSaga),
        // Use takeLatest to watch for REACTIVATE_USER_REQUEST and trigger reactivateUserSaga
        takeLatest(REACTIVATE_USER_REQUEST, reactivateUserSaga),
  ]);
}

// Default export of the settings saga watcher for use in the root saga
export default watchSettings;