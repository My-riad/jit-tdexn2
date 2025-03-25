import express from 'express'; // express@^4.18.2
import {
  login,
  verifyMfa,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  validateAccessToken,
  initiateOAuthLogin,
  handleOAuthCallback
} from '../controllers/auth.controller';
import { requireJwtAuth } from '../middleware/jwt.middleware';
import { validateBody } from '../../../common/middleware/validation.middleware';

// Define validation schema for login request body
const loginSchema = express.Router(); // express@^4.18.2
/**
 * Creates and configures the Express router for authentication routes
 * @returns Configured Express router with authentication routes
 */
const createAuthRouter = (): express.Router => {
  // LD1: Create a new Express router instance
  const router = express.Router();

  // LD1: Configure public routes for login, token refresh, and OAuth flows
  router.post('/login', validateBody(loginSchema), login);
  router.post('/verify-mfa', validateBody(loginSchema), verifyMfa);
  router.post('/refresh', refreshAccessToken);
  router.post('/oauth/initiate', validateBody(loginSchema), initiateOAuthLogin);
  router.get('/oauth/callback/:provider', handleOAuthCallback);

  // LD1: Configure protected routes that require authentication
  router.get('/validate', requireJwtAuth, validateAccessToken);
  router.post('/logout', requireJwtAuth, logoutUser);
  router.post('/logout-all', requireJwtAuth, logoutAllDevices);

  // LD1: Return the configured router
  return router;
};

// Export the router as the default export
export default createAuthRouter();