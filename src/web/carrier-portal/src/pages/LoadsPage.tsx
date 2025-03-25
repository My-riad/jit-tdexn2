# src/web/carrier-portal/src/pages/LoadsPage.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // version ^8.0.5
import { useNavigate, useParams } from 'react-router-dom'; // version ^6.8.0
import styled from 'styled-components'; // version ^5.3.6
import { FiPlus, FiMap, FiList, FiRefreshCw } from 'react-icons/fi'; // version ^4.7.1

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import LoadList from '../components/loads/LoadList';
import LoadMap from '../components/loads/LoadMap';
import OptimizationRecommendationsList from '../components/loads/OptimizationRecommendationsList';
import Tabs from '../../../shared/components/navigation/Tabs';
import Card from '../../../shared/components/cards/Card';
import Button from '../../../shared/components/buttons/Button';
import Modal from '../../../shared/components/feedback/Modal';
import { LoadStatus, Load, LoadSummary, LoadSearchParams } from '../../../common/interfaces/load.interface';
import { fetchLoads, fetchLoadDetail, deleteLoad, fetchOptimizations, applyOptimization } from '../../store/actions/loadActions';
import { getCarrierLoads, getLoadOptimizationOpportunities } from '../../services/loadService';

// Define tab options for switching between list and map views
const TABS = [
  { id: 'list', label: 'List View', icon: FiList },
  { id: 'map', label: 'Map View', icon: FiMap },
];

// Styled component for the page container
const PageContainer = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

// Styled component for the tabs container
const TabsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

// Styled component for action buttons
const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

// Styled component for the loads container
const LoadsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

// Styled component for the map container
const MapContainer = styled.div`
  height: 600px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
`;

// Styled component for the optimization banner
const OptimizationBanner = styled.div`
  background-color: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

// Styled component for the banner text
const BannerText = styled.div`
  flex: 1;
`;

// Styled component for the banner title
const BannerTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #0066cc;
`;

// Styled component for the banner description
const BannerDescription = styled.p`
  margin: 0;
  color: #333;
`;

/**
 * Main component for the loads page in the carrier portal
 * @returns {JSX.Element} Rendered loads page component
 */
const LoadsPage: React.FC = () => {
  // LD1: Get carrierId from useParams hook
  const { carrierId } = useParams<{ carrierId: string }>();

  // LD1: Initialize state for active tab (list or map view)
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');

  // LD1: Initialize state for search parameters
  const [searchParams, setSearchParams] = useState<LoadSearchParams>({});

  // LD1: Initialize state for selected load
  const [selectedLoad, setSelectedLoad] = useState<LoadSummary | null>(null);

  // LD1: Initialize state for optimization recommendations modal visibility
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  // LD1: Use useSelector to get loads, loading state, and error from Redux store
  const { loads, loading, error } = useSelector((state: any) => state.load);

  // LD1: Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // LD1: Use useNavigate to get the navigation function
  const navigate = useNavigate();

  // LD1: Define useEffect to fetch loads when component mounts or search parameters change
  useEffect(() => {
    if (carrierId) {
      dispatch(fetchLoads({ carrierId, searchParams }));
    }
  }, [dispatch, carrierId, searchParams]);

  // LD1: Define useEffect to fetch optimization recommendations when component mounts
  useEffect(() => {
    if (carrierId) {
      dispatch(fetchOptimizations({ carrierId }));
    }
  }, [dispatch, carrierId]);

  // LD1: Define handler for tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'list' | 'map');
  };

  // LD1: Define handler for search parameter changes
  const handleSearchChange = (params: Partial<LoadSearchParams>) => {
    setSearchParams((prevParams) => ({ ...prevParams, ...params }));
  };

  // LD1: Define handler for load selection
  const handleLoadSelect = (load: LoadSummary) => {
    setSelectedLoad(load);
  };

  // LD1: Define handler for creating a new load
  const handleCreateLoad = () => {
    navigate(`/loads/create`);
  };

  // LD1: Define handler for refreshing loads
  const handleRefresh = () => {
    if (carrierId) {
      dispatch(fetchLoads({ carrierId }));
    }
  };

  // LD1: Define handler for toggling optimization recommendations modal
  const handleToggleOptimizationModal = () => {
    setShowOptimizationModal((prev) => !prev);
  };

  // LD1: Define handler for applying optimization recommendation
  const handleApplyOptimization = (optimizationId: string) => {
    dispatch(applyOptimization({ recommendationId: optimizationId, loadIds: [] }));
  };

  // LD1: Render the component with MainLayout, PageHeader, tabs, and content based on active tab
  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Loads"
          subtitle="Manage and track your loads"
          breadcrumbItems={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Loads', href: '/loads' },
          ]}
          actions={[
            { label: 'Create Load', onClick: handleCreateLoad, icon: FiPlus },
          ]}
        />
        {/* <OptimizationBanner>
          <BannerText>
            <BannerTitle>Optimization Opportunities Available</BannerTitle>
            <BannerDescription>AI has identified ways to improve your fleet efficiency and reduce empty miles.</BannerDescription>
          </BannerText>
          <Button variant="primary" onClick={handleToggleOptimizationModal}>View Recommendations</Button>
        </OptimizationBanner> */}
        <TabsContainer>
          <Tabs
            tabs={TABS}
            activeTabId={activeTab}
            onChange={handleTabChange}
          />
          <ActionButtons>
            <Button variant="secondary" onClick={handleRefresh} icon={FiRefreshCw}>
              Refresh
            </Button>
          </ActionButtons>
        </TabsContainer>
        <LoadsContainer>
          {activeTab === 'list' && (
            <LoadList
              carrierId={carrierId}
              initialFilters={searchParams}
              onSearchChange={handleSearchChange}
              onLoadSelect={handleLoadSelect}
            />
          )}
          {activeTab === 'map' && (
            <MapContainer>
              <LoadMap
                carrierId={carrierId}
                selectedLoadId={selectedLoad?.id}
                onLoadClick={handleLoadSelect}
                height="100%"
                width="100%"
              />
            </MapContainer>
          )}
        </LoadsContainer>
        <Modal
          isOpen={showOptimizationModal}
          onClose={handleToggleOptimizationModal}
          title="Optimization Recommendations"
        >
          <OptimizationRecommendationsList
            loadId=""
            onApplyRecommendation={handleApplyOptimization}
          />
        </Modal>
      </PageContainer>
    </MainLayout>
  );
};

export default LoadsPage;