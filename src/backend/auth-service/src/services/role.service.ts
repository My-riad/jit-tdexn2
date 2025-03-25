/**
 * Role Service
 * 
 * Service layer for role management in the authentication and authorization system.
 * Provides business logic for creating, retrieving, updating, and deleting roles,
 * as well as managing role hierarchies and permission assignments for the
 * Role-Based Access Control (RBAC) system of the AI-driven Freight Optimization Platform.
 */

import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { Role, Permission } from '../../../common/interfaces/user.interface';
import {
  createRole,
  getRoleById,
  getRolesByIds,
  getAllRoles,
  updateRole,
  deleteRole,
  getChildRoles,
  addPermissionsToRole,
  removePermissionsFromRole,
  getRolePermissionIds,
  getRoleByName,
  searchRoles
} from '../models/role.model';
import { getPermissionByIdService, getPermissionsByIdsService } from './permission.service';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * Creates a new role with validation and permission assignment
 * 
 * @param roleData - Role data excluding ID, permissions, and timestamps
 * @param permissionIds - Array of permission IDs to associate with the role
 * @returns Promise resolving to the ID of the created role
 */
export const createRoleService = async (
  roleData: Omit<Role, 'role_id' | 'permissions' | 'created_at' | 'updated_at'>,
  permissionIds: string[] = []
): Promise<string> => {
  try {
    // Validate role data
    await validateRoleData(roleData, false);
    
    // Check if role with same name already exists
    const nameConflict = await checkRoleNameConflict(roleData.name, '');
    if (nameConflict) {
      throw createError(
        `Role with name '${roleData.name}' already exists`,
        ErrorCodes.RESOURCE_CONFLICT,
        {
          resource: 'role',
          name: roleData.name
        }
      );
    }
    
    // Validate permissions if provided
    if (permissionIds.length > 0) {
      await validatePermissions(permissionIds);
    }
    
    // Validate parent role if provided
    if (roleData.parent_role_id) {
      await validateParentRole(roleData.parent_role_id, '');
    }
    
    // Create the role
    const roleId = await createRole(roleData, permissionIds);
    
    logger.info('Role created successfully', {
      roleId,
      name: roleData.name,
      permissionCount: permissionIds.length
    });
    
    return roleId;
  } catch (error) {
    logger.error('Failed to create role', {
      error,
      roleData,
      permissionCount: permissionIds.length
    });
    throw error;
  }
};

/**
 * Retrieves a role by its ID with error handling
 * 
 * @param roleId - ID of the role to retrieve
 * @returns Promise resolving to the role object with permissions
 */
export const getRoleByIdService = async (roleId: string): Promise<Role> => {
  try {
    // Validate role ID format
    if (!roleId || typeof roleId !== 'string') {
      throw createError(
        'Invalid role ID format',
        ErrorCodes.VALIDATION_FAILED,
        { roleId }
      );
    }
    
    // Get the role
    const role = await getRoleById(roleId);
    
    // Check if role exists
    if (!role) {
      throw createError(
        `Role with ID '${roleId}' not found`,
        ErrorCodes.RESOURCE_NOT_FOUND,
        { roleId }
      );
    }
    
    return role;
  } catch (error) {
    logger.error('Failed to get role by ID', {
      error,
      roleId
    });
    throw error;
  }
};

/**
 * Retrieves multiple roles by their IDs with error handling
 * 
 * @param roleIds - Array of role IDs to retrieve
 * @returns Promise resolving to an array of role objects with permissions
 */
export const getRolesByIdsService = async (roleIds: string[]): Promise<Role[]> => {
  try {
    // Validate role IDs array
    if (!Array.isArray(roleIds)) {
      throw createError(
        'Invalid role IDs format',
        ErrorCodes.VALIDATION_FAILED,
        { roleIds }
      );
    }
    
    // Get the roles
    const roles = await getRolesByIds(roleIds);
    
    return roles;
  } catch (error) {
    logger.error('Failed to get roles by IDs', {
      error,
      roleIds
    });
    throw error;
  }
};

/**
 * Retrieves all roles with optional filtering
 * 
 * @param filters - Optional filters for name and parent_role_id
 * @returns Promise resolving to an array of all roles with permissions matching filters
 */
export const getAllRolesService = async (
  filters: { name?: string; parent_role_id?: string } = {}
): Promise<Role[]> => {
  try {
    let roles: Role[];
    
    // If filters are provided, use search instead of getting all
    if (filters.name || filters.parent_role_id) {
      // Use search function with the filters
      const searchResult = await searchRoles({
        name: filters.name,
        parent_role_id: filters.parent_role_id
      });
      roles = searchResult.roles;
    } else {
      // Get all roles
      roles = await getAllRoles();
    }
    
    return roles;
  } catch (error) {
    logger.error('Failed to get all roles', {
      error,
      filters
    });
    throw error;
  }
};

