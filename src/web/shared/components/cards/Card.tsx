import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

/**
 * Enum defining different card style variants
 */
export enum CardVariant {
  DEFAULT = 'default',
  OUTLINED = 'outlined',
  FLAT = 'flat'
}

// Default values for card props
const DEFAULT_ELEVATION = 'medium';
const DEFAULT_PADDING = 'md';
const DEFAULT_VARIANT = CardVariant.DEFAULT;

/**
 * Props interface for the Card component
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Sets the elevation level of the card, affecting its shadow
   * Values: 'none', 'low', 'medium', 'high', 'highest'
   */
  elevation?: keyof typeof theme.elevation;
  
  /**
   * Sets the visual style variant of the card
   * DEFAULT: Standard card with background and shadow
   * OUTLINED: Card with border and no shadow
   * FLAT: Card with no background, border, or shadow
   */
  variant?: CardVariant;
  
  /**
   * Sets the internal padding of the card
   * Can use theme spacing values ('xs', 'sm', 'md', etc.) or custom values
   */
  padding?: keyof typeof theme.spacing | string;
  
  /**
   * Callback function when card is clicked
   * Makes the card interactive with hover and focus states
   */
  onClick?: () => void;
  
  /**
   * Card content
   */
  children?: React.ReactNode;
  
  /**
   * Additional class name for custom styling
   */
  className?: string;
}

/**
 * Styled component that implements the card's visual appearance
 */
const StyledCard = styled.div<{
  elevation?: keyof typeof theme.elevation;
  variant?: CardVariant;
  padding?: string | keyof typeof theme.spacing;
  onClick?: () => void;
}>`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${({ variant, theme }) => 
    variant === CardVariant.FLAT 
      ? 'transparent' 
      : theme.colors.card.background};
  
  border: ${({ variant, theme }) => 
    variant === CardVariant.OUTLINED 
      ? `${theme.borders.width.thin} ${theme.borders.style.solid} ${theme.colors.card.border}` 
      : 'none'};
  
  border-radius: ${({ theme }) => theme.borders.radius.md};
  
  box-shadow: ${({ elevation, variant, theme }) => 
    variant === CardVariant.FLAT || variant === CardVariant.OUTLINED
      ? 'none'
      : theme.elevation[elevation || DEFAULT_ELEVATION]};
  
  padding: ${({ padding, theme }) => {
    if (padding && theme.spacing[padding as keyof typeof theme.spacing]) {
      return theme.spacing[padding as keyof typeof theme.spacing];
    }
    return padding || theme.spacing[DEFAULT_PADDING];
  }};
  
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  
  cursor: ${({ onClick }) => onClick ? 'pointer' : 'default'};
  
  /* Interactive states for DEFAULT variant */
  ${({ onClick, theme, variant }) => onClick && variant !== CardVariant.FLAT && variant !== CardVariant.OUTLINED && `
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.elevation.high};
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: ${theme.elevation.medium};
    }
    
    &:focus-visible {
      outline: 2px solid ${theme.colors.text.accent};
      outline-offset: 2px;
    }
  `}
  
  /* Interactive states for OUTLINED variant */
  ${({ onClick, theme, variant }) => onClick && variant === CardVariant.OUTLINED && `
    &:hover {
      background-color: ${theme.colors.background.secondary};
    }
    
    &:active {
      background-color: ${theme.colors.background.tertiary};
    }
    
    &:focus-visible {
      outline: 2px solid ${theme.colors.text.accent};
      outline-offset: 2px;
    }
  `}
  
  /* Interactive states for FLAT variant */
  ${({ onClick, theme, variant }) => onClick && variant === CardVariant.FLAT && `
    &:hover {
      background-color: ${theme.colors.background.tertiary};
    }
    
    &:active {
      background-color: ${theme.colors.background.secondary};
    }
    
    &:focus-visible {
      outline: 2px solid ${theme.colors.text.accent};
      outline-offset: 2px;
    }
  `}
`;

/**
 * Card component that provides consistent styling and behavior for contained information units
 * Can be customized with different elevations, variants, and padding
 * Interactive states are automatically applied when onClick is provided
 * 
 * @example
 * // Basic card
 * <Card>Content</Card>
 * 
 * @example
 * // Interactive card with custom elevation and padding
 * <Card 
 *   elevation="high" 
 *   padding="lg" 
 *   onClick={() => console.log('Card clicked')}
 * >
 *   Interactive Content
 * </Card>
 * 
 * @example
 * // Outlined variant
 * <Card variant={CardVariant.OUTLINED}>Outlined Card</Card>
 */
export const Card: React.FC<CardProps> = React.memo(({
  children,
  className,
  elevation = DEFAULT_ELEVATION,
  variant = DEFAULT_VARIANT,
  padding = DEFAULT_PADDING,
  onClick,
  ...props
}) => {
  // Determine if card is interactive
  const isInteractive = !!onClick;

  // Handle keyboard navigation if card is interactive
  const handleKeyDown = isInteractive 
    ? (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return (
    <StyledCard
      className={className}
      elevation={elevation}
      variant={variant}
      padding={padding}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-disabled={props['aria-disabled']}
      {...props}
    >
      {children}
    </StyledCard>
  );
});

// Set display name for debugging
Card.displayName = 'Card';

export default Card;