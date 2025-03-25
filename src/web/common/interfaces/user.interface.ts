/**
 * User interfaces for the AI-driven Freight Optimization Platform
 * 
 * This file defines the TypeScript interfaces for user entities, including 
 * authentication types, roles, and relationships to carriers, shippers, and drivers.
 */

/**
 * Enumeration of user types in the system
 */
export enum UserType {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',  // Platform administrators
  CARRIER_ADMIN = 'CARRIER_ADMIN', // Fleet Managers
  CARRIER_STAFF = 'CARRIER_STAFF', // Dispatchers and other carrier staff
  DRIVER = 'DRIVER',              // Truck drivers
  SHIPPER_ADMIN = 'SHIPPER_ADMIN', // Shipping company administrators
  SHIPPER_STAFF = 'SHIPPER_STAFF'  // Shipping coordinators and other shipper staff
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
 * Core interface representing a user in the system with all properties
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: UserType;
  status: UserStatus;
  roles: string[];
  carrierId: string | null;
  shipperId: string | null;
  driverId: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLogin: string | null;
  profileImageUrl: string | null;
  authProvider: AuthProvider;
  authProviderId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public user profile without sensitive information
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: UserType;
  profileImageUrl: string | null;
  carrierId: string | null;
  shipperId: string | null;
  driverId: string | null;
}

/**
 * Interface for user login credentials
 */
export interface UserCredentials {
  email: string;
  password: string;
}

/**
 * Parameters for creating a new user
 */
export interface UserCreationParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: UserType;
  roles: string[];
  carrierId: string | null;
  shipperId: string | null;
  driverId: string | null;
  profileImageUrl: string | null;
}

/**
 * Parameters for updating an existing user
 */
export interface UserUpdateParams {
  firstName: string;
  lastName: string;
  phone: string;
  status: UserStatus;
  roles: string[];
  carrierId: string | null;
  shipperId: string | null;
  driverId: string | null;
  profileImageUrl: string | null;
}

/**
 * Interface representing a role in the RBAC system
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  parentRoleId: string | null;
}

/**
 * Interface representing a permission in the RBAC system
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
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
 * Interface for MFA setup response data
 */
export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

/**
 * Interface for MFA verification requests
 */
export interface MfaVerificationRequest {
  userId: string;
  code: string;
}

/**
 * Parameters for searching and filtering users
 */
export interface UserSearchParams {
  userType: UserType[];
  status: UserStatus[];
  carrierId: string;
  shipperId: string;
  query: string;
  page: number;
  limit: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}