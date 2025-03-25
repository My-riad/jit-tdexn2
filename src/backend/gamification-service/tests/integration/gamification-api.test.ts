/**
 * Integration tests for the gamification service API endpoints.
 * Tests the end-to-end functionality of achievement, score, leaderboard, reward, and bonus zone features by making HTTP requests to the API and verifying responses.
 */

import request from 'supertest'; // supertest@^6.3.3
import express from 'express'; // express@^4.18.2
import mongoose from 'mongoose'; // mongoose@^7.3.1
import { initializeApp } from '../../src/app';
import AchievementModel from '../../src/models/achievement.model';
import DriverScoreModel from '../../src/models/driver-score.model';
import LeaderboardModel from '../../src/models/leaderboard.model';
import BonusZoneModel from '../../src/models/bonus-zone.model';
import DriverBonusModel from '../../src/models/driver-bonus.model';
import { Achievement, AchievementCategory, AchievementLevel } from '../../../common/interfaces/achievement.interface';
import { DriverScore } from '../../../common/interfaces/driver.interface';
import { LoadAssignment } from '../../../common/interfaces/load.interface';
import { Position } from '../../../common/interfaces/position.interface';
import { StatusCodes } from '../../../common/constants/status-codes';

// Define global variables for the Express app and test data
let app: express.Application;
let testDriver: { id: string, name: string };
let testAchievement: Achievement;
let testLeaderboard: { id: string, type: string, timeframe: string, region: string };
let testBonusZone: { id: string, name: string, boundary: any, multiplier: number };

/**
 * Setup function that runs once before all tests
 */
