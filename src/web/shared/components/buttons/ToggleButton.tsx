import React from 'react'; // version ^18.2.0
import styled, { css } from 'styled-components'; // version ^5.3.6
import { theme } from '../../styles/theme';
import { buttonBase, focusOutline } from '../../styles/mixins';

/**
 * Available toggle button visual variants
 */
type ToggleButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'text';

/**
 * Available toggle button sizes
 */
type ToggleButtonSize = 'small' | 'medium' | 'large';

/**
 * Default values for button props
 */
const DEFAULT_VARIANT: ToggleButtonVariant = 'primary';
const DEFAULT_SIZE: ToggleButtonSize = 'medium';

/**
 * Props for the ToggleButton component
 */
export interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Controls the active/inactive state of the button */
  isActive: boolean;
  /** Visual style variant of the button */
  variant?: ToggleButtonVariant;
  /** Size variant of the button */
  size?: ToggleButtonSize;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback function when toggle state changes */
  onChange?: (isActive: boolean) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Generates the appropriate CSS for each button variant in both active and inactive states
 */
const getVariantStyles = (variant: ToggleButtonVariant, isActive: boolean) => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: ${isActive ? theme.colors.button.primary.background : theme.colors.button.tertiary.background};
        color: ${isActive ? theme.colors.button.primary.text : theme.colors.button.tertiary.text};
        border: ${theme.borders.width.thin} solid ${isActive ? theme.colors.button.primary.border : 'transparent'};
        
        &:hover:not(:disabled) {
          background-color: ${isActive ? theme.colors.button.primary.hoverBackground : theme.colors.button.tertiary.hoverBackground};
        }
        
        &:active:not(:disabled) {
          background-color: ${isActive ? theme.colors.button.primary.activeBackground : theme.colors.button.tertiary.activeBackground};
        }
      `;
    case 'secondary':
      return css`
        background-color: ${isActive ? theme.colors.button.secondary.background : 'transparent'};
        color: ${theme.colors.button.secondary.text};
        border: ${theme.borders.width.thin} solid ${theme.colors.button.secondary.border};
        
        &:hover:not(:disabled) {
          background-color: ${isActive ? theme.colors.button.secondary.hoverBackground : theme.colors.background.tertiary};
        }
        
        &:active:not(:disabled) {
          background-color: ${isActive ? theme.colors.button.secondary.activeBackground : theme.colors.background.tertiary};
        }
      `;
    case 'tertiary':
      return css`
        background-color: ${isActive ? theme.colors.button.tertiary.background : 'transparent'};
        color: ${theme.colors.button.tertiary.text};
        border: ${theme.borders.width.thin} solid ${isActive ? theme.colors.button.tertiary.border : 'transparent'};
        
        &:hover:not(:disabled) {
          background-color: ${isActive ? theme.colors.button.tertiary.hoverBackground : theme.colors.background.tertiary};
        }
        
        &:active:not(:disabled) {
          background-color: ${isActive ? theme.colors.button.tertiary.activeBackground : theme.colors.background.tertiary};
        }
      `;
    case 'outline':
      return css`
        background-color: transparent;
        color: ${isActive ? theme.colors.button.primary.text : theme.colors.button.tertiary.text};
        border: ${theme.borders.width.thin} solid ${isActive ? theme.colors.button.primary.border : theme.colors.button.tertiary.border};
        
        &:hover:not(:disabled) {
          background-color: ${isActive ? theme.colors.background.accent : theme.colors.background.tertiary};
        }
        
        &:active:not(:disabled) {
          background-color: ${isActive ? theme.colors.background.accent : theme.colors.background.tertiary};
        }
      `;
    case 'text':
      return css`
        background-color: transparent;
        color: ${isActive ? theme.colors.button.primary.text : theme.colors.button.tertiary.text};
        border: none;
        padding-left: ${theme.spacing.sm};
        padding-right: ${theme.spacing.sm};
        
        &:hover:not(:disabled) {
          background-color: ${isActive ? theme.colors.background.accent : theme.colors.background.tertiary};
        }
        
        &:active:not(:disabled) {
          background-color: ${isActive ? theme.colors.background.accent : theme.colors.background.tertiary};
        }
      `;
    default:
      return css`
        background-color: ${isActive ? theme.colors.button.primary.background : theme.colors.button.tertiary.background};
        color: ${isActive ? theme.colors.button.primary.text : theme.colors.button.tertiary.text};
        border: ${theme.borders.width.thin} solid ${isActive ? theme.colors.button.primary.border : 'transparent'};
        
        &:hover:not(:disabled) {
          background-color: ${isActive ? theme.colors.button.primary.hoverBackground : theme.colors.button.tertiary.hoverBackground};
        }
        
        &:active:not(:disabled) {
          background-color: ${isActive ? theme.colors.button.primary.activeBackground : theme.colors.button.tertiary.activeBackground};
        }
      `;
  }
};

/**
 * Generates the appropriate CSS for each button size
 */
const getSizeStyles = (size: ToggleButtonSize) => {
  switch (size) {
    case 'small':
      return css`
        padding: ${theme.spacing.xxs} ${theme.spacing.xs};
        font-size: ${theme.fonts.size.sm};
        height: 32px;
        min-width: 64px;
      `;
    case 'medium':
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.md};
        font-size: ${theme.fonts.size.md};
        height: 40px;
        min-width: 80px;
      `;
    case 'large':
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.lg};
        font-size: ${theme.fonts.size.lg};
        height: 48px;
        min-width: 96px;
      `;
    default:
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.md};
        font-size: ${theme.fonts.size.md};
        height: 40px;
        min-width: 80px;
      `;
  }
};

