import React, { useState, useEffect, useMemo } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { useSelector, useDispatch } from 'react-redux'; // react-redux ^8.0.5
import { useNavigate, useParams } from 'react-router-dom'; // react-router-dom ^6.8.0
import { ArrowDownIcon, ArrowUpIcon, DocumentDownloadIcon } from '@heroicons/react/24/outline'; // @heroicons/react/24/outline ^2.0.13

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
import { fetchFinancialMetrics, exportAnalyticsReport } from '../store/actions/analyticsActions';
import { formatCurrency } from '../../../common/utils/formatters';

// Define the interface for financial metrics data
interface FinancialMetrics {
  revenueTotal: number;
  revenuePerMile: number;
  revenuePerLoad: number;
  revenueHistory: Array<{ date: string; value: number }>;
  costTotal: number;
  costPerMile: number;
  costBreakdown: Array<{ category: string; value: number }>;
  profitTotal: number;
  profitMargin: number;
  profitMarginHistory: Array<{ date: string; value: number }>;
  revenueByLoadType: Array<{ loadType: string; value: number }>;
  yearOverYearGrowth: number;
  fuelCosts: number;
  maintenanceCosts: number;
  driverPayCosts: number;
  overheadCosts: number;
}

// Define the interface for date range selection
interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  timeframe?: string;
}

// Styled components for layout and styling
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

// Constants for default values and export formats
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

const COST_CATEGORY_COLORS: Record<string, string> = {
  fuel: theme.colors.chart.blue,
  maintenance: theme.colors.chart.green,
  driverPay: theme.colors.chart.orange,
  overhead: theme.colors.chart.purple,
  other: theme.colors.chart.gray,
};

/**
 * Main component for the financial analytics page
 */
