import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, Link } from 'react-router-dom';

import Sidebar, { SidebarProps } from '../../../../shared/components/layout/Sidebar';
import { theme } from '../../../../shared/styles/theme';
import { mediaQueries } from '../../../../shared/styles/mediaQueries';
import { CARRIER_PORTAL_ROUTES } from '../../../../common/constants/routes';
import {
  DashboardIcon,
  TruckIcon,
  DriverIcon,
  LocationIcon,
  MoneyIcon,
  SettingsIcon
} from '../../../../shared/assets/icons';

/**
 * Props for the CarrierSidebar component
 */
interface CarrierSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * Interface for navigation items in the sidebar
 */
interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

/**
 * Navigation items for the carrier sidebar
 */
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: CARRIER_PORTAL_ROUTES.DASHBOARD,
    icon: <DashboardIcon />
  },
  {
    id: 'fleet',
    label: 'Fleet',
    path: CARRIER_PORTAL_ROUTES.FLEET,
    icon: <TruckIcon />
  },
  {
    id: 'drivers',
    label: 'Drivers',
    path: CARRIER_PORTAL_ROUTES.DRIVERS,
    icon: <DriverIcon />
  },
  {
    id: 'loads',
    label: 'Loads',
    path: CARRIER_PORTAL_ROUTES.LOADS,
    icon: <LocationIcon />
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: CARRIER_PORTAL_ROUTES.ANALYTICS,
    icon: <MoneyIcon />
  },
  {
    id: 'settings',
    label: 'Settings',
    path: CARRIER_PORTAL_ROUTES.SETTINGS,
    icon: <SettingsIcon />
  }
];

/**
 * Styled wrapper for the base Sidebar component with carrier-specific styling
 */
const StyledSidebar = styled(Sidebar)`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  box-shadow: ${({ theme }) => theme.elevation.medium};
  z-index: ${({ theme }) => theme.zIndex.overlay};
`;

/**
 * Styled div for the sidebar content area
 */
const SidebarContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Styled link component for navigation items
 */
const NavItem = styled(Link)<{ isActive: boolean; isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ theme, isCollapsed }) => 
    isCollapsed 
      ? `${theme.spacing.sm} ${theme.spacing.xs}` 
      : `${theme.spacing.sm} ${theme.spacing.md}`};
  text-decoration: none;
  color: ${({ theme, isActive }) => 
    isActive 
      ? theme.colors.text.primary 
      : theme.colors.text.secondary};
  background-color: ${({ theme, isActive }) => 
    isActive 
      ? theme.colors.background.tertiary 
      : 'transparent'};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  transition: background-color 0.2s ease, color 0.2s ease;
  font-weight: ${({ isActive, theme }) => 
    isActive ? theme.fonts.weight.medium : theme.fonts.weight.regular};
  
  &:hover {
    background-color: ${({ theme, isActive }) => 
      isActive 
        ? theme.colors.background.tertiary 
        : theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.text.accent};
    outline-offset: -2px;
  }
  
  ${({ isCollapsed }) => isCollapsed && `
    justify-content: center;
  `}
`;

/**
 * Styled div for navigation item icons
 */
const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing.xl};
  height: ${({ theme }) => theme.spacing.xl};
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Styled span for navigation item labels
 */
const NavLabel = styled.span<{ isCollapsed: boolean }>`
  font-size: ${({ theme }) => theme.fonts.size.md};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.3s ease, width 0.3s ease;
  
  ${({ isCollapsed }) => isCollapsed && `
    opacity: 0;
    width: 0;
    margin-left: 0;
  `}
`;

/**
 * A specialized sidebar component for the carrier portal that provides
 * navigation with carrier-specific styling and menu items
 */
const CarrierSidebar: React.FC<CarrierSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  
  // Function to determine if a navigation item is active
  const isActive = (path: string): boolean => {
    if (path === CARRIER_PORTAL_ROUTES.DASHBOARD) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <StyledSidebar isCollapsed={isCollapsed} onToggle={onToggle}>
      <SidebarContent>
        {NAVIGATION_ITEMS.map((item) => (
          <NavItem 
            key={item.id}
            to={item.path}
            isActive={isActive(item.path)}
            isCollapsed={isCollapsed}
            aria-label={isCollapsed ? item.label : undefined}
            aria-current={isActive(item.path) ? 'page' : undefined}
          >
            <NavIcon>
              {item.icon}
            </NavIcon>
            <NavLabel isCollapsed={isCollapsed}>
              {item.label}
            </NavLabel>
          </NavItem>
        ))}
      </SidebarContent>
    </StyledSidebar>
  );
};

export default CarrierSidebar;