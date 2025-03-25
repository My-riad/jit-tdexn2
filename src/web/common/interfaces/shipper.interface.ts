import { Address, ContactInfo } from '../types/global';

/**
 * Enumeration of shipper types based on business model
 */
export enum ShipperType {
  MANUFACTURER = 'manufacturer',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  BROKER = 'broker',
  THIRD_PARTY_LOGISTICS = '3pl',
}

/**
 * Main interface for shipper entities in the system
 */
export interface Shipper {
  /** Unique identifier for the shipper */
  id: string;
  
  /** Business name of the shipper */
  name: string;
  
  /** Type of shipping business */
  shipperType: ShipperType;
  
  /** Business tax identification number */
  taxId: string;
  
  /** Primary business address */
  address: Address;
  
  /** Primary contact information */
  contactInfo: ContactInfo;
  
  /** Credit rating score (0-100) */
  creditRating: number;
  
  /** Payment terms (e.g., "Net 30") */
  paymentTerms: string;
  
  /** List of primary commodity types shipped */
  primaryCommodities: string[];
  
  /** Timestamp when the shipper was created */
  createdAt: string;
  
  /** Timestamp when the shipper was last updated */
  updatedAt: string;
  
  /** Whether the shipper account is active */
  active: boolean;
}

/**
 * Parameters required for creating a new shipper
 */
export interface ShipperCreationParams {
  /** Business name of the shipper */
  name: string;
  
  /** Type of shipping business */
  shipperType: ShipperType;
  
  /** Business tax identification number */
  taxId: string;
  
  /** Primary business address */
  address: Address;
  
  /** Primary contact information */
  contactInfo: ContactInfo;
  
  /** Credit rating score (0-100) */
  creditRating: number;
  
  /** Payment terms (e.g., "Net 30") */
  paymentTerms: string;
  
  /** List of primary commodity types shipped */
  primaryCommodities: string[];
}

/**
 * Parameters for updating an existing shipper
 */
export interface ShipperUpdateParams {
  /** Business name of the shipper */
  name?: string;
  
  /** Type of shipping business */
  shipperType?: ShipperType;
  
  /** Business tax identification number */
  taxId?: string;
  
  /** Primary business address */
  address?: Address;
  
  /** Primary contact information */
  contactInfo?: ContactInfo;
  
  /** Credit rating score (0-100) */
  creditRating?: number;
  
  /** Payment terms (e.g., "Net 30") */
  paymentTerms?: string;
  
  /** List of primary commodity types shipped */
  primaryCommodities?: string[];
  
  /** Whether the shipper account is active */
  active?: boolean;
}

/**
 * Simplified shipper information for dashboard and summary views
 */
export interface ShipperSummary {
  /** Unique identifier for the shipper */
  id: string;
  
  /** Business name of the shipper */
  name: string;
  
  /** Type of shipping business */
  shipperType: ShipperType;
  
  /** Count of currently active loads */
  activeLoads: number;
  
  /** Count of loads waiting to be assigned */
  pendingLoads: number;
  
  /** Count of loads completed today */
  completedLoadsToday: number;
  
  /** Count of loads with issues or exceptions */
  issueLoads: number;
  
  /** Total monetary savings from optimization */
  optimizationSavings: number;
  
  /** Percentage of on-time deliveries */
  onTimeDeliveryPercentage: number;
}

/**
 * Performance metrics for shipper evaluation and analytics
 */
export interface ShipperPerformanceMetrics {
  /** Shipper identifier */
  shipperId: string;
  
  /** Total number of loads */
  totalLoads: number;
  
  /** Number of completed loads */
  completedLoads: number;
  
  /** Number of cancelled loads */
  cancelledLoads: number;
  
  /** Percentage of pickups completed on time */
  onTimePickupPercentage: number;
  
  /** Percentage of deliveries completed on time */
  onTimeDeliveryPercentage: number;
  
  /** Average transit time in hours */
  averageTransitTime: number;
  
  /** Average cost per load */
  averageLoadCost: number;
  
  /** Total amount spent on freight */
  totalSpend: number;
  
  /** Total savings from optimization */
  optimizationSavings: number;
  
  /** Percentage reduction in empty miles */
  emptyMilesReduction: number;
  
  /** Tons of carbon emissions saved */
  carbonEmissionsSaved: number;
  
  /** Start of the period for these metrics */
  periodStart: string;
  
  /** End of the period for these metrics */
  periodEnd: string;
}

/**
 * Statistical information about a shipper's load patterns
 */
export interface ShipperLoadStatistics {
  /** Shipper identifier */
  shipperId: string;
  
  /** Total number of loads in the period */
  totalLoads: number;
  
