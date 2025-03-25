import React, { useState, useEffect, useCallback } from 'react'; // React, { useState, useEffect, useCallback } ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import LineChart from '../../../shared/components/charts/LineChart';
import DateRangeSelector from './DateRangeSelector';
import { theme } from '../../../shared/styles/theme';
import Card from '../../../shared/components/cards/Card';
import { getOnTimePerformance } from '../../services/analyticsService';

/**
 * Interface defining the structure of on-time performance data from the API
 */
interface OnTimePerformanceData {
  overall: number;
  byCarrier: Array<{
    carrierId: string;
    name: string;
    onTimeRate: number;
    earlyRate: number;
    lateRate: number;
  }>;
  timeSeries: Array<{
    date: string;
    onTimeRate: number;
    earlyRate: number;
    lateRate: number;
  }>;
}

/**
 * Props for the OnTimePerformanceChart component
 */
interface OnTimePerformanceChartProps {
  shipperId: string;
  height?: number;
  className?: string;
  title?: string;
}

/**
 * Default height for the chart in pixels
 */
const DEFAULT_HEIGHT = 400;

/**
 * Configuration for the data series displayed in the chart
 */
const CHART_SERIES = [
  { name: 'On-Time', dataKey: 'onTimeRate', color: 'theme.colors.semantic.success' },
  { name: 'Early', dataKey: 'earlyRate', color: 'theme.colors.semantic.info' },
  { name: 'Late', dataKey: 'lateRate', color: 'theme.colors.semantic.error' },
];

/**
 * Styled container for the chart with consistent styling
 */
const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => props.height || 'auto'};
  gap: ${theme.spacing.md};
`;

/**
 * Styled header for the chart, containing the title and overall metric
 */
const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.sm};
`;

/**
 * Styled title for the chart
 */
const ChartTitle = styled.h3`
  font-size: ${theme.fonts.size.lg};
  font-weight: ${theme.fonts.weight.bold};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

/**
 * Styled container for the overall metric
 */
const OverallMetric = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

/**
 * Styled label for the overall metric
 */
const MetricLabel = styled.span`
  font-size: ${theme.fonts.size.sm};
  color: ${theme.colors.text.secondary};
`;

/**
 * Styled value for the overall metric
 */
const MetricValue = styled.span`
  font-size: ${theme.fonts.size.md};
  font-weight: ${theme.fonts.weight.medium};
  color: ${theme.colors.semantic.success};
`;

/**
 * Styled container for the chart content
 */
const ChartContent = styled.div`
  flex: 1;
  width: 100%;
  min-height: 300px;
`;

/**
 * Styled container for the loading indicator
 */
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
`;

/**
 * Styled container for the error message
 */
const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
  color: ${theme.colors.semantic.error};
`;

/**
 * Formats a number as a percentage with specified decimal places
 * @param value 
 * @param decimalPlaces 
 * @returns 
 */
const formatPercentage = (value: number, decimalPlaces: number): string => {
  // LD1: Check if value is a valid number
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }

  // LD1: Multiply value by 100 to convert to percentage
  const percentage = value * 100;

  // LD1: Round to specified decimal places
  const roundedPercentage = percentage.toFixed(decimalPlaces);

  // LD1: Return formatted string with % symbol
  return `${roundedPercentage}%`;
};

/**
 * Transforms API response data into the format required by the LineChart component
 * @param apiData 
 * @returns 
 */
const transformDataForChart = (apiData: any): { data: Array<any>; series: Array<any> } => {
  // LD1: Extract time series data from API response
  const timeSeriesData = apiData?.timeSeries || [];

  // LD1: Map each data point to include date and performance metrics
  const data = timeSeriesData.map((item: any) => ({
    date: item.date,
    onTimeRate: item.onTimeRate,
    earlyRate: item.earlyRate,
    lateRate: item.lateRate,
  }));

  // LD1: Create series configuration for on-time, early, and late percentages
  const series = CHART_SERIES.map(s => ({
    ...s,
    color: theme.colors.semantic[s.dataKey === 'onTimeRate' ? 'success' : s.dataKey === 'earlyRate' ? 'info' : 'error'],
  }));

  // LD1: Return object containing data array and series configuration
  return { data, series };
};

/**
 * Component that displays on-time performance metrics for carriers over time
 * @param props 
 * @returns 
 */
const OnTimePerformanceChart: React.FC<OnTimePerformanceChartProps> = (props) => {
  // LD1: Destructure props including shipperId, height, className, and title
  const { shipperId, height = DEFAULT_HEIGHT, className, title = 'On-Time Performance' } = props;

  // LD1: Set up state for chart data using useState
  const [chartData, setChartData] = useState<{ data: Array<any>; series: Array<any> } | null>(null);

  // LD1: Set up state for loading status using useState
  const [loading, setLoading] = useState<boolean>(false);

  // LD1: Set up state for error message using useState
  const [error, setError] = useState<string | null>(null);

  // LD1: Set up state for selected date range using useState
  const [selectedDateRange, setSelectedDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  // LD1: Create a fetchData function using useCallback to retrieve on-time performance data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // LD1: Call the getOnTimePerformance service function with shipperId and date range
      const apiData = await getOnTimePerformance(shipperId, selectedDateRange);

      // LD1: Transform the API response into the format required by the LineChart component
      const transformedData = transformDataForChart(apiData);
      setChartData(transformedData);
    } catch (e: any) {
      // LD1: Handle loading states and potential errors during data fetching
      setError(e.message || 'Failed to fetch on-time performance data.');
      setChartData(null);
    } finally {
      setLoading(false);
    }
  }, [shipperId, selectedDateRange]);

  // LD1: Use useEffect to fetch data when shipperId or date range changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // LD1: Create a handleDateRangeChange function to update the selected date range
  const handleDateRangeChange = (dateRange: { startDate: Date; endDate: Date }) => {
    setSelectedDateRange(dateRange);
  };

  // LD1: Render the ChartContainer component with appropriate styling
  return (
    <ChartContainer className={className} height={height}>
      {/* LD1: Render the DateRangeSelector component for filtering by time period */}
      <DateRangeSelector onChange={handleDateRangeChange} />

      {/* LD1: Render the Card component containing the chart */}
      <Card>
        {/* LD1: Render the ChartHeader with title and overall on-time percentage */}
        <ChartHeader>
          <ChartTitle>{title}</ChartTitle>
          {chartData && (
            <OverallMetric>
              <MetricLabel>Overall:</MetricLabel>
              <MetricValue>{formatPercentage(chartData?.data.reduce((sum, item) => sum + item.onTimeRate, 0) / chartData?.data.length, 1)}</MetricValue>
            </OverallMetric>
          )}
        </ChartHeader>

        <ChartContent>
          {loading && (
            // LD1: Display loading indicator when data is being fetched
            <LoadingContainer>Loading...</LoadingContainer>
          )}
          {error && (
            // LD1: Display error message if data fetching fails
            <ErrorContainer>{error}</ErrorContainer>
          )}
          {chartData && !loading && !error && (
            // LD1: Render the LineChart component with the transformed data
            <LineChart
              data={chartData.data}
              series={chartData.series}
              xAxisDataKey="date"
              yAxisLabel="Percentage"
              valueFormatter={(value) => formatPercentage(value, 0)}
            />
          )}
        </ChartContent>
      </Card>
    </ChartContainer>
  );
};

export default OnTimePerformanceChart;

export type { OnTimePerformanceChartProps };