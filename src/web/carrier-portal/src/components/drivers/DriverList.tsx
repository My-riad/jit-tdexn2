import React, { useEffect, useState, useCallback } from 'react'; // React core and hooks for component functionality // version ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // Redux hooks for state management // version ^8.0.5
import { useNavigate } from 'react-router-dom'; // React Router hook for navigation // version ^6.8.1
import styled from 'styled-components'; // CSS-in-JS styling solution // version ^5.3.6

import DataTable, { ColumnDefinition } from '../../../shared/components/tables/DataTable'; // Reusable data table component for displaying driver list
import Button from '../../../shared/components/buttons/Button'; // Button component for actions
import Input from '../../../shared/components/forms/Input'; // Input component for search functionality
import Select from '../../../shared/components/forms/Select'; // Select component for status filtering
import Badge from '../../../shared/components/feedback/Badge'; // Badge component for status indicators
import ProgressBar from '../../../shared/components/feedback/ProgressBar'; // Progress bar for efficiency score visualization
import FlexBox from '../../../shared/components/layout/FlexBox'; // Flexible layout component

import { 
  Driver, 
  DriverStatus,
  DriverSearchParams 
} from '../../../common/interfaces/driver.interface'; // Type definitions for driver data
import { 
  fetchDrivers,
  searchDrivers
} from '../../store/actions/driverActions'; // Redux actions for fetching driver data
import useDebounce from '../../../common/hooks/useDebounce'; // Hook for debouncing search input
import { formatHoursMinutes } from '../../../common/utils/formatters'; // Utility for formatting hours and minutes
import { ProfileIcon } from '../../../shared/assets/icons';

// Styled Components
const Container = styled.div`
  width: 100%;
  padding: 1rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SearchContainer = styled.div`
  flex: 1;
  min-width: 250px;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

interface StatusBadgeProps {
  status: DriverStatus;
}

const StatusBadge = styled(Badge)<StatusBadgeProps>`
  background-color: ${props => getStatusColor(props.status)};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ScoreValue = styled.span`
  font-weight: bold;
  min-width: 2rem;
`;

const HoursContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const HoursRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
`;

const HoursLabel = styled.span`
  color: #666;
`;

interface HoursValueProps {
  critical?: boolean;
}

const HoursValue = styled.span<HoursValueProps>`
  font-weight: ${props => props.critical ? 'bold' : 'normal'};
  color: ${props => props.critical ? '#d32f2f' : 'inherit'};
`;

