import { Consumer } from 'kafkajs'; // ^2.2.4
import { EventConsumer, OptimizationEvent, EventTypes } from '../../../common/interfaces/event.interface';
import { MatchingService } from '../services/matching.service';
import { RecommendationService } from '../services/recommendation.service';
import logger from '../../../common/utils/logger';
import { getKafkaTopics } from '../config';

/**
 * Consumer that processes optimization results from the Optimization Engine and creates load-driver matches
 */
export class OptimizationResultsConsumer implements EventConsumer {
  private readonly consumerName: string = 'OptimizationResultsConsumer';
  private kafkaConsumer: Consumer;
  private matchingService: MatchingService;
  private recommendationService: RecommendationService;
  private topics: any;

  /**
   * Creates a new OptimizationResultsConsumer instance
   * @param kafkaConsumer 
   * @param matchingService 
   * @param recommendationService 
   */
  constructor(
    kafkaConsumer: Consumer,
    matchingService: MatchingService,
    recommendationService: RecommendationService
  ) {
    this.consumerName = 'OptimizationResultsConsumer';
    this.kafkaConsumer = kafkaConsumer;
    this.matchingService = matchingService;
    this.recommendationService = recommendationService;
    this.topics = getKafkaTopics();
    logger.info('OptimizationResultsConsumer initialized');
  }

  /**
   * Starts the consumer to listen for optimization result events
   * @returns Promise that resolves when the consumer is started
   */
  async start(): Promise<void> {
    logger.info('Starting OptimizationResultsConsumer...');
    await this.kafkaConsumer.subscribe({ topic: this.topics.optimizationResults, fromBeginning: false });

    await this.kafkaConsumer.run({
      eachMessage: async ({ message }) => {
        try {
          await this.consumeEvent({
            metadata: {
              event_id: '',
              event_type: EventTypes.OPTIMIZATION_COMPLETED,
              event_version: '',
              event_time: '',
              producer: '',
              correlation_id: '',
              category: ''
            },
            payload: JSON.parse(message.value!.toString())
          });
        } catch (error) {
          logger.error(`Error processing message: ${error}`);
        }
      },
    });

    logger.info('OptimizationResultsConsumer started successfully.');
  }

  /**
   * Stops the consumer and disconnects from Kafka
   * @returns Promise that resolves when the consumer is stopped
   */
  async stop(): Promise<void> {
    logger.info('Stopping OptimizationResultsConsumer...');
    await this.kafkaConsumer.disconnect();
    logger.info('OptimizationResultsConsumer stopped successfully.');
  }

  /**
   * Processes an optimization event and creates matches based on the results
   * @param event 
   * @returns Promise that resolves when the event is processed
   */
  async consumeEvent(event: OptimizationEvent): Promise<void> {
    logger.info(`Received optimization event: ${event.metadata.event_id}`);

    if (event.metadata.event_type === EventTypes.OPTIMIZATION_COMPLETED) {
      const optimizationResults = event.payload;

      if (optimizationResults.loadMatches) {
        await this.processLoadMatches(optimizationResults.loadMatches);
      }

      if (optimizationResults.relayPlans) {
        await this.processRelayPlans(optimizationResults.relayPlans);
      }

      if (optimizationResults.smartHubRecommendations) {
        await this.processSmartHubRecommendations(optimizationResults.smartHubRecommendations);
      }

      logger.info(`Successfully processed optimization event: ${event.metadata.event_id}`);
    }
  }

  /**
   * Processes load matches from optimization results and creates match records
   * @param loadMatches 
   * @returns Promise that resolves when all matches are processed
   */
  async processLoadMatches(loadMatches: any[]): Promise<void> {
    logger.info(`Processing ${loadMatches.length} load matches`);

    for (const match of loadMatches) {
      const { loadId, driverId, efficiencyScore } = match;

      try {
        // TODO: Implement createMatch using matchingService
        // await this.matchingService.createMatch(loadId, driverId, efficiencyScore);

        // TODO: Implement createRecommendation using recommendationService
        // await this.recommendationService.createRecommendation(loadId, driverId, efficiencyScore);
      } catch (error) {
        logger.error(`Failed to process load match for load ${loadId} and driver ${driverId}: ${error}`);
      }
    }

    logger.info(`Successfully processed ${loadMatches.length} load matches`);
  }

  /**
   * Processes relay plans from optimization results and creates relay match records
   * @param relayPlans 
   * @returns Promise that resolves when all relay plans are processed
   */
  async processRelayPlans(relayPlans: any[]): Promise<void> {
    logger.info(`Processing ${relayPlans.length} relay plans`);

    for (const plan of relayPlans) {
      const { loadId, segments, efficiencyScore } = plan;

      try {
        // TODO: Implement generateRelayRecommendations using matchingService
        // await this.matchingService.generateRelayRecommendations(loadId, segments, efficiencyScore);
      } catch (error) {
        logger.error(`Failed to process relay plan for load ${loadId}: ${error}`);
      }
    }

    logger.info(`Successfully processed ${relayPlans.length} relay plans`);
  }

  /**
   * Processes Smart Hub recommendations from optimization results
   * @param smartHubRecommendations 
   * @returns Promise that resolves when all recommendations are processed
   */
  async processSmartHubRecommendations(smartHubRecommendations: any[]): Promise<void> {
    logger.info(`Processing ${smartHubRecommendations.length} Smart Hub recommendations`);

    for (const recommendation of smartHubRecommendations) {
      const { location, facilityDetails } = recommendation;

      try {
        // TODO: Forward the recommendation to the appropriate service for processing
        // This might involve creating a new Smart Hub record or updating an existing one
      } catch (error) {
        logger.error(`Failed to process Smart Hub recommendation for location ${location.latitude}, ${location.longitude}: ${error}`);
      }
    }

    logger.info(`Successfully processed ${smartHubRecommendations.length} Smart Hub recommendations`);
  }

  /**
   * Handles errors that occur during event processing
   * @param error 
   * @param event 
   */
  async handleError(error: Error, event: OptimizationEvent): Promise<void> {
    logger.error(`Error processing event ${event.metadata.event_id}: ${error.message}`, {
      error: error,
      event: event
    });

    // TODO: Implement retry logic for recoverable errors
    // TODO: Implement error metrics for monitoring
  }
}