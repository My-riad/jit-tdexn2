/**
 * Permission Service
 * 
 * Service layer for permission management in the authentication and authorization system.
 * Provides business logic for creating, retrieving, updating, and deleting permissions,
 * as well as searching and filtering permissions based on various criteria.
 * Implements the Role-Based Access Control (RBAC) system for the AI-driven Freight Optimization Platform.
 */

import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { Permission } from '../../../common/interfaces/user.interface';
import {
  createPermission,
  getPermissionById,
  getPermissionsByIds,
  getPermissionsByResource,
  getAllPermissions,
  updatePermission,
  deletePermission,
  searchPermissions,
  getPermissionsByAction,
  getPermissionsByResourceAndAction
} from '../models/permission.model';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * Creates a new permission with validation
 * 
 * @param permissionData - Permission data to create
 * @returns Promise resolving to the ID of the created permission
 */
export const createPermissionService = async (
  permissionData: Omit<Permission, 'permission_id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  try {
    // Validate permission data
    await validatePermissionData(permissionData, false);
    
    // Check for name conflicts
    const nameConflict = await checkPermissionNameConflict(permissionData.name, '');
    if (nameConflict) {
      throw createError(
        `Permission with name '${permissionData.name}' already exists`,
        ErrorCodes.RESOURCE_CONFLICT,
        {
          resource: 'permission',
          name: permissionData.name
        }
      );
    }
    
    // Check for resource-action conflicts
    const resourceActionConflict = await checkResourceActionConflict(
      permissionData.resource,
      permissionData.action,
      ''
    );
    
    if (resourceActionConflict) {
      throw createError(
        `Permission for resource '${permissionData.resource}' and action '${permissionData.action}' already exists`,
        ErrorCodes.RESOURCE_CONFLICT,
        {
          resource: permissionData.resource,
          action: permissionData.action
        }
      );
    }
    
    // Create the permission
    const permissionId = await createPermission(permissionData);
    
    logger.info('Permission created successfully', {
      permissionId,
      name: permissionData.name,
      resource: permissionData.resource,
      action: permissionData.action
    });
    
    return permissionId;
  } catch (error) {
    logger.error('Failed to create permission', {
      error,
      permissionData
    });
    throw error;
  }
};

/**
 * Retrieves a permission by its ID with error handling
 * 
 * @param permissionId - ID of the permission to retrieve
 * @returns Promise resolving to the permission object
 */
export const getPermissionByIdService = async (permissionId: string): Promise<Permission> => {
  try {
    // Validate permission ID format
    if (!permissionId || typeof permissionId !== 'string') {
      throw createError(
        'Invalid permission ID format',
        ErrorCodes.VALIDATION_FAILED,
        { permissionId }
      );
    }
    
    // Get the permission
    const permission = await getPermissionById(permissionId);
    
    // Check if permission exists
    if (!permission) {
      throw createError(
        `Permission with ID '${permissionId}' not found`,
        ErrorCodes.RESOURCE_NOT_FOUND,
        { permissionId }
      );
    }
    
    return permission;
  } catch (error) {
    logger.error('Failed to get permission by ID', {
      error,
      permissionId
    });
    throw error;
  }
};

/**
 * Retrieves multiple permissions by their IDs with error handling
 * 
 * @param permissionIds - Array of permission IDs to retrieve
 * @returns Promise resolving to an array of permission objects
 */
export const getPermissionsByIdsService = async (permissionIds: string[]): Promise<Permission[]> => {
  try {
    // Validate permission IDs array
    if (!Array.isArray(permissionIds)) {
      throw createError(
        'Invalid permission IDs format',
        ErrorCodes.VALIDATION_FAILED,
        { permissionIds }
      );
    }
    
    // Get the permissions
    const permissions = await getPermissionsByIds(permissionIds);
    
    return permissions;
  } catch (error) {
    logger.error('Failed to get permissions by IDs', {
      error,
      permissionIds
    });
    throw error;
  }
};

