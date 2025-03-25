import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import { Container } from './Container';

/**
 * Props for the Section component
 */
interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  background?: string;
  padding?: string;
  paddingX?: string;
  paddingY?: string;
  margin?: string;
  marginX?: string;
  marginY?: string;
  border?: string;
  borderRadius?: string;
  fullWidth?: boolean;
  withContainer?: boolean;
  containerProps?: React.ComponentProps<typeof Container>;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Styled div element with section layout styling
 */
const StyledSection = styled.div<SectionProps>`
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  background: ${props => props.background ? (theme.colors.background[props.background] || props.background) : 'transparent'};
  padding: ${props => props.padding ? (theme.spacing[props.padding] || props.padding) : '0'};
  padding-left: ${props => props.paddingX ? (theme.spacing[props.paddingX] || props.paddingX) : (props.padding ? (theme.spacing[props.padding] || props.padding) : theme.spacing.md)};
  padding-right: ${props => props.paddingX ? (theme.spacing[props.paddingX] || props.paddingX) : (props.padding ? (theme.spacing[props.padding] || props.padding) : theme.spacing.md)};
  padding-top: ${props => props.paddingY ? (theme.spacing[props.paddingY] || props.paddingY) : (props.padding ? (theme.spacing[props.padding] || props.padding) : theme.spacing.lg)};
  padding-bottom: ${props => props.paddingY ? (theme.spacing[props.paddingY] || props.paddingY) : (props.padding ? (theme.spacing[props.padding] || props.padding) : theme.spacing.lg)};
  margin: ${props => props.margin ? (theme.spacing[props.margin] || props.margin) : '0'};
  margin-left: ${props => props.marginX ? (theme.spacing[props.marginX] || props.marginX) : (props.margin ? (theme.spacing[props.margin] || props.margin) : '0')};
  margin-right: ${props => props.marginX ? (theme.spacing[props.marginX] || props.marginX) : (props.margin ? (theme.spacing[props.margin] || props.margin) : '0')};
  margin-top: ${props => props.marginY ? (theme.spacing[props.marginY] || props.marginY) : (props.margin ? (theme.spacing[props.margin] || props.margin) : theme.spacing.lg)};
  margin-bottom: ${props => props.marginY ? (theme.spacing[props.marginY] || props.marginY) : (props.margin ? (theme.spacing[props.margin] || props.margin) : theme.spacing.lg)};
  border: ${props => props.border ? (theme.borders.width.thin + ' ' + theme.borders.style.solid + ' ' + (theme.colors.border[props.border] || props.border)) : 'none'};
  border-radius: ${props => props.borderRadius ? (theme.borders.radius[props.borderRadius] || props.borderRadius) : '0'};
  box-sizing: border-box;
  
  ${mediaQueries.up('sm')} {
    padding-left: ${props => props.paddingX ? (theme.spacing[props.paddingX] || props.paddingX) : (props.padding ? (theme.spacing[props.padding] || props.padding) : theme.spacing.lg)};
    padding-right: ${props => props.paddingX ? (theme.spacing[props.paddingX] || props.paddingX) : (props.padding ? (theme.spacing[props.padding] || props.padding) : theme.spacing.lg)};
  }
`;

/**
 * Section component that provides a structured container for content with customizable
 * background, padding, margin, and styling options. Serves as a fundamental layout 
 * building block for creating distinct content sections throughout the application.
 * 
 * @example
 * // Basic usage
 * <Section padding="lg" background="secondary">
 *   <p>Content goes here</p>
 * </Section>
 * 
 * @example
 * // With Container wrapper
 * <Section padding="lg" background="secondary" withContainer>
 *   <p>Content constrained by container width</p>
 * </Section>
 * 
 * @example
 * // With custom styling
 * <Section 
 *   padding="lg" 
 *   background="primary" 
 *   border="light" 
 *   borderRadius="md"
 *   margin="md"
 * >
 *   <p>Styled section content</p>
 * </Section>
 * 
 * @param props - Section component props
 * @returns Rendered section with children
 */
export const Section: React.FC<SectionProps> = (props) => {
  const {
    background,
    padding,
    paddingX,
    paddingY,
    margin,
    marginX,
    marginY,
    border,
    borderRadius,
    fullWidth,
    withContainer,
    containerProps,
    children,
    className,
    ...rest
  } = props;

  return (
    <StyledSection
      background={background}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      margin={margin}
      marginX={marginX}
      marginY={marginY}
      border={border}
      borderRadius={borderRadius}
      fullWidth={fullWidth}
      className={className}
      {...rest}
    >
      {withContainer ? (
        <Container {...containerProps}>{children}</Container>
      ) : (
        children
      )}
    </StyledSection>
  );
};

export default Section;