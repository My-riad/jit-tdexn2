import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components'; // styled-components ^5.3.6
import { DataTable, ColumnDefinition } from '../../../shared/components/tables/DataTable';
import Card from '../../../shared/components/cards/Card';
import Button from '../../../shared/components/buttons/Button';
import { LoadStatus, LoadSummary } from '../../../common/interfaces/load.interface';
import { getCarrierLoads } from '../../services/loadService';
import { theme } from '../../../shared/styles/theme';
import { formatDateTime } from '../../../common/utils/dateTimeUtils';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';

/**
 * Interface defining the props for the UpcomingDeliveriesTable component
 */
interface UpcomingDeliveriesTableProps {
  /** ID of the carrier whose deliveries to display */
  carrierId: string;
  /** Maximum number of deliveries to display */
  limit: number;
  /** Handler for when the 'View All' button is clicked */
  onViewAllClick: () => void;
}

/**
 * Structure for upcoming delivery data
 */
interface UpcomingDelivery {
  id: string;
  time: string;
  loadId: string;
  driver: { id: string; name: string };
  location: string;
  status: LoadStatus;
}

/**
 * Container for the table component
 */
const TableContainer = styled.div`
  width: 100%;
  overflow: hidden;
`;

/**
 * Header section for the card
 */
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Title for the card
 */
const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: ${theme.colors.text.primary};
`;

/**
 * Badge for displaying load status
 */
const StatusBadge = styled.span<{ status: LoadStatus }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => getStatusColor(props.status).background};
  color: ${props => getStatusColor(props.status).text};
`;

/**
 * Empty state message container
 */
const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.lg};
  color: ${theme.colors.text.secondary};
  font-style: italic;
`;

/**
 * Component that displays a table of upcoming deliveries for a carrier
 */
const UpcomingDeliveriesTable: React.FC<UpcomingDeliveriesTableProps> = ({
  carrierId,
  limit = 5,
  onViewAllClick,
}) => {
  // Initialize state for loads, loading status, and error
  const [loads, setLoads] = useState<LoadSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Define column definitions for the data table
  const columnDefinitions: ColumnDefinition<LoadSummary>[] = [
    {
      field: 'time',
      header: 'Time',
      width: '15%',
      renderCell: (load) => formatDateTime(load.deliveryDate),
    },
    {
      field: 'loadId',
      header: 'Load ID',
      width: '15%',
    },
    {
      field: 'driver',
      header: 'Driver',
      width: '20%',
      renderCell: (load) => load.assignedDriver ? load.assignedDriver.name : 'Unassigned',
    },
    {
      field: 'location',
      header: 'Destination',
      width: '30%',
      renderCell: (load) => load.destination,
    },
    {
      field: 'status',
      header: 'Status',
      width: '20%',
      renderCell: (load) => renderStatusBadge(load.status),
    },
  ];

  // Implement useEffect to fetch upcoming deliveries when component mounts or carrierId changes
  useEffect(() => {
    fetchUpcomingDeliveries();
  }, [carrierId]);

  // Create fetchUpcomingDeliveries function to get loads with appropriate filters
  const fetchUpcomingDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        status: [LoadStatus.IN_TRANSIT, LoadStatus.AT_PICKUP, LoadStatus.LOADED, LoadStatus.AT_DROPOFF],
        sortBy: 'deliveryDate',
        sortDirection: 'asc',
        limit: limit,
      };

      const data = await getCarrierLoads(carrierId, searchParams);
      setLoads(data.loads);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch upcoming deliveries.');
    } finally {
      setLoading(false);
    }
  }, [carrierId, limit]);

  // Handle loading and error states
  if (loading) {
    return <LoadingIndicator label="Loading upcoming deliveries..." />;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  // Implement status badge rendering with appropriate colors based on load status
  const getStatusColor = (status: LoadStatus) => {
    switch (status) {
      case LoadStatus.IN_TRANSIT:
        return { background: theme.colors.semantic.info, text: theme.colors.text.inverted };
      case LoadStatus.AT_PICKUP:
        return { background: theme.colors.semantic.warning, text: theme.colors.text.inverted };
      case LoadStatus.LOADED:
        return { background: theme.colors.semantic.success, text: theme.colors.text.inverted };
      case LoadStatus.AT_DROPOFF:
        return { background: theme.colors.semantic.info, text: theme.colors.text.inverted };
      default:
        return { background: theme.colors.neutral.lightGray, text: theme.colors.text.secondary };
    }
  };

  // Render a status badge with appropriate styling
  const renderStatusBadge = (status: LoadStatus) => {
    return <StatusBadge status={status}>{status}</StatusBadge>;
  };

  // Return the complete component structure
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deliveries</CardTitle>
        <Button variant="text" onClick={onViewAllClick}>
          View All
        </Button>
      </CardHeader>
      <TableContainer>
        <DataTable
          data={loads}
          columns={columnDefinitions}
          loading={loading}
          emptyStateMessage="No upcoming deliveries"
        />
      </TableContainer>
    </Card>
  );
};

export default UpcomingDeliveriesTable;