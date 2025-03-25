/**
 * User Model
 * 
 * Database model for user management in the authentication and authorization system.
 * This model provides functions for creating, retrieving, updating, and managing user accounts,
 * including authentication, password management, role assignments, and multi-factor
 * authentication settings for the AI-driven Freight Optimization Platform.
 */

import { Knex } from 'knex'; // knex@2.4.2
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import * as crypto from 'crypto'; // crypto@1.0.1

import { 
  User, 
  UserType, 
  UserStatus, 
  UserProfile, 
  UserCreationParams, 
  UserUpdateParams,
  AuthProvider
} from '../../../common/interfaces/user.interface';
import { getKnexInstance } from '../../../common/config/database.config';
import { getRolesByIds } from './role.model';
import { hashPassword, comparePassword } from '../utils/password.utils';
import logger from '../../../common/utils/logger';
import { createError, ErrorCodes } from '../../../common/utils/error-handler';

// Table name constants
const TABLE_NAME = 'users';
const USER_ROLES_TABLE = 'user_roles';

/**
 * Creates a new user in the database
 * 
 * @param userData - User creation parameters
 * @returns Promise resolving to the ID of the created user
 */
export const createUser = async (userData: UserCreationParams): Promise<string> => {
  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Check if user with email already exists
    const existingUser = await trx(TABLE_NAME)
      .where({ email: userData.email.toLowerCase() })
      .first();

    if (existingUser) {
      await trx.rollback();
      throw createError(
        'User with this email already exists',
        { code: ErrorCodes.CONF_ALREADY_EXISTS, isOperational: true }
      );
    }

    // Generate a unique user ID
    const userId = uuidv4();

    // Hash the password
    const passwordHash = await hashPassword(userData.password);

    // Create user object with default values
    const user = {
      user_id: userId,
      email: userData.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
      user_type: userData.user_type,
      status: UserStatus.PENDING,
      carrier_id: userData.carrier_id || null,
      shipper_id: userData.shipper_id || null,
      driver_id: userData.driver_id || null,
      email_verified: false,
      verification_token: null,
      reset_token: null,
      reset_token_expires: null,
      mfa_enabled: false,
      mfa_secret: null,
      last_login: null,
      password_updated_at: new Date(),
      login_attempts: 0,
      locked_until: null,
      auth_provider: userData.auth_provider || AuthProvider.LOCAL,
      auth_provider_id: userData.auth_provider_id || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Insert user into database
    await trx(TABLE_NAME).insert(user);

    // Insert user-role relationships if role_ids are provided
    if (userData.role_ids && userData.role_ids.length > 0) {
      const userRoles = userData.role_ids.map(roleId => ({
        user_id: userId,
        role_id: roleId,
        created_at: new Date()
      }));

      await trx(USER_ROLES_TABLE).insert(userRoles);
    }

    await trx.commit();
    logger.info(`Created user: ${userId}`, { email: userData.email });
    return userId;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error creating user', { error, email: userData.email });
    throw error;
  }
};

/**
 * Retrieves a user by their ID with associated roles
 * 
 * @param userId - ID of the user to retrieve
 * @returns Promise resolving to the user object with roles if found, null otherwise
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const db = getKnexInstance();

    // Get user from database
    const user = await db(TABLE_NAME)
      .where({ user_id: userId })
      .first();

    if (!user) {
      return null;
    }

    // Get role IDs for the user
    const roleIds = await getUserRoleIds(userId);

    // Get role objects
    const roles = await getRolesByIds(roleIds);

    // Return user with roles
    return {
      ...user,
      roles
    };
  } catch (error) {
    logger.error('Error getting user by ID', { error, userId });
    throw error;
  }
};

/**
 * Retrieves a user by their email address with associated roles
 * 
 * @param email - Email address of the user to retrieve
 * @returns Promise resolving to the user object with roles if found, null otherwise
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const db = getKnexInstance();

    // Get user from database with case-insensitive email matching
    const user = await db(TABLE_NAME)
      .whereRaw('LOWER(email) = LOWER(?)', [email])
      .first();

    if (!user) {
      return null;
    }

    // Get role IDs for the user
    const roleIds = await getUserRoleIds(user.user_id);

    // Get role objects
    const roles = await getRolesByIds(roleIds);

    // Return user with roles
    return {
      ...user,
      roles
    };
  } catch (error) {
    logger.error('Error getting user by email', { error, email });
    throw error;
  }
};

/**
 * Retrieves a user by their external authentication provider ID
 * 
 * @param provider - Authentication provider (GOOGLE, FACEBOOK, etc.)
 * @param providerId - Provider-specific ID
 * @returns Promise resolving to the user object with roles if found, null otherwise
 */
