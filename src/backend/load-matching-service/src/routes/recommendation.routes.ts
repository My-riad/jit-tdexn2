# src/backend/load-matching-service/src/routes/recommendation.routes.ts
```typescript
import { Router } from 'express'; // express ^4.18.2

import { RecommendationController, recommendationValidationSchemas } from '../controllers/recommendation.controller';
import { validateRequest } from '../../../common/middleware/validation.middleware';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { RecommendationService } from '../services/recommendation.service';

/**
 * Factory function that creates and configures an Express router for recommendation endpoints
 * @param recommendationController recommendationController
 * @returns express.Router Configured Express router with recommendation routes
 */
const createRecommendationRouter = (recommendationController: RecommendationController): express.Router => {
  // Create a new Express router instance
  const router = Router();

  // Configure routes with appropriate HTTP methods, paths, middleware, and controller methods
  // GET /api/v1/recommendations/:id - Retrieves a specific recommendation by ID
  router.get('/:id', 
    authenticate,
    validateRequest(recommendationValidationSchemas.getRecommendationById),
    recommendationController.getRecommendationById.bind(recommendationController)
  );

  // GET /api/v1/recommendations/driver/:driverId - Retrieves active recommendations for a specific driver
  router.get('/driver/:driverId',
    authenticate,
    validateRequest(recommendationValidationSchemas.getActiveRecommendationsForDriver),
    recommendationController.getActiveRecommendationsForDriver.bind(recommendationController)
  );

  // POST /api/v1/recommendations - Creates a new recommendation based on a match
  router.post('/',
    authenticate,
    validateRequest(recommendationValidationSchemas.createRecommendation),
    recommendationController.createRecommendation.bind(recommendationController)
  );

  // PUT /api/v1/recommendations/:id - Updates an existing recommendation (accept, decline, expire, viewed)
  router.put('/:id',
    authenticate,
    validateRequest(recommendationValidationSchemas.updateRecommendation),
    recommendationController.updateRecommendation.bind(recommendationController)
  );

  // PUT /api/v1/recommendations/:id/viewed - Marks a recommendation as viewed by the driver
  router.put('/:id/viewed',
    authenticate,
    validateRequest(recommendationValidationSchemas.markRecommendationAsViewed),
    recommendationController.markRecommendationAsViewed.bind(recommendationController)
  );

  // PUT /api/v1/recommendations/:id/declined - Marks a recommendation as declined by the driver
  router.put('/:id/declined',
    authenticate,
    validateRequest(recommendationValidationSchemas.markRecommendationAsDeclined),
    recommendationController.markRecommendationAsDeclined.bind(recommendationController)
  );

  // PUT /api/v1/recommendations/:id/expired - Deactivates a recommendation by marking it as expired
  router.put('/:id/expired',
    authenticate,
    validateRequest(recommendationValidationSchemas.deactivateRecommendation),
    recommendationController.deactivateRecommendation.bind(recommendationController)
  );

  // GET /api/v1/recommendations/statistics - Retrieves statistics about recommendation usage and performance
  router.get('/statistics',
    authenticate,
    validateRequest(recommendationValidationSchemas.getRecommendationStatistics),
    recommendationController.getRecommendationStatistics.bind(recommendationController)
  );

  // Return the configured router
  return router;
};

// Export the factory function to create the recommendation router with proper dependency injection
export { createRecommendationRouter };