import React, { useState, useEffect, useCallback, useMemo } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { useSelector, useDispatch } from 'react-redux'; // react-redux ^8.0.5

import LineChart from '../../../../shared/components/charts/LineChart'; // LineChart component for visualizing efficiency trends over time
import BarChart from '../../../../shared/components/charts/BarChart'; // Bar chart component for comparing efficiency scores across drivers
import DateRangeSelector from './DateRangeSelector'; // Component for selecting date ranges to filter efficiency data
import Card from '../../../../shared/components/cards/Card'; // Container component for the chart with consistent styling
import Select from '../../../../shared/components/forms/Select'; // Dropdown component for selecting drivers or view modes
import { theme } from '../../../../shared/styles/theme'; // Theme variables for consistent styling
import { getDriverEfficiencyChart } from '../../services/analyticsService'; // Service function to fetch driver efficiency data from the API
import { DriverScore } from '../../../../common/interfaces/driver.interface'; // Interface for driver efficiency score data structure

/**
 * Enum for different chart view modes
 */
export enum ViewMode {
  TREND = 'trend', // View efficiency trends over time
  COMPARISON = 'comparison', // Compare efficiency across drivers
  DETAILED = 'detailed', // Detailed breakdown of efficiency components
}

/**
 * Enum for different chart types
 */
export enum ChartType {
  LINE = 'line', // Line chart for trends over time
  BAR = 'bar', // Bar chart for comparisons
  STACKED_BAR = 'stacked-bar', // Stacked bar chart for component breakdown
}

/**
 * Props for the DriverEfficiencyChart component
 */
interface DriverEfficiencyChartProps {
  className?: string;
  title?: string;
  subtitle?: string;
  driverId?: string;
  viewMode?: ViewMode;
  showFilters?: boolean;
  height?: number;
  showLegend?: boolean;
  chartType?: ChartType;
}

/**
 * Structure for chart data returned from the API
 */
interface ChartData {
  timeframe: string;
  data: any[];
  metadata: any;
}

/**
 * Structure for date range selection
 */
interface DateRange {
  startDate: Date;
  endDate: Date;
  timeframe?: string;
}

/**
 * Styled container for the chart
 */
const ChartContainer = styled.div<{ height?: number }>`
  width: 100%;
  height: ${props => props.height || 'auto'};
  margin-bottom: ${theme.spacing.lg};
`;

/**
 * Styled container for the chart header
 */
const ChartHeader = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Styled title for the chart
 */
const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 ${theme.spacing.xs} 0;
  color: ${theme.colors.text.primary};
`;

/**
 * Styled subtitle for the chart
 */
const ChartSubtitle = styled.p`
  font-size: 0.875rem;
  margin: 0;
  color: ${theme.colors.text.secondary};
`;

/**
 * Styled container for the filters
 */
const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Styled container for the select dropdown
 */
const SelectContainer = styled.div`
  min-width: 200px;
`;

/**
 * Styled container for the chart content
 */
const ChartContent = styled.div<{ height?: number }>`
  position: relative;
  width: 100%;
  height: ${props => props.height || '400px'};
`;

/**
 * Styled overlay for loading state
 */
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1;
`;

/**
 * Styled container for error messages
 */
const ErrorMessage = styled.div`
  color: ${theme.colors.error};
  padding: ${theme.spacing.md};
  text-align: center;
`;

/**
 * Options for view mode selector dropdown
 */
const VIEW_MODE_OPTIONS = [
  { value: ViewMode.TREND, label: 'Trend Over Time' },
  { value: ViewMode.COMPARISON, label: 'Driver Comparison' },
  { value: ViewMode.DETAILED, label: 'Detailed Breakdown' },
];

/**
 * Default height for the chart in pixels
 */
const DEFAULT_HEIGHT = 400;

/**
 * Score component definitions for detailed breakdown
 */
const SCORE_COMPONENTS = [
  { key: 'emptyMilesScore', label: 'Empty Miles Reduction', color: theme.colors.chart.green },
  { key: 'networkContributionScore', label: 'Network Contribution', color: theme.colors.chart.blue },
  { key: 'onTimeScore', label: 'On-Time Performance', color: theme.colors.chart.purple },
  { key: 'hubUtilizationScore', label: 'Smart Hub Utilization', color: theme.colors.chart.orange },
  { key: 'fuelEfficiencyScore', label: 'Fuel Efficiency', color: theme.colors.chart.teal },
];

/**
 * Component that displays driver efficiency metrics in chart form
 * @param props Props for the DriverEfficiencyChart component
 * @returns Rendered chart component
 */
