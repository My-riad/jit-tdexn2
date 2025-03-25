import request from 'supertest'; // supertest@^6.3.3
import { MockInstance } from 'jest'; // jest@^29.5.0
import { app } from '../../src/app';
import { OptimizationService } from '../../src/services/optimization.service';
import { SmartHubService } from '../../src/services/smart-hub.service';
import { RelayService } from '../../src/services/relay.service';
import { OptimizationJobType, OptimizationJobStatus } from '../../src/models/optimization-job.model';
import logger from '../../../common/utils/logger';

// Mock the OptimizationService, SmartHubService, and RelayService
jest.mock('../../src/services/optimization.service');
jest.mock('../../src/services/smart-hub.service');
jest.mock('../../src/services/relay.service');
jest.mock('../../../common/utils/logger');

// Type definitions for mocked services
type MockOptimizationService = {
  createJob: MockInstance<any, any>;
  getJobStatus: MockInstance<any, any>;
  getResult: MockInstance<any, any>;
  cancelJob: MockInstance<any, any>;
};

type MockSmartHubService = {
  findNearbyHubs: MockInstance<any, any>;
  identifyNewHubOpportunities: MockInstance<any, any>;
};

type MockRelayService = {
  createOptimalPlan: MockInstance<any, any>;
  getRelayPlansByLoad: MockInstance<any, any>;
};

// Cast the mocked services to their respective types
const mockedOptimizationService = new OptimizationService({} as any) as jest.Mocked<OptimizationService> as unknown as MockOptimizationService;
const mockedSmartHubService = new SmartHubService() as jest.Mocked<SmartHubService> as unknown as MockSmartHubService;
const mockedRelayService = new RelayService({} as any, {} as any) as jest.Mocked<RelayService> as unknown as MockRelayService;

// Before each test, clear all mocks to ensure clean test state
beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Generates mock optimization parameters for testing
 * @param jobType 
 * @returns Mock optimization parameters appropriate for the job type
 */
const generateMockOptimizationParameters = (jobType: OptimizationJobType) => {
  // Create base parameters with region and time window
  const baseParams = {
    region: 'Midwest',
    timeWindow: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
    },
    constraints: [],
    optimizationGoal: 'Minimize Empty Miles',
    weights: {
      emptyMiles: 0.6,
      driverPreference: 0.2,
      hosCompliance: 0.2
    }
  };

  // Add job type specific parameters based on the job type
  let jobTypeParams = {};
  switch (jobType) {
    // For LOAD_MATCHING, add driver and load related parameters
    case OptimizationJobType.LOAD_MATCHING:
      jobTypeParams = {
        drivers: [{ driver_id: 'driver-1' }, { driver_id: 'driver-2' }],
        loads: [{ load_id: 'load-1' }, { load_id: 'load-2' }]
      };
      break;

    // For SMART_HUB_IDENTIFICATION, add location and traffic pattern parameters
    case OptimizationJobType.SMART_HUB_IDENTIFICATION:
      jobTypeParams = {
        location: { latitude: 37.7749, longitude: -122.4194 },
        trafficPatterns: ['weekday', 'weekend']
      };
      break;

    // For RELAY_PLANNING, add load and driver availability parameters
    case OptimizationJobType.RELAY_PLANNING:
      jobTypeParams = {
        loadId: 'load-123',
        driverAvailability: [{ driver_id: 'driver-1', available: true }, { driver_id: 'driver-2', available: false }]
      };
      break;

    // For NETWORK_OPTIMIZATION, add network-wide constraints and goals
    case OptimizationJobType.NETWORK_OPTIMIZATION:
      jobTypeParams = {
        networkConstraints: { maxDistance: 500 },
        optimizationGoals: ['Minimize Cost', 'Maximize Throughput']
      };
      break;

    // For DEMAND_PREDICTION, add historical data references and prediction window
    case OptimizationJobType.DEMAND_PREDICTION:
      jobTypeParams = {
        historicalData: 's3://bucket/historical-data.csv',
        predictionWindow: { start: new Date().toISOString(), end: new Date(Date.now() + 43200000).toISOString() } // 12 hours from now
      };
      break;
  }

  // Return the generated parameters object
  return { ...baseParams, ...jobTypeParams };
};

/**
 * Generates mock optimization results for testing
 * @param jobId 
 * @returns Mock optimization result appropriate for the job type
 */
