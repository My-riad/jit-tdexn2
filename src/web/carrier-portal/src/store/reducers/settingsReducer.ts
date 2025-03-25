# src/web/carrier-portal/src/store/reducers/settingsReducer.ts
```typescript
import { AnyAction } from 'redux'; // ^4.2.1
import {
  GET_USER_SETTINGS_REQUEST,
  GET_USER_SETTINGS_SUCCESS,
  GET_USER_SETTINGS_FAILURE,
  UPDATE_USER_SETTINGS_REQUEST,
  UPDATE_USER_SETTINGS_SUCCESS,
  UPDATE_USER_SETTINGS_FAILURE,
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
} from '../actions/settingsActions'; // Import action types for settings-related actions
import {
  UserProfile,
  NotificationSettings,
} from '../../../common/interfaces/user.interface'; // Import user-related interfaces for type safety
import { CarrierUpdateParams } from '../../../common/interfaces/carrier.interface'; // Import carrier-related interfaces for type safety

/**
 * Interface defining the shape of the settings state in the Redux store
 */
export interface SettingsState {
  userProfile: UserProfile | null;
  loadingUserProfile: boolean;
  userProfileError: string | null;
  companySettings: any | null; // TODO: Replace 'any' with the actual type
  loadingCompanySettings: boolean;
  companySettingsError: string | null;
  notificationSettings: NotificationSettings | null;
  loadingNotificationSettings: boolean;
  notificationSettingsError: string | null;
  integrationSettings: any | null; // TODO: Replace 'any' with the actual type
  loadingIntegrationSettings: boolean;
  integrationSettingsError: string | null;
  eldConnections: any[]; // TODO: Replace 'any' with the actual type
  loadingEldConnections: boolean;
  eldConnectionsError: string | null;
  tmsConnections: any[]; // TODO: Replace 'any' with the actual type
  loadingTmsConnections: boolean;
  tmsConnectionsError: string | null;
  paymentMethods: any[]; // TODO: Replace 'any' with the actual type
  loadingPaymentMethods: boolean;
  paymentMethodsError: string | null;
  apiKeys: any[]; // TODO: Replace 'any' with the actual type
  loadingApiKeys: boolean;
  apiKeysError: string | null;
  users: any[]; // TODO: Replace 'any' with the actual type
  loadingUsers: boolean;
  usersError: string | null;
  totalUsers: number;
  uploadingProfileImage: boolean;
  profileImageError: string | null;
  uploadingCompanyLogo: boolean;
  companyLogoError: string | null;
  invitingUser: boolean;
  inviteUserError: string | null;
  updatingUserRole: boolean;
  updateUserRoleError: string | null;
  deactivatingUser: boolean;
  deactivateUserError: string | null;
  reactivatingUser: boolean;
  reactivateUserError: string | null;
  creatingApiKey: boolean;
  createApiKeyError: string | null;
  revokingApiKey: boolean;
  revokeApiKeyError: string | null;
}

/**
 * Initial state for the settings reducer
 */
export const initialState: SettingsState = {
  userProfile: null,
  loadingUserProfile: false,
  userProfileError: null,
  companySettings: null,
  loadingCompanySettings: false,
  companySettingsError: null,
  notificationSettings: null,
  loadingNotificationSettings: false,
  notificationSettingsError: null,
  integrationSettings: null,
  loadingIntegrationSettings: false,
  integrationSettingsError: null,
  eldConnections: [],
  loadingEldConnections: false,
  eldConnectionsError: null,
  tmsConnections: [],
  loadingTmsConnections: false,
  tmsConnectionsError: null,
  paymentMethods: [],
  loadingPaymentMethods: false,
  paymentMethodsError: null,
  apiKeys: [],
  loadingApiKeys: false,
  apiKeysError: null,
  users: [],
  loadingUsers: false,
  usersError: null,
  totalUsers: 0,
  uploadingProfileImage: false,
  profileImageError: null,
  uploadingCompanyLogo: false,
  companyLogoError: null,
  invitingUser: false,
  inviteUserError: null,
  updatingUserRole: false,
  updateUserRoleError: null,
  deactivatingUser: false,
  deactivateUserError: null,
  reactivatingUser: false,
  reactivateUserError: null,
  creatingApiKey: false,
  createApiKeyError: null,
  revokingApiKey: false,
  revokeApiKeyError: null,
};

/**
 * Redux reducer function that handles settings-related state updates
 * @param {SettingsState} state - The previous state of the settings
 * @param {AnyAction} action - The action dispatched to the reducer
 * @returns {SettingsState} Updated state based on the action
 */
const settingsReducer = (state: SettingsState = initialState, action: AnyAction): SettingsState => {
  // Use a switch statement to handle different action types
  switch (action.type) {
    // Handle loading states for request actions
    case GET_USER_SETTINGS_REQUEST:
      return { ...state, loadingUserProfile: true, userProfileError: null };
    case UPDATE_USER_SETTINGS_REQUEST:
      return { ...state, loadingUserProfile: true, userProfileError: null };
    case GET_USER_PROFILE_REQUEST:
      return { ...state, loadingUserProfile: true, userProfileError: null };
    case UPDATE_USER_PROFILE_REQUEST:
      return { ...state, loadingUserProfile: true, userProfileError: null };
    case UPLOAD_PROFILE_IMAGE_REQUEST:
      return { ...state, uploadingProfileImage: true, profileImageError: null };
    case GET_COMPANY_SETTINGS_REQUEST:
      return { ...state, loadingCompanySettings: true, companySettingsError: null };
    case UPDATE_COMPANY_SETTINGS_REQUEST:
      return { ...state, loadingCompanySettings: true, companySettingsError: null };
    case UPLOAD_COMPANY_LOGO_REQUEST:
      return { ...state, uploadingCompanyLogo: true, companyLogoError: null };
    case GET_NOTIFICATION_SETTINGS_REQUEST:
      return { ...state, loadingNotificationSettings: true, notificationSettingsError: null };
    case UPDATE_NOTIFICATION_SETTINGS_REQUEST:
      return { ...state, loadingNotificationSettings: true, notificationSettingsError: null };
    case GET_INTEGRATION_SETTINGS_REQUEST:
      return { ...state, loadingIntegrationSettings: true, integrationSettingsError: null };
    case GET_ELD_CONNECTIONS_REQUEST:
      return { ...state, loadingEldConnections: true, eldConnectionsError: null };
    case GET_TMS_CONNECTIONS_REQUEST:
      return { ...state, loadingTmsConnections: true, tmsConnectionsError: null };
    case GET_PAYMENT_METHODS_REQUEST:
      return { ...state, loadingPaymentMethods: true, paymentMethodsError: null };
    case GET_API_KEYS_REQUEST:
      return { ...state, loadingApiKeys: true, apiKeysError: null };
    case CREATE_API_KEY_REQUEST:
      return { ...state, creatingApiKey: true, createApiKeyError: null };
    case REVOKE_API_KEY_REQUEST:
      return { ...state, revokingApiKey: true, revokeApiKeyError: null };
    case GET_USER_LIST_REQUEST:
      return { ...state, loadingUsers: true, usersError: null };
    case INVITE_USER_REQUEST:
      return { ...state, invitingUser: true, inviteUserError: null };
    case UPDATE_USER_ROLE_REQUEST:
      return { ...state, updatingUserRole: true, updateUserRoleError: null };
    case DEACTIVATE_USER_REQUEST:
      return { ...state, deactivatingUser: true, deactivateUserError: null };
    case REACTIVATE_USER_REQUEST:
      return { ...state, reactivatingUser: true, reactivateUserError: null };

    // Handle success states with updated data
    case GET_USER_SETTINGS_SUCCESS:
      return { ...state, loadingUserProfile: false, userProfile: action.payload };
    case UPDATE_USER_SETTINGS_SUCCESS:
      return { ...state, loadingUserProfile: false, userProfile: action.payload };
    case GET_USER_PROFILE_SUCCESS:
      return { ...state, loadingUserProfile: false, userProfile: action.payload };
    case UPDATE_USER_PROFILE_SUCCESS:
      return { ...state, loadingUserProfile: false, userProfile: action.payload };
    case UPLOAD_PROFILE_IMAGE_SUCCESS:
      return { ...state, uploadingProfileImage: false, userProfile: { ...state.userProfile, profileImageUrl: action.payload } };
    case GET_COMPANY_SETTINGS_SUCCESS:
      return { ...state, loadingCompanySettings: false, companySettings: action.payload };
    case UPDATE_COMPANY_SETTINGS_SUCCESS:
      return { ...state, loadingCompanySettings: false, companySettings: action.payload };
    case UPLOAD_COMPANY_LOGO_SUCCESS:
      return { ...state, uploadingCompanyLogo: false, companySettings: { ...state.companySettings, logoUrl: action.payload } };
    case GET_NOTIFICATION_SETTINGS_SUCCESS:
      return { ...state, loadingNotificationSettings: false, notificationSettings: action.payload };
    case UPDATE_NOTIFICATION_SETTINGS_SUCCESS:
      return { ...state, loadingNotificationSettings: false, notificationSettings: action.payload };
    case GET_INTEGRATION_SETTINGS_SUCCESS:
      return { ...state, loadingIntegrationSettings: false, integrationSettings: action.payload };
    case GET_ELD_CONNECTIONS_SUCCESS:
      return { ...state, loadingEldConnections: false, eldConnections: action.payload };
    case GET_TMS_CONNECTIONS_SUCCESS:
      return { ...state, loadingTmsConnections: false, tmsConnections: action.payload };
    case GET_PAYMENT_METHODS_SUCCESS:
      return { ...state, loadingPaymentMethods: false, paymentMethods: action.payload };
    case GET_API_KEYS_SUCCESS:
      return { ...state, loadingApiKeys: false, apiKeys: action.payload };
    case CREATE_API_KEY_SUCCESS:
      return { ...state, creatingApiKey: false, apiKeys: [...state.apiKeys, action.payload] };
    case REVOKE_API_KEY_SUCCESS:
      return { ...state, revokingApiKey: false, apiKeys: state.apiKeys.filter(key => key.id !== action.payload) };
    case GET_USER_LIST_SUCCESS:
      return { ...state, loadingUsers: false, users: action.payload.users, totalUsers: action.payload.total };
    case INVITE_USER_SUCCESS:
      return { ...state, invitingUser: false };
    case UPDATE_USER_ROLE_SUCCESS:
      return {
        ...state,
        updatingUserRole: false,
        users: state.users.map(user => (user.id === action.payload.id ? action.payload : user)),
      };
    case DEACTIVATE_USER_SUCCESS:
      return {
        ...state,
        deactivatingUser: false,
        users: state.users.map(user => (user.id === action.payload.id ? action.payload : user)),
      };
    case REACTIVATE_USER_SUCCESS:
      return {
        ...state,
        reactivatingUser: false,
        users: state.users.map(user => (user.id === action.payload.id ? action.payload : user)),
      };

    // Handle error states with error messages
    case GET_USER_SETTINGS_FAILURE:
      return { ...state, loadingUserProfile: false, userProfileError: action.payload };
    case UPDATE_USER_SETTINGS_FAILURE:
      return { ...state, loadingUserProfile: false, userProfileError: action.payload };
    case GET_USER_PROFILE_FAILURE:
      return { ...state, loadingUserProfile: false, userProfileError: action.payload };
    case UPDATE_USER_PROFILE_FAILURE:
      return { ...state, loadingUserProfile: false, userProfileError: action.payload };
    case UPLOAD_PROFILE_IMAGE_FAILURE:
      return { ...state, uploadingProfileImage: false, profileImageError: action.payload };
    case GET_COMPANY_SETTINGS_FAILURE:
      return { ...state, loadingCompanySettings: false, companySettingsError: action.payload };
    case UPDATE_COMPANY_SETTINGS_FAILURE:
      return { ...state, loadingCompanySettings: false, companySettingsError: action.payload };
    case UPLOAD_COMPANY_LOGO_FAILURE:
      return { ...state, uploadingCompanyLogo: false, companyLogoError: action.payload };
    case GET_NOTIFICATION_SETTINGS_FAILURE:
      return { ...state, loadingNotificationSettings: false, notificationSettingsError: action.payload };
    case UPDATE_NOTIFICATION_SETTINGS_FAILURE:
      return { ...state, loadingNotificationSettings: false, notificationSettingsError: action.payload };
    case GET_INTEGRATION_SETTINGS_FAILURE:
      return { ...state, loadingIntegrationSettings: false, integrationSettingsError: action.payload };
    case GET_ELD_CONNECTIONS_FAILURE:
      return { ...state, loadingEldConnections: false, eldConnectionsError: action.payload };
    case GET_TMS_CONNECTIONS_FAILURE:
      return { ...state, loadingTmsConnections: false, tmsConnectionsError: action.payload };
    case GET_PAYMENT_METHODS_FAILURE:
      return { ...state, loadingPaymentMethods: false, paymentMethodsError: action.payload };
    case GET_API_KEYS_FAILURE:
      return { ...state, loadingApiKeys: false, apiKeysError: action.payload };
    case CREATE_API_KEY_FAILURE:
      return { ...state, creatingApiKey: false, createApiKeyError: action.payload };
    case REVOKE_API_KEY_FAILURE:
      return { ...state, revokingApiKey: false, revokeApiKeyError: action.payload };
    case GET_USER_LIST_FAILURE:
      return { ...state, loadingUsers: false, usersError: action.payload };
    case INVITE_USER_FAILURE:
      return { ...state, invitingUser: false, inviteUserError: action.payload };
    case UPDATE_USER_ROLE_FAILURE:
      return { ...state, updatingUserRole: false, updateUserRoleError: action.payload };
    case DEACTIVATE_USER_FAILURE:
      return { ...state, deactivatingUser: false, deactivateUserError: action.payload };
    case REACTIVATE_USER_FAILURE:
      return { ...state, reactivatingUser: false, reactivateUserError: action.payload };

    // Return the unchanged state for unhandled action types
    default:
      return state;
  }
};

// Export the settings reducer
export default settingsReducer;