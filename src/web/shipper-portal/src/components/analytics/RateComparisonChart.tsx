import React, { useState, useEffect, useCallback } from 'react'; // React, { useState, useEffect, useCallback } ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import BarChart from '../../../shared/components/charts/BarChart';
import LineChart from '../../../shared/components/charts/LineChart';
import Card from '../../../shared/components/cards/Card';
import DateRangeSelector from './DateRangeSelector';
import { getRateComparison } from '../../services/analyticsService';
import { analyzeRateTrends } from '../../../common/api/marketApi';
import { useAuth } from '../../../common/hooks/useAuth';
import { formatCurrency, formatPercentage } from '../../../common/utils/formatters';

/**
 * Interface for the data structure used by the chart components
 */
interface ChartData {
  barData: Array<{ name: string; actual: number; market: number; savings: number; color: string }>;
  trendData: Array<{ date: string; actual: number; market: number }>;
}

/**
 * Interface for the formatted rate comparison data
 */
interface RateComparisonData {
  overall: {
    actual: number;
    market: number;
    savings: number;
    savingsPercentage: number;
  };
  byLane: Array<{
    name: string;
    actual: number;
    market: number;
    savings: number;
    savingsPercentage: number;
  }>;
}

/**
 * Props interface for the RateComparisonChart component
 */
interface RateComparisonChartProps {
  lanes?: string[];
  title?: string;
  subtitle?: string;
  showTrends?: boolean;
  showDateSelector?: boolean;
  initialDateRange?: { startDate: Date; endDate: Date };
  style?: React.CSSProperties;
  className?: string;
}

// Styled Components
const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 400px;
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

const ChartSubtitle = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0.25rem 0 0 0;
`;

const ChartContent = styled.div`
  flex: 1;
  width: 100%;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#1A73E8' : 'transparent'};
  color: ${props => props.active ? '#1A73E8' : '#666'};
  font-weight: ${props => props.active ? '600' : 'normal'};
`;

const SummaryContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 0.5rem;
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryLabel = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #666;
`;

const SummaryValue = styled.p<{ color?: string }>`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.color || '#000'};
`;

/**
 * Formats the raw rate comparison data for use in the chart components
 */
const formatRateData = (rateData: RateComparisonData): ChartData => {
  // Extract byLane data from the input
  const byLane = rateData?.byLane || [];

  // Map each lane data to the format expected by BarChart
  const barData = byLane.map(lane => ({
    name: `${lane.origin} → ${lane.destination}`,
    actual: lane.actual,
    market: lane.market,
    savings: lane.savings,
    savingsPercentage: lane.savingsPercentage,
    color: lane.savings > 0 ? 'green' : 'red' // Add color coding based on savings
  }));

  // Extract trend data from the input
  const trendData = byLane.map(lane => ({
    date: lane.name,
    actual: lane.actual,
    market: lane.market
  }));

  // Return formatted data object with bar chart and trend data
  return {
    barData: barData,
    trendData: trendData
  };
};

/**
 * Formats rate trend analysis data for the line chart
 */
const formatTrendData = (trendData: any): any => {
  // Extract data points from trend analysis
  const dataPoints = trendData?.dataPoints || [];

  // Format dates and rate values
  const formattedData = dataPoints.map(point => ({
    date: point.date,
    actual: point.actual,
    market: point.market
  }));

  // Create series data for actual rates and market rates
  const seriesData = [
    {
      name: 'Actual Rate',
      dataKey: 'actual',
      color: '#1A73E8'
    },
    {
      name: 'Market Rate',
      dataKey: 'market',
      color: '#34A853'
    }
  ];

  // Return formatted data object for LineChart component
  return {
    formattedData: formattedData,
    seriesData: seriesData
  };
};

/**
 * A component that visualizes the comparison between a shipper's actual rates and market average rates, showing potential savings or areas for improvement
 */
