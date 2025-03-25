import express from 'express'; // express@4.18.2
const { Router } = express; // Destructure Router from express

import {
  createRole,
  getRoleById,
  getAllRoles,
  updateRole,
  deleteRole,
  getChildRoles,
  getRoleHierarchy,
  addPermissionsToRole,
  removePermissionsFromRole,
  searchRoles
} from '../controllers/role.controller';
import { requireJwtAuth } from '../middleware/jwt.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import Joi from 'joi'; // joi@17.9.2

/**
 * Creates and configures the Express router for role management routes
 * @returns Configured Express router with role management routes
 */
export const createRoleRouter = (): express.Router => {
  // Create a new Express router instance
  const router = Router();

  // Apply JWT authentication middleware to all routes
  router.use(requireJwtAuth);

  // Configure routes for role CRUD operations
  // POST /api/v1/roles - Create a new role
  router.post(
    '/',
    requireRole('SYSTEM_ADMIN'),
    validateBody(
      Joi.object({
        name: Joi.string().required().min(3).max(50),
        description: Joi.string().required().min(5).max(200),
        parent_role_id: Joi.string().uuid().allow(null),
        permissionIds: Joi.array().items(Joi.string().uuid()).optional()
      })
    ),
    createRole
  );

  // GET /api/v1/roles/:roleId - Get a role by ID
  router.get(
    '/:roleId',
    requireRole('SYSTEM_ADMIN'),
    validateParams(
      Joi.object({
        roleId: Joi.string().uuid().required()
      })
    ),
    getRoleById
  );

  // GET /api/v1/roles - Get all roles
  router.get(
    '/',
    requireRole('SYSTEM_ADMIN'),
    validateQuery(
      Joi.object({
        name: Joi.string().optional(),
        parent_role_id: Joi.string().uuid().allow(null).optional()
      })
    ),
    getAllRoles
  );

  // PUT /api/v1/roles/:roleId - Update a role
  router.put(
    '/:roleId',
    requireRole('SYSTEM_ADMIN'),
    validateParams(
      Joi.object({
        roleId: Joi.string().uuid().required()
      })
    ),
    validateBody(
      Joi.object({
        name: Joi.string().min(3).max(50).optional(),
        description: Joi.string().min(5).max(200).optional(),
        parent_role_id: Joi.string().uuid().allow(null).optional(),
        permissionIds: Joi.array().items(Joi.string().uuid()).optional()
      })
    ),
    updateRole
  );

  // DELETE /api/v1/roles/:roleId - Delete a role
  router.delete(
    '/:roleId',
    requireRole('SYSTEM_ADMIN'),
    validateParams(
      Joi.object({
        roleId: Joi.string().uuid().required()
      })
    ),
    deleteRole
  );

  // Configure routes for role hierarchy management
  // GET /api/v1/roles/:roleId/children - Get child roles of a role
  router.get(
    '/:roleId/children',
    requireRole('SYSTEM_ADMIN'),
    validateParams(
      Joi.object({
        roleId: Joi.string().uuid().required()
      })
    ),
    getChildRoles
  );

  // GET /api/v1/roles/hierarchy - Get the entire role hierarchy
  router.get(
    '/hierarchy',
    requireRole('SYSTEM_ADMIN'),
    getRoleHierarchy
  );

  // Configure routes for role permission management
  // POST /api/v1/roles/:roleId/permissions - Add permissions to a role
  router.post(
    '/:roleId/permissions',
    requireRole('SYSTEM_ADMIN'),
    validateParams(
      Joi.object({
        roleId: Joi.string().uuid().required()
      })
    ),
    validateBody(
      Joi.object({
        permissionIds: Joi.array().items(Joi.string().uuid()).required()
      })
    ),
    addPermissionsToRole
  );

  // DELETE /api/v1/roles/:roleId/permissions - Remove permissions from a role
  router.delete(
    '/:roleId/permissions',
    requireRole('SYSTEM_ADMIN'),
    validateParams(
      Joi.object({
        roleId: Joi.string().uuid().required()
      })
    ),
    validateBody(
      Joi.object({
        permissionIds: Joi.array().items(Joi.string().uuid()).required()
      })
    ),
    removePermissionsFromRole
  );

  // Configure routes for role search functionality
  // GET /api/v1/roles/search - Search for roles based on criteria
  router.get(
    '/search',
    requireRole('SYSTEM_ADMIN'),
    validateQuery(
      Joi.object({
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        parent_role_id: Joi.string().uuid().allow(null).optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional()
      })
    ),
    searchRoles
  );

  // Return the configured router
  return router;
};

// Export the configured router for use in the application
export default createRoleRouter();