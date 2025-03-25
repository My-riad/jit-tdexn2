import React from 'react'; // version ^18.2.0
import { ReactNode } from 'react'; // version ^18.2.0
import { render, RenderOptions, RenderResult } from '@testing-library/react'; // version ^14.0.0
import { Provider } from 'react-redux'; // version ^8.0.5
import { configureStore } from '@reduxjs/toolkit'; // version ^1.9.3
import { BrowserRouter } from 'react-router-dom'; // version ^6.8.2

import { ThemeProvider, ThemeMode } from '../../common/contexts/ThemeContext';
import { AuthProvider } from '../../common/contexts/AuthContext';
import { NotificationProvider } from '../../common/contexts/NotificationContext';
import { LoadingProvider } from '../../common/contexts/LoadingContext';
import { LocationProvider } from '../../common/contexts/LocationContext';
import server from '../mocks/server';

/**
 * Options for the renderWithProviders function
 */
export interface RenderWithProvidersOptions {
  /**
   * Initial state for the Redux store
   */
  preloadedState?: any;
  /**
   * Custom Redux store to use instead of creating one
   */
  store?: any;
  /**
   * Additional render options from @testing-library/react
   */
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
  /**
   * Whether to include the router provider
   * @default true
   */
  withRouter?: boolean;
  /**
   * Whether to include the theme provider
   * @default true
   */
  withTheme?: boolean;
  /**
   * Whether to include the auth provider
   * @default true
   */
  withAuth?: boolean;
  /**
   * Whether to include the notification provider
   * @default true
   */
  withNotifications?: boolean;
  /**
   * Whether to include the loading provider
   * @default true
   */
  withLoading?: boolean;
  /**
   * Whether to include the location provider
   * @default true
   */
  withLocation?: boolean;
  /**
   * Whether to include the Redux provider
   * @default true
   */
  withRedux?: boolean;
    /**
   * Initial theme mode to use
   * @default ThemeMode.LIGHT
   */
  themeMode?: ThemeMode;
}

/**
 * Wrapper component that provides all necessary context providers for testing
 */
const AllTheProviders: React.FC<{ children: ReactNode; options: RenderWithProvidersOptions }> = ({ children, options }) => {
  return (
    <>
      {options.withTheme !== false ? (
        <ThemeProvider initialTheme={options.themeMode}>
          {options.withAuth !== false ? (
            <AuthProvider>
              {options.withNotifications !== false ? (
                <NotificationProvider>
                  {options.withLoading !== false ? (
                    <LoadingProvider>
                      {options.withLocation !== false ? (
                        <LocationProvider>
                          {options.withRedux !== false ? (
                            <Provider store={options.store}>
                              {options.withRouter !== false ? (
                                <BrowserRouter>
                                  {children}
                                </BrowserRouter>
                              ) : (
                                children
                              )}
                            </Provider>
                          ) : (
                            children
                          )}
                        </LocationProvider>
                      ) : (
                        children
                      )}
                    </LoadingProvider>
                  ) : (
                    children
                  )}
                </NotificationProvider>
              ) : (
                children
              )}
            </AuthProvider>
          ) : (
            children
          )}
        </ThemeProvider>
      ) : (
        children
      )}
    </>
  );
};

/**
 * Renders a React component with all necessary providers for testing
 */
export const renderWithProviders = (
  ui: ReactNode,
  options: RenderWithProvidersOptions = {}
): RenderResult & { store: any } => {
  // Create a test store using configureStore with provided preloadedState or empty object
  const store = options.store || configureStore({
    reducer: () => ({}), // Mock reducer
    preloadedState: options.preloadedState || {},
  });

  // Merge the provided render options with default options
  const mergedOptions = {
    ...options,
    wrapper: ({ children }: { children: ReactNode }) => (
      <AllTheProviders options={{ ...options, store }}>{children}</AllTheProviders>
    ),
  };

  // Render the UI with the wrapper using testing-library's render function
  const renderResult = render(ui, mergedOptions.renderOptions);

  // Return the render result with the store attached for test assertions
  return {
    ...renderResult,
    store,
  };
};

/**
 * Sets up the MSW mock server for API mocking in tests
 */
export const setupMockServer = (): Function => {
  // Start the MSW server to intercept API requests
  server.listen();

  // Return a cleanup function that resets handlers and closes the server
  return () => {
    server.resetHandlers();
    server.close();
  };
};