export const getUserByAuthProvider = async (
  provider: AuthProvider,
  providerId: string
): Promise<User | null> => {
  try {
    const db = getKnexInstance();

    // Get user from database
    const user = await db(TABLE_NAME)
      .where({ 
        auth_provider: provider,
        auth_provider_id: providerId
      })
      .first();

    if (!user) {
      return null;
    }

    // Get role IDs for the user
    const roleIds = await getUserRoleIds(user.user_id);

    // Get role objects
    const roles = await getRolesByIds(roleIds);

    // Return user with roles
    return {
      ...user,
      roles
    };
  } catch (error) {
    logger.error('Error getting user by auth provider', { error, provider, providerId });
    throw error;
  }
};

/**
 * Updates an existing user
 * 
 * @param userId - ID of the user to update
 * @param userData - User update parameters
 * @returns Promise resolving to true if update was successful
 */
export const updateUser = async (
  userId: string,
  userData: UserUpdateParams
): Promise<boolean> => {
  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Update user in database
    const updateCount = await trx(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        status: userData.status,
        carrier_id: userData.carrier_id,
        shipper_id: userData.shipper_id,
        driver_id: userData.driver_id,
        updated_at: new Date()
      });

    // Update user-role relationships if role_ids are provided
    if (userData.role_ids) {
      // Delete existing user-role relationships
      await trx(USER_ROLES_TABLE)
        .where({ user_id: userId })
        .delete();

      // Insert new user-role relationships
      if (userData.role_ids.length > 0) {
        const userRoles = userData.role_ids.map(roleId => ({
          user_id: userId,
          role_id: roleId,
          created_at: new Date()
        }));

        await trx(USER_ROLES_TABLE).insert(userRoles);
      }
    }

    await trx.commit();
    
    if (updateCount > 0) {
      logger.info(`Updated user: ${userId}`);
      return true;
    } else {
      logger.warn(`No user found to update with ID: ${userId}`);
      return false;
    }
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error updating user', { error, userId });
    throw error;
  }
};

/**
 * Deletes a user and their role relationships
 * 
 * @param userId - ID of the user to delete
 * @returns Promise resolving to true if deletion was successful
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Delete user-role relationships
    await trx(USER_ROLES_TABLE)
      .where({ user_id: userId })
      .delete();

    // Delete user
    const deleteCount = await trx(TABLE_NAME)
      .where({ user_id: userId })
      .delete();

    await trx.commit();
    
    if (deleteCount > 0) {
      logger.info(`Deleted user: ${userId}`);
      return true;
    } else {
      logger.warn(`No user found to delete with ID: ${userId}`);
      return false;
    }
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error deleting user', { error, userId });
    throw error;
  }
};

/**
 * Updates a user's password
 * 
 * @param userId - ID of the user
 * @param newPassword - New password
 * @returns Promise resolving to true if update was successful
 */
export const updateUserPassword = async (
  userId: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const db = getKnexInstance();

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update user in database
    const updateCount = await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        password_hash: passwordHash,
        password_updated_at: new Date(),
        updated_at: new Date()
      });

    if (updateCount > 0) {
      logger.info(`Updated password for user: ${userId}`);
      return true;
    } else {
      logger.warn(`No user found to update password with ID: ${userId}`);
      return false;
    }
  } catch (error) {
    logger.error('Error updating user password', { error, userId });
    throw error;
  }
};

