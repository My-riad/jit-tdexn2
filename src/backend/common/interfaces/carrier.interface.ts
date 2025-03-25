// @types/common v1.0.0 - Common address structure for carrier locations
// @types/common v1.0.0 - Common contact information structure for carrier contacts
import { Address, ContactInfo } from '@types/common';

/**
 * Enum representing different types of carriers based on fleet size
 */
export enum CarrierType {
  OWNER_OPERATOR = 'OWNER_OPERATOR',
  SMALL_FLEET = 'SMALL_FLEET',
  MID_SIZE_FLEET = 'MID_SIZE_FLEET',
  LARGE_FLEET = 'LARGE_FLEET',
  ENTERPRISE = 'ENTERPRISE'
}

/**
 * Interface representing a carrier/fleet operator in the system
 * Carriers employ drivers, own vehicles, and transport loads for shippers
 */
export interface Carrier {
  carrier_id: string;
  name: string;
  dot_number: string;
  mc_number: string;
  tax_id: string;
  carrier_type: CarrierType;
  address: Address;
  contact_info: ContactInfo;
  fleet_size: number;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_coverage_amount: number;
  insurance_expiration_date: Date;
  safety_rating: string;
  created_at: Date;
  updated_at: Date;
  active: boolean;
}

/**
 * Parameters required for creating a new carrier
 */
export interface CarrierCreationParams {
  name: string;
  dot_number: string;
  mc_number: string;
  tax_id: string;
  carrier_type: CarrierType;
  address: Address;
  contact_info: ContactInfo;
  fleet_size: number;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_coverage_amount: number;
  insurance_expiration_date: Date;
  safety_rating: string;
}

/**
 * Parameters for updating an existing carrier
 */
export interface CarrierUpdateParams {
  name: string;
  dot_number: string;
  mc_number: string;
  tax_id: string;
  carrier_type: CarrierType;
  address: Address;
  contact_info: ContactInfo;
  fleet_size: number;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_coverage_amount: number;
  insurance_expiration_date: Date;
  safety_rating: string;
  active: boolean;
}

/**
 * Simplified carrier information for list views and summaries
 */
export interface CarrierSummary {
  carrier_id: string;
  name: string;
  dot_number: string;
  fleet_size: number;
  active_drivers: number;
  active_vehicles: number;
  active_loads: number;
  safety_rating: string;
  average_efficiency_score: number;
}

/**
 * Performance metrics for carrier evaluation and optimization
 */
export interface CarrierPerformanceMetrics {
  carrier_id: string;
  fleet_efficiency_score: number;
  empty_miles_percentage: number;
  on_time_delivery_percentage: number;
  on_time_pickup_percentage: number;
  average_driver_score: number;
  vehicle_utilization_percentage: number;
  smart_hub_utilization_percentage: number;
  total_loads_completed: number;
  total_miles: number;
  loaded_miles: number;
  empty_miles: number;
  total_revenue: number;
  revenue_per_mile: number;
  period_start: Date;
  period_end: Date;
}

/**
 * Tracks relationships between carriers and shippers for load matching
 */
export interface CarrierShipperRelationship {
  relationship_id: string;
  carrier_id: string;
  shipper_id: string;
  status: string;
  preferred: boolean;
  contract_number: string;
  contract_start_date: Date;
  contract_end_date: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Statistics about carrier's contribution to the optimization network
 */
export interface CarrierNetworkStatistics {
  carrier_id: string;
  network_contribution_score: number;
  optimization_savings: number;
  relay_participation_count: number;
  smart_hub_visits: number;
  carbon_emissions_saved: number;
  fuel_gallons_saved: number;
  period_start: Date;
  period_end: Date;
}