/**
 * Updates an existing role with validation
 * 
 * @param roleId - ID of the role to update
 * @param roleData - Partial role data to update
 * @param permissionIds - Array of permission IDs to set for the role (optional)
 * @returns Promise resolving to a boolean indicating success
 */
export const updateRoleService = async (
  roleId: string,
  roleData: Partial<Omit<Role, 'role_id' | 'permissions' | 'created_at' | 'updated_at'>>,
  permissionIds?: string[]
): Promise<boolean> => {
  try {
    // Validate role ID format
    if (!roleId || typeof roleId !== 'string') {
      throw createError(
        'Invalid role ID format',
        ErrorCodes.VALIDATION_FAILED,
        { roleId }
      );
    }
    
    // Validate role data
    await validateRoleData(roleData, true);
    
    // Verify role exists
    const existingRole = await getRoleByIdService(roleId);
    
    // Check for name conflicts if updating name
    if (roleData.name && roleData.name !== existingRole.name) {
      const nameConflict = await checkRoleNameConflict(roleData.name, roleId);
      if (nameConflict) {
        throw createError(
          `Role with name '${roleData.name}' already exists`,
          ErrorCodes.RESOURCE_CONFLICT,
          {
            resource: 'role',
            name: roleData.name
          }
        );
      }
    }
    
    // Validate parent role if provided
    if (roleData.parent_role_id && roleData.parent_role_id !== existingRole.parent_role_id) {
      await validateParentRole(roleData.parent_role_id, roleId);
    }
    
    // Validate permissions if provided
    if (permissionIds !== undefined && permissionIds.length > 0) {
      await validatePermissions(permissionIds);
    }
    
    // Update the role
    const success = await updateRole(roleId, roleData, permissionIds);
    
    if (success) {
      logger.info('Role updated successfully', {
        roleId,
        updatedFields: Object.keys(roleData),
        permissionCount: permissionIds ? permissionIds.length : 'unchanged'
      });
    } else {
      logger.warn('Role update had no effect', {
        roleId,
        roleData,
        permissionIds
      });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to update role', {
      error,
      roleId,
      roleData,
      permissionIds
    });
    throw error;
  }
};

/**
 * Deletes a role with validation and dependency checking
 * 
 * @param roleId - ID of the role to delete
 * @returns Promise resolving to a boolean indicating success
 */
export const deleteRoleService = async (roleId: string): Promise<boolean> => {
  try {
    // Validate role ID format
    if (!roleId || typeof roleId !== 'string') {
      throw createError(
        'Invalid role ID format',
        ErrorCodes.VALIDATION_FAILED,
        { roleId }
      );
    }
    
    // Verify role exists
    await getRoleByIdService(roleId);
    
    // Check if role has child roles
    const childRoles = await getChildRolesService(roleId);
    if (childRoles.length > 0) {
      throw createError(
        `Cannot delete role with ID '${roleId}' because it has ${childRoles.length} child roles`,
        ErrorCodes.OPERATION_FAILED,
        { 
          roleId,
          childRoleCount: childRoles.length,
          childRoleIds: childRoles.map(r => r.role_id)
        }
      );
    }
    
    // Delete the role
    const success = await deleteRole(roleId);
    
    if (success) {
      logger.info('Role deleted successfully', { roleId });
    } else {
      logger.warn('Role deletion had no effect', { roleId });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to delete role', {
      error,
      roleId
    });
    throw error;
  }
};

/**
 * Retrieves all child roles of a parent role
 * 
 * @param parentRoleId - ID of the parent role
 * @returns Promise resolving to an array of child roles with permissions
 */
export const getChildRolesService = async (parentRoleId: string): Promise<Role[]> => {
  try {
    // Validate parent role ID format
    if (!parentRoleId || typeof parentRoleId !== 'string') {
      throw createError(
        'Invalid parent role ID format',
        ErrorCodes.VALIDATION_FAILED,
        { parentRoleId }
      );
    }
    
    // Verify parent role exists
    await getRoleByIdService(parentRoleId);
    
    // Get the child roles
    const childRoles = await getChildRoles(parentRoleId);
    
    return childRoles;
  } catch (error) {
    logger.error('Failed to get child roles', {
      error,
      parentRoleId
    });
    throw error;
  }
};

/**
 * Adds permissions to an existing role with validation
 * 
 * @param roleId - ID of the role to add permissions to
 * @param permissionIds - Array of permission IDs to add
 * @returns Promise resolving to a boolean indicating success
 */
