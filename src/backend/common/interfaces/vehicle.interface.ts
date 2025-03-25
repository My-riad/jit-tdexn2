import { Address } from '@types/common'; // v1.0.0

/**
 * Enumeration of vehicle types for trucks and trailers in the system
 */
export enum VehicleType {
    TRACTOR = 'TRACTOR',
    STRAIGHT_TRUCK = 'STRAIGHT_TRUCK',
    DRY_VAN_TRAILER = 'DRY_VAN_TRAILER',
    REFRIGERATED_TRAILER = 'REFRIGERATED_TRAILER',
    FLATBED_TRAILER = 'FLATBED_TRAILER',
    TANKER_TRAILER = 'TANKER_TRAILER',
    LOWBOY_TRAILER = 'LOWBOY_TRAILER'
}

/**
 * Enumeration of possible vehicle status values
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
    vehicle_id: string;
    carrier_id: string;
    type: VehicleType;
    vin: string;
    make: string;
    model: string;
    year: number;
    plate_number: string;
    plate_state: string;
    status: VehicleStatus;
    current_driver_id: string;
    current_load_id: string;
    current_location: { latitude: number; longitude: number };
    weight_capacity: number;
    volume_capacity: number;
    dimensions: { length: number; width: number; height: number };
    fuel_type: FuelType;
    fuel_capacity: number;
    average_mpg: number;
    odometer: number;
    eld_device_id: string;
    last_maintenance_date: Date;
    next_maintenance_date: Date;
    created_at: Date;
    updated_at: Date;
    active: boolean;
}

/**
 * Parameters required for creating a new vehicle
 */
export interface VehicleCreationParams {
    carrier_id: string;
    type: VehicleType;
    vin: string;
    make: string;
    model: string;
    year: number;
    plate_number: string;
    plate_state: string;
    weight_capacity: number;
    volume_capacity: number;
    dimensions: { length: number; width: number; height: number };
    fuel_type: FuelType;
    fuel_capacity: number;
    average_mpg: number;
    odometer: number;
    eld_device_id: string;
}

/**
 * Parameters for updating an existing vehicle
 * All fields are optional since only the fields being updated need to be provided
 */
export interface VehicleUpdateParams {
    type?: VehicleType;
    make?: string;
    model?: string;
    year?: number;
    plate_number?: string;
    plate_state?: string;
    status?: VehicleStatus;
    current_driver_id?: string;
    weight_capacity?: number;
    volume_capacity?: number;
    dimensions?: { length: number; width: number; height: number };
    fuel_type?: FuelType;
    fuel_capacity?: number;
    average_mpg?: number;
    odometer?: number;
    eld_device_id?: string;
    last_maintenance_date?: Date;
    next_maintenance_date?: Date;
    active?: boolean;
}

/**
 * Simplified vehicle information for list views and summaries
 */
export interface VehicleSummary {
    vehicle_id: string;
    carrier_id: string;
    type: VehicleType;
    make: string;
    model: string;
    year: number;
    status: VehicleStatus;
    current_driver_name: string;
    current_location: { city: string; state: string };
    current_load_id: string;
}

/**
 * Comprehensive vehicle interface with all related details for detailed views
 */
export interface VehicleWithDetails {
    vehicle_id: string;
    carrier_id: string;
    type: VehicleType;
    vin: string;
    make: string;
    model: string;
    year: number;
    plate_number: string;
    plate_state: string;
    status: VehicleStatus;
    current_driver_id: string;
    current_load_id: string;
    current_location: { latitude: number; longitude: number };
    weight_capacity: number;
    volume_capacity: number;
    dimensions: { length: number; width: number; height: number };
    fuel_type: FuelType;
    fuel_capacity: number;
    average_mpg: number;
    odometer: number;
    eld_device_id: string;
    last_maintenance_date: Date;
    next_maintenance_date: Date;
    created_at: Date;
    updated_at: Date;
    active: boolean;
    carrier: { carrier_id: string; name: string };
    current_driver: { driver_id: string; first_name: string; last_name: string };
    current_load: { load_id: string; origin: string; destination: string; status: string };
    maintenance_history: VehicleMaintenance[];
}

/**
 * Interface for tracking vehicle maintenance records
 */
export interface VehicleMaintenance {
    maintenance_id: string;
    vehicle_id: string;
    maintenance_type: MaintenanceType;
    description: string;
    service_provider: string;
    cost: number;
    odometer_reading: number;
    scheduled_date: Date;
    completed_date: Date;
    notes: string;
    created_at: Date;
    updated_at: Date;
}

/**
 * Performance metrics for vehicle evaluation and optimization
 */
export interface VehiclePerformanceMetrics {
    vehicle_id: string;
    total_miles: number;
    loaded_miles: number;
    empty_miles: number;
    empty_miles_percentage: number;
    fuel_consumption: number;
    actual_mpg: number;
    utilization_percentage: number;
    maintenance_cost: number;
    revenue_generated: number;
    revenue_per_mile: number;
    loads_completed: number;
    period_start: Date;
    period_end: Date;
}

/**
 * Parameters for searching and filtering vehicles
 */
export interface VehicleSearchParams {
    carrier_id?: string;
    type?: VehicleType[];
    status?: VehicleStatus[];
    location_radius?: { latitude: number; longitude: number; radius: number };
    min_weight_capacity?: number;
    min_volume_capacity?: number;
    driver_id?: string;
    available_only?: boolean;
    maintenance_due?: boolean;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
}