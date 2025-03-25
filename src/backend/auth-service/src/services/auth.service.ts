import { AuthProvider, AuthTokens, LoginRequest, User, UserProfile } from '../../../common/interfaces/user.interface'; // Import the User interface definition
import { getUserByEmailService, getUserByAuthProviderService, getUserProfileService, verifyMfaTokenService } from './user.service'; // Import function to retrieve a user by email
import { comparePassword } from '../utils/password.utils'; // Import function to compare passwords
import { generateTokenPair, verifyAccessToken, verifyRefreshToken, blacklistToken, extractTokenFromHeader } from '../utils/token.utils'; // Import function to generate access and refresh tokens
import { TokenType, saveToken, revokeTokenByJti, revokeAllUserTokens, countUserActiveSessions, getOldestUserSession } from '../models/token.model'; // Import token type enumeration
import { updateLastLogin, incrementLoginAttempts, resetLoginAttempts, checkAccountLocked, createOAuthUser } from '../models/user.model'; // Import function to update last login timestamp
import { MAX_CONCURRENT_SESSIONS } from '../config'; // Import maximum concurrent sessions configuration
import { createError } from '../../../common/utils/error-handler'; // Import function to create standardized error objects
import logger from '../../../common/utils/logger'; // Import logger for logging authentication operations
import { ErrorCodes } from '../../../common/constants/error-codes'; // Import error code constants for authentication errors

/**
 * Authenticates a user with email and password credentials
 * @param loginRequest - loginRequest
 * @param ipAddress - ipAddress
 * @param userAgent - userAgent
 * @returns Authentication result with tokens, user profile, and MFA requirement flag
 */
export const loginWithCredentials = async (
  loginRequest: LoginRequest,
  ipAddress: string,
  userAgent: string
): Promise<{ tokens: AuthTokens; user: UserProfile; mfaRequired: boolean; }> => {
  // Extract email and password from login request
  const { email, password, mfaCode } = loginRequest;

  // Get user by email using getUserByEmailService
  const user: User | null = await getUserByEmailService(email);

  // Check if user exists
  if (!user) {
    throw createError(
      'Invalid credentials',
      ErrorCodes.AUTH_INVALID_CREDENTIALS,
      { email }
    );
  }

  // Check if account is locked using checkAccountLocked
  const { locked, lockedUntil } = await checkAccountLocked(user.user_id);
  if (locked) {
    throw createError(
      'Account is locked',
      ErrorCodes.AUTH_ACCOUNT_LOCKED,
      { email, lockedUntil }
    );
  }

  // Verify password using comparePassword
  const passwordMatch = await comparePassword(password, user.password_hash);

  // If password is incorrect, increment login attempts and throw authentication error
  if (!passwordMatch) {
    await incrementLoginAttempts(user.user_id);
    throw createError(
      'Invalid credentials',
      ErrorCodes.AUTH_INVALID_CREDENTIALS,
      { email }
    );
  }

  // Reset login attempts counter on successful password verification
  await resetLoginAttempts(user.user_id);

  // Check if MFA is enabled for the user
  const mfaEnabled = user.mfa_enabled;

  // If MFA is enabled and no MFA token provided, return with mfaRequired flag
  if (mfaEnabled && !mfaCode) {
    return {
      tokens: null as any, // TODO: Fix this type
      user: null as any, // TODO: Fix this type
      mfaRequired: true
    };
  }

  // If MFA is enabled and token provided, verify MFA token
  if (mfaEnabled && mfaCode) {
    const mfaVerified = await verifyMfaTokenService(user.user_id, mfaCode);
    if (!mfaVerified) {
      throw createError(
        'Invalid MFA token',
        ErrorCodes.AUTH_INVALID_TOKEN,
        { email }
      );
    }
  }

  // Get user profile using getUserProfileService
  const userProfile: UserProfile = await getUserProfileService(user.user_id);

  // Generate token pair using generateTokenPair
  const tokens: AuthTokens = generateTokenPair(userProfile);

  // Check concurrent session limit using countUserActiveSessions
  const activeSessions = await countUserActiveSessions(user.user_id);
  if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
    // If session limit reached, revoke oldest session
    const oldestSession = await getOldestUserSession(user.user_id);
    if (oldestSession) {
      await revokeTokenByJti(oldestSession.jti);
      logger.info('Revoked oldest session for user', { userId: user.user_id, jti: oldestSession.jti });
    }
  }

  // Save refresh token to database using saveToken
  await saveToken(
    user.user_id,
    tokens.refreshToken,
    TokenType.REFRESH,
    new Date(Date.now() + tokens.expiresIn * 1000),
    ipAddress,
    userAgent
  );

  // Update last login timestamp using updateLastLogin
  await updateLastLogin(user.user_id);

  // Log successful login
  logger.info('User logged in successfully', { userId: user.user_id, email });

  // Return tokens, user profile, and MFA requirement flag
  return { tokens, user: userProfile, mfaRequired: false };
};

