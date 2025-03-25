import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import { useParams, useNavigate } from 'react-router-dom'; // version ^6.10.0
import styled from 'styled-components'; // version ^5.3.6

import MainLayout from '../components/layout/MainLayout';
import TrackingMap from '../components/tracking/TrackingMap';
import ShipmentDetailsCard from '../components/tracking/ShipmentDetailsCard';
import StatusTimelineCard from '../components/tracking/StatusTimelineCard';
import DocumentsCard from '../components/tracking/DocumentsCard';
import { LoadWithDetails } from '../../common/interfaces/load.interface';
import Button from '../../shared/components/buttons/Button';
import { Heading, Text } from '../../shared/components/typography';
import { Grid, FlexBox } from '../../shared/components/layout';
import { LoadingIndicator } from '../../shared/components/feedback/LoadingIndicator';
import { getLoadById } from '../services/loadService';
import trackingService from '../services/trackingService';
import notificationService from '../../common/services/notificationService';
import { ArrowIcon } from '../../shared/assets/icons';

// Define the structure for tab configuration data
interface TabData {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

// Define styled components for layout and styling
const PageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
`;

const BackButton = styled(Button)`
  padding: 8px;
  min-width: auto;
`;

const ContentContainer = styled(Grid)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MapColumn = styled.div`
  height: 600px;

  @media (max-width: 1024px) {
    height: 400px;
  }
`;

const DetailsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #DADCE0;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.isActive ? '#1A73E8' : 'transparent'};
  color: ${props => props.isActive ? '#1A73E8' : '#5F6368'};
  font-weight: ${props => props.isActive ? '500' : 'normal'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #1A73E8;
  }
`;

const TabContent = styled.div`
  flex: 1;
`;

const ErrorMessage = styled(Text)`
  color: #EA4335;
  padding: 16px;
  text-align: center;
`;

// Main component for the shipment tracking page
const TrackingPage: React.FC = () => {
  // Extract loadId from URL parameters using useParams hook
  const { loadId } = useParams<{ loadId: string }>();

  // Initialize state for load data, loading status, and active tab
  const [load, setLoad] = useState<LoadWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');

  // Create navigate function using useNavigate hook for navigation
  const navigate = useNavigate();

  // Implement fetchLoadData function to retrieve load details
  const fetchLoadData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedLoad = await getLoadById(loadId as string, true) as LoadWithDetails;
      setLoad(fetchedLoad);
    } catch (err: any) {
      setError(err.message);
      notificationService.showErrorNotification(`Failed to fetch load details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  // Set up useEffect to fetch load data when component mounts or loadId changes
  useEffect(() => {
    if (loadId) {
      fetchLoadData();
    }
  }, [loadId, fetchLoadData]);

  // Set up useEffect to subscribe to real-time load updates
  useEffect(() => {
    if (loadId && load) {
      const unsubscribe = trackingService.subscribeToLoadUpdates(
        loadId,
        (position) => {
          // Handle position updates if needed
        },
        (status, details) => {
          // Handle status updates if needed
        },
        (error: Error) => {
          console.error('Error subscribing to load updates', error);
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [loadId, load]);

  // Implement handleBackClick function to navigate back to loads page
  const handleBackClick = () => {
    navigate('/loads');
  };

  // Implement handleTabChange function to switch between tabs
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Implement handleViewDocuments function to switch to documents tab
  const handleViewDocuments = () => {
    setActiveTab('documents');
  };

  // Define tab configuration data
  const tabs: TabData[] = [
    { id: 'details', label: 'Shipment Details' },
    { id: 'timeline', label: 'Status Timeline' },
    { id: 'documents', label: 'Documents' },
  ];

  // Render the page layout with MainLayout component
  return (
    <MainLayout>
      {/* Render page header with back button and load reference */}
      <PageHeader>
        <BackButton variant="text" onClick={handleBackClick} startIcon={<ArrowIcon />}>
          Back
        </BackButton>
        <Heading variant="h1">
          {load ? `Tracking: ${load.referenceNumber}` : 'Tracking'}
        </Heading>
      </PageHeader>

      {/* Render main content with responsive grid layout */}
      {loading && <LoadingIndicator />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!loading && load && (
        <ContentContainer>
          {/* Render TrackingMap component in the left column */}
          <MapColumn>
            <TrackingMap loadId={loadId as string} />
          </MapColumn>

          {/* Render tabs and tab content in the right column */}
          <DetailsColumn>
            <TabsContainer>
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  isActive={activeTab === tab.id}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </TabButton>
              ))}
            </TabsContainer>

            {/* Render tab content based on activeTab state */}
            <TabContent>
              {activeTab === 'details' && (
                <ShipmentDetailsCard loadId={loadId as string} onViewDocuments={handleViewDocuments} />
              )}
              {activeTab === 'timeline' && (
                <StatusTimelineCard load={load} />
              )}
              {activeTab === 'documents' && (
                <DocumentsCard loadId={loadId as string} />
              )}
            </TabContent>
          </DetailsColumn>
        </ContentContainer>
      )}
    </MainLayout>
  );
};

// Export the TrackingPage component as the default export
export default TrackingPage;