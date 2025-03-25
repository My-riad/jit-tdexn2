/**
 * Kafka consumer that processes load creation events from the event bus, calculates market rates for newly created loads,
 * and updates the market intelligence database. This component is responsible for analyzing new loads to determine
 * appropriate pricing based on market conditions and maintaining up-to-date market rate information.
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs'; // kafkajs@^2.2.4
import { getKafkaConfig, getConsumerConfig } from '../../../common/config/kafka.config';
import { EventTypes } from '../../../common/constants/event-types';
import { Load, LoadLocation } from '../../../common/interfaces/load.interface';
import logger from '../../../common/utils/logger';
import { RateService } from '../services/rate.service';
import { MarketRate } from '../models/market-rate.model';
import { getMarketIntelligenceConfig } from '../config';

// Define consumer group ID and topic
const CONSUMER_GROUP_ID = 'market-intelligence-load-creation-consumer';
const LOAD_EVENTS_TOPIC = 'load-events';

/**
 * Initializes and configures the Kafka consumer for load creation events
 * @returns Configured Kafka consumer instance
 */
const initializeConsumer = async (): Promise<Consumer> => {
  // Create Kafka client using getKafkaConfig()
  const kafkaConfig = getKafkaConfig();
  const kafka = new Kafka(kafkaConfig);

  // Create consumer using getConsumerConfig() with CONSUMER_GROUP_ID
  const consumerConfig = getConsumerConfig(CONSUMER_GROUP_ID);
  const consumer = kafka.consumer(consumerConfig);

  // Configure error handling for the consumer
  consumer.on('consumer.crash', (error) => {
    logger.error('Consumer crashed:', { error });
  });

  // Return the configured consumer instance
  return consumer;
};

/**
 * Starts the Kafka consumer to begin processing load creation events
 */
export const startConsumer = async (): Promise<void> => {
  let consumer: Consumer | null = null;
  try {
    // Initialize the Kafka consumer using initializeConsumer()
    consumer = await initializeConsumer();

    // Connect the consumer to the Kafka cluster
    await consumer.connect();

    // Subscribe to the LOAD_EVENTS_TOPIC
    await consumer.subscribe({ topic: LOAD_EVENTS_TOPIC, fromBeginning: false });

    // Set up message handler with processMessage function
    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await processMessage(payload);
      },
    });

    // Log successful consumer start
    logger.info('Load creation event consumer started successfully', { topic: LOAD_EVENTS_TOPIC, groupId: CONSUMER_GROUP_ID });
  } catch (error) {
    // Handle and log any errors during startup
    logger.error('Error starting load creation event consumer', { error, topic: LOAD_EVENTS_TOPIC, groupId: CONSUMER_GROUP_ID });
    if (consumer) {
      await stopConsumer(consumer); // Attempt to stop the consumer if it failed to start properly
    }
    throw error; // Re-throw the error to signal startup failure
  }
};

/**
 * Gracefully stops the Kafka consumer
 * @param consumer Kafka consumer instance
 */
export const stopConsumer = async (consumer: Consumer): Promise<void> => {
  try {
    // Disconnect the consumer from the Kafka cluster
    await consumer.disconnect();

    // Log successful consumer shutdown
    logger.info('Load creation event consumer stopped successfully', { topic: LOAD_EVENTS_TOPIC, groupId: CONSUMER_GROUP_ID });
  } catch (error) {
    // Handle and log any errors during shutdown
    logger.error('Error stopping load creation event consumer', { error, topic: LOAD_EVENTS_TOPIC, groupId: CONSUMER_GROUP_ID });
  }
};

/**
 * Processes incoming Kafka messages, filtering for load creation events
 * @param payload Kafka message payload
 */
const processMessage = async (payload: EachMessagePayload): Promise<void> => {
  try {
    // Extract message value and parse as JSON
    const message = JSON.parse(payload.message.value?.toString() || '{}');

    // Check if event_type is LOAD_CREATED
    if (message.event_type === EventTypes.LOAD_CREATED) {
      // Extract load data from the event payload
      const loadData: Load = message.payload;

      // Process the load data using processLoadCreation
      await processLoadCreation(loadData);

      // Log successful message processing
      logger.info('Successfully processed load creation event', { loadId: loadData.load_id, topic: payload.topic, partition: payload.partition, offset: payload.message.offset });
    } else {
      // If not a load creation event, skip processing
      logger.debug('Skipping non-load creation event', { eventType: message.event_type, topic: payload.topic, partition: payload.partition, offset: payload.message.offset });
    }
  } catch (error) {
    // Handle and log any errors during processing
    logger.error('Error processing Kafka message', { error, topic: payload.topic, partition: payload.partition, offset: payload.message.offset });
  }
};

/**
 * Processes a newly created load to calculate and store market rate information
 * @param loadData Load data object
 */
const processLoadCreation = async (loadData: Load): Promise<void> => {
  try {
    // Create RateService instance
    const rateService = new RateService();

    // Extract origin and destination regions from load locations
    const originLocation = loadData.locations.find((loc: LoadLocation) => loc.location_type === 'PICKUP');
    const destinationLocation = loadData.locations.find((loc: LoadLocation) => loc.location_type === 'DELIVERY');

    if (!originLocation || !destinationLocation) {
      logger.error('Missing origin or destination location in load', { loadId: loadData.load_id });
      return; // Skip processing if location data is missing
    }

    const originRegion = extractRegionFromLocation(originLocation);
    const destinationRegion = extractRegionFromLocation(destinationLocation);

    // Calculate dynamic rate for the load using rateService.calculateLoadRate()
    const rateCalculationResult = await rateService.calculateLoadRate(loadData);

    // Create a new market rate record with the calculation results
    const marketRateData = {
      origin_region: originRegion,
      destination_region: destinationRegion,
      equipment_type: loadData.equipment_type,
      average_rate: rateCalculationResult.totalRate,
      min_rate: rateCalculationResult.mileageRate, // Using mileage rate as a proxy for min/max
      max_rate: rateCalculationResult.mileageRate, // Using mileage rate as a proxy for min/max
      sample_size: 1, // Initial single sample
      recorded_at: new Date(),
    };

    // Store the market rate in the database
    await rateService.createMarketRate(marketRateData);

    // Log successful rate calculation and storage
    logger.info('Successfully calculated and stored market rate for load', { loadId: loadData.load_id, originRegion, destinationRegion, equipmentType: loadData.equipment_type, rate: rateCalculationResult.totalRate });
  } catch (error) {
    // Handle and log any errors during processing
    logger.error('Error processing load creation', { error, loadId: loadData.load_id });
  }
};

/**
 * Extracts region information from a load location
 * @param location LoadLocation object
 * @returns Region identifier (typically state code)
 */
const extractRegionFromLocation = (location: LoadLocation): string => {
  // Extract state code from the location
  const region = location.state;

  // Normalize the state code (uppercase, trim)
  const normalizedRegion = region.trim().toUpperCase();

  // Return the normalized region identifier
  return normalizedRegion;
};