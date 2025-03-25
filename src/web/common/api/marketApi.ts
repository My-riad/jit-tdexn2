/**
 * Market Intelligence API client for the AI-driven Freight Optimization Platform.
 * 
 * This module provides functions to interact with the Market Intelligence Service,
 * enabling features such as dynamic pricing, demand forecasting, hotspot detection,
 * and auction-based load matching. These services support the platform's ability to
 * adjust rates based on real-time market conditions and optimize network efficiency.
 * 
 * @version 1.0.0
 */

import apiClient from './apiClient';
import {
  RateQueryParams,
  MarketRate,
  RateCalculationResult,
  RateTrendAnalysis,
  HotspotType,
  HotspotSeverity,
  Hotspot,
  HotspotQueryParams,
  ForecastTimeframe,
  DemandForecast,
  ForecastQueryParams,
  AuctionStatus,
  AuctionType,
  LoadAuction,
  AuctionBid,
  LoadAuctionWithBids,
  LoadAuctionQueryParams
} from '../interfaces/market.interface';
import { API_ROUTES } from '../constants/endpoints';

// Base URL for market intelligence API endpoints
const BASE_URL = API_ROUTES.MARKET_ENDPOINTS;

/**
 * Fetches current market rate for a specific lane and equipment type
 * 
 * @param originRegion - Origin region code
 * @param destinationRegion - Destination region code
 * @param equipmentType - Type of equipment required
 * @returns Promise resolving to current market rate data
 */
export const getMarketRate = async (
  originRegion: string,
  destinationRegion: string,
  equipmentType: EquipmentType
): Promise<MarketRate> => {
  const params = {
    origin_region: originRegion,
    destination_region: destinationRegion,
    equipment_type: equipmentType
  };
  
  const response = await apiClient.get(`${BASE_URL}/rates`, { params });
  return response.data;
};

/**
 * Fetches historical market rates for a specific lane and equipment type
 * 
 * @param params - Query parameters including origin, destination, equipment type, and date range
 * @returns Promise resolving to array of historical market rates
 */
export const getHistoricalRates = async (
  params: RateQueryParams
): Promise<MarketRate[]> => {
  const response = await apiClient.get(`${BASE_URL}/rates/historical`, { params });
  return response.data;
};

/**
 * Calculates a dynamic rate for a specific lane based on current market conditions
 * 
 * @param originRegion - Origin region code
 * @param destinationRegion - Destination region code
 * @param equipmentType - Type of equipment required
 * @param options - Optional calculation parameters and factors
 * @returns Promise resolving to calculated rate with adjustment factors
 */
export const calculateRate = async (
  originRegion: string,
  destinationRegion: string,
  equipmentType: EquipmentType,
  options?: {
    urgency?: number;
    networkOptimizationWeight?: number;
    includeBreakdown?: boolean;
  }
): Promise<RateCalculationResult> => {
  const params = {
    origin_region: originRegion,
    destination_region: destinationRegion,
    equipment_type: equipmentType
  };
  
  const response = await apiClient.post(`${BASE_URL}/rates/calculate`, options, { params });
  return response.data;
};

/**
 * Calculates a dynamic rate for a specific load
 * 
 * @param loadData - Load details including pickup and delivery locations
 * @returns Promise resolving to calculated rate with adjustment factors
 */
export const calculateLoadRate = async (
  loadData: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    equipment_type: EquipmentType;
    weight: number;
    pickup_date: string;
    delivery_date: string;
    special_requirements?: string[];
    [key: string]: any;
  }
): Promise<RateCalculationResult> => {
  const response = await apiClient.post(`${BASE_URL}/rates/calculate-load`, loadData);
  return response.data;
};

/**
 * Analyzes rate trends for a specific lane and equipment type
 * 
 * @param originRegion - Origin region code
 * @param destinationRegion - Destination region code
 * @param equipmentType - Type of equipment required
 * @param days - Number of days to analyze
 * @returns Promise resolving to rate trend analysis data
 */
export const analyzeRateTrends = async (
  originRegion: string,
  destinationRegion: string,
  equipmentType: EquipmentType,
  days: number
): Promise<RateTrendAnalysis> => {
  const params = {
    origin_region: originRegion,
    destination_region: destinationRegion,
    equipment_type: equipmentType,
    days
  };
  
  const response = await apiClient.get(`${BASE_URL}/rates/trends`, { params });
  return response.data;
};

/**
 * Fetches the current supply/demand ratio for a specific lane
 * 
 * @param originRegion - Origin region code
 * @param destinationRegion - Destination region code
 * @param equipmentType - Type of equipment required
 * @returns Promise resolving to supply/demand ratio data
 */
export const getSupplyDemandRatio = async (
  originRegion: string,
  destinationRegion: string,
  equipmentType: EquipmentType
): Promise<{ ratio: number; timestamp: Date }> => {
  const params = {
    origin_region: originRegion,
    destination_region: destinationRegion,
    equipment_type: equipmentType
  };
  
  const response = await apiClient.get(`${BASE_URL}/rates/supply-demand`, { params });
  return response.data;
};

