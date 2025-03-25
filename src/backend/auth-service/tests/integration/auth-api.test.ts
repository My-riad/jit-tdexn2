import supertest from 'supertest'; // supertest@^6.3.3
import { Server } from 'http'; // http@0.0.0
import { startServer } from '../../src/app';
import { User, UserProfile, AuthTokens, UserType, UserStatus, AuthProvider } from '../../../common/interfaces/user.interface';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { getUserByEmailService, createOAuthUser } from '../../src/services/user.service';
import { verifyMfaTokenService } from '../../src/services/auth.service';
import * as cookie from 'cookie'; // cookie@^0.5.0
import * as jwt from 'jsonwebtoken'; // jsonwebtoken@^9.0.1

// Mock user data for testing
const mockUserData = (overrides: Partial<User> = {}): User => ({
  user_id: 'test-user-id',
  email: 'test@example.com',
  password_hash: '$2b$12$EXAMPLE_HASH',
  first_name: 'Test',
  last_name: 'User',
  phone: '555-123-4567',
  user_type: UserType.DRIVER,
  status: UserStatus.ACTIVE,
  roles: [],
  carrier_id: null,
  shipper_id: null,
  driver_id: null,
  email_verified: true,
  verification_token: null,
  reset_token: null,
  reset_token_expires: null,
  mfa_enabled: false,
  mfa_secret: null,
  last_login: null,
  password_updated_at: new Date(),
  login_attempts: 0,
  locked_until: null,
  auth_provider: AuthProvider.LOCAL,
  auth_provider_id: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

// Mock user profile data for testing
const mockUserProfileData = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  user_id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: '555-123-4567',
  user_type: UserType.DRIVER,
  status: UserStatus.ACTIVE,
  roles: [],
  permissions: [],
  carrier_id: null,
  shipper_id: null,
  driver_id: null,
  email_verified: true,
  mfa_enabled: false,
  ...overrides,
});

// Jest mock setup
jest.mock('../../src/services/user.service', () => ({
  getUserByEmailService: jest.fn(),
  getUserProfileService: jest.fn(() => Promise.resolve(mockUserProfileData())),
  verifyMfaTokenService: jest.fn(),
}));

jest.mock('../../src/models/user.model', () => ({
  checkAccountLocked: jest.fn(() => Promise.resolve({ locked: false, lockedUntil: null })),
  incrementLoginAttempts: jest.fn(),
  resetLoginAttempts: jest.fn(),
  updateLastLogin: jest.fn(),
  createOAuthUser: jest.fn(),
}));

jest.mock('../../../common/utils/token.utils', () => ({
  generateTokenPair: jest.fn(() => ({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    idToken: 'test-id-token',
    expiresIn: 900,
    tokenType: 'Bearer',
  })),
  verifyRefreshToken: jest.fn(() => ({ user_id: 'test-user-id', jti: 'test-jti' })),
  blacklistToken: jest.fn(),
}));

jest.mock('../../src/models/token.model', () => ({
  saveToken: jest.fn(),
  revokeTokenByJti: jest.fn(),
  revokeAllUserTokens: jest.fn(),
}));

let server: Server;

// Setup test server instance with mocked dependencies
async function setupTestServer(): Promise<Server> {
  jest.clearAllMocks();
  const testServer = await startServer();
  return testServer;
}

