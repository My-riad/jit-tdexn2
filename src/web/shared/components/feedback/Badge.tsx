import React from 'react';
import styled from 'styled-components';
import { lightTheme, ThemeType } from '../../styles/theme';
import Text from '../typography/Text';

// Default maximum value for count badges before adding "+"
const DEFAULT_MAX = 99;

// Helper function to get the appropriate styles based on variant
const getBadgeStyles = (variant: BadgeContainerProps['variant'], theme: ThemeType) => {
  switch (variant) {
    case 'primary':
      return `
        background-color: ${theme.colors.button.primary.background};
        color: ${theme.colors.text.inverted};
      `;
    case 'secondary':
      return `
        background-color: ${theme.colors.background.secondary};
        color: ${theme.colors.text.primary};
      `;
    case 'success':
      return `
        background-color: ${theme.colors.semantic.success};
        color: ${theme.colors.text.inverted};
      `;
    case 'warning':
      return `
        background-color: ${theme.colors.semantic.warning};
        color: ${theme.colors.text.primary};
      `;
    case 'error':
      return `
        background-color: ${theme.colors.semantic.error};
        color: ${theme.colors.text.inverted};
      `;
    case 'info':
      return `
        background-color: ${theme.colors.semantic.info};
        color: ${theme.colors.text.inverted};
      `;
    default:
      return `
        background-color: ${theme.colors.button.primary.background};
        color: ${theme.colors.text.inverted};
      `;
  }
};

// Helper function to get the appropriate styles based on size
const getBadgeSizeStyles = (size: BadgeContainerProps['size'], theme: ThemeType) => {
  switch (size) {
    case 'small':
      return `
        padding: ${theme.spacing.xxs} ${theme.spacing.xs};
        min-width: 20px;
        height: 20px;
        font-size: ${theme.fonts.size.xs};
      `;
    case 'large':
      return `
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        min-width: 28px;
        height: 28px;
        font-size: ${theme.fonts.size.md};
      `;
    case 'medium':
    default:
      return `
        padding: ${theme.spacing.xxs} ${theme.spacing.xs};
        min-width: 24px;
        height: 24px;
        font-size: ${theme.fonts.size.sm};
      `;
  }
};

// Props for the styled badge container
interface BadgeContainerProps {
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size: 'small' | 'medium' | 'large';
}

// The styled component for the badge container
const BadgeContainer = styled.div<BadgeContainerProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borders.radius.round};
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
  white-space: nowrap;
  text-align: center;
  transition: all 0.2s ease;
  font-family: ${({ theme }) => theme.fonts.family.primary};
  
  ${({ variant, theme }) => getBadgeStyles(variant, theme)}
  ${({ size, theme }) => getBadgeSizeStyles(size, theme)}
`;

// Props for the Badge component
interface BadgeProps {
  /**
   * Visual style variant of the badge
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  
  /**
   * Size of the badge
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Text or React node to display inside the badge
   */
  content?: string | React.ReactNode;
  
  /**
   * Numerical value to display inside the badge
   */
  count?: number;
  
  /**
   * Maximum value to show before adding a "+" suffix
   * @default 99
   */
  max?: number;
  
  /**
   * Additional CSS class for the badge
   */
  className?: string;
}

/**
 * Badge component for displaying status indicators, counts, or short labels
 */
const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'medium',
  content,
  count,
  max = DEFAULT_MAX,
  className,
  ...rest
}) => {
  // Determine what content to display
  let badgeContent: React.ReactNode;
  
  if (count !== undefined) {
    // If count is provided, format it with respect to max
    badgeContent = count > max ? `${max}+` : count;
  } else {
    // Otherwise use the provided content
    badgeContent = content;
  }
  
  return (
    <BadgeContainer
      variant={variant}
      size={size}
      className={className}
      role="status"
      aria-label={typeof badgeContent === 'string' ? badgeContent : 'notification'}
      {...rest}
    >
      {badgeContent}
    </BadgeContainer>
  );
};

export type { BadgeProps };
export default Badge;