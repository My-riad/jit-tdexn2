import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { UserCredentials, AuthProvider, OAuthLoginRequest, OAuthCallbackParams } from '../../../common/interfaces/user.interface';
import { loginWithCredentials, loginWithOAuth, refreshToken, logout, logoutAll, validateToken, validateTokenFromHeader, verifyMfaToken } from '../services/auth.service';
import { extractTokenFromHeader } from '../utils/token.utils';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { getOAuthProvider } from '../providers/oauth.provider';

/**
 * Handles user login with email and password credentials
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract login credentials from request body
    const credentials: UserCredentials = req.body;

    // LD1: Extract IP address and user agent from request headers
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // LD1: Validate required fields (email, password)
    if (!credentials.email || !credentials.password) {
      throw createError(
        'Missing email or password',
        ErrorCodes.VAL_INVALID_INPUT,
        { missingFields: !credentials.email ? 'email' : 'password' }
      );
    }

    // LD1: Call loginWithCredentials service function
    const { tokens, user, mfaRequired } = await loginWithCredentials(credentials, ipAddress, userAgent);

    // LD1: If MFA is required, return 200 with mfaRequired flag
    if (mfaRequired) {
      res.status(200).json({ mfaRequired: true, userId: user.user_id });
      return;
    }

    // LD1: If login successful, set HTTP-only cookies for tokens
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // Mitigate CSRF attacks
      maxAge: tokens.expiresIn * 1000 // Convert seconds to milliseconds
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // LD1: Return 200 with tokens and user profile
    res.status(200).json({ tokens, user });

    // LD1: Log successful login
    logger.info('User logged in successfully', { userId: user.user_id, email: user.email });
  } catch (error) {
    // LD1: Handle errors and pass to error middleware
    next(error);
  }
};

/**
 * Verifies a multi-factor authentication token during login
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const verifyMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract userId and mfaToken from request body
    const { userId, mfaToken } = req.body;

    // LD1: Validate required fields
    if (!userId || !mfaToken) {
      throw createError(
        'Missing userId or mfaToken',
        ErrorCodes.VAL_INVALID_INPUT,
        { missingFields: !userId ? 'userId' : 'mfaToken' }
      );
    }

    // LD1: Call verifyMfaToken service function
    const isValid = await verifyMfaToken(userId, mfaToken);

    // LD1: If verification successful, return 200 with success message
    if (isValid) {
      res.status(200).json({ message: 'MFA token verified successfully' });
    } else {
      // LD1: If verification fails, return 401 Unauthorized
      throw createError(
        'Invalid MFA token',
        ErrorCodes.AUTH_INVALID_TOKEN,
        { userId }
      );
    }

    // LD1: Log MFA verification attempt
    logger.info('MFA verification attempt', { userId, isValid });
  } catch (error) {
    // LD1: Handle errors and pass to error middleware
    next(error);
  }
};

/**
 * Refreshes an access token using a valid refresh token
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract refresh token from cookies or authorization header
    const refreshTokenFromCookie = req.cookies.refreshToken;
    const refreshTokenFromHeader = extractTokenFromHeader(req.headers.authorization);
    const refreshToken = refreshTokenFromCookie || refreshTokenFromHeader;

    // LD1: Extract IP address and user agent from request headers
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // LD1: Validate refresh token exists
    if (!refreshToken) {
      throw createError(
        'Missing refresh token',
        ErrorCodes.AUTH_MISSING_TOKEN
      );
    }

    // LD1: Call refreshToken service function
    const tokens = await refreshToken(refreshToken, ipAddress, userAgent);

    // LD1: Set HTTP-only cookies for new tokens
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expiresIn * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // LD1: Return 200 with new tokens
    res.status(200).json({ tokens });

    // LD1: Log successful token refresh
    logger.info('Token refreshed successfully');
  } catch (error) {
    // LD1: Handle errors and pass to error middleware
    next(error);
  }
};

/**
 * Logs out a user by invalidating their refresh token
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const logoutUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract refresh token from cookies or authorization header
    const refreshTokenFromCookie = req.cookies.refreshToken;
    const refreshTokenFromHeader = extractTokenFromHeader(req.headers.authorization);
    const refreshToken = refreshTokenFromCookie || refreshTokenFromHeader;

    // LD1: Validate refresh token exists
    if (!refreshToken) {
      throw createError(
        'Missing refresh token',
        ErrorCodes.AUTH_MISSING_TOKEN
      );
    }

    // LD1: Call logout service function
    await logout(refreshToken);

    // LD1: Clear authentication cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // LD1: Return 200 with success message
    res.status(200).json({ message: 'Logged out successfully' });

    // LD1: Log successful logout
    logger.info('User logged out successfully');
  } catch (error) {
    // LD1: Handle errors and pass to error middleware
    next(error);
  }
};

/**
 * Logs out a user from all devices by invalidating all their refresh tokens
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const logoutAllDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract user ID from authenticated request
    const userId = (req as any).user?.user_id;

    // LD1: Validate user ID exists
    if (!userId) {
      throw createError(
        'Missing user ID',
        ErrorCodes.AUTH_MISSING_TOKEN
      );
    }

    // LD1: Call logoutAll service function
    await logoutAll(userId);

    // LD1: Clear authentication cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // LD1: Return 200 with success message
    res.status(200).json({ message: 'Logged out from all devices successfully' });

    // LD1: Log successful logout from all devices
    logger.info('User logged out from all devices', { userId });
  } catch (error) {
    // LD1: Handle errors and pass to error middleware
    next(error);
  }
};

/**
 * Validates an access token and returns the user profile
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract access token from authorization header
    const authorizationHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authorizationHeader);

    // LD1: Validate token exists
    if (!token) {
      throw createError(
        'Missing access token',
        ErrorCodes.AUTH_MISSING_TOKEN
      );
    }

    // LD1: Call validateToken service function
    const userProfile = await validateToken(token);

    // LD1: Return 200 with user profile if token is valid
    res.status(200).json({ user: userProfile });
  } catch (error) {
    // LD1: Handle errors and pass to error middleware
    next(error);
  }
};

/**
 * Initiates OAuth authentication flow by redirecting to provider
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const initiateOAuthLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract provider and redirectUri from request body
    const { provider, redirectUri }: OAuthLoginRequest = req.body;

    // LD1: Validate required fields
    if (!provider || !redirectUri) {
      throw createError(
        'Missing provider or redirectUri',
        ErrorCodes.VAL_INVALID_INPUT,
        { missingFields: !provider ? 'provider' : 'redirectUri' }
      );
    }

    // LD1: Get OAuth provider instance using getOAuthProvider
    const oauthProvider = getOAuthProvider(provider);

    // LD1: Generate authorization URL with appropriate scopes and state
    const { url, state } = await oauthProvider.getOAuthLoginUrl({ redirectUri });

    // LD1: Store the state in a secure, HTTP-only cookie
    res.cookie('oauthState', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // LD1: Redirect user to authorization URL
    res.redirect(url);

    // LD1: Log OAuth initiation
    logger.info('OAuth login initiated', { provider, redirectUri });
  } catch (error) {
    // LD1: Handle errors and pass to error middleware
    next(error);
  }
};

/**
 * Handles OAuth callback after provider authentication
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const handleOAuthCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract code, state, and error from query parameters
    const { code, state, error }: OAuthCallbackParams = req.query;

    // LD1: Extract provider from route parameters
    const provider: AuthProvider = req.params.provider as AuthProvider;

    // LD1: Validate required fields and check for OAuth errors
    if (error) {
      throw createError(
        `OAuth authentication failed: ${error}`,
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        { provider, error }
      );
    }

    if (!code || !state) {
      throw createError(
        'Missing code or state in OAuth callback',
        ErrorCodes.VAL_INVALID_INPUT,
        { missingFields: !code ? 'code' : 'state' }
      );
    }

    // LD1: Get OAuth provider instance using getOAuthProvider
    const oauthProvider = getOAuthProvider(provider);

    // LD1: Validate OAuth state to prevent CSRF
    const storedState = req.cookies.oauthState;
     if (!storedState || storedState !== state) {
        throw createError(
            'Invalid OAuth state. Possible CSRF attack.',
            ErrorCodes.AUTH_INVALID_CREDENTIALS,
            { provider, state }
        );
    }

    // Clear the OAuth state cookie
    res.clearCookie('oauthState');

    // LD1: Exchange authorization code for tokens
    const { profile, providerId, isNewUser } = await oauthProvider.handleOAuthCallback({ code, state });

    // LD1: Call loginWithOAuth service function
    const { tokens, user } = await loginWithOAuth(provider, providerId, profile, req.ip, req.get('User-Agent') || 'Unknown');

    // LD1: Generate redirect URL with tokens and user data
    const redirectUrl = `${oauthProvider.redirectUri}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&userId=${user.user_id}&isNewUser=${isNewUser}`;

    // LD1: Redirect user to client application
    res.redirect(redirectUrl);

    // LD1: Log successful OAuth authentication
    logger.info('OAuth authentication successful', { provider, userId: user.user_id });
  } catch (error) {
    // LD1: Handle errors and redirect with error parameters
    const redirectUri = (error as any).redirectUri || '/oauth/error';
    const errorDescription = (error as any).message || 'OAuth authentication failed';
    const redirectUrl = `${redirectUri}?error=${errorDescription}`;
    res.redirect(redirectUrl);
    next(error);
  }
};