/**
 * Typography System for the Driver Mobile Application
 * 
 * This file extends the shared typography system with mobile-optimized
 * font sizes and styles. It ensures consistent text rendering across the driver app
 * while optimizing for readability on mobile devices in various lighting conditions,
 * including while driving.
 */

// Import the shared typography system to extend
import * as sharedFonts from '../../shared/styles/fonts';

// Reuse the font families from the shared system
export const family = sharedFonts.family;

// Define mobile-optimized font sizes
// Slightly smaller than web versions for better mobile readability
export const size = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  xxl: '24px',
  h1: '28px',     // Reduced from 32px for mobile
  h2: '24px',     // Reduced from 28px for mobile
  h3: '20px',     // Reduced from 24px for mobile
  h4: '18px',     // Reduced from 20px for mobile
  h5: '16px',     // Reduced from 18px for mobile
  h6: '14px',     // Reduced from 16px for mobile
  body: '16px',
  caption: '12px', // Reduced from 14px for mobile
  label: '14px',
  button: '16px',
  data: '16px'
};

// Reuse the font weights from the shared system
export const weight = sharedFonts.weight;

// Define mobile-optimized text styles
export const style = {
  heading1: {
    fontFamily: family.primary,
    fontSize: '28px',
    fontWeight: weight.bold,
    lineHeight: sharedFonts.lineHeight.tight
  },
  heading2: {
    fontFamily: family.primary,
    fontSize: '24px',
    fontWeight: weight.bold,
    lineHeight: sharedFonts.lineHeight.tight
  },
  heading3: {
    fontFamily: family.primary,
    fontSize: '20px',
    fontWeight: weight.bold,
    lineHeight: sharedFonts.lineHeight.tight
  },
  heading4: {
    fontFamily: family.primary,
    fontSize: '18px',
    fontWeight: weight.bold,
    lineHeight: sharedFonts.lineHeight.tight
  },
  heading5: {
    fontFamily: family.primary,
    fontSize: '16px',
    fontWeight: weight.bold,
    lineHeight: sharedFonts.lineHeight.tight
  },
  heading6: {
    fontFamily: family.primary,
    fontSize: '14px',
    fontWeight: weight.bold,
    lineHeight: sharedFonts.lineHeight.tight
  },
  bodyLarge: {
    fontFamily: family.primary,
    fontSize: '18px',
    fontWeight: weight.regular,
    lineHeight: sharedFonts.lineHeight.normal
  },
  bodyRegular: {
    fontFamily: family.primary,
    fontSize: '16px',
    fontWeight: weight.regular,
    lineHeight: sharedFonts.lineHeight.normal
  },
  bodySmall: {
    fontFamily: family.primary,
    fontSize: '14px',
    fontWeight: weight.regular,
    lineHeight: sharedFonts.lineHeight.normal
  },
  caption: {
    fontFamily: family.primary,
    fontSize: '12px',
    fontWeight: weight.regular,
    lineHeight: sharedFonts.lineHeight.normal
  },
  label: {
    fontFamily: family.primary,
    fontSize: '14px',
    fontWeight: weight.medium,
    lineHeight: sharedFonts.lineHeight.normal
  },
  button: {
    fontFamily: family.primary,
    fontSize: '16px',
    fontWeight: weight.medium,
    lineHeight: sharedFonts.lineHeight.normal
  },
  data: {
    fontFamily: family.mono,
    fontSize: '16px',
    fontWeight: weight.regular,
    lineHeight: sharedFonts.lineHeight.normal
  },
  // Driver app specific styles
  scoreDisplay: {
    fontFamily: family.primary,
    fontSize: '32px',
    fontWeight: weight.bold,
    lineHeight: 1
  },
  loadCard: {
    fontFamily: family.primary,
    fontSize: '16px',
    fontWeight: weight.medium,
    lineHeight: sharedFonts.lineHeight.normal
  },
  statusBadge: {
    fontFamily: family.primary,
    fontSize: '12px',
    fontWeight: weight.medium,
    lineHeight: 1.2
  }
};

// Export all typography-related constants as a single object
export const fonts = {
  family,
  size,
  weight,
  style
};