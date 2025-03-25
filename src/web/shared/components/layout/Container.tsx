import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';

/**
 * Props for the Container component
 */
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: string;
  padding?: string;
  paddingX?: string;
  paddingY?: string;
  margin?: string;
  marginX?: string;
  marginY?: string;
  fluid?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Styled div element with container layout styling
 * Provides responsive padding, configurable margins, and width constraints
 */
const StyledContainer = styled.div<ContainerProps>`
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  height: ${props => props.fullHeight ? '100%' : 'auto'};
  max-width: ${props => props.fluid ? '100%' : props.maxWidth ? (theme.sizes[props.maxWidth] || props.maxWidth) : theme.sizes.maxContentWidth};
  margin-left: ${props => props.marginX || props.margin ? (theme.spacing[props.marginX || props.margin] || props.marginX || props.margin) : props.fluid ? '0' : 'auto'};
  margin-right: ${props => props.marginX || props.margin ? (theme.spacing[props.marginX || props.margin] || props.marginX || props.margin) : props.fluid ? '0' : 'auto'};
  margin-top: ${props => props.marginY || props.margin ? (theme.spacing[props.marginY || props.margin] || props.marginY || props.margin) : '0'};
  margin-bottom: ${props => props.marginY || props.margin ? (theme.spacing[props.marginY || props.margin] || props.marginY || props.margin) : '0'};
  padding-left: ${props => props.paddingX || props.padding ? (theme.spacing[props.paddingX || props.padding] || props.paddingX || props.padding) : theme.spacing.md};
  padding-right: ${props => props.paddingX || props.padding ? (theme.spacing[props.paddingX || props.padding] || props.paddingX || props.padding) : theme.spacing.md};
  padding-top: ${props => props.paddingY || props.padding ? (theme.spacing[props.paddingY || props.padding] || props.paddingY || props.padding) : '0'};
  padding-bottom: ${props => props.paddingY || props.padding ? (theme.spacing[props.paddingY || props.padding] || props.paddingY || props.padding) : '0'};
  box-sizing: border-box;
  
  ${mediaQueries.up('sm')} {
    padding-left: ${props => props.paddingX || props.padding ? (theme.spacing[props.paddingX || props.padding] || props.paddingX || props.padding) : theme.spacing.lg};
    padding-right: ${props => props.paddingX || props.padding ? (theme.spacing[props.paddingX || props.padding] || props.paddingX || props.padding) : theme.spacing.lg};
  }
`;

/**
 * Container component that provides a centered, width-constrained layout with customizable padding,
 * margin, and maximum width. Serves as a fundamental layout building block throughout the application.
 * 
 * @param props - Container component props
 * @returns JSX Element
 */
export const Container: React.FC<ContainerProps> = (props) => {
  const {
    maxWidth,
    padding,
    paddingX,
    paddingY,
    margin,
    marginX,
    marginY,
    fluid,
    fullWidth,
    fullHeight,
    children,
    className,
    ...rest
  } = props;

  return (
    <StyledContainer
      maxWidth={maxWidth}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      margin={margin}
      marginX={marginX}
      marginY={marginY}
      fluid={fluid}
      fullWidth={fullWidth}
      fullHeight={fullHeight}
      className={className}
      {...rest}
    >
      {children}
    </StyledContainer>
  );
};

export default Container;