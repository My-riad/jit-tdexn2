import { AxiosResponse } from 'axios'; // ^1.4.0
import { get, post, put } from '../../../common/api/apiClient';
import { Load, LoadAssignment, LoadSummary } from '../../../common/interfaces/load.interface';
import { Driver, DriverSummary } from '../../../common/interfaces/driver.interface';
import { Vehicle, VehicleSummary } from '../../../common/interfaces/vehicle.interface';
import { CarrierPerformanceMetrics } from '../../../common/interfaces/carrier.interface';

/**
 * Represents an optimization recommendation for a carrier
 */
export interface OptimizationRecommendation {
  id: string;
  type: string;
  description: string;
  estimatedSavings: number;
  estimatedEmptyMilesReduction: number;
  affectedLoadIds: Array<string>;
  affectedDriverIds: Array<string>;
  affectedVehicleIds: Array<string>;
  details: Record<string, any>;
  createdAt: string;
  expiresAt: string;
}

/**
 * Detailed optimization information for a load
 */
export interface LoadOptimizationDetails {
  loadId: string;
  efficiencyScore: number;
  scoringFactors: Array<{ factor: string; description: string; impact: number }>;
  recommendedDrivers: Array<DriverSummary>;
  nearbySmartHubs: Array<SmartHub>;
  relayEligible: boolean;
  relayOptions: Array<RelayOption>;
  estimatedEmptyMiles: number;
  estimatedFuelConsumption: number;
  estimatedCO2Emissions: number;
}

/**
 * Represents a relay opportunity for a carrier
 */
export interface RelayOpportunity {
  id: string;
  loadId: string;
  load: LoadSummary;
  totalDistance: number;
  totalRevenue: number;
  segmentCount: number;
  segments: Array<RelaySegment>;
  exchangePoints: Array<SmartHub>;
  estimatedSavings: number;
  estimatedEmptyMilesReduction: number;
  createdAt: string;
  expiresAt: string;
}

/**
 * Represents a segment of a relay plan
 */
export interface RelaySegment {
  segmentId: string;
  origin: string;
  destination: string;
  originCoordinates: { latitude: number; longitude: number };
  destinationCoordinates: { latitude: number; longitude: number };
  distance: number;
  estimatedDuration: string;
  pickupTime: string;
  deliveryTime: string;
  recommendedDriver: DriverSummary | null;
  recommendedVehicle: VehicleSummary | null;
}

/**
 * Parameters for creating a relay plan
 */
export interface RelayPlanParams {
  loadId: string;
  segmentAssignments: Array<{ segmentId: string; driverId: string; vehicleId: string }>;
  exchangePointIds: Array<string>;
  additionalDetails: Record<string, any>;
}

/**
 * Represents a created relay plan
 */
