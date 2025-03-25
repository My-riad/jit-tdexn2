import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // react-redux v8.0.5
import styled from 'styled-components'; // styled-components v5.3.6
import { theme } from '../../../shared/styles/theme';
import LineChart from '../../../shared/components/charts/LineChart';
import { fetchNetworkContributionChart } from '../../store/actions/analyticsActions';
import { getNetworkContributionChart } from '../../services/analyticsService';

/**
 * Interface defining the props for the NetworkContributionChart component.
 * It includes properties for specifying the timeframe, chart dimensions, titles,
 * and other display options.
 */
interface NetworkContributionChartProps {
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
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Formats raw network contribution data from the API for use in the chart component.
 * It maps the data to the format expected by the LineChart component, ensuring
 * dates are properly formatted and handles cases where data is missing.
 *
 * @param data Raw network contribution data from the API
 * @returns Formatted data for the chart
 */
const formatNetworkContributionData = (data: any): Array<{ date: string | Date, contribution: number, industryAverage?: number }> => {
  // Check if data exists and has history property
  if (!data || !data.history) {
    return [];
  }

  // Map the data to the format expected by the LineChart component
  return data.history.map((item: any) => ({
    date: new Date(item.date), // Ensure dates are properly formatted
    contribution: item.contribution,
    industryAverage: item.industryAverage
  }));
};

/**
 * A styled container for the chart, providing consistent styling and layout.
 */
const ChartContainer = styled.div`
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
 * A styled header for the chart, containing the title and subtitle.
 */
const ChartHeader = styled.div`
  margin-bottom: ${theme.spacing.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * A styled title for the chart.
 */
const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: ${theme.colors.text.primary};
`;

/**
 * A styled subtitle for the chart.
 */
const ChartSubtitle = styled.p`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
  margin: 0;
`;

/**
 * A styled container for displaying the current contribution value.
 */
const ContributionIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

/**
 * A styled span for displaying the current contribution value.
 */
const CurrentContribution = styled.span`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
  margin-right: ${theme.spacing.sm};
`;

/**
 * A styled span for displaying the contribution trend (positive or negative).
 */
const ContributionTrend = styled.span`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: ${props => props.positive ? theme.colors.semantic.success : theme.colors.semantic.error};
`;

/**
 * A styled container for the chart content.
 */
const ChartContent = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
`;

/**
 * A styled indicator to show when the chart data is loading.
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
 * A styled message to show when there is an error fetching chart data.
 */
const ErrorMessage = styled.div`
  color: ${theme.colors.semantic.error};
  text-align: center;
  margin-top: ${theme.spacing.lg};
`;

/**
 * A styled container for the chart legend.
 */
const ChartLegend = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${theme.spacing.md};
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

/**
 * A styled item within the chart legend.
 */
const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing.md};
`;

/**
 * A styled color indicator within the chart legend.
 */
const LegendColor = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: ${theme.spacing.xs};
  background-color: ${props => props.color};
`;

/**
 * A styled label within the chart legend.
 */
const LegendLabel = styled.span`
  font-size: 12px;
  color: ${theme.colors.text.secondary};
`;

/**
 * Component that displays network contribution metrics for a carrier fleet.
 * It fetches data from the Redux store, formats it for the chart, and renders
 * a LineChart component with the network contribution data.
 *
 * @param props Props for configuring the chart
 * @returns Rendered network contribution chart component
 */
const NetworkContributionChart: React.FC<NetworkContributionChartProps> = (props) => {
  // Destructure props to get timeframe, height, and other configuration options
  const {
    timeframe,
    startDate,
    endDate,
    height,
    width,
    title,
    subtitle,
    showIndustryAverage,
    showTarget,
    showLegend,
    target,
    animate,
    className,
    style,
  } = props;

  // Use useSelector to get network contribution data from Redux store
  const networkContributionData = useSelector((state: any) => state.analytics.networkContributionChart.data);
  const networkContributionLoading = useSelector((state: any) => state.analytics.networkContributionChart.loading);
  const networkContributionError = useSelector((state: any) => state.analytics.networkContributionChart.error);

  // Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // Use useState to track loading state
  const [loading, setLoading] = useState(true);

  // Use useEffect to fetch network contribution data when component mounts or timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Dispatch the fetchNetworkContributionChart action with the specified timeframe
        dispatch(fetchNetworkContributionChart({ timeframe, startDate, endDate }));
      } catch (error) {
        console.error('Failed to fetch network contribution chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, timeframe, startDate, endDate]);

  // Format the network contribution data using formatNetworkContributionData function
  const formattedData = useMemo(() => formatNetworkContributionData(networkContributionData), [networkContributionData]);

  // Calculate current contribution and previous contribution from the data
  const currentContribution = formattedData.length > 0 ? formattedData[formattedData.length - 1].contribution : 0;
  const previousContribution = formattedData.length > 1 ? formattedData[formattedData.length - 2].contribution : 0;

  // Determine if there's a positive trend by comparing current and previous contributions
  const isPositiveTrend = currentContribution > previousContribution;

  // Define chart series based on whether to show industry average
  const chartSeries = useMemo(() => {
    const series = [{
      name: 'Your Fleet',
      dataKey: 'contribution',
      color: theme.colors.chart.primary
    }];

    if (showIndustryAverage) {
      series.push({
        name: 'Industry Average',
        dataKey: 'industryAverage',
        color: theme.colors.chart.secondary,
        strokeDashed: true
      });
    }

    return series;
  }, [showIndustryAverage, theme.colors.chart.primary, theme.colors.chart.secondary]);

  // Render the ChartContainer with specified height and style
  return (
    <ChartContainer height={height} style={style} className={className}>
      {/* Render chart header with title, subtitle, and contribution indicator */}
      <ChartHeader>
        <div>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </div>
        <ContributionIndicator>
          <CurrentContribution>{currentContribution}%</CurrentContribution>
          <ContributionTrend positive={isPositiveTrend}>
            {isPositiveTrend ? '▲' : '▼'} {Math.abs(currentContribution - previousContribution)}%
          </ContributionTrend>
        </ContributionIndicator>
      </ChartHeader>

      {/* Render chart content based on loading state and data availability */}
      <ChartContent>
        {networkContributionLoading || loading ? (
          <LoadingIndicator>Loading...</LoadingIndicator>
        ) : networkContributionError ? (
          <ErrorMessage>Error: {networkContributionError}</ErrorMessage>
        ) : formattedData.length > 0 ? (
          <LineChart
            data={formattedData}
            series={chartSeries}
            xAxisDataKey="date"
            yAxisLabel="Contribution (%)"
            showGrid
            showLegend={showLegend}
            animate={animate}
            valueFormatter={(value) => `${value}%`}
          />
        ) : (
          <ErrorMessage>No data available for the selected timeframe.</ErrorMessage>
        )}
      </ChartContent>
    </ChartContainer>
  );
};

export default NetworkContributionChart;