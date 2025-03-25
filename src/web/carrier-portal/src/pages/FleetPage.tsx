import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useDispatch, useSelector } from 'react-redux'; // version ^8.0.5
import { useNavigate, useParams } from 'react-router-dom'; // version ^6.8.0

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import TruckList from '../components/fleet/TruckList';
import TruckMap from '../components/fleet/TruckMap';
import EfficiencyMetricsTable from '../components/fleet/EfficiencyMetricsTable';
import Card from '../../../shared/components/cards/Card';
import Tabs from '../../../shared/components/navigation/Tabs';
import Button from '../../../shared/components/buttons/Button';
import Modal from '../../../shared/components/feedback/Modal';
import {
  Vehicle,
  VehicleStatus,
} from '../../../common/interfaces/vehicle.interface';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import {
  fetchVehicles,
  fetchFleetSummary,
} from '../store/actions/fleetActions';
import { RootState } from '../store/reducers/rootReducer';
import { theme } from '../../../shared/styles/theme';

// LD1: Define tab options for the Fleet page
const TABS = [
  { id: 'map', label: 'Map View' },
  { id: 'list', label: 'List View' },
  { id: 'metrics', label: 'Efficiency Metrics' },
];

// LD1: Styled component for the page container
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  width: 100%;
  padding-bottom: ${theme.spacing.xl};
`;

// LD1: Styled component for the tab content area
const TabContent = styled.div`
  margin-top: ${theme.spacing.md};
`;

// LD1: Styled component for the map container
const MapContainer = styled.div`
  height: 500px;
  width: 100%;
  border-radius: ${theme.borders.radius.md};
  overflow: hidden;
  box-shadow: ${theme.shadows.sm};
`;

// LD1: Styled component for the header actions
const HeaderActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

// LD1: Styled component for the summary cards
const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

// LD1: Styled component for the summary card
const SummaryCard = styled(Card)`
  padding: ${theme.spacing.md};
  text-align: center;
`;

// LD1: Styled component for the card title
const CardTitle = styled.h3`
  margin: 0;
  margin-bottom: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  font-weight: ${theme.typography.fontWeight.medium};
`;

// LD1: Styled component for the card value
const CardValue = styled.div`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
`;

/**
 * Main component for the Fleet Management page in the carrier portal
 * @returns {JSX.Element} Rendered Fleet page component
 */
const FleetPage: React.FC = () => {
  // LD1: Get carrierId from authentication context
  const { authState } = useAuthContext();
  const carrierId = authState.user?.carrierId || '';

  // LD2: Initialize state for active tab, selected vehicle, and modal visibility
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // LD3: Use Redux hooks to access fleet state and dispatch actions
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { vehicles } = useSelector((state: RootState) => state.fleet);

  // LD4: Implement useEffect to fetch vehicles and fleet summary when component mounts
  useEffect(() => {
    if (carrierId) {
      dispatch(fetchVehicles(carrierId));
      dispatch(fetchFleetSummary(carrierId));
    }
  }, [carrierId, dispatch]);

  // LD5: Create handlers for tab changes, vehicle selection, and modal operations
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(vehicle !== null);
  };

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  // LD6: Render MainLayout component as the page container
  return (
    <MainLayout>
      {/* LD7: Render PageHeader with title and add vehicle button */}
      <PageHeader
        title="Fleet Management"
        actions={
          <HeaderActions>
            <Button onClick={handleAddVehicle}>Add Vehicle</Button>
          </HeaderActions>
        }
      />

      {/* LD8: Render Tabs component for switching between Map, List, and Metrics views */}
      <Tabs
        tabs={TABS}
        activeTabId={activeTab}
        onChange={handleTabChange}
      />

      {/* LD9: Render the active tab content based on the selected tab */}
      <TabContent>
        {activeTab === 'map' && (
          // LD10: For Map tab, render TruckMap component with vehicles data
          <MapContainer>
            <TruckMap
              carrierId={carrierId}
              vehicles={vehicles}
              selectedTruck={selectedVehicle}
              onTruckSelect={handleVehicleSelect}
            />
          </MapContainer>
        )}
        {activeTab === 'list' && (
          // LD11: For List tab, render TruckList component with filtering and sorting
          <TruckList carrierId={carrierId} />
        )}
        {activeTab === 'metrics' && (
          // LD12: For Metrics tab, render EfficiencyMetricsTable component
          <EfficiencyMetricsTable carrierId={carrierId} />
        )}
      </TabContent>

      {/* LD13: Render Modal for adding/editing vehicles when modal is visible */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}>
        {/* Add Vehicle Form or Edit Vehicle Form will go here */}
      </Modal>
    </MainLayout>
  );
};

// IE3: Export the FleetPage component as the default export
export default FleetPage;