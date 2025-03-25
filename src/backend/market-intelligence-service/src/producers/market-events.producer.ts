import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import {
  EventProducer,
  MarketEvent,
  EventMetadata
} from '../../../../common/interfaces/event.interface';
import {
  EventTypes,
  EventCategories
} from '../../../../common/constants/event-types';
import { KafkaService } from '../../../../event-bus/src/services/kafka.service';
import logger from '../../../../common/utils/logger';
import { MarketRate } from '../models/market-rate.model';
import { DemandForecast } from '../models/demand-forecast.model';
import { Hotspot } from '../models/hotspot.model';
import { LoadAuction } from '../models/load-auction.model';
import { AuctionBid } from '../models/auction-bid.model';

/**
 * Producer for market-related events in the Market Intelligence Service
 */
export class MarketEventsProducer implements EventProducer {
  /**
   * @param kafkaService - The Kafka service to use for producing events
   */
  constructor(private readonly kafkaService: KafkaService) {
    // Store the provided Kafka service for event production
    this.kafkaService = kafkaService;
    // Initialize the producer
  }

  /**
   * Produces an event when a market rate is updated
   * @param marketRate - The updated market rate data
   * @returns Promise that resolves when the event is produced
   */
  async produceMarketRateUpdatedEvent(marketRate: MarketRate): Promise<void> {
    // Create event metadata with MARKET_RATE_UPDATED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.MARKET_RATE_UPDATED);

    // Create event payload with market rate data
    const payload = {
      rate_id: marketRate.rate_id,
      origin_region: marketRate.origin_region,
      destination_region: marketRate.destination_region,
      equipment_type: marketRate.equipment_type,
      average_rate: marketRate.average_rate,
      min_rate: marketRate.min_rate,
      max_rate: marketRate.max_rate,
      sample_size: marketRate.sample_size,
      recorded_at: marketRate.recorded_at.toISOString()
    };

    // Produce the event using the Kafka service
    try {
      await this.kafkaService.produceEvent<MarketEvent>({ metadata, payload });
      logger.info(`Successfully produced MARKET_RATE_UPDATED event for rate ID: ${marketRate.rate_id}`);
    } catch (error: any) {
      logger.error(`Failed to produce MARKET_RATE_UPDATED event for rate ID: ${marketRate.rate_id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Produces an event when a demand forecast is updated
   * @param forecast - The updated demand forecast data
   * @returns Promise that resolves when the event is produced
   */
  async produceDemandForecastUpdatedEvent(forecast: DemandForecast): Promise<void> {
    // Create event metadata with DEMAND_FORECAST_UPDATED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.DEMAND_FORECAST_UPDATED);

    // Create event payload with demand forecast data
    const payload = {
      forecast_id: forecast.forecast_id,
      timeframe: forecast.timeframe,
      generated_at: forecast.generated_at.toISOString(),
      valid_until: forecast.valid_until.toISOString(),
      confidence_level: forecast.confidence_level,
      overall_confidence_score: forecast.overall_confidence_score,
      regional_forecasts: forecast.regional_forecasts,
      lane_forecasts: forecast.lane_forecasts,
      factors: forecast.factors,
      model_version: forecast.model_version
    };

    // Produce the event using the Kafka service
    try {
      await this.kafkaService.produceEvent<MarketEvent>({ metadata, payload });
      logger.info(`Successfully produced DEMAND_FORECAST_UPDATED event for forecast ID: ${forecast.forecast_id}`);
    } catch (error: any) {
      logger.error(`Failed to produce DEMAND_FORECAST_UPDATED event for forecast ID: ${forecast.forecast_id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Produces an event when a market hotspot is identified
   * @param hotspot - The identified market hotspot data
   * @returns Promise that resolves when the event is produced
   */
  async produceHotspotIdentifiedEvent(hotspot: Hotspot): Promise<void> {
    // Create event metadata with HOTSPOT_IDENTIFIED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.HOTSPOT_IDENTIFIED);

    // Create event payload with hotspot data
    const payload = {
      hotspot_id: hotspot.hotspot_id,
      name: hotspot.name,
      type: hotspot.type,
      severity: hotspot.severity,
      center: hotspot.center,
      radius: hotspot.radius,
      region: hotspot.region,
      equipment_types: hotspot.equipment_type,
      rate_impact: hotspot.rate_impact,
      bonus_amount: hotspot.bonus_amount,
      description: hotspot.description,
      detected_at: hotspot.detected_at.toISOString(),
      valid_from: hotspot.valid_from.toISOString(),
      valid_until: hotspot.valid_until.toISOString(),
      confidence_score: hotspot.confidence_score,
      factors: hotspot.factors,
      active: hotspot.active
    };

    // Produce the event using the Kafka service
    try {
      await this.kafkaService.produceEvent<MarketEvent>({ metadata, payload });
      logger.info(`Successfully produced HOTSPOT_IDENTIFIED event for hotspot ID: ${hotspot.hotspot_id}`);
    } catch (error: any) {
      logger.error(`Failed to produce HOTSPOT_IDENTIFIED event for hotspot ID: ${hotspot.hotspot_id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Produces an event when a load auction is created
   * @param auction - The load auction data
   * @returns Promise that resolves when the event is produced
   */
  async produceAuctionCreatedEvent(auction: LoadAuction): Promise<void> {
    // Create event metadata with AUCTION_CREATED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.AUCTION_CREATED);

    // Create event payload with auction data
    const payload = {
      auction_id: auction.auction_id,
      load_id: auction.load_id,
      title: auction.title,
      description: auction.description,
      auction_type: auction.auction_type,
      status: auction.status,
      start_time: auction.start_time.toISOString(),
      end_time: auction.end_time.toISOString(),
      reserve_price: auction.reserve_price,
      starting_price: auction.starting_price,
      min_bid_increment: auction.min_bid_increment,
      network_efficiency_weight: auction.network_efficiency_weight,
      price_weight: auction.price_weight,
      driver_score_weight: auction.driver_score_weight,
      created_by: auction.created_by,
      created_at: auction.created_at.toISOString()
    };

    // Produce the event using the Kafka service
    try {
      await this.kafkaService.produceEvent<MarketEvent>({ metadata, payload });
      logger.info(`Successfully produced AUCTION_CREATED event for auction ID: ${auction.auction_id}`);
    } catch (error: any) {
      logger.error(`Failed to produce AUCTION_CREATED event for auction ID: ${auction.auction_id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Produces an event when a bid is placed on an auction
   * @param bid - The auction bid data
   * @returns Promise that resolves when the event is produced
   */
  async produceAuctionBidPlacedEvent(bid: AuctionBid): Promise<void> {
    // Create event metadata with AUCTION_BID_PLACED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.AUCTION_BID_PLACED);

    // Create event payload with bid data
    const payload = {
      bid_id: bid.bid_id,
      auction_id: bid.auction_id,
      load_id: bid.load_id,
      bidder_id: bid.bidder_id,
      bidder_type: bid.bidder_type,
      amount: bid.amount,
      status: bid.status,
      efficiency_score: bid.efficiency_score,
      network_contribution_score: bid.network_contribution_score,
      notes: bid.notes,
      created_at: bid.created_at.toISOString()
    };

    // Produce the event using the Kafka service
    try {
      await this.kafkaService.produceEvent<MarketEvent>({ metadata, payload });
      logger.info(`Successfully produced AUCTION_BID_PLACED event for bid ID: ${bid.bid_id}`);
    } catch (error: any) {
      logger.error(`Failed to produce AUCTION_BID_PLACED event for bid ID: ${bid.bid_id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Produces an event when an auction is completed
   * @param auction - The load auction data
   * @param winningBid - The winning bid data
   * @returns Promise that resolves when the event is produced
   */
  async produceAuctionCompletedEvent(auction: LoadAuction, winningBid: AuctionBid): Promise<void> {
    // Create event metadata with AUCTION_COMPLETED event type
    const metadata: EventMetadata = this.createEventMetadata(EventTypes.AUCTION_COMPLETED);

    // Create event payload with auction and winning bid data
    const payload = {
      auction_id: auction.auction_id,
      load_id: auction.load_id,
      status: auction.status,
      winning_bid_id: winningBid?.bid_id || null,
      winning_bidder_id: winningBid?.bidder_id || null,
      final_price: winningBid?.amount || null,
      completed_at: new Date().toISOString(),
      completion_reason: 'Auction completed successfully' // Add more reasons if needed
    };

    // Produce the event using the Kafka service
    try {
      await this.kafkaService.produceEvent<MarketEvent>({ metadata, payload });
      logger.info(`Successfully produced AUCTION_COMPLETED event for auction ID: ${auction.auction_id}`);
    } catch (error: any) {
      logger.error(`Failed to produce AUCTION_COMPLETED event for auction ID: ${auction.auction_id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Creates standardized event metadata for market events
   * @param eventType - The type of event
   * @returns The created event metadata
   */
  private createEventMetadata(eventType: EventTypes): EventMetadata {
    // Generate a unique event ID using UUID
    const eventId = uuidv4();
    // Set the event version to '1.0'
    const eventVersion = '1.0';
    // Set the event time to the current ISO timestamp
    const eventTime = new Date().toISOString();
    // Set the producer to 'market-intelligence-service'
    const producer = 'market-intelligence-service';
    // Generate a correlation ID using UUID
    const correlationId = uuidv4();
    // Set the category to EventCategories.MARKET
    const category = EventCategories.MARKET;

    // Return the constructed metadata object
    return {
      event_id: eventId,
      event_type: eventType,
      event_version: eventVersion,
      event_time: eventTime,
      producer: producer,
      correlation_id: correlationId,
      category: category
    };
  }
}