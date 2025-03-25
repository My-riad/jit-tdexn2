import React, { useState, useEffect, useRef } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'; // version ^6.10.0
import { useMediaQuery } from 'react-responsive'; // version ^9.0.2

import Container from '../layout/Container';
import Button from '../buttons/Button';
import Link from '../typography/Link';
import LogoImage from '../../assets/images/logo.png';
import MenuIcon from '../../assets/icons/menu.svg';
import ProfileIcon from '../../assets/icons/profile.svg';
import NotificationIcon from '../../assets/icons/notification.svg';
import { ThemeType } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import { transition } from '../../styles/mixins';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import { useThemeContext } from '../../../common/contexts/ThemeContext';

/**
 * Breakpoint for switching between desktop and mobile layouts
 */
const MOBILE_BREAKPOINT = '768px';

/**
 * TypeScript interface for NavBar component props
 */
export interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
  navItems: NavItem[];
  logoUrl: string;
  siteName: string;
  onLogoClick?: () => void;
  className?: string;
}

/**
 * TypeScript interface for navigation items
 */
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
  roles: string[];
}

/**
 * Styled header component for the navigation bar container
 */
const NavBarContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: ${props => props.theme.sizes.headerHeight};
  background-color: ${props => props.theme.colors.background.primary};
  box-shadow: ${props => props.theme.elevation.low};
  z-index: ${props => props.theme.zIndex.dropdown};
`;

/**
 * Styled div for the navigation bar content
 */
const NavBarContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 ${props => props.theme.spacing.md};
  height: 100%;
`;

/**
 * Styled div for the logo and site name
 */
const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  cursor: pointer;
`;

/**
 * Styled image for the logo
 */
const Logo = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
`;

/**
 * Styled heading for the site name
 */
const SiteName = styled.h1`
  font-size: ${props => props.theme.fonts.size.h5};
  font-weight: ${props => props.theme.fonts.weight.bold};
  margin-left: ${props => props.theme.spacing.sm};
  ${mediaQueries.down('md')} {
    display: none;
  }
`;

/**
 * Styled nav element for the navigation links
 */
const NavSection = styled.nav`
  display: flex;
  align-items: center;
  ${mediaQueries.down('md')} {
    display: none;
  }
`;

/**
 * Styled unordered list for navigation items
 */
const NavList = styled.ul`
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: ${props => props.theme.spacing.md};
`;

/**
 * Styled list item for navigation items
 */
const NavItem = styled.li`
  list-style: none;
  padding: ${props => props.theme.spacing.xs};
`;

/**
 * Styled link for navigation items
 */
interface NavLinkProps {
  isActive: boolean;
}

const NavLink = styled(RouterLink)<NavLinkProps>`
  font-family: ${props => props.theme.fonts.family.primary};
  font-size: ${props => props.theme.fonts.size.md};
  font-weight: ${props => props.theme.fonts.weight.medium};
  color: ${props => props.theme.colors.text.primary};
  text-decoration: none;
  padding: ${props => props.theme.spacing.xs};

  &:hover,
  &:focus {
    text-decoration: underline;
    color: ${props => props.theme.colors.text.accent};
  }

  &.active {
    color: ${props => props.theme.colors.text.accent};
    text-decoration: underline;
  }
  ${transition}
`;

/**
 * Styled div for user-related controls
 */
const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

/**
 * Styled button for icon-only actions
 */
const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: ${props => props.theme.spacing.xs};
  cursor: pointer;
  ${transition}

  &:hover,
  &:focus {
    opacity: 0.8;
  }
`;

/**
 * Styled span for notification count badge
 */
const NotificationBadge = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.semantic.error};
  color: ${props => props.theme.colors.text.inverted};
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Styled div for the user dropdown menu
 */
interface UserMenuContainerProps {
  isOpen: boolean;
}

const UserMenuContainer = styled.div<UserMenuContainerProps>`
  position: absolute;
  top: ${props => props.theme.sizes.headerHeight};
  right: 0;
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.medium};
  border-radius: ${props => props.theme.borders.radius.md};
  box-shadow: ${props => props.theme.elevation.medium};
  z-index: ${props => props.theme.zIndex.dropdown};
  display: ${props => (props.isOpen ? 'block' : 'none')};
  min-width: 200px;
`;

/**
 * Styled button for user menu items
 */
const UserMenuItem = styled.button`
  width: 100%;
  text-align: left;
  padding: ${props => props.theme.spacing.sm};
  border: none;
  background: transparent;
  cursor: pointer;
  ${transition}

  &:hover,
  &:focus {
    background-color: ${props => props.theme.colors.background.secondary};
  }
`;

/**
 * Styled button for mobile menu toggle
 */
const MobileMenuButton = styled(IconButton)`
  display: flex;
  ${mediaQueries.up('md')} {
    display: none;
  }
