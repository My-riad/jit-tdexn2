import React from 'react';
import styled, { css } from 'styled-components';
import { lightTheme, ThemeType } from '../../styles/theme';
import { truncateText } from '../../styles/mixins';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'bodyLarge' | 'bodyRegular' | 'bodySmall' | 'caption' | 'label' | 'data';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  noMargin?: boolean;
  truncate?: boolean;
  lines?: number;
  responsive?: boolean;
  as?: React.ElementType;
}

const StyledText = styled.p<TextProps>`
  font-family: ${({ theme }) => theme.fonts.family.primary};
  font-size: ${({ variant, theme }) => {
    switch (variant) {
      case 'bodyLarge':
        return theme.fonts.size.lg;
      case 'bodySmall':
        return theme.fonts.size.sm;
      case 'caption':
        return theme.fonts.size.xs;
      case 'label':
        return theme.fonts.size.sm;
      case 'data':
        return theme.fonts.size.md;
      default:
        return theme.fonts.size.md; // bodyRegular is default
    }
  }};
  font-weight: ${({ variant, theme }) => {
    switch (variant) {
      case 'label':
        return theme.fonts.weight.medium;
      default:
        return theme.fonts.weight.regular;
    }
  }};
  line-height: ${({ variant, theme }) => {
    switch (variant) {
      case 'caption':
      case 'label':
        return theme.fonts.lineHeight.normal;
      case 'data':
        return theme.fonts.lineHeight.normal;
      default:
        return theme.fonts.lineHeight.relaxed;
    }
  }};
  color: ${({ color, theme }) => color ? theme.colors.text[color] || color : theme.colors.text.primary};
  text-align: ${({ align }) => align || 'left'};
  margin: ${({ noMargin }) => noMargin ? '0' : '0 0 1em'};
  ${({ truncate, lines = 2 }) => truncate && truncateText(lines)};
  ${({ responsive, variant = 'bodyRegular', theme }) => responsive && css`
    @media (max-width: 768px) {
      font-size: ${(() => {
        switch (variant) {
          case 'bodyLarge':
            return theme.fonts.size.md;
          case 'bodyRegular':
            return theme.fonts.size.sm;
          case 'bodySmall':
            return theme.fonts.size.xs;
          default:
            return 'inherit';
        }
      })()};
    }
  `}
`;

const Text = ({
  children,
  variant = 'bodyRegular',
  color,
  align,
  className,
  noMargin,
  truncate,
  lines = 2,
  responsive,
  as,
  ...rest
}: TextProps) => {
  return (
    <StyledText
      as={as}
      variant={variant}
      color={color}
      align={align}
      className={className}
      noMargin={noMargin}
      truncate={truncate}
      lines={lines}
      responsive={responsive}
      {...rest}
    >
      {children}
    </StyledText>
  );
};

export default Text;