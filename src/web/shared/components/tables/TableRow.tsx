import React from 'react';
import styled, { css } from 'styled-components';
import { colors } from '../../styles/theme';

/**
 * Props for the TableRow component
 */
export interface TableRowProps {
  /** Content to be rendered within the row */
  children: React.ReactNode;
  /** Whether the row is currently selected */
  selected?: boolean;
  /** Whether the row is selectable */
  selectable?: boolean;
  /** Whether the row can be clicked */
  isClickable?: boolean;
  /** Function called when the row is clicked */
  onClick?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Props for the styled row component
 */
interface StyledRowProps {
  selected: boolean;
  selectable: boolean;
  isClickable: boolean;
}

/**
 * Styled table row component with customizable appearance
 */
const StyledRow = styled.tr<StyledRowProps>`
  transition: background-color 0.2s ease;
  background-color: ${props => props.selected ? colors.background.accent : 'transparent'};
  cursor: ${props => (props.isClickable || props.selectable) ? 'pointer' : 'default'};
  &:hover {
    background-color: ${props => props.selected ? colors.background.accent : colors.background.tertiary};
  }
  border-bottom: 1px solid ${colors.border.light};
`;

/**
 * Default props for the TableRow component
 */
const DEFAULT_ROW_PROPS = {
  selected: false,
  selectable: false,
  isClickable: false,
};

/**
 * A customizable table row component that renders a row within a table
 */
const TableRow: React.FC<TableRowProps> = ({
  children,
  selected = DEFAULT_ROW_PROPS.selected,
  selectable = DEFAULT_ROW_PROPS.selectable,
  isClickable = DEFAULT_ROW_PROPS.isClickable,
  onClick,
  className,
  style,
  ...rest
}) => {
  /**
   * Handle row click events if the row is clickable
   */
  const handleClick = () => {
    if ((isClickable || selectable) && onClick) {
      onClick();
    }
  };

  return (
    <StyledRow
      selected={selected}
      selectable={selectable}
      isClickable={isClickable}
      onClick={handleClick}
      className={className}
      style={style}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-selected={selectable ? selected : undefined}
      {...rest}
    >
      {children}
    </StyledRow>
  );
};

export default TableRow;