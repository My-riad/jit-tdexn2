import { breakpoints } from '../../../shared/styles/mediaQueries';

/**
 * Device type identifiers for responsive design across the platform
 * Used to categorize devices based on screen width for consistent responsive behavior
 */
export const DEVICE_TYPES = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
  largeDesktop: 'largeDesktop'
};

/**
 * Determines the current device type based on window width
 * @param width - Current window width in pixels
 * @returns Device type identifier (mobile, tablet, desktop, or largeDesktop)
 */
export const getDeviceType = (width: number): string => {
  if (width < breakpoints.sm) {
    return DEVICE_TYPES.mobile;
  } else if (width >= breakpoints.sm && width < breakpoints.lg) {
    return DEVICE_TYPES.tablet;
  } else if (width >= breakpoints.lg && width < breakpoints.xl) {
    return DEVICE_TYPES.desktop;
  } else {
    return DEVICE_TYPES.largeDesktop;
  }
};

/**
 * Checks if the current device is a mobile device based on window width
 * @param width - Current window width in pixels
 * @returns True if device is mobile
 */
export const isMobile = (width: number): boolean => width < breakpoints.sm;

/**
 * Checks if the current device is a tablet based on window width
 * @param width - Current window width in pixels
 * @returns True if device is tablet
 */
export const isTablet = (width: number): boolean => 
  width >= breakpoints.sm && width < breakpoints.lg;

/**
 * Checks if the current device is a desktop based on window width
 * @param width - Current window width in pixels
 * @returns True if device is desktop
 */
export const isDesktop = (width: number): boolean => 
  width >= breakpoints.lg && width < breakpoints.xl;

/**
 * Checks if the current device is a large desktop based on window width
 * @param width - Current window width in pixels
 * @returns True if device is large desktop
 */
export const isLargeDesktop = (width: number): boolean => width >= breakpoints.xl;

/**
 * Returns a value based on the current device type
 * @param values - Object containing values for different device types
 * @param width - Current window width in pixels
 * @returns The value corresponding to the current device type, or fallback value
 * 
 * @example
 * // Returns the appropriate font size based on device type
 * const fontSize = getResponsiveValue({
 *   mobile: '14px',
 *   tablet: '16px',
 *   desktop: '18px',
 *   largeDesktop: '20px'
 * }, window.innerWidth);
 */
export const getResponsiveValue = <T>(values: Record<string, T>, width: number): T => {
  const deviceType = getDeviceType(width);
  
  // Return value for current device type if available
  if (values[deviceType] !== undefined) {
    return values[deviceType];
  }
  
  // Define fallback order for each device type
  const fallbackOrder: Record<string, string[]> = {
    [DEVICE_TYPES.mobile]: [DEVICE_TYPES.mobile],
    [DEVICE_TYPES.tablet]: [DEVICE_TYPES.tablet, DEVICE_TYPES.mobile],
    [DEVICE_TYPES.desktop]: [DEVICE_TYPES.desktop, DEVICE_TYPES.tablet, DEVICE_TYPES.mobile],
    [DEVICE_TYPES.largeDesktop]: [DEVICE_TYPES.largeDesktop, DEVICE_TYPES.desktop, DEVICE_TYPES.tablet, DEVICE_TYPES.mobile]
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
 * Generates CSS-in-JS styles based on the current device type
 * @param styles - Object containing styles for different device types
 * @param width - Current window width in pixels
 * @returns Style object for the current device type, or fallback styles
 * 
 * @example
 * // Returns the appropriate styles based on device type
 * const containerStyles = getResponsiveStyles({
 *   mobile: { padding: '10px', fontSize: '14px' },
 *   tablet: { padding: '20px', fontSize: '16px' },
 *   desktop: { padding: '30px', fontSize: '18px' }
 * }, window.innerWidth);
 */
export const getResponsiveStyles = <T>(styles: Record<string, T>, width: number): T => {
  // Uses the same logic as getResponsiveValue
  return getResponsiveValue(styles, width);
};

/**
 * Calculates a size value that scales based on screen width
 * @param baseSize - Base size value in pixels
 * @param width - Current window width in pixels
 * @param factor - Scaling factor (default: 0.1)
 * @returns Calculated responsive size
 * 
 * @example
 * // Returns a font size that scales with screen width
 * const fontSize = calculateResponsiveSize(16, window.innerWidth, 0.05);
 */
export const calculateResponsiveSize = (baseSize: number, width: number, factor: number = 0.1): number => {
  // Calculate a scale based on the width and factor
  const scale = 1 + ((width / 1000) * factor);
  return baseSize * scale;
};

/**
 * Gets the current viewport dimensions
 * Safely handles server-side rendering by returning default values when window is undefined
 * 
 * @returns Object containing width and height of the viewport
 * 
 * @example
 * // Get current viewport size
 * const { width, height } = getViewportDimensions();
 */
export const getViewportDimensions = (): { width: number; height: number } => {
  // Check if window is defined (for server-side rendering)
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};