beforeAll(async () => {
  // Initialize the Express application
  app = initializeApp();

  // Set up test data including drivers, achievements, leaderboards, and bonus zones
  testDriver = { id: 'test-driver-id', name: 'Test Driver' };
  testAchievement = {
    id: 'test-achievement-id',
    name: 'Test Achievement',
    description: 'Test achievement description',
    category: AchievementCategory.EFFICIENCY,
    level: AchievementLevel.BRONZE,
    points: 100,
    badgeImageUrl: 'http://example.com/badge.png',
    criteria: {
      metricType: 'miles_driven',
      threshold: 1000,
      timeframe: 'all_time',
      comparisonOperator: '>=',
      additionalParams: {}
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  testLeaderboard = { id: 'test-leaderboard-id', type: 'weekly', timeframe: 'weekly', region: 'midwest' };
  testBonusZone = { id: 'test-bonus-zone-id', name: 'Test Bonus Zone', boundary: [], multiplier: 1.5 };

  // Store test data references for use in tests
  await AchievementModel.query().insert(testAchievement);
  await LeaderboardModel.query().insert({
    id: testLeaderboard.id,
    name: 'Test Leaderboard',
    leaderboard_type: testLeaderboard.type,
    timeframe: testLeaderboard.timeframe,
    region: testLeaderboard.region,
    start_period: new Date(),
    end_period: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    is_active: true,
    last_updated: new Date(),
    bonus_structure: {}
  });
  await BonusZoneModel.query().insert({
    id: testBonusZone.id,
    name: testBonusZone.name,
    boundary: [],
    multiplier: testBonusZone.multiplier,
    reason: 'Test reason',
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true
  });
});

/**
 * Cleanup function that runs once after all tests
 */
afterAll(async () => {
  // Clean up all test data from the database
  await AchievementModel.query().deleteById(testAchievement.id);
  await DriverScoreModel.query().delete().where('driver_id', testDriver.id);
  await LeaderboardModel.query().deleteById(testLeaderboard.id);
  await BonusZoneModel.query().deleteById(testBonusZone.id);
  await DriverBonusModel.query().delete().where('driverId', testDriver.id);

  // Close database connection
  await mongoose.connection.close();
});

/**
 * Test suite for Achievement API endpoints
 */
describe('Achievement API', () => {
  it('GET /api/v1/achievements should return all achievements', async () => {
    const response = await request(app).get('/api/v1/achievements');
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/achievements/:id should return a specific achievement', async () => {
    const response = await request(app).get(`/api/v1/achievements/${testAchievement.id}`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.id).toBe(testAchievement.id);
  });

  it('POST /api/v1/achievements should create a new achievement', async () => {
    const newAchievement = {
      name: 'New Achievement',
      description: 'New achievement description',
      category: AchievementCategory.NETWORK_CONTRIBUTION,
      level: AchievementLevel.SILVER,
      points: 150,
      badgeImageUrl: 'http://example.com/new_badge.png',
      criteria: {
        metricType: 'loads_completed',
        threshold: 50,
        timeframe: 'monthly',
        comparisonOperator: '>=',
        additionalParams: {}
      },
      isActive: true
    };
    const response = await request(app)
      .post('/api/v1/achievements')
      .send(newAchievement);
    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.name).toBe(newAchievement.name);
    await AchievementModel.query().deleteById(response.body.id);
  });

  it('PUT /api/v1/achievements/:id should update an achievement', async () => {
    const updateData = {
      description: 'Updated achievement description'
    };
    const response = await request(app)
      .put(`/api/v1/achievements/${testAchievement.id}`)
      .send(updateData);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.description).toBe(updateData.description);
  });

  it('DELETE /api/v1/achievements/:id should delete an achievement', async () => {
    const response = await request(app).delete(`/api/v1/achievements/${testAchievement.id}`);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);
  });

  it('GET /api/v1/achievements/category/:category should return achievements by category', async () => {
    const response = await request(app).get(`/api/v1/achievements/category/${AchievementCategory.EFFICIENCY}`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/achievements/level/:level should return achievements by level', async () => {
    const response = await request(app).get(`/api/v1/achievements/level/${AchievementLevel.BRONZE}`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/drivers/:driverId/achievements should return driver achievements', async () => {
    const response = await request(app).get(`/api/v1/achievements/drivers/${testDriver.id}`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('POST /api/v1/drivers/:driverId/achievements/:achievementId should award an achievement', async () => {
    const response = await request(app).post(`/api/v1/achievements/drivers/${testDriver.id}/achievements/${testAchievement.id}`);
    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.driverId).toBe(testDriver.id);
    expect(response.body.achievementId).toBe(testAchievement.id);
    await DriverAchievementModel.query().delete().where('driverId', testDriver.id).where('achievementId', testAchievement.id);
  });
});

describe('Score API', () => {
  it('GET /api/v1/drivers/:driverId/score should return the driver\'s current score', async () => {
    const response = await request(app).get(`/api/v1/scores/${testDriver.id}`);
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('GET /api/v1/drivers/:driverId/score/history should return score history', async () => {
    const response = await request(app).get(`/api/v1/scores/${testDriver.id}/history`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('POST /api/v1/drivers/:driverId/score/calculate should calculate a new score', async () => {
    const loadAssignment = {
      assignment_id: 'test-assignment-id',
      load_id: 'test-load-id',
      driver_id: testDriver.id,
      vehicle_id: 'test-vehicle-id',
      assignment_type: 'direct',
      status: 'completed',
      agreed_rate: 1000,
      efficiency_score: 90
    };
    const response = await request(app)
      .post(`/api/v1/scores/${testDriver.id}/calculate`)
      .send({ loadAssignment });
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('PUT /api/v1/drivers/:driverId/score should update a driver\'s score', async () => {
    const scoreData = {
      empty_miles_score: 80,
      network_contribution_score: 90,
      on_time_score: 95,
      hub_utilization_score: 75,
      fuel_efficiency_score: 85
    };
    const response = await request(app)
      .put(`/api/v1/scores/${testDriver.id}`)
      .send({ scoreData });
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('GET /api/v1/scores/top should return top driver scores', async () => {
    const response = await request(app).get('/api/v1/scores/top?limit=10');
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });
});

describe('Leaderboard API', () => {
  it('GET /api/v1/leaderboards should return all leaderboards', async () => {
    const response = await request(app).get('/api/v1/leaderboards');
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/leaderboards/current should return current active leaderboards', async () => {
    const response = await request(app).get('/api/v1/leaderboards/current');
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/leaderboards/:id should return a specific leaderboard', async () => {
    const response = await request(app).get(`/api/v1/leaderboards/${testLeaderboard.id}`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.id).toBe(testLeaderboard.id);
  });

  it('POST /api/v1/leaderboards should create a new leaderboard', async () => {
    const newLeaderboard = {
      name: 'New Leaderboard',
      leaderboard_type: 'efficiency',
      timeframe: 'monthly',
      start_period: new Date(),
      end_period: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      bonus_structure: {}
    };
    const response = await request(app)
      .post('/api/v1/leaderboards')
      .send(newLeaderboard);
    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.name).toBe(newLeaderboard.name);
    await LeaderboardModel.query().deleteById(response.body.id);
  });

  it('GET /api/v1/leaderboards/:id/entries should return leaderboard entries', async () => {
    const response = await request(app).get(`/api/v1/leaderboards/${testLeaderboard.id}/entries`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/leaderboards/:id/entries/top should return top entries', async () => {
    const response = await request(app).get(`/api/v1/leaderboards/${testLeaderboard.id}/entries/top?limit=10`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/leaderboards/:id/drivers/:driverId should return a driver\'s entry', async () => {
    const response = await request(app).get(`/api/v1/leaderboards/${testLeaderboard.id}/drivers/${testDriver.id}`);
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('POST /api/v1/leaderboards/:id/recalculate should recalculate rankings', async () => {
    const response = await request(app).post(`/api/v1/leaderboards/${testLeaderboard.id}/recalculate`);
    expect(response.status).toBe(StatusCodes.OK);
  });
});

describe('Bonus Zone API', () => {
  it('GET /api/v1/bonus-zones should return all bonus zones', async () => {
    const response = await request(app).get('/api/v1/bonus-zones');
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/bonus-zones/active should return active bonus zones', async () => {
    const response = await request(app).get('/api/v1/bonus-zones/active');
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/bonus-zones/:id should return a specific bonus zone', async () => {
    const response = await request(app).get(`/api/v1/bonus-zones/${testBonusZone.id}`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.id).toBe(testBonusZone.id);
  });

  it('POST /api/v1/bonus-zones should create a new bonus zone', async () => {
    const newBonusZone = {
      name: 'New Bonus Zone',
      boundary: [],
      multiplier: 1.2,
      reason: 'Test reason',
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true
    };
    const response = await request(app)
      .post('/api/v1/bonus-zones')
      .send(newBonusZone);
    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.name).toBe(newBonusZone.name);
    await BonusZoneModel.query().deleteById(response.body.id);
  });

  it('POST /api/v1/bonus-zones/circular should create a circular bonus zone', async () => {
    const circularBonusZone = {
      name: 'Circular Bonus Zone',
      centerLat: 34.0522,
      centerLng: -118.2437,
      radiusKm: 50,
      multiplier: 1.3,
      reason: 'Test reason',
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    const response = await request(app)
      .post('/api/v1/bonus-zones/circular')
      .send(circularBonusZone);
    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.name).toBe(circularBonusZone.name);
    await BonusZoneModel.query().deleteById(response.body.id);
  });

  it('PUT /api/v1/bonus-zones/:id should update a bonus zone', async () => {
    const updateData = {
      multiplier: 1.8
    };
    const response = await request(app)
      .put(`/api/v1/bonus-zones/${testBonusZone.id}`)
      .send(updateData);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.multiplier).toBe(updateData.multiplier);
  });

  it('DELETE /api/v1/bonus-zones/:id should delete a bonus zone', async () => {
    const response = await request(app).delete(`/api/v1/bonus-zones/${testBonusZone.id}`);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);
  });

  it('POST /api/v1/bonus-zones/check-position should check if a position is in a bonus zone', async () => {
    const position = {
      latitude: 34.0522,
      longitude: -118.2437
    };
    const response = await request(app)
      .post('/api/v1/bonus-zones/check-position')
      .send(position);
    expect(response.status).toBe(StatusCodes.OK);
  });
});

describe('Reward API', () => {
  it('GET /api/v1/drivers/:driverId/bonuses should return driver bonuses', async () => {
    const response = await request(app).get(`/api/v1/rewards/drivers/${testDriver.id}/bonuses`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('GET /api/v1/drivers/:driverId/bonuses/unpaid should return unpaid bonuses', async () => {
    const response = await request(app).get(`/api/v1/rewards/drivers/${testDriver.id}/bonuses/unpaid`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('POST /api/v1/drivers/:driverId/bonuses should create a bonus', async () => {
    const bonusData = {
      driverId: testDriver.id,
      zoneId: testBonusZone.id,
      assignmentId: 'test-assignment-id',
      bonusAmount: 50,
      bonusReason: 'Test bonus reason'
    };
    const response = await request(app)
      .post('/api/v1/rewards/bonuses')
      .send(bonusData);
    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.driverId).toBe(testDriver.id);
    await DriverBonusModel.query().deleteById(response.body.id);
  });

  it('PUT /api/v1/bonuses/:bonusId/paid should mark a bonus as paid', async () => {
    const bonusData = {
      driverId: testDriver.id,
      zoneId: testBonusZone.id,
      assignmentId: 'test-assignment-id',
      bonusAmount: 50,
      bonusReason: 'Test bonus reason'
    };
    const createResponse = await request(app)
      .post('/api/v1/rewards/bonuses')
      .send(bonusData);
    const bonusId = createResponse.body.id;
    const response = await request(app).put(`/api/v1/rewards/bonuses/${bonusId}/pay`);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.paid).toBe(true);
    await DriverBonusModel.query().deleteById(bonusId);
  });
});