export const addPermissionsToRoleService = async (
  roleId: string,
  permissionIds: string[]
): Promise<boolean> => {
  try {
    // Validate role ID format
    if (!roleId || typeof roleId !== 'string') {
      throw createError(
        'Invalid role ID format',
        ErrorCodes.VALIDATION_FAILED,
        { roleId }
      );
    }
    
    // Validate permissions array
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      throw createError(
        'Invalid or empty permissions array',
        ErrorCodes.VALIDATION_FAILED,
        { permissionIds }
      );
    }
    
    // Verify role exists
    await getRoleByIdService(roleId);
    
    // Validate permissions
    await validatePermissions(permissionIds);
    
    // Add permissions to role
    const success = await addPermissionsToRole(roleId, permissionIds);
    
    if (success) {
      logger.info('Permissions added to role successfully', {
        roleId,
        permissionCount: permissionIds.length
      });
    } else {
      logger.warn('Adding permissions to role had no effect', {
        roleId,
        permissionIds
      });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to add permissions to role', {
      error,
      roleId,
      permissionIds
    });
    throw error;
  }
};

/**
 * Removes permissions from an existing role with validation
 * 
 * @param roleId - ID of the role to remove permissions from
 * @param permissionIds - Array of permission IDs to remove
 * @returns Promise resolving to a boolean indicating success
 */
export const removePermissionsFromRoleService = async (
  roleId: string,
  permissionIds: string[]
): Promise<boolean> => {
  try {
    // Validate role ID format
    if (!roleId || typeof roleId !== 'string') {
      throw createError(
        'Invalid role ID format',
        ErrorCodes.VALIDATION_FAILED,
        { roleId }
      );
    }
    
    // Validate permissions array
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      throw createError(
        'Invalid or empty permissions array',
        ErrorCodes.VALIDATION_FAILED,
        { permissionIds }
      );
    }
    
    // Verify role exists
    await getRoleByIdService(roleId);
    
    // Remove permissions from role
    const success = await removePermissionsFromRole(roleId, permissionIds);
    
    if (success) {
      logger.info('Permissions removed from role successfully', {
        roleId,
        permissionCount: permissionIds.length
      });
    } else {
      logger.warn('Removing permissions from role had no effect', {
        roleId,
        permissionIds
      });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to remove permissions from role', {
      error,
      roleId,
      permissionIds
    });
    throw error;
  }
};

/**
 * Retrieves permission IDs associated with a role
 * 
 * @param roleId - ID of the role to get permissions for
 * @returns Promise resolving to an array of permission IDs
 */
export const getRolePermissionIdsService = async (roleId: string): Promise<string[]> => {
  try {
    // Validate role ID format
    if (!roleId || typeof roleId !== 'string') {
      throw createError(
        'Invalid role ID format',
        ErrorCodes.VALIDATION_FAILED,
        { roleId }
      );
    }
    
    // Verify role exists
    await getRoleByIdService(roleId);
    
    // Get the permission IDs
    const permissionIds = await getRolePermissionIds(roleId);
    
    return permissionIds;
  } catch (error) {
    logger.error('Failed to get role permission IDs', {
      error,
      roleId
    });
    throw error;
  }
};

/**
 * Retrieves a role by its name with error handling
 * 
 * @param name - Name of the role to retrieve
 * @returns Promise resolving to the role object if found, null otherwise
 */
export const getRoleByNameService = async (name: string): Promise<Role | null> => {
  try {
    // Validate name parameter
    if (!name || typeof name !== 'string') {
      throw createError(
        'Invalid role name parameter',
        ErrorCodes.VALIDATION_FAILED,
        { name }
      );
    }
    
    // Get the role by name
    const role = await getRoleByName(name);
    
    return role;
  } catch (error) {
    logger.error('Failed to get role by name', {
      error,
      name
    });
    throw error;
  }
};

/**
 * Searches for roles based on criteria with pagination
 * 
 * @param searchCriteria - Search criteria object
 * @param page - Page number for pagination
 * @param limit - Number of items per page
 * @returns Promise resolving to paginated search results
 */
export const searchRolesService = async (
  searchCriteria: { name?: string; description?: string; parent_role_id?: string },
  page: number = 1,
  limit: number = 20
): Promise<{ roles: Role[]; total: number; page: number; limit: number; }> => {
  try {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Maximum limit to prevent abuse
    
    // Search for roles
    const result = await searchRoles(searchCriteria, page, limit);
    
    return result;
  } catch (error) {
    logger.error('Failed to search roles', {
      error,
      searchCriteria,
      page,
      limit
    });
    throw error;
  }
};

