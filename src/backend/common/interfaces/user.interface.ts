/**
 * User Interface Definitions
 * 
 * This file defines the core user interfaces and types for the authentication and
 * authorization system of the AI-driven Freight Optimization Platform.
 */

/**
 * Enumeration of user types in the system
 */
export enum UserType {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  CARRIER_ADMIN = 'CARRIER_ADMIN',
  CARRIER_STAFF = 'CARRIER_STAFF',
  DRIVER = 'DRIVER',
  SHIPPER_ADMIN = 'SHIPPER_ADMIN',
  SHIPPER_STAFF = 'SHIPPER_STAFF'
}

/**
 * Enumeration of possible user account statuses
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED'
}

/**
 * Enumeration of supported authentication providers
 */
export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
  FACEBOOK = 'FACEBOOK',
  APPLE = 'APPLE'
}

/**
 * Interface representing a permission in the RBAC system
 */
export interface Permission {
  permission_id: string;
  name: string;
  description: string;
  resource: string;  // The resource this permission applies to
  action: string;    // The action allowed on the resource (create, read, update, delete)
  attributes: string[]; // Additional attributes for fine-grained control
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface representing a role in the RBAC system
 */
export interface Role {
  role_id: string;
  name: string;
  description: string;
  permissions: Permission[];
  parent_role_id: string | null; // For hierarchical roles
  created_at: Date;
  updated_at: Date;
}

/**
 * Core interface representing a user in the system with all properties
 */
export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: UserType;
  status: UserStatus;
  roles: Role[];
  carrier_id: string | null;
  shipper_id: string | null;
  driver_id: string | null;
  email_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  last_login: Date | null;
  password_updated_at: Date | null;
  login_attempts: number;
  locked_until: Date | null;
  auth_provider: AuthProvider | null;
  auth_provider_id: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Public user profile without sensitive information
 */
export interface UserProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: UserType;
  status: UserStatus;
  roles: string[]; // Just role names or IDs, not the full role objects
  permissions: string[]; // Flattened list of permission names
  carrier_id: string | null;
  shipper_id: string | null;
  driver_id: string | null;
  email_verified: boolean;
  mfa_enabled: boolean;
}

/**
 * Interface for user login credentials
 */
export interface UserCredentials {
  email: string;
  password: string;
  mfaCode?: string; // Optional MFA code if MFA is enabled
}

/**
 * Interface for authentication tokens returned after successful login
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Parameters for creating a new user
 */
export interface UserCreationParams {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: UserType;
  role_ids: string[];
  carrier_id: string | null;
  shipper_id: string | null;
  driver_id: string | null;
  auth_provider: AuthProvider;
  auth_provider_id: string | null;
}

/**
 * Parameters for updating an existing user
 */
export interface UserUpdateParams {
  first_name: string;
  last_name: string;
  phone: string;
  status: UserStatus;
  role_ids: string[];
  carrier_id: string | null;
  shipper_id: string | null;
  driver_id: string | null;
}

/**
 * Interface for password change requests
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface for password reset requests
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Interface for password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface for MFA setup requests
 */
export interface MfaSetupRequest {
  userId: string;
}

/**
 * Interface for MFA setup verification
 */
export interface MfaSetupVerification {
  userId: string;
  secret: string;
  mfaCode: string;
}

/**
 * Interface for MFA disable requests
 */
export interface MfaDisableRequest {
  userId: string;
  password: string;
}

/**
 * Interface for OAuth login requests
 */
export interface OAuthLoginRequest {
  provider: AuthProvider;
  redirectUri: string;
}

/**
 * Interface for OAuth callback parameters
 */
export interface OAuthCallbackParams {
  code: string;
  state: string;
  error?: string;
}