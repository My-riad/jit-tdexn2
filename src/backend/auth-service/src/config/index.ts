/**
 * Authentication Service Configuration
 * 
 * This module provides centralized access to authentication-specific settings and
 * re-exports common configuration utilities. It serves as the main entry point for
 * accessing authentication configuration settings including JWT secrets, token lifetimes,
 * MFA settings, and OAuth provider configurations.
 */

import {
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION
} from '../../common/config/environment.config';

import logger from '../../common/utils/logger';

// JWT Configuration
export const JWT_SECRET = requireEnv('JWT_SECRET');
export const JWT_ACCESS_EXPIRATION = getEnvNumber('JWT_ACCESS_EXPIRATION', 15 * 60); // 15 minutes in seconds
export const JWT_REFRESH_EXPIRATION = getEnvNumber('JWT_REFRESH_EXPIRATION', 7 * 24 * 60 * 60); // 7 days in seconds

// Security Settings
export const ENABLE_MFA = getEnvBoolean('ENABLE_MFA', false);
export const MAX_LOGIN_ATTEMPTS = getEnvNumber('MAX_LOGIN_ATTEMPTS', 5);
export const LOCKOUT_TIME = getEnvNumber('LOCKOUT_TIME', 15 * 60); // 15 minutes in seconds
export const PASSWORD_RESET_EXPIRATION = getEnvNumber('PASSWORD_RESET_EXPIRATION', 24 * 60 * 60); // 24 hours in seconds
export const EMAIL_VERIFICATION_EXPIRATION = getEnvNumber('EMAIL_VERIFICATION_EXPIRATION', 7 * 24 * 60 * 60); // 7 days in seconds
export const MAX_CONCURRENT_SESSIONS = getEnvNumber('MAX_CONCURRENT_SESSIONS', 5);

/**
 * Initializes authentication configuration and validates required settings
 * 
 * @throws Error if required environment variables are missing
 */
export const initializeAuthConfig = (): void => {
  try {
    // Load environment configuration
    loadEnvConfig();
    
    // Validate that JWT_SECRET is properly set
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      throw new Error(
        'JWT_SECRET is either not set or too short. It should be at least 32 characters long for security.'
      );
    }
    
    logger.info('Authentication configuration initialized', {
      environment: NODE_ENV,
      mfaEnabled: ENABLE_MFA,
      accessTokenLifetime: JWT_ACCESS_EXPIRATION,
      refreshTokenLifetime: JWT_REFRESH_EXPIRATION
    });
  } catch (error) {
    logger.error('Failed to initialize authentication configuration', { error });
    throw error;
  }
};

/**
 * Returns the current authentication configuration settings
 * 
 * @returns Authentication configuration object
 */
export const getAuthConfig = () => {
  return {
    jwtSecret: JWT_SECRET,
    jwtAccessExpiration: JWT_ACCESS_EXPIRATION,
    jwtRefreshExpiration: JWT_REFRESH_EXPIRATION,
    enableMfa: ENABLE_MFA,
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
    lockoutTime: LOCKOUT_TIME,
    passwordResetExpiration: PASSWORD_RESET_EXPIRATION,
    emailVerificationExpiration: EMAIL_VERIFICATION_EXPIRATION,
    maxConcurrentSessions: MAX_CONCURRENT_SESSIONS,
    isProduction: IS_PRODUCTION
  };
};

/**
 * Returns OAuth provider configuration for a specific provider
 * 
 * @param provider - The OAuth provider name (e.g., 'google', 'microsoft', 'facebook')
 * @returns OAuth provider configuration including client ID, secret, and redirect URI
 * @throws Error if provider configuration is incomplete
 */
export const getOAuthConfig = (provider: string) => {
  const normalizedProvider = provider.toLowerCase().trim();
  
  // Client ID and Secret naming convention in environment variables:
  // OAUTH_GOOGLE_CLIENT_ID, OAUTH_GOOGLE_CLIENT_SECRET, etc.
  const clientId = getEnv(`OAUTH_${normalizedProvider.toUpperCase()}_CLIENT_ID`);
  const clientSecret = getEnv(`OAUTH_${normalizedProvider.toUpperCase()}_CLIENT_SECRET`);
  const redirectUri = getEnv(`OAUTH_${normalizedProvider.toUpperCase()}_REDIRECT_URI`);
  
  // Get scopes with appropriate defaults based on provider
  let defaultScopes = 'profile email';
  if (normalizedProvider === 'microsoft') {
    defaultScopes = 'openid profile email User.Read';
  } else if (normalizedProvider === 'facebook') {
    defaultScopes = 'public_profile email';
  }
  
  const scopes = getEnv(`OAUTH_${normalizedProvider.toUpperCase()}_SCOPES`, defaultScopes);
  
  // Validate configuration
  if (!clientId || !clientSecret || !redirectUri) {
    const error = new Error(`Incomplete OAuth configuration for provider: ${provider}`);
    logger.error('Missing required OAuth configuration', { 
      provider,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
      error
    });
    throw error;
  }
  
  return {
    provider: normalizedProvider,
    clientId,
    clientSecret,
    redirectUri,
    scopes: scopes.split(' ')
  };
};