/**
 * Retrieves permissions for a specific resource with error handling
 * 
 * @param resource - Resource name to filter permissions by
 * @returns Promise resolving to an array of permissions for the resource
 */
export const getPermissionsByResourceService = async (resource: string): Promise<Permission[]> => {
  try {
    // Validate resource parameter
    if (!resource || typeof resource !== 'string') {
      throw createError(
        'Invalid resource parameter',
        ErrorCodes.VALIDATION_FAILED,
        { resource }
      );
    }
    
    // Get the permissions
    const permissions = await getPermissionsByResource(resource);
    
    return permissions;
  } catch (error) {
    logger.error('Failed to get permissions by resource', {
      error,
      resource
    });
    throw error;
  }
};

/**
 * Retrieves all permissions with optional filtering
 * 
 * @param filters - Optional filters for resources and actions
 * @returns Promise resolving to an array of all permissions matching filters
 */
export const getAllPermissionsService = async (
  filters: { resource?: string; action?: string } = {}
): Promise<Permission[]> => {
  try {
    let permissions: Permission[];
    
    // If filters are provided, use search instead of getting all
    if (filters.resource || filters.action) {
      permissions = await searchPermissions(filters);
    } else {
      permissions = await getAllPermissions();
    }
    
    return permissions;
  } catch (error) {
    logger.error('Failed to get all permissions', {
      error,
      filters
    });
    throw error;
  }
};

/**
 * Updates an existing permission with validation
 * 
 * @param permissionId - ID of the permission to update
 * @param permissionData - Partial permission data to update
 * @returns Promise resolving to a boolean indicating success
 */
export const updatePermissionService = async (
  permissionId: string,
  permissionData: Partial<Omit<Permission, 'permission_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> => {
  try {
    // Validate permission ID format
    if (!permissionId || typeof permissionId !== 'string') {
      throw createError(
        'Invalid permission ID format',
        ErrorCodes.VALIDATION_FAILED,
        { permissionId }
      );
    }
    
    // Validate permission data
    await validatePermissionData(permissionData, true);
    
    // Verify permission exists
    const existingPermission = await getPermissionByIdService(permissionId);
    
    // Check for name conflicts if updating name
    if (permissionData.name && permissionData.name !== existingPermission.name) {
      const nameConflict = await checkPermissionNameConflict(permissionData.name, permissionId);
      if (nameConflict) {
        throw createError(
          `Permission with name '${permissionData.name}' already exists`,
          ErrorCodes.RESOURCE_CONFLICT,
          {
            resource: 'permission',
            name: permissionData.name
          }
        );
      }
    }
    
    // Check for resource-action conflicts if updating resource or action
    if (
      (permissionData.resource && permissionData.resource !== existingPermission.resource) ||
      (permissionData.action && permissionData.action !== existingPermission.action)
    ) {
      const resource = permissionData.resource || existingPermission.resource;
      const action = permissionData.action || existingPermission.action;
      
      const resourceActionConflict = await checkResourceActionConflict(
        resource,
        action,
        permissionId
      );
      
      if (resourceActionConflict) {
        throw createError(
          `Permission for resource '${resource}' and action '${action}' already exists`,
          ErrorCodes.RESOURCE_CONFLICT,
          {
            resource,
            action
          }
        );
      }
    }
    
    // Update the permission
    const success = await updatePermission(permissionId, permissionData);
    
    if (success) {
      logger.info('Permission updated successfully', {
        permissionId,
        updatedFields: Object.keys(permissionData)
      });
    } else {
      logger.warn('Permission update had no effect', {
        permissionId,
        permissionData
      });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to update permission', {
      error,
      permissionId,
      permissionData
    });
    throw error;
  }
};

/**
 * Deletes a permission with validation and dependency checking
 * 
 * @param permissionId - ID of the permission to delete
 * @returns Promise resolving to a boolean indicating success
 */
