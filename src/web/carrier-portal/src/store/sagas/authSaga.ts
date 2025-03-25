import { PayloadAction } from '@reduxjs/toolkit';
import { takeLatest, takeEvery, all, call, put, select } from 'redux-saga/effects';

import * as authService from '../../../common/services/authService';
import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_MFA_REQUIRED,
  VERIFY_MFA,
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
import { AuthState, RootState } from '../../../common/interfaces/auth.interface';

/**
 * Saga for handling user login requests
 * @param action - Redux action containing login credentials
 */
function* loginSaga(action: PayloadAction<any>) {
  try {
    const response = yield call(authService.login, action.payload);
    
    if (response.mfaRequired) {
      yield put(loginMfaRequired(response.userId));
    } else {
      yield put(loginSuccess({ user: response.user, tokens: response.tokens }));
    }
  } catch (error) {
    logger.error('Login failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    yield put(loginFailure(errorMessage));
  }
}

/**
 * Saga for handling MFA verification during login
 * @param action - Redux action containing userId and MFA code
 */
function* verifyMfaSaga(action: PayloadAction<{ userId: string, mfaCode: string }>) {
  try {
    const { userId, mfaCode } = action.payload;
    const response = yield call(authService.verifyMfaCode, userId, mfaCode);
    yield put(loginSuccess({ user: response.user, tokens: response.tokens }));
  } catch (error) {
    logger.error('MFA verification failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'MFA verification failed';
    yield put(loginFailure(errorMessage));
  }
}

/**
 * Saga for handling user logout requests
 */
function* logoutSaga() {
  try {
    yield call(authService.logout);
    yield put(logoutSuccess());
  } catch (error) {
    logger.error('Logout failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    yield put(logoutFailure(errorMessage));
  }
}

/**
 * Saga for handling token refresh requests
 */
function* refreshTokenSaga() {
  try {
    const tokens = yield call(authService.refreshToken);
    yield put(refreshTokenSuccess(tokens));
  } catch (error) {
    logger.error('Token refresh failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
    yield put(refreshTokenFailure(errorMessage));
  }
}

/**
 * Saga for fetching current user profile
 */
function* getCurrentUserSaga() {
  try {
    const user = yield call(authService.getCurrentUser);
    
    if (user) {
      yield put(getCurrentUserSuccess(user));
    } else {
      yield put(getCurrentUserFailure('User not found or not authenticated'));
    }
  } catch (error) {
    logger.error('Failed to get current user', { error });
    const errorMessage = error instanceof Error ? error.message : 'Failed to get current user';
    yield put(getCurrentUserFailure(errorMessage));
  }
}

/**
 * Saga for handling password reset requests
 * @param action - Redux action containing email for password reset
 */
function* forgotPasswordSaga(action: PayloadAction<any>) {
  try {
    const response = yield call(authService.forgotPassword, action.payload);
    yield put(forgotPasswordSuccess(response.message || 'Password reset email sent'));
  } catch (error) {
    logger.error('Password reset request failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
    yield put(forgotPasswordFailure(errorMessage));
  }
}

/**
 * Saga for handling password reset confirmation
 * @param action - Redux action containing token and new password
 */
function* resetPasswordSaga(action: PayloadAction<any>) {
  try {
    const response = yield call(authService.resetPassword, action.payload);
    yield put(resetPasswordSuccess(response.message || 'Password reset successful'));
  } catch (error) {
    logger.error('Password reset failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
    yield put(resetPasswordFailure(errorMessage));
  }
}

/**
 * Saga for handling password change requests
 * @param action - Redux action containing current and new password
 */
function* changePasswordSaga(action: PayloadAction<any>) {
  try {
    const response = yield call(authService.changePassword, action.payload);
    yield put(changePasswordSuccess(response.message || 'Password changed successfully'));
  } catch (error) {
    logger.error('Password change failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'Password change failed';
    yield put(changePasswordFailure(errorMessage));
  }
}

/**
 * Saga for initiating MFA setup
 */
function* setupMfaSaga() {
  try {
    const setupData = yield call(authService.setupMfa);
    yield put(setupMfaSuccess(setupData));
  } catch (error) {
    logger.error('MFA setup failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'MFA setup failed';
    yield put(setupMfaFailure(errorMessage));
  }
}

/**
 * Saga for verifying MFA setup with verification code
 * @param action - Redux action containing secret and verification code
 */
function* verifyMfaSetupSaga(action: PayloadAction<{ secret: string, mfaCode: string }>) {
  try {
    const { mfaCode } = action.payload;
    const response = yield call(authService.verifyMfaSetup, mfaCode);
    yield put(verifyMfaSetupSuccess(response.message || 'MFA setup verified successfully'));
  } catch (error) {
    logger.error('MFA setup verification failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'MFA setup verification failed';
    yield put(verifyMfaSetupFailure(errorMessage));
  }
}

/**
 * Saga for disabling MFA
 * @param action - Redux action containing password for verification
 */
function* disableMfaSaga(action: PayloadAction<{ password: string }>) {
  try {
    const { password } = action.payload;
    const response = yield call(authService.disableMfa, password);
    yield put(disableMfaSuccess(response.message || 'MFA disabled successfully'));
  } catch (error) {
    logger.error('MFA disable failed', { error });
    const errorMessage = error instanceof Error ? error.message : 'MFA disable failed';
    yield put(disableMfaFailure(errorMessage));
  }
}

/**
 * Selector function to get authentication state from root state
 * @param state - Root state of the application
 * @returns Authentication state
 */
export const selectAuthState = (state: RootState): AuthState => state.auth;

/**
 * Root saga watcher for authentication-related actions
 */
export function* watchAuth() {
  yield all([
    takeLatest(LOGIN_REQUEST, loginSaga),
    takeLatest(VERIFY_MFA, verifyMfaSaga),
    takeLatest(LOGOUT_REQUEST, logoutSaga),
    takeLatest(REFRESH_TOKEN_REQUEST, refreshTokenSaga),
    takeLatest(GET_CURRENT_USER_REQUEST, getCurrentUserSaga),
    takeLatest(FORGOT_PASSWORD_REQUEST, forgotPasswordSaga),
    takeLatest(RESET_PASSWORD_REQUEST, resetPasswordSaga),
    takeLatest(CHANGE_PASSWORD_REQUEST, changePasswordSaga),
    takeLatest(SETUP_MFA_REQUEST, setupMfaSaga),
    takeLatest(VERIFY_MFA_SETUP_REQUEST, verifyMfaSetupSaga),
    takeLatest(DISABLE_MFA_REQUEST, disableMfaSaga)
  ]);
}

export default watchAuth;