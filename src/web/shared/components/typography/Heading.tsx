import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { responsiveFontSize } from '../../styles/mixins';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  noMargin?: boolean;
  responsive?: boolean;
  as?: React.ElementType;
}

const StyledHeading = styled.h1<HeadingProps>`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${({ level }) => level ? theme.typography.fontSize[`h${level}`] : theme.typography.fontSize.h1};
  font-weight: ${theme.typography.fontWeight.bold};
  line-height: ${({ level }) => level && level > 3 ? theme.typography.lineHeight.normal : theme.typography.lineHeight.tight};
  color: ${({ color }) => color ? theme.colors.text[color] || color : theme.colors.text.primary};
  text-align: ${({ align }) => align || 'left'};
  margin: ${({ noMargin }) => noMargin ? '0' : '0 0 0.5em'};
  ${({ responsive, level = 1 }) => responsive && css`
    ${responsiveFontSize(
      `${parseInt(theme.typography.fontSize[`h${level}`]) * 0.8}px`,
      theme.typography.fontSize[`h${level}`],
      `${parseInt(theme.typography.fontSize[`h${level}`]) * 1.1}px`
    )}
  `}
`;

const Heading: React.FC<HeadingProps> = ({ 
  children, 
  level = 1, 
  color, 
  align, 
  className, 
  noMargin, 
  responsive, 
  as, 
  ...rest 
}) => {
  const headingElement = as || `h${level}`;
  
  return (
    <StyledHeading
      as={headingElement}
      level={level}
      color={color}
      align={align}
      className={className}
      noMargin={noMargin}
      responsive={responsive}
      {...rest}
    >
      {children}
    </StyledHeading>
  );
};

export default Heading;