/**
 * Creates a password reset token for a user
 * 
 * @param email - Email address of the user
 * @returns Promise resolving to reset token and user ID if user found, null otherwise
 */
export const createPasswordResetToken = async (
  email: string
): Promise<{ token: string; userId: string; } | null> => {
  try {
    const db = getKnexInstance();

    // Get user from database
    const user = await db(TABLE_NAME)
      .whereRaw('LOWER(email) = LOWER(?)', [email])
      .first();

    if (!user) {
      return null;
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration (24 hours from now)
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    // Update user with reset token
    await db(TABLE_NAME)
      .where({ user_id: user.user_id })
      .update({
        reset_token: token,
        reset_token_expires: tokenExpires,
        updated_at: new Date()
      });

    logger.info(`Created password reset token for user: ${user.user_id}`);
    return { token, userId: user.user_id };
  } catch (error) {
    logger.error('Error creating password reset token', { error, email });
    throw error;
  }
};

/**
 * Resets a user's password using a reset token
 * 
 * @param token - Password reset token
 * @param newPassword - New password
 * @returns Promise resolving to true if password reset was successful
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const db = getKnexInstance();

    // Find user with the reset token
    const user = await db(TABLE_NAME)
      .where({ reset_token: token })
      .first();

    if (!user) {
      logger.warn('Invalid password reset token');
      return false;
    }

    // Check if token has expired
    const now = new Date();
    if (!user.reset_token_expires || user.reset_token_expires < now) {
      logger.warn('Password reset token has expired');
      return false;
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update user with new password and clear reset token
    await db(TABLE_NAME)
      .where({ user_id: user.user_id })
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
        password_updated_at: new Date(),
        updated_at: new Date()
      });

    logger.info(`Reset password for user: ${user.user_id}`);
    return true;
  } catch (error) {
    logger.error('Error resetting password', { error });
    throw error;
  }
};

/**
 * Creates an email verification token for a user
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to email verification token
 */
export const createEmailVerificationToken = async (
  userId: string
): Promise<string> => {
  try {
    const db = getKnexInstance();

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Update user with verification token
    await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        verification_token: token,
        updated_at: new Date()
      });

    logger.info(`Created email verification token for user: ${userId}`);
    return token;
  } catch (error) {
    logger.error('Error creating email verification token', { error, userId });
    throw error;
  }
};

/**
 * Verifies a user's email using a verification token
 * 
 * @param token - Email verification token
 * @returns Promise resolving to true if email verification was successful
 */
export const verifyEmail = async (token: string): Promise<boolean> => {
  try {
    const db = getKnexInstance();

    // Find user with the verification token
    const user = await db(TABLE_NAME)
      .where({ verification_token: token })
      .first();

    if (!user) {
      logger.warn('Invalid email verification token');
      return false;
    }

    // Update user to set email as verified and clear verification token
    await db(TABLE_NAME)
      .where({ user_id: user.user_id })
      .update({
        email_verified: true,
        verification_token: null,
        status: user.status === UserStatus.PENDING ? UserStatus.ACTIVE : user.status,
        updated_at: new Date()
      });

    logger.info(`Verified email for user: ${user.user_id}`);
    return true;
  } catch (error) {
    logger.error('Error verifying email', { error });
    throw error;
  }
};

/**
 * Updates a user's last login timestamp
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to true if update was successful
 */
export const updateLastLogin = async (userId: string): Promise<boolean> => {
  try {
    const db = getKnexInstance();

    // Update user's last login timestamp
    const updateCount = await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        last_login: new Date()
      });

    return updateCount > 0;
  } catch (error) {
    logger.error('Error updating last login', { error, userId });
    throw error;
  }
};

/**
 * Enables or disables multi-factor authentication for a user
 * 
 * @param userId - ID of the user
 * @param enabled - Whether MFA should be enabled
 * @param secret - MFA secret key (required when enabling)
 * @returns Promise resolving to true if MFA status update was successful
 */
