import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components'; // v5.3.6
import { lightTheme, darkTheme, ThemeType } from '../../shared/styles/theme';
import useLocalStorage from '../hooks/useLocalStorage';

/**
 * Storage key for persisting theme preference in localStorage
 */
const THEME_STORAGE_KEY = "freight-optimization-theme";

/**
 * Enum for available theme modes
 */
export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark"
}

/**
 * Interface defining the shape of the theme context value
 */
interface ThemeContextType {
  /**
   * The current theme object
   */
  theme: ThemeType;
  
  /**
   * The current theme mode (light or dark)
   */
  themeMode: ThemeMode;
  
  /**
   * Function to toggle between light and dark themes
   */
  toggleTheme: () => void;
  
  /**
   * Function to set a specific theme mode
   */
  setThemeMode: (mode: ThemeMode) => void;
}

/**
 * Props for the ThemeProvider component
 */
interface ThemeProviderProps {
  /**
   * Child components to be wrapped by the provider
   */
  children: React.ReactNode;
  
  /**
   * Optional initial theme mode to use
   */
  initialTheme?: ThemeMode;
}

/**
 * Context for theme-related values and functions
 */
export const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider component that manages theme state and provides theme context to children
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialTheme 
}) => {
  // Use localStorage to persist theme preference across sessions
  const [themeMode, setStoredTheme] = useLocalStorage<ThemeMode>(
    THEME_STORAGE_KEY,
    initialTheme || ThemeMode.LIGHT
  );
  
  // Select the appropriate theme object based on current mode
  const theme = themeMode === ThemeMode.DARK ? darkTheme : lightTheme;
  
  /**
   * Toggles between light and dark themes
   */
  const toggleTheme = () => {
    setStoredTheme(themeMode === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT);
  };
  
  /**
   * Sets a specific theme mode
   */
  const setThemeMode = (mode: ThemeMode) => {
    setStoredTheme(mode);
  };
  
  // Create the context value with theme object and functions
  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    toggleTheme,
    setThemeMode
  };
  
  // Provide theme context to children wrapped in styled-components ThemeProvider
  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access the theme context values and functions
 * @returns The current theme context value
 * @throws Error if used outside of a ThemeProvider
 */
export const useThemeContext = (): ThemeContextType => {
  const context = React.useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
};