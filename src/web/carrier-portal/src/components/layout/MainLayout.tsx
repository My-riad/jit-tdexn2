import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate, useLocation, Outlet } from 'react-router-dom'; // version ^6.8.0

import CarrierHeader from './Header';
import CarrierSidebar from './Sidebar';
import CarrierFooter from './Footer';
import Container from '../../../../shared/components/layout/Container';
import FlexBox from '../../../../shared/components/layout/FlexBox';
import LoadingIndicator from '../../../../shared/components/feedback/LoadingIndicator';
import { useAuthContext } from '../../../../common/contexts/AuthContext';
import { useLoadingContext } from '../../../../common/contexts/LoadingContext';
import { theme } from '../../../../shared/styles/theme';
import { mediaQueries } from '../../../../shared/styles/mediaQueries';

// Define the width values for the sidebar in expanded and collapsed states
const SIDEBAR_WIDTH = {
  expanded: '240px',
  collapsed: '64px',
};

// Styled component for the main layout container
const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; // Ensure it fills the viewport
  background-color: ${theme.colors.background.primary};
  position: relative; // For absolute positioning of loading indicator
`;

// Styled component for the content wrapper with responsive padding
const ContentWrapper = styled(FlexBox)<{ isSidebarCollapsed: boolean }>`
  flex: 1; // Fill available space
  transition: padding-left 0.3s ease; // Smooth transition for sidebar collapse/expand
  padding-left: ${props => props.isSidebarCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded}; // Adjust padding based on sidebar state

  ${mediaQueries.down('md')} {
    padding-left: 0; // Remove padding on smaller screens
  }
`;

// Styled component for the main content area
const MainContent = styled(Container)`
  flex: 1; // Fill available space
  padding: ${theme.spacing.md};
  max-width: 100%; // Prevent overflow
  box-sizing: border-box;
  overflow-x: hidden; // Prevent horizontal scrolling
`;

// Styled component for the sidebar wrapper with responsive behavior
const SidebarWrapper = styled.div<{ isCollapsed: boolean; isMobileMenuOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  z-index: ${theme.zIndex.overlay};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform: translateX(${props => props.isMobileMenuOpen ? '0' : '-100%'});
  box-shadow: ${theme.elevation.medium};

  ${mediaQueries.up('lg')} {
    transform: translateX(0); // Always show on larger screens
    box-shadow: none; // Remove shadow on larger screens
  }
`;

/**
 * Main layout component for the carrier portal that provides a consistent page structure
 * @returns {JSX.Element} Rendered layout component with header, sidebar, content, and footer
 */
export const MainLayout: React.FC = () => {
  // Initialize state for sidebar collapsed status
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initialize state for mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get authentication state from useAuthContext hook
  const { authState, isAuthenticated } = useAuthContext();

  // Get loading state from useLoadingContext hook
  const { loading } = useLoadingContext();

  // Get current location using useLocation hook
  const location = useLocation();

  // Get navigate function from useNavigate hook
  const navigate = useNavigate();

  // Create toggleSidebar function to toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // Create toggleMobileMenu function to toggle mobile menu visibility
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Implement useEffect to close mobile menu on location change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Implement useEffect to redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated() && !authState.loading) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, authState.loading]);

  // Render LoadingIndicator when loading state is true
  if (loading || authState.loading) {
    return <LoadingIndicator fullPage />;
  }

  // Render LayoutContainer component as the main wrapper
  return (
    <LayoutContainer>
      {/* Render CarrierHeader with mobile menu toggle props */}
      <CarrierHeader onMenuToggle={toggleMobileMenu} showMobileMenu={isMobileMenuOpen} />

      <FlexBox flex="1">
        {/* Render SidebarWrapper with collapsed state and toggle function */}
        <SidebarWrapper isCollapsed={isSidebarCollapsed} isMobileMenuOpen={isMobileMenuOpen}>
          <CarrierSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        </SidebarWrapper>

        {/* Render ContentWrapper with appropriate padding based on sidebar state */}
        <ContentWrapper flex="1" isSidebarCollapsed={isSidebarCollapsed}>
          {/* Render MainContent component with the Outlet for nested routes */}
          <MainContent>
            <Outlet />
          </MainContent>
        </ContentWrapper>
      </FlexBox>

      {/* Render CarrierFooter at the bottom of the layout */}
      <CarrierFooter />
    </LayoutContainer>
  );
};

// IE3: Export the MainLayout component as the default export
export default MainLayout;