/**
 * Vehicle Interface Definitions
 * 
 * This file contains TypeScript interfaces and enums for vehicle entities
 * in the freight optimization platform. These types define the structure and 
 * properties of trucks and trailers used for transporting loads.
 */

/**
 * Enumeration of vehicle types for trucks and trailers
 */
export enum VehicleType {
  TRACTOR = 'TRACTOR',
  STRAIGHT_TRUCK = 'STRAIGHT_TRUCK',
  DRY_VAN_TRAILER = 'DRY_VAN_TRAILER',
  REFRIGERATED_TRAILER = 'REFRIGERATED_TRAILER',
  FLATBED_TRAILER = 'FLATBED_TRAILER',
  TANKER_TRAILER = 'TANKER_TRAILER',
  LOWBOY_TRAILER = 'LOWBOY_TRAILER',
  STEP_DECK_TRAILER = 'STEP_DECK_TRAILER',
  SPECIALIZED = 'SPECIALIZED'
}

/**
 * Enumeration of possible vehicle statuses
 */
export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

/**
 * Enumeration of fuel types for vehicles
 */
export enum FuelType {
  DIESEL = 'DIESEL',
  GASOLINE = 'GASOLINE',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  NATURAL_GAS = 'NATURAL_GAS',
  HYDROGEN = 'HYDROGEN'
}

/**
 * Enumeration of maintenance types for vehicles
 */
export enum MaintenanceType {
  SCHEDULED = 'SCHEDULED',
  UNSCHEDULED = 'UNSCHEDULED',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  RECALL = 'RECALL'
}

/**
 * Main interface for vehicle entities in the system
 */
export interface Vehicle {
  /**
   * Unique identifier for the vehicle
   */
  vehicle_id: string;
  
  /**
   * ID of the carrier that owns this vehicle
   */
  carrier_id: string;
  
  /**
   * Type of vehicle (tractor, trailer, etc.)
   */
  type: VehicleType;
  
  /**
   * Vehicle Identification Number
   */
  vin: string;
  
  /**
   * Vehicle manufacturer
   */
  make: string;
  
  /**
   * Vehicle model
   */
  model: string;
  
  /**
   * Model year of the vehicle
   */
  year: number;
  
  /**
   * License plate number
   */
  plate_number: string;
  
  /**
   * State where the vehicle is registered
   */
  plate_state: string;
  
  /**
   * Current operational status of the vehicle
   */
  status: VehicleStatus;
  
  /**
   * ID of the driver currently assigned to this vehicle (if any)
   */
  current_driver_id: string;
  
  /**
   * ID of the load currently assigned to this vehicle (if any)
   */
  current_load_id: string;
  
  /**
   * Current geographical location of the vehicle
   */
  current_location: {
    latitude: number;
    longitude: number;
  };
  
  /**
   * Maximum weight capacity in pounds
   */
  weight_capacity: number;
  
  /**
   * Maximum volume capacity in cubic feet
   */
  volume_capacity: number;
  
  /**
   * Physical dimensions of the vehicle
   */
  dimensions: {
    length: number; // in feet
    width: number;  // in feet
    height: number; // in feet
  };
  
  /**
   * Type of fuel the vehicle uses
   */
  fuel_type: FuelType;
  
  /**
   * Fuel tank capacity in gallons
   */
  fuel_capacity: number;
  
  /**
   * Average miles per gallon fuel efficiency
   */
  average_mpg: number;
  
  /**
   * Current odometer reading in miles
   */
  odometer: number;
  
  /**
   * ID of the ELD device installed in the vehicle (if any)
   */
  eld_device_id: string;
  
  /**
   * Date of the last maintenance performed
   */
  last_maintenance_date: Date;
  
  /**
   * Scheduled date for the next maintenance
   */
  next_maintenance_date: Date;
  
  /**
   * Date when the vehicle was created in the system
   */
  created_at: Date;
  
  /**
   * Date when the vehicle was last updated
   */
  updated_at: Date;
  
