/**
 * Style Variables
 * 
 * This file defines common style variables used throughout the application
 * to maintain visual consistency across all interfaces.
 */

/**
 * Standard spacing values used for margins, paddings, and gaps
 * throughout the application
 */
export const spacing = {
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px'
};

/**
 * Standard size values for UI components like layout containers,
 * inputs, buttons, and icons
 */
export const sizes = {
  maxContentWidth: '1280px',
  headerHeight: '64px',
  footerHeight: '48px',
  sidebarWidth: '240px',
  sidebarCollapsedWidth: '64px',
  inputHeight: '40px',
  buttonHeight: '40px',
  iconSize: {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '32px',
    xl: '48px'
  }
};

/**
 * Z-index values to control the stacking order of UI elements
 * Higher values appear on top of elements with lower values
 */
export const zIndex = {
  base: 0,
  content: 1,
  overlay: 10,
  dropdown: 100,
  modal: 1000,
  tooltip: 1500,
  toast: 2000
};

/**
 * Border properties including radius, width, and style
 * for consistent UI element styling
 */
export const borders = {
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
    thick: '4px'
  },
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted'
  }
};

/**
 * Opacity values for different UI states like disabled elements,
 * hover effects, and overlays
 */
export const opacity = {
  disabled: 0.5,
  hover: 0.8,
  focus: 0.9,
  overlay: 0.7
};

/**
 * Shadow definitions for different elevation levels to create
 * depth perception in the UI
 */
export const elevation = {
  none: 'none',
  low: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  high: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  highest: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};