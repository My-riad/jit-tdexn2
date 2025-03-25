import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux'; //  react-redux ^8.0.5
import styled from 'styled-components'; //  styled-components ^5.3.6
import { theme } from '../../../shared/styles/theme'; // Import theme styling for consistent chart appearance
import { BarChart } from '../../../shared/components/charts/BarChart'; // Import the base bar chart component from shared components
import { fetchSmartHubUsageChart } from '../../store/actions/analyticsActions'; // Import action creator for fetching Smart Hub usage chart data
import { getSmartHubUsageChart } from '../../services/analyticsService'; // Import service function for fetching Smart Hub usage chart data

// Define the interface for the component props
interface SmartHubUsageChartProps {
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: Date | string;
  endDate?: Date | string;
  height?: number;
  width?: number | string;
  title?: string;
  subtitle?: string;
  showNetworkAverage?: boolean;
  showTarget?: boolean;
  showLegend?: boolean;
  target?: number;
  networkAverage?: number;
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Styled Components for layout and visual elements
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

const ChartHeader = styled.div`
  margin-bottom: ${theme.spacing.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: ${theme.colors.text.primary};
`;

const ChartSubtitle = styled.p`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
  margin: 0;
`;

const UsageIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

const CurrentPercentage = styled.span`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
  margin-right: ${theme.spacing.sm};
`;

const PercentageTrend = styled.span<{ positive: boolean }>`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: ${props => props.positive ? theme.colors.semantic.success : theme.colors.semantic.error};
`;

const ChartContent = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
`;

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

const ErrorMessage = styled.div`
  color: ${theme.colors.semantic.error};
  text-align: center;
  margin-top: ${theme.spacing.lg};
`;

const ChartLegend = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${theme.spacing.md};
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing.md};
`;

const LegendColor = styled.span<{ color: string }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: ${theme.spacing.xs};
  background-color: ${props => props.color};
`;

const LegendLabel = styled.span`
  font-size: 12px;
  color: ${theme.colors.text.secondary};
`;

/**
 * Formats raw Smart Hub usage data from the API for use in the chart component
 * @param data Raw Smart Hub usage data
 * @returns Formatted data for the chart
 */
const formatSmartHubUsageData = (data: any): Array<{ name: string; value: number; target?: number }> => {
  // Check if data exists and has history property
  if (!data || !data.history) {
    return [];
  }

  // Map the data to the format expected by the BarChart component
  return data.history.map((item: any) => {
    // Ensure dates are properly formatted for display
    const date = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    // Calculate the Smart Hub usage percentage for each period
    const usagePercentage = item.totalLoads > 0 ? (item.smartHubLoads / item.totalLoads) * 100 : 0;

    return {
      name: date,
      value: usagePercentage,
      target: data.target // Include the target value if available
    };
  });
};

/**
 * Component that displays Smart Hub usage metrics for a carrier fleet
 * @param props Props for the SmartHubUsageChart component
 * @returns Rendered Smart Hub usage chart component
 */
const SmartHubUsageChart: React.FC<SmartHubUsageChartProps> = ({
  timeframe = 'month',
  startDate,
  endDate,
  height = 400,
  width = '100%',
  title = 'Smart Hub Utilization',
  subtitle = 'Percentage of loads using Smart Hubs',
  showNetworkAverage = true,
  showTarget = true,
  showLegend = true,
  target = 75,
  networkAverage = 50,
  animate = true,
  className,
  style
}) => {
  // Use useSelector to get Smart Hub usage chart data from Redux store
  const smartHubUsageChartData = useSelector((state: any) => state.analytics.smartHubUsageChart);

  // Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // Use useState to track loading state
  const [loading, setLoading] = useState(false);

  // Use useEffect to fetch Smart Hub usage chart data when component mounts or timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Dispatch the fetchSmartHubUsageChart action with the specified timeframe
        dispatch(fetchSmartHubUsageChart({ timeframe, startDate, endDate }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, timeframe, startDate, endDate]);

  // Format the Smart Hub usage data using formatSmartHubUsageData function
  const formattedData = useMemo(() => formatSmartHubUsageData(smartHubUsageChartData.data), [smartHubUsageChartData.data]);

  // Calculate current Smart Hub usage percentage and previous percentage from the data
  const currentPercentage = formattedData.length > 0 ? formattedData[formattedData.length - 1].value : 0;
  const previousPercentage = formattedData.length > 1 ? formattedData[formattedData.length - 2].value : 0;

  // Determine if there's a positive trend by comparing current and previous percentages (higher is better)
  const isPositiveTrend = currentPercentage >= previousPercentage;

  // Render the ChartContainer with specified height and style
  return (
    <ChartContainer height={height} style={style} className={className}>
      {/* Chart Header */}
      {(title || subtitle) && (
        <ChartHeader>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
          <UsageIndicator>
            <CurrentPercentage>{currentPercentage.toFixed(0)}%</CurrentPercentage>
            <PercentageTrend positive={isPositiveTrend}>
              {isPositiveTrend ? '▲' : '▼'} {Math.abs(currentPercentage - previousPercentage).toFixed(1)}%
            </PercentageTrend>
          </UsageIndicator>
        </ChartHeader>
      )}

      {/* Chart Content */}
      <ChartContent>
        {loading && <LoadingIndicator>Loading...</LoadingIndicator>}
        {smartHubUsageChartData.error && <ErrorMessage>Error: {smartHubUsageChartData.error}</ErrorMessage>}
        {formattedData.length > 0 && (
          <BarChart
            data={formattedData}
            xAxisDataKey="name"
            yAxisDataKey="value"
            yAxisLabel="Usage (%)"
            barSize={15}
            barGap={2}
            animate={animate}
            colors={[theme.colors.chart.primary]}
            showGrid
            showTooltip
            showLabels={false}
            referenceLines={[
              ...(showNetworkAverage ? [{
                label: 'Network Avg',
                value: networkAverage,
                color: theme.colors.semantic.warning,
                axis: 'y',
                dashed: true
              }] : []),
              ...(showTarget ? [{
                label: 'Target',
                value: target,
                color: theme.colors.semantic.success,
                axis: 'y',
                dashed: true
              }] : [])
            ]}
          />
        )}
      </ChartContent>

      {/* Chart Legend */}
      {showLegend && (
        <ChartLegend>
          <LegendItem>
            <LegendColor color={theme.colors.chart.primary} />
            <LegendLabel>Smart Hub Usage</LegendLabel>
          </LegendItem>
          {showNetworkAverage && (
            <LegendItem>
              <LegendColor color={theme.colors.semantic.warning} />
              <LegendLabel>Network Average</LegendLabel>
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

export default SmartHubUsageChart;