  /**
   * Whether the vehicle is active in the system
   */
  active: boolean;
}

/**
 * Parameters required for creating a new vehicle
 */
export interface VehicleCreationParams {
  /**
   * ID of the carrier that owns this vehicle
   */
  carrier_id: string;
  
  /**
   * Type of vehicle (tractor, trailer, etc.)
   */
  type: VehicleType;
  
  /**
   * Vehicle Identification Number
   */
  vin: string;
  
  /**
   * Vehicle manufacturer
   */
  make: string;
  
  /**
   * Vehicle model
   */
  model: string;
  
  /**
   * Model year of the vehicle
   */
  year: number;
  
  /**
   * License plate number
   */
  plate_number: string;
  
  /**
   * State where the vehicle is registered
   */
  plate_state: string;
  
  /**
   * Maximum weight capacity in pounds
   */
  weight_capacity: number;
  
  /**
   * Maximum volume capacity in cubic feet
   */
  volume_capacity: number;
  
  /**
   * Physical dimensions of the vehicle
   */
  dimensions: {
    length: number; // in feet
    width: number;  // in feet
    height: number; // in feet
  };
  
  /**
   * Type of fuel the vehicle uses
   */
  fuel_type: FuelType;
  
  /**
   * Fuel tank capacity in gallons
   */
  fuel_capacity: number;
  
  /**
   * Average miles per gallon fuel efficiency
   */
  average_mpg: number;
  
  /**
   * Current odometer reading in miles
   */
  odometer: number;
  
  /**
   * ID of the ELD device installed in the vehicle (if any)
   */
  eld_device_id: string;
}

/**
 * Parameters for updating an existing vehicle
 */
export interface VehicleUpdateParams {
  /**
   * Type of vehicle (tractor, trailer, etc.)
   */
  type?: VehicleType;
  
  /**
   * Vehicle manufacturer
   */
  make?: string;
  
  /**
   * Vehicle model
   */
  model?: string;
  
  /**
   * Model year of the vehicle
   */
  year?: number;
  
  /**
   * License plate number
   */
  plate_number?: string;
  
  /**
   * State where the vehicle is registered
   */
  plate_state?: string;
  
  /**
   * Current operational status of the vehicle
   */
  status?: VehicleStatus;
  
  /**
   * ID of the driver currently assigned to this vehicle
   */
  current_driver_id?: string;
  
  /**
   * Maximum weight capacity in pounds
   */
  weight_capacity?: number;
  
  /**
   * Maximum volume capacity in cubic feet
   */
  volume_capacity?: number;
  
  /**
   * Physical dimensions of the vehicle
   */
  dimensions?: {
    length: number; // in feet
    width: number;  // in feet
    height: number; // in feet
  };
  
  /**
   * Type of fuel the vehicle uses
   */
  fuel_type?: FuelType;
  
  /**
   * Fuel tank capacity in gallons
   */
  fuel_capacity?: number;
  
  /**
   * Average miles per gallon fuel efficiency
   */
  average_mpg?: number;
  
  /**
   * Current odometer reading in miles
   */
  odometer?: number;
  
  /**
   * ID of the ELD device installed in the vehicle
   */
  eld_device_id?: string;
  
  /**
   * Date of the last maintenance performed
   */
  last_maintenance_date?: Date;
  
  /**
   * Scheduled date for the next maintenance
   */
  next_maintenance_date?: Date;
  
  /**
   * Whether the vehicle is active in the system
   */
  active?: boolean;
}

/**
 * Simplified vehicle information for list views and summaries
 */
export interface VehicleSummary {
  /**
   * Unique identifier for the vehicle
   */
  vehicle_id: string;
  
  /**
   * ID of the carrier that owns this vehicle
   */
  carrier_id: string;
  
  /**
   * Type of vehicle (tractor, trailer, etc.)
   */
  type: VehicleType;
  
  /**
   * Vehicle manufacturer
   */
  make: string;
  
  /**
   * Vehicle model
   */
  model: string;
  
  /**
   * Model year of the vehicle
   */
  year: number;
  
