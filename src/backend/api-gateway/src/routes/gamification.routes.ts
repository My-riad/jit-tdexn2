import express from 'express';
import axios from 'axios'; // axios@1.4.0

import { authenticate } from '../middleware/authentication';
import { authenticatedApiRateLimiter } from '../middleware/rate-limiter';
import { requestValidator } from '../middleware/request-validator';
import { ServiceRegistry, SERVICES } from '../config';
import logger from '../../../common/utils/logger';

// Create an Express router
const router = express.Router();

/**
 * Sets up routes for driver score management
 * 
 * @param router Express router to attach routes to
 */
const setupScoreRoutes = (router: express.Router): void => {
  // GET a driver's current score
  router.get(
    '/scores/:driverId',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/scores/${req.params.driverId}`, 'GET');
    }
  );

  // GET a driver's score history
  router.get(
    '/scores/:driverId/history',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/scores/${req.params.driverId}/history`, 'GET');
    }
  );

  // GET a driver's score by date range
  router.get(
    '/scores/:driverId/range',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/scores/${req.params.driverId}/range`, 'GET');
    }
  );

  // POST calculate a new score for a driver
  router.post(
    '/scores/calculate',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, '/scores/calculate', 'POST');
    }
  );

  // POST calculate historical scores
  router.post(
    '/scores/calculate-historical',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, '/scores/calculate-historical', 'POST');
    }
  );

  // PUT update a driver's score
  router.put(
    '/scores/:driverId',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, `/scores/${req.params.driverId}`, 'PUT');
    }
  );

  // POST recalculate scores for multiple drivers
  router.post(
    '/scores/recalculate-batch',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, '/scores/recalculate-batch', 'POST');
    }
  );

  // GET top driver scores
  router.get(
    '/scores/top',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/scores/top', 'GET');
    }
  );

  // GET a driver's rank
  router.get(
    '/scores/:driverId/rank',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/scores/${req.params.driverId}/rank`, 'GET');
    }
  );

  // GET a driver's score percentile
  router.get(
    '/scores/:driverId/percentile',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/scores/${req.params.driverId}/percentile`, 'GET');
    }
  );

  // GET score distribution data
  router.get(
    '/scores/distribution',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/scores/distribution', 'GET');
    }
  );
};

/**
 * Sets up routes for achievement management
 * 
 * @param router Express router to attach routes to
 */
const setupAchievementRoutes = (router: express.Router): void => {
  // POST create a new achievement
  router.post(
    '/achievements',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, '/achievements', 'POST');
    }
  );

  // GET all achievements
  router.get(
    '/achievements',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/achievements', 'GET');
    }
  );

  // GET an achievement by ID
  router.get(
    '/achievements/:achievementId',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/achievements/${req.params.achievementId}`, 'GET');
    }
  );

  // PUT update an achievement
  router.put(
    '/achievements/:achievementId',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, `/achievements/${req.params.achievementId}`, 'PUT');
    }
  );

  // DELETE an achievement
  router.delete(
    '/achievements/:achievementId',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/achievements/${req.params.achievementId}`, 'DELETE');
    }
  );

  // GET a driver's achievements
  router.get(
    '/achievements/driver/:driverId',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/achievements/driver/${req.params.driverId}`, 'GET');
    }
  );

  // GET a driver's achievement progress
  router.get(
    '/achievements/driver/:driverId/progress',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/achievements/driver/${req.params.driverId}/progress`, 'GET');
    }
  );

  // POST award an achievement to a driver
  router.post(
    '/achievements/:achievementId/award/:driverId',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, `/achievements/${req.params.achievementId}/award/${req.params.driverId}`, 'POST');
    }
  );

  // DELETE revoke an achievement from a driver
  router.delete(
    '/achievements/:achievementId/revoke/:driverId',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/achievements/${req.params.achievementId}/revoke/${req.params.driverId}`, 'DELETE');
    }
  );
};

/**
 * Sets up routes for leaderboard management
 * 
 * @param router Express router to attach routes to
 */
