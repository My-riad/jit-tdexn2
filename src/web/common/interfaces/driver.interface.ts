import { Address, GeoCoordinates } from '../types/global';

/**
 * Enumeration of possible driver statuses in the system
 */
export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  AVAILABLE = 'available',
  ON_DUTY = 'on_duty',
  DRIVING = 'driving',
  OFF_DUTY = 'off_duty',
  SLEEPER_BERTH = 'sleeper_berth',
  SUSPENDED = 'suspended'
}

/**
 * Enumeration of CDL license classes
 */
export enum LicenseClass {
  CLASS_A = 'class_a',
  CLASS_B = 'class_b',
  CLASS_C = 'class_c'
}

/**
 * Enumeration of CDL license endorsements
 */
export enum LicenseEndorsement {
  HAZMAT = 'hazmat',
  TANKER = 'tanker',
  PASSENGER = 'passenger',
  SCHOOL_BUS = 'school_bus',
  DOUBLE_TRIPLE = 'double_triple',
  COMBINATION = 'combination'
}

/**
 * Enumeration of Hours of Service duty statuses
 */
export enum HOSStatus {
  DRIVING = 'driving',
  ON_DUTY = 'on_duty',
  OFF_DUTY = 'off_duty',
  SLEEPER_BERTH = 'sleeper_berth'
}

/**
 * Enumeration of driver preference types
 */
export enum PreferenceType {
  LOAD_TYPE = 'load_type',
  REGION = 'region',
  MAX_DISTANCE = 'max_distance',
  HOME_TIME = 'home_time',
  AVOID_LOCATION = 'avoid_location',
  PREFERRED_SHIPPER = 'preferred_shipper',
  PREFERRED_LANE = 'preferred_lane'
}

/**
 * Main interface for driver entities in the system
 */
export interface Driver {
  id: string;
  userId: string;
  carrierId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseClass: LicenseClass;
  licenseEndorsements: LicenseEndorsement[];
  licenseExpiration: string; // ISO 8601 date string
  homeAddress: Address;
  currentLocation: GeoCoordinates;
  currentVehicleId: string;
  currentLoadId: string;
  status: DriverStatus;
  hosStatus: HOSStatus;
  hosStatusSince: string; // ISO 8601 date-time string
  drivingMinutesRemaining: number;
  dutyMinutesRemaining: number;
  cycleMinutesRemaining: number;
  efficiencyScore: number;
  eldDeviceId: string;
  eldProvider: string;
  createdAt: string; // ISO 8601 date-time string
  updatedAt: string; // ISO 8601 date-time string
  active: boolean;
}

/**
 * Parameters required for creating a new driver
 */
export interface DriverCreationParams {
  userId: string;
  carrierId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseClass: LicenseClass;
  licenseEndorsements: LicenseEndorsement[];
  licenseExpiration: string; // ISO 8601 date string
  homeAddress: Address;
  eldDeviceId: string;
  eldProvider: string;
}

/**
 * Parameters for updating an existing driver
 */
export interface DriverUpdateParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseClass?: LicenseClass;
  licenseEndorsements?: LicenseEndorsement[];
  licenseExpiration?: string; // ISO 8601 date string
  homeAddress?: Address;
  currentVehicleId?: string;
  status?: DriverStatus;
  eldDeviceId?: string;
  eldProvider?: string;
  active?: boolean;
}

/**
 * Interface for tracking driver availability for load assignments
 */
export interface DriverAvailability {
  driverId: string;
  status: DriverStatus;
  currentLocation: GeoCoordinates;
  availableFrom: string; // ISO 8601 date-time string
  availableUntil: string; // ISO 8601 date-time string
  drivingMinutesRemaining: number;
  dutyMinutesRemaining: number;
  cycleMinutesRemaining: number;
  updatedAt: string; // ISO 8601 date-time string
}

/**
 * Interface for tracking driver Hours of Service records
 */
export interface DriverHOS {
  id: string;
  driverId: string;
  status: HOSStatus;
  statusSince: string; // ISO 8601 date-time string
  drivingMinutesRemaining: number;
  dutyMinutesRemaining: number;
  cycleMinutesRemaining: number;
  location: GeoCoordinates;
  vehicleId: string;
  eldLogId: string;
  recordedAt: string; // ISO 8601 date-time string
}

/**
 * Interface for driver preferences used in load matching
 */
export interface DriverPreference {
  id: string;
  driverId: string;
  preferenceType: PreferenceType;
  preferenceValue: string;
  priority: number; // Higher number = higher priority
  createdAt: string; // ISO 8601 date-time string
  updatedAt: string; // ISO 8601 date-time string
}

/**
 * Interface for driver efficiency scores used in gamification
 */
export interface DriverScore {
  id: string;
  driverId: string;
  totalScore: number; // 0-100 normalized score
  emptyMilesScore: number; // Component score for empty miles reduction
  networkContributionScore: number; // Component score for network contribution
  onTimeScore: number; // Component score for on-time performance
  hubUtilizationScore: number; // Component score for Smart Hub utilization
  fuelEfficiencyScore: number; // Component score for fuel efficiency
  scoreFactors: Record<string, number>; // Additional scoring factors
  calculatedAt: string; // ISO 8601 date-time string
}

/**
 * Interface for tracking driver location history
 */
export interface DriverLocation {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading: number; // Degrees (0-359)
  speed: number; // MPH
  accuracy: number; // Meters
  recordedAt: string; // ISO 8601 date-time string
  source: string; // 'mobile_app', 'eld', etc.
}

/**
 * Simplified driver information for list views and summaries
 */
export interface DriverSummary {
  id: string;
  name: string; // Concatenated first and last name
  carrierName: string;
  status: DriverStatus;
  currentLocation: { city: string; state: string };
  currentLoadId: string;
  currentVehicleId: string;
  hosRemaining: { driving: number; duty: number }; // Minutes remaining
  efficiencyScore: number;
}

/**
 * Comprehensive driver interface with all related details for detailed views
 */
export interface DriverWithDetails extends Driver {
  carrier: { id: string; name: string };
  vehicle: { id: string; type: string; make: string; model: string };
  currentLoad: { id: string; origin: string; destination: string; status: string };
  preferences: DriverPreference[];
}

/**
 * Performance metrics for driver evaluation and optimization
 */
export interface DriverPerformanceMetrics {
  driverId: string;
  loadsCompleted: number;
  onTimePercentage: number;
  totalMiles: number;
  loadedMiles: number;
  emptyMiles: number;
  emptyMilesPercentage: number;
  fuelEfficiency: number; // MPG
  revenueGenerated: number;
  revenuePerMile: number;
  smartHubVisits: number;
  relayParticipations: number;
  efficiencyScore: number;
  periodStart: string; // ISO 8601 date-time string
  periodEnd: string; // ISO 8601 date-time string
}

/**
 * Parameters for searching and filtering drivers
 */
export interface DriverSearchParams {
  carrierId?: string;
  status?: DriverStatus[];
  locationRadius?: { latitude: number; longitude: number; radius: number }; // radius in miles
  minHoursAvailable?: number;
  licenseEndorsements?: LicenseEndorsement[];
  minEfficiencyScore?: number;
  availableAfter?: string; // ISO 8601 date-time string
  availableBefore?: string; // ISO 8601 date-time string
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}