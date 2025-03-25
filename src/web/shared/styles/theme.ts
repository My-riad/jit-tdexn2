/**
 * Theme System for the AI-driven Freight Optimization Platform
 * 
 * Defines theme objects for light and dark modes, providing consistent styling
 * across the application with appropriate contrast for accessibility.
 */

import { colors } from './colors';
import { fonts } from './fonts';
import { spacing, sizes, zIndex, borders, opacity, elevation } from './variables';
import { mediaQueries } from './mediaQueries';

/**
 * Interface defining the structure of theme objects for the application
 * Ensures type safety and consistent theming across different parts of the UI
 */
export interface ThemeType {
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      accent: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      accent: string;
      error: string;
      success: string;
      warning: string;
      info: string;
      inverted: string;
    };
    border: {
      light: string;
      medium: string;
      dark: string;
    };
    button: {
      primary: {
        background: string;
        text: string;
        border: string;
        hoverBackground: string;
        activeBackground: string;
      };
      secondary: {
        background: string;
        text: string;
        border: string;
        hoverBackground: string;
        activeBackground: string;
      };
      tertiary: {
        background: string;
        text: string;
        border: string;
        hoverBackground: string;
        activeBackground: string;
      };
      danger: {
        background: string;
        text: string;
        border: string;
        hoverBackground: string;
        activeBackground: string;
      };
      success: {
        background: string;
        text: string;
        border: string;
        hoverBackground: string;
        activeBackground: string;
      };
      disabled: {
        background: string;
        text: string;
        border: string;
      };
    };
    input: {
      background: string;
      text: string;
      placeholder: string;
      border: string;
      focusBorder: string;
      errorBorder: string;
      disabledBackground: string;
      disabledText: string;
    };
    card: {
      background: string;
      border: string;
    };
    icon: {
      primary: string;
      secondary: string;
      accent: string;
      error: string;
      success: string;
      warning: string;
    };
    shadow: {
      light: string;
      medium: string;
      dark: string;
    };
    chart: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      grid: string;
      axis: string;
      label: string;
    };
    map: {
      route: string;
      marker: {
        driver: string;
        load: string;
        hub: string;
      };
      geofence: string;
      bonusZone: string;
    };
    status: {
      active: string;
      inactive: string;
      warning: string;
      error: string;
      info: string;
    };
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  fonts: typeof fonts;
  spacing: typeof spacing;
  sizes: typeof sizes;
  zIndex: typeof zIndex;
  borders: typeof borders;
  opacity: typeof opacity;
  elevation: typeof elevation;
  mediaQueries: typeof mediaQueries;
  mode: 'light' | 'dark';
}

/**
 * Light theme configuration with color scheme optimized for light backgrounds
 */
export const lightTheme: ThemeType = {
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F1F3F4',
      accent: '#E8F0FE',
    },
    text: {
      primary: '#202124',
      secondary: '#5F6368',
      tertiary: '#80868B',
      accent: '#1A73E8',
      error: '#EA4335',
      success: '#34A853',
      warning: '#FBBC04',
      info: '#4285F4',
      inverted: '#FFFFFF',
    },
    border: {
      light: '#DADCE0',
      medium: '#BDC1C6',
      dark: '#9AA0A6',
    },
    button: {
      primary: {
        background: '#1A73E8',
        text: '#FFFFFF',
        border: '#1A73E8',
        hoverBackground: '#1765CC',
        activeBackground: '#185ABC',
      },
      secondary: {
        background: '#FFFFFF',
        text: '#1A73E8',
        border: '#1A73E8',
        hoverBackground: '#E8F0FE',
        activeBackground: '#D2E3FC',
      },
      tertiary: {
        background: '#F1F3F4',
        text: '#5F6368',
        border: '#F1F3F4',
        hoverBackground: '#E8EAED',
        activeBackground: '#DADCE0',
      },
      danger: {
        background: '#EA4335',
        text: '#FFFFFF',
        border: '#EA4335',
        hoverBackground: '#D93025',
        activeBackground: '#C5221F',
      },
      success: {
        background: '#34A853',
        text: '#FFFFFF',
        border: '#34A853',
        hoverBackground: '#188038',
        activeBackground: '#137333',
      },
      disabled: {
        background: '#F1F3F4',
        text: '#9AA0A6',
        border: '#F1F3F4',
      },
    },
    input: {
      background: '#FFFFFF',
      text: '#202124',
      placeholder: '#9AA0A6',
      border: '#DADCE0',
      focusBorder: '#1A73E8',
      errorBorder: '#EA4335',
      disabledBackground: '#F1F3F4',
      disabledText: '#9AA0A6',
    },
    card: {
      background: '#FFFFFF',
      border: '#DADCE0',
    },
    icon: {
      primary: '#5F6368',
      secondary: '#9AA0A6',
      accent: '#1A73E8',
      error: '#EA4335',
      success: '#34A853',
      warning: '#FBBC04',
    },
    shadow: {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.15)',
      dark: 'rgba(0, 0, 0, 0.2)',
    },
    chart: {
      primary: '#1A73E8',
      secondary: '#34A853',
      tertiary: '#FBBC04',
      quaternary: '#EA4335',
      grid: '#DADCE0',
      axis: '#9AA0A6',
      label: '#5F6368',
    },
    map: {
      route: '#1A73E8',
      marker: {
        driver: '#1A73E8',
        load: '#34A853',
        hub: '#FBBC04',
      },
      geofence: 'rgba(26, 115, 232, 0.2)',
      bonusZone: 'rgba(234, 67, 53, 0.3)',
    },
    status: {
      active: '#34A853',
      inactive: '#9AA0A6',
      warning: '#FBBC04',
      error: '#EA4335',
      info: '#4285F4',
    },
    semantic: {
      success: '#34A853',
      warning: '#FBBC04',
      error: '#EA4335',
      info: '#4285F4',
    },
  },
  fonts,
  spacing,
  sizes,
  zIndex,
  borders,
  opacity,
  elevation,
  mediaQueries,
  mode: 'light',
};

