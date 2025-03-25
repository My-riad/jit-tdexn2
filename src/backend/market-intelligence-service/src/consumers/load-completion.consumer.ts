import { KafkaService } from '../../../../event-bus/src/services/kafka.service'; // kafkajs@2.2.4
import { EventTypes } from '../../../../common/constants/event-types';
import { ConsumerGroups } from '../../../../event-bus/src/config/consumer-groups';
import { Topics } from '../../../../event-bus/src/config/topics';
import { RateService } from '../services/rate.service';
import { ForecastService } from '../services/forecast.service';
import { MarketRate } from '../models/market-rate.model';
import { EquipmentType } from '../../../../common/interfaces/load.interface';
import { ForecastTimeframe } from '../models/demand-forecast.model';
import logger from '../../../../common/utils/logger';

// Define a constant for the consumer group ID for this consumer
const CONSUMER_GROUP_ID = 'market-intelligence-load-completion-consumer';

/**
 * Processes a load completion event to update market intelligence data
 * @param event The load completion event
 * @returns Promise that resolves when processing is complete
 */
const handleLoadCompletedEvent = async (event: any): Promise<void> => {
  // Log the start of the event processing
  logger.info('Processing load completion event', { eventId: event.metadata.event_id });

  try {
    // Extract load data from the event payload
    const load = event.payload;

    // Extract origin and destination regions from load locations
    const originRegion = load.origin.region;
    const destinationRegion = load.destination.region;

    // Extract equipment type from load data
    const equipmentType = load.equipment_type as EquipmentType;

    // Calculate rate per mile from the completed load
    const rate = load.payment.total_amount;
    const distance = load.route.total_distance;

    // Update market rate data for the lane
    await updateMarketRateFromCompletedLoad(originRegion, destinationRegion, equipmentType, rate, distance);

    // Invalidate forecast caches for affected regions
    const forecastService = new ForecastService();
    await invalidateAffectedForecasts(originRegion, destinationRegion, equipmentType, forecastService);

    // Log successful processing of the event
    logger.info('Successfully processed load completion event', { eventId: event.metadata.event_id });
  } catch (error: any) {
    // Log any errors that occur during processing
    logger.error('Error processing load completion event', { error: error.message, eventId: event.metadata.event_id });
    throw error; // Re-throw the error to trigger retry or DLQ
  }
};

/**
 * Updates market rate data based on a completed load
 * @param originRegion The origin region
 * @param destinationRegion The destination region
 * @param equipmentType The equipment type
 * @param rate The total rate for the load
 * @param distance The total distance for the load
 * @returns Promise that resolves when the update is complete
 */
async function updateMarketRateFromCompletedLoad(
  originRegion: string,
  destinationRegion: string,
  equipmentType: EquipmentType,
  rate: number,
  distance: number
): Promise<void> {
  // Log the start of the market rate update
  logger.info('Updating market rate from completed load', { originRegion, destinationRegion, equipmentType, rate, distance });

  try {
    // Calculate rate per mile from total rate and distance
    const ratePerMile = rate / distance;

    // Retrieve existing market rate data for the lane
    let marketRate = await MarketRate.findByLane(originRegion, destinationRegion, equipmentType);

    // If existing data found, update with new rate information
    if (marketRate) {
      // Update existing market rate record
      marketRate.average_rate = (marketRate.average_rate + ratePerMile) / 2;
      marketRate.sample_size += 1;
      marketRate.updated_at = new Date();
      await marketRate.save();
      logger.info('Updated existing market rate', { rateId: marketRate.rate_id });
    } else {
      // If no existing data found, create new market rate record
      marketRate = new MarketRate({
        origin_region: originRegion,
        destination_region: destinationRegion,
        equipment_type: equipmentType,
        average_rate: ratePerMile,
        min_rate: ratePerMile,
        max_rate: ratePerMile,
        sample_size: 1,
        recorded_at: new Date(),
      });
      await marketRate.save();
      logger.info('Created new market rate', { rateId: marketRate.rate_id });
    }

    // Log the market rate update
    logger.info('Market rate updated', { originRegion, destinationRegion, equipmentType, ratePerMile });
  } catch (error: any) {
    // Log any errors that occur during the update
    logger.error('Error updating market rate', { error: error.message, originRegion, destinationRegion, equipmentType });
    throw error; // Re-throw the error to trigger retry or DLQ
  }
}

/**
 * Invalidates forecast caches for regions affected by a completed load
 * @param originRegion The origin region
 * @param destinationRegion The destination region
 * @param equipmentType The equipment type
 * @param forecastService The ForecastService instance
 * @returns Promise that resolves when cache invalidation is complete
 */
async function invalidateAffectedForecasts(
  originRegion: string,
  destinationRegion: string,
  equipmentType: EquipmentType,
  forecastService: ForecastService
): Promise<void> {
  // Log the start of the cache invalidation
  logger.info('Invalidating forecast caches', { originRegion, destinationRegion, equipmentType });

  try {
    // Invalidate forecast cache for origin region with 24-hour timeframe
    await forecastService.invalidateForecastCache(ForecastTimeframe.NEXT_24_HOURS, originRegion, equipmentType);

    // Invalidate forecast cache for origin region with 48-hour timeframe
    await forecastService.invalidateForecastCache(ForecastTimeframe.NEXT_48_HOURS, originRegion, equipmentType);

    // Invalidate forecast cache for destination region with 24-hour timeframe
    await forecastService.invalidateForecastCache(ForecastTimeframe.NEXT_24_HOURS, destinationRegion, equipmentType);

    // Invalidate forecast cache for destination region with 48-hour timeframe
    await forecastService.invalidateForecastCache(ForecastTimeframe.NEXT_48_HOURS, destinationRegion, equipmentType);

    // Log cache invalidation
    logger.info('Forecast caches invalidated', { originRegion, destinationRegion, equipmentType });
  } catch (error: any) {
    // Log any errors that occur during cache invalidation
    logger.error('Error invalidating forecast caches', { error: error.message, originRegion, destinationRegion, equipmentType });
    throw error; // Re-throw the error to trigger retry or DLQ
  }
}

/**
 * Initializes the Kafka consumer for load completion events
 * @param kafkaService The KafkaService instance
 * @param rateService The RateService instance
 * @param forecastService The ForecastService instance
 * @returns Promise that resolves when the consumer is initialized
 */
export const initializeLoadCompletionConsumer = async (
  kafkaService: KafkaService,
  rateService: RateService,
  forecastService: ForecastService
): Promise<void> => {
  // Log the start of the consumer initialization
  logger.info('Initializing load completion consumer');

  try {
    // Create event handler mapping for LOAD_COMPLETED events
    const handlers: Record<string, any> = {
      [EventTypes.LOAD_COMPLETED]: handleLoadCompletedEvent,
    };

    // Start consuming events from the LOAD_EVENTS topic
    await kafkaService.consumeEvents([Topics.LOAD_EVENTS], ConsumerGroups.MARKET_INTELLIGENCE, handlers);

    // Log successful consumer initialization
    logger.info('Load completion consumer initialized successfully');
  } catch (error: any) {
    // Log any errors that occur during initialization
    logger.error('Error initializing load completion consumer', { error: error.message });
    throw error; // Re-throw the error to prevent the service from starting
  }
};