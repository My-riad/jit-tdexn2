# src/web/carrier-portal/src/pages/DashboardPage.tsx
```typescript
import React, { useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate } from 'react-router-dom'; // version ^6.8.0

import MainLayout from '../components/layout/MainLayout';
import FleetSummaryCard from '../components/dashboard/FleetSummaryCard';
import ActiveLoadsCard from '../components/dashboard/ActiveLoadsCard';
import EfficiencyMetricsCard from '../components/dashboard/EfficiencyMetricsCard';
import RevenueSummaryCard from '../components/dashboard/RevenueSummaryCard';
import FleetMap from '../components/dashboard/FleetMap';
import UpcomingDeliveriesTable from '../components/dashboard/UpcomingDeliveriesTable';
import OptimizationOpportunitiesList from '../components/dashboard/OptimizationOpportunitiesList';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import { theme } from '../../../shared/styles/theme';

// LD1: Styled component for the main dashboard grid layout
const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr; // LD1: Single column on small screens
  grid-template-rows: auto;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};

  // LD1: Media query for medium screens (tablets)
  @media (min-width: ${theme.mediaQueries.md}) {
    grid-template-columns: repeat(2, 1fr); // LD1: Two columns on medium screens
  }

  // LD1: Media query for large screens (desktops)
  @media (min-width: ${theme.mediaQueries.lg}) {
    grid-template-columns: repeat(4, 1fr); // LD1: Four columns on large screens
  }
`;

// LD1: Styled component for the top row container
const TopRowContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};

  // LD1: Media query for medium screens (tablets)
  @media (min-width: ${theme.mediaQueries.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  // LD1: Media query for large screens (desktops)
  @media (min-width: ${theme.mediaQueries.lg}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

// LD1: Styled component for the middle row container
const MiddleRowContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};

  // LD1: Media query for medium screens (tablets)
  @media (min-width: ${theme.mediaQueries.md}) {
    grid-template-columns: 1fr;
  }

  // LD1: Media query for large screens (desktops)
  @media (min-width: ${theme.mediaQueries.lg}) {
    grid-template-columns: 1fr;
  }
`;

// LD1: Styled component for the bottom row container
const BottomRowContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};

  // LD1: Media query for medium screens (tablets)
  @media (min-width: ${theme.mediaQueries.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  // LD1: Media query for large screens (desktops)
  @media (min-width: ${theme.mediaQueries.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

// LD1: Styled component for the page title
const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
`;

/**
 * Main dashboard page component for the carrier portal
 * @returns {JSX.Element} Rendered dashboard page
 */
const DashboardPage: React.FC = () => {
  // LD1: Get authentication context using useAuthContext hook
  const { authState } = useAuthContext();

  // LD1: Get navigation function using useNavigate hook
  const navigate = useNavigate();

  // LD1: Get carrier ID from the authentication state
  const carrierId = authState.user?.carrierId || '';

  // LD1: Create handlers for navigation to different sections
  // LD1: Handle view fleet navigation to fleet management page
  const handleViewFleet = useCallback(() => {
    navigate('/fleet');
  }, [navigate]);

  // LD1: Handle view loads navigation to loads management page
  const handleViewLoads = useCallback(() => {
    navigate('/loads');
  }, [navigate]);

  // LD1: Handle view analytics navigation to analytics page
  const handleViewAnalytics = useCallback(() => {
    navigate('/analytics');
  }, [navigate]);

  // LD1: Handle view financials navigation to financial page
  const handleViewFinancials = useCallback(() => {
    navigate('/analytics/financial');
  }, [navigate]);

  // LD1: Handle view deliveries navigation to loads page with appropriate filters
  const handleViewDeliveries = useCallback(() => {
    navigate('/loads');
  }, [navigate]);

  // LD1: Handle view opportunities navigation to optimization page
  const handleViewOpportunities = useCallback(() => {
    navigate('/analytics/efficiency');
  }, [navigate]);

  // LD1: Handle apply recommendation to implement optimization recommendation
  const handleApplyRecommendation = useCallback((recommendationId: string) => {
    console.log(`Applying recommendation: ${recommendationId}`);
    // LD1: Implement logic to apply the recommendation
  }, []);

  // LD1: Render MainLayout component as the page container
  return (
    <MainLayout>
      <PageTitle>Dashboard</PageTitle>
      {/* LD1: Render DashboardGrid with responsive layout */}
      <DashboardGrid>
        {/* LD1: Render TopRowContainer for the first row of cards */}
        <TopRowContainer>
          {/* LD1: Render FleetSummaryCard with carrier ID and view handler */}
          <FleetSummaryCard carrierId={carrierId} onViewFleet={handleViewFleet} />
          {/* LD1: Render ActiveLoadsCard with carrier ID and view handler */}
          <ActiveLoadsCard carrierId={carrierId} onViewLoads={handleViewLoads} />
          {/* LD1: Render EfficiencyMetricsCard with carrier ID and view handler */}
          <EfficiencyMetricsCard carrierId={carrierId} onViewDetails={handleViewAnalytics} />
          {/* LD1: Render RevenueSummaryCard with carrier ID and view handler */}
          <RevenueSummaryCard carrierId={carrierId} onViewFinancials={handleViewFinancials} />
        </TopRowContainer>

        {/* LD1: Render MiddleRowContainer for the fleet map */}
        <MiddleRowContainer>
          {/* LD1: Render FleetMap with carrier ID and appropriate height */}
          <FleetMap carrierId={carrierId} height="400px" />
        </MiddleRowContainer>

        {/* LD1: Render BottomRowContainer for upcoming deliveries and optimization opportunities */}
        <BottomRowContainer>
          {/* LD1: Render UpcomingDeliveriesTable with carrier ID and view handler */}
          <UpcomingDeliveriesTable carrierId={carrierId} onViewAllClick={handleViewDeliveries} limit={5} />
          {/* LD1: Render OptimizationOpportunitiesList with carrier ID and handlers */}
          <OptimizationOpportunitiesList
            carrierId={carrierId}
            limit={5}
            onViewAllClick={handleViewOpportunities}
            onApplyRecommendation={handleApplyRecommendation}
          />
        </BottomRowContainer>
      </DashboardGrid>
    </MainLayout>
  );
};

// IE3: Export the DashboardPage component as the default export
export default DashboardPage;