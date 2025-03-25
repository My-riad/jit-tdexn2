import express from 'express';
import { UserProfile } from '../../../common/interfaces/user.interface';
import { getRoleByIdService } from '../services/role.service';
import { getPermissionByIdService } from '../services/permission.service';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';

/**
 * Express middleware that checks if a user has a specific permission
 * 
 * @param permissionName - The name of the permission to check
 * @returns Express middleware function
 */
export const requirePermission = (permissionName: string): express.RequestHandler => {
  return async (req, res, next) => {
    // Check if req.user exists (user should be authenticated)
    if (!req.user) {
      logger.error('Unauthorized access attempt - user not authenticated', {
        permissionName,
        path: req.path
      });
      return res.status(StatusCodes.FORBIDDEN).json(
        createError('Access forbidden', ErrorCodes.AUTHZ_RESOURCE_FORBIDDEN)
      );
    }

    const user = req.user as UserProfile;
    
    // Check if the user has the required permission
    try {
      const hasPermission = await checkUserPermission(user, permissionName);
      
      if (hasPermission) {
        // User has the permission, proceed
        logger.debug('Permission check passed', {
          userId: user.user_id,
          permissionName,
          path: req.path
        });
        return next();
      } else {
        // User doesn't have the permission
        logger.error('Permission denied', {
          userId: user.user_id,
          permissionName,
          path: req.path
        });
        
        return res.status(StatusCodes.FORBIDDEN).json(
          createError(
            `Insufficient permissions: ${permissionName} is required`,
            ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS,
            { requiredPermission: permissionName }
          )
        );
      }
    } catch (error) {
      logger.error('Error checking permission', {
        userId: user.user_id,
        permissionName,
        error
      });
      
      return res.status(StatusCodes.FORBIDDEN).json(
        createError(
          'Error checking permissions',
          ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS
        )
      );
    }
  };
};

/**
 * Express middleware that checks if a user has a specific role
 * 
 * @param roleName - The name of the role to check
 * @returns Express middleware function
 */
export const requireRole = (roleName: string): express.RequestHandler => {
  return async (req, res, next) => {
    // Check if req.user exists (user should be authenticated)
    if (!req.user) {
      logger.error('Unauthorized access attempt - user not authenticated', {
        roleName,
        path: req.path
      });
      return res.status(StatusCodes.FORBIDDEN).json(
        createError('Access forbidden', ErrorCodes.AUTHZ_RESOURCE_FORBIDDEN)
      );
    }

    const user = req.user as UserProfile;
    
    // Check if the user has the required role
    try {
      const hasRole = await checkUserRole(user, roleName);
      
      if (hasRole) {
        // User has the role, proceed
        logger.debug('Role check passed', {
          userId: user.user_id,
          roleName,
          path: req.path
        });
        return next();
      } else {
        // User doesn't have the role
        logger.error('Role requirement not met', {
          userId: user.user_id,
          roleName,
          path: req.path
        });
        
        return res.status(StatusCodes.FORBIDDEN).json(
          createError(
            `Invalid role: ${roleName} is required`,
            ErrorCodes.AUTHZ_INVALID_ROLE,
            { requiredRole: roleName }
          )
        );
      }
    } catch (error) {
      logger.error('Error checking role', {
        userId: user.user_id,
        roleName,
        error
      });
      
      return res.status(StatusCodes.FORBIDDEN).json(
        createError(
          'Error checking role',
          ErrorCodes.AUTHZ_INVALID_ROLE
        )
      );
    }
  };
};

/**
 * Express middleware that checks if a user has any of the specified roles
 * 
 * @param roleNames - Array of role names to check
 * @returns Express middleware function
 */
export const requireAnyRole = (roleNames: string[]): express.RequestHandler => {
  return async (req, res, next) => {
    // Check if req.user exists (user should be authenticated)
    if (!req.user) {
      logger.error('Unauthorized access attempt - user not authenticated', {
        roleNames,
        path: req.path
      });
      return res.status(StatusCodes.FORBIDDEN).json(
        createError('Access forbidden', ErrorCodes.AUTHZ_RESOURCE_FORBIDDEN)
      );
    }

    const user = req.user as UserProfile;
    
    // Check if the user has any of the required roles
    try {
      const matchingRoles = [];
      
      // Check each role
      for (const roleName of roleNames) {
        const hasRole = await checkUserRole(user, roleName);
        if (hasRole) {
          matchingRoles.push(roleName);
        }
      }
      
      if (matchingRoles.length > 0) {
        // User has at least one of the required roles, proceed
        logger.debug('Any role check passed', {
          userId: user.user_id,
          matchingRoles,
          path: req.path
        });
        return next();
      } else {
        // User doesn't have any of the required roles
        logger.error('None of the required roles found', {
          userId: user.user_id,
          roleNames,
          path: req.path
        });
        
        return res.status(StatusCodes.FORBIDDEN).json(
          createError(
            `Invalid role: One of [${roleNames.join(', ')}] is required`,
            ErrorCodes.AUTHZ_INVALID_ROLE,
            { requiredRoles: roleNames }
          )
        );
      }
    } catch (error) {
      logger.error('Error checking roles', {
        userId: user.user_id,
        roleNames,
        error
      });
      
      return res.status(StatusCodes.FORBIDDEN).json(
        createError(
          'Error checking roles',
          ErrorCodes.AUTHZ_INVALID_ROLE
        )
      );
    }
  };
};

