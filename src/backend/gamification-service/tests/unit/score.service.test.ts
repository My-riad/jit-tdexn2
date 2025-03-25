import { ScoreService } from '../../src/services/score.service';
import DriverScoreModel from '../../src/models/driver-score.model';
import LeaderboardService from '../../src/services/leaderboard.service';
import ScoreCalculator, { SCORE_WEIGHTS } from '../../src/algorithms/score-calculator';
import { DriverScore, LoadAssignment } from '../../../common/interfaces/driver.interface';
import { EventTypes } from '../../../common/constants/event-types';
import { EventProducer } from '../../../common/interfaces/event.interface';

// Mock the DriverScoreModel
const mockDriverScoreModel = {
  getLatestScoreForDriver: jest.fn(),
  getScoreHistoryForDriver: jest.fn(),
  getScoresByDateRange: jest.fn(),
} as unknown as typeof DriverScoreModel;

// Mock the LeaderboardService
const mockLeaderboardService = {
  updateDriverRanking: jest.fn(),
} as unknown as LeaderboardService;

// Mock the EventProducer
const mockEventProducer = {
  produceEvent: jest.fn(),
} as unknown as EventProducer;

// Mock the ScoreCalculator
const mockScoreCalculator = {
  calculateScore: jest.fn(),
  calculateHistoricalScore: jest.fn(),
  recalculateScores: jest.fn(),
} as unknown as ScoreCalculator;

