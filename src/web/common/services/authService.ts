/**
 * Authentication service for the web applications of the AI-driven Freight Optimization Platform.
 * Provides comprehensive functions for user authentication, token management, session handling,
 * and authorization checks. Implements OAuth, multi-factor authentication, and secure token handling.
 */

import * as authApi from '../api/authApi';
import { getAuthToken, setAuthToken, clearAuthToken } from '../api/apiClient';
import { StorageType, storageService } from '../services/storageService';
import logger from '../utils/logger';
import { handleApiError } from '../utils/errorHandlers';
import jwtDecode from 'jwt-decode'; // ^3.1.2
import {
  LoginRequest,
  LoginResponse, 
  AuthTokens,
  AuthUser,
  AuthState,
  PasswordResetRequest,
  PasswordResetConfirmation,
  PasswordChangeRequest,
  OAuthLoginRequest,
  OAuthCallbackParams,
  AuthProvider,
  MfaSetupResponse
} from '../interfaces/auth.interface';

// Constants
const AUTH_STATE_KEY = 'auth_state';
const TOKEN_REFRESH_THRESHOLD = 300; // Refresh token 5 minutes before expiry

/**
 * Authenticates a user with email and password credentials
 * @param credentials - Login request containing email, password, and rememberMe flag
 * @returns Authentication result with tokens and user data
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await authApi.login(credentials);
    
    if (response && !response.mfaRequired) {
      // Store auth state if MFA is not required
      const authState: AuthState = {
        isAuthenticated: true,
        user: response.user,
        tokens: response.tokens,
        loading: false,
        error: null
      };
      
      setAuthState(authState);
    }
    
    return response;
  } catch (error) {
    logger.error('Login failed', { error });
    throw handleApiError(error);
  }
}

/**
 * Logs out the current user by invalidating their refresh token
 */
export async function logout(): Promise<void> {
  try {
    const authState = getAuthState();
    
    if (authState.isAuthenticated && authState.tokens?.refreshToken) {
      await authApi.logout(authState.tokens.refreshToken);
    }
    
    // Clear authentication state regardless of API response
    clearAuthState();
  } catch (error) {
    logger.error('Logout failed', { error });
    // Still clear local auth state even if API call fails
    clearAuthState();
    throw handleApiError(error);
  }
}

/**
 * Logs out the user from all devices by invalidating all refresh tokens
 */
export async function logoutAllDevices(): Promise<void> {
  try {
    await authApi.logoutAllDevices();
    clearAuthState();
  } catch (error) {
    logger.error('Logout from all devices failed', { error });
    // Still clear local auth state even if API call fails
    clearAuthState();
    throw handleApiError(error);
  }
}

/**
 * Refreshes the access token using the refresh token
 * @returns New token pair
 */
export async function refreshToken(): Promise<AuthTokens> {
  try {
    const authState = getAuthState();
    
    if (!authState.isAuthenticated || !authState.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const tokens = await authApi.refreshToken(authState.tokens.refreshToken);
    
    // Update auth state with new tokens
    setAuthState({
      ...authState,
      tokens,
      error: null
    });
    
    return tokens;
  } catch (error) {
    logger.error('Token refresh failed', { error });
    
    // If refresh fails, user needs to reauthenticate
    clearAuthState();
    throw handleApiError(error);
  }
}

/**
 * Verifies a multi-factor authentication code during login
 * @param userId - User ID requiring MFA verification
 * @param mfaToken - MFA code from authenticator app
 * @returns Authentication result with tokens and user data
 */
export async function verifyMfaCode(userId: string, mfaToken: string): Promise<LoginResponse> {
  try {
    const response = await authApi.verifyMfa(userId, mfaToken);
    
    if (response) {
      // Store auth state after successful MFA verification
      const authState: AuthState = {
        isAuthenticated: true,
        user: response.user,
        tokens: response.tokens,
        loading: false,
        error: null
      };
      
      setAuthState(authState);
    }
    
    return response;
  } catch (error) {
    logger.error('MFA verification failed', { error });
    throw handleApiError(error);
  }
}

/**
 * Initiates MFA setup by generating secret and QR code
 * @returns MFA setup data including secret and QR code URL
 */
export async function setupMfa(): Promise<MfaSetupResponse> {
  try {
    return await authApi.setupMfa();
  } catch (error) {
    logger.error('MFA setup failed', { error });
    throw handleApiError(error);
  }
}

/**
 * Completes MFA setup by verifying token generated with secret
 * @param token - Token from authenticator app
 * @returns Result of MFA setup verification
 */
export async function verifyMfaSetup(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await authApi.verifyMfaSetup(token);
    
    if (result.success) {
      // Update auth state to reflect MFA enabled
      const authState = getAuthState();
      if (authState.isAuthenticated && authState.user) {
        setAuthState({
          ...authState,
          user: {
            ...authState.user,
            mfaEnabled: true
          }
        });
      }
    }
    
    return result;
  } catch (error) {
    logger.error('MFA verification failed', { error });
    throw handleApiError(error);
  }
}

