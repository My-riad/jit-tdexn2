/**
 * Authentication reducer for the Shipper Portal
 *
 * Manages authentication state transitions including login, logout, token refresh,
 * user profile management, and multi-factor authentication operations.
 */

import { createReducer } from '@reduxjs/toolkit'; // v1.9.5
import { AuthState } from '../../../common/interfaces/auth.interface';
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
  DISABLE_MFA_FAILURE
} from '../actions/authActions';

// Define the initial authentication state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: false,
  error: null
};

// Create the authentication reducer
const authReducer = createReducer(initialState, (builder) => {
  builder
    // Login flow
    .addCase(LOGIN_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(LOGIN_SUCCESS, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.loading = false;
      state.error = null;
    })
    .addCase(LOGIN_FAILURE, (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.tokens = null;
      state.loading = false;
      state.error = action.payload.error;
    })
    .addCase(LOGIN_MFA_REQUIRED, (state, action) => {
      state.loading = false;
      // Store temporary token in state for MFA verification
      state.tokens = {
        accessToken: action.payload.temporaryToken,
        refreshToken: '',
        expiresIn: 0
      };
      state.error = null;
    })
    
    // Logout flow
    .addCase(LOGOUT_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(LOGOUT_SUCCESS, (state) => {
      // Reset to initial state on successful logout
      return initialState;
    })
    .addCase(LOGOUT_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })
    
    // Token refresh flow
    .addCase(REFRESH_TOKEN_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(REFRESH_TOKEN_SUCCESS, (state, action) => {
      state.tokens = action.payload;
      state.loading = false;
      state.error = null;
    })
    .addCase(REFRESH_TOKEN_FAILURE, (state, action) => {
      // Token refresh failures typically mean the session is expired
      state.isAuthenticated = false;
      state.tokens = null;
      state.loading = false;
      state.error = action.payload.error;
    })
    
    // User profile flow
    .addCase(GET_CURRENT_USER_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(GET_CURRENT_USER_SUCCESS, (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    })
    .addCase(GET_CURRENT_USER_FAILURE, (state, action) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = action.payload.error;
    })
    
    // Password management flows - these don't modify auth state
    // but we track loading and errors
    .addCase(FORGOT_PASSWORD_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(FORGOT_PASSWORD_SUCCESS, (state) => {
      state.loading = false;
      state.error = null;
    })
    .addCase(FORGOT_PASSWORD_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })
    
    .addCase(RESET_PASSWORD_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(RESET_PASSWORD_SUCCESS, (state) => {
      state.loading = false;
      state.error = null;
    })
    .addCase(RESET_PASSWORD_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })
    
    .addCase(CHANGE_PASSWORD_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(CHANGE_PASSWORD_SUCCESS, (state) => {
      state.loading = false;
      state.error = null;
    })
    .addCase(CHANGE_PASSWORD_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })
    
    // MFA setup flow
    .addCase(SETUP_MFA_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(SETUP_MFA_SUCCESS, (state) => {
      state.loading = false;
      state.error = null;
      // Note: MFA isn't enabled yet, just setup initiated
    })
    .addCase(SETUP_MFA_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })
    
    // MFA verification flow
    .addCase(VERIFY_MFA_SETUP_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(VERIFY_MFA_SETUP_SUCCESS, (state) => {
      if (state.user) {
        state.user.mfaEnabled = true;
      }
      state.loading = false;
      state.error = null;
    })
    .addCase(VERIFY_MFA_SETUP_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })
    
    // MFA disable flow
    .addCase(DISABLE_MFA_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(DISABLE_MFA_SUCCESS, (state) => {
      if (state.user) {
        state.user.mfaEnabled = false;
      }
      state.loading = false;
      state.error = null;
    })
    .addCase(DISABLE_MFA_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    });
});

export default authReducer;