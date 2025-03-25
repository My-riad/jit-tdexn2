# src/web/shipper-portal/src/components/layout/Sidebar.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useLocation, useNavigate } from 'react-router-dom'; // version ^6.10.0
import { Sidebar, SidebarProps } from '../../../shared/components/layout/Sidebar';
import { theme } from '../../../shared/styles/theme';
import { SHIPPER_PORTAL_ROUTES } from '../../../common/constants/routes';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import { DashboardIcon, TruckIcon, LocationIcon, DriverIcon, MoneyIcon, SettingsIcon } from '../../../shared/assets/icons';
import { NavItem } from '@mui/material'; // version ^5.11.0

/**
 * Interface defining the props for the ShipperSidebar component, extending the base SidebarProps
 */
interface ShipperSidebarProps extends SidebarProps {
  // Inherits props from SidebarProps
}

/**
 * Type definition for navigation items in the sidebar
 */
interface NavItemType {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  requiredRoles: string[];
}

/**
 * Styled wrapper for the shipper sidebar, applying shipper-specific styling
 */
const ShipperSidebarContainer = styled.div`
  /* Applies shipper-specific styling to the sidebar */
`;

/**
 * Styled container for navigation items, adjusting spacing based on collapsed state
 */
const NavItemsContainer = styled.div<{ isCollapsed: boolean }>`
  /* Displays navigation items in a vertical list */
  display: flex;
  flex-direction: column;
  /* Adjusts spacing and alignment based on collapsed state */
  align-items: stretch;
  padding: ${theme.spacing.md} 0;
`;

/**
 * Styled extension of the NavItem component, handling active state and collapsed display
 */
const ShipperNavItem = styled(NavItem)<{ isActive: boolean; isCollapsed: boolean }>`
  /* Applies shipper-specific styling to navigation items */
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xs};
  border-radius: ${theme.borders.radius.md};
  
  /* Handles active state with highlight color */
  background-color: ${props => props.isActive ? theme.colors.background.accent : 'transparent'};
  color: ${theme.colors.text.primary};
  
  /* Adjusts display based on collapsed state */
  display: flex;
  align-items: center;
  justify-content: ${props => props.isCollapsed ? 'center' : 'flex-start'};
  
  /* Applies hover and focus states for better UX */
  &:hover, &:focus {
    background-color: ${theme.colors.background.tertiary};
    outline: none;
  }
`;

/**
 * Styled container for navigation item icons, ensuring consistent sizing and alignment
 */
const NavItemIcon = styled.div<{ isActive: boolean }>`
  /* Sizes and positions the icon consistently */
  width: ${theme.sizes.iconSize.md};
  height: ${theme.sizes.iconSize.md};
  margin-right: ${theme.spacing.sm};
  
  /* Applies active state styling */
  color: ${props => props.isActive ? theme.colors.text.primary : theme.colors.text.secondary};
  
  /* Ensures proper alignment with text */
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Styled component for navigation item labels, controlling visibility based on collapsed state
 */
const NavItemLabel = styled.span<{ isCollapsed: boolean }>`
  /* Controls visibility based on collapsed state */
  display: ${props => props.isCollapsed ? 'none' : 'inline'};
  
  /* Applies consistent font styling */
  font-size: ${theme.sizes.sm};
  font-weight: ${theme.fonts.weight.medium};
  
  /* Handles text overflow with ellipsis */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * Array of navigation items for the shipper sidebar with their respective paths, icons, and required roles
 */
const NAV_ITEMS: NavItemType[] = [
  { id: 'dashboard', label: 'Dashboard', path: SHIPPER_PORTAL_ROUTES.DASHBOARD, icon: <DashboardIcon />, requiredRoles: [] },
  { id: 'loads', label: 'Loads', path: SHIPPER_PORTAL_ROUTES.LOADS, icon: <TruckIcon />, requiredRoles: [] },
  { id: 'tracking', label: 'Tracking', path: SHIPPER_PORTAL_ROUTES.TRACKING, icon: <LocationIcon />, requiredRoles: [] },
  { id: 'carriers', label: 'Carriers', path: SHIPPER_PORTAL_ROUTES.CARRIERS, icon: <DriverIcon />, requiredRoles: [] },
  { id: 'analytics', label: 'Analytics', path: SHIPPER_PORTAL_ROUTES.ANALYTICS, icon: <MoneyIcon />, requiredRoles: ['shipper_admin', 'account_manager'] },
  { id: 'settings', label: 'Settings', path: SHIPPER_PORTAL_ROUTES.SETTINGS, icon: <SettingsIcon />, requiredRoles: ['shipper_admin'] }
];

/**
 * A specialized sidebar component for the shipper portal that provides navigation links and collapsible functionality
 */
const ShipperSidebar: React.FC<ShipperSidebarProps> = ({ isCollapsed, onToggle, className }) => {
  // Get the current location using useLocation hook
  const location = useLocation();

  // Get the navigation function using useNavigate hook
  const navigate = useNavigate();

  // Get the authentication state from useAuthContext
  const { authState, hasRole } = useAuthContext();

  /**
   * Checks if a route is active based on the current location
   * @param route The route to check
   * @returns True if the route is active, false otherwise
   */
  const isActiveRoute = useCallback((route: string) => {
    return location.pathname === route;
  }, [location.pathname]);

  /**
   * Handles navigation item clicks
   * @param path The path to navigate to
   */
  const handleNavItemClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Render the base Sidebar component with shipper-specific styling and props
  return (
    <ShipperSidebarContainer className={className}>
      <Sidebar isCollapsed={isCollapsed} onToggle={onToggle}>
        <NavItemsContainer isCollapsed={isCollapsed}>
          {NAV_ITEMS.map(item => {
            // Conditionally render certain navigation items based on user role
            if (item.requiredRoles.length > 0 && !item.requiredRoles.some(role => hasRole(role))) {
              return null;
            }

            return (
              <ShipperNavItem
                key={item.id}
                isActive={isActiveRoute(item.path)}
                isCollapsed={isCollapsed}
                onClick={() => handleNavItemClick(item.path)}
                aria-label={`Navigate to ${item.label}`}
              >
                <NavItemIcon isActive={isActiveRoute(item.path)}>
                  {item.icon}
                </NavItemIcon>
                <NavItemLabel isCollapsed={isCollapsed}>
                  {item.label}
                </NavItemLabel>
              </ShipperNavItem>
            );
          })}
        </NavItemsContainer>
      </Sidebar>
    </ShipperSidebarContainer>
  );
};

export default ShipperSidebar;