/**
 * Optimization Service for the Shipper Portal
 * 
 * Provides functionality for load optimization, carrier recommendations based on network efficiency,
 * and optimization insights. Interacts with the backend optimization engine and market intelligence
 * services to provide AI-driven optimization capabilities to shippers.
 */

import apiClient from '../../common/api/apiClient';
import { calculateLoadRate, getSupplyDemandRatio } from '../../common/api/marketApi';
import { Load, LoadWithDetails } from '../../common/interfaces/load.interface';
import { RateCalculationResult } from '../../common/interfaces/market.interface';
import { API_ROUTES } from '../../common/constants/endpoints';

// Base URL for optimization engine API endpoints
const OPTIMIZATION_API_URL = API_ROUTES.OPTIMIZATION_ENGINE;

/**
 * Interface for load optimization recommendations
 */
export interface OptimizationRecommendation {
  id: string;
  loadId: string;
  type: 'scheduling' | 'routing' | 'consolidation' | 'carrier' | 'pricing';
  description: string;
  potentialSavings: number;
  emptyMilesReduction?: number;
  networkEfficiencyImprovement: number;
  confidence: number;
  implementationSteps: string[];
  relatedLoads?: string[];
  expiresAt?: string;
}

/**
 * Parameters for carrier optimization score requests
 */
export interface CarrierOptimizationParams {
  sortBy?: 'networkScore' | 'price' | 'onTimePercentage' | 'availability';
  limit?: number;
  minScore?: number;
}

/**
 * Carrier with network optimization score for a specific load
 */
export interface CarrierOptimizationScore {
  carrierId: string;
  carrierName: string;
  networkScore: number;
  price: number;
  onTimePercentage: number;
  availability: number;
  scoringFactors: Array<{ factor: string; description: string; impact: number }>;
}

/**
 * Insight about potential optimization opportunities
 */
export interface OptimizationInsight {
  id: string;
  type: 'consolidation' | 'scheduling' | 'routing' | 'carrier' | 'market';
  title: string;
  description: string;
  potentialSavings?: number;
  affectedLoads?: string[];
  priority: 'high' | 'medium' | 'low';
  validUntil?: string;
  actionUrl?: string;
}

/**
 * Result of network efficiency calculation for a load
 */
export interface NetworkEfficiencyResult {
  score: number;
  emptyMilesReduction: number;
  networkContribution: number;
  factors: Array<{ factor: string; description: string; impact: number }>;
  recommendations?: string[];
}

/**
 * Parameters for load consolidation opportunity requests
 */
export interface ConsolidationParams {
  startDate?: string;
  endDate?: string;
  equipmentTypes?: string[];
  minSavings?: number;
}

/**
 * Opportunity to consolidate multiple loads for better efficiency
 */
export interface ConsolidationOpportunity {
  id: string;
  loadIds: string[];
  description: string;
  potentialSavings: number;
  emptyMilesReduction: number;
  consolidationPlan: { steps: string[]; timeline: string[] };
  confidence: number;
  validUntil?: string;
}

/**
 * Recommendation for using a Smart Hub for load exchange
 */
export interface SmartHubRecommendation {
  hubId: string;
  name: string;
  location: { latitude: number; longitude: number };
  address: string;
  facilityType: string;
  amenities?: string[];
  potentialSavings: number;
  efficiencyScore: number;
  availableDrivers?: number;
}

/**
 * Date range parameters for optimization queries
 */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Calculated savings from implementing optimization recommendations
 */
export interface OptimizationSavings {
  totalSavings: number;
  emptyMilesReduction: number;
  fuelSavings: number;
  timeSavings: number;
  co2Reduction: number;
  breakdownByCategory: Record<string, number>;
  implementedRecommendations: number;
  pendingRecommendations: number;
}

/**
 * Fetches optimization recommendations for a specific load
 * 
 * @param loadId - ID of the load to get recommendations for
 * @returns Promise resolving to array of optimization recommendations
 */
export const getLoadOptimizationRecommendations = async (
  loadId: string
): Promise<OptimizationRecommendation[]> => {
  const response = await apiClient.get(`${OPTIMIZATION_API_URL}/recommendations/${loadId}`);
  return response.data;
};

/**
 * Fetches network optimization scores for carriers based on a specific load
 * 
 * @param loadId - ID of the load to get carrier scores for
 * @param params - Parameters to filter and sort carriers
 * @returns Promise resolving to array of carriers with optimization scores
 */
