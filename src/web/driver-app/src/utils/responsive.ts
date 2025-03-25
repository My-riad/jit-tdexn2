import { Dimensions } from 'react-native'; // v0.72.0
import { breakpoints } from '../../../shared/styles/mediaQueries';
import { theme } from '../styles/theme';
import { getViewportDimensions } from '../../../common/utils/responsive';

/**
 * Device type identifiers for responsive design in the mobile driver application
 */
export const DEVICE_TYPES = {
  mobile: 'mobile',
  tablet: 'tablet',
  largeTablet: 'largeTablet'
};

/**
 * Determines the current device type based on screen width for mobile devices
 * @param width - Current screen width in pixels
 * @returns Device type identifier (mobile, tablet, or largeTablet)
 */
export const getDeviceType = (width: number): string => {
  if (width < breakpoints.sm) {
    return DEVICE_TYPES.mobile;
  } else if (width >= breakpoints.sm && width < breakpoints.lg) {
    return DEVICE_TYPES.tablet;
  } else {
    return DEVICE_TYPES.largeTablet;
  }
};

/**
 * Checks if the current device is a small mobile device based on screen width
 * @param width - Current screen width in pixels
 * @returns True if device is a small mobile device
 */
export const isMobile = (width: number): boolean => width < breakpoints.sm;

/**
 * Checks if the current device is a tablet based on screen width
 * @param width - Current screen width in pixels
 * @returns True if device is a tablet
 */
export const isTablet = (width: number): boolean => 
  width >= breakpoints.sm && width < breakpoints.lg;

/**
 * Checks if the current device is a large tablet based on screen width
 * @param width - Current screen width in pixels
 * @returns True if device is a large tablet
 */
export const isLargeTablet = (width: number): boolean => width >= breakpoints.lg;

/**
 * Returns a value based on the current device type for mobile devices
 * @param values - Object containing values for different device types
 * @param width - Current screen width in pixels
 * @returns The value corresponding to the current device type
 */
export const getResponsiveValue = <T>(values: Record<string, T>, width: number): T => {
  const deviceType = getDeviceType(width);
  
  // Return value for current device type if available
  if (values[deviceType] !== undefined) {
    return values[deviceType];
  }
  
  // Define fallback order for each device type
  const fallbackOrder: Record<string, string[]> = {
    [DEVICE_TYPES.mobile]: [DEVICE_TYPES.mobile, DEVICE_TYPES.tablet, DEVICE_TYPES.largeTablet],
    [DEVICE_TYPES.tablet]: [DEVICE_TYPES.tablet, DEVICE_TYPES.largeTablet, DEVICE_TYPES.mobile],
    [DEVICE_TYPES.largeTablet]: [DEVICE_TYPES.largeTablet, DEVICE_TYPES.tablet, DEVICE_TYPES.mobile]
  };
  
  // Try each fallback in order
  for (const type of fallbackOrder[deviceType]) {
    if (values[type] !== undefined) {
      return values[type];
    }
  }
  
  // If all fallbacks fail, return the first available value or undefined
  const firstAvailableKey = Object.keys(values)[0];
  return firstAvailableKey ? values[firstAvailableKey] : undefined as unknown as T;
};

/**
 * Generates styles based on the current device type for mobile devices
 * @param styles - Object containing styles for different device types
 * @param width - Current screen width in pixels
 * @returns Style object for the current device type
 */
export const getResponsiveStyles = <T>(styles: Record<string, T>, width: number): T => {
  // Uses the same logic as getResponsiveValue
  return getResponsiveValue(styles, width);
};

/**
 * Calculates a size value that scales based on screen width for mobile devices
 * @param baseSize - Base size value in pixels
 * @param width - Current screen width in pixels
 * @param factor - Scaling factor (default: 0.1)
 * @returns Calculated responsive size
 */
