import React from 'react';
import styled from 'styled-components';
import { spacing } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';

/**
 * Props for the Grid component
 */
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: string | Record<string, string>;
  rows?: string | Record<string, string>;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  areas?: string | Record<string, string>;
  templateColumns?: string | Record<string, string>;
  templateRows?: string | Record<string, string>;
  autoColumns?: string;
  autoRows?: string;
  autoFlow?: string;
  justifyItems?: string;
  alignItems?: string;
  justifyContent?: string;
  alignContent?: string;
  padding?: string;
  paddingX?: string;
  paddingY?: string;
  margin?: string;
  marginX?: string;
  marginY?: string;
  width?: string;
  height?: string;
  fullWidth?: boolean;
  fullHeight?: boolean;
}

/**
 * Props for the GridItem component
 */
interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  area?: string;
  column?: string;
  row?: string;
  columnStart?: string;
  columnEnd?: string;
  rowStart?: string;
  rowEnd?: string;
  justifySelf?: string;
  alignSelf?: string;
  placeSelf?: string;
}

/**
 * Helper function to handle responsive values for grid properties
 * Supports both simple string values and responsive objects for different breakpoints
 */
const getResponsiveValue = (value: string | Record<string, string> | undefined, defaultValue: string): string => {
  if (!value) {
    return defaultValue;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  // For object values, return the base/xs value or default
  return value.xs || value.base || defaultValue;
};

/**
 * Styled grid container with CSS Grid layout capabilities
 */
const StyledGrid = styled.div<GridProps>`
  display: grid;
  grid-template-columns: ${props => getResponsiveValue(props.columns || props.templateColumns, 'repeat(12, 1fr)')};
  grid-template-rows: ${props => getResponsiveValue(props.rows || props.templateRows, 'auto')};
  grid-template-areas: ${props => getResponsiveValue(props.areas, 'none')};
  grid-auto-columns: ${props => props.autoColumns || 'auto'};
  grid-auto-rows: ${props => props.autoRows || 'auto'};
  grid-auto-flow: ${props => props.autoFlow || 'row'};
  gap: ${props => props.gap ? (spacing[props.gap] || props.gap) : '0'};
  row-gap: ${props => props.rowGap ? (spacing[props.rowGap] || props.rowGap) : (props.gap ? (spacing[props.gap] || props.gap) : '0')};
  column-gap: ${props => props.columnGap ? (spacing[props.columnGap] || props.columnGap) : (props.gap ? (spacing[props.gap] || props.gap) : '0')};
  justify-items: ${props => props.justifyItems || 'stretch'};
  align-items: ${props => props.alignItems || 'stretch'};
  justify-content: ${props => props.justifyContent || 'start'};
  align-content: ${props => props.alignContent || 'start'};
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
  box-sizing: border-box;
  
  /* Apply responsive styles for columns/templateColumns */
  ${props => {
    if (typeof props.columns === 'object') {
      return Object.entries(props.columns)
        .filter(([breakpoint]) => breakpoint !== 'xs' && breakpoint !== 'base')
        .map(([breakpoint, value]) => `
          ${mediaQueries.up(breakpoint)} {
            grid-template-columns: ${value};
          }
        `).join('');
    }
    return '';
  }}
  
  ${props => {
    if (typeof props.templateColumns === 'object') {
      return Object.entries(props.templateColumns)
        .filter(([breakpoint]) => breakpoint !== 'xs' && breakpoint !== 'base')
        .map(([breakpoint, value]) => `
          ${mediaQueries.up(breakpoint)} {
            grid-template-columns: ${value};
          }
        `).join('');
    }
    return '';
  }}
  
  /* Apply responsive styles for rows/templateRows */
  ${props => {
    if (typeof props.rows === 'object') {
      return Object.entries(props.rows)
        .filter(([breakpoint]) => breakpoint !== 'xs' && breakpoint !== 'base')
        .map(([breakpoint, value]) => `
          ${mediaQueries.up(breakpoint)} {
            grid-template-rows: ${value};
          }
        `).join('');
    }
    return '';
  }}
  
  ${props => {
    if (typeof props.templateRows === 'object') {
      return Object.entries(props.templateRows)
        .filter(([breakpoint]) => breakpoint !== 'xs' && breakpoint !== 'base')
        .map(([breakpoint, value]) => `
          ${mediaQueries.up(breakpoint)} {
            grid-template-rows: ${value};
          }
        `).join('');
    }
    return '';
  }}
  
  /* Apply responsive styles for areas */
  ${props => {
    if (typeof props.areas === 'object') {
      return Object.entries(props.areas)
        .filter(([breakpoint]) => breakpoint !== 'xs' && breakpoint !== 'base')
        .map(([breakpoint, value]) => `
          ${mediaQueries.up(breakpoint)} {
            grid-template-areas: ${value};
          }
        `).join('');
    }
    return '';
  }}
`;

/**
 * Styled grid item with positioning capabilities
 */
const StyledGridItem = styled.div<GridItemProps>`
  grid-area: ${props => props.area || 'auto'};
  grid-column: ${props => props.column || 'auto'};
  grid-row: ${props => props.row || 'auto'};
  grid-column-start: ${props => props.columnStart || 'auto'};
  grid-column-end: ${props => props.columnEnd || 'auto'};
  grid-row-start: ${props => props.rowStart || 'auto'};
  grid-row-end: ${props => props.rowEnd || 'auto'};
  justify-self: ${props => props.justifySelf || 'auto'};
  align-self: ${props => props.alignSelf || 'auto'};
  place-self: ${props => props.placeSelf || 'auto'};
`;

/**
 * Grid component for creating responsive layouts using CSS Grid
 * Provides a flexible system for creating complex layouts with customizable columns, rows, gaps, and responsive behavior
 */
const Grid: React.FC<GridProps> = (props) => {
  const {
    columns,
    rows,
    gap,
    rowGap,
    columnGap,
    areas,
    templateColumns,
    templateRows,
    autoColumns,
    autoRows,
    autoFlow,
    justifyItems,
    alignItems,
    justifyContent,
    alignContent,
    padding,
    paddingX,
    paddingY,
    margin,
    marginX,
    marginY,
    width,
    height,
    fullWidth,
    fullHeight,
    children,
    className,
    ...rest
  } = props;

  return (
    <StyledGrid
      columns={columns}
      rows={rows}
      gap={gap}
      rowGap={rowGap}
      columnGap={columnGap}
      areas={areas}
      templateColumns={templateColumns}
      templateRows={templateRows}
      autoColumns={autoColumns}
      autoRows={autoRows}
      autoFlow={autoFlow}
      justifyItems={justifyItems}
      alignItems={alignItems}
      justifyContent={justifyContent}
      alignContent={alignContent}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      margin={margin}
      marginX={marginX}
      marginY={marginY}
      width={width}
      height={height}
      fullWidth={fullWidth}
      fullHeight={fullHeight}
      className={className}
      {...rest}
    >
      {children}
    </StyledGrid>
  );
};

/**
 * GridItem component for placing content within specific grid areas or positions
 */
export const GridItem: React.FC<GridItemProps> = (props) => {
  const {
    area,
    column,
    row,
    columnStart,
    columnEnd,
    rowStart,
    rowEnd,
    justifySelf,
    alignSelf,
    placeSelf,
    children,
    className,
    ...rest
  } = props;

  return (
    <StyledGridItem
      area={area}
      column={column}
      row={row}
      columnStart={columnStart}
      columnEnd={columnEnd}
      rowStart={rowStart}
      rowEnd={rowEnd}
      justifySelf={justifySelf}
      alignSelf={alignSelf}
      placeSelf={placeSelf}
      className={className}
      {...rest}
    >
      {children}
    </StyledGridItem>
  );
};

// Set display names for debugging and React DevTools
Grid.displayName = 'Grid';
GridItem.displayName = 'GridItem';

export { Grid };
export type { GridProps, GridItemProps };
export default Grid;