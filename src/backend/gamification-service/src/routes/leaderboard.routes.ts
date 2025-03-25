import express, { Router } from 'express'; // express ^4.18.2
import Joi from 'joi'; // joi ^17.9.2

import LeaderboardController from '../controllers/leaderboard.controller';
import LeaderboardService from '../services/leaderboard.service';
import AchievementEventsProducer from '../producers/achievement-events.producer';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';

/**
 * Validation schemas for leaderboard requests
 */
const leaderboardSchemas = {
  getLeaderboards: Joi.object({
    leaderboardType: Joi.string().optional().description('Filter by leaderboard type'),
    timeframe: Joi.string().optional().description('Filter by timeframe'),
    region: Joi.string().optional().description('Filter by region')
  }),
  getCurrentLeaderboards: Joi.object({
    leaderboardType: Joi.string().optional().description('Filter by leaderboard type'),
    timeframe: Joi.string().optional().description('Filter by timeframe'),
    region: Joi.string().optional().description('Filter by region'),
    date: Joi.date().iso().optional().description('Date to check for active leaderboards')
  }),
  leaderboardId: Joi.object({
    leaderboardId: Joi.string().uuid().required().description('Leaderboard ID')
  }),
  createLeaderboard: Joi.object({
    name: Joi.string().required().description('Leaderboard name'),
    leaderboard_type: Joi.string().required().description('Leaderboard type'),
    timeframe: Joi.string().required().description('Leaderboard timeframe'),
    region: Joi.string().optional().description('Leaderboard region'),
    start_period: Joi.date().iso().required().description('Leaderboard start period'),
    end_period: Joi.date().iso().required().description('Leaderboard end period'),
    bonus_structure: Joi.object().optional().description('Bonus structure for the leaderboard')
  }),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional().description('Page number'),
    pageSize: Joi.number().integer().min(1).max(100).optional().description('Page size')
  }),
  limit: Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional().description('Limit number of entries')
  }),
  leaderboardDriverId: Joi.object({
    leaderboardId: Joi.string().uuid().required().description('Leaderboard ID'),
    driverId: Joi.string().uuid().required().description('Driver ID')
  }),
  driverId: Joi.object({
    driverId: Joi.string().uuid().required().description('Driver ID')
  }),
  driverLeaderboardsQuery: Joi.object({
    page: Joi.number().integer().min(1).optional().description('Page number'),
    pageSize: Joi.number().integer().min(1).max(100).optional().description('Page size'),
    timeframe: Joi.string().optional().description('Filter by timeframe'),
    leaderboardType: Joi.string().optional().description('Filter by leaderboard type'),
    region: Joi.string().optional().description('Filter by region'),
    startDate: Joi.date().iso().optional().description('Filter by start date'),
    endDate: Joi.date().iso().optional().description('Filter by end date')
  }),
  daysThreshold: Joi.object({
    daysThreshold: Joi.number().integer().min(1).max(30).optional().description('Days threshold for ending leaderboards')
  })
};

/**
 * Configures and returns an Express router with all leaderboard-related routes
 * @param   {LeaderboardService} leaderboardService - leaderboardService
 * @param   {AchievementEventsProducer} eventProducer - eventProducer
 * @returns {express.Router} Configured Express router with leaderboard routes
 */
const configureLeaderboardRoutes = (leaderboardService: LeaderboardService, eventProducer: AchievementEventsProducer): Router => {
  // Create a new Express router instance
  const router = express.Router();

  // Initialize the LeaderboardController with the provided services
  const leaderboardController = new LeaderboardController(leaderboardService, eventProducer);

  // Define routes for leaderboard operations with appropriate middleware
  router.get('/',
    authenticate,
    validateQuery(leaderboardSchemas.getLeaderboards),
    leaderboardController.getLeaderboards.bind(leaderboardController)
  );

  router.get('/current',
    authenticate,
    validateQuery(leaderboardSchemas.getCurrentLeaderboards),
    leaderboardController.getCurrentLeaderboards.bind(leaderboardController)
  );

  router.get('/:leaderboardId',
    authenticate,
    validateParams(leaderboardSchemas.leaderboardId),
    leaderboardController.getLeaderboardById.bind(leaderboardController)
  );

  router.post('/',
    authenticate,
    validateBody(leaderboardSchemas.createLeaderboard),
    leaderboardController.createLeaderboard.bind(leaderboardController)
  );

  router.get('/:leaderboardId/entries',
    authenticate,
    validateParams(leaderboardSchemas.leaderboardId),
    validateQuery(leaderboardSchemas.pagination),
    leaderboardController.getLeaderboardEntries.bind(leaderboardController)
  );

  router.get('/:leaderboardId/top',
    authenticate,
    validateParams(leaderboardSchemas.leaderboardId),
    validateQuery(leaderboardSchemas.limit),
    leaderboardController.getTopLeaderboardEntries.bind(leaderboardController)
  );

  router.get('/:leaderboardId/drivers/:driverId',
    authenticate,
    validateParams(leaderboardSchemas.leaderboardDriverId),
    leaderboardController.getDriverLeaderboardEntry.bind(leaderboardController)
  );

  router.get('/drivers/:driverId',
    authenticate,
    validateParams(leaderboardSchemas.driverId),
    validateQuery(leaderboardSchemas.driverLeaderboardsQuery),
    leaderboardController.getDriverLeaderboardEntries.bind(leaderboardController)
  );

  router.post('/:leaderboardId/recalculate',
    authenticate,
    validateParams(leaderboardSchemas.leaderboardId),
    leaderboardController.recalculateLeaderboard.bind(leaderboardController)
  );

  router.post('/:leaderboardId/finalize',
    authenticate,
    validateParams(leaderboardSchemas.leaderboardId),
    leaderboardController.finalizeLeaderboard.bind(leaderboardController)
  );

  router.post('/:leaderboardId/process-bonuses',
    authenticate,
    validateParams(leaderboardSchemas.leaderboardId),
    leaderboardController.processBonusPayments.bind(leaderboardController)
  );

  router.post('/:leaderboardId/next-period',
    authenticate,
    validateParams(leaderboardSchemas.leaderboardId),
    leaderboardController.createNextPeriodLeaderboard.bind(leaderboardController)
  );

  router.post('/process-ending',
    authenticate,
    validateQuery(leaderboardSchemas.daysThreshold),
    leaderboardController.processEndingLeaderboards.bind(leaderboardController)
  );

  // Return the configured router
  return router;
};

// Export the route configuration function for use in app.ts
export default configureLeaderboardRoutes;