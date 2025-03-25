import { 
  LoginRequest, 
  AuthUser, 
  AuthTokens, 
  PasswordResetRequest, 
  PasswordResetConfirmation, 
  PasswordChangeRequest,
  MfaSetupResponse
} from '../../../common/interfaces/auth.interface';
import { PayloadAction } from '@reduxjs/toolkit'; // version ^1.9.0

// Action Types
// Login
export const LOGIN_REQUEST = 'auth/LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'auth/LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'auth/LOGIN_FAILURE';
export const LOGIN_MFA_REQUIRED = 'auth/LOGIN_MFA_REQUIRED';
export const VERIFY_MFA = 'auth/VERIFY_MFA';

// Logout
export const LOGOUT_REQUEST = 'auth/LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'auth/LOGOUT_SUCCESS';
export const LOGOUT_FAILURE = 'auth/LOGOUT_FAILURE';

// Token Refresh
export const REFRESH_TOKEN_REQUEST = 'auth/REFRESH_TOKEN_REQUEST';
export const REFRESH_TOKEN_SUCCESS = 'auth/REFRESH_TOKEN_SUCCESS';
export const REFRESH_TOKEN_FAILURE = 'auth/REFRESH_TOKEN_FAILURE';

// User Profile
export const GET_CURRENT_USER_REQUEST = 'auth/GET_CURRENT_USER_REQUEST';
export const GET_CURRENT_USER_SUCCESS = 'auth/GET_CURRENT_USER_SUCCESS';
export const GET_CURRENT_USER_FAILURE = 'auth/GET_CURRENT_USER_FAILURE';

// Password Operations
export const FORGOT_PASSWORD_REQUEST = 'auth/FORGOT_PASSWORD_REQUEST';
export const FORGOT_PASSWORD_SUCCESS = 'auth/FORGOT_PASSWORD_SUCCESS';
export const FORGOT_PASSWORD_FAILURE = 'auth/FORGOT_PASSWORD_FAILURE';

export const RESET_PASSWORD_REQUEST = 'auth/RESET_PASSWORD_REQUEST';
export const RESET_PASSWORD_SUCCESS = 'auth/RESET_PASSWORD_SUCCESS';
export const RESET_PASSWORD_FAILURE = 'auth/RESET_PASSWORD_FAILURE';

export const CHANGE_PASSWORD_REQUEST = 'auth/CHANGE_PASSWORD_REQUEST';
export const CHANGE_PASSWORD_SUCCESS = 'auth/CHANGE_PASSWORD_SUCCESS';
export const CHANGE_PASSWORD_FAILURE = 'auth/CHANGE_PASSWORD_FAILURE';

// Multi-factor Authentication
export const SETUP_MFA_REQUEST = 'auth/SETUP_MFA_REQUEST';
export const SETUP_MFA_SUCCESS = 'auth/SETUP_MFA_SUCCESS';
export const SETUP_MFA_FAILURE = 'auth/SETUP_MFA_FAILURE';

export const VERIFY_MFA_SETUP_REQUEST = 'auth/VERIFY_MFA_SETUP_REQUEST';
export const VERIFY_MFA_SETUP_SUCCESS = 'auth/VERIFY_MFA_SETUP_SUCCESS';
export const VERIFY_MFA_SETUP_FAILURE = 'auth/VERIFY_MFA_SETUP_FAILURE';

export const DISABLE_MFA_REQUEST = 'auth/DISABLE_MFA_REQUEST';
export const DISABLE_MFA_SUCCESS = 'auth/DISABLE_MFA_SUCCESS';
export const DISABLE_MFA_FAILURE = 'auth/DISABLE_MFA_FAILURE';

// Action Creators

// Login actions
export const login = (credentials: LoginRequest): PayloadAction<LoginRequest> => ({
  type: LOGIN_REQUEST,
  payload: credentials
});

export const loginSuccess = (authData: { user: AuthUser, tokens: AuthTokens }): PayloadAction<{ user: AuthUser, tokens: AuthTokens }> => ({
  type: LOGIN_SUCCESS,
  payload: authData
});

export const loginFailure = (error: string): PayloadAction<string> => ({
  type: LOGIN_FAILURE,
  payload: error
});

export const loginMfaRequired = (userId: string): PayloadAction<string> => ({
  type: LOGIN_MFA_REQUIRED,
  payload: userId
});

export const verifyMfa = (userId: string, mfaCode: string): PayloadAction<{ userId: string, mfaCode: string }> => ({
  type: VERIFY_MFA,
  payload: { userId, mfaCode }
});

