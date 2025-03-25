/**
 * Role Model
 * 
 * Database model for roles in the authentication and authorization system.
 * This model defines the schema and operations for storing, retrieving, and managing roles,
 * including their hierarchical relationships and permission assignments for the
 * Role-Based Access Control (RBAC) system of the AI-driven Freight Optimization Platform.
 */

import { Knex } from 'knex'; // knex@2.4.2
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { Role, Permission } from '../../../common/interfaces/user.interface';
import { getKnexInstance } from '../../../common/config/database.config';
import { getPermissionsByIds } from './permission.model';
import logger from '../../../common/utils/logger';

// Table name constants
const TABLE_NAME = 'roles';
const ROLE_PERMISSIONS_TABLE = 'role_permissions';

/**
 * Creates a new role in the database
 * 
 * @param roleData - Role data excluding the ID, permissions, and timestamps
 * @param permissionIds - Array of permission IDs to associate with the role
 * @returns Promise resolving to the ID of the created role
 */
export const createRole = async (
  roleData: Omit<Role, 'role_id' | 'permissions' | 'created_at' | 'updated_at'>,
  permissionIds: string[] = []
): Promise<string> => {
  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Generate a unique role ID
    const roleId = uuidv4();

    // Insert the role into the roles table
    await trx(TABLE_NAME).insert({
      role_id: roleId,
      ...roleData,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Insert role-permission relationships if permissions are provided
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date()
      }));

      await trx(ROLE_PERMISSIONS_TABLE).insert(rolePermissions);
    }

    await trx.commit();
    logger.info(`Created role: ${roleId}`, { roleName: roleData.name });
    return roleId;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error creating role', { error, roleData });
    throw error;
  }
};

/**
 * Retrieves a role by its ID with associated permissions
 * 
 * @param roleId - ID of the role to retrieve
 * @returns Promise resolving to the role object with permissions if found, null otherwise
 */
export const getRoleById = async (roleId: string): Promise<Role | null> => {
  try {
    const db = getKnexInstance();

    // Get the role from the database
    const role = await db(TABLE_NAME)
      .where({ role_id: roleId })
      .first();

    if (!role) {
      return null;
    }

    // Get the permission IDs associated with the role
    const permissionIds = await getRolePermissionIds(roleId);

    // Get the permission objects using the IDs
    const permissions = await getPermissionsByIds(permissionIds);

    // Combine role with permissions
    return {
      ...role,
      permissions
    };
  } catch (error) {
    logger.error('Error getting role by ID', { error, roleId });
    throw error;
  }
};

/**
 * Retrieves multiple roles by their IDs with associated permissions
 * 
 * @param roleIds - Array of role IDs to retrieve
 * @returns Promise resolving to an array of role objects with permissions
 */
export const getRolesByIds = async (roleIds: string[]): Promise<Role[]> => {
  try {
    if (!roleIds.length) {
      return [];
    }

    const db = getKnexInstance();

    // Get the roles from the database
    const roles = await db(TABLE_NAME)
      .whereIn('role_id', roleIds);

    if (!roles.length) {
      return [];
    }

    // For each role, get its permissions and attach them
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissionIds = await getRolePermissionIds(role.role_id);
        const permissions = await getPermissionsByIds(permissionIds);
        return {
          ...role,
          permissions
        };
      })
    );

    return rolesWithPermissions;
  } catch (error) {
    logger.error('Error getting roles by IDs', { error, roleIds });
    throw error;
  }
};

/**
 * Retrieves all roles in the system with their permissions
 * 
 * @returns Promise resolving to an array of all roles with permissions
 */
export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const db = getKnexInstance();

    // Get all roles from the database
    const roles = await db(TABLE_NAME).select('*');

    // For each role, get its permissions and attach them
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissionIds = await getRolePermissionIds(role.role_id);
        const permissions = await getPermissionsByIds(permissionIds);
        return {
          ...role,
          permissions
        };
      })
    );

    return rolesWithPermissions;
  } catch (error) {
    logger.error('Error getting all roles', { error });
    throw error;
  }
};

/**
 * Updates an existing role
 * 
 * @param roleId - ID of the role to update
 * @param roleData - Partial role data to update
 * @param permissionIds - Array of permission IDs to set for the role (optional)
 * @returns Promise resolving to a boolean indicating success
 */
