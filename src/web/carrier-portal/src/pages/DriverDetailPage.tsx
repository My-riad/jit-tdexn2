import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useParams, useNavigate } from 'react-router-dom'; // version ^6.4.0

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import DriverDetailCard from '../components/drivers/DriverDetailCard';
import PerformanceMetricsTable from '../components/drivers/PerformanceMetricsTable';
import HOSComplianceTable from '../components/drivers/HOSComplianceTable';
import Container from '../../../shared/components/layout/Container';
import FlexBox from '../../../shared/components/layout/FlexBox';
import Card from '../../../shared/components/cards/Card';
import Tabs from '../../../shared/components/navigation/Tabs';
import Button from '../../../shared/components/buttons/Button';
import Modal from '../../../shared/components/feedback/Modal';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { EditIcon, TruckIcon } from '../../../shared/assets/icons';
import { Driver, DriverStatus } from '../../../common/interfaces/driver.interface';
import { getDriverWithDetails, updateDriver, updateDriverStatus, assignVehicleToDriver } from '../services/driverService';
import { theme } from '../../../shared/styles/theme';
import { mediaQueries } from '../../../shared/styles/mediaQueries';

// Define the types for the tab content components
interface TabContentProps {
  driverId: string;
  driver: Driver;
  isLoading: boolean;
}

// Define the styled components for layout and content
const PageContainer = styled(Container)`
  padding: ${theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: ${theme.spacing.lg};

  ${mediaQueries.down('md')} {
    grid-template-columns: 1fr;
  }
`;

const TabContent = styled.div`
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.xs};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Section = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  margin-bottom: ${theme.spacing.md};
  font-size: 1.2rem;
  color: ${theme.colors.text.primary};
  font-weight: 600;
`;

// Define the tab definitions for the driver detail page
const TABS = [
  { id: 'performance', label: 'Performance Metrics' },
  { id: 'hos', label: 'HOS Compliance' },
  { id: 'history', label: 'Load History' },
  { id: 'documents', label: 'Documents' },
];

/**
 * Component that displays the performance metrics tab content
 */
const PerformanceTab: React.FC<TabContentProps> = ({ driverId, driver, isLoading }) => {
  const [periodStart, setPeriodStart] = useState('2023-01-01');
  const [periodEnd, setPeriodEnd] = useState('2023-12-31');

  return (
    <TabContent>
      <Section>
        <SectionTitle>Performance Period</SectionTitle>
        {/* Date range selector for selecting performance period */}
        <div>
          <label htmlFor="periodStart">Start Date:</label>
          <input type="date" id="periodStart" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          <label htmlFor="periodEnd">End Date:</label>
          <input type="date" id="periodEnd" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
        </div>
      </Section>
      {/* Render PerformanceMetricsTable with driver performance data */}
      <PerformanceMetricsTable driverId={driverId} periodStart={periodStart} periodEnd={periodEnd} />
      {isLoading && <div>Loading performance metrics...</div>}
    </TabContent>
  );
};

/**
 * Component that displays the HOS compliance tab content
 */
const HOSComplianceTab: React.FC<TabContentProps> = ({ driverId, driver, isLoading }) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <TabContent>
      <Section>
        <SectionTitle>HOS Compliance</SectionTitle>
        {/* Toggle for showing current HOS or history */}
        <div>
          <label htmlFor="showHistory">Show History:</label>
          <input type="checkbox" id="showHistory" checked={showHistory} onChange={e => setShowHistory(e.target.checked)} />
        </div>
      </Section>
      {/* Render HOSComplianceTable with driver HOS data */}
      <HOSComplianceTable driverId={driverId} showHistory={showHistory} />
      {isLoading && <div>Loading HOS compliance data...</div>}
    </TabContent>
  );
};

/**
 * Component that displays the load history tab content
 */
const LoadHistoryTab: React.FC<TabContentProps> = ({ driverId, driver, isLoading }) => {
  const [loadHistory, setLoadHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  return (
    <TabContent>
      <Section>
        <SectionTitle>Load History</SectionTitle>
        {/* Date range selector for filtering load history */}
        <div>
          {/* Implement date range selector here */}
        </div>
      </Section>
      {/* Render table of completed loads with details */}
      <div>Load History Table</div>
      {isLoading && <div>Loading load history...</div>}
    </TabContent>
  );
};

/**
 * Component that displays the documents tab content
 */
const DocumentsTab: React.FC<TabContentProps> = ({ driverId, driver, isLoading }) => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  return (
    <TabContent>
      <Section>
        <SectionTitle>Documents</SectionTitle>
        {/* Document categories (License, Certifications, etc.) */}
        <div>Document Categories</div>
      </Section>
      {/* Render document list with download/view options */}
      <div>Document List</div>
      {/* Render upload document button */}
      <div>Upload Document Button</div>
      {isLoading && <div>Loading documents...</div>}
    </TabContent>
  );
};

/**
 * Modal component for editing driver information
 */
const EditDriverModal: React.FC<{ isOpen: boolean; onClose: () => void; driver: Driver; onSave: (data: any) => void }> = ({ isOpen, onClose, driver, onSave }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Driver Information">
      {/* Render Modal component with form fields for driver information */}
      <div>Form Fields</div>
      {/* Render form sections for personal info, license info, etc. */}
      <div>Form Sections</div>
      {/* Render save and cancel buttons */}
      <div>Save and Cancel Buttons</div>
      {isSaving && <div>Saving...</div>}
    </Modal>
  );
};

