import request from 'supertest';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import MockRedisClient from 'redis-mock';
import { setupTestDatabase, cleanupTestDatabase } from 'test-database-mock';
import { generateTestToken } from 'jwt-test-utils';
import { mockDriverData, mockLoadData, mockVehicleData, mockMatchData } from 'test-data-utils';

import { initializeApp } from '../../src/app';
import { Match, MatchStatus, MatchType, DeclineReason } from '../../src/interfaces/match.interface';
import { StatusCodes } from '../../../common/constants/status-codes';
import { ErrorCodes } from '../../../common/constants/error-codes';

// Global variables for test environment
let app: express.Application;
let authToken: string;
let adminAuthToken: string;

/**
 * Sets up the test environment before running tests
 */
async function setupTestEnvironment(): Promise<void> {
  // Initialize the Express application with test configuration
  app = await initializeApp({
    environment: 'test',
    dbConfig: {
      use_mock: true
    },
    redisClient: MockRedisClient.createClient()
  });

  // Set up the test database with initial mock data
  await setupTestDatabase({
    drivers: mockDriverData,
    loads: mockLoadData,
    vehicles: mockVehicleData,
    matches: mockMatchData
  });

  // Generate authentication tokens for testing
  authToken = generateTestToken({
    userId: mockDriverData[0].driver_id,
    role: 'driver'
  });
  
  adminAuthToken = generateTestToken({
    userId: 'admin-user-id',
    role: 'admin'
  });

  // Mock external service dependencies
  jest.mock('../../../common/services/optimization-service', () => ({
    generateRecommendations: jest.fn().mockResolvedValue([
      {
        match_id: uuidv4(),
        load_id: mockLoadData[0].load_id,
        driver_id: mockDriverData[0].driver_id,
        match_type: MatchType.DIRECT,
        efficiency_score: 95,
        score_factors: {
          empty_miles_reduction: 80,
          network_contribution: 90,
          driver_preference_alignment: 85,
          time_efficiency: 95,
          smart_hub_utilization: 70,
          additional_factors: {}
        },
        proposed_rate: 1200,
        load_details: {
          origin: 'Chicago, IL',
          destination: 'Detroit, MI',
          pickup_time: new Date(),
          delivery_time: new Date(Date.now() + 86400000),
          equipment_type: 'DRY_VAN',
          weight: 42000
        },
        empty_miles: 15,
        loaded_miles: 304,
        deadhead_percentage: 4.7,
        reservation_expiry: new Date(Date.now() + 3600000)
      }
    ]),
    generateRelayRecommendations: jest.fn().mockResolvedValue({
      relay_id: uuidv4(),
      load_id: mockLoadData[0].load_id,
      segments: [
        {
          segment_id: uuidv4(),
          relay_id: uuidv4(),
          segment_order: 0,
          driver_id: mockDriverData[0].driver_id,
          vehicle_id: mockVehicleData[0].vehicle_id,
          start_location: {
            latitude: 41.8781,
            longitude: -87.6298,
            name: 'Chicago, IL'
          },
          end_location: {
            latitude: 41.4822,
            longitude: -81.6697,
            name: 'Cleveland, OH'
          },
          start_hub_id: null,
          end_hub_id: 'hub-123',
          estimated_distance: 345,
          estimated_duration: 330,
          scheduled_start_time: new Date(),
          scheduled_end_time: new Date(Date.now() + 43200000),
          segment_rate: 650,
          status: MatchStatus.RECOMMENDED
        },
        {
          segment_id: uuidv4(),
          relay_id: uuidv4(),
          segment_order: 1,
          driver_id: mockDriverData[1].driver_id,
          vehicle_id: mockVehicleData[1].vehicle_id,
          start_location: {
            latitude: 41.4822,
            longitude: -81.6697,
            name: 'Cleveland, OH'
          },
          end_location: {
            latitude: 42.3314,
            longitude: -83.0458,
            name: 'Detroit, MI'
          },
          start_hub_id: 'hub-123',
          end_hub_id: null,
          estimated_distance: 170,
          estimated_duration: 160,
          scheduled_start_time: new Date(Date.now() + 43200000),
          scheduled_end_time: new Date(Date.now() + 86400000),
          segment_rate: 350,
          status: MatchStatus.RECOMMENDED
        }
      ],
      total_efficiency_score: 92,
      status: MatchStatus.RECOMMENDED,
      created_at: new Date(),
      updated_at: new Date()
    })
  }));
}