export const updateRole = async (
  roleId: string,
  roleData: Partial<Omit<Role, 'role_id' | 'permissions' | 'created_at' | 'updated_at'>>,
  permissionIds?: string[]
): Promise<boolean> => {
  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Update the role in the roles table
    const updateCount = await trx(TABLE_NAME)
      .where({ role_id: roleId })
      .update({
        ...roleData,
        updated_at: new Date()
      });

    // If permission IDs are provided, update role-permission relationships
    if (permissionIds !== undefined) {
      // Delete existing role-permission relationships
      await trx(ROLE_PERMISSIONS_TABLE)
        .where({ role_id: roleId })
        .delete();

      // Insert new role-permission relationships
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          created_at: new Date()
        }));

        await trx(ROLE_PERMISSIONS_TABLE).insert(rolePermissions);
      }
    }

    await trx.commit();
    
    const success = updateCount > 0;
    if (success) {
      logger.info(`Updated role: ${roleId}`);
    } else {
      logger.warn(`No role found to update with ID: ${roleId}`);
    }
    
    return success;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error updating role', { error, roleId, roleData });
    throw error;
  }
};

/**
 * Deletes a role and its permission relationships
 * 
 * @param roleId - ID of the role to delete
 * @returns Promise resolving to a boolean indicating success
 */
export const deleteRole = async (roleId: string): Promise<boolean> => {
  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Delete role-permission relationships
    await trx(ROLE_PERMISSIONS_TABLE)
      .where({ role_id: roleId })
      .delete();

    // Update any child roles to remove the parent reference
    await trx(TABLE_NAME)
      .where({ parent_role_id: roleId })
      .update({
        parent_role_id: null,
        updated_at: new Date()
      });

    // Delete the role
    const deleteCount = await trx(TABLE_NAME)
      .where({ role_id: roleId })
      .delete();

    await trx.commit();
    
    const success = deleteCount > 0;
    if (success) {
      logger.info(`Deleted role: ${roleId}`);
    } else {
      logger.warn(`No role found to delete with ID: ${roleId}`);
    }
    
    return success;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error deleting role', { error, roleId });
    throw error;
  }
};

/**
 * Retrieves all child roles of a parent role
 * 
 * @param parentRoleId - ID of the parent role
 * @returns Promise resolving to an array of child roles with permissions
 */
export const getChildRoles = async (parentRoleId: string): Promise<Role[]> => {
  try {
    const db = getKnexInstance();

    // Get all roles with the specified parent role ID
    const childRoles = await db(TABLE_NAME)
      .where({ parent_role_id: parentRoleId });

    // For each child role, get its permissions and attach them
    const childRolesWithPermissions = await Promise.all(
      childRoles.map(async (role) => {
        const permissionIds = await getRolePermissionIds(role.role_id);
        const permissions = await getPermissionsByIds(permissionIds);
        return {
          ...role,
          permissions
        };
      })
    );

    return childRolesWithPermissions;
  } catch (error) {
    logger.error('Error getting child roles', { error, parentRoleId });
    throw error;
  }
};

/**
 * Adds permissions to an existing role
 * 
 * @param roleId - ID of the role to add permissions to
 * @param permissionIds - Array of permission IDs to add
 * @returns Promise resolving to a boolean indicating success
 */
export const addPermissionsToRole = async (
  roleId: string,
  permissionIds: string[]
): Promise<boolean> => {
  if (!permissionIds.length) {
    return true; // No permissions to add
  }

  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Get existing permission IDs for the role
    const existingPermissionIds = await getRolePermissionIds(roleId);

    // Filter out permission IDs that are already assigned to the role
    const newPermissionIds = permissionIds.filter(
      id => !existingPermissionIds.includes(id)
    );

    // Add new role-permission relationships
    if (newPermissionIds.length > 0) {
      const rolePermissions = newPermissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date()
      }));

      await trx(ROLE_PERMISSIONS_TABLE).insert(rolePermissions);
    }

    await trx.commit();
    logger.info(`Added permissions to role: ${roleId}`, { 
      permissionCount: newPermissionIds.length 
    });
    
    return true;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error adding permissions to role', { error, roleId, permissionIds });
    throw error;
  }
};

