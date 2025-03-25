import { Address, ContactInfo } from '../types/global';

/**
 * Enumeration of carrier types based on fleet size
 */
export enum CarrierType {
  OWNER_OPERATOR = 'owner_operator',   // Single owner with 1-3 trucks
  SMALL_FLEET = 'small_fleet',         // 4-10 trucks
  MID_SIZE_FLEET = 'mid_size_fleet',   // 11-50 trucks
  LARGE_FLEET = 'large_fleet',         // 51-200 trucks
  ENTERPRISE = 'enterprise'            // 200+ trucks
}

/**
 * Main interface for carrier entities in the system
 */
export interface Carrier {
  /** Unique identifier for the carrier */
  id: string;
  
  /** Legal business name of the carrier */
  name: string;
  
  /** Department of Transportation number */
  dotNumber: string;
  
  /** Motor Carrier number */
  mcNumber: string;
  
  /** Tax identification number */
  taxId: string;
  
  /** Type of carrier based on fleet size */
  carrierType: CarrierType;
  
  /** Physical address of the carrier's headquarters */
  address: Address;
  
  /** Primary contact information */
  contactInfo: ContactInfo;
  
  /** Total number of vehicles in the fleet */
  fleetSize: number;
  
  /** Name of the carrier's insurance provider */
  insuranceProvider: string;
  
  /** Insurance policy number */
  insurancePolicyNumber: string;
  
  /** Amount of insurance coverage in USD */
  insuranceCoverageAmount: number;
  
  /** Expiration date of the insurance policy (ISO 8601) */
  insuranceExpirationDate: string;
  
  /** Safety rating assigned by regulatory bodies */
  safetyRating: string;
  
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  
  /** Whether the carrier is active in the system */
  active: boolean;
}

/**
 * Parameters required for creating a new carrier
 */
export interface CarrierCreationParams {
  /** Legal business name of the carrier */
  name: string;
  
  /** Department of Transportation number */
  dotNumber: string;
  
  /** Motor Carrier number */
  mcNumber: string;
  
  /** Tax identification number */
  taxId: string;
  
  /** Type of carrier based on fleet size */
  carrierType: CarrierType;
  
  /** Physical address of the carrier's headquarters */
  address: Address;
  
  /** Primary contact information */
  contactInfo: ContactInfo;
  
  /** Total number of vehicles in the fleet */
  fleetSize: number;
  
  /** Name of the carrier's insurance provider */
  insuranceProvider: string;
  
  /** Insurance policy number */
  insurancePolicyNumber: string;
  
  /** Amount of insurance coverage in USD */
  insuranceCoverageAmount: number;
  
  /** Expiration date of the insurance policy (ISO 8601) */
  insuranceExpirationDate: string;
  
  /** Safety rating assigned by regulatory bodies */
  safetyRating: string;
}

/**
 * Parameters for updating an existing carrier
 */
export interface CarrierUpdateParams {
  /** Legal business name of the carrier */
  name?: string;
  
  /** Department of Transportation number */
  dotNumber?: string;
  
  /** Motor Carrier number */
  mcNumber?: string;
  
  /** Tax identification number */
  taxId?: string;
  
  /** Type of carrier based on fleet size */
  carrierType?: CarrierType;
  
  /** Physical address of the carrier's headquarters */
  address?: Address;
  
  /** Primary contact information */
  contactInfo?: ContactInfo;
  
  /** Total number of vehicles in the fleet */
  fleetSize?: number;
  
  /** Name of the carrier's insurance provider */
  insuranceProvider?: string;
  
  /** Insurance policy number */
  insurancePolicyNumber?: string;
  
  /** Amount of insurance coverage in USD */
  insuranceCoverageAmount?: number;
  
  /** Expiration date of the insurance policy (ISO 8601) */
  insuranceExpirationDate?: string;
  
  /** Safety rating assigned by regulatory bodies */
  safetyRating?: string;
  
  /** Whether the carrier is active in the system */
  active?: boolean;
}

/**
 * Simplified carrier information for list views and summaries
 */
export interface CarrierSummary {
  /** Unique identifier for the carrier */
  id: string;
  
  /** Legal business name of the carrier */
  name: string;
  
  /** Department of Transportation number */
  dotNumber: string;
  
  /** Total number of vehicles in the fleet */
  fleetSize: number;
  
