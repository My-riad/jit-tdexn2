import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { focusOutline } from '../../styles/mixins';
import useKeypress from '../../../common/hooks/useKeypress';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: 'default' | 'small' | 'button';
  color?: string;
  external?: boolean;
  onKeyPress?: (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
}

const StyledLink = styled.a<LinkProps>`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${({ variant }) => variant === 'small' ? theme.typography.fontSize.sm : theme.typography.fontSize.md};
  font-weight: ${theme.typography.fontWeight.medium};
  line-height: ${theme.typography.lineHeight.normal};
  color: ${({ color }) => color ? theme.colors.text[color] || color : theme.colors.text.accent};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease, text-decoration 0.2s ease;
  
  &:hover {
    text-decoration: underline;
    color: ${({ color }) => {
      if (color) {
        return color === 'accent' ? theme.colors.text.accent : theme.colors.text[color] || color;
      }
      return theme.colors.text.accent;
    }};
  }
  
  &:focus {
    ${focusOutline}
    outline-offset: 2px;
  }
  
  &:active {
    color: ${({ color }) => {
      if (color) {
        return color === 'accent' ? theme.colors.text.accent : theme.colors.text[color] || color;
      }
      return theme.colors.text.accent;
    }};
  }
  
  ${({ variant }) => variant === 'button' && css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: 4px;
    background-color: transparent;
    border: 1px solid ${theme.colors.text.accent};
    
    &:hover {
      background-color: ${theme.colors.background.accent};
      text-decoration: none;
    }
  `}
`;

const Link = ({
  href,
  children,
  variant = 'default',
  color,
  className,
  external = false,
  onClick,
  onKeyPress,
  ...rest
}: LinkProps) => {
  // Set up keyboard handling for accessibility
  useKeypress(' ', (event) => {
    if (document.activeElement === event.target) {
      onClick?.(event as unknown as React.MouseEvent<HTMLAnchorElement>);
    }
  }, { 
    preventDefault: true, 
    keyEvent: 'keydown' 
  });

  // Additional props for external links
  const externalProps = external ? {
    target: '_blank',
    rel: 'noopener noreferrer',
    'aria-label': rest['aria-label'] ? rest['aria-label'] : `${children} (opens in a new tab)`
  } : {};

  return (
    <StyledLink
      href={href}
      variant={variant}
      color={color}
      className={className}
      onClick={onClick}
      onKeyPress={onKeyPress}
      {...externalProps}
      {...rest}
    >
      {children}
    </StyledLink>
  );
};

export default Link;