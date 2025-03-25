import React, { useState, useEffect, useMemo } from 'react'; // version ^18.2.0
import { useSelector, useDispatch } from 'react-redux'; // version ^8.0.5
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate, useParams } from 'react-router-dom'; // version ^6.8.0

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import DateRangeSelector, { DateRange } from '../components/analytics/DateRangeSelector';
import EfficiencyChart from '../components/analytics/EfficiencyChart';
import EmptyMilesChart from '../components/analytics/EmptyMilesChart';
import NetworkContributionChart from '../components/analytics/NetworkContributionChart';
import SmartHubUsageChart from '../components/analytics/SmartHubUsageChart';
import DriverEfficiencyChart from '../components/analytics/DriverEfficiencyChart';
import KeyMetricsSummaryTable from '../components/analytics/KeyMetricsSummaryTable';
import Card from '../../../shared/components/cards/Card';
import Tabs from '../../../shared/components/navigation/Tabs';
import Grid from '../../../shared/components/layout/Grid';
import { theme } from '../../../shared/styles/theme';
import { fetchAnalyticsData } from '../store/actions/analyticsActions';

// Define the interface for tab navigation options
interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

// Define the options for the tab navigation
const TAB_OPTIONS: TabOption[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'efficiency', label: 'Efficiency Metrics' },
  { id: 'drivers', label: 'Driver Performance' },
  { id: 'operational', label: 'Operational Metrics' },
  { id: 'financial', label: 'Financial Metrics' },
];

// Define the default selected tab
const DEFAULT_TAB = 'overview';

// Define the default date range (last 30 days)
const DEFAULT_DATE_RANGE: DateRange = {
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: new Date(),
  timeframe: 'last30days',
};

// Styled components for layout and visual elements
const PageContainer = styled.div`
  padding: ${theme.spacing.lg};
  max-width: 100%;
  overflow-x: hidden;
`;

