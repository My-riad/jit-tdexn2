/**
 * Central barrel file for interface definitions in the AI-driven Freight Optimization Platform
 * 
 * This file re-exports all interface definitions from the interfaces directory to simplify
 * imports throughout the application. It allows consumers to import multiple interfaces
 * from a single path rather than importing from individual files.
 *
 * Example usage:
 * import { Driver, Load, Vehicle } from '@/common/interfaces';
 */

// Authentication interfaces
export * from './auth.interface';

// Carrier interfaces
export * from './carrier.interface';

// Driver interfaces
export * from './driver.interface';

// Load interfaces
export * from './load.interface';

// Shipper interfaces
export * from './shipper.interface';

// User interfaces
export * from './user.interface';

// Vehicle interfaces
export * from './vehicle.interface';

// Gamification interfaces
export * from './gamification.interface';

// Market intelligence interfaces
export * from './market.interface';

// Tracking interfaces
export * from './tracking.interface';