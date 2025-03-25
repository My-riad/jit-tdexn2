import React, { useState, useRef, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate } from 'react-router-dom'; // version ^6.10.0
import { Header, HeaderProps, UserMenuItem } from '../../../../shared/components/layout/Header';
import { theme } from '../../../../shared/styles/theme';
import { mediaQueries } from '../../../../shared/styles/mediaQueries';
import { useAuthContext } from '../../../../common/contexts/AuthContext';
import { useNotificationContext } from '../../../../common/contexts/NotificationContext';
import logoImage from '../../../../shared/assets/images/logo.png';
import { SettingsIcon, ProfileIcon, LogoutIcon } from '../../../../shared/assets/icons';
import { CARRIER_PORTAL_ROUTES } from '../../../../common/constants/routes';

// Define the title for the carrier portal header
const CARRIER_TITLE = 'Freight Optimization';

// Define the props specific to the CarrierHeader component
interface CarrierHeaderProps {
  onMenuToggle: () => void;
  showMobileMenu: boolean;
}

// Styled component for the CarrierHeader to extend the base Header
const StyledHeader = styled(Header)`
  background-color: ${theme.colors.background.primary};
  box-shadow: ${theme.elevation.low};
  z-index: ${theme.zIndex.header};
  border-bottom: ${theme.borders.width.thin} solid ${theme.colors.border.light};
`;

// Styled component for the logo image
const Logo = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
`;

/**
 * A specialized header component for the carrier portal that provides navigation, branding, and user controls
 * @param {CarrierHeaderProps} props - Props for the CarrierHeader component
 * @returns {JSX.Element} Rendered header component with carrier-specific styling and functionality
 */
export const CarrierHeader: React.FC<CarrierHeaderProps> = ({ onMenuToggle, showMobileMenu }) => {
  // Get the navigate function from react-router-dom
  const navigate = useNavigate();

  // Get the logout function from the AuthContext
  const { logout } = useAuthContext();

  // Get the unread notification count and fetch function from the NotificationContext
  const { unreadCount, fetchUnreadCount } = useNotificationContext();

  // Implement the logout handler
  const handleLogout = async () => {
    try {
      // Call the logout function from the AuthContext
      await logout();

      // Navigate to the login page after successful logout
      navigate(CARRIER_PORTAL_ROUTES.LOGIN);
    } catch (error) {
      // Handle logout errors (e.g., display an error message)
      console.error('Logout failed:', error);
    }
  };

  // Fetch unread notification count on component mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Define the user menu items
  const userMenuItems: UserMenuItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <ProfileIcon />,
      path: CARRIER_PORTAL_ROUTES.PROFILE,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      path: CARRIER_PORTAL_ROUTES.SETTINGS,
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogoutIcon />,
      onClick: handleLogout,
    },
  ];

  // Render the Header component with carrier-specific props
  return (
    <StyledHeader
      logo={<Logo src={logoImage} alt="Freight Optimization Logo" />}
      title={CARRIER_TITLE}
      userMenu={userMenuItems}
      onMenuToggle={onMenuToggle}
      showMobileMenu={showMobileMenu}
      aria-label="Carrier Portal Header"
    />
  );
};

// IE3: Export the CarrierHeader component as the default export
export default CarrierHeader;