import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';
import { MenuIcon, NotificationIcon, ProfileIcon } from '../../assets/icons';

// Interface for user menu items
export interface UserMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

// Props for the Header component
export interface HeaderProps {
  logo: React.ReactNode;
  title: string;
  actions?: React.ReactNode[];
  userMenu?: UserMenuItem[];
  onMenuToggle?: () => void;
  showMobileMenu?: boolean;
  className?: string;
}

// Default empty array for user menu items
const DEFAULT_USER_MENU: UserMenuItem[] = [];

// Styled header container component
const HeaderContainer = styled.header`
  height: ${({ theme }) => theme.sizes.headerHeight};
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.primary};
  box-shadow: ${({ theme }) => theme.elevation.low};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  border-bottom: ${({ theme }) => theme.borders.width.thin} solid ${({ theme }) => theme.colors.border.light};
  
  ${mediaQueries.down('md')} {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`;

// Styled section for logo and title
const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

// Styled image for the logo
const LogoImage = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
`;

// Styled heading for the title
const Title = styled.h1`
  font-size: ${({ theme }) => theme.fonts.size.lg};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  display: none;
  
  ${mediaQueries.up('md')} {
    display: block;
  }
`;

// Styled section for header actions
const ActionsSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  
  ${mediaQueries.down('md')} {
    display: none;
  }
`;

// Styled section for user-related controls
const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

// Styled button for notifications
const NotificationButton = styled(IconButton)`
  position: relative;
`;

// Styled badge for notification count
const NotificationBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: ${({ theme }) => theme.colors.semantic.error};
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
`;

// Styled button for user menu
const UserMenuButton = styled(IconButton)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Styled dropdown for user menu
const UserMenuDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border: ${({ theme }) => theme.borders.width.thin} solid ${({ theme }) => theme.colors.border.light};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  box-shadow: ${({ theme }) => theme.elevation.medium};
  min-width: 200px;
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

// Styled menu item for user dropdown
const UserMenuItem = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
  
  &:first-child {
    border-top-left-radius: ${({ theme }) => theme.borders.radius.md};
    border-top-right-radius: ${({ theme }) => theme.borders.radius.md};
  }
  
  &:last-child {
    border-bottom-left-radius: ${({ theme }) => theme.borders.radius.md};
    border-bottom-right-radius: ${({ theme }) => theme.borders.radius.md};
  }
`;

// Styled link for user menu items
const UserMenuItemLink = styled(Link)`
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

// Styled button for user menu items with onClick
const UserMenuItemButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  text-align: left;
`;

// Styled button for mobile menu toggle
const MobileMenuButton = styled(IconButton)`
  display: none;
  
  ${mediaQueries.down('md')} {
    display: flex;
  }
`;

/**
 * A reusable header component that provides navigation, branding, and user controls
 * across the AI-driven Freight Optimization Platform.
 */
const Header: React.FC<HeaderProps> = ({
  logo,
  title,
  actions = [],
  userMenu = DEFAULT_USER_MENU,
  onMenuToggle,
  showMobileMenu = false,
  className,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Toggle user menu dropdown
  const toggleUserMenu = () => {
    setUserMenuOpen(prev => !prev);
  };

  // Handle click outside to close the user menu
  const handleClickOutside = (event: MouseEvent) => {
    if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
      setUserMenuOpen(false);
    }
  };

  // Set up effect for click outside detection
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <HeaderContainer className={className}>
      <LogoSection>
        {typeof logo === 'string' ? <LogoImage src={logo} alt={`${title} logo`} /> : logo}
        <Title>{title}</Title>
      </LogoSection>

      {actions.length > 0 && (
        <ActionsSection>
          {actions.map((action, index) => (
            <div key={`action-${index}`}>{action}</div>
          ))}
        </ActionsSection>
      )}

      <UserSection>
        <NotificationButton
          variant="ghost"
          ariaLabel="View notifications"
        >
          <NotificationIcon />
          <NotificationBadge>3</NotificationBadge>
        </NotificationButton>

        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <UserMenuButton
            variant="ghost"
            ariaLabel="User menu"
            onClick={toggleUserMenu}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <ProfileIcon />
          </UserMenuButton>

          {userMenu.length > 0 && (
            <UserMenuDropdown 
              isOpen={userMenuOpen} 
              role="menu" 
              aria-orientation="vertical"
            >
              {userMenu.map(item => (
                <UserMenuItem key={item.id} role="menuitem">
                  {item.path ? (
                    <UserMenuItemLink to={item.path}>
                      {item.icon}
                      {item.label}
                    </UserMenuItemLink>
                  ) : (
                    <UserMenuItemButton onClick={item.onClick}>
                      {item.icon}
                      {item.label}
                    </UserMenuItemButton>
                  )}
                </UserMenuItem>
              ))}
            </UserMenuDropdown>
          )}
        </div>

        {onMenuToggle && (
          <MobileMenuButton 
            variant="ghost" 
            ariaLabel={showMobileMenu ? "Close menu" : "Open menu"} 
            onClick={onMenuToggle}
          >
            <MenuIcon />
          </MobileMenuButton>
        )}
      </UserSection>
    </HeaderContainer>
  );
};

export default Header;