/**
 * Styled button component with active/inactive state styling
 */
const StyledToggleButton = styled.button<{
  isActive: boolean;
  variant: ToggleButtonVariant;
  size: ToggleButtonSize;
  disabled?: boolean;
}>`
  ${buttonBase}
  
  // Apply variant-specific styles
  ${props => getVariantStyles(props.variant, props.isActive)}
  
  // Apply size-specific styles
  ${props => getSizeStyles(props.size)}
  
  // Disabled state
  &:disabled {
    cursor: not-allowed;
    opacity: ${theme.opacity.disabled};
    background-color: ${theme.colors.button.disabled.background};
    color: ${theme.colors.button.disabled.text};
    border-color: ${theme.colors.button.disabled.border};
  }
  
  // Transitions for smooth state changes
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  
  // Focus state for accessibility
  &:focus-visible {
    ${focusOutline}
    outline-offset: 2px;
  }
  
  // Typography from theme
  font-family: ${theme.fonts.family.primary};
  font-weight: ${theme.fonts.weight.medium};
  line-height: ${theme.fonts.lineHeight.normal};
  
  // Ensure text alignment and wrapping
  text-align: center;
  white-space: nowrap;
  
  // Border radius from theme
  border-radius: ${theme.borders.radius.sm};
  
  // SVG/icon alignment
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  // Ensure touch target size meets accessibility standards
  min-height: 44px;
  
  svg {
    margin-right: ${props => props.children ? theme.spacing.xs : '0'};
  }
`;

/**
 * A button component that toggles between active and inactive states.
 * Used for filtering options, view switches, or any binary selection.
 */
const ToggleButton: React.FC<React.PropsWithChildren<ToggleButtonProps>> = ({
  isActive,
  variant = DEFAULT_VARIANT,
  size = DEFAULT_SIZE,
  disabled = false,
  onChange,
  className,
  children,
  ...rest
}) => {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!isActive);
    }
  };

  return (
    <StyledToggleButton
      isActive={isActive}
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={handleClick}
      className={className}
      aria-pressed={isActive}
      {...rest}
    >
      {children}
    </StyledToggleButton>
  );
};

export type { ToggleButtonVariant, ToggleButtonSize };
export default ToggleButton;