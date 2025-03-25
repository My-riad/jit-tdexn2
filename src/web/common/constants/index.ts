/**
 * Constants Index
 * 
 * This file centralizes and re-exports all constants used across the frontend applications
 * for the AI-driven Freight Optimization Platform. It serves as the single entry point for
 * importing constants throughout the web applications, ensuring consistency across
 * driver mobile app, carrier portal, and shipper portal interfaces.
 * 
 * By importing from this central location, developers can avoid duplication and ensure
 * that the same constants are used consistently throughout the application:
 * 
 * ```
 * import { AUTH_ENDPOINTS, VALIDATION_ERRORS, CARRIER_PORTAL_ROUTES } from '@/common/constants';
 * ```
 */

// Re-export API endpoint constants
export * from './endpoints';

// Re-export error message constants
export * from './errorMessages';

// Re-export route path constants
export * from './routes';

// Re-export HTTP status code constants
export * from './statusCodes';