/**
 * Fetches hotspots based on query parameters
 * 
 * @param params - Query parameters to filter hotspots
 * @returns Promise resolving to array of hotspots matching the query
 */
export const getHotspots = async (
  params: HotspotQueryParams
): Promise<Hotspot[]> => {
  const response = await apiClient.get(`${BASE_URL}/hotspots`, { params });
  return response.data;
};

/**
 * Fetches a specific hotspot by ID
 * 
 * @param hotspotId - Unique identifier of the hotspot
 * @returns Promise resolving to hotspot data
 */
export const getHotspotById = async (
  hotspotId: string
): Promise<Hotspot> => {
  const response = await apiClient.get(`${BASE_URL}/hotspots/${hotspotId}`);
  return response.data;
};

/**
 * Fetches all currently active hotspots
 * 
 * @returns Promise resolving to array of active hotspots
 */
export const getActiveHotspots = async (): Promise<Hotspot[]> => {
  const response = await apiClient.get(`${BASE_URL}/hotspots/active`);
  return response.data;
};

/**
 * Fetches hotspots of a specific type
 * 
 * @param type - Type of hotspot to filter by
 * @param activeOnly - If true, returns only active hotspots
 * @returns Promise resolving to array of hotspots of the specified type
 */
export const getHotspotsByType = async (
  type: HotspotType,
  activeOnly: boolean = true
): Promise<Hotspot[]> => {
  const params = {
    type,
    active_only: activeOnly
  };
  
  const response = await apiClient.get(`${BASE_URL}/hotspots/by-type`, { params });
  return response.data;
};

/**
 * Fetches hotspots of a specific severity level
 * 
 * @param severity - Severity level to filter by
 * @param activeOnly - If true, returns only active hotspots
 * @returns Promise resolving to array of hotspots of the specified severity
 */
export const getHotspotsBySeverity = async (
  severity: HotspotSeverity,
  activeOnly: boolean = true
): Promise<Hotspot[]> => {
  const params = {
    severity,
    active_only: activeOnly
  };
  
  const response = await apiClient.get(`${BASE_URL}/hotspots/by-severity`, { params });
  return response.data;
};

/**
 * Fetches hotspots near a specific location
 * 
 * @param latitude - Latitude of the center point
 * @param longitude - Longitude of the center point
 * @param radius - Search radius in miles
 * @param activeOnly - If true, returns only active hotspots
 * @returns Promise resolving to array of nearby hotspots
 */
export const getHotspotsNearLocation = async (
  latitude: number,
  longitude: number,
  radius: number,
  activeOnly: boolean = true
): Promise<Hotspot[]> => {
  const params = {
    latitude,
    longitude,
    radius,
    active_only: activeOnly
  };
  
  const response = await apiClient.get(`${BASE_URL}/hotspots/near`, { params });
  return response.data;
};

/**
 * Fetches the latest demand forecast for specified parameters
 * 
 * @param timeframe - Time period for the forecast
 * @param region - Region code for the forecast
 * @param equipmentType - Type of equipment to filter by
 * @returns Promise resolving to latest demand forecast
 */
export const getLatestForecast = async (
  timeframe: ForecastTimeframe,
  region: string,
  equipmentType: EquipmentType
): Promise<DemandForecast> => {
  const params = {
    timeframe,
    region,
    equipment_type: equipmentType
  };
  
  const response = await apiClient.get(`${BASE_URL}/forecasts/latest`, { params });
  return response.data;
};

/**
 * Fetches a specific forecast by ID
 * 
 * @param forecastId - Unique identifier of the forecast
 * @returns Promise resolving to demand forecast data
 */
export const getForecastById = async (
  forecastId: string
): Promise<DemandForecast> => {
  const response = await apiClient.get(`${BASE_URL}/forecasts/${forecastId}`);
  return response.data;
};

/**
 * Queries forecasts based on various parameters
 * 
 * @param params - Query parameters to filter forecasts
 * @returns Promise resolving to array of matching forecasts
 */
export const queryForecasts = async (
  params: ForecastQueryParams
): Promise<DemandForecast[]> => {
  const response = await apiClient.get(`${BASE_URL}/forecasts`, { params });
  return response.data;
};

/**
 * Fetches auctions based on query parameters
 * 
 * @param params - Query parameters to filter auctions
 * @returns Promise resolving to auctions with pagination metadata
 */
export const getAuctions = async (
  params: LoadAuctionQueryParams
): Promise<{ auctions: LoadAuction[]; total: number; page: number; limit: number }> => {
  const response = await apiClient.get(`${BASE_URL}/auctions`, { params });
  return response.data;
};

/**
 * Fetches an auction by its ID, including bids
 * 
 * @param auctionId - Unique identifier of the auction
 * @returns Promise resolving to auction with bids
 */
export const getAuctionById = async (
  auctionId: string
): Promise<LoadAuctionWithBids> => {
  const response = await apiClient.get(`${BASE_URL}/auctions/${auctionId}`);
  return response.data;
};

