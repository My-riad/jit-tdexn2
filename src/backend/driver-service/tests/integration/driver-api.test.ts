import supertest from 'supertest'; // supertest@^6.3.3
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { appInstance as app } from '../../src/app';
import { Driver, DriverStatus, DriverCreationParams } from '../../../common/interfaces/driver.interface';
import { LicenseClass, LicenseEndorsement } from '../../../common/interfaces/driver.interface';
import { getKnexInstance, closeKnexConnection } from '../../../common/config/database.config';
import { Knex } from 'knex';
import logger from '../../../common/utils/logger';

// Define a type for the request object for better type safety
const request = supertest(app);

// Jest hook that runs before all tests in a describe block
beforeAll(async () => {
  await setupTestDatabase();
});

// Jest hook that runs after all tests in a describe block
afterAll(async () => {
  await cleanupTestDatabase();
});

// Jest hook that runs before each test in a describe block
beforeEach(() => {
  // Clear mocks, reset any data if needed
});

// Jest hook that runs after each test in a describe block
afterEach(() => {
  // Clean up after each test
});

/**
 * Sets up the test database with initial data
 */
async function setupTestDatabase(): Promise<void> {
  // LD1: Get database connection using getKnexInstance
  const knex = getKnexInstance();

  try {
    // LD2: Clear existing test data from relevant tables
    await knex('drivers').del();
    await knex('carriers').del();
    await knex('users').del();
    await knex('vehicles').del();

    // LD3: Insert mock carrier data for testing
    const carrierId = uuidv4();
    await knex('carriers').insert({
      carrier_id: carrierId,
      name: 'Test Carrier',
      dot_number: '1234567',
      mc_number: '7654321',
      tax_id: '987654321',
      address: { street1: '123 Main St', city: 'Anytown', state: 'CA', postal_code: '91234', country: 'US' },
      contact_info: { name: 'John Doe', phone: '555-123-4567', email: 'john.doe@example.com' },
      created_at: new Date(),
      updated_at: new Date(),
      active: true
    });

  } catch (error) {
    logger.error('Error setting up test database', { error });
    throw error;
  }
}

/**
 * Cleans up the test database after tests
 */
async function cleanupTestDatabase(): Promise<void> {
  // LD1: Get database connection using getKnexInstance
  const knex = getKnexInstance();

  try {
    // LD2: Delete test data from all relevant tables
    await knex('drivers').del();
    await knex('carriers').del();
    await knex('users').del();
    await knex('vehicles').del();

    // LD3: Close database connection
    await closeKnexConnection();
  } catch (error) {
    logger.error('Error cleaning up test database', { error });
    throw error;
  }
}

/**
 * Generates test driver data with unique identifiers
 */
function generateTestDriver(overrides: Partial<DriverCreationParams> = {}): DriverCreationParams {
  // LD1: Create base driver data
  const baseDriverData: Omit<DriverCreationParams, 'user_id' | 'email' | 'phone' | 'license_number'> = {
    carrier_id: uuidv4(),
    first_name: 'Test',
    last_name: 'Driver',
    license_state: 'CA',
    license_class: LicenseClass.CLASS_A,
    license_endorsements: [LicenseEndorsement.HAZMAT],
    license_expiration: new Date(new Date().setDate(new Date().getDate() + 365)),
    home_address: { street1: '123 Test St', city: 'Test City', state: 'CA', postal_code: '90210', country: 'US' },
    eld_device_id: 'ELD123',
    eld_provider: 'KeepTruckin'
  };

  // LD2: Generate unique identifiers (user_id, email, phone, license_number)
  const userId = uuidv4();
  const email = `test${userId}@example.com`;
  const phone = '555-123-4567';
  const licenseNumber = `L${userId.substring(0, 8)}`;

  // LD3: Apply any provided overrides to the data
  const driverData: DriverCreationParams = {
    user_id: userId,
    email: email,
    phone: phone,
    license_number: licenseNumber,
    ...baseDriverData,
    ...overrides
  };

  // LD4: Return the customized driver creation parameters
  return driverData;
}

