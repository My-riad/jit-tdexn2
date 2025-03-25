/**
 * Typography System for the AI-driven Freight Optimization Platform
 * 
 * This file defines the font families, sizes, weights, line heights, and styles
 * to ensure consistent typography across all web interfaces.
 * Follows WCAG 2.1 AA compliance for accessibility.
 */

// Font families used throughout the application
export const family = {
  primary: "'Roboto', sans-serif",
  secondary: "'Roboto Condensed', sans-serif",
  mono: "'Roboto Mono', monospace"
};

// Font sizes for different text elements
export const size = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  xxl: '24px',
  h1: '32px',
  h2: '28px',
  h3: '24px',
  h4: '20px',
  h5: '18px',
  h6: '16px',
  body: '16px',
  caption: '14px',
  label: '14px',
  button: '16px',
  data: '16px'
};

// Font weights for different text styles
export const weight = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700
};

// Line heights for different text styles
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.6,
  loose: 2
};

// Predefined text styles combining font family, size, weight, and line height
export const style = {
  heading1: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1.2
  },
  heading2: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.2
  },
  heading3: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.3
  },
  heading4: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1.3
  },
  heading5: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: 1.3
  },
  heading6: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: 1.3
  },
  bodyLarge: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '18px',
    fontWeight: 400,
    lineHeight: 1.6
  },
  bodyRegular: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.6
  },
  bodySmall: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.6
  },
  caption: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.4
  },
  label: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4
  },
  button: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.5
  },
  data: {
    fontFamily: "'Roboto Mono', monospace",
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5
  }
};

// CSS @font-face declarations for loading custom fonts with optimized performance
export const fontFace = "@font-face {\n  font-family: 'Roboto';\n  font-style: normal;\n  font-weight: 400;\n  src: url('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2') format('woff2');\n  font-display: swap;\n}\n@font-face {\n  font-family: 'Roboto';\n  font-style: normal;\n  font-weight: 500;\n  src: url('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2') format('woff2');\n  font-display: swap;\n}\n@font-face {\n  font-family: 'Roboto';\n  font-style: normal;\n  font-weight: 700;\n  src: url('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2') format('woff2');\n  font-display: swap;\n}\n@font-face {\n  font-family: 'Roboto Mono';\n  font-style: normal;\n  font-weight: 400;\n  src: url('https://fonts.gstatic.com/s/robotomono/v22/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vq_ROW4AJi8SJQt.woff2') format('woff2');\n  font-display: swap;\n}";

// Export all typography-related constants as a single object
export const fonts = {
  family: family,
  size: size,
  weight: weight,
  lineHeight: lineHeight,
  style: style,
  fontFace: fontFace
};