import express, { Router } from 'express'; // express v4.17.1
import ScoreController from '../controllers/score.controller';
import ScoreService from '../services/score.service';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import AchievementEventsProducer from '../producers/achievement-events.producer';

/**
 * Creates and configures the Express router for score-related endpoints
 * @param scoreService scoreService
 * @param eventProducer eventProducer
 * @returns Configured Express router with score endpoints
 */
export const createScoreRoutes = (scoreService: ScoreService, eventProducer: AchievementEventsProducer): Router => {
  // Create a new Express Router instance
  const router = express.Router();

  // Initialize the ScoreController with the provided scoreService and eventProducer
  const scoreController = new ScoreController(scoreService);

  // Define route for getting a driver's current score
  router.get('/:driverId', authenticate, scoreController.getDriverScore);

  // Define route for getting a driver's score history
  router.get('/:driverId/history', authenticate, scoreController.getDriverScoreHistory);

  // Define route for getting a driver's scores by date range
  router.get('/:driverId/range', authenticate, scoreController.getDriverScoresByDateRange);

  // Define route for calculating a score for a completed load
  router.post('/:driverId/calculate', authenticate, scoreController.calculateScoreForLoad);

  // Define route for calculating a historical score
  router.post('/:driverId/historical', authenticate, scoreController.calculateHistoricalScore);

  // Define route for updating a driver's score
  router.put('/:driverId', authenticate, scoreController.updateDriverScore);

  // Define route for recalculating scores for multiple drivers
  router.post('/recalculate', authenticate, scoreController.recalculateDriverScores);

  // Define route for getting top scores
  router.get('/top', authenticate, scoreController.getTopScores);

  // Return the configured router
  return router;
};

export default createScoreRoutes;