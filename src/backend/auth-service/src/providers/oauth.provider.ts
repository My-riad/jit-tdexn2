# src/backend/auth-service/src/providers/oauth.provider.ts
```typescript
import axios from 'axios'; // axios@^1.4.0
import * as crypto from 'crypto'; // crypto@^1.0.1
import * as querystring from 'querystring'; // querystring@^0.2.1
import { getOAuthConfig } from '../config';
import { AuthProvider } from '../../../common/interfaces/user.interface';
import { getUserByAuthProvider, createOAuthUser } from '../models/user.model';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';

// Global store for OAuth state parameters
const oauthStateStore = new Map<string, { state: string; createdAt: Date }>();

/**
 * Generates an OAuth authorization URL for a specific provider
 * @param provider - The OAuth provider name (e.g., 'google', 'microsoft', 'facebook')
 * @param options - Additional options (e.g., redirect URI)
 * @returns Authorization URL and state parameter
 */
export const getOAuthLoginUrl = async (
  provider: AuthProvider,
  options: { redirectUri?: string } = {}
): Promise<{ url: string; state: string; }> => {
  // Validate that the provider is supported (not LOCAL)
  if (provider === AuthProvider.LOCAL) {
    throw createError('OAuth is not supported for LOCAL provider', {
      code: ErrorCodes.VAL_INVALID_INPUT,
      isOperational: true
    });
  }

  try {
    // Retrieve OAuth configuration for the provider using getOAuthConfig
    const oauthConfig = getOAuthConfig(provider);

    // Generate a secure random state parameter using crypto
    const state = crypto.randomBytes(16).toString('hex');

    // Store the state parameter with timestamp in oauthStateStore
    oauthStateStore.set(state, { state, createdAt: new Date() });

    // Construct the authorization URL with client_id, redirect_uri, response_type, scope, and state
    const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${querystring.stringify({
      client_id: oauthConfig.clientId,
      redirect_uri: options.redirectUri || oauthConfig.redirectUri,
      response_type: 'code',
      scope: oauthConfig.scopes.join(' '),
      state: state,
      prompt: 'select_account' // Force account selection
    })}`;

    // Return the authorization URL and state parameter
    logger.info(`Generated OAuth login URL for ${provider}`, { provider, state });
    return { url: authorizationUrl, state: state };
  } catch (error) {
    // Handle and log any errors that occur
    logger.error(`Error generating OAuth login URL for ${provider}`, { error, provider });
    throw error;
  }
};

/**
 * Validates an OAuth state parameter to prevent CSRF attacks
 * @param state - The state parameter from the authorization request
 * @param storedState - The stored state parameter
 * @returns True if state is valid, false otherwise
 */
export const validateOAuthState = (state: string, storedState: string): boolean => {
  // Check if both state and storedState parameters are provided
  if (!state || !storedState) {
    logger.warn('Missing OAuth state parameter');
    return false;
  }

  // Compare the provided state with the stored state
  const isValid = state === storedState;

  // Clean up expired states from oauthStateStore
  cleanupExpiredStates();

  // Return true if they match, false otherwise
  return isValid;
};

/**
 * Processes an OAuth callback and retrieves user information
 * @param provider - The OAuth provider name (e.g., 'google', 'microsoft', 'facebook')
 * @param callbackParams - The callback parameters from the OAuth provider
 * @returns User profile, provider ID, and new user flag
 */
export const handleOAuthCallback = async (
  provider: AuthProvider,
  callbackParams: { code: string; state: string; error?: string; }
): Promise<{ profile: any; providerId: string; isNewUser: boolean; }> => {
  try {
    // Extract code and error from callback parameters
    const { code, state, error } = callbackParams;

    // If error is present, throw an authentication error
    if (error) {
      logger.error(`OAuth callback error from ${provider}`, { error, code, state });
      throw createError(`OAuth callback failed: ${error}`, {
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        isOperational: true,
        details: { provider, code, state }
      });
    }

    // Retrieve OAuth configuration for the provider
    const oauthConfig = getOAuthConfig(provider);

    // Validate OAuth state to prevent CSRF
    if (!validateOAuthState(state, oauthStateStore.get(state)?.state)) {
      throw createError('Invalid OAuth state', {
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        isOperational: true,
        details: { provider, state }
      });
    }

    // Exchange the authorization code for access token
    const { access_token, id_token } = await exchangeCodeForToken(provider, code, oauthConfig.redirectUri);

    // Use the access token to fetch user profile from provider's API
    const profile = await fetchUserProfile(provider, access_token, id_token);

    // Extract provider-specific user ID and profile information
    const providerId = profile.id;

    // Check if a user already exists with this provider ID
    let user = await getUserByAuthProvider(provider, providerId);
    let isNewUser = false;

    // If user doesn't exist, create a new user with default roles
    if (!user) {
      // Default role IDs to assign to new OAuth users
      const defaultRoleIds = ['driver']; // Example: Assign 'driver' role by default
      const userId = await createOAuthUser(provider, providerId, profile, defaultRoleIds);
      user = await getUserByAuthProvider(provider, providerId); // Retrieve the newly created user
      isNewUser = true;
    }

    // Return the profile, provider ID, and isNewUser flag
    logger.info(`OAuth callback processed successfully for ${provider}`, {
      provider,
      providerId,
      email: profile.email,
      isNewUser
    });
    return { profile, providerId, isNewUser };
  } catch (error) {
    // Handle and log any errors that occur
    logger.error(`Error handling OAuth callback for ${provider}`, { error, provider, callbackParams });
    throw error;
  }
};

