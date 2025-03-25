# src/backend/load-matching-service/src/routes/match.routes.ts
```typescript
import express, { Router } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2

import { MatchController } from '../controllers/match.controller';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware';
import { MatchingService } from '../services/matching.service';
import { RecommendationService } from '../services/recommendation.service';

/**
 * Configures and returns an Express router with all match-related routes
 * @param matchingService 
 * @param recommendationService
 * @returns Configured Express router with match routes
 */
export const setupMatchRoutes = (matchingService: MatchingService, recommendationService: RecommendationService): express.Router => {
  // Create a new Express router instance
  const router = express.Router();

  // Initialize controller instances with the provided services
  const matchController = new MatchController(matchingService, recommendationService);
  const recommendationController = new RecommendationController(recommendationService);

  // Set up GET /matches/:matchId route with authentication and validation middleware
  router.get('/matches/:matchId', authenticate, validateParams(matchValidationSchemas.getMatchById), matchController.getMatchById);

  // Set up GET /relay-matches/:relayId route with authentication and validation middleware
  router.get('/relay-matches/:relayId', authenticate, validateParams(matchValidationSchemas.getRelayMatchById), matchController.getRelayMatchById);

  // Set up GET /drivers/:driverId/matches route with authentication and validation middleware
  router.get('/drivers/:driverId/matches', authenticate, validateParams(matchValidationSchemas.getMatchesForDriver), matchController.getMatchesForDriver);

  // Set up GET /loads/:loadId/matches route with authentication and validation middleware
  router.get('/loads/:loadId/matches', authenticate, validateParams(matchValidationSchemas.getMatchesForLoad), matchController.getMatchesForLoad);

  // Set up POST /matches route with authentication and validation middleware
  router.post('/matches', authenticate, validateBody(matchValidationSchemas.createMatch), matchController.createMatch);

  // Set up PUT /matches/:matchId route with authentication and validation middleware
  router.put('/matches/:matchId', authenticate, validateParams(matchValidationSchemas.updateMatch), validateBody(matchValidationSchemas.updateMatch), matchController.updateMatch);

  // Set up POST /matches/:matchId/accept route with authentication and validation middleware
  router.post('/matches/:matchId/accept', authenticate, validateParams(matchValidationSchemas.acceptMatch), validateBody(matchValidationSchemas.acceptMatch), matchController.acceptMatch);

  // Set up POST /matches/:matchId/decline route with authentication and validation middleware
  router.post('/matches/:matchId/decline', authenticate, validateParams(matchValidationSchemas.declineMatch), validateBody(matchValidationSchemas.declineMatch), matchController.declineMatch);

  // Set up POST /matches/:matchId/reserve route with authentication and validation middleware
  router.post('/matches/:matchId/reserve', authenticate, validateParams(matchValidationSchemas.reserveMatch), validateBody(matchValidationSchemas.reserveMatch), matchController.reserveMatch);

  // Set up POST /recommendations/generate route with authentication and validation middleware
  router.post('/recommendations/generate', authenticate, validateBody(matchValidationSchemas.generateRecommendations), matchController.generateRecommendations);

  // Set up POST /recommendations/relay/generate route with authentication and validation middleware
  router.post('/recommendations/relay/generate', authenticate, validateBody(matchValidationSchemas.generateRelayRecommendations), matchController.generateRelayRecommendations);

  // Set up GET /drivers/:driverId/recommendations route with authentication and validation middleware
  router.get('/drivers/:driverId/recommendations', authenticate, validateParams(matchValidationSchemas.getActiveRecommendations), validateQuery(matchValidationSchemas.getActiveRecommendations), matchController.getActiveRecommendations);

  // Set up PUT /recommendations/:recommendationId/view route with authentication and validation middleware
  router.put('/recommendations/:recommendationId/view', authenticate, validateParams(matchValidationSchemas.viewRecommendation), matchController.viewRecommendation);

  // Set up GET /statistics route with authentication and validation middleware
  router.get('/statistics', authenticate, validateQuery(matchValidationSchemas.getMatchStatistics), matchController.getMatchStatistics);

  // Return the configured router
  return router;
};

// Define validation schemas for match route endpoints
export const matchValidationSchemas = {
  getMatchById: Joi.object({
    matchId: Joi.string().uuid().required()
  }),
   getRelayMatchById: Joi.object({
    relayId: Joi.string().uuid().required()
  }),
  getMatchesForDriver: Joi.object({
    driverId: Joi.string().uuid().required()
  }),
  getMatchesForLoad: Joi.object({
    loadId: Joi.string().uuid().required()
  }),
  createMatch: Joi.object({
    loadId: Joi.string().uuid().required(),
    driverId: Joi.string().uuid().required(),
    vehicleId: Joi.string().uuid().required(),
    matchType: Joi.string().required(),
    efficiencyScore: Joi.number().required(),
    scoreFactors: Joi.object().required(),
    proposedRate: Joi.number().required()
  }),
  updateMatch: Joi.object({
    matchId: Joi.string().uuid().required(),
    status: Joi.string().required()
  }),
  acceptMatch: Joi.object({
    matchId: Joi.string().uuid().required(),
    driverId: Joi.string().uuid().required(),
    acceptedRate: Joi.number().required()
  }),
  declineMatch: Joi.object({
    matchId: Joi.string().uuid().required(),
    driverId: Joi.string().uuid().required(),
    declineReason: Joi.string().required()
  }),
  reserveMatch: Joi.object({
    matchId: Joi.string().uuid().required(),
    driverId: Joi.string().uuid().required(),
    expirationMinutes: Joi.number().required()
  }),
  generateRecommendations: Joi.object({
    driverId: Joi.string().uuid().required()
  }),
  generateRelayRecommendations: Joi.object({
    loadId: Joi.string().uuid().required()
  }),
  getActiveRecommendations: Joi.object({
    driverId: Joi.string().uuid().required()
  }),
  viewRecommendation: Joi.object({
    recommendationId: Joi.string().uuid().required()
  }),
  getMatchStatistics: Joi.object({
    // Define specific filter parameters and their validation rules
  })
};