// Teardown test server instance
async function teardownTestServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
  jest.restoreAllMocks();
}

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await teardownTestServer(server);
  });

  it('POST /api/v1/auth/login - should successfully authenticate a user with valid credentials', async () => {
    (getUserByEmailService as jest.Mock).mockResolvedValue(mockUserData());

    const response = await supertest(server)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('tokens');
    expect(response.body).toHaveProperty('user');
    expect(response.headers['set-cookie']).toBeDefined();
    expect(getUserByEmailService).toHaveBeenCalledWith('test@example.com');
  });

  it('POST /api/v1/auth/login - should return 401 when credentials are invalid', async () => {
    (getUserByEmailService as jest.Mock).mockResolvedValue(null);

    const response = await supertest(server)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe(ErrorCodes.AUTH_INVALID_CREDENTIALS);
    expect(getUserByEmailService).toHaveBeenCalledWith('test@example.com');
  });

  it('POST /api/v1/auth/login - should return 423 when account is locked', async () => {
    (getUserByEmailService as jest.Mock).mockResolvedValue(mockUserData({ status: UserStatus.LOCKED }));

    const response = await supertest(server)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    expect(response.statusCode).toBe(423);
    expect(response.body.code).toBe(ErrorCodes.AUTH_ACCOUNT_LOCKED);
    expect(getUserByEmailService).toHaveBeenCalledWith('test@example.com');
  });

  it('POST /api/v1/auth/login - should return 200 with mfaRequired flag when MFA is enabled', async () => {
    (getUserByEmailService as jest.Mock).mockResolvedValue(mockUserData({ mfa_enabled: true }));

    const response = await supertest(server)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    expect(response.statusCode).toBe(200);
    expect(response.body.mfaRequired).toBe(true);
    expect(response.body.tokens).toBeUndefined();
  });

  it('POST /api/v1/auth/verify-mfa - should successfully verify a valid MFA token', async () => {
    (verifyMfaTokenService as jest.Mock).mockResolvedValue(true);

    const response = await supertest(server)
      .post('/api/v1/auth/verify-mfa')
      .send({ userId: 'test-user-id', mfaToken: '123456' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('tokens');
    expect(verifyMfaTokenService).toHaveBeenCalledWith('test-user-id', '123456');
  });

  it('POST /api/v1/auth/verify-mfa - should return 401 when MFA token is invalid', async () => {
    (verifyMfaTokenService as jest.Mock).mockResolvedValue(false);

    const response = await supertest(server)
      .post('/api/v1/auth/verify-mfa')
      .send({ userId: 'test-user-id', mfaToken: 'invalid-token' });

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe(ErrorCodes.AUTH_INVALID_TOKEN);
    expect(verifyMfaTokenService).toHaveBeenCalledWith('test-user-id', 'invalid-token');
  });

  it('POST /api/v1/auth/refresh - should successfully refresh tokens with a valid refresh token', async () => {
    const response = await supertest(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refreshToken=test-refresh-token');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('tokens');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/v1/auth/refresh - should return 401 when refresh token is invalid', async () => {
    const response = await supertest(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-refresh-token' });

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe(ErrorCodes.AUTH_INVALID_TOKEN);
  });

  it('POST /api/v1/auth/logout - should successfully log out a user', async () => {
    const response = await supertest(server)
      .post('/api/v1/auth/logout')
      .set('Cookie', 'refreshToken=test-refresh-token');

    expect(response.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toEqual([
      'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ]);
  });

  it('POST /api/v1/auth/logout - should return 401 when refresh token is invalid', async () => {
    const response = await supertest(server)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'invalid-refresh-token' });

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe(ErrorCodes.AUTH_INVALID_TOKEN);
  });

  it('POST /api/v1/auth/logout-all - should successfully log out a user from all devices', async () => {
    const accessToken = jwt.sign({ user_id: 'test-user-id' }, 'test-secret');
    const response = await supertest(server)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toEqual([
      'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ]);
  });

  it('POST /api/v1/auth/logout-all - should return 401 when access token is invalid', async () => {
    const response = await supertest(server)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', 'Bearer invalid-access-token');

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe(ErrorCodes.AUTH_INVALID_TOKEN);
  });

  it('GET /api/v1/auth/validate - should successfully validate a valid access token', async () => {
    const accessToken = jwt.sign({ user_id: 'test-user-id' }, 'test-secret');
    const response = await supertest(server)
      .get('/api/v1/auth/validate')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('user');
  });

  it('GET /api/v1/auth/validate - should return 401 when access token is invalid', async () => {
    const response = await supertest(server)
      .get('/api/v1/auth/validate')
      .set('Authorization', 'Bearer invalid-access-token');

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe(ErrorCodes.AUTH_INVALID_TOKEN);
  });

  it('POST /api/v1/auth/oauth/login - should initiate OAuth authentication flow', async () => {
    const response = await supertest(server)
      .post('/api/v1/auth/oauth/initiate')
      .send({ provider: 'google', redirectUri: 'http://example.com/callback' });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
  });

  it('GET /api/v1/auth/oauth/callback/:provider - should handle successful OAuth callback', async () => {
    (getUserByEmailService as jest.Mock).mockResolvedValue(null);
    (createOAuthUser as jest.Mock).mockResolvedValue('new-user-id');

    const response = await supertest(server)
      .get('/api/v1/auth/oauth/callback/google')
      .query({ code: 'test-code', state: 'test-state' })
      .set('Cookie', 'oauthState=test-state');

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('accessToken=test-access-token');
    expect(response.headers.location).toContain('refreshToken=test-refresh-token');
    expect(response.headers.location).toContain('userId=test-user-id');
    expect(createOAuthUser).toHaveBeenCalled();
  });

  it('GET /api/v1/auth/oauth/callback/:provider - should handle OAuth error callback', async () => {
    const response = await supertest(server)
      .get('/api/v1/auth/oauth/callback/google')
      .query({ error: 'access_denied' });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('error=OAuth authentication failed: access_denied');
  });
});