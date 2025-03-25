import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // version ^8.0.5
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate } from 'react-router-dom'; // version ^6.8.0

import DataTable from '../../../shared/components/tables/DataTable';
import Button from '../../../shared/components/buttons/Button';
import Input from '../../../shared/components/forms/Input';
import Select from '../../../shared/components/forms/Select';
import Modal from '../../../shared/components/feedback/Modal';
import TruckDetailCard from './TruckDetailCard';
import {
  Vehicle,
  VehicleType,
  VehicleStatus,
  VehicleSummary,
  VehicleSearchParams,
} from '../../../common/interfaces/vehicle.interface';
import {
  fetchVehicles,
  deleteExistingVehicle,
} from '../../store/actions/fleetActions';
import { RootState } from '../../store/reducers/rootReducer';
import useDebounce from '../../../common/hooks/useDebounce';
import { theme } from '../../../shared/styles/theme';

/**
 * Interface defining the props for the TruckList component
 */
interface TruckListProps {
  carrierId: string;
  className?: string;
}

/**
 * Styled container for the entire truck list component
 */
const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

/**
 * Styled container for search and filter controls
 */
const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  align-items: center;
`;

/**
 * Styled container for the search input
 */
const SearchContainer = styled.div`
  flex: 1;
  min-width: 250px;
`;

/**
 * Styled container for the filter selects
 */
const FilterContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
`;

/**
 * Styled select component for filters
 */
const FilterSelect = styled(Select)`
  min-width: 150px;
`;

/**
 * Styled container for action buttons
 */
const ActionContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-left: auto;
`;

/**
 * Styled badge for displaying vehicle status
 */
interface StatusBadgeProps {
  status: VehicleStatus;
}

const StatusBadge = styled.span<StatusBadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borders.radius.full};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  background-color: ${(props) => getStatusColor(props.status)};
  color: ${theme.colors.common.white};
`;

/**
 * Options for vehicle type filter
 */
const vehicleTypeOptions = [
  { value: 'ALL', label: 'All Types' },
  { value: 'TRACTOR', label: 'Tractor' },
  { value: 'DRY_VAN_TRAILER', label: 'Dry Van Trailer' },
  { value: 'REFRIGERATED_TRAILER', label: 'Refrigerated Trailer' },
  { value: 'FLATBED_TRAILER', label: 'Flatbed Trailer' },
  { value: 'STEP_DECK_TRAILER', label: 'Step Deck Trailer' },
  { value: 'LOWBOY_TRAILER', label: 'Lowboy Trailer' },
  { value: 'TANKER_TRAILER', label: 'Tanker Trailer' },
  { value: 'SPECIALIZED', label: 'Specialized' },
];

/**
 * Options for vehicle status filter
 */
const vehicleStatusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/**
 * Helper function to determine the appropriate color for status indicators
 * @param status Vehicle status
 * @returns Color code for the given status
 */
const getStatusColor = (status: VehicleStatus): string => {
  switch (status) {
    case VehicleStatus.ACTIVE:
      return theme.colors.status.active;
    case VehicleStatus.AVAILABLE:
      return theme.colors.status.info;
    case VehicleStatus.MAINTENANCE:
      return theme.colors.status.warning;
    case VehicleStatus.OUT_OF_SERVICE:
      return theme.colors.status.error;
    default:
      return theme.colors.neutral.mediumGray;
  }
};

/**
 * Helper function to format vehicle type for display
 * @param type VehicleType
 * @returns Formatted vehicle type string
 */
const formatVehicleType = (type: VehicleType): string => {
  const formattedType = type.replace(/_/g, ' ').toLowerCase();
  return formattedType.charAt(0).toUpperCase() + formattedType.slice(1);
};

/**
 * Props for the TruckList component
 */
interface TruckListProps {
  carrierId: string;
  className?: string;
}

/**
 * Component that displays a list of trucks with filtering, sorting, and pagination
 */
