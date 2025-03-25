import React, { useState, useEffect, useMemo } from 'react'; // React, { useState, useEffect, useMemo } ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import {
  TruckIcon,
  ClockIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'; // @heroicons/react/24/outline ^2.0.13

import Card from '../../../shared/components/cards/Card';
import StatsCard from '../../../shared/components/cards/StatsCard';
import BarChart from '../../../shared/components/charts/BarChart';
import LineChart from '../../../shared/components/charts/LineChart';
import DateRangeSelector from '../analytics/DateRangeSelector';
import Heading from '../../../shared/components/typography/Heading';
import Text from '../../../shared/components/typography/Text';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { theme } from '../../../shared/styles/theme';
import { CarrierPerformanceMetrics } from '../../../common/interfaces/carrier.interface';
import { getCarrierPerformanceMetrics, getCarrierHistoricalPerformance } from '../../services/carrierService';
import { formatPercentage, formatNumber, formatCurrency } from '../../../common/utils/formatters';

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const SectionTitle = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const ChartSection = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const ChartContainer = styled.div`
  height: 400px;
  margin-top: ${theme.spacing.md};
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: ${theme.spacing.lg};
`;

const MetricDescription = styled.div`
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.md};
`;

// Interfaces
interface CarrierPerformanceMetricsProps {
  carrierId: string;
  className?: string;
}

interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
  timeframe?: string;
}

interface HistoricalDataPoint {
  date: string;
  fleetEfficiencyScore: number;
  onTimeDeliveryPercentage: number;
  onTimePickupPercentage: number;
  emptyMilesPercentage: number;
  revenuePerMile: number;
}

/**
 * Component that displays detailed performance metrics for a carrier
 */
const CarrierPerformanceMetrics: React.FC<CarrierPerformanceMetricsProps> = (props) => {
  // LD1: Destructure carrierId and className from props
  const { carrierId, className } = props;

  // LD1: Initialize state for performance metrics data
  const [performanceMetrics, setPerformanceMetrics] = useState<CarrierPerformanceMetrics | null>(null);

  // LD1: Initialize state for historical performance data
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // LD1: Initialize state for loading status
  const [loading, setLoading] = useState<boolean>(true);

  // LD1: Initialize state for date range filter
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    timeframe: 'last30days',
  });

  // LD1: Create effect to fetch current performance metrics when carrierId or date range changes
  useEffect(() => {
    const fetchPerformanceMetrics = async () => {
      setLoading(true);
      try {
        const metrics = await getCarrierPerformanceMetrics(carrierId, {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        });
        setPerformanceMetrics(metrics);
      } catch (error) {
        console.error('Failed to fetch carrier performance metrics:', error);
        // Handle error appropriately (e.g., display error message)
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceMetrics();
  }, [carrierId, dateRange]);

  // LD1: Create effect to fetch historical performance data when carrierId or date range changes
  useEffect(() => {
    const fetchHistoricalPerformance = async () => {
      try {
        const historical = await getCarrierHistoricalPerformance(carrierId, {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        });
        setHistoricalData(historical);
      } catch (error) {
        console.error('Failed to fetch carrier historical performance:', error);
        // Handle error appropriately (e.g., display error message)
      }
    };

    fetchHistoricalPerformance();
  }, [carrierId, dateRange]);

  // LD1: Create memoized data transformations for charts
  const efficiencyChartData = useMemo(() => {
    return historicalData.map(item => ({
      date: item.date,
      Efficiency: item.fleetEfficiencyScore,
    }));
  }, [historicalData]);

  const onTimeChartData = useMemo(() => {
    return historicalData.map(item => ({
      date: item.date,
      Delivery: item.onTimeDeliveryPercentage,
      Pickup: item.onTimePickupPercentage,
    }));
  }, [historicalData]);

  const financialChartData = useMemo(() => {
    return historicalData.map(item => ({
      date: item.date,
      'Revenue per Mile': item.revenuePerMile,
    }));
  }, [historicalData]);

  // LD1: Render loading indicator while data is being fetched
  if (loading) {
    return <LoadingIndicator fullPage={false} label="Loading Carrier Performance Metrics..." />;
  }

  // LD1: Render date range selector for filtering metrics by time period
  const handleDateRangeChange = (newDateRange: DateRangeFilter) => {
    setDateRange(newDateRange);
  };

  // LD1: Render the component
  return (
    <Container className={className}>
      <DateRangeSelector onChange={handleDateRangeChange} defaultTimeframe={dateRange.timeframe} />

      {/* LD1: Render grid of stats cards showing key performance indicators */}
      {performanceMetrics && (
        <StatsGrid>
          <StatsCard
            title="Fleet Efficiency Score"
            value={formatPercentage(performanceMetrics.fleetEfficiencyScore)}
            subtitle="Overall performance of the carrier's fleet"
            icon={<ChartBarIcon />}
          />
          <StatsCard
            title="On-Time Delivery"
            value={formatPercentage(performanceMetrics.onTimeDeliveryPercentage)}
            subtitle="Percentage of deliveries completed on time"
            icon={<ClockIcon />}
          />
          <StatsCard
            title="Empty Miles"
            value={formatPercentage(performanceMetrics.emptyMilesPercentage)}
            subtitle="Percentage of miles driven without a load"
            icon={<TruckIcon />}
            higherIsBetter={false}
          />
          <StatsCard
            title="Revenue per Mile"
            value={formatCurrency(performanceMetrics.revenuePerMile)}
            subtitle="Average revenue generated per mile"
            icon={<CurrencyDollarIcon />}
          />
        </StatsGrid>
      )}

      {/* LD1: Render efficiency metrics section with bar chart */}
      <ChartSection>
        <SectionTitle>
          <Heading level={4}>Efficiency Metrics</Heading>
          <MetricDescription>Historical trends in fleet efficiency score</MetricDescription>
        </SectionTitle>
        <ChartContainer>
          <BarChart
            data={efficiencyChartData}
            xAxisDataKey="date"
            yAxisLabel="Efficiency Score"
            yAxisDataKey="Efficiency"
          />
        </ChartContainer>
      </ChartSection>

      {/* LD1: Render on-time performance section with line chart */}
      <ChartSection>
        <SectionTitle>
          <Heading level={4}>On-Time Performance</Heading>
          <MetricDescription>Historical trends in on-time delivery and pickup percentages</MetricDescription>
        </SectionTitle>
        <ChartContainer>
          <LineChart
            data={onTimeChartData}
            xAxisDataKey="date"
            yAxisLabel="Percentage"
            series={[
              { name: 'Delivery', dataKey: 'Delivery' },
              { name: 'Pickup', dataKey: 'Pickup' },
            ]}
          />
        </ChartContainer>
      </ChartSection>

      {/* LD1: Render financial metrics section with bar chart */}
      <ChartSection>
        <SectionTitle>
          <Heading level={4}>Financial Metrics</Heading>
          <MetricDescription>Historical trends in revenue per mile</MetricDescription>
        </SectionTitle>
        <ChartContainer>
          <LineChart
            data={financialChartData}
            xAxisDataKey="date"
            yAxisLabel="Revenue per Mile"
            yAxisDataKey="Revenue per Mile"
          />
        </ChartContainer>
      </ChartSection>
    </Container>
  );
};

export default CarrierPerformanceMetrics;