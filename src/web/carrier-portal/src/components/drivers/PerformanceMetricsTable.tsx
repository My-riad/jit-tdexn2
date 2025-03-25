import React, { useState, useEffect, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import DataTable, { ColumnDefinition } from '../../../shared/components/tables/DataTable';
import { theme } from '../../../shared/styles/theme';
import { DriverPerformanceMetrics } from '../../../common/interfaces/driver.interface';
import { getDriverPerformance } from '../../services/driverService';
import { formatCurrency, formatNumber, formatPercentage } from '../../../common/utils/formatters';

interface PerformanceMetricsTableProps {
  driverId: string;
  periodStart: string;
  periodEnd: string;
  className?: string;
  style?: React.CSSProperties;
  showTitle?: boolean;
}

const TableContainer = styled.div`
  width: 100%;
  margin-bottom: ${theme.spacing.lg};
  border-radius: ${theme.borders.radius.md};
  overflow: hidden;
`;

const TableTitle = styled.h3`
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.fonts.size.lg};
  color: ${theme.colors.text.primary};
`;

const MetricCell = styled.div`
  font-family: ${theme.fonts.family.mono};
  text-align: right;
`;

interface EfficiencyScoreProps {
  score: number;
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return theme.colors.semantic.success;
  if (score >= 80) return theme.colors.semantic.info;
  if (score >= 70) return theme.colors.semantic.warning;
  return theme.colors.semantic.error;
};

const getScoreBackgroundColor = (score: number): string => {
  if (score >= 90) return theme.colors.background.lightGreen;
  if (score >= 80) return theme.colors.background.lightBlue;
  if (score >= 70) return theme.colors.background.lightOrange;
  return theme.colors.background.lightRed;
};

const EfficiencyScore = styled.div<EfficiencyScoreProps>`
  font-weight: ${theme.fonts.weight.bold};
  color: ${props => getScoreColor(props.score)};
  text-align: center;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borders.radius.sm};
  background-color: ${props => getScoreBackgroundColor(props.score)};
  display: inline-block;
`;

interface PercentageValueProps {
  value: number;
  isGoodWhenHigh?: boolean;
}

const getPercentageColor = (value: number, isGoodWhenHigh: boolean = true): string => {
  if (isGoodWhenHigh) {
    if (value >= 90) return theme.colors.semantic.success;
    if (value >= 70) return theme.colors.semantic.warning;
    return theme.colors.semantic.error;
  } else {
    if (value <= 10) return theme.colors.semantic.success;
    if (value <= 20) return theme.colors.semantic.warning;
    return theme.colors.semantic.error;
  }
};

const PercentageValue = styled.div<PercentageValueProps>`
  color: ${props => getPercentageColor(props.value, props.isGoodWhenHigh)};
  font-weight: ${theme.fonts.weight.medium};
  text-align: right;
`;

const COLUMN_DEFINITIONS: Array<ColumnDefinition<DriverPerformanceMetrics>> = [
  {
    field: 'efficiencyScore',
    header: 'Efficiency Score',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <MetricCell>
        <EfficiencyScore score={row.efficiencyScore}>{formatNumber(row.efficiencyScore, 0)}</EfficiencyScore>
      </MetricCell>
    ),
  },
  {
    field: 'onTimePercentage',
    header: 'On-Time %',
    width: '100px',
    sortable: true,
    renderCell: (row) => (
      <MetricCell>
        <PercentageValue value={row.onTimePercentage}>{formatPercentage(row.onTimePercentage)}</PercentageValue>
      </MetricCell>
    ),
  },
  {
    field: 'totalMiles',
    header: 'Total Miles',
    width: '100px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatNumber(row.totalMiles)}</MetricCell>,
  },
  {
    field: 'loadedMiles',
    header: 'Loaded Miles',
    width: '100px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatNumber(row.loadedMiles)}</MetricCell>,
  },
  {
    field: 'emptyMiles',
    header: 'Empty Miles',
    width: '100px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatNumber(row.emptyMiles)}</MetricCell>,
  },
  {
    field: 'emptyMilesPercentage',
    header: 'Empty Miles %',
    width: '120px',
    sortable: true,
    renderCell: (row) => (
      <MetricCell>
        <PercentageValue value={row.emptyMilesPercentage} isGoodWhenHigh={false}>
          {formatPercentage(row.emptyMilesPercentage)}
        </PercentageValue>
      </MetricCell>
    ),
  },
  {
    field: 'fuelEfficiency',
    header: 'MPG',
    width: '80px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatNumber(row.fuelEfficiency, 2)}</MetricCell>,
  },
  {
    field: 'revenueGenerated',
    header: 'Revenue',
    width: '120px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatCurrency(row.revenueGenerated)}</MetricCell>,
  },
  {
    field: 'revenuePerMile',
    header: 'Revenue/Mile',
    width: '120px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatCurrency(row.revenuePerMile)}</MetricCell>,
  },
  {
    field: 'smartHubVisits',
    header: 'Smart Hub Visits',
    width: '140px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatNumber(row.smartHubVisits)}</MetricCell>,
  },
  {
    field: 'relayParticipations',
    header: 'Relay Participations',
    width: '160px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatNumber(row.relayParticipations)}</MetricCell>,
  },
  {
    field: 'loadsCompleted',
    header: 'Loads Completed',
    width: '140px',
    sortable: true,
    renderCell: (row) => <MetricCell>{formatNumber(row.loadsCompleted)}</MetricCell>,
  },
];

/**
 * Returns a color based on the efficiency score value.
 * @param score The efficiency score.
 * @returns A color string.
 */
const PerformanceMetricsTable: React.FC<PerformanceMetricsTableProps> = ({
  driverId,
  periodStart,
  periodEnd,
  className,
  style,
  showTitle = true,
}) => {
  // Initialize state for loading and performance metrics
  const [loading, setLoading] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<DriverPerformanceMetrics | null>(null);

  // Fetch performance metrics when driverId or date range changes
  useEffect(() => {
    const fetchPerformanceMetrics = async () => {
      setLoading(true);
      try {
        const metrics = await getDriverPerformance(driverId, { startDate: periodStart, endDate: periodEnd });
        setPerformanceMetrics(metrics);
      } catch (error) {
        console.error('Failed to fetch driver performance metrics:', error);
        setPerformanceMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    if (driverId && periodStart && periodEnd) {
      fetchPerformanceMetrics();
    }
  }, [driverId, periodStart, periodEnd]);

  // Define column definitions for the data table
  const columnDefinitions = useMemo(() => COLUMN_DEFINITIONS, []);

  // Handle loading and error states
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!performanceMetrics) {
    return <div>No performance metrics available.</div>;
  }

  // Render the DataTable component with the performance metrics data and column definitions
  return (
    <TableContainer className={className} style={style}>
      {showTitle && <TableTitle>Performance Metrics</TableTitle>}
      <DataTable
        data={[performanceMetrics]}
        columns={columnDefinitions}
        loading={loading}
      />
    </TableContainer>
  );
};

export default PerformanceMetricsTable;