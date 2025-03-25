import React, { useEffect, useState, useCallback } from 'react'; // version ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // version ^8.0.5
import { useNavigate } from 'react-router-dom'; // version ^6.8.1
import styled from 'styled-components'; // version ^5.3.6
import { format } from 'date-fns'; // version ^2.29.3
import DataTable from '../../../shared/components/tables/DataTable';
import Button from '../../../shared/components/buttons/Button';
import {
  LoadSummary,
  LoadStatus,
  EquipmentType,
} from '../../../common/interfaces/load.interface';
import {
  fetchLoads,
  createLoad,
  deleteLoad,
} from '../../store/actions/loadActions';
import { theme } from '../../../shared/styles/theme';

interface LoadListProps {
  title?: string;
  showCreateButton?: boolean;
  filterOptions?: {
    status?: LoadStatus[];
    equipmentType?: EquipmentType[];
    dateRange?: [Date, Date];
  };
  onLoadSelect?: (load: LoadSummary) => void;
  className?: string;
}

const LoadListContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 24px;
`;

const LoadListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const LoadListTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #202124;
  margin: 0;
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #DADCE0;
  border-radius: 4px;
  font-size: 14px;
  width: 240px;
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.color};
  color: white;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 24px;
  color: #5F6368;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 16px;
  color: #EA4335;
  background-color: #FCE8E6;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const LoadList: React.FC<LoadListProps> = ({
  title,
  showCreateButton,
  filterOptions,
  onLoadSelect,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    status?: LoadStatus[];
    equipmentType?: EquipmentType[];
    dateRange?: [Date, Date];
  }>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loads = useSelector((state: any) => state.load.loads);
  const loading = useSelector((state: any) => state.load.loading);
  const totalCount = useSelector((state: any) => state.load.totalCount);
  const error = useSelector((state: any) => state.load.error);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const columnDefinitions = React.useMemo(() => [
    { field: 'referenceNumber', header: 'Reference', sortable: true, filterable: true },
    { field: 'origin', header: 'Origin', sortable: true, filterable: true },
    { field: 'destination', header: 'Destination', sortable: true, filterable: true },
    { field: 'equipmentType', header: 'Equipment', sortable: true, filterable: true, renderCell: (load: LoadSummary) => formatEquipmentType(load.equipmentType) },
    { field: 'weight', header: 'Weight', sortable: true },
    { field: 'status', header: 'Status', sortable: true, renderCell: (load: LoadSummary) => renderStatusCell(load) },
    { field: 'pickupDate', header: 'Pickup Date', sortable: true, renderCell: (load: LoadSummary) => renderDateCell(load.pickupDate) },
    { field: 'deliveryDate', header: 'Delivery Date', sortable: true, renderCell: (load: LoadSummary) => renderDateCell(load.deliveryDate) },
    { field: 'rate', header: 'Rate', sortable: true },
    { header: 'Actions', renderCell: (load: LoadSummary) => renderActionsCell(load) },
  ], []);

  useEffect(() => {
    const params = {
      searchTerm,
      status: filters.status,
      equipmentType: filters.equipmentType,
      dateRange: filters.dateRange,
      sortBy: sortColumn,
      sortDirection,
      page: currentPage,
      limit: pageSize,
    };
    dispatch(fetchLoads(params));
  }, [dispatch, searchTerm, filters, sortColumn, sortDirection, currentPage, pageSize]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleRowClick = (load: LoadSummary) => {
    if (onLoadSelect) {
      onLoadSelect(load);
    } else {
      navigate(`/loads/${load.id}`);
    }
  };

  const handleCreateLoad = () => {
    dispatch(createLoad({} as any));
  };

  const handleDeleteLoad = (loadId: string) => {
    if (window.confirm('Are you sure you want to delete this load?')) {
      dispatch(deleteLoad(loadId));
    }
  };

  return (
    <LoadListContainer className={className}>
      <LoadListHeader>
        <LoadListTitle>{title || 'Loads'}</LoadListTitle>
        {showCreateButton && (
          <Button variant="primary" onClick={handleCreateLoad}>
            Create Load
          </Button>
        )}
      </LoadListHeader>

      <FilterSection>
        <SearchInput
          type="text"
          placeholder="Search loads..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </FilterSection>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <DataTable
        data={loads || []}
        columns={columnDefinitions}
        loading={loading}
        totalItems={totalCount}
        pagination={{
          enabled: true,
          currentPage: currentPage,
          pageSize: pageSize,
          totalItems: totalCount,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
        sorting={{
          enabled: true,
          onSort: handleSort,
        }}
        filtering={{
          enabled: true,
          onFilter: handleFilterChange,
        }}
        rowProps={{
          isClickable: true,
          onClick: handleRowClick,
        }}
        emptyStateMessage={loading ? 'Loading loads...' : 'No loads found.'}
      />
    </LoadListContainer>
  );

  function formatLoadStatus(status: LoadStatus): { text: string; color: string } {
    switch (status) {
      case LoadStatus.AVAILABLE:
        return { text: 'Available', color: theme.colors.status.active };
      case LoadStatus.ASSIGNED:
        return { text: 'Assigned', color: theme.colors.status.info };
      case LoadStatus.IN_TRANSIT:
        return { text: 'In Transit', color: theme.colors.status.info };
      case LoadStatus.DELIVERED:
        return { text: 'Delivered', color: theme.colors.status.success };
      case LoadStatus.CANCELLED:
        return { text: 'Cancelled', color: theme.colors.status.error };
      default:
        return { text: status, color: theme.colors.status.inactive };
    }
  }

  function formatEquipmentType(type: EquipmentType): string {
    switch (type) {
      case EquipmentType.DRY_VAN:
        return 'Dry Van';
      case EquipmentType.REFRIGERATED:
        return 'Refrigerated';
      case EquipmentType.FLATBED:
        return 'Flatbed';
      default:
        return type;
    }
  }

  function renderStatusCell(load: LoadSummary): JSX.Element {
    const { text, color } = formatLoadStatus(load.status);
    return <StatusBadge color={color}>{text}</StatusBadge>;
  }

  function renderDateCell(date: string): string {
    return format(new Date(date), 'MM/dd/yyyy');
  }

  function renderActionsCell(load: LoadSummary): JSX.Element {
    return (
      <ActionButtonsContainer>
        <Button variant="secondary" size="small" onClick={() => navigate(`/loads/${load.id}`)}>
          View
        </Button>
        <Button variant="secondary" size="small" onClick={() => navigate(`/loads/${load.id}/edit`)}>
          Edit
        </Button>
        <Button variant="danger" size="small" onClick={() => handleDeleteLoad(load.id)}>
          Delete
        </Button>
      </ActionButtonsContainer>
    );
  }
};

export default LoadList;