const FinancialPage: React.FC = () => {
  // LD1: Initialize state for date range using useState
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);

  // LD1: Initialize state for loading status using useState
  const [loading, setLoading] = useState<boolean>(false);

  // LD1: Initialize state for export format using useState
  const [exportFormat, setExportFormat] = useState<string>('csv');

  // LD1: Use useSelector to get financial metrics data from Redux store
  const financialMetrics = useSelector((state: any) => state.analytics.financialMetrics) as FinancialMetrics;

  // LD1: Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // LD1: Use useParams to get any URL parameters
  const { /* any params here */ } = useParams();

  // LD1: Use useNavigate to get the navigation function
  const navigate = useNavigate();

  /**
   * Handles date range selection changes
   */
  const handleDateRangeChange = (dateRange: DateRange) => {
    // LD1: Update the date range state
    setDateRange(dateRange);

    // LD1: Trigger financial metrics fetch with the new date range
    dispatch(fetchFinancialMetrics(dateRange));
  };

  /**
   * Handles exporting financial reports
   */
  const handleExportReport = (format: string) => {
    // LD1: Set export format state
    setExportFormat(format);

    // LD1: Dispatch exportAnalyticsReport action with financial report type, current filters, and format
    dispatch(exportAnalyticsReport({ reportType: 'financial', filters: dateRange, format }));

    // LD1: Show loading indicator during export
    setLoading(true);

    // LD1: Handle success and error states for export operation
    // (Implementation details for success/error handling would typically involve Redux middleware or thunks)
    setTimeout(() => {
      setLoading(false);
      // Show success or error notification based on export result
    }, 3000); // Simulate export processing time
  };

  // LD1: Use useEffect to fetch financial metrics when component mounts or date range changes
  useEffect(() => {
    setLoading(true);
    dispatch(fetchFinancialMetrics(dateRange))
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [dispatch, dateRange]);

  /**
   * Prepares data for the revenue trend chart
   */
  const prepareRevenueChartData = (financialMetrics: FinancialMetrics) => {
    // LD1: Extract revenue history from financial metrics
    const revenueHistory = financialMetrics?.revenueHistory || [];

    // LD1: Format dates and currency values
    const chartData = revenueHistory.map(item => ({
      date: item.date,
      revenue: item.value,
    }));

    // LD1: Return array of data points for the chart
    return chartData;
  };

  /**
   * Prepares data for the cost breakdown pie chart
   */
  const prepareCostBreakdownData = (financialMetrics: FinancialMetrics) => {
    // LD1: Extract cost categories from financial metrics
    const costBreakdown = financialMetrics?.costBreakdown || [];

    // LD1: Calculate percentages for each category
    const totalCost = financialMetrics?.costTotal || 0;
    const chartData = costBreakdown.map(item => ({
      name: item.category,
      value: item.value,
      percentage: (item.value / totalCost) * 100,
    }));

    // LD1: Assign colors to each category
    chartData.forEach((item, index) => {
      item.color = COST_CATEGORY_COLORS[item.name] || theme.colors.chart.gray;
    });

    // LD1: Return array of data points for the pie chart
    return chartData;
  };

  /**
   * Prepares data for the profit margin chart
   */
  const prepareProfitMarginData = (financialMetrics: FinancialMetrics) => {
    // LD1: Extract profit margin history from financial metrics
    const profitMarginHistory = financialMetrics?.profitMarginHistory || [];

    // LD1: Format dates and percentage values
    const chartData = profitMarginHistory.map(item => ({
      date: item.date,
      margin: item.value,
    }));

    // LD1: Return array of data points for the chart
    return chartData;
  };

  /**
   * Prepares data for the revenue by load type chart
   */
  const prepareRevenueByLoadTypeData = (financialMetrics: FinancialMetrics) => {
    // LD1: Extract revenue by load type from financial metrics
    const revenueByLoadType = financialMetrics?.revenueByLoadType || [];

    // LD1: Format load types and currency values
    const chartData = revenueByLoadType.map(item => ({
      loadType: item.loadType,
      revenue: item.value,
    }));

    // LD1: Return array of data points for the bar chart
    return chartData;
  };

  // LD1: Use useMemo to format and prepare chart data from the financial metrics
  const revenueChartData = useMemo(() => prepareRevenueChartData(financialMetrics), [financialMetrics]);
  const costBreakdownChartData = useMemo(() => prepareCostBreakdownData(financialMetrics), [financialMetrics]);
  const profitMarginChartData = useMemo(() => prepareProfitMarginData(financialMetrics), [financialMetrics]);
  const revenueByLoadTypeChartData = useMemo(() => prepareRevenueByLoadTypeData(financialMetrics), [financialMetrics]);

  // LD1: Render the MainLayout component as the page container
  return (
    <MainLayout>
      <PageContainer>
        {/* LD1: Render the PageHeader with title and DateRangeSelector */}
        <PageHeader
          title="Financial Analytics"
          subtitle="Track your financial performance and identify opportunities for improvement"
          actions={[
            {
              label: 'Export Report',
              onClick: () => handleExportReport(exportFormat),
              icon: <DocumentDownloadIcon className="h-5 w-5" />,
            },
          ]}
        >
          {/* LD1: Render the DateRangeSelector component */}
          <DateRangeSelector onChange={handleDateRangeChange} defaultTimeframe={DEFAULT_DATE_RANGE.timeframe} />
        </PageHeader>

        {/* LD1: Render a grid of financial charts and metrics */}
        <ChartGrid columns={{ xs: 1, md: 2 }}>
          <Card>
            <SectionTitle>Revenue Trend</SectionTitle>
            {/* LD1: Render revenue trend chart showing historical revenue data */}
            <ChartContainer>
              <LineChart
                data={revenueChartData}
                xAxisDataKey="date"
                yAxisDataKey="revenue"
                yAxisLabel="Revenue ($)"
                xAxisLabel="Date"
                valueFormatter={(value) => formatCurrency(value)}
              />
            </ChartContainer>
          </Card>

          <Card>
            <SectionTitle>Cost Breakdown</SectionTitle>
            {/* LD1: Render cost breakdown pie chart showing expense categories */}
            <ChartContainer>
              <PieChart
                data={costBreakdownChartData}
                nameKey="name"
                dataKey="value"
                valueFormatter={(value) => formatCurrency(value)}
                isDonut
              />
            </ChartContainer>
          </Card>

          <Card>
            <SectionTitle>Profit Margin</SectionTitle>
            {/* LD1: Render profit margin chart showing margins over time */}
            <ChartContainer>
              <LineChart
                data={profitMarginChartData}
                xAxisDataKey="date"
                yAxisDataKey="margin"
                yAxisLabel="Margin (%)"
                xAxisLabel="Date"
                valueFormatter={(value) => `${value.toFixed(1)}%`}
              />
            </ChartContainer>
          </Card>

          <Card>
            <SectionTitle>Revenue by Load Type</SectionTitle>
            {/* LD1: Render revenue by load type bar chart */}
            <ChartContainer>
              <BarChart
                data={revenueByLoadTypeChartData}
                xAxisDataKey="loadType"
                yAxisDataKey="revenue"
                yAxisLabel="Revenue ($)"
                xAxisLabel="Load Type"
                valueFormatter={(value) => formatCurrency(value)}
              />
            </ChartContainer>
          </Card>
        </ChartGrid>

        <Card>
          <SectionTitle>Key Financial Metrics</SectionTitle>
          {/* LD1: Render key financial metrics table with important KPIs */}
          <KeyMetricsSummaryTable />
        </Card>
      </PageContainer>
    </MainLayout>
  );
};

// IE3: Export the FinancialPage component as the default export
export default FinancialPage;