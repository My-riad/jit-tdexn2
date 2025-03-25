import { css } from 'styled-components';

/**
 * Standard breakpoints for responsive design across the application
 * These values align with common device sizes and modern responsive design practices
 */
export const breakpoints = {
  xs: '0px',     // Extra small devices (portrait phones)
  sm: '576px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '992px',   // Large devices (desktops)
  xl: '1200px',  // Extra large devices (large desktops)
};

// Type definition for breakpoint keys to enforce type safety
type BreakpointKey = keyof typeof breakpoints;

/**
 * Numeric values of breakpoints for calculations
 * Used internally for determining ranges and comparing values
 */
const breakpointValues = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

/**
 * Order of breakpoints from smallest to largest for sequential operations
 * Used for determining the next breakpoint in sequence
 */
const breakpointOrder: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * Creates a media query for screens larger than the specified breakpoint
 * @param breakpoint - The breakpoint name (xs, sm, md, lg, xl)
 * @returns Media query string for use with styled-components
 */
export const up = (breakpoint: BreakpointKey | string): string => {
  if (!breakpoints[breakpoint as BreakpointKey]) {
    throw new Error(
      `Invalid breakpoint: ${breakpoint}. Available breakpoints are: ${Object.keys(breakpoints).join(', ')}`
    );
  }
  
  return `@media (min-width: ${breakpoints[breakpoint as BreakpointKey]})`;
};

/**
 * Creates a media query for screens smaller than the specified breakpoint
 * @param breakpoint - The breakpoint name (xs, sm, md, lg, xl)
 * @returns Media query string for use with styled-components
 */
export const down = (breakpoint: BreakpointKey | string): string => {
  if (!breakpoints[breakpoint as BreakpointKey]) {
    throw new Error(
      `Invalid breakpoint: ${breakpoint}. Available breakpoints are: ${Object.keys(breakpoints).join(', ')}`
    );
  }
  
  // Subtract 0.02px to avoid conflicts with 'up' at exact breakpoint values
  return `@media (max-width: ${parseFloat(breakpoints[breakpoint as BreakpointKey]) - 0.02}px)`;
};

/**
 * Creates a media query for screens between two specified breakpoints
 * @param minBreakpoint - The minimum breakpoint name (xs, sm, md, lg, xl)
 * @param maxBreakpoint - The maximum breakpoint name (xs, sm, md, lg, xl)
 * @returns Media query string for use with styled-components
 */
export const between = (minBreakpoint: BreakpointKey | string, maxBreakpoint: BreakpointKey | string): string => {
  if (!breakpoints[minBreakpoint as BreakpointKey] || !breakpoints[maxBreakpoint as BreakpointKey]) {
    throw new Error(
      `Invalid breakpoints: ${minBreakpoint}, ${maxBreakpoint}. Available breakpoints are: ${Object.keys(breakpoints).join(', ')}`
    );
  }
  
  return `@media (min-width: ${breakpoints[minBreakpoint as BreakpointKey]}) and (max-width: ${parseFloat(breakpoints[maxBreakpoint as BreakpointKey]) - 0.02}px)`;
};

/**
 * Creates a media query for screens that match exactly one breakpoint range
 * @param breakpoint - The breakpoint name (xs, sm, md, lg, xl)
 * @returns Media query string for use with styled-components
 */
export const only = (breakpoint: BreakpointKey | string): string => {
  if (!breakpoints[breakpoint as BreakpointKey]) {
    throw new Error(
      `Invalid breakpoint: ${breakpoint}. Available breakpoints are: ${Object.keys(breakpoints).join(', ')}`
    );
  }
  
  const index = breakpointOrder.indexOf(breakpoint as BreakpointKey);
  const nextBreakpoint = breakpointOrder[index + 1];
  
  if (nextBreakpoint) {
    return `@media (min-width: ${breakpoints[breakpoint as BreakpointKey]}) and (max-width: ${parseFloat(breakpoints[nextBreakpoint]) - 0.02}px)`;
  }
  
  // If it's the last breakpoint, just use min-width
  return `@media (min-width: ${breakpoints[breakpoint as BreakpointKey]})`;
};

/**
 * Object containing all media query helper functions for easy import
 * Provides a convenient way to import all functions at once
 */
export const mediaQueries = {
  up,
  down,
  between,
  only,
};

export default mediaQueries;