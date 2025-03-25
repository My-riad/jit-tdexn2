import React from 'react'; // version ^18.2.0
import styled, { css } from 'styled-components'; // version ^5.3.6
import { colors, spacing, borders } from '../../styles/theme';
import { buttonBase, focusOutline } from '../../styles/mixins';

/**
 * Available icon button visual variants
 */
type IconButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'success' | 'warning' | 'danger';

/**
 * Available icon button sizes
 */
type IconButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for the IconButton component
 */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: IconButtonVariant;
  /** Size of the button */
  size?: IconButtonSize;
  /** Accessible label for screen readers (required for icon-only buttons) */
  ariaLabel: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  isLoading?: boolean;
}

/**
 * Generates the appropriate CSS for each icon button variant
 */
const getVariantStyles = (variant: IconButtonVariant) => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: ${colors.primary.blue};
        color: ${colors.neutral.white};
        border: ${borders.width.thin} solid ${colors.primary.blue};
        
        &:hover:not(:disabled) {
          background-color: ${colors.primary.blueLight};
        }
        
        &:active:not(:disabled) {
          background-color: ${colors.primary.blue};
          opacity: 0.8;
        }
      `;
    case 'secondary':
      return css`
        background-color: ${colors.neutral.white};
        color: ${colors.primary.blue};
        border: ${borders.width.thin} solid ${colors.primary.blue};
        
        &:hover:not(:disabled) {
          background-color: ${colors.secondary.lightBlue};
        }
        
        &:active:not(:disabled) {
          background-color: ${colors.secondary.lightBlue};
          opacity: 0.8;
        }
      `;
    case 'tertiary':
      return css`
        background-color: ${colors.neutral.gray200};
        color: ${colors.neutral.mediumGray};
        border: ${borders.width.thin} solid ${colors.neutral.gray200};
        
        &:hover:not(:disabled) {
          background-color: ${colors.neutral.gray300};
        }
        
        &:active:not(:disabled) {
          background-color: ${colors.neutral.gray300};
          opacity: 0.8;
        }
      `;
    case 'outline':
      return css`
        background-color: transparent;
        color: ${colors.neutral.darkGray};
        border: ${borders.width.thin} solid ${colors.neutral.lightGray};
        
        &:hover:not(:disabled) {
          background-color: ${colors.neutral.gray100};
        }
        
        &:active:not(:disabled) {
          background-color: ${colors.neutral.gray100};
          border-color: ${colors.neutral.mediumGray};
        }
      `;
    case 'ghost':
      return css`
        background-color: transparent;
        color: ${colors.neutral.darkGray};
        border: ${borders.width.thin} solid transparent;
        
        &:hover:not(:disabled) {
          background-color: ${colors.neutral.gray100};
        }
        
        &:active:not(:disabled) {
          background-color: ${colors.neutral.gray100};
        }
      `;
    case 'success':
      return css`
        background-color: ${colors.primary.green};
        color: ${colors.neutral.white};
        border: ${borders.width.thin} solid ${colors.primary.green};
        
        &:hover:not(:disabled) {
          background-color: ${colors.primary.greenLight};
        }
        
        &:active:not(:disabled) {
          background-color: ${colors.primary.green};
          opacity: 0.8;
        }
      `;
    case 'warning':
      return css`
        background-color: ${colors.primary.orange};
        color: ${colors.neutral.white};
        border: ${borders.width.thin} solid ${colors.primary.orange};
        
        &:hover:not(:disabled) {
          background-color: ${colors.primary.orangeLight};
        }
        
        &:active:not(:disabled) {
          background-color: ${colors.primary.orange};
          opacity: 0.8;
        }
      `;
    case 'danger':
      return css`
        background-color: ${colors.primary.red};
        color: ${colors.neutral.white};
        border: ${borders.width.thin} solid ${colors.primary.red};
        
        &:hover:not(:disabled) {
          background-color: ${colors.primary.redLight};
        }
        
        &:active:not(:disabled) {
          background-color: ${colors.primary.red};
          opacity: 0.8;
        }
      `;
    default:
      return css``;
  }
};

/**
 * Generates the appropriate CSS for each icon button size, creating square or circular buttons
 */
const getSizeStyles = (size: IconButtonSize) => {
  switch (size) {
    case 'small':
      return css`
        width: 32px;
        height: 32px;
        padding: ${spacing.xxs};
        
        & > svg {
          width: 16px;
          height: 16px;
        }
      `;
    case 'medium':
      return css`
        width: 40px;
        height: 40px;
        padding: ${spacing.xs};
        
        & > svg {
          width: 20px;
          height: 20px;
        }
      `;
    case 'large':
      return css`
        width: 48px;
        height: 48px;
        padding: ${spacing.sm};
        
        & > svg {
          width: 24px;
          height: 24px;
        }
      `;
    default:
      return css``;
  }
};

/**
 * Styled button component for icon-only interactions
 */
const StyledIconButton = styled.button<{
  variant: IconButtonVariant;
  size: IconButtonSize;
  disabled: boolean;
  isLoading: boolean;
}>`
  ${buttonBase}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${borders.radius.round}; /* Make it circular */
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  /* Apply variant styles */
  ${({ variant }) => getVariantStyles(variant)}
  
  /* Apply size styles */
  ${({ size }) => getSizeStyles(size)}
  
  /* Disabled state */
  ${({ disabled }) =>
    disabled &&
    css`
      cursor: not-allowed;
      background-color: ${colors.neutral.gray200};
      color: ${colors.neutral.gray500};
      border-color: ${colors.neutral.gray200};
      opacity: 0.6;
      
      &:hover, &:active {
        background-color: ${colors.neutral.gray200};
        color: ${colors.neutral.gray500};
        border-color: ${colors.neutral.gray200};
        transform: none;
      }
    `}
  
  /* Focus state (for accessibility) */
  &:focus-visible {
    ${focusOutline}
  }
  
  /* Handle content visibility during loading state */
  ${({ isLoading }) =>
    isLoading &&
    css`
      & > *:not(.loading-spinner) {
        visibility: hidden;
      }
    `}
`;

/**
 * Loading spinner component shown during loading state
 */
const IconButtonSpinner = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.7s linear infinite;
  
  @keyframes spin {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
`;

/**
 * A button component designed for icon-only interactions. 
 * Provides a compact, accessible way to trigger actions with appropriate 
 * ARIA attributes for screen readers.
 */
const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  ariaLabel,
  disabled = false,
  isLoading = false,
  ...rest
}) => {
  return (
    <StyledIconButton
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      isLoading={isLoading}
      type={rest.type || 'button'} // Default to 'button' type if not specified
      {...rest}
    >
      {isLoading && <IconButtonSpinner className="loading-spinner" />}
      {children}
    </StyledIconButton>
  );
};

export type { IconButtonProps, IconButtonVariant, IconButtonSize };
export default IconButton;