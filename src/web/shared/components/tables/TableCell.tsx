import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

/**
 * Enum for cell alignment options
 */
export enum CellAlignment {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right'
}

/**
 * Props for the TableCell component
 */
export interface TableCellProps {
  /** Content to be displayed in the cell */
  children: React.ReactNode;
  /** Text alignment within the cell */
  align?: CellAlignment;
  /** Whether to truncate text with ellipsis when it overflows */
  truncate?: boolean;
  /** Width of the cell */
  width?: string;
  /** Additional class name for styling */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}

/**
 * Props for the styled cell component
 */
interface StyledCellProps {
  align: CellAlignment;
  truncate: boolean;
  width?: string;
}

/**
 * Helper function to get text alignment based on alignment prop
 */
const getTextAlignment = (align: CellAlignment): string => {
  return align;
};

/**
 * Default props for the TableCell component
 */
const DEFAULT_CELL_PROPS = {
  align: CellAlignment.LEFT,
  truncate: false
};

/**
 * Styled table cell component with customizable appearance
 */
const StyledCell = styled.td<StyledCellProps>`
  padding: ${theme.spacing.sm};
  font-size: ${theme.fonts.size.sm};
  color: ${theme.colors.text.primary};
  text-align: ${props => getTextAlignment(props.align)};
  width: ${props => props.width || 'auto'};
  max-width: ${props => props.width || 'auto'};
  
  ${props => props.truncate && css`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
`;

/**
 * A customizable table cell component that renders a cell within a table row
 */
const TableCell: React.FC<TableCellProps> = ({
  children,
  align = DEFAULT_CELL_PROPS.align,
  truncate = DEFAULT_CELL_PROPS.truncate,
  width,
  className,
  style,
  'data-testid': testId
}) => {
  return (
    <StyledCell
      align={align}
      truncate={truncate}
      width={width}
      className={className}
      style={style}
      data-testid={testId}
      role="cell"
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {children}
    </StyledCell>
  );
};

export default TableCell;
export { TableCellProps, CellAlignment };