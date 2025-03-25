/**
 * Theme System for the Driver Mobile Application
 * 
 * Defines the theme system specific to the driver mobile application,
 * extending the shared theme with mobile-optimized properties. This file
 * creates light and dark theme objects tailored for the driver app interface,
 * ensuring consistent styling, readability, and usability on mobile devices
 * in various lighting conditions.
 */

import { colors } from './colors';
import { fonts } from './fonts';
import { ThemeType } from '../../shared/styles/theme';
import { mediaQueries } from '../../shared/styles/mediaQueries';

/**
 * Mobile-optimized spacing values, slightly more compact than the shared system
 * to ensure efficient use of limited screen space
 */
const spacing = {
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px'
};

/**
 * Mobile-optimized size values for UI components, adjusted for touch
 * interactions and mobile screen dimensions
 */
const sizes = {
  headerHeight: '56px',
  bottomNavHeight: '56px',
  tabBarHeight: '48px',
  buttonHeight: '48px',
  inputHeight: '48px',
  touchTarget: '44px',
  iconSize: {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '32px',
    xl: '40px'
  },
  maxContentWidth: '600px'
};

/**
 * Border styles and radii optimized for mobile UI components
 */
const borders = {
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    round: '50%'
  },
  width: {
    thin: '1px',
    medium: '2px',
    thick: '3px'
  },
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted'
  }
};

/**
 * Z-index values for stacking UI elements in the mobile app
 */
const zIndex = {
  base: 0,
  content: 1,
  overlay: 10,
  dropdown: 100,
  modal: 1000,
  tooltip: 1500,
  toast: 2000,
  header: 100,
  bottomNav: 100
};

/**
 * Opacity values for various UI states in the mobile app
 */
const opacity = {
  disabled: 0.5,
  hover: 0.8,
  focus: 0.9,
  overlay: 0.7,
  inactive: 0.6
};

/**
 * Shadow definitions for elevation levels, optimized for mobile UI
 */
const elevation = {
  none: 'none',
  low: '0 1px 2px rgba(0, 0, 0, 0.1)',
  medium: '0 2px 4px rgba(0, 0, 0, 0.1)',
  high: '0 4px 8px rgba(0, 0, 0, 0.1)',
  highest: '0 8px 16px rgba(0, 0, 0, 0.1)'
};

/**
 * Component-specific dimensions and styling for mobile UI components
 */
const components = {
  header: {
    height: '56px',
    padding: '0 16px'
  },
  bottomNavigation: {
    height: '56px',
    itemWidth: '80px'
  },
  card: {
    padding: '16px',
    margin: '8px 0',
    borderRadius: '8px'
  },
  button: {
    height: '48px',
    paddingHorizontal: '16px',
    borderRadius: '8px'
  },
  input: {
    height: '48px',
    padding: '0 16px',
    borderRadius: '8px'
  },
  modal: {
    padding: '16px',
    borderRadius: '12px'
  },
  toast: {
    padding: '12px 16px',
    borderRadius: '8px',
    margin: '8px'
  },
  loadCard: {
    padding: '16px',
    borderRadius: '8px',
    margin: '8px 0'
  },
  scoreDisplay: {
    size: '64px',
    borderWidth: '3px'
  }
};

/**
 * Interface defining the structure of driver app theme objects for type safety.
 * While this interface uses a similar pattern to the shared ThemeType,
 * it's adapted specifically for the driver mobile application's needs.
 */
export interface DriverThemeType {
  colors: {
    primary: typeof colors.primary;
    secondary: typeof colors.secondary;
    neutral: typeof colors.neutral;
    semantic: typeof colors.semantic;
    ui: typeof colors.ui | typeof colors.darkMode;
    text: typeof colors.text | typeof colors.darkMode.text;
    status: typeof colors.status;
    map: typeof colors.map;
    chart: typeof colors.chart;
  };
  fonts: typeof fonts;
  spacing: typeof spacing;
  sizes: typeof sizes;
  zIndex: typeof zIndex;
  borders: typeof borders;
  opacity: typeof opacity;
  elevation: typeof elevation;
  mediaQueries: typeof mediaQueries;
  components: typeof components;
  mode: 'light' | 'dark';
}

/**
 * Light theme configuration for the driver mobile application
 */
export const lightTheme: DriverThemeType = {
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    neutral: colors.neutral,
    semantic: colors.semantic,
    ui: colors.ui,
    text: colors.text,
    status: colors.status,
    map: colors.map,
    chart: colors.chart
  },
  fonts,
  spacing,
  sizes,
  zIndex,
  borders,
  opacity,
  elevation,
  mediaQueries,
  components,
  mode: 'light'
};

/**
 * Dark theme configuration for the driver mobile application,
 * optimized for nighttime driving
 */
export const darkTheme: DriverThemeType = {
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    neutral: colors.neutral,
    semantic: colors.semantic,
    ui: colors.darkMode,
    text: colors.darkMode.text,
    status: colors.status,
    map: colors.map,
    chart: colors.chart
  },
  fonts,
  spacing,
  sizes,
  zIndex,
  borders,
  opacity,
  elevation: {
    none: 'none',
    low: '0 1px 2px rgba(0, 0, 0, 0.2)',
    medium: '0 2px 4px rgba(0, 0, 0, 0.2)',
    high: '0 4px 8px rgba(0, 0, 0, 0.2)',
    highest: '0 8px 16px rgba(0, 0, 0, 0.2)'
  },
  mediaQueries,
  components,
  mode: 'dark'
};

/**
 * Default theme for the driver mobile application (light theme)
 */
export const theme = lightTheme;