  /** Number of active drivers associated with this carrier */
  activeDrivers: number;
  
  /** Number of active vehicles associated with this carrier */
  activeVehicles: number;
  
  /** Number of active loads being transported by this carrier */
  activeLoads: number;
  
  /** Safety rating assigned by regulatory bodies */
  safetyRating: string;
  
  /** Average efficiency score across all drivers */
  averageEfficiencyScore: number;
}

/**
 * Performance metrics for carrier evaluation and optimization
 */
export interface CarrierPerformanceMetrics {
  /** Unique identifier for the carrier */
  carrierId: string;
  
  /** Overall efficiency score for the carrier's fleet */
  fleetEfficiencyScore: number;
  
  /** Percentage of miles driven without a load */
  emptyMilesPercentage: number;
  
  /** Percentage of on-time deliveries */
  onTimeDeliveryPercentage: number;
  
  /** Percentage of on-time pickups */
  onTimePickupPercentage: number;
  
  /** Average efficiency score of all drivers in the fleet */
  averageDriverScore: number;
  
  /** Percentage of vehicle utilization */
  vehicleUtilizationPercentage: number;
  
  /** Percentage of loads involving Smart Hub exchanges */
  smartHubUtilizationPercentage: number;
  
  /** Total number of loads completed in the period */
  totalLoadsCompleted: number;
  
  /** Total miles driven in the period */
  totalMiles: number;
  
  /** Miles driven with loads in the period */
  loadedMiles: number;
  
  /** Miles driven without loads in the period */
  emptyMiles: number;
  
  /** Total revenue generated in the period (USD) */
  totalRevenue: number;
  
  /** Average revenue per mile (USD) */
  revenuePerMile: number;
  
  /** Start of the reporting period (ISO 8601) */
  periodStart: string;
  
  /** End of the reporting period (ISO 8601) */
  periodEnd: string;
}

/**
 * Tracks relationships between carriers and shippers for load matching
 */
export interface CarrierShipperRelationship {
  /** Unique identifier for the relationship */
  relationshipId: string;
  
  /** Unique identifier for the carrier */
  carrierId: string;
  
  /** Unique identifier for the shipper */
  shipperId: string;
  
  /** Status of the relationship (active, inactive, pending, etc.) */
  status: string;
  
  /** Whether this carrier is preferred by the shipper */
  preferred: boolean;
  
  /** Contract number if applicable */
  contractNumber: string;
  
  /** Contract start date (ISO 8601) */
  contractStartDate: string;
  
  /** Contract end date (ISO 8601) */
  contractEndDate: string;
  
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Statistics about carrier's contribution to the optimization network
 */
export interface CarrierNetworkStatistics {
  /** Unique identifier for the carrier */
  carrierId: string;
  
  /** Score representing contribution to network efficiency */
  networkContributionScore: number;
  
  /** Total estimated savings generated through optimization (USD) */
  optimizationSavings: number;
  
  /** Number of relay loads participated in */
  relayParticipationCount: number;
  
  /** Number of Smart Hub visits by carrier's drivers */
  smartHubVisits: number;
  
  /** Estimated carbon emissions saved through optimization (kg) */
  carbonEmissionsSaved: number;
  
  /** Estimated fuel savings through optimization (gallons) */
  fuelGallonsSaved: number;
  
  /** Start of the reporting period (ISO 8601) */
  periodStart: string;
  
  /** End of the reporting period (ISO 8601) */
  periodEnd: string;
}

/**
 * Carrier recommendation data for shippers based on optimization factors
 */
export interface CarrierRecommendation {
  /** Unique identifier for the carrier */
  carrierId: string;
  
  /** Legal business name of the carrier */
  carrierName: string;
  
  /** Network efficiency score (0-100) */
  networkScore: number;
  
  /** Percentage of on-time deliveries */
  onTimePercentage: number;
  
  /** Estimated price for the load (USD) */
  price: number;
  
  /** Availability description (e.g., "Immediate", "Next Day") */
  availability: string;
  
  /** Number of trucks available in the area */
  availableTrucks: number;
  
  /** Factors contributing to this recommendation */
  recommendationFactors: Array<{ factor: string; description: string }>;
  
  /** Historical performance with this shipper */
  historicalPerformance: {
    loadsCompleted: number;
    averageRating: number;
  };
}