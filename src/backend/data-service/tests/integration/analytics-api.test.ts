import supertest from 'supertest'; // supertest@^6.3.3
import mongoose from 'mongoose'; // mongoose@^7.0.0
import jwt from 'jsonwebtoken'; // jsonwebtoken@^9.0.0
import { app } from '../../src/app';
import { AnalyticsQuery, IAnalyticsQuery, AnalyticsQueryType } from '../../src/models/analytics-query.model';
import { connectDatabase, disconnectDatabase } from '../../../common/config/database.config';

// Define a type for the mock analytics query object
type MockAnalyticsQuery = Partial<IAnalyticsQuery>;

/**
 * Creates a mock analytics query object for testing
 * @param overrides - Optional overrides for the default values
 * @returns Mock analytics query object
 */
const createMockAnalyticsQuery = (overrides: MockAnalyticsQuery = {}): IAnalyticsQuery => {
  // Create a base analytics query object with default values
  const baseQuery: IAnalyticsQuery = {
    name: 'Test Query',
    description: 'A test analytics query',
    type: AnalyticsQueryType.EFFICIENCY,
    collection: 'load_assignments',
    fields: [{ field: 'load_id' }, { field: 'driver_id' }],
    createdBy: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Merge any provided overrides into the base object
  return { ...baseQuery, ...overrides } as IAnalyticsQuery;
};

describe('Analytics API Integration Tests', () => {
  const request = supertest(app);
  const jwtSecret = process.env.JWT_SECRET || 'development_secret_key';
  const jwtIssuer = process.env.JWT_ISSUER || 'freight-optimization-platform';
  const jwtAudience = process.env.JWT_AUDIENCE || 'freight-optimization-api';

  let authToken: string;

  beforeAll(async () => {
    await connectDatabase();

    // Create a test token for authentication
    authToken = jwt.sign({ sub: 'test-user', roles: ['admin'] }, jwtSecret, {
      issuer: jwtIssuer,
      audience: jwtAudience,
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    // Clean up the database after each test
    await AnalyticsQuery.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect from the database after all tests are done
    await disconnectDatabase();
  });

  describe('Analytics Query Management', () => {
    it('POST /api/analytics/queries - should create a new analytics query', async () => {
      // Create a mock analytics query object
      const mockQuery = createMockAnalyticsQuery();

      // Send a POST request to /api/analytics/queries with the mock query
      const response = await request
        .post('/api/v1/analytics/queries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockQuery);

      // Expect a 201 status code
      expect(response.status).toBe(201);

      // Expect the response body to contain the created query with an ID
      expect(response.body).toHaveProperty('name', mockQuery.name);
      expect(response.body).toHaveProperty('type', mockQuery.type);
      expect(response.body).toHaveProperty('collection', mockQuery.collection);
      expect(response.body).toHaveProperty('_id');

      // Verify the query was saved to the database
      const savedQuery = await AnalyticsQuery.findById(response.body._id).lean();
      expect(savedQuery).toBeTruthy();
      expect(savedQuery?.name).toBe(mockQuery.name);
    });

    it('POST /api/analytics/queries - should return 400 for invalid query data', async () => {
      // Create an invalid analytics query object missing required fields
      const invalidQuery = { description: 'Invalid query' };

      // Send a POST request to /api/analytics/queries with the invalid query
      const response = await request
        .post('/api/v1/analytics/queries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidQuery);

      // Expect a 400 status code
      expect(response.status).toBe(400);

      // Expect the response body to contain validation error details
      expect(response.body).toHaveProperty('code', 'VAL_INVALID_INPUT');
      expect(response.body).toHaveProperty('message', 'Invalid request body');
      expect(response.body).toHaveProperty('details');
    });

    it('GET /api/analytics/queries/:id - should retrieve an analytics query by ID', async () => {
      // Create and save a mock analytics query to the database
      const mockQuery = createMockAnalyticsQuery();
      const savedQuery = await new AnalyticsQuery(mockQuery).save();

      // Send a GET request to /api/analytics/queries/:id with the query ID
      const response = await request
        .get(`/api/v1/analytics/queries/${savedQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to match the saved query
      expect(response.body).toHaveProperty('name', mockQuery.name);
      expect(response.body).toHaveProperty('type', mockQuery.type);
      expect(response.body).toHaveProperty('collection', mockQuery.collection);
    });

    it('GET /api/analytics/queries/:id - should return 404 for non-existent query', async () => {
      // Send a GET request to /api/analytics/queries/:id with a non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId().toHexString();
      const response = await request
        .get(`/api/v1/analytics/queries/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 404 status code
      expect(response.status).toBe(404);

      // Expect the response body to contain an error message
      expect(response.body).toHaveProperty('message', 'Analytics query not found');
    });

    it('GET /api/analytics/queries - should retrieve analytics queries with filters', async () => {
      // Create and save multiple mock analytics queries with different types
      const mockQuery1 = createMockAnalyticsQuery({ name: 'Query 1', type: AnalyticsQueryType.EFFICIENCY });
      const mockQuery2 = createMockAnalyticsQuery({ name: 'Query 2', type: AnalyticsQueryType.FINANCIAL });
      await AnalyticsQuery.insertMany([mockQuery1, mockQuery2]);

      // Send a GET request to /api/analytics/queries with filter parameters
      const response = await request
        .get('/api/v1/analytics/queries?type=EFFICIENCY')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain only queries matching the filters
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe(mockQuery1.name);
      expect(response.body[0].type).toBe(mockQuery1.type);
    });

    it('PUT /api/analytics/queries/:id - should update an analytics query', async () => {
      // Create and save a mock analytics query to the database
      const mockQuery = createMockAnalyticsQuery();
      const savedQuery = await new AnalyticsQuery(mockQuery).save();

      // Create update data for the query
      const updateData = { name: 'Updated Query Name', description: 'Updated description' };

      // Send a PUT request to /api/analytics/queries/:id with the update data
      const response = await request
        .put(`/api/v1/analytics/queries/${savedQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the updated query
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('description', updateData.description);

      // Verify the query was updated in the database
      const updatedQuery = await AnalyticsQuery.findById(savedQuery._id).lean();
      expect(updatedQuery).toBeTruthy();
      expect(updatedQuery?.name).toBe(updateData.name);
      expect(updatedQuery?.description).toBe(updateData.description);
    });

    it('PUT /api/analytics/queries/:id - should return 404 for non-existent query', async () => {
      // Send a PUT request to /api/analytics/queries/:id with a non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId().toHexString();
      const updateData = { name: 'Updated Query Name' };
      const response = await request
        .put(`/api/v1/analytics/queries/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Expect a 404 status code
      expect(response.status).toBe(404);

      // Expect the response body to contain an error message
      expect(response.body).toHaveProperty('message', 'Analytics query not found');
    });

    it('DELETE /api/analytics/queries/:id - should delete an analytics query', async () => {
      // Create and save a mock analytics query to the database
      const mockQuery = createMockAnalyticsQuery();
      const savedQuery = await new AnalyticsQuery(mockQuery).save();

      // Send a DELETE request to /api/analytics/queries/:id with the query ID
      const response = await request
        .delete(`/api/v1/analytics/queries/${savedQuery._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 204 status code
      expect(response.status).toBe(204);

      // Verify the query was removed from the database
      const deletedQuery = await AnalyticsQuery.findById(savedQuery._id).lean();
      expect(deletedQuery).toBeFalsy();
    });

    it('DELETE /api/analytics/queries/:id - should return 404 for non-existent query', async () => {
      // Send a DELETE request to /api/analytics/queries/:id with a non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId().toHexString();
      const response = await request
        .delete(`/api/v1/analytics/queries/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 404 status code
      expect(response.status).toBe(404);

      // Expect the response body to contain an error message
      expect(response.body).toHaveProperty('message', 'Analytics query not found');
    });
  });

  describe('Analytics Query Execution', () => {
    it('POST /api/analytics/queries/:id/execute - should execute an analytics query', async () => {
      // Create and save a mock analytics query to the database
      const mockQuery = createMockAnalyticsQuery();
      const savedQuery = await new AnalyticsQuery(mockQuery).save();

      // Mock the data warehouse service to return test results
      // TODO: Implement mocking for data warehouse service

      // Send a POST request to /api/analytics/queries/:id/execute with parameters
      const response = await request
        .post(`/api/v1/analytics/queries/${savedQuery._id}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the query results
      // TODO: Add more specific expectations for the query results
      expect(response.body).toBeInstanceOf(Array);
    });

    it('POST /api/analytics/queries/:id/execute - should return 404 for non-existent query', async () => {
      // Send a POST request to /api/analytics/queries/:id/execute with a non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId().toHexString();
      const response = await request
        .post(`/api/v1/analytics/queries/${nonExistentId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Expect a 404 status code
      expect(response.status).toBe(404);

      // Expect the response body to contain an error message
      expect(response.body).toHaveProperty('message', 'Analytics query not found');
    });

    it('POST /api/analytics/execute - should execute an analytics query definition', async () => {
      // Create a mock analytics query definition
      const mockQuery = createMockAnalyticsQuery();

      // Mock the data warehouse service to return test results
      // TODO: Implement mocking for data warehouse service

      // Send a POST request to /api/analytics/execute with the query definition
      const response = await request
        .post('/api/v1/analytics/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ queryDefinition: mockQuery });

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the query results
      // TODO: Add more specific expectations for the query results
      expect(response.body).toBeInstanceOf(Array);
    });

    it('POST /api/analytics/execute - should return 400 for invalid query definition', async () => {
      // Create an invalid analytics query definition missing required fields
      const invalidQuery = { description: 'Invalid query' };

      // Send a POST request to /api/analytics/execute with the invalid definition
      const response = await request
        .post('/api/v1/analytics/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ queryDefinition: invalidQuery });

      // Expect a 400 status code
      expect(response.status).toBe(400);

      // Expect the response body to contain validation error details
      expect(response.body).toHaveProperty('code', 'VAL_INVALID_INPUT');
      expect(response.body).toHaveProperty('message', 'Invalid request body');
      expect(response.body).toHaveProperty('details');
    });

    it('POST /api/analytics/predefined/:type/:name/execute - should execute a predefined query', async () => {
      // Mock the analytics service to return test results for a predefined query
      // TODO: Implement mocking for analytics service

      // Send a POST request to /api/analytics/predefined/:type/:name/execute with parameters
      const response = await request
        .post('/api/v1/analytics/predefined/EFFICIENCY/test_predefined_query/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the query results
      // TODO: Add more specific expectations for the query results
      expect(response.body).toBeInstanceOf(Array);
    });

    it('POST /api/analytics/predefined/:type/:name/execute - should return 404 for non-existent predefined query', async () => {
      // Send a POST request to /api/analytics/predefined/:type/:name/execute with a non-existent query name
      const response = await request
        .post('/api/v1/analytics/predefined/EFFICIENCY/non_existent_query/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Expect a 404 status code
      expect(response.status).toBe(404);

      // Expect the response body to contain an error message
      expect(response.body).toHaveProperty('message', 'Predefined query not found');
    });
  });

  describe('Analytics Metrics Endpoints', () => {
    it('GET /api/analytics/metrics/efficiency - should retrieve efficiency metrics', async () => {
      // Mock the analytics service to return test efficiency metrics
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/metrics/efficiency with parameters
      const response = await request
        .get('/api/v1/analytics/metrics/efficiency')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the efficiency metrics
      // TODO: Add more specific expectations for the efficiency metrics
      expect(response.body).toBeInstanceOf(Object);
    });

    it('GET /api/analytics/metrics/driver - should retrieve driver metrics', async () => {
      // Mock the analytics service to return test driver metrics
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/metrics/driver with parameters
      const response = await request
        .get('/api/v1/analytics/metrics/driver')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the driver metrics
      // TODO: Add more specific expectations for the driver metrics
      expect(response.body).toBeInstanceOf(Object);
    });

    it('GET /api/analytics/metrics/financial - should retrieve financial metrics', async () => {
      // Mock the analytics service to return test financial metrics
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/metrics/financial with parameters
      const response = await request
        .get('/api/v1/analytics/metrics/financial')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the financial metrics
      // TODO: Add more specific expectations for the financial metrics
      expect(response.body).toBeInstanceOf(Object);
    });

    it('GET /api/analytics/metrics/operational - should retrieve operational metrics', async () => {
      // Mock the analytics service to return test operational metrics
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/metrics/operational with parameters
      const response = await request
        .get('/api/v1/analytics/metrics/operational')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the operational metrics
      // TODO: Add more specific expectations for the operational metrics
      expect(response.body).toBeInstanceOf(Object);
    });

    it('GET /api/analytics/metrics/dashboard - should retrieve dashboard metrics', async () => {
      // Mock the analytics service to return test dashboard metrics
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/metrics/dashboard with parameters
      const response = await request
        .get('/api/v1/analytics/metrics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain all dashboard metrics categories
      // TODO: Add more specific expectations for the dashboard metrics
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty('efficiency');
      expect(response.body).toHaveProperty('driver');
      expect(response.body).toHaveProperty('financial');
      expect(response.body).toHaveProperty('operational');
    });
  });

  describe('Specialized Analytics Endpoints', () => {
    it('GET /api/analytics/network-efficiency-trend - should retrieve network efficiency trend data', async () => {
      // Mock the analytics service to return test trend data
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/network-efficiency-trend with parameters
      const response = await request
        .get('/api/v1/analytics/network-efficiency-trend')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the trend data
      // TODO: Add more specific expectations for the trend data
      expect(response.body).toBeInstanceOf(Array);
    });

    it('GET /api/analytics/empty-miles-reduction - should retrieve empty miles reduction metrics', async () => {
      // Mock the analytics service to return test reduction metrics
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/empty-miles-reduction with parameters
      const response = await request
        .get('/api/v1/analytics/empty-miles-reduction')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the reduction metrics
      // TODO: Add more specific expectations for the reduction metrics
      expect(response.body).toBeInstanceOf(Object);
    });

    it('GET /api/analytics/driver-efficiency-distribution - should retrieve driver efficiency distribution', async () => {
      // Mock the analytics service to return test distribution data
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/driver-efficiency-distribution with parameters
      const response = await request
        .get('/api/v1/analytics/driver-efficiency-distribution')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the distribution data
      // TODO: Add more specific expectations for the distribution data
      expect(response.body).toBeInstanceOf(Array);
    });

    it('GET /api/analytics/smart-hub-utilization - should retrieve Smart Hub utilization metrics', async () => {
      // Mock the analytics service to return test utilization metrics
      // TODO: Implement mocking for analytics service

      // Send a GET request to /api/analytics/smart-hub-utilization with parameters
      const response = await request
        .get('/api/v1/analytics/smart-hub-utilization')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect a 200 status code
      expect(response.status).toBe(200);

      // Expect the response body to contain the utilization metrics
      // TODO: Add more specific expectations for the utilization metrics
      expect(response.body).toBeInstanceOf(Object);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all analytics endpoints', async () => {
      // Send requests to various analytics endpoints without authentication
      const endpoints = [
        { method: 'post', url: '/api/v1/analytics/queries' },
        { method: 'get', url: '/api/v1/analytics/queries/123' },
        { method: 'get', url: '/api/v1/analytics/queries' },
        { method: 'put', url: '/api/v1/analytics/queries/123' },
        { method: 'delete', url: '/api/v1/analytics/queries/123' },
        { method: 'post', url: '/api/v1/analytics/queries/123/execute' },
        { method: 'post', url: '/api/v1/analytics/execute' },
        { method: 'get', url: '/api/v1/analytics/metrics/efficiency' },
      ];

      for (const endpoint of endpoints) {
        const response = await request[endpoint.method](endpoint.url);

        // Expect 401 status codes for all requests
        expect(response.status).toBe(401);

        // Expect response bodies to contain authentication error messages
        expect(response.body).toHaveProperty('code', 'AUTH_MISSING_TOKEN');
      }
    });

    it('should require appropriate permissions for analytics operations', async () => {
      // Create test tokens with different permission levels
      const unauthorizedToken = jwt.sign({ sub: 'test-user', roles: ['driver'] }, jwtSecret, {
        issuer: jwtIssuer,
        audience: jwtAudience,
        expiresIn: '1h',
      });

      // Send requests to analytics endpoints with tokens lacking required permissions
      const endpoints = [
        { method: 'post', url: '/api/v1/analytics/queries' },
        { method: 'put', url: '/api/v1/analytics/queries/123' },
        { method: 'delete', url: '/api/v1/analytics/queries/123' },
      ];

      for (const endpoint of endpoints) {
        const response = await request[endpoint.method](endpoint.url)
          .set('Authorization', `Bearer ${unauthorizedToken}`);

        // Expect 403 status codes for unauthorized operations
        expect(response.status).toBe(403);

        // Expect response bodies to contain authorization error messages
        expect(response.body).toHaveProperty('code', 'AUTHZ_INSUFFICIENT_PERMISSIONS');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database operations to throw errors
      jest.spyOn(AnalyticsQuery, 'find').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Send requests to endpoints that would trigger these errors
      const response = await request
        .get('/api/v1/analytics/queries')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect appropriate error status codes (typically 500)
      expect(response.status).toBe(500);

      // Expect response bodies to contain error details without exposing sensitive information
      expect(response.body).toHaveProperty('code', 'SRV_INTERNAL_ERROR');

      // Restore the original implementation
      jest.restoreAllMocks();
    });

    it('should handle validation errors with descriptive messages', async () => {
      // Send requests with invalid data to various endpoints
      const invalidQuery = { name: 123 }; // Invalid name type
      const response = await request
        .post('/api/v1/analytics/queries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidQuery);

      // Expect 400 status codes
      expect(response.status).toBe(400);

      // Expect response bodies to contain specific validation error details
      expect(response.body).toHaveProperty('code', 'VAL_INVALID_INPUT');
      expect(response.body).toHaveProperty('details');
    });
  });
});