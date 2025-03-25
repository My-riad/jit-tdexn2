import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import TableHeader, { SortDirection, ColumnDefinition } from './TableHeader';
import TableRow from './TableRow';
import TableCell from './TableCell';
import TablePagination from './TablePagination';
import LoadingIndicator from '../feedback/LoadingIndicator';
import useDebounce from '../../../common/hooks/useDebounce';

// Default values for the data table
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_EMPTY_STATE_MESSAGE = 'No data available';
const DEFAULT_FILTER_DEBOUNCE_TIME = 300;

// Enum for row selection types
export enum SelectionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple'
}

// Enum for sort direction options
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

// Styled components
const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: ${theme.borders.radius.md};
  border: 1px solid ${theme.colors.border.light};
  background-color: ${theme.colors.background.primary};
  position: relative;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const TableBody = styled.tbody`
  width: 100%;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.text.secondary};
  font-style: italic;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1;
`;

const FilterInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.xs};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borders.radius.sm};
  font-size: 0.9em;
  margin-top: ${theme.spacing.xs};
`;

// Props interfaces
export interface DataTableProps<T> {
  /** Array of data items to display in the table */
  data: Array<T>;
  /** Array of column definitions that determine how to display the data */
  columns: Array<ColumnDefinition<T>>;
  /** Whether the table is in a loading state */
  loading?: boolean;
  /** Message to display when there is no data */
  emptyStateMessage?: string;
  /** Pagination options */
  pagination?: PaginationOptions;
  /** Sorting options */
  sorting?: SortingOptions<T>;
  /** Filtering options */
  filtering?: FilteringOptions<T>;
  /** Selection options */
  selection?: SelectionOptions<T>;
  /** Row customization options */
  rowProps?: RowProps<T>;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export interface PaginationOptions {
  /** Whether pagination is enabled */
  enabled?: boolean;
  /** Number of items per page */
  pageSize?: number;
  /** Current page number (1-based) */
  currentPage?: number;
  /** Total number of items (for server-side pagination) */
  totalItems?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Whether to show the page size selector */
  showPageSizeSelector?: boolean;
}

export interface SortingOptions<T> {
  /** Whether sorting is enabled */
  enabled?: boolean;
  /** Default field to sort by */
  defaultSortField?: string;
  /** Default sort direction */
  defaultSortDirection?: SortDirection;
  /** Callback when sort changes */
  onSort?: (field: string, direction: SortDirection) => void;
  /** Custom sort function */
  sortFunction?: (a: T, b: T, field: string, direction: SortDirection) => number;
}

export interface FilteringOptions<T> {
  /** Whether filtering is enabled */
  enabled?: boolean;
  /** Default filter values by field */
  defaultFilters?: Record<string, string>;
  /** Callback when filters change */
  onFilter?: (filters: Record<string, string>) => void;
  /** Custom filter function */
  filterFunction?: (data: T[], filters: Record<string, string>) => T[];
  /** Debounce time for filtering in milliseconds */
  debounceTime?: number;
}

export interface SelectionOptions<T> {
  /** Whether selection is enabled */
  enabled?: boolean;
  /** Type of selection (single or multiple) */
  selectionType?: SelectionType;
  /** Currently selected row IDs */
  selectedRows?: Array<string | number>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedRows: Array<string | number>, selectedItems: Array<T>) => void;
  /** Function to get a unique identifier from a row */
  getRowId?: (row: T) => string | number;
}

export interface RowProps<T> {
  /** Whether rows are clickable */
  isClickable?: boolean;
  /** Callback when a row is clicked */
  onClick?: (row: T, index: number) => void;
  /** Function to get custom class name for a row */
  getRowClassName?: (row: T, index: number) => string;
  /** Function to get custom style for a row */
  getRowStyle?: (row: T, index: number) => React.CSSProperties;
}

/**
 * A comprehensive data table component with sorting, filtering, pagination, and selection capabilities.
 * 
 * @template T The data type for table rows
 */
function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyStateMessage = DEFAULT_EMPTY_STATE_MESSAGE,
  pagination = { enabled: false },
  sorting = { enabled: false },
  filtering = { enabled: false },
  selection = { enabled: false },
  rowProps = {},
  className,
  style,
}: DataTableProps<T>): JSX.Element {
  // Initialize pagination state
  const [currentPage, setCurrentPage] = useState<number>(pagination.currentPage || 1);
  const [pageSize, setPageSize] = useState<number>(pagination.pageSize || DEFAULT_PAGE_SIZE);
  
  // Initialize sorting state
  const [sortField, setSortField] = useState<string | undefined>(sorting.defaultSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    sorting.defaultSortDirection || SortDirection.ASC
  );
  
  // Initialize filtering state
  const [filters, setFilters] = useState<Record<string, string>>(
    filtering.defaultFilters || {}
  );
  
  // Create debounced filter values
  const debouncedFilters = useDebounce(
    filters,
    filtering.debounceTime || DEFAULT_FILTER_DEBOUNCE_TIME
  );
  
  // Initialize selection state
  const [selectedRows, setSelectedRows] = useState<Array<string | number>>(
    selection.selectedRows || []
  );
  
  // Reset current page when data changes
  useEffect(() => {
    if (pagination.enabled) {
      setCurrentPage(1);
    }
  }, [data.length, pageSize, debouncedFilters]);
  
  // Update state from props when they change
  useEffect(() => {
    if (pagination.currentPage !== undefined && pagination.currentPage !== currentPage) {
      setCurrentPage(pagination.currentPage);
    }
    if (pagination.pageSize !== undefined && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  }, [pagination.currentPage, pagination.pageSize]);
  
  useEffect(() => {
    if (sorting.defaultSortField !== undefined && sorting.defaultSortField !== sortField) {
      setSortField(sorting.defaultSortField);
    }
    if (sorting.defaultSortDirection !== undefined && sorting.defaultSortDirection !== sortDirection) {
      setSortDirection(sorting.defaultSortDirection);
    }
  }, [sorting.defaultSortField, sorting.defaultSortDirection]);
  
  useEffect(() => {
    if (selection.selectedRows !== undefined) {
      setSelectedRows(selection.selectedRows);
    }
  }, [selection.selectedRows]);
  
  // Filter data based on filters
  const filteredData = useMemo(() => {
    if (!filtering.enabled || Object.keys(debouncedFilters).length === 0) {
      return data;
    }
    
    if (filtering.filterFunction) {
      return filtering.filterFunction(data, debouncedFilters);
    }
    
    return data.filter(item => {
      return Object.entries(debouncedFilters).every(([field, value]) => {
        if (!value.trim()) return true;
        
        const fieldValue = getNestedValue(item, field);
        if (fieldValue === undefined || fieldValue === null) return false;
        
        return String(fieldValue).toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [data, debouncedFilters, filtering.enabled, filtering.filterFunction]);
  
  // Sort data based on sort field and direction
  const sortedData = useMemo(() => {
    if (!sorting.enabled || !sortField) {
      return filteredData;
    }
    
    if (sorting.sortFunction) {
      return [...filteredData].sort((a, b) => 
        sorting.sortFunction!(a, b, sortField, sortDirection)
      );
    }
    
    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortField);
      const bValue = getNestedValue(b, sortField);
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === SortDirection.ASC
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === SortDirection.ASC
        ? (aValue > bValue ? 1 : -1)
        : (bValue > aValue ? 1 : -1);
    });
  }, [filteredData, sortField, sortDirection, sorting.enabled, sorting.sortFunction]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination.enabled) {
      return sortedData;
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, pagination.enabled, currentPage, pageSize]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!pagination.enabled) return 1;
    
    const totalItems = pagination.totalItems !== undefined 
      ? pagination.totalItems 
      : sortedData.length;
      
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [pagination.enabled, pagination.totalItems, sortedData.length, pageSize]);
  
  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (pagination.onPageChange) {
      pagination.onPageChange(page);
    }
  }, [pagination.onPageChange]);
  
  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    if (pagination.onPageSizeChange) {
      pagination.onPageSizeChange(size);
    }
  }, [pagination.onPageSizeChange]);
  
  // Handle sort change
  const handleSort = useCallback((field: string, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    if (sorting.onSort) {
      sorting.onSort(field, direction);
    }
  }, [sorting.onSort]);
  
  // Handle filter change
  const handleFilter = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters);
    if (filtering.onFilter) {
      filtering.onFilter(newFilters);
    }
  }, [filtering.onFilter]);
  
  // Handle row selection
  const handleRowSelect = useCallback((rowId: string | number, isSelected: boolean) => {
    if (!selection.enabled) return;
    
    let newSelectedRows: Array<string | number>;
    
    if (selection.selectionType === SelectionType.SINGLE) {
      newSelectedRows = isSelected ? [rowId] : [];
    } else {
      if (isSelected) {
        newSelectedRows = [...selectedRows, rowId];
      } else {
        newSelectedRows = selectedRows.filter(id => id !== rowId);
      }
    }
    
    setSelectedRows(newSelectedRows);
    
    if (selection.onSelectionChange) {
      const selectedItems = sortedData.filter(row => {
        const id = selection.getRowId 
          ? selection.getRowId(row) 
          : (row as any).id;
        return newSelectedRows.includes(id);
      });
      selection.onSelectionChange(newSelectedRows, selectedItems);
    }
  }, [selection, selectedRows, sortedData]);
  
  // Handle row click
  const handleRowClick = useCallback((row: T, index: number) => {
    if (!rowProps.isClickable || !rowProps.onClick) return;
    rowProps.onClick(row, index);
  }, [rowProps]);
  
  // Utility function to get nested value from an object
  const getNestedValue = (obj: any, path: string) => {
    const keys = path.split('.');
    return keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
  };
  
  // Determine if table is empty
  const isEmpty = paginatedData.length === 0;
  
  // Render the component
  return (
    <TableContainer className={className} style={style}>
      {loading && (
        <LoadingOverlay>
          <LoadingIndicator size="md" />
        </LoadingOverlay>
      )}
      
      <StyledTable role="table" aria-busy={loading}>
        <TableHeader
          columns={columns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={sorting.enabled ? handleSort : undefined}
          filtering={filtering.enabled ? {
            enabled: true,
            filters,
            onFilter: handleFilter
          } : undefined}
        />
        
        <TableBody>
          {!isEmpty ? (
            paginatedData.map((row, rowIndex) => {
              const rowId = selection.getRowId ? selection.getRowId(row) : (row as any).id;
              const isSelected = selection.enabled 
                ? selectedRows.includes(rowId) 
                : false;
              
              return (
                <TableRow
                  key={rowId !== undefined ? String(rowId) : rowIndex}
                  selected={isSelected}
                  selectable={selection.enabled}
                  isClickable={rowProps.isClickable}
                  onClick={() => {
                    if (selection.enabled) {
                      handleRowSelect(rowId, !isSelected);
                    }
                    if (rowProps.isClickable) {
                      handleRowClick(row, rowIndex);
                    }
                  }}
                  className={rowProps.getRowClassName ? rowProps.getRowClassName(row, rowIndex) : ''}
                  style={rowProps.getRowStyle ? rowProps.getRowStyle(row, rowIndex) : {}}
                  data-testid={`table-row-${rowIndex}`}
                >
                  {columns.map((column, columnIndex) => (
                    <TableCell
                      key={`cell-${column.field || columnIndex}`}
                      align={column.align}
                      truncate={column.truncate}
                      width={column.width}
                      data-testid={`table-cell-${rowIndex}-${columnIndex}`}
                    >
                      {column.renderCell 
                        ? column.renderCell(row, rowIndex) 
                        : getNestedValue(row, column.field)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <EmptyStateContainer>
                  {emptyStateMessage}
                </EmptyStateContainer>
              </td>
            </tr>
          )}
        </TableBody>
      </StyledTable>
      
      {pagination.enabled && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={pagination.totalItems !== undefined ? pagination.totalItems : sortedData.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={pagination.pageSizeOptions}
          showPageSizeSelector={pagination.showPageSizeSelector}
        />
      )}
    </TableContainer>
  );
}

export default DataTable;
export { DataTable, DataTableProps, ColumnDefinition, SortDirection };