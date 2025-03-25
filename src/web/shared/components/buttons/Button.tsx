import React from 'react'; // version ^18.2.0
import styled, { css } from 'styled-components'; // version ^5.3.6
import { theme } from '../../styles/theme';
import { buttonBase, focusOutline, transition } from '../../styles/mixins';

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'text' | 'success' | 'warning' | 'danger' | 'ghost';

// Button sizes
type ButtonSize = 'small' | 'medium' | 'large';

// Button props interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  className?: string;
}

const getVariantStyles = (variant: ButtonVariant, theme: any) => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: ${theme.colors.button.primary.background};
        color: ${theme.colors.button.primary.text};
        border: 1px solid ${theme.colors.button.primary.border};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.button.primary.hoverBackground};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.button.primary.activeBackground};
        }
      `;
    case 'secondary':
      return css`
        background-color: ${theme.colors.button.secondary.background};
        color: ${theme.colors.button.secondary.text};
        border: 1px solid ${theme.colors.button.secondary.border};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.button.secondary.hoverBackground};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.button.secondary.activeBackground};
        }
      `;
    case 'tertiary':
      return css`
        background-color: ${theme.colors.button.tertiary.background};
        color: ${theme.colors.button.tertiary.text};
        border: 1px solid ${theme.colors.button.tertiary.border};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.button.tertiary.hoverBackground};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.button.tertiary.activeBackground};
        }
      `;
    case 'outline':
      return css`
        background-color: transparent;
        color: ${theme.colors.text.primary};
        border: 1px solid ${theme.colors.border.medium};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.background.tertiary};
        }
      `;
    case 'text':
      return css`
        background-color: transparent;
        color: ${theme.colors.text.primary};
        border: none;
        padding-left: ${theme.spacing.xs};
        padding-right: ${theme.spacing.xs};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.background.tertiary};
        }
      `;
    case 'success':
      return css`
        background-color: ${theme.colors.button.success.background};
        color: ${theme.colors.button.success.text};
        border: 1px solid ${theme.colors.button.success.border};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.button.success.hoverBackground};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.button.success.activeBackground};
        }
      `;
    case 'warning':
      return css`
        background-color: ${theme.colors.semantic.warning};
        color: ${theme.colors.text.inverted};
        border: 1px solid ${theme.colors.semantic.warning};

        &:hover:not(:disabled) {
          opacity: 0.9;
        }
      `;
    case 'danger':
      return css`
        background-color: ${theme.colors.button.danger.background};
        color: ${theme.colors.button.danger.text};
        border: 1px solid ${theme.colors.button.danger.border};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.button.danger.hoverBackground};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.button.danger.activeBackground};
        }
      `;
    case 'ghost':
      return css`
        background-color: transparent;
        color: ${theme.colors.text.primary};
        border: none;

        &:hover:not(:disabled) {
          background-color: ${theme.colors.background.tertiary};
        }
      `;
    default:
      return css`
        background-color: ${theme.colors.button.primary.background};
        color: ${theme.colors.button.primary.text};
        border: 1px solid ${theme.colors.button.primary.border};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.button.primary.hoverBackground};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.button.primary.activeBackground};
        }
      `;
  }
};

const getSizeStyles = (size: ButtonSize, theme: any) => {
  switch (size) {
    case 'small':
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        font-size: ${theme.fonts.size.sm};
        height: 32px;
      `;
    case 'large':
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.lg};
        font-size: ${theme.fonts.size.lg};
        height: 48px;
      `;
    case 'medium':
    default:
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        font-size: ${theme.fonts.size.md};
        height: 40px;
      `;
  }
};

const StyledButton = styled.button<{
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
}>`
  ${buttonBase}
  ${({ variant, theme }) => getVariantStyles(variant, theme)}
  ${({ size, theme }) => getSizeStyles(size, theme)}
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  position: relative;
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  
  ${({ disabled, theme }) =>
    disabled &&
    css`
      background-color: ${theme.colors.button.disabled.background};
      color: ${theme.colors.button.disabled.text};
      border: 1px solid ${theme.colors.button.disabled.border};
      cursor: not-allowed;
      
      &:hover, &:active {
        background-color: ${theme.colors.button.disabled.background};
      }
    `}
  
  ${({ isLoading }) =>
    isLoading &&
    css`
      cursor: wait;
    `}
  
  &:focus-visible {
    ${focusOutline}
  }
  
  ${transition}
`;

const ButtonContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ButtonSpinner = styled.span`
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const IconWrapper = styled.span<{ position: 'start' | 'end' }>`
  display: flex;
  align-items: center;
  margin-right: ${({ position, theme }) => position === 'start' ? theme.spacing.xs : 0};
  margin-left: ${({ position, theme }) => position === 'end' ? theme.spacing.xs : 0};
`;

/**
 * A reusable button component with consistent styling and behavior.
 * Supports various visual variants, sizes, states, and icon placement.
 * Follows accessibility standards with appropriate aria attributes.
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  startIcon,
  endIcon,
  className,
  ...rest
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      isLoading={isLoading}
      className={className}
      aria-busy={isLoading}
      {...rest}
    >
      <ButtonContent>
        {isLoading && <ButtonSpinner />}
        {startIcon && <IconWrapper position="start">{startIcon}</IconWrapper>}
        {children}
        {endIcon && <IconWrapper position="end">{endIcon}</IconWrapper>}
      </ButtonContent>
    </StyledButton>
  );
};

export { ButtonProps, ButtonVariant, ButtonSize };
export default Button;