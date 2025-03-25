/**
 * Authentication action creators and types for the Shipper Portal
 *
 * This file defines Redux action types and creators for authentication-related
 * operations in the shipper portal, including login, logout, token refresh,
 * user profile management, password operations, and multi-factor authentication.
 */

import { createAction } from '@reduxjs/toolkit'; // v1.9.5
import {
  LoginRequest,
  PasswordResetRequest,
  PasswordResetConfirmation,
  PasswordChangeRequest
} from '../../../common/interfaces/auth.interface';

// ==============================
// Action Types
// ==============================

// Login Action Types
export const LOGIN_REQUEST = 'auth/loginRequest';
export const LOGIN_SUCCESS = 'auth/loginSuccess';
export const LOGIN_FAILURE = 'auth/loginFailure';
export const LOGIN_MFA_REQUIRED = 'auth/loginMfaRequired';

// Logout Action Types
export const LOGOUT_REQUEST = 'auth/logoutRequest';
export const LOGOUT_SUCCESS = 'auth/logoutSuccess';
export const LOGOUT_FAILURE = 'auth/logoutFailure';

// Token Refresh Action Types
export const REFRESH_TOKEN_REQUEST = 'auth/refreshTokenRequest';
export const REFRESH_TOKEN_SUCCESS = 'auth/refreshTokenSuccess';
export const REFRESH_TOKEN_FAILURE = 'auth/refreshTokenFailure';

// User Profile Action Types
export const GET_CURRENT_USER_REQUEST = 'auth/getCurrentUserRequest';
export const GET_CURRENT_USER_SUCCESS = 'auth/getCurrentUserSuccess';
export const GET_CURRENT_USER_FAILURE = 'auth/getCurrentUserFailure';

// Password Action Types
export const FORGOT_PASSWORD_REQUEST = 'auth/forgotPasswordRequest';
export const FORGOT_PASSWORD_SUCCESS = 'auth/forgotPasswordSuccess';
export const FORGOT_PASSWORD_FAILURE = 'auth/forgotPasswordFailure';

export const RESET_PASSWORD_REQUEST = 'auth/resetPasswordRequest';
export const RESET_PASSWORD_SUCCESS = 'auth/resetPasswordSuccess';
export const RESET_PASSWORD_FAILURE = 'auth/resetPasswordFailure';

export const CHANGE_PASSWORD_REQUEST = 'auth/changePasswordRequest';
export const CHANGE_PASSWORD_SUCCESS = 'auth/changePasswordSuccess';
export const CHANGE_PASSWORD_FAILURE = 'auth/changePasswordFailure';

// MFA Action Types
export const SETUP_MFA_REQUEST = 'auth/setupMfaRequest';
export const SETUP_MFA_SUCCESS = 'auth/setupMfaSuccess';
export const SETUP_MFA_FAILURE = 'auth/setupMfaFailure';

export const VERIFY_MFA_SETUP_REQUEST = 'auth/verifyMfaSetupRequest';
export const VERIFY_MFA_SETUP_SUCCESS = 'auth/verifyMfaSetupSuccess';
export const VERIFY_MFA_SETUP_FAILURE = 'auth/verifyMfaSetupFailure';

export const DISABLE_MFA_REQUEST = 'auth/disableMfaRequest';
export const DISABLE_MFA_SUCCESS = 'auth/disableMfaSuccess';
export const DISABLE_MFA_FAILURE = 'auth/disableMfaFailure';

// ==============================
// Action Creators
// ==============================

// Login Actions
export const loginRequest = createAction<LoginRequest>(LOGIN_REQUEST);
export const loginSuccess = createAction<{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    roles: string[];
    permissions: string[];
    carrierId: string | null;
    shipperId: string | null;
    driverId: string | null;
    mfaEnabled: boolean;
    profileImageUrl: string | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  mfaRequired: boolean;
}>(LOGIN_SUCCESS);
export const loginFailure = createAction<{ error: string }>(LOGIN_FAILURE);
export const loginMfaRequired = createAction<{ temporaryToken: string }>(LOGIN_MFA_REQUIRED);
export const verifyMfaRequest = createAction<{ temporaryToken: string; code: string }>('auth/verifyMfaRequest');

// Logout Actions
export const logoutRequest = createAction(LOGOUT_REQUEST);
export const logoutSuccess = createAction(LOGOUT_SUCCESS);
export const logoutFailure = createAction<{ error: string }>(LOGOUT_FAILURE);

// Token Refresh Actions
export const refreshTokenRequest = createAction<{ refreshToken: string }>(REFRESH_TOKEN_REQUEST);
export const refreshTokenSuccess = createAction<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}>(REFRESH_TOKEN_SUCCESS);
export const refreshTokenFailure = createAction<{ error: string }>(REFRESH_TOKEN_FAILURE);

// User Profile Actions
export const getCurrentUserRequest = createAction(GET_CURRENT_USER_REQUEST);
export const getCurrentUserSuccess = createAction<{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    roles: string[];
    permissions: string[];
    carrierId: string | null;
    shipperId: string | null;
    driverId: string | null;
    mfaEnabled: boolean;
    profileImageUrl: string | null;
  };
}>(GET_CURRENT_USER_SUCCESS);
export const getCurrentUserFailure = createAction<{ error: string }>(GET_CURRENT_USER_FAILURE);

// Password Actions
export const forgotPasswordRequest = createAction<PasswordResetRequest>(FORGOT_PASSWORD_REQUEST);
export const forgotPasswordSuccess = createAction(FORGOT_PASSWORD_SUCCESS);
export const forgotPasswordFailure = createAction<{ error: string }>(FORGOT_PASSWORD_FAILURE);

export const resetPasswordRequest = createAction<PasswordResetConfirmation>(RESET_PASSWORD_REQUEST);
export const resetPasswordSuccess = createAction(RESET_PASSWORD_SUCCESS);
export const resetPasswordFailure = createAction<{ error: string }>(RESET_PASSWORD_FAILURE);

export const changePasswordRequest = createAction<PasswordChangeRequest>(CHANGE_PASSWORD_REQUEST);
export const changePasswordSuccess = createAction(CHANGE_PASSWORD_SUCCESS);
export const changePasswordFailure = createAction<{ error: string }>(CHANGE_PASSWORD_FAILURE);

// MFA Actions
export const setupMfaRequest = createAction(SETUP_MFA_REQUEST);
export const setupMfaSuccess = createAction<{
  secret: string;
  qrCodeUrl: string;
}>(SETUP_MFA_SUCCESS);
export const setupMfaFailure = createAction<{ error: string }>(SETUP_MFA_FAILURE);

export const verifyMfaSetupRequest = createAction<{ code: string }>(VERIFY_MFA_SETUP_REQUEST);
export const verifyMfaSetupSuccess = createAction(VERIFY_MFA_SETUP_SUCCESS);
export const verifyMfaSetupFailure = createAction<{ error: string }>(VERIFY_MFA_SETUP_FAILURE);

export const disableMfaRequest = createAction<{ code: string }>(DISABLE_MFA_REQUEST);
export const disableMfaSuccess = createAction(DISABLE_MFA_SUCCESS);
export const disableMfaFailure = createAction<{ error: string }>(DISABLE_MFA_FAILURE);