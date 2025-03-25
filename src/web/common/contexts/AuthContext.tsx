import React, { createContext, useContext, ReactNode } from 'react';
import useAuth from '../hooks/useAuth';
import { AuthContextType, AuthState } from '../interfaces/auth.interface';
import logger from '../utils/logger';

// Initial authentication state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: true,
  error: null
};

// Create the authentication context
export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication context provider component that wraps the application and provides
 * authentication state and functions to all child components.
 * 
 * This provider is responsible for:
 * - Providing authentication state (user info, tokens, loading state)
 * - Exposing authentication methods (login, logout, token refresh)
 * - Managing MFA operations
 * - Handling password operations
 * - Supporting OAuth authentication flows
 * 
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components to be wrapped
 * @returns {JSX.Element} The provider component
 */
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  // Use the authentication hook to get auth state and functions
  const auth = useAuth();
  
  // Create the context value object combining all auth state and functions
  const contextValue: AuthContextType = {
    authState: auth.authState,
    
    // Authentication methods
    login: auth.login,
    logout: auth.logout,
    refreshToken: auth.refreshToken,
    
    // MFA methods
    verifyMfa: auth.verifyMfa,
    setupMfa: auth.setupMfa,
    verifyMfaSetup: auth.verifyMfaSetup,
    disableMfa: auth.disableMfa,
    
    // Password management
    forgotPassword: auth.forgotPassword,
    resetPassword: auth.resetPassword,
    changePassword: auth.changePassword,
    
    // OAuth methods
    initiateOauthLogin: auth.initiateOauthLogin,
    handleOauthCallback: auth.handleOauthCallback,
    
    // Helper methods
    isAuthenticated: auth.isAuthenticated,
    hasRole: auth.hasRole,
    hasPermission: auth.hasPermission,
  };
  
  // Log authentication state changes when debugging
  logger.debug('Auth context state updated', {
    component: 'AuthContext',
    isAuthenticated: auth.authState.isAuthenticated,
    loading: auth.authState.loading,
    hasUser: !!auth.authState.user,
  });

  // Provide the authentication context to children
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the authentication context in components
 * 
 * @returns {AuthContextType} Authentication context with state and functions
 * @throws {Error} If used outside of an AuthProvider
 * 
 * @example
 * const { authState, login, logout } = useAuthContext();
 * 
 * // Check if user is authenticated
 * if (authState.isAuthenticated) {
 *   // Access user data
 *   const userName = authState.user?.firstName;
 * }
 * 
 * // Login a user
 * const handleLogin = async (email, password) => {
 *   try {
 *     await login({ email, password, rememberMe: true });
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  // Ensure the hook is used within an AuthProvider
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};