/**
 * Redux action creators and action types for authentication in the driver mobile application.
 * Defines actions for login, logout, token refresh, MFA verification, and user profile management.
 */

import { ThunkAction, ThunkDispatch } from 'redux-thunk'; // ^2.4.2
import { LoginRequest, LoginResponse, AuthTokens, AuthUser } from '../../../common/interfaces/auth.interface';
import * as authService from '../../../common/services/authService';

// Define action types as string constants
export enum AuthActionTypes {
  LOGIN_REQUEST = 'auth/LOGIN_REQUEST',
  LOGIN_SUCCESS = 'auth/LOGIN_SUCCESS',
  LOGIN_FAILURE = 'auth/LOGIN_FAILURE',
  
  LOGOUT_REQUEST = 'auth/LOGOUT_REQUEST',
  LOGOUT_SUCCESS = 'auth/LOGOUT_SUCCESS',
  LOGOUT_FAILURE = 'auth/LOGOUT_FAILURE',
  
  REFRESH_TOKEN_REQUEST = 'auth/REFRESH_TOKEN_REQUEST',
  REFRESH_TOKEN_SUCCESS = 'auth/REFRESH_TOKEN_SUCCESS',
  REFRESH_TOKEN_FAILURE = 'auth/REFRESH_TOKEN_FAILURE',
  
  MFA_REQUIRED = 'auth/MFA_REQUIRED',
  VERIFY_MFA_REQUEST = 'auth/VERIFY_MFA_REQUEST',
  VERIFY_MFA_SUCCESS = 'auth/VERIFY_MFA_SUCCESS',
  VERIFY_MFA_FAILURE = 'auth/VERIFY_MFA_FAILURE',
  
  GET_CURRENT_USER_REQUEST = 'auth/GET_CURRENT_USER_REQUEST',
  GET_CURRENT_USER_SUCCESS = 'auth/GET_CURRENT_USER_SUCCESS',
  GET_CURRENT_USER_FAILURE = 'auth/GET_CURRENT_USER_FAILURE'
}

// Define the union type for all possible auth actions
export type AuthAction =
  // Login actions
  | { type: typeof AuthActionTypes.LOGIN_REQUEST; payload: LoginRequest }
  | { type: typeof AuthActionTypes.LOGIN_SUCCESS; payload: { user: AuthUser; tokens: AuthTokens } }
  | { type: typeof AuthActionTypes.LOGIN_FAILURE; payload: { error: string } }
  | { type: typeof AuthActionTypes.MFA_REQUIRED; payload: { userId: string } }
  
  // MFA verification actions
  | { type: typeof AuthActionTypes.VERIFY_MFA_REQUEST; payload: { userId: string; mfaToken: string } }
  | { type: typeof AuthActionTypes.VERIFY_MFA_SUCCESS; payload: { user: AuthUser; tokens: AuthTokens } }
  | { type: typeof AuthActionTypes.VERIFY_MFA_FAILURE; payload: { error: string } }
  
  // Logout actions
  | { type: typeof AuthActionTypes.LOGOUT_REQUEST }
  | { type: typeof AuthActionTypes.LOGOUT_SUCCESS }
  | { type: typeof AuthActionTypes.LOGOUT_FAILURE; payload: { error: string } }
  
  // Token refresh actions
  | { type: typeof AuthActionTypes.REFRESH_TOKEN_REQUEST }
  | { type: typeof AuthActionTypes.REFRESH_TOKEN_SUCCESS; payload: { tokens: AuthTokens } }
  | { type: typeof AuthActionTypes.REFRESH_TOKEN_FAILURE; payload: { error: string } }
  
  // Current user actions
  | { type: typeof AuthActionTypes.GET_CURRENT_USER_REQUEST }
  | { type: typeof AuthActionTypes.GET_CURRENT_USER_SUCCESS; payload: { user: AuthUser } }
  | { type: typeof AuthActionTypes.GET_CURRENT_USER_FAILURE; payload: { error: string } };

// For type checking - to be replaced with actual AppState from root reducer
type AppState = any;
type AppDispatch = ThunkDispatch<AppState, unknown, AuthAction>;

/**
 * Initiates user login with email and password
 * @param credentials The login credentials including email, password, and rememberMe flag
 */
