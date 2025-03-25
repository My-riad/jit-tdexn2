/**
 * Market intelligence interfaces for the AI-driven Freight Optimization Platform
 * 
 * This file defines TypeScript interfaces for market intelligence features including
 * market rates, demand forecasts, hotspots, and load auctions. These interfaces
 * enable the frontend to interact with the market intelligence service and
 * display dynamic pricing, market trends, and auction functionality.
 */

import { EquipmentType } from './load.interface';

/**
 * Interface representing market rate data for specific lanes and equipment types
 */
export interface MarketRate {
  rate_id: string;
  origin_region: string;
  destination_region: string;
  equipment_type: EquipmentType;
  average_rate: number;
  min_rate: number;
  max_rate: number;
  sample_size: number;
  recorded_at: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface for query parameters when retrieving market rates
 */
export interface RateQueryParams {
  origin_region: string;
  destination_region: string;
  equipment_type: EquipmentType;
  start_date: Date;
  end_date: Date;
  page: number;
  limit: number;
}

/**
 * Interface for the result of a dynamic rate calculation with adjustment factors
 */
export interface RateCalculationResult {
  base_rate: number;
  adjusted_rate: number;
  adjustment_factors: { [key: string]: number };
  confidence_score: number;
  market_conditions: { supply_demand_ratio: number; market_volatility: number };
  rate_per_mile: number;
  mileage: number;
  calculated_at: Date;
}

/**
 * Interface for analyzing rate trends over time for a specific lane
 */
export interface RateTrendAnalysis {
  origin_region: string;
  destination_region: string;
  equipment_type: EquipmentType;
  time_period: { start_date: Date; end_date: Date };
  data_points: Array<{ date: Date; rate: number }>;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  percent_change: number;
  volatility: number;
  forecast: Array<{ date: Date; rate: number; confidence: number }>;
}

/**
 * Enumeration of hotspot types indicating the nature of the market condition
 */
export enum HotspotType {
  DEMAND_SURGE = 'demand_surge',
  SUPPLY_SHORTAGE = 'supply_shortage',
  RATE_OPPORTUNITY = 'rate_opportunity',
  REPOSITIONING_NEED = 'repositioning_need',
  WEATHER_IMPACT = 'weather_impact'
}

/**
 * Enumeration of severity levels for hotspots
 */
export enum HotspotSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interface representing a geographic area with significant market imbalances or opportunities
 */
export interface Hotspot {
  hotspot_id: string;
  name: string;
  type: HotspotType;
  severity: HotspotSeverity;
  center: { latitude: number; longitude: number };
  radius: number; // in miles
  confidence_score: number;
  bonus_amount: number;
  region: string;
  equipment_type: EquipmentType;
  factors: object; // Factors contributing to the hotspot
  detected_at: Date;
  valid_from: Date;
  valid_until: Date;
  active: boolean;
}

/**
 * Interface for query parameters when retrieving hotspots
 */
export interface HotspotQueryParams {
  type: HotspotType;
  severity: HotspotSeverity;
  region: string;
  equipment_type: EquipmentType;
  latitude: number;
  longitude: number;
  radius: number; // in miles
  active_only: boolean;
  min_confidence: number;
  min_bonus: number;
}

/**
 * Enumeration of time periods for demand forecasts
 */
export enum ForecastTimeframe {
  NEXT_24_HOURS = 'next_24_hours',
  NEXT_48_HOURS = 'next_48_hours',
  NEXT_7_DAYS = 'next_7_days',
  NEXT_30_DAYS = 'next_30_days'
}

/**
 * Enumeration of confidence levels for forecast predictions
 */
export enum ForecastConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Enumeration of demand intensity levels for forecasts
 */
export enum DemandLevel {
  VERY_HIGH = 'very_high',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  VERY_LOW = 'very_low'
}

/**
 * Interface for region-specific demand forecasts
 */
export interface RegionalDemandForecast {
  region: string;
  center: { latitude: number; longitude: number };
  radius: number; // in miles
  demand_levels: { [key in EquipmentType]?: DemandLevel };
  expected_load_count: { [key in EquipmentType]?: number };
  expected_rate_change: { [key in EquipmentType]?: number }; // as percentage
  confidence_score: number;
}

/**
 * Interface for lane-specific demand forecasts between origin-destination pairs
 */
export interface LaneDemandForecast {
  origin_region: string;
  destination_region: string;
  origin_coordinates: { latitude: number; longitude: number };
  destination_coordinates: { latitude: number; longitude: number };
  demand_levels: { [key in EquipmentType]?: DemandLevel };
  expected_load_count: { [key in EquipmentType]?: number };
  expected_rate_change: { [key in EquipmentType]?: number }; // as percentage
  confidence_score: number;
}

/**
 * Main interface for demand forecasts with regional and lane predictions
 */
export interface DemandForecast {
  forecast_id: string;
  timeframe: ForecastTimeframe;
  generated_at: Date;
  valid_until: Date;
  confidence_level: ForecastConfidenceLevel;
  overall_confidence_score: number;
  regional_forecasts: RegionalDemandForecast[];
  lane_forecasts: LaneDemandForecast[];
  factors: { [key: string]: number }; // Factors influencing the forecast
  model_version: string;
}

/**
 * Interface for query parameters when retrieving forecasts
 */
export interface ForecastQueryParams {
  timeframe: ForecastTimeframe;
  region: string;
  equipment_type: EquipmentType;
  origin_region: string;
  destination_region: string;
  min_confidence: number;
  min_demand_level: DemandLevel;
}

/**
 * Enumeration of possible auction statuses throughout the auction lifecycle
 */
export enum AuctionStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Enumeration of auction types with different bidding mechanics
 */
export enum AuctionType {
  STANDARD = 'standard',
  REVERSE = 'reverse',
  SEALED = 'sealed'
}

/**
 * Interface for load auctions where drivers can bid on loads
 */
export interface LoadAuction {
  auction_id: string;
  load_id: string;
  title: string;
  description: string;
  auction_type: AuctionType;
  status: AuctionStatus;
  start_time: Date;
  end_time: Date;
  actual_start_time: Date;
  actual_end_time: Date;
  starting_price: number;
  reserve_price: number;
  current_price: number;
  min_bid_increment: number;
  network_efficiency_weight: number; // Weight for optimizing network efficiency in bid evaluation
  price_weight: number; // Weight for price in bid evaluation
  driver_score_weight: number; // Weight for driver score in bid evaluation
  bids_count: number;
  winning_bid_id: string;
  cancellation_reason: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Enumeration of possible auction bid statuses
 */
export enum AuctionBidStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired'
}

/**
 * Interface for bids placed on load auctions
 */
export interface AuctionBid {
  bid_id: string;
  auction_id: string;
  load_id: string;
  bidder_id: string;
  bidder_type: 'driver' | 'carrier';
  amount: number;
  status: AuctionBidStatus;
  efficiency_score: number; // Score representing how efficient this driver would be for this load
  network_contribution_score: number; // Score representing how this bid contributes to network optimization
  driver_score: number; // Driver's overall efficiency score
  weighted_score: number; // Combined score based on weighted factors
  notes: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Extended interface that includes bids for comprehensive auction views
 */
export interface LoadAuctionWithBids extends LoadAuction {
  bids: AuctionBid[];
  winning_bid: AuctionBid;
}

/**
 * Interface for query parameters when retrieving load auctions
 */
export interface LoadAuctionQueryParams {
  load_id: string;
  status: AuctionStatus | AuctionStatus[];
  auction_type: AuctionType;
  start_time_after: Date;
  start_time_before: Date;
  end_time_after: Date;
  end_time_before: Date;
  min_price: number;
  max_price: number;
  created_by: string;
  created_after: Date;
  created_before: Date;
  has_bids: boolean;
  has_winner: boolean;
  page: number;
  limit: number;
  sort_by: string;
  sort_direction: 'asc' | 'desc';
}