  /**
   * Current operational status of the vehicle
   */
  status: VehicleStatus;
  
  /**
   * Name of the driver currently assigned to this vehicle
   */
  current_driver_name: string;
  
  /**
   * Current general location of the vehicle
   */
  current_location: {
    city: string;
    state: string;
  };
  
  /**
   * ID of the load currently assigned to this vehicle (if any)
   */
  current_load_id: string;
}

/**
 * Comprehensive vehicle interface with all related details for detailed views
 */
export interface VehicleWithDetails {
  /**
   * Unique identifier for the vehicle
   */
  vehicle_id: string;
  
  /**
   * ID of the carrier that owns this vehicle
   */
  carrier_id: string;
  
  /**
   * Type of vehicle (tractor, trailer, etc.)
   */
  type: VehicleType;
  
  /**
   * Vehicle Identification Number
   */
  vin: string;
  
  /**
   * Vehicle manufacturer
   */
  make: string;
  
  /**
   * Vehicle model
   */
  model: string;
  
  /**
   * Model year of the vehicle
   */
  year: number;
  
  /**
   * License plate number
   */
  plate_number: string;
  
  /**
   * State where the vehicle is registered
   */
  plate_state: string;
  
  /**
   * Current operational status of the vehicle
   */
  status: VehicleStatus;
  
  /**
   * ID of the driver currently assigned to this vehicle
   */
  current_driver_id: string;
  
  /**
   * ID of the load currently assigned to this vehicle
   */
  current_load_id: string;
  
  /**
   * Current geographical location of the vehicle
   */
  current_location: {
    latitude: number;
    longitude: number;
  };
  
  /**
   * Maximum weight capacity in pounds
   */
  weight_capacity: number;
  
  /**
   * Maximum volume capacity in cubic feet
   */
  volume_capacity: number;
  
  /**
   * Physical dimensions of the vehicle
   */
  dimensions: {
    length: number; // in feet
    width: number;  // in feet
    height: number; // in feet
  };
  
  /**
   * Type of fuel the vehicle uses
   */
  fuel_type: FuelType;
  
  /**
   * Fuel tank capacity in gallons
   */
  fuel_capacity: number;
  
  /**
   * Average miles per gallon fuel efficiency
   */
  average_mpg: number;
  
  /**
   * Current odometer reading in miles
   */
  odometer: number;
  
  /**
   * ID of the ELD device installed in the vehicle
   */
  eld_device_id: string;
  
  /**
   * Date of the last maintenance performed
   */
  last_maintenance_date: Date;
  
  /**
   * Scheduled date for the next maintenance
   */
  next_maintenance_date: Date;
  
  /**
   * Date when the vehicle was created in the system
   */
  created_at: Date;
  
  /**
   * Date when the vehicle was last updated
   */
  updated_at: Date;
  
  /**
   * Whether the vehicle is active in the system
   */
  active: boolean;
  
  /**
   * Basic information about the carrier that owns this vehicle
   */
  carrier: {
    carrier_id: string;
    name: string;
  };
  
  /**
   * Information about the driver currently assigned to this vehicle
   */
  current_driver: {
    driver_id: string;
    first_name: string;
    last_name: string;
  };
  
  /**
   * Information about the load currently assigned to this vehicle
   */
  current_load: {
    load_id: string;
    origin: string;
    destination: string;
    status: string;
  };
  
  /**
   * History of maintenance performed on this vehicle
   */
  maintenance_history: VehicleMaintenance[];
}

/**
 * Interface for tracking vehicle maintenance records
 */
export interface VehicleMaintenance {
  /**
   * Unique identifier for the maintenance record
   */
  maintenance_id: string;
  
  /**
   * ID of the vehicle this maintenance was performed on
   */
  vehicle_id: string;
  
  /**
   * Type of maintenance performed
   */
  maintenance_type: MaintenanceType;
  
  /**
   * Description of the maintenance performed
   */
  description: string;
  
  /**
   * Name of the service provider who performed the maintenance
   */
  service_provider: string;
  
