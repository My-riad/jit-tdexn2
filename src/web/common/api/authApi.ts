/**
 * API client module for authentication-related operations in the AI-driven Freight Optimization Platform.
 * Provides functions for user login, logout, token refresh, password management, and multi-factor
 * authentication, serving as the interface between frontend applications and the authentication service.
 */

import { AxiosResponse } from 'axios'; // ^1.4.0
import apiClient, { setAuthToken, clearAuthToken } from './apiClient';
import { AUTH_ENDPOINTS } from '../constants/endpoints';
import {
  LoginRequest,
  LoginResponse,
  AuthTokens,
  PasswordResetRequest,
  PasswordResetConfirmation,
  PasswordChangeRequest,
  MfaSetupResponse,
  OAuthLoginRequest,
  OAuthLoginResponse,
  OAuthCallbackParams,
  AuthUser
} from '../interfaces/auth.interface';

/**
 * Authenticates a user with email and password credentials
 * @param credentials - Login request containing email, password, and rememberMe flag
 * @returns Promise resolving to login response with tokens and user data
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response: AxiosResponse<LoginResponse> = await apiClient.post(
    AUTH_ENDPOINTS.LOGIN,
    credentials
  );
  
  // Store the access token if not requiring MFA
  if (response.data && response.data.tokens && !response.data.mfaRequired) {
    setAuthToken(response.data.tokens.accessToken);
  }
  
  return response.data;
};

/**
 * Verifies a multi-factor authentication token during login
 * @param userId - User ID for MFA verification
 * @param mfaToken - MFA token from authenticator app
 * @returns Promise resolving to login response with tokens and user data
 */
export const verifyMfa = async (userId: string, mfaToken: string): Promise<LoginResponse> => {
  const response: AxiosResponse<LoginResponse> = await apiClient.post(
    AUTH_ENDPOINTS.VERIFY_MFA,
    { userId, token: mfaToken }
  );
  
  // Store the access token after successful MFA verification
  if (response.data && response.data.tokens) {
    setAuthToken(response.data.tokens.accessToken);
  }
  
  return response.data;
};

/**
 * Refreshes an access token using a valid refresh token
 * @param refreshToken - Refresh token to use for obtaining new tokens
 * @returns Promise resolving to new token pair
 */
export const refreshToken = async (refreshToken: string): Promise<AuthTokens> => {
  const response: AxiosResponse<AuthTokens> = await apiClient.post(
    AUTH_ENDPOINTS.REFRESH_TOKEN,
    { refreshToken }
  );
  
  // Store the new access token
  if (response.data && response.data.accessToken) {
    setAuthToken(response.data.accessToken);
  }
  
  return response.data;
};

/**
 * Logs out a user by invalidating their refresh token
 * @param refreshToken - Refresh token to invalidate
 * @returns Promise resolving to void on success
 */
export const logout = async (refreshToken: string): Promise<void> => {
  await apiClient.post(AUTH_ENDPOINTS.LOGOUT, { refreshToken });
  
  // Clear the stored access token
  clearAuthToken();
};

/**
 * Logs out a user from all devices by invalidating all their refresh tokens
 * @returns Promise resolving to void on success
 */
export const logoutAllDevices = async (): Promise<void> => {
  await apiClient.post(AUTH_ENDPOINTS.LOGOUT, { logoutAll: true });
  
  // Clear the stored access token
  clearAuthToken();
};

/**
 * Validates an access token and returns the user profile
 * @returns Promise resolving to validation result with optional user profile
 */
export const validateToken = async (): Promise<{ valid: boolean; user?: AuthUser }> => {
  try {
    const response: AxiosResponse<AuthUser> = await apiClient.get(
      AUTH_ENDPOINTS.CURRENT_USER
    );
    
    return { valid: true, user: response.data };
  } catch (error) {
    return { valid: false };
  }
};

/**
 * Initiates password reset process by sending reset email
 * @param request - Password reset request containing email
 * @returns Promise resolving to result with success status and message
 */
export const forgotPassword = async (
  request: PasswordResetRequest
): Promise<{ success: boolean; message: string }> => {
  const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.post(
    AUTH_ENDPOINTS.FORGOT_PASSWORD,
    request
  );
  
  return response.data;
};

/**
 * Completes password reset process with token and new password
 * @param resetData - Password reset confirmation with token and new password
 * @returns Promise resolving to result with success status and message
 */
export const resetPassword = async (
  resetData: PasswordResetConfirmation
): Promise<{ success: boolean; message: string }> => {
  const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.post(
    AUTH_ENDPOINTS.RESET_PASSWORD,
    resetData
  );
  
  return response.data;
};

/**
 * Changes password for authenticated user
 * @param passwordData - Password change request with current and new password
 * @returns Promise resolving to result with success status and message
 */
export const changePassword = async (
  passwordData: PasswordChangeRequest
): Promise<{ success: boolean; message: string }> => {
  const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.post(
    AUTH_ENDPOINTS.CHANGE_PASSWORD,
    passwordData
  );
  
  return response.data;
};

/**
 * Initiates MFA setup by generating secret and QR code
 * @returns Promise resolving to MFA setup data including secret and QR code URL
 */
export const setupMfa = async (): Promise<MfaSetupResponse> => {
  const response: AxiosResponse<MfaSetupResponse> = await apiClient.post(
    AUTH_ENDPOINTS.SETUP_MFA
  );
  
  return response.data;
};

/**
 * Completes MFA setup by verifying token generated with secret
 * @param token - Token from authenticator app
 * @returns Promise resolving to result with success status and message
 */
export const verifyMfaSetup = async (
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.post(
    AUTH_ENDPOINTS.VERIFY_MFA,
    { token }
  );
  
  return response.data;
};

/**
 * Disables MFA for authenticated user
 * @param token - Token from authenticator app for verification
 * @returns Promise resolving to result with success status and message
 */
export const disableMfa = async (
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.post(
    AUTH_ENDPOINTS.DISABLE_MFA,
    { token }
  );
  
  return response.data;
};

/**
 * Initiates OAuth authentication flow by getting authorization URL
 * @param request - OAuth login request with provider and redirect URI
 * @returns Promise resolving to OAuth login data including authorization URL
 */
export const initiateOauthLogin = async (
  request: OAuthLoginRequest
): Promise<OAuthLoginResponse> => {
  const response: AxiosResponse<OAuthLoginResponse> = await apiClient.post(
    `${AUTH_ENDPOINTS.LOGIN}/oauth`,
    request
  );
  
  return response.data;
};

/**
 * Handles OAuth callback after provider authentication
 * @param provider - OAuth provider (e.g., "google", "microsoft")
 * @param params - OAuth callback parameters including code and state
 * @returns Promise resolving to login response with tokens and user data
 */
export const handleOauthCallback = async (
  provider: string,
  params: OAuthCallbackParams
): Promise<LoginResponse> => {
  const response: AxiosResponse<LoginResponse> = await apiClient.post(
    `${AUTH_ENDPOINTS.LOGIN}/oauth/${provider}/callback`,
    params
  );
  
  // Store the access token
  if (response.data && response.data.tokens) {
    setAuthToken(response.data.tokens.accessToken);
  }
  
  return response.data;
};