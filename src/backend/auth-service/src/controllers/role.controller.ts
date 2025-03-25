/**
 * Role Controller
 *
 * Controller layer for role management in the authentication and authorization system.
 * This controller handles HTTP requests related to creating, retrieving, updating, and deleting roles,
 * as well as managing role hierarchies and permission assignments for the
 * Role-Based Access Control (RBAC) system of the AI-driven Freight Optimization Platform.
 */

import { Request, Response, NextFunction } from 'express'; // express
import {
  createRoleService,
  getRoleByIdService,
  getAllRolesService,
  updateRoleService,
  deleteRoleService,
  getChildRolesService,
  addPermissionsToRoleService,
  removePermissionsFromRoleService,
  searchRolesService
} from '../services/role.service';
import { Role } from '../../../common/interfaces/user.interface';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';

/**
 * Creates a new role with the provided data and permissions
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when the role is created and the response is sent
 */
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract role data and permission IDs from request body
    const { ...roleData } = req.body;
    const permissionIds: string[] = req.body.permissionIds || [];

    // Log the incoming request
    logger.info('Creating role', { roleData, permissionIds });

    // Call createRoleService to create the role with permissions
    const roleId = await createRoleService(roleData, permissionIds);

    // Return success response with the created role ID
    res.status(StatusCodes.CREATED).json({
      message: 'Role created successfully',
      roleId: roleId
    });
  } catch (error) {
    // Log the error
    logger.error('Error creating role', { error });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Retrieves a role by its ID
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when the role is retrieved and the response is sent
 */
export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract role ID from request parameters
    const { roleId } = req.params;

    // Log the incoming request
    logger.info('Getting role by ID', { roleId });

    // Call getRoleByIdService to retrieve the role
    const role = await getRoleByIdService(roleId);

    // Return the role data in the response
    res.status(StatusCodes.OK).json({
      message: 'Role retrieved successfully',
      role
    });
  } catch (error) {
    // Log the error
    logger.error('Error getting role by ID', { error, roleId: req.params.roleId });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Retrieves all roles with optional filtering
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when roles are retrieved and the response is sent
 */
export const getAllRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract optional filter parameters from request query
    const { name, parent_role_id } = req.query;

    // Log the incoming request
    logger.info('Getting all roles', { name, parent_role_id });

    // Call getAllRolesService with filters to retrieve roles
    const roles = await getAllRolesService({
      name: name as string | undefined,
      parent_role_id: parent_role_id as string | undefined
    });

    // Return the list of roles in the response
    res.status(StatusCodes.OK).json({
      message: 'Roles retrieved successfully',
      roles
    });
  } catch (error) {
    // Log the error
    logger.error('Error getting all roles', { error, query: req.query });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Updates an existing role with the provided data
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when the role is updated and the response is sent
 */
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract role ID from request parameters
    const { roleId } = req.params;

    // Extract role data and permission IDs from request body
    const { ...roleData } = req.body;
    const permissionIds: string[] = req.body.permissionIds || [];

    // Log the incoming request
    logger.info('Updating role', { roleId, roleData, permissionIds });

    // Call updateRoleService to update the role
    const success = await updateRoleService(roleId, roleData, permissionIds);

    // Return success response
    if (success) {
      res.status(StatusCodes.OK).json({
        message: 'Role updated successfully'
      });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({
        message: 'Role not found'
      });
    }
  } catch (error) {
    // Log the error
    logger.error('Error updating role', { error, roleId: req.params.roleId, body: req.body });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Deletes a role by its ID
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when the role is deleted and the response is sent
 */
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract role ID from request parameters
    const { roleId } = req.params;

    // Log the incoming request
    logger.info('Deleting role', { roleId });

    // Call deleteRoleService to delete the role
    const success = await deleteRoleService(roleId);

    // Return success response
    if (success) {
      res.status(StatusCodes.OK).json({
        message: 'Role deleted successfully'
      });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({
        message: 'Role not found'
      });
    }
  } catch (error) {
    // Log the error
    logger.error('Error deleting role', { error, roleId: req.params.roleId });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Retrieves all child roles of a parent role
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when child roles are retrieved and the response is sent
 */
export const getChildRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract parent role ID from request parameters
    const { roleId } = req.params;

    // Log the incoming request
    logger.info('Getting child roles', { roleId });

    // Call getChildRolesService to retrieve child roles
    const childRoles = await getChildRolesService(roleId);

    // Return the list of child roles in the response
    res.status(StatusCodes.OK).json({
      message: 'Child roles retrieved successfully',
      childRoles
    });
  } catch (error) {
    // Log the error
    logger.error('Error getting child roles', { error, roleId: req.params.roleId });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Retrieves the complete role hierarchy as a tree structure
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when the role hierarchy is retrieved and the response is sent
 */
export const getRoleHierarchy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Log the incoming request
    logger.info('Getting role hierarchy');

    // Call getAllRolesService to retrieve all roles
    const roles = await getAllRolesService();

    // Build a hierarchical tree structure from the flat list of roles
    const roleHierarchy = buildRoleHierarchy(roles);

    // Return the role hierarchy in the response
    res.status(StatusCodes.OK).json({
      message: 'Role hierarchy retrieved successfully',
      hierarchy: roleHierarchy
    });
  } catch (error) {
    // Log the error
    logger.error('Error getting role hierarchy', { error });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Adds permissions to an existing role
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when permissions are added and the response is sent
 */
export const addPermissionsToRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract role ID from request parameters
    const { roleId } = req.params;

    // Extract permission IDs from request body
    const permissionIds: string[] = req.body.permissionIds || [];

    // Log the incoming request
    logger.info('Adding permissions to role', { roleId, permissionIds });

    // Call addPermissionsToRoleService to add permissions
    const success = await addPermissionsToRoleService(roleId, permissionIds);

    // Return success response
    if (success) {
      res.status(StatusCodes.OK).json({
        message: 'Permissions added to role successfully'
      });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({
        message: 'Role not found'
      });
    }
  } catch (error) {
    // Log the error
    logger.error('Error adding permissions to role', { error, roleId: req.params.roleId, body: req.body });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Removes permissions from an existing role
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when permissions are removed and the response is sent
 */
export const removePermissionsFromRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract role ID from request parameters
    const { roleId } = req.params;

    // Extract permission IDs from request body
    const permissionIds: string[] = req.body.permissionIds || [];

    // Log the incoming request
    logger.info('Removing permissions from role', { roleId, permissionIds });

    // Call removePermissionsFromRoleService to remove permissions
    const success = await removePermissionsFromRoleService(roleId, permissionIds);

    // Return success response
    if (success) {
      res.status(StatusCodes.OK).json({
        message: 'Permissions removed from role successfully'
      });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({
        message: 'Role not found'
      });
    }
  } catch (error) {
    // Log the error
    logger.error('Error removing permissions from role', { error, roleId: req.params.roleId, body: req.body });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Searches for roles based on criteria with pagination
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns A promise that resolves when search results are retrieved and the response is sent
 */
export const searchRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract search criteria from request query
    const { name, description, parent_role_id, page, limit } = req.query;

    // Log the incoming request
    logger.info('Searching roles', { query: req.query });

    // Call searchRolesService with criteria and pagination
    const searchResult = await searchRolesService(
      {
        name: name as string | undefined,
        description: description as string | undefined,
        parent_role_id: parent_role_id as string | undefined
      },
      Number(page) || 1,
      Number(limit) || 20
    );

    // Return paginated search results in the response
    res.status(StatusCodes.OK).json({
      message: 'Roles searched successfully',
      ...searchResult
    });
  } catch (error) {
    // Log the error
    logger.error('Error searching roles', { error, query: req.query });

    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Builds a hierarchical tree structure from a flat list of roles
 *
 * @param roles - Array of Role objects
 * @returns Hierarchical tree structure of roles
 */
const buildRoleHierarchy = (roles: Role[]): object[] => {
  // Create a map of roles by ID for efficient lookup
  const roleMap = new Map<string, Role>();
  roles.forEach(role => roleMap.set(role.role_id, role));

  // Initialize an array for root roles (roles without a parent)
  const rootRoles: any[] = [];

  // For each role, add it to its parent's children array if it has a parent
  roles.forEach(role => {
    if (role.parent_role_id) {
      const parentRole = roleMap.get(role.parent_role_id);
      if (parentRole) {
        // Ensure parentRole has a children array
        if (!Array.isArray((parentRole as any).children)) {
          (parentRole as any).children = [];
        }
        (parentRole as any).children.push(role);
      }
    } else {
      // If the role has no parent, add it to the root roles array
      rootRoles.push(role);
    }
  });

  // Return the root roles array, which now contains the complete hierarchy
  return rootRoles;
};

/**
 * Validates a role ID format
 *
 * @param roleId - Role ID to validate
 * @returns True if the role ID is valid, false otherwise
 */
const validateRoleId = (roleId: string): boolean => {
  // Check if the role ID is a non-empty string
  if (!roleId || typeof roleId !== 'string') {
    return false;
  }

  // Add more sophisticated validation logic here if needed
  // For instance, check if the role ID is a valid UUID format

  return true;
};