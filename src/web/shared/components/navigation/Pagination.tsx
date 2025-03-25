import React from 'react';
import styled from 'styled-components'; // version ^5.3.6
import { theme } from '../../styles/theme';
import Button from '../buttons/Button';
import { ArrowIcon } from '../../assets/icons';

// Define pagination variants
type PaginationVariant = 'default' | 'outline' | 'minimal';

// Define pagination sizes
type PaginationSize = 'small' | 'medium' | 'large';

// Props interface for the Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  onPageSizeChange?: (pageSize: number) => void;
  variant?: PaginationVariant;
  size?: PaginationSize;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
}

// Default page size options
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Default page size
const DEFAULT_PAGE_SIZE = 10;

// Max number of page buttons to display before using ellipsis
const MAX_VISIBLE_PAGES = 7;

/**
 * Helper function to calculate the range of page numbers to display
 * Shows a limited number of pages with ellipsis for large page counts
 */
const getPageRange = (currentPage: number, totalPages: number, maxVisiblePages: number): Array<number | string> => {
  // If total pages is less than max visible pages, show all page numbers
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Always show first and last page
  // Show ellipsis when there are hidden pages
  const firstPage = 1;
  const lastPage = totalPages;

  // Determine the range of pages to show around the current page
  const rangeSize = maxVisiblePages - 2; // Accounting for first and last page
  const halfRange = Math.floor(rangeSize / 2);

  // Current page is near the beginning
  if (currentPage <= halfRange + 1) {
    return [
      ...Array.from({ length: maxVisiblePages - 1 }, (_, i) => i + 1),
      '...',
      lastPage,
    ];
  }

  // Current page is near the end
  if (currentPage >= totalPages - halfRange) {
    return [
      firstPage,
      '...',
      ...Array.from({ length: maxVisiblePages - 1 }, (_, i) => totalPages - maxVisiblePages + 2 + i),
    ].filter(page => typeof page === 'string' || page <= totalPages);
  }

  // Current page is in the middle
  return [
    firstPage,
    '...',
    ...Array.from({ length: rangeSize - 2 }, (_, i) => currentPage - Math.floor((rangeSize - 2) / 2) + i),
    currentPage,
    ...Array.from({ length: rangeSize - 2 }, (_, i) => currentPage + 1 + i),
    '...',
    lastPage,
  ].filter(page => typeof page === 'string' || (page >= 1 && page <= totalPages));
};

// Styled components
const PaginationContainer = styled.div<{ showPageSizeSelector?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${props => props.showPageSizeSelector ? 'space-between' : 'center'};
  margin: ${({ theme }) => theme.spacing.md} 0;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;

  @media (max-width: 576px) {
    justify-content: center;
    flex-direction: ${props => props.showPageSizeSelector ? 'column' : 'row'};
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
  
  @media (max-width: 576px) {
    justify-content: center;
  }
`;

const PageButton = styled.button<{
  active?: boolean;
  variant?: PaginationVariant;
  size?: PaginationSize;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  margin: 0 ${({ theme }) => theme.spacing.xxs};
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: ${({ theme }) => theme.fonts.family.primary};
  font-weight: ${({ active, theme }) => active ? theme.fonts.weight.medium : theme.fonts.weight.regular};
  
  // Size variations
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return `
          min-width: 28px;
          height: 28px;
          padding: ${theme.spacing.xxs} ${theme.spacing.xs};
          font-size: ${theme.fonts.size.xs};
          border-radius: ${theme.borders.radius.xs};
        `;
      case 'large':
        return `
          min-width: 44px;
          height: 44px;
          padding: ${theme.spacing.xs} ${theme.spacing.sm};
          font-size: ${theme.fonts.size.md};
          border-radius: ${theme.borders.radius.md};
        `;
      case 'medium':
      default:
        return `
          min-width: 36px;
          height: 36px;
          padding: ${theme.spacing.xs} ${theme.spacing.sm};
          font-size: ${theme.fonts.size.sm};
          border-radius: ${theme.borders.radius.sm};
        `;
    }
  }}
  
  // Variant styles
  ${({ variant, theme, active }) => {
    switch (variant) {
      case 'outline':
        return active
          ? `
            background-color: ${theme.colors.button.primary.background};
            color: ${theme.colors.button.primary.text};
            border-color: ${theme.colors.button.primary.border};
          `
          : `
            background-color: transparent;
            color: ${theme.colors.text.primary};
            border-color: ${theme.colors.border.light};
            
            &:hover:not(:disabled) {
              background-color: ${theme.colors.background.tertiary};
              border-color: ${theme.colors.border.medium};
            }
          `;
      case 'minimal':
        return active
          ? `
            background-color: ${theme.colors.background.tertiary};
            color: ${theme.colors.text.primary};
            border-color: transparent;
          `
          : `
            background-color: transparent;
            color: ${theme.colors.text.primary};
            border-color: transparent;
            
            &:hover:not(:disabled) {
              background-color: ${theme.colors.background.tertiary};
            }
          `;
      case 'default':
      default:
        return active
          ? `
            background-color: ${theme.colors.button.primary.background};
            color: ${theme.colors.button.primary.text};
            border-color: ${theme.colors.button.primary.border};
          `
          : `
            background-color: ${theme.colors.button.secondary.background};
            color: ${theme.colors.button.secondary.text};
            border-color: ${theme.colors.border.light};
            
            &:hover:not(:disabled) {
              background-color: ${theme.colors.button.secondary.hoverBackground};
            }
          `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.button.disabled.background};
    color: ${({ theme }) => theme.colors.button.disabled.text};
    border-color: ${({ theme }) => theme.colors.button.disabled.border};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.button.primary.background};
    outline-offset: 2px;
  }
`;

const PageSizeSelector = styled.select<{ size?: PaginationSize }>`
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  background-color: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return `
          height: 28px;
          font-size: ${theme.fonts.size.xs};
        `;
      case 'large':
        return `
          height: 44px;
          font-size: ${theme.fonts.size.md};
        `;
      case 'medium':
      default:
        return `
          height: 36px;
          font-size: ${theme.fonts.size.sm};
        `;
    }
  }}
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.button.primary.background};
    outline-offset: 2px;
  }
`;

const PageSizeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  white-space: nowrap;
  
  @media (max-width: 576px) {
    margin-top: ${({ theme }) => theme.spacing.xs};
  }
`;

const Ellipsis = styled.span<{ size?: PaginationSize }>`
  margin: 0 ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  user-select: none;
  align-self: center;
  
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return `font-size: ${theme.fonts.size.xs};`;
      case 'large':
        return `font-size: ${theme.fonts.size.md};`;
      case 'medium':
      default:
        return `font-size: ${theme.fonts.size.sm};`;
    }
  }}
