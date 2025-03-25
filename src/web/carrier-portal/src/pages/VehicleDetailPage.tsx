import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useParams, useNavigate } from 'react-router-dom'; // version ^6.4.0

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import TruckDetailCard from '../components/fleet/TruckDetailCard';
import Button from '../../../shared/components/buttons/Button';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Alert from '../../../shared/components/feedback/Alert';
import Modal from '../../../shared/components/feedback/Modal';
import {
  TruckIcon,
  EditIcon,
  DriverIcon,
  CalendarIcon,
} from '../../../shared/assets/icons';
import {
  VehicleWithDetails,
  VehiclePerformanceMetrics,
  VehicleMaintenance,
} from '../../../common/interfaces/vehicle.interface';
import {
  getVehicleById,
  getVehiclePerformance,
  getVehicleMaintenanceHistory,
  updateVehicleStatus,
  assignDriverToVehicle,
  scheduleVehicleMaintenance,
} from '../services/fleetService';
import { CARRIER_PORTAL_ROUTES } from '../../../common/constants/routes';

// Styled Components
const PageContainer = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ErrorContainer = styled.div`
  margin: 2rem auto;
  max-width: 600px;
`;

const ModalContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

/**
 * Component that displays detailed information about a specific vehicle
 */
const VehicleDetailPage: React.FC = () => {
  // LD1: Extract vehicleId from URL parameters using useParams hook
  const { vehicleId } = useParams<{ vehicleId: string }>();

  // LD2: Initialize navigate function using useNavigate hook
  const navigate = useNavigate();

  // LD3: Set up state for vehicle data, loading state, error state, and performance metrics
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<VehiclePerformanceMetrics | null>(null);

  // LD4: Set up state for maintenance history and modal visibility
  const [maintenanceHistory, setMaintenanceHistory] = useState<VehicleMaintenance[]>([]);
  const [assignDriverModalOpen, setAssignDriverModalOpen] = useState<boolean>(false);
  const [scheduleMaintenanceModalOpen, setScheduleMaintenanceModalOpen] = useState<boolean>(false);
  const [viewMaintenanceHistoryModalOpen, setViewMaintenanceHistoryModalOpen] = useState<boolean>(false);

  // LD5: Create useEffect to fetch vehicle data when component mounts or vehicleId changes
  useEffect(() => {
    const fetchVehicleData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (vehicleId) {
          const vehicleData = await getVehicleById(vehicleId);
          setVehicle(vehicleData);
        } else {
          setError('Vehicle ID is missing.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicle details.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [vehicleId]);

  // LD6: Create useEffect to fetch performance metrics when vehicle data is loaded
  useEffect(() => {
    const fetchPerformanceMetrics = async () => {
      if (vehicleId) {
        try {
          const metrics = await getVehiclePerformance(vehicleId);
          setPerformanceMetrics(metrics);
        } catch (err: any) {
          console.error('Failed to load performance metrics:', err);
        }
      }
    };

    if (vehicle) {
      fetchPerformanceMetrics();
    }
  }, [vehicle, vehicleId]);

  // LD7: Create useEffect to fetch maintenance history when vehicle data is loaded
  useEffect(() => {
    const fetchMaintenanceHistory = async () => {
      if (vehicleId) {
        try {
          const history = await getVehicleMaintenanceHistory(vehicleId);
          setMaintenanceHistory(history.maintenance);
        } catch (err: any) {
          console.error('Failed to load maintenance history:', err);
        }
      }
    };

    if (vehicle) {
      fetchMaintenanceHistory();
    }
  }, [vehicle, vehicleId]);

  // LD8: Implement handleEditVehicle function to navigate to edit page
  const handleEditVehicle = () => {
    if (vehicleId) {
      navigate(`${CARRIER_PORTAL_ROUTES.VEHICLE_DETAIL}/${vehicleId}/edit`);
    }
  };

  // LD9: Implement handleAssignDriver function to open driver assignment modal
  const handleAssignDriver = () => {
    setAssignDriverModalOpen(true);
  };

  // LD10: Implement handleScheduleMaintenance function to open maintenance scheduling modal
  const handleScheduleMaintenance = () => {
    setScheduleMaintenanceModalOpen(true);
  };

  // LD11: Implement handleViewMaintenanceHistory function to open maintenance history modal
  const handleViewMaintenanceHistory = () => {
    setViewMaintenanceHistoryModalOpen(true);
  };

  // LD12: Implement handleBackToFleet function to navigate back to fleet page
  const handleBackToFleet = () => {
    navigate(CARRIER_PORTAL_ROUTES.FLEET);
  };

  // LD13: Render MainLayout component as the page container
  return (
    <MainLayout>
      {/* LD14: Render PageHeader with vehicle information and back button */}
      <PageHeader
        title={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : 'Vehicle Details'}
        subtitle={vehicle ? `Vehicle ID: ${vehicle.vehicle_id}` : ''}
        breadcrumbItems={[
          { label: 'Fleet', href: CARRIER_PORTAL_ROUTES.FLEET },
          { label: vehicle ? vehicle.vehicle_id : 'Vehicle Details', href: '#' },
        ]}
        actions={[
          { label: 'Back to Fleet', onClick: handleBackToFleet },
        ]}
      />

      <PageContainer>
        {/* LD15: Render loading indicator when data is being fetched */}
        {loading && <LoadingIndicator fullPage />}

        {/* LD16: Render error alert if there was an error fetching data */}
        {error && (
          <ErrorContainer>
            <Alert severity="error" message={error} />
          </ErrorContainer>
        )}

        {/* LD17: Render TruckDetailCard with vehicle data and callback functions */}
        {vehicle && (
          <TruckDetailCard
            vehicle={vehicle}
            onEdit={handleEditVehicle}
            onAssignDriver={handleAssignDriver}
            onScheduleMaintenance={handleScheduleMaintenance}
            onViewHistory={handleViewMaintenanceHistory}
          />
        )}

        {/* LD18: Render modals for driver assignment and maintenance scheduling */}
        <Modal isOpen={assignDriverModalOpen} onClose={() => setAssignDriverModalOpen(false)} title="Assign Driver">
          <ModalContent>
            {/* Add content for assigning a driver here */}
            <p>Content for assigning a driver will go here.</p>
          </ModalContent>
          <ModalActions>
            <Button onClick={() => setAssignDriverModalOpen(false)}>Cancel</Button>
            <Button variant="primary">Assign</Button>
          </ModalActions>
        </Modal>

        <Modal isOpen={scheduleMaintenanceModalOpen} onClose={() => setScheduleMaintenanceModalOpen(false)} title="Schedule Maintenance">
          <ModalContent>
            {/* Add content for scheduling maintenance here */}
            <p>Content for scheduling maintenance will go here.</p>
          </ModalContent>
          <ModalActions>
            <Button onClick={() => setScheduleMaintenanceModalOpen(false)}>Cancel</Button>
            <Button variant="primary">Schedule</Button>
          </ModalActions>
        </Modal>

        <Modal isOpen={viewMaintenanceHistoryModalOpen} onClose={() => setViewMaintenanceHistoryModalOpen(false)} title="Maintenance History">
          <ModalContent>
            {/* Add content for viewing maintenance history here */}
            <p>Content for viewing maintenance history will go here.</p>
          </ModalContent>
          <ModalActions>
            <Button onClick={() => setViewMaintenanceHistoryModalOpen(false)}>Close</Button>
          </ModalActions>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
};

// IE3: Export the VehicleDetailPage component as the default export
export default VehicleDetailPage;