import React, { useState, useCallback, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate } from 'react-router-dom'; // version ^6.10.0
import { Header, HeaderProps } from '../../../shared/components/layout/Header';
import { theme } from '../../../shared/styles/theme';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import { useNotificationContext } from '../../../common/contexts/NotificationContext';
import { SHIPPER_PORTAL_ROUTES } from '../../../common/constants/routes';
import Button from '../../../shared/components/buttons/Button';
import { LogoutIcon, SettingsIcon, ProfileIcon, NotificationIcon } from '../../../shared/assets/icons';

// Define the URL for the shipper portal logo image
const SHIPPER_LOGO_URL = '/assets/images/shipper-logo.png';

// Define the props for the ShipperHeader component, extending the base HeaderProps
interface ShipperHeaderProps extends HeaderProps {
  onMenuToggle: () => void;
  showMobileMenu: boolean;
  className?: string;
}

// Styled component for the ShipperHeader, extending the base Header
const StyledHeader = styled(Header)`
  background-color: ${theme.colors.background.primary};
  border-bottom: 1px solid ${theme.colors.border.light};
  box-shadow: ${theme.elevation.low};

  /* Shipper-specific styling overrides for the header */
`;

// Styled component for the ShipperLogo
const ShipperLogo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  /* Logo styling with appropriate size and spacing */
`;

// Styled component for the LogoImage
const LogoImage = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
`;

// Styled component for the CreateLoadButton
const CreateLoadButton = styled(Button)`
  margin-right: ${theme.spacing.md};

  /* Shipper-specific styling for the create load button */
`;

/**
 * A specialized header component for the shipper portal that provides navigation, branding, and user controls
 */
const ShipperHeader: React.FC<ShipperHeaderProps> = ({
  onMenuToggle,
  showMobileMenu,
  className,
}) => {
  // Get the navigation function from react-router-dom
  const navigate = useNavigate();

  // Get the authentication context for user information and logout
  const { authState, logout } = useAuthContext();

  // Get the notification context for notification count
  const { unreadCount } = useNotificationContext();

  // State for user menu dropdown visibility
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  // Create a memoized array of user menu items
  const userMenuItems = useMemo(
    () => [
      {
        id: 'profile',
        label: 'Profile',
        icon: <ProfileIcon />,
        path: SHIPPER_PORTAL_ROUTES.PROFILE,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: <SettingsIcon />,
        path: SHIPPER_PORTAL_ROUTES.SETTINGS,
      },
      {
        id: 'logout',
        label: 'Logout',
        icon: <LogoutIcon />,
        onClick: async () => {
          try {
            await logout();
            navigate(SHIPPER_PORTAL_ROUTES.LOGIN);
          } catch (error) {
            console.error('Logout failed', error);
          }
        },
      },
    ],
    [logout, navigate]
  );

  // Implement handleLogout function to log the user out and navigate to login page
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate(SHIPPER_PORTAL_ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed', error);
    }
  }, [logout, navigate]);

  // Implement handleNavigate function to navigate to specific routes
  const handleNavigate = useCallback(
    (path: string) => () => {
      navigate(path);
    },
    [navigate]
  );

  // Create a memoized array of action buttons for the header
  const actionButtons = useMemo(
    () => [
      <CreateLoadButton key="create-load" variant="primary" onClick={handleNavigate(SHIPPER_PORTAL_ROUTES.CREATE_LOAD)}>
        Create Load
      </CreateLoadButton>,
    ],
    [handleNavigate]
  );

  // Render the base Header component with shipper-specific props
  return (
    <StyledHeader
      className={className}
      logo={
        <ShipperLogo>
          <LogoImage src={SHIPPER_LOGO_URL} alt="Shipper Portal Logo" />
        </ShipperLogo>
      }
      title="Shipper Portal"
      actions={actionButtons}
      userMenu={userMenuItems}
      onMenuToggle={onMenuToggle}
      showMobileMenu={showMobileMenu}
    />
  );
};

// Export the ShipperHeader component
export default ShipperHeader;