import { MatchingService } from '../../src/services/matching.service';
import { ReservationService } from '../../src/services/reservation.service';
import { RecommendationService } from '../../src/services/recommendation.service';
import { MatchModel, RelayMatchModel } from '../../src/models/match.model';
import { Match, MatchType, MatchStatus, MatchScoreFactors, RelayMatch } from '../../src/interfaces/match.interface';
import { LoadStatus } from '../../../common/interfaces/load.interface';
import { EventTypes } from '../../../common/constants/event-types';
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { jest } from '@jest/globals'; // ^29.0.0

// Mock the necessary services and models
const createMockEventProducer = () => {
  const mock = {
    produceEvent: jest.fn().mockResolvedValue(undefined),
  };
  return mock;
};

const createMockReservationService = () => {
  return {
    createReservation: jest.fn(),
    getActiveReservationForMatch: jest.fn(),
    convertReservation: jest.fn(),
    cancelReservation: jest.fn(),
    processExpiredReservations: jest.fn(),
  };
};

const createMockRecommendationService = () => {
  return {
    createRecommendation: jest.fn(),
    getActiveRecommendationsForDriver: jest.fn(),
    markRecommendationAsViewed: jest.fn(),
    deactivateRecommendationsForMatch: jest.fn(),
  };
};

const createMockOptimizationService = () => {
  return {
    optimizeLoadMatching: jest.fn(),
    planRelayRoutes: jest.fn(),
    optimizeNetwork: jest.fn(),
  };
};

const createMockLoadService = () => {
  return {
    getLoadById: jest.fn(),
    getAvailableLoads: jest.fn(),
    updateLoadStatus: jest.fn(),
  };
};

const createMockDriverService = () => {
  return {
    getDriverById: jest.fn(),
    getAvailableDrivers: jest.fn(),
    getDriverHOS: jest.fn(),
    getDriverPreferences: jest.fn(),
  };
};

const createTestMatch = (overrides: Partial<Match> = {}): Match => {
  const defaultMatch: Match = {
    match_id: uuidv4(),
    load_id: uuidv4(),
    driver_id: uuidv4(),
    vehicle_id: uuidv4(),
    match_type: MatchType.DIRECT,
    status: MatchStatus.PENDING,
    efficiency_score: 75,
    score_factors: {
      empty_miles_reduction: 0.8,
      network_contribution: 0.7,
      driver_preference_alignment: 0.9,
      time_efficiency: 0.6,
      smart_hub_utilization: 0.5,
      additional_factors: {}
    },
    proposed_rate: 1000,
    accepted_rate: null,
    reservation_expiry: null,
    decline_reason: null,
    decline_notes: null,
    created_at: new Date(),
    updated_at: new Date()
  };

  return { ...defaultMatch, ...overrides };
};

const createTestRelayMatch = (overrides: Partial<RelayMatch> = {}): RelayMatch => {
    const defaultRelayMatch: RelayMatch = {
        relay_id: uuidv4(),
        load_id: uuidv4(),
        segments: [],
        total_efficiency_score: 80,
        status: MatchStatus.PENDING,
        created_at: new Date(),
        updated_at: new Date(),
    };

    return { ...defaultRelayMatch, ...overrides };
};