/**
 * Disables MFA for the authenticated user
 * @param token - Token from authenticator app for verification
 * @returns Result of MFA disable operation
 */
export async function disableMfa(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await authApi.disableMfa(token);
    
    if (result.success) {
      // Update auth state to reflect MFA disabled
      const authState = getAuthState();
      if (authState.isAuthenticated && authState.user) {
        setAuthState({
          ...authState,
          user: {
            ...authState.user,
            mfaEnabled: false
          }
        });
      }
    }
    
    return result;
  } catch (error) {
    logger.error('MFA disable failed', { error });
    throw handleApiError(error);
  }
}

/**
 * Initiates password reset process by sending reset email
 * @param request - Password reset request containing email
 * @returns Result of password reset request
 */
export async function forgotPassword(request: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
  try {
    return await authApi.forgotPassword(request);
  } catch (error) {
    logger.error('Password reset request failed', { error });
    throw handleApiError(error);
  }
}

/**
 * Completes password reset process with token and new password
 * @param resetData - Password reset confirmation with token and new password
 * @returns Result of password reset operation
 */
export async function resetPassword(resetData: PasswordResetConfirmation): Promise<{ success: boolean; message: string }> {
  try {
    return await authApi.resetPassword(resetData);
  } catch (error) {
    logger.error('Password reset failed', { error });
    throw handleApiError(error);
  }
}

/**
 * Changes password for authenticated user
 * @param passwordData - Password change request with current and new password
 * @returns Result of password change operation
 */
export async function changePassword(passwordData: PasswordChangeRequest): Promise<{ success: boolean; message: string }> {
  try {
    return await authApi.changePassword(passwordData);
  } catch (error) {
    logger.error('Password change failed', { error });
    throw handleApiError(error);
  }
}

/**
 * Initiates OAuth authentication flow by getting authorization URL
 * @param request - OAuth login request with provider and redirectUri
 * @returns OAuth login data including authorization URL and state
 */
export async function initiateOauthLogin(request: OAuthLoginRequest): Promise<{ authUrl: string; state: string }> {
  try {
    return await authApi.initiateOauthLogin(request);
  } catch (error) {
    logger.error('OAuth login initiation failed', { error, provider: request.provider });
    throw handleApiError(error);
  }
}

/**
 * Handles OAuth callback after provider authentication
 * @param provider - OAuth provider (e.g., "google", "microsoft")
 * @param params - OAuth callback parameters including code and state
 * @returns Authentication result with tokens and user data
 */
export async function handleOauthCallback(provider: string, params: OAuthCallbackParams): Promise<LoginResponse> {
  try {
    const response = await authApi.handleOauthCallback(provider, params);
    
    if (response) {
      // Store auth state after successful OAuth authentication
      const authState: AuthState = {
        isAuthenticated: true,
        user: response.user,
        tokens: response.tokens,
        loading: false,
        error: null
      };
      
      setAuthState(authState);
    }
    
    return response;
  } catch (error) {
    logger.error('OAuth callback processing failed', { error, provider });
    throw handleApiError(error);
  }
}