`;

const NavigationButton = styled(Button)<{ direction: 'left' | 'right' }>`
  svg {
    transform: ${({ direction }) => direction === 'left' ? 'rotate(180deg)' : 'none'};
  }
  margin: 0 ${({ theme }) => theme.spacing.xs};
`;

/**
 * A reusable pagination component that provides navigation controls for paginated content.
 * Supports different visual variants, sizes, and customization options while maintaining
 * accessibility standards.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages: propsTotalPages,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
  totalItems,
  onPageSizeChange,
  variant = 'default',
  size = 'medium',
  showPageSizeSelector = false,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}) => {
  // Calculate total pages if totalItems is provided but totalPages is not
  const totalPages = propsTotalPages || (totalItems ? Math.ceil(totalItems / pageSize) : 1);
  
  // Generate the page range to display
  const pageRange = getPageRange(currentPage, totalPages, MAX_VISIBLE_PAGES);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };
  
  return (
    <PaginationContainer showPageSizeSelector={showPageSizeSelector} role="navigation" aria-label="Pagination">
      <PaginationControls>
        {/* Previous button */}
        <NavigationButton
          direction="left"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          variant={variant === 'default' ? 'primary' : variant === 'minimal' ? 'text' : 'outline'}
          size={size}
          aria-label="Previous page"
        >
          <ArrowIcon 
            width={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
            height={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
          />
        </NavigationButton>
        
        {/* Page buttons */}
        {pageRange.map((page, index) => {
          if (typeof page === 'string') {
            return <Ellipsis key={`ellipsis-${index}`} size={size} aria-hidden="true">...</Ellipsis>;
          }
          
          return (
            <PageButton
              key={`page-${page}`}
              active={page === currentPage}
              onClick={() => handlePageChange(Number(page))}
              variant={variant}
              size={size}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Page ${page}`}
              type="button"
            >
              {page}
            </PageButton>
          );
        })}
        
        {/* Next button */}
        <NavigationButton
          direction="right"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          variant={variant === 'default' ? 'primary' : variant === 'minimal' ? 'text' : 'outline'}
          size={size}
          aria-label="Next page"
        >
          <ArrowIcon 
            width={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
            height={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
          />
        </NavigationButton>
      </PaginationControls>
      
      {/* Page size selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <PageSizeContainer>
          <label htmlFor="pageSize">
            Items per page:
          </label>
          <PageSizeSelector
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            size={size}
            aria-label="Select page size"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </PageSizeSelector>
        </PageSizeContainer>
      )}
    </PaginationContainer>
  );
};

export { PaginationProps, PaginationVariant, PaginationSize };
export default Pagination;