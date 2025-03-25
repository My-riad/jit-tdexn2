/**
 * Primary color palette used for main UI elements, buttons, and key interactive components
 */
export const primary = {
  blue: '#1A73E8',
  green: '#34A853',
  orange: '#FBBC04',
  red: '#EA4335',
  blueLight: '#4285F4',
  greenLight: '#66BB6A',
  orangeLight: '#FFC107',
  redLight: '#F44336'
};

/**
 * Secondary color palette used for backgrounds, highlights, and subtle UI elements
 */
export const secondary = {
  lightBlue: '#E8F0FE',
  lightGreen: '#E6F4EA',
  lightOrange: '#FEF7E0',
  lightRed: '#FCE8E6'
};

/**
 * Neutral color palette used for text, borders, dividers, and other UI elements
 */
export const neutral = {
  darkGray: '#202124',
  mediumGray: '#5F6368',
  lightGray: '#DADCE0',
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F8F9FA',
  gray200: '#F1F3F4',
  gray300: '#E8EAED',
  gray400: '#BDC1C6',
  gray500: '#9AA0A6',
  gray600: '#80868B',
  gray700: '#5F6368',
  gray800: '#3C4043',
  gray900: '#202124'
};

/**
 * Semantic colors used to convey meaning (success, error, warning, info) in the UI
 */
export const semantic = {
  success: '#34A853',
  warning: '#FBBC04',
  error: '#EA4335',
  info: '#1A73E8'
};

/**
 * Gradient definitions for backgrounds, buttons, and visual elements requiring depth
 */
export const gradients = {
  blueFade: 'linear-gradient(90deg, #1A73E8 0%, #4285F4 100%)',
  greenFade: 'linear-gradient(90deg, #34A853 0%, #66BB6A 100%)',
  orangeFade: 'linear-gradient(90deg, #FBBC04 0%, #FFC107 100%)',
  redFade: 'linear-gradient(90deg, #EA4335 0%, #F44336 100%)'
};

/**
 * Transparent color variations for overlays, shadows, and subtle UI effects
 */
export const transparency = {
  light10: 'rgba(255, 255, 255, 0.1)',
  light20: 'rgba(255, 255, 255, 0.2)',
  light50: 'rgba(255, 255, 255, 0.5)',
  light70: 'rgba(255, 255, 255, 0.7)',
  dark10: 'rgba(0, 0, 0, 0.1)',
  dark20: 'rgba(0, 0, 0, 0.2)',
  dark50: 'rgba(0, 0, 0, 0.5)',
  dark70: 'rgba(0, 0, 0, 0.7)',
  blue10: 'rgba(26, 115, 232, 0.1)',
  blue20: 'rgba(26, 115, 232, 0.2)',
  blue50: 'rgba(26, 115, 232, 0.5)',
  green10: 'rgba(52, 168, 83, 0.1)',
  green20: 'rgba(52, 168, 83, 0.2)',
  green50: 'rgba(52, 168, 83, 0.5)',
  orange10: 'rgba(251, 188, 4, 0.1)',
  orange20: 'rgba(251, 188, 4, 0.2)',
  orange50: 'rgba(251, 188, 4, 0.5)',
  red10: 'rgba(234, 67, 53, 0.1)',
  red20: 'rgba(234, 67, 53, 0.2)',
  red50: 'rgba(234, 67, 53, 0.5)'
};

/**
 * Map-specific colors for markers, routes, and other map elements
 */
export const mapColors = {
  currentLocation: '#1A73E8',
  destination: '#34A853',
  smartHub: '#FBBC04',
  bonusZone: 'rgba(234, 67, 53, 0.3)',
  routeLine: '#1A73E8',
  routeAlternative: '#9AA0A6',
  geofence: 'rgba(26, 115, 232, 0.2)',
  truckMarker: '#1A73E8',
  loadMarker: '#34A853',
  hubMarker: '#FBBC04'
};

/**
 * Chart-specific colors for data visualizations and analytics dashboards
 */
export const chartColors = {
  efficiency: '#34A853',
  earnings: '#1A73E8',
  emptyMiles: '#EA4335',
  utilization: '#FBBC04',
  background: '#FFFFFF',
  grid: '#E8EAED',
  label: '#5F6368',
  series1: '#1A73E8',
  series2: '#34A853',
  series3: '#FBBC04',
  series4: '#EA4335',
  series5: '#9AA0A6'
};

/**
 * Main colors object that exports all color categories
 */
export const colors = {
  primary,
  secondary,
  neutral,
  semantic,
  gradients,
  transparency,
  mapColors,
  chartColors
};