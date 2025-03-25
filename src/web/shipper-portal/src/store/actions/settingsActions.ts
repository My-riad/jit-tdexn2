import { createAction } from '@reduxjs/toolkit'; // ^1.9.5
import { UserSettings, UserProfile } from '../../../common/interfaces/user.interface';
import { ShipperUpdateParams } from '../../../common/interfaces/shipper.interface';
import { NotificationSettings, ApiKeyCreationParams, UserListParams, UserInviteParams } from '../../../services/settingsService';

// Action type constants
export const FETCH_USER_SETTINGS_REQUEST = 'settings/FETCH_USER_SETTINGS_REQUEST';
export const FETCH_USER_SETTINGS_SUCCESS = 'settings/FETCH_USER_SETTINGS_SUCCESS';
export const FETCH_USER_SETTINGS_FAILURE = 'settings/FETCH_USER_SETTINGS_FAILURE';

export const UPDATE_USER_SETTINGS_REQUEST = 'settings/UPDATE_USER_SETTINGS_REQUEST';
export const UPDATE_USER_SETTINGS_SUCCESS = 'settings/UPDATE_USER_SETTINGS_SUCCESS';
export const UPDATE_USER_SETTINGS_FAILURE = 'settings/UPDATE_USER_SETTINGS_FAILURE';

export const FETCH_USER_PROFILE_REQUEST = 'settings/FETCH_USER_PROFILE_REQUEST';
export const FETCH_USER_PROFILE_SUCCESS = 'settings/FETCH_USER_PROFILE_SUCCESS';
export const FETCH_USER_PROFILE_FAILURE = 'settings/FETCH_USER_PROFILE_FAILURE';

export const UPDATE_USER_PROFILE_REQUEST = 'settings/UPDATE_USER_PROFILE_REQUEST';
export const UPDATE_USER_PROFILE_SUCCESS = 'settings/UPDATE_USER_PROFILE_SUCCESS';
export const UPDATE_USER_PROFILE_FAILURE = 'settings/UPDATE_USER_PROFILE_FAILURE';

export const UPLOAD_PROFILE_IMAGE_REQUEST = 'settings/UPLOAD_PROFILE_IMAGE_REQUEST';
export const UPLOAD_PROFILE_IMAGE_SUCCESS = 'settings/UPLOAD_PROFILE_IMAGE_SUCCESS';
export const UPLOAD_PROFILE_IMAGE_FAILURE = 'settings/UPLOAD_PROFILE_IMAGE_FAILURE';

export const FETCH_COMPANY_SETTINGS_REQUEST = 'settings/FETCH_COMPANY_SETTINGS_REQUEST';
export const FETCH_COMPANY_SETTINGS_SUCCESS = 'settings/FETCH_COMPANY_SETTINGS_SUCCESS';
export const FETCH_COMPANY_SETTINGS_FAILURE = 'settings/FETCH_COMPANY_SETTINGS_FAILURE';

export const UPDATE_COMPANY_SETTINGS_REQUEST = 'settings/UPDATE_COMPANY_SETTINGS_REQUEST';
export const UPDATE_COMPANY_SETTINGS_SUCCESS = 'settings/UPDATE_COMPANY_SETTINGS_SUCCESS';
export const UPDATE_COMPANY_SETTINGS_FAILURE = 'settings/UPDATE_COMPANY_SETTINGS_FAILURE';

export const UPLOAD_COMPANY_LOGO_REQUEST = 'settings/UPLOAD_COMPANY_LOGO_REQUEST';
export const UPLOAD_COMPANY_LOGO_SUCCESS = 'settings/UPLOAD_COMPANY_LOGO_SUCCESS';
export const UPLOAD_COMPANY_LOGO_FAILURE = 'settings/UPLOAD_COMPANY_LOGO_FAILURE';

export const FETCH_NOTIFICATION_SETTINGS_REQUEST = 'settings/FETCH_NOTIFICATION_SETTINGS_REQUEST';
export const FETCH_NOTIFICATION_SETTINGS_SUCCESS = 'settings/FETCH_NOTIFICATION_SETTINGS_SUCCESS';
export const FETCH_NOTIFICATION_SETTINGS_FAILURE = 'settings/FETCH_NOTIFICATION_SETTINGS_FAILURE';

