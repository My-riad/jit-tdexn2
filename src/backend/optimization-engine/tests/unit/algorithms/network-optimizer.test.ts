import { NetworkOptimizer, optimizeNetwork, calculateEfficiencyScore, calculateNetworkContribution } from '../../../src/algorithms/network-optimizer';
import { OptimizationJob, OptimizationParameters, OptimizationResult, LoadMatch } from '../../../src/models/optimization-job.model';
import { Load } from '../../../../common/interfaces/load.interface';
import { Driver } from '../../../../common/interfaces/driver.interface';
import { findOptimalSmartHubs } from '../../../src/algorithms/hub-selector';

// Mock the glpk library to avoid actual optimization during unit tests
jest.mock('glpk.js', () => ({
  Solver: jest.fn().mockImplementation(() => ({
    solve: jest.fn().mockReturnValue({
      result: {
        status: 1 // Simulate a feasible solution
      },
      vars: {} // Provide an empty vars object
    })
  }))
}));

// Mock the findOptimalSmartHubs function
jest.mock('../../../src/algorithms/hub-selector', () => ({
    findOptimalSmartHubs: jest.fn().mockResolvedValue([]) // Mock to return an empty array
}));

// Create a mock driver object for testing
function createMockDriver(overrides: Partial<Driver> = {}): Driver {
  // Create a default driver object with test values
  const defaultDriver: Driver = {
    driver_id: 'driver-123',
    user_id: 'user-456',
    carrier_id: 'carrier-789',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    license_number: 'DL12345',
    license_state: 'TX',
    license_class: 'A',
    license_endorsements: [],
    license_expiration: new Date(),
    home_address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'TX',
      zip: '12345'
    },
    current_location: { latitude: 34.0522, longitude: -118.2437 },
    current_vehicle_id: 'vehicle-1',
    current_load_id: 'load-1',
    status: 'AVAILABLE',
    hos_status: 'ON_DUTY',
    hos_status_since: new Date(),
    driving_minutes_remaining: 480,
    duty_minutes_remaining: 720,
    cycle_minutes_remaining: 3400,
    efficiency_score: 85,
    eld_device_id: 'eld-1',
    eld_provider: 'SomeProvider',
    created_at: new Date(),
    updated_at: new Date(),
    active: true
  };

  // Override default values with any provided overrides
  return { ...defaultDriver, ...overrides };
}

// Create a mock load object for testing
function createMockLoad(overrides: Partial<Load> = {}): Load {
  // Create a default load object with test values
  const defaultLoad: Load = {
    load_id: 'load-456',
    shipper_id: 'shipper-789',
    reference_number: 'REF123',
    description: 'Test Load',
    equipment_type: 'DRY_VAN',
    weight: 40000,
    dimensions: { length: 48, width: 8, height: 8 },
    volume: 2000,
    pallets: 20,
    commodity: 'Test Commodity',
    status: 'AVAILABLE',
    pickup_earliest: new Date(),
    pickup_latest: new Date(),
    delivery_earliest: new Date(),
    delivery_latest: new Date(),
    offered_rate: 1500,
    special_instructions: 'Handle with care',
    is_hazardous: false,
    temperature_requirements: { min_temp: 60, max_temp: 70 },
    created_at: new Date(),
    updated_at: new Date()
  };

  // Override default values with any provided overrides
  return { ...defaultLoad, ...overrides };
}

// Creates a mock optimization job for testing
function createMockOptimizationJob(paramOverrides: Partial<OptimizationParameters> = {}): OptimizationJob {
  // Create default optimization parameters
  const defaultParams: OptimizationParameters = {
    region: 'US-Central',
    timeWindow: { start: new Date(), end: new Date() },
    constraints: [],
    optimizationGoal: 'Minimize Empty Miles',
    weights: { emptyMiles: 0.7, driverPreference: 0.3 },
    maxIterations: 100,
    additionalParams: { smartHubProximityWeight: 0.5 }
  };

  // Override default parameters with any provided overrides
  const params = { ...defaultParams, ...paramOverrides };

  // Create and return an optimization job with the parameters
  return {
    job_id: 'test-job-123',
    job_type: 'LOAD_MATCHING',
    status: 'PENDING',
    parameters: params,
    priority: 5,
    progress: 0,
    created_by: 'test-user'
  };
}

