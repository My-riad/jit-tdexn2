/**
 * Load Interface
 * Defines the core interfaces, types, and enums for load-related entities in the
 * AI-driven Freight Optimization Platform. This file contains the data structures
 * for loads, load locations, load status history, load documents, and related types
 * that are used throughout the platform for freight management and optimization.
 */

/**
 * Enumeration of all possible load statuses throughout the load lifecycle
 */
export enum LoadStatus {
  CREATED = 'CREATED',             // Initial creation
  PENDING = 'PENDING',             // Validation complete
  OPTIMIZING = 'OPTIMIZING',       // Being processed by optimization engine
  AVAILABLE = 'AVAILABLE',         // Ready for assignment
  RESERVED = 'RESERVED',           // Temporarily held for a driver
  ASSIGNED = 'ASSIGNED',           // Assigned to driver
  IN_TRANSIT = 'IN_TRANSIT',       // Driver en route
  AT_PICKUP = 'AT_PICKUP',         // Arrived at pickup location
  LOADED = 'LOADED',               // Load has been picked up
  AT_DROPOFF = 'AT_DROPOFF',       // Arrived at delivery location
  DELIVERED = 'DELIVERED',         // Load has been delivered
  COMPLETED = 'COMPLETED',         // All paperwork finalized
  CANCELLED = 'CANCELLED',         // Load was cancelled
  EXPIRED = 'EXPIRED',             // No assignment within timeframe
  DELAYED = 'DELAYED',             // Unexpected delay
  EXCEPTION = 'EXCEPTION',         // Issue with pickup or delivery
  RESOLVED = 'RESOLVED'            // Exception has been resolved
}

/**
 * Enumeration of supported equipment types for loads
 */
export enum EquipmentType {
  DRY_VAN = 'DRY_VAN',
  REFRIGERATED = 'REFRIGERATED',
  FLATBED = 'FLATBED'
}

/**
 * Enumeration of location types associated with loads
 */
export enum LoadLocationType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  STOP = 'STOP'    // For multi-stop loads
}

/**
 * Enumeration of document types that can be associated with loads
 */
export enum LoadDocumentType {
  BILL_OF_LADING = 'BILL_OF_LADING',
  PROOF_OF_DELIVERY = 'PROOF_OF_DELIVERY',
  RATE_CONFIRMATION = 'RATE_CONFIRMATION',
  INVOICE = 'INVOICE',
  CUSTOMS_DOCUMENT = 'CUSTOMS_DOCUMENT',
  HAZMAT_DOCUMENT = 'HAZMAT_DOCUMENT',
  INSPECTION_DOCUMENT = 'INSPECTION_DOCUMENT',
  OTHER = 'OTHER'
}

/**
 * Enumeration of assignment types for load-driver assignments
 */
export enum LoadAssignmentType {
  DIRECT = 'DIRECT',               // Single driver handles entire load
  RELAY = 'RELAY',                 // Multiple drivers handle segments
  SMART_HUB_EXCHANGE = 'SMART_HUB_EXCHANGE'  // Load exchange at a Smart Hub
}

/**
 * Interface defining the structure of a load entity
 */
