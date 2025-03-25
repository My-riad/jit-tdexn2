import { Router } from 'express'; // express v4.18.2
import { RewardController } from '../controllers/reward.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { EventProducer } from '../../../common/interfaces/event.interface';

/**
 * Creates and configures an Express router for reward-related endpoints
 * @param {EventProducer} eventProducer
 * @returns {Router} Configured Express router with reward endpoints
 */
export const createRewardRouter = (eventProducer: EventProducer): Router => {
  // Create a new Express router instance
  const router = Router();

  // Initialize a RewardController instance with the provided eventProducer
  const rewardController = new RewardController(new RewardController(null, eventProducer), eventProducer);

  // Configure routes with appropriate middleware and controller methods
  // Route to get all bonuses for a specific driver with optional filtering
  router.get('/drivers/:driverId/bonuses', authenticate, rewardController.getDriverBonuses.bind(rewardController));

  // Route to get a specific bonus by ID
  router.get('/bonuses/:bonusId', authenticate, rewardController.getDriverBonusById.bind(rewardController));

  // Route to get all unpaid bonuses for a specific driver
  router.get('/drivers/:driverId/unpaid-bonuses', authenticate, rewardController.getUnpaidBonusesForDriver.bind(rewardController));

  // Route to get the total amount of unpaid bonuses for a driver
  router.get('/drivers/:driverId/unpaid-amount', authenticate, rewardController.getTotalUnpaidAmount.bind(rewardController));

  // Route to create a new bonus for a driver
  router.post('/bonuses', authenticate, rewardController.createBonusForDriver.bind(rewardController));

  // Route to mark a bonus as paid
  router.put('/bonuses/:bonusId/pay', authenticate, rewardController.markBonusAsPaid.bind(rewardController));

  // Route to process rewards for top-ranked drivers in a leaderboard
  router.post('/leaderboards/:leaderboardId/process-rewards', authenticate, rewardController.processLeaderboardRewards.bind(rewardController));

  // Route to process rewards for newly earned achievements
  router.post('/achievements/process-rewards', authenticate, rewardController.processAchievementRewards.bind(rewardController));

  // Route to process rewards for drivers operating in bonus zones
  router.post('/bonus-zones/process-rewards', authenticate, rewardController.processBonusZoneRewards.bind(rewardController));

  // Route to process rewards for completing a load assignment
  router.post('/loads/process-completion-rewards', authenticate, rewardController.processLoadCompletionRewards.bind(rewardController));

  // Route to get fuel discount rewards based on driver efficiency score
  router.get('/drivers/:driverId/fuel-discounts', authenticate, rewardController.processFuelDiscountRewards.bind(rewardController));

   // Route to process weekly bonuses for all active weekly leaderboards
   router.post('/weekly-bonuses/process', authenticate, rewardController.processWeeklyBonuses.bind(rewardController));

   // Route to process monthly bonuses for all active monthly leaderboards
   router.post('/monthly-bonuses/process', authenticate, rewardController.processMonthlyBonuses.bind(rewardController));

   // Route to get a summary of all rewards for a driver within a date range
   router.get('/drivers/:driverId/reward-summary', authenticate, rewardController.getDriverRewardSummary.bind(rewardController));

   // Route to check if a driver has access to premium loads based on their efficiency score
   router.get('/drivers/:driverId/premium-load-access', authenticate, rewardController.checkPremiumLoadAccess.bind(rewardController));

    // Route to process the redemption of a non-monetary reward like fuel discounts
    router.post('/rewards/redeem', authenticate, rewardController.redeemReward.bind(rewardController));

  // Return the configured router
  return router;
};

// Factory function to create the reward router with proper dependencies
export default createRewardRouter;