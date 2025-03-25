import React, { useState, useEffect, useCallback } from 'react'; // React, { useState, useEffect, useCallback } ^18.2.0
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // React Router DOM ^6.10.0
import styled from 'styled-components'; // styled-components ^5.3.10

import MainLayout from '../components/layout/MainLayout';
import Container from '../../../shared/components/layout/Container';
import FlexBox from '../../../shared/components/layout/FlexBox';
import Grid from '../../../shared/components/layout/Grid';
import Heading from '../../../shared/components/typography/Heading';
import Text from '../../../shared/components/typography/Text';
import Button from '../../../shared/components/buttons/Button';
import Breadcrumbs from '../../../shared/components/navigation/Breadcrumbs';
import Tabs from '../../../shared/components/navigation/Tabs';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Alert from '../../../shared/components/feedback/Alert';
import Modal from '../../../shared/components/feedback/Modal';
import CarrierDetailCard from '../components/carriers/CarrierDetailCard';
import CarrierPerformanceMetrics from '../components/carriers/CarrierPerformanceMetrics';
import PricingDetailsCard from '../components/carriers/PricingDetailsCard';
import { Carrier, CarrierRecommendation } from '../../../common/interfaces/carrier.interface';
import { Load } from '../../../common/interfaces/load.interface';
import { getCarrierDetails, getCarrierPerformanceMetrics, getCarrierNetworkStats, getRecommendedCarriersForLoad } from '../services/carrierService';
import { getLoadById } from '../services/loadService';

// LD1: Interface for tab navigation options
interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

// LD1: Interface for the component's state
interface CarrierDetailPageState {
  carrier: Carrier | null;
  loading: boolean;
  error: string | null;
  activeTab: string;
  load: Load | null;
  isRateNegotiationModalOpen: boolean;
  negotiatedRate: number | null;
}

// LD1: Styled component for the page container
const PageContainer = styled(Container)`
  padding: 2rem 0;
`;

// LD1: Styled component for the page header
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

// LD1: Styled component for the left side of the header
const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

// LD1: Styled component for the right side of the header
const HeaderRight = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

// LD1: Styled component for the tab content
const TabContent = styled.div`
  margin-top: 1.5rem;
`;

// LD1: Styled component for a two-column grid layout
const TwoColumnGrid = styled(Grid)`
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// LD1: Styled component for action buttons
const ActionButton = styled(Button)`
  margin-left: 1rem;
`;

// LD1: Styled component for the rate negotiation form
const RateNegotiationForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// LD1: Page component that displays comprehensive details about a specific carrier
const CarrierDetailPage: React.FC = () => {
  // LD1: Extract carrierId and loadId from URL parameters using useParams hook
  const { carrierId, loadId } = useParams<{ carrierId: string; loadId?: string }>();

  // LD1: Initialize state for carrier data, loading status, error, active tab, and related load
  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [load, setLoad] = useState<Load | null>(null);

  // LD1: Initialize state for rate negotiation modal
  const [isRateNegotiationModalOpen, setIsRateNegotiationModalOpen] = useState<boolean>(false);
  const [negotiatedRate, setNegotiatedRate] = useState<number | null>(null);

  // LD1: Create navigate function using useNavigate hook for navigation
  const navigate = useNavigate();

  // LD1: Create a location object using useLocation hook
  const location = useLocation();

  // LD1: Fetch carrier details when component mounts or carrierId changes
  useEffect(() => {
    const fetchCarrierDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        if (carrierId) {
          const carrierDetails = await getCarrierDetails(carrierId);
          setCarrier(carrierDetails);
        }
      } catch (err: any) {
        setError(`Failed to fetch carrier details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCarrierDetails();
  }, [carrierId]);

  // LD1: Fetch load details if loadId is present
  useEffect(() => {
    const fetchLoadDetails = async () => {
      if (loadId) {
        try {
          const loadDetails = await getLoadById(loadId);
          setLoad(loadDetails);
        } catch (err: any) {
          setError(`Failed to fetch load details: ${err.message}`);
        }
      }
    };

    fetchLoadDetails();
  }, [loadId]);

  // LD1: Handle tab changes for different sections of the page
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // LD1: Implement rate negotiation handler to open modal dialog
  const handleNegotiateRate = useCallback(() => {
    setIsRateNegotiationModalOpen(true);
  }, []);

  // LD1: Implement carrier selection handler to assign carrier to load
  const handleSelectCarrier = useCallback(() => {
    // LD1: Navigate back to the loads page
    navigate('/loads');
  }, [navigate]);

  // LD1: Define breadcrumb items
  const breadcrumbItems = useMemo(() => [
    { label: 'Loads', href: '/loads' },
    { label: carrier?.name || 'Carrier Details', href: location.pathname },
  ], [carrier?.name, location.pathname]);

  // LD1: Define tab options
  const tabOptions: TabOption[] = useMemo(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    // { id: 'historical', label: 'Historical Data' }, // Removed Historical Data tab
  ], []);

  // LD1: Render loading state if data is being fetched
  if (loading) {
    return <MainLayout><LoadingIndicator fullPage /></MainLayout>;
  }

  // LD1: Render error state if there was an error fetching data
  if (error) {
    return (
      <MainLayout>
        <PageContainer>
          <Alert severity="error" message={error} />
        </PageContainer>
      </MainLayout>
    );
  }

  // LD1: Render the page layout with header, breadcrumbs, and action buttons
  return (
    <MainLayout>
      <PageContainer>
        <PageHeader>
          <HeaderLeft>
            <Breadcrumbs items={breadcrumbItems} />
            <Heading level={2}>{carrier?.name}</Heading>
          </HeaderLeft>
          <HeaderRight>
            <Button variant="secondary" onClick={() => navigate('/loads')}>
              Back to Loads
            </Button>
            <ActionButton variant="primary" onClick={handleSelectCarrier}>
              Select Carrier
            </ActionButton>
          </HeaderRight>
        </PageHeader>

        {/* LD1: Render tabs for different sections: Overview, Performance, Historical Data */}
        <Tabs tabs={tabOptions} activeTabId={activeTab} onChange={handleTabChange} />

        {/* LD1: Render the active tab content based on selected tab */}
        <TabContent>
          {activeTab === 'overview' && (
            <TwoColumnGrid>
              <div>
                <CarrierDetailCard carrierId={carrierId} load={load} onSelect={handleSelectCarrier} onNegotiateRate={handleNegotiateRate} />
              </div>
              <div>
                {/* Additional overview content can be added here */}
              </div>
            </TwoColumnGrid>
          )}
          {activeTab === 'performance' && (
            <CarrierPerformanceMetrics carrierId={carrierId} />
          )}
        </TabContent>

        {/* LD1: Render rate negotiation modal when open */}
        <Modal
          isOpen={isRateNegotiationModalOpen}
          onClose={() => setIsRateNegotiationModalOpen(false)}
          title="Negotiate Rate"
        >
          <RateNegotiationForm>
            <Text>Rate Negotiation Form</Text>
          </RateNegotiationForm>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
};

// IE3: Export the CarrierDetailPage component
export default CarrierDetailPage;