export const UPDATE_NOTIFICATION_SETTINGS_REQUEST = 'settings/UPDATE_NOTIFICATION_SETTINGS_REQUEST';
export const UPDATE_NOTIFICATION_SETTINGS_SUCCESS = 'settings/UPDATE_NOTIFICATION_SETTINGS_SUCCESS';
export const UPDATE_NOTIFICATION_SETTINGS_FAILURE = 'settings/UPDATE_NOTIFICATION_SETTINGS_FAILURE';

export const FETCH_INTEGRATION_SETTINGS_REQUEST = 'settings/FETCH_INTEGRATION_SETTINGS_REQUEST';
export const FETCH_INTEGRATION_SETTINGS_SUCCESS = 'settings/FETCH_INTEGRATION_SETTINGS_SUCCESS';
export const FETCH_INTEGRATION_SETTINGS_FAILURE = 'settings/FETCH_INTEGRATION_SETTINGS_FAILURE';

export const FETCH_TMS_CONNECTIONS_REQUEST = 'settings/FETCH_TMS_CONNECTIONS_REQUEST';
export const FETCH_TMS_CONNECTIONS_SUCCESS = 'settings/FETCH_TMS_CONNECTIONS_SUCCESS';
export const FETCH_TMS_CONNECTIONS_FAILURE = 'settings/FETCH_TMS_CONNECTIONS_FAILURE';

export const FETCH_PAYMENT_METHODS_REQUEST = 'settings/FETCH_PAYMENT_METHODS_REQUEST';
export const FETCH_PAYMENT_METHODS_SUCCESS = 'settings/FETCH_PAYMENT_METHODS_SUCCESS';
export const FETCH_PAYMENT_METHODS_FAILURE = 'settings/FETCH_PAYMENT_METHODS_FAILURE';

export const FETCH_API_KEYS_REQUEST = 'settings/FETCH_API_KEYS_REQUEST';
export const FETCH_API_KEYS_SUCCESS = 'settings/FETCH_API_KEYS_SUCCESS';
export const FETCH_API_KEYS_FAILURE = 'settings/FETCH_API_KEYS_FAILURE';

export const CREATE_API_KEY_REQUEST = 'settings/CREATE_API_KEY_REQUEST';
export const CREATE_API_KEY_SUCCESS = 'settings/CREATE_API_KEY_SUCCESS';
export const CREATE_API_KEY_FAILURE = 'settings/CREATE_API_KEY_FAILURE';

export const REVOKE_API_KEY_REQUEST = 'settings/REVOKE_API_KEY_REQUEST';
export const REVOKE_API_KEY_SUCCESS = 'settings/REVOKE_API_KEY_SUCCESS';
export const REVOKE_API_KEY_FAILURE = 'settings/REVOKE_API_KEY_FAILURE';

export const FETCH_USERS_REQUEST = 'settings/FETCH_USERS_REQUEST';
export const FETCH_USERS_SUCCESS = 'settings/FETCH_USERS_SUCCESS';
export const FETCH_USERS_FAILURE = 'settings/FETCH_USERS_FAILURE';

export const INVITE_USER_REQUEST = 'settings/INVITE_USER_REQUEST';
export const INVITE_USER_SUCCESS = 'settings/INVITE_USER_SUCCESS';
export const INVITE_USER_FAILURE = 'settings/INVITE_USER_FAILURE';

export const UPDATE_USER_ROLE_REQUEST = 'settings/UPDATE_USER_ROLE_REQUEST';
export const UPDATE_USER_ROLE_SUCCESS = 'settings/UPDATE_USER_ROLE_SUCCESS';
export const UPDATE_USER_ROLE_FAILURE = 'settings/UPDATE_USER_ROLE_FAILURE';

export const DEACTIVATE_USER_REQUEST = 'settings/DEACTIVATE_USER_REQUEST';
export const DEACTIVATE_USER_SUCCESS = 'settings/DEACTIVATE_USER_SUCCESS';
export const DEACTIVATE_USER_FAILURE = 'settings/DEACTIVATE_USER_FAILURE';