/**
 * Creates a new auction for a load
 * 
 * @param auctionData - Auction details including load ID, start/end times, and pricing
 * @returns Promise resolving to created auction
 */
export const createAuction = async (
  auctionData: {
    load_id: string;
    title: string;
    description: string;
    auction_type: AuctionType;
    start_time: Date | string;
    end_time: Date | string;
    starting_price: number;
    reserve_price?: number;
    min_bid_increment?: number;
    network_efficiency_weight?: number;
    price_weight?: number;
    driver_score_weight?: number;
    [key: string]: any;
  }
): Promise<LoadAuction> => {
  const response = await apiClient.post(`${BASE_URL}/auctions`, auctionData);
  return response.data;
};

/**
 * Updates an existing auction
 * 
 * @param auctionId - Unique identifier of the auction to update
 * @param updateData - Fields to update in the auction
 * @returns Promise resolving to updated auction
 */
export const updateAuction = async (
  auctionId: string,
  updateData: {
    title?: string;
    description?: string;
    start_time?: Date | string;
    end_time?: Date | string;
    reserve_price?: number;
    min_bid_increment?: number;
    network_efficiency_weight?: number;
    price_weight?: number;
    driver_score_weight?: number;
    [key: string]: any;
  }
): Promise<LoadAuction> => {
  const response = await apiClient.put(`${BASE_URL}/auctions/${auctionId}`, updateData);
  return response.data;
};

/**
 * Starts an auction, making it active for bidding
 * 
 * @param auctionId - Unique identifier of the auction to start
 * @returns Promise resolving to started auction
 */
export const startAuction = async (
  auctionId: string
): Promise<LoadAuction> => {
  const response = await apiClient.post(`${BASE_URL}/auctions/${auctionId}/start`);
  return response.data;
};

/**
 * Ends an active auction and determines the winner
 * 
 * @param auctionId - Unique identifier of the auction to end
 * @returns Promise resolving to completed auction with winning bid
 */
export const endAuction = async (
  auctionId: string
): Promise<LoadAuctionWithBids> => {
  const response = await apiClient.post(`${BASE_URL}/auctions/${auctionId}/end`);
  return response.data;
};

/**
 * Cancels an auction that hasn't been completed yet
 * 
 * @param auctionId - Unique identifier of the auction to cancel
 * @param reason - Reason for cancellation
 * @returns Promise resolving to cancelled auction
 */
export const cancelAuction = async (
  auctionId: string,
  reason: string
): Promise<LoadAuction> => {
  const response = await apiClient.post(`${BASE_URL}/auctions/${auctionId}/cancel`, { reason });
  return response.data;
};

/**
 * Places a new bid on an active auction
 * 
 * @param auctionId - Unique identifier of the auction
 * @param bidData - Bid details including amount and bidder information
 * @returns Promise resolving to created bid
 */
export const placeBid = async (
  auctionId: string,
  bidData: {
    bidder_id: string;
    bidder_type: 'driver' | 'carrier';
    amount: number;
    notes?: string;
    [key: string]: any;
  }
): Promise<AuctionBid> => {
  const response = await apiClient.post(`${BASE_URL}/auctions/${auctionId}/bids`, bidData);
  return response.data;
};

/**
 * Fetches all bids for a specific auction
 * 
 * @param auctionId - Unique identifier of the auction
 * @returns Promise resolving to array of bids
 */
export const getAuctionBids = async (
  auctionId: string
): Promise<AuctionBid[]> => {
  const response = await apiClient.get(`${BASE_URL}/auctions/${auctionId}/bids`);
  return response.data;
};

/**
 * Updates an existing bid
 * 
 * @param bidId - Unique identifier of the bid to update
 * @param updateData - Fields to update in the bid
 * @returns Promise resolving to updated bid
 */
export const updateBid = async (
  bidId: string,
  updateData: {
    amount?: number;
    notes?: string;
    [key: string]: any;
  }
): Promise<AuctionBid> => {
  const response = await apiClient.put(`${BASE_URL}/bids/${bidId}`, updateData);
  return response.data;
};

/**
 * Withdraws a bid from an active auction
 * 
 * @param bidId - Unique identifier of the bid to withdraw
 * @returns Promise resolving to withdrawn bid
 */
export const withdrawBid = async (
  bidId: string
): Promise<AuctionBid> => {
  const response = await apiClient.post(`${BASE_URL}/bids/${bidId}/withdraw`);
  return response.data;
};

/**
 * Fetches all bids placed by a specific bidder
 * 
 * @param bidderId - Unique identifier of the bidder
 * @param bidderType - Type of bidder (driver or carrier)
 * @returns Promise resolving to array of bids
 */
export const getBidderBids = async (
  bidderId: string,
  bidderType: 'driver' | 'carrier'
): Promise<AuctionBid[]> => {
  const params = {
    bidder_type: bidderType
  };
  
  const response = await apiClient.get(`${BASE_URL}/bidders/${bidderId}/bids`, { params });
  return response.data;
};