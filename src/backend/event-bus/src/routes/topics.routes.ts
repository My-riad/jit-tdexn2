import { Request, Response, Router } from 'express'; // express@4.17.1
import {
  listTopics,
  getTopicDetails,
  createTopic,
  getTopicConsumerGroups,
  getConsumerGroupDetails,
  getSystemTopics,
} from '../controllers/topics.controller';
import KafkaService from '../services/kafka.service';
import logger from '../../../common/utils/logger';

// Create a new Express router instance
const router = Router();

// Create a new KafkaService instance
const kafkaService = new KafkaService();

/**
 * Initializes and configures all Kafka topic management routes for the Event Bus service
 */
const setupTopicRoutes = (): Router => {
  // Log route registration
  logger.info('Setting up topic routes');

  // Register middleware to attach Kafka service to request object
  router.use((req: Request, res: Response, next: any) => {
    req.app.locals.kafkaService = kafkaService;
    next();
  });

  // Register route for listing all topics at GET /topics
  router.get('/topics', listTopics);

  // Register route for getting system-defined topics at GET /topics/system
  router.get('/topics/system', getSystemTopics);

  // Register route for getting topic details at GET /topics/:topicName
  router.get('/topics/:topicName', getTopicDetails);

  // Register route for creating a new topic at POST /topics
  router.post('/topics', createTopic);

  // Register route for getting consumer groups for a topic at GET /topics/:topicName/consumer-groups
  router.get('/topics/:topicName/consumer-groups', getTopicConsumerGroups);

  // Register route for getting consumer group details at GET /consumer-groups/:groupId
  router.get('/consumer-groups/:groupId', getConsumerGroupDetails);

  // Log successful route registration
  logger.info('Topic routes setup completed');

  // Return the configured router
  return router;
};

// Export the configured Express router with topic management routes
export default setupTopicRoutes();