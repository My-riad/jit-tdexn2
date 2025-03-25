/**
 * index.ts
 * 
 * Central export file for the styling system of the AI-driven Freight Optimization Platform.
 * This file aggregates and re-exports all style-related constants, functions, and components
 * from individual style files, providing a single entry point for importing styles throughout
 * the application.
 * 
 * The styling system is designed to ensure:
 * - Consistent design across all interfaces
 * - Modular and maintainable styling
 * - WCAG 2.1 AA compliance for accessibility
 */

// Import all style modules
import * as animations from './animations';
import * as colors from './colors';
import * as fonts from './fonts';
import { GlobalStyles } from './globalStyles';
import * as mediaQueries from './mediaQueries';
import * as mixins from './mixins';
import * as theme from './theme';
import * as variables from './variables';

// Re-export all style modules
export { animations };
export { colors };
export { fonts };
export { GlobalStyles };
export { mediaQueries };
export { mixins };
export { theme };
export { variables };