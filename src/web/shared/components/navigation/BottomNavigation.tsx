import React from 'react';
import styled from 'styled-components';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../styles/theme';
import Text from '../typography/Text';

/**
 * Interface defining the structure of a navigation item
 */
export interface BottomNavigationItem {
  /** Unique identifier for the item */
  id: string;
  /** Text label to display */
  label: string;
  /** Navigation path or route */
  path: string;
  /** Icon component to display */
  icon: React.ReactNode;
  /** Whether the item is disabled */
  disabled?: boolean;
}

/**
 * Props for the BottomNavigation component
 */
export interface BottomNavigationProps {
  /** Array of navigation items to display */
  items: BottomNavigationItem[];
  /** ID of the currently active navigation item */
  activeItemId: string;
  /** Callback function when a navigation item is clicked */
  onItemClick: (id: string) => void;
  /** Whether to show text labels below icons, defaults to true */
  showLabels?: boolean;
}

/**
 * Container for the bottom navigation bar
 */
const Container = styled(View)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: ${({ theme }) => theme.colors.background.primary};
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.border.light};
  elevation: ${({ theme }) => theme.elevation.medium};
  z-index: ${({ theme }) => theme.zIndex.navigation};
`;

/**
 * Individual navigation item container
 */
const NavItem = styled(TouchableOpacity)<{ active: boolean; disabled?: boolean }>`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs};
  opacity: ${({ disabled, theme }) => (disabled ? theme.opacity.disabled : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  color: ${({ active, theme }) =>
    active ? theme.colors.text.accent : theme.colors.text.secondary};
`;

/**
 * Container for the navigation item icon
 */
const IconContainer = styled(View)<{ showLabel?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ showLabel, theme }) => (showLabel ? theme.spacing.xxs : 0)};
  height: 24px;
  width: 24px;
`;

/**
 * Text label for the navigation item
 */
const Label = styled(Text)<{ active: boolean }>`
  font-size: ${({ theme }) => theme.fonts.size.xs};
  font-weight: ${({ active, theme }) =>
    active ? theme.fonts.weight.medium : theme.fonts.weight.regular};
  color: ${({ active, theme }) =>
    active ? theme.colors.text.accent : theme.colors.text.secondary};
  text-align: center;
  margin-top: 2px;
`;

/**
 * A mobile-friendly bottom navigation component.
 * Provides a fixed navigation bar at the bottom of the screen with icons and optional labels.
 */
const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeItemId,
  onItemClick,
  showLabels = true,
}) => {
  const theme = useTheme();

  return (
    <Container>
      {items.map((item) => {
        const isActive = item.id === activeItemId;
        return (
          <NavItem
            key={item.id}
            active={isActive}
            disabled={item.disabled}
            onPress={() => onItemClick(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled: !!item.disabled }}
            accessibilityLabel={item.label}
          >
            <IconContainer showLabel={showLabels}>
              {React.cloneElement(item.icon as React.ReactElement, {
                color: isActive ? theme.colors.text.accent : theme.colors.text.secondary,
                size: 24,
              })}
            </IconContainer>
            {showLabels && (
              <Label
                active={isActive}
                variant="caption"
                noMargin
                accessibilityLiveRegion="polite"
              >
                {item.label}
              </Label>
            )}
          </NavItem>
        );
      })}
    </Container>
  );
};

export default BottomNavigation;