/**
 * Authenticates or creates a user with OAuth provider credentials
 * @param provider - provider
 * @param providerId - providerId
 * @param profile - profile
 * @param ipAddress - ipAddress
 * @param userAgent - userAgent
 * @returns Authentication result with tokens, user profile, and new user flag
 */
export const loginWithOAuth = async (
  provider: AuthProvider,
  providerId: string,
  profile: { email: string; first_name: string; last_name: string; picture?: string },
  ipAddress: string,
  userAgent: string
): Promise<{ tokens: AuthTokens; user: UserProfile; isNewUser: boolean; }> => {
  // Try to get existing user by auth provider using getUserByAuthProviderService
  let user: User | null = await getUserByAuthProviderService(provider, providerId);
  let isNewUser = false;

  // If user not found, create new user with OAuth data using createOAuthUser
  if (!user) {
    // TODO: Get default role IDs from configuration
    const defaultRoleIds: string[] = [];
    const userId = await createOAuthUser(provider, providerId, profile, defaultRoleIds);
    user = await getUserByAuthProviderService(provider, providerId);
    isNewUser = true;

    if (!user) {
      throw createError(
        'Failed to create OAuth user',
        ErrorCodes.SRV_INTERNAL_ERROR,
        { provider, providerId, email: profile.email }
      );
    }
  }

  // Get user profile using getUserProfileService
  const userProfile: UserProfile = await getUserProfileService(user.user_id);

  // Generate token pair using generateTokenPair
  const tokens: AuthTokens = generateTokenPair(userProfile);

  // Check concurrent session limit using countUserActiveSessions
  const activeSessions = await countUserActiveSessions(user.user_id);
  if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
    // If session limit reached, revoke oldest session
    const oldestSession = await getOldestUserSession(user.user_id);
    if (oldestSession) {
      await revokeTokenByJti(oldestSession.jti);
      logger.info('Revoked oldest session for user', { userId: user.user_id, jti: oldestSession.jti });
    }
  }

  // Save refresh token to database using saveToken
  await saveToken(
    user.user_id,
    tokens.refreshToken,
    TokenType.REFRESH,
    new Date(Date.now() + tokens.expiresIn * 1000),
    ipAddress,
    userAgent
  );

  // Update last login timestamp using updateLastLogin
  await updateLastLogin(user.user_id);

  // Log successful OAuth login
  logger.info('User logged in with OAuth', { userId: user.user_id, provider });

  // Return tokens, user profile, and new user flag
  return { tokens, user: userProfile, isNewUser };
};

/**
 * Refreshes an access token using a valid refresh token
 * @param refreshToken - refreshToken
 * @param ipAddress - ipAddress
 * @param userAgent - userAgent
 * @returns New token pair
 */