export const setMfaEnabled = async (
  userId: string,
  enabled: boolean,
  secret: string
): Promise<boolean> => {
  try {
    const db = getKnexInstance();

    // Update user's MFA settings
    const updateCount = await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        mfa_enabled: enabled,
        mfa_secret: enabled ? secret : null,
        updated_at: new Date()
      });

    if (updateCount > 0) {
      logger.info(`${enabled ? 'Enabled' : 'Disabled'} MFA for user: ${userId}`);
      return true;
    } else {
      logger.warn(`No user found to update MFA settings with ID: ${userId}`);
      return false;
    }
  } catch (error) {
    logger.error('Error setting MFA enabled', { error, userId, enabled });
    throw error;
  }
};

/**
 * Gets a user's public profile information
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to user profile if found, null otherwise
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const user = await getUserById(userId);

    if (!user) {
      return null;
    }

    // Extract role names from role objects
    const roleNames = user.roles.map(role => role.name);
    
    // Extract permission names from role objects
    const permissionNames: string[] = [];
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        if (!permissionNames.includes(permission.name)) {
          permissionNames.push(permission.name);
        }
      });
    });

    // Create user profile without sensitive information
    const userProfile: UserProfile = {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      user_type: user.user_type,
      status: user.status,
      roles: roleNames,
      permissions: permissionNames,
      carrier_id: user.carrier_id,
      shipper_id: user.shipper_id,
      driver_id: user.driver_id,
      email_verified: user.email_verified,
      mfa_enabled: user.mfa_enabled
    };

    return userProfile;
  } catch (error) {
    logger.error('Error getting user profile', { error, userId });
    throw error;
  }
};

/**
 * Searches for users based on criteria with pagination
 * 
 * @param searchCriteria - Search criteria object
 * @param page - Page number for pagination
 * @param limit - Number of items per page
 * @returns Promise resolving to paginated search results
 */
export const searchUsers = async (
  searchCriteria: {
    name?: string;
    email?: string;
    user_type?: UserType;
    status?: UserStatus;
  },
  page: number = 1,
  limit: number = 20
): Promise<{
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const db = getKnexInstance();
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build the query
    let query = db(TABLE_NAME);
    let countQuery = db(TABLE_NAME);
    
    // Apply filters if provided
    if (searchCriteria.name) {
      const nameParts = searchCriteria.name.toLowerCase().split(' ');
      if (nameParts.length === 1) {
        // Single name search
        const term = `%${nameParts[0]}%`;
        query = query.whereRaw('(LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?)', [term, term]);
        countQuery = countQuery.whereRaw('(LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?)', [term, term]);
      } else {
        // First and last name search
        query = query.whereRaw('(LOWER(first_name) LIKE ? AND LOWER(last_name) LIKE ?)', 
          [`%${nameParts[0]}%`, `%${nameParts[1]}%`]);
        countQuery = countQuery.whereRaw('(LOWER(first_name) LIKE ? AND LOWER(last_name) LIKE ?)', 
          [`%${nameParts[0]}%`, `%${nameParts[1]}%`]);
      }
    }
    
    if (searchCriteria.email) {
      query = query.whereRaw('LOWER(email) LIKE ?', [`%${searchCriteria.email.toLowerCase()}%`]);
      countQuery = countQuery.whereRaw('LOWER(email) LIKE ?', [`%${searchCriteria.email.toLowerCase()}%`]);
    }
    
    if (searchCriteria.user_type) {
      query = query.where({ user_type: searchCriteria.user_type });
      countQuery = countQuery.where({ user_type: searchCriteria.user_type });
    }
    
    if (searchCriteria.status) {
      query = query.where({ status: searchCriteria.status });
      countQuery = countQuery.where({ status: searchCriteria.status });
    }
    
    // Get total count
    const [{ count }] = await countQuery.count({ count: '*' });
    const total = parseInt(count as string, 10);
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Get the users
    const users = await query;
    
    // Convert users to user profiles
    const userProfiles = await Promise.all(
      users.map(async (user) => {
        const roleIds = await getUserRoleIds(user.user_id);
        const roles = await getRolesByIds(roleIds);
        
        // Extract role names
        const roleNames = roles.map(role => role.name);
        
        // Extract permission names
        const permissionNames: string[] = [];
        roles.forEach(role => {
          role.permissions.forEach(permission => {
            if (!permissionNames.includes(permission.name)) {
              permissionNames.push(permission.name);
            }
          });
        });
        
        // Create user profile
        return {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          user_type: user.user_type,
          status: user.status,
          roles: roleNames,
          permissions: permissionNames,
          carrier_id: user.carrier_id,
          shipper_id: user.shipper_id,
          driver_id: user.driver_id,
          email_verified: user.email_verified,
          mfa_enabled: user.mfa_enabled
        };
      })
    );
    
    return {
      users: userProfiles,
      total,
      page,
      limit
    };
  } catch (error) {
    logger.error('Error searching users', { error, searchCriteria });
    throw error;
  }
};

