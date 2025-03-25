# src/web/shipper-portal/src/store/reducers/settingsReducer.ts
```typescript
import { createReducer } from '@reduxjs/toolkit'; // ^1.9.5
import * as actionTypes from '../actions/settingsActions';
import { UserProfile, UserSummary } from '../../../common/interfaces/user.interface';
import { Shipper } from '../../../common/interfaces/shipper.interface';
import { NotificationPreference } from '../../../common/interfaces';

/**
 * Interface for the settings state, encompassing user settings, profile, company settings,
 * notification preferences, integration settings, API keys, and user management.
 */
interface SettingsState {
  userSettings: {
    loading: boolean;
    error: string | null;
    data: object | null;
  };
  userProfile: {
    loading: boolean;
    error: string | null;
    data: UserProfile | null;
    uploadingImage: boolean;
    uploadError: string | null;
  };
  companySettings: {
    loading: boolean;
    error: string | null;
    data: Shipper | null;
    uploadingLogo: boolean;
    uploadError: string | null;
  };
  notificationSettings: {
    loading: boolean;
    error: string | null;
    data: NotificationPreference[] | null;
  };
  integrationSettings: {
    loading: boolean;
    error: string | null;
    data: object | null;
  };
  tmsConnections: {
    loading: boolean;
    error: string | null;
    data: any[] | null;
  };
  paymentMethods: {
    loading: boolean;
    error: string | null;
    data: any[] | null;
  };
  apiKeys: {
    loading: boolean;
    error: string | null;
    data: any[] | null;
    creating: boolean;
    createError: string | null;
    newKey: string | null;
    revoking: boolean;
    revokeError: string | null;
  };
  users: {
    loading: boolean;
    error: string | null;
    data: UserSummary[] | null;
    total: number;
    inviting: boolean;
    inviteError: string | null;
    updatingRole: boolean;
    updateRoleError: string | null;
    deactivating: boolean;
    deactivateError: string | null;
    reactivating: boolean;
    reactivateError: string | null;
  };
}

/**
 * Initial state for the settings reducer.
 * Defines the default values for all settings-related state properties.
 */
const initialState: SettingsState = {
  userSettings: {
    loading: false,
    error: null,
    data: null,
  },
  userProfile: {
    loading: false,
    error: null,
    data: null,
    uploadingImage: false,
    uploadError: null,
  },
  companySettings: {
    loading: false,
    error: null,
    data: null,
    uploadingLogo: false,
    uploadError: null,
  },
  notificationSettings: {
    loading: false,
    error: null,
    data: null,
  },
  integrationSettings: {
    loading: false,
    error: null,
    data: null,
  },
  tmsConnections: {
    loading: false,
    error: null,
    data: null,
  },
  paymentMethods: {
    loading: false,
    error: null,
    data: null,
  },
  apiKeys: {
    loading: false,
    error: null,
    data: null,
    creating: false,
    createError: null,
    newKey: null,
    revoking: false,
    revokeError: null,
  },
  users: {
    loading: false,
    error: null,
    data: null,
    total: 0,
    inviting: false,
    inviteError: null,
    updatingRole: false,
    updateRoleError: null,
    deactivating: false,
    deactivateError: null,
    reactivating: false,
    reactivateError: null,
  },
};

/**
 * Redux reducer for managing settings-related state.
 * Uses createReducer from Redux Toolkit for simplified reducer logic.
 */
const settingsReducer = createReducer(initialState, (builder) => {
  builder
    // User Settings Reducers
    .addCase(actionTypes.FETCH_USER_SETTINGS_REQUEST, (state) => {
      state.userSettings.loading = true;
      state.userSettings.error = null;
    })
    .addCase(actionTypes.FETCH_USER_SETTINGS_SUCCESS, (state, action) => {
      state.userSettings.loading = false;
      state.userSettings.data = action.payload;
    })
    .addCase(actionTypes.FETCH_USER_SETTINGS_FAILURE, (state, action) => {
      state.userSettings.loading = false;
      state.userSettings.error = action.payload as string;
    })
    .addCase(actionTypes.UPDATE_USER_SETTINGS_REQUEST, (state) => {
      state.userSettings.loading = true;
      state.userSettings.error = null;
    })
    .addCase(actionTypes.UPDATE_USER_SETTINGS_SUCCESS, (state, action) => {
      state.userSettings.loading = false;
      state.userSettings.data = { ...state.userSettings.data, ...action.payload };
    })
    .addCase(actionTypes.UPDATE_USER_SETTINGS_FAILURE, (state, action) => {
      state.userSettings.loading = false;
      state.userSettings.error = action.payload as string;
    })

    // User Profile Reducers
    .addCase(actionTypes.FETCH_USER_PROFILE_REQUEST, (state) => {
      state.userProfile.loading = true;
      state.userProfile.error = null;
    })
    .addCase(actionTypes.FETCH_USER_PROFILE_SUCCESS, (state, action) => {
      state.userProfile.loading = false;
      state.userProfile.data = action.payload;
    })
    .addCase(actionTypes.FETCH_USER_PROFILE_FAILURE, (state, action) => {
      state.userProfile.loading = false;
      state.userProfile.error = action.payload as string;
    })
    .addCase(actionTypes.UPDATE_USER_PROFILE_REQUEST, (state) => {
      state.userProfile.loading = true;
      state.userProfile.error = null;
    })
    .addCase(actionTypes.UPDATE_USER_PROFILE_SUCCESS, (state, action) => {
      state.userProfile.loading = false;
      state.userProfile.data = { ...state.userProfile.data, ...action.payload };
    })
    .addCase(actionTypes.UPDATE_USER_PROFILE_FAILURE, (state, action) => {
      state.userProfile.loading = false;
      state.userProfile.error = action.payload as string;
    })
    .addCase(actionTypes.UPLOAD_PROFILE_IMAGE_REQUEST, (state) => {
      state.userProfile.uploadingImage = true;
      state.userProfile.uploadError = null;
    })
    .addCase(actionTypes.UPLOAD_PROFILE_IMAGE_SUCCESS, (state, action) => {
      state.userProfile.uploadingImage = false;
      if (state.userProfile.data) {
        state.userProfile.data.profileImageUrl = action.payload as string;
      }
    })
    .addCase(actionTypes.UPLOAD_PROFILE_IMAGE_FAILURE, (state, action) => {
      state.userProfile.uploadingImage = false;
      state.userProfile.uploadError = action.payload as string;
    })

    // Company Settings Reducers
    .addCase(actionTypes.FETCH_COMPANY_SETTINGS_REQUEST, (state) => {
      state.companySettings.loading = true;
      state.companySettings.error = null;
    })
    .addCase(actionTypes.FETCH_COMPANY_SETTINGS_SUCCESS, (state, action) => {
      state.companySettings.loading = false;
      state.companySettings.data = action.payload;
    })
    .addCase(actionTypes.FETCH_COMPANY_SETTINGS_FAILURE, (state, action) => {
      state.companySettings.loading = false;
      state.companySettings.error = action.payload as string;
    })
    .addCase(actionTypes.UPDATE_COMPANY_SETTINGS_REQUEST, (state) => {
      state.companySettings.loading = true;
      state.companySettings.error = null;
    })
    .addCase(actionTypes.UPDATE_COMPANY_SETTINGS_SUCCESS, (state, action) => {
      state.companySettings.loading = false;
      state.companySettings.data = { ...state.companySettings.data, ...action.payload };
    })
    .addCase(actionTypes.UPDATE_COMPANY_SETTINGS_FAILURE, (state, action) => {
      state.companySettings.loading = false;
      state.companySettings.error = action.payload as string;
    })
    .addCase(actionTypes.UPLOAD_COMPANY_LOGO_REQUEST, (state) => {
      state.companySettings.uploadingLogo = true;
      state.companySettings.uploadError = null;
    })
    .addCase(actionTypes.UPLOAD_COMPANY_LOGO_SUCCESS, (state, action) => {
      state.companySettings.uploadingLogo = false;
      if (state.companySettings.data) {
        state.companySettings.data.logoUrl = action.payload as string;
      }
    })
    .addCase(actionTypes.UPLOAD_COMPANY_LOGO_FAILURE, (state, action) => {
      state.companySettings.uploadingLogo = false;
      state.companySettings.uploadError = action.payload as string;
    })

    // Notification Settings Reducers
    .addCase(actionTypes.FETCH_NOTIFICATION_SETTINGS_REQUEST, (state) => {
      state.notificationSettings.loading = true;
      state.notificationSettings.error = null;
    })
    .addCase(actionTypes.FETCH_NOTIFICATION_SETTINGS_SUCCESS, (state, action) => {
      state.notificationSettings.loading = false;
      state.notificationSettings.data = action.payload;
    })
    .addCase(actionTypes.FETCH_NOTIFICATION_SETTINGS_FAILURE, (state, action) => {
      state.notificationSettings.loading = false;
      state.notificationSettings.error = action.payload as string;
    })
    .addCase(actionTypes.UPDATE_NOTIFICATION_SETTINGS_REQUEST, (state) => {
      state.notificationSettings.loading = true;
      state.notificationSettings.error = null;
    })
    .addCase(actionTypes.UPDATE_NOTIFICATION_SETTINGS_SUCCESS, (state, action) => {
      state.notificationSettings.loading = false;
      state.notificationSettings.data = action.payload;
    })
    .addCase(actionTypes.UPDATE_NOTIFICATION_SETTINGS_FAILURE, (state, action) => {
      state.notificationSettings.loading = false;
      state.notificationSettings.error = action.payload as string;
    })

    // Integration Settings Reducers
    .addCase(actionTypes.FETCH_INTEGRATION_SETTINGS_REQUEST, (state) => {
      state.integrationSettings.loading = true;
      state.integrationSettings.error = null;
    })
    .addCase(actionTypes.FETCH_INTEGRATION_SETTINGS_SUCCESS, (state, action) => {
      state.integrationSettings.loading = false;
      state.integrationSettings.data = action.payload;
    })
    .addCase(actionTypes.FETCH_INTEGRATION_SETTINGS_FAILURE, (state, action) => {
      state.integrationSettings.loading = false;
      state.integrationSettings.error = action.payload as string;
    })

    // TMS Connections Reducers
    .addCase(actionTypes.FETCH_TMS_CONNECTIONS_REQUEST, (state) => {
      state.tmsConnections.loading = true;
      state.tmsConnections.error = null;
    })
    .addCase(actionTypes.FETCH_TMS_CONNECTIONS_SUCCESS, (state, action) => {
      state.tmsConnections.loading = false;
      state.tmsConnections.data = action.payload;
    })
    .addCase(actionTypes.FETCH_TMS_CONNECTIONS_FAILURE, (state, action) => {
      state.tmsConnections.loading = false;
      state.tmsConnections.error = action.payload as string;
    })

    // Payment Methods Reducers
    .addCase(actionTypes.FETCH_PAYMENT_METHODS_REQUEST, (state) => {
      state.paymentMethods.loading = true;
      state.paymentMethods.error = null;
    })
    .addCase(actionTypes.FETCH_PAYMENT_METHODS_SUCCESS, (state, action) => {
      state.paymentMethods.loading = false;
      state.paymentMethods.data = action.payload;
    })
    .addCase(actionTypes.FETCH_PAYMENT_METHODS_FAILURE, (state, action) => {
      state.paymentMethods.loading = false;
      state.paymentMethods.error = action.payload as string;
    })

    // API Keys Reducers
    .addCase(actionTypes.FETCH_API_KEYS_REQUEST, (state) => {
      state.apiKeys.loading = true;
      state.apiKeys.error = null;
    })
    .addCase(actionTypes.FETCH_API_KEYS_SUCCESS, (state, action) => {
      state.apiKeys.loading = false;
      state.apiKeys.data = action.payload;
    })
    .addCase(actionTypes.FETCH_API_KEYS_FAILURE, (state, action) => {
      state.apiKeys.loading = false;
      state.apiKeys.error = action.payload as string;
    })
    .addCase(actionTypes.CREATE_API_KEY_REQUEST, (state) => {
      state.apiKeys.creating = true;
      state.apiKeys.createError = null;
      state.apiKeys.newKey = null;
    })
    .addCase(actionTypes.CREATE_API_KEY_SUCCESS, (state, action) => {
      state.apiKeys.creating = false;
      state.apiKeys.data = [...(state.apiKeys.data || []), action.payload];
      state.apiKeys.newKey = action.payload.key;
    })
    .addCase(actionTypes.CREATE_API_KEY_FAILURE, (state, action) => {
      state.apiKeys.creating = false;
      state.apiKeys.createError = action.payload as string;
      state.apiKeys.newKey = null;
    })
    .addCase(actionTypes.REVOKE_API_KEY_REQUEST, (state) => {
      state.apiKeys.revoking = true;
      state.apiKeys.revokeError = null;
    })
    .addCase(actionTypes.REVOKE_API_KEY_SUCCESS, (state, action) => {
      state.apiKeys.revoking = false;
      state.apiKeys.data = state.apiKeys.data?.filter((key) => key.id !== action.payload) || null;
    })
    .addCase(actionTypes.REVOKE_API_KEY_FAILURE, (state, action) => {
      state.apiKeys.revoking = false;
      state.apiKeys.revokeError = action.payload as string;
    })

    // Users Reducers
    .addCase(actionTypes.FETCH_USERS_REQUEST, (state) => {
      state.users.loading = true;
      state.users.error = null;
    })
    .addCase(actionTypes.FETCH_USERS_SUCCESS, (state, action) => {
      state.users.loading = false;
      state.users.data = action.payload.users;
      state.users.total = action.payload.total;
    })
    .addCase(actionTypes.FETCH_USERS_FAILURE, (state, action) => {
      state.users.loading = false;
      state.users.error = action.payload as string;
    })
    .addCase(actionTypes.INVITE_USER_REQUEST, (state) => {
      state.users.inviting = true;
      state.users.inviteError = null;
    })
    .addCase(actionTypes.INVITE_USER_SUCCESS, (state) => {
      state.users.inviting = false;
    })
    .addCase(actionTypes.INVITE_USER_FAILURE, (state, action) => {
      state.users.inviting = false;
      state.users.inviteError = action.payload as string;
    })
    .addCase(actionTypes.UPDATE_USER_ROLE_REQUEST, (state) => {
      state.users.updatingRole = true;
      state.users.updateRoleError = null;
    })
    .addCase(actionTypes.UPDATE_USER_ROLE_SUCCESS, (state) => {
      state.users.updatingRole = false;
    })
    .addCase(actionTypes.UPDATE_USER_ROLE_FAILURE, (state, action) => {
      state.users.updatingRole = false;
      state.users.updateRoleError = action.payload as string;
    })
    .addCase(actionTypes.DEACTIVATE_USER_REQUEST, (state) => {
      state.users.deactivating = true;
      state.users.deactivateError = null;
    })
    .addCase(actionTypes.DEACTIVATE_USER_SUCCESS, (state) => {
      state.users.deactivating = false;
    })
    .addCase(actionTypes.DEACTIVATE_USER_FAILURE, (state, action) => {
      state.users.deactivating = false;
      state.users.deactivateError = action.payload as string;
    })
    .addCase(actionTypes.REACTIVATE_USER_REQUEST, (state) => {
      state.users.reactivating = true;
      state.users.reactivateError = null;
    })
    .addCase(actionTypes.REACTIVATE_USER_SUCCESS, (state) => {
      state.users.reactivating = false;
    })
    .addCase(actionTypes.REACTIVATE_USER_FAILURE, (state, action) => {
      state.users.reactivating = false;
      state.users.reactivateError = action.payload as string;
    });
});

export default settingsReducer;