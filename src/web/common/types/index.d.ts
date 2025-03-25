/**
 * Main entry point for common type definitions used across the web applications
 * of the AI-driven Freight Optimization Platform.
 * 
 * This file exports and re-exports all common type definitions to provide a
 * centralized access point for shared types, improving development efficiency
 * and ensuring consistent type safety across the platform.
 * 
 * @version 1.0.0
 */

// Re-export environment type definitions
export type { ProcessEnv } from './environment';

// Re-export global type definitions
export { FreightOptimization } from './global';
export type {
  // Common data structure interfaces
  Address,
  ContactInfo,
  GeoCoordinates,
  TimeWindow,
  Dimensions,
  
  // API related interfaces
  PaginatedResponse,
  ApiResponse,
  ErrorWithCode,
  
  // Utility types for flexible type handling
  DeepPartial,
  Nullable,
  Optional,
  ValueOf,
  RecursiveKeyOf
} from './global';

// Re-export SVG-related type definitions
export type {
  // SVG component interfaces
  SVGComponentProps,
  IconComponent,
  IconSet,
  MapMarkerSVGProps,
  ChartSVGProps
} from './svg';