import supertest from 'supertest'; // supertest@^6.3.3
import { Express } from 'express';
import { app } from '../../src/app';
import { ServiceRegistry } from '../../src/config/service-registry';
import { SERVICES } from '../../src/config';

// Mock the service registry to control service health status
jest.mock('../../src/config/service-registry', () => ({
  ServiceRegistry: {
    getServiceInstance: jest.fn(),
    initializeServiceRegistry: jest.fn(),
    checkServiceHealth: jest.fn(),
    getAllServicesHealth: jest.fn()
  }
}));

describe('API Gateway Health Endpoints', () => {
  let request: supertest.SuperTest<supertest.Test>;
  const originalEnv = process.env;

  beforeAll(() => {
    request = supertest(app);
    // Mock the version environment variable
    process.env.npm_package_version = '1.0.0-test';
  });

  beforeEach(() => {
    // Clear the cache before each test
    (ServiceRegistry as any).__SERVICE_HEALTH_CACHE = new Map();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('GET /health should return API Gateway health status', async () => {
    const response = await request.get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'UP',
        timestamp: expect.any(String),
        name: 'api-gateway',
        details: expect.objectContaining({
          version: '1.0.0-test',
          environment: expect.any(String),
          basePath: '/api/v1',
          host: '0.0.0.0',
          port: 3000
        })
      })
    );
  });

  it('GET /health/services should return all services health status', async () => {
    const mockGetAllServicesHealth = jest.fn().mockResolvedValue({
      'auth-service': true,
      'driver-service': true
    });
    (ServiceRegistry.getAllServicesHealth as jest.Mock)
      .mockImplementation(mockGetAllServicesHealth);

    const response = await request.get('/health/services');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'UP',
        timestamp: expect.any(String),
        name: 'platform-services',
        services: {
          'auth-service': { status: 'UP' },
          'driver-service': { status: 'UP' }
        }
      })
    );
    expect(mockGetAllServicesHealth).toHaveBeenCalledTimes(1);
  });

  it('GET /health/services should return 503 when critical services are down', async () => {
    const mockGetAllServicesHealth = jest.fn().mockResolvedValue({
      'auth-service': false,
      'driver-service': true
    });
    (ServiceRegistry.getAllServicesHealth as jest.Mock)
      .mockImplementation(mockGetAllServicesHealth);

    const response = await request.get('/health/services');
    expect(response.status).toBe(503);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'DOWN',
        timestamp: expect.any(String),
        name: 'platform-services',
        services: {
          'auth-service': { status: 'DOWN' },
          'driver-service': { status: 'UP' }
        }
      })
    );
  });

  it('GET /health/services/:service should return specific service health', async () => {
    const mockCheckServiceHealth = jest.fn().mockResolvedValue(true);
    (ServiceRegistry.checkServiceHealth as jest.Mock)
      .mockImplementation(mockCheckServiceHealth);

    const response = await request.get('/health/services/auth-service');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'UP',
        timestamp: expect.any(String),
        name: 'auth-service',
        details: {
          status: 'UP'
        }
      })
    );
    expect(mockCheckServiceHealth).toHaveBeenCalledWith('auth-service');
  });

  it('GET /health/services/:service should return 503 when service is down', async () => {
    const mockCheckServiceHealth = jest.fn().mockResolvedValue(false);
    (ServiceRegistry.checkServiceHealth as jest.Mock)
      .mockImplementation(mockCheckServiceHealth);

    const response = await request.get('/health/services/auth-service');
    expect(response.status).toBe(503);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'DOWN',
        timestamp: expect.any(String),
        name: 'auth-service',
        details: {
          status: 'DOWN'
        }
      })
    );
    expect(mockCheckServiceHealth).toHaveBeenCalledWith('auth-service');
  });

  it('GET /health/services/:service should return 404 for unknown service', async () => {
    const response = await request.get('/health/services/unknown-service');
    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'RES_ROUTE_NOT_FOUND',
        message: "Service 'unknown-service' not found",
        statusCode: 404
      })
    );
  });

  it('Health endpoints should use caching for repeated requests', async () => {
    const mockGetAllServicesHealth = jest.fn().mockResolvedValue({
      'auth-service': true,
      'driver-service': true
    });
    (ServiceRegistry.getAllServicesHealth as jest.Mock)
      .mockImplementation(mockGetAllServicesHealth);

    const response1 = await request.get('/health/services');
    const response2 = await request.get('/health/services');

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(mockGetAllServicesHealth).toHaveBeenCalledTimes(1);
    expect(response1.body).toEqual(response2.body);
  });

  it('Health cache should expire after TTL period', async () => {
    const mockGetAllServicesHealth = jest.fn().mockResolvedValue({
      'auth-service': true,
      'driver-service': true
    });
    (ServiceRegistry.getAllServicesHealth as jest.Mock)
      .mockImplementation(mockGetAllServicesHealth);

    const response1 = await request.get('/health/services');

    // Mock timer to advance beyond cache TTL
    jest.advanceTimersByTime(30001);

    const response2 = await request.get('/health/services');

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(mockGetAllServicesHealth).toHaveBeenCalledTimes(2);
    expect(response1.body).not.toEqual(response2.body);
  });
});