const RateComparisonChart: React.FC<RateComparisonChartProps> = ({
  lanes,
  title = 'Rate Comparison',
  subtitle = 'Your rates compared to market averages',
  showTrends = true,
  showDateSelector = true,
  initialDateRange,
  style,
  className
}) => {
  // Initialize state for date range
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>(
    initialDateRange || {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date()
    }
  );

  // Initialize state for rate data
  const [rateData, setRateData] = useState<RateComparisonData | null>(null);

  // Initialize state for trend data
  const [trendData, setTrendData] = useState<any | null>(null);

  // Initialize state for loading state
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize state for view mode
  const [viewMode, setViewMode] = useState<'comparison' | 'trend'>('comparison');

  // Use the useAuth hook to get the current user's information
  const { authState } = useAuth();
  const shipperId = authState.user?.shipperId;

  // Implement useEffect to fetch rate comparison data when component mounts or date range changes
  useEffect(() => {
    if (shipperId) {
      setLoading(true);
      getRateComparison(shipperId, dateRange, lanes || [])
        .then(data => {
          setRateData(data);
        })
        .catch(error => {
          console.error('Error fetching rate comparison data:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [shipperId, dateRange, lanes]);

  // Implement useEffect to fetch rate trend data when component mounts or date range changes
  useEffect(() => {
    if (shipperId) {
      setLoading(true);
      analyzeRateTrends('US', 'US', 'DRY_VAN', 30)
        .then(data => {
          setTrendData(data);
        })
        .catch(error => {
          console.error('Error fetching rate trend data:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [shipperId, dateRange]);

  // Create a function to handle date range changes from the DateRangeSelector
  const handleDateRangeChange = (newDateRange: { startDate: Date; endDate: Date }) => {
    setDateRange(newDateRange);
  };

  // Create a function to toggle between bar chart and trend chart views
  const handleViewModeToggle = (mode: 'comparison' | 'trend') => {
    setViewMode(mode);
  };

  // Format the fetched data using formatRateData and formatTrendData functions
  const formattedRateChartData = rateData ? formatRateData(rateData) : null;
  const formattedTrendChartData = trendData ? formatTrendData(trendData) : null;

  // Render a Card component as the container
  return (
    <Card style={style} className={className}>
      {/* Render the ChartHeader with title, subtitle, and date selector if showDateSelector is true */}
      {showDateSelector && (
        <ChartHeader>
          <div>
            <ChartTitle>{title}</ChartTitle>
            <ChartSubtitle>{subtitle}</ChartSubtitle>
          </div>
          <DateRangeSelector onChange={handleDateRangeChange} initialDateRange={initialDateRange} />
        </ChartHeader>
      )}

      {/* Render tab buttons to switch between comparison view and trend view if showTrends is true */}
      {showTrends && (
        <TabContainer>
          <Tab active={viewMode === 'comparison'} onClick={() => handleViewModeToggle('comparison')}>
            Rate Comparison
          </Tab>
          <Tab active={viewMode === 'trend'} onClick={() => handleViewModeToggle('trend')}>
            Rate Trends
          </Tab>
        </TabContainer>
      )}

      {/* Render a summary section showing overall savings metrics */}
      {rateData && (
        <SummaryContainer>
          <SummaryItem>
            <SummaryLabel>Overall Savings</SummaryLabel>
            <SummaryValue color={rateData.overall.savings > 0 ? 'green' : 'red'}>
              {formatCurrency(rateData.overall.savings)}
            </SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Savings Percentage</SummaryLabel>
            <SummaryValue color={rateData.overall.savingsPercentage > 0 ? 'green' : 'red'}>
              {formatPercentage(rateData.overall.savingsPercentage)}
            </SummaryValue>
          </SummaryItem>
        </SummaryContainer>
      )}

      <ChartContent>
        {loading ? (
          <div>Loading...</div>
        ) : viewMode === 'comparison' && formattedRateChartData ? (
          <BarChart
            data={formattedRateChartData.barData}
            xAxisDataKey="name"
            yAxisDataKey="savings"
            yAxisLabel="Savings"
            tooltipFormatter={formatCurrency}
          />
        ) : viewMode === 'trend' && formattedTrendChartData ? (
          <LineChart
            data={formattedTrendChartData.formattedData}
            series={formattedTrendChartData.seriesData}
            xAxisDataKey="date"
            yAxisLabel="Rate"
            xAxisLabel="Date"
            valueFormatter={formatCurrency}
          />
        ) : (
          <div>No data available.</div>
        )}
      </ChartContent>
    </Card>
  );
};

export default RateComparisonChart;