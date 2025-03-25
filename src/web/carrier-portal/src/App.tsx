import React from 'react'; // Core React library for component creation // version ^18.2.0
import { Provider } from 'react-redux'; // Redux Provider component for connecting Redux store to React // version ^8.0.5
import { PersistGate } from 'redux-persist/integration/react'; // PersistGate component for Redux persistence loading // version ^6.0.0
import { BrowserRouter } from 'react-router-dom'; // BrowserRouter component for client-side routing // version ^6.8.0

import carrierRoutes from './routes'; // Import the carrier portal routes configuration
import { store, persistor } from './store'; // Import Redux store and persistor for state management
import { AuthProvider, ThemeProvider, LoadingProvider, NotificationProvider } from '../../common/contexts'; // Import context providers for global state management
import GlobalStyles from '../../shared/styles/globalStyles'; // Import global styles for consistent styling across the application

/**
 * Root component that sets up the application structure with all required providers and routing
 * @returns {JSX.Element} The rendered application with all providers and routing
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <AuthProvider>
              <LoadingProvider>
                <NotificationProvider>
                  <GlobalStyles />
                  {carrierRoutes}
                </NotificationProvider>
              </LoadingProvider>
            </AuthProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </BrowserRouter>
  );
};

// Export the root App component for mounting in index.tsx
export default App;