describe('MatchingService', () => {
  let matchingService: MatchingService;
  let eventProducer: ReturnType<typeof createMockEventProducer>;
  let reservationService: ReturnType<typeof createMockReservationService>;
  let recommendationService: ReturnType<typeof createMockRecommendationService>;
  let optimizationService: ReturnType<typeof createMockOptimizationService>;
  let loadService: ReturnType<typeof createMockLoadService>;
  let driverService: ReturnType<typeof createMockDriverService>;

  beforeEach(() => {
    eventProducer = createMockEventProducer();
    reservationService = createMockReservationService();
    recommendationService = createMockRecommendationService();
    optimizationService = createMockOptimizationService();
    loadService = createMockLoadService();
    driverService = createMockDriverService();

    matchingService = new MatchingService(
      eventProducer,
      reservationService,
      recommendationService,
      optimizationService,
      loadService,
      driverService
    );
  });

  describe('getMatchById', () => {
    it('should return a match when it exists', async () => {
      const testMatch = createTestMatch();
      (MatchModel.findById as jest.Mock).mockResolvedValue(testMatch);

      const match = await matchingService.getMatchById(testMatch.match_id);
      expect(match).toEqual(testMatch);
      expect(MatchModel.findById).toHaveBeenCalledWith(testMatch.match_id);
    });

    it('should throw an error when the match does not exist', async () => {
      (MatchModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(matchingService.getMatchById('nonexistent_id')).rejects.toThrow('Match with ID nonexistent_id not found');
      expect(MatchModel.findById).toHaveBeenCalledWith('nonexistent_id');
    });
  });

  describe('getRelayMatchById', () => {
      it('should return a relay match when it exists', async () => {
          const testRelayMatch = createTestRelayMatch();
          (RelayMatchModel.findById as jest.Mock).mockResolvedValue(testRelayMatch);

          const relayMatch = await matchingService.getRelayMatchById(testRelayMatch.relay_id);
          expect(relayMatch).toEqual(testRelayMatch);
          expect(RelayMatchModel.findById).toHaveBeenCalledWith(testRelayMatch.relay_id);
      });

      it('should throw an error when the relay match does not exist', async () => {
          (RelayMatchModel.findById as jest.Mock).mockResolvedValue(null);

          await expect(matchingService.getRelayMatchById('nonexistent_id')).rejects.toThrow('Relay match with ID nonexistent_id not found');
          expect(RelayMatchModel.findById).toHaveBeenCalledWith('nonexistent_id');
      });
  });

  describe('getMatchesForDriver', () => {
    it('should return matches for a driver with specified statuses', async () => {
      const testMatches = [createTestMatch({ driver_id: 'driver1', status: MatchStatus.ACCEPTED }), createTestMatch({ driver_id: 'driver1', status: MatchStatus.PENDING })];
      (MatchModel.findByDriverAndStatus as jest.Mock).mockResolvedValue(testMatches);

      const matches = await matchingService.getMatchesForDriver('driver1', [MatchStatus.ACCEPTED, MatchStatus.PENDING]);
      expect(matches).toEqual(testMatches);
      expect(MatchModel.findByDriverAndStatus).toHaveBeenCalledWith('driver1', [MatchStatus.ACCEPTED, MatchStatus.PENDING]);
    });

    it('should return all matches for a driver when no statuses are specified', async () => {
      const testMatches = [createTestMatch({ driver_id: 'driver1' }), createTestMatch({ driver_id: 'driver1' })];
      (MatchModel.find as jest.Mock).mockResolvedValue(testMatches);

      const matches = await matchingService.getMatchesForDriver('driver1');
      expect(matches).toEqual(testMatches);
      expect(MatchModel.find).toHaveBeenCalledWith({ driver_id: 'driver1' });
    });
  });

  describe('getMatchesForLoad', () => {
    it('should return matches for a load with specified statuses', async () => {
      const testMatches = [createTestMatch({ load_id: 'load1', status: MatchStatus.ACCEPTED }), createTestMatch({ load_id: 'load1', status: MatchStatus.PENDING })];
      (MatchModel.findByLoadAndStatus as jest.Mock).mockResolvedValue(testMatches);

      const matches = await matchingService.getMatchesForLoad('load1', [MatchStatus.ACCEPTED, MatchStatus.PENDING]);
      expect(matches).toEqual(testMatches);
      expect(MatchModel.findByLoadAndStatus).toHaveBeenCalledWith('load1', [MatchStatus.ACCEPTED, MatchStatus.PENDING]);
    });

    it('should return all matches for a load when no statuses are specified', async () => {
      const testMatches = [createTestMatch({ load_id: 'load1' }), createTestMatch({ load_id: 'load1' })];
      (MatchModel.find as jest.Mock).mockResolvedValue(testMatches);

      const matches = await matchingService.getMatchesForLoad('load1');
      expect(matches).toEqual(testMatches);
      expect(MatchModel.find).toHaveBeenCalledWith({ load_id: 'load1' });
    });
  });

  describe('createMatch', () => {
    it('should create a new match and publish a MATCH_CREATED event', async () => {
      const params = {
        load_id: 'load1',
        driver_id: 'driver1',
        vehicle_id: 'vehicle1',
        match_type: MatchType.DIRECT,
        efficiency_score: 80,
        score_factors: {
          empty_miles_reduction: 0.8,
          network_contribution: 0.7,
          driver_preference_alignment: 0.9,
          time_efficiency: 0.6,
          smart_hub_utilization: 0.5,
          additional_factors: {}
        },
        proposed_rate: 1200
      };
      const testMatch = createTestMatch({ ...params, match_id: 'match1', status: MatchStatus.PENDING });
      (MatchModel.create as jest.Mock).mockResolvedValue(testMatch);

      const match = await matchingService.createMatch(params);
      expect(match).toEqual(testMatch);
      expect(MatchModel.create).toHaveBeenCalledWith(expect.objectContaining({
        load_id: 'load1',
        driver_id: 'driver1',
        vehicle_id: 'vehicle1',
        match_type: MatchType.DIRECT,
        status: MatchStatus.PENDING,
        efficiency_score: 80,
        proposed_rate: 1200
      }));
      expect(eventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({ event_type: EventTypes.MATCH_CREATED }),
        payload: expect.objectContaining({ load_id: 'load1', driver_id: 'driver1', vehicle_id: 'vehicle1' })
      }));
    });
  });

  describe('updateMatch', () => {
    it('should update an existing match and publish a MATCH_UPDATED event', async () => {
      const updates = { status: MatchStatus.ACCEPTED };
      const testMatch = createTestMatch({ match_id: 'match1', status: MatchStatus.ACCEPTED });
      (MatchModel.updateMatchStatus as jest.Mock).mockResolvedValue(testMatch);

      const match = await matchingService.updateMatch('match1', updates);
      expect(match).toEqual(testMatch);
      expect(MatchModel.updateMatchStatus).toHaveBeenCalledWith('match1', MatchStatus.ACCEPTED, updates);
      expect(eventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({ event_type: EventTypes.MATCH_UPDATED }),
        payload: expect.objectContaining({ status: MatchStatus.ACCEPTED })
      }));
    });
  });

  describe('acceptMatch', () => {
    it('should accept a match, convert the reservation, and publish a MATCH_ACCEPTED event', async () => {
      const params = { match_id: 'match1', driver_id: 'driver1', accepted_rate: 1100 };
      const testMatch = createTestMatch({ match_id: 'match1', status: MatchStatus.ACCEPTED, accepted_rate: 1100 });
      (reservationService.getActiveReservationForMatch as jest.Mock).mockResolvedValue({ reservation_id: 'res1' });
      (MatchModel.updateMatchStatus as jest.Mock).mockResolvedValue(testMatch);

      const match = await matchingService.acceptMatch(params);
      expect(match).toEqual(testMatch);
      expect(reservationService.getActiveReservationForMatch).toHaveBeenCalledWith('match1');
      expect(reservationService.convertReservation).toHaveBeenCalledWith('res1');
      expect(MatchModel.updateMatchStatus).toHaveBeenCalledWith('match1', MatchStatus.ACCEPTED, { accepted_rate: 1100 });
      expect(eventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({ event_type: EventTypes.MATCH_ACCEPTED }),
        payload: expect.objectContaining({ driver_id: 'driver1', accepted_rate: 1100 })
      }));
    });

    it('should throw an error if no active reservation is found', async () => {
      (reservationService.getActiveReservationForMatch as jest.Mock).mockResolvedValue(null);

      await expect(matchingService.acceptMatch({ match_id: 'match1', driver_id: 'driver1', accepted_rate: 1100 })).rejects.toThrow('No active reservation found for match match1');
      expect(reservationService.getActiveReservationForMatch).toHaveBeenCalledWith('match1');
    });
  });

  describe('declineMatch', () => {
    it('should decline a match and publish a MATCH_DECLINED event', async () => {
      const params = { match_id: 'match1', driver_id: 'driver1', decline_reason: 'RATE_TOO_LOW', decline_notes: 'Too low' };
      const testMatch = createTestMatch({ match_id: 'match1', status: MatchStatus.DECLINED, decline_reason: 'RATE_TOO_LOW', decline_notes: 'Too low' });
      (MatchModel.updateMatchStatus as jest.Mock).mockResolvedValue(testMatch);

      const match = await matchingService.declineMatch(params);
      expect(match).toEqual(testMatch);
      expect(MatchModel.updateMatchStatus).toHaveBeenCalledWith('match1', MatchStatus.DECLINED, { decline_reason: 'RATE_TOO_LOW', decline_notes: 'Too low' });
      expect(eventProducer.produceEvent).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({ event_type: EventTypes.MATCH_DECLINED }),
        payload: expect.objectContaining({ driver_id: 'driver1', decline_reason: 'RATE_TOO_LOW', decline_notes: 'Too low' })
      }));
    });
  });
});