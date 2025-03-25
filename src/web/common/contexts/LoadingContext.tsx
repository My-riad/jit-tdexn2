import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

/**
 * Interface defining the shape of the loading context value
 */
interface LoadingContextType {
  loading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

/**
 * Props for the LoadingProvider component
 */
interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * Context for managing global loading states across the application
 */
export const LoadingContext = createContext<LoadingContextType | null>(null);

/**
 * Custom hook that provides access to the loading context
 * 
 * @returns The loading context value containing loading state and methods
 * @throws Error if used outside of a LoadingProvider
 */
export const useLoadingContext = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  
  if (context === null) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  
  return context;
};

/**
 * Provider component that makes the loading context available to its children
 * 
 * Manages loading states and provides methods to control loading indicators
 * throughout the application, ensuring consistent user feedback during
 * asynchronous operations.
 * 
 * @param props - Component props
 * @param props.children - Child components that will have access to the loading context
 * @returns Provider component with the loading context value
 */
export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  // Initialize loading state
  const [loading, setLoadingState] = useState<boolean>(false);
  
  // Initialize loading message
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  /**
   * Updates both loading state and message
   * 
   * @param isLoading - Whether the application is in a loading state
   * @param message - Optional message to display during loading
   */
  const setLoading = (isLoading: boolean, message: string = ''): void => {
    setLoadingState(isLoading);
    setLoadingMessage(isLoading ? message : '');
  };

  /**
   * Sets loading to true with an optional message
   * 
   * @param message - Optional message to display during loading
   */
  const startLoading = (message: string = ''): void => {
    setLoading(true, message);
  };

  /**
   * Sets loading to false and clears the message
   */
  const stopLoading = (): void => {
    setLoading(false);
  };

  // Create context value object using useMemo to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      loading,
      loadingMessage,
      setLoading,
      startLoading,
      stopLoading,
    }),
    [loading, loadingMessage]
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};