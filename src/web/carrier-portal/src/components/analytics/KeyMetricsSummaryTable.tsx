import React, { useState, useEffect, useMemo } from 'react'; // React v18.2.0
import { useSelector, useDispatch } from 'react-redux'; // react-redux v8.0.5
import styled from 'styled-components'; // styled-components v5.3.6
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // react-icons/fa v4.8.0

import DataTable, { ColumnDefinition } from '../../../shared/components/tables/DataTable';
import { theme } from '../../../shared/styles/theme';
import DateRangeSelector, { DateRange } from './DateRangeSelector';
import { fetchKeyMetricsSummary } from '../../store/actions/analyticsActions';
import { getKeyMetricsSummary } from '../../services/analyticsService';
import { formatPercentage, formatCurrency } from '../../../common/utils/formatters';

/**
 * Props for the KeyMetricsSummaryTable component
 */
interface KeyMetricsSummaryTableProps {
  title?: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  showDateRange?: boolean;
  defaultTimeframe?: string;
  showDownload?: boolean;
  onDownload?: (format: string) => void;
}

/**
 * Interface for a key metric item
 */
interface KeyMetric {
  id: string;
  name: string;
  category: string;
  current: number;
  previous: number;
  change: number;
  target: number;
  unit: string;
  isPositiveGood: boolean;
}

/**
 * Interface for the key metrics summary data
 */
interface KeyMetricsSummary {
  metrics: KeyMetric[];
  timeframe: string;
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
}

// Constants
const DEFAULT_TITLE = 'Key Metrics Summary';
const DEFAULT_TIMEFRAME = 'last30days';

/**
 * Column definitions for the metrics table
 */
const COLUMN_DEFINITIONS: Array<ColumnDefinition<KeyMetric>> = [
  { field: 'name', header: 'Metric', width: '30%', sortable: true },
  { field: 'current', header: 'Current', width: '15%', sortable: true, align: 'right' },
  { field: 'previous', header: 'Previous', width: '15%', sortable: true, align: 'right' },
  { field: 'change', header: 'Change', width: '20%', sortable: true, align: 'right' },
  { field: 'target', header: 'Target', width: '20%', sortable: true, align: 'right' },
];

// Styled Components
const TableContainer = styled.div`
  width: 100%;
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.borders.radius.md};
  box-shadow: ${theme.shadows.sm};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border.light};
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${theme.colors.text.secondary};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl};
  min-height: 200px;
`;

const ErrorMessage = styled.div`
  color: ${theme.colors.semantic.error};
  text-align: center;
  padding: ${theme.spacing.lg};
`;