export const deletePermissionService = async (permissionId: string): Promise<boolean> => {
  try {
    // Validate permission ID format
    if (!permissionId || typeof permissionId !== 'string') {
      throw createError(
        'Invalid permission ID format',
        ErrorCodes.VALIDATION_FAILED,
        { permissionId }
      );
    }
    
    // Verify permission exists
    await getPermissionByIdService(permissionId);
    
    // Delete the permission
    const success = await deletePermission(permissionId);
    
    if (success) {
      logger.info('Permission deleted successfully', { permissionId });
    } else {
      logger.warn('Permission deletion had no effect', { permissionId });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to delete permission', {
      error,
      permissionId
    });
    throw error;
  }
};

/**
 * Searches for permissions based on criteria with pagination
 * 
 * @param searchCriteria - Search criteria object
 * @param page - Page number for pagination
 * @param limit - Number of items per page
 * @returns Promise resolving to paginated search results
 */
export const searchPermissionsService = async (
  searchCriteria: { name?: string; resource?: string; action?: string },
  page: number = 1,
  limit: number = 20
): Promise<{ permissions: Permission[]; total: number; page: number; limit: number; }> => {
  try {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Maximum limit to prevent abuse
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Add pagination to search criteria
    const paginatedCriteria = {
      ...searchCriteria,
      limit,
      offset
    };
    
    // Search for permissions
    const permissions = await searchPermissions(paginatedCriteria);
    
    // Get total count for pagination metadata
    // Note: This is a simplified approach. In a real-world scenario,
    // you might want to optimize this with a separate count query.
    const allResults = await searchPermissions(searchCriteria);
    const total = allResults.length;
    
    return {
      permissions,
      total,
      page,
      limit
    };
  } catch (error) {
    logger.error('Failed to search permissions', {
      error,
      searchCriteria,
      page,
      limit
    });
    throw error;
  }
};

/**
 * Retrieves permissions for a specific action with error handling
 * 
 * @param action - Action name to filter permissions by
 * @returns Promise resolving to an array of permissions for the action
 */
export const getPermissionsByActionService = async (action: string): Promise<Permission[]> => {
  try {
    // Validate action parameter
    if (!action || typeof action !== 'string') {
      throw createError(
        'Invalid action parameter',
        ErrorCodes.VALIDATION_FAILED,
        { action }
      );
    }
    
    // Get the permissions
    const permissions = await getPermissionsByAction(action);
    
    return permissions;
  } catch (error) {
    logger.error('Failed to get permissions by action', {
      error,
      action
    });
    throw error;
  }
};

/**
 * Retrieves a permission for a specific resource and action combination
 * 
 * @param resource - Resource name to filter by
 * @param action - Action name to filter by
 * @returns Promise resolving to the permission object if found, null otherwise
 */
export const getPermissionsByResourceAndActionService = async (
  resource: string,
  action: string
): Promise<Permission | null> => {
  try {
    // Validate parameters
    if (!resource || typeof resource !== 'string') {
      throw createError(
        'Invalid resource parameter',
        ErrorCodes.VALIDATION_FAILED,
        { resource }
      );
    }
    
    if (!action || typeof action !== 'string') {
      throw createError(
        'Invalid action parameter',
        ErrorCodes.VALIDATION_FAILED,
        { action }
      );
    }
    
    // Get the permission
    const permission = await getPermissionsByResourceAndAction(resource, action);
    
    return permission;
  } catch (error) {
    logger.error('Failed to get permission by resource and action', {
      error,
      resource,
      action
    });
    throw error;
  }
};

/**
 * Validates permission data for creation and updates
 * 
 * @param permissionData - Permission data to validate
 * @param isUpdate - Whether this is an update operation
 * @returns Promise that resolves if validation passes, throws error if validation fails
 */
