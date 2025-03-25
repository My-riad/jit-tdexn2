import React, { useEffect, useMemo } from 'react'; // version ^18.2.0
import { useSelector } from 'react-redux'; // version ^8.0.5
import styled from 'styled-components/native'; // version ^5.3.10
import { View } from 'react-native'; // version ^0.71.8

import { Card } from '../../../shared/components/cards/Card';
import { Text } from '../../../shared/components/typography/Text';
import { BarChart } from '../../../shared/components/charts/BarChart';
import { LoadingIndicator } from '../../../shared/components/feedback/LoadingIndicator';
import { theme } from '../styles/theme';
import { formatCurrency } from '../../../common/utils/formatters';
import { formatDate } from '../../../common/utils/dateTimeUtils';

// Define the interface for the component props
interface WeeklyEarningsChartProps {
  driverId?: string;
  height?: number;
  showTitle?: boolean;
  className?: string;
}

// Default height for the chart container
const DEFAULT_HEIGHT = 300;

// Color mapping for different earnings types in the chart
const CHART_COLORS = {
  regularEarnings: theme.colors.primary.main,
  efficiencyBonuses: theme.colors.success.main,
};

// Styled components for consistent styling
const Container = styled(View)`
  padding: ${theme.spacing.md};
`;

const Title = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.md};
`;

const ChartContainer = styled(View)<{ height?: number }>`
  height: ${props => props.height || '300px'};
  width: 100%;
`;

const LoadingContainer = styled(View)<{ height?: number }>`
  justify-content: center;
  align-items: center;
  height: ${props => props.height || '300px'};
`;

const ErrorContainer = styled(View)`
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.error.light};
  border-radius: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.md};
`;

const ErrorText = styled(Text)`
  color: ${theme.colors.error.main};
  font-size: 14px;
`;

const EmptyContainer = styled(View)<{ height?: number }>`
  justify-content: center;
  align-items: center;
  height: ${props => props.height || '300px'};
`;

const EmptyText = styled(Text)`
  color: ${theme.colors.text.secondary};
  font-size: 16px;
  text-align: center;
`;

/**
 * Component that displays a bar chart of weekly earnings data
 */
const WeeklyEarningsChart: React.FC<WeeklyEarningsChartProps> = ({
  driverId: propDriverId,
  height = DEFAULT_HEIGHT,
  showTitle = true,
  className,
}) => {
  // Extract driverId and any other props from the component props
  const driverId = propDriverId;

  // Use useSelector to get earnings history data from Redux store
  const earningsHistory = useSelector((state: any) => state.earnings.history);

  // Use useSelector to get history loading state from Redux store
  const isLoading = useSelector((state: any) => state.earnings.isLoading);

  // Use useSelector to get history error state from Redux store
  const error = useSelector((state: any) => state.earnings.error);

  // Use useSelector to get auth state to get current user ID if driverId is not provided
  const auth = useSelector((state: any) => state.auth);
  const currentUserId = auth?.user?.id;

  // Transform earnings history data into format required by BarChart component
  const chartData = useMemo(() => {
    if (!earningsHistory || earningsHistory.length === 0) {
      return [];
    }

    return earningsHistory.map((item: any) => ({
      name: formatDate(item.weekStartDate, 'MMM d'),
      regularEarnings: item.regularEarnings,
      efficiencyBonuses: item.efficiencyBonuses,
      totalEarnings: item.regularEarnings + item.efficiencyBonuses,
    }));
  }, [earningsHistory]);

  // Create data series configuration for regular earnings and efficiency bonuses
  const dataSeries = useMemo(() => [
    {
      name: 'Regular Earnings',
      dataKey: 'regularEarnings',
      color: CHART_COLORS.regularEarnings,
    },
    {
      name: 'Efficiency Bonuses',
      dataKey: 'efficiencyBonuses',
      color: CHART_COLORS.efficiencyBonuses,
    },
  ], []);

  // Define tooltip formatter function to display currency values
  const tooltipFormatter = (value: any) => formatCurrency(value);

  // Define x-axis formatter function to display dates in readable format
  const dateFormatter = (date: any) => formatDate(date, 'MMM d');

  // Render a Card component containing the earnings chart
  return (
    <Card className={className}>
      <Container>
        {showTitle && <Title>Weekly Earnings</Title>}

        {isLoading ? (
          // Handle loading state when data is being fetched
          <LoadingContainer height={height}>
            <LoadingIndicator />
          </LoadingContainer>
        ) : error ? (
          // Handle error state if there was an error fetching data
          <ErrorContainer>
            <ErrorText>Error fetching earnings data.</ErrorText>
          </ErrorContainer>
        ) : chartData.length === 0 ? (
          // Handle empty state if there is no earnings history data
          <EmptyContainer height={height}>
            <EmptyText>No earnings data available.</EmptyText>
          </EmptyContainer>
        ) : (
          // Render the BarChart component with the transformed data
          <ChartContainer height={height}>
            <BarChart
              data={chartData}
              series={dataSeries}
              xAxisDataKey="name"
              yAxisDataKey="totalEarnings"
              tooltipFormatter={tooltipFormatter}
              labelFormatter={dateFormatter}
              yAxisLabel="Earnings"
              xAxisLabel="Week"
            />
          </ChartContainer>
        )}
      </Container>
    </Card>
  );
};

// Export the WeeklyEarningsChart component for use in the driver app
export default WeeklyEarningsChart;