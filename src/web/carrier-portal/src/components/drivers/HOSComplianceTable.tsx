import React, { useState, useEffect, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { DataTable, ColumnDefinition } from '../../../shared/components/tables/DataTable';
import { theme } from '../../../shared/styles/theme';
import { DriverHOS, HOSStatus } from '../../../common/interfaces/driver.interface';
import { getDriverHOS } from '../../services/driverService';
import { formatMinutesToHoursMinutes, formatDateTime } from '../../../common/utils/formatters';

/**
 * Interface defining the props for the HOSComplianceTable component
 */
interface HOSComplianceTableProps {
  driverId: string;
  showHistory?: boolean;
  refreshInterval?: number;
  className?: string;
  style?: React.CSSProperties;
  showTitle?: boolean;
  onStatusChange?: (status: HOSStatus) => void;
}

/**
 * Column definitions for the HOS compliance table
 */
const COLUMN_DEFINITIONS: Array<ColumnDefinition<DriverHOS>> = [
  {
    field: 'status',
    header: 'Status',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <StatusBadge status={row.status}>
        {row.status}
      </StatusBadge>
    ),
  },
  {
    field: 'statusSince',
    header: 'Status Since',
    width: '180px',
    sortable: true,
    renderCell: (row) => formatDateTime(row.statusSince),
  },
  {
    field: 'drivingMinutesRemaining',
    header: 'Driving Time',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <TimeRemainingCell minutes={row.drivingMinutesRemaining}>
        {formatMinutesToHoursMinutes(row.drivingMinutesRemaining)}
      </TimeRemainingCell>
    ),
  },
  {
    field: 'dutyMinutesRemaining',
    header: 'Duty Time',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <TimeRemainingCell minutes={row.dutyMinutesRemaining}>
        {formatMinutesToHoursMinutes(row.dutyMinutesRemaining)}
      </TimeRemainingCell>
    ),
  },
  {
    field: 'cycleMinutesRemaining',
    header: 'Cycle Time',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <TimeRemainingCell minutes={row.cycleMinutesRemaining}>
        {formatMinutesToHoursMinutes(row.cycleMinutesRemaining)}
      </TimeRemainingCell>
    ),
  },
  {
    field: 'recordedAt',
    header: 'Last Updated',
    width: '180px',
    sortable: true,
    renderCell: (row) => formatDateTime(row.recordedAt),
  },
];

/**
 * Column definitions for the HOS history table
 */
const HISTORY_COLUMN_DEFINITIONS: Array<ColumnDefinition<DriverHOS>> = [
  {
    field: 'status',
    header: 'Status',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <StatusBadge status={row.status}>
        {row.status}
      </StatusBadge>
    ),
  },
  {
    field: 'statusSince',
    header: 'Start Time',
    width: '180px',
    sortable: true,
    renderCell: (row) => formatDateTime(row.statusSince),
  },
  {
    field: 'recordedAt',
    header: 'End Time',
    width: '180px',
    sortable: true,
    renderCell: (row) => formatDateTime(row.recordedAt),
  },
  {
    field: 'drivingMinutesRemaining',
    header: 'Driving Time',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <TimeRemainingCell minutes={row.drivingMinutesRemaining}>
        {formatMinutesToHoursMinutes(row.drivingMinutesRemaining)}
      </TimeRemainingCell>
    ),
  },
  {
    field: 'dutyMinutesRemaining',
    header: 'Duty Time',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <TimeRemainingCell minutes={row.dutyMinutesRemaining}>
        {formatMinutesToHoursMinutes(row.dutyMinutesRemaining)}
      </TimeRemainingCell>
    ),
  },
  {
    field: 'cycleMinutesRemaining',
    header: 'Cycle Time',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <TimeRemainingCell minutes={row.cycleMinutesRemaining}>
        {formatMinutesToHoursMinutes(row.cycleMinutesRemaining)}
      </TimeRemainingCell>
    ),
  },
];

/**
 * Default refresh interval of 5 minutes (300,000 ms)
 */
const DEFAULT_REFRESH_INTERVAL = 300000;

/**
 * Container for the HOS compliance table
 */
const TableContainer = styled.div`
  width: 100%;
  margin-bottom: ${theme.spacing.lg};
  border-radius: ${theme.borders.radius.md};
  overflow: hidden;
`;

/**
 * Title for the HOS compliance table
 */
const TableTitle = styled.h3`
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.fonts.size.lg};
  color: ${theme.colors.text.primary};
`;

/**
 * Badge displaying the HOS status
 */
const StatusBadge = styled.div<{ status: HOSStatus }>`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borders.radius.sm};
  font-weight: ${theme.fonts.weight.medium};
  color: ${theme.colors.white};
  background-color: ${props => getStatusColor(props.status)};
  text-align: center;
`;

/**
 * Cell displaying remaining time with color coding
 */
const TimeRemainingCell = styled.div<{ minutes: number }>`
  font-family: ${theme.fonts.family.mono};
  font-weight: ${theme.fonts.weight.medium};
  color: ${props => getTimeRemainingColor(props.minutes)};
  text-align: center;
`;