/**
 * Removes permissions from an existing role
 * 
 * @param roleId - ID of the role to remove permissions from
 * @param permissionIds - Array of permission IDs to remove
 * @returns Promise resolving to a boolean indicating success
 */
export const removePermissionsFromRole = async (
  roleId: string,
  permissionIds: string[]
): Promise<boolean> => {
  if (!permissionIds.length) {
    return true; // No permissions to remove
  }

  const db = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await db.transaction();

    // Delete specified role-permission relationships
    await trx(ROLE_PERMISSIONS_TABLE)
      .where({ role_id: roleId })
      .whereIn('permission_id', permissionIds)
      .delete();

    await trx.commit();
    logger.info(`Removed permissions from role: ${roleId}`, { 
      permissionCount: permissionIds.length 
    });
    
    return true;
  } catch (error) {
    if (trx) {
      await trx.rollback();
    }
    logger.error('Error removing permissions from role', { error, roleId, permissionIds });
    throw error;
  }
};

/**
 * Retrieves permission IDs associated with a role
 * 
 * @param roleId - ID of the role to get permissions for
 * @returns Promise resolving to an array of permission IDs
 */
export const getRolePermissionIds = async (roleId: string): Promise<string[]> => {
  try {
    const db = getKnexInstance();

    // Get all permission IDs for the role
    const rolePermissions = await db(ROLE_PERMISSIONS_TABLE)
      .where({ role_id: roleId })
      .select('permission_id');

    // Extract permission IDs from the results
    return rolePermissions.map(rp => rp.permission_id);
  } catch (error) {
    logger.error('Error getting role permission IDs', { error, roleId });
    throw error;
  }
};

/**
 * Retrieves a role by its name
 * 
 * @param name - Name of the role to retrieve (case-insensitive)
 * @returns Promise resolving to the role object with permissions if found, null otherwise
 */
export const getRoleByName = async (name: string): Promise<Role | null> => {
  try {
    const db = getKnexInstance();

    // Get the role from the database (case insensitive search)
    const role = await db(TABLE_NAME)
      .whereRaw('LOWER(name) = LOWER(?)', [name])
      .first();

    if (!role) {
      return null;
    }

    // Get the permission IDs associated with the role
    const permissionIds = await getRolePermissionIds(role.role_id);

    // Get the permission objects using the IDs
    const permissions = await getPermissionsByIds(permissionIds);

    // Combine role with permissions
    return {
      ...role,
      permissions
    };
  } catch (error) {
    logger.error('Error getting role by name', { error, name });
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
export const searchRoles = async (
  searchCriteria: {
    name?: string;
    description?: string;
    parent_role_id?: string;
  },
  page: number = 1,
  limit: number = 20
): Promise<{
  roles: Role[];
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
      query = query.whereRaw('LOWER(name) LIKE ?', [`%${searchCriteria.name.toLowerCase()}%`]);
      countQuery = countQuery.whereRaw('LOWER(name) LIKE ?', [`%${searchCriteria.name.toLowerCase()}%`]);
    }
    
    if (searchCriteria.description) {
      query = query.whereRaw('LOWER(description) LIKE ?', [`%${searchCriteria.description.toLowerCase()}%`]);
      countQuery = countQuery.whereRaw('LOWER(description) LIKE ?', [`%${searchCriteria.description.toLowerCase()}%`]);
    }
    
    if (searchCriteria.parent_role_id) {
      query = query.where({ parent_role_id: searchCriteria.parent_role_id });
      countQuery = countQuery.where({ parent_role_id: searchCriteria.parent_role_id });
    }
    
    // Get total count
    const [{ count }] = await countQuery.count({ count: '*' });
    const total = parseInt(count as string, 10);
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Get the roles
    const roles = await query;
    
    // For each role, get its permissions and attach them
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissionIds = await getRolePermissionIds(role.role_id);
        const permissions = await getPermissionsByIds(permissionIds);
        return {
          ...role,
          permissions
        };
      })
    );
    
    return {
      roles: rolesWithPermissions,
      total,
      page,
      limit
    };
  } catch (error) {
    logger.error('Error searching roles', { error, searchCriteria });
    throw error;
  }
};