/**
 * Modal component for assigning a vehicle to a driver
 */
const AssignVehicleModal: React.FC<{ isOpen: boolean; onClose: () => void; driverId: string; onAssign: (vehicleId: string) => void }> = ({ isOpen, onClose, driverId, onAssign }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Vehicle">
      {/* Render Modal component with vehicle selection form */}
      <div>Vehicle Selection Form</div>
      {/* Render dropdown or list of available vehicles */}
      <div>Available Vehicles</div>
      {/* Render assign and cancel buttons */}
      <div>Assign and Cancel Buttons</div>
      {isLoading && <div>Loading vehicles...</div>}
      {isAssigning && <div>Assigning vehicle...</div>}
    </Modal>
  );
};

/**
 * Page component that displays detailed information about a driver
 */
export const DriverDetailPage: React.FC = () => {
  // Extract driverId from URL parameters using useParams hook
  const { driverId } = useParams();

  // Initialize state for driver data, loading status, active tab, and modal visibility
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignVehicleModalOpen, setIsAssignVehicleModalOpen] = useState(false);

  // Get navigate function from useNavigate hook for navigation
  const navigate = useNavigate();

  // Create effect to fetch driver details when driverId changes
  useEffect(() => {
    const fetchDriver = async () => {
      setIsLoading(true);
      try {
        const driverData = await getDriverWithDetails(driverId);
        setDriver(driverData);
      } catch (error) {
        console.error('Failed to fetch driver details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (driverId) {
      fetchDriver();
    }
  }, [driverId]);

  // Create callback function to handle driver status changes
  const handleStatusChange = useCallback(async (newStatus: DriverStatus) => {
    if (!driverId) return;
    try {
      await updateDriverStatus(driverId, newStatus);
      // Refresh driver details after status change
      const updatedDriver = await getDriverWithDetails(driverId);
      setDriver(updatedDriver);
    } catch (error) {
      console.error('Failed to update driver status:', error);
    }
  }, [driverId]);

  // Create callback function to handle vehicle assignment
  const handleAssignVehicle = useCallback(async (vehicleId: string) => {
    if (!driverId) return;
    try {
      await assignVehicleToDriver(driverId, vehicleId);
      // Refresh driver details after vehicle assignment
      const updatedDriver = await getDriverWithDetails(driverId);
      setDriver(updatedDriver);
      setIsAssignVehicleModalOpen(false);
    } catch (error) {
      console.error('Failed to assign vehicle:', error);
    }
  }, [driverId]);

  // Create callback function to handle edit driver action
  const handleEditDriver = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  // Create callback function to handle tab changes
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Create callback function to toggle modal visibility
  const toggleModal = useCallback((modalType: 'edit' | 'assignVehicle') => {
    if (modalType === 'edit') {
      setIsEditModalOpen(prev => !prev);
    } else if (modalType === 'assignVehicle') {
      setIsAssignVehicleModalOpen(prev => !prev);
    }
  }, []);

  // Render MainLayout as the page container
  return (
    <MainLayout>
      <PageContainer>
        {/* Render PageHeader with driver name and action buttons */}
        <PageHeader
          title={driver ? `${driver.firstName} ${driver.lastName}` : 'Driver Details'}
          actions={[
            { label: 'Edit', onClick: handleEditDriver, variant: 'secondary', icon: <EditIcon /> },
            { label: 'Assign Vehicle', onClick: () => toggleModal('assignVehicle'), variant: 'secondary', icon: <TruckIcon /> },
          ]}
        />

        <ContentGrid>
          {/* Render driver details section with DriverDetailCard */}
          <DriverDetailCard
            driverId={driverId}
            driver={driver}
            onEdit={handleEditDriver}
            onStatusChange={handleStatusChange}
            onAssignVehicle={() => toggleModal('assignVehicle')}
            isLoading={isLoading}
          />

          {/* Render tabs for Performance, HOS Compliance, and other sections */}
          <Tabs tabs={TABS} activeTabId={activeTab} onChange={handleTabChange} />
        </ContentGrid>

        {/* Render tab content based on active tab */}
        {activeTab === 'performance' && driver && (
          <PerformanceTab driverId={driverId} driver={driver} isLoading={isLoading} />
        )}
        {activeTab === 'hos' && driver && (
          <HOSComplianceTab driverId={driverId} driver={driver} isLoading={isLoading} />
        )}
        {activeTab === 'history' && driver && (
          <LoadHistoryTab driverId={driverId} driver={driver} isLoading={isLoading} />
        )}
        {activeTab === 'documents' && driver && (
          <DocumentsTab driverId={driverId} driver={driver} isLoading={isLoading} />
        )}

        {/* Render modals for edit driver and vehicle assignment when visible */}
        {isEditModalOpen && driver && (
          <EditDriverModal
            isOpen={isEditModalOpen}
            onClose={() => toggleModal('edit')}
            driver={driver}
            onSave={(data) => {
              // Implement save logic here
              console.log('Saving driver data:', data);
              setIsEditModalOpen(false);
            }}
          />
        )}
        {isAssignVehicleModalOpen && (
          <AssignVehicleModal
            isOpen={isAssignVehicleModalOpen}
            onClose={() => toggleModal('assignVehicle')}
            driverId={driverId}
            onAssign={handleAssignVehicle}
          />
        )}

        {/* Show loading indicator when data is being fetched */}
        {isLoading && <LoadingIndicator />}
      </PageContainer>
    </MainLayout>
  );
};