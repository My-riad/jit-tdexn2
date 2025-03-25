# src/web/shipper-portal/src/pages/AnalyticsPage.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // React, { useState, useEffect, useCallback } ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import DateRangeSelector from '../components/analytics/DateRangeSelector';
import OptimizationSavingsChart from '../components/analytics/OptimizationSavingsChart';
import RateComparisonChart from '../components/analytics/RateComparisonChart';
import OnTimePerformanceChart from '../components/analytics/OnTimePerformanceChart';
import Card from '../../shared/components/cards/Card';
import Tabs from '../../shared/components/navigation/Tabs';
import Button from '../../shared/components/buttons/Button';
import { useAuthContext } from '../../common/hooks/useAuth';
import { exportAnalyticsData } from '../services/analyticsService';

// LD1: Define the type for the tabs array
interface TabType {
  id: string;
  label: string;
}

// LD1: Define the type for the export formats array
interface ExportFormatType {
  id: string;
  label: string;
}

// LD1: Define the type for the date range
interface DateRangeType {
  startDate: Date;
  endDate: Date;
}

// LD1: Define the constants for the tabs, export formats, and default date range
const TABS: TabType[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'savings', label: 'Optimization Savings' },
  { id: 'rates', label: 'Rate Comparison' },
  { id: 'performance', label: 'Carrier Performance' },
];

const EXPORT_FORMATS: ExportFormatType[] = [
  { id: 'csv', label: 'CSV' },
  { id: 'excel', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
];

const DEFAULT_DATE_RANGE: DateRangeType = {
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: new Date(),
};

// LD1: Define the styled components for the page layout
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  margin-top: 24px;
`;

const ChartRow = styled.div`
  display: flex;
  gap: 24px;
  width: 100%;

  @media (max-width: 1200px) {
    flex-direction: column;
  }
`;

const ChartColumn = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 400px;
`;

const FullHeightChart = styled.div`
  width: 100%;
  height: 600px;
`;

const DateRangeContainer = styled.div`
  margin-bottom: 24px;
`;

const TabsContainer = styled.div`
  margin-bottom: 24px;
`;

const ExportButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
`;

// LD1: Define the AnalyticsPage component
const AnalyticsPage: React.FC = () => {
  // LD1: Get the authentication state from the useAuth hook
  const { authState } = useAuthContext();
  const shipperId = authState.user?.shipperId;

  // LD1: Set up state for the selected date range
  const [dateRange, setDateRange] = useState<DateRangeType>(DEFAULT_DATE_RANGE);

  // LD1: Set up state for the active tab
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);

  // LD1: Set up state for the loading indicator
  const [loading, setLoading] = useState<boolean>(false);

  // LD1: Create a function to handle date range changes
  const handleDateRangeChange = useCallback((newDateRange: DateRangeType) => {
    setDateRange(newDateRange);
  }, []);

  // LD1: Create a function to handle tab changes
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // LD1: Create a function to handle exporting the analytics data
  const handleExport = useCallback(async (format: string) => {
    if (!shipperId) {
      console.error('Shipper ID is missing.');
      return;
    }

    setLoading(true);
    try {
      const blob = await exportAnalyticsData(format, {
        shipperId: shipperId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: format as 'csv' | 'excel' | 'pdf',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${activeTab}-${dateRange.startDate.toLocaleDateString()}-${dateRange.endDate.toLocaleDateString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [shipperId, dateRange, activeTab]);

  // LD1: Use useEffect to set the initial date range to the last 30 days
  useEffect(() => {
    setDateRange(DEFAULT_DATE_RANGE);
  }, []);

  // LD1: Render the component
  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Analytics"
          subtitle="Gain insights into your shipping operations"
          actions={
            <ExportButtonsContainer>
              {EXPORT_FORMATS.map((format) => (
                <Button key={format.id} onClick={() => handleExport(format.id)}>
                  Export as {format.label}
                </Button>
              ))}
            </ExportButtonsContainer>
          }
        />

        <DateRangeContainer>
          <DateRangeSelector onChange={handleDateRangeChange} />
        </DateRangeContainer>

        <TabsContainer>
          <Tabs
            tabs={TABS}
            activeTabId={activeTab}
            onChange={handleTabChange}
          />
        </TabsContainer>

        {activeTab === 'overview' && (
          <ChartContainer>
            <ChartRow>
              <ChartColumn>
                <OptimizationSavingsChart
                  shipperId={shipperId}
                  dateRange={dateRange}
                />
              </ChartColumn>
              <ChartColumn>
                <RateComparisonChart
                  shipperId={shipperId}
                  dateRange={dateRange}
                />
              </ChartColumn>
            </ChartRow>
            <ChartRow>
              <ChartColumn>
                <OnTimePerformanceChart
                  shipperId={shipperId}
                  dateRange={dateRange}
                />
              </ChartColumn>
            </ChartRow>
          </ChartContainer>
        )}

        {activeTab === 'savings' && (
          <ChartContainer>
            <FullHeightChart>
              <OptimizationSavingsChart
                shipperId={shipperId}
                dateRange={dateRange}
                showCumulative
              />
            </FullHeightChart>
          </ChartContainer>
        )}

        {activeTab === 'rates' && (
          <ChartContainer>
            <FullHeightChart>
              <RateComparisonChart
                shipperId={shipperId}
                dateRange={dateRange}
                showTrends
              />
            </FullHeightChart>
          </ChartContainer>
        )}

        {activeTab === 'performance' && (
          <ChartContainer>
            <FullHeightChart>
              <OnTimePerformanceChart
                shipperId={shipperId}
                dateRange={dateRange}
              />
            </FullHeightChart>
          </ChartContainer>
        )}
      </PageContainer>
    </MainLayout>
  );
};

export default AnalyticsPage;