/**
 * Gets the currently authenticated user
 * @returns Current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Check if token needs refreshing
    await checkAndRefreshToken();
    
    // Validate the current token and get user data
    const result = await authApi.validateToken();
    
    if (result.valid && result.user) {
      // Update user data in auth state if needed
      const authState = getAuthState();
      if (authState.isAuthenticated && 
          JSON.stringify(authState.user) !== JSON.stringify(result.user)) {
        setAuthState({
          ...authState,
          user: result.user
        });
      }
      
      return result.user;
    } else {
      // Token is invalid, clear auth state
      clearAuthState();
      return null;
    }
  } catch (error) {
    logger.error('Failed to get current user', { error });
    clearAuthState();
    return null;
  }
}

/**
 * Gets the current authentication state
 * @returns Current authentication state
 */
export function getAuthState(): AuthState {
  try {
    const storedState = storageService.getItem<AuthState>(AUTH_STATE_KEY);
    
    if (!storedState) {
      return {
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: null
      };
    }
    
    return storedState;
  } catch (error) {
    logger.error('Failed to get auth state', { error });
    
    // Return default unauthenticated state
    return {
      isAuthenticated: false,
      user: null,
      tokens: null,
      loading: false,
      error: null
    };
  }
}

/**
 * Updates the authentication state in storage
 * @param authState - Authentication state to store
 */
export function setAuthState(authState: AuthState): void {
  try {
    storageService.setItem(AUTH_STATE_KEY, authState);
    
    // Update API client auth token
    if (authState.isAuthenticated && authState.tokens?.accessToken) {
      setAuthToken(authState.tokens.accessToken);
    } else {
      clearAuthToken();
    }
  } catch (error) {
    logger.error('Failed to set auth state', { error });
  }
}

/**
 * Clears authentication state and tokens
 */
function clearAuthState(): void {
  try {
    storageService.removeItem(AUTH_STATE_KEY);
    clearAuthToken();
  } catch (error) {
    logger.error('Failed to clear auth state', { error });
  }
}

/**
 * Checks if the current access token is expired or about to expire
 * @param token - JWT access token to check
 * @param thresholdSeconds - Seconds before expiration to consider token as expired
 * @returns True if token is expired or will expire soon
 */
export function isTokenExpired(token: string, thresholdSeconds: number = TOKEN_REFRESH_THRESHOLD): boolean {
  try {
    if (!token) return true;
    
    // Decode the JWT token
    const decoded: any = jwtDecode(token);
    
    if (!decoded.exp) return true;
    
    // Get current time plus threshold in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationWithThreshold = currentTime + thresholdSeconds;
    
    // Return true if token will expire within threshold
    return decoded.exp < expirationWithThreshold;
  } catch (error) {
    logger.error('Error checking token expiration', { error });
    return true; // Assume expired if there's an error
  }
}

/**
 * Checks if the user is currently authenticated
 * @returns True if user is authenticated
 */
export function isAuthenticated(): boolean {
  const authState = getAuthState();
  return authState.isAuthenticated && !!authState.user;
}

/**
 * Checks if the authenticated user has a specific role
 * @param role - Role to check
 * @returns True if user has the specified role
 */
export function hasRole(role: string): boolean {
  const authState = getAuthState();
  
  if (!authState.isAuthenticated || !authState.user) {
    return false;
  }
  
  return authState.user.roles.includes(role);
}

/**
 * Checks if the authenticated user has a specific permission
 * @param permission - Permission to check
 * @returns True if user has the specified permission
 */
export function hasPermission(permission: string): boolean {
  const authState = getAuthState();
  
  if (!authState.isAuthenticated || !authState.user) {
    return false;
  }
  
  return authState.user.permissions.includes(permission);
}

/**
 * Checks if token needs refreshing and refreshes if necessary
 * @returns True if token was refreshed, false otherwise
 */
export async function checkAndRefreshToken(): Promise<boolean> {
  try {
    const authState = getAuthState();
    
    if (!authState.isAuthenticated || !authState.tokens) {
      return false;
    }
    
    const { accessToken } = authState.tokens;
    
    if (isTokenExpired(accessToken)) {
      logger.debug('Access token expired, refreshing...');
      await refreshToken();
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking/refreshing token', { error });
    return false;
  }
}