const DriverEfficiencyChart: React.FC<DriverEfficiencyChartProps> = (props) => {
  // LD1: Destructure props including className, title, subtitle, driverId, and viewMode
  const { className, title, subtitle, driverId: propDriverId, viewMode: propViewMode, showFilters = true, height = DEFAULT_HEIGHT, showLegend = true, chartType = ChartType.LINE } = props;

  // LD2: Set up state for chart data using useState
  const [chartData, setChartData] = useState<ChartData | null>(null);
  // LD2: Set up state for loading status using useState
  const [loading, setLoading] = useState<boolean>(false);
  // LD2: Set up state for error messages using useState
  const [error, setError] = useState<string | null>(null);
  // LD2: Set up state for selected date range using useState
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null });
  // LD2: Set up state for selected driver ID using useState
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(propDriverId);
  // LD2: Set up state for selected view mode using useState
  const [selectedViewMode, setSelectedViewMode] = useState<ViewMode>(propViewMode || ViewMode.TREND);

  // LD3: Use useSelector to get driver list from Redux store
  const driverList = useSelector((state: any) => state.drivers.drivers);
  // LD3: Use useDispatch to dispatch actions if needed
  const dispatch = useDispatch();

  // LD4: Create a memoized list of driver options for the dropdown using useMemo
  const driverOptions = useMemo(() => {
    return driverList.map((driver: any) => ({
      value: driver.id,
      label: `${driver.firstName} ${driver.lastName}`,
    }));
  }, [driverList]);

  /**
   * Handles date range changes
   * @param newDateRange The new date range
   */
  const handleDateRangeChange = useCallback((newDateRange: { startDate: Date | null; endDate: Date | null }) => {
    // LD5: Set the date range in state
    setDateRange(newDateRange);
  }, []);

  /**
   * Handles driver selection changes
   * @param event The change event from the select dropdown
   */
  const handleDriverSelectionChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    // LD6: Get the selected driver ID from the event
    const driverId = event.target.value;
    // LD6: Set the selected driver ID in state
    setSelectedDriverId(driverId);
  }, []);

  /**
   * Handles view mode changes
   * @param event The change event from the select dropdown
   */
  const handleViewModeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    // LD7: Get the selected view mode from the event
    const viewMode = event.target.value as ViewMode;
    // LD7: Set the selected view mode in state
    setSelectedViewMode(viewMode);
  }, []);

  /**
   * Fetches chart data based on selected filters
   */
  const fetchData = useCallback(async () => {
    // LD8: Set loading state to true
    setLoading(true);
    // LD8: Clear any previous errors
    setError(null);

    try {
      // LD8: Call the getDriverEfficiencyChart service function with appropriate filters
      const data = await getDriverEfficiencyChart({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        driverId: selectedDriverId,
      });
      // LD8: Set the chart data in state
      setChartData(data);
    } catch (err: any) {
      // LD8: Set the error message in state
      setError(err.message || 'Failed to fetch chart data');
    } finally {
      // LD8: Set loading state to false
      setLoading(false);
    }
  }, [dateRange, selectedDriverId]);

  // LD9: Use useEffect to fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Formats raw data for trend visualization
   * @param data Raw API data
   * @returns Formatted data for LineChart
   */
  const formatTrendData = useCallback((data: any) => {
    // LD10: Transform raw API data into format expected by LineChart
    return {
      series: [{ name: 'Efficiency Score', dataKey: 'efficiencyScore' }],
      data: data.map((item: DriverScore) => ({
        x: item.calculatedAt,
        efficiencyScore: item.totalScore,
      })),
    };
  }, []);

  /**
   * Formats raw data for driver comparison visualization
   * @param data Raw API data
   * @returns Formatted data for BarChart
   */
  const formatComparisonData = useCallback((data: any) => {
    // LD11: Transform raw API data into format expected by BarChart
    return {
      series: [{ name: 'Efficiency Score', dataKey: 'efficiencyScore' }],
      data: data.map((item: DriverScore) => ({
        name: item.driverId,
        efficiencyScore: item.totalScore,
      })),
    };
  }, []);

  /**
   * Formats score values for display in charts
   * @param value Score value
   * @returns Formatted score value
   */
  const formatScoreValue = useCallback((value: number) => {
    // LD12: Round the value to one decimal place
    const roundedValue = value.toFixed(1);
    // LD12: Return the formatted value as a string
    return roundedValue;
  }, []);

  // LD13: Render the ChartContainer component
  return (
    <ChartContainer className={className} height={height}>
      {/* LD13: Render the ChartHeader with title and subtitle if provided */}
      {(title || subtitle) && (
        <ChartHeader>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </ChartHeader>
      )}

      {/* LD13: Render the FilterContainer with DateRangeSelector and driver/view selectors */}
      {showFilters && (
        <FilterContainer>
          <DateRangeSelector onChange={handleDateRangeChange} />
          <SelectContainer>
            <Select
              label="Driver"
              value={selectedDriverId || ''}
              options={driverOptions}
              onChange={handleDriverSelectionChange}
            />
          </SelectContainer>
          <SelectContainer>
            <Select
              label="View Mode"
              value={selectedViewMode}
              options={VIEW_MODE_OPTIONS}
              onChange={handleViewModeChange}
            />
          </SelectContainer>
        </FilterContainer>
      )}

      <Card>
        {/* LD13: Render loading state when data is being fetched */}
        {loading && (
          <LoadingOverlay>
            <div>Loading...</div>
          </LoadingOverlay>
        )}

        {/* LD13: Render error message when data fetching fails */}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* LD13: Render LineChart for trend view mode */}
        {!loading && !error && selectedViewMode === ViewMode.TREND && chartData && (
          <LineChart
            data={formatTrendData(chartData.data).data}
            series={formatTrendData(chartData.data).series}
            height={height}
            showLegend={showLegend}
            valueFormatter={formatScoreValue}
          />
        )}

        {/* LD13: Render BarChart for comparison view mode */}
        {!loading && !error && selectedViewMode === ViewMode.COMPARISON && chartData && (
          <BarChart
            data={formatComparisonData(chartData.data).data}
            series={formatComparisonData(chartData.data).series}
            height={height}
            showLegend={showLegend}
            valueFormatter={formatScoreValue}
          />
        )}
      </Card>
    </ChartContainer>
  );
};

export default DriverEfficiencyChart;
export type { DriverEfficiencyChartProps };