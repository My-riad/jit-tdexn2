# src/web/shipper-portal/src/pages/DashboardPage.tsx
```typescript
import React, { useEffect, useCallback } from 'react'; // React core library for UI components // version ^18.2.0
import styled from 'styled-components'; // CSS-in-JS styling solution // version ^5.3.6
import { useNavigate } from 'react-router-dom'; // Hook for programmatic navigation // version ^6.6.0
import { PlusIcon } from '@heroicons/react/24/outline'; // Icon for the create load button // version ^2.0.13

import MainLayout from '../components/layout/MainLayout'; // Main layout wrapper for the shipper portal pages
import PageHeader from '../components/layout/PageHeader'; // Consistent page header component with title and actions
import LoadSummaryCard from '../components/dashboard/LoadSummaryCard'; // Card component displaying load summary metrics
import ActiveShipmentsCard from '../components/dashboard/ActiveShipmentsCard'; // Card component displaying active shipments metrics
import OptimizationSavingsCard from '../components/dashboard/OptimizationSavingsCard'; // Card component displaying optimization savings metrics
import CarrierPerformanceCard from '../components/dashboard/CarrierPerformanceCard'; // Card component displaying carrier performance metrics
import ShipmentMap from '../components/dashboard/ShipmentMap'; // Interactive map component showing shipment locations
import UpcomingDeliveriesTable from '../components/dashboard/UpcomingDeliveriesTable'; // Table component displaying upcoming deliveries
import MarketInsightsList from '../components/dashboard/MarketInsightsList'; // Component displaying market insights and trends
import Grid from '../../shared/components/layout/Grid'; // Grid layout component for organizing dashboard elements
import Button from '../../shared/components/buttons/Button'; // Button component for dashboard actions
import { useAuthContext } from '../../common/contexts/AuthContext'; // Hook to access authentication context for user information
import { SHIPPER_PORTAL_ROUTES } from '../../common/constants/routes'; // Route constants for navigation

// LD1: Styled component for the dashboard container
const DashboardContainer = styled.div`
  padding: 24px;
  width: 100%;
`;

// LD1: Styled component for the metrics section
const MetricsSection = styled(Grid)`
  margin-bottom: 24px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
`;

// LD1: Styled component for the map section
const MapSection = styled.div`
  margin-bottom: 24px;
  height: 400px;
`;

// LD1: Styled component for the bottom section
const BottomSection = styled(Grid)`
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

// LD1: Styled component for the create load button
const CreateLoadButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * LD1: Main dashboard page component for the shipper portal
 * @returns Rendered dashboard page
 */
const DashboardPage: React.FC = () => {
  // LD1: Initialize navigate function using useNavigate hook
  const navigate = useNavigate();

  // LD1: Get current user information from auth context using useAuthContext hook
  const { authState } = useAuthContext();
  const shipperId = authState.user?.shipperId;

  // LD1: Define handleCreateLoad function to navigate to load creation page
  const handleCreateLoad = useCallback(() => {
    navigate(SHIPPER_PORTAL_ROUTES.CREATE_LOAD);
  }, [navigate]);

  // LD1: Define handleViewAllDeliveries function to navigate to loads page
  const handleViewAllDeliveries = useCallback(() => {
    navigate(SHIPPER_PORTAL_ROUTES.LOADS);
  }, [navigate]);

  // LD1: Define handleViewAllInsights function to navigate to analytics page
  const handleViewAllInsights = useCallback(() => {
    navigate(SHIPPER_PORTAL_ROUTES.ANALYTICS);
  }, [navigate]);

  // LD1: Render MainLayout component as the page wrapper
  return (
    <MainLayout>
      {/* LD1: Render PageHeader with dashboard title and create load button */}
      <PageHeader
        title="Dashboard"
        actions={
          <CreateLoadButton variant="primary" onClick={handleCreateLoad}>
            <PlusIcon width={20} height={20} />
            Create Load
          </CreateLoadButton>
        }
      />

      {/* LD1: Render Grid layout for organizing dashboard components */}
      <DashboardContainer>
        {/* LD1: Render metrics cards section with LoadSummaryCard, ActiveShipmentsCard, OptimizationSavingsCard, and CarrierPerformanceCard */}
        <MetricsSection>
          <LoadSummaryCard />
          <ActiveShipmentsCard />
          <OptimizationSavingsCard />
          <CarrierPerformanceCard />
        </MetricsSection>

        {/* LD1: Render ShipmentMap component for interactive shipment tracking */}
        <MapSection>
          <ShipmentMap />
        </MapSection>

        {/* LD1: Render BottomSection with UpcomingDeliveriesTable and MarketInsightsList */}
        <BottomSection>
          <UpcomingDeliveriesTable onViewAll={handleViewAllDeliveries} />
          {/* LD1: Render MarketInsightsList with the current shipper ID */}
          {shipperId && <MarketInsightsList shipperId={shipperId} />}
        </BottomSection>
      </DashboardContainer>
    </MainLayout>
  );
};

// IE3: Export the DashboardPage component
export default DashboardPage;