/**
 * Cleans up the test environment after running tests
 */
async function cleanupTestEnvironment(): Promise<void> {
  // Clean up the test database
  await cleanupTestDatabase();
  
  // Reset mocked services
  jest.resetAllMocks();
}

describe('Match API Integration Tests', () => {
  beforeAll(setupTestEnvironment);
  afterAll(cleanupTestEnvironment);

  test('GET /api/v1/matches/:matchId - should return a match by ID', async () => {
    const matchId = mockMatchData[0].match_id;
    
    const response = await request(app)
      .get(`/api/v1/matches/${matchId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(response.body.match_id).toBe(matchId);
    expect(response.body.load_id).toBe(mockMatchData[0].load_id);
    expect(response.body.driver_id).toBe(mockMatchData[0].driver_id);
  });

  test('GET /api/v1/matches/:matchId - should return 404 for non-existent match', async () => {
    const nonExistentMatchId = uuidv4();
    
    const response = await request(app)
      .get(`/api/v1/matches/${nonExistentMatchId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(StatusCodes.NOT_FOUND);
    
    expect(response.body).toBeDefined();
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe(ErrorCodes.RES_LOAD_NOT_FOUND);
  });

  test('GET /api/v1/drivers/:driverId/matches - should return matches for a driver', async () => {
    const driverId = mockDriverData[0].driver_id;
    
    const response = await request(app)
      .get(`/api/v1/drivers/${driverId}/matches`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
    // Filter mock data to find matches for this driver
    const expectedMatches = mockMatchData.filter(match => match.driver_id === driverId);
    expect(response.body.length).toBe(expectedMatches.length);
    // Verify first match data
    if (expectedMatches.length > 0) {
      expect(response.body[0].driver_id).toBe(driverId);
    }
  });

  test('GET /api/v1/drivers/:driverId/matches - should filter by status', async () => {
    const driverId = mockDriverData[0].driver_id;
    const status = MatchStatus.ACCEPTED;
    
    const response = await request(app)
      .get(`/api/v1/drivers/${driverId}/matches?status=${status}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
    // Verify all returned matches have the requested status
    response.body.forEach((match: Match) => {
      expect(match.status).toBe(status);
    });
  });

  test('GET /api/v1/loads/:loadId/matches - should return matches for a load', async () => {
    const loadId = mockLoadData[0].load_id;
    
    const response = await request(app)
      .get(`/api/v1/loads/${loadId}/matches`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
    // Filter mock data to find matches for this load
    const expectedMatches = mockMatchData.filter(match => match.load_id === loadId);
    expect(response.body.length).toBe(expectedMatches.length);
    // Verify first match data
    if (expectedMatches.length > 0) {
      expect(response.body[0].load_id).toBe(loadId);
    }
  });

  test('POST /api/v1/matches - should create a new match', async () => {
    const newMatch = {
      load_id: mockLoadData[1].load_id,
      driver_id: mockDriverData[1].driver_id,
      vehicle_id: mockVehicleData[1].vehicle_id,
      match_type: MatchType.DIRECT,
      efficiency_score: 88,
      score_factors: {
        empty_miles_reduction: 75,
        network_contribution: 85,
        driver_preference_alignment: 80,
        time_efficiency: 90,
        smart_hub_utilization: 65,
        additional_factors: {}
      },
      proposed_rate: 1150
    };
    
    const response = await request(app)
      .post('/api/v1/matches')
      .set('Authorization', `Bearer ${adminAuthToken}`)
      .send(newMatch)
      .expect(StatusCodes.CREATED);
    
    expect(response.body).toBeDefined();
    expect(response.body.match_id).toBeDefined();
    expect(response.body.load_id).toBe(newMatch.load_id);
    expect(response.body.driver_id).toBe(newMatch.driver_id);
    expect(response.body.vehicle_id).toBe(newMatch.vehicle_id);
    expect(response.body.status).toBe(MatchStatus.PENDING);
    expect(response.body.efficiency_score).toBe(newMatch.efficiency_score);
  });

  test('POST /api/v1/matches - should return 400 for invalid match data', async () => {
    const invalidMatch = {
      // Missing required fields
      load_id: mockLoadData[1].load_id,
      // No driver_id
      vehicle_id: mockVehicleData[1].vehicle_id
    };
    
    const response = await request(app)
      .post('/api/v1/matches')
      .set('Authorization', `Bearer ${adminAuthToken}`)
      .send(invalidMatch)
      .expect(StatusCodes.BAD_REQUEST);
    
    expect(response.body).toBeDefined();
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe(ErrorCodes.VAL_MISSING_FIELD);
  });

  test('PUT /api/v1/matches/:matchId - should update an existing match', async () => {
    const matchId = mockMatchData[0].match_id;
    const updateData = {
      status: MatchStatus.RECOMMENDED,
      proposed_rate: 1250
    };
    
    const response = await request(app)
      .put(`/api/v1/matches/${matchId}`)
      .set('Authorization', `Bearer ${adminAuthToken}`)
      .send(updateData)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(response.body.match_id).toBe(matchId);
    expect(response.body.status).toBe(updateData.status);
    expect(response.body.proposed_rate).toBe(updateData.proposed_rate);
  });

  test('POST /api/v1/matches/:matchId/accept - should accept a match', async () => {
    // Use a match that's in RECOMMENDED or RESERVED status
    const matchToAccept = mockMatchData.find(
      match => match.status === MatchStatus.RECOMMENDED || match.status === MatchStatus.RESERVED
    );
    
    if (!matchToAccept) {
      throw new Error('No suitable match found for acceptance test');
    }
    
    const acceptData = {
      driver_id: matchToAccept.driver_id,
      accepted_rate: matchToAccept.proposed_rate
    };
    
    const response = await request(app)
      .post(`/api/v1/matches/${matchToAccept.match_id}/accept`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(acceptData)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(response.body.match_id).toBe(matchToAccept.match_id);
    expect(response.body.status).toBe(MatchStatus.ACCEPTED);
    expect(response.body.accepted_rate).toBe(acceptData.accepted_rate);
  });

  test('POST /api/v1/matches/:matchId/decline - should decline a match', async () => {
    // Use a match that's in RECOMMENDED or RESERVED status
    const matchToDecline = mockMatchData.find(
      match => match.status === MatchStatus.RECOMMENDED || match.status === MatchStatus.RESERVED
    );
    
    if (!matchToDecline) {
      throw new Error('No suitable match found for decline test');
    }
    
    const declineData = {
      driver_id: matchToDecline.driver_id,
      decline_reason: DeclineReason.RATE_TOO_LOW,
      decline_notes: 'Rate is below my minimum threshold'
    };
    
    const response = await request(app)
      .post(`/api/v1/matches/${matchToDecline.match_id}/decline`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(declineData)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(response.body.match_id).toBe(matchToDecline.match_id);
    expect(response.body.status).toBe(MatchStatus.DECLINED);
    expect(response.body.decline_reason).toBe(declineData.decline_reason);
    expect(response.body.decline_notes).toBe(declineData.decline_notes);
  });

  test('POST /api/v1/matches/:matchId/reserve - should reserve a match', async () => {
    // Use a match that's in RECOMMENDED status
    const matchToReserve = mockMatchData.find(match => match.status === MatchStatus.RECOMMENDED);
    
    if (!matchToReserve) {
      throw new Error('No suitable match found for reservation test');
    }
    
    const reserveData = {
      driver_id: matchToReserve.driver_id,
      expiration_minutes: 30
    };
    
    const response = await request(app)
      .post(`/api/v1/matches/${matchToReserve.match_id}/reserve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(reserveData)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(response.body.match_id).toBe(matchToReserve.match_id);
    expect(response.body.status).toBe(MatchStatus.RESERVED);
    expect(response.body.reservation_expiry).toBeDefined();
    
    // Verify expiry time is roughly 30 minutes in the future
    const expiryTime = new Date(response.body.reservation_expiry).getTime();
    const expectedTime = Date.now() + reserveData.expiration_minutes * 60 * 1000;
    expect(expiryTime).toBeGreaterThan(expectedTime - 5000); // Allow 5 second buffer
    expect(expiryTime).toBeLessThan(expectedTime + 5000); // Allow 5 second buffer
  });

  test('POST /api/v1/recommendations/generate - should generate load recommendations', async () => {
    const recommendationRequest = {
      driver_id: mockDriverData[0].driver_id,
      current_location: {
        latitude: 41.8781,
        longitude: -87.6298
      },
      available_hours: 11,
      equipment_type: 'DRY_VAN',
      max_distance: 500,
      min_rate: 2.5,
      preferred_regions: ['MIDWEST', 'NORTHEAST'],
      limit: 10
    };
    
    const response = await request(app)
      .post('/api/v1/recommendations/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send(recommendationRequest)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Verify first recommendation structure
    const firstRecommendation = response.body[0];
    expect(firstRecommendation.match_id).toBeDefined();
    expect(firstRecommendation.load_id).toBeDefined();
    expect(firstRecommendation.driver_id).toBe(recommendationRequest.driver_id);
    expect(firstRecommendation.efficiency_score).toBeDefined();
    expect(firstRecommendation.proposed_rate).toBeDefined();
    expect(firstRecommendation.load_details).toBeDefined();
    expect(firstRecommendation.empty_miles).toBeDefined();
    expect(firstRecommendation.loaded_miles).toBeDefined();
    expect(firstRecommendation.deadhead_percentage).toBeDefined();
  });

  test('POST /api/v1/recommendations/relay/generate - should generate relay recommendations', async () => {
    const relayRequest = {
      load_id: mockLoadData[0].load_id,
      max_segments: 2,
      max_hub_distance: 10 // miles from route
    };
    
    const response = await request(app)
      .post('/api/v1/recommendations/relay/generate')
      .set('Authorization', `Bearer ${adminAuthToken}`)
      .send(relayRequest)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(response.body.relay_id).toBeDefined();
    expect(response.body.load_id).toBe(relayRequest.load_id);
    expect(Array.isArray(response.body.segments)).toBe(true);
    expect(response.body.segments.length).toBeGreaterThan(0);
    expect(response.body.segments.length).toBeLessThanOrEqual(relayRequest.max_segments);
    
    // Verify segment structure
    const firstSegment = response.body.segments[0];
    expect(firstSegment.segment_id).toBeDefined();
    expect(firstSegment.relay_id).toBeDefined();
    expect(firstSegment.segment_order).toBeDefined();
    expect(firstSegment.driver_id).toBeDefined();
    expect(firstSegment.start_location).toBeDefined();
    expect(firstSegment.end_location).toBeDefined();
    expect(firstSegment.estimated_distance).toBeDefined();
    expect(firstSegment.estimated_duration).toBeDefined();
    expect(firstSegment.segment_rate).toBeDefined();
  });

  test('GET /api/v1/drivers/:driverId/recommendations - should get active recommendations', async () => {
    const driverId = mockDriverData[0].driver_id;
    
    const response = await request(app)
      .get(`/api/v1/drivers/${driverId}/recommendations`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
    
    // Verify recommendations are for this driver
    if (response.body.length > 0) {
      response.body.forEach((recommendation: any) => {
        expect(recommendation.driver_id).toBe(driverId);
        expect(recommendation.status).toBe(MatchStatus.RECOMMENDED);
      });
    }
  });

  test('PUT /api/v1/recommendations/:recommendationId/view - should mark recommendation as viewed', async () => {
    // Find a recommendation in RECOMMENDED status
    const recommendationToView = mockMatchData.find(match => match.status === MatchStatus.RECOMMENDED);
    
    if (!recommendationToView) {
      throw new Error('No suitable recommendation found for view test');
    }
    
    const response = await request(app)
      .put(`/api/v1/recommendations/${recommendationToView.match_id}/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(response.body.match_id).toBe(recommendationToView.match_id);
    expect(response.body.viewed_at).toBeDefined();
  });

  test('GET /api/v1/statistics - should return match statistics', async () => {
    const response = await request(app)
      .get('/api/v1/statistics')
      .set('Authorization', `Bearer ${adminAuthToken}`)
      .expect(StatusCodes.OK);
    
    expect(response.body).toBeDefined();
    expect(response.body.total_matches).toBeDefined();
    expect(response.body.matches_by_status).toBeDefined();
    expect(response.body.acceptance_rate).toBeDefined();
    expect(response.body.average_efficiency_score).toBeDefined();
    expect(response.body.total_empty_miles_saved).toBeDefined();
  });
});