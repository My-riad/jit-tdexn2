import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import { useParams, useNavigate } from 'react-router-dom'; // version ^6.10.0
import { useDispatch, useSelector } from 'react-redux'; // version ^8.0.5
import styled from 'styled-components'; // version ^5.3.10

import Container from '../../../shared/components/layout/Container';
import FlexBox from '../../../shared/components/layout/FlexBox';
import Grid from '../../../shared/components/layout/Grid';
import Heading from '../../../shared/components/typography/Heading';
import Button from '../../../shared/components/buttons/Button';
import IconButton from '../../../shared/components/buttons/IconButton';
import Breadcrumbs from '../../../shared/components/navigation/Breadcrumbs';
import Tabs from '../../../shared/components/navigation/Tabs';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Alert from '../../../shared/components/feedback/Alert';
import Modal from '../../../shared/components/feedback/Modal';
import LoadDetailCard from '../components/loads/LoadDetailCard';
import TrackingMap from '../components/tracking/TrackingMap';
import StatusTimelineCard from '../components/tracking/StatusTimelineCard';
import DocumentsCard from '../components/tracking/DocumentsCard';
import { LoadWithDetails, LoadStatus } from '../../../common/interfaces/load.interface';
import loadService from '../services/loadService';
import trackingService from '../services/trackingService';
import { loadActions } from '../store/actions/loadActions';

// Define the TabOption interface for tab navigation
interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

// Define the LoadDetailPageState interface for component state
interface LoadDetailPageState {
  loadData: LoadWithDetails | null;
  loading: boolean;
  error: string | null;
  activeTab: string;
  trackingSubscription: Function | null;
  isEditModalOpen: boolean;
  isStatusUpdateModalOpen: boolean;
  isDocumentUploadModalOpen: boolean;
}

// Styled components for layout and styling
const PageContainer = styled(Container)`
  padding: 2rem 0;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const TabContent = styled.div`
  margin-top: 1.5rem;
`;

const MapSection = styled.div`
  margin-bottom: 1.5rem;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