export const login = (
  credentials: LoginRequest
): ThunkAction<Promise<void>, AppState, unknown, AuthAction> => {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      // Dispatch login request action
      dispatch({
        type: AuthActionTypes.LOGIN_REQUEST,
        payload: credentials
      });

      // Call authentication service
      const response = await authService.login(credentials);

      // Check if MFA is required
      if (response.mfaRequired) {
        dispatch({
          type: AuthActionTypes.MFA_REQUIRED,
          payload: {
            userId: response.user.id
          }
        });
      } else {
        // Login successful
        dispatch({
          type: AuthActionTypes.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            tokens: response.tokens
          }
        });
      }
    } catch (error) {
      // Login failed
      dispatch({
        type: AuthActionTypes.LOGIN_FAILURE,
        payload: {
          error: error instanceof Error ? error.message : 'Login failed'
        }
      });
    }
  };
};

/**
 * Verifies a multi-factor authentication code during login
 * @param userId The user ID requiring MFA verification
 * @param mfaToken The MFA code from authenticator app
 */
export const verifyMfa = (
  userId: string,
  mfaToken: string
): ThunkAction<Promise<void>, AppState, unknown, AuthAction> => {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      // Dispatch MFA verification request action
      dispatch({
        type: AuthActionTypes.VERIFY_MFA_REQUEST,
        payload: {
          userId,
          mfaToken
        }
      });

      // Call authentication service to verify MFA
      const response = await authService.verifyMfaCode(userId, mfaToken);

      // MFA verification successful
      dispatch({
        type: AuthActionTypes.VERIFY_MFA_SUCCESS,
        payload: {
          user: response.user,
          tokens: response.tokens
        }
      });
    } catch (error) {
      // MFA verification failed
      dispatch({
        type: AuthActionTypes.VERIFY_MFA_FAILURE,
        payload: {
          error: error instanceof Error ? error.message : 'MFA verification failed'
        }
      });
    }
  };
};

/**
 * Logs out the current user
 */
export const logout = (): ThunkAction<Promise<void>, AppState, unknown, AuthAction> => {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      // Dispatch logout request action
      dispatch({ type: AuthActionTypes.LOGOUT_REQUEST });

      // Call authentication service to logout
      await authService.logout();

      // Logout successful
      dispatch({ type: AuthActionTypes.LOGOUT_SUCCESS });
    } catch (error) {
      // Logout failed
      dispatch({
        type: AuthActionTypes.LOGOUT_FAILURE,
        payload: {
          error: error instanceof Error ? error.message : 'Logout failed'
        }
      });
    }
  };
};

/**
 * Refreshes the authentication token
 */
export const refreshToken = (): ThunkAction<Promise<void>, AppState, unknown, AuthAction> => {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      // Dispatch token refresh request action
      dispatch({ type: AuthActionTypes.REFRESH_TOKEN_REQUEST });

      // Call authentication service to refresh token
      const tokens = await authService.refreshToken();

      // Token refresh successful
      dispatch({
        type: AuthActionTypes.REFRESH_TOKEN_SUCCESS,
        payload: { tokens }
      });
    } catch (error) {
      // Token refresh failed
      dispatch({
        type: AuthActionTypes.REFRESH_TOKEN_FAILURE,
        payload: {
          error: error instanceof Error ? error.message : 'Token refresh failed'
        }
      });
    }
  };
};

/**
 * Fetches the currently authenticated user profile
 */
export const getCurrentUser = (): ThunkAction<Promise<void>, AppState, unknown, AuthAction> => {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      // Dispatch get current user request action
      dispatch({ type: AuthActionTypes.GET_CURRENT_USER_REQUEST });

      // Call authentication service to get current user
      const user = await authService.getCurrentUser();

      if (user) {
        // User fetch successful
        dispatch({
          type: AuthActionTypes.GET_CURRENT_USER_SUCCESS,
          payload: { user }
        });
      } else {
        // No user returned
        dispatch({
          type: AuthActionTypes.GET_CURRENT_USER_FAILURE,
          payload: { error: 'User not found or not authenticated' }
        });
      }
    } catch (error) {
      // User fetch failed
      dispatch({
        type: AuthActionTypes.GET_CURRENT_USER_FAILURE,
        payload: {
          error: error instanceof Error ? error.message : 'Failed to get current user'
        }
      });
    }
  };
};