  /** Breakdown of loads by status */
  loadsByStatus: Record<string, number>;
  
  /** Breakdown of loads by equipment type */
  loadsByEquipmentType: Record<string, number>;
  
  /** Most common origin locations */
  topOrigins: Array<{ city: string; state: string; count: number; }>;
  
  /** Most common destination locations */
  topDestinations: Array<{ city: string; state: string; count: number; }>;
  
  /** Most common lanes (origin-destination pairs) */
  topLanes: Array<{ origin: string; destination: string; count: number; }>;
  
  /** Distribution of loads by day */
  loadsByDay: Array<{ date: string; count: number; }>;
  
  /** Average weight of loads in pounds */
  averageLoadWeight: number;
  
  /** Start of the period for these statistics */
  periodStart: string;
  
  /** End of the period for these statistics */
  periodEnd: string;
}

/**
 * Optimization savings achieved through the platform for a shipper
 */
export interface OptimizationSavings {
  /** Shipper identifier */
  shipperId: string;
  
  /** Total monetary savings */
  totalSavings: number;
  
  /** Savings as a percentage of total spend */
  savingsPercentage: number;
  
  /** Percentage reduction in empty miles */
  emptyMilesReduction: number;
  
  /** Tons of carbon emissions saved */
  carbonEmissionsSaved: number;
  
  /** Gallons of fuel saved */
  fuelGallonsSaved: number;
  
  /** Breakdown of savings by month */
  savingsByMonth: Array<{ month: string; savings: number; }>;
  
  /** Breakdown of savings by lane */
  savingsByLane: Array<{ origin: string; destination: string; savings: number; }>;
  
  /** Comparison with previous period */
  comparisonWithPrevious: { percentage: number; trend: 'up' | 'down' | 'stable'; };
  
  /** Start of the period for these savings */
  periodStart: string;
  
  /** End of the period for these savings */
  periodEnd: string;
}

/**
 * Market intelligence insights specific to a shipper's lanes and load patterns
 */
export interface ShipperMarketInsight {
  /** Unique insight identifier */
  id: string;
  
  /** Shipper identifier */
  shipperId: string;
  
  /** Type of insight (e.g., "rate_trend", "capacity_shortage") */
  insightType: string;
  
  /** Short title of the insight */
  title: string;
  
  /** Detailed description of the insight */
  description: string;
  
  /** Relevance score for the shipper (0-100) */
  relevanceScore: number;
  
  /** Estimated financial impact */
  impactEstimate: number;
  
  /** Geographic region for the insight */
  region: string;
  
  /** Specific lane information */
  lane: { origin: string; destination: string; };
  
  /** Expiration date for the insight */
  expiresAt: string;
  
  /** Creation date of the insight */
  createdAt: string;
}

/**
 * Shipper's preferences for specific carriers
 */
export interface ShipperCarrierPreference {
  /** Unique preference identifier */
  id: string;
  
  /** Shipper identifier */
  shipperId: string;
  
  /** Carrier identifier */
  carrierId: string;
  
  /** Carrier name for display */
  carrierName: string;
  
  /** Level of preference for this carrier */
  preferenceLevel: 'preferred' | 'approved' | 'restricted' | 'blocked';
  
  /** Additional notes about the preference */
  notes: string;
  
  /** Contract number if applicable */
  contractNumber: string;
  
  /** Contract start date if applicable */
  contractStartDate: string;
  
  /** Contract end date if applicable */
  contractEndDate: string;
  
  /** Creation date of the preference */
  createdAt: string;
  
  /** Last update date of the preference */
  updatedAt: string;
}

/**
 * Shipper's settings and preferences for the platform
 */
export interface ShipperSettings {
  /** Shipper identifier */
  shipperId: string;
  
  /** Default equipment types for loads */
  defaultEquipmentTypes: string[];
  
  /** Default origin locations */
  defaultOriginLocations: Array<{ name: string; address: Address; }>;
  
  /** Default destination locations */
  defaultDestinationLocations: Array<{ name: string; address: Address; }>;
  
  /** Default contact information for loads */
  defaultContactInfo: ContactInfo;
  
  /** Notification preferences */
  notificationPreferences: { email: boolean; sms: boolean; push: boolean; };
  
  /** Threshold for automatic load approval in dollars */
  autoApproveThreshold: number;
  
  /** Optimization preference weights (0-100) */
  optimizationPreferences: { 
    prioritizeCost: number;
    prioritizeSpeed: number;
    prioritizeSustainability: number;
  };
  
  /** Integration settings with external systems */
  integrationSettings: Record<string, any>;
  
  /** Last update date of the settings */
  updatedAt: string;
}