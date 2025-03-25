/**
 * Authentication saga for the Shipper Portal
 * 
 * Handles authentication-related side effects including login, logout, token refresh,
 * password management, and multi-factor authentication (MFA) operations using Redux-Saga.
 */

import { takeLatest, takeEvery, all, call, put, select } from 'redux-saga/effects'; // v6.1.1
import * as authApi from '../../../common/api/authApi';
import { 
  LoginRequest, 
  PasswordResetRequest, 
  PasswordResetConfirmation, 
  PasswordChangeRequest,
  AuthState
} from '../../../common/interfaces/auth.interface';
import { 
  LOGIN_REQUEST, 
  LOGIN_SUCCESS, 
  LOGIN_FAILURE,
  LOGIN_MFA_REQUIRED,
  LOGOUT_REQUEST,
  LOGOUT_SUCCESS,
  LOGOUT_FAILURE,
  REFRESH_TOKEN_REQUEST,
  REFRESH_TOKEN_SUCCESS,
  REFRESH_TOKEN_FAILURE,
  GET_CURRENT_USER_REQUEST,
  GET_CURRENT_USER_SUCCESS,
  GET_CURRENT_USER_FAILURE,
  FORGOT_PASSWORD_REQUEST,
  FORGOT_PASSWORD_SUCCESS,
  FORGOT_PASSWORD_FAILURE,
  RESET_PASSWORD_REQUEST,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_FAILURE,
  CHANGE_PASSWORD_REQUEST,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILURE,
  SETUP_MFA_REQUEST,
  SETUP_MFA_SUCCESS,
  SETUP_MFA_FAILURE,
  VERIFY_MFA_SETUP_REQUEST,
  VERIFY_MFA_SETUP_SUCCESS,
  VERIFY_MFA_SETUP_FAILURE,
  DISABLE_MFA_REQUEST,
  DISABLE_MFA_SUCCESS,
  DISABLE_MFA_FAILURE,
  loginSuccess,
  loginFailure,
  loginMfaRequired,
  logoutSuccess,
  logoutFailure,
  refreshTokenSuccess,
  refreshTokenFailure,
  getCurrentUserSuccess,
  getCurrentUserFailure,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordSuccess,
  resetPasswordFailure,
  changePasswordSuccess,
  changePasswordFailure,
  setupMfaSuccess,
  setupMfaFailure,
  verifyMfaSetupSuccess,
  verifyMfaSetupFailure,
  disableMfaSuccess,
  disableMfaFailure
} from '../actions/authActions';
import logger from '../../../common/utils/logger';

/**
 * Saga worker function that handles user login
 * 
 * @param action The login request action with credentials
 */
function* handleLogin(action: { type: string, payload: LoginRequest }) {
  try {
    const response = yield call(authApi.login, action.payload);
    
    if (response.mfaRequired) {
      // If MFA is required, dispatch MFA required action
      yield put(loginMfaRequired({ temporaryToken: response.tokens.accessToken }));
    } else {
      // If login successful without MFA, dispatch success action
      yield put(loginSuccess({
        user: response.user,
        tokens: response.tokens,
        mfaRequired: false
      }));
    }
  } catch (error) {
    logger.error('Login failed', { error });
    yield put(loginFailure({ error: error.message || 'Authentication failed' }));
  }
}

/**
 * Saga worker function that handles MFA verification during login
 * 
 * @param action The MFA verification action with userId and token
 */
function* handleVerifyMfa(action: { type: string, payload: { userId: string, mfaToken: string } }) {
  try {
    const { userId, mfaToken } = action.payload;
    const response = yield call(authApi.verifyMfa, userId, mfaToken);
    
    yield put(loginSuccess({
      user: response.user,
      tokens: response.tokens,
      mfaRequired: false
    }));
  } catch (error) {
    logger.error('MFA verification failed', { error });
    yield put(loginFailure({ error: error.message || 'MFA verification failed' }));
  }
}

/**
 * Saga worker function that handles user logout
 * 
 * @param action The logout request action
 */
function* handleLogout(action: { type: string }) {
  try {
    // Get current auth state to access the refresh token
    const authState: AuthState = yield select(getAuthState);
    
    if (authState.tokens && authState.tokens.refreshToken) {
      yield call(authApi.logout, authState.tokens.refreshToken);
    }
    
    yield put(logoutSuccess());
  } catch (error) {
    logger.error('Logout failed', { error });
    yield put(logoutFailure({ error: error.message || 'Logout failed' }));
  }
}

/**
 * Saga worker function that handles token refresh
 * 
 * @param action The token refresh request action
 */
