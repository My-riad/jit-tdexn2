import { useState, useEffect, useCallback, useRef } from 'react';
import * as authService from '../services/authService';
import useLocalStorage from './useLocalStorage';
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
  MfaSetupResponse
} from '../interfaces/auth.interface';
import logger from '../utils/logger';

// Constants
const AUTH_STATE_KEY = 'auth_state';
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Custom hook that provides authentication functionality and state management
 * for the web applications of the AI-driven Freight Optimization Platform.
 * 
 * Manages authentication state, handles login/logout operations, token refresh,
 * multi-factor authentication, and authorization checks.
 * 
 * @returns Authentication state and methods
 */
function useAuth() {
  // Initialize auth state using localStorage to persist across sessions
  const [authState, setAuthState] = useLocalStorage<AuthState>(
    AUTH_STATE_KEY,
    {
      isAuthenticated: false,
      user: null,
      tokens: null,
      loading: false,
      error: null
    }
  );

  // Create ref for token refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for tracking async operations
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Authenticates a user with email and password credentials
   * @param credentials Login request containing email, password, and rememberMe flag
   * @returns Authentication result with tokens and user data
   */
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (!response.mfaRequired) {
        // Update auth state if MFA is not required
        setAuthState({
          isAuthenticated: true,
          user: response.user,
          tokens: response.tokens,
          loading: false,
          error: null
        });
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      logger.error('Login error', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs out the current user by invalidating their refresh token
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.logout();
      
      // Clear auth state
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Logout failed';
      setError(errorMessage);
      logger.error('Logout error', { error });
      
      // Still clear auth state even if API call fails
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: null
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifies a multi-factor authentication code during login
   * @param userId User ID requiring MFA verification
   * @param mfaToken MFA code from authenticator app
   * @returns Authentication result with tokens and user data
   */
  const verifyMfa = async (userId: string, mfaToken: string): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.verifyMfaCode(userId, mfaToken);
      
      // Update auth state after successful MFA verification
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        tokens: response.tokens,
        loading: false,
        error: null
      });
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'MFA verification failed';
      setError(errorMessage);
      logger.error('MFA verification error', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refreshes the access token using the refresh token
   * @returns New token pair
   */
  const refreshToken = async (): Promise<AuthTokens> => {
    try {
      logger.debug('Refreshing auth token');
      const tokens = await authService.refreshToken();
      
      // Update tokens in auth state
      setAuthState(prevState => ({
        ...prevState,
        tokens,
        error: null
      }));
      
      return tokens;
    } catch (error: any) {
      const errorMessage = error.message || 'Token refresh failed';
      logger.error('Token refresh error', { error });
      
      // Clear auth state if refresh fails, user needs to re-login
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: errorMessage
      });
      
      throw error;
    }
  };

  /**
   * Initiates MFA setup by generating secret and QR code
   * @returns MFA setup data including secret and QR code URL
   */
  const setupMfa = async (): Promise<MfaSetupResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      return await authService.setupMfa();
    } catch (error: any) {
      const errorMessage = error.message || 'MFA setup failed';
      setError(errorMessage);
      logger.error('MFA setup error', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Completes MFA setup by verifying token generated with secret
   * @param token Token from authenticator app
   * @returns Success or failure of verification
   */
  const verifyMfaSetup = async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.verifyMfaSetup(token);
      
      if (result.success && authState.user) {
        // Update user's MFA status in auth state
        setAuthState(prevState => ({
          ...prevState,
          user: prevState.user ? {
            ...prevState.user,
            mfaEnabled: true
          } : null
        }));
      }
      
      return result.success;
    } catch (error: any) {
      const errorMessage = error.message || 'MFA verification failed';
      setError(errorMessage);
      logger.error('MFA verification setup error', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Disables MFA for the authenticated user
   * @param token Token from authenticator app for verification
   * @returns Success or failure of MFA disabling
   */
  const disableMfa = async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.disableMfa(token);
      
      if (result.success && authState.user) {
        // Update user's MFA status in auth state
        setAuthState(prevState => ({
          ...prevState,
          user: prevState.user ? {
            ...prevState.user,
            mfaEnabled: false
          } : null
        }));
      }
      
      return result.success;
    } catch (error: any) {
      const errorMessage = error.message || 'Disable MFA failed';
      setError(errorMessage);
      logger.error('Disable MFA error', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates password reset process by sending reset email
   * @param request Password reset request containing email
   */
  const forgotPassword = async (request: PasswordResetRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.forgotPassword(request);
      
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Password reset request failed';
      setError(errorMessage);
      logger.error('Forgot password error', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Completes password reset process with token and new password
   * @param resetData Password reset confirmation with token and new password
   */
  const resetPassword = async (resetData: PasswordResetConfirmation): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.resetPassword(resetData);
      
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Password reset failed';
      setError(errorMessage);
      logger.error('Reset password error', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Changes password for authenticated user
   * @param passwordData Password change request with current and new password
   */
  const changePassword = async (passwordData: PasswordChangeRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.changePassword(passwordData);
      
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Password change failed';
      setError(errorMessage);
      logger.error('Change password error', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates OAuth authentication flow by getting authorization URL
   * @param request OAuth login request with provider and redirectUri
   * @returns OAuth login data including authorization URL and state
   */
  const initiateOauthLogin = async (request: OAuthLoginRequest): Promise<{ authUrl: string; state: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      return await authService.initiateOauthLogin(request);
    } catch (error: any) {
      const errorMessage = error.message || 'OAuth login failed';
      setError(errorMessage);
      logger.error('OAuth login initiation error', { 
        error,
        provider: request.provider 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles OAuth callback after provider authentication
   * @param provider OAuth provider (e.g., "google", "microsoft")
   * @param params OAuth callback parameters including code and state
   * @returns Authentication result with tokens and user data
   */
  const handleOauthCallback = async (provider: string, params: OAuthCallbackParams): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.handleOauthCallback(provider, params);
      
      // Update auth state after successful OAuth authentication
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        tokens: response.tokens,
        loading: false,
        error: null
      });
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'OAuth callback processing failed';
      setError(errorMessage);
      logger.error('OAuth callback error', { error, provider });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Checks if the user is currently authenticated
   * @returns True if user is authenticated
   */
  const isAuthenticated = useCallback((): boolean => {
    return authService.isAuthenticated();
  }, []);

  /**
   * Checks if the authenticated user has a specific role
   * @param role Role to check
   * @returns True if user has the specified role
   */
  const hasRole = useCallback((role: string): boolean => {
    return authService.hasRole(role);
  }, []);

  /**
   * Checks if the authenticated user has a specific permission
   * @param permission Permission to check
   * @returns True if user has the specified permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return authService.hasPermission(permission);
  }, []);

  // Set up automatic token refresh on an interval
  useEffect(() => {
    // Only set up refresh interval if authenticated
    if (authState.isAuthenticated && authState.tokens) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Set up new refresh interval
      refreshIntervalRef.current = setInterval(async () => {
        try {
          logger.debug('Attempting token refresh from interval');
          await refreshToken();
        } catch (error) {
          logger.error('Failed to refresh token in interval', { error });
          // Interval will be cleared in cleanup if authentication state is cleared
        }
      }, TOKEN_REFRESH_INTERVAL);
      
      logger.debug('Token refresh interval set up');
    }
    
    // Cleanup function to clear interval
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
        logger.debug('Token refresh interval cleared');
      }
    };
  }, [authState.isAuthenticated, authState.tokens]);

  // Check token validity on initial load
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (authState.isAuthenticated && authState.tokens) {
        try {
          logger.debug('Checking token validity on initial load');
          await authService.checkAndRefreshToken();
        } catch (error) {
          logger.error('Initial token validation failed', { error });
          // Auth state will be cleared by the refreshToken function if needed
        }
      }
    };
    
    checkTokenValidity();
  }, []);

  return {
    // Auth state
    authState,
    loading,
    error,
    
    // Auth methods
    login,
    logout,
    refreshToken,
    verifyMfa,
    setupMfa,
    verifyMfaSetup,
    disableMfa,
    forgotPassword,
    resetPassword,
    changePassword,
    initiateOauthLogin,
    handleOauthCallback,
    
    // Helper methods
    isAuthenticated,
    hasRole,
    hasPermission
  };
}

export default useAuth;