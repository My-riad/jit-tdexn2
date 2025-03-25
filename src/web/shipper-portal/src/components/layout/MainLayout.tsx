import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useMediaQuery } from '@mui/material'; // version ^5.11.0
import ShipperHeader from './Header';
import ShipperSidebar from './Sidebar';
import ShipperFooter from './Footer';
import Container from '../../../shared/components/layout/Container';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { useLoadingContext } from '../../../common/contexts/LoadingContext';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import { useNotificationContext } from '../../../common/contexts/NotificationContext';
import { theme } from '../../../shared/styles/theme';

/**
 * Interface defining the props for the MainLayout component
 */
interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Styled component for the main layout container
 */
const StyledLayout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${theme.colors.background.secondary};
`;

/**
 * Styled component for the content area that includes sidebar and main content
 */
const LayoutContent = styled.div`
  display: flex;
  flex: 1;
  position: relative;
`;

/**
 * Styled component for the sidebar container with transition effects
 */
const SidebarContainer = styled.div<{ isCollapsed: boolean; isMobileMenuOpen: boolean }>`
  width: ${props => props.isCollapsed ? theme.sizes.sidebarCollapsedWidth : theme.sizes.sidebarWidth};
  transition: width 0.3s ease;
  height: calc(100vh - ${theme.sizes.headerHeight} - ${theme.sizes.footerHeight});
  position: sticky;
  top: ${theme.sizes.headerHeight};
  z-index: ${theme.zIndex.sidebar};

  /* Media query for mobile: display: ${props => props.isMobileMenuOpen ? 'block' : 'none'}; */
  @media (max-width: 768px) {
    display: ${props => props.isMobileMenuOpen ? 'block' : 'none'};
  }
`;

/**
 * Styled component for the main content area
 */
const MainContent = styled.main<{ sidebarCollapsed: boolean }>`
  flex: 1;
  padding: ${theme.spacing.lg};
  transition: margin-left 0.3s ease;
  min-height: calc(100vh - ${theme.sizes.headerHeight} - ${theme.sizes.footerHeight});

  /* Media query for responsive padding */
  @media (max-width: 768px) {
    padding: ${theme.spacing.md};
  }
`;

/**
 * Styled component for the header container
 */
const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: ${theme.zIndex.header};
  height: ${theme.sizes.headerHeight};
`;

/**
 * Styled component for the footer container
 */
const FooterContainer = styled.div`
  height: ${theme.sizes.footerHeight};
`;

/**
 * Main layout component that provides the structure for all shipper portal pages
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  // Destructure children and className from props
  // Get loading state from useLoadingContext hook
  const { loading } = useLoadingContext();

  // Get authentication state from useAuthContext hook
  const { authState } = useAuthContext();

  // Get notification state from useNotificationContext hook
  const { notifications } = useNotificationContext();

  // Create state for sidebar collapsed status with useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Create state for mobile menu visibility with useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use useMediaQuery to detect mobile screen size
  const isMobile = useMediaQuery(theme.mediaQueries.down('md'));

  // Create useEffect to automatically collapse sidebar on mobile screens
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  /**
   * Create handleSidebarToggle function to toggle sidebar collapsed state
   */
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
    setIsMobileMenuOpen(false); // Close mobile menu when toggling sidebar
  }, []);

  /**
   * Create handleMobileMenuToggle function to toggle mobile menu visibility
   */
  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Return the layout structure with StyledLayout component
  return (
    <StyledLayout className={className}>
      {/* Render ShipperHeader with appropriate props */}
      <HeaderContainer>
        <ShipperHeader
          onMenuToggle={handleMobileMenuToggle}
          showMobileMenu={isMobileMenuOpen}
        />
      </HeaderContainer>

      <LayoutContent>
        {/* Render ShipperSidebar with appropriate props */}
        <SidebarContainer isCollapsed={sidebarCollapsed} isMobileMenuOpen={isMobileMenuOpen}>
          <ShipperSidebar isCollapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
        </SidebarContainer>

        {/* Render MainContent with Container for the children */}
        <MainContent sidebarCollapsed={sidebarCollapsed}>
          <Container>{children}</Container>
        </MainContent>
      </LayoutContent>

      {/* Render ShipperFooter at the bottom */}
      <FooterContainer>
        <ShipperFooter />
      </FooterContainer>

      {/* Conditionally render LoadingIndicator when loading is true */}
      {loading && <LoadingIndicator fullPage />}
    </StyledLayout>
  );
};

// IE3: Export the MainLayout component
export default MainLayout;