// Constants
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_DUTY', label: 'On Duty' },
  { value: 'DRIVING', label: 'Driving' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
  { value: 'SLEEPER_BERTH', label: 'Sleeper Berth' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const DEFAULT_PAGE_SIZE = 10;

// Helper Functions
const getStatusColor = (status: DriverStatus): string => {
  switch (status) {
    case DriverStatus.ACTIVE:
      return '#34A853';
    case DriverStatus.AVAILABLE:
      return '#4285F4';
    case DriverStatus.ON_DUTY:
      return '#FBBC04';
    case DriverStatus.DRIVING:
      return '#1A73E8';
    case DriverStatus.OFF_DUTY:
      return '#9AA0A6';
    case DriverStatus.SLEEPER_BERTH:
      return '#666';
    case DriverStatus.INACTIVE:
      return '#EA4335';
    default:
      return '#9AA0A6';
  }
};

const renderStatusCell = (driver: Driver): JSX.Element => (
  <StatusBadge status={driver.status}>{driver.status}</StatusBadge>
);

const renderScoreCell = (driver: Driver): JSX.Element => (
  <ScoreContainer>
    <ScoreValue>{driver.efficiencyScore}</ScoreValue>
    <ProgressBar value={driver.efficiencyScore} max={100} />
  </ScoreContainer>
);

const renderHoursCell = (driver: Driver): JSX.Element => {
  const drivingHours = formatHoursMinutes(driver.drivingMinutesRemaining / 60, driver.drivingMinutesRemaining % 60);
  const dutyHours = formatHoursMinutes(driver.dutyMinutesRemaining / 60, driver.dutyMinutesRemaining % 60);
  const cycleHours = formatHoursMinutes(driver.cycleMinutesRemaining / 60, driver.cycleMinutesRemaining % 60);

  return (
    <HoursContainer>
      <HoursRow>
        <HoursLabel>Drive:</HoursLabel>
        <HoursValue critical={driver.drivingMinutesRemaining < 60}>{drivingHours}</HoursValue>
      </HoursRow>
      <HoursRow>
        <HoursLabel>Duty:</HoursLabel>
        <HoursValue critical={driver.dutyMinutesRemaining < 60}>{dutyHours}</HoursValue>
      </HoursRow>
      <HoursRow>
        <HoursLabel>Cycle:</HoursLabel>
        <HoursValue>{cycleHours}</HoursValue>
      </HoursRow>
    </HoursContainer>
  );
};

const renderLocationCell = (driver: Driver): JSX.Element => (
  <span>{driver.currentLocation?.latitude}, {driver.currentLocation?.longitude}</span>
);

/**
 * Component that displays a list of drivers with filtering, sorting, and pagination
 */
const DriverList: React.FC = () => {
  // Initialize state for search term, status filter, page, and page size
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Get the Redux dispatch function using useDispatch
  const dispatch = useDispatch();

  // Get the navigation function using useNavigate
  const navigate = useNavigate();

  // Select driver data from Redux store using useSelector
  const { drivers, total, loading } = useSelector((state: any) => ({
    drivers: state.driver.drivers,
    total: state.driver.total,
    loading: state.driver.loading
  }));

  // Create debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Define useEffect to fetch drivers when component mounts or filters change
  useEffect(() => {
    const params: DriverSearchParams = {
      page: page,
      limit: pageSize
    };

    if (statusFilter !== 'ALL') {
      params.status = [statusFilter];
    }

    if (debouncedSearchTerm) {
      dispatch(searchDrivers(params));
    } else {
      dispatch(fetchDrivers(params));
    }
  }, [dispatch, page, pageSize, statusFilter, debouncedSearchTerm]);

  // Define handler for row click to navigate to driver detail page
  const handleRowClick = useCallback((driver: Driver) => {
    navigate(`/drivers/${driver.id}`);
  }, [navigate]);

  // Define handler for status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as DriverStatus | 'ALL');
    setPage(1); // Reset page to 1 when filter changes
  };

  // Define handler for search term change
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset page to 1 when search term changes
  };

  // Define handler for page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Define handler for creating a new driver
  const handleCreateDriver = () => {
    navigate('/drivers/new');
  };

  // Define column definitions for the data table
  const columns: ColumnDefinition<Driver>[] = [
    { field: 'firstName', header: 'First Name', sortable: true },
    { field: 'lastName', header: 'Last Name', sortable: true },
    { field: 'status', header: 'Status', sortable: true, renderCell: renderStatusCell },
    { field: 'currentLocation', header: 'Location', renderCell: renderLocationCell },
    { field: 'efficiencyScore', header: 'Efficiency Score', sortable: true, renderCell: renderScoreCell },
    { field: 'drivingMinutesRemaining', header: 'HOS Available', renderCell: renderHoursCell },
  ];

  // Render the component with search, filter controls, and data table
  return (
    <Container>
      <ControlsContainer>
        <SearchContainer>
          <Input
            type="text"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={handleSearchTermChange}
          />
        </SearchContainer>
        <FiltersContainer>
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            options={STATUS_OPTIONS}
            label="Status"
          />
          <Button variant="primary" size="small" onClick={handleCreateDriver}>
            Add Driver
          </Button>
        </FiltersContainer>
      </ControlsContainer>
      <FlexBox justifyContent="space-between" alignItems="center">
      </FlexBox>
      <DataTable
        data={drivers || []}
        columns={columns}
        loading={loading}
        pagination={{
          enabled: true,
          pageSize: pageSize,
          currentPage: page,
          totalItems: total,
          onPageChange: handlePageChange,
          showPageSizeSelector: true,
          pageSizeOptions: [10, 20, 50]
        }}
        rowProps={{
          isClickable: true,
          onClick: handleRowClick
        }}
      />
    </Container>
  );
};

export default DriverList;