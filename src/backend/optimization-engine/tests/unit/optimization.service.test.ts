import { Queue } from 'bull'; // bull@^4.10.4
import { OptimizationService } from '../../src/services/optimization.service';
import { OptimizationJobType, OptimizationJobStatus, OptimizationJob, OptimizationParameters } from '../../src/models/optimization-job.model';
import { OptimizationResult, LoadMatch } from '../../src/models/optimization-result.model';
import { NetworkOptimizer } from '../../src/algorithms/network-optimizer';
import { HubSelector } from '../../src/algorithms/hub-selector';
import { RelayPlanner } from '../../src/algorithms/relay-planner';
import { DemandPredictor } from '../../src/algorithms/demand-predictor';
import { optimizationResultsProducer } from '../../src/producers/optimization-results.producer';
import { jest } from '@jest/globals'; // jest@^29.6.2

// Mock the necessary modules and their methods
jest.mock('../../src/services/optimization.service', () => ({
  OptimizationService: jest.fn().mockImplementation(() => ({
    createJob: jest.fn(),
    getJobStatus: jest.fn(),
    getResult: jest.fn(),
    cancelJob: jest.fn(),
    processJob: jest.fn(),
    executeAlgorithm: jest.fn(),
  })),
}));

jest.mock('../../src/algorithms/network-optimizer', () => ({
  NetworkOptimizer: jest.fn().mockImplementation(() => ({
    optimize: jest.fn(),
  })),
}));

jest.mock('../../src/algorithms/hub-selector', () => ({
  HubSelector: jest.fn().mockImplementation(() => ({
    findOptimalHubLocations: jest.fn(),
  })),
}));

jest.mock('../../src/algorithms/relay-planner', () => ({
  RelayPlanner: jest.fn().mockImplementation(() => ({
    createPlan: jest.fn(),
  })),
}));

jest.mock('../../src/algorithms/demand-predictor', () => ({
  DemandPredictor: jest.fn().mockImplementation(() => ({
    predictRegionalDemand: jest.fn(),
  })),
}));

jest.mock('../../src/producers/optimization-results.producer', () => ({
  optimizationResultsProducer: {
    publishResult: jest.fn(),
  },
}));

