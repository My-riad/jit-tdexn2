import React, { useState, useEffect } from 'react';
import styled from 'styled-components'; // version ^5.3.6
import { CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline'; // version ^2.0.13
import StatsCard from '../../../shared/components/cards/StatsCard'; // src/web/shared/components/cards/StatsCard.tsx
import Card from '../../../shared/components/cards/Card'; // src/web/shared/components/cards/Card.tsx
import Button from '../../../shared/components/buttons/Button'; // src/web/shared/components/buttons/Button.tsx
import { getDashboardMetrics } from '../../services/analyticsService'; // src/web/carrier-portal/src/services/analyticsService.ts
import { formatCurrency } from '../../../common/utils/formatters'; // src/web/common/utils/formatters.ts
import { theme } from '../../../shared/styles/theme'; // src/web/shared/styles/theme.ts
import { RevenueSummaryCardProps, RevenueSummaryData } from './types';

/**
 * Styled wrapper for the revenue summary card
 */
const StyledRevenueSummaryCard = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

/**
 * Styled component for the card title
 */
const CardTitle = styled.h2`
  font-size: ${theme.fonts.size.lg};
  font-weight: ${theme.fonts.weight.bold};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
`;

/**
 * Grid container for the stats cards
 */
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};

  @media (min-width: ${theme.mediaQueries.md}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

/**
 * Footer section of the card with action button
 */
const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.spacing.md};
`;

/**
 * Component that displays a summary of the carrier's revenue metrics
 */
const RevenueSummaryCard: React.FC<RevenueSummaryCardProps> = ({
  className,
  carrierId,
  onViewFinancials,
}) => {
  // Initialize state for revenue summary data with default values
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummaryData>({
    todayRevenue: 0,
    weeklyRevenue: 0,
    weeklyTrend: 0,
    monthlyRevenue: 0,
    monthlyTrend: 0,
    ytdRevenue: 0,
    ytdTrend: 0,
  });

  // Create a loading state to handle data fetching
  const [loading, setLoading] = useState(true);

  // Use useEffect to fetch revenue metrics data when component mounts
  useEffect(() => {
    // Call getDashboardMetrics service function to retrieve data from API
    const fetchRevenueMetrics = async () => {
      try {
        // Extract financial metrics from the dashboard data
        const dashboardData = await getDashboardMetrics({ carrierId });

        // Update state with fetched data and set loading to false
        setRevenueSummary({
          todayRevenue: dashboardData.todayRevenue || 0,
          weeklyRevenue: dashboardData.weeklyRevenue || 0,
          weeklyTrend: dashboardData.weeklyTrend || 0,
          monthlyRevenue: dashboardData.monthlyRevenue || 0,
          monthlyTrend: dashboardData.monthlyTrend || 0,
          ytdRevenue: dashboardData.ytdRevenue || 0,
          ytdTrend: dashboardData.ytdTrend || 0,
        });
      } catch (error) {
        // Handle any errors during data fetching
        console.error('Failed to fetch revenue summary data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueMetrics();
  }, [carrierId]);

  // Format currency values using formatCurrency utility
  const formattedTodayRevenue = formatCurrency(revenueSummary.todayRevenue);
  const formattedWeeklyRevenue = formatCurrency(revenueSummary.weeklyRevenue);
  const formattedMonthlyRevenue = formatCurrency(revenueSummary.monthlyRevenue);
  const formattedYTDRevenue = formatCurrency(revenueSummary.ytdRevenue);

  // Calculate trend percentages for each revenue metric
  const weeklyTrend = revenueSummary.weeklyTrend;
  const monthlyTrend = revenueSummary.monthlyTrend;
  const ytdTrend = revenueSummary.ytdTrend;

  // Render a Card component containing the revenue summary information
  return (
    <Card className={className}>
      <StyledRevenueSummaryCard>
        <CardTitle>Revenue Summary</CardTitle>
        {loading ? (
          <div>Loading revenue data...</div>
        ) : (
          <>
            <StatsContainer>
              {/* Include StatsCard for today's revenue with dollar icon */}
              <StatsCard
                title="Today's Revenue"
                value={formattedTodayRevenue}
                icon={<CurrencyDollarIcon />}
              />

              {/* Include StatsCard for weekly revenue with trend indicator */}
              <StatsCard
                title="Weekly Revenue"
                value={formattedWeeklyRevenue}
                trend={weeklyTrend}
              />

              {/* Include StatsCard for monthly revenue with trend indicator */}
              <StatsCard
                title="Monthly Revenue"
                value={formattedMonthlyRevenue}
                trend={monthlyTrend}
              />

              {/* Include StatsCard for YTD revenue with chart icon */}
              <StatsCard
                title="YTD Revenue"
                value={formattedYTDRevenue}
                icon={<ChartBarIcon />}
              />
            </StatsContainer>

            {/* Add a View Financials button that navigates to the financial analytics page */}
            <CardFooter>
              <Button variant="secondary" onClick={onViewFinancials}>
                View Financials
              </Button>
            </CardFooter>
          </>
        )}
      </StyledRevenueSummaryCard>
    </Card>
  );
};

export default RevenueSummaryCard;