describe('Driver API Integration Tests', () => {
  it('GET /api/drivers/:driverId - Should retrieve a driver by ID', async () => {
    // LD1: Create a test driver in the database
    const driverData = generateTestDriver();
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const driverId = createResponse.body.driver_id;

    // LD2: Send GET request to /api/drivers/:driverId
    const response = await request.get(`/drivers/${driverId}`);

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains correct driver data
    expect(response.body.driver_id).toBe(driverId);
    expect(response.body.first_name).toBe(driverData.first_name);
  });

  it('GET /api/drivers/user/:userId - Should retrieve a driver by user ID', async () => {
    // LD1: Create a test driver in the database
    const driverData = generateTestDriver();
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const userId = createResponse.body.user_id;

    // LD2: Send GET request to /api/drivers/user/:userId
    const response = await request.get(`/drivers/user/${userId}`);

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains correct driver data
    expect(response.body.user_id).toBe(userId);
    expect(response.body.first_name).toBe(driverData.first_name);
  });

  it('GET /api/drivers/carrier/:carrierId - Should retrieve all drivers for a carrier', async () => {
    // LD1: Create multiple test drivers for the same carrier
    const carrierId = uuidv4();
    const driverData1 = generateTestDriver({ carrier_id: carrierId });
    const driverData2 = generateTestDriver({ carrier_id: carrierId, email: 'test2@example.com' });
    await request.post('/drivers').send(driverData1);
    await request.post('/drivers').send(driverData2);

    // LD2: Send GET request to /api/drivers/carrier/:carrierId
    const response = await request.get(`/drivers/carrier/${carrierId}`);

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains array of drivers
    expect(Array.isArray(response.body)).toBe(true);

    // LD5: Verify all returned drivers belong to the specified carrier
    response.body.forEach((driver: Driver) => {
      expect(driver.carrier_id).toBe(carrierId);
    });
  });

  it('GET /api/drivers/:driverId/details - Should retrieve a driver with all details', async () => {
    // LD1: Create a test driver with related data in the database
    const driverData = generateTestDriver();
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const driverId = createResponse.body.driver_id;

    // LD2: Send GET request to /api/drivers/:driverId/details
    const response = await request.get(`/drivers/${driverId}/details`);

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains driver with all related details
    expect(response.body.driver_id).toBe(driverId);
    expect(response.body.first_name).toBe(driverData.first_name);
    // Add more assertions to check related details (carrier, preferences, etc.)
  });

  it('POST /api/drivers - Should create a new driver', async () => {
    // LD1: Generate test driver creation data
    const driverData = generateTestDriver();

    // LD2: Send POST request to /api/drivers with driver data
    const response = await request.post('/drivers').send(driverData);

    // LD3: Verify 201 status code
    expect(response.status).toBe(201);

    // LD4: Verify response body contains created driver with correct data
    expect(response.body.first_name).toBe(driverData.first_name);
    expect(response.body.email).toBe(driverData.email);

    // LD5: Verify driver exists in database
    const knex = getKnexInstance();
    const driver = await knex('drivers').where({ driver_id: response.body.driver_id }).first();
    expect(driver).toBeDefined();
  });

  it('POST /api/drivers - validation error - Should return 400 for invalid driver data', async () => {
    // LD1: Generate invalid driver data (missing required fields)
    const invalidDriverData = {
      first_name: 'Test',
      last_name: 'Driver',
    };

    // LD2: Send POST request to /api/drivers with invalid data
    const response = await request.post('/api/drivers').send(invalidDriverData);

    // LD3: Verify 400 status code
    expect(response.status).toBe(400);

    // LD4: Verify response body contains validation error details
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.details).toBeDefined();
  });

  it('PUT /api/drivers/:driverId - Should update an existing driver', async () => {
    // LD1: Create a test driver in the database
    const driverData = generateTestDriver();
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const driverId = createResponse.body.driver_id;

    // LD2: Generate driver update data
    const updateData = {
      first_name: 'Updated',
      last_name: 'DriverName',
    };

    // LD3: Send PUT request to /api/drivers/:driverId with update data
    const response = await request.put(`/drivers/${driverId}`).send(updateData);

    // LD4: Verify 200 status code
    expect(response.status).toBe(200);

    // LD5: Verify response body contains updated driver with correct data
    expect(response.body.driver_id).toBe(driverId);
    expect(response.body.first_name).toBe(updateData.first_name);
    expect(response.body.last_name).toBe(updateData.last_name);

    // LD6: Verify driver is updated in database
    const knex = getKnexInstance();
    const updatedDriver = await knex('drivers').where({ driver_id: driverId }).first();
    expect(updatedDriver.first_name).toBe(updateData.first_name);
    expect(updatedDriver.last_name).toBe(updateData.last_name);
  });

  it('PUT /api/drivers/:driverId/status - Should update a driver\'s status', async () => {
    // LD1: Create a test driver in the database
    const driverData = generateTestDriver();
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const driverId = createResponse.body.driver_id;

    // LD2: Send PUT request to /api/drivers/:driverId/status with new status
    const response = await request.put(`/drivers/${driverId}/status`).send({ status: DriverStatus.AVAILABLE });

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains driver with updated status
    expect(response.body.driver_id).toBe(driverId);
    expect(response.body.status).toBe(DriverStatus.AVAILABLE);

    // LD5: Verify driver status is updated in database
    const knex = getKnexInstance();
    const updatedDriver = await knex('drivers').where({ driver_id: driverId }).first();
    expect(updatedDriver.status).toBe(DriverStatus.AVAILABLE);
  });

  it('PUT /api/drivers/:driverId/efficiency-score - Should update a driver\'s efficiency score', async () => {
    // LD1: Create a test driver in the database
    const driverData = generateTestDriver();
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const driverId = createResponse.body.driver_id;

    // LD2: Send PUT request to /api/drivers/:driverId/efficiency-score with new score
    const response = await request.put(`/drivers/${driverId}/efficiency-score`).send({ score: 95 });

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains driver with updated efficiency score
    expect(response.body.driver_id).toBe(driverId);
    expect(response.body.efficiency_score).toBe(95);

    // LD5: Verify driver efficiency score is updated in database
    const knex = getKnexInstance();
    const updatedDriver = await knex('drivers').where({ driver_id: driverId }).first();
    expect(updatedDriver.efficiency_score).toBe(95);
  });

  it('PUT /api/drivers/:driverId/deactivate - Should deactivate a driver', async () => {
    // LD1: Create a test driver in the database
    const driverData = generateTestDriver();
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const driverId = createResponse.body.driver_id;

    // LD2: Send PUT request to /api/drivers/:driverId/deactivate
    const response = await request.put(`/drivers/${driverId}/deactivate`);

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains driver with active=false
    expect(response.body.driver_id).toBe(driverId);
    expect(response.body.active).toBe(false);

    // LD5: Verify driver is deactivated in database
    const knex = getKnexInstance();
    const updatedDriver = await knex('drivers').where({ driver_id: driverId }).first();
    expect(updatedDriver.active).toBe(false);
  });

  it('PUT /api/drivers/:driverId/activate - Should activate a driver', async () => {
    // LD1: Create a deactivated test driver in the database
    const driverData = generateTestDriver({ active: false });
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const driverId = createResponse.body.driver_id;

    // LD2: Send PUT request to /api/drivers/:driverId/activate
    const response = await request.put(`/drivers/${driverId}/activate`);

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains driver with active=true
    expect(response.body.driver_id).toBe(driverId);
    expect(response.body.active).toBe(true);

    // LD5: Verify driver is activated in database
    const knex = getKnexInstance();
    const updatedDriver = await knex('drivers').where({ driver_id: driverId }).first();
    expect(updatedDriver.active).toBe(true);
  });

  it('GET /api/drivers/search - Should search for drivers based on criteria', async () => {
    // LD1: Create multiple test drivers with different attributes
    const driverData1 = generateTestDriver({ first_name: 'John', last_name: 'Doe', status: DriverStatus.AVAILABLE });
    const driverData2 = generateTestDriver({ first_name: 'Jane', last_name: 'Smith', status: DriverStatus.ON_DUTY });
    await request.post('/drivers').send(driverData1);
    await request.post('/drivers').send(driverData2);

    // LD2: Send GET request to /api/drivers/search with search parameters
    const response = await request.get('/drivers/search?first_name=John&status=AVAILABLE');

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains matching drivers
    expect(Array.isArray(response.body.drivers)).toBe(true);
    expect(response.body.drivers.length).toBeGreaterThan(0);
    response.body.drivers.forEach((driver: Driver) => {
      expect(driver.first_name).toBe('John');
      expect(driver.status).toBe(DriverStatus.AVAILABLE);
    });

    // LD5: Verify pagination information is correct
    expect(response.body.total).toBeDefined();
    expect(response.body.page).toBeDefined();
    expect(response.body.limit).toBeDefined();
  });

  it('POST /api/drivers/:driverId/validate-load - Should validate if a driver is eligible for a load', async () => {
    // LD1: Create a test driver in the database
    const driverData = generateTestDriver();
    const createResponse = await request.post('/drivers').send(driverData);
    expect(createResponse.status).toBe(201);
    const driverId = createResponse.body.driver_id;

    // LD2: Send POST request to /api/drivers/:driverId/validate-load with load details
    const loadDetails = {
      origin: { latitude: 37.7749, longitude: -122.4194 },
      destination: { latitude: 34.0522, longitude: -118.2437 },
      pickup_time: new Date(),
      delivery_time: new Date(),
      equipment_type: 'Dry Van',
      estimated_driving_minutes: 360,
    };
    const response = await request.post(`/drivers/${driverId}/validate-load`).send(loadDetails);

    // LD3: Verify 200 status code
    expect(response.status).toBe(200);

    // LD4: Verify response body contains eligibility result
    expect(response.body.eligible).toBeDefined();

    // LD5: Test both eligible and ineligible scenarios
    // Add more assertions to test different scenarios (e.g., HOS violations, endorsement issues)
  });

  it('Error handling - non-existent driver - Should return 404 for non-existent driver', async () => {
    // LD1: Send GET request to /api/drivers/:driverId with non-existent ID
    const nonExistentDriverId = 'non-existent-driver-id';
    const response = await request.get(`/drivers/${nonExistentDriverId}`);

    // LD2: Verify 404 status code
    expect(response.status).toBe(404);

    // LD3: Verify response body contains appropriate error message
    expect(response.body.message).toBe('Driver not found');
  });
});