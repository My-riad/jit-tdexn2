import React, { useState, useEffect, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import {
  TrendingUpIcon,
  TrendingDownIcon,
} from '@heroicons/react/24/outline'; // version ^2.0.13

import DataTable, {
  ColumnDefinition,
  DataTableProps,
} from '../../../shared/components/tables/DataTable';
import Card from '../../../shared/components/cards/Card';
import ProgressBar from '../../../shared/components/feedback/ProgressBar';
import Select from '../../../shared/components/forms/Select';
import {
  Vehicle,
  VehiclePerformanceMetrics,
} from '../../../common/interfaces/vehicle.interface';
import {
  getFleetPerformance,
  getVehiclePerformance,
} from '../../services/fleetService';
import { theme } from '../../../shared/styles/theme';
import { formatPercentage } from '../../../common/utils/formatters';

/**
 * Props for the EfficiencyMetricsTable component
 */
interface EfficiencyMetricsTableProps {
  /** ID of the carrier whose fleet metrics to display */
  carrierId: string;
  /** Optional CSS class name for styling */
  className?: string;
  /** Optional callback when a vehicle row is selected */
  onVehicleSelect?: (vehicleId: string) => void;
}

/**
 * Combined data structure for vehicle metrics display
 */
interface VehicleMetricsData {
  vehicleId: string;
  vehicleIdentifier: string;
  type: string;
  utilization: number;
  previousUtilization: number;
  emptyMilesPercentage: number;
  previousEmptyMilesPercentage: number;
  revenuePerMile: number;
  previousRevenuePerMile: number;
  efficiencyScore: number;
  previousEfficiencyScore: number;
  totalMiles: number;
  loadsCompleted: number;
}

/**
 * Time period options for metrics filtering
 */
interface TimePeriod {
  value: 'week' | 'month' | 'quarter' | 'year';
  label: string;
}

/**
 * Options for time period filter
 */
const TIME_PERIOD_OPTIONS: Array<TimePeriod> = [
  { value: 'week', label: 'Last Week' },
  { value: 'month', label: 'Last Month' },
  { value: 'quarter', label: 'Last Quarter' },
  { value: 'year', label: 'Last Year' },
];

/**
 * Default time period for metrics display
 */
const DEFAULT_TIME_PERIOD = 'month';

/**
 * Container for the entire efficiency metrics table component
 */
const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

/**
 * Container for the table header with title and filters
 */
const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Title for the efficiency metrics table
 */
const Title = styled.h2`
  font-size: ${theme.fonts.size.lg};
  font-weight: ${theme.fonts.weight.bold};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

/**
 * Container for the time period filter
 */
const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

/**
 * Label for the time period filter
 */
const FilterLabel = styled.span`
  font-size: ${theme.fonts.size.sm};
  color: ${theme.colors.text.secondary};
`;

/**
 * Styled select component for time period filter
 */
const StyledSelect = styled(Select)`
  width: 150px;
`;

/**
 * Cell for displaying efficiency score with progress bar
 */
const ScoreCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

/**
 * Value display for efficiency score
 */
const ScoreValue = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-weight: ${theme.fonts.weight.medium};
`;

interface TrendIndicatorProps {
  positive: boolean;
}

/**
 * Indicator for trend direction
 */
const TrendIndicator = styled.span<TrendIndicatorProps>`
  display: flex;
  align-items: center;
  font-size: ${theme.fonts.size.sm};
  color: ${(props) =>
    props.positive ? theme.colors.success.main : theme.colors.error.main};
`;

/**
 * Icon container for trend indicators
 */
const TrendIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: ${theme.spacing.xs};
`;

/**
 * Component that displays a table of efficiency metrics for vehicles in the carrier's fleet
 */
const EfficiencyMetricsTable: React.FC<EfficiencyMetricsTableProps> = ({
  carrierId,
  className,
  onVehicleSelect,
}) => {
  // Initialize state for metrics data, loading state, and time period filter
  const [metricsData, setMetricsData] = useState<VehicleMetricsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<string>(DEFAULT_TIME_PERIOD);

  // Create a useEffect hook to fetch vehicle performance metrics when component mounts or time period changes
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Call getFleetPerformance service function to retrieve fleet-wide metrics
        const fleetMetrics: VehiclePerformanceMetrics = await getFleetPerformance(
          carrierId,
          { timeframe: timePeriod as any }
        );

        // Call getVehiclePerformance for each vehicle to get individual metrics
        const vehicleMetricsPromises = fleetMetrics
          ? fleetMetrics.map(async (vehicleMetric) => {
              const vehiclePerformance = await getVehiclePerformance(
                vehicleMetric.vehicle_id,
                { timeframe: timePeriod as any }
              );
              return {
                vehicleId: vehicleMetric.vehicle_id,
                vehicleIdentifier: `${vehiclePerformance.make} ${vehiclePerformance.model} ${vehiclePerformance.year}`,
                type: vehiclePerformance.type,
                utilization: vehiclePerformance.utilization_percentage,
                previousUtilization: vehiclePerformance.utilization_percentage - 5, // Example previous value
                emptyMilesPercentage: vehiclePerformance.empty_miles_percentage,
                previousEmptyMilesPercentage: vehiclePerformance.empty_miles_percentage + 3, // Example previous value
                revenuePerMile: vehiclePerformance.revenue_per_mile,
                previousRevenuePerMile: vehiclePerformance.revenue_per_mile - 0.2, // Example previous value
                efficiencyScore: vehiclePerformance.efficiency_score,
                previousEfficiencyScore: vehiclePerformance.efficiency_score - 2, // Example previous value
                totalMiles: vehiclePerformance.total_miles,
                loadsCompleted: vehiclePerformance.loads_completed,
              };
            })
          : [];

        // Update state with fetched data and set loading to false
        const vehicleMetrics = await Promise.all(vehicleMetricsPromises);
        setMetricsData(vehicleMetrics);
      } catch (error) {
        console.error('Failed to fetch vehicle metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [carrierId, timePeriod]);

  // Define column definitions for the data table with appropriate formatters
  const columns: ColumnDefinition<VehicleMetricsData>[] = useMemo(
    () => [
      {
        field: 'vehicleIdentifier',
        header: 'Vehicle',
        width: '15%',
      },
      {
        field: 'utilization',
        header: 'Utilization',
        width: '15%',
        renderCell: (row) => (
          <ScoreCell>
            <ScoreValue>
              {formatPercentage(row.utilization)}
              {getTrendIndicator(row.utilization, row.previousUtilization)}
            </ScoreValue>
          </ScoreCell>
        ),
      },
      {
        field: 'emptyMilesPercentage',
        header: 'Empty Miles',
        width: '15%',
        renderCell: (row) => (
          <ScoreCell>
            <ScoreValue>
              {formatPercentage(row.emptyMilesPercentage)}
              {getTrendIndicator(
                row.emptyMilesPercentage,
                row.previousEmptyMilesPercentage,
                true
              )}
            </ScoreValue>
          </ScoreCell>
        ),
      },
      {
        field: 'revenuePerMile',
        header: 'Revenue/Mile',
        width: '15%',
        renderCell: (row) => (
          <ScoreCell>
            <ScoreValue>
              {formatCurrency(row.revenuePerMile)}
              {getTrendIndicator(row.revenuePerMile, row.previousRevenuePerMile)}
            </ScoreValue>
          </ScoreCell>
        ),
      },
      {
        field: 'efficiencyScore',
        header: 'Efficiency Score',
        width: '20%',
        renderCell: (row) => (
          <ScoreCell>
            <ScoreValue>
              {row.efficiencyScore}
              {getTrendIndicator(row.efficiencyScore, row.previousEfficiencyScore)}
            </ScoreValue>
            <ProgressBar value={row.efficiencyScore} />
          </ScoreCell>
        ),
      },
    ],
    []
  );

  // Implement handler for time period filter changes
  const handleTimePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(event.target.value);
  };

  return (
    <Container className={className}>
      <Card>
        <HeaderContainer>
          <Title>Vehicle Efficiency Metrics</Title>
          <FilterContainer>
            <FilterLabel>Time Period:</FilterLabel>
            <StyledSelect
              name="timePeriod"
              value={timePeriod}
              options={TIME_PERIOD_OPTIONS}
              onChange={handleTimePeriodChange}
            />
          </FilterContainer>
        </HeaderContainer>
        <DataTable
          data={metricsData}
          columns={columns}
          loading={loading}
          rowProps={{
            isClickable: !!onVehicleSelect,
            onClick: (row: VehicleMetricsData) => {
              onVehicleSelect?.(row.vehicleId);
            },
          }}
        />
      </Card>
    </Container>
  );
};

/**
 * Helper function to format currency values
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

/**
 * Helper function to render trend indicator based on current and previous values
 */
const getTrendIndicator = (
  current: number,
  previous: number,
  inverseColors?: boolean
): JSX.Element => {
  const change = ((current - previous) / previous) * 100;
  const positive = inverseColors ? change < 0 : change > 0;

  return (
    <TrendIndicator positive={positive}>
      <TrendIcon>
        {positive ? <TrendingUpIcon /> : <TrendingDownIcon />}
      </TrendIcon>
      {formatPercentage(change, 1, false)}%
    </TrendIndicator>
  );
};

export default EfficiencyMetricsTable;