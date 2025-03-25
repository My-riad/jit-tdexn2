import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { resetButton, focusOutline } from '../../styles/mixins';

export interface LinkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: string;
  className?: string;
  disabled?: boolean;
}

const StyledLinkButton = styled.button<LinkButtonProps>`
  ${resetButton};
  font-family: ${theme.fonts.family.primary};
  font-size: inherit;
  font-weight: ${theme.fonts.weight.medium};
  color: ${({ color, disabled }) => 
    disabled 
      ? theme.colors.text.disabled 
      : color 
        ? theme.colors.text[color] || color 
        : theme.colors.button.primary.text
  };
  background: transparent;
  border: none;
  padding: 0;
  text-decoration: none;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: inline;
  
  &:hover:not(:disabled) {
    text-decoration: underline;
    color: ${({ color }) => 
      color 
        ? theme.colors.text[color] || color 
        : theme.colors.button.primary.hoverBackground
    };
  }
  
  &:focus {
    ${focusOutline};
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.6;
  }
`;

const LinkButton: React.FC<React.PropsWithChildren<LinkButtonProps>> = ({
  children,
  color,
  className,
  disabled = false,
  ...rest
}) => {
  return (
    <StyledLinkButton
      color={color}
      className={className}
      disabled={disabled}
      {...rest}
    >
      {children}
    </StyledLinkButton>
  );
};

export { LinkButtonProps };
export default LinkButton;