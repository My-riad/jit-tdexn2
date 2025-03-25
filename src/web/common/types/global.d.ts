/**
 * Global type definitions for the AI-driven Freight Optimization Platform
 * 
 * This file contains global type declarations, interfaces, and utility types
 * used throughout the web applications. It provides type safety and consistency
 * for common data structures and platform-specific enums.
 */

declare namespace FreightOptimization {
  /**
   * Represents the possible states of a load in the system
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
    EXCEPTION = 'exception',
    RESOLVED = 'resolved'
  }

  /**
   * Represents the possible states of a driver in the system
   */
  export enum DriverStatus {
    AVAILABLE = 'available',
    ON_DUTY = 'on_duty',
    OFF_DUTY = 'off_duty',
    DRIVING = 'driving',
    UNAVAILABLE = 'unavailable',
    INACTIVE = 'inactive',
    MAINTENANCE = 'maintenance'
  }

  /**
   * Represents the types of equipment used for transportation
   */
  export enum EquipmentType {
    DRY_VAN = 'dry_van',
    REFRIGERATED = 'refrigerated',
    FLATBED = 'flatbed',
    TANKER = 'tanker',
    LOWBOY = 'lowboy',
    STEP_DECK = 'step_deck',
    DOUBLE_DROP = 'double_drop',
    CONESTOGA = 'conestoga',
    HOTSHOT = 'hotshot',
    DUMP = 'dump',
    CONTAINER = 'container',
    OTHER = 'other'
  }

  /**
   * Represents Hours of Service status for drivers
   */
  export enum HOSStatus {
    DRIVING = 'driving',
    ON_DUTY = 'on_duty',
    OFF_DUTY = 'off_duty',
    SLEEPER_BERTH = 'sleeper_berth',
    PERSONAL_CONVEYANCE = 'personal_conveyance',
    YARD_MOVES = 'yard_moves'
  }

  /**
   * Represents the type of location for a load
   */
  export enum LoadLocationType {
    PICKUP = 'pickup',
    DELIVERY = 'delivery',
    STOP = 'stop',
    SMART_HUB = 'smart_hub'
  }

  /**
   * Represents the type of load assignment
   */
  export enum LoadAssignmentType {
    DIRECT = 'direct',
    RELAY = 'relay',
    TEAM = 'team',
    MULTI_STOP = 'multi_stop'
  }

  /**
   * Represents the type of load requirement
   */
  export enum LoadRequirementType {
    EQUIPMENT = 'equipment',
    TEMPERATURE = 'temperature',
    HAZMAT = 'hazmat',
    TEAM_DRIVERS = 'team_drivers',
    SPECIAL_HANDLING = 'special_handling',
    LIFTGATE = 'liftgate',
    PALLET_JACK = 'pallet_jack',
    DOCK_HIGH = 'dock_high',
    INSIDE_DELIVERY = 'inside_delivery',
    APPOINTMENT_REQUIRED = 'appointment_required',
    OTHER = 'other'
  }

  /**
   * Represents the type of document associated with a load
   */
  export enum LoadDocumentType {
    BILL_OF_LADING = 'bill_of_lading',
    PROOF_OF_DELIVERY = 'proof_of_delivery',
    RATE_CONFIRMATION = 'rate_confirmation',
    INVOICE = 'invoice',
    CUSTOMS = 'customs',
    WEIGHT_TICKET = 'weight_ticket',
    INSPECTION = 'inspection',
    PHOTOS = 'photos',
    OTHER = 'other'
  }

  /**
   * Represents the category of achievements for gamification
   */
  export enum AchievementCategory {
    EFFICIENCY = 'efficiency',
    ON_TIME = 'on_time',
    SAFETY = 'safety',
    HUB_UTILIZATION = 'hub_utilization',
    NETWORK_CONTRIBUTION = 'network_contribution',
    FUEL_EFFICIENCY = 'fuel_efficiency',
    CUSTOMER_SATISFACTION = 'customer_satisfaction',
    RELAY_PARTICIPATION = 'relay_participation'
  }

  /**
   * Represents the level of an achievement
   */
  export enum AchievementLevel {
    BRONZE = 'bronze',
    SILVER = 'silver',
    GOLD = 'gold',
    PLATINUM = 'platinum',
    DIAMOND = 'diamond'
  }

  /**
   * Represents the type of leaderboard
   */
  export enum LeaderboardType {
    EFFICIENCY = 'efficiency',
    EARNINGS = 'earnings',
    NETWORK_CONTRIBUTION = 'network_contribution',
    REGIONAL = 'regional',
    NATIONAL = 'national',
    CARRIER = 'carrier'
  }

  /**
   * Represents the timeframe for a leaderboard
   */
  export enum LeaderboardTimeframe {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
    ALL_TIME = 'all_time'
  }

  /**
   * Represents the type of reward
   */
  export enum RewardType {
    CASH_BONUS = 'cash_bonus',
    FUEL_DISCOUNT = 'fuel_discount',
    PREMIUM_LOAD_ACCESS = 'premium_load_access',
    MAINTENANCE_DISCOUNT = 'maintenance_discount',
    MERCHANDISE = 'merchandise',
    RECOGNITION = 'recognition',
    OTHER = 'other'
  }
}

/**
 * Common interface for address information
 */
interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Common interface for contact information
 */
interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  notes?: string;
}

/**
 * Common interface for geographic coordinates
 */
interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Common interface for time windows (e.g., pickup and delivery times)
 */
interface TimeWindow {
  earliest: string; // ISO 8601 date string
  latest: string; // ISO 8601 date string
}

/**
 * Common interface for physical dimensions
 */
interface Dimensions {
  length: number; // in feet
  width: number; // in feet
  height: number; // in feet
}

/**
 * Generic interface for paginated API responses
 */
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Generic interface for API responses
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

/**
 * Extended error interface with error code and status information
 */
interface ErrorWithCode {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

/**
 * Utility type that makes all properties of an object optional recursively
 */
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Utility type that makes all properties of an object nullable
 */
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Utility type that makes all properties of an object optional
 */
type Optional<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Utility type to extract the value type of an object's properties
 */
type ValueOf<T> = T[keyof T];

/**
 * Utility type to get all possible paths in a nested object structure
 */
type RecursiveKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? K | `${K}.${RecursiveKeyOf<T[K]>}`
        : never;
    }[keyof T]
  : never;

/**
 * Augment the Window interface with application-specific global variables
 */
declare global {
  interface Window {
    googleMapsApiKey: string;
    mapboxApiKey: string;
    sentryDsn: string;
    appVersion: string;
    appEnvironment: 'development' | 'staging' | 'production';
    logRocket: any;
    gtag: Function;
  }
}