// Logout actions
export const logout = (): PayloadAction<void> => ({
  type: LOGOUT_REQUEST,
  payload: undefined
});

export const logoutSuccess = (): PayloadAction<void> => ({
  type: LOGOUT_SUCCESS,
  payload: undefined
});

export const logoutFailure = (error: string): PayloadAction<string> => ({
  type: LOGOUT_FAILURE,
  payload: error
});

// Token refresh actions
export const refreshToken = (): PayloadAction<void> => ({
  type: REFRESH_TOKEN_REQUEST,
  payload: undefined
});

export const refreshTokenSuccess = (tokens: AuthTokens): PayloadAction<AuthTokens> => ({
  type: REFRESH_TOKEN_SUCCESS,
  payload: tokens
});

export const refreshTokenFailure = (error: string): PayloadAction<string> => ({
  type: REFRESH_TOKEN_FAILURE,
  payload: error
});

// User profile actions
export const getCurrentUser = (): PayloadAction<void> => ({
  type: GET_CURRENT_USER_REQUEST,
  payload: undefined
});

export const getCurrentUserSuccess = (user: AuthUser): PayloadAction<AuthUser> => ({
  type: GET_CURRENT_USER_SUCCESS,
  payload: user
});

export const getCurrentUserFailure = (error: string): PayloadAction<string> => ({
  type: GET_CURRENT_USER_FAILURE,
  payload: error
});

// Password management actions
export const forgotPassword = (request: PasswordResetRequest): PayloadAction<PasswordResetRequest> => ({
  type: FORGOT_PASSWORD_REQUEST,
  payload: request
});

export const forgotPasswordSuccess = (message: string): PayloadAction<string> => ({
  type: FORGOT_PASSWORD_SUCCESS,
  payload: message
});

export const forgotPasswordFailure = (error: string): PayloadAction<string> => ({
  type: FORGOT_PASSWORD_FAILURE,
  payload: error
});

export const resetPassword = (resetData: PasswordResetConfirmation): PayloadAction<PasswordResetConfirmation> => ({
  type: RESET_PASSWORD_REQUEST,
  payload: resetData
});

export const resetPasswordSuccess = (message: string): PayloadAction<string> => ({
  type: RESET_PASSWORD_SUCCESS,
  payload: message
});

export const resetPasswordFailure = (error: string): PayloadAction<string> => ({
  type: RESET_PASSWORD_FAILURE,
  payload: error
});

export const changePassword = (passwordData: PasswordChangeRequest): PayloadAction<PasswordChangeRequest> => ({
  type: CHANGE_PASSWORD_REQUEST,
  payload: passwordData
});

export const changePasswordSuccess = (message: string): PayloadAction<string> => ({
  type: CHANGE_PASSWORD_SUCCESS,
  payload: message
});

export const changePasswordFailure = (error: string): PayloadAction<string> => ({
  type: CHANGE_PASSWORD_FAILURE,
  payload: error
});

// MFA actions
export const setupMfa = (): PayloadAction<void> => ({
  type: SETUP_MFA_REQUEST,
  payload: undefined
});

export const setupMfaSuccess = (setupData: MfaSetupResponse): PayloadAction<MfaSetupResponse> => ({
  type: SETUP_MFA_SUCCESS,
  payload: setupData
});

export const setupMfaFailure = (error: string): PayloadAction<string> => ({
  type: SETUP_MFA_FAILURE,
  payload: error
});

export const verifyMfaSetup = (secret: string, mfaCode: string): PayloadAction<{ secret: string, mfaCode: string }> => ({
  type: VERIFY_MFA_SETUP_REQUEST,
  payload: { secret, mfaCode }
});

export const verifyMfaSetupSuccess = (message: string): PayloadAction<string> => ({
  type: VERIFY_MFA_SETUP_SUCCESS,
  payload: message
});

export const verifyMfaSetupFailure = (error: string): PayloadAction<string> => ({
  type: VERIFY_MFA_SETUP_FAILURE,
  payload: error
});

export const disableMfa = (password: string): PayloadAction<{ password: string }> => ({
  type: DISABLE_MFA_REQUEST,
  payload: { password }
});

export const disableMfaSuccess = (message: string): PayloadAction<string> => ({
  type: DISABLE_MFA_SUCCESS,
  payload: message
});

export const disableMfaFailure = (error: string): PayloadAction<string> => ({
  type: DISABLE_MFA_FAILURE,
  payload: error
});