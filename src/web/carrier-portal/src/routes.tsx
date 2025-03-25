import React from 'react'; // Core React library for component creation // version ^18.2.0
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; // React Router components for routing configuration // version ^6.10.0

import { useAuthContext } from '../../common/contexts/AuthContext'; // Import authentication context hook for route protection
import { AUTH_ROUTES, CARRIER_PORTAL_ROUTES } from '../../common/constants/routes'; // Import route path constants for consistent navigation
import MainLayout from './components/layout/MainLayout'; // Import main layout component for authenticated pages
import DashboardPage from './pages/DashboardPage'; // Import dashboard page component
import FleetPage from './pages/FleetPage'; // Import fleet management page component
import DriversPage from './pages/DriversPage'; // Import drivers management page component
import LoadsPage from './pages/LoadsPage'; // Import loads management page component
import LoadDetailPage from './pages/LoadDetailPage'; // Import load detail page component
import DriverDetailPage from './pages/DriverDetailPage'; // Import driver detail page component
import VehicleDetailPage from './pages/VehicleDetailPage'; // Import vehicle detail page component
import AnalyticsPage from './pages/AnalyticsPage'; // Import analytics page component
import EfficiencyPage from './pages/EfficiencyPage'; // Import efficiency analytics page component
import FinancialPage from './pages/FinancialPage'; // Import financial analytics page component
import OperationalPage from './pages/OperationalPage'; // Import operational analytics page component
import SettingsPage from './pages/SettingsPage'; // Import settings page component
import ProfilePage from './pages/ProfilePage'; // Import profile page component
import NotificationsPage from './pages/NotificationsPage'; // Import notifications page component
import CreateLoadPage from './pages/CreateLoadPage'; // Import create load page component
import CreateDriverPage from './pages/CreateDriverPage'; // Import create driver page component
import CreateVehiclePage from './pages/CreateVehiclePage'; // Import create vehicle page component
import LoginPage from './pages/LoginPage'; // Import login page component
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // Import forgot password page component

/**
 * Component displayed when a user lacks permission to access a route
 */
const AccessDenied: React.FC = () => {
  return (
    <div>
      <h2>Access Denied</h2>
      <p>You do not have permission to view this page.</p>
      <a href="/dashboard">Return to Dashboard</a>
    </div>
  );
};

/**
 * Component displayed when a route doesn't match any defined routes
 */
const NotFound: React.FC = () => {
  return (
    <div>
      <h2>404 Not Found</h2>
      <p>The requested page could not be found.</p>
      <a href="/dashboard">Return to Dashboard</a>
    </div>
  );
};

/**
 * Component that protects routes requiring authentication
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuthContext(); // Get authentication context using useAuthContext hook
  const location = useLocation(); // Get current location using useLocation hook

  // Check if user is authenticated
  if (!authState?.isAuthenticated) {
    // If not authenticated, redirect to login page with return URL in state
    return <Navigate to={AUTH_ROUTES.LOGIN} state={{ returnUrl: location.pathname }} replace />;
  }

  // If authenticated, render the children components
  return <>{children}</>;
};

/**
 * Component that protects routes requiring specific roles
 */
const RoleProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles: string[] }> = ({ children, requiredRoles }) => {
  const { authState } = useAuthContext(); // Get authentication context using useAuthContext hook
  const location = useLocation(); // Get current location using useLocation hook

  // Check if user is authenticated
  if (!authState?.isAuthenticated) {
    // If not authenticated, redirect to login page with return URL in state
    return <Navigate to={AUTH_ROUTES.LOGIN} state={{ returnUrl: location.pathname }} replace />;
  }

  // If authenticated, check if user has any of the required roles
  const hasRequiredRole = requiredRoles.some(role => authState.user?.roles?.includes(role));

  if (!hasRequiredRole) {
    // If user lacks required roles, render access denied component
    return <AccessDenied />;
  }

  // If user has required role, render the children components
  return <>{children}</>;
};

/**
 * Export the carrier portal routes configuration for use in App component
 */
const carrierRoutes = (
  <Routes>
    <Route path="/" element={<Navigate to={CARRIER_PORTAL_ROUTES.DASHBOARD} />} />
    <Route path={AUTH_ROUTES.LOGIN} element={<LoginPage />} />
    <Route path={AUTH_ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path={CARRIER_PORTAL_ROUTES.DASHBOARD} element={<DashboardPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.FLEET} element={<FleetPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.DRIVERS} element={<DriversPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.LOADS} element={<LoadsPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.LOAD_DETAIL} element={<LoadDetailPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.DRIVER_DETAIL} element={<DriverDetailPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.VEHICLE_DETAIL} element={<VehicleDetailPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.ANALYTICS} element={<AnalyticsPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.EFFICIENCY} element={<EfficiencyPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.FINANCIAL} element={<FinancialPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.OPERATIONAL} element={<OperationalPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.SETTINGS} element={<SettingsPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.PROFILE} element={<ProfilePage />} />
      <Route path={CARRIER_PORTAL_ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.CREATE_LOAD} element={<CreateLoadPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.CREATE_DRIVER} element={<CreateDriverPage />} />
      <Route path={CARRIER_PORTAL_ROUTES.CREATE_VEHICLE} element={<CreateVehiclePage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default carrierRoutes;