const ChangeIndicator = styled.span<{ isGood: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${props => props.isGood ? theme.colors.semantic.success : theme.colors.semantic.error};
  font-weight: 500;
`;

const DownloadButton = styled.button`
  background-color: ${theme.colors.primary.main};
  color: ${theme.colors.primary.contrastText};
  border: none;
  border-radius: ${theme.borders.radius.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};

  &:hover {
    background-color: ${theme.colors.primary.dark};
  }
`;

const TargetCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const TargetIndicator = styled.div<{ status: 'above' | 'below' | 'met' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props =>
    props.status === 'above' ? theme.colors.semantic.success :
    props.status === 'below' ? theme.colors.semantic.error :
    theme.colors.semantic.warning};
`;

/**
 * Component that displays a summary table of key performance metrics
 */
const KeyMetricsSummaryTable: React.FC<KeyMetricsSummaryTableProps> = (props) => {
  // LD1: Destructure props to get title, subtitle, className, and other configuration options
  const { title = DEFAULT_TITLE, subtitle, className, style, showDateRange, defaultTimeframe, showDownload, onDownload } = props;

  // LD2: Use useSelector to get key metrics summary data from Redux store
  const keyMetricsSummary = useSelector((state: any) => state.analytics.keyMetricsSummary);

  // LD3: Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // LD4: Use useState to track loading state
  const [loading, setLoading] = useState(false);

  // LD5: Use useState to track date range for filtering metrics
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    timeframe: defaultTimeframe || DEFAULT_TIMEFRAME,
  });

  /**
   * Handles date range selection changes
   */
  const handleDateRangeChange = (dateRange: DateRange) => {
    // Update the date range state with the new value
    setDateRange(dateRange);
    // Trigger a new data fetch with the updated date range
    fetchData(dateRange);
  };

  /**
   * Fetches key metrics summary data from the API
   */
  const fetchData = async (filters: DateRange) => {
    setLoading(true);
    try {
      // Call the service function to fetch key metrics summary data
      const data = await getKeyMetricsSummary({
        startDate: filters.startDate,
        endDate: filters.endDate,
        timeframe: filters.timeframe,
      });
      // Dispatch the success action with the fetched data
      dispatch(fetchKeyMetricsSummarySuccess(data));
    } catch (error: any) {
      // Dispatch the failure action with the error message
      dispatch(fetchKeyMetricsSummaryFailure(error.message));
    } finally {
      setLoading(false);
    }
  };

  // LD6: Use useEffect to fetch key metrics summary data when component mounts or date range changes
  useEffect(() => {
    fetchData(dateRange);
  }, []);

  /**
   * Formats a metric value based on its type
   */
  const formatMetricValue = (value: any, type: string): string => {
    // Check if value is null or undefined and return '-' if so
    if (value === null || value === undefined) {
      return '-';
    }

    switch (type) {
      case 'percentage':
        // For 'percentage', format using formatPercentage utility
        return formatPercentage(value);
      case 'currency':
        // For 'currency', format using formatCurrency utility
        return formatCurrency(value);
      case 'number':
        // For 'number', format with appropriate decimal places
        return value.toFixed(2);
      case 'integer':
        // For 'integer', format as whole number
        return value.toFixed(0);
      default:
        // For default case, return value as string
        return String(value);
    }
  };

  /**
   * Renders an indicator showing the change direction and value
   */
  const renderChangeIndicator = (change: number, isPositiveGood: boolean): JSX.Element | null => {
    // Check if change is null or undefined and return null if so
    if (change === null || change === undefined) {
      return null;
    }

    // Determine if the change is positive (greater than 0)
    const isPositive = change > 0;

    // Determine if the change is good based on isPositiveGood parameter and change direction
    const isGood = isPositive === isPositiveGood;

    return (
      <ChangeIndicator isGood={isGood}>
        {/* Render up or down arrow icon based on change direction */}
        {isPositive ? <FaArrowUp /> : <FaArrowDown />}
        {/* Format the change value as a percentage */}
        {formatPercentage(Math.abs(change))}
      </ChangeIndicator>
    );
  };

  // LD7: Format the metrics data for display in the table
  const formattedMetrics = useMemo(() => {
    if (!keyMetricsSummary?.metrics) {
      return [];
    }

    return keyMetricsSummary.metrics.map(metric => ({
      ...metric,
      current: formatMetricValue(metric.current, metric.unit),
      previous: formatMetricValue(metric.previous, metric.unit),
      change: renderChangeIndicator(metric.change, metric.isPositiveGood),
      target: (
        <TargetCell>
          {formatMetricValue(metric.target, metric.unit)}
          <TargetIndicator status={
            metric.current > metric.target ? 'above' :
            metric.current < metric.target ? 'below' :
            'met'
          } />
        </TargetCell>
      ),
    }));
  }, [keyMetricsSummary]);

  return (
    <TableContainer className={className} style={style}>
      <TableHeader>
        <HeaderLeft>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </HeaderLeft>
        <HeaderRight>
          {showDateRange && <DateRangeSelector onChange={handleDateRangeChange} defaultTimeframe={defaultTimeframe} />}
          {showDownload && <DownloadButton onClick={() => onDownload('csv')}>Download CSV</DownloadButton>}
        </HeaderRight>
      </TableHeader>
      {loading ? (
        <LoadingContainer>
          {/* <LoadingIndicator /> */}
        </LoadingContainer>
      ) : keyMetricsSummary?.metrics ? (
        <DataTable
          data={formattedMetrics}
          columns={COLUMN_DEFINITIONS}
        />
      ) : (
        <ErrorMessage>Error fetching key metrics summary.</ErrorMessage>
      )}
    </TableContainer>
  );
};

export default KeyMetricsSummaryTable;
export type { KeyMetricsSummaryTableProps };