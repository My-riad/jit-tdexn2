/**
 * Driver App Color System
 * 
 * Defines the color system specific to the driver mobile application,
 * extending the shared color system with mobile-optimized colors and
 * additional color sets for UI elements, status indicators, and dark mode.
 */
import { colors as sharedColors } from '../../shared/styles/colors';

/**
 * Primary color palette used for main UI elements, buttons, and key interactive components
 * Inherited from shared colors
 */
const primary = sharedColors.primary;

/**
 * Secondary color palette used for backgrounds, highlights, and subtle UI elements
 * Inherited from shared colors
 */
const secondary = sharedColors.secondary;

/**
 * Neutral color palette used for text, borders, dividers, and other UI elements
 * Inherited from shared colors
 */
const neutral = sharedColors.neutral;

/**
 * Semantic colors used to convey meaning (success, error, warning, info) in the UI
 * Inherited from shared colors
 */
const semantic = sharedColors.semantic;

/**
 * UI-specific colors for backgrounds, cards, inputs, and interactive states
 * Optimized for mobile interfaces
 */
const ui = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  input: '#FFFFFF',
  border: '#DADCE0',
  divider: '#E8EAED',
  hover: '#F1F3F4',
  active: '#E8F0FE',
  disabled: '#F1F3F4',
  focus: 'rgba(26, 115, 232, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  backdrop: 'rgba(0, 0, 0, 0.3)'
};

/**
 * Text colors for various content types and states
 * Ensuring readability on mobile screens
 */
const text = {
  primary: '#202124',
  secondary: '#5F6368',
  disabled: '#9AA0A6',
  inverse: '#FFFFFF',
  link: '#1A73E8',
  error: '#EA4335',
  success: '#34A853',
  warning: '#FBBC04'
};

/**
 * Status-specific colors for indicating load and driver statuses in the mobile app
 */
const status = {
  available: '#34A853',
  assigned: '#1A73E8',
  inTransit: '#FBBC04',
  atPickup: '#FBBC04',
  atDelivery: '#FBBC04',
  completed: '#34A853',
  cancelled: '#EA4335',
  delayed: '#EA4335',
  issue: '#EA4335'
};

/**
 * Map-specific colors for markers, routes, and other map elements
 * Inherited from shared colors
 */
const map = sharedColors.mapColors;

/**
 * Chart-specific colors for data visualizations and analytics dashboards
 * Inherited from shared colors
 */
const chart = sharedColors.chartColors;

/**
 * Dark mode color variants optimized for nighttime driving
 * Reduces eye strain and maintains visibility in low-light conditions
 */
const darkMode = {
  background: '#202124',
  card: '#3C4043',
  input: '#3C4043',
  border: '#5F6368',
  divider: '#5F6368',
  hover: '#5F6368',
  active: 'rgba(26, 115, 232, 0.2)',
  disabled: '#5F6368',
  focus: 'rgba(26, 115, 232, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  text: {
    primary: '#FFFFFF',
    secondary: '#DADCE0',
    disabled: '#9AA0A6',
    inverse: '#202124',
    link: '#8AB4F8',
    error: '#F28B82',
    success: '#81C995',
    warning: '#FDD663'
  }
};

/**
 * Main colors object that exports all color categories for the driver mobile application
 */
export const colors = {
  primary,
  secondary,
  neutral,
  semantic,
  ui,
  text,
  status,
  map,
  chart,
  darkMode
};