const generateMockOptimizationResult = (jobId: string, jobType: OptimizationJobType) => {
  // Create base result object with result_id, job_id, and job_type
  const baseResult = {
    result_id: 'result-' + jobId,
    job_id: jobId,
    job_type: jobType,
    created_at: new Date()
  };

  // Add job type specific result data based on the job type
  let jobTypeResult = {};
  switch (jobType) {
    // For LOAD_MATCHING, add mock load matches
    case OptimizationJobType.LOAD_MATCHING:
      jobTypeResult = {
        load_matches: [{ driver_id: 'driver-1', load_id: 'load-1', score: 0.95, empty_miles_saved: 50, network_contribution: 0.8, estimated_earnings: 1000, compatibility_factors: {} }]
      };
      break;

    // For SMART_HUB_IDENTIFICATION, add mock smart hub recommendations
    case OptimizationJobType.SMART_HUB_IDENTIFICATION:
      jobTypeResult = {
        smart_hub_recommendations: [{ location: { latitude: 37.7749, longitude: -122.4194 }, score: 0.9, estimated_impact: { empty_miles_reduction: 1000, exchanges_per_day: 5 }, nearby_facilities: [], recommended_capacity: 50, recommended_amenities: [] }]
      };
      break;

    // For RELAY_PLANNING, add mock relay plans
    case OptimizationJobType.RELAY_PLANNING:
      jobTypeResult = {
        relay_plans: [{ plan_id: 'relay-plan-1', load_id: 'load-123', segments: [], handoff_locations: [], total_distance: 300, total_duration: 6, efficiency_score: 0.85, estimated_savings: 500, empty_miles_saved: 100 }]
      };
      break;

    // For NETWORK_OPTIMIZATION, add mock network metrics
    case OptimizationJobType.NETWORK_OPTIMIZATION:
      jobTypeResult = {
        network_metrics: { total_loads: 100, total_drivers: 50, matched_loads: 80, matched_drivers: 40, total_miles: 10000, loaded_miles: 8000, empty_miles: 2000, empty_miles_percentage: 20, network_efficiency_score: 0.8 }
      };
      break;

    // For DEMAND_PREDICTION, add mock demand forecasts
    case OptimizationJobType.DEMAND_PREDICTION:
      jobTypeResult = {
        demand_forecasts: [{ region: 'Midwest', time_window: { start: new Date().toISOString(), end: new Date().toISOString() }, load_demand: 100, truck_supply: 80, confidence: 0.9, hotspots: [] }]
      };
      break;
  }

  // Return the generated result object
  return { ...baseResult, ...jobTypeResult };
};

describe('Optimization Engine API', () => {
  it('POST /api/v1/optimization - should create a new optimization job', async () => {
    // Arrange
    const jobType = OptimizationJobType.LOAD_MATCHING;
    const parameters = generateMockOptimizationParameters(jobType);
    const priority = 5;
    const createdBy = 'test-user';
    const jobId = 'test-job-123';

    mockedOptimizationService.createJob.mockResolvedValue({ jobId });

    // Act
    const response = await request(app)
      .post('/api/v1/optimization')
      .send({ jobType, parameters, priority, createdBy });

    // Assert
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ jobId });
    expect(mockedOptimizationService.createJob).toHaveBeenCalledWith(jobType, parameters, priority, createdBy);
  });

  it('GET /api/v1/optimization/:jobId/status - should get the status of an optimization job', async () => {
    // Arrange
    const jobId = 'test-job-123';
    const status = OptimizationJobStatus.COMPLETED;
    const progress = 100;
    const resultId = 'result-123';
    mockedOptimizationService.getJobStatus.mockResolvedValue({ status, progress, resultId });

    // Act
    const response = await request(app).get(`/api/v1/optimization/${jobId}/status`);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status, progress, resultId });
    expect(mockedOptimizationService.getJobStatus).toHaveBeenCalledWith(jobId);
  });

  it('GET /api/v1/optimization/:resultId/result - should get the result of an optimization job', async () => {
    // Arrange
    const resultId = 'result-123';
    const jobId = 'test-job-123';
    const jobType = OptimizationJobType.LOAD_MATCHING;
    const mockResult = generateMockOptimizationResult(jobId, jobType);
    mockedOptimizationService.getResult.mockResolvedValue(mockResult);

    // Act
    const response = await request(app).get(`/api/v1/optimization/${resultId}/result`);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockResult);
    expect(mockedOptimizationService.getResult).toHaveBeenCalledWith(resultId);
  });

  it('DELETE /api/v1/optimization/:jobId - should cancel an optimization job', async () => {
    // Arrange
    const jobId = 'test-job-123';
    const success = true;
    mockedOptimizationService.cancelJob.mockResolvedValue({ success });

    // Act
    const response = await request(app).delete(`/api/v1/optimization/${jobId}`);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ success });
    expect(mockedOptimizationService.cancelJob).toHaveBeenCalledWith(jobId);
  });
});