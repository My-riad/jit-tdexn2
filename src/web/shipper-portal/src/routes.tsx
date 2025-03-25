import React from 'react'; // version ^18.2.0
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; // version ^6.10.0
import { useAuthContext } from '../../common/contexts/AuthContext'; // Import authentication context hook for route protection
import { AUTH_ROUTES, SHIPPER_PORTAL_ROUTES } from '../../common/constants/routes'; // Import route path constants for consistent navigation
import MainLayout from './components/layout/MainLayout'; // Import main layout component for authenticated pages
import DashboardPage from './pages/DashboardPage'; // Import dashboard page component
import LoadsPage from './pages/LoadsPage'; // Import loads management page component
import CreateLoadPage from './pages/CreateLoadPage'; // Import create load page component
import LoadDetailPage from './pages/LoadDetailPage'; // Import load detail page component
import TrackingPage from './pages/TrackingPage'; // Import tracking page component
import CarriersPage from './pages/CarriersPage'; // Import carriers management page component
import CarrierDetailPage from './pages/CarrierDetailPage'; // Import carrier detail page component
import AnalyticsPage from './pages/AnalyticsPage'; // Import analytics page component
import SettingsPage from './pages/SettingsPage'; // Import settings page component
import ProfilePage from './pages/ProfilePage'; // Import profile page component
import NotificationsPage from './pages/NotificationsPage'; // Import notifications page component
import LoginPage from './pages/LoginPage'; // Import login page component
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // Import forgot password page component

/**
 * Component that protects routes requiring authentication
 * @param { children } React children components to render if authenticated
 * @returns {JSX.Element} Either the protected component or redirect to login
 */
const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  // LD1: Get authentication context using useAuthContext hook
  const { authState } = useAuthContext();

  // LD1: Get current location using useLocation hook
  const location = useLocation();

  // LD1: Check if user is authenticated
  if (!authState?.isAuthenticated) {
    // LD1: If not authenticated, redirect to login page with return URL in state
    return <Navigate to={AUTH_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // LD1: If authenticated, render the children components
  return children;
};

/**
 * Component that protects routes requiring specific roles
 * @param { children, requiredRoles } React children and array of required roles
 * @returns {JSX.Element} Either the protected component, redirect to login, or access denied
 */
const RoleProtectedRoute: React.FC<{ children: JSX.Element; requiredRoles: string[] }> = ({ children, requiredRoles }) => {
  // LD1: Get authentication context using useAuthContext hook
  const { authState, hasRole } = useAuthContext();

  // LD1: Get current location using useLocation hook
  const location = useLocation();

  // LD1: Check if user is authenticated
  if (!authState?.isAuthenticated) {
    // LD1: If not authenticated, redirect to login page with return URL in state
    return <Navigate to={AUTH_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // LD1: If authenticated, check if user has any of the required roles
  const hasRequiredRole = requiredRoles.some(role => hasRole(role));
  if (!hasRequiredRole) {
    // LD1: If user lacks required roles, render access denied component
    return (
      <MainLayout>
        <AccessDenied />
      </MainLayout>
    );
  }

  // LD1: If user has required role, render the children components
  return children;
};

/**
 * Component displayed when a user lacks permission to access a route
 * @returns JSX.Element
 */
const AccessDenied: React.FC = () => {
  // LD1: Render a message indicating access is denied
  return (
    <div>
      <h1>Access Denied</h1>
      <p>You do not have permission to view this page.</p>
      {/* LD1: Provide a link to return to the dashboard */}
      <a href={SHIPPER_PORTAL_ROUTES.DASHBOARD}>Return to Dashboard</a>
    </div>
  );
};

/**
 * Component displayed when a route doesn't match any defined routes
 * @returns JSX.Element
 */
const NotFound: React.FC = () => {
  // LD1: Render a 404 not found message
  return (
    <div>
      <h1>404 Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      {/* LD1: Provide a link to return to the dashboard */}
      <a href={SHIPPER_PORTAL_ROUTES.DASHBOARD}>Return to Dashboard</a>
    </div>
  );
};

/**
 * Export the shipper portal routes configuration for use in App component
 * @returns JSX.Element
 */
const shipperRoutes: JSX.Element = (
  <Routes>
    {/* LD1: Define a route that redirects the root path to the dashboard */}
    <Route path="/" element={<Navigate to={SHIPPER_PORTAL_ROUTES.DASHBOARD} />} />

    {/* LD1: Define public routes for authentication (login, forgot password) */}
    <Route path={AUTH_ROUTES.LOGIN} element={<LoginPage />} />
    <Route path={AUTH_ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

    {/* LD1: Define protected routes that require authentication */}
    <Route path={SHIPPER_PORTAL_ROUTES.DASHBOARD} element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.LOADS} element={<ProtectedRoute><MainLayout><LoadsPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.CREATE_LOAD} element={<ProtectedRoute><MainLayout><CreateLoadPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.LOAD_DETAIL} element={<ProtectedRoute><MainLayout><LoadDetailPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.TRACKING} element={<ProtectedRoute><MainLayout><TrackingPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.CARRIERS} element={<ProtectedRoute><MainLayout><CarriersPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.CARRIER_DETAIL} element={<ProtectedRoute><MainLayout><CarrierDetailPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.ANALYTICS} element={<ProtectedRoute><MainLayout><AnalyticsPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.SETTINGS} element={<ProtectedRoute><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.PROFILE} element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
    <Route path={SHIPPER_PORTAL_ROUTES.NOTIFICATIONS} element={<ProtectedRoute><MainLayout><NotificationsPage /></MainLayout></ProtectedRoute>} />

    {/* LD1: Define a catch-all route for 404 Not Found pages */}
    <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
  </Routes>
);

export default shipperRoutes;