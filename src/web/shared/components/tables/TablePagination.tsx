import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import Button from '../buttons/Button';
import { ArrowIcon } from '../../assets/icons';

/**
 * Props for the TablePagination component
 */
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Default options for page size selector
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Container for the table pagination component
const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

// Container for pagination navigation buttons
const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

// Container for pagination information text
const PaginationInfo = styled.div`
  font-size: ${({ theme }) => theme.fonts.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Dropdown for selecting page size
const PageSizeSelector = styled.select`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.background.primary};
  font-size: ${({ theme }) => theme.fonts.size.sm};
  margin-right: ${({ theme }) => theme.spacing.md};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.text.accent};
  }
`;

// Container for page size selector and label
const PageSizeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

// Label for page size selector
const PageSizeLabel = styled.span`
  font-size: ${({ theme }) => theme.fonts.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Button for pagination navigation
const NavigationButton = styled(Button)<{ direction: 'prev' | 'next' }>`
  min-width: 36px;
  padding: ${({ theme }) => theme.spacing.xs};
  
  & svg {
    transform: ${props => props.direction === 'prev' ? 'rotate(180deg)' : 'none'};
  }
`;

/**
 * A specialized pagination component for data tables
 * Provides navigation controls for paginated table data
 */
const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showPageSizeSelector = true,
  className,
  style
}) => {
  // Calculate the range of displayed items
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  // Handle page navigation
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(Number(e.target.value));
  };
  
  return (
    <PaginationContainer className={className} style={style}>
      {showPageSizeSelector && (
        <PageSizeContainer>
          <PageSizeLabel>Rows per page:</PageSizeLabel>
          <PageSizeSelector
            value={pageSize}
            onChange={handlePageSizeChange}
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
      
      <PaginationInfo>
        {totalItems > 0 
          ? `${startItem}-${endItem} of ${totalItems} items`
          : 'No items'
        }
      </PaginationInfo>
      
      <PaginationControls>
        <NavigationButton
          variant="tertiary"
          size="small"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          direction="prev"
        >
          <ArrowIcon width="16" height="16" />
        </NavigationButton>
        
        <NavigationButton
          variant="tertiary"
          size="small"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages || totalItems === 0}
          aria-label="Next page"
          direction="next"
        >
          <ArrowIcon width="16" height="16" />
        </NavigationButton>
      </PaginationControls>
    </PaginationContainer>
  );
};

export default TablePagination;
export { TablePaginationProps };