/**
 * Retrieves role IDs associated with a user
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to array of role IDs
 */
export const getUserRoleIds = async (userId: string): Promise<string[]> => {
  try {
    const db = getKnexInstance();
    
    // Get role IDs for the user
    const userRoles = await db(USER_ROLES_TABLE)
      .where({ user_id: userId })
      .select('role_id');
    
    return userRoles.map(ur => ur.role_id);
  } catch (error) {
    logger.error('Error getting user role IDs', { error, userId });
    throw error;
  }
};

/**
 * Adds roles to an existing user
 * 
 * @param userId - ID of the user
 * @param roleIds - Array of role IDs to add
 * @returns Promise resolving to true if roles were added successfully
 */
export const addRolesToUser = async (
  userId: string,
  roleIds: string[]
): Promise<boolean> => {
  if (!roleIds.length) {
    return true; // No roles to add
  }

  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Get existing role IDs for the user
    const existingRoleIds = await getUserRoleIds(userId);

    // Filter out role IDs that are already assigned to the user
    const newRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));

    // Add new user-role relationships
    if (newRoleIds.length > 0) {
      const userRoles = newRoleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId,
        created_at: new Date()
      }));

      await trx(USER_ROLES_TABLE).insert(userRoles);
    }

    await trx.commit();
    logger.info(`Added roles to user: ${userId}`, { roleCount: newRoleIds.length });
    
    return true;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error adding roles to user', { error, userId, roleIds });
    throw error;
  }
};

/**
 * Removes roles from an existing user
 * 
 * @param userId - ID of the user
 * @param roleIds - Array of role IDs to remove
 * @returns Promise resolving to true if roles were removed successfully
 */
export const removeRolesFromUser = async (
  userId: string,
  roleIds: string[]
): Promise<boolean> => {
  if (!roleIds.length) {
    return true; // No roles to remove
  }

  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Delete specified user-role relationships
    await trx(USER_ROLES_TABLE)
      .where({ user_id: userId })
      .whereIn('role_id', roleIds)
      .delete();

    await trx.commit();
    logger.info(`Removed roles from user: ${userId}`, { roleCount: roleIds.length });
    
    return true;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error removing roles from user', { error, userId, roleIds });
    throw error;
  }
};

/**
 * Increments the failed login attempts counter for a user
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to updated attempts count and lock status
 */
export const incrementLoginAttempts = async (
  userId: string
): Promise<{ attempts: number; locked: boolean; }> => {
  try {
    const db = getKnexInstance();

    // Get current user data
    const user = await db(TABLE_NAME)
      .where({ user_id: userId })
      .first();

    if (!user) {
      throw createError(
        'User not found',
        { code: ErrorCodes.RES_USER_NOT_FOUND, isOperational: true }
      );
    }

    // Calculate new attempt count
    const attempts = (user.login_attempts || 0) + 1;
    
    // Check if max attempts reached (5 is the typical threshold)
    const maxAttempts = 5;
    const locked = attempts >= maxAttempts;
    
    // Calculate lock expiration (30 minutes from now)
    const lockedUntil = locked ? new Date(Date.now() + 30 * 60 * 1000) : null;
    
    // Update user record
    await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        login_attempts: attempts,
        status: locked ? UserStatus.LOCKED : user.status,
        locked_until: lockedUntil,
        updated_at: new Date()
      });

    if (locked) {
      logger.warn(`User account locked due to too many failed attempts: ${userId}`);
    }

    return { attempts, locked };
  } catch (error) {
    logger.error('Error incrementing login attempts', { error, userId });
    throw error;
  }
};