/**
 * Button to manually refresh HOS data
 */
const RefreshButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary.main};
  cursor: pointer;
  font-size: ${theme.fonts.size.sm};
  padding: ${theme.spacing.xs};
  margin-left: ${theme.spacing.md};
  &:hover {
    text-decoration: underline;
  }
`;

/**
 * Returns a color based on the HOS status
 */
const getStatusColor = (status: HOSStatus): string => {
  switch (status) {
    case HOSStatus.OFF_DUTY:
      return theme.colors.semantic.success;
    case HOSStatus.SLEEPER_BERTH:
      return theme.colors.semantic.info;
    case HOSStatus.ON_DUTY:
      return theme.colors.semantic.warning;
    case HOSStatus.DRIVING:
      return theme.colors.semantic.error;
    default:
      return theme.colors.neutral.mediumGray;
  }
};

/**
 * Returns a color based on the remaining time in minutes
 */
const getTimeRemainingColor = (minutes: number): string => {
  if (minutes < 60) {
    return theme.colors.semantic.error;
  } else if (minutes < 120) {
    return theme.colors.semantic.warning;
  } else if (minutes < 240) {
    return theme.colors.semantic.info;
  } else {
    return theme.colors.semantic.success;
  }
};

/**
 * Fetches HOS data for a driver
 */
const fetchHOSData = async (driverId: string, showHistory: boolean): Promise<DriverHOS[] | DriverHOS> => {
  if (showHistory) {
    return await getDriverHOS(driverId, { limit: 10 });
  } else {
    const hosData = await getDriverHOS(driverId, { limit: 1 });
    return hosData[0];
  }
};

/**
 * A component that displays a table of driver Hours of Service compliance data
 */
const HOSComplianceTable: React.FC<HOSComplianceTableProps> = ({
  driverId,
  showHistory = false,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  className,
  style,
  showTitle = true,
  onStatusChange,
}) => {
  // Initialize state for loading status and HOS data
  const [loading, setLoading] = useState(false);
  const [hosData, setHosData] = useState<DriverHOS[] | DriverHOS | null>(null);

  // Create an effect to fetch HOS data when driverId changes or on refresh interval
  useEffect(() => {
    const loadHOSData = async () => {
      setLoading(true);
      try {
        const data = await fetchHOSData(driverId, showHistory);
        setHosData(data);
        if (!showHistory && data && onStatusChange) {
          onStatusChange((data as DriverHOS).status);
        }
      } catch (error) {
        console.error('Failed to load HOS data:', error);
        setHosData(null);
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      loadHOSData();
    }
  }, [driverId, showHistory, onStatusChange]);

  // Create an effect to set up a refresh timer if refreshInterval is provided
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (refreshInterval && driverId) {
      intervalId = setInterval(() => {
        setLoading(true);
        fetchHOSData(driverId, showHistory)
          .then(data => {
            setHosData(data);
            if (!showHistory && data && onStatusChange) {
              onStatusChange((data as DriverHOS).status);
            }
          })
          .catch(error => {
            console.error('Failed to refresh HOS data:', error);
            setHosData(null);
          })
          .finally(() => setLoading(false));
      }, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [driverId, refreshInterval, showHistory, onStatusChange]);

  // Define column definitions for the data table with appropriate formatting
  const columnDefinitions = useMemo(() => {
    return showHistory ? HISTORY_COLUMN_DEFINITIONS : COLUMN_DEFINITIONS;
  }, [showHistory]);

  // Handle manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchHOSData(driverId, showHistory)
      .then(data => {
        setHosData(data);
        if (!showHistory && data && onStatusChange) {
          onStatusChange((data as DriverHOS).status);
        }
      })
      .catch(error => {
        console.error('Failed to refresh HOS data:', error);
        setHosData(null);
      })
      .finally(() => setLoading(false));
  };

  // Handle loading and error states
  if (loading) {
    return (
      <TableContainer className={className} style={style}>
        {showTitle && <TableTitle>HOS Compliance</TableTitle>}
        <div>Loading HOS data...</div>
      </TableContainer>
    );
  }

  if (!hosData) {
    return (
      <TableContainer className={className} style={style}>
        {showTitle && <TableTitle>HOS Compliance</TableTitle>}
        <div>Failed to load HOS data.</div>
        <RefreshButton onClick={handleRefresh}>Refresh</RefreshButton>
      </TableContainer>
    );
  }

  // Render the DataTable component with the HOS data and column definitions
  return (
    <TableContainer className={className} style={style}>
      {showTitle && (
        <TableTitle>
          HOS Compliance
          <RefreshButton onClick={handleRefresh}>Refresh</RefreshButton>
        </TableTitle>
      )}
      <DataTable
        data={showHistory ? (hosData as DriverHOS[]) : [(hosData as DriverHOS)]}
        columns={columnDefinitions}
        loading={loading}
        emptyStateMessage="No HOS data available"
        pagination={{ enabled: showHistory }}
      />
    </TableContainer>
  );
};

/**
 * Export the HOS compliance table component
 */
export default HOSComplianceTable;
export type { HOSComplianceTableProps };