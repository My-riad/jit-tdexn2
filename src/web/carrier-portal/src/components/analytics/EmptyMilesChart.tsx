import React, { useState, useEffect, useMemo } from 'react'; //  version: ^18.2.0
import { useSelector, useDispatch } from 'react-redux'; //  version: ^8.0.5
import styled from 'styled-components'; //  version: ^5.3.6
import { theme } from '../../../shared/styles/theme';
import { BarChart } from '../../../shared/components/charts/BarChart';
import { fetchEmptyMilesChart, getEmptyMilesChart } from '../../store/actions/analyticsActions';
import { AnalyticsFilter } from '../../../common/interfaces';

/**
 * Interface defining the structure of a single data point for the chart
 */
interface ChartDataPoint {
  name: string;
  value: number;
  target?: number;
}

/**
 * Props interface for the EmptyMilesChart component
 */
interface EmptyMilesChartProps {
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: Date | string;
  endDate?: Date | string;
  height?: number;
  width?: number | string;
  title?: string;
  subtitle?: string;
  showIndustryAverage?: boolean;
  showTarget?: boolean;
  showLegend?: boolean;
  target?: number;
  industryAverage?: number;
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Styled component for the chart container
 */
const ChartContainer = styled.div<{ height?: number }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => props.height || '400px'};
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.borders.radius.md};
  box-shadow: ${theme.shadows.sm};
`;

/**
 * Styled component for the chart header
 */
const ChartHeader = styled.div`
  margin-bottom: ${theme.spacing.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * Styled component for the chart title
 */
const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: ${theme.colors.text.primary};
`;

/**
 * Styled component for the chart subtitle
 */
const ChartSubtitle = styled.p`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
  margin: 0;
`;

/**
 * Styled component for the empty miles indicator
 */
const EmptyMilesIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

/**
 * Styled component for the current percentage
 */
const CurrentPercentage = styled.span`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
  margin-right: ${theme.spacing.sm};
`;

/**
 * Styled component for the percentage trend
 */
const PercentageTrend = styled.span<{ positive?: boolean }>`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: ${props => props.positive ? theme.colors.semantic.success : theme.colors.semantic.error};
`;

/**
 * Styled component for the chart content
 */
const ChartContent = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
`;

/**
 * Styled component for the loading indicator
 */
const LoadingIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
`;

/**
 * Styled component for the error message
 */
const ErrorMessage = styled.div`
  color: ${theme.colors.semantic.error};
  text-align: center;
  margin-top: ${theme.spacing.lg};
`;

/**
 * Styled component for the chart legend
 */
const ChartLegend = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${theme.spacing.md};
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

/**
 * Styled component for a legend item
 */
const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing.md};
`;

/**
 * Styled component for the legend color indicator
 */
const LegendColor = styled.span<{ color?: string }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: ${theme.spacing.xs};
  background-color: ${props => props.color};
`;

/**
 * Styled component for the legend label
 */
const LegendLabel = styled.span`
  font-size: 12px;
  color: ${theme.colors.text.secondary};
`;

/**
 * Formats raw empty miles data from the API for use in the chart component
 * @param data Raw empty miles data from the API
 * @returns Formatted data for the chart
 */
const formatEmptyMilesData = (data: any): Array<ChartDataPoint> => {
  if (!data || !data.history) {
    return [];
  }

  return data.history.map((item: any) => ({
    name: new Date(item.date).toLocaleDateString(), // Ensure dates are properly formatted for display
    value: item.emptyMilesPercentage, // Calculate the empty miles percentage for each period
  }));
};

/**
 * Component that displays empty miles metrics for a carrier fleet
 * @param props Props for the EmptyMilesChart component
 * @returns Rendered empty miles chart component
 */
const EmptyMilesChart: React.FC<EmptyMilesChartProps> = ({
  timeframe = 'month',
  startDate,
  endDate,
  height = 400,
  width = '100%',
  title = 'Empty Miles Percentage',
  subtitle = 'Percentage of miles driven without a load',
  showIndustryAverage = true,
  showTarget = true,
  showLegend = true,
  target = 10,
  industryAverage = 35,
  animate = true,
  className,
  style,
}) => {
  // Use useSelector to get empty miles chart data from Redux store
  const emptyMilesChartData = useSelector((state: any) => state.analytics.emptyMilesChartData);

  // Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // Use useState to track loading state
  const [loading, setLoading] = useState(false);

  // Use useState to track error state
  const [error, setError] = useState<string | null>(null);

  // Use useEffect to fetch empty miles chart data when component mounts or timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct the analytics filter based on the props
        const analyticsFilter: AnalyticsFilter = {
          timeframe,
          startDate,
          endDate,
        };

        // Dispatch the fetchEmptyMilesChart action with the analytics filter
        dispatch(fetchEmptyMilesChart(analyticsFilter));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch empty miles chart data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, startDate, endDate, dispatch]);

  // Format the empty miles data using formatEmptyMilesData function
  const formattedData = useMemo(() => formatEmptyMilesData(emptyMilesChartData), [emptyMilesChartData]);

  // Calculate current empty miles percentage and previous percentage from the data
  const currentPercentage = formattedData.length > 0 ? formattedData[formattedData.length - 1].value : 0;
  const previousPercentage = formattedData.length > 1 ? formattedData[formattedData.length - 2].value : 0;

  // Determine if there's a positive trend by comparing current and previous percentages (lower is better)
  const positiveTrend = currentPercentage <= previousPercentage;

  return (
    <ChartContainer height={height} style={style} className={className}>
      <ChartHeader>
        <ChartTitle>{title}</ChartTitle>
        <ChartSubtitle>{subtitle}</ChartSubtitle>
        {formattedData.length > 0 && (
          <EmptyMilesIndicator>
            <CurrentPercentage>{currentPercentage.toFixed(1)}%</CurrentPercentage>
            <PercentageTrend positive={positiveTrend}>
              {positiveTrend ? '▼' : '▲'} {Math.abs(currentPercentage - previousPercentage).toFixed(1)}%
            </PercentageTrend>
          </EmptyMilesIndicator>
        )}
      </ChartHeader>

      <ChartContent>
        {loading && <LoadingIndicator>Loading...</LoadingIndicator>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!loading && !error && formattedData.length > 0 && (
          <BarChart
            data={formattedData}
            xAxisDataKey="name"
            yAxisDataKey="value"
            colors={[theme.colors.chart.primary]}
            showGrid
            showTooltip
            showLabels
            animate={animate}
            referenceLines={[
              ...(showIndustryAverage ? [{
                label: 'Industry Avg',
                value: industryAverage,
                color: theme.colors.semantic.warning,
              }] : []),
              ...(showTarget ? [{
                label: 'Target',
                value: target,
                color: theme.colors.semantic.success,
              }] : []),
            ]}
          />
        )}
      </ChartContent>

      {showLegend && (
        <ChartLegend>
          <LegendItem>
            <LegendColor color={theme.colors.chart.primary} />
            <LegendLabel>Empty Miles Percentage</LegendLabel>
          </LegendItem>
          {showIndustryAverage && (
            <LegendItem>
              <LegendColor color={theme.colors.semantic.warning} />
              <LegendLabel>Industry Average</LegendLabel>
            </LegendItem>
          )}
          {showTarget && (
            <LegendItem>
              <LegendColor color={theme.colors.semantic.success} />
              <LegendLabel>Target</LegendLabel>
            </LegendItem>
          )}
        </ChartLegend>
      )}
    </ChartContainer>
  );
};

export default EmptyMilesChart;