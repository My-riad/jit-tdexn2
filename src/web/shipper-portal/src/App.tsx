import React from 'react'; // version ^18.2.0
import { BrowserRouter } from 'react-router-dom'; // version ^6.10.0
import shipperRoutes from './routes'; // Import the routing configuration for the shipper portal
import { AuthProvider } from '../../common/contexts/AuthContext'; // Import authentication context provider for user authentication
import { ThemeProvider } from '../../common/contexts/ThemeContext'; // Import theme context provider for consistent styling and theme switching
import { NotificationProvider } from '../../common/contexts/NotificationContext'; // Import notification context provider for system notifications
import { LoadingProvider } from '../../common/contexts/LoadingContext'; // Import loading context provider for managing loading states

/**
 * Root component that sets up the application structure with necessary providers and routing
 * @returns {JSX.Element} The rendered application with all providers and routes
 */
const App: React.FC = () => {
  return (
    // LD1: Wrap the application with all necessary context providers
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <LoadingProvider>
              {/* LD1: Include the shipperRoutes component for routing configuration */}
              {shipperRoutes}
            </LoadingProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// IE3: Export the root App component for rendering in index.tsx
export default App;