export interface Load {
  load_id: string;
  shipper_id: string;
  reference_number: string;    // External reference (e.g., PO number)
  description: string;
  equipment_type: EquipmentType;
  weight: number;              // In pounds
  dimensions: {
    length: number;            // In feet
    width: number;             // In feet
    height: number;            // In feet
  };
  volume: number;              // In cubic feet
  pallets: number;             // Number of pallets
  commodity: string;
  status: LoadStatus;
  pickup_earliest: Date;
  pickup_latest: Date;
  delivery_earliest: Date;
  delivery_latest: Date;
  offered_rate: number;        // In USD
  special_instructions: string;
  is_hazardous: boolean;
  temperature_requirements?: {
    min_temp: number;          // In Fahrenheit
    max_temp: number;          // In Fahrenheit
  };
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface defining the structure of a load location entity
 */
export interface LoadLocation {
  location_id: string;
  load_id: string;
  location_type: LoadLocationType;
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  earliest_time: Date;
  latest_time: Date;
  contact_name: string;
  contact_phone: string;
  special_instructions: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface defining the structure of a load status history record
 */
export interface LoadStatusHistory {
  status_id: string;
  load_id: string;
  status: LoadStatus;
  status_details: Record<string, any>;  // Flexible structure for status-specific details
  latitude?: number;                    // Location where status was updated
  longitude?: number;                   // Location where status was updated
  updated_by: string;                   // User or system that updated the status
  updated_at: Date;
  created_at: Date;
}

/**
 * Interface defining the structure of a load document entity
 */
export interface LoadDocument {
  document_id: string;
  load_id: string;
  document_type: LoadDocumentType;
  filename: string;
  content_type: string;
  storage_url: string;
  uploaded_by: string;         // User who uploaded the document
  uploaded_at: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface defining the structure of a load assignment entity
 */
export interface LoadAssignment {
  assignment_id: string;
  load_id: string;
  driver_id: string;
  vehicle_id: string;
  assignment_type: LoadAssignmentType;
  status: LoadStatus;
  segment_start_location?: {   // For relay loads
    latitude: number;
    longitude: number;
    address?: string;
  };
  segment_end_location?: {     // For relay loads
    latitude: number;
    longitude: number;
    address?: string;
  };
  agreed_rate: number;         // In USD
  efficiency_score: number;    // Score for this assignment (0-100)
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface defining the parameters for creating a new load
 */
export interface LoadCreationParams {
  shipper_id: string;
  reference_number: string;
  description: string;
  equipment_type: EquipmentType;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  volume?: number;
  pallets?: number;
  commodity: string;
  pickup_earliest: Date;
  pickup_latest: Date;
  delivery_earliest: Date;
  delivery_latest: Date;
  offered_rate: number;
  special_instructions?: string;
  is_hazardous: boolean;
  temperature_requirements?: {
    min_temp: number;
    max_temp: number;
  };
  locations: Omit<LoadLocation, 'location_id' | 'load_id'>[];
}

/**
 * Interface defining the parameters for updating an existing load
 */
export interface LoadUpdateParams {
  reference_number?: string;
  description?: string;
  equipment_type?: EquipmentType;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  volume?: number;
  pallets?: number;
  commodity?: string;
  status?: LoadStatus;
  pickup_earliest?: Date;
  pickup_latest?: Date;
  delivery_earliest?: Date;
  delivery_latest?: Date;
  offered_rate?: number;
  special_instructions?: string;
  is_hazardous?: boolean;
  temperature_requirements?: {
    min_temp: number;
    max_temp: number;
  };
}

/**
 * Interface defining the parameters for updating a load's status
 */
export interface LoadStatusUpdateParams {
  status: LoadStatus;
  status_details?: Record<string, any>;
  latitude?: number;
  longitude?: number;
  updated_by: string;
}

/**
 * Interface defining the parameters for searching loads
 */
export interface LoadSearchParams {
  shipper_id?: string;
  status?: LoadStatus[];
  equipment_type?: EquipmentType[];
  weight_min?: number;
  weight_max?: number;
  pickup_date_start?: Date;
  pickup_date_end?: Date;
  delivery_date_start?: Date;
  delivery_date_end?: Date;
  origin_latitude?: number;
  origin_longitude?: number;
  origin_radius?: number;      // In miles
  destination_latitude?: number;
  destination_longitude?: number;
  destination_radius?: number; // In miles
  reference_number?: string;
  is_hazardous?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_direction?: string;
}

/**
 * Interface defining a load with all its related details for comprehensive views
 */
export interface LoadWithDetails extends Load {
  locations: LoadLocation[];
  status_history: LoadStatusHistory[];
  documents: LoadDocument[];
  assignments: LoadAssignment[];
  shipper: object;  // Shipper details
}