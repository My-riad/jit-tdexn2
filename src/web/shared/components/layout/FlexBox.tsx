import React from 'react';
import styled from 'styled-components';
import { spacing } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';

/**
 * Props for the FlexBox component
 */
interface FlexBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: string;
  wrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  padding?: string;
  paddingX?: string;
  paddingY?: string;
  margin?: string;
  marginX?: string;
  marginY?: string;
  width?: string;
  height?: string;
  flex?: string;
  fullWidth?: boolean;
  fullHeight?: boolean;
  responsive?: Record<string, string>;
}

/**
 * Styled div element with flexbox layout styling
 */
const StyledFlexBox = styled.div<FlexBoxProps>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  flex-wrap: ${props => props.wrap || 'nowrap'};
  justify-content: ${props => props.justifyContent || 'flex-start'};
  align-items: ${props => props.alignItems || 'stretch'};
  align-content: ${props => props.alignContent || 'stretch'};
  gap: ${props => props.gap ? (spacing[props.gap] || props.gap) : '0'};
  row-gap: ${props => props.rowGap ? (spacing[props.rowGap] || props.rowGap) : (props.gap ? (spacing[props.gap] || props.gap) : '0')};
  column-gap: ${props => props.columnGap ? (spacing[props.columnGap] || props.columnGap) : (props.gap ? (spacing[props.gap] || props.gap) : '0')};
  padding: ${props => props.padding ? (spacing[props.padding] || props.padding) : '0'};
  padding-left: ${props => props.paddingX ? (spacing[props.paddingX] || props.paddingX) : (props.padding ? (spacing[props.padding] || props.padding) : '0')};
  padding-right: ${props => props.paddingX ? (spacing[props.paddingX] || props.paddingX) : (props.padding ? (spacing[props.padding] || props.padding) : '0')};
  padding-top: ${props => props.paddingY ? (spacing[props.paddingY] || props.paddingY) : (props.padding ? (spacing[props.padding] || props.padding) : '0')};
  padding-bottom: ${props => props.paddingY ? (spacing[props.paddingY] || props.paddingY) : (props.padding ? (spacing[props.padding] || props.padding) : '0')};
  margin: ${props => props.margin ? (spacing[props.margin] || props.margin) : '0'};
  margin-left: ${props => props.marginX ? (spacing[props.marginX] || props.marginX) : (props.margin ? (spacing[props.margin] || props.margin) : '0')};
  margin-right: ${props => props.marginX ? (spacing[props.marginX] || props.marginX) : (props.margin ? (spacing[props.margin] || props.margin) : '0')};
  margin-top: ${props => props.marginY ? (spacing[props.marginY] || props.marginY) : (props.margin ? (spacing[props.margin] || props.margin) : '0')};
  margin-bottom: ${props => props.marginY ? (spacing[props.marginY] || props.marginY) : (props.margin ? (spacing[props.margin] || props.margin) : '0')};
  width: ${props => props.fullWidth ? '100%' : props.width || 'auto'};
  height: ${props => props.fullHeight ? '100%' : props.height || 'auto'};
  flex: ${props => props.flex || '0 1 auto'};
  box-sizing: border-box;
  
  ${props => props.responsive && Object.entries(props.responsive).map(([breakpoint, value]) => {
    return mediaQueries.up(breakpoint)`
      flex-direction: ${value};
    `;
  })}
`;

/**
 * FlexBox component provides a flexible layout container with customizable
 * flexbox properties for creating responsive layouts throughout the application.
 * 
 * @example
 * <FlexBox 
 *   direction="column" 
 *   alignItems="center" 
 *   gap="md"
 *   responsive={{ md: "row" }}
 * >
 *   <div>Child 1</div>
 *   <div>Child 2</div>
 * </FlexBox>
 */
const FlexBox: React.FC<FlexBoxProps> = (props) => {
  const {
    direction,
    wrap,
    justifyContent,
    alignItems,
    alignContent,
    gap,
    rowGap,
    columnGap,
    padding,
    paddingX,
    paddingY,
    margin,
    marginX,
    marginY,
    width,
    height,
    flex,
    fullWidth,
    fullHeight,
    responsive,
    children,
    className,
    ...rest
  } = props;

  return (
    <StyledFlexBox
      direction={direction}
      wrap={wrap}
      justifyContent={justifyContent}
      alignItems={alignItems}
      alignContent={alignContent}
      gap={gap}
      rowGap={rowGap}
      columnGap={columnGap}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      margin={margin}
      marginX={marginX}
      marginY={marginY}
      width={width}
      height={height}
      flex={flex}
      fullWidth={fullWidth}
      fullHeight={fullHeight}
      responsive={responsive}
      className={className}
      {...rest}
    >
      {children}
    </StyledFlexBox>
  );
};

export { FlexBox };
export default FlexBox;