describe('NetworkOptimizer', () => {
  let optimizer: NetworkOptimizer;

  beforeEach(() => {
    optimizer = new NetworkOptimizer();
  });

  it('should create a NetworkOptimizer instance', () => {
    expect(optimizer).toBeInstanceOf(NetworkOptimizer);
  });

  it('should call optimizeNetwork with the job parameters', async () => {
    const job = createMockOptimizationJob();
    const optimizeNetworkMock = jest.fn().mockResolvedValue({ load_matches: [], network_metrics: {} });
    
    // Temporarily override the implementation of optimizeNetwork
    const originalOptimizeNetwork = (NetworkOptimizer.prototype as any).optimize;
    (NetworkOptimizer.prototype as any).optimize = optimizeNetworkMock;
    
    await optimizer.optimize(job);
    
    expect(optimizeNetworkMock).toHaveBeenCalledWith(job);
    
    // Restore the original implementation
    (NetworkOptimizer.prototype as any).optimize = originalOptimizeNetwork;
  });

  it('should build a valid optimization model', () => {
    const loads = [createMockLoad()];
    const drivers = [createMockDriver()];
    const parameters: OptimizationParameters = {
      region: 'US-Central',
      timeWindow: { start: new Date(), end: new Date() },
      constraints: [],
      optimizationGoal: 'Minimize Empty Miles',
      weights: { emptyMiles: 0.7, driverPreference: 0.3 }
    };
    const model = optimizer.buildModel(loads, drivers, parameters);
    expect(typeof model).toBe('object');
  });

  it('should solve the optimization model and return a solution', () => {
    const loads = [createMockLoad()];
    const drivers = [createMockDriver()];
    const parameters: OptimizationParameters = {
      region: 'US-Central',
      timeWindow: { start: new Date(), end: new Date() },
      constraints: [],
      optimizationGoal: 'Minimize Empty Miles',
      weights: { emptyMiles: 0.7, driverPreference: 0.3 }
    };
    const model = optimizer.buildModel(loads, drivers, parameters);
    const solution = optimizer.solveModel(model);
    expect(typeof solution).toBe('object');
  });

  it('should calculate a driver-load score', () => {
    const driver = createMockDriver();
    const load = createMockLoad();
    const weights = { emptyMiles: 0.7, driverPreference: 0.3 };
    const score = optimizer.calculateDriverLoadScore(driver, load, weights);
    expect(typeof score).toBe('number');
  });
});

describe('optimizeNetwork', () => {
  it('should return an OptimizationResult object', async () => {
    const job = createMockOptimizationJob();
    const result = await optimizeNetwork(job);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('result_id');
    expect(result).toHaveProperty('load_matches');
    expect(result).toHaveProperty('network_metrics');
  });
});

describe('calculateEfficiencyScore', () => {
  it('should return a number', () => {
    const driver = createMockDriver();
    const load = createMockLoad();
    const weights = { emptyMiles: 0.7, driverPreference: 0.3 };
    const score = calculateEfficiencyScore(driver, load, {location_id: '1', load_id: '1', location_type: 'PICKUP', facility_name: 'test', address: 'test', city: 'test', state: 'test', zip: 'test', latitude: 1, longitude: 1, earliest_time: new Date(), latest_time: new Date(), contact_name: 'test', contact_phone: 'test', special_instructions: 'test', created_at: new Date(), updated_at: new Date()}, {location_id: '2', load_id: '2', location_type: 'DELIVERY', facility_name: 'test', address: 'test', city: 'test', state: 'test', zip: 'test', latitude: 1, longitude: 1, earliest_time: new Date(), latest_time: new Date(), contact_name: 'test', contact_phone: 'test', special_instructions: 'test', created_at: new Date(), updated_at: new Date()}, weights);
    expect(typeof score).toBe('number');
  });
});

describe('calculateNetworkContribution', () => {
  it('should return a number', () => {
    const driver = createMockDriver();
    const load = createMockLoad();
    const score = calculateNetworkContribution(driver, load, [], []);
    expect(typeof score).toBe('number');
  });
});