/**
 * Exchanges an authorization code for an access token
 * @param provider - The OAuth provider name
 * @param code - The authorization code
 * @param redirectUri - The redirect URI used in the authorization request
 * @returns Access token and optional ID token
 */
const exchangeCodeForToken = async (
  provider: AuthProvider,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; id_token?: string; }> => {
  try {
    // Retrieve OAuth configuration for the provider
    const oauthConfig = getOAuthConfig(provider);

    // Prepare the token request parameters (grant_type, code, redirect_uri, client_id, client_secret)
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'; // Example: Google token endpoint
    const tokenParams = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret
    };

    // Send a POST request to the provider's token endpoint
    const response = await axios.post(tokenEndpoint, querystring.stringify(tokenParams), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Extract access_token and id_token from the response
    const { access_token, id_token } = response.data;

    // Return the tokens
    logger.info(`Token exchange successful for ${provider}`, { provider });
    return { access_token, id_token };
  } catch (error) {
    // Handle and log any errors that occur during token exchange
    logger.error(`Error exchanging code for token for ${provider}`, { error, provider, code });
    throw createError('Failed to exchange code for token', {
      code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
      isOperational: true,
      details: { provider, code }
    });
  }
};

/**
 * Fetches user profile information from an OAuth provider
 * @param provider - The OAuth provider name
 * @param accessToken - The access token
 * @param idToken - The ID token (optional)
 * @returns User profile information
 */
const fetchUserProfile = async (
  provider: AuthProvider,
  accessToken: string,
  idToken?: string
): Promise<any> => {
  try {
    // Determine the appropriate user info endpoint based on provider
    const userInfoEndpoint = 'https://www.googleapis.com/oauth2/v3/userinfo'; // Example: Google user info endpoint

    // Set up the request with Authorization header using the access token
    const headers = {
      Authorization: `Bearer ${accessToken}`
    };

    // Send a GET request to the provider's user info endpoint
    const response = await axios.get(userInfoEndpoint, { headers });

    // Extract profile from response data
    const profile = response.data;

    // Return the normalized user profile
    logger.info(`User profile fetched successfully from ${provider}`, { provider, profile });
    return normalizeProfile(provider, profile);
  } catch (error) {
    // Handle and log any errors that occur during profile fetching
    logger.error(`Error fetching user profile from ${provider}`, { error, provider, accessToken });
    throw createError('Failed to fetch user profile', {
      code: ErrorCodes.EXT_SERVICE_UNAVAILABLE,
      isOperational: true,
      details: { provider, accessToken }
    });
  }
};

/**
 * Normalizes user profile data from different OAuth providers
 * @param provider - The OAuth provider name
 * @param profile - The user profile data from the provider
 * @returns Normalized user profile
 */
const normalizeProfile = (provider: AuthProvider, profile: any): any => {
  // Create a base normalized profile object
  const normalizedProfile: any = {
    id: null,
    email: null,
    first_name: null,
    last_name: null,
    picture: null
  };

  // Apply provider-specific normalization rules
  switch (provider) {
    case AuthProvider.GOOGLE:
      normalizedProfile.id = profile.sub;
      normalizedProfile.email = profile.email;
      normalizedProfile.first_name = profile.given_name;
      normalizedProfile.last_name = profile.family_name;
      normalizedProfile.picture = profile.picture;
      break;
    case AuthProvider.MICROSOFT:
      normalizedProfile.id = profile.id;
      normalizedProfile.email = profile.userPrincipalName;
      normalizedProfile.first_name = profile.givenName;
      normalizedProfile.last_name = profile.surname;
      break;
    case AuthProvider.FACEBOOK:
      normalizedProfile.id = profile.id;
      normalizedProfile.email = profile.email;
      normalizedProfile.first_name = profile.first_name;
      normalizedProfile.last_name = profile.last_name;
      break;
    case AuthProvider.APPLE:
      normalizedProfile.id = profile.sub;
      normalizedProfile.email = profile.email;
      // Apple doesn't always provide first and last names separately
      if (profile.name) {
        normalizedProfile.first_name = profile.name.firstName;
        normalizedProfile.last_name = profile.name.lastName;
      }
      break;
    default:
      logger.warn(`Unknown OAuth provider: ${provider}`);
      break;
  }

  // Ensure all required fields are present in the normalized profile
  if (!normalizedProfile.id || !normalizedProfile.email || !normalizedProfile.first_name || !normalizedProfile.last_name) {
    logger.warn(`Missing required profile data from ${provider}`, { provider, profile, normalizedProfile });
    throw createError('Missing required profile data from OAuth provider', {
      code: ErrorCodes.EXT_INVALID_RESPONSE,
      isOperational: true,
      details: { provider, profile, normalizedProfile }
    });
  }

  // Return the normalized profile
  return normalizedProfile;
};

/**
 * Removes expired OAuth state parameters from storage
 */
const cleanupExpiredStates = (): void => {
  // Get current timestamp
  const now = new Date();

  // Define expiration threshold (typically 10-15 minutes)
  const expirationThreshold = 15 * 60 * 1000; // 15 minutes

  // Iterate through oauthStateStore entries
  oauthStateStore.forEach((value, key) => {
    // Remove entries older than the expiration threshold
    if (now.getTime() - value.createdAt.getTime() > expirationThreshold) {
      oauthStateStore.delete(key);
    }
  });

  // Log the cleanup operation
  logger.info(`Cleaned up expired OAuth states`, { count: oauthStateStore.size });
};