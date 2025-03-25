import { Schema } from 'avsc'; // v5.7.0
import { 
  EventTypes, 
  EventCategories 
} from '../../../common/constants/event-types';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import { MARKET_EVENTS } from '../config/topics';

/**
 * Common metadata schema for all market events
 * Defines the standard fields that every market event must contain
 */
export const marketEventMetadataSchema: Schema = {
  type: 'record',
  name: 'MarketEventMetadata',
  fields: [
    { name: 'event_id', type: 'string' },
    { name: 'event_type', type: 'string' },
    { name: 'event_version', type: 'string' },
    { name: 'event_time', type: 'string' },
    { name: 'producer', type: 'string' },
    { name: 'correlation_id', type: 'string' },
    { name: 'category', type: 'string', default: EventCategories.MARKET }
  ]
};

/**
 * Schema for MARKET_RATE_UPDATED events
 * These events are published when market rates for specific lanes and equipment types are updated
 */
export const marketRateUpdatedSchema: Schema = {
  type: 'record',
  name: 'MarketRateUpdatedPayload',
  fields: [
    { name: 'rate_id', type: 'string' },
    { name: 'origin_region', type: 'string' },
    { name: 'destination_region', type: 'string' },
    { name: 'equipment_type', type: 'string' },
    { name: 'average_rate', type: 'double' },
    { name: 'min_rate', type: 'double' },
    { name: 'max_rate', type: 'double' },
    { name: 'sample_size', type: 'int' },
    { name: 'previous_average_rate', type: ['null', 'double'], default: null },
    { name: 'rate_change_percentage', type: ['null', 'double'], default: null },
    { name: 'recorded_at', type: 'string' }
  ]
};

/**
 * Schema for DEMAND_FORECAST_UPDATED events
 * These events are published when demand forecasts for regions or lanes are updated
 */
export const demandForecastUpdatedSchema: Schema = {
  type: 'record',
  name: 'DemandForecastUpdatedPayload',
  fields: [
    { name: 'forecast_id', type: 'string' },
    { name: 'timeframe', type: 'string' },
    { name: 'confidence_level', type: 'string' },
    { name: 'generated_at', type: 'string' },
    { name: 'valid_from', type: 'string' },
    { name: 'valid_until', type: 'string' },
    { name: 'regional_forecasts', type: {
      type: 'array',
      items: {
        type: 'record',
        name: 'RegionalDemandForecast',
        fields: [
          { name: 'region', type: 'string' },
          { name: 'center', type: {
            type: 'record',
            name: 'Location',
            fields: [
              { name: 'latitude', type: 'double' },
              { name: 'longitude', type: 'double' }
            ]
          }},
          { name: 'radius', type: 'double' },
          { name: 'demand_level', type: 'string' },
          { name: 'equipment_types', type: { type: 'array', items: 'string' }},
          { name: 'expected_load_count', type: 'int' },
          { name: 'expected_rate_change', type: 'double' }
        ]
      }
    }},
    { name: 'lane_forecasts', type: {
      type: 'array',
      items: {
        type: 'record',
        name: 'LaneDemandForecast',
        fields: [
          { name: 'origin_region', type: 'string' },
          { name: 'destination_region', type: 'string' },
          { name: 'origin_center', type: 'Location' },
          { name: 'destination_center', type: 'Location' },
          { name: 'demand_level', type: 'string' },
          { name: 'equipment_types', type: { type: 'array', items: 'string' }},
          { name: 'expected_load_count', type: 'int' },
          { name: 'expected_rate_change', type: 'double' }
        ]
      }
    }},
    { name: 'factors', type: { type: 'map', values: 'double' }},
    { name: 'notes', type: ['null', 'string'], default: null }
  ]
};

/**
 * Schema for HOTSPOT_IDENTIFIED events
 * These events are published when the system identifies areas with high demand or supply imbalances
 */
