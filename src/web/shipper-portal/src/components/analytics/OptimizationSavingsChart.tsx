import React from 'react'; // react ^18.2.0
import { useState, useEffect, useMemo } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import LineChart, { LineChartProps } from '../../../shared/components/charts/LineChart';
import BarChart, { BarChartProps } from '../../../shared/components/charts/BarChart';
import useAuth from '../../../common/hooks/useAuth';
import useDebounce from '../../../common/hooks/useDebounce';
import { getOptimizationSavings } from '../../services/analyticsService';
import { formatCurrency, formatPercentage } from '../../../common/utils/formatters';

/**
 * Interface for the OptimizationSavingsChart component props
 */
interface OptimizationSavingsChartProps {
  dateRange: { startDate: Date; endDate: Date };
  className?: string;
  style?: React.CSSProperties;
  height?: number;
  showCumulative?: boolean;
  showComparison?: boolean;
  loading?: boolean;
}

/**
 * Interface for the optimization savings data structure
 */
interface SavingsData {
  thisWeek: number;
  thisMonth: number;
  ytd: number;
  trend: Array<{ date: string; savings: number }>;
}

/**
 * Interface for a data point in the chart
 */
interface ChartDataPoint {
  date: string;
  savings: number;
  cumulative?: number;
}

/**
 * Formats the tooltip value for the savings chart
 * @param value 
 * @returns Formatted currency string
 */
const formatTooltipValue = (value: any): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '';
  }
  return formatCurrency(value);
};

/**
 * Styled components for the chart
 */
const ChartContainer = styled.div<OptimizationSavingsChartProps>`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => props.height || '400px'};
  margin-bottom: 1.5rem;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const ChartControls = styled.div`
  display: flex;
  gap: 1rem;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'var(--primary-color)' : 'var(--background-secondary)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
`;

const SummaryContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  gap: 1rem;
`;

const SummaryCard = styled.div`
  flex: 1;
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SummaryLabel = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

/**
 * A component that visualizes optimization savings data for shippers, showing both trend and cumulative savings over time
 */
export const OptimizationSavingsChart: React.FC<OptimizationSavingsChartProps> = ({
  dateRange,
  className,
  style,
  height = 400,
  showCumulative = true,
  showComparison = false,
  loading = false,
}) => {
  // Extract authState from useAuth hook to get shipper ID
  const { authState } = useAuth();
  const shipperId = authState.user?.shipperId;

  // Initialize state for savings data
  const [savingsData, setSavingsData] = useState<SavingsData | null>(null);

  // Initialize state for chart view mode (trend or cumulative)
  const [showTrend, setShowTrend] = useState<boolean>(!showCumulative);

  // Create debounced date range to prevent excessive API calls
  const debouncedDateRange = useDebounce(dateRange, 500);

  // Fetch optimization savings data when date range changes
  useEffect(() => {
    if (shipperId) {
      getOptimizationSavings(shipperId, debouncedDateRange)
        .then(data => setSavingsData(data))
        .catch(error => console.error("Error fetching optimization savings:", error));
    }
  }, [shipperId, debouncedDateRange]);

  // Transform the API data into chart-compatible format
  const chartData = useMemo(() => {
    if (!savingsData || !savingsData.trend) {
      return [];
    }

    return savingsData.trend.map(item => ({
      date: item.date,
      savings: item.savings,
    }));
  }, [savingsData]);

  // Calculate cumulative savings by accumulating values over time
  const cumulativeChartData = useMemo(() => {
    if (!chartData) {
      return [];
    }

    let cumulative = 0;
    return chartData.map(item => {
      cumulative += item.savings;
      return {
        ...item,
        cumulative: cumulative,
      };
    });
  }, [chartData]);

  return (
    <ChartContainer height={height} style={style} className={className}>
      {loading && (
        <LoadingOverlay>
          <div>Loading...</div>
        </LoadingOverlay>
      )}
      <ChartHeader>
        <ChartTitle>Optimization Savings</ChartTitle>
        <ChartControls>
          <ToggleButton active={showTrend} onClick={() => setShowTrend(true)}>
            Trend
          </ToggleButton>
          <ToggleButton active={!showTrend} onClick={() => setShowTrend(false)}>
            Cumulative
          </ToggleButton>
        </ChartControls>
      </ChartHeader>
      {showTrend ? (
        <LineChart
          data={chartData}
          xAxisDataKey="date"
          yAxisDataKey="savings"
          yAxisLabel="Savings"
          valueFormatter={formatTooltipValue}
          title="Savings Trend"
        />
      ) : (
        <LineChart
          data={cumulativeChartData}
          xAxisDataKey="date"
          yAxisDataKey="cumulative"
          yAxisLabel="Cumulative Savings"
          valueFormatter={formatTooltipValue}
          title="Cumulative Savings"
        />
      )}
      <SummaryContainer>
        <SummaryCard>
          <SummaryLabel>This Week</SummaryLabel>
          <SummaryValue>{savingsData ? formatCurrency(savingsData.thisWeek) : "$0"}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>This Month</SummaryLabel>
          <SummaryValue>{savingsData ? formatCurrency(savingsData.thisMonth) : "$0"}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Year to Date</SummaryLabel>
          <SummaryValue>{savingsData ? formatCurrency(savingsData.ytd) : "$0"}</SummaryValue>
        </SummaryCard>
      </SummaryContainer>
    </ChartContainer>
  );
};

OptimizationSavingsChart.defaultProps = {
  height: 400,
  showCumulative: true,
  showComparison: false,
  loading: false,
};