/**
 * Validates role data for creation and updates
 * 
 * @param roleData - Role data to validate
 * @param isUpdate - Whether this is an update operation
 * @returns Promise that resolves if validation passes, throws error if validation fails
 */
const validateRoleData = async (
  roleData: Partial<Omit<Role, 'role_id' | 'permissions' | 'created_at' | 'updated_at'>>,
  isUpdate: boolean
): Promise<void> => {
  const validationErrors: string[] = [];
  
  // For creation, name and description are required
  if (!isUpdate) {
    if (!roleData.name) {
      validationErrors.push('Role name is required');
    }
    
    if (!roleData.description) {
      validationErrors.push('Role description is required');
    }
  }
  
  // Validate name if provided
  if (roleData.name !== undefined) {
    if (typeof roleData.name !== 'string') {
      validationErrors.push('Role name must be a string');
    } else if (roleData.name.length < 3 || roleData.name.length > 50) {
      validationErrors.push('Role name must be between 3 and 50 characters');
    } else if (!/^[a-zA-Z0-9_\s.-]+$/.test(roleData.name)) {
      validationErrors.push('Role name contains invalid characters (use alphanumeric, spaces, underscore, dash, or dot)');
    }
  }
  
  // Validate description if provided
  if (roleData.description !== undefined) {
    if (typeof roleData.description !== 'string') {
      validationErrors.push('Role description must be a string');
    } else if (roleData.description.length < 5 || roleData.description.length > 200) {
      validationErrors.push('Role description must be between 5 and 200 characters');
    }
  }
  
  // Validate parent_role_id if provided
  if (roleData.parent_role_id !== undefined && roleData.parent_role_id !== null) {
    if (typeof roleData.parent_role_id !== 'string') {
      validationErrors.push('Parent role ID must be a string or null');
    } else if (roleData.parent_role_id.length === 0) {
      validationErrors.push('Parent role ID cannot be an empty string');
    }
  }
  
  // If there are validation errors, throw an error
  if (validationErrors.length > 0) {
    throw createError(
      'Role validation failed',
      ErrorCodes.VALIDATION_FAILED,
      {
        errors: validationErrors,
        roleData
      }
    );
  }
};

/**
 * Checks if a role with the same name already exists
 * 
 * @param name - Role name to check
 * @param excludeId - Role ID to exclude from the check (for updates)
 * @returns Promise resolving to true if conflict exists, false otherwise
 */
const checkRoleNameConflict = async (
  name: string,
  excludeId: string
): Promise<boolean> => {
  const existingRole = await getRoleByName(name);
  
  if (existingRole && existingRole.role_id !== excludeId) {
    return true;
  }
  
  return false;
};

/**
 * Validates that all permission IDs exist
 * 
 * @param permissionIds - Array of permission IDs to validate
 * @returns Promise that resolves if all permissions exist, throws error otherwise
 */
const validatePermissions = async (permissionIds: string[]): Promise<void> => {
  // Get permissions by IDs
  const permissions = await getPermissionsByIdsService(permissionIds);
  
  // Check if all permission IDs were found
  if (permissions.length !== permissionIds.length) {
    // Find which permission IDs are missing
    const foundPermissionIds = permissions.map(p => p.permission_id);
    const missingPermissionIds = permissionIds.filter(id => !foundPermissionIds.includes(id));
    
    throw createError(
      `One or more permissions not found: ${missingPermissionIds.join(', ')}`,
      ErrorCodes.RESOURCE_NOT_FOUND,
      {
        missingPermissionIds
      }
    );
  }
};

/**
 * Validates that a parent role exists and prevents circular references
 * 
 * @param parentRoleId - ID of the parent role to validate
 * @param childRoleId - ID of the child role (if updating)
 * @returns Promise that resolves if parent role is valid, throws error otherwise
 */
const validateParentRole = async (
  parentRoleId: string,
  childRoleId: string
): Promise<void> => {
  // Verify parent role exists
  await getRoleByIdService(parentRoleId);
  
  // If updating, check for circular references
  if (childRoleId && childRoleId === parentRoleId) {
    throw createError(
      'A role cannot be its own parent',
      ErrorCodes.VALIDATION_FAILED,
      {
        roleId: childRoleId,
        parentRoleId
      }
    );
  }
  
  // If updating, check if this would create a circular reference in the hierarchy
  if (childRoleId) {
    const allChildRoles = await getChildRolesService(childRoleId);
    const childRoleIds = allChildRoles.map(r => r.role_id);
    
    if (childRoleIds.includes(parentRoleId)) {
      throw createError(
        'Circular role hierarchy detected',
        ErrorCodes.VALIDATION_FAILED,
        {
          roleId: childRoleId,
          parentRoleId,
          childRoleIds
        }
      );
    }
  }
};