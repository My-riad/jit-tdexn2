import React, { useState, useEffect, useMemo } from 'react'; // react ^18.2.0
import { useSelector, useDispatch } from 'react-redux'; // react-redux ^8.0.5
import styled from 'styled-components'; // styled-components ^5.3.6
import { useNavigate, useParams } from 'react-router-dom'; // react-router-dom ^6.8.0
import { ClockIcon, TruckIcon, CheckCircleIcon, DocumentDownloadIcon } from '@heroicons/react/24/outline'; // @heroicons/react/24/outline ^2.0.13

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import DateRangeSelector, { DateRange } from '../components/analytics/DateRangeSelector';
import Card from '../../../shared/components/cards/Card';
import Grid from '../../../shared/components/layout/Grid';
import LineChart from '../../../shared/components/charts/LineChart';
import BarChart from '../../../shared/components/charts/BarChart';
import PieChart from '../../../shared/components/charts/PieChart';
import KeyMetricsSummaryTable from '../components/analytics/KeyMetricsSummaryTable';
import Button from '../../../shared/components/buttons/Button';
import { theme } from '../../../shared/styles/theme';
import { fetchOperationalMetrics, exportAnalyticsReport } from '../store/actions/analyticsActions';
import { formatPercentage, formatDuration } from '../../../common/utils/formatters';

// Define the interface for the operational metrics data
interface OperationalMetrics {
  onTimeDeliveryRate: number;
  onTimeDeliveryHistory: Array<{ date: string; value: number }>;
  loadCompletionRate: number;
  loadCompletionByType: Array<{ loadType: string; value: number }>;
  driverUtilization: number;
  driverUtilizationBreakdown: Array<{ category: string; value: number }>;
  vehicleMaintenanceStatus: Array<{ status: string; count: number }>;
  averageTransitTime: number;
  transitTimeByDistance: Array<{ distanceRange: string; time: number }>;
  loadRejectionRate: number;
  driverTurnoverRate: number;
  hoursOfServiceCompliance: number;
  fuelEfficiency: number;
  incidentRate: number;
}

// Define the interface for date range selection
interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  timeframe?: string;
}

// Styled components for layout and visual elements
const PageContainer = styled.div`
  padding: ${theme.spacing.lg};
  max-width: 100%;
  overflow-x: hidden;
`;

const ChartGrid = styled(Grid)`
  margin-bottom: ${theme.spacing.xl};
`;

const ChartContainer = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: ${theme.spacing.lg} 0 ${theme.spacing.md};
  color: ${theme.colors.text.primary};
`;

const MetricValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${theme.colors.text.primary};
`;

const MetricLabel = styled.span`
  font-size: 0.875rem;
  color: ${theme.colors.text.secondary};
  margin-left: ${theme.spacing.sm};
`;

interface TrendIndicatorProps {
  positive: boolean;
}

const TrendIndicator = styled.div<TrendIndicatorProps>`
  display: inline-flex;
  align-items: center;
  color: ${props => props.positive ? theme.colors.semantic.success : theme.colors.semantic.error};
  font-size: 0.875rem;
  margin-left: ${theme.spacing.sm};
`;

const ExportButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const ErrorMessage = styled.div`
  color: ${theme.colors.semantic.error};
  text-align: center;
  padding: ${theme.spacing.lg};
`;

// Constants for default values and chart configurations
const DEFAULT_DATE_RANGE: DateRange = {
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: new Date(),
  timeframe: 'last30days',
};

const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
];

const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  operational: theme.colors.semantic.success,
  maintenance: theme.colors.semantic.warning,
  repair: theme.colors.semantic.error,
  inspection: theme.colors.chart.blue,
  outOfService: theme.colors.chart.gray,
};

const DRIVER_UTILIZATION_COLORS: Record<string, string> = {
  driving: theme.colors.chart.green,
  loading: theme.colors.chart.blue,
  unloading: theme.colors.chart.purple,
  waiting: theme.colors.chart.orange,
  offDuty: theme.colors.chart.gray,
};

/**
 * Main component for the operational analytics page
 * @returns {JSX.Element} Rendered operational analytics page
 */
