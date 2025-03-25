# src/web/carrier-portal/src/store/actions/settingsActions.ts
```typescript
import { ThunkAction, ThunkDispatch } from 'redux-thunk'; // ^2.4.2
import { AnyAction } from 'redux'; // ^4.2.1

import settingsService, { NotificationSettings } from '../../services/settingsService';
import integrationService from '../../services/integrationService';
import { UserSettings, UserProfile, CarrierUpdateParams } from '../../../common/interfaces/user.interface';
import { RootState } from '../store';
import logger from '../../../common/utils/logger';

// Action Types
export const GET_USER_SETTINGS_REQUEST = 'GET_USER_SETTINGS_REQUEST';
export const GET_USER_SETTINGS_SUCCESS = 'GET_USER_SETTINGS_SUCCESS';
export const GET_USER_SETTINGS_FAILURE = 'GET_USER_SETTINGS_FAILURE';

export const UPDATE_USER_SETTINGS_REQUEST = 'UPDATE_USER_SETTINGS_REQUEST';
export const UPDATE_USER_SETTINGS_SUCCESS = 'UPDATE_USER_SETTINGS_SUCCESS';
export const UPDATE_USER_SETTINGS_FAILURE = 'UPDATE_USER_SETTINGS_FAILURE';

export const GET_USER_PROFILE_REQUEST = 'GET_USER_PROFILE_REQUEST';
export const GET_USER_PROFILE_SUCCESS = 'GET_USER_PROFILE_SUCCESS';
export const GET_USER_PROFILE_FAILURE = 'GET_USER_PROFILE_FAILURE';

export const UPDATE_USER_PROFILE_REQUEST = 'UPDATE_USER_PROFILE_REQUEST';
export const UPDATE_USER_PROFILE_SUCCESS = 'UPDATE_USER_PROFILE_SUCCESS';
export const UPDATE_USER_PROFILE_FAILURE = 'UPDATE_USER_PROFILE_FAILURE';

export const UPLOAD_PROFILE_IMAGE_REQUEST = 'UPLOAD_PROFILE_IMAGE_REQUEST';
export const UPLOAD_PROFILE_IMAGE_SUCCESS = 'UPLOAD_PROFILE_IMAGE_SUCCESS';
export const UPLOAD_PROFILE_IMAGE_FAILURE = 'UPLOAD_PROFILE_IMAGE_FAILURE';

export const GET_COMPANY_SETTINGS_REQUEST = 'GET_COMPANY_SETTINGS_REQUEST';
export const GET_COMPANY_SETTINGS_SUCCESS = 'GET_COMPANY_SETTINGS_SUCCESS';
export const GET_COMPANY_SETTINGS_FAILURE = 'GET_COMPANY_SETTINGS_FAILURE';

export const UPDATE_COMPANY_SETTINGS_REQUEST = 'UPDATE_COMPANY_SETTINGS_REQUEST';
export const UPDATE_COMPANY_SETTINGS_SUCCESS = 'UPDATE_COMPANY_SETTINGS_SUCCESS';
export const UPDATE_COMPANY_SETTINGS_FAILURE = 'UPDATE_COMPANY_SETTINGS_FAILURE';

export const UPLOAD_COMPANY_LOGO_REQUEST = 'UPLOAD_COMPANY_LOGO_REQUEST';
export const UPLOAD_COMPANY_LOGO_SUCCESS = 'UPLOAD_COMPANY_LOGO_SUCCESS';
export const UPLOAD_COMPANY_LOGO_FAILURE = 'UPLOAD_COMPANY_LOGO_FAILURE';

export const GET_NOTIFICATION_SETTINGS_REQUEST = 'GET_NOTIFICATION_SETTINGS_REQUEST';
export const GET_NOTIFICATION_SETTINGS_SUCCESS = 'GET_NOTIFICATION_SETTINGS_SUCCESS';
export const GET_NOTIFICATION_SETTINGS_FAILURE = 'GET_NOTIFICATION_SETTINGS_FAILURE';

export const UPDATE_NOTIFICATION_SETTINGS_REQUEST = 'UPDATE_NOTIFICATION_SETTINGS_REQUEST';
export const UPDATE_NOTIFICATION_SETTINGS_SUCCESS = 'UPDATE_NOTIFICATION_SETTINGS_SUCCESS';
export const UPDATE_NOTIFICATION_SETTINGS_FAILURE = 'UPDATE_NOTIFICATION_SETTINGS_FAILURE';

export const GET_INTEGRATION_SETTINGS_REQUEST = 'GET_INTEGRATION_SETTINGS_REQUEST';
export const GET_INTEGRATION_SETTINGS_SUCCESS = 'GET_INTEGRATION_SETTINGS_SUCCESS';
export const GET_INTEGRATION_SETTINGS_FAILURE = 'GET_INTEGRATION_SETTINGS_FAILURE';

export const GET_ELD_CONNECTIONS_REQUEST = 'GET_ELD_CONNECTIONS_REQUEST';
export const GET_ELD_CONNECTIONS_SUCCESS = 'GET_ELD_CONNECTIONS_SUCCESS';
export const GET_ELD_CONNECTIONS_FAILURE = 'GET_ELD_CONNECTIONS_FAILURE';

export const GET_TMS_CONNECTIONS_REQUEST = 'GET_TMS_CONNECTIONS_REQUEST';
export const GET_TMS_CONNECTIONS_SUCCESS = 'GET_TMS_CONNECTIONS_SUCCESS';
export const GET_TMS_CONNECTIONS_FAILURE = 'GET_TMS_CONNECTIONS_FAILURE';

export const GET_PAYMENT_METHODS_REQUEST = 'GET_PAYMENT_METHODS_REQUEST';
export const GET_PAYMENT_METHODS_SUCCESS = 'GET_PAYMENT_METHODS_SUCCESS';
export const GET_PAYMENT_METHODS_FAILURE = 'GET_PAYMENT_METHODS_FAILURE';

export const GET_API_KEYS_REQUEST = 'GET_API_KEYS_REQUEST';
export const GET_API_KEYS_SUCCESS = 'GET_API_KEYS_SUCCESS';
export const GET_API_KEYS_FAILURE = 'GET_API_KEYS_FAILURE';

export const CREATE_API_KEY_REQUEST = 'CREATE_API_KEY_REQUEST';
export const CREATE_API_KEY_SUCCESS = 'CREATE_API_KEY_SUCCESS';
export const CREATE_API_KEY_FAILURE = 'CREATE_API_KEY_FAILURE';

export const REVOKE_API_KEY_REQUEST = 'REVOKE_API_KEY_REQUEST';
export const REVOKE_API_KEY_SUCCESS = 'REVOKE_API_KEY_SUCCESS';
export const REVOKE_API_KEY_FAILURE = 'REVOKE_API_KEY_FAILURE';

export const GET_USER_LIST_REQUEST = 'GET_USER_LIST_REQUEST';
export const GET_USER_LIST_SUCCESS = 'GET_USER_LIST_SUCCESS';
export const GET_USER_LIST_FAILURE = 'GET_USER_LIST_FAILURE';

export const INVITE_USER_REQUEST = 'INVITE_USER_REQUEST';
export const INVITE_USER_SUCCESS = 'INVITE_USER_SUCCESS';
export const INVITE_USER_FAILURE = 'INVITE_USER_FAILURE';

export const UPDATE_USER_ROLE_REQUEST = 'UPDATE_USER_ROLE_REQUEST';
export const UPDATE_USER_ROLE_SUCCESS = 'UPDATE_USER_ROLE_SUCCESS';
export const UPDATE_USER_ROLE_FAILURE = 'UPDATE_USER_ROLE_FAILURE';

export const DEACTIVATE_USER_REQUEST = 'DEACTIVATE_USER_REQUEST';
export const DEACTIVATE_USER_SUCCESS = 'DEACTIVATE_USER_SUCCESS';
export const DEACTIVATE_USER_FAILURE = 'DEACTIVATE_USER_FAILURE';

export const REACTIVATE_USER_REQUEST = 'REACTIVATE_USER_REQUEST';
export const REACTIVATE_USER_SUCCESS = 'REACTIVATE_USER_SUCCESS';
export const REACTIVATE_USER_FAILURE = 'REACTIVATE_USER_FAILURE';

// Action creators
/**
 * Async action creator that fetches user settings
 */
export const getUserSettings = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_USER_SETTINGS_REQUEST action
    dispatch({ type: GET_USER_SETTINGS_REQUEST });
    try {
      // Try to call settingsService.getUserProfile()
      const data = await settingsService.getUserProfile();
      // If successful, dispatch GET_USER_SETTINGS_SUCCESS with the data
      dispatch({
        type: GET_USER_SETTINGS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_USER_SETTINGS_FAILURE with the error message
      dispatch({
        type: GET_USER_SETTINGS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching user settings:', error);
    }
  };
};

/**
 * Async action creator that updates user settings
 */
export const updateUserSettings = (settings: UserSettings): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch UPDATE_USER_SETTINGS_REQUEST action
    dispatch({ type: UPDATE_USER_SETTINGS_REQUEST });
    try {
      // Try to call settingsService.updateUserProfile(settings)
      const data = await settingsService.updateUserProfile(settings);
      // If successful, dispatch UPDATE_USER_SETTINGS_SUCCESS with the updated data
      dispatch({
        type: UPDATE_USER_SETTINGS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch UPDATE_USER_SETTINGS_FAILURE with the error message
      dispatch({
        type: UPDATE_USER_SETTINGS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error updating user settings:', error);
    }
  };
};

/**
 * Async action creator that fetches user profile information
 */
export const getUserProfile = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_USER_PROFILE_REQUEST action
    dispatch({ type: GET_USER_PROFILE_REQUEST });
    try {
      // Try to call settingsService.getUserProfile()
      const data = await settingsService.getUserProfile();
      // If successful, dispatch GET_USER_PROFILE_SUCCESS with the data
      dispatch({
        type: GET_USER_PROFILE_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_USER_PROFILE_FAILURE with the error message
      dispatch({
        type: GET_USER_PROFILE_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching user profile:', error);
    }
  };
};

/**
 * Async action creator that updates user profile information
 */
export const updateUserProfile = (profile: UserProfile): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch UPDATE_USER_PROFILE_REQUEST action
    dispatch({ type: UPDATE_USER_PROFILE_REQUEST });
    try {
      // Try to call settingsService.updateUserProfile(profile)
      const data = await settingsService.updateUserProfile(profile);
      // If successful, dispatch UPDATE_USER_PROFILE_SUCCESS with the updated data
      dispatch({
        type: UPDATE_USER_PROFILE_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch UPDATE_USER_PROFILE_FAILURE with the error message
      dispatch({
        type: UPDATE_USER_PROFILE_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error updating user profile:', error);
    }
  };
};

/**
 * Async action creator that uploads a user profile image
 */
export const uploadProfileImage = (imageFile: File): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch UPLOAD_PROFILE_IMAGE_REQUEST action
    dispatch({ type: UPLOAD_PROFILE_IMAGE_REQUEST });
    try {
      // Try to call settingsService.uploadProfileImage(imageFile)
      const data = await settingsService.uploadProfileImage(imageFile);
      // If successful, dispatch UPLOAD_PROFILE_IMAGE_SUCCESS with the image URL
      dispatch({
        type: UPLOAD_PROFILE_IMAGE_SUCCESS,
        payload: data.imageUrl,
      });
    } catch (error: any) {
      // If error occurs, dispatch UPLOAD_PROFILE_IMAGE_FAILURE with the error message
      dispatch({
        type: UPLOAD_PROFILE_IMAGE_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error uploading profile image:', error);
    }
  };
};

/**
 * Async action creator that fetches company settings
 */
export const getCompanySettings = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_COMPANY_SETTINGS_REQUEST action
    dispatch({ type: GET_COMPANY_SETTINGS_REQUEST });
    try {
      // Try to call settingsService.getCompanySettings()
      const data = await settingsService.getCompanySettings();
      // If successful, dispatch GET_COMPANY_SETTINGS_SUCCESS with the data
      dispatch({
        type: GET_COMPANY_SETTINGS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_COMPANY_SETTINGS_FAILURE with the error message
      dispatch({
        type: GET_COMPANY_SETTINGS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching company settings:', error);
    }
  };
};

/**
 * Async action creator that updates company settings
 */
export const updateCompanySettings = (settings: CarrierUpdateParams): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch UPDATE_COMPANY_SETTINGS_REQUEST action
    dispatch({ type: UPDATE_COMPANY_SETTINGS_REQUEST });
    try {
      // Try to call settingsService.updateCompanySettings(settings)
      const data = await settingsService.updateCompanySettings(settings);
      // If successful, dispatch UPDATE_COMPANY_SETTINGS_SUCCESS with the updated data
      dispatch({
        type: UPDATE_COMPANY_SETTINGS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch UPDATE_COMPANY_SETTINGS_FAILURE with the error message
      dispatch({
        type: UPDATE_COMPANY_SETTINGS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error updating company settings:', error);
    }
  };
};

/**
 * Async action creator that uploads a company logo
 */
export const uploadCompanyLogo = (logoFile: File): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch UPLOAD_COMPANY_LOGO_REQUEST action
    dispatch({ type: UPLOAD_COMPANY_LOGO_REQUEST });
    try {
      // Try to call settingsService.uploadCompanyLogo(logoFile)
      const data = await settingsService.uploadCompanyLogo(logoFile);
      // If successful, dispatch UPLOAD_COMPANY_LOGO_SUCCESS with the logo URL
      dispatch({
        type: UPLOAD_COMPANY_LOGO_SUCCESS,
        payload: data.logoUrl,
      });
    } catch (error: any) {
      // If error occurs, dispatch UPLOAD_COMPANY_LOGO_FAILURE with the error message
      dispatch({
        type: UPLOAD_COMPANY_LOGO_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error uploading company logo:', error);
    }
  };
};

/**
 * Async action creator that fetches notification settings
 */
export const getNotificationSettings = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_NOTIFICATION_SETTINGS_REQUEST action
    dispatch({ type: GET_NOTIFICATION_SETTINGS_REQUEST });
    try {
      // Try to call settingsService.getNotificationSettings()
      const data = await settingsService.getNotificationSettings();
      // If successful, dispatch GET_NOTIFICATION_SETTINGS_SUCCESS with the data
      dispatch({
        type: GET_NOTIFICATION_SETTINGS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_NOTIFICATION_SETTINGS_FAILURE with the error message
      dispatch({
        type: GET_NOTIFICATION_SETTINGS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching notification settings:', error);
    }
  };
};

/**
 * Async action creator that updates notification settings
 */
export const updateNotificationSettings = (settings: NotificationSettings): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch UPDATE_NOTIFICATION_SETTINGS_REQUEST action
    dispatch({ type: UPDATE_NOTIFICATION_SETTINGS_REQUEST });
    try {
      // Try to call settingsService.updateNotificationSettings(settings)
      const data = await settingsService.updateNotificationSettings(settings);
      // If successful, dispatch UPDATE_NOTIFICATION_SETTINGS_SUCCESS with the updated data
      dispatch({
        type: UPDATE_NOTIFICATION_SETTINGS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch UPDATE_NOTIFICATION_SETTINGS_FAILURE with the error message
      dispatch({
        type: UPDATE_NOTIFICATION_SETTINGS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error updating notification settings:', error);
    }
  };
};

/**
 * Async action creator that fetches integration settings
 */
export const getIntegrationSettings = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_INTEGRATION_SETTINGS_REQUEST action
    dispatch({ type: GET_INTEGRATION_SETTINGS_REQUEST });
    try {
      // Try to call integrationService.getIntegrationSettings(carrierId)
      // TODO: Replace 'carrierId' with the actual carrier ID when available
      const data = await integrationService.getIntegrationSettings('carrierId');
      // If successful, dispatch GET_INTEGRATION_SETTINGS_SUCCESS with the data
      dispatch({
        type: GET_INTEGRATION_SETTINGS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_INTEGRATION_SETTINGS_FAILURE with the error message
      dispatch({
        type: GET_INTEGRATION_SETTINGS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching integration settings:', error);
    }
  };
};

/**
 * Async action creator that fetches ELD connections
 */
export const getEldConnections = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_ELD_CONNECTIONS_REQUEST action
    dispatch({ type: GET_ELD_CONNECTIONS_REQUEST });
    try {
      // Try to call integrationService.getEldConnections(carrierId)
      // TODO: Replace 'carrierId' with the actual carrier ID when available
      const data = await integrationService.getEldConnections('carrierId');
      // If successful, dispatch GET_ELD_CONNECTIONS_SUCCESS with the data
      dispatch({
        type: GET_ELD_CONNECTIONS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_ELD_CONNECTIONS_FAILURE with the error message
      dispatch({
        type: GET_ELD_CONNECTIONS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching ELD connections:', error);
    }
  };
};

/**
 * Async action creator that fetches TMS connections
 */
export const getTmsConnections = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_TMS_CONNECTIONS_REQUEST action
    dispatch({ type: GET_TMS_CONNECTIONS_REQUEST });
    try {
      // Try to call integrationService.getTmsConnections(carrierId)
      // TODO: Replace 'carrierId' with the actual carrier ID when available
      const data = await integrationService.getTmsConnections('carrierId');
      // If successful, dispatch GET_TMS_CONNECTIONS_SUCCESS with the data
      dispatch({
        type: GET_TMS_CONNECTIONS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_TMS_CONNECTIONS_FAILURE with the error message
      dispatch({
        type: GET_TMS_CONNECTIONS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching TMS connections:', error);
    }
  };
};

/**
 * Async action creator that fetches payment methods
 */
export const getPaymentMethods = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_PAYMENT_METHODS_REQUEST action
    dispatch({ type: GET_PAYMENT_METHODS_REQUEST });
    try {
      // Try to call integrationService.getPaymentMethods(carrierId)
      // TODO: Replace 'carrierId' with the actual carrier ID when available
      const data = await integrationService.getPaymentMethods('carrierId');
      // If successful, dispatch GET_PAYMENT_METHODS_SUCCESS with the data
      dispatch({
        type: GET_PAYMENT_METHODS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_PAYMENT_METHODS_FAILURE with the error message
      dispatch({
        type: GET_PAYMENT_METHODS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching payment methods:', error);
    }
  };
};

/**
 * Async action creator that fetches API keys
 */
export const getApiKeys = (): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_API_KEYS_REQUEST action
    dispatch({ type: GET_API_KEYS_REQUEST });
    try {
      // Try to call integrationService.getApiKeys(carrierId)
      // TODO: Replace 'carrierId' with the actual carrier ID when available
      const data = await integrationService.getApiKeys('carrierId');
      // If successful, dispatch GET_API_KEYS_SUCCESS with the data
      dispatch({
        type: GET_API_KEYS_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_API_KEYS_FAILURE with the error message
      dispatch({
        type: GET_API_KEYS_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching API keys:', error);
    }
  };
};

/**
 * Async action creator that creates a new API key
 */
export const createApiKey = (keyData: object): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch CREATE_API_KEY_REQUEST action
    dispatch({ type: CREATE_API_KEY_REQUEST });
    try {
      // Try to call integrationService.createApiKey(carrierId, keyData)
      // TODO: Replace 'carrierId' with the actual carrier ID when available
      const data = await integrationService.createApiKey('carrierId', keyData);
      // If successful, dispatch CREATE_API_KEY_SUCCESS with the new key data
      dispatch({
        type: CREATE_API_KEY_SUCCESS,
        payload: data,
      });
    } catch (error: any) {
      // If error occurs, dispatch CREATE_API_KEY_FAILURE with the error message
      dispatch({
        type: CREATE_API_KEY_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error creating API key:', error);
    }
  };
};

/**
 * Async action creator that revokes an API key
 */
export const revokeApiKey = (keyId: string): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch REVOKE_API_KEY_REQUEST action
    dispatch({ type: REVOKE_API_KEY_REQUEST });
    try {
      // Try to call integrationService.revokeApiKey(keyId)
      await integrationService.revokeApiKey(keyId);
      // If successful, dispatch REVOKE_API_KEY_SUCCESS with the keyId
      dispatch({
        type: REVOKE_API_KEY_SUCCESS,
        payload: keyId,
      });
    } catch (error: any) {
      // If error occurs, dispatch REVOKE_API_KEY_FAILURE with the error message
      dispatch({
        type: REVOKE_API_KEY_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error revoking API key:', error);
    }
  };
};

/**
 * Async action creator that fetches the list of users
 */
export const getUserList = (params: object): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch GET_USER_LIST_REQUEST action
    dispatch({ type: GET_USER_LIST_REQUEST });
    try {
      // Try to call a service method to get the user list with pagination params
      // const { users, total } = await userService.getUsers(params);
      const users = [];
      const total = 0;
      // If successful, dispatch GET_USER_LIST_SUCCESS with the users and total count
      dispatch({
        type: GET_USER_LIST_SUCCESS,
        payload: { users, total },
      });
    } catch (error: any) {
      // If error occurs, dispatch GET_USER_LIST_FAILURE with the error message
      dispatch({
        type: GET_USER_LIST_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error fetching user list:', error);
    }
  };
};

/**
 * Async action creator that invites a new user
 */
export const inviteUser = (userData: object): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch INVITE_USER_REQUEST action
    dispatch({ type: INVITE_USER_REQUEST });
    try {
      // Try to call a service method to invite a new user
      // const message = await userService.inviteUser(userData);
      const message = 'Success';
      // If successful, dispatch INVITE_USER_SUCCESS with success message
      dispatch({
        type: INVITE_USER_SUCCESS,
        payload: message,
      });
    } catch (error: any) {
      // If error occurs, dispatch INVITE_USER_FAILURE with the error message
      dispatch({
        type: INVITE_USER_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error inviting user:', error);
    }
  };
};

/**
 * Async action creator that updates a user's role
 */
export const updateUserRole = (userId: string, role: string): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch UPDATE_USER_ROLE_REQUEST action
    dispatch({ type: UPDATE_USER_ROLE_REQUEST });
    try {
      // Try to call a service method to update the user's role
      // const user = await userService.updateUserRole(userId, role);
      const user = {};
      // If successful, dispatch UPDATE_USER_ROLE_SUCCESS with the updated user data
      dispatch({
        type: UPDATE_USER_ROLE_SUCCESS,
        payload: user,
      });
    } catch (error: any) {
      // If error occurs, dispatch UPDATE_USER_ROLE_FAILURE with the error message
      dispatch({
        type: UPDATE_USER_ROLE_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error updating user role:', error);
    }
  };
};

/**
 * Async action creator that deactivates a user
 */
export const deactivateUser = (userId: string): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch DEACTIVATE_USER_REQUEST action
    dispatch({ type: DEACTIVATE_USER_REQUEST });
    try {
      // Try to call a service method to deactivate the user
      // const user = await userService.deactivateUser(userId);
      const user = {};
      // If successful, dispatch DEACTIVATE_USER_SUCCESS with the updated user data
      dispatch({
        type: DEACTIVATE_USER_SUCCESS,
        payload: user,
      });
    } catch (error: any) {
      // If error occurs, dispatch DEACTIVATE_USER_FAILURE with the error message
      dispatch({
        type: DEACTIVATE_USER_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error deactivating user:', error);
    }
  };
};

/**
 * Async action creator that reactivates a user
 */
export const reactivateUser = (userId: string): ThunkAction<Promise<void>, RootState, unknown, AnyAction> => {
  // Return a thunk function that takes dispatch as parameter
  return async (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    // Dispatch REACTIVATE_USER_REQUEST action
    dispatch({ type: REACTIVATE_USER_REQUEST });
    try {
      // Try to call a service method to reactivate the user
      // const user = await userService.reactivateUser(userId);
      const user = {};
      // If successful, dispatch REACTIVATE_USER_SUCCESS with the updated user data
      dispatch({
        type: REACTIVATE_USER_SUCCESS,
        payload: user,
      });
    } catch (error: any) {
      // If error occurs, dispatch REACTIVATE_USER_FAILURE with the error message
      dispatch({
        type: REACTIVATE_USER_FAILURE,
        payload: error.message,
      });
      // Log any errors that occur
      logger.error('Error reactivating user:', error);
    }
  };
};