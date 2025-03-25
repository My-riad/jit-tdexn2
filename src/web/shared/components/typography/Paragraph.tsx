import React from 'react'; // version ^18.2.0
import styled, { css } from 'styled-components'; // version ^5.3.6
import { typography, colors } from '../../styles/theme';
import { responsiveFontSize, truncateText } from '../../styles/mixins';

/**
 * TypeScript interface for the Paragraph component props
 */
interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  responsive?: boolean;
  truncate?: boolean;
  truncateLines?: number;
}

/**
 * Styled component for the paragraph with configurable styles
 */
const StyledParagraph = styled.p<ParagraphProps>`
  font-family: ${typography.fontFamily.primary};
  font-size: ${({ size }) => size ? typography.fontSize[size] || size : typography.fontSize.md};
  font-weight: ${typography.fontWeight.regular};
  line-height: ${typography.lineHeight.normal};
  color: ${({ color }) => color ? colors.text[color] || color : colors.text.primary};
  text-align: ${({ align }) => align || 'left'};
  margin: 0 0 1em;
  
  ${({ responsive, size = 'md' }) => responsive && css`
    ${responsiveFontSize(
      `${parseInt(typography.fontSize[size]) * 0.9}px`,
      typography.fontSize[size],
      `${parseInt(typography.fontSize[size]) * 1.1}px`
    )}
  `}
  
  ${({ truncate, truncateLines = 2 }) => truncate && css`
    ${truncateText(truncateLines)}
  `}
  
  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * A component for rendering paragraph text blocks with consistent styling
 * 
 * @param props - Component props including text customization options
 * @returns The rendered paragraph
 */
const Paragraph: React.FC<ParagraphProps> = ({ 
  children, 
  size, 
  color, 
  align, 
  className, 
  responsive, 
  truncate, 
  truncateLines, 
  ...rest 
}) => {
  return (
    <StyledParagraph
      size={size}
      color={color}
      align={align}
      className={className}
      responsive={responsive}
      truncate={truncate}
      truncateLines={truncateLines}
      {...rest}
    >
      {children}
    </StyledParagraph>
  );
};

export default Paragraph;