/**
 * Express middleware that checks if a user has all of the specified roles
 * 
 * @param roleNames - Array of role names to check
 * @returns Express middleware function
 */
export const requireAllRoles = (roleNames: string[]): express.RequestHandler => {
  return async (req, res, next) => {
    // Check if req.user exists (user should be authenticated)
    if (!req.user) {
      logger.error('Unauthorized access attempt - user not authenticated', {
        roleNames,
        path: req.path
      });
      return res.status(StatusCodes.FORBIDDEN).json(
        createError('Access forbidden', ErrorCodes.AUTHZ_RESOURCE_FORBIDDEN)
      );
    }

    const user = req.user as UserProfile;
    
    // Check if the user has all of the required roles
    try {
      const missingRoles = [];
      
      // Check each role
      for (const roleName of roleNames) {
        const hasRole = await checkUserRole(user, roleName);
        if (!hasRole) {
          missingRoles.push(roleName);
        }
      }
      
      if (missingRoles.length === 0) {
        // User has all of the required roles, proceed
        logger.debug('All roles check passed', {
          userId: user.user_id,
          roleNames,
          path: req.path
        });
        return next();
      } else {
        // User is missing some required roles
        logger.error('Missing required roles', {
          userId: user.user_id,
          missingRoles,
          path: req.path
        });
        
        return res.status(StatusCodes.FORBIDDEN).json(
          createError(
            `Invalid role: All of [${roleNames.join(', ')}] are required`,
            ErrorCodes.AUTHZ_INVALID_ROLE,
            { missingRoles, requiredRoles: roleNames }
          )
        );
      }
    } catch (error) {
      logger.error('Error checking roles', {
        userId: user.user_id,
        roleNames,
        error
      });
      
      return res.status(StatusCodes.FORBIDDEN).json(
        createError(
          'Error checking roles',
          ErrorCodes.AUTHZ_INVALID_ROLE
        )
      );
    }
  };
};

/**
 * Express middleware that checks if a user has permission for a specific resource and action
 * 
 * @param resource - The resource to check permission for
 * @param action - The action to check permission for
 * @returns Express middleware function
 */
export const requirePermissionForResource = (resource: string, action: string): express.RequestHandler => {
  return async (req, res, next) => {
    // Check if req.user exists (user should be authenticated)
    if (!req.user) {
      logger.error('Unauthorized access attempt - user not authenticated', {
        resource,
        action,
        path: req.path
      });
      return res.status(StatusCodes.FORBIDDEN).json(
        createError('Access forbidden', ErrorCodes.AUTHZ_RESOURCE_FORBIDDEN)
      );
    }

    const user = req.user as UserProfile;
    
    // Format the permission name as resource:action
    const permissionName = `${resource}:${action}`;
    
    // Check if the user has the required permission
    try {
      const hasPermission = await checkUserPermission(user, permissionName);
      
      if (hasPermission) {
        // User has the permission, proceed
        logger.debug('Resource permission check passed', {
          userId: user.user_id,
          resource,
          action,
          path: req.path
        });
        return next();
      } else {
        // User doesn't have the permission
        logger.error('Permission denied for resource', {
          userId: user.user_id,
          resource,
          action,
          path: req.path
        });
        
        return res.status(StatusCodes.FORBIDDEN).json(
          createError(
            `Insufficient permissions for ${resource}:${action}`,
            ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS,
            { resource, action }
          )
        );
      }
    } catch (error) {
      logger.error('Error checking permission for resource', {
        userId: user.user_id,
        resource,
        action,
        error
      });
      
      return res.status(StatusCodes.FORBIDDEN).json(
        createError(
          'Error checking permissions',
          ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS
        )
      );
    }
  };
};

/**
 * Utility function to check if a user has a specific permission
 * 
 * @param user - User profile containing permissions and roles
 * @param permissionName - The name of the permission to check
 * @returns True if user has the permission, false otherwise
 */
export const checkUserPermission = async (user: UserProfile, permissionName: string): Promise<boolean> => {
  // Check if user has permissions array
  if (!user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }
  
  // Check if the permission is directly included in the user's permissions
  if (user.permissions.includes(permissionName)) {
    return true;
  }
  
  // If not found directly, check if user has any roles that might grant the permission
  // This requires checking the permissions for each role
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    for (const roleId of user.roles) {
      try {
        const role = await getRoleByIdService(roleId);
        
        // Check if this role has the required permission
        if (role && role.permissions && Array.isArray(role.permissions)) {
          const hasPermission = role.permissions.some(
            permission => permission.name === permissionName
          );
          
          if (hasPermission) {
            return true;
          }
        }
      } catch (error) {
        logger.error('Error retrieving role permissions', {
          roleId,
          error
        });
        // Continue checking other roles
      }
    }
  }
  
  // Permission not found
  return false;
};

/**
 * Utility function to check if a user has a specific role
 * 
 * @param user - User profile containing roles
 * @param roleName - The name of the role to check
 * @returns True if user has the role, false otherwise
 */
export const checkUserRole = async (user: UserProfile, roleName: string): Promise<boolean> => {
  // Check if user has roles array
  if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
    return false;
  }
  
  // Get each role and check its name
  for (const roleId of user.roles) {
    try {
      const role = await getRoleByIdService(roleId);
      
      if (role && role.name === roleName) {
        return true;
      }
    } catch (error) {
      logger.error('Error retrieving role', {
        roleId,
        error
      });
      // Continue checking other roles
    }
  }
  
  // Role not found
  return false;
};