export const calculateResponsiveSize = (baseSize: number, width: number, factor: number = 0.1): number => {
  // Calculate a scale based on the width and factor, optimized for mobile screens
  // Ensure minimum size thresholds for readability on small screens
  const minScale = 0.8; // Minimum scale factor for very small screens
  const maxScale = 1.5; // Maximum scale factor for larger tablets
  
  // Calculate scale based on width and factor
  let scale = 1 + ((width / 1000) * factor);
  
  // Ensure scale is within bounds
  scale = Math.max(minScale, Math.min(scale, maxScale));
  
  return Math.round(baseSize * scale);
};

/**
 * Gets the current screen dimensions for mobile devices
 * Uses React Native Dimensions API, falling back to web methods if needed
 * 
 * @returns Object containing width, height, scale, and fontScale of the screen
 */
export const getScreenDimensions = (): { 
  width: number; 
  height: number; 
  scale: number; 
  fontScale: number 
} => {
  try {
    // Try to use React Native Dimensions API first
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return { width, height, scale, fontScale };
  } catch (error) {
    // Fallback to web viewport dimensions
    const { width, height } = getViewportDimensions();
    return { width, height, scale: 1, fontScale: 1 };
  }
};

/**
 * Determines if the device is in portrait orientation
 * @returns True if device is in portrait orientation
 */
export const isPortrait = (): boolean => {
  const { width, height } = getScreenDimensions();
  return height > width;
};

/**
 * Determines if the device is in landscape orientation
 * @returns True if device is in landscape orientation
 */
export const isLandscape = (): boolean => {
  const { width, height } = getScreenDimensions();
  return width > height;
};

/**
 * Calculates appropriate padding based on screen size and orientation
 * @param size - Padding size name (xs, sm, md, lg, xl)
 * @returns Padding object with horizontal and vertical values
 */
export const getResponsivePadding = (size: string): { 
  horizontal: number; 
  vertical: number 
} => {
  const { width, height } = getScreenDimensions();
  const deviceType = getDeviceType(width);
  const isPortraitMode = height > width;
  
  // Base padding values from theme
  const basePadding = theme.sizes[size] || theme.spacing[size] || '0';
  const numericValue = parseInt(basePadding, 10) || 0;
  
  // Adjust padding based on device type and orientation
  let horizontalPadding = numericValue;
  let verticalPadding = numericValue;
  
  if (deviceType === DEVICE_TYPES.mobile) {
    // Smaller padding on mobile, especially in portrait mode
    horizontalPadding = isPortraitMode ? Math.round(numericValue * 0.8) : Math.round(numericValue * 0.9);
    verticalPadding = Math.round(numericValue * 0.9);
  } else if (deviceType === DEVICE_TYPES.tablet) {
    // Slightly reduced padding on tablets
    horizontalPadding = isPortraitMode ? Math.round(numericValue * 0.9) : numericValue;
    verticalPadding = numericValue;
  }
  
  return {
    horizontal: horizontalPadding,
    vertical: verticalPadding
  };
};

/**
 * Calculates appropriate margin based on screen size and orientation
 * @param size - Margin size name (xs, sm, md, lg, xl)
 * @returns Margin object with horizontal and vertical values
 */
export const getResponsiveMargin = (size: string): { 
  horizontal: number; 
  vertical: number 
} => {
  // Uses the same logic as getResponsivePadding
  return getResponsivePadding(size);
};

/**
 * Calculates appropriate font size based on screen size and device type
 * @param baseSize - Base font size in pixels
 * @returns Responsive font size
 */
export const getResponsiveFontSize = (baseSize: number): number => {
  const { width, fontScale } = getScreenDimensions();
  const deviceType = getDeviceType(width);
  
  // Adjust base size according to device type
  let adjustedSize = baseSize;
  
  if (deviceType === DEVICE_TYPES.mobile) {
    // Ensure minimum font size for readability on mobile
    adjustedSize = Math.max(baseSize, 14);
  } else if (deviceType === DEVICE_TYPES.tablet) {
    // Default base size on tablets
    adjustedSize = baseSize;
  } else {
    // Slightly larger on large tablets
    adjustedSize = baseSize * 1.1;
  }
  
  // Apply device's fontScale setting for accessibility
  adjustedSize = adjustedSize * fontScale;
  
  return Math.round(adjustedSize);
};