import { Address, ContactInfo } from '@types/common'; // @types/common ^1.0.0

/**
 * Enumeration of shipper types based on business model
 */
export enum ShipperType {
  MANUFACTURER = 'MANUFACTURER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  RETAILER = 'RETAILER',
  BROKER = 'BROKER',
  '3PL' = '3PL'
}

/**
 * Main interface for shipper entities in the system
 */
export interface Shipper {
  shipper_id: string;
  name: string;
  tax_id: string;
  shipper_type: ShipperType;
  address: Address;
  contact_info: ContactInfo;
  credit_rating: number;
  payment_terms: string;
  preferred_carriers: string[];
  created_at: Date;
  updated_at: Date;
  active: boolean;
}

/**
 * Parameters required for creating a new shipper
 */
export interface ShipperCreationParams {
  name: string;
  tax_id: string;
  shipper_type: ShipperType;
  address: Address;
  contact_info: ContactInfo;
  credit_rating: number;
  payment_terms: string;
  preferred_carriers: string[];
}

/**
 * Parameters for updating an existing shipper
 */
export interface ShipperUpdateParams {
  name: string;
  tax_id: string;
  shipper_type: ShipperType;
  address: Address;
  contact_info: ContactInfo;
  credit_rating: number;
  payment_terms: string;
  preferred_carriers: string[];
  active: boolean;
}

/**
 * Simplified shipper information for list views and summaries
 */
export interface ShipperSummary {
  shipper_id: string;
  name: string;
  shipper_type: ShipperType;
  active_loads: number;
  completed_loads: number;
  credit_rating: number;
}

/**
 * Performance metrics for shipper evaluation and optimization
 */
export interface ShipperPerformanceMetrics {
  shipper_id: string;
  total_loads: number;
  on_time_pickup_percentage: number;
  on_time_delivery_percentage: number;
  average_load_weight: number;
  average_load_distance: number;
  optimization_savings: number;
  carbon_emissions_saved: number;
  period_start: Date;
  period_end: Date;
}

/**
 * Tracks shipper preferences for specific carriers
 */
export interface ShipperCarrierPreference {
  preference_id: string;
  shipper_id: string;
  carrier_id: string;
  preference_level: number;
  contract_number: string;
  contract_start_date: Date;
  contract_end_date: Date;
  negotiated_rates: object;
  created_at: Date;
  updated_at: Date;
}

/**
 * Represents a physical facility location for a shipper
 */
export interface ShipperFacility {
  facility_id: string;
  shipper_id: string;
  name: string;
  facility_type: string;
  address: Address;
  contact_info: ContactInfo;
  operating_hours: object;
  dock_count: number;
  special_instructions: string;
  created_at: Date;
  updated_at: Date;
  active: boolean;
}

/**
 * Parameters for searching shippers
 */
export interface ShipperSearchParams {
  name: string;
  tax_id: string;
  shipper_type: ShipperType[];
  active: boolean;
  credit_rating_min: number;
  credit_rating_max: number;
  page: number;
  limit: number;
  sort_by: string;
  sort_direction: string;
}