const setupLeaderboardRoutes = (router: express.Router): void => {
  // POST create a new leaderboard
  router.post(
    '/leaderboards',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, '/leaderboards', 'POST');
    }
  );

  // GET all leaderboards
  router.get(
    '/leaderboards',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/leaderboards', 'GET');
    }
  );

  // GET active leaderboards
  router.get(
    '/leaderboards/active',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/leaderboards/active', 'GET');
    }
  );

  // GET a leaderboard by ID
  router.get(
    '/leaderboards/:leaderboardId',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/${req.params.leaderboardId}`, 'GET');
    }
  );

  // PUT update a leaderboard
  router.put(
    '/leaderboards/:leaderboardId',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/${req.params.leaderboardId}`, 'PUT');
    }
  );

  // PUT deactivate a leaderboard
  router.put(
    '/leaderboards/:leaderboardId/deactivate',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/${req.params.leaderboardId}/deactivate`, 'PUT');
    }
  );

  // GET leaderboard entries
  router.get(
    '/leaderboards/:leaderboardId/entries',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/${req.params.leaderboardId}/entries`, 'GET');
    }
  );

  // GET top leaderboard entries
  router.get(
    '/leaderboards/:leaderboardId/top',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/${req.params.leaderboardId}/top`, 'GET');
    }
  );

  // PUT update leaderboard rankings
  router.put(
    '/leaderboards/:leaderboardId/update-rankings',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/${req.params.leaderboardId}/update-rankings`, 'PUT');
    }
  );

  // PUT award bonuses to top drivers
  router.put(
    '/leaderboards/:leaderboardId/award-bonuses',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/${req.params.leaderboardId}/award-bonuses`, 'PUT');
    }
  );

  // GET a driver's rank in a leaderboard
  router.get(
    '/leaderboards/:leaderboardId/driver/:driverId/rank',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/${req.params.leaderboardId}/driver/${req.params.driverId}/rank`, 'GET');
    }
  );

  // GET a driver's leaderboard entries
  router.get(
    '/leaderboards/driver/:driverId/entries',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/leaderboards/driver/${req.params.driverId}/entries`, 'GET');
    }
  );

  // PUT update all active leaderboards
  router.put(
    '/leaderboards/active/update',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/leaderboards/active/update', 'PUT');
    }
  );

  // POST generate next period leaderboards
  router.post(
    '/leaderboards/generate-next',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, '/leaderboards/generate-next', 'POST');
    }
  );
};

/**
 * Sets up routes for bonus zone management
 * 
 * @param router Express router to attach routes to
 */
const setupBonusZoneRoutes = (router: express.Router): void => {
  // POST create a new bonus zone
  router.post(
    '/bonus-zones',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, '/bonus-zones', 'POST');
    }
  );

  // GET all bonus zones
  router.get(
    '/bonus-zones',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/bonus-zones', 'GET');
    }
  );

  // GET active bonus zones
  router.get(
    '/bonus-zones/active',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/bonus-zones/active', 'GET');
    }
  );

  // GET a bonus zone by ID
  router.get(
    '/bonus-zones/:zoneId',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/bonus-zones/${req.params.zoneId}`, 'GET');
    }
  );

  // PUT update a bonus zone
  router.put(
    '/bonus-zones/:zoneId',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, `/bonus-zones/${req.params.zoneId}`, 'PUT');
    }
  );

  // PUT deactivate a bonus zone
  router.put(
    '/bonus-zones/:zoneId/deactivate',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/bonus-zones/${req.params.zoneId}/deactivate`, 'PUT');
    }
  );

  // GET bonus zones by location
  router.get(
    '/bonus-zones/location',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/bonus-zones/location', 'GET');
    }
  );

  // GET a driver's bonus history
  router.get(
    '/bonus-zones/driver/:driverId/history',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/bonus-zones/driver/${req.params.driverId}/history`, 'GET');
    }
  );

  // POST award a bonus to a driver
  router.post(
    '/bonus-zones/:zoneId/award/:driverId',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, `/bonus-zones/${req.params.zoneId}/award/${req.params.driverId}`, 'POST');
    }
  );
};

/**
 * Sets up routes for reward management
 * 
 * @param router Express router to attach routes to
 */
const setupRewardRoutes = (router: express.Router): void => {
  // GET available rewards
  router.get(
    '/rewards',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/rewards', 'GET');
    }
  );

  // GET a driver's rewards
  router.get(
    '/rewards/driver/:driverId',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, `/rewards/driver/${req.params.driverId}`, 'GET');
    }
  );

  // POST redeem a reward
  router.post(
    '/rewards/:rewardId/redeem',
    authenticate,
    authenticatedApiRateLimiter(),
    requestValidator(),
    async (req, res) => {
      await proxyRequest(req, res, `/rewards/${req.params.rewardId}/redeem`, 'POST');
    }
  );

  // GET reward history
  router.get(
    '/rewards/history',
    authenticate,
    authenticatedApiRateLimiter(),
    async (req, res) => {
      await proxyRequest(req, res, '/rewards/history', 'GET');
    }
  );
};

/**
 * Proxies a request to the gamification service
 * 
 * @param req Express request object
 * @param res Express response object
 * @param path Path to forward the request to
 * @param method HTTP method to use
 */
const proxyRequest = async (
  req: express.Request,
  res: express.Response,
  path: string,
  method: string
): Promise<void> => {
  try {
    // Get the gamification service URL from the service registry
    const gamificationService = ServiceRegistry.getServiceInstance(SERVICES.GAMIFICATION_SERVICE);
    
    // Construct the full URL for the request
    const url = `${gamificationService.service.url}${path}`;
    
    // Forward the request headers, including authentication
    const headers: Record<string, string> = {};
    for (const key in req.headers) {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
        headers[key] = req.headers[key] as string;
      }
    }
    
    logger.info(`Proxying ${method} request to gamification service`, {
      path,
      method
    });
    
    // Create the axios request configuration
    const axiosConfig = {
      method,
      url,
      headers,
      params: req.query,
      data: (method === 'POST' || method === 'PUT') ? req.body : undefined
    };
    
    // Make the request to the gamification service using the circuit breaker
    const response = await gamificationService.circuitBreaker.fire(axiosConfig);
    
    // Forward the response status, headers, and body back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Error proxying request to gamification service', {
      path,
      method,
      error: error.message
    });
    
    // If the error has a response property, forward the error response
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      // For network errors, timeout, or other issues
      res.status(500).json({
        code: 'SRV_INTERNAL_ERROR',
        message: 'Failed to communicate with gamification service',
        statusCode: 500
      });
    }
  }
};

// Set up all gamification routes
setupScoreRoutes(router);
setupAchievementRoutes(router);
setupLeaderboardRoutes(router);
setupBonusZoneRoutes(router);
setupRewardRoutes(router);

// Export the configured router
export default router;