export const REACTIVATE_USER_REQUEST = 'settings/REACTIVATE_USER_REQUEST';
export const REACTIVATE_USER_SUCCESS = 'settings/REACTIVATE_USER_SUCCESS';
export const REACTIVATE_USER_FAILURE = 'settings/REACTIVATE_USER_FAILURE';

// Action creators
/**
 * Action creator for requesting user settings
 */
export const fetchUserSettings = createAction(FETCH_USER_SETTINGS_REQUEST);

/**
 * Action creator for updating user settings
 * @param settings 
 */
export const updateUserSettings = createAction<Partial<UserSettings>>(UPDATE_USER_SETTINGS_REQUEST);

/**
 * Action creator for requesting user profile
 */
export const fetchUserProfile = createAction(FETCH_USER_PROFILE_REQUEST);

/**
 * Action creator for updating user profile
 * @param profile 
 */
export const updateUserProfile = createAction<Partial<UserProfile>>(UPDATE_USER_PROFILE_REQUEST);

/**
 * Action creator for uploading a profile image
 * @param image 
 */
export const uploadProfileImage = createAction<File>(UPLOAD_PROFILE_IMAGE_REQUEST);

/**
 * Action creator for requesting company settings
 * @param shipperId 
 */
export const fetchCompanySettings = createAction<string>(FETCH_COMPANY_SETTINGS_REQUEST);

/**
 * Action creator for updating company settings
 * @param shipperId 
 * @param settings 
 */
export const updateCompanySettings = createAction<{ shipperId: string; settings: ShipperUpdateParams }>(UPDATE_COMPANY_SETTINGS_REQUEST);

/**
 * Action creator for uploading a company logo
 * @param shipperId 
 * @param logo 
 */
export const uploadCompanyLogo = createAction<{ shipperId: string; logo: File }>(UPLOAD_COMPANY_LOGO_REQUEST);

/**
 * Action creator for requesting notification settings
 */
export const fetchNotificationSettings = createAction(FETCH_NOTIFICATION_SETTINGS_REQUEST);

/**
 * Action creator for updating notification settings
 * @param settings 
 */
export const updateNotificationSettings = createAction<NotificationSettings>(UPDATE_NOTIFICATION_SETTINGS_REQUEST);

/**
 * Action creator for requesting integration settings
 * @param shipperId 
 */
export const fetchIntegrationSettings = createAction<string>(FETCH_INTEGRATION_SETTINGS_REQUEST);

/**
 * Action creator for requesting TMS connections
 * @param shipperId 
 */
export const fetchTmsConnections = createAction<string>(FETCH_TMS_CONNECTIONS_REQUEST);

/**
 * Action creator for requesting payment methods
 * @param shipperId 
 */
export const fetchPaymentMethods = createAction<string>(FETCH_PAYMENT_METHODS_REQUEST);

/**
 * Action creator for requesting API keys
 * @param shipperId 
 */
export const fetchApiKeys = createAction<string>(FETCH_API_KEYS_REQUEST);

/**
 * Action creator for creating an API key
 * @param shipperId 
 * @param params 
 */
export const createApiKey = createAction<{ shipperId: string; params: ApiKeyCreationParams }>(CREATE_API_KEY_REQUEST);

/**
 * Action creator for revoking an API key
 * @param keyId 
 */
export const revokeApiKey = createAction<string>(REVOKE_API_KEY_REQUEST);

/**
 * Action creator for requesting users
  * @param shipperId 
 * @param params 
 */
export const fetchUsers = createAction<{ shipperId: string; params: UserListParams }>(FETCH_USERS_REQUEST);

/**
 * Action creator for inviting a user
 * @param shipperId 
 * @param params 
 */
export const inviteUser = createAction<{ shipperId: string; params: UserInviteParams }>(INVITE_USER_REQUEST);

/**
 * Action creator for updating a user's role
 * @param userId 
 * @param roleId 
 */
export const updateUserRole = createAction<{ userId: string; roleId: string }>(UPDATE_USER_ROLE_REQUEST);

/**
 * Action creator for deactivating a user
 * @param userId 
 */
export const deactivateUser = createAction<string>(DEACTIVATE_USER_REQUEST);

/**
 * Action creator for reactivating a user
 * @param userId 
 */
export const reactivateUser = createAction<string>(REACTIVATE_USER_REQUEST);