/**
 * Dark theme configuration with color scheme optimized for dark backgrounds
 */
export const darkTheme: ThemeType = {
  colors: {
    background: {
      primary: '#202124',
      secondary: '#303134',
      tertiary: '#3C4043',
      accent: '#1F3058',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#DADCE0',
      tertiary: '#9AA0A6',
      accent: '#8AB4F8',
      error: '#F28B82',
      success: '#81C995',
      warning: '#FDD663',
      info: '#8AB4F8',
      inverted: '#202124',
    },
    border: {
      light: '#5F6368',
      medium: '#3C4043',
      dark: '#202124',
    },
    button: {
      primary: {
        background: '#8AB4F8',
        text: '#202124',
        border: '#8AB4F8',
        hoverBackground: '#669DF6',
        activeBackground: '#4285F4',
      },
      secondary: {
        background: '#303134',
        text: '#8AB4F8',
        border: '#8AB4F8',
        hoverBackground: '#1F3058',
        activeBackground: '#174EA6',
      },
      tertiary: {
        background: '#3C4043',
        text: '#DADCE0',
        border: '#3C4043',
        hoverBackground: '#5F6368',
        activeBackground: '#80868B',
      },
      danger: {
        background: '#F28B82',
        text: '#202124',
        border: '#F28B82',
        hoverBackground: '#EE675C',
        activeBackground: '#EA4335',
      },
      success: {
        background: '#81C995',
        text: '#202124',
        border: '#81C995',
        hoverBackground: '#5BB974',
        activeBackground: '#34A853',
      },
      disabled: {
        background: '#3C4043',
        text: '#9AA0A6',
        border: '#3C4043',
      },
    },
    input: {
      background: '#303134',
      text: '#FFFFFF',
      placeholder: '#9AA0A6',
      border: '#5F6368',
      focusBorder: '#8AB4F8',
      errorBorder: '#F28B82',
      disabledBackground: '#3C4043',
      disabledText: '#9AA0A6',
    },
    card: {
      background: '#303134',
      border: '#5F6368',
    },
    icon: {
      primary: '#DADCE0',
      secondary: '#9AA0A6',
      accent: '#8AB4F8',
      error: '#F28B82',
      success: '#81C995',
      warning: '#FDD663',
    },
    shadow: {
      light: 'rgba(0, 0, 0, 0.2)',
      medium: 'rgba(0, 0, 0, 0.3)',
      dark: 'rgba(0, 0, 0, 0.4)',
    },
    chart: {
      primary: '#8AB4F8',
      secondary: '#81C995',
      tertiary: '#FDD663',
      quaternary: '#F28B82',
      grid: '#5F6368',
      axis: '#9AA0A6',
      label: '#DADCE0',
    },
    map: {
      route: '#8AB4F8',
      marker: {
        driver: '#8AB4F8',
        load: '#81C995',
        hub: '#FDD663',
      },
      geofence: 'rgba(138, 180, 248, 0.2)',
      bonusZone: 'rgba(242, 139, 130, 0.3)',
    },
    status: {
      active: '#81C995',
      inactive: '#9AA0A6',
      warning: '#FDD663',
      error: '#F28B82',
      info: '#8AB4F8',
    },
    semantic: {
      success: '#81C995',
      warning: '#FDD663',
      error: '#F28B82',
      info: '#8AB4F8',
    },
  },
  fonts,
  spacing,
  sizes,
  zIndex,
  borders,
  opacity,
  elevation: {
    none: 'none',
    low: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    high: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    highest: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  },
  mediaQueries,
  mode: 'dark',
};