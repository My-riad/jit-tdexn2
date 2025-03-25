import React, { useState, useEffect, useCallback, useMemo } from 'react'; // react ^17.0.2
import styled from 'styled-components'; // styled-components ^5.3.5
import { useDispatch, useSelector } from 'react-redux'; // react-redux ^7.2.6
import { FiEdit, FiTrash2, FiEye, FiFilter, FiSearch, FiRefreshCw } from 'react-icons/fi'; // react-icons/fi ^4.7.1

import DataTable, { ColumnDefinition, SortDirection } from '../../../shared/components/tables/DataTable';
import Button from '../../../shared/components/buttons/Button';
import IconButton from '../../../shared/components/buttons/IconButton';
import Card from '../../../shared/components/cards/Card';
import LoadDetailCard from './LoadDetailCard';
import Modal from '../../../shared/components/feedback/Modal';
import Input from '../../../shared/components/forms/Input';
import Select from '../../../shared/components/forms/Select';
import DatePicker from '../../../shared/components/forms/DatePicker';
import { LoadStatus, EquipmentType, Load, LoadSummary, LoadSearchParams } from '../../../common/interfaces/load.interface';
import { fetchLoads, fetchLoadDetail, deleteLoad, updateLoadStatus } from '../../store/actions/loadActions';
import useDebounce from '../../../common/hooks/useDebounce';
import { formatCurrency, formatDistance, formatWeight, formatDate, formatLoadStatus } from '../../../common/utils/formatters';

// Define default values for constants
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_REFRESH_INTERVAL = 300000; // 5 minutes

// Define the LoadListProps interface
export interface LoadListProps {
  carrierId: string;
  initialFilters?: Partial<LoadSearchParams>;
  showActions?: boolean;
  onLoadSelect?: (load: LoadSummary) => void;
  refreshInterval?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Styled component for the LoadList container
const LoadListContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Styled component for the filter container
const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: flex-end;
`;

// Styled component for the filter group
const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
`;

// Styled component for the search container
const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-grow: 1;
  max-width: 400px;
`;

// Styled component for the action container
const ActionContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
`;

// Styled component for the status badge
const StatusBadge = styled.span<{ status: LoadStatus }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${props => getStatusColor(props.status)};
  color: white;
`;

// Styled component for the efficiency score
const EfficiencyScore = styled.div<{ score: number }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: ${props => getScoreColor(props.score)};
`;

// Helper function to get the status color
const getStatusColor = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.COMPLETED:
      return '#34A853';
    case LoadStatus.IN_TRANSIT:
      return '#1A73E8';
    case LoadStatus.PENDING:
      return '#FBBC04';
    case LoadStatus.CANCELLED:
      return '#EA4335';
    default:
      return '#9AA0A6';
  }
};

// Helper function to get the score color
const getScoreColor = (score: number): string => {
  if (score >= 90) {
    return '#34A853';
  } else if (score >= 70) {
    return '#FBBC04';
  } else {
    return '#EA4335';
  }
};

