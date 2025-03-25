import React, { useState, useEffect, useCallback, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { TruckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // version ^2.0.13
import DataTable, { ColumnDefinition, SortDirection } from '../../../shared/components/tables/DataTable';
import Button from '../../../shared/components/buttons/Button';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Alert from '../../../shared/components/feedback/Alert';
import Card from '../../../shared/components/cards/Card';
import FlexBox from '../../../shared/components/layout/FlexBox';
import Badge from '../../../shared/components/feedback/Badge';
import ScoreDisplay from '../../../shared/components/gamification/ScoreDisplay';
import { Carrier, CarrierSummary } from '../../../common/interfaces/carrier.interface';
import { getCarriers } from '../../services/carrierService';
import { theme } from '../../../shared/styles/theme';
import useDebounce from '../../../common/hooks/useDebounce';

/**
 * Props for the CarrierList component
 */
interface CarrierListProps {
  /**
   * Callback function when a carrier is selected
   * @param carrierId - The ID of the selected carrier
   */
  onSelectCarrier: (carrierId: string) => void;
  /**
   * ID of the currently selected carrier
   */
  selectedCarrierId?: string;
  /**
   * Filter options for the carrier list
   */
  filters?: CarrierFilterOptions;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Whether to show action buttons
   */
  showActions?: boolean;
}

/**
 * Filter options for the carrier list
 */
interface CarrierFilterOptions {
  /**
   * Search term for filtering carriers
   */
  search?: string;
  /**
   * Filter by active status
   */
  active?: boolean;
  /**
   * Field to sort by
   */
  sortBy?: string;
  /**
   * Sort direction
   */
  sortOrder?: 'asc' | 'desc';
  /**
   * Current page number
   */
  page?: number;
  /**
   * Number of items per page
   */
  limit?: number;
}

/**
 * Styled Card component for the carrier list
 */
const StyledCard = styled(Card)`
  width: 100%;
  overflow: hidden;
  padding: 0;
`;

/**
 * Container for carrier name and icon
 */
const CarrierNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

/**
 * Wrapper for truck icon
 */
const TruckIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: ${theme.colors.primary.light};
  border-radius: 50%;
`;

/**
 * Styled truck icon
 */
const StyledTruckIcon = styled(TruckIcon)`
  width: 20px;
  height: 20px;
  color: ${theme.colors.primary.main};
`;

/**
 * Container for carrier name and DOT number
 */
const CarrierInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

/**
 * Styled carrier name
 */
const CarrierName = styled.span`
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Styled DOT number
 */
const DotNumber = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

/**
 * Container for action buttons
 */
const ActionButtonsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

/**
 * Container for empty state message
 */
const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  text-align: center;
  color: ${theme.colors.text.secondary};
`;

/**
 * Default number of carriers per page
 */
const DEFAULT_PAGE_SIZE = 10;

/**
 * Default filter values for the carrier list
 */
const DEFAULT_FILTERS: CarrierFilterOptions = {
  active: true,
  page: 1,
  limit: 10,
  sortBy: 'name',
  sortOrder: 'asc',
};

/**
 * Delay in milliseconds for debouncing search input
 */
const DEBOUNCE_DELAY = 300;

/**
 * Formats the fleet size number with appropriate suffix
 * @param size - The fleet size number
 */
const formatFleetSize = (size: number): string => {
  return `${size} trucks`;
};

/**
 * Returns the appropriate color for a carrier status
 * @param active - Whether the carrier is active
 */
const getStatusColor = (active: boolean): string => {
  return active ? theme.colors.semantic.success : theme.colors.semantic.error;
};

/**
 * Component that displays a list of carriers with filtering, sorting, and pagination capabilities
 */
const CarrierList: React.FC<CarrierListProps> = ({
  onSelectCarrier,
  selectedCarrierId,
  filters,
  className,
  showActions = true,
}) => {
  // Initialize state for carriers data, loading state, error state, and pagination info
  const [carriers, setCarriers] = useState<CarrierSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCarriers, setTotalCarriers] = useState<number>(0);

  // Initialize state for current filters using provided filters or defaults
  const [currentFilters, setCurrentFilters] = useState<CarrierFilterOptions>(filters || DEFAULT_FILTERS);

  // Create debouncedSearchTerm using useDebounce hook to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(currentFilters.search || '', DEBOUNCE_DELAY);

  // Define fetchCarriers function to load carrier data with current filters
  const fetchCarriers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        ...currentFilters,
        search: debouncedSearchTerm,
      };
      const { carriers: fetchedCarriers, total: fetchedTotal } = await getCarriers(params);
      setCarriers(fetchedCarriers);
      setTotalCarriers(fetchedTotal);
    } catch (e: any) {
      setError(e.message || 'Failed to load carriers.');
    } finally {
      setLoading(false);
    }
  }, [currentFilters, debouncedSearchTerm]);

  // Define handlePageChange function to update current page
  const handlePageChange = (page: number) => {
    setCurrentFilters((prevFilters) => ({
      ...prevFilters,
      page,
    }));
  };

  // Define handleSortChange function to update sort field and direction
  const handleSortChange = (sortBy: string, sortOrder: SortDirection) => {
    setCurrentFilters((prevFilters) => ({
      ...prevFilters,
      sortBy,
      sortOrder,
    }));
  };

  // Define handleRowClick function to handle carrier selection
  const handleRowClick = (carrierId: string) => {
    onSelectCarrier(carrierId);
  };

  // Define column definitions for the DataTable component
  const columns: ColumnDefinition<CarrierSummary>[] = useMemo(() => [
    {
      field: 'name',
      header: 'Carrier Name',
      sortable: true,
      filterable: true,
      width: '25%',
      renderCell: (carrier) => (
        <CarrierNameContainer>
          <TruckIconWrapper>
            <StyledTruckIcon />
          </TruckIconWrapper>
          <CarrierInfo>
            <CarrierName>{carrier.name}</CarrierName>
            <DotNumber>DOT: {carrier.dotNumber}</DotNumber>
          </CarrierInfo>
        </CarrierNameContainer>
      ),
    },
    {
      field: 'status',
      header: 'Status',
      width: '15%',
      renderCell: (carrier) => (
        <Badge variant={carrier.active ? 'success' : 'error'}>
          {carrier.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      field: 'fleetSize',
      header: 'Fleet Size',
      sortable: true,
      width: '15%',
      renderCell: (carrier) => formatFleetSize(carrier.fleetSize),
    },
    {
      field: 'averageEfficiencyScore',
      header: 'Efficiency Score',
      sortable: true,
      width: '20%',
      align: 'center',
      renderCell: (carrier) => (
        <ScoreDisplay score={carrier.averageEfficiencyScore} size="small" showChange={false} />
      ),
    },
    {
      header: 'Actions',
      width: '25%',
      renderCell: (carrier) => (
        showActions ? (
          <ActionButtonsContainer>
            <Button size="small" onClick={() => onSelectCarrier(carrier.id)}>
              Select
            </Button>
          </ActionButtonsContainer>
        ) : null
      ),
    },
  ], [onSelectCarrier, showActions]);

  // Use useEffect to load carriers when filters change or on component mount
  useEffect(() => {
    fetchCarriers();
  }, [fetchCarriers]);

  // Use useEffect to update internal filters when props.filters changes
  useEffect(() => {
    if (filters) {
      setCurrentFilters(filters);
    }
  }, [filters]);

  return (
    <StyledCard className={className}>
      {error && <Alert severity="error" message={error} />}
      {loading && <LoadingIndicator />}
      <DataTable
        data={carriers}
        columns={columns}
        loading={loading}
        emptyStateMessage="No carriers found."
        pagination={{
          enabled: true,
          pageSize: currentFilters.limit || DEFAULT_PAGE_SIZE,
          currentPage: currentFilters.page || 1,
          totalItems: totalCarriers,
          onPageChange: handlePageChange,
        }}
        sorting={{
          enabled: true,
          defaultSortField: currentFilters.sortBy || 'name',
          defaultSortDirection: currentFilters.sortOrder === 'desc' ? SortDirection.DESC : SortDirection.ASC,
          onSort: handleSortChange,
        }}
        rowProps={{
          isClickable: true,
          onClick: (carrier) => handleRowClick(carrier.id),
          getRowClassName: (carrier) => (carrier.id === selectedCarrierId ? 'selected' : ''),
        }}
      />
    </StyledCard>
  );
};

export default CarrierList;