export const TruckList: React.FC<TruckListProps> = ({ carrierId, className }) => {
  // LD1: Destructure props to get carrierId and className
  // LD2: Initialize state for search term, filters, selected truck, and confirmation modal
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [selectedTruck, setSelectedTruck] = useState<VehicleSummary | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // LD3: Use Redux hooks to access fleet state and dispatch actions
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { vehicles, loading, pagination } = useSelector((state: RootState) => state.fleet);

  // LD4: Create debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // LD5: Implement useEffect to fetch vehicles when component mounts or filters change
  useEffect(() => {
    const searchParams: VehicleSearchParams = {
      carrier_id: carrierId,
      page: pagination.page,
      limit: pagination.limit,
    };

    if (debouncedSearchTerm) {
      searchParams.vin = debouncedSearchTerm;
    }

    if (typeFilter !== 'ALL') {
      searchParams.type = [typeFilter];
    }

    if (statusFilter !== 'ALL') {
      searchParams.status = [statusFilter];
    }

    dispatch(fetchVehicles(carrierId, searchParams));
  }, [carrierId, debouncedSearchTerm, typeFilter, statusFilter, dispatch, pagination.page, pagination.limit]);

  // LD6: Define column definitions for the data table
  const columns = React.useMemo(
    () => [
      { field: 'vehicle_id', header: 'ID', width: '10%' },
      { field: 'type', header: 'Type', width: '15%', renderCell: (vehicle: VehicleSummary) => formatVehicleType(vehicle.type) },
      { field: 'status', header: 'Status', width: '15%', renderCell: (vehicle: VehicleSummary) => <StatusBadge status={vehicle.status}>{vehicle.status}</StatusBadge> },
      { field: 'current_driver_name', header: 'Driver', width: '20%' },
      { field: 'current_location.city', header: 'Location', width: '20%', renderCell: (vehicle: VehicleSummary) => `${vehicle.current_location?.city}, ${vehicle.current_location?.state}` },
      { field: 'current_load_id', header: 'Load', width: '10%' },
    ],
    []
  );

  // LD7: Implement handlers for search, filter changes, row selection, pagination, and sorting
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value as VehicleType | 'ALL');
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as VehicleStatus | 'ALL');
  };

  const handleRowClick = useCallback((vehicle: VehicleSummary) => {
    setSelectedTruck(vehicle);
  }, []);

  const handleCloseTruckDetail = () => {
    setSelectedTruck(null);
  };

  const handleDeleteClick = (vehicle: VehicleSummary) => {
    setSelectedTruck(vehicle);
    setShowConfirmationModal(true);
  };

  const confirmDelete = () => {
    if (selectedTruck) {
      dispatch(deleteExistingVehicle(selectedTruck.vehicle_id));
      setShowConfirmationModal(false);
      setSelectedTruck(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmationModal(false);
    setSelectedTruck(null);
  };

  const handleEditClick = () => {
    if (selectedTruck) {
      navigate(`/fleet/edit/${selectedTruck.vehicle_id}`);
    }
  };

  // LD8: Render search and filter controls
  // LD9: Render DataTable component with truck data and column definitions
  // LD10: Render confirmation modal for delete operations
  // LD11: Render TruckDetailCard modal when a truck is selected for viewing
  return (
    <Container className={className}>
      <ControlsContainer>
        <SearchContainer>
          <Input
            type="text"
            placeholder="Search by VIN"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchContainer>
        <FilterContainer>
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={handleTypeFilterChange}
            options={vehicleTypeOptions}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            options={vehicleStatusOptions}
          />
        </FilterContainer>
        <ActionContainer>
          <Button onClick={() => navigate('/fleet/add')}>Add Truck</Button>
        </ActionContainer>
      </ControlsContainer>
      <DataTable
        data={vehicles}
        columns={columns}
        loading={loading}
        pagination={{
          enabled: true,
          currentPage: pagination.page,
          pageSize: pagination.limit,
          totalItems: pagination.total,
        }}
        rowProps={{
          isClickable: true,
          onClick: handleRowClick,
        }}
      />
      <Modal
        isOpen={showConfirmationModal}
        onClose={cancelDelete}
        title="Confirm Delete"
      >
        Are you sure you want to delete this truck?
        <Button onClick={confirmDelete}>Delete</Button>
        <Button onClick={cancelDelete}>Cancel</Button>
      </Modal>
      <Modal
        isOpen={selectedTruck !== null}
        onClose={handleCloseTruckDetail}
        title="Truck Details"
      >
        {selectedTruck && (
          <TruckDetailCard
            vehicle={selectedTruck}
            onClose={handleCloseTruckDetail}
            onEdit={handleEditClick}
          />
        )}
      </Modal>
    </Container>
  );
};