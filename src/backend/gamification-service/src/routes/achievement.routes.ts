import express from 'express'; // express@^4.18.2
import { AchievementController } from '../controllers/achievement.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import AchievementService from '../services/achievement.service';
import AchievementEventsProducer from '../producers/achievement-events.producer';

/**
 * Configures and exports an Express router with all achievement-related routes
 * @param {AchievementService} achievementService - The achievement service
 * @param {AchievementEventsProducer} achievementEventsProducer - The achievement events producer
 * @returns {express.Router} Configured Express router with achievement routes
 */
const configureAchievementRoutes = (
  achievementService: AchievementService,
  achievementEventsProducer: AchievementEventsProducer
): express.Router => {
  // Create a new Express router instance
  const router = express.Router();

  // Create an instance of AchievementController with the provided services
  const achievementController = new AchievementController(achievementService, achievementEventsProducer);

  // Define routes for achievement management (CRUD operations)
  router.post(
    '/',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.createAchievement(req, res, next);
    }
  );

  router.get(
    '/:id',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.getAchievementById(req, res, next);
    }
  );

  router.get(
    '/',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.getAllAchievements(req, res, next);
    }
  );

  router.put(
    '/:id',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.updateAchievement(req, res, next);
    }
  );

  router.delete(
    '/:id',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.deleteAchievement(req, res, next);
    }
  );

  // Define routes for driver achievement management
  router.get(
    '/driver/:driverId',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.getDriverAchievements(req, res, next);
    }
  );

  router.post(
    '/driver/:driverId/award/:achievementId',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.awardAchievement(req, res, next);
    }
  );

  router.delete(
    '/driver/:driverId/revoke/:achievementId',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.revokeAchievement(req, res, next);
    }
  );

  // Define routes for achievement progress tracking
  router.get(
    '/driver/:driverId/progress',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.getDriverAchievementProgress(req, res, next);
    }
  );

  router.post(
    '/driver/:driverId/check',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.checkAchievements(req, res, next);
    }
  );

  router.post(
    '/driver/:driverId/process',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.processDriverActivity(req, res, next);
    }
  );

  // Define routes for achievement categories and levels
  router.get(
    '/category/:category',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.getAchievementsByCategory(req, res, next);
    }
  );

  router.get(
    '/level/:level',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.getAchievementsByLevel(req, res, next);
    }
  );

  // Define routes for top achievers
  router.get(
    '/top/achievers',
    authenticate,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      achievementController.getTopAchievers(req, res, next);
    }
  );

  // Return the configured router
  return router;
};

// Export the route configuration function for use in app.ts
export default configureAchievementRoutes;