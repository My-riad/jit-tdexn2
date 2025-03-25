import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import { useParams, useNavigate } from 'react-router-dom'; // version ^6.10.0
import styled from 'styled-components'; // version ^5.3.6
import { FiEdit, FiUsers, FiMapPin, FiFileText, FiRefreshCw } from 'react-icons/fi'; // version ^4.7.1

import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import LoadDetailCard from '../../components/loads/LoadDetailCard';
import LoadStatusTimeline from '../../components/loads/LoadStatusTimeline';
import LoadMap from '../../components/loads/LoadMap';
import LoadAssignmentForm from '../../components/loads/LoadAssignmentForm';
import OptimizationRecommendationsList from '../../components/loads/OptimizationRecommendationsList';
import Card from '../../../shared/components/cards/Card';
import { Button } from '../../../shared/components/buttons';
import { Modal, LoadingIndicator, Alert } from '../../../shared/components/feedback';
import Grid from '../../../shared/components/layout/Grid';
import { Tabs } from '../../../shared/components/navigation';
import { getLoadDetails, updateLoadStatusForCarrier, getLoadDocumentsForCarrier } from '../../services/loadService';
import { LoadWithDetails, LoadStatus } from '../../../common/interfaces/load.interface';
import { useAuthContext } from '../../../common/contexts/AuthContext';

// Styled Components
const PageContainer = styled.div`
  padding: 1rem;
  max-width: 100%;
  width: 100%;
`;

const ContentSection = styled.div`
  margin-top: 1rem;
  margin-bottom: 2rem;
`;

const TabContent = styled.div`
  margin-top: 1.5rem;
`;

const MapContainer = styled.div`
  height: 500px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
`;

const ActionButton = styled(Button)`
  margin-left: 0.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const ErrorContainer = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${props => props.theme.colors.error.main};
`;

/**
 * Main component for the load detail page
 */
