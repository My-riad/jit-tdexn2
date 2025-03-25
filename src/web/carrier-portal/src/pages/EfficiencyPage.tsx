import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { useSelector, useDispatch } from 'react-redux'; // react-redux ^8.0.5

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import Container from '../../../shared/components/layout/Container';
import Grid from '../../../shared/components/layout/Grid';
import DateRangeSelector from '../components/analytics/DateRangeSelector';
import EfficiencyChart from '../components/analytics/EfficiencyChart';
import EmptyMilesChart from '../components/analytics/EmptyMilesChart';
import NetworkContributionChart from '../components/analytics/NetworkContributionChart';
import SmartHubUsageChart from '../components/analytics/SmartHubUsageChart';
import DriverEfficiencyChart from '../components/analytics/DriverEfficiencyChart';
import KeyMetricsSummaryTable from '../components/analytics/KeyMetricsSummaryTable';
import { theme } from '../../../shared/styles/theme';

// Define the interface for date range selection
interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  timeframe?: string;
}

// Define styled components for layout and visual elements
const PageContainer = styled.div`
  padding: ${theme.spacing.lg} 0;
  width: 100%;
`;

const ChartContainer = styled.div`
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.sm};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const DateRangeContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${theme.spacing.md};
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 ${theme.spacing.md} 0;
  color: ${theme.colors.text.primary};
`;

// Define breadcrumb navigation items for the efficiency page
const BREADCRUMB_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Efficiency', href: '/analytics/efficiency' },
];

// Define default timeframe for date range selection
const DEFAULT_TIMEFRAME = 'last30days';

/**
 * Main component for the Efficiency analytics page
 * @returns {JSX.Element} Rendered efficiency page component
 */
const EfficiencyPage: React.FC = () => {
  // Initialize state for date range using useState
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });

  // Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  /**
   * Handles changes to the selected date range
   * @param {DateRange} dateRange - The new date range
   * @returns {void} No return value
   */
  const handleDateRangeChange = useCallback((dateRange: DateRange) => {
    // Update the date range state with the new value
    setDateRange(dateRange);
    // Pass the new date range to all chart components
  }, []);

  // Render MainLayout component as the page wrapper
  return (
    <MainLayout>
      {/* Render PageHeader with title, subtitle, and breadcrumbs */}
      <PageHeader
        title="Efficiency Analytics"
        subtitle="Analyze your fleet's efficiency performance"
        breadcrumbItems={BREADCRUMB_ITEMS}
      >
        {/* Render DateRangeSelector for filtering data by time period */}
        <DateRangeContainer>
          <DateRangeSelector onChange={handleDateRangeChange} defaultTimeframe={DEFAULT_TIMEFRAME} />
        </DateRangeContainer>
      </PageHeader>

      {/* Render Container component to structure the page content */}
      <Container>
        {/* Render KeyMetricsSummaryTable at the top of the page */}
        <KeyMetricsSummaryTable
          title="Key Efficiency Metrics"
          subtitle="Overview of your fleet's performance"
          showDateRange={false}
        />

        {/* Render Grid layout with various efficiency charts */}
        <Grid columns={{ xs: 1, md: 2 }} gap="md">
          {/* Include EfficiencyChart for overall efficiency score trends */}
          <ChartContainer>
            <SectionTitle>Overall Efficiency Score</SectionTitle>
            <EfficiencyChart
              title="Fleet Efficiency"
              subtitle="Overall efficiency score trends"
              timeframe={dateRange.timeframe}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              showTarget
              target={85}
            />
          </ChartContainer>

          {/* Include EmptyMilesChart for empty miles reduction visualization */}
          <ChartContainer>
            <SectionTitle>Empty Miles Reduction</SectionTitle>
            <EmptyMilesChart
              title="Empty Miles"
              subtitle="Percentage of miles driven without a load"
              timeframe={dateRange.timeframe}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              showIndustryAverage
              showTarget
              target={10}
            />
          </ChartContainer>

          {/* Include NetworkContributionChart for network contribution metrics */}
          <ChartContainer>
            <SectionTitle>Network Contribution</SectionTitle>
            <NetworkContributionChart
              title="Network Contribution"
              subtitle="Contribution to overall network efficiency"
              timeframe={dateRange.timeframe}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              showIndustryAverage
            />
          </ChartContainer>

          {/* Include SmartHubUsageChart for Smart Hub usage metrics */}
          <ChartContainer>
            <SectionTitle>Smart Hub Utilization</SectionTitle>
            <SmartHubUsageChart
              title="Smart Hub Usage"
              subtitle="Percentage of loads using Smart Hubs"
              timeframe={dateRange.timeframe}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              showNetworkAverage
              showTarget
              target={75}
            />
          </ChartContainer>

          {/* Include DriverEfficiencyChart for driver efficiency distribution */}
          <ChartContainer>
            <SectionTitle>Driver Efficiency Distribution</SectionTitle>
            <DriverEfficiencyChart
              title="Driver Efficiency"
              subtitle="Distribution of driver efficiency scores"
              timeframe={dateRange.timeframe}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </ChartContainer>
        </Grid>
      </Container>
    </MainLayout>
  );
};

// IE3: Export the EfficiencyPage component as the default export
export default EfficiencyPage;