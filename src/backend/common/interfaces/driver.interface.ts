import { Carrier } from '../interfaces/carrier.interface';
import { User } from '../interfaces/user.interface';
import { Position } from '../interfaces/position.interface';

// @types/common v1.0.0
import { Address } from '@types/common';

/**
 * Enumeration of possible driver statuses
 */
export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  AVAILABLE = 'AVAILABLE',
  ON_DUTY = 'ON_DUTY',
  DRIVING = 'DRIVING',
  OFF_DUTY = 'OFF_DUTY',
  SLEEPER_BERTH = 'SLEEPER_BERTH',
  SUSPENDED = 'SUSPENDED'
}

/**
 * Enumeration of CDL license classes
 */
export enum LicenseClass {
  CLASS_A = 'CLASS_A',
  CLASS_B = 'CLASS_B',
  CLASS_C = 'CLASS_C'
}

/**
 * Enumeration of CDL license endorsements
 */
export enum LicenseEndorsement {
  HAZMAT = 'HAZMAT',
  TANKER = 'TANKER',
  PASSENGER = 'PASSENGER',
  SCHOOL_BUS = 'SCHOOL_BUS',
  DOUBLE_TRIPLE = 'DOUBLE_TRIPLE',
  COMBINATION = 'COMBINATION'
}

/**
 * Enumeration of Hours of Service duty statuses
 */
export enum HOSStatus {
  DRIVING = 'DRIVING',
  ON_DUTY = 'ON_DUTY',
  OFF_DUTY = 'OFF_DUTY',
  SLEEPER_BERTH = 'SLEEPER_BERTH'
}

/**
 * Enumeration of driver preference types
 */
export enum PreferenceType {
  LOAD_TYPE = 'LOAD_TYPE',
  REGION = 'REGION',
  MAX_DISTANCE = 'MAX_DISTANCE',
  HOME_TIME = 'HOME_TIME',
  AVOID_LOCATION = 'AVOID_LOCATION',
  PREFERRED_SHIPPER = 'PREFERRED_SHIPPER',
  PREFERRED_LANE = 'PREFERRED_LANE'
}

/**
 * Main interface for driver entities in the system
 */
export interface Driver {
  driver_id: string;
  user_id: string;
  carrier_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_state: string;
  license_class: LicenseClass;
  license_endorsements: LicenseEndorsement[];
  license_expiration: Date;
  home_address: Address;
  current_location: { latitude: number; longitude: number };
  current_vehicle_id: string;
  current_load_id: string;
  status: DriverStatus;
  hos_status: HOSStatus;
  hos_status_since: Date;
  driving_minutes_remaining: number;
  duty_minutes_remaining: number;
  cycle_minutes_remaining: number;
  efficiency_score: number;
  eld_device_id: string;
  eld_provider: string;
  created_at: Date;
  updated_at: Date;
  active: boolean;
}

/**
 * Parameters required for creating a new driver
 */
export interface DriverCreationParams {
  user_id: string;
  carrier_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_state: string;
  license_class: LicenseClass;
  license_endorsements: LicenseEndorsement[];
  license_expiration: Date;
  home_address: Address;
  eld_device_id: string;
  eld_provider: string;
}

/**
 * Parameters for updating an existing driver
 */
export interface DriverUpdateParams {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_state: string;
  license_class: LicenseClass;
  license_endorsements: LicenseEndorsement[];
  license_expiration: Date;
  home_address: Address;
  current_vehicle_id: string;
  status: DriverStatus;
  eld_device_id: string;
  eld_provider: string;
  active: boolean;
}

/**
 * Interface for tracking driver availability for load assignments
 */
export interface DriverAvailability {
  driver_id: string;
  status: DriverStatus;
  current_location: { latitude: number; longitude: number };
  available_from: Date;
  available_until: Date;
  driving_minutes_remaining: number;
  duty_minutes_remaining: number;
  cycle_minutes_remaining: number;
  updated_at: Date;
}

/**
 * Interface for tracking driver Hours of Service records
 */
export interface DriverHOS {
  hos_id: string;
  driver_id: string;
  status: HOSStatus;
  status_since: Date;
  driving_minutes_remaining: number;
  duty_minutes_remaining: number;
  cycle_minutes_remaining: number;
  location: { latitude: number; longitude: number };
  vehicle_id: string;
  eld_log_id: string;
  recorded_at: Date;
}

/**
 * Interface for driver preferences used in load matching
 */
export interface DriverPreference {
  preference_id: string;
  driver_id: string;
  preference_type: PreferenceType;
  preference_value: string;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface for driver efficiency scores used in gamification
 */
export interface DriverScore {
  score_id: string;
  driver_id: string;
  total_score: number;
  empty_miles_score: number;
  network_contribution_score: number;
  on_time_score: number;
  hub_utilization_score: number;
  fuel_efficiency_score: number;
  score_factors: Record<string, number>;
  calculated_at: Date;
}

/**
 * Interface for tracking driver location history
 */
export interface DriverLocation {
  location_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  recorded_at: Date;
  source: string;
}

/**
 * Simplified driver information for list views and summaries
 */
export interface DriverSummary {
  driver_id: string;
  name: string;
  carrier_name: string;
  status: DriverStatus;
  current_location: { city: string; state: string };
  current_load_id: string;
  current_vehicle_id: string;
  hos_remaining: { driving: number; duty: number };
  efficiency_score: number;
}

/**
 * Comprehensive driver interface with all related details for detailed views
 */
export interface DriverWithDetails {
  driver_id: string;
  user_id: string;
  carrier_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_state: string;
  license_class: LicenseClass;
  license_endorsements: LicenseEndorsement[];
  license_expiration: Date;
  home_address: Address;
  current_location: { latitude: number; longitude: number };
  current_vehicle_id: string;
  current_load_id: string;
  status: DriverStatus;
  hos_status: HOSStatus;
  hos_status_since: Date;
  driving_minutes_remaining: number;
  duty_minutes_remaining: number;
  cycle_minutes_remaining: number;
  efficiency_score: number;
  eld_device_id: string;
  eld_provider: string;
  created_at: Date;
  updated_at: Date;
  active: boolean;
  carrier: { carrier_id: string; name: string };
  vehicle: { vehicle_id: string; type: string; make: string; model: string };
  current_load: { load_id: string; origin: string; destination: string; status: string };
  preferences: DriverPreference[];
}

/**
 * Performance metrics for driver evaluation and optimization
 */
export interface DriverPerformanceMetrics {
  driver_id: string;
  loads_completed: number;
  on_time_percentage: number;
  total_miles: number;
  loaded_miles: number;
  empty_miles: number;
  empty_miles_percentage: number;
  fuel_efficiency: number;
  revenue_generated: number;
  revenue_per_mile: number;
  smart_hub_visits: number;
  relay_participations: number;
  efficiency_score: number;
  period_start: Date;
  period_end: Date;
}

/**
 * Parameters for searching and filtering drivers
 */
export interface DriverSearchParams {
  carrier_id: string;
  status: DriverStatus[];
  location_radius: { latitude: number; longitude: number; radius: number };
  min_hours_available: number;
  license_endorsements: LicenseEndorsement[];
  min_efficiency_score: number;
  available_after: Date;
  available_before: Date;
  page: number;
  limit: number;
  sort_by: string;
  sort_direction: 'asc' | 'desc';
}