function* handleRefreshToken(action: { type: string }) {
  try {
    // Get current auth state to access the refresh token
    const authState: AuthState = yield select(getAuthState);
    
    if (!authState.tokens || !authState.tokens.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const result = yield call(authApi.refreshToken, authState.tokens.refreshToken);
    
    yield put(refreshTokenSuccess({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn
    }));
  } catch (error) {
    logger.error('Token refresh failed', { error });
    yield put(refreshTokenFailure({ error: error.message || 'Token refresh failed' }));
  }
}

/**
 * Saga worker function that retrieves the current user profile
 * 
 * @param action The get current user request action
 */
function* handleGetCurrentUser(action: { type: string }) {
  try {
    const response = yield call(authApi.validateToken);
    
    if (response.valid && response.user) {
      yield put(getCurrentUserSuccess({ user: response.user }));
    } else {
      throw new Error('Failed to get user data');
    }
  } catch (error) {
    logger.error('Failed to get current user', { error });
    yield put(getCurrentUserFailure({ error: error.message || 'Failed to get user data' }));
  }
}

/**
 * Saga worker function that handles password reset request
 * 
 * @param action The forgot password request action with email
 */
function* handleForgotPassword(action: { type: string, payload: PasswordResetRequest }) {
  try {
    const response = yield call(authApi.forgotPassword, action.payload);
    
    if (response.success) {
      yield put(forgotPasswordSuccess());
      logger.info('Password reset email sent successfully');
    } else {
      throw new Error(response.message || 'Failed to send password reset email');
    }
  } catch (error) {
    logger.error('Failed to request password reset', { error });
    yield put(forgotPasswordFailure({ error: error.message || 'Failed to request password reset' }));
  }
}

/**
 * Saga worker function that handles password reset confirmation
 * 
 * @param action The reset password request action with token and new password
 */
function* handleResetPassword(action: { type: string, payload: PasswordResetConfirmation }) {
  try {
    const response = yield call(authApi.resetPassword, action.payload);
    
    if (response.success) {
      yield put(resetPasswordSuccess());
      logger.info('Password reset successfully');
    } else {
      throw new Error(response.message || 'Failed to reset password');
    }
  } catch (error) {
    logger.error('Failed to reset password', { error });
    yield put(resetPasswordFailure({ error: error.message || 'Failed to reset password' }));
  }
}

/**
 * Saga worker function that handles password change for authenticated user
 * 
 * @param action The change password request action with current and new password
 */
function* handleChangePassword(action: { type: string, payload: PasswordChangeRequest }) {
  try {
    const response = yield call(authApi.changePassword, action.payload);
    
    if (response.success) {
      yield put(changePasswordSuccess());
      logger.info('Password changed successfully');
    } else {
      throw new Error(response.message || 'Failed to change password');
    }
  } catch (error) {
    logger.error('Failed to change password', { error });
    yield put(changePasswordFailure({ error: error.message || 'Failed to change password' }));
  }
}

/**
 * Saga worker function that handles MFA setup initiation
 * 
 * @param action The setup MFA request action
 */
function* handleSetupMfa(action: { type: string }) {
  try {
    const response = yield call(authApi.setupMfa);
    
    yield put(setupMfaSuccess({
      secret: response.secret,
      qrCodeUrl: response.qrCodeUrl
    }));
  } catch (error) {
    logger.error('Failed to setup MFA', { error });
    yield put(setupMfaFailure({ error: error.message || 'Failed to setup MFA' }));
  }
}

/**
 * Saga worker function that handles MFA setup verification
 * 
 * @param action The verify MFA setup request action with token
 */
function* handleVerifyMfaSetup(action: { type: string, payload: { token: string } }) {
  try {
    const response = yield call(authApi.verifyMfaSetup, action.payload.token);
    
    if (response.success) {
      yield put(verifyMfaSetupSuccess());
      logger.info('MFA setup verified successfully');
    } else {
      throw new Error(response.message || 'Failed to verify MFA setup');
    }
  } catch (error) {
    logger.error('Failed to verify MFA setup', { error });
    yield put(verifyMfaSetupFailure({ error: error.message || 'Failed to verify MFA setup' }));
  }
}

/**
 * Saga worker function that handles MFA disabling
 * 
 * @param action The disable MFA request action with token
 */
function* handleDisableMfa(action: { type: string, payload: { token: string } }) {
  try {
    const response = yield call(authApi.disableMfa, action.payload.token);
    
    if (response.success) {
      yield put(disableMfaSuccess());
      logger.info('MFA disabled successfully');
    } else {
      throw new Error(response.message || 'Failed to disable MFA');
    }
  } catch (error) {
    logger.error('Failed to disable MFA', { error });
    yield put(disableMfaFailure({ error: error.message || 'Failed to disable MFA' }));
  }
}

/**
 * Selector function to get the authentication state from the Redux store
 */
export const getAuthState = (state: { auth: AuthState }): AuthState => state.auth;

/**
 * Root saga watcher that listens for authentication-related actions
 * and triggers the appropriate worker sagas
 */
function* watchAuth() {
  yield all([
    takeLatest(LOGIN_REQUEST, handleLogin),
    takeLatest(LOGIN_MFA_REQUIRED, handleVerifyMfa),
    takeLatest(LOGOUT_REQUEST, handleLogout),
    takeLatest(REFRESH_TOKEN_REQUEST, handleRefreshToken),
    takeLatest(GET_CURRENT_USER_REQUEST, handleGetCurrentUser),
    takeLatest(FORGOT_PASSWORD_REQUEST, handleForgotPassword),
    takeLatest(RESET_PASSWORD_REQUEST, handleResetPassword),
    takeLatest(CHANGE_PASSWORD_REQUEST, handleChangePassword),
    takeLatest(SETUP_MFA_REQUEST, handleSetupMfa),
    takeLatest(VERIFY_MFA_SETUP_REQUEST, handleVerifyMfaSetup),
    takeLatest(DISABLE_MFA_REQUEST, handleDisableMfa)
  ]);
}

export default watchAuth;