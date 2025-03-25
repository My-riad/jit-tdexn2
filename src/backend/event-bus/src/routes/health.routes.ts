import { Router, Request, Response, NextFunction } from 'express'; // express@^4.17.1
import {
  getHealth,
  getDetailedHealth,
  getKafkaHealth,
  getSchemaRegistryHealth,
  getReadiness,
  getLiveness
} from '../controllers/health.controller';
import KafkaService from '../services/kafka.service';
import SchemaRegistryService from '../services/schema-registry.service';
import logger from '../../../common/utils/logger';

const router = Router(); // Create a new Express router instance
const kafkaService = new KafkaService(new SchemaRegistryService()); // Initialize Kafka service instance
const schemaRegistryService = new SchemaRegistryService(); // Initialize Schema Registry service instance

/**
 * Initializes and configures all health check routes for the Event Bus service
 * @returns {express.Router} Configured Express router with health check routes
 */
const setupHealthRoutes = (): Router => {
  // Middleware to attach KafkaService and SchemaRegistryService to the request object
  router.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).kafkaService = kafkaService;
    (req as any).schemaRegistryService = schemaRegistryService;
    next();
  });

  // Route for basic health check at GET /
  router.get('/', getHealth);

  // Route for detailed health check at GET /detailed
  router.get('/detailed', getDetailedHealth);

  // Route for Kafka health check at GET /kafka
  router.get('/kafka', (req: Request, res: Response, next: NextFunction) => {
    getKafkaHealth(req, res, next, (req as any).kafkaService);
  });

  // Route for Schema Registry health check at GET /schema-registry
  router.get('/schema-registry', (req: Request, res: Response, next: NextFunction) => {
    getSchemaRegistryHealth(req, res, next, (req as any).schemaRegistryService);
  });

  // Route for Kubernetes readiness probe at GET /readiness
  router.get('/readiness', async (req: Request, res: Response, next: NextFunction) => {
    await getReadiness(req, res, next, (req as any).kafkaService, (req as any).schemaRegistryService);
  });

  // Route for Kubernetes liveness probe at GET /liveness
  router.get('/liveness', getLiveness);

  logger.info('Health check routes registered successfully.'); // Log successful route registration

  return router; // Return the configured router
};

export default setupHealthRoutes(); // Export the configured Express router with health check routes