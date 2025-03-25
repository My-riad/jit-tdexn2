import React from 'react';
// Import React for component creation. Version: ^18.2.0
import { useState, useEffect, useMemo } from 'react';
// Import React hooks for state management and side effects. Version: ^18.2.0
import { useSelector, useDispatch } from 'react-redux';
// Import Redux hooks for accessing state and dispatching actions. Version: ^8.0.5
import styled from 'styled-components';
// Import CSS-in-JS styling library for component styling. Version: ^5.3.6
import { theme } from '../../../shared/styles/theme';
// Import theme styling for consistent chart appearance
import EfficiencyChart from '../../../shared/components/charts/EfficiencyChart';
// Import the base efficiency chart component from shared components
import { fetchEfficiencyMetrics } from '../../store/actions/analyticsActions';
// Import action creator for fetching efficiency metrics data
import { getEfficiencyMetrics } from '../../services/analyticsService';
// Import service function for fetching efficiency metrics data directly

// Define the props interface for the CarrierEfficiencyChart component
interface CarrierEfficiencyChartProps {
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year'; // Time period to display in the chart
  startDate?: Date | string; // Start date for custom date range
  endDate?: Date | string; // End date for custom date range
  height?: number; // Chart height in pixels
  width?: number | string; // Chart width in pixels or percentage
  title?: string; // Chart title
  subtitle?: string; // Chart subtitle
  chartType?: 'gauge' | 'line' | 'area' | 'combined'; // Type of chart to display
  showEmptyMiles?: boolean; // Whether to show empty miles data series
  showNetworkContribution?: boolean; // Whether to show network contribution data series
  showSmartHubUsage?: boolean; // Whether to show smart hub usage data series
  showTarget?: boolean; // Whether to show target reference line
  showLegend?: boolean; // Whether to show chart legend
  target?: number; // Target efficiency score to display as a reference
  animate?: boolean; // Whether to animate the chart
  className?: string; // Additional CSS class name
  style?: React.CSSProperties; // Additional CSS styles
}

// Styled components for the chart
const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => props.height || '400px'};
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.borders.radius.md};
  box-shadow: ${theme.elevation.sm};
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

const ScoreIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

const CurrentScore = styled.span`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
  margin-right: ${theme.spacing.sm};
`;

const ScoreTrend = styled.span<{ positive: boolean }>`
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

// Formats raw efficiency data from the API for use in the chart component
const formatEfficiencyData = (data: any): Array<{ date: string | Date, score: number, emptyMiles?: number, networkContribution?: number, smartHubUsage?: number }> => {
  // Check if data exists and has history property
  if (!data || !data.history) {
    return []; // Return an empty array if no data
  }

  // Map the data to the format expected by the EfficiencyChart component
  return data.history.map((item: any) => ({
    date: new Date(item.date), // Ensure dates are properly formatted
    score: item.score,
    emptyMiles: item.emptyMiles,
    networkContribution: item.networkContribution,
    smartHubUsage: item.smartHubUsage
  }));
};

// Component that displays efficiency metrics for a carrier fleet
const CarrierEfficiencyChart: React.FC<CarrierEfficiencyChartProps> = (props) => {
  // Destructure props to get timeframe, height, and other configuration options
  const { timeframe, startDate, endDate, height, width, title, subtitle, chartType, showEmptyMiles, showNetworkContribution, showSmartHubUsage, showTarget, showLegend, target, animate, className, style } = props;

  // Use useSelector to get efficiency metrics data from Redux store
  const efficiencyMetrics = useSelector((state: any) => state.analytics.efficiencyMetrics);

  // Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // Use useState to track loading state
  const [loading, setLoading] = useState(false);

  // Use useState to track error state
  const [error, setError] = useState<string | null>(null);

  // Use useEffect to fetch efficiency metrics data when component mounts or timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Dispatch the fetchEfficiencyMetrics action with the specified filters
        await dispatch(fetchEfficiencyMetrics({ timeframe, startDate, endDate }));
      } catch (e: any) {
        setError(e.message || 'Failed to fetch efficiency metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, timeframe, startDate, endDate]);

  // Format the efficiency data using formatEfficiencyData function
  const formattedData = useMemo(() => formatEfficiencyData(efficiencyMetrics), [efficiencyMetrics]);

  // Calculate current score and previous score from the data
  const currentScore = useMemo(() => efficiencyMetrics?.currentScore || 0, [efficiencyMetrics]);
  const previousScore = useMemo(() => efficiencyMetrics?.previousScore, [efficiencyMetrics]);

  // Determine if there's a positive trend by comparing current and previous scores
  const isPositiveTrend = useMemo(() => previousScore !== undefined ? currentScore > previousScore : false, [currentScore, previousScore]);

  // Render the ChartContainer with specified height and style
  return (
    <ChartContainer height={height} style={style} className={className}>
      {/* Render chart header if title or subtitle is provided */}
      {(title || subtitle) && (
        <ChartHeader>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </ChartHeader>
      )}

      {/* If loading, render LoadingIndicator component */}
      {loading && <LoadingIndicator>Loading...</LoadingIndicator>}

      {/* If error, render ErrorMessage component */}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* If data is available, render the EfficiencyChart component with the formatted data */}
      {!loading && !error && (
        <ChartContent>
          <EfficiencyChart
            score={currentScore}
            previousScore={previousScore}
            history={formattedData}
            target={target}
            chartType={chartType}
            showEmptyMiles={showEmptyMiles}
            showNetworkContribution={showNetworkContribution}
            showSmartHubUsage={showSmartHubUsage}
            showTarget={showTarget}
            showLegend={showLegend}
            animate={animate}
          />
        </ChartContent>
      )}
    </ChartContainer>
  );
};

export default CarrierEfficiencyChart;