`;

/**
 * Styled div for mobile navigation menu
 */
interface MobileMenuProps {
  isOpen: boolean;
}

const MobileMenu = styled.div<MobileMenuProps>`
  position: fixed;
  top: ${props => props.theme.sizes.headerHeight};
  left: 0;
  width: 100%;
  background-color: ${props => props.theme.colors.background.primary};
  z-index: ${props => props.theme.zIndex.overlay};
  display: ${props => (props.isOpen ? 'block' : 'none')};
  max-height: calc(100vh - ${props => props.theme.sizes.headerHeight});
  overflow-y: auto;
  box-shadow: ${props => props.theme.elevation.medium};
  ${transition}
`;

/**
 * Styled unordered list for mobile navigation
 */
const MobileNavList = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  padding: ${props => props.theme.spacing.md};
`;

/**
 * Styled list item for mobile navigation
 */
const MobileNavItem = styled.li`
  list-style: none;
  padding: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

/**
 * Styled link for mobile navigation
 */
const MobileNavLink = styled(RouterLink)<NavLinkProps>`
  display: block;
  padding: ${props => props.theme.spacing.sm};
  font-family: ${props => props.theme.fonts.family.primary};
  font-size: ${props => props.theme.fonts.size.lg};
  font-weight: ${props => props.theme.fonts.weight.medium};
  color: ${props => props.theme.colors.text.primary};
  text-decoration: none;

  &.active {
    color: ${props => props.theme.colors.text.accent};
    text-decoration: underline;
  }
`;

/**
 * A responsive navigation bar component that provides consistent navigation across the application
 */
const NavBar: React.FC<NavBarProps> = (props) => {
  // Destructure props including navItems, logoUrl, onLogoClick, className, and other HTML header attributes
  const { navItems, logoUrl, siteName, onLogoClick, className, ...rest } = props;

  // Get authentication state and functions from useAuthContext
  const { authState, logout } = useAuthContext();

  // Get theme state and functions from useThemeContext
  const { theme, toggleTheme } = useThemeContext();

  // Use useLocation to get current location for active link detection
  const location = useLocation();

  // Use useNavigate for programmatic navigation
  const navigate = useNavigate();

  // Use useMediaQuery to detect mobile viewport for responsive layout
  const isMobile = useMediaQuery({ maxWidth: MOBILE_BREAKPOINT });

  // Set up state for mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Set up state for user dropdown menu visibility
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Create a ref for the user dropdown menu for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);

  /**
   * Handle logo click with navigation or custom handler
   */
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate('/');
    }
  };

  /**
   * Handle mobile menu toggle
   */
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Handle user menu toggle
   */
  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  /**
   * Handle theme toggle
   */
  const handleThemeToggle = () => {
    toggleTheme();
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // Set up effect for click outside detection to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <NavBarContainer className={className} {...rest}>
      <Container fullWidth>
        <NavBarContent>
          <LogoSection onClick={handleLogoClick}>
            <Logo src={LogoImage} alt="Freight Optimization Platform Logo" />
            <SiteName>{siteName}</SiteName>
          </LogoSection>
          <NavSection>
            <NavList>
              {navItems.map((item) => (
                <NavItem key={item.id}>
                  <NavLink
                    to={item.path}
                    className={location.pathname === item.path ? 'active' : ''}
                  >
                    {item.label}
                  </NavLink>
                </NavItem>
              ))}
            </NavList>
          </NavSection>
          <UserSection>
            <IconButton aria-label="Notifications">
              <NotificationIcon />
              <NotificationBadge>3</NotificationBadge>
            </IconButton>
            <IconButton aria-label="Toggle Theme" onClick={handleThemeToggle}>
              {theme.mode === 'light' ? '🌙' : '☀️'}
            </IconButton>
            <IconButton aria-label="User Menu" onClick={handleUserMenuToggle}>
              <ProfileIcon />
            </IconButton>
            <UserMenuContainer isOpen={isUserMenuOpen} ref={userMenuRef}>
              <UserMenuItem onClick={handleLogout}>Logout</UserMenuItem>
            </UserMenuContainer>
          </UserSection>
          <MobileMenuButton aria-label="Open Menu" onClick={handleMobileMenuToggle}>
            <MenuIcon />
          </MobileMenuButton>
        </NavBarContent>
      </Container>
      {isMobile && (
        <MobileMenu isOpen={isMobileMenuOpen}>
          <MobileNavList>
            {navItems.map((item) => (
              <MobileNavItem key={item.id}>
                <MobileNavLink
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </MobileNavLink>
              </MobileNavItem>
            ))}
            <MobileNavItem>
              <Button variant="secondary" fullWidth onClick={handleLogout}>
                Logout
              </Button>
            </MobileNavItem>
          </MobileNavList>
        </MobileMenu>
      )}
    </NavBarContainer>
  );
};

export default NavBar;