export const getCarrierOptimizationScores = async (
  loadId: string,
  params: CarrierOptimizationParams = {}
): Promise<CarrierOptimizationScore[]> => {
  const response = await apiClient.get(`${OPTIMIZATION_API_URL}/carriers/scores/${loadId}`, { params });
  return response.data;
};

/**
 * Fetches optimization insights for a shipper's loads
 * 
 * @param shipperId - ID of the shipper to get insights for
 * @returns Promise resolving to array of optimization insights
 */
export const getOptimizationInsights = async (
  shipperId: string
): Promise<OptimizationInsight[]> => {
  const response = await apiClient.get(`${OPTIMIZATION_API_URL}/insights/shipper/${shipperId}`);
  return response.data;
};

/**
 * Calculates an optimized rate for a load based on market conditions and network efficiency
 * 
 * @param load - Load data to calculate optimized rate for
 * @returns Promise resolving to calculated rate with optimization factors
 */
export const calculateOptimizedRate = async (
  load: Load
): Promise<RateCalculationResult> => {
  return calculateLoadRate(load);
};

/**
 * Calculates a network efficiency score for a load based on its impact on the overall network
 * 
 * @param load - Load to calculate network efficiency for
 * @returns Promise resolving to network efficiency score and factors
 */
export const getNetworkEfficiencyScore = async (
  load: Load
): Promise<NetworkEfficiencyResult> => {
  const response = await apiClient.post(`${OPTIMIZATION_API_URL}/efficiency-score`, load);
  return response.data;
};

/**
 * Identifies opportunities to consolidate multiple loads for better efficiency
 * 
 * @param shipperId - ID of the shipper to find consolidation opportunities for
 * @param params - Parameters to filter consolidation opportunities
 * @returns Promise resolving to array of consolidation opportunities
 */
export const getLoadConsolidationOpportunities = async (
  shipperId: string,
  params: ConsolidationParams = {}
): Promise<ConsolidationOpportunity[]> => {
  const response = await apiClient.get(`${OPTIMIZATION_API_URL}/consolidation/${shipperId}`, { params });
  return response.data;
};

/**
 * Gets recommendations for Smart Hub usage based on a load's origin and destination
 * 
 * @param load - Load data with origin and destination
 * @returns Promise resolving to array of Smart Hub recommendations
 */
export const getSmartHubRecommendations = async (
  load: LoadWithDetails
): Promise<SmartHubRecommendation[]> => {
  // Extract origin and destination coordinates
  const pickupLocation = load.locations.find(loc => loc.locationType === 'pickup');
  const deliveryLocation = load.locations.find(loc => loc.locationType === 'delivery');

  if (!pickupLocation || !deliveryLocation) {
    throw new Error('Load must have both pickup and delivery locations');
  }

  const params = {
    origin_lat: pickupLocation.coordinates.latitude,
    origin_lng: pickupLocation.coordinates.longitude,
    destination_lat: deliveryLocation.coordinates.latitude,
    destination_lng: deliveryLocation.coordinates.longitude,
    equipment_type: load.equipmentType
  };

  const response = await apiClient.get(`${OPTIMIZATION_API_URL}/smart-hubs`, { params });
  return response.data;
};

/**
 * Calculates potential savings from implementing optimization recommendations
 * 
 * @param shipperId - ID of the shipper to calculate savings for
 * @param dateRange - Optional date range for the calculation
 * @returns Promise resolving to calculated savings information
 */
export const getOptimizationSavings = async (
  shipperId: string,
  dateRange: DateRangeParams = {}
): Promise<OptimizationSavings> => {
  const response = await apiClient.get(`${OPTIMIZATION_API_URL}/savings/${shipperId}`, { params: dateRange });
  return response.data;
};

/**
 * Applies a specific optimization recommendation to a load
 * 
 * @param loadId - ID of the load to apply the recommendation to
 * @param recommendationId - ID of the recommendation to apply
 * @returns Promise resolving to result of applying the recommendation
 */
export const applyOptimizationRecommendation = async (
  loadId: string,
  recommendationId: string
): Promise<{ success: boolean; updatedLoad?: Load; message: string }> => {
  const response = await apiClient.post(`${OPTIMIZATION_API_URL}/recommendations/apply`, {
    loadId,
    recommendationId
  });
  return response.data;
};