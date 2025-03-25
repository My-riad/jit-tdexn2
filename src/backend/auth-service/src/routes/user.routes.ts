import express from 'express'; // express@^4.18.2
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getUserProfile,
  searchUsers,
  addRolesToUser,
  removeRolesFromUser,
  setupMfa,
  verifyMfaSetup,
  disableMfa,
} from '../controllers/user.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';

/**
 * Creates and configures the Express router for user management routes
 * @returns Configured Express router with user management routes
 */
const createUserRouter = (): express.Router => {
  // Create a new Express router instance
  const router = express.Router();

  // Configure public routes that don't require authentication
  // Route for creating a new user
  router.post('/', validateBody(/* UserCreationSchema */ {}), createUser);
  // Route for requesting a password reset
  router.post('/request-password-reset', validateBody(/* PasswordResetRequestSchema */ {}), requestPasswordReset);
  // Route for resetting a password using a token
  router.post('/reset-password', validateBody(/* PasswordResetConfirmationSchema */ {}), resetPassword);
  // Route for verifying an email using a token
  router.get('/verify-email', validateQuery(/* VerifyEmailSchema */ {}), verifyEmail);

  // Configure protected routes that require authentication
  // Apply authentication middleware to all routes below this point
  router.use(authenticate);

  // Route for resending a verification email
  router.post('/:userId/resend-verification-email', validateParams(/* UserIdSchema */ {}), resendVerificationEmail);
  // Route for getting a user by ID
  router.get('/:userId', validateParams(/* UserIdSchema */ {}), getUserById);
  // Route for getting a user by email
  router.get('/', validateQuery(/* UserEmailSchema */ {}), getUserByEmail);
  // Route for getting a user's profile
  router.get('/:userId/profile', validateParams(/* UserIdSchema */ {}), getUserProfile);
   // Route for searching users
  router.get('/search', validateQuery(/* UserSearchSchema */ {}), searchUsers);
  // Route for changing a user's password
  router.post('/:userId/change-password', validateParams(/* UserIdSchema */ {}), validateBody(/* PasswordChangeRequestSchema */ {}), changePassword);
  // Route for setting up MFA
  router.post('/mfa/setup', validateBody(/* MfaSetupRequestSchema */ {}), setupMfa);
  // Route for verifying MFA setup
  router.post('/mfa/verify', validateBody(/* MfaSetupVerificationSchema */ {}), verifyMfaSetup);
  // Route for disabling MFA
  router.post('/mfa/disable', validateBody(/* MfaDisableRequestSchema */ {}), disableMfa);
  // Route for updating a user
  router.put('/:userId', validateParams(/* UserIdSchema */ {}), validateBody(/* UserUpdateSchema */ {}), updateUser);
  // Route for deleting a user
  router.delete('/:userId', validateParams(/* UserIdSchema */ {}), deleteUser);

  // Configure admin-only routes that require specific roles
  // Apply role-based access control middleware to all routes below this point
  router.use(requireRole('SYSTEM_ADMIN'));

  // Route for adding roles to a user
  router.post('/:userId/roles', validateParams(/* UserIdSchema */ {}), validateBody(/* AddRolesToUserSchema */ {}), addRolesToUser);
  // Route for removing roles from a user
  router.delete('/:userId/roles', validateParams(/* UserIdSchema */ {}), validateBody(/* RemoveRolesFromUserSchema */ {}), removeRolesFromUser);

  // Return the configured router
  return router;
};

// Export the router as the default export
export default createUserRouter();