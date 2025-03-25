import React, { useState, useEffect, useCallback } from 'react'; // React core and hooks for component functionality // version ^18.2.0
import styled from 'styled-components'; // CSS-in-JS styling solution // version ^5.3.6
import { useNavigate } from 'react-router-dom'; // React Router hook for navigation // version ^6.8.0

import MainLayout from '../components/layout/MainLayout'; // Main layout component for the carrier portal
import PageHeader from '../components/layout/PageHeader'; // Header component for the page with title and actions
import DriverList from '../components/drivers/DriverList'; // Component for displaying a list of drivers with filtering and sorting
import DriverLeaderboard from '../components/drivers/DriverLeaderboard'; // Component for displaying driver efficiency leaderboard
import HOSComplianceTable from '../components/drivers/HOSComplianceTable'; // Component for displaying Hours of Service compliance data
import PerformanceMetricsTable from '../components/drivers/PerformanceMetricsTable'; // Component for displaying driver performance metrics
import Card from '../../../shared/components/cards/Card'; // Card component for containing content sections
import Tabs from '../../../shared/components/navigation/Tabs'; // Tabs component for switching between different views
import Grid from '../../../shared/components/layout/Grid'; // Grid layout component for responsive layouts

import { fetchDrivers, fetchTopDrivers } from '../store/actions/driverActions'; // Redux action creator for fetching drivers
import { useAppDispatch, useAppSelector } from '../store'; // Typed Redux dispatch hook

// Styled Components
const PageContainer = styled.div`
  padding: 1rem;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
`;

const TabsContainer = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: ${theme => theme.colors.text.primary};
`;

const SectionDescription = styled.p`
  font-size: 0.875rem;
  color: ${theme => theme.colors.text.secondary};
  margin-bottom: 1.5rem;
`;

const CardContainer = styled.div`
  margin-bottom: 2rem;
`;

// Constants
const TABS = [
  { id: 'all', label: 'All Drivers' },
  { id: 'performance', label: 'Performance' },
  { id: 'compliance', label: 'HOS Compliance' },
  { id: 'leaderboard', label: 'Leaderboard' }
];

/**
 * Main component for the drivers management page
 */
const DriversPage: React.FC = () => {
  // Initialize state for active tab
  const [activeTab, setActiveTab] = useState('all');

  // Get the Redux dispatch function using useAppDispatch
  const dispatch = useAppDispatch();

  // Get the navigation function using useNavigate
  const navigate = useNavigate();

  // Select driver data from Redux store using useAppSelector
  const { drivers, total } = useAppSelector((state: any) => ({
    drivers: state.driver.drivers,
    total: state.driver.total
  }));

  // Define useEffect to fetch drivers and top drivers when component mounts
  useEffect(() => {
    dispatch(fetchDrivers({ page: 1, limit: 10 }));
    dispatch(fetchTopDrivers(5));
  }, [dispatch]);

  // Define handler for tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Define handler for creating a new driver
  const handleCreateDriver = () => {
    navigate('/drivers/create');
  };

  // Define handler for navigating to driver detail page
  const handleDriverClick = (driverId: string) => {
    navigate(`/drivers/${driverId}`);
  };

  // Define handler for viewing all drivers in leaderboard
  const handleViewAllLeaderboard = () => {
    navigate('/leaderboard');
  };

  // Render the component
  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Drivers"
          subtitle="Manage your drivers and track their performance"
          actions={[
            { label: 'Add Driver', onClick: handleCreateDriver }
          ]}
        />

        <TabsContainer>
          <Tabs
            tabs={TABS}
            activeTabId={activeTab}
            onChange={handleTabChange}
          />
        </TabsContainer>

        {activeTab === 'all' && (
          <DriverList />
        )}

        {activeTab === 'performance' && (
          <Grid columns={{ base: '1fr', lg: '1fr 1fr' }} gap="1rem">
            <CardContainer>
              <Card>
                <SectionTitle>Performance Metrics</SectionTitle>
                <SectionDescription>
                  View key performance indicators for your drivers.
                </SectionDescription>
                {drivers && drivers.length > 0 && (
                  <PerformanceMetricsTable
                    driverId={drivers[0].id}
                    periodStart="2023-01-01"
                    periodEnd="2023-12-31"
                  />
                )}
              </Card>
            </CardContainer>
          </Grid>
        )}

        {activeTab === 'compliance' && (
          <Grid columns={{ base: '1fr', lg: '1fr 1fr' }} gap="1rem">
            <CardContainer>
              <Card>
                <SectionTitle>HOS Compliance</SectionTitle>
                <SectionDescription>
                  Track Hours of Service compliance for your drivers.
                </SectionDescription>
                {drivers && drivers.length > 0 && (
                  <HOSComplianceTable driverId={drivers[0].id} />
                )}
              </Card>
            </CardContainer>
          </Grid>
        )}

        {activeTab === 'leaderboard' && (
          <Grid columns={{ base: '1fr', lg: '1fr 1fr' }} gap="1rem">
            <CardContainer>
              <DriverLeaderboard
                title="Top Drivers"
                subtitle="See who's leading the pack this week"
                limit={5}
                onDriverClick={(entry) => handleDriverClick(entry.driverId)}
                onViewAllClick={handleViewAllLeaderboard}
              />
            </CardContainer>
          </Grid>
        )}
      </PageContainer>
    </MainLayout>
  );
};

export default DriversPage;