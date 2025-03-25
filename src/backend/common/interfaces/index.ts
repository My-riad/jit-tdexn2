/**
 * Central Interface Exports
 * 
 * This file serves as the central export point for all common interface definitions 
 * used throughout the AI-driven Freight Optimization Platform. By re-exporting all 
 * interfaces, types, and enums from individual interface files, this index provides 
 * a single import point for consumers, simplifying imports and maintaining a clean 
 * dependency structure.
 * 
 * @example
 * // Instead of:
 * import { Driver } from '../common/interfaces/driver.interface';
 * import { Load } from '../common/interfaces/load.interface';
 * 
 * // You can use:
 * import { Driver, Load } from '../common/interfaces';
 */

// Re-export all achievement interfaces and types
export * from './achievement.interface';

// Re-export all carrier interfaces and types
export * from './carrier.interface';

// Re-export all driver interfaces and types
export * from './driver.interface';

// Re-export all event interfaces and types
export * from './event.interface';

// Re-export all load interfaces and types
export * from './load.interface';

// Re-export all position interfaces and types
export * from './position.interface';

// Re-export all shipper interfaces and types
export * from './shipper.interface';

// Re-export all smart hub interfaces and types
export * from './smartHub.interface';

// Re-export all user interfaces and types
export * from './user.interface';

// Re-export all vehicle interfaces and types
export * from './vehicle.interface';