describe('OptimizationService', () => {
  let optimizationService: OptimizationService;
  let mockNetworkOptimizer: NetworkOptimizer;
  let mockHubSelector: HubSelector;
  let mockRelayPlanner: RelayPlanner;
  let mockDemandPredictor: DemandPredictor;
  let mockOptimizationQueue: Partial<Queue>;

  beforeEach(() => {
    // Mock the Queue constructor and methods
    mockOptimizationQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
      remove: jest.fn(),
      process: jest.fn(),
      on: jest.fn(),
      pause: jest.fn(),
      close: jest.fn(),
    };
    (Queue as jest.Mock).mockImplementation(() => mockOptimizationQueue);

    optimizationService = new OptimizationService({});
    mockNetworkOptimizer = new NetworkOptimizer();
    mockHubSelector = new HubSelector({});
    mockRelayPlanner = new RelayPlanner({});
    mockDemandPredictor = new DemandPredictor({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a new optimization job and return the job ID', async () => {
      const jobType = OptimizationJobType.LOAD_MATCHING;
      const parameters: OptimizationParameters = {
        region: 'US',
        timeWindow: { start: new Date(), end: new Date() },
        constraints: [],
        optimizationGoal: 'MinEmptyMiles',
        weights: {},
      };
      const priority = 1;
      const createdBy = 'test-user';

      (mockOptimizationQueue.add as jest.Mock).mockResolvedValue({ id: 'job-123' });

      const result = await optimizationService.createJob(jobType, parameters, priority, createdBy);

      expect(mockOptimizationQueue.add).toHaveBeenCalledWith('job-123', expect.anything(), { priority: 1 });
      expect(result).toEqual({ jobId: 'job-123' });
    });
  });

  describe('getJobStatus', () => {
    it('should return the status of an optimization job', async () => {
      const jobId = 'job-123';
      (mockOptimizationQueue.getJob as jest.Mock).mockResolvedValue({ id: jobId, state: 'completed' });

      const result = await optimizationService.getJobStatus(jobId);

      expect(mockOptimizationQueue.getJob).toHaveBeenCalledWith(jobId);
      expect(result).toEqual({ status: 'completed' });
    });
  });

  describe('getResult', () => {
    it('should return the result of a completed optimization job', async () => {
      const resultId = 'result-123';
      const mockResult: OptimizationResult = createMockResult('job-123', OptimizationJobType.LOAD_MATCHING);
      (mockOptimizationQueue.getJob as jest.Mock).mockResolvedValue({ id: 'job-123', result: mockResult });

      const result = await optimizationService.getResult(resultId);

      expect(mockOptimizationQueue.getJob).toHaveBeenCalledWith(resultId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('cancelJob', () => {
    it('should cancel a pending optimization job', async () => {
      const jobId = 'job-123';
      (mockOptimizationQueue.getJob as jest.Mock).mockResolvedValue({ id: jobId, state: 'pending' });
      (mockOptimizationQueue.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await optimizationService.cancelJob(jobId);

      expect(mockOptimizationQueue.getJob).toHaveBeenCalledWith(jobId);
      expect(mockOptimizationQueue.remove).toHaveBeenCalledWith(jobId);
      expect(result).toEqual({ success: true });
    });
  });

  describe('processJob', () => {
    it('should process an optimization job and return the result', async () => {
      const jobId = 'job-123';
      const jobType = OptimizationJobType.LOAD_MATCHING;
      const mockJob: OptimizationJob = createMockJob(jobType);
      const mockResult: OptimizationResult = createMockResult(jobId, jobType);

      (optimizationService.executeAlgorithm as jest.Mock).mockResolvedValue(mockResult);
      (optimizationResultsProducer.publishResult as jest.Mock).mockResolvedValue(undefined);

      const result = await optimizationService.processJob(mockJob);

      expect(optimizationService.executeAlgorithm).toHaveBeenCalledWith(mockJob);
      expect(optimizationResultsProducer.publishResult).toHaveBeenCalledWith(mockResult);
      expect(result).toEqual(mockResult);
    });
  });

  describe('executeAlgorithm', () => {
    it('should execute the network optimization algorithm', async () => {
      const mockJob: OptimizationJob = createMockJob(OptimizationJobType.NETWORK_OPTIMIZATION);
      const mockResult: OptimizationResult = createMockResult(mockJob.job_id, mockJob.job_type);
      (mockNetworkOptimizer.optimize as jest.Mock).mockResolvedValue(mockResult);

      const result = await optimizationService.executeAlgorithm(mockJob);

      expect(mockNetworkOptimizer.optimize).toHaveBeenCalledWith(mockJob);
      expect(result).toEqual(mockResult);
    });

    it('should execute the smart hub identification algorithm', async () => {
      const mockJob: OptimizationJob = createMockJob(OptimizationJobType.SMART_HUB_IDENTIFICATION);
      const mockResult: OptimizationResult = createMockResult(mockJob.job_id, mockJob.job_type);
      (mockHubSelector.findOptimalHubLocations as jest.Mock).mockResolvedValue(mockResult);

      const result = await optimizationService.executeAlgorithm(mockJob);

      expect(mockHubSelector.findOptimalHubLocations).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should execute the relay planning algorithm', async () => {
      const mockJob: OptimizationJob = createMockJob(OptimizationJobType.RELAY_PLANNING);
      const mockResult: OptimizationResult = createMockResult(mockJob.job_id, mockJob.job_type);
      (mockRelayPlanner.createPlan as jest.Mock).mockResolvedValue(mockResult);

      const result = await optimizationService.executeAlgorithm(mockJob);

      expect(mockRelayPlanner.createPlan).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should execute the demand prediction algorithm', async () => {
      const mockJob: OptimizationJob = createMockJob(OptimizationJobType.DEMAND_PREDICTION);
      const mockResult: OptimizationResult = createMockResult(mockJob.job_id, mockJob.job_type);
      (mockDemandPredictor.predictRegionalDemand as jest.Mock).mockResolvedValue(mockResult);

      const result = await optimizationService.executeAlgorithm(mockJob);

      expect(mockDemandPredictor.predictRegionalDemand).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should throw an error for an unsupported job type', async () => {
      const mockJob: OptimizationJob = createMockJob('UNSUPPORTED' as OptimizationJobType);

      await expect(optimizationService.executeAlgorithm(mockJob)).rejects.toThrowError('Unsupported job type: UNSUPPORTED');
    });
  });
});

/**
 * Helper function to create a mock optimization job for testing
 * @param jobType 
 * @param params 
 * @returns A mock optimization job object
 */
function createMockJob(jobType: OptimizationJobType, params: Partial<OptimizationParameters> = {}): OptimizationJob {
  const jobId = `job-${Math.random()}`; // Create a job ID using a predictable format for testing
  const defaultParams: OptimizationParameters = { // Set default parameters if not provided
    region: 'US',
    timeWindow: { start: new Date(), end: new Date() },
    constraints: [],
    optimizationGoal: 'MinEmptyMiles',
    weights: {},
    ...params
  };

  return { // Create and return a mock job object with the specified type and parameters
    job_id: jobId,
    job_type: jobType,
    status: OptimizationJobStatus.PENDING,
    parameters: defaultParams,
    priority: 1,
    progress: 0,
    created_by: 'test',
    created_at: new Date(),
  };
}

/**
 * Helper function to create a mock optimization result for testing
 * @param jobId 
 * @param jobType 
 * @returns A mock optimization result object
 */
function createMockResult(jobId: string, jobType: OptimizationJobType): OptimizationResult {
  const resultId = `result-${jobId}`; // Create a result ID using a predictable format for testing
  let resultData: any = {}; // Create appropriate result data based on the job type

  switch (jobType) {
    case OptimizationJobType.LOAD_MATCHING:
      resultData = { load_matches: [{ driver_id: 'driver-1', load_id: 'load-1', score: 90 } as LoadMatch] };
      break;
    case OptimizationJobType.SMART_HUB_IDENTIFICATION:
      resultData = { smart_hub_recommendations: [{ location: { latitude: 34.0522, longitude: -118.2437 }, score: 95 }] };
      break;
    case OptimizationJobType.RELAY_PLANNING:
      resultData = { relay_plans: [{ plan_id: 'relay-1', load_id: 'load-1' }] };
      break;
    case OptimizationJobType.DEMAND_PREDICTION:
      resultData = { demand_forecasts: [{ region: 'US', time_window: { start: new Date(), end: new Date() }, load_demand: 100, truck_supply: 50, confidence: 0.8 }] };
      break;
    case OptimizationJobType.NETWORK_OPTIMIZATION:
        resultData = { network_metrics: { total_loads: 100, total_drivers: 50, matched_loads: 80, matched_drivers: 40, total_miles: 1000, loaded_miles: 800, empty_miles: 200, empty_miles_percentage: 20, network_efficiency_score: 80 } };
        break;
    default:
      resultData = {};
  }

  return { // Return a mock result object with the job ID and type-specific data
    result_id: resultId,
    job_id: jobId,
    job_type: jobType,
    load_matches: [],
    smart_hub_recommendations: [],
    relay_plans: [],
    demand_forecasts: [],
    network_metrics: {
        total_loads: 0,
        total_drivers: 0,
        matched_loads: 0,
        matched_drivers: 0,
        total_miles: 0,
        loaded_miles: 0,
        empty_miles: 0,
        empty_miles_percentage: 0,
        network_efficiency_score: 0
    },
    created_at: new Date(),
    ...resultData,
  };
}