export interface RelayPlan {
  planId: string;
  loadId: string;
  load: LoadSummary;
  segments: Array<RelaySegment>;
  assignments: Array<{ segmentId: string; driverId: string; vehicleId: string }>;
  exchangePoints: Array<SmartHub>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a Smart Hub location for load exchanges
 */
export interface SmartHub {
  id: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  amenities: Array<string>;
  capacity: number;
  efficiencyScore: number;
  operatingHours: string;
  active: boolean;
}

/**
 * Parameters for fetching Smart Hubs
 */
export interface SmartHubParams {
  coordinates?: { latitude: number; longitude: number };
  radius?: number;
  types?: Array<string>;
  amenities?: Array<string>;
  minCapacity?: number;
  minEfficiencyScore?: number;
}

/**
 * Efficiency metrics for a carrier's fleet
 */
export interface FleetEfficiencyMetrics {
  carrierId: string;
  overallEfficiencyScore: number;
  emptyMilesPercentage: number;
  totalMiles: number;
  loadedMiles: number;
  emptyMiles: number;
  fuelConsumption: number;
  co2Emissions: number;
  smartHubUtilization: number;
  relayParticipation: number;
  networkContributionScore: number;
  efficiencyTrend: Array<{ date: string; score: number }>;
  driverScores: Array<{ driverId: string; name: string; score: number }>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Optimization metrics for a driver
 */
export interface DriverOptimizationMetrics {
  driverId: string;
  efficiencyScore: number;
  emptyMilesPercentage: number;
  totalMiles: number;
  loadedMiles: number;
  emptyMiles: number;
  fuelEfficiency: number;
  smartHubVisits: number;
  relayParticipations: number;
  networkContribution: number;
  efficiencyTrend: Array<{ date: string; score: number }>;
  loadScores: Array<{ loadId: string; score: number }>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Optimization metrics for a vehicle
 */
export interface VehicleOptimizationMetrics {
  vehicleId: string;
  utilizationPercentage: number;
  emptyMilesPercentage: number;
  totalMiles: number;
  loadedMiles: number;
  emptyMiles: number;
  fuelConsumption: number;
  co2Emissions: number;
  smartHubVisits: number;
  relayParticipations: number;
  utilizationTrend: Array<{ date: string; utilization: number }>;
  loadEfficiency: Array<{ loadId: string; efficiency: number }>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Parameters for date range filtering
 */
export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

/**
 * Result of applying an optimization recommendation
 */
export interface ApplyRecommendationResult {
  recommendationId: string;
  success: boolean;
  message: string;
  actions: Array<{ entityType: string; entityId: string; action: string; status: string }>;
  actualSavings: number;
  actualEmptyMilesReduction: number;
}

/**
 * Network contribution score details for a carrier
 */
export interface NetworkContributionScore {
  carrierId: string;
  score: number;
  level: string;
  percentile: number;
  contributingFactors: Array<{ factor: string; contribution: number }>;
  historicalScores: Array<{ date: string; score: number }>;
  levelBenefits: Array<{ threshold: number; level: string; benefits: string[] }>;
}

/**
 * Optimization savings details for a carrier
 */
export interface OptimizationSavings {
  carrierId: string;
  totalSavings: number;
  emptyMilesSaved: number;
  fuelSaved: number;
  co2EmissionsSaved: number;
  driverHoursSaved: number;
  savingsByCategory: Array<{ category: string; savings: number }>;
  savingsTrend: Array<{ date: string; savings: number }>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Represents a relay option for a load
 */
export interface RelayOption {
  optionId: string;
  segmentCount: number;
  exchangePoints: Array<SmartHub>;
  estimatedSavings: number;
  estimatedEmptyMilesReduction: number;
  driverRecommendations: Array<{ segmentId: string; driverId: string; confidence: number }>;
}

/**
 * Fetches optimization recommendations for a carrier's loads and fleet
 * @param carrierId Carrier ID
 * @returns Array of optimization recommendations
 */
export const getOptimizationRecommendations = async (carrierId: string): Promise<OptimizationRecommendation[]> => {
  const response: AxiosResponse<OptimizationRecommendation[]> = await get(
    `/api/v1/carriers/${carrierId}/optimization/recommendations`
  );
  return response.data;
};

/**
 * Fetches detailed optimization information for a specific load
 * @param loadId Load ID
 * @returns Detailed optimization information for the load
 */
export const getLoadOptimizationDetails = async (loadId: string): Promise<LoadOptimizationDetails> => {
  const response: AxiosResponse<LoadOptimizationDetails> = await get(
    `/api/v1/loads/${loadId}/optimization`
  );
  return response.data;
};

/**
 * Fetches relay opportunities for a carrier's fleet
 * @param carrierId Carrier ID
 * @returns Array of relay opportunities
 */
export const getRelayOpportunities = async (carrierId: string): Promise<RelayOpportunity[]> => {
  const response: AxiosResponse<RelayOpportunity[]> = await get(
    `/api/v1/carriers/${carrierId}/relay-opportunities`
  );
  return response.data;
};

/**
 * Creates a relay plan for a specific load
 * @param loadId Load ID
 * @param relayParams Relay plan parameters
 * @returns Created relay plan
 */
export const createRelayPlan = async (loadId: string, relayParams: RelayPlanParams): Promise<RelayPlan> => {
  const response: AxiosResponse<RelayPlan> = await post(
    `/api/v1/loads/${loadId}/relay-plan`,
    relayParams
  );
  return response.data;
};

/**
 * Fetches Smart Hub locations relevant to a carrier's operations
 * @param carrierId Carrier ID
 * @param params Filter parameters
 * @returns Array of Smart Hub locations
 */
export const getSmartHubs = async (carrierId: string, params: SmartHubParams): Promise<SmartHub[]> => {
  const response: AxiosResponse<SmartHub[]> = await get(
    `/api/v1/carriers/${carrierId}/smart-hubs`,
    { params }
  );
  return response.data;
};

/**
 * Fetches efficiency metrics for a carrier's fleet
 * @param carrierId Carrier ID
 * @param dateRange Date range parameters
 * @returns Efficiency metrics for the carrier's fleet
 */
export const getFleetEfficiencyMetrics = async (
  carrierId: string,
  dateRange: DateRangeParams
): Promise<FleetEfficiencyMetrics> => {
  const response: AxiosResponse<FleetEfficiencyMetrics> = await get(
    `/api/v1/carriers/${carrierId}/efficiency-metrics`,
    { params: dateRange }
  );
  return response.data;
};

/**
 * Fetches optimization metrics for a specific driver
 * @param driverId Driver ID
 * @param dateRange Date range parameters
 * @returns Optimization metrics for the driver
 */
export const getDriverOptimizationMetrics = async (
  driverId: string,
  dateRange: DateRangeParams
): Promise<DriverOptimizationMetrics> => {
  const response: AxiosResponse<DriverOptimizationMetrics> = await get(
    `/api/v1/drivers/${driverId}/optimization-metrics`,
    { params: dateRange }
  );
  return response.data;
};

/**
 * Fetches optimization metrics for a specific vehicle
 * @param vehicleId Vehicle ID
 * @param dateRange Date range parameters
 * @returns Optimization metrics for the vehicle
 */
export const getVehicleOptimizationMetrics = async (
  vehicleId: string,
  dateRange: DateRangeParams
): Promise<VehicleOptimizationMetrics> => {
  const response: AxiosResponse<VehicleOptimizationMetrics> = await get(
    `/api/v1/vehicles/${vehicleId}/optimization-metrics`,
    { params: dateRange }
  );
  return response.data;
};

/**
 * Applies a specific optimization recommendation
 * @param recommendationId Recommendation ID
 * @returns Result of applying the recommendation
 */
export const applyOptimizationRecommendation = async (
  recommendationId: string
): Promise<ApplyRecommendationResult> => {
  const response: AxiosResponse<ApplyRecommendationResult> = await post(
    `/api/v1/optimization/recommendations/${recommendationId}/apply`
  );
  return response.data;
};

/**
 * Fetches the network contribution score for a carrier
 * @param carrierId Carrier ID
 * @returns Network contribution score details
 */
export const getNetworkContributionScore = async (
  carrierId: string
): Promise<NetworkContributionScore> => {
  const response: AxiosResponse<NetworkContributionScore> = await get(
    `/api/v1/carriers/${carrierId}/network-contribution`
  );
  return response.data;
};

/**
 * Fetches optimization savings for a carrier
 * @param carrierId Carrier ID
 * @param dateRange Date range parameters
 * @returns Optimization savings details
 */
export const getOptimizationSavings = async (
  carrierId: string,
  dateRange: DateRangeParams
): Promise<OptimizationSavings> => {
  const response: AxiosResponse<OptimizationSavings> = await get(
    `/api/v1/carriers/${carrierId}/optimization-savings`,
    { params: dateRange }
  );
  return response.data;
};