const OperationalPage: React.FC = () => {
  // Initialize state for date range using useState
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);

  // Initialize state for loading status using useState
  const [loading, setLoading] = useState(false);

  // Initialize state for export format using useState
  const [exportFormat, setExportFormat] = useState('');

  // Use useSelector to get operational metrics data from Redux store
  const operationalMetrics = useSelector((state: any) => state.analytics.operationalMetrics);

  // Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // Use useParams to get any URL parameters
  const { carrierId } = useParams();

  // Use useNavigate to get the navigation function
  const navigate = useNavigate();

  /**
   * Handles date range selection changes
   * @param {DateRange} dateRange - The selected date range
   */
  const handleDateRangeChange = (dateRange: DateRange) => {
    // Update the date range state
    setDateRange(dateRange);

    // Trigger operational metrics fetch with the new date range
    dispatch(fetchOperationalMetrics(dateRange));
  };

  /**
   * Handles exporting operational reports
   * @param {string} format - The export format (e.g., 'pdf', 'csv', 'excel')
   */
  const handleExportReport = (format: string) => {
    // Set export format state
    setExportFormat(format);

    // Dispatch exportAnalyticsReport action with operational report type, current filters, and format
    dispatch(exportAnalyticsReport({ reportType: 'operational', filters: dateRange, format }));

    // Show loading indicator during export
    setLoading(true);

    // Simulate export process (replace with actual export logic)
    setTimeout(() => {
      // Handle success and error states for export operation
      setLoading(false);
      alert(`Exported operational report in ${format} format!`);
    }, 2000);
  };

  // Use useEffect to fetch operational metrics when component mounts or date range changes
  useEffect(() => {
    dispatch(fetchOperationalMetrics(dateRange));
  }, [dispatch, dateRange]);

  /**
   * Prepares data for the on-time delivery trend chart
   * @param {any} operationalMetrics - The operational metrics data
   * @returns {array} Formatted chart data
   */
  const prepareOnTimeDeliveryData = useMemo(() => {
    if (!operationalMetrics?.onTimeDeliveryHistory) return [];

    return operationalMetrics.onTimeDeliveryHistory.map(item => ({
      date: item.date,
      'On-Time Delivery': item.value,
    }));
  }, [operationalMetrics]);

  /**
   * Prepares data for the load completion rate chart
   * @param {any} operationalMetrics - The operational metrics data
   * @returns {array} Formatted chart data
   */
  const prepareLoadCompletionData = useMemo(() => {
    if (!operationalMetrics?.loadCompletionByType) return [];

    return operationalMetrics.loadCompletionByType.map(item => ({
      loadType: item.loadType,
      Completion: item.value,
    }));
  }, [operationalMetrics]);

  /**
   * Prepares data for the driver utilization chart
   * @param {any} operationalMetrics - The operational metrics data
   * @returns {array} Formatted chart data
   */
  const prepareDriverUtilizationData = useMemo(() => {
    if (!operationalMetrics?.driverUtilizationBreakdown) return [];

    return operationalMetrics.driverUtilizationBreakdown.map(item => ({
      category: item.category,
      Utilization: item.value,
    }));
  }, [operationalMetrics]);

  /**
   * Prepares data for the vehicle maintenance status pie chart
   * @param {any} operationalMetrics - The operational metrics data
   * @returns {array} Formatted chart data
   */
  const prepareMaintenanceStatusData = useMemo(() => {
    if (!operationalMetrics?.vehicleMaintenanceStatus) return [];

    return operationalMetrics.vehicleMaintenanceStatus.map(item => ({
      status: item.status,
      value: item.count,
      fill: MAINTENANCE_STATUS_COLORS[item.status] || theme.colors.chart.gray,
    }));
  }, [operationalMetrics, theme]);

  /**
   * Prepares data for the load transit time by distance chart
   * @param {any} operationalMetrics - The operational metrics data
   * @returns {array} Formatted chart data
   */
  const prepareTransitTimeData = useMemo(() => {
    if (!operationalMetrics?.transitTimeByDistance) return [];

    return operationalMetrics.transitTimeByDistance.map(item => ({
      distanceRange: item.distanceRange,
      'Transit Time': item.time,
    }));
  }, [operationalMetrics]);

  // Render the MainLayout component as the page container
  return (
    <MainLayout>
      {/* Render the PageHeader with title and DateRangeSelector */}
      <PageHeader
        title="Operational Analytics"
        subtitle="Track key operational metrics and identify areas for improvement"
        actions={[
          {
            label: 'Export Report',
            onClick: () => handleExportReport('pdf'),
            icon: <DocumentDownloadIcon className="h-5 w-5" />,
          },
        ]}
      >
        <DateRangeSelector onChange={handleDateRangeChange} />
      </PageHeader>

      {/* Render a grid of operational charts and metrics */}
      <ChartGrid columns={{ md: 2, lg: 3 }}>
        {/* Render on-time delivery trend chart showing historical performance */}
        <ChartContainer>
          <SectionTitle>On-Time Delivery Trend</SectionTitle>
          <Card>
            <LineChart
              data={prepareOnTimeDeliveryData}
              xAxisDataKey="date"
              yAxisDataKey="On-Time Delivery"
              yAxisLabel="Percentage"
              valueFormatter={formatPercentage}
            />
          </Card>
        </ChartContainer>

        {/* Render load completion rate chart showing completion percentages */}
        <ChartContainer>
          <SectionTitle>Load Completion Rate by Type</SectionTitle>
          <Card>
            <BarChart
              data={prepareLoadCompletionData}
              xAxisDataKey="loadType"
              yAxisDataKey="Completion"
              yAxisLabel="Percentage"
              valueFormatter={formatPercentage}
            />
          </Card>
        </ChartContainer>

        {/* Render driver utilization chart showing driver time allocation */}
        <ChartContainer>
          <SectionTitle>Driver Utilization</SectionTitle>
          <Card>
            <PieChart
              data={prepareDriverUtilizationData}
              nameKey="category"
              dataKey="Utilization"
              colors={Object.values(DRIVER_UTILIZATION_COLORS)}
              valueFormatter={formatPercentage}
              isDonut
            />
          </Card>
        </ChartContainer>

        {/* Render vehicle maintenance status pie chart */}
        <ChartContainer>
          <SectionTitle>Vehicle Maintenance Status</SectionTitle>
          <Card>
            <PieChart
              data={prepareMaintenanceStatusData}
              nameKey="status"
              dataKey="value"
              colors={Object.values(MAINTENANCE_STATUS_COLORS)}
              valueFormatter={(value) => value.toFixed(0)}
              isDonut
            />
          </Card>
        </ChartContainer>

        {/* Render load transit time by distance chart */}
        <ChartContainer>
          <SectionTitle>Load Transit Time by Distance</SectionTitle>
          <Card>
            <BarChart
              data={prepareTransitTimeData}
              xAxisDataKey="distanceRange"
              yAxisDataKey="Transit Time"
              yAxisLabel="Hours"
              valueFormatter={formatDuration}
            />
          </Card>
        </ChartContainer>
      </ChartGrid>

      {/* Render key operational metrics table with important KPIs */}
      <SectionTitle>Key Operational Metrics</SectionTitle>
      <Card>
        <KeyMetricsSummaryTable />
      </Card>
    </MainLayout>
  );
};

export default OperationalPage;