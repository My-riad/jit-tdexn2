import { AuthState } from '../../../common/interfaces/auth.interface';
import { PayloadAction } from '@reduxjs/toolkit'; // version ^1.9.0
import {
  LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, LOGIN_MFA_REQUIRED, VERIFY_MFA,
  LOGOUT_REQUEST, LOGOUT_SUCCESS, LOGOUT_FAILURE,
  REFRESH_TOKEN_REQUEST, REFRESH_TOKEN_SUCCESS, REFRESH_TOKEN_FAILURE,
  GET_CURRENT_USER_REQUEST, GET_CURRENT_USER_SUCCESS, GET_CURRENT_USER_FAILURE,
  FORGOT_PASSWORD_REQUEST, FORGOT_PASSWORD_SUCCESS, FORGOT_PASSWORD_FAILURE,
  RESET_PASSWORD_REQUEST, RESET_PASSWORD_SUCCESS, RESET_PASSWORD_FAILURE,
  CHANGE_PASSWORD_REQUEST, CHANGE_PASSWORD_SUCCESS, CHANGE_PASSWORD_FAILURE,
  SETUP_MFA_REQUEST, SETUP_MFA_SUCCESS, SETUP_MFA_FAILURE,
  VERIFY_MFA_SETUP_REQUEST, VERIFY_MFA_SETUP_SUCCESS, VERIFY_MFA_SETUP_FAILURE,
  DISABLE_MFA_REQUEST, DISABLE_MFA_SUCCESS, DISABLE_MFA_FAILURE
} from '../actions/authActions';

/**
 * Initial state for the authentication reducer
 */
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaSetup: null,
  message: null
};

/**
 * Redux reducer for authentication state management
 * Handles authentication-related actions such as login, logout, token refresh,
 * user profile management, password operations, and multi-factor authentication
 */
const authReducer = (state: AuthState = initialState, action: PayloadAction<any>): AuthState => {
  switch (action.type) {
    // Login actions
    case LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        loading: false,
        error: null,
        mfaRequired: false
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false
      };
    case LOGIN_MFA_REQUIRED:
      return {
        ...state,
        loading: false,
        mfaRequired: true,
        error: null
      };
    case VERIFY_MFA:
      return {
        ...state,
        loading: true,
        error: null
      };

    // Logout actions
    case LOGOUT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case LOGOUT_SUCCESS:
      return {
        ...initialState
      };
    case LOGOUT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Token refresh actions
    case REFRESH_TOKEN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        tokens: action.payload,
        loading: false,
        error: null
      };
    case REFRESH_TOKEN_FAILURE:
      return {
        ...initialState,
        error: action.payload
      };

    // User profile actions
    case GET_CURRENT_USER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case GET_CURRENT_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
        isAuthenticated: true
      };
    case GET_CURRENT_USER_FAILURE:
      return {
        ...initialState,
        error: action.payload
      };

    // Password management actions
    case FORGOT_PASSWORD_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
    case FORGOT_PASSWORD_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload,
        error: null
      };
    case FORGOT_PASSWORD_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null
      };
    case RESET_PASSWORD_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
    case RESET_PASSWORD_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload,
        error: null
      };
    case RESET_PASSWORD_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null
      };
    case CHANGE_PASSWORD_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
    case CHANGE_PASSWORD_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload,
        error: null
      };
    case CHANGE_PASSWORD_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null
      };

    // MFA actions
    case SETUP_MFA_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        mfaSetup: null
      };
    case SETUP_MFA_SUCCESS:
      return {
        ...state,
        loading: false,
        mfaSetup: action.payload,
        error: null
      };
    case SETUP_MFA_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        mfaSetup: null
      };
    case VERIFY_MFA_SETUP_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
    case VERIFY_MFA_SETUP_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload,
        error: null,
        mfaSetup: null,
        user: {
          ...state.user,
          mfaEnabled: true
        }
      };
    case VERIFY_MFA_SETUP_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null
      };
    case DISABLE_MFA_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
    case DISABLE_MFA_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload,
        error: null,
        user: {
          ...state.user,
          mfaEnabled: false
        }
      };
    case DISABLE_MFA_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null
      };

    default:
      return state;
  }
};

export default authReducer;