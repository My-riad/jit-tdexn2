/**
 * Redux reducer for managing authentication state in the driver mobile application.
 * Handles state transitions for login, logout, token refresh, MFA verification, and user profile operations.
 */

import { AuthActionTypes, AuthAction } from '../actions/authActions';
import { AuthState } from '../../../common/interfaces/auth.interface';

/**
 * Initial state for the authentication reducer
 */
export const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaUserId: null,
  mfaToken: null
};

/**
 * Redux reducer function that handles authentication state transitions based on dispatched actions
 * @param state Current authentication state, defaults to initialState if undefined
 * @param action Auth action being dispatched
 * @returns New authentication state after applying the action
 */
const authReducer = (state: AuthState = initialState, action: AuthAction): AuthState => {
  switch (action.type) {
    // Login actions
    case AuthActionTypes.LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        loading: false,
        error: null,
        mfaRequired: false,
        mfaUserId: null,
        mfaToken: null
      };
    
    case AuthActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        isAuthenticated: false,
        user: null,
        tokens: null
      };
    
    // MFA actions
    case AuthActionTypes.MFA_REQUIRED:
      return {
        ...state,
        loading: false,
        mfaRequired: true,
        mfaUserId: action.payload.userId,
        error: null
      };
    
    case AuthActionTypes.VERIFY_MFA_REQUEST:
      return {
        ...state,
        loading: true,
        mfaToken: action.payload.mfaToken,
        error: null
      };
    
    case AuthActionTypes.VERIFY_MFA_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        loading: false,
        error: null,
        mfaRequired: false,
        mfaUserId: null,
        mfaToken: null
      };
    
    case AuthActionTypes.VERIFY_MFA_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    
    // Logout actions
    case AuthActionTypes.LOGOUT_REQUEST:
      return {
        ...state,
        loading: true
      };
    
    case AuthActionTypes.LOGOUT_SUCCESS:
      return {
        ...initialState
      };
    
    case AuthActionTypes.LOGOUT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    
    // Token refresh actions
    case AuthActionTypes.REFRESH_TOKEN_REQUEST:
      return {
        ...state,
        loading: true
      };
    
    case AuthActionTypes.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        tokens: action.payload.tokens,
        loading: false,
        error: null
      };
    
    case AuthActionTypes.REFRESH_TOKEN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        isAuthenticated: false,
        user: null,
        tokens: null
      };
    
    // Current user actions
    case AuthActionTypes.GET_CURRENT_USER_REQUEST:
      return {
        ...state,
        loading: true
      };
    
    case AuthActionTypes.GET_CURRENT_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        loading: false,
        error: null
      };
    
    case AuthActionTypes.GET_CURRENT_USER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    
    // Return current state for unhandled actions
    default:
      return state;
  }
};

export default authReducer;