// Main component for displaying a list of loads
const LoadList: React.FC<LoadListProps> = ({
  carrierId,
  initialFilters,
  showActions = true,
  onLoadSelect,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  className,
  style,
}) => {
  // LD1: Set up state for search query, filters, pagination, sorting, and selected load
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Partial<LoadSearchParams>>(initialFilters || {});
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('pickupDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.ASC);
  const [selectedLoad, setSelectedLoad] = useState<LoadWithDetails | null>(null);

  // LD1: Set up state for detail modal visibility
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // LD1: Create debounced search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // LD1: Use useSelector to get loads, loading state, error, and pagination info from Redux store
  const { loads, loading, error, total, limit } = useSelector((state: any) => state.load);

  // LD1: Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // LD1: Define useEffect to fetch loads when component mounts or filters change
  useEffect(() => {
    const searchParams: LoadSearchParams = {
      ...filters,
      referenceNumber: debouncedSearchQuery,
      page: page,
      limit: limit || DEFAULT_PAGE_SIZE,
      sortBy: sortField,
      sortDirection: sortDirection,
    };
    dispatch(fetchLoads({ carrierId, searchParams }));
  }, [carrierId, debouncedSearchQuery, filters, page, sortField, sortDirection, limit, dispatch]);

  // LD1: Define useEffect to set up auto-refresh interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch(fetchLoads({ carrierId }));
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [carrierId, refreshInterval, dispatch]);

  // LD1: Define column definitions for the DataTable component
  const columns: ColumnDefinition<LoadSummary>[] = useMemo(() => [
    { header: 'Load ID', field: 'id', width: '10%', sortable: true },
    { header: 'Reference', field: 'referenceNumber', width: '15%', sortable: true },
    { header: 'Origin', field: 'origin', width: '15%', sortable: false },
    { header: 'Destination', field: 'destination', width: '15%', sortable: false },
    { header: 'Equipment', field: 'equipmentType', width: '10%', sortable: false },
    { header: 'Weight', field: 'weight', width: '8%', sortable: true, renderCell: (load) => formatWeight(load.weight) },
    { header: 'Pickup Date', field: 'pickupDate', width: '12%', sortable: true, renderCell: (load) => formatDate(load.pickupDate) },
    { header: 'Status', field: 'status', width: '10%', sortable: false, renderCell: (load) => <StatusBadge status={load.status}>{formatLoadStatus(load.status)}</StatusBadge> },
    { header: 'Efficiency', field: 'efficiencyScore', width: '10%', sortable: true, renderCell: (load) => <EfficiencyScore score={load.efficiencyScore}>{load.efficiencyScore}</EfficiencyScore> },
  ], []);

  // LD1: Define handlers for row click, edit, delete, and view actions
  const handleRowClick = useCallback((load: LoadSummary) => {
    setSelectedLoad(null);
    dispatch(fetchLoadDetail({ loadId: load.id }));
    setIsDetailModalOpen(true);
    if (onLoadSelect) {
      onLoadSelect(load);
    }
  }, [dispatch, onLoadSelect]);

  const handleEdit = useCallback((loadId: string) => {
    // Implement edit logic here
    console.log(`Edit load ${loadId}`);
  }, []);

  const handleDelete = useCallback((loadId: string) => {
    dispatch(deleteLoad({ loadId }));
  }, [dispatch]);

  const handleView = useCallback((loadId: string) => {
    dispatch(fetchLoadDetail({ loadId }));
    setIsDetailModalOpen(true);
  }, [dispatch]);

  // LD1: Define handlers for search, filter, sort, and pagination changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleFilterChange = (newFilters: Partial<LoadSearchParams>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter
  };

  const handleSortChange = (field: string, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // LD1: Define handler for refreshing the load list
  const handleRefresh = useCallback(() => {
    dispatch(fetchLoads({ carrierId }));
  }, [carrierId, dispatch]);

  // LD1: Define helper functions for generating filter options
  const statusOptions = useMemo(() => getStatusOptions(), []);
  const equipmentOptions = useMemo(() => getEquipmentOptions(), []);

  return (
    <LoadListContainer className={className} style={style}>
      <Card>
        <FilterContainer>
          <SearchContainer>
            <Input
              type="search"
              placeholder="Search loads..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <IconButton ariaLabel="Search" onClick={() => dispatch(fetchLoads({ carrierId }))}>
              <FiSearch />
            </IconButton>
          </SearchContainer>
          <FilterGroup>
            <label htmlFor="status-filter">Status:</label>
            <Select
              id="status-filter"
              name="status"
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
            />
          </FilterGroup>
          <FilterGroup>
            <label htmlFor="equipment-filter">Equipment:</label>
            <Select
              id="equipment-filter"
              name="equipment"
              options={equipmentOptions}
              value={filters.equipmentType || ''}
              onChange={(e) => handleFilterChange({ ...filters, equipmentType: e.target.value })}
            />
          </FilterGroup>
          <FilterGroup>
            <label htmlFor="pickup-date-filter">Pickup Date:</label>
            <DatePicker
              id="pickup-date-filter"
              name="pickupDate"
              placeholderText="Select date..."
              value={filters.pickupDateStart || null}
              onChange={(date) => handleFilterChange({ ...filters, pickupDateStart: date?.toISOString() })}
            />
          </FilterGroup>
          <ActionContainer>
            <IconButton ariaLabel="Filter" onClick={() => dispatch(fetchLoads({ carrierId }))}>
              <FiFilter />
            </IconButton>
            <IconButton ariaLabel="Refresh" onClick={handleRefresh}>
              <FiRefreshCw />
            </IconButton>
          </ActionContainer>
        </FilterContainer>
        <DataTable
          data={loads || []}
          columns={columns}
          loading={loading}
          pagination={{
            enabled: true,
            currentPage: page,
            pageSize: limit || DEFAULT_PAGE_SIZE,
            totalItems: total,
            onPageChange: handlePageChange,
          }}
          sorting={{
            enabled: true,
            defaultSortField: sortField,
            defaultSortDirection: sortDirection,
            onSort: handleSortChange,
          }}
          rowProps={{
            isClickable: true,
            onClick: handleRowClick,
          }}
        />
      </Card>
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Load Details"
      >
        {selectedLoad && <LoadDetailCard
          load={selectedLoad}
          onEdit={() => handleEdit(selectedLoad.id)}
          onAssign={() => console.log(`Assign load ${selectedLoad.id}`)}
          onUpdateStatus={() => console.log(`Update status for load ${selectedLoad.id}`)}
          onViewDocuments={() => console.log(`View documents for load ${selectedLoad.id}`)}
          onViewMap={() => console.log(`View map for load ${selectedLoad.id}`)}
        />}
      </Modal>
    </LoadListContainer>
  );
};

// Helper function to generate status filter options
const getStatusOptions = () => {
  return [
    { value: '', label: 'All' },
    ...Object.values(LoadStatus).map(status => ({
      value: status,
      label: formatLoadStatus(status),
    })),
  ];
};

// Helper function to generate equipment type filter options
const getEquipmentOptions = () => {
  return [
    { value: '', label: 'All' },
    ...Object.values(EquipmentType).map(equipment => ({
      value: equipment,
      label: equipment,
    })),
  ];
};

// Helper function to format a load object for display in the table
const formatLoadRow = (load: Load) => {
  return {
    ...load,
    origin: `${load.locations[0].address.city}, ${load.locations[0].address.state}`,
    destination: `${load.locations[load.locations.length - 1].address.city}, ${load.locations[load.locations.length - 1].address.state}`,
    weight: formatWeight(load.weight),
    rate: formatCurrency(load.offeredRate),
    distance: formatDistance(304), // Replace with actual distance
    pickupDate: formatDate(load.pickupEarliest),
    deliveryDate: formatDate(load.deliveryLatest),
    status: formatLoadStatus(load.status),
  };
};

export default LoadList;