/**
 * Resets the failed login attempts counter for a user
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to true if reset was successful
 */
export const resetLoginAttempts = async (userId: string): Promise<boolean> => {
  try {
    const db = getKnexInstance();

    // Get current user data
    const user = await db(TABLE_NAME)
      .where({ user_id: userId })
      .first();

    if (!user) {
      return false;
    }

    // Update user record to reset login attempts
    const updateCount = await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        login_attempts: 0,
        status: user.status === UserStatus.LOCKED ? UserStatus.ACTIVE : user.status,
        locked_until: null,
        updated_at: new Date()
      });

    return updateCount > 0;
  } catch (error) {
    logger.error('Error resetting login attempts', { error, userId });
    throw error;
  }
};

/**
 * Checks if a user account is locked
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to lock status and expiration time
 */
export const checkAccountLocked = async (
  userId: string
): Promise<{ locked: boolean; lockedUntil: Date | null; }> => {
  try {
    const db = getKnexInstance();

    // Get user data
    const user = await db(TABLE_NAME)
      .where({ user_id: userId })
      .first();

    if (!user) {
      throw createError(
        'User not found',
        { code: ErrorCodes.RES_USER_NOT_FOUND, isOperational: true }
      );
    }

    const now = new Date();
    
    // Check if account is locked
    let locked = user.status === UserStatus.LOCKED;
    let lockedUntil = user.locked_until;
    
    // If lock has expired, automatically unlock the account
    if (locked && lockedUntil && lockedUntil < now) {
      // Update user record to unlock account
      await db(TABLE_NAME)
        .where({ user_id: userId })
        .update({
          status: UserStatus.ACTIVE,
          locked_until: null,
          login_attempts: 0,
          updated_at: new Date()
        });
      
      locked = false;
      lockedUntil = null;
      
      logger.info(`Automatically unlocked expired account lock: ${userId}`);
    }

    return { locked, lockedUntil };
  } catch (error) {
    logger.error('Error checking account lock status', { error, userId });
    throw error;
  }
};

/**
 * Creates a new user from OAuth provider data
 * 
 * @param provider - Authentication provider (GOOGLE, FACEBOOK, etc.)
 * @param providerId - Provider-specific ID
 * @param profile - User profile data from provider
 * @param defaultRoleIds - Default role IDs to assign
 * @returns Promise resolving to the ID of the created user
 */
export const createOAuthUser = async (
  provider: AuthProvider,
  providerId: string,
  profile: {
    email: string;
    first_name: string;
    last_name: string;
    picture?: string;
  },
  defaultRoleIds: string[]
): Promise<string> => {
  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Check if user with this provider ID already exists
    const existingUser = await trx(TABLE_NAME)
      .where({ 
        auth_provider: provider,
        auth_provider_id: providerId
      })
      .first();

    if (existingUser) {
      await trx.rollback();
      throw createError(
        'User with this OAuth identity already exists',
        { code: ErrorCodes.CONF_ALREADY_EXISTS, isOperational: true }
      );
    }

    // Check if user with this email already exists
    const existingEmail = await trx(TABLE_NAME)
      .whereRaw('LOWER(email) = LOWER(?)', [profile.email])
      .first();

    if (existingEmail) {
      await trx.rollback();
      throw createError(
        'User with this email already exists',
        { code: ErrorCodes.CONF_ALREADY_EXISTS, isOperational: true }
      );
    }

    // Generate a unique user ID
    const userId = uuidv4();

    // Create user object
    const user = {
      user_id: userId,
      email: profile.email.toLowerCase(),
      password_hash: null, // OAuth users don't have passwords
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: null,
      user_type: UserType.DRIVER, // Default type, can be updated later
      status: UserStatus.ACTIVE,
      carrier_id: null,
      shipper_id: null,
      driver_id: null,
      email_verified: true, // OAuth providers verify email
      verification_token: null,
      reset_token: null,
      reset_token_expires: null,
      mfa_enabled: false,
      mfa_secret: null,
      last_login: new Date(),
      password_updated_at: null,
      login_attempts: 0,
      locked_until: null,
      auth_provider: provider,
      auth_provider_id: providerId,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Insert user into database
    await trx(TABLE_NAME).insert(user);

    // Insert user-role relationships
    if (defaultRoleIds && defaultRoleIds.length > 0) {
      const userRoles = defaultRoleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId,
        created_at: new Date()
      }));

      await trx(USER_ROLES_TABLE).insert(userRoles);
    }

    await trx.commit();
    logger.info(`Created OAuth user: ${userId}`, { 
      provider, 
      email: profile.email 
    });
    
    return userId;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error creating OAuth user', { 
      error, 
      provider, 
      providerId, 
      email: profile.email 
    });
    throw error;
  }
};