describe('ScoreService', () => {
  let scoreService: ScoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    scoreService = new ScoreService(mockLeaderboardService as any, mockEventProducer as any);
    scoreService['scoreCalculator'] = mockScoreCalculator as any;
  });

  it('should create an instance of ScoreService', () => {
    expect(scoreService).toBeDefined();
    expect(scoreService['leaderboardService']).toBe(mockLeaderboardService);
    expect(scoreService['eventProducer']).toBe(mockEventProducer);
  });

  it('getDriverScore should return the latest score for a driver', async () => {
    const driverId = 'driver-123';
    const testScore: DriverScoreModel = {
      score_id: 'score-123',
      driver_id: driverId,
      total_score: 85,
      empty_miles_score: 90,
      network_contribution_score: 80,
      on_time_score: 75,
      hub_utilization_score: 88,
      fuel_efficiency_score: 92,
      score_factors: {},
      calculated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      calculateWeightedScore: jest.fn().mockReturnValue(85),
      updateTotalScore: jest.fn().mockResolvedValue(null),
      $query: jest.fn().mockReturnThis(),
      $patchAndFetchById: jest.fn().mockResolvedValue(null),
      $beforeInsert: jest.fn(),
      $beforeUpdate: jest.fn(),
      toJSON: jest.fn()
    };

    mockDriverScoreModel.getLatestScoreForDriver.mockResolvedValue(testScore);

    const score = await scoreService.getDriverScore(driverId);

    expect(score).toEqual(testScore);
    expect(mockDriverScoreModel.getLatestScoreForDriver).toHaveBeenCalledWith(driverId);
  });

  it('getDriverScoreHistory should return paginated score history', async () => {
    const driverId = 'driver-123';
    const page = 2;
    const pageSize = 10;
    const testScores: DriverScoreModel[] = [
      {
        score_id: 'score-1',
        driver_id: driverId,
        total_score: 80,
        empty_miles_score: 0,
        network_contribution_score: 0,
        on_time_score: 0,
        hub_utilization_score: 0,
        fuel_efficiency_score: 0,
        score_factors: {},
        calculated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        calculateWeightedScore: jest.fn().mockReturnValue(80),
        updateTotalScore: jest.fn().mockResolvedValue(null),
        $query: jest.fn().mockReturnThis(),
        $patchAndFetchById: jest.fn().mockResolvedValue(null),
        $beforeInsert: jest.fn(),
        $beforeUpdate: jest.fn(),
        toJSON: jest.fn()
      },
      {
        score_id: 'score-2',
        driver_id: driverId,
        total_score: 90,
        empty_miles_score: 0,
        network_contribution_score: 0,
        on_time_score: 0,
        hub_utilization_score: 0,
        fuel_efficiency_score: 0,
        score_factors: {},
        calculated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        calculateWeightedScore: jest.fn().mockReturnValue(90),
        updateTotalScore: jest.fn().mockResolvedValue(null),
        $query: jest.fn().mockReturnThis(),
        $patchAndFetchById: jest.fn().mockResolvedValue(null),
        $beforeInsert: jest.fn(),
        $beforeUpdate: jest.fn(),
        toJSON: jest.fn()
      },
    ];
    const total = 25;

    mockDriverScoreModel.getScoreHistoryForDriver.mockResolvedValue({ scores: testScores, total });

    const result = await scoreService.getDriverScoreHistory(driverId, page, pageSize);

    expect(result.scores).toEqual(testScores);
    expect(result.total).toEqual(total);
    expect(result.page).toEqual(page);
    expect(result.pageSize).toEqual(pageSize);
    expect(mockDriverScoreModel.getScoreHistoryForDriver).toHaveBeenCalledWith(driverId, pageSize, (page - 1) * pageSize);
  });

  it('getDriverScoresByDateRange should return scores within a date range', async () => {
    const driverId = 'driver-123';
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    const testScores: DriverScoreModel[] = [
      {
        score_id: 'score-1',
        driver_id: driverId,
        total_score: 75,
        empty_miles_score: 0,
        network_contribution_score: 0,
        on_time_score: 0,
        hub_utilization_score: 0,
        fuel_efficiency_score: 0,
        score_factors: {},
        calculated_at: new Date('2023-01-15'),
        created_at: new Date(),
        updated_at: new Date(),
        calculateWeightedScore: jest.fn().mockReturnValue(75),
        updateTotalScore: jest.fn().mockResolvedValue(null),
        $query: jest.fn().mockReturnThis(),
        $patchAndFetchById: jest.fn().mockResolvedValue(null),
        $beforeInsert: jest.fn(),
        $beforeUpdate: jest.fn(),
        toJSON: jest.fn()
      },
      {
        score_id: 'score-2',
        driver_id: driverId,
        total_score: 80,
        empty_miles_score: 0,
        network_contribution_score: 0,
        on_time_score: 0,
        hub_utilization_score: 0,
        fuel_efficiency_score: 0,
        score_factors: {},
        calculated_at: new Date('2023-01-22'),
        created_at: new Date(),
        updated_at: new Date(),
        calculateWeightedScore: jest.fn().mockReturnValue(80),
        updateTotalScore: jest.fn().mockResolvedValue(null),
        $query: jest.fn().mockReturnThis(),
        $patchAndFetchById: jest.fn().mockResolvedValue(null),
        $beforeInsert: jest.fn(),
        $beforeUpdate: jest.fn(),
        toJSON: jest.fn()
      },
    ];

    mockDriverScoreModel.getScoresByDateRange.mockResolvedValue(testScores);

    const scores = await scoreService.getDriverScoresByDateRange(driverId, startDate, endDate);

    expect(scores).toEqual(testScores);
    expect(mockDriverScoreModel.getScoresByDateRange).toHaveBeenCalledWith(driverId, startDate, endDate);
  });

  it('calculateScoreForLoad should calculate a new score based on a load assignment', async () => {
    const driverId = 'driver-123';
    const loadAssignment: LoadAssignment = {
      assignment_id: 'assignment-123',
      load_id: 'load-123',
      driver_id: driverId,
      vehicle_id: 'vehicle-123',
      assignment_type: 'DIRECT',
      status: 'COMPLETED',
      agreed_rate: 1000,
      efficiency_score: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    const additionalMetrics = { emptyMilesPercentage: 0.25, region: 'Midwest' };
    const testScore: DriverScoreModel = {
      score_id: 'score-123',
      driver_id: driverId,
      total_score: 85,
      empty_miles_score: 0,
      network_contribution_score: 0,
      on_time_score: 0,
      hub_utilization_score: 0,
      fuel_efficiency_score: 0,
      score_factors: {},
      calculated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      calculateWeightedScore: jest.fn().mockReturnValue(85),
      updateTotalScore: jest.fn().mockResolvedValue(null),
      $query: jest.fn().mockReturnThis(),
      $patchAndFetchById: jest.fn().mockResolvedValue(null),
      $beforeInsert: jest.fn(),
      $beforeUpdate: jest.fn(),
      toJSON: jest.fn()
    };

    mockScoreCalculator.calculateScore.mockResolvedValue(testScore);

    const score = await scoreService.calculateScoreForLoad(driverId, loadAssignment, additionalMetrics);

    expect(score).toEqual(testScore);
    expect(mockLeaderboardService.updateDriverRanking).toHaveBeenCalledWith(driverId, testScore);
    expect(mockEventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        event_type: EventTypes.SCORE_UPDATED
      }),
      payload: expect.objectContaining({
        driver_id: driverId,
        score_id: testScore.score_id,
        total_score: testScore.total_score
      })
    }));
  });

  it('calculateHistoricalScore should calculate a score based on historical data', async () => {
    const driverId = 'driver-123';
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    const testScore: DriverScoreModel = {
      score_id: 'score-123',
      driver_id: driverId,
      total_score: 70,
      empty_miles_score: 0,
      network_contribution_score: 0,
      on_time_score: 0,
      hub_utilization_score: 0,
      fuel_efficiency_score: 0,
      score_factors: {},
      calculated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      calculateWeightedScore: jest.fn().mockReturnValue(70),
      updateTotalScore: jest.fn().mockResolvedValue(null),
      $query: jest.fn().mockReturnThis(),
      $patchAndFetchById: jest.fn().mockResolvedValue(null),
      $beforeInsert: jest.fn(),
      $beforeUpdate: jest.fn(),
      toJSON: jest.fn()
    };

    mockScoreCalculator.calculateHistoricalScore.mockResolvedValue(testScore);

    const score = await scoreService.calculateHistoricalScore(driverId, startDate, endDate);

    expect(score).toEqual(testScore);
    expect(mockLeaderboardService.updateDriverRanking).toHaveBeenCalledWith(driverId, testScore);
    expect(mockEventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        event_type: EventTypes.SCORE_UPDATED
      }),
      payload: expect.objectContaining({
        driver_id: driverId,
        score_id: testScore.score_id,
        total_score: testScore.total_score
      })
    }));
  });

  it('updateDriverScore should update an existing score with new component values', async () => {
    const driverId = 'driver-123';
    const existingScore: DriverScoreModel = {
      score_id: 'score-123',
      driver_id: driverId,
      total_score: 75,
      empty_miles_score: 80,
      network_contribution_score: 70,
      on_time_score: 60,
      hub_utilization_score: 50,
      fuel_efficiency_score: 40,
      score_factors: {},
      calculated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      calculateWeightedScore: jest.fn().mockReturnValue(75),
      updateTotalScore: jest.fn().mockResolvedValue(null),
      $query: jest.fn().mockReturnThis(),
      $patchAndFetchById: jest.fn().mockResolvedValue(null),
      $beforeInsert: jest.fn(),
      $beforeUpdate: jest.fn(),
      toJSON: jest.fn()
    };
    const scoreData = {
      empty_miles_score: 85,
      network_contribution_score: 75,
      on_time_score: 65,
      hub_utilization_score: 55,
      fuel_efficiency_score: 45,
    };
    const updatedScore: DriverScoreModel = {
      score_id: 'score-123',
      driver_id: driverId,
      total_score: 77.5,
      empty_miles_score: 85,
      network_contribution_score: 75,
      on_time_score: 65,
      hub_utilization_score: 55,
      fuel_efficiency_score: 45,
      score_factors: {},
      calculated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      calculateWeightedScore: jest.fn().mockReturnValue(77.5),
      updateTotalScore: jest.fn().mockResolvedValue(null),
      $query: jest.fn().mockReturnThis(),
      $patchAndFetchById: jest.fn().mockResolvedValue(null),
      $beforeInsert: jest.fn(),
      $beforeUpdate: jest.fn(),
      toJSON: jest.fn()
    };

    mockDriverScoreModel.getLatestScoreForDriver.mockResolvedValue(existingScore);
    (existingScore.updateTotalScore as jest.Mock).mockResolvedValue(updatedScore);

    const score = await scoreService.updateDriverScore(driverId, scoreData);

    expect(score).toEqual(updatedScore);
    expect(mockLeaderboardService.updateDriverRanking).toHaveBeenCalledWith(driverId, updatedScore);
    expect(mockEventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        event_type: EventTypes.SCORE_UPDATED
      }),
      payload: expect.objectContaining({
        driver_id: driverId,
        score_id: updatedScore.score_id,
        total_score: updatedScore.total_score
      })
    }));
  });

  it('recalculateDriverScores should recalculate scores for multiple drivers', async () => {
    const driverIds = ['driver-1', 'driver-2'];
    const testScore1: DriverScoreModel = {
      score_id: 'score-1',
      driver_id: 'driver-1',
      total_score: 80,
      empty_miles_score: 0,
      network_contribution_score: 0,
      on_time_score: 0,
      hub_utilization_score: 0,
      fuel_efficiency_score: 0,
      score_factors: {},
      calculated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      calculateWeightedScore: jest.fn().mockReturnValue(80),
      updateTotalScore: jest.fn().mockResolvedValue(null),
      $query: jest.fn().mockReturnThis(),
      $patchAndFetchById: jest.fn().mockResolvedValue(null),
      $beforeInsert: jest.fn(),
      $beforeUpdate: jest.fn(),
      toJSON: jest.fn()
    };
    const testScore2: DriverScoreModel = {
      score_id: 'score-2',
      driver_id: 'driver-2',
      total_score: 90,
      empty_miles_score: 0,
      network_contribution_score: 0,
      on_time_score: 0,
      hub_utilization_score: 0,
      fuel_efficiency_score: 0,
      score_factors: {},
      calculated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      calculateWeightedScore: jest.fn().mockReturnValue(90),
      updateTotalScore: jest.fn().mockResolvedValue(null),
      $query: jest.fn().mockReturnThis(),
      $patchAndFetchById: jest.fn().mockResolvedValue(null),
      $beforeInsert: jest.fn(),
      $beforeUpdate: jest.fn(),
      toJSON: jest.fn()
    };
    mockScoreCalculator.recalculateScores.mockResolvedValue({
      'driver-1': testScore1,
      'driver-2': testScore2
    });

    const scores = await scoreService.recalculateDriverScores(driverIds);

    expect(scores['driver-1']).toEqual(testScore1);
    expect(scores['driver-2']).toEqual(testScore2);
    expect(mockLeaderboardService.updateDriverRanking).toHaveBeenCalledTimes(0);
    expect(mockEventProducer.produceEvent).toHaveBeenCalledTimes(0);
  });

  it('checkScoreMilestones should detect when a driver crosses a milestone', async () => {
    const driverId = 'driver-123';
    const previousScore = 45;
    const newScore = 55;

    await scoreService.checkScoreMilestones(driverId, previousScore, newScore);

    expect(mockEventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        event_type: EventTypes.SCORE_MILESTONE_REACHED
      }),
      payload: expect.objectContaining({
        driver_id: driverId,
        milestone: 50
      })
    }));
  });

  it('checkScoreMilestones should not trigger an event if no milestone is crossed', async () => {
    const driverId = 'driver-123';
    const previousScore = 45;
    const newScore = 49;

    await scoreService.checkScoreMilestones(driverId, previousScore, newScore);

    expect(mockEventProducer.produceEvent).not.toHaveBeenCalled();
  });

  it('publishScoreEvent should create and publish an event with correct metadata', async () => {
    const eventType = EventTypes.SCORE_UPDATED;
    const payload = { driver_id: 'driver-123', score: 85 };

    await scoreService.publishScoreEvent(eventType, payload);

    expect(mockEventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        event_type: eventType
      }),
      payload: payload
    }));
  });
});