  /**
   * Cost of the maintenance in dollars
   */
  cost: number;
  
  /**
   * Odometer reading at the time of maintenance
   */
  odometer_reading: number;
  
  /**
   * Date when the maintenance was scheduled
   */
  scheduled_date: Date;
  
  /**
   * Date when the maintenance was completed
   */
  completed_date: Date;
  
  /**
   * Additional notes about the maintenance
   */
  notes: string;
  
  /**
   * Date when the maintenance record was created
   */
  created_at: Date;
  
  /**
   * Date when the maintenance record was last updated
   */
  updated_at: Date;
}

/**
 * Performance metrics for vehicle evaluation and optimization
 */
export interface VehiclePerformanceMetrics {
  /**
   * ID of the vehicle these metrics are for
   */
  vehicle_id: string;
  
  /**
   * Total miles driven in the period
   */
  total_miles: number;
  
  /**
   * Miles driven with a load during the period
   */
  loaded_miles: number;
  
  /**
   * Miles driven empty (deadhead) during the period
   */
  empty_miles: number;
  
  /**
   * Percentage of total miles that were driven empty
   */
  empty_miles_percentage: number;
  
  /**
   * Total fuel consumption in gallons during the period
   */
  fuel_consumption: number;
  
  /**
   * Actual miles per gallon achieved during the period
   */
  actual_mpg: number;
  
  /**
   * Percentage of time the vehicle was utilized during the period
   */
  utilization_percentage: number;
  
  /**
   * Total maintenance cost during the period
   */
  maintenance_cost: number;
  
  /**
   * Total revenue generated by the vehicle during the period
   */
  revenue_generated: number;
  
  /**
   * Average revenue per mile during the period
   */
  revenue_per_mile: number;
  
  /**
   * Number of loads completed during the period
   */
  loads_completed: number;
  
  /**
   * Start date of the reporting period
   */
  period_start: Date;
  
  /**
   * End date of the reporting period
   */
  period_end: Date;
}

/**
 * Interface for tracking vehicle utilization metrics
 */
export interface VehicleUtilization {
  /**
   * ID of the vehicle these utilization metrics are for
   */
  vehicle_id: string;
  
  /**
   * Percentage of time the vehicle was utilized during the period
   */
  utilization_percentage: number;
  
  /**
   * Number of hours the vehicle was active during the period
   */
  active_hours: number;
  
  /**
   * Number of hours the vehicle was idle during the period
   */
  idle_hours: number;
  
  /**
   * Number of hours the vehicle was in maintenance during the period
   */
  maintenance_hours: number;
  
  /**
   * Start date of the reporting period
   */
  period_start: Date;
  
  /**
   * End date of the reporting period
   */
  period_end: Date;
}

/**
 * Parameters for searching and filtering vehicles
 */
export interface VehicleSearchParams {
  /**
   * Filter by carrier ID
   */
  carrier_id?: string;
  
  /**
   * Filter by vehicle types
   */
  type?: VehicleType[];
  
  /**
   * Filter by vehicle status
   */
  status?: VehicleStatus[];
  
  /**
   * Filter by location within a radius
   */
  location_radius?: {
    latitude: number;
    longitude: number;
    radius: number; // in miles
  };
  
  /**
   * Filter by minimum weight capacity
   */
  min_weight_capacity?: number;
  
  /**
   * Filter by minimum volume capacity
   */
  min_volume_capacity?: number;
  
  /**
   * Filter by assigned driver
   */
  driver_id?: string;
  
  /**
   * Filter to only show available vehicles
   */
  available_only?: boolean;
  
  /**
   * Filter to show vehicles due for maintenance
   */
  maintenance_due?: boolean;
  
  /**
   * Page number for pagination
   */
  page?: number;
  
  /**
   * Number of results per page
   */
  limit?: number;
  
  /**
   * Field to sort results by
   */
  sort_by?: string;
  
  /**
   * Sort direction (ascending or descending)
   */
  sort_direction?: 'asc' | 'desc';
}