const validatePermissionData = async (
  permissionData: Partial<Omit<Permission, 'permission_id' | 'created_at' | 'updated_at'>>,
  isUpdate: boolean
): Promise<void> => {
  const validationErrors: string[] = [];
  
  // For creation, all fields are required
  if (!isUpdate) {
    if (!permissionData.name) {
      validationErrors.push('Permission name is required');
    }
    
    if (!permissionData.resource) {
      validationErrors.push('Resource name is required');
    }
    
    if (!permissionData.action) {
      validationErrors.push('Action name is required');
    }
  }
  
  // Validate name if provided
  if (permissionData.name !== undefined) {
    if (typeof permissionData.name !== 'string') {
      validationErrors.push('Permission name must be a string');
    } else if (permissionData.name.length < 3 || permissionData.name.length > 50) {
      validationErrors.push('Permission name must be between 3 and 50 characters');
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(permissionData.name)) {
      validationErrors.push('Permission name contains invalid characters (use alphanumeric, underscore, dash, or dot)');
    }
  }
  
  // Validate resource if provided
  if (permissionData.resource !== undefined) {
    if (typeof permissionData.resource !== 'string') {
      validationErrors.push('Resource must be a string');
    } else if (permissionData.resource.length < 2 || permissionData.resource.length > 50) {
      validationErrors.push('Resource must be between 2 and 50 characters');
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(permissionData.resource)) {
      validationErrors.push('Resource contains invalid characters (use alphanumeric, underscore, dash, or dot)');
    }
  }
  
  // Validate action if provided
  if (permissionData.action !== undefined) {
    if (typeof permissionData.action !== 'string') {
      validationErrors.push('Action must be a string');
    } else if (permissionData.action.length < 2 || permissionData.action.length > 30) {
      validationErrors.push('Action must be between 2 and 30 characters');
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(permissionData.action)) {
      validationErrors.push('Action contains invalid characters (use alphanumeric, underscore, dash, or dot)');
    }
  }
  
  // Validate attributes if provided
  if (permissionData.attributes !== undefined) {
    if (!Array.isArray(permissionData.attributes)) {
      validationErrors.push('Attributes must be an array');
    } else {
      for (const attribute of permissionData.attributes) {
        if (typeof attribute !== 'string') {
          validationErrors.push('Each attribute must be a string');
          break;
        } else if (attribute.length < 1 || attribute.length > 50) {
          validationErrors.push('Each attribute must be between 1 and 50 characters');
          break;
        }
      }
    }
  }
  
  // If there are validation errors, throw an error
  if (validationErrors.length > 0) {
    throw createError(
      'Permission validation failed',
      ErrorCodes.VALIDATION_FAILED,
      {
        errors: validationErrors,
        permissionData
      }
    );
  }
};

/**
 * Checks if a permission with the same name already exists
 * 
 * @param name - Permission name to check
 * @param excludeId - Permission ID to exclude from the check (for updates)
 * @returns Promise resolving to true if conflict exists, false otherwise
 */
const checkPermissionNameConflict = async (
  name: string,
  excludeId: string
): Promise<boolean> => {
  try {
    // Search for permissions with the same name
    const permissions = await searchPermissions({ name });
    
    // Filter out the permission with excludeId (for updates)
    const conflictingPermissions = permissions.filter(
      p => p.permission_id !== excludeId
    );
    
    return conflictingPermissions.length > 0;
  } catch (error) {
    logger.error('Error checking permission name conflict', {
      error,
      name,
      excludeId
    });
    throw error;
  }
};

/**
 * Checks if a permission with the same resource and action already exists
 * 
 * @param resource - Resource name
 * @param action - Action name
 * @param excludeId - Permission ID to exclude from the check (for updates)
 * @returns Promise resolving to true if conflict exists, false otherwise
 */
const checkResourceActionConflict = async (
  resource: string,
  action: string,
  excludeId: string
): Promise<boolean> => {
  try {
    // Get permission with the same resource and action
    const permission = await getPermissionsByResourceAndAction(resource, action);
    
    // Check if a permission was found and it's not the one we're excluding
    return !!permission && permission.permission_id !== excludeId;
  } catch (error) {
    logger.error('Error checking resource-action conflict', {
      error,
      resource,
      action,
      excludeId
    });
    throw error;
  }
};