export const LoadDetailPage: React.FC = () => {
  // Extract loadId from URL parameters using useParams hook
  const { loadId } = useParams<{ loadId: string }>();

  // Initialize state for load data, loading state, error state, and modal visibility
  const [load, setLoad] = useState<LoadWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState<boolean>(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState<boolean>(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<number>(0);

  // Get current user and carrier information from auth context
  const { authState } = useAuthContext();
  const carrierId = authState?.user?.carrierId;

  // Get navigate function for programmatic navigation
  const navigate = useNavigate();

  // Fetch load details when component mounts or loadId changes
  const fetchLoadDetails = useCallback(async () => {
    if (!loadId) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedLoad = await getLoadDetails(loadId);
      setLoad(fetchedLoad);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch load details');
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => {
    fetchLoadDetails();
  }, [fetchLoadDetails]);

  // Handle tab selection for different content sections
  const handleTabChange = (index: number) => {
    setSelectedTab(index);
  };

  // Implement handlers for various actions (edit, assign, update status, view documents, view map)
  const handleEditLoad = useCallback(() => {
    navigate(`/loads/${loadId}/edit`);
  }, [navigate, loadId]);

  const handleAssignLoad = useCallback(() => {
    setIsAssignmentModalOpen(true);
  }, []);

  const handleUpdateStatus = useCallback(() => {
    setIsStatusUpdateModalOpen(true);
  }, []);

  const handleViewDocuments = useCallback(() => {
    setIsDocumentsModalOpen(true);
  }, []);

  const handleViewMap = useCallback(() => {
    setSelectedTab(2); // Assuming map tab index is 2
  }, []);

  // Implement callback functions for form submissions and modal closures
  const handleAssignmentComplete = useCallback((result: any) => {
    setIsAssignmentModalOpen(false);
    alert('Load assigned successfully!');
    fetchLoadDetails();
  }, [fetchLoadDetails]);

  const handleStatusUpdateComplete = useCallback((result: any) => {
    setIsStatusUpdateModalOpen(false);
    alert('Status updated successfully!');
    fetchLoadDetails();
  }, [fetchLoadDetails]);

  const handleApplyRecommendation = useCallback((recommendation: any) => {
    alert('Recommendation applied successfully!');
    fetchLoadDetails();
  }, [fetchLoadDetails]);

  // Define tab items for different content sections
  const tabItems = [
    { id: 'details', label: 'Details', content: null },
    { id: 'timeline', label: 'Timeline', content: null },
    { id: 'map', label: 'Map', content: null },
    { id: 'recommendations', label: 'Recommendations', content: null },
  ];

  // Render page with MainLayout, PageHeader, and content sections
  return (
    <MainLayout>
      <PageContainer>
        {loading && (
          <LoadingContainer>
            <LoadingIndicator label="Loading Load Details..." />
          </LoadingContainer>
        )}
        {error && (
          <ErrorContainer>
            <Alert severity="error" message={error} />
          </ErrorContainer>
        )}
        {load && (
          <>
            <PageHeader
              title="Load Details"
              subtitle={`Reference Number: ${load.referenceNumber}`}
              breadcrumbItems={[
                { label: 'Loads', href: '/loads' },
                { label: load.referenceNumber, href: `/loads/${loadId}` },
              ]}
              actions={[
                { label: 'Edit', onClick: handleEditLoad, icon: <FiEdit /> },
                { label: 'Assign', onClick: handleAssignLoad, icon: <FiUsers /> },
                { label: 'Update Status', onClick: handleUpdateStatus, icon: <FiRefreshCw /> },
                { label: 'View Documents', onClick: handleViewDocuments, icon: <FiFileText /> },
                { label: 'View Map', onClick: handleViewMap, icon: <FiMapPin /> },
              ]}
            />

            <Tabs
              tabs={tabItems}
              activeTabId={tabItems[selectedTab].id}
              onChange={(tabId) => handleTabChange(tabItems.findIndex(item => item.id === tabId))}
            />

            <TabContent>
              {selectedTab === 0 && (
                <ContentSection>
                  <LoadDetailCard
                    load={load}
                    onEdit={handleEditLoad}
                    onAssign={handleAssignLoad}
                    onUpdateStatus={handleUpdateStatus}
                    onViewDocuments={handleViewDocuments}
                    onViewMap={handleViewMap}
                  />
                </ContentSection>
              )}
              {selectedTab === 1 && (
                <ContentSection>
                  <Card>
                    <LoadStatusTimeline statusHistory={load.statusHistory} isLoading={false} compact={false} />
                  </Card>
                </ContentSection>
              )}
              {selectedTab === 2 && (
                <ContentSection>
                  <Card>
                    <MapContainer>
                      <LoadMap
                        loads={[load]}
                        selectedLoadId={loadId}
                      />
                    </MapContainer>
                  </Card>
                </ContentSection>
              )}
              {selectedTab === 3 && (
                <ContentSection>
                  <OptimizationRecommendationsList
                    loadId={loadId}
                    onApplyRecommendation={handleApplyRecommendation}
                  />
                </ContentSection>
              )}
            </TabContent>
          </>
        )}

        {/* Modals */}
        <Modal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          title="Assign Load"
        >
          {load && (
            <LoadAssignmentForm
              load={load}
              onAssignmentComplete={handleAssignmentComplete}
              onCancel={() => setIsAssignmentModalOpen(false)}
            />
          )}
        </Modal>

        <Modal
          isOpen={isStatusUpdateModalOpen}
          onClose={() => setIsStatusUpdateModalOpen(false)}
          title="Update Status"
        >
          {/* TODO: Implement Status Update Form */}
          <div>Status Update Form Coming Soon</div>
          <Button onClick={() => setIsStatusUpdateModalOpen(false)}>Close</Button>
        </Modal>

        <Modal
          isOpen={isDocumentsModalOpen}
          onClose={() => setIsDocumentsModalOpen(false)}
          title="Load Documents"
        >
          {/* TODO: Implement Document Viewing */}
          <div>Document Viewing Coming Soon</div>
          <Button onClick={() => setIsDocumentsModalOpen(false)}>Close</Button>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
};

// IE3: Export the LoadDetailPage component as the default export
export default LoadDetailPage;