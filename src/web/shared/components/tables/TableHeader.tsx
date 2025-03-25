import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import TableCell, { CellAlignment } from './TableCell';

/**
 * Enum for sort direction options
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Interface for TableHeader props
 */
export interface TableHeaderProps<T = any> {
  /** Array of column definitions */
  columns: Array<ColumnDefinition<T>>;
  /** Current field being sorted */
  sortField?: string;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Callback when sort changes */
  onSort?: (field: string, direction: SortDirection) => void;
  /** Filtering options */
  filtering?: FilteringOptions<T>;
  /** Callback when filters change */
  onFilter?: (filters: Record<string, string>) => void;
  /** Additional class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * Definition for a table column
 */
export interface ColumnDefinition<T> {
  /** Unique field identifier */
  field: string;
  /** Header text to display */
  header: string;
  /** Column width */
  width?: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is filterable */
  filterable?: boolean;
  /** Custom render function for header */
  renderHeader?: (column: ColumnDefinition<T>) => React.ReactNode;
  /** Text alignment within the column */
  align?: CellAlignment;
  /** Whether to truncate text with ellipsis */
  truncate?: boolean;
}

/**
 * Options for table filtering
 */
export interface FilteringOptions<T> {
  /** Whether filtering is enabled */
  enabled: boolean;
  /** Current filter values by field */
  filters: Record<string, string>;
  /** Callback when filters change */
  onFilter: (filters: Record<string, string>) => void;
}

/**
 * Styled table header row component
 */
const StyledHeaderRow = styled.tr`
  background-color: ${theme.colors.background.secondary};
  border-bottom: 2px solid ${theme.colors.border.medium};
  position: sticky;
  top: 0;
  z-index: 1;
`;

/**
 * Styled table header cell component
 */
const StyledHeaderCell = styled.th<{
  sortable?: boolean;
  width?: string;
  align?: CellAlignment;
}>`
  padding: ${theme.spacing.sm};
  font-weight: ${theme.fonts.weight.bold};
  font-size: ${theme.fonts.size.sm};
  color: ${theme.colors.text.primary};
  text-align: ${props => props.align || 'left'};
  width: ${props => props.width || 'auto'};
  cursor: ${props => (props.sortable ? 'pointer' : 'default')};
  user-select: none;
  position: relative;
`;

/**
 * Container for sortable header content
 */
const SortableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.xs};
`;

/**
 * Sort indicator icon container
 */
const SortIndicator = styled.span<{
  active: boolean;
  direction?: SortDirection;
}>`
  display: inline-flex;
  align-items: center;
  opacity: ${props => (props.active ? 1 : 0.3)};
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform: ${props => (props.direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)')};
  
  &:hover {
    opacity: 0.8;
  }
`;

/**
 * Container for filter input
 */
const FilterContainer = styled.div`
  margin-top: ${theme.spacing.xs};
`;

/**
 * Input for column filtering
 */
const FilterInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.xs};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borders.radius.sm};
  font-size: ${theme.fonts.size.xs};
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary.main};
  }
`;

/**
 * Renders the appropriate sort indicator based on sort direction
 */
const renderSortIndicator = (
  field: string,
  sortField?: string,
  sortDirection?: SortDirection
): JSX.Element => {
  const isActive = field === sortField;
  
  return (
    <SortIndicator
      active={isActive}
      direction={isActive ? sortDirection : undefined}
      aria-hidden="true"
    >
      {/* Arrow icon for sorting indication */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12 5L12 19M12 5L18 11M12 5L6 11" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </SortIndicator>
  );
};

/**
 * A customizable table header component that renders the header row of a table
 */
const TableHeader = <T extends object>({
  columns,
  sortField,
  sortDirection = SortDirection.ASC,
  onSort,
  filtering,
  onFilter,
  className,
  style
}: TableHeaderProps<T>): JSX.Element => {
  // Handle sort click events for sortable columns
  const handleSortClick = (field: string, sortable?: boolean) => {
    if (!sortable || !onSort) return;
    
    const newDirection = 
      field === sortField && sortDirection === SortDirection.ASC
        ? SortDirection.DESC
        : SortDirection.ASC;
    
    onSort(field, newDirection);
  };

  // Handle filter input changes
  const handleFilterChange = (field: string, value: string) => {
    if (!filtering || !onFilter) return;
    
    const newFilters = {
      ...filtering.filters,
      [field]: value
    };
    
    onFilter(newFilters);
  };

  return (
    <StyledHeaderRow className={className} style={style} role="row">
      {columns.map((column, index) => (
        <StyledHeaderCell
          key={column.field || index}
          sortable={column.sortable}
          width={column.width}
          align={column.align}
          onClick={() => handleSortClick(column.field, column.sortable)}
          aria-sort={
            column.sortable && column.field === sortField
              ? sortDirection === SortDirection.ASC
                ? 'ascending'
                : 'descending'
              : undefined
          }
          role="columnheader"
        >
          {column.renderHeader ? (
            // Use custom header renderer if provided
            column.renderHeader(column)
          ) : (
            // Otherwise render default header with optional sort indicator
            <>
              {column.sortable ? (
                <SortableHeader>
                  <span>{column.header}</span>
                  {renderSortIndicator(column.field, sortField, sortDirection)}
                </SortableHeader>
              ) : (
                column.header
              )}
            </>
          )}
          
          {/* Render filter input if filtering is enabled and column is filterable */}
          {filtering?.enabled && column.filterable && (
            <FilterContainer>
              <FilterInput
                type="text"
                value={filtering.filters[column.field] || ''}
                onChange={(e) => handleFilterChange(column.field, e.target.value)}
                onClick={(e) => e.stopPropagation()} // Prevent sort triggering
                placeholder={`Filter ${column.header}`}
                aria-label={`Filter by ${column.header}`}
              />
            </FilterContainer>
          )}
        </StyledHeaderCell>
      ))}
    </StyledHeaderRow>
  );
};

export default TableHeader;