import React, { useState, useEffect, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import DataTable, { ColumnDefinition } from '../../../shared/components/tables/DataTable';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { LoadStatus, LoadSummary } from '../../../common/interfaces/load.interface';
import { getLoads } from '../../services/loadService';
import { formatDate, formatTime, formatDateForDisplay } from '../../../common/utils/dateTimeUtils';

/**
 * Interface defining the props for the UpcomingDeliveriesTable component
 */
interface UpcomingDeliveriesTableProps {
  /** Maximum number of deliveries to display */
  limit?: number;
  /** Function to call when 'View All' is clicked */
  onViewAll?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Interface for a row in the upcoming deliveries table
 */
interface DeliveryRow {
  id: string;
  time: string;
  loadId: string;
  carrier: string;
  destination: string;
  status: LoadStatus;
  rawData: LoadSummary;
}

/**
 * Helper function to determine badge color based on load status
 * @param status The load status
 * @returns The background color for the status badge
 */
const getStatusColor = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.DELIVERED:
    case LoadStatus.COMPLETED:
      return '#34A853'; // Green
    case LoadStatus.IN_TRANSIT:
      return '#1A73E8'; // Blue
    case LoadStatus.AT_PICKUP:
      return '#FBBC04'; // Yellow
    case LoadStatus.DELAYED:
    case LoadStatus.EXCEPTION:
      return '#EA4335'; // Red
    default:
      return '#9AA0A6'; // Gray
  }
};

/**
 * Styled component for the status badge
 */
const StatusBadge = styled.span<{ status: LoadStatus }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  background-color: ${getStatusColor};
  color: #ffffff;
`;

/**
 * Styled component for the table container
 */
const TableContainer = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

/**
 * Styled component for the table header
 */
const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
`;

/**
 * Styled component for the table title
 */
const TableTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #202124;
`;

/**
 * Styled component for the view all link
 */
const ViewAllLink = styled.a`
  color: #1A73E8;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

/**
 * Styled component for the empty state message
 */
const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 16px;
  color: #5F6368;
  font-style: italic;
`;

/**
 * Column configuration for the upcoming deliveries table
 */
const COLUMNS: ColumnDefinition<DeliveryRow>[] = [
  { field: 'time', header: 'Time', width: '120px' },
  { field: 'loadId', header: 'Load ID', width: '150px' },
  { field: 'carrier', header: 'Carrier', width: '180px' },
  { field: 'destination', header: 'Destination' },
  {
    field: 'status',
    header: 'Status',
    width: '120px',
    renderCell: (row) => (
      <StatusBadge status={row.status}>{row.status}</StatusBadge>
    ),
  },
];

/**
 * Component that displays a table of upcoming deliveries for the shipper dashboard
 */
export const UpcomingDeliveriesTable: React.FC<UpcomingDeliveriesTableProps> = ({
  limit = 5,
  onViewAll,
  className,
}) => {
  // Initialize state for loading status and delivery data
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);

  // Create a function to fetch upcoming deliveries data
  const fetchUpcomingDeliveries = async () => {
    setLoading(true);
    try {
      // Fetch loads with specific criteria (e.g., upcoming deliveries)
      const now = new Date().toISOString();
      const data = await getLoads({
        status: [
          LoadStatus.IN_TRANSIT,
          LoadStatus.AT_PICKUP,
          LoadStatus.LOADED,
          LoadStatus.AT_DROPOFF,
        ],
        deliveryDateStart: now,
        limit: limit,
      });

      // Transform load data into DeliveryRow format
      const deliveryRows: DeliveryRow[] = data.loads.map((load) => ({
        id: load.id,
        time: `${formatDateForDisplay(load.deliveryDate)}, ${formatTime(load.deliveryDate)}`,
        loadId: load.referenceNumber,
        carrier: load.assignedDriver?.name || 'Unassigned',
        destination: load.destination,
        status: load.status,
        rawData: load,
      }));

      // Update state with fetched and transformed data
      setDeliveries(deliveryRows);
    } catch (error) {
      console.error('Failed to fetch upcoming deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect to fetch data when component mounts
  useEffect(() => {
    fetchUpcomingDeliveries();
  }, [limit]);

  // Render the DataTable component with the deliveries data
  return (
    <TableContainer className={className} aria-label="Upcoming Deliveries">
      <TableHeader>
        <TableTitle>Upcoming Deliveries</TableTitle>
        {onViewAll && (
          <ViewAllLink onClick={onViewAll} aria-label="View All Deliveries">
            View All
          </ViewAllLink>
        )}
      </TableHeader>
      {loading ? (
        <LoadingIndicator />
      ) : deliveries.length > 0 ? (
        <DataTable<DeliveryRow>
          data={deliveries}
          columns={COLUMNS}
          loading={loading}
          emptyStateMessage="No upcoming deliveries"
          rowProps={{
            isClickable: false,
          }}
        />
      ) : (
        <EmptyState>No upcoming deliveries</EmptyState>
      )}
    </TableContainer>
  );
};