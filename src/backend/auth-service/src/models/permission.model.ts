/**
 * Permission Model
 * 
 * Database model for permissions in the authentication and authorization system.
 * This model defines the schema for storing permission entities that represent
 * specific actions that can be performed on resources, implementing the
 * Role-Based Access Control (RBAC) system for the AI-driven Freight Optimization Platform.
 */

import { Knex } from 'knex';
import { Permission } from '../../../common/interfaces/user.interface';
import { getKnexInstance } from '../../../common/config/database.config';
import logger from '../../../common/utils/logger';

// Table name constant
const TABLE_NAME = 'permissions';

/**
 * Creates a new permission in the database
 * 
 * @param permissionData - Permission data to create
 * @returns Promise resolving to the ID of the newly created permission
 */
export const createPermission = async (
  permissionData: Omit<Permission, 'permission_id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  try {
    const db = getKnexInstance();
    
    const [id] = await db(TABLE_NAME)
      .insert({
        ...permissionData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('permission_id');
    
    logger.info(`Created permission: ${id}`, { permissionName: permissionData.name });
    return id;
  } catch (error) {
    logger.error('Error creating permission', { error, permissionData });
    throw error;
  }
};

/**
 * Retrieves a permission by its ID
 * 
 * @param permissionId - ID of the permission to retrieve
 * @returns Promise resolving to the permission object if found, null otherwise
 */
export const getPermissionById = async (permissionId: string): Promise<Permission | null> => {
  try {
    const db = getKnexInstance();
    
    const permission = await db(TABLE_NAME)
      .where({ permission_id: permissionId })
      .first();
    
    return permission || null;
  } catch (error) {
    logger.error('Error getting permission by ID', { error, permissionId });
    throw error;
  }
};

/**
 * Retrieves multiple permissions by their IDs
 * 
 * @param permissionIds - Array of permission IDs to retrieve
 * @returns Promise resolving to an array of permission objects
 */
export const getPermissionsByIds = async (permissionIds: string[]): Promise<Permission[]> => {
  try {
    if (!permissionIds.length) {
      return [];
    }
    
    const db = getKnexInstance();
    
    const permissions = await db(TABLE_NAME)
      .whereIn('permission_id', permissionIds);
    
    return permissions;
  } catch (error) {
    logger.error('Error getting permissions by IDs', { error, permissionIds });
    throw error;
  }
};

/**
 * Retrieves permissions for a specific resource
 * 
 * @param resource - Resource name to filter permissions by
 * @returns Promise resolving to an array of permissions for the resource
 */
export const getPermissionsByResource = async (resource: string): Promise<Permission[]> => {
  try {
    const db = getKnexInstance();
    
    const permissions = await db(TABLE_NAME)
      .where({ resource });
    
    return permissions;
  } catch (error) {
    logger.error('Error getting permissions by resource', { error, resource });
    throw error;
  }
};

/**
 * Retrieves all permissions in the system
 * 
 * @returns Promise resolving to an array of all permissions
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  try {
    const db = getKnexInstance();
    
    const permissions = await db(TABLE_NAME)
      .select('*');
    
    return permissions;
  } catch (error) {
    logger.error('Error getting all permissions', { error });
    throw error;
  }
};

/**
 * Updates an existing permission
 * 
 * @param permissionId - ID of the permission to update
 * @param permissionData - Partial permission data to update
 * @returns Promise resolving to a boolean indicating success
 */
export const updatePermission = async (
  permissionId: string,
  permissionData: Partial<Omit<Permission, 'permission_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> => {
  try {
    const db = getKnexInstance();
    
    const result = await db(TABLE_NAME)
      .where({ permission_id: permissionId })
      .update({
        ...permissionData,
        updated_at: new Date()
      });
    
    const success = result > 0;
    if (success) {
      logger.info(`Updated permission: ${permissionId}`);
    } else {
      logger.warn(`No permission found to update with ID: ${permissionId}`);
    }
    
    return success;
  } catch (error) {
    logger.error('Error updating permission', { error, permissionId, permissionData });
    throw error;
  }
};

/**
 * Deletes a permission
 * 
 * @param permissionId - ID of the permission to delete
 * @returns Promise resolving to a boolean indicating success
 */
export const deletePermission = async (permissionId: string): Promise<boolean> => {
  try {
    const db = getKnexInstance();
    
    // Use a transaction to ensure both operations succeed or fail together
    const result = await db.transaction(async (trx) => {
      // First delete any role-permission associations
      await trx('role_permissions')
        .where({ permission_id: permissionId })
        .delete();
      
      // Then delete the permission itself
      const deleteCount = await trx(TABLE_NAME)
        .where({ permission_id: permissionId })
        .delete();
      
      return deleteCount > 0;
    });
    
    if (result) {
      logger.info(`Deleted permission: ${permissionId}`);
    } else {
      logger.warn(`No permission found to delete with ID: ${permissionId}`);
    }
    
    return result;
  } catch (error) {
    logger.error('Error deleting permission', { error, permissionId });
    throw error;
  }
};

/**
 * Searches for permissions based on criteria
 * 
 * @param searchCriteria - Search criteria object
 * @returns Promise resolving to an array of matching permissions
 */
export const searchPermissions = async (
  searchCriteria: {
    name?: string;
    resource?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Permission[]> => {
  try {
    const db = getKnexInstance();
    
    // Start building the query
    let query = db(TABLE_NAME);
    
    // Apply filters if provided
    if (searchCriteria.name) {
      query = query.where('name', 'LIKE', `%${searchCriteria.name}%`);
    }
    
    if (searchCriteria.resource) {
      query = query.where('resource', 'LIKE', `%${searchCriteria.resource}%`);
    }
    
    if (searchCriteria.action) {
      query = query.where('action', 'LIKE', `%${searchCriteria.action}%`);
    }
    
    // Apply pagination if specified
    if (searchCriteria.limit !== undefined) {
      query = query.limit(searchCriteria.limit);
      
      if (searchCriteria.offset !== undefined) {
        query = query.offset(searchCriteria.offset);
      }
    }
    
    // Execute the query
    const permissions = await query;
    
    return permissions;
  } catch (error) {
    logger.error('Error searching permissions', { error, searchCriteria });
    throw error;
  }
};

/**
 * Retrieves permissions for a specific action
 * 
 * @param action - Action name to filter permissions by
 * @returns Promise resolving to an array of permissions for the action
 */
export const getPermissionsByAction = async (action: string): Promise<Permission[]> => {
  try {
    const db = getKnexInstance();
    
    const permissions = await db(TABLE_NAME)
      .where({ action });
    
    return permissions;
  } catch (error) {
    logger.error('Error getting permissions by action', { error, action });
    throw error;
  }
};

/**
 * Retrieves permissions for a specific resource and action combination
 * 
 * @param resource - Resource name to filter by
 * @param action - Action name to filter by
 * @returns Promise resolving to the permission object if found, null otherwise
 */
export const getPermissionsByResourceAndAction = async (
  resource: string,
  action: string
): Promise<Permission | null> => {
  try {
    const db = getKnexInstance();
    
    const permission = await db(TABLE_NAME)
      .where({ resource, action })
      .first();
    
    return permission || null;
  } catch (error) {
    logger.error('Error getting permission by resource and action', { error, resource, action });
    throw error;
  }
};