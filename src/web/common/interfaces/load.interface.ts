/**
 * Load interfaces for the AI-driven Freight Optimization Platform
 * 
 * This file contains interface definitions for load entities used throughout the web
 * applications. It defines the structure and properties of freight loads including their
 * status, locations, dimensions, and assignment details.
 */

import { Address, GeoCoordinates } from '../types/global';

/**
 * Enumeration of all possible load statuses throughout the load lifecycle
 */
export enum LoadStatus {
  CREATED = 'created',
  PENDING = 'pending',
  OPTIMIZING = 'optimizing',
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  AT_PICKUP = 'at_pickup',
  LOADED = 'loaded',
  AT_DROPOFF = 'at_dropoff',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  DELAYED = 'delayed',
  EXCEPTION = 'exception'
}

/**
 * Enumeration of supported equipment types for loads
 */
export enum EquipmentType {
  DRY_VAN = 'dry_van',
  REFRIGERATED = 'refrigerated',
  FLATBED = 'flatbed'
}

/**
 * Enumeration of location types associated with loads
 */
export enum LoadLocationType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  STOP = 'stop'
}

/**
 * Enumeration of document types that can be associated with loads
 */
export enum LoadDocumentType {
  BILL_OF_LADING = 'bill_of_lading',
  PROOF_OF_DELIVERY = 'proof_of_delivery',
  RATE_CONFIRMATION = 'rate_confirmation',
  INVOICE = 'invoice',
  CUSTOMS_DOCUMENT = 'customs_document',
  HAZMAT_DOCUMENT = 'hazmat_document',
  INSPECTION_DOCUMENT = 'inspection_document',
  OTHER = 'other'
}

/**
 * Enumeration of assignment types for load-driver assignments
 */
export enum LoadAssignmentType {
  DIRECT = 'direct',
  RELAY = 'relay',
  SMART_HUB_EXCHANGE = 'smart_hub_exchange'
}

/**
 * Main interface for load entities in the system
 */
export interface Load {
  id: string;
  shipperId: string;
  referenceNumber: string;
  description: string;
  equipmentType: EquipmentType;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  volume: number;
  pallets: number;
  commodity: string;
  status: LoadStatus;
  pickupEarliest: string; // ISO 8601 date string
  pickupLatest: string; // ISO 8601 date string
  deliveryEarliest: string; // ISO 8601 date string
  deliveryLatest: string; // ISO 8601 date string
  offeredRate: number;
  specialInstructions: string;
  isHazardous: boolean;
  temperatureRequirements: {
    min: number;
    max: number;
    unit: string;
  } | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * Interface defining the structure of a load location entity
 */
export interface LoadLocation {
  id: string;
  loadId: string;
  locationType: LoadLocationType;
  facilityName: string;
  address: Address;
  coordinates: GeoCoordinates;
  earliestTime: string; // ISO 8601 date string
  latestTime: string; // ISO 8601 date string
  contactName: string;
  contactPhone: string;
  specialInstructions: string;
}

/**
 * Interface defining the structure of a load status history record
 */
export interface LoadStatusHistory {
  id: string;
  loadId: string;
  status: LoadStatus;
  statusDetails: Record<string, any>;
  coordinates: GeoCoordinates;
  updatedBy: string;
  timestamp: string; // ISO 8601 date string
}

/**
 * Interface defining the structure of a load document entity
 */
export interface LoadDocument {
  id: string;
  loadId: string;
  documentType: LoadDocumentType;
  filename: string;
  contentType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string; // ISO 8601 date string
}

/**
 * Interface defining the structure of a load assignment entity
 */
export interface LoadAssignment {
  id: string;
  loadId: string;
  driverId: string;
  vehicleId: string;
  assignmentType: LoadAssignmentType;
  status: LoadStatus;
  segmentStartLocation: GeoCoordinates;
  segmentEndLocation: GeoCoordinates;
  agreedRate: number;
  efficiencyScore: number;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * Interface defining the parameters for creating a new load
 */
export interface LoadCreationParams {
  shipperId: string;
  referenceNumber: string;
  description: string;
  equipmentType: EquipmentType;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  volume: number;
  pallets: number;
  commodity: string;
  pickupEarliest: string; // ISO 8601 date string
  pickupLatest: string; // ISO 8601 date string
  deliveryEarliest: string; // ISO 8601 date string
  deliveryLatest: string; // ISO 8601 date string
  offeredRate: number;
  specialInstructions: string;
  isHazardous: boolean;
  temperatureRequirements: {
    min: number;
    max: number;
    unit: string;
  } | null;
  locations: Omit<LoadLocation, 'id' | 'loadId'>[];
}

/**
 * Interface defining the parameters for updating an existing load
 */
export interface LoadUpdateParams {
  referenceNumber?: string;
  description?: string;
  equipmentType?: EquipmentType;
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
  pickupEarliest?: string;
  pickupLatest?: string;
  deliveryEarliest?: string;
  deliveryLatest?: string;
  offeredRate?: number;
  specialInstructions?: string;
  isHazardous?: boolean;
  temperatureRequirements?: {
    min: number;
    max: number;
    unit: string;
  } | null;
}

/**
 * Interface defining the parameters for updating a load's status
 */
export interface LoadStatusUpdateParams {
  status: LoadStatus;
  statusDetails?: Record<string, any>;
  coordinates?: GeoCoordinates;
  updatedBy: string;
}

/**
 * Interface defining the parameters for searching loads
 */
export interface LoadSearchParams {
  shipperId?: string;
  status?: LoadStatus[];
  equipmentType?: EquipmentType[];
  weightMin?: number;
  weightMax?: number;
  pickupDateStart?: string;
  pickupDateEnd?: string;
  deliveryDateStart?: string;
  deliveryDateEnd?: string;
  originCoordinates?: GeoCoordinates;
  originRadius?: number;
  destinationCoordinates?: GeoCoordinates;
  destinationRadius?: number;
  referenceNumber?: string;
  isHazardous?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Comprehensive load interface with all related details for detailed views
 */
export interface LoadWithDetails extends Load {
  locations: LoadLocation[];
  statusHistory: LoadStatusHistory[];
  documents: LoadDocument[];
  assignments: LoadAssignment[];
  shipper: {
    id: string;
    name: string;
    contactInfo: {
      phone: string;
      email: string;
    };
  };
  efficiencyScore: number;
}

/**
 * Simplified load information for list views and summaries
 */
export interface LoadSummary {
  id: string;
  referenceNumber: string;
  origin: string; // City, State format
  destination: string; // City, State format
  equipmentType: EquipmentType;
  weight: number;
  status: LoadStatus;
  pickupDate: string; // ISO 8601 date string
  deliveryDate: string; // ISO 8601 date string
  rate: number;
  distance: number; // miles
  efficiencyScore: number;
  isHazardous: boolean;
  assignedDriver: {
    id: string;
    name: string;
  } | null;
}

/**
 * Interface for load recommendations provided to drivers
 */
export interface LoadRecommendation {
  loadId: string;
  driverId: string;
  origin: string; // City, State format
  destination: string; // City, State format
  equipmentType: EquipmentType;
  weight: number;
  pickupDate: string; // ISO 8601 date string
  deliveryDate: string; // ISO 8601 date string
  distance: number; // miles
  rate: number;
  ratePerMile: number;
  efficiencyScore: number;
  scoringFactors: Array<{
    factor: string;
    description: string;
    impact: number;
  }>;
  expiresAt: string; // ISO 8601 date string
}