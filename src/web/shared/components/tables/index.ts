# src/web/shared/components/tables/index.ts
```typescript
import React from 'react'; // version ^18.2.0
import DataTable, {
  DataTableProps,
  ColumnDefinition,
  SortDirection,
} from './DataTable';
import TableHeader, { TableHeaderProps } from './TableHeader';
import TableRow, { TableRowProps } from './TableRow';
import TableCell, { TableCellProps, CellAlignment } from './TableCell';
import TablePagination, { TablePaginationProps } from './TablePagination';

/**
 * Exports all table-related components and types from the tables directory.
 * This file serves as the central export point for the table component system
 * used throughout the AI-driven Freight Optimization Platform, providing a clean
 * API for importing table components.
 *
 * @file This file addresses the following requirements:
 *       - Common UI Elements - Tables: Sortable, filterable data with pagination
 *         (Technical Specifications/7.1 DESIGN PRINCIPLES/7.1.3 Common UI Elements)
 *       - Accessibility: WCAG 2.1 AA compliance for all interfaces
 *         (Technical Specifications/7.1 DESIGN PRINCIPLES/7.1.1 Overall Design Philosophy)
 *       - Responsive Design: Adapts to different screen sizes and orientations
 *         (Technical Specifications/7.1 DESIGN PRINCIPLES/7.1.1 Overall Design Philosophy)
 */

// Export DataTable component for use in other components
export { DataTable };

// Export TableHeader component for use in other components
export { TableHeader };

// Export TableRow component for use in other components
export { TableRow };

// Export TableCell component for use in other components
export { TableCell };

// Export TablePagination component for use in other components
export { TablePagination };

// Export DataTable props interface for type checking
export type { DataTableProps };

// Export ColumnDefinition interface for type checking
export type { ColumnDefinition };

// Export TableHeader props interface for type checking
export type { TableHeaderProps };

// Export TableRow props interface for type checking
export type { TableRowProps };

// Export TableCell props interface for type checking
export type { TableCellProps };

// Export TablePagination props interface for type checking
export type { TablePaginationProps };

// Export SortDirection enum for sorting functionality
export { SortDirection };

// Export CellAlignment enum for cell alignment options
export { CellAlignment };