const TabContent = styled.div`
  margin-top: ${theme.spacing.lg};
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

/**
 * Main component for the analytics dashboard page
 * @returns {JSX.Element} Rendered analytics dashboard page
 */
const AnalyticsPage: React.FC = () => {
  // LD1: Initialize state for selected tab using useState
  const [selectedTab, setSelectedTab] = useState<string>(DEFAULT_TAB);

  // LD1: Initialize state for date range using useState
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);

  // LD1: Initialize state for loading status using useState
  const [loading, setLoading] = useState<boolean>(false);

  // LD1: Use useSelector to get analytics data from Redux store
  const analyticsData = useSelector((state: any) => state.analytics);

  // LD1: Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // LD1: Use useParams to get any URL parameters
  const { tabId } = useParams<{ tabId: string }>();

  // LD1: Use useNavigate to get the navigation function
  const navigate = useNavigate();

  /**
   * Handles tab selection changes
   * @param {string} tabId
   * @returns {void} No return value
   */
  const handleTabChange = (tabId: string): void => {
    // LD1: Update the selected tab state
    setSelectedTab(tabId);

    // LD1: Update the URL to reflect the selected tab
    navigate(`/analytics/${tabId}`);

    // LD1: Trigger analytics data fetch if needed for the new tab
    // (Implementation details would go here)
  };

  /**
   * Handles date range selection changes
   * @param {DateRange} dateRange
   * @returns {void} No return value
   */
  const handleDateRangeChange = (dateRange: DateRange): void => {
    // LD1: Update the date range state
    setDateRange(dateRange);

    // LD1: Trigger analytics data fetch with the new date range
    // (Implementation details would go here)
  };

  // LD1: Use useEffect to fetch analytics data when component mounts or date range changes
  useEffect(() => {
    // (Implementation details for fetching data would go here)
  }, [dateRange]);

  return (
    <MainLayout>
      <PageContainer>
        {/* LD1: Render the PageHeader with title and DateRangeSelector */}
        <PageHeader
          title="Analytics Dashboard"
          subtitle="Track your fleet's performance and identify areas for improvement"
        >
          <DateRangeSelector onChange={handleDateRangeChange} />
        </PageHeader>

        {/* LD1: Render the Tabs component for navigation between different analytics views */}
        <Tabs
          tabs={TAB_OPTIONS}
          activeTabId={selectedTab}
          onChange={handleTabChange}
        />

        {/* LD1: Render the appropriate content based on the selected tab */}
        <TabContent>
          {/* LD1: For 'overview' tab, render a grid of summary charts and KeyMetricsSummaryTable */}
          {selectedTab === 'overview' && (
            <>
              <ChartGrid columns={{ xs: 1, md: 2 }}>
                <ChartContainer>
                  <EfficiencyChart
                    timeframe={dateRange.timeframe}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    title="Fleet Efficiency Score"
                    subtitle="Overall performance of your fleet"
                    chartType="gauge"
                    showTarget
                    target={85}
                  />
                </ChartContainer>
                <ChartContainer>
                  <EmptyMilesChart
                    timeframe={dateRange.timeframe}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    title="Empty Miles Percentage"
                    subtitle="Percentage of miles driven without a load"
                    showTarget
                    target={10}
                  />
                </ChartContainer>
                <ChartContainer>
                  <NetworkContributionChart
                    timeframe={dateRange.timeframe}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    title="Network Contribution"
                    subtitle="Your fleet's contribution to overall network efficiency"
                    showIndustryAverage
                  />
                </ChartContainer>
                <ChartContainer>
                  <SmartHubUsageChart
                    timeframe={dateRange.timeframe}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    title="Smart Hub Utilization"
                    subtitle="Percentage of loads using Smart Hubs"
                    showTarget
                    target={75}
                  />
                </ChartContainer>
              </ChartGrid>
              <Card>
                <SectionTitle>Key Metrics Summary</SectionTitle>
                <KeyMetricsSummaryTable />
              </Card>
            </>
          )}

          {/* LD1: For 'efficiency' tab, render detailed efficiency metrics charts */}
          {selectedTab === 'efficiency' && (
            <>
              <ChartContainer>
                <EfficiencyChart
                  timeframe={dateRange.timeframe}
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  title="Fleet Efficiency Over Time"
                  subtitle="Track your fleet's efficiency score over time"
                  chartType="line"
                  showTarget
                  target={85}
                />
              </ChartContainer>
              <ChartContainer>
                <EmptyMilesChart
                  timeframe={dateRange.timeframe}
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  title="Empty Miles Percentage"
                  subtitle="Percentage of miles driven without a load"
                  showTarget
                  target={10}
                />
              </ChartContainer>
              <ChartContainer>
                <NetworkContributionChart
                  timeframe={dateRange.timeframe}
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  title="Network Contribution"
                  subtitle="Your fleet's contribution to overall network efficiency"
                  showIndustryAverage
                />
              </ChartContainer>
              <ChartContainer>
                <SmartHubUsageChart
                  timeframe={dateRange.timeframe}
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  title="Smart Hub Utilization"
                  subtitle="Percentage of loads using Smart Hubs"
                  showTarget
                  target={75}
                />
              </ChartContainer>
            </>
          )}

          {/* LD1: For 'drivers' tab, render driver performance charts */}
          {selectedTab === 'drivers' && (
            <ChartContainer>
              <DriverEfficiencyChart
                timeframe={dateRange.timeframe}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                title="Driver Efficiency"
                subtitle="Compare driver performance and identify top performers"
              />
            </ChartContainer>
          )}

          {/* LD1: For 'operational' tab, render operational metrics charts */}
          {selectedTab === 'operational' && (
            <div>
              {/* Add operational metrics charts here */}
              <p>Operational Metrics Content</p>
            </div>
          )}

          {/* LD1: For 'financial' tab, render financial metrics charts */}
          {selectedTab === 'financial' && (
            <div>
              {/* Add financial metrics charts here */}
              <p>Financial Metrics Content</p>
            </div>
          )}
        </TabContent>

        {/* LD1: Show loading state when data is being fetched */}
        {loading && (
          <LoadingContainer>
            <div>Loading...</div>
          </LoadingContainer>
        )}

        {/* LD1: Handle error states appropriately */}
        {analyticsData.error && (
          <ErrorMessage>Error: {analyticsData.error}</ErrorMessage>
        )}
      </PageContainer>
    </MainLayout>
  );
};

// IE3: Export the AnalyticsPage component as the default export
export default AnalyticsPage;