/**
 * Authentication interfaces for the AI-driven Freight Optimization Platform
 * 
 * This file defines TypeScript interfaces for authentication-related entities
 * including login flows, tokens, multi-factor authentication, and OAuth integrations.
 */

import { UserType, User, UserStatus, AuthProvider } from './user.interface';

/**
 * Login request payload interface
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Login response data interface
 */
export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
  mfaRequired: boolean;
}

/**
 * Authentication tokens interface
 * Used for JWT-based authentication with access and refresh tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Expiration time in seconds
}

/**
 * Authenticated user data interface
 * Contains essential user information needed after authentication
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  roles: string[];
  permissions: string[];
  carrierId: string | null;
  shipperId: string | null;
  driverId: string | null;
  mfaEnabled: boolean;
  profileImageUrl: string | null;
}

/**
 * Authentication state interface
 * Used to track current authentication status in the application
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
}

/**
 * Password reset request interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation interface
 */
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
}

/**
 * Password change request interface (for authenticated users)
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Multi-factor authentication setup response
 * Contains secret and QR code for authenticator app setup
 */
export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

/**
 * OAuth login request interface
 * Used to initiate OAuth authentication flow
 */
export interface OAuthLoginRequest {
  provider: AuthProvider;
  redirectUri: string;
}

/**
 * OAuth login response interface
 * Contains authentication URL and state for the OAuth flow
 */
export interface OAuthLoginResponse {
  authUrl: string;
  state: string;
}

/**
 * OAuth callback parameters interface
 * Represents parameters returned by OAuth provider after authentication
 */
export interface OAuthCallbackParams {
  code: string;
  state: string;
  error: string;
}

/**
 * Authentication context interface
 * Provides authentication methods and state to React components
 */
export interface AuthContextType {
  authState: AuthState;
  
  // Authentication methods
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthTokens>;
  
  // MFA methods
  verifyMfa: (code: string) => Promise<LoginResponse>;
  setupMfa: () => Promise<MfaSetupResponse>;
  verifyMfaSetup: (code: string) => Promise<boolean>;
  disableMfa: (code: string) => Promise<boolean>;
  
  // Password management
  forgotPassword: (request: PasswordResetRequest) => Promise<void>;
  resetPassword: (request: PasswordResetConfirmation) => Promise<void>;
  changePassword: (request: PasswordChangeRequest) => Promise<void>;
  
  // OAuth methods
  initiateOauthLogin: (request: OAuthLoginRequest) => Promise<OAuthLoginResponse>;
  handleOauthCallback: (params: OAuthCallbackParams) => Promise<LoginResponse>;
  
  // Helper methods
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}