export const hotspotIdentifiedSchema: Schema = {
  type: 'record',
  name: 'HotspotIdentifiedPayload',
  fields: [
    { name: 'hotspot_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'type', type: 'string' },
    { name: 'severity', type: 'string' },
    { name: 'center', type: 'Location' },
    { name: 'radius', type: 'double' },
    { name: 'region', type: 'string' },
    { name: 'equipment_types', type: { type: 'array', items: 'string' }},
    { name: 'rate_impact', type: 'double' },
    { name: 'bonus_amount', type: 'double' },
    { name: 'description', type: 'string' },
    { name: 'detected_at', type: 'string' },
    { name: 'valid_from', type: 'string' },
    { name: 'valid_until', type: 'string' },
    { name: 'confidence_score', type: 'double' },
    { name: 'factors', type: { type: 'map', values: 'double' }},
    { name: 'active', type: 'boolean' }
  ]
};

/**
 * Schema for AUCTION_CREATED events
 * These events are published when a new load auction is created
 */
export const auctionCreatedSchema: Schema = {
  type: 'record',
  name: 'AuctionCreatedPayload',
  fields: [
    { name: 'auction_id', type: 'string' },
    { name: 'load_id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'description', type: ['null', 'string'], default: null },
    { name: 'auction_type', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'start_time', type: 'string' },
    { name: 'end_time', type: 'string' },
    { name: 'reserve_price', type: 'double' },
    { name: 'starting_price', type: 'double' },
    { name: 'min_bid_increment', type: 'double' },
    { name: 'network_efficiency_weight', type: 'double' },
    { name: 'price_weight', type: 'double' },
    { name: 'driver_score_weight', type: 'double' },
    { name: 'eligible_bidders', type: ['null', {
      type: 'array',
      items: {
        type: 'record',
        name: 'EligibleBidder',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'type', type: 'string' }
        ]
      }
    }], default: null },
    { name: 'created_by', type: 'string' },
    { name: 'created_at', type: 'string' }
  ]
};

/**
 * Schema for AUCTION_BID_PLACED events
 * These events are published when a bid is placed on a load auction
 */
export const auctionBidPlacedSchema: Schema = {
  type: 'record',
  name: 'AuctionBidPlacedPayload',
  fields: [
    { name: 'bid_id', type: 'string' },
    { name: 'auction_id', type: 'string' },
    { name: 'load_id', type: 'string' },
    { name: 'bidder_id', type: 'string' },
    { name: 'bidder_type', type: 'string' },
    { name: 'amount', type: 'double' },
    { name: 'efficiency_score', type: ['null', 'double'], default: null },
    { name: 'network_contribution_score', type: ['null', 'double'], default: null },
    { name: 'status', type: 'string' },
    { name: 'notes', type: ['null', 'string'], default: null },
    { name: 'created_at', type: 'string' }
  ]
};

/**
 * Schema for AUCTION_COMPLETED events
 * These events are published when a load auction is completed (either successfully or not)
 */
export const auctionCompletedSchema: Schema = {
  type: 'record',
  name: 'AuctionCompletedPayload',
  fields: [
    { name: 'auction_id', type: 'string' },
    { name: 'load_id', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'winning_bid_id', type: ['null', 'string'], default: null },
    { name: 'winning_bidder_id', type: ['null', 'string'], default: null },
    { name: 'winning_bidder_type', type: ['null', 'string'], default: null },
    { name: 'final_price', type: ['null', 'double'], default: null },
    { name: 'bids_count', type: 'int' },
    { name: 'completed_at', type: 'string' },
    { name: 'completion_reason', type: 'string' }
  ]
};

/**
 * Map of all market event schemas indexed by event type
 * Used by the event bus to retrieve the appropriate schema for validation
 */
export const marketEventSchemas = {
  [EventTypes.MARKET_RATE_UPDATED]: marketRateUpdatedSchema,
  [EventTypes.DEMAND_FORECAST_UPDATED]: demandForecastUpdatedSchema,
  [EventTypes.HOTSPOT_IDENTIFIED]: hotspotIdentifiedSchema,
  [EventTypes.AUCTION_CREATED]: auctionCreatedSchema,
  [EventTypes.AUCTION_BID_PLACED]: auctionBidPlacedSchema,
  [EventTypes.AUCTION_COMPLETED]: auctionCompletedSchema
};

/**
 * Default export with topic name and schemas
 * Provides all necessary information for event bus configuration
 */
export default {
  topic: MARKET_EVENTS,
  schemas: marketEventSchemas
};