/**
 * Links an OAuth provider to an existing user account
 * 
 * @param userId - ID of the user
 * @param provider - Authentication provider (GOOGLE, FACEBOOK, etc.)
 * @param providerId - Provider-specific ID
 * @returns Promise resolving to true if linking was successful
 */
export const linkOAuthProvider = async (
  userId: string,
  provider: AuthProvider,
  providerId: string
): Promise<boolean> => {
  try {
    const db = getKnexInstance();

    // Check if another user is already linked to this provider ID
    const existingUser = await db(TABLE_NAME)
      .where({ 
        auth_provider: provider,
        auth_provider_id: providerId
      })
      .first();

    if (existingUser && existingUser.user_id !== userId) {
      throw createError(
        'This OAuth identity is already linked to another account',
        { code: ErrorCodes.CONF_ALREADY_EXISTS, isOperational: true }
      );
    }

    // Update user record
    const updateCount = await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        auth_provider: provider,
        auth_provider_id: providerId,
        updated_at: new Date()
      });

    if (updateCount > 0) {
      logger.info(`Linked OAuth provider for user: ${userId}`, { provider });
      return true;
    } else {
      logger.warn(`No user found to link OAuth provider with ID: ${userId}`);
      return false;
    }
  } catch (error) {
    logger.error('Error linking OAuth provider', { error, userId, provider });
    throw error;
  }
};

/**
 * Unlinks an OAuth provider from a user account
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to true if unlinking was successful
 */
export const unlinkOAuthProvider = async (userId: string): Promise<boolean> => {
  try {
    const db = getKnexInstance();

    // Get user data
    const user = await db(TABLE_NAME)
      .where({ user_id: userId })
      .first();

    if (!user) {
      return false;
    }

    // Check if user has a password set (required for unlinking)
    if (!user.password_hash) {
      throw createError(
        'Cannot unlink OAuth provider without setting a password first',
        { code: ErrorCodes.VAL_CONSTRAINT_VIOLATION, isOperational: true }
      );
    }

    // Update user record
    const updateCount = await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        auth_provider: AuthProvider.LOCAL,
        auth_provider_id: null,
        updated_at: new Date()
      });

    if (updateCount > 0) {
      logger.info(`Unlinked OAuth provider for user: ${userId}`);
      return true;
    } else {
      logger.warn(`No user found to unlink OAuth provider with ID: ${userId}`);
      return false;
    }
  } catch (error) {
    logger.error('Error unlinking OAuth provider', { error, userId });
    throw error;
  }
};

export {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByAuthProvider,
  updateUser,
  deleteUser,
  updateUserPassword,
  createPasswordResetToken,
  resetPassword,
  createEmailVerificationToken,
  verifyEmail,
  updateLastLogin,
  setMfaEnabled,
  getUserProfile,
  searchUsers,
  getUserRoleIds,
  addRolesToUser,
  removeRolesFromUser,
  incrementLoginAttempts,
  resetLoginAttempts,
  checkAccountLocked,
  createOAuthUser,
  linkOAuthProvider,
  unlinkOAuthProvider
};