export const refreshToken = async (
  refreshToken: string,
  ipAddress: string,
  userAgent: string
): Promise<AuthTokens> => {
  // Verify refresh token using verifyRefreshToken
  const { user_id, jti } = verifyRefreshToken(refreshToken);

  // Get user profile using getUserProfileService
  const userProfile: UserProfile = await getUserProfileService(user_id);

  // Generate new token pair using generateTokenPair
  const tokens: AuthTokens = generateTokenPair(userProfile);

  // Revoke old refresh token using revokeTokenByJti
  await revokeTokenByJti(jti);

  // Save new refresh token to database using saveToken
  await saveToken(
    user_id,
    tokens.refreshToken,
    TokenType.REFRESH,
    new Date(Date.now() + tokens.expiresIn * 1000),
    ipAddress,
    userAgent
  );

  // Log successful token refresh
  logger.info('Token refreshed successfully', { userId: user_id });

  // Return new token pair
  return tokens;
};

/**
 * Logs out a user by revoking their refresh token
 * @param refreshToken - refreshToken
 * @returns True if logout was successful
 */
export const logout = async (refreshToken: string): Promise<boolean> => {
  // Verify refresh token using verifyRefreshToken
  const { jti } = verifyRefreshToken(refreshToken);

  // Revoke refresh token using revokeTokenByJti
  const revoked = await revokeTokenByJti(jti);

  // Blacklist the refresh token using blacklistToken
  blacklistToken(refreshToken);

  // Log successful logout
  logger.info('User logged out successfully', { jti });

  // Return true if logout was successful
  return revoked;
};

/**
 * Logs out a user from all devices by revoking all their refresh tokens
 * @param userId - userId
 * @returns True if logout from all devices was successful
 */
export const logoutAll = async (userId: string): Promise<boolean> => {
  // Revoke all user tokens using revokeAllUserTokens
  const revokedCount = await revokeAllUserTokens(userId, TokenType.REFRESH);

  // Log successful logout from all devices
  logger.info('User logged out from all devices', { userId, revokedCount });

  // Return true if logout from all devices was successful
  return revokedCount > 0;
};

/**
 * Validates an access token and returns the user profile
 * @param token - token
 * @returns User profile from the token
 */
export const validateToken = async (token: string): Promise<UserProfile> => {
  // Verify access token using verifyAccessToken
  const userProfile = verifyAccessToken(token);

  // Return the user profile from the verified token
  return userProfile;
};

/**
 * Extracts and validates a token from an authorization header
 * @param authorizationHeader - authorizationHeader
 * @returns User profile if token is valid, null otherwise
 */
export const validateTokenFromHeader = async (authorizationHeader: string): Promise<UserProfile | null> => {
  try {
    // Extract token from authorization header using extractTokenFromHeader
    const token = extractTokenFromHeader(authorizationHeader);

    // If no token found, return null
    if (!token) {
      return null;
    }

    // Validate the token using validateToken
    const userProfile = await validateToken(token);

    // Return the user profile if token is valid
    return userProfile;
  } catch (error) {
    // Log the error
    logger.error('Error validating token from header', { error });

    // Return null if token is invalid
    return null;
  }
};

/**
 * Verifies a multi-factor authentication token for a user
 * @param userId - userId
 * @param token - token
 * @returns True if MFA token is valid
 */
export const verifyMfaToken = async (userId: string, token: string): Promise<boolean> => {
  // Verify MFA token using verifyMfaTokenService
  const isValid = await verifyMfaTokenService(userId, token);

  // Return true if token is valid, false otherwise
  return isValid;
};

/**
 * Manages concurrent session limits for a user
 * @param userId - userId
 * @returns True if a session was revoked to make room for a new one
 */
export const handleConcurrentSessions = async (userId: string): Promise<boolean> => {
  // Count active user sessions using countUserActiveSessions
  const activeSessions = await countUserActiveSessions(userId);

  // If count is below MAX_CONCURRENT_SESSIONS, return false (no action needed)
  if (activeSessions < MAX_CONCURRENT_SESSIONS) {
    return false;
  }

  // Get oldest user session using getOldestUserSession
  const oldestSession = await getOldestUserSession(userId);

  // If oldest session found, revoke it using revokeTokenByJti
  if (oldestSession) {
    await revokeTokenByJti(oldestSession.jti);
    logger.info('Revoked oldest session for user', { userId, jti: oldestSession.jti });
    return true;
  }

  return false;
};