`;

const TwoColumnGrid = styled(Grid)`
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Main LoadDetailPage component
const LoadDetailPage: React.FC = () => {
  // Extract loadId from URL parameters using useParams hook
  const { loadId } = useParams<{ loadId: string }>();

  // Initialize state for load data, loading status, error, active tab, and tracking subscription
  const [state, setState] = useState<LoadDetailPageState>({
    loadData: null,
    loading: true,
    error: null,
    activeTab: 'overview',
    trackingSubscription: null,
    isEditModalOpen: false,
    isStatusUpdateModalOpen: false,
    isDocumentUploadModalOpen: false,
  });

  // Set up Redux dispatch and selector for load state
  const dispatch = useDispatch();
  const load = useSelector((state: any) => state.load.load);

  // Fetch load details when component mounts or loadId changes
  useEffect(() => {
    const fetchLoadDetails = async () => {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      try {
        const fetchedLoad = await loadService.getLoadById(loadId!, true);
        setState(prevState => ({ ...prevState, loadData: fetchedLoad as LoadWithDetails }));
        dispatch(loadActions.fetchLoadDetails(fetchedLoad));
      } catch (error: any) {
        setState(prevState => ({ ...prevState, error: error.message }));
      } finally {
        setState(prevState => ({ ...prevState, loading: false }));
      }
    };

    if (loadId) {
      fetchLoadDetails();
    }
  }, [loadId, dispatch]);

  // Subscribe to real-time tracking updates for the load
  useEffect(() => {
    if (state.loadData) {
      const subscribeToTracking = () => {
        return trackingService.subscribeToLoadUpdates(
          loadId!,
          (position) => {
            // Handle position updates
          },
          (status, details) => {
            // Handle status updates
          },
          (error: Error) => {
            console.error('Error subscribing to load updates', error);
          }
        );
      };

      const subscription = subscribeToTracking();
      setState(prevState => ({ ...prevState, trackingSubscription: subscription }));

      return () => {
        subscription();
      };
    }
  }, [loadId, state.loadData]);

  // Handle tab changes for different sections of the page
  const handleTabChange = (tabId: string) => {
    setState(prevState => ({ ...prevState, activeTab: tabId }));
  };

  // Implement status update handler for changing load status
  const handleStatusUpdate = async (loadId: string, newStatus: LoadStatus) => {
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      await loadService.updateLoadStatus(loadId, { status: newStatus, updatedBy: 'shipper' });
      // Refresh load details after status update
      const updatedLoad = await loadService.getLoadById(loadId!, true);
      setState(prevState => ({ ...prevState, loadData: updatedLoad as LoadWithDetails }));
      dispatch(loadActions.updateLoadStatus(loadId, newStatus, {}));
    } catch (error: any) {
      setState(prevState => ({ ...prevState, error: error.message }));
    } finally {
      setState(prevState => ({ ...prevState, loading: false }));
    }
  };

  // Implement document upload and deletion handlers
  const handleDocumentUpload = () => {
    // Implement document upload logic
  };

  const handleDocumentDelete = () => {
    // Implement document delete logic
  };

  // Define tab options for the tabbed interface
  const tabOptions: TabOption[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'documents', label: 'Documents' },
  ];

  // Render loading state if data is being fetched
  if (state.loading) {
    return <LoadingIndicator fullPage />;
  }

  // Render error state if there was an error fetching data
  if (state.error) {
    return <Alert severity="error" message={state.error} />;
  }

  // Render the page layout with header, breadcrumbs, and action buttons
  return (
    <PageContainer>
      <PageHeader>
        <HeaderLeft>
          <Breadcrumbs items={[{ label: 'Loads', href: '/loads' }, { label: 'Load Details' }]} />
          <Heading level={2}>Load {state.loadData?.referenceNumber}</Heading>
        </HeaderLeft>
        <HeaderRight>
          <Button variant="secondary" onClick={() => setState(prevState => ({ ...prevState, isEditModalOpen: true }))}>
            Edit Load
          </Button>
          <Button variant="primary" onClick={() => setState(prevState => ({ ...prevState, isStatusUpdateModalOpen: true }))}>
            Update Status
          </Button>
        </HeaderRight>
      </PageHeader>

      {/* Render tabs for different sections: Overview, Tracking, Documents */}
      <Tabs tabs={tabOptions} activeTabId={state.activeTab} onChange={handleTabChange} />

      {/* Render the active tab content based on selected tab */}
      <TabContent>
        {state.activeTab === 'overview' && (
          <LoadDetailCard loadId={loadId!} load={state.loadData} onStatusUpdate={handleStatusUpdate} />
        )}
        {state.activeTab === 'tracking' && (
          <>
            <MapSection>
              <TrackingMap loadId={loadId!} />
            </MapSection>
            <StatusTimelineCard load={state.loadData!} />
          </>
        )}
        {state.activeTab === 'documents' && (
          <DocumentsCard loadId={loadId!} />
        )}
      </TabContent>

      {/* Render modals for editing load, updating status, and uploading documents */}
      <Modal isOpen={state.isEditModalOpen} onClose={() => setState(prevState => ({ ...prevState, isEditModalOpen: false }))} title="Edit Load">
        {/* Implement edit load form here */}
      </Modal>

      <Modal isOpen={state.isStatusUpdateModalOpen} onClose={() => setState(prevState => ({ ...prevState, isStatusUpdateModalOpen: false }))} title="Update Status">
        {/* Implement status update form here */}
      </Modal>

      <Modal isOpen={state.isDocumentUploadModalOpen} onClose={() => setState(prevState => ({ ...prevState, isDocumentUploadModalOpen: false }))} title="